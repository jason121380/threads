import 'dotenv/config';
import express from "express";
import cors from "cors";
import pg from "pg";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// ─── 資料庫設定 ───
const { Pool } = pg;
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  // 伺服器啟動時自動建立資料表
  pool.query(`
    CREATE TABLE IF NOT EXISTS keywords (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      keyword TEXT UNIQUE NOT NULL,
      sort_option TEXT DEFAULT 'recent',
      max_pages INT DEFAULT 1,
      enabled BOOLEAN DEFAULT true,
      schedule_time TEXT DEFAULT '09:00',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE keywords ADD COLUMN IF NOT EXISTS schedule_time TEXT DEFAULT '09:00';
    ALTER TABLE keywords ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT true;

    CREATE TABLE IF NOT EXISTS threads_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id TEXT UNIQUE NOT NULL,
      thread_url TEXT,
      caption TEXT,
      username TEXT,
      full_name TEXT,
      like_count INT DEFAULT 0,
      comment_count INT DEFAULT 0,
      repost_count INT DEFAULT 0,
      quote_count INT DEFAULT 0,
      keyword TEXT,
      scraped_at TIMESTAMPTZ DEFAULT now(),
      post_timestamp TIMESTAMPTZ,
      is_archived BOOLEAN DEFAULT false
    );
    ALTER TABLE threads_posts ADD COLUMN IF NOT EXISTS post_timestamp TIMESTAMPTZ;
    ALTER TABLE threads_posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
  `).then(() => {
    console.log("[DB] PostgreSQL 連線成功，基本資料表結構已確認");
  }).catch(err => {
    console.error("[DB] 初始化資料表失敗:", err);
  });
} else {
  console.log("[DB] 未偵測到 DATABASE_URL，資料庫持久化功能暫停使用");
}

const ACTOR_ID = "FP43CZrdHtiSNn4SY";

// ─── 共用 Helper: 儲存貼文至資料庫 ───
async function savePostsToDB(posts) {
  if (!pool || posts.length === 0) return;
  
  const client = await pool.connect();
  try {
    // 批次寫入 (upsert based on thread_id)
    for (const post of posts) {
      await client.query(`
        INSERT INTO threads_posts 
        (thread_id, thread_url, caption, username, full_name, like_count, comment_count, repost_count, quote_count, keyword, post_timestamp, scraped_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
        ON CONFLICT (thread_id) DO UPDATE SET 
          like_count = EXCLUDED.like_count,
          comment_count = EXCLUDED.comment_count,
          repost_count = EXCLUDED.repost_count,
          scraped_at = now();
      `, [
        post.id, 
        post.thread_url, 
        post.caption, 
        post.user.username, 
        post.user.full_name,
        post.like_count, 
        post.comment_count, 
        post.repost_count, 
        post.quote_count,
        post.keyword,
        post.timestamp || null
      ]);
    }
    console.log(`[DB] 成功儲存 ${posts.length} 筆貼文`);
  } catch (err) {
    console.error(`[DB] 存檔失敗:`, err);
  } finally {
    client.release();
  }
}

