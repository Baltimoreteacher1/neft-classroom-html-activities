// Vocabulary Academy reader — the interactive reader. mountReader() plays one reading (a lesson passage or a companion
// reading) in three moves: Before (spot the words, predict), During (read-along, word cards, find the clue, highlighter and
// notes) and After (questions, retell, words I met). Free retry everywhere; no timers; no score or grade.
// The component owns its own listeners on `host`, so a routed view and a lesson step use it the same way.
import { announce } from "../../util.js";
import { checkChoice, checkEvidence, isTapEvidence, nextOpen, planResults } from "./flow.js";
import { blankClueState, clueStep, playableClues } from "./clues.js";
import { finishReading, noteAnswer, setMark, setNote, setRetell } from "./marks.js";
import {
  afterHTML,
  beforeHTML,
  clueMsgHTML,
  doneHTML,
  duringHTML,
  headerHTML,
  marksListHTML,
  sentenceText,
  spotLive,
  stepperHTML,
} from "./panels.js";
import { paraHTML, textHTML } from "./render.js";
import { paraPieces, sentenceSpans } from "./text.js";
import { createReadAlong } from "./tts.js";

const $ = (root, sel) => root.querySelector(sel);
const $$ = (root, sel) => [...root.querySelectorAll(sel)];

/**
 * @param {HTMLElement} host
 * @param {{ reading:object, words:object[], I:object, sup?:object, band?:string, early?:boolean, state:object,
 *           label?:string[], links?:object, lessonMode?:boolean, lessonDone?:boolean, fullHref?:string,
 *           startStep?:string, speech?:object, onChange:(state:object)=>void, onRecord?:(plan:object[])=>void,
 *           onLessonDone?:()=>void }} opts
 */
