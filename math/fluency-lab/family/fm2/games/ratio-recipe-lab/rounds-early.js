// Kindergarten to grade 2: equal groups in bowls, more or fewer, sharing equally, doubling and halving, repeated addition.
// Each generator is a pure function of (level, rng, grade) and returns a workbench round. @fm2 FM-014 FM-051 FM-061
import { int, pick, sample } from "../../rng.js";
import { HOLDERS } from "./contexts.js";
import { attempt, both, list, makeBench, qty, R } from "./kit.js";
import { BATCHES, BOWLS, K_ITEMS, measured } from "./recipes.js";

const BOWL_WORD = { one: { en: "bowl", es: "tazón" }, many: { en: "bowls", es: "tazones" } };
const BOWL_ROW = { ...BOWLS, batchRow: true };
const SNACK = {
  id: "snack",
  family: "cook",
  name: { en: "snack bowls", es: "tazones de merienda" },
};
const YOUR_BOWLS = { en: "Your bowls", es: "Tus tazones" };

// 1. Equal groups: "Each bowl gets 2 scoops. Fill 3 bowls."
export function bowlsGroups(level, rng, grade) {
  const spec =
    grade === 0
      ? [
          { per: [2, 3], bowls: [2, 3], cap: 6 },
          { per: [2, 5], bowls: [2, 5], cap: 10 },
          { per: [2, 4], bowls: [2, 5], cap: 10 },
        ][level - 1]
      : [
          { per: [2, 4], bowls: [2, 4], cap: 10 },
          { per: [3, 5], bowls: [3, 5], cap: 20 },
          { per: [2, 5], bowls: [3, 5], cap: 20 },
        ][level - 1];
  return attempt(() => {
    const items = sample(rng, K_ITEMS, level === 3 ? 2 : 1);
    const pers = items.map(() => int(rng, spec.per[0], spec.per[1]));
    const bowls = int(rng, spec.bowls[0], spec.bowls[1]);
    if (pers.some((p) => p * bowls > spec.cap)) return null;
    const per = { bowls: R(1) };
    items.forEach((row, i) => {
      per[row.key] = R(pers[i]);
    });
    return makeBench({
      skillId: "bowls-groups",
      level,
      grade,
      hintKind: "count",
      recipe: SNACK,
      rows: [BOWL_ROW, ...items],
      cols: [{ per, pin: { key: "bowls", value: R(bowls) }, ask: items.map((r) => r.key) }],
      batchWord: BOWL_WORD,
      batchLabel: { en: "Number of bowls", es: "Número de tazones" },
      yourName: YOUR_BOWLS,
      prompt: both((lang) => {
        const bits = items.map((row, i) => qty(row, R(pers[i]), lang));
        if (lang === "en")
          return `Each bowl gets ${list(bits, lang)}. Fill ${bowls} bowls. How many scoops ${items.length > 1 ? "of each" : `of ${items[0].name.en}`} are in all the bowls?`;
        return `Cada tazón lleva ${list(bits, lang)}. Llena ${bowls} tazones. ¿Cuántos cucharones ${items.length > 1 ? "de cada uno" : `de ${items[0].name.es}`} hay en todos los tazones?`;
      }),
    });
  });
}

