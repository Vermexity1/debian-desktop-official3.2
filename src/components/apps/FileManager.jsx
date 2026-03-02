import { useState, useEffect, useCallback, useRef } from "react";
import {
  Folder, FileText, ArrowLeft, ArrowUp, Home, Download, Image, Music, File,
  FolderPlus, FilePlus, Trash2, Edit3, Copy, Clipboard, Search, Grid, List,
  ChevronRight, HardDrive, RefreshCw,
} from "lucide-react";
import { fs } from "@/engines/filesystem";
import useDesktopStore from "@/store/desktopStore";

const SIDEBAR = [
  { path: "/home/user", icon: Home, label: "Home" },
  { path: "/home/user/Documents", icon: FileText, label: "Documents" },
  { path: "/home/user/Downloads", icon: Download, label: "Downloads" },
  { path: "/home/user/Pictures", icon: Image, label: "Pictures" },
  { path: "/home/user/Music", icon: Music, label: "Music" },
  { path: "/home/user/Desktop", icon: File, label: "Desktop" },
  { path: "/", icon: HardDrive, label: "Root" },
];

const FILE_ICONS = {
  ".txt": { icon: FileText, color: "#9a9996" },
  ".js": { icon: FileText, color: "#f8e45c" },
  ".jsx": { icon: FileText, color: "#61dafb" },
  ".py": { icon: FileText, color: "#3584e4" },
  ".html": { icon: FileText, color: "#e01b24" },
  ".css": { icon: FileText, color: "#3584e4" },
  ".json": { icon: FileText, color: "#26a269" },
  ".md": { icon: FileText, color: "#9a9996" },
  ".png": { icon: Image, color: "#9a9996" },
  ".jpg": { icon: Image, color: "#9a9996" },
  ".mp3": { icon: Music, color: "#9a9996" },
  ".desktop": { icon: File, color: "#3584e4" },
};

