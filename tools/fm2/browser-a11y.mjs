// Accessibility suite: axe (WCAG 2.0/2.1/2.2 A and AA) on every page family in both languages, then keyboard-only journeys,
// focus management, live regions, reduced motion and the lang attribute. Exit 1 on any finding.
//   node tools/fm2/browser-a11y.mjs [--widths=390,1440] [--langs=en,es] [--only=home,play-math-market] [--jobs=4]
// @fm2 FM-037 FM-038 FM-039

import { mkdirSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import {
  buildScreens,
  filterScreens,
  parseArgs,
  printSummary,
  runMatrix,
  SHOTS,
} from "./browser-kit.mjs";
import { launch } from "./harness.mjs";

const args = parseArgs();
if (!process.argv.some((a) => a.startsWith("--widths="))) args.widths = [390, 1440];
mkdirSync(SHOTS, { recursive: true });
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const findings = [];
const notes = [];
const started = Date.now();
const h = await launch();
const add = (screen, cat, detail, lang = "en", width = 0) =>
  findings.push({ screen, lang, width, cat, detail });

// ---- part 1: axe on every page family ----------------------------------------------------------------------------------
const AXE_SCREENS = [
  /^home(-seeded|-skills-open|-realworld-open|-together|-nostorage-full)?$/,
  /^progress-(empty|seeded)$/,
  /^play-.*-(g3|g6|howto|revealed|solved-together)$/,
  /^session-/,
  /^play-finish/,
  /^play-error-/,
];
async function axeScreens(screens, games) {
  const chosen = filterScreens(screens, args).filter(
    (s) => !s.captureOnly && AXE_SCREENS.some((re) => re.test(s.id)),
  );
  console.log(
    `axe: ${chosen.length} screens x ${args.langs.length} langs x ${args.widths.length} widths`,
  );
  let runs = 0;
  const failures = await runMatrix(
    h,
    { screens: chosen, games, langs: args.langs, widths: args.widths, jobs: args.jobs },
    async (page, screen, env) => {
      const result = await new AxeBuilder({ page }).withTags(TAGS).exclude("#nsr-root").analyze();
      runs += 1;
      for (const v of result.violations)
        add(
          screen.id,
          `axe:${v.id}`,
          `${v.impact}: ${v.help} -> ${v.nodes
            .slice(0, 2)
            .map((n) => n.target.join(" "))
            .join(" | ")} (${v.nodes.length} node${v.nodes.length > 1 ? "s" : ""})`,
          env.lang,
          env.width,
        );
      if (screen.id === "home") {
        const nsr = await new AxeBuilder({ page })
          .withTags(TAGS)
          .include("#nsr-root")
          .analyze()
          .catch(() => ({ violations: [] }));
        for (const v of nsr.violations)
          notes.push(`Save/Resume pill (not ours) axe ${v.id}: ${v.help}`);
      }
    },
  );
  failures.forEach((f) => findings.push(f));
  console.log(`axe: ${runs} analyses`);
}

// ---- part 2: keyboard journeys ------------------------------------------------------------------------------------------
// One entry per tab stop: what it is, which region it sits in, whether a focus indicator is drawn and visible.
const stopInfo = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  if (el.dataset.fm2Seen) return { repeat: true };
  el.dataset.fm2Seen = "1";
  const ringOf = (node) => {
    const s = getComputedStyle(node);
    const outline =
      s.outlineStyle !== "none" &&
      Number.parseFloat(s.outlineWidth) > 0 &&
      s.outlineColor !== "rgba(0, 0, 0, 0)";
    return outline || (s.boxShadow && s.boxShadow !== "none");
  };
  const ring = [el, el.closest("label"), el.closest("summary"), el.parentElement].some(
    (n) => n && ringOf(n),
  );
  const r = el.getBoundingClientRect();
  const region = el.matches(".skip-link, a.fm2-sr")
    ? -1
    : el.closest("dialog")
      ? 9
      : el.closest(".fm2-shell-head")
        ? 0
        : el.closest(".fm2-stage")
          ? 1
          : el.closest(".fm2-hintbox")
            ? 2
            : el.closest(".fm2-toolbar")
              ? 3
              : el.closest(".fm2-finish")
                ? 4
                : 5;
  return {
    tag: el.tagName.toLowerCase(),
    name: (el.getAttribute("aria-label") || el.textContent || el.id || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 30),
    ring: Boolean(ring),
    visible: r.width >= 8 && r.height >= 8,
    region,
    tabindex: el.getAttribute("tabindex"),
    id: el.id || "",
  };
};
async function tabThrough(page, max = 140) {
  // Clicking the page corner makes the top of the document the sequential-focus starting point, like loading the page fresh.
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("[data-fm2-seen]")) delete e.dataset.fm2Seen;
    window.scrollTo(0, 0);
  });
  await page.mouse.click(2, 2);
  await page.evaluate(() => document.activeElement?.blur());
  const stops = [];
  let cycled = false;
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(stopInfo);
    if (stop?.repeat) {
      cycled = true;
      break;
    }
    if (stop) stops.push(stop);
    else if (stops.length && i > 2) {
      cycled = true;
      break;
    }
  }
  return { stops, cycled };
}
const judgeStops = (label, { stops, cycled }, lang, orderRegions = false) => {
  if (!cycled)
    add(
      label,
      "keyboard-trap",
      `focus never left or wrapped within ${stops.length} tab presses`,
      lang,
    );
  for (const s of stops) {
    if (!s.ring)
      add(
        label,
        "focus-not-visible",
        `${s.tag} "${s.name}" has no outline or box-shadow when focused`,
        lang,
      );
    if (!s.visible)
      add(
        label,
        "focus-on-invisible",
        `${s.tag} "${s.name}" takes focus but is not visibly rendered (skip link must show on focus)`,
        lang,
      );
    if (s.tabindex && Number(s.tabindex) > 0)
      add(label, "positive-tabindex", `${s.tag} "${s.name}" tabindex=${s.tabindex}`, lang);
  }
  if (orderRegions) {
    const regions = stops.map((s) => s.region).filter((r) => r >= 0 && r < 9);
    if (regions.some((r, i) => i && r < regions[i - 1] && !(regions[i - 1] === 4 || r === 5)))
      add(
        label,
        "tab-order",
        `focus order leaves reading order (regions ${regions.join(",")})`,
        lang,
      );
  }
};

