#!/usr/bin/env node
/**
 * canvas-notebook-probe.mjs — the Canvas Student View test, automated.
 *
 * WHAT THIS REPLACES. The manual test is: upload the zip to Canvas, publish,
 * open Student View, write a notebook capture, close, reopen, and hope someone
 * thinks to open the SCORM debug log and read cmi.suspend_data. That test runs
 * once, by hand, and proves nothing about the next build. This does the same
 * thing against a real SCORM 1.2 host with the SAME 4096-character ceiling, in
 * a real browser, in ~30 seconds, repeatably.
 *
 * WHAT IS REAL HERE AND WHAT IS SUBSTITUTED — stated plainly, because a probe
 * that overstates its coverage is worse than no probe:
 *
 *   REAL: the packaged SCO, extracted from the zip `npm run scorm` produced —
 *         not a copy, not a fixture. The lesson, booted through the actual Vite
 *         build. The full API discovery walk, LMSInitialize / LMSSetValue /
 *         LMSCommit / LMSFinish handshake. The 4096-char suspend_data cap and
 *         the SCO's refusal of an oversize write.
 *   SUBSTITUTED: Canvas itself. The LMS is tools/scorm/mock-lms.mjs, which
 *         enforces SCORM 1.2's data-model limits (that IS the part Canvas
 *         contributes to this failure mode). The iframe target is the local
 *         build rather than eduwonderlab.com, because a package built today
 *         wraps the LIVE site — testing against production would test what is
 *         already deployed, which for this feature is the old lesson.
 *   NOT COVERED: Canvas's own gradebook plumbing, its SCORM importer, and the
 *         Cloudflare Access path. Those need the manual run in docs.
 *
 * THE ASSERTION THAT MATTERS. A notebook capture is proof a student wrote in a
 * paper notebook. It is ungraded, and suspend_data is a 4096-CHARACTER budget
 * that small-group and project pathways already blow through — a capture in
 * there is both useless and dangerous, because the SCO REFUSES an oversize
 * write rather than truncating it, and the write it refuses is the one holding
 * the student's actual answers. So: the capture text, the `#nt-nb-*` field ids,
 * and the `__ntNotebook` key must never appear in suspend_data, while the
 * capture still survives a close-and-reopen through local save/resume.
 *
 * Usage:
 *   npm run build                       # the probe reads dist/
 *   node tools/scorm/canvas-notebook-probe.mjs [--lesson 1-1] [--keep]
 *
 * Exit: 0 pass · 1 fail · 3 SKIP (no browser — see tools/lib/skip-exit.mjs).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "../lib/skip-exit.mjs";
import { readZip } from "./zip-read.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const LESSON = argv.includes("--lesson") ? argv[argv.indexOf("--lesson") + 1] : "1-1";
const KEEP = argv.includes("--keep");

// A capture string no lesson, template, or engine file contains, so finding it
// anywhere in suspend_data is proof of a leak and never a coincidence.
const CAPTURE = "QUOKKA7";

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);
const note = (m) => {
  notes.push(m);
  console.log(`  · ${m}`);
};

/* ── 1. the artifacts ─────────────────────────────────────────────────────── */

const DIST = join(ROOT, "dist");
if (!existsSync(join(DIST, "lessons", LESSON, "index.html"))) {
  process.exit(
    skipExit(
      `dist/lessons/${LESSON}/index.html is missing`,
      "Run `npm run build` first — this probe drives the built lesson, not the dev server.",
    ),
  );
}

const work = mkdtempSync(join(tmpdir(), "nt-scorm-probe-"));
const cleanup = () => {
  if (!KEEP) rmSync(work, { recursive: true, force: true });
};

console.log(`Canvas notebook probe — lesson ${LESSON}`);

// Build a package pointed at the LOCAL build. NEFT_SITE is the supported
// override; the pre-flight gate refuses a localhost target for a package a
// teacher would upload, which is correct — this one is never uploaded.
let PORT = 0;
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  let path = decodeURIComponent(url.pathname);
  const root = path.startsWith("/scorm/") ? work : DIST;
  if (path.startsWith("/scorm/")) path = path.slice("/scorm".length);
  let file = join(root, path);
  if (path.endsWith("/")) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}/index.html`)) file = `${file}/index.html`;
  if (!existsSync(file) || !file.startsWith(root)) {
    res.writeHead(404).end("not found");
    return;
  }
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
PORT = server.address().port;
const SITE = `http://127.0.0.1:${PORT}`;
note(`local site on ${SITE}`);

