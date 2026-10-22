import type { ReactNode } from "react";
import type { Settings, Theme } from "../settings";
import { ACCENTS, DEFAULT_SETTINGS, FONTS, onAccent } from "../settings";
import Icon from "./Icon";

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

const LABEL = "font-cond text-[13px] font-semibold uppercase tracking-[0.12em] text-faint";

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-[220px_1fr] gap-8 border-b border-line py-8 last:border-0">
      <div>
        <h2 className="font-cond text-xl font-bold uppercase tracking-[0.04em]">{title}</h2>
        <p className="mt-1 text-sm leading-snug text-muted">{hint}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

/** Theme preview: a miniature of the board in that theme's own colours. */
function ThemeCard({ theme, active, accent, onPick }: { theme: Theme; active: boolean; accent: string; onPick: () => void }) {
  const c =
    theme === "dark"
      ? { ground: "#141311", rail: "#0f0e0c", slab: "#1d1b17", line: "#3d382f", text: "#e9e2d3" }
      : { ground: "#f2eee5", rail: "#e9e3d6", slab: "#fbf9f4", line: "#c6bca8", text: "#1d1b17" };
  return (
    <button
      onClick={onPick}
      role="radio"
      aria-checked={active}
      className={`group w-56 overflow-hidden rounded-lg border-2 text-left transition-colors ${active ? "border-accent" : "border-line hover:border-line-2"}`}
    >
      <div className="flex h-32" style={{ background: c.ground }} aria-hidden>
        <div className="w-12 space-y-1.5 p-2" style={{ background: c.rail }}>
          <div className="h-1.5 w-7 rounded-full" style={{ background: accent }} />
          <div className="h-1.5 w-6 rounded-full" style={{ background: c.line }} />
          <div className="h-1.5 w-5 rounded-full" style={{ background: c.line }} />
        </div>
        <div className="flex grow flex-col gap-1.5 p-2.5">
          <div className="flex h-5 w-28 overflow-hidden rounded-sm" style={{ background: c.slab, border: `1px solid ${c.line}` }}>
            <div className="w-8" style={{ background: accent }} />
          </div>
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 space-y-1 rounded-sm p-1" style={{ background: c.slab, border: `1px solid ${c.line}` }}>
                <div className="h-1 rounded-full" style={{ background: c.text, opacity: 0.7 }} />
                <div className="h-1 w-2/3 rounded-full" style={{ background: c.text, opacity: 0.35 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-slab px-3 py-2">
        <span className="font-medium">{theme === "dark" ? "Escuro" : "Claro"}</span>
        {active && <Icon name="check" size={16} className="text-accent-ink" />}
      </div>
    </button>
  );
}

export default function SettingsView({ settings, onChange }: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });
  const custom = !ACCENTS.some((a) => a.hex.toLowerCase() === settings.accent.toLowerCase());

  return (
    <div className="flex h-screen min-w-0 grow flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-6">
        <h1 className="font-cond text-[28px] font-bold uppercase leading-none tracking-[0.03em]">Configurações</h1>
        <span className="ml-auto font-cond text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">Aplica e salva na hora</span>
      </header>

      <div className="min-h-0 grow overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 pb-16">
          <Section title="Tema" hint="Escuro para o dia todo na tela; claro para ambientes iluminados.">
            <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Tema">
              {(["dark", "light"] as Theme[]).map((t) => (
                <ThemeCard key={t} theme={t} active={settings.theme === t} accent={settings.accent} onPick={() => set({ theme: t })} />
              ))}
            </div>
          </Section>

          <Section title="Cor principal" hint="Usada no placar, no cronômetro rodando, nos botões e na seleção.">
            <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Cor principal">
              {ACCENTS.map((a) => {
                const on = a.hex.toLowerCase() === settings.accent.toLowerCase();
                return (
                  <button
                    key={a.hex}
                    role="radio"
                    aria-checked={on}
                    aria-label={a.name}
                    title={a.name}
                    onClick={() => set({ accent: a.hex })}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105 ${
                      on ? "ring-2 ring-cream ring-offset-2 ring-offset-ground" : ""
                    }`}
                    style={{ background: a.hex, color: onAccent(a.hex) }}
                  >
                    {on && <Icon name="check" size={18} />}
                  </button>
                );
              })}
              <label
                title="Cor personalizada"
                className={`relative flex h-11 cursor-pointer items-center gap-2 rounded-full border border-dashed pl-1.5 pr-4 text-sm ${
                  custom ? "border-accent text-cream" : "border-line-2 text-muted hover:border-faint hover:text-cream"
                }`}
              >
                <span className="h-8 w-8 rounded-full" style={{ background: custom ? settings.accent : "conic-gradient(#e2659c,#e2a63b,#45b97c,#34b3c7,#5b8def,#8b7cf6,#e2659c)" }} />
                Personalizada
                <input type="color" value={settings.accent} onChange={(e) => set({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className={LABEL}>Prévia</span>
              <span className="flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent">
                <Icon name="play" size={14} />
                Iniciar
              </span>
              <span className="flex items-center gap-2 font-cond text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Contando
              </span>
              <span className="rounded-md border border-accent/60 bg-accent-deep px-3 py-1.5 text-sm">Tarefa rodando</span>
            </div>
          </Section>

          <Section title="Fonte" hint="Fonte do texto das tarefas, notas e menus. Placar e títulos mantêm a fonte condensada.">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2" role="radiogroup" aria-label="Fonte">
              {Object.entries(FONTS).map(([key, f]) => {
                const on = settings.font === key;
                return (
                  <button
                    key={key}
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ font: key })}
                    className={`rounded-md border px-4 py-3 text-left transition-colors ${on ? "border-accent bg-accent-deep" : "border-line bg-slab hover:border-line-2"}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={LABEL}>{f.label}</span>
                      {on && <Icon name="check" size={15} className="text-accent-ink" />}
                    </div>
                    <p className="mt-1.5 text-[15px] leading-snug" style={{ fontFamily: f.stack }}>
                      Revisar contrato de manutenção — 2h 13m
                    </p>
                    <p className="mt-0.5 text-xs text-faint">{f.note}</p>
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="pt-6">
            <button
              onClick={() => onChange(DEFAULT_SETTINGS)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-slab hover:text-cream"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
