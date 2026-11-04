// Active Listening Laboratory — pure logic (no DOM, no storage). UI: src/journey/ui/listen.js.
// Contract: access-practice-lab/JOURNEY.md ("ListenTask"). A learner hears a short script one sentence at a time and
// places cards (arrange / place / sort / follow). Wrong placements get graduated repair: replay -> signal word ->
// visual clue. Independent attempts get "Listen again" and "Try another place" only: no text, no visual, no x-ray.
import { findPhrase } from "../../lang/text.js";

export const MODES = ["arrange", "place", "sort", "follow"];
export const HELP_IDS = ["transcript", "xray", "signal", "visual"];
const LOG_MAX = 60;

export const hasFinal = (task) => Boolean(task?.final && typeof task.final === "object");

/** The task a part actually plays. The final check carries its own script and never shows supports. */
export function resolveTask(task, { final = false } = {}) {
  if (!final) return task;
  if (!hasFinal(task)) throw new Error("listen: this task has no final check");
  const { final: f, visuals: _v, xray: _x, grid, ...base } = task;
  const merged = { ...base, ...f, visuals: f.visuals ?? {}, xray: f.xray ?? {} };
  if (merged.mode === "place") merged.grid = f.grid ?? grid;
  return merged;
}

const asTask = (task, state) => resolveTask(task, { final: Boolean(state?.final) });

/** Throws a descriptive Error for any task the engine cannot score unambiguously. */
export function validateTask(task) {
  const fail = (msg) => {
    throw new Error(`listen task "${task?.title ?? "(untitled)"}": ${msg}`);
  };
  if (!MODES.includes(task?.mode)) fail(`mode must be one of ${MODES.join(", ")} (got "${task?.mode}")`);
  const uniq = (list, what) => {
    if (!Array.isArray(list) || !list.length) fail(`${what} must be a non-empty array`);
    const ids = new Set();
    for (const row of list) {
      if (!row?.id) fail(`every ${what} entry needs an id`);
      if (ids.has(row.id)) fail(`duplicate ${what} id "${row.id}"`);
      ids.add(row.id);
    }
    return ids;
  };
  const script = uniq(task.script, "script");
  const items = uniq(task.items, "items");
  const targets = uniq(task.targets, "targets");
  if (!Array.isArray(task.expect) || !task.expect.length) fail("expect must be a non-empty array");
  const seenItems = new Set();
  const seenTargets = new Set();
  const sharedTargets = task.mode === "sort";
  for (const row of task.expect) {
    if (!items.has(row.item)) fail(`expect names unknown item "${row.item}"`);
    if (!targets.has(row.target)) fail(`expect names unknown target "${row.target}"`);
    if (!script.has(row.utterance)) fail(`expect names unknown utterance "${row.utterance}"`);
    if (seenItems.has(row.item)) fail(`expect lists item "${row.item}" twice; each item has exactly one correct place`);
    seenItems.add(row.item);
    if (!sharedTargets) {
      if (seenTargets.has(row.target))
        fail(`expect gives target "${row.target}" to two items; ${task.mode} mode needs unique targets to define one correct order`);
      seenTargets.add(row.target);
    }
  }
  for (const key of Object.keys(task.visuals || {})) if (!script.has(key)) fail(`visuals names unknown utterance "${key}"`);
  if (task.mode === "place") {
    const { cols, rows } = task.grid || {};
    if (!(cols > 0 && rows > 0)) fail("place mode needs grid { cols, rows }");
    if (cols * rows !== task.targets.length) fail(`grid ${cols}x${rows} needs ${cols * rows} targets (got ${task.targets.length})`);
  }
  return task;
}

const pushLog = (log, entry) => [...(log || []), entry].slice(-LOG_MAX);

/** Fresh state for part 1 (default) or the independent final check (`final: true`). */
export function init(task, { final = false } = {}) {
  const t = validateTask(resolveTask(task, { final }));
  return {
    final,
    mode: t.mode,
    targets: t.targets.map((x) => x.id),
    placed: Object.fromEntries(t.items.map((i) => [i.id, null])),
    tries: {},
    replays: {},
    attempts: {},
    selected: null,
    log: [],
  };
}

export const select = (state, itemId) => {
  if (itemId !== null && !(itemId in state.placed)) throw new Error(`listen: unknown item "${itemId}"`);
  return { ...state, selected: itemId === state.selected ? null : itemId };
};

/** Cards currently on a target, in item order. */
export const itemsIn = (state, targetId) => Object.keys(state.placed).filter((id) => state.placed[id] === targetId);

/**
 * Put a card on a target (null = back to the tray). Sort bins hold any number; every other target holds one,
 * so placing onto an occupied target sends the old card back to the tray.
 */
export function place(state, itemId, targetId) {
  if (!(itemId in state.placed)) throw new Error(`listen: unknown item "${itemId}"`);
  if (targetId !== null && !state.targets.includes(targetId)) throw new Error(`listen: unknown target "${targetId}"`);
  const placed = { ...state.placed };
  if (targetId !== null && state.mode !== "sort") {
    for (const other of itemsIn(state, targetId)) if (other !== itemId) placed[other] = null;
  }
  placed[itemId] = targetId;
  return { ...state, placed, selected: null, log: pushLog(state.log, { a: "place", item: itemId, target: targetId }) };
}

