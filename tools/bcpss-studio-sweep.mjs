#!/usr/bin/env node
// bcpss-studio-sweep — every Language Studio activity screen, in a real browser.
//
// Sweeps all 162 BCPSS units x 3 WIDA bands x every activity x 3 viewports (1366, 768, 360). The source tree is
// served on a loopback port together with GET /api/bcpss/units/<id> (functions/_lib/bcpss/db.js getUnitDetail,
// fallback-seed backend: no D1, no network). Per screen it asserts:
//   - no console or page errors (the source-tree-only `web-vitals` specifier and hashed font 404s are ignored)
//   - the activity stage rendered (kind mounted, no placeholder card)
//   - no horizontal overflow
//   - no visible control smaller than 44 x 44 CSS px (WCAG 2.2 target size, taken literally)
//   - no visible text under 14px
//   - a language goal ("Language goal" function + "I can" line) is present
//   - a student-controlled hint ladder (kit.hints / hintLadder) and the How to play steps are on the screen
//   - the "Part of lesson" chips are exactly the lessons the activity is linked to in the API data
//   - no empty or duplicate prompts (checked on the authored payload, once per unit and band-independent)
// A sweep that covered fewer screens than it planned, or fewer than data/sweep-floors.json pins, fails.
//
//   node tools/bcpss-studio-sweep.mjs                         # the full contract
//   node tools/bcpss-studio-sweep.mjs --units=g6-math-u1 --viewports=360 --levels=l1_2   # partial (no floor)
//   node tools/bcpss-studio-sweep.mjs --readable              # the whole contract with the easy-read option on
//   SWEEP_GUARD_FORCE_EMPTY=validate:bcpss-studio-sweep node tools/bcpss-studio-sweep.mjs   # must exit 1
import { cpus } from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { startStudioServer } from "./lib/bcpss-studio-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ID = "validate:bcpss-studio-sweep";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STUDIO = "/bcpss-teachers/language-studio/";
const MIN_TARGET = 44;
const MIN_TEXT = 14;
const ALL_LEVELS = ["l1_2", "l3_4", "l5_6"];
const ALL_VIEWPORTS = [
  { name: "1366", width: 1366, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "360", width: 360, height: 640 },
];

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const csv = (name) => arg(name)?.split(",").filter(Boolean);
const unitFilter = csv("units");
const levels = csv("levels") || ALL_LEVELS;
const viewports = csv("viewports")
  ? ALL_VIEWPORTS.filter((v) => csv("viewports").includes(v.name))
  : ALL_VIEWPORTS;
const readable = process.argv.includes("--readable");
const partial = Boolean(unitFilter || csv("levels") || csv("viewports"));
const workerCount = Number(arg("workers")) || Math.max(2, Math.min(4, cpus().length - 2));

// ---- authored-prompt checks (payload, not DOM) ----
const text = (v) =>
  typeof v === "string"
    ? v
    : Array.isArray(v)
      ? v.map(text).join(" ")
      : v && typeof v === "object"
        ? Object.values(v).map(text).join(" ")
        : "";
const PROMPTS = {
  quiz: (p) => p.items.map((i) => i.q),
  error_analysis: (p) => p.items.map((i) => i.wrong),
  talk_cards: (p) => p.cards.map((c) => c.prompt),
  write_scaffold: (p) => [p.prompt],
  read_annotate: (p) => p.questions.map((q) => q.q),
  sentence_combine: (p) => p.items.map((i) => text(i.sentences)),
  unscramble: (p) => p.items.map((i) => text(i.parts)),
  clue_game: (p) => p.cards.map((c) => c.term),
  info_gap: (p) => [p.goal],
  dictogloss: (p) => [p.text],
  cloze: (p) => [p.text],
  match: (p) => p.pairs.map((x) => x.l),
  word_sort: (p) => p.items.map((i) => i.text),
  sequence: (p) => p.steps.map(text),
};
const norm = (s) => text(s).toLowerCase().replace(/\s+/g, " ").trim();

function promptIssues(unitId, activities) {
  const out = [];
  const titles = new Set();
  const missions = new Set();
  activities.forEach((a, n) => {
    const where = `${unitId} a${n + 1} ${a.kind}`;
    for (const [field, seen] of [
      ["title", titles],
      ["mission", missions],
    ]) {
      const v = norm(a[field]);
      if (!v) out.push(`prompt: ${where} has an empty ${field}`);
      else if (seen.has(v))
        out.push(`prompt: ${where} repeats another activity's ${field} in the unit`);
      seen.add(v);
    }
    const extract = PROMPTS[a.kind];
    if (!extract) return out.push(`prompt: ${where} kind has no prompt extractor in this sweep`);
    const list = extract(a.payload || {}).map(norm);
    if (!list.length) out.push(`prompt: ${where} has no prompts`);
    const seen = new Set();
    for (const p of list) {
      if (!p) out.push(`prompt: ${where} has an empty prompt`);
      else if (seen.has(p)) out.push(`prompt: ${where} repeats "${p.slice(0, 40)}"`);
      seen.add(p);
    }
  });
  return out;
}

