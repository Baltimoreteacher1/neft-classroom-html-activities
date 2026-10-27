// The pitcher widgets: tap scoops of chosen sizes into the pitcher ("fill"), or pour servings out of it until it is
// empty ("serving"). The equation lists every scoop and the exact total. @fm2 FM-040 FM-059
import { servingsSvg, vesselSvg } from "../../art/fractions.js";
import { cmp, frac, mul, sub, toMixedString, toString } from "../../rational.js";
import { ING } from "./copy.js";
import { MAX_SCOOPS, fkey, fromKey, groupScoops, totalOf } from "./model.js";
import { button, mountWidget, u } from "./ui-core.js";
import { cupsText, ms } from "./words.js";

const sizes = (state) => state.scoops.map(fromKey);

function fillEquation(state, lang) {
  if (!state.scoops.length) return u("eqEmpty", lang);
  const groups = groupScoops(sizes(state));
  const total = totalOf(sizes(state));
  const parts = [groups.map((g) => `${g.count} × ${toString(g.size)}`).join(" + ")];
  if (groups.length === 1) parts.push(`${groups[0].count * groups[0].size.n}/${groups[0].size.d}`);
  if (parts.at(-1) !== toString(total)) parts.push(toString(total));
  if (total.n > total.d && total.d > 1) parts.push(toMixedString(total));
  const word = lang === "es" ? (total.n > total.d ? "tazas" : "taza") : total.n > total.d ? "cups" : "cup";
  return `${parts.join(" = ")} ${word}`;
}

export const fillWidget = {
  init: () => ({ scoops: [] }),
  view({ state, round, lang, canUndo }) {
    const total = totalOf(sizes(state));
    const over = cmp(total, frac(round.cap)) > 0;
    const level = over ? frac(round.cap) : total;
    const label = u("pitcherLabel", lang, {
      value: cupsText(total, lang),
      food: ING[round.ingredient ?? round.ingredients[0]][lang],
    });
    const full = state.scoops.length >= MAX_SCOOPS;
    const add = round.scoops.map((s) =>
      button({
        act: "add",
        v: fkey(s),
        fk: `add-${fkey(s)}`,
        cls: "fk-scoop-btn",
        disabled: full,
        label: `+ ${cupsText(s, lang)}`,
        aria: u("addScoop", lang, { size: cupsText(s, lang) }),
      }),
    );
    const groups = groupScoops(sizes(state)).map(
      (g) =>
        `<li class="fk-group"><span>${g.count} × ${toString(g.size)}</span>${button({ act: "remove", v: fkey(g.size), fk: `remove-${fkey(g.size)}`, label: "−", cls: "fk-step-btn", aria: u("removeScoop", lang, { size: cupsText(g.size, lang) }) })}</li>`,
    );
    return `
      <figure class="fk-model fk-pitcher">${vesselSvg({ level, cap: round.cap, marks: 1, pitcher: true, goal: round.hidden ? null : round.target, label })}</figure>
      <p class="fk-eq" data-fk="eq">${fillEquation(state, lang)}</p>
      ${over ? `<p class="fk-check is-bad"><span class="fk-check-icon" aria-hidden="true">!</span><span>${u("overflow", lang)}</span></p>` : ""}
      ${full ? `<p class="fk-note">${u("maxScoops", lang, { max: MAX_SCOOPS })}</p>` : ""}
      <div class="fk-tools">
        <div class="fk-tool"><span class="fk-tool-label">${u("tapScoops", lang)}</span><div class="fk-scoops" role="group" aria-label="${u("tapScoops", lang)}">${add.join("")}</div></div>
        ${groups.length ? `<ul class="fk-groups" aria-label="${u("inPitcher", lang)}">${groups.join("")}</ul>` : ""}
        <div class="fk-actions">${button({ act: "empty", fk: "empty", cls: "fm2-btn-quiet", label: u("emptyPitcher", lang), disabled: !state.scoops.length })}${button({ act: "undo", fk: "undo", label: u("undo", lang), disabled: !canUndo })}${button({ act: "submit", fk: "submit", cls: "fm2-btn-primary", label: u("submitPitcher", lang) })}</div>
      </div>`;
  },
  act(state, name, data) {
    if (name === "add") {
      if (state.scoops.length >= MAX_SCOOPS) return null;
      const scoops = [...state.scoops, data.v];
      const total = totalOf(scoops.map(fromKey));
      return {
        state: { scoops },
        say: {
          en: `Added a ${data.v} scoop. ${toMixedString(total)} so far.`,
          es: `Se agregó un cucharón de ${data.v}. Van ${toMixedString(total)}.`,
        },
      };
    }
    if (name === "remove") {
      const at = state.scoops.lastIndexOf(data.v);
      if (at < 0) return null;
      return {
        state: { scoops: state.scoops.filter((_, i) => i !== at) },
        say: { en: `Took out a ${data.v} scoop.`, es: `Se sacó un cucharón de ${data.v}.` },
      };
    }
    if (name === "empty")
      return state.scoops.length
        ? { state: { scoops: [] }, say: { en: "Pitcher emptied.", es: "Jarra vaciada." } }
        : null;
    return null;
  },
  response: (state) => ({ scoops: sizes(state).map((s) => ({ n: s.n, d: s.d })) }),
};