async function homeJourney(context, lang) {
  const page = await context.newPage();
  await page.goto(h.url(`index.html?grade=3&lang=${lang}`));
  await page.waitForFunction(
    () => document.querySelectorAll("[data-testid=game-card][data-ready=true]").length === 10,
  );
  await page.waitForTimeout(150);
  const label = `home-keyboard`;
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => ({
    skip: document.activeElement.matches(".skip-link"),
    shown: document.activeElement.getBoundingClientRect().top >= 0,
  }));
  if (!first.skip) add(label, "skip-link", "first Tab stop is not the skip link", lang);
  else if (!first.shown) add(label, "skip-link", "skip link is not on screen when focused", lang);
  await page.keyboard.press("Enter");
  const moved = await page.evaluate(() => ({
    hash: location.hash,
    inMain: Boolean(document.activeElement.closest("#main")),
  }));
  if (moved.hash !== "#main" || !moved.inMain)
    add(
      label,
      "skip-link",
      `activating the skip link left focus outside main (${JSON.stringify(moved)})`,
      lang,
    );
  judgeStops(label, await tabThrough(page), lang);
  // Grade buttons work with Space and Enter and keep focus after the page redraws.
  for (const [grade, key] of [
    [5, "Space"],
    [6, "Enter"],
  ]) {
    await page.focus(`[data-testid=grade-${grade}]`);
    await page.keyboard.press(key);
    const state = await page.evaluate(
      (g) => ({
        pressed: document.querySelector(`[data-testid=grade-${g}]`).getAttribute("aria-pressed"),
        kept: document.activeElement?.dataset?.fk,
        grade: new URL(location.href).searchParams.get("grade"),
      }),
      grade,
    );
    if (state.pressed !== "true" || state.grade !== String(grade))
      add(
        label,
        "grade-keyboard",
        `${key} on grade ${grade} did not select it (${JSON.stringify(state)})`,
        lang,
      );
    if (state.kept !== `grade-${grade}`)
      add(label, "focus-lost", `focus left grade ${grade} after redraw (now ${state.kept})`, lang);
  }
  // Start is reachable by Tab from the grade picker and Enter opens the session.
  let reached = false;
  for (let i = 0; i < 14 && !reached; i += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.id === "start-link");
  }
  if (!reached)
    add(
      label,
      "start-unreachable",
      "Start was not reached within 14 Tabs of the grade picker",
      lang,
    );
  else {
    await Promise.all([page.waitForURL(/play\.html/), page.keyboard.press("Enter")]);
  }
  // The language toggle changes the document language and back.
  const home2 = await context.newPage();
  await home2.goto(h.url(`index.html?grade=3&lang=${lang}`));
  await home2.waitForSelector("#lang-toggle");
  const before = await home2.evaluate(() => document.documentElement.lang);
  await home2.focus("#lang-toggle");
  await home2.keyboard.press("Enter");
  const after = await home2.evaluate(() => ({
    lang: document.documentElement.lang,
    toggle: document.querySelector("#lang-toggle").lang,
  }));
  if (before !== lang || after.lang === lang)
    add(
      "home-lang",
      "lang-attribute",
      `html lang ${before} -> ${after.lang} after the toggle (expected ${lang} -> ${lang === "en" ? "es" : "en"})`,
      lang,
    );
  if (after.toggle !== lang)
    add(
      "home-lang",
      "lang-attribute",
      `toggle button lang is ${after.toggle}, should name the language it offers`,
      lang,
    );
  await home2.keyboard.press("Enter");
  if ((await home2.evaluate(() => document.documentElement.lang)) !== lang)
    add("home-lang", "lang-attribute", "html lang did not return after toggling back", lang);
  await home2.close();
  await page.close();
}

