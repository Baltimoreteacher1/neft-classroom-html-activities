// G-10 route-crawl (probes by DOM text, not HTTP 200) and G-12 a11y-smoke, in a real Chromium.
// A missing browser is SKIP (exit 3), never a pass. Screenshots go OUTSIDE the repo.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vocabOf } from "./dataset.mjs";
import { startServer } from "./server.mjs";

const SHOTS =
  process.env.LP_SHOTS ||
  path.join(os.homedir(), "Documents/EduWonderLab/reports-2026-11-25/screens");
const axeSource = () =>
  fs.readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");

// One unit per subject per grade band (K-2, 3-5, 6-8).
export const PROBE_UNITS = [
  "gk-ela-u1",
  "g2-math-u2",
  "g2-sci-u2",
  "g1-ss-u1",
  "g4-ela-u2",
  "g4-math-u1",
  "g4-sci-u1",
  "g4-ss-u1",
  "g6-math-u1",
  "g7-ela-u1",
  "g8-math-u6",
  "g8-sci-u1",
];
const idToParams = (id) => {
  const [g, s, u] = id.split("-");
  return {
    grade: g.slice(1).toUpperCase(),
    subject: { ela: "ELA", math: "Math", sci: "Science", ss: "Social Studies" }[s],
    unit: id,
    n: u,
  };
};

async function launch() {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (err) {
    return { skip: String(err?.message || err).split("\n")[0] };
  }
}

async function withPages(fn) {
  const browser = await launch();
  if (browser.skip) return { skip: browser.skip };
  const { server, base } = await startServer();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    return await fn({ ctx, base });
  } finally {
    await browser.close();
    server.close();
  }
}

const shot = async (page, name) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
};

/** What a teacher sees on the Vocabulary tab, checked by DOM text against the authored data. */
export async function checkVocabPage(page, id, detail) {
  const errors = [];
  const vocab = vocabOf(detail);
  const first = await page
    .$eval("#panel-vocab .vs-card .vs-word-title", (e) => e.textContent)
    .catch(() => "");
  if (first !== vocab[0].term)
    errors.push(`${id}: first card "${first}" != unit's first term "${vocab[0].term}"`);
  const text = await page.$eval("#panel-vocab", (e) => e.innerText).catch(() => "");
  if (!text.includes(vocab[0].example))
    errors.push(`${id}: authored example not visible on the first card`);
  if (/\(\d+ letters\)|names a precise relationship/.test(text))
    errors.push(`${id}: boilerplate visible on the Vocabulary tab`);
  return errors;
}

async function axeSerious(page) {
  await page.addScriptTag({ content: axeSource() });
  const res = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    }),
  );
  return res.violations.filter((x) => ["serious", "critical"].includes(x.impact));
}

