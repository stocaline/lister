import { load, type Store } from "@tauri-apps/plugin-store";
import type { Board } from "./types";

const FILE = "lister_data.bin";
let store: Store | null = null;

export async function getStore() {
  if (!store) store = await load(FILE, { autoSave: false, defaults: {} });
  return store;
}

export const loadBoards = async () => (await (await getStore()).get<Board[]>("boards")) || [];

/** Re-reads the file from disk, picking up edits made outside the app (e.g. the Claude skill). */
export const reloadBoards = async () => {
  await (await getStore()).reload();
  return loadBoards();
};

export const saveBoards =async (boards: Board[]) => {
  const s = await getStore();
  await s.set("boards", boards);
  await s.save();
};

/** One-time migration from the pre-Tauri-Store localStorage format. */
export async function migrateFromLocalStorage() {
  if ((await loadBoards()).length > 0) return false;
  let boards: Board[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem("boards") || "null");
    if (Array.isArray(raw) && raw.length > 0) boards = raw;
  } catch (e) {
    console.error("Error parsing localStorage boards:", e);
  }
  if (boards.length === 0) {
    try {
      const legacy = JSON.parse(localStorage.getItem("board") || "null");
      if (legacy?.id) boards = [legacy];
    } catch (e) {
      console.error("Error parsing legacy board:", e);
    }
  }
  if (boards.length === 0) return false;
  await saveBoards(boards);
  return true;
}
