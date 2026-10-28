#!/usr/bin/env node
// validate:typography-browser - the type a student actually sees, measured from computed style.
//
//   node tools/validate-typography-browser.mjs --base http://localhost:4603 [--lessons 1-1] [--viewport 390x844]
//
// Rules (docs/style-guide.md section 2, engine/design/tokens.json typography):
//   * families: only Baloo 2 and Nunito. Atkinson Hyperlegible only while a reading support is on.
//     Text made only of emoji/symbols/arrows (the engine's icon fallbacks) may use any family.
//   * size: no text under 12px (FAIL). 12 to <13px is reported as "below the 13px target".
//   * distinct font sizes per lesson are REPORTED (no pass/fail unless --max-distinct N).
//   * layout shift attributable to fonts must be zero: a PerformanceObserver records every
//     layout-shift from navigation, and a shift counts as font-caused when it lands within
//     [-30ms, +250ms] of a font face finishing loading AND moves a node that holds text.
import { pathToFileURL } from "node:url";
import { runGates } from "./lib/lesson-gate-kit.mjs";

export const APPROVED = ["baloo 2", "nunito"];
const SUPPORT_FONT = "atkinson hyperlegible";
const FONT_SHIFT_EPSILON = 0.001;

async function probe(page) {
  return page.evaluate(
    ({ approved, supportFont }) => {
      const G = window.__g;
      const root = document.documentElement;
      const flags = `${root.className} ${document.body.className} ${[...root.attributes, ...document.body.attributes].map((a) => a.name).join(" ")}`;
      const readingSupportOn =
        /dyslex|atkinson|readable|ls-font|ewl-font|reading-support|data-font/i.test(flags);
      const res = {
        nodes: 0,
        sizes: {},
        families: {},
        small: [],
        smallCount: 0,
        belowTarget: 0,
        off: [],
        offCount: 0,
        readingSupportOn,
      };
      const symbolic = (t) => !/[\p{L}\p{N}]/u.test(t);
      for (const e of G.textEls()) {
        const s = getComputedStyle(e);
        const txt = G.ownText(e);
        const fs = parseFloat(s.fontSize);
        const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        const famL = fam.toLowerCase();
        res.nodes++;
        res.sizes[fs] = (res.sizes[fs] || 0) + 1;
        res.families[fam] = (res.families[fam] || 0) + 1;
        if (fs < 12) {
          res.smallCount++;
          if (res.small.length < 80) res.small.push({ sig: G.sig(e), text: txt.slice(0, 30), fs });
        } else if (fs < 13) res.belowTarget++;
        if (symbolic(txt)) continue;
        const ok = approved.includes(famL) || (famL === supportFont && readingSupportOn);
        if (!ok) {
          res.offCount++;
          if (res.off.length < 80)
            res.off.push({ sig: G.sig(e), text: txt.slice(0, 30), family: fam, fs });
        }
      }
      return res;
    },
    { approved: APPROVED, supportFont: SUPPORT_FONT },
  );
}

