import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderLanding } from "./lib/family-landing.mjs";
import { withPlainDefinitions } from "./lib/family-plain-definitions.mjs";
import { SESSIONS } from "./lib/homework-session-flow.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonDirPattern = /^(\d+)-(\d+)(-flagship)?$/;
const launchManifestPath = join(root, "data", "curriculum-launch-manifest.json");

function loadCanonicalLessons() {
  if (!existsSync(launchManifestPath)) return new Map();
  const manifest = JSON.parse(readFileSync(launchManifestPath, "utf8"));
  return new Map((manifest.lessons || []).map((lesson) => [lesson.id, lesson]));
}

const CANONICAL_LESSONS = loadCanonicalLessons();
const FAMILY_TITLES_ES = JSON.parse(
  readFileSync(join(root, "data", "family-homework-titles-es.json"), "utf8"),
);

const LANDING = JSON.parse(readFileSync(join(root, "data", "family-landing-units.json"), "utf8"));
const REVEAL_TOC = JSON.parse(readFileSync(join(root, "data", "reveal-toc-2025.json"), "utf8"));

/** The ten units, named by the Reveal TOC (English) and the landing data (Spanish). */
const UNITS = REVEAL_TOC.units
  .map((tocUnit) => {
    const extra = LANDING.units[String(tocUnit.unit)];
    if (!extra) throw new Error(`data/family-landing-units.json has no unit ${tocUnit.unit}`);
    return { unit: tocUnit.unit, nameEn: tocUnit.title, ...extra };
  })
  .sort((a, b) => a.unit - b.unit);

const unitById = (unit) => UNITS.find((u) => u.unit === unit);

const TOPIC_FALLBACK_VOCAB = {
  "Ratios, rates, and percents": [
    [
      "ratio",
      "razón",
      "A comparison of two quantities.",
      "2 cups of juice for every 3 cups of water",
    ],
    ["rate", "tasa", "A ratio that compares two different units.", "60 miles in 2 hours"],
    ["unit rate", "tasa unitaria", "A rate for one unit.", "$3 for 1 notebook"],
    ["percent", "porcentaje", "A number out of 100.", "25% means 25 out of 100"],
  ],
  Geometry: [
    ["area", "área", "The amount of flat space inside a shape.", "A rug covers 24 square feet"],
    ["base", "base", "A side used to measure a shape.", "The bottom side of a triangle"],
    ["height", "altura", "The straight distance from base to top.", "The height is 6 cm"],
    ["formula", "fórmula", "A rule that helps calculate a value.", "A = base x height"],
  ],
  "Expressions and equations": [
    [
      "variable",
      "variable",
      "A letter that stands for a number.",
      "x can stand for the missing value",
    ],
    [
      "expression",
      "expresión",
      "Numbers, variables, and operations without an equal sign.",
      "3x + 4",
    ],
    ["equation", "ecuación", "A math sentence with an equal sign.", "x + 5 = 12"],
    ["solution", "solución", "A value that makes an equation true.", "x = 7"],
  ],
  "Statistics and data": [
    [
      "data",
      "datos",
      "Information collected to answer a question.",
      "Survey answers from classmates",
    ],
    [
      "frequency",
      "frecuencia",
      "How many times a value or group appears.",
      "Six students chose soccer",
    ],
    [
      "distribution",
      "distribución",
      "The shape or spread of a data set.",
      "Most scores are near 80",
    ],
    [
      "display",
      "representación",
      "A graph or plot that organizes data.",
      "A histogram or dot plot",
    ],
  ],
  "Integers and coordinate plane": [
    ["integer", "entero", "A whole number, its opposite, or zero.", "-3, 0, and 5"],
    [
      "opposite",
      "opuesto",
      "A number the same distance from zero in the other direction.",
      "-4 and 4",
    ],
    ["coordinate", "coordenada", "A number that shows a location on a graph.", "(2, -3)"],
    ["absolute value", "valor absoluto", "A number's distance from zero.", "|-6| = 6"],
  ],
  "Number system": [
    ["factor", "factor", "A number that divides another number evenly.", "3 is a factor of 12"],
    [
      "multiple",
      "múltiplo",
      "The product of a number and a whole number.",
      "20 is a multiple of 5",
    ],
    ["quotient", "cociente", "The answer to a division problem.", "18 / 3 = 6"],
    ["decimal", "decimal", "A number with digits to the right of a decimal point.", "4.75"],
  ],
  "Grade 6 math": [
    ["strategy", "estrategia", "A plan for solving a problem.", "Draw a model first"],
    [
      "model",
      "modelo",
      "A picture, table, or equation that shows math thinking.",
      "A tape diagram",
    ],
    ["estimate", "estimar", "A reasonable answer before calculating exactly.", "About 50"],
    ["explain", "explicar", "Tell why an answer makes sense.", "Use words and numbers"],
  ],
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textFromMaybe(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromMaybe).find(Boolean) || "";
  if (typeof value === "object") {
    return (
      textFromMaybe(value.text) ||
      textFromMaybe(value.label) ||
      textFromMaybe(value.caption) ||
      textFromMaybe(value.description) ||
      textFromMaybe(value.alt)
    );
  }
  return String(value);
}

