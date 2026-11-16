// Book Studio 2.0 · the story layer on top of the one document model: Character DNA, scene actions (deterministic
// animation), reader choices with state, story validators and the bounded "Direct this scene" command interpreter.
// Pure (no DOM, no storage). The same structured story drives the illustrated book, narrated book, interactive book,
// animated presentation, comic, reader's theater and playable adventure; nothing here is a second storage format.
import { plainText } from "./model.js";

const rnd = () => Math.random().toString(36).slice(2, 8);
const nid = (p) => `${p}${Date.now().toString(36)}${rnd()}`;
const str = (v, max = 200) => String(v ?? "").slice(0, max);
const num = (n, lo, hi, fb) =>
  Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : fb;
const idOk = (v) => /^[a-z0-9]{4,40}$/i.test(v || "");

// ── Character DNA ──────────────────────────────────────────────────────────────
export const EXPRESSIONS = Object.freeze([
  "neutral",
  "happy",
  "worried",
  "surprised",
  "angry",
  "sad",
  "thinking",
]);
export const EXPRESSION_LABEL = Object.freeze({
  neutral: ["Calm", "Tranquilo"],
  happy: ["Happy", "Feliz"],
  worried: ["Worried", "Preocupado"],
  surprised: ["Surprised", "Sorprendido"],
  angry: ["Angry", "Enojado"],
  sad: ["Sad", "Triste"],
  thinking: ["Thinking", "Pensando"],
});

export function normalizeCharacter(raw = {}) {
  const poses = {};
  for (const e of EXPRESSIONS) {
    const v = raw.poses?.[e];
    if (/^[a-z0-9-]{2,40}$/.test(v || "")) poses[e] = v;
  }
  return {
    id: idOk(raw.id) ? raw.id : nid("ch"),
    name: str(raw.name, 40) || "Character",
    appearance: str(raw.appearance, 300),
    art: /^[a-z0-9-]{2,40}$/.test(raw.art || "") ? raw.art : "",
    media: str(raw.media, 60), // a student's own uploaded picture or drawing (stays on the device)
    poses,
    expression: EXPRESSIONS.includes(raw.expression) ? raw.expression : "neutral",
    traits: (Array.isArray(raw.traits) ? raw.traits : []).slice(0, 6).map((t) => str(t, 30)),
    role: str(raw.role, 80),
    relationships: (Array.isArray(raw.relationships) ? raw.relationships : [])
      .slice(0, 8)
      .map((r) => ({
        charId: str(r?.charId, 40),
        label: str(r?.label, 60),
      })),
    voice: {
      media: str(raw.voice?.media, 60), // a recorded voice
      rate: num(raw.voice?.rate, 0.6, 1.6, 1),
      pitch: num(raw.voice?.pitch, 0.5, 1.8, 1),
      uri: str(raw.voice?.uri, 120),
    },
    can: (Array.isArray(raw.can)
      ? raw.can
      : ["walk", "turn", "look", "wave", "jump", "appear", "disappear", "speak", "expression"]
    )
      .filter((a) => ACTION_TYPES.includes(a))
      .slice(0, 16),
    notes: str(raw.notes, 300),
  };
}

/** Where a character shows up: pages, spoken lines. Derived from the book, never stored twice. */
export function characterStory(book, charId) {
  const pages = [];
  const lines = [];
  (book.pages || []).forEach((p, i) => {
    const mine = (p.elements || []).filter((e) => e.charId === charId || e.speaker === charId);
    if (mine.length) pages.push(i + 1);
    for (const e of mine)
      if (e.type === "bubble" && plainText(e.html))
        lines.push({ page: i + 1, text: plainText(e.html) });
  });
  return { pages, lines };
}

/** The art key to show for a character right now (its pose for the expression, or its fixed default art). */
export const characterArt = (ch, expression) => ch.poses?.[expression || ch.expression] || ch.art;

/** Re-point every placed copy of a character at its current default art: one character, one look, on every page. */
export function syncCharacter(book, charId) {
  const ch = (book.characters || []).find((c) => c.id === charId);
  if (!ch) return 0;
  let n = 0;
  for (const p of book.pages)
    for (const e of p.elements)
      if (e.charId === charId && e.type === "art") {
        const key = characterArt(ch, e.expression || ch.expression);
        if (key && e.art !== key) {
          e.art = key;
          n++;
        }
      }
  return n;
}

