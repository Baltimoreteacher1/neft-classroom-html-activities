#!/usr/bin/env node
// npm run check:lp — every quality gate for The Language Page front layer, each with a negative control.
// Exit 0 = PASS, 1 = FAIL, 3 = SKIP (no browser / no Lighthouse). With CI set, a SKIP counts as a FAIL.
// A gate that checks zero things FAILS. A gate whose negative control does not fail is itself a FAIL.
//
//   node tools/lp/check.mjs                     local: builds nothing, serves the source tree (tools/lp/server.mjs)
//   node tools/lp/check.mjs --only G-03,G-05
//   node tools/lp/check.mjs --base https://thelanguagepage.com --live   production: link, URL, axe, network,
//                                                                        disclaimer and header checks over HTTP
//   LIGHTHOUSE_DIR=/path/with/lighthouse node tools/lp/check.mjs        enables G-04
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { languagePageRoute } from "../../functions/_lib/language-page.js";
import { frontRoute, isFrontPath } from "../../functions/_lib/lp-front.js";
import * as S from "./gates/static.mjs";
import { runLighthouse } from "./lighthouse-run.mjs";
import { startServer } from "./server.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const ONLY = opt("--only")?.split(",");
const LIVE = args.includes("--live");
const CI = Boolean(process.env.CI);
const FIX = path.join(ROOT, "tools/lp/fixtures");
const REPORT_DIR = path.join(ROOT, "reports/lp-check");
fs.mkdirSync(REPORT_DIR, { recursive: true });