// Built for PRODUCTION, exactly as a teacher's download is — the builder
// refuses any other host, and that refusal is correct. The one substitution
// this probe makes is retargeting the SCO's content URL to the local build
// AFTER packaging: a package wraps the LIVE site, so probing it unmodified
// would test the lesson already deployed, which for this feature is the old
// one. Every other byte of the SCO is the shipped article.
execFileSync(process.execPath, [join(ROOT, "tools/scorm/build-scorm.mjs"), LESSON, "Probe"], {
  cwd: ROOT,
  stdio: "pipe",
});
const zipPath = execFileSync(
  "bash",
  ["-lc", `ls -t "${join(ROOT, "scorm-packages")}"/*${LESSON}*.zip | head -1`],
  { encoding: "utf8" },
).trim();
if (!zipPath) {
  cleanup();
  fail("the builder produced no package");
}
const entries = readZip(readFileSync(zipPath));
mkdirSync(work, { recursive: true });
for (const e of entries) {
  const out = join(work, e.name);
  mkdirSync(dirname(out), { recursive: true });
  let bytes = Buffer.from(e.data);
  if (e.name === "index.html") {
    const retargeted = bytes.toString("utf8").split("https://eduwonderlab.com").join(SITE);
    bytes = Buffer.from(retargeted, "utf8");
  }
  writeFileSync(out, bytes);
}
note(`package ${zipPath.split("/").pop()} → ${entries.map((e) => e.name).join(", ")}`);

/* ── 2. the LMS harness page ──────────────────────────────────────────────── */

// A SCORM 1.2 API on `window`, with the real data-model limits. The SCO's
// findAPI() walks the parent chain and finds this exactly as it finds Canvas's.
const HARNESS = `<!doctype html><meta charset="utf-8"><title>LMS harness</title>
<script>
  var LIMITS = { "cmi.suspend_data": 4096, "cmi.core.lesson_location": 255 };
  var data = { "cmi.core.lesson_status": "not attempted", "cmi.suspend_data": "",
               "cmi.core.lesson_location": "", "cmi.core.student_name": "Probe, Student",
               "cmi.core.student_id": "probe-1", "cmi.core.credit": "credit",
               "cmi.core.entry": "ab-initio", "cmi.core.score.raw": "" };
  window.__log = [];
  window.API = {
    LMSInitialize: function () { window.__log.push(["init"]); return "true"; },
    LMSGetValue: function (k) { window.__log.push(["get", k]); return data[k] == null ? "" : String(data[k]); },
    LMSSetValue: function (k, v) {
      v = String(v);
      if (LIMITS[k] && v.length > LIMITS[k]) { window.__log.push(["REFUSED", k, v.length]); window.__err = "401"; return "false"; }
      data[k] = v; window.__log.push(["set", k, v.length]); return "true";
    },
    LMSCommit: function () { window.__log.push(["commit"]); return "true"; },
    LMSFinish: function () { window.__log.push(["finish"]); return "true"; },
    LMSGetLastError: function () { return window.__err || "0"; },
    LMSGetErrorString: function () { return ""; },
    LMSGetDiagnostic: function () { return ""; },
  };
  window.__data = data;
  // Seeded by the probe between "sessions" to simulate close-and-reopen.
  try {
    var seed = JSON.parse(sessionStorage.getItem("probe-seed") || "null");
    if (seed) for (var k in seed) data[k] = seed[k];
  } catch (e) {}
</script>
<iframe id="sco" src="/scorm/index.html" style="width:1280px;height:900px;border:0"></iframe>`;
writeFileSync(join(work, "harness.html"), HARNESS);

