#!/usr/bin/env node
/**
 * CI gate: verifies that curriculum answers are ARITHMETICALLY CORRECT.
 *
 * Every other validate:* script in this repo checks structure — that a field
 * exists, that a key is non-generic, that a link resolves. None of them check
 * whether "672 ÷ 8" is actually 84. This one does, using exact rational
 * arithmetic (scripts/lib/rational.mjs).
 *
 * Design rule, non-negotiable: a check that cannot be decided unambiguously is
 * SKIPPED, never failed. A false alarm here costs more than a missed problem,
 * because it trains the reader to ignore the gate. Every rule below either
 * proves an answer wrong or stays silent.
 *
 * Run:  npm run validate:math
 *       npm run validate:math -- --report   # list skipped shapes too
 *       npm run validate:math -- --json     # machine-readable
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateExpression,
  matchesAnswer,
  parseAnswerValue,
  Rat,
  splitEquivalents,
  stripUnits,
} from "./lib/rational.mjs";

const LESSONS_DIR = "lessons";
const args = new Set(process.argv.slice(2));
const REPORT = args.has("--report");
const JSON_OUT = args.has("--json");

/* ------------------------------------------------------------------ helpers */

const isNum = (v) => typeof v === "string" || typeof v === "number";
const text = (v) => (typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "");

