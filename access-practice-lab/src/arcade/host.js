// host.js — mounts any flagship game: loads its prompt pool, shows the shared launcher, builds the ArcadeSession
// and ArcadeUI, hands the game its stage, saves and resumes the run, records results and evidence, and tears
// everything down. A game module only builds a world; the host owns every cross-cutting concern.
//
// Game module contract (arcade/GAME-CONTRACT.md):
//   export default { async create(env) -> { destroy(), resize?(), onSettings?(settings) } }
import { announce, BASE, html, toHtml } from "../util.js";
import { loadPromptPool } from "../game-core/Prompts.js";
import { ArcadeSession, MODES } from "../game-core/Session.js";
import { InputManager } from "../game-core/Input.js";
import { PerformanceController, prefersReducedMotion } from "../game-core/Loop.js";
import { SoundEngine } from "../game-core/SoundEngine.js";
import { clearRun, loadArcade, loadRun, recordRun, saveRun, saveSettings, watchArcade } from "../game-core/ArcadeStore.js";
import { tierOfSupport } from "../lab/meta.js";
import { recordEvent } from "../lab/store.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { levelProfile } from "../game-core/WidaLevels.js";
import { ARCADE, arcadeBandOk } from "./games.js";
import { ArcadeUI } from "./ui/ArcadeUI.js";
import { defaultConfig, launcherHTML, readLauncher } from "./ui/Launcher.js";
import { tx } from "./ui/strings.js";

let H = null; // the live host: survives a re-render of the page shell, is rebuilt from a snapshot

export const arcadeShell = (I, id) => {
  const g = ARCADE[id];
  return {
    title: I.S(...g.title),
    html: html`<div class="ax-host" data-ax-host data-game="${id}"><p class="ax-loading" role="status">${I.T(...tx("loading"))}</p></div>`,
  };
};

