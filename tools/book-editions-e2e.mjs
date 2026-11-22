// Book Studio support editions, driven from the bookshelf in Chromium: make an edition of a book for one support
// level, see that the story is unchanged and only that level's supports came along, compare it with the original,
// and be warned when an edit changes the story. Books are seeded through the app's own modules. Serves the source tree.
// A missing browser is a SKIP (exit 3).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP book-editions-e2e: playwright not installed");
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
  console.log("SKIP book-editions-e2e: no browser");
  process.exit(3);
}
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
const axe = async (page, label, include) => {
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(
    (inc) =>
      window.axe.run(inc ? { include: [[inc]] } : document, {
        runOnly: ["wcag2a", "wcag2aa", "wcag22aa"],
      }),
    include || null,
  );
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(
    !bad.length,
    `${label}: axe serious/critical ${bad.map((v) => `${v.id} ${v.nodes.map((n) => n.html.slice(0, 70)).join(" ; ")}`).join(", ") || "0"}`,
  );
};

const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => !/"web-vitals"/.test(e.message) && errors.push(e.message));
page.on(
  "console",
  (m) =>
    m.type() === "error" &&
    !/favicon|Failed to load resource|"web-vitals"/.test(m.text()) &&
    errors.push(m.text()),
);

await page.goto(`${LAB}/book-studio?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector("[data-shelf-list]");

// Seed one book with supports for different levels, through the app's own modules.
const original = await page.evaluate(async () => {
  const { newBook, makeElement, normalizeBook } = await import(
    "/access-practice-lab/src/book/model.js"
  );
  const { makeSupport } = await import("/access-practice-lab/src/book/lang/supports.js");
  const db = await import("/access-practice-lab/src/book/db.js");
  const base = newBook({ kind: "blank", title: "The Fox", author: "Mr. Neft" });
  const pages = base.pages.slice(0, 2);
  while (pages.length < 2) pages.push(JSON.parse(JSON.stringify(pages[0])));
  pages[0].elements = [makeElement("text", { html: "<p>The fox ran to the cave.</p>" })];
  pages[1].elements = [makeElement("text", { html: "<p>It was dark inside.</p>" })];
  const S = (title, props) =>
    makeSupport("frame", "starter", { title, content: { frames: [`${title} ___`] }, ...props });
  const supports = [
    S("heavy-L1", {
      levels: [1],
      intensity: "heavy",
      target: { scope: "page", pageId: pages[0].id },
    }),
    S("moderate-L3", { levels: [3], intensity: "moderate" }),
    S("minimal-L5", { levels: [5], intensity: "minimal" }),
    S("required-any", { levels: [], intensity: "minimal", required: true }),
    S("heavy-any", { levels: [], intensity: "heavy" }),
    S("teacher-note", { levels: [], intensity: "minimal", authoringOnly: true }),
  ];
  const book = normalizeBook({ ...base, pages, supports });
  await db.saveBook(book);
  return { id: book.id, supports: book.supports.length };
});
check(original.supports === 6, "seeded a book with six supports");

await page.reload({ waitUntil: "networkidle" });
const card = (id) => page.locator(`li.bk-card[data-book="${id}"]`);
await card(original.id).waitFor();
check(
  (await page.locator('[data-shelf="edition-open"]').count()) >= 1,
  "every book's menu offers Make a support edition",
);
check(
  (await card(original.id).locator('[data-shelf="compare"]').count()) === 0,
  "an original has no Compare action",
);

await card(original.id).locator("summary").click();
await card(original.id).locator('[data-shelf="edition-open"]').click();
await page.waitForSelector("[data-edition-panel]");
check(
  (await page.locator("[data-edition-level] option").count()) === 6,
  "the panel offers all six support levels",
);
check(
  /not an official proficiency level/.test(await page.locator("[data-edition-panel]").innerText()),
  "the panel says a support level is not a proficiency level",
);
await axe(page, "edition panel", "[data-edition-panel]");
await page.selectOption("[data-edition-level]", "1");
await page.fill("[data-edition-label]", "Starting");
await page.click('[data-shelf="edition-make"]');
await page.waitForSelector("[data-edition-chip]");
const editionId = await page
  .locator("li.bk-card", { has: page.locator("[data-edition-chip]") })
  .first()
  .getAttribute("data-book");
check(
  Boolean(editionId) && editionId !== original.id,
  "a new book card appears with a support-edition chip",
);
check(
  /Support edition: Entering/.test(await card(editionId).innerText()),
  "the chip names the level (Entering)",
);
check(
  /The Fox · Starting/.test(await card(editionId).innerText()),
  "the title carries the edition name",
);

const facts = await page.evaluate(
  async ([orig, ed]) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    const { storyFingerprint } = await import("/access-practice-lab/src/book/editions.js");
    const [a, b] = await Promise.all([db.getBook(orig), db.getBook(ed)]);
    return {
      originalSupports: a.supports.length,
      editionSupports: b.supports.map((s) => s.title).sort(),
      allPublished: b.supports.every((s) => s.inPublished),
      sameStory: storyFingerprint(a).hash === storyFingerprint(b).hash,
      source: b.source,
      planProfile: b.plan.profile,
    };
  },
  [original.id, editionId],
);
check(facts.originalSupports === 6, "the original book was not changed");
check(
  JSON.stringify(facts.editionSupports) ===
    JSON.stringify(["heavy-L1", "heavy-any", "required-any"]),
  `the edition carries only level 1's supports (${facts.editionSupports.join(", ")})`,
);
check(facts.allPublished, "every edition support is marked published");
check(facts.sameStory, "the edition's story text matches the original");
check(
  facts.source?.kind === "edition" && facts.source?.id === original.id,
  "the edition records which book it came from",
);
check(facts.planProfile === 1, "the edition's plan is level 1");
check(
  !/teacher-note/.test(JSON.stringify(facts.editionSupports)),
  "an authoring-only note did not reach the edition",
);

