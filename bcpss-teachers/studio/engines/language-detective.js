// language-detective engine: investigate a scene, collect proof as case notes, then build and explain a claim.
// Contract: engines/language-detective.schema.md
import { h } from "../core/dom.js";
import { loadCss } from "./engine-core.js";
import { runClaim } from "./language-detective-claim.js";
import { TYPE_LABEL, evidenceNudge, evidenceSub, phasesOf } from "./language-detective-model.js";
import { createScene } from "./language-detective-scene.js";
import { reflectionStep, speakBtn, stage, transferCard } from "./st1-ui.js";

const STATE_V = 1;

function createNotes() {
  const list = h("ol", { class: "st-ld-notes-list" });
  const empty = h("p", { class: "st-ld-empty" }, "Your proof will be saved here as you find it.");
  const el = h(
    "details",
    { class: "st-card st-ld-notes", open: true },
    h("summary", {}, h("strong", {}, "Case notes")),
    empty,
    list,
  );
  const entries = [];
  const paint = () => {
    list.textContent = "";
    empty.hidden = entries.length > 0;
    for (const n of entries)
      list.append(
        h(
          "li",
          { value: n.no },
          h("span", { class: "st-ld-note-q" }, n.prompt),
          n.answer
            ? h("span", { class: "st-ld-note-a" }, h("strong", {}, "Answer: "), n.answer)
            : null,
          ...n.units.map((u) =>
            h("span", { class: "st-ld-note-u" }, h("strong", {}, "Proof: "), u.text),
          ),
        ),
      );
  };
  return {
    el,
    entries,
    add(entry) {
      entries.push(entry);
      paint();
    },
    units: () => [...new Map(entries.flatMap((e) => e.units).map((u) => [u.id, u])).values()],
    paint,
  };
}

