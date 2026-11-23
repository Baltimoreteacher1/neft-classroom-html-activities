// argument-builder steps 4-7: reasoning, counterclaim, assemble and revise, finish (copy, download, print, reflect).
import { h } from "../../core/dom.js";
import { write } from "../../core/store.js";
import { reflectionBlock } from "../engine-core.js";
import { btn } from "../e4-kit.js";
import {
  assembleText,
  cardOf,
  checkCounter,
  checkReasoning,
  counterMode,
  evaluateChecks,
  labelsFor,
  sourceOf,
  strengthenList,
} from "./argument-logic.js";

const heading = (t) => h("h2", { class: "st-arg-h", "data-focus": "" }, t);
const nextAfterReasoning = (env) =>
  counterMode(env.activity, env.ctx.tier) === "none" ? "assemble" : "counter";

/** Step 4. One frame builder per chosen card. The check looks for connecting language and ideas; the learner judges sense. */
export function reasoningStep(env) {
  const { ctx, activity: a, st } = env;
  const L = labelsFor(a);
  const tier = ctx.tier;
  const frames = a.reasoningFrames[tier] || [];
  const loop = env.loopFor("reasoning", {
    hints: a.hints.reasoning,
    model: `${a.model.strong.why} ${a.model.tip}`,
  });
  st.reasoning = st.reasoning || {};
  st.reasoningOk = st.reasoningOk || {};
  const fb = ctx.feedback();
  const head = heading(`Explain why: ${L.reasoning.toLowerCase()}`);
  const blocks = st.evidenceIds.map((id, n) => {
    const card = cardOf(a, id);
    st.reasoning[id] = st.reasoning[id] || { text: "", frame: "" };
    const ta = h("textarea", {
      class: "st-textarea st-arg-write",
      rows: "3",
      maxlength: "500",
      "aria-label": `${L.reasoning} ${n + 1}: explain how this card backs your ${L.claim.toLowerCase()}`,
    });
    ta.value = st.reasoning[id].text;
    ta.addEventListener("input", () => {
      st.reasoning[id].text = ta.value;
      st.reasoningOk[id] = false;
      env.save();
    });
    const msg = h("ul", { class: "st-arg-problems", role: "status", "aria-live": "polite" });
    const frameBtns = frames.map((f, k) =>
      h(
        "li",
        {},
        btn(
          f,
          "st-chip",
          () => {
            st.reasoning[id].frame = f;
            ta.value = f;
            st.reasoning[id].text = f;
            st.reasoningOk[id] = false;
            ta.focus();
            ctx.announce("Frame added. Replace each blank with your own words.");
            env.save();
          },
          { "aria-label": `Use this frame: ${f}` },
        ),
      ),
    );
    const own = btn("Write my own sentence", "st-btn-quiet", () => {
      st.reasoning[id].frame = "";
      ta.value = "";
      st.reasoning[id].text = "";
      ta.focus();
      env.save();
    });
    const block = h(
      "li",
      { class: "st-arg-reason" },
      h("h3", {}, `${L.evidence} ${n + 1}`),
      h("p", { class: "st-arg-cardsrc" }, sourceOf(a, card.sourceId).title),
      h("blockquote", {}, card.text),
      frames.length
        ? h(
            "ul",
            { class: "st-arg-frames", "aria-label": "Sentence frames, choose one to start" },
            frameBtns,
          )
        : h(
            "p",
            { class: "st-note" },
            "Write your own sentence. Say why this evidence proves your point.",
          ),
      ta,
      frames.length ? own : null,
      msg,
    );
    block.dataset.id = id;
    return { id, ta, msg, block };
  });
  const check = btn("Check my reasoning", "primary", () => {
    let all = true;
    let firstTag = "";
    for (const b of blocks) {
      const card = cardOf(a, b.id);
      const res = checkReasoning(b.ta.value, {
        claimText: env.claim().text,
        cardText: card.text,
        frame: st.reasoning[b.id].frame || "",
        linkWords: a.linkWords || [],
      });
      st.reasoning[b.id].text = b.ta.value;
      st.reasoningOk[b.id] = res.ok;
      b.msg.replaceChildren(
        ...(res.ok
          ? [h("li", { class: "st-arg-ok" }, "This reasoning works.")]
          : res.problems.map((p) => h("li", {}, p))),
      );
      if (!res.ok) {
        all = false;
        firstTag = firstTag || res.tag;
      }
    }
    const r = loop.submit({ ok: all, tag: firstTag });
    env.settle("reasoning");
    if (all) {
      st.reasoningDone = true;
      fb.show(
        "right",
        "Each card has reasoning that explains why. This check looks for connecting words and ideas. You decide whether it makes sense.",
      );
      ctx.announce("Reasoning accepted.");
      next.hidden = false;
      next.focus();
    } else {
      const lead = "Some reasoning is not finished yet. Read the notes under each box.";
      fb.show(
        r.kind === "model" ? "model" : "retry",
        r.kind === "model" ? `${lead} ${r.text}` : lead,
      );
      ctx.announce(lead);
    }
    env.save();
  });
  const hint = btn("Hint", "", () => {
    const t = loop.nextHint();
    if (t) (fb.show("hint", t), ctx.announce(`Hint. ${t}`));
    env.settle("reasoning");
    env.save();
  });
  const next = btn(
    nextAfterReasoning(env) === "counter"
      ? `Go to ${labelsFor(a).counter.toLowerCase()}`
      : "Assemble my argument",
    "primary",
    () => env.go(nextAfterReasoning(env)),
  );
  next.hidden = !st.reasoningDone || !st.evidenceIds.every((id) => st.reasoningOk[id]);
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": "Reasoning" },
    head,
    h("p", { class: "st-arg-q" }, h("strong", {}, `${L.claim}: `), env.claim().text),
    env.supportEl(),
    h(
      "p",
      { class: "st-note" },
      "The check looks for connecting language and ideas from your claim or evidence. You are the one who decides whether it makes sense.",
    ),
    h(
      "ol",
      { class: "st-arg-reasons" },
      blocks.map((b) => b.block),
    ),
    fb.el,
    h(
      "div",
      { class: "st-arg-actions" },
      check,
      hint,
      next,
      btn("Back to the evidence", "st-btn-quiet", () => env.go("evidence")),
    ),
  );
  return { el, focus: () => head.focus() };
}

