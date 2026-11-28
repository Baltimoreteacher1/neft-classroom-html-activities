#!/usr/bin/env node
/* =============================================================================
 * generate-language-page-curriculum-map.mjs — what the lab teaches at each grade, and how evenly across the bands.
 *
 * WHY. The audit (C2, C4, E-series) found no single view of the curriculum: thematic units exist for grades 3-8, the Vocabulary
 * Academy for K-8, a phonics path, and 933 activities in five bands, with no way to see where the bands differ. This reads
 * the content files and writes docs/language-page/curriculum-map.md: a grade-by-grade spine, a band-by-band parity table
 * (the share of activities that carry Spanish directions, sentence frames, vocabulary, listen-for cues, a picture with alt
 * text, a WIDA tag, and a place in a thematic unit), and the gaps that follow. data/language-page-parity-baseline.json holds the
 * shares and counts so none can fall.
 *
 * It measures and reports. It never writes content, and "a picture" means an activity has a `picture` field with alt text:
 * the early studios draw their own scenes and are not counted here.
 *
 *   node tools/generate-language-page-curriculum-map.mjs           write the map
 *   node tools/generate-language-page-curriculum-map.mjs --check   fail when it is stale or a measure fell below the baseline
 *   node tools/generate-language-page-curriculum-map.mjs --print-baseline
 * ========================================================================== */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadActivities } from "./generate-language-page-tag-coverage.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CONTENT = join(ROOT, "access-practice-lab/content");
export const OUT = "docs/language-page/curriculum-map.md";
export const BASELINE = "data/language-page-parity-baseline.json";
export const BANDS = ["gK", "g1", "g2-3", "g3-5", "g6-8"];
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const UNIT_FILES = { "g3-5": "units/g3-5.json", "g6-8": "units/g6-8.json" };
const BAND_LABEL = { gK: "K", g1: "1", "g2-3": "2–3", "g3-5": "3–5", "g6-8": "6–8" };

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export function measure(root = CONTENT) {
  const vocab = { bands: BANDS };
  const acts = loadActivities(vocab, root);
  const guide = JSON.parse(readFileSync(join(root, "es-guide.json"), "utf8")).activities || {};
  const units = {};
  const placed = new Set();
  for (const [band, file] of Object.entries(UNIT_FILES)) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    const list = JSON.parse(readFileSync(p, "utf8")).units || [];
    units[band] = {
      count: list.length,
      lessons: list.reduce((s, u) => s + (u.lessons || []).length, 0),
      minutes: list.reduce(
        (s, u) => s + (u.lessons || []).reduce((m, l) => m + (l.minutes || 0), 0),
        0,
      ),
      titles: list.map((u) => u.title?.en || u.id),
    };
    for (const u of list)
      for (const l of u.lessons || [])
        for (const st of l.steps || []) if (st.t === "activity" && st.id) placed.add(st.id);
  }
  const bands = {};
  for (const band of BANDS)
    bands[band] = {
      n: 0,
      es: 0,
      frames: 0,
      vocab: 0,
      listenFor: 0,
      picture: 0,
      wida: 0,
      inUnit: 0,
      listening: 0,
    };
  for (const { band, domain, a } of acts) {
    const b = bands[band];
    b.n += 1;
    if (a.directionsEs || guide[a.id]?.directions) b.es += 1;
    if (a.frames?.length) b.frames += 1;
    if (a.vocabulary?.length) b.vocab += 1;
    if (domain === "Listening") {
      b.listening += 1;
      if (a.listenFor?.length) b.listenFor += 1;
    }
    if (a.picture?.alt) b.picture += 1;
    if (a.wida?.length) b.wida += 1;
    if (placed.has(a.id)) b.inUnit += 1;
  }
  const va = JSON.parse(readFileSync(join(root, "vocab-academy/index.json"), "utf8"));
  const phonics = JSON.parse(readFileSync(join(root, "reading-path/phonics-scope.json"), "utf8"));
  return {
    bands,
    units,
    vocabAcademy: Object.fromEntries(
      GRADES.map((g) => [
        g,
        va.grades?.[g] ? { units: va.grades[g].unitCount, words: va.grades[g].wordCount } : null,
      ]),
    ),
    phonicsUnits: phonics.units?.length ?? 0,
    activities: acts.length,
  };
}

