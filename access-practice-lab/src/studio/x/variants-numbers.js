// "numbers" variants: regenerate a numeric item only when a verified generator in core/mathgen.js can reproduce its
// problem family, and only keep the new item after an independent recomputation (core/math.js, not the generator's
// own builders) agrees with the stored answer.
//
// How a family is recognised: generated questions record only their topic (`skill` = a MATH_TOPICS id), not the
// template. So a question is accepted as "the same family" when a generator draw for that topic has the same format,
// the same prompt, hint and explanation once every number is masked, and the same table/choice/step shape. Anything
// else (hand-written items, edited wording, a topic with no generator) is left alone and listed in `skipped`.

import { checkResponse, tableBlanks } from "../core/check.js";
import { generateMath, MATH_TOPICS } from "../core/mathgen.js";
import { hashSeed } from "../core/mathgen/kit.js";
import { evalExpr, parseAnswer, parseNumber, plainMath, ratEquals } from "../core/math.js";
import { cleanBlock } from "../core/schema.js";
import { T } from "./inspect-text.js";

const FORMATS = new Set(["number", "choice", "numberline", "error", "fillTable"]);
const NO_CHECK = "no expression to recompute";
const NO_FORMAT = "this format has no independent recomputation";
const ROUNDS = 6;
const PER_DRAW = 40;

const mask = (s) =>
  String(s ?? "")
    .replace(/\d[\d,]*(?:\.\d+)?/g, "#")
    .replace(/\s+/g, " ")
    .trim();
const size = (s) => digits(s).join("").length;
const digits = (s) => String(s ?? "").match(/\d[\d,]*(?:\.\d+)?/g) || [];

/** What makes two items the same family: wording with numbers masked, plus shape. */
function skeleton(q) {
  const shape = {
    choice: () => q.options.length,
    error: () => `${q.steps.map((s) => mask(s.text)).join("/")}|${q.fixOptions.length}`,
    fillTable: () =>
      `${q.headers.join(",")}|${q.rows.map((r) => r.map((c) => (typeof c === "object" ? "_" : mask(c))).join(",")).join("/")}`,
    number: () => q.unit,
  }[q.format];
  return [q.format, mask(q.prompt), mask(q.hint), mask(q.explanation), shape ? shape() : ""].join(
    "§",
  );
}

// ── independent recomputation ──────────────────────────────────────────────────

/** The number an answer choice or a worked line shows first: 7, 3/4, 2 1/4, 25%, $4.50, 14:4 (a ratio is a/b). */
function leading(text) {
  const s = plainMath(text).replace(/[−–]/g, "-").replace(/[$,]/g, "").trim();
  const ratio = /^(\d+):(\d+)/.exec(s);
  if (ratio) return parseNumber(`${ratio[1]}/${ratio[2]}`);
  const m =
    /^-?\d+ \d+\/\d+/.exec(s) || /^-?\d+\/\d+/.exec(s) || /^-?(?:\d+\.\d+|\.\d+|\d+)%?/.exec(s);
  return m ? parseNumber(m[0]) : null;
}
const lastValue = (text) => {
  const m = /=\s*([^=]*)$/.exec(plainMath(text));
  return m ? leading(m[1]) : null;
};
const optionText = (list, id) => list.find((o) => o.id === id)?.text ?? "";

/** Evaluate a table-cell expression such as "r0c1/r0c0*r2c0" over the cells the table shows. */
function cellValue(rows, expr) {
  let bad = false;
  const sub = expr.replace(/r(\d+)c(\d+)/g, (_, r, c) => {
    const cell = rows[Number(r)]?.[Number(c)];
    const v = typeof cell === "string" ? parseNumber(plainMath(cell).replace(/[$,]/g, "")) : null;
    if (!v) bad = true;
    return v ? `(${v.n}/${v.d})` : "0";
  });
  return bad ? null : evalExpr(sub);
}

/**
 * Recompute the answer of question `q` from `meta` ({expr} or {exprs}) with core/math.js and compare it with what `q`
 * stores. @returns {string|null} null when they agree, else why not.
 */
