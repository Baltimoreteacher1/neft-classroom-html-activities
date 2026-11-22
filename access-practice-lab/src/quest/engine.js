// Language Quest engine: pure, deterministic logic with no DOM and no storage, so every rule can be tested in node.
//
// Nothing here understands free text. Writing checks are lexical and structural (word counts, named clue terms, sentence
// and quotation shape, connector words). Callers label them "checklist", never "correct", and let the learner mark a
// check as met when the wording differs (see checkWriting `override`). No speech or proficiency claim is made anywhere.

// ── support ladder ───────────────────────────────────────────────────────────────────────────────────────────────
/** Most support first. A learner may pick any rung; fading only ever *suggests* the next one down. */
export const RUNGS = ["model", "frame", "partial", "cue", "independent"];
export const rungIndex = (r) => Math.max(0, RUNGS.indexOf(r));
export const RUNG_COPY = {
  model: { en: "Picture, words and a model", es: "Imagen, palabras y un modelo" },
  frame: { en: "Full sentence frame", es: "Marco de oración completo" },
  partial: { en: "Partial frame", es: "Marco parcial" },
  cue: { en: "One cue", es: "Una pista" },
  independent: { en: "On my own", es: "Por mi cuenta" },
};

// ── text helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
export const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean);
export const wordCount = (t) => words(t).length;
const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9'’\s-]/g, " ").replace(/\s+/g, " ").trim();
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A term matches at the start of a word, so "footprint" finds "footprints" and "footprint's". */
export const hasTerm = (text, term) => new RegExp(`(^|[^a-z0-9])${reEsc(norm(term))}`).test(norm(text));
export const termsFound = (text, terms = []) => terms.filter((t) => hasTerm(text, t));
export const sentences = (t) => String(t || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => /[a-z0-9]/i.test(s));

/**
 * Evaluate a writing checklist. `ctx.clueTerms` maps a collected clue id to the words that name it, so "cites two clues"
 * means two of THIS learner's collected clues were named. `override` is the set of check ids the learner marked met
 * themselves; those count as met and are reported as self-declared, because a lexical check can miss a valid wording.
 */