function lessonSort(a, b) {
  const [, au, al, af] = a.match(lessonDirPattern);
  const [, bu, bl, bf] = b.match(lessonDirPattern);
  return Number(au) - Number(bu) || Number(al) - Number(bl) || (af ? 1 : 0) - (bf ? 1 : 0);
}

function topicFor(config) {
  const title = String(config.title || "").toLowerCase();
  const standard = String(config.standard || "");
  if (standard.startsWith("6.RP") || /ratio|rate|percent|proportion/.test(title))
    return "Ratios, rates, and percents";
  if (
    standard.startsWith("6.G") ||
    /area|volume|surface|polygon|triangle|quadrilateral|net/.test(title)
  )
    return "Geometry";
  if (
    standard.startsWith("6.EE") ||
    /equation|inequal|expression|exponent|property|variable/.test(title)
  )
    return "Expressions and equations";
  if (
    standard.startsWith("6.SP") ||
    /data|histogram|box|dot|mean|median|statistic|quartile|variability/.test(title)
  )
    return "Statistics and data";
  if (
    standard.startsWith("6.NS") &&
    /integer|coordinate|opposite|absolute|plane|negative|positive/.test(title)
  )
    return "Integers and coordinate plane";
  if (
    standard.startsWith("6.NS") ||
    /fraction|decimal|factor|multiple|divide|division|quotient/.test(title)
  )
    return "Number system";
  return "Grade 6 math";
}

function resourcesFor(lessonId, canonicalLesson) {
  const safeLabels = {
    lesson: "Interactive Lesson",
    guidedNotes: "Guided Notes",
    handout: "Practice Handout",
    homework: "Homework Practice",
    studentHelp: "Student Help",
    exitTicket: "Check Understanding",
  };
  if (canonicalLesson?.resources) {
    return Object.entries(safeLabels)
      .map(([key, label]) => ({ label, href: canonicalLesson.resources[key] }))
      .filter(
        (resource) => typeof resource.href === "string" && resource.href.startsWith("/lessons/"),
      );
  }
  const base = join(root, "lessons", lessonId);
  const candidates = [
    ["Interactive Lesson", `/lessons/${lessonId}/`, join(base, "index.html")],
    ["Guided Notes", `/lessons/${lessonId}/notes.html`, join(base, "notes.html")],
    [
      "Notes PDF",
      `/lessons/${lessonId}/downloads/${lessonId}-notes.pdf`,
      join(base, "downloads", `${lessonId}-notes.pdf`),
    ],
    [
      "Notes DOCX",
      `/lessons/${lessonId}/downloads/${lessonId}-notes.docx`,
      join(base, "downloads", `${lessonId}-notes.docx`),
    ],
    ["Homework", `/lessons/${lessonId}/homework.docx`, join(base, "homework.docx")],
  ];
  return candidates
    .filter(([, , filePath]) => existsSync(filePath))
    .map(([label, href]) => ({ label, href }));
}

