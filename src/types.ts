export type Priority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  content: string;
  done: boolean;
}

export interface Tag {
  id: string;
  title: string;
  color: string;
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number | null;
  priority?: Priority;
  description?: string;
  tags?: string[];
  subtasks?: Subtask[];
  timeLog?: number;
  isRunning?: boolean;
  lastStartTime?: number;
}

export interface Column {
  id: string;
  title: string;
  description?: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
  tags: Record<string, Tag>;
  createdAt: number;
  icon?: string;
  /** Absent on boards saved before notepads existed: those are kanban boards. */
  kind?: "board" | "notes";
  /** Markdown body of a notepad. */
  notes?: string;
}

export const isNotes = (b: Board) => b.kind === "notes";

export const TAG_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
  "bg-pink-500", "bg-rose-500",
];

export const PRIORITY_LABEL: Record<Priority, string> = { low: "Baixa", medium: "Média", high: "Alta" };

export const PRIORITY_TEXT: Record<Priority, string> = { low: "text-sage", medium: "text-amber", high: "text-stamp" };

/** Logged time including the live, not-yet-folded stretch of a running timer. */
export const elapsed = (t: Task, now: number) =>
  (t.timeLog || 0) + (t.isRunning && t.lastStartTime ? now - t.lastStartTime : 0);

export const sumElapsed = (tasks: Task[], now: number) => tasks.reduce((s, t) => s + elapsed(t, now), 0);

/** "2h 13m", "57m 33s", "12s"; empty for zero. */
export function fmtShort(ms: number) {
  if (ms < 1000) return "";
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

/** Scoreboard clock: "2:13:47" or "13:47". */
export function fmtClock(ms: number) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Reads a typed duration back into ms: "2:13:47", "13:47", "2h 13m", "2h13", "90m", "45s", "1,5h".
 * A bare number is minutes. Returns null when it can't be read.
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(",", ".");
  if (!s) return null;
  const clock = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const [, a, b, c] = clock;
    const [h, m, sec] = c === undefined ? [0, +a, +b] : [+a, +b, +c];
    if (m > 59 && c !== undefined) return null;
    if (sec > 59 || (c === undefined && +b > 59)) return null;
    return ((h * 60 + m) * 60 + sec) * 1000;
  }
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 60000);
  const units = s.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$|^(\d+)\s*h\s*(\d{1,2})$/);
  if (!units || units[0] === "") return null;
  const [, h, m, sec, h2, m2] = units;
  if (h2 !== undefined) return (+h2 * 60 + +m2) * 60000;
  return Math.round(((parseFloat(h || "0") * 60 + parseFloat(m || "0")) * 60 + +(sec || 0)) * 1000);
}

/** Overwrites a task's logged time; a running clock keeps counting from the new value. */
export const setLoggedTime = (t: Task, ms: number): Task => ({
  ...t,
  timeLog: ms,
  lastStartTime: t.isRunning ? Date.now() : t.lastStartTime,
});

if (import.meta.env.DEV) {
  const cases: [string, number | null][] = [
    ["2:13:47", 8027000], ["13:47", 827000], ["2h 13m", 7980000], ["2h13", 7980000], ["90m", 5400000],
    ["45s", 45000], ["1,5h", 5400000], ["30", 1800000], ["0", 0], ["abc", null], ["", null], ["1:75", null],
  ];
  for (const [i, want] of cases) console.assert(parseDuration(i) === want, `parseDuration(${i}) = ${parseDuration(i)}, want ${want}`);
}

/** Pauses or starts a task's timer, folding elapsed time into timeLog. */
export function toggleTimer(task: Task): Task {
  let timeLog = task.timeLog || 0;
  let lastStartTime = task.lastStartTime;
  if (task.isRunning) {
    if (lastStartTime) timeLog += Date.now() - lastStartTime;
    lastStartTime = undefined;
  } else {
    lastStartTime = Date.now();
  }
  return { ...task, isRunning: !task.isRunning, timeLog, lastStartTime };
}