export function mountReader(host, opts) {
  const { reading, words, I } = opts;
  const sup = opts.sup || {};
  let state = opts.state;
  const R = {
    I,
    reading,
    words,
    sup,
    band: opts.band || "",
    early: Boolean(opts.early),
    label: opts.label,
    links: opts.links || {},
    lessonMode: Boolean(opts.lessonMode),
    lessonDone: Boolean(opts.lessonDone),
    fullHref: opts.fullHref || "",
    get state() {
      return state;
    },
    ui: {
      step: opts.startStep || (opts.lessonMode ? "during" : "before"),
      view: "read",
      chunk: Boolean(opts.early || sup.chunked),
      large: Boolean(opts.early || reading.listenOnly),
      para: 0,
      sel: null,
      clue: { ...blankClueState(), found: [...state.found] },
      clueMsg: { k: "pick" },
      pop: null,
      speak: { state: "idle", rate: 1 },
      q: freshQ(0),
      where: null,
      finished: false,
      cur: { p: -1, s: -1, t: -1 },
    },
    ra: null,
  };
  const ui = R.ui;
  function freshQ(i) {
    return { i, tried: [], tapped: [], right: false, proof: "" };
  }
  if (!state.done) {
    const open = nextOpen(reading, state.ans);
    ui.q = freshQ(open === -1 ? (reading.qs.length ? reading.qs.length : 0) : open);
    if (!Object.values(state.ans).some((a) => a.right)) ui.q = freshQ(0);
  }

  const commit = () => opts.onChange?.(state);
  const say = (en, es) => announce(I.S(en, es), { toast: false });
  const q = () => reading.qs[ui.q.i];

  R.ra = createReadAlong({
    paras: reading.paras,
    speech: opts.speech,
    onSentence: (p, s) => lightSentence(p, s),
    onToken: (p, t) => lightToken(p, t),
    onState: (st) => {
      ui.speak.state = st;
      repaintBar();
    },
  });

  // ── painting ──────────────────────────────────────────────────────────────────────────────────────────────────
  host.classList.add("var-host");
  host.innerHTML = `<div class="var" data-var-root></div>`;
  const root = $(host, "[data-var-root]");

  function paint({ focus = true } = {}) {
    const body =
      ui.step === "before" ? beforeHTML(R) : ui.step === "during" ? duringHTML(R) : afterHTML(R);
    root.innerHTML = `${headerHTML(R)}${stepperHTML(R)}<div class="var-body" data-var-body data-step="${ui.step}">${body}</div>`;
    rove();
    applyKaraoke();
    if (focus) {
      const h = $(root, "#varSpotH, #varQ, #varRetellH, #varDoneH") || $(root, "#varTitle");
      (ui.step === "during" ? $(root, "#varTitle") : h)?.focus({ preventScroll: false });
    }
  }
  const textBox = () => $(root, "[data-var-text]");

  function paintPara(p, container) {
    const box = container || textBox();
    const el = box && $(box, `[data-para="${p}"]`);
    if (!el) return;
    const view = ui.step === "during" && ui.view === "clue" ? "clue" : "read";
    const tpl = document.createElement("template");
    tpl.innerHTML = paraHTML(R, p, container && container.matches("[data-var-tap]") ? "tap" : view);
    const host2 = el.nextElementSibling?.matches("[data-pop-host]") ? el.nextElementSibling : null;
    host2?.remove();
    el.replaceWith(...tpl.content.childNodes);
    rove();
    applyKaraoke();
  }
  const paintText = () => {
    const box = textBox();
    if (!box) return;
    box.innerHTML = textHTML(R, ui.view === "clue" ? "clue" : "read", ui.chunk ? ui.para : null);
    rove();
    applyKaraoke();
  };
  function repaintBar() {
    const bar = $(root, ".var-bar");
    if (!bar || ui.step !== "during") return;
    const had = bar.contains(document.activeElement);
    const tpl = document.createElement("template");
    tpl.innerHTML = duringHTML(R);
    const next = $(tpl.content, ".var-bar");
    if (!next) return;
    bar.replaceWith(next);
    if (had) $(root, '.var-bar [data-var-ra="play"], .var-bar [data-var-ra="pause"]')?.focus();
  }
  const syncTray = () => {
    const tray = $(root, ".var-tray");
    if (!tray) return;
    if (ui.view === "clue") {
      const tpl = document.createElement("template");
      tpl.innerHTML = duringHTML(R);
      const next = $(tpl.content, ".var-tray");
      if (next) tray.replaceWith(next);
      return;
    }
    const live = $(tray, "[data-var-live]");
    const tpl = document.createElement("template");
    tpl.innerHTML = duringHTML(R);
    const next = $(tpl.content, ".var-tray");
    if (!next) return;
    if (live) live.innerHTML = $(next, "[data-var-live]").innerHTML;
    $$(tray, "[data-var-mark]").forEach((b) => {
      const n = $(next, `[data-var-mark="${b.dataset.varMark}"]`);
      b.setAttribute("aria-pressed", n.getAttribute("aria-pressed"));
      if (n.hasAttribute("aria-disabled")) b.setAttribute("aria-disabled", "true");
      else b.removeAttribute("aria-disabled");
    });
    const note = $(tray, "[data-var-note]");
    const nn = $(next, "[data-var-note]");
    if (note && nn) {
      note.value = nn.value;
      note.disabled = nn.disabled;
    }
    const hear = $(tray, "[data-var-hear]");
    const nh = $(next, "[data-var-hear]");
    if (hear && nh)
      nh.hasAttribute("aria-disabled")
        ? hear.setAttribute("aria-disabled", "true")
        : hear.removeAttribute("aria-disabled");
    const list = $(tray, "[data-var-marklist]");
    if (list) list.innerHTML = marksListHTML(R);
  };

  // Roving tab stop: one stop per paragraph in the clue view; arrow keys move between words.
  function rove() {
    $$(root, ".var-para").forEach((p) => {
      const taps = $$(p, ".var-tap");
      taps.forEach((el, i) => el.setAttribute("tabindex", i === 0 ? "0" : "-1"));
    });
  }
  const focusTap = (p, start) => {
    const el =
      $(root, `[data-para="${p}"] [data-start="${start}"]`) ||
      $(root, `[data-para="${p}"] .var-tap`);
    if (el) {
      $$(root, `[data-para="${p}"] .var-tap`).forEach((x) => x.setAttribute("tabindex", "-1"));
      el.setAttribute("tabindex", "0");
      el.focus();
    }
  };

  // ── karaoke ─────────────────────────────────────────────────────────────────────────────────────────────────
  function applyKaraoke() {
    const box = textBox();
    if (!box || ui.step !== "during") return;
    $$(box, ".is-reading-s").forEach((e) => e.classList.remove("is-reading-s"));
    $$(box, ".is-reading-w").forEach((e) => e.classList.remove("is-reading-w"));
    if (ui.cur.p < 0) return;
    $(box, `.var-s[data-p="${ui.cur.p}"][data-s="${ui.cur.s}"]`)?.classList.add("is-reading-s");
    if (ui.cur.t >= 0)
      $$(
        box,
        `[data-para="${ui.cur.p}"] [data-t="${ui.cur.t}"], [data-para="${ui.cur.p}"] [data-ts~="${ui.cur.t}"]`,
      ).forEach((e) => e.classList.add("is-reading-w"));
  }
  function lightSentence(p, s) {
    ui.cur = { p, s, t: -1 };
    if (p >= 0 && ui.chunk && ui.step === "during" && p !== ui.para) {
      ui.para = p;
      paintText();
      repaintNav();
    }
    applyKaraoke();
    if (p >= 0)
      $(root, `.var-s[data-p="${p}"][data-s="${s}"]`)?.scrollIntoView({ block: "nearest" });
  }
  function lightToken(p, t) {
    ui.cur = { ...ui.cur, p: p >= 0 ? p : ui.cur.p, t };
    applyKaraoke();
  }
  function repaintNav() {
    const nav = $(root, ".var-pnav");
    if (!nav) return;
    const tpl = document.createElement("template");
    tpl.innerHTML = duringHTML(R);
    const next = $(tpl.content, ".var-pnav");
    if (next) nav.replaceWith(next);
  }

  // ── helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
  const wordIdAt = ({ para, charIndex }) =>
    paraPieces(reading.paras[para] || "", words).find(
      (x) => x.kind === "word" && charIndex >= x.start && charIndex < x.end,
    )?.wordId;
  const visibleParas = () => (ui.chunk ? [ui.para] : reading.paras.map((_, i) => i));
  const sentenceList = () =>
    visibleParas().flatMap((p) => sentenceSpans(reading.paras[p]).map((x) => ({ p, s: x.index })));
  function goStep(id) {
    R.ra.stop();
    ui.step = id;
    ui.pop = null;
    ui.where = null;
    if (id === "after") ui.finished = false;
    paint();
    const names = {
      before: ["Before you read", "Antes de leer"],
      during: ["Read", "Leer"],
      after: ["After you read", "Después de leer"],
    };
    say(`${names[id][0]}.`, `${names[id][1]}.`);
  }
  const clearFlash = () => $$(root, ".is-flash").forEach((e) => e.classList.remove("is-flash"));

  // ── clue game ───────────────────────────────────────────────────────────────────────────────────────────────
  function clueAct(act) {
    const before = ui.clue;
    const out = clueStep(before, reading.paras, reading.clues, act, { wordAt: wordIdAt });
    ui.clue = out.state;
    const prevTarget = before.target;
    switch (out.event) {
      case "found": {
        const c = reading.clues[out.clue];
        ui.clueMsg = { k: "found", word: c.word, type: c.type };
        state = { ...state, found: [...ui.clue.found] };
        commit();
        if (
          playableClues(reading.paras, reading.clues).every((x) =>
            ui.clue.found.includes(reading.clues.indexOf(x)),
          )
        )
          ui.clueMsg = { ...ui.clueMsg, all: true };
        break;
      }
      case "selected":
        ui.clueMsg = { k: "selected", word: act.select };
        break;
      case "miss":
        ui.clueMsg = { k: "miss" };
        break;
      case "no-clue-for-word":
        ui.clueMsg = { k: "no-clue" };
        break;
      case "tapped-the-word":
        ui.clueMsg = { k: "the-word" };
        break;
      case "again":
        ui.clueMsg = { k: "again" };
        break;
      default:
        ui.clueMsg = { k: "pick" };
    }
    // Repaint only what changed, so the learner's place in the text is kept.
    const paras = new Set();
    for (const el of $$(root, ".var-para")) paras.add(Number(el.dataset.para));
    const tapStart = act.tap
      ? $(root, `[data-para="${act.tap.para}"] [data-start]:focus`)?.dataset.start
      : null;
    if (out.event === "found" || out.event === "selected" || prevTarget !== ui.clue.target)
      for (const p of paras) paintPara(p);
    syncTray();
    if (act.tap) focusTap(act.tap.para, tapStart ?? act.tap.charIndex);
    else if (act.select) {
      const el = $(root, `.var-w[data-word="${act.select}"]`);
      el?.focus();
    }
    const live = $(root, "[data-var-live]");
    if (live) live.innerHTML = clueMsgHTML(R);
  }

  // ── questions ───────────────────────────────────────────────────────────────────────────────────────────────
  function paintQuestion(focusSel) {
    const body = $(root, "[data-var-body]");
    body.innerHTML = afterHTML(R);
    rove();
    if (focusSel) $(root, focusSel)?.focus();
  }
  function recordAnswer(correct) {
    if (state.done) return; // a replay leaves the first record as it was
    state = noteAnswer(state, q().id, correct);
    commit();
  }
  function onChoice(k) {
    const cur = q();
    if (!cur || ui.q.right || ui.q.tried.includes(k)) return;
    const out = checkChoice(cur, k);
    clearFlash();
    recordAnswer(out.ok);
    if (out.ok) {
      ui.q.right = true;
      paintQuestion("[data-var-qnext]");
    } else {
      ui.q.tried.push(k);
      paintQuestion(`[data-var-choice="${k}"]`);
    }
  }
  function onTapSentence(p, s) {
    const cur = q();
    if (!cur || ui.q.right || !isTapEvidence(cur, reading.paras)) return;
    const key = `${p}:${s}`;
    if (ui.q.tapped.includes(key)) return;
    const out = checkEvidence(cur, reading.paras, { para: p, sentence: s });
    clearFlash();
    recordAnswer(out.ok);
    if (out.ok) {
      ui.q.right = true;
      ui.q.proof = key;
      paintQuestion("[data-var-qnext]");
    } else {
      ui.q.tapped.push(key);
      paintQuestion(`[data-tap-p="${p}"][data-tap-s="${s}"]`);
    }
  }
  function showWhere(p) {
    ui.where = p;
    const ref = $(root, "[data-var-textref]");
    if (ref) ref.open = true;
    clearFlash();
    const box =
      $(root, "[data-var-tap]") ||
      $(root, "[data-var-textref] [data-var-text]") ||
      $(root, "[data-var-text]");
    const el = box && $(box, `[data-para="${p}"]`);
    if (!el) return;
    el.classList.add("is-flash");
    el.scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
    say(`Paragraph ${p + 1}.`, `Párrafo ${p + 1}.`);
  }
  function finish() {
    const plan = planResults(reading, words, state.ans);
    if (!state.done) opts.onRecord?.(plan);
    state = finishReading(state);
    commit();
    ui.finished = true;
    paint();
    say("Saved. You finished this reading.", "Guardado. Terminaste esta lectura.");
  }

  // ── events ──────────────────────────────────────────────────────────────────────────────────────────────────
  function openCard(wordId, p) {
    ui.pop = { wordId, p };
    const box = $(root, "[data-var-text]");
    const container = box?.contains($(root, `[data-para="${p}"]`))
      ? box
      : $(root, `[data-para="${p}"]`)?.closest("[data-var-text]");
    paintPara(p, container);
    $(container || root, `[data-pop-host="${p}"] [data-var-pop]`)?.focus();
  }
  function closeCard() {
    if (!ui.pop) return;
    const { wordId, p } = ui.pop;
    ui.pop = null;
    const el = $(root, `[data-para="${p}"]`);
    paintPara(p, el?.closest("[data-var-text]"));
    const back =
      $(root, `[data-para="${p}"] button[data-word="${wordId}"]`) ||
      $(root, `[data-para="${p}"] [data-word="${wordId}"]`);
    back?.focus();
  }

  function onClick(e) {
    const t = e.target;
    const go = t.closest("[data-var-step]");
    if (go) return goStep(go.dataset.varStep);
    const spot = t.closest("[data-var-spot]");
    if (spot) {
      const id = spot.dataset.varSpot;
      const has = state.spot.includes(id);
      state = { ...state, spot: has ? state.spot.filter((x) => x !== id) : [...state.spot, id] };
      spot.setAttribute("aria-pressed", String(!has));
      spot.innerHTML = `<span lang="en">${spot.querySelector("[lang]")?.textContent || ""}</span>${has ? "" : ' <span aria-hidden="true">✓</span>'}`;
      const live = $(root, "[data-var-spot-live]");
      if (live) live.textContent = spotLive(R);
      return commit();
    }
    const ra = t.closest("[data-var-ra]");
    if (ra) {
      if (ra.getAttribute("aria-disabled") === "true") return;
      const a = ra.dataset.varRa;
      if (a === "play")
        return (
          ra &&
          (R.ra.state === "paused"
            ? R.ra.resume()
            : R.ra.play({ para: ui.chunk ? ui.para : 0, sentence: 0 }))
        );
      if (a === "pause") return R.ra.pause();
      return R.ra.stop();
    }
    const speed = t.closest("[data-var-speed]");
    if (speed) {
      ui.speak.rate = Number(speed.dataset.varSpeed);
      R.ra.setRate(ui.speak.rate);
      $$(root, "[data-var-speed]").forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.varSpeed) === ui.speak.rate)),
      );
      return;
    }
    const mode = t.closest("[data-var-mode]");
    if (mode) {
      ui.view = mode.dataset.varMode;
      ui.sel = null;
      ui.pop = null;
      ui.clue = { ...blankClueState(), found: ui.clue.found };
      ui.clueMsg = { k: "pick" };
      const body = $(root, "[data-var-body]");
      body.innerHTML = duringHTML(R);
      rove();
      applyKaraoke();
      mode.ownerDocument.querySelector(`[data-var-mode="${ui.view}"]`)?.focus();
      return;
    }
    const opt = t.closest("[data-var-opt]");
    if (opt) {
      const k = opt.dataset.varOpt;
      ui[k] = !ui[k];
      ui.pop = null;
      $(root, "[data-var-body]").innerHTML = duringHTML(R);
      rove();
      applyKaraoke();
      $(root, `[data-var-opt="${k}"]`)?.focus();
      return;
    }
    const pn = t.closest("[data-var-para]");
    if (pn) {
      if (pn.getAttribute("aria-disabled") === "true") return;
      const next = ui.para + (pn.dataset.varPara === "next" ? 1 : -1);
      ui.para = Math.max(0, Math.min(reading.paras.length - 1, next));
      ui.pop = null;
      ui.sel = null;
      $(root, "[data-var-body]").innerHTML = duringHTML(R);
      rove();
      $(root, `[data-var-para="${pn.dataset.varPara}"]`)?.focus();
      return;
    }
    if (t.closest("[data-var-pop-close]")) return closeCard();
    // clue view taps (a word is a button-like span)
    const tap = t.closest(".var-tap");
    if (tap && ui.view === "clue") {
      const p = Number(tap.closest("[data-para]").dataset.para);
      const word = tap.dataset.word;
      if (word && !ui.clue.target) return clueAct({ select: word });
      return clueAct({ tap: { para: p, charIndex: Number(tap.dataset.start) } });
    }
    if (t.closest("[data-var-clue-clear]")) {
      ui.clue = { ...ui.clue, target: "" };
      ui.clueMsg = { k: "pick" };
      for (const el of $$(root, ".var-para")) paintPara(Number(el.dataset.para));
      syncTray();
      return;
    }
    const w = t.closest("button[data-word]");
    if (w)
      return openCard(
        w.dataset.word,
        Number(w.dataset.paraOf ?? w.closest("[data-para]").dataset.para),
      );
    // sentences: read-along from here (Read view) or select for marking (Highlight view)
    const sent = t.closest(".var-s");
    if (sent && ui.step === "during") {
      const p = Number(sent.dataset.p);
      const si = Number(sent.dataset.s);
      if (ui.view === "marks") return selectSentence(p, si);
      if (ui.view === "read" && R.ra.supported) return R.ra.play({ para: p, sentence: si });
    }
    const sb = t.closest("[data-var-sent]");
    if (sb) {
      const list = sentenceList();
      if (!list.length) return;
      const at = ui.sel ? list.findIndex((x) => x.p === ui.sel.p && x.s === ui.sel.s) : -1;
      const next =
        sb.dataset.varSent === "next"
          ? Math.min(list.length - 1, at + 1)
          : Math.max(0, at <= 0 ? 0 : at - 1);
      return selectSentence(list[next].p, list[next].s, { scroll: true });
    }
    if (t.closest("[data-var-hear]")) {
      if (ui.sel && R.ra.supported) R.ra.play({ para: ui.sel.p, sentence: ui.sel.s });
      return;
    }
    const mk = t.closest("[data-var-mark]");
    if (mk && ui.sel) {
      const kind = mk.dataset.varMark;
      const was = $(root, `[data-var-mark="${kind}"]`)?.getAttribute("aria-pressed") === "true";
      state = setMark(state, ui.sel.p, ui.sel.s, was ? "" : kind);
      commit();
      paintPara(ui.sel.p);
      syncTray();
      say(was ? "Mark removed." : "Marked.", was ? "Marca quitada." : "Marcada.");
      return;
    }
    const un = t.closest("[data-var-unmark]");
    if (un) {
      const [p, si] = un.dataset.varUnmark.split(":").map(Number);
      state = setNote(setMark(state, p, si, ""), p, si, "");
      commit();
      paintPara(p);
      syncTray();
      return;
    }
    const ch = t.closest("[data-var-choice]");
    if (ch)
      return ch.getAttribute("aria-disabled") === "true"
        ? undefined
        : onChoice(Number(ch.dataset.varChoice));
    const ts = t.closest("[data-tap-p]");
    if (ts) return onTapSentence(Number(ts.dataset.tapP), Number(ts.dataset.tapS));
    const wh = t.closest("[data-var-where]");
    if (wh) return showWhere(Number(wh.dataset.varWhere));
    if (t.closest("[data-var-qnext]")) {
      clearFlash();
      ui.q = freshQ(ui.q.i + 1);
      ui.where = null;
      paint({ focus: false });
      ($(root, "#varQ") || $(root, "#varRetellH"))?.focus();
      return;
    }
    if (t.closest("[data-var-finish]")) return finish();
    if (t.closest("[data-var-again]")) {
      ui.finished = false;
      ui.q = freshQ(0);
      ui.step = "before";
      paint();
      return;
    }
    if (t.closest("[data-var-lesson-done]")) {
      opts.onLessonDone?.();
      R.lessonDone = true;
      const b = $(root, "[data-var-lesson-done]");
      b.setAttribute("aria-pressed", "true");
      b.textContent = `✓ ${I.S("I finished reading", "Terminé de leer")}`;
      say("Saved. You can go on.", "Guardado. Puedes continuar.");
    }
  }

  function selectSentence(p, si, { scroll = false } = {}) {
    const old = ui.sel;
    ui.sel = { p, s: si };
    for (const e of $$(root, ".var-s.is-selected")) e.classList.remove("is-selected");
    const el = $(root, `.var-s[data-p="${p}"][data-s="${si}"]`);
    el?.classList.add("is-selected");
    if (scroll) el?.scrollIntoView({ block: "nearest" });
    if (!old || old.p !== p || old.s !== si) syncTray();
  }

  function onKey(e) {
    if (e.key === "Escape" && ui.pop) {
      e.stopPropagation();
      return closeCard();
    }
    const el = e.target.closest?.(".var-tap");
    if (!el) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      return el.click();
    }
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const all = $$(root, ".var-tap");
    const i = all.indexOf(el);
    let to = -1;
    if (e.key in keys) to = Math.max(0, Math.min(all.length - 1, i + keys[e.key]));
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = all.length - 1;
    if (to < 0) return;
    e.preventDefault();
    all.forEach((x) => x.setAttribute("tabindex", "-1"));
    all[to].setAttribute("tabindex", "0");
    all[to].focus();
  }

  function onChange(e) {
    const t = e.target;
    if (t.matches?.("[data-var-pred]")) {
      state = { ...state, pred: t.value };
      return commit();
    }
    if (t.matches?.("[data-var-retell]")) {
      state = setRetell(state, t.value);
      return commit();
    }
    if (t.matches?.("[data-var-note]") && ui.sel) {
      state = setNote(state, ui.sel.p, ui.sel.s, t.value);
      commit();
      paintPara(ui.sel.p);
      syncTray();
    }
  }
  function flush() {
    const retell = $(root, "[data-var-retell]");
    if (retell && retell.value !== state.retell) state = setRetell(state, retell.value);
    const pred = $(root, "[data-var-pred]");
    if (pred && pred.value !== state.pred) state = { ...state, pred: pred.value };
    commit();
  }

  host.addEventListener("click", onClick);
  host.addEventListener("keydown", onKey);
  host.addEventListener("change", onChange);
  const onHide = () => flush();
  window.addEventListener("pagehide", onHide);
  paint({ focus: false });

  return {
    getState: () => state,
    destroy() {
      try {
        flush();
      } catch {
        // the page is already gone
      }
      R.ra.stop();
      host.removeEventListener("click", onClick);
      host.removeEventListener("keydown", onKey);
      host.removeEventListener("change", onChange);
      window.removeEventListener("pagehide", onHide);
    },
    /** For tests and the lesson step: the learner's current view. */
    ui: () => ui,
    sentenceText: (p, s) => sentenceText(reading, p, s),
    doneHTML: () => doneHTML(R),
  };
}