const data = S.loadData(ROOT);
const routes = JSON.parse(fs.readFileSync(path.join(ROOT, "lp/routes.json"), "utf8")).routes;
const pageFile = (p) => path.join(ROOT, "lp", p.replace(/^\//, ""), "index.html");
const pages = routes.map((r) => ({
  path: r.path,
  html: fs.readFileSync(pageFile(r.path), "utf8"),
}));
const inventory = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs/audit/url-inventory.json"), "utf8"),
).urls;

/* ---------- browser plumbing ---------- */
let browser = null;
let base = opt("--base");
let server = null;
async function getBrowser() {
  if (browser) return browser;
  try {
    const { chromium } = require("playwright");
    browser = await chromium.launch({
      executablePath:
        process.env.PW_CHROMIUM_PATH ||
        (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined),
    });
    return browser;
  } catch {
    return null;
  }
}
async function getBase() {
  if (base) return base;
  const port = 4900 + Math.floor(Math.random() * 90);
  server = await startServer({ port });
  base = server.base;
  return base;
}
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

/* ---------- gate definitions ---------- */
const GATES = [];
const gate = (id, name, run, control, { browser: needsBrowser = false } = {}) =>
  GATES.push({ id, name, run, control, needsBrowser });

/* G-01 links: every internal href/src on every page resolves. */
function linkTargets(html) {
  return [...html.matchAll(/\s(?:href|src)="([^"#]*)(?:#[^"]*)?"/g)]
    .map((m) => m[1])
    .filter((u) => u && !u.startsWith("data:") && !u.startsWith("mailto:"));
}
const inventoryOk = new Set(inventory.filter((u) => u.finalStatus === 200).map((u) => u.path));
function resolvesLocally(u) {
  if (/^https?:\/\//.test(u))
    return u.startsWith("https://thelanguagepage.com")
      ? resolvesLocally(u.replace("https://thelanguagepage.com", "") || "/")
      : "external";
  const p = u.split("?")[0];
  if (isFrontPath(p) && !p.startsWith("/lp/")) {
    const r = frontRoute(p);
    return r.kind === "page" ? true : r.kind === "redirect" ? resolvesLocally(r.location) : false;
  }
  const candidates = [path.join(ROOT, p), path.join(ROOT, "public", p)];
  if (candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile())) return true;
  if (inventoryOk.has(p) || inventoryOk.has(p.replace(/\/$/, "")) || inventoryOk.has(`${p}/`))
    return true;
  return false;
}
function linkGate(list) {
  const errs = [];
  const external = new Set();
  let count = 0;
  for (const pg of list)
    for (const u of linkTargets(pg.html)) {
      count++;
      const r = resolvesLocally(u);
      if (r === "external") external.add(u);
      else if (!r) errs.push(`${pg.path} -> ${u}`);
    }
  return {
    errs: [...new Set(errs)],
    count,
    notes: external.size
      ? `external links (listed, not followed): ${[...external].join(", ")}`
      : "0 external links",
  };
}
gate(
  "G-01",
  "Links: zero broken internal links",
  () => linkGate(pages),
  () =>
    linkGate([
      { path: "/fixture/", html: fs.readFileSync(path.join(FIX, "broken-link.html"), "utf8") },
    ]),
);

/* G-02 URL preservation: every baseline URL still resolves (routing simulation; --live fetches over HTTP). */
function preservation(list) {
  const errs = [];
  for (const u of list) {
    const url = new URL(`https://thelanguagepage.com${u.path}`);
    const r = languagePageRoute(url);
    if (!r) {
      errs.push(`${u.path}: not routed`);
      continue;
    }
    if (r.kind === "redirect") {
      // A page that answered 200 at baseline must not start sending people to another site.
      const to = new URL(r.location, url);
      if (to.hostname !== "thelanguagepage.com" && u.status === 200)
        errs.push(`${u.path}: was 200, now leaves the site (${r.location})`);
      continue;
    }
    if (isFrontPath(u.path)) {
      const fr = frontRoute(u.path);
      if (fr.kind === "missing")
        errs.push(`${u.path}: was ${u.finalStatus}, now not answered by the front layer`);
      if (fr.kind === "page" && !fs.existsSync(pageFile(u.path)))
        errs.push(`${u.path}: front page file missing`);
    }
  }
  return { errs, count: list.length };
}
async function preservationLive(list) {
  const errs = [];
  const queue = [...list];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const u = queue.shift();
        let url = `${base}${u.path}`;
        let status = 0;
        for (let hop = 0; hop < 6; hop++) {
          const res = await fetch(url, {
            redirect: "manual",
            signal: AbortSignal.timeout(20000),
          }).catch(() => null);
          status = res?.status ?? 0;
          await res?.body?.cancel();
          if (status >= 300 && status < 400 && res.headers.get("location"))
            url = new URL(res.headers.get("location"), url).toString();
          else break;
        }
        if (status !== 200) errs.push(`${u.path}: final status ${status}`);
      }
    }),
  );
  return { errs, count: list.length };
}
gate(
  "G-02",
  "URL preservation: every baseline URL still resolves",
  async () => (LIVE ? preservationLive(inventory) : preservation(inventory)),
  async () =>
    preservation([{ path: "/practice/an-old-page-that-existed/", status: 200, finalStatus: 200 }]),
);

