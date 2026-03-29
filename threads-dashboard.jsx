import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── Mobile Detection Hook ───
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
};

// ─── Meimate Theme Constants ───
const COLORS = {
  orange100: "#FFF5F0",
  orange200: "#FFE8D9",
  orange400: "#FF8A56",
  orange500: "#FF6B2C",
  orange600: "#E55A1F",
  gray50: "#FAFAFA",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray900: "#111827",
  emerald: "#10B981",
  red: "#F87171",
  white: "#FFFFFF",
};

// ─── 預設關鍵字設定（非靜態資料，僅為初始設定） ───
const DEFAULT_KEYWORDS = [];


// ─── Icons (inline SVG) ───
const Icons = {
  Search: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  XMark: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  TrendUp: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Heart: () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  Comment: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Repost: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ExternalLink: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Verified: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={COLORS.orange500}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <circle cx="12" cy="12" r="10" fill={COLORS.orange500} opacity="0.15" />
      <path d="M9 12l2 2 4-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Database: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

// ─── Utility ───
const formatNum = (n) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + "萬";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分鐘前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小時前`;
  return `${Math.floor(hrs / 24)} 天前`;
};

// ─── Custom Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: COLORS.white, border: `1px solid ${COLORS.gray100}`,
      borderRadius: 12, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      fontFamily: "'Inter','Noto Sans TC',system-ui,sans-serif",
    }}>
      <div style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color, marginBottom: 2 }}>
          {p.name}: {formatNum(p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── Sidebar Nav Item ───
const SidebarNavItem = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 12, width: "100%",
    padding: "11px 16px", borderRadius: 10, fontSize: 14, fontWeight: active ? 700 : 500,
    border: "none", cursor: "pointer", transition: "all 0.2s",
    background: active ? COLORS.orange100 : "transparent",
    color: active ? COLORS.orange500 : COLORS.gray500,
    textAlign: "left",
  }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = COLORS.orange100; e.currentTarget.style.color = COLORS.orange500; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = COLORS.gray500; } }}
  >
    <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>
    <span>{label}</span>
  </button>
);



// ─── Stat Card ───
const StatCard = ({ label, value, sub, icon, color }) => (
  <div style={{
    background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
    padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", flex: 1, minWidth: 150,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 8, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: color || COLORS.gray900, lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.orange100, color: COLORS.orange500,
      }}>
        {icon}
      </div>
    </div>
  </div>
);

// ─── Post Card ───
const PostCard = ({ post }) => (
  <div style={{
    background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
    padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.2s",
    cursor: "pointer",
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.orange200; e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,107,44,0.08)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.gray100; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
  >
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900 }}>
              @{post.user.username}
            </span>
            {post.user.is_verified && <Icons.Verified />}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50,
          background: COLORS.orange100, color: COLORS.orange500,
        }}>
          {post.keyword}
        </span>
        <a href={post.thread_url} target="_blank" rel="noopener noreferrer"
          style={{ color: COLORS.gray400, display: "flex", padding: 4 }}
          onClick={e => e.stopPropagation()}>
          <Icons.ExternalLink />
        </a>
      </div>
    </div>

    {/* Content */}
    <p style={{
      fontSize: 15, lineHeight: 1.65, color: COLORS.gray900, margin: 0, marginBottom: 14,
      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
      wordBreak: "break-word",
    }}>
      {post.caption}
    </p>

    {/* Footer */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { icon: <Icons.Heart />, val: post.like_count, color: "#ef4444" },
          { icon: <Icons.Comment />, val: post.comment_count, color: COLORS.gray500 },
          { icon: <Icons.Repost />, val: post.repost_count, color: COLORS.orange500 },
        ].map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, color: m.color, fontSize: 13, fontWeight: 600 }}>
            {m.icon} {formatNum(m.val)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.gray400, fontSize: 12 }}>
        <Icons.Clock /> {timeAgo(post.timestamp)}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════
// ─── MAIN APP ───
// ═══════════════════════════════════════════
export default function ThreadsDashboard() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS);
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("全部");
  const [newKeyword, setNewKeyword] = useState("");
  const [newSort, setNewSort] = useState("recent");
  const [newMaxPages, setNewMaxPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addKeywordError, setAddKeywordError] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("09:00");
  const [newScheduleEnabled, setNewScheduleEnabled] = useState(false);
  const [postSort, setPostSort] = useState("likes"); // newest | likes | replies | reposts
  const [apifyToken, setApifyToken] = useState(() => localStorage.getItem("APIFY_TOKEN") || "");

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null); // { id, keyword }

  // ─── 儲存 Token 到 LocalStorage ───
  useEffect(() => {
    if (apifyToken) {
      localStorage.setItem("APIFY_TOKEN", apifyToken);
    } else {
      localStorage.removeItem("APIFY_TOKEN");
    }
  }, [apifyToken]);

  // ─── API 串接狀態 ───
  // 本地開發用 :3001，生產環境前後端同 port 用相對路徑
  const API_BASE = window.location.hostname === "localhost" ? "http://localhost:3001" : "";
  const [scraping, setScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(null);
  const [scrapeLog, setScrapeLog] = useState([]);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [scrapingSingle, setScrapingSingle] = useState(null);
  const [scrapeSingleProgress, setScrapeSingleProgress] = useState({});
  const [apiStatus, setApiStatus] = useState({ server: "checking", db: "checking", lastCheck: null });
  const [strictKeywordFilter, setStrictKeywordFilter] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // ─── 啟動時自動檢查後端狀態 ───
  const checkApiHealth = useCallback(async () => {
    setApiStatus(prev => ({ ...prev, server: "checking", db: "checking" }));
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setApiStatus({ server: "online", db: data.db, lastCheck: new Date().toLocaleTimeString(), serverTime: data.timestamp });
      } else {
        setApiStatus({ server: "offline", db: "offline", lastCheck: new Date().toLocaleTimeString(), error: `HTTP ${res.status}` });
      }
    } catch {
      setApiStatus({ server: "offline", db: "offline", lastCheck: new Date().toLocaleTimeString(), error: "無法連線" });
    }
  }, []);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/keywords`);
      if (res.ok) {
        const data = await res.json();
        if (data.keywords) {
          const formatted = data.keywords.map(k => ({
            ...k, 
            createdAt: new Date(k.createdAt).toISOString().split("T")[0]
          }));
          setKeywords(formatted);
        }
      }
    } catch (err) {
      console.error("無法取得關鍵字:", err);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts?limit=500`);
      if (res.ok) {
        const data = await res.json();
        if (data.posts) {
          // 強制全局去重，避免資料庫或 API 內部有髒資料導致重複
          setPosts(prev => {
            const merged = [...data.posts, ...prev];
            return Array.from(new Map(merged.map(p => [p.id, p])).values());
          });
        }
      }
    } catch (err) {
      console.error("無法取得貼文:", err);
    }
  }, []);

  const fetchScrapeHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scrape-history`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) setScrapeLog(data.history.map(h => ({
          keyword: h.keyword,
          postCount: h.postCount,
          time: h.time,
          status: "success",
        })));
      }
    } catch (err) {
      console.error("無法取得抓取紀錄:", err);
    }
  }, []);

  useEffect(() => {
    checkApiHealth();
    fetchKeywords();
    fetchPosts();
    fetchScrapeHistory();
    fetchDbStats();
    // 若有已儲存的 token，自動靜默驗證
    const savedToken = localStorage.getItem("APIFY_TOKEN");
    if (savedToken) {
      fetch(`${API_BASE}/api/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: savedToken }),
      }).then(r => r.json()).then(data => {
        setTokenStatus(data);
        if (data.valid) {
          // 也自動載入額度資訊
          fetch(`${API_BASE}/api/usage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: savedToken }),
          }).then(r => r.json()).then(d => { if (d.success) setUsageData(d); }).catch(() => {});
        }
      }).catch(() => {});
    }
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, [checkApiHealth, fetchKeywords, fetchPosts, fetchScrapeHistory, fetchDbStats]);

  // ─── 從真實 posts 計算趨勢資料 ───
  const trendData = (() => {
    if (!posts.length) return {};
    const data = {};
    // 按關鍵字分組，統計每日的貼文數與互動量
    keywords.forEach(kw => {
      const kwPosts = posts.filter(p => p.keyword === kw.keyword);
      if (!kwPosts.length) return;
      const byDate = {};
      kwPosts.forEach(p => {
        const d = new Date(p.timestamp);
        const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
        if (!byDate[dateKey]) byDate[dateKey] = { mentions: 0, likes: 0, reposts: 0 };
        byDate[dateKey].mentions += 1;
        byDate[dateKey].likes += (p.like_count || 0);
        byDate[dateKey].reposts += (p.repost_count || 0);
      });
      data[kw.keyword] = Object.entries(byDate)
        .map(([date, vals]) => ({ date, ...vals }))
        .sort((a, b) => {
          const [am, ad] = a.date.split("/").map(Number);
          const [bm, bd] = b.date.split("/").map(Number);
          return am !== bm ? am - bm : ad - bd;
        });
    });
    return data;
  })();

  // Aggregate trend data from real posts
  const allDates = [...new Set(Object.values(trendData).flatMap(d => d.map(p => p.date)))].sort((a, b) => {
    const [am, ad] = a.split("/").map(Number);
    const [bm, bd] = b.split("/").map(Number);
    return am !== bm ? am - bm : ad - bd;
  });
  const aggregateTrend = allDates.map(date => {
    const point = { date };
    let totalMentions = 0, totalLikes = 0;
    Object.entries(trendData).forEach(([kw, kwData]) => {
      const found = kwData.find(d => d.date === date);
      if (found) {
        point[kw] = found.mentions;
        totalMentions += found.mentions;
        totalLikes += found.likes;
      }
    });
    point.total = totalMentions;
    point.totalLikes = totalLikes;
    return point;
  });

  // Filtered + sorted posts
  const filteredPosts = posts.filter(p => {
    const matchKw = selectedKeyword === "全部" || p.keyword === selectedKeyword;
    const matchSearch = !searchQuery || p.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      || p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKw && matchSearch;
  }).sort((a, b) => {
    switch (postSort) {
      case "likes":   return (b.like_count || 0) - (a.like_count || 0);
      case "replies": return (b.comment_count || 0) - (a.comment_count || 0);
      case "reposts": return (b.repost_count || 0) - (a.repost_count || 0);
      default:        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    }
  }).filter(p => {
    if (!p.caption || !p.caption.trim()) return false;
    if (strictKeywordFilter && selectedKeyword !== "全部") {
      return p.caption.toLowerCase().includes(selectedKeyword.toLowerCase());
    }
    return true;
  }).filter((p, i, arr) => {
    // 依 caption 去重，保留排序後第一筆（互動量最高或最新的）
    const key = (p.caption || "").trim().toLowerCase();
    return arr.findIndex(x => (x.caption || "").trim().toLowerCase() === key) === i;
  });

  // Archive all posts
  const archiveAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/archive-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: selectedKeyword }),
      });
      if (res.ok) {
        // 從 state 移除已封存貼文
        if (selectedKeyword === "全部") {
          setPosts([]);
        } else {
          setPosts(prev => prev.filter(p => p.keyword !== selectedKeyword));
        }
        await fetchScrapeHistory();
      }
    } catch (err) {
      alert("清除失敗");
    }
    setConfirmArchive(false);
  };

  // Add keyword
  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAddKeywordError("");
    try {
      const res = await fetch(`${API_BASE}/api/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          sort_option: newSort,
          max_pages: newMaxPages,
          enabled: true,
          schedule_time: newScheduleTime,
          schedule_enabled: newScheduleEnabled
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.keyword) {
          setKeywords(prev => [...prev, {
            ...data.keyword,
            sort: data.keyword.sort_option,
            maxPages: data.keyword.max_pages,
            scheduleTime: data.keyword.schedule_time,
            scheduleEnabled: data.keyword.schedule_enabled ?? true,
            createdAt: new Date(data.keyword.created_at || Date.now()).toISOString().split("T")[0],
          }]);
        }
        setNewKeyword("");
        setShowAddForm(false); // 成功才關閉
      } else {
        const err = await res.json();
        setAddKeywordError(err.error || "新增失敗"); // 行內顯示錯誤，不關閉表單
      }
    } catch (err) {
      setAddKeywordError("無法連接伺服器，請確認後端狀態");
    }
  };

  // Delete keyword
  const deleteKeyword = async (id) => {
    try {
      await fetch(`${API_BASE}/api/keywords/${id}`, { method: "DELETE" });
      setKeywords(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      alert("刪除失敗");
    }
  };

  // Save Edit keyword
  const saveEditKeyword = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/keywords/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const data = await res.json();
        setKeywords(prev => prev.map(k => k.id === editingId ? { ...k, ...editForm, scheduleTime: editForm.schedule_time, scheduleEnabled: editForm.schedule_enabled, maxPages: editForm.max_pages, sort: editForm.sort_option } : k));
      } else {
        const err = await res.json();
        alert(err.error || "儲存失敗");
      }
    } catch (err) {
      alert("儲存失敗");
    }
    setEditingId(null);
  };

  // ─── 驗證 Apify Token ───
  const verifyToken = async () => {
    if (!apifyToken.trim()) return;
    setTokenStatus("checking");
    try {
      const res = await fetch(`${API_BASE}/api/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: apifyToken }),
      });
      const data = await res.json();
      setTokenStatus(data);
      // 驗證成功後自動載入額度資訊
      if (data.valid) fetchUsage();
    } catch {
      setTokenStatus({ valid: false, error: "無法連接 API Server，請確認後端已啟動 (npm run server)" });
    }
  };

  // ─── 資料庫統計 ───
  const [dbStats, setDbStats] = useState(null);
  const fetchDbStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/db-stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setDbStats(data.stats);
      }
    } catch (err) {
      console.error("無法取得 DB 統計:", err);
    }
  }, []);

  // ─── Apify 額度使用量 ───
  const [usageData, setUsageData] = useState(null); // { account, usage, limits, recentRuns }
  const [usageLoading, setUsageLoading] = useState(false);

  const fetchUsage = async () => {
    if (!apifyToken.trim()) return;
    setUsageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: apifyToken }),
      });
      const data = await res.json();
      if (data.success) {
        console.log("[Usage] API 原始資料:", JSON.stringify(data._raw, null, 2));
        console.log("[Usage] 解析結果:", { usage: data.usage, limits: data.limits });
        setUsageData(data);
      }
    } catch (err) {
      console.error("Usage fetch error:", err);
    } finally {
      setUsageLoading(false);
    }
  };

  // ─── 單一關鍵字抓取 ───
  const scrapeSingle = async (kw) => {
    if (!apifyToken.trim()) {
      alert("請先在「設定」頁面填入 Apify API Token");
      return;
    }
    setScrapingSingle(kw.id);
    setScrapeSingleProgress(prev => ({ ...prev, [kw.id]: 0 }));
    
    // Simulate fake progress up to 95%
    const intervalRef = setInterval(() => {
      setScrapeSingleProgress(prev => {
        const current = prev[kw.id] || 0;
        if (current >= 95) return prev;
        const inc = Math.max(0.5, (95 - current) * 0.05);
        return { ...prev, [kw.id]: Math.min(95, current + inc) };
      });
    }, 1000);

    try {
      const res = await fetch(`${API_BASE}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: apifyToken,
          keyword: kw.keyword,
          sort: kw.sort,
          maxPages: kw.maxPages,
        }),
      });
      const data = await res.json();
      if (data.success && data.posts?.length) {
        setPosts(prev => {
          // 透過 Map 強制全局去重
          const merged = [...(data.posts || []), ...prev];
          return Array.from(new Map(merged.map(p => [p.id, p])).values());
        });
        setScrapeLog(prev => [...prev, { keyword: kw.keyword, status: "success", postCount: data.postCount, time: new Date().toLocaleTimeString() }]);
      } else if (data.error) {
        setScrapeLog(prev => [...prev, { keyword: kw.keyword, status: "failed", error: data.error, time: new Date().toLocaleTimeString() }]);
      }
    } catch (err) {
      setScrapeLog(prev => [...prev, { keyword: kw.keyword, status: "failed", error: err.message, time: new Date().toLocaleTimeString() }]);
    } finally {
      clearInterval(intervalRef);
      setScrapeSingleProgress(prev => ({ ...prev, [kw.id]: 100 }));
      setTimeout(() => {
        setScrapingSingle(null);
        setScrapeSingleProgress(prev => {
          const next = { ...prev };
          delete next[kw.id];
          return next;
        });
      }, 600);
    }
  };

  // ─── 批次抓取所有啟用的關鍵字 ───
  const scrapeAll = async () => {
    if (!apifyToken.trim()) {
      alert("請先在「設定」頁面填入 Apify API Token");
      return;
    }
    const enabledKeywords = keywords.filter(k => k.enabled);
    if (!enabledKeywords.length) {
      alert("沒有啟用的關鍵字");
      return;
    }

    setScraping(true);
    setScrapeProgress({ current: 0, total: enabledKeywords.length, keyword: "" });
    setScrapeLog([]);

    try {
      const res = await fetch(`${API_BASE}/api/scrape-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: apifyToken,
          keywords: enabledKeywords.map(k => ({
            keyword: k.keyword,
            sort: k.sort,
            maxPages: k.maxPages,
          })),
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "progress") {
                setScrapeProgress({ current: event.current, total: event.total, keyword: event.keyword });
              } else if (event.type === "keyword_done") {
                setScrapeLog(prev => [...prev, { keyword: event.keyword, status: "success", postCount: event.postCount, time: new Date().toLocaleTimeString() }]);
              } else if (event.type === "done") {
                if (event.posts?.length) {
                  setPosts(prev => {
                    // 透過 Map 強制全局去重
                    const merged = [...event.posts, ...prev];
                    return Array.from(new Map(merged.map(p => [p.id, p])).values());
                  });
                }
                // Add failed logs
                event.logs?.filter(l => l.status !== "success").forEach(l => {
                  setScrapeLog(prev => [...prev, { keyword: l.keyword, status: l.status, error: l.error, time: new Date().toLocaleTimeString() }]);
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      alert(`批次抓取失敗: ${err.message}`);
    } finally {
      setScraping(false);
      setScrapeProgress(null);
    }
  };

  // Chart color palette
  const chartColors = [COLORS.orange500, "#3B82F6", COLORS.emerald, "#8B5CF6", "#EC4899"];

  // Engagement pie data
  const engagementData = [
    { name: "讚", value: posts.reduce((s, p) => s + p.like_count, 0), color: "#ef4444" },
    { name: "留言", value: posts.reduce((s, p) => s + p.comment_count, 0), color: "#3B82F6" },
    { name: "轉發", value: posts.reduce((s, p) => s + p.repost_count, 0), color: COLORS.orange500 },
    { name: "引用", value: posts.reduce((s, p) => s + p.quote_count, 0), color: COLORS.emerald },
  ];

  const enabledCount = keywords.filter(k => k.enabled).length;
  const totalPosts = posts.length;
  const totalEngagement = posts.reduce((s, p) => s + p.like_count + p.comment_count + p.repost_count, 0);

  // ─── Render ───
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFF8F3 0%, #F0F4FA 50%, #F5F3FF 100%)",
      fontFamily: "'Inter','Noto Sans TC',system-ui,-apple-system,sans-serif",
      display: "flex",
      position: "relative",
    }}>
      {/* ─── Mobile Top Bar ─── */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: 56, background: COLORS.white, borderBottom: `1px solid ${COLORS.gray100}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", boxSizing: "border-box",
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: "none", border: "none", cursor: "pointer", color: COLORS.gray900,
            padding: 4, display: "flex", alignItems: "center",
          }}>
            <Icons.Menu />
          </button>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray900, letterSpacing: "0.1em" }}>
            LURE <span style={{ fontWeight: 400, fontSize: 11, color: COLORS.gray400 }}>THREADS RADAR</span>
          </div>
          <div style={{ width: 32 }} />
        </div>
      )}
      {/* ─── Mobile Sidebar Overlay ─── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 199,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        }} />
      )}
      {/* ─── 刪除確認 Modal ─── */}
      {confirmDeleteTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 32px",
            width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray900, marginBottom: 8 }}>
              刪除關鍵字
            </div>
            <div style={{ fontSize: 14, color: COLORS.gray500, marginBottom: 24 }}>
              確定要刪除「<strong style={{ color: COLORS.gray900 }}>{confirmDeleteTarget.keyword}</strong>」嗎？<br />
              <span style={{ fontSize: 12, color: COLORS.red }}>此操作無法復原</span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDeleteTarget(null)}
                style={{
                  padding: "10px 24px", borderRadius: 50, border: `1px solid ${COLORS.gray200}`,
                  background: COLORS.white, color: COLORS.gray500, fontWeight: 600, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                onClick={() => { deleteKeyword(confirmDeleteTarget.id); setConfirmDeleteTarget(null); }}
                style={{
                  padding: "10px 24px", borderRadius: 50, border: "none",
                  background: COLORS.red, color: COLORS.white, fontWeight: 700, fontSize: 14,
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(248,113,113,0.4)",
                }}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Archive 確認 Modal ─── */}
      {confirmArchive && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 32px",
            width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗄️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray900, marginBottom: 8 }}>
              清除貼文
            </div>
            <div style={{ fontSize: 14, color: COLORS.gray500, marginBottom: 24 }}>
              確定要封存
              <strong style={{ color: COLORS.gray900 }}>
                {selectedKeyword === "全部" ? "所有" : `「${selectedKeyword}」`}
              </strong>
              的 {filteredPosts.length} 則貼文嗎？<br />
              <span style={{ fontSize: 12, color: COLORS.gray400 }}>資料會保留在資料庫，不會被刪除</span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmArchive(false)} style={{
                padding: "10px 24px", borderRadius: 50, border: `1px solid ${COLORS.gray200}`,
                background: COLORS.white, color: COLORS.gray500, fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>取消</button>
              <button onClick={archiveAll} style={{
                padding: "10px 24px", borderRadius: 50, border: "none",
                background: "#6366f1", color: COLORS.white, fontWeight: 700, fontSize: 14,
                cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
              }}>確認封存</button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Left Sidebar ─── */}
      <aside style={{
        width: 230, minWidth: 230, height: "100vh",
        position: isMobile ? "fixed" : "sticky", top: 0, left: 0,
        background: COLORS.white, borderRight: `1px solid ${COLORS.gray100}`,
        display: "flex", flexDirection: "column", padding: "20px 14px",
        boxSizing: "border-box",
        zIndex: isMobile ? 200 : 50,
        transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s ease",
        boxShadow: isMobile && sidebarOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
      }}>
        {/* Logo — GMB style */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "0 4px" }}>
          <div style={{
            fontSize: 13, fontWeight: 800, color: COLORS.gray900,
            letterSpacing: "0.15em", lineHeight: 1.5, textTransform: "uppercase",
          }}>
            LURE<br />
            <span style={{ fontWeight: 400, letterSpacing: "0.1em", fontSize: 11, color: COLORS.gray400 }}>
              THREADS RADAR
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { key: "dashboard", label: "總覽", icon: <Icons.TrendUp /> },
            { key: "posts", label: "貼文", icon: <Icons.Comment /> },
            { key: "keywords", label: "關鍵字", icon: <Icons.Search /> },
            { key: "settings", label: "設定", icon: <Icons.Settings /> },
          ].map(t => (
            <SidebarNavItem key={t.key} active={activeTab === t.key} icon={t.icon} label={t.label}
              onClick={() => { setActiveTab(t.key); if (isMobile) setSidebarOpen(false); }} />
          ))}
        </nav>

        {/* Apify 額度摘要 */}
        {usageData && usageData.usage.monthlyUsageUsd != null && (
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: COLORS.gray50, marginBottom: 8,
          }}>
            <div style={{ fontSize: 10, color: COLORS.gray400, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>
              Apify 額度
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.orange500 }}>
                ${usageData.usage.monthlyUsageUsd.toFixed(2)}
              </span>
              {usageData.usage.monthlyLimitUsd != null && (
                <span style={{ fontSize: 11, color: COLORS.gray400 }}>
                  / ${usageData.usage.monthlyLimitUsd.toFixed(2)} USD
                </span>
              )}
            </div>
            {usageData.usage.monthlyLimitUsd != null && (
              <>
                <div style={{ width: "100%", height: 5, borderRadius: 4, background: COLORS.gray200, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{
                    width: `${Math.min((usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) * 100, 100)}%`,
                    height: "100%", borderRadius: 4, transition: "width 0.6s ease",
                    background: (usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) > 0.8
                      ? COLORS.red : (usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) > 0.5
                      ? "#F59E0B" : COLORS.emerald,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: COLORS.gray400 }}>
                  已使用 {((usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) * 100).toFixed(1)}%
                </div>
              </>
            )}
          </div>
        )}

        {/* Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "14px 16px",
          borderRadius: 12, background: COLORS.gray50, marginTop: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: enabledCount > 0 ? COLORS.emerald : COLORS.gray300,
          }} />
          <span style={{ fontSize: 12, color: COLORS.gray500 }}>
            {enabledCount} 組關鍵字監控中
          </span>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{
        flex: 1, minWidth: 0, overflowY: "auto", maxHeight: "100vh",
        padding: isMobile ? "72px 14px 80px" : "28px 32px 80px",
      }}>

        {/* ═══ DASHBOARD TAB ═══ */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats Row */}
            <div style={{ display: "flex", gap: isMobile ? 10 : 16, marginBottom: 24, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
              <StatCard label="追蹤關鍵字" value={enabledCount} sub={`共 ${keywords.length} 組`}
                icon={<Icons.Search />} color={COLORS.orange500} />
              <StatCard label="已收集貼文" value={totalPosts} sub={totalPosts === 0 ? "尚未抓取" : `${[...new Set(posts.map(p => p.keyword))].length} 組關鍵字`}
                icon={<Icons.Database />} />
              <StatCard label="總互動量" value={formatNum(totalEngagement)} sub={totalPosts === 0 ? "---" : `${totalPosts} 則貼文`}
                icon={<Icons.TrendUp />} color={COLORS.orange500} />
            </div>

            {/* Scrape Log */}
            {scrapeLog.length > 0 && (
              <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.gray100}`, padding: 14, marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray900, marginBottom: 8 }}>近期系統抓取軌跡</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {scrapeLog.map((log, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0" }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: log.status === "success" ? COLORS.emerald : COLORS.red,
                        }} />
                        <span style={{ fontWeight: 600, color: COLORS.gray900 }}>{log.keyword}</span>
                        <span style={{ color: log.status === "success" ? COLORS.emerald : COLORS.red }}>
                          {log.status === "success" ? `${log.postCount} 則貼文` : log.error || "失敗"}
                        </span>
                        <span style={{ color: COLORS.gray400, marginLeft: "auto" }}>{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Trend Chart */}
              <div style={{
                background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
                padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 }}>
                  關鍵字提及趨勢
                </div>
                <div style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 16 }}>
                  {posts.length > 0 ? "依據已抓取資料" : "尚無資料"}
                </div>
                {posts.length === 0 ? (
                  <div style={{
                    height: 260, display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", color: COLORS.gray400, gap: 12,
                  }}>
                    <Icons.Database />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>尚無趨勢資料</div>
                    <div style={{ fontSize: 12 }}>請先設定 Apify Token 並執行關鍵字抓取</div>
                  </div>
                ) : (
                <>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={aggregateTrend}>
                    <defs>
                      {keywords.filter(k => k.enabled).map((k, i) => (
                        <linearGradient key={k.id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray100} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.gray400 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.gray400 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    {keywords.filter(k => k.enabled).map((k, i) => (
                      <Area key={k.id} type="monotone" dataKey={k.keyword} name={k.keyword}
                        stroke={chartColors[i % chartColors.length]} strokeWidth={2.5}
                        fill={`url(#grad-${i})`} dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  {keywords.filter(k => k.enabled).map((k, i) => (
                    <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.gray500 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: chartColors[i % chartColors.length] }} />
                      {k.keyword}
                    </div>
                  ))}
                </div>
                </>
                )}
              </div>

              {/* Engagement Pie */}
              <div style={{
                background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
                padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 }}>
                  互動類型分佈
                </div>
                <div style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 8 }}>所有已收集貼文</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={engagementData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={4} dataKey="value" stroke="none">
                      {engagementData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                  {engagementData.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.gray500 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                      {d.name} {formatNum(d.value)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hot Posts */}
            <div style={{
              background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
              padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 16 }}>
                熱門貼文 TOP 10
              </div>
              {posts.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: COLORS.gray400 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>尚無貼文資料</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>執行抓取後將自動顯示</div>
                </div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...posts].sort((a, b) => (b.like_count + b.repost_count) - (a.like_count + a.repost_count))
                  .filter((p, i, arr) => {
                    const key = (p.caption || "").trim().toLowerCase();
                    return key && arr.findIndex(x => (x.caption || "").trim().toLowerCase() === key) === i;
                  })
                  .slice(0, 10).map((p, i) => (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, padding: isMobile ? "10px 12px" : "12px 16px",
                    borderRadius: 14, background: i === 0 ? COLORS.orange100 : COLORS.gray50,
                    border: i === 0 ? `1px solid ${COLORS.orange200}` : `1px solid transparent`,
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? COLORS.orange500 : COLORS.gray300,
                      color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.caption}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>@{p.user.username}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#ef4444" }}><Icons.Heart /> {formatNum(p.like_count)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: COLORS.orange500 }}><Icons.Repost /> {formatNum(p.repost_count)}</span>
                    </div>
                    <a href={p.thread_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: COLORS.gray400, flexShrink: 0 }}>
                      <Icons.ExternalLink />
                    </a>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ POSTS TAB ═══ */}
        {activeTab === "posts" && (
          <div>
            {/* Search + Filter */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "auto" : 250 }}>
                <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: COLORS.gray400 }}>
                  <Icons.Search />
                </div>
                <input
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜尋貼文內容或用戶名..."
                  style={{
                    width: "100%", padding: "12px 16px 12px 44px", borderRadius: 50, fontSize: 14,
                    border: `1px solid ${COLORS.gray200}`, background: "rgba(249,250,251,0.8)",
                    outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.orange400}
                  onBlur={e => e.target.style.borderColor = COLORS.gray200}
                />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["全部", ...keywords.map(k => k.keyword)].map(kw => (
                  <button key={kw} onClick={() => setSelectedKeyword(kw)} style={{
                    padding: "10px 18px", borderRadius: 50, fontSize: 13, fontWeight: 600,
                    border: selectedKeyword === kw ? `2px solid ${COLORS.orange500}` : `1px solid ${COLORS.gray200}`,
                    background: selectedKeyword === kw ? COLORS.orange100 : COLORS.white,
                    color: selectedKeyword === kw ? COLORS.orange500 : COLORS.gray500,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Post count + 清除 + 排序 */}
            <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, color: COLORS.gray400 }}>
                  共 {filteredPosts.length} 則貼文
                  {strictKeywordFilter && selectedKeyword !== "全部" && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: COLORS.orange500, fontWeight: 600 }}>（精確符合）</span>
                  )}
                </div>
                {filteredPosts.length > 0 && (
                  <button onClick={() => setConfirmArchive(true)} style={{
                    padding: "4px 12px", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${COLORS.gray200}`, background: COLORS.white,
                    color: COLORS.gray400, transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.borderColor = "#6366f1"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = COLORS.gray400; e.currentTarget.style.borderColor = COLORS.gray200; }}
                  >
                    🗄️ 清除所有
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { key: "newest",  label: "最新" },
                  { key: "likes",   label: "🤍 按讚最多" },
                  { key: "replies", label: "💬 回覆最多" },
                  { key: "reposts", label: "🔄 轉發最多" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setPostSort(key)} style={{
                    padding: "5px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: postSort === key ? "none" : `1px solid ${COLORS.gray200}`,
                    background: postSort === key ? COLORS.orange500 : COLORS.white,
                    color: postSort === key ? COLORS.white : COLORS.gray500,
                    transition: "all 0.15s",
                  }}>
                    {label}
                  </button>
                ))}
                {selectedKeyword !== "全部" && (
                  <button onClick={() => setStrictKeywordFilter(v => !v)} style={{
                    padding: "5px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: strictKeywordFilter ? "none" : `1px solid ${COLORS.gray200}`,
                    background: strictKeywordFilter ? "#6366f1" : COLORS.white,
                    color: strictKeywordFilter ? COLORS.white : COLORS.gray500,
                    transition: "all 0.15s",
                  }}>
                    🎯 精確符合
                  </button>
                )}
              </div>
            </div>

            {/* Posts Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(380px, 1fr))", gap: isMobile ? 10 : 14 }}>
              {filteredPosts.length > 0 ? filteredPosts.map(p => (
                <PostCard key={p.id} post={p} />
              )) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: COLORS.gray400 }}>
                  <div style={{ marginBottom: 12, color: COLORS.gray300 }}><Icons.Search /></div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {posts.length === 0 ? "尚無貼文資料" : "沒有符合條件的貼文"}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {posts.length === 0
                      ? "請確保已設定 Apify Token，並至「關鍵字」分頁執行手動抓取或等待自動排程"
                      : "試試調整搜尋條件或關鍵字篩選"
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ KEYWORDS TAB ═══ */}
        {activeTab === "keywords" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 20, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: COLORS.orange500 }}>關鍵字管理</div>
                <div style={{ fontSize: 13, color: COLORS.gray400, marginTop: 4 }}>管理你的 Threads 追蹤關鍵字，Apify Actor 將按排程抓取</div>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 22px",
                borderRadius: 50, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
                background: COLORS.orange500, color: COLORS.white, transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(255,107,44,0.25)",
              }}>
                <Icons.Plus /> 新增關鍵字
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div style={{
                background: COLORS.white, borderRadius: 20, border: `2px solid ${COLORS.orange200}`,
                padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(255,107,44,0.08)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 16 }}>新增追蹤關鍵字</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: 2, minWidth: 200 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6, display: "block" }}>
                      關鍵字 / Hashtag
                    </label>
                    <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                      placeholder='例：AI, #台灣, "machine learning"'
                      style={{
                        width: "100%", padding: "12px 18px", borderRadius: 50, fontSize: 14,
                        border: `1px solid ${COLORS.gray200}`, background: "rgba(249,250,251,0.8)",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={e => e.target.style.borderColor = COLORS.orange400}
                      onBlur={e => e.target.style.borderColor = COLORS.gray200}
                      onKeyDown={e => e.key === "Enter" && addKeyword()}
                    />
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6, display: "block" }}>排序</label>
                    <select value={newSort} onChange={e => setNewSort(e.target.value)} style={{
                      width: "100%", padding: "12px 18px", borderRadius: 50, fontSize: 14,
                      border: `1px solid ${COLORS.gray200}`, background: "rgba(249,250,251,0.8)",
                      outline: "none", cursor: "pointer",
                    }}>
                      <option value="recent">最新 (Recent)</option>
                      <option value="top">熱門 (Top)</option>
                    </select>
                  </div>
                  <div style={{ minWidth: 100 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6, display: "block" }}>
                      抓取深度 (頁) <span title="1頁約=20篇文。數字越大抓越久">(?)</span>
                    </label>
                    <input type="number" min={1} max={20} value={newMaxPages}
                      onChange={e => setNewMaxPages(parseInt(e.target.value) || 5)}
                      style={{
                        width: "100%", padding: "12px 18px", borderRadius: 50, fontSize: 14,
                        border: `1px solid ${COLORS.gray200}`, background: "rgba(249,250,251,0.8)",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6, display: "block" }}>
                      每日排程時間
                    </label>
                    <input type="time" value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)}
                      style={{
                        width: "100%", padding: "12px 18px", borderRadius: 50, fontSize: 14,
                        border: `1px solid ${COLORS.gray200}`, background: "rgba(249,250,251,0.8)",
                        outline: "none", boxSizing: "border-box", fontFamily: "monospace",
                      }}
                    />
                  </div>
                  {/* 排程開關 */}
                  <div style={{ minWidth: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                      <div
                        onClick={() => setNewScheduleEnabled(v => !v)}
                        style={{
                          width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
                          background: newScheduleEnabled ? COLORS.orange500 : COLORS.gray300,
                          transition: "background 0.2s", flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: "absolute", top: 3, left: newScheduleEnabled ? 21 : 3,
                          width: 16, height: 16, borderRadius: "50%", background: COLORS.white,
                          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: newScheduleEnabled ? COLORS.orange500 : COLORS.gray400 }}>
                        每日排程
                      </span>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addKeyword} style={{
                      padding: "12px 28px", borderRadius: 50, border: "none", cursor: "pointer",
                      background: COLORS.orange500, color: COLORS.white, fontWeight: 600, fontSize: 14,
                    }}>
                      新增
                    </button>
                    <button onClick={() => { setShowAddForm(false); setAddKeywordError(""); }} style={{
                      padding: "12px 22px", borderRadius: 50, border: `1px solid ${COLORS.gray200}`,
                      background: COLORS.white, color: COLORS.gray500, fontWeight: 600, fontSize: 14, cursor: "pointer",
                    }}>
                      取消
                    </button>
                  </div>
                  {addKeywordError && (
                    <div style={{ width: "100%", marginTop: 8, fontSize: 13, color: COLORS.red, fontWeight: 600 }}>
                      ⚠️ {addKeywordError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Keywords List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {keywords.map((k, i) => (
                <div key={k.id} style={{
                  background: COLORS.white, borderRadius: 20, border: `1px solid ${k.enabled ? COLORS.gray100 : COLORS.gray200}`,
                  padding: isMobile ? "14px 16px" : "16px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center",
                  flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0,
                  opacity: k.enabled ? 1 : 0.55, transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: k.enabled ? COLORS.orange100 : COLORS.gray100,
                      color: k.enabled ? COLORS.orange500 : COLORS.gray400,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      {editingId === k.id ? (
                        <div style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "center", flexWrap: "wrap" }}>
                          <input value={editForm.keyword} onChange={e => setEditForm({...editForm, keyword: e.target.value})} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, minWidth: isMobile ? "100%" : "auto" }} />
                          <select value={editForm.sort_option} onChange={e => setEditForm({...editForm, sort_option: e.target.value})} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13 }}>
                            <option value="recent">最新</option>
                            <option value="top">熱門</option>
                          </select>
                          <span style={{ fontSize: 12, color: COLORS.gray500 }}>深度 (約 {editForm.max_pages * 15} 筆)</span>
                          <input type="number" min={1} max={20} value={editForm.max_pages} onChange={e => setEditForm({...editForm, max_pages: parseInt(e.target.value) || 1})} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, width: 50 }} />
                          <span style={{ fontSize: 12, color: COLORS.gray500 }}>排程</span>
                          <input type="time" value={editForm.schedule_time} onChange={e => setEditForm({...editForm, schedule_time: e.target.value})} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13 }} />
                          {/* 排程開關 */}
                          <div
                            onClick={() => setEditForm({...editForm, schedule_enabled: !editForm.schedule_enabled})}
                            style={{
                              width: 36, height: 20, borderRadius: 10, position: "relative", cursor: "pointer", flexShrink: 0,
                              background: editForm.schedule_enabled ? COLORS.orange500 : COLORS.gray300,
                              transition: "background 0.2s",
                            }}
                          >
                            <div style={{
                              position: "absolute", top: 2, left: editForm.schedule_enabled ? 18 : 2,
                              width: 16, height: 16, borderRadius: "50%", background: COLORS.white,
                              transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: editForm.schedule_enabled ? COLORS.orange500 : COLORS.gray400, fontWeight: 600 }}>
                            {editForm.schedule_enabled ? "排程開啟" : "排程關閉"}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.gray900 }}>{k.keyword}</div>
                          <div style={{ fontSize: 13, color: COLORS.gray400, marginTop: 2 }}>
                            排序: {k.sort === "recent" ? "最新" : "熱門"} · 抓取深度: {k.maxPages} 頁 (約 {k.maxPages * 15} 筆) · 建立: {k.createdAt}
                            {k.scheduleEnabled && (
                              <span style={{ marginLeft: 6, color: COLORS.orange500 }}>
                                · 🕒 {k.scheduleTime || "09:00"}（排程中）
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-end" : "flex-start" }}>
                    {editingId === k.id ? (
                      <>
                        <button onClick={saveEditKeyword} style={{ background: COLORS.emerald, color: COLORS.white, padding: "8px 16px", borderRadius: 50, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                          <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Icons.Check /> 儲存</span>
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background: COLORS.white, color: COLORS.gray500, border: `1px solid ${COLORS.gray200}`, padding: "8px 16px", borderRadius: 50, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ position: "relative", minWidth: 90, height: 34, borderRadius: 50, overflow: "hidden" }}>
                          <button onClick={() => scrapeSingle(k)} disabled={scrapingSingle === k.id || !apifyToken.trim()} style={{
                            width: "100%", height: "100%", border: "none", cursor: scrapingSingle === k.id ? "wait" : "pointer",
                            background: scrapingSingle === k.id ? COLORS.gray100 : COLORS.orange500,
                            color: scrapingSingle === k.id ? COLORS.gray600 : COLORS.white,
                            fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                            boxShadow: scrapingSingle === k.id ? "none" : "0 2px 8px rgba(255,107,44,0.3)",
                            opacity: !apifyToken.trim() ? 0.4 : 1,
                            position: "relative",
                          }}>
                            {/* 進度條底色 */}
                            {scrapingSingle === k.id && (
                              <div style={{
                                position: "absolute", top: 0, left: 0, bottom: 0,
                                width: `${scrapeSingleProgress[k.id] || 0}%`,
                                background: COLORS.gray200,
                                transition: "width 0.5s ease-out",
                                zIndex: 0,
                              }} />
                            )}
                            {/* 文字蓋在最上層 */}
                            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              {scrapingSingle === k.id ? `抓取中 ${Math.round(scrapeSingleProgress[k.id] || 0)}%` : "開始抓取"}
                            </span>
                          </button>
                        </div>
                        <button onClick={() => { setEditingId(k.id); setEditForm({ keyword: k.keyword, sort_option: k.sort, max_pages: k.maxPages, schedule_time: k.scheduleTime || "09:00", schedule_enabled: k.scheduleEnabled ?? true }); }} style={{
                          border: "none", background: "none", cursor: "pointer", color: COLORS.gray400,
                          padding: 6, borderRadius: 8, transition: "color 0.2s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = COLORS.orange500}
                          onMouseLeave={e => e.currentTarget.style.color = COLORS.gray400}
                        >
                          <Icons.Edit />
                        </button>
                        <button onClick={() => setConfirmDeleteTarget({ id: k.id, keyword: k.keyword })} style={{
                          border: "none", background: "none", cursor: "pointer", color: COLORS.gray400,
                          padding: 6, borderRadius: 8, transition: "color 0.2s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = COLORS.red}
                          onMouseLeave={e => e.currentTarget.style.color = COLORS.gray400}
                        >
                          <Icons.Trash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeTab === "settings" && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.orange500, marginBottom: 20 }}>系統設定</div>

            {/* API 串接狀態面板 */}
            <div style={{
              background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
              padding: 24, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 }}>API 串接狀態</div>
                  <div style={{ fontSize: 13, color: COLORS.gray400 }}>即時監控系統各項服務的連線狀態</div>
                </div>
                <button onClick={checkApiHealth} style={{
                  padding: "8px 18px", borderRadius: 50, border: `1px solid ${COLORS.gray200}`,
                  background: COLORS.white, color: COLORS.gray500, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  重新檢查
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 12 }}>
                {/* 後端伺服器 */}
                <div style={{
                  background: apiStatus.server === "online" ? "#F0FDF4" : apiStatus.server === "checking" ? COLORS.gray50 : "#FEF2F2",
                  border: `1px solid ${apiStatus.server === "online" ? "#BBF7D0" : apiStatus.server === "checking" ? COLORS.gray200 : "#FECACA"}`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: apiStatus.server === "online" ? COLORS.emerald : apiStatus.server === "checking" ? COLORS.gray400 : COLORS.red,
                      boxShadow: apiStatus.server === "online" ? `0 0 6px ${COLORS.emerald}` : "none",
                      animation: apiStatus.server === "checking" ? "pulse 1.5s ease-in-out infinite" : "none",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray900 }}>後端伺服器</span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, marginBottom: 4,
                    color: apiStatus.server === "online" ? COLORS.emerald : apiStatus.server === "checking" ? COLORS.gray400 : COLORS.red,
                  }}>
                    {apiStatus.server === "online" ? "已連線" : apiStatus.server === "checking" ? "檢查中..." : "離線"}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.gray400 }}>
                    {apiStatus.server === "online" ? `localhost:3001` : apiStatus.error || ""}
                  </div>
                  {apiStatus.lastCheck && (
                    <div style={{ fontSize: 10, color: COLORS.gray400, marginTop: 4 }}>上次檢查: {apiStatus.lastCheck}</div>
                  )}
                </div>

                {/* Apify Token */}
                <div style={{
                  background: tokenStatus?.valid ? "#F0FDF4" : !apifyToken.trim() ? COLORS.gray50 : tokenStatus ? "#FEF2F2" : "#FFFBEB",
                  border: `1px solid ${tokenStatus?.valid ? "#BBF7D0" : !apifyToken.trim() ? COLORS.gray200 : tokenStatus ? "#FECACA" : "#FDE68A"}`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: tokenStatus?.valid ? COLORS.emerald : !apifyToken.trim() ? COLORS.gray300 : tokenStatus ? COLORS.red : "#F59E0B",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray900 }}>Apify Token</span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, marginBottom: 4,
                    color: tokenStatus?.valid ? COLORS.emerald : !apifyToken.trim() ? COLORS.gray400 : tokenStatus ? COLORS.red : "#F59E0B",
                  }}>
                    {tokenStatus?.valid ? "已驗證" : !apifyToken.trim() ? "未設定" : tokenStatus ? "驗證失敗" : "待驗證"}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.gray400 }}>
                    {tokenStatus?.valid ? tokenStatus.user?.username || "" : !apifyToken.trim() ? "請在下方填入" : ""}
                  </div>
                </div>

                {/* 資料庫 PostgreSQL */}
                <div style={{
                  background: apiStatus.db === "connected" ? "#F0FDF4" : apiStatus.db === "checking" ? COLORS.gray50 : "#FEF2F2",
                  border: `1px solid ${apiStatus.db === "connected" ? "#BBF7D0" : apiStatus.db === "checking" ? COLORS.gray200 : "#FECACA"}`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: apiStatus.db === "connected" ? COLORS.emerald : apiStatus.db === "checking" ? COLORS.gray400 : COLORS.red,
                      boxShadow: apiStatus.db === "connected" ? `0 0 6px ${COLORS.emerald}` : "none",
                      animation: apiStatus.db === "checking" ? "pulse 1.5s ease-in-out infinite" : "none",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray900 }}>PostgreSQL</span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, marginBottom: 4,
                    color: apiStatus.db === "connected" ? COLORS.emerald : apiStatus.db === "checking" ? COLORS.gray400 : COLORS.red,
                  }}>
                    {apiStatus.db === "connected" ? "連線成功" : apiStatus.db === "checking" ? "檢查中..." : "未連線"}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.gray400 }}>
                    {apiStatus.db === "connected" ? "已寫入準備" : "請確認 DATABASE_URL"}
                  </div>
                </div>

                {/* 資料狀態 */}
                <div style={{
                  background: posts.length > 0 ? "#F0FDF4" : COLORS.gray50,
                  border: `1px solid ${posts.length > 0 ? "#BBF7D0" : COLORS.gray200}`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: posts.length > 0 ? COLORS.emerald : COLORS.gray300,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray900 }}>資料狀態</span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, marginBottom: 4,
                    color: posts.length > 0 ? COLORS.emerald : COLORS.gray400,
                  }}>
                    {posts.length > 0 ? `${posts.length} 則貼文` : "尚無資料"}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.gray400 }}>
                    {posts.length > 0
                      ? `涵蓋 ${[...new Set(posts.map(p => p.keyword))].length} 組關鍵字`
                      : "請執行抓取"
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* 資料庫統計 */}
            <div style={{
              background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
              padding: 24, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 }}>資料庫統計</div>
                  <div style={{ fontSize: 13, color: COLORS.gray400 }}>歷史抓取資料總覽（含已封存）</div>
                </div>
                <button onClick={fetchDbStats} style={{
                  padding: "8px 18px", borderRadius: 50, border: `1px solid ${COLORS.gray200}`,
                  background: COLORS.white, color: COLORS.gray500, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  重新整理
                </button>
              </div>

              {!dbStats ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: COLORS.gray400 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>載入中...</div>
                </div>
              ) : (
                <>
                  {/* 總覽數字 */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: COLORS.orange100, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.orange500 }}>{dbStats.totalPosts}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600, marginTop: 4 }}>歷史總貼文</div>
                    </div>
                    <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.emerald }}>{dbStats.activePosts}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600, marginTop: 4 }}>目前顯示</div>
                    </div>
                    <div style={{ background: COLORS.gray50, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.gray400 }}>{dbStats.archivedPosts}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600, marginTop: 4 }}>已封存</div>
                    </div>
                    <div style={{ background: COLORS.gray50, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.gray900 }}>{dbStats.keywordCount}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600, marginTop: 4 }}>關鍵字數</div>
                    </div>
                  </div>

                  {/* 互動量總計 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{formatNum(dbStats.totalLikes)}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, marginTop: 2 }}>總按讚</div>
                    </div>
                    <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#3B82F6" }}>{formatNum(dbStats.totalComments)}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, marginTop: 2 }}>總留言</div>
                    </div>
                    <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.orange500 }}>{formatNum(dbStats.totalReposts)}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray500, marginTop: 2 }}>總轉發</div>
                    </div>
                  </div>

                  {/* 各關鍵字明細 */}
                  {dbStats.byKeyword?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900, marginBottom: 10 }}>各關鍵字貼文數</div>
                      <div style={{ borderRadius: 10, border: `1px solid ${COLORS.gray100}`, overflow: "hidden" }}>
                        <div style={{
                          display: "grid", gridTemplateColumns: isMobile ? "1fr 60px 60px" : "1fr 80px 80px 120px",
                          background: COLORS.gray50, padding: "8px 14px", fontSize: 11, fontWeight: 600, color: COLORS.gray500,
                        }}>
                          <div>關鍵字</div>
                          <div style={{ textAlign: "right" }}>總數</div>
                          <div style={{ textAlign: "right" }}>顯示中</div>
                          {!isMobile && <div style={{ textAlign: "right" }}>最後抓取</div>}
                        </div>
                        {dbStats.byKeyword.map((kw, i) => (
                          <div key={kw.keyword} style={{
                            display: "grid", gridTemplateColumns: isMobile ? "1fr 60px 60px" : "1fr 80px 80px 120px",
                            padding: "10px 14px", fontSize: 13, borderTop: `1px solid ${COLORS.gray100}`,
                            background: i % 2 === 0 ? COLORS.white : COLORS.gray50,
                            alignItems: "center",
                          }}>
                            <div style={{ fontWeight: 600, color: COLORS.gray900 }}>{kw.keyword}</div>
                            <div style={{ textAlign: "right", fontWeight: 700, color: COLORS.orange500 }}>{kw.total}</div>
                            <div style={{ textAlign: "right", color: COLORS.gray500 }}>{kw.active}</div>
                            {!isMobile && (
                              <div style={{ textAlign: "right", fontSize: 11, color: COLORS.gray400 }}>
                                {kw.lastScraped ? new Date(kw.lastScraped).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "---"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 時間資訊 */}
                  {dbStats.firstScraped && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: COLORS.gray400 }}>
                      <span>首次抓取：{new Date(dbStats.firstScraped).toLocaleDateString("zh-TW")}</span>
                      <span>最後抓取：{new Date(dbStats.lastScraped).toLocaleDateString("zh-TW")}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 額度使用量監控 */}
            <div style={{
              background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
              padding: 24, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 }}>額度使用量</div>
                  <div style={{ fontSize: 13, color: COLORS.gray400 }}>監控 Apify 帳戶的 API 消耗額度與執行記錄</div>
                </div>
                <button onClick={fetchUsage} disabled={!apifyToken.trim() || usageLoading} style={{
                  padding: "8px 18px", borderRadius: 50, border: `1px solid ${COLORS.orange500}`,
                  background: usageLoading ? COLORS.orange100 : "transparent", color: COLORS.orange500,
                  fontSize: 12, fontWeight: 600, cursor: !apifyToken.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s", opacity: !apifyToken.trim() ? 0.4 : 1,
                }}>
                  {usageLoading ? "載入中..." : "重新載入"}
                </button>
              </div>

              {!usageData ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: COLORS.gray400 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>尚未載入額度資訊</div>
                  <div style={{ fontSize: 12 }}>
                    {apifyToken.trim() ? "點擊「重新載入」或完成 Token 驗證後自動載入" : "請先填入 Apify Token"}
                  </div>
                </div>
              ) : (
                <>
                  {/* 使用量進度條 */}
                  <div style={{
                    background: COLORS.gray50, borderRadius: 12, padding: 20, marginBottom: 16,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "baseline", marginBottom: 10, flexWrap: "wrap", gap: 4 }}>
                      <div>
                        <span style={{ fontSize: 28, fontWeight: 900, color: COLORS.orange500 }}>
                          {usageData.usage.monthlyUsageUsd != null
                            ? `$${usageData.usage.monthlyUsageUsd.toFixed(2)} USD`
                            : "—"}
                        </span>
                        {usageData.usage.monthlyLimitUsd != null && (
                          <span style={{ fontSize: 14, color: COLORS.gray400, marginLeft: 4 }}>
                            / ${usageData.usage.monthlyLimitUsd.toFixed(2)} USD
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.gray500, fontWeight: 600 }}>
                        {usageData.account.plan} 方案
                      </div>
                    </div>
                    {/* Progress bar — 只在兩個數值都有時顯示 */}
                    {usageData.usage.monthlyUsageUsd != null && usageData.usage.monthlyLimitUsd != null && (
                      <>
                        <div style={{
                          width: "100%", height: 8, borderRadius: 8, background: COLORS.gray200, overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${Math.min((usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) * 100, 100)}%`,
                            height: "100%", borderRadius: 8, transition: "width 0.6s ease",
                            background: (usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) > 0.8
                              ? COLORS.red : (usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) > 0.5
                              ? "#F59E0B" : COLORS.emerald,
                          }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: COLORS.gray400 }}>
                            已使用 {((usageData.usage.monthlyUsageUsd / usageData.usage.monthlyLimitUsd) * 100).toFixed(1)}%
                          </span>
                          <span style={{ fontSize: 11, color: COLORS.gray400 }}>
                            剩餘 ${(usageData.usage.monthlyLimitUsd - usageData.usage.monthlyUsageUsd).toFixed(2)} USD
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 帳戶與限額資訊 */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 4 }}>帳號</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900 }}>
                        {usageData.account.username}
                      </div>
                    </div>
                    {usageData.limits.maxMemoryMbytes != null && (
                      <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 4 }}>記憶體上限</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900 }}>
                          {(usageData.limits.maxMemoryMbytes / 1024).toFixed(0)} GB
                        </div>
                      </div>
                    )}
                    {usageData.limits.dataRetentionDays != null && (
                      <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 4 }}>資料保留</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900 }}>
                          {usageData.limits.dataRetentionDays} 天
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 最近執行記錄：只顯示有實際數據或執行中的記錄 */}
                  {usageData.recentRuns?.filter(r => r.usageTotalUsd > 0 || r.computeUnits > 0 || r.status === "RUNNING").length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900, marginBottom: 10 }}>
                        近期執行記錄 ({usageData.recentRuns.filter(r => r.usageTotalUsd > 0 || r.computeUnits > 0 || r.status === "RUNNING").length})
                      </div>
                      <div style={{ borderRadius: 10, border: `1px solid ${COLORS.gray100}`, overflow: "hidden" }}>
                        <div style={{
                          display: "grid", gridTemplateColumns: isMobile ? "60px 1fr 70px" : "80px 1fr 100px",
                          background: COLORS.gray50, padding: "8px 14px", fontSize: 11, fontWeight: 600,
                          color: COLORS.gray500,
                        }}>
                          <div>狀態</div>
                          <div>執行時間</div>
                          <div style={{ textAlign: "right" }}>費用</div>
                        </div>
                        {usageData.recentRuns
                          .filter(r => r.usageTotalUsd > 0 || r.computeUnits > 0 || r.status === "RUNNING")
                          .map((run, i) => (
                          <div key={run.id} style={{
                            display: "grid", gridTemplateColumns: isMobile ? "60px 1fr 70px" : "80px 1fr 100px",
                            padding: "8px 14px", fontSize: 12, borderTop: `1px solid ${COLORS.gray100}`,
                            background: i % 2 === 0 ? COLORS.white : COLORS.gray50,
                            alignItems: "center",
                          }}>
                            <div>
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: 50,
                                fontSize: 10, fontWeight: 700,
                                background: run.status === "SUCCEEDED" ? "#D1FAE5" : run.status === "RUNNING" ? "#DBEAFE" : "#FEE2E2",
                                color: run.status === "SUCCEEDED" ? "#065F46" : run.status === "RUNNING" ? "#1E40AF" : "#991B1B",
                              }}>
                                {run.status === "SUCCEEDED" ? "成功" : run.status === "RUNNING" ? "執行中" : "失敗"}
                              </span>
                            </div>
                            <div style={{ color: COLORS.gray500 }}>
                              {run.startedAt ? new Date(run.startedAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "---"}
                            </div>
                            <div style={{ textAlign: "right", fontWeight: 600, fontFamily: "monospace", color: COLORS.gray900 }}>
                              ${parseFloat(run.usageTotalUsd.toFixed(4))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Apify Config */}
            <div style={{
              background: COLORS.white, borderRadius: 20, border: `1px solid ${COLORS.gray100}`,
              padding: 24, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 }}>Apify API 設定</div>
              <div style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 16 }}>
                連接 Apify 平台以啟用自動化 Threads 數據抓取
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6, display: "block" }}>
                  Apify API Token
                </label>
                <input
                  type={showConfig ? "text" : "password"}
                  value={apifyToken}
                  onChange={e => setApifyToken(e.target.value)}
                  placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxxx"
                  style={{
                    width: "100%", padding: "12px 18px", borderRadius: 50, fontSize: 14,
                    border: `1px solid ${COLORS.gray200}`, background: "rgba(249,250,251,0.8)",
                    outline: "none", fontFamily: "monospace", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.orange400}
                  onBlur={e => e.target.style.borderColor = COLORS.gray200}
                />
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                  <button onClick={() => setShowConfig(!showConfig)} style={{
                    fontSize: 12, color: COLORS.orange500, background: "none", border: "none",
                    cursor: "pointer", fontWeight: 600,
                  }}>
                    {showConfig ? "隱藏 Token" : "顯示 Token"}
                  </button>
                  <button onClick={verifyToken} disabled={!apifyToken.trim() || tokenStatus === "checking"} style={{
                    padding: "6px 18px", borderRadius: 50, border: `1px solid ${COLORS.orange500}`,
                    background: "transparent", color: COLORS.orange500, fontSize: 12, fontWeight: 600,
                    cursor: !apifyToken.trim() ? "not-allowed" : "pointer", transition: "all 0.2s",
                    opacity: !apifyToken.trim() ? 0.4 : 1,
                  }}>
                    {tokenStatus === "checking" ? "驗證中..." : "驗證 Token"}
                  </button>
                  {tokenStatus && tokenStatus !== "checking" && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: tokenStatus.valid ? COLORS.emerald : COLORS.red,
                    }}>
                      {tokenStatus.valid
                        ? `Token 有效 (${tokenStatus.user?.username || ""})`
                        : `Token 無效: ${tokenStatus.error || "未知錯誤"}`
                      }
                    </span>
                  )}
                </div>
              </div>


            </div>



          </div>
        )}
      </main>
    </div>
  );
}
