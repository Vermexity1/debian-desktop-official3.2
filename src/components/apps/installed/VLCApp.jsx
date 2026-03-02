import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle,
  List, Maximize2, Settings, Upload, ChevronRight, ChevronDown,
} from "lucide-react";

const DEMO_TRACKS = [
  { id: 1, title: "Beethoven - Moonlight Sonata", artist: "Beethoven", duration: 374, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Jazz Improvisation", artist: "Various", duration: 287, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Electronic Ambient", artist: "Various", duration: 312, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, title: "Classical Guitar", artist: "Various", duration: 198, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, title: "Piano Sonata", artist: "Various", duration: 425, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

function formatTime(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VLCApp() {
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [playlist, setPlaylist] = useState(DEMO_TRACKS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState("none"); // none, one, all
  const [shuffle, setShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showEq, setShowEq] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTrack = playlist[currentIdx];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume / 100;
    audio.playbackRate = speed;
  }, [volume, muted, speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.url;
    setCurrentTime(0);
    setDuration(currentTrack.duration);
    setError(null);
    if (playing) {
      setLoading(true);
      audio.play().then(() => setLoading(false)).catch((e) => {
        setError("Cannot play: " + e.message);
        setLoading(false);
      });
    }
  }, [currentIdx]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setLoading(true);
      audio.play().then(() => { setPlaying(true); setLoading(false); }).catch((e) => {
        setError("Cannot play: " + e.message);
        setLoading(false);
        setPlaying(false);
      });
    }
  }, [playing]);

  const handleNext = useCallback(() => {
    if (shuffle) {
      setCurrentIdx(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIdx((i) => (i + 1) % playlist.length);
    }
  }, [shuffle, playlist.length]);

  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      setCurrentIdx((i) => (i - 1 + playlist.length) % playlist.length);
    }
  }, [currentTime, playlist.length]);

  const handleEnded = useCallback(() => {
    if (repeat === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeat === "all" || currentIdx < playlist.length - 1) {
      handleNext();
    } else {
      setPlaying(false);
    }
  }, [repeat, currentIdx, playlist.length, handleNext]);

  const handleSeek = (e) => {
    const pct = Number(e.target.value) / 100;
    const time = pct * (duration || currentTrack?.duration || 0);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleFileLoad = (e) => {
    const files = Array.from(e.target.files);
    const newTracks = files.map((f, i) => ({
      id: Date.now() + i,
      title: f.name.replace(/\.[^.]+$/, ""),
      artist: "Local File",
      duration: 0,
      url: URL.createObjectURL(f),
    }));
    setPlaylist((p) => [...p, ...newTracks]);
  };

  const cycleRepeat = () => {
    setRepeat((r) => r === "none" ? "all" : r === "all" ? "one" : "none");
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1a1a1a" }} data-testid="vlc-app">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={handleEnded}
        onError={() => setError("Error loading audio")}
      />

      {/* Video/album art area */}
      <div style={{ flex: 1, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 0 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: 12 }}>🎵</div>
          <div style={{ color: "white", fontSize: "1rem", fontWeight: 600 }}>{currentTrack?.title}</div>
          <div style={{ color: "#9a9996", fontSize: "0.8rem" }}>{currentTrack?.artist}</div>
          {loading && <div style={{ color: "#f8e45c", fontSize: "0.75rem", marginTop: 8 }}>Loading...</div>}
          {error && <div style={{ color: "#e01b24", fontSize: "0.75rem", marginTop: 8 }}>{error}</div>}
        </div>
      </div>

      {/* EQ panel */}
      {showEq && (
        <div style={{ padding: "8px 16px", background: "#252525", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, alignItems: "flex-end" }}>
          {["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"].map((band, i) => (
            <div key={band} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <input
                type="range" min={-12} max={12} value={eqBands[i]}
                onChange={(e) => setEqBands((b) => b.map((v, j) => j === i ? Number(e.target.value) : v))}
                style={{ height: 60, writingMode: "vertical-lr", direction: "rtl", width: 20 }}
              />
              <span style={{ fontSize: "0.55rem", color: "#5e5c64" }}>{band}</span>
            </div>
          ))}
          <button onClick={() => setEqBands(Array(10).fill(0))} style={{ padding: "4px 8px", background: "#353535", border: "none", borderRadius: 4, color: "#9a9996", cursor: "pointer", fontSize: "0.7rem", marginLeft: 8 }}>Reset</button>
        </div>
      )}

      {/* Playlist */}
      {showPlaylist && (
        <div style={{ maxHeight: 160, overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", background: "#1e1e1e" }}>
          {playlist.map((track, i) => (
            <div
              key={track.id}
              onClick={() => { setCurrentIdx(i); setPlaying(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                background: i === currentIdx ? "rgba(255,165,0,0.1)" : "transparent",
                cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
              data-testid={`vlc-track-${track.id}`}
            >
              <span style={{ fontSize: "0.7rem", color: "#5e5c64", width: 20 }}>{i + 1}</span>
              {i === currentIdx && playing && <span style={{ color: "#ff8800", fontSize: "0.7rem" }}>▶</span>}
              <span style={{ flex: 1, fontSize: "0.8rem", color: i === currentIdx ? "#ff8800" : "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</span>
              <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{formatTime(track.duration)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: "12px 16px", background: "#252525", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "0.7rem", color: "#9a9996", minWidth: 36 }}>{formatTime(currentTime)}</span>
          <input
            type="range" min={0} max={100} value={pct}
            onChange={handleSeek}
            style={{ flex: 1, accentColor: "#ff8800" }}
            data-testid="vlc-seek"
          />
          <span style={{ fontSize: "0.7rem", color: "#9a9996", minWidth: 36, textAlign: "right" }}>{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={cycleRepeat} style={{ ...ctrlBtn, color: repeat !== "none" ? "#ff8800" : undefined }} title={`Repeat: ${repeat}`}>
            <Repeat size={14} />
            {repeat === "one" && <span style={{ fontSize: "0.55rem", position: "absolute", bottom: 0, right: 0 }}>1</span>}
          </button>
          <button onClick={() => setShuffle(!shuffle)} style={{ ...ctrlBtn, color: shuffle ? "#ff8800" : undefined }}><Shuffle size={14} /></button>
          <div style={{ flex: 1 }} />
          <button onClick={handlePrev} style={ctrlBtn}><SkipBack size={18} /></button>
          <button
            onClick={togglePlay}
            style={{ ...ctrlBtn, width: 40, height: 40, background: "#ff8800", borderRadius: "50%", color: "white" }}
            data-testid="vlc-play-pause"
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={handleNext} style={ctrlBtn}><SkipForward size={18} /></button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setMuted(!muted)} style={ctrlBtn}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
          <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ width: 70, accentColor: "#ff8800" }} data-testid="vlc-volume" />
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ background: "#353535", border: "none", borderRadius: 4, color: "#9a9996", padding: "2px 4px", fontSize: "0.7rem" }}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => <option key={s} value={s}>{s}x</option>)}
          </select>
          <button onClick={() => setShowEq(!showEq)} style={{ ...ctrlBtn, color: showEq ? "#ff8800" : undefined }}><Settings size={14} /></button>
          <button onClick={() => setShowPlaylist(!showPlaylist)} style={{ ...ctrlBtn, color: showPlaylist ? "#ff8800" : undefined }}><List size={14} /></button>
          <button onClick={() => fileInputRef.current?.click()} style={ctrlBtn}><Upload size={14} /></button>
          <input ref={fileInputRef} type="file" accept="audio/*,video/*" multiple onChange={handleFileLoad} style={{ display: "none" }} />
        </div>
      </div>
    </div>
  );
}

const ctrlBtn = {
  background: "none", border: "none", color: "#9a9996", cursor: "pointer",
  padding: 6, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
  position: "relative",
};