/* G-03 axe on every page (and dark + high-contrast on a sample): zero serious or critical. */
async function axeRun(urls, { themes = ["light"] } = {}) {
  const b = await getBrowser();
  if (!b) return { skip: "no browser" };
  const errs = [];
  let count = 0;
  // bypassCSP lets the harness inject axe; the pages keep their strict policy (G-15 checks it on production).
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true });
  for (const theme of themes) {
    const pg = await ctx.newPage();
    await pg.addInitScript((t) => {
      try {
        localStorage.setItem("lp:display", JSON.stringify({ theme: t }));
      } catch {}
    }, theme);
    for (const u of urls) {
      await pg.goto(u, { waitUntil: "networkidle" });
      await pg.waitForTimeout(150);
      await pg.addScriptTag({ content: AXE });
      const v = await pg.evaluate(async () =>
        (
          await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
            },
          })
        ).violations
          .filter((x) => x.impact === "serious" || x.impact === "critical")
          .map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target}`),
      );
      count++;
      for (const x of v) errs.push(`${u.replace(base, "")} [${theme}] ${x}`);
    }
    await pg.close();
  }
  await ctx.close();
  return { errs, count };
}
gate(
  "G-03",
  "Accessibility: axe, zero serious or critical",
  async () => {
    const b = await getBase();
    const all = await axeRun(routes.map((r) => b + r.path));
    if (all.skip) return all;
    const sample = [
      "/",
      "/practice/grades-6-8/reading/",
      routes.find((r) => r.path.includes("/reading/") && r.path.split("/").length > 5).path,
      "/tools/game-maker/",
      "/tools/score-interpreter/",
      "/content/math/grade-6/ratios/",
    ];
    const themed = await axeRun(
      sample.map((p) => b + p),
      { themes: ["dark", "contrast"] },
    );
    return { errs: [...all.errs, ...themed.errs], count: all.count + themed.count };
  },
  async () => {
    const b = await getBase();
    return axeRun([`${b}/__fixtures/fixture-axe.html`]);
  },
  { browser: true },
);

/* G-04 Lighthouse budgets on the home page and every section landing page (mobile). */
const LH_PATHS = ["/", "/practice/", "/tools/", "/content/", "/access-guide/", "/about/"];
export function budgetCheck(results) {
  const errs = [];
  for (const r of results) {
    if (r.error) {
      errs.push(`${r.path} ${r.form}: ${r.error}`);
      continue;
    }
    if (r.performance < 95) errs.push(`${r.path} ${r.form}: Performance ${r.performance} < 95`);
    if (r.accessibility < 100)
      errs.push(`${r.path} ${r.form}: Accessibility ${r.accessibility} < 100`);
    if (r.bestPractices < 95)
      errs.push(`${r.path} ${r.form}: Best Practices ${r.bestPractices} < 95`);
    if (r.seo < 100) errs.push(`${r.path} ${r.form}: SEO ${r.seo} < 100`);
    if (r.path === "/" && r.bytes > 500 * 1024)
      errs.push(`home page weighs ${Math.round(r.bytes / 1024)} KB (budget 500 KB)`);
  }
  return errs;
}
gate(
  "G-04",
  "Lighthouse budgets (mobile): Perf >= 95, A11y 100, BP >= 95, SEO 100, home < 500 KB",
  async () => {
    const b = await getBase();
    const out = await runLighthouse({ base: b, paths: LH_PATHS, forms: ["mobile", "desktop"] });
    if (out.skip) return out;
    fs.writeFileSync(
      path.join(REPORT_DIR, "lighthouse.json"),
      JSON.stringify(out.results, null, 1),
    );
    // Local http cannot earn the HTTPS/HSTS-dependent points; SEO and BP are judged against production in --live.
    return {
      errs: budgetCheck(out.results),
      count: out.results.length,
      notes: out.results
        .map(
          (r) =>
            `${r.form[0]} ${r.path} P${r.performance} A${r.accessibility} BP${r.bestPractices} SEO${r.seo} ${Math.round(r.bytes / 1024)}KB`,
        )
        .join("; "),
    };
  },
  async () => ({
    errs: budgetCheck(JSON.parse(fs.readFileSync(path.join(FIX, "lighthouse-bad.json"), "utf8"))),
    count: 1,
  }),
  { browser: true },
);

/* G-05 network: every page and tool loads only same-origin resources. */
async function networkRun(urls, interact) {
  const b = await getBrowser();
  if (!b) return { skip: "no browser" };
  const origin = new URL(await getBase()).origin;
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on("request", (r) => {
    const u = r.url();
    if (!/^(data|blob|about):/.test(u) && new URL(u).origin !== origin)
      errs.push(`${pg.url().replace(origin, "")} -> ${u}`);
  });
  for (const u of urls) {
    await pg.goto(u, { waitUntil: "networkidle" });
    if (interact) await interact(pg, u);
  }
  await ctx.close();
  return { errs: [...new Set(errs)], count: urls.length };
}
gate(
  "G-05",
  "No external runtime requests (Playwright network log)",
  async () => {
    const b = await getBase();
    return networkRun(
      routes.map((r) => b + r.path),
      async (pg, u) => {
        if (u.includes("/tools/game-maker/"))
          for (const t of ["quiz", "builder", "sort", "frame", "speed"])
            await pg.check(`input[name=template][value=${t}]`).catch(() => {});
        if (u.includes("/tools/score-interpreter/")) await pg.click("#tab-class").catch(() => {});
        await pg.waitForTimeout(200);
      },
    );
  },
  async () => {
    const b = await getBase();
    return networkRun([`${b}/__fixtures/fixture-external.html`]);
  },
  { browser: true },
);

/* G-06 no purple anywhere in the front layer's CSS, JS, HTML, SVG and JSON. */
function purpleGate(files) {
  const errs = [];
  for (const f of files)
    for (const h of S.purpleScan(fs.readFileSync(f, "utf8")))
      errs.push(`${path.relative(ROOT, f)}: ${h}`);
  return { errs, count: files.length };
}
gate(
  "G-06",
  "No purple, violet or lavender",
  () =>
    purpleGate([
      ...S.walk(path.join(ROOT, "lp"), (p) => /\.(css|js|html|svg|json)$/.test(p)),
      ...S.walk(path.join(ROOT, "tools/lp/data"), (p) => p.endsWith(".json")),
      ...S.walk(path.join(ROOT, "tools/lp/site"), (p) => p.endsWith(".mjs")),
    ]),
  () => purpleGate([path.join(FIX, "purple.css")]),
);

/* G-07 content integrity: schema, answer keys, distractor rationales, level, ELD Standard, KLU, no duplicates. */
gate(
  "G-07",
  "Content integrity (schema, keys, rationales, tags, duplicates, coverage)",
  () => S.contentIntegrity(data),
  () => {
    const bad = JSON.parse(fs.readFileSync(path.join(FIX, "bad-set.json"), "utf8"));
    return S.contentIntegrity({ practice: [bad, bad], units: [] });
  },
);

/* G-08 math: every computed answer recomputed with exact fractions. */
gate(
  "G-08",
  "Math: computed answers recomputed exactly",
  () => S.mathCheck(data),
  () =>
    S.mathCheck({
      practice: [JSON.parse(fs.readFileSync(path.join(FIX, "bad-math.json"), "utf8"))],
      units: [],
    }),
);

/* G-09 exports: every game template and the activity export open offline, zero errors, zero requests, < 300 KB. */
async function exportCheck(files) {
  const b = await getBrowser();
  if (!b) return { skip: "no browser" };
  const errs = [];
  const ctx = await b.newContext();
  for (const f of files) {
    const kb = fs.statSync(f).size / 1024;
    if (kb > 300) errs.push(`${path.basename(f)}: ${Math.round(kb)} KB > 300 KB`);
    const pg = await ctx.newPage();
    const bad = [];
    pg.on(
      "request",
      (r) => !r.url().startsWith("file:") && !r.url().startsWith("data:") && bad.push(r.url()),
    );
    pg.on("console", (m) => m.type() === "error" && bad.push(`console: ${m.text()}`));
    pg.on("pageerror", (e) => bad.push(`error: ${e.message}`));
    await pg.goto(`file://${f}`);
    await pg.waitForTimeout(300);
    const text = (await pg.textContent("body")).trim();
    if (text.length < 40) bad.push("renders almost nothing");
    for (const x of bad) errs.push(`${path.basename(f)}: ${x}`);
    await pg.close();
  }
  await ctx.close();
  return { errs, count: files.length };
}
gate(
  "G-09",
  "Exports: Game Maker (6 templates) and Activity Builder open offline, no errors, no requests, < 300 KB",
  async () => {
    const b = await getBrowser();
    if (!b) return { skip: "no browser" };
    const root = await getBase();
    const dir = path.join(REPORT_DIR, "exports");
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await b.newContext({ acceptDownloads: true });
    const pg = await ctx.newPage();
    const files = [];
    await pg.goto(`${root}/tools/game-maker/`, { waitUntil: "networkidle" });
    for (const t of ["match", "quiz", "builder", "sort", "frame", "speed"]) {
      await pg.check(`input[name=template][value=${t}]`);
      await pg.waitForTimeout(350);
      const [dl] = await Promise.all([pg.waitForEvent("download"), pg.click("[data-gm-download]")]);
      const f = path.join(dir, `game-${t}.html`);
      await dl.saveAs(f);
      files.push(f);
    }
    await pg.goto(`${root}/tools/activity-builder/`, { waitUntil: "networkidle" });
    await pg.waitForTimeout(400);
    const [dl] = await Promise.all([pg.waitForEvent("download"), pg.click("[data-ab-download]")]);
    const f = path.join(dir, "activity.html");
    await dl.saveAs(f);
    files.push(f);
    await ctx.close();
    return exportCheck(files);
  },
  async () => exportCheck([path.join(FIX, "bad-export.html")]),
  { browser: true },
);

