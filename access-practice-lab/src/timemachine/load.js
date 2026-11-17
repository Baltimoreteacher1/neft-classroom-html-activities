// Language Time Machine — one loader for the page and for the doors in Passport and Portfolio, so the count a door
// shows is the count the page lists. It only READS: the lab's saved documents on this device (also after a Passport
// import, which restores the same keys) and the studio task files for titles, prompts and language goals.
import { loadSpeakingTasks, loadWritingTasks } from "../content.js";
import { safeJson, storage } from "../util.js";
import { collect, readSources } from "./collect.js";
import { listReflections, loadTM, overlay } from "./reflect.js";

const byId = (doc) =>
  Object.fromEntries(
    (doc?.tasks || []).map((t) => [t.id, { title: t.title, prompt: t.prompt, keyUse: t.keyUse }]),
  );

export async function loadTasks() {
  const [w, s] = await Promise.all([
    loadWritingTasks().catch(() => null),
    loadSpeakingTasks().catch(() => null),
  ]);
  return { writing: byId(w), speaking: byId(s) };
}

/** Items, pairs and this feature's own notes. `tasks` can be passed in (tests) instead of fetched. */
export async function loadModel({
  tasks = null,
  read = (k) => safeJson(storage.get(k), null),
} = {}) {
  const tm = loadTM((k) => JSON.stringify(read(k)));
  const sources = readSources(read);
  const base = collect({ ...sources, tasks: tasks || (await loadTasks()) }, { links: tm.links });
  const items = overlay(base.items, tm);
  const byItem = new Map(items.map((x) => [x.id, x]));
  const pairs = base.pairs.map((p) => ({
    ...p,
    earlier: byItem.get(p.earlier.id),
    later: byItem.get(p.later.id),
  }));
  return {
    tm,
    items,
    pairs,
    writing: pairs.filter((p) => p.kind === "writing"),
    speaking: pairs.filter((p) => p.kind === "speaking"),
    reflections: listReflections(tm),
  };
}

/** What a door needs: how many pairs, and the reflections (newest first). */
export async function doorData() {
  try {
    const m = await loadModel();
    return { pairs: m.pairs.length, reflections: m.reflections };
  } catch {
    return { pairs: 0, reflections: [] };
  }
}
