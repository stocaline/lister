import { useEffect, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Board, Column as ColumnT, Tag, Task } from "../types";
import { fmtShort, sumElapsed } from "../types";
import TaskCard from "./TaskCard";
import Icon from "./Icon";

interface Props {
  column: ColumnT;
  tasks: Task[];
  visible?: (t: Task) => boolean | undefined;
  tags: Record<string, Tag>;
  now: number;
  composing: boolean;
  onCompose: (on: boolean) => void;
  setBoard: (fn: (b: Board) => Board) => void;
  onDeleteColumn: (id: string) => void;
  onOpenTask: (t: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function Column({ column, tasks, visible, tags, now, composing, onCompose, setBoard, onDeleteColumn, onOpenTask, onToggleTimer, onDeleteTask }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(column.description || "");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setTitle(column.title);
    setDesc(column.description || "");
  }, [column.title, column.description]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const patchColumn = (patch: Partial<ColumnT>) =>
    setBoard((b) => ({ ...b, columns: { ...b.columns, [column.id]: { ...b.columns[column.id], ...patch } } }));

  const commitTitle = () => {
    setEditingTitle(false);
    if (title.trim()) patchColumn({ title: title.trim() });
    else setTitle(column.title);
  };

  const addTask = (keepOpen: boolean) => {
    if (!draft.trim()) {
      if (!keepOpen) onCompose(false);
      return;
    }
    const id = `task-${Date.now()}-${Math.random()}`;
    const task: Task = { id, content: draft.trim(), completed: false, createdAt: Date.now(), priority: "medium" };
    setBoard((b) => ({
      ...b,
      tasks: { ...b.tasks, [id]: task },
      columns: { ...b.columns, [column.id]: { ...b.columns[column.id], taskIds: [...b.columns[column.id].taskIds, id] } },
    }));
    setDraft("");
    if (!keepOpen) onCompose(false);
  };

  const shown = visible ? tasks.filter(visible) : tasks;
  const total = sumElapsed(tasks, now);
  const live = tasks.some((t) => t.isRunning);

  return (
    <section
      ref={setNodeRef}
      style={{ transition, transform: CSS.Transform.toString(transform) }}
      className={`flex max-h-full w-[304px] shrink-0 flex-col overflow-hidden rounded-lg bg-slab/45 ${isDragging ? "opacity-60" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        onDoubleClick={() => setEditingTitle(true)}
        className={`group flex h-12 shrink-0 cursor-grab items-center gap-2 border-b-2 bg-slab pl-3 pr-1.5 active:cursor-grabbing ${
          live ? "border-accent" : "border-line-2"
        }`}
      >
        {editingTitle ? (
          <input
            type="text"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitle(column.title);
                setEditingTitle(false);
              }
            }}
            className="min-w-0 grow bg-transparent font-cond text-lg font-bold uppercase tracking-[0.05em] outline-none"
          />
        ) : (
          <h2 className="min-w-0 grow truncate font-cond text-lg font-bold uppercase tracking-[0.05em]" title="Duplo clique para renomear">
            {column.title}
          </h2>
        )}
        {/* Score pair: count | logged time. */}
        <div className="tnum flex shrink-0 font-cond text-[15px] font-bold">
          <span className="rounded-l bg-ground px-2 py-0.5">{visible ? `${shown.length}/${tasks.length}` : tasks.length}</span>
          <span className={`rounded-r bg-ground/60 px-2 py-0.5 ${live ? "text-accent-ink" : "text-muted"}`}>{fmtShort(total) || "0m"}</span>
        </div>
        <button
          onClick={() => onDeleteColumn(column.id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded p-1 text-faint opacity-0 transition-opacity hover:bg-slab-2 hover:text-stamp focus:opacity-100 group-hover:opacity-100"
          aria-label={`Excluir coluna ${column.title}`}
          title="Excluir coluna"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="px-3 pt-2" onDoubleClick={() => setEditingDesc(true)}>
        {editingDesc ? (
          <textarea
            value={desc}
            autoFocus
            rows={2}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => {
              setEditingDesc(false);
              patchColumn({ description: desc });
            }}
            onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
            className="w-full resize-none rounded-md border border-line-2 bg-ground p-2 text-sm text-cream outline-none focus:border-accent"
          />
        ) : desc ? (
          <p className="line-clamp-2 cursor-text text-[13px] leading-snug text-muted">{desc}</p>
        ) : (
          <p className="cursor-text text-xs text-faint/80 opacity-0 transition-opacity hover:opacity-100">Duplo clique para descrever a coluna</p>
        )}
      </div>

      <div className="min-h-0 grow overflow-y-auto px-2 pb-1 pt-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex min-h-2 flex-col gap-2">
            {shown.map((t) => (
              <TaskCard key={t.id} task={t} tags={tags} now={now} setBoard={setBoard} onOpen={() => onOpenTask(t)} onToggleTimer={() => onToggleTimer(t.id)} onDelete={() => onDeleteTask(t.id)} />
            ))}
            {visible && tasks.length > 0 && shown.length === 0 && (
              <p className="px-2 py-3 text-center text-[13px] text-faint">Nada aqui com esse filtro.</p>
            )}
          </div>
        </SortableContext>
      </div>

      <div className="p-2 pt-1">
        {composing ? (
          <div className="pop-in rounded-md border border-accent/60 bg-slab p-2">
            <textarea
              value={draft}
              autoFocus
              rows={2}
              placeholder="O que precisa ser feito?"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => addTask(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addTask(true);
                } else if (e.key === "Escape") {
                  setDraft("");
                  onCompose(false);
                }
              }}
              className="w-full resize-none bg-transparent p-1 text-sm leading-snug placeholder-faint outline-none"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="font-cond text-xs text-faint">Enter adiciona · Esc fecha</span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTask(true)}
                className="rounded bg-accent px-3 py-1 text-xs font-semibold text-on-accent hover:brightness-110"
              >
                Adicionar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onCompose(true)}
            className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted transition-colors hover:bg-slab hover:text-cream"
          >
            <Icon name="plus" size={16} />
            Adicionar tarefa
            <kbd className="ml-auto rounded border border-line-2 px-1.5 font-cond text-[11px] font-semibold text-faint opacity-0 group-hover:opacity-100">N</kbd>
          </button>
        )}
      </div>
    </section>
  );
}