export function render(m) {
  const spine = GRADES.map((g) => {
    const band = ["3", "4", "5"].includes(g) ? "g3-5" : ["6", "7", "8"].includes(g) ? "g6-8" : null;
    const u = band ? m.units[band] : null;
    const v = m.vocabAcademy[g];
    return `| ${g} | ${v ? `${v.units} units, ${v.words} words` : "none"} | ${u ? `${u.count} units (band ${BAND_LABEL[band]})` : "none"} |`;
  });
  const row = (b) => {
    const x = m.bands[b];
    return `| ${BAND_LABEL[b]} | ${x.n} | ${pct(x.es, x.n)}% | ${pct(x.frames, x.n)}% | ${pct(x.vocab, x.n)}% | ${pct(x.listenFor, x.listening)}% | ${pct(x.picture, x.n)}% | ${pct(x.wida, x.n)}% | ${pct(x.inUnit, x.n)}% |`;
  };
  const unitRows = Object.entries(m.units).map(
    ([b, u]) =>
      `| ${BAND_LABEL[b]} | ${u.count} | ${u.lessons} | ${u.minutes} | ${u.titles.join("; ")} |`,
  );
  const gaps = [];
  for (const b of BANDS) {
    const x = m.bands[b];
    if (!UNIT_FILES[b] && x.n)
      gaps.push(
        `Band ${BAND_LABEL[b]} (${x.n} activities) has no thematic units, so no activity in it is placed in a unit.`,
      );
    if (x.picture === 0 && x.n)
      gaps.push(
        `Band ${BAND_LABEL[b]}: none of its ${x.n} activities has a \`picture\` field with alt text (the early studios draw their own scenes).`,
      );
    if (x.listening && x.listenFor === 0)
      gaps.push(
        `Band ${BAND_LABEL[b]}: none of its ${x.listening} Listening activities has listen-for cues (these bands use their own \`hint\` and \`support\` fields; whether to add cues is a curriculum decision).`,
      );
  }
  for (const b of Object.keys(UNIT_FILES)) {
    const x = m.bands[b];
    if (x.n && pct(x.inUnit, x.n) < 50)
      gaps.push(
        `Band ${BAND_LABEL[b]}: only ${pct(x.inUnit, x.n)}% of activities are placed in a thematic unit (${x.inUnit} of ${x.n}); the rest are reached by browsing.`,
      );
  }
  return `# Curriculum map

> **GENERATED FILE.** Built by \`tools/generate-language-page-curriculum-map.mjs\` from \`access-practice-lab/content/\`. Do not edit; change the content and
> regenerate. \`tools/language-page-curriculum-map.test.mjs\` fails when this is stale or a measure falls below \`${BASELINE}\`.

It measures what exists and reports differences. It writes no content: deciding which difference is a gap, and closing it, is authoring work with a reviewer (H-03, H-05).
"A picture" means an activity has a \`picture\` field with alt text; the early studios draw their own scenes and are not counted here.
The 6–8 band includes its Model-Test items, which carry no sentence frames or vocabulary lists of their own.

## Spine by grade
| Grade | Vocabulary Academy | Thematic units |
| --- | --- | --- |
${spine.join("\n")}

Phonics path: ${m.phonicsUnits} units (\`content/reading-path/phonics-scope.json\`). Activity bank: ${m.activities} activities in five bands (K, 1, 2–3, 3–5, 6–8; bands overlap at grade 3).

## Thematic units
| Band | Units | Lessons | Minutes | Units (English titles) |
| --- | --- | --- | --- | --- |
${unitRows.join("\n")}

## Parity across bands (share of activities with each feature)
| Band | Activities | Spanish directions | Sentence frames | Vocabulary | Listen-for cues (Listening only) | Picture with alt | WIDA tag | In a thematic unit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${BANDS.map(row).join("\n")}

## Differences between bands (some are by design; none is hidden)
${gaps.length ? gaps.map((g) => `- ${g}`).join("\n") : "- none"}
`;
}

export function baselineFrom(m) {
  const bands = {};
  for (const b of BANDS) {
    const x = m.bands[b];
    if (!x) continue;
    bands[b] = {
      activities: x.n,
      es: pct(x.es, x.n),
      frames: pct(x.frames, x.n),
      vocab: pct(x.vocab, x.n),
      listenFor: pct(x.listenFor, x.listening),
      picture: pct(x.picture, x.n),
      wida: pct(x.wida, x.n),
      inUnit: pct(x.inUnit, x.n),
    };
  }
  return {
    units: Object.fromEntries(Object.entries(m.units).map(([b, u]) => [b, u.count])),
    vocabAcademyUnits: Object.values(m.vocabAcademy).reduce((s, v) => s + (v?.units || 0), 0),
    phonicsUnits: m.phonicsUnits,
    bands,
  };
}

/** Shares and counts may not fall below the baseline (shares by more than rounding, 0.1 point). */
export function ratchetProblems(m, baseline) {
  const out = [];
  const now = baselineFrom(m);
  for (const [b, base] of Object.entries(baseline.bands)) {
    const cur = now.bands[b];
    if (!cur) {
      out.push(`${b}: band missing`);
      continue;
    }
    if (cur.activities < base.activities)
      out.push(`${b}: activities fell from ${base.activities} to ${cur.activities}`);
    for (const k of ["es", "frames", "vocab", "listenFor", "picture", "wida", "inUnit"])
      if (cur[k] < base[k] - 0.1)
        out.push(`${b}: ${k} share ${cur[k]}% fell below the baseline ${base[k]}%`);
  }
  for (const [b, n] of Object.entries(baseline.units))
    if ((now.units[b] ?? 0) < n)
      out.push(`${b}: thematic units fell from ${n} to ${now.units[b] ?? 0}`);
  if (now.vocabAcademyUnits < baseline.vocabAcademyUnits)
    out.push(
      `Vocabulary Academy units fell from ${baseline.vocabAcademyUnits} to ${now.vocabAcademyUnits}`,
    );
  if (now.phonicsUnits < baseline.phonicsUnits)
    out.push(`phonics units fell from ${baseline.phonicsUnits} to ${now.phonicsUnits}`);
  return out;
}

export function build() {
  const m = measure();
  return { m, doc: render(m) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { m, doc } = build();
  const path = join(ROOT, OUT);
  if (process.argv.includes("--check")) {
    const base = JSON.parse(readFileSync(join(ROOT, BASELINE), "utf8"));
    const problems = ratchetProblems(m, base);
    if (!existsSync(path) || readFileSync(path, "utf8") !== doc)
      problems.push(`${OUT} is stale: run node tools/generate-language-page-curriculum-map.mjs`);
    if (problems.length) {
      for (const p of problems) console.error(`  ${p}`);
      process.exit(1);
    }
    console.log(
      `generate-language-page-curriculum-map: ${OUT} is current and no measure is below its baseline`,
    );
  } else if (process.argv.includes("--print-baseline")) {
    console.log(JSON.stringify(baselineFrom(m), null, 2));
  } else {
    writeFileSync(path, doc);
    console.log(`generate-language-page-curriculum-map: wrote ${OUT}`);
  }
}
