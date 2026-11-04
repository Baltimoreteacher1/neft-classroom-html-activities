// Recipe scaling: one exact factor drives the ratio table, the double number line, the graph and the equation, and any
// of them can be the one the student moves (servings, an ingredient amount, or a point on the graph).
import { L, R, decimalText, fracText, parseRational } from "../kernel.js";

export const PANCAKES = {
  servings: R(2),
  items: [
    { id: "flour", name: L("flour", "harina"), unit: L("cups", "tazas"), amount: R(1) },
    { id: "milk", name: L("milk", "leche"), unit: L("cups", "tazas"), amount: R(3, 4) },
    { id: "eggs", name: L("eggs", "huevos"), unit: L("eggs", "huevos"), amount: R(2) },
  ],
};
const MAX_SERVINGS = R(48);

export const recipe = {
  id: "recipe",
  init: ({ base = PANCAKES, servings } = {}) => ({ base, servings: servings ? R(servings) : base.servings, focus: base.items[0].id, via: null }),
  reduce(state, action) {
    const set = (servings) => {
      if (!servings || servings.sign() <= 0) return { refuse: L("Servings must be more than zero.", "Las porciones deben ser más que cero.") };
      if (servings.gt(MAX_SERVINGS)) return { refuse: L("This recipe card goes up to 48 servings.", "Esta tarjeta de receta llega hasta 48 porciones.") };
      return { state: { ...state, servings, via: action.via || action.type } };
    };
    switch (action.type) {
      case "servings":
        return set(parseRational(action.value));
      case "item": {
        const item = state.base.items.find((i) => i.id === action.id);
        const value = parseRational(action.value);
        if (!item || !value) return { state };
        return set(state.base.servings.mul(value).div(item.amount));
      }
      case "focus":
        return state.base.items.some((i) => i.id === action.id) ? { state: { ...state, focus: action.id } } : { state };
      default:
        return { state };
    }
  },
  derive(state) {
    const k = state.servings.div(state.base.servings);
    const items = state.base.items.map((i) => ({
      ...i,
      scaled: i.amount.mul(k),
      perServing: i.amount.div(state.base.servings),
      scaledText: fracText(i.amount.mul(k)),
      perServingText: fracText(i.amount.div(state.base.servings)),
    }));
    const focus = items.find((i) => i.id === state.focus) || items[0];
    const rows = [state.base.servings, state.servings, state.servings.mul(2)]
      .filter((s, i, all) => all.findIndex((t) => t.eq(s)) === i)
      .sort((a, b) => a.cmp(b));
    return {
      k,
      kText: fracText(k),
      servings: state.servings,
      servingsText: fracText(state.servings),
      items,
      focus,
      rows: rows.map((s) => ({ servings: s, cells: items.map((i) => i.amount.mul(s.div(state.base.servings))) })),
      // The same factor on every ingredient is the invariant: this is true by construction and checked by the tests.
      sameFactor: items.every((i) => i.scaled.div(i.amount).eq(k)),
      equation: `${focus.name.en} = ${focus.perServingText} × servings`,
      points: [R(0), state.base.servings, state.servings].map((s) => [s, focus.perServing.mul(s)]),
      decimal: decimalText(focus.scaled),
    };
  },
  describe(state, lang) {
    const d = recipe.derive(state);
    return lang === "es"
      ? `Receta para ${d.servingsText} porciones. Cada ingrediente se multiplicó por ${d.kText}.`
      : `A recipe for ${d.servingsText} servings. Every ingredient was multiplied by ${d.kText}.`;
  },
};
