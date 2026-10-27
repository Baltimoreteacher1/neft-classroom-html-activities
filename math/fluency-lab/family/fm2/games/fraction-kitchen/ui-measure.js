// The measuring-cup and number-line widget: choose how the cup or line is marked, then pour or hop the marker one
// mark (or one whole) at a time. The equation under the picture always matches the level. @fm2 FM-040 FM-059
import { stripSvg, vesselSvg } from "../../art/fractions.js";
import { frac, toDecimalString, toNumber } from "../../rational.js";
import { ING } from "./copy.js";
import { markerStart } from "./model.js";
import { button, esc, mountWidget, stepper, u } from "./ui-core.js";
import { cupsText, ms } from "./words.js";

const levelOf = (s) => frac(s.steps, s.ticks);
const range = (round, ticks) => [round.lo * ticks, round.hi * ticks];
const decimalText = (x) => toDecimalString(x) ?? `${toNumber(x).toFixed(5)}…`;

function equation(state, round, lang) {
  const level = levelOf(state);
  const isCup = round.kind === "cup";
  if (round.irr) {
    return u("eqApprox", lang, {
      steps: state.steps,
      ticks: state.ticks,
      dec: decimalText(level),
      symbol: round.irr.symbol,
      digits: round.irr.digits,
    });
  }
  const what = u(Math.abs(state.steps) === 1 ? "markOf" : "marksOf", lang, state);
  const base = u(isCup ? "eqLevel" : "eqMarker", lang, { what, value: isCup ? cupsText(level, lang) : ms(level) });
  const dec = level.d > 1 && toDecimalString(level) ? ` = ${toDecimalString(level)}` : "";
  return `${base}${dec}`;
}

function figure(state, round, lang) {
  const level = levelOf(state);
  if (round.kind === "cup") {
    const label = u("cupLabel", lang, {
      ticks: state.ticks,
      value: cupsText(level, lang),
      food: ING[round.ingredient][lang],
    });
    return vesselSvg({
      level,
      cap: round.cap,
      marks: state.ticks,
      goal: round.level === 1 && !round.hidden ? round.target : null,
      label,
      labelEvery: round.blind ? 9999 : 1,
    });
  }
  const label = u("stripLabel", lang, {
    lo: round.lo,
    hi: round.hi,
    ticks: state.ticks,
    value: ms(level),
  });
  const points = round.irr ? [{ value: toNumber(round.irr.value), text: round.irr.symbol }] : [];
  return stripSvg({
    lo: round.lo,
    hi: round.hi,
    marks: state.ticks,
    marker: level,
    start: round.skill === "net" ? round.start : null,
    points,
    label,
  });
}

function ticksControl(state, round, lang) {
  if (round.irr) {
    const [min, max] = [round.ticksOptions[0], round.ticksOptions.at(-1)];
    return stepper({
      fk: "ticks",
      label: u("marksBetween", lang),
      value: state.ticks,
      text: u("marksText", lang, { m: state.ticks }),
      min,
      max,
      step: "ticksStep",
      visibleLabel: true,
      lang,
    });
  }
  const buttons = round.ticksOptions.map((m) =>
    button({
      act: "ticks",
      v: m,
      fk: `ticks-${m}`,
      cls: "fk-ticks-btn",
      label: `1/${m}`,
      pressed: state.ticks === m,
      aria: u("marksOption", lang, { m }),
    }),
  );
  return `<div class="fk-tool"><span class="fk-tool-label">${u(round.kind === "cup" ? "chooseCup" : "chooseMarks", lang)}</span><div class="fk-ticks" role="group" aria-label="${esc(u("chooseMarks", lang))}">${buttons.join("")}</div></div>`;
}

