// Match Mission: cards float down into a tray; pick one up, then choose the slot it belongs to. Pairs come from
// the activity's match questions, or from its vocabulary. Every placement is judged by check.js. Other question
// formats appear as bonus rounds. Calm mode and pause stop the floating; the cards stay where they are.

import { checkResponse } from "../core/check.js";
import { renderBlocks } from "./blocks.js";
import { buildSteps } from "./flow.js";
import { glyph } from "./icons.js";
import { mountQuestion } from "./question.js";
import { h, plainText, repaint, rich, rt, seeded, shuffled } from "./util.js";

const CHUNK = 5;

/** Rounds: each is { q, content }. Vocabulary becomes match questions when the activity has none. */
function buildRounds(ctx) {
  const steps = buildSteps(ctx.activity).filter((s) => s.question);
  const hasMatch = steps.some((s) => s.question.format === "match");
  const rounds = [];
  if (!hasMatch) {
    for (const b of ctx.activity.blocks.filter((x) => x.type === "vocab")) {
      const items = b.items.filter((v) => v.term && v.def);
      for (let i = 0; i < items.length; i += CHUNK) {
        const part = items.slice(i, i + CHUNK);
        if (part.length < 2) continue;
        rounds.push({
          content: [],
          q: {
            id: `vocab-${b.id}-${i}`,
            type: "question",
            format: "match",
            prompt: ctx.t("vocabPrompt"),
            pairs: part.map((v, n) => ({ id: `p${n + 1}`, left: v.term, right: v.def })),
            hint: "",
            explanation: "",
            misconception: "",
          },
        });
      }
    }
  }
  const [pairs, others] = [steps.filter((s) => s.question.format === "match"), steps.filter((s) => s.question.format !== "match")];
  for (const s of [...pairs, ...others]) rounds.push({ content: s.content, q: s.question });
  return rounds;
}

export function mountMatch(area, ctx, { onFinish }) {
  const rounds = buildRounds(ctx);
  const st = (ctx.state.game.match ||= { round: 0 });
  const first = rounds.findIndex((r) => !ctx.session.isDone(r.q));
  st.round = first < 0 ? rounds.length : first;
  if (!rounds.length) {
    onFinish();
    return {};
  }

  function next() {
    st.round += 1;
    play();
  }

  function play() {
    if (st.round >= rounds.length) return onFinish();
    const { q, content } = rounds[st.round];
    if (q.format !== "match") {
      area.replaceChildren();
      if (content.length) area.append(h("div", { class: "sp-content" }, renderBlocks(content, ctx)));
      mountQuestion(area, q, ctx, { index: st.round, total: rounds.length, last: st.round === rounds.length - 1, onNext: next }).focus();
      return;
    }
    round(q, content);
  }

  function round(q, content) {
    const placed = {};
    let picked = "";
    let mistakes = 0;
    let told = false;
    const order = shuffled(q.pairs, seeded(q.id), true);
    const lane = h("div", { class: "sp-lane", role: "group", "aria-label": ctx.t("matchBank") });
    const docks = h("ul", { class: "sp-docks" });
    const say = h("p", { class: "sp-say", role: "status", "aria-live": "polite" }, ctx.t("matchStart"));
    const hint = h("button", { type: "button", class: "sp-btn sp-btn-quiet", hidden: !(ctx.supports.hints && q.hint) }, glyph("bulb", 18), ctx.msg("hint"));
    const head = h(
      "div",
      { class: "sp-round-head" },
      h("h2", { class: "sp-round-title", tabindex: "-1" }, rt("span", "", q.prompt)),
      h("span", { class: "sp-q-n" }, ctx.t("roundN", { n: st.round + 1, total: rounds.length })),
    );
    const root = h("div", { class: "sp-matchgame" });
    area.replaceChildren(root);
    // Vocabulary the game turns into pairs is not shown above it: that list would be the answer key.
    const shown = content.filter((b) => b.type !== "vocab");
    if (shown.length) root.append(h("div", { class: "sp-content" }, renderBlocks(shown, ctx)));
    root.append(head, h("p", { class: "sp-note-small" }, ctx.t("pickThenPlace")), lane, docks, say, h("div", { class: "sp-actions" }, hint));

    const talk = (text) => {
      say.textContent = text;
    };
    function paint() {
      lane.replaceChildren();
      order.forEach((p, i) => {
        if (placed[p.id]) return;
        const c = rich(h("button", { type: "button", class: "sp-gcard", "data-key": `c:${p.id}`, "aria-pressed": String(picked === p.id), style: `--i:${i}` }), p.right);
        c.addEventListener("click", () => {
          picked = picked === p.id ? "" : p.id;
          if (picked) talk(ctx.t("pickedUp", { item: plainText(p.right) }));
          repaint(root, paint, `c:${p.id}`);
        });
        lane.append(c);
      });
      docks.replaceChildren();
      for (const p of q.pairs) {
        const done = Boolean(placed[p.id]);
        const body = done
          ? h("div", { class: "sp-dock is-filled" }, glyph("check", 18), rt("span", "sp-dock-left", p.left), h("span", { class: "sp-dock-eq", "aria-hidden": "true" }, "="), rt("span", "sp-dock-right", p.right))
          : h("button", { type: "button", class: "sp-dock", "data-key": `d:${p.id}`, "aria-label": `${plainText(p.left)}: ${ctx.t("slotEmpty")}` }, rt("span", "sp-dock-left", p.left), h("span", { class: "sp-slot-hint" }, picked ? ctx.t("placeHere") : ctx.t("slotEmpty")));
        if (!done) body.addEventListener("click", () => tryPlace(p));
        docks.append(h("li", null, body));
      }
    }

    function tryPlace(p) {
      if (!picked) return talk(ctx.t("pickFirstShort"));
      const res = checkResponse(q, { ...placed, [p.id]: picked });
      if (res.wrong.includes(p.id)) {
        mistakes += 1;
        talk(`${ctx.t("noFit", { where: plainText(p.left) })}${q.misconception && !told ? ` ${q.misconception}` : ""}`);
        told = true;
        picked = "";
        repaint(root, paint, `d:${p.id}`);
        return;
      }
      placed[p.id] = picked;
      picked = "";
      talk(ctx.t("fits", { left: plainText(p.left), right: plainText(p.right) }));
      repaint(root, paint);
      if (Object.keys(placed).length === q.pairs.length) complete();
      else (docks.querySelector("button") || lane.querySelector("button"))?.focus();
    }

    function complete() {
      if (mistakes) ctx.session.attempt(q, "partial");
      ctx.session.attempt(q, "correct");
      ctx.session.finish(q);
      lane.replaceChildren();
      const last = st.round === rounds.length - 1;
      const go = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg(last ? "finish" : "nextRound"), glyph("arrow", 18));
      go.addEventListener("click", next);
      root.append(
        h("div", { class: "sp-feedback is-right" }, h("p", { class: "sp-fb-title" }, glyph("star", 18), ctx.t("roundDone")), q.explanation ? rt("p", "sp-explain", q.explanation) : null),
        h("div", { class: "sp-next-row" }, go),
      );
      hint.hidden = true;
      go.focus();
      talk(ctx.t("roundDone"));
    }

    hint.addEventListener("click", () => {
      ctx.session.hint(q);
      talk(`${ctx.t("hintLabel")} ${q.hint}`);
    });
    paint();
    ctx.focus(head.querySelector("h2"));
  }

  play();
  return {};
}
