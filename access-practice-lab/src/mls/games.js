// Math Literacy Studio: the twelve reasoning games (inventory.json "games"). One shell runs all twelve; each game only supplies how a round is built.
//
//   export const GAMES = { id: { title, blurb, eligible(skill), mount(el, { skill, band, level, seed, support, ctx }) -> { destroy() } } }
//   export function defaultGameFor(skill) -> id
//
// What every game promises (the shell enforces it, so no game can forget it):
//  - It rewards reasoning, never speed: no timer, no countdown, no speed bonus, no leaderboard, no coins, avatars or streak display.
//    Progress is "Round n of N" and a count of reasoning checks. A round earns a check when the learner answers AND picks the true
//    reason why on the first try (reasons are the skill's big idea or the problem's conceptual hint, against foils taken from the
//    skill's misconceptions, in a seeded shuffle).
//  - Hints: first miss = conceptual hint, second = procedural hint, third = a worked PARALLEL example (a different seed of the same
//    family, step by step) and then a NEW problem. The answer to the current problem is never shown after a miss, and after feedback
//    the learner always gets a new attempt.
//  - Difficulty moves inside the skill's own grade: 3 clean rounds in a row raise the level (max 3), 2 misses lower it (min 1), and the
//    change is said in words ("This one has bigger numbers.").
//  - Optional device-only sound (off by default, always with a visual equivalent), no animation under prefers-reduced-motion, and an
//    optional "Remember my rounds on this device" box that stores ONLY counts under accessPracticeLab:v1:mls:play.
// DOM is built with textContent only; innerHTML is used only for the SVG that visuals.js generates.
import { ensureStylesheet } from "../util.js";
import { generate } from "./families.js";
import { choicesOf, fr, gcd, lcm, makeRng, MINUS, NAMES, numerals, TIMES } from "./kit.js";
import { bandOf, framesFor } from "./lang.js";
import { clear, feedback as kitFeedback, h, hearButton, makeLadder, problemText, say, styles } from "./ui-kit.js";
import { renderVisual } from "./visuals.js";

const STORE_KEY = "accessPracticeLab:v1:mls:play";
const NOTE_UNTIMED = "This game is untimed. Take all the time you need. There is nothing to race and no score to beat.";
const DEFAULT_HINTS = {
  conceptual: "Read the question again. What is it asking you to find?",
  procedural: "Try one choice at a time and check it against the information you have.",
};
const GENERIC_FOILS = [
  "You can pick the operation from one word in the problem.",
  "The biggest number in the problem is always the answer.",
  "If an answer looks right, you do not need to check it.",
  "You should do the same steps every time, whatever the problem says.",
];

/* ------------------------------------------------------------------ small helpers */

let uidCount = 0;
const uid = (p = "g") => `${p}${++uidCount}`;
const fid = (s) => s?.familyId || (typeof s?.family === "string" ? s.family : "");
const norm = (t) => String(t ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const words = (tag) => String(tag || "").replace(/[-_]+/g, " ").trim();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokenIn = (text, tok) => Boolean(tok) && new RegExp(`(^|[^\\w./])${esc(tok)}($|[^\\w./])`, "i").test(String(text));
const distinctBy = (arr, key) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = norm(key(x));
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
const lastIdeaLine = (lines) => {
  const keep = (lines || []).filter((l) => l && !/^check\b/i.test(l));
  return keep[keep.length - 1] || (lines || [])[0] || "";
};

/** A merged skill with every optional field present, so a half-written skill still plays. */
function normSkill(s) {
  const sk = s && typeof s === "object" ? s : {};
  return {
    ...sk,
    id: sk.id || "g3.skill",
    grade: sk.grade || 3,
    title: sk.title || "this skill",
    bigIdea: sk.bigIdea || "",
    vocab: (sk.vocab || []).filter((v) => v?.term && v.def),
    misconceptions: (sk.misconceptions || []).filter((m) => m?.belief),
    discourse: sk.discourse || {},
    transfer: sk.transfer || null,
    contexts: sk.contexts?.length ? sk.contexts : ["store"],
  };
}

/** SVG from visuals.js only (our own generated markup); never user text. */
function visualNode(spec, cls = "") {
  try {
    const v = renderVisual(spec);
    const box = h("div", { class: `ml-gm-vis ${cls}`.trim() });
    box.innerHTML = v.svg;
    box.append(h("p", { class: "ml-sr" }, v.summary));
    return box;
  } catch {
    return null;
  }
}
const visualInfo = (spec) => {
  try {
    return renderVisual(spec);
  } catch {
    return null;
  }
};
const para = (text, cls = "ml-gm-story") => h("p", { class: cls }, text);
/** The kit's feedback (a word and a mark, never colour alone) plus this game's own class. */
function feedback(box, kind, text) {
  kitFeedback(box, kind, text);
  box.classList.add("ml-gm-fb");
}

/* ------------------------------------------------------------------ storage and sound (both optional, both off by default) */

const readCounts = () => {
  try {
    const o = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
};
const writeCount = (key, n) => {
  try {
    const o = readCounts();
    o[key] = n;
    localStorage.setItem(STORE_KEY, JSON.stringify(o));
    return true;
  } catch {
    return false;
  }
};
function makeSound() {
  let on = false;
  let ctx = null;
  const beep = (freqs) => {
    if (!on) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      let t = ctx.currentTime;
      for (const f of freqs) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.value = 0.04;
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.12);
        t += 0.14;
      }
    } catch {}
  };
  return {
    set: (v) => {
      on = Boolean(v);
    },
    ok: () => beep([523, 659]),
    miss: () => beep([262]),
    close: () => {
      try {
        ctx?.close?.();
      } catch {}
    },
  };
}

/* ------------------------------------------------------------------ problems from the skill's own family */

const ctxFor = (S, i) => S.ctxs[i % S.ctxs.length];

/** Attach generators to the game state. `raw` never records a spec; `gen` records it so a game does not repeat a problem. */
function wireGenerators(S) {
  const fam = fid(S.skill);
  S.raw = (salt = 0, level = S.level, i = S.round) => {
    if (!fam) return null;
    const seed = S.seed * 1009 + S.attempt * 7919 + i * 131 + salt;
    try {
      return generate(fam, S.skill.params || {}, { seed, level, ctx: ctxFor(S, i) });
    } catch {
      return null;
    }
  };
  S.gen = (salt = 0, level = S.level) => {
    let last = null;
    for (let t = 0; t < 8; t++) {
      const p = S.raw(salt + t * 17, level);
      if (!p) return null;
      last = p;
      const k = JSON.stringify(p.spec);
      if (!S.specs.has(k)) {
        S.specs.add(k);
        return p;
      }
    }
    return last;
  };
  /** The best of several problems by a score (higher is better); ties keep the first. */
  S.best = (score, salt = 5, tries = 10, level = S.level) => {
    let best = null;
    let bs = -Infinity;
    const seen = new Set();
    for (let t = 0; t < tries; t++) {
      const p = S.raw(salt + t * 23, level);
      if (!p) break;
      const k = JSON.stringify(p.spec);
      if (seen.has(k) || S.specs.has(k)) continue;
      seen.add(k);
      const sc = score(p);
      if (sc > bs) {
        bs = sc;
        best = p;
      }
    }
    if (!best) return S.gen(salt, level);
    S.specs.add(JSON.stringify(best.spec));
    return best;
  };
}

/** Problems of the same family to use as foils or a worked example (distinct by `key`; never recorded). */
function others(c, k, key, { salt = 600, level = c.S.level } = {}) {
  const out = [];
  const seen = new Set();
  for (let t = 0; t < k * 8 && out.length < k; t++) {
    const q = c.S.raw(salt + t * 17 + c.i * 3, level);
    if (!q) break;
    const v = key(q);
    const n = norm(v);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push({ q, v });
  }
  return out;
}

/** A worked parallel example: a different seed of the same family, shown with its own `work`. The current answer is never in it. */
function parallelFromFamily(c, p) {
  const S = c.S;
  let fallback = null;
  for (let t = 0; t < 28; t++) {
    const q = S.raw(900 + t * 19 + c.i * 7, S.level);
    if (!q) break;
    if (p && (q.answer.text === p.answer.text || JSON.stringify(q.spec) === JSON.stringify(p.spec))) continue;
    const ex = { question: [problemText(q, S.band).stem, problemText(q, S.band).ask].filter(Boolean).join(" "), lines: q.work.slice(), visual: q.visual };
    fallback = fallback || ex;
    if (!p || !tokenIn(`${ex.question} ${ex.lines.join(" ")}`, p.answer.text)) return ex;
  }
  return fallback;
}

/* ------------------------------------------------------------------ step builders (what a round is made of) */

/** Options from a problem: the answer plus 2 (level 1) or 3 distractors, shuffled by the round's seed. */
function problemOptions(c, p) {
  const all = choicesOf(p, c.S.seed * 131 + c.i);
  const right = all.find((x) => x.correct);
  const wrong = c.rng.sample(all.filter((x) => !x.correct), c.S.level === 1 ? 2 : 3);
  return c.rng.shuffle([right, ...wrong]).map((x) => ({
    text: x.text,
    correct: x.correct,
    why: x.correct ? "" : `That answer comes from a common mix-up: ${words(x.misconception)}.`,
  }));
}

/** The body of a problem step: the story, the expression and the picture. */
function problemBody(c, p, { picture = true } = {}) {
  const { stem } = problemText(p, c.S.band);
  const box = h("div", { class: "ml-gm-body" });
  if (stem) box.append(para(stem));
  if (p.expr) box.append(h("p", { class: "ml-gm-expr" }, p.expr));
  if (picture && p.visual) {
    const v = visualNode(p.visual);
    if (v) box.append(v);
  }
  return box;
}

/** The standard "answer the problem" step. */
function solveStep(c, p, over = {}) {
  const { stem, ask } = problemText(p, c.S.band);
  return {
    type: "mc",
    prompt: over.prompt || ask,
    body: over.body === undefined ? problemBody(c, p) : over.body,
    speak: [stem, p.expr, over.prompt || ask].filter(Boolean).join(" "),
    options: problemOptions(c, p),
    hints: p.hints,
    ok: over.ok || "That answer fits the problem.",
  };
}

/** "Why does that work?" A reason from the problem's conceptual hint or the skill's big idea, against foils from the misconceptions. */
function reasonStep(c, round, over = {}) {
  const { S, rng } = c;
  const nOpt = S.level === 1 ? 3 : 4;
  let truth = over.true;
  if (!truth) {
    const cands = [round?.problem?.hints?.conceptual, S.skill.bigIdea].filter(Boolean);
    truth = cands.length ? rng.pick(cands) : "The mathematics follows the same idea every time.";
  }
  const beliefs = S.skill.misconceptions.map((m) => m.belief);
  const ne = (x) => norm(x) !== norm(truth);
  const prim = distinctBy(over.foils || beliefs, (x) => x).filter(ne);
  const sec = distinctBy([...beliefs, ...GENERIC_FOILS], (x) => x).filter((x) => ne(x) && !prim.some((q) => norm(q) === norm(x)));
  let foils = rng.sample(prim, Math.min(prim.length, nOpt - 1));
  if (foils.length < nOpt - 1) foils = foils.concat(rng.sample(sec, nOpt - 1 - foils.length));
  const why = over.why || "That idea is a common mix-up, so it does not hold every time.";
  const options = rng.shuffle([{ text: truth, correct: true }, ...foils.map((f) => ({ text: f, correct: false, why }))]);
  const prompt = over.prompt || "Why does that work? Pick the idea that is true.";
  return { type: "mc", reason: true, prompt, body: null, options, ok: over.ok || "That is the idea behind it.", speak: prompt };
}

/** The fallback round: only the big idea. Always playable, whatever a skill is missing. */
function ideaRound(c) {
  const { S } = c;
  const truth = S.skill.bigIdea || S.skill.misconceptions[0]?.fix || `Check each idea about ${S.skill.title} against what you know.`;
  return {
    label: "",
    steps: [reasonStep(c, null, { true: truth, prompt: `Which idea is true about ${S.skill.title}?` })],
    parallel: () => ({ question: `Here is a true idea about ${S.skill.title}.`, lines: [truth] }),
  };
}

/** Multiple choice: one prompt, a few options (text and/or a picture), marks that never rely on colour. */
function mountMC(step, api) {
  const root = h("div", { class: "ml-gm-mc" });
  const pid = uid("gp");
  if (step.body) root.append(typeof step.body === "function" ? step.body() : step.body);
  const bodyText = step.body && step.body.textContent ? step.body.textContent : "";
  root.append(h("div", { class: "ml-gm-promptrow" }, h("p", { class: "ml-gm-prompt", id: pid }, step.prompt), step.speak === false ? null : hearButton(step.speak || `${bodyText} ${step.prompt}`)));
  const list = h("div", { class: "ml-gm-options", role: "group", "aria-labelledby": pid });
  step.options.forEach((o, i) => {
    const info = o.visual ? visualInfo(o.visual) : null;
    const btn = h("button", { type: "button", class: `ml-gm-opt${o.visual ? " has-vis" : ""}`, "data-i": i, "aria-label": o.text ? null : `Picture ${i + 1}: ${info?.summary || ""}` });
    if (o.visual) {
      const v = visualNode(o.visual);
      if (v) btn.append(v);
    }
    if (o.text) btn.append(h("span", { class: "ml-gm-opt-text" }, o.text));
    else btn.append(h("span", { class: "ml-gm-opt-text" }, `Picture ${i + 1}`));
    const mark = h("span", { class: "ml-gm-mark", "aria-hidden": "true" });
    btn.append(mark);
    btn.addEventListener("click", () => {
      if (api.locked() || btn.getAttribute("aria-disabled") === "true") return;
      if (o.correct) {
        btn.classList.add("ml-gm-ok");
        mark.textContent = " ✓ This one";
        mark.removeAttribute("aria-hidden");
        for (const b of list.querySelectorAll(".ml-gm-opt")) b.setAttribute("aria-disabled", "true");
        api.right(o.note);
      } else {
        btn.classList.add("ml-gm-tried");
        btn.setAttribute("aria-disabled", "true");
        mark.textContent = " ✗ Not this one";
        mark.removeAttribute("aria-hidden");
        api.wrong(o.why);
      }
    });
    list.append(btn);
  });
  root.append(list);
  return root;
}