// Compare
await card(editionId).locator("summary").click();
await card(editionId).locator('[data-shelf="compare"]').click();
await page.waitForSelector('[aria-label="Compare with the original"]');
const cmp = await page.locator('[aria-label="Compare with the original"]').innerText();
check(/The story is the same as the original/.test(cmp), "compare says the story is the same");
check(/moderate-L3/.test(cmp) && /minimal-L5/.test(cmp), "compare lists what the edition left out");
await axe(page, "compare panel", '[aria-label="Compare with the original"]');

// Drift: change the edition's story, compare again.
await page.evaluate(async (ed) => {
  const db = await import("/access-practice-lab/src/book/db.js");
  const b = await db.getBook(ed);
  b.pages[0].elements[0].html = "<p>The fox ran to the barn.</p>";
  await db.saveBook(b);
}, editionId);
await page.reload({ waitUntil: "networkidle" });
await card(editionId).locator("summary").click();
await card(editionId).locator('[data-shelf="compare"]').click();
await page.waitForSelector('[aria-label="Compare with the original"]');
check(
  /story text is different from the original/.test(
    await page.locator('[aria-label="Compare with the original"]').innerText(),
  ),
  "compare warns when the edition's story has drifted",
);

// The edition opens in the reader like any book.
await page.goto(`${LAB}/book-studio/read/${editionId}?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector("h1, .bk-reader, [data-reader]", { timeout: 15000 }).catch(() => {});
check(/barn|Fox/i.test(await page.locator("body").innerText()), "the edition opens in the reader");

// Phone width with the compare panel open, on the same shelf.
await page.goto(`${LAB}/book-studio?grades=6-8`, { waitUntil: "networkidle" });
await page.setViewportSize({ width: 390, height: 844 });
await card(editionId).locator("summary").click();
await card(editionId).locator('[data-shelf="compare"]').click();
await page.waitForSelector('[aria-label="Compare with the original"]');
check(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  "@390 no sideways scroll with the compare panel open",
);
await card(editionId).locator("summary").click();
await card(editionId).locator('[data-shelf="edition-open"]').click();
await page.waitForSelector("[data-edition-panel]");
check(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  "@390 no sideways scroll with the edition panel open",
);
const small = await page
  .locator("[data-edition-panel] button, [data-edition-panel] select, [data-edition-panel] input")
  .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 43).length);
check(small === 0, "@390 every control in the edition panel is at least 44px tall");

check(!errors.length, `no console or page errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
server?.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");
process.exit(fails.length ? 1 : 0);