/** Lift a placed card so it can be moved: it returns to the tray and stays selected. */
export const pickUp = (state, itemId) => ({ ...place(state, itemId, null), selected: itemId });

export const noteReplay = (state, utteranceId) => ({
  ...state,
  replays: { ...state.replays, [utteranceId]: (state.replays[utteranceId] || 0) + 1 },
});

/** Expected cards that are not on any target yet. */
export function unplaced(task, state) {
  const t = asTask(task, state);
  return t.expect.filter((r) => state.placed[r.item] === null).map((r) => r.item);
}

/** Pure scoring. A card that has no expected place (a distractor) is wrong wherever it is placed. */
export function check(task, state) {
  const t = asTask(task, state);
  const results = t.expect.map((r) => ({
    item: r.item,
    target: r.target,
    utterance: r.utterance,
    ok: state.placed[r.item] === r.target,
  }));
  const expected = new Set(t.expect.map((r) => r.item));
  for (const item of t.items) {
    if (!expected.has(item.id) && state.placed[item.id] !== null)
      results.push({ item: item.id, target: null, utterance: null, ok: false });
  }
  return { results, allCorrect: results.every((r) => r.ok), firstWrong: results.find((r) => !r.ok) || null };
}

/**
 * Press "Check my work". Not ready (cards still in the tray) changes nothing and costs no try. Otherwise each wrong
 * card gains one try, but only when it sits somewhere different from the last time it was checked.
 */
export function submit(task, state) {
  const missing = unplaced(task, state);
  const result = check(task, state);
  if (missing.length) return { state, result, ready: false, missing };
  const tries = { ...state.tries };
  for (const r of result.results) {
    if (!r.ok && state.attempts[r.item] !== state.placed[r.item]) tries[r.item] = (tries[r.item] || 0) + 1;
  }
  const wrong = result.results.filter((r) => !r.ok).length;
  const next = { ...state, tries, attempts: { ...state.placed }, selected: null, log: pushLog(state.log, { a: "check", wrong }) };
  return { state: next, result, ready: true, missing: [] };
}

/**
 * Graduated repair for one wrong card. Attempt 1: replay its sentence. 2: also name its signal word.
 * 3 and later: also its visual. Another try is always allowed. Independent: no sentence, no signal, no visual.
 */
export function feedbackFor(task, state, itemId, { independent = false } = {}) {
  const t = asTask(task, state);
  const n = state.tries[itemId] || 0;
  if (!n) return null;
  const base = { item: itemId, attempt: n, canTryAgain: true };
  if (independent || state.final)
    return { ...base, level: 0, kind: "independent", utterance: null, text: null, signal: null, visual: null, actions: ["listen-again", "try-another"] };
  const row = t.expect.find((r) => r.item === itemId);
  const u = row && t.script.find((s) => s.id === row.utterance);
  const level = Math.min(n, 3);
  return {
    ...base,
    level,
    kind: ["replay", "signal", "visual"][level - 1],
    utterance: u?.id ?? null,
    text: u?.text ?? null,
    signal: level >= 2 ? (u?.signal ?? null) : null,
    visual: level >= 3 ? ((u && t.visuals?.[u.id]) ?? null) : null,
    actions: ["replay", ...(level >= 2 ? ["signal"] : []), ...(level >= 3 ? ["visual"] : []), "try-another"],
  };
}

/** The part is finished when every expected card is on its correct target. */
export function doneCriteria(task, state) {
  const t = asTask(task, state);
  const { results, allCorrect } = check(task, state);
  const tries = Object.values(state.tries).reduce((a, b) => a + b, 0);
  const replays = Object.values(state.replays).reduce((a, b) => a + b, 0);
  return {
    met: allCorrect && unplaced(task, state).length === 0,
    correct: results.filter((r) => r.ok && r.target !== null).length,
    total: t.expect.length,
    wrong: results.filter((r) => !r.ok).map((r) => r.item),
    unplaced: unplaced(task, state),
    tries,
    replays,
  };
}

// ---- Listening X-Ray ------------------------------------------------------------------------------------------

export const LAYER_META = {
  keywords: ["Key words", "Palabras clave"],
  sequence: ["Order words", "Palabras de orden"],
  cause: ["Cause and effect", "Causa y efecto"],
  speakers: ["Who is talking", "Quién habla"],
  referents: ["What it means", "A qué se refiere"],
};
const LAYER_PRIORITY = ["keywords", "sequence", "cause", "speakers", "referents"];

/**
 * Overlay layers for the optional Listening X-Ray: { id, label: [en, es], marks: { [utteranceId]: [{start,end,text,kind,note?}] } }.
 * Empty layers are dropped. The final check has none by definition.
 */
