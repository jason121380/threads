# MEMORY.md — 開發紀錄與決策歷史

> 記錄每次重要的修改、已解決的問題、以及未來待辦。

---

## 版本歷程

### 2026-03-29（本次 Session）

#### ✅ 已解決：貼文內容空白（最重要的修復）
- **問題**：資料庫存了 97 筆貼文，但 49 筆 caption 全空白
- **根因**：Apify 回傳 camelCase（`likeCount`, `text`, `takenAtISO`），但原本的 normalizedPosts 預期 snake_case（`like_count`），導致欄位全 undefined
- **修復**：在 `server/index.js` 的 `normalizedPosts` 加多層 fallback 映射

#### ✅ 已解決：重整後貼文消失
- **問題**：貼文只存在 React state，重整後清空
- **修復**：
  1. 後端加 `GET /api/posts`（過濾 `is_archived = false`）
  2. 前端 `useEffect` 加 `fetchPosts()`

#### ✅ 已解決：重整後 Token 需重新驗證
- **問題**：`tokenStatus` state 重整後 reset，顯示「待驗證」
- **修復**：`useEffect` 啟動時若 localStorage 有 token，自動靜默驗證 + 載入額度

#### ✅ 已解決：抓取紀錄重整後消失
- **問題**：`scrapeLog` 是 in-memory state
- **修復**：
  1. 後端加 `GET /api/scrape-history`（從 threads_posts GROUP BY keyword）
  2. 前端加 `fetchScrapeHistory()`

#### ✅ 已解決：時間顯示為「抓取時間」而非「發文時間」
- **問題**：GET /api/posts 回傳 `scraped_at`（抓取時間）
- **修復**：
  1. DB 加 `post_timestamp` 欄位
  2. savePostsToDB 存 `takenAtISO`
  3. GET /api/posts 回傳 `post_timestamp || scraped_at`

#### ✅ 已解決：新增關鍵字表單「跳掉」
- **問題**：`setShowAddForm(false)` 在 try/catch 外，不管成功失敗都關閉；alert 被瀏覽器攔截時靜默失敗
- **修復**：改為只在成功時關閉，失敗改用行內 `addKeywordError` state 顯示，不再使用 `alert()`

#### ✅ 新功能：貼文排序
- 新增 `postSort` state：`newest | likes | replies | reposts`
- 貼文計數列右側加排序按鈕群（最新 / 🤍按讚最多 / 💬回覆最多 / 🔄轉發最多）

#### ✅ 新功能：精確符合過濾
- 新增 `strictKeywordFilter` boolean state
- 選定特定關鍵字時出現「🎯 精確符合」按鈕
- 開啟後只顯示 caption 包含該關鍵字的貼文

#### ✅ 新功能：封存貼文（清除所有）
- DB 加 `is_archived BOOLEAN DEFAULT false` 欄位
- 後端加 `POST /api/posts/archive-all`
- 前端加 `🗄️ 清除所有` 按鈕 + 確認 Modal
- **不刪除資料**，只標記隱藏

#### ✅ UI 修正：移除無用大頭貼
- Apify 不提供 `profile_pic_url`，移除橘色佔位圓圈
- PostCard header 只顯示 `@username`

#### ✅ UI 修正：過濾空白貼文
- `filteredPosts` 末尾加 `.filter(p => p.caption?.trim())`
- 空白 caption 貼文不顯示在列表（含熱門排行 TOP 5）

#### ✅ 金額格式化
- 所有 USD 金額強制 `.toFixed(2)`，確保顯示如 `$6.69` 而非 `$6.685`

#### ✅ 刪除確認 Modal
- 移除 `window.confirm`（可能被攔截、閃爍）
- 改為自訂 React Modal，包含刪除按鈕與取消按鈕

---

## 資料庫現況（2026-03-29）

```sql
-- threads_posts 欄位
id, thread_id, thread_url, caption, username, full_name,
like_count, comment_count, repost_count, quote_count,
keyword, scraped_at, post_timestamp, is_archived

-- 資料量（約）
總計：97 筆（修復前 49 筆空白，修復後新增 48 筆有內容）
```

---

## 待辦（Next Steps）

| 優先級 | 項目 | 說明 |
|--------|------|------|
| 🔴 高 | 後端排程 | 用 `node-cron` 依 `schedule_time` 自動觸發抓取 |
| 🟡 中 | 情感分析 | 用 AI 判斷貼文正負評 |
| 🟡 中 | 匯出功能 | 匯出 CSV / Excel |
| 🟢 低 | Zeabur 部署 | 目前只在本地，需部署上線 |
| 🟢 低 | 通知機制 | 定時摘要發到 LINE / Email |

---

## 架構決策紀錄（ADR）

### ADR-001：單一大元件 vs 元件拆分
**決定**：維持單檔 `threads-dashboard.jsx`  
**理由**：快速迭代階段，避免跨檔 state 傳遞複雜度

### ADR-002：inline style vs CSS Module
**決定**：全用 inline style + COLORS 常數  
**理由**：不需要 CSS 檔案，方便 AI 直接修改

### ADR-003：alert() vs 自訂 Modal
**決定**：全部改為自訂 Modal 或行內錯誤顯示  
**理由**：`alert()` 在某些瀏覽器環境會被攔截，導致靜默失敗

### ADR-004：Apify SDK vs REST API
**決定**：使用 REST API（fetch）  
**理由**：避免額外依賴，降低複雜度

### ADR-005：刪除 vs 封存
**決定**：清除貼文使用 `is_archived = true`  
**理由**：保留資料供日後分析，符合資料治理原則

---

## Apify Actor 資訊

- **Actor ID**：`curious_coder/threads-search-scraper`
- **Input Schema**：`{ queries: [string], sort: "recent"|"top", resultsPerPage: number }`
- **Output 欄位**（camelCase）：`id, url, text, author.username, author.name, likeCount, commentCount, repostCount, quoteCount, takenAtISO`
- **費用**：約 $0.30 / 1000 Compute Units（Starter Plan $29/月）

---

## 開發環境

- **OS**：macOS（Apple Silicon）
- **Node**：v22+（ESM 模組）
- **Package manager**：npm
- **前端**：http://localhost:5173
- **後端**：http://localhost:3001
- **DB**：PostgreSQL（Zeabur 托管 or 本地）