/** A number stepper that works by keyboard (a typed field plus + and -). */
function stepperRow({ label, min, max, step = 1, value, onChange }) {
  const id = uid("gs");
  let v = value;
  const input = h("input", { id, type: "number", inputmode: "numeric", class: "ml-gm-num", min, max, step, value: String(v) });
  const set = (n) => {
    v = clamp(Number.isFinite(n) ? n : min, min, max);
    input.value = String(v);
    onChange(v);
  };
  input.addEventListener("change", () => set(Number(input.value)));
  const dec = h("button", { type: "button", class: "ml-gm-sbtn", "aria-label": `Decrease ${label}`, onclick: () => set(+(v - step).toFixed(6)) }, MINUS);
  const inc = h("button", { type: "button", class: "ml-gm-sbtn", "aria-label": `Increase ${label}`, onclick: () => set(+(v + step).toFixed(6)) }, "+");
  const row = h("div", { class: "ml-gm-stepper" }, h("label", { for: id }, label), h("div", { class: "ml-gm-stepctl" }, dec, input, inc));
  return { row, get value() { return v; }, set, input };
}

/* ------------------------------------------------------------------ the shell */

const HOW_TAIL = [
  ["Wrong? You get a hint. Try again.", "Then pick the true reason. That is a reasoning check."],
  ["A miss gives you a hint, never the answer. You always get another try.", "After each answer, pick the true reason why. That earns a reasoning check."],
];

function runGame(el, opts, def) {
  const skill = normSkill(opts.skill);
  const sound = makeSound();
  let destroyed = false;
  let ended = false;
  let cur = null;
  const S = {
    skill,
    band: bandOf(opts.band || "3-4"),
    level: clamp(Math.round(Number(opts.level)) || 2, 1, 3),
    seed: Number(opts.seed) || 1,
    attempt: 0,
    round: 0,
    N: 6,
    checks: 0,
    clean: 0,
    missRounds: 0,
    completed: 0,
    streak: 0,
    misses: 0,
    rose: 0,
    specs: new Set(),
    note: "",
    started: false,
    remember: false,
    ctxs: [...new Set([opts.ctx, ...skill.contexts].filter(Boolean))],
  };
  const words_ = def.words || { up: "This one has bigger numbers.", down: "This one has friendlier numbers.", levels: ["friendlier numbers", "grade-level numbers", "bigger numbers"] };
  const countKey = () => `${skill.id}|${def.id}`;

  styles().catch(() => {});
  ensureStylesheet("mls-play-games.css");
  clear(el);
  const grade = skill.grade;
  const tail = HOW_TAIL[grade <= 2 ? 0 : 1];
  const how = h("details", { class: "ml-gm-how", open: true }, h("summary", {}, "How to play"), h("ul", {}, [def.intro[grade <= 2 ? 0 : 1], ...tail].map((t) => h("li", {}, t))));
  const roundEl = h("span", { class: "ml-gm-round-n" });
  const checksEl = h("span", { class: "ml-gm-checks" });
  const levelEl = h("span", { class: "ml-gm-level" });
  const bar = h("p", { class: "ml-gm-bar" }, roundEl, checksEl, levelEl);
  const aux = h("div", { class: "ml-gm-aux" });
  const main = h("div", { class: "ml-gm-main" });
  const savedEl = h("span", { class: "ml-gm-saved", role: "status" });
  const soundBox = h("input", { type: "checkbox", id: uid("gc"), onchange: (e) => sound.set(e.target.checked) });
  const remBox = h("input", {
    type: "checkbox",
    id: uid("gc"),
    onchange: (e) => {
      S.remember = e.target.checked;
      savedEl.textContent = S.remember ? `Saved on this device for this game: ${readCounts()[countKey()] || 0} rounds. Only this count is saved, never a name.` : "";
    },
  });
  const prefs = h(
    "div",
    { class: "ml-gm-prefs" },
    h("label", { class: "ml-gm-check", for: soundBox.id }, soundBox, " Sound effects (off by default; every sound also has words on screen)"),
    h("label", { class: "ml-gm-check", for: remBox.id }, remBox, " Remember my rounds on this device"),
    savedEl,
  );
  const root = h("div", { class: "ml-gm", role: "group", "aria-label": `${def.title} game`, "data-game": def.id }, how, h("p", { class: "ml-gm-note" }, NOTE_UNTIMED), bar, aux, main, prefs);
  el.append(root);

  const renderBar = () => {
    roundEl.textContent = `Round ${Math.min(S.round + 1, S.N)} of ${S.N}`;
    checksEl.textContent = `Reasoning checks: ${S.checks}`;
    levelEl.textContent = `Challenge: ${words_.levels[S.level - 1]}`;
    root.dataset.level = String(S.level);
    root.dataset.round = String(S.round + 1);
    root.dataset.checks = String(S.checks);
  };
  const focusEl = (node) => {
    if (S.started && node?.focus) node.focus({ preventScroll: false });
  };

  const curHints = () => cur.round.steps[cur.idx]?.hints || cur.round.problem?.hints || cur.round.hints || DEFAULT_HINTS;
  const makeRoundLadder = () =>
    makeLadder({
      hints: {
        get conceptual() {
          return curHints().conceptual || DEFAULT_HINTS.conceptual;
        },
        get procedural() {
          return curHints().procedural || DEFAULT_HINTS.procedural;
        },
      },
    });

  function setup() {
    S.round = 0;
    S.checks = S.clean = S.missRounds = S.completed = S.streak = S.misses = S.rose = 0;
    S.specs = new Set();
    S.note = "";
    ended = false;
    wireGenerators(S);
    clear(aux);
    S.N = clamp(def.n ? def.n(S, makeRng(`${def.id}|${skill.id}|${S.seed}|n`)) : 6, 6, 8);
    def.setup?.(S, aux);
  }

  function startRound() {
    if (destroyed) return;
    clear(main);
    const rng = makeRng(`${def.id}|${skill.id}|${S.seed}|${S.attempt}|${S.round}`);
    const c = { S, rng, i: S.round, skill, level: S.level, band: S.band, aux };
    let round = null;
    try {
      round = def.round(c);
    } catch (e) {
      console.warn?.(`[mls games] ${def.id}: ${e?.message || e}`);
    }
    if (!round || !round.steps?.length) round = ideaRound(c);
    round.steps = round.steps.filter((s) => s && (s.type === "custom" || (s.options && s.options.length >= 2)));
    if (!round.noReason && !round.steps.some((s) => s.reason)) {
      const r = reasonStep(c, round);
      if (r.options.length >= 2) round.steps.push(r);
    }
    if (!round.steps.length) round = ideaRound(c);
    cur = { round, c, idx: 0, misses: 0, reasonMiss: false, locked: false, ladder: null };
    cur.ladder = makeRoundLadder();
    renderBar();
    const head = h("h2", { class: "ml-gm-roundhead", tabindex: "-1" }, `Round ${S.round + 1} of ${S.N}${round.label ? `: ${round.label}` : ""}`);
    main.append(head);
    if (S.note) {
      main.append(h("p", { class: "ml-gm-levelnote", role: "status" }, S.note));
      say(root, S.note);
      S.note = "";
    }
    if (round.intro) main.append(typeof round.intro === "function" ? round.intro() : round.intro);
    playStep(0);
    if (S.round > 0 || S.attempt > 0) focusEl(head);
  }

  function playStep(idx) {
    const step = cur.round.steps[idx];
    cur.idx = idx;
    const wrap = h("div", { class: "ml-gm-stepwrap", role: "group", tabindex: "-1", "aria-label": `Question ${idx + 1} of ${cur.round.steps.length}` });
    const fb = h("div", { class: "ml-fb ml-gm-fb" });
    const api = {
      locked: () => cur.locked || wrap.dataset.done === "1",
      right: (note) => onRight(step, wrap, fb, note),
      wrong: (why) => onWrong(step, wrap, fb, why),
      info: (msg) => feedback(fb, "info", msg),
      skill,
      S,
    };
    const node = step.type === "custom" ? step.mount(api, cur.c) : mountMC(step, api);
    wrap.append(node, fb);
    main.append(wrap);
    cur.wrap = wrap;
    if (idx > 0) focusEl(wrap);
  }

  function onRight(step, wrap, fb, note) {
    S.started = true;
    wrap.dataset.done = "1";
    wrap.classList.add("ml-gm-collapsed");
    feedback(fb, "ok", [step.ok || "That fits.", note].filter(Boolean).join(" "));
    sound.ok();
    if (step.reason) cur.reasonOk = !cur.reasonMiss;
    if (cur.idx + 1 < cur.round.steps.length) playStep(cur.idx + 1);
    else completeRound();
  }

  function onWrong(step, wrap, fb, why) {
    S.started = true;
    sound.miss();
    if (step.reason) {
      cur.reasonMiss = true;
      feedback(fb, "try", `${why || "That idea is a common mix-up."} Look for the idea that is true every time. Try again.`);
      return;
    }
    cur.misses += 1;
    S.misses += 1;
    const hint = cur.ladder.miss();
    let extra = "";
    if (S.misses >= 2) {
      if (S.level > 1) {
        S.level -= 1;
        S.note = words_.down;
        S.streak = 0;
        extra = ` Next time: ${words_.down}`;
      }
      S.misses = 0;
    }
    renderBar();
    if (hint == null) {
      feedback(fb, "try", `${why ? `${why} ` : ""}Let us look at a worked example with different numbers. Then you will get a new problem.${extra}`);
      showWorked();
      return;
    }
    feedback(fb, "try", `${why ? `${why} ` : ""}Hint: ${hint} Try again.${extra}`);
  }

  function showWorked() {
    cur.locked = true;
    let ex = null;
    try {
      ex = cur.round.parallel?.() || null;
    } catch {
      ex = null;
    }
    if (!ex) ex = { question: `Here is the key idea about ${skill.title}.`, lines: [skill.bigIdea || "Check each idea against what you know."] };
    const head = h("h3", { class: "ml-gm-workedhead", tabindex: "-1" }, "A worked example with different numbers");
    const box = h("div", { class: "ml-gm-worked", role: "group", "aria-label": "Worked example" }, head);
    if (ex.question) box.append(para(ex.question));
    if (ex.visual) {
      const v = visualNode(ex.visual);
      if (v) box.append(v);
    }
    box.append(h("ol", { class: "ml-gm-worked-steps" }, (ex.lines || []).map((l) => h("li", {}, l))));
    box.append(
      h(
        "button",
        {
          type: "button",
          class: "ml-gm-btn",
          onclick: () => {
            S.attempt += 1;
            startRound();
          },
        },
        "Try a new problem",
      ),
    );
    main.append(box);
    say(root, "Here is a worked example. Then you will get a new problem.");
    focusEl(head);
  }

  function completeRound() {
    const r = cur.round;
    const clean = cur.misses === 0;
    const earned = !cur.reasonMiss;
    S.completed += 1;
    if (earned) S.checks += 1;
    if (clean) {
      S.clean += 1;
      S.streak += 1;
      S.misses = 0;
      if (S.streak >= 3 && S.level < 3) {
        S.level += 1;
        S.streak = 0;
        S.rose += 1;
        S.note = words_.up;
      }
    } else {
      S.missRounds += 1;
      S.streak = 0;
    }
    if (S.remember) {
      const key = countKey();
      const n = (readCounts()[key] || 0) + 1;
      if (writeCount(key, n)) savedEl.textContent = `Saved on this device for this game: ${n} rounds. Only this count is saved, never a name.`;
    }
    try {
      r.onComplete?.(S);
    } catch {}
    renderBar();
    const last = S.round + 1 >= S.N;
    const done = h("div", { class: "ml-gm-done", role: "group", tabindex: "-1", "aria-label": "Round complete" });
    const fb = h("div", { class: "ml-fb ml-gm-fb" });
    feedback(
      fb,
      "ok",
      earned ? "Round complete. You answered and picked the true reason, so you earned a reasoning check." : "Round complete. You found the reason on a second try. Picking it on the first try earns a reasoning check.",
    );
    done.append(fb);
    if (r.after) done.append(para(typeof r.after === "function" ? r.after(S) : r.after, "ml-gm-after"));
    if (S.band !== "5-6") {
      const frame = framesFor(skill, S.band, 4)[S.round % 4];
      if (frame) done.append(h("p", { class: "ml-gm-frame" }, h("strong", {}, "Say it to a partner: "), frame));
    }
    if (S.note && !last) done.append(h("p", { class: "ml-gm-levelnote" }, `Next: ${S.note}`));
    done.append(
      h(
        "button",
        {
          type: "button",
          class: "ml-gm-btn primary",
          onclick: () => {
            S.round += 1;
            S.attempt = 0;
            if (S.round >= S.N) endScreen();
            else startRound();
          },
        },
        last ? "See how I did" : "Next round",
      ),
    );
    main.append(done);
    say(root, earned ? "Round complete. Reasoning check earned." : "Round complete.");
    focusEl(done);
  }

  function endScreen() {
    ended = true;
    clear(main);
    S.round = S.N - 1;
    renderBar();
    const lines = [];
    lines.push(S.checks > 0 ? `You explained why in ${S.checks} of ${S.N} rounds.` : "You looked for the reason in every round. Next time, try to pick the true reason on the first try.");
    if (S.clean > 0) lines.push(`You worked through ${S.clean} ${S.clean === 1 ? "round" : "rounds"} without needing a hint.`);
    if (S.missRounds > 0) lines.push(`You tried again after a miss in ${S.missRounds} ${S.missRounds === 1 ? "round" : "rounds"}. Trying again is how thinking grows.`);
    if (S.rose > 0) lines.push("You moved up to a harder level.");
    for (const x of def.end?.(S) || []) lines.push(x);
    const head = h("h2", { class: "ml-gm-roundhead", tabindex: "-1" }, `You finished all ${S.N} rounds`);
    main.append(
      head,
      h("ul", { class: "ml-gm-endlist" }, lines.map((l) => h("li", {}, l))),
      h(
        "div",
        { class: "ml-gm-endbtns" },
        h("button", { type: "button", class: "ml-gm-btn primary", onclick: () => { S.seed += 1; S.attempt = 0; setup(); startRound(); focusEl(main.querySelector(".ml-gm-roundhead")); } }, "Play again"),
        h(
          "button",
          {
            type: "button",
            class: "ml-gm-btn",
            onclick: () => {
              const ev = new CustomEvent("ml-game-back", { bubbles: true, cancelable: true });
              const handled = !el.dispatchEvent(ev);
              if (handled) return;
              if (typeof opts.onBack === "function") opts.onBack();
              else if (typeof history !== "undefined" && history.length > 1) history.back();
              else {
                S.attempt = 0;
                setup();
                startRound();
              }
            },
          },
          "Back",
        ),
      ),
    );
    say(root, `You finished all ${S.N} rounds. ${lines[0]}`);
    focusEl(head);
  }

  setup();
  startRound();
  return {
    destroy() {
      destroyed = true;
      sound.close();
      try {
        window.speechSynthesis?.cancel?.();
      } catch {}
      clear(el);
    },
    get state() {
      return { round: S.round + 1, N: S.N, level: S.level, checks: S.checks, ended, problem: cur?.round?.problem || null, completed: S.completed };
    },
    /** For tests: the current step's options (which one is right) or builder solution. Not shown in the page. */
    peek() {
      const st = cur?.round?.steps?.[cur.idx];
      if (!st || cur?.wrap?.dataset.done === "1") return null;
      if (st.type === "custom") return { type: "custom", kind: st.kind, solution: st.solution || null, needed: st.needed || 0 };
      return { type: "mc", reason: Boolean(st.reason), correct: st.options.findIndex((o) => o.correct), n: st.options.length };
    },
  };
}

