#!/usr/bin/env node
/**
 * The interactive Language Labs (Verb Time Machine, Connector Bridge, Paragraph X-Ray) in a real browser:
 * the time-travel scrubber (drag, keys, Break it), the bridge builder (relationship shapes, punctuation tiles, weigh the
 * evidence), the paragraph lenses and the three-part practice (labels, drag/arrow reorder, rebuild); hint ladders and
 * their ledger flag, keyboard shortcuts, resume, reduced motion; WCAG 2.1 AA (axe) at every step in both bands in
 * EN and EN+ES; no sideways scroll and 44px targets at 1366x768, 768x1024 and 390x844.
 * Usage: node tools/access-labs-interactive-e2e.mjs   (BASE=<url> to point elsewhere; PW_CHROMIUM_PATH for a system Chrome)
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-labs-interactive-e2e: SKIP — playwright or @axe-core/playwright is not installed.",
  );
  process.exit(process.env.CI ? 1 : 3);
}

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
const LAB_CSS = "/access-practice-lab/language-labs-lab.css";
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
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    // index.html links the lab stylesheet; if a checkout has not linked it yet, add it so the layout checks are real.
    if (file.endsWith("access-practice-lab/index.html")) {
      const page = readFileSync(file, "utf8");
      return res.end(
        page.includes("language-labs-lab.css")
          ? page
          : page.replace("</head>", `<link rel="stylesheet" href="${LAB_CSS}"></head>`),
      );
    }
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab/language-labs";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const errors = [];
const LABS = ["verb-time-machine", "connector-bridge", "paragraph-xray"];

async function newPage(viewport = { width: 1366, height: 900 }, opts = {}) {
  const context = await browser.newContext({ viewport, ...opts });
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  return page;
}
async function go(page, lab, step, band = "6-8", lang = "en") {
  await page.goto(`${origin}${LAB}/${lab}?step=${step}&grades=${band}&lang=${lang}`);
  await page.waitForSelector("#app h1", { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
}
async function axe(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  const r = await new AxeBuilder({ page })
    .include(".ll-lab")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target} ${(v.nodes[0]?.failureSummary || "").replace(/\s+/g, " ").slice(0, 220)}`).join(" ")}`,
  );
}
const ledger = (page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || "{}").entries || [],
  );
const text = (page, sel) => page.locator(sel).first().innerText();

try {
  // ── Verb Time Machine ──────────────────────────────────────────────────────
  {
    const page = await newPage();
    await go(page, "verb-time-machine", 2);
    const slider = page.locator("[data-ll-slide]");
    await slider.focus();
    await page.keyboard.press("Home");
    ok(
      /had built/.test(await text(page, ".ll-sentence")),
      "scrubber: Home key travels to the earliest stop (had built)",
    );
    ok(
      (await page.locator("[data-vm-scene]").getAttribute("data-tense")) === "past-perfect",
      "scrubber: the picture changes with the stop",
    );
    ok(
      /had built/.test((await slider.getAttribute("aria-valuetext")) || ""),
      "scrubber: aria-valuetext carries the sentence",
    );
    await page.keyboard.press("ArrowRight");
    ok(
      /built/.test(await text(page, ".ll-sentence")) &&
        !/had built/.test(await text(page, ".ll-sentence")),
      "scrubber: arrow key moves one stop later",
    );
    ok(
      await page.evaluate(() => document.activeElement?.matches("[data-ll-slide]")),
      "scrubber: focus stays on the slider while it repaints in place",
    );
    await page.locator("[data-ll-stop]").nth(6).click();
    ok(
      /will build/.test(await text(page, ".ll-sentence")),
      "stop buttons jump through time (will build)",
    );
    await page.keyboard.press("2");
    ok(
      (await page.locator("[data-vm-scene]").getAttribute("data-tense")) === "past",
      "digit keys jump to a stop",
    );
    await page.keyboard.press("b");
    ok(
      (await page.locator(".vm-broken").count()) === 1 &&
        /Yesterday/.test(await text(page, ".vm-broken")),
      "Break it shows a mix-up with the clue",
    );
    ok(
      /disagree/.test(await text(page, ".vm-break")),
      "Break it explains why the clue and the form disagree",
    );
    await axe(page, "verb explore with Break it");
    await page.keyboard.press("b");
    ok((await page.locator(".vm-broken").count()) === 0, "Break it turns off");
    await page.locator("[data-ll-verb]").nth(1).click();
    ok(
      /my brother/.test(await text(page, ".ll-sentence")),
      "choosing another action repaints in place",
    );
    ok(
      (await page.locator("[data-ll-discover]").count()) === 1,
      "the discovery unlocks after three stops were tried",
    );
    await page.click("[data-ll-discover]");
    ok((await page.locator(".ll-disc-a").count()) === 1, "the discovery reveals");
    await page.reload();
    await page.waitForSelector(".ll-steps");
    ok(
      /my brother/.test(await text(page, ".ll-sentence")),
      "the chosen action and stop survive a reload",
    );

    // practice: hint ladder, support flag, focus
    await go(page, "verb-time-machine", 4);
    await page.click('[data-ll-hint="vt-68-4"]');
    ok(/time clue/i.test(await text(page, ".ll-hint")), "hint 1 asks about the time clue");
    ok(!/\bwrote\b/.test(await text(page, ".ll-hint")), "hint 1 never states the answer");
    await page.fill('[data-ll-answer="vt-68-4"]', "wrote");
    await page.click('[data-ll-check="vt-68-4"]');
    const e = (await ledger(page)).at(-1);
    ok(
      e?.stage === "supported" && e.supports?.hint === true && e.m?.ok === 1,
      "an answer after a hint is a supported ledger entry",
    );
    ok(
      (await page.locator(".vm-formula").count()) === 1,
      "a solved item shows how the form is built",
    );
    await go(page, "verb-time-machine", 4);
    await page.fill('[data-ll-answer="vt-68-3"]', "has built");
    await page.click('[data-ll-check="vt-68-3"]');
    ok(
      (await ledger(page)).at(-1)?.stage === "independent",
      "an unaided first try is an independent ledger entry",
    );

    // shortcuts, resume, empty states
    await go(page, "verb-time-machine", 2);
    await page.keyboard.press("k");
    ok(
      (await page.locator("#llKeys").count()) === 1 &&
        (await page.locator(".ll-keys-btn").getAttribute("aria-expanded")) === "true",
      "K opens the documented shortcut list",
    );
    await axe(page, "verb shortcuts panel");
    await page.keyboard.press("]");
    await page.waitForFunction(() => /step=3/.test(location.search));
    ok(true, "] goes to the next step");
    await page.goto(`${origin}${LAB}/verb-time-machine?grades=6-8`);
    await page.waitForSelector(".ll-steps");
    ok(
      /Example/.test(await text(page, '.ll-steps a[aria-current="step"]')),
      "a lab opened with no step resumes where the learner stopped",
    );
    await go(page, "verb-time-machine", 1);
    ok(
      (await page.locator(".ll-resume").count()) === 1,
      "step 1 offers to pick up where the learner stopped",
    );
    await go(page, "verb-time-machine", 5);
    const before = (await ledger(page)).length;
    await page.click("[data-ll-check-transfer]");
    ok((await ledger(page)).length === before, "checking an empty writing box records nothing");
    await page.focus("[data-ll-transfer]");
    await page.keyboard.type("k]l");
    ok(
      /step=5/.test(page.url()) && (await page.inputValue("[data-ll-transfer]")) === "k]l",
      "shortcuts pause while typing",
    );
    await page.context().close();
  }

  // ── Connector Bridge ───────────────────────────────────────────────────────
  {
    const page = await newPage();
    await go(page, "connector-bridge", 2);
    await page.click('[data-ll-connector="however"]');
    ok(
      (await page.locator(".cb-scene").getAttribute("data-job")) === "contrast",
      "the bridge takes the shape of the relationship (contrast)",
    );
    ok(
      (await page.locator(".cb-keystone .cb-mark").count()) === 2 &&
        /;\s*however\s*,/.test((await text(page, ".ll-sentence")).replace(/\s+/g, " ")),
      "a transition draws a semicolon and a comma on the bridge",
    );
    await page.click('[data-ll-connector="because"]');
    ok(
      (await page.locator(".cb-keystone .cb-mark").count()) === 0 &&
        /closed because we/.test(await text(page, ".ll-sentence")),
      "because needs no comma, and none is drawn",
    );
    await page.click('[data-ll-connector="so"]');
    ok(
      (await page.locator(".cb-keystone .cb-mark").count()) === 1 &&
        /closed, so we/.test(await text(page, ".ll-sentence")),
      "so is drawn with a comma before it",
    );
    await page.keyboard.press("3");
    ok(
      (await page.locator(".cb-scene").getAttribute("data-job")) === "contrast",
      "number keys pick connectors (3 = but)",
    );
    await axe(page, "bridge explore");
    await page.keyboard.press("w");
    ok(
      (await page.locator(".cb-scale").count()) === 1,
      "W switches to Weigh the evidence (grades 6-8)",
    );
    await page.click('[data-ll-wfirst="counter"]');
    await page.click('[data-ll-wform="although-front"]');
    ok(
      (await page.locator(".cb-scale").getAttribute("data-tilt")) === "1" &&
        (await page.locator(".ll-fit").count()) === 1,
      "an although-first sentence puts the weight on your evidence",
    );
    await page.click('[data-ll-wfirst="support"]');
    await page.click('[data-ll-wform="however"]');
    ok(
      (await page.locator(".cb-scale").getAttribute("data-tilt")) === "-1" &&
        (await page.locator(".ll-misfit").count()) === 1,
      "the same ideas in the other order weigh the other side, and say so",
    );
    await axe(page, "bridge weigh the evidence");

    await go(page, "connector-bridge", 4);
    await page.click('[data-ll-bhint="cb-68-1"]');
    ok(
      (await page.locator(".cb-group").count()) >= 4,
      "hint 1 groups the connectors by relationship",
    );
    await page.click('[data-ll-bhint="cb-68-1"]');
    ok(
      (await page.locator(".cb-qs li").count()) === 6,
      "hint 2 lists what idea B can do to idea A",
    );
    await page.click('[data-ll-bridge="cb-68-1"][data-word="therefore"]');
    ok(
      (await page.locator(".ll-item.is-done .cb-mini").count()) === 1,
      "a right bridge shows its shape and the joined sentence",
    );
    ok(
      (await ledger(page)).at(-1)?.stage === "supported",
      "a bridge chosen after hints is a supported ledger entry",
    );
    await page.click('[data-ll-pfirst="support"]');
    await page.click('[data-ll-pform="however"]');
    await page.click("[data-ll-wcheck]");
    ok(
      (await page.locator(".cb-weigh-practice .feedback.is-hint").count()) === 1 &&
        (await ledger(page)).at(-1)?.m?.ok === 0,
      "the weigh task records a try that puts the weight on the other side",
    );
    await page.click('[data-ll-pfirst="counter"]');
    await page.click("[data-ll-wcheck]");
    ok(
      (await page.locator(".cb-weigh-practice .feedback.is-right").count()) === 1,
      "swapping the ideas gives your evidence the weight",
    );
    await axe(page, "bridge practice with hints");

    await go(page, "connector-bridge", 5);
    await page.fill(
      "[data-ll-transfer]",
      "Phones help me learn new words, however they can distract me during class.",
    );
    await page.click("[data-ll-check-transfer]");
    ok(
      (await page.locator(".ll-transfer .cb-done .cb-mini").count()) === 1,
      "the new task shows the bridge the learner built",
    );
    await page.context().close();
  }

  // ── Paragraph X-Ray ────────────────────────────────────────────────────────
  {
    const page = await newPage();
    await go(page, "paragraph-xray", 2);
    ok(
      (await page.locator(".ll-para.is-xray mark.ll-conn").count()) >= 3,
      "X-ray marks connectors by default",
    );
    await page.click('[data-ll-lens="topic"]');
    const states = await page
      .locator(".xr-band")
      .evaluateAll((els) => els.map((e) => e.dataset.state));
    ok(
      states[0] === "lit" && states.slice(1).every((s) => s === "dim"),
      "the Topic lens lights one layer and fades the rest",
    );
    await page.keyboard.press("7");
    ok(
      (await page.locator(".ll-para").getAttribute("data-lens")) === "links" &&
        (await page.locator(".xr-refs").first().isVisible()),
      "the Links lens shows pointing words",
    );
    await page.keyboard.press("1");
    ok(
      !(await page.locator(".ll-para").evaluate((e) => e.classList.contains("is-xray"))),
      "the Plain lens removes the X-ray",
    );
    await page.keyboard.press("2");
    await page.locator('[data-ll-inspect="1"]').click();
    ok(
      /For example/.test(await text(page, "[data-xr-insp]")) &&
        (await page.locator('.xr-band.is-active [data-ll-inspect="1"]').count()) === 1,
      "selecting a sentence inspects its job",
    );
    await page.keyboard.press("ArrowDown");
    ok(/In addition/.test(await text(page, "[data-xr-insp]")), "arrow keys move the inspector");
    ok(
      (await page.locator("[data-ll-discover]").count()) === 1,
      "the discovery unlocks after lenses and sentences were tried",
    );
    await axe(page, "xray explore, all layers");
    await page.click('[data-ll-lens="links"]');
    await axe(page, "xray explore, links lens");
    await page.click('[data-ll-lens="explain"]');
    await axe(page, "xray explore, explanation lens");

    await go(page, "paragraph-xray", 3);
    await page.click("[data-ll-guided]");
    ok(
      (await page.locator('.xr-band[data-state="lit"]').count()) === 2,
      "the think-aloud lights one more layer with each step",
    );

    await go(page, "paragraph-xray", 4);
    const order = async () => page.locator(".xr-order li > span:first-child").allInnerTexts();
    const start = await order();
    await page.locator('[data-ll-grab="1"]').focus();
    await page.keyboard.press("ArrowUp");
    const after = await order();
    ok(
      after[0] === start[1] && after[1] === start[0],
      "arrow keys on the drag handle move a sentence",
    );
    ok(
      await page.evaluate(() => document.activeElement?.matches('[data-ll-grab="0"]')),
      "focus follows the moved sentence",
    );
    const handle = page.locator('[data-ll-grab="4"]');
    const target = page.locator(".xr-order li").first();
    const hb = await handle.boundingBox();
    const tb = await target.boundingBox();
    const dragged = (await order())[4];
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x + hb.width / 2, tb.y + 4, { steps: 8 });
    await page.mouse.up();
    ok((await order())[0] === dragged, "dragging a handle moves a sentence to the top");
    await page.click("[data-ll-skel]");
    ok(
      (await page.locator(".xr-order .xr-slot-tag").count()) === 5,
      "the skeleton shows each slot's job",
    );
    await axe(page, "xray practice with skeleton");
    // rebuild
    await page.click('[data-ll-card="5"]');
    await page.click('[data-ll-slot="4"]');
    for (const i of [0, 1, 2, 3]) {
      await page.click(`[data-ll-card="${i}"]`);
      await page.click(`[data-ll-slot="${i}"]`);
    }
    await page.click("[data-ll-check-rebuild]");
    ok(
      /pizza|lunch|start times/i.test(await text(page, ".xr-rebuild .xr-slot-row.is-no .xr-why")) &&
        (await page.locator(".xr-rebuild .feedback.is-hint").count()) === 1,
      "a card that does not belong is named, not just marked wrong",
    );
    await page.click('[data-ll-slot="4"]');
    await page.click('[data-ll-card="4"]');
    await page.click('[data-ll-slot="4"]');
    await page.click("[data-ll-check-rebuild]");
    ok(
      (await page.locator(".xr-rebuild .feedback.is-right").count()) === 1,
      "rebuilding the paragraph is recognized",
    );
    const rec = (await ledger(page)).filter((x) => x.task === "xray-rebuild-6-8");
    ok(
      rec.length === 2 && rec[0].kind === "first" && rec[1].kind === "revision",
      "each full rebuild check is a ledger entry (first, then revision)",
    );
    await axe(page, "xray practice after rebuild");

    await go(page, "paragraph-xray", 5);
    await page.fill(
      "[data-ll-transfer]",
      "Phones should be allowed at lunch. First, lunch is a break. Also, students can talk to family, so they feel calm. That is why phones help.",
    );
    await page.click("[data-ll-check-transfer]");
    ok(
      (await page.locator(".xr-meter span.is-on").count()) >= 3,
      "the new task shows which layers the paragraph has",
    );
    await page.context().close();
  }

  // ── reduced motion ─────────────────────────────────────────────────────────
  {
    const page = await newPage({ width: 1366, height: 900 }, { reducedMotion: "reduce" });
    await go(page, "verb-time-machine", 2);
    const still = await page.evaluate(() => {
      const ev = getComputedStyle(document.querySelector(".vm-ev"));
      const pulse = getComputedStyle(document.querySelector(".vm-pulse"));
      const pod = getComputedStyle(document.querySelector(".vm-pod"));
      return [ev.transitionDuration, pulse.animationName, pod.transitionDuration];
    });
    ok(
      still.every((v) => /^((0|1e-05)s|none)(, (0|1e-05)s)*$/.test(v)),
      `reduced motion: no transitions or animation (${still.join(" | ")})`,
    );
    await go(page, "connector-bridge", 2);
    await page.click('[data-ll-connector="so"]');
    ok(
      (await page.evaluate(
        () => getComputedStyle(document.querySelector(".cb-scene .cb-svg g")).animationName,
      )) === "none",
      "reduced motion: the bridge is not animated",
    );
    await page.context().close();
  }

  // ── accessibility at every step, both bands, EN and EN+ES ─────────────────
  {
    const page = await newPage();
    for (const [band, lang] of [
      ["6-8", "en"],
      ["3-5", "bi"],
      ["3-5", "es"],
    ])
      for (const lab of LABS)
        for (const step of [1, 2, 3, 4, 5]) {
          await go(page, lab, step, band, lang);
          if (step === 3) await page.click("[data-ll-guided]");
          if (lab === "connector-bridge" && step === 2)
            await page.click('[data-ll-connector="so"]');
          if (lab === "verb-time-machine" && step === 4)
            await page.click(`[data-ll-hint="vt-${band === "3-5" ? 35 : 68}-1"]`);
          if (step === 5) {
            await page.fill("[data-ll-transfer]", "I like school. I read. We play.");
            await page.click("[data-ll-check-transfer]");
          }
          await axe(page, `${lab} step ${step} ${band} ${lang}`);
        }
    await page.context().close();
  }

  // ── layout: no sideways scroll, 44px targets ──────────────────────────────
  for (const [w, h, touch] of [
    [1366, 768, false],
    [768, 1024, true],
    [390, 844, true],
  ]) {
    const page = await newPage({ width: w, height: h }, { hasTouch: touch, isMobile: w < 600 });
    for (const lab of LABS)
      for (const step of [1, 2, 3, 4, 5]) {
        await go(page, lab, step, "6-8", "bi");
        if (step === 3) await page.click("[data-ll-guided]");
        const r = await page.evaluate(() => {
          const over = document.documentElement.scrollWidth - window.innerWidth;
          const small = [
            ...document.querySelectorAll(
              ".ll-lab button, .ll-lab select, .ll-lab input:not([type=hidden]), .ll-lab textarea, .ll-steps a",
            ),
          ]
            .filter((el) => el.offsetParent && !el.closest("details:not([open]) > :not(summary)"))
            .map((el) => ({ el, b: el.getBoundingClientRect() }))
            .filter(({ b }) => b.height > 0 && b.height < 43.5)
            .map(
              ({ el }) =>
                `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(" ")[0]}` : ""}`,
            );
          return { over, small: [...new Set(small)] };
        });
        ok(r.over <= 1, `${w}px ${lab} step ${step}: no sideways scroll (${r.over}px)`);
        ok(
          r.small.length === 0,
          `${w}px ${lab} step ${step}: targets are at least 44px tall ${r.small.join(" ")}`,
        );
      }
    await page.context().close();
  }
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length
    ? `\naccess-labs-interactive-e2e: ${failures.length} FAILED`
    : "\naccess-labs-interactive-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
