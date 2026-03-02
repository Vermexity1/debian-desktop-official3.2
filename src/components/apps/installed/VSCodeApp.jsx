import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, Save, X, Search, Settings, Play, Terminal, GitBranch, Package } from "lucide-react";
import { fs } from "@/engines/filesystem";

const THEMES = {
  "One Dark": { bg: "#282c34", sidebar: "#21252b", editor: "#282c34", text: "#abb2bf", lineNum: "#4b5263", accent: "#528bff" },
  "Monokai": { bg: "#272822", sidebar: "#1e1f1c", editor: "#272822", text: "#f8f8f2", lineNum: "#75715e", accent: "#66d9e8" },
  "Solarized Dark": { bg: "#002b36", sidebar: "#073642", editor: "#002b36", text: "#839496", lineNum: "#586e75", accent: "#268bd2" },
  "GitHub Dark": { bg: "#0d1117", sidebar: "#161b22", editor: "#0d1117", text: "#c9d1d9", lineNum: "#484f58", accent: "#58a6ff" },
};

const LANG_COLORS = {
  js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
  py: "#3572A5", html: "#e34c26", css: "#563d7c", json: "#292929",
  md: "#083fa1", sh: "#89e051", txt: "#9a9996",
};

function getExt(name) { return name.split(".").pop().toLowerCase(); }
function getLangColor(name) { return LANG_COLORS[getExt(name)] || "#9a9996"; }