/* ------------------------------------------------------------------ 1. Vocabulary Quest */

const defOf = (t) => t.def;
function vocabRound(c) {
  const { S, rng } = c;
  const terms = S.skill.vocab;
  if (terms.length < 3) return null;
  S.vocabOrder = S.vocabOrder || rng.shuffle(terms);
  const t = S.vocabOrder[c.i % S.vocabOrder.length];
  const others_ = terms.filter((x) => x !== t);
  const nOpt = S.level === 1 ? 3 : 4;
  const modes = ["def", "cloze"];
  if (t.visual && visualInfo(t.visual) && others_.some((x) => x.visual && visualInfo(x.visual))) modes.push("pic");
  if (S.level >= 2) modes.push("eg");
  if (S.level >= 2 && t.everyday) modes.push("mm", "mm");
  const hasCloze = t.sentence && new RegExp(esc(t.term), "i").test(t.sentence);
  const avail = modes.filter((m) => m !== "cloze" || hasCloze);
  const mode = avail[(c.i + Math.floor(rng.next() * avail.length)) % avail.length];
  const termOpts = (extra = []) => rng.shuffle([{ text: t.term, correct: true }, ...rng.sample(others_, nOpt - 1).map((x) => ({ text: x.term, correct: false, why: `That word means: ${x.def}` }))]).concat(extra);
  let step;
  let reason;
  if (mode === "def") {
    step = {
      type: "mc",
      prompt: "Which word matches this meaning?",
      body: para(`“${defOf(t)}”`, "ml-gm-quote"),
      options: termOpts(),
      hints: { conceptual: t.morphology ? `A word-part clue: ${t.morphology}.` : "Think of a picture or an example for each word.", procedural: "Cross out the words you know do not match. Choose from the words that are left." },
      ok: "That word has that meaning.",
    };
    reason = { prompt: `Which one is an example of “${t.term}”?`, true: t.example, foils: others_.map((x) => x.example).filter(Boolean) };
  } else if (mode === "pic") {
    const pics = rng.sample(others_.filter((x) => x.visual && visualInfo(x.visual)), nOpt - 1);
    step = {
      type: "mc",
      prompt: `Which picture shows “${t.term}”?`,
      body: null,
      options: rng.shuffle([{ text: "", visual: t.visual, correct: true }, ...pics.map((x) => ({ text: "", visual: x.visual, correct: false, why: `That picture shows a different word: ${x.term}.` }))]),
      hints: { conceptual: `“${t.term}” means: ${defOf(t)}`, procedural: "Check each picture against every part of the meaning." },
      ok: "That picture matches the word.",
    };
    reason = { prompt: `Which meaning fits “${t.term}”?`, true: defOf(t), foils: others_.map(defOf) };
  } else if (mode === "cloze") {
    const gap = t.sentence.replace(new RegExp(esc(t.term), "i"), "_____");
    step = {
      type: "mc",
      prompt: "Which word completes the sentence?",
      body: para(gap, "ml-gm-quote"),
      options: termOpts(),
      hints: { conceptual: "Read the sentence without the blank. What kind of word fits there?", procedural: "Try each word in the blank and read the whole sentence aloud." },
      ok: "That word completes the sentence.",
    };
    reason = { prompt: `Which meaning fits “${t.term}”?`, true: defOf(t), foils: others_.map(defOf) };
  } else if (mode === "eg") {
    const isEg = rng.chance(0.5) || !t.nonExample;
    const text = isEg ? t.example : t.nonExample;
    step = {
      type: "mc",
      prompt: `Is this an example of “${t.term}”?`,
      body: para(text, "ml-gm-quote"),
      options: rng.shuffle([
        { text: "Yes, it is an example.", correct: isEg, why: "Check it against the meaning, part by part. Does it fit every part?" },
        { text: "No, it is not an example.", correct: !isEg, why: "Check it against the meaning, part by part. Does it fit every part?" },
      ]),
      hints: { conceptual: `“${t.term}” means: ${defOf(t)}`, procedural: "Check the statement against the meaning, one part at a time." },
      ok: isEg ? "It is an example." : "It is not an example.",
    };
    reason = { prompt: `Which meaning fits “${t.term}”?`, true: defOf(t), foils: others_.map(defOf) };
  } else {
    step = {
      type: "mc",
      prompt: `“${t.term}” has an everyday meaning and a math meaning. Which is the math meaning?`,
      body: null,
      options: rng.shuffle([
        { text: defOf(t), correct: true },
        { text: t.everyday, correct: false, why: "That is the everyday meaning, from outside math class." },
      ]),
      hints: { conceptual: "Some words mean one thing in daily life and another thing in math. Think about math class.", procedural: "Which meaning talks about numbers, shapes or data?" },
      ok: "That is the math meaning.",
    };
    reason = { prompt: `Which one is an example of “${t.term}” in math?`, true: t.example, foils: others_.map((x) => x.example).filter(Boolean) };
  }
  const round = {
    label: "",
    steps: [step],
    parallel: () => {
      const u = others_.find((x) => !tokenIn(`${x.def} ${x.example} ${x.sentence}`, t.term)) || others_[0];
      return { question: `Here is how to check a word: “${u.term}”.`, lines: [`Meaning: ${u.def}`, `Example: ${u.example}`, `Not an example: ${u.nonExample}`, `In a sentence: ${u.sentence}`].filter((l) => !/: undefined$/.test(l)) };
    },
  };
  if (reason.foils?.length >= 2 && reason.true) round.steps.push(reasonStep(c, round, { ...reason, why: "That fits a different word. Check it against the meaning of this word.", ok: "That fits the word." }));
  return round;
}

/* ------------------------------------------------------------------ 2. Word Problem Investigator */

const NARRATIVES = [
  "Some are added to a start amount.",
  "Some are taken away from a start amount.",
  "Equal groups are put together.",
  "A total is shared into equal groups.",
  "Two amounts are compared to find how many more.",
  "A part of a whole is found.",
];
function wpRound(c) {
  const { S, rng } = c;
  const p = S.best((q) => (q.structure ? 3 : 0) + (q.stem.standard ? 1 : 0), 3, 8);
  if (!p) return null;
  const body = problemBody(c, p, { picture: true });
  const steps = [];
  const st = p.structure;
  const nOpt = S.level === 1 ? 3 : 4;
  const invHints = { conceptual: "Read the story again. Picture what is happening before you look at the numbers.", procedural: "Name each number and what it counts. Then ask: what is not known yet?" };
  if (st) {
    const oth = others(c, 4, (q) => q.structure?.happening || "", { salt: 700 });
    const happen = distinctBy([...oth.map((o) => o.v), ...NARRATIVES], (x) => x).filter((x) => norm(x) !== norm(st.happening));
    steps.push({
      type: "mc",
      prompt: "What is happening in the story?",
      body,
      speak: `${problemText(p, S.band).stem} What is happening in the story?`,
      options: rng.shuffle([{ text: st.happening, correct: true }, ...rng.sample(happen.slice(0, 5), nOpt - 1).map((x) => ({ text: x, correct: false, why: "Look at what really happens to the amounts in this story." }))]),
      hints: invHints,
      ok: "That is what is happening.",
    });
    const knownText = (arr) => arr.map((k) => `${k.label}: ${k.value}`).join(", ");
    const kn = st.known || [];
    if (kn.length) {
      const swapped = kn.length > 1 ? kn.map((k, i) => ({ label: k.label, value: kn[(i + 1) % kn.length].value })) : null;
      const okn = others(c, 4, (q) => (q.structure ? knownText(q.structure.known || []) : ""), { salt: 800 });
      const foils = distinctBy([...(swapped ? [{ v: knownText(swapped) }] : []), ...okn.map((o) => ({ v: o.v }))], (x) => x.v).filter((x) => norm(x.v) !== norm(knownText(kn)));
      steps.push({
        type: "mc",
        prompt: "What do we know? Pick the label and number that go together.",
        body: null,
        options: rng.shuffle([{ text: knownText(kn), correct: true }, ...foils.slice(0, nOpt - 1).map((x) => ({ text: x.v, correct: false, why: "Check that each number is matched with what it counts." }))]),
        hints: invHints,
        ok: "Each number is matched with what it counts.",
      });
      const labels = distinctBy([...kn.map((k) => k.label), st.unknown], (x) => x);
      if (st.unknown && labels.length >= 3) {
        steps.push({
          type: "mc",
          prompt: "Which quantity is not known yet?",
          body: null,
          options: rng.shuffle(labels.slice(0, nOpt).map((l) => ({ text: cap(l), correct: norm(l) === norm(st.unknown), why: "That amount is already given in the story." }))),
          hints: invHints,
          ok: "That is what we need to find.",
        });
      }
    }
  } else {
    const { ask } = problemText(p, S.band);
    const oth = others(c, 4, (q) => problemText(q, S.band).ask, { salt: 700 });
    const generic = ["Find a number that is bigger than every number shown.", "Tell which number is the smallest.", "Count how many numbers there are."];
    const foils = distinctBy([...oth.map((o) => o.v), ...generic], (x) => x).filter((x) => norm(x) !== norm(ask));
    steps.push({
      type: "mc",
      prompt: "Which sentence tells what the question wants?",
      body,
      options: rng.shuffle([{ text: ask, correct: true }, ...foils.slice(0, nOpt - 1).map((x) => ({ text: x, correct: false, why: "Read the question again. What does it want you to find?" }))]),
      hints: invHints,
      ok: "That is what the question wants.",
    });
  }
  const sv = solveStep(c, p, { body: steps.length ? null : body });
  steps.push(sv);
  const round = { label: "", problem: p, steps, parallel: () => parallelFromFamily(c, p) };
  if (st?.relationship) {
    const oth = others(c, 4, (q) => q.structure?.relationship || "", { salt: 750 });
    round.steps.push(reasonStep(c, round, { prompt: "Which relationship connects the numbers in this story?", true: st.relationship, foils: [...oth.map((o) => o.v), ...S.skill.misconceptions.map((m) => m.belief)] }));
  }
  return round;
}

