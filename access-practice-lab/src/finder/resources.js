// The Resource Finder's extra sources and metadata. Everything here is read from an existing registry, never typed
// again: src/sitemap.js DESTINATIONS (every page, with its section, skill, kind, audience and bands), the printable
// packets tools/generate-access-printables.mjs builds from content/index.json, the handouts in src/intro/ (the /start
// resources library and the family handouts) and the Teacher Hub's own sections. Pure: no DOM, Node tests import it.
//
//   resourceDocs({ destinations, index })  the documents the old search did not have
//   enrich(doc, destinations)              give a search document its audience, skill, kind, format and minutes
//
// Facet fields every finder document carries (null when the source does not say):
//   for      ["student" | "teacher" | "family", ...]     rk       sitemap kind, or "printable" | "word" | "action"
//   skill    "Listening" | "Speaking" | "Reading" | "Writing" | "Words" | "Mixed"
//   format   "digital" | "printable"                       minutes  number (content/index.json, practice tests)
//   files    { pdf?, docx?, html? }                         preview  { href, en, es } an existing preview page
import { FAMILY_HANDOUT } from "../intro/family-data.js";
import { FAMILY_HANDOUT_K2 } from "../intro/family-k2-data.js";
import { PICK_IDS, gradeName, printFiles } from "../intro/quick-guide-files.js";
import { RESOURCES } from "../intro/start-resources.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, TIERS } from "../util.js";

const ST = ["student", "teacher"];
const LAB = `${BASE}/`;