function normalizeVocabulary(config, topic) {
  const source = withPlainDefinitions(
    Array.isArray(config.vocabulary) ? config.vocabulary : [],
    config.lessonId || config.id,
  );
  const terms = source
    .map((item) => ({
      term: textFromMaybe(item.term || item.word || item.name),
      termEs: textFromMaybe(item.termEs || item.spanish || item.translation),
      definition: textFromMaybe(item.definition || item.meaning),
      definitionEs: textFromMaybe(item.definitionEs),
      example: textFromMaybe(item.example) || textFromMaybe(item.examples),
    }))
    .filter((item) => item.term && item.definition)
    .slice(0, 6);

  const fallback = TOPIC_FALLBACK_VOCAB[topic] || TOPIC_FALLBACK_VOCAB["Grade 6 math"];
  for (const [term, termEs, definition, example] of fallback) {
    if (terms.length >= 4) break;
    if (terms.some((item) => item.term.toLowerCase() === term.toLowerCase())) continue;
    terms.push({ term, termEs, definition, example });
  }

  return terms.slice(0, 6).map((item) => ({
    term: textFromMaybe(item.term),
    termEs: textFromMaybe(item.termEs) || textFromMaybe(item.term),
    definition: textFromMaybe(item.definition),
    definitionEs: textFromMaybe(item.definitionEs),
    example: textFromMaybe(item.example),
  }));
}

function whyText(topic) {
  if (topic === "Ratios, rates, and percents") {
    return "This math shows up in shopping, recipes, sports scores, speed, discounts, and comparing choices. It helps students decide what is fair, what is a better deal, and how quantities change together.";
  }
  if (topic === "Geometry") {
    return "Geometry helps with building, decorating, packing, maps, art, and design. Students use it when they plan space, compare shapes, or figure out how much material a project needs.";
  }
  if (topic === "Expressions and equations") {
    return "Expressions and equations help students describe patterns and missing numbers. This matters for planning, budgeting, games, coding, and solving everyday questions step by step.";
  }
  if (topic === "Statistics and data") {
    return "Data helps people make decisions. Students use these skills to read sports stats, compare survey results, notice patterns, and decide what a graph is really saying.";
  }
  if (topic === "Integers and coordinate plane") {
    return "Integers and coordinates are useful for temperatures, money, maps, elevators, games, and directions. They help students describe where something is and how far it is from zero.";
  }
  return "This skill supports everyday problem solving with money, measurements, games, planning, and checking whether an answer is reasonable.";
}

function spanishWhy(topic) {
  if (topic === "Ratios, rates, and percents")
    return "Esta matemática aparece en recetas, compras, deportes, descuentos y comparaciones. Ayuda a los estudiantes a decidir qué es justo o cuál opción conviene más.";
  if (topic === "Geometry")
    return "La geometría se usa para construir, decorar, empacar, leer mapas y diseñar. Ayuda a planear espacios y calcular materiales.";
  if (topic === "Expressions and equations")
    return "Las expresiones y ecuaciones ayudan a describir patrones y números desconocidos. Son útiles para planear, presupuestar y resolver problemas paso a paso.";
  if (topic === "Statistics and data")
    return "Los datos ayudan a tomar decisiones. Su hijo/a aprende a leer gráficas, comparar resultados y explicar patrones.";
  if (topic === "Integers and coordinate plane")
    return "Los enteros y las coordenadas se usan con temperaturas, dinero, mapas, elevadores y juegos. Ayudan a describir ubicación y distancia.";
  return "Esta habilidad ayuda con dinero, medidas, juegos, planificación y con revisar si una respuesta es razonable.";
}

/** The Family Math Studio pages for a lesson: Session 1, and Session 2 when it exists. */
function studioLinks(lessonId) {
  const part2 = join(root, "lessons", `${lessonId}-part2`, "homework.html");
  return {
    href: `/lessons/${lessonId}/homework.html`,
    part2Href: existsSync(part2) ? `/lessons/${lessonId}-part2/homework.html` : null,
  };
}