export function xrayLayers(task, { final = false } = {}) {
  if (final) return [];
  const t = resolveTask(task);
  const x = t.xray || {};
  const out = [];
  const addWords = (id, words) => {
    const marks = {};
    for (const u of t.script)
      for (const w of new Set(words)) {
        for (const m of findPhrase(u.text, w)) (marks[u.id] ||= []).push({ start: m.start, end: m.end, text: m.text, kind: id });
      }
    return marks;
  };
  const claimed = new Set([...(x.sequence || []), ...(x.cause || [])].map((w) => w.toLowerCase()));
  const signals = t.script.map((u) => u.signal).filter((s) => s && !claimed.has(s.toLowerCase()));
  const push = (id, marks) => Object.keys(marks).length && out.push({ id, label: LAYER_META[id], marks });
  push("keywords", addWords("keywords", [...(x.keywords || []), ...signals]));
  push("sequence", addWords("sequence", x.sequence || []));
  push("cause", addWords("cause", x.cause || []));
  const speakerMarks = {};
  let prev = null;
  for (const u of t.script) {
    if (u.speaker && u.speaker !== prev)
      speakerMarks[u.id] = [{ start: 0, end: 0, text: "", kind: "speakers", note: u.speaker }];
    if (u.speaker) prev = u.speaker;
  }
  push("speakers", speakerMarks);
  const refMarks = {};
  for (const r of x.referents || [])
    for (const u of t.script)
      for (const m of findPhrase(u.text, r.phrase)) (refMarks[u.id] ||= []).push({ start: m.start, end: m.end, text: m.text, kind: "referents", note: r.means });
  push("referents", refMarks);
  return out;
}

/**
 * Split a sentence into runs for rendering overlays: [{ text, kind|null, note? }]. Overlaps resolve by layer
 * priority; a zero-width mark (speaker change) becomes a run with empty text and a note.
 */
export function segments(text, marks = []) {
  const str = String(text);
  const cover = new Array(str.length).fill(null);
  const ranked = [...marks].filter((m) => m.end > m.start).sort((a, b) => LAYER_PRIORITY.indexOf(a.kind) - LAYER_PRIORITY.indexOf(b.kind));
  for (const m of ranked) for (let i = m.start; i < m.end && i < str.length; i++) cover[i] = m;
  const runs = [];
  let start = 0;
  for (let i = 1; i <= str.length; i++) {
    if (i === str.length || cover[i] !== cover[start]) {
      const m = cover[start];
      runs.push({ text: str.slice(start, i), kind: m?.kind ?? null, note: m?.note ?? null });
      start = i;
    }
  }
  const badges = marks.filter((m) => m.end <= m.start).map((m) => ({ text: "", kind: m.kind, note: m.note }));
  return [...badges, ...(str.length ? runs : [])];
}

/** Wrap one signal word of a sentence: [{ text, signal: bool }]. No signal or no match returns one plain run. */
export function highlightSignal(text, signal) {
  const hit = signal ? findPhrase(text, signal)[0] : null;
  if (!hit) return [{ text: String(text), signal: false }];
  return [
    { text: text.slice(0, hit.start), signal: false },
    { text: text.slice(hit.start, hit.end), signal: true },
    { text: text.slice(hit.end), signal: false },
  ].filter((r) => r.text);
}

const COMPASS = { north: "N", south: "S", east: "E", west: "W", center: "C", centre: "C", middle: "C" };
/** "Northeast" -> "NE", "Center" -> "C"; null when the label is not a compass position. */
export function compassHint(label) {
  const words = String(label).toLowerCase().replace(/[-\s]+/g, " ").trim().split(" ");
  if (words.length === 1) {
    const m = words[0].match(/^(north|south)(east|west)$/);
    if (m) return COMPASS[m[1]] + COMPASS[m[2]];
  }
  if (words.length === 2 && COMPASS[words[0]] && COMPASS[words[1]] && "ns".includes(COMPASS[words[0]].toLowerCase()))
    return COMPASS[words[0]] + COMPASS[words[1]];
  return words.length === 1 && COMPASS[words[0]] ? COMPASS[words[0]] : null;
}

// ---- Evidence ledger ------------------------------------------------------------------------------------------

const LEDGER_SUPPORT = { xray: "coach", transcript: "hint", signal: "hint", visual: "hint" };
export const supportFlags = (helps = []) => {
  const flags = {};
  for (const id of helps) if (LEDGER_SUPPORT[id]) flags[LEDGER_SUPPORT[id]] = true;
  return flags;
};

/**
 * Partial ledger entry for one finished part (`src/lang/ledger.js` fills the rest). Part 1 is kind "first",
 * part 2 is the "transfer" check. It claims "independent" only when no help was opened.
 */
export function ledgerEntry({ missionId, band, klu, part = 1, correct, total, tries = 0, replays = 0, helps = [], independent = false }) {
  const supports = supportFlags(helps);
  const used = Object.keys(supports).length > 0;
  return {
    src: "mission",
    task: `${missionId}.understand`,
    band,
    domain: "Listening",
    use: klu,
    stage: !used && (part === 2 || independent) ? "independent" : "supported",
    kind: part === 2 ? "transfer" : "first",
    attempt: `listen-part-${part}`,
    supports,
    m: { listen: { correct, total, tries, replays } },
  };
}
