// visual-match engine: connect words to pictures, meanings and sentences across three rising rounds.
// Contract: engines/visual-match.schema.md
import { h } from "../core/dom.js";
import { loadCss } from "./engine-core.js";
import { createBoard } from "./visual-match-board.js";
import { planBatches, resolveRounds, spanishReady, summarise } from "./visual-match-model.js";
import { reflectionStep, speakBtn, stage } from "./st1-ui.js";

const PROMPTS = {
  "term-visual": "Match each word to its picture.",
  "term-definition": "Match each word to what it means.",
  "term-example": "Choose the word that completes each sentence.",
};
const STATE_V = 1;

export default {
  id: "visual-match",
  async mount(ctx) {
    loadCss("engines-base.css");
    loadCss("visual-match.css");
    const { activity } = ctx;
    const rounds = resolveRounds(activity);
    const canEs = spanishReady(activity);
    const st = { planTier: ctx.tier, r: 0, b: 0, es: false, started: false };

    const saved = ctx.resume()?.state;
    const resumable = saved?.v === STATE_V && saved.aid === activity.id;
    if (resumable) for (const rec of saved.items || []) ctx.items.set(rec.id, rec);

    const total = rounds.reduce((n, r) => n + r.pairIds.length, 0);
    const esBtn = canEs
      ? h(
          "button",
          { type: "button", class: "st-btn", "aria-pressed": "false", onclick: () => toggleEs() },
          "Español",
        )
      : null;
    const ui = stage(ctx, { engine: "visual-match", total, noun: "matched", extraTools: [esBtn] });
    const doneCount = () => [...ctx.items.values()].filter((i) => i.ok).length;
    const tick = () => ui.progress.set(doneCount(), `${doneCount()} of ${total} matched`);
    const plans = () => rounds.map((r) => planBatches(activity, r, st.planTier));

    function persist() {
      ctx.save({
        v: STATE_V,
        aid: activity.id,
        planTier: st.planTier,
        r: st.r,
        b: st.b,
        es: st.es,
        items: [...ctx.items.values()],
      });
    }

    function toggleEs() {
      st.es = !st.es;
      esBtn.setAttribute("aria-pressed", String(st.es));
      board?.setEs(st.es);
      persist();
    }

    let board = null;
    let supportHost = null;
    const offTier = ctx.onTier(() => {
      if (supportHost) paintSupport();
      board?.refresh();
    });
    void offTier;

    function paintSupport() {
      const round = rounds[st.r];
      supportHost.textContent = "";
      const panel = ctx.supportPanel({ supports: round.supports || activity.supports });
      supportHost.append(panel.el);
    }

    function intro() {
      ui.body.textContent = "";
      const lines = [
        "Pick a word, then pick the card it belongs with. You can also drag a word onto a card.",
        "If it is not a match, you get a clue. You can ask for a hint any time.",
      ];
      const card = h(
        "div",
        { class: "st-card" },
        h("h2", {}, activity.title),
        h("p", { class: "st-intro" }, activity.intro),
        h(
          "ul",
          { class: "st-vm-how" },
          lines.map((l) => h("li", {}, l)),
        ),
        h(
          "div",
          { class: "st-row" },
          speakBtn(ctx, `${activity.intro} ${lines.join(" ")}`, { label: "Read this to me" }),
        ),
      );
      const row = h("div", { class: "st-row" });
      const start = h(
        "button",
        { type: "button", class: "st-btn st-primary", onclick: () => begin(false) },
        "Start matching",
      );
      if (resumable && saved.r != null && doneCount() > 0) {
        const cont = h(
          "button",
          { type: "button", class: "st-btn st-primary", onclick: () => begin(true) },
          "Continue where I left off",
        );
        start.className = "st-btn";
        start.textContent = "Start over";
        row.append(cont, start);
      } else row.append(start);
      card.append(row);
      ui.body.append(card);
      tick();
      (row.querySelector(".st-primary") || start).focus();
    }

    function begin(resume) {
      if (resume)
        Object.assign(st, {
          planTier: saved.planTier || ctx.tier,
          r: saved.r,
          b: saved.b,
          es: canEs && !!saved.es,
        });
      else {
        ctx.items.clear();
        ctx.clearProgress();
        st.planTier = ctx.tier;
      }
      if (esBtn) esBtn.setAttribute("aria-pressed", String(st.es));
      st.started = true;
      showBatch();
    }

    function showBatch() {
      const plan = plans();
      const round = rounds[st.r];
      const batches = plan[st.r];
      const pairIds = batches[st.b];
      const settled = new Set(pairIds.filter((id) => ctx.items.get(`${round.id}.${id}`)?.ok));
      if (settled.size === pairIds.length) return advance(plan);
      ui.body.textContent = "";
      const lastBatch = st.b === batches.length - 1;
      const lastRound = st.r === rounds.length - 1;
      const nextLabel = !lastBatch
        ? "Next group of cards"
        : lastRound
          ? "Finish matching"
          : `Start round ${st.r + 2}`;
      supportHost = h("div", { class: "st-vm-support" });
      board = createBoard(ctx, {
        activity,
        round,
        pairIds,
        batchNo: st.b,
        settled,
        es: st.es,
        nextLabel,
        onProgress: () => {
          tick();
          persist();
        },
        onNext: () => advance(plan, true),
      });
      const heading = h(
        "h2",
        { class: "st-vm-round", tabindex: "-1" },
        `Round ${st.r + 1} of ${rounds.length}: ${round.title}`,
      );
      ui.body.append(
        h("p", { class: "st-vm-step" }, `Group ${st.b + 1} of ${batches.length}`),
        heading,
        h(
          "p",
          { class: "st-prompt" },
          round.prompt || PROMPTS[round.mode],
          " ",
          speakBtn(ctx, round.prompt || PROMPTS[round.mode], {
            label: "Hear the directions",
            iconOnly: true,
          }),
        ),
        supportHost,
        board.el,
      );
      paintSupport();
      tick();
      persist();
      heading.focus({ preventScroll: false });
    }

    function advance(plan, announce) {
      const batches = plan[st.r];
      if (st.b < batches.length - 1) st.b += 1;
      else if (st.r < rounds.length - 1) {
        st.r += 1;
        st.b = 0;
      } else return results();
      if (announce) ctx.announce(`Round ${st.r + 1}, group ${st.b + 1}`);
      showBatch();
    }

    function results() {
      board = null;
      ui.body.textContent = "";
      const recs = [...ctx.items.values()];
      const sum = summarise(recs);
      const retry = sum.retry.map((r) => {
        const pairId = r.id.split(".")[1];
        return activity.pairs.find((p) => p.id === pairId)?.term;
      });
      const words = [...new Set(retry.filter(Boolean))];
      const rs = reflectionStep(ctx, { cta: "Finish" });
      ui.body.append(
        h(
          "div",
          { class: "st-card" },
          h("h2", { tabindex: "-1", class: "st-vm-round" }, "You matched every card"),
          h(
            "p",
            {},
            `You got ${sum.firstTry} of ${sum.total} matches on the first try without a hint.`,
          ),
          words.length
            ? h(
                "p",
                {},
                "Words to say again with a partner: ",
                h("strong", {}, words.join(", ")),
                ".",
              )
            : h("p", {}, "You matched every word without needing a second try."),
        ),
        rs.el,
      );
      rs.button.addEventListener("click", () => {
        ctx.finish(rs.value());
        ui.body.textContent = "";
        ui.body.append(
          h(
            "div",
            { class: "st-card st-finish" },
            h("h2", { tabindex: "-1" }, "All done"),
            h("p", {}, "Your results are saved on this device."),
          ),
        );
        ui.body.querySelector("h2").focus();
      });
      ui.body.querySelector("h2").focus();
      tick();
    }

    intro();
  },
};
