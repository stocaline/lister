import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export interface FilterOption {
  value: string;
  label: string;
  swatch?: string; // tailwind bg-* class or text-* class for the leading mark
}

interface Props {
  label: string;
  value: string;
  options: FilterOption[];
  empty?: string;
  onChange: (value: string) => void;
}

/** Slab dropdown in place of a native <select>, so the open list carries the palette too. */
export default function FilterMenu({ label, value, options, empty, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

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

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
          current ? "border-accent/60 bg-accent-deep/40 text-cream" : "border-line-2 text-muted hover:border-faint hover:text-cream"
        }`}
      >
        {current?.swatch && <span className={`h-2 w-2 rounded-full ${current.swatch}`} />}
        {current ? current.label : label}
        <Icon name="chevron" size={13} className={`transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="pop-in absolute right-0 top-11 z-30 max-h-72 w-52 overflow-y-auto rounded-md border border-line-2 bg-slab-2 py-1 text-sm shadow-[0_16px_32px_-8px_rgb(0_0_0/0.6)]"
        >
          <li role="option" aria-selected={!value} onClick={() => pick("")} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-muted hover:bg-slab-3 hover:text-cream">
            <span className="w-2" />
            Todas
            {!value && <Icon name="check" size={14} className="ml-auto text-accent-ink" />}
          </li>
          {options.length === 0 && empty && <li className="px-3 py-2 text-faint">{empty}</li>}
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => pick(o.value)}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slab-3"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${o.swatch || ""}`} />
              <span className="truncate">{o.label}</span>
              {o.value === value && <Icon name="check" size={14} className="ml-auto shrink-0 text-accent-ink" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
