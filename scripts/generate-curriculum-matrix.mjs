#!/usr/bin/env node
// Builds data/curriculum/matrix.json (contract: types/curriculum.d.ts) from sources that already exist: the launch manifest
// (lessons, standards, objectives, resources), the units page (unit names), the integration map (Canvas scenes, Reality Lab
// investigations) and the pages on disk (which tracks and paths a lesson really has).
//   node scripts/generate-curriculum-matrix.mjs [--check]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "data/curriculum/matrix.json";
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const exists = (url) => {
  const p = url.replace(/^\//, "").split(/[?#]/)[0];
  return existsSync(join(ROOT, p)) && (!p.endsWith("/") || existsSync(join(ROOT, p, "index.html")));
};
const DOMAIN = (std) => {
  const d = String(std || "").split(".")[1];
  return ["AT", "NOS", "GR", "DS"].includes(d) ? d : "MP";
};

export function unitNames() {
  // <span class="unit-name">Statistics</span>, in unit order, from the lessons page
  const names = [
    ...read("curriculum/units/index.html").matchAll(/class="unit-name">([^<]+)</g),
  ].map((m) => m[1].replace(/&amp;/g, "&").trim());
  return names;
}

export function build() {
  const manifest = JSON.parse(read("data/curriculum-launch-manifest.json"));
  const map = JSON.parse(read("data/ewl/integration-map.json"));
  const names = unitNames();
  const units = [];
  for (let u = 1; u <= 9; u++) {
    const lessons = manifest.lessons
      .filter((l) => l.unit === u)
      .sort((a, b) => a.lesson - b.lesson);
    if (!lessons.length) continue;
    const domains = [...new Set(lessons.map((l) => DOMAIN(l.standard)))];
    const count = (d) => lessons.filter((l) => DOMAIN(l.standard) === d).length;
    const main = [...domains].sort((a, b) => count(b) - count(a))[0];
    units.push({
      unitNumber: u,
      title: names[u - 1] || `Unit ${u}`,
      domain: main,
      domains,
      lessons: lessons.map((l) => {
        const id = l.id;
        const m = map.lessons?.[id] || {};
        const studio = exists(`/math/practice-studio/${id}/`)
          ? `/math/practice-studio/${id}/`
          : exists(`/math/unit-4/${id === "4-1" ? "percent" : id}-practice-studio/`) || id === "4-1"
            ? id === "4-1"
              ? "/math/unit-4/percent-practice-studio/"
              : `/math/unit-4/${id}-practice-studio/`
            : undefined;
        const challenge = studio
          ? studio.startsWith("/math/practice-studio/")
            ? `${studio}challenge/`
            : studio.replace(/\/$/, "-challenging/")
          : undefined;
        const paths = {
          lesson: `/lessons/${id}/`,
          ...(exists(`/math/lesson-path/${id}/`) ? { path: `/math/lesson-path/${id}/` } : {}),
          ...(studio && exists(studio) ? { studio } : {}),
          ...(challenge && exists(challenge) ? { challenge } : {}),
          ...(exists(`/lessons/${id}-group1/`) ? { group1: `/lessons/${id}-group1/` } : {}),
          ...(exists(`/lessons/${id}-group2/`) ? { group2: `/lessons/${id}-group2/` } : {}),
          ...(exists(`/lessons/${id}-catchup/`) ? { catchup: `/lessons/${id}-catchup/` } : {}),
          ...(exists(`/lessons/${id}-part2/`) ? { session2: `/lessons/${id}-part2/` } : {}),
          ...(l.resources?.learningLab && exists(l.resources.learningLab)
            ? { learningLab: l.resources.learningLab }
            : {}),
        };
        const canvas = m.canvas || [];
        const investigations = [
          ...(m.lab || []),
          ...(m.forge || []),
          ...(m.invariant || []),
          ...(m.sketch || []),
        ];
        const minutes = Number((String(l.timeEstimate || "").match(/\d+/) || [])[0]) || null;
        return {
          id,
          lessonNumber: l.lesson,
          title: l.title,
          standards: l.standard ? [l.standard] : [],
          objective: l.objective || "",
          topics: (l.vocabulary || []).filter((v) => typeof v === "string").slice(0, 12),
          minutes,
          hasInteractive: Boolean(paths.learningLab || canvas.length || investigations.length),
          canvas,
          investigations,
          paths,
          tracks: {
            core: true,
            scaffold: Boolean(paths.group1),
            enrichment: Boolean(paths.challenge || paths.group2),
          },
        };
      }),
    });
  }
  return { schemaVersion: 1, grade: 6, units };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = `${JSON.stringify(build(), null, 2)}\n`;
  const path = join(ROOT, OUT);
  const cur = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (process.argv.includes("--check")) {
    if (cur !== text) {
      console.error(`${OUT} is stale; run: node scripts/generate-curriculum-matrix.mjs`);
      process.exit(1);
    }
    console.log("curriculum matrix is current.");
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    const m = JSON.parse(text);
    console.log(
      `Wrote ${OUT}: ${m.units.length} units, ${m.units.reduce((n, u) => n + u.lessons.length, 0)} lessons.`,
    );
  }
}