/* ------------------------------------------------------------------ 3. Equation Escape Room */

const ROOMS = {
  store: "the school store storeroom",
  garden: "the garden shed",
  sports: "the equipment room",
  kitchen: "the pantry",
  pets: "the animal shelter office",
  library: "the library vault",
  crafts: "the art supply closet",
  travel: "the bus depot",
  science: "the science prep room",
  community: "the community center basement",
};
function escapeCode(S, rng) {
  const terms = S.skill.vocab;
  const single = terms.filter((t) => /^[A-Za-z]{4,9}$/.test(t.term));
  if (single.length) {
    const t = rng.pick(single);
    return { word: t.term.toUpperCase(), term: t.term, whole: true };
  }
  for (const t of terms) {
    const w = (t.term.match(/[A-Za-z]{4,9}/) || [])[0];
    if (w) return { word: w.toUpperCase(), term: t.term, whole: false };
  }
  return { word: "MATH", term: "math", whole: true };
}
function renderCode(S, box) {
  const code = S.code;
  const found = code.reveal.map((d) => d < S.completed);
  clear(box);
  box.append(h("p", { class: "ml-gm-roomline" }, `You are in ${ROOMS[S.ctxs[0]] || "a locked classroom"}. Each door has a problem. Solving a door shows a letter of the code word.`));
  const strip = h("p", { class: "ml-gm-code", "aria-label": `Code so far: ${[...code.word].map((ch, i) => (found[i] ? ch : "blank")).join(", ")}. ${found.filter(Boolean).length} of ${code.word.length} letters found.` });
  [...code.word].forEach((ch, i) => strip.append(h("span", { class: `ml-gm-letter${found[i] ? " on" : ""}`, "aria-hidden": "true" }, found[i] ? ch : "_")));
  box.append(strip);
}
const escape_ = {
  n: (S, rng) => {
    S.code = escapeCode(S, rng);
    const L = S.code.word.length;
    const N = clamp(L, 6, 8);
    S.code.reveal = [...Array(L).keys()].map((k) => Math.floor(((k + 1) * N) / L) - 1);
    return N;
  },
  setup: (S, aux) => renderCode(S, aux),
  round: (c) => {
    const { S, rng } = c;
    const p = S.gen(11);
    if (!p) return null;
    const letterAt = S.code.reveal.map((d, k) => (d === c.i ? k : -1)).filter((k) => k >= 0);
    const round = {
      label: `Door ${c.i + 1}`,
      problem: p,
      steps: [solveStep(c, p, { ok: "The door unlocks." })],
      parallel: () => parallelFromFamily(c, p),
      onComplete: () => renderCode(S, c.aux),
      after: () => (letterAt.length ? `The door opens. Code letter ${letterAt.map((k) => k + 1).join(" and ")} is ${letterAt.map((k) => S.code.word[k]).join(" and ")}.` : "The door opens. This door has no letter. Go on to the next one."),
    };
    if (c.i === S.N - 1) {
      const terms = S.skill.vocab.map((t) => t.term);
      const pool = rng.sample(terms.filter((t) => t !== S.code.term), 3);
      const spelled = [...S.code.word].join(" ");
      round.steps.push({
        type: "mc",
        prompt: S.code.whole ? `The code is ${spelled}. Which math word does it spell?` : `The code is ${spelled}. Which math term from this skill begins with it?`,
        body: null,
        options: rng.shuffle([{ text: S.code.term, correct: true }, ...pool.map((t) => ({ text: t, correct: false, why: "Check the letters of the code against the letters of the word." }))]),
        hints: { conceptual: "Match the code letters to the first letters of each word, one at a time.", procedural: "Cross out any word that starts with a different letter." },
        ok: "The code word opens the last lock. You escaped.",
      });
    }
    return round;
  },
  end: (S) => [`You found the code word: ${S.code.word.toLowerCase()}.`],
};

/* ------------------------------------------------------------------ 4. Representation Match */

const repDesc = {
  story: (p, S) => problemText(p, S.band).stem || problemText(p, S.band).ask,
  expr: (p) => p.expr || "",
  pic: (p) => visualInfo(p.visual)?.summary || "",
};
const repAvail = (p) => ({ story: Boolean(p.stem?.standard), expr: Boolean(p.expr), pic: Boolean(p.visual && visualInfo(p.visual)) });
function diffNote(fromName, toName, fromText, toText) {
  const a = [...new Set(numerals(fromText))];
  const b = [...new Set(numerals(toText))];
  const onlyA = a.filter((x) => !b.includes(x));
  const onlyB = b.filter((x) => !a.includes(x));
  if (onlyA.length || onlyB.length) {
    return `The ${fromName} uses ${a.slice(0, 4).join(", ") || "different numbers"}, but this ${toName} uses ${b.slice(0, 4).join(", ") || "different numbers"}.`;
  }
  return `This ${toName} has the same numbers, but they are put together in a different way. Check what the ${fromName} does with them.`;
}
function repRound(c) {
  const { S, rng } = c;
  const p = S.best((q) => Object.values(repAvail(q)).filter(Boolean).length * 2 + (q.expr ? 1 : 0) + (q.visual ? 1 : 0), 4, 10);
  if (!p) return null;
  const av = repAvail(p);
  const kinds = ["story", "pic", "expr"].filter((k) => av[k]);
  if (kinds.length < 2) {
    const round = { label: "", problem: p, steps: [solveStep(c, p)], parallel: () => parallelFromFamily(c, p) };
    return round;
  }
  const pairs = kinds.length === 3 ? [["story", "pic"], ["pic", "expr"]] : [[kinds[0], kinds[1]]];
  const NAME = { story: "story", pic: "picture", expr: "expression" };
  const steps = [];
  for (const [from, to] of pairs) {
    const oth = others(c, 5, (q) => (repAvail(q)[to] ? repDesc[to](q, S) : ""), { salt: 400 + steps.length * 50 }).filter((o) => norm(o.v) !== norm(repDesc[to](p, S)));
    if (oth.length < 2) continue;
    const nOpt = S.level === 1 ? 3 : 4;
    const mk = (q, correct) => {
      const o = { text: to === "pic" ? "" : repDesc[to](q, S), correct };
      if (to === "pic") o.visual = q.visual;
      if (!correct) o.why = diffNote(NAME[from], NAME[to], repDesc[from](p, S), repDesc[to](q, S));
      return o;
    };
    let body;
    if (from === "story") body = problemBody(c, { ...p, expr: null, visual: null }, {});
    else if (from === "pic") body = h("div", { class: "ml-gm-body" }, visualNode(p.visual));
    else body = h("div", { class: "ml-gm-body" }, h("p", { class: "ml-gm-expr" }, p.expr));
    steps.push({
      type: "mc",
      prompt: `Which ${NAME[to]} matches this ${NAME[from]}?`,
      body,
      speak: `Which ${NAME[to]} matches this ${NAME[from]}?`,
      options: rng.shuffle([mk(p, true), ...oth.slice(0, nOpt - 1).map((o) => mk(o.q, false))]),
      hints: {
        conceptual: `Check that each number in the ${NAME[from]} shows up in the ${NAME[to]} and means the same thing.`,
        procedural: `Find one number in the ${NAME[from]}. Look for it in each choice. Then check the other numbers.`,
      },
      ok: `The ${NAME[to]} and the ${NAME[from]} show the same situation.`,
    });
  }
  if (!steps.length) return { label: "", problem: p, steps: [solveStep(c, p)], parallel: () => parallelFromFamily(c, p) };
  return { label: "", problem: p, steps, parallel: () => parallelFromFamily(c, p) };
}

/* ------------------------------------------------------------------ 5. Mathematical Misconception Detective */

function mcCases(S) {
  return S.skill.misconceptions.filter((m) => m.errorCase?.steps?.length >= 2 && Number.isInteger(m.errorCase.firstWrong));
}
function detectiveRound(c) {
  const { S, rng } = c;
  const cases = mcCases(S);
  const all = S.skill.misconceptions;
  const nOpt = S.level === 1 ? 3 : 4;
  const fresh = S.gen(21);
  const freshStep = fresh ? { ...solveStep(c, fresh, { prompt: `Now solve a new problem correctly. ${problemText(fresh, S.band).ask}` }), ok: "You solved a fresh problem correctly." } : null;
  const beliefOpts = (m) => {
    const foils = rng.sample(all.filter((x) => x !== m).map((x) => x.belief), nOpt - 1);
    const pad = GENERIC_FOILS.filter((g) => !foils.includes(g));
    while (foils.length < nOpt - 1 && pad.length) foils.push(pad.shift());
    return rng.shuffle([{ text: m.belief, correct: true }, ...foils.map((f) => ({ text: f, correct: false, why: "That is a different mix-up. Look at what the student did in the first wrong step." }))]);
  };
  if (!cases.length) {
    const m = all[c.i % Math.max(1, all.length)];
    if (!m) return null;
    const trues = [S.skill.bigIdea, fresh?.hints?.conceptual].filter(Boolean);
    if (trues.length < 2) return null;
    const round = {
      label: "",
      problem: fresh || undefined,
      steps: [
        {
          type: "mc",
          prompt: "Which of these ideas is a mix-up?",
          body: null,
          options: rng.shuffle([{ text: m.belief, correct: true }, ...trues.slice(0, nOpt - 1).map((t) => ({ text: t, correct: false, why: "That idea is true. Look for the idea that does not always hold." }))]),
          hints: { conceptual: "Test each idea on a small example. Does it work every time?", procedural: "Look for an example where the idea gives the wrong result." },
          ok: "That idea is a mix-up.",
        },
      ],
      parallel: () => ({ question: "Here is how to test an idea.", lines: ["Try it on a small example.", "Check the result against what you know is true.", "If it fails once, the idea is a mix-up."] }),
    };
    if (freshStep) round.steps.push(freshStep);
    return round;
  }
  const m = cases[c.i % cases.length];
  const e = m.errorCase;
  const fixPhase = c.i >= cases.length && Math.floor(c.i / cases.length) % 2 === 1;
  const body = h("div", { class: "ml-gm-body" }, para(e.story), h("ol", { class: "ml-gm-work" }, e.steps.map((s) => h("li", {}, s))));
  const steps = [];
  if (!fixPhase) {
    steps.push({
      type: "mc",
      prompt: "Which step is the first one that goes wrong?",
      body,
      speak: `${e.story} ${e.steps.join(" ")} Which step is the first one that goes wrong?`,
      options: e.steps.map((s, i) => ({
        text: `Step ${i + 1}: ${s}`,
        correct: i === e.firstWrong,
        why: i < e.firstWrong ? "That step is fine: it matches the situation." : "That step might look wrong too, but something went wrong before it.",
      })),
      hints: { conceptual: "Check each step against what the situation says, starting at step 1.", procedural: "Test each step with the numbers in the story. Stop at the first step that does not match." },
      ok: "That is where the thinking first goes wrong.",
    });
  } else {
    const foils = distinctBy([...cases.filter((x) => x !== m).map((x) => x.errorCase.explain), ...all.filter((x) => x !== m).map((x) => x.fix)], (x) => x).filter((x) => norm(x) !== norm(e.explain));
    steps.push({
      type: "mc",
      prompt: "Which explanation fixes the mistake?",
      body,
      speak: `${e.story} ${e.steps.join(" ")} Which explanation fixes the mistake?`,
      options: rng.shuffle([{ text: e.explain, correct: true }, ...rng.sample(foils, nOpt - 1).map((f) => ({ text: f, correct: false, why: "That explanation is about a different situation. Compare it with the story." }))]),
      hints: { conceptual: "A good fix says which step was wrong and why.", procedural: "Compare each explanation with the story and the steps." },
      ok: "That explanation fixes the mistake.",
    });
  }
  steps.push({
    type: "mc",
    reason: true,
    prompt: "Which belief is behind the mistake?",
    body: null,
    options: beliefOpts(m),
    ok: "That belief explains the mistake.",
  });
  if (freshStep) steps.push(freshStep);
  return {
    label: "",
    problem: fresh || undefined,
    steps,
    parallel: () => {
      const u = cases.find((x) => x !== m);
      if (!u) return { question: "Here is how to find a first wrong step.", lines: ["Read the situation first.", "Check step 1 against the situation. Then check step 2, and so on.", "The first step that does not match the situation is the first wrong step."] };
      return { question: `${u.errorCase.story}`, lines: [...u.errorCase.steps.map((s, i) => `Step ${i + 1}: ${s}`), `The first wrong step is step ${u.errorCase.firstWrong + 1}.`, u.errorCase.explain] };
    },
  };
}

/* ------------------------------------------------------------------ builders (fractions, ratios): steppers + a picture + Check */