// ── Scene actions: deterministic, editable, no video ───────────────────────────
export const ACTION_TYPES = Object.freeze([
  "walk",
  "run",
  "turn",
  "look",
  "point",
  "jump",
  "wave",
  "appear",
  "disappear",
  "expression",
  "speak",
  "pause",
  "zoom",
  "pan",
  "fade",
  "sound",
]);
export const ACTION_LABEL = Object.freeze({
  walk: ["Walk", "Caminar"],
  run: ["Run", "Correr"],
  turn: ["Turn", "Girar"],
  look: ["Look", "Mirar"],
  point: ["Point", "Señalar"],
  jump: ["Jump", "Saltar"],
  wave: ["Wave", "Saludar"],
  appear: ["Appear", "Aparecer"],
  disappear: ["Disappear", "Desaparecer"],
  expression: ["Change expression", "Cambiar expresión"],
  speak: ["Speak", "Hablar"],
  pause: ["Pause", "Pausa"],
  zoom: ["Zoom camera", "Acercar cámara"],
  pan: ["Pan camera", "Mover cámara"],
  fade: ["Fade", "Desvanecer"],
  sound: ["Sound", "Sonido"],
});
export const CAMERA_ACTIONS = new Set(["zoom", "pan"]);
export const MOVE_ACTIONS = new Set(["walk", "run"]);
export const SOUNDS = Object.freeze(["door", "footsteps", "chime", "whoosh", "creak"]);
export const LIMITS = Object.freeze({
  actions: 40,
  durationMs: 20000,
  choices: 6,
  characters: 24,
  items: 24,
  vars: 12,
});
const DEFAULT_DUR = {
  walk: 1600,
  run: 900,
  turn: 300,
  look: 500,
  point: 600,
  jump: 600,
  wave: 900,
  appear: 500,
  disappear: 500,
  expression: 200,
  speak: 1600,
  pause: 600,
  zoom: 900,
  pan: 900,
  fade: 700,
  sound: 400,
};

export function normalizeAction(raw = {}) {
  const type = ACTION_TYPES.includes(raw.type) ? raw.type : "pause";
  const p = raw.params && typeof raw.params === "object" ? raw.params : {};
  const params = {};
  if (MOVE_ACTIONS.has(type)) {
    params.x = num(p.x, -50, 150, 50);
    params.y = num(p.y, -50, 150, 50);
  }
  if (type === "turn") params.dir = p.dir === "left" ? "left" : "right";
  if (type === "look")
    params.dir = ["left", "right", "up", "down"].includes(p.dir) ? p.dir : "right";
  if (type === "expression")
    params.expression = EXPRESSIONS.includes(p.expression) ? p.expression : "neutral";
  if (type === "speak") params.bubbleId = str(p.bubbleId, 40);
  if (type === "zoom") {
    params.zoom = num(p.zoom, 1, 3, 1.5);
    params.x = num(p.x, 0, 100, 50);
    params.y = num(p.y, 0, 100, 50);
  }
  if (type === "pan") {
    params.x = num(p.x, 0, 100, 50);
    params.y = num(p.y, 0, 100, 50);
  }
  if (type === "fade") params.to = num(p.to, 0, 1, 0);
  if (type === "sound") params.sound = SOUNDS.includes(p.sound) ? p.sound : "chime";
  return {
    id: idOk(raw.id) ? raw.id : nid("a"),
    type,
    target:
      CAMERA_ACTIONS.has(type) || type === "pause" || type === "sound" ? "" : str(raw.target, 40),
    t: num(raw.t, 0, LIMITS.durationMs, 0),
    dur: num(raw.dur, 0, LIMITS.durationMs, DEFAULT_DUR[type]),
    params,
  };
}

export const normalizeScene = (raw = {}) => ({
  actions: (Array.isArray(raw.actions) ? raw.actions : [])
    .slice(0, LIMITS.actions)
    .map(normalizeAction),
  ambience: ["", "dust", "rain", "fireflies", "snow"].includes(raw.ambience) ? raw.ambience : "",
  parallax: raw.parallax === true,
});

/** Timeline length in ms. */
export const sceneDuration = (scene) =>
  Math.max(0, ...(scene?.actions || []).map((a) => a.t + a.dur));

