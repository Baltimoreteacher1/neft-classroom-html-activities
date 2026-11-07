#!/usr/bin/env node
/**
 * The Learning Journey is additive. This drives it in a real browser and proves three things:
 *
 *  1. Every pre-Journey ACCESS Practice Lab route still answers on a clean profile (an h1, no console
 *     error, no failed or 4xx/5xx same-origin request).
 *  2. Every new Journey route (/journey, /journey/map, /journey/m08, /journey/m08/discover, /journey/guide)
 *     renders exactly one h1 with no console error, in both grade bands and in Spanish.
 *  3. A student who saved work BEFORE the Journey existed (Listening A record, ledger, exhibition, prefs)
 *     loads /journey as a new student, keeps every old key byte for byte, still sees the old work in the
 *     Passport, and round-trips a progress code (old keys + a journey key) through the Passport UI.
 *
 *   node tools/access-journey-routes-e2e.mjs        (serves this working tree; BASE=<url> to point elsewhere)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { allActivities, loadTests, REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-journey-routes-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab";
const PREFIX = "accessPracticeLab:v1";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-journey-routes-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

// Real content ids, so no URL here can rot into a guess.
const listening = allActivities().filter(
  (a) => a.band === "6-8" && a.domain === "Listening" && a.level === "A",
);
const readingB = allActivities().find(
  (a) => a.band === "6-8" && a.domain === "Reading" && a.level === "B",
);
const testId = loadTests()[0].data.id;
const NOISE = /web-vitals|favicon|speechSynthesis|downloadable font/i;

/** A context whose profile starts empty (or from `seed`) exactly once, before the first page load. */
async function newProfile({ prefs = {}, seed = {}, viewport = { width: 1280, height: 900 } } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await context.addInitScript(
    ({ prefs, seed, PREFIX }) => {
      try {
        if (sessionStorage.getItem("jr-e2e")) return;
        localStorage.clear();
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
        if (!(`${PREFIX}:prefs` in seed))
          localStorage.setItem(
            `${PREFIX}:prefs`,
            JSON.stringify({ langChosen: true, band: "6-8", ...prefs }),
          );
        sessionStorage.setItem("jr-e2e", "1");
      } catch {}
    },
    { prefs, seed, PREFIX },
  );
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => !NOISE.test(e.message) && problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error" || NOISE.test(m.text())) return;
    // Resource-load console lines are reported by the response/requestfailed hooks with their URL.
    if (/Failed to load resource/.test(m.text())) return;
    problems.push(`console: ${m.text()}`);
  });
  page.on("requestfailed", (r) => {
    if (!NOISE.test(r.url()) && r.failure()?.errorText !== "net::ERR_ABORTED")
      problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(origin) && !NOISE.test(r.url()))
      problems.push(`http ${r.status()}: ${r.url()}`);
  });
  return { context, page, problems };
}
async function visit({ page, problems }, path) {
  problems.length = 0;
  await page.goto(origin + LAB + path, { waitUntil: "load" });
  await page.waitForSelector("#app > :not(.boot)");
  await page.waitForSelector("#app h1");
  await page.waitForLoadState("networkidle").catch(() => {});
  return { h1: await page.locator("#app h1").count(), problems: [...problems] };
}
const snapshot = (page) =>
  page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .sort()
        .map((k) => [k, localStorage.getItem(k)]),
    ),
  );
/** Loading may legitimately add pref fields (never remove or change one the student set). */
function safeSubset(oldJson, newJson) {
  try {
    const o = JSON.parse(oldJson);
    const n = JSON.parse(newJson);
    return Object.entries(o).every(([k, v]) => JSON.stringify(n[k]) === JSON.stringify(v));
  } catch {
    return false;
  }
}

