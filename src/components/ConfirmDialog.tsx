import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal
        className="pop-in w-full max-w-sm rounded-lg border border-line-2 bg-slab p-6 text-cream shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 font-cond text-xl font-bold uppercase tracking-[0.04em]">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-muted">{body}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:bg-slab-2 hover:text-cream">
            Cancelar
          </button>
          <button autoFocus onClick={onConfirm} className="rounded-md bg-stamp px-4 py-2 text-sm font-semibold text-ground hover:brightness-110">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
