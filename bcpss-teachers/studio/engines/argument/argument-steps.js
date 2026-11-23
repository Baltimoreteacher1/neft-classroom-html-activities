// argument-builder steps 1-3: read the sources, choose a claim, choose evidence.
import { h, shuffle } from "../../core/dom.js";
import { btn, choiceGroup, visualEl } from "../e4-kit.js";
import {
  CLASS_TEXT,
  checkClaim,
  checkEvidence,
  labelsFor,
  maxEvidence,
  minEvidence,
  sourceOf,
} from "./argument-logic.js";

const heading = (t) => h("h2", { class: "st-arg-h", "data-focus": "" }, t);

/** The worked parallel example, on a different topic. Shown on the third wrong try. */
export function modelBlock(a) {
  const m = a.model;
  return h(
    "div",
    { class: "st-arg-model" },
    h("h3", {}, "A worked example on a different question"),
    h("p", {}, h("strong", {}, "Question: "), m.question),
    h("p", {}, h("strong", {}, "Claim: "), m.claim),
    h("p", {}, h("strong", {}, "A strong version: "), `"${m.strong.text}" `, m.strong.why),
    h("p", {}, h("strong", {}, "A weak version: "), `"${m.weak.text}" `, m.weak.why),
    h("p", { class: "st-note" }, m.tip),
  );
}

/** Step 1. Question and sources, with read-aloud and the text as transcript. */
export function sourcesStep(env) {
  const { ctx, activity: a } = env;
  const head = heading("Read the question and the sources");
  const cards = a.sources.map((s) =>
    h(
      "li",
      { class: "st-arg-source" },
      h("h3", {}, s.title),
      h("p", { class: "st-note" }, s.byline),
      s.text ? h("p", {}, s.text) : null,
      s.visual ? visualEl(s.visual) : null,
      s.note ? h("p", { class: "st-note" }, s.note) : null,
      s.text
        ? btn("Listen", "st-btn-quiet", () => ctx.speak(`${s.title}. ${s.text}`), {
            "aria-label": `Listen to ${s.title}`,
          })
        : null,
    ),
  );
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": "Question and sources" },
    head,
    h("p", { class: "st-arg-q" }, h("strong", {}, "Question: "), a.question),
    h("p", { class: "st-intro" }, a.intro),
    env.supportEl(),
    h("ol", { class: "st-arg-sources" }, cards),
    h(
      "div",
      { class: "st-arg-actions" },
      btn("Listen to the question", "st-btn-quiet", () => ctx.speak(a.question)),
      btn("I have read the sources", "primary", () => env.go("claim")),
    ),
  );
  return { el, focus: () => head.focus() };
}

/** Step 2. A weak claim shows why it is weak, then the hint ladder; the third miss shows the model. */
export function claimStep(env) {
  const { ctx, activity: a, st } = env;
  const L = labelsFor(a);
  const order = shuffle(a.claims, `${env.aid}:claims`);
  const modelText = `${a.model.claim} ${a.model.strong.why}`;
  const loop = env.loopFor("claim", {
    hints: a.hints.claim,
    model: modelText,
    misconceptions: a.claims
      .filter((c) => !c.strong)
      .map((c) => ({ pick: c.id, tag: `weak-claim-${c.id}`, hint: c.why, model: c.why })),
  });
  const fb = ctx.feedback();
  const modelHost = h("div");
  const head = heading(`Choose your ${L.claim.toLowerCase()}`);
  const group = choiceGroup({
    legend: `Which ${L.claim.toLowerCase()} answers the question?`,
    options: order.map((c) => c.text),
    onChange: () => (check.disabled = false),
  });
  const done = !!st.claimDone;
  const check = btn(`Check my ${L.claim.toLowerCase()}`, "primary", onCheck);
  check.disabled = true;
  const hint = btn("Hint", "", () => {
    const t = loop.nextHint();
    if (t) (fb.show("hint", t), ctx.announce(`Hint. ${t}`));
    env.settle("claim");
    env.save();
  });
  const next = btn("Choose evidence", "primary", () => env.go("evidence"));
  function onCheck() {
    const i = group.value();
    const claim = order[i];
    const res = checkClaim(a, claim.id);
    if (res.ok) {
      if (st.claimId !== claim.id) env.resetFrom("claim");
      st.claimId = claim.id;
      st.claimDone = true;
      loop.submit({ ok: true });
      env.settle("claim");
      fb.show("right", claim.why);
      ctx.announce(`Strong ${L.claim.toLowerCase()}. ${claim.why}`);
      group.lock(true);
      check.hidden = hint.hidden = true;
      next.hidden = false;
      next.focus();
      env.save();
      return;
    }
    const r = loop.submit({ ok: false, pick: claim.id, tag: `weak-claim-${claim.id}` });
    env.settle("claim");
    group.mark(i, "Not strong yet");
    group.reset();
    check.disabled = true;
    const nextHint = r.kind === "model" ? "" : ` Hint: ${a.hints.claim[Math.min(r.tries - 1, 2)]}`;
    fb.show(r.kind === "model" ? "model" : "retry", `${claim.why}${nextHint}`);
    ctx.announce(claim.why);
    if (r.kind === "model") modelHost.replaceChildren(modelBlock(a));
    env.save();
  }
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": "Claim" },
    head,
    h("p", { class: "st-arg-q" }, h("strong", {}, "Question: "), a.question),
    env.supportEl(),
    group.el,
    fb.el,
    modelHost,
    h(
      "div",
      { class: "st-arg-actions" },
      check,
      hint,
      next,
      btn("Back to the sources", "st-btn-quiet", () => env.go("sources")),
    ),
  );
  next.hidden = !done;
  if (done) {
    group.set(order.findIndex((c) => c.id === st.claimId));
    group.lock(true);
    check.hidden = hint.hidden = true;
    fb.show("right", env.claim().why);
  }
  return { el, focus: () => head.focus() };
}

