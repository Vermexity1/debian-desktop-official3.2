import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, Volume2, VolumeX, Battery, BatteryCharging, Power, Sun, Cpu, MemoryStick } from "lucide-react";
import useDesktopStore from "@/store/desktopStore";
import useSystemStore from "@/engines/systemStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";

export default function TopPanel() {
  const [time, setTime] = useState(new Date());
  const { currentWorkspace, workspaceCount, switchWorkspace, logout, user } = useDesktopStore();
  const { volume, brightness, battery, network, cpuUsage, setVolume, setBrightness } = useSystemStore();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    "  " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const batteryIcon = battery.charging ? BatteryCharging : Battery;
  const BatteryIcon = batteryIcon;
  const networkIcon = network.online ? Wifi : WifiOff;
  const NetworkIcon = networkIcon;
  const volumeIcon = volume === 0 ? VolumeX : Volume2;
  const VolumeIcon = volumeIcon;

  return (
    <div className="top-panel" data-testid="top-panel">
      <div className="top-panel-left">
        <button
          className="activities-btn"
          data-testid="activities-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("activities-toggle"))}
        >
          Activities
        </button>
        <div className="workspace-dots">
          {Array.from({ length: workspaceCount }, (_, i) => (
            <button
              key={i}
              className={`workspace-dot ${i === currentWorkspace ? "active" : ""}`}
              onClick={() => switchWorkspace(i)}
              data-testid={`workspace-dot-${i}`}
            />
          ))}
        </div>
      </div>

      <div className="top-panel-center">
        <span className="panel-clock" data-testid="panel-clock">
          {formatDate(time)}
        </span>
      </div>

      <div className="top-panel-right">
        <div className="system-tray">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="system-tray-btn" data-testid="system-tray-btn">
                <NetworkIcon size={14} />
                <VolumeIcon size={14} />
                {battery.level >= 0 && <BatteryIcon size={14} />}
                {battery.level >= 0 && <span className="text-[10px]">{battery.level}%</span>}
                <Power size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3" data-testid="system-tray-menu">
              <div className="space-y-4">
                <div className="flex items-center gap-3" data-testid="tray-network-status">
                  <NetworkIcon size={16} className={network.online ? "text-white" : "text-red-400"} />
                  <div className="flex-1">
                    <div className="text-xs text-white/90">{network.online ? "Connected" : "Offline"}</div>
                    <div className="text-[10px] text-white/40">{network.type !== "unknown" ? network.type.toUpperCase() : ""} {network.downlink > 0 ? `${network.downlink} Mbps` : ""}</div>
                  </div>
                </div>

                <div data-testid="tray-volume-control">
                  <div className="flex items-center gap-2 mb-1.5">
                    <VolumeIcon size={14} className="text-white/70" />
                    <span className="text-xs text-white/70">Volume</span>
                    <span className="text-[10px] text-white/40 ml-auto">{volume}%</span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={([v]) => setVolume(v)}
                    max={100}
                    step={1}
                    className="w-full"
                    data-testid="volume-slider"
                  />
                </div>

                <div data-testid="tray-brightness-control">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sun size={14} className="text-white/70" />
                    <span className="text-xs text-white/70">Brightness</span>
                    <span className="text-[10px] text-white/40 ml-auto">{brightness}%</span>
                  </div>
                  <Slider
                    value={[brightness]}
                    onValueChange={([b]) => setBrightness(b)}
                    min={20}
                    max={100}
                    step={1}
                    className="w-full"
                    data-testid="brightness-slider"
                  />
                </div>

                {battery.level >= 0 && (
                  <div className="flex items-center gap-3" data-testid="tray-battery-info">
                    <BatteryIcon size={16} className={battery.charging ? "text-green-400" : "text-white/70"} />
                    <div className="flex-1">
                      <div className="text-xs text-white/90">{battery.level}%{battery.charging ? " (Charging)" : ""}</div>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${battery.level > 20 ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${battery.level}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[10px] text-white/40">
                  <Cpu size={12} />
                  <span>CPU: {cpuUsage.toFixed(0)}%</span>
                </div>
              </div>

              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem disabled className="text-xs">
                {user?.username || "user"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} data-testid="logout-btn" className="text-xs">
                <Power size={14} className="mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
