#!/usr/bin/env node
// Family homework scorecard: static metrics for every lessons/*/homework.html.
// Usage: node tools/family-homework-scorecard.mjs [--json=<out.json>] [--lesson=4-5,5-1]
// Metrics are the Section 2 acceptance numbers of docs/specs/family-homework-v3.md.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

// A signature is a phrase that only belongs on a ratio lesson. Seeing it on any
// other lesson is wrong-lesson content.
export const RATIO_SIGNATURES = [
  "3 cups of berries",
  "Jordan says 3:5",
  "keep the taste/color the same",
  "cross-multiply or set up proportions",
  "double number lines to see equivalent ratios",
  "Ratio Tape Model",
  "compost with 6 scoops of topsoil",
];

// Unit 3 is the ratios-and-rates unit. Percent (Unit 4) is not a ratio lesson for this check.
const RATIO_LESSON = /^3-/;

// Chrome strings that may legitimately repeat on every page.
export const CHROME_ALLOW = [/^Family Math Studio/i, /^Estudio familiar/i];

export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, (m) =>
      m.match(/<title>([^<]*)/)?.[1] ? ` ${m.match(/<title>([^<]*)/)[1]} ` : " ",
    );
}

export function textNodes(html) {
  const out = [];
  for (const m of visibleText(html).matchAll(/>([^<>]{2,})</g)) {
    const t = m[1]
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (t) out.push(t);
  }
  return out;
}

export function lessonIds(only) {
  const ids = listLessonDirs().filter((d) => existsSync(lessonPath(d, "homework.html")));
  return only?.length ? ids.filter((i) => only.includes(i)) : ids;
}

export function measure(ids = lessonIds()) {
  const perLesson = {};
  const stringLessons = new Map();
  for (const id of ids) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    const nodes = textNodes(html);
    const leaks = RATIO_LESSON.test(id) ? [] : RATIO_SIGNATURES.filter((s) => html.includes(s));
    const es = nodes.join(" ");
    const registerUsted = /\b(Pregunte|Escuche|Pida|Anime|Evite|Dígale|Dele)\b/.test(es);
    const registerUstedes = /\b(Pregunten|Escuchen|Eviten|Lean|Animen|Pídanle)\b/.test(es);
    const registerTu = /\b(Pregunta|Toca|Escribe|Elige|Mira)\b/.test(es);
    const wholeTerms = ["el total", "el entero", "del todo"].filter((t) => es.includes(t));
    const doubled = nodes.filter((t) => /^(\p{L}+) \1$/iu.test(t)).length;
    const pctSpace = (es.match(/\d %/g) || []).length;
    perLesson[id] = {
      bytes: Buffer.byteLength(html),
      gzip: gzipSync(html).length,
      handlers: (html.match(/\son[a-z]+="/g) || []).length,
      scripts: (html.match(/<script\b/g) || []).length,
      canvases: (html.match(/<canvas\b/g) || []).length,
      textNodes: nodes.length,
      leakHits: leaks.length,
      leaks,
      legacyHeader: html.includes('id="hw_colearn_hud"'),
      zeroOfZero: /Completed:\s*(<[^>]+>\s*)*0\s*\/\s*0/.test(html),
      genericTape: (html.match(/Ratio Tape Model/g) || []).length,
      emojiHeadings: (html.match(/<h[1-4][^>]*>[^<]*\p{Extended_Pictographic}/gu) || []).length,
      unnamedButtons: (html.match(/<button\b(?![^>]*aria-label)[^>]*>\s*<\/button>/g) || []).length,
      dupIds: (() => {
        const seen = new Set();
        let d = 0;
        for (const m of html.matchAll(/\sid="([^"]+)"/g)) seen.has(m[1]) ? d++ : seen.add(m[1]);
        return d;
      })(),
      spanishRegisterMix: [registerUsted, registerUstedes, registerTu].filter(Boolean).length,
      wholeTermCount: wholeTerms.length,
      doubledLabels: doubled,
      pctSpacing: pctSpace,
    };
    for (const t of new Set(nodes)) {
      if (t.length > 60 && !CHROME_ALLOW.some((r) => r.test(t))) {
        if (!stringLessons.has(t)) stringLessons.set(t, new Set());
        stringLessons.get(t).add(id);
      }
    }
  }
  const shared = [...stringLessons].filter(([, s]) => s.size > 3);
  const sharedByLesson = {};
  for (const [, s] of shared)
    for (const id of s) sharedByLesson[id] = (sharedByLesson[id] || 0) + 1;
  for (const id of ids) perLesson[id].sharedLongStrings = sharedByLesson[id] || 0;
  return {
    perLesson,
    sharedStringCount: shared.length,
    shared: shared.slice(0, 40).map(([t, s]) => [t.slice(0, 120), s.size]),
  };
}

export function summarize({ perLesson, sharedStringCount }) {
  const v = Object.values(perLesson);
  const sum = (k) => v.reduce((a, r) => a + (r[k] || 0), 0);
  const cnt = (f) => v.filter(f).length;
  return {
    pages: v.length,
    pagesWithLeakage: cnt((r) => r.leakHits > 0),
    pagesWithGenericTape: cnt((r) => r.genericTape > 0),
    pagesWithLegacyHeader: cnt((r) => r.legacyHeader),
    pagesWithZeroOfZero: cnt((r) => r.zeroOfZero),
    sharedLongStrings: sharedStringCount,
    pagesWithSharedLongStrings: cnt((r) => r.sharedLongStrings > 0),
    totalMB: +(sum("bytes") / 1e6).toFixed(1),
    maxKB: Math.round(Math.max(...v.map((r) => r.bytes)) / 1024),
    maxGzipKB: Math.round(Math.max(...v.map((r) => r.gzip)) / 1024),
    medianHandlers: v.map((r) => r.handlers).sort((a, b) => a - b)[Math.floor(v.length / 2)],
    pagesOver200Handlers: cnt((r) => r.handlers > 200),
    medianTextNodes: v.map((r) => r.textNodes).sort((a, b) => a - b)[Math.floor(v.length / 2)],
    pagesWithDuplicateIds: cnt((r) => r.dupIds > 0),
    pagesWithUnnamedButtons: cnt((r) => r.unnamedButtons > 0),
    pagesWithEmojiHeadings: cnt((r) => r.emojiHeadings > 0),
    pagesMixedSpanishRegister: cnt((r) => r.spanishRegisterMix > 1),
    pagesWithSeveralWholeTerms: cnt((r) => r.wholeTermCount > 1),
    pagesWithDoubledLabels: cnt((r) => r.doubledLabels > 0),
    pagesWithSpacedPercent: cnt((r) => r.pctSpacing > 0),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
  const only = arg("lesson")?.split(",");
  const res = measure(lessonIds(only));
  const summary = summarize(res);
  console.log(JSON.stringify(summary, null, 2));
  const out = arg("json");
  if (out) writeFileSync(out, JSON.stringify({ summary, ...res }, null, 2) + "\n");
}
