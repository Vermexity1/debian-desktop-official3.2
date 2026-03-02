import { useState, useEffect, useRef } from "react";
import { Play, Pause, Trash2, Plus, Settings, ArrowDown, ArrowUp, Search, FolderOpen } from "lucide-react";

const SAMPLE_TORRENTS = [
  { id: 1, name: "debian-12.4.0-amd64-netinst.iso", size: 628 * 1024 * 1024, downloaded: 628 * 1024 * 1024, progress: 100, status: "seeding", seeds: 142, peers: 0, downSpeed: 0, upSpeed: 45000, eta: null, added: "2024-01-10", ratio: 2.4 },
  { id: 2, name: "ubuntu-22.04.3-desktop-amd64.iso", size: 1.4 * 1024 * 1024 * 1024, downloaded: 980 * 1024 * 1024, progress: 68, status: "downloading", seeds: 89, peers: 12, downSpeed: 1200000, upSpeed: 23000, eta: 320, added: "2024-01-14", ratio: 0.3 },
  { id: 3, name: "archlinux-2024.01.01-x86_64.iso", size: 820 * 1024 * 1024, downloaded: 0, progress: 0, status: "paused", seeds: 0, peers: 0, downSpeed: 0, upSpeed: 0, eta: null, added: "2024-01-15", ratio: 0 },
  { id: 4, name: "linux-6.7.tar.xz", size: 230 * 1024 * 1024, downloaded: 230 * 1024 * 1024, progress: 100, status: "seeding", seeds: 34, peers: 0, downSpeed: 0, upSpeed: 12000, eta: null, added: "2024-01-12", ratio: 1.1 },
];

function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
}

function formatSpeed(bps) {
  if (bps >= 1024 * 1024) return (bps / (1024 * 1024)).toFixed(1) + " MB/s";
  if (bps >= 1024) return (bps / 1024).toFixed(0) + " KB/s";
  return bps + " B/s";
}

