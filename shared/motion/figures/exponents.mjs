// The exponent-copies model as a registered figure (key power:order, lessons 6-3 and 6-4), so the Think it through flow reaches the
// exponent lessons too. The picture, scene and text equivalent are the exponent-copies modules; the lab's controls are base 2-5,
// exponent 1-5 and an amount added after the power, and its readout is a^b + c (curriculum/learning-labs/shared/math.mjs).
import { commas } from "../exact.mjs";
import { describe, exponentModel } from "../exponent-copies.mjs";
import { exponentScene } from "../exponent-copies-motion.mjs";
import { renderExponent } from "../exponent-copies-render.mjs";

/** @type {(key: string) => import("./mount.mjs").Control[]} */
const controls = () => [
  { label: "Base number", labelEs: "Número base", min: 2, max: 5, step: 1 },
  { label: "Exponent", labelEs: "Exponente", min: 1, max: 5, step: 1 },
  { label: "Amount added after the power", labelEs: "Cantidad que se suma después de la potencia", min: 0, max: 12, step: 1 },
];

/** @param {number[]} values */
function build(_key, values) {
  const [b, e, c] = values;
  const ok = (/** @type {number} */ n, /** @type {number} */ lo, /** @type {number} */ hi) => Number.isInteger(n) && n >= lo && n <= hi;
  if (!ok(b, 2, 5) || !ok(e, 1, 5) || !ok(c, 0, 12)) throw new RangeError("Base 2 to 5, exponent 1 to 5, amount added 0 to 12.");
  return { m: exponentModel(b, e), c };
}

/** @type {import("./mount.mjs").Figure} */
const figure = {
  id: "exponent-copies",
  keys: ["power:order"],
  title: { en: "A power is repeated copies: each step makes the base many copies of the block before it", es: "Una potencia son copias repetidas: cada paso hace tantas copias del bloque anterior como indica la base" },
  controls,
  build,
  render(model, { lang, width }) {
    const r = renderExponent(model.m, { lang, compact: true, width });
    return { body: r.body, width: r.width, height: r.height };
  },
  scene: (root, model) => exponentScene(root, model.m.steps.length),
  describe(model, lang) {
    const add = model.c ? (lang === "es" ? ` Después se suma ${model.c}: ${commas(model.m.value)} + ${model.c} = ${commas(model.m.value + BigInt(model.c))}.` : ` Then add ${model.c}: ${commas(model.m.value)} + ${model.c} = ${commas(model.m.value + BigInt(model.c))}.`) : "";
    return describe(model.m, lang) + add;
  },
  headline(model, lang) {
    return { label: lang === "es" ? "Valor de la expresión" : "Value of the expression", value: String(model.m.value + BigInt(model.c)) };
  },
  wrong(model, lang) {
    const wrongValue = BigInt(model.m.base) * BigInt(model.m.exponent) + BigInt(model.c);
    if (wrongValue === model.m.value + BigInt(model.c)) return null;
    return { value: String(wrongValue), say: lang === "es" ? "Multiplicó la base por el exponente en lugar de usar la base como factor tantas veces." : "Multiplied the base by the exponent instead of using the base as a factor that many times." };
  },
};
export default [figure];
