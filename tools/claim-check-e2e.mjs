#!/usr/bin/env node
/**
 * Misconception Detective (/claim-check) in a real browser: pick a case, read, tap a wrong line (a specific nudge, never
 * the answer) and the right one, sort evidence by keyboard and by tap, choose the fix, write a sentence and see a quote
 * of your own words, reveal, resume after a reload, the hint ladder marking a case supported, Spanish chrome, axe
 * WCAG 2.2 AA on every step, 375px with no overflow, 44px targets, and that nothing leaves the page.
 *
 *   node tools/claim-check-e2e.mjs
 */
import { startRun } from "./lib/lab-e2e.mjs";

const { page, ok, go, axe, overflow, finish } = await startRun("claim-check-e2e");
const requests = [];
page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
const ENGINE = "/access-practice-lab/src/claimcheck/engine.js";
const getCase = (id) =>
  page.evaluate(
    async ([p, i]) => JSON.parse(JSON.stringify((await import(p)).caseById(i))),
    [ENGINE, id],
  );
const text = () => page.locator("#app").innerText();
const step = async () => (await page.locator('.cc-step[aria-current="step"]').innerText()).trim();
const openCase = async (title) => {
  await page.locator("a.cc-case", { hasText: title }).click();
  await page.waitForSelector("#ccStep");
};
const SENTENCE = (c) =>
  `The mistake is about the ${c.accept[0]} because the line does not match the evidence.`;

/** Solve a case through the UI up to and including `upTo`, calling `each(stepName)` on arrival at each step. */
async function solve(c, upTo, each = async () => {}) {
  const order = ["read", "find", "sort", "fix", "reveal"];
  const want = order.indexOf(upTo);
  await each("read");
  if (want < 1) return;
  await page.locator('[data-cc-go="find"]').click();
  await each("find");
  if (want < 2) return;
  await page.locator(`#cc-line-${c.flawed}`).click();
  await page.locator('[data-cc-go="sort"]').click();
  await each("sort");
  if (want < 3) return;
  for (const k of c.cards) await page.locator(`#cc-s-${k.id}-${k.kind}`).check();
  await page.locator('[data-cc-go="fix"]').click();
  await each("fix");
  if (want < 4) return;
  await page.locator(`#cc-f-${c.fix.findIndex((f) => f.correct)}`).check();
  await page.locator("#ccSentence").fill(SENTENCE(c));
  await page.locator("[data-cc-check]").click();
  await page.locator('[data-cc-go="reveal"]').click();
  await each("reveal");
}