function tokenize(code, lang) {
  let result = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (lang === "js" || lang === "jsx" || lang === "ts" || lang === "tsx") {
    result = result
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|new|this|typeof|instanceof|null|undefined|true|false|void|delete|in|of|switch|case|break|continue|try|catch|finally|throw|yield)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span style="color:#98c379">$1</span>')
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');
  } else if (lang === "py") {
    result = result
      .replace(/\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|pass|break|continue|with|as|try|except|finally|raise|lambda|yield|global|nonlocal|print)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#98c379">$1</span>')
      .replace(/(#[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');
  } else if (lang === "html") {
    result = result
      .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span style="color:#e06c75">$1</span>')
      .replace(/([a-zA-Z-]+=)(\"(?:[^\"\\]|\\.)*\")/g, '<span style="color:#d19a66">$1</span><span style="color:#98c379">$2</span>');
  } else if (lang === "css") {
    result = result
      .replace(/([.#]?[a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g, '<span style="color:#e06c75">$1</span>{')
      .replace(/([\w-]+)\s*:/g, '<span style="color:#61afef">$1</span>:')
      .replace(/:\s*([^;{}\n]+)/g, ': <span style="color:#98c379">$1</span>');
  } else if (lang === "json") {
    result = result
      .replace(/(\"(?:[^\"\\]|\\.)*\")\s*:/g, '<span style="color:#e06c75">$1</span>:')
      .replace(/:\s*(\"(?:[^\"\\]|\\.)*\")/g, ': <span style="color:#98c379">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#d19a66">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');
  }
  return result;
}

function runCode(content, ext) {
  const output = [];
  const log = (...args) => output.push(args.map(String).join(" "));

  if (ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx") {
    try {
      const fn = new Function("console", content);
      fn({ log, error: log, warn: log, info: log });
      if (output.length === 0) output.push("(no output)");
    } catch (e) {
      output.push(`\x1b[31mError: ${e.message}\x1b[0m`);
    }
  } else if (ext === "py") {
    // Simulate basic Python execution
    const lines = content.split("\n");
    try {
      for (const line of lines) {
        const printMatch = line.match(/^\s*print\s*\((.+)\)\s*$/);
        if (printMatch) {
          try {
            const val = Function('"use strict"; return (' + printMatch[1] + ")")();
            log(String(val));
          } catch {
            log(printMatch[1].replace(/['"]/g, ""));
          }
        }
      }
      if (output.length === 0) output.push("(script ran with no output)");
    } catch (e) {
      output.push(`Error: ${e.message}`);
    }
  } else if (ext === "sh") {
    output.push("Shell script execution (simulated):");
    content.split("\n").filter(l => l.trim() && !l.startsWith("#")).forEach(l => {
      output.push(`$ ${l.trim()}`);
    });
  } else {
    output.push(`Cannot run .${ext} files directly.`);
    output.push(`Supported: .js, .jsx, .ts, .tsx, .py, .sh`);
  }
  return output;
}

export default function VSCodeApp() {
  const [theme, setTheme] = useState("One Dark");
  const colors = THEMES[theme];
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [modified, setModified] = useState({});
  const [sidebarTab, setSidebarTab] = useState("explorer");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState([{ text: "VS Code Integrated Terminal", color: "#26a269" }, { text: "Type commands below. Run code with the ▶ button or Ctrl+Enter.", color: "#858585" }]);
  const [termInput, setTermInput] = useState("");
  const [termCwd, setTermCwd] = useState("/home/user");
  const [expandedDirs, setExpandedDirs] = useState({ "/home/user": true });
  const [dirContents, setDirContents] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newFileDialog, setNewFileDialog] = useState(null); // null | { type: 'file'|'folder', parent: string }
  const [newFileName, setNewFileName] = useState("");
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const terminalOutputRef = useRef(null);
  const newFileInputRef = useRef(null);

  const loadDir = useCallback(async (path) => {
    const children = await fs.readDir(path);
    if (children) {
      setDirContents((d) => ({ ...d, [path]: children }));
    }
  }, []);

  useEffect(() => { loadDir("/home/user"); }, [loadDir]);

  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    if (newFileDialog && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [newFileDialog]);

  const toggleDir = async (path) => {
    setExpandedDirs((e) => ({ ...e, [path]: !e[path] }));
    if (!expandedDirs[path]) await loadDir(path);
  };

  const openFile = async (path) => {
    if (!openFiles.includes(path)) {
      const content = await fs.readFile(path);
      setFileContents((c) => ({ ...c, [path]: content || "" }));
      setOpenFiles((f) => [...f, path]);
    }
    setActiveFile(path);
  };

  const closeFile = (path, e) => {
    e.stopPropagation();
    if (modified[path] && !window.confirm("Close without saving?")) return;
    setOpenFiles((f) => f.filter((p) => p !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((p) => p !== path);
      setActiveFile(remaining[remaining.length - 1] || null);
    }
    setModified((m) => { const next = { ...m }; delete next[path]; return next; });
  };

  const saveFile = useCallback(async () => {
    if (!activeFile) return;
    await fs.writeFile(activeFile, fileContents[activeFile] || "");
    setModified((m) => ({ ...m, [activeFile]: false }));
    setTerminalLines(l => [...l, { text: `Saved: ${activeFile}`, color: "#26a269" }]);
    // Refresh dir
    loadDir(activeFile.substring(0, activeFile.lastIndexOf("/")));
  }, [activeFile, fileContents, loadDir]);

  const createNewFile = async () => {
    if (!newFileName.trim() || !newFileDialog) return;
    const fullPath = newFileDialog.parent + "/" + newFileName.trim();
    if (newFileDialog.type === "folder") {
      await fs.mkdir(fullPath);
    } else {
      await fs.writeFile(fullPath, "");
    }
    await loadDir(newFileDialog.parent);
    setExpandedDirs(e => ({ ...e, [newFileDialog.parent]: true }));
    setNewFileDialog(null);
    setNewFileName("");
    if (newFileDialog.type === "file") {
      openFile(fullPath);
    }
  };

  const runActiveFile = useCallback(() => {
    if (!activeFile) return;
    const ext = getExt(activeFile.split("/").pop());
    const content = fileContents[activeFile] || "";
    setShowTerminal(true);
    setTerminalLines(l => [
      ...l,
      { text: `$ run ${activeFile.split("/").pop()}`, color: "#858585" },
    ]);
    const output = runCode(content, ext);
    setTerminalLines(l => [
      ...l,
      ...output.map(text => ({ text, color: text.includes("Error") ? "#e01b24" : "#abb2bf" })),
      { text: "─".repeat(40), color: "#3c3c3c" },
    ]);
  }, [activeFile, fileContents]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveFile(); }
      if (e.ctrlKey && e.key === "`") { e.preventDefault(); setShowTerminal((t) => !t); }
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); runActiveFile(); }
      if (e.key === "Escape" && newFileDialog) { setNewFileDialog(null); setNewFileName(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile, runActiveFile, newFileDialog]);

  const handleEdit = (value) => {
    if (!activeFile) return;
    setFileContents((c) => ({ ...c, [activeFile]: value }));
    setModified((m) => ({ ...m, [activeFile]: true }));
  };

  const handleTab = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const content = fileContents[activeFile] || "";
      const newContent = content.slice(0, start) + "  " + content.slice(end);
      handleEdit(newContent);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleTermCommand = async (cmd) => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    const addLine = (text, color = "#abb2bf") => setTerminalLines(l => [...l, { text, color }]);

    addLine(`${termCwd.replace("/home/user", "~")}$ ${cmd}`, "#858585");

    const resolvePath = (p) => {
      if (!p || p === "~") return "/home/user";
      if (p.startsWith("~")) return "/home/user" + p.slice(1);
      if (p.startsWith("/")) return p;
      const parts2 = (termCwd + "/" + p).split("/").filter(Boolean);
      const resolved = [];
      for (const part of parts2) {
        if (part === ".") continue;
        if (part === "..") resolved.pop();
        else resolved.push(part);
      }
      return "/" + resolved.join("/");
    };

    switch (command) {
      case "clear": setTerminalLines([]); break;
      case "pwd": addLine(termCwd); break;
      case "ls": {
        const path = resolvePath(args[0] || termCwd);
        const children = await fs.readDir(path);
        if (!children) { addLine(`ls: ${path}: No such file or directory`, "#e01b24"); break; }
        addLine(children.join("  "));
        break;
      }
      case "cd": {
        const target = resolvePath(args[0] || "/home/user");
        const children = await fs.readDir(target);
        if (children === null) { addLine(`cd: ${args[0]}: Not a directory`, "#e01b24"); break; }
        setTermCwd(target);
        break;
      }
      case "mkdir": {
        if (!args[0]) { addLine("mkdir: missing operand", "#e01b24"); break; }
        await fs.mkdir(resolvePath(args[0]));
        loadDir(termCwd);
        await loadDir("/home/user");
        break;
      }
      case "touch": {
        if (!args[0]) { addLine("touch: missing operand", "#e01b24"); break; }
        await fs.writeFile(resolvePath(args[0]), "");
        loadDir(termCwd);
        await loadDir("/home/user");
        break;
      }
      case "cat": {
        if (!args[0]) { addLine("cat: missing operand", "#e01b24"); break; }
        const content = await fs.readFile(resolvePath(args[0]));
        if (content === null) { addLine(`cat: ${args[0]}: No such file`, "#e01b24"); break; }
        content.split("\n").forEach(line => addLine(line));
        break;
      }
      case "node":
      case "python3":
      case "python": {
        const filePath = resolvePath(args[0]);
        const content = await fs.readFile(filePath);
        if (content === null) { addLine(`${command}: ${args[0]}: No such file`, "#e01b24"); break; }
        const ext = command === "node" ? "js" : "py";
        const output = runCode(content, ext);
        output.forEach(line => addLine(line, line.includes("Error") ? "#e01b24" : "#abb2bf"));
        break;
      }
      case "run": {
        const filePath = resolvePath(args[0]);
        const content = await fs.readFile(filePath);
        if (content === null) { addLine(`run: ${args[0]}: No such file`, "#e01b24"); break; }
        const ext = getExt(args[0]);
        const output = runCode(content, ext);
        output.forEach(line => addLine(line, line.includes("Error") ? "#e01b24" : "#abb2bf"));
        break;
      }
      case "echo": addLine(args.join(" ")); break;
      case "help":
        addLine("Available commands: ls, cd, pwd, mkdir, touch, cat, echo, node, python3, run <file>, clear");
        break;
      default:
        addLine(`${command}: command not found`, "#e01b24");
        addLine("Type 'help' for available commands", "#858585");
    }
  };

  const activeContent = activeFile ? (fileContents[activeFile] || "") : "";
  const activeExt = activeFile ? getExt(activeFile.split("/").pop()) : "txt";
  const lines = activeContent.split("\n");

  const handleSearch = async () => {
    if (!searchQuery) return;
    const results = [];
    const searchDir = async (path) => {
      const children = await fs.readDir(path);
      if (!children) return;
      for (const child of children) {
        const fp = path + "/" + child;
        const node = fs.stat(fp);
        if (node?.type === "file") {
          const content = await fs.readFile(fp);
          if (content?.includes(searchQuery)) {
            const matchLines = content.split("\n").filter((l) => l.includes(searchQuery));
            results.push({ file: fp, matches: matchLines.slice(0, 3) });
          }
        } else if (node?.type === "dir") {
          await searchDir(fp);
        }
      }
    };
    await searchDir("/home/user");
    setSearchResults(results);
  };

  const renderTree = (path, depth = 0) => {
    const children = dirContents[path] || [];
    return children.map((name) => {
      const fullPath = path + "/" + name;
      const node = fs.stat(fullPath);
      const isDir = node?.type === "dir";
      return (
        <div key={fullPath}>
          <div
            onClick={() => isDir ? toggleDir(fullPath) : openFile(fullPath)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: `2px 8px 2px ${depth * 12 + 8}px`,
              cursor: "pointer", fontSize: "0.75rem",
              color: activeFile === fullPath ? "white" : "#abb2bf",
              background: activeFile === fullPath ? "rgba(82,139,255,0.2)" : "transparent",
            }}
          >
            {isDir ? (
              expandedDirs[fullPath] ? <ChevronDown size={10} /> : <ChevronRight size={10} />
            ) : (
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: getLangColor(name), display: "inline-block", flexShrink: 0 }} />
            )}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{name}</span>
          </div>
          {isDir && expandedDirs[fullPath] && renderTree(fullPath, depth + 1)}
        </div>
      );
    });
  };

  const canRun = activeFile && ["js","jsx","ts","tsx","py","sh"].includes(activeExt);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: colors.bg, color: colors.text, fontFamily: "'Fira Code', monospace" }} data-testid="vscode-app">
      {/* Menu bar */}
      <div style={{ height: 28, background: "#3c3c3c", display: "flex", alignItems: "center", gap: 0, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {["File", "Edit", "View", "Run", "Terminal", "Help"].map((menu) => (
          <button
            key={menu}
            onClick={menu === "Run" ? runActiveFile : menu === "Terminal" ? () => setShowTerminal(t => !t) : undefined}
            style={{ background: "none", border: "none", color: "#cccccc", cursor: "pointer", padding: "0 10px", height: "100%", fontSize: "0.75rem", transition: "background 0.1s" }}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.target.style.background = "none"}
          >{menu}</button>
        ))}
        <div style={{ flex: 1 }} />
        {/* New file buttons in top bar */}
        <button
          onClick={() => { setNewFileDialog({ type: "file", parent: "/home/user" }); setNewFileName(""); }}
          title="New File"
          style={{ background: "none", border: "none", color: "#cccccc", cursor: "pointer", padding: "0 8px", height: "100%", display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        ><FilePlus size={14} /> New File</button>
        <button
          onClick={() => { setNewFileDialog({ type: "folder", parent: "/home/user" }); setNewFileName(""); }}
          title="New Folder"
          style={{ background: "none", border: "none", color: "#cccccc", cursor: "pointer", padding: "0 8px", height: "100%", display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        ><FolderPlus size={14} /> New Folder</button>
        {canRun && (
          <button
            onClick={runActiveFile}
            title="Run File (Ctrl+Enter)"
            style={{ background: "#0dbc79", border: "none", color: "white", cursor: "pointer", padding: "0 12px", height: "100%", display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = "#0a9e63"}
            onMouseLeave={e => e.currentTarget.style.background = "#0dbc79"}
          ><Play size={12} fill="white" /> Run</button>
        )}
        {activeFile && (
          <button
            onClick={saveFile}
            title="Save (Ctrl+S)"
            style={{ background: "none", border: "none", color: modified[activeFile] ? "#e2c08d" : "#858585", cursor: "pointer", padding: "0 8px", height: "100%", display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          ><Save size={14} /></button>
        )}
      </div>

      {/* New file dialog */}
      {newFileDialog && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, paddingTop: 80 }}>
          <div style={{ background: "#252526", border: "1px solid #555", borderRadius: 6, padding: 20, width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "0.85rem", color: "white", marginBottom: 12 }}>
              {newFileDialog.type === "folder" ? "New Folder" : "New File"}
            </div>
            <input
              ref={newFileInputRef}
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createNewFile(); if (e.key === "Escape") { setNewFileDialog(null); setNewFileName(""); } }}
              placeholder={newFileDialog.type === "folder" ? "folder-name" : "filename.js"}
              style={{ width: "100%", background: "#3c3c3c", border: "1px solid #007acc", borderRadius: 4, color: "white", padding: "6px 8px", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setNewFileDialog(null); setNewFileName(""); }} style={{ background: "#3c3c3c", border: "none", color: "#abb2bf", cursor: "pointer", padding: "6px 14px", borderRadius: 4, fontSize: "0.75rem" }}>Cancel</button>
              <button onClick={createNewFile} style={{ background: "#007acc", border: "none", color: "white", cursor: "pointer", padding: "6px 14px", borderRadius: 4, fontSize: "0.75rem" }}>Create</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Activity bar */}
        <div style={{ width: 44, background: "#333333", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 8, flexShrink: 0 }}>
          {[
            { id: "explorer", icon: <span style={{ fontSize: "1rem" }}>📁</span>, label: "Explorer" },
            { id: "search", icon: <Search size={18} />, label: "Search" },
            { id: "git", icon: <GitBranch size={18} />, label: "Source Control" },
            { id: "extensions", icon: <Package size={18} />, label: "Extensions" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setSidebarTab(item.id); setShowSidebar(sidebarTab !== item.id || !showSidebar); }}
              title={item.label}
              style={{
                width: 36, height: 36, background: "none", border: "none",
                color: sidebarTab === item.id && showSidebar ? "white" : "#858585",
                cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                borderLeft: sidebarTab === item.id && showSidebar ? "2px solid white" : "2px solid transparent",
              }}
            >{item.icon}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => {}} style={{ width: 36, height: 36, background: "none", border: "none", color: "#858585", cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Settings size={18} />
          </button>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div style={{ width: 220, background: colors.sidebar, borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ padding: "8px 12px", fontSize: "0.65rem", color: "#858585", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{sidebarTab === "explorer" ? "Explorer" : sidebarTab === "search" ? "Search" : sidebarTab === "git" ? "Source Control" : "Extensions"}</span>
              {sidebarTab === "explorer" && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { setNewFileDialog({ type: "file", parent: "/home/user" }); setNewFileName(""); }} title="New File" style={{ background: "none", border: "none", color: "#858585", cursor: "pointer", padding: 2 }}><FilePlus size={14} /></button>
                  <button onClick={() => { setNewFileDialog({ type: "folder", parent: "/home/user" }); setNewFileName(""); }} title="New Folder" style={{ background: "none", border: "none", color: "#858585", cursor: "pointer", padding: 2 }}><FolderPlus size={14} /></button>
                </div>
              )}
            </div>

            {sidebarTab === "explorer" && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ padding: "4px 8px", fontSize: "0.7rem", color: "#858585", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>OPEN EDITORS</span>
                </div>
                {openFiles.map((f) => (
                  <div key={f} onClick={() => setActiveFile(f)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", cursor: "pointer", background: activeFile === f ? "rgba(82,139,255,0.2)" : "transparent", fontSize: "0.75rem", color: activeFile === f ? "white" : "#abb2bf" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: getLangColor(f.split("/").pop()), flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.split("/").pop()}</span>
                    {modified[f] && <span style={{ color: "#e2c08d", fontSize: "0.6rem" }}>●</span>}
                    <button onClick={(e) => closeFile(f, e)} style={{ background: "none", border: "none", color: "#858585", cursor: "pointer", padding: 0, opacity: 0.6 }}><X size={10} /></button>
                  </div>
                ))}
                <div style={{ padding: "4px 8px", fontSize: "0.7rem", color: "#858585", marginTop: 4 }}>FILES</div>
                {renderTree("/home/user")}
              </div>
            )}

            {sidebarTab === "search" && (
              <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search..."
                  style={{ background: "#3c3c3c", border: "1px solid #555", borderRadius: 4, color: "white", padding: "4px 8px", fontSize: "0.75rem", outline: "none" }}
                />
                <button onClick={handleSearch} style={{ padding: "4px 8px", background: "#0e639c", border: "none", borderRadius: 4, color: "white", cursor: "pointer", fontSize: "0.75rem" }}>Search</button>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {searchResults.map((r, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div onClick={() => openFile(r.file)} style={{ fontSize: "0.75rem", color: "#e2c08d", cursor: "pointer", marginBottom: 2 }}>{r.file.split("/").pop()}</div>
                      {r.matches.map((m, j) => (
                        <div key={j} style={{ fontSize: "0.7rem", color: "#abb2bf", paddingLeft: 8, fontFamily: "monospace" }}>{m.trim().slice(0, 60)}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === "git" && (
              <div style={{ flex: 1, padding: 12 }}>
                <div style={{ fontSize: "0.75rem", color: "#abb2bf", marginBottom: 8 }}>
                  <div style={{ marginBottom: 4 }}>Branch: <span style={{ color: "#e2c08d" }}>main</span></div>
                  <div style={{ marginBottom: 4 }}>Changes: {Object.keys(modified).filter((k) => modified[k]).length}</div>
                </div>
                {Object.keys(modified).filter((k) => modified[k]).map((f) => (
                  <div key={f} style={{ fontSize: "0.7rem", color: "#e2c08d", padding: "2px 0" }}>M {f.split("/").pop()}</div>
                ))}
              </div>
            )}

            {sidebarTab === "extensions" && (
              <div style={{ flex: 1, padding: 8 }}>
                {["ESLint", "Prettier", "GitLens", "Python", "Tailwind CSS"].map((ext) => (
                  <div key={ext} style={{ padding: "6px 8px", fontSize: "0.75rem", color: "#abb2bf", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "white" }}>{ext}</div>
                    <div style={{ fontSize: "0.65rem", color: "#858585" }}>Installed</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#252526", borderBottom: "1px solid rgba(255,255,255,0.08)", overflowX: "auto", flexShrink: 0 }}>
            {openFiles.map((f) => (
              <div
                key={f}
                onClick={() => setActiveFile(f)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  background: activeFile === f ? colors.bg : "transparent",
                  borderTop: activeFile === f ? `2px solid ${colors.accent}` : "2px solid transparent",
                  cursor: "pointer", flexShrink: 0, minWidth: 80, maxWidth: 160,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: getLangColor(f.split("/").pop()), flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", color: activeFile === f ? "white" : "#858585", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.split("/").pop()}
                </span>
                {modified[f] && <span style={{ color: "#e2c08d", fontSize: "0.6rem" }}>●</span>}
                <button onClick={(e) => closeFile(f, e)} style={{ background: "none", border: "none", color: "#858585", cursor: "pointer", padding: 0, opacity: 0.6, flexShrink: 0 }}><X size={10} /></button>
              </div>
            ))}
          </div>

          {/* Editor */}
          {activeFile ? (
            <div style={{ flex: 1, display: "flex", overflow: "hidden", fontSize: "13px", lineHeight: "1.6" }}>
              {/* Line numbers */}
              <div style={{ width: 44, background: colors.bg, padding: "12px 0", overflowY: "hidden", flexShrink: 0, userSelect: "none", textAlign: "right", color: colors.lineNum, fontSize: "12px" }}>
                {lines.map((_, i) => <div key={i} style={{ paddingRight: 8 }}>{i + 1}</div>)}
              </div>
              {/* Code area */}
              <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <div
                  ref={highlightRef}
                  style={{ position: "absolute", inset: 0, padding: "12px 12px", whiteSpace: "pre", overflowY: "auto", overflowX: "auto", color: colors.text, pointerEvents: "none", zIndex: 1 }}
                  dangerouslySetInnerHTML={{ __html: tokenize(activeContent, activeExt) + "\n" }}
                />
                <textarea
                  ref={textareaRef}
                  value={activeContent}
                  onChange={(e) => handleEdit(e.target.value)}
                  onKeyDown={handleTab}
                  onScroll={syncScroll}
                  spellCheck={false}
                  style={{
                    position: "absolute", inset: 0, padding: "12px 12px",
                    background: "transparent", border: "none", outline: "none",
                    resize: "none", color: "transparent", caretColor: "white",
                    fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit",
                    whiteSpace: "pre", overflowY: "auto", overflowX: "auto", zIndex: 2,
                  }}
                  data-testid="vscode-editor"
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#858585" }}>
              <div style={{ fontSize: "3rem" }}>⌨️</div>
              <div style={{ fontSize: "1rem" }}>Visual Studio Code</div>
              <div style={{ fontSize: "0.8rem" }}>Open a file or create a new one to start editing</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setNewFileDialog({ type: "file", parent: "/home/user" }); setNewFileName(""); }} style={{ padding: "8px 16px", background: "#0e639c", border: "none", borderRadius: 4, color: "white", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}><FilePlus size={14} /> New File</button>
                <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ background: "#3c3c3c", border: "1px solid #555", borderRadius: 4, color: "white", padding: "4px 8px", fontSize: "0.75rem" }}>
                  {Object.keys(THEMES).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Integrated terminal */}
          {showTerminal && (
            <div style={{ height: 200, background: "#1e1e1e", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "4px 8px", background: "#252526", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "0.7rem", color: "#858585" }}>TERMINAL</span>
                {canRun && (
                  <button onClick={runActiveFile} style={{ marginLeft: 8, background: "#0dbc79", border: "none", color: "white", cursor: "pointer", padding: "2px 8px", borderRadius: 3, fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 3 }}>
                    <Play size={10} fill="white" /> Run {activeFile?.split("/").pop()}
                  </button>
                )}
                <div style={{ flex: 1 }} />
                <button onClick={() => setTerminalLines([])} style={{ background: "none", border: "none", color: "#858585", cursor: "pointer", fontSize: "0.65rem", marginRight: 4 }}>Clear</button>
                <button onClick={() => setShowTerminal(false)} style={{ background: "none", border: "none", color: "#858585", cursor: "pointer" }}><X size={12} /></button>
              </div>
              <div ref={terminalOutputRef} style={{ flex: 1, overflowY: "auto", padding: "4px 8px", fontFamily: "monospace", fontSize: "0.8rem" }}>
                {terminalLines.map((line, i) => (
                  <div key={i} style={{ color: line.color || "#abb2bf", whiteSpace: "pre-wrap" }}>{line.text}</div>
                ))}
              </div>
              <div style={{ display: "flex", padding: "4px 8px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#26a269", fontSize: "0.8rem", marginRight: 4 }}>{termCwd.replace("/home/user", "~")}$</span>
                <input
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && termInput.trim()) {
                      handleTermCommand(termInput.trim());
                      setTermInput("");
                    }
                  }}
                  placeholder="type a command..."
                  style={{ flex: 1, background: "none", border: "none", color: "white", outline: "none", fontFamily: "monospace", fontSize: "0.8rem" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ height: 22, background: colors.accent, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", fontSize: "0.65rem", color: "white", flexShrink: 0 }}>
        <GitBranch size={10} />
        <span>main</span>
        <span style={{ flex: 1 }} />
        {activeFile && (
          <>
            <span>{activeFile.split("/").pop()}</span>
            <span>{activeExt.toUpperCase()}</span>
            <span>{lines.length} lines</span>
            {canRun && <span style={{ opacity: 0.8 }}>Ctrl+Enter to run</span>}
          </>
        )}
        <button onClick={() => setShowTerminal(!showTerminal)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 2 }}>
          <Terminal size={10} />Terminal
        </button>
      </div>
    </div>
  );
}

