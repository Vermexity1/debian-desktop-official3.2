import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, RotateCcw, Plus, Trash2, Bell } from "lucide-react";

const WORLD_CLOCKS = [
  { city: "New York", tz: "America/New_York" },
  { city: "London", tz: "Europe/London" },
  { city: "Paris", tz: "Europe/Paris" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
  { city: "Sydney", tz: "Australia/Sydney" },
  { city: "Dubai", tz: "Asia/Dubai" },
];

function AnalogClock({ time, size = 180 }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="#1e1e1e" stroke="#353535" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = cx + (r - 12) * Math.sin(angle), y1 = cy - (r - 12) * Math.cos(angle);
        const x2 = cx + (r - 4) * Math.sin(angle), y2 = cy - (r - 4) * Math.cos(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9a9996" strokeWidth="2" strokeLinecap="round" />;
      })}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 * Math.PI) / 180;
        const x1 = cx + (r - 6) * Math.sin(angle), y1 = cy - (r - 6) * Math.cos(angle);
        const x2 = cx + (r - 4) * Math.sin(angle), y2 = cy - (r - 4) * Math.cos(angle);
        return <line key={`m${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5e5c64" strokeWidth="1" strokeLinecap="round" />;
      })}
      {/* Hour numbers */}
      {[12, 3, 6, 9].map((n, i) => {
        const angle = (i * 90 * Math.PI) / 180;
        const x = cx + (r - 22) * Math.sin(angle), y = cy - (r - 22) * Math.cos(angle);
        return <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#9a9996" fontSize="10" fontFamily="Cantarell">{n}</text>;
      })}
      <line x1={cx} y1={cy} x2={cx + (r * 0.5) * Math.sin((hourAngle * Math.PI) / 180)} y2={cy - (r * 0.5) * Math.cos((hourAngle * Math.PI) / 180)} stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + (r * 0.7) * Math.sin((minuteAngle * Math.PI) / 180)} y2={cy - (r * 0.7) * Math.cos((minuteAngle * Math.PI) / 180)} stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + (r * 0.8) * Math.sin((secondAngle * Math.PI) / 180)} y2={cy - (r * 0.8) * Math.cos((secondAngle * Math.PI) / 180)} stroke="#e01b24" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="white" />
    </svg>
  );
}

export default function ClockApp() {
  const [time, setTime] = useState(new Date());
  const [tab, setTab] = useState("clock");
  // Stopwatch
  const [swRunning, setSwRunning] = useState(false);
  const [swTime, setSwTime] = useState(0);
  const [swLaps, setSwLaps] = useState([]);
  const swRef = useRef(null);
  // Timer
  const [timerH, setTimerH] = useState(0);
  const [timerM, setTimerM] = useState(5);
  const [timerS, setTimerS] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef(null);
  // Alarms
  const [alarms, setAlarms] = useState([
    { id: 1, time: "07:00", label: "Wake up", enabled: true },
    { id: 2, time: "09:00", label: "Meeting", enabled: false },
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Stopwatch
  useEffect(() => {
    if (swRunning) {
      swRef.current = setInterval(() => setSwTime((t) => t + 10), 10);
    } else {
      clearInterval(swRef.current);
    }
    return () => clearInterval(swRef.current);
  }, [swRunning]);

  const fmtSw = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  // Timer
  useEffect(() => {
    if (timerRunning && timerRemaining !== null) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((r) => {
          if (r <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const startTimer = () => {
    const total = timerH * 3600 + timerM * 60 + timerS;
    if (total === 0) return;
    setTimerRemaining(total);
    setTimerRunning(true);
    setTimerDone(false);
  };

  const fmtTimer = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const addAlarm = () => {
    setAlarms([...alarms, { id: Date.now(), time: newAlarmTime, label: newAlarmLabel || "Alarm", enabled: true }]);
    setNewAlarmLabel("");
  };

  const tabs = [
    { id: "clock", label: "Clock" },
    { id: "stopwatch", label: "Stopwatch" },
    { id: "timer", label: "Timer" },
    { id: "alarms", label: "Alarms" },
    { id: "world", label: "World" },
  ];

  return (
    <div className="clock-app" data-testid="clock-app" style={{ padding: 0, justifyContent: "flex-start" }}>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.08)", width: "100%" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 4px", fontSize: "0.7rem", background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid #3584e4" : "2px solid transparent",
              color: tab === t.id ? "#3584e4" : "#9a9996", cursor: "pointer", transition: "all 0.15s",
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, width: "100%", overflowY: "auto" }}>
        {tab === "clock" && (
          <>
            <AnalogClock time={time} size={180} />
            <div className="clock-digital" data-testid="clock-digital">
              {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="clock-date" data-testid="clock-date">
              {time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </>
        )}

        {tab === "stopwatch" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
            <div style={{ fontSize: "3rem", fontWeight: 300, fontVariantNumeric: "tabular-nums", color: swRunning ? "#3584e4" : "white" }}>
              {fmtSw(swTime)}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setSwRunning(!swRunning)}
                style={{ padding: "10px 24px", borderRadius: 8, background: swRunning ? "#e01b24" : "#26a269", border: "none", color: "white", cursor: "pointer", fontSize: "0.875rem" }}
                data-testid="sw-start-stop"
              >
                {swRunning ? <><Pause size={14} style={{ display: "inline", marginRight: 6 }} />Pause</> : <><Play size={14} style={{ display: "inline", marginRight: 6 }} />Start</>}
              </button>
              {swTime > 0 && swRunning && (
                <button
                  onClick={() => setSwLaps((l) => [`Lap ${l.length + 1}: ${fmtSw(swTime)}`, ...l])}
                  style={{ padding: "10px 16px", borderRadius: 8, background: "#3584e4", border: "none", color: "white", cursor: "pointer", fontSize: "0.875rem" }}
                >Lap</button>
              )}
              {!swRunning && swTime > 0 && (
                <button
                  onClick={() => { setSwTime(0); setSwLaps([]); }}
                  style={{ padding: "10px 16px", borderRadius: 8, background: "#353535", border: "none", color: "white", cursor: "pointer", fontSize: "0.875rem" }}
                  data-testid="sw-reset"
                ><RotateCcw size={14} /></button>
              )}
            </div>
            {swLaps.length > 0 && (
              <div style={{ width: "100%", maxHeight: 160, overflowY: "auto", background: "#1a1a1a", borderRadius: 8, padding: 8 }}>
                {swLaps.map((lap, i) => (
                  <div key={i} style={{ fontSize: "0.8rem", color: "#9a9996", padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{lap}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "timer" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {timerRunning || timerRemaining !== null ? (
              <>
                <div style={{ fontSize: "3.5rem", fontWeight: 300, fontVariantNumeric: "tabular-nums", color: timerDone ? "#e01b24" : timerRemaining < 10 ? "#f8e45c" : "#3584e4" }}>
                  {timerDone ? "Done!" : fmtTimer(timerRemaining)}
                </div>
                {!timerDone && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      style={{ padding: "10px 24px", borderRadius: 8, background: timerRunning ? "#e01b24" : "#26a269", border: "none", color: "white", cursor: "pointer" }}
                    >{timerRunning ? "Pause" : "Resume"}</button>
                    <button
                      onClick={() => { setTimerRemaining(null); setTimerRunning(false); setTimerDone(false); }}
                      style={{ padding: "10px 16px", borderRadius: 8, background: "#353535", border: "none", color: "white", cursor: "pointer" }}
                    ><Square size={14} /></button>
                  </div>
                )}
                {timerDone && (
                  <button
                    onClick={() => { setTimerRemaining(null); setTimerDone(false); }}
                    style={{ padding: "10px 24px", borderRadius: 8, background: "#3584e4", border: "none", color: "white", cursor: "pointer" }}
                  >Reset</button>
                )}
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <input type="number" min={0} max={23} value={timerH} onChange={(e) => setTimerH(parseInt(e.target.value) || 0)}
                      style={{ width: 56, textAlign: "center", background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: "1.5rem", padding: "8px 4px" }} />
                    <span style={{ fontSize: "0.65rem", color: "#5e5c64", marginTop: 2 }}>hours</span>
                  </div>
                  <span style={{ fontSize: "2rem", color: "#5e5c64" }}>:</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <input type="number" min={0} max={59} value={timerM} onChange={(e) => setTimerM(parseInt(e.target.value) || 0)}
                      style={{ width: 56, textAlign: "center", background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: "1.5rem", padding: "8px 4px" }} />
                    <span style={{ fontSize: "0.65rem", color: "#5e5c64", marginTop: 2 }}>min</span>
                  </div>
                  <span style={{ fontSize: "2rem", color: "#5e5c64" }}>:</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <input type="number" min={0} max={59} value={timerS} onChange={(e) => setTimerS(parseInt(e.target.value) || 0)}
                      style={{ width: 56, textAlign: "center", background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: "1.5rem", padding: "8px 4px" }} />
                    <span style={{ fontSize: "0.65rem", color: "#5e5c64", marginTop: 2 }}>sec</span>
                  </div>
                </div>
                <button
                  onClick={startTimer}
                  style={{ padding: "12px 32px", borderRadius: 8, background: "#3584e4", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}
                  data-testid="timer-start"
                >
                  <Play size={16} style={{ display: "inline", marginRight: 8 }} />Start Timer
                </button>
              </>
            )}
          </div>
        )}

        {tab === "alarms" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            {alarms.map((alarm) => (
              <div key={alarm.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#2a2a2a", borderRadius: 8, padding: "12px 16px" }}>
                <Bell size={16} color={alarm.enabled ? "#3584e4" : "#5e5c64"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1.25rem", fontVariantNumeric: "tabular-nums", color: alarm.enabled ? "white" : "#5e5c64" }}>{alarm.time}</div>
                  <div style={{ fontSize: "0.75rem", color: "#9a9996" }}>{alarm.label}</div>
                </div>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={alarm.enabled}
                    onChange={() => setAlarms(alarms.map((a) => a.id === alarm.id ? { ...a, enabled: !a.enabled } : a))}
                    style={{ width: 16, height: 16, accentColor: "#3584e4" }}
                  />
                </label>
                <button
                  onClick={() => setAlarms(alarms.filter((a) => a.id !== alarm.id))}
                  style={{ background: "none", border: "none", color: "#5e5c64", cursor: "pointer", padding: 4 }}
                ><Trash2 size={14} /></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="time" value={newAlarmTime} onChange={(e) => setNewAlarmTime(e.target.value)}
                style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "6px 8px", fontSize: "0.875rem" }} />
              <input type="text" placeholder="Label (optional)" value={newAlarmLabel} onChange={(e) => setNewAlarmLabel(e.target.value)}
                style={{ flex: 1, background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "6px 8px", fontSize: "0.875rem" }} />
              <button onClick={addAlarm}
                style={{ padding: "6px 12px", borderRadius: 6, background: "#3584e4", border: "none", color: "white", cursor: "pointer" }}
                data-testid="alarm-add"
              ><Plus size={14} /></button>
            </div>
          </div>
        )}

        {tab === "world" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
            {WORLD_CLOCKS.map((wc) => {
              const localTime = new Date(time.toLocaleString("en-US", { timeZone: wc.tz }));
              return (
                <div key={wc.city} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#2a2a2a", borderRadius: 8, padding: "10px 16px" }}>
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "white", fontWeight: 600 }}>{wc.city}</div>
                    <div style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{wc.tz}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.25rem", fontVariantNumeric: "tabular-nums", color: "#3584e4" }}>
                      {localTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#9a9996" }}>
                      {localTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
