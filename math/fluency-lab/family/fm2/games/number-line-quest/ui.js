// Number Line Quest interaction for PLACE, ROUND, ORDER and ZOOM rounds (HOP rounds are in ui-hop.js). The learner moves
// one or more markers by dragging, tapping the line, nudge buttons or the keyboard; the shell scores what ctx.submit
// receives. A language switch redraws labels from the markers' step positions, so work in progress is kept.
// @fm2 FM-012 FM-038 FM-039 FM-020 FM-021 FM-037
import { add, frac, mul } from "../../rational.js";
import { ui } from "./copy.js";
import { createBoard } from "./board.js";
import { showNum, spokenNum } from "./format.js";
import { gridIndex } from "./geometry.js";
import { mountHop } from "./ui-hop.js";
import {
  baseConfig,
  frame,
  paintNudge,
  queryOf,
  readFn,
  spokenFn,
  stepTexts,
} from "./ui-kit.js";

const letterOf = (i) => String.fromCharCode(65 + i);
const pow10 = (e) => (e >= 0 ? frac(10 ** e) : frac(1, 10 ** -e));

// Wires the nudge buttons, the check button and the rule/note lines that every marker round shares.
function chrome(root, ctx, handlers) {
  const q = queryOf(root);
  for (const button of root.querySelectorAll("[data-nudge]")) {
    button.addEventListener(
      "click",
      () => !ctx.locked() && handlers.nudge(Number(button.dataset.nudge)),
    );
  }
  q("check")?.addEventListener("click", () => !ctx.locked() && handlers.check());
  return q;
}

function finish(root, ctx, response) {
  const result = ctx.submit(response);
  if (result?.correct) root.querySelector(".nlq")?.classList.add("is-done");
  return result;
}

function mountPlace(root, ctx) {
  const { round } = ctx;
  let lang = ctx.lang;
  root.innerHTML = frame();
  const q = chrome(root, ctx, {
    nudge: (d) => board.setK(0, board.getK(0) + d, "nudge"),
    check: () => finish(root, ctx, { x: board.valueAt(board.getK(0)) }),
  });
  const read = readFn(round);
  const speak = () => spokenFn(round, lang);
  const board = createBoard(q("board"), {
    ...baseConfig(round, lang),
    markers: [
      { k: gridIndex(round.line.min, round.line.step, round.start), name: ui("marker", lang) },
    ],
    valueText: (i, v) => speak()(v),
    locked: ctx.locked,
    onMove: (i, k, source) => {
      q("readout").textContent = ui("readout", lang, { v: read(board.valueAt(k)) });
      if (source === "nudge" || source === "release")
        ctx.announce(ui("readout", lang, { v: speak()(board.valueAt(k)) }));
    },
    onSubmit: () => !ctx.locked() && finish(root, ctx, { x: board.valueAt(board.getK(0)) }),
  });
  function render() {
    const texts = stepTexts(round);
    q("rule").textContent = ui("rulePlace", lang, texts);
    paintNudge(root, lang, texts);
    q("check").textContent = ui("checkSpot", lang);
    q("readout").textContent = ui("readout", lang, { v: read(board.valueAt(board.getK(0))) });
    board.set({
      ...baseConfig(round, lang),
      markers: [{ k: board.getK(0), name: ui("marker", lang) }],
    });
  }
  render();
  return {
    setLang(next) {
      lang = next;
      render();
    },
    destroy() {
      board.destroy();
      root.innerHTML = "";
    },
  };
}

