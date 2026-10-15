#!/usr/bin/env node
// Generates /math/lesson-path/<id>/ for every core lesson that has a Practice Studio (Units 2-9): ONE page that
// organizes everything a lesson offers into four activities — Be Curious, Build the Idea, Practice and Explore,
// Check Yourself — and merges the many practice files into one level choice (Support / Core / Challenge) with
// the matching printable. It only LINKS to existing pages (each link is checked against disk), so no lesson,
// worksheet or studio URL changes. Explore links come from data/ewl/integration-map.json when it exists.
//   node scripts/generate-lesson-paths.mjs [--check]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withCurriculumShell } from "../tools/lib/curriculum-shell.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const bi = (en, es) =>
  `<span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(es)}</span>`;
/** a path on this site resolves to a file or folder page on disk */
const exists = (url) => {
  const p = url.split(/[?#]/)[0].replace(/^\//, "");
  return (
    existsSync(join(ROOT, p)) && (p.endsWith("/") ? existsSync(join(ROOT, p, "index.html")) : true)
  );
};

/** Unit 4's studios are hand-built pages (assets/u4-studio.js), not generated from data/practice-studio. */
const UNIT4 = {
  "4-1": [
    "/math/unit-4/percent-practice-studio/",
    "/math/unit-4/percent-practice-studio-challenging/",
  ],
  "4-2": ["/math/unit-4/4-2-practice-studio/", "/math/unit-4/4-2-practice-studio-challenging/"],
  "4-3": ["/math/unit-4/4-3-practice-studio/", "/math/unit-4/4-3-practice-studio-challenging/"],
  "4-4": ["/math/unit-4/4-4-practice-studio/", "/math/unit-4/4-4-practice-studio-challenging/"],
  "4-5": ["/math/unit-4/4-5-practice-studio/", "/math/unit-4/4-5-practice-studio-challenging/"],
};
export function studioUrls(id) {
  return UNIT4[id] || [`/math/practice-studio/${id}/`, `/math/practice-studio/${id}/challenge/`];
}
export function studioLessonIds() {
  return [
    ...readdirSync(join(ROOT, "data/practice-studio"))
      .filter((f) => /^\d+-\d+\.json$/.test(f))
      .map((f) => f.replace(".json", "")),
    ...Object.keys(UNIT4),
  ].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/** Alternate routes through one lesson: the same lesson at another level, each a page that already exists. */
function trackPanels(id) {
  const one = (href, en, es) => (exists(href) ? { href, en, es } : null);
  const tracks = {
    scaffold: [
      one(
        `/lessons/${id}-group1/`,
        "Group 1 lesson (extra support)",
        "Lección del Grupo 1 (más apoyo)",
      ),
      one(`/lessons/${id}-catchup/`, "Catch-up lesson", "Lección de repaso"),
    ],
    enrichment: [
      one(
        `/lessons/${id}-group2/`,
        "Group 2 lesson (enrichment)",
        "Lección del Grupo 2 (enriquecimiento)",
      ),
      ...studioUrls(id)
        .slice(1)
        .map((h) => one(h, "Challenge studio", "Estudio de desafío")),
    ],
  };
  return Object.fromEntries(Object.entries(tracks).map(([k, v]) => [k, v.filter(Boolean)]));
}

function link(href, en, es, note) {
  return exists(href) ? { href, en, es, note: note || "" } : null;
}

/** The four activities and their links for one lesson. Dead links are dropped, never emitted. */
export function pathFor(lesson, map) {
  const id = lesson.id;
  const r = lesson.resources || {};
  const L = (p) => `/lessons/${id}/${p}`;
  const m = map?.lessons?.[id] || {};
  const [studio, challengeStudio] = studioUrls(id);
  const levels = {
    support: {
      title: ["Support", "Apoyo"],
      blurb: ["More guidance and sentence frames.", "Más guía y marcos de oración."],
      main: link(studio, "Open the practice studio", "Abrir el estudio de práctica"),
      print: link(
        L("worksheet-level-0.html"),
        "Print the support worksheet",
        "Imprimir la hoja de apoyo",
      ),
    },
    core: {
      title: ["Core", "Básico"],
      blurb: ["Grade-level practice with hints.", "Práctica del grado con pistas."],
      main: link(studio, "Open the practice studio", "Abrir el estudio de práctica"),
      print: link(L("worksheet.html"), "Print the core worksheet", "Imprimir la hoja básica"),
    },
    challenge: {
      title: ["Challenge", "Reto"],
      blurb: [
        "Harder problems, missions and a boss.",
        "Problemas más difíciles, misiones y un jefe.",
      ],
      main: link(challengeStudio, "Open the challenge studio", "Abrir el estudio de reto"),
      print: link(L("worksheet-2.html"), "Print worksheet 2", "Imprimir la hoja 2"),
    },
  };
  const explore = [];
  const lab =
    r.learningLab &&
    link(r.learningLab, "Learning lab", "Laboratorio de aprendizaje", "Investigate and create");
  if (lab) explore.push(lab);
  for (const s of m.canvas || []) {
    const l = link(
      "/curriculum/math-canvas/",
      `Living Math Canvas: ${s.replace(/-/g, " ")}`,
      `Lienzo Matemático Vivo: ${s.replace(/-/g, " ")}`,
    );
    if (l)
      explore.push({
        ...l,
        href: `/curriculum/math-canvas/?scene=${encodeURIComponent(s)}&lesson=${id}`,
      });
  }
  for (const s of m.lab || []) {
    const l = link(
      "/curriculum/reality-lab/",
      `Math Reality Lab: ${s.replace(/-/g, " ")}`,
      `Laboratorio de Realidad Matemática: ${s.replace(/-/g, " ")}`,
    );
    if (l)
      explore.push({
        ...l,
        href: `/curriculum/reality-lab/?inv=${encodeURIComponent(s)}&lesson=${id}`,
      });
  }
  const modes = [
    ["forge", "bot", "Counterexample Forge", "Fragua de contraejemplos"],
    ["invariant", "hunt", "Invariant Hunter", "Cazador de invariantes"],
    ["sketch", "story", "Sketch it", "Dibújalo"],
  ];
  for (const [kind, param, en, es] of modes)
    for (const s of m[kind] || []) {
      const l = link(
        "/curriculum/reality-lab/",
        `${en}: ${s.replace(/-/g, " ")}`,
        `${es}: ${s.replace(/-/g, " ")}`,
      );
      if (l)
        explore.push({
          ...l,
          href: `/curriculum/reality-lab/?mode=${kind}&${param}=${encodeURIComponent(s)}&lesson=${id}`,
        });
    }
  const more = [
    link(L("mstar-worksheet.html"), "MSTAR practice sheet", "Hoja de práctica MSTAR"),
    link(`/lessons/${id}-part2/`, "Apply Day (Part 2)", "Día de aplicación (Parte 2)"),
  ].filter(Boolean);
  return {
    curious: [
      link(L("readiness/"), "Get ready check", "Revisión previa"),
      link(L("vocab.html"), "Words to know", "Palabras clave"),
      link(`/lessons/${id}/#launch`, "Notice and wonder", "Observa y pregúntate"),
    ].filter(Boolean),
    build: {
      main: link(
        `/lessons/${id}/?student=1`,
        "Start the interactive lesson",
        "Comenzar la lección interactiva",
      ),
      more: [
        link(L("notes.html"), "Guided notes", "Notas guiadas"),
        link(L("learn.html"), "Learn It page", "Página Aprende"),
        link(L("handout.html"), "Handout", "Folleto"),
      ].filter(Boolean),
    },
    levels,
    explore,
    more,
    check: [
      link(`/lessons/${id}/#reflect`, "Exit ticket", "Boleto de salida"),
      link(`/curriculum/extra-help/#lesson-${id}`, "Extra Help", "Ayuda adicional"),
      link(L("student-help/"), "Student help", "Ayuda para el estudiante"),
    ].filter(Boolean),
    home: [
      link(L("homework.html"), "Homework", "Tarea"),
      link(L("family/"), "Family page", "Página para la familia"),
    ].filter(Boolean),
  };
}

const a = (l, cls = "") =>
  l ? `<a class="lp-link ${cls}" href="${esc(l.href)}">${bi(l.en, l.es)}</a>` : "";
const list = (ls) =>
  ls.length ? `<ul class="lp-list">${ls.map((l) => `<li>${a(l)}</li>`).join("")}</ul>` : "";

const NSR_HEAD = `<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
<link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css?v=20260714-v2">
<!-- nsr-injected:end -->`;
const NSR_BODY = `<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
<script src="/shared/save-resume/save-resume-engine.js?v=20260714-v2" defer></script>
<!-- nsr-injected:end -->`;

const sprint = (
  unit,
) => `<details class="lp-more lp-sprint" data-unit="${unit}"><summary>${bi("Class sprint: quick facts", "Carrera de clase: datos rápidos")}</summary>
        <p>${bi("12 short questions, no clock. Your teacher can give the whole class one code so everyone gets the same questions.", "12 preguntas cortas, sin reloj. Tu maestro puede dar un código a toda la clase para que todos tengan las mismas preguntas.")}</p>
        <p class="lp-actions"><label for="lp-code">${bi("Class code (optional)", "Código de clase (opcional)")}</label> <input id="lp-code" type="text" autocomplete="off" maxlength="14" placeholder="KITE-4821"> <button type="button" class="lp-start" id="lp-sprint-start">${bi("Start", "Empezar")}</button></p>
        <div id="lp-sprint-host"></div></details>`;

export function pageFor(lesson, map, stamp) {
  const id = lesson.id;
  const p = pathFor(lesson, map);
  const title = `${lesson.title} — Lesson ${id}`;
  const lv = Object.entries(p.levels)
    .map(
      ([
        k,
        v,
      ]) => `<div class="lp-level" id="lp-level-${k}" data-level="${k}" role="tabpanel" aria-labelledby="lp-tab-${k}" ${k === "core" ? "" : "hidden"}>
          <p>${bi(v.blurb[0], v.blurb[1])}</p>
          <p class="lp-actions">${a(v.main, "lp-primary")}${a(v.print, "lp-secondary")}</p></div>`,
    )
    .join("\n        ");
  const tabs = Object.entries(p.levels)
    .map(
      ([k, v]) =>
        `<button type="button" role="tab" id="lp-tab-${k}" aria-controls="lp-level-${k}" aria-selected="${k === "core"}" tabindex="${k === "core" ? 0 : -1}" data-level="${k}">${bi(v.title[0], v.title[1])}</button>`,
    )
    .join("");
  const step = (
    n,
    key,
    titleEn,
    titleEs,
    body,
  ) => `<section class="lp-step" id="lp-${key}" aria-labelledby="lp-h-${key}">
      <h2 id="lp-h-${key}"><span class="lp-n" aria-hidden="true">${n}</span> ${bi(titleEn, titleEs)}</h2>
      ${body}
      <p class="lp-done"><button type="button" class="lp-mark" data-stage="${key}" aria-pressed="false">${bi("I finished this step", "Terminé este paso")}</button></p>
    </section>`;

  const tp = trackPanels(id);
  const trackKeys = [
    ["core", "Core", "Principal"],
    ...(tp.scaffold.length ? [["scaffold", "Group 1 (Scaffold)", "Grupo 1 (apoyo)"]] : []),
    ...(tp.enrichment.length ? [["enrichment", "Enrichment", "Enriquecimiento"]] : []),
  ];
  const trackBar =
    trackKeys.length > 1
      ? `<div class="lp-tracks" role="group" aria-label="${esc("Lesson track")}">${trackKeys
          .map(
            ([k, en, es]) =>
              `<button type="button" class="lp-track" data-track="${k}" aria-pressed="${k === "core"}">${bi(en, es)}</button>`,
          )
          .join("")}</div>${["scaffold", "enrichment"]
          .filter((k) => tp[k].length)
          .map(
            (k) =>
              `<section class="lp-track-panel" id="lp-track-${k}" data-track-panel="${k}" hidden aria-label="${k}"><ul class="lp-list">${tp[
                k
              ]
                .map((x) => `<li><a class="lp-link" href="${x.href}">${bi(x.en, x.es)}</a></li>`)
                .join("")}</ul></section>`,
          )
          .join("")}`
      : "";
  const teacherLayer = `<aside class="lp-teacher" hidden aria-label="Teacher details"><p><strong>Standards:</strong> ${esc(
    lesson.standard || "—",
  )} · <strong>Pacing:</strong> ${esc(String(Number((String(lesson.timeEstimate || "").match(/\d+/) || [])[0]) || 45))} min · <a href="/curriculum/matrix/?lesson=${id}">Open in matrix</a></p><p class="lp-note">Press Shift+T to hide. Answer keys and teaching guidance stay on signed-in teacher pages.</p></aside>`;
  const body = `<main id="curriculum-content" class="lp-page" data-lesson="${id}">
    <header class="lp-head">
      <p class="lp-eyebrow">${bi(`Unit ${lesson.unit} · Lesson ${id}`, `Unidad ${lesson.unit} · Lección ${id}`)}${lesson.standard ? ` · ${esc(lesson.standard)}` : ""}</p>
      <h1>${esc(lesson.title)}</h1>
      <p class="lp-goal">${esc(lesson.objective || "")}</p>
      <p class="lp-note">${bi("Four steps. Work in order, or jump to the one you need.", "Cuatro pasos. Trabaja en orden o ve al que necesites.")}</p>
    </header>
    ${teacherLayer}
    ${trackBar}
    ${step(1, "curious", "Be Curious", "Sé curioso", `<p>${bi("Warm up your thinking and meet the words.", "Calienta tu pensamiento y conoce las palabras.")}</p>${list(p.curious)}`)}
    ${step(2, "build", "Build the Idea", "Construye la idea", `<p class="lp-actions">${a(p.build.main, "lp-primary")}</p>${p.build.more.length ? `<details class="lp-more"><summary>${bi("Notes and handouts", "Notas y folletos")}</summary>${list(p.build.more)}</details>` : ""}`)}
    ${step(
      3,
      "lab",
      "Practice and Explore",
      "Practica y explora",
      `<div class="lp-levels" role="tablist" aria-label="Level">${tabs}</div>
        ${lv}
        ${p.explore.length ? `<h3>${bi("Explore the idea", "Explora la idea")}</h3>${list(p.explore)}` : ""}
        ${p.more.length ? `<details class="lp-more"><summary>${bi("More practice", "Más práctica")}</summary>${list(p.more)}</details>` : ""}`,
    )}
    ${step(4, "check", "Check Yourself", "Compruébalo", `<p>${bi("Show what you know. If something is shaky, use a helper.", "Muestra lo que sabes. Si algo no está claro, usa una ayuda.")}</p>${list(p.check)}${sprint(lesson.unit)}${p.home.length ? `<h3>${bi("At home", "En casa")}</h3>${list(p.home)}` : ""}`)}
  </main>`;
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | EduWonderLab</title>
<meta name="description" content="${esc(`One page for Lesson ${id}, ${lesson.title}: get curious, build the idea, practice and explore at your level, then check yourself.`)}">
<link rel="canonical" href="https://eduwonderlab.com/math/lesson-path/${id}/">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/ewl/ewl.css?v=${stamp["ewl.css"]}">
<link rel="stylesheet" href="/assets/ewl/lesson-path.css?v=${stamp["lesson-path.css"]}">
${NSR_HEAD}
</head><body class="ewl-page">
${body}
<script src="/assets/ewl/rational.js?v=${stamp["rational.js"]}"></script>
<script src="/assets/ewl/state-store.js?v=${stamp["state-store.js"]}"></script>
<script src="/assets/ewl/lesson-path.js?v=${stamp["lesson-path.js"]}" defer></script>
<script src="/assets/ewl/reference-loader.js" defer></script>
${NSR_BODY}
</body></html>
`;
  return withCurriculumShell(html, "");
}

export function outputs() {
  const manifest = read("data/curriculum-launch-manifest.json");
  const map = existsSync(join(ROOT, "data/ewl/integration-map.json"))
    ? read("data/ewl/integration-map.json")
    : null;
  const ids = new Set(studioLessonIds());
  // one hash per file (first 8 hex of sha256), the scheme tools/curriculum-hub-assets.test.mjs checks
  const stamp = Object.fromEntries(
    ["ewl.css", "lesson-path.css", "rational.js", "state-store.js", "lesson-path.js"].map((f) => [
      f,
      createHash("sha256")
        .update(readFileSync(join(ROOT, "assets/ewl", f)))
        .digest("hex")
        .slice(0, 8),
    ]),
  );
  const files = new Map();
  for (const lesson of manifest.lessons)
    if (ids.has(lesson.id))
      files.set(`math/lesson-path/${lesson.id}/index.html`, pageFor(lesson, map, stamp));
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = outputs();
  let changed = 0;
  for (const [rel, html] of files) {
    const path = join(ROOT, rel);
    const cur = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (cur === html) continue;
    changed++;
    if (CHECK) console.error(`stale: ${rel}`);
    else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, html);
    }
  }
  if (CHECK && changed) process.exit(1);
  console.log(
    CHECK
      ? `Lesson paths are current: ${files.size} pages.`
      : `Generated ${files.size} lesson path pages (${changed} written).`,
  );
}