// ─── 執行 Apify Actor 搜尋單一關鍵字 ───
app.post("/api/scrape", async (req, res) => {
  const { token, keyword, sort = "recent", maxPages = 5 } = req.body;

  if (!token) return res.status(400).json({ error: "缺少 Apify API Token" });
  if (!keyword) return res.status(400).json({ error: "缺少關鍵字" });

  try {
    console.log(`[Scrape] 開始抓取關鍵字: "${keyword}" (sort=${sort}, maxPages=${maxPages})`);

    // 1. 啟動 Actor Run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQuery: keyword,
          sort,
          maxPages,
        }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error(`[Scrape] Actor 啟動失敗:`, err);
      return res.status(runRes.status).json({ error: `Apify API 錯誤: ${runRes.status}`, detail: err });
    }

    const run = await runRes.json();
    const runId = run.data?.id;
    const datasetId = run.data?.defaultDatasetId;

    console.log(`[Scrape] Actor Run 已啟動 - runId: ${runId}`);

    // 2. Polling 等待完成 (最多 5 分鐘)
    const maxWait = 5 * 60 * 1000;
    const startTime = Date.now();
    let status = "RUNNING";

    while (status === "RUNNING" || status === "READY") {
      if (Date.now() - startTime > maxWait) {
        return res.status(408).json({ error: "抓取逾時，請稍後再試" });
      }
      await new Promise((r) => setTimeout(r, 3000));

      const checkRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
      );
      const checkData = await checkRes.json();
      status = checkData.data?.status;
      console.log(`[Scrape] Polling 狀態: ${status}`);
    }

    if (status !== "SUCCEEDED") {
      return res.status(500).json({ error: `Actor 執行失敗，狀態: ${status}` });
    }

    // 3. 取得 Dataset 結果
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json`
    );
    const posts = await dataRes.json();

    console.log(`[Scrape] 成功，取回 ${posts.length} 則貼文`);
    if (posts.length > 0) {
      console.log("[Scrape] 第一筆原始欄位:", JSON.stringify(Object.keys(posts[0])));
      console.log("[Scrape] 第一筆原始資料:", JSON.stringify(posts[0], null, 2));
    }

    // 4. 正規化資料格式（支援 Apify camelCase 欄位）
    const normalizedPosts = posts.map((p, i) => {
      // ID：嘗試所有可能欄位
      const postId = p.id?.toString() || p.postId?.toString() || p.threadId?.toString()
        || p.mediaId?.toString() || p.pk?.toString() || p.thread_id || p.post_id
        || `post-${Date.now()}-${i}`;

      // 時間：优先用 takenAtISO，fallback unix timestamp
      const timestamp = p.takenAtISO || p.takenAt_iso
        || (p.takenAt ? new Date(p.takenAt * 1000).toISOString() : null)
        || p.timestamp || p.created_at || p.posted_at || new Date().toISOString();

      // 內文：camelCase 優先
      const caption = p.text || p.captionText || p.postText || p.threadText
        || p.caption || p.text_content || p.content || p.body || p.description || "";

      // URL
      const thread_url = p.url || p.postUrl || p.threadUrl || p.link || p.thread_url || "";

      // 用戶名
      const username = p.username || p.ownerUsername || p.authorUsername
        || p.user?.username || p.author?.username || "unknown";

      return {
        id: postId,
        thread_url,
        caption,
        user: {
          username,
          full_name: p.displayName || p.fullName || p.userFullName
            || p.user?.full_name || p.full_name || p.author?.full_name || "",
          is_verified: p.isVerified ?? p.verified ?? p.user?.is_verified ?? false,
          profile_pic_url: p.profilePicUrl || p.avatarUrl
            || p.user?.profile_pic_url || p.profile_pic_url || "",
        },
        like_count: p.likeCount ?? p.like_count ?? p.likes ?? 0,
        comment_count: p.directReplyCount ?? p.replyCount ?? p.comment_count ?? p.commentCount ?? 0,
        repost_count: p.repostCount ?? p.reshareCount ?? p.repost_count ?? p.reposts ?? 0,
        quote_count: p.quoteCount ?? p.quote_count ?? p.quotes ?? 0,
        timestamp,
        keyword,
      };
    });

    // [新增] 非同步寫入資料庫
    savePostsToDB(normalizedPosts).catch(console.error);

    res.json({
      success: true,
      keyword,
      postCount: normalizedPosts.length,
      posts: normalizedPosts,
      runId,
    });
  } catch (err) {
    console.error(`[Scrape] 錯誤:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 批次執行多組關鍵字 ───
