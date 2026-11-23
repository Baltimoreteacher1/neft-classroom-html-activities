// early-sort engine (K-2): picture-sort, sound-match, syllable-clap, sequence-story, oral-describe.
// Child-sized targets, audio on every item, no timers, no failure sounds. Contract: engines/early-sort.schema.md
import { h } from "../core/dom.js";
import { loadCss } from "./engine-core.js";
import { appendAll, bigButton, grownUpBox } from "./early-sort-kit.js";
import { oralDescribe, sequenceStory, syllableClap } from "./early-sort-seq.js";
import { pictureSort, soundMatch } from "./early-sort-sort.js";
import { reflectionStep, speakBtn, stage } from "./st1-ui.js";

const MODES = {
  "picture-sort": pictureSort,
  "sound-match": soundMatch,
  "syllable-clap": syllableClap,
  "sequence-story": sequenceStory,
  "oral-describe": oralDescribe,
};
const COUNT = {
  "picture-sort": (r) => r.items.length,
  "sound-match": (r) => r.trials.length,
  "syllable-clap": (r) => r.items.length,
  "sequence-story": (r) => r.cards.length - 1,
  "oral-describe": (r) => r.items.length,
};
const TITLE = {
  "picture-sort": "Sort the pictures",
  "sound-match": "Sounds that go together",
  "syllable-clap": "Clap the parts",
  "sequence-story": "Tell the story",
  "oral-describe": "Look and say",
};
const STATE_V = 1;

/** A top-level `mode` (with that mode's fields) is shorthand for a single round. */
export function normalizeRounds(activity) {
  if (activity.rounds?.length) return activity.rounds;
  const { mode, id: _id, ...rest } = activity;
  const keep = [
    "kind",
    "prompt",
    "say",
    "title",
    "grownUp",
    "supports",
    "categories",
    "items",
    "trials",
    "cards",
    "hints",
  ];
  const round = { id: "r1", mode };
  for (const k of keep) if (rest[k] !== undefined) round[k] = rest[k];
  return [round];
}

export default {
  id: "early-sort",
  async mount(ctx) {
    loadCss("engines-base.css");
    loadCss("early-sort.css");
    const { activity } = ctx;
    const rounds = normalizeRounds(activity);
    const counts = rounds.map((r) => COUNT[r.mode](r));
    const total = counts.reduce((a, b) => a + b, 0);
    const saved = ctx.resume()?.state;
    const resumable =
      saved?.v === STATE_V && saved.aid === activity.id && saved.done > 0 && saved.done < total;

    const grown = h(
      "button",
      { type: "button", class: "st-btn", "aria-pressed": "false" },
      "Grown-up mode",
    );
    const ui = stage(ctx, {
      engine: "early-sort",
      total,
      dots: true,
      noun: "finished",
      extraTools: [grown],
    });
    ui.el.dataset.grownup = "false";
    grown.addEventListener("click", () => {
      const on = ui.el.dataset.grownup !== "true";
      ui.el.dataset.grownup = String(on);
      grown.setAttribute("aria-pressed", String(on));
    });
    const doneBefore = (ri) => counts.slice(0, ri).reduce((a, b) => a + b, 0);
    const mark = (n) => ui.progress.set(n);
    const persist = (ri, ei) =>
      ctx.save({
        v: STATE_V,
        aid: activity.id,
        ri,
        ei,
        done: doneBefore(ri) + ei,
        items: [...ctx.items.values()],
      });

    function intro() {
      ui.body.textContent = "";
      mark(0);
      const card = h(
        "div",
        { class: "st-card st-es-intro" },
        h("h2", {}, activity.title),
        h(
          "p",
          { class: "st-es-prompt" },
          activity.intro,
          " ",
          speakBtn(ctx, activity.intro, { label: "Listen", iconOnly: true, cls: "st-es-listen" }),
        ),
        grownUpBox(activity.grownUp),
      );
      const row = h("div", { class: "st-row st-es-actions" });
      if (resumable) {
        row.append(
          bigButton("Keep going", () => begin(saved)),
          bigButton("Start again", () => begin(null), { primary: false }),
        );
      } else row.append(bigButton("Let's start", () => begin(null)));
      card.append(row);
      ui.body.append(card);
      row.querySelector("button").focus();
    }

    function begin(resume) {
      ctx.items.clear();
      if (resume) for (const r of resume.items || []) ctx.items.set(r.id, r);
      else ctx.clearProgress();
      play(resume ? resume.ri : 0, resume ? resume.ei : 0);
    }

    function play(ri, ei) {
      if (ri >= rounds.length) return reflect();
      const round = rounds[ri];
      const host = h("div", { class: "st-es-host" });
      const session = MODES[round.mode].session({ ctx, host, activity }, round);
      if (ei >= session.count) return play(ri + 1, 0);
      ui.body.textContent = "";
      const title = h(
        "h2",
        { class: "st-es-title", tabindex: "-1" },
        round.title || TITLE[round.mode],
      );
      const next = h("div", { class: "st-row st-es-next" });
      appendAll(ui.body, title, host, next, grownUpBox(round.grownUp));
      mark(doneBefore(ri) + ei);
      persist(ri, ei);
      session.present(ei, (loop) => {
        if (loop) ctx.settle(loop);
        mark(doneBefore(ri) + ei + 1);
        persist(ri, ei + 1);
        const lastOfAll = ri === rounds.length - 1 && ei + 1 >= session.count;
        const btn = bigButton(lastOfAll ? "All done" : "Next", () => play(ri, ei + 1));
        next.append(btn);
        btn.focus();
      });
    }

    function reflect() {
      ui.body.textContent = "";
      mark(total);
      const rs = reflectionStep(ctx, {
        cta: "I told someone",
        oral: true,
        write: !!activity.reflection.write,
      });
      rs.button.classList.add("st-es-big-btn");
      appendAll(
        ui.body,
        h("h2", { class: "st-es-title" }, "You did it"),
        rs.el,
        grownUpBox(activity.grownUp),
      );
      rs.button.addEventListener("click", () => {
        ctx.finish(rs.value());
        ui.body.textContent = "";
        ui.body.append(
          h(
            "div",
            { class: "st-card st-finish" },
            h("h2", { tabindex: "-1" }, "Great work"),
            h("p", {}, "You finished. Your work is saved on this device."),
          ),
        );
        ui.body.querySelector("h2").focus();
        ctx.speak("Great work. You finished.");
      });
    }

    intro();
  },
};