function mountBuilder(task) {
  return (api) => {
    const root = h("div", { class: "ml-gm-builder" });
    root.append(para(task.story || "", "ml-gm-story"));
    const pid = uid("gp");
    root.append(h("div", { class: "ml-gm-promptrow" }, h("p", { class: "ml-gm-prompt", id: pid }, task.prompt), hearButton(`${task.story || ""} ${task.prompt}`)));
    const fig = h("div", { class: "ml-gm-fig", role: "group", "aria-label": "Your build" });
    const sum = h("p", { class: "ml-gm-sum", "aria-live": "polite" });
    const state = {};
    const draw = () => {
      clear(fig);
      let m;
      try {
        m = task.draw(state);
      } catch (e) {
        m = { error: String(e.message || e) };
      }
      if (m.error) {
        fig.append(h("p", { class: "ml-gm-err", role: "alert" }, m.error));
        sum.textContent = "";
      } else {
        const v = m.spec ? visualNode(m.spec) : null;
        if (v) fig.append(v);
        if (m.extra) fig.append(m.extra);
        sum.textContent = m.summary || "";
      }
    };
    const controls = h("div", { class: "ml-gm-controls", role: "group", "aria-labelledby": pid });
    for (const ctl of task.controls) {
      state[ctl.id] = ctl.value;
      const sr = stepperRow({ label: ctl.label, min: ctl.min, max: ctl.max, step: ctl.step || 1, value: ctl.value, onChange: (v) => { state[ctl.id] = v; draw(); } });
      ctl.ref = sr;
      controls.append(sr.row);
    }
    const check = h("button", {
      type: "button",
      class: "ml-gm-btn primary",
      onclick: () => {
        if (api.locked()) return;
        const r = task.check({ ...state });
        if (r.invalid) api.info(r.msg);
        else if (r.ok) {
          check.setAttribute("aria-disabled", "true");
          api.right(r.msg);
        } else api.wrong(r.msg);
      },
    }, task.checkLabel || "Check my build");
    root.append(h("div", { class: "ml-gm-builder-grid" }, controls, h("div", { class: "ml-gm-out" }, fig, sum)), check);
    draw();
    return root;
  };
}
const builderStep = (task) => ({ type: "custom", kind: "builder", prompt: task.prompt, hints: task.hints, solution: task.solution, ok: "Your build matches.", mount: mountBuilder(task) });

/* ------------------------------------------------------------------ 6. Fraction Architect */

function fracTask(c, salt = 0) {
  const { S } = c;
  const rng = makeRng(`fa|${S.skill.id}|${S.seed}|${S.attempt}|${c.i}|${salt}`);
  const lv = S.level;
  const fam = fid(S.skill);
  const hintsBase = {
    conceptual: "The bottom number tells how many equal parts make one whole. The top number tells how many of those parts you count.",
    procedural: "Set the equal parts first. Then count that many parts. Read your fraction in the sentence under the picture.",
  };
  if (fam === "fracline") {
    const W = lv === 3 ? 2 : 1;
    const d = rng.pick(lv === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8]);
    const n = W === 1 ? rng.int(1, d - 1) : rng.int(d + 1, 2 * d - 1);
    const target = fr(n, d);
    return {
      kind: "fracline",
      story: `A number line goes from 0 to ${W}.`,
      prompt: `Put a point at ${n}/${d}. Choose how many equal steps are in each whole, then how many steps to move from 0.`,
      controls: [
        { id: "parts", label: "Equal steps in each whole", min: 1, max: 12, value: 1 },
        { id: "steps", label: "Steps to move from 0", min: 0, max: 12 * W, value: 0 },
      ],
      draw: (st) => {
        if (st.steps > st.parts * W) return { error: `You can move at most ${st.parts * W} steps on this number line.` };
        return { spec: { kind: "numberline", min: 0, max: W, ticks: st.parts * W, marks: [{ at: `${st.steps}/${st.parts}`, label: "your point" }], show: "frac", labelTicks: "ends" }, summary: `Each whole has ${st.parts} equal steps. Your point is ${st.steps} steps from 0, at ${st.steps}/${st.parts}.` };
      },
      check: (st) => {
        if (st.steps > st.parts * W) return { invalid: true, msg: "Your point is off the number line. Use fewer steps." };
        const v = fr(st.steps, st.parts);
        const k = v.cmp(target);
        if (k === 0) return { ok: true, msg: st.parts === d ? "" : "A different name for the same point also works." };
        return { ok: false, msg: k < 0 ? "Your point is to the left of the target. Count more steps." : "Your point is to the right of the target. Count fewer steps." };
      },
      solution: { parts: d, steps: n },
      hints: { conceptual: "Cut each whole into equal steps. The bottom number tells how many steps are in one whole.", procedural: "Set the steps in each whole to the bottom number. Then move the number of steps in the top number." },
      work: [`Cut each whole into ${d} equal steps, because the bottom number is ${d}.`, `Start at 0 and move ${n} steps, because the top number is ${n}.`, `The point is at ${n}/${d}.`],
    };
  }
  if (fam === "fracequiv") {
    const d = rng.pick(lv === 1 ? [2, 3] : [2, 3, 4, 5]);
    const k = rng.pick(lv === 3 ? [3, 4] : [2, 3]);
    const m = d * k > 12 ? d * 2 : d * (d * k > 12 ? 2 : k);
    const kk = m / d;
    let n = rng.int(1, d - 1);
    while (gcd(n, d) !== 1 && d > 2) n = rng.int(1, d - 1);
    return {
      kind: "fracequiv",
      story: `The top strip shows ${n}/${d}.`,
      prompt: `Build an equal fraction that uses ${m} equal parts. Set the equal parts and the parts that are shaded.`,
      controls: [
        { id: "parts", label: "Equal parts in your strip", min: 1, max: 12, value: d },
        { id: "shaded", label: "Shaded parts in your strip", min: 0, max: 12, value: 0 },
      ],
      draw: (st) => {
        if (st.shaded > st.parts) return { error: "You cannot shade more parts than the strip has." };
        return { spec: { kind: "fracstrip", parts: st.parts, shaded: st.shaded, compare: { parts: d, shaded: n } }, summary: `Your strip has ${st.parts} equal parts and ${st.shaded} are shaded: ${st.shaded}/${st.parts}. The other strip shows ${n}/${d}.` };
      },
      check: (st) => {
        if (st.shaded > st.parts) return { invalid: true, msg: "Shade fewer parts than the strip has." };
        if (st.parts !== m) return { ok: false, msg: `Your strip has ${st.parts} equal parts, but this build needs ${m}.` };
        if (st.shaded * d === n * st.parts) return { ok: true, msg: "" };
        return { ok: false, msg: `Your strip shows ${st.shaded}/${st.parts}, which is not the same size as ${n}/${d}. Compare the shaded part of the two strips.` };
      },
      solution: { parts: m, shaded: n * kk },
      hints: { conceptual: "Equal fractions name the same amount. Cutting every part into smaller equal parts changes the numbers, not the amount.", procedural: "Find how many times the bottom number goes into the parts you need. Multiply the top number by that same number." },
      work: [`${n}/${d}: the whole has ${d} parts and ${n} are shaded.`, `${m} ÷ ${d} = ${kk}, so each part is cut into ${kk} equal smaller parts.`, `Shaded parts: ${n} ${TIMES} ${kk} = ${n * kk}.`, `${n}/${d} = ${n * kk}/${m}.`],
    };
  }
  if (fam === "fracops") {
    const denoms = lv === 1 ? [[2, 2], [3, 3], [4, 4], [5, 5]] : lv === 2 ? [[2, 4], [3, 6], [2, 6], [4, 8], [5, 10], [4, 4]] : [[2, 4], [3, 6], [4, 8], [2, 8], [3, 4], [2, 3], [6, 12], [4, 12]];
    let pick = null;
    for (let t = 0; t < 60 && !pick; t++) {
      const [b, d] = rng.pick(denoms);
      const sub = lv >= 2 && rng.chance(0.4);
      const a = rng.int(1, b - 1);
      const cc = rng.int(1, d - 1);
      const A = fr(a, b);
      const C = fr(cc, d);
      const r = sub ? A.sub(C) : A.add(C);
      if (r.value > 0 && r.value <= 1 && lcm(b, d) <= 12) pick = { a, b, c: cc, d, sub, r };
    }
    pick = pick || { a: 1, b: 2, c: 1, d: 4, sub: false, r: fr(3, 4) };
    const { a, b, d, sub, r } = pick;
    const cc = pick.c;
    const D = lcm(b, d);
    const T = r;
    const sol = { parts: D, shaded: T.n * (D / T.d) };
    return {
      kind: "fracops",
      story: sub ? `Subtract: ${a}/${b} ${MINUS} ${cc}/${d}.` : `Add: ${a}/${b} + ${cc}/${d}.`,
      prompt: `Build the ${sub ? "difference" : "sum"} on the strip. Choose equal parts that make it possible.`,
      controls: [
        { id: "parts", label: "Equal parts in your strip", min: 1, max: 12, value: 1 },
        { id: "shaded", label: "Shaded parts in your strip", min: 0, max: 12, value: 0 },
      ],
      draw: (st) => {
        if (st.shaded > st.parts) return { error: "You cannot shade more parts than the strip has." };
        return { spec: { kind: "fracstrip", parts: st.parts, shaded: st.shaded }, summary: `Your strip has ${st.parts} equal parts and ${st.shaded} are shaded: ${st.shaded}/${st.parts}.` };
      },
      check: (st) => {
        if (st.shaded > st.parts) return { invalid: true, msg: "Shade fewer parts than the strip has." };
        const k = fr(st.shaded, st.parts).cmp(T);
        if (k === 0) return { ok: true, msg: "" };
        return { ok: false, msg: `Your strip shows ${st.shaded}/${st.parts}, which is ${k < 0 ? "less" : "more"} than the ${sub ? "difference" : "sum"}.` };
      },
      solution: sol,
      hints: { conceptual: "Fractions can be added or subtracted when the parts are the same size. Find equal parts that fit both fractions.", procedural: "Choose a number of equal parts that both bottom numbers go into. Rename each fraction with it, then count the shaded parts together." },
      work: [
        `${a}/${b} ${sub ? MINUS : "+"} ${cc}/${d}: the parts must be the same size.`,
        `Use ${D} equal parts, because ${b} and ${d} both go into ${D}.`,
        `${a}/${b} = ${a * (D / b)}/${D} and ${cc}/${d} = ${cc * (D / d)}/${D}.`,
        `${a * (D / b)}/${D} ${sub ? MINUS : "+"} ${cc * (D / d)}/${D} = ${sol.shaded}/${D}.`,
      ],
    };
  }
  const d = rng.pick(lv === 1 ? [2, 3, 4] : lv === 2 ? [3, 4, 5, 6, 8] : [5, 6, 8, 10, 12]);
  const n = lv === 1 && rng.chance(0.5) ? 1 : rng.int(1, d - 1);
  return {
    kind: "fracid",
    story: "Build a fraction on a fraction strip.",
    prompt: `Show the fraction ${n}/${d}. Set the equal parts and the parts that are shaded.`,
    controls: [
      { id: "parts", label: "Equal parts in the whole", min: 1, max: 12, value: 1 },
      { id: "shaded", label: "Shaded parts", min: 0, max: 12, value: 0 },
    ],
    draw: (st) => {
      if (st.shaded > st.parts) return { error: "You cannot shade more parts than the strip has." };
      return { spec: { kind: "fracstrip", parts: st.parts, shaded: st.shaded }, summary: `Your strip has ${st.parts} equal parts and ${st.shaded} are shaded. That shows ${st.shaded}/${st.parts} of the whole.` };
    },
    check: (st) => {
      if (st.shaded > st.parts) return { invalid: true, msg: "Shade fewer parts than the strip has." };
      if (st.parts !== d) return { ok: false, msg: `Your strip has ${st.parts} equal parts. The bottom number of the fraction tells how many equal parts the whole needs.` };
      if (st.shaded !== n) return { ok: false, msg: `You shaded ${st.shaded} parts. The top number of the fraction tells how many parts to shade.` };
      return { ok: true, msg: "" };
    },
    solution: { parts: d, shaded: n },
    hints: hintsBase,
    work: [`The bottom number ${d} tells how many equal parts the whole is cut into.`, `The top number ${n} tells how many parts to shade.`, `The strip has ${d} equal parts with ${n} shaded, so it shows ${n}/${d}.`],
  };
}
function fractionRound(c) {
  const task = fracTask(c);
  const round = {
    label: "",
    steps: [builderStep(task)],
    parallel: () => {
      for (let t = 1; t < 8; t++) {
        const o = fracTask(c, 100 * t);
        if (o.prompt !== task.prompt) return { question: o.prompt, lines: o.work };
      }
      return { question: task.prompt, lines: ["Set the equal parts first.", "Then count the parts the fraction needs."] };
    },
  };
  round.hints = task.hints;
  return round;
}

/* ------------------------------------------------------------------ 7. Ratio Design Challenge */

