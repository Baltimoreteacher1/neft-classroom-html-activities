// Our Class Investigation — the authored investigation templates.
//
// ONE source of truth. The browser (form, charts, unit tools), the Pages
// Function that validates every contribution, and the tests all import this
// file, so the question a student is asked and the value the server accepts
// cannot drift apart.
//
// PRIVACY BY SHAPE. A field is either a number inside a hard range or one choice
// from a fixed list. There is no free-text field anywhere, so no name, address,
// nickname or sentence can reach the dataset: the server rejects any key that is
// not declared here. Variables are deliberately neutral. Nothing about weight,
// health, body image, family income or where a student lives is, or may be,
// asked. Arm span and height exist only as an OPTIONAL ratio exploration that a
// teacher must switch on, that defaults OFF, and that every student may skip.
//
// Pure ES module: no DOM, no imports, runs in the browser, Workers and Node.

/** @typedef {{ en: string, es: string }} Bilingual */

/**
 * @typedef {object} Field
 * @property {string} id           camelCase key stored in the dataset
 * @property {"number"|"choice"} kind
 * @property {Bilingual} label
 * @property {Bilingual} short     a few words, for use inside a sentence
 * @property {Bilingual} [help]    one plain sentence on HOW to measure
 * @property {Bilingual} [unit]    shown beside the number, e.g. cm
 * @property {number} [min]        hard floor: the server refuses less
 * @property {number} [max]        hard ceiling: the server refuses more
 * @property {number} [likelyMin]  below this the form asks "are you sure?"
 * @property {number} [likelyMax]  above this the form asks "are you sure?"
 * @property {number} [step]       1 for counts, 0.5 for centimetres
 * @property {{ id: string, label: Bilingual }[]} [choices]
 * @property {boolean} [optional]  a student may leave it blank
 * @property {string} [option]     only present when the class option is on
 */

/**
 * @typedef {object} Template
 * @property {string} id
 * @property {Bilingual} title
 * @property {Bilingual} question  the one real question the class is asking
 * @property {Bilingual} why       why a mathematician would care
 * @property {Field[]} fields
 * @property {number} maxPerContributor
 * @property {{ id: string, defaultOn: boolean, label: Bilingual, note: Bilingual }[]} options
 */

