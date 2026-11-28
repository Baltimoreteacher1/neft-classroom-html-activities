// Language Game Studio: the hub (/games) and the player (/games/<id>). The controller owns the phases
// (start -> play -> transfer -> done), autosave and resume, evidence history and achievements; every game
// module (src/games/<module>.js) owns only its own mechanic. See src/games/engine.js for the contract.
import { announce, BASE, ensureStylesheet, html } from "../util.js";
import { speak } from "../speech.js";
import { gameMeta, tierOfSupport, DOMAINS } from "../lab/meta.js";
import { supportFromQuery } from "../lab/query.js";
import { decorateAudio, requestPlay, toggleSlow, cleanListening } from "../lab/listening.js";
import { recordEvent } from "../lab/store.js";
import { updateMicPill } from "../lab/hud.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { loadLedger, buildProfile, focusAreas } from "../lang/ledger.js";
import { SUP, rng, supOf } from "../games/engine.js";
import { earlyPlayHTML } from "../games/early-play.js";
import { hubHTML, hubHref } from "../games/hub.js";
import { bandRows } from "../content.js";
import { bandOk, nextInPath, newAwards, parsePath, pathwayProgress, recommend, suggestSupport } from "../games/plan.js";
import { GAME, GAMES } from "../games/registry.js";
import { isArcade } from "../arcade/games.js";
import { expeditionsHubClick } from "../games/language-expeditions-assign.js";
import { doneHTML, frameHTML, startHTML, transferHTML } from "../games/screens.js";
import { loadGames, saveGames, sessionKey, summarizeRounds } from "../games/state.js";
import { FSM_STATES, GameFSM, toFSMState } from "../game-core/GameFSM.js";
import { SoundEngine } from "../game-core/SoundEngine.js";
import {
  cycleGameTheme,
  getWeakSpots,
  loadProgression,
  setZenMode,
  unlockWorldBadge,
} from "../game-core/ProgressionStore.js";

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
let ARC = null; // the flagship canvas games (src/arcade/host.js), loaded only when one is opened

const query = () => Object.fromEntries(new URLSearchParams(location.search));
const qaOn = () => query().qa === "1";

function makeSession(def, band, support, len, previous) {
  return { id: `${def.id}-${Date.now().toString(36)}`, game: def.id, band, support, len, phase: "play", seed: ((Date.now() ^ (previous?.seed || 0)) & 0xffff) + 1, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), state: null, rounds: [], supportsUsed: [], cur: [], lab: cleanListening(), transfer: { text: "", checks: [], saved: false } };
}

function envFor(live) {
  const { ctx, session, band, def } = live;
  const I = i18nFor(ctx);
  const sup = supOf(session.support);
  const env = {
    ctx, I, band, def, sup, support: session.support, len: session.len || "full", qa: qaOn(),
    params: query(), // URL parameters a game may read at init (Language Expeditions: land, stop)
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
      logRound(live, r);
    },
  };
  return env;
}

// Telemetry for the lab's versioned store (`tlp_lab_v2`): one event per judged round and one per finished game.
// No name, no learner text, no recording: the game, band, WIDA domain, content area, tier and an optional error tag.
function labEvent(live, extra) {
  const meta = gameMeta(live.def.id);
  return {
    gameId: live.def.id,
    gradeBand: live.band,
    widaContentArea: meta?.contentArea,
    scaffoldTier: tierOfSupport(live.session.support),
    timestamp: new Date().toISOString(),
    ...extra,
  };
}
function logRound(live, r) {
  try {
    recordEvent(labEvent(live, { kind: "round", widaDomain: DOMAINS.includes(r.skill) ? r.skill : undefined, languageErrorTag: r.languageErrorTag || null, ok: r.ok !== false }));
  } catch {}
}
function logMission(live) {
  try {
    recordEvent(labEvent(live, { kind: "mission", ok: true }));
  } catch {}
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
  live.fsm?.transition(FSM_STATES.ROUND_SUMMARY);
  persist(live);
  logMission(live);
  try {
    SoundEngine.playLevelUp();
    for (const a of live.awards) unlockWorldBadge(a);
    unlockWorldBadge(`game:${def.id}:${band}`);
    award(ctx, `game:${id}`, 6, "Language game");
    if (session.transfer.saved) award(ctx, `transfer:game:${id}`, 4, "Used it on my own");
  } catch {}
  announce(i18nFor(ctx).S("Game finished.", "Juego terminado."));
}

