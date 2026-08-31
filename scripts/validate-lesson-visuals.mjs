#!/usr/bin/env node
/**
 * Gate: every interactive visual a lesson declares must actually RENDER.
 *
 * Why this exists. `mountInteractiveVisuals` stamps `data-iv-mounted="1"` BEFORE
 * it runs the component factory, and swallows a factory throw with a
 * `console.warn` so one bad manipulative can never break the lesson. That is the
 * right runtime behaviour and a terrible testing signal: a host can carry the
 * mounted flag and still be an empty box. An unknown `kind` is quieter still —
 * REGISTRY misses return early, so the host gets no flag, no warning, and no
 * content. Either way the page is 200 OK, console-clean, and silently missing
 * the thing the lesson is built around.
 *
 * That class already shipped twice: the homework lesson model was dead on all 74
 * pages (a same-named stub clobbered the built bundle), and game-fx.js shipped
 * truncated across ~114 games. Both were invisible to every source-level gate,
 * because the source was fine — only the rendered page was wrong.
 *
 * So this drives a real browser: boot the lesson, walk every phase via the
 * `rma:navigate` event the sidebar uses, and assert each host rendered real
 * interactive content. Reading the source cannot answer this question.
 *
 *   node scripts/validate-lesson-visuals.mjs [--base URL] [--sample N]
 *                                            [--concurrency N] [--lesson ID]
 *
 * Defaults to http://localhost:4499 — run `npm run preview -- --port 4499` first,
 * or point --base at production. Never point it at production casually: booting a
 * lesson satisfies the identity gate and can emit student telemetry.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const root = join(import.meta.dirname, "..");
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("--base", "http://localhost:4499").replace(/\/$/, "");
const ONLY = arg("--lesson");
const SAMPLE = Number(arg("--sample", "0")) || 0;
const CONCURRENCY = Number(arg("--concurrency", "4")) || 4;
const PHASE_COUNT = 8; // Warmup, Objectives, Launch, Explore, Practice, Connect, Reflect, Objectives
// Apply Day declares its own three (see bootPartTwo's phaseMeta).
const PHASE_COUNT_BY_RENDERER = { "part-two": 3 };
const phaseCountFor = (renderer) => PHASE_COUNT_BY_RENDERER[renderer] ?? PHASE_COUNT;
// A paced Learn It panel shows one line per click; no authored example runs
// anywhere near this many, so the cap only stops a runaway, never a real walk.
const PACE_CLICK_LIMIT = 40;

/**
 * A host is HEALTHY only if it rendered something a student can actually see or
 * touch. The mounted flag alone proves only that mounting was ATTEMPTED.
 */
function classifyHost(h) {
  if (!h.mountedFlag) return "unknown-kind"; // REGISTRY miss — returned before flagging
  if (!h.hasContent) return "empty"; // factory threw, or rendered nothing
  return "ok";
}

/**
 * A verdict for a KIND, from every sighting of it in one lesson.
 *
 * classifyHost judges a single sighting, and a single sighting is not enough to
 * convict: every REGISTRY entry is an `async` factory that dynamic-imports its
 * component, so on the first visit to a phase a host can be collected after
 * mountInteractiveVisuals() found it but before the chunk resolved and the flag
 * landed. That reads as `unknown-kind` — indistinguishable from a real miss.
 *
 * The distinguishing fact is that a REGISTRY miss returns early EVERY time. It
 * can never mount, on any phase, on any visit. So a kind that carries the flag
 * at even one sighting is registered, and a kind that rendered content at even
 * one sighting reaches the student. Judging the kind across all of its sightings
 * is therefore exactly as strong for the defect this gate exists to catch, and
 * silent about the hydration race that is not a defect at all.
 *
 * Measured: this was condemning `tape-diagram` on 3-1 and `long-division-builder`
 * on 2-6 — both verified rendering, with 4 and 28 live controls — as part of 237
 * findings on a fleet run that also found 1,639 healthy host renders.
 */
