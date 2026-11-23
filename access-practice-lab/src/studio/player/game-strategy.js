// Strategy Challenge: a garden under storms. Answering questions earns energy; the energy is spent on choices that
// change what happens next (a fence takes damage, a greenhouse earns more, compost heals). Storms are announced
// before they arrive and nobody loses: a garden that is wiped out is replanted. No clock, no score against others.

import { renderBlocks } from "./blocks.js";
import { buildSteps } from "./flow.js";
import { icon } from "./icons.js";
import { mountQuestion } from "./question.js";
import { h } from "./util.js";

const MAX_LEVEL = 3;
const MAX_PLANTS = 6;
const BUILDINGS = [
  { id: "fence", icon: "shield", name: "buildFence", effect: "effectFence" },
  { id: "greenhouse", icon: "home", name: "buildGreenhouse", effect: "effectGreenhouse" },
  { id: "compost", icon: "leaf", name: "buildCompost", effect: "effectCompost" },
];

const costOf = (level) => 2 + level;
const strengthOf = (round) => 1 + Math.floor(round / 3);
const earnFor = (rec) => (rec.shown ? 1 : rec.first === "correct" ? 3 : 2);

export function mountStrategy(area, ctx, { onFinish }) {
  const steps = buildSteps(ctx.activity).filter((s) => s.question);
  if (!steps.length) {
    onFinish();
    return {};
  }
  const st = (ctx.state.game.strategy ||= { round: 0, energy: 0, plants: 5, replants: 0, levels: { fence: 0, greenhouse: 0, compost: 0 }, paid: {}, phase: "ask", storm: null });
  const first = steps.findIndex((s) => !ctx.session.isDone(s.question));
  if (st.phase === "ask") st.round = first < 0 ? steps.length - 1 : first;

  const garden = h("div", { class: "sp-garden" });
  const say = h("p", { class: "sp-say", role: "status", "aria-live": "polite" });
  const panel = h("div", { class: "sp-strategy-panel" });
  area.replaceChildren(h("div", { class: "sp-strategy" }, garden, say, panel));
  const talk = (t) => {
    say.textContent = t;
  };

  function paintGarden() {
    const plants = h("span", { class: "sp-plants", role: "img", "aria-label": ctx.t("plantsLabel", { n: st.plants, max: MAX_PLANTS }) });
    for (let i = 0; i < MAX_PLANTS; i++) plants.append(h("span", { class: `sp-plant${i < st.plants ? " is-alive" : ""}`, "aria-hidden": "true" }, icon("leaf", 22)));
    const levels = BUILDINGS.map((b) =>
      h("li", { class: "sp-stat" }, icon(b.icon, 16), h("span", null, `${ctx.t(b.name)}: ${ctx.t("levelOf", { n: st.levels[b.id], max: MAX_LEVEL })}`)),
    );
    garden.replaceChildren(
      h("div", { class: "sp-garden-top" }, h("span", { class: "sp-q-n" }, ctx.t("roundN", { n: st.round + 1, total: steps.length })), h("span", { class: "sp-energy" }, icon("star", 16), ctx.t("energyN", { n: st.energy }))),
      plants,
      h("ul", { class: "sp-stats" }, ...levels),
    );
  }

  function render() {
    paintGarden();
    panel.replaceChildren();
    if (st.phase === "ask") return ask();
    if (st.phase === "plan") return plan();
    return storm();
  }

  function pay(rec, q) {
    if (st.paid[q.id]) return;
    const gain = earnFor(rec) + st.levels.greenhouse;
    st.paid[q.id] = true;
    st.energy += gain;
    talk(ctx.t("earned", { n: gain }));
  }

  function ask() {
    const step = steps[st.round];
    if (ctx.session.isDone(step.question)) {
      pay(ctx.session.get(step.question), step.question);
      st.phase = "plan";
      return render();
    }
    if (step.content.length) panel.append(h("div", { class: "sp-content" }, renderBlocks(step.content, ctx)));
    mountQuestion(panel, step.question, ctx, {
      index: st.round,
      total: steps.length,
      last: false,
      onDone: (rec) => {
        pay(rec, step.question);
        paintGarden();
      },
      onNext: () => {
        st.phase = "plan";
        render();
      },
    }).focus();
  }

  function plan() {
    const strength = strengthOf(st.round);
    const list = h("ul", { class: "sp-buildings" });
    for (const b of BUILDINGS) {
      const level = st.levels[b.id];
      const cost = costOf(level);
      const maxed = level >= MAX_LEVEL;
      const can = !maxed && st.energy >= cost;
      const btn = h("button", { type: "button", class: "sp-btn sp-btn-primary sp-small", disabled: !can }, maxed ? ctx.t("maxed") : ctx.t("upgrade", { cost }));
      btn.addEventListener("click", () => {
        st.energy -= cost;
        st.levels[b.id] += 1;
        talk(ctx.t("upgraded", { name: ctx.t(b.name), n: st.levels[b.id] }));
        paintGarden();
        plan_again(b.id);
      });
      list.append(
        h(
          "li",
          { class: "sp-building" },
          h("h3", null, icon(b.icon, 20), ctx.t(b.name)),
          h("p", null, ctx.t(b.effect)),
          h("p", { class: "sp-note-small" }, ctx.t("levelOf", { n: level, max: MAX_LEVEL })),
          btn,
          !maxed && !can ? h("p", { class: "sp-note-small" }, ctx.t("needMore", { n: cost - st.energy })) : null,
        ),
      );
    }
    const go = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg("letStormCome"), icon("arrow", 18));
    go.addEventListener("click", () => {
      st.phase = "storm";
      st.storm = resolveStorm();
      render();
    });
    const title = h("h2", { class: "sp-round-title", tabindex: "-1" }, ctx.t("planTitle"));
    panel.append(title, h("p", { class: "sp-forecast" }, icon("flag", 18), ctx.t("forecast", { n: strength })), h("p", null, ctx.t("planHelp", { n: st.energy })), list, h("div", { class: "sp-next-row" }, go));
    return title;
  }

  function plan_again(focusId) {
    paintGarden();
    panel.replaceChildren();
    plan();
    const idx = BUILDINGS.findIndex((b) => b.id === focusId);
    (panel.querySelectorAll(".sp-building button")[idx] || panel.querySelector(".sp-next-row button")).focus();
  }

  function resolveStorm() {
    const strength = strengthOf(st.round);
    const blocked = Math.min(strength, st.levels.fence);
    const damage = strength - blocked;
    st.plants = Math.max(0, st.plants - damage);
    let replanted = false;
    if (st.plants === 0) {
      st.plants = 2;
      st.replants += 1;
      replanted = true;
    }
    const healed = Math.min(st.levels.compost, MAX_PLANTS - st.plants);
    st.plants += healed;
    return { strength, blocked, damage, healed, replanted };
  }

  function storm() {
    paintGarden();
    const r = st.storm;
    const last = st.round >= steps.length - 1;
    const go = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg(last ? "finish" : "nextRound"), icon("arrow", 18));
    go.addEventListener("click", () => {
      if (last) return onFinish();
      st.round += 1;
      st.phase = "ask";
      st.storm = null;
      render();
    });
    const title = h("h2", { class: "sp-round-title", tabindex: "-1" }, ctx.t("stormTitle"));
    panel.append(
      title,
      h("p", null, ctx.t("stormBody", { strength: r.strength, blocked: r.blocked, damage: r.damage })),
      r.healed ? h("p", null, ctx.t("stormHealed", { n: r.healed })) : null,
      r.replanted ? h("p", { class: "sp-watch" }, ctx.t("replanted")) : null,
      last ? h("p", null, ctx.t("gardenEnd", { n: st.plants })) : null,
      h("div", { class: "sp-next-row" }, go),
    );
    talk(ctx.t("stormTitle"));
    ctx.focus(title);
  }

  render();
  return {};
}
