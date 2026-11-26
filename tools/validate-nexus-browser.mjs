#!/usr/bin/env node
import { sequence } from "../curriculum/nexus/orchestrate.mjs";
import { fromLibrary, LIBRARY, questions } from "../curriculum/nexus/resource.mjs";
// validate:nexus-browser — the Mission Builder and the mission player, driven the
// way a teacher and a student drive them (curriculum/nexus/). Serves the SOURCE
// tree. For every flagship mission and every goal: the player opens, every step
// renders with no console error, the animated model mounts where the sequence
// promises one, and a WRONG answer equal to a known misconception gets that
// misconception's cue (not the answer) before the right answer is accepted.
// Then: reload resumes the same step and answers; blocked storage still runs and
// says so; Spanish has no English step labels; no horizontal scroll at 390px;
// axe (wcag2a/aa) serious+critical = 0 on the builder and player; the teacher
// flow (topic → goal → preview) produces a working student link, a Word file
// that is a ZIP, an offline HTML that works with the network cut, and Customize →
// Review → Apply recomputes the answer and keeps a teacher's own wording.
// A missing browser is a SKIP (exit 3 locally, 1 in CI).
import { serveAccess } from "./lib/access-serve.mjs";
import { launchBrowser } from "./lib/lesson-gate-kit.mjs";

let AxeBuilder = null;
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  /* axe optional: reported */
}

const browser = await launchBrowser();
if (!browser) {
  console.log("SKIP validate:nexus-browser — no Chromium (set PW_CHROMIUM_PATH)");
  process.exit(process.env.CI ? 1 : 3);
}
const { server, base } = await serveAccess();
const failures = [];
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) failures.push(msg);
};

