// Language Expeditions (Expediciones de lenguaje): a side-scrolling journey through four lands, one per WIDA domain
// (Listening, Reading, Speaking, Writing). Grades 3-5 walk the Lantern Trail (night forest, a lantern that glows
// brighter); grades 6-8 follow the Canyon Signal (desert canyon at sunset, a radio whose signal grows). The parallax
// camera glides to each stop (language-expeditions-world.js); an activity panel waits there (…-view.js).
//
// Listening and Reading use the standard engine loop (miss -> hint -> revise -> reveal). Listening audio follows the
// support mode like Direction Dash: A plays once and shows the words, B keeps the words one tap away (saved as help),
// C is audio only and replays after the second are saved as help. Reading is never read aloud.
// Speaking is never scored: the learner speaks (recording stays in memory, speech-to-text lands in an editable box,
// typing always works), says "I said it", ticks a self-check and can hear a model. Writing gets the lab's rule-based
// checks (length, sentences, a required connector, capitals and end punctuation via lang/errors.js), a self-check and
// a model. Each finished land earns a stamp; stamps are not a score. Any land can be opened from the journey bar.
// Inside a land the learner steers the explorer to each stop and gathers collectibles (…-explore.js).
import { keepInView } from "../keep-in-view.js";
import { cancelDictation, toggleDictation } from "../dictation-ui.js";
import { isRecording, start as startRec, stop as stopRec, takesFor } from "../recorder.js";
import { playRecording, speak } from "../speech.js";
import { html, judge, newRound, raw, settled, shuffle, takeHint } from "./engine.js";
import {
  drive,
  ensure,
  isNear,
  targetX,
  walkHTML,
  whereOf,
} from "./language-expeditions-explore.js";
import {
  aim,
  camPct,
  gateX,
  paint,
  sceneMarkup,
  stopX,
  trailX,
} from "./language-expeditions-world.js";
import {
  barHTML,
  complete,
  gateHTML,
  judgedHTML,
  mapHTML,
  recKey,
  speakHTML,
  summaryHTML,
  writeHTML,
} from "./language-expeditions-view.js";

import { FULL, QUICK, checkWriting, validateContent } from "./language-expeditions-rules.js";
import { syncGear } from "./language-expeditions-feel-gear.js"; // feel: gear
import { touchPadHTML } from "./language-expeditions-feel-pad.js"; // feel: phone controls
import { paintFeel } from "./language-expeditions-feel-world.js"; // feel: restored lands + finale
// teacher: passport page, one-land links and teacher-written stops
import { assignedFinish, passportButton, passportClick, passportHTML } from "./language-expeditions-passport.js";
import { decodeStop, landParam } from "./language-expeditions-links.js";
// encounters: obstacles, characters, word cards, the world crop and continuous save
import {
  blockGo,
  cropHTML,
  encClick,
  encHooks,
  encInput,
  encMount,
  goSteps,
  walkExtraHTML,
  walkPlan,
  wordBagHTML,
} from "./language-expeditions-encounters.js";
const bandOf = (env) =>
  env.content.lands ? env.content : env.content.bands?.[env.band] || { lands: [] };
// teacher: a teacher-written stop (decoded once at init, kept in state) replaces the authored one.
const actOf = (env, s, k = s.land, i = s.lands[k].i) =>
  s.custom?.land === k && s.custom.i === i ? s.custom.act : bandOf(env).lands[k].acts[i];
const recommended = (s) => s.lands.findIndex((L) => !L.stamp);

function actState(a, env) {
  const base = { id: a.id, type: a.type, rs: newRound(), words: false };
  if (a.type === "speak")
    return { ...base, said: false, text: "", self: [], model: false, done: false };
  if (a.type === "write")
    return { ...base, text: "", wn: 0, fb: null, self: [], model: false, done: false };
  const n =
    a.type === "read-order"
      ? a.items.length
      : a.type === "listen-place"
        ? a.spots.length
        : (a.choices || a.options).length;
  return {
    ...base,
    plays: 0,
    tx: false,
    pick: -1,
    seq: [],
    order:
      a.type === "listen-place" ? [...Array(n).keys()] : shuffle([...Array(n).keys()], env.rng),
  };
}