/**
 * Compile a scene into plain keyframe tracks. Pure and deterministic: the same scene always produces the same tracks,
 * so a scrubber, the reader and a test see identical results.
 * Returns { duration, tracks: [{ target, keyframes: [{offset, ...css}], delay, duration, kind }], camera: [...], speaks, sounds, expressions }
 */
export function compileScene(scene, elements = []) {
  const byId = new Map(elements.map((e) => [e.id, e]));
  const pos = new Map(elements.map((e) => [e.id, { x: e.x, y: e.y, flip: false }]));
  const tracks = [];
  const camera = [];
  const speaks = [];
  const sounds = [];
  const expressions = [];
  const actions = [...(scene?.actions || [])].sort((a, b) => a.t - b.t);
  for (const a of actions) {
    if (CAMERA_ACTIONS.has(a.type)) {
      camera.push({
        t: a.t,
        dur: a.dur,
        zoom: a.type === "zoom" ? a.params.zoom : null,
        x: a.params.x ?? 50,
        y: a.params.y ?? 50,
      });
      continue;
    }
    if (a.type === "sound") {
      sounds.push({ t: a.t, sound: a.params.sound });
      continue;
    }
    if (a.type === "pause") continue;
    const el = byId.get(a.target);
    if (!el) continue;
    const cur = pos.get(el.id);
    const base = { target: el.id, delay: a.t, duration: Math.max(1, a.dur), kind: a.type };
    if (a.type === "walk" || a.type === "run") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, left: `${cur.x}%`, top: `${cur.y}%` },
          { offset: 1, left: `${a.params.x}%`, top: `${a.params.y}%` },
        ],
      });
      cur.x = a.params.x;
      cur.y = a.params.y;
    } else if (a.type === "turn") {
      cur.flip = a.params.dir === "left";
      tracks.push({
        ...base,
        keyframes: [{ offset: 0 }, { offset: 1, scale: cur.flip ? "-1 1" : "1 1" }],
      });
    } else if (a.type === "look") {
      const r = { left: -6, right: 6, up: -3, down: 3 }[a.params.dir];
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, rotate: "0deg" },
          { offset: 0.5, rotate: `${r}deg` },
          { offset: 1, rotate: "0deg" },
        ],
      });
    } else if (a.type === "point") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, rotate: "0deg" },
          { offset: 0.4, rotate: "-8deg" },
          { offset: 1, rotate: "0deg" },
        ],
      });
    } else if (a.type === "jump") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, top: `${cur.y}%` },
          { offset: 0.5, top: `${cur.y - 8}%` },
          { offset: 1, top: `${cur.y}%` },
        ],
      });
    } else if (a.type === "wave") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, rotate: "0deg" },
          { offset: 0.25, rotate: "10deg" },
          { offset: 0.5, rotate: "-10deg" },
          { offset: 0.75, rotate: "10deg" },
          { offset: 1, rotate: "0deg" },
        ],
      });
    } else if (a.type === "appear") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ],
        from: "hidden",
      });
    } else if (a.type === "disappear") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, opacity: 1 },
          { offset: 1, opacity: 0 },
        ],
      });
    } else if (a.type === "fade") {
      tracks.push({
        ...base,
        keyframes: [
          { offset: 0, opacity: 1 },
          { offset: 1, opacity: a.params.to },
        ],
      });
    } else if (a.type === "speak") {
      speaks.push({ t: a.t, dur: a.dur, target: el.id, bubbleId: a.params.bubbleId });
    } else if (a.type === "expression") {
      expressions.push({ t: a.t, target: el.id, expression: a.params.expression });
    }
  }
  const dur = sceneDuration(scene);
  return { duration: dur, tracks, camera, speaks, sounds, expressions };
}

/** Elements that START hidden because the first thing the timeline does to them is "appear" (or a speak target bubble). */
export function initiallyHidden(scene) {
  const hidden = new Set();
  const seen = new Set();
  for (const a of [...(scene?.actions || [])].sort((x, y) => x.t - y.t)) {
    if (a.type === "speak" && a.params.bubbleId && !seen.has(a.params.bubbleId))
      hidden.add(a.params.bubbleId);
    if (!a.target || seen.has(a.target)) continue;
    seen.add(a.target);
    if (a.type === "appear") hidden.add(a.target);
  }
  return hidden;
}

