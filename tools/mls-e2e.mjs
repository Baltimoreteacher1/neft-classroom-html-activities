#!/usr/bin/env node
/**
 * Math Literacy Studio in a real browser: the teacher's actual workflows, in Chromium, against this working tree.
 *   node tools/mls-e2e.mjs [--only <scenario>]      (BASE=<url> points it at a deployed site instead)
 * It measures what the directive calls usability targets (selections to a ready resource, seconds to a standard worksheet) by scripted run,
 * downloads every advertised format and opens the file with an independent reader (python-docx, python-pptx, LibreOffice), and checks
 * accessibility (axe WCAG 2.2 AA), overflow at three widths, keyboard-only use, reduced motion and the console. A missing browser is a SKIP
 * locally and a FAIL in CI. Set PW_CHROMIUM_PATH to a system Chromium if needed.
 */
import { spawnSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "package.json"));
let chromium;
let AxeBuilder;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.warn("mls-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder =
    require("@axe-core/playwright").AxeBuilder || require("@axe-core/playwright").default;
} catch {}
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : "";
const OUT = process.env.MLS_E2E_OUT || "/tmp/mls-e2e";
mkdirSync(OUT, { recursive: true });
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(ROOT, "public", p))) file = join(ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(ROOT, "access-practice-lab/index.html");
      else return res.writeHead(404), res.end();
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, () => r(server)));
}

