import { useEffect, useState } from "react";
import "@/App.css";
import useDesktopStore from "@/store/desktopStore";
import LoginScreen from "@/components/desktop/LoginScreen";
import Desktop from "@/components/desktop/Desktop";

function App() {
  const { isAuthenticated, login } = useDesktopStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Local auth — no backend required
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        login(user, "local-token");
      } catch {}
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" data-testid="loading-screen">
        <div style={{ fontSize: "1.2rem", color: "#9a9996" }}>Loading Debian Desktop...</div>
      </div>
    );
  }

  return isAuthenticated ? <Desktop /> : <LoginScreen />;
}

export default App;
