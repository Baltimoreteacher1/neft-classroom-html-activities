// The package's local launcher page (index.html): relative links only, no script, no inline handlers, no external
// requests, a strict CSP, every string escaped. It works from file:// and from a folder on a USB drive.

import { esc } from "../print/html.js";

export const LAUNCHER_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";

const T = (en, es) => ({ en, es });
export const ROLES = Object.freeze({
  interactive: {
    audience: "student",
    label: T("Interactive activity", "Actividad interactiva"),
    formats: ["html", "print", "docx"],
  },
  worksheet: {
    audience: "student",
    label: T("Student worksheet", "Hoja para el estudiante"),
    formats: ["print", "html", "docx"],
  },
  scaffolded: {
    audience: "student",
    label: T("Scaffolded version", "Versión con apoyos"),
    formats: ["html", "print", "docx"],
  },
  extension: {
    audience: "student",
    label: T("Extension", "Extensión"),
    formats: ["html", "print", "docx"],
  },
  prompt: {
    audience: "student",
    label: T("Speaking or writing prompt", "Tarea para hablar o escribir"),
    formats: ["print", "html", "docx"],
  },
  check: {
    audience: "student",
    label: T("Formative check", "Verificación formativa"),
    formats: ["html", "print", "docx"],
  },
  family: {
    audience: "student",
    label: T("Family practice", "Práctica en familia"),
    formats: ["print", "html", "docx"],
  },
  key: {
    audience: "teacher",
    label: T("Answer key", "Clave de respuestas"),
    formats: ["print", "docx"],
  },
  notes: {
    audience: "teacher",
    label: T("Teacher notes", "Notas para el docente"),
    formats: ["print", "docx"],
  },
});
export const FORMAT_LABEL = Object.freeze({
  html: T("Interactive page", "Página interactiva"),
  print: T("Print version", "Versión para imprimir"),
  docx: T("Word file", "Archivo de Word"),
  combined: T("All parts in one print document", "Todas las partes en un documento"),
});

const CSS = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#f4f5f7;color:#111827;font:17px/1.55 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
main{max-width:46rem;margin:0 auto;padding:1.5rem 1rem 3rem}
h1{font-size:1.7rem;line-height:1.2;margin:0 0 .25rem}
h2{font-size:1.2rem;margin:1.8rem 0 .6rem}
.sub{color:#4b5563;margin:0 0 1rem}
.card{background:#fff;border:1px solid #9ca3af;border-radius:8px;padding:.75rem 1rem;margin:0 0 .75rem}
.card h3{font-size:1.05rem;margin:0 0 .35rem}
ul{margin:0;padding-left:1.2rem}
li{margin:.25rem 0}
a{color:#1d4ed8;text-underline-offset:3px}
a:focus-visible{outline:3px solid #111827;outline-offset:2px}
.teacher{border:2px solid #b91c1c}
.teacher h2{color:#b91c1c}
.note{font-size:.92rem;color:#374151;margin:.4rem 0 0}
.terms{display:flex;flex-wrap:wrap;gap:.4rem .6rem;list-style:none;padding:0}
.terms li{background:#fff;border:1px solid #9ca3af;border-radius:999px;padding:.1rem .7rem;margin:0}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const bi = (pair) =>
  `<span lang="en">${esc(pair.en)}</span> <span lang="es">/ ${esc(pair.es)}</span>`;
const href = (path) => esc(path.split("/").map(encodeURIComponent).join("/"));

function partCard(part) {
  const links = part.files
    .map(
      (f) =>
        `<li><a href="${href(f.path)}">${bi(FORMAT_LABEL[f.format] ?? FORMAT_LABEL.html)}</a></li>`,
    )
    .join("");
  const embeds = part.files.some((f) => f.answersEmbedded)
    ? `<p class="note">${bi(T("Self-checking page: the answers are inside the page file.", "Página con autoverificación: las respuestas están dentro del archivo de la página."))}</p>`
    : "";
  return `<section class="card"><h3>${esc(part.title)}</h3><p class="sub">${bi(part.roleLabel)}</p><ul>${links}</ul>${embeds}</section>`;
}

/**
 * @param {{title:string, generatedAt:string, objectives:string[], terms:Array<{term:string, es?:string}>,
 *   student:object[], teacher:object[], offline:boolean, combined:Array<{path:string, audience:string}>}} info
 */
export function launcherHtml(info) {
  const objectives = info.objectives.length
    ? `<h2>${bi(T("Learning goals", "Metas de aprendizaje"))}</h2><ul>${info.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>`
    : "";
  const terms = info.terms.length
    ? `<h2>${bi(T("Key words", "Palabras clave"))}</h2><ul class="terms">${info.terms.map((t) => `<li>${esc(t.term)}${t.es ? ` <span lang="es">/ ${esc(t.es)}</span>` : ""}</li>`).join("")}</ul>`
    : "";
  const offlineNote = info.offline
    ? `<p class="note">${bi(T("Everything here opens from this folder with no internet.", "Todo se abre desde esta carpeta sin internet."))}</p>`
    : `<p class="note">${bi(T("Some files may need an internet connection.", "Algunos archivos pueden necesitar conexión a internet."))}</p>`;
  const combined = (audience) =>
    info.combined
      .filter((c) => c.audience === audience)
      .map(
        (c) =>
          `<section class="card"><h3>${bi(FORMAT_LABEL.combined)}</h3><ul><li><a href="${href(c.path)}">${esc(c.path)}</a></li></ul></section>`,
      )
      .join("");
  const teacher =
    info.teacher.length || info.combined.some((c) => c.audience === "teacher")
      ? `<div class="teacher"><h2>${bi(T("Teacher only: do not share with students", "Solo para docentes: no compartir con los estudiantes"))}</h2>${info.teacher.map(partCard).join("")}${combined("teacher")}</div>`
      : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${LAUNCHER_CSP}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>${esc(info.title)}</title>
<style>${CSS}</style>
</head>
<body>
<main>
<h1>${esc(info.title)}</h1>
<p class="sub">${bi(T("Resource package", "Paquete de recursos"))} · ${esc(info.generatedAt)}</p>
${offlineNote}
${objectives}${terms}
<h2>${bi(T("For students", "Para los estudiantes"))}</h2>
${info.student.map(partCard).join("")}${combined("student")}
${teacher}
</main>
</body>
</html>
`;
}