export const g10 = {
  id: "G-10",
  name: "route-crawl (real browser)",
  async run({ data }) {
    const out = await withPages(async ({ ctx, base }) => {
      const errors = [];
      const info = { units: 0 };
      for (const id of PROBE_UNITS) {
        const detail = data.units.find((d) => d.unit.id === id);
        if (!detail) {
          errors.push(`${id}: not in dataset`);
          continue;
        }
        const p = idToParams(id);
        const page = await ctx.newPage();
        const consoleErrors = [];
        // "web-vitals" is a bare specifier Vite resolves at build time; the source-tree server cannot. Not a defect.
        const real = (t) => !/web-vitals/.test(t);
        page.on("pageerror", (e) => real(String(e)) && consoleErrors.push(String(e)));
        page.on(
          "console",
          (m) => m.type() === "error" && real(m.text()) && consoleErrors.push(m.text()),
        );
        await page.goto(
          `${base}/bcpss-teachers/?grade=${p.grade}&subject=${encodeURIComponent(p.subject)}&unit=${id}&tab=vocab`,
          { waitUntil: "load" },
        );
        try {
          await page.waitForSelector("#panel-vocab .vs-card", { timeout: 8000 });
        } catch {
          errors.push(`${id}: Vocabulary tab rendered no cards`);
        }
        errors.push(...(await checkVocabPage(page, id, detail)));
        const overview = await page.evaluate(
          () => document.querySelector("#panel-overview [data-provenance]")?.textContent || "",
        );
        await page.click('[data-tab="overview"]').catch(() => {});
        const badge = await page
          .$eval("#panel-overview [data-provenance]", (e) => e.textContent)
          .catch(() => "");
        if (!badge && detail.provenance.state !== "reviewed")
          errors.push(`${id}: no draft badge visible on the unit page`);
        void overview;
        if (consoleErrors.length)
          errors.push(`${id}: console errors: ${consoleErrors.slice(0, 2).join(" | ")}`);
        await page.click('[data-tab="vocab"]').catch(() => {});
        if (["g6-math-u1", "gk-ela-u1", "g2-sci-u2", "g4-ss-u1", "g8-math-u6"].includes(id))
          await shot(page, `vocab-${id}`);
        info.units += 1;
        await page.close();
      }

      // Insights: seed LOCAL memory telemetry, then the dashboard must show the numbers the API returns.
      for (const [unit_id, wida_tier, event_type] of [
        ["g6-math-u2", "3_4", "vocab_lookup"],
        ["g6-math-u2", "3_4", "scaffold_toggle"],
        ["g2-sci-u2", "1_2", "lab_launch"],
      ])
        await fetch(`${base}/api/bcpss/telemetry`, {
          method: "POST",
          headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.50" },
          body: JSON.stringify({ unit_id, wida_tier, event_type }),
        });
      const api = await (await fetch(`${base}/api/bcpss/insights`)).json();
      const ip = await ctx.newPage();
      await ip.goto(`${base}/bcpss-teachers/insights/`, { waitUntil: "load" });
      const kpi = await ip.$$eval(".in-kpi", (els) =>
        els.map((e) => e.innerText.replace(/\s+/g, " ")),
      );
      const bodyText = await ip.innerText("body");
      if (!kpi.some((k) => k.includes(api.top_klu_demand[0].wida_klu)))
        errors.push(
          `insights: KLU KPI does not show "${api.top_klu_demand[0].wida_klu}" (got ${kpi.join(" | ")})`,
        );
      if (/No interactions recorded/.test(bodyText))
        errors.push("insights: a panel still says no interactions recorded");
      if (!/Beta/.test(bodyText)) errors.push("insights: page is not labelled Beta usage");
      await shot(ip, "insights");

      // Pathways: Year map must separate cognates from translations.
      const pw = await ctx.newPage();
      await pw.goto(`${base}/bcpss-teachers/pathways/?grade=6`, { waitUntil: "load" });
      const stats = await pw.innerText("body");
      if (!/have a Spanish cognate/.test(stats) || !/translation only/.test(stats))
        errors.push("pathways: cognate headline does not separate translations");
      await shot(pw, "pathways-g6");

      // Family page: a real unit title must render (DOM text, not HTTP 200).
      const fam = await ctx.newPage();
      await fam.goto(`${base}/family/bcpss/g6-math-u2`, { waitUntil: "load" });
      const famText = await fam.innerText("body");
      if (!/ratio|Ratio/.test(famText))
        errors.push("family/bcpss/g6-math-u2: unit content not rendered");
      info.family = true;
      return { errors, info };
    });
    if (out.skip) return { skip: out.skip };
    return out;
  },
  async controls({ data }) {
    const detail = data.units.find((d) => d.unit.id === "g6-math-u1");
    const out = await withPages(async ({ ctx }) => {
      const page = await ctx.newPage();
      await page.setContent(
        '<div id="panel-vocab"><article class="vs-card"><h4 class="vs-word-title">ratio</h4><p>Using "ratio": I decomposed the [polygon / net] because [reason]. Root word: ratio (5 letters)</p></article></div>',
      );
      return { errors: await checkVocabPage(page, "fixture", detail) };
    });
    return [
      {
        name: "wrong first card + template + letter count in the browser DOM",
        errors: out.skip ? [`SKIP: ${out.skip}`] : out.errors,
      },
    ];
  },
};

export const g12 = {
  id: "G-12",
  name: "a11y-smoke (axe)",
  async run() {
    const out = await withPages(async ({ ctx, base }) => {
      const errors = [];
      const routes = [
        `/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1&tab=vocab`,
        `/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1&tab=overview`,
        `/bcpss-teachers/pathways/?grade=6`,
        `/bcpss-teachers/insights/`,
      ];
      for (const r of routes) {
        for (const width of [320, 1024]) {
          const page = await ctx.newPage();
          await page.setViewportSize({ width, height: 900 });
          await page.goto(base + r, { waitUntil: "load" });
          await page.waitForTimeout(1200);
          for (const v of await axeSerious(page))
            errors.push(
              `${r} @${width}: ${v.id} (${v.impact}) ${v.nodes
                .slice(0, 2)
                .map((n) => n.target.join(" "))
                .join("; ")}`,
            );
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          if (overflow > 1) errors.push(`${r} @${width}: horizontal overflow ${overflow}px`);
          await page.close();
        }
      }
      return { errors, info: { routes: routes.length, widths: 2 } };
    });
    if (out.skip) return { skip: out.skip };
    return out;
  },
  async controls() {
    const out = await withPages(async ({ ctx }) => {
      const page = await ctx.newPage();
      await page.setContent(
        '<!doctype html><html lang="en"><title>t</title><body><main><button></button><p style="color:#bbb;background:#fff">low contrast</p><img src="x.png"></main></body></html>',
      );
      return { errors: (await axeSerious(page)).map((v) => v.id) };
    });
    return [
      {
        name: "known-bad fixture (unnamed button, low contrast, image without alt)",
        errors: out.skip ? [`SKIP: ${out.skip}`] : out.errors,
      },
    ];
  },
};
