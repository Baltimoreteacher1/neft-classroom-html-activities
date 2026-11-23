// Answer checking and answer keys for every question format. Pure: used by the player, the editor's "does the key
// agree with the question?" validation, the worksheet answer key and the tests.
//
// A response has one shape per format (see the table in checkResponse). checkResponse never trusts the
// response: wrong types simply count as not answered. Free writing (`short`) is never auto-graded: it returns
// "review" so the student can compare with a sample and the teacher reads the work.

import { evalExpr, parseAnswer, plainMath, ratEquals } from "./math.js";

const norm = (s) =>
  String(s ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s%/.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Split text with [[answer|alt]] markers into plain and marked segments. */
export function parseMarked(text) {
  const out = [];
  let last = 0;
  const s = String(text ?? "");
  for (const m of s.matchAll(/\[\[([^\]]+)\]\]/g)) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    out.push({
      t: "mark",
      answers: m[1]
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean),
    });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

export const marksOf = (text) => parseMarked(text).filter((s) => s.t === "mark");

const same = (a, b) => norm(a) === norm(b);
const asArray = (v) => (Array.isArray(v) ? v : []);
const ok = (status, extra = {}) => ({ status, ...extra });

/** Does the typed number equal the key (by value), or any accepted form? */
export function numberMatches(q, typed) {
  const got = parseAnswer(typed, q.unit);
  if (!got) return false;
  const keys = [q.answer, ...asArray(q.accept)].map((k) => parseAnswer(k, q.unit)).filter(Boolean);
  return keys.some((k) => ratEquals(got, k, q.tolerance || 0));
}

/** The exact expected value of a number question: from `expr` when given (the source of truth), else `answer`. */
export function expectedNumber(q) {
  return (q.expr && evalExpr(q.expr)) || parseAnswer(q.answer, q.unit);
}

const CHECK = {
  choice: (q, r) => (!r ? ok("empty") : ok(r === q.answer ? "correct" : "incorrect")),
  multi: (q, r) => {
    const got = new Set(asArray(r));
    if (!got.size) return ok("empty");
    const want = new Set(q.answers);
    const hit = [...got].filter((x) => want.has(x)).length;
    if (hit === want.size && got.size === want.size) return ok("correct");
    return ok(hit ? "partial" : "incorrect", { hit, of: want.size });
  },
  match: (q, r) => {
    const map = r && typeof r === "object" ? r : {};
    const given = q.pairs.filter((p) => map[p.id]);
    if (!given.length) return ok("empty");
    const wrong = q.pairs.filter((p) => map[p.id] !== p.id).map((p) => p.id);
    return ok(
      wrong.length === 0 ? "correct" : wrong.length < q.pairs.length ? "partial" : "incorrect",
      { wrong },
    );
  },
  sort: (q, r) => {
    const map = r && typeof r === "object" ? r : {};
    if (!q.items.some((i) => map[i.id])) return ok("empty");
    const wrong = q.items.filter((i) => map[i.id] !== i.category).map((i) => i.id);
    return ok(
      wrong.length === 0 ? "correct" : wrong.length < q.items.length ? "partial" : "incorrect",
      { wrong },
    );
  },
  order: (q, r) => {
    const got = asArray(r);
    if (!got.length) return ok("empty");
    const wrong = q.items.filter((it, i) => got[i] !== it.id).map((it) => it.id);
    return ok(wrong.length === 0 && got.length === q.items.length ? "correct" : "incorrect", {
      wrong,
    });
  },
  blank: (q, r) => {
    const got = asArray(r);
    const marks = marksOf(q.text);
    if (!got.some((g) => String(g ?? "").trim())) return ok("empty");
    const wrong = marks
      .map((m, i) => (m.answers.some((a) => same(a, got[i]) || numberEqual(a, got[i])) ? -1 : i))
      .filter((i) => i >= 0);
    return ok(
      wrong.length === 0 ? "correct" : wrong.length < marks.length ? "partial" : "incorrect",
      { wrong },
    );
  },
  number: (q, r) =>
    !String(r ?? "").trim() ? ok("empty") : ok(numberMatches(q, r) ? "correct" : "incorrect"),
  short: (q, r) => {
    const words = String(r ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (!words) return ok("empty");
    return ok(words < (q.minWords || 1) ? "incorrect" : "review", { words });
  },
  identify: (q, r) => {
    const got = new Set(asArray(r).map(Number));
    if (!got.size) return ok("empty");
    const total = marksOf(q.text).length;
    const wrong = [...got].filter((i) => i < 0 || i >= total);
    const missed = Array.from({ length: total }, (_, i) => i).filter((i) => !got.has(i));
    const extra = wrong.length;
    return ok(
      missed.length === 0 && extra === 0
        ? "correct"
        : got.size - extra > 0
          ? "partial"
          : "incorrect",
      { missed },
    );
  },
  hotspot: (q, r) => (!r ? ok("empty") : ok(r === q.answer ? "correct" : "incorrect")),
  numberline: (q, r) => {
    if (r === "" || r == null) return ok("empty");
    const got = parseAnswer(String(r));
    return ok(
      got && ratEquals(got, parseAnswer(q.answer), q.tolerance || 0) ? "correct" : "incorrect",
    );
  },
  build: (q, r) => {
    const got = asArray(r);
    if (!got.length) return ok("empty");
    const sentence = got.join(" ");
    const okSentence = same(sentence, q.words.join(" ")) || q.accept.some((a) => same(a, sentence));
    return ok(okSentence ? "correct" : "incorrect");
  },
  error: (q, r) => {
    if (!r?.step) return ok("empty");
    if (r.step !== q.errorStep) return ok("incorrect", { part: "step" });
    if (!r.fix) return ok("partial", { part: "fix" });
    return ok(r.fix === q.fixAnswer ? "correct" : "incorrect", { part: "fix" });
  },
  fillTable: (q, r) => {
    const map = r && typeof r === "object" ? r : {};
    const cells = tableBlanks(q);
    if (!cells.some((c) => String(map[c.key] ?? "").trim())) return ok("empty");
    const wrong = cells
      .filter((c) => !numberEqual(c.answer, map[c.key]) && !same(c.answer, map[c.key]))
      .map((c) => c.key);
    return ok(
      wrong.length === 0 ? "correct" : wrong.length < cells.length ? "partial" : "incorrect",
      { wrong },
    );
  },
  plot: (q, r) => {
    const got = asArray(r);
    if (!got.length) return ok("empty");
    const key = (p) => `${Number(p.x)},${Number(p.y)}`;
    const want = new Set(q.points.map(key));
    const hit = got.filter((p) => want.has(key(p))).length;
    return ok(
      hit === want.size && got.length === want.size ? "correct" : hit ? "partial" : "incorrect",
    );
  },
};

function numberEqual(a, b) {
  const x = parseAnswer(a);
  const y = parseAnswer(b);
  return Boolean(x && y && ratEquals(x, y));
}

/** The blank cells of a fillTable question: [{ key: "row:col", answer }]. */
export function tableBlanks(q) {
  const out = [];
  q.rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell && typeof cell === "object") out.push({ key: `${r}:${c}`, answer: cell.answer });
    }),
  );
  return out;
}

