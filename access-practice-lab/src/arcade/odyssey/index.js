// index.js — Syntax Odyssey: Skyline Runner. Mounted by arcade/host.js (see arcade/GAME-CONTRACT.md).
//
// The Explorer crosses sky islands under real platformer physics (physics.js). At language gates the world freezes and
// the shared question panel opens (ui.ask); a first-try answer builds the energy bridge, any other result leaves
// stepping pads. Falling is recoverable and never touches the academic record. Auto-walk (and "Go to next gate") walks
// and jumps for the learner with the same gates and the same Shard economy.
import { GameLoop, ParticlePool, SpriteCache, fitCanvas } from "../../game-core/Loop.js";
import { SoundEngine } from "../../game-core/SoundEngine.js";
import { streakTier } from "../../game-core/Economy.js";
import { loadArcade } from "../../game-core/ArcadeStore.js";
import { html, toHtml } from "../../util.js";
import { THEMES, themeOf } from "./art-bg.js";
import { SCARVES, TRAILS, makeAvatar, tickAvatar } from "./art-avatar.js";
import { SEQUENCES_PER_LEVEL, buildSequence, doneLevels, gatePlan, levelId, recommendedChapter } from "./levels.js";
import { worldDifficulty } from "./difficulty.js";
import { Level } from "./world.js";
import { advance, bridgeKindFrom, completedLevel, newRun, restoreRun, shardCredit, unlocksFor } from "./run.js";
import { drawFrame, viewOf } from "./render.js";
import { cardHTML, describeWorld, makeText, panelHTML, pickerHTML } from "./ui.js";

const ID = "syntax-odyssey";
const LOOKS = new Set(["od-hat-cap", ...Object.keys(SCARVES), ...Object.keys(TRAILS)]);

