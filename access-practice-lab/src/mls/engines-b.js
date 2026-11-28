// Math Literacy Studio: instructional engines, part B (listening-lab, error-detective, story-studio, modeling-workshop,
// concept-comics, transfer-lab). Each is { title, blurb, mount(el, opts) -> { destroy() } } with
// opts = { skill, band: "1-2"|"3-4"|"5-6", level: 1-3, seed, support, ctx } (band = language support, level = mathematics; independent).
//
// Rules every engine here keeps (docs/math-literacy/architecture.md, "Interactive"):
//  - DOM is built with h() (textContent only). The only innerHTML is SVG we generate ourselves or renderVisual() output.
//  - A wrong answer gets a hint ladder (conceptual, procedural, then a worked PARALLEL example from another seed); it never shows the answer.
//  - Nothing is timed, nothing is stored or sent. Device speech goes only through ui-kit speak()/hearButton() and is always called the device voice.
//  - Open writing is never auto-graded: checkSentence() judges shape only, and the page says so.
//  - A skill that lacks an optional field (or whose problem family has no generator yet) loses that task, never the whole engine.
import { h, clear, say, feedback, speak, stopSpeech, speechAvailable, hearButton, problemText, makeLadder, seedFor, styles } from "./ui-kit.js";
import { ensureStylesheet } from "../util.js";
import { generate, FAMILIES } from "./families.js";
import { choicesOf, makeRng, numerals, NAMES } from "./kit.js";
import { renderVisual } from "./visuals.js";
import { bandOf, framesFor, wordBank, checkSentence } from "./lang.js";

/* ------------------------------------------------------------------ small shared helpers */

const PAL = { navy: "#17324D", teal: "#1FA6A2", tealD: "#0F7E7B", amber: "#F2C15B", coral: "#E8765A", ink: "#24323F", paper: "#F7F4EC" };
let uid = 0;
const nid = (p) => `eb-${p}-${++uid}`;
const gradeBand = (sk) => (sk?.grade <= 2 ? 0 : sk?.grade <= 5 ? 1 : 2);
const byGrade = (sk, a, b, c) => [a, b, c][gradeBand(sk)];
const keyOf = (p) => JSON.stringify(p.spec);
const escXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const termsOfSkill = (sk) => (sk.vocab || []).map((v) => v.term);
const note = (text, cls = "") => h("p", { class: `eb-note ${cls}` }, text);

function norm(opts = {}) {
  const skill = opts.skill || { id: "none", title: "this skill", grade: 3, vocab: [], misconceptions: [] };
  return {
    skill,
    band: bandOf(opts.band || "3-4"),
    level: Math.max(1, Math.min(3, Number(opts.level) || 2)),
    seed: Number(opts.seed) || 1,
    support: opts.support || "standard",
    ctx: opts.ctx || skill.contexts?.[0] || "store",
    round: 0,
  };
}

/** Root element for an engine: loads the shared and the engine stylesheet, tags the grade theme. */
function boot(el, cls, o) {
  clear(el);
  ensureStylesheet("mls-play-engines-b.css")?.catch?.(() => {});
  styles().catch(() => {});
  const root = h("div", { class: `eb ${cls} eb-g${["12", "35", "68"][gradeBand(o.skill)]}`, "data-eb-band": o.band, "data-eb-skill": o.skill.id });
  el.append(root);
  return root;
}
const head = (text, id) => h("h2", { id, tabindex: "-1", class: "eb-h" }, text);
const btn = (label, onclick, cls = "btn small", attrs = {}) => h("button", { type: "button", class: cls, onclick, ...attrs }, label);

/** Problem generator wrapper. Never throws: a family with no generator yet (or a ctx it rejects) simply gives null. */
function makeGen(skill, o) {
  const has = !!FAMILIES[skill.familyId];
  const ctxs = [...new Set([o.ctx, ...(skill.contexts || []), "store"].filter(Boolean))];
  const get = (seed, level = o.level) => {
    if (!has) return null;
    for (const ctx of ctxs) {
      try {
        const p = generate(skill.familyId, skill.params || {}, { seed, level, ctx });
        if (p) {
          p._ctx = ctx;
          p._level = level;
          return p;
        }
      } catch (_e) {
        /* try the next context */
      }
    }
    return null;
  };
  /** A problem whose spec is not in `avoid` (and that passes `pred`), searching seeds upward from `seed`. */
  const distinct = (seed, avoid = [], pred = () => true, level = o.level, tries = 16) => {
    for (let i = 0; i < tries; i++) {
      const p = get(seed + i * 3 + 1, level);
      if (p && !avoid.includes(keyOf(p)) && pred(p)) return p;
    }
    return null;
  };
  return { has, get, distinct, ok: has && !!get(o.seed) };
}

/* ------------------------------------------------------------------ speech text and sentences */

