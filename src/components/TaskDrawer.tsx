import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Priority, Tag, Task } from "../types";
import { PRIORITY_LABEL, TAG_COLORS, elapsed, fmtClock, parseDuration, setLoggedTime } from "../types";
import Icon from "./Icon";

interface Props {
  task: Task;
  columnTitle: string;
  now: number;
  onClose: () => void;
  onUpdate: (t: Task) => void;
  onDelete: () => void;
  onToggleTimer: () => void;
  availableTags: Record<string, Tag>;
  onCreateTag: (t: Tag) => void;
}

const LABEL = "font-cond text-[13px] font-semibold uppercase tracking-[0.12em] text-faint";
const PRIORITY_ON: Record<Priority, string> = {
  high: "border-stamp/70 bg-stamp/15 text-stamp",
  medium: "border-amber/60 bg-amber/10 text-amber",
  low: "border-sage/60 bg-sage/10 text-sage",
};

/** Textareas grow with their content instead of scrolling inside themselves. */
const autoGrow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");

/** Task details as a side panel: the board stays visible and every change saves as you go. */
export default function TaskDrawer({ task, columnTitle, now, onClose, onUpdate, onDelete, onToggleTimer, availableTags, onCreateTag }: Props) {
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description || "");
  const [newSubtask, setNewSubtask] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[10]);
  const [timeDraft, setTimeDraft] = useState<string | null>(null);
  const [timeError, setTimeError] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setContent(task.content), [task.content]);
  useEffect(() => setDescription(task.description || ""), [task.description]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pickerOpen) setPickerOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = (e: MouseEvent) => !pickerRef.current?.contains(e.target as Node) && setPickerOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pickerOpen]);

  const patch = (p: Partial<Task>) => onUpdate({ ...task, ...p });
  const subtasks = task.subtasks || [];
  const tagIds = task.tags || [];
  const done = subtasks.filter((s) => s.done).length;
  const running = !!task.isRunning;

  const commitContent = () => {
    if (content.trim() && content.trim() !== task.content) patch({ content: content.trim() });
    else setContent(task.content);
  };

  const commitTime = () => {
    if (timeDraft === null) return;
    const ms = parseDuration(timeDraft);
    if (ms === null) {
      setTimeError(true);
      return;
    }
    onUpdate(setLoggedTime(task, ms));
    setTimeDraft(null);
  };

  const setCompleted = (completed: boolean) =>
    patch({
      completed,
      completedAt: completed ? Date.now() : null,
      ...(completed && running ? { isRunning: false, timeLog: elapsed(task, Date.now()), lastStartTime: undefined } : {}),
    });

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    patch({ subtasks: [...subtasks, { id: `st-${Date.now()}`, content: newSubtask.trim(), done: false }] });
    setNewSubtask("");
  };

  const toggleTag = (id: string) => patch({ tags: tagIds.includes(id) ? tagIds.filter((x) => x !== id) : [...tagIds, id] });

  const createTag = () => {
    if (!newTagName.trim()) return;
    const tag = { id: `tag-${Date.now()}`, title: newTagName.trim(), color: newTagColor };
    onCreateTag(tag); // creates it on the board and attaches it to this task
    setNewTagName("");
  };

  return createPortal(
    <aside
      role="dialog"
      aria-label={`Tarefa: ${task.content}`}
      className="drawer-in fixed bottom-0 right-0 top-0 z-40 flex w-[480px] max-w-full flex-col border-l border-line-2 bg-slab text-cream shadow-[-24px_0_48px_-16px_rgb(0_0_0/0.55)]"
    >
      <header className="flex h-12 shrink-0 items-stretch border-b border-line">
        <span className="flex items-center bg-slab-3 px-4 font-cond text-sm font-bold uppercase tracking-[0.1em] text-muted">{columnTitle}</span>
        <span className="flex grow items-center px-4 font-cond text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">Salvo automaticamente</span>
        <button onClick={onClose} className="flex w-12 items-center justify-center text-muted hover:bg-slab-2 hover:text-cream" aria-label="Fechar (Esc)" title="Fechar (Esc)">
          <Icon name="x" size={18} />
        </button>
      </header>

      <div className="grow space-y-7 overflow-y-auto px-6 py-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => setCompleted(e.target.checked)}
            aria-label="Concluída"
            className="check mt-2 h-5! w-5!"
          />
          <textarea
            value={content}
            rows={1}
            onChange={(e) => setContent(e.target.value)}
            onBlur={commitContent}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            ref={autoGrow}
            onInput={(e) => autoGrow(e.currentTarget)}
            placeholder="Nome da tarefa"
            className={`w-full resize-none overflow-hidden bg-transparent text-[22px] font-semibold leading-tight outline-none placeholder-faint ${
              task.completed ? "text-faint line-through" : ""
            }`}
          />
        </div>

        {/* The task's own scoreboard. */}
        <div className={`flex items-stretch overflow-hidden rounded-md border ${running ? "border-accent/60" : "border-line-2"}`}>
          <div className="flex min-w-0 grow flex-col justify-center px-4 py-3">
            <span className={LABEL}>{timeDraft !== null ? "Editar tempo registrado" : running ? "Rodando agora" : "Tempo registrado"}</span>
            {timeDraft !== null ? (
              <>
                <input
                  autoFocus
                  value={timeDraft}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    setTimeDraft(e.target.value);
                    setTimeError(false);
                  }}
                  onBlur={commitTime}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTime();
                    if (e.key === "Escape") {
                      e.stopPropagation(); // cancel the edit, keep the drawer open
                      setTimeDraft(null);
                      setTimeError(false);
                    }
                  }}
                  aria-invalid={timeError}
                  aria-label="Tempo registrado"
                  className={`tnum w-full border-b-2 bg-transparent font-cond text-[40px] font-bold leading-none outline-none ${timeError ? "border-stamp" : "border-accent"}`}
                />
                <span className={`mt-1 text-xs ${timeError ? "text-stamp" : "text-faint"}`}>
                  {timeError ? "Não entendi. Use 2:13:47, 45:00, 2h 13m ou 90m." : "Enter salva · Esc cancela"}
                </span>
              </>
            ) : (
              <button
                onClick={() => setTimeDraft(fmtClock(elapsed(task, Date.now())))}
                title="Clique para corrigir o tempo"
                className={`group/time flex w-fit items-center gap-2 rounded text-left ${running ? "text-cream" : "text-muted"} hover:text-cream`}
              >
                <span className="tnum font-cond text-[40px] font-bold leading-none">{fmtClock(elapsed(task, now))}</span>
                <Icon name="pencil" size={16} className="text-faint opacity-0 transition-opacity group-hover/time:opacity-100 group-focus-visible/time:opacity-100" />
              </button>
            )}
          </div>
          {!task.completed && (
            <button
              onClick={onToggleTimer}
              className={`flex w-32 items-center justify-center gap-2 font-cond text-base font-bold uppercase tracking-[0.08em] transition-colors ${
                running ? "bg-slab-3 text-cream hover:bg-line-2" : "bg-accent text-on-accent hover:brightness-110"
              }`}
            >
              <Icon name={running ? "pause" : "play"} size={18} />
              {running ? "Pausar" : "Iniciar"}
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          <span className={LABEL}>Prioridade</span>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => patch({ priority: p })}
                aria-pressed={task.priority === p}
                className={`h-9 flex-1 rounded-md border font-cond text-[15px] font-bold uppercase tracking-[0.06em] transition-colors ${
                  task.priority === p ? PRIORITY_ON[p] : "border-line-2 text-faint hover:border-faint hover:text-muted"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative space-y-2.5" ref={pickerRef}>
          <div className="flex items-center justify-between">
            <span className={LABEL}>Tags</span>
            <button onClick={() => setPickerOpen(!pickerOpen)} className="flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline underline-offset-4">
              <Icon name="plus" size={14} />
              Escolher
            </button>
          </div>
          <div className="flex min-h-7 flex-wrap gap-1.5">
            {tagIds.length === 0 && <span className="text-sm text-faint">Sem tags.</span>}
            {tagIds.map((id) => {
              const tag = availableTags[id];
              return tag ? (
                <span key={id} className="flex items-center gap-1.5 rounded-full border border-line-2 py-0.5 pl-2 pr-1 text-[13px]">
                  <span className={`h-2 w-2 rounded-full ${tag.color}`} />
                  {tag.title}
                  <button onClick={() => toggleTag(id)} className="rounded-full p-0.5 text-faint hover:text-cream" aria-label={`Remover ${tag.title}`}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
          {pickerOpen && (
            <div className="pop-in absolute left-0 right-0 top-full z-10 mt-2 rounded-md border border-line-2 bg-slab-2 p-3 shadow-[0_16px_32px_-8px_rgb(0_0_0/0.6)]">
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {Object.values(availableTags).length === 0 && <span className="text-sm text-faint">Nenhuma tag criada neste quadro.</span>}
                {Object.values(availableTags).map((t) => {
                  const on = tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTag(t.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[13px] ${
                        on ? "border-accent bg-accent-deep text-cream" : "border-line-2 text-muted hover:text-cream"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${t.color}`} />
                      {t.title}
                      {on && <Icon name="check" size={12} />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createTag()}
                    className="h-8 grow rounded-md border border-line-2 bg-ground px-2 text-sm placeholder-faint outline-none focus:border-accent"
                  />
                  <button onClick={createTag} disabled={!newTagName.trim()} className="rounded-md bg-accent px-3 text-sm font-semibold text-on-accent hover:brightness-110 disabled:opacity-40">
                    Criar
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewTagColor(c)}
                      aria-label={c.replace("bg-", "").replace("-500", "")}
                      className={`h-4 w-4 rounded-full ${c} ${newTagColor === c ? "ring-2 ring-cream ring-offset-2 ring-offset-slab-2" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <span className={LABEL}>Descrição</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (task.description || "") && patch({ description: description.trim() })}
            ref={autoGrow}
            onInput={(e) => autoGrow(e.currentTarget)}
            placeholder="Detalhes, links, combinados com o cliente…"
            className="min-h-28 w-full resize-none overflow-hidden rounded-md border border-line-2 bg-ground/60 p-3 text-sm leading-relaxed placeholder-faint outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className={LABEL}>Subtarefas</span>
            {subtasks.length > 0 && (
              <span className="tnum font-cond text-sm font-semibold text-muted">
                {done}/{subtasks.length}
              </span>
            )}
          </div>
          {subtasks.length > 0 && (
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <div className="h-1 rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(done / subtasks.length) * 100}%` }} />
            </div>
          )}
          <ul>
            {subtasks.map((st) => (
              <li key={st.id} className="group flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-slab-2">
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={() => patch({ subtasks: subtasks.map((s) => (s.id === st.id ? { ...s, done: !s.done } : s)) })}
                  className="check"
                  aria-label={st.content}
                />
                <span className={`grow text-sm ${st.done ? "text-faint line-through" : ""}`}>{st.content}</span>
                <button
                  onClick={() => patch({ subtasks: subtasks.filter((s) => s.id !== st.id) })}
                  className="p-1 text-faint opacity-0 hover:text-stamp focus:opacity-100 group-hover:opacity-100"
                  aria-label={`Remover ${st.content}`}
                >
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
            placeholder="Adicionar subtarefa e apertar Enter"
            className="h-9 w-full rounded-md border border-line-2 bg-ground/60 px-3 text-sm placeholder-faint outline-none focus:border-accent"
          />
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
          <div>
            <dt className={LABEL}>Criada</dt>
            <dd className="mt-1 text-muted">{task.createdAt ? fmtDate(task.createdAt) : "—"}</dd>
          </div>
          {task.completedAt && (
            <div>
              <dt className={LABEL}>Concluída</dt>
              <dd className="mt-1 text-muted">{fmtDate(task.completedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      <footer className="flex h-14 shrink-0 items-center border-t border-line px-4">
        <button onClick={onDelete} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-stamp hover:bg-stamp/10">
          <Icon name="trash" size={15} />
          Excluir tarefa
        </button>
      </footer>
    </aside>,
    document.body,
  );
}