/** Step 5. Only for tiers that show it: acknowledge another view, then rebut it. */
export function counterStep(env) {
  const { ctx, activity: a, st } = env;
  const L = labelsFor(a);
  const tier = ctx.tier;
  const mode = counterMode(a, tier);
  const loop = env.loopFor("counter", { hints: [], model: "" });
  st.counter = st.counter || { acknowledge: "", rebut: "" };
  const fb = ctx.feedback();
  const head = heading(L.counter);
  const mk = (key, label) => {
    const ta = h("textarea", {
      class: "st-textarea st-arg-write",
      rows: "3",
      maxlength: "400",
      "aria-label": label,
    });
    ta.value = st.counter[key];
    ta.addEventListener("input", () => {
      st.counter[key] = ta.value;
      st.counterOk = false;
      env.save();
    });
    const fr = (a.counter?.frames?.[key]?.[tier] || []).map((f) =>
      h(
        "li",
        {},
        btn(
          f,
          "st-chip",
          () => {
            ta.value = f;
            st.counter[key] = f;
            ta.focus();
            env.save();
          },
          { "aria-label": `Use this frame: ${f}` },
        ),
      ),
    );
    return {
      ta,
      el: h(
        "div",
        { class: "st-arg-counterfield" },
        h("label", { class: "st-arg-lab" }, label, ta),
        fr.length
          ? h("ul", { class: "st-arg-frames", "aria-label": `Frames for ${label}` }, fr)
          : null,
      ),
    };
  };
  const ack = mk("acknowledge", "Acknowledge the other view");
  const reb = mk("rebut", "Answer it with a reason");
  const msg = h("ul", { class: "st-arg-problems", role: "status", "aria-live": "polite" });
  const check = btn("Check this step", "primary", () => {
    st.counter.acknowledge = ack.ta.value;
    st.counter.rebut = reb.ta.value;
    const res = checkCounter(st.counter, a.linkWords || []);
    const r = loop.submit({ ok: res.ok, tag: res.tag });
    env.settle("counter");
    st.counterOk = res.ok;
    msg.replaceChildren(
      ...(res.ok
        ? [h("li", { class: "st-arg-ok" }, "You acknowledged another view and answered it.")]
        : res.problems.map((p) => h("li", {}, p))),
    );
    fb.show(
      res.ok ? "right" : r.kind === "model" ? "model" : "retry",
      res.ok ? "This step works." : "Not finished yet. Read the notes.",
    );
    ctx.announce(res.ok ? "This step works." : "Not finished yet.");
    if (res.ok) {
      next.hidden = false;
      next.focus();
    }
    env.save();
  });
  const next = btn("Assemble my argument", "primary", () => env.go("assemble"));
  next.hidden = !st.counterOk;
  const skip =
    mode === "optional"
      ? btn(
          "Skip this challenge",
          "st-btn-quiet",
          () => ((st.counterSkipped = true), env.go("assemble")),
        )
      : null;
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": L.counter },
    head,
    env.supportEl(),
    mode === "optional"
      ? h("p", { class: "st-note" }, "This step is a challenge at your level. You can skip it.")
      : null,
    h("p", { class: "st-prompt" }, h("strong", {}, `${L.counter}: `), a.counterclaims[st.claimId]),
    ack.el,
    reb.el,
    msg,
    fb.el,
    h(
      "div",
      { class: "st-arg-actions" },
      check,
      next,
      skip,
      btn("Back", "st-btn-quiet", () => env.go("reasoning")),
    ),
  );
  return { el, focus: () => head.focus() };
}