export default {
  async create(env) {
    const { stage, session, ui, I, config, input, perf, saved, setState, finish, announce, playing, status } = env;
    const t = makeText(I);
    const offs = [];
    const timers = new Set();
    const cache = new SpriteCache();
    const parts = new ParticlePool(200);
    const av = makeAvatar();
    const fx = { reduced: Boolean(config.reducedMotion), off: Boolean(config.reducedEffects), layers: perf.quality.parallax };
    const unlocked = (loadArcade().games[ID]?.unlocked || []).filter((id) => LOOKS.has(id));
    const looks = ["", ...unlocked];
    let run = restoreRun(saved);
    let lv = null;
    let diff = null;
    let theme = themeOf(1);
    let mode = "pick"; // pick | run | gate | fall | card | fade | done
    let walking = false;
    let fade = 0;
    let fadeDir = 0;
    let fadeThen = null;
    let shake = 0;
    let clock = 0;
    let lastLabel = "";
    let labelT = 0;
    let lastShardSay = -9;
    let endArmed = 0;
    let destroyed = false;
    let size = { w: 640, h: 360, dpr: 1 };
    let ctx2d = null;
    let cacheChapter = 0;

    stage.classList.add("ax-od");
    stage.innerHTML = toHtml(html`<div class="ax-od-view"><canvas class="ax-od-canvas" tabindex="0" data-focus role="img"></canvas><div class="ax-od-layer" data-od-layer></div></div><div data-od-panel></div>`);
    const canvas = stage.querySelector("canvas");
    const layer = stage.querySelector("[data-od-layer]");
    const panelHost = stage.querySelector("[data-od-panel]");
    panelHost.innerHTML = panelHTML(t, { auto: Boolean(run?.auto || config.calm) });
    input.bindButtons(panelHost);
    const where = panelHost.querySelector("[data-od-where]");

    // ---- helpers -------------------------------------------------------------------------
    const later = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); if (!destroyed) fn(); }, ms);
      timers.add(id);
    };
    const burst = (x, y, n, o) => { if (!fx.off) parts.burst(x, y, n, o); };
    const grapples = () => session.economy.stock?.grapple || 0;
    const statusText = () => (run ? t.S("statusLine", { chapter: t.chapterName(run.chapter), l: run.level, s: run.seq, n: SEQUENCES_PER_LEVEL }) : "");
    status(statusText);
    const persist = () => {
      if (!run || !lv) return;
      // a finished screen no longer owns the run's checkpoint/gates (advance() already reset them for the next one)
      if (lv.done) return setState(run);
      run.cp = lv.cp;
      run.gates = lv.kinds.slice();
      run.pending = lv.pending;
      setState(run);
    };
    const fit = () => {
      if (destroyed) return;
      const f = fitCanvas(canvas, { dprCap: perf.quality.dprCap });
      size = { w: f.w, h: f.h, dpr: f.dpr };
      ctx2d = f.ctx;
    };
    const syncPanel = () => {
      const q = (s) => panelHost.querySelector(s);
      q('[data-od="auto"]').setAttribute("aria-pressed", String(Boolean(run?.auto)));
      const go = q('[data-od="go"]');
      go.setAttribute("aria-pressed", String(walking));
      go.querySelector('[data-lab="go"]').hidden = walking;
      go.querySelector('[data-lab="stop"]').hidden = !walking;
      const g = q('[data-od="grapple"]');
      g.hidden = grapples() < 1;
      g.querySelector("[data-od-grapples]").textContent = String(grapples());
      const e = q('[data-od="end"]');
      e.querySelector('[data-lab="end"]').hidden = Boolean(endArmed);
      e.querySelector('[data-lab="confirm"]').hidden = !endArmed;
    };
    const showCard = (htmlText) => {
      layer.innerHTML = htmlText;
      layer.classList.add("is-open");
      layer.querySelector("h2")?.focus({ preventScroll: true });
    };
    const hideCard = () => {
      layer.innerHTML = "";
      layer.classList.remove("is-open");
      canvas.focus({ preventScroll: true });
    };
    const startFade = (then) => {
      if (fx.reduced) return then();
      mode = "fade";
      fadeDir = 1;
      fadeThen = then;
    };

    // ---- screens -------------------------------------------------------------------------
    function buildScreen() {
      if (run.dp.target == null) run.dp = { target: session.view().target, auto: run.auto };
      diff = worldDifficulty({ band: config.band, level: config.level, target: run.dp.target, calm: config.calm, mode: config.mode, autoWalk: run.dp.auto });
      const seq = buildSequence({ chapter: run.chapter, level: run.level, seq: run.seq, diff });
      lv = new Level({ seq, diff, run });
      theme = themeOf(run.chapter);
      if (cacheChapter !== run.chapter) { cache.clear(); cacheChapter = run.chapter; }
      walking = false;
      fit();
      const v = viewOf(size, diff);
      lv.snapCamera(v.vw, v.vh);
      persist();
      syncPanel();
      ui.update(); // the HUD's chapter / level / screen text
    }
    function startChapter(n) {
      const auto = layer.querySelector("[data-od-auto]")?.checked ?? Boolean(config.calm);
      const look = layer.querySelector("[data-od-look]")?.value || "";
      run = newRun({ chapter: n, auto: auto || Boolean(config.calm), look });
      hideCard();
      buildScreen();
      mode = "run";
      syncPanel();
      announce(`${t.S("aScreen", { s: 1, n: SEQUENCES_PER_LEVEL })} ${statusText()}`);
    }
    function showPicker() {
      mode = "pick";
      const arc = loadArcade().games[ID]?.completed || [];
      showCard(pickerHTML(t, { recommended: recommendedChapter(arc), done: doneLevels(arc), auto: Boolean(config.calm), looks, look: "" }));
    }

    // ---- gates ---------------------------------------------------------------------------
    async function openGate(gi) {
      mode = "gate";
      walking = false;
      lv.pending = gi;
      run.qAt = session.questions;
      persist();
      syncPanel();
      announce(t.S("aGate"));
      const plan = gatePlan(run.chapter, run.level)[gi];
      let res = await ui.ask({ domains: plan.domains, formats: plan.formats });
      if (!res && !destroyed) res = await ui.ask({});
      if (!destroyed) resolveGate(gi, res);
    }
    function resolveGate(gi, res) {
      if (destroyed || !lv || lv.kinds[gi]) return;
      const kind = res?.records?.length ? bridgeKindFrom(res.records) : "full";
      if (!res?.records?.length) announce(t.S("noQuestion"));
      lv.power(gi, kind);
      run.stats.gates += 1;
      if (kind === "full" && res?.records?.length) run.stats.first += 1;
      persist();
      const g = lv.seq.gates[gi];
      burst((g.x0 + g.x1) / 2, g.y - 10, 22, { speed: 140, ttl: 900, size: 4, color: theme.glow, lift: 60 });
      SoundEngine.playLevelUp();
      announce(t.S(kind === "full" ? "aFull" : "aSegments"));
      if (["GAME_OVER", "ROUND_COMPLETE"].includes(session.state)) return endRun(false);
      mode = "run";
      hideCard();
    }

    // ---- events from the world -----------------------------------------------------------
    function onFell() {
      run.stats.falls += 1;
      walking = false;
      burst(lv.body.x, lv.body.y, 10, { speed: 90, ttl: 500, size: 3, color: "#fff" });
      const easy = Boolean(config.calm || run.dp.auto);
      if (easy) return land("safe", "aFellSafe");
      if (grapples() > 0) {
        mode = "fall";
        showCard(cardHTML(t, { id: "fall", title: t.T("fallTitle"), lines: [t.T("fallText")], actions: [{ od: "fall-grapple", label: t.T("fallGrapple", { n: grapples() }), primary: true }, { od: "fall-cp", label: t.T("fallCp") }] }));
        announce(t.S("aFellAsk"));
        return;
      }
      land("checkpoint", "aFellCp");
    }
    function land(kind, say) {
      lv.respawn(kind);
      const v = viewOf(size, diff);
      lv.snapCamera(v.vw, v.vh);
      mode = "run";
      hideCard();
      announce(t.S(say));
      syncPanel();
    }
    function useGrapple() {
      if (!lv || !["run", "fall"].includes(mode)) return;
      if (grapples() < 1) return announce(t.S("aNoGrapple"));
      if (mode === "run" && lv.body.grounded) return;
      if (!session.useGrapple()) return;
      run.stats.grapples += 1;
      burst(lv.body.x, lv.body.y, 16, { speed: 120, ttl: 700, size: 3, color: theme.glow });
      land("safe", "aGrapple");
    }
    function onShard(s) {
      const c = shardCredit(run, s);
      run.taken.push(s.id);
      if (c.n) {
        const give = session.creditShards(c.n, `od:${session.runId}:${s.id}`);
        if (c.high) run.levelBonus += give || c.n;
        else run.levelWorld += give || c.n;
        run.stats.world += give;
      }
      burst(s.x, s.y, 8, { speed: 110, ttl: 450, size: 3, color: s.high ? "#ff8a5c" : "#ffcf4a" });
      SoundEngine.playCorrect(1);
      if (clock - lastShardSay > 1.5) { lastShardSay = clock; announce(t.S("aShard")); }
      persist();
    }
    function onExit() {
      SoundEngine.playLevelTransition();
      const finishedLevel = run.level;
      const lw = run.levelWorld + run.levelBonus;
      const gates = run.stats.gates;
      const r = advance(run);
      if (r === "chapter") return endRun(true);
      if (r === "seq") {
        const keep = walking; // "Go to next gate" keeps walking across the exit ring
        return startFade(() => { buildScreen(); walking = keep; syncPanel(); announce(t.S("aScreen", { s: run.seq, n: SEQUENCES_PER_LEVEL })); mode = "run"; });
      }
      mode = "card";
      walking = false;
      showCard(cardHTML(t, { id: "lvl", title: t.T("lvlDone", { l: finishedLevel }), lines: [t.T("lvlShards", { n: lw }), t.T("lvlGates", { n: gates })], actions: [{ od: "next", label: t.T("next"), primary: true }] }));
      announce(t.S("lvlDone", { l: finishedLevel }));
      persist();
    }
    function handle(ev) {
      switch (ev.t) {
        case "jump": burst(lv.body.x + 11, lv.body.y + 34, 5, { speed: 50, ttl: 300, size: 3, color: "#fff", g: 80 }); break;
        case "land": if (ev.v > 260) burst(lv.body.x + 11, lv.body.y + 34, 6, { speed: 60, ttl: 300, size: 3, color: "#fff" }); break;
        case "shard": onShard(ev.s); break;
        case "bump": run.stats.bump += 1; shake = 0.4; SoundEngine.playError(); announce(t.S("aBump")); break;
        case "checkpoint": run.cp = lv.cp; persist(); SoundEngine.playHint(); announce(t.S("aCheck")); burst(lv.body.x, lv.body.y, 12, { speed: 90, ttl: 600, size: 3, color: "#ffcf4a", lift: 40 }); break;
        case "gate": openGate(ev.g); break;
        case "exit": onExit(); break;
        case "fell": onFell(); break;
        default: break;
      }
    }

    // ---- the end -------------------------------------------------------------------------
    function endRun(won) {
      mode = "done";
      walking = false;
      const st = run.stats;
      const unlock = unlocksFor(run, { bestStreak: session.streak.best });
      const fresh = unlock.filter((u) => !unlocked.includes(u));
      const row = (k, v) => html`<li><span>${t.T(k)}</span> <b>${v}</b></li>`;
      const summary = toHtml(html`<div class="ax-od-sum"><ul>${row("sumGates", st.gates)}${row("sumFirst", st.first)}${row("sumLevels", `${st.levels} / 3`)}${row("sumWorld", st.world)}${row("sumFalls", st.falls)}</ul>${fresh.length ? html`<p><b>${t.T("sumUnlock")}:</b> ${fresh.map((u) => t.S(`look_${u}`)).join(", ")}</p>` : ""}<p class="ax-fine">${t.T("sumNote")}</p></div>`);
      const title = won ? t.S("chapterDone", { name: t.chapterName(run.chapter) }) : t.S("runEnded");
      if (won) SoundEngine.playVictory();
      setState(null);
      finish({ won, completedLevel: completedLevel(run), unlock, title, summary });
    }

    // ---- commands ------------------------------------------------------------------------
    function toggleGo() {
      if (mode !== "run" || !playing()) return;
      walking = !walking;
      if (lv) lv.ap.wait = 0;
      announce(t.S(walking ? "aGoOn" : "aGoOff"));
      syncPanel();
    }
    function toggleAuto() {
      if (!run) return;
      run.auto = !run.auto;
      announce(t.S(run.auto ? "aAutoOn" : "aAutoOff"));
      syncPanel();
      persist();
    }
    const describe = () => (lv ? describeWorld(t, lv.status(), { auto: Boolean(run.auto) }) : "");
    function onClick(e) {
      const pick = e.target.closest("[data-od-pick]");
      if (pick) return startChapter(Number(pick.dataset.odPick));
      const b = e.target.closest("[data-od]");
      if (!b) return;
      switch (b.dataset.od) {
        case "go": toggleGo(); break;
        case "auto": toggleAuto(); break;
        case "grapple": useGrapple(); break;
        case "where": where.textContent = describe(); announce(where.textContent); break;
        case "fall-grapple": useGrapple(); break;
        case "fall-cp": land("checkpoint", "aFellCp"); break;
        case "next": hideCard(); startFade(() => { buildScreen(); mode = "run"; announce(statusText()); }); break;
        case "end":
          if (!endArmed) { endArmed = 1; syncPanel(); announce(t.S("endConfirm")); later(() => { endArmed = 0; syncPanel(); }, 4000); }
          else if (run && mode === "run") endRun(false);
          break;
        default: break;
      }
    }
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.target?.closest?.("input, textarea, select")) return;
      if (e.code === "KeyN") toggleGo();
      else if (e.code === "KeyT") toggleAuto();
      else if (e.code === "KeyG") useGrapple();
    }
    // keyboard users can hold the on-screen movement buttons too (Space or Enter on a focused button)
    const padKey = (down) => (e) => {
      const b = e.target.closest?.("[data-act]");
      if (!b || !["Space", "Enter"].includes(e.code)) return;
      e.preventDefault();
      if (down) input.press(b.dataset.act, e.repeat);
      else input.release(b.dataset.act);
    };
    const kd = padKey(true);
    const ku = padKey(false);
    stage.addEventListener("click", onClick);
    stage.addEventListener("keydown", kd);
    stage.addEventListener("keyup", ku);
    window.addEventListener("keydown", onKey);
    // the Grapple Save button appears (and its count changes) when the shop sells or the game spends one
    offs.push(session.bus.on("purchase", syncPanel), session.bus.on("upgrade", syncPanel));
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(fit) : null;
    ro?.observe(canvas);
    window.addEventListener("resize", fit);
    offs.push(() => stage.removeEventListener("click", onClick), () => stage.removeEventListener("keydown", kd), () => stage.removeEventListener("keyup", ku), () => window.removeEventListener("keydown", onKey), () => ro?.disconnect(), () => window.removeEventListener("resize", fit));

    // ---- the loop ------------------------------------------------------------------------
    const frame = { t: 0 };
    function update(ms) {
      clock += ms / 1000;
      if (fadeDir) {
        fade = Math.max(0, Math.min(1, fade + (fadeDir * ms) / 380));
        if (fadeDir > 0 && fade >= 1) { fadeDir = -1; const f = fadeThen; fadeThen = null; f?.(); }
        else if (fadeDir < 0 && fade <= 0) fadeDir = 0;
      }
      if (!lv) return;
      const pressed = input.consume("jump");
      const l = input.isDown("left");
      const r = input.isDown("right");
      if (mode === "run" && playing()) {
        if (walking && (l || r || pressed)) { walking = false; syncPanel(); }
        const inp = walking ? lv.drive(ms) : { left: l, right: r, jump: input.isDown("jump"), jumpPressed: pressed };
        lv.step(ms, inp, walking);
        tickAvatar(av, lv.body, ms);
        const q = lv.ev.splice(0);
        for (const ev of q) handle(ev);
      }
      shake = Math.max(0, shake - ms / 1000);
      parts.step(ms);
      const v = viewOf(size, diff);
      lv.follow(ms, v.vw, v.vh, fx.reduced);
      labelT += ms;
      if (labelT > 900) {
        labelT = 0;
        const label = `${t.S("canvasLabel")} ${statusText()}. ${describe()}`;
        if (label !== lastLabel) { lastLabel = label; canvas.setAttribute("aria-label", label); }
      }
    }
    function draw() {
      if (!lv || !ctx2d) return;
      frame.t += 1 / 60;
      const q = perf.quality;
      fx.layers = fx.reduced ? 2 : q.parallax;
      drawFrame({ ctx: ctx2d, cache, size, lv, diff, theme, t: clock, av, parts, fx, walking, look: run.look, tier: streakTier(session.streak.streak).name, shake, fade });
    }
    const loop = new GameLoop({
      update,
      draw,
      perf,
      // GameLoop calls these as methods of itself; the browser's own functions throw "Illegal invocation" when called that way
      raf: (f) => requestAnimationFrame(f),
      caf: (id) => cancelAnimationFrame(id),
      onQuality: (q) => { parts.setLimit(fx.off ? 0 : q.particles); fit(); },
    });
    parts.setLimit(fx.off ? 0 : perf.quality.particles);
    canvas.setAttribute("aria-label", t.S("canvasLabel"));
    fit();

    // ---- start or resume -----------------------------------------------------------------
    if (run) {
      buildScreen();
      mode = "run";
      if (run.pending !== null && !lv.kinds[run.pending]) {
        mode = "gate";
        const open = ["QUESTION_ACTIVE", "RECOVERY", "ANSWER_EVALUATION"].includes(session.state);
        if (!open) later(() => (session.questions > run.qAt ? resolveGate(run.pending, { records: session.records.slice(-1) }) : openGate(run.pending)), 0);
      }
    } else {
      // a placeholder screen so the canvas has a world behind the chapter picker
      run = newRun({ chapter: recommendedChapter(loadArcade().games[ID]?.completed || []) });
      const d = worldDifficulty({ band: config.band, level: config.level, calm: config.calm, mode: config.mode, autoWalk: Boolean(config.calm) });
      diff = d;
      theme = themeOf(run.chapter);
      lv = new Level({ seq: buildSequence({ chapter: run.chapter, level: 1, seq: 1, diff: d }), diff: d, run });
      showPicker();
    }
    const hintNow = () => {
      const w = lv.ap.wait;
      const h = lv.drive(16);
      lv.ap.wait = w;
      return h;
    };
    loop.start();

    return {
      destroy() {
        destroyed = true;
        loop.destroy();
        for (const o of offs) o();
        for (const id of timers) clearTimeout(id);
        timers.clear();
        parts.clear();
        cache.clear();
        layer.innerHTML = "";
      },
      resize: fit,
      onSettings(s) {
        fx.reduced = s.reducedMotion === true || (s.reducedMotion == null && typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
        fx.off = Boolean(s.reducedEffects);
        parts.setLimit(fx.off ? 0 : perf.quality.particles);
        if (fx.off) parts.clear();
      },
      onAnswered(res) {
        if (mode === "gate" && run?.pending !== null) resolveGate(run.pending, res);
      },
      /** Read-only status for the browser tests (frame meter, quality tier, route state). */
      debug() {
        const b = lv?.body;
        return { mode, walking, level: levelId(run?.chapter || 1, run?.level || 1), seq: run?.seq, run: JSON.parse(JSON.stringify(run || {})), quality: perf.quality.id, p95: loop.meter.p95, avg: loop.meter.avg, frames: loop.frames, body: b && { x: b.x, y: b.y, vx: b.vx, vy: b.vy, grounded: b.grounded }, hint: lv && mode === "run" ? hintNow() : null, canvasLabel: canvas.getAttribute("aria-label"), width: lv?.seq.width, reduced: fx.reduced };
      },
    };
  },
};
