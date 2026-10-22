import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Board, Tag, Task } from "../types";
import { PRIORITY_LABEL, PRIORITY_TEXT, elapsed, fmtShort } from "../types";
import Icon from "./Icon";

interface Props {
  task: Task;
  tags: Record<string, Tag>;
  now: number;
  setBoard: (fn: (b: Board) => Board) => void;
  onOpen: () => void;
  onToggleTimer: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, tags, now, setBoard, onOpen, onToggleTimer, onDelete }: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const toggleCompleted = () =>
    setBoard((b) => {
      const t = b.tasks[task.id];
      const completed = !t.completed;
      const timeLog = elapsed(t, Date.now());
      return {
        ...b,
        tasks: { ...b.tasks, [t.id]: { ...t, completed, completedAt: completed ? Date.now() : null, isRunning: false, timeLog, lastStartTime: undefined } },
      };
    });

  const running = !!task.isRunning;
  const time = elapsed(task, now);
  const subtasks = task.subtasks || [];
  const done = subtasks.filter((s) => s.done).length;
  const cardTags = (task.tags || []).map((id) => tags[id]).filter(Boolean);

  return (
    <>
      <article
        ref={setNodeRef}
        data-task-id={task.id}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        {...listeners}
        tabIndex={0}
        aria-label={task.content}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen();
          if (e.key === "Delete") onDelete();
        }}
        className={`group relative cursor-pointer rounded-md border px-3 py-2.5 outline-none transition-[border-color,background-color] focus-visible:border-accent ${
          isDragging ? "z-10 opacity-50" : ""
        } ${
          running
            ? "border-accent bg-accent-deep/50"
            : task.completed
              ? "border-transparent bg-slab/50"
              : "border-line bg-slab hover:border-line-2 hover:bg-slab-2"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={toggleCompleted}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Concluir tarefa"
            className="check mt-[3px]"
          />
          <div className="min-w-0 grow pr-6">
            {cardTags.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {cardTags.map((t) => (
                  <span key={t.id} className={`h-1 w-7 rounded-full ${t.color}`} title={t.title} />
                ))}
              </div>
            )}
            <p
              className={`whitespace-pre-wrap break-words text-[14px] font-medium leading-snug ${
                task.completed ? "text-faint line-through decoration-faint/60" : "text-cream"
              }`}
            >
              {task.content}
            </p>
            {task.description && !task.completed && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{task.description}</p>}

            <div className="mt-2 flex items-center gap-2.5 font-cond text-[13px] font-semibold uppercase tracking-[0.05em]">
              {task.priority && task.priority !== "medium" && !task.completed && <span className={PRIORITY_TEXT[task.priority]}>{PRIORITY_LABEL[task.priority]}</span>}
              {subtasks.length > 0 && (
                <span className={done === subtasks.length ? "text-sage" : "text-muted"}>
                  {done}/{subtasks.length}
                </span>
              )}
              {task.createdAt > 0 && (
                <span className="text-faint">{new Date(task.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}</span>
              )}
              {(time >= 1000 || running) && (
                <span className={`tnum ml-auto flex items-center gap-1.5 normal-case ${running ? "text-accent-ink" : "text-muted"}`}>
                  {running && <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />}
                  {fmtShort(time) || "0s"}
                </span>
              )}
            </div>
          </div>
        </div>

        {!task.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTimer();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md transition-opacity ${
              running
                ? "bg-accent text-on-accent opacity-100"
                : "bg-slab-3 text-accent-ink opacity-0 hover:bg-accent hover:text-on-accent focus:opacity-100 group-hover:opacity-100"
            }`}
            title={running ? "Pausar cronômetro (Espaço)" : "Iniciar cronômetro (Espaço)"}
            aria-label={running ? "Pausar cronômetro" : "Iniciar cronômetro"}
          >
            <Icon name={running ? "pause" : "play"} size={14} />
          </button>
        )}
      </article>

      {menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: Math.min(menu.y, window.innerHeight - 140), left: Math.min(menu.x, window.innerWidth - 220) }}
            className="pop-in fixed z-50 w-52 rounded-md border border-line-2 bg-slab-2 py-1 text-sm shadow-[0_16px_32px_-8px_rgb(0_0_0/0.6)]"
          >
            {!task.completed && (
              <button
                role="menuitem"
                onClick={() => (onToggleTimer(), setMenu(null))}
                className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slab-3"
              >
                <Icon name={running ? "pause" : "play"} size={15} className="text-accent-ink" />
                {running ? "Pausar cronômetro" : "Iniciar cronômetro"}
              </button>
            )}
            <button role="menuitem" onClick={() => (onOpen(), setMenu(null))} className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slab-3">
              <Icon name="open" size={15} className="text-muted" />
              Abrir detalhes
            </button>
            <div className="my-1 border-t border-line" />
            <button role="menuitem" onClick={() => (onDelete(), setMenu(null))} className="flex w-full items-center gap-2.5 px-3 py-2 text-stamp hover:bg-slab-3">
              <Icon name="trash" size={15} />
              Excluir tarefa
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
