// Vocabulary Sets, driven the way a teacher and a student use them (Chromium): make a set, save it, reload, practice
// all four modes and the class presentation, open the student link in a fresh browser (no editing, no teacher tools),
// export and re-import, print, delete, then 390px and axe. Serves the source tree (tools/lib/access-serve.mjs).
// A missing browser is a SKIP (exit 3).

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP vocab-sets-e2e: playwright not installed");
  process.exit(3);
}
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

let server;
let base = process.env.BASE;
if (!base) ({ server, base } = await serveAccess());
const LAB = `${base}/access-practice-lab`;
const browser = await chromium.launch().catch(() => null);
if (!browser) {
  console.log("SKIP vocab-sets-e2e: no browser");
  process.exit(3);
}
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const WORDS = [
  "habitat | the place where a plant or animal lives | A pond is a habitat for frogs. | hábitat",
  "predator | an animal that hunts other animals | The owl is a predator. | depredador",
  "adapt | to change to fit a new place | Some birds adapted to the cold. | adaptarse",
  "prey | an animal that is hunted | | presa",
  "survive | to stay alive | Plants need water to survive. | sobrevivir",
].join("\n");

const watch = (page, errors) => {
  page.on("pageerror", (e) => !/"web-vitals"/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|Failed to load resource.*\/api\/|"web-vitals"/.test(m.text()) &&
      errors.push(m.text()),
  );
};
const axe = async (page, label) => {
  await page.mouse.move(0, 0); // a resting pointer must not leave a hover state under the check
  await page.waitForTimeout(400); // let the shell's 0.18s color transitions settle before measuring contrast
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(() =>
    window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag22aa"] }),
  );
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(
    !bad.length,
    `${label}: axe serious/critical ${bad.map((v) => `${v.id} ${v.nodes.map((n) => n.html.slice(0, 80)).join(" ; ")}`).join(", ") || "0"}`,
  );
};
const fits = async (page, label) =>
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    `${label}: no sideways scroll`,
  );
const text = (page) => page.locator(".vs").innerText();

// ── teacher, 1280px ─────────────────────────────────────────────────────────
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  acceptDownloads: true,
});
const page = await ctx.newPage();
const errors = [];
watch(page, errors);
await page.addInitScript(() => {
  window.print = () => {};
});

