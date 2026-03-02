import { useState, useEffect, useRef, useCallback } from "react";
import { Save, FolderOpen, FilePlus, Search, Replace, Hash, AlignLeft, Copy, Scissors } from "lucide-react";
import { fs } from "@/engines/filesystem";
import useDesktopStore from "@/store/desktopStore";

const LANGUAGES = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", html: "html", css: "css", json: "json", md: "markdown",
  sh: "bash", txt: "text",
};

function detectLanguage(path) {
  const ext = path.split(".").pop().toLowerCase();
  return LANGUAGES[ext] || "text";
}

// Simple token-based syntax highlighting
function highlight(code, lang) {
  if (lang === "text" || lang === "markdown") return escapeHtml(code);
  let result = escapeHtml(code);
  if (lang === "javascript" || lang === "typescript") {
    result = result
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|new|this|typeof|instanceof|null|undefined|true|false)\b/g, '<span style="color:#c792ea">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span style="color:#c3e88d">$1</span>')
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#546e7a;font-style:italic">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>')
      .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span style="color:#ffcb6b">$1</span>');
  } else if (lang === "python") {
    result = result
      .replace(/\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|pass|break|continue|with|as|try|except|finally|raise|lambda|yield|global|nonlocal)\b/g, '<span style="color:#c792ea">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#c3e88d">$1</span>')
      .replace(/(#[^\n]*)/g, '<span style="color:#546e7a;font-style:italic">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
  } else if (lang === "html") {
    result = result
      .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span style="color:#f07178">$1</span>')
      .replace(/([a-zA-Z-]+=)("(?:[^"\\]|\\.)*")/g, '<span style="color:#ffcb6b">$1</span><span style="color:#c3e88d">$2</span>');
  } else if (lang === "css") {
    result = result
      .replace(/([.#]?[a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g, '<span style="color:#ffcb6b">$1</span>{')
      .replace(/([\w-]+)\s*:/g, '<span style="color:#89ddff">$1</span>:')
      .replace(/:\s*([^;{}\n]+)/g, ': <span style="color:#c3e88d">$1</span>');
  } else if (lang === "json") {
    result = result
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#89ddff">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#c3e88d">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#c792ea">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
  }
  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function TextEditor({ windowId }) {
  const { windows, updateWindow, addNotification } = useDesktopStore();
  const win = windows[windowId];
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState(win?.props?.filePath || "");
  const [modified, setModified] = useState(false);
  const [language, setLanguage] = useState("text");
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wrapLines, setWrapLines] = useState(true);
  const [fontSize, setFontSize] = useState(13);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (filePath) {
      fs.readFile(filePath).then((text) => {
        if (text !== null) {
          setContent(text);
          setModified(false);
          const name = filePath.split("/").pop();
          setLanguage(detectLanguage(filePath));
          updateWindow(windowId, { title: `Text Editor — ${name}` });
        }
      });
    }
  }, [filePath]);

  const handleSave = useCallback(async () => {
    if (!filePath) {
      const path = prompt("Save as (full path):", "/home/user/Documents/untitled.txt");
      if (!path) return;
      setFilePath(path);
      setLanguage(detectLanguage(path));
      await fs.writeFile(path, content);
      updateWindow(windowId, { title: `Text Editor — ${path.split("/").pop()}` });
    } else {
      await fs.writeFile(filePath, content);
    }
    setModified(false);
    addNotification("File saved");
  }, [filePath, content, windowId, updateWindow, addNotification]);

  // Ctrl+S save
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.ctrlKey && e.key === "f") { e.preventDefault(); setShowSearch((s) => !s); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleOpen = async () => {
    const path = prompt("Open file (full path):", "/home/user/Documents/");
    if (!path) return;
    const text = await fs.readFile(path);
    if (text !== null) {
      setContent(text);
      setFilePath(path);
      setModified(false);
      setLanguage(detectLanguage(path));
      updateWindow(windowId, { title: `Text Editor — ${path.split("/").pop()}` });
    } else {
      addNotification("File not found");
    }
  };

  const handleNew = () => {
    setContent("");
    setFilePath("");
    setModified(false);
    setLanguage("text");
    updateWindow(windowId, { title: "Text Editor" });
  };

  const handleReplace = () => {
    if (!searchTerm) return;
    const flags = matchCase ? "g" : "gi";
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
    const newContent = content.replace(regex, replaceTerm);
    setContent(newContent);
    setModified(true);
  };

  const handleTab = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const newContent = content.slice(0, start) + "  " + content.slice(end);
      setContent(newContent);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  // Sync scroll between textarea and highlight div
  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const lines = content.split("\n");
  const lineCount = lines.length;
  const charCount = content.length;

  const highlightedCode = highlight(content, language);

  return (
    <div className="text-editor" data-testid="text-editor-app" style={{ flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="editor-toolbar" style={{ flexWrap: "wrap", gap: 4 }}>
        <button className="editor-toolbar-btn" onClick={handleNew} data-testid="editor-new"><FilePlus size={14} style={{ marginRight: 4 }} />New</button>
        <button className="editor-toolbar-btn" onClick={handleOpen} data-testid="editor-open"><FolderOpen size={14} style={{ marginRight: 4 }} />Open</button>
        <button className="editor-toolbar-btn" onClick={handleSave} data-testid="editor-save"><Save size={14} style={{ marginRight: 4 }} />Save</button>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button className="editor-toolbar-btn" onClick={() => setShowSearch(!showSearch)} style={{ color: showSearch ? "#3584e4" : undefined }}><Search size={14} style={{ marginRight: 4 }} />Find</button>
        <button className="editor-toolbar-btn" onClick={() => setShowLineNumbers(!showLineNumbers)} style={{ color: showLineNumbers ? "#3584e4" : undefined }}><Hash size={14} /></button>
        <button className="editor-toolbar-btn" onClick={() => setWrapLines(!wrapLines)} style={{ color: wrapLines ? "#3584e4" : undefined }}><AlignLeft size={14} /></button>
        <div style={{ flex: 1 }} />
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#9a9996", padding: "2px 6px", fontSize: "0.7rem" }}>
          {Object.values(LANGUAGES).filter((v, i, a) => a.indexOf(v) === i).map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#9a9996", padding: "2px 6px", fontSize: "0.7rem" }}>
          {[10, 11, 12, 13, 14, 16, 18, 20].map((s) => <option key={s} value={s}>{s}px</option>)}
        </select>
        {modified && <span style={{ fontSize: "0.7rem", color: "#f8e45c" }}>● Modified</span>}
      </div>

      {/* Find/Replace bar */}
      {showSearch && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#2a2a2a", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
          <Search size={12} color="#5e5c64" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Find..."
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "3px 8px", fontSize: "0.8rem", width: 140 }}
            data-testid="editor-search-input"
          />
          <Replace size={12} color="#5e5c64" />
          <input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace..."
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "3px 8px", fontSize: "0.8rem", width: 140 }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#9a9996", cursor: "pointer" }}>
            <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} style={{ accentColor: "#3584e4" }} />
            Aa
          </label>
          <button onClick={handleReplace} style={{ padding: "3px 10px", background: "#3584e4", border: "none", borderRadius: 4, color: "white", cursor: "pointer", fontSize: "0.75rem" }}>Replace All</button>
        </div>
      )}

      {/* Editor area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: `${fontSize}px` }}>
        {/* Line numbers */}
        {showLineNumbers && (
          <div style={{
            width: 40, background: "#1a1a1a", borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "12px 0", overflowY: "hidden", flexShrink: 0, userSelect: "none",
            lineHeight: "1.6", color: "#5e5c64", textAlign: "right", fontSize: `${fontSize}px`,
          }}>
            {lines.map((_, i) => (
              <div key={i} style={{ paddingRight: 8 }}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Syntax highlight overlay + textarea */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div
            ref={highlightRef}
            style={{
              position: "absolute", inset: 0, padding: "12px 12px",
              whiteSpace: wrapLines ? "pre-wrap" : "pre",
              wordBreak: wrapLines ? "break-all" : "normal",
              overflowY: "auto", overflowX: "auto",
              lineHeight: 1.6, color: "#eeeeec",
              pointerEvents: "none", zIndex: 1,
            }}
            dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }}
          />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              const newVal = e.target.value;
              setContent(newVal);
              setModified(true);
            }}
            onKeyDown={handleTab}
            onScroll={syncScroll}
            spellCheck={false}
            style={{
              position: "absolute", inset: 0, padding: "12px 12px",
              background: "transparent", border: "none", outline: "none",
              resize: "none", color: "transparent", caretColor: "white",
              fontFamily: "inherit", fontSize: "inherit", lineHeight: 1.6,
              whiteSpace: wrapLines ? "pre-wrap" : "pre",
              wordBreak: wrapLines ? "break-all" : "normal",
              overflowY: "auto", overflowX: "auto",
              zIndex: 2,
            }}
            data-testid="editor-textarea"
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "3px 12px", fontSize: "0.65rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, background: "#1a1a1a" }}>
        <span>{lineCount} lines</span>
        <span>{charCount} chars</span>
        <span>{language}</span>
        {filePath && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filePath}</span>}
      </div>
    </div>
  );
}
