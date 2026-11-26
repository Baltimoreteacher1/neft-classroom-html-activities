#!/usr/bin/env node
/**
 * Vocabulary Academy -> My Words, in a real browser: opening a word card records it as seen, answering its check
 * records a chosen word with its source, /lens names Vocabulary Academy, and the record holds words and counts only.
 *
 *   node tools/vocab-academy-lens-e2e.mjs
 */
import { startRun } from "./lib/lab-e2e.mjs";

const KEY = "accessPracticeLab:v1:word-encounters";
const { page, ok, go, finish } = await startRun("vocab-academy-lens-e2e");
const record = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);
try {
  await go("/vocabulary-academy/word/va_ambitious_adj?grades=3-5");
  await page.locator("[data-va-check]").first().waitFor();
  const seen = await record();
  const w = seen && Object.entries(seen.words || {})[0];
  ok(
    !!w && w[1].n.saw >= 1 && w[1].s["vocab-academy"] >= 1,
    "opening a word card records it as seen, from Vocabulary Academy",
  );
  ok(!w || (w[1].n.chose || 0) === 0, "opening a card alone is not a tested encounter");

  await page.locator("[data-va-check]").first().click();
  await page.waitForTimeout(400);
  const after = await record();
  const rec = after && Object.values(after.words || {})[0];
  ok(!!rec && rec.n.chose === 1, "answering the card's check records a chosen word");
  ok(
    !!rec && rec.ev.length === 1 && rec.ev[0].m === "chose" && rec.ev[0].i === 1,
    "the answer is a dated, independent, tested event",
  );

  await go("/lens?grades=3-5");
  const text = await page.locator("#app").innerText();
  ok(/Vocabulary Academy/.test(text), "/lens names Vocabulary Academy as a source");
  const raw = await page.evaluate((k) => localStorage.getItem(k), KEY);
  ok(!!raw && !/[.!?]\s/.test(raw), "the stored record is words and counts, with no sentences");
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n")[0]}`);
}
await finish();
