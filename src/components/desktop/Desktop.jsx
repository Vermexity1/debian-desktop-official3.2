import { useState, useEffect } from "react";
import useDesktopStore from "@/store/desktopStore";
import useSystemStore from "@/engines/systemStore";
import { initKeyboardManager, registerAltTabCallback, registerSuperCallback } from "@/engines/keyboardManager";
import { fs } from "@/engines/filesystem";
import TopPanel from "./TopPanel";
import Dock from "./Dock";
import Window from "./Window";
import Terminal from "@/components/apps/Terminal";
import FileManager from "@/components/apps/FileManager";
import WebBrowser from "@/components/apps/WebBrowser";
import TextEditor from "@/components/apps/TextEditor";
import CalculatorApp from "@/components/apps/Calculator";
import Notes from "@/components/apps/Notes";
import SettingsApp from "@/components/apps/Settings";
import SoftwareCenter from "@/components/apps/SoftwareCenter";
import ImageViewer from "@/components/apps/ImageViewer";
import SystemMonitor from "@/components/apps/SystemMonitor";
import ClockApp from "@/components/apps/ClockApp";
import FirefoxApp from "@/components/apps/installed/FirefoxApp";
import LibreOfficeApp from "@/components/apps/installed/LibreOfficeApp";
import GIMPApp from "@/components/apps/installed/GIMPApp";
import VLCApp from "@/components/apps/installed/VLCApp";
import BlenderApp from "@/components/apps/installed/BlenderApp";
import InkscapeApp from "@/components/apps/installed/InkscapeApp";
import AudacityApp from "@/components/apps/installed/AudacityApp";
import VSCodeApp from "@/components/apps/installed/VSCodeApp";
import ThunderbirdApp from "@/components/apps/installed/ThunderbirdApp";
import TransmissionApp from "@/components/apps/installed/TransmissionApp";
import SteamApp from "@/components/apps/installed/SteamApp";
import { INSTALLABLE_APPS } from "@/store/desktopStore";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Globe, FileText, Image, Play, Box, Pen, Music, Code, Mail, Download, Gamepad2 } from "lucide-react";

const APP_COMPONENTS = {
  terminal: Terminal,
  files: FileManager,
  browser: WebBrowser,
  editor: TextEditor,
  calculator: CalculatorApp,
  notes: Notes,
  settings: SettingsApp,
  software: SoftwareCenter,
  imageviewer: ImageViewer,
  monitor: SystemMonitor,
  clock: ClockApp,
  firefox: FirefoxApp,
  libreoffice: LibreOfficeApp,
  gimp: GIMPApp,
  vlc: VLCApp,
  blender: BlenderApp,
  inkscape: InkscapeApp,
  audacity: AudacityApp,
  vscode: VSCodeApp,
  thunderbird: ThunderbirdApp,
  transmission: TransmissionApp,
  steam: SteamApp,
};

const ICON_MAP = { Globe, FileText, Image, Play, Box, Pen, Music, Code, Mail, Download, Gamepad2 };

const APP_ACCENT = {
  terminal: "#2d2d2d", files: "#1a3a5c", browser: "#0d47a1", editor: "#1b262c",
  calculator: "#1a3a1a", notes: "#3a2a00", settings: "#2a2a3a", software: "#2c1a4a",
  imageviewer: "#2e1a4a", monitor: "#0d2a1a", clock: "#1a1a3a",
  firefox: "#d05300", libreoffice: "#1565c0", gimp: "#4a3728", vlc: "#8f3900",
  blender: "#00476b", inkscape: "#004400", audacity: "#002244", vscode: "#003050",
  thunderbird: "#003d6b", transmission: "#2a2a3a", steam: "#1b2838",
};