/** Step 6. The argument as text, the revision checklist (auto and self-check), "Strengthen it", second draft or finish. */
export function assembleStep(env) {
  const { ctx, activity: a, st } = env;
  const tier = ctx.tier;
  st.selfChecks = st.selfChecks || {};
  st.view = st.view || "labeled";
  const head = heading(`Assemble and revise: draft ${st.draft}`);
  const out = h("pre", { class: "st-arg-output", tabindex: "0", "aria-label": "Your argument" });
  const rows = h("ul", { class: "st-arg-checks" });
  const strengthen = h("div", { class: "st-arg-strengthen" });
  const views = ["labeled", "paragraph"].map((v) =>
    btn(
      v === "labeled" ? "Labeled parts" : "Paragraph",
      "",
      () => {
        st.view = v;
        paint();
      },
      { "aria-pressed": String(st.view === v) },
    ),
  );
  function state() {
    return { ...st, selfChecks: st.selfChecks };
  }
  function paint() {
    out.textContent = assembleText(a, state(), st.view);
    views.forEach((b, i) =>
      b.setAttribute("aria-pressed", String(["labeled", "paragraph"][i] === st.view)),
    );
    const res = evaluateChecks(a, state(), tier);
    rows.replaceChildren(
      ...res.map((r) =>
        h(
          "li",
          { class: "st-arg-check", "data-met": String(r.met) },
          r.known
            ? h("span", { class: "st-arg-checklabel" }, r.label)
            : h(
                "label",
                { class: "st-arg-checklabel" },
                h("input", {
                  type: "checkbox",
                  checked: !!st.selfChecks[r.id],
                  onchange: (e) => {
                    st.selfChecks[r.id] = e.target.checked;
                    env.save();
                    paint();
                  },
                }),
                ` ${r.label}`,
              ),
          h("strong", { class: "st-arg-checkstate" }, r.met ? "Met" : "Look again"),
          r.challenge ? h("span", { class: "st-note" }, " (challenge)") : null,
          h("span", { class: "st-note" }, ` ${r.reason}`),
        ),
      ),
    );
    const list = strengthenList(a, state(), tier);
    strengthen.replaceChildren(
      h("h3", {}, "Strengthen it"),
      list.length
        ? h(
            "ul",
            {},
            list.map((t) => h("li", {}, t)),
          )
        : h(
            "p",
            {},
            "Every check is met. Read your argument aloud once more, then finish when you are ready.",
          ),
    );
    env.settleRevision(res);
  }
  paint();
  const revise = btn(`Revise (draft ${st.draft + 1})`, "", () => {
    st.draft += 1;
    st.evidenceDone = false;
    st.reasoningDone = false;
    env.settleRevision();
    ctx.announce(
      `Draft ${st.draft}. Your choices are kept. Change what you want, then check again.`,
    );
    env.go("evidence");
  });
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": "Assemble and revise" },
    head,
    env.supportEl(),
    h("div", { class: "st-arg-actions" }, views),
    out,
    h("h3", {}, "Revision checklist"),
    rows,
    strengthen,
    h(
      "div",
      { class: "st-arg-actions" },
      revise,
      btn("Finish", "primary", () => env.go("output")),
      btn("Back", "st-btn-quiet", () =>
        env.go(counterMode(a, tier) === "none" ? "reasoning" : "counter"),
      ),
    ),
  );
  return { el, focus: () => head.focus() };
}

/** Step 7. Copy, download, print; saved on this device only; reflection ends the activity. */
export function outputStep(env) {
  const { ctx, activity: a, st } = env;
  const text = assembleText(a, { ...st }, st.view || "labeled");
  write(`out.${env.aid}`, { draft: st.draft, text, t: new Date().toISOString() });
  const head = heading("Your argument");
  const area = h("textarea", {
    class: "st-textarea st-arg-final",
    readonly: true,
    rows: "12",
    "aria-label": "Your finished argument",
  });
  area.value = text;
  const status = h("p", { class: "st-note", role: "status", "aria-live": "polite" });
  const copy = btn("Copy", "primary", async () => {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied.";
    } catch {
      area.focus();
      area.select();
      status.textContent = "Press Control+C (or Command+C) to copy the selected text.";
    }
  });
  const download = btn("Download as text", "", () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = h("a", { href: url, download: `${env.aid}-argument.txt` });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Downloaded to this device.";
  });
  const block = reflectionBlock(ctx, a.reflection);
  const el = h(
    "section",
    { class: "st-arg-card", "aria-label": "Finish" },
    head,
    h(
      "p",
      { class: "st-note" },
      "Your argument is saved on this device only. It has no name in it and it is not part of your results code.",
    ),
    h("div", { class: "st-arg-print" }, h("h3", { class: "st-arg-printtitle" }, a.title), area, h("pre", { class: "st-arg-printpre" }, text)),
    h(
      "div",
      { class: "st-arg-actions" },
      copy,
      download,
      btn("Print", "", () => window.print()),
    ),
    status,
    block.el,
    h(
      "div",
      { class: "st-arg-actions" },
      btn("Save and finish", "primary", () => env.finish(block.value())),
      btn("Back to my draft", "st-btn-quiet", () => env.go("assemble")),
    ),
  );
  return { el, focus: () => head.focus() };
}
