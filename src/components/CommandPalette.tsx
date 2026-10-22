import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Board } from "../types";
import { elapsed, fmtShort, isNotes } from "../types";
import Icon from "./Icon";

interface Props {
  boards: Board[];
  now: number;
  onClose: () => void;
  onPick: (boardId: string, taskId: string | null) => void;
}

interface Item {
  key: string;
  boardId: string;
  taskId: string | null;
  label: string;
  hint: string;
  meta: string;
  done?: boolean;
  notes?: boolean;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ctrl+K: jump to any board or task across all boards. */
export default function CommandPalette({ boards, now, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo(() => {
    const q = norm(query.trim());
    const out: Item[] = [];
    for (const b of boards) {
      const inNotes = !!q && isNotes(b) && norm(b.notes || "").includes(q);
      if (!q || norm(b.title).includes(q) || inNotes)
        out.push({
          key: b.id,
          boardId: b.id,
          taskId: null,
          label: b.title,
          hint: isNotes(b) ? (inNotes ? "Bloco de notas · encontrado no texto" : "Bloco de notas") : "Quadro",
          meta: isNotes(b) ? "" : `${Object.keys(b.tasks).length} tarefas`,
          notes: isNotes(b),
        });
    }
    if (q) {
      for (const b of boards)
        for (const col of Object.values(b.columns))
          for (const id of col.taskIds) {
            const t = b.tasks[id];
            if (t && (norm(t.content).includes(q) || norm(t.description || "").includes(q)))
              out.push({ key: id, boardId: b.id, taskId: id, label: t.content, hint: `${b.title} · ${col.title}`, meta: fmtShort(elapsed(t, now)), done: t.completed });
          }
    }
    return out.slice(0, 50);
  }, [boards, query, now]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const pick = (item?: Item) => item && onPick(item.boardId, item.taskId);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center bg-black/55 px-4 pt-[14vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Ir para quadro ou tarefa"
        className="pop-in flex h-fit max-h-[60vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-line-2 bg-slab text-cream shadow-[0_24px_48px_-12px_rgb(0_0_0/0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={18} className="text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") (e.preventDefault(), setIndex((i) => Math.min(i + 1, items.length - 1)));
              else if (e.key === "ArrowUp") (e.preventDefault(), setIndex((i) => Math.max(i - 1, 0)));
              else if (e.key === "Enter") pick(items[index]);
            }}
            placeholder="Ir para quadro ou tarefa…"
            className="grow bg-transparent text-base placeholder-faint outline-none"
          />
          <kbd className="rounded border border-line-2 px-1.5 font-cond text-xs font-semibold text-faint">Esc</kbd>
        </label>
        <ul ref={listRef} className="overflow-y-auto p-1.5" role="listbox">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Nada encontrado para “{query}”.</li>}
          {items.map((it, i) => (
            <li
              key={it.key}
              role="option"
              aria-selected={i === index}
              onMouseMove={() => setIndex(i)}
              onClick={() => pick(it)}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 ${i === index ? "bg-slab-3" : ""}`}
            >
              <Icon name={it.taskId ? "check" : it.notes ? "note" : "board"} size={16} className={it.taskId ? "text-faint" : "text-accent-ink"} />
              <div className="min-w-0 grow">
                <div className={`truncate text-sm ${it.done ? "text-faint line-through" : ""}`}>{it.label}</div>
                <div className="truncate font-cond text-xs font-semibold uppercase tracking-[0.08em] text-faint">{it.hint}</div>
              </div>
              <span className="tnum shrink-0 font-cond text-sm font-semibold text-muted">{it.meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
