# CLAUDE.md — Threads Radar 專案 AI 工作指南

> 給 Claude 的詳細操作說明。每次開始工作前必讀。

---

## 專案定位

**Threads Radar** 是一個針對台灣 Threads 用戶的社群聲量監測工具，讓用戶追蹤特定關鍵字的貼文表現、費用管控、以及輿情分析。

---

## 檔案結構

```
/threads
├── threads-dashboard.jsx   ← 前端核心（單一 React 元件，~1800 行）
├── server/index.js         ← Express 後端（API + DB + Apify 呼叫）
├── src/main.jsx            ← React 入口點
├── index.html              ← Vite HTML 範本
├── vite.config.js          ← Vite 設定（proxy /api → :3001）
├── package.json            ← 依賴與 scripts
├── .env                    ← DATABASE_URL + APIFY_TOKEN（勿 commit）
├── .gitignore              ← node_modules, .env, dist
└── README.md               ← 完整技術文件
```

---

## 核心技術決策

### 前端
- **單檔元件**：全部邏輯在 `threads-dashboard.jsx` 一個檔案
- **無 CSS 框架**：全部用 inline style + COLORS 常數物件
- **顏色系統**：頂部 `const COLORS = { orange500, gray900, ... }` 統一管理
- **Icon 系統**：SVG inline，集中在 `const Icons = {}` 物件
- **State 管理**：useState 全部在元件頂層，無 Redux/Zustand
- **無 UI 庫**：無 shadcn、MUI 等，全自製元件

### 後端
- **單檔伺服器**：`server/index.js` 包含所有 API
- **DB 連線**：啟動時建立 `pg.Pool`，無 ORM
- **Schema 初始化**：伺服器啟動時 `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- **Apify 呼叫**：透過 REST API（非 SDK），Actor ID = `curious_coder/threads-search-scraper`

---

## 資料流

```
用戶輸入關鍵字
    ↓
POST /api/scrape → 呼叫 Apify → 等待 Actor 完成
    ↓
抓取 Dataset → normalizedPosts（camelCase → snake_case 轉換）
    ↓
savePostsToDB() → INSERT INTO threads_posts (ON CONFLICT DO UPDATE)
    ↓
前端 setPosts() 更新畫面
    ↓
重整後 → GET /api/posts 自動從 DB 載入
```

---

## 關鍵 State（threads-dashboard.jsx 頂部）

```js
const [posts, setPosts]                         // 所有貼文
const [keywords, setKeywords]                   // 關鍵字列表
const [scrapeLog, setScrapeLog]                 // 首頁抓取軌跡
const [selectedKeyword, setSelectedKeyword]     // 貼文頁篩選
const [searchQuery, setSearchQuery]             // 文字搜尋
const [postSort, setPostSort]                   // newest|likes|replies|reposts
const [strictKeywordFilter, setStrictKeywordFilter] // 精確符合開關
const [confirmArchive, setConfirmArchive]       // 封存確認 Modal
const [confirmDeleteTarget, setConfirmDeleteTarget] // 刪除關鍵字 Modal
const [addKeywordError, setAddKeywordError]     // 新增關鍵字行內錯誤
const [tokenStatus, setTokenStatus]             // Apify Token 驗證結果
const [usageData, setUsageData]                 // Apify 額度資料
const [apifyToken, setApifyToken]               // 從 localStorage 載入
```

---

## useEffect 初始化流程（頁面載入時）

1. `checkApiHealth()` — 每 30 秒輪詢後端健康狀態
2. `fetchKeywords()` — 從 DB 載入所有關鍵字
3. `fetchPosts()` — 從 DB 載入最近 500 筆未封存貼文
4. `fetchScrapeHistory()` — 從 DB 載入抓取軌跡
5. localStorage `APIFY_TOKEN` 存在 → 自動靜默驗證 + 載入額度

---

## API 端點速查

| 動作 | 端點 |
|------|------|
| 健康檢查 | GET `/api/health` |
| 驗證 Token | POST `/api/verify-token` `{ token }` |
| 取得額度 | POST `/api/usage` `{ token }` |
| 抓取單一關鍵字 | POST `/api/scrape` `{ token, keyword, sort, maxPages }` |
| 批次抓取 | POST `/api/scrape-all` `{ token, keywords[] }` |
| 讀取貼文 | GET `/api/posts?keyword=&limit=500` |
| 封存貼文 | POST `/api/posts/archive-all` `{ keyword }` |
| 抓取紀錄 | GET `/api/scrape-history` |
| 列出關鍵字 | GET `/api/keywords` |
| 新增關鍵字 | POST `/api/keywords` |
| 更新關鍵字 | PUT `/api/keywords/:id` |
| 刪除關鍵字 | DELETE `/api/keywords/:id` |

---

## 重要已知行為

### Apify 欄位映射
Apify 回傳 camelCase，normalizedPosts 做多層 fallback：
```js
caption: p.text || p.caption || p.description || p.content || ""
username: p.author?.username || p.username || ""
like_count: p.likeCount || p.likesCount || p.like_count || 0
timestamp: p.takenAtISO || p.timestamp || p.createdAt || null
```

### 封存 vs 刪除
- `清除所有` → `UPDATE threads_posts SET is_archived = true`
- GET /api/posts → `WHERE is_archived = false`（已封存不回傳）
- 資料永遠在 DB，不會真刪除

### 新增關鍵字錯誤處理
- 成功 → 表單關閉，關鍵字加入清單
- 失敗（重複/DB錯誤）→ 表單**不關閉**，行內顯示 `⚠️ 錯誤訊息`
- **不使用 `alert()`**，所有錯誤走行內顯示

### 排序篩選
```js
filteredPosts = posts
  .filter(matchKw && matchSearch)
  .sort(by postSort)
  .filter(caption.trim() !== "")  // 過濾空白貼文
  .filter(strictKeywordFilter → caption.includes(keyword))
```

---

## 已知限制

1. **Threads 搜尋非精確**：Apify 使用 Threads 原生搜尋 API，「熱門」排序特別會回傳相關但不包含關鍵字的貼文
2. **大頭貼**：Apify 不提供 `profile_pic_url`，已移除頭像顯示
3. **排程**：前端 UI 有排程開關，但後端實際排程邏輯尚未實作（需 cron job）

---

## 啟動指令

```bash
# 正常啟動
npm run dev:all

# Port 衝突清除
kill -9 $(lsof -t -i:3001 -i:5173) 2>/dev/null
sleep 1 && npm run dev:all

# 直接查資料庫（debugging）
node --input-type=module << 'EOF'
import { config } from 'dotenv'; config();
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query('SELECT COUNT(*) FROM threads_posts WHERE is_archived = false');
console.log(r.rows[0]);
await pool.end();
EOF
```

---

## Git

```bash
# Remote
git remote add origin https://github.com/jason121380/threads.git

# Push
git add -A && git commit -m "..." && git push origin main
```

---

## 環境變數

```env
DATABASE_URL=postgresql://...
APIFY_TOKEN=apify_api_...         # 也存在前端 localStorage["APIFY_TOKEN"]
```
