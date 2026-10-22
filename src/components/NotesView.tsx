import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import type { Board } from "../types";
import Icon from "./Icon";
import MarkdownHelp from "./MarkdownHelp";

interface Props {
  board: Board;
  scoreboard: ReactNode;
  onBoardUpdate: (b: Board) => void;
}

const words = (md: string) => (md.match(/[\p{L}\p{N}]+/gu) || []).length;

/** A board that is a markdown notepad: typing "# ", "- ", "**…**", "[ ] " styles itself as you go. */
export default function NotesView({ board, scoreboard, onBoardUpdate }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [count, setCount] = useState(() => words(board.notes || ""));
  const boardRef = useRef(board);
  boardRef.current = board;
  const saveTimer = useRef<number | undefined>(undefined);
  const pending = useRef<string | null>(null);

  const flush = () => {
    window.clearTimeout(saveTimer.current);
    if (pending.current === null) return;
    const md = pending.current;
    pending.current = null;
    setCount(words(md));
    onBoardUpdate({ ...boardRef.current, notes: md });
  };

  useEffect(() => setTitle(board.title), [board.title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Comece a escrever… use # para título, - para lista, [ ] para tarefa, ** para negrito." }),
      Markdown,
    ],
    content: board.notes || "",
    contentType: "markdown",
    autofocus: !board.notes ? "end" : false,
    editorProps: { attributes: { class: "notes-prose", spellcheck: "true" } },
    onUpdate: ({ editor }) => {
      // Debounced so every keystroke doesn't rewrite the store file.
      pending.current = editor.getMarkdown();
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(flush, 400);
    },
  });

  // Flush a pending save when leaving the notepad.
  useEffect(() => () => flush(), []);

  const commitTitle = () => {
    setEditingTitle(false);
    if (title.trim() && title.trim() !== board.title) onBoardUpdate({ ...board, title: title.trim() });
    else setTitle(board.title);
  };

  const exportMd = () => {
    const a = document.createElement("a");
    a.href = `data:text/markdown;charset=utf-8,${encodeURIComponent(editor?.getMarkdown() ?? board.notes ?? "")}`;
    a.download = `${board.title || "notas"}.md`;
    a.click();
  };

  return (
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
        <div className="tnum flex shrink-0 font-cond text-[15px] font-bold">
          <span className="rounded-l bg-slab-2 px-2.5 py-1">Notas</span>
          <span className="rounded-r bg-slab px-2.5 py-1 text-muted">
            {count} {count === 1 ? "palavra" : "palavras"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-cond text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">Salvo automaticamente</span>
          <MarkdownHelp />
          <button
            onClick={exportMd}
            className="flex h-9 items-center gap-2 rounded-md border border-line-2 px-3 text-sm font-medium text-muted hover:border-faint hover:text-cream"
            title="Baixar como arquivo .md"
          >
            <Icon name="open" size={15} />
            Exportar .md
          </button>
        </div>
      </header>

      <div className="shrink-0 px-6 pt-4">{scoreboard}</div>

      <div className="min-h-0 grow overflow-y-auto" onClick={() => editor?.isFocused || editor?.commands.focus("end")}>
        <div className="mx-auto max-w-[72ch] px-6 pb-24 pt-8" onClick={(e) => e.stopPropagation()}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