const RATIO_POOLS = {
  recipe: [
    { labels: ["Blue paint (cups)", "Yellow paint (cups)"], which: 0, story: (a, b) => `A paint mix uses ${a} cups of blue paint for every ${b} cups of yellow paint.`, ask: (N) => `Design a bigger batch with ${N} cups of blue paint that makes the same shade of green.`, kind: "mix" },
    { labels: ["Flour (cups)", "Sugar (cups)"], which: 0, story: (a, b) => `A cookie recipe uses ${a} cups of flour for every ${b} cups of sugar.`, ask: (N) => `Design a bigger recipe with ${N} cups of flour that tastes the same.`, kind: "mix" },
    { labels: ["Lemon juice (cups)", "Water (cups)"], which: 1, story: (a, b) => `A drink mix uses ${a} cups of lemon juice for every ${b} cups of water.`, ask: (N) => `Design a bigger drink with ${N} cups of water that tastes the same.`, kind: "mix" },
    { labels: ["Red beads", "White beads"], which: 0, story: (a, b) => `A bracelet pattern uses ${a} red beads for every ${b} white beads.`, ask: (N) => `Design a longer bracelet with ${N} red beads that keeps the same pattern.`, kind: "mix" },
  ],
  rate: [
    { labels: ["Notebooks", "Cost (dollars)"], which: 0, story: (a, b) => `${a} notebooks cost $${b}.`, ask: (N) => `Design a purchase of exactly ${N} notebooks at the same price for each notebook.`, unit: true },
    { labels: ["Time (hours)", "Distance (miles)"], which: 0, story: (a, b) => `A bike rider goes ${b} miles in ${a} hours at a steady speed.`, ask: (N) => `Design a ride of exactly ${N} hours at the same speed.`, unit: true },
  ],
  percent: [
    { labels: ["Flowers", "All plants"], which: 1, story: (p) => `A garden has 100 plants and ${p} of them are flowers. That is ${p}%.`, ask: (N) => `Design a smaller garden with exactly ${N} plants and the same percent of flowers.` },
    { labels: ["Correct answers", "Questions"], which: 1, story: (p) => `A student answered ${p} of 100 questions correctly. That is ${p}%.`, ask: (N) => `Design a shorter quiz with exactly ${N} questions and the same percent correct.` },
  ],
  scale: [
    { labels: ["Map length (cm)", "Real distance (km)"], which: 1, story: (k) => `On a map, 1 centimeter stands for ${k} kilometers.`, ask: (N) => `A trail is exactly ${N} kilometers long. Design the map: set the map length and the real length.` },
    { labels: ["Model length (in)", "Real car length (in)"], which: 1, story: (k) => `A model car uses 1 inch for every ${k} inches of a real car.`, ask: (N) => `A real car is exactly ${N} inches long. Design the model: set both lengths.` },
  ],
};
const factorText = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
function ratioTask(c, salt = 0) {
  const { S } = c;
  const rng = makeRng(`rd|${S.skill.id}|${S.seed}|${S.attempt}|${c.i}|${salt}`);
  const lv = S.level;
  const fam = fid(S.skill);
  const factor = rng.pick(lv === 1 ? [2, 3] : lv === 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 7]);
  let item;
  let a;
  let b;
  let N;
  let story;
  if (fam === "percent") {
    item = rng.pick(RATIO_POOLS.percent);
    const p = rng.pick([10, 20, 25, 40, 50, 75, 80]);
    const unit = 100 / gcd(p, 100);
    const W = unit * rng.int(1, Math.max(1, Math.floor((lv === 1 ? 40 : lv === 2 ? 80 : 120) / unit)));
    a = p;
    b = 100;
    N = W;
    story = item.story(p);
  } else if (fam === "scale") {
    item = rng.pick(RATIO_POOLS.scale);
    const k = rng.pick([2, 5, 10, 20]);
    a = 1;
    b = k;
    N = k * rng.int(2, lv === 1 ? 5 : 8);
    story = item.story(k);
  } else if (fam === "unitrate") {
    item = rng.pick(RATIO_POOLS.rate);
    const u = rng.int(2, 9);
    a = rng.int(2, 5);
    b = a * u;
    N = a * factor;
    story = item.story(a, b);
  } else {
    item = rng.pick(RATIO_POOLS.recipe);
    const pairs = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [1, 2], [2, 7]];
    [a, b] = rng.pick(pairs);
    story = item.story(a, b);
    N = (item.which === 0 ? a : b) * factor;
  }
  const [l0, l1] = item.labels;
  const MAX = 400;
  const sol = item.which === 0 ? { x: N, y: (N * b) / a } : { x: (N * a) / b, y: N };
  return {
    kind: "ratio",
    story,
    prompt: item.ask(N),
    controls: [
      { id: "x", label: l0, min: 0, max: MAX, value: a },
      { id: "y", label: l1, min: 0, max: MAX, value: b },
    ],
    draw: (st) => ({ spec: { kind: "ratiotable", headers: [l0, l1], rows: [[a, b], [st.x, st.y]] }, summary: `The first row is the original: ${l0} ${a} and ${l1} ${b}. The second row is yours: ${l0} ${st.x} and ${l1} ${st.y}.` }),
    check: (st) => {
      const f1 = fr(st.x, a);
      const f2 = fr(st.y, b);
      const same = st.x * b === st.y * a;
      const hit = item.which === 0 ? st.x === N : st.y === N;
      if (same && hit) return { ok: true, msg: "" };
      if (!same) return { ok: false, msg: `You multiplied the first amount by ${factorText(f1)} and the second amount by ${factorText(f2)}. Those are not the same number, so the relationship changed.` };
      return { ok: false, msg: `The relationship is right, but this design needs exactly ${N} for ${item.labels[item.which]}.` };
    },
    solution: sol,
    hints: {
      conceptual: "A design keeps the same relationship when both amounts are multiplied by the same number of times.",
      procedural: "Find how many times the first amount grew. Then make the second amount grow by that same number of times.",
    },
    work: [
      `Start with ${a} and ${b}. The relationship is ${a} to ${b}.`,
      `The new design needs ${item.which === 0 ? N : sol.x} for the first amount. ${item.which === 0 ? N : sol.x} ÷ ${a} = ${factorText(fr(item.which === 0 ? N : sol.x, a))}.`,
      `Multiply the second amount by the same number: ${b} ${TIMES} ${factorText(fr(item.which === 0 ? N : sol.x, a))} = ${sol.y}.`,
      `The new design is ${sol.x} to ${sol.y}. It has the same relationship as ${a} to ${b}.`,
    ],
  };
}
function ratioRound(c) {
  const task = ratioTask(c);
  return {
    label: "",
    steps: [builderStep(task)],
    hints: task.hints,
    parallel: () => {
      for (let t = 1; t < 8; t++) {
        const o = ratioTask(c, 100 * t);
        if (o.prompt !== task.prompt) return { question: `${o.story} ${o.prompt}`, lines: o.work };
      }
      return { question: task.prompt, lines: ["Find how many times the first amount grew.", "Grow the second amount by the same number of times."] };
    },
  };
}

/* ------------------------------------------------------------------ 8 and 12. Graph Detective, Data Investigation Lab */

const DISPLAYS = { bar: "Bar graph", lineplot: "Line plot", boxplot: "Box plot", scatter: "Scatter plot", table: "Table", spinner: "Spinner", coord: "Coordinate graph", numberline: "Number line", ratiotable: "Ratio table", doublenl: "Double number line", tape: "Tape diagram" };
function claimSteps(c, q, { noun }) {
  const { S, rng } = c;
  const truthful = rng.chance(0.5);
  const d = rng.pick(q.distractors);
  const said = truthful ? q.answer.text : d.text;
  const name = rng.pick(NAMES);
  const { stem, ask } = problemText(q, S.band);
  const body = h("div", { class: "ml-gm-body" });
  if (stem) body.append(para(stem));
  if (q.expr) body.append(h("p", { class: "ml-gm-expr" }, q.expr));
  if (q.visual) {
    const v = visualNode(q.visual);
    if (v) body.append(v);
  }
  body.append(h("p", { class: "ml-gm-claim" }, h("strong", {}, `${name} says: `), `“The answer to “${ask}” is ${said}.”`));
  const yes = { text: "Yes, the information supports it.", correct: truthful, why: truthful ? "Check the information again. Read the value carefully before you decide." : `That answer comes from a common mix-up: ${words(d.misconception)}.` };
  const no = { text: "No, the information does not support it.", correct: !truthful, why: truthful ? "Check the information again. Read the value carefully before you decide." : "Check the information again. Read the value carefully before you decide." };
  const judge = {
    type: "mc",
    prompt: `Does the ${noun} support what ${name} says?`,
    body,
    speak: `${stem} ${ask} ${name} says the answer is ${said}. Does the ${noun} support what ${name} says?`,
    options: rng.shuffle([yes, no]),
    hints: q.hints,
    ok: truthful ? `Yes: ${said} matches the ${noun}.` : `Right: ${said} does not match the ${noun}.`,
  };
  const evid = lastIdeaLine(q.work);
  const oth = others(c, 5, (x) => lastIdeaLine(x.work), { salt: 1100 }).filter((o) => norm(o.v) !== norm(evid));
  const foils = distinctBy([...oth.map((o) => o.v), ...S.skill.misconceptions.map((m) => m.belief)], (x) => x);
  const nOpt = S.level === 1 ? 3 : 4;
  const evidence = {
    type: "mc",
    reason: true,
    prompt: "Which statement is the best evidence? It must match the information you were shown.",
    body: null,
    options: rng.shuffle([{ text: evid, correct: true }, ...foils.slice(0, nOpt - 1).map((f) => ({ text: f, correct: false, why: "That statement does not match the information you were shown. Check the numbers against the picture." }))]),
    ok: "That evidence matches what you were shown.",
  };
  return { judge, evidence };
}
function graphRound(c, { data }) {
  const { S, rng } = c;
  const score = (q) => (q.visual ? 4 : 0) + (q.stem.standard ? 1 : 0);
  const p = S.best(score, 3, 10);
  if (!p) return null;
  const q = S.best((x) => score(x) + (p.visual && x.visual && x.visual.kind === p.visual.kind ? 2 : 0), 41, 10) || p;
  const noun = p.visual || q.visual ? "picture" : "information";
  const steps = [];
  const invented = h("p", { class: "ml-gm-invent" }, data ? "This data set is invented for practice. It is not about real people." : "The data in these pictures is invented for practice.");
  if (data && p.visual && DISPLAYS[p.visual.kind]) {
    const kinds = rng.sample(Object.keys(DISPLAYS).filter((k) => k !== p.visual.kind), S.level === 1 ? 2 : 3);
    steps.push({
      type: "mc",
      prompt: "Which kind of display shows this data?",
      body: h("div", { class: "ml-gm-body" }, invented, visualNode(p.visual)),
      speak: "Which kind of display shows this data?",
      options: rng.shuffle([{ text: DISPLAYS[p.visual.kind], correct: true }, ...kinds.map((k) => ({ text: DISPLAYS[k], correct: false, why: `Look at how the data is drawn. That is not a ${DISPLAYS[k].toLowerCase()}.` }))]),
      hints: { conceptual: "Look at the marks that show the data: bars, dots, points, a box or numbers in rows.", procedural: "Compare the picture with each name. Which name describes how it is drawn?" },
      ok: `It is a ${DISPLAYS[p.visual.kind].toLowerCase()}.`,
    });
  }
  const read = solveStep(c, p, { body: problemBody(c, p) });
  if (!data || !steps.length) read.body.prepend?.(invented);
  steps.push(read);
  const { judge, evidence } = claimSteps(c, q, { noun });
  steps.push(judge, evidence);
  return { label: "", problem: p, steps, parallel: () => parallelFromFamily(c, p) };
}

/* ------------------------------------------------------------------ 9. Mathematical Debate Challenge */

