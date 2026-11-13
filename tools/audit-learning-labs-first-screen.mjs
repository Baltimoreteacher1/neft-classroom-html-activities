// First-screen audit for the 46 Learning Labs (report only; not a gate).
// For every lab, in a fresh browser context, opens Mission and Investigate at a Chromebook and a phone viewport and measures
// whether the mathematical workspace and its first control are on the first screen, how much reading sits above them,
// console errors, horizontal overflow and touch-target size.
// Usage: node tools/audit-learning-labs-first-screen.mjs <label> [--lab=id,id]  → docs/learning-labs-studio/first-screen-<label>.{json,md}
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const label = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "run";
const only = process.argv
  .find((a) => a.startsWith("--lab="))
  ?.slice(6)
  .split(",");
const labs = JSON.parse(readFileSync(join(REPO_ROOT, "data/learning-labs.json"))).labs.filter(
  (l) => !only || only.includes(l.id),
);
const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile())
    return void res.writeHead(404).end("Not found");
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const sizes = { chromebook: [1366, 768], phone: [390, 844] };

// Runs in the page: where is the model, how much text precedes it, what is the first thing a student can touch.
const measure = () => {
  const vh = innerHeight;
  const panel =
    document.querySelector('[role="tabpanel"]:not([hidden])') ||
    document.getElementById("lab-root");
  const model = panel.querySelector(".model-workspace");
  const words = (el) => (el.innerText || "").trim().split(/\s+/).filter(Boolean).length;
  let wordsAbove = 0;
  if (model) {
    const top = model.getBoundingClientRect().top + scrollY;
    for (const el of panel.querySelectorAll("p, li, h2, h3, label, button, summary")) {
      if (model.contains(el)) continue;
      const r = el.getBoundingClientRect();
      if (
        r.height &&
        r.top + scrollY < top &&
        !el.closest("[hidden], details:not([open]) > :not(summary)")
      )
        wordsAbove += words(el);
    }
  }
  const control = panel.querySelector(
    '.model-controls input:not([readonly]), .model-picture [tabindex="0"], .model-picture button',
  );
  const rect = (el) => (el ? el.getBoundingClientRect() : null);
  const mr = rect(model);
  const cr = rect(control);
  // Targets the lab draws itself (the curriculum shell's own EN/ES and hub pills are reported separately); a checkbox counts
  // through its label.
  const small = (el) => {
    const box =
      el.closest("label") && el.matches("input[type=checkbox],input[type=radio]")
        ? el.closest("label")
        : el;
    const r = box.getBoundingClientRect();
    return r.width < 44 || r.height < 44;
  };
  const targets = [
    ...document.querySelectorAll(
      "#lab-root button, #lab-root input, #lab-root select, #lab-root a[href], #lab-root summary",
    ),
  ].filter(
    (el) =>
      el.offsetParent && el.getBoundingClientRect().height && !el.matches("input[type=hidden]"),
  );
  const touch = targets.filter(small).length;
  return {
    hasModel: !!model,
    modelTop: mr ? Math.round(mr.top + scrollY) : null,
    modelVisiblePct: mr
      ? Math.round(
          (Math.max(0, Math.min(vh, mr.bottom) - Math.max(0, mr.top)) / Math.max(1, mr.height)) *
            100,
        )
      : 0,
    controlOnFirstScreen: !!cr && cr.top >= 0 && cr.bottom <= vh,
    wordsAboveModel: wordsAbove,
    smallTargets: touch,
    hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  };
};

const browser = await chromium.launch();
const rows = [];
for (const lab of labs) {
  for (const [size, [w, h]] of Object.entries(sizes)) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      hasTouch: size === "phone",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
    await page.goto(origin + lab.href, { waitUntil: "load" });
    await page
      .waitForSelector("#lab-root [role=tab], #lab-root .tab, #tab-investigate", { timeout: 15000 })
      .catch(() => {});
    const row = { id: lab.id, unit: lab.unit, size };
    for (const tab of ["brief", "investigate"]) {
      await page
        .locator(`#tab-${tab}`)
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(250);
      await page.evaluate(() => scrollTo(0, 0));
      row[tab] = await page.evaluate(measure);
    }
    row.errors = errors;
    rows.push(row);
    await ctx.close();
  }
}
await browser.close();
server.close();

const outDir = join(REPO_ROOT, "docs/learning-labs-studio");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `first-screen-${label}.json`), JSON.stringify(rows, null, 1));
const pct = (n, d) => `${Math.round((100 * n) / d)}%`;
const lines = [
  `# First-screen audit: ${label}`,
  "",
  `${labs.length} labs, Investigate tab. "On first screen" = the first model control is fully inside the viewport with no scrolling.`,
  "",
];
for (const size of Object.keys(sizes)) {
  const r = rows.filter((x) => x.size === size);
  const inv = r.map((x) => x.investigate);
  const sorted = [...inv.map((i) => i.wordsAboveModel)].sort((a, b) => a - b);
  lines.push(
    `## ${size} (${sizes[size].join("×")})`,
    `- Model present: ${inv.filter((i) => i.hasModel).length}/${r.length}`,
    `- First control on first screen: ${inv.filter((i) => i.controlOnFirstScreen).length}/${r.length} (${pct(inv.filter((i) => i.controlOnFirstScreen).length, r.length)})`,
    `- Median words above the model: ${sorted[Math.floor(sorted.length / 2)]}; max ${sorted.at(-1)}`,
    `- Median model top (px): ${[...inv.map((i) => i.modelTop ?? 0)].sort((a, b) => a - b)[Math.floor(inv.length / 2)]}`,
    `- Labs with targets under 44px: ${inv.filter((i) => i.smallTargets).length}; horizontal overflow: ${inv.filter((i) => i.hOverflow).length}`,
    `- Console errors: ${r.reduce((n, x) => n + x.errors.length, 0)}`,
    "",
  );
}
writeFileSync(join(outDir, `first-screen-${label}.md`), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
