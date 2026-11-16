// Adventure Worlds engine (ADVENTURE-SCHEMA.md): progress, unlock rules, scene flow and branching, artifacts and the
// Book Studio pages. Pure functions over plain data (no DOM), so Node tests drive the same logic the view uses.
//
// Progress lives at one key, accessPracticeLab:v1:adventures =
//   { [worldId]: { [band]: { [missionId]: { scene, done, supported, answers: { [sceneIndex]: … }, artifact,
//                                           mode: "own" | "help" | null, trail: [sceneIndex…] } } } }
// `mode` (the "On my own" / "With help" choice) and `trail` (the scenes visited before the current one, for Back
// across a branch) are additions to the schema's entry; everything the schema names is kept as written.
import { checkRespond } from "./checks.js";

export const KEY = "accessPracticeLab:v1:adventures";
export const BANDS = ["3-5", "6-8"];
export const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
/** Scene kinds the learner must finish before Next. */
export const INTERACTIVE = new Set(["clues", "choice", "order", "respond"]);

export function loadProgress(read) {
  try {
    const v = JSON.parse(read(KEY) || "null");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export const saveProgress = (progress, write) => write(KEY, JSON.stringify(progress));

const fresh = () => ({
  scene: 0,
  done: false,
  supported: false,
  answers: {},
  artifact: null,
  mode: null,
  trail: [],
});

/** The entry for one mission, created when missing (call saveProgress afterwards to keep it). */
export function missionEntry(progress, worldId, band, missionId) {
  progress[worldId] ||= {};
  progress[worldId][band] ||= {};
  const e = (progress[worldId][band][missionId] ||= fresh());
  e.answers ||= {};
  e.trail ||= [];
  return e;
}
export const peekEntry = (progress, worldId, band, missionId) =>
  progress?.[worldId]?.[band]?.[missionId] || null;

/** The scenes a band plays (6-8 for any band without its own list). */
export const scenesOf = (mission, band) =>
  mission.bands[bandOf(band)] || mission.bands["6-8"] || [];

/**
 * "done" | "available" | "locked". Mission 1 is always open; each regular mission opens when the one before it is
 * done; the final demonstration opens only after every other mission is done.
 */
export function missionStatus(world, band, progress, missionId) {
  const i = world.missions.findIndex((m) => m.id === missionId);
  if (i < 0) return "locked";
  const m = world.missions[i];
  const done = (x) => !!peekEntry(progress, world.id, bandOf(band), x.id)?.done;
  if (done(m)) return "done";
  if (i === 0) return "available";
  if (m.final) return world.missions.filter((x) => !x.final).every(done) ? "available" : "locked";
  return done(world.missions[i - 1]) ? "available" : "locked";
}

export function worldSummary(world, band, progress) {
  const states = world.missions.map((m) => missionStatus(world, band, progress, m.id));
  const done = states.filter((s) => s === "done").length;
  const nextIndex = states.findIndex((s) => s === "available");
  return {
    states,
    done,
    total: world.missions.length,
    next: nextIndex >= 0 ? world.missions[nextIndex] : null,
  };
}

/** The relevant clues a learner kept in every clues scene of this mission (in scene order). */
export function collectedClues(scenes, entry) {
  const out = [];
  scenes.forEach((s, i) => {
    if (s.kind !== "clues") return;
    const picked = entry?.answers?.[i]?.picked || [];
    for (const c of s.clues) if (c.relevant && picked.includes(c.id)) out.push(c);
  });
  return out;
}

/** Can the learner leave this scene? Input scenes always; interactive ones once finished (or, for writing, after
 *  three honest checks with the model shown, so nobody is stuck forever). */
export function sceneReady(scene, answer) {
  if (!scene) return false;
  if (!INTERACTIVE.has(scene.kind)) return true;
  if (!answer) return false;
  if (scene.kind === "respond") return !!answer.ok || (answer.checks || 0) >= 3;
  return !!answer.ok;
}

/** Index of the scene after `index`: a correct choice with `next` branches there; otherwise the next one; "done" at
 *  the end. */
export function nextIndex(scenes, index, answer) {
  const s = scenes[index];
  if (s?.kind === "choice" && answer?.ok && Number.isInteger(answer.next)) return answer.next;
  return index + 1 < scenes.length ? index + 1 : "done";
}

/** Move forward. Returns the new index, or "done" when the mission's last scene is finished. */
export function advance(entry, scenes) {
  const i = entry.scene;
  if (!sceneReady(scenes[i], entry.answers[i])) return i;
  const n = nextIndex(scenes, i, entry.answers[i]);
  if (n === "done") return "done";
  entry.trail.push(i);
  entry.scene = n;
  return n;
}

/** Move back along the path actually taken (so Back after a branch returns to the choice). */
export function back(entry) {
  if (!entry.trail.length) return entry.scene;
  entry.scene = entry.trail.pop();
  return entry.scene;
}

/** Jump to a scene named in the URL: only to the current scene or one already visited (history), never ahead. */
export function goTo(entry, index) {
  if (index === entry.scene) return true;
  const at = entry.trail.indexOf(index);
  if (at < 0) return false;
  entry.trail = entry.trail.slice(0, at);
  entry.scene = index;
  return true;
}

/** The learner's own texts for every respond scene they reached, in order. */
export function respondTexts(scenes, entry) {
  const out = [];
  scenes.forEach((s, i) => {
    const text = String(entry?.answers?.[i]?.text || "").trim();
    if (s.kind === "respond" && text) out.push({ index: i, prompt: s.prompt, text });
  });
  return out;
}

/** The completion artifact: the learner's own text (the last respond is the demonstration) plus the clues used. */
export function makeArtifact(world, mission, band, entry, now = new Date().toISOString()) {
  const scenes = scenesOf(mission, band);
  const texts = respondTexts(scenes, entry);
  const last = texts.at(-1);
  return {
    world: world.title,
    title: mission.title,
    final: !!mission.final,
    text: last?.text || "",
    texts: texts.map((t) => t.text),
    clues: collectedClues(scenes, entry).map((c) => c.text.en),
    supported: !!entry.supported,
    mode: entry.mode || "own",
    at: now,
  };
}

/** Finish: save the artifact, mark done, clear the trail. */
export function completeMission(world, mission, band, entry, now) {
  entry.artifact = makeArtifact(world, mission, band, entry, now);
  entry.done = true;
  entry.doneAt = entry.artifact.at;
  entry.trail = [];
  return entry.artifact;
}

/** Start the mission again (the artifact and "done" stay until a new completion replaces them). */
export function restart(entry) {
  entry.scene = 0;
  entry.answers = {};
  entry.trail = [];
  entry.mode = null;
  entry.supported = false;
}

/** "My mission log": every finished mission with its artifact, in mission order. */
export function missionLog(world, band, progress) {
  return world.missions
    .map((m) => ({ mission: m, entry: peekEntry(progress, world.id, bandOf(band), m.id) }))
    .filter((x) => x.entry?.done && x.entry.artifact);
}

/** The Book Studio spec (src/book/handoff.js) for a finished `book` mission: its respond texts, then the clues. */
export function bookSpec(world, mission, band, entry, { lang = "en" } = {}) {
  const scenes = scenesOf(mission, band);
  const pick = (o) => (lang === "es" ? o?.es || o?.en : o?.en) || "";
  const pages = respondTexts(scenes, entry).map((t) => ({
    heading: pick(t.prompt).slice(0, 90),
    text: t.text,
    art: world.theme?.hero?.[0],
  }));
  const clues = collectedClues(scenes, entry);
  if (clues.length)
    pages.push({
      heading: lang === "es" ? "Las pistas que reuní" : "The clues I collected",
      text: clues.map((c) => `• ${c.text.en}`).join("\n"),
      art: "obj-magnifier",
    });
  return {
    source: {
      kind: "world",
      id: `adventures:${world.id}:${mission.id}`,
      label: pick(mission.title),
    },
    title: pick(mission.book?.title || mission.title).slice(0, 80),
    templateId: mission.book?.templateId,
    band: bandOf(band),
    pages,
  };
}

/**
 * The clues a respond scene's evidenceFrom: "clues" draws on: the relevant clues kept in this mission; a mission with no
 * clues scene of its own (a final demonstration, say) draws on the clues kept in the world's other missions.
 */
export function evidenceClues(world, mission, band, progress, entry) {
  const scenes = scenesOf(mission, band);
  if (scenes.some((s) => s.kind === "clues")) return collectedClues(scenes, entry);
  return world.missions
    .filter((m) => m !== mission)
    .flatMap((m) => collectedClues(scenesOf(m, band), peekEntry(progress, world.id, bandOf(band), m.id)));
}

/** Re-run a respond check with the clues the learner collected. */
export const runRespond = (world, mission, band, progress, entry, index, text) =>
  checkRespond(text, scenesOf(mission, band)[index].check || {}, evidenceClues(world, mission, band, progress, entry));
