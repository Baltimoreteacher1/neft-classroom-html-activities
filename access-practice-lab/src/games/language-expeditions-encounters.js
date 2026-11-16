// Language Expeditions encounters: what the learner meets on the trail inside a land.
//
// - An obstacle (one per land, halfway between the first and second stop) stops the explorer. The walk panel shows a
//   short prompt in the land's domain that unlocks it: Listening hears a direction and picks it, Reading reads a sign
//   and picks, Speaking says a given sentence out loud and presses "I said it" (never scored), Writing types a word
//   that a simple rule checks. Judged prompts use the engine's miss -> hint -> reveal loop, so nobody is ever stuck.
//   A cleared obstacle animates away and stays cleared.
// - A character stands at each trailhead. Talking is optional: two short turns, the character's words follow the
//   support mode like Listening stops, the learner picks a reply (judged) or says a frame aloud (not scored).
// - Two of the seven collectibles in each land are word cards: picking one up shows the word, a picture, a short
//   definition, the Spanish and a Listen button. Found words go in a word bag shown at each gate and at the summary.
// - Walking progress is saved without a click: when the explorer stops for a moment, after a pickup, and when the
//   page is hidden. Never every frame, never while a button or key is held (a re-render would drop the hold).
//
// State lives in s.enc (see encState in …-encounters-view.js). The plan hook clears obstacles in the same plan step
// as the walk that reaches them (goSteps / walkPlan), so the QA playthrough does not grow.
import { speak } from "../speech.js";
import { toHtml } from "../util.js";
import { judge, newRound, settled, takeHint } from "./engine.js";
import {
  OB_GAP,
  WORD_SLOTS,
  charX,
  hasWordArt,
  obstacleX,
  wordSlot,
} from "./language-expeditions-encounters-art.js";
import {
  TALK_NEAR,
  encOf,
  encState,
  wordCardHTML,
} from "./language-expeditions-encounters-view.js";

export {
  cropHTML,
  encOf,
  encState,
  walkExtraHTML,
  wordBagHTML,
} from "./language-expeditions-encounters-view.js";

const DOMAIN = ["listening", "reading", "speaking", "writing"];
const GO = { click: "[data-lexp-go]" };
const obOf = (env, k) => encOf(env)?.obstacles?.find((o) => o.land === k) || null;
const charOf = (env, k) => encOf(env)?.characters?.find((c) => c.land === k) || null;
const isCleared = (s, k) => encState(s).cleared.includes(k);
const norm = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** The Writing rule: the typed answer matches one of the accepted answers (case, spaces and punctuation ignored). */
export const typedOK = (text, O) => O.accept.some((a) => norm(a) === norm(text));

let pendingFocus = "";
let restore = "";
let spoken = "";
const voice = (env, text) => {
  if (typeof window === "undefined" || !text) return;
  const p = env.ctx?.prefs || {};
  speak(text, { rate: p.rate || 0.9, voiceURI: p.readingVoice || "" });
};

/** True when walking from `from` to `to` in land k would pass a closed obstacle. */
function crosses(s, env, k, from, to) {
  if (!obOf(env, k) || isCleared(s, k) || typeof from !== "number") return false;
  const ox = obstacleX(k);
  return (from < ox && to > ox) || (from > ox && to < ox);
}
function openObstacle(s, k) {
  const e = encState(s);
  e.meet = k;
  e.talk = null;
  if (e.ob?.k !== k)
    e.ob = { k, rs: newRound(), text: "", said: false, plays: 0, tx: false, keys: false };
}
function clearObstacle(s, k) {
  const e = encState(s);
  if (!e.cleared.includes(k)) e.cleared.push(k);
}

/** "Walk me to the next stop": stop at a closed obstacle in the way and open its prompt instead of skipping it. */
export function blockGo(s, env, to) {
  const e = encState(s);
  e.talk = null;
  const k = s.land;
  if (!crosses(s, env, k, s.x, to)) {
    if (e.meet === k && isCleared(s, k)) e.meet = -1;
    return false;
  }
  s.x = obstacleX(k) + (s.x < obstacleX(k) ? -OB_GAP : OB_GAP);
  openObstacle(s, k);
  return true;
}

