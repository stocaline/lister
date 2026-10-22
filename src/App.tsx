import { useCallback, useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { Window, getCurrentWindow } from "@tauri-apps/api/window";
import type { Board as BoardT, Task } from "./types";
import { isNotes, toggleTimer } from "./types";
import { loadBoards, migrateFromLocalStorage, reloadBoards, saveBoards } from "./store";
import Sidebar from "./components/Sidebar";
import Board from "./components/Board";
import Scoreboard from "./components/Scoreboard";
import CommandPalette from "./components/CommandPalette";
import NotesView from "./components/NotesView";
import SettingsView from "./components/SettingsView";
import { applySettings, saveSettings, type Settings } from "./settings";

const DEFAULT_BOARD: BoardT = {
  id: "board-1",
  title: "Meu Novo Board",
  tasks: {},
  columns: { "col-1": { id: "col-1", title: "To Do", description: "", taskIds: [] } },
  columnOrder: ["col-1"],
  tags: {},
  createdAt: 0,
  icon: "tabler:layout-dashboard",
};

const newBoard = (title?: string): BoardT => ({
  ...DEFAULT_BOARD,
  id: `board-${Date.now()}`,
  title: title || DEFAULT_BOARD.title,
  createdAt: Date.now(),
});

export interface Located {
  task: Task;
  board: BoardT;
  columnTitle: string;
}

function locate(boards: BoardT[], pred: (t: Task) => boolean): Located | null {
  for (const board of boards)
    for (const task of Object.values(board.tasks))
      if (pred(task)) {
        const col = Object.values(board.columns).find((c) => c.taskIds.includes(task.id));
        return { task, board, columnTitle: col?.title || "" };
      }
  return null;
}

function syncPayload(task: Task | null) {
  if (!task) return { isRunning: false };
  return {
    taskId: task.id,
    isRunning: !!task.isRunning,
    timeLog: task.timeLog,
    lastStartTime: task.isRunning ? task.lastStartTime : null,
    content: task.content,
  };
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export default function App({ initialSettings }: { initialSettings: Settings }) {
  const [boards, setBoards] = useState<BoardT[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [settings, setSettings] = useState(initialSettings);
  const [view, setView] = useState<"board" | "settings">("board");
  const settingsSave = useRef<number | undefined>(undefined);
  const boardsRef = useRef(boards);
  const lastTimerTask = useRef<string | null>(null);
  boardsRef.current = boards;

  useEffect(() => {
    (async () => {
      try {
        await migrateFromLocalStorage();
        const loaded = await loadBoards();
        if (loaded.length > 0) {
          setBoards(loaded);
          setActiveId(loaded[0].id);
        } else {
          const b = newBoard();
          setBoards([b]);
          setActiveId(b.id);
          await saveBoards([b]);
        }
      } catch (e) {
        console.error("Failed to load boards:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const live = locate(boards, (t) => !!t.isRunning);
  if (live) lastTimerTask.current = live.task.id;
  const shown = live || (lastTimerTask.current ? locate(boards, (t) => t.id === lastTimerTask.current) : null);

  // Clocks only need a heartbeat while something is running.
  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [!!live]);

  // Persist and keep the floating timer in sync with the running (or last) task.
  useEffect(() => {
    if (loading || boards.length === 0) return;
    saveBoards(boards).catch(console.error);
    emit("timer-state-sync", syncPayload(shown?.task || null));
  }, [boards, loading]);

  const toggleTaskTimer = useCallback(async (taskId: string) => {
    const current = locate(boardsRef.current, (t) => t.id === taskId)?.task;
    if (!current) return;
    if (!current.isRunning) {
      // Starting a clock pops the floating timer and gets the board out of the way.
      try {
        const timer = await Window.getByLabel("timer");
        await timer?.show();
        await timer?.setFocus();
        await (await Window.getByLabel("main"))?.minimize();
      } catch (e) {
        console.error("Failed to manage windows:", e);
      }
    }
    setBoards((bs) =>
      bs.map((b) => {
        const updated = { ...b.tasks };
        let touched = false;
        for (const t of Object.values(b.tasks)) {
          // One clock at a time: starting a task pauses whichever one was running.
          if (t.id === taskId || (!current.isRunning && t.isRunning)) {
            updated[t.id] = toggleTimer(t);
            touched = true;
          }
        }
        return touched ? { ...b, tasks: updated } : b;
      }),
    );
  }, []);

  useEffect(() => {
    const unlisteners = [
      listen<{ taskId: string }>("timer-toggle", ({ payload }) => {
        setBoards((bs) =>
          bs.map((b) => {
            const t = b.tasks[payload.taskId];
            return t ? { ...b, tasks: { ...b.tasks, [t.id]: toggleTimer(t) } } : b;
          }),
        );
      }),
      listen("request-timer-state", () => {
        const bs = boardsRef.current;
        const running = locate(bs, (t) => !!t.isRunning);
        const last = running || (lastTimerTask.current ? locate(bs, (t) => t.id === lastTimerTask.current) : null);
        emit("timer-state-sync", syncPayload(last?.task || null));
      }),
      // Pick up edits written to the data file while the window was in the background.
      getCurrentWindow().onFocusChanged(async ({ payload: focused }) => {
        if (!focused) return;
        try {
          const disk = await reloadBoards();
          if (disk.length && JSON.stringify(disk) !== JSON.stringify(boardsRef.current)) {
            setBoards(disk);
            setActiveId((id) => (disk.some((b) => b.id === id) ? id : disk[0].id));
          }
        } catch (e) {
          console.error("Failed to reload boards:", e);
        }
      }),
      listen("maximize-main", async () => {
        const w = getCurrentWindow();
        await w.unminimize();
        await w.setFocus();
      }),
    ];
    return () => unlisteners.forEach((p) => p.then((un) => un()));
  }, []);

  // Global shortcuts. N lives in Board (it needs the column); Esc in each overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.code === "Space" && !isTyping(e.target) && !e.repeat) {
        const focused = (e.target as HTMLElement | null)?.closest?.("[data-task-id]")?.getAttribute("data-task-id");
        const target = focused || lastTimerTask.current;
        if (!target) return;
        e.preventDefault();
        toggleTaskTimer(target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTaskTimer]);

  const active = boards.find((b) => b.id === activeId);

  if (loading || !active) {
    return (
      <div className="h-screen flex items-center justify-center bg-ground font-cond text-sm uppercase tracking-[0.2em] text-faint">
        Carregando quadros…
      </div>
    );
  }

  const updateBoard = (b: BoardT) => setBoards((bs) => bs.map((x) => (x.id === b.id ? b : x)));

  const createBoard = (title: string, kind: "board" | "notes") => {
    const fallback = kind === "notes" ? `Notas ${boards.length + 1}` : `Novo Quadro ${boards.length + 1}`;
    const b: BoardT =
      kind === "notes"
        ? { ...newBoard(title.trim() || fallback), kind: "notes", notes: "", columns: {}, columnOrder: [] }
        : newBoard(title.trim() || fallback);
    setBoards((bs) => [...bs, b]);
    setActiveId(b.id);
    setView("board");
  };

  const deleteBoard = (id: string) => {
    const rest = boards.filter((b) => b.id !== id);
    if (rest.length === 0) {
      const b = newBoard();
      setBoards([b]);
      setActiveId(b.id);
      return;
    }
    setBoards(rest);
    if (activeId === id) setActiveId(rest[0].id);
  };

  const importBoard = (b: BoardT) => {
    setBoards((bs) => bs.map((x) => (x.id === activeId ? b : x)));
    setActiveId(b.id);
  };

  const changeSettings = (s: Settings) => {
    setSettings(s);
    applySettings(s);
    // The colour picker fires on every drag step; persist once it settles.
    window.clearTimeout(settingsSave.current);
    settingsSave.current = window.setTimeout(() => saveSettings(s).catch(console.error), 300);
  };

  const goToTask = (boardId: string, taskId: string | null) => {
    setView("board");
    setActiveId(boardId);
    setOpenTaskId(taskId);
    setPaletteOpen(false);
  };

  const scoreboardEl = (
          <Scoreboard
            shown={shown}
            now={now}
            onToggle={() => shown && toggleTaskTimer(shown.task.id)}
            onOpen={() => shown && goToTask(shown.board.id, shown.task.id)}
          />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ground text-cream">
      <Sidebar
        boards={[...boards].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))}
        activeBoardId={active.id}
        liveBoardId={live?.board.id}
        now={now}
        onSelectBoard={(id) => goToTask(id, null)}
        onCreateBoard={createBoard}
        onDeleteBoard={deleteBoard}
        onOpenPalette={() => setPaletteOpen(true)}
        settingsOpen={view === "settings"}
        onOpenSettings={() => setView("settings")}
      />
      {view === "settings" ? (
        <SettingsView settings={settings} onChange={changeSettings} />
      ) : isNotes(active) ? (
        <NotesView key={active.id} board={active} onBoardUpdate={updateBoard} scoreboard={scoreboardEl} />
      ) : (
        <Board
          key={active.id}
          board={active}
          now={now}
          openTaskId={openTaskId}
          onOpenTask={setOpenTaskId}
          onBoardUpdate={updateBoard}
          onImportBoard={importBoard}
          onToggleTimer={toggleTaskTimer}
          scoreboard={scoreboardEl}
        />
      )}
      {paletteOpen && <CommandPalette boards={boards} now={now} onClose={() => setPaletteOpen(false)} onPick={goToTask} />}
    </div>
  );
}
