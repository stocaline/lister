import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";

/** Every style the notepad turns markdown into as you type; verified against the editor's input rules. */
const ROWS: { type: string; keys?: string; result: ReactNode }[] = [
  { type: "# Título", keys: "Ctrl Alt 1", result: <span className="font-cond text-xl font-bold uppercase leading-none">Título</span> },
  { type: "## Subtítulo", keys: "Ctrl Alt 2", result: <span className="font-cond text-lg font-bold uppercase leading-none">Subtítulo</span> },
  { type: "### Seção", keys: "Ctrl Alt 3", result: <span className="font-cond text-base font-bold leading-none text-muted">Seção</span> },
  { type: "**negrito**", keys: "Ctrl B", result: <strong className="font-semibold">negrito</strong> },
  { type: "*itálico*  ou  _itálico_", keys: "Ctrl I", result: <em className="text-muted">itálico</em> },
  { type: "~~riscado~~", keys: "Ctrl Shift S", result: <s>riscado</s> },
  { type: "(só pelo atalho)", keys: "Ctrl U", result: <u className="underline-offset-2">sublinhado</u> },
  {
    type: "`código`",
    keys: "Ctrl E",
    result: <code className="rounded border border-line bg-slab-2 px-1 font-mono text-[0.85em]">código</code>,
  },
  {
    type: "- item  ou  * item",
    keys: "Ctrl Shift 8",
    result: (
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-faint" />
        item
      </span>
    ),
  },
  { type: "1. item", keys: "Ctrl Shift 7", result: <span><span className="text-faint">1.</span> item</span> },
  {
    type: "[ ] tarefa   [x] feita",
    result: (
      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-[3px] border-[1.5px] border-line-2" />
        tarefa
        <span className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-accent text-on-accent">
          <Icon name="check" size={10} />
        </span>
        <s className="text-faint">feita</s>
      </span>
    ),
  },
  { type: "> citação", keys: "Ctrl Shift B", result: <span className="border-l border-accent pl-2 text-muted">citação</span> },
  {
    type: "``` + Enter",
    keys: "Ctrl Alt C",
    result: <code className="block rounded border border-line bg-slab px-2 py-1 font-mono text-[0.8em]">bloco de código</code>,
  },
  { type: "---", result: <span className="block h-px w-24 bg-line-2" /> },
  {
    type: "https://… (colar ou digitar)",
    result: <span className="text-accent-ink underline decoration-accent/50 underline-offset-2">link</span>,
  },
];

/** "?" button in the notepad header that opens the markdown cheat sheet. */
export default function MarkdownHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Ajuda de formatação markdown"
        title="Formatação: tudo o que o bloco de notas entende"
        className={`flex h-9 w-9 items-center justify-center rounded-md border font-cond text-lg font-bold transition-colors ${
          open ? "border-accent bg-accent-deep text-accent-ink" : "border-line-2 text-muted hover:border-faint hover:text-cream"
        }`}
      >
        ?
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Formatação markdown"
          className="pop-in absolute right-0 top-11 z-40 max-h-[75vh] w-[34rem] overflow-y-auto rounded-lg border border-line-2 bg-slab-2 shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6)]"
        >
          <div className="sticky top-0 border-b border-line bg-slab-2 px-5 py-3">
            <h3 className="font-cond text-lg font-bold uppercase tracking-[0.04em]">Formatação</h3>
            <p className="text-[13px] text-muted">Digite o código no começo da linha (ou em volta do texto) e ele vira estilo na hora.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="font-cond text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 pb-1 pt-3 text-left font-semibold">Digite</th>
                <th className="px-2 pb-1 pt-3 text-left font-semibold">Atalho</th>
                <th className="px-5 pb-1 pt-3 text-left font-semibold">Vira</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.type} className="border-t border-line/70">
                  <td className="px-5 py-2.5">
                    <code className="whitespace-pre font-mono text-[12.5px] text-cream">{r.type}</code>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-cond text-[13px] font-semibold text-faint">{r.keys || "—"}</td>
                  <td className="px-5 py-2.5">{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-5 py-3 text-[13px] text-muted">
            Em listas, <kbd className="rounded border border-line-2 px-1 font-cond text-xs">Tab</kbd> recua e{" "}
            <kbd className="rounded border border-line-2 px-1 font-cond text-xs">Shift Tab</kbd> volta. Tudo é salvo como markdown e sai igual no “Exportar .md”.
          </p>
        </div>
      )}
    </div>
  );
}