/** Clicks inside the walk panel. Returns undefined when the button is not an encounter control. */
export function encClick(b, s, env) {
  if (s.at !== "walk" || !encOf(env)) return undefined;
  const d = b.dataset;
  const e = encState(s);
  const k = s.land;
  const has = (a) => b.hasAttribute(a);
  const O = obOf(env, k);
  const ob = e.meet === k && e.ob?.k === k ? e.ob : null;
  const C = charOf(env, k);
  const talk = e.talk?.k === k && C ? e.talk : null;
  const turn = talk ? C.turns[talk.t] : null;
  if (has("data-g-hint")) {
    if (turn?.kind === "pick" && !settled(talk.rs)) return takeHint(talk.rs, env) >= 0;
    if (ob && O.kind !== "say" && !settled(ob.rs)) return takeHint(ob.rs, env) >= 0;
    return false;
  }
  if (has("data-lexp-card-close"))
    return e.card ? ((e.card = null), (restore = ".lexp-pad-btn"), true) : false;
  // ── the obstacle prompt ──
  if (d.lexpObPick !== undefined) {
    const i = Number(d.lexpObPick);
    if (!ob || !O.options || settled(ob.rs) || ob.rs.picks.includes(i)) return false;
    ob.rs.picks.push(i);
    judge(ob.rs, i === O.answer, env, { id: O.id, skill: DOMAIN[k], extra: { type: "obstacle" } });
    if (settled(ob.rs)) clearObstacle(s, k);
    pendingFocus = ".lexp-ob-panel .gs-feedback";
    return true;
  }
  if (has("data-lexp-ob-check")) {
    if (!ob || O.kind !== "write" || settled(ob.rs)) return false;
    const box = b.closest(".lexp-panel")?.querySelector?.("[data-lexp-ob-text]");
    if (box) ob.text = String(box.value || "").slice(0, 60);
    judge(ob.rs, typedOK(ob.text, O), env, {
      id: O.id,
      skill: DOMAIN[k],
      extra: { type: "obstacle" },
    });
    if (settled(ob.rs)) {
      clearObstacle(s, k);
      if (ob.rs.status === "revealed") ob.text = O.accept[0];
    }
    pendingFocus = ".lexp-ob-panel .gs-feedback";
    return true;
  }
  if (has("data-lexp-ob-said")) {
    if (!ob || O.kind !== "say" || ob.said) return false;
    ob.said = true;
    clearObstacle(s, k);
    pendingFocus = ".lexp-ob-head";
    return true;
  }
  if (has("data-lexp-ob-play")) {
    if (!ob || !O.say) return false;
    ob.plays += 1;
    if (env.support === "C" && ob.plays > 2) env.use("audio-replay");
    voice(env, O.say.en);
    return true;
  }
  if (has("data-lexp-ob-tx"))
    return ob && !ob.tx ? ((ob.tx = true), env.use("transcript"), true) : false;
  if (has("data-lexp-ob-keys"))
    return ob && !ob.keys ? ((ob.keys = true), env.use("gloss"), true) : false;
  if (has("data-lexp-ob-close")) {
    if (e.meet !== k || !isCleared(s, k)) return false;
    e.meet = -1;
    restore = "[data-lexp-move='1']";
    return true;
  }
  // ── the character ──
  if (d.lexpTalk !== undefined) {
    if (!C || Number(d.lexpTalk) !== k || Math.abs(s.x - charX(k)) >= TALK_NEAR + 60) return false;
    e.talk = { k, t: 0, rs: newRound(), said: false, tx: false };
    pendingFocus = ".lexp-talk-head";
    return true;
  }
  if (!talk) return undefined;
  if (d.lexpTalkPick !== undefined) {
    const i = Number(d.lexpTalkPick);
    if (turn.kind !== "pick" || settled(talk.rs) || talk.rs.picks.includes(i)) return false;
    talk.rs.picks.push(i);
    judge(talk.rs, i === turn.answer, env, {
      id: `${C.id}:${talk.t}`,
      skill: "listening",
      extra: { type: "talk" },
    });
    pendingFocus = ".lexp-talk .gs-feedback";
    return true;
  }
  if (has("data-lexp-talk-said"))
    return turn.kind === "say" && !talk.said ? ((talk.said = true), true) : false;
  if (has("data-lexp-talk-play")) return (voice(env, turn.line.en), false);
  if (has("data-lexp-talk-tx"))
    return !talk.tx ? ((talk.tx = true), env.use("transcript"), true) : false;
  if (has("data-lexp-talk-next")) {
    if (!(turn.kind === "say" ? talk.said : settled(talk.rs))) return false;
    if (talk.t + 1 < C.turns.length) {
      e.talk = { k, t: talk.t + 1, rs: newRound(), said: false, tx: false };
      pendingFocus = ".lexp-talk-head";
    } else {
      if (!e.talked.includes(k)) e.talked.push(k);
      e.talk = null;
      restore = "[data-lexp-talk]";
    }
    return true;
  }
  if (has("data-lexp-talk-end")) return ((e.talk = null), (restore = "[data-lexp-talk]"), true);
  return undefined;
}