// 2. More or fewer: two trays of bowls; which holds more, and (level 3) by how many.
export function moreFewer(level, rng, grade) {
  const cap = grade === 0 ? (level === 1 ? 6 : 10) : 20;
  return attempt(() => {
    const item = pick(rng, K_ITEMS);
    const perA = int(rng, 2, level === 1 ? 3 : 5);
    const perB = level === 1 ? perA : int(rng, 2, 5);
    const bowlsA = int(rng, 1, 5);
    const bowlsB = int(rng, 1, 5);
    const totalA = bowlsA * perA;
    const totalB = bowlsB * perB;
    if (totalA === totalB || totalA > cap || totalB > cap) return null;
    const trap = (bowlsA - bowlsB) * (totalA - totalB) < 0;
    if (level === 3 && !trap) return null;
    const answer = totalA > totalB ? 0 : 1;
    const label = (tray) => ({ en: `Tray ${tray}`, es: `Bandeja ${tray}` });
    const col = (tray, bowls, per) => ({
      label: label(tray),
      per: { bowls: R(1), [item.key]: R(per) },
      pin: { key: "bowls", value: R(bowls) },
      ask: level === 1 ? [] : [item.key],
    });
    return makeBench({
      skillId: "more-fewer",
      level,
      grade,
      hintKind: "compare-count",
      recipe: SNACK,
      rows: [BOWL_ROW, item],
      cols: [col("A", bowlsA, perA), col("B", bowlsB, perB)],
      batchWord: BOWL_WORD,
      batchLabel: { en: "Number of bowls", es: "Número de tazones" },
      pick: {
        question: { en: "Which tray has more scoops?", es: "¿Qué bandeja tiene más cucharones?" },
        options: [label("A"), label("B")],
        answer,
        wrong: trap ? "pick-more-bowls" : "pick-fewer",
      },
      extra:
        level === 3
          ? [
              {
                key: "diff",
                kind: "num",
                answer: R(Math.abs(totalA - totalB)),
                label: { en: "How many more scoops?", es: "¿Cuántos cucharones más?" },
              },
            ]
          : [],
      prompt: both((lang) => {
        const bowls = (n) => qty(BOWLS, R(n), lang);
        if (level === 1) {
          return lang === "en"
            ? `Tray A has ${bowls(bowlsA)} and Tray B has ${bowls(bowlsB)}. Each bowl has ${qty(item, R(perA), lang)}. Which tray has more scoops?`
            : `La bandeja A tiene ${bowls(bowlsA)} y la bandeja B tiene ${bowls(bowlsB)}. Cada tazón tiene ${qty(item, R(perA), lang)}. ¿Qué bandeja tiene más cucharones?`;
        }
        const tail = level === 3 ? (lang === "en" ? " How many more?" : " ¿Cuántos más?") : "";
        return lang === "en"
          ? `Tray A has ${bowls(bowlsA)} with ${qty(item, R(perA), lang)} in each. Tray B has ${bowls(bowlsB)} with ${qty(item, R(perB), lang)} in each. Which tray has more scoops?${tail}`
          : `La bandeja A tiene ${bowls(bowlsA)} con ${qty(item, R(perA), lang)} en cada uno. La bandeja B tiene ${bowls(bowlsB)} con ${qty(item, R(perB), lang)} en cada uno. ¿Qué bandeja tiene más cucharones?${tail}`;
      }),
    });
  });
}

// 3. Sharing equally: the batch IS the answer (how many in each bowl); the total is the goal.
export function shareBowls(level, rng, grade) {
  const table = {
    0: [{ bowls: [2, 2], each: [1, 4] }, { bowls: [2, 3], each: [2, 4] }, { bowls: [2, 3], each: [3, 5] }],
    1: [{ bowls: [2, 2], each: [2, 5] }, { bowls: [2, 4], each: [2, 5] }, { bowls: [3, 4], each: [3, 5] }],
    2: [{ bowls: [2, 3], each: [2, 5] }, { bowls: [2, 5], each: [3, 5] }, { bowls: [3, 5], each: [3, 5] }],
  };
  const spec = table[grade][level - 1];
  const cap = grade === 0 ? 10 : 20;
  return attempt(() => {
    const item = pick(rng, K_ITEMS);
    const bowls = int(rng, spec.bowls[0], spec.bowls[1]);
    const each = int(rng, spec.each[0], spec.each[1]);
    if (bowls * each > cap || each === bowls) return null;
    const total = bowls * each;
    const inEach = measured("each", "in each bowl", "en cada tazón", "scoop");
    const inAll = measured("all", "in all", "en total", "scoop");
    return makeBench({
      skillId: "share-bowls",
      level,
      grade,
      hintKind: "inverse",
      view: "share",
      hide: level === 3,
      recipe: SNACK,
      rows: [inEach, inAll],
      cols: [{ per: { each: R(1), all: R(bowls) }, pin: { key: "all", value: R(total) }, ask: [] }],
      batchWord: {
        one: { en: "scoop in each bowl", es: "cucharón en cada tazón" },
        many: { en: "scoops in each bowl", es: "cucharones en cada tazón" },
      },
      batchLabel: { en: "Scoops in each bowl", es: "Cucharones en cada tazón" },
      yourName: { en: "Your share", es: "Tu reparto" },
      prompt: both((lang) =>
        lang === "en"
          ? `Share ${total} scoops of ${item.name.en} equally into ${bowls} bowls. How many scoops go in each bowl?`
          : `Reparte ${total} cucharones de ${item.name.es} en partes iguales entre ${bowls} tazones. ¿Cuántos cucharones lleva cada tazón?`,
      ),
    });
  });
}