function advance(live) {
  const { mod, session } = live;
  if (session.phase === "play" && mod.done(session.state)) {
    const spec = live.content.transfer?.[live.band];
    live.fsm?.transition(FSM_STATES.ROUND_SUMMARY);
    if (spec) session.phase = "transfer"; else finish(live);
  }
}

/** Filter a game's state to prioritize or focus on items in the learner's Weak-Spot queue when launching Weak-Spot Replay. */
function filterWeakSpotsState(state, weakSpots) {
  if (!state || !Array.isArray(weakSpots) || !weakSpots.length) return state;
  const ids = new Set(weakSpots.map((w) => w.id));
  for (const key of ["rounds", "cases", "rows", "puzzles"]) {
    if (Array.isArray(state[key]) && state[key].length > 1) {
      const matched = state[key].filter((item) => item && ids.has(String(item.id || "").split(":")[0]));
      if (matched.length >= 1) {
        state[key] = matched;
      }
    }
  }
  return state;
}

// ── render ───────────────────────────────────────────────────────────────────────────────
export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const id = ctx.route.id;
  const q = query();
  if (id) await Promise.all(["lab-v2", "lab-reading", "lab-speaking", "lab-writing"].map((f) => ensureStylesheet(`${f}.css`)));
  if (id && isArcade(id)) {
    LIVE = null;
    ARC = await import("../arcade/host.js");
    return ARC.arcadeShell(I, id);
  }
  ARC = null;
  if (!id) {
    if (!GAMES.some((g) => bandOk(g, band))) {
      HUB = { ctx };
      LIVE = null;
      return { title: I.S("Language Game Studio", "Estudio de juegos de lenguaje"), html: earlyPlayHTML(I, band, await bandRows(band).catch(() => [])) };
    }
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
  const wanted = SUP[q.mode] ? q.mode : supportFromQuery(location.search);
  if (!LIVE || LIVE.def.id !== id || LIVE.band !== band) {
    LIVE?.fsm?.teardown();
    // Entering a game: a finished session shows its completion screen only right after finishing; a link opens the start screen.
    if (session?.phase === "done") session = null;
    const initialSession = session || {
      ...makeSession(def, band, wanted || ctx.prefs.tiers?.[def.skill === "Integrated" ? "Reading" : def.skill] || "A", q.len === "quick" ? "quick" : "full"),
      phase: "start",
    };
    const prog = loadProgression();
    if (typeof document !== "undefined" && document.documentElement) {
      if (prog.theme === "default") delete document.documentElement.dataset.gameTheme;
      else document.documentElement.dataset.gameTheme = prog.theme;
    }
    const fsm = new GameFSM({
      gameId: def.id,
      band,
      initialState: toFSMState(initialSession.phase),
      zenMode: prog.zenMode,
    });
    LIVE = {
      ctx,
      def,
      band,
      mod,
      content,
      games,
      session: initialSession,
      fsm,
      awards: [],
      len: q.len === "quick" ? "quick" : "full",
      started: Boolean(session),
    };
    if (wanted && LIVE.session.phase === "start") LIVE.session.support = wanted;
  }
  LIVE.ctx = ctx; LIVE.games = games; LIVE.content = content; LIVE.mod = mod;
  const live = LIVE;
  const s = live.session;
  const env = envFor(live);
  live.env = env;
  const title = I.S(def.title[0], def.title[1]);
  if (s.phase === "start") {
    live.fsm?.transition(FSM_STATES.BRIEFING);
    return { title, html: startHTML({ g: def, I, band, content: { rules: content.rules }, session: s, saved: games.sessions[key], len: live.len }) };
  }
  if (s.phase === "play") {
    if (!s.state) s.state = mod.init(env);
    const stage = mod.view(s.state, env);
    const hasFeedback = typeof stage === "string" && stage.includes("gs-feedback");
    if (hasFeedback) live.fsm?.transition(FSM_STATES.FEEDBACK);
    else if (!live.fsm?.weakSpotMode) live.fsm?.transition(FSM_STATES.PLAYING);
    return {
      title,
      html: frameHTML({
        g: def,
        I,
        band,
        session: s,
        content,
        stage,
        progress: mod.progress(s.state),
        fsmState: live.fsm?.getState(),
        paused: Boolean(live.fsm?.paused),
      }),
    };
  }
  if (s.phase === "transfer") {
    live.fsm?.transition(FSM_STATES.ROUND_SUMMARY);
    return { title, html: transferHTML({ g: def, I, band, session: s, spec: content.transfer[band] }) };
  }
  live.fsm?.transition(FSM_STATES.ROUND_SUMMARY);
  const path = parsePath(q.path);
  const recs = recommend(games, band, { n: 2 }).filter((r) => r.game !== id);
  const sug = suggestSupport(s.rounds, s.support);
  const pathNext = path.length ? nextInPath(path, id) : null;
  const pathQuery = path.length ? `&path=${path.join(",")}` : "";
  return { title, html: doneHTML({ g: def, I, band, session: s, awards: live.awards, next: { pathQuery }, suggestion: sug, pathNext, recommended: recs[0]?.game }) };
}

