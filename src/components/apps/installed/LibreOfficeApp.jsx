import { useState, useRef } from "react";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Link, Table, Save, FilePlus,
  Printer, Undo, Redo, Search, Type, Strikethrough, X,
} from "lucide-react";

const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Helvetica"];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export default function LibreOfficeApp({ onClose }) {
  const editorRef = useRef(null);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(12);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [modified, setModified] = useState(false);
  const [fileName, setFileName] = useState("Document1");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [zoom, setZoom] = useState(100);
  const [showTable, setShowTable] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const exec = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      updateStats();
    }
  };

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
    setModified(true);
  };

  const applyFont = (font) => {
    setFontFamily(font);
    exec("fontName", font);
  };

  const applyFontSize = (size) => {
    setFontSize(size);
    exec("fontSize", Math.ceil(size / 4));
  };

  const insertTable = () => {
    let html = `<table border="1" style="border-collapse:collapse;width:100%;margin:8px 0">`;
    for (let r = 0; r < tableRows; r++) {
      html += "<tr>";
      for (let c = 0; c < tableCols; c++) {
        html += r === 0
          ? `<th style="padding:6px 10px;background:#f0f0f0;border:1px solid #ccc">Header ${c + 1}</th>`
          : `<td style="padding:6px 10px;border:1px solid #ccc">&nbsp;</td>`;
      }
      html += "</tr>";
    }
    html += "</table><p><br></p>";
    exec("insertHTML", html);
    setShowTable(false);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    const content = editorRef.current?.innerHTML || "";
    const highlighted = content.replace(
      new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      (m) => `<mark style="background:#f8e45c;color:#000">${m}</mark>`
    );
    if (editorRef.current) editorRef.current.innerHTML = highlighted;
  };

  const handleReplace = () => {
    if (!searchTerm) return;
    const content = editorRef.current?.innerHTML || "";
    const replaced = content.replace(
      new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      replaceTerm
    );
    if (editorRef.current) editorRef.current.innerHTML = replaced;
  };

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || "";
    const blob = new Blob([`<!DOCTYPE html><html><body>${content}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName + ".html";
    a.click();
    setModified(false);
  };

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${fileName}</title><style>body{font-family:Arial;margin:2cm;}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleNew = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setModified(false);
      setFileName("Document1");
    }
  };

  const toolbarBtn = (cmd, icon, title, value = null) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, value); }}
      className="p-1 hover:bg-gray-300 rounded text-gray-700"
      title={title}
    >{icon}</button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-bold text-sm">LibreOffice Writer - {fileName}</span>
        <button onClick={onClose} className="hover:bg-blue-800 p-1 rounded">
          <X size={18} />
        </button>
      </div>

      {/* Menu bar */}
      <div className="flex items-center gap-2 p-2 bg-gray-200 border-b border-gray-300 flex-wrap">
        <button onClick={handleNew} className="p-1 hover:bg-gray-300 rounded flex items-center gap-1 text-sm"><FilePlus size={14} />New</button>
        <button onClick={handleSave} className="p-1 hover:bg-gray-300 rounded flex items-center gap-1 text-sm"><Save size={14} />Save</button>
        <button onClick={handlePrint} className="p-1 hover:bg-gray-300 rounded flex items-center gap-1 text-sm"><Printer size={14} />Print</button>
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        <button onMouseDown={(e) => { e.preventDefault(); exec("undo"); }} className="p-1 hover:bg-gray-300 rounded"><Undo size={14} /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec("redo"); }} className="p-1 hover:bg-gray-300 rounded"><Redo size={14} /></button>
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        <button onClick={() => setShowSearch(!showSearch)} className={`p-1 rounded flex items-center gap-1 text-sm ${showSearch ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}><Search size={14} />Find</button>
        <div className="flex-1"></div>
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="bg-white border border-gray-300 rounded px-2 py-1 text-sm w-40"
        />
        {modified && <span className="text-xs text-red-600">● Modified</span>}
        <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="bg-white border border-gray-300 rounded px-2 py-1 text-xs">
          {[50, 75, 100, 125, 150, 200].map((z) => <option key={z} value={z}>{z}%</option>)}
        </select>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-200 border-b border-gray-300 flex-wrap">
        <select value={fontFamily} onChange={(e) => applyFont(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-32">
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={fontSize} onChange={(e) => applyFontSize(Number(e.target.value))} className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-16">
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        {toolbarBtn("bold", <Bold size={14} />, "Bold (Ctrl+B)")}
        {toolbarBtn("italic", <Italic size={14} />, "Italic (Ctrl+I)")}
        {toolbarBtn("underline", <Underline size={14} />, "Underline (Ctrl+U)")}
        {toolbarBtn("strikeThrough", <Strikethrough size={14} />, "Strikethrough")}
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        {toolbarBtn("justifyLeft", <AlignLeft size={14} />, "Align Left")}
        {toolbarBtn("justifyCenter", <AlignCenter size={14} />, "Center")}
        {toolbarBtn("justifyRight", <AlignRight size={14} />, "Align Right")}
        {toolbarBtn("justifyFull", <AlignJustify size={14} />, "Justify")}
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        {toolbarBtn("insertUnorderedList", <List size={14} />, "Bullet List")}
        {toolbarBtn("insertOrderedList", <ListOrdered size={14} />, "Numbered List")}
        {toolbarBtn("indent", <Indent size={14} />, "Indent")}
        {toolbarBtn("outdent", <Outdent size={14} />, "Outdent")}
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        <button onMouseDown={(e) => { e.preventDefault(); insertLink(); }} className="p-1 hover:bg-gray-300 rounded" title="Insert Link"><Link size={14} /></button>
        <button onMouseDown={(e) => { e.preventDefault(); setShowTable(!showTable); }} className="p-1 hover:bg-gray-300 rounded" title="Insert Table"><Table size={14} /></button>
        <div className="w-px h-5 bg-gray-400 mx-1"></div>
        <label className="flex items-center gap-1 cursor-pointer" title="Text Color">
          <Type size={14} />
          <input type="color" defaultValue="#000000" onChange={(e) => exec("foreColor", e.target.value)} className="w-6 h-6 border border-gray-300 rounded cursor-pointer" />
        </label>
        <label className="flex items-center gap-1 cursor-pointer" title="Highlight">
          <span className="text-xs">H</span>
          <input type="color" defaultValue="#ffff00" onChange={(e) => exec("hiliteColor", e.target.value)} className="w-6 h-6 border border-gray-300 rounded cursor-pointer" />
        </label>
      </div>

      {/* Table insert panel */}
      {showTable && (
        <div className="flex items-center gap-4 p-2 bg-gray-200 border-b border-gray-300">
          <span className="text-xs">Rows:</span>
          <input type="number" min={1} max={20} value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} className="w-12 px-2 py-1 border border-gray-300 rounded text-xs" />
          <span className="text-xs">Cols:</span>
          <input type="number" min={1} max={20} value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} className="w-12 px-2 py-1 border border-gray-300 rounded text-xs" />
          <button onClick={insertTable} className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Insert</button>
          <button onClick={() => setShowTable(false)} className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500">Cancel</button>
        </div>
      )}

      {/* Find/Replace */}
      {showSearch && (
        <div className="flex items-center gap-2 p-2 bg-gray-200 border-b border-gray-300 flex-wrap">
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Find..." className="px-2 py-1 border border-gray-300 rounded text-xs w-40" />
          <input value={replaceTerm} onChange={(e) => setReplaceTerm(e.target.value)} placeholder="Replace..." className="px-2 py-1 border border-gray-300 rounded text-xs w-40" />
          <button onClick={handleSearch} className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Find</button>
          <button onClick={handleReplace} className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">Replace All</button>
        </div>
      )}

      {/* Document area */}
      <div className="flex-1 overflow-auto bg-white p-4">
        <div
          ref={editorRef}
          contentEditable
          onInput={updateStats}
          suppressContentEditableWarning
          style={{
            fontFamily: fontFamily,
            fontSize: fontSize + "px",
            minHeight: "100%",
            outline: "none",
            padding: "20px",
            backgroundColor: "white",
            border: "1px solid #ddd",
          }}
          className="prose prose-sm max-w-none"
        >
          Start typing your document here...
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-200 border-t border-gray-300 px-4 py-2 text-xs text-gray-700 flex justify-between">
        <span>Words: {wordCount} | Characters: {charCount}</span>
        <span>Ready</span>
      </div>
    </div>
  );
}