function classifyKind(sightings) {
  if (sightings.some((h) => h.mountedFlag && h.hasContent)) return "ok";
  if (sightings.some((h) => h.mountedFlag)) return "empty";
  return "unknown-kind";
}

function selfTest() {
  const kindCases = [
    ["mounted with content anywhere is ok", [{ mountedFlag: true, hasContent: true }], "ok"],
    [
      "unflagged first, healthy later, is the hydration race — not a miss",
      [
        { mountedFlag: false, hasContent: false },
        { mountedFlag: true, hasContent: true },
      ],
      "ok",
    ],
    [
      "never flagged on any sighting is a real REGISTRY miss",
      [
        { mountedFlag: false, hasContent: false },
        { mountedFlag: false, hasContent: false },
      ],
      "unknown-kind",
    ],
    [
      "flagged everywhere but never any content is still empty",
      [
        { mountedFlag: true, hasContent: false },
        { mountedFlag: true, hasContent: false },
      ],
      "empty",
    ],
  ];
  const badKinds = kindCases.filter(([, input, want]) => classifyKind(input) !== want);
  if (badKinds.length) {
    console.error(`classifyKind self-test: ${badKinds.length} FAILED`);
    for (const [name, input, want] of badKinds) {
      console.error(`  ✗ ${name}: expected ${want}, got ${classifyKind(input)}`);
    }
    process.exit(1);
  }

  const cases = [
    ["rendered widget is ok", { mountedFlag: true, hasContent: true }, "ok"],
    ["flagged but empty is a failure", { mountedFlag: true, hasContent: false }, "empty"],
    [
      "no flag means the kind is not in the REGISTRY",
      { mountedFlag: false, hasContent: false },
      "unknown-kind",
    ],
    // Guard the trap directly: content without the flag is still a REGISTRY miss,
    // because something else (a fallback SVG) put that content there.
    [
      "content without a flag is still unknown-kind",
      { mountedFlag: false, hasContent: true },
      "unknown-kind",
    ],
  ];
  const bad = cases.filter(([, input, want]) => classifyHost(input) !== want);
  if (bad.length) {
    console.error(`classifyHost self-test: ${bad.length} FAILED`);
    for (const [name, input, want] of bad) {
      console.error(`  ✗ ${name}: expected ${want}, got ${classifyHost(input)}`);
    }
    process.exit(1);
  }

  // declaredKinds must find visuals wherever lessons actually put them, and must
  // not mistake a problem's `kind` ("multiple-choice") for a diagram.
  const dkCases = [
    ["explore.diagram", { explore: { diagram: { kind: "area-morph" } } }, ["area-morph"]],
    ["launch.visual", { launch: { visual: { kind: "solid-3d" } } }, ["solid-3d"]],
    [
      "per-problem diagrams in an array",
      { practice: { problems: [{ kind: "multiple-choice", diagram: { kind: "number-line" } }] } },
      ["number-line"],
    ],
    [
      "a problem kind is not a visual",
      { practice: { problems: [{ kind: "multiple-choice" }] } },
      [],
    ],
    ["no visuals at all", { title: "x" }, []],
  ];
  const dkBad = dkCases.filter(
    ([, cfg, want]) =>
      JSON.stringify(
        declaredKinds(cfg)
          .map((d) => d.kind)
          .sort(),
      ) !== JSON.stringify([...want].sort()),
  );
  if (dkBad.length) {
    console.error(`declaredKinds self-test: ${dkBad.length} FAILED`);
    for (const [name, cfg, want] of dkBad) {
      console.error(
        `  ✗ ${name}: expected ${JSON.stringify(want)}, got ${JSON.stringify(declaredKinds(cfg).map((d) => d.kind))}`,
      );
    }
    process.exit(1);
  }
  console.log(`self-test: ${cases.length + dkCases.length} passed, 0 failed`);
}