export function checkWriting(text, checks = [], ctx = {}, override = []) {
  const t = String(text || "");
  return checks.map((c) => {
    let found = [];
    let met = false;
    if (c.kind === "words") met = wordCount(t) >= (c.min || 1);
    else if (c.kind === "sentences") met = sentences(t).length >= (c.min || 1);
    else if (c.kind === "any") (found = termsFound(t, c.terms)), (met = found.length >= 1);
    else if (c.kind === "all") (found = termsFound(t, c.terms)), (met = found.length === c.terms.length);
    else if (c.kind === "count") (found = termsFound(t, c.terms)), (met = found.length >= (c.min || 1));
    else if (c.kind === "quote") met = /["“][^"”]{2,}["”]/.test(t);
    else if (c.kind === "question") met = /\?\s*$/.test(t.trim()) && /\b(who|what|when|where|why|how|which|did|do|does|is|are|was|were|can|could|would)\b/i.test(t);
    else if (c.kind === "avoid") (found = termsFound(t, c.terms)), (met = found.length === 0 && wordCount(t) > 0);
    else if (c.kind === "clues") {
      const named = Object.entries(ctx.clueTerms || {}).filter(([, terms]) => termsFound(t, terms).length);
      found = named.map(([id]) => id);
      met = found.length >= (c.min || 1);
    } else if (c.kind === "picked") {
      // ctx.pickedTerms = [[terms naming choice 1], [terms naming choice 2], ...]: how many of the learner's own choices were named
      const named = (ctx.pickedTerms || []).filter((ts) => termsFound(t, ts).length);
      found = named.map((ts) => ts[0]);
      met = named.length >= (c.min || 1);
    } else if (c.kind === "distinct") {
      const n = new Set(norm(t).split(" ")).size;
      met = n >= (c.min || 1);
    }
    const selfDeclared = !met && override.includes(c.id);
    return { id: c.id, label: c.label, required: c.required !== false, met: met || selfDeclared, selfDeclared, found, hint: c.hint };
  });
}
export const requiredMet = (results) => results.filter((r) => r.required).every((r) => r.met);

/** Word-level edit distance: how many words differ between two drafts (insert, delete or change). */
export function wordDiff(a, b) {
  const x = words(norm(a));
  const y = words(norm(b));
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return d[x.length][y.length];
}
/** A revision counts only when the learner changed at least `min` words. Length alone is never the test. */
export const isRevision = (before, after, min = 3) => wordDiff(before, after) >= min;

// ── dialogue state machine ───────────────────────────────────────────────────────────────────────────────────────
/**
 * def = { start, nodes: { id: { who?, say: [string | {who,t}], options?: [...], compose?: {...}, end? } } }
 * option = { id, label, requires?: [flag], hide?: [flag], once?: bool, sets?: [flag], clue?: id, scaffold?: string, next }
 * compose = { label, checks?: [check], routes: [{ terms, next }], fallback }
 * State is plain JSON: { node, flags, asked, log }.
 */
export function dialogueStart(def) {
  const st = { node: def.start, flags: [], asked: [], log: [], gained: [] };
  pushSay(def, st, def.start);
  return st;
}
function pushSay(def, st, nodeId) {
  const n = def.nodes[nodeId];
  if (!n) throw new Error(`dialogue node "${nodeId}" is missing`);
  for (const line of n.say || []) st.log.push(typeof line === "string" ? { who: n.who || "npc", t: line } : { who: line.who || n.who || "npc", t: line.t });
  for (const f of n.sets || []) if (!st.flags.includes(f)) st.flags.push(f);
}
export function dialogueOptions(def, st) {
  const n = def.nodes[st.node];
  return (n.options || []).filter(
    (o) => (o.requires || []).every((f) => st.flags.includes(f)) && !(o.hide || []).some((f) => st.flags.includes(f)) && !(o.once && st.asked.includes(`${st.node}:${o.id}`)),
  );
}
export const dialogueEnded = (def, st) => Boolean(def.nodes[st.node].end) || (!def.nodes[st.node].options?.length && !def.nodes[st.node].compose);
/** Take a menu option. Returns a new state; an unavailable option returns the state unchanged. */
export function dialogueStep(def, st, optionId) {
  const opt = dialogueOptions(def, st).find((o) => o.id === optionId);
  if (!opt) return st;
  const next = structuredClone(st);
  next.asked.push(`${st.node}:${opt.id}`);
  next.log.push({ who: "me", t: opt.label });
  for (const f of opt.sets || []) if (!next.flags.includes(f)) next.flags.push(f);
  if (opt.clue && !next.gained.includes(opt.clue)) next.gained.push(opt.clue);
  next.node = opt.next;
  pushSay(def, next, opt.next);
  return next;
}
/** The learner's own question or message. Routing is lexical and visible: the first route whose words appear wins. */
export function dialogueCompose(def, st, text) {
  const c = def.nodes[st.node].compose;
  if (!c) return st;
  const next = structuredClone(st);
  next.log.push({ who: "me", t: text.trim() });
  const route = c.routes.find((r) => termsFound(text, r.terms).length);
  const target = route ? route.next : c.fallback;
  next.composed = (next.composed || 0) + 1;
  const cr = checkWriting(text, c.checks || [], {});
  next.composedMet = (next.composedMet || 0) + (requiredMet(cr) ? 1 : 0);
  if (route?.clue && !next.gained.includes(route.clue)) next.gained.push(route.clue);
  for (const f of route?.sets || []) if (!next.flags.includes(f)) next.flags.push(f);
  next.node = target;
  pushSay(def, next, target);
  return next;
}
/** Every node reachable and every referenced flag settable: used by the mission validator. */
export function dialogueProblems(def) {
  const out = [];
  if (!def?.nodes?.[def.start]) return ["start node missing"];
  const setFlags = new Set();
  for (const n of Object.values(def.nodes)) {
    for (const f of n.sets || []) setFlags.add(f);
    for (const o of n.options || []) for (const f of o.sets || []) setFlags.add(f);
    for (const r of n.compose?.routes || []) for (const f of r.sets || []) setFlags.add(f);
  }
  const seen = new Set();
  const walk = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = def.nodes[id];
    if (!n) return out.push(`node "${id}" referenced but missing`);
    for (const o of n.options || []) {
      walk(o.next);
      for (const f of o.requires || []) if (!setFlags.has(f)) out.push(`flag "${f}" is required but never set`);
    }
    for (const r of n.compose?.routes || []) walk(r.next);
    if (n.compose) walk(n.compose.fallback);
  };
  walk(def.start);
  for (const id of Object.keys(def.nodes)) if (!seen.has(id)) out.push(`node "${id}" is unreachable`);
  return [...new Set(out)];
}