function debatePlan(S) {
  const d = S.skill.discourse;
  const plan = [];
  (d.asn || []).forEach((a, i) => plan.push({ t: "asn", i }));
  if (d.debate?.claim && d.debate.forEvidence && d.debate.againstEvidence) plan.push({ t: "for" }, { t: "against" });
  const tr = S.skill.transfer;
  if (tr?.phrasings?.length && tr?.decoys?.length) plan.push({ t: "fit", yes: false, i: 0 }, { t: "fit", yes: true, i: 0 }, { t: "fit", yes: false, i: 1 });
  return plan;
}
function debateRound(c) {
  const { S, rng } = c;
  const plan = debatePlan(S);
  if (!plan.length) return null;
  const item = plan[c.i % plan.length];
  const d = S.skill.discourse;
  const nOpt = S.level === 1 ? 3 : 4;
  const beliefs = S.skill.misconceptions.map((m) => m.belief);
  if (item.t === "asn") {
    const a = d.asn[item.i];
    if (!["always", "sometimes", "never"].includes(a.verdict)) return null;
    const verdicts = [["always", "Always true"], ["sometimes", "Sometimes true"], ["never", "Never true"]];
    const otherWhy = (d.asn || []).filter((x) => x !== a).map((x) => x.why);
    const foils = distinctBy([...rng.sample(beliefs, 2), ...otherWhy, ...GENERIC_FOILS], (x) => x).filter((x) => norm(x) !== norm(a.why));
    const round = {
      label: "",
      steps: [
        {
          type: "mc",
          prompt: "Is this claim always true, sometimes true or never true?",
          body: para(`Claim: ${a.claim}`, "ml-gm-quote"),
          options: verdicts.map(([v, t]) => ({ text: t, correct: v === a.verdict, why: "Test the claim with a few different cases before you decide." })),
          hints: { conceptual: "Try the claim on a few different examples. Does it work in every case, only in some, or in none?", procedural: "Look for one example that breaks the claim. If you find one, it is not always true. Then look for one that works." },
          ok: `The claim is ${a.verdict} true.`,
        },
        { type: "mc", reason: true, prompt: "Which evidence best explains your decision?", body: null, options: rng.shuffle([{ text: a.why, correct: true }, ...foils.slice(0, nOpt - 1).map((f) => ({ text: f, correct: false, why: "That statement does not explain this claim. Look for a case that matches the claim." }))]), ok: "That evidence explains it." },
      ],
      parallel: () => {
        const u = (d.asn || []).find((x) => x !== a);
        if (!u) return { question: "Here is how to test a claim.", lines: ["Try the claim on several different examples.", "If it works for every example you try, it may be always true.", "If one example breaks it, it is not always true."] };
        return { question: `Claim: ${u.claim}`, lines: ["Test it on different examples.", `Verdict: ${u.verdict} true.`, `Why: ${u.why}`] };
      },
    };
    return round;
  }
  if (item.t === "for" || item.t === "against") {
    const f = item.t === "for";
    const dd = d.debate;
    const right = f ? dd.forEvidence : dd.againstEvidence;
    return {
      label: "",
      steps: [
        {
          type: "mc",
          prompt: `Which side does this evidence support: for the claim or against it?`,
          body: h("div", { class: "ml-gm-body" }, para(`Claim: ${dd.claim}`, "ml-gm-quote"), para(`Evidence: ${right}`, "ml-gm-quote")),
          options: rng.shuffle([
            { text: "For the claim", correct: f, why: "Read the evidence again. Does it back the claim up or push against it?" },
            { text: "Against the claim", correct: !f, why: "Read the evidence again. Does it back the claim up or push against it?" },
          ]),
          hints: { conceptual: "Evidence for a claim helps show it is true. Evidence against a claim helps show it is not.", procedural: "Say the claim, then say the evidence. Does the evidence agree with the claim or disagree?" },
          ok: f ? "That evidence supports the claim." : "That evidence is against the claim.",
        },
      ],
      parallel: () => ({ question: "Here is how to sort evidence.", lines: ["Say the claim in your own words.", "Say what the evidence shows.", "If they agree, the evidence is for the claim. If they disagree, it is against the claim."] }),
    };
  }
  const tr = S.skill.transfer;
  const yes = item.yes;
  const text = yes ? tr.phrasings[rng.int(0, tr.phrasings.length - 1)] : tr.decoys[item.i % tr.decoys.length].text;
  const why = yes ? `It fits: ${tr.relationship}.` : tr.decoys[item.i % tr.decoys.length].why;
  const other = tr.decoys.filter((x) => x.why !== why).map((x) => x.why);
  const foils = distinctBy([...other, ...rng.sample(beliefs, 2), ...GENERIC_FOILS], (x) => x).filter((x) => norm(x) !== norm(why));
  return {
    label: "",
    steps: [
      {
        type: "mc",
        prompt: "Does this describe the same relationship?",
        body: h("div", { class: "ml-gm-body" }, para(`The relationship: ${tr.relationship}.`, "ml-gm-quote"), para(`Is this an example? ${text}`, "ml-gm-quote")),
        options: rng.shuffle([
          { text: "Yes, it fits.", correct: yes, why: "Check whether it has the same parts and the same relationship." },
          { text: "No, it does not fit.", correct: !yes, why: "Check whether it has the same parts and the same relationship." },
        ]),
        hints: { conceptual: "A good example has the same parts and the same relationship, even if the words look different.", procedural: "Name each part in the relationship. Look for each part in the example." },
        ok: yes ? "It fits the relationship." : "It does not fit the relationship.",
      },
      { type: "mc", reason: true, prompt: yes ? "Which statement explains why it fits?" : "Which statement explains why it does not fit?", body: null, options: rng.shuffle([{ text: why, correct: true }, ...foils.slice(0, nOpt - 1).map((f) => ({ text: f, correct: false, why: "That statement does not explain this example." }))]), ok: "That explains it." },
    ],
    parallel: () => ({ question: "Here is how to check an example.", lines: ["Name the parts of the relationship.", "Look for each part in the example.", "If a part is missing, or the parts are joined a different way, it does not fit."] }),
  };
}

/* ------------------------------------------------------------------ 10. Strategy Showdown */

const BOTH_VALID = /both (ways|strategies|methods|get|find|say|give|are correct|work)|do both (strategies|methods|ways) work/i;
const FLAW_WORDS = /flaw|mistake|wrong|error|incorrect/i;
function strategyRound(c) {
  const { S, rng } = c;
  const cmp = S.skill.discourse.compare;
  const authored = cmp?.a && cmp?.b && cmp.prompt && BOTH_VALID.test(cmp.prompt) && !FLAW_WORDS.test(cmp.prompt);
  const nOpt = S.level === 1 ? 3 : 4;
  const fresh = S.gen(31);
  const apply = fresh ? { ...solveStep(c, fresh, { prompt: `Now use a valid strategy on a new problem. ${problemText(fresh, S.band).ask}` }), ok: "You applied a valid strategy." } : null;
  const p = S.gen(37);
  if (authored && c.i === 1) {
    const round = {
      label: "",
      problem: fresh || undefined,
      steps: [
        {
          type: "mc",
          prompt: "Do both strategies work?",
          body: h("div", { class: "ml-gm-body" }, para(`Strategy A: ${cmp.a}`, "ml-gm-quote"), para(`Strategy B: ${cmp.b}`, "ml-gm-quote")),
          options: rng.shuffle([
            { text: "Yes, both strategies work.", correct: true },
            { text: "Only Strategy A works.", correct: false, why: "Check Strategy B step by step. Does each step follow from the one before?" },
            { text: "Only Strategy B works.", correct: false, why: "Check Strategy A step by step. Does each step follow from the one before?" },
          ]),
          hints: { conceptual: "A strategy is valid when every step is true and each step follows from the one before.", procedural: "Check each strategy one step at a time, and check that it ends at the same result." },
          ok: "Both strategies are valid ways to think.",
        },
      ],
      parallel: () => parallelFromFamily(c, fresh),
    };
    round.steps.push(reasonStep(c, round, { prompt: "Why can two different strategies both be valid? Pick the idea that is true." }));
    if (apply) round.steps.push(apply);
    return round;
  }
  if (!p) return null;
  const d = rng.pick(p.distractors);
  const [n1, n2] = rng.sample(NAMES, 2);
  const flawedFirst = rng.chance(0.5);
  const good = h("div", { class: "ml-gm-strat" }, h("p", { class: "ml-gm-strat-h" }, flawedFirst ? "Strategy 2" : "Strategy 1"), h("p", {}, `${n1}'s steps:`), h("ol", { class: "ml-gm-work" }, p.work.map((w) => h("li", {}, w))));
  const bad = h("div", { class: "ml-gm-strat" }, h("p", { class: "ml-gm-strat-h" }, flawedFirst ? "Strategy 1" : "Strategy 2"), h("p", {}, `${n2}'s thinking: ${cap(words(d.misconception))}.`), h("p", {}, `${n2}'s answer: ${d.text}`));
  const { stem, ask } = problemText(p, S.band);
  const body = h("div", { class: "ml-gm-body" }, ...(stem ? [para(stem)] : []), ...(p.expr ? [h("p", { class: "ml-gm-expr" }, p.expr)] : []), ...(p.visual ? [visualNode(p.visual)] : []), para(ask), flawedFirst ? bad : good, flawedFirst ? good : bad);
  const opts = [
    { text: "Strategy 1 is valid.", correct: flawedFirst === false, why: "Check each strategy: does its thinking match what the problem asks?" },
    { text: "Strategy 2 is valid.", correct: flawedFirst === true, why: "Check each strategy: does its thinking match what the problem asks?" },
  ];
  if (nOpt > 3) opts.push({ text: "Both are valid.", correct: false, why: "The two strategies end at different answers, so they cannot both be valid." });
  const round = {
    label: "",
    problem: p,
    steps: [{ type: "mc", prompt: "Which strategy is valid?", body, speak: `${stem} ${ask} Which strategy is valid?`, options: rng.shuffle(opts), hints: p.hints, ok: "That strategy is valid." }],
    parallel: () => parallelFromFamily(c, p),
  };
  round.steps.push(reasonStep(c, round, { prompt: "Why is that strategy valid? Pick the idea that is true." }));
  if (apply) round.steps.push(apply);
  return round;
}

/* ------------------------------------------------------------------ 11. Number Relationship Explorer */

const EXPLORERS = {
  numrel: {
    controls: [{ id: "n", label: "Start number", min: 10, max: 89, value: 34 }],
    table: (s) => ({ headers: ["Start", "10 less", "10 more", "1 less", "1 more"], rows: [[s.n, s.n - 10, s.n + 10, s.n - 1, s.n + 1]] }),
    patterns: [
      { say: "10 more changes the tens digit by 1 and leaves the ones digit the same.", foils: ["10 more changes the ones digit by 1 and leaves the tens digit the same.", "10 more changes both digits by 1."] },
      { say: "10 more is 20 greater than 10 less.", foils: ["10 more is 10 greater than 10 less.", "10 more and 10 less are the same number."] },
    ],
  },
  patterns: {
    controls: [{ id: "s", label: "Start number", min: 0, max: 20, value: 3 }, { id: "k", label: "Number you add each time", min: 1, max: 9, value: 4 }],
    table: (s) => ({ headers: ["Term", "Value"], rows: [1, 2, 3, 4, 5, 6].map((i) => [i, s.s + s.k * (i - 1)]) }),
    patterns: [
      { say: "The gap between neighboring terms stays the same: it is the number you add.", foils: ["The terms double each time.", "The gap between neighboring terms gets bigger each time."] },
      { say: "Changing the start number moves every term, but the gaps stay the same size.", foils: ["Changing the start number changes the size of the gaps.", "Changing the start number changes only the first term."] },
    ],
  },
  properties: {
    controls: [{ id: "a", label: "First factor", min: 1, max: 9, value: 3 }, { id: "b", label: "Second factor", min: 1, max: 9, value: 4 }, { id: "c", label: "Third factor", min: 1, max: 5, value: 2 }],
    table: (s) => ({ headers: ["Expression", "Product"], rows: [[`${s.a} ${TIMES} ${s.b}`, s.a * s.b], [`${s.b} ${TIMES} ${s.a}`, s.b * s.a], [`(${s.a} ${TIMES} ${s.b}) ${TIMES} ${s.c}`, s.a * s.b * s.c], [`${s.a} ${TIMES} (${s.b} ${TIMES} ${s.c})`, s.a * s.b * s.c]] }),
    visual: (s) => ({ kind: "array", rows: s.a, cols: s.b }),
    patterns: [
      { say: "Switching the order of two factors gives the same product.", foils: ["Switching the order of two factors changes the product.", "The product is always greater when the first factor is greater."] },
      { say: "Grouping three factors in a different way gives the same product.", foils: ["Grouping three factors in a different way changes the product.", "You must always multiply the first two factors first to get the right product."] },
    ],
  },
  factors: {
    controls: [{ id: "n", label: "Number", min: 2, max: 48, value: 12 }],
    table: (s) => {
      const rows = [];
      for (let d = 1; d * d <= s.n; d++) if (s.n % d === 0) rows.push([d, s.n / d, s.n]);
      return { headers: ["Factor", "Partner", "Product"], rows };
    },
    patterns: [
      { say: "Factors come in pairs that multiply to make the number.", foils: ["Every number has exactly two factors.", "A factor is always greater than the number."] },
      { say: "Every number has 1 and itself as factors.", foils: ["Only prime numbers have 1 as a factor.", "A number is never a factor of itself."] },
    ],
  },
  multcompare: {
    controls: [{ id: "n", label: "Amount in group A", min: 2, max: 9, value: 3 }, { id: "t", label: "Times as many (or more)", min: 2, max: 9, value: 4 }],
    table: (s) => ({ headers: ["Group B has", "Amount"], rows: [[`${s.t} times as many as A`, s.n * s.t], [`${s.t} more than A`, s.n + s.t]] }),
    patterns: [
      { say: "“Times as many” means multiply. “More” means add.", foils: ["“Times as many” and “more” both mean add.", "“Times as many” means add the same number."] },
      { say: "“Times as many” grows faster than “more” as the amount gets greater.", foils: ["“More” grows faster than “times as many” as the amount gets greater.", "“Times as many” and “more” always give the same amount."] },
    ],
  },
  exprs: {
    controls: [{ id: "a", label: "First number", min: 1, max: 9, value: 6 }, { id: "b", label: "Second number", min: 1, max: 9, value: 4 }, { id: "c", label: "Third number", min: 2, max: 9, value: 3 }],
    table: (s) => ({ headers: ["Expression", "Value"], rows: [[`${s.a} + ${s.b} ${TIMES} ${s.c}`, s.a + s.b * s.c], [`(${s.a} + ${s.b}) ${TIMES} ${s.c}`, (s.a + s.b) * s.c]] }),
    patterns: [
      { say: "Parentheses can change the value of an expression.", foils: ["Parentheses never change the value of an expression.", "The value depends only on the order you read the numbers."] },
      { say: "Without parentheses, multiplication is done before addition.", foils: ["Without parentheses, addition is done before multiplication.", "Without parentheses, operations are always done left to right."] },
    ],
  },
  tensones: {
    controls: [{ id: "t", label: "Tens", min: 0, max: 9, value: 3 }, { id: "o", label: "Ones", min: 0, max: 9, value: 4 }],
    table: (s) => ({ headers: ["Part", "Value"], rows: [["The number", s.t * 10 + s.o], ["The tens digit is worth", s.t * 10], ["The ones digit is worth", s.o]] }),
    visual: (s) => ({ kind: "placevalue", tens: s.t, ones: s.o }),
    patterns: [
      { say: "The tens digit is worth ten times its face value.", foils: ["The tens digit is worth the same as its face value.", "The ones digit is worth ten times its face value."] },
      { say: "Swapping the two digits makes a different number unless the digits are the same.", foils: ["Swapping the two digits always gives the same number.", "Swapping the two digits always makes the number smaller."] },
    ],
  },
  expanded: {
    controls: [{ id: "h", label: "Hundreds", min: 0, max: 9, value: 3 }, { id: "t", label: "Tens", min: 0, max: 9, value: 4 }, { id: "o", label: "Ones", min: 0, max: 9, value: 5 }],
    table: (s) => ({ headers: ["Part", "Value"], rows: [["The number", s.h * 100 + s.t * 10 + s.o], ["Expanded form", `${s.h * 100} + ${s.t * 10} + ${s.o}`]] }),
    visual: (s) => ({ kind: "placevalue", hundreds: s.h, tens: s.t, ones: s.o }),
    patterns: [
      { say: "Each digit is worth the digit times its place value.", foils: ["Each digit is worth only the digit itself.", "The ones digit is always worth the most."] },
      { say: "A zero digit holds its place and adds nothing to the expanded form.", foils: ["A zero digit adds ten to the expanded form.", "A zero digit can be left out without changing the number."] },
    ],
  },
  compare: {
    controls: [{ id: "a", label: "Number A", min: 0, max: 999, step: 1, value: 345 }, { id: "b", label: "Number B", min: 0, max: 999, step: 1, value: 354 }],
    table: (s) => ({ headers: ["Number A", "Number B", "Comparison"], rows: [[s.a, s.b, s.a > s.b ? "A is greater" : s.a < s.b ? "B is greater" : "They are equal"]] }),
    visual: (s) => ({ kind: "numberline", min: 0, max: 1000, ticks: 10, marks: [{ at: s.a, label: "A" }, { at: s.b, label: "B" }], show: "int", labelTicks: "ends" }),
    patterns: [
      { say: "Compare digits from the left. The first place where they differ decides which number is greater.", foils: ["Compare digits from the right. The ones digit decides which number is greater.", "The number with the greater ones digit is always the greater number."] },
      { say: "The number farther right on a number line is greater.", foils: ["The number farther left on a number line is greater.", "Two different numbers can be at the same spot on a number line."] },
    ],
  },
};