export const TEMPLATES = Object.freeze([
  {
    id: "get-to-school",
    title: { en: "How do we get to school?", es: "¿Cómo llegamos a la escuela?" },
    question: {
      en: "How does our class get to school in the morning?",
      es: "¿Cómo llega nuestra clase a la escuela por la mañana?",
    },
    why: {
      en: "A category question: we count each way, then turn the counts into percents of the whole class.",
      es: "Una pregunta de categorías: contamos cada forma y convertimos los conteos en porcentajes de toda la clase.",
    },
    maxPerContributor: 1,
    options: [],
    fields: [
      {
        id: "mode",
        short: { en: "way to school", es: "forma de llegar" },
        kind: "choice",
        label: { en: "How did you get here today?", es: "¿Cómo llegaste hoy?" },
        help: {
          en: "Pick the way you travel most mornings.",
          es: "Elige la forma en que viajas casi todas las mañanas.",
        },
        choices: [
          { id: "walk", label: { en: "Walk", es: "Caminando" } },
          { id: "bus", label: { en: "Bus", es: "Autobús" } },
          { id: "car", label: { en: "Car", es: "Carro" } },
          { id: "bike", label: { en: "Bike or scooter", es: "Bicicleta o scooter" } },
          { id: "other", label: { en: "Another way", es: "De otra manera" } },
        ],
      },
    ],
  },
  {
    id: "door-to-seat",
    title: {
      en: "Steps from the door to our seat",
      es: "Pasos de la puerta a nuestro asiento",
    },
    question: {
      en: "How many steps does it take to walk from the classroom door to your seat, and from your seat to the board?",
      es: "¿Cuántos pasos das de la puerta del salón a tu asiento, y de tu asiento al pizarrón?",
    },
    why: {
      en: "Two counts from one person. Compare them as a ratio, plot them as points, and see how steps vary across the class.",
      es: "Dos conteos de una misma persona. Compáralos como razón, represéntalos como puntos y mira cómo varían los pasos en la clase.",
    },
    maxPerContributor: 1,
    options: [],
    fields: [
      {
        id: "stepsSeat",
        short: { en: "steps to your seat", es: "pasos a tu asiento" },
        kind: "number",
        label: { en: "Steps from the door to your seat", es: "Pasos de la puerta a tu asiento" },
        help: {
          en: "Walk it at your normal speed and count each step.",
          es: "Camina a tu paso normal y cuenta cada paso.",
        },
        unit: { en: "steps", es: "pasos" },
        min: 1,
        max: 100,
        likelyMin: 2,
        likelyMax: 45,
        step: 1,
      },
      {
        id: "stepsBoard",
        short: { en: "steps to the board", es: "pasos al pizarrón" },
        kind: "number",
        label: { en: "Steps from your seat to the board", es: "Pasos de tu asiento al pizarrón" },
        help: {
          en: "Same normal walk, same way of counting.",
          es: "El mismo paso normal y la misma forma de contar.",
        },
        unit: { en: "steps", es: "pasos" },
        min: 1,
        max: 100,
        likelyMin: 2,
        likelyMax: 45,
        step: 1,
      },
    ],
  },
  {
    id: "pencil-handspan",
    title: { en: "Pencil length vs. hand span", es: "Largo del lápiz y palmo de la mano" },
    question: {
      en: "Is a longer hand span connected to a longer pencil?",
      es: "¿Un palmo más largo está relacionado con un lápiz más largo?",
    },
    why: {
      en: "Two measurements from one person. Are they in a steady ratio? Does one go up when the other does?",
      es: "Dos medidas de una misma persona. ¿Están en una razón constante? ¿Una sube cuando la otra sube?",
    },
    maxPerContributor: 1,
    options: [
      {
        id: "armHeight",
        defaultOn: false,
        label: {
          en: "Also explore arm span and height (optional)",
          es: "Explorar también la envergadura y la estatura (opcional)",
        },
        note: {
          en: "Off by default. Every student can skip these two boxes, and nothing is shown for one person.",
          es: "Desactivado por defecto. Cada estudiante puede omitir estas dos casillas, y no se muestra nada de una sola persona.",
        },
      },
    ],
    fields: [
      {
        id: "pencil",
        short: { en: "pencil length", es: "largo del lápiz" },
        kind: "number",
        label: { en: "Length of your pencil", es: "Largo de tu lápiz" },
        help: {
          en: "Lay it along a ruler, from the tip to the end. Use the nearest half centimeter.",
          es: "Colócalo junto a una regla, de la punta al final. Usa el medio centímetro más cercano.",
        },
        unit: { en: "cm", es: "cm" },
        min: 2,
        max: 30,
        likelyMin: 5,
        likelyMax: 20,
        step: 0.5,
      },
      {
        id: "handSpan",
        short: { en: "hand span", es: "palmo" },
        kind: "number",
        label: { en: "Your hand span", es: "El palmo de tu mano" },
        help: {
          en: "Spread your fingers wide. Measure from the tip of your thumb to the tip of your little finger, to the nearest half centimeter.",
          es: "Abre los dedos al máximo. Mide de la punta del pulgar a la punta del meñique, al medio centímetro más cercano.",
        },
        unit: { en: "cm", es: "cm" },
        min: 8,
        max: 30,
        likelyMin: 12,
        likelyMax: 24,
        step: 0.5,
      },
      {
        id: "armSpan",
        short: { en: "arm span", es: "envergadura" },
        kind: "number",
        option: "armHeight",
        optional: true,
        label: { en: "Arm span (optional)", es: "Envergadura (opcional)" },
        help: {
          en: "Skip this box if you like. With a partner, measure fingertip to fingertip with arms stretched out.",
          es: "Puedes omitir esta casilla. Con un compañero, mide de punta de dedo a punta de dedo con los brazos abiertos.",
        },
        unit: { en: "cm", es: "cm" },
        min: 80,
        max: 220,
        likelyMin: 120,
        likelyMax: 190,
        step: 0.5,
      },
      {
        id: "height",
        short: { en: "height", es: "estatura" },
        kind: "number",
        option: "armHeight",
        optional: true,
        label: { en: "Height (optional)", es: "Estatura (opcional)" },
        help: {
          en: "Skip this box if you like. Only add it if you want to.",
          es: "Puedes omitir esta casilla. Agrégala solo si quieres.",
        },
        unit: { en: "cm", es: "cm" },
        min: 80,
        max: 220,
        likelyMin: 120,
        likelyMax: 190,
        step: 0.5,
      },
    ],
  },
]);

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** @param {unknown} id @returns {Template | null} */
export function getTemplate(id) {
  return /** @type {Template | null} */ (TEMPLATES.find((t) => t.id === id) ?? null);
}

