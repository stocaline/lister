import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getStore } from "./store";

export type Theme = "dark" | "light";

export interface Settings {
  theme: Theme;
  accent: string; // #rrggbb
  font: string; // FONTS key
}

export const DEFAULT_SETTINGS: Settings = { theme: "dark", accent: "#8b7cf6", font: "barlow" };

export const ACCENTS = [
  { name: "Violeta", hex: "#8b7cf6" },
  { name: "Azul", hex: "#5b8def" },
  { name: "Ciano", hex: "#34b3c7" },
  { name: "Verde", hex: "#45b97c" },
  { name: "Âmbar", hex: "#e2a63b" },
  { name: "Coral", hex: "#ea6f55" },
  { name: "Rosa", hex: "#e2659c" },
];

export const FONTS: Record<string, { label: string; note: string; stack: string }> = {
  barlow: { label: "Barlow", note: "Padrão do Lister", stack: '"Barlow", system-ui, sans-serif' },
  inter: { label: "Inter", note: "Neutra e compacta", stack: '"Inter", system-ui, sans-serif' },
  atkinson: { label: "Atkinson Hyperlegible", note: "Feita para máxima legibilidade", stack: '"Atkinson Hyperlegible", system-ui, sans-serif' },
  lexend: { label: "Lexend", note: "Espaçada, leitura relaxada", stack: '"Lexend", system-ui, sans-serif' },
  system: { label: "Fonte do sistema", note: "Segoe UI no Windows", stack: '"Segoe UI", system-ui, sans-serif' },
};

const channel = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

/** Dark ink or white, whichever reads better on the accent (WCAG contrast). */
export function onAccent(hex: string) {
  const l = luminance(hex);
  const vsDark = (l + 0.05) / (luminance("#141311") + 0.05);
  const vsWhite = 1.05 / (l + 0.05);
  return vsDark >= vsWhite ? "#141311" : "#ffffff";
}

const valid = (s: Partial<Settings> | undefined): Settings => ({
  theme: s?.theme === "light" ? "light" : "dark",
  accent: /^#[0-9a-f]{6}$/i.test(s?.accent || "") ? s!.accent! : DEFAULT_SETTINGS.accent,
  font: s?.font && FONTS[s.font] ? s.font : DEFAULT_SETTINGS.font,
});

export async function loadSettings() {
  try {
    return valid(await (await getStore()).get<Settings>("settings"));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings) {
  const store = await getStore();
  await store.set("settings", s);
  await store.save();
  await emit("settings-changed", s);
}

export function applySettings(s: Settings) {
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.style.setProperty("--color-accent", s.accent);
  root.style.setProperty("--color-on-accent", onAccent(s.accent));
  root.style.setProperty("--font-sans", FONTS[s.font].stack);
  getCurrentWindow().setTheme(s.theme).catch(() => {});
}

// Self-check for the contrast pick: light accents get dark ink, deep ones get white.
if (import.meta.env.DEV) {
  console.assert(onAccent("#e2a63b") === "#141311", "amber should take dark ink");
  console.assert(onAccent("#1d3fa8") === "#ffffff", "deep blue should take white");
}
