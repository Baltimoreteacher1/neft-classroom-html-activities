/* Builds the board objects the Studio asks for when a student presses
 * "Add selected supports to board". Each representation maps to the object
 * that really is that representation for the chosen skill; frames carry blanks,
 * never answers. The board (index.html bridge) creates them. */
(function (root) {
  "use strict";

  const D = root.MWReasoningData;

  const LABELS = {
    en: {
      first: "first quantity",
      second: "second quantity",
      part: "part",
      whole: "whole",
      input: "input",
      output: "output",
      value: "value",
      frequency: "frequency",
      percentWhole: "100%",
    },
    es: {
      first: "primera cantidad",
      second: "segunda cantidad",
      part: "parte",
      whole: "entero",
      input: "entrada",
      output: "salida",
      value: "valor",
      frequency: "frecuencia",
      percentWhole: "100 %",
    },
  };

  /* Equation frames: blanks only, except the ratio/percent lab where the student chose the numbers. */
  function equationFrame(skill, lang, n) {
    const { a, b, k } = n;
    const blanks = {
      ratio: `${a} : ${b} = ${a * k} : ${b * k}`,
      percent: `${a}/${b} = ${a * k}/${b * k}`,
      fraction: "____ ÷ ____ = ____",
      decimals: "____ × ____ = ____",
      integers: "____ + ____ = ____",
      exponents: "____ × ____ × ____ = ____",
      equation: "____ x + ____ = ____",
      inequality: "x ____ ____",
      twovar: "y = ____ · x",
      area: "A = ____",
      volume: "V = ____",
      statistics:
        lang === "es" ? "Centro: ____   Variabilidad: ____" : "Center: ____   Spread: ____",
    };
    return blanks[skill] || "____ = ____";
  }

  function build(state, api) {
    const lang = state.language === "es" ? "es" : "en";
    const L = LABELS[lang];
    const skill = state.skill;
    const { a, b, factor: k } = state.linked;
    const top = [a, a * 2, a * 3, a * k].map(String);
    const bottom = [b, b * 2, b * 3, b * k].map(String);
    const supports = (type) => Boolean(api && api.supportsType && api.supportsType(type));
    const out = [];

    const problem = String(state.prompt || "").trim();
    const existing = api && api.getProblemText ? api.getProblemText() : "";
    if (problem && existing.slice(0, 30) !== problem.slice(0, 30))
      out.push({ type: "text", props: { text: problem.slice(0, 600) } });

    const named = skill === "percent" ? [L.part, L.whole] : [L.first, L.second];
    for (const id of state.representations) {
      switch (id) {
        case "ratio table":
          out.push({
            type: "ratiotable",
            props: { cols: 4, top: top.slice(0, 1), bottom: bottom.slice(0, 1), topLabel: named[0], botLabel: named[1] },
          });
          break;
        case "table":
          out.push({
            type: "ratiotable",
            props: {
              cols: 4,
              topLabel: skill === "twovar" ? L.input : L.value,
              botLabel: skill === "twovar" ? L.output : L.frequency,
            },
          });
          break;
        case "double number line":
          out.push({
            type: "dblnumline",
            props: {
              intervals: 3,
              top: ["", top[0]],
              bottom: ["", bottom[0]],
              topLabel: named[0],
              bottomLabel: named[1],
            },
          });
          break;
        case "tape diagram":
          out.push({ type: "tape", props: { parts: skill === "equation" ? 3 : 4 } });
          break;
        case "hundred model":
          out.push(
            supports("hundredgrid")
              ? { type: "hundredgrid", props: {} }
              : { type: "tape", props: { parts: 10, total: L.percentWhole } },
          );
          break;
        case "fraction model":
          out.push({ type: "fracbar", props: { parts: 4 } });
          break;
        case "number line":
          out.push({
            type: "numline",
            props:
              skill === "fraction"
                ? { min: 0, max: 4 }
                : skill === "integers"
                  ? { min: -10, max: 10 }
                  : { min: -5, max: 5 },
          });
          break;
        case "inequality graph":
          out.push({ type: "ineqline", props: { min: -5, max: 5, point: 2, dir: "gt" } });
          break;
        case "balance model":
          out.push(
            supports("balance")
              ? { type: "balance", props: {} }
              : { type: "algebra", props: { tiles: [] } },
          );
          break;
        case "shape model":
          out.push({ type: "shape2d", props: { shape: "rectangle", label: "" } });
          break;
        case "3-D model":
          out.push({ type: "shape3d", props: { shape: "rectprism", label: "" } });
          break;
        case "array":
          out.push({ type: "arraymodel", props: { rows: 3, cols: 4 } });
          break;
        case "data display":
          out.push({ type: "dotplot", props: { min: 0, max: 10, counts: {} } });
          break;
        case "integer chips":
          out.push({ type: "chips", props: { chips: [] } });
          break;
        case "coordinate plane":
          out.push({ type: "coordgrid", props: { min: -5, max: 5 } });
          break;
        case "graph":
          out.push({ type: "coordgrid", props: { min: 0, max: 10 } });
          break;
        case "place-value model":
          out.push({ type: "placevalue", props: {} });
          break;
        case "equation":
        case "calculation":
        case "expanded form":
          out.push({ type: "text", props: { text: equationFrame(skill, lang, { a, b, k }) } });
          break;
        case "words":
        case "claim":
          out.push({
            type: "text",
            props: { text: D.STEMS[lang][state.level] || D.STEMS[lang][2] },
          });
          break;
        default:
          break;
      }
    }
    return out;
  }

  root.MWRStamp = Object.freeze({ build, equationFrame });
})(window);
