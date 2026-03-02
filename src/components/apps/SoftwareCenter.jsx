import { useState, useEffect, useCallback } from "react";
import {
  Globe, FileText, Image, Play, Box, Pen, Music, Code, Mail, Download, Gamepad2,
  Check, Loader2, AlertCircle, Search, Star, Trash2, RefreshCw, Package,
} from "lucide-react";
import useDesktopStore, { INSTALLABLE_APPS } from "@/store/desktopStore";
import { fs } from "@/engines/filesystem";
import { Progress } from "@/components/ui/progress";

const ICON_MAP = { Globe, FileText, Image, Play, Box, Pen, Music, Code, Mail, Download, Gamepad2 };

const CATEGORIES = [
  { id: "all", label: "All Apps" },
  { id: "internet", label: "Internet" },
  { id: "office", label: "Office" },
  { id: "graphics", label: "Graphics" },
  { id: "multimedia", label: "Multimedia" },
  { id: "development", label: "Development" },
  { id: "games", label: "Games" },
  { id: "system", label: "System" },
];

const APP_CATEGORIES = {
  firefox: "internet",
  thunderbird: "internet",
  transmission: "internet",
  libreoffice: "office",
  gimp: "graphics",
  inkscape: "graphics",
  vlc: "multimedia",
  audacity: "multimedia",
  blender: "graphics",
  vscode: "development",
  steam: "games",
};

const APP_RATINGS = {
  firefox: 4.8, libreoffice: 4.5, gimp: 4.3, vlc: 4.9,
  blender: 4.7, inkscape: 4.4, audacity: 4.6, vscode: 4.9,
  thunderbird: 4.2, transmission: 4.5, steam: 4.8,
};

const APP_DESCRIPTIONS = {
  firefox: "A fast, private and secure web browser. Firefox protects your privacy automatically.",
  libreoffice: "A powerful office suite. Compatible with Microsoft Office formats.",
  gimp: "GNU Image Manipulation Program. A free and open-source image editor.",
  vlc: "A free and open source cross-platform multimedia player and framework.",
  blender: "Free and open source 3D creation suite for modeling, animation, and rendering.",
  inkscape: "Professional vector graphics editor. Create scalable vector graphics.",
  audacity: "Free, open source, cross-platform audio software for recording and editing.",
  vscode: "A lightweight but powerful source code editor with built-in support for many languages.",
  thunderbird: "A free email application that's easy to set up and customize.",
  transmission: "A fast, easy, and free BitTorrent client.",
  steam: "The ultimate gaming platform. Play 5 built-in games including Snake, Tetris, Flappy Bird, Space Invaders, and a 3D FPS shooter.",
};

const INSTALL_LOG_LINES = [
  "Reading package lists...",
  "Building dependency tree...",
  "Reading state information...",
  "Fetching dependencies...",
  "Downloading packages...",
  "Unpacking archives...",
  "Setting up application...",
  "Processing triggers...",
  "Configuring desktop entry...",
  "Installation complete.",
];