/** Text typed in the obstacle box is kept in state so a re-render does not lose it. */
export function encInput(el, s) {
  if (!el.matches?.("[data-lexp-ob-text]")) return false;
  const e = encState(s);
  if (e.ob) e.ob.text = String(el.value || "").slice(0, 60);
  return true;
}

// ── QA plan ──────────────────────────────────────────────────────────────────────────────
function answerSteps(O) {
  if (O.kind === "say") return [{ click: "[data-lexp-ob-said]" }];
  if (O.kind === "write")
    return [{ fill: ["[data-lexp-ob-text]", O.accept[0]] }, { click: "[data-lexp-ob-check]" }];
  return [{ click: `[data-lexp-ob-pick="${O.answer}"]` }];
}
/** Steps that follow a "Walk me" click from `from` to `to` in land k: clear the obstacle it stops at, then walk on. */
export function goSteps(s, env, k, from, to) {
  return crosses(s, env, k, from, to) ? [...answerSteps(obOf(env, k)), GO] : [];
}
/** The walk step while an obstacle prompt is open (null when none is open). */
export function walkPlan(s, env, wrong) {
  const e = encState(s);
  const k = s.land;
  const O = obOf(env, k);
  if (!O || e.meet !== k || isCleared(s, k) || e.ob?.k !== k) return null;
  if (wrong && O.options) {
    const miss = O.options.findIndex((_, i) => i !== O.answer && !e.ob.rs.picks.includes(i));
    if (miss >= 0) return [{ click: `[data-lexp-ob-pick="${miss}"]` }];
  }
  if (wrong && O.kind === "write" && !e.ob.rs.tries)
    return [{ fill: ["[data-lexp-ob-text]", "rock"] }, { click: "[data-lexp-ob-check]" }];
  return [...answerSteps(O), GO];
}

// ── on screen ────────────────────────────────────────────────────────────────────────────
/** After each render: obstacles shown open or cleared, the crop filled, focus moved, a heard prompt auto-played. */
export function encMount(root, scene, s, env) {
  if (!encOf(env)) return;
  const e = encState(s);
  scene
    .querySelectorAll("[data-ob]")
    .forEach((n) => n.classList.toggle("is-cleared", e.cleared.includes(Number(n.dataset.ob))));
  const crop = root.querySelector("[data-lexp-crop]");
  if (crop && !crop.firstChild) {
    const c = scene.cloneNode(true);
    c.classList.remove("is-driving");
    c.classList.add("lexp-crop-scene");
    c.removeAttribute("aria-hidden");
    c.querySelector(".lexp-hero")?.classList.remove("is-walking");
    crop.append(c);
  }
  const sel = pendingFocus || restore;
  if (sel) {
    const n = root.querySelector(sel);
    if (n && !n.hasAttribute("tabindex") && !/^(BUTTON|A|INPUT|TEXTAREA)$/.test(n.tagName))
      n.setAttribute("tabindex", "-1");
    n?.focus({ preventScroll: true });
    // A prompt that just opened is brought into view only as far as needed, so the scene stays on screen.
    if (pendingFocus && n?.getBoundingClientRect().bottom > innerHeight) n.scrollIntoView({ block: "nearest" });
    pendingFocus = "";
    restore = "";
  }
  if (s.at !== "walk" || env.sup.audio !== "auto") return;
  const k = s.land;
  const O = obOf(env, k);
  const C = charOf(env, k);
  let text = "";
  let key = "";
  if (e.talk?.k === k && C) {
    key = `${s.sid}:${C.id}:${e.talk.t}`;
    text = C.turns[e.talk.t].line.en;
  } else if (e.meet === k && O?.say && e.ob?.k === k && !isCleared(s, k)) {
    key = `${s.sid}:${O.id}`;
    text = O.say.en;
  }
  if (key && key !== spoken) {
    spoken = key;
    setTimeout(() => voice(env, text), 300);
  }
}

