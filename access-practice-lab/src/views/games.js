// Language Game Studio: the hub (/games) and the player (/games/<id>). The controller owns the phases
// (start -> play -> transfer -> done), autosave and resume, evidence history and achievements; every game
// module (src/games/<module>.js) owns only its own mechanic. See src/games/engine.js for the contract.
import { announce, BASE, html } from "../util.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { loadLedger, buildProfile, focusAreas } from "../lang/ledger.js";
import { SUP, rng, supOf } from "../games/engine.js";
import { hubHTML, hubHref } from "../games/hub.js";
import { nextInPath, newAwards, parsePath, pathwayProgress, recommend, suggestSupport } from "../games/plan.js";
import { GAME } from "../games/registry.js";
import { doneHTML, frameHTML, startHTML, transferHTML } from "../games/screens.js";
import { loadGames, saveGames, sessionKey, summarizeRounds } from "../games/state.js";

const contentCache = new Map();
const loadContent = (id) => {
  if (!contentCache.has(id)) {
    const p = fetch(`${BASE}/content/games/${encodeURIComponent(id)}.json`, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`games/${id}: HTTP ${r.status}`); return r.json(); });
    contentCache.set(id, p);
    p.catch(() => contentCache.delete(id));
  }
  return contentCache.get(id);
};
const moduleCache = new Map();
const loadModule = (name) => {
  if (!moduleCache.has(name)) moduleCache.set(name, import(`${BASE}/src/games/${name}.js`).then((m) => m.default));
  return moduleCache.get(name);
};

// The router calls handlers synchronously, so what render prepared lives here.
let LIVE = null;
let HUB = null;

const query = () => Object.fromEntries(new URLSearchParams(location.search));
const qaOn = () => query().qa === "1";

function makeSession(def, band, support, len, previous) {
  return { id: `${def.id}-${Date.now().toString(36)}`, game: def.id, band, support, len, phase: "play", seed: ((Date.now() ^ (previous?.seed || 0)) & 0xffff) + 1, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), state: null, rounds: [], supportsUsed: [], cur: [], transfer: { text: "", checks: [], saved: false } };
}

function envFor(live) {
  const { ctx, session, band, def } = live;
  const I = i18nFor(ctx);
  const sup = supOf(session.support);
  const env = {
    ctx, I, band, def, sup, support: session.support, len: session.len || "full", qa: qaOn(),
    content: live.content.bands?.[band] || {}, contentAll: live.content,
    rng: rng(session.seed),
    count: (full, quick) => ((session.len || "full") === "quick" ? quick : full),
    use(name) {
      if (!session.cur.includes(name)) session.cur.push(name);
      if (!session.supportsUsed.includes(name)) session.supportsUsed.push(name);
    },
    report(r) {
      const row = { ...r, support: session.support, supports: [...session.cur], at: new Date().toISOString(), final: true };
      const i = session.rounds.findIndex((x) => x.id === r.id);
      if (i >= 0) session.rounds[i] = row; else session.rounds.push(row);
      session.cur = [];
    },
  };
  return env;
}

function persist(live) {
  live.session.updatedAt = new Date().toISOString();
  live.games.sessions[sessionKey(live.def.id, live.band)] = live.session;
  saveGames(live.games);
}

function finish(live, { skipped = false } = {}) {
  const { session, games, def, band, ctx } = live;
  if (session.phase === "done") return;
  const s = summarizeRounds(session.rounds);
  const id = `${session.id}`;
  if (!games.history.some((h) => h.id === id)) {
    games.history.push({ id, game: def.id, band, support: session.support, at: new Date().toISOString(), rounds: s.total, firstTry: s.firstTry, hints: s.hints, revised: s.revised, independent: s.independent, skills: s.skills, supports: session.supportsUsed.slice(0, 8), transferWords: session.transfer.saved ? session.transfer.text.trim().split(/\s+/).filter(Boolean).length : 0, transferChecks: session.transfer.checks.length, len: session.len || "full" });
  }
  const path = parsePath(query().path);
  const prog = path.length ? pathwayProgress(games, path, band) : null;
  live.awards = newAwards({ session, history: games.history, have: games.awards, pathwayDone: Boolean(prog?.complete) });
  games.awards = [...new Set([...games.awards, ...live.awards])];
  session.phase = "done";
  persist(live);
  try {
    award(ctx, `game:${id}`, 6, "Language game");
    if (session.transfer.saved) award(ctx, `transfer:game:${id}`, 4, "Used it on my own");
  } catch {}
  announce(i18nFor(ctx).S("Game finished.", "Juego terminado."));
}

function advance(live) {
  const { mod, session } = live;
  if (session.phase === "play" && mod.done(session.state)) {
    const spec = live.content.transfer?.[live.band];
    if (spec) session.phase = "transfer"; else finish(live);
  }
}

