#!/usr/bin/env node
/**
 * Item-quality validator for the choice-style rounds inside access-practice-lab/content/games/*.json.
 * validate-access-games.mjs proves each game's own schema; this checks the writing: every round that has a set of
 * options and a key must be answerable, fair and teach on a miss.
 *   node --test tools/access-lab-game-items.test.mjs       validate every game (REPORT=1 prints the warnings)
 * Errors: key out of range, duplicate options, fewer than two options, hint or explanation missing, a hint that
 * contains the key text, an explanation that merely repeats the hint, a bare "Correct/Try again" explanation.
 * Warning (reported, not fatal): key is the longest option by a wide margin. Key position is not checked: every game shuffles
 * its options at runtime (engine shuffle/mixChoices), so the authored index carries no signal.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const GAMES_DIR =
  process.env.ACCESS_GAMES_DIR || join(ROOT, "access-practice-lab/content/games");

const text = (v, lang = "en") =>
  v == null
    ? ""
    : typeof v === "string"
      ? v
      : typeof v === "object"
        ? String(v[lang] ?? "")
        : String(v);
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
const BARE = /^(correct|right|good job|great|yes|well done|try again|wrong|incorrect|no)[.! ]*$/i;
const ROUND_KEYS = ["options", "choices"];

/** Yield every { path, node } that carries an option list and a numeric/array key. */
export function* choiceRounds(node, path = "") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* choiceRounds(node[i], `${path}[${i}]`);
    return;
  }
  if (!node || typeof node !== "object") return;
  const listKey = ROUND_KEYS.find((k) => Array.isArray(node[k]));
  if (listKey && "answer" in node) yield { path, node, listKey };
  for (const [k, v] of Object.entries(node)) yield* choiceRounds(v, `${path}.${k}`);
}

export function auditRound({ path, node, listKey }) {
  const errors = [];
  const warns = [];
  const opts = node[listKey];
  const label = `${path}${node.id ? ` (${node.id})` : ""}`;
  const keyIdx = Array.isArray(node.answer) ? node.answer : [node.answer];
  if (opts.length < 2) errors.push(`${label}: needs at least two options`);
  if (!keyIdx.every((k) => Number.isInteger(k) && k >= 0 && k < opts.length)) {
    errors.push(
      `${label}: answer ${JSON.stringify(node.answer)} is outside the ${opts.length} options`,
    );
    return { errors, warns };
  }
  const enText = opts.map((o) => text(o?.text ?? o));
  const seen = new Set();
  // Raw text, not punctuation-stripped: punctuation items differ only by a comma or full stop on purpose.
  for (const t of enText.map((x) => x.toLowerCase().replace(/\s+/g, " ").trim())) {
    if (t && seen.has(t)) errors.push(`${label}: duplicate option "${t}"`);
    seen.add(t);
  }
  const hintEn = text(Array.isArray(node.hints) ? node.hints[0] : node.hint);
  const expEn = text(node.explain);
  // Retell slots share one explanation on the parent `retell` object and have no per-slot hint.
  const shared = /\.retell\.slots\[\d+\]$/.test(path);
  if (!shared && !hintEn && !node.hints) errors.push(`${label}: no hint for the retry`);
  if (!shared && !expEn) errors.push(`${label}: no explanation`);
  if (expEn && BARE.test(expEn.trim())) errors.push(`${label}: explanation is a bare verdict`);
  if (hintEn && expEn && norm(hintEn) === norm(expEn))
    errors.push(`${label}: explanation only repeats the hint`);
  const keyText = keyIdx.map((k) => norm(enText[k]));
  if (keyIdx.length === 1 && hintEn && keyText[0].length > 3) {
    const h = ` ${norm(hintEn)} `;
    if (h.includes(` ${keyText[0]} `) && enText.length > 1)
      errors.push(`${label}: hint contains the key text "${keyText[0]}"`);
  }
  if (keyIdx.length === 1 && opts.length >= 3) {
    const lens = enText.map((t) => t.length);
    const others = lens.filter((_, i) => i !== keyIdx[0]);
    const mean = others.reduce((a, b) => a + b, 0) / others.length;
    if (
      lens[keyIdx[0]] === Math.max(...lens) &&
      lens[keyIdx[0]] > 8 &&
      lens[keyIdx[0]] > 1.6 * mean
    )
      warns.push(`${label}: key is much longer than the other options`);
  }
  return { errors, warns };
}

export function auditGame(id, content) {
  const errors = [];
  const warns = [];
  let n = 0;
  for (const r of choiceRounds(content)) {
    n++;
    const res = auditRound(r);
    errors.push(...res.errors.map((e) => `${id}${e}`));
    warns.push(...res.warns.map((e) => `${id}${e}`));
  }
  return { errors, warns, rounds: n };
}

export function auditAll(dir = GAMES_DIR) {
  const out = { errors: [], warns: [], rounds: 0, games: 0 };
  for (const f of readdirSync(dir)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const r = auditGame(f.replace(/\.json$/, ""), JSON.parse(readFileSync(join(dir, f), "utf8")));
    out.errors.push(...r.errors);
    out.warns.push(...r.warns);
    out.rounds += r.rounds;
    out.games++;
  }
  return out;
}

test("every choice round in every game is answerable, fair and teaches on a miss", () => {
  const r = auditAll();
  if (process.env.REPORT) for (const w of r.warns) console.log(`warn  ${w}`);
  assert.deepEqual(r.errors, []);
  assert.ok(r.games >= 22 && r.rounds >= 150, `swept ${r.games} games / ${r.rounds} rounds`);
});

test("the audit rejects a duplicate option, a key outside the options, a leaking hint and a bare verdict", () => {
  const base = {
    id: "x",
    options: [{ en: "alpha" }, { en: "beta" }, { en: "gamma" }],
    answer: 0,
    hint: { en: "Think of the first letter." },
    explain: { en: "Alpha comes first, so it fits." },
  };
  const run = (patch) =>
    auditRound({ path: ".r", node: { ...base, ...patch }, listKey: "options" }).errors.join("|");
  assert.equal(run({}), "");
  assert.match(
    run({ options: [{ en: "Alpha" }, { en: "alpha " }, { en: "gamma" }] }),
    /duplicate option/,
  );
  assert.match(run({ answer: 5 }), /outside the 3 options/);
  assert.match(run({ hint: { en: "The word is alpha, obviously." } }), /hint contains the key/);
  assert.match(run({ explain: { en: "Correct!" } }), /bare verdict/);
  assert.match(run({ explain: { en: "Think of the first letter." } }), /only repeats the hint/);
});

test("the audit finds nested rounds and keeps punctuation-only options distinct", () => {
  const nested = {
    bands: {
      a: [
        {
          id: "p",
          choices: [{ en: "When it rained, we left." }, { en: "When it rained we left." }],
          answer: 0,
          hint: { en: "Look for the comma." },
          explain: { en: "A comma follows the opening clause." },
        },
      ],
    },
  };
  assert.equal([...choiceRounds(nested)].length, 1);
  assert.deepEqual(auditGame("t", nested).errors, []);
});