await page.goto(`${LAB}/vocab-sets?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector("#vsHead");
check(/No sets yet/.test(await text(page)), "empty state says no sets yet");
await fits(page, "list");
await axe(page, "list");

await page.click('a[href*="vocab-sets/new"]');
await page.waitForSelector("#vsEditHead");
await page.fill('[data-vs-field="title"]', "Animals unit");
await page.fill('[data-vs-field="text"]', `${WORDS}\nHabitat | duplicate row\n | no word`);
await page.click('[data-vsa="save"]');
await page.waitForSelector(".vs-errors");
const errText = await page.locator(".vs-errors").innerText();
check(/Line 6/.test(errText) && /Line 7/.test(errText), "errors name the exact lines");
check(
  (await page.locator(".vs-errors button").count()) === 1,
  "offers to save without the bad lines",
);
await axe(page, "editor with errors");
await page.click('[data-vsa="save-anyway"]');
await page.waitForSelector("#vsSetHead");
check(
  (await page.locator("#vsSetHead").innerText()) === "Animals unit",
  "saved set opens at its own page",
);
check(/Saved on this device/.test(await text(page)), "save status is truthful and visible");
check(/5 words/.test(await text(page)), "only the 5 good rows were saved");
const setUrl = page.url().replace(/\?.*$/, "");
// A hovered ghost button must stay readable (ds.css once turned its text white on a pale tint).
await page.hover('[data-vsa="duplicate"]');
await page.waitForTimeout(400);
const hoverRatio = await page.locator('[data-vsa="duplicate"]').evaluate((el) => {
  const lum = (rgb) => {
    const [r, g, b] = rgb
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map((v) => {
        const c = Number(v) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const cs = getComputedStyle(el);
  const [a, b] = [lum(cs.color), lum(cs.backgroundColor)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
});
check(hoverRatio >= 4.5, `hovered ghost button keeps readable text (${hoverRatio.toFixed(1)}:1)`);
await page.mouse.move(0, 0);
await fits(page, "set home");
await axe(page, "set home");

await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector("#vsSetHead");
check((await page.locator("#vsSetHead").innerText()) === "Animals unit", "set survives a reload");

// flashcards
await page.goto(`${setUrl}/cards?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector(".vs-card");
check(
  /habitat/.test(await page.locator(".vs-card").innerText()) &&
    !/place where/.test(await page.locator(".vs-card").innerText()),
  "card front shows only the word",
);
await page.click(".vs-card");
check(
  /place where a plant/.test(await page.locator(".vs-card").innerText()),
  "flip shows the meaning",
);
check(/hábitat/.test(await page.locator(".vs-card").innerText()), "translation shows when on");
await page.uncheck('[data-vs-toggle="showTranslation"]');
check(!/hábitat/.test(await page.locator(".vs-card").innerText()), "translation hides when off");
await axe(page, "flashcards");
await page.keyboard.press("ArrowRight");
check(/Card 2 of 5/.test(await text(page)), "arrow key moves to the next card");
await page.click('[data-vs="again"]');
await page.click('[data-vs="got"]');
await page.click('[data-vs="got"]');
check(/Card 5 of 5/.test(await text(page)), "walks to the last card");
await page.click('[data-vs="got"]');
await page.waitForSelector(".vs-done");
check(/knew 3 of 5/.test(await text(page)), "summary counts the cards marked got it");
await page.click('[data-vs="again-missed"]');
await page.waitForSelector(".vs-card");
check(/Card 1 of 1/.test(await text(page)), "practice-the-missed reruns only the missed card");

// match
await page.goto(`${setUrl}/match?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector(".vs-pick");
const ids = await page
  .locator('[data-side="term"]')
  .evaluateAll((els) => els.map((e) => e.dataset.id));
await page.locator(`[data-side="term"][data-id="${ids[0]}"]`).click();
await page.locator(`[data-side="def"][data-id="${ids[1]}"]`).click();
check(/do not go together/.test(await text(page)), "wrong match gets a calm message");
check(
  (await page.locator(".vs-pick:disabled").count()) === 0,
  "a wrong match locks nothing and reveals nothing",
);
for (const id of ids) {
  await page.locator(`[data-side="term"][data-id="${id}"]`).click();
  await page.locator(`[data-side="def"][data-id="${id}"]`).click();
}
await page.waitForSelector(".vs-done");
check(/matched every word/.test(await text(page)), "match finishes when every pair is matched");

// finish the sentence
await page.goto(`${setUrl}/cloze?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector("#vsAnswer");
check(
  /4 sentences|Sentence 1 of 4/.test(await text(page)),
  "4 sentences built (prey has no example)",
);
check(/1 word\(s\) have no example/.test(await text(page)), "page says which words were left out");
const prompt1 = await page.locator(".vs-sentence").innerText();
check(prompt1.includes("_____") && !/habitat/i.test(prompt1), "the blank hides the word");
await page.fill("#vsAnswer", "wrong");
await page.press("#vsAnswer", "Enter");
check(/Not yet/.test(await text(page)), "Enter checks, and a miss gets a hint");
await page.fill("#vsAnswer", "still wrong");
await page.click('[data-vs="check"]');
check(/The answer is/.test(await text(page)), "after two misses the answer is shown");
await axe(page, "cloze");
for (let n = 0; n < 4; n++) {
  const sentence = await page.locator(".vs-sentence").innerText();
  const answer = {
    "A pond is a _____ for frogs.": "habitat",
    "The owl is a _____.": "predator",
    "Some birds _____ to the cold.": "adapted",
    "Plants need water to _____.": "survive",
  }[sentence];
  if (await page.locator('[data-vs="next-round"]').count())
    await page.click('[data-vs="next-round"]');
  const typed = await page
    .locator("#vsAnswer")
    .inputValue()
    .catch(() => "");
  if (typed !== undefined && (await page.locator("#vsAnswer:enabled").count())) {
    await page.fill("#vsAnswer", answer);
    await page.click('[data-vs="check"]');
  }
  if (await page.locator('[data-vs="next-round"]').count())
    await page.click('[data-vs="next-round"]');
}
check((await page.locator(".vs-done").count()) === 1, "sentences finish");

// quiz
await page.goto(`${setUrl}/quiz?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-vs="option"]');
check((await page.locator('[data-vs="option"]').count()) === 4, "quiz offers four real words");
await axe(page, "quiz");
for (let n = 0; n < 5; n++) {
  const opts = await page
    .locator('[data-vs="option"]')
    .evaluateAll((els) => els.map((e) => e.dataset.value));
  const prompt = await page.locator(".vs-sentence").innerText();
  const answer = {
    "the place where a plant or animal lives": "habitat",
    "an animal that hunts other animals": "predator",
    "to change to fit a new place": "adapt",
    "an animal that is hunted": "prey",
    "to stay alive": "survive",
  }[prompt];
  const wrong = opts.find((o) => o !== answer);
  if (n === 0) {
    await page.locator(`[data-vs="option"][data-value="${wrong}"]`).click();
    check(
      /Not that one/.test(await text(page)) &&
        (await page.locator(`[data-vs="option"][data-value="${wrong}"]:disabled`).count()) === 1,
      "a wrong pick is greyed out with a hint",
    );
  }
  await page.locator(`[data-vs="option"][data-value="${answer}"]`).click();
  await page.click('[data-vs="next-round"]');
}
await page.waitForSelector(".vs-done");
check(
  /4 of 5 right on the first try/.test(await text(page)),
  "quiz counts first-try answers honestly",
);

// present
await page.goto(`${setUrl}/present?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector(".vs-big");
check((await page.locator('[data-vs="got"]').count()) === 0, "presentation has no student buttons");
const fontSize = await page
  .locator(".vs-term")
  .evaluate((e) => Number.parseFloat(getComputedStyle(e).fontSize));
check(fontSize >= 48, `presentation word is large (${fontSize}px)`);

// share, print, export
await page.goto(`${setUrl}?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector("[data-vs-link]");
const link = await page.locator("[data-vs-link]").inputValue();
check(
  /\/access-practice-lab\/vocab-sets\/play#s=[\w-]+$/.test(link),
  "student link carries the set in the fragment",
);
await page.click('[data-vsa="print-cards"]');
check(
  (await page.locator("#sheetPrint .vs-print-card").count()) === 5,
  "print cards makes one card per word",
);
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.click('[data-vsa="print-review"]');
const review = await page.locator("#sheetPrint").innerText();
check(
  /Part A/.test(review) && /Part B/.test(review) && /_____/.test(review),
  "review sheet has matching and sentences",
);
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.click('[data-vsa="print-key"]');
check(
  /Answer key/.test(await page.locator("#sheetPrint").innerText()),
  "answer key prints separately",
);
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click('[data-vsa="export"]'),
]);
const exportPath = await download.path();
check(
  /\.json$/.test(download.suggestedFilename()),
  `export downloads a json file (${download.suggestedFilename()})`,
);

// student, fresh browser, 390px
const sctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const spage = await sctx.newPage();
const serrors = [];
watch(spage, serrors);
await spage.goto(link, { waitUntil: "networkidle" });
await spage.waitForSelector("#vsSetHead");
check(
  (await spage.locator("#vsSetHead").innerText()) === "Animals unit",
  "student opens the shared set with no account",
);
const studentText = await text(spage);
check(
  !/Delete|Edit set|Print answer key|Export file|Duplicate/.test(studentText),
  "student page has no teacher tools",
);
check((await spage.locator("[data-vsa]").count()) === 0, "student page has no teacher actions");
check(
  (await spage.locator('a[href*="/present"]').count()) === 0,
  "student page does not offer presentation mode",
);
await fits(spage, "student home @390");
await axe(spage, "student home @390");
await spage.click('a[href*="play/cards"]');
await spage.waitForSelector(".vs-card");
check(
  /habitat/.test(await spage.locator(".vs-card").innerText()),
  "student flashcards work from the link",
);
await fits(spage, "student flashcards @390");
await axe(spage, "student flashcards @390");
await spage.goto(`${LAB}/vocab-sets/play#s=garbage`, { waitUntil: "networkidle" });
await spage.waitForSelector("h1");
check(/could not find/i.test(await text(spage)), "a broken link says so instead of crashing");
check(!serrors.length, `student: no console or page errors ${serrors.slice(0, 3).join(" | ")}`);
await sctx.close();

// import in another fresh browser
const ictx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const ipage = await ictx.newPage();
const ierrors = [];
watch(ipage, ierrors);
await ipage.goto(`${LAB}/vocab-sets?grades=6-8`, { waitUntil: "networkidle" });
await ipage.waitForSelector("[data-vs-import]");
await ipage.setInputFiles("[data-vs-import]", exportPath);
await ipage.waitForSelector(".vs-sets");
check(/Animals unit/.test(await text(ipage)), "exported file imports into a fresh browser");
await ipage.setInputFiles("[data-vs-import]", {
  name: "bad.json",
  mimeType: "application/json",
  buffer: Buffer.from("not json"),
});
await ipage.waitForFunction(() => /not a vocabulary set/.test(document.body.innerText));
check(true, "a bad file is refused with a message");
check(!ierrors.length, `import: no console or page errors ${ierrors.slice(0, 3).join(" | ")}`);
await ictx.close();

// delete needs a confirmation, then removes
await page.goto(`${setUrl}?grades=6-8`, { waitUntil: "networkidle" });
await page.click('[data-vsa="delete"]');
check(/cannot be undone/.test(await text(page)), "delete asks first, inside the page");
await page.click('[data-vsa="delete-no"]');
check((await page.locator("#vsSetHead").count()) === 1, "keeping it leaves the set alone");
await page.click('[data-vsa="delete"]');
await page.click('[data-vsa="delete-yes"]');
await page.waitForSelector("#vsHead");
check(/No sets yet/.test(await text(page)), "delete removes the set");

// teacher hub link
await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
check(
  (await page.locator('a[href*="vocab-sets"]').count()) >= 1,
  "Teacher Hub links to vocabulary sets",
);

check(!errors.length, `teacher: no console or page errors ${errors.slice(0, 3).join(" | ")}`);
await ctx.close();
await browser.close();
server?.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");
process.exit(fails.length ? 1 : 0);
