// language-detective: the claim stage. Choose a claim, attach proof from the case notes, explain, revise.
import { h } from "../core/dom.js";
import {
  checkClaimEvidence,
  checksPass,
  defaultClaimHints,
  runRevisionChecks,
} from "./language-detective-model.js";
import { speakBtn } from "./st1-ui.js";

export function runClaim(env) {
  const { ctx, activity, work, notes } = env;
  const claim = activity.claim;
  const hints = claim.hints || defaultClaimHints();
  let hintsUsed = 0;
  const loopC = ctx.loop({
    id: "claim",
    misconceptions: claim.options.map((o) => ({ pick: o.id, tag: o.tag, hint: o.hint })),
    model: claim.why,
    right: claim.why,
  });
  const loopE = ctx.loop({ id: "claim.proof", model: claim.why });
  const combo = {
    record() {
      const a = loopC.record();
      const p = loopE.record();
      return {
        id: "claim",
        tries: a.tries + p.tries,
        hints: hintsUsed,
        ok: a.ok && p.ok,
        tags: [...new Set([...a.tags, ...p.tags])],
      };
    },
  };

  const fb = ctx.feedback();
  const host = h("div", { class: "st-ld-phase" });
  const actions = h("div", { class: "st-row" });
  const hintBtn = h(
    "button",
    { type: "button", class: "st-btn", onclick: () => hint() },
    "Give me a hint",
  );
  const heading = (step, title) => [
    h("p", { class: "st-ld-step" }, step),
    h("h2", { class: "st-ld-q", tabindex: "-1" }, title),
  ];

  work.textContent = "";
  work.append(h("div", { class: "st-ld-claimhead" }), host, fb.el, actions);

  function hint() {
    const text = hints[Math.min(hintsUsed, hints.length - 1)];
    hintsUsed += 1;
    fb.show("hint", text);
    ctx.announce(text);
  }

  function reset(stepNo, title, spoken) {
    const head = work.querySelector(".st-ld-claimhead");
    head.textContent = "";
    head.append(
      ...heading(`Claim step ${stepNo} of 3`, title),
      h("div", { class: "st-row" }, speakBtn(ctx, spoken || title, { label: "Hear it" })),
    );
    host.textContent = "";
    actions.textContent = "";
    fb.hide();
    head.querySelector("h2").focus();
  }

  function miss(r, text) {
    fb.show(r.kind === "model" ? "model" : "retry", r.kind === "model" ? r.text : text || r.text);
    ctx.announce(r.kind === "model" ? r.text : text || r.text);
  }

  function choose() {
    reset(1, activity.claimPrompt);
    const group = h("div", { class: "st-ld-options", role: "group", "aria-label": "Claims" });
    for (const o of claim.options)
      group.append(
        h(
          "button",
          {
            type: "button",
            class: "st-btn st-ld-option",
            "data-opt": o.id,
            onclick: () => pick(o),
          },
          o.text,
        ),
      );
    host.append(
      h(
        "p",
        { class: "st-ld-instruction" },
        "Read your case notes. Choose the claim your notes support.",
      ),
      group,
    );
    actions.append(hintBtn);
    function pick(o) {
      const r = loopC.submit({ ok: !!o.strong, pick: o.id });
      if (r.ok) {
        fb.show("right", claim.why);
        ctx.announce("That claim is supported.");
        return attach();
      }
      miss(r, o.hint ? r.text : "Your notes do not support that claim yet. Check them again.");
      if (r.kind === "model")
        group
          .querySelector(`[data-opt="${claim.options.find((x) => x.strong).id}"]`)
          ?.classList.add("st-pulse");
    }
  }

  function attach() {
    const units = notes.units();
    reset(
      2,
      "Attach your proof",
      "Attach your proof. Choose the case notes that prove your claim.",
    );
    const form = h(
      "fieldset",
      { class: "st-ld-attach" },
      h("legend", {}, `Choose at least ${claim.evidenceMin} notes that prove your claim.`),
    );
    for (const u of units) {
      form.append(
        h(
          "label",
          { class: "st-ld-check" },
          h("input", { type: "checkbox", value: u.id, "data-unit": u.id }),
          h("span", {}, u.text),
        ),
      );
    }
    host.append(form);
    const check = h(
      "button",
      { type: "button", class: "st-btn st-primary", onclick: () => verify() },
      "Check my proof",
    );
    actions.append(check, hintBtn);
    function verify() {
      const chosen = [...form.querySelectorAll("input:checked")].map((i) => i.value);
      if (!chosen.length) return fb.show("hint", "Choose at least one note first.");
      const res = checkClaimEvidence(claim, chosen);
      const r = loopE.submit({
        ok: res.ok,
        tag: res.bad.length ? "unrelated-evidence" : "too-little-evidence",
      });
      if (r.ok) {
        ctx.settle(combo);
        fb.show("right", "Your proof backs up your claim.");
        return explain(chosen.map((id) => units.find((u) => u.id === id).text));
      }
      const text = res.bad.length
        ? "At least one note you chose is true but does not prove this claim. Check each note against your claim."
        : `Your claim needs more proof. Choose at least ${claim.evidenceMin} notes.`;
      miss(r, text);
    }
  }

  function explain(attachedTexts) {
    reset(3, claim.explainPrompt, claim.explainPrompt);
    const frames = () => activity.explainFrames[ctx.tier] || [];
    const frameHost = h("div", { class: "st-ld-frames" });
    const paintFrames = () => {
      frameHost.textContent = "";
      if (frames().length)
        frameHost.append(
          h("p", {}, h("strong", {}, "Sentence starters:")),
          h(
            "ul",
            { class: "st-frames" },
            frames().map((f) => h("li", {}, f)),
          ),
        );
    };
    paintFrames();
    ctx.onTier(paintFrames);
    const evidenceBox = h(
      "ul",
      { class: "st-ld-evidence" },
      attachedTexts.map((t) => h("li", {}, t)),
    );
    const ta = h("textarea", {
      class: "st-textarea",
      rows: "5",
      maxlength: "700",
      "aria-label": claim.explainPrompt,
    });
    const list = h("ul", { class: "st-ld-checks", "aria-label": "Writing checklist" });
    const ticked = new Set();
    let attempts = 0;
    host.append(h("p", {}, h("strong", {}, "Your proof:")), evidenceBox, frameHost, ta, list);
    const check = h(
      "button",
      { type: "button", class: "st-btn st-primary", onclick: () => run() },
      "Check my writing",
    );
    const done = h(
      "button",
      { type: "button", class: "st-btn st-primary", hidden: true, onclick: () => finish() },
      "Finish my explanation",
    );
    const keep = h(
      "button",
      { type: "button", class: "st-btn", hidden: true, onclick: () => finish() },
      "Keep my writing and finish",
    );
    actions.append(check, done, keep);

    function render(results) {
      list.textContent = "";
      for (const r of results) {
        const li = h("li", { class: "st-ld-check-item", "data-ok": String(r.ok) });
        if (r.self) {
          const box = h("input", {
            type: "checkbox",
            id: `chk-${r.id}`,
            checked: r.ok ? "checked" : undefined,
          });
          box.addEventListener("change", () => {
            if (box.checked) ticked.add(r.id);
            else ticked.delete(r.id);
            render(runRevisionChecks(claim.revisionChecks, ta.value, attachedTexts, ticked));
            sync();
          });
          li.append(box, h("label", { for: `chk-${r.id}` }, r.label));
        } else
          li.append(h("span", { class: "st-ld-status" }, r.ok ? "Done: " : "Not yet: "), r.label);
        list.append(li);
      }
    }
    const current = () => runRevisionChecks(claim.revisionChecks, ta.value, attachedTexts, ticked);
    function sync() {
      const pass = checksPass(current());
      done.hidden = !pass;
      keep.hidden = pass || attempts < 2;
    }
    function run() {
      if (ta.value.trim().split(/\s+/).filter(Boolean).length < 3)
        return fb.show("hint", "Write a few words first, then check.");
      attempts += 1;
      const results = current();
      render(results);
      sync();
      const pass = checksPass(results);
      if (pass)
        fb.show("right", "Your writing meets the checklist. Read it aloud once, then finish.");
      else
        fb.show(
          "hint",
          attempts === 1
            ? "Look at the checklist. Revise your writing, then check again."
            : "Revise once more, or keep your writing if you are happy with it.",
        );
      ctx.announce(pass ? "Checklist complete." : "Some checks are not done yet.");
      check.textContent = "Check again";
      (pass ? done : ta).focus();
    }
    function finish() {
      const results = current();
      ctx.items.set("explain", {
        id: "explain",
        tries: attempts,
        hints: 0,
        ok: checksPass(results),
        tags: results.filter((r) => !r.ok).map((r) => r.id),
      });
      env.tick();
      env.persist();
      env.reflect();
    }
  }

  choose();
}
