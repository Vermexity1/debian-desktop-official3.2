import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft, ArrowRight, RefreshCw, X, Plus, Home, Bookmark, BookmarkCheck,
  Star, History, Shield, Lock, Globe, Search,
} from "lucide-react";

const DEFAULT_BOOKMARKS = [
  { title: "Google", url: "https://www.google.com", icon: "🔍" },
  { title: "Wikipedia", url: "https://en.wikipedia.org", icon: "📖" },
  { title: "GitHub", url: "https://github.com", icon: "🐙" },
  { title: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
  { title: "Reddit", url: "https://www.reddit.com", icon: "🔴" },
  { title: "BBC News", url: "https://www.bbc.com/news", icon: "📰" },
];

const SEARCH_BASE = "https://www.google.com/search?q=";

function normalizeUrl(str) {
  str = str.trim();
  if (!str) return "about:blank";
  if (/^https?:\/\//i.test(str)) return str;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(str)) return "https://" + str;
  return SEARCH_BASE + encodeURIComponent(str);
}

function getDisplayTitle(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch { return url; }
}

export default function WebBrowser() {
  const [tabs, setTabs] = useState([
    { id: 1, url: "about:blank", title: "New Tab", loading: false, history: ["about:blank"], histIdx: 0 },
  ]);
  const [activeTab, setActiveTab] = useState(1);
  const [urlInput, setUrlInput] = useState("");
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [browserHistory, setBrowserHistory] = useState([]);
  const iframeRef = useRef(null);

  const currentTab = tabs.find((t) => t.id === activeTab);

  const navigate = useCallback((rawUrl, tabId) => {
    const tid = tabId ?? activeTab;
    const url = normalizeUrl(rawUrl);
    setTabs(prev => prev.map(t => {
      if (t.id !== tid) return t;
      const newHistory = [...t.history.slice(0, t.histIdx + 1), url];
      return { ...t, url, loading: url !== "about:blank", title: url === "about:blank" ? "New Tab" : "Loading...", history: newHistory, histIdx: newHistory.length - 1 };
    }));
    setUrlInput(url === "about:blank" ? "" : url);
    if (url !== "about:blank") setBrowserHistory(h => [{ url, time: new Date() }, ...h.slice(0, 99)]);
    setShowBookmarks(false); setShowHistory(false);
  }, [activeTab]);

  const handleSubmit = (e) => { e.preventDefault(); navigate(urlInput); };

  const goBack = () => setTabs(prev => prev.map(t => {
    if (t.id !== activeTab || t.histIdx <= 0) return t;
    const idx = t.histIdx - 1;
    const url = t.history[idx];
    setUrlInput(url === "about:blank" ? "" : url);
    return { ...t, url, histIdx: idx, loading: url !== "about:blank", title: url === "about:blank" ? "New Tab" : "Loading..." };
  }));

  const goForward = () => setTabs(prev => prev.map(t => {
    if (t.id !== activeTab || t.histIdx >= t.history.length - 1) return t;
    const idx = t.histIdx + 1;
    const url = t.history[idx];
    setUrlInput(url === "about:blank" ? "" : url);
    return { ...t, url, histIdx: idx, loading: url !== "about:blank", title: url === "about:blank" ? "New Tab" : "Loading..." };
  }));

  const refresh = () => {
    if (!currentTab || currentTab.url === "about:blank") return;
    setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, loading: true } : t));
    if (iframeRef.current) iframeRef.current.src = currentTab.url;
  };

  const newTab = () => {
    const id = Date.now();
    setTabs(prev => [...prev, { id, url: "about:blank", title: "New Tab", loading: false, history: ["about:blank"], histIdx: 0 }]);
    setActiveTab(id); setUrlInput("");
  };

  const closeTab = (tid, e) => {
    e.stopPropagation();
    const rem = tabs.filter(t => t.id !== tid);
    if (rem.length === 0) { newTab(); return; }
    setTabs(rem);
    if (activeTab === tid) {
      const last = rem[rem.length - 1];
      setActiveTab(last.id); setUrlInput(last.url === "about:blank" ? "" : last.url);
    }
  };

  const toggleBookmark = () => {
    if (!currentTab || currentTab.url === "about:blank") return;
    const ex = bookmarks.find(b => b.url === currentTab.url);
    if (ex) setBookmarks(b => b.filter(bk => bk.url !== currentTab.url));
    else setBookmarks(b => [...b, { title: getDisplayTitle(currentTab.url), url: currentTab.url, icon: "⭐" }]);
  };

  const onLoad = (tid) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== tid) return t;
      let title = getDisplayTitle(t.url);
      try { title = iframeRef.current?.contentDocument?.title || title; } catch {}
      return { ...t, loading: false, title };
    }));
  };

  const isBookmarked = bookmarks.some(b => b.url === currentTab?.url);

  return (
    <div className="web-browser" style={{ flexDirection: "column" }}>
      {/* Tabs */}
      <div style={{ display:"flex", alignItems:"center", background:"#1a1a1a", borderBottom:"1px solid rgba(255,255,255,0.08)", overflowX:"auto", minHeight:36 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => { setActiveTab(tab.id); setUrlInput(tab.url === "about:blank" ? "" : tab.url); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", cursor:"pointer", background:tab.id===activeTab?"#2a2a2a":"transparent", borderRight:"1px solid rgba(255,255,255,0.06)", minWidth:120, maxWidth:200, flexShrink:0, borderTop:tab.id===activeTab?"2px solid #3584e4":"2px solid transparent" }}>
            {tab.loading
              ? <div style={{ width:12,height:12,border:"2px solid #333",borderTop:"2px solid #3584e4",borderRadius:"50%",animation:"bspin 0.7s linear infinite",flexShrink:0 }} />
              : <Globe size={12} color="#5e5c64" style={{ flexShrink:0 }} />}
            <span style={{ flex:1, fontSize:"0.75rem", color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tab.title}</span>
            <button onClick={e => closeTab(tab.id, e)} style={{ background:"none",border:"none",color:"#5e5c64",cursor:"pointer",padding:2,borderRadius:2,flexShrink:0 }}><X size={10}/></button>
          </div>
        ))}
        <button onClick={newTab} style={{ padding:"6px 10px",background:"none",border:"none",color:"#9a9996",cursor:"pointer",flexShrink:0 }}><Plus size={14}/></button>
        <style>{`@keyframes bspin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* Nav */}
      <div className="browser-nav" style={{ gap:6, padding:"6px 8px" }}>
        <button className="browser-nav-btn" onClick={goBack} disabled={!currentTab||currentTab.histIdx<=0}><ArrowLeft size={16}/></button>
        <button className="browser-nav-btn" onClick={goForward} disabled={!currentTab||currentTab.histIdx>=currentTab.history.length-1}><ArrowRight size={16}/></button>
        <button className="browser-nav-btn" onClick={refresh}><RefreshCw size={14}/></button>
        <button className="browser-nav-btn" onClick={() => navigate("about:blank")}><Home size={14}/></button>

        <form onSubmit={handleSubmit} style={{ flex:1, display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.07)", borderRadius:20, padding:"4px 12px" }}>
          {currentTab?.url?.startsWith("https") ? <Lock size={12} color="#26a269"/> : <Globe size={12} color="#5e5c64"/>}
          <input className="browser-url-input" value={urlInput} onChange={e=>setUrlInput(e.target.value)} onFocus={e=>e.target.select()} placeholder="Search Google or enter a URL..."
            style={{ flex:1, background:"none", border:"none", outline:"none", color:"white", fontSize:"0.8rem" }} />
          {urlInput && <button type="button" onClick={()=>setUrlInput("")} style={{ background:"none",border:"none",color:"#5e5c64",cursor:"pointer",padding:0 }}><X size={12}/></button>}
        </form>

        <button className="browser-nav-btn" onClick={toggleBookmark} style={{ color:isBookmarked?"#f8e45c":undefined }}>{isBookmarked?<BookmarkCheck size={14}/>:<Bookmark size={14}/>}</button>
        <button className="browser-nav-btn" onClick={()=>{setShowBookmarks(!showBookmarks);setShowHistory(false);}} style={{ color:showBookmarks?"#3584e4":undefined }}><Star size={14}/></button>
        <button className="browser-nav-btn" onClick={()=>{setShowHistory(!showHistory);setShowBookmarks(false);}} style={{ color:showHistory?"#3584e4":undefined }}><History size={14}/></button>
        <button className="browser-nav-btn"><Shield size={14}/></button>
      </div>

      {/* Bookmarks bar */}
      <div className="browser-bookmarks-bar">
        {DEFAULT_BOOKMARKS.map(b => (
          <button key={b.url} onClick={()=>navigate(b.url)} style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",background:"none",border:"none",color:"#9a9996",cursor:"pointer",fontSize:"0.7rem",borderRadius:4,whiteSpace:"nowrap",flexShrink:0 }}>
            <span>{b.icon}</span>{b.title}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        {showBookmarks && (
          <div style={{ position:"absolute",top:0,right:0,width:280,height:"100%",background:"#1e1e1e",borderLeft:"1px solid rgba(255,255,255,0.08)",zIndex:10,overflowY:"auto",padding:12 }}>
            <div style={{ fontWeight:600,color:"white",marginBottom:12,fontSize:"0.875rem" }}>Bookmarks</div>
            {bookmarks.map(b => (
              <button key={b.url} onClick={()=>navigate(b.url)} style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px",background:"none",border:"none",color:"white",cursor:"pointer",borderRadius:6,fontSize:"0.8rem",textAlign:"left" }}>
                <span>{b.icon}</span>
                <div><div>{b.title}</div><div style={{ fontSize:"0.65rem",color:"#5e5c64",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200 }}>{b.url}</div></div>
              </button>
            ))}
          </div>
        )}
        {showHistory && (
          <div style={{ position:"absolute",top:0,right:0,width:280,height:"100%",background:"#1e1e1e",borderLeft:"1px solid rgba(255,255,255,0.08)",zIndex:10,overflowY:"auto",padding:12 }}>
            <div style={{ fontWeight:600,color:"white",marginBottom:12,fontSize:"0.875rem" }}>History</div>
            {browserHistory.length===0 && <div style={{ fontSize:"0.75rem",color:"#5e5c64" }}>No history yet</div>}
            {browserHistory.map((h,i) => (
              <button key={i} onClick={()=>navigate(h.url)} style={{ display:"flex",flexDirection:"column",width:"100%",padding:"6px 8px",background:"none",border:"none",color:"white",cursor:"pointer",borderRadius:6,fontSize:"0.8rem",textAlign:"left" }}>
                <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:240 }}>{getDisplayTitle(h.url)}</span>
                <span style={{ fontSize:"0.65rem",color:"#5e5c64" }}>{h.time.toLocaleTimeString()}</span>
              </button>
            ))}
          </div>
        )}

        {/* New Tab page */}
        {currentTab?.url === "about:blank" && (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:24,background:"#181818" }}>
            <div style={{ fontSize:"1.4rem",color:"#666",fontWeight:300 }}>New Tab</div>
            <form onSubmit={handleSubmit} style={{ width:"100%",maxWidth:520,padding:"0 24px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.09)",borderRadius:28,padding:"12px 18px",border:"1px solid rgba(255,255,255,0.09)" }}>
                <Search size={16} color="#5e5c64"/>
                <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="Search Google or enter a URL"
                  style={{ flex:1,background:"none",border:"none",outline:"none",color:"white",fontSize:"0.95rem" }} autoFocus />
              </div>
            </form>
            <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",maxWidth:520,padding:"0 24px" }}>
              {DEFAULT_BOOKMARKS.map(b => (
                <button key={b.url} onClick={()=>navigate(b.url)}
                  style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 16px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,color:"white",cursor:"pointer",minWidth:78 }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}>
                  <span style={{ fontSize:"1.6rem" }}>{b.icon}</span>
                  <span style={{ fontSize:"0.72rem",color:"#aaa" }}>{b.title}</span>
                </button>
              ))}
            </div>
            <div style={{ color:"#444",fontSize:"0.72rem",textAlign:"center" }}>Note: Some sites (e.g. Google) block iframe embedding for security. Try Wikipedia, BBC, GitHub.</div>
          </div>
        )}

        {/* Real iframe */}
        {currentTab && currentTab.url !== "about:blank" && (
          <iframe
            ref={iframeRef}
            key={currentTab.url}
            src={currentTab.url}
            style={{ width:"100%",height:"100%",border:"none",display:"block",background:"white" }}
            onLoad={() => onLoad(currentTab.id)}
            title="Browser content"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation allow-downloads"
          />
        )}
      </div>
    </div>
  );
}