// Module-level view memory (never saved): the live scene node, where the camera last stood, focus and autoplay.
let live = null; // { band, node, x }
let notify = null;
let focusSel = "";
let spokenKey = "";
let walkTimer = 0;
const motionOK = () =>
  typeof matchMedia === "function" &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.documentElement.dataset.comfortMotion !== "calm";
const prefsOf = (env) => env.ctx?.prefs || {};
const playAct = (a, env) => {
  if (typeof window === "undefined") return;
  speak([a.say.en, a.question?.en].filter(Boolean), {
    rate: prefsOf(env).rate || 0.9,
    voiceURI: prefsOf(env).readingVoice || "",
  });
};
const camX = (s) => {
  if (s.at === "map") return trailX(s.land);
  if (s.at === "walk") return s.x;
  if (s.at !== "land") return gateX(s.land);
  return stopX(s.land, s.lands[s.land].i, s.land < 2 ? 3 : 2);
};
const sceneState = (s) => {
  const lit = new Set();
  let n = 0;
  let total = 0;
  s.lands.forEach((L, k) =>
    L.acts.forEach((r, i) => {
      total += 1;
      if (complete(r)) {
        lit.add(`${k}-${i}`);
        n += 1;
      }
    }),
  );
  return {
    lit,
    open: new Set(s.lands.flatMap((L, k) => (L.stamp ? [k] : []))),
    glow: total ? n / total : 0,
    got: new Set(s.got || []),
  };
};

// teacher: land=… opens that land's walk mode once, also for a session resumed from an earlier visit (never mid-stop).
function assignLand(s, env) {
  const k = landParam(env.params?.land);
  if (k < 0 || !s.lands[k] || s.assigned === k || s.at === "land") return;
  Object.assign(s, { at: "walk", land: k, assigned: k, x: null });
  ensure(s);
}

// teacher: a stop link that did not validate falls back to the authored stop, and the learner is told so.
const customNoteHTML = (s, I) =>
  s.customNote && (s.at === "map" || s.customNote.land < 0 || s.land === s.customNote.land)
    ? html`<p class="lexp-custom-note" role="note">
        ${I.T("Your teacher's stop link could not be opened, so this land uses its usual stops.", "No se pudo abrir el enlace de la parada de tu docente, así que esta tierra usa sus paradas de siempre.")}
      </p>`
    : "";

function production(r, env, skill) {
  if (r.done) return;
  r.done = true;
  const help = r.rs.h > 0 || r.helped;
  env.report({
    id: r.id,
    skill,
    ok: true,
    first: !help && (skill === "speaking" || r.wn === 1),
    hints: r.rs.h,
    revised: (r.wn || 1) > 1,
    production: true,
    selfCheck: r.self.length,
  });
}

