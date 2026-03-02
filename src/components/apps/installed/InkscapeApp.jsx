import { useState, useRef, useEffect, useCallback } from "react";
import { Square, Circle, Minus, Type, Move, Pen, ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, Trash2, Copy, AlignLeft, AlignCenter } from "lucide-react";

const TOOLS = [
  { id: "select", icon: Move, label: "Select (S)" },
  { id: "rect", icon: Square, label: "Rectangle (R)" },
  { id: "ellipse", icon: Circle, label: "Ellipse (E)" },
  { id: "line", icon: Minus, label: "Line (L)" },
  { id: "pen", icon: Pen, label: "Pen (P)" },
  { id: "text", icon: Type, label: "Text (T)" },
];

let nextId = 1;

export default function InkscapeApp() {
  const svgRef = useRef(null);
  const [tool, setTool] = useState("select");
  const [objects, setObjects] = useState([
    { id: nextId++, type: "rect", x: 50, y: 80, w: 120, h: 80, fill: "#3584e4", stroke: "#1a4a8a", strokeW: 2, opacity: 1, rx: 0 },
    { id: nextId++, type: "ellipse", cx: 280, cy: 120, rx: 60, ry: 40, fill: "#26a269", stroke: "#1a6040", strokeW: 2, opacity: 1 },
    { id: nextId++, type: "text", x: 100, y: 220, text: "Hello SVG!", fontSize: 24, fill: "#000", fontFamily: "Arial" },
  ]);
  const [selected, setSelected] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fill, setFill] = useState("#3584e4");
  const [stroke, setStroke] = useState("#000000");
  const [strokeW, setStrokeW] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [textInput, setTextInput] = useState("Text");
  const [fontSize, setFontSize] = useState(16);
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(null);

  const saveHistory = useCallback(() => {
    setHistory((h) => [...h.slice(0, histIdx + 1), JSON.parse(JSON.stringify(objects))].slice(-30));
    setHistIdx((i) => Math.min(i + 1, 29));
  }, [objects, histIdx]);

  const undo = () => {
    if (histIdx <= 0) return;
    setObjects(history[histIdx - 1]);
    setHistIdx((i) => i - 1);
  };
  const redo = () => {
    if (histIdx >= history.length - 1) return;
    setObjects(history[histIdx + 1]);
    setHistIdx((i) => i + 1);
  };

  const getSVGPos = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === "rect" && tool !== "select") {
      const pos = getSVGPos(e);
      if (tool === "select") {
        setSelected(null);
        return;
      }
      setDrawing(true);
      setStartPos(pos);
      setCurrentPos(pos);
    }
  };

  const handleMouseMove = (e) => {
    if (!drawing && !dragging) return;
    const pos = getSVGPos(e);
    if (drawing) setCurrentPos(pos);
    if (dragging && selected !== null && dragOffset) {
      const obj = objects.find((o) => o.id === selected);
      if (!obj) return;
      setObjects((prev) => prev.map((o) => {
        if (o.id !== selected) return o;
        if (o.type === "rect" || o.type === "text") return { ...o, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        if (o.type === "ellipse") return { ...o, cx: pos.x - dragOffset.x, cy: pos.y - dragOffset.y };
        if (o.type === "line") return { ...o, x1: pos.x - dragOffset.x, y1: pos.y - dragOffset.y, x2: o.x2 + (pos.x - dragOffset.x - o.x1), y2: o.y2 + (pos.y - dragOffset.y - o.y1) };
        return o;
      }));
    }
  };

  const handleMouseUp = (e) => {
    if (drawing && startPos && currentPos) {
      const dx = currentPos.x - startPos.x, dy = currentPos.y - startPos.y;
      let newObj = null;
      if (tool === "rect" && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        newObj = { id: nextId++, type: "rect", x: Math.min(startPos.x, currentPos.x), y: Math.min(startPos.y, currentPos.y), w: Math.abs(dx), h: Math.abs(dy), fill, stroke, strokeW, opacity: opacity / 100, rx: 0 };
      } else if (tool === "ellipse" && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        newObj = { id: nextId++, type: "ellipse", cx: (startPos.x + currentPos.x) / 2, cy: (startPos.y + currentPos.y) / 2, rx: Math.abs(dx) / 2, ry: Math.abs(dy) / 2, fill, stroke, strokeW, opacity: opacity / 100 };
      } else if (tool === "line") {
        newObj = { id: nextId++, type: "line", x1: startPos.x, y1: startPos.y, x2: currentPos.x, y2: currentPos.y, stroke, strokeW, opacity: opacity / 100 };
      } else if (tool === "text") {
        newObj = { id: nextId++, type: "text", x: startPos.x, y: startPos.y, text: textInput, fontSize, fill, fontFamily: "Arial", opacity: opacity / 100 };
      }
      if (newObj) {
        setObjects((prev) => [...prev, newObj]);
        setSelected(newObj.id);
        saveHistory();
      }
    }
    setDrawing(false);
    setDragging(false);
    setDragOffset(null);
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleObjectMouseDown = (e, obj) => {
    e.stopPropagation();
    if (tool === "select") {
      setSelected(obj.id);
      setDragging(true);
      const pos = getSVGPos(e);
      const dx = obj.type === "ellipse" ? pos.x - obj.cx : pos.x - obj.x;
      const dy = obj.type === "ellipse" ? pos.y - obj.cy : pos.y - obj.y;
      setDragOffset({ x: dx, y: dy });
      // Sync panel
      setFill(obj.fill || "#3584e4");
      setStroke(obj.stroke || "#000000");
      setStrokeW(obj.strokeW || 2);
      setOpacity((obj.opacity || 1) * 100);
    }
  };

  const deleteSelected = () => {
    if (selected === null) return;
    setObjects((prev) => prev.filter((o) => o.id !== selected));
    setSelected(null);
    saveHistory();
  };

  const duplicateSelected = () => {
    if (selected === null) return;
    const obj = objects.find((o) => o.id === selected);
    if (!obj) return;
    const copy = { ...JSON.parse(JSON.stringify(obj)), id: nextId++ };
    if (copy.type === "rect" || copy.type === "text") { copy.x += 20; copy.y += 20; }
    if (copy.type === "ellipse") { copy.cx += 20; copy.cy += 20; }
    setObjects((prev) => [...prev, copy]);
    setSelected(copy.id);
    saveHistory();
  };

  const updateSelected = (key, value) => {
    if (selected === null) return;
    setObjects((prev) => prev.map((o) => o.id === selected ? { ...o, [key]: value } : o));
  };

  const exportSVG = () => {
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "drawing.svg"; a.click();
  };

  const selectedObj = objects.find((o) => o.id === selected);

  // Preview shape while drawing
  const previewShape = drawing && startPos && currentPos && (() => {
    const dx = currentPos.x - startPos.x, dy = currentPos.y - startPos.y;
    if (tool === "rect") return <rect x={Math.min(startPos.x, currentPos.x)} y={Math.min(startPos.y, currentPos.y)} width={Math.abs(dx)} height={Math.abs(dy)} fill={fill} stroke={stroke} strokeWidth={strokeW} opacity={opacity / 100} strokeDasharray="4" />;
    if (tool === "ellipse") return <ellipse cx={(startPos.x + currentPos.x) / 2} cy={(startPos.y + currentPos.y) / 2} rx={Math.abs(dx) / 2} ry={Math.abs(dy) / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} opacity={opacity / 100} strokeDasharray="4" />;
    if (tool === "line") return <line x1={startPos.x} y1={startPos.y} x2={currentPos.x} y2={currentPos.y} stroke={stroke} strokeWidth={strokeW} opacity={opacity / 100} strokeDasharray="4" />;
    return null;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#2a2a2a" }} data-testid="inkscape-app">
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#1e1e1e", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
        <button onClick={undo} style={tbBtn}><RotateCcw size={13} />Undo</button>
        <button onClick={redo} style={tbBtn}><RotateCw size={13} />Redo</button>
        <button onClick={duplicateSelected} disabled={!selected} style={tbBtn}><Copy size={13} />Duplicate</button>
        <button onClick={deleteSelected} disabled={!selected} style={{ ...tbBtn, color: "#e01b24" }}><Trash2 size={13} />Delete</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} style={tbBtn}><ZoomIn size={13} /></button>
        <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} style={tbBtn}><ZoomOut size={13} /></button>
        <button onClick={exportSVG} style={tbBtn}><Download size={13} />Export SVG</button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Toolbox */}
        <div style={{ width: 44, background: "#1e1e1e", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 4 }}>
          {TOOLS.map((t) => {
            const IconComp = t.icon;
            return (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.label} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: tool === t.id ? "rgba(53,132,228,0.3)" : "none", border: tool === t.id ? "1px solid #3584e4" : "1px solid transparent", borderRadius: 4, cursor: "pointer", color: tool === t.id ? "#3584e4" : "#9a9996" }}>
                <IconComp size={16} />
              </button>
            );
          })}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: "auto", background: "#555", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: 20 }}>
          <svg
            ref={svgRef}
            width={600}
            height={450}
            style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transform: `scale(${zoom})`, transformOrigin: "top left", cursor: tool === "select" ? "default" : "crosshair", flexShrink: 0 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            data-testid="inkscape-canvas"
          >
            {objects.map((obj) => {
              const isSelected = obj.id === selected;
              const selStyle = isSelected ? { outline: "2px solid #3584e4" } : {};
              if (obj.type === "rect") return (
                <g key={obj.id}>
                  <rect x={obj.x} y={obj.y} width={obj.w} height={obj.h} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeW} opacity={obj.opacity} rx={obj.rx} onMouseDown={(e) => handleObjectMouseDown(e, obj)} style={{ cursor: "move" }} />
                  {isSelected && <rect x={obj.x - 2} y={obj.y - 2} width={obj.w + 4} height={obj.h + 4} fill="none" stroke="#3584e4" strokeWidth={1} strokeDasharray="4" />}
                </g>
              );
              if (obj.type === "ellipse") return (
                <g key={obj.id}>
                  <ellipse cx={obj.cx} cy={obj.cy} rx={obj.rx} ry={obj.ry} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeW} opacity={obj.opacity} onMouseDown={(e) => handleObjectMouseDown(e, obj)} style={{ cursor: "move" }} />
                  {isSelected && <ellipse cx={obj.cx} cy={obj.cy} rx={obj.rx + 3} ry={obj.ry + 3} fill="none" stroke="#3584e4" strokeWidth={1} strokeDasharray="4" />}
                </g>
              );
              if (obj.type === "line") return (
                <line key={obj.id} x1={obj.x1} y1={obj.y1} x2={obj.x2} y2={obj.y2} stroke={obj.stroke} strokeWidth={obj.strokeW} opacity={obj.opacity} onMouseDown={(e) => handleObjectMouseDown(e, obj)} style={{ cursor: "move" }} />
              );
              if (obj.type === "text") return (
                <text key={obj.id} x={obj.x} y={obj.y} fill={obj.fill} fontSize={obj.fontSize} fontFamily={obj.fontFamily} opacity={obj.opacity} onMouseDown={(e) => handleObjectMouseDown(e, obj)} style={{ cursor: "move", userSelect: "none" }}>{obj.text}</text>
              );
              return null;
            })}
            {previewShape}
          </svg>
        </div>

        {/* Properties panel */}
        <div style={{ width: 180, background: "#1e1e1e", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "white" }}>Properties</div>

          {tool === "text" && (
            <>
              <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Text</div>
              <input value={textInput} onChange={(e) => { setTextInput(e.target.value); updateSelected("text", e.target.value); }} style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "4px 6px", fontSize: "0.75rem" }} />
              <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Font Size</div>
              <input type="number" value={fontSize} onChange={(e) => { setFontSize(Number(e.target.value)); updateSelected("fontSize", Number(e.target.value)); }} style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "4px 6px", fontSize: "0.75rem", width: "100%" }} />
            </>
          )}

          <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Fill</div>
          <input type="color" value={fill} onChange={(e) => { setFill(e.target.value); updateSelected("fill", e.target.value); }} style={{ width: "100%", height: 28, padding: 0, border: "none", cursor: "pointer" }} />

          <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Stroke</div>
          <input type="color" value={stroke} onChange={(e) => { setStroke(e.target.value); updateSelected("stroke", e.target.value); }} style={{ width: "100%", height: 28, padding: 0, border: "none", cursor: "pointer" }} />

          <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Stroke Width</div>
          <input type="range" min={0} max={20} value={strokeW} onChange={(e) => { setStrokeW(Number(e.target.value)); updateSelected("strokeW", Number(e.target.value)); }} style={{ width: "100%" }} />
          <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{strokeW}px</span>

          <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Opacity</div>
          <input type="range" min={0} max={100} value={opacity} onChange={(e) => { setOpacity(Number(e.target.value)); updateSelected("opacity", Number(e.target.value) / 100); }} style={{ width: "100%" }} />
          <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{opacity}%</span>

          {selectedObj?.type === "rect" && (
            <>
              <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Corner Radius</div>
              <input type="range" min={0} max={50} value={selectedObj.rx || 0} onChange={(e) => updateSelected("rx", Number(e.target.value))} style={{ width: "100%" }} />
            </>
          )}

          <div style={{ marginTop: 8, fontSize: "0.7rem", color: "#5e5c64" }}>Objects ({objects.length})</div>
          {objects.map((obj) => (
            <div key={obj.id} onClick={() => setSelected(obj.id)} style={{ fontSize: "0.7rem", color: selected === obj.id ? "#3584e4" : "#9a9996", cursor: "pointer", padding: "2px 4px", background: selected === obj.id ? "rgba(53,132,228,0.1)" : "none", borderRadius: 3 }}>
              {obj.type} #{obj.id}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "3px 12px", fontSize: "0.65rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, background: "#1a1a1a" }}>
        <span>{objects.length} objects</span>
        <span>600 × 450 px</span>
        <span>Tool: {tool}</span>
        {selected && <span>Selected: {selectedObj?.type} #{selected}</span>}
      </div>
    </div>
  );
}

const tbBtn = {
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  padding: "4px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem",
};