export default function SoftwareCenter() {
  const { installedApps, installApp, uninstallApp, addNotification } = useDesktopStore();
  const [installing, setInstalling] = useState({});
  const [uninstalling, setUninstalling] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [logLines, setLogLines] = useState({});
  const [error, setError] = useState({});
  const [category, setCategory] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);

  const packages = Object.values(INSTALLABLE_APPS);

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = !searchQuery || pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || pkg.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "all" || APP_CATEGORIES[pkg.id] === category;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = useCallback(async (appId) => {
    const meta = INSTALLABLE_APPS[appId];
    if (!meta) return;
    setInstalling((prev) => ({ ...prev, [appId]: 0 }));
    setLogLines((prev) => ({ ...prev, [appId]: [] }));
    setError((prev) => ({ ...prev, [appId]: null }));

    for (let i = 0; i <= 100; i += 2) {
      await new Promise((r) => setTimeout(r, 40));
      setInstalling((prev) => ({ ...prev, [appId]: i }));
      const logIdx = Math.floor((i / 100) * INSTALL_LOG_LINES.length);
      if (logIdx < INSTALL_LOG_LINES.length) {
        setLogLines((prev) => {
          const current = prev[appId] || [];
          if (!current.includes(INSTALL_LOG_LINES[logIdx])) {
            return { ...prev, [appId]: [...current, INSTALL_LOG_LINES[logIdx]] };
          }
          return prev;
        });
      }
    }

    try {
      await installApp(appId);
      if (fs.ready) {
        if (!fs.getNode("/usr/share/applications")) await fs.mkdir("/usr/share/applications");
        await fs.writeFile(`/usr/share/applications/${appId}.desktop`,
          `[Desktop Entry]\nName=${meta.name}\nExec=${appId}\nType=Application\nVersion=${meta.version}\nComment=${meta.desc}`);
        await fs.writeFile(`/home/user/Desktop/${meta.name}.desktop`,
          `[Desktop Entry]\nName=${meta.name}\nExec=${appId}\nType=Application\nIcon=${meta.iconName}`);
      }
      addNotification(`${meta.name} installed successfully`);
    } catch (err) {
      setError((prev) => ({ ...prev, [appId]: "Installation failed" }));
      addNotification(`Failed to install ${meta.name}`);
    }

    setInstalling((prev) => { const next = { ...prev }; delete next[appId]; return next; });
  }, [installApp, addNotification]);

  const handleUninstall = useCallback(async (appId) => {
    const meta = INSTALLABLE_APPS[appId];
    if (!meta) return;
    if (!window.confirm(`Uninstall ${meta.name}?`)) return;
    setUninstalling((prev) => ({ ...prev, [appId]: 0 }));

    for (let i = 0; i <= 100; i += 4) {
      await new Promise((r) => setTimeout(r, 30));
      setUninstalling((prev) => ({ ...prev, [appId]: i }));
    }

    await uninstallApp(appId);
    if (fs.ready) {
      await fs.rm(`/usr/share/applications/${appId}.desktop`);
      await fs.rm(`/home/user/Desktop/${meta.name}.desktop`);
    }
    addNotification(`${meta.name} uninstalled`);
    setUninstalling((prev) => { const next = { ...prev }; delete next[appId]; return next; });
  }, [uninstallApp, addNotification]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={10} fill={i < Math.floor(rating) ? "#f8e45c" : "none"} color={i < Math.floor(rating) ? "#f8e45c" : "#5e5c64"} />
    ));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" }} data-testid="software-center-app">
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
        <Package size={20} color="#9141ac" />
        <span style={{ fontWeight: 600, color: "white", fontSize: "1rem" }}>Software Center</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "6px 12px" }}>
          <Search size={14} color="#5e5c64" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search software..."
            style={{ background: "none", border: "none", color: "white", fontSize: "0.85rem", outline: "none", width: 180 }}
            data-testid="software-search"
          />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 160, borderRight: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", overflowY: "auto" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 16px",
                background: category === cat.id ? "rgba(145,65,172,0.15)" : "none",
                border: "none", color: category === cat.id ? "#9141ac" : "#9a9996",
                cursor: "pointer", fontSize: "0.8rem",
                borderLeft: category === cat.id ? "3px solid #9141ac" : "3px solid transparent",
              }}
            >{cat.label}</button>
          ))}
          <div style={{ marginTop: 16, padding: "0 16px" }}>
            <div style={{ fontSize: "0.7rem", color: "#5e5c64", marginBottom: 8 }}>Installed</div>
            <div style={{ fontSize: "0.875rem", color: "white", fontWeight: 600 }}>{Object.keys(installedApps || {}).length}</div>
          </div>
        </div>

        {/* App list */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {selectedApp ? (
            // App detail view
            <div>
              <button onClick={() => setSelectedApp(null)} style={{ background: "none", border: "none", color: "#3584e4", cursor: "pointer", fontSize: "0.8rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
                ← Back to list
              </button>
              <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(() => { const IconComp = ICON_MAP[selectedApp.iconName] || Package; return <IconComp size={40} color="#9141ac" />; })()}
                </div>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>{selectedApp.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#9a9996", marginBottom: 4 }}>{selectedApp.desc}</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{renderStars(APP_RATINGS[selectedApp.id] || 4)}</div>
                  <div style={{ fontSize: "0.75rem", color: "#5e5c64" }}>Version {selectedApp.version} • {selectedApp.size}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#9a9996", lineHeight: 1.6, marginBottom: 20 }}>
                {APP_DESCRIPTIONS[selectedApp.id] || selectedApp.desc}
              </p>
              {installedApps?.[selectedApp.id] ? (
                <button onClick={() => handleUninstall(selectedApp.id)} style={{ padding: "10px 24px", background: "#e01b24", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: "0.875rem" }}>
                  <Trash2 size={14} style={{ display: "inline", marginRight: 6 }} />Uninstall
                </button>
              ) : (
                <button onClick={() => handleInstall(selectedApp.id)} style={{ padding: "10px 24px", background: "#9141ac", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: "0.875rem" }}>
                  <Download size={14} style={{ display: "inline", marginRight: 6 }} />Install
                </button>
              )}
              {installing[selectedApp.id] !== undefined && (
                <div style={{ marginTop: 16 }}>
                  <Progress value={installing[selectedApp.id]} className="h-2" />
                  <div style={{ marginTop: 8, background: "#1a1a1a", borderRadius: 6, padding: 8, maxHeight: 120, overflowY: "auto" }}>
                    {(logLines[selectedApp.id] || []).map((line, i) => (
                      <div key={i} style={{ fontSize: "0.7rem", color: "#26a269", fontFamily: "monospace" }}>{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {filteredPackages.map((pkg) => {
                const IconComp = ICON_MAP[pkg.iconName] || Package;
                const isInstalled = installedApps?.[pkg.id];
                const isInstalling = installing[pkg.id] !== undefined;
                const isUninstalling = uninstalling[pkg.id] !== undefined;
                const rating = APP_RATINGS[pkg.id] || 4;

                return (
                  <div
                    key={pkg.id}
                    style={{
                      background: "#252525", borderRadius: 12, padding: 16, cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.15s",
                    }}
                    data-testid={`software-${pkg.id}`}
                  >
                    <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <IconComp size={28} color="#9141ac" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "#9a9996", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.desc}</div>
                        <div style={{ display: "flex", gap: 2, marginTop: 2 }}>{renderStars(rating)}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.65rem", color: "#5e5c64" }}>v{pkg.version} • {pkg.size}</span>
                      {isInstalled && <span style={{ fontSize: "0.65rem", color: "#26a269", display: "flex", alignItems: "center", gap: 2 }}><Check size={10} />Installed</span>}
                    </div>

                    {(isInstalling || isUninstalling) && (
                      <Progress value={isInstalling ? installing[pkg.id] : uninstalling[pkg.id]} className="h-1 mb-2" />
                    )}

                    {error[pkg.id] && (
                      <div style={{ fontSize: "0.7rem", color: "#e01b24", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <AlertCircle size={10} />{error[pkg.id]}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setSelectedApp(pkg)}
                        style={{ flex: 1, padding: "6px 8px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, color: "#9a9996", cursor: "pointer", fontSize: "0.75rem" }}
                      >Details</button>
                      {isInstalled ? (
                        <button
                          onClick={() => handleUninstall(pkg.id)}
                          disabled={isUninstalling}
                          style={{ flex: 1, padding: "6px 8px", background: isUninstalling ? "#353535" : "#e01b24", border: "none", borderRadius: 6, color: "white", cursor: isUninstalling ? "default" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                          data-testid={`uninstall-${pkg.id}`}
                        >
                          {isUninstalling ? <><Loader2 size={10} className="animate-spin" />Removing</> : <><Trash2 size={10} />Remove</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstall(pkg.id)}
                          disabled={isInstalling}
                          style={{ flex: 1, padding: "6px 8px", background: isInstalling ? "#353535" : "#9141ac", border: "none", borderRadius: 6, color: "white", cursor: isInstalling ? "default" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                          data-testid={`install-${pkg.id}`}
                        >
                          {isInstalling ? <><Loader2 size={10} className="animate-spin" />Installing</> : <><Download size={10} />Install</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredPackages.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#5e5c64" }}>
                  No apps found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
