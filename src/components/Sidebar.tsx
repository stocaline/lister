import { useState } from "react";
import type { Board } from "../types";
import { fmtShort, isNotes, sumElapsed } from "../types";
import Icon from "./Icon";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  boards: Board[];
  activeBoardId: string;
  liveBoardId?: string;
  now: number;
  onSelectBoard: (id: string) => void;
  onCreateBoard: (title: string, kind: "board" | "notes") => void;
  onDeleteBoard: (id: string) => void;
  onOpenPalette: () => void;
  settingsOpen: boolean;
  onOpenSettings: () => void;
}

export default function Sidebar({ boards, activeBoardId, liveBoardId, now, onSelectBoard, onCreateBoard, onDeleteBoard, onOpenPalette, settingsOpen, onOpenSettings }: Props) {
  const [pendingDelete, setPendingDelete] = useState<Board | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"board" | "notes">("board");

  const totals = new Map(boards.map((b) => [b.id, sumElapsed(Object.values(b.tasks), now)]));
  const max = Math.max(1, ...totals.values());
  const all = [...totals.values()].reduce((a, b) => a + b, 0);

  const submit = () => {
    if (!name.trim()) return;
    onCreateBoard(name, kind);
    setCreating(false);
    setName("");
  };
  const cancel = () => {
    setCreating(false);
    setName("");
    setKind("board");
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-rail">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="flex items-center gap-2.5">
          {/* The app mark (src-tauri/icons/lister.svg) without its tile. */}
          <svg viewBox="232 220 560 572" className="h-6 w-6" aria-hidden>
            <path d="M232 268a48 48 0 0 1 48-48h88a48 48 0 0 1 48 48v348h328a48 48 0 0 1 48 48v88a48 48 0 0 1-48 48H280a48 48 0 0 1-48-48z" fill="var(--color-accent)" />
            <rect x="476" y="220" width="316" height="112" rx="40" fill="var(--color-cream)" />
            <rect x="476" y="404" width="212" height="112" rx="40" fill="var(--color-cream)" opacity=".55" />
            <circle cx="768" cy="460" r="52" fill="var(--color-stamp)" />
          </svg>
          <span className="font-cond text-[26px] font-bold uppercase leading-none tracking-[0.06em]">Lister</span>
        </span>
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1.5 rounded border border-line-2 px-2 py-1 font-cond text-xs font-semibold text-muted hover:border-faint hover:text-cream"
          title="Ir para quadro ou tarefa"
        >
          <Icon name="search" size={13} />
          Ctrl K
        </button>
      </div>

      <div className="flex items-baseline justify-between px-5 pb-2 pt-3 font-cond text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        <span>Quadros</span>
        <span className="tnum">{fmtShort(all) || "0m"} no total</span>
      </div>

      <nav className="grow space-y-0.5 overflow-y-auto px-2 pb-2">
        {boards.map((b) => {
          const active = !settingsOpen && activeBoardId === b.id;
          const total = totals.get(b.id) || 0;
          return (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectBoard(b.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelectBoard(b.id)}
              className={`group relative flex cursor-pointer flex-col gap-2 rounded-md px-3 py-2.5 transition-colors ${
                active ? "bg-slab-2 text-cream" : "text-muted hover:bg-slab hover:text-cream"
              }`}
            >
              <div className="flex items-center gap-2">
                {isNotes(b) && <Icon name="note" size={14} className={active ? "text-accent-ink" : "text-faint"} />}
                <span className="min-w-0 grow truncate font-medium">{b.title}</span>
                {liveBoardId === b.id && <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" title="Cronômetro rodando" />}
                <span className="tnum font-cond text-[13px] font-semibold text-faint group-hover:hidden">{isNotes(b) ? "notas" : fmtShort(total) || "—"}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(b);
                  }}
                  className="hidden rounded p-0.5 text-faint hover:text-stamp group-hover:block"
                  title="Excluir quadro"
                  aria-label={`Excluir quadro ${b.title}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
              {!isNotes(b) && (
              <div className="h-[3px] rounded-full bg-line" title={total ? `${fmtShort(total)} registrados` : "Sem tempo registrado"}>
                <div
                  className={`h-[3px] rounded-full ${active ? "bg-accent" : "bg-faint/60"}`}
                  style={{ width: total ? `${Math.max(3, (total / max) * 100)}%` : 0 }}
                />
              </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        {creating ? (
          <div className="pop-in space-y-2">
            <div className="grid grid-cols-2 rounded-md border border-line-2 p-0.5" role="radiogroup" aria-label="Tipo">
              {(
                [
                  ["board", "Quadro", "board"],
                  ["notes", "Notas", "note"],
                ] as const
              ).map(([k, label, icon]) => (
                <button
                  key={k}
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-cond text-sm font-bold uppercase tracking-[0.06em] transition-colors ${
                    kind === k ? "bg-slab-3 text-cream" : "text-faint hover:text-muted"
                  }`}
                >
                  <Icon name={icon} size={14} />
                  {label}
                </button>
              ))}
            </div>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") cancel();
              }}
              placeholder={kind === "notes" ? "Nome do bloco de notas" : "Nome do quadro"}
              className="w-full rounded-md border border-line-2 bg-slab px-3 py-2 text-sm placeholder-faint outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <button onClick={cancel} className="flex-1 rounded-md py-1.5 text-sm text-muted hover:bg-slab hover:text-cream">
                Cancelar
              </button>
              <button onClick={submit} className="flex-1 rounded-md bg-accent py-1.5 text-sm font-semibold text-on-accent hover:brightness-110">
                Criar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex grow items-center justify-center gap-2 rounded-md border border-dashed border-line-2 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent-ink"
          >
            <Icon name="plus" size={16} />
            Novo quadro
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Configurações"
            title="Configurações"
            className={`flex w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
              settingsOpen ? "border-accent bg-accent-deep text-accent-ink" : "border-line-2 text-muted hover:border-faint hover:text-cream"
            }`}
          >
            <Icon name="gear" size={17} />
          </button>
          </div>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={`Excluir “${pendingDelete.title}”?`}
          body={isNotes(pendingDelete) ? "O bloco de notas e todo o texto dele serão apagados. Não dá para desfazer." : "O quadro, suas colunas, tarefas e o tempo registrado serão apagados. Não dá para desfazer."}
          confirmLabel="Excluir quadro"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDeleteBoard(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </aside>
  );
}