/**
 * Check a student's response. Response shapes:
 *  choice: optionId | multi: [optionId] | match: { pairId: pairIdChosen } | sort: { itemId: categoryId }
 *  order: [itemId] | blank: [string] | number: string | short: string | identify: [markIndex]
 *  hotspot: regionId | numberline: number | build: [word] | error: { step, fix } | fillTable: { "r:c": string }
 *  plot: [{x,y}]
 * @returns {{status: "correct"|"incorrect"|"partial"|"review"|"empty"}}
 */
export function checkResponse(question, response) {
  const fn = CHECK[question?.format];
  return fn ? fn(question, response) : ok("empty");
}

const optionText = (list, id) => list.find((o) => o.id === id)?.text ?? "";

/** The answer as plain text, for answer keys and the "show me" help. Never used on a student screen before a try. */
export function answerText(q) {
  switch (q.format) {
    case "choice":
      return plainMath(optionText(q.options, q.answer));
    case "multi":
      return q.answers.map((a) => plainMath(optionText(q.options, a))).join("; ");
    case "match":
      return q.pairs.map((p) => `${plainMath(p.left)} → ${plainMath(p.right)}`).join("; ");
    case "sort":
      return q.categories
        .map(
          (c) =>
            `${c.label}: ${q.items
              .filter((i) => i.category === c.id)
              .map((i) => plainMath(i.text))
              .join(", ")}`,
        )
        .join(" | ");
    case "order":
      return q.items.map((i, n) => `${n + 1}. ${plainMath(i.text)}`).join(" ");
    case "blank":
      return marksOf(q.text)
        .map((m) => m.answers[0])
        .join(", ");
    case "number": {
      const v = expectedNumber(q);
      return `${q.answer || (v ? `${v.n}/${v.d}` : "")}${q.unit ? ` ${q.unit}` : ""}`.trim();
    }
    case "short":
      return q.sample || "(open response: see rubric)";
    case "identify":
      return marksOf(q.text)
        .map((m) => m.answers[0])
        .join(", ");
    case "hotspot":
      return q.regions.find((r) => r.id === q.answer)?.label ?? "";
    case "numberline":
      return String(q.answer);
    case "build":
      return q.words.join(" ");
    case "error":
      return `${plainMath(q.steps.find((s) => s.id === q.errorStep)?.text ?? "")} → ${plainMath(optionText(q.fixOptions, q.fixAnswer))}`;
    case "fillTable":
      return tableBlanks(q)
        .map((c) => `${c.key.replace(":", ",")}=${c.answer}`)
        .join("; ");
    case "plot":
      return q.points.map((p) => `(${p.x}, ${p.y})`).join(" ");
    default:
      return "";
  }
}