/** Step 3. Choose cards; every chosen card gets its own feedback; passing needs enough strong cards and no blockers. */
export function evidenceStep(env) {
  const { ctx, activity: a, st } = env;
  const L = labelsFor(a);
  const min = minEvidence(a);
  const max = maxEvidence(a);
  const loop = env.loopFor("evidence", {
    hints: a.hints.evidence,
    model: `${a.model.strong.why} ${a.model.tip}`,
  });
  const picked = new Set(st.evidenceIds || []);
  const fb = ctx.feedback();
  const modelHost = h("div");
  const head = heading(`Choose your ${L.evidence.toLowerCase()}`);
  const status = h("p", { class: "st-arg-count", role: "status", "aria-live": "polite" });
  const cardEls = new Map();
  const results = h("ul", { class: "st-arg-results", "aria-label": "Feedback on your cards" });
  const paint = () => {
    status.textContent = `${picked.size} chosen. Choose ${min} to ${max}.`;
  };
  const order = shuffle(a.evidence, `${env.aid}:cards`);
  const list = h(
    "ul",
    { class: "st-arg-cards" },
    order.map((c) => {
      const b = btn(picked.has(c.id) ? "Chosen" : "Choose this card", "", () => toggle(c.id, b), {
        "aria-pressed": String(picked.has(c.id)),
        "aria-label": `${picked.has(c.id) ? "Chosen" : "Choose"}: ${c.text}`,
      });
      const li = h(
        "li",
        { class: "st-arg-cardopt", "data-picked": String(picked.has(c.id)) },
        h("p", { class: "st-arg-cardsrc" }, sourceOf(a, c.sourceId).title),
        h("p", {}, c.text),
        b,
      );
      cardEls.set(c.id, { li, b });
      return li;
    }),
  );
  function toggle(id, b) {
    if (st.evidenceDone) return;
    picked.has(id) ? picked.delete(id) : picked.add(id);
    const on = picked.has(id);
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? "Chosen" : "Choose this card";
    b.setAttribute(
      "aria-label",
      `${on ? "Chosen" : "Choose"}: ${a.evidence.find((x) => x.id === id).text}`,
    );
    cardEls.get(id).li.dataset.picked = String(on);
    st.evidenceIds = [...picked];
    results.replaceChildren();
    fb.hide();
    paint();
    env.save();
  }
  function showCards(res) {
    results.replaceChildren(
      ...res.cards.map((c) =>
        h(
          "li",
          { class: "st-arg-result", "data-class": c.cls },
          h("strong", {}, `${CLASS_TEXT[c.cls]} `),
          h("span", { class: "st-arg-cardsrc" }, `(${sourceOf(a, c.card.sourceId).title}) `),
          c.card.feedback,
        ),
      ),
    );
  }
  const check = btn(`Check my ${L.evidence.toLowerCase()}`, "primary", () => {
    st.evidenceIds = [...picked];
    const res = checkEvidence(a, st.claimId, st.evidenceIds);
    if (!res.complete) return (fb.show("hint", res.message), ctx.announce(res.message));
    const r = loop.submit({ ok: res.ok, tag: res.tag });
    env.settle("evidence");
    showCards(res);
    if (res.ok) {
      st.evidenceDone = true;
      fb.show(
        "right",
        `You have ${res.strong} strong ${res.strong === 1 ? "card" : "cards"} that back your ${L.claim.toLowerCase()}.`,
      );
      ctx.announce("Your evidence works.");
      check.hidden = hint.hidden = true;
      next.hidden = false;
      next.focus();
    } else {
      const lead = res.blockers.length
        ? "One or more cards do not belong with this claim. Read the notes below."
        : `You need at least ${min} strong cards. Read the notes below.`;
      fb.show(
        r.kind === "model" ? "model" : "retry",
        r.kind === "model" ? `${lead} ${r.text}` : lead,
      );
      ctx.announce(lead);
      if (r.kind === "model") modelHost.replaceChildren(modelBlock(a));
    }
    env.save();
  });
  const hint = btn("Hint", "", () => {
    const t = loop.nextHint();
    if (t) (fb.show("hint", t), ctx.announce(`Hint. ${t}`));
    env.settle("evidence");
    env.save();
  });
  const next = btn("Write my reasoning", "primary", () => env.go("reasoning"));
  next.hidden = !st.evidenceDone;
  paint();
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": "Evidence" },
    head,
    h("p", { class: "st-arg-q" }, h("strong", {}, `${L.claim}: `), env.claim().text),
    env.supportEl(),
    h(
      "p",
      { class: "st-prompt" },
      `Choose the cards that back up your ${L.claim.toLowerCase()}. Some cards are weak, some are about something else.`,
    ),
    list,
    status,
    fb.el,
    results,
    modelHost,
    h(
      "div",
      { class: "st-arg-actions" },
      check,
      hint,
      next,
      st.evidenceDone ? null : btn("Back", "st-btn-quiet", () => env.go("claim")),
    ),
  );
  if (st.evidenceDone) {
    check.hidden = hint.hidden = true;
    showCards(checkEvidence(a, st.claimId, st.evidenceIds));
    for (const { b } of cardEls.values()) b.disabled = true;
  }
  return { el, focus: () => head.focus() };
}