/** Make a line of mathematics say sensibly in a device voice. Only used for speech; the screen text is never changed. */
export function speakable(text) {
  return String(text)
    .replace(/−/g, " minus ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/\s\+\s/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/</g, " is less than ")
    .replace(/>/g, " is greater than ")
    .replace(/(\d+)\s*\/\s*(\d+)/g, "$1 over $2")
    .replace(/%/g, " percent")
    .replace(/(^|\s)\?(?=\s|$|[.,;:])/g, "$1blank")
    .replace(/_{2,}/g, " blank ")
    .replace(/\s+/g, " ")
    .trim();
}
export const splitSentences = (text) => String(text || "").trim().split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

const STOP = new Set("a an and are as at be but by can do does find for from give has have how in is it its many much of on or say so tell than that the their then there these they this to was we what when where which who why will with write you your".split(" "));
function keywords(q, n = 4) {
  const w = String(q).replace(/[^A-Za-z0-9' -]/g, " ").split(/\s+/).filter((x) => x && !STOP.has(x.toLowerCase()) && !/^\d+$/.test(x));
  return [...new Set(w.map((s) => s.toLowerCase()))].slice(0, n);
}

/** Sentence-by-sentence player with replay and speed, and a transcript that is always one click away. */
function player(st, sentences, { label = "Listen" } = {}) {
  const tid = nid("tr");
  const sid = nid("speed");
  const voice = speechAvailable();
  let idx = 0;
  const status = h("p", { class: "eb-status" });
  const list = h("ol", { class: "eb-transcript", id: tid, "aria-label": "Transcript" }, sentences.map((s) => h("li", {}, s)));
  const toggle = h("button", { type: "button", class: "btn small", "aria-controls": tid });
  const playBtn = h("button", { type: "button", class: "btn" });
  const nov = h("p", { class: "eb-novoice", role: "status" });
  const sync = () => {
    list.hidden = voice && !st.transcript;
    toggle.setAttribute("aria-expanded", String(!list.hidden));
    toggle.textContent = !voice ? "Transcript is on" : list.hidden ? "Show transcript" : "Hide transcript";
    toggle.disabled = !voice;
    playBtn.textContent = `Play sentence ${idx + 1}`;
    status.textContent = `Sentence ${idx + 1} of ${sentences.length}`;
    [...list.children].forEach((li, k) => (k === idx ? li.setAttribute("aria-current", "true") : li.removeAttribute("aria-current")));
  };
  const noVoice = () => {
    st.transcript = true;
    nov.textContent = "This device has no voice, so the transcript is shown. Read each sentence.";
    sync();
  };
  const playIdx = (k) => {
    idx = Math.max(0, Math.min(sentences.length - 1, k));
    sync();
    if (!speak(speakable(sentences[idx]), { rate: st.rate })) noVoice();
  };
  playBtn.addEventListener("click", () => playIdx(idx));
  toggle.addEventListener("click", () => {
    st.transcript = !st.transcript;
    sync();
  });
  if (!voice) noVoice();
  sync();
  if (![0.7, 0.9, 1.15].includes(st.rate)) st.rate = st.rate < 0.8 ? 0.7 : 0.9;
  const speed = h("select", { id: sid, onchange: (e) => (st.rate = Number(e.target.value)) }, [["Slow", 0.7], ["Normal", 0.9], ["Faster", 1.15]].map(([l, v]) => h("option", { value: v, selected: v === st.rate }, l)));
  const node = h(
    "section",
    { class: "eb-player", "aria-label": label },
    h("h3", { class: "eb-h3" }, label),
    h("p", { class: "eb-voicenote" }, "Voice: your device's own computer voice, not a recording of a person."),
    h(
      "div",
      { class: "eb-controls" },
      btn("Previous sentence", () => playIdx(idx - 1)),
      playBtn,
      btn("Next sentence", () => playIdx(idx + 1)),
      btn("Play all", () => {
        idx = 0;
        sync();
        if (!speak(speakable(sentences.join(" ")), { rate: st.rate })) noVoice();
      }),
      btn("Stop", () => stopSpeech()),
      h("span", { class: "eb-speed" }, h("label", { for: sid }, "Speed "), speed),
    ),
    status,
    nov,
    toggle,
    list,
  );
  return { node, showTranscript: () => ((st.transcript = true), sync()) };
}

/* ------------------------------------------------------------------ answers: parsing, checking, entry widgets */

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
const rat = (n, d) => {
  const g = gcd(n, d);
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
};
/** "3/4", "1 1/2", "-2", "0.25", "1,000", "12 cm" -> exact rational, or null. */
export function parseNum(str) {
  const t = String(str).trim().replace(/[−–—]/g, "-").replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/\s+/g, " ");
  let m = t.match(/^(-?)(\d+) (\d+)\/(\d+)(?!\d)/);
  if (m) return +m[4] ? rat((m[1] ? -1 : 1) * (+m[2] * +m[4] + +m[3]), +m[4]) : null;
  m = t.match(/^(-?\d+)\s*\/\s*(\d+)(?!\d)/);
  if (m) return +m[2] ? rat(+m[1], +m[2]) : null;
  m = t.match(/^(-?)(\d*)\.(\d+)/) || t.match(/^(-?)(\d+)()/);
  if (!m) return null;
  const frac = m[3] || "";
  return rat((m[1] ? -1 : 1) * Number(`${m[2] || 0}${frac}`), 10 ** frac.length);
}
const sameRat = (a, b) => !!(a && b && a.n * b.d === b.n * a.d);
const grabNums = (s) => (String(s).replace(/[−–—]/g, "-").match(/-?\d*\.?\d+(?:\/\d+)?/g) || []).map(parseNum);
/** Exact check of a typed answer against a Problem (equivalent forms of the same number are accepted). */
export function checkTyped(p, str) {
  const k = p.answer.kind;
  if (k === "int" || k === "dec" || k === "frac") return sameRat(parseNum(str), parseNum(p.answer.value));
  if (k === "pair" || k === "set") {
    const cmp = (x, y) => (x && y ? x.n * y.d - y.n * x.d : 0);
    let a = grabNums(str);
    let b = grabNums(p.answer.value);
    if (k === "set") {
      a = a.filter(Boolean).sort(cmp);
      b = b.filter(Boolean).sort(cmp);
    }
    return a.length === b.length && a.length > 0 && a.every((x, i) => sameRat(x, b[i]));
  }
  const flat = (s) => String(s).toLowerCase().replace(/[−–—]/g, "-").replace(/\s+/g, "");
  return flat(str) === flat(p.answer.value);
}
const answerMode = (p) => (["int", "dec", "frac"].includes(p.answer.kind) ? "number" : ["pair", "set"].includes(p.answer.kind) ? "typed" : "choice");

/** The typed-answer widget: steppers (and a typed field) for numbers, two steppers for a fraction, a plain field for pairs and sets. */
function answerEntry(p, id) {
  const kind = p.answer.kind;
  if (kind === "frac") {
    const mk = (suffix, label, start) => {
      const f = h("input", { id: `${id}-${suffix}`, type: "text", inputmode: "numeric", class: "eb-input eb-small-input", autocomplete: "off", value: start });
      const bump = (d) => (f.value = String(Math.max(1, (parseInt(f.value, 10) || 0) + d)));
      return h("div", { class: "eb-stepper" }, h("label", { for: f.id }, label), h("div", { class: "eb-steprow" }, btn("−", () => bump(-1), "btn small", { "aria-label": `Decrease ${label}` }), f, btn("+", () => bump(1), "btn small", { "aria-label": `Increase ${label}` })));
    };
    const top = mk("n", "Top number (numerator)", "1");
    const bot = mk("d", "Bottom number (denominator)", "2");
    const val = () => `${top.querySelector("input").value.trim()}/${bot.querySelector("input").value.trim()}`;
    const preview = h("p", { class: "eb-preview", "aria-live": "polite" });
    const sync = () => (preview.textContent = `Your fraction: ${val()}`);
    top.addEventListener("input", sync);
    bot.addEventListener("input", sync);
    top.addEventListener("click", () => setTimeout(sync, 0));
    bot.addEventListener("click", () => setTimeout(sync, 0));
    sync();
    return { node: h("div", { class: "eb-entry" }, top, bot, preview), value: val, focus: () => top.querySelector("input").focus(), empty: () => false };
  }
  const input = h("input", { id, type: "text", inputmode: kind === "int" || kind === "dec" ? "decimal" : "text", class: "eb-input", autocomplete: "off", "aria-describedby": `${id}-hint` });
  const kids = [];
  if (kind === "int" || kind === "dec") {
    const bump = (d) => {
      const cur = parseNum(input.value) || { n: 0, d: 1 };
      const v = Math.round((cur.n / cur.d + d) * 1e6) / 1e6;
      input.value = String(v).replace("-", "−");
    };
    const steps = kind === "int" ? [[-10, "−10"], [-1, "−1"], [1, "+1"], [10, "+10"]] : [[-1, "−1"], [-0.1, "−0.1"], [0.1, "+0.1"], [1, "+1"]];
    kids.push(h("div", { class: "eb-steprow" }, steps.map(([d, l]) => btn(l, () => bump(d), "btn small", { "aria-label": `${d < 0 ? "Take away" : "Add"} ${String(Math.abs(d))} to my answer` }))));
  }
  const hint = kind === "pair" ? "Write it like (2, 5)." : kind === "set" ? "Write the numbers with commas between them." : "Use the buttons or type a number.";
  return {
    node: h("div", { class: "eb-entry" }, input, h("p", { class: "eb-hint", id: `${id}-hint` }, hint + (p.answer.unit ? ` Unit: ${p.answer.unit}.` : "")), ...kids),
    value: () => input.value,
    focus: () => input.focus(),
    empty: () => !input.value.trim(),
  };
}

/* ------------------------------------------------------------------ choices and items */

/** Buttons (never drag-only). A missed choice is marked with a word and a mark and stays reachable by keyboard (aria-disabled). */
function choiceList(items, { labelledBy, onPick, cls = "" }) {
  const box = h("div", { class: `eb-choices ${cls}`, role: "group", "aria-labelledby": labelledBy || null });
  const btns = items.map((it, i) => {
    const b = h("button", { type: "button", class: "btn eb-choice", "data-eb-choice": i, "aria-label": it.label || null, onclick: () => (b.getAttribute("aria-disabled") === "true" ? null : onPick(it, i, b)) }, it.node || it.text);
    box.append(b);
    return b;
  });
  const addMark = (i, text) => btns[i].append(h("span", { class: "eb-mark" }, ` ${text}`));
  return {
    node: box,
    btns,
    mark(i, kind) {
      btns[i].setAttribute("aria-disabled", "true");
      btns[i].classList.add(kind === "right" ? "eb-right" : "eb-wrong");
      addMark(i, kind === "right" ? "(Yes)" : "(Not this one)");
    },
    lock() {
      btns.forEach((b) => b.setAttribute("aria-disabled", "true"));
    },
  };
}

function visualNode(spec, cls = "") {
  try {
    const v = renderVisual(spec);
    const inner = h("div", { class: "eb-vis-svg" });
    inner.innerHTML = v.svg; // generated by visuals.js from numbers, never from user text
    return h("figure", { class: `eb-vis ${cls}` }, inner, h("figcaption", { class: "ml-sr" }, v.summary || v.alt || ""));
  } catch (_e) {
    return spec?.alt ? h("p", { class: "eb-vis-alt" }, `Picture: ${spec.alt}`) : null;
  }
}

/** A worked example on DIFFERENT numbers (another seed), shown after repeated misses. Its answer is not the current problem's. */
function workedNode(gen, p, salt, o, fmt = (s) => s) {
  const q = gen.distinct(salt, [keyOf(p)], (x) => x.answer.text !== p.answer.text);
  if (!q) return null;
  const t = problemText(q, o.band);
  const box = h("section", { class: "eb-worked", "aria-label": "Worked example with different numbers" }, h("h3", { class: "eb-h3" }, "A worked example with different numbers"));
  if (t.stem) box.append(h("p", {}, fmt(t.stem)));
  box.append(h("p", {}, h("strong", {}, fmt(t.ask))));
  if (q.visual) {
    const v = visualNode(q.visual);
    if (v) box.append(v);
  }
  box.append(h("ol", { class: "eb-work" }, q.work.map((w) => h("li", {}, fmt(w)))), h("p", {}, `So the answer to this example is ${fmt(q.answer.text)}${q.answer.unit ? ` ${q.answer.unit}` : ""}. Now go back and try yours.`));
  return box;
}

/**
 * One generated problem as an activity: prompt (unless hidden), picture, then multiple choice, or steppers / typed field when the
 * answer is a number. Hint ladder on misses; after the third, a worked parallel example. The answer is never shown after a miss.
 */
function problemItem({ p, o, gen, seed, onSolved, onNew, onMiss, missPrefix = "", cue = "", fmt = (s) => s, hidePrompt = false, hear = false, visualInDetails = false, workedSalt = 7000 }) {
  const ladder = makeLadder(p);
  const qid = nid("q");
  const wrap = h("div", { class: "eb-item", "data-eb-problem": "", "data-family": p.family, "data-seed": p.seed, "data-level": p._level ?? "", "data-ctx": p._ctx ?? "" });
  const t = problemText(p, o.band);
  const prompt = h("div", { class: "eb-prompt", id: qid });
  if (!hidePrompt) {
    if (t.stem) prompt.append(h("p", { class: "eb-stem" }, fmt(t.stem)));
    prompt.append(h("p", { class: "eb-ask" }, h("strong", {}, fmt(t.ask))));
    if (hear) prompt.append(hearButton(speakable(fmt(`${t.stem} ${t.ask}`)), "Hear the problem"));
  } else {
    prompt.append(h("p", { class: "eb-ask" }, "Build your answer to the problem you heard."));
  }
  wrap.append(prompt);
  if (p.visual) {
    const v = visualNode(p.visual);
    if (v) wrap.append(visualInDetails && o.band !== "1-2" ? h("details", { class: "eb-details" }, h("summary", {}, "Show the picture"), v) : v);
  }
  const fb = h("div", { class: "ml-fb" });
  const worked = h("div", { class: "eb-worked-slot" });
  const how = h("div", { class: "eb-how" });
  let solved = false;
  const win = () => {
    solved = true;
    how.append(h("p", { class: "eb-how-title" }, "How it works"), h("ol", { class: "eb-work" }, p.work.map((w) => h("li", {}, fmt(w)))));
    onSolved?.(p);
  };
  const miss = (tag) => {
    const hint = ladder.miss();
    const parts = [];
    if (missPrefix) parts.push(missPrefix);
    parts.push(hint ? fmt(hint) : "Look at the worked example below, then try again.");
    if (cue) parts.push(cue);
    if (tag && o.band !== "1-2") parts.push(`A common slip with this choice: ${String(tag).replace(/-/g, " ")}.`);
    feedback(fb, "try", parts.join(" "));
    onMiss?.(ladder.misses);
    if (ladder.worked() && !worked.firstChild) {
      const w = workedNode(gen, p, workedSalt, o, fmt);
      if (w) worked.append(w);
    }
  };
  let list = null;
  let entry = null;
  const mode = answerMode(p);
  if (mode === "choice") {
    const items = choicesOf(p, seed).map((c) => ({ text: fmt(c.text), correct: c.correct, tag: c.misconception }));
    list = choiceList(items, {
      labelledBy: qid,
      onPick(it, i) {
        if (solved) return;
        if (it.correct) {
          list.mark(i, "right");
          list.lock();
          feedback(fb, "ok", "That matches the problem.");
          win();
        } else {
          list.mark(i, "wrong");
          miss(it.tag);
        }
      },
    });
    wrap.append(list.node);
  } else {
    const eid = nid("ans");
    entry = answerEntry(p, eid);
    const check = () => {
      if (solved) return;
      if (entry.empty()) return feedback(fb, "info", "Build or type an answer first.");
      if (checkTyped(p, entry.value())) {
        feedback(fb, "ok", "That matches the problem.");
        win();
        checkBtn.setAttribute("aria-disabled", "true");
      } else miss();
    };
    const checkBtn = h("button", { type: "button", class: "btn eb-primary", onclick: check }, "Check my answer");
    wrap.append(h("div", { class: "eb-answer" }, h("label", { class: "eb-label", for: mode === "number" && p.answer.kind === "frac" ? `${eid}-n` : eid }, "Your answer"), entry.node, checkBtn));
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches?.("input")) {
        e.preventDefault();
        check();
      }
    });
  }
  wrap.append(fb, worked, how);
  if (onNew) wrap.append(h("div", { class: "eb-actions" }, btn("Try a new problem", onNew)));
  return wrap;
}