export default function Desktop() {
  const {
    windows, currentWorkspace, wallpaper, notifications,
    openWindow, addNotification, installedApps, focusWindow,
  } = useDesktopStore();
  const { brightness } = useSystemStore();
  const [fsReady, setFsReady] = useState(false);
  const [altTabState, setAltTabState] = useState({ active: false, windows: [], selectedIndex: 0 });
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  useEffect(() => {
    fs.init().then(() => {
      setFsReady(true);
      addNotification("Welcome to Debian Desktop");
    });
  }, []);

  useEffect(() => {
    // Start system metrics polling
    const sys = useSystemStore.getState();
    sys.initBatteryListener();
    sys.updateMetrics();
    const metricsInterval = setInterval(() => {
      useSystemStore.getState().updateMetrics();
    }, 2000);

    // Register keyboard callbacks
    registerAltTabCallback(setAltTabState);
    registerSuperCallback(() => setActivitiesOpen((prev) => !prev));
    const cleanupKb = initKeyboardManager();

    // Listen for activities-toggle from TopPanel
    const handleActivitiesToggle = () => setActivitiesOpen((prev) => !prev);
    window.addEventListener("activities-toggle", handleActivitiesToggle);

    return () => {
      clearInterval(metricsInterval);
      if (cleanupKb) cleanupKb();
      window.removeEventListener("activities-toggle", handleActivitiesToggle);
    };
  }, []);

  const handleNewFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    await fs.mkdir(`/home/user/Desktop/${name}`);
    addNotification(`Created folder: ${name}`);
  };

  const handleNewFile = async () => {
    const name = prompt("File name:");
    if (!name) return;
    await fs.writeFile(`/home/user/Desktop/${name}`, "");
    addNotification(`Created file: ${name}`);
  };

  if (!fsReady) {
    return (
      <div className="loading-screen" data-testid="fs-loading">
        Initializing filesystem...
      </div>
    );
  }

  const wsWindows = Object.values(windows).filter((w) => w.workspace === currentWorkspace);
  const allWindows = Object.values(windows).filter((w) => !w.isClosing);
  const brightnessOpacity = brightness < 100 ? ((100 - brightness) / 100) * 0.8 : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="desktop-container" data-testid="desktop-container">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className="desktop-background"
              style={{ backgroundImage: `url(${wallpaper})` }}
              data-testid="desktop-background"
            />
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56" data-testid="desktop-context-menu">
            <ContextMenuItem onClick={handleNewFolder} data-testid="ctx-new-folder">New Folder</ContextMenuItem>
            <ContextMenuItem onClick={handleNewFile} data-testid="ctx-new-file">New File</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => openWindow("terminal")} data-testid="ctx-open-terminal">Open Terminal</ContextMenuItem>
            <ContextMenuItem onClick={() => openWindow("files")} data-testid="ctx-open-files">Open Files</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => openWindow("settings")} data-testid="ctx-settings">Settings</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <TopPanel />

        {installedApps.length > 0 && (
          <div className="desktop-icons" data-testid="desktop-icons" style={{ overflowY: "auto", maxHeight: "calc(100vh - 120px)", scrollBehavior: "smooth" }}>
            {installedApps.map((appId) => {
              const meta = INSTALLABLE_APPS[appId];
              if (!meta) return null;
              const IconComp = ICON_MAP[meta.iconName] || Globe;
              return (
                <Tooltip key={appId}>
                  <TooltipTrigger asChild>
                    <button
                      className="desktop-icon-item"
                      onDoubleClick={() => openWindow(appId)}
                      data-testid={`desktop-icon-${appId}`}
                    >
                      <div className="desktop-icon-img"><IconComp size={32} /></div>
                      <span className="desktop-icon-label">{meta.name}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{meta.name}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {wsWindows.map((win) => {
          const AppComponent = APP_COMPONENTS[win.appId];
          return (
            <Window key={win.id} window={win}>
              {AppComponent && <AppComponent windowId={win.id} />}
            </Window>
          );
        })}

        {/* Alt+Tab overlay */}
        {altTabState.active && altTabState.windows.length > 0 && (
          <div className="alt-tab-overlay" data-testid="alt-tab-overlay">
            {altTabState.windows.map((win, idx) => (
              <div
                key={win.id}
                className={`alt-tab-item${idx === altTabState.selectedIndex ? " alt-tab-item-selected" : ""}`}
              >
                <div
                  className="alt-tab-icon-box"
                  style={{ background: APP_ACCENT[win.appId] || "#2a2a2a" }}
                >
                  <span className="alt-tab-icon-text">{win.appId.slice(0, 2).toUpperCase()}</span>
                </div>
                <span className="alt-tab-title">{win.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Activities overview (Super key / Activities button) */}
        {activitiesOpen && (
          <div
            className="activities-overlay"
            onClick={() => setActivitiesOpen(false)}
            data-testid="activities-overlay"
          >
            <div className="activities-header" onClick={(e) => e.stopPropagation()}>
              <span>Activities</span>
              <button
                className="activities-close-btn"
                onClick={() => setActivitiesOpen(false)}
                data-testid="activities-close"
              >
                ✕
              </button>
            </div>
            <div className="activities-grid" onClick={(e) => e.stopPropagation()}>
              {allWindows.length === 0 ? (
                <div className="activities-empty">No open windows. Open an app from the dock below.</div>
              ) : (
                allWindows.map((win) => (
                  <div
                    key={win.id}
                    className="activity-card"
                    onClick={() => { focusWindow(win.id); setActivitiesOpen(false); }}
                    data-testid={`activity-card-${win.appId}`}
                  >
                    <div
                      className="activity-card-icon"
                      style={{ background: APP_ACCENT[win.appId] || "#2a2a2a" }}
                    >
                      {win.appId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="activity-card-title">{win.title}</div>
                    <div className="activity-card-ws">
                      Workspace {win.workspace + 1}{win.minimized ? " · minimized" : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Brightness overlay - dimming effect */}
        <div
          className="brightness-overlay"
          style={{ opacity: brightnessOpacity }}
          data-testid="brightness-overlay"
        />

        <Dock />

        <div className="notification-area" data-testid="notification-area">
          {notifications.map((n) => (
            <div key={n.id} className="notification-item" data-testid="notification-item">
              {n.message}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
