// Rectangle model: width and height change together with the grid, the area and the perimeter, because all three are
// read from the same two integers. Saved cases let a student compare what they built.
import { L, clampInt } from "../kernel.js";

export const area = {
  id: "area",
  init: ({ w = 4, h = 3, maxW = 12, maxH = 12 } = {}) => ({ w, h, maxW, maxH, cases: [] }),
  reduce(state, action) {
    switch (action.type) {
      case "size": {
        const w = clampInt(action.w ?? state.w, 1, state.maxW);
        const h = clampInt(action.h ?? state.h, 1, state.maxH);
        if (w === state.w && h === state.h) return { state };
        return { state: { ...state, w, h } };
      }
      case "bump": {
        const w = state.w + (action.dw || 0);
        const h = state.h + (action.dh || 0);
        if (w < 1 || h < 1 || w > state.maxW || h > state.maxH)
          return {
            refuse: L(
              "The rectangle can only be between 1 and {max} units on each side.",
              "El rectángulo solo puede medir entre 1 y {max} unidades por lado.",
            ),
          };
        return { state: { ...state, w, h } };
      }
      case "save": {
        if (state.cases.some((c) => c.w === state.w && c.h === state.h))
          return { refuse: L("You already saved this rectangle. Try a different one.", "Ya guardaste este rectángulo. Prueba con otro.") };
        return { state: { ...state, cases: [...state.cases, { w: state.w, h: state.h }].slice(-12) } };
      }
      case "clearCases":
        return { state: { ...state, cases: [] } };
      default:
        return { state };
    }
  },
  derive(state) {
    const cases = state.cases.map((c) => ({ ...c, area: c.w * c.h, perimeter: 2 * (c.w + c.h) }));
    return {
      w: state.w,
      h: state.h,
      area: state.w * state.h,
      perimeter: 2 * (state.w + state.h),
      cells: state.w * state.h,
      equation: `${state.w} × ${state.h} = ${state.w * state.h}`,
      cases,
    };
  },
  describe(state, lang) {
    const d = area.derive(state);
    return lang === "es"
      ? `Rectángulo de ${d.w} por ${d.h}: ${d.area} unidades cuadradas dentro, perímetro ${d.perimeter} unidades.`
      : `A rectangle ${d.w} wide and ${d.h} tall: ${d.area} square units inside, perimeter ${d.perimeter} units.`;
  },
};