app.post("/api/scrape-all", async (req, res) => {
  const { token, keywords } = req.body;
  // keywords: [{ keyword, sort, maxPages }]

  if (!token) return res.status(400).json({ error: "缺少 Apify API Token" });
  if (!keywords?.length) return res.status(400).json({ error: "缺少關鍵字清單" });

  // 使用 SSE 回傳進度
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const allPosts = [];
  const logs = [];

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    res.write(`data: ${JSON.stringify({ type: "progress", current: i + 1, total: keywords.length, keyword: kw.keyword })}\n\n`);

    try {
      // 啟動 Actor
      const runRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQuery: kw.keyword,
            sort: kw.sort || "recent",
            maxPages: kw.maxPages || 5,
          }),
        }
      );

      if (!runRes.ok) {
        logs.push({ keyword: kw.keyword, status: "failed", error: `HTTP ${runRes.status}` });
        continue;
      }

      const run = await runRes.json();
      const runId = run.data?.id;
      const datasetId = run.data?.defaultDatasetId;

      // Polling
      const maxWait = 5 * 60 * 1000;
      const startTime = Date.now();
      let status = "RUNNING";

      while (status === "RUNNING" || status === "READY") {
        if (Date.now() - startTime > maxWait) {
          logs.push({ keyword: kw.keyword, status: "timeout" });
          break;
        }
        await new Promise((r) => setTimeout(r, 3000));
        const checkRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
        );
        const checkData = await checkRes.json();
        status = checkData.data?.status;
      }

      if (status !== "SUCCEEDED") {
        logs.push({ keyword: kw.keyword, status: "failed", error: `最終狀態: ${status}` });
        continue;
      }

      // 取得結果
      const dataRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json`
      );
      const posts = await dataRes.json();

      const normalizedPosts = posts.map((p, idx) => ({
        id: p.thread_id || p.post_id || p.id || `post-${Date.now()}-${idx}`,
        thread_url: p.thread_url || p.url || p.link || "",
        caption: p.caption || p.text_content || p.text || p.content || p.body || p.description || p.post_text || "",
        user: {
          username: p.user?.username || p.username || p.author?.username || p.owner?.username || "unknown",
          full_name: p.user?.full_name || p.full_name || p.author?.full_name || p.display_name || "",
          is_verified: p.user?.is_verified || p.is_verified || p.author?.is_verified || false,
          profile_pic_url: p.user?.profile_pic_url || p.profile_pic_url || p.author?.profile_pic_url || "",
        },
        like_count: p.like_count ?? p.likes ?? p.likeCount ?? 0,
        comment_count: p.comment_count ?? p.comments ?? p.commentCount ?? p.reply_count ?? 0,
        repost_count: p.repost_count ?? p.reposts ?? p.repostCount ?? p.share_count ?? 0,
        quote_count: p.quote_count ?? p.quotes ?? p.quoteCount ?? 0,
        timestamp: p.timestamp || p.created_at || p.posted_at || p.taken_at || p.date || new Date().toISOString(),
        keyword: kw.keyword,
      }));

      // [新增] 非同步寫入資料庫
      savePostsToDB(normalizedPosts).catch(console.error);

      allPosts.push(...normalizedPosts);
      logs.push({ keyword: kw.keyword, status: "success", postCount: normalizedPosts.length, runId });

      res.write(`data: ${JSON.stringify({ type: "keyword_done", keyword: kw.keyword, postCount: normalizedPosts.length })}\n\n`);
    } catch (err) {
      logs.push({ keyword: kw.keyword, status: "failed", error: err.message });
    }
  }

  // [新增] 回傳前進行去重，避免多個關鍵字搜到同一篇貼文
  const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());

  res.write(`data: ${JSON.stringify({ type: "done", totalPosts: uniquePosts.length, posts: uniquePosts, logs })}\n\n`);
  res.end();
});

// ─── 健康檢查 ───
app.get("/api/health", async (req, res) => {
  let dbConnected = false;
  if (pool) {
    try {
      const client = await pool.connect();
      dbConnected = true;
      client.release();
    } catch (err) {
      console.error("[Health] DB 連線失敗:", err);
      dbConnected = false;
    }
  }
  
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    db: dbConnected ? "connected" : "disconnected"
  });
});

// ─── 驗證 Token ───
app.post("/api/verify-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "缺少 Token" });

  try {
    const checkRes = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
    if (!checkRes.ok) {
      return res.json({ valid: false, error: "Token 無效" });
    }
    const userData = await checkRes.json();
    res.json({
      valid: true,
      user: {
        username: userData.data?.username,
        plan: userData.data?.plan?.name,
      },
    });
  } catch (err) {
    res.json({ valid: false, error: err.message });
  }
});

// ─── Apify 額度使用量 ───
app.post("/api/usage", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "缺少 Token" });

  try {
    // 1. 帳戶基本資訊
    const userRes = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: "無法取得帳戶資訊" });
    }
    const userData = await userRes.json();
    const user = userData.data;

    // 2. 帳戶限額 + 目前用量（官方 /users/me/limits 同時包含 limits 和 current）
    const limitsRes = await fetch(`https://api.apify.com/v2/users/me/limits?token=${token}`);
    let accountLimits = null;
    if (limitsRes.ok) {
      const limitsData = await limitsRes.json();
      accountLimits = limitsData.data;
    }

    console.log("[Usage] /users/me/limits 回傳:", JSON.stringify(accountLimits, null, 2));

    // 3. 最近的 Actor Runs（最近 20 筆）
    const runsRes = await fetch(
      `https://api.apify.com/v2/actor-runs?token=${token}&limit=20&desc=true`
    );
    let recentRuns = [];
    if (runsRes.ok) {
      const runsData = await runsRes.json();
      recentRuns = (runsData.data?.items || []).map(run => ({
        id: run.id,
        actorId: run.actId,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        usageTotalUsd: run.usageTotalUsd || 0,
        durationSecs: run.stats?.durationMillis
          ? Math.round(run.stats.durationMillis / 1000)
          : null,
        computeUnits: run.stats?.computeUnits || 0,
      }));
    }

    // 4. 組合回傳資料 — 根據 Apify 官方文件結構
    // /users/me/limits 回傳: { limits: { maxMonthlyUsageUsd, ... }, current: { monthlyUsageUsd, ... } }
    const totalRunCost = recentRuns.reduce((sum, r) => sum + (r.usageTotalUsd || 0), 0);
    const planName = user.subscription?.plan?.name || user.plan?.name || "Free";

    // 目前月用量（從 /limits 的 current 取）
    const usageUsd = accountLimits?.current?.monthlyUsageUsd ?? null;
    // 月上限（從 /limits 的 limits 取）
    const limitUsd = accountLimits?.limits?.maxMonthlyUsageUsd ?? null;

    res.json({
      success: true,
      account: {
        username: user.username,
        email: user.email,
        plan: planName,
      },
      usage: {
        monthlyUsageUsd: usageUsd,
        monthlyLimitUsd: limitUsd,
        recentRunsCost: Math.round(totalRunCost * 10000) / 10000,
        recentRunsCount: recentRuns.length,
      },
      limits: {
        maxMemoryMbytes: accountLimits?.limits?.maxActorMemoryGbytes
          ? accountLimits.limits.maxActorMemoryGbytes * 1024
          : null,
        dataRetentionDays: accountLimits?.limits?.dataRetentionDays ?? null,
      },
      _raw: { accountLimits },
      recentRuns: recentRuns.slice(0, 10),
    });
  } catch (err) {
    console.error("[Usage] 錯誤:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 貼文讀取 API ───
app.get("/api/posts", async (req, res) => {
  if (!pool) return res.json({ success: true, posts: [] });
  try {
    const { keyword, limit = 500 } = req.query;
    // 使用 DISTINCT ON (thread_id) 確保回傳內容絕對不重複，並內建排序邏輯
    let query = `
      SELECT * FROM (
        SELECT DISTINCT ON (thread_id) * 
        FROM threads_posts 
        WHERE is_archived = false
        ${keyword && keyword !== "全部" ? "AND keyword = $2" : ""}
        ORDER BY thread_id, scraped_at DESC
      ) t
      ORDER BY post_timestamp DESC NULLS LAST, scraped_at DESC
      LIMIT $1
    `;
    const params = [parseInt(limit)];
    if (keyword && keyword !== "全部") params.push(keyword);
    
    const result = await pool.query(query, params);
    // 正規化回前端格式
    const posts = result.rows.map(row => ({
      id: row.thread_id,
      thread_url: row.thread_url,
      caption: row.caption,
      user: {
        username: row.username,
        full_name: row.full_name || "",
        is_verified: false,
        profile_pic_url: "",
      },
      like_count: row.like_count || 0,
      comment_count: row.comment_count || 0,
      repost_count: row.repost_count || 0,
      quote_count: row.quote_count || 0,
      timestamp: row.post_timestamp || row.scraped_at,
      keyword: row.keyword,
    }));
    res.json({ success: true, posts });
  } catch (err) {
    console.error("[Posts] 取得失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Archive 所有貼文 ───
app.post("/api/posts/archive-all", async (req, res) => {
  if (!pool) return res.json({ success: true, archived: 0 });
  try {
    const { keyword } = req.body;
    let query = "UPDATE threads_posts SET is_archived = true WHERE is_archived = false";
    const params = [];
    if (keyword && keyword !== "全部") {
      query += " AND keyword = $1";
      params.push(keyword);
    }
    query += " RETURNING id";
    const result = await pool.query(query, params);
    res.json({ success: true, archived: result.rowCount });
  } catch (err) {
    console.error("[Archive] 失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 抓取紀錄 API ───
app.get("/api/scrape-history", async (req, res) => {
  if (!pool) return res.json({ success: true, history: [] });
  try {
    const result = await pool.query(`
      SELECT keyword,
             COUNT(*) FILTER (WHERE caption != '') as post_count,
             MAX(scraped_at) as last_scraped
      FROM threads_posts
      GROUP BY keyword
      ORDER BY last_scraped DESC
      LIMIT 20
    `);
    const history = result.rows.map(row => ({
      keyword: row.keyword,
      postCount: parseInt(row.post_count),
      time: new Date(row.last_scraped).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status: "success",
    }));
    res.json({ success: true, history });
  } catch (err) {
    console.error("[ScrapeHistory] 取得失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 關鍵字管理 API (針對資料庫) ───
app.get("/api/keywords", async (req, res) => {
  if (!pool) return res.json({ success: true, keywords: [] });
  try {
    const result = await pool.query("SELECT * FROM keywords ORDER BY created_at ASC");
    // 將蛇形命名轉換為小駝峰，以符合前端使用習慣
    const keys = result.rows.map(row => ({
      id: row.id,
      keyword: row.keyword,
      sort: row.sort_option,
      maxPages: row.max_pages,
      enabled: row.enabled,
      scheduleTime: row.schedule_time,
      scheduleEnabled: row.schedule_enabled ?? true,
      createdAt: row.created_at
    }));
    res.json({ success: true, keywords: keys });
  } catch (err) {
    console.error("[Keywords] 取得失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/keywords", async (req, res) => {
  if (!pool) return res.status(400).json({ error: "尚未連接資料庫" });
  const { keyword, sort_option = "recent", max_pages = 1, enabled = true, schedule_time = "09:00", schedule_enabled = false } = req.body;
  if (!keyword) return res.status(400).json({ error: "缺少 keyword" });
  try {
    const result = await pool.query(
      "INSERT INTO keywords (keyword, sort_option, max_pages, enabled, schedule_time, schedule_enabled) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [keyword, sort_option, max_pages, enabled, schedule_time, schedule_enabled]
    );
    res.json({ success: true, keyword: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
       return res.status(400).json({ error: `關鍵字 '${keyword}' 已存在`});
    }
    console.error("[Keywords] 新增失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/keywords/:keywordId", async (req, res) => {
  if (!pool) return res.status(400).json({ error: "尚未連接資料庫" });
  const { keywordId } = req.params;
  const { keyword, sort_option, max_pages, schedule_time, schedule_enabled } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE keywords 
       SET keyword = COALESCE($1, keyword), 
           sort_option = COALESCE($2, sort_option), 
           max_pages = COALESCE($3, max_pages), 
           schedule_time = COALESCE($4, schedule_time),
           schedule_enabled = COALESCE($5, schedule_enabled)
       WHERE id = $6 RETURNING *`,
      [keyword, sort_option, max_pages, schedule_time, schedule_enabled, keywordId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "找不到該關鍵字" });
    }
    res.json({ success: true, keyword: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
       return res.status(400).json({ error: `關鍵字 '${keyword}' 已存在`});
    }
    console.error("[Keywords] 更新失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/keywords/:keywordId", async (req, res) => {
  if (!pool) return res.status(400).json({ error: "尚未連接資料庫" });
  const { keywordId } = req.params;
  try {
    await pool.query("DELETE FROM keywords WHERE id = $1", [keywordId]);
    res.json({ success: true });
  } catch (err) {
    console.error("[Keywords] 刪除失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 生產模式：serve 前端 build ───
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Threads Radar API Server`);
  console.log(`  ➜ http://localhost:${PORT}`);
  console.log(`  ➜ POST /api/scrape        (單一關鍵字抓取)`);
  console.log(`  ➜ POST /api/scrape-all     (批次抓取)`);
  console.log(`  ➜ POST /api/verify-token   (驗證 Token)`);
  console.log(`  ➜ POST /api/usage          (額度監控)`);
  console.log(`  ➜ GET  /api/health         (健康檢查)\n`);
});
