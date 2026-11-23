// One question: prompt, the interaction widget, hint ladder, check, feedback that teaches, revise, show-answer.
// Every judgement comes from core/check.js; this file only decides what to say about the result.

import { answerText, checkResponse } from "../core/check.js";
import { safeImageSrc } from "../core/schema.js";
import { buildWidget } from "./formats.js";
import { hearButton } from "./hear.js";
import { icon } from "./icons.js";
import { h, nid, rich, rt } from "./util.js";

/** The question as one speakable string: prompt plus what the student must read to answer. */
function speakableText(q) {
  const parts = [q.prompt];
  const labels = (list, key = "text") => list.map((o, i) => `${"ABCDEFGH"[i] || i + 1}. ${o[key]}`).join(". ");
  if (q.options) parts.push(labels(q.options));
  if (q.pairs) parts.push(q.pairs.map((p) => p.left).join(". "), q.pairs.map((p) => p.right).join(". "));
  if (q.items) parts.push(q.items.map((i) => i.text).join(". "));
  if (q.steps) parts.push(q.steps.map((s) => s.text).join(". "));
  if (q.format === "blank") parts.push(q.text.replace(/\[\[[^\]]*\]\]/g, " blank "));
  if (q.format === "identify") parts.push(q.text.replace(/\[\[([^\]|]*)[^\]]*\]\]/g, "$1"));
  return parts.filter(Boolean).join(". ");
}

function partialLine(q, res, ctx) {
  if (res.status === "partial" && res.hit !== undefined) return ctx.t("partialOf", { hit: res.hit, of: res.of });
  if (res.part === "step") return ctx.t("errorStepAgain");
  if (res.part === "fix") return ctx.t("errorFixAgain");
  if (q.format === "identify" && res.missed?.length) return ctx.t("findMore", { n: res.missed.length });
  if (res.wrong?.length) return ctx.t("needLook", { n: res.wrong.length });
  return "";
}

