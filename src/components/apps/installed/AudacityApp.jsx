import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Mic, Volume2, ZoomIn, ZoomOut, Scissors, Copy, Clipboard, Undo, Redo, Upload, Download } from "lucide-react";

const TOOLS_LIST = ["select", "envelope", "draw", "zoom", "timeshift", "multi"];
const EFFECTS = ["Amplify", "Bass & Treble", "Change Pitch", "Change Speed", "Compressor", "Echo", "Equalization", "Fade In", "Fade Out", "Invert", "Noise Reduction", "Normalize", "Phaser", "Reverb", "Reverse", "Tremolo"];

function generateWaveform(length = 800, amplitude = 0.8) {
  return Array.from({ length }, (_, i) => {
    const t = i / length;
    const noise = (Math.random() - 0.5) * 0.3;
    const wave = Math.sin(t * 40) * 0.4 + Math.sin(t * 80) * 0.2 + Math.sin(t * 160) * 0.1;
    return Math.max(-1, Math.min(1, (wave + noise) * amplitude));
  });
}

export default function AudacityApp() {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const fileInputRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("select");
  const [tracks, setTracks] = useState([
    { id: 1, name: "Audio Track 1", waveform: generateWaveform(800, 0.7), muted: false, solo: false, volume: 80, pan: 0, color: "#3584e4" },
    { id: 2, name: "Audio Track 2", waveform: generateWaveform(800, 0.5), muted: false, solo: false, volume: 60, pan: 0, color: "#26a269" },
  ]);
  const [selection, setSelection] = useState({ start: null, end: null });
  const [masterVolume, setMasterVolume] = useState(80);
  const [showEffects, setShowEffects] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState("Amplify");
  const [effectValue, setEffectValue] = useState(0);
  const animRef = useRef(null);
  const playStartRef = useRef(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const trackH = Math.floor(H / tracks.length);

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, W, H);

    // Time ruler
    ctx.fillStyle = "#252525";
    ctx.fillRect(0, 0, W, 20);
    ctx.fillStyle = "#5e5c64";
    ctx.font = "10px sans-serif";
    for (let i = 0; i <= duration; i += 5) {
      const x = (i / duration) * W * zoom;
      ctx.fillText(`${i}s`, x + 2, 14);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(x, 20, 1, H - 20);
      ctx.fillStyle = "#5e5c64";
    }

    tracks.forEach((track, ti) => {
      const y0 = 20 + ti * trackH;
      const mid = y0 + trackH / 2;
      const amp = (trackH / 2 - 4) * (track.volume / 100);

      // Track background
      ctx.fillStyle = ti % 2 === 0 ? "#1e1e1e" : "#222222";
      ctx.fillRect(0, y0, W, trackH);

      // Selection highlight
      if (selection.start !== null && selection.end !== null) {
        const sx = (selection.start / duration) * W;
        const ex = (selection.end / duration) * W;
        ctx.fillStyle = "rgba(53,132,228,0.2)";
        ctx.fillRect(sx, y0, ex - sx, trackH);
      }

      // Waveform
      if (!track.muted) {
        ctx.strokeStyle = track.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const wf = track.waveform;
        for (let i = 0; i < W; i++) {
          const idx = Math.floor((i / (W * zoom)) * wf.length);
          const v = (wf[idx] || 0) * amp;
          if (i === 0) ctx.moveTo(i, mid - v);
          else ctx.lineTo(i, mid - v);
        }
        ctx.stroke();

        // Mirror
        ctx.strokeStyle = track.color + "88";
        ctx.beginPath();
        for (let i = 0; i < W; i++) {
          const idx = Math.floor((i / (W * zoom)) * wf.length);
          const v = (wf[idx] || 0) * amp;
          if (i === 0) ctx.moveTo(i, mid + v);
          else ctx.lineTo(i, mid + v);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.font = "12px sans-serif";
        ctx.fillText("MUTED", W / 2 - 20, mid + 4);
      }

      // Track separator
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, y0 + trackH - 1, W, 1);
    });

    // Playhead
    const px = (currentTime / duration) * W * zoom;
    ctx.strokeStyle = "#e01b24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.stroke();
    // Playhead triangle
    ctx.fillStyle = "#e01b24";
    ctx.beginPath();
    ctx.moveTo(px - 6, 0);
    ctx.lineTo(px + 6, 0);
    ctx.lineTo(px, 10);
    ctx.fill();
  }, [tracks, currentTime, duration, zoom, selection]);

  useEffect(() => { drawWaveform(); }, [drawWaveform]);

  useEffect(() => {
    if (playing) {
      playStartRef.current = Date.now() - currentTime * 1000;
      const animate = () => {
        const elapsed = (Date.now() - playStartRef.current) / 1000;
        if (elapsed >= duration) { setPlaying(false); setCurrentTime(0); return; }
        setCurrentTime(elapsed);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, duration]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / canvas.width) * duration / zoom;
    setCurrentTime(Math.max(0, Math.min(duration, time)));
    if (tool === "select") {
      setSelection({ start: time, end: null });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (e.buttons === 1 && tool === "select" && selection.start !== null) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / canvas.width) * duration / zoom;
      setSelection((s) => ({ ...s, end: Math.max(0, Math.min(duration, time)) }));
    }
  };

  const addTrack = () => {
    const colors = ["#3584e4", "#26a269", "#9141ac", "#e66100", "#2190a4"];
    setTracks((t) => [...t, {
      id: Date.now(), name: `Audio Track ${t.length + 1}`,
      waveform: generateWaveform(800, Math.random() * 0.6 + 0.3),
      muted: false, solo: false, volume: 80, pan: 0,
      color: colors[t.length % colors.length],
    }]);
  };

  const loadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setTracks((t) => [...t, {
        id: Date.now(), name: file.name,
        waveform: generateWaveform(800, 0.8),
        muted: false, solo: false, volume: 80, pan: 0, color: "#9141ac",
        audioUrl: url,
      }]);
    });
  };

  const exportAudio = () => {
    alert("Export simulation: In a real implementation, this would render and export the audio mix as WAV/MP3.");
  };

  const applyEffect = () => {
    setTracks((prev) => prev.map((t) => ({
      ...t,
      waveform: t.waveform.map((v) => {
        if (selectedEffect === "Amplify") return Math.max(-1, Math.min(1, v * (1 + effectValue / 10)));
        if (selectedEffect === "Invert") return -v;
        if (selectedEffect === "Reverse") return v;
        if (selectedEffect === "Normalize") return v / Math.max(...t.waveform.map(Math.abs));
        if (selectedEffect === "Fade In") return v;
        return v + (Math.random() - 0.5) * 0.05;
      }),
    })));
    setShowEffects(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1a1a1a" }} data-testid="audacity-app">
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
        <button onClick={() => setCurrentTime(0)} style={tbBtn}><SkipBack size={14} /></button>
        <button onClick={() => setPlaying(!playing)} style={{ ...tbBtn, background: playing ? "#e01b24" : "#26a269", color: "white", borderRadius: 4 }} data-testid="audacity-play">
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => { setPlaying(false); setCurrentTime(0); }} style={tbBtn}><Square size={14} /></button>
        <button onClick={() => setCurrentTime(duration)} style={tbBtn}><SkipForward size={14} /></button>
        <button onClick={() => setRecording(!recording)} style={{ ...tbBtn, color: recording ? "#e01b24" : undefined }} data-testid="audacity-record"><Mic size={14} /></button>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button style={tbBtn}><Undo size={13} /></button>
        <button style={tbBtn}><Redo size={13} /></button>
        <button style={tbBtn}><Scissors size={13} /></button>
        <button style={tbBtn}><Copy size={13} /></button>
        <button style={tbBtn}><Clipboard size={13} /></button>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} style={tbBtn}><ZoomIn size={13} /></button>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.5))} style={tbBtn}><ZoomOut size={13} /></button>
        <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{Math.round(zoom * 100)}%</span>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button onClick={() => setShowEffects(!showEffects)} style={{ ...tbBtn, color: showEffects ? "#3584e4" : undefined }}>Effects</button>
        <button onClick={addTrack} style={tbBtn}>+ Track</button>
        <button onClick={() => fileInputRef.current?.click()} style={tbBtn}><Upload size={13} />Import</button>
        <button onClick={exportAudio} style={tbBtn}><Download size={13} />Export</button>
        <div style={{ flex: 1 }} />
        <Volume2 size={13} color="#9a9996" />
        <input type="range" min={0} max={100} value={masterVolume} onChange={(e) => setMasterVolume(Number(e.target.value))} style={{ width: 70, accentColor: "#3584e4" }} />
        <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{masterVolume}%</span>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={loadFile} style={{ display: "none" }} />
      </div>

      {/* Tool selector */}
      <div style={{ display: "flex", gap: 2, padding: "4px 8px", background: "#1e1e1e", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TOOLS_LIST.map((t) => (
          <button key={t} onClick={() => setTool(t)} style={{ ...tbBtn, background: tool === t ? "rgba(53,132,228,0.2)" : "none", color: tool === t ? "#3584e4" : "#9a9996", fontSize: "0.7rem", padding: "3px 8px" }}>{t}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
      </div>

      {/* Effects panel */}
      {showEffects && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
          <select value={selectedEffect} onChange={(e) => setSelectedEffect(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "white", padding: "3px 6px", fontSize: "0.75rem" }}>
            {EFFECTS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="range" min={-10} max={10} value={effectValue} onChange={(e) => setEffectValue(Number(e.target.value))} style={{ width: 100 }} />
          <span style={{ fontSize: "0.7rem", color: "#9a9996" }}>{effectValue > 0 ? "+" : ""}{effectValue} dB</span>
          <button onClick={applyEffect} style={{ padding: "3px 10px", background: "#3584e4", border: "none", borderRadius: 4, color: "white", cursor: "pointer", fontSize: "0.75rem" }}>Apply</button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Track controls */}
        <div style={{ width: 160, background: "#1e1e1e", borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto" }}>
          <div style={{ height: 20, background: "#252525" }} />
          {tracks.map((track) => (
            <div key={track.id} style={{ height: Math.floor(200 / tracks.length * tracks.length / tracks.length), minHeight: 80, padding: "8px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: "0.7rem", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setTracks((t) => t.map((tr) => tr.id === track.id ? { ...tr, muted: !tr.muted } : tr))} style={{ ...tbBtn, fontSize: "0.6rem", padding: "2px 5px", background: track.muted ? "#e01b24" : "rgba(255,255,255,0.1)", color: "white", borderRadius: 3 }}>M</button>
                <button onClick={() => setTracks((t) => t.map((tr) => tr.id === track.id ? { ...tr, solo: !tr.solo } : tr))} style={{ ...tbBtn, fontSize: "0.6rem", padding: "2px 5px", background: track.solo ? "#f8e45c" : "rgba(255,255,255,0.1)", color: track.solo ? "#000" : "white", borderRadius: 3 }}>S</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: "0.6rem", color: "#5e5c64" }}>Vol</span>
                <input type="range" min={0} max={100} value={track.volume} onChange={(e) => setTracks((t) => t.map((tr) => tr.id === track.id ? { ...tr, volume: Number(e.target.value) } : tr))} style={{ flex: 1, accentColor: track.color }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: "0.6rem", color: "#5e5c64" }}>Pan</span>
                <input type="range" min={-100} max={100} value={track.pan} onChange={(e) => setTracks((t) => t.map((tr) => tr.id === track.id ? { ...tr, pan: Number(e.target.value) } : tr))} style={{ flex: 1, accentColor: track.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Waveform canvas */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={Math.max(200, tracks.length * 100)}
            style={{ display: "block", cursor: tool === "zoom" ? "zoom-in" : tool === "select" ? "text" : "crosshair" }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            data-testid="audacity-canvas"
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "3px 12px", fontSize: "0.65rem", color: "#5e5c64", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, background: "#1a1a1a" }}>
        <span>{tracks.length} tracks</span>
        <span>44100 Hz • 32-bit float</span>
        <span>Stereo</span>
        {recording && <span style={{ color: "#e01b24" }}>● Recording</span>}
      </div>
    </div>
  );
}

const tbBtn = {
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  padding: "4px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
};