function formatETA(secs) {
  if (!secs) return "—";
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

export default function TransmissionApp() {
  const [torrents, setTorrents] = useState(SAMPLE_TORRENTS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [magnetUrl, setMagnetUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [downLimit, setDownLimit] = useState(0);
  const [upLimit, setUpLimit] = useState(0);
  const fileInputRef = useRef(null);

  // Simulate download progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTorrents((prev) => prev.map((t) => {
        if (t.status !== "downloading") return t;
        const newDownloaded = Math.min(t.size, t.downloaded + t.downSpeed);
        const newProgress = (newDownloaded / t.size) * 100;
        if (newProgress >= 100) return { ...t, downloaded: t.size, progress: 100, status: "seeding", downSpeed: 0, upSpeed: Math.floor(Math.random() * 50000) };
        const newEta = t.downSpeed > 0 ? Math.floor((t.size - newDownloaded) / t.downSpeed) : null;
        return { ...t, downloaded: newDownloaded, progress: newProgress, eta: newEta };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const togglePause = (id) => {
    setTorrents((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      if (t.status === "paused") return { ...t, status: t.progress < 100 ? "downloading" : "seeding", downSpeed: t.progress < 100 ? Math.floor(Math.random() * 2000000) : 0, upSpeed: Math.floor(Math.random() * 50000) };
      return { ...t, status: "paused", downSpeed: 0, upSpeed: 0 };
    }));
  };

  const removeTorrent = (id) => {
    setTorrents((prev) => prev.filter((t) => t.id !== id));
    if (selected === id) setSelected(null);
  };

  const addMagnet = () => {
    if (!magnetUrl.trim()) return;
    const name = magnetUrl.includes("dn=") ? decodeURIComponent(magnetUrl.split("dn=")[1].split("&")[0]) : "New Torrent";
    setTorrents((prev) => [...prev, {
      id: Date.now(), name, size: Math.floor(Math.random() * 2 * 1024 * 1024 * 1024),
      downloaded: 0, progress: 0, status: "downloading",
      seeds: Math.floor(Math.random() * 100), peers: Math.floor(Math.random() * 20),
      downSpeed: Math.floor(Math.random() * 1500000), upSpeed: 0,
      eta: Math.floor(Math.random() * 3600), added: new Date().toISOString().split("T")[0], ratio: 0,
    }]);
    setMagnetUrl("");
    setShowAdd(false);
  };

  const filteredTorrents = torrents.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter || (filter === "active" && (t.status === "downloading" || t.status === "seeding"));
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const selectedTorrent = torrents.find((t) => t.id === selected);
  const totalDown = torrents.reduce((s, t) => s + t.downSpeed, 0);
  const totalUp = torrents.reduce((s, t) => s + t.upSpeed, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" }} data-testid="transmission-app">
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => setShowAdd(true)} style={tbBtn}><Plus size={14} />Add Torrent</button>
        <button onClick={() => fileInputRef.current?.click()} style={tbBtn}><FolderOpen size={14} />Open File</button>
        <input ref={fileInputRef} type="file" accept=".torrent" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) { const f = e.target.files[0]; setTorrents((p) => [...p, { id: Date.now(), name: f.name.replace(".torrent", ""), size: Math.floor(Math.random() * 2e9), downloaded: 0, progress: 0, status: "downloading", seeds: 45, peers: 8, downSpeed: 800000, upSpeed: 0, eta: 1200, added: new Date().toISOString().split("T")[0], ratio: 0 }]); } }} />
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        {selected && (
          <>
            <button onClick={() => togglePause(selected)} style={tbBtn}>
              {torrents.find((t) => t.id === selected)?.status === "paused" ? <Play size={14} /> : <Pause size={14} />}
              {torrents.find((t) => t.id === selected)?.status === "paused" ? "Resume" : "Pause"}
            </button>
            <button onClick={() => removeTorrent(selected)} style={{ ...tbBtn, color: "#e01b24" }}><Trash2 size={14} />Remove</button>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 8px" }}>
          <Search size={12} color="#5e5c64" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ background: "none", border: "none", color: "white", fontSize: "0.75rem", outline: "none", width: 120 }} />
        </div>
        <button onClick={() => setShowSettings(!showSettings)} style={{ ...tbBtn, color: showSettings ? "#3584e4" : undefined }}><Settings size={14} /></button>
      </div>

      {/* Add torrent panel */}
      {showAdd && (
        <div style={{ padding: "10px 12px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, alignItems: "center" }}>
          <input value={magnetUrl} onChange={(e) => setMagnetUrl(e.target.value)} placeholder="Paste magnet link or torrent URL..." style={{ flex: 1, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "5px 8px", fontSize: "0.8rem", outline: "none" }} />
          <button onClick={addMagnet} style={{ padding: "5px 14px", background: "#3584e4", border: "none", borderRadius: 4, color: "white", cursor: "pointer", fontSize: "0.8rem" }}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ padding: "5px 10px", background: "#353535", border: "none", borderRadius: 4, color: "#9a9996", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div style={{ padding: "10px 12px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowDown size={12} color="#26a269" />
            <span style={{ fontSize: "0.75rem", color: "#9a9996" }}>Down limit:</span>
            <input type="number" value={downLimit} onChange={(e) => setDownLimit(Number(e.target.value))} style={{ width: 70, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "2px 6px", fontSize: "0.75rem" }} />
            <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>KB/s (0=unlimited)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowUp size={12} color="#3584e4" />
            <span style={{ fontSize: "0.75rem", color: "#9a9996" }}>Up limit:</span>
            <input type="number" value={upLimit} onChange={(e) => setUpLimit(Number(e.target.value))} style={{ width: 70, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "2px 6px", fontSize: "0.75rem" }} />
            <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>KB/s (0=unlimited)</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 0, padding: "0 8px", background: "#1e1e1e", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {["all", "active", "downloading", "seeding", "paused"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 12px", background: "none", border: "none", color: filter === f ? "#3584e4" : "#5e5c64", cursor: "pointer", fontSize: "0.75rem", borderBottom: filter === f ? "2px solid #3584e4" : "2px solid transparent", textTransform: "capitalize" }}>
            {f} ({f === "all" ? torrents.length : f === "active" ? torrents.filter((t) => t.status === "downloading" || t.status === "seeding").length : torrents.filter((t) => t.status === f).length})
          </button>
        ))}
      </div>

      {/* Torrent list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
          <thead>
            <tr style={{ background: "#252525", color: "#5e5c64" }}>
              {["Name", "Size", "Progress", "Status", "Seeds", "Down", "Up", "ETA", "Ratio"].map((h) => (
                <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTorrents.map((t) => (
              <tr key={t.id} onClick={() => setSelected(t.id === selected ? null : t.id)} style={{ background: selected === t.id ? "rgba(53,132,228,0.1)" : "transparent", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "8px 8px", color: "white", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.9rem" }}>{t.status === "downloading" ? "⬇️" : t.status === "seeding" ? "⬆️" : "⏸"}</span>
                    <span>{t.name}</span>
                  </div>
                </td>
                <td style={{ padding: "8px 8px", color: "#9a9996", whiteSpace: "nowrap" }}>{formatSize(t.size)}</td>
                <td style={{ padding: "8px 8px", minWidth: 100 }}>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 3, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${t.progress}%`, height: "100%", background: t.status === "seeding" ? "#26a269" : "#3584e4", transition: "width 0.5s" }} />
                  </div>
                  <span style={{ color: "#9a9996", fontSize: "0.65rem" }}>{t.progress.toFixed(1)}%</span>
                </td>
                <td style={{ padding: "8px 8px", color: t.status === "downloading" ? "#3584e4" : t.status === "seeding" ? "#26a269" : "#9a9996", textTransform: "capitalize" }}>{t.status}</td>
                <td style={{ padding: "8px 8px", color: "#9a9996" }}>{t.seeds}</td>
                <td style={{ padding: "8px 8px", color: "#26a269" }}>{t.downSpeed > 0 ? formatSpeed(t.downSpeed) : "—"}</td>
                <td style={{ padding: "8px 8px", color: "#3584e4" }}>{t.upSpeed > 0 ? formatSpeed(t.upSpeed) : "—"}</td>
                <td style={{ padding: "8px 8px", color: "#9a9996" }}>{formatETA(t.eta)}</td>
                <td style={{ padding: "8px 8px", color: t.ratio >= 1 ? "#26a269" : "#9a9996" }}>{t.ratio.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTorrents.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#5e5c64", fontSize: "0.875rem" }}>No torrents found</div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ padding: "4px 12px", fontSize: "0.65rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, background: "#1a1a1a" }}>
        <span>{torrents.length} torrents</span>
        <span style={{ color: "#26a269" }}><ArrowDown size={10} style={{ display: "inline" }} /> {formatSpeed(totalDown)}</span>
        <span style={{ color: "#3584e4" }}><ArrowUp size={10} style={{ display: "inline" }} /> {formatSpeed(totalUp)}</span>
        <span>Free space: 45.2 GB</span>
      </div>
    </div>
  );
}

const tbBtn = {
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  padding: "4px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem",
};