/**
 * The options a template offers, as `{ id: boolean }` with every default applied.
 * Unknown ids are dropped, non-booleans fall back to the default.
 * @param {Template} template
 * @param {unknown} [given]
 */
export function resolveOptions(template, given) {
  /** @type {Record<string, boolean>} */
  const out = {};
  const src =
    given && typeof given === "object" ? /** @type {Record<string, unknown>} */ (given) : {};
  for (const opt of template.options) {
    out[opt.id] = typeof src[opt.id] === "boolean" ? src[opt.id] === true : opt.defaultOn;
  }
  return out;
}

/**
 * The fields a student is asked for under the chosen options. A field that
 * belongs to an option that is off does not exist for that class: the form does
 * not draw it and the server rejects it.
 * @param {Template} template
 * @param {Record<string, boolean>} options
 * @returns {Field[]}
 */
export function activeFields(template, options) {
  return template.fields.filter((f) => !f.option || options[f.option] === true);
}

/** Numeric fields (what scatter, ratio and statistics can use). */
export const numericFields = (/** @type {Field[]} */ fields) =>
  fields.filter((f) => f.kind === "number");

/** Choice fields (what a bar chart and "percent of the class" can use). */
export const choiceFields = (/** @type {Field[]} */ fields) =>
  fields.filter((f) => f.kind === "choice");

/**
 * Which unit tools a template can honestly offer, derived from its fields
 * rather than authored, so a template cannot promise a tool its data cannot feed.
 * @param {Field[]} fields
 * @returns {Record<"u2"|"u3"|"u4"|"u7"|"u9", boolean>}
 */
export function availableHooks(fields) {
  const n = numericFields(fields).length;
  const c = choiceFields(fields).length;
  return { u2: n >= 1, u3: n >= 2, u4: c >= 1, u7: n >= 2, u9: n >= 2 };
}

/**
 * The units that add a tool, in district pacing order (Unit 2 is taught last).
 * No dates here on purpose: live pacing lives in the planner, and a second copy
 * of the calendar would be wrong the first time a week moves.
 */
export const UNIT_HOOKS = Object.freeze([
  {
    id: "u3",
    unit: 3,
    name: { en: "Ratios & Rates", es: "Razones y tasas" },
  },
  {
    id: "u4",
    unit: 4,
    name: { en: "Percentages", es: "Porcentajes" },
  },
  {
    id: "u7",
    unit: 7,
    name: { en: "The Coordinate Plane", es: "El plano de coordenadas" },
  },
  {
    id: "u9",
    unit: 9,
    name: { en: "Relationships Between Two Variables", es: "Relaciones entre dos variables" },
  },
  {
    id: "u2",
    unit: 2,
    name: { en: "Statistics", es: "Estadística" },
  },
]);