function getFileIcon(name) {
  const ext = "." + name.split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: FileText, color: "#9a9996" };
}

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState("/home/user");
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clipboard, setClipboard] = useState(null); // { path, op: 'copy'|'cut' }
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [searchQuery, setSearchQuery] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [history, setHistory] = useState(["/home/user"]);
  const [histIdx, setHistIdx] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const { openWindow, addNotification } = useDesktopStore();
  const renameRef = useRef(null);

  const loadDir = useCallback(async (path) => {
    const children = await fs.readDir(path);
    if (!children) return;
    const items = await Promise.all(children.map(async (name) => {
      const fullPath = path === "/" ? "/" + name : path + "/" + name;
      const node = fs.stat(fullPath);
      return { name, fullPath, ...(node || { type: "file" }) };
    }));
    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    });
    setEntries(items);
  }, []);

  useEffect(() => { loadDir(currentPath); }, [currentPath, loadDir]);

  useEffect(() => {
    if (renaming && renameRef.current) renameRef.current.focus();
  }, [renaming]);

  const navigate = (item) => {
    if (item.type === "dir") {
      const newPath = item.fullPath;
      const newHistory = [...history.slice(0, histIdx + 1), newPath];
      setHistory(newHistory);
      setHistIdx(newHistory.length - 1);
      setCurrentPath(newPath);
      setSelected(null);
    } else {
      // Open file with appropriate app
      const ext = item.name.split(".").pop().toLowerCase();
      if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
        openWindow("imageviewer", { filePath: item.fullPath });
      } else {
        openWindow("editor", { filePath: item.fullPath });
      }
    }
  };

  const goBack = () => {
    if (histIdx > 0) {
      const newIdx = histIdx - 1;
      setHistIdx(newIdx);
      setCurrentPath(history[newIdx]);
    }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) {
      const newIdx = histIdx + 1;
      setHistIdx(newIdx);
      setCurrentPath(history[newIdx]);
    }
  };

  const goUp = () => {
    const parent = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
    const newHistory = [...history.slice(0, histIdx + 1), parent];
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
    setCurrentPath(parent);
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name:", "New Folder");
    if (!name) return;
    const ok = await fs.mkdir(`${currentPath}/${name}`);
    if (ok) { loadDir(currentPath); addNotification(`Created: ${name}`); }
    else addNotification("Could not create folder");
  };

  const handleNewFile = async () => {
    const name = prompt("File name:", "untitled.txt");
    if (!name) return;
    await fs.writeFile(`${currentPath}/${name}`, "");
    loadDir(currentPath);
    addNotification(`Created: ${name}`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    await fs.rm(item.fullPath);
    if (selected === item.fullPath) setSelected(null);
    loadDir(currentPath);
    addNotification(`Deleted: ${item.name}`);
  };

  const handleRename = async (item) => {
    setRenaming(item.fullPath);
    setRenameValue(item.name);
  };

  const commitRename = async () => {
    if (!renaming || !renameValue.trim()) { setRenaming(null); return; }
    const item = entries.find((e) => e.fullPath === renaming);
    if (!item || item.name === renameValue.trim()) { setRenaming(null); return; }
    const newPath = `${currentPath}/${renameValue.trim()}`;
    await fs.mv(renaming, newPath);
    setRenaming(null);
    loadDir(currentPath);
  };

  const handleCopy = (item) => setClipboard({ path: item.fullPath, name: item.name, op: "copy" });
  const handleCut = (item) => setClipboard({ path: item.fullPath, name: item.name, op: "cut" });

  const handlePaste = async () => {
    if (!clipboard) return;
    const dst = `${currentPath}/${clipboard.name}`;
    if (clipboard.op === "copy") {
      await fs.cp(clipboard.path, dst);
      addNotification(`Copied: ${clipboard.name}`);
    } else {
      await fs.mv(clipboard.path, dst);
      setClipboard(null);
      addNotification(`Moved: ${clipboard.name}`);
    }
    loadDir(currentPath);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
    setSelected(item?.fullPath || null);
  };

  const closeContextMenu = () => setContextMenu(null);

  const filteredEntries = searchQuery.trim()
    ? entries.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries;

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="file-manager" data-testid="file-manager-app" onClick={closeContextMenu}>
      <div className="fm-sidebar">
        {SIDEBAR.map((s) => (
          <button
            key={s.path}
            className={`fm-sidebar-item ${currentPath === s.path ? "active" : ""}`}
            onClick={() => { setCurrentPath(s.path); setSelected(null); }}
            data-testid={`fm-sidebar-${s.label.toLowerCase()}`}
          >
            <s.icon size={16} />
            {s.label}
          </button>
        ))}
        {clipboard && (
          <div style={{ marginTop: 8, padding: "6px 12px", fontSize: "0.7rem", color: "#9a9996", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Clipboard size={12} style={{ display: "inline", marginRight: 4 }} />
            {clipboard.op === "copy" ? "Copied" : "Cut"}: {clipboard.name}
          </div>
        )}
      </div>

      <div className="fm-main">
        {/* Toolbar */}
        <div className="fm-toolbar">
          <button className="fm-toolbar-btn" onClick={goBack} disabled={histIdx === 0} title="Back" data-testid="fm-go-back">
            <ArrowLeft size={16} />
          </button>
          <button className="fm-toolbar-btn" onClick={goForward} disabled={histIdx === history.length - 1} title="Forward">
            <ArrowLeft size={16} style={{ transform: "scaleX(-1)" }} />
          </button>
          <button className="fm-toolbar-btn" onClick={goUp} disabled={currentPath === "/"} title="Up" data-testid="fm-go-up">
            <ArrowUp size={16} />
          </button>
          <button className="fm-toolbar-btn" onClick={() => loadDir(currentPath)} title="Refresh">
            <RefreshCw size={14} />
          </button>

          {/* Breadcrumb */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, fontSize: "0.75rem", color: "#9a9996", overflow: "hidden" }}>
            <button onClick={() => setCurrentPath("/")} style={{ background: "none", border: "none", color: "#9a9996", cursor: "pointer", padding: "2px 4px" }}>/</button>
            {pathParts.map((part, i) => {
              const path = "/" + pathParts.slice(0, i + 1).join("/");
              return (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ChevronRight size={12} />
                  <button onClick={() => setCurrentPath(path)} style={{ background: "none", border: "none", color: i === pathParts.length - 1 ? "white" : "#9a9996", cursor: "pointer", padding: "2px 4px" }}>{part}</button>
                </span>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 8px" }}>
            <Search size={12} color="#5e5c64" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{ background: "none", border: "none", color: "white", fontSize: "0.75rem", outline: "none", width: 100 }}
              data-testid="fm-search"
            />
          </div>

          <button className="fm-toolbar-btn" onClick={handleNewFolder} title="New Folder" data-testid="fm-new-folder"><FolderPlus size={16} /></button>
          <button className="fm-toolbar-btn" onClick={handleNewFile} title="New File" data-testid="fm-new-file"><FilePlus size={16} /></button>
          {clipboard && <button className="fm-toolbar-btn" onClick={handlePaste} title="Paste" data-testid="fm-paste"><Clipboard size={16} /></button>}
          <button className="fm-toolbar-btn" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} title="Toggle View">
            {viewMode === "grid" ? <List size={16} /> : <Grid size={16} />}
          </button>
        </div>

        {/* File Grid/List */}
        <div
          className={viewMode === "grid" ? "fm-grid" : "fm-list"}
          onContextMenu={(e) => handleContextMenu(e, null)}
          data-testid="fm-content"
        >
          {filteredEntries.length === 0 && (
            <div style={{ gridColumn: "1/-1", color: "#9a9996", padding: 20, textAlign: "center", fontSize: "0.875rem" }}>
              {searchQuery ? "No results found" : "Empty folder"}
            </div>
          )}
          {filteredEntries.map((item) => {
            const { icon: IconComp, color } = item.type === "dir" ? { icon: Folder, color: "#3584e4" } : getFileIcon(item.name);
            const isSelected = selected === item.fullPath;
            const isRenaming = renaming === item.fullPath;

            return viewMode === "grid" ? (
              <div
                key={item.name}
                className={`fm-item ${isSelected ? "fm-item-selected" : ""}`}
                onClick={(e) => { e.stopPropagation(); setSelected(item.fullPath); }}
                onDoubleClick={() => navigate(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                data-testid={`fm-item-${item.name}`}
                style={{ background: isSelected ? "rgba(53,132,228,0.15)" : undefined, borderRadius: 8, padding: 8 }}
              >
                <IconComp size={40} color={color} />
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "100%", background: "#1a1a1a", border: "1px solid #3584e4", borderRadius: 4, color: "white", fontSize: "0.7rem", textAlign: "center", padding: "2px 4px" }}
                  />
                ) : (
                  <span className="fm-item-name">{item.name}</span>
                )}
              </div>
            ) : (
              <div
                key={item.name}
                className={`fm-list-item ${isSelected ? "fm-item-selected" : ""}`}
                onClick={(e) => { e.stopPropagation(); setSelected(item.fullPath); }}
                onDoubleClick={() => navigate(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                data-testid={`fm-item-${item.name}`}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 4, background: isSelected ? "rgba(53,132,228,0.15)" : "transparent", cursor: "pointer" }}
              >
                <IconComp size={18} color={color} />
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, background: "#1a1a1a", border: "1px solid #3584e4", borderRadius: 4, color: "white", fontSize: "0.8rem", padding: "2px 6px" }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: "0.8rem", color: "white" }}>{item.name}</span>
                )}
                <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{item.type === "dir" ? "Folder" : item.size ? `${item.size} B` : ""}</span>
                {item.modified && <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{new Date(item.modified).toLocaleDateString()}</span>}
                <button className="fm-toolbar-btn" onClick={(e) => { e.stopPropagation(); handleDelete(item); }} style={{ opacity: 0.5, padding: 2 }} data-testid={`fm-delete-${item.name}`}><Trash2 size={12} /></button>
              </div>
            );
          })}
        </div>

        {/* Status bar */}
        <div style={{ padding: "4px 12px", fontSize: "0.7rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span>{filteredEntries.length} items</span>
          {selected && <span>{selected.split("/").pop()}</span>}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed", left: contextMenu.x, top: contextMenu.y, zIndex: 99999,
            background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
            padding: "4px 0", minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <button onClick={() => { navigate(contextMenu.item); closeContextMenu(); }} style={cmStyle}>
                {contextMenu.item.type === "dir" ? "Open" : "Open"}
              </button>
              <button onClick={() => { handleRename(contextMenu.item); closeContextMenu(); }} style={cmStyle}><Edit3 size={12} style={{ marginRight: 8 }} />Rename</button>
              <button onClick={() => { handleCopy(contextMenu.item); closeContextMenu(); }} style={cmStyle}><Copy size={12} style={{ marginRight: 8 }} />Copy</button>
              <button onClick={() => { handleCut(contextMenu.item); closeContextMenu(); }} style={cmStyle}><Clipboard size={12} style={{ marginRight: 8 }} />Cut</button>
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
              <button onClick={() => { handleDelete(contextMenu.item); closeContextMenu(); }} style={{ ...cmStyle, color: "#e01b24" }}><Trash2 size={12} style={{ marginRight: 8 }} />Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => { handleNewFolder(); closeContextMenu(); }} style={cmStyle}><FolderPlus size={12} style={{ marginRight: 8 }} />New Folder</button>
              <button onClick={() => { handleNewFile(); closeContextMenu(); }} style={cmStyle}><FilePlus size={12} style={{ marginRight: 8 }} />New File</button>
              {clipboard && <button onClick={() => { handlePaste(); closeContextMenu(); }} style={cmStyle}><Clipboard size={12} style={{ marginRight: 8 }} />Paste</button>}
              <button onClick={() => { loadDir(currentPath); closeContextMenu(); }} style={cmStyle}><RefreshCw size={12} style={{ marginRight: 8 }} />Refresh</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const cmStyle = {
  display: "flex", alignItems: "center", width: "100%", padding: "6px 14px",
  background: "none", border: "none", color: "white", fontSize: "0.8rem", cursor: "pointer",
  textAlign: "left",
};
