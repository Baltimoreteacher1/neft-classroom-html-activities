// Number Line Quest HOP rounds: build a path of hops from the start toward the goal. The running position, the arcs on the
// line and the equation of hops all update as hops are added or undone. @fm2 FM-012 FM-038 FM-039 FM-040 FM-021
import { add, cmp } from "../../rational.js";
import { createBoard } from "./board.js";
import { ui } from "./copy.js";
import { MINUS, showNum } from "./format.js";
import { absF } from "./geometry.js";
import { baseConfig, queryOf } from "./ui-kit.js";

export function mountHop(root, ctx) {
  const { round } = ctx;
  let lang = ctx.lang;
  const hops = [];
  const limit = round.cap + 4;
  const size = (h) => showNum(absF(h), round.mode);
  const signed = (h) => `${h.n < 0 ? MINUS : "+"}${size(h)}`;
  const show = (v) => showNum(v, round.mode);
  const here = () => hops.reduce((p, h) => add(p, h), round.start);
  const buttons = round.hops
    .map((h) => `<button type="button" class="fm2-btn nlq-hop" data-hop="${h.n}/${h.d}"></button>`)
    .join("");
  root.innerHTML = `<div class="nlq">
    <p class="nlq-rule" data-rule></p>
    <div class="nlq-stage" data-board></div>
    <p class="nlq-readout" data-readout></p>
    <p class="nlq-equation" data-equation></p>
    <div class="nlq-hops" role="group" data-hopgroup>${buttons}</div>
    <p class="nlq-note" data-note role="status"></p>
    <div class="nlq-actions"><button type="button" class="fm2-btn" data-undo></button><button type="button" class="fm2-btn" data-clear></button><button type="button" class="fm2-btn fm2-btn-primary" data-check></button></div>
  </div>`;
  const q = queryOf(root);
  const board = createBoard(q("board"), {
    ...baseConfig(round, lang),
    markers: [],
    tap: false,
    locked: ctx.locked,
  });

  function draw() {
    const marks = [
      { v: round.start, text: ui("start", lang), shape: "start", lift: 34 },
      { v: round.target, text: ui("goal", lang), shape: "flag" },
    ];
    if (hops.length) marks.push({ v: here(), text: ui("here", lang), shape: "dot", lift: 54 });
    let at = round.start;
    const arcs = hops.map((h) => {
      const from = at;
      at = add(at, h);
      return { from, to: at, text: signed(h), back: h.n < 0 };
    });
    board.set({
      ...baseConfig(round, lang),
      marks,
      arcs,
      aria: ui("figureHop", lang, {
        lo: show(round.line.min),
        hi: show(round.line.max),
        s: show(round.start),
        t: show(round.target),
      }),
    });
    q("rule").textContent = ui("ruleHop", lang, { cap: round.cap });
    q("readout").textContent =
      `${ui("hereAt", lang, { v: show(here()) })}. ${ui("hopsUsed", lang, { n: hops.length, cap: round.cap })}`;
    q("equation").textContent =
      `${ui("equation", lang)}: ${[show(round.start), ...hops.map((h) => `${h.n < 0 ? MINUS : "+"} ${size(h)}`)].join(" ")}${hops.length ? ` = ${show(here())}` : ""}`;
    q("hopgroup").setAttribute("aria-label", ui("hopGroup", lang));
    root.querySelectorAll("[data-hop]").forEach((button, i) => {
      const h = round.hops[i];
      button.textContent = signed(h);
      button.setAttribute(
        "aria-label",
        ui(h.n < 0 ? "hopLeft" : "hopRight", lang, { size: size(h) }),
      );
    });
    q("undo").textContent = ui("undo", lang);
    q("clear").textContent = ui("clear", lang);
    q("check").textContent = ui("checkHops", lang);
  }

  const note = (text) => {
    q("note").textContent = text;
    if (text) ctx.announce(text);
  };
  root.querySelectorAll("[data-hop]").forEach((button, i) =>
    button.addEventListener("click", () => {
      if (ctx.locked()) return;
      const next = add(here(), round.hops[i]);
      if (cmp(next, round.line.min) < 0 || cmp(next, round.line.max) > 0)
        return note(ui("leaveLine", lang));
      if (hops.length >= limit) return note(ui("tooMany", lang));
      hops.push(round.hops[i]);
      draw();
      note("");
      ctx.announce(ui("hopped", lang, { v: show(here()) }));
    }),
  );
  q("undo").addEventListener("click", () => {
    if (ctx.locked() || !hops.length) return;
    hops.pop();
    draw();
    note("");
    ctx.announce(ui("undone", lang, { v: show(here()) }));
  });
  q("clear").addEventListener("click", () => {
    if (ctx.locked() || !hops.length) return;
    hops.length = 0;
    draw();
    note("");
    ctx.announce(ui("cleared", lang, { v: show(here()) }));
  });
  q("check").addEventListener("click", () => {
    if (ctx.locked()) return;
    const result = ctx.submit({ hops: [...hops] });
    if (result?.correct) root.querySelector(".nlq")?.classList.add("is-done");
  });
  draw();
  return {
    setLang(next) {
      lang = next;
      draw();
    },
    destroy() {
      board.destroy();
      root.innerHTML = "";
    },
  };
}
