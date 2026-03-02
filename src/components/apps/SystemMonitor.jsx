import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import useSystemStore from "@/engines/systemStore";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";

const INITIAL_PROCESSES = [
  { pid: 1, name: "systemd", user: "root", cpu: 0.0, mem: 1.2, stat: "Ss", cmd: "/sbin/init" },
  { pid: 2, name: "kthreadd", user: "root", cpu: 0.0, mem: 0.0, stat: "S", cmd: "[kthreadd]" },
  { pid: 42, name: "gnome-shell", user: "user", cpu: 3.2, mem: 8.5, stat: "Sl", cmd: "/usr/bin/gnome-shell" },
  { pid: 87, name: "Xorg", user: "root", cpu: 1.4, mem: 4.2, stat: "Ss+", cmd: "/usr/bin/Xorg :0" },
  { pid: 124, name: "pulseaudio", user: "user", cpu: 0.3, mem: 1.8, stat: "S<sl", cmd: "/usr/bin/pulseaudio" },
  { pid: 156, name: "NetworkManager", user: "root", cpu: 0.2, mem: 2.1, stat: "Ssl", cmd: "/usr/sbin/NetworkManager" },
  { pid: 203, name: "firefox-esr", user: "user", cpu: 12.5, mem: 18.3, stat: "Sl", cmd: "/usr/lib/firefox-esr/firefox-esr" },
  { pid: 287, name: "nautilus", user: "user", cpu: 0.8, mem: 3.4, stat: "Sl", cmd: "/usr/bin/nautilus" },
  { pid: 301, name: "gnome-terminal", user: "user", cpu: 0.5, mem: 2.8, stat: "Sl", cmd: "/usr/bin/gnome-terminal" },
  { pid: 345, name: "dbus-daemon", user: "messagebus", cpu: 0.1, mem: 0.9, stat: "Ss", cmd: "/usr/bin/dbus-daemon" },
  { pid: 412, name: "evolution-data", user: "user", cpu: 0.3, mem: 2.5, stat: "Sl", cmd: "/usr/lib/evolution/evolution-data-server" },
  { pid: 501, name: "cron", user: "root", cpu: 0.0, mem: 0.4, stat: "Ss", cmd: "/usr/sbin/cron" },
  { pid: 612, name: "sshd", user: "root", cpu: 0.0, mem: 1.1, stat: "Ss", cmd: "/usr/sbin/sshd" },
  { pid: 723, name: "bash", user: "user", cpu: 0.0, mem: 0.3, stat: "Ss", cmd: "/bin/bash" },
  { pid: 834, name: "python3", user: "user", cpu: 2.1, mem: 5.6, stat: "S", cmd: "python3 script.py" },
];