/** A multiple-choice question whose options are authored text (listening tasks, reasons, predictions). */
function authoredMC({ q, options, answer, why, cue, seedKey, onSolved, onTwoMisses, skippable = false, hear = false }) {
  const wrap = h("div", { class: "eb-item" });
  const qid = nid("q");
  wrap.append(h("p", { class: "eb-q", id: qid }, q));
  if (hear) wrap.append(hearButton(speakable(q), "Hear the question"));
  const items = makeRng(seedKey).shuffle(options.map((text, i) => ({ text, correct: i === answer })));
  const fb = h("div", { class: "ml-fb" });
  const extra = h("div", { class: "eb-actions" });
  let misses = 0;
  let solved = false;
  const list = choiceList(items, {
    labelledBy: qid,
    onPick(it, i) {
      if (solved) return;
      if (it.correct) {
        solved = true;
        list.mark(i, "right");
        list.lock();
        feedback(fb, "ok", why || "That fits.");
        clear(extra);
        onSolved?.("solved");
      } else {
        misses += 1;
        list.mark(i, "wrong");
        if (misses === 2) onTwoMisses?.();
        const msg = misses === 1 ? cue : misses === 2 ? `${cue} The transcript can help: read along while you listen.` : "Listen to the whole passage once more, then read the question and the choices again.";
        feedback(fb, "try", msg);
        if (misses >= 3 && skippable && !extra.firstChild)
          extra.append(
            btn("Skip this question for now", () => {
              solved = true;
              list.lock();
              clear(extra);
              feedback(fb, "info", "Skipped. You can start over to try it again.");
              onSolved?.("skipped");
            }),
          );
      }
    },
  });
  wrap.append(list.node, fb, extra);
  return wrap;
}

/** Shows a "Next" step button that moves on; used at the end of a station or step. */
const nextRow = (label, fn) => h("div", { class: "eb-actions eb-next" }, btn(label, fn, "btn eb-primary"));

const ROOT_NOTE = { conceptual: "Conceptual: the idea itself is not yet clear. Return to a model or picture before more practice.", procedural: "Procedural: the idea is there, but a step or a calculation goes wrong. Practice the sequence with a check at each step.", reading: "Reading: words or symbols were misread. Reread together and mark each quantity and what it counts.", language: "Language: a word or phrase was understood differently. Act it out or draw it, and invite the home language." };

/* ------------------------------------------------------------------ print (comic, modeling work) */

