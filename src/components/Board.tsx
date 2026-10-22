import { useEffect, useRef, useState, type ReactNode } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragOverEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { Board as BoardT, Column as ColumnT, Priority, Tag, Task } from "../types";
import { PRIORITY_LABEL, elapsed, fmtShort, sumElapsed } from "../types";
import Column from "./Column";
import TaskDrawer from "./TaskDrawer";
import TagsModal from "./TagsModal";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import FilterMenu from "./FilterMenu";

interface Props {
  board: BoardT;
  now: number;
  openTaskId: string | null;
  scoreboard: ReactNode;
  onOpenTask: (id: string | null) => void;
  onBoardUpdate: (b: BoardT) => void;
  onImportBoard: (b: BoardT) => void;
  onToggleTimer: (taskId: string) => void;
}

const PRIORITY_DOT: Record<Priority, string> = { high: "bg-stamp", medium: "bg-amber", low: "bg-sage" };

export default function Board({ board, now, openTaskId, scoreboard, onOpenTask, onBoardUpdate, onImportBoard, onToggleTimer }: Props) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [composing, setComposing] = useState<string | null>(null);
  const [pendingColumn, setPendingColumn] = useState<ColumnT | null>(null);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [tagFilter, setTagFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => setTitle(board.title), [board.title]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest("[data-board-menu]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  // N = new task in the first column; "/" = filter this board.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === "n" && board.columnOrder[0]) {
        e.preventDefault();
        setComposing(board.columnOrder[0]);
      } else if (e.key === "/") {
        e.preventDefault();
        filterRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board.columnOrder]);

  const columnOf = (taskId: string) => Object.values(board.columns).find((c) => c.taskIds.includes(taskId));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || active.data.current?.type !== "Column") return;
    const from = board.columnOrder.indexOf(String(active.id));
    const to = board.columnOrder.indexOf(String(over.id));
    if (to === -1) return;
    onBoardUpdate({ ...board, columnOrder: arrayMove(board.columnOrder, from, to) });
  };

  // Tasks move between/within columns live while dragging.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id || active.data.current?.type !== "Task") return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const src = columnOf(activeId);
    const dst = board.columns[overId] || columnOf(overId);
    if (!src || !dst) return;

    if (src.id === dst.id) {
      const from = src.taskIds.indexOf(activeId);
      const to = dst.taskIds.indexOf(overId);
      if (from === -1 || to === -1) return;
      onBoardUpdate({ ...board, columns: { ...board.columns, [src.id]: { ...src, taskIds: arrayMove(src.taskIds, from, to) } } });
      return;
    }

    const ids = [...dst.taskIds];
    const at = over.data.current?.type === "Task" ? ids.indexOf(overId) : -1;
    if (at === -1) ids.push(activeId);
    else ids.splice(at, 0, activeId);
    onBoardUpdate({
      ...board,
      columns: {
        ...board.columns,
        [src.id]: { ...src, taskIds: src.taskIds.filter((id) => id !== activeId) },
        [dst.id]: { ...dst, taskIds: ids },
      },
    });
  };

  const exportBoard = () => {
    const a = document.createElement("a");
    a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(board, null, 2))}`;
    a.download = `${board.title || "board"}.json`;
    a.click();
    setMenuOpen(false);
  };

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setMenuOpen(false);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.id && data.title && data.columns) onImportBoard(data);
        else alert("Arquivo inválido: a estrutura do quadro não confere.");
      } catch (err) {
        console.error("Erro ao importar:", err);
        alert("Não foi possível ler o arquivo. Confira se é um JSON exportado pelo Lister.");
      }
    };
    reader.readAsText(file);
  };

  const deleteColumn = (colId: string) => {
    const col = board.columns[colId];
    if (!col) return;
    const tasks = Object.fromEntries(Object.entries(board.tasks).filter(([id]) => !col.taskIds.includes(id)));
    const { [colId]: _, ...columns } = board.columns;
    onBoardUpdate({ ...board, tasks, columns, columnOrder: board.columnOrder.filter((id) => id !== colId) });
  };

  const requestDeleteColumn = (colId: string) => {
    const col = board.columns[colId];
    if (col?.taskIds.length) setPendingColumn(col);
    else deleteColumn(colId);
  };

  const deleteTask = (taskId: string) => {
    const col = columnOf(taskId);
    if (!col) return;
    const { [taskId]: _, ...tasks } = board.tasks;
    onBoardUpdate({ ...board, tasks, columns: { ...board.columns, [col.id]: { ...col, taskIds: col.taskIds.filter((id) => id !== taskId) } } });
    onOpenTask(null);
  };

  // Logged time is billable: never drop it without asking.
  const requestDeleteTask = (taskId: string) => {
    const t = board.tasks[taskId];
    if (t && elapsed(t, Date.now()) >= 1000) setPendingTask(t);
    else deleteTask(taskId);
  };

  const upsertTag = (tag: Tag) => onBoardUpdate({ ...board, tags: { ...board.tags, [tag.id]: tag } });

  const deleteTag = (tagId: string) => {
    const { [tagId]: _, ...tags } = board.tags;
    const tasks = Object.fromEntries(
      Object.entries(board.tasks).map(([id, t]) => [id, { ...t, tags: t.tags?.filter((x) => x !== tagId) || [] }]),
    );
    onBoardUpdate({ ...board, tags, tasks });
    if (tagFilter === tagId) setTagFilter("");
  };

  const commitTitle = () => {
    setEditingTitle(false);
    if (title.trim() && title.trim() !== board.title) onBoardUpdate({ ...board, title: title.trim() });
    else setTitle(board.title);
  };

  const addColumn = () => {
    const id = `col-${Date.now()}`;
    const col: ColumnT = { id, title: "Nova coluna", taskIds: [] };
    onBoardUpdate({ ...board, columns: { ...board.columns, [id]: col }, columnOrder: [...board.columnOrder, id] });
  };

  const q = query.trim().toLowerCase();
  const filtering = !!(q || priority || tagFilter);
  const matches = (t: Task) =>
    (!q || t.content.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) &&
    (!priority || t.priority === priority) &&
    (!tagFilter || t.tags?.includes(tagFilter));

  const allTasks = Object.values(board.tasks);
  const boardTotal = sumElapsed(allTasks, now);
  const openTask = openTaskId ? board.tasks[openTaskId] : null;
  const shownCount = filtering ? allTasks.filter(matches).length : allTasks.length;

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd} onDragOver={onDragOver}>
      <div className="flex h-screen min-w-0 grow flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-6 xl:gap-4">
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
                  setTitle(board.title);
                  setEditingTitle(false);
                }
              }}
              className="min-w-0 border-b-2 border-accent bg-transparent font-cond text-[28px] font-bold uppercase tracking-[0.03em] outline-none"
            />
          ) : (
            <h1
              onDoubleClick={() => setEditingTitle(true)}
              title="Duplo clique para renomear"
              className="min-w-24 cursor-text truncate font-cond text-[28px] font-bold uppercase leading-none tracking-[0.03em]"
            >
              {board.title}
            </h1>
          )}
          <div className="tnum flex shrink-0 font-cond text-[15px] font-bold" title="Tarefas · tempo registrado no quadro">
            <span className="rounded-l bg-slab-2 px-2.5 py-1">
              {allTasks.length} {allTasks.length === 1 ? "tarefa" : "tarefas"}
            </span>
            <span className="rounded-r bg-slab px-2.5 py-1 text-muted">{fmtShort(boardTotal) || "0m"}</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <label className="relative flex items-center">
              <Icon name="search" size={15} className="pointer-events-none absolute left-3 text-faint" />
              <input
                ref={filterRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
                placeholder="Filtrar"
                className="h-9 w-40 rounded-md border border-line-2 bg-slab pl-9 pr-8 xl:w-56 text-sm placeholder-faint outline-none hover:border-faint focus:border-accent"
              />
              <kbd className="pointer-events-none absolute right-2 rounded border border-line-2 px-1.5 font-cond text-[11px] font-semibold text-faint">/</kbd>
            </label>
            <FilterMenu
              label="Prioridade"
              value={priority}
              onChange={(v) => setPriority(v as Priority | "")}
              options={(["high", "medium", "low"] as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p], swatch: PRIORITY_DOT[p] }))}
            />
            <FilterMenu
              label="Tag"
              value={tagFilter}
              onChange={setTagFilter}
              empty="Nenhuma tag neste quadro."
              options={Object.values(board.tags || {}).map((t) => ({ value: t.id, label: t.title, swatch: t.color }))}
            />
            <button
              onClick={() => setTagsOpen(true)}
              className="flex h-9 items-center gap-2 rounded-md border border-line-2 px-2.5 text-sm font-medium text-muted hover:border-faint hover:text-cream xl:px-3"
              title="Tags do quadro"
              aria-label="Tags do quadro"
            >
              <Icon name="tag" size={15} />
              <span className="hidden xl:inline">Tags</span>
            </button>
            <div className="relative" data-board-menu>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line-2 text-muted hover:border-faint hover:text-cream"
                aria-label="Mais opções"
              >
                <Icon name="dots" size={16} />
              </button>
              {menuOpen && (
                <div className="pop-in absolute right-0 top-11 z-30 w-52 rounded-md border border-line-2 bg-slab-2 py-1 shadow-[0_16px_32px_-8px_rgb(0_0_0/0.6)]">
                  <button onClick={exportBoard} className="w-full px-4 py-2 text-left text-sm hover:bg-slab-3">
                    Exportar quadro (JSON)
                  </button>
                  <label className="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-slab-3">
                    Importar sobre este quadro…
                    <input type="file" accept=".json" onChange={importFile} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="shrink-0 px-6 pt-4">{scoreboard}</div>

        {filtering && (
          <div className="flex shrink-0 items-center gap-3 px-6 pt-3 text-sm text-muted">
            <Icon name="filter" size={14} />
            Mostrando {shownCount} de {allTasks.length} tarefas
            <button
              onClick={() => (setQuery(""), setPriority(""), setTagFilter(""))}
              className="font-medium text-accent-ink hover:underline underline-offset-4"
            >
              Limpar filtros
            </button>
          </div>
        )}

        <div className="min-h-0 grow overflow-x-auto overflow-y-hidden">
          <div className="flex h-full items-start gap-4 px-6 pb-4 pt-4">
            <SortableContext items={board.columnOrder} strategy={horizontalListSortingStrategy}>
              {board.columnOrder.map((colId) => {
                const col = board.columns[colId];
                if (!col) return null;
                const tasks = col.taskIds.map((id) => board.tasks[id]).filter(Boolean);
                return (
                  <Column
                    key={col.id}
                    column={col}
                    tasks={tasks}
                    visible={filtering ? matches : undefined}
                    tags={board.tags || {}}
                    now={now}
                    composing={composing === col.id}
                    onCompose={(on) => setComposing(on ? col.id : null)}
                    setBoard={(fn) => onBoardUpdate(fn(board))}
                    onDeleteColumn={requestDeleteColumn}
                    onOpenTask={(t) => onOpenTask(t.id)}
                    onToggleTimer={onToggleTimer}
                    onDeleteTask={requestDeleteTask}
                  />
                );
              })}
            </SortableContext>
            <button
              onClick={addColumn}
              className="flex h-12 w-60 shrink-0 items-center justify-center gap-2 rounded-md border border-dashed border-line-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              <Icon name="plus" size={16} />
              Nova coluna
            </button>
          </div>
        </div>
      </div>

      {openTask && (
        <TaskDrawer
          key={openTask.id}
          task={openTask}
          columnTitle={columnOf(openTask.id)?.title || ""}
          now={now}
          onClose={() => onOpenTask(null)}
          onUpdate={(t) => onBoardUpdate({ ...board, tasks: { ...board.tasks, [t.id]: t } })}
          onDelete={() => requestDeleteTask(openTask.id)}
          onToggleTimer={() => onToggleTimer(openTask.id)}
          availableTags={board.tags || {}}
          onCreateTag={(tag) =>
            onBoardUpdate({
              ...board,
              tags: { ...board.tags, [tag.id]: tag },
              tasks: { ...board.tasks, [openTask.id]: { ...openTask, tags: [...(openTask.tags || []), tag.id] } },
            })
          }
        />
      )}
      {tagsOpen && (
        <TagsModal onClose={() => setTagsOpen(false)} tags={board.tags || {}} onCreateTag={upsertTag} onUpdateTag={upsertTag} onDeleteTag={deleteTag} />
      )}
      {pendingTask && (
        <ConfirmDialog
          title={`Excluir “${pendingTask.content}”?`}
          body={`A tarefa tem ${fmtShort(elapsed(pendingTask, Date.now()))} registrados. Excluir apaga esse tempo junto. Não dá para desfazer.`}
          confirmLabel="Excluir tarefa"
          onCancel={() => setPendingTask(null)}
          onConfirm={() => {
            deleteTask(pendingTask.id);
            setPendingTask(null);
          }}
        />
      )}
      {pendingColumn && (
        <ConfirmDialog
          title={`Excluir “${pendingColumn.title}”?`}
          body={`A coluna e ${pendingColumn.taskIds.length === 1 ? "a tarefa dentro dela" : `as ${pendingColumn.taskIds.length} tarefas dentro dela`} serão apagadas, junto com o tempo registrado.`}
          confirmLabel="Excluir coluna"
          onCancel={() => setPendingColumn(null)}
          onConfirm={() => {
            deleteColumn(pendingColumn.id);
            setPendingColumn(null);
          }}
        />
      )}
    </DndContext>
  );
}