// ── Choices, items and state ───────────────────────────────────────────────────
export const OPS = Object.freeze(["==", "!=", ">=", "<=", ">", "<"]);

export function normalizeChoice(raw = {}) {
  const cond = (c) =>
    c?.item
      ? { item: str(c.item, 40) }
      : {
          var: str(c?.var, 40),
          op: OPS.includes(c?.op) ? c.op : ">=",
          value: num(c?.value, -999, 999, 1),
        };
  const eff = (e) =>
    e?.give
      ? { give: str(e.give, 40) }
      : e?.take
        ? { take: str(e.take, 40) }
        : e?.add
          ? { add: str(e.add, 40), n: num(e.n, -99, 99, 1) }
          : { set: str(e?.set, 40), value: num(e?.value, -999, 999, 1) };
  return {
    id: idOk(raw.id) ? raw.id : nid("c"),
    label: str(raw.label, 120),
    to: str(raw.to, 40),
    requires: (Array.isArray(raw.requires) ? raw.requires : []).slice(0, 4).map(cond),
    effects: (Array.isArray(raw.effects) ? raw.effects : []).slice(0, 6).map(eff),
    lockedText: str(raw.lockedText, 160),
  };
}

export const normalizeItem = (raw = {}) => ({
  id: idOk(raw.id) ? raw.id : nid("it"),
  name: str(raw.name, 40) || "Item",
  art: /^[a-z0-9-]{2,40}$/.test(raw.art || "") ? raw.art : "",
  alt: str(raw.alt, 160),
});

export const normalizeStory = (raw = {}) => ({
  startPageId: str(raw.startPageId, 40),
  instructions: str(raw.instructions, 300),
  items: (Array.isArray(raw.items) ? raw.items : []).slice(0, LIMITS.items).map(normalizeItem),
  vars: (Array.isArray(raw.vars) ? raw.vars : []).slice(0, LIMITS.vars).map((v) => ({
    id: idOk(v?.id) ? v.id : nid("v"),
    name: str(v?.name, 30),
    initial: num(v?.initial, -999, 999, 0),
  })),
});

export const normalizeHotspot = (raw) =>
  raw && typeof raw === "object"
    ? {
        label: str(raw.label, 80),
        give: str(raw.give, 40), // an item the reader collects
        reveal: str(raw.reveal, 600), // the AUTHOR's explanation of why this matters
        requires: (Array.isArray(raw.requires) ? raw.requires : [])
          .slice(0, 3)
          .map((c) => ({ item: str(c?.item, 40) })),
      }
    : null;

export const initState = (book) => ({
  page: book.story?.startPageId || book.pages[0]?.id || "",
  items: [],
  vars: Object.fromEntries((book.story?.vars || []).map((v) => [v.id, v.initial])),
  visited: [],
  clues: [],
  trail: [],
});

const test = (state, c) => {
  if (c.item) return state.items.includes(c.item);
  const v = state.vars[c.var] ?? 0;
  return {
    "==": v === c.value,
    "!=": v !== c.value,
    ">=": v >= c.value,
    "<=": v <= c.value,
    ">": v > c.value,
    "<": v < c.value,
  }[c.op];
};

/** Each choice with whether the reader can take it now. Locked choices stay visible with the author's hint. */
export const choicesFor = (page, state) =>
  (page.choices || []).map((c) => ({ choice: c, open: c.requires.every((r) => test(state, r)) }));

const applyEffects = (state, effects) => {
  for (const e of effects) {
    if (e.give && !state.items.includes(e.give)) state.items.push(e.give);
    else if (e.take) state.items = state.items.filter((i) => i !== e.take);
    else if (e.add) state.vars[e.add] = (state.vars[e.add] ?? 0) + e.n;
    else if (e.set) state.vars[e.set] = e.value;
  }
};

/** Take a choice: returns a NEW state (the old one is untouched, so Back and checkpoints are trivial). */
export function takeChoice(book, state, choiceId) {
  const page = book.pages.find((p) => p.id === state.page);
  const c = page?.choices.find((x) => x.id === choiceId);
  if (!c || !choicesFor(page, state).find((x) => x.choice.id === c.id)?.open) return state;
  const next = {
    ...state,
    items: [...state.items],
    vars: { ...state.vars },
    visited: [...new Set([...state.visited, page.id])],
    clues: [...state.clues],
    trail: [...state.trail, { page: page.id, choice: c.id }],
  };
  applyEffects(next, c.effects);
  if (book.pages.some((p) => p.id === c.to)) next.page = c.to;
  return next;
}