try {
  // ---- chooser ---------------------------------------------------------------------------------------------------
  await go("/claim-check?grades=6-8");
  ok(
    (await page.locator("h1").count()) === 1 &&
      (await page.locator("h1").innerText()).includes("Misconception Detective"),
    "/claim-check renders one h1",
  );
  ok(
    (await page.locator("a.cc-case").count()) === 15,
    "the chooser lists the 15 cases for grades 6-8",
  );
  ok((await page.locator("section h2").count()) >= 4, "cases are grouped by subject");
  ok(/finished 0 of 15 cases/.test(await text()), "progress is described in plain words");
  ok(
    !/\b(score|streak|level|rank|timer|stars?)\b/i.test(
      (await text()).replace(/Nothing here is a score\./, ""),
    ),
    "no score, level, streak, rank, timer or stars wording",
  );
  await axe("/claim-check chooser");
  await go("/claim-check?grades=2-3");
  ok(/grades 3–8/.test(await text()), "an early band gets the friendly 'grades 3-8' message");
  await go("/claim-check?grades=3-5");
  ok(
    (await page.locator("a.cc-case").count()) === 15 &&
      /Grades 3–5|Perimeter|Maya/.test(await text()),
    "grades 3-5 has its own 15 cases",
  );
  await go("/claim-check?grades=6-8");

  // ---- case A: independent, keyboard and tap -------------------------------------------------------------------
  const A = await getCase("m68-mean-median");
  await openCase("Books read in a month");
  ok(
    (await step()).includes("Read") &&
      (await page.locator(".cc-line-plain").count()) === A.lines.length,
    "Read shows the explanation as numbered lines",
  );
  ok((await page.locator(".cc-n").first().innerText()) === "1", "lines are numbered");
  await page.locator(".cc-terms summary").click();
  ok(
    /outlier/.test(await page.locator(".cc-terms").innerText()) &&
      /valor atípico/.test(await page.locator(".cc-terms").innerText()),
    "word help gives English and Spanish on demand",
  );
  await axe("read step");
  await page.locator('[data-cc-go="find"]').click();
  ok((await step()).includes("Find"), "Find step");
  ok((await page.locator("button.cc-line").count()) === A.lines.length, "every line is a button");
  await axe("find step");

  const wrong = 0;
  await page.locator(`#cc-line-${wrong}`).click();
  const nudge = await page.locator(".cc-li .cc-note").first().innerText();
  ok(
    /holds up/.test(nudge) && nudge.includes(A.whyFine[wrong].en.slice(0, 30)),
    "a wrong tap gets the specific note about that line",
  );
  ok(
    !nudge.includes(A.lines[A.flawed].en) && !/wrong|mistake/i.test(nudge.replace(/holds up/, "")),
    "the nudge never gives the answer",
  );
  ok(
    (await page.locator('[data-mark="flaw"]').count()) === 0,
    "the flawed line is not revealed by a wrong tap",
  );
  ok(
    !(await page.locator('[data-cc-go="sort"]').count()),
    "Sort stays closed until the line is found",
  );
  await page.locator(`#cc-line-${wrong}`).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  ok(
    await page.evaluate(
      () =>
        getComputedStyle(document.activeElement).outlineStyle !== "none" &&
        parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2,
    ),
    "keyboard focus on a line is clearly visible",
  );
  await page.keyboard.press("Enter");
  ok(
    (await page.locator(".cc-li .cc-note").count()) === 1,
    "a line is operable from the keyboard (Enter)",
  );
  await page.locator(`#cc-line-${A.flawed}`).click();
  ok(
    /line with the mistake/.test(await page.locator('[data-mark="flaw"]').innerText()),
    "the right tap marks the line with words and an icon, not colour alone",
  );
  await axe("find step, line found");
  await page.locator('[data-cc-go="sort"]').click();
  ok(
    (await step()).includes("Sort") &&
      (await page.locator("fieldset.cc-card").count()) === A.cards.length,
    "Sort shows the evidence cards",
  );
  await axe("sort step");

  // keyboard: Space selects the focused radio; arrow keys move between piles
  const [c1, c2, c3, c4] = A.cards;
  await page.locator(`#cc-s-${c1.id}-evidence`).focus();
  await page.keyboard.press("Space");
  ok(
    /Yes\./.test(await page.locator("fieldset.cc-card").nth(0).innerText()) &&
      (await page.locator("fieldset.cc-card").nth(0).innerText()).includes(c1.note.en),
    "keyboard: an evidence card in the right pile gets its own explanation",
  );
  await page.locator(`#cc-s-${c2.id}-evidence`).focus();
  await page.keyboard.press("ArrowRight");
  ok(
    /Not quite\./.test(await page.locator("fieldset.cc-card").nth(1).innerText()),
    "keyboard: arrow keys move a card between piles with immediate feedback",
  );
  ok(
    !(await page.locator("fieldset.cc-card").nth(1).innerText()).includes(c2.note.en),
    "a wrong pile gets a question, not the explanation",
  );
  await page.keyboard.press("ArrowLeft");
  ok(
    /Yes\./.test(await page.locator("fieldset.cc-card").nth(1).innerText()),
    "keyboard: moving back to the right pile is accepted",
  );
  // tap: a wrong pile, then the right one
  await page.locator(`label:has(#cc-s-${c3.id}-evidence)`).click();
  ok(
    /Not quite\./.test(await page.locator("fieldset.cc-card").nth(2).innerText()),
    "tap: a wrong pile gets a specific question",
  );
  await page.locator(`label:has(#cc-s-${c3.id}-assumption)`).click();
  await page.locator(`label:has(#cc-s-${c4.id}-offtopic)`).click();
  ok(
    /Every card is in the right pile/.test(await text()),
    "sorting is complete when every card is right",
  );
  ok((await page.locator('[data-cc-go="fix"]').count()) === 1, "Fix opens after the sort");
  await axe("sort step, finished");
  await page.locator('[data-cc-go="fix"]').click();

  // ---- fix -------------------------------------------------------------------------------------------------------
  ok(
    (await step()).includes("Fix") && (await page.locator('input[name="ccFix"]').count()) === 3,
    "Fix offers three statements",
  );
  const right = A.fix.findIndex((f) => f.correct);
  const badFix = right === 0 ? 1 : 0;
  await page.locator(`label:has(#cc-f-${badFix})`).click();
  const fb = await page.locator(".cc-fb.no").innerText();
  ok(
    /Not quite/.test(fb) &&
      fb.includes(A.cards.find((k) => k.kind === "evidence").en) &&
      !fb.includes(A.fix[right].en),
    "a wrong statement sends the learner back to their own evidence, not to the answer",
  );
  ok(
    (await page.locator("#ccSentence").count()) === 0,
    "the sentence box waits for the right statement",
  );
  await page.locator(`label:has(#cc-f-${right})`).click();
  await page.locator("#ccSentence").waitFor();
  await axe("fix step, sentence box");
  await page.locator("#ccSentence").fill("too short");
  await page.locator("[data-cc-check]").click();
  ok(
    /at least 4 words/.test(await page.locator("#ccAfter").innerText()) &&
      !(await page.locator('[data-cc-go="reveal"]').count()),
    "a too-short sentence is asked to be longer",
  );
  await page.locator("#ccSentence").fill("");
  await page.locator("[data-cc-frame]").click();
  ok(
    (await page.locator("#ccSentence").inputValue()).includes("The mistake is ___ because ___"),
    "the optional frame can be inserted",
  );
  await page.locator("[data-cc-check]").click();
  ok(
    /Replace the blanks/.test(await page.locator("#ccAfter").innerText()),
    "an untouched frame is not accepted as a sentence",
  );
  const typed =
    "The mistake is that the mean is not always best, because an outlier like 12 pulls the mean up.";
  await page.locator("#ccSentence").fill(typed);
  await page.locator("[data-cc-check]").click();
  const obs = await page.locator("#ccAfter").innerText();
  const quotes = [...obs.matchAll(/“([^”]*)”/g)].map((m) => m[1]);
  ok(
    quotes.length >= 1 && quotes.every((q) => typed.includes(q)),
    `the observation quotes the learner's own words verbatim (${quotes.join(", ")})`,
  );
  ok(
    quotes.includes("because") &&
      quotes.some((q) => /mean|outlier|median|average|typical|extreme|large|pull|change/i.test(q)),
    "it found the idea and the reason",
  );
  await page.locator("#ccSentence").fill(`${typed} It changes the average.`);
  ok(
    (await page.locator('[data-cc-go="reveal"]').count()) === 0,
    "editing the sentence asks for a fresh check",
  );
  await page.locator("[data-cc-check]").click();
  await axe("fix step, sentence checked");
  await page.locator('[data-cc-go="reveal"]').click();

  // ---- reveal ----------------------------------------------------------------------------------------------------
  const reveal = await text();
  ok(
    (await step()).includes("Reveal") && reveal.includes("overgeneralization"),
    "Reveal names the kind of flaw",
  );
  ok(
    reveal.includes(A.why.en.slice(0, 60)) && reveal.includes(A.fix[right].en.slice(0, 40)),
    "Reveal explains the accurate idea and states the correct statement",
  );
  ok(reveal.includes(A.transfer.en.slice(0, 40)), "Reveal ends with a transfer prompt");
  ok(
    (await page.locator(".cc-reveal blockquote").nth(1).innerText()).includes(
      "It changes the average.",
    ),
    "the learner's own sentence is shown back unchanged",
  );
  ok(
    /Finished on your own/.test(reveal),
    "a case with no hint is described as finished on your own",
  );
  await axe("reveal step");
  await page.reload();
  await page.waitForSelector("#ccStep");
  ok((await step()).includes("Reveal"), "a reload on a finished case stays on its reveal");
  const ledger = await page.evaluate(
    () => localStorage.getItem("accessPracticeLab:v1:ledger") || "",
  );
  ok(
    /claim-check/.test(ledger) && !/pulls the mean/.test(ledger) && /independent/.test(ledger),
    "the ledger records the case as independent with no learner text",
  );

  // ---- case B: reload mid-case, hint ladder = supported ----------------------------------------------------------
  await go("/claim-check?grades=6-8");
  ok(
    /finished 1 of 15 cases\. 1 on your own, and 0 with a hint open/.test(await text()),
    "progress counts independent cases",
  );
  const B = await getCase("m68-negatives");
  await openCase("Which is greater");
  await page.locator('[data-cc-go="find"]').click();
  await page.locator("#cc-line-0").click();
  await page.locator(`#cc-line-${B.flawed}`).click();
  await page.reload();
  await page.waitForSelector("#ccStep");
  ok(
    (await step()).includes("Find") && (await page.locator(".cc-li .cc-note").count()) === 2,
    "a reload keeps the tapped lines and the found line",
  );
  await page.locator('[data-cc-go="sort"]').click();
  await page.locator(`#cc-s-${B.cards[0].id}-evidence`).check();
  await page.locator(`#cc-s-${B.cards[2].id}-evidence`).check();
  await page.reload();
  await page.waitForSelector("#ccStep");
  ok(
    (await step()).includes("Sort") &&
      (await page.locator(`#cc-s-${B.cards[0].id}-evidence`).isChecked()) &&
      (await page.locator(`#cc-s-${B.cards[2].id}-evidence`).isChecked()),
    "a reload keeps the sorted cards, right and not-yet-right",
  );
  ok(
    /Not quite/.test(await page.locator("fieldset.cc-card").nth(2).innerText()),
    "the specific feedback comes back after a reload",
  );

  ok(
    (await page.locator(".cc-hint-list").count()) === 0,
    "no hint is shown until the learner opens one",
  );
  const flawedText = B.lines[B.flawed].en;
  for (let n = 1; n <= 3; n++) {
    await page.locator("[data-cc-hint]").click();
    ok((await page.locator(".cc-hint-list li").count()) === n, `hint ${n} opens, one at a time`);
  }
  const hints = await page.locator(".cc-hint-list").innerText();
  ok(
    !hints.includes(flawedText) &&
      !hints.includes(B.fix.find((f) => f.correct).en) &&
      !/\bline\s*\d/i.test(hints),
    "the three hints never state the flawed line, its number or the fix",
  );
  ok(
    /outlier|number line|negative|kind of mistake|wrong fact/i.test(hints) &&
      /wrong fact/.test(hints),
    "hint 3 names the kind of mistake",
  );
  ok((await page.locator("[data-cc-hint]").count()) === 0, "the ladder ends after three hints");
  await page.reload();
  await page.waitForSelector("#ccStep");
  ok((await page.locator(".cc-hint-list li").count()) === 3, "opened hints survive a reload");
  for (const k of B.cards) await page.locator(`#cc-s-${k.id}-${k.kind}`).check();
  await page.locator('[data-cc-go="fix"]').click();
  await page.locator(`#cc-f-${B.fix.findIndex((f) => f.correct)}`).check();
  await page.locator("#ccSentence").fill("The mistake is the greater");
  await page.reload();
  await page.waitForSelector("#ccSentence");
  ok(
    (await page.locator("#ccSentence").inputValue()) === "The mistake is the greater" &&
      (await step()).includes("Fix"),
    "a typed sentence survives a reload mid-case",
  );
  ok(
    (await page.locator("#ccAfter").innerText()).trim() === "",
    "a sentence that was not checked shows no observation after the reload",
  );
  await page.locator("#ccSentence").fill(SENTENCE(B));
  await page.locator("[data-cc-check]").click();
  await page.locator('[data-cc-go="reveal"]').click();
  ok(
    /Finished with help: you opened 3 hints/.test(await text()),
    "a case with hints opened is marked supported",
  );
  const ledger2 = await page.evaluate(
    () => localStorage.getItem("accessPracticeLab:v1:ledger") || "",
  );
  ok(/"stage":"supported"/.test(ledger2), "the ledger records the supported case as supported");
  await go("/claim-check?grades=6-8");
  ok(
    /finished 2 of 15 cases\. 1 on your own, and 1 with a hint open/.test(await text()),
    "independent and supported cases are counted separately",
  );

  // ---- resume card -----------------------------------------------------------------------------------------------
  const C = await getCase("m68-ratio");
  await openCase("Notebook prices");
  await page.locator('[data-cc-go="find"]').click();
  await go("/claim-check?grades=6-8");
  ok(
    (await page.locator(".cc-progress a.btn-primary").count()) === 1 &&
      /Notebook prices/.test(await page.locator(".cc-progress a.btn-primary").innerText()),
    "the chooser offers a resume card for the unfinished case",
  );
  await page.locator(".cc-progress a.btn-primary").click();
  await page.waitForSelector("#ccStep");
  ok((await step()).includes("Find"), "resume lands on the step where the learner stopped");
  ok(
    /In progress: step 2 of 5/.test(
      await (async () => {
        await go("/claim-check?grades=6-8");
        return text();
      })(),
    ),
    "the case card says where the learner is",
  );
  ok(C.flawed >= 0, "case C loaded");

  // ---- stored data and network -----------------------------------------------------------------------------------
  const stored = await page.evaluate(
    () => localStorage.getItem("accessPracticeLab:v1:claim-check") || "",
  );
  ok(
    stored.includes("m68-mean-median") &&
      JSON.parse(stored).done["m68-mean-median"]?.independent === true,
    "progress is saved under the one claim-check key",
  );
  ok(
    requests.every((r) => /^GET http:\/\/localhost/.test(r)),
    "every request is a GET to this origin: nothing leaves the device",
  );
  ok(
    !requests.some((r) => /pulls%20the|pulls the|outlier/i.test(r)),
    "no request carries the learner's words",
  );

  // ---- Spanish ---------------------------------------------------------------------------------------------------
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ langChosen: true, band: "6-8", lang: "es" }),
    ),
  );
  await go("/claim-check?grades=6-8");
  ok(
    (await page.locator("h1").innerText()).includes("Detective de ideas equivocadas"),
    "chooser renders in Spanish",
  );
  ok(/Has terminado 2 de 15 casos/.test(await text()), "progress is in Spanish");
  await axe("Spanish chooser");
  await openCase("Notebook prices").catch(async () => page.locator("a.cc-case").nth(0).click());
  await page.waitForSelector("#ccStep");
  ok(
    /Encontrar|Leer/.test(await page.locator(".cc-steps").innerText()) &&
      (await page.locator(".bi-es, [lang=es]").count()) > 0,
    "case chrome is Spanish and the English text carries its Spanish gloss",
  );
  await axe("Spanish case step");
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ langChosen: true, band: "6-8" }),
    ),
  );

  // ---- 375px: every step, no overflow, 44px targets, axe ---------------------------------------------------------
  await page.setViewportSize({ width: 375, height: 800 });
  await go("/claim-check?grades=6-8");
  ok((await overflow()) <= 1, "chooser: no horizontal overflow at 375px");
  const D = await getCase("m68-percent");
  await openCase("Two discounts");
  const small = [];
  await solve(D, "reveal", async (name) => {
    ok((await overflow()) <= 1, `${name}: no horizontal overflow at 375px`);
    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll(".cc button, .cc .cc-opt, .cc a.btn, .cc summary, .cc-case")]
        .filter((e) => e.getClientRects().length && !e.closest("[hidden]"))
        .map((e) => ({
          t: (e.innerText || "").trim().slice(0, 30),
          h: e.getBoundingClientRect().height,
          w: e.getBoundingClientRect().width,
        })),
    );
    small.push(
      ...boxes
        .filter((b) => b.h < 43.5 || b.w < 43.5)
        .map((b) => `${name}:${b.t}(${Math.round(b.w)}x${Math.round(b.h)})`),
    );
  });
  ok(
    small.length === 0,
    `every control is at least 44px at 375px${small.length ? `: ${small.slice(0, 4).join(" | ")}` : ""}`,
  );
  await axe("reveal step at 375px");
  ok(
    await page.evaluate(
      () =>
        matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.getAnimations().length === 0,
    ),
    "reduced motion is honored: nothing animates",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n")[0]}`);
}
await finish();