const fetchContent = async (path) => {
  const r = await fetch(`${BASE}/content/${path}`, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
};

export async function mountArcade(root, ctx, id) {
  const host = root.querySelector("[data-ax-host]");
  if (!host) return;
  const def = ARCADE[id];
  const I = i18nFor(ctx);
  const band = ctx.band;
  if (H && (H.id !== id || H.band !== band)) await teardown({ keep: false });
  if (H?.live) { // a re-render of the shell mid-run: rebuild the same run from its snapshot
    const snap = H.session.serialize();
    const cfg = H.config;
    await teardown({ keep: true });
    return startRun(host, ctx, def, cfg, { snapshot: snap });
  }
  H = { id, band, host, ctx, def, offs: [] };
  if (!arcadeBandOk(def, band)) {
    host.innerHTML = toHtml(html`<section class="ax-launch ax-read"><h1 tabindex="-1">${I.T(...def.title)}</h1><p>${I.T("This game is for grades 3–8. Try Arena Blitz or the Language Game Studio.", "Este juego es para 3.º a 8.º grado. Prueba Arena Blitz o el Estudio de juegos de lenguaje.")}</p></section>`);
    return;
  }
  H.config = defaultConfig({ band, prefs: ctx.prefs, game: def });
  showLauncher(I);
  wireLauncher(I);
}

function showLauncher(I, error = "") {
  const save = loadRun(H.id, H.band);
  H.host.innerHTML = launcherHTML({ I, game: H.def, config: H.config, save, error });
  H.host.querySelector("#ax-l-h")?.focus();
}

function wireLauncher(I) {
  const host = H.host;
  const onSubmit = (e) => {
    if (!e.target.matches("[data-ax-form]")) return;
    e.preventDefault();
    startRun(host, H.ctx, H.def, readLauncher(host, H.config), {});
  };
  const onClick = (e) => {
    const a = e.target.closest("[data-ax]")?.dataset.ax;
    if (a === "continue") { const snap = loadRun(H.id, H.band); if (snap) startRun(host, H.ctx, H.def, { ...H.config, level: snap.level, gradeFocus: snap.gradeFocus, mode: snap.mode, calm: snap.calm, focus: "all" }, { snapshot: snap }); }
    else if (a === "discard") { clearRun(H.id, H.band); showLauncher(I); }
  };
  host.addEventListener("submit", onSubmit);
  host.addEventListener("click", onClick);
  H.offs.push(() => host.removeEventListener("submit", onSubmit), () => host.removeEventListener("click", onClick));
}

async function startRun(host, ctx, def, config, { snapshot = null } = {}) {
  const I = i18nFor(ctx);
  H.config = config;
  H.host = host;
  H.ctx = ctx;
  host.innerHTML = toHtml(html`<p class="ax-loading" role="status">${I.T(...tx("loading"))}</p>`);
  let pool;
  try {
    pool = (await loadPromptPool({ band: H.band, fetchJson: fetchContent })).prompts;
  } catch {
    showLauncher(I, I.S(...tx("loadFail")));
    return;
  }
  const domains = config.focus && config.focus !== "all" ? [config.focus] : def.domains;
  const usable = pool.filter((p) => def.domains.includes(p.domain));
  let session = snapshot ? ArcadeSession.restore(snapshot, { pool: usable, questionPausesClock: def.questionPausesClock }) : null;
  if (!session) {
    session = new ArcadeSession({ gameId: def.id, pool: usable, band: H.band, gradeFocus: config.gradeFocus, level: config.level, mode: config.mode, calm: config.calm, questionPausesClock: def.questionPausesClock, domains, seed: (Date.now() ^ ((snapshot?.seed || 0) * 7)) & 0xffffff });
    session.ready();
  }
  const settings = loadArcade().settings;
  host.innerHTML = '';
  const perf = new PerformanceController({ reducedEffects: settings.reducedEffects || prefersReducedMotion(settings.reducedMotion) });
  const gameCfg = { ...config, reducedMotion: prefersReducedMotion(settings.reducedMotion), reducedEffects: settings.reducedEffects };
  const ui = new ArcadeUI({
    root: host, session, I, ctx,
    game: { id: def.id, title: def.title, objective: def.objective, status: () => H.status?.() || "" },
    onExit: () => exitRun(I),
    onRestart: () => restart(),
  });
  ui.onSettings = (s) => { H.instance?.onSettings?.(s); perf.pin(s.reducedEffects || prefersReducedMotion(s.reducedMotion)); };
  const stage = document.createElement("div");
  stage.className = "ax-stage";
  stage.dataset.game = def.id;
  ui.main.append(stage);
  const input = new InputManager({ onAction: () => {} });
  H = { ...H, live: true, session, ui, input, perf, stage, config, snapshotAtStart: snapshot };
  // evidence: one lab event per finished prompt, in the same versioned store the Studio games use (no names, no text)
  H.offs.push(session.bus.on("answer", (r) => { if (r.correct || r.revealed) logRound(session); }));
  H.offs.push(session.bus.on("answer", persist), session.bus.on("state", persist), session.bus.on("purchase", persist));
  const hide = () => { if (document.visibilityState === "hidden") { SoundEngine.suspend(); persist(); } else SoundEngine.resume(); };
  document.addEventListener("visibilitychange", hide);
  window.addEventListener("pagehide", persist);
  H.offs.push(() => document.removeEventListener("visibilitychange", hide), () => window.removeEventListener("pagehide", persist), watchArcade(() => {}));
  SoundEngine.unlock();
  // QA hook (only with ?qa=1): lets browser tests read the open question (answer included) and the live session.
  if (new URLSearchParams(location.search).get("qa") === "1") {
    window.__ARCADE__ = { session: () => H?.session, ui: () => H?.ui, game: () => H?.instance, ticket: () => H?.session?.publicTicket(), perf: () => H?.perf, state: () => H?.session?.state };
  }
  const env = {
    stage, session, ui, I, ctx, config: gameCfg, pool: usable, input, perf, settings,
    saved: session.gameState,
    setState(obj) { session.gameState = obj; persist(); },
    save: persist,
    announce: (m) => ui.say(m),
    playing: () => session.state === "PLAYING",
    status(fn) { H.status = fn; ui.update(); },
    finish: (o) => finishRun(I, o),
  };
  try {
    const mod = (await def.load()).default;
    H.instance = await mod.create(env);
  } catch (e) {
    console.error("[arcade] game failed to start", e);
    await teardown({ keep: true });
    showLauncher(I, I.S(...tx("loadFail")));
    wireLauncher(I);
    return;
  }
  if (snapshot && ["QUESTION_ACTIVE", "RECOVERY"].includes(session.state)) ui.resumeQuestion().then((r) => r && H.instance?.onAnswered?.(r));
  else if (session.state === "READY") session.begin();
  ui.update();
  stage.querySelector("[data-focus], canvas, button")?.focus?.({ preventScroll: true });
}

function logRound(session) {
  const rec = session.lastRecord;
  if (!rec) return;
  try {
    recordEvent({ gameId: session.gameId, gradeBand: session.profile.band, scaffoldTier: tierOfSupport(levelProfile(session.profile.level).support), timestamp: rec.at, kind: "round", widaDomain: rec.domain, ok: rec.outcome === "independent" || rec.outcome === "revised" || rec.outcome === "scaffolded" });
  } catch {}
}

let saveTimer = 0;
function persist() {
  if (!H?.live || !H.session) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}
function flush() {
  if (!H?.live || !H.session) return;
  if (["RESULTS", "SAVE", "EXIT", "GAME_OVER"].includes(H.session.state)) return;
  try { saveRun(H.session.serialize()); } catch {}
}

function finishRun(I, { won = false, place = 0, completedLevel = "", unlock = [], summary = "", title = "", onReplay } = {}) {
  const { session, ui, ctx } = H;
  clearTimeout(saveTimer);
  if (!session.finish()) return;
  session.save((results) => recordRun(results, { won, place, completedLevel, unlock }));
  try { award(ctx, `arcade:${session.runId}`, 8, "Language game"); } catch {}
  ui.showResults({ title: title || I.S(...tx(won ? "roundDone" : "results")), extra: summary, onReplay: onReplay || (() => restart()), onExit: () => exitRun(I) });
}

async function restart() {
  if (!H?.live) return;
  const { host, ctx, def, config } = H;
  clearRun(def.id, H.band);
  await teardown({ keep: true });
  startRun(host, ctx, def, config, {});
}

function exitRun(I) {
  flush();
  const { host } = H;
  teardown({ keep: true }).then(() => { showLauncher(I); wireLauncher(I); announce(I.S("Left the game. Your run is saved.", "Saliste del juego. Tu partida está guardada.")); });
}

async function teardown({ keep }) {
  if (!H) return;
  clearTimeout(saveTimer);
  try { await H.instance?.destroy?.(); } catch {}
  try { H.ui?.destroy(); } catch {}
  try { H.input?.destroy(); } catch {}
  for (const o of H.offs || []) { try { o(); } catch {} }
  H.offs = [];
  H.stage?.remove();
  const keepKeys = keep ? { id: H.id, band: H.band, host: H.host, ctx: H.ctx, def: H.def, config: H.config, offs: [] } : null;
  H = keepKeys;
}

export function unmountArcade() {
  if (typeof window !== "undefined") window.__ARCADE__ = undefined;
  if (H?.live) { flush(); }
  teardown({ keep: false });
  H = null;
}
export const arcadeSettings = () => loadArcade().settings;
export { saveSettings, MODES };