/** Collect a hotspot's item (the clue) on the current page. */
export function collect(book, state, elementId) {
  const page = book.pages.find((p) => p.id === state.page);
  const e = page?.elements.find((x) => x.id === elementId);
  const h = e?.hotspot;
  if (!h || !h.give || state.items.includes(h.give)) return state;
  if (!h.requires.every((r) => state.items.includes(r.item))) return state;
  return { ...state, items: [...state.items, h.give], clues: [...state.clues, elementId] };
}

/** The next page when a page has no choices (a plain book keeps turning pages in order). */
export function nextLinear(book, pageId) {
  const i = book.pages.findIndex((p) => p.id === pageId);
  return i >= 0 && i + 1 < book.pages.length ? book.pages[i + 1].id : "";
}

export const isAdventure = (book) => book.pages.some((p) => p.choices?.length);

// ── Validators ─────────────────────────────────────────────────────────────────
/**
 * Authoring validators for a playable story. Returns [{ level: "error"|"warn", code, pageId, text }].
 * Errors block "ready to publish"; warnings are advice. Nothing is auto-fixed.
 */
export function validateStory(book) {
  const out = [];
  const add = (level, code, pageId, text) => out.push({ level, code, pageId: pageId || "", text });
  const pages = book.pages || [];
  const ids = new Set(pages.map((p) => p.id));
  const items = new Set((book.story?.items || []).map((i) => i.id));
  const vars = new Set((book.story?.vars || []).map((v) => v.id));
  if (!isAdventure(book)) return out;
  const startId = ids.has(book.story?.startPageId) ? book.story.startPageId : pages[0]?.id;
  // Reachability (ignoring item conditions: a locked path can still be reached by earning the item).
  const seen = new Set();
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift();
    if (!id || seen.has(id) || !ids.has(id)) continue;
    seen.add(id);
    const p = pages.find((x) => x.id === id);
    if (p.choices?.length) for (const c of p.choices) queue.push(c.to);
    else if (!p.ending) queue.push(nextLinear(book, id));
  }
  for (const p of pages)
    if (!seen.has(p.id))
      add("error", "unreachable", p.id, "No choice leads to this page. Connect it or remove it.");
  const obtainable = new Set();
  for (const p of pages) {
    for (const e of p.elements) if (e.hotspot?.give) obtainable.add(e.hotspot.give);
    for (const c of p.choices || []) for (const f of c.effects) if (f.give) obtainable.add(f.give);
  }
  let endings = 0;
  for (const p of pages) {
    if (p.ending) endings++;
    if (p.choices?.length && !plainText(p.elements.map((e) => e.html || "").join(" ")) && !p.prompt)
      add(
        "warn",
        "no-instructions",
        p.id,
        "This page has choices but no words telling the reader what to decide.",
      );
    if (p.choices?.length === 1)
      add(
        "warn",
        "single-choice",
        p.id,
        "Only one choice here. Add another path or remove the choice.",
      );
    for (const c of p.choices || []) {
      if (!c.label.trim())
        add("error", "empty-choice", p.id, "A choice has no words on its button.");
      if (!ids.has(c.to))
        add(
          "error",
          "broken-branch",
          p.id,
          `The choice “${c.label || "(empty)"}” does not lead to a page that exists.`,
        );
      for (const r of c.requires) {
        if (r.item && !items.has(r.item))
          add(
            "error",
            "bad-item",
            p.id,
            `The choice “${c.label}” needs an item that is not in the story.`,
          );
        else if (r.item && !obtainable.has(r.item))
          add(
            "error",
            "contradiction",
            p.id,
            `The choice “${c.label}” needs an item no clue or choice gives, so it can never open.`,
          );
        if (r.var && !vars.has(r.var))
          add(
            "error",
            "bad-state",
            p.id,
            `The choice “${c.label}” checks a story number that does not exist.`,
          );
      }
      for (const f of c.effects) {
        if ((f.give || f.take) && !items.has(f.give || f.take))
          add(
            "error",
            "bad-item",
            p.id,
            `The choice “${c.label}” gives or takes an item that is not in the story.`,
          );
        if ((f.add || f.set) && !vars.has(f.add || f.set))
          add(
            "error",
            "bad-state",
            p.id,
            `The choice “${c.label}” changes a story number that does not exist.`,
          );
      }
    }
    for (const e of p.elements) {
      if (e.hotspot) {
        if (!e.hotspot.label.trim())
          add(
            "warn",
            "no-alt",
            p.id,
            "A clickable object has no name. Add one so everyone can find it.",
          );
        if (e.hotspot.give && !items.has(e.hotspot.give))
          add(
            "error",
            "bad-item",
            p.id,
            "A clickable object gives an item that is not in the story.",
          );
        if (e.hotspot.give && !e.hotspot.reveal.trim())
          add(
            "error",
            "no-explanation",
            p.id,
            `“${e.hotspot.label || "This clue"}”: explain in your own words why it matters. The story moves on after your explanation.`,
          );
      }
      if ((e.type === "image" || e.type === "art") && !(e.alt || "").trim() && e.type === "image")
        add(
          "warn",
          "no-alt",
          p.id,
          "A picture has no description. Add one for readers who cannot see it.",
        );
    }
  }
  if (!endings)
    add("error", "no-ending", "", "The story has no ending. Mark at least one page as an ending.");
  const unusedItems = [...items].filter((i) => !obtainable.has(i));
  for (const i of unusedItems)
    add(
      "warn",
      "unused-item",
      "",
      `The item “${book.story.items.find((x) => x.id === i).name}” is never given to the reader.`,
    );
  return out;
}