export function recompute(q, meta) {
  const same = (a, b) => Boolean(a && b && ratEquals(a, b));
  switch (q.format) {
    case "number": {
      const want = evalExpr(meta.expr ?? "");
      if (!want) return NO_CHECK;
      const got = parseAnswer(q.answer, q.unit);
      if (!same(want, got)) return `answer ${q.answer} is not ${meta.expr}`;
      return q.accept.every((a) => same(parseAnswer(a, q.unit), want))
        ? null
        : "an accepted form differs";
    }
    case "numberline": {
      const want = evalExpr(meta.expr ?? "");
      return want && same(want, parseAnswer(q.answer))
        ? null
        : `answer ${q.answer} is not ${meta.expr}`;
    }
    case "choice": {
      const want = evalExpr(meta.expr ?? "");
      if (!want) return NO_CHECK;
      const right = leading(optionText(q.options, q.answer));
      if (!same(want, right)) return "the keyed choice does not equal the recomputed value";
      const twins = q.options.filter((o) => o.id !== q.answer && same(leading(o.text), want));
      return twins.length ? "another choice has the same value as the answer" : null;
    }
    case "error": {
      const want = evalExpr(meta.expr ?? "");
      if (!want) return NO_CHECK;
      if (!q.steps.some((s) => s.id === q.errorStep)) return "the mistaken step is missing";
      if (!same(want, lastValue(optionText(q.fixOptions, q.fixAnswer))))
        return "the keyed fix does not reach the recomputed value";
      const twins = q.fixOptions.filter(
        (o) => o.id !== q.fixAnswer && same(lastValue(o.text), want),
      );
      return twins.length ? "a wrong fix reaches the same value" : null;
    }
    case "fillTable": {
      const blanks = tableBlanks(q);
      if (!blanks.length || blanks.length !== Object.keys(meta.exprs || {}).length)
        return "blank cells and expressions differ";
      for (const b of blanks) {
        const [r, c] = b.key.split(":").map(Number);
        const rowsWithoutKey = q.rows.map((row) =>
          row.map((cell) => (typeof cell === "object" ? null : cell)),
        );
        const want = cellValue(rowsWithoutKey, meta.exprs[b.key] ?? "");
        if (!same(want, parseAnswer(b.answer)))
          return `cell ${r + 1},${c + 1} is not ${meta.exprs[b.key]}`;
      }
      return null;
    }
    default:
      return NO_FORMAT;
  }
}

/** A response that should be graded correct: lets the checker confirm what recompute() confirmed. */
function correctResponse(q) {
  if (q.format === "choice") return q.answer;
  if (q.format === "number" || q.format === "numberline") return q.answer;
  if (q.format === "error") return { step: q.errorStep, fix: q.fixAnswer };
  return Object.fromEntries(tableBlanks(q).map((b) => [b.key, b.answer]));
}

// ── the variant ────────────────────────────────────────────────────────────────

/** recompute() answers that mean "nothing to compare against", not "the answer is wrong". */
const unverifiable = (why) => why === NO_CHECK || why.startsWith(NO_FORMAT);

const metaOf = (raw) => ({ expr: raw.expr, exprs: raw.exprs });

/** Is the stored original itself consistent? A wrong original is never used as the model for a variant. */
function originalProblem(q) {
  if (q.format === "number" && q.expr) {
    const want = evalExpr(q.expr);
    const got = parseAnswer(q.answer, q.unit);
    if (!want || !got || !ratEquals(want, got))
      return "the original answer does not match its expression";
  }
  return null;
}

/**
 * @param {object} a a normalized, valid activity
 * @param {number} seed
 * @param {{generate?: Function, topics?: object[], strict?: boolean}} deps `generate` has generateMath's signature
 * @returns {{blocks: object[], changes: object[], skipped: object[]}}
 */
