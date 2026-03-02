import { useState } from "react";
import {
  Palette, Monitor, Info, Wifi, User, Volume2, Shield, Bell, Keyboard,
  Mouse, Battery, Globe, Clock, Accessibility, Heart,
} from "lucide-react";
import useDesktopStore from "@/store/desktopStore";
import useSystemStore from "@/engines/systemStore";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const WALLPAPERS = [
  "https://images.unsplash.com/photo-1771793079119-741d01efc71a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGVtZXJhbGQlMjBncmVlbiUyMGRpZ2l0YWwlMjB3YXZlcyUyMGRhcmslMjB3YWxscGFwZXIlMjA0a3xlbnwwfHx8fDE3NzIxNDQ5NDV8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1475274047050-1d0c55b0e6cd?w=1920&q=80",
  "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
  "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80",
];

const SECTIONS = [
  { id: "appearance", icon: Palette, label: "Appearance" },
  { id: "display", icon: Monitor, label: "Display" },
  { id: "sound", icon: Volume2, label: "Sound" },
  { id: "network", icon: Wifi, label: "Network" },
  { id: "users", icon: User, label: "Users" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "keyboard", icon: Keyboard, label: "Keyboard" },
  { id: "mouse", icon: Mouse, label: "Mouse & Touchpad" },
  { id: "power", icon: Battery, label: "Power" },
  { id: "privacy", icon: Shield, label: "Privacy" },
  { id: "region", icon: Globe, label: "Region & Language" },
  { id: "about", icon: Info, label: "About" },
  { id: "creator", icon: Heart, label: "About the Creator" },
];

const ACCENT_COLORS = [
  { name: "Blue", value: "#3584e4" },
  { name: "Green", value: "#26a269" },
  { name: "Red", value: "#e01b24" },
  { name: "Purple", value: "#9141ac" },
  { name: "Orange", value: "#e66100" },
  { name: "Teal", value: "#2190a4" },
];