/**
 * Three different renderers live under lessons/, and each needs a different way
 * in. Probing them all as if they were the core lesson app reports ~150 bogus
 * "never booted" failures and takes 20 minutes doing it.
 *
 *   bootLesson      — core app. Identity gate (#id-start stays disabled until
 *                     #id-name is filled), then 8 phases behind rma:navigate.
 *   bootSmallGroup  — renders its whole lesson on one page. No gate, no nav.
 *   bootFlagship    — themed landing screen; content is behind "Enter the …".
 */
/**
 * Static layer: a kind the renderer has never heard of emits NO host at all.
 *
 * This is the half a browser cannot see. `buildVisual()` switches on `kind`; an
 * unrecognised one falls through and returns nothing, so there is no element to
 * find, no flag to check, and no warning to log — the lesson just quietly loses
 * its diagram and the render sweep reports a clean site. Verified by injecting a
 * bogus kind: the browser pass alone passed it.
 *
 * So parse the two sources of truth and compare them against what lessons ask
 * for. Parsing beats importing here — lesson-renderer.js pulls in the whole
 * engine (CSS, DOM globals) and neither list is exported.
 */
function parseKnownKinds() {
  const rendererSrc = readFileSync(join(root, "engine/core/lesson-renderer.js"), "utf8");
  const start = rendererSrc.indexOf("function buildVisual(");
  if (start < 0)
    throw new Error("buildVisual() not found in lesson-renderer.js — update this parser");
  let depth = 0;
  let open = rendererSrc.indexOf("{", start);
  let end = -1;
  for (let i = open; i < rendererSrc.length; i++) {
    if (rendererSrc[i] === "{") depth++;
    else if (rendererSrc[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  // Only buildVisual's switch cases become interactiveVisualHost mount points,
  // so only THEY require a REGISTRY entry.
  const hostKinds = new Set(
    [...rendererSrc.slice(open, end).matchAll(/case "([^"]+)"/g)].map((m) => m[1]),
  );
  // buildVisual's switch is not the only render path. Some kinds are handled by
  // an explicit comparison elsewhere in the renderer (e.g. `data-chips` at
  // renderLaunchPhase) and emit their own markup — renderable, but never a mount
  // host, so demanding a REGISTRY entry for them condemns working visuals.
  const selfRendered = new Set(
    [...rendererSrc.matchAll(/\.kind === "([a-z0-9-]+)"/g)].map((m) => m[1]),
  );
  const buildable = new Set([...hostKinds, ...selfRendered]);

  const ivSrc = readFileSync(join(root, "engine/core/interactive-visual.js"), "utf8");
  const regStart = ivSrc.indexOf("const REGISTRY = {");
  if (regStart < 0)
    throw new Error("REGISTRY not found in interactive-visual.js — update this parser");
  depth = 0;
  open = ivSrc.indexOf("{", regStart);
  end = -1;
  for (let i = open; i < ivSrc.length; i++) {
    if (ivSrc[i] === "{") depth++;
    else if (ivSrc[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  // Keys are a mix of quoted and bare identifiers ("dot-plot" vs histogram) —
  // matching only quoted ones silently drops histogram and condemns every lesson
  // that uses it.
  const registry = new Set(
    [...ivSrc.slice(open, end).matchAll(/^\s{2}"?([a-zA-Z0-9-]+)"?:\s*(?:async\s*)?\(/gm)].map(
      (m) => m[1],
    ),
  );

  if (buildable.size < 10 || registry.size < 10) {
    throw new Error(
      `kind parser returned implausible results (buildVisual=${buildable.size}, REGISTRY=${registry.size}) — ` +
        "the engine moved and this check would silently pass everything",
    );
  }
  return { buildable, hostKinds, registry };
}

/** Every `kind` a lesson config asks to be drawn, with the path that declared it. */
function declaredKinds(config) {
  const out = [];
  const VISUAL_SLOTS = new Set(["diagram", "visual", "lab", "figure"]);
  const walk = (node, path, inVisualSlot) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`, inVisualSlot));
      return;
    }
    if (inVisualSlot && typeof node.kind === "string") out.push({ kind: node.kind, path });
    for (const [k, v] of Object.entries(node))
      walk(v, path ? `${path}.${k}` : k, VISUAL_SLOTS.has(k));
  };
  walk(config, "", false);
  return out;
}

function rendererFor(id) {
  const entry = join(root, "lessons", id, "lesson.js");
  if (!existsSync(entry)) return "unknown";
  const src = readFileSync(entry, "utf8");
  if (src.includes("bootSmallGroup")) return "small-group";
  if (src.includes("bootFlagship")) return "flagship";
  // Apply Day. bootPartTwo goes through the same createApp as bootLesson, so it
  // takes the identical identity-gate-then-rma:navigate walk — it just declares
  // three phases (Warm-Up, Today's Problem, Group Work) instead of eight. It was
  // absent here, so all 76 Apply Day pages resolved to "unknown" and were
  // reported as "did not boot" — 152 findings for pages nothing had looked at.
  if (src.includes("bootPartTwo")) return "part-two";
  if (src.includes("bootLesson")) return "core";
  return "unknown";
}

function lessonIds() {
  if (ONLY) return [ONLY];
  const dir = join(root, "lessons");
  let ids = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .filter((d) => existsSync(join(dir, d.name, "index.html")))
    .map((d) => d.name)
    .sort();
  if (SAMPLE) {
    // Even stride so a sample spans units rather than clustering on unit 1.
    const step = Math.max(1, Math.floor(ids.length / SAMPLE));
    ids = ids.filter((_, i) => i % step === 0).slice(0, SAMPLE);
  }
  return ids;
}

const collectHosts = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".interactive-visual[data-visual]")].map((el) => ({
      kind: el.dataset.visual || "(none)",
      mountedFlag: el.dataset.ivMounted === "1",
      // Real, student-facing output — not just any child node.
      hasContent: !!el.querySelector("svg, canvas, input, button, select, model-viewer"),
      // A tool can render perfectly and still be broken. /lessons/2-11/ mounted
      // the Decimal Columns lab with no operands, so Number(undefined) became
      // NaN and the digit cells spelled "N a N" down the column — a host that
      // rendered, was interactive, and passed every check we had. Anything that
      // printed NaN, undefined or null where a number belongs is a dead tool.
      junk: (() => {
        const txt = (el.innerText || "").replace(/\s+/g, " ");
        const hit = txt.match(/\b(NaN|undefined|null|Infinity)\b/);
        // Digit-cell layouts split the string one character per box, so the
        // word arrives spaced out ("N a N"); catch that spelling too.
        const spaced = txt.match(/\bN a N\b|\bu n d e f i n e d\b/i);
        return hit ? hit[1] : spaced ? spaced[0] : null;
      })(),
    })),
  );

/** Boot one lesson the way its renderer requires, and collect what rendered. */
async function probeLesson(browser, id) {
  const renderer = rendererFor(id);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const mountWarnings = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (/interactive-visual: failed to mount/i.test(m.text()))
      mountWarnings.push(m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 160)));

  const hosts = [];
  const push = (found, phase) => found.forEach((h) => hosts.push({ ...h, phase }));
  let booted = false;
  try {
    await page.goto(`${BASE}/lessons/${id}/`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(600);

    if (renderer === "small-group") {
      // Whole lesson renders on one page — nothing to navigate.
      booted = true;
      await page.waitForTimeout(1200);
      push(await collectHosts(page), 0);
    } else if (renderer === "core" || renderer === "flagship" || renderer === "part-two") {
      // A flagship is the CORE app wrapped in a themed mission intro
      // (engine/templates/flagship/flagship.js imports bootLesson), so it needs
      // the entry click FIRST and then the identical core flow. Every flagship
      // themes its own entry verb ("Enter the Kitchen", "Board the Station",
      // "Set Sail") — match the class, never the text.
      if (renderer === "flagship") {
        const enter = page.locator(".flagship-mission-start").first();
        if (!(await enter.count())) {
          await page.close();
          return {
            id,
            renderer,
            booted: false,
            hosts,
            mountWarnings,
            pageErrors,
            error: "no .flagship-mission-start entry control",
          };
        }
        await enter.click({ timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(2000);
      }
      // Identity gate: #id-start stays disabled until a name is present.
      await page
        .locator("#id-name")
        .fill("QA Probe")
        .catch(() => {});
      await page
        .locator("#id-period")
        .fill("3")
        .catch(() => {});
      await page.waitForTimeout(250);
      const start = page.locator("#id-start");
      if (await start.count()) {
        if (await start.isEnabled().catch(() => false)) {
          await start.click({ timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(1500);
        }
      }
      booted = await page.evaluate(() => !!window.__ntLessonClearApi);
      if (!booted) {
        await page.close();
        return { id, renderer, booted: false, hosts, mountWarnings, pageErrors };
      }
      for (let phase = 0; phase < phaseCountFor(renderer); phase++) {
        await page.evaluate(() => {
          const wrap = document.querySelector(".nt-nb");
          if (wrap) {
            const check = wrap.querySelector(".nt-nb-check");
            const input = wrap.querySelector(".nt-nb-input");
            if (check && !check.checked) {
              check.checked = true;
              check.dispatchEvent(new Event("change", { bubbles: true }));
            }
            if (input) {
              input.value = "QA Checkpoint Note";
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        });
        await page.evaluate(
          (ph) =>
            document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: ph } })),
          phase,
        );
        await page.waitForTimeout(1100);
        push(await collectHosts(page), phase);
      }
      // The eight graded phases are not the whole lesson. The Learn It tab mounts
      // its OWN interactive visual, chosen by resolveInteractiveVisual() rather
      // than authored in the config — and because this walk stopped at the phases,
      // that tool went unchecked. It is where /lessons/2-11/ was serving a Decimal
      // Columns lab with no operands, printing "N a N" down the column while this
      // gate reported the whole site clean.
      for (const kind of ["vocab", "learn"]) {
        await page.evaluate(
          (k) => document.dispatchEvent(new CustomEvent("rma:openextra", { detail: { kind: k } })),
          kind,
        );
        await page.waitForTimeout(1400);
        // Opening the tab is not reaching the tool. The Learn It panel paces its
        // worked example one line at a time, and vocab-learn-panel.js only calls
        // mountInteractiveVisuals() from the wirePaced() completion callback —
        // until every line is shown, the host sits in .vl-hidden with no mount
        // flag, which reads exactly like a REGISTRY miss. Snapshotting here
        // condemned 60 lessons whose tools mount perfectly once paced. Walk the
        // panel to its end the way a student does, THEN collect.
        for (let guard = 0; guard < PACE_CLICK_LIMIT; guard++) {
          const advanced = await page.evaluate(() => {
            const live = (el) =>
              el instanceof HTMLElement &&
              !!el.getClientRects().length &&
              !el.hasAttribute("disabled");
            const all = [...document.querySelectorAll(".vl-pace-all")].find(live);
            if (all) return all.click(), true;
            const next = [...document.querySelectorAll(".vl-pace-next")].find(live);
            if (next) return next.click(), true;
            // The paced lines live inside ONE step of the panel; the tool step
            // is only built once the panel is advanced to it. Own controls only
            // (.vl-*), never a generic "Next" that would drive the lesson.
            const step = [...document.querySelectorAll(".vl-next-btn, .vl-continue-btn")].find(
              live,
            );
            if (step) return step.click(), true;
            return false;
          });
          if (!advanced) break;
          await page.waitForTimeout(350);
        }
        await page.waitForTimeout(600);
        push(await collectHosts(page), `tab:${kind}`);
      }
    } else {
      await page.close();
      return {
        id,
        renderer,
        booted: false,
        hosts,
        mountWarnings,
        pageErrors,
        error: "unknown renderer",
      };
    }
  } catch (err) {
    await page.close();
    return {
      id,
      renderer,
      booted,
      hosts,
      mountWarnings,
      pageErrors,
      error: err.message.slice(0, 120),
    };
  }
  await page.close();
  return { id, renderer, booted, hosts, mountWarnings, pageErrors };
}

async function runPool(ids, browser) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, ids.length) }, async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      results.push(await probeLesson(browser, id));
      process.stdout.write(".");
    }
  });
  await Promise.all(workers);
  return results;
}

selfTest();

const ids = lessonIds();

// ── Static pass: declared kinds must be renderable, and interactive kinds must
// be in the REGISTRY. Catches the "no host is ever emitted" case the browser
// pass is structurally blind to.
const { buildable, hostKinds, registry } = parseKnownKinds();
console.log(`Known kinds: ${buildable.size} renderable, ${registry.size} in REGISTRY`);
const staticFailures = [];
for (const id of ids) {
  // Core-app lessons only. Small-group lessons render their visuals through
  // engine/core/small-group-visual-practice.js, which dispatches on its own
  // substring-matched kinds (factor-table, multiple-lanes, …) and shares nothing
  // with buildVisual(). Judging them by the core switch reports ~1,600 defects
  // that are all fine.
  if (rendererFor(id) === "small-group") continue;
  const cfgPath = join(root, "lessons", id, "config.json");
  if (!existsSync(cfgPath)) continue;
  let config;
  try {
    config = JSON.parse(readFileSync(cfgPath, "utf8"));
  } catch (err) {
    staticFailures.push(`${id}: config.json is not valid JSON — ${err.message.slice(0, 60)}`);
    continue;
  }
  for (const { kind, path } of declaredKinds(config)) {
    if (!buildable.has(kind)) {
      staticFailures.push(
        `${id}: ${path}.kind = "${kind}" — buildVisual() has no case for it, so NOTHING renders`,
      );
    } else if (hostKinds.has(kind) && !registry.has(kind) && kind !== "manip") {
      // A buildVisual case emits an interactive host; without a REGISTRY entry
      // that host is mounted by nobody and stays an empty box forever.
      staticFailures.push(
        `${id}: ${path}.kind = "${kind}" is renderable but missing from the interactive-visual REGISTRY`,
      );
    }
  }
}
if (staticFailures.length) {
  console.error(`\n✗ ${staticFailures.length} declared visual(s) that cannot render:\n`);
  for (const f of staticFailures.slice(0, 40)) console.error(`  ${f}`);
  if (staticFailures.length > 40) console.error(`  ...and ${staticFailures.length - 40} more`);
  process.exit(1);
}
console.log(`Static: every declared visual kind is renderable and registered.`);

// --static-only stops here: no browser, no preview server, milliseconds. The
// static half catches the "registered but unrenderable" class on its own —
// net-folder sat in the REGISTRY with no buildVisual case, so every lesson that
// authored it as a `diagram` rendered nothing under the full renderer. That is
// a source-only defect and does not need a browser to see, which is why
// tools/lesson-visuals-static.test.mjs runs this path on every `npm test`
// while the full probe stays weekly.
if (process.argv.includes("--static-only")) process.exit(0);

console.log(`Probing ${ids.length} lesson(s) at ${BASE} (concurrency ${CONCURRENCY})`);

// PW_CHROMIUM_PATH: point at a system Chromium when the Playwright-managed
// download is missing/version-mismatched (e.g. sandboxed CI containers). Same
// override tools/smoke-lesson-boot.mjs takes — without it this gate cannot run
// wherever Playwright's own build number does not match what is on disk, and a
// gate that cannot open a browser probes nothing.
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const results = await runPool(ids, browser);
await browser.close();
console.log("");

const failures = [];
let totalHosts = 0;
let bootFailures = 0;

for (const r of results.sort((a, b) => a.id.localeCompare(b.id))) {
  if (r.error) failures.push(`${r.id}: probe error — ${r.error}`);
  if (!r.booted) {
    bootFailures++;
    const why = {
      core: "core lesson app never booted (no __ntLessonClearApi after the identity gate)",
      flagship:
        "flagship never opened its mission (content did not grow after .flagship-mission-start)",
      "small-group": "small-group lesson never rendered",
      "part-two": "Apply Day app never booted (no __ntLessonClearApi after the identity gate)",
    };
    failures.push(`${r.id} [${r.renderer}]: ${why[r.renderer] || "did not boot"}`);
    continue;
  }
  totalHosts += r.hosts.length;
  // The same host is seen once per phase visit, and one bad sighting does not
  // convict a kind — see classifyKind. Judge each kind on all of its sightings.
  const seen = new Set();
  const byKind = new Map();
  for (const h of r.hosts) {
    if (!byKind.has(h.kind)) byKind.set(h.kind, []);
    byKind.get(h.kind).push(h);
  }
  for (const [kind, sightings] of byKind) {
    const verdict = classifyKind(sightings);
    if (verdict === "ok") continue;
    seen.add(`${kind}:${verdict}`);
    // Name a phase where it actually went wrong, not merely the first visit.
    const worst = sightings.find((h) => classifyHost(h) === verdict) || sightings[0];
    failures.push(
      verdict === "unknown-kind"
        ? `${r.id}: "${kind}" is not in the interactive-visual REGISTRY — renders nothing (phase ${worst.phase})`
        : `${r.id}: "${kind}" mounted but rendered no content (phase ${worst.phase})`,
    );
  }
  for (const h of r.hosts) {
    if (!h.junk) continue;
    const key = `junk:${h.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    failures.push(
      `${r.id}: "${h.kind}" printed ${h.junk} to the student (phase ${h.phase}) — the tool rendered but its numbers are missing`,
    );
  }
  for (const w of [...new Set(r.mountWarnings)]) failures.push(`${r.id}: ${w}`);
  for (const e of [...new Set(r.pageErrors)]) failures.push(`${r.id}: uncaught — ${e}`);
}

/**
 * Coverage floor. A probe that navigates nowhere reports a perfectly clean site,
 * which is exactly how a shallow sweep of these pages "passed" while checking
 * launcher screens that contain no visuals at all. Finding nothing is a probe
 * failure until proven otherwise.
 */
const lessonsWithHosts = results.filter((r) => r.hosts.length > 0).length;
if (totalHosts === 0) {
  console.error(
    "\n✗ COVERAGE FAILURE — probed every lesson and found zero interactive hosts.\n" +
      "  That means this gate is not reaching lesson content, not that the site is clean.\n" +
      "  Check the identity gate, the rma:navigate contract, and --base.",
  );
  process.exit(1);
}

console.log(`Booted ${results.length - bootFailures}/${results.length} lessons`);
console.log(`Found ${totalHosts} interactive host render(s) across ${lessonsWithHosts} lesson(s)`);

/**
 * Per-renderer coverage. The global floor above only catches a total blackout;
 * one FAMILY going dark (a changed identity gate, a renamed entry button) would
 * still leave a healthy-looking total from the other two.
 */
const families = [...new Set(results.map((r) => r.renderer))].sort();
for (const fam of families) {
  const rs = results.filter((r) => r.renderer === fam);
  const withHosts = rs.filter((r) => r.hosts.length > 0).length;
  const booted = rs.filter((r) => r.booted).length;
  console.log(
    `  ${fam.padEnd(12)} ${rs.length} lesson(s), ${booted} booted, ${withHosts} with visuals`,
  );
  if (booted === 0) {
    failures.push(
      `renderer "${fam}": 0 of ${rs.length} lessons booted — the probe cannot reach this family`,
    );
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s):\n`);
  for (const f of failures.slice(0, 60)) console.error(`  ${f}`);
  if (failures.length > 60) console.error(`  ...and ${failures.length - 60} more`);
  process.exit(1);
}

console.log("\n✓ Every interactive visual that rendered is live and interactive.");