/* ── 3. drive it ──────────────────────────────────────────────────────────── */

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  server.close();
  cleanup();
  process.exit(skipExit("playwright is not installed"));
}
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
} catch (e) {
  server.close();
  cleanup();
  process.exit(skipExit(`Chromium could not be launched (${e.message.split("\n")[0]})`));
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const lessonFrame = async () => {
  for (let i = 0; i < 40; i++) {
    for (const f of page.frames()) {
      if (f.url().includes(`/lessons/${LESSON}/`)) {
        const ready = await f.evaluate(() => !!document.getElementById("app")).catch(() => false);
        if (ready) return f;
      }
    }
    await page.waitForTimeout(500);
  }
  return null;
};

async function openLesson() {
  await page.goto(`${SITE}/scorm/harness.html`, { waitUntil: "domcontentloaded" });
  const frame = await lessonFrame();
  if (!frame) throw new Error("the lesson never appeared inside the SCO iframe");
  await page.waitForTimeout(2500);
  // Identity screen → mission briefing → phases. Each is optional depending on
  // the lesson's shape, so every step is guarded rather than assumed.
  await frame
    .evaluate(async () => {
      const d = document;
      const set = (id, v) => {
        const e = d.getElementById(id);
        if (e) {
          e.value = v;
          e.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };
      if (d.getElementById("id-start")) {
        set("id-name", "Probe S");
        set("id-period", "3");
        d.getElementById("id-start").click();
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (d.querySelector(".flagship-mission-start")) {
        d.querySelector(".flagship-mission-start").click();
        await new Promise((r) => setTimeout(r, 1200));
      }
    })
    .catch(() => {});
  return frame;
}

const suspend = () => page.evaluate(() => window.__data["cmi.suspend_data"] || "");
const location = () => page.evaluate(() => window.__data["cmi.core.lesson_location"] || "");

try {
  // ---- session 1: write a capture, pass the gate ---------------------------
  let frame = await openLesson();
  note("SCO launched, lesson booted inside it");

  const diag = await frame.evaluate(() => ({
    search: location.search,
    bridge: !!window.NeftCanvasBridge,
    bridgeTag: !!document.querySelector('script[src="/assets/canvas-bridge.js"]'),
    sr: !!window.NeftSaveResume,
    inFrame: window.parent !== window,
  }));
  note(`lesson frame: ${JSON.stringify(diag)}`);
  const before = await suspend();
  note(`suspend_data before any capture: ${before.length} chars`);

  const gate = await frame.evaluate(async (capture) => {
    const d = document;
    const nav = async (i) => {
      d.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: i } }));
      await new Promise((r) => setTimeout(r, 900));
    };
    const at = () => d.querySelector(".phase")?.getAttribute("aria-label") || null;
    await nav(2);
    const rendered = !!d.querySelector(".nt-nb");
    await nav(3);
    const blocked = at();
    return { rendered, blocked };
  }, CAPTURE);

  // REAL user input, not synthesised events. canvas-bridge.js drives its state
  // relay off genuine activity events with a 5s debounce, so a dispatched
  // Event("input") can leave the LMS never written and every "does not contain"
  // assertion below vacuously true.
  await frame.locator(".nt-nb-check").check();
  await frame.locator(".nt-nb-input").fill(CAPTURE);
  await frame.locator(".nt-nb-input").press("End");
  gate.released = await frame.evaluate(async () => {
    document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: 3 } }));
    await new Promise((r) => setTimeout(r, 900));
    return document.querySelector(".phase")?.getAttribute("aria-label") || null;
  });

  if (!gate.rendered) fail("the notebook block did not render at the Launch phase");
  if (gate.blocked !== "Launch") fail(`the gate did not hold: left Launch for ${gate.blocked}`);
  if (gate.released !== "Explore") fail(`the gate did not release: still on ${gate.released}`);
  if (gate.rendered && gate.blocked === "Launch" && gate.released === "Explore") {
    note("gate held on an empty capture and released on a filled one");
  }

  // canvas-bridge debounces activity by 5s, then the SCO coalesces state writes
  // for another 3s before touching the LMS. Wait out both, or the probe reads
  // an LMS that was simply never written yet.
  await page.waitForTimeout(10000);
  await page.evaluate(() => window.API.LMSCommit(""));
  const payload = await suspend();
  const loc = await location();
  note(`suspend_data after the capture: ${payload.length} chars (cap 4096)`);
  note(`lesson_location: "${loc}"`);

  if (payload.length > 4096) fail(`suspend_data is ${payload.length} chars — over the SCORM cap`);
  if (payload.includes(CAPTURE)) fail("suspend_data contains the CAPTURE TEXT");
  if (payload.includes("nt-nb-")) fail("suspend_data contains a #nt-nb-* field id");
  if (payload.includes("__ntNotebook")) fail("suspend_data contains the __ntNotebook key");
  if (
    !payload.includes(CAPTURE) &&
    !payload.includes("nt-nb-") &&
    !payload.includes("__ntNotebook")
  ) {
    note("suspend_data carries NONE of: capture text, #nt-nb-* ids, __ntNotebook");
  }
  // POSITIVE CONTROL. Every assertion below is "the payload does not contain X",
  // and an empty payload satisfies all of them. A probe that passes because
  // nothing ever happened is the exact failure this repo just spent a commit
  // removing from its gate runner, so prove the relay ran before trusting what
  // it carried.
  const apiLog = await page.evaluate(() => window.__log.map((l) => l.join(" ")));
  const wroteSuspend = apiLog.some((l) => l.startsWith("set cmi.suspend_data"));
  if (!wroteSuspend) {
    fail(
      `the SCO never wrote cmi.suspend_data — this run proves NOTHING about what it would contain. API calls seen: ${apiLog.join(" | ") || "(none)"}`,
    );
  } else {
    note(
      `the SCO wrote suspend_data ${apiLog.filter((l) => l.startsWith("set cmi.suspend_data")).length}x — the relay really ran`,
    );
  }

  const refused = await page.evaluate(() =>
    window.__log.filter((l) => l[0] === "REFUSED").map((l) => l.join(" ")),
  );
  if (refused.length) fail(`the LMS refused a write: ${refused.join("; ")}`);
  else note("no write was refused — nothing was pushed over the ceiling");

  // The capture must still be somewhere, or the feature is broken rather than safe.
  const held = await frame.evaluate(
    (c) =>
      (
        localStorage.getItem(`nt-notebook:${document.documentElement.dataset.probe || ""}`) ||
        JSON.stringify(localStorage)
      ).includes(c),
    CAPTURE,
  );
  if (!held) fail("the capture is not in local save/resume either — it was simply lost");
  else note("the capture is held by local save/resume, which is where it belongs");

  // ---- session 2: close and reopen ----------------------------------------
  const seed = await page.evaluate(() => JSON.stringify(window.__data));
  await page.evaluate(() => window.API.LMSFinish(""));
  await page.addInitScript((s) => sessionStorage.setItem("probe-seed", s), seed);
  frame = await openLesson();
  const resumed = await frame.evaluate(async () => {
    const d = document;
    d.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: 2 } }));
    await new Promise((r) => setTimeout(r, 1200));
    const nb = d.querySelector(".nt-nb");
    return {
      text: nb?.querySelector(".nt-nb-input")?.value || "",
      checked: !!nb?.querySelector(".nt-nb-check")?.checked,
    };
  });
  if (resumed.text !== CAPTURE || !resumed.checked) {
    fail(
      `resume lost the capture: text "${resumed.text}", checkbox ${resumed.checked ? "on" : "off"}`,
    );
  } else {
    note("after close-and-reopen the capture and its checkbox came back");
  }
  const resumeSuspend = await suspend();
  if (resumeSuspend.includes(CAPTURE)) fail("the resumed session pushed the capture into the LMS");
} catch (e) {
  fail(`probe error: ${e.message}`);
} finally {
  await browser.close().catch(() => {});
  server.close();
  cleanup();
}

console.log("");
if (problems.length) {
  for (const p of problems) console.error(`FAIL  ${p}`);
  console.error(`\nCanvas notebook probe: FAIL (${problems.length})`);
  process.exit(1);
}
console.log("Canvas notebook probe: PASS");
console.log("  Not covered here: Canvas's own SCORM importer, gradebook plumbing, and the");
console.log("  Cloudflare Access path. Those still need the manual Student View run.");
