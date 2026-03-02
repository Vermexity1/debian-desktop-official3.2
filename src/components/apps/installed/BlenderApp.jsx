import { useState, useRef, useEffect } from "react";
import { RotateCcw, ZoomIn, ZoomOut, Move, Box, Layers, Play, Settings, Grid } from "lucide-react";

const OBJECTS = [
  { id: 1, name: "Cube", type: "cube", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, color: "#ff8800" },
  { id: 2, name: "Camera", type: "camera", x: 7, y: -6, z: 5, rx: 63, ry: 0, rz: 47, sx: 1, sy: 1, sz: 1, color: "#000000" },
  { id: 3, name: "Light", type: "light", x: 4, y: 1, z: 6, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, color: "#ffffff" },
];

export default function BlenderApp() {
  const canvasRef = useRef(null);
  const [objects, setObjects] = useState(OBJECTS);
  const [selected, setSelected] = useState(1);
  const [viewMode, setViewMode] = useState("perspective");
  const [shading, setShading] = useState("solid");
  const [rotation, setRotation] = useState({ x: 30, y: -45 });
  const [zoom, setZoom] = useState(5);
  const [dragging, setDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState(null);
  const [tool, setTool] = useState("select");
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [showRender, setShowRender] = useState(false);
  const [timeline, setTimeline] = useState(1);
  const [playing, setPlaying] = useState(false);

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    // Background
    if (shading === "rendered") {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H));
      grad.addColorStop(0, "#2a2a2a");
      grad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = shading === "wireframe" ? "#1a1a1a" : "#3a3a3a";
    }
    ctx.fillRect(0, 0, W, H);

    // Grid
    if (shading !== "wireframe") {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i++) {
        const gx = cx + i * 30 * (5 / zoom);
        const gy = cy + i * 15 * (5 / zoom);
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
    }

    // Draw objects
    const project = (x, y, z) => {
      const cosX = Math.cos(rotation.x * Math.PI / 180);
      const sinX = Math.sin(rotation.x * Math.PI / 180);
      const cosY = Math.cos(rotation.y * Math.PI / 180);
      const sinY = Math.sin(rotation.y * Math.PI / 180);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;
      const scale = 40 * (5 / zoom);
      return { px: cx + x2 * scale, py: cy - y1 * scale, z: z2 };
    };

    objects.forEach((obj) => {
      const isSelected = obj.id === selected;
      if (obj.type === "cube") {
        const s = 1 * (obj.sx || 1);
        const verts = [
          [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
          [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
        ].map(([x, y, z]) => project(x + obj.x, y + obj.y, z + obj.z));
        const faces = [
          [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
          [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5],
        ];
        const faceColors = shading === "solid" ? ["#cc6600", "#ff8800", "#aa5500", "#dd7700", "#bb6600", "#ee9900"] : ["rgba(255,136,0,0.1)"];
        faces.forEach((face, fi) => {
          ctx.beginPath();
          face.forEach((vi, i) => {
            if (i === 0) ctx.moveTo(verts[vi].px, verts[vi].py);
            else ctx.lineTo(verts[vi].px, verts[vi].py);
          });
          ctx.closePath();
          if (shading === "wireframe") {
            ctx.strokeStyle = isSelected ? "#ff8800" : "rgba(255,255,255,0.4)";
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.stroke();
          } else {
            ctx.fillStyle = faceColors[fi % faceColors.length];
            ctx.fill();
            ctx.strokeStyle = isSelected ? "#ff8800" : "rgba(0,0,0,0.3)";
            ctx.lineWidth = isSelected ? 2 : 0.5;
            ctx.stroke();
          }
        });
      } else if (obj.type === "camera") {
        const p = project(obj.x, obj.y, obj.z);
        ctx.fillStyle = isSelected ? "#3584e4" : "#9a9996";
        ctx.beginPath();
        ctx.arc(p.px, p.py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.fillText("📷", p.px - 6, p.py + 4);
      } else if (obj.type === "light") {
        const p = project(obj.x, obj.y, obj.z);
        ctx.fillStyle = isSelected ? "#f8e45c" : "#9a9996";
        ctx.beginPath();
        ctx.arc(p.px, p.py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "10px sans-serif";
        ctx.fillText("💡", p.px - 6, p.py + 4);
      }
    });

    // Axes
    const origin = project(0, 0, 0);
    [["X", 2, 0, 0, "#e01b24"], ["Y", 0, 2, 0, "#26a269"], ["Z", 0, 0, 2, "#3584e4"]].forEach(([label, dx, dy, dz, color]) => {
      const end = project(dx, dy, dz);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(end.px, end.py);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(label, end.px + 2, end.py - 2);
    });
  };

  useEffect(() => { drawScene(); }, [objects, selected, rotation, zoom, shading, tool]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setTimeline((t) => {
        if (t >= 250) { setPlaying(false); return 1; }
        return t + 1;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [playing]);

  const handleMouseDown = (e) => { setDragging(true); setLastMouse({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e) => {
    if (!dragging || !lastMouse) return;
    const dx = e.clientX - lastMouse.x, dy = e.clientY - lastMouse.y;
    setRotation((r) => ({ x: r.x + dy * 0.5, y: r.y + dx * 0.5 }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => { setDragging(false); setLastMouse(null); };
  const handleWheel = (e) => { e.preventDefault(); setZoom((z) => Math.max(1, Math.min(20, z + e.deltaY * 0.01))); };

  const startRender = async () => {
    setRendering(true);
    setRenderProgress(0);
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((r) => setTimeout(r, 50));
      setRenderProgress(i);
    }
    setRendering(false);
    setShowRender(true);
  };

  const selectedObj = objects.find((o) => o.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1a1a1a" }} data-testid="blender-app">
      {/* Header toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
        {["select", "move", "rotate", "scale"].map((t) => (
          <button key={t} onClick={() => setTool(t)} style={{ ...tbBtn, background: tool === t ? "rgba(255,136,0,0.2)" : "none", color: tool === t ? "#ff8800" : "#9a9996" }}>{t}</button>
        ))}
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <select value={shading} onChange={(e) => setShading(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "2px 6px", fontSize: "0.75rem" }}>
          {["solid", "wireframe", "material", "rendered"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "2px 6px", fontSize: "0.75rem" }}>
          {["perspective", "orthographic", "top", "front", "right"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={startRender} disabled={rendering} style={{ ...tbBtn, background: rendering ? "#353535" : "#ff8800", color: "white", borderRadius: 4, padding: "4px 12px" }}>
          {rendering ? `Rendering ${renderProgress}%` : "Render"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Outliner */}
        <div style={{ width: 160, background: "#1e1e1e", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "6px 8px", fontSize: "0.65rem", color: "#5e5c64", textTransform: "uppercase", letterSpacing: 1 }}>Scene Collection</div>
          {objects.map((obj) => (
            <div key={obj.id} onClick={() => setSelected(obj.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: selected === obj.id ? "rgba(255,136,0,0.15)" : "transparent", cursor: "pointer", fontSize: "0.75rem", color: selected === obj.id ? "#ff8800" : "#9a9996" }}>
              <span>{obj.type === "cube" ? "📦" : obj.type === "camera" ? "📷" : "💡"}</span>
              <span>{obj.name}</span>
            </div>
          ))}
          <button onClick={() => setObjects((prev) => [...prev, { id: Date.now(), name: `Cube.${prev.length}`, type: "cube", x: Math.random() * 4 - 2, y: Math.random() * 4 - 2, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, color: "#ff8800" }])} style={{ margin: 8, padding: "4px 8px", background: "#353535", border: "none", borderRadius: 4, color: "#9a9996", cursor: "pointer", fontSize: "0.75rem" }}>+ Add Cube</button>
        </div>

        {/* 3D Viewport */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {showRender ? (
            <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: "0.875rem", color: "#ff8800" }}>Render Complete</div>
              <div style={{ width: 300, height: 200, background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "3rem" }}>🎨</div>
                  <div style={{ color: "#ff8800", fontSize: "0.75rem" }}>Rendered Scene</div>
                </div>
              </div>
              <button onClick={() => setShowRender(false)} style={{ padding: "6px 16px", background: "#353535", border: "none", borderRadius: 4, color: "white", cursor: "pointer" }}>Back to Viewport</button>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              style={{ width: "100%", height: "100%", cursor: dragging ? "grabbing" : "grab" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              data-testid="blender-canvas"
            />
          )}
          {/* Viewport overlays */}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => setZoom((z) => Math.max(1, z - 1))} style={{ ...tbBtn, background: "rgba(0,0,0,0.5)", borderRadius: 4 }}><ZoomIn size={14} /></button>
            <button onClick={() => setZoom((z) => Math.min(20, z + 1))} style={{ ...tbBtn, background: "rgba(0,0,0,0.5)", borderRadius: 4 }}><ZoomOut size={14} /></button>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>
            {viewMode} | {shading} | Drag to orbit, scroll to zoom
          </div>
        </div>

        {/* Properties panel */}
        <div style={{ width: 180, background: "#1e1e1e", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: 10, overflowY: "auto" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "white", marginBottom: 8 }}>Properties</div>
          {selectedObj && (
            <>
              <div style={{ fontSize: "0.7rem", color: "#5e5c64", marginBottom: 4 }}>Transform</div>
              {[["Location X", "x"], ["Location Y", "y"], ["Location Z", "z"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: "0.65rem", color: "#5e5c64" }}>{label}</div>
                  <input type="number" step={0.1} value={selectedObj[key].toFixed(2)} onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selected ? { ...o, [key]: Number(e.target.value) } : o))} style={{ width: "100%", background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "white", padding: "2px 4px", fontSize: "0.7rem" }} />
                </div>
              ))}
              {[["Scale X", "sx"], ["Scale Y", "sy"], ["Scale Z", "sz"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: "0.65rem", color: "#5e5c64" }}>{label}</div>
                  <input type="number" step={0.1} min={0.01} value={selectedObj[key].toFixed(2)} onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selected ? { ...o, [key]: Number(e.target.value) } : o))} style={{ width: "100%", background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "white", padding: "2px 4px", fontSize: "0.7rem" }} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ height: 60, background: "#1e1e1e", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px" }}>
          <button onClick={() => setTimeline(1)} style={tbBtn}>|◀</button>
          <button onClick={() => setPlaying(!playing)} style={{ ...tbBtn, color: playing ? "#ff8800" : "#9a9996" }}>{playing ? <span>⏸</span> : <Play size={14} />}</button>
          <button onClick={() => setTimeline(250)} style={tbBtn}>▶|</button>
          <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>Frame: {timeline} / 250</span>
          <div style={{ flex: 1 }}>
            <input type="range" min={1} max={250} value={timeline} onChange={(e) => setTimeline(Number(e.target.value))} style={{ width: "100%", accentColor: "#ff8800" }} />
          </div>
        </div>
        <div style={{ flex: 1, background: "#252525", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: `${(timeline / 250) * 100}%`, top: 0, bottom: 0, width: 2, background: "#ff8800" }} />
          {[0, 50, 100, 150, 200, 250].map((f) => (
            <span key={f} style={{ position: "absolute", left: `${(f / 250) * 100}%`, top: 2, fontSize: "0.6rem", color: "#5e5c64" }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const tbBtn = {
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  padding: "3px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem",
};