function exploreStep(c, ex) {
  const { S, rng } = c;
  const frac = [0.4, 0.7, 1][S.level - 1];
  const start = {};
  for (const ct of ex.controls) {
    const span = ct.max - ct.min;
    start[ct.id] = clamp(ct.min + Math.round(rng.next() * span * frac), ct.min, ct.max);
  }
  const needed = S.level === 3 ? 4 : 3;
  return {
    type: "custom",
    kind: "explore",
    needed,
    prompt: "Use the + and − buttons. Change the numbers and watch the table. What changes? What stays the same?",
    ok: "You explored it.",
    mount: (api) => {
      const root = h("div", { class: "ml-gm-explore" });
      const pid = uid("gp");
      root.append(h("div", { class: "ml-gm-promptrow" }, h("p", { class: "ml-gm-prompt", id: pid }, "Use the + and − buttons. Change the numbers and watch the table. What changes? What stays the same?"), hearButton("Use the plus and minus buttons. Change the numbers and watch the table. What changes? What stays the same?")));
      const state = { ...start };
      const tableBox = h("div", { class: "ml-gm-tablebox" });
      const visBox = h("div", { class: "ml-gm-visbox" });
      let changes = 0;
      const status = h("p", { class: "ml-gm-status", "aria-live": "polite" });
      const go = h("button", { type: "button", class: "ml-gm-btn primary", disabled: true, onclick: () => { if (!api.locked()) { go.setAttribute("aria-disabled", "true"); api.right(""); } } }, "I noticed a pattern");
      const draw = () => {
        const t = ex.table(state);
        clear(tableBox);
        const tbl = h("table", { class: "ml-gm-table" }, h("caption", { class: "ml-sr" }, "What the numbers do"), h("thead", {}, h("tr", {}, t.headers.map((x) => h("th", { scope: "col" }, x)))), h("tbody", {}, t.rows.map((r) => h("tr", {}, r.map((x) => h("td", {}, String(x)))))));
        tableBox.append(tbl);
        clear(visBox);
        if (ex.visual) {
          const v = visualNode(ex.visual(state));
          if (v) visBox.append(v);
        }
        const left = Math.max(0, needed - changes);
        status.textContent = left > 0 ? `Change the numbers ${left} more ${left === 1 ? "time" : "times"} to go on.` : "You can go on when you have noticed a pattern.";
        if (left === 0) go.removeAttribute("disabled");
      };
      const controls = h("div", { class: "ml-gm-controls", role: "group", "aria-labelledby": pid });
      for (const ct of ex.controls) {
        const sr = stepperRow({ label: ct.label, min: ct.min, max: ct.max, step: ct.step || 1, value: state[ct.id], onChange: (v) => { state[ct.id] = v; changes += 1; draw(); } });
        controls.append(sr.row);
      }
      root.append(h("div", { class: "ml-gm-builder-grid" }, controls, h("div", { class: "ml-gm-out" }, tableBox, visBox)), status, go);
      draw();
      return root;
    },
  };
}
function explorerRound(c) {
  const { S, rng } = c;
  const ex = EXPLORERS[fid(S.skill)];
  if (!ex) return null;
  const pats = ex.patterns;
  const pat = pats[c.i % pats.length];
  const nOpt = S.level === 1 ? 3 : 4;
  const gen = (extra) => distinctBy([...pat.foils, ...extra], (x) => x).filter((x) => norm(x) !== norm(pat.say));
  const oth = pats.filter((x) => x !== pat).map((x) => x.say);
  const foils = gen(S.skill.misconceptions.map((m) => m.belief)).slice(0, Math.max(nOpt - 1, pat.foils.length));
  const sayStep = {
    type: "mc",
    prompt: "Which sentence states the pattern you found?",
    body: null,
    options: rng.shuffle([{ text: pat.say, correct: true }, ...foils.slice(0, nOpt - 1).map((f) => ({ text: f, correct: false, why: "Check that sentence against every row of the table." }))]),
    hints: { conceptual: "Look at the table again. What changes when you press + and what stays the same?", procedural: "Try a small change and a big change. Check each sentence against every row." },
    ok: "That sentence matches what the table shows.",
  };
  return {
    label: "",
    steps: [exploreStep(c, ex), sayStep],
    parallel: () => {
      const s0 = {};
      ex.controls.forEach((ct) => { s0[ct.id] = clamp(ct.value + 2, ct.min, ct.max); });
      const t = ex.table(s0);
      return { question: "Here is how someone explored it. They tried a setting and read the table.", lines: [...t.rows.slice(0, 3).map((r) => `${t.headers.map((hd, i) => `${hd}: ${r[i]}`).join(", ")}`), `They noticed: ${oth[0] || pat.say}`] };
    },
  };
}

/* ------------------------------------------------------------------ the twelve games */

const NUMBERS_WORDS = { up: "This one has bigger numbers.", down: "This one has friendlier numbers.", levels: ["friendlier numbers", "grade-level numbers", "bigger numbers"] };
const IDEA_WORDS = { up: "This one is a little harder.", down: "This one is a little easier.", levels: ["a little easier", "grade level", "a little harder"] };
const FAMILY_SETS = {
  fraction: ["fracid", "fracline", "fracequiv", "fracops"],
  ratio: ["ratio", "unitrate", "percent", "proportional", "scale"],
  graph: ["bargraph", "lineplot", "coordinate", "scatter", "stats", "indepdep"],
  data: ["lineplot", "stats", "sampling", "scatter", "probability"],
  number: ["numrel", "patterns", "properties", "factors", "multcompare", "exprs", "tensones", "expanded", "compare"],
};
const inSet = (set) => (skill) => FAMILY_SETS[set].includes(fid(skill));
const always = () => true;

function game(id, title, blurb, eligible, def) {
  return {
    title,
    blurb,
    eligible,
    mount(el, opts = {}) {
      return runGame(el, opts, { id, title, ...def });
    },
  };
}

export const GAMES = {
  "vocab-quest": game("vocab-quest", "Vocabulary Quest", "Match math words to meanings, pictures, sentences and examples, then explain why.", always, {
    intro: ["Look at the word clue. Tap the best answer.", "Match each math word to its meaning, picture, sentence or example."],
    words: IDEA_WORDS,
    n: () => 7,
    round: vocabRound,
  }),
  "wp-investigator": game("wp-investigator", "Word Problem Investigator", "Investigate what is happening, what is known and what is unknown before you solve.", always, {
    intro: ["Be a detective. First find out what is happening. Then solve.", "Investigate the story first: what is happening, what you know and what you need to find. Then solve."],
    words: NUMBERS_WORDS,
    round: wpRound,
  }),
  "equation-escape": game("equation-escape", "Equation Escape Room", "Solve the door problems to find the code word. No time pressure, and a miss only brings a hint.", always, {
    intro: ["Each door has a problem. Solve it to find a letter of the code.", "Each door has a problem. Solving it opens the door and shows a letter of the code word."],
    words: NUMBERS_WORDS,
    n: escape_.n,
    setup: escape_.setup,
    round: escape_.round,
    end: escape_.end,
  }),
  "rep-match": game("rep-match", "Representation Match", "Match the story, the expression and the picture of the same situation.", always, {
    intro: ["Match the story, the picture and the number sentence that go together.", "Match the story, the expression and the picture or table of the same situation."],
    words: NUMBERS_WORDS,
    round: repRound,
  }),
  "misconception-detective": game("misconception-detective", "Mathematical Misconception Detective", "Find the first wrong step in a student's work, name the belief behind it, then solve a fresh problem.", always, {
    intro: ["Read a student's work. Find the step that goes wrong first.", "Read a student's work. Find the first wrong step, pick the belief behind it, then solve a fresh problem."],
    words: NUMBERS_WORDS,
    round: detectiveRound,
  }),
  "fraction-architect": game("fraction-architect", "Fraction Architect", "Build fractions on strips and number lines with buttons, then check them exactly.", inSet("fraction"), {
    intro: ["Build the fraction with the + and − buttons. Then check it.", "Build the target fraction on a strip or number line with the steppers, then check it. Explain why it works."],
    words: NUMBERS_WORDS,
    round: fractionRound,
  }),
  "ratio-design": game("ratio-design", "Ratio Design Challenge", "Design a mix, a price, a speed or a map that keeps the same relationship.", inSet("ratio"), {
    intro: ["Make a bigger batch that keeps the same mix. Use the + and − buttons.", "Design something new that keeps the same relationship. Use the steppers, then check it."],
    words: NUMBERS_WORDS,
    round: ratioRound,
  }),
  "graph-detective": game("graph-detective", "Graph Detective", "Read a graph, then judge a claim about a second graph and pick the evidence.", inSet("graph"), {
    intro: ["Look at the picture. Read it. Then decide if a friend is right.", "Read the graph or table, then judge a claim about a second one and pick the evidence that supports your decision."],
    words: NUMBERS_WORDS,
    round: (c) => graphRound(c, { data: false }),
  }),
  "debate-challenge": game("debate-challenge", "Mathematical Debate Challenge", "Sort claims, weigh evidence and decide what is a good example.", always, {
    intro: ["Read a claim. Decide if it is always, sometimes or never true.", "Sort each claim as always, sometimes or never true, then pick the evidence that explains your decision."],
    words: IDEA_WORDS,
    round: debateRound,
  }),
  "strategy-showdown": game("strategy-showdown", "Strategy Showdown", "Compare two strategies, choose the valid one and say why, then use it on a new problem.", always, {
    intro: ["Two students solved a problem. Pick the one that makes sense.", "Compare two strategies, choose the valid one and say why. Then use it on a new problem."],
    words: NUMBERS_WORDS,
    round: strategyRound,
  }),
  "number-explorer": game("number-explorer", "Number Relationship Explorer", "Change numbers, watch what happens and say the pattern you find.", inSet("number"), {
    intro: ["Press + and − to change the numbers. Watch the table. Find a pattern.", "Change the numbers with the steppers, watch the table, then choose the sentence that states the pattern. Discovery comes first."],
    words: NUMBERS_WORDS,
    round: explorerRound,
  }),
  "data-lab": game("data-lab", "Data Investigation Lab", "Investigate a small invented data set: pick a display, read it and judge a conclusion with evidence.", inSet("data"), {
    intro: ["This data is made up for practice. Look at it. Decide if a friend is right.", "Investigate a small invented data set: name the display, read it, judge a conclusion and pick the evidence."],
    words: NUMBERS_WORDS,
    round: (c) => graphRound(c, { data: true }),
  }),
};

/** A game that is eligible for every skill: by family first, then by what is always safe. */
export function defaultGameFor(skill) {
  const f = fid(skill);
  for (const [id, set] of [["fraction-architect", "fraction"], ["ratio-design", "ratio"], ["graph-detective", "graph"], ["data-lab", "data"], ["number-explorer", "number"]]) {
    if (FAMILY_SETS[set].includes(f) && GAMES[id].eligible(skill)) return id;
  }
  if (!f || !skill) return "vocab-quest";
  return (skill.grade || 3) <= 2 ? "vocab-quest" : "strategy-showdown";
}
