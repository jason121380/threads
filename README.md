# Threads Radar 🔍

> 台灣 Threads 社群聲量監測儀表板 — 即時追蹤關鍵字、分析輿情、監控 Apify 抓取費用

## 功能概覽

| 功能 | 說明 |
|------|------|
| 🔑 關鍵字管理 | 新增 / 編輯 / 刪除追蹤關鍵字，支援每日排程 |
| 🚀 即時抓取 | 透過 Apify Threads Search Scraper 抓取貼文 |
| 📊 趨勢分析 | 互動式折線圖，顯示各關鍵字每日提及趨勢 |
| 🏆 熱門排行 | TOP 5 貼文依按讚數排序 |
| 📝 貼文瀏覽 | 全文搜尋、關鍵字篩選、精確符合、排序（最新/按讚最多/回覆最多/轉發最多） |
| 🗄️ 封存 | 清除所有貼文（標記 `is_archived`，資料保留不刪除） |
| 💰 額度監控 | 即時顯示 Apify 帳戶餘額與執行費用 |
| 🗂️ 抓取紀錄 | 首頁顯示每個關鍵字最後抓取時間與貼文數 |

---

## 技術棧

- **前端**：React 18 + Recharts（Vite 建置）
- **後端**：Express 5（Node.js）
- **資料庫**：PostgreSQL（使用 `pg` 套件）
- **資料來源**：Apify Threads Search Scraper（Actor ID：`curious_coder/threads-search-scraper`）

---

## 資料庫 Schema

### `keywords`
```sql
CREATE TABLE keywords (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword          TEXT UNIQUE NOT NULL,
  sort_option      TEXT DEFAULT 'recent',   -- 'recent' | 'top'
  max_pages        INT DEFAULT 1,           -- 抓取深度（1頁≈20篇）
  enabled          BOOLEAN DEFAULT true,
  schedule_time    TEXT DEFAULT '09:00',    -- 每日排程時間 HH:MM
  schedule_enabled BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### `threads_posts`
```sql
CREATE TABLE threads_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id      TEXT UNIQUE NOT NULL,      -- Apify 回傳的貼文唯一 ID
  thread_url     TEXT,
  caption        TEXT,                      -- 貼文正文
  username       TEXT,
  full_name      TEXT,
  like_count     INT DEFAULT 0,
  comment_count  INT DEFAULT 0,
  repost_count   INT DEFAULT 0,
  quote_count    INT DEFAULT 0,
  keyword        TEXT,                      -- 觸發此貼文的搜尋關鍵字
  scraped_at     TIMESTAMPTZ DEFAULT now(), -- 抓取時間
  post_timestamp TIMESTAMPTZ,              -- 原始發文時間（Apify takenAtISO）
  is_archived    BOOLEAN DEFAULT false      -- 封存標記（不刪除只隱藏）
);
```

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/health` | 健康檢查（server + DB 狀態） |
| POST | `/api/verify-token` | 驗證 Apify Token |
| POST | `/api/usage` | 取得 Apify 帳戶額度資訊 |
| POST | `/api/scrape` | 單一關鍵字抓取 |
| POST | `/api/scrape-all` | 批次抓取所有啟用關鍵字 |
| GET | `/api/posts` | 讀取所有未封存貼文（支援 `?keyword=` `?limit=`） |
| POST | `/api/posts/archive-all` | 封存貼文（`is_archived = true`） |
| GET | `/api/scrape-history` | 每個關鍵字的最後抓取時間與貼文數 |
| GET | `/api/keywords` | 取得所有關鍵字 |
| POST | `/api/keywords` | 新增關鍵字 |
| PUT | `/api/keywords/:id` | 更新關鍵字 |
| DELETE | `/api/keywords/:id` | 刪除關鍵字（同時刪除相關貼文） |

---

## 環境變數

`.env` 檔案（**不得上傳至 GitHub**）：

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxx
```

> `APIFY_TOKEN` 在前端 localStorage 也會儲存一份，用於驗證與抓取

---

## 啟動方式

```bash
# 安裝依賴
npm install

# 同時啟動前端（:5173）+ 後端（:3001）
npm run dev:all

# 分開啟動
npm run dev     # Vite 前端
npm run server  # Express 後端
```

port 衝突時清除：
```bash
kill -9 $(lsof -t -i:3001 -i:5173) 2>/dev/null
```

---

## Apify 欄位映射說明

Apify 回傳 **camelCase** 格式，映射至資料庫如下：

| Apify 欄位 | DB 欄位 | 說明 |
|---|---|---|
| `id` | `thread_id` | 貼文唯一 ID |
| `url` / `postUrl` | `thread_url` | 貼文連結 |
| `text` / `caption` / `description` | `caption` | 貼文正文 |
| `author.username` | `username` | 用戶名 |
| `author.name` / `displayName` | `full_name` | 顯示名稱 |
| `likeCount` / `likesCount` | `like_count` | 按讚數 |
| `commentCount` / `repliesCount` | `comment_count` | 回覆數 |
| `repostCount` / `repostsCount` | `repost_count` | 轉發數 |
| `quoteCount` / `quotesCount` | `quote_count` | 引用數 |
| `takenAtISO` / `timestamp` | `post_timestamp` | 原始發文時間 |

---

## 重要行為說明

- **精確符合**：前端過濾，只顯示 `caption` 包含關鍵字的貼文（Threads 搜尋為演算法相關性，非精確文字比對）
- **封存 vs 刪除**：`清除所有` 只設 `is_archived = true`，資料永久保留
- **重整後資料保留**：貼文、關鍵字、抓取紀錄、Token 驗證狀態均在重整後自動還原
- **重複關鍵字**：後端回傳 `23505 UNIQUE violation`，前端行內顯示錯誤，表單不關閉

---

## 部署

目前為本地端開發模式。建議部署平台：[Zeabur](https://zeabur.com)（支援 Node.js + PostgreSQL 自動綁定）。

Repository: https://github.com/jason121380/threads
