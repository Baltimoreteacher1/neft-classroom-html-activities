// Grades 3 to 5: "times as many", whole-number scaling and the biggest batch, ratio tables to 100, fractions of a batch,
// scaling by fractions, ordered pairs on a graph. Pure functions of (level, rng, grade). @fm2 FM-014 FM-053 FM-056 FM-060
import { int, pick, sample } from "../../rng.js";
import { add, gcd, mul } from "../../rational.js";
import { NAMES, TIMES } from "./contexts.js";
import { asR, attempt, both, list, makeBench, qty, R } from "./kit.js";
import { BATCHES, COOK, MIXES, PAIRS, PEOPLE, STICKER_ITEMS } from "./recipes.js";

const meta = ({ opts, fopts, ...row }) => row;
const BATCH_WORD = { one: { en: "batch", es: "tanda" }, many: { en: "batches", es: "tandas" } };
const BATCH_LABEL = { en: "Number of batches", es: "Número de tandas" };
const BATCH_ROW = { ...BATCHES, batchRow: true };
const recipeOf = (r) => ({ id: r.id, family: r.family, name: r.name });
const withFractions = COOK.filter((r) => r.rows.some((row) => row.fopts.length));

// 6. Grade 3: "times as many", forward (find the bigger group) and, at level 3, backward (find the smaller one).
export function timesAsMany(level, rng, grade) {
  return attempt(() => {
    const [a, b] = pick(rng, NAMES);
    const noun = pick(rng, STICKER_ITEMS);
    const base = level === 1 ? int(rng, 2, 5) : int(rng, 3, 9);
    const t = level === 1 ? int(rng, 2, 3) : int(rng, 2, 6);
    if (base * t > 60) return null;
    const plural = (lang) => noun.noun[lang][1];
    const common = {
      skillId: "times-as-many",
      level,
      grade,
      recipe: { id: "times", family: "group", name: { en: "stickers", es: "calcomanías" } },
      batchWord: {
        one: TIMES.noun.en && { en: "time as many", es: "vez la cantidad" },
        many: { en: "times as many", es: "veces la cantidad" },
      },
      batchLabel: { en: "Times as many", es: "Veces la cantidad" },
    };
    if (level < 3) {
      const item = { ...noun, key: "count" };
      return makeBench({
        ...common,
        hintKind: "scale",
        rows: [{ ...TIMES, key: "times", batchRow: true }, item],
        cols: [
          {
            per: { times: R(1), count: R(base) },
            pin: { key: "times", value: R(t) },
            ask: ["count"],
          },
        ],
        yourName: { en: `${b}'s group`, es: `Grupo de ${b}` },
        prompt: both((lang) =>
          lang === "en"
            ? `${a} has ${base} ${plural("en")}. ${b} has ${t} times as many ${plural("en")} as ${a}. How many ${plural("en")} does ${b} have?`
            : `${a} tiene ${base} ${plural("es")}. ${b} tiene ${t} veces la cantidad de ${plural("es")} que ${a}. ¿Cuántas ${plural("es")} tiene ${b}?`,
        ),
      });
    }
    const row = (who, key) => ({
      key,
      name: { en: `${who}'s ${plural("en")}`, es: `${cap1(plural("es"))} de ${who}` },
      noun: {
        en: [`${who}'s ${noun.noun.en[0]}`, `${who}'s ${plural("en")}`],
        es: [`${noun.noun.es[0]} de ${who}`, `${plural("es")} de ${who}`],
      },
    });
    return makeBench({
      ...common,
      hintKind: "inverse",
      view: "share",
      hide: true,
      rows: [row(a, "small"), row(b, "big")],
      cols: [{ per: { small: R(1), big: R(t) }, pin: { key: "big", value: R(base * t) }, ask: [] }],
      batchWord: {
        one: {
          en: `${noun.noun.en[0]} in ${a}'s group`,
          es: `${noun.noun.es[0]} en el grupo de ${a}`,
        },
        many: { en: `${plural("en")} in ${a}'s group`, es: `${plural("es")} en el grupo de ${a}` },
      },
      batchLabel: {
        en: `${cap1(plural("en"))} in ${a}'s group`,
        es: `${cap1(plural("es"))} en el grupo de ${a}`,
      },
      yourName: { en: `${a}'s group`, es: `Grupo de ${a}` },
      prompt: both((lang) =>
        lang === "en"
          ? `${b} has ${base * t} ${plural("en")}. That is ${t} times as many as ${a} has. How many ${plural("en")} does ${a} have?`
          : `${b} tiene ${base * t} ${plural("es")}. Es ${t} veces la cantidad que tiene ${a}. ¿Cuántas ${plural("es")} tiene ${a}?`,
      ),
    });
  });
}
const cap1 = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// 7. Grade 3: scale a recipe by a whole number (make enough for N people), or find the biggest whole batch you can afford.
export function scaleWhole(level, rng, grade) {
  return attempt(() => {
    const recipe = pick(
      rng,
      COOK.filter((r) => r.serves),
    );
    const serves = pick(rng, recipe.serves);
    const picked = sample(rng, recipe.rows, level === 1 ? 2 : 3);
    const per = { serves: R(serves) };
    for (const row of picked) per[row.key] = asR(pick(rng, row.opts));
    const rows = [PEOPLE, ...picked.map(meta)];
    const base = {
      skillId: "scale-whole",
      level,
      grade,
      hintKind: "scale",
      recipe: recipeOf(recipe),
      rows,
      batchWord: BATCH_WORD,
      batchLabel: BATCH_LABEL,
    };
    const name = recipe.name;
    if (level < 3) {
      const b = level === 1 ? pick(rng, [2, 3]) : int(rng, 2, 5);
      const ask = (level === 1 ? picked.slice(0, 1) : picked.slice(0, 2)).map((r) => r.key);
      return makeBench({
        ...base,
        cols: [{ per, pin: { key: "serves", value: R(serves * b) }, ask }],
        prompt: both((lang) =>
          lang === "en"
            ? `One batch of ${name.en} serves ${serves} people. You need to serve ${serves * b} people. Choose the batch, then fill in the missing amounts.`
            : `Una tanda de ${name.es} alcanza para ${serves} personas. Necesitas servir a ${serves * b} personas. Elige cuántas tandas y completa las cantidades que faltan.`,
        ),
      });
    }
    const tight = picked.find((r) => r.noun) || picked[0];
    const b = int(rng, 2, 5);
    return makeBench({
      ...base,
      hintKind: "limit",
      hide: true,
      exact: true,
      cols: [
        {
          per,
          limit: { have: { [tight.key]: R(asR(per[tight.key]).n * b) } },
          ask: picked.filter((r) => r !== tight).map((r) => r.key),
        },
      ],
      prompt: both((lang) => {
        const have = qty(tight, R(per[tight.key].n * b), lang);
        return lang === "en"
          ? `You only have ${have}. What is the biggest batch of ${name.en} you can make? Then fill in the other amounts it needs.`
          : `Solo tienes ${have}. ¿Cuál es la tanda más grande de ${name.es} que puedes hacer? Luego completa las otras cantidades que necesita.`;
      }),
    });
  });
}

