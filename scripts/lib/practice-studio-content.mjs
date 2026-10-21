// Content checks for Practice Studio multiple-choice items: the named misconception behind every wrong choice
// (data/practice-studio/misconceptions.json), Spanish choices, and wrong choices that are secretly right.
// Pure functions; tools/studio-content.test.mjs runs them over every generated studio.

/** Unit words and symbols that read the same in Spanish, so a choice made only of them needs no `cEs`. */
const SAME_IN_SPANISH = new Set(
  "cm mm km kg mg in ft yd mi lb oz ml min sec hr IQR MAD Q1 Q2 Q3".split(" "),
);

/** True when a choice has words a Spanish reader needs translated ("146 boxes", "The range"), not just a number. */
export function needsSpanish(/** @type {unknown} */ choice) {
  return String(choice)
    .split(/[^A-Za-zÀ-ÿ0-9²³]+/)
    .some((w) => /[A-Za-z]{2,}/.test(w) && !SAME_IN_SPANISH.has(w.replace(/[²³]$/, "")));
}

/**
 * The exact value of a choice that is only a number, as { v, unit }, or null. Reads whole numbers, decimals, fractions,
 * mixed numbers, percents (as a share of 1) and money, with an optional trailing unit or variable ("12 boxes", "36 m²",
 * "7x"). Two choices are the same only when both the value and the unit match, so "36 m²" and "36 m" are different.
 * @returns {{v: number, unit: string}|null}
 */
export function choiceValue(/** @type {unknown} */ choice) {
  let t = String(choice)
    .trim()
    .replace(/^about\s+/i, "")
    .replace(/[−–]/g, "-")
    .replace(/(\d),(?=\d{3}\b)/g, "$1");
  let unit = "";
  const u = /^(.*?\d)\s*([A-Za-z²³]+\.?)$/.exec(t);
  if (u) {
    t = u[1];
    unit = u[2].toLowerCase();
  }
  const money = /^(-?)\$(.*)$/.exec(t);
  if (money) t = money[1] + money[2];
  let scale = 1;
  if (t.endsWith("%")) {
    t = t.slice(0, -1).trim();
    scale = 0.01;
  }
  let v = null;
  let m = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (m) v = (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  else if ((m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(t)) && Number(m[2]) !== 0)
    v = Number(m[1]) / Number(m[2]);
  else if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) v = Number(t);
  return v === null ? null : { v: v * scale, unit };
}

/** Indexes [i, j] of two choices with the same value and unit (a wrong choice that is secretly right, or a twin). */
export function equivalentChoices(/** @type {unknown[]} */ choices) {
  const vals = choices.map(choiceValue);
  for (let i = 0; i < vals.length; i++)
    for (let j = i + 1; j < vals.length; j++) {
      const a = vals[i];
      const b = vals[j];
      if (a && b && a.unit === b.unit && Math.abs(a.v - b.v) < 1e-9) return [i, j];
    }
  return null;
}

/** Problems with the taxonomy file itself. `engineIds` is the set of ids in engine/core/misconceptions.js. */
export function taxonomyProblems(
  /** @type {Record<string, any>} */ traps,
  /** @type {Set<string>} */ engineIds,
  /** @type {number[]} */ units,
) {
  const p = [];
  const words = (/** @type {unknown} */ s) => String(s).trim().split(/\s+/).length;
  for (const [id, t] of Object.entries(traps)) {
    const bad = (/** @type {string} */ m) => p.push(`misconceptions.json ${id}: ${m}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(id)) bad("id must be kebab-case");
    for (const f of ["name", "nameEs", "desc", "descEs", "fix", "fixEs"])
      if (typeof t[f] !== "string" || t[f].trim().length < 3) bad(`needs ${f}`);
    if (words(t.name) > 6 || words(t.nameEs) > 6) bad("name and nameEs must be 6 words or fewer");
    for (const [en, es] of [
      ["name", "nameEs"],
      ["desc", "descEs"],
      ["fix", "fixEs"],
    ])
      if (t[en] && t[en] === t[es]) bad(`${es} repeats the English`);
    if (!Array.isArray(t.units) || !t.units.length || t.units.some((u) => !units.includes(u)))
      bad(`units must list studio units (${units.join(", ")})`);
    if (t.engine === true && !engineIds.has(id))
      bad("marked engine:true but engine/core/misconceptions.js has no such id");
    if (t.engine !== true && engineIds.has(id))
      bad("shares an engine id: mark it engine:true so the two stay one idea");
  }
  return p;
}

/**
 * Problems with one rendered multiple-choice item. `strict` = its unit is fully tagged (not on the pending list):
 * every wrong choice must name a known trap and text choices need Spanish. Twins are checked in every unit.
 */
export function mcProblems(
  /** @type {any} */ it,
  /** @type {string} */ where,
  /** @type {Record<string, any>} */ traps,
  /** @type {boolean} */ strict,
) {
  const p = [];
  const bad = (/** @type {string} */ m) => p.push(`${where}: ${m}`);
  const twins = equivalentChoices(it.c);
  if (twins)
    bad(
      `choices ${twins[0]} and ${twins[1]} have the same value ("${it.c[twins[0]]}", "${it.c[twins[1]]}")`,
    );
  if (it.tag !== undefined) {
    if (!Array.isArray(it.tag) || it.tag.length !== it.c.length) bad("tag[] must align with c[]");
    else if (it.tag[it.a]) bad("the right choice must not carry a tag");
  }
  if (!strict) return p;
  it.c.forEach((/** @type {unknown} */ _c, /** @type {number} */ i) => {
    if (i === it.a) return;
    const t = Array.isArray(it.tag) ? it.tag[i] : null;
    if (!t) bad(`wrong choice ${i} ("${it.c[i]}") names no misconception`);
    else if (!traps[t]) bad(`wrong choice ${i} names unknown trap "${t}"`);
  });
  if (!Array.isArray(it.cEs) && it.c.some(needsSpanish)) bad("text choices need cEs (Spanish)");
  if (Array.isArray(it.cEs) && it.cEs.length !== it.c.length) bad("cEs[] must align with c[]");
  return p;
}