function mountRound(root, ctx) {
  const { round } = ctx;
  let lang = ctx.lang;
  let pick = null;
  root.innerHTML = frame(
    `<div class="nlq-picks" role="group" data-picks><button type="button" class="fm2-btn nlq-pick" data-pick="lo" aria-pressed="false"></button><button type="button" class="fm2-btn nlq-pick" data-pick="hi" aria-pressed="false"></button></div>`,
  );
  const q = chrome(root, ctx, {
    nudge: (d) => board.setK(0, board.getK(0) + d, "nudge"),
    check: () => {
      if (!pick) {
        q("note").textContent = ui("pickFirst", lang);
        ctx.announce(ui("pickFirst", lang));
        return;
      }
      q("note").textContent = "";
      finish(root, ctx, {
        x: board.valueAt(board.getK(0)),
        pick: pick === "lo" ? round.lo : round.hi,
      });
    },
  });
  const read = readFn(round);
  const speak = () => spokenFn(round, lang);
  const board = createBoard(q("board"), {
    ...baseConfig(round, lang),
    markers: [
      { k: gridIndex(round.line.min, round.line.step, round.start), name: ui("marker", lang) },
    ],
    valueText: (i, v) => speak()(v),
    locked: ctx.locked,
    onMove: (i, k, source) => {
      q("readout").textContent = ui("readout", lang, { v: read(board.valueAt(k)) });
      if (source === "nudge" || source === "release")
        ctx.announce(ui("readout", lang, { v: speak()(board.valueAt(k)) }));
    },
    onSubmit: () => q("check").click(),
  });
  for (const button of root.querySelectorAll("[data-pick]")) {
    button.addEventListener("click", () => {
      if (ctx.locked()) return;
      pick = button.dataset.pick;
      q("note").textContent = "";
      paintPicks();
      ctx.announce(
        ui("chosen", lang, { v: showNum(pick === "lo" ? round.lo : round.hi, round.mode) }),
      );
    });
  }
  function paintPicks() {
    for (const button of root.querySelectorAll("[data-pick]")) {
      const value = button.dataset.pick === "lo" ? round.lo : round.hi;
      button.textContent = ui("pickLabel", lang, { v: showNum(value, round.mode) });
      button.setAttribute("aria-pressed", String(pick === button.dataset.pick));
    }
    q("picks").setAttribute("aria-label", ui("nearest", lang));
  }
  function render() {
    const texts = stepTexts(round);
    q("rule").textContent = ui("rulePlace", lang, texts);
    paintNudge(root, lang, texts);
    paintPicks();
    q("check").textContent = ui("checkSpot", lang);
    q("readout").textContent = ui("readout", lang, { v: read(board.valueAt(board.getK(0))) });
    board.set({
      ...baseConfig(round, lang),
      markers: [{ k: board.getK(0), name: ui("marker", lang) }],
    });
  }
  render();
  return {
    setLang(next) {
      lang = next;
      q("note").textContent = "";
      render();
    },
    destroy() {
      board.destroy();
      root.innerHTML = "";
    },
  };
}

function mountOrder(root, ctx) {
  const { round } = ctx;
  let lang = ctx.lang;
  const chips = round.items
    .map(
      (item, i) =>
        `<button type="button" class="fm2-btn nlq-chip" data-chip="${i}" aria-pressed="${i === 0}"></button>`,
    )
    .join("");
  root.innerHTML = frame(
    `<div class="nlq-chips" role="group" data-chips>${chips}</div><p class="nlq-now" data-now></p>`,
  );
  const q = chrome(root, ctx, {
    nudge: (d) => board.setK(board.active, board.getK(board.active) + d, "nudge"),
    check: () => finish(root, ctx, { xs: round.items.map((_, i) => board.valueAt(board.getK(i))) }),
  });
  const read = readFn(round);
  const speak = () => spokenFn(round, lang);
  const names = () =>
    round.items.map((item, i) => ui("markerNamed", lang, { letter: letterOf(i), text: item.text }));
  const markers = () =>
    round.items.map((item, i) => ({
      k: board ? board.getK(i) : gridIndex(round.line.min, round.line.step, round.starts[i]),
      name: names()[i],
      letter: letterOf(i),
    }));
  const board = createBoard(q("board"), {
    ...baseConfig(round, lang),
    markers: round.items.map((item, i) => ({
      k: gridIndex(round.line.min, round.line.step, round.starts[i]),
      name: ui("markerNamed", lang, { letter: letterOf(i), text: item.text }),
      letter: letterOf(i),
    })),
    valueText: (i, v) =>
      `${ui("markerNamed", lang, { letter: letterOf(i), text: round.items[i].text })}: ${speak()(v)}`,
    locked: ctx.locked,
    onActivate: () => paintChips(),
    onMove: (i, k, source) => {
      paintNow();
      q("readout").textContent = ui("readoutNamed", lang, {
        letter: letterOf(i),
        v: read(board.valueAt(k)),
      });
      if (source === "nudge" || source === "release")
        ctx.announce(
          ui("readoutNamed", lang, { letter: letterOf(i), v: speak()(board.valueAt(k)) }),
        );
    },
    onSubmit: () => !ctx.locked() && q("check").click(),
  });
  for (const chip of root.querySelectorAll("[data-chip]")) {
    chip.addEventListener("click", () => {
      board.activate(Number(chip.dataset.chip));
      board.focus(Number(chip.dataset.chip));
    });
  }
  function paintChips() {
    root.querySelectorAll("[data-chip]").forEach((chip, i) => {
      chip.textContent = ui("chip", lang, { letter: letterOf(i), text: round.items[i].text });
      chip.setAttribute("aria-pressed", String(i === board.active));
    });
    q("chips").setAttribute("aria-label", ui("chooseMarker", lang));
  }
  function paintNow() {
    const order = round.items
      .map((_, i) => i)
      .sort((a, b) => board.getK(a) - board.getK(b) || a - b);
    const text = order
      .map(
        (i, n) =>
          `${n && board.getK(i) === board.getK(order[n - 1]) ? "= " : n ? "→ " : ""}${letterOf(i)}`,
      )
      .join(" ");
    q("now").textContent = ui("orderNow", lang, { list: text });
  }
  function render() {
    const texts = stepTexts(round);
    q("rule").textContent = ui("ruleOrder", lang, texts);
    paintNudge(root, lang, texts);
    paintChips();
    paintNow();
    q("check").textContent = ui("checkOrder", lang);
    q("readout").textContent = ui("readoutNamed", lang, {
      letter: letterOf(board.active),
      v: read(board.valueAt(board.getK(board.active))),
    });
    board.set({ ...baseConfig(round, lang), markers: markers() });
  }
  render();
  return {
    setLang(next) {
      lang = next;
      render();
    },
    destroy() {
      board.destroy();
      root.innerHTML = "";
    },
  };
}