function buildLessonRecords() {
  const lessonsRoot = join(root, "lessons");
  return readdirSync(lessonsRoot)
    .filter((entry) => lessonDirPattern.test(entry))
    .filter((entry) => existsSync(join(lessonsRoot, entry, "config.json")))
    .sort(lessonSort)
    .map((lessonId) => {
      const config = JSON.parse(readFileSync(join(lessonsRoot, lessonId, "config.json"), "utf8"));
      const canonical = CANONICAL_LESSONS.get(lessonId);
      const lessonSource = canonical ? { ...config, ...canonical } : config;
      const unit = Number(lessonSource.unit || lessonId.match(lessonDirPattern)[1]);
      const unitInfo = unitById(unit);
      if (!unitInfo)
        throw new Error(`lesson ${lessonId} is in unit ${unit}, which the Reveal TOC lacks`);
      const topic = topicFor(lessonSource);
      const isFlagship = lessonId.endsWith("-flagship");
      const familyNote = JSON.parse(
        readFileSync(join(root, "data", "family-homework-notes", `${lessonId}.json`), "utf8"),
      );
      return {
        lessonId,
        unit,
        lesson: Number(lessonSource.lesson || lessonId.match(lessonDirPattern)[2]),
        title: lessonSource.title || `Lesson ${lessonId}`,
        titleEs: FAMILY_TITLES_ES[lessonId],
        standard: lessonSource.standard || "Grade 6 Math",
        objective: lessonSource.objective || "I can explain my math thinking.",
        languageObjective:
          lessonSource.languageObjective ||
          "I can explain my strategy using math words and evidence.",
        unitName: unitInfo.nameEn,
        unitNameEs: unitInfo.nameEs,
        topic,
        isFlagship,
        ...(isFlagship ? { variantLabel: "Flagship / Enrichment Version" } : {}),
        resources: resourcesFor(lessonId, canonical),
        studio: studioLinks(lessonId),
        vocabulary: normalizeVocabulary(config, topic),
        support: {
          learningTonight: familyNote.learningTonight,
          bigIdea: familyNote.bigIdea,
          conceptSteps: familyNote.conceptSteps,
          watchFor: familyNote.watchFor,
          tryTogether: familyNote.tryTogether,
          stuckTips: familyNote.stuckTips,
        },
      };
    });
}

function resourceLinks(resources, className = "resource-list") {
  if (!resources.length)
    return `<p class="muted">No linked classroom resources are available for this lesson yet.</p>`;
  const labelsEs = {
    "Interactive Lesson": "Lección interactiva",
    "Guided Notes": "Notas guiadas",
    "Practice Handout": "Hoja de práctica",
    "Homework Practice": "Práctica de tarea",
    "Student Help": "Ayuda para estudiantes",
    "Check Understanding": "Comprueba lo aprendido",
    "Notes PDF": "Notas PDF",
    "Notes DOCX": "Notas DOCX",
    Homework: "Tarea",
  };
  return `<div class="${className}">${resources
    .map(
      (resource) =>
        `<a href="${esc(resource.href)}">${esc(resource.label)} / <span lang="es">${esc(labelsEs[resource.label] || resource.label)}</span></a>`,
    )
    .join("")}</div>`;
}

function studioLinksHtml(lesson) {
  const { href, part2Href } = lesson.studio;
  const link = (to, en, es) =>
    `<a href="${esc(to)}"><span>${esc(en)}</span><small lang="es">${esc(es)}</small></a>`;
  if (!part2Href)
    return `<div class="studio-links">${link(href, "Open Family Math Studio", "Abrir el Estudio familiar")}</div>`;
  return `<div class="studio-links"><span class="cap">Family Math Studio / Estudio familiar</span>${link(href, SESSIONS[1].en, SESSIONS[1].es)}${link(part2Href, SESSIONS[2].en, SESSIONS[2].es)}</div>`;
}