// 8. Grade 4: ratio tables with whole numbers up to 100; each column pins one amount.
export function table100(level, rng, grade) {
  return attempt(() => {
    const set = pick(rng, PAIRS);
    const hi = level === 1 ? 4 : 7;
    const a = int(rng, 2, hi);
    const b = int(rng, 1, hi);
    if (a === b || gcd(a, b) !== 1) return null;
    const cols = level === 1 ? 2 : 3;
    const kMax = level === 1 ? 5 : level === 2 ? 12 : 20;
    const ks = sample(
      rng,
      Array.from({ length: kMax - 1 }, (_, i) => i + 2),
      cols,
    ).sort((x, y) => x - y);
    const A = set.a.key;
    const B = set.b.key;
    return makeBench({
      skillId: "table-100",
      level,
      grade,
      hintKind: "scale",
      view: "tape",
      line: true,
      recipe: { id: set.id, family: set.family, name: set.name },
      rows: [set.a, set.b],
      cols: ks.map((k, i) => {
        const onA = level === 1 || i % 2 === 0;
        return {
          label: { en: `Column ${i + 1}`, es: `Columna ${i + 1}` },
          per: { [A]: R(a), [B]: R(b) },
          pin: onA ? { key: A, value: R(a * k) } : { key: B, value: R(b * k) },
          ask: [onA ? B : A],
          showBase: i === 0,
        };
      }),
      batchWord: { one: { en: "set", es: "grupo" }, many: { en: "sets", es: "grupos" } },
      batchLabel: { en: "Number of sets", es: "Número de grupos" },
      prompt: both((lang) =>
        lang === "en"
          ? `A ${set.name.en} uses ${qty(set.a, R(a), "en")} for every ${qty(set.b, R(b), "en")}. Complete the table: pick the number of sets for each column, then fill in the missing number.`
          : `${set.esArt} ${set.name.es} usa ${qty(set.a, R(a), "es")} por cada ${qty(set.b, R(b), "es")}. Completa la tabla: elige el número de grupos de cada columna y escribe el número que falta.`,
      ),
    });
  });
}