export const measureWidget = {
  init(round) {
    const ticks = round.ticksOptions[0];
    return { ticks, steps: markerStart(round).n * ticks, verdict: null };
  },
  view({ state, round, lang, canUndo }) {
    const [min, max] = range(round, state.ticks);
    const level = levelOf(state);
    const isCup = round.kind === "cup";
    const verdict = round.irr
      ? `<div class="fk-tool"><span class="fk-tool-label" id="fk-verdict-label">${u("verdictAsk", lang, { symbol: round.irr.symbol })}</span><div class="fk-ticks" role="group" aria-labelledby="fk-verdict-label">
          ${button({ act: "verdict", v: "equal", fk: "verdict-equal", cls: "fk-verdict-btn", label: u("verdictEqual", lang), pressed: state.verdict === "equal" })}
          ${button({ act: "verdict", v: "close", fk: "verdict-close", cls: "fk-verdict-btn", label: u("verdictClose", lang), pressed: state.verdict === "close" })}</div></div>`
      : "";
    return `
      <figure class="fk-model ${isCup ? "fk-cup" : "fk-strip"}">${figure(state, round, lang)}</figure>
      <p class="fk-eq" data-fk="eq">${equation(state, round, lang)}</p>
      <div class="fk-tools">
        ${ticksControl(state, round, lang)}
        <div class="fk-tool"><span class="fk-tool-label">${u(isCup ? "pourLevel" : "moveMarker", lang)}</span>
          ${stepper({ fk: "hop", label: u(isCup ? "levelLabel" : "markerLabel", lang), value: state.steps, text: ms(level), min, max, step: "hop", big: true, lang })}
          ${button({ act: "startover", fk: "startover", cls: "fm2-btn-quiet", label: u(isCup ? "emptyCup" : "backToStart", lang) })}</div>
        ${verdict}
        <div class="fk-actions">${button({ act: "undo", fk: "undo", label: u("undo", lang), disabled: !canUndo })}${button({ act: "submit", fk: "submit", cls: "fm2-btn-primary", label: u(isCup ? "submitPour" : "submitMarker", lang) })}</div>
      </div>`;
  },
  act(state, name, data, round) {
    const [min, max] = range(round, state.ticks);
    const clampSteps = (steps, ticks) => {
      const [low, high] = range(round, ticks);
      return Math.min(high, Math.max(low, steps));
    };
    const withTicks = (m) => {
      const value = levelOf(state);
      const raw = (value.n * m) / value.d;
      return {
        ...state,
        ticks: m,
        steps: clampSteps(Number.isInteger(raw) ? raw : Math.floor(raw), m),
      };
    };
    if (name === "ticks" || name === "ticksStep") {
      const m = name === "ticks" ? Number(data.v) : state.ticks + Number(data.v);
      if (!round.ticksOptions.includes(m) || m === state.ticks) return null;
      const next = withTicks(m);
      return {
        state: next,
        say: {
          en: `Marks every 1/${m}. Level ${ms(levelOf(next))}.`,
          es: `Marcas cada 1/${m}. Nivel ${ms(levelOf(next))}.`,
        },
      };
    }
    if (name === "hop") {
      const big = String(data.dir).startsWith("big");
      const steps = clampSteps(state.steps + Number(data.v) * (big ? state.ticks : 1), state.ticks);
      if (steps === state.steps || steps < min || steps > max) return null;
      const level = ms(frac(steps, state.ticks));
      return {
        state: { ...state, steps },
        say: {
          en: `${round.kind === "cup" ? "Level" : "Marker"} ${level}.`,
          es: `${round.kind === "cup" ? "Nivel" : "Marcador"} ${level}.`,
        },
      };
    }
    if (name === "startover") {
      const steps = clampSteps(markerStart(round).n * state.ticks, state.ticks);
      return steps === state.steps
        ? null
        : {
            state: { ...state, steps },
            say: { en: "Back to the start.", es: "De vuelta al inicio." },
          };
    }
    if (name === "verdict")
      return {
        state: { ...state, verdict: data.v },
        say: { en: "Answer chosen.", es: "Respuesta elegida." },
        quiet: true,
      };
    return null;
  },
  response: (state) => ({ ticks: state.ticks, steps: state.steps, verdict: state.verdict }),
};

export function mountMeasure(root, ctx) {
  return mountWidget(root, ctx, measureWidget);
}