async function finish(page) {
  return page.evaluate(
    async ({ approved }) => {
      await document.fonts?.ready;
      const ls = window.__ls || [];
      const ev = window.__fontEv || [];
      let total = 0;
      let fontShift = 0;
      const fontShifts = [];
      for (const s of ls) {
        if (s.input) continue;
        total += s.v;
        const near = ev.find((f) => s.t >= f.t - 30 && s.t <= f.t + 250);
        const hitsText = s.nodes.some((n) => n.text);
        if (near && hitsText) {
          fontShift += s.v;
          fontShifts.push({ v: +s.v.toFixed(4), faces: near.faces.slice(0, 3) });
        }
      }
      const missing = approved.filter(
        (f) =>
          [...document.fonts].some((ff) => ff.family.replace(/["']/g, "").toLowerCase() === f) &&
          ![...document.fonts].some(
            (ff) => ff.family.replace(/["']/g, "").toLowerCase() === f && ff.status === "loaded",
          ),
      );
      return {
        cls: +total.toFixed(4),
        fontShift: +fontShift.toFixed(4),
        fontShifts: fontShifts.slice(0, 5),
        shifts: ls.length,
        fontLoads: ev.length,
        declaredButUnloaded: missing,
      };
    },
    { approved: APPROVED },
  );
}

function judge(records, { args }) {
  const findings = [];
  const perLesson = {};
  const maxDistinct = args["max-distinct"] ? +args["max-distinct"] : null;
  const distinctAll = [];
  let nodes = 0;
  let belowTarget = 0;
  const famTotals = {};
  let shiftLessons = 0;
  for (const r of records) {
    const sizes = new Set();
    const pl = (perLesson[r.id] ||= {
      distinctSizes: 0,
      smallText: 0,
      offFamily: 0,
      belowTarget: 0,
      nodes: 0,
      fontShift: 0,
      cls: 0,
    });
    const seen = new Set();
    for (const st of r.states) {
      const d = st.data["typography-browser"];
      if (!d || d.probeError) continue;
      nodes += d.nodes;
      pl.nodes += d.nodes;
      pl.belowTarget += d.belowTarget;
      belowTarget += d.belowTarget;
      for (const k of Object.keys(d.sizes)) sizes.add(+k);
      for (const [f, n] of Object.entries(d.families)) famTotals[f] = (famTotals[f] || 0) + n;
      for (const x of d.small) {
        const k = `s|${x.sig}`;
        if (seen.has(k)) continue;
        seen.add(k);
        pl.smallText++;
        findings.push({
          key: `small|${x.sig}|${x.fs}px`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `"${x.text}" is ${x.fs}px (< 12px)`,
        });
      }
      for (const x of d.off) {
        const k = `o|${x.sig}|${x.family}`;
        if (seen.has(k)) continue;
        seen.add(k);
        pl.offFamily++;
        findings.push({
          key: `family|${x.sig}|${x.family}`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `"${x.text}" set in ${x.family} (approved: Baloo 2, Nunito)`,
        });
      }
    }
    pl.distinctSizes = sizes.size;
    distinctAll.push(sizes.size);
    if (maxDistinct && sizes.size > maxDistinct)
      findings.push({
        key: `distinct-sizes>${maxDistinct}`,
        lesson: r.id,
        viewport: r.viewport,
        state: "all",
        detail: `${sizes.size} distinct font sizes (max ${maxDistinct})`,
      });
    const fin = r.page["typography-browser"];
    if (fin && !fin.probeError) {
      pl.cls = fin.cls;
      pl.fontShift = fin.fontShift;
      if (fin.fontShift >= FONT_SHIFT_EPSILON) {
        shiftLessons++;
        findings.push({
          key: "font-layout-shift",
          lesson: r.id,
          viewport: r.viewport,
          state: "load",
          detail: `layout shift ${fin.fontShift} within 250ms of a font load ${JSON.stringify(fin.fontShifts)}`,
        });
      }
      if (fin.declaredButUnloaded.length)
        findings.push({
          key: `font-unloaded|${fin.declaredButUnloaded.join(",")}`,
          lesson: r.id,
          viewport: r.viewport,
          state: "load",
          detail: `declared but never loaded: ${fin.declaredButUnloaded.join(", ")}`,
        });
    }
  }
  const guards = [];
  if (nodes === 0 && records.length) guards.push("measured ZERO text nodes");
  distinctAll.sort((a, b) => a - b);
  const med = distinctAll.length ? distinctAll[Math.floor(distinctAll.length / 2)] : 0;
  return {
    findings,
    guards,
    perLesson,
    stats: {
      textNodes: nodes,
      belowTarget13: belowTarget,
      medianDistinctSizes: med,
      maxDistinctSizes: distinctAll.at(-1) || 0,
      lessonsWithFontShift: shiftLessons,
      families: famTotals,
    },
    lines: [
      `text nodes: ${nodes}; below the 13px target (12-12.99px, reported): ${belowTarget}`,
      `distinct font sizes per lesson: median ${med}, max ${distinctAll.at(-1) || 0}`,
      `families seen: ${JSON.stringify(famTotals)}`,
      `lessons with a font-attributed layout shift (>= ${FONT_SHIFT_EPSILON}): ${shiftLessons}`,
    ],
  };
}

export const gate = { name: "typography-browser", viewports: ["1366x768"], probe, finish, judge };
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(await runGates([gate]));
