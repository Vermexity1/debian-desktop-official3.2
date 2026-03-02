import { useState, useRef, useEffect, useCallback } from "react";
import {
  Pencil, Eraser, Square, Circle, Minus, Move, Pipette, Type, Crop,
  ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, Upload, Layers,
  Sliders, FlipHorizontal, FlipVertical, Trash2, Plus,
} from "lucide-react";

const TOOLS = [
  { id: "pencil", icon: Pencil, label: "Pencil (P)" },
  { id: "eraser", icon: Eraser, label: "Eraser (E)" },
  { id: "rect", icon: Square, label: "Rectangle (R)" },
  { id: "ellipse", icon: Circle, label: "Ellipse (O)" },
  { id: "line", icon: Minus, label: "Line (L)" },
  { id: "fill", icon: null, label: "Fill (F)" },
  { id: "text", icon: Type, label: "Text (T)" },
  { id: "eyedropper", icon: Pipette, label: "Color Picker (I)" },
  { id: "move", icon: Move, label: "Move (M)" },
  { id: "crop", icon: Crop, label: "Crop (C)" },
];

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
  "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#8800ff",
  "#ff0088", "#00ff88", "#0088ff", "#888888", "#444444",
  "#ffcccc", "#ccffcc", "#ccccff", "#ffddaa", "#aaddff",
];

const FILTERS = [
  { id: "none", label: "None" },
  { id: "grayscale", label: "Grayscale" },
  { id: "sepia", label: "Sepia" },
  { id: "invert", label: "Invert" },
  { id: "blur", label: "Blur" },
  { id: "brightness", label: "Brightness" },
  { id: "contrast", label: "Contrast" },
  { id: "saturate", label: "Saturate" },
];