const left = (state, round) => sub(round.amount, mul(frac(state.servings), round.size));

export const servingWidget = {
  init: () => ({ servings: 0 }),
  view({ state, round, lang, canUndo }) {
    const remaining = left(state, round);
    const can = cmp(remaining, round.size) >= 0;
    const label = u("pitcherLabel", lang, {
      value: cupsText(remaining, lang),
      food: ING[round.ingredient][lang],
    });
    const poured = mul(frac(state.servings), round.size);
    return `
      <figure class="fk-model fk-pitcher">${vesselSvg({ level: remaining, cap: round.cap, marks: 1, pitcher: true, label })}</figure>
      ${state.servings ? `<figure class="fk-servings">${servingsSvg({ count: state.servings, size: round.size, label: u("servingsLabel", lang, { k: state.servings, size: toString(round.size) }) })}</figure>` : ""}
      <p class="fk-eq" data-fk="eq">${u("eqServing", lang, { k: state.servings, size: toString(round.size), poured: ms(poured), left: ms(remaining) })}</p>
      <div class="fk-tools">
        <div class="fk-tool">${button({ act: "pour", fk: "pour", cls: "fk-pour-btn", disabled: !can, label: u("pourOne", lang, { size: toString(round.size) }), aria: u("pourOneAria", lang, { size: cupsText(round.size, lang) }) })}
          ${button({ act: "putback", fk: "putback", disabled: state.servings === 0, label: u("putBack", lang) })}</div>
        <div class="fk-actions">${button({ act: "undo", fk: "undo", label: u("undo", lang), disabled: !canUndo })}${button({ act: "submit", fk: "submit", cls: "fm2-btn-primary", label: u("submitDone", lang) })}</div>
      </div>`;
  },
  act(state, name, data, round) {
    if (name === "pour") {
      if (cmp(left(state, round), round.size) < 0) return null;
      const servings = state.servings + 1;
      return {
        state: { servings },
        say: { en: `Poured serving ${servings}.`, es: `Se sirvió la porción ${servings}.` },
      };
    }
    if (name === "putback" && state.servings > 0)
      return {
        state: { servings: state.servings - 1 },
        say: { en: "Put one serving back.", es: "Se devolvió una porción." },
      };
    return null;
  },
  response: (state) => ({ servings: state.servings }),
};

export const mountFill = (root, ctx) => mountWidget(root, ctx, fillWidget);
export const mountServing = (root, ctx) => mountWidget(root, ctx, servingWidget);