// ── "Direct this scene": a bounded command interpreter ────────────────────────
const SKY = {
  sunset: { bg: "#f6b26b", bgArt: "" },
  night: { bg: "#1b2a5c", bgArt: "bg-night" },
  sunrise: { bg: "#ffd7a8", bgArt: "" },
  day: { bg: "#bfe3f2", bgArt: "" },
  stormy: { bg: "#7a8590", bgArt: "" },
  rainy: { bg: "#9fb3c0", bgArt: "" },
};
const WORD_NUM = { closer: 1.6, "a little closer": 1.3, farther: 1, "zoom in": 1.6, "zoom out": 1 };

/**
 * Interpret one sentence into reviewable operations. Allowed operations are fixed:
 *   { op: "action", action }  add a scene action        { op: "page", set: { bg, bgArt } }  change the sky
 *   { op: "expression", target, expression }            change a character's default look on this page
 * `ctx` = { page, characters }. Returns { ok, ops, text } or { ok: false, help }. Never executes anything.
 */
export function interpretDirection(text, ctx) {
  const q = String(text || "")
    .toLowerCase()
    .trim();
  const page = ctx.page;
  const chars = ctx.characters || [];
  const placed = page.elements.filter((e) => e.type === "art" || e.type === "image");
  const nameOf = (e) => (chars.find((c) => c.id === e.charId)?.name || e.alt || "").toLowerCase();
  const find = (word) =>
    placed.find(
      (e) =>
        nameOf(e) &&
        (nameOf(e)
          .split(" ")
          .some((w) => w.length > 2 && word.includes(w)) ||
          word.includes(nameOf(e))),
    ) ||
    placed.find(
      (e) =>
        (e.art || "").replace(/^[a-z]+-/, "") &&
        word.includes((e.art || "").replace(/^[a-z]+-/, "")),
    );
  const lastT = Math.max(0, ...(page.scene?.actions || []).map((a) => a.t + a.dur));
  const ops = [];
  const sky =
    q.match(/(?:change|make|turn)\s+(?:the\s+)?sky\s+(?:to|into)?\s*(?:a\s+)?(\w+)/) ||
    q.match(/\bsky\b.*?\b(sunset|night|sunrise|day|stormy|rainy)\b/);
  if (sky && SKY[sky[1]]) ops.push({ op: "page", set: SKY[sky[1]] });
  const target = find(q);
  const mood =
    EXPRESSIONS.find((e) => new RegExp(`\\b${e}\\b`).test(q)) ||
    (/\bscared|afraid\b/.test(q) ? "worried" : "");
  if (/\bmove the camera|zoom|closer\b/.test(q) && !target) {
    const z = Object.entries(WORD_NUM).find(([w]) => q.includes(w));
    ops.push({
      op: "action",
      action: { type: "zoom", t: lastT, dur: 900, params: { zoom: z ? z[1] : 1.6, x: 50, y: 50 } },
    });
  }
  if (target) {
    const move = q.match(/\b(walk|run)\b/);
    if (move) {
      const toward = placed.find(
        (e) => e !== target && find(q.split(/toward|to the|towards|to /).slice(-1)[0] || "") === e,
      );
      const dir = /left/.test(q) ? -1 : /right/.test(q) ? 1 : 0;
      const x = toward
        ? toward.x
        : Math.max(0, Math.min(100 - target.w, target.x + (dir || 1) * 30));
      const y = toward ? toward.y : target.y;
      ops.push({
        op: "action",
        action: { type: move[1], target: target.id, t: lastT, params: { x, y } },
      });
    }
    for (const a of ["jump", "wave", "point", "turn", "look"])
      if (new RegExp(`\\b${a}\\b`).test(q) && !move && !(a === "look" && mood))
        ops.push({
          op: "action",
          action: {
            type: a,
            target: target.id,
            t: lastT,
            params:
              a === "turn"
                ? { dir: /left/.test(q) ? "left" : "right" }
                : { dir: /left/.test(q) ? "left" : "right" },
          },
        });
    if (/\bappear|enter\b/.test(q))
      ops.push({ op: "action", action: { type: "appear", target: target.id, t: lastT } });
    if (/\bdisappear|exit|leave\b/.test(q))
      ops.push({ op: "action", action: { type: "disappear", target: target.id, t: lastT } });
    if (mood && /look|feel|seem|be\b|make/.test(q))
      ops.push({
        op: "action",
        action: { type: "expression", target: target.id, t: lastT, params: { expression: mood } },
      });
    const bubble = page.elements.find(
      (e) =>
        e.type === "bubble" &&
        (e.speaker === target.charId || (!e.speaker && e.charId === undefined)),
    );
    if (/\b(whisper|say|speak|shout|tell)\b/.test(q) && bubble)
      ops.push({
        op: "action",
        action: { type: "speak", target: target.id, t: lastT, params: { bubbleId: bubble.id } },
      });
  } else if (!ops.length)
    return {
      ok: false,
      help: "I could not find who to direct. Name a character on this page, for example: “Make the fox look worried.”",
    };
  if (!ops.length)
    return {
      ok: false,
      help: "Try: walk, run, jump, wave, look worried, appear, whisper, change the sky to sunset, or move the camera closer.",
    };
  const clean = validateOps(ops, page);
  return clean.length
    ? { ok: true, ops: clean, text: describeOps(clean, page, chars) }
    : { ok: false, help: "That change would not apply to anything on this page." };
}