// ── sort and compare items ───────────────────────────────────────────────────────────────────────────────────────
/** placed = { cardId: categoryId }. Wrong cards come back with the card's own `why` rule hint, never the right category. */
export function checkSort(item, placed) {
  const rows = item.cards.map((c) => ({ id: c.id, placed: placed[c.id] || null, ok: placed[c.id] === c.cat, hint: c.why }));
  return { rows, allPlaced: rows.every((r) => r.placed), correct: rows.filter((r) => r.ok).length, done: rows.every((r) => r.ok) };
}
/** ratings = { "<optionId>.<evidenceId>": supports|contradicts|neutral }. Done when every cell is rated and enough agree. */
export function checkCompare(item, ratings, picked) {
  // `item.noKey`: the final pick is the learner's own judgement (for example which source to trust), so it needs a choice but has no key.
  const cells = item.options.flatMap((o) => item.evidence.map((e) => ({ key: `${o.id}.${e.id}`, o: o.id, e: e.id, want: item.matrix[o.id][e.id] })));
  const rated = cells.filter((c) => ratings[c.key]);
  const right = rated.filter((c) => ratings[c.key] === c.want);
  const accuracy = cells.length ? right.length / cells.length : 0;
  const recheck = rated.filter((c) => ratings[c.key] !== c.want).map((c) => c.e);
  return { total: cells.length, rated: rated.length, right: right.length, accuracy, recheck: [...new Set(recheck)], done: rated.length === cells.length && accuracy >= (item.need ?? 0.7) && Boolean(picked) };
}

// ── History Portal timeline ─────────────────────────────────────────────────────────────────────────────────────
/** order = array of event ids as the learner arranged them. Misplaced events return their own `why` hint, not the answer. */
export function checkTimeline(item, order) {
  const want = [...item.events].sort((a, b) => a.order - b.order).map((e) => e.id);
  const rows = order.map((id, i) => ({ id, ok: want[i] === id, hint: item.events.find((e) => e.id === id)?.why }));
  return { rows, correct: rows.filter((r) => r.ok).length, done: rows.length === want.length && rows.every((r) => r.ok) };
}

// ── Explorers' Guild route walker ────────────────────────────────────────────────────────────────────────────────
/**
 * grid = { w, h, start:[x,y], goal:[x,y], blocked:[[x,y]...], landmarks:{ "x,y": name } }, moves = ["N","E","S","W"].
 * The walker stops at the first illegal move and says which step failed and why. Nothing is guessed.
 */
export function walkRoute(grid, moves) {
  let [x, y] = grid.start;
  const path = [[x, y]];
  const d = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const blocked = new Set((grid.blocked || []).map((b) => b.join(",")));
  for (let i = 0; i < moves.length; i++) {
    const [dx, dy] = d[moves[i]] || [0, 0];
    const nx = x + dx;
    const ny = y + dy;
    const off = nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h;
    if (off || blocked.has(`${nx},${ny}`)) return { path, step: i + 1, failed: off ? "edge" : "blocked", at: [nx, ny], reached: false };
    [x, y] = [nx, ny];
    path.push([x, y]);
  }
  return { path, step: moves.length, failed: null, at: [x, y], reached: x === grid.goal[0] && y === grid.goal[1] };
}
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const asNum = (w) => (/^\d+$/.test(w || "") ? Number(w) : NUM[w] || 0);
const DIRS = { north: "N", south: "S", east: "E", west: "W" };
/**
 * Read compass directions out of a learner's written directions, in the order written. A number just before the direction
 * ("two steps east", "3 east") or just after it ("east 2 steps") sets how many steps; otherwise one. Relative words such as
 * left and right are not read: the checklist asks for compass words, and the walker says so when none are found.
 */
export function parseDirections(text) {
  const t = norm(text).split(" ");
  const moves = [];
  for (let i = 0; i < t.length; i++) {
    const d = DIRS[t[i]];
    if (!d) continue;
    let n = asNum(t[i - 1]) || (/^steps?$/.test(t[i - 1] || "") ? asNum(t[i - 2]) : 0) || (/^steps?$/.test(t[i + 2] || "") ? asNum(t[i + 1]) : 0) || 1;
    n = Math.min(n, 12);
    for (let k = 0; k < n; k++) moves.push(d);
  }
  return moves;
}
export const landmarksOnPath = (grid, path) => path.map((p) => grid.landmarks?.[p.join(",")]).filter(Boolean);