// 9. Grades 4-5: fractions of a batch. Whole batches of fractional amounts, or half a batch of a crowd recipe.
export function fractionBatch(level, rng, grade) {
  return attempt(() => {
    const half = level > 1 && rng() < 0.4;
    if (!half) {
      const recipe = pick(rng, withFractions);
      const usable = recipe.rows.filter((r) => r.fopts.length);
      const picked = sample(rng, usable, Math.min(usable.length, level === 3 ? 2 : 1));
      const pers = picked.map((row) => {
        const options = level === 1 ? row.fopts.filter(([n]) => n === 1) : row.fopts;
        return options.length ? asR(pick(rng, options)) : null;
      });
      if (pers.includes(null)) return null;
      const b = level === 1 ? int(rng, 2, 6) : int(rng, 3, grade === 5 ? 12 : 8);
      const per = { batches: R(1) };
      picked.forEach((row, i) => {
        per[row.key] = pers[i];
      });
      return makeBench({
        skillId: "fraction-batch",
        level,
        grade,
        hintKind: "scale",
        recipe: recipeOf(recipe),
        rows: [BATCH_ROW, ...picked.map(meta)],
        cols: [{ per, pin: { key: "batches", value: R(b) }, ask: picked.map((r) => r.key) }],
        mult: [R(2)],
        batchWord: BATCH_WORD,
        batchLabel: BATCH_LABEL,
        prompt: both((lang) => {
          const bits = picked.map((row, i) => qty(row, pers[i], lang));
          return lang === "en"
            ? `One batch of ${recipe.name.en} uses ${list(bits, lang)}. You make ${b} batches. How much of each do you need?`
            : `Una tanda de ${recipe.name.es} lleva ${list(bits, lang)}. Haces ${b} tandas. ¿Cuánto necesitas de cada uno?`;
        }),
      });
    }
    const recipe = pick(
      rng,
      COOK.filter((r) => r.family === "crowd"),
    );
    const picked = sample(rng, recipe.rows, 2);
    const per = { batches: R(1) };
    for (const row of picked) per[row.key] = asR(pick(rng, row.opts));
    return makeBench({
      skillId: "fraction-batch",
      level,
      grade,
      hintKind: "scale",
      recipe: recipeOf(recipe),
      rows: [BATCH_ROW, ...picked.map(meta)],
      cols: [
        {
          per,
          pin: { key: "batches", value: R(1, 2) },
          ask: picked.map((r) => r.key),
          step: R(1, 2),
        },
      ],
      mult: [R(1, 2)],
      batchWord: BATCH_WORD,
      batchLabel: BATCH_LABEL,
      prompt: both((lang) => {
        const bits = picked.map((row) => qty(row, per[row.key], lang));
        return lang === "en"
          ? `One batch of ${recipe.name.en} uses ${list(bits, lang)}. Make half a batch. How much of each do you need?`
          : `Una tanda de ${recipe.name.es} lleva ${list(bits, lang)}. Haz media tanda. ¿Cuánto necesitas de cada uno?`;
      }),
    });
  });
}