// ── render ───────────────────────────────────────────────────────────────────────────────
export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const id = ctx.route.id;
  const q = query();
  if (!id) {
    const games = loadGames();
    let focus = [];
    try {
      const profile = buildProfile(loadLedger().entries, { band });
      focus = focusAreas(profile).map((f) => ({ pattern: "Writing", feature: "Writing", independence: "Writing", trap: "Reading" }[f.kind])).filter(Boolean);
    } catch {}
    HUB = { ctx };
    LIVE = null;
    return { title: I.S("Language Game Studio", "Estudio de juegos de lenguaje"), html: hubHTML(ctx, I, games, q, band, { focus: [...new Set(focus)] }) };
  }
  const def = GAME[id];
  if (!def || !def.obj[band]) {
    LIVE = null;
    return { title: I.S("Game not found", "Juego no encontrado"), html: html`<section class="panel empty-state"><h1 tabindex="-1">${I.T("We could not find that game.", "No pudimos encontrar ese juego.")}</h1><p><a class="btn btn-primary" href="${BASE}/games?grades=${band}">${I.T("See all games", "Ver todos los juegos")}</a></p></section>` };
  }
  const [content, mod] = await Promise.all([loadContent(id), loadModule(def.module)]);
  const games = loadGames();
  const key = sessionKey(id, band);
  let session = games.sessions[key] || null;
  const wanted = SUP[q.mode] ? q.mode : "";
  if (!LIVE || LIVE.def.id !== id || LIVE.band !== band) {
    // Entering a game: a finished session shows its completion screen only right after finishing; a link opens the start screen.
    if (session?.phase === "done") session = null;
    LIVE = { ctx, def, band, mod, content, games, session: session || { ...makeSession(def, band, wanted || ctx.prefs.tiers?.[def.skill === "Integrated" ? "Reading" : def.skill] || "A", q.len === "quick" ? "quick" : "full"), phase: "start" }, awards: [], len: q.len === "quick" ? "quick" : "full", started: Boolean(session) };
    if (wanted && LIVE.session.phase === "start") LIVE.session.support = wanted;
  }
  LIVE.ctx = ctx; LIVE.games = games; LIVE.content = content; LIVE.mod = mod;
  const live = LIVE;
  const s = live.session;
  const env = envFor(live);
  live.env = env;
  const title = I.S(def.title[0], def.title[1]);
  if (s.phase === "start") {
    return { title, html: startHTML({ g: def, I, band, content: { rules: content.rules }, session: s, saved: games.sessions[key], len: live.len }) };
  }
  if (s.phase === "play") {
    if (!s.state) s.state = mod.init(env);
    const stage = mod.view(s.state, env);
    return { title, html: frameHTML({ g: def, I, band, session: s, content, stage, progress: mod.progress(s.state) }) };
  }
  if (s.phase === "transfer") return { title, html: transferHTML({ g: def, I, band, session: s, spec: content.transfer[band] }) };
  const path = parsePath(q.path);
  const recs = recommend(games, band, { n: 2 }).filter((r) => r.game !== id);
  const sug = suggestSupport(s.rounds, s.support);
  const pathNext = path.length ? nextInPath(path, id) : null;
  const pathQuery = path.length ? `&path=${path.join(",")}` : "";
  return { title, html: doneHTML({ g: def, I, band, session: s, awards: live.awards, next: { pathQuery }, suggestion: sug, pathNext, recommended: recs[0]?.game }) };
}

export function mount(root, ctx) {
  LIVE?.cleanup?.();
  if (LIVE) LIVE.cleanup = null;
  if (!LIVE || LIVE.session.phase !== "play" || !LIVE.session.state) { window.__ACCESS_GAMES__ = undefined; if (!LIVE) hubMount(root); return; }
  const stage = root.querySelector(".gs-stage");
  if (stage && LIVE.mod.mount) LIVE.cleanup = LIVE.mod.mount(stage, LIVE.session.state, LIVE.env, () => changed()) || null;
  if (qaOn()) {
    window.__ACCESS_GAMES__ = {
      plan: (opts = {}) => LIVE.mod.plan(LIVE.session.state, opts || {}, LIVE.env),
      phase: () => LIVE.session.phase,
      progress: () => LIVE.mod.progress(LIVE.session.state),
      rounds: () => LIVE.session.rounds,
    };
  }
}
function hubMount(root) {
  const form = root.querySelector("[data-g-assign-form]");
  window.__ACCESS_GAMES__ = undefined;
  return form;
}
export function unmount() {
  LIVE?.cleanup?.();
  if (LIVE) LIVE.cleanup = null;
  if (typeof window !== "undefined") window.__ACCESS_GAMES__ = undefined;
}

// ── events ───────────────────────────────────────────────────────────────────────────────
function changed() {
  const live = LIVE;
  if (!live) return;
  advance(live);
  persist(live);
  live.ctx.rerender();
}