export function mountQuestion(host, q, ctx, opts = {}) {
  const widget = buildWidget(q, ctx);
  const promptId = nid("prompt");
  const feedback = h("div", { class: "sp-feedback", role: "status", "aria-live": "polite", "aria-atomic": "true" });
  const hintsBox = h("div", { class: "sp-hints", "aria-live": "polite" });
  const checkBtn = h("button", { type: "button", class: "sp-btn sp-btn-primary sp-check-btn" }, ctx.L("check"));
  const hintBtn = h("button", { type: "button", class: "sp-btn sp-btn-quiet sp-hint-btn" }, icon("bulb", 18), h("span", null, ctx.L("hint")));
  const showBtn = h("button", { type: "button", class: "sp-btn sp-btn-quiet", hidden: true }, ctx.L("showAnswer"));
  const nextBtn = h("button", { type: "button", class: "sp-btn sp-btn-primary sp-next", hidden: true }, ctx.L(opts.last ? "finish" : "next"), icon("arrow", 18));
  const prompt = rt("h2", "sp-prompt", q.prompt, { id: promptId, tabindex: "-1" });
  const top = h("div", { class: "sp-q-top" });
  if (opts.total > 1) top.append(h("span", { class: "sp-q-n" }, ctx.t("progress", { n: opts.index + 1, total: opts.total })));
  if (ctx.supports.readAloud) top.append(hearButton(ctx, speakableText(q), ctx.t("hearQuestion")));
  const img = q.image && q.format !== "hotspot" ? safeImageSrc(q.image.src) : "";
  const root = h(
    "section",
    { class: `sp-q sp-q-${q.format}`, "data-block-id": q.id, "data-format": q.format, "aria-labelledby": promptId },
    top,
    prompt,
    img ? h("figure", { class: "sp-figure" }, h("img", { src: img, alt: q.image.decorative ? "" : q.image.alt })) : null,
    h("div", { class: "sp-q-body" }, widget.el),
    hintsBox,
    h("div", { class: "sp-actions" }, hintBtn, showBtn, checkBtn),
    feedback,
    h("div", { class: "sp-next-row" }, nextBtn),
  );
  ctx.markEditable(root, q);

  const rungs = [];
  if (ctx.supports.hints && q.hint) rungs.push({ kind: "hint", text: q.hint });
  if (ctx.supports.frames && q.frame) rungs.push({ kind: "frame", text: q.frame });
  let used = 0;
  let wrongTries = 0;
  let done = false;

  const say = (title, body, cls) => {
    feedback.className = `sp-feedback ${cls}`;
    feedback.replaceChildren(
      h("p", { class: "sp-fb-title" }, icon(cls.includes("right") ? "check" : cls.includes("shown") ? "star" : "bulb", 18), title),
      ...body,
    );
    ctx.announce(feedback.textContent);
  };

  function finish(shown) {
    done = true;
    widget.lock(true);
    checkBtn.hidden = true;
    hintBtn.hidden = true;
    showBtn.hidden = true;
    const rec = ctx.session.finish(q, { shown });
    opts.onDone?.(rec);
    if (opts.onNext) {
      nextBtn.hidden = false;
      nextBtn.focus();
    }
  }

  function reviewPanel() {
    const list = h("ul", { class: "sp-rubric" });
    for (const r of q.rubric || []) {
      const id = nid("rub");
      list.append(h("li", null, h("input", { type: "checkbox", id }), h("label", { for: id }, r)));
    }
    say(
      ctx.t("compare"),
      [
        q.sample ? h("p", { class: "sp-sample" }, h("strong", null, ctx.t("sampleAnswer")), " ", q.sample) : null,
        q.rubric?.length ? h("p", null, ctx.t("rubricHelp")) : null,
        q.rubric?.length ? list : null,
        q.explanation ? rt("p", "sp-explain", q.explanation) : null,
      ],
      "is-right",
    );
  }

  function check() {
    if (done) return;
    const res = checkResponse(q, widget.get());
    if (res.status === "empty") {
      say(ctx.t("emptyTitle"), [h("p", null, ctx.t("emptyBody"))], "is-hint");
      widget.focus();
      return;
    }
    if (q.format === "short" && res.status === "incorrect") {
      say(ctx.t("moreWords"), [h("p", null, ctx.t("moreWordsBody", { n: q.minWords }))], "is-hint");
      widget.focus();
      return;
    }
    ctx.session.attempt(q, res.status);
    widget.mark(res);
    if (res.status === "review") {
      reviewPanel();
      finish(false);
      return;
    }
    if (res.status === "correct") {
      say(ctx.t("correct"), [q.explanation ? rt("p", "sp-explain", q.explanation) : null], "is-right");
      finish(false);
      return;
    }
    wrongTries += 1;
    if (!ctx.options.revise) {
      showAnswer(res);
      return;
    }
    const lines = [h("p", null, partialLine(q, res, ctx) || ctx.t("lookAgain"))];
    if (q.misconception) lines.push(h("p", { class: "sp-watch" }, h("strong", null, ctx.t("watchOut")), " ", rich(h("span"), q.misconception)));
    lines.push(h("p", { class: "sp-note-small" }, ctx.t("reviseHelp")));
    say(res.status === "partial" ? ctx.t("partly") : ctx.t("notYet"), lines, "is-hint");
    checkBtn.replaceChildren(ctx.L("checkAgain"));
    if (wrongTries >= 2) showBtn.hidden = false;
    widget.focus();
  }

  function showAnswer() {
    widget.lock(true);
    const key = answerText(q);
    say(
      ctx.t("hereIsAnswer"),
      [key ? h("p", { class: "sp-key" }, key) : null, q.explanation ? rt("p", "sp-explain", q.explanation) : null, q.misconception ? rt("p", "sp-watch", q.misconception) : null],
      "is-shown",
    );
    finish(true);
  }

  function revealHint() {
    const rung = rungs[used];
    if (!rung) return;
    used += 1;
    ctx.session.hint(q);
    const box = h("div", { class: `sp-hint sp-hint-${rung.kind}` }, h("strong", null, rung.kind === "frame" ? ctx.t("frameLabel") : ctx.t("hintLabel")), " ", rich(h("span"), rung.text));
    if (rung.kind === "frame" && widget.insert) {
      const use = h("button", { type: "button", class: "sp-btn sp-btn-quiet sp-small" }, ctx.L("useFrame"));
      use.addEventListener("click", () => widget.insert(rung.text));
      box.append(use);
    }
    hintsBox.append(box);
    if (used >= rungs.length) {
      hintBtn.hidden = true;
      checkBtn.focus();
    } else hintBtn.querySelector("span").replaceChildren(ctx.L("frameLabel"));
  }

  hintBtn.hidden = rungs.length === 0;
  checkBtn.addEventListener("click", check);
  hintBtn.addEventListener("click", revealHint);
  showBtn.addEventListener("click", showAnswer);
  nextBtn.addEventListener("click", () => opts.onNext?.());
  widget.onSubmit = check;
  host.append(root);

  return {
    el: root,
    focus: () => ctx.focus(prompt),
    widget,
    get done() {
      return done;
    },
  };
}