/** Puts a clean copy of the content in a print-only root (hidden on screen; the print stylesheet shows it and hides the page). */
function printSheet(title, nodes) {
  document.querySelector(".eb-print-root")?.remove();
  const root = h("div", { class: "eb-print-root", style: "display:none", "aria-hidden": "true" }, h("h1", {}, title), ...nodes);
  document.body.append(root);
  document.body.classList.add("eb-printing");
  const done = () => {
    document.body.classList.remove("eb-printing");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  try {
    window.print();
  } catch (_e) {
    done();
  }
  return root;
}
const dropPrintRoot = () => {
  document.querySelector(".eb-print-root")?.remove();
  document.body?.classList.remove("eb-printing");
};

/* ------------------------------------------------------------------ avatars (abstract, never realistic people) */

function avatarSvg(name, idx, size = 56) {
  const ini = escXml(String(name || "?").trim().slice(0, 2).replace(/^./, (c) => c.toUpperCase()));
  const fill = [PAL.navy, PAL.tealD, "#8A5A00", "#A8412A"][idx % 4];
  const shape = idx % 2 === 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${fill}"/>` : `<rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="12" fill="${fill}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">${shape}<text x="${size / 2}" y="${size / 2 + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="#FFFFFF" font-family="Atkinson Hyperlegible, Arial, sans-serif">${ini}</text></svg>`;
}
function avatarNode(name, idx, size = 56) {
  const s = h("span", { class: "eb-avatar", "aria-hidden": "true" });
  s.innerHTML = avatarSvg(name, idx, size); // our own SVG; the name is XML-escaped above
  return s;
}

const casesOf = (sk) => (sk.misconceptions || []).filter((m) => m.errorCase && Array.isArray(m.errorCase.steps) && m.errorCase.steps.length >= 2 && Number.isInteger(m.errorCase.firstWrong) && m.errorCase.firstWrong < m.errorCase.steps.length);

/* ================================================================== 1. LISTENING LAB */

function listeningLab(el, opts) {
  const o = norm(opts);
  const sk = o.skill;
  const root = boot(el, "eb-listen", o);
  const gen = makeGen(sk, o);
  const L = sk.listening || {};
  const errs = casesOf(sk);
  const asn = (sk.discourse?.asn || []).filter((a) => a.claim && a.why && a.verdict);
  const st = { i: 0, done: {}, transcript: o.band === "1-2" || !speechAvailable(), rate: o.band === "1-2" ? 0.7 : 0.9, n: { build: 0, match: 0, error: 0, argue: 0 } };
  const S = (salt) => seedFor(o, salt) + o.round * 101;
  const young = gradeBand(sk) === 0;
  const stations = [
    { id: "identify", title: young ? "Listen and pick" : "Listen and identify", ok: !!(L.script && L.tasks?.length) },
    { id: "build", title: "Listen and build", ok: gen.ok },
    { id: "match", title: "Listen and match", ok: gen.ok },
    { id: "error", title: young ? "Listen for the mistake" : "Listen and find the error", ok: errs.length > 0 },
    { id: "argue", title: young ? "Do you agree?" : "Respond to an argument", ok: asn.length > 0 },
  ].filter((s) => s.ok);
  const nav = h("nav", { class: "eb-nav", "aria-label": "Listening tasks" });
  const body = h("div", { class: "eb-body" });
  const finish = (sec, id) => {
    st.done[id] = true;
    drawNav();
    const last = st.i >= stations.length - 1;
    sec.append(last ? h("p", { class: "eb-finish" }, "You finished every listening task. Use Start over to try new ones.") : nextRow("Next task", () => go(st.i + 1)));
    say(root, last ? "All listening tasks finished." : "Task finished.");
  };
  const cueFor = (type, q) => {
    const base = { identify: "Listen again for the numbers and what each number counts.", match: "Listen again for the words that tell which picture or expression goes with the story.", error: "Listen again for the step where the relationship between the numbers changes.", build: "Listen again and note each quantity in the story." }[type] || "Listen again, one sentence at a time.";
    const kw = keywords(q);
    return kw.length ? `${base} Listen for: ${kw.join(", ")}.` : base;
  };

  const sIdentify = (sec) => {
    const sentences = splitSentences(L.script);
    const pl = player(st, sentences, { label: "Listen to the passage" });
    sec.append(h("p", { class: "eb-directions" }, "Listen to the passage as many times as you like. Then answer the questions."), pl.node);
    let left = L.tasks.length;
    L.tasks.forEach((t, k) => {
      sec.append(
        authoredMC({
          q: t.q,
          options: t.options,
          answer: t.answer,
          why: t.why,
          cue: cueFor(t.type, t.q),
          seedKey: `lis:${sk.id}:${o.seed}:${o.round}:${k}`,
          onTwoMisses: pl.showTranscript,
          skippable: true,
          hear: o.band === "1-2",
          onSolved: () => {
            left -= 1;
            if (!left) finish(sec, "identify");
          },
        }),
      );
    });
  };

  const sBuild = (sec) => {
    const p = gen.get(S(11 + st.n.build * 5));
    if (!p) return sec.append(note("A practice problem could not be made for this skill. Try another task."));
    const t = problemText(p, o.band);
    const pl = player(st, splitSentences(`${t.stem} ${t.ask}`), { label: "Listen to the problem" });
    sec.append(
      h("p", { class: "eb-directions" }, "Listen to the problem. Then build your answer with the buttons, or type it."),
      pl.node,
      problemItem({
        p, o, gen, seed: S(12 + st.n.build), hidePrompt: true, visualInDetails: true, cue: "Play the problem again and listen for each number.", workedSalt: S(900),
        onMiss: (n) => n >= 2 && pl.showTranscript(),
        onSolved: () => finish(sec, "build"),
        onNew: () => ((st.n.build += 1), draw(true)),
      }),
    );
  };

  const buildMatch = (n) => {
    const base = S(21 + n * 9);
    const p = gen.get(base);
    if (!p || !p.work?.length) return null;
    const kind = p.expr ? "expr" : p.visual ? "visual" : "text";
    const rep = (q) => (kind === "expr" ? q.expr : kind === "visual" ? JSON.stringify(q.visual) : `${q.stem.standard}|${q.ask.standard}`);
    if (!rep(p)) return null;
    const seen = new Set([rep(p)]);
    const foils = [];
    for (let k = 1; k < 24 && foils.length < 2; k++) {
      const q = gen.get(base + k * 3 + 1);
      if (!q || !rep(q) || seen.has(rep(q))) continue;
      seen.add(rep(q));
      foils.push(q);
    }
    return foils.length ? { p, foils, kind } : null;
  };
  const optionFor = (q, kind) => {
    if (kind === "expr") return { text: q.expr };
    if (kind === "visual") {
      const v = visualNode(q.visual, "eb-vis-opt");
      const sum = v?.querySelector("figcaption")?.textContent || q.visual.alt || "a picture";
      return { node: v || q.visual.alt, label: `Picture: ${sum}` };
    }
    const t = problemText(q, o.band);
    return { text: `${t.stem} ${t.ask}`.trim() };
  };
  const sMatch = (sec) => {
    let m = null;
    for (let k = 0; k < 6 && !m; k++) m = buildMatch(st.n.match + k);
    if (!m) return sec.append(note("A matching task could not be made for this skill. Try another task."));
    const { p, foils, kind } = m;
    const sentences = ["Someone solved a problem. Listen to how they did it.", ...p.work.map((w, i) => `Step ${i + 1}. ${w}`), "Which problem did they solve?"];
    const pl = player(st, sentences, { label: "Listen to the strategy" });
    const items = makeRng(`match:${sk.id}:${o.seed}:${o.round}:${st.n.match}`).shuffle([{ ...optionFor(p, kind), correct: true }, ...foils.map((f) => ({ ...optionFor(f, kind), correct: false }))]);
    const qid = nid("q");
    let misses = 0;
    let solved = false;
    const fb = h("div", { class: "ml-fb" });
    const list = choiceList(items, {
      labelledBy: qid,
      cls: kind === "visual" ? "eb-choices-vis" : "",
      onPick(it, i) {
        if (solved) return;
        if (it.correct) {
          solved = true;
          list.mark(i, "right");
          list.lock();
          feedback(fb, "ok", "That is the problem the strategy solved. The steps used its numbers.");
          finish(sec, "match");
        } else {
          misses += 1;
          list.mark(i, "wrong");
          if (misses >= 2) pl.showTranscript();
          feedback(fb, "try", `Listen again for the numbers each step uses, then check them against this choice.${misses >= 2 ? " The transcript is on so you can read along." : ""}`);
        }
      },
    });
    sec.append(
      h("p", { class: "eb-directions" }, "Listen to a strategy. Then choose the problem it matches."),
      pl.node,
      h("div", { class: "eb-item", "data-eb-problem": "", "data-family": p.family, "data-seed": p.seed, "data-level": p._level ?? "", "data-ctx": p._ctx ?? "" }, h("p", { class: "eb-q", id: qid }, kind === "visual" ? "Which picture shows the problem?" : kind === "expr" ? "Which expression shows the problem?" : "Which problem was solved?"), list.node, fb),
      h("div", { class: "eb-actions" }, btn("Try a new matching task", () => ((st.n.match += 1), draw(true)))),
    );
  };

  const rootCue = (m) => ({ conceptual: "Listen again for the step where the idea about what the numbers mean changes.", procedural: "Listen again for a calculation that does not match what its step says.", reading: "Listen again for where the words are read in a different way from what they say.", language: "Listen again for a word or phrase that is understood in a different way." }[m.root] || "Listen to each step on its own.");
  const sError = (sec) => {
    const m = errs[(st.n.error + o.round) % errs.length];
    const ec = m.errorCase;
    const sentences = [ec.story, ...ec.steps.map((s, i) => `Step ${i + 1}. ${s}`), "Which step is the first one that is not correct?"];
    const pl = player(st, sentences, { label: "Listen to the student's work" });
    const qid = nid("q");
    const fb = h("div", { class: "ml-fb" });
    let solved = false;
    let misses = 0;
    const list = choiceList(ec.steps.map((_s, i) => ({ text: `Step ${i + 1}`, correct: i === ec.firstWrong })), {
      labelledBy: qid,
      onPick(it, i) {
        if (solved) return;
        if (it.correct) {
          solved = true;
          list.mark(i, "right");
          list.lock();
          feedback(fb, "ok", ec.explain);
          finish(sec, "error");
        } else {
          misses += 1;
          list.mark(i, "wrong");
          if (misses >= 2) pl.showTranscript();
          feedback(fb, "try", `${rootCue(m)} Listen to each step on its own.`);
        }
      },
    });
    sec.append(
      h("p", { class: "eb-directions" }, "A student's work is read aloud. Find the first step that is not correct."),
      pl.node,
      h("div", { class: "eb-item" }, h("p", { class: "eb-q", id: qid }, "Which step is the first one that is not correct?"), list.node, fb),
      h("div", { class: "eb-actions" }, btn("Try another student's work", () => ((st.n.error += 1), draw(true)))),
    );
  };

  const sArgue = (sec) => {
    const a = asn[(st.n.argue + o.round) % asn.length];
    const pl = player(st, ["A student makes a claim.", a.claim], { label: "Listen to the claim" });
    const others = [...asn.filter((x) => x !== a).map((x) => x.why), ...(sk.misconceptions || []).map((m) => m.why), sk.discourse?.wdntb?.why].filter((w) => w && w !== a.why);
    const foils = makeRng(`argue:${sk.id}:${o.seed}:${st.n.argue}`).shuffle([...new Set(others)]).slice(0, 2);
    const key = (a.claim.match(/\b(always|never|sometimes|every|all|any|only|each|both|same|equal|must|can)\b/gi) || []).slice(0, 2);
    const stepTwo = h("div", { class: "eb-step-two" });
    const verdictOpts = [["I agree: it is always true.", "always"], ["I disagree: it is never true.", "never"], ["It depends: it is sometimes true.", "sometimes"]];
    const q1 = nid("q");
    const fb1 = h("div", { class: "ml-fb" });
    let v1 = false;
    const l1 = choiceList(verdictOpts.map(([text, v]) => ({ text, correct: v === a.verdict })), {
      labelledBy: q1,
      onPick(it, i) {
        if (v1) return;
        if (it.correct) {
          v1 = true;
          l1.mark(i, "right");
          l1.lock();
          feedback(fb1, "ok", "Good listening. Now choose the reason that fits.");
          reasonStep();
        } else {
          l1.mark(i, "wrong");
          feedback(fb1, "try", `Listen to the claim again.${key.length ? ` Listen for the key word: ${[...new Set(key.map((k) => k.toLowerCase()))].join(", ")}.` : ""} Ask: is it true in every case, in no case, or only in some?`);
        }
      },
    });
    const reasonStep = () => {
      stepTwo.append(
        authoredMC({
          q: "Which reason fits the claim?",
          options: [a.why, ...foils],
          answer: 0,
          why: a.why,
          cue: "Listen for the reason that is about THIS claim and tells why it holds (or fails) every time.",
          seedKey: `reason:${sk.id}:${o.seed}:${st.n.argue}`,
          hear: o.band === "1-2",
          onSolved: () => finish(sec, "argue"),
        }),
      );
    };
    sec.append(
      h("p", { class: "eb-directions" }, "A claim is read aloud. Say whether you agree, and then pick a reason."),
      pl.node,
      h("div", { class: "eb-item" }, h("p", { class: "eb-q", id: q1 }, "Do you agree with the claim?"), l1.node, fb1),
      stepTwo,
      h("div", { class: "eb-actions" }, btn("Try another claim", () => ((st.n.argue += 1), draw(true)))),
    );
  };

  const fns = { identify: sIdentify, build: sBuild, match: sMatch, error: sError, argue: sArgue };
  function drawNav() {
    clear(nav);
    stations.forEach((s, i) => nav.append(h("button", { type: "button", class: "btn small eb-tab", "aria-current": i === st.i ? "step" : null, onclick: () => go(i) }, `${i + 1}. ${s.title}${st.done[s.id] ? " (done)" : ""}`)));
  }
  function go(i) {
    st.i = i;
    draw(true);
  }
  function draw(focus) {
    stopSpeech();
    drawNav();
    clear(body);
    const s = stations[st.i];
    if (!s) return body.append(note("This skill has no listening content yet."));
    const hd = head(s.title, nid("h"));
    const sec = h("section", { class: "eb-station", "aria-labelledby": hd.id, "data-eb-station": s.id }, hd);
    body.append(sec);
    fns[s.id](sec);
    if (focus) {
      hd.focus();
      say(root, `${s.title}. Task ${st.i + 1} of ${stations.length}.`);
    }
  }
  const restart = () => {
    o.round += 1;
    Object.assign(st, { i: 0, done: {}, n: { build: 0, match: 0, error: 0, argue: 0 } });
    draw(true);
  };
  root.append(h("div", { class: "eb-top" }, h("p", { class: "eb-context" }, `Listening practice: ${sk.title}`), btn("Start over", restart)), nav, body, h("p", { class: "eb-fine" }, "The transcript is always available. Hear buttons use your device's computer voice. Nothing you do here is timed, saved or sent."));
  draw(false);
  return { destroy() { stopSpeech(); clear(el); } };
}

/* ================================================================== 2. ERROR DETECTIVE */

function errorDetective(el, opts) {
  const o = norm(opts);
  const sk = o.skill;
  const root = boot(el, "eb-detect", o);
  const gen = makeGen(sk, o);
  const cases = casesOf(sk);
  const g = gradeBand(sk);
  const STEP_TITLES = [
    ["Find the mistake", "What was the child thinking?", "Say what happened", "Fix it", "Try a new one"],
    ["Find the first mistake", "Name the thinking", "Explain the error", "Correct the solution", "Try a new problem"],
    ["Inspect the work", "Identify the misconception", "Explain the error", "Correct the solution", "Apply the corrected reasoning"],
  ][g];
  const st = { ci: 0, step: 0, solved: 0, text: { explain: "", fix: "" }, n: 0, picked: -1, tries: 0 };
  const S = (salt) => seedFor(o, salt) + o.round * 101;
  const nav = h("ol", { class: "eb-steps", "aria-label": "Detective steps" });
  const body = h("div", { class: "eb-body" });
  const hasApply = gen.ok;
  const stepCount = hasApply ? 5 : 4;

  const teacherNote = (m) =>
    h(
      "details",
      { class: "eb-teacher" },
      h("summary", {}, "For the teacher"),
      h("p", {}, h("strong", {}, "This error type: "), `${m.root || "not recorded"}.`),
      h("ul", { class: "eb-rootlist" }, Object.entries(ROOT_NOTE).map(([k, v]) => h("li", { class: k === m.root ? "eb-cur" : "" }, k === m.root ? h("strong", {}, v) : v))),
      m.why ? h("p", {}, h("strong", {}, "Why students think this: "), m.why) : null,
      m.fix ? h("p", {}, h("strong", {}, "How to help: "), m.fix) : null,
      h("p", { class: "eb-fine" }, "Students try first. These notes tell you which kind of support to give: a model (conceptual), step practice (procedural), reading together (reading) or acting out words (language)."),
    );

  const drawNav = () => {
    clear(nav);
    STEP_TITLES.slice(0, stepCount).forEach((t, i) => nav.append(h("li", { class: i === st.step ? "eb-cur" : i < st.step ? "eb-done" : "", "aria-current": i === st.step ? "step" : null }, `${t}${i < st.step ? " (done)" : ""}`)));
  };

  const textStep = (sec, m, kind) => {
    const fid = nid("f");
    const frames = framesFor(sk, o.band, o.band === "5-6" ? 1 : 3);
    const bank = wordBank(sk, o.band);
    const ta = h("textarea", { id: fid, rows: 4, class: "eb-ta", oninput: () => (st.text[kind] = ta.value) });
    ta.value = st.text[kind];
    const fb = h("div", { class: "ml-fb" });
    const extra = h("div", { class: "eb-extra" });
    if (frames.length) sec.append(h("div", { class: "eb-frames" }, h("p", { class: "eb-hint" }, "Sentence starters (tap one to use it):"), h("div", { class: "eb-chips" }, frames.map((f) => btn(f, () => { ta.value = ta.value ? `${ta.value} ${f}` : f; st.text[kind] = ta.value; ta.focus(); })))));
    if (bank.length && o.band !== "5-6") sec.append(h("p", { class: "eb-bank" }, h("strong", {}, "Word bank: "), bank.join(", ")));
    const attempt = () => {
      const txt = ta.value.trim();
      if (!txt) return feedback(fb, "info", "Write a few words first. Say it out loud to a partner if that helps.");
      clear(extra);
      if (kind === "explain") {
        const r = checkSentence(txt, { kind: "because", targets: termsOfSkill(sk), minWords: o.band === "1-2" ? 4 : 6 });
        feedback(fb, "info", r.ok ? "Your sentence has a good shape. A partner or your teacher checks the mathematics." : `A shape check (not a grade): ${r.notes.join(" ")}`);
      } else {
        feedback(fb, "info", "Thank you. Compare your fix with this explanation.");
        extra.append(h("blockquote", { class: "eb-explain" }, h("strong", {}, "One correct explanation: "), m.errorCase.explain));
      }
      say(root, "Saved for this session only.");
      if (!sec.querySelector(".eb-next")) sec.append(nextRow(kind === "explain" ? "Next: correct the solution" : hasApply ? "Next: try a new problem" : "Finish this case", () => advance()));
    };
    sec.append(h("div", { class: "eb-field" }, h("label", { for: fid, class: "eb-label" }, kind === "explain" ? "Explain the mistake in your own words" : "Write the corrected step or steps"), ta), h("div", { class: "eb-actions" }, btn(kind === "explain" ? "Check my sentence" : "Compare with an explanation", attempt, "btn eb-primary")), fb, extra, h("p", { class: "eb-fine" }, "Your writing stays on this page for this session only. It is not graded by the computer."));
  };

  const advance = () => {
    st.step += 1;
    if (st.step >= stepCount) return caseDone();
    draw(true);
  };
  const caseDone = () => {
    st.solved += 1;
    clear(nav);
    clear(body);
    const last = st.ci >= cases.length - 1;
    const hd = head(last ? "Case closed. All cases solved." : "Case closed", nid("h"));
    body.append(h("section", { class: "eb-station" }, hd, h("p", {}, last ? `You solved ${st.solved} of ${cases.length} cases.` : "Well done. Ready for another case?"), last ? btn("Start over", restart, "btn eb-primary") : btn("Next case", () => ((st.ci += 1), (st.step = 0), (st.text = { explain: "", fix: "" }), (st.tries = 0), draw(true)), "btn eb-primary")));
    hd.focus();
    say(root, last ? "All cases solved." : "Case closed.");
  };

  function draw(focus) {
    drawNav();
    clear(body);
    const m = cases[st.ci];
    const ec = m.errorCase;
    const hd = head(`Case ${st.ci + 1} of ${cases.length}: ${STEP_TITLES[st.step]}`, nid("h"));
    const sec = h("section", { class: "eb-station", "aria-labelledby": hd.id, "data-eb-step": st.step }, hd);
    body.append(sec);
    if (st.step === 0) {
      const qid = nid("q");
      sec.append(h("p", { class: "eb-story" }, ec.story), h("p", { class: "eb-directions", id: qid }, g === 0 ? "A student wrote these steps. Tap the first step that is not right." : "Read the student's work. Choose the first step that is not correct."));
      if (o.band === "1-2" || g === 0) sec.append(hearButton(speakable(`${ec.story} ${ec.steps.map((s, i) => `Step ${i + 1}. ${s}`).join(" ")}`), "Hear the work"));
      const fb = h("div", { class: "ml-fb" });
      let solved = false;
      const list = choiceList(ec.steps.map((s, i) => ({ text: `Step ${i + 1}: ${s}`, correct: i === ec.firstWrong })), {
        labelledBy: qid,
        cls: "eb-stepchoices",
        onPick(it, i) {
          if (solved) return;
          if (it.correct) {
            solved = true;
            list.mark(i, "right");
            list.lock();
            feedback(fb, "ok", `Step ${i + 1} is the first step that is not correct.`);
            sec.append(nextRow("Next: name the thinking", advance));
          } else {
            st.tries += 1;
            list.mark(i, "wrong");
            const msgs = ["Check each step in order from the start: does it make sense for the situation?", "Check each step against the step before it. Ask what the numbers stand for.", "Try the work yourself on scratch paper. Compare each of your lines with the student's lines."];
            feedback(fb, "try", msgs[Math.min(st.tries - 1, 2)]);
          }
        },
      });
      sec.append(list.node, fb, teacherNote(m));
    } else if (st.step === 1) {
      const others = sk.misconceptions.filter((x) => x.id !== m.id && x.belief).map((x) => x.belief);
      const pad = [];
      if (others.length < 2) {
        const p0 = gen.get(S(50));
        for (const d of p0?.distractors || []) pad.push(`The student ${String(d.misconception).replace(/-/g, " ")}.`);
      }
      const opts4 = makeRng(`belief:${sk.id}:${m.id}:${o.seed}`).shuffle([...others, ...pad]).slice(0, 3);
      sec.append(authoredMC({ q: g === 0 ? "What was the student thinking?" : "Which idea did the student believe?", options: [m.belief, ...opts4], answer: 0, why: `Yes. The student believed: ${m.belief}`, cue: `Look at what the student did in step ${ec.firstWrong + 1}. What rule were they using?`, seedKey: `bel:${sk.id}:${m.id}:${o.seed}:${o.round}`, hear: o.band === "1-2", onSolved: () => sec.append(nextRow("Next: explain the error", advance)) }), teacherNote(m));
    } else if (st.step === 2) {
      sec.append(h("p", { class: "eb-directions" }, g === 0 ? "Say what happened. Use the word because." : "Explain why step " + (ec.firstWrong + 1) + " is not correct. Use the word because."), h("p", { class: "eb-story" }, `Step ${ec.firstWrong + 1}: ${ec.steps[ec.firstWrong]}`));
      textStep(sec, m, "explain");
    } else if (st.step === 3) {
      sec.append(h("p", { class: "eb-directions" }, "Now fix it. Write what the student should do instead."), h("p", { class: "eb-story" }, `Step ${ec.firstWrong + 1}: ${ec.steps[ec.firstWrong]}`));
      textStep(sec, m, "fix");
    } else {
      const p = gen.get(S(60 + st.ci * 7 + st.n));
      sec.append(h("p", { class: "eb-directions" }, g === 0 ? "Try a new one. Use what you learned." : "Apply the corrected reasoning to a new problem."));
      if (!p) sec.append(note("A new problem could not be made for this skill."), nextRow("Finish this case", () => advance()));
      else sec.append(problemItem({ p, o, gen, seed: S(61 + st.ci * 7 + st.n), hear: o.band === "1-2", workedSalt: S(950), cue: "Remember the corrected step from this case.", onSolved: () => sec.append(nextRow("Finish this case", () => advance())), onNew: () => ((st.n += 1), draw(true)) }));
    }
    if (focus) {
      hd.focus();
      say(root, `${STEP_TITLES[st.step]}. Step ${st.step + 1} of ${stepCount}.`);
    }
  }
  function restart() {
    o.round += 1;
    Object.assign(st, { ci: 0, step: 0, solved: 0, text: { explain: "", fix: "" }, n: 0, tries: 0 });
    draw(true);
  }
  root.append(h("div", { class: "eb-top" }, h("p", { class: "eb-context" }, `Error detective: ${sk.title}`), btn("Start over", restart)), nav, body, h("p", { class: "eb-fine" }, "These students are made up. A mistake is a clue, not a failure. Nothing is timed, saved or sent."));
  if (!cases.length) body.append(note("This skill has no student-work cases yet."));
  else draw(false);
  return { destroy() { stopSpeech(); clear(el); } };
}

/* ================================================================== 3. STORY STUDIO */

function nameMapper(p, character) {
  if (!character) return (s) => s;
  const hay = [p.stem.plain, p.stem.standard, p.stem.rich, p.ask.plain, p.ask.standard, p.ask.rich, p.answer.text, ...p.distractors.map((d) => d.text), ...p.work].join(" ");
  const present = NAMES.filter((n) => new RegExp(`\\b${n}\\b`).test(hay));
  if (!present.length || present.includes(character)) return (s) => s;
  const first = present.sort((a, b) => hay.search(new RegExp(`\\b${a}\\b`)) - hay.search(new RegExp(`\\b${b}\\b`)))[0];
  const re = new RegExp(`\\b${first}\\b`, "g");
  return (s) => String(s).replace(re, character);
}

function sceneNode(sk, bi, total) {
  const g = gradeBand(sk);
  const story = sk.story || {};
  const x = Math.round(40 + (bi / Math.max(1, total)) * 360);
  const hill = `M0 120 Q80 ${90 - (bi % 2) * 10} 160 118 T320 112 T480 118 V150 H0 Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="480" height="150" fill="#CFEDEB"/><circle cx="${x}" cy="34" r="16" fill="${PAL.amber}"/><path d="${hill}" fill="#7CC9C5"/><rect x="0" y="126" width="480" height="24" fill="#FBEBC0"/><g fill="${PAL.navy}"><rect x="330" y="72" width="64" height="54"/><polygon points="322,72 362,46 402,72"/></g><rect x="352" y="100" width="18" height="26" fill="${PAL.paper}"/><g><rect x="250" y="98" width="8" height="28" fill="#8A5A00"/><circle cx="254" cy="90" r="18" fill="${PAL.tealD}"/></g></svg>`;
  const scene = h("div", { class: `eb-scene eb-scene-${g}`, role: "img", "aria-label": `Scene: ${story.setting || "the story setting"}. ${story.character || "The character"} is here.` });
  const art = h("div", { class: "eb-scene-art" });
  art.innerHTML = svg; // drawn here from fixed shapes; no data in it
  scene.append(art, h("div", { class: "eb-scene-cast", "aria-hidden": "true" }, avatarNode(story.character || "?", 0, g === 0 ? 64 : 48), h("span", { class: "eb-scene-label" }, `${story.character || ""}${story.setting ? ` · ${story.setting}` : ""}`)));
  return scene;
}

function storyStudio(el, opts) {
  const o = norm(opts);
  const sk = o.skill;
  const root = boot(el, "eb-story", o);
  const gen = makeGen(sk, o);
  const story = sk.story;
  const g = gradeBand(sk);
  const young = g === 0;
  const st = { phase: "intro", bi: 0, n: 0, solved: 0, misses: 0 };
  const S = (salt) => seedFor(o, salt) + o.round * 101;
  const body = h("div", { class: "eb-body" });
  const short = (t) => (young ? splitSentences(t).slice(0, 2).join(" ") : t);
  const hearRow = (t) => (young || o.band === "1-2" ? hearButton(speakable(t), "Hear it") : null);
  const progress = () => {
    const n = story.beats.length;
    return h("ol", { class: "eb-progress", "aria-label": "Story progress" }, story.beats.map((_b, i) => h("li", { class: i < st.bi || st.phase === "end" ? "eb-done" : i === st.bi && st.phase === "beat" ? "eb-cur" : "", "aria-current": i === st.bi && st.phase === "beat" ? "step" : null }, `Part ${i + 1} of ${n}${i < st.bi || st.phase === "end" ? " (done)" : ""}`)));
  };

  function draw(focus) {
    clear(body);
    const hd = head(st.phase === "intro" ? story.title : st.phase === "end" ? "The end" : `${story.title}: part ${st.bi + 1}`, nid("h"));
    const sec = h("section", { class: "eb-station", "aria-labelledby": hd.id, "data-eb-phase": st.phase }, hd);
    body.append(sceneNode(sk, st.phase === "end" ? story.beats.length : st.bi, story.beats.length), progress(), sec);
    if (st.phase === "intro") {
      sec.append(h("p", { class: "eb-prose" }, short(story.intro)), hearRow(short(story.intro)), h("p", { class: "eb-goal" }, h("strong", {}, "Goal: "), `${story.character} wants to ${story.goal}.`), nextRow("Begin the story", () => ((st.phase = "beat"), (st.bi = 0), (st.n = 0), draw(true))));
    } else if (st.phase === "beat") {
      const beat = story.beats[st.bi];
      sec.append(h("p", { class: "eb-prose" }, beat.lead), hearRow(beat.lead));
      const p = gen.has ? gen.distinct(S(70 + st.bi * 17 + st.n * 5), [], () => true) : null;
      if (!p) {
        sec.append(note("The practice puzzle for this skill is not loaded yet, so read this part of the story."), h("p", { class: "eb-prose eb-success" }, beat.success), nextRow(st.bi < story.beats.length - 1 ? "Continue the story" : "Finish the story", next));
      } else {
        const fmt = nameMapper(p, story.character);
        sec.append(h("p", { class: "eb-puzzle-lead" }, h("strong", {}, `${story.character} finds a puzzle:`)));
        const item = problemItem({ p, o, gen, seed: S(71 + st.bi * 17 + st.n * 5), fmt, hear: young || o.band === "1-2", workedSalt: S(970 + st.bi),
          missPrefix: beat.redirect,
          onSolved: () => {
            st.solved += 1;
            const s = h("p", { class: "eb-prose eb-success" }, beat.success);
            sec.append(s, hearRow(beat.success), nextRow(st.bi < story.beats.length - 1 ? "Continue the story" : "Finish the story", next));
          },
          onNew: () => ((st.n += 1), draw(true)) });
        sec.append(item);
      }
    } else {
      sec.append(h("p", { class: "eb-prose" }, short(story.ending)), hearRow(short(story.ending)), h("p", {}, `You solved ${st.solved} puzzle${st.solved === 1 ? "" : "s"} along the way.`), btn("Play the story again", restart, "btn eb-primary"));
    }
    if (focus) {
      hd.focus();
      say(root, hd.textContent);
    }
  }
  function next() {
    st.n = 0;
    if (st.bi < story.beats.length - 1) st.bi += 1;
    else st.phase = "end";
    draw(true);
  }
  function restart() {
    o.round += 1;
    Object.assign(st, { phase: "intro", bi: 0, n: 0, solved: 0 });
    draw(true);
  }
  root.append(h("div", { class: "eb-top" }, h("p", { class: "eb-context" }, `Story: ${sk.title}`), btn("Start over", restart)), body, h("p", { class: "eb-fine" }, "The characters are made up. Hear buttons use your device's computer voice. Nothing you do here is timed, saved or sent."));
  if (!story || !Array.isArray(story.beats) || !story.beats.length) body.append(note("This skill has no story yet."));
  else draw(false);
  return { destroy() { stopSpeech(); clear(el); } };
}

/* ================================================================== 4. MODELING WORKSHOP */

function modelingWorkshop(el, opts) {
  const o = norm(opts);
  const sk = o.skill;
  const root = boot(el, "eb-model", o);
  const M = sk.modeling;
  const g = gradeBand(sk);
  const body = h("div", { class: "eb-body" });
  const vals = {};
  const adopted = new Set();
  const checked = new Set();
  const st = { step: 0, whatIf: { idx: 0, value: "" }, limitsShown: false };
  const frames = framesFor(sk, o.band, 3);
  const bank = wordBank(sk, o.band);
  const given = (M?.given || []).filter((x) => x && x.label != null);
  const prompts = M?.prompts || [];
  const SELF = ["I said what each number in my model counts.", "I wrote the units in my calculation and my result.", "I checked my result against the situation. Is it reasonable?", "I said which assumptions I used.", "I tested a what-if and reasoned again.", "I named at least one limit of my model."];
  const TITLES = ["Read the situation", "Choose assumptions", "Build your model", "Answer the prompts", "Test it: what if?", "Interpret", "Check the limits"];
  const fmtGiven = (x) => `${x.label}: ${x.value}${x.unit ? ` ${x.unit}` : ""}`;

  const field = (id, label, { rows = 3, hint = "" } = {}) => {
    const fid = nid("f");
    const ta = h("textarea", { id: fid, rows, class: "eb-ta", "aria-describedby": hint ? `${fid}-h` : null, oninput: () => (vals[id] = ta.value) });
    ta.value = vals[id] || "";
    return h("div", { class: "eb-field" }, h("label", { for: fid, class: "eb-label" }, label), hint ? h("p", { id: `${fid}-h`, class: "eb-hint" }, hint) : null, ta);
  };
  const supports = () =>
    h("div", { class: "eb-supports" }, o.band === "1-2" ? h("p", { class: "eb-hint" }, "Say your idea to a partner first. Then write it.") : null, frames.length && o.band !== "5-6" ? h("p", { class: "eb-hint" }, h("strong", {}, "Sentence starters: "), frames.join("  "))  : null, bank.length && o.band !== "5-6" ? h("p", { class: "eb-bank" }, h("strong", {}, "Word bank: "), bank.join(", ")) : null);

  const table = () =>
    h("table", { class: "eb-table" }, h("caption", {}, "Given data (invented for this activity, not real measurements)"), h("thead", {}, h("tr", {}, ["What it is", "Value", "Unit"].map((t) => h("th", { scope: "col" }, t)))), h("tbody", {}, given.map((x) => h("tr", {}, h("th", { scope: "row" }, x.label), h("td", {}, String(x.value)), h("td", {}, x.unit || "")))));

  const stepBody = (sec) => {
    const s = st.step;
    if (s === 0) {
      sec.append(h("p", { class: "eb-badge" }, "Invented or generic data: the situation is made up for practice."), h("p", { class: "eb-prose" }, M.scenario), o.band === "1-2" ? hearButton(speakable(M.scenario), "Hear the situation") : null, given.length ? table() : null);
    } else if (s === 1) {
      sec.append(h("p", { class: "eb-directions" }, "A model makes choices. Tick the assumptions you will use. Each one changes what your model can say."));
      const ul = h("ul", { class: "eb-assume" });
      (M.assumptions || []).forEach((a, i) => {
        const id = nid("as");
        const live = h("p", { class: "eb-hint", id: `${id}-n` });
        const sync = () => (live.textContent = adopted.has(i) ? "Adopted: your model treats this as true, so your answer is only as reliable as this assumption." : "Not adopted: say how you handle this instead, in your calculation or in your limits.");
        const cb = h("input", { type: "checkbox", id, "aria-describedby": `${id}-n`, onchange: () => (cb.checked ? adopted.add(i) : adopted.delete(i), sync()) });
        cb.checked = adopted.has(i);
        sync();
        ul.append(h("li", {}, h("label", { for: id, class: "eb-check" }, cb, ` ${a}`), live));
      });
      sec.append(ul);
    } else if (s === 2) {
      sec.append(supports(), field("model", "My model: the rule or equation, in words or symbols", { rows: 3, hint: "Name what each number counts." }), field("calc", "My calculation: show the steps with units", { rows: 4 }), field("result", "My result, with its unit", { rows: 2 }));
    } else if (s === 3) {
      sec.append(h("p", { class: "eb-directions" }, "Answer each prompt in your own words and numbers."));
      prompts.forEach((p, i) => sec.append(h("div", { class: "eb-prompt-block" }, h("p", { class: "eb-q" }, `Prompt ${i + 1}: ${p}`), field(`prompt${i}`, `My answer to prompt ${i + 1}`, { rows: 3 }))));
    } else if (s === 4) {
      const nums = given.map((x, i) => ({ x, i })).filter(({ x }) => parseNum(x.value));
      if (!nums.length) sec.append(note("This situation has no numbers to change. Describe one thing that could be different, and re-reason."), field("whatif", "What if...? Re-reason in your own words", { rows: 4 }));
      else {
        const sid = nid("sel");
        const vid = nid("val");
        const echo = h("p", { class: "eb-echo", "aria-live": "polite" });
        const sync = () => {
          const { x } = nums[st.whatIf.idx] || nums[0];
          echo.textContent = st.whatIf.value ? `Original: ${fmtGiven(x)}. Your what-if: ${x.label} is ${st.whatIf.value}${x.unit ? ` ${x.unit}` : ""}.` : `Original: ${fmtGiven(x)}. Type a new value to test.`;
        };
        const sel = h("select", { id: sid, onchange: (e) => ((st.whatIf.idx = Number(e.target.value)), sync()) }, nums.map(({ x }, k) => h("option", { value: k, selected: k === st.whatIf.idx }, x.label)));
        const inp = h("input", { id: vid, type: "text", inputmode: "decimal", class: "eb-input", autocomplete: "off", oninput: () => ((st.whatIf.value = inp.value), sync()) });
        inp.value = st.whatIf.value;
        sync();
        sec.append(h("p", { class: "eb-directions" }, "Change one given value. Then work out what happens to your result."), h("div", { class: "eb-field" }, h("label", { for: sid, class: "eb-label" }, "Change this value"), sel), h("div", { class: "eb-field" }, h("label", { for: vid, class: "eb-label" }, "New value"), inp), echo, field("whatif", "How does your model and result change? Re-reason in your own words", { rows: 4 }));
      }
    } else if (s === 5) {
      sec.append(field("interpret", "What does your result mean in the situation? Is it reasonable? Who might use it?", { rows: 5, hint: "Use the unit and the words of the situation." }));
    } else {
      const lid = nid("lim");
      const out = h("div", { class: "eb-limits" });
      const show = () => {
        if (!(vals.limits || "").trim()) return feedbackNote("Write your own limits first, then compare.");
        st.limitsShown = true;
        clear(out);
        out.append(h("p", {}, h("strong", {}, "Limits other modelers noted:")), h("ul", {}, (M.limits || []).map((l) => h("li", {}, l))), h("p", { class: "eb-fine" }, "Compare: which of these did you name? Add any you missed. These are examples, not an answer key."));
      };
      const fbBox = h("div", { class: "ml-fb" });
      const feedbackNote = (t) => feedback(fbBox, "info", t);
      sec.append(field("limits", "What are the limits of your model? When might it be wrong?", { rows: 4 }), h("div", { class: "eb-actions" }, btn("Compare with other limits", show, "btn eb-primary")), fbBox, out);
      if (st.limitsShown) show();
      const list = h("ul", { class: "eb-selfcheck" }, SELF.map((t, i) => { const id = `${lid}-${i}`; const cb = h("input", { type: "checkbox", id, onchange: () => { cb.checked ? checked.add(i) : checked.delete(i); cnt.textContent = `${checked.size} of ${SELF.length} ticked`; } }); cb.checked = checked.has(i); return h("li", {}, h("label", { for: id, class: "eb-check" }, cb, ` ${t}`)); }));
      const cnt = h("p", { class: "eb-fine", "aria-live": "polite" }, `${checked.size} of ${SELF.length} ticked`);
      sec.append(h("h3", { class: "eb-h3" }, "Self-check"), list, cnt, h("p", { class: "eb-fine" }, "This workshop does not mark open work. Show your work to a partner or your teacher: they read it with you."), h("div", { class: "eb-actions" }, btn("Print my work", print, "btn eb-primary")));
    }
  };

  const print = () => {
    const p = (t) => h("p", {}, t);
    const nodes = [p(`${sk.title}. ${M.title || ""}`), p(M.scenario), given.length ? table() : null, h("h2", {}, "Assumptions I used"), h("ul", {}, (M.assumptions || []).filter((_a, i) => adopted.has(i)).map((a) => h("li", {}, a))), h("h2", {}, "My model"), h("p", { class: "eb-pre" }, vals.model || "(not written)"), h("h2", {}, "My calculation"), h("p", { class: "eb-pre" }, vals.calc || "(not written)"), h("h2", {}, "My result"), h("p", { class: "eb-pre" }, vals.result || "(not written)")];
    prompts.forEach((q, i) => nodes.push(h("h2", {}, `Prompt ${i + 1}: ${q}`), h("p", { class: "eb-pre" }, vals[`prompt${i}`] || "(not written)")));
    nodes.push(h("h2", {}, "What if?"), h("p", { class: "eb-pre" }, `${st.whatIf.value ? `I changed a value to ${st.whatIf.value}. ` : ""}${vals.whatif || "(not written)"}`), h("h2", {}, "Interpretation"), h("p", { class: "eb-pre" }, vals.interpret || "(not written)"), h("h2", {}, "Limits of my model"), h("p", { class: "eb-pre" }, vals.limits || "(not written)"), h("h2", {}, "Self-check"), h("ul", { class: "eb-plain" }, SELF.map((t, i) => h("li", {}, `${checked.has(i) ? "[x]" : "[ ]"} ${t}`))), p("Open work: read and discuss it with a partner or teacher. The computer does not grade it."));
    printSheet(`${sk.title}: ${M.title || "Modeling workshop"}`, nodes.filter(Boolean));
  };

  function draw(focus) {
    clear(body);
    const hd = head(`Step ${st.step + 1} of ${TITLES.length}: ${TITLES[st.step]}`, nid("h"));
    const sec = h("section", { class: "eb-station", "aria-labelledby": hd.id, "data-eb-step": st.step }, hd);
    body.append(sec);
    stepBody(sec);
    sec.append(h("div", { class: "eb-actions eb-stepnav" }, st.step > 0 ? btn("Back", () => ((st.step -= 1), draw(true))) : null, st.step < TITLES.length - 1 ? btn("Next step", () => ((st.step += 1), draw(true)), "btn eb-primary") : null));
    if (focus) {
      hd.focus();
      say(root, hd.textContent);
    }
  }
  const restart = () => {
    for (const k of Object.keys(vals)) delete vals[k];
    adopted.clear();
    checked.clear();
    Object.assign(st, { step: 0, whatIf: { idx: 0, value: "" }, limitsShown: false });
    draw(true);
  };
  root.append(
    h("div", { class: "eb-top" }, h("p", { class: "eb-context" }, `Modeling: ${M?.title || sk.title}`), btn("Start over", restart)),
    h("p", { class: "eb-note" }, g === 0 ? "You are a problem solver. Use the situation to make a plan." : "This workshop is open-ended. It does not mark your answers: you check your own work, and then a partner or your teacher reads it with you."),
    body,
    h("p", { class: "eb-fine" }, "What you write stays on this page for this session. It is not saved or sent. Use Print my work to keep a copy."),
  );
  if (!M || !M.scenario) body.append(note("This skill has no modeling workshop yet."));
  else draw(false);
  return { destroy() { dropPrintRoot(); clear(el); } };
}

/* ================================================================== 5. CONCEPT COMICS */

function conceptComics(el, opts) {
  const o = norm(opts);
  const sk = o.skill;
  const root = boot(el, "eb-comic", o);
  const C = sk.comic;
  const gen = makeGen(sk, o);
  const body = h("div", { class: "eb-body" });
  const st = { shown: 1, predicted: false, misses: 0 };
  const S = (salt) => seedFor(o, salt) + o.round * 101;
  const panels = C?.panels || [];
  const cast = C?.cast?.length ? C.cast : [...new Set(panels.map((p) => p.who))];
  const castIdx = (who) => {
    const i = cast.indexOf(who);
    return i >= 0 ? i : cast.length;
  };
  const predictAt = panels.length >= 3 ? panels.length - 1 : panels.length; // the prediction comes before the last panel
  const hasPredict = !!(C?.predict && C.predict.q && Array.isArray(C.predict.options) && C.predict.options.length >= 2);

  const panelNode = (i) => {
    const pn = panels[i];
    const idx = castIdx(pn.who);
    return h("figure", { class: `eb-panel eb-side-${idx % 2}`, role: "group", "aria-label": `Panel ${i + 1} of ${panels.length}. ${pn.who} says: ${pn.says}`, tabindex: "-1", "data-eb-panel": i }, avatarNode(pn.who, idx), h("div", { class: "eb-bubble", "aria-hidden": "true" }, h("span", { class: "eb-speaker" }, pn.who), h("p", {}, pn.says)), h("span", { class: "eb-panelno", "aria-hidden": "true" }, `${i + 1}`));
  };

  function draw(focusPanel) {
    clear(body);
    const hd = head(byGrade(sk, "Read the comic", "Read the comic", "Concept comic"), nid("h"));
    const strip = h("div", { class: "eb-strip" });
    const upto = st.shown;
    for (let i = 0; i < upto; i++) strip.append(panelNode(i));
    const sec = h("section", { class: "eb-station", "aria-labelledby": hd.id }, hd, h("p", { class: "eb-hint" }, `${panels.length} panels. Each one opens when you ask for it.`), strip);
    body.append(sec);
    const atPredict = hasPredict && !st.predicted && st.shown >= predictAt;
    const finished = st.shown >= panels.length && (st.predicted || !hasPredict);
    if (atPredict) sec.append(predictCard());
    else if (!finished) sec.append(h("div", { class: "eb-actions" }, btn(`Next panel (${st.shown + 1} of ${panels.length})`, () => ((st.shown += 1), draw(true)), "btn eb-primary")));
    else sec.append(afterCard());
    if (focusPanel) {
      const last = strip.lastElementChild;
      last?.focus();
      say(root, last?.getAttribute("aria-label") || "");
    }
  }

  function predictCard() {
    const P = C.predict;
    const qid = nid("q");
    const fb = h("div", { class: "ml-fb" });
    const worked = h("div", { class: "eb-worked-slot" });
    const card = h("div", { class: "eb-predict" }, h("h3", { class: "eb-h3" }, "Make a prediction"), h("p", { class: "eb-q", id: qid }, P.q));
    if (o.band === "1-2") card.append(hearButton(speakable(P.q), "Hear the question"));
    const items = makeRng(`pred:${sk.id}:${o.seed}:${o.round}`).shuffle(P.options.map((t, i) => ({ text: t, correct: i === P.answer })));
    let done = false;
    const list = choiceList(items, {
      labelledBy: qid,
      onPick(it, i) {
        if (done) return;
        if (it.correct) {
          done = true;
          list.mark(i, "right");
          list.lock();
          st.predicted = true;
          feedback(fb, "ok", "Your prediction fits what you read. Keep reading to see why.");
          card.append(h("div", { class: "eb-actions" }, btn("Keep reading", () => ((st.shown = Math.min(panels.length, Math.max(st.shown, predictAt) + (predictAt < panels.length ? 1 : 0))), draw(true)), "btn eb-primary")));
        } else {
          st.misses += 1;
          list.mark(i, "wrong");
          feedback(fb, "try", st.misses === 1 ? "Look back at the panels you have read. What stays the same, and what changes?" : "Read the panels again, one at a time. Say what each speaker is thinking. Then choose again.");
          if (st.misses >= 3 && !worked.firstChild && gen.ok) {
            const p = gen.get(S(80));
            const w = p && workedNode(gen, p, S(81), o);
            if (w) worked.append(w);
          }
        }
      },
    });
    card.append(list.node, fb, worked);
    return card;
  }

  function afterCard() {
    const D = sk.discourse || {};
    const talk = D.compare?.prompt ? { head: "Talk about it", text: D.compare.prompt, extra: [`Strategy A: ${D.compare.a}`, `Strategy B: ${D.compare.b}`] } : D.noticeWonder?.prompt ? { head: "Talk about it", text: D.noticeWonder.prompt, extra: [] } : D.debate?.claim ? { head: "Talk about it", text: `Do you agree? ${D.debate.claim}`, extra: [] } : null;
    return h(
      "div",
      { class: "eb-after" },
      hasPredict ? h("div", { class: "eb-why" }, h("h3", { class: "eb-h3" }, "The reasoning"), h("p", {}, C.predict.why)) : null,
      talk ? h("div", { class: "eb-talk" }, h("h3", { class: "eb-h3" }, talk.head), h("p", {}, talk.text), talk.extra.length ? h("ul", {}, talk.extra.map((t) => h("li", {}, t))) : null, h("p", { class: "eb-fine" }, "Talk with a partner first. Then write one sentence about it.")) : null,
      h("div", { class: "eb-actions" }, btn("Print the comic", printComic, "btn eb-primary"), btn("Read it again", restart)),
    );
  }

  function printComic() {
    const nodes = [h("div", { class: "eb-strip eb-strip-print" }, panels.map((_p, i) => { const n = panelNode(i); n.removeAttribute("tabindex"); n.removeAttribute("role"); n.removeAttribute("aria-label"); return n; }))];
    if (hasPredict) nodes.push(h("h2", {}, "Predict"), h("p", {}, C.predict.q), h("ul", { class: "eb-plain" }, C.predict.options.map((t) => h("li", {}, `[ ] ${t}`))), h("p", {}, "My prediction and why: ____________________________________________"));
    const D = sk.discourse || {};
    if (D.compare?.prompt || D.noticeWonder?.prompt) nodes.push(h("h2", {}, "Talk about it"), h("p", {}, D.compare?.prompt || D.noticeWonder.prompt), h("p", {}, "My sentence: ______________________________________________________"));
    printSheet(`${sk.title}: ${C.title || "Comic"}`, nodes);
  }
  function restart() {
    o.round += 1;
    Object.assign(st, { shown: 1, predicted: false, misses: 0 });
    draw(false);
    body.querySelector("h2")?.focus();
  }
  root.append(h("div", { class: "eb-top" }, h("p", { class: "eb-context" }, `Comic: ${sk.title}`), btn("Start over", restart)), body, h("p", { class: "eb-fine" }, "The characters are made up. Nothing here is timed, saved or sent."));
  if (!C || panels.length < 2) body.append(note("This skill has no comic yet."));
  else draw(false);
  return { destroy() { dropPrintRoot(); stopSpeech(); clear(el); } };
}

/* ================================================================== 6. TRANSFER LAB */

function transferLab(el, opts) {
  const o = norm(opts);
  const sk = o.skill;
  const root = boot(el, "eb-transfer", o);
  const T = sk.transfer;
  const gen = makeGen(sk, o);
  const g = gradeBand(sk);
  const body = h("div", { class: "eb-body" });
  const st = { step: 0, text: "", n: 0 };
  const S = (salt) => seedFor(o, salt) + o.round * 101;
  const ROUNDS = 3;
  const TITLES = [g === 0 ? "Same or different?" : "Sort the statements", "Match the forms", "Say it your way"];

  const sortStep = (sec) => {
    const items = makeRng(`sort:${sk.id}:${o.seed}:${o.round}`).shuffle([...T.phrasings.map((text) => ({ text, same: true })), ...T.decoys.map((d) => ({ text: d.text, same: false, why: d.why }))]);
    sec.append(h("p", { class: "eb-directions" }, "Here is one relationship. Decide whether each statement says the same relationship or a different one."), h("blockquote", { class: "eb-relation" }, h("strong", {}, "The relationship: "), T.relationship), o.band === "1-2" || g === 0 ? hearButton(speakable(T.relationship), "Hear it") : null);
    let left = items.length;
    const list = h("ol", { class: "eb-sort" });
    items.forEach((it, k) => {
      const tid = nid("t");
      const fb = h("div", { class: "ml-fb" });
      let misses = 0;
      let done = false;
      const pick = (same) => {
        if (done) return;
        if (same === it.same) {
          done = true;
          [bs, bd].forEach((b) => b.setAttribute("aria-disabled", "true"));
          (same ? bs : bd).classList.add("eb-right");
          (same ? bs : bd).append(h("span", { class: "eb-mark" }, " (Yes)"));
          feedback(fb, "ok", it.same ? "Yes. It says the same relationship in other words or another form." : `Yes, it is different. ${it.why}`);
          if (!--left) {
            sec.append(h("p", { class: "eb-finish" }, "All sorted."), nextRow("Next: match the forms", () => advance()));
            say(root, "All statements sorted.");
          }
        } else {
          misses += 1;
          const b = same ? bs : bd;
          b.classList.add("eb-wrong");
          b.append(h("span", { class: "eb-mark" }, " (Not this one)"));
          b.setAttribute("aria-disabled", "true");
          feedback(fb, "try", misses === 1 ? "Compare it with the relationship above. Check the order of the quantities and what each number counts." : "Say the relationship above in your own words. Then say this statement. Do they match?");
        }
      };
      const bs = h("button", { type: "button", class: "btn eb-choice", onclick: () => pick(true) }, "Same relationship");
      const bd = h("button", { type: "button", class: "btn eb-choice", onclick: () => pick(false) }, "Different relationship");
      list.append(h("li", { class: "eb-sortitem" }, h("p", { class: "eb-q", id: tid }, `Statement ${String.fromCharCode(65 + k)}: ${it.text}`), h("div", { class: "eb-choices", role: "group", "aria-labelledby": tid }, bs, bd), fb));
    });
    sec.append(list);
  };

  const buildRound = (n) => {
    const base = S(40 + n * 11 + st.n * 3);
    const p = gen.get(base);
    if (!p) return null;
    const foils = [];
    const seenW = new Set();
    const numKey = (q) => numerals(`${q.stem.standard} ${q.ask.standard}`).sort().join("|");
    if (!numKey(p)) return null;
    seenW.add(numKey(p));
    for (let k = 1; k < 30 && foils.length < 2; k++) {
      const q = gen.get(base + k * 3 + 1);
      if (!q || !numKey(q) || seenW.has(numKey(q))) continue;
      seenW.add(numKey(q));
      foils.push(q);
    }
    if (!foils.length) return null;
    return { p, foils };
  };

  const matchStep = (sec) => {
    const rounds = [];
    for (let i = 0, tries = 0; rounds.length < ROUNDS && tries < ROUNDS * 4; i++, tries++) {
      const r = buildRound(i);
      if (r) rounds.push(r);
    }
    if (!rounds.length) return sec.append(note("A matching task could not be made for this skill, so skip to the last step."), nextRow("Next: say it your way", () => advance()));
    sec.append(h("p", { class: "eb-directions" }, "The same situation can be told in words and shown in a picture or a number sentence. Match them."));
    let left = rounds.length;
    rounds.forEach((r, k) => {
      const { p, foils } = r;
      const hasForm = !!(p.expr || p.visual);
      const toWords = hasForm && k % 2 === 0; // target is the picture or expression, choose the words
      const w = (q) => { const t = problemText(q, o.band); return `${t.stem} ${t.ask}`.trim(); };
      const formOf = (q) => (q.visual && (k % 4 < 2 || !q.expr) ? { node: visualNode(q.visual, "eb-vis-opt"), label: `Picture: ${q.visual.alt}`, key: JSON.stringify(q.visual) } : q.expr ? { text: q.expr, key: q.expr } : null);
      const qid = nid("q");
      let target;
      let options;
      if (toWords) {
        const f = formOf(p);
        if (!f || (!f.node && !f.text)) return;
        target = f.node ? h("div", { class: "eb-target" }, f.node) : h("p", { class: "eb-target eb-expr" }, f.text);
        options = [{ text: w(p), correct: true }, ...foils.map((q) => ({ text: w(q), correct: false }))];
      } else {
        const forms = [p, ...foils].map(formOf);
        if (forms.some((f) => !f) || new Set(forms.map((f) => f.key)).size !== forms.length) {
          // fall back to words on both sides: a plain wording against other wordings
          target = h("p", { class: "eb-target" }, problemText(p, "1-2").stem + " " + problemText(p, "1-2").ask);
          const lv = (q) => { const t = problemText(q, o.band === "1-2" ? "3-4" : o.band); return `${t.stem} ${t.ask}`.trim(); };
          options = [{ text: lv(p), correct: true }, ...foils.map((q) => ({ text: lv(q), correct: false }))];
        } else {
          target = h("p", { class: "eb-target" }, w(p));
          options = forms.map((f, i) => ({ ...f, correct: i === 0 }));
        }
      }
      if (new Set(options.map((x) => x.text || x.key || x.label)).size !== options.length) return;
      const items = makeRng(`mt:${sk.id}:${o.seed}:${o.round}:${k}`).shuffle(options);
      const fb = h("div", { class: "ml-fb" });
      let misses = 0;
      let done = false;
      const list = choiceList(items, {
        labelledBy: qid,
        cls: items.some((x) => x.node) ? "eb-choices-vis" : "",
        onPick(it, i) {
          if (done) return;
          if (it.correct) {
            done = true;
            list.mark(i, "right");
            list.lock();
            feedback(fb, "ok", "They show the same situation: the same numbers in the same roles.");
            if (!--left) sec.append(nextRow("Next: say it your way", () => advance()));
          } else {
            misses += 1;
            list.mark(i, "wrong");
            feedback(fb, "try", misses === 1 ? "Check the numbers first. Do the same numbers appear in the same roles?" : "Check the order and what each number counts, then look at the choices again.");
          }
        },
      });
      sec.append(h("div", { class: "eb-item", "data-eb-problem": "", "data-family": p.family, "data-seed": p.seed, "data-level": p._level ?? "", "data-ctx": p._ctx ?? "" }, h("p", { class: "eb-q", id: qid }, `Round ${k + 1}: ${toWords ? "Which words tell the same situation as this?" : "Which picture or number sentence shows the same situation as these words?"}`), target, list.node, fb));
    });
    sec.append(h("div", { class: "eb-actions" }, btn("Try new matching rounds", () => ((st.n += 1), draw(true)))));
    if (!sec.querySelector(".eb-item")) sec.append(note("A matching task could not be made for this skill, so skip to the last step."), nextRow("Next: say it your way", () => advance()));
  };

  const sayStep = (sec) => {
    const fid = nid("f");
    const frames = framesFor(sk, o.band, o.band === "5-6" ? 1 : 3);
    const ta = h("textarea", { id: fid, rows: 4, class: "eb-ta", oninput: () => (st.text = ta.value) });
    ta.value = st.text;
    const fb = h("div", { class: "ml-fb" });
    const extra = h("div", {});
    sec.append(h("p", { class: "eb-directions" }, "Say the relationship in your own way. You can use words, numbers or both."), h("blockquote", { class: "eb-relation" }, h("strong", {}, "The relationship: "), T.relationship));
    if (frames.length && o.band !== "5-6") sec.append(h("div", { class: "eb-chips" }, frames.map((f) => btn(f, () => { ta.value = ta.value ? `${ta.value} ${f}` : f; st.text = ta.value; ta.focus(); }))));
    sec.append(h("div", { class: "eb-field" }, h("label", { for: fid, class: "eb-label" }, "My own way of saying it"), ta), h("div", { class: "eb-actions" }, btn("Check my sentence", () => {
      const txt = ta.value.trim();
      if (!txt) return feedback(fb, "info", "Write a few words first.");
      const r = checkSentence(txt, { kind: "explain", targets: termsOfSkill(sk), minWords: 4 });
      feedback(fb, "info", r.ok ? "Your sentence has a good shape. A partner checks that it says the same relationship." : `A shape check (not a grade): ${r.notes.join(" ")}`);
      clear(extra);
      extra.append(h("p", {}, h("strong", {}, "One way to say it: "), T.phrasings[0]), nextRowDone());
      say(root, "Saved for this session only.");
    }, "btn eb-primary")), fb, extra, h("p", { class: "eb-fine" }, "Your writing stays on this page for this session only. It is not graded by the computer."));
  };
  const nextRowDone = () => h("div", { class: "eb-actions eb-next" }, h("p", { class: "eb-finish" }, "You saw the same relationship in many forms."), btn("Start over", restart, "btn eb-primary"));

  function advance() {
    st.step += 1;
    draw(true);
  }
  function draw(focus) {
    clear(body);
    const hd = head(`Step ${st.step + 1} of ${TITLES.length}: ${TITLES[st.step]}`, nid("h"));
    const sec = h("section", { class: "eb-station", "aria-labelledby": hd.id, "data-eb-step": st.step }, hd);
    body.append(sec);
    [sortStep, matchStep, sayStep][st.step](sec);
    if (focus) {
      hd.focus();
      say(root, hd.textContent);
    }
  }
  function restart() {
    o.round += 1;
    Object.assign(st, { step: 0, text: "", n: 0 });
    draw(true);
  }
  root.append(h("div", { class: "eb-top" }, h("p", { class: "eb-context" }, `Transfer: ${sk.title}`), btn("Start over", restart)), body, h("p", { class: "eb-fine" }, "The point is to spot the same structure in different words and forms. Hear buttons use your device's computer voice. Nothing here is timed, saved or sent."));
  if (!T || !Array.isArray(T.phrasings) || !T.phrasings.length || !T.relationship) body.append(note("This skill has no transfer task yet."));
  else draw(false);
  return { destroy() { stopSpeech(); clear(el); } };
}

/* ------------------------------------------------------------------ registry */

export const ENGINES = {
  "listening-lab": { title: "Mathematical Listening Lab", blurb: "Listen to mathematics with a transcript always one click away: identify details, build an answer, match a strategy, find an error and respond to an argument.", mount: listeningLab },
  "error-detective": { title: "Mathematical Error Detective", blurb: "Inspect a made-up student's work, find the first incorrect step, name the thinking, explain and fix it, then use the corrected reasoning on a new problem.", mount: errorDetective },
  "story-studio": { title: "Mathematical Story Studio", blurb: "Follow a short story where each part has a math puzzle. A miss brings a hint and a new puzzle, never a dead end.", mount: storyStudio },
  "modeling-workshop": { title: "Mathematical Modeling Workshop", blurb: "Model an invented situation in your own words and numbers: choose assumptions, test a what-if, interpret the result and name its limits.", mount: modelingWorkshop },
  "concept-comics": { title: "Mathematical Concept Comics", blurb: "Read a comic one panel at a time, make a prediction before the story continues, then talk about the reasoning and print it.", mount: conceptComics },
  "transfer-lab": { title: "Math Language Transfer Lab", blurb: "Sort statements that say the same relationship from ones that do not, match words to pictures and number sentences, then say it your own way.", mount: transferLab },
};