export function onClick(e, ctx) {
  const t = e.target;
  if (!LIVE) {
    // hub: teacher sequence builder
    const build = t.closest("[data-g-assign-build]");
    if (build) {
      const form = build.closest("form");
      const ids = [...form.querySelectorAll('input[name="ids"]:checked')].map((n) => n.value);
      const out = form.querySelector(".gs-assign-out");
      const I = i18nFor(ctx);
      if (!ids.length) { out.textContent = I.S("Pick at least one game.", "Elige al menos un juego."); return true; }
      const url = new URL(hubHref(ctx.band, { assign: ids.join(","), t: form.elements.title.value.trim(), mode: form.elements.mode.value }), location.origin);
      out.innerHTML = `<a href="${url.pathname + url.search}">${I.S("Open the sequence", "Abrir la secuencia")}</a> · <button type="button" class="btn small" data-copy="${url.pathname + url.search}">${I.S("Copy link", "Copiar enlace")}</button>`;
      announce(I.S("Link ready.", "Enlace listo."));
      return true;
    }
    return false;
  }
  const live = LIVE;
  const s = live.session;
  const I = i18nFor(ctx);
  if (t.closest("[data-say]") && s.phase === "play" && s.support === "C") live.env.use("audio");
  const q = t.closest("[data-g-start],[data-g-resume],[data-g-pick],[data-g-len],[data-g-support],[data-g-again],[data-g-transfer-save],[data-g-transfer-skip]");
  if (q) {
    if (q.hasAttribute("data-g-pick") && SUP[q.dataset.gPick]) { s.support = q.dataset.gPick; ctx.rerender(); return true; }
    if (q.hasAttribute("data-g-len")) { live.len = q.dataset.gLen; s.len = live.len; ctx.rerender(); return true; }
    if (q.hasAttribute("data-g-start")) {
      const prev = s;
      live.session = { ...makeSession(live.def, live.band, prev.support, live.len, prev), phase: "play" };
      live.env = envFor(live);
      live.session.state = live.mod.init(live.env);
      persist(live);
      ctx.rerender();
      return true;
    }
    if (q.hasAttribute("data-g-resume")) {
      const saved = live.games.sessions[sessionKey(live.def.id, live.band)];
      if (saved) { live.session = saved; live.len = saved.len || "full"; }
      ctx.rerender();
      return true;
    }
    if (q.hasAttribute("data-g-support")) {
      s.support = q.dataset.gSupport;
      s.cur = [];
      persist(live);
      announce(I.S(`Support mode: ${SUP[s.support].name[0]}.`, `Modo de apoyo: ${SUP[s.support].name[1]}.`));
      ctx.rerender();
      return true;
    }
    if (q.hasAttribute("data-g-again")) {
      const support = q.dataset.gAgain;
      live.session = { ...makeSession(live.def, live.band, support, s.len || "full", s), phase: "play" };
      live.env = envFor(live);
      live.session.state = live.mod.init(live.env);
      delete live.games.sessions[sessionKey(live.def.id, live.band)];
      persist(live);
      live.awards = [];
      window.scrollTo({ top: 0 });
      ctx.rerender();
      return true;
    }
    if (q.hasAttribute("data-g-transfer-save")) { s.transfer.saved = true; finish(live); ctx.rerender(); window.scrollTo({ top: 0 }); return true; }
    if (q.hasAttribute("data-g-transfer-skip")) { finish(live); ctx.rerender(); window.scrollTo({ top: 0 }); return true; }
  }
  if (s.phase === "play" && s.state) {
    const env = live.env;
    if (live.mod.click(t, s.state, env) === true) { changed(); return true; }
  }
  return false;
}

export function onChange(e) {
  const t = e.target;
  if (!LIVE) return;
  if (t.matches?.("[data-g-check]")) {
    const i = Number(t.dataset.gCheck);
    const checks = new Set(LIVE.session.transfer.checks);
    if (t.checked) checks.add(i); else checks.delete(i);
    LIVE.session.transfer.checks = [...checks].sort();
    persist(LIVE);
  }
}
export function onInput(e) {
  const t = e.target;
  if (!LIVE) return;
  if (t.matches?.("[data-g-transfer-text]")) {
    LIVE.session.transfer.text = t.value.slice(0, 2000);
    persist(LIVE);
    const spec = LIVE.content.transfer?.[LIVE.band];
    const words = t.value.trim().split(/\s+/).filter(Boolean).length;
    const btn = document.querySelector("[data-g-transfer-save]");
    if (btn) btn.disabled = spec?.mode === "write" && words < (spec.minWords || 1);
    const count = t.nextElementSibling;
    if (count) count.textContent = i18nFor(LIVE.ctx).S(`${words} words`, `${words} palabras`);
    return;
  }
  const s = LIVE.session;
  if (s.phase === "play" && s.state && LIVE.mod.input?.(t, s.state, LIVE.env) === true) changed();
}
export function onKey(e) {
  if (!LIVE || LIVE.session.phase !== "play" || !LIVE.session.state || !LIVE.mod.key) return;
  if (e.target.closest?.("input, textarea, select")) return;
  if (LIVE.mod.key(e, LIVE.session.state, LIVE.env) === true) { e.preventDefault(); changed(); }
}