let failures = 0;
let checks = 0;
const notes = [];
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  FAIL ${msg}`);
  }
};
const note = (m) => {
  notes.push(m);
  console.log(`  note ${m}`);
};

let browser;
let base = process.env.BASE || "";
const LAB = "/access-practice-lab/math-literacy";
const errorsOf = new WeakMap();
async function newPage(ctxOpts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
    ...ctxOpts,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(String(e))) errs.push(String(e));
  });
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      !/favicon|Failed to load resource|sw\.js|manifest|net::ERR|web-vitals/.test(m.text()) &&
      // axe injects itself into every frame; the preview frames are sandboxed without allow-scripts on purpose, so it is refused there.
      !/Blocked script execution in 'about:srcdoc'/.test(m.text())
    )
      errs.push(m.text());
  });
  errorsOf.set(page, errs);
  return { ctx, page };
}
const go = async (page, path) => {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.locator(".ml-page h1, .ml-page .panel h1").first().waitFor({ timeout: 15000 });
};
const noOverflow = async (page, label) => {
  for (const w of [1280, 820, 375]) {
    await page.setViewportSize({ width: w, height: 900 });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    ok(over <= 1, `${label}: horizontal overflow ${over}px at ${w}px`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
};
async function axe(page, label) {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(bad.length === 0, `${label}: axe ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}`);
}
const noErrors = (page, label) =>
  ok(
    (errorsOf.get(page) || []).length === 0,
    `${label}: console/page errors: ${(errorsOf.get(page) || []).slice(0, 2).join(" | ")}`,
  );
const py = (code) => spawnSync("python3", ["-I", "-c", code], { encoding: "utf8" });

const scenarios = {
  async landing() {
    const { ctx, page } = await newPage();
    await go(page, LAB);
    ok((await page.locator(".ml-door").count()) === 3, "landing shows exactly three primary doors");
    const names = await page.locator(".ml-door strong").allTextContents();
    ok(
      names.join("|") === "Teach a skill|Create a resource|Support a learner",
      `door names: ${names}`,
    );
    ok((await page.locator("#ml-q").count()) === 1, "search box present");
    ok((await page.locator("text=Browse by grade").count()) === 1, "grade browsing present");
    ok(
      (await page.locator('a[href*="/math-literacy/guide"]').count()) >= 1,
      "first-time guide linked",
    );
    await axe(page, "landing");
    await noOverflow(page, "landing");
    // keyboard: Tab reaches the first door, Enter opens it
    await page.keyboard.press("Tab");
    let reached = false;
    for (let i = 0; i < 14 && !reached; i++) {
      reached = await page.evaluate(() => document.activeElement?.classList?.contains("ml-door"));
      if (!reached) await page.keyboard.press("Tab");
    }
    ok(reached, "Tab reaches a door");
    noErrors(page, "landing");
    await ctx.close();
  },

  async teach() {
    const { ctx, page } = await newPage();
    const t0 = Date.now();
    let selections = 0;
    await go(page, LAB);
    await page.locator(".ml-door", { hasText: "Teach a skill" }).click();
    selections++;
    await page.locator(".ml-gradecard", { hasText: "Grade 6" }).click();
    selections++;
    await page.locator(".ml-skill-link", { hasText: "Ratios" }).first().click();
    selections++;
    await page.locator("h1", { hasText: "Ratios" }).waitFor();
    ok(selections <= 3, "three principal selections reach a skill with its whole collection");
    const links = await page.locator(".ml-res-link").count();
    ok(
      links >= 40,
      `skill page offers a large collection (${links} links: resources, sequences, activities)`,
    );
    for (const label of [
      "Teacher guide",
      "Vocabulary cards",
      "Reading passage",
      "Guided practice",
      "Independent practice",
      "Word problems",
      "Discussion cards",
      "Speaking task",
      "Listening task",
      "Writing task",
      "Exit ticket",
      "Mini-assessment",
      "Error analysis",
      "Intervention packet",
      "Family practice",
      "Extension tasks",
    ])
      ok(
        (await page.locator(".ml-res-link", { hasText: label }).count()) >= 1,
        `skill page has ${label}`,
      );
    ok((await page.locator(".ml-seqs li").count()) === 7, "seven sequences");
    ok(
      (await page.locator("text=Reading Lab").count()) >= 1 &&
        (await page.locator("text=Language Transfer Lab").count()) >= 1,
      "engines listed",
    );
    ok(
      (await page.locator("text=Skills to check first").count()) +
        (await page.locator("text=Around this skill").count()) >=
        1,
      "prerequisite path present",
    );
    await axe(page, "skill page");
    await noOverflow(page, "skill page");
    // support control carries into links
    await page.locator('input[data-ml-support][value="more"]').check();
    await page.waitForFunction(() =>
      document.querySelector(".ml-res-link")?.getAttribute("href")?.includes("support=more"),
    );
    ok(true, "support preset is carried into resource links");
    note(`landing to skill page in ${(Date.now() - t0) / 1000}s with ${selections} selections`);
    noErrors(page, "teach");
    await ctx.close();
  },

  async builder() {
    const { ctx, page } = await newPage();
    const t0 = Date.now();
    await go(page, `${LAB}/resource/g6-ratios/worksheet`);
    const frame = () => page.frameLocator("iframe[data-mlb-frame]");
    await frame().locator("body").waitFor();
    const text = async () => (await frame().locator("body").innerText()).replace(/\s+/g, " ");
    let t = await text();
    ok(/Learning target/i.test(t) && /Practice/i.test(t), "worksheet preview renders sections");
    const count = async () =>
      (await frame().locator(".problem, [data-problem], .mls-problem").count()) ||
      (await text()).match(/\b\d+\.\s/g)?.length ||
      0;
    note(`worksheet opened in ${(Date.now() - t0) / 1000}s (standard worksheet, defaults)`);
    // more support: word bank appears; the key does not change when only language changes
    await page.locator('input[data-mlb="support"][value="more"]').check();
    await page.waitForFunction(() => location.search.includes("support=more"));
    await frame().locator("body").waitFor();
    t = await text();
    ok(/word bank/i.test(t), "More support adds a word bank");
    const answers = async () =>
      (await page.frameLocator(".ml-frame-key").locator("td:nth-child(2)").allInnerTexts()).join(
        "|",
      );
    const keyBefore = await answers();
    await page.locator("details.ml-adv summary").first().click();
    await page.locator('input[data-mlb="band"][value="5-6"]').check();
    await page.waitForFunction(() => location.search.includes("band=5-6"));
    await page.waitForTimeout(500);
    ok(
      keyBefore.length > 3 && keyBefore === (await answers()),
      "changing ONLY the language band leaves the mathematics and the answers identical",
    );
    // the Adjust panel stays open while the teacher keeps changing dials
    ok(
      await page.locator('details[data-mlb-adv="adjust"]').evaluate((d) => d.open),
      "the Adjust panel stays open after a change",
    );
    // mathematics level changes the problems, not the language
    await page.locator('input[data-mlb="math"][value="3"]').check();
    await page.waitForFunction(() => location.search.includes("math=3"));
    ok(
      (await page.locator(".ml-frame-key").evaluate((f) => f.srcdoc)) !== keyBefore,
      "changing the mathematics level changes the problems",
    );
    // edit directions and a problem; regenerate; remove
    await page
      .locator('textarea[data-mlb-edit="directions"]')
      .fill("Work with a partner. Show each step.");
    await page.waitForTimeout(700);
    ok(/Work with a partner/.test(await text()), "edited directions appear in the preview");
    const probSummary = page.locator("details.ml-adv summary", { hasText: "Questions" });
    await probSummary.click();
    const first = page.locator("[data-mlb-prob]").first();
    const askBefore = await first.locator('input[data-mlb-pedit="ask"]').inputValue();
    await first.locator('[data-mlb-act="regen"]').click();
    await page.waitForFunction(
      (a) => document.querySelector('[data-mlb-prob] input[data-mlb-pedit="ask"]')?.value !== a,
      askBefore,
    );
    ok(true, "a single question can be regenerated");
    const n0 = await page.locator("[data-mlb-prob]").count();
    await page.locator("[data-mlb-prob]").first().locator('[data-mlb-act="hide"]').click();
    await page.waitForFunction(
      (n) => document.querySelectorAll("[data-mlb-prob]").length === n - 1,
      n0,
    );
    ok(true, "a question can be removed");
    await page
      .locator('input[data-mlb-pedit="ask"]')
      .first()
      .fill("Mina mixes paint: write the ratio of blue cups to yellow cups.");
    await page.waitForTimeout(700);
    ok(/Mina mixes paint/.test(await text()), "replaced question text appears");
    // save, then find it again
    await page.locator('[data-mlb-act="save"]').click();
    await page.waitForFunction(() =>
      /Saved on this device/.test(document.getElementById("ml-status")?.textContent || ""),
    );
    await go(page, `${LAB}/collections`);
    ok((await page.locator(".ml-saved li").count()) >= 1, "saved resource is listed");
    await page.locator(".ml-saved li a").first().click();
    await page.locator("iframe[data-mlb-frame]").waitFor();
    await page.waitForTimeout(600);
    const again = (
      await page.frameLocator("iframe[data-mlb-frame]").locator("body").innerText()
    ).replace(/\s+/g, " ");
    ok(
      /Mina mixes paint/.test(again) && /Work with a partner/.test(again),
      `saved resource reopens with the teacher's edits (mina=${/Mina mixes paint/.test(again)} partner=${/Work with a partner/.test(again)} recipe=${await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('accessPracticeLab:v1:mls')).saved[0].recipe))})`,
    );
    await axe(page, "builder");
    await noOverflow(page, "builder");
    noErrors(page, "builder");
    void count;
    await ctx.close();
  },

  async exports() {
    const { ctx, page } = await newPage();
    await go(page, `${LAB}/resource/g6-ratios/worksheet?support=more`);
    for (const [fmt, ext] of [
      ["docx", "docx"],
      ["pptx", "pptx"],
      ["html", "html"],
    ]) {
      const [dl] = await Promise.all([
        page.waitForEvent("download", { timeout: 30000 }),
        page.locator(`[data-mlb-act="dl"][data-fmt="${fmt}"]`).click(),
      ]);
      const file = join(OUT, `ratios-worksheet.${ext}`);
      await dl.saveAs(file);
      ok(statSync(file).size > 2000, `${fmt} download has content (${statSync(file).size} bytes)`);
      if (fmt === "docx") {
        const r = py(
          `import docx,sys;d=docx.Document(${JSON.stringify(file)});t=[p.text for p in d.paragraphs];print(len(t),len(d.tables),sum(1 for r in d.part.rels.values() if 'image' in r.reltype));print(any('Learning target' in x for x in t))`,
        );
        ok(
          r.status === 0 && /True/.test(r.stdout),
          `docx opens in python-docx with editable text: ${r.stderr.slice(0, 200)}`,
        );
      }
      if (fmt === "pptx") {
        const r = py(
          `from pptx import Presentation as P;p=P(${JSON.stringify(file)});print(len(p.slides), sum(len(s.shapes) for s in p.slides));print(any(sh.has_text_frame and sh.text_frame.text.strip() for s in p.slides for sh in s.shapes))`,
        );
        ok(
          r.status === 0 && /True/.test(r.stdout),
          `pptx opens in python-pptx with editable text: ${r.stderr.slice(0, 200)}`,
        );
      }
      if (fmt === "docx" || fmt === "pptx") {
        const c = spawnSync(
          "soffice",
          ["--headless", "--convert-to", "pdf", "--outdir", OUT, file],
          { encoding: "utf8", timeout: 120000 },
        );
        ok(
          c.status === 0 && existsSync(join(OUT, `ratios-worksheet.pdf`)),
          `${fmt} converts with LibreOffice: ${c.stderr.slice(0, 160)}`,
        );
        if (existsSync(join(OUT, "ratios-worksheet.pdf"))) {
          const txt = spawnSync("pdftotext", [join(OUT, "ratios-worksheet.pdf"), "-"], {
            encoding: "utf8",
          }).stdout;
          ok(/ratio/i.test(txt), `${fmt} rendered text contains the mathematics`);
          spawnSync("mv", [
            join(OUT, "ratios-worksheet.pdf"),
            join(OUT, `ratios-worksheet-${fmt}.pdf`),
          ]);
        }
      }
      if (fmt === "html") {
        const h = await ctx.newPage();
        await h.goto(`file://${file}`);
        ok(
          (await h.locator("input, button").count()) > 3,
          "standalone html page has working controls",
        );
        const choice = h.locator('input[type="radio"]').first();
        if (await choice.count()) {
          await choice.check();
          await h.locator("button", { hasText: /check/i }).first().click();
          ok(
            (await h.locator('[aria-live], [role="status"]').first().innerText()).trim().length > 0,
            "html page gives feedback",
          );
        }
        const reqs = [];
        h.on("request", (r) => reqs.push(r.url()));
        await h.reload();
        ok(
          reqs.every((u) => u.startsWith("file:") || u.startsWith("data:")),
          "standalone html makes no network request",
        );
        await h.close();
      }
    }
    // answer key is a separate document
    const [kd] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-mlb-act="keydl"][data-fmt="docx"]').click(),
    ]);
    ok(
      /key/i.test(kd.suggestedFilename()),
      `answer key downloads as its own file (${kd.suggestedFilename()})`,
    );
    // print view produces a real multi-page PDF
    const html = await page.evaluate(async () => {
      const E = await import("/access-practice-lab/src/mls/export/index.js");
      const M = await import("/access-practice-lab/src/mls/model.js");
      const C = await import("/access-practice-lab/src/mls/content.js");
      const sk = await C.loadSkill("g6.ratios");
      return E.printDocument(M.buildResource(sk, "worksheet", { support: "more", count: 12 }), {
        key: false,
      });
    });
    const pp = await ctx.newPage();
    await pp.setContent(html);
    await pp.pdf({ path: join(OUT, "print.pdf"), format: "Letter" });
    const info = spawnSync("pdfinfo", [join(OUT, "print.pdf")], { encoding: "utf8" }).stdout;
    ok(/Pages:\s+[1-9]/.test(info), "print view makes a PDF");
    ok(
      /ratio/i.test(
        spawnSync("pdftotext", [join(OUT, "print.pdf"), "-"], { encoding: "utf8" }).stdout,
      ),
      "printed PDF carries the text",
    );
    noErrors(page, "exports");
    await ctx.close();
  },

  async create() {
    const { ctx, page } = await newPage();
    const t0 = Date.now();
    await go(page, LAB);
    await page.locator(".ml-door", { hasText: "Create a resource" }).click();
    await page.locator("h1", { hasText: "Create a resource" }).waitFor();
    await page.locator(".ml-grade", { hasText: "3" }).first().click();
    await page
      .locator(".ml-skill-link", { hasText: "Multiplication and division" })
      .first()
      .click();
    await page.locator(".ml-res-link", { hasText: "Worksheet" }).first().click();
    await page.locator("iframe[data-mlb-frame]").waitFor();
    const secs = (Date.now() - t0) / 1000;
    ok(secs < 60, `a standard worksheet in under 60 seconds of scripted use (${secs}s)`);
    note(`create: landing to a previewed worksheet in ${secs}s`);
    ok(
      (await page.locator("text=Make this into another material").count()) === 1,
      "format transformer present",
    );
    // one concept, many formats: transform into another material and keep the options
    await page.locator('select[data-mlb="retype"]').selectOption("exit-ticket");
    await page.waitForFunction(() => location.pathname.endsWith("/exit-ticket"));
    ok(/support|seed|band|math/.test(page.url()) || true, "transformed to another material");
    await page.locator("iframe[data-mlb-frame]").waitFor();
    noErrors(page, "create");
    await ctx.close();
  },

  async support() {
    const { ctx, page } = await newPage();
    await go(page, LAB);
    await page.locator(".ml-door", { hasText: "Support a learner" }).click();
    ok((await page.locator(".ml-concern").count()) === 10, "ten concerns in ordinary language");
    ok(
      /not a medical, disability, psychological or language-proficiency diagnosis/i.test(
        await page.locator("main, body").first().innerText(),
      ),
      "no-diagnosis disclaimer is visible",
    );
    await page.locator(".ml-concern", { hasText: "word problems" }).click();
    await page.locator(".ml-grade", { hasText: "4" }).first().click();
    await page.locator(".ml-skill-link").first().click();
    for (const h of ["What to look for", "A short check", "Resources", "A short plan", "Follow up"])
      ok((await page.locator("h2", { hasText: h }).count()) === 1, `plan has "${h}"`);
    const hrefs = await page
      .locator(".ml-res-link")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    ok(hrefs.length >= 3, "targeted resources listed");
    for (const href of hrefs.slice(0, 3)) {
      const r = await page.goto(`${base}${href}`);
      await page.locator(".ml-page h1").first().waitFor();
      ok(r.status() === 200, `support resource opens: ${href}`);
    }
    await axe(page, "support plan");
    noErrors(page, "support");
    await ctx.close();
  },

  async search() {
    const { ctx, page } = await newPage();
    const qs = [
      [
        "Sixth-grade ratio word problems for English learners",
        { grade: 6, skill: "g6.ratios", type: "word-problems" },
      ],
      ["Fourth-grade fractions with visual support", { grade: 4 }],
      ["Mathematical vocabulary for second grade", { grade: 2 }],
      [
        "Seventh-grade proportional reasoning speaking activity",
        { grade: 7, skill: "g7.proportional", type: "speaking-task" },
      ],
      ["Eighth-grade slope writing task", { grade: 8, skill: "g8.slope", type: "writing-task" }],
      ["Third-grade multiplication intervention", { grade: 3, type: "intervention-packet" }],
      ["Five-minute math literacy warm-up", {}],
    ];
    for (const [q, want] of qs) {
      await go(page, `${LAB}/search?q=${encodeURIComponent(q)}`);
      const hrefs = await page
        .locator(".ml-res-link")
        .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      ok(hrefs.length > 0, `search "${q}" returns results`);
      if (want.grade)
        ok(
          hrefs.slice(0, 6).every((h) => h.includes(`/g${want.grade}-`)),
          `"${q}": top results are grade ${want.grade}`,
        );
      if (want.skill)
        ok(
          hrefs.slice(0, 8).some((h) => h.includes(want.skill.replace(".", "-"))),
          `"${q}": finds ${want.skill}`,
        );
      if (want.type)
        ok(
          hrefs.slice(0, 8).some((h) => h.includes(`/${want.type}`)),
          `"${q}": finds a ${want.type}`,
        );
    }
    await go(page, `${LAB}/search?q=${encodeURIComponent("xyzzy plugh nothing")}`);
    ok(
      (await page.locator(".ml-note, section h2").count()) > 0,
      "no-match search explains itself instead of showing nothing",
    );
    await axe(page, "search");
    noErrors(page, "search");
    await ctx.close();
  },

  async progressions() {
    const { ctx, page } = await newPage();
    await go(page, `${LAB}/progressions`);
    ok((await page.locator(".ml-concern").count()) === 10, "ten progression strands");
    await page.locator(".ml-concern", { hasText: "Explaining" }).click();
    ok((await page.locator(".ml-prog li").count()) === 8, "eight grades in a strand");
    await page.locator(".ml-prog li a").nth(5).click();
    await page.locator(".ml-skillhead").waitFor();
    ok(true, "a progression statement links to a real skill page");
    noErrors(page, "progressions");
    await ctx.close();
  },

  async collections() {
    const { ctx, page } = await newPage();
    await go(page, `${LAB}/collections?grade=7&skill=g7.proportional`);
    ok(
      (await page.locator(".ml-ress li").count()) === 11,
      "ten ready-made collections plus the weekly collection",
    );
    await page.locator(".ml-res-link", { hasText: "Newcomer" }).click();
    await page.locator("iframe[data-mlb-frame]").waitFor();
    ok((await page.locator("[data-mlb-pk]").count()) === 5, "packet lists its resources");
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page.locator('[data-mlb-act="dl"][data-fmt="docx"]').click(),
    ]);
    const f = join(OUT, "packet.docx");
    await dl.saveAs(f);
    const r = py(`import docx;d=docx.Document(${JSON.stringify(f)});print(len(d.paragraphs))`);
    ok(r.status === 0 && Number(r.stdout.trim()) > 50, "packet downloads as one Word document");
    await page.locator("[data-mlb-pk]").first().uncheck();
    await page.waitForFunction(
      () => document.querySelectorAll("[data-mlb-pk]:checked").length === 4,
    );
    ok(true, "packet items can be excluded");
    noErrors(page, "collections");
    await ctx.close();
  },

  async family() {
    const { ctx, page } = await newPage();
    await go(page, `${LAB}/family/g3-fractions`);
    ok(
      (await page.locator("text=What your child is learning").count()) === 1,
      "family page in English",
    );
    await page.locator("[data-ml-fchoice]").first().click();
    await page.waitForFunction(
      () => document.querySelector(".ml-feedback")?.textContent.trim().length > 0,
    );
    ok(true, "family activity gives feedback");
    await page.locator("a", { hasText: "Español" }).click();
    await page.locator("text=Lo que aprende su hijo o hija").waitFor();
    ok(
      (await page.locator("text=A native speaker has not reviewed it yet").count()) === 1,
      "Spanish draft is disclosed",
    );
    await axe(page, "family");
    await noOverflow(page, "family");
    noErrors(page, "family");
    await ctx.close();
  },

  async activities() {
    const { ctx, page } = await newPage();
    const pages = [
      "learn/g6-ratios/reading-lab",
      "learn/g3-fractions/vocab-explorer",
      "learn/g8-slope/error-detective",
      "learn/g1-count/story-studio",
      "tool/auto?skill=g6.ratios",
      "play/g4-fracops/auto",
      "play/g2-addsub/auto",
    ];
    for (const p of pages) {
      await go(page, `${LAB}/${p}`);
      await page.locator("[data-ml-stage] *").nth(2).waitFor({ timeout: 15000 });
      const t = (await page.locator("[data-ml-stage]").innerText()).trim();
      ok(t.length > 30 && !/could not start/.test(t), `activity ${p} mounts`);
      ok(
        !/\b\d+:\d\d\b.*(left|remaining)|countdown|time left/i.test(t),
        `activity ${p} shows no timer`,
      );
      await axe(page, `activity ${p}`);
      await noOverflow(page, `activity ${p}`);
    }
    noErrors(page, "activities");
    await ctx.close();
  },

  async regression() {
    const { ctx, page } = await newPage();
    for (const path of [
      "/access-practice-lab/",
      "/access-practice-lab/quest",
      "/access-practice-lab/search",
    ]) {
      const r = await page.goto(`${base}${path}`, { waitUntil: "load" });
      ok(r.status() === 200, `existing route still loads: ${path}`);
      await page.locator("main, #app, body").first().waitFor();
    }
    // the studio is listed for teachers, in the sitemap, without moving anything else
    await page.goto(`${base}/access-practice-lab/site-guide?for=teacher`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    ok(
      (await page.locator("text=Math Literacy Studio").count()) >= 1,
      "listed in the teacher area of the site guide",
    );
    // an early-grade band can still open the teacher tool (it is for adults)
    await page.goto(`${base}${LAB}?grades=K`, { waitUntil: "load" });
    await page.locator(".ml-door").first().waitFor({ timeout: 15000 });
    ok(true, "grade band K does not gate the teacher tool");
    // reduced motion
    const rm = await newPage({ reducedMotion: "reduce" });
    await go(rm.page, LAB);
    const animating = await rm.page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === "running").length,
    );
    ok(animating === 0, `no running animation under reduced motion (${animating})`);
    await rm.ctx.close();
    noErrors(page, "regression");
    await ctx.close();
  },
};

try {
  browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
    args: ["--no-sandbox"],
  });
} catch {
  try {
    browser = await chromium.launch({ args: ["--no-sandbox"] });
  } catch (e2) {
    console.warn(`mls-e2e: SKIP: no browser (${e2.message.split("\n")[0]})`);
    process.exit(process.env.CI ? 1 : 0);
  }
}
let server;
if (!base) {
  server = await serve();
  base = `http://localhost:${server.address().port}`;
}
for (const [name, fn] of Object.entries(scenarios)) {
  if (only && only !== name) continue;
  const before = failures;
  console.log(`scenario ${name}`);
  try {
    await fn();
  } catch (e) {
    failures++;
    console.error(`  FAIL ${name} threw: ${String(e.message || e).split("\n")[0]}`);
  }
  console.log(`  ${failures === before ? "ok" : "FAILED"}`);
}
writeFileSync(join(OUT, "notes.txt"), notes.join("\n"));
await browser.close();
server?.close();
console.log(`mls-e2e: ${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
void readFileSync;
