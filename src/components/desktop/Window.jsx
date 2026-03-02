import { useCallback } from "react";
import { Minus, Square, X } from "lucide-react";
import useDesktopStore from "@/store/desktopStore";

export default function Window({ window: win, children }) {
  const { activeWindowId, focusWindow, closeWindow, minimizeWindow, maximizeWindow, updateWindow } =
    useDesktopStore();
  const isActive = activeWindowId === win.id;

  const handleTitleMouseDown = useCallback(
    (e) => {
      if (e.target.closest("[data-window-controls]")) return;
      if (win.maximized) return;
      e.preventDefault();
      const startX = e.clientX - win.x;
      const startY = e.clientY - win.y;
      const onMove = (ev) => {
        updateWindow(win.id, {
          x: ev.clientX - startX,
          y: Math.max(32, ev.clientY - startY),
        });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.userSelect = "";
      };
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [win.id, win.x, win.y, win.maximized, updateWindow]
  );

  const handleResize = useCallback(
    (e, dir) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const oX = win.x, oY = win.y, oW = win.width, oH = win.height;
      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const u = {};
        if (dir.includes("e")) u.width = Math.max(300, oW + dx);
        if (dir.includes("w")) { u.width = Math.max(300, oW - dx); u.x = oX + oW - u.width; }
        if (dir.includes("s")) u.height = Math.max(200, oH + dy);
        if (dir.includes("n")) { u.height = Math.max(200, oH - dy); u.y = Math.max(32, oY + oH - u.height); }
        updateWindow(win.id, u);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.userSelect = "";
      };
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [win.id, win.x, win.y, win.width, win.height, updateWindow]
  );

  const style = win.maximized
    ? {
        position: "fixed",
        left: 0,
        top: 32,
        width: "100vw",
        height: "calc(100vh - 32px)",
        zIndex: win.zIndex,
        borderRadius: 0,
      }
    : {
        position: "absolute",
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      };

  if (win.minimized) {
    style.position = "fixed";
    style.left = "-9999px";
    style.top = "-9999px";
    style.visibility = "hidden";
    style.pointerEvents = "none";
  }

  return (
    <div
      className={`window ${isActive && !win.minimized ? "window-active" : ""} ${win.isClosing ? "window-closing" : ""}`}
      style={style}
      onMouseDown={() => !win.minimized && focusWindow(win.id)}
      data-testid={`window-${win.appId}`}
      aria-hidden={win.minimized}
    >
      <div
        className="window-titlebar"
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
      >
        <span className="window-title">{win.title}</span>
        <div className="window-controls" data-window-controls="true">
          <button
            className="window-btn minimize"
            onClick={() => minimizeWindow(win.id)}
            data-testid={`minimize-${win.appId}`}
          >
            <Minus size={14} />
          </button>
          <button
            className="window-btn maximize"
            onClick={() => maximizeWindow(win.id)}
            data-testid={`maximize-${win.appId}`}
          >
            <Square size={11} />
          </button>
          <button
            className="window-btn close"
            onClick={() => closeWindow(win.id)}
            data-testid={`close-${win.appId}`}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="window-content">{children}</div>
      {!win.maximized && !win.minimized && (
        <>
          <div className="resize-handle resize-n" onMouseDown={(e) => handleResize(e, "n")} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResize(e, "s")} />
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResize(e, "e")} />
          <div className="resize-handle resize-w" onMouseDown={(e) => handleResize(e, "w")} />
          <div className="resize-handle resize-ne" onMouseDown={(e) => handleResize(e, "ne")} />
          <div className="resize-handle resize-nw" onMouseDown={(e) => handleResize(e, "nw")} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResize(e, "se")} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => handleResize(e, "sw")} />
        </>
      )}
    </div>
  );
}