/** The ONLY gate between a command and the page: unknown ops, targets or fields are dropped, numbers are clamped. */
export function validateOps(ops, page) {
  const ids = new Set(page.elements.map((e) => e.id));
  const out = [];
  for (const o of (Array.isArray(ops) ? ops : []).slice(0, 8)) {
    if (o?.op === "page" && o.set && typeof o.set === "object") {
      const bg = /^#[0-9a-f]{3,8}$/i.test(o.set.bg || "") ? o.set.bg : "";
      const bgArt = /^[a-z0-9-]{2,40}$/.test(o.set.bgArt || "") ? o.set.bgArt : "";
      if (bg) out.push({ op: "page", set: { bg, bgArt } });
    } else if (o?.op === "action" && o.action && ACTION_TYPES.includes(o.action.type)) {
      const a = normalizeAction(o.action);
      if (a.target && !ids.has(a.target)) continue;
      if (a.params.bubbleId && !ids.has(a.params.bubbleId)) continue;
      out.push({ op: "action", action: a });
    }
  }
  return out;
}

export function describeOps(ops, page, chars = []) {
  const name = (id) => {
    const e = page.elements.find((x) => x.id === id);
    return chars.find((c) => c.id === e?.charId)?.name || e?.alt || "the picture";
  };
  return ops
    .map((o) =>
      o.op === "page"
        ? `Change the background colour on this page.`
        : o.action.type === "expression"
          ? `${name(o.action.target)} looks ${o.action.params.expression}.`
          : CAMERA_ACTIONS.has(o.action.type)
            ? `The camera ${o.action.type === "zoom" ? "zooms" : "pans"}.`
            : `${name(o.action.target)}: ${ACTION_LABEL[o.action.type][0].toLowerCase()}.`,
    )
    .join(" ");
}