const selOf = (el) => {
  const a = [...(el?.attributes || [])].find((x) => x.name.startsWith("data-lexp-"));
  return a ? (a.value ? `[${a.name}="${a.value}"]` : `[${a.name}]`) : "";
};

/**
 * Hooks for the explore loop (…-explore.js drive()): `move` keeps the explorer from passing a closed obstacle, `tick`
 * runs every frame (Talk button, word cards, saving), `enter` lets Enter start a talk, `stop` cleans up.
 * `changed` is the runner's save-and-re-render; it is only called from a timer, never inside the frame callback.
 */
export function encHooks(root, s, env, changed) {
  if (!encOf(env) || !changed) return null;
  const e = encState(s);
  const k = s.land;
  const E = encOf(env);
  const talkBtn = root.querySelector("[data-lexp-talk]");
  const slot = root.querySelector("[data-lexp-wordslot]");
  let lastX = s.x;
  let movedAt = 0;
  let gotN = s.got.length;
  let dirty = false;
  let urgent = false;
  let stopped = false;
  let queued = 0;
  const save = (sel) => {
    if (queued || stopped) return;
    queued = setTimeout(() => {
      queued = 0;
      if (stopped) return;
      dirty = false;
      urgent = false;
      if (sel) pendingFocus = sel;
      else
        restore = selOf(document.activeElement?.closest?.(".lexp") ? document.activeElement : null);
      changed();
    }, 0);
  };
  const hide = () => {
    if (dirty && !stopped && document.visibilityState !== "visible") changed();
  };
  const pagehide = () => dirty && !stopped && changed();
  document.addEventListener("visibilitychange", hide);
  window.addEventListener("pagehide", pagehide);
  return {
    move(x0, nx) {
      if (!obOf(env, k) || isCleared(s, k)) return nx;
      const ox = obstacleX(k);
      let x = nx;
      if (x0 <= ox - OB_GAP && nx > ox - OB_GAP) x = ox - OB_GAP;
      else if (x0 >= ox + OB_GAP && nx < ox + OB_GAP) x = ox + OB_GAP;
      if (x !== nx && (e.meet !== k || e.talk)) {
        openObstacle(s, k);
        s.x = x;
        save(".lexp-ob-head");
      }
      return x;
    },
    tick(x, holding, now) {
      if (x !== lastX) {
        lastX = x;
        movedAt = now;
        dirty = true;
      }
      if (s.got.length !== gotN) {
        for (const id of s.got.slice(gotN)) {
          const n = wordSlot(id);
          const land = Number(String(id).split("-")[0]);
          const w = n >= 0 ? E.words?.filter((v) => v.land === land)[n] : null;
          if (w && !e.words.includes(w.id)) {
            e.words.push(w.id);
            e.card = w.id;
            if (slot) slot.innerHTML = toHtml(wordCardHTML(w, env.I));
          }
        }
        gotN = s.got.length;
        dirty = true;
        urgent = true;
      }
      if (talkBtn) {
        const near = Math.abs(x - charX(k)) < TALK_NEAR;
        if (talkBtn.hidden === near) talkBtn.hidden = !near;
      }
      if (dirty && !holding && (urgent || now - movedAt > 600)) save();
    },
    enter() {
      if (!talkBtn || talkBtn.hidden) return false;
      talkBtn.click();
      return true;
    },
    stop() {
      stopped = true;
      clearTimeout(queued);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", pagehide);
    },
  };
}

