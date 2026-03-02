import {
  SquareTerminal,
  Folder,
  Globe,
  FileText,
  Calculator,
  StickyNote,
  Settings,
  ShoppingBag,
  Image,
  Activity,
  Clock,
  Play, Box, Pen, Music, Code, Mail, Download,
} from "lucide-react";
import useDesktopStore, { INSTALLABLE_APPS } from "@/store/desktopStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_APPS = [
  { id: "files", icon: Folder, name: "Files" },
  { id: "browser", icon: Globe, name: "Web Browser" },
  { id: "terminal", icon: SquareTerminal, name: "Terminal" },
  { id: "editor", icon: FileText, name: "Text Editor" },
  { id: "calculator", icon: Calculator, name: "Calculator" },
  { id: "notes", icon: StickyNote, name: "Notes" },
  { id: "settings", icon: Settings, name: "Settings" },
  { id: "software", icon: ShoppingBag, name: "Software" },
  { id: "imageviewer", icon: Image, name: "Image Viewer" },
  { id: "monitor", icon: Activity, name: "System Monitor" },
  { id: "clock", icon: Clock, name: "Clock" },
];

const ICON_MAP = { Globe, FileText, Image, Play, Box, Pen, Music, Code, Mail, Download };

export default function Dock() {
  const { openWindow, focusWindow, windows, installedApps } = useDesktopStore();
  const runningApps = new Set(Object.values(windows).map((w) => w.appId));

  const handleClick = (appId) => {
    const existing = Object.values(windows).find(
      (w) => w.appId === appId && !w.isClosing
    );
    if (existing) {
      focusWindow(existing.id);
    } else {
      openWindow(appId);
    }
  };

  const installedDockApps = installedApps
    .map((appId) => {
      const meta = INSTALLABLE_APPS[appId];
      if (!meta) return null;
      const IconComp = ICON_MAP[meta.iconName] || Globe;
      return { id: appId, icon: IconComp, name: meta.name };
    })
    .filter(Boolean);

  return (
    <div className="dock" data-testid="dock">
      {DEFAULT_APPS.map((app) => (
        <Tooltip key={app.id}>
          <TooltipTrigger asChild>
            <button
              className="dock-item"
              onClick={() => handleClick(app.id)}
              data-testid={`dock-${app.id}`}
            >
              <app.icon size={26} />
              {runningApps.has(app.id) && <div className="dock-indicator" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {app.name}
          </TooltipContent>
        </Tooltip>
      ))}
      {installedDockApps.length > 0 && (
        <div className="dock-separator" />
      )}
      {installedDockApps.map((app) => (
        <Tooltip key={app.id}>
          <TooltipTrigger asChild>
            <button
              className="dock-item dock-item-installed"
              onClick={() => handleClick(app.id)}
              data-testid={`dock-${app.id}`}
            >
              <app.icon size={26} />
              {runningApps.has(app.id) && <div className="dock-indicator" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {app.name}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
