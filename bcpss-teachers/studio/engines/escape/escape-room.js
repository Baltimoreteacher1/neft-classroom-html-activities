// One room: narrative, puzzle, support panel, hint ladder, misconception feedback, worked example, parallel puzzle.
// The learner is never told the answer. Pieces are granted by the session only for a right response.
import { h } from "../../core/dom.js";
import { diagnose, incomplete, isCorrect, loopItem } from "./escape-logic.js";
import { renderPuzzle } from "./escape-puzzles.js";
import { visualEl } from "./visual-el.js";

const btn = (label, cls, onclick, attrs = {}) =>
  h("button", { type: "button", class: `st-btn ${cls}`, onclick, ...attrs }, label);

/**
 * mountRoom({ ctx, room, session, loop, flags, onSolved, onChange })
 *  -> { el, focus(), cleanup() }
 * flags: {model, transfer} persisted by the caller (for the debrief).
 */
export function mountRoom({ ctx, room, session, loop, flags, onSolved, onChange }) {
  const p = room.puzzle;
  const fb = ctx.feedback();
  const msg = h("p", { class: "st-esc-msg", role: "status" });
  const title = h("h2", { class: "st-esc-room-title", tabindex: "-1" }, room.title);
  const panelHost = h("div", { class: "st-esc-support-host" });
  const extraHost = h("div", { class: "st-esc-extra" });
  let widget;
  let solved = false;

  const drawSupport = () => {
    const sp = ctx.supportPanel({ supports: p.supports || ctx.activity.supports || {} });
    panelHost.replaceChildren(sp.el);
  };
  const offTier = ctx.onTier(drawSupport);
  drawSupport();

  const check = () => {
    if (solved) return;
    const resp = widget.getResponse();
    const problem = incomplete(p, resp);
    msg.textContent = problem || "";
    if (problem) return;
    const ok = isCorrect(p, resp);
    const diag = ok ? null : diagnose(p, resp);
    const r = loop.submit({ ok, tag: diag?.tag });
    if (ok) {
      const { piece } = session.submit(room.id, resp);
      solved = true;
      widget.lock(true);
      hintBtn.disabled = true;
      checkBtn.disabled = true;
      fb.show("right", p.why);
      ctx.settle(loop);
      onSolved({ piece, record: loop.record() });
      return;
    }
    if (r.kind === "retry") {
      fb.show("retry", diag ? r.text : loop.nextHint() || r.text);
      onChange?.();
    } else if (r.kind === "model") {
      flags.model = true;
      fb.show(
        "model",
        "Here is a worked example with different numbers. Study it, then try your puzzle again.",
      );
      drawModel(diag?.model || p.model.text);
      onChange?.();
    } else if (r.kind === "transfer") {
      flags.transfer = true;
      fb.show(
        "transfer",
        "This one is still tricky. Try this related puzzle first, then come back to the room.",
      );
      drawTransfer();
      onChange?.();
    }
    updateHintBtn();
  };

  const hintBtn = btn("Hint", "st-btn-quiet", () => {
    const text = loop.nextHint();
    if (text) fb.show("hint", text);
    updateHintBtn();
    onChange?.();
  });
  const updateHintBtn = () => {
    const used = Math.min(loop.state.hints, p.hints.length);
    hintBtn.textContent =
      used >= p.hints.length
        ? "No more hints"
        : used
          ? `Next hint (${used} of ${p.hints.length} used)`
          : "Hint";
    hintBtn.disabled = solved || used >= p.hints.length;
  };
  const checkBtn = btn("Check my answer", "st-btn-primary", check);
  const listenBtn = btn(
    "Listen",
    "st-btn-quiet",
    () => ctx.speak(`${room.narrative} ${p.prompt}`),
    { "aria-label": "Listen to the room and the question" },
  );

  widget = renderPuzzle(p, {
    onChange: () => (msg.textContent = ""),
    onEnter: check,
    seed: `${ctx.aid}:${room.id}`,
  });

  function drawModel(text) {
    extraHost.querySelector(".st-esc-model")?.remove();
    const box = h(
      "details",
      { class: "st-esc-model", open: true },
      h("summary", {}, "Worked example (different numbers)"),
      h("p", {}, text),
      p.model.visual ? visualEl(p.model.visual) : null,
    );
    extraHost.prepend(box);
  }

  function drawTransfer() {
    extraHost.querySelector(".st-esc-transfer")?.remove();
    const t = p.transfer;
    const tfb = ctx.feedback();
    let hintsUsed = 0;
    const tmsg = h("p", { class: "st-esc-msg", role: "status" });
    const tw = renderPuzzle(t, { onEnter: () => tcheck(), seed: `${ctx.aid}:${room.id}:t` });
    const tcheckBtn = btn("Check this one", "st-btn-primary", () => tcheck());
    const thint = btn("Hint", "st-btn-quiet", () => {
      tfb.show("hint", t.hints[Math.min(hintsUsed++, t.hints.length - 1)]);
      thint.textContent = hintsUsed >= t.hints.length ? "No more hints" : "Next hint";
      thint.disabled = hintsUsed >= t.hints.length;
    });
    function tcheck() {
      const resp = tw.getResponse();
      const problem = incomplete(t, resp);
      tmsg.textContent = problem || "";
      if (problem) return;
      if (isCorrect(t, resp)) {
        tw.lock(true);
        tcheckBtn.disabled = thint.disabled = true;
        tfb.show(
          "right",
          `${t.why || "That works."} Now go back to your room puzzle and use the same idea.`,
        );
      } else tfb.show("retry", t.hints[Math.min(hintsUsed, t.hints.length - 1)]);
    }
    extraHost.append(
      h(
        "section",
        { class: "st-esc-transfer", "aria-label": "Related puzzle" },
        h("h3", {}, "A related puzzle"),
        tw.el,
        tmsg,
        h("div", { class: "st-esc-actions" }, tcheckBtn, thint),
        tfb.el,
      ),
    );
  }

  if (flags.model) drawModel(p.model.text);
  if (flags.transfer) drawTransfer();
  updateHintBtn();

  const el = h(
    "section",
    { class: "st-esc-room", "aria-labelledby": "st-esc-room-title" },
    title,
    h("p", { class: "st-esc-narrative" }, room.narrative),
    widget.el,
    panelHost,
    msg,
    h("div", { class: "st-esc-actions" }, checkBtn, hintBtn, listenBtn),
    fb.el,
    extraHost,
  );
  title.id = "st-esc-room-title";
  return { el, focus: () => title.focus(), cleanup: offTier };
}