/** Trial division; curriculum factors are small. */
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let f = 3; f * f <= n; f += 2) if (n % f === 0) return false;
  return true;
}
function intOf(rat) {
  return rat && rat.isInt() && rat.n >= -1e15 && rat.n <= 1e15 ? Number(rat.n) : null;
}
function gcdInt(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

/** "18 and 24" / "6, 10" → [18, 24]. Returns null unless every part is an integer. */
function parsePair(str) {
  const parts = text(str)
    .split(/\s*(?:and|,|&)\s*/i)
    .filter(Boolean);
  if (parts.length < 2) return null;
  const nums = parts.map((p) => intOf(evaluateExpression(p)));
  return nums.every((n) => n !== null) ? nums : null;
}

/**
 * Substitute a variable and decide whether an equation holds exactly.
 * Returns true/false, or null when either side is not evaluable.
 */
function equationHolds(equation, variable, value) {
  const eq = text(equation);
  const sides = eq.split(/=/);
  if (sides.length !== 2) return null;
  const sub = (side) => {
    let s = side;
    if (variable) {
      const v = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      s = s.replace(new RegExp(`(\\d)\\s*${v}`, "g"), `$1*${variable}`);
      s = s.replace(new RegExp(v, "g"), `(${value.n}/${value.d})`);
    }
    return evaluateExpression(s);
  };
  const left = sub(sides[0]);
  const right = sub(sides[1]);
  if (left === null || right === null) return null;
  return left.eq(right);
}

/** Detect the single variable letter in an equation, if there is exactly one. */
function soleVariable(equation) {
  const letters = new Set(text(equation).match(/[A-Za-z]/g) || []);
  return letters.size === 1 ? [...letters][0] : null;
}

/* -------------------------------------------------------------------- rules */
/* Each rule receives a node and pushes {ok, detail} checks. `skip` means the
 * shape matched but the content was not decidable — never counted as a pass. */

const rules = [
  {
    id: "expression-answer",
    // "672 ÷ 8" → "84";  "4 × 5 + 3²" → "29";  "8.4 ÷ 2.1" → "4"
    run(node, add) {
      // A sibling remainder means `answer` is a whole-number quotient, not the
      // exact value of the expression — division-remainder owns that shape.
      if (node.remainder !== undefined) return;
      const sources = ["given", "start", "original", "problem", "expression", "calculation"];
      const targets = ["answer", "solution", "correctAnswer"];
      for (const s of sources) {
        if (!isNum(node[s])) continue;
        const raw = text(node[s]);
        if (/___|\?|=/.test(raw)) continue; // blanks/equations are other rules
        const lhs = evaluateExpression(raw);
        if (lhs === null) continue;
        for (const t of targets) {
          if (!isNum(node[t])) continue;
          const rhs = parseAnswerValue(node[t]);
          if (rhs === null) {
            add.skip(`${s}/${t} answer not evaluable: ${text(node[t])}`);
            continue;
          }
          add.check(lhs.eq(rhs), `${raw} = ${lhs.toString()} but ${t} says ${text(node[t])}`);
        }
      }
    },
  },
  {
    id: "blank-equation",
    // "4.7 + ___ = 10" with answer "5.3" → substitute and verify.
    run(node, add) {
      for (const s of ["given", "problem", "stem", "prompt", "cloze", "start"]) {
        if (!isNum(node[s])) continue;
        const raw = text(node[s]);
        if (!/___+|…|\[\s*\]/.test(raw) || !raw.includes("=")) continue;
        const ans = node.answer ?? node.solution;
        if (!isNum(ans)) continue;
        const value = parseAnswerValue(ans);
        if (value === null) continue;
        const filled = raw.replace(/___+|\[\s*\]/, `(${value.n}/${value.d})`);
        const holds = equationHolds(filled, null, value);
        if (holds === null) {
          add.skip(`blank equation not evaluable: ${raw}`);
          continue;
        }
        add.check(holds, `${raw} is not satisfied by ${text(ans)}`);
      }
    },
  },
  {
    id: "equation-solution",
    // "3x = 21" → "x = 7";  balance-scale {equation, variable, answer}
    run(node, add) {
      const eq = text(node.equation);
      if (!eq.includes("=")) return;
      const ans = node.answer ?? node.solution;
      if (!isNum(ans)) return;
      const value = parseAnswerValue(ans);
      if (value === null) return;
      const variable = text(node.variable) || soleVariable(eq);
      if (!variable) return;
      const holds = equationHolds(eq, variable, value);
      if (holds === null) {
        add.skip(`equation not evaluable: ${eq}`);
        return;
      }
      add.check(holds, `${eq} is not satisfied by ${variable} = ${text(ans)}`);
    },
  },
  {
    id: "prime-factorization",
    // given "24" + answer "2 × 2 × 2 × 3" → product must equal 24, all factors prime.
    run(node, add) {
      const given = intOf(evaluateExpression(text(node.given)));
      if (given === null || given < 2) return;
      const ansText = text(node.answer);
      if (!ansText || !/[×*]/.test(ansText.replace(/\^|[⁰-⁹]/g, ""))) return;
      const product = evaluateExpression(ansText);
      if (product === null) return;
      const p = intOf(product);
      if (p === null) return;
      // Only treat as a factorization when every base is prime — otherwise this
      // is an ordinary product and expression-answer already covered it.
      const bases = ansText
        .split(/[×*]/)
        .map((b) => intOf(evaluateExpression(b.replace(/(\^|[⁰-⁹]).*$/, "").trim())));
      if (bases.some((b) => b === null)) return;
      if (!bases.every((b) => isPrime(b))) {
        // A `split`/`pf` sibling is the factor-tree workflow: the intermediate
        // split is shown separately, so `answer` is required to be fully prime.
        // Without that signal, "24 → 4 × 6" may just be "write it as a product".
        const isFactorTree = node.split !== undefined || node.pf !== undefined;
        if (isFactorTree)
          add.check(
            false,
            `answer "${ansText}" is not a prime factorization of ${given} (${bases.filter((b) => !isPrime(b)).join(", ")} not prime)`,
          );
        else if (p === given) add.skip(`non-prime bases in "${ansText}" (product is right)`);
        else add.check(false, `given ${given} but "${ansText}" = ${p}`);
        return;
      }
      add.check(
        p === given,
        `prime factorization of ${given} is not "${ansText}" (that product is ${p})`,
      );
    },
  },
  {
    id: "gcf-lcm",
    // "18 and 24" → 6 (GCF, signalled by shared/pf/gcf) or 30 (LCM, by first/second/powers).
    run(node, add) {
      const pair = parsePair(node.given);
      if (!pair || pair.length !== 2 || !isNum(node.answer)) return;
      const ans = intOf(parseAnswerValue(node.answer));
      if (ans === null) return;
      const keys = Object.keys(node).join(" ").toLowerCase();
      const [a, b] = pair;
      const isGcf = /shared|gcf|\bpf\b/.test(keys) && !/multiple|lcm/.test(keys);
      const isLcm = /first|second|lcm|multiple|powers/.test(keys);
      if (isGcf && !isLcm)
        add.check(ans === gcdInt(a, b), `GCF(${a}, ${b}) = ${gcdInt(a, b)}, not ${ans}`);
      else if (isLcm && !isGcf) {
        const lcm = Math.abs(a * b) / gcdInt(a, b);
        add.check(ans === lcm, `LCM(${a}, ${b}) = ${lcm}, not ${ans}`);
      } else add.skip(`pair "${text(node.given)}" — GCF vs LCM ambiguous`);
    },
  },
  {
    id: "division-remainder",
    // given "2,578 ÷ 13", answer "198", remainder "4"
    run(node, add) {
      if (!isNum(node.remainder) || !isNum(node.given) || !isNum(node.answer)) return;
      const m = /^(.+?)÷(.+)$/.exec(text(node.given));
      if (!m) return;
      const dividend = intOf(evaluateExpression(m[1]));
      const divisor = intOf(evaluateExpression(m[2]));
      const quotient = intOf(parseAnswerValue(node.answer));
      const remainder = intOf(parseAnswerValue(node.remainder));
      if ([dividend, divisor, quotient, remainder].some((v) => v === null) || divisor === 0) return;
      const okQ = Math.floor(dividend / divisor) === quotient;
      const okR = dividend - divisor * quotient === remainder;
      add.check(
        okQ && okR,
        `${dividend} ÷ ${divisor} = ${Math.floor(dividend / divisor)} R ${dividend % divisor}, not ${quotient} R ${remainder}`,
      );
    },
  },
  {
    id: "work-shown",
    // Intermediate work must equal the thing it claims to rewrite:
    //   given "24", split "4 × 6"      → 4×6 must be 24
    //   given "1/2 ÷ 1/6", kcf "1/2 × 6/1 = 6/2"  → both sides equal, and equal answer
    run(node, add) {
      const anchor = ["given", "problem", "original"].find(
        (k) => isNum(node[k]) && evaluateExpression(text(node[k])) !== null,
      );
      if (!anchor) return;
      const base = evaluateExpression(text(node[anchor]));
      for (const k of ["split", "expanded", "convert", "kcf", "rewrite", "whole", "work"]) {
        if (!isNum(node[k])) continue;
        const raw = text(node[k]);
        if (!raw) continue;
        const parts = raw
          .split("=")
          .map((p) => p.trim())
          .filter(Boolean);
        const values = parts.map((p) => evaluateExpression(p));
        if (values.some((v) => v === null)) {
          add.skip(`${k} not evaluable: ${raw}`);
          continue;
        }
        // Every side of the shown work must be equal to every other side.
        for (let x = 1; x < values.length; x++) {
          add.check(
            values[0].eq(values[x]),
            `${k}: "${parts[0]}" (${values[0].toString()}) ≠ "${parts[x]}" (${values[x].toString()})`,
          );
        }
        // …and equal to the problem it rewrites. "whole" is deliberately
        // excluded: "2.5 × 4" → whole "25 × 4 = 100" rescales on purpose.
        if (k !== "whole" && k !== "work") {
          add.check(
            values[0].eq(base),
            `${k} "${parts[0]}" = ${values[0].toString()} does not match ${anchor} "${text(node[anchor])}" = ${base.toString()}`,
          );
        }
      }
    },
  },
  {
    id: "equivalent-forms",
    // answer "5/2 = 2 1/2" — the listed equivalent forms must actually be equal.
    run(node, add) {
      for (const k of ["answer", "solution", "correctAnswer"]) {
        if (typeof node[k] !== "string") continue;
        const raw = node[k].trim();
        if (!/=|\bor\b/i.test(raw)) continue;
        const forms = splitEquivalents(raw).map((f) => stripUnits(f).text);
        const values = forms.map((f) => evaluateExpression(f));
        if (values.length < 2 || values.some((v) => v === null)) continue;
        for (let x = 1; x < values.length; x++) {
          add.check(
            values[0].eq(values[x]),
            `${k} lists "${forms[0]}" and "${forms[x]}" as equal, but they are ${values[0].toString()} and ${values[x].toString()}`,
          );
        }
      }
    },
  },
  {
    id: "prompt-expression",
    // Guided steps embed the arithmetic directly: "Base area: 3 × 5 = ___",
    // "Divide cost by quantity: 9 ÷ 4 = ___". Evaluate the shown expression.
    run(node, add) {
      const prompt = text(node.prompt) || text(node.stem);
      if (!prompt || node.answer === undefined) return;
      // Prompts that ask for a TRANSFORMATION of the shown number, not its
      // value, belong to the specialised rules below. Without this, "Use the
      // reciprocal of 1/4: ___" would be graded as if it asked for 1/4.
      if (
        /reciprocal|as a (decimal|fraction|percent|ratio)|factors of|simplif|round|estimate|reduce|convert|rewrite|equivalent/i.test(
          prompt,
        )
      )
        return;
      // The arithmetic run immediately preceding the blank, separated from it by
      // ":" or "=" — "Multiply 2 × 2: ___", "Base area: 3 × 5 = ___". Requiring
      // that separator keeps prose numbers ("Write 5% as a decimal: ___") out.
      const m = /([\d][\d\s.,×÷*/+\-()⁰-⁹]*)\s*[:=]\s*(?:___+|\?)/.exec(prompt);
      if (!m) return;
      const expr = m[1].trim().replace(/[,:]$/, "");
      // A bare value — "7" or "1/4" — is something to restate, not to compute.
      if (!/[×÷*/+\-]/.test(expr)) return;
      if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(expr)) return;
      const exact = evaluateExpression(expr);
      if (exact === null) return;
      const verdict = matchesAnswer(exact, node.answer);
      if (verdict === null) {
        add.skip(`prompt answer not evaluable: ${text(node.answer)}`);
        return;
      }
      add.check(
        verdict,
        `"${expr}" = ${exact.toString()} but the step answer is ${text(node.answer)}`,
      );
    },
  },
  {
    id: "list-factors",
    // "List the factors of 18: ___" → "1, 2, 3, 6, 9, 18"
    run(node, add) {
      const prompt = text(node.prompt) || text(node.stem);
      const m = /factors of\s+(\d+)/i.exec(prompt);
      if (!m || typeof node.answer !== "string") return;
      if (/prime|common/i.test(prompt)) return; // prime/common factors are a different ask
      const n = Number(m[1]);
      if (!Number.isInteger(n) || n < 1 || n > 100000) return;
      const parts = node.answer.split(/\s*,\s*/).map((p) => intOf(evaluateExpression(p)));
      if (parts.some((p) => p === null)) return;
      const expected = [];
      for (let f = 1; f <= n; f++) if (n % f === 0) expected.push(f);
      const got = [...parts].sort((a, b) => a - b);
      const same = got.length === expected.length && got.every((v, i) => v === expected[i]);
      add.check(
        same,
        `factors of ${n} are ${expected.join(", ")}, but the answer lists ${node.answer}`,
      );
    },
  },
  {
    id: "percent-decimal",
    // "Write 5% as a decimal: ___" → 0.05
    run(node, add) {
      const prompt = text(node.prompt) || text(node.stem);
      const m = /write\s+(\d+(?:\.\d+)?)\s*%\s+as a decimal/i.exec(prompt);
      if (!m || node.answer === undefined) return;
      const exact = evaluateExpression(`${m[1]}%`);
      const verdict = matchesAnswer(exact, node.answer);
      if (verdict === null) return;
      add.check(verdict, `${m[1]}% as a decimal is ${exact.toNumber()}, not ${text(node.answer)}`);
    },
  },
  {
    id: "reciprocal",
    // "Use the reciprocal of 1/4: ___" → 4
    run(node, add) {
      const prompt = text(node.prompt) || text(node.stem);
      const m = /reciprocal of\s+(\d+)\s*\/\s*(\d+)/i.exec(prompt);
      if (!m || node.answer === undefined) return;
      const a = Number(m[1]),
        b = Number(m[2]);
      if (!a || !b) return;
      const exact = new Rat(BigInt(b), BigInt(a));
      const verdict = matchesAnswer(exact, node.answer);
      if (verdict === null) return;
      add.check(
        verdict,
        `the reciprocal of ${a}/${b} is ${exact.toString()}, not ${text(node.answer)}`,
      );
    },
  },
  {
    id: "stem-prime-factorization",
    // parallelPractice: stem asks for the prime factorization of N; answer must be it.
    run(node, add) {
      const stem = text(node.stem) || text(node.prompt);
      if (!/prime factor(izapt)?/i.test(stem) && !/prime factorization/i.test(stem)) return;
      if (!/factorization/i.test(stem)) return;
      const nums = stem.match(/\b\d{2,5}\b/g);
      if (!nums || nums.length !== 1) return; // ambiguous target → skip
      const target = Number(nums[0]);
      const ansText = text(node.answer);
      const product = evaluateExpression(ansText);
      if (product === null) return;
      const p = intOf(product);
      if (p === null) return;
      add.check(
        p === target,
        `stem asks for the prime factorization of ${target} but "${ansText}" = ${p}`,
      );
    },
  },
];

