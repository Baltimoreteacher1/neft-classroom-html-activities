#!/usr/bin/env node
/**
 * My Words (/lens) in a real browser: the empty state, a seeded record shown as plain counts and word groups, the
 * try-using and review lists, a write made through the real module (so the page loads it with no Node-only code),
 * Spanish chrome, 375px, axe WCAG 2.2 AA, and that no score or level is claimed and nothing leaves the page.
 *
 *   node tools/lens-e2e.mjs
 */
import { startRun } from "./lib/lab-e2e.mjs";

const KEY = "accessPracticeLab:v1:word-encounters";
const { page, ok, go, axe, overflow, finish } = await startRun("lens-e2e");
const requests = [];
page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
const text = () => page.locator("#app").innerText();
try {
  await go("/lens?grades=6-8");
  ok((await page.locator("h1").innerText()).includes("My Words"), "/lens renders one h1");
  ok(/No words yet/.test(await text()), "an empty record explains itself and offers Word Lab");
  ok((await page.locator('a[href*="/wordlab"]').count()) >= 1, "the empty state links to Word Lab");
  await axe("/lens empty");

  // Written through the real module in the page, as an activity would.
  await page.evaluate(async () => {
    const m = await import("/access-practice-lab/src/lang/word-encounters.js");
    const day = (n) => Date.now() - n * 864e5;
    m.noteWords(["pattern", "factor", "trend"], { src: "wordlab", mode: "saw", now: day(6) });
    m.noteWords(["factor", "trend"], { src: "reading", mode: "heard", now: day(5) });
    m.noteWords(["factor", "trend"], { src: "arcade", mode: "saw", now: day(4) });
    m.noteWords(["evidence"], { src: "teach-back", mode: "wrote", supported: true, now: day(1) });
    m.noteWords(["analyze"], { src: "wordlab", mode: "chose", now: day(4) });
    m.noteWords(["analyze"], { src: "writing", mode: "wrote", now: day(4) });
    m.noteWords(["source"], { src: "wordlab", mode: "said", now: day(1) });
  });
  await go("/lens?grades=6-8");
  const body = await text();
  ok(/Words met\s*6/.test(body.replace(/\n/g, " ")), "six distinct words are counted");
  ok(
    /Written/.test(body) && /Said out loud/.test(body),
    "written and spoken words are listed apart",
  );
  ok(
    (await page.locator("#ln-try").count()) === 1 &&
      /factor/.test(await page.locator("#ln-try").locator("xpath=..").innerText()),
    "a word met several times and never used is offered as try-using",
  );
  ok(
    !/pattern/.test(await page.locator("#ln-try").locator("xpath=..").innerText()),
    "a word met only once is not offered as try-using",
  );
  ok(
    (await page.locator("#ln-due").count()) === 1 &&
      /analyze/.test(await page.locator("#ln-due").locator("xpath=..").innerText()),
    "a tested word past its review day is offered again",
  );
  await page.locator("#ln-wrote summary").click();
  ok(
    /evidence/.test(await page.locator("#ln-wrote").innerText()) &&
      /analyze/.test(await page.locator("#ln-wrote").innerText()),
    "the written group lists the words that were written",
  );
  ok(
    /Word Lab/.test(await text()) && /Teach It Back/.test(await text()),
    "the sources are named in the learner's own words",
  );
  const lens = await page.locator(".ln").innerText();
  const claim = lens.match(/\b(score|level|rank|streak|mastered|mastery|percent|points)\b/gi);
  ok(
    !claim || claim.every((w) => /^score$/i.test(w) && /not a score/i.test(lens)),
    `no score, level, rank or streak is claimed${claim ? ` (found: ${[...new Set(claim)].join(", ")})` : ""}`,
  );
  ok(/not a score/i.test(body), "the page says it is a record, not a score");

  const stored = await page.evaluate((k) => localStorage.getItem(k), KEY);
  ok(
    !!stored && !/[.!?]\s/.test(stored),
    "the stored record is words and counts, with no sentences",
  );
  ok(
    requests.every((r) => r.includes("localhost") || !/^(POST|PUT)/.test(r)),
    "nothing is sent anywhere",
  );
  await axe("/lens with words");

  await page.setViewportSize({ width: 375, height: 800 });
  ok((await overflow()) <= 1, "no horizontal overflow at 375px");
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.evaluate(() => {
    const k = "accessPracticeLab:v1:prefs";
    localStorage.setItem(k, JSON.stringify({ langChosen: true, band: "6-8", lang: "es" }));
  });
  await go("/lens?grades=6-8");
  ok((await page.locator("h1").innerText()).includes("Mis palabras"), "/lens renders in Spanish");

  // A corrupt record must not break the page.
  await page.evaluate((k) => localStorage.setItem(k, "{not json"), KEY);
  await go("/lens?grades=6-8");
  ok(
    (await page.locator("h1").count()) === 1,
    "a corrupt word record reads as empty and the page still renders",
  );
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n")[0]}`);
}
await finish();