export default {
  id: "language-detective",
  async mount(ctx) {
    loadCss("engines-base.css");
    loadCss("language-detective.css");
    const { activity } = ctx;
    const qs = activity.questions;
    const total = qs.length + 2;
    const saved = ctx.resume()?.state;
    const resumable =
      saved?.v === STATE_V && saved.aid === activity.id && saved.qi > 0 && saved.qi <= qs.length;
    const ui = stage(ctx, { engine: "language-detective", total, noun: "steps done" });
    const notes = createNotes();
    const tick = () => ui.progress.set(ctx.items.size, `${ctx.items.size} of ${total} steps done`);
    const persist = (qi) =>
      ctx.save({
        v: STATE_V,
        aid: activity.id,
        qi,
        notes: notes.entries,
        items: [...ctx.items.values()],
      });

    const layout = h("div", { class: "st-ld-layout" });
    const work = h("div", { class: "st-ld-work", "aria-live": "off" });
    let scene;

    function intro() {
      ui.body.textContent = "";
      const card = h(
        "div",
        { class: "st-card" },
        h("h2", {}, activity.title),
        h("p", { class: "st-intro" }, activity.intro),
        h(
          "p",
          {},
          `You will answer ${qs.length} questions. For each one, you find the proof in the ${activity.scene.kind === "passage" ? "passage" : activity.scene.kind === "conversation" ? "conversation" : "picture"} and save it to your case notes. Then you build a claim and explain it.`,
        ),
        speakBtn(ctx, activity.intro, { label: "Read this to me" }),
      );
      const row = h("div", { class: "st-row" });
      const go = (resume) => () => (resume ? begin(saved) : begin(null));
      if (resumable) {
        row.append(
          h(
            "button",
            { type: "button", class: "st-btn st-primary", onclick: go(true) },
            "Continue my case",
          ),
          h("button", { type: "button", class: "st-btn", onclick: go(false) }, "Start over"),
        );
      } else
        row.append(
          h(
            "button",
            { type: "button", class: "st-btn st-primary", onclick: go(false) },
            "Open the case",
          ),
        );
      card.append(row);
      ui.body.append(card);
      row.querySelector("button").focus();
      tick();
    }

    function begin(resume) {
      ui.body.textContent = "";
      ctx.items.clear();
      scene = createScene(ctx, activity.scene);
      layout.textContent = "";
      layout.append(scene.el, h("div", { class: "st-ld-side" }, work, notes.el));
      ui.body.append(layout);
      notes.entries.length = 0;
      let start = 0;
      if (resume) {
        for (const r of resume.items || []) ctx.items.set(r.id, r);
        for (const n of resume.notes || []) {
          notes.entries.push(n);
          scene.save(
            n.units.map((u) => u.id),
            n.no,
          );
        }
        start = resume.qi;
      } else ctx.clearProgress();
      notes.paint();
      question(start);
    }

    function question(i) {
      if (i >= qs.length) return claimStage();
      const q = qs[i];
      const no = i + 1;
      const phases = phasesOf(q);
      let phase = 0;
      let hintsUsed = 0;
      const loops = {
        answer: ctx.loop({
          id: q.id,
          misconceptions: q.misconceptions,
          model: q.model,
          right: q.explain,
          transfer: q.transfer,
        }),
        proof: ctx.loop({
          id: `${q.id}.proof`,
          misconceptions: q.misconceptions,
          model: q.model,
          transfer: q.transfer,
        }),
      };
      const combo = {
        record() {
          const a = loops.answer.record();
          const p = loops.proof.record();
          const hasA = phases.includes("answer");
          const hasP = phases.includes("evidence");
          return {
            id: q.id,
            tries: (hasA ? a.tries : 0) + (hasP ? p.tries : 0),
            hints: hintsUsed,
            ok: (!hasA || a.ok) && (!hasP || p.ok),
            tags: [...new Set([...a.tags, ...p.tags])],
          };
        },
      };
      const fb = ctx.feedback();
      const phaseHost = h("div", { class: "st-ld-phase" });
      const actions = h("div", { class: "st-row" });
      const hintBtn = h(
        "button",
        { type: "button", class: "st-btn", onclick: () => hint() },
        "Give me a hint",
      );
      const support = h("div", { class: "st-ld-support" });
      const paintSupport = () => {
        support.textContent = "";
        support.append(ctx.supportPanel({ supports: q.supports || activity.supports }).el);
      };
      ctx.onTier(paintSupport);
      work.textContent = "";
      work.append(
        h("p", { class: "st-ld-step" }, `Question ${no} of ${qs.length} - ${TYPE_LABEL[q.type]}`),
        h("h2", { class: "st-ld-q", tabindex: "-1" }, q.prompt),
        h("div", { class: "st-row" }, speakBtn(ctx, q.prompt, { label: "Hear the question" })),
        support,
        phaseHost,
        fb.el,
        actions,
      );
      paintSupport();
      scene.stopSelecting();
      work.querySelector(".st-ld-q").focus();
      persist(i);
      tick();
      showPhase();

      function showPhase() {
        phaseHost.textContent = "";
        actions.textContent = "";
        actions.append(hintBtn);
        if (phases[phase] === "answer") {
          scene.stopSelecting();
          const group = h("div", {
            class: "st-ld-options",
            role: "group",
            "aria-label": "Answer choices",
          });
          for (const o of q.options) {
            group.append(
              h(
                "button",
                {
                  type: "button",
                  class: "st-btn st-ld-option",
                  "data-opt": o.id,
                  onclick: () => pickOption(o),
                },
                o.text,
              ),
            );
          }
          phaseHost.append(
            h("p", { class: "st-ld-instruction" }, "Choose the best answer."),
            group,
          );
        } else {
          scene.startSelecting({ max: q.evidence.length });
          const check = h(
            "button",
            { type: "button", class: "st-btn st-primary", onclick: () => checkProof() },
            "Check my proof",
          );
          const clear = h(
            "button",
            { type: "button", class: "st-btn", onclick: () => scene.clear() },
            "Clear my choices",
          );
          phaseHost.append(
            h(
              "p",
              { class: "st-ld-instruction" },
              q.type === "evidence"
                ? "Tap the proof in the scene, then check it."
                : "Now prove it. Tap the proof in the scene, then check it.",
            ),
          );
          actions.prepend(check, clear);
        }
      }

      function hint() {
        const list = q.hints;
        const text = list[Math.min(hintsUsed, list.length - 1)];
        hintsUsed += 1;
        fb.show("hint", text);
        ctx.announce(text);
      }

      function miss(r, authoredText) {
        if (r.kind === "transfer") return showTransfer(r);
        fb.show(
          r.kind === "model" ? "model" : "retry",
          r.kind === "model" ? r.text : authoredText || r.text,
        );
        ctx.announce(r.kind === "model" ? r.text : authoredText || r.text);
        if (r.kind === "model" && phases[phase] === "evidence")
          scene.outline(q.evidence.map((e) => e.id));
        if (r.kind === "model" && phases[phase] === "answer")
          phaseHost.querySelector(`[data-opt="${q.answer}"]`)?.classList.add("st-pulse");
      }

      function showTransfer(r) {
        fb.show("transfer", r.text);
        phaseHost.hidden = actions.hidden = true;
        const card = transferCard(ctx, r.transfer, () => {
          card.remove();
          phaseHost.hidden = actions.hidden = false;
        });
        work.insertBefore(card, fb.el.nextSibling);
        card.querySelector("button")?.focus();
      }

      function pickOption(o) {
        const r = loops.answer.submit({ ok: o.id === q.answer, pick: o.id });
        if (r.ok) {
          phase += 1;
          if (phase < phases.length) {
            fb.show("right", "That is right. Now prove it with evidence from the scene.");
            ctx.announce("That is right. Now prove it with evidence from the scene.");
            return showPhase();
          }
          return finishQuestion();
        }
        const tagged = (q.misconceptions || []).some((m) => m.pick === o.id);
        const btn = phaseHost.querySelector(`[data-opt="${o.id}"]`);
        btn?.setAttribute("data-tried", "true");
        miss(
          r,
          tagged ? r.text : "Not that one. Reread the question, then look at the choices again.",
        );
      }

      function checkProof() {
        const sel = scene.selected();
        if (!sel.size) return fb.show("hint", "Tap at least one place in the scene first.");
        const { sub, result, tagged } = evidenceSub(q, sel);
        const r = loops.proof.submit(sub);
        if (r.ok) return finishQuestion(sel);
        miss(r, tagged ? r.text : evidenceNudge(result));
      }

      function finishQuestion(sel = new Set()) {
        const ids = q.evidence?.length ? [...sel] : [];
        scene.stopSelecting();
        const units = ids.map((id) => ({ id, text: scene.text(id) }));
        scene.save(ids, no);
        const answer = q.options?.find((o) => o.id === q.answer)?.text;
        notes.add({ no, qid: q.id, prompt: q.prompt, answer, units });
        ctx.settle(combo);
        const whys = (q.evidence || []).filter((e) => e.why).map((e) => e.why);
        const msg = [q.explain, ...whys].filter(Boolean).join(" ");
        fb.show("right", msg || "Case note saved.");
        ctx.announce("Case note saved.");
        phaseHost.textContent = "";
        actions.textContent = "";
        const last = no === qs.length;
        const next = h(
          "button",
          { type: "button", class: "st-btn st-primary", onclick: () => question(i + 1) },
          last ? "Build my claim" : "Next question",
        );
        actions.append(next);
        persist(i + 1);
        tick();
        next.focus();
      }
    }

    function claimStage() {
      scene.stopSelecting();
      runClaim({
        ctx,
        activity,
        scene,
        work,
        notes,
        tick,
        persist: () => persist(qs.length),
        reflect: finish,
      });
    }

    function finish() {
      work.textContent = "";
      const rs = reflectionStep(ctx, { cta: "Close the case" });
      work.append(h("p", { class: "st-ld-step" }, "Last step"), rs.el);
      rs.button.addEventListener("click", () => {
        ctx.finish(rs.value());
        work.textContent = "";
        work.append(
          h(
            "div",
            { class: "st-card st-finish" },
            h("h2", { tabindex: "-1" }, "Case closed"),
            h("p", {}, "Your results are saved on this device."),
          ),
        );
        work.querySelector("h2").focus();
      });
      tick();
    }

    intro();
  },
};