async function gameJourney(context, games, lang) {
  for (const game of games) {
    const label = `keyboard-${game.id}`;
    const page = await context.newPage();
    await page.goto(h.play({ game: game.id, grade: 3, rounds: 3, seed: 11, lang }));
    await page.waitForSelector("[data-fm2-stage] > *");
    await page.waitForTimeout(150);
    const focusedPrompt = () =>
      page.evaluate(() => document.activeElement?.matches("[data-fm2-prompt]"));
    if (!(await focusedPrompt()))
      add(
        label,
        "focus-management",
        "focus is not on the prompt heading when the first round opens",
        lang,
      );
    judgeStops(label, await tabThrough(page), lang, true);
    // How-to dialog: opens from the keyboard, takes focus, Escape closes it and returns focus to the button.
    await page.focus("[data-fm2-howto]");
    await page.keyboard.press("Enter");
    const open = await page.evaluate(() => ({
      open: document.querySelector("dialog")?.open,
      inside: Boolean(document.activeElement?.closest("dialog")),
    }));
    if (!open.open || !open.inside)
      add(
        label,
        "dialog-focus",
        `how-to dialog open=${open.open} but focus inside=${open.inside}`,
        lang,
      );
    await page.keyboard.press("Escape");
    const back = await page.evaluate(() => ({
      closed: !document.querySelector("dialog").open,
      onButton: document.activeElement?.matches("[data-fm2-howto]"),
    }));
    if (!back.closed || !back.onButton)
      add(
        label,
        "dialog-focus",
        `Escape: closed=${back.closed}, focus returned to How to play=${back.onButton}`,
        lang,
      );
    // Hint is announced; solving announces correctness and puts focus on Next; Enter on Next focuses the new prompt.
    await page.focus("[data-fm2-hint]");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    const hint = await page.evaluate(() => ({
      live: document.querySelector("[data-fm2-announce]").textContent.trim(),
      role: document.querySelector("[data-fm2-announce]").getAttribute("role"),
    }));
    if (!hint.live || hint.role !== "status")
      add(
        label,
        "live-region",
        `hint was not announced in the status region (${JSON.stringify(hint)})`,
        lang,
      );
    await page.evaluate(() => window.__fm2.submit(window.__fm2.solve()));
    await page.waitForTimeout(150);
    const solved = await page.evaluate(() => ({
      live: document.querySelector("[data-fm2-announce]").textContent,
      fb: document.querySelector("[data-fm2-feedback]").getAttribute("aria-live"),
      onNext: document.activeElement?.matches("[data-fm2-next]"),
    }));
    if (!/Correct|Correcto/.test(solved.live))
      add(label, "live-region", `correctness not announced (live text "${solved.live}")`, lang);
    if (solved.fb !== "polite")
      add(label, "live-region", "feedback box is not aria-live=polite", lang);
    if (!solved.onNext)
      add(label, "focus-management", "focus is not on Next after a round is solved", lang);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    if (!(await focusedPrompt()))
      add(
        label,
        "focus-management",
        "focus is not on the prompt heading after Next opens a new round",
        lang,
      );
    await page.close();
  }
}