function renderLessonPage(lesson) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Family Math Studio · Lesson guide | ${esc(lesson.title)}</title>
  <style>
    :root {
      --ink: #1f2933;
      --muted: #52606d;
      --line: #d7dee7;
      --paper: #fffaf0;
      --surface: #ffffff;
      --teal: #0f766e;
      --blue: #1d4ed8;
      --amber: #b45309;
      --rose: #be123c;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--paper); line-height: 1.6; }
    a { color: inherit; }
    .topbar { background: #12343b; color: #fff; }
    .topbar-inner { max-width: 980px; margin: 0 auto; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .topbar a { color: #fff; text-decoration: none; font-weight: 800; }
    main { max-width: 980px; margin: 0 auto; padding: 30px 20px 58px; }
    .lesson-hero { display: grid; gap: 14px; padding-bottom: 24px; border-bottom: 3px solid #12343b; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill { display: inline-flex; align-items: center; min-height: 30px; border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; background: #fff; font-weight: 900; color: #334e68; }
    .eyebrow { margin: 0; color: var(--teal); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; font-size: .8rem; }
    .eyebrow span { text-transform: none; letter-spacing: 0; font-weight: 600; color: var(--muted); }
    .standard-note { margin: 0; font-size: .8rem; color: var(--muted); }
    .studio-links { display: flex; flex-wrap: wrap; gap: 8px; }
    .studio-links a { background: var(--teal); color: #fff; text-decoration: none; font-weight: 900; padding: 12px 16px; border-radius: 8px; min-height: 48px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.2; }
    .studio-links small { font-weight: 600; opacity: .9; font-size: .8rem; }
    .studio-links .cap { flex-basis: 100%; font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--teal); }
    .more-materials summary { font-weight: 700; color: var(--muted); }
    .pill.flagship { color: #92400e; background: #fffbeb; border-color: #f59e0b; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; }
    .objective { margin: 0; max-width: 820px; font-size: 1.15rem; color: #334e68; font-weight: 700; }
    .language-goal { margin: 0; max-width: 820px; color: var(--muted); }
    .resource-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .resource-list a { background: var(--teal); color: #fff; text-decoration: none; font-weight: 900; padding: 9px 12px; border-radius: 8px; }
    .resource-list a:nth-child(2n) { background: var(--blue); }
    .resource-list a:nth-child(3n) { background: var(--amber); }
    section { padding: 24px 0; border-bottom: 1px solid var(--line); }
    h2 { margin: 0 0 10px; font-size: 1.55rem; line-height: 1.2; }
    h3 { margin: 18px 0 8px; font-size: 1.12rem; color: #12343b; }
    p { margin: 0 0 10px; }
    .muted { color: var(--muted); }
    .vocab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
    .vocab-card, .practice-item { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
    .bilingual-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .bilingual-pair > div { min-width: 0; padding: 14px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); }
    .bilingual-pair h3 { margin-top: 0; }
    .coach-list { margin: 0; padding-left: 22px; }
    .vocab-card strong { display: block; color: var(--blue); font-size: 1.03rem; }
    .translation { color: var(--rose); font-weight: 800; }
    ol { padding-left: 22px; margin-bottom: 0; }
    li { margin-bottom: 12px; }
    details { margin-top: 8px; }
    summary { cursor: pointer; font-weight: 900; color: var(--teal); }
    .back-link { display: inline-block; margin-bottom: 18px; color: #12343b; font-weight: 900; text-decoration: none; }
    a:focus-visible, summary:focus-visible { outline: 3px solid rgba(15, 118, 110, 0.3); outline-offset: 2px; }
    @media (max-width: 640px) {
      main { padding-top: 22px; }
      .resource-list a, .studio-links a { width: 100%; text-align: center; justify-content: center; }
      .bilingual-pair { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <strong>Family Math Studio · Estudio familiar</strong>
      <a href="/families/">All family guides / Todas las guías</a>
    </div>
  </header>
  <main>
    <a class="back-link" href="/families/">Back to family guides</a>
    <header class="lesson-hero">
      <p class="eyebrow">Family Math Studio · Lesson guide <span lang="es">· Guía de la lección</span></p>
      <div class="meta">
        <span class="pill">Unit ${esc(lesson.unit)}: ${esc(lesson.unitName)}</span>
        <span class="pill">Lesson ${esc(lesson.lessonId)}</span>
        ${lesson.isFlagship ? `<span class="pill flagship">Flagship / Enrichment Version</span>` : ""}
      </div>
      <h1>${esc(lesson.title)}</h1>
      <p lang="es" class="objective">${esc(lesson.titleEs)}</p>
      <p class="objective">${esc(lesson.objective)}</p>
      <p class="language-goal"><strong>Speaking and writing goal:</strong> ${esc(lesson.languageObjective)}</p>
      ${studioLinksHtml(lesson)}
      <details class="more-materials">
        <summary>More class materials / Más materiales de clase</summary>
        ${resourceLinks(lesson.resources)}
      </details>
      <p class="standard-note">Standard: ${esc(lesson.standard)}</p>
    </header>

    <section>
      <h2>What Your Child Is Learning / Qué está aprendiendo su estudiante</h2>
      <div class="bilingual-pair">
        <div><h3>English</h3><p>${esc(lesson.support.learningTonight.en)}</p><p>${esc(lesson.support.bigIdea.en)}</p></div>
        <div lang="es"><h3>Español</h3><p>${esc(lesson.support.learningTonight.es)}</p><p>${esc(lesson.support.bigIdea.es)}</p></div>
      </div>
    </section>

    <section>
      <h2>Why This Matters / Por qué es importante</h2>
      <div class="bilingual-pair"><div>${esc(whyText(lesson.topic))}</div><div lang="es">${esc(spanishWhy(lesson.topic))}</div></div>
    </section>

    <section>
      <h2>Example from this lesson / Ejemplo de esta lección</h2>
      ${lesson.support.conceptSteps
        .slice(0, 3)
        .map(
          (step) =>
            `<div class="bilingual-pair"><div><p>${esc(step.en)}</p></div><div lang="es"><p>${esc(step.es)}</p></div></div>`,
        )
        .join("\n")}
    </section>

    <section>
      <h2>How You Can Help At Home / Cómo puede ayudar en casa</h2>
      <div class="bilingual-pair">
        <div><h3>Ask your student</h3><ul class="coach-list">${lesson.support.stuckTips.say
          .slice(0, 2)
          .map((item) => `<li>${esc(item.en)}</li>`)
          .join(
            "",
          )}</ul><p><strong>Watch for:</strong> ${esc(lesson.support.watchFor[0].en)}</p></div>
        <div lang="es"><h3>Pregunten a su estudiante</h3><ul class="coach-list">${lesson.support.stuckTips.say
          .slice(0, 2)
          .map((item) => `<li>${esc(item.es)}</li>`)
          .join(
            "",
          )}</ul><p><strong>Preste atención:</strong> ${esc(lesson.support.watchFor[0].es)}</p></div>
      </div>
    </section>

    <section>
      <h2>Key Vocabulary / Vocabulario clave</h2>
      <div class="vocab-grid">
        ${lesson.vocabulary
          .map(
            (item) => `<article class="vocab-card">
          <strong>${esc(item.term)}</strong>
          <span class="translation">${esc(item.termEs)}</span>
          <p>${esc(item.definition)}</p>
          <p lang="es">${esc(item.definitionEs)}</p>
        </article>`,
          )
          .join("\n        ")}
      </div>
    </section>

    <section>
      <h2>Try It Together / Inténtenlo juntos</h2>
      <div class="bilingual-pair"><div><p>${esc(lesson.support.tryTogether.scenarioEn)}</p></div><div lang="es"><p>${esc(lesson.support.tryTogether.scenarioEs)}</p></div></div>
      <p class="muted">Let your child explain first, then open a hint. / Deje que su estudiante explique primero y después abra una pista.</p>
      <ol>
        ${lesson.support.tryTogether.steps
          .map(
            (item) => `<li class="practice-item">
          <div class="bilingual-pair"><div>${esc(item.en)}</div><div lang="es">${esc(item.es)}</div></div>
          <details>
            <summary>Show hint / Mostrar pista</summary>
            <div class="bilingual-pair"><div>${esc(item.hint)}</div><div lang="es">${esc(item.hintEs)}</div></div>
          </details>
        </li>`,
          )
          .join("\n        ")}
      </ol>
    </section>
  </main>
</body>
</html>
`;
}

const lessons = buildLessonRecords();

mkdirSync(join(root, "src", "data"), { recursive: true });
writeFileSync(
  join(root, "src", "data", "family-lessons.json"),
  `${JSON.stringify(lessons, null, 2)}\n`,
);

mkdirSync(join(root, "families"), { recursive: true });
writeFileSync(
  join(root, "families", "index.html"),
  renderLanding({ lessons, units: UNITS, promise: LANDING.promise }),
);

for (const lesson of lessons) {
  const lessonDir = join(root, "families", "lessons", lesson.lessonId);
  mkdirSync(lessonDir, { recursive: true });
  writeFileSync(join(lessonDir, "index.html"), renderLessonPage(lesson));
}

console.log(`Generated family support pages for ${lessons.length} lessons.`);