// ── content checks (appended to validateContent in …-rules.js) ───────────────────────────
const WORD_SLOTS_N = WORD_SLOTS.length;
const KIND = ["listen", "read", "say", "write"];
const bi = (o) => Boolean(o?.en?.trim?.() && o?.es?.trim?.());
const choiceErrors = (x, at) => {
  const e = [];
  if (!Array.isArray(x.options) || x.options.length < 3 || x.options.some((o) => !bi(o)))
    e.push(`${at}: needs at least three bilingual options`);
  else if (!(Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length))
    e.push(`${at}: answer out of range`);
  if (!bi(x.hint) || !bi(x.explain) || x.hint?.en === x.explain?.en)
    e.push(`${at}: needs a bilingual hint and a different explanation`);
  return e;
};
/** Problems in bands[b].encounters for both bands. */
export function validateEncounters(doc) {
  const errs = [];
  const ids = new Set();
  const seen = (id, at) => {
    if (!id || ids.has(id)) errs.push(`${at}: missing or duplicate id`);
    ids.add(id);
  };
  for (const band of ["3-5", "6-8"]) {
    const B = doc.bands?.[band];
    const E = B?.encounters;
    if (!E) {
      errs.push(`${band}: encounters missing`);
      continue;
    }
    let says = 0;
    for (let k = 0; k < 4; k += 1) {
      const O = (E.obstacles || []).filter((o) => o.land === k);
      const C = (E.characters || []).filter((c) => c.land === k);
      const W = (E.words || []).filter((w) => w.land === k);
      if (O.length !== 1) errs.push(`${band}: land ${k} needs exactly one obstacle`);
      if (C.length !== 1) errs.push(`${band}: land ${k} needs exactly one character`);
      if (W.length !== WORD_SLOTS_N) errs.push(`${band}: land ${k} needs ${WORD_SLOTS_N} word cards`);
      for (const o of O) {
        const at = `${band}/${o.id}`;
        seen(o.id, at);
        if (o.kind !== KIND[k]) errs.push(`${at}: land ${k} obstacles are ${KIND[k]} prompts`);
        if (!bi(o.name) || !bi(o.intro) || !bi(o.done)) errs.push(`${at}: name, intro and done must be bilingual`);
        if (o.kind === "listen" && (!bi(o.say) || !bi(o.question))) errs.push(`${at}: needs a bilingual say and question`);
        if (o.kind === "read" && (!o.sign?.trim() || !bi(o.question) || o.say))
          errs.push(`${at}: needs a sign and a bilingual question, and is never read aloud`);
        if (o.kind === "listen" || o.kind === "read") errs.push(...choiceErrors(o, at));
        if (o.kind === "say" && !bi(o.frame)) errs.push(`${at}: needs a bilingual frame`);
        if (o.kind === "write") {
          if (!bi(o.prompt) || !bi(o.hint) || !bi(o.explain)) errs.push(`${at}: needs a bilingual prompt, hint and explanation`);
          if (!o.accept?.length || !typedOK(o.accept[0], o)) errs.push(`${at}: needs accepted answers`);
        }
      }
      for (const c of C) {
        const at = `${band}/${c.id}`;
        seen(c.id, at);
        if (!bi(c.name) || c.turns?.length !== 2) errs.push(`${at}: needs a bilingual name and two turns`);
        (c.turns || []).forEach((t, n) => {
          if (!bi(t.line)) errs.push(`${at}/${n}: the line must be bilingual`);
          if (t.kind === "say") {
            says += 1;
            if (!bi(t.frame)) errs.push(`${at}/${n}: needs a bilingual frame`);
          } else if (t.kind === "pick") errs.push(...choiceErrors(t, `${at}/${n}`));
          else errs.push(`${at}/${n}: turn kind must be pick or say`);
        });
      }
      for (const w of W) {
        const at = `${band}/${w.id}`;
        seen(w.id, at);
        if (!w.en?.trim() || !w.es?.trim() || !bi(w.def) || !hasWordArt(w.art))
          errs.push(`${at}: needs the word, its Spanish, a bilingual definition and known art`);
      }
    }
    if (says < 1) errs.push(`${band}: one character turn must be a say-it-aloud turn`);
    const speakIds = new Set(
      (B.lands || []).flatMap((l) => l.acts || []).filter((a) => a.type === "speak").map((a) => a.id),
    );
    for (const [id, sc] of Object.entries(E.scenes || {}))
      if (!speakIds.has(id) || !bi(sc.caption)) errs.push(`${band}: scene ${id} needs a speaking stop and a bilingual caption`);
  }
  return errs;
}