export function numbersVariant(a, seed, deps = {}) {
  const generate = deps.generate ?? generateMath;
  const topics = deps.topics ?? MATH_TOPICS;
  const changes = [];
  const skipped = [];
  const used = new Set();
  const skip = (q, en, es) => {
    skipped.push({ blockId: q.id, reason: T(en, es) });
    return q;
  };
  const fail = (q, why) => {
    if (deps.strict) throw new Error(`variants: ${q.id}: ${why}`);
    return skip(
      q,
      `The new numbers could not be verified (${why}), so this item was kept as it was.`,
      `No se pudieron verificar los números nuevos (${why}), así que este elemento se dejó como estaba.`,
    );
  };

  const blocks = a.blocks.map((q) => {
    if (q.type !== "question") return q;
    if (!FORMATS.has(q.format))
      return skip(
        q,
        `The ${q.format} format has no independent way to recompute its answer, so its numbers were not changed.`,
        `El formato ${q.format} no tiene una forma independiente de recalcular su respuesta, así que no se cambiaron sus números.`,
      );
    const topic = topics.find((t) => t.id === q.skill);
    if (!topic)
      return skip(
        q,
        "This item does not record a generator family (its skill is not a math topic), so its numbers were not changed.",
        "Este elemento no registra una familia de generador (su destreza no es un tema de matemáticas), así que no se cambiaron sus números.",
      );
    if (q.image?.src)
      return skip(
        q,
        "This item has a picture that may show its numbers, so it was not changed.",
        "Este elemento tiene una imagen que podría mostrar sus números, así que no se cambió.",
      );
    const bad = originalProblem(q);
    if (bad)
      return skip(
        q,
        `${bad}; fix it first.`,
        "la respuesta original no coincide con su expresión; corríjala primero.",
      );

    const want = skeleton(q);
    const before = digits(q.prompt).join(",");
    const grade = Number(a.context.grade);
    const grades = topic.grades.includes(grade) ? [grade] : topic.grades;
    let verdict = "no-match";
    for (let round = 0; round < ROUNDS; round++) {
      const found = [];
      for (const g of grades)
        for (const level of [1, 2, 3])
          for (const raw of generate({
            topic: topic.id,
            grade: g,
            level,
            count: PER_DRAW,
            seed: hashSeed(seed, q.id, round, g, level),
          }))
            if (
              raw.format === q.format &&
              skeleton(raw) === want &&
              digits(raw.prompt).join(",") !== before &&
              !used.has(raw.prompt)
            )
              found.push(raw);
      // Prefer draws whose numbers are about as long as the original's (the original's level is not recorded),
      // then pick among the closest by seed.
      const gap = (raw) => Math.abs(size(raw.prompt) - size(q.prompt));
      found.sort((x, y) => gap(x) - gap(y));
      const best = found.filter((raw) => gap(raw) === gap(found[0]));
      const start = best.length ? hashSeed(seed, q.id, round, "pick") % best.length : 0;
      const order = [...best.slice(start), ...best.slice(0, start), ...found.slice(best.length)];
      for (const raw of order) {
        const why = recompute(raw, metaOf(raw));
        if (why && unverifiable(why))
          return skip(
            q,
            "The generator gives no expression to recompute this answer independently, so its numbers were not changed.",
            "El generador no da una expresión para recalcular esta respuesta de forma independiente, así que no se cambiaron sus números.",
          );
        if (why) {
          verdict = why;
          continue;
        }
        const next = {
          ...cleanBlock({ ...raw, id: q.id, type: "question", frame: q.frame }),
          skill: q.skill,
        };
        const stored = recompute(next, metaOf(raw));
        if (stored) {
          verdict = stored;
          continue;
        }
        if (checkResponse(next, correctResponse(next)).status !== "correct") {
          verdict = "the checker rejects the keyed answer";
          continue;
        }
        used.add(raw.prompt);
        changes.push({
          blockId: q.id,
          mode: "numbers",
          message: T(
            "New numbers in the same kind of problem. The answer was recomputed independently and matches.",
            "Números nuevos en el mismo tipo de problema. La respuesta se recalculó de forma independiente y coincide.",
          ),
          before: q.prompt,
          after: next.prompt,
        });
        return next;
      }
      if (found.length && verdict !== "no-match") return fail(q, verdict);
    }
    return skip(
      q,
      "No verified generator reproduced this item's wording, so its numbers were not changed.",
      "Ningún generador verificado reprodujo la redacción de este elemento, así que no se cambiaron sus números.",
    );
  });
  return { blocks, changes, skipped };
}
