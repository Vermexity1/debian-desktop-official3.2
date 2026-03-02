import useDesktopStore from "@/store/desktopStore";
import useSystemStore from "@/engines/systemStore";

let altTabActive = false;
let altTabIndex = 0;
let altTabWindows = [];
let altTabCallback = null;
let superCallback = null;

export function registerAltTabCallback(cb) {
  altTabCallback = cb;
}

export function registerSuperCallback(cb) {
  superCallback = cb;
}

export function initKeyboardManager() {
  const handleKeyDown = (e) => {
    const store = useDesktopStore.getState();
    const sysStore = useSystemStore.getState();
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);

    if (e.key === "Meta" || e.key === "Super") {
      e.preventDefault();
      if (superCallback) superCallback();
      return;
    }

    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      const wins = Object.values(store.windows).filter(
        (w) => w.workspace === store.currentWorkspace && !w.isClosing
      );
      if (wins.length === 0) return;
      if (!altTabActive) {
        altTabActive = true;
        altTabWindows = wins;
        const currentIdx = wins.findIndex((w) => w.id === store.activeWindowId);
        altTabIndex = currentIdx >= 0 ? (currentIdx + 1) % wins.length : 0;
      } else {
        altTabIndex = (altTabIndex + 1) % altTabWindows.length;
      }
      if (altTabCallback) {
        altTabCallback({
          active: true,
          windows: altTabWindows,
          selectedIndex: altTabIndex,
        });
      }
      return;
    }

    if (e.ctrlKey && e.key === "w" && !isInput) {
      e.preventDefault();
      if (store.activeWindowId) {
        store.closeWindow(store.activeWindowId);
      }
      return;
    }

    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("app-save", { detail: { windowId: store.activeWindowId } }));
      return;
    }

    if (e.key === "F11") {
      e.preventDefault();
      if (store.activeWindowId) {
        store.maximizeWindow(store.activeWindowId);
      }
      return;
    }

    if (e.altKey && e.key === "F4") {
      e.preventDefault();
      if (store.activeWindowId) {
        store.closeWindow(store.activeWindowId);
      }
      return;
    }

    if ((e.key === "AudioVolumeUp" || (e.ctrlKey && e.shiftKey && e.key === "ArrowUp"))) {
      e.preventDefault();
      sysStore.setVolume(sysStore.volume + 5);
      return;
    }

    if ((e.key === "AudioVolumeDown" || (e.ctrlKey && e.shiftKey && e.key === "ArrowDown"))) {
      e.preventDefault();
      sysStore.setVolume(sysStore.volume - 5);
      return;
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Alt" && altTabActive) {
      altTabActive = false;
      const selectedWin = altTabWindows[altTabIndex];
      if (selectedWin) {
        const store = useDesktopStore.getState();
        store.focusWindow(selectedWin.id);
      }
      if (altTabCallback) {
        altTabCallback({ active: false, windows: [], selectedIndex: 0 });
      }
      altTabWindows = [];
      altTabIndex = 0;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}