// ── Word Forge ───────────────────────────────────────────────────────────────────────────────────────────────────
/** parts = { prefix?, root, suffix? } -> the known word and its meaning, or null. The table is the authority. */
export function forgeWord(table, parts) {
  const key = [parts.prefix || "", parts.root || "", parts.suffix || ""].join("|");
  return table[key] || null;
}

// ── Science City model ───────────────────────────────────────────────────────────────────────────────────────────
/**
 * model = { base: {metric: n}, budget, projects: [{id, cost, effect: {metric: delta}, note}], interactions?: [...] }
 * Pure arithmetic over the table the learner can read on screen. Returns metrics, spend and whether the budget holds.
 */
export function runCityModel(model, pickedIds) {
  const picks = model.projects.filter((p) => pickedIds.includes(p.id));
  const metrics = { ...model.base };
  let spent = 0;
  for (const p of picks) {
    spent += p.cost;
    for (const [k, v] of Object.entries(p.effect)) metrics[k] = Math.round((metrics[k] + v) * 10) / 10;
  }
  for (const rule of model.interactions || []) {
    if (rule.needs.every((id) => pickedIds.includes(id)))
      for (const [k, v] of Object.entries(rule.effect)) metrics[k] = Math.round((metrics[k] + v) * 10) / 10;
  }
  return { metrics, spent, withinBudget: spent <= model.budget, picks };
}

// ── completion + endings ─────────────────────────────────────────────────────────────────────────────────────────
/** Is one item finished? `st` is that item's saved state. Clicking through never completes an item that needs work. */
export function itemDone(item, st = {}) {
  if (!st) return false;
  switch (item.kind) {
    case "explore": return Object.keys(st.marks || {}).length >= (item.need || 1);
    case "read": return (st.opened || []).length >= item.sources.length;
    case "sort": return Boolean(st.done);
    case "compare": return Boolean(st.done);
    case "ask": return item.needFlags.every((f) => (st.dialogue?.flags || []).includes(f)) && (st.dialogue?.composed || 0) >= (item.compose || 0);
    case "choose": return (st.picked || []).length >= (item.pick || 1) && (!item.reason || wordCount(st.reason) >= (item.reasonMin || 4));
    case "write": return Boolean(st.done);
    case "speak": return Boolean(st.done);
    case "check": return Boolean(st.done);
    case "story": case "forge": case "simulate": case "route": case "timeline": return Boolean(st.done);
    default: return Boolean(st.done);
  }
}
export function stageProgress(stage, run) {
  const done = stage.items.filter((it) => itemDone(it, run.items?.[it.id])).length;
  return { done, total: stage.items.length, complete: done === stage.items.length };
}
export function missionProgress(mission, run) {
  const stages = mission.stages.map((s) => ({ id: s.id, ...stageProgress(s, run || { items: {} }) }));
  const done = stages.reduce((a, s) => a + s.done, 0);
  const total = stages.reduce((a, s) => a + s.total, 0);
  return { stages, done, total, complete: stages.every((s) => s.complete) };
}
/** First ending whose conditions all hold. `when` may name chosen option ids, flags set and writing items with a revision. */
export function pickEnding(mission, run) {
  const flags = new Set(Object.values(run.items || {}).flatMap((s) => [...(s.dialogue?.flags || []), ...(s.flags || [])]));
  for (const f of run.flags || []) flags.add(f);
  const ok = (e) => {
    const w = e.when || {};
    for (const [id, opt] of Object.entries(w.choice || {})) {
      const got = run.items?.[id]?.choice ?? run.items?.[id]?.picked?.[0];
      if (Array.isArray(opt) ? !opt.includes(got) : got !== opt) return false;
    }
    for (const f of w.flags || []) if (!flags.has(f)) return false;
    for (const id of w.revised || []) if (!(run.items?.[id]?.versions?.length > 1)) return false;
    for (const [id, min] of Object.entries(w.metrics || {})) {
      const v = run.items?.[id]?.result?.metrics;
      if (!v) return false;
      for (const [k, cond] of Object.entries(min)) {
        if (cond.max != null && !(v[k] <= cond.max)) return false;
        if (cond.min != null && !(v[k] >= cond.min)) return false;
      }
    }
    return true;
  };
  return mission.endings.find(ok) || mission.endings.at(-1);
}

