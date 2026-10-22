import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Tag } from "../types";
import { TAG_COLORS } from "../types";
import Icon from "./Icon";

interface Props {
  onClose: () => void;
  tags: Record<string, Tag>;
  onCreateTag: (t: Tag) => void;
  onUpdateTag: (t: Tag) => void;
  onDeleteTag: (id: string) => void;
}

export default function TagsModal({ onClose, tags, onCreateTag, onUpdateTag, onDeleteTag }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[10]);

  const reset = () => {
    setEditingId(null);
    setCreating(false);
    setName("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editingId || creating) reset();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId, creating, onClose]);

  const save = () => {
    if (!name.trim()) return;
    if (creating) onCreateTag({ id: `tag-${Date.now()}`, title: name.trim(), color });
    else if (editingId) onUpdateTag({ id: editingId, title: name.trim(), color });
    reset();
  };

  const editor = (submitLabel: string) => (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Nome da tag"
        className="h-9 w-full rounded-md border border-line-2 bg-ground px-3 text-sm placeholder-faint outline-none focus:border-accent"
      />
      <div className="flex flex-wrap gap-2">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={c.replace("bg-", "").replace("-500", "")}
            className={`h-5 w-5 rounded-full ${c} ${color === c ? "ring-2 ring-cream ring-offset-2 ring-offset-slab-2" : "opacity-80 hover:opacity-100"}`}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={reset} className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-slab-3 hover:text-cream">
          Cancelar
        </button>
        <button onClick={save} disabled={!name.trim()} className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent hover:brightness-110 disabled:opacity-40">
          {submitLabel}
        </button>
      </div>
    </div>
  );

  const list = Object.values(tags);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Tags do quadro"
        className="pop-in flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-line-2 bg-slab text-cream shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-2">
          <h2 className="font-cond text-xl font-bold uppercase tracking-[0.05em]">Tags do quadro</h2>
          <button onClick={onClose} className="rounded-md p-2 text-muted hover:bg-slab-2 hover:text-cream" aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="grow space-y-1 overflow-y-auto p-3">
          {list.length === 0 && !creating && <p className="px-2 py-6 text-center text-sm text-muted">Nenhuma tag ainda. Tags ajudam a separar cliente, contexto ou tipo de trabalho.</p>}
          {list.map((tag) =>
            editingId === tag.id ? (
              <div key={tag.id} className="rounded-md bg-slab-2 p-3">
                {editor("Salvar")}
              </div>
            ) : (
              <div key={tag.id} className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slab-2">
                <span className={`h-3 w-3 shrink-0 rounded-full ${tag.color}`} />
                <span className="grow text-sm font-medium">{tag.title}</span>
                <button
                  onClick={() => {
                    setEditingId(tag.id);
                    setCreating(false);
                    setName(tag.title);
                    setColor(tag.color);
                  }}
                  className="rounded p-1.5 text-faint opacity-0 hover:text-accent-ink focus:opacity-100 group-hover:opacity-100"
                  aria-label={`Editar ${tag.title}`}
                >
                  <Icon name="pencil" size={15} />
                </button>
                <button
                  onClick={() => onDeleteTag(tag.id)}
                  className="rounded p-1.5 text-faint opacity-0 hover:text-stamp focus:opacity-100 group-hover:opacity-100"
                  aria-label={`Excluir ${tag.title}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ),
          )}
          {creating && <div className="rounded-md bg-slab-2 p-3">{editor("Criar tag")}</div>}
        </div>

        {!creating && !editingId && (
          <div className="border-t border-line p-3">
            <button
              onClick={() => {
                reset();
                setCreating(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-2 py-2 text-sm font-medium text-muted hover:border-accent hover:text-accent-ink"
            >
              <Icon name="plus" size={15} />
              Nova tag
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