export function mount(root, ctx) {
  if (ARC && isArcade(ctx.route.id)) { ARC.mountArcade(root, ctx, ctx.route.id); return; }
  LIVE?.cleanup?.();
  if (LIVE) LIVE.cleanup = null;
  if (!LIVE || LIVE.session.phase !== "play" || !LIVE.session.state) { window.__ACCESS_GAMES__ = undefined; if (!LIVE) hubMount(root); return; }
  const stage = root.querySelector(".gs-stage");
  if (stage && LIVE.def.skill === "Listening") decorateAudio(stage, cleanListening(LIVE.session.lab), tierOfSupport(LIVE.session.support));
  stopMicWatch();
  const onAudioState = (e) => updateMicPill(root, i18nFor(ctx), e.detail?.state);
  document.addEventListener("lab:audio-state", onAudioState);
  micWatch = () => document.removeEventListener("lab:audio-state", onAudioState);
  if (stage && LIVE.mod.mount && !LIVE.fsm?.paused) LIVE.cleanup = LIVE.mod.mount(stage, LIVE.session.state, LIVE.env, () => changed()) || null;
  if (qaOn()) {
    window.__ACCESS_GAMES__ = {
      plan: (opts = {}) => LIVE.mod.plan(LIVE.session.state, opts || {}, LIVE.env),
      phase: () => LIVE.session.phase,
      fsmState: () => LIVE.fsm?.getState() || toFSMState(LIVE.session.phase),
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
let micWatch = null;
const stopMicWatch = () => { micWatch?.(); micWatch = null; };

export function unmount() {
  if (ARC) { ARC.unmountArcade(); ARC = null; }
  stopMicWatch();
  LIVE?.cleanup?.();
  LIVE?.fsm?.teardown();
  if (LIVE) LIVE.cleanup = null;
  if (typeof window !== "undefined") window.__ACCESS_GAMES__ = undefined;
}

// ── events ───────────────────────────────────────────────────────────────────────────────
function changed() {
  const live = LIVE;
  if (!live) return;
  advance(live);
  persist(live);
  return live.ctx.rerender();
}

export function onClick(e, ctx) {
  const t = e.target;
  if (!LIVE) {
    // hub: Language Expeditions teacher stop builder
    if (expeditionsHubClick(t, i18nFor(ctx))) return true;
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
  const tier = tierOfSupport(s.support);
  const say = t.closest("[data-say]");
  if (say && s.phase === "play" && live.def.skill === "Listening") {
    // Listening games: replays follow the scaffold tier (Independent 2, Guided / Hands-on unlimited, 0.85x toggle).
    s.lab = cleanListening(s.lab);
    const play = requestPlay(s.lab, say.dataset.say, tier, ctx.prefs.rate);
    if (!play.ok) {
      announce(I.S("That recording has been played twice. Use what you heard.", "Esa grabación ya se reprodujo dos veces. Usa lo que escuchaste."));
      return true;
    }
    s.lab = play.state;
    persist(live);
    if (s.support === "C") live.env.use("audio");
    const anchor = say.closest("[data-anchor]") || say;
    anchor.classList.add("lh-anchor-on");
    decorateAudio(document.querySelector(".gs-stage") || document, s.lab, tier);
    Promise.resolve(speak(say.dataset.say, { rate: play.rate, voiceURI: ctx.prefs.readingVoice })).finally(() => anchor.classList.remove("lh-anchor-on"));
    return true;
  }
  if (t.closest("[data-lab-slow]")) {
    s.lab = toggleSlow(cleanListening(s.lab), tier);
    persist(live);
    ctx.rerender();
    return true;
  }
  if (say && s.phase === "play" && s.support === "C") live.env.use("audio");
  const hudBtn = t.closest("[data-g-mute],[data-g-zen],[data-g-pause],[data-g-theme],[data-g-weak-replay]");
  if (hudBtn) {
    if (hudBtn.hasAttribute("data-g-mute")) {
      const muted = SoundEngine.toggleMute();
      announce(muted ? I.S("Game sound muted.", "Sonido del juego silenciado.") : I.S("Game sound on.", "Sonido del juego activado."));
      ctx.rerender();
      return true;
    }
    if (hudBtn.hasAttribute("data-g-zen")) {
      const next = live.fsm ? live.fsm.toggleZenMode() : true;
      setZenMode(next);
      announce(next ? I.S("Zen Mode on.", "Modo Zen activado.") : I.S("Zen Mode off.", "Modo Zen desactivado."));
      ctx.rerender();
      return true;
    }
    if (hudBtn.hasAttribute("data-g-pause")) {
      const paused = live.fsm ? live.fsm.togglePause() : false;
      announce(paused ? I.S("Game paused.", "Juego en pausa.") : I.S("Game resumed.", "Juego reanudado."));
      ctx.rerender();
      return true;
    }
    if (hudBtn.hasAttribute("data-g-theme")) {
      const prog = cycleGameTheme();
      SoundEngine.playClick();
      announce(I.S(`Theme: ${prog.theme}.`, `Tema: ${prog.theme}.`));
      ctx.rerender();
      return true;
    }
    if (hudBtn.hasAttribute("data-g-weak-replay")) {
      const prev = s;
      const weakSpots = getWeakSpots(live.def.id, live.band);
      live.session = { ...makeSession(live.def, live.band, prev.support, "quick", prev), phase: "play", weakSpotReplay: true };
      live.env = envFor(live);
      live.session.state = filterWeakSpotsState(live.mod.init(live.env), weakSpots);
      live.fsm?.togglePause(false);
      live.fsm?.transition(FSM_STATES.REPLAY_WEAK_SPOTS, { force: true });
      SoundEngine.unlock();
      SoundEngine.playClick();
      persist(live);
      ctx.rerender();
      window.scrollTo({ top: 0 });
      return true;
    }
  }
  const q = t.closest("[data-g-start],[data-g-resume],[data-g-pick],[data-g-len],[data-g-support],[data-g-again],[data-g-transfer-save],[data-g-transfer-skip]");
  if (q) {
    if (q.hasAttribute("data-g-pick") && SUP[q.dataset.gPick]) { s.support = q.dataset.gPick; ctx.rerender(); return true; }
    if (q.hasAttribute("data-g-len")) { live.len = q.dataset.gLen; s.len = live.len; ctx.rerender(); return true; }
    if (q.hasAttribute("data-g-start")) {
      const prev = s;
      live.session = { ...makeSession(live.def, live.band, prev.support, live.len, prev), phase: "play" };
      live.env = envFor(live);
      live.session.state = live.mod.init(live.env);
      live.fsm?.togglePause(false);
      live.fsm?.transition(FSM_STATES.PLAYING, { force: true });
      SoundEngine.unlock();
      SoundEngine.playClick();
      persist(live);
      ctx.rerender();
      window.scrollTo({ top: 0 });
      return true;
    }
    if (q.hasAttribute("data-g-resume")) {
      const saved = live.games.sessions[sessionKey(live.def.id, live.band)];
      if (saved) { live.session = saved; live.len = saved.len || "full"; }
      live.fsm?.togglePause(false);
      live.fsm?.transition(toFSMState(live.session.phase), { force: true });
      SoundEngine.unlock();
      ctx.rerender();
      window.scrollTo({ top: 0 });
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
      live.fsm?.togglePause(false);
      live.fsm?.transition(FSM_STATES.PLAYING, { force: true });
      SoundEngine.unlock();
      SoundEngine.playClick();
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
    if (live.mod.click(t, s.state, env) === true) {
      const check = t.closest?.("[data-g-check]");
      const wasRevise = Boolean(t.closest?.("[data-g-revise]"));
      const rendered = changed();
      if (live.def.id === "conversation-crossroads") {
        const selector = check ? `[data-g-check="${check.dataset.gCheck}"]` : wasRevise ? "[data-cc-draft]" : ".cc [data-cc-focus], .gs-transfer h1";
        Promise.resolve(rendered).then(() => document.querySelector(selector)?.focus());
      }
      return true;
    }
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
  if (s.phase === "play" && s.state) {
    const result = LIVE.mod.input?.(t, s.state, LIVE.env);
    if (result === true) changed();
    else if (result === "save") persist(LIVE);
  }
}
export function onKey(e) {
  if (!LIVE || LIVE.session.phase !== "play" || !LIVE.session.state || !LIVE.mod.key) return;
  if (e.target.closest?.("input, textarea, select")) return;
  if (LIVE.mod.key(e, LIVE.session.state, LIVE.env) === true) { e.preventDefault(); changed(); }
}