export default function GIMPApp() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [layers, setLayers] = useState([{ id: 1, name: "Background", visible: true, opacity: 100 }]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [showLayers, setShowLayers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState("none");
  const [filterValue, setFilterValue] = useState(50);
  const [textInput, setTextInput] = useState("");
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 450 });
  const [status, setStatus] = useState("Ready");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory((h) => {
      const newH = h.slice(0, historyIdx + 1);
      newH.push(data);
      return newH.slice(-50);
    });
    setHistoryIdx((i) => Math.min(i + 1, 49));
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = history[historyIdx - 1];
    setHistoryIdx((i) => i - 1);
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = history[historyIdx + 1];
    setHistoryIdx((i) => i + 1);
  }, [history, historyIdx]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "p") setTool("pencil");
      if (e.key === "e") setTool("eraser");
      if (e.key === "r") setTool("rect");
      if (e.key === "o") setTool("ellipse");
      if (e.key === "l") setTool("line");
      if (e.key === "f") setTool("fill");
      if (e.key === "t") setTool("text");
      if (e.key === "i") setTool("eyedropper");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const floodFill = (ctx, x, y, fillColor) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const idx = (Math.round(y) * ctx.canvas.width + Math.round(x)) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2];
    const [fr, fg, fb] = hexToRgb(fillColor);
    if (targetR === fr && targetG === fg && targetB === fb) return;
    const stack = [[Math.round(x), Math.round(y)]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const i = (cy * ctx.canvas.width + cx) * 4;
      if (cx < 0 || cy < 0 || cx >= ctx.canvas.width || cy >= ctx.canvas.height) continue;
      if (data[i] !== targetR || data[i + 1] !== targetG || data[i + 2] !== targetB) continue;
      data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const handleMouseDown = (e) => {
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = opacity / 100;

    if (tool === "pencil" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? bgColor : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (tool === "fill") {
      floodFill(ctx, pos.x, pos.y, color);
      saveHistory();
      setDrawing(false);
    } else if (tool === "eyedropper") {
      const pixel = ctx.getImageData(Math.round(pos.x), Math.round(pos.y), 1, 1).data;
      const hex = "#" + [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
      setColor(hex);
      setDrawing(false);
    } else if (tool === "text" && textInput) {
      ctx.font = `${brushSize * 4}px sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(textInput, pos.x, pos.y);
      saveHistory();
      setDrawing(false);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getPos(e);
    setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const overlay = overlayRef.current;
    const octx = overlay?.getContext("2d");

    if (tool === "pencil" || tool === "eraser") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "rect" || tool === "ellipse" || tool === "line") {
      if (!octx || !startPos) return;
      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.strokeStyle = color;
      octx.lineWidth = brushSize;
      octx.globalAlpha = opacity / 100;
      if (tool === "rect") {
        octx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === "ellipse") {
        octx.beginPath();
        octx.ellipse(
          (startPos.x + pos.x) / 2, (startPos.y + pos.y) / 2,
          Math.abs(pos.x - startPos.x) / 2, Math.abs(pos.y - startPos.y) / 2,
          0, 0, Math.PI * 2
        );
        octx.stroke();
      } else if (tool === "line") {
        octx.beginPath();
        octx.moveTo(startPos.x, startPos.y);
        octx.lineTo(pos.x, pos.y);
        octx.stroke();
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const overlay = overlayRef.current;
    const octx = overlay?.getContext("2d");

    if (tool === "rect" || tool === "ellipse" || tool === "line") {
      if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;
      if (tool === "rect" && startPos) {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === "ellipse" && startPos) {
        ctx.beginPath();
        ctx.ellipse(
          (startPos.x + pos.x) / 2, (startPos.y + pos.y) / 2,
          Math.abs(pos.x - startPos.x) / 2, Math.abs(pos.y - startPos.y) / 2,
          0, 0, Math.PI * 2
        );
        ctx.stroke();
      } else if (tool === "line" && startPos) {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    setDrawing(false);
    saveHistory();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const loadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveHistory();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const applyFilter = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const v = filterValue / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (filter === "grayscale") {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = gray;
      } else if (filter === "sepia") {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (filter === "invert") {
        data[i] = 255 - r; data[i + 1] = 255 - g; data[i + 2] = 255 - b;
      } else if (filter === "brightness") {
        const adj = (v - 0.5) * 2 * 100;
        data[i] = Math.min(255, Math.max(0, r + adj));
        data[i + 1] = Math.min(255, Math.max(0, g + adj));
        data[i + 2] = Math.min(255, Math.max(0, b + adj));
      } else if (filter === "contrast") {
        const factor = (259 * (v * 255 + 255)) / (255 * (259 - v * 255));
        data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      }
    }
    ctx.putImageData(imageData, 0, 0);
    saveHistory();
  };

  const flipCanvas = (horizontal) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const temp = document.createElement("canvas");
    temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext("2d");
    tctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (horizontal) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    else { ctx.translate(0, canvas.height); ctx.scale(1, -1); }
    ctx.drawImage(temp, 0, 0);
    ctx.restore();
    saveHistory();
  };

  const rotateCanvas = (deg) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const temp = document.createElement("canvas");
    temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext("2d");
    tctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(temp, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();
    saveHistory();
  };

  const getCursor = () => {
    if (tool === "pencil") return "crosshair";
    if (tool === "eraser") return "cell";
    if (tool === "eyedropper") return "crosshair";
    if (tool === "move") return "move";
    if (tool === "text") return "text";
    return "crosshair";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#2a2a2a" }} data-testid="gimp-app">
      {/* Menu bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#1e1e1e", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
        <button onClick={clearCanvas} style={menuBtn}><Trash2 size={12} />Clear</button>
        <button onClick={() => fileInputRef.current?.click()} style={menuBtn}><Upload size={12} />Open</button>
        <button onClick={downloadCanvas} style={menuBtn}><Download size={12} />Save PNG</button>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button onClick={undo} disabled={historyIdx <= 0} style={menuBtn}><RotateCcw size={12} />Undo</button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1} style={menuBtn}><RotateCw size={12} />Redo</button>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button onClick={() => flipCanvas(true)} style={menuBtn}><FlipHorizontal size={12} />Flip H</button>
        <button onClick={() => flipCanvas(false)} style={menuBtn}><FlipVertical size={12} />Flip V</button>
        <button onClick={() => rotateCanvas(90)} style={menuBtn}><RotateCw size={12} />Rotate</button>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button onClick={() => setShowFilters(!showFilters)} style={{ ...menuBtn, color: showFilters ? "#3584e4" : undefined }}><Sliders size={12} />Filters</button>
        <button onClick={() => setShowLayers(!showLayers)} style={{ ...menuBtn, color: showLayers ? "#3584e4" : undefined }}><Layers size={12} />Layers</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} style={menuBtn}><ZoomIn size={12} /></button>
        <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} style={menuBtn}><ZoomOut size={12} /></button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={loadImage} style={{ display: "none" }} />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "3px 6px", fontSize: "0.75rem" }}>
            {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          {filter !== "none" && filter !== "grayscale" && filter !== "sepia" && filter !== "invert" && (
            <input type="range" min={0} max={100} value={filterValue} onChange={(e) => setFilterValue(Number(e.target.value))} style={{ width: 100 }} />
          )}
          <button onClick={applyFilter} style={{ padding: "3px 10px", background: "#3584e4", border: "none", borderRadius: 4, color: "white", cursor: "pointer", fontSize: "0.75rem" }}>Apply</button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Toolbox */}
        <div style={{ width: 44, background: "#1e1e1e", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 2, overflowY: "auto" }}>
          {TOOLS.map((t) => {
            const IconComp = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={t.label}
                style={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  background: tool === t.id ? "rgba(53,132,228,0.3)" : "none",
                  border: tool === t.id ? "1px solid #3584e4" : "1px solid transparent",
                  borderRadius: 4, cursor: "pointer", color: tool === t.id ? "#3584e4" : "#9a9996",
                }}
                data-testid={`gimp-tool-${t.id}`}
              >
                {IconComp ? <IconComp size={16} /> : <span style={{ fontSize: "1rem" }}>🪣</span>}
              </button>
            );
          })}

          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />

          {/* Color swatches */}
          <div style={{ position: "relative", width: 32, height: 32, marginBottom: 4 }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, background: bgColor, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, cursor: "pointer" }} onClick={() => document.getElementById("bg-color-input")?.click()} />
            <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, background: color, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, cursor: "pointer" }} onClick={() => document.getElementById("fg-color-input")?.click()} />
          </div>
          <input id="fg-color-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ display: "none" }} />
          <input id="bg-color-input" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ display: "none" }} />
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, overflow: "auto", background: "#3a3a3a", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: 16 }}>
          <div style={{ position: "relative", transform: `scale(${zoom})`, transformOrigin: "top left", flexShrink: 0 }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              style={{ display: "block", cursor: getCursor(), boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              data-testid="gimp-canvas"
            />
            <canvas
              ref={overlayRef}
              width={canvasSize.w}
              height={canvasSize.h}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 160, background: "#1e1e1e", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", padding: 8, gap: 8, overflowY: "auto" }}>
          <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Brush Size</div>
          <input type="range" min={1} max={50} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{ width: "100%" }} />
          <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{brushSize}px</span>

          <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Opacity</div>
          <input type="range" min={1} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: "100%" }} />
          <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{opacity}%</span>

          {tool === "text" && (
            <>
              <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Text</div>
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "4px 6px", fontSize: "0.75rem", width: "100%" }}
              />
            </>
          )}

          <div style={{ fontSize: "0.7rem", color: "#5e5c64", marginTop: 4 }}>Colors</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 16, height: 16, background: c, border: color === c ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 2, cursor: "pointer", padding: 0,
                }}
              />
            ))}
          </div>

          {showLayers && (
            <>
              <div style={{ fontSize: "0.7rem", color: "#5e5c64", marginTop: 8 }}>Layers</div>
              {layers.map((layer) => (
                <div key={layer.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", background: activeLayer === layer.id ? "rgba(53,132,228,0.15)" : "rgba(255,255,255,0.04)", borderRadius: 4, cursor: "pointer" }} onClick={() => setActiveLayer(layer.id)}>
                  <span style={{ fontSize: "0.7rem", color: "white", flex: 1 }}>{layer.name}</span>
                  <button onClick={() => setLayers((l) => l.map((la) => la.id === layer.id ? { ...la, visible: !la.visible } : la))} style={{ background: "none", border: "none", color: layer.visible ? "#9a9996" : "#5e5c64", cursor: "pointer", padding: 0, fontSize: "0.65rem" }}>
                    {layer.visible ? "👁" : "🚫"}
                  </button>
                </div>
              ))}
              <button onClick={() => setLayers((l) => [...l, { id: Date.now(), name: `Layer ${l.length + 1}`, visible: true, opacity: 100 }])} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", background: "none", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 4, color: "#9a9996", cursor: "pointer", fontSize: "0.7rem" }}>
                <Plus size={10} />Add Layer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "3px 12px", fontSize: "0.65rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, background: "#1a1a1a" }}>
        <span>{canvasSize.w} × {canvasSize.h} px</span>
        <span>X: {mousePos.x}, Y: {mousePos.y}</span>
        <span>Tool: {tool}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

const menuBtn = {
  display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  fontSize: "0.75rem", borderRadius: 4,
};
