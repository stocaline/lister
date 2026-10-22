import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { Window, getCurrentWindow } from "@tauri-apps/api/window";
import { fmtClock } from "../types";
import Icon from "./Icon";

interface SyncPayload {
  taskId?: string;
  isRunning: boolean;
  timeLog?: number;
  lastStartTime?: number | null;
  content?: string;
}

/** The floating scoreboard: same slab as the in-app placar, small enough to sit over any window. */
export default function TimerWindow() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [focused, setFocused] = useState(document.hasFocus());
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const un = listen<SyncPayload>("timer-state-sync", ({ payload: p }) => {
      if (p.taskId) {
        setTaskId(p.taskId);
        setLabel(p.content || "Tarefa");
      }
      setRunning(p.isRunning);
      setElapsed(p.isRunning && p.lastStartTime ? (p.timeLog || 0) + Date.now() - p.lastStartTime : p.timeLog || 0);
    });
    emit("request-timer-state");
    return () => {
      un.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const on = () => setFocused(true);
    const off = () => setFocused(false);
    window.addEventListener("focus", on);
    window.addEventListener("blur", off);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("blur", off);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1000), 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => taskId && emit("timer-toggle", { taskId });

  const openMain = async () => {
    const main = await Window.getByLabel("main");
    await main?.unminimize();
    await main?.setFocus();
    await getCurrentWindow().hide();
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative flex h-screen w-screen flex-col overflow-hidden rounded-lg border border-line-2 bg-ground text-cream transition-opacity duration-300 ${
        hover || focused ? "opacity-100" : "opacity-40"
      }`}
    >
      <div className="absolute inset-0" data-tauri-drag-region />
      <div className="pointer-events-none relative flex h-7 shrink-0 items-center gap-2 border-b border-line bg-slab px-3">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${running ? "live-dot bg-accent" : "bg-faint"}`} />
        <span className={`font-cond text-[11px] font-bold uppercase tracking-[0.16em] ${running ? "text-accent-ink" : "text-faint"}`}>
          {running ? "Contando" : "Pausado"}
        </span>
        <span className="min-w-0 truncate text-xs text-muted">{label}</span>
      </div>
      <div className="pointer-events-none relative flex grow items-center justify-between gap-2 pl-4 pr-2">
        <span className={`tnum font-cond text-[40px] font-bold leading-none ${running ? "text-cream" : "text-muted"}`}>{fmtClock(elapsed)}</span>
        <div className="pointer-events-auto flex gap-1.5">
          <button
            onClick={toggle}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              running ? "bg-slab-3 text-cream hover:bg-line-2" : "bg-accent text-on-accent hover:brightness-110"
            }`}
            title={running ? "Pausar" : "Retomar"}
            aria-label={running ? "Pausar" : "Retomar"}
          >
            <Icon name={running ? "pause" : "play"} size={16} />
          </button>
          <button
            onClick={openMain}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-slab-2 text-muted transition-colors hover:bg-slab-3 hover:text-cream"
            title="Voltar ao quadro"
            aria-label="Voltar ao quadro"
          >
            <Icon name="expand" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
