import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Search, Bold, Italic, List, Hash, Eye, Edit3, Tag } from "lucide-react";
import { fs } from "@/engines/filesystem";

const NOTES_DIR = "/home/user/Notes";

function renderMarkdown(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br/>");
}

const COLORS = ["#1a1a1a", "#1a2a1a", "#2a1a1a", "#1a1a2a", "#2a2a1a", "#1a2a2a"];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [noteColors, setNoteColors] = useState({});
  const textareaRef = useRef(null);

  const loadNotes = useCallback(async () => {
    const children = await fs.readDir(NOTES_DIR);
    if (!children) return;
    const loaded = [];
    for (const name of children) {
      const path = `${NOTES_DIR}/${name}`;
      const node = fs.stat(path);
      if (node && node.type === "file") {
        const text = await fs.readFile(path);
        loaded.push({ name, path, content: text || "", modified: node.modified });
      }
    }
    loaded.sort((a, b) => (b.modified || 0) - (a.modified || 0));
    setNotes(loaded);
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const selectNote = async (note) => {
    setSelected(note.path);
    setTitle(note.name.replace(/\.txt$/, "").replace(/\.md$/, ""));
    setContent(note.content);
    setNoteColor(noteColors[note.path] || COLORS[0]);
    setPreviewMode(false);
  };

  const saveNote = useCallback(async () => {
    if (!selected) return;
    await fs.writeFile(selected, content);
    loadNotes();
  }, [selected, content, loadNotes]);

  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(saveNote, 600);
    return () => clearTimeout(timer);
  }, [content, saveNote]);

  const createNote = async () => {
    const name = prompt("Note name:", "New Note");
    if (!name) return;
    const path = `${NOTES_DIR}/${name}.md`;
    await fs.writeFile(path, `# ${name}\n\n`);
    await loadNotes();
    setSelected(path);
    setTitle(name);
    setContent(`# ${name}\n\n`);
    setNoteColor(COLORS[0]);
  };

  const deleteNote = async (notePath, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    await fs.rm(notePath);
    if (selected === notePath) { setSelected(null); setTitle(""); setContent(""); }
    loadNotes();
  };

  const insertFormatting = (before, after = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const newContent = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split("\n").length;

  const filteredNotes = searchQuery.trim()
    ? notes.filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

  return (
    <div className="notes-app" data-testid="notes-app">
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h3>Notes</h3>
          <button className="fm-toolbar-btn" onClick={createNote} data-testid="notes-create" title="New Note"><Plus size={16} /></button>
        </div>
        <div style={{ padding: "4px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 8px" }}>
            <Search size={12} color="#5e5c64" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              style={{ background: "none", border: "none", color: "white", fontSize: "0.75rem", outline: "none", width: "100%" }}
              data-testid="notes-search"
            />
          </div>
        </div>
        <div className="notes-list">
          {filteredNotes.length === 0 && (
            <div style={{ padding: 16, fontSize: "0.75rem", color: "#5e5c64", textAlign: "center" }}>
              {searchQuery ? "No results" : "No notes yet"}
            </div>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.path}
              className={`notes-list-item ${selected === note.path ? "active" : ""}`}
              onClick={() => selectNote(note)}
              data-testid={`notes-item-${note.name}`}
              style={{ background: selected === note.path ? "rgba(53,132,228,0.15)" : noteColors[note.path] ? noteColors[note.path] + "33" : undefined }}
            >
              <span className="notes-list-item-title">{note.name.replace(/\.(txt|md)$/, "")}</span>
              <span className="notes-list-item-date">{new Date(note.modified).toLocaleDateString()}</span>
              <span style={{ fontSize: "0.65rem", color: "#5e5c64", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                {note.content.replace(/^#+ /, "").slice(0, 50)}
              </span>
              <button
                className="fm-toolbar-btn"
                onClick={(e) => deleteNote(note.path, e)}
                style={{ alignSelf: "flex-end", opacity: 0.4, padding: 2 }}
                data-testid={`notes-delete-${note.name}`}
              ><Trash2 size={11} /></button>
            </button>
          ))}
        </div>
      </div>

      <div className="notes-editor">
        {selected ? (
          <>
            {/* Formatting toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
              <button onClick={() => insertFormatting("**", "**")} style={fmtBtn} title="Bold"><Bold size={13} /></button>
              <button onClick={() => insertFormatting("*", "*")} style={fmtBtn} title="Italic"><Italic size={13} /></button>
              <button onClick={() => insertFormatting("# ")} style={fmtBtn} title="Heading"><Hash size={13} /></button>
              <button onClick={() => insertFormatting("- ")} style={fmtBtn} title="List"><List size={13} /></button>
              <button onClick={() => insertFormatting("`", "`")} style={fmtBtn} title="Code"><span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>`</span></button>
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
              <button
                onClick={() => setPreviewMode(!previewMode)}
                style={{ ...fmtBtn, color: previewMode ? "#3584e4" : undefined }}
                title={previewMode ? "Edit" : "Preview"}
              >{previewMode ? <Edit3 size={13} /> : <Eye size={13} />}</button>
              <div style={{ flex: 1 }} />
              {/* Color picker */}
              <div style={{ display: "flex", gap: 3 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setNoteColor(c); setNoteColors((nc) => ({ ...nc, [selected]: c })); }}
                    style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: noteColor === c ? "2px solid #3584e4" : "1px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 0 }}
                  />
                ))}
              </div>
            </div>

            <input
              className="notes-editor-title"
              value={title}
              readOnly
              data-testid="notes-title"
            />

            {previewMode ? (
              <div
                style={{ flex: 1, padding: "12px 16px", overflowY: "auto", fontSize: "0.875rem", lineHeight: 1.6, color: "#eeeeec" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                className="notes-editor-content"
                value={content}
                onChange={(e) => {
                  const val = e.target.value;
                  setContent(val);
                }}
                placeholder="Start writing... (Markdown supported)"
                data-testid="notes-content"
                style={{ background: noteColor !== COLORS[0] ? noteColor : undefined }}
              />
            )}

            {/* Status bar */}
            <div style={{ padding: "3px 12px", fontSize: "0.65rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12 }}>
              <span>{wordCount} words</span>
              <span>{charCount} chars</span>
              <span>{lineCount} lines</span>
            </div>
          </>
        ) : (
          <div className="notes-empty">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📝</div>
              <div>Select a note or create a new one</div>
              <button
                onClick={createNote}
                style={{ marginTop: 12, padding: "8px 16px", background: "#3584e4", border: "none", borderRadius: 6, color: "white", cursor: "pointer", fontSize: "0.875rem" }}
              >Create Note</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const fmtBtn = {
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  padding: "4px 6px", borderRadius: 4, display: "flex", alignItems: "center",
};