// Reduced motion (the context emulates it): no running Web Animations and no SMIL animation on any page.
async function motionCheck(context, screens, games) {
  const wanted = screens.filter((s) =>
    /^(home|home-seeded|progress-seeded|session-between|session-complete|play-finish-single|play-[a-z-]+-(g3|g8-hard|revealed))$/.test(
      s.id,
    ),
  );
  for (const lang of args.langs) {
    const env = { h, context, games, lang, width: 390 };
    for (const screen of wanted) {
      const page = await screen.open(env);
      await page.waitForTimeout(300);
      const motion = await page.evaluate(() => ({
        running: document
          .getAnimations()
          .filter((a) => a.playState === "running")
          .map(
            (a) =>
              `${a.effect?.target?.tagName?.toLowerCase()}.${a.effect?.target?.className?.baseVal ?? a.effect?.target?.className}:${a.animationName || a.transitionProperty || "anim"}`,
          )
          .slice(0, 3),
        smil: document.querySelectorAll("animate, animateTransform, animateMotion, set").length,
        marquee: document.querySelectorAll("marquee, blink").length,
      }));
      if (motion.running.length)
        add(
          screen.id,
          "reduced-motion",
          `${motion.running.length}+ running animations under prefers-reduced-motion: ${motion.running.join(", ")}`,
          lang,
          390,
        );
      if (motion.smil)
        add(
          screen.id,
          "reduced-motion",
          `${motion.smil} SMIL animation element(s) ignore prefers-reduced-motion`,
          lang,
          390,
        );
      await page.close();
    }
  }
}

// Positive controls: axe must flag a planted missing alt text and the motion probe must see a planted running animation.
async function selfTest() {
  const context = await h.context({ width: 390, height: 844 });
  const page = await context.newPage();
  await page.goto(h.url("index.html?grade=3&lang=en"));
  await page.waitForSelector("[data-testid=game-card]");
  await page.evaluate(() => {
    document
      .querySelector("main")
      .insertAdjacentHTML(
        "beforeend",
        '<img id="planted-img" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">',
      );
    document
      .querySelector("main")
      .animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 800, iterations: Infinity });
  });
  const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const running = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === "running").length,
  );
  await context.close();
  if (!axe.violations.some((v) => v.id === "image-alt") || !running)
    throw new Error("a11y self-test: planted defects were not detected");
  console.log("a11y: self-test detected the planted image and animation");
}

try {
  await selfTest();
  const { screens, games } = await buildScreens();
  if (!process.argv.includes("--skip-axe")) await axeScreens(screens, games);
  const context = await h.context({ width: 1024, height: 800 });
  for (const lang of args.langs) {
    await homeJourney(context, lang);
    await gameJourney(
      context,
      games.filter((g) => !args.games.length || args.games.includes(g.id)),
      lang,
    );
  }
  if (!process.argv.includes("--skip-motion"))
    await motionCheck(
      await h.context({ width: 390, height: 844 }),
      filterScreens(screens, args),
      games,
    );
  writeFileSync(`${SHOTS}/a11y-report.json`, JSON.stringify({ findings, notes }, null, 1));
  console.log(`a11y: finished in ${Math.round((Date.now() - started) / 1000)}s`);
  if (notes.length) console.log(`not ours (Save/Resume pill): ${[...new Set(notes)].join("; ")}`);
  if (findings.length) {
    console.log(`FAIL a11y: ${findings.length} findings`);
    printSummary(findings, 60);
    process.exitCode = 1;
  } else
    console.log(
      "PASS a11y: axe clean, keyboard journeys, focus management, live regions, reduced motion, lang",
    );
} finally {
  await h.close();
}