export default function SystemMonitor() {
  const { cpuUsage, cpuHistory, memHistory, battery, network, platform, memory } = useSystemStore();
  const [processes, setProcesses] = useState(INITIAL_PROCESSES);
  const [sortBy, setSortBy] = useState("cpu");
  const [sortDir, setSortDir] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPid, setSelectedPid] = useState(null);
  const [diskHistory] = useState(Array.from({ length: 60 }, (_, i) => ({ t: i, v: Math.random() * 30 })));
  const [netHistory] = useState(Array.from({ length: 60 }, (_, i) => ({ t: i, v: Math.random() * 100 })));

  // Simulate CPU fluctuation in processes
  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses((prev) => prev.map((p) => ({
        ...p,
        cpu: Math.max(0, Math.min(100, p.cpu + (Math.random() - 0.5) * 2)),
        mem: Math.max(0, Math.min(100, p.mem + (Math.random() - 0.5) * 0.5)),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const memTotalGB = platform.deviceMemory || 4;
  const memUsedPct = memory.jsHeapUsed
    ? (memory.jsHeapUsed / memory.jsHeapLimit) * 100
    : memHistory.length > 0 ? memHistory[memHistory.length - 1]?.v || 35 : 35;
  const memUsedGB = (memUsedPct / 100) * memTotalGB;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const killProcess = (pid) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
    if (selectedPid === pid) setSelectedPid(null);
  };

  const filteredProcesses = processes
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || String(p.pid).includes(searchQuery))
    .sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortBy === "pid") return (a.pid - b.pid) * mult;
      if (sortBy === "name") return a.name.localeCompare(b.name) * mult;
      if (sortBy === "cpu") return (a.cpu - b.cpu) * mult;
      if (sortBy === "mem") return (a.mem - b.mem) * mult;
      return 0;
    });

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null;
    return sortDir === "asc" ? <ArrowUp size={10} style={{ display: "inline" }} /> : <ArrowDown size={10} style={{ display: "inline" }} />;
  };

  const thStyle = (col) => ({
    padding: "6px 8px", fontSize: "0.7rem", color: "#9a9996", cursor: "pointer",
    background: sortBy === col ? "rgba(53,132,228,0.1)" : "transparent",
    userSelect: "none", textAlign: col === "cpu" || col === "mem" ? "right" : "left",
  });

  return (
    <div className="system-monitor" data-testid="system-monitor-app">
      <Tabs defaultValue="resources" className="flex flex-col h-full">
        <TabsList className="mx-4 mt-2 mb-0 justify-start" style={{ background: "#303030" }}>
          <TabsTrigger value="resources" data-testid="monitor-tab-resources">Resources</TabsTrigger>
          <TabsTrigger value="processes" data-testid="monitor-tab-processes">Processes</TabsTrigger>
          <TabsTrigger value="disks" data-testid="monitor-tab-disks">Disks</TabsTrigger>
          <TabsTrigger value="network" data-testid="monitor-tab-network">Network</TabsTrigger>
          <TabsTrigger value="system" data-testid="monitor-tab-system">System</TabsTrigger>
        </TabsList>

        {/* RESOURCES */}
        <TabsContent value="resources" className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="monitor-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>CPU Usage ({platform.cores} cores)</h3>
              <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>Intel Core i7</span>
            </div>
            <div className="monitor-value" style={{ color: "#3584e4" }}>{cpuUsage.toFixed(1)}%</div>
            <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, marginBottom: 8 }}>
              <div style={{ width: `${cpuUsage}%`, height: "100%", background: "#3584e4", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <div className="monitor-chart-wrapper">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={cpuHistory}>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} contentStyle={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem" }} />
                  <Area type="monotone" dataKey="v" stroke="#3584e4" fill="#3584e4" fillOpacity={0.2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="monitor-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Memory Usage</h3>
              <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{memUsedGB.toFixed(1)} GB / {memTotalGB.toFixed(1)} GB</span>
            </div>
            <div className="monitor-value" style={{ color: "#26a269" }}>{memUsedPct.toFixed(1)}%</div>
            <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, marginBottom: 8 }}>
              <div style={{ width: `${memUsedPct}%`, height: "100%", background: "#26a269", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <div className="monitor-chart-wrapper">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={memHistory}>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} contentStyle={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem" }} />
                  <Area type="monotone" dataKey="v" stroke="#26a269" fill="#26a269" fillOpacity={0.2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {battery.level >= 0 && (
            <div className="monitor-section">
              <h3>Battery</h3>
              <div className="monitor-value" style={{ color: battery.level > 20 ? "#26a269" : "#e01b24" }}>
                {battery.level}%{battery.charging ? " ⚡ Charging" : ""}
              </div>
              <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                <div style={{ width: `${battery.level}%`, height: "100%", background: battery.level > 20 ? "#26a269" : "#e01b24", borderRadius: 3, transition: "width 0.5s" }} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* PROCESSES */}
        <TabsContent value="processes" className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 8px", flex: 1 }}>
              <Search size={12} color="#5e5c64" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search processes..."
                style={{ background: "none", border: "none", color: "white", fontSize: "0.75rem", outline: "none", width: "100%" }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{filteredProcesses.length} processes</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "#252525" }}>
                <tr>
                  <th style={thStyle("pid")} onClick={() => handleSort("pid")}>PID <SortIcon col="pid" /></th>
                  <th style={thStyle("name")} onClick={() => handleSort("name")}>Name <SortIcon col="name" /></th>
                  <th style={thStyle("user")}>User</th>
                  <th style={{ ...thStyle("cpu"), textAlign: "right" }} onClick={() => handleSort("cpu")}>CPU% <SortIcon col="cpu" /></th>
                  <th style={{ ...thStyle("mem"), textAlign: "right" }} onClick={() => handleSort("mem")}>Mem% <SortIcon col="mem" /></th>
                  <th style={thStyle("stat")}>Status</th>
                  <th style={{ padding: "6px 8px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProcesses.map((p) => (
                  <tr
                    key={p.pid}
                    onClick={() => setSelectedPid(p.pid === selectedPid ? null : p.pid)}
                    style={{
                      background: selectedPid === p.pid ? "rgba(53,132,228,0.1)" : "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                    data-testid={`process-${p.pid}`}
                  >
                    <td style={{ padding: "5px 8px", fontSize: "0.75rem", color: "#9a9996" }}>{p.pid}</td>
                    <td style={{ padding: "5px 8px", fontSize: "0.75rem", color: "white" }}>{p.name}</td>
                    <td style={{ padding: "5px 8px", fontSize: "0.75rem", color: "#9a9996" }}>{p.user}</td>
                    <td style={{ padding: "5px 8px", fontSize: "0.75rem", textAlign: "right", color: p.cpu > 10 ? "#e01b24" : p.cpu > 5 ? "#f8e45c" : "#26a269" }}>{p.cpu.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px", fontSize: "0.75rem", textAlign: "right", color: "#9a9996" }}>{p.mem.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px", fontSize: "0.75rem", color: "#5e5c64" }}>{p.stat}</td>
                    <td style={{ padding: "5px 8px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); killProcess(p.pid); }}
                        style={{ background: "none", border: "none", color: "#e01b24", cursor: "pointer", padding: 2, opacity: 0.6 }}
                        title="Kill Process"
                        data-testid={`kill-${p.pid}`}
                      ><X size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedPid && (
            <div style={{ marginTop: 8, padding: 12, background: "#1e1e1e", borderRadius: 8, fontSize: "0.75rem" }}>
              <div style={{ color: "#9a9996", marginBottom: 4 }}>Command:</div>
              <div style={{ color: "white", fontFamily: "monospace" }}>{processes.find((p) => p.pid === selectedPid)?.cmd}</div>
            </div>
          )}
        </TabsContent>

        {/* DISKS */}
        <TabsContent value="disks" className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="monitor-section">
            <h3>Disk I/O</h3>
            <div className="monitor-chart-wrapper">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={diskHistory}>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Area type="monotone" dataKey="v" stroke="#9141ac" fill="#9141ac" fillOpacity={0.2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="monitor-section">
            <h3>Disk Usage</h3>
            {[
              { name: "/dev/sda1", mount: "/", total: 256, used: 42, type: "ext4" },
              { name: "/dev/sda2", mount: "/home", total: 512, used: 128, type: "ext4" },
              { name: "tmpfs", mount: "/tmp", total: 4, used: 0.1, type: "tmpfs" },
            ].map((disk) => (
              <div key={disk.mount} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.8rem", color: "white" }}>{disk.name} ({disk.mount})</span>
                  <span style={{ fontSize: "0.75rem", color: "#9a9996" }}>{disk.used} GB / {disk.total} GB • {disk.type}</span>
                </div>
                <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4 }}>
                  <div style={{ width: `${(disk.used / disk.total) * 100}%`, height: "100%", background: "#9141ac", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* NETWORK */}
        <TabsContent value="network" className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="monitor-section">
            <h3>Network Activity</h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
              <span style={{ fontSize: "0.8rem", color: "#26a269" }}>▲ Upload: {(Math.random() * 100).toFixed(1)} KB/s</span>
              <span style={{ fontSize: "0.8rem", color: "#3584e4" }}>▼ Download: {(Math.random() * 500).toFixed(1)} KB/s</span>
            </div>
            <div className="monitor-chart-wrapper">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={netHistory}>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Area type="monotone" dataKey="v" stroke="#3584e4" fill="#3584e4" fillOpacity={0.2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="monitor-section">
            <h3>Interfaces</h3>
            {[
              { name: "eth0", ip: "192.168.1.100", mac: "aa:bb:cc:dd:ee:ff", status: "UP" },
              { name: "wlan0", ip: "192.168.1.101", mac: "11:22:33:44:55:66", status: "UP" },
              { name: "lo", ip: "127.0.0.1", mac: "00:00:00:00:00:00", status: "UP" },
            ].map((iface) => (
              <div key={iface.name} className="settings-row">
                <span className="settings-row-label">{iface.name}</span>
                <span className="settings-row-value">{iface.ip} <span style={{ color: "#26a269", marginLeft: 8 }}>{iface.status}</span></span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* SYSTEM */}
        <TabsContent value="system" className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="monitor-section">
            <h3>System Information</h3>
            {[
              { label: "OS", value: "Debian GNU/Linux 12 (bookworm)" },
              { label: "Kernel", value: "6.1.0-21-amd64" },
              { label: "Architecture", value: "x86_64" },
              { label: "Hostname", value: "debian-desktop" },
              { label: "Uptime", value: "3 hours, 42 minutes" },
              { label: "CPU", value: `${platform.cores || 4}-core processor` },
              { label: "Total Memory", value: `${memTotalGB} GB RAM` },
              { label: "Swap", value: "2 GB" },
              { label: "Network", value: network?.online ? "Online" : "Offline" },
              { label: "Browser", value: navigator.userAgent.split(" ").pop() },
            ].map((item) => (
              <div key={item.label} className="settings-row">
                <span className="settings-row-label">{item.label}</span>
                <span className="settings-row-value">{item.value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
