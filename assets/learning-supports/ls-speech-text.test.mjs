// Read-aloud must say math the way a teacher would, and must know which word on
// screen the voice is saying.
import assert from "node:assert/strict";
import test from "node:test";
import { buildChunks, splitWords, tokenIndexAt, verbalizeToken } from "./ls-speech-text.js";

test("notation is spelled out in English", () => {
  const cases = [
    ["3:4", "3 to 4"],
    ["3/4", "3 over 4"],
    ["×", "times"],
    ["÷", "divided by"],
    ["=", "equals"],
    ["≥", "is greater than or equal to"],
    ["40%", "40 percent"],
    ["-5", "negative 5"],
    ["(−5)", "(negative 5)"],
    ["-", "minus"],
    ["x²", "x squared"],
    ["2^3", "2 cubed"],
    ["2^5", "2 to the power of 5"],
    ["12cm²", "12 square centimeters"],
    ["m³", "cubic meters"],
    ["$4.50", "4.50 dollars"],
    ["90°", "90 degrees"],
    ["x=7", "x equals 7"],
    ["two-step", "two-step"],
    ["Hello,", "Hello,"],
  ];
  for (const [shown, said] of cases) assert.equal(verbalizeToken(shown, "en"), said, shown);
});

test("notation is spelled out in Spanish", () => {
  const cases = [
    ["3:4", "3 a 4"],
    ["3/4", "3 sobre 4"],
    ["×", "por"],
    ["=", "es igual a"],
    ["40%", "40 por ciento"],
    ["-5", "menos 5"],
    ["x²", "x al cuadrado"],
    ["cm²", "centímetros cuadrados"],
    ["$4", "4 dólares"],
  ];
  for (const [shown, said] of cases) assert.equal(verbalizeToken(shown, "es"), said, shown);
});

test("pictures and separators are not read out", () => {
  assert.equal(verbalizeToken("🎮", "en"), "");
  assert.equal(verbalizeToken("·", "en"), "");
  assert.equal(verbalizeToken("game🎮", "en"), "game");
});

test("a number is never rewritten", () => {
  for (const n of ["1,200", "0.75", "12", "3.14"]) assert.equal(verbalizeToken(n, "en"), n);
});

test("splitWords keeps the position of every word", () => {
  const words = splitWords("  Find 3/4  of 12. ");
  assert.deepEqual(
    words.map((w) => [w.text, w.start, w.end]),
    [
      ["Find", 2, 6],
      ["3/4", 7, 10],
      ["of", 12, 14],
      ["12.", 15, 18],
    ],
  );
});

test("chunks split at sentences, blocks and language changes", () => {
  const tok = (text, extra = {}) => ({ text, lang: "en", ...extra });
  const tokens = [
    tok("Problem"),
    tok("1", { breakAfter: true }),
    tok("Find"),
    tok("the"),
    tok("ratio."),
    { text: "Encuentra", lang: "es" },
    { text: "la", lang: "es" },
    { text: "razón", lang: "es", breakAfter: true },
  ];
  const chunks = buildChunks(tokens, { minSentence: 5 });
  assert.deepEqual(
    chunks.map((c) => [c.lang, c.text]),
    [
      ["en", "Problem 1."],
      ["en", "Find the ratio."],
      ["es", "Encuentra la razón."],
    ],
  );
});

test("a long run is cut at maxChars, never mid-word", () => {
  const tokens = Array.from({ length: 30 }, (_, i) => ({ text: `word${i}`, lang: /** @type {const} */ ("en") }));
  const chunks = buildChunks(tokens, { maxChars: 50 });
  assert.ok(chunks.length > 1);
  for (const c of chunks) assert.ok(c.text.length <= 50, c.text);
  assert.equal(chunks.flatMap((c) => c.indices).join(), tokens.map((_, i) => i).join());
});

test("a spoken character offset maps back to the displayed word", () => {
  const tokens = [
    { text: "Find", lang: /** @type {const} */ ("en") },
    { text: "3 over 4", lang: /** @type {const} */ ("en") },
    { text: "of", lang: /** @type {const} */ ("en") },
    { text: "12.", lang: /** @type {const} */ ("en") },
  ];
  const [chunk] = buildChunks(tokens);
  assert.equal(chunk.text, "Find 3 over 4 of 12.");
  assert.equal(tokenIndexAt(chunk, 0), 0);
  assert.equal(tokenIndexAt(chunk, 5), 1);
  assert.equal(tokenIndexAt(chunk, 9), 1); // "over" still belongs to the 3/4 token
  assert.equal(tokenIndexAt(chunk, 14), 2);
  assert.equal(tokenIndexAt(chunk, 17), 3);
});