function mountZoom(root, ctx) {
  const { round } = ctx;
  const { z, outerMin } = round.zoom;
  let lang = ctx.lang;
  const path = [];
  const winMin = () => (path.length ? path.at(-1) : outerMin);
  const width = () => pow10(-path.length);
  const winStep = () => pow10(-(path.length + 1));
  const choosing = () => path.length < z;
  const dec = (v) => showNum(v, "dec", path.length + 1);
  const span = (v) => ({ lo: dec(v), hi: dec(add(v, winStep())) });
  root.innerHTML = frame(`<p class="nlq-window" data-window></p>`);
  const q = chrome(root, ctx, {
    nudge: (d) => board.setK(0, board.getK(0) + d, "nudge"),
    check: () => {
      if (choosing()) {
        q("note").textContent = ui("zoomFirst", lang);
        ctx.announce(ui("zoomFirst", lang));
        return;
      }
      q("note").textContent = "";
      finish(root, ctx, { path: [...path], x: board.valueAt(board.getK(0)) });
    },
  });
  q("actions").insertAdjacentHTML("afterbegin", `<button type="button" class="fm2-btn fm2-btn-primary" data-zoomin></button><button type="button" class="fm2-btn" data-zoomout></button>`);
  const geometry = () => ({
    min: winMin(),
    max: add(winMin(), width()),
    step: winStep(),
    ticks: winStep(),
    labels: [winMin(), add(winMin(), mul(width(), frac(1, 2))), add(winMin(), width())],
    labelText: dec,
    sliceMode: choosing(),
    aria: ui("figure", lang, { lo: dec(winMin()), hi: dec(add(winMin(), width())), tick: dec(winStep()) }),
  });
  const marker = (k) => [{ k, name: choosing() ? ui("stretch", lang) : ui("marker", lang) }];
  const board = createBoard(q("board"), {
    ...geometry(),
    markers: marker(0),
    valueText: (i, v) => (choosing() ? ui("window", lang, span(v)) : spokenNum(v, "dec", lang)),
    locked: ctx.locked,
    onMove: (i, k, source) => {
      paintMarker();
      if (source === "nudge" || source === "release") ctx.announce(choosing() ? ui("window", lang, span(board.valueAt(k))) : ui("readout", lang, { v: spokenNum(board.valueAt(k), "dec", lang) }));
    },
    onSubmit: () => !ctx.locked() && (choosing() ? q("zoomin").click() : q("check").click()),
  });
  function paintMarker() {
    const v = board.valueAt(board.getK(0));
    q("readout").textContent = choosing() ? ui("stretchNow", lang, span(v)) : ui("readout", lang, { v: dec(v) });
    if (choosing()) q("zoomin").textContent = ui("zoomIn", lang, span(v));
    board.set({ bracket: choosing() ? { from: v, to: add(v, winStep()) } : undefined });
  }
  function render(reset = false) {
    const texts = { step: dec(winStep()), big: showNum(mul(winStep(), frac(10)), "dec") };
    q("rule").textContent = ui("ruleZoom", lang, texts);
    paintNudge(root, lang, texts);
    q("check").textContent = ui("checkSpot", lang);
    q("zoomout").textContent = ui("zoomOut", lang);
    q("zoomout").hidden = path.length === 0;
    q("zoomin").hidden = !choosing();
    q("window").textContent = ui("window", lang, { lo: dec(winMin()), hi: dec(add(winMin(), width())) });
    board.set({ ...geometry(), markers: marker(reset ? 0 : board.getK(0)) });
    paintMarker();
  }
  const zoomTo = (announceKey) => {
    render(true);
    ctx.announce(ui(announceKey, lang, { lo: dec(winMin()), hi: dec(add(winMin(), width())) }));
    board.focus(0);
  };
  q("zoomin").addEventListener("click", () => {
    if (ctx.locked() || !choosing()) return;
    path.push(board.valueAt(board.getK(0)));
    q("note").textContent = "";
    zoomTo("zoomed");
  });
  q("zoomout").addEventListener("click", () => {
    if (ctx.locked() || !path.length) return;
    path.pop();
    zoomTo("zoomedOut");
  });
  render(true);
  return {
    setLang(next) {
      lang = next;
      render();
    },
    destroy() {
      board.destroy();
      root.innerHTML = "";
    },
  };
}

const MOUNTS = {
  place: mountPlace,
  round: mountRound,
  order: mountOrder,
  zoom: mountZoom,
  hop: mountHop,
};
export const mount = (root, ctx) => MOUNTS[ctx.round.kind](root, ctx);
