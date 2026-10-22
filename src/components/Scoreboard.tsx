import type { Located } from "../App";
import { elapsed, fmtClock } from "../types";
import Icon from "./Icon";

interface Props {
  shown: Located | null;
  now: number;
  onToggle: () => void;
  onOpen: () => void;
}

/** The broadcast "placar": the running (or last) task pinned under the board header. */
export default function Scoreboard({ shown, now, onToggle, onOpen }: Props) {
  if (!shown) {
    // Idle placar: same slab, nothing on the clock yet.
    return (
      <div className="flex h-14 w-max max-w-full items-stretch overflow-hidden rounded-md border border-line bg-slab">
        <div className="flex items-center bg-slab-3 px-4 font-cond text-lg font-bold uppercase tracking-[0.08em] text-faint">Sem cronômetro</div>
        <div className="flex items-center gap-2 px-5 text-sm text-muted">
          Foque uma tarefa e aperte
          <kbd className="rounded border border-line-2 px-1.5 font-cond text-xs font-semibold text-cream">Espaço</kbd>
        </div>
        <div className="tnum flex items-center border-l border-line bg-ground/60 px-5 font-cond text-[34px] font-bold leading-none text-faint">0:00:00</div>
      </div>
    );
  }

  const { task, board, columnTitle } = shown;
  const running = !!task.isRunning;

  return (
    <div
      key={`${task.id}-${running}`}
      className={`flex h-14 w-max max-w-full items-stretch overflow-hidden rounded-md border bg-slab ${
        running ? "wipe-in border-accent/50" : "border-line"
      }`}
    >
      <div
        className={`flex min-w-0 max-w-40 items-center px-4 font-cond text-lg font-bold uppercase tracking-[0.08em] ${
          running ? "bg-accent text-on-accent" : "bg-slab-3 text-muted"
        }`}
        title={`${board.title} · ${columnTitle}`}
      >
        <span className="truncate">{columnTitle || board.title}</span>
      </div>
      <button
        onClick={onOpen}
        className="flex min-w-0 max-w-[28rem] items-center px-5 text-left font-medium text-cream hover:bg-slab-2"
        title="Abrir tarefa"
      >
        <span className="truncate">{task.content}</span>
      </button>
      <div
        className={`tnum flex items-center border-l border-line bg-ground/60 px-5 font-cond text-[34px] font-bold leading-none ${
          running ? "text-cream" : "text-muted"
        }`}
        aria-live="off"
      >
        {fmtClock(elapsed(task, now))}
      </div>
      <div
        className={`flex items-center gap-2 px-4 font-cond text-sm font-bold uppercase tracking-[0.16em] ${
          running ? "text-accent-ink" : "text-faint"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${running ? "live-dot bg-accent" : "bg-faint"}`} />
        {running ? "Contando" : "Pausado"}
      </div>
      <button
        onClick={onToggle}
        className={`flex w-14 items-center justify-center border-l border-line transition-colors ${
          running ? "text-cream hover:bg-slab-2" : "bg-accent-deep text-accent-ink hover:bg-accent hover:text-on-accent"
        }`}
        title={running ? "Pausar (Espaço)" : "Retomar (Espaço)"}
        aria-label={running ? "Pausar cronômetro" : "Retomar cronômetro"}
      >
        <Icon name={running ? "pause" : "play"} size={20} />
      </button>
    </div>
  );
}