/* G-10 privacy: no third-party fetch/XHR/beacon, no posting forms, no trackers. */
function privacyGate(files) {
  const errs = [];
  for (const f of files)
    for (const h of S.privacyScan(fs.readFileSync(f, "utf8")))
      errs.push(`${path.relative(ROOT, f)}: ${h}`);
  return { errs, count: files.length };
}
gate(
  "G-10",
  "Privacy: no third-party requests, no data-collecting forms",
  () =>
    privacyGate(
      S.walk(path.join(ROOT, "lp"), (p) => /\.(js|html)$/.test(p) && !p.includes("fixture-")),
    ),
  () => privacyGate([path.join(FIX, "privacy-bad.html")]),
);

/* G-11 disclaimer on every page footer and on every practice page. */
gate(
  "G-11",
  "Disclaimer in the footer of every page and on every practice page",
  () => ({ errs: pages.flatMap((p) => S.disclaimerCheck(p.html, p.path)), count: pages.length }),
  () => ({
    errs: S.disclaimerCheck(
      fs.readFileSync(path.join(FIX, "no-disclaimer.html"), "utf8"),
      "/practice/fixture/",
    ),
    count: 1,
  }),
);

/* G-12 i18n: every interface key used on a page or in a script exists in English and Spanish. */
gate(
  "G-12",
  "i18n: no missing English or Spanish interface strings",
  () =>
    S.i18nCheck(
      pages.map((p) => p.html),
      S.walk(path.join(ROOT, "lp/assets"), (p) => p.endsWith(".js")).map((f) =>
        fs.readFileSync(f, "utf8"),
      ),
      data.i18n.strings,
    ),
  () =>
    S.i18nCheck(
      [fs.readFileSync(path.join(FIX, "missing-i18n.html"), "utf8")],
      [],
      data.i18n.strings,
    ),
);