/** "Listening/A/x" -> "Listening/A/x"; "/access-practice-lab/videos/" -> "videos"; "/language-studio/" stays. */
export function routeKey(doc) {
  let r = String(doc.href || doc.path || "").replace(/[?#].*$/, "");
  if (r.startsWith(LAB)) r = r.slice(LAB.length);
  return r.replace(/\/+$/, "") || "/";
}
const firstSegment = (key) => (key.startsWith("/") ? key : key.split("/")[0]);

/** Pickers ("4-5") to content bands ("3-5"), as src/grade-bands.js maps them. */
const pickBand = (pick) => (pick === "4-5" ? "3-5" : pick);

// The Teacher Hub's sections (access-teacher/teacher.js), linked by their anchors. The hub needs the teacher sign-in.
const HUB = [
  [
    "activities",
    "Teacher Hub: activities and playlists",
    "Panel docente: actividades y listas",
    "Tick activities to build a playlist. Students open one link and work through them in order.",
    "Marquen actividades para crear una lista. Los estudiantes abren un enlace y las hacen en orden.",
    "digital",
  ],
  [
    "weekly",
    "Teacher Hub: Road to ACCESS weekly links",
    "Panel docente: enlaces semanales del Camino a ACCESS",
    "Post one link a week. Each opens that week's four activities in order, with a bilingual family prompt.",
    "Publiquen un enlace por semana. Cada uno abre las cuatro actividades de esa semana en orden, con una pregunta bilingüe para la familia.",
    "digital",
  ],
  [
    "tests",
    "Teacher Hub: practice tests",
    "Panel docente: pruebas de práctica",
    "Every practice test with a link to share.",
    "Todas las pruebas de práctica con un enlace para compartir.",
    "digital",
  ],
  [
    "printables",
    "Teacher Hub: printable packets with answer keys",
    "Panel docente: paquetes imprimibles con respuestas",
    "Student packets have no answers. Teacher packets add answer keys, listening scripts and sample answers. Word files open in Google Docs.",
    "Los paquetes del estudiante no tienen respuestas. Los paquetes docentes añaden las respuestas, los guiones de escucha y respuestas modelo. Los archivos de Word se abren en Google Docs.",
    "printable",
  ],
  [
    "guide",
    "Teacher Hub: how to use it",
    "Panel docente: cómo usarlo",
    "Classroom practice inspired by ACCESS, not an official WIDA test or score.",
    "Práctica de clase inspirada en ACCESS, no una prueba ni un puntaje oficial de WIDA.",
    "digital",
  ],
];

const doc = (d) => ({ kind: "page", keys: [], bands: null, titleEs: "", textEs: "", ...d });

/** Documents the site search did not index before: sitemap destinations, packets, handouts and hub sections. */
export function resourceDocs({ destinations = [], index = null } = {}) {
  const out = [];
  for (const d of destinations) {
    const site = d.href.startsWith("/");
    out.push(
      doc({
        id: `dest:${d.id}`,
        icon: d.icon,
        title: d.title[0],
        titleEs: d.title[1],
        text: d.text?.[0] || "",
        textEs: d.text?.[1] || "",
        ...(site ? { href: d.href } : { path: d.href }),
        keys: [d.section, d.kind, d.skill || ""],
        bands: d.bands || null,
        dest: d.id,
        section: d.section,
        top: !!d.top,
        external: !!d.external,
        for: d.for,
        skill: d.skill || null,
        rk: d.kind,
        format: "digital",
      }),
    );
  }
  // Student packets (no answers). Built for the bands tools/generate-access-printables.mjs prints (3-5 and 6-8).
  for (const band of ["3-5", "6-8"]) {
    const domains = index?.bands?.[band]?.domains || {};
    for (const domain of CORE_DOMAINS)
      for (const [level, L] of Object.entries(domains[domain]?.levels || {})) {
        const n = (L.activities || []).length;
        if (!n || !TIERS[level]) continue;
        const base = `${band === "3-5" ? "g3-5-" : ""}${domain}-${level}`;
        const meta = DOMAIN_META[domain];
        const grades = band === "3-5" ? ["Grades 3–5", "Grados 3–5"] : ["Grades 6–8", "Grados 6–8"];
        out.push(
          doc({
            id: `print:${band}:${domain}:${level}`,
            icon: "print",
            title: `${meta.name} printable packet · ${TIERS[level].name} (${level}) · ${grades[0]}`,
            titleEs: `Paquete imprimible de ${meta.es.toLowerCase()} · ${TIERS[level].es} (${level}) · ${grades[1]}`,
            text: `Student edition: ${n} illustrated activities with clear directions and room to respond. No answer key.`,
            textEs: `Edición para estudiantes: ${n} actividades ilustradas con instrucciones claras y espacio para responder. Sin respuestas.`,
            href: `${BASE}/printables/${base}`,
            keys: ["packet", "worksheet", "paquete", domain],
            bands: [band],
            for: ["teacher"],
            skill: domain,
            rk: "printable",
            format: "printable",
            level,
            files: { html: `${BASE}/printables/${base}`, docx: `${BASE}/printables/${base}.docx` },
            preview: {
              href: `${BASE}/printables/${base}`,
              en: "Preview & print",
              es: "Vista previa e imprimir",
            },
          }),
        );
      }
  }
  // The /start resources library, one file set per grade choice (src/intro/quick-guide-files.js).
  for (const r of RESOURCES) {
    if (!r.files) continue;
    const picks = r.id === "site-directory" ? [null] : PICK_IDS;
    for (const pick of picks) {
      const files = pick
        ? printFiles(pick)[
            {
              "quick-guide": "quickGuide",
              "activity-guide": "activityGuide",
              "lesson-backup": "lessonBackup",
            }[r.id]
          ]
        : r.files;
      if (!files) continue;
      const scope = pick ? gradeName(pick) : r.scope;
      out.push(
        doc({
          id: `guide:${r.id}${pick ? `:${pick}` : ""}`,
          icon: r.icon,
          title: `${r.name}${scope ? ` · ${scope}` : ""}`,
          text: r.text,
          href: files.pdf,
          keys: ["handout", "pdf", "word", "guide"],
          bands: pick ? [pickBand(pick)] : null,
          for: ["teacher"],
          skill: "Mixed",
          rk: "guide",
          format: "printable",
          files,
          ...(r.page
            ? {
                preview: {
                  href: `${BASE}${r.page.route}`,
                  en: r.page.label,
                  es: "Abrir en pantalla",
                },
              }
            : {}),
        }),
      );
    }
  }
  // Family handouts (src/intro/family-data.js, family-k2-data.js).
  const handouts = [
    [FAMILY_HANDOUT, "family-handout", "Grades 3–8", "Grados 3–8", ["3-5", "6-8"]],
    [FAMILY_HANDOUT_K2, "family-handout-k2", "Grades K–2", "Grados K–2", ["K", "1", "2-3"]],
  ];
  for (const [set, id, gEn, gEs, bands] of handouts)
    for (const [lang, en, es] of [
      ["en", "English", "inglés"],
      ["es", "Spanish", "español"],
    ]) {
      const files = set?.[lang];
      if (!files) continue;
      out.push(
        doc({
          id: `family:${id}:${lang}`,
          icon: "families",
          title: `Family handout (${en}) · ${gEn}`,
          titleEs: `Hoja para la familia (${es}) · ${gEs}`,
          text: "One-page handout to send home: how to practice together for a few minutes.",
          textEs: "Hoja de una página para enviar a casa: cómo practicar juntos unos minutos.",
          href: files.pdf,
          keys: ["handout", "family", "familia", "home"],
          bands,
          for: ["family", "teacher"],
          skill: "Mixed",
          rk: "guide",
          format: "printable",
          files,
        }),
      );
    }
  for (const [anchor, title, titleEs, text, textEs, format] of HUB)
    out.push(
      doc({
        id: `hub:${anchor}`,
        icon: "teacher",
        title,
        titleEs,
        text: `${text} Teacher sign-in needed.`,
        textEs: `${textEs} Se necesita la clave docente.`,
        href: `/access-teacher/#${anchor}`,
        keys: ["teacher hub", "panel docente"],
        for: ["teacher"],
        skill: "Mixed",
        rk: "tool",
        format,
      }),
    );
  return out;
}

// Legacy documents whose first route segment names a sitemap destination inherit its audience and kind; a few
// routes answer under another name.
const SEGMENT_ALIAS = { test: "tests", "reading-room": "reading-room", "launch-studio": "launch" };

/**
 * Fill a search document's finder fields from what its source already says. `byRoute` maps a route key to a
 * destination, `byId` maps a destination id to it.
 */
export function enrich(d, { byRoute, byId }) {
  if (d.rk) return d;
  const key = routeKey(d);
  const exact = byRoute.get(key);
  const seg = firstSegment(key);
  const near = exact || byRoute.get(seg) || byId.get(SEGMENT_ALIAS[seg]);
  const base = {
    for: near?.for || null,
    skill: near?.skill || null,
    rk: near?.kind || null,
    format: "digital",
  };
  if (d.kind === "word") return { ...d, ...base, rk: "word", for: null, skill: null };
  if (d.kind === "command")
    return { ...d, ...base, rk: "action", for: null, skill: null, format: null };
  if (d.meta?.domain) {
    const domain = d.meta.domain;
    const model = domain === "Model-Test";
    return {
      ...d,
      for: near?.for || ST,
      skill: model ? "Mixed" : domain,
      rk: model ? "test" : "practice",
      format: "digital",
      level: d.meta.level,
      minutes: d.meta.minutes ?? null,
    };
  }
  if (d.id.startsWith("test:"))
    return {
      ...d,
      ...base,
      for: ST,
      rk: "test",
      skill: d.meta?.skill || "Mixed",
      minutes: d.meta?.minutes ?? null,
    };
  if (d.id.startsWith("studio:")) {
    const skill = d.meta?.skill ? d.meta.skill[0].toUpperCase() + d.meta.skill.slice(1) : null;
    return {
      ...d,
      ...base,
      for: ST,
      rk: "studio",
      skill: FACET_SKILLS.includes(skill) ? skill : "Mixed",
    };
  }
  return { ...d, ...base, mergedFrom: exact && MERGEABLE.test(d.id) ? exact.id : null };
}
/** Documents that ARE a page (not content inside one) and so can stand for its sitemap destination. */
const MERGEABLE = /^(page|card|studio-app):/;
const FACET_SKILLS = ["Listening", "Speaking", "Reading", "Writing", "Words"];

/** Route lookups for enrich(), built once per index. */
export function destinationLookups(destinations = []) {
  const byRoute = new Map();
  const byId = new Map();
  for (const d of destinations) {
    byId.set(d.id, d);
    const key = routeKey({ href: d.href });
    if (!byRoute.has(key)) byRoute.set(key, d);
  }
  return { byRoute, byId };
}
