import { create } from "zustand";
import { fs } from "@/engines/filesystem";

const APP_DEFS = {
  terminal: { title: "Terminal", defaultWidth: 720, defaultHeight: 480 },
  files: { title: "Files", defaultWidth: 800, defaultHeight: 500 },
  browser: { title: "Web Browser", defaultWidth: 900, defaultHeight: 600 },
  editor: { title: "Text Editor", defaultWidth: 700, defaultHeight: 500 },
  calculator: { title: "Calculator", defaultWidth: 340, defaultHeight: 500 },
  notes: { title: "Notes", defaultWidth: 650, defaultHeight: 450 },
  settings: { title: "Settings", defaultWidth: 780, defaultHeight: 550 },
  software: { title: "Software", defaultWidth: 800, defaultHeight: 560 },
  imageviewer: { title: "Image Viewer", defaultWidth: 700, defaultHeight: 520 },
  monitor: { title: "System Monitor", defaultWidth: 700, defaultHeight: 500 },
  clock: { title: "Clock", defaultWidth: 380, defaultHeight: 420 },
  firefox: { title: "Firefox", defaultWidth: 920, defaultHeight: 620 },
  libreoffice: { title: "LibreOffice Writer", defaultWidth: 860, defaultHeight: 620 },
  gimp: { title: "GIMP", defaultWidth: 920, defaultHeight: 660 },
  vlc: { title: "VLC Media Player", defaultWidth: 740, defaultHeight: 500 },
  blender: { title: "Blender", defaultWidth: 960, defaultHeight: 660 },
  inkscape: { title: "Inkscape", defaultWidth: 920, defaultHeight: 660 },
  audacity: { title: "Audacity", defaultWidth: 860, defaultHeight: 560 },
  vscode: { title: "Visual Studio Code", defaultWidth: 960, defaultHeight: 660 },
  thunderbird: { title: "Thunderbird", defaultWidth: 920, defaultHeight: 620 },
  transmission: { title: "Transmission", defaultWidth: 760, defaultHeight: 520 },
  steam: { title: "Steam", defaultWidth: 1000, defaultHeight: 680 },
};

export const INSTALLABLE_APPS = {
  firefox: { id: "firefox", name: "Firefox", desc: "Web Browser", iconName: "Globe", version: "115.0", size: "68 MB" },
  libreoffice: { id: "libreoffice", name: "LibreOffice Writer", desc: "Office Suite", iconName: "FileText", version: "7.5.4", size: "312 MB" },
  gimp: { id: "gimp", name: "GIMP", desc: "Image Editor", iconName: "Image", version: "2.10.34", size: "95 MB" },
  vlc: { id: "vlc", name: "VLC", desc: "Media Player", iconName: "Play", version: "3.0.18", size: "42 MB" },
  blender: { id: "blender", name: "Blender", desc: "3D Creation Suite", iconName: "Box", version: "3.6.2", size: "210 MB" },
  inkscape: { id: "inkscape", name: "Inkscape", desc: "Vector Graphics", iconName: "Pen", version: "1.3", size: "78 MB" },
  audacity: { id: "audacity", name: "Audacity", desc: "Audio Editor", iconName: "Music", version: "3.4.2", size: "55 MB" },
  vscode: { id: "vscode", name: "VS Code", desc: "Code Editor", iconName: "Code", version: "1.85.0", size: "120 MB" },
  thunderbird: { id: "thunderbird", name: "Thunderbird", desc: "Email Client", iconName: "Mail", version: "115.5", size: "88 MB" },
  transmission: { id: "transmission", name: "Transmission", desc: "BitTorrent Client", iconName: "Download", version: "4.0.4", size: "12 MB" },
  steam: { id: "steam", name: "Steam", desc: "Game Platform", iconName: "Gamepad2", version: "1.0.0", size: "256 MB" },
};

const useDesktopStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  windows: {},
  activeWindowId: null,
  nextZIndex: 10,

  currentWorkspace: 0,
  workspaceCount: 4,

  notifications: [],

  wallpaper:
    "https://images.unsplash.com/photo-1771793079119-741d01efc71a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGVtZXJhbGQlMjBncmVlbiUyMGRpZ2l0YWwlMjB3YXZlcyUyMGRhcmslMjB3YWxscGFwZXIlMjA0a3xlbnwwfHx8fDE3NzIxNDQ5NDV8MA&ixlib=rb-4.1.0&q=85",

  login: (user, token) => set({ user, token, isAuthenticated: true }),

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      windows: {},
      activeWindowId: null,
    });
  },

  openWindow: (appId, props) => {
    const { windows, nextZIndex, currentWorkspace } = get();
    const app = APP_DEFS[appId];
    if (!app) return;
    const id = `${appId}-${Date.now()}`;
    const offset = (Object.keys(windows).length % 8) * 30;
    set({
      windows: {
        ...windows,
        [id]: {
          id,
          appId,
          title: app.title,
          x: 80 + offset,
          y: 50 + offset,
          width: app.defaultWidth,
          height: app.defaultHeight,
          zIndex: nextZIndex,
          minimized: false,
          maximized: false,
          workspace: currentWorkspace,
          isClosing: false,
          props: props || {},
        },
      },
      activeWindowId: id,
      nextZIndex: nextZIndex + 1,
    });
    return id;
  },

  closeWindow: (id) => {
    const { windows, activeWindowId } = get();
    if (!windows[id]) return;
    set({
      windows: {
        ...windows,
        [id]: { ...windows[id], isClosing: true },
      },
    });
    setTimeout(() => {
      const { windows: cur } = get();
      const next = { ...cur };
      delete next[id];
      set({
        windows: next,
        activeWindowId: activeWindowId === id ? null : get().activeWindowId,
      });
    }, 180);
  },

  minimizeWindow: (id) => {
    const { windows } = get();
    set({
      windows: { ...windows, [id]: { ...windows[id], minimized: true } },
    });
  },

  maximizeWindow: (id) => {
    const { windows } = get();
    const w = windows[id];
    set({
      windows: { ...windows, [id]: { ...w, maximized: !w.maximized } },
    });
  },

  focusWindow: (id) => {
    const { windows, nextZIndex } = get();
    if (!windows[id]) return;
    const updates = { zIndex: nextZIndex };
    if (windows[id].minimized) updates.minimized = false;
    set({
      windows: { ...windows, [id]: { ...windows[id], ...updates } },
      activeWindowId: id,
      nextZIndex: nextZIndex + 1,
    });
  },

  updateWindow: (id, updates) => {
    const { windows } = get();
    if (!windows[id]) return;
    set({
      windows: { ...windows, [id]: { ...windows[id], ...updates } },
    });
  },

  switchWorkspace: (index) => set({ currentWorkspace: index }),

  setWallpaper: (url) => {
    localStorage.setItem("debian_wallpaper", url);
    set({ wallpaper: url });
  },

  installedApps: JSON.parse(localStorage.getItem("debian_installed_apps") || "[]"),

  installApp: async (appId) => {
    const { installedApps } = get();
    if (installedApps.includes(appId)) return;
    const updated = [...installedApps, appId];
    localStorage.setItem("debian_installed_apps", JSON.stringify(updated));
    set({ installedApps: updated });
    const meta = INSTALLABLE_APPS[appId];
    if (meta && fs.ready) {
      await fs.writeFile(
        `/usr/share/applications/${appId}.desktop`,
        `[Desktop Entry]\nName=${meta.name}\nExec=${appId}\nType=Application\nVersion=${meta.version}`
      );
      await fs.writeFile(
        `/home/user/Desktop/${meta.name}.desktop`,
        `[Desktop Entry]\nName=${meta.name}\nExec=${appId}\nType=Application`
      );
    }
  },

  uninstallApp: async (appId) => {
    const { installedApps, windows } = get();
    const updated = installedApps.filter((id) => id !== appId);
    localStorage.setItem("debian_installed_apps", JSON.stringify(updated));
    const newWindows = { ...windows };
    Object.keys(newWindows).forEach((wid) => {
      if (newWindows[wid].appId === appId) delete newWindows[wid];
    });
    set({ installedApps: updated, windows: newWindows });
    const meta = INSTALLABLE_APPS[appId];
    if (meta && fs.ready) {
      await fs.rm(`/usr/share/applications/${appId}.desktop`);
      await fs.rm(`/home/user/Desktop/${meta.name}.desktop`);
    }
  },

  isAppInstalled: (appId) => get().installedApps.includes(appId),

  addNotification: (message) => {
    const id = Date.now();
    set({ notifications: [...get().notifications, { id, message }] });
    setTimeout(() => {
      set({
        notifications: get().notifications.filter((n) => n.id !== id),
      });
    }, 3500);
  },
}));

export default useDesktopStore;