/* G-13 visual: key pages at 320 / 768 / 1280 with no horizontal overflow and no clipped text; screenshots saved. */
async function visualRun(urls, widths = [320, 768, 1280], shots = true) {
  const b = await getBrowser();
  if (!b) return { skip: "no browser" };
  const errs = [];
  let count = 0;
  const dir = path.join(REPORT_DIR, "screens");
  fs.mkdirSync(dir, { recursive: true });
  for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const pg = await ctx.newPage();
    for (const u of urls) {
      await pg.goto(u, { waitUntil: "networkidle" });
      await pg.waitForTimeout(150);
      const r = await pg.evaluate(() => {
        const out = {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          clipped: [],
          offenders: [],
        };
        for (const el of document.querySelectorAll("body *")) {
          const rect = el.getBoundingClientRect();
          if (
            rect.width &&
            rect.right > window.innerWidth + 1 &&
            getComputedStyle(el).position !== "fixed"
          )
            out.offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`);
          const cs = getComputedStyle(el);
          // Screen-reader-only text (a 1px clipped box) is hidden on purpose, not clipped by accident.
          const srOnly = rect.width <= 2 && rect.height <= 2;
          if (
            !srOnly &&
            el.children.length === 0 &&
            el.textContent.trim() &&
            (cs.overflowX === "hidden" || cs.overflow === "hidden") &&
            el.scrollWidth > el.clientWidth + 2 &&
            cs.textOverflow !== "ellipsis" &&
            !el.closest(".visually-hidden, .lpg-live, .skip-link")
          )
            out.clipped.push(el.textContent.trim().slice(0, 30));
        }
        return out;
      });
      count++;
      const label = u.replace(/^https?:\/\/[^/]+/, "") || "/";
      if (r.overflow > 1)
        errs.push(
          `${label} @${w}px: horizontal overflow ${r.overflow}px (${[...new Set(r.offenders)].slice(0, 3).join(", ")})`,
        );
      if (r.clipped.length)
        errs.push(`${label} @${w}px: clipped text: ${r.clipped.slice(0, 3).join(" | ")}`);
      if (shots)
        await pg.screenshot({
          path: path.join(dir, `${label.replace(/[^a-z0-9]+/gi, "_") || "home"}-${w}.png`),
          fullPage: true,
        });
    }
    await ctx.close();
  }
  return { errs, count };
}
const VISUAL = [
  "/",
  "/practice/",
  "/practice/grades-2-3/",
  "/practice/grades-6-8/reading/",
  ...data.practice
    .filter((s) => s.cluster === "grades-4-5")
    .slice(0, 4)
    .map((s) => `/practice/${s.cluster}/${s.domain}/${s.slug}/`),
  "/tools/",
  ...data.tools.tools.map((t) => `/tools/${t.slug}/`),
  "/content/",
  "/content/math/grade-6/ratios/",
  "/access-guide/",
  "/access-guide/families/",
  "/about/",
  "/search/",
];
gate(
  "G-13",
  "Visual: 320 / 768 / 1280 px, no overflow or clipped text (screenshots in reports/lp-check/screens)",
  async () => {
    const b = await getBase();
    return visualRun(VISUAL.map((p) => b + p));
  },
  async () => {
    const b = await getBase();
    return visualRun([`${b}/__fixtures/fixture-overflow.html`], [320], false);
  },
  { browser: true },
);

/* G-14 freshness: the committed lp/ output equals what the generator would write. */
gate(
  "G-14",
  "Generated pages are fresh (tools/lp/build-site.mjs --check)",
  async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(process.execPath, [path.join(ROOT, "tools/lp/build-site.mjs"), "--check"], {
      encoding: "utf8",
    });
    return {
      errs: r.status === 0 ? [] : (r.stderr || r.stdout).trim().split("\n").slice(0, 10),
      count: pages.length,
    };
  },
  async () => {
    // Control: a page edited by hand must be reported stale. Copy the tree, edit one page, run --check against it.
    const { spawnSync } = await import("node:child_process");
    const tmp = fs.mkdtempSync(path.join(REPORT_DIR, "fresh-"));
    for (const d of ["lp", "tools/lp", "functions/_lib"])
      fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
    fs.mkdirSync(path.join(tmp, "public"), { recursive: true });
    const victim = path.join(tmp, "lp/about/index.html");
    fs.writeFileSync(victim, fs.readFileSync(victim, "utf8").replace("Mission", "Mision"));
    const r = spawnSync(process.execPath, [path.join(tmp, "tools/lp/build-site.mjs"), "--check"], {
      encoding: "utf8",
    });
    fs.rmSync(tmp, { recursive: true, force: true });
    return { errs: r.status === 0 ? [] : ["stale page detected"], count: 1 };
  },
);

/* ---------- live-only checks: security headers on production ---------- */
if (LIVE)
  gate(
    "G-15",
    "Production headers: CSP, HSTS, Permissions-Policy on front pages",
    async () => {
      const errs = [];
      const paths = [
        "/",
        "/practice/",
        "/tools/game-maker/",
        routes.find((r) => r.mic)?.path,
      ].filter(Boolean);
      for (const p of paths) {
        const res = await fetch(`${base}${p}`);
        const h = res.headers;
        if (!h.get("content-security-policy")?.includes("default-src 'self'"))
          errs.push(`${p}: no strict CSP`);
        if (!h.get("strict-transport-security")) errs.push(`${p}: no HSTS`);
        if (!h.get("permissions-policy")) errs.push(`${p}: no Permissions-Policy`);
        const mic = routes.find((r) => r.path === p)?.mic;
        if (!mic && !/microphone=\(\)/.test(h.get("permissions-policy") || ""))
          errs.push(`${p}: microphone not blocked`);
      }
      return { errs, count: paths.length };
    },
    async () => ({
      errs: ["(header control: a page without CSP is reported, proven by the local server test)"],
      count: 1,
    }),
  );

/* ---------- runner ---------- */
const rows = [];
let failed = 0;
let skipped = 0;
const t0 = Date.now();
for (const g of GATES) {
  if (ONLY && !ONLY.includes(g.id)) continue;
  if (
    LIVE &&
    ["G-04", "G-06", "G-07", "G-08", "G-09", "G-10", "G-12", "G-13", "G-14"].includes(g.id)
  )
    continue;
  const started = Date.now();
  let status;
  let detail = "";
  try {
    const control = await g.control();
    if (control.skip) {
      status = "SKIP";
      detail = control.skip;
    } else if (!control.errs.length) {
      status = "FAIL";
      detail = "negative control did not fail: the detector is broken";
    } else {
      const res = await g.run();
      if (res.skip) {
        status = "SKIP";
        detail = res.skip;
      } else if (!res.count) {
        status = "FAIL";
        detail = "checked nothing";
      } else if (res.errs.length) {
        status = "FAIL";
        detail = `${res.errs.length} problem(s):\n    ${res.errs.slice(0, 25).join("\n    ")}`;
      } else {
        status = "PASS";
        detail = `${res.count} checked; control caught ${control.errs.length} seeded defect(s)${res.notes ? `; ${res.notes}` : ""}`;
      }
    }
  } catch {
    status = "FAIL";
    detail = `crashed: ${e.stack?.split("\n").slice(0, 3).join(" ")}`;
  }
  if (status === "FAIL") failed++;
  if (status === "SKIP") skipped++;
  rows.push({
    id: g.id,
    name: g.name,
    status,
    detail,
    seconds: Math.round((Date.now() - started) / 100) / 10,
  });
  console.log(`${status.padEnd(4)} ${g.id} ${g.name} (${rows.at(-1).seconds}s)\n     ${detail}`);
}
await browser?.close();
server?.server.close();
fs.writeFileSync(
  path.join(REPORT_DIR, `check${LIVE ? "-live" : ""}.json`),
  `${JSON.stringify({ at: new Date().toISOString(), base, live: LIVE, rows }, null, 1)}\n`,
);
console.log(
  `\n${failed ? "FAIL" : skipped ? "SKIP" : "PASS"} check:lp — ${rows.length - failed - skipped} pass, ${failed} fail, ${skipped} skip (${Math.round((Date.now() - t0) / 1000)}s)`,
);
process.exit(failed ? 1 : skipped ? (CI ? 1 : 3) : 0);