// ---- in-page inspection (runs in the browser) ----
function inspect({ minTarget, minText, lessons }) {
  const out = [];
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1)
    out.push(`overflow: page is ${de.scrollWidth}px wide in a ${de.clientWidth}px viewport`);
  const name = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : "";
    const label = (el.getAttribute("aria-label") || el.textContent || "")
      .trim()
      .replace(/\s+/g, " ");
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""} "${label.slice(0, 28)}"`;
  };
  const shown = (el) => {
    if (el.closest(".st-sr, .st-skip, [hidden], .sg-ghost, .st-fx")) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return (
      r.width > 1 &&
      r.height > 1 &&
      r.right > 0 &&
      r.bottom > 0 &&
      cs.visibility !== "hidden" &&
      cs.display !== "none"
    );
  };
  const controls =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="radio"]';
  const small = new Set();
  for (const el of document.querySelectorAll(controls)) {
    if (el.disabled || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < minTarget - 0.5 || r.height < minTarget - 0.5)
      small.add(`target: ${name(el)} is ${Math.round(r.width)}x${Math.round(r.height)}px`);
  }
  out.push(...small);
  const tiny = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !el || el.closest("script, style, noscript, svg") || !shown(el))
      continue;
    const px = Number.parseFloat(getComputedStyle(el).fontSize);
    if (px < minText - 0.01) tiny.add(`text: ${name(el)} is ${px}px`);
  }
  out.push(...tiny);
  const goal = (sel) => document.querySelector(sel)?.textContent.trim();
  if (!goal(".st-run__goal-fn") || !goal(".st-run__goal-can"))
    out.push("goal: no language goal on the screen");
  if (!goal(".st-run__mission")) out.push("prompt: the mission line is empty");
  if (!document.querySelector(".sg-hints__btn")) out.push("hints: no hint ladder on the screen");
  if (!document.querySelector(".st-howto")) out.push("clarity: no How to play steps on the screen");
  const chips = [...document.querySelectorAll(".st-run__lessons a")].map((a) =>
    new URL(a.href).searchParams.get("lesson"),
  );
  if (chips.join() !== lessons.join())
    out.push(
      `lessons: chips [${chips.join(", ")}] differ from the linked lessons [${lessons.join(", ")}]`,
    );
  return out;
}

const KNOWN = (msg, url = "") =>
  /web-vitals/.test(msg) || /\.woff2?(\?|$)/.test(url) || /\/assets\/fonts\//.test(url);

async function openViewport(browser, vp) {
  const phone = vp.width <= 600;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: "reduce",
    isMobile: phone,
    hasTouch: phone,
    deviceScaleFactor: 1,
  });
  if (readable)
    await context.addInitScript(() => localStorage.setItem("bcpss-studio:prefs:readable", "true"));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const state = { page, vp, context, errors: [] };
  page.on("pageerror", (e) => {
    if (!KNOWN(e.message)) state.errors.push(`console: page error ${e.message.slice(0, 140)}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !KNOWN(m.text(), m.location().url))
      state.errors.push(`console: ${m.text().slice(0, 140)}`);
  });
  return state;
}

/** Changing band through the header control re-renders in place, which is much cheaper than a page load. */
async function switchLevel(st, level) {
  const i = ALL_LEVELS.indexOf(level);
  await st.page.locator("#stLevel button").nth(i).click();
  await st.page.waitForFunction(
    (k) => document.querySelectorAll("#stLevel button")[k]?.getAttribute("aria-pressed") === "true",
    i,
  );
}

async function navigate(st, origin, unitId, level, n, load) {
  if (load)
    await st.page.goto(`${origin}${STUDIO}?unit=${unitId}&a=${n}&level=${level}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  else
    await st.page.evaluate(
      ([u, l, i]) => {
        history.pushState(null, "", `?unit=${u}&a=${i}&level=${l}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
      [unitId, level, n],
    );
}