export default function SettingsApp() {
  const [section, setSection] = useState("appearance");
  const { wallpaper, setWallpaper, user, logout } = useDesktopStore();
  const { volume, brightness, setVolume, setBrightness, network, battery, platform } = useSystemStore();
  const [accentColor, setAccentColor] = useState("#3584e4");
  const [darkMode, setDarkMode] = useState(true);
  const [nightLight, setNightLight] = useState(false);
  const [nightLightTemp, setNightLightTemp] = useState(50);
  const [animations, setAnimations] = useState(true);
  const [fontSize, setFontSize] = useState(11);
  const [notifications, setNotifications] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [mouseSpeed, setMouseSpeed] = useState(50);
  const [naturalScroll, setNaturalScroll] = useState(false);
  const [tapToClick, setTapToClick] = useState(true);
  const [keyRepeat, setKeyRepeat] = useState(true);
  const [keyRepeatDelay, setKeyRepeatDelay] = useState(500);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [suspendDelay, setSuspendDelay] = useState(20);
  const [screenLock, setScreenLock] = useState(true);
  const [locationServices, setLocationServices] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("English (US)");

  const applyAccent = (color) => {
    setAccentColor(color);
    document.documentElement.style.setProperty("--accent-color", color);
  };

  return (
    <div className="settings-app" data-testid="settings-app">
      <div className="settings-sidebar">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`settings-nav-item ${section === s.id ? "active" : ""}`}
            onClick={() => setSection(s.id)}
            data-testid={`settings-nav-${s.id}`}
          >
            <s.icon size={16} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* APPEARANCE */}
        {section === "appearance" && (
          <div className="settings-section">
            <h2>Appearance</h2>
            <div className="settings-row">
              <span className="settings-row-label">Dark Mode</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} data-testid="dark-mode-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Animations</span>
              <Switch checked={animations} onCheckedChange={setAnimations} data-testid="animations-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Font Size</span>
              <div style={{ width: 160 }}>
                <Slider value={[fontSize]} min={8} max={16} step={1} onValueChange={(v) => setFontSize(v[0])} />
              </div>
              <span className="settings-row-value">{fontSize}pt</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="settings-row-label" style={{ marginBottom: 8 }}>Accent Color</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => applyAccent(c.value)}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", background: c.value, border: accentColor === c.value ? "3px solid white" : "2px solid transparent",
                      cursor: "pointer", padding: 0, transition: "border 0.15s",
                    }}
                    title={c.name}
                    data-testid={`accent-${c.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: "0.8125rem", color: "#9a9996", marginBottom: 12 }}>Wallpaper</p>
              <div className="wallpaper-grid">
                {WALLPAPERS.map((wp, i) => (
                  <div
                    key={i}
                    className={`wallpaper-option ${wallpaper === wp ? "selected" : ""}`}
                    style={{ backgroundImage: `url(${wp})` }}
                    onClick={() => setWallpaper(wp)}
                    data-testid={`wallpaper-option-${i}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DISPLAY */}
        {section === "display" && (
          <div className="settings-section">
            <h2>Display</h2>
            <div className="settings-row">
              <span className="settings-row-label">Resolution</span>
              <span className="settings-row-value">{window.innerWidth} × {window.innerHeight}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Brightness</span>
              <div style={{ width: 200 }}>
                <Slider value={[brightness]} min={20} max={100} step={1} onValueChange={(v) => setBrightness(v[0])} data-testid="brightness-slider" />
              </div>
              <span className="settings-row-value">{brightness}%</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Night Light</span>
              <Switch checked={nightLight} onCheckedChange={setNightLight} data-testid="night-light-switch" />
            </div>
            {nightLight && (
              <div className="settings-row" style={{ paddingLeft: 16 }}>
                <span className="settings-row-label">Color Temperature</span>
                <div style={{ width: 200 }}>
                  <Slider value={[nightLightTemp]} min={0} max={100} step={1} onValueChange={(v) => setNightLightTemp(v[0])} />
                </div>
                <span className="settings-row-value">{nightLightTemp}%</span>
              </div>
            )}
            <div className="settings-row">
              <span className="settings-row-label">Scale</span>
              <select style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>100%</option>
                <option>125%</option>
                <option>150%</option>
                <option>200%</option>
              </select>
            </div>
          </div>
        )}

        {/* SOUND */}
        {section === "sound" && (
          <div className="settings-section">
            <h2>Sound</h2>
            <div className="settings-row">
              <span className="settings-row-label">Output Volume</span>
              <div style={{ width: 200 }}>
                <Slider value={[volume]} min={0} max={100} step={1} onValueChange={(v) => setVolume(v[0])} data-testid="volume-slider" />
              </div>
              <span className="settings-row-value">{volume}%</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Output Device</span>
              <select style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>Built-in Speakers</option>
                <option>HDMI Audio</option>
                <option>Bluetooth Headset</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Input (Microphone)</span>
              <div style={{ width: 200 }}>
                <Slider value={[70]} min={0} max={100} step={1} onValueChange={() => {}} />
              </div>
              <span className="settings-row-value">70%</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">System Sounds</span>
              <Switch defaultChecked data-testid="system-sounds-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Alert Sound</span>
              <select style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>Default</option>
                <option>Bark</option>
                <option>Drip</option>
                <option>Glass</option>
              </select>
            </div>
          </div>
        )}

        {/* NETWORK */}
        {section === "network" && (
          <div className="settings-section">
            <h2>Network</h2>
            <div className="settings-row">
              <span className="settings-row-label">Status</span>
              <span className="settings-row-value" style={{ color: network?.online ? "#26a269" : "#e01b24" }}>
                {network?.online ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Wi-Fi</span>
              <Switch defaultChecked data-testid="wifi-switch" />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: "0.8rem", color: "#9a9996", marginBottom: 8 }}>Available Networks</div>
              {["HomeNetwork-5G", "Office_WiFi", "CoffeeShop_Guest", "Neighbor_2.4G"].map((net, i) => (
                <div key={net} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: i === 0 ? "rgba(53,132,228,0.1)" : "rgba(255,255,255,0.03)", borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: "0.85rem", color: i === 0 ? "#3584e4" : "white" }}>{net}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {i === 0 && <span style={{ fontSize: "0.7rem", color: "#26a269" }}>Connected</span>}
                    <span style={{ fontSize: "0.7rem", color: "#5e5c64" }}>{"▂▄▆"[Math.min(2, 2 - i)]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="settings-row" style={{ marginTop: 16 }}>
              <span className="settings-row-label">Bluetooth</span>
              <Switch data-testid="bluetooth-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">VPN</span>
              <Switch data-testid="vpn-switch" />
            </div>
          </div>
        )}

        {/* USERS */}
        {section === "users" && (
          <div className="settings-section">
            <h2>Users</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#3584e4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "white" }}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "white" }}>{user?.username || "User"}</div>
                <div style={{ fontSize: "0.75rem", color: "#9a9996" }}>Administrator</div>
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Account Type</span>
              <span className="settings-row-value">Administrator</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Automatic Login</span>
              <Switch data-testid="auto-login-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Password</span>
              <button style={{ padding: "4px 12px", background: "#353535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", cursor: "pointer", fontSize: "0.8rem" }}>Change Password</button>
            </div>
            <button
              onClick={logout}
              style={{ marginTop: 24, padding: "8px 20px", background: "#e01b24", border: "none", borderRadius: 6, color: "white", cursor: "pointer", fontSize: "0.875rem" }}
              data-testid="logout-btn"
            >Log Out</button>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {section === "notifications" && (
          <div className="settings-section">
            <h2>Notifications</h2>
            <div className="settings-row">
              <span className="settings-row-label">Notifications</span>
              <Switch checked={notifications} onCheckedChange={setNotifications} data-testid="notifications-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Do Not Disturb</span>
              <Switch checked={doNotDisturb} onCheckedChange={setDoNotDisturb} data-testid="dnd-switch" />
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: "0.8rem", color: "#9a9996", marginBottom: 8 }}>Application Notifications</div>
              {["Terminal", "Files", "Software Center", "System Monitor"].map((app) => (
                <div key={app} className="settings-row">
                  <span className="settings-row-label">{app}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KEYBOARD */}
        {section === "keyboard" && (
          <div className="settings-section">
            <h2>Keyboard</h2>
            <div className="settings-row">
              <span className="settings-row-label">Key Repeat</span>
              <Switch checked={keyRepeat} onCheckedChange={setKeyRepeat} />
            </div>
            {keyRepeat && (
              <>
                <div className="settings-row">
                  <span className="settings-row-label">Repeat Delay</span>
                  <div style={{ width: 200 }}>
                    <Slider value={[keyRepeatDelay]} min={100} max={1000} step={50} onValueChange={(v) => setKeyRepeatDelay(v[0])} />
                  </div>
                  <span className="settings-row-value">{keyRepeatDelay}ms</span>
                </div>
              </>
            )}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: "0.8rem", color: "#9a9996", marginBottom: 8 }}>Keyboard Shortcuts</div>
              {[
                { action: "Close Window", shortcut: "Alt+F4" },
                { action: "Switch Windows", shortcut: "Alt+Tab" },
                { action: "Toggle Maximize", shortcut: "F11" },
                { action: "Save File", shortcut: "Ctrl+S" },
                { action: "Volume Up", shortcut: "Ctrl+Shift+↑" },
                { action: "Volume Down", shortcut: "Ctrl+Shift+↓" },
              ].map((s) => (
                <div key={s.action} className="settings-row">
                  <span className="settings-row-label">{s.action}</span>
                  <kbd style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", color: "#9a9996" }}>{s.shortcut}</kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOUSE */}
        {section === "mouse" && (
          <div className="settings-section">
            <h2>Mouse &amp; Touchpad</h2>
            <div className="settings-row">
              <span className="settings-row-label">Mouse Speed</span>
              <div style={{ width: 200 }}>
                <Slider value={[mouseSpeed]} min={1} max={100} step={1} onValueChange={(v) => setMouseSpeed(v[0])} />
              </div>
              <span className="settings-row-value">{mouseSpeed}%</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Natural Scrolling</span>
              <Switch checked={naturalScroll} onCheckedChange={setNaturalScroll} />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Tap to Click</span>
              <Switch checked={tapToClick} onCheckedChange={setTapToClick} />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Primary Button</span>
              <select style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>Left</option>
                <option>Right</option>
              </select>
            </div>
          </div>
        )}

        {/* POWER */}
        {section === "power" && (
          <div className="settings-section">
            <h2>Power</h2>
            {battery?.level >= 0 && (
              <div className="settings-row">
                <span className="settings-row-label">Battery</span>
                <span className="settings-row-value" style={{ color: battery.level > 20 ? "#26a269" : "#e01b24" }}>
                  {battery.level}%{battery.charging ? " (Charging)" : ""}
                </span>
              </div>
            )}
            <div className="settings-row">
              <span className="settings-row-label">Auto Suspend</span>
              <Switch checked={autoSuspend} onCheckedChange={setAutoSuspend} />
            </div>
            {autoSuspend && (
              <div className="settings-row">
                <span className="settings-row-label">Suspend After</span>
                <select value={suspendDelay} onChange={(e) => setSuspendDelay(Number(e.target.value))} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            )}
            <div className="settings-row">
              <span className="settings-row-label">Screen Lock</span>
              <Switch checked={screenLock} onCheckedChange={setScreenLock} />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Power Button Action</span>
              <select style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>Suspend</option>
                <option>Hibernate</option>
                <option>Shut Down</option>
                <option>Nothing</option>
              </select>
            </div>
          </div>
        )}

        {/* PRIVACY */}
        {section === "privacy" && (
          <div className="settings-section">
            <h2>Privacy</h2>
            <div className="settings-row">
              <span className="settings-row-label">Location Services</span>
              <Switch checked={locationServices} onCheckedChange={setLocationServices} data-testid="location-switch" />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Usage &amp; History</span>
              <Switch defaultChecked />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Diagnostics</span>
              <Switch />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Camera Access</span>
              <Switch defaultChecked />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Microphone Access</span>
              <Switch defaultChecked />
            </div>
            <button style={{ marginTop: 16, padding: "8px 16px", background: "#353535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#e01b24", cursor: "pointer", fontSize: "0.8rem" }}>
              Clear Recent Files
            </button>
          </div>
        )}

        {/* REGION */}
        {section === "region" && (
          <div className="settings-section">
            <h2>Region &amp; Language</h2>
            <div className="settings-row">
              <span className="settings-row-label">Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Español</option>
                <option>Français</option>
                <option>Deutsch</option>
                <option>日本語</option>
                <option>中文</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Time Zone</span>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option value="America/New_York">Eastern (UTC-5)</option>
                <option value="America/Chicago">Central (UTC-6)</option>
                <option value="America/Denver">Mountain (UTC-7)</option>
                <option value="America/Los_Angeles">Pacific (UTC-8)</option>
                <option value="Europe/London">London (UTC+0)</option>
                <option value="Europe/Paris">Paris (UTC+1)</option>
                <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Date Format</span>
              <select style={{ background: "#303030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", padding: "4px 8px", fontSize: "0.8rem" }}>
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">24-Hour Clock</span>
              <Switch />
            </div>
          </div>
        )}

        {/* ABOUT THE CREATOR */}
        {section === "creator" && (
          <div className="settings-section">
            <h2>About the Creator</h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "8px 0 16px" }}>

              {/* Avatar */}
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "linear-gradient(135deg, #3584e4 0%, #9141ac 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.6rem", boxShadow: "0 0 0 4px rgba(53,132,228,0.25), 0 8px 32px rgba(0,0,0,0.4)",
              }}>
                👨‍💻
              </div>

              {/* Name */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "white", marginBottom: 4, letterSpacing: "-0.01em" }}>
                  Jathin Potnuru
                </div>
                <div style={{ fontSize: "0.8rem", color: "#3584e4", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Developer &amp; Creator
                </div>
              </div>

              {/* Bio card */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 14,
                padding: "20px 24px",
                maxWidth: 440,
                width: "100%",
                lineHeight: 1.75,
                fontSize: "0.875rem",
                color: "#ccc",
                textAlign: "center",
              }}>
                <p style={{ margin: "0 0 12px" }}>
                  Hey there! 👋 I'm Jathin — a passionate developer who loves turning creative ideas into interactive experiences. This Debian desktop simulator was built purely for the joy of it: because why not bring a full Linux desktop to the browser?
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  When I'm not coding I'm probably exploring new tech, playing video games (yes, including the ones in this very app 🎮), or chasing the next big idea at the intersection of design and engineering.
                </p>
                <p style={{ margin: 0 }}>
                  Thanks for checking this out — it genuinely means the world. ✨
                </p>
              </div>

              {/* Divider */}
              <div style={{ width: "100%", maxWidth: 440, height: 1, background: "rgba(255,255,255,0.08)" }} />

              {/* Socials */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.78rem", color: "#9a9996", marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Follow the socials
                </div>
                <a
                  href="https://www.instagram.com/jathinpotnuru89/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "11px 24px",
                    borderRadius: 50,
                    textDecoration: "none",
                    background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    boxShadow: "0 4px 18px rgba(220,39,67,0.4)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(220,39,67,0.55)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 18px rgba(220,39,67,0.4)"; }}
                >
                  {/* Instagram SVG icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @jathinpotnuru89
                </a>
              </div>

              {/* Footer note */}
              <div style={{ fontSize: "0.72rem", color: "#5e5c64", textAlign: "center", marginTop: 4 }}>
                Made with ❤️ by Jathin Potnuru
              </div>

            </div>
          </div>
        )}

        {section === "about" && (
          <div className="settings-section">
            <h2>About</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "OS", value: "Debian GNU/Linux 12 (bookworm)" },
                { label: "Kernel", value: "Linux 6.1.0-21-amd64" },
                { label: "Desktop", value: "GNOME 43.9" },
                { label: "Windowing System", value: "Wayland" },
                { label: "Processor", value: `${platform?.cores || 4}-core CPU` },
                { label: "Memory", value: `${platform?.deviceMemory || 4} GB RAM` },
                { label: "Graphics", value: "Mesa Intel® UHD Graphics" },
                { label: "Disk", value: "256 GB SSD" },
                { label: "Hostname", value: "debian-desktop" },
                { label: "User", value: user?.username || "user" },
              ].map((item) => (
                <div key={item.label} className="settings-row">
                  <span className="settings-row-label">{item.label}</span>
                  <span className="settings-row-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