export default {
  id: "language-expeditions",

  init(env) {
    const band = bandOf(env);
    const s = {
      sid: env.rng.int(1e9),
      at: "map",
      land: 0,
      x: null,
      got: [],
      finished: false,
      lands: band.lands.map((land) => ({
        i: 0,
        stamp: false,
        acts: land.acts
          .slice(0, env.count(FULL[land.domain], QUICK[land.domain]))
          .map((a) => actState(a, env)),
      })),
    };
    // teacher: land=… opens that land's walk mode; stop=… swaps in a teacher-written stop.
    const params = env.params || {};
    assignLand(s, env);
    if (params.stop) {
      const dom = (n) => band.lands[n]?.domain;
      const c = decodeStop(params.stop, band, (n) => s.lands[n]?.acts.length);
      if (c.ok && s.lands[c.land]?.acts[c.i] && dom(c.land) === (c.act.type === "write" ? "writing" : "reading")) {
        s.custom = { land: c.land, i: c.i, act: c.act };
        s.lands[c.land].acts[c.i] = actState(c.act, env);
      } else s.customNote = { land: c.land };
    }
    return s;
  },

  done: (s) => s.finished,
  progress(s) {
    const all = s.lands.flatMap((L) => L.acts);
    return { done: all.filter(complete).length, total: all.length };
  },

  view(s, env) {
    const I = env.I;
    const band = bandOf(env);
    assignLand(s, env); // teacher
    ensure(s);
    syncGear(s); // feel: old saves earn the gear their progress already shows
    const b = env.band === "6-8" ? "6-8" : "3-5";
    const x = live?.band === b && live.x != null ? live.x : camX(s);
    const layers = sceneMarkup(b).replace(
      /data-layer="(\w+)"/g,
      (m, name) => `${m} style="transform:translateX(${camPct(name, x).toFixed(3)}%)"`,
    );
    const rec = recommended(s);
    let panel;
    // teacher: passport button and the center-rotation finish ride on the gate and the summary
    const extra = html`${assignedFinish(s, I)}${passportButton(I)}`;
    if (s.at === "map") panel = mapHTML(s, band, env, rec);
    else if (s.at === "gate") panel = gateHTML(s, band, env, rec, extra, wordBagHTML(s, env));
    else if (s.at === "summary")
      panel = summaryHTML(s, band, env, passportButton(I), wordBagHTML(s, env));
    else if (s.at === "passport") panel = passportHTML(s, band, env, actOf);
    else if (s.at === "walk") {
      const L = s.lands[s.land];
      panel = walkHTML(
        s,
        band.lands[s.land],
        L.i < L.acts.length ? actOf(env, s) : null,
        env,
        b,
        walkExtraHTML(s, env, b), // encounters
      );
    } else {
      const land = band.lands[s.land];
      const L = s.lands[s.land];
      const r = L.acts[L.i];
      const a = actOf(env, s); // teacher: may be a teacher-written stop
      const body =
        a.type === "speak"
          ? html`${cropHTML(a, env) /* encounters: the place you walked to */}${speakHTML(s, r, a, env)}`
          : a.type === "write"
            ? writeHTML(s, r, a, env)
            : judgedHTML(s, r, a, env, land.domain);
      const nextBtn =
        settled(r.rs) && a.type !== "speak" && a.type !== "write"
          ? html`<div class="gs-actions">
              <button type="button" class="btn btn-primary btn-big" data-lexp-next>
                ${I.T(L.i + 1 === L.acts.length ? "Head to the gate" : "Walk on", L.i + 1 === L.acts.length ? "Ir a la puerta" : "Seguir caminando")}
              </button>
            </div>`
          : "";
      panel = html`<div class="lexp-panel lexp-dom-${land.domain}" data-mechanic="four-land-expedition">
        <p class="lexp-tag">
          ${I.T(land.name.en, land.name.es)} ·
          ${I.T(`stop ${L.i + 1} of ${L.acts.length}`, `parada ${L.i + 1} de ${L.acts.length}`)}
        </p>
        <h2 class="lexp-head" tabindex="-1">${I.T(a.title.en, a.title.es)}</h2>
        <p class="lexp-guide">${I.T(a.guide.en, a.guide.es)}</p>
        ${body}${nextBtn}
      </div>`;
    }
    return html`<section
      class="lexp lexp-band-${b.replace("-", "")}"
      data-mechanic="four-land-expedition"
    >
      ${barHTML(s, band, env)}${customNoteHTML(s, I)}
      <div class="lexp-feel-stage">
        <div class="lexp-scene lexp-sky-${b.replace("-", "")}" aria-hidden="true">
          ${raw(layers)}
        </div>
        ${s.at === "walk" ? touchPadHTML(I, isNear(s)) : "" /* feel: phone trail controls */}
      </div>
      ${panel}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    const pp = passportClick(b, s); // teacher
    if (pp !== undefined) return ((focusSel = pp ? ".lexp-head" : focusSel), pp);
    const d = b.dataset;
    const enc = encClick(b, s, env); // encounters
    if (enc !== undefined) return enc;
    if (d.lexpLand !== undefined) {
      const k = Number(d.lexpLand);
      if (!s.lands[k]) return false;
      s.land = k;
      const L = s.lands[k];
      ensure(s);
      s.at = L.stamp ? "gate" : "walk";
      focusSel = ".lexp-head";
      return true;
    }
    if (b.hasAttribute("data-lexp-map")) return ((s.at = "map"), (focusSel = ".lexp-head"), true);
    if (b.hasAttribute("data-lexp-summary"))
      return s.lands.some((L) => L.stamp)
        ? ((s.at = "summary"), (focusSel = ".lexp-head"), true)
        : false;
    if (b.hasAttribute("data-lexp-finish"))
      return s.at === "summary" ? ((s.finished = true), true) : false;
    if (s.at === "walk" && (b.hasAttribute("data-lexp-go") || b.hasAttribute("data-lexp-open"))) {
      ensure(s);
      if (b.hasAttribute("data-lexp-open") && !isNear(s)) return false;
      // encounters: "Walk me" stops at a closed obstacle and opens its prompt
      if (blockGo(s, env, targetX(s))) return ((focusSel = ".lexp-ob-head"), true);
      const L = s.lands[s.land];
      s.x = targetX(s);
      if (L.i >= L.acts.length) L.stamp = true;
      s.at = L.i >= L.acts.length ? "gate" : "land";
      focusSel = ".lexp-head";
      return true;
    }
    if (s.at !== "land") return false;
    const L = s.lands[s.land];
    const r = L.acts[L.i];
    const a = actOf(env, s);
    const domain = bandOf(env).lands[s.land].domain;
    const open = !settled(r.rs);
    if (b.hasAttribute("data-lexp-next")) {
      if (!complete(r) && !(r.type === "speak" && r.said) && !(r.type === "write" && r.wn))
        return false;
      if (r.type === "speak" || r.type === "write") production(r, env, domain);
      L.i += 1;
      syncGear(s); // feel: finishing a stop (any answer path) earns the land's gear
      s.at = "walk";
      focusSel = ".lexp-head";
      return true;
    }
    if (b.hasAttribute("data-g-hint")) return open && takeHint(r.rs, env) >= 0;
    if (b.hasAttribute("data-lexp-words"))
      return r.words ? false : ((r.words = true), env.use("gloss"), true);
    if (b.hasAttribute("data-lexp-play") && a.say) {
      r.plays += 1;
      if (env.support === "C" && r.plays > 2) env.use("audio-replay");
      playAct(a, env);
      return true;
    }
    if (b.hasAttribute("data-lexp-tx"))
      return r.tx ? false : ((r.tx = true), env.use("transcript"), true);
    if (d.lexpPick !== undefined && open) {
      const i = Number(d.lexpPick);
      if (r.rs.picks.includes(i)) return false;
      r.pick = i;
      r.rs.picks.push(i);
      judge(r.rs, i === a.answer, env, { id: r.id, skill: domain, extra: { type: a.type } });
      if (r.rs.status === "revealed") r.pick = a.answer;
      focusSel = ".gs-feedback";
      return true;
    }
    if (d.lexpItem !== undefined && open) {
      const i = Number(d.lexpItem);
      if (r.seq.includes(i) || r.seq.length >= a.items.length) return false;
      r.seq.push(i);
      focusSel = r.seq.length === a.items.length ? "[data-lexp-check]" : "";
      return true;
    }
    if (b.hasAttribute("data-lexp-clear") && open) return r.seq.length ? ((r.seq = []), true) : false;
    if (b.hasAttribute("data-lexp-check") && open) {
      if (r.seq.length !== a.items.length) return false;
      judge(
        r.rs,
        r.seq.every((v, n) => v === n),
        env,
        { id: r.id, skill: domain, extra: { type: a.type } },
      );
      if (r.rs.status === "retry") r.seq = [];
      if (r.rs.status === "revealed") r.seq = a.items.map((_, n) => n);
      focusSel = ".gs-feedback";
      return true;
    }
    if (b.hasAttribute("data-lexp-said") && r.type === "speak" && !r.said) {
      if (isRecording(recKey(s, r))) stopRec();
      cancelDictation();
      r.said = true;
      focusSel = ".lexp-self legend";
      return true;
    }
    if (d.lexpSelf !== undefined && (r.said || r.wn)) {
      const i = Number(d.lexpSelf);
      r.self = r.self.includes(i) ? r.self.filter((x) => x !== i) : [...r.self, i].sort();
      focusSel = `[data-lexp-self="${i}"]`;
      return true;
    }
    if (b.hasAttribute("data-lexp-model") && (r.said || r.wn) && !r.model) {
      r.model = true;
      if (typeof window !== "undefined")
        speak(a.model.en, {
          rate: prefsOf(env).rate || 0.9,
          voiceURI: prefsOf(env).readingVoice || "",
        });
      focusSel = ".lexp-model";
      return true;
    }
    if (b.hasAttribute("data-lexp-wcheck") && r.type === "write") {
      const box = b.closest(".lexp-panel")?.querySelector?.("[data-lexp-text]");
      if (box) r.text = String(box.value || "").slice(0, 800);
      r.fb = checkWriting(r.text, a);
      r.wn += 1;
      focusSel = ".lexp-wfb";
      return true;
    }
    if (b.hasAttribute("data-lexp-rec") && r.type === "speak") {
      const key = recKey(s, r);
      if (isRecording(key)) stopRec();
      else
        startRec(key, { maxSeconds: 90, onStop: () => notify?.() })
          .then(() => notify?.())
          .catch(() => notify?.());
      return false;
    }
    if (b.hasAttribute("data-lexp-playback")) {
      playRecording(takesFor(recKey(s, r)).map((t) => t.url));
      return false;
    }
    if (d.dictate !== undefined && r.type === "speak") {
      const fill = (t) => {
        const box = document.querySelector("[data-lexp-text]");
        if (box && t) box.value = t;
        if (t) r.text = t;
      };
      toggleDictation(d.dictate, {
        I: env.I,
        onText: fill,
        onDone: (t) => {
          fill(t);
          notify?.();
        },
      }).then(() => notify?.());
      return false;
    }
    return false;
  },

  input(el, s) {
    if (s.at === "walk" && encInput(el, s)) return false; // encounters: kept in state, no re-render
    if (s.at !== "land" || !el.matches?.("[data-lexp-text]")) return false;
    const L = s.lands[s.land];
    L.acts[L.i].text = String(el.value || "").slice(0, 800);
    return false; // saved with the next click; re-rendering here would drop the cursor mid-word
  },

  mount(root, s, env, changed) {
    notify = changed || null;
    const b = env.band === "6-8" ? "6-8" : "3-5";
    let scene = root.querySelector(".lexp-scene");
    if (!scene) return null;
    // Keep the same painted scene across re-renders so a glide in progress carries on instead of restarting.
    if (live?.band === b && live.node && live.node !== scene) {
      scene.replaceWith(live.node);
      scene = live.node;
    }
    ensure(s);
    scene.classList.toggle("is-driving", s.at === "walk");
    const x = camX(s);
    const from = live?.band === b ? live.x : null;
    const hero = scene.querySelector(".lexp-hero");
    if (from != null && from !== x && motionOK() && s.at !== "walk") {
      clearTimeout(walkTimer);
      hero?.classList.add("is-walking");
      hero?.classList.toggle("is-back", x < from);
      walkTimer = setTimeout(() => hero?.classList.remove("is-walking"), 2400);
    }
    aim(scene, x);
    paint(scene, sceneState(s));
    live = { band: b, node: scene, x };
    const feelStop = paintFeel(scene, s, b, { motion: motionOK(), live }); // feel: restored lands, gear, finale
    encMount(root, scene, s, env); // encounters
    const L = s.lands[s.land];
    const r = s.at === "land" ? L.acts[L.i] : null;
    const a = r ? actOf(env, s) : null;
    if (a?.say && env.sup.audio === "auto" && !settled(r.rs) && spokenKey !== `${s.sid}:${r.id}`) {
      spokenKey = `${s.sid}:${r.id}`;
      setTimeout(() => playAct(a, env), motionOK() && from !== x ? 900 : 200);
    }
    if (focusSel) {
      const n = root.querySelector(focusSel);
      if (n && !n.hasAttribute("tabindex") && !/^(BUTTON|A|INPUT|TEXTAREA)$/.test(n.tagName))
        n.setAttribute("tabindex", "-1");
      // In explore mode keep the trail in view: the learner is about to steer it.
      n?.focus({ preventScroll: s.at === "walk" });
      if (s.at === "walk") keepInView(scene, { smooth: motionOK() });
      focusSel = "";
    }
    if (s.at !== "walk") return feelStop;
    const land = bandOf(env).lands[s.land];
    const L2 = s.lands[s.land];
    const where = whereOf(s, land, L2.i < L2.acts.length ? actOf(env, s) : null);
    return drive(root, scene, s, env, b, live, where, encHooks(root, s, env, changed));
  },

  plan(s, { wrong } = {}, env) {
    if (s.finished) return [];
    const rec = recommended(s);
    // Whatever leads into explore mode is followed by "Walk me there" in the same step, so steering adds no plan steps.
    const GO = { click: "[data-lexp-go]" };
    if (s.at === "map" || s.at === "gate") {
      if (rec < 0) return [{ click: "[data-lexp-summary]" }];
      const at = ensure({ ...s, land: rec });
      return [{ click: `[data-lexp-land="${rec}"]` }, GO, ...goSteps(s, env, rec, at.x, targetX(at))];
    }
    if (s.at === "summary") return [{ click: "[data-lexp-finish]" }];
    if (s.at === "passport") return [{ click: "[data-lexp-pp-back]" }]; // teacher
    // encounters: an open obstacle prompt is answered first; a walk that reaches one clears it in the same step
    if (s.at === "walk")
      return walkPlan(s, env, wrong) || [GO, ...goSteps(s, env, s.land, s.x, targetX(s))];
    const L = s.lands[s.land];
    const nextX = targetX({ ...s, lands: s.lands.map((M, k) => (k === s.land ? { ...M, i: M.i + 1 } : M)) });
    const WALK = [GO, ...goSteps(s, env, s.land, s.x, nextX)];
    const r = L.acts[L.i];
    const a = actOf(env, s);
    if (r.type === "speak")
      return [
        ...(r.said ? [] : [{ click: "[data-lexp-said]" }]),
        ...(r.self.includes(0) ? [] : [{ click: '[data-lexp-self="0"]' }]),
        { click: "[data-lexp-next]" },
        ...WALK,
      ];
    if (r.type === "write") {
      if (!r.wn || (r.wn < 2 && !r.fb?.every((c) => c.ok)))
        return [
          { fill: ["[data-lexp-text]", wrong && !r.wn ? "the lamp" : a.model.en] },
          { click: "[data-lexp-wcheck]" },
        ];
      return [
        ...(r.self.includes(0) ? [] : [{ click: '[data-lexp-self="0"]' }]),
        { click: "[data-lexp-next]" },
        ...WALK,
      ];
    }
    if (settled(r.rs)) return [{ click: "[data-lexp-next]" }, ...WALK];
    if (r.type === "read-order") {
      const want = a.items.map((_, n) => n);
      const seq = wrong ? [...want].reverse() : want;
      return [
        ...(r.seq.length ? [{ click: "[data-lexp-clear]" }] : []),
        ...seq.map((i) => ({ click: `[data-lexp-item="${i}"]` })),
        { click: "[data-lexp-check]" },
      ];
    }
    const miss = wrong ? r.order.find((i) => i !== a.answer && !r.rs.picks.includes(i)) : undefined;
    return [{ click: `[data-lexp-pick="${miss ?? a.answer}"]` }];
  },

  validate: validateContent,
};
