// Family Mission interactive models. Import this module lazily (`await import(".../index.mjs")`)
// on the pages that carry a model; each family is pure state plus a separate mount().
import * as balance from "./balance.mjs";
import * as coordinate from "./coordinate.mjs";
import * as data from "./data.mjs";
import * as exponents from "./exponents.mjs";
import * as geometry from "./geometry.mjs";
import * as numberline from "./numberline.mjs";
import * as percent from "./percent.mjs";
import * as ratio from "./ratio.mjs";

export const FAMILIES = { percent, ratio, balance, numberline, coordinate, data, geometry, exponents };

export function listFamilies() {
  return Object.values(FAMILIES).map((f) => ({ id: f.id, label: f.label }));
}

function family(name) {
  const f = Object.hasOwn(FAMILIES, name) ? FAMILIES[name] : null;
  if (!f) {
    throw new TypeError(`unknown model family "${name}" (have: ${Object.keys(FAMILIES).join(", ")})`);
  }
  return f;
}

/** Pure model: state, validate, undo, serialize, descriptions. No DOM. */
export function createModel(name, config) {
  return family(name).create(config);
}

/**
 * Builds the model and draws it into `rootEl`. Returns the model plus setLang(lang) and destroy().
 * readonly draws the same linked views with no handles, inputs or buttons.
 */
export function mountModel(rootEl, name, config, { lang = "en", onChange, readonly = false } = {}) {
  const f = family(name);
  const model = f.create(config);
  const view = f.mount(rootEl, model, { lang, onChange, readonly });
  return Object.assign(model, { root: rootEl, setLang: view.setLang, destroy: view.destroy });
}
