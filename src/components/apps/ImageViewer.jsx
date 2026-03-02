import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, ChevronLeft, ChevronRight, Maximize2, Download, Info } from "lucide-react";

const SAMPLE_IMAGES = [
  { name: "Abstract Waves", url: "https://images.unsplash.com/photo-1771793079119-741d01efc71a?w=1200&q=80" },
  { name: "Mountains", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80" },
  { name: "Ocean Sunset", url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=80" },
  { name: "Forest Path", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80" },
  { name: "City Lights", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80" },
  { name: "Desert Dunes", url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80" },
  { name: "Northern Lights", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80" },
  { name: "Waterfall", url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&q=80" },
];

export default function ImageViewer({ filePath }) {
  const [images, setImages] = useState(SAMPLE_IMAGES);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const currentImg = images[currentIdx];

  const resetView = () => { setZoom(1); setRotation(0); setFlipH(false); setFlipV(false); setOffset({ x: 0, y: 0 }); };

  const goNext = () => { setCurrentIdx((i) => (i + 1) % images.length); resetView(); };
  const goPrev = () => { setCurrentIdx((i) => (i - 1 + images.length) % images.length); resetView(); };

  const loadUrl = () => {
    if (urlInput.trim()) {
      const newImg = { name: "Custom Image", url: urlInput.trim() };
      setImages((imgs) => [...imgs, newImg]);
      setCurrentIdx(images.length);
      setUrlInput("");
      resetView();
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.1, Math.min(5, z + delta)));
  };

  // Drag to pan
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging || !dragStart) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "+") setZoom((z) => Math.min(5, z + 0.25));
      if (e.key === "-") setZoom((z) => Math.max(0.1, z - 0.25));
      if (e.key === "0") resetView();
      if (e.key === "r") setRotation((r) => r + 90);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const transform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;

  return (
    <div className="image-viewer" data-testid="image-viewer-app" style={{ flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="iv-toolbar" style={{ flexWrap: "wrap", gap: 4 }}>
        <button className="browser-nav-btn" onClick={() => setZoom((z) => Math.min(5, z + 0.25))} title="Zoom In" data-testid="iv-zoom-in"><ZoomIn size={16} /></button>
        <button className="browser-nav-btn" onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))} title="Zoom Out" data-testid="iv-zoom-out"><ZoomOut size={16} /></button>
        <span style={{ fontSize: "0.75rem", color: "#9a9996", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
        <button className="browser-nav-btn" onClick={() => setRotation((r) => r - 90)} title="Rotate Left"><RotateCcw size={16} /></button>
        <button className="browser-nav-btn" onClick={() => setRotation((r) => r + 90)} title="Rotate Right" data-testid="iv-rotate"><RotateCw size={16} /></button>
        <button className="browser-nav-btn" onClick={() => setFlipH((f) => !f)} title="Flip Horizontal" style={{ color: flipH ? "#3584e4" : undefined }}><FlipHorizontal size={16} /></button>
        <button className="browser-nav-btn" onClick={() => setFlipV((f) => !f)} title="Flip Vertical" style={{ color: flipV ? "#3584e4" : undefined }}><FlipVertical size={16} /></button>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
        <button className="browser-nav-btn" onClick={resetView} title="Reset View" style={{ fontSize: "0.7rem" }}>1:1</button>
        <button className="browser-nav-btn" onClick={() => setZoom(1)} title="Fit to Window"><Maximize2 size={14} /></button>
        <button className="browser-nav-btn" onClick={() => setShowInfo(!showInfo)} title="Image Info" style={{ color: showInfo ? "#3584e4" : undefined }}><Info size={14} /></button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "0.75rem", color: "#9a9996", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentImg?.name}</span>
        <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{currentIdx + 1}/{images.length}</span>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Image display */}
        <div
          ref={containerRef}
          className="iv-content"
          style={{ flex: 1, overflow: "hidden", cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default", position: "relative" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {currentImg && (
            <img
              src={currentImg.url}
              alt={currentImg.name}
              style={{
                transform,
                transition: dragging ? "none" : "transform 0.15s ease",
                maxWidth: "100%", maxHeight: "100%",
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
              }}
              onLoad={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
              data-testid="iv-image"
            />
          )}
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#5e5c64" }}>
              Loading...
            </div>
          )}
          {/* Navigation arrows */}
          <button
            onClick={goPrev}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}
            data-testid="iv-prev"
          ><ChevronLeft size={20} /></button>
          <button
            onClick={goNext}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}
            data-testid="iv-next"
          ><ChevronRight size={20} /></button>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div style={{ width: 180, background: "#1e1e1e", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: 12, fontSize: "0.75rem", color: "#9a9996", overflowY: "auto" }}>
            <div style={{ fontWeight: 600, color: "white", marginBottom: 8 }}>Image Info</div>
            <div style={{ marginBottom: 4 }}><span style={{ color: "#5e5c64" }}>Name: </span>{currentImg?.name}</div>
            <div style={{ marginBottom: 4 }}><span style={{ color: "#5e5c64" }}>Zoom: </span>{Math.round(zoom * 100)}%</div>
            <div style={{ marginBottom: 4 }}><span style={{ color: "#5e5c64" }}>Rotation: </span>{rotation}°</div>
            <div style={{ marginBottom: 4 }}><span style={{ color: "#5e5c64" }}>Flip H: </span>{flipH ? "Yes" : "No"}</div>
            <div style={{ marginBottom: 4 }}><span style={{ color: "#5e5c64" }}>Flip V: </span>{flipV ? "Yes" : "No"}</div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div style={{ height: 64, display: "flex", gap: 4, padding: "4px 8px", background: "#1a1a1a", borderTop: "1px solid rgba(255,255,255,0.08)", overflowX: "auto", alignItems: "center" }}>
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIdx(i); resetView(); }}
            style={{
              flexShrink: 0, width: 52, height: 52, padding: 0, border: i === currentIdx ? "2px solid #3584e4" : "2px solid transparent",
              borderRadius: 4, overflow: "hidden", cursor: "pointer", background: "#2a2a2a",
            }}
            data-testid={`iv-thumb-${i}`}
          >
            <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
        {/* Add custom URL */}
        <div style={{ flexShrink: 0, display: "flex", gap: 4, marginLeft: 8 }}>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadUrl()}
            placeholder="Paste image URL..."
            style={{ width: 140, background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", fontSize: "0.7rem", padding: "4px 8px" }}
            data-testid="iv-url-input"
          />
          <button onClick={loadUrl} style={{ background: "#3584e4", border: "none", borderRadius: 4, color: "white", padding: "4px 8px", cursor: "pointer", fontSize: "0.7rem" }}>Load</button>
        </div>
      </div>
    </div>
  );
}