/** Word-level diff for the portfolio: which words of `after` are new, which words of `before` were dropped. */
const key = (w) => w.toLowerCase().replace(/[^a-z0-9'’-]/g, "");
const same = (x, y) => key(x) === key(y);
export function diffWords(before, after) {
  const a = words(before);
  const b = words(after);
  const n = a.length;
  const m = b.length;
  const L = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = same(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const left = [];
  const right = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (same(a[i], b[j])) (left.push({ w: a[i], c: false }), right.push({ w: b[j], c: false }), i++, j++);
    else if (L[i + 1][j] >= L[i][j + 1]) (left.push({ w: a[i], c: true }), i++);
    else (right.push({ w: b[j], c: true }), j++);
  }
  while (i < n) left.push({ w: a[i++], c: true });
  while (j < m) right.push({ w: b[j++], c: true });
  return { left, right };
}

// ── mission definition validator (used by tools/validate-quest.mjs and the tests) ────────────────────────────────
export const KINDS = ["explore", "read", "sort", "compare", "ask", "choose", "write", "speak", "check", "story", "forge", "simulate", "route", "timeline"];
export const STAGES = ["discover", "investigate", "communicate", "revise", "apply"];
const pair = (v, where, out, needEs = true) => {
  if (!v || typeof v.en !== "string" || !v.en.trim()) out.push(`${where}: missing English`);
  else if (needEs && (typeof v.es !== "string" || !v.es.trim())) out.push(`${where}: missing Spanish`);
};
export function validateMission(m, { worlds = [], characters = [] } = {}) {
  const out = [];
  const need = (cond, msg) => cond || out.push(msg);
  need(/^[a-z0-9-]+$/.test(m.id || ""), "id must be kebab-case");
  need(worlds.includes(m.world), `unknown world "${m.world}"`);
  need(["3-5", "6-8"].includes(m.band), "band must be 3-5 or 6-8");
  need(Array.isArray(m.domains) && m.domains.length, "domains required");
  need(Array.isArray(m.functions) && m.functions.length, "functions required");
  need(Array.isArray(m.keyUses) && m.keyUses.every((k) => ["Narrate", "Inform", "Explain", "Argue"].includes(k)) && m.keyUses.length, "keyUses must name WIDA Key Language Uses");
  need(Number(m.minutes) > 0, "minutes required");
  pair(m.title, "title", out);
  pair(m.objective, "objective", out);
  need(Array.isArray(m.success) && m.success.length >= 3, "at least 3 success criteria");
  for (const [i, s] of (m.success || []).entries()) pair(s, `success[${i}]`, out);
  need(typeof m.narrative === "string" && m.narrative.length > 40, "narrative required");
  for (const c of m.characters || []) need(characters.includes(c), `unknown character "${c}"`);
  need(m.scene?.theme && m.scene?.alt && m.scene.alt.length > 30, "scene needs a theme and a real text description");
  need(Array.isArray(m.stages) && m.stages.length >= 3, "at least 3 stages");
  const itemIds = new Set();
  let produces = 0;
  const table = {};
  for (const s of m.stages || []) for (const it of s.items || []) if (it.kind === "forge" && it.mode === "explore") Object.assign(table, it.table);
  for (const s of m.stages || []) {
    need(STAGES.includes(s.id), `stage id "${s.id}" must be one of ${STAGES.join(", ")}`);
    need(s.items?.length, `stage ${s.id} has no items`);
    for (const it of s.items || []) {
      need(KINDS.includes(it.kind), `item ${it.id}: unknown kind "${it.kind}"`);
      need(it.id && !itemIds.has(it.id), `item id "${it.id}" missing or duplicated`);
      itemIds.add(it.id);
      need(typeof it.prompt === "string" && it.prompt.length > 5, `item ${it.id}: prompt required`);
      if (["write", "speak", "story"].includes(it.kind)) produces++;
      if (it.kind === "write") {
        need(it.minWords > 0, `${it.id}: minWords required`);
        need(it.checks?.length >= 3, `${it.id}: needs at least 3 checklist items`);
        need(it.ladder && ["model", "frame", "partial", "cue"].every((r) => typeof it.ladder[r] === "string"), `${it.id}: ladder needs model, frame, partial and cue`);
        need(it.checks?.some((c) => c.required !== false), `${it.id}: at least one required check`);
      }
      if (it.kind === "speak") need(it.ladder && ["frame", "partial", "cue"].every((r) => typeof it.ladder[r] === "string"), `${it.id}: speak ladder needs frame, partial and cue`);
      if (it.kind === "ask") {
        for (const p of dialogueProblems(it.dialogue)) out.push(`${it.id}: ${p}`);
        for (const f of it.needFlags || []) need(JSON.stringify(it.dialogue).includes(`"${f}"`), `${it.id}: needFlag "${f}" is never set`);
      }
      if (it.kind === "sort") {
        need(it.cards?.length >= 4 && it.categories?.length >= 2, `${it.id}: sort needs 4+ cards and 2+ categories`);
        for (const c of it.cards || []) need(it.categories.some((k) => k.id === c.cat) && c.why, `${it.id}: card ${c.id} needs a valid category and a why-hint`);
      }
      if (it.kind === "compare") {
        for (const o of it.options || []) for (const e of it.evidence || []) need(["supports", "contradicts", "neutral"].includes(it.matrix?.[o.id]?.[e.id]), `${it.id}: matrix ${o.id}/${e.id}`);
      }
      if (it.kind === "explore") {
        need(it.objects?.length >= it.need, `${it.id}: needs at least ${it.need} objects`);
        for (const o of it.objects || []) need(o.text && o.why && typeof o.relevant === "boolean", `${it.id}: object ${o.id} needs text, why and relevant`);
      }
      if (it.kind === "forge" && it.mode === "explore") {
        const real = Object.values(it.table).filter((v) => v.word && v.meaning);
        need(real.length >= (it.need || 1), `${it.id}: table needs at least ${it.need} real words`);
        need(Object.values(it.table).every((v) => v.word && v.meaning), `${it.id}: every table entry needs a word and a meaning`);
      }
      if (it.kind === "forge" && it.mode === "tasks") for (const t of it.tasks || []) need(table[t.want]?.word, `${it.id}: task ${t.id} wants "${t.want}" which is not a real word in the table`);
      if (it.kind === "forge" && it.mode === "tasks") need(it.tasks?.length >= 3 && it.tasks.every((t) => t.want && t.ask), `${it.id}: tasks need ask and want`);
      if (it.kind === "check") {
        need(it.options?.length >= 3 && it.options.some((o) => o.id === it.answer), `${it.id}: check needs 3+ options and a valid answer`);
        for (const o of it.options || []) need(o.id === it.answer || o.fb, `${it.id}: wrong option ${o.id} needs feedback`);
        need(typeof it.why === "string" && it.why.trim().length >= 40, `${it.id}: check needs a "why" (40+ characters) that says what makes the answer right`);
        const labels = (it.options || []).map((o) => norm(o.label));
        need(new Set(labels).size === labels.length && labels.every(Boolean), `${it.id}: check options must be written and different from each other`);
        for (const o of it.options || []) if (o.id !== it.answer) need(wordCount(o.fb) >= 5, `${it.id}: feedback for wrong option ${o.id} must say what to look at (5+ words)`);
      }
      if (it.kind === "timeline") need(it.events?.length >= 4 && it.events.every((e) => e.why && Number.isInteger(e.order)), `${it.id}: timeline needs 4+ events with order and why`);
      if (it.kind === "route") need(walkRoute(it.grid, it.solution).reached, `${it.id}: the author solution does not reach the goal`);
      if (it.kind === "simulate") {
        const r = runCityModel(it.model, it.solution || []);
        need(r.withinBudget, `${it.id}: author solution exceeds the budget`);
      }
    }
  }
  need(produces >= 1, "a mission needs at least one writing, speaking or story item (meaningful student production)");
  need(m.stages?.some((s) => s.id === "communicate"), "communicate stage required");
  need(Array.isArray(m.endings) && m.endings.length >= 2, "at least two endings so the story responds to the work");
  for (const [i, e] of (m.endings || []).entries()) need(e.id && e.title && e.text, `ending ${i}: id, title and text required`);
  pair(m.family?.skill, "family.skill", out);
  pair(m.family?.talk, "family.talk", out);
  need(m.family?.vocab?.length >= 3, "family.vocab needs 3 words");
  return out;
}