// 10. Grade 5: scale by a fraction (including more than one whole), or find the biggest batch in steps of a half or quarter.
export function fractionScale(level, rng, grade) {
  return attempt(() => {
    const recipe = pick(rng, withFractions);
    const picked = sample(rng, recipe.rows, 3);
    const base = {
      skillId: "fraction-scale",
      level,
      grade,
      recipe: recipeOf(recipe),
      rows: [BATCH_ROW, ...picked.map(meta)],
      batchWord: BATCH_WORD,
      batchLabel: BATCH_LABEL,
    };
    const wholeOf = (row) => asR(pick(rng, row.opts));
    if (level < 3) {
      const scales =
        level === 1
          ? [
              [1, 2],
              [3, 2],
              [1, 4],
              [5, 2],
            ]
          : [
              [2, 3],
              [3, 4],
              [5, 4],
              [1, 3],
              [5, 3],
              [3, 2],
            ];
      const factor = asR(pick(rng, scales));
      const per = { batches: R(1) };
      picked.forEach((row, i) => {
        per[row.key] =
          level === 2 && i === 0 && row.fopts.length ? asR(pick(rng, row.fopts)) : wholeOf(row);
      });
      const asked = picked.slice(0, level === 1 ? 1 : 2).map((r) => r.key);
      const step = factor.d === 4 ? R(1, 4) : factor.d === 3 ? R(1, 3) : R(1, 2);
      return makeBench({
        ...base,
        hintKind: "scale",
        cols: [{ per, pin: { key: "batches", value: factor }, ask: asked, step }],
        mult: [R(2), R(1, 2)],
        prompt: both((lang) => {
          const bits = picked.map((row) => qty(row, per[row.key], lang));
          const what =
            factor.n > factor.d
              ? lang === "en"
                ? `${factor.n}/${factor.d} of a batch (more than one whole batch)`
                : `${factor.n}/${factor.d} de una tanda (más de una tanda entera)`
              : lang === "en"
                ? `${factor.n}/${factor.d} of a batch`
                : `${factor.n}/${factor.d} de una tanda`;
          return lang === "en"
            ? `One batch of ${recipe.name.en} uses ${list(bits, lang)}. Make ${what}. Fill in the missing amounts.`
            : `Una tanda de ${recipe.name.es} lleva ${list(bits, lang)}. Haz ${what}. Completa las cantidades que faltan.`;
        }),
      });
    }
    const step = pick(rng, [R(1, 2), R(1, 4)]);
    const b = R(int(rng, step.d + 1, 5 * step.d), step.d);
    const per = { batches: R(1) };
    for (const row of picked) per[row.key] = wholeOf(row);
    const [one, two, other] = picked;
    const tightFirst = rng() < 0.5;
    const roomy = add(b, mul(step, R(int(rng, 1, 3))));
    const have = (row, tight) => {
      const extra = mul(mul(per[row.key], step), pick(rng, [R(0), R(1, 4), R(1, 2), R(3, 4)]));
      return add(mul(per[row.key], tight ? b : roomy), tight ? extra : R(0));
    };
    const cols = [{ per, limit: { have: { [one.key]: have(one, tightFirst), [two.key]: have(two, !tightFirst) } }, ask: [other.key], step }];
    return makeBench({
      ...base,
      hintKind: "limit",
      hide: true,
      remainder: true,
      cols,
      prompt: both((lang) => {
        const haves = [one, two].map((row, i) =>
          qty(row, [cols[0].limit.have[one.key], cols[0].limit.have[two.key]][i], lang),
        );
        const stepText = `${step.n}/${step.d}`;
        return lang === "en"
          ? `You only have ${list(haves, lang)}. Batches go up in steps of ${stepText}. What is the biggest batch of ${recipe.name.en} you can make? Fill in how much ${other.name.en} it needs.`
          : `Solo tienes ${list(haves, lang)}. Las tandas suben de ${stepText} en ${stepText}. ¿Cuál es la tanda más grande de ${recipe.name.es} que puedes hacer? Escribe cuánto ${other.name.es} necesita.`;
      }),
    });
  });
}
// 11. Grade 5: ordered pairs. The batch moves a point along the graph; the table asks for the other coordinate.
export function graphPairs(level, rng, grade) {
  return attempt(() => {
    const mix = pick(
      rng,
      MIXES.filter((m) => m.a.unit === "cup" && m.b.unit === "cup"),
    );
    const a = int(rng, 1, 5);
    const b = int(rng, 2, 7);
    if (a === b || gcd(a, b) !== 1) return null;
    const cols = level === 3 ? 3 : 2;
    const kMax = level === 1 ? 5 : level === 2 ? 8 : 10;
    const ks = sample(
      rng,
      Array.from({ length: kMax - 1 }, (_, i) => i + 2),
      cols,
    ).sort((x, y) => x - y);
    const A = mix.a.key;
    const B = mix.b.key;
    const round = makeBench({
      skillId: "graph-pairs",
      level,
      grade,
      hintKind: "scale",
      view: "graph",
      recipe: { id: mix.id, family: mix.family, name: mix.name },
      rows: [mix.a, mix.b],
      cols: ks.map((k, i) => {
        const onA = level < 3 || i !== 1;
        return {
          label: { en: `Point ${i + 1}`, es: `Punto ${i + 1}` },
          per: { [A]: R(a), [B]: R(b) },
          pin: onA ? { key: A, value: R(a * k) } : { key: B, value: R(b * k) },
          ask: [onA ? B : A],
          showBase: i === 0,
        };
      }),
      batchWord: { one: { en: "batch", es: "tanda" }, many: { en: "batches", es: "tandas" } },
      batchLabel: BATCH_LABEL,
      prompt: both((lang) =>
        lang === "en"
          ? `A ${mix.mixName.en} uses ${qty(mix.a, R(a), "en")} for every ${qty(mix.b, R(b), "en")}. Each batch gives one point on the graph. Complete the table for the points.`
          : `Una ${mix.mixName.es} usa ${qty(mix.a, R(a), "es")} por cada ${qty(mix.b, R(b), "es")}. Cada tanda da un punto en la gráfica. Completa la tabla de los puntos.`,
      ),
    });
    const top = (key, per) =>
      Math.max(
        ...round.cols.map((c) => Math.ceil(Number(c.per[key].n) * (c.batch.n / c.batch.d)) + 1),
        per * 2,
      );
    const nice = (v) => [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100].find((m) => m >= v) ?? v;
    round.graph = { xKey: A, yKey: B, xMax: nice(top(A, a)), yMax: nice(top(B, b)) };
    return round;
  });
}
