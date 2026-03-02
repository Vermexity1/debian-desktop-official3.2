import { useState } from "react";
import { User, Lock } from "lucide-react";
import useDesktopStore from "@/store/desktopStore";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, wallpaper } = useDesktopStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 400));

    if (isRegistering) {
      const existing = localStorage.getItem(`debian_user_${username.trim()}`);
      if (existing) {
        setError("Username already exists");
        setLoading(false);
        return;
      }
      const user = { id: `user-${Date.now()}`, username: username.trim() };
      localStorage.setItem(`debian_user_${username.trim()}`, JSON.stringify({ ...user, password }));
      localStorage.setItem("auth_user", JSON.stringify(user));
      login(user, "local-token");
    } else {
      const storedStr = localStorage.getItem(`debian_user_${username.trim()}`);
      if (!storedStr) {
        // First time login — auto-create account
        const user = { id: `user-${Date.now()}`, username: username.trim() };
        localStorage.setItem(`debian_user_${username.trim()}`, JSON.stringify({ ...user, password }));
        localStorage.setItem("auth_user", JSON.stringify(user));
        login(user, "local-token");
      } else {
        const stored = JSON.parse(storedStr);
        if (stored.password !== password) {
          setError("Invalid password");
          setLoading(false);
          return;
        }
        const user = { id: stored.id, username: stored.username };
        localStorage.setItem("auth_user", JSON.stringify(user));
        login(user, "local-token");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="login-screen"
      style={{ backgroundImage: `url(${wallpaper})` }}
      data-testid="login-screen"
    >
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-avatar" data-testid="login-avatar">
          <User size={48} color="#9a9996" />
        </div>
        <h2>Debian Desktop</h2>
        <p style={{ fontSize: "0.75rem", color: "#5e5c64", marginBottom: 8 }}>GNU/Linux 12 (bookworm)</p>
        <input
          className="login-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          data-testid="login-username"
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="login-password"
        />
        {error && <div className="login-error" data-testid="login-error">{error}</div>}
        <button className="login-btn" type="submit" disabled={loading} data-testid="login-submit">
          {loading ? "Authenticating..." : isRegistering ? "Create Account" : "Sign In"}
        </button>
        <button
          type="button"
          className="login-toggle"
          onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
          data-testid="login-toggle"
        >
          {isRegistering ? "Already have an account? Sign In" : "New user? Create account"}
        </button>
        <p style={{ fontSize: "0.65rem", color: "#5e5c64", marginTop: 8, textAlign: "center" }}>
          Enter any username &amp; password to log in
        </p>
      </form>
    </div>
  );
}