/** One attempt at one screen. Returns { stage, found }: `stage` is set when the screen never rendered. */
async function tryScreen(st, origin, unitId, level, a, n, load) {
  st.errors.length = 0;
  try {
    await navigate(st, origin, unitId, level, n, load);
    await st.page.waitForFunction(
      ([kind, title]) => {
        const k = document.querySelector(`.st-kind[data-kind="${kind}"]`);
        return (
          k?.childElementCount > 0 &&
          document.querySelector("#stRunTitle")?.textContent === title &&
          !document.querySelector(".st-stage--placeholder")
        );
      },
      [a.kind, a.title],
      { timeout: 8000 },
    );
    await st.page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => ok())));
  } catch (err) {
    return {
      stage: `stage: ${a.kind} did not render for "${a.title}" (${err.message.split("\n")[0].slice(0, 90)})`,
    };
  }
  const found = await st.page.evaluate(inspect, {
    minTarget: MIN_TARGET,
    minText: MIN_TEXT,
    lessons: (a.lessons || []).map((l) => l.id),
  });
  return { found: [...found, ...st.errors] };
}

/**
 * A screen that never rendered is retried once from a fresh page load: on a loaded machine a cold load or a
 * navigation race can stall for reasons unrelated to the page, while a real render defect reproduces.
 */
async function sweepScreen(st, origin, unitId, level, activities, n, load) {
  const a = activities[n - 1];
  let r = await tryScreen(st, origin, unitId, level, a, n, load);
  if (r.stage) r = await tryScreen(st, origin, unitId, level, a, n, true);
  return r.stage ? [r.stage] : r.found;
}

// ---- run ----
const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (err) {
  process.exit(
    skipExit(
      `Chromium unavailable (${err.message.split("\n")[0]})`,
      "Install Playwright Chromium or set PW_CHROMIUM_PATH.",
    ),
  );
}
const server = await startStudioServer(ROOT);
const unitIds = BCPSS_UNITS.map((u) => u.id).filter((id) => !unitFilter || unitFilter.includes(id));
const details = new Map();
for (const id of unitIds) details.set(id, await server.detailFor(id));
const missing = unitIds.filter((id) => !details.get(id)?.studio?.activities?.length);
const activityCount = [...details.values()].reduce(
  (s, d) => s + (d?.studio?.activities?.length || 0),
  0,
);
const planned = activityCount * levels.length * viewports.length;
if (!partial)
  assertSweptEnough(
    ID,
    planned,
    "units come from data/bcpss-curriculum-seed.mjs; activities from getUnitDetail",
  );

const issues = new Map(); // message -> { count, where }
let screens = 0;
let badScreens = 0;
const note = (where, list) => {
  screens++;
  if (list.length) badScreens++;
  for (const msg of list) {
    const key = msg.replace(/\d+(\.\d+)?/g, "#");
    const e = issues.get(key) || { count: 0, where, msg };
    e.count++;
    issues.set(key, e);
  }
};
for (const id of missing) note(id, [`stage: unit ${id} has no studio activities`]);
for (const id of unitIds.filter((u) => !missing.includes(u)))
  note(id, promptIssues(id, details.get(id).studio.activities));
screens -= unitIds.length; // prompt checks are not screens

const queue = unitIds.filter((id) => !missing.includes(id));
const started = Date.now();
await Promise.all(
  Array.from({ length: workerCount }, async () => {
    const states = await Promise.all(viewports.map((vp) => openViewport(browser, vp)));
    for (let id = queue.shift(); id; id = queue.shift()) {
      const acts = details.get(id).studio.activities;
      for (const st of states) {
        let loaded = false;
        for (const level of levels) {
          if (loaded) {
            try {
              await switchLevel(st, level);
            } catch (err) {
              console.error(
                `note: ${id} ${st.vp.name}px band switch fell back to a page load (${err.message.split("\n")[0]})`,
              );
              loaded = false;
            }
          }
          for (let n = 1; n <= acts.length; n++) {
            const where = `${id} ${level} ${st.vp.name}px a${n} ${acts[n - 1].kind}`;
            note(where, await sweepScreen(st, server.origin, id, level, acts, n, !loaded));
            loaded = true;
          }
        }
      }
    }
    await Promise.all(states.map((s) => s.context.close()));
  }),
);
await browser.close();
await server.close();

const secs = Math.round((Date.now() - started) / 1000);
console.log(
  `bcpss-studio-sweep: ${screens} screens (${unitIds.length} units, ${activityCount} activities x ${levels.length} bands x ${viewports.length} viewports) in ${secs}s, ${badScreens} with findings`,
);
if (screens !== planned) {
  console.error(`FAIL  ${ID}: planned ${planned} screens, verified ${screens}.`);
  process.exit(1);
}
if (issues.size) {
  console.error(`FAIL  ${ID}: ${issues.size} distinct finding(s):`);
  for (const e of [...issues.values()].sort((a, b) => b.count - a.count).slice(0, 40))
    console.error(`  x${e.count}  ${e.msg}\n         first at ${e.where}`);
  process.exit(1);
}
console.log(
  `PASS  ${ID}${partial ? " (partial run: floor not applied)" : ""}${readable ? " [easy-read on]" : ""}`,
);
