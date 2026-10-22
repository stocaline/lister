import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { listen } from "@tauri-apps/api/event";
import "./index.css";
import App from "./App";
import TimerWindow from "./components/TimerWindow";
import { applySettings, loadSettings, type Settings } from "./settings";

const isTimer = window.location.pathname === "/timer";

// Theme, accent and font are applied before the first paint so nothing flashes.
loadSettings().then((settings) => {
  applySettings(settings);
  // The floating timer follows changes made in Configurações.
  if (isTimer) listen<Settings>("settings-changed", ({ payload }) => applySettings(payload));
  createRoot(document.getElementById("root")!).render(
    <StrictMode>{isTimer ? <TimerWindow /> : <App initialSettings={settings} />}</StrictMode>,
  );
});
