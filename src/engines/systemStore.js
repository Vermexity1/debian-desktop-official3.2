import { create } from "zustand";

let audioCtx = null;
let gainNode = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
  return { audioCtx, gainNode };
}

async function getBatteryInfo() {
  try {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    }
  } catch {}
  return { level: -1, charging: false, chargingTime: 0, dischargingTime: 0 };
}

function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    online: navigator.onLine,
    type: conn?.effectiveType || "unknown",
    downlink: conn?.downlink || 0,
    rtt: conn?.rtt || 0,
    saveData: conn?.saveData || false,
  };
}

function getPlatformInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  return {
    cores: navigator.hardwareConcurrency || 4,
    deviceMemory: navigator.deviceMemory || 4,
    platform: navigator.platform || "Linux x86_64",
    language: navigator.language || "en-US",
    browser,
    userAgent: ua,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };
}

function getMemoryInfo() {
  if (performance.memory) {
    return {
      jsHeapUsed: performance.memory.usedJSHeapSize,
      jsHeapTotal: performance.memory.totalJSHeapSize,
      jsHeapLimit: performance.memory.jsHeapSizeLimit,
    };
  }
  return { jsHeapUsed: 0, jsHeapTotal: 0, jsHeapLimit: 0 };
}

let lastIdleTime = performance.now();
let cpuEstimate = 5;

function estimateCPU() {
  const now = performance.now();
  const expected = 1000;
  const actual = now - lastIdleTime;
  const lag = Math.max(0, actual - expected);
  cpuEstimate = Math.min(95, Math.max(2, lag * 0.8 + cpuEstimate * 0.5));
  lastIdleTime = now;
  return cpuEstimate;
}

const useSystemStore = create((set, get) => ({
  volume: parseInt(localStorage.getItem("sys_volume") || "75", 10),
  brightness: parseInt(localStorage.getItem("sys_brightness") || "100", 10),

  battery: { level: -1, charging: false, chargingTime: 0, dischargingTime: 0 },
  network: { online: true, type: "4g", downlink: 10, rtt: 50, saveData: false },
  platform: getPlatformInfo(),
  memory: getMemoryInfo(),
  cpuUsage: 5,
  cpuHistory: [],
  memHistory: [],

  setVolume: (v) => {
    const val = Math.max(0, Math.min(100, v));
    localStorage.setItem("sys_volume", String(val));
    try {
      const { gainNode, audioCtx } = getAudioContext();
      if (audioCtx.state === "suspended") audioCtx.resume();
      gainNode.gain.setTargetAtTime(val / 100, audioCtx.currentTime, 0.05);
    } catch {}
    set({ volume: val });
  },

  setBrightness: (b) => {
    const val = Math.max(20, Math.min(100, b));
    localStorage.setItem("sys_brightness", String(val));
    set({ brightness: val });
  },

  getAudioContext,

  updateMetrics: async () => {
    const bat = await getBatteryInfo();
    const net = getNetworkInfo();
    const mem = getMemoryInfo();
    const cpu = estimateCPU();
    const now = Date.now();
    set((s) => ({
      battery: bat,
      network: net,
      memory: mem,
      cpuUsage: cpu,
      cpuHistory: [...s.cpuHistory.slice(-29), { t: now, v: cpu }],
      memHistory: [...s.memHistory.slice(-29), { t: now, v: mem.jsHeapUsed ? (mem.jsHeapUsed / mem.jsHeapLimit) * 100 : 30 + Math.random() * 10 }],
    }));
  },

  initBatteryListener: async () => {
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        const update = () => {
          set({
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
            },
          });
        };
        battery.addEventListener("chargingchange", update);
        battery.addEventListener("levelchange", update);
        update();
      }
    } catch {}
    window.addEventListener("online", () => set({ network: getNetworkInfo() }));
    window.addEventListener("offline", () => set({ network: getNetworkInfo() }));
  },
}));

export default useSystemStore;
