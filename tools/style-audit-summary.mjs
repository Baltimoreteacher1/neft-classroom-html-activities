#!/usr/bin/env node
// Summarise one or two tools/style-audit.mjs JSON files into markdown.
//   node tools/style-audit-summary.mjs reports/style-audit-before.json [reports/style-audit-after.json]
// Every figure is computed from the audit data; nothing is estimated.
import { readFileSync } from "node:fs";

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath) {
  console.error("usage: style-audit-summary.mjs <before.json> [after.json]");
  process.exit(2);
}
const load = (p) => JSON.parse(readFileSync(p, "utf8"));
const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sum = (a) => a.reduce((x, y) => x + y, 0);

function summarise(data, state, viewport) {
  const runs = data.results.filter((r) => r.viewport === viewport);
  const rows = runs.map((r) => ({ r, s: r.states?.[state] })).filter((x) => x.s);
  const col = (f) => rows.map(({ s }) => f(s));
  const lessonsWith = (f) => rows.filter(({ s }) => f(s)).length;
  const fontsSeen = {};
  for (const { s } of rows)
    for (const [k, v] of Object.entries(s.fonts)) fontsSeen[k] = (fontsSeen[k] || 0) + v;
  return {
    pages: rows.length,
    entered: runs.filter((r) => r.entered).length,
    fatal: runs.filter((r) => r.fatal).length,
    withConsoleErrors: runs.filter((r) => r.errors?.length).length,
    medianLoadMs: median(runs.map((r) => r.loadMs || 0)),
    fonts: {
      median: median(col((s) => s.distinct.fonts)),
      max: Math.max(0, ...col((s) => s.distinct.fonts)),
    },
    sizes: {
      median: median(col((s) => s.distinct.sizes)),
      max: Math.max(0, ...col((s) => s.distinct.sizes)),
    },
    colours: {
      median: median(col((s) => s.distinct.colours)),
      max: Math.max(0, ...col((s) => s.distinct.colours)),
    },
    radii: {
      median: median(col((s) => s.distinct.radii)),
      max: Math.max(0, ...col((s) => s.distinct.radii)),
    },
    shadows: {
      median: median(col((s) => s.distinct.shadows)),
      max: Math.max(0, ...col((s) => s.distinct.shadows)),
    },
    buttonVariants: {
      median: median(col((s) => s.distinct.buttonVariants)),
      max: Math.max(0, ...col((s) => s.distinct.buttonVariants)),
    },
    purpleLessons: lessonsWith((s) => s.purpleCount > 0),
    purpleElements: sum(col((s) => s.purpleCount)),
    lowContrastLessons: lessonsWith((s) => s.lowContrastCount > 0),
    lowContrastElements: sum(col((s) => s.lowContrastCount)),
    smallTargetLessons: lessonsWith((s) => s.smallTargetCount > 0),
    smallTargets: sum(col((s) => s.smallTargetCount)),
    smallTextElements: sum(col((s) => s.smallTextCount)),
    emojiControls: sum(col((s) => s.emojiControlCount)),
    collisionLessons: lessonsWith((s) => s.collisions.length > 0),
    overflowLessons: lessonsWith((s) => s.overflowX > 0),
    leakedRootVars: lessonsWith((s) => s.rootBackgroundVarLeak),
    bodyFonts: Object.entries(
      col((s) => s.bodyFont).reduce((a, f) => ((a[f] = (a[f] || 0) + 1), a), {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([f, n]) => `${f} ×${n}`)
      .join(", "),
    fontsSeen: Object.entries(fontsSeen)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([f, n]) => `${f} (${n})`)
      .join(", "),
  };
}

const rowsDef = [
  ["Pages measured", "pages"],
  ["Gate passed (reached the lesson)", "entered"],
  ["Runs that crashed the probe", "fatal"],
  ["Runs with console errors", "withConsoleErrors"],
  ["Median load (ms, local)", "medianLoadMs"],
  ["Distinct font families — median / max", "fonts", true],
  ["Distinct font sizes — median / max", "sizes", true],
  ["Distinct text colours — median / max", "colours", true],
  ["Distinct border radii — median / max", "radii", true],
  ["Distinct shadows — median / max", "shadows", true],
  ["Distinct button styles — median / max", "buttonVariants", true],
  ["Pages with leaked page-level root variables", "leakedRootVars"],
  ["Pages with a purple-range colour painted", "purpleLessons"],
  ["Purple-range painted elements (total)", "purpleElements"],
  ["Pages with text failing WCAG AA contrast", "lowContrastLessons"],
  ["Text elements failing AA (total; solid backgrounds only)", "lowContrastElements"],
  ["Pages with a target under 44px", "smallTargetLessons"],
  ["Targets under 44px (total)", "smallTargets"],
  ["Text under 12px (elements, total)", "smallTextElements"],
  ["Emoji-led controls (total)", "emojiControls"],
  ["Pages where two fixed controls overlap", "collisionLessons"],
  ["Pages with horizontal overflow", "overflowLessons"],
];
const fmt = (v, pair) =>
  pair ? `${v.median} / ${v.max}` : typeof v === "number" ? Math.round(v * 10) / 10 : v;

const before = load(beforePath);
const after = afterPath ? load(afterPath) : null;
const out = [];
out.push(`# Style audit${after ? ": before vs after" : ""}`, "");
out.push(
  `Measured ${before.at}${after ? `; after ${after.at}` : ""} from \`${beforePath}\`${after ? ` and \`${afterPath}\`` : ""}.`,
);
out.push(
  "Computed styles in headless Chromium. Contrast counts only text whose background is a solid colour (gradients and images are not judged).",
  "",
);
for (const viewport of [...new Set(before.results.map((r) => r.viewport))]) {
  for (const state of ["entry", "lesson"]) {
    const b = summarise(before, state, viewport);
    const a = after ? summarise(after, state, viewport) : null;
    out.push(
      `## ${state === "entry" ? "Entry card" : "Inside the lesson (after the identity gate)"} — ${viewport}`,
      "",
    );
    out.push(
      a ? "| Metric | Before | After |" : "| Metric | Value |",
      a ? "|---|---:|---:|" : "|---|---:|",
    );
    for (const [label, key, pair] of rowsDef)
      out.push(
        a
          ? `| ${label} | ${fmt(b[key], pair)} | ${fmt(a[key], pair)} |`
          : `| ${label} | ${fmt(b[key], pair)} |`,
      );
    out.push(`| Body font (pages) | ${b.bodyFonts} |${a ? ` ${a.bodyFonts} |` : ""}`);
    out.push(
      `| Font families painted (text elements) | ${b.fontsSeen} |${a ? ` ${a.fontsSeen} |` : ""}`,
      "",
    );
  }
}
console.log(out.join("\n"));