async function page(viewport = { width: 390, height: 844 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  return p;
}
const noScroll = (p) =>
  p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function axe(p, label) {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(!bad.length, `${label}: axe ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}`);
}

// ---- player: every mission × goal ------------------------------------------
for (const item of LIBRARY) {
  for (const goal of ["understand", "practice", "explain", "transfer"]) {
    const r = { ...fromLibrary(item.id, goal), support: goal === "explain" ? "full" : "light" };
    const steps = sequence(r);
    const p = await page();
    await p.goto(`${base}/curriculum/nexus/play/?id=${item.id}&goal=${goal}&support=${r.support}`);
    await p.waitForSelector("#nx-step");
    const labels = await p.$$eval("[data-step]", (b) => b.length);
    ok(
      labels === steps.length,
      `${item.id}/${goal}: ${labels} step buttons, expected ${steps.length}`,
    );
    for (let i = 0; i < steps.length; i++) {
      await p.click(`[data-step="${i}"]`);
      await p.waitForTimeout(steps[i] === "model" ? 500 : 60);
      const text = (await p.textContent("#nx-step")).trim();
      ok(text.length > 20, `${item.id}/${goal}: step ${steps[i]} rendered nothing`);
      if (steps[i] === "model")
        ok(await p.$("#nx-step .lsx-stage"), `${item.id}/${goal}: the living model did not mount`);
      if (steps[i] === "check") {
        const qs = questions(r);
        for (const q of qs) {
          const m = q.miscon[0];
          if (m) {
            await p.fill(`#a-${q.id}`, String(m.answer));
            await p.click(`[data-check="${q.id}"]`);
            const fb = await p.textContent(`[data-fb="${q.id}"]`);
            ok(
              fb.includes(m.why.en.slice(0, 25)),
              `${item.id} ${q.id}: misconception ${m.answer} did not get its cue (got "${fb}")`,
            );
            ok(
              !fb.includes(String(q.answer)) || String(q.answer).length < 2,
              `${item.id} ${q.id}: the cue printed the answer`,
            );
          }
          await p.fill(`#a-${q.id}`, String(q.answer));
          await p.click(`[data-check="${q.id}"]`);
          ok(
            (await p.textContent(`[data-fb="${q.id}"]`)).includes("Correct"),
            `${item.id} ${q.id}: right answer ${q.answer} not accepted`,
          );
        }
      }
      if (steps[i] === "twin") {
        const range = await p.$("#nx-step input[type=range]");
        if (range) {
          await range.focus();
          await p.keyboard.press("ArrowRight");
          ok(
            await p.$("#nx-step table, #nx-step .nx-fb"),
            `${item.id}: what-if explorer shows no result after a keyboard change`,
          );
        }
      }
    }
    ok(await noScroll(p), `${item.id}/${goal}: horizontal scroll at 390px`);
    ok(
      !p.errors.length,
      `${item.id}/${goal}: console errors ${p.errors.join(" | ").slice(0, 300)}`,
    );
    if (goal === "understand" && item.id === "juice-bar") {
      await axe(p, "player");
      // resume
      await p.click('[data-step="3"]');
      await p.reload();
      await p.waitForSelector("#nx-step");
      ok(
        (await p.textContent('[aria-current="step"]')).includes("4."),
        "reload did not resume the step",
      );
      ok((await p.inputValue("#a-q1")) === "8", "reload did not keep the answer");
      // Spanish
      await p.click('[data-lang="es"]');
      const es = await p.textContent("nav");
      ok(/Comprueba/.test(es) && !/Check your thinking/.test(es), "Spanish step labels");
      ok((await p.getAttribute("html", "lang")) === "es", "html lang follows the toggle");
    }
    await p.context().close();
  }
}

// ---- blocked storage ---------------------------------------------------------
{
  const p = await page();
  await p.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await p.goto(`${base}/curriculum/nexus/play/?id=discount-day&goal=practice`);
  await p.click('[data-step="1"]');
  await p.fill("#a-q1", "6");
  await p.click('[data-check="q1"]');
  ok(
    (await p.textContent('[data-fb="q1"]')).includes("Correct"),
    "blocked storage: checking still works",
  );
  ok(
    await p.isVisible("#nx-persist"),
    "blocked storage: the student is told work will not be saved",
  );
  await p.context().close();
}

// ---- a broken link ------------------------------------------------------------
{
  const p = await page();
  await p.goto(`${base}/curriculum/nexus/play/#m=garbage`);
  ok(
    (await p.textContent("#nx-app")).includes("Mission not found"),
    "a tampered link shows a calm error",
  );
  ok(!p.errors.length, "a tampered link throws nothing");
  await p.context().close();
}

// ---- teacher flow --------------------------------------------------------------
{
  const p = await page({ width: 1280, height: 900 });
  await p.goto(`${base}/curriculum/nexus/`);
  await axe(p, "builder step 1");
  await p.click('[data-topic="patio-planner"]');
  await p.click('[data-goal="practice"]');
  await axe(p, "builder step 3");
  ok(await noScroll(p), "builder: horizontal scroll");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click('[data-act="docx"]')]);
  const buf = await (await import("node:fs/promises")).readFile(await dl.path());
  ok(
    buf[0] === 0x50 && buf[1] === 0x4b && buf.includes("word/document.xml"),
    "Word download is a DOCX package",
  );
  const [off] = await Promise.all([p.waitForEvent("download"), p.click('[data-act="offline"]')]);
  const html = await (await import("node:fs/promises")).readFile(await off.path(), "utf8");
  // Customize: change the base, keep a teacher wording, review, apply.
  await p.click("#nx-customize summary");
  await p.fill("#cz-n-base", "15");
  await p.fill("#cz-q-q2-en", "My own question about paver cost");
  await p.click("[data-review]");
  ok(
    (await p.textContent("#nx-plan")).includes("135"),
    "review shows the recomputed area (15 × 9)",
  );
  await p.click("[data-apply]");
  ok(
    (await p.textContent("#nx-app")).includes("Adapted from Lesson 5-1"),
    "edited numbers report 'adapted', not 'aligned'",
  );
  const link = await p.getAttribute("a.nx-btn.primary", "href");
  ok(!p.errors.length, `builder console errors ${p.errors.join(" | ").slice(0, 300)}`);
  await p.context().close();

  const s = await page();
  await s.goto(link);
  await s.click('[data-step="1"]');
  ok(
    (await s.textContent("#nx-step")).includes("My own question about paver cost"),
    "the student link carries the teacher's wording",
  );
  await s.fill("#a-q1", "135");
  await s.click('[data-check="q1"]');
  ok(
    (await s.textContent('[data-fb="q1"]')).includes("Correct"),
    "the student link carries the edited numbers",
  );
  ok(
    !(await s.$("[data-review], #nx-customize, [data-support]")),
    "no authoring control on the student page",
  );
  await s.context().close();

  // Offline file with the network cut.
  const o = await page(undefined, { offline: true });
  await o.setContent(html);
  await o.fill("#in-q1", "126");
  await o.click('[data-check="q1"]');
  ok(
    (await o.textContent('[data-q="q1"] .fb')).includes("Correct"),
    "offline HTML checks answers with no network",
  );
  ok(!o.errors.length, `offline console errors ${o.errors.join(" | ")}`);
  await o.context().close();
}

await browser.close();
server.close();
if (!AxeBuilder) console.log("WARN axe-core not installed: accessibility scan skipped");
if (failures.length) {
  console.error(`FAIL validate:nexus-browser — ${failures.length} of ${checks} checks`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`PASS validate:nexus-browser — ${checks} checks`);