// 4. Doubling and halving a small snack-mix recipe.
export function doubleHalf(level, rng, grade) {
  return attempt(() => {
    const half = level > 1 && rng() < 0.5;
    const count = level === 3 ? 3 : 2;
    const items = sample(rng, K_ITEMS, count);
    const pers = items.map(() =>
      half
        ? int(rng, 1, grade === 1 ? 8 : 10) * 2
        : int(rng, 1, level === 1 ? 5 : grade === 1 ? 9 : 10),
    );
    const pin = half ? R(1, 2) : R(2);
    const per = { batches: R(1) };
    items.forEach((row, i) => {
      per[row.key] = R(pers[i]);
    });
    return makeBench({
      skillId: "double-half",
      level,
      grade,
      hintKind: "scale",
      recipe: SNACK,
      rows: [{ ...BATCHES, batchRow: true },
        ...items,
      ],
      cols: [
        { per, pin: { key: "batches", value: pin }, ask: items.map((r) => r.key), step: R(1, 2) },
      ],
      mult: [R(2), R(1, 2)],
      batchWord: { one: { en: "batch", es: "tanda" }, many: { en: "batches", es: "tandas" } },
      batchLabel: { en: "Number of batches", es: "Número de tandas" },
      prompt: both((lang) => {
        const bits = items.map((row, i) => qty(row, R(pers[i]), lang));
        if (lang === "en")
          return `The snack mix uses ${list(bits, lang)}. Make ${half ? "half a batch" : "a double batch"}. How many scoops of each?`;
        return `La mezcla de merienda lleva ${list(bits, lang)}. Haz ${half ? "media tanda" : "una tanda doble"}. ¿Cuántos cucharones de cada uno?`;
      }),
    });
  });
}

// 5. Repeated addition for batches: a table for several numbers of trays.
export function repeatBatch(level, rng, grade) {
  const perChoices = level === 1 ? [2, 5, 10] : level === 2 ? [2, 3, 4, 5] : [3, 4, 5, 6];
  return attempt(() => {
    const set = pick(rng, HOLDERS);
    const per = pick(rng, perChoices);
    const options = [];
    for (let b = 2; b * per <= 20; b += 1) options.push(b);
    const want = level === 1 ? 2 : 3;
    if (options.length < want) return null;
    const bs = sample(rng, options, want).sort((a, b) => a - b);
    const holder = { ...set.holder, batchRow: true };
    const item = set.item;
    return makeBench({
      skillId: "repeat-batch",
      level,
      grade,
      hintKind: "scale",
      recipe: { id: "trays", family: "group", name: { en: "trays", es: "bandejas" } },
      rows: [holder, item],
      cols: bs.map((b, i) => ({
        label: both((lang) => qty(holder, R(b), lang)) && {
          en: qty(holder, R(b), "en"),
          es: qty(holder, R(b), "es"),
        },
        per: { holders: R(1), items: R(per) },
        pin: { key: "holders", value: R(b) },
        ask: ["items"],
        showBase: i === 0,
      })),
      sum: "items",
      mult: level === 3 ? [R(2)] : [],
      batchWord: {
        one: { en: holder.noun.en[0], es: holder.noun.es[0] },
        many: { en: holder.noun.en[1], es: holder.noun.es[1] },
      },
      batchLabel: { en: `Number of ${holder.noun.en[1]}`, es: `Número de ${holder.noun.es[1]}` },
      prompt: both((lang) => {
        const names = bs.map((b) => b);
        const nums = lang === "en" ? list(names.map(String), "en") : list(names.map(String), "es");
        return lang === "en"
          ? `Each ${holder.noun.en[0]} holds ${qty(item, R(per), "en")}. Fill in the table for ${nums} ${holder.noun.en[1]}.`
          : `Cada ${holder.noun.es[0]} lleva ${qty(item, R(per), "es")}. Completa la tabla para ${nums} ${holder.noun.es[1]}.`;
      }),
    });
  });
}