try {
  // ── 1. Old routes, clean profile ────────────────────────────────────────
  const OLD = [
    "/",
    "/Listening/A",
    `/Reading/B/${readingB.activity.id}`,
    `/test/${testId}`,
    "/passport",
    "/family",
    "/tools",
    "/growth",
    "/library",
    "/exhibition",
    "/worlds",
    "/missions",
    "/speak",
    "/write",
  ];
  {
    const s = await newProfile();
    for (const route of OLD) {
      const r = await visit(s, route);
      ok(
        r.h1 >= 1 && r.problems.length === 0,
        `old route ${route}: h1=${r.h1}${r.problems.length ? ` — ${r.problems.slice(0, 3).join(" | ")}` : ""}`,
      );
    }
    await s.context.close();
  }

  // ── 2. New Journey routes: both bands, English and Spanish ───────────────
  const NEW = [
    "/journey",
    "/journey/map",
    "/journey/m08",
    "/journey/m08/discover",
    "/journey/guide",
  ];
  for (const lang of ["en", "es"]) {
    for (const band of ["3-5", "6-8"]) {
      const s = await newProfile({ prefs: { lang, band } });
      for (const route of NEW) {
        const r = await visit(s, `${route}?grades=${band}`);
        // Only the family view switches <html lang>; elsewhere Spanish is marked inline with lang="es"
        // (src/i18n.js docLang), so Spanish must show up as lang="es" text inside the page.
        const spanishNodes = await s.page.locator('#app [lang="es"]').count();
        ok(
          r.h1 === 1 && r.problems.length === 0 && (lang === "es" ? spanishNodes > 0 : true),
          `${route}?grades=${band} [${lang}]: h1=${r.h1} es-marked nodes=${spanishNodes}${r.problems.length ? ` — ${r.problems.slice(0, 3).join(" | ")}` : ""}`,
        );
      }
      await s.context.close();
    }
  }
  // Spanish chosen through the UI switch (not only through prefs) must reach a Journey page too.
  {
    const s = await newProfile();
    await visit(s, "/journey?grades=6-8");
    await s.page.locator('.lab-tools [data-lang-mode="es"]').first().click();
    await s.page.waitForSelector('.lab-tools [data-lang-mode="es"][aria-pressed="true"]');
    await s.page.waitForSelector('#app [lang="es"]');
    const prefs = await s.page.evaluate(() =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs")),
    );
    ok(
      prefs.lang === "es" && (await s.page.locator("#app h1").count()) === 1,
      "language switch on /journey persists Spanish and keeps one h1",
    );
    await s.context.close();
  }

  // ── 3. Saved progress from before the Journey ───────────────────────────
  const [a1, a2] = listening;
  const ledger = {
    v: 1,
    entries: [
      {
        id: "pre-journey-1",
        t: "2026-10-01T14:00:00.000Z",
        src: "writing",
        task: "w.old",
        band: "6-8",
        domain: "Writing",
        use: "Inform",
        stage: "supported",
        kind: "first",
        attempt: "",
        supports: { frames: true },
        m: { words: 40 },
        feedbackSource: "local-rule",
        modelVersion: null,
        promptVersion: null,
        confidence: null,
        teacherOverride: false,
        teacherOverrideValue: null,
      },
    ],
  };
  const OLD_SEED = {
    [`${PREFIX}:Listening:A`]: JSON.stringify({
      complete: [a1.activity.id, a2.activity.id],
      answers: { [a1.activity.id]: 0, [a2.activity.id]: 1 },
      results: { [a1.activity.id]: { ok: true }, [a2.activity.id]: { ok: true } },
    }),
    [`${PREFIX}:ledger`]: JSON.stringify(ledger),
    [`${PREFIX}:exhibition`]: JSON.stringify({
      v: 1,
      bands: {
        "6-8": { support: "B", tasks: { listen: { done: true }, read: {}, speak: {}, write: {} } },
      },
    }),
    [`${PREFIX}:prefs`]: JSON.stringify({ langChosen: true, band: "6-8", lang: "en", textSize: 1 }),
  };

  const s = await newProfile({ seed: OLD_SEED });
  const first = await visit(s, "/journey?grades=6-8");
  ok(
    first.h1 >= 1 && first.problems.length === 0,
    `seeded profile loads /journey (${first.problems.join(" | ")})`,
  );
  const heading = (await s.page.locator("#app h1").first().innerText()).toLowerCase();
  const startLink = await s.page.locator('#app a[href*="/journey/m01"]').count();
  ok(
    /start my learning journey|empieza mi viaje/.test(heading) || startLink > 0,
    `/journey renders a pre-Journey profile as a new student (h1 "${heading.trim()}")`,
  );
  const after = await snapshot(s.page);
  const drift = Object.keys(OLD_SEED).filter(
    (k) => after[k] !== OLD_SEED[k] && !(k.endsWith(":prefs") && safeSubset(OLD_SEED[k], after[k])),
  );
  ok(
    drift.length === 0,
    `old keys untouched by loading /journey${drift.length ? ` — changed: ${drift.join(", ")}` : ""}`,
  );
  const stray = Object.keys(after).filter((k) => !(k in OLD_SEED));
  ok(
    stray.every((k) => k === `${PREFIX}:journey`),
    `loading /journey adds no unexpected key (${stray.join(", ") || "none"})`,
  );

  await visit(s, "/passport?grades=6-8");
  const passportText = await s.page.locator("#app").innerText();
  // The Passport counts finished work as stamps ("2 of N activities"); it does not list titles.
  const stamps = /Stamps\s+(\d+)\s+of\s+(\d+)\s+activities/.exec(passportText);
  ok(
    stamps && Number(stamps[1]) === 2,
    `Passport still counts the 2 old completed activities as stamps (${stamps ? stamps[0].replace(/\s+/g, " ") : "no stamps tile"})`,
  );

  // Create a journey key by completing one step through the app's own state functions.
  await s.page.evaluate(async (LAB) => {
    const st = await import(`${LAB}/src/journey/state.js`);
    let state = st.loadJourney();
    state = st.startStep(state, "6-8", "m01", "discover");
    state = st.completeStep(state, "6-8", "m01", "discover", { independent: false });
    st.saveJourney(state);
  }, LAB);
  const withJourney = await snapshot(s.page);
  ok(
    Boolean(withJourney[`${PREFIX}:journey`]),
    "a completed step writes accessPracticeLab:v1:journey",
  );

  // Export through the Passport UI (clipboard is unavailable here, so the page falls back to the textbox).
  await visit(s, "/passport?grades=6-8");
  await s.page.locator("[data-export]").click();
  await s.page.waitForFunction(() =>
    document.querySelector("[data-import-text]")?.value.startsWith("ACCESS1."),
  );
  const code = await s.page.locator("[data-import-text]").inputValue();
  const decoded = JSON.parse(Buffer.from(code.slice(8), "base64").toString("utf8")).data;
  const missing = Object.keys(OLD_SEED).filter((k) => !(k in decoded));
  ok(
    missing.length === 0,
    `progress code carries every old key (${missing.join(", ") || "all present"})`,
  );
  ok(`${PREFIX}:journey` in decoded, "progress code carries the journey key");
  await s.context.close();

  // Import into a different device (empty profile) through the Passport UI.
  const d = await newProfile();
  await visit(d, "/passport?grades=6-8");
  await d.page.locator("[data-import-text]").fill(code);
  await d.page.locator("[data-import]").click();
  await d.page.waitForTimeout(600);
  const landed = await snapshot(d.page);
  // `exhibition` is exported but importProgressData has no rule for it (store.js); recorded, not asserted.
  const importable = Object.keys(OLD_SEED).filter(
    (k) => !k.endsWith(":exhibition") && !k.endsWith(":prefs"),
  );
  const mismatched = importable.filter((k) => landed[k] !== OLD_SEED[k]);
  ok(
    mismatched.length === 0,
    `import restores old Listening record + ledger exactly${mismatched.length ? ` — differ: ${mismatched.join(", ")}` : ""}`,
  );
  ok(
    Boolean(landed[`${PREFIX}:journey`]) &&
      JSON.stringify(JSON.parse(landed[`${PREFIX}:journey`])) ===
        JSON.stringify(JSON.parse(withJourney[`${PREFIX}:journey`])),
    "import restores the journey key exactly",
  );
  await visit(d, "/journey?grades=6-8");
  const resumed = await d.page.locator("#app").innerText();
  ok(
    /Mission 1|Misión 1/.test(resumed),
    "the imported journey shows Mission 1 progress on the new device",
  );
  console.log(
    `NOTE exhibition key ${`${PREFIX}:exhibition` in landed ? "was imported" : "is exported but NOT imported by importProgressData (pre-existing, not Journey)"}`,
  );
  ok(
    d.problems.length === 0,
    `no console/network problems during import (${d.problems.join(" | ")})`,
  );
  await d.context.close();
} catch (error) {
  failures.push(`crash: ${error.stack || error}`);
  console.log(`FAIL crash: ${error.stack || error}`);
}
await browser.close();
server?.close();
if (failures.length) {
  console.log(`\naccess-journey-routes-e2e: ${failures.length} FAILED`);
  process.exit(1);
}
console.log("\naccess-journey-routes-e2e: all checks passed");