/** Apply validated ops to a page (the caller commits so Undo works). */
export function applyOps(page, ops) {
  page.scene = page.scene || { actions: [], ambience: "", parallax: false };
  for (const o of ops) {
    if (o.op === "page") {
      page.bg = o.set.bg;
      if (o.set.bgArt) page.bgArt = o.set.bgArt;
      else if (o.set.bg) page.bgArt = "";
    } else page.scene.actions.push(normalizeAction(o.action));
  }
  page.scene.actions = page.scene.actions.slice(0, LIMITS.actions);
}

// ── Story-to-everything: presentation modes over ONE document ─────────────────
export const CREATION_MODES = Object.freeze([
  {
    id: "story",
    en: "Create a Story",
    es: "Crear un cuento",
    icon: "book",
    kind: "picture",
    blurb: ["An illustrated or informational book", "Un libro ilustrado o informativo"],
  },
  {
    id: "adventure",
    en: "Make an Adventure",
    es: "Hacer una aventura",
    icon: "star",
    kind: "narrative",
    blurb: [
      "Readers make choices that change the story",
      "Los lectores eligen y cambian el cuento",
    ],
  },
  {
    id: "comic",
    en: "Create a Comic",
    es: "Crear un cómic",
    icon: "speaking",
    kind: "comic",
    blurb: ["Panels, characters and speech bubbles", "Viñetas, personajes y globos"],
  },
  {
    id: "movie",
    en: "Make a Story Movie",
    es: "Hacer una película",
    icon: "play",
    kind: "audio",
    blurb: ["Animated scenes with narration", "Escenas animadas con narración"],
  },
]);

/** How the same book reads in each presentation, and what a mode cannot carry (never silently dropped). */
export function presentationReport(book, mode) {
  const notes = [];
  const adv = isAdventure(book);
  const anim = book.pages.some((p) => p.scene?.actions?.length);
  if (mode === "illustrated" || mode === "print") {
    if (adv)
      notes.push(
        "Reader choices become a list of pages; branches cannot be followed on paper. The choices stay in the book.",
      );
    if (anim) notes.push("Animation does not play in print. Each scene shows its final pose.");
  }
  if (mode === "comic" && anim) notes.push("Animation is shown as a still frame per panel.");
  if (mode === "readersTheater")
    notes.push("Dialogue bubbles become the script; narration stays as stage directions.");
  return notes;
}

/** A reader's-theater script from the same pages: speakers from bubbles, narration from text. */
export function theaterScript(book) {
  const chars = new Map((book.characters || []).map((c) => [c.id, c.name]));
  const lines = [];
  book.pages.forEach((p, i) => {
    for (const e of p.elements) {
      const t = plainText(e.html || "");
      if (!t) continue;
      if (e.type === "bubble")
        lines.push({
          page: i + 1,
          who: chars.get(e.speaker) || chars.get(e.charId) || "Speaker",
          text: t,
          direction: false,
        });
      else if (e.type === "text")
        lines.push({ page: i + 1, who: "Narrator", text: t, direction: true });
    }
  });
  return lines;
}

/**
 * The structure (and only the structure) of a branching story: a start page with two choices, two paths and an ending.
 * Choice buttons start empty and the story check says so, so the author writes every word.
 */
export function adventureSkeleton(book, makePageFn) {
  const mk = (props = {}) => makePageFn({ bg: "#fffaf0", ...props });
  const start = mk({ prompt: { en: "Where does the story begin? What can the reader decide?", es: "¿Dónde empieza el cuento? ¿Qué puede decidir el lector?" } });
  const a = mk();
  const b = mk();
  const end = mk({ ending: "good" });
  start.choices = [
    { id: nid("c"), label: "", to: a.id, requires: [], effects: [], lockedText: "" },
    { id: nid("c"), label: "", to: b.id, requires: [], effects: [], lockedText: "" },
  ].map(normalizeChoice);
  a.choices = [{ id: nid("c"), label: "", to: end.id, requires: [], effects: [], lockedText: "" }].map(normalizeChoice);
  b.choices = [{ id: nid("c"), label: "", to: end.id, requires: [], effects: [], lockedText: "" }].map(normalizeChoice);
  book.pages = [book.pages[0], start, a, b, end];
  book.story = normalizeStory({ ...book.story, startPageId: start.id });
  return book;
}
