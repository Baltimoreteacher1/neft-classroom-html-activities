// Browser driver shared by the family accessibility gate and its self-tests.
import AxeBuilder from "@axe-core/playwright";
import {
  FOCUS_RING,
  FORCED_COLORS,
  REDUCED_MOTION,
  REFLOW,
  STRUCTURE_PROBES,
  SVG_TEXT,
} from "./family-a11y-probe.mjs";

export const STOPS = ["learn", "words", "check", "play", "done"];
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
export const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

/** Open a homework page and wait for its runtime. `lang` is "en" or "es". */
export async function openHomework(context, origin, lesson, lang) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  await page.goto(`${origin}/lessons/${lesson}/homework.html${lang === "es" ? "?lang=es" : ""}`, {
    waitUntil: "load",
  });
  await page.waitForFunction(
    "typeof hwRenderGoal === 'function' && document.body.dataset.homeworkRoute",
    null,
    { timeout: 20000 },
  );
  return { page, errors };
}

/** Let entrance fades and hover transitions finish: contrast measured mid-fade is not the page. */
export const settle = async (page) => {
  await page.evaluate(async () => {
    const finite = () =>
      document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    for (let i = 0; i < 4 && finite().length; i++)
      await Promise.all(finite().map((a) => a.finished.catch(() => {})));
  });
  await page.waitForTimeout(60);
};

export const showStop = async (page, stop) => {
  if (stop !== "start") await page.evaluate((s) => window.switchHomeworkTab(s), stop);
  await settle(page);
};

/** axe over what is on screen; serious and critical only. */
export async function runAxe(page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `axe ${v.impact} ${v.id} x${v.nodes.length}: ${String(v.nodes[0]?.target?.[0] || "").slice(0, 70)}`,
    );
}

/** Run every in-page structure probe on the current state. */
export async function runStructure(page) {
  const found = {};
  for (const [name, fn] of Object.entries(STRUCTURE_PROBES)) {
    const res = await page.evaluate(fn);
    if (res.length) found[name] = res;
  }
  return found;
}

export const runDrawingText = (page) => page.evaluate(SVG_TEXT);

export const runFocus = (page, limit = 40) => page.evaluate(FOCUS_RING, limit);

/** Behaviour under emulated user preferences, in a throwaway context so nothing leaks. */
export async function runPreferences(browser, origin, lesson, lang) {
  const found = {};
  const forced = await browser.newContext({ viewport: VIEWPORTS.phone, forcedColors: "active" });
  const f = await openHomework(forced, origin, lesson, lang);
  const forcedRes = await f.page.evaluate(FORCED_COLORS);
  if (forcedRes.length) found.forcedColors = forcedRes;
  await forced.close();

  const calm = await browser.newContext({ viewport: VIEWPORTS.phone, reducedMotion: "reduce" });
  const c = await openHomework(calm, origin, lesson, lang);
  await c.page.waitForTimeout(400);
  const motion = await c.page.evaluate(REDUCED_MOTION);
  if (motion.length) found.reducedMotion = motion;
  await calm.close();
  return found;
}

/** 200% zoom is a 640px-wide viewport; 400% reflow is 320px wide (WCAG 1.4.4 / 1.4.10). */
export async function runZoom(browser, origin, lesson, lang) {
  const found = [];
  for (const [label, width] of [
    ["200% zoom", 640],
    ["400% reflow", 320],
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height: 480 } });
    const { page } = await openHomework(ctx, origin, lesson, lang);
    for (const stop of ["start", "learn", "check"]) {
      await showStop(page, stop);
      for (const msg of await page.evaluate(REFLOW)) found.push(`${label} ${stop}: ${msg}`);
    }
    await ctx.close();
  }
  return found;
}