/* ------------------------------------------------------------------- runner */

function walk(node, path, visit) {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
  if (node && typeof node === "object") {
    visit(node, path);
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, visit);
  }
}

/**
 * Run every rule over one lesson config.
 * Exported so scripts/validate-math.selftest.mjs can assert on fixtures — a
 * gate that silently stops firing is worse than no gate.
 */
export function validateConfig(config) {
  const result = { checked: 0, passed: 0, failures: [], skips: [] };
  walk(config, "", (node, path) => {
    for (const rule of rules) {
      const add = {
        check(ok, detail) {
          result.checked++;
          if (ok) result.passed++;
          else result.failures.push({ path, rule: rule.id, detail });
        },
        skip(detail) {
          result.skips.push({ path, rule: rule.id, detail });
        },
      };
      try {
        rule.run(node, add);
      } catch (err) {
        result.failures.push({ path, rule: rule.id, detail: `rule crashed: ${err.message}` });
      }
    }
  });
  return result;
}

/* ----------------------------------------------------------------------- cli */

function main() {
  const stats = { lessons: 0, checked: 0, passed: 0, skipped: 0 };
  const failures = [];
  const skips = new Map();

  const lessons = existsSync(LESSONS_DIR)
    ? readdirSync(LESSONS_DIR)
        .filter((d) => existsSync(join(LESSONS_DIR, d, "config.json")))
        .sort()
    : [];

  for (const lesson of lessons) {
    let config;
    try {
      config = JSON.parse(readFileSync(join(LESSONS_DIR, lesson, "config.json"), "utf8"));
    } catch (err) {
      failures.push({
        lesson,
        path: "config.json",
        rule: "parse",
        detail: `unreadable config: ${err.message}`,
      });
      continue;
    }
    stats.lessons++;
    const result = validateConfig(config);
    stats.checked += result.checked;
    stats.passed += result.passed;
    stats.skipped += result.skips.length;
    for (const f of result.failures) failures.push({ lesson, ...f });
    if (REPORT) {
      for (const s of result.skips) {
        const key = `${s.rule}: ${s.detail}`;
        skips.set(key, (skips.get(key) || 0) + 1);
      }
    }
  }

  if (JSON_OUT) {
    const out = { stats, failures };
    if (existsSync("reports"))
      writeFileSync("reports/math-validation.json", JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2));
  } else {
    const byLesson = new Map();
    for (const f of failures) {
      if (!byLesson.has(f.lesson)) byLesson.set(f.lesson, []);
      byLesson.get(f.lesson).push(f);
    }
    console.log(`\nMath answer validation — ${stats.lessons} lesson configs`);
    console.log(
      `  checked ${stats.checked}  passed ${stats.passed}  FAILED ${failures.length}  skipped(undecidable) ${stats.skipped}\n`,
    );
    for (const [lesson, items] of [...byLesson].sort()) {
      console.log(`✗ ${lesson}`);
      for (const f of items) console.log(`    [${f.rule}] ${f.path}\n      ${f.detail}`);
    }
    if (REPORT && skips.size) {
      console.log("\nSkipped shapes (not machine-decidable):");
      for (const [k, n] of [...skips].sort((a, b) => b[1] - a[1]).slice(0, 40))
        console.log(`  [${n}] ${k}`);
    }
    if (!failures.length) console.log("✓ No arithmetic errors found.");
  }

  process.exit(failures.length ? 1 : 0);
}

// Importing (the self-test) must not trigger the whole-curriculum sweep.
if (process.argv[1] && /validate-math\.mjs$/.test(process.argv[1])) main();
