// Complete resource packages: a ZIP holding, for each chosen part, a standalone interactive page, a printable page
// and/or an already-rendered Word file, plus a manifest (package.json, lp-package/1) and a local launcher
// (index.html). Student files live in student/, teacher files (answer keys, notes) only in teacher/.
//
//   buildPackage(selection, deps)  -> Promise<{ zip: Uint8Array, manifest, review, offline, validation }>
//   combinedPrintHtml(parts, opts) -> one print document for a combined PDF
//   validatePackage(zipBytes)      -> Promise<{ ok, offline, errors, offenders, missing, manifest, files }>
//
// Pure: the date comes in as `deps.generatedAt`, never from the clock; Word buffers come in as `deps.docx`; the
// player bundle comes in as `deps.js` / `deps.css` (the same two files editor/preview.js loads).

import { marksOf } from "../core/check.js";
import { normalizeActivity } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";
import { exportActivityHtml } from "../export/html.js";
import { printCss } from "../print/css.js";
import { esc } from "../print/html.js";
import { tr } from "../print/strings.js";
import { renderWorksheetParts } from "../print/worksheet.js";
import { launcherHtml, ROLES } from "./package-launcher.js";
import { htmlText } from "./package-scan.js";
import { MANIFEST_SCHEMA, validatePackage } from "./package-validate.js";
import { getJSZip } from "./package-zip.js";

export { MANIFEST_SCHEMA, validatePackage };
export { ROLES };

export const PACKAGE_LIMITS = Object.freeze({ parts: 24, title: 120 });
const ID = /^[a-z][a-z0-9-]{0,31}$/;
const DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const enc = new TextEncoder();

export class PackageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PackageError";
    this.code = code;
  }
}
const fail = (code, message) => {
  throw new PackageError(code, message);
};
const pair = (en, es) => ({ en, es });

// ── inputs ───────────────────────────────────────────────────────────────────

/** A standalone package has no site to load pictures from: keep data: images, drop same-site paths (and say so). */
function withoutSiteImages(activity) {
  let dropped = 0;
  const keep = (img) => {
    if (img && img.src && !String(img.src).startsWith("data:")) {
      dropped++;
      return { ...img, src: "" };
    }
    return img;
  };
  const blocks = activity.blocks.map((b) => {
    if (b.type === "image") return keep(b);
    if (b.type === "question") return { ...b, image: b.image ? keep(b.image) : b.image };
    if (b.type === "vocab")
      return {
        ...b,
        items: b.items.map((v) => ({ ...v, image: v.image ? keep(v.image) : v.image })),
      };
    return b;
  });
  return { activity: { ...activity, blocks }, dropped };
}

function cleanPart(p, i, review) {
  const where = `parts[${i}]`;
  if (!p || typeof p !== "object") fail("bad-part", `${where} must be an object.`);
  if (!ID.test(p.id ?? ""))
    fail(
      "bad-part-id",
      `${where}.id must be lowercase letters, digits and hyphens, starting with a letter (32 characters at most).`,
    );
  const role = ROLES[p.role];
  if (!role)
    fail("bad-role", `${where}.role "${p.role}" is not one of: ${Object.keys(ROLES).join(", ")}.`);
  if (p.activity?.schema !== "lp-activity/1")
    fail("bad-activity", `${where}.activity must be an lp-activity/1.`);
  const formats = [
    ...new Set(Array.isArray(p.formats) ? p.formats : [p.format ?? role.formats[0]]),
  ];
  if (!formats.length) fail("no-format", `${where} needs at least one format.`);
  for (const f of formats)
    if (!role.formats.includes(f))
      fail(
        "bad-format",
        `${where}: a ${p.role} part can be ${role.formats.join(", ")}, not "${f}".`,
      );
  const normal = normalizeActivity(structuredClone(p.activity));
  const check = validateActivity(normal);
  if (!check.ok)
    fail(
      "invalid-activity",
      `${where} (${p.id}) cannot be packaged: ${check.errors.map((e) => e.message).join(" ")}`,
    );
  const { activity, dropped } = withoutSiteImages(normal);
  if (dropped)
    review.push(
      pair(
        `Part "${p.id}": ${dropped} picture(s) from the site were left out because the package has to work without internet.`,
        `Parte "${p.id}": se omitieron ${dropped} imagen(es) del sitio porque el paquete debe funcionar sin internet.`,
      ),
    );
  return {
    id: p.id,
    role: p.role,
    audience: role.audience,
    label: role.label,
    formats,
    activity,
    title: normal.title,
  };
}

// ── leak guard: teacher-only text must not appear in a student file ──────────

const longEnough = (s) => typeof s === "string" && s.trim().length >= 4;
/** Teacher-only text. `answers` adds the answers and explanations that a student print copy must also never show. */
function teacherOnly(a, answers) {
  const out = [a.notes.teacher, ...a.notes.misconceptions, a.context.source.note];
  for (const b of a.blocks) {
    if (b.type === "note") out.push(b.text);
    if (b.type !== "question" || !answers) continue;
    out.push(b.explanation, b.misconception, b.sample, ...(b.rubric ?? []));
    if (b.format === "number") out.push(b.answer);
    if (b.format === "blank" && !b.bank) for (const m of marksOf(b.text)) out.push(...m.answers);
  }
  return out.filter(longEnough).map((t) => t.trim());
}
function assertNoLeak(part, path, html, answers) {
  const text = htmlText(html);
  const json = html.toLowerCase();
  for (const token of teacherOnly(part.activity, answers)) {
    const t = token.toLowerCase().replace(/\s+/g, " ");
    const escaped = t.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
    if (text.includes(t) || json.includes(t) || json.includes(escaped))
      fail(
        "answer-leak",
        `Teacher-only text from part "${part.id}" would appear in the student file ${path}. Nothing was packaged.`,
      );
  }
}

// ── docx ─────────────────────────────────────────────────────────────────────

async function checkDocx(JSZip, id, bytes) {
  if (!(bytes instanceof Uint8Array))
    fail("bad-docx", `deps.docx["${id}"] must be a Uint8Array (a rendered Word file).`);
  try {
    const doc = await JSZip.loadAsync(bytes);
    if (!doc.file("word/document.xml")) throw new Error("no document.xml");
  } catch {
    fail("bad-docx", `deps.docx["${id}"] is not a valid Word document.`);
  }
  return bytes;
}

// ── combined print document ──────────────────────────────────────────────────

const mainOf = (html) => {
  const m = /<main>([\s\S]*)<\/main>/.exec(html);
  if (!m) fail("print-shape", "The print renderer's output changed shape: no <main> element.");
  return m[1];
};
/** Two parts in one document must not share ids: prefix every id and every reference to one. */
function namespaced(html, prefix) {
  return html
    .replace(/\b(id|for)="([^"]*)"/g, (_, k, v) => `${k}="${prefix}${v}"`)
    .replace(
      /\b(aria-labelledby|aria-describedby)="([^"]*)"/g,
      (_, k, v) =>
        `${k}="${v
          .split(/\s+/)
          .map((x) => prefix + x)
          .join(" ")}"`,
    )
    .replace(/\bhref="#([^"]*)"/g, (_, v) => `href="#${prefix}${v}"`);
}

/**
 * ONE print document for a combined PDF. Student parts come first, one heading per part, a page break between
 * parts. Answer keys and notes (the `key` and `notes` roles) are never mixed in: `keys` is "exclude" (default),
 * "append" (student parts, then a separate answer-key section) or "only" (just that section, for teacher/).
 * @param {Array<{id?:string, role?:string, title?:string, activity:object}>} parts
 * @param {{lang?:"en"|"es"|"bi", keys?:"exclude"|"append"|"only", title?:string}} [opts]
 */
export function combinedPrintHtml(parts, opts = {}) {
  const lang = opts.lang === "es" || opts.lang === "bi" ? opts.lang : "en";
  const keys = opts.keys ?? "exclude";
  if (!["exclude", "append", "only"].includes(keys))
    fail("bad-keys", 'keys must be "exclude", "append" or "only".');
  if (!Array.isArray(parts) || !parts.length)
    fail("no-parts", "combinedPrintHtml needs at least one part.");
  const students = [];
  const teachers = [];
  parts.forEach((p, i) => {
    const role = ROLES[p.role ?? "worksheet"];
    if (!role) fail("bad-role", `parts[${i}].role "${p.role}" is not a known role.`);
    const a = normalizeActivity(structuredClone(p.activity));
    (role.audience === "teacher" ? teachers : students).push({
      id: p.id ?? `p${i + 1}`,
      a,
      title: p.title ?? a.title,
    });
  });
  const section = (item, part, n) =>
    namespaced(mainOf(renderWorksheetParts(item.a, { part, lang }).html), `p${n}-`).replace(
      /<section class="sheet /,
      '<section class="sheet partstart ',
    );
  let body = "";
  let n = 0;
  if (keys !== "only") {
    if (!students.length) fail("no-student-parts", "There are no student parts to print.");
    for (const s of students) body += section(s, "student", ++n);
  }
  const withKeys = keys !== "exclude";
  if (withKeys) {
    // explicit key/notes parts win; with none, each student part gets its own key
    const list = teachers.length ? teachers : students;
    const label = tr(lang === "es" ? "es" : "en", "teacherCopy");
    const answer = tr(lang === "es" ? "es" : "en", "answerKey");
    body += `<section class="sheet key partstart" aria-labelledby="keys-title"><div class="banner"><span id="keys-title">${esc(label)}: ${esc(answer)}</span><span>${esc(tr(lang === "es" ? "es" : "en", "notForStudents"))}</span></div><h2>${esc(answer)}</h2><ol>${list.map((x) => `<li>${esc(x.title)}</li>`).join("")}</ol></section>`;
    for (const t of list) body += section(t, "key", ++n);
  }
  const title = String(opts.title ?? parts[0].title ?? students[0]?.title ?? "Resources").slice(
    0,
    120,
  );
  const css = `${printCss({ title, accent: "", keyLabel: tr("en", "teacherCopy"), pageWord: tr(lang === "es" ? "es" : "en", "page"), ofWord: tr(lang === "es" ? "es" : "en", "of"), withKey: withKeys })}\n.sheet.partstart{break-before:page}.sheet.partstart:first-child{break-before:auto}`;
  return `<!doctype html>
<html lang="${lang === "es" ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>${css}</style>
</head>
<body class="part-${withKeys ? "all" : "student"}">
<main>${body}</main>
</body>
</html>
`;
}

// ── the package ──────────────────────────────────────────────────────────────

const dedupe = (list, key) => {
  const seen = new Set();
  return list.filter((x) => {
    const k = key(x).toLowerCase();
    return k && !seen.has(k) && seen.add(k);
  });
};

/**
 * @param {{title:string, lang?:"en"|"es"|"bi", objectives?:string[], terms?:Array<string|{term:string,es?:string}>,
 *   parts:Array<{id:string, role:string, activity:object, formats?:string[], format?:string, title?:string}>,
 *   combined?:{student?:boolean, keys?:boolean}}} selection
 * @param {{generatedAt:string, js?:string, css?:string, docx?:Record<string, Uint8Array>, JSZip?:object}} deps
 *   `JSZip`: an injected implementation; default globalThis.JSZip, else the "jszip" package (Node)
 */
export async function buildPackage(selection, deps = {}) {
  if (!selection || typeof selection !== "object") fail("bad-selection", "selection is required.");
  const title = String(selection.title ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title || title.length > PACKAGE_LIMITS.title)
    fail("bad-title", `title is required (at most ${PACKAGE_LIMITS.title} characters).`);
  if (!DATE.test(deps.generatedAt ?? "") || Number.isNaN(Date.parse(deps.generatedAt)))
    fail(
      "bad-date",
      "deps.generatedAt must be an ISO date such as 2026-11-26 (the package never reads the clock).",
    );
  const lang = ["en", "es", "bi"].includes(selection.lang) ? selection.lang : "en";
  const list = selection.parts;
  if (!Array.isArray(list) || !list.length) fail("no-parts", "Choose at least one part.");
  if (list.length > PACKAGE_LIMITS.parts)
    fail("too-many-parts", `A package holds at most ${PACKAGE_LIMITS.parts} parts.`);
  const JSZip = await getJSZip(deps.JSZip);
  const review = [];
  const parts = list.map((p, i) => cleanPart(p, i, review));
  const ids = new Set();
  for (const p of parts) {
    if (ids.has(p.id)) fail("duplicate-part", `Two parts are called "${p.id}".`);
    ids.add(p.id);
  }
  const needsPlayer = parts.some((p) => p.formats.includes("html"));
  if (needsPlayer && (!deps.js || !deps.css))
    fail("no-player", "Interactive pages need deps.js and deps.css (the built player).");

  // JSZip writes DOS times from LOCAL components; shift so the bytes do not depend on the machine's time zone
  const utc = new Date(deps.generatedAt);
  const stamp = new Date(utc.getTime() + utc.getTimezoneOffset() * 60000);
  const files = new Map(); // path -> { data: string|Uint8Array, audience, format, answersEmbedded }
  const put = (path, data, meta) => {
    if (files.has(path)) fail("duplicate-file", `Two files would be written to ${path}.`);
    files.set(path, { data, ...meta });
  };
  const info = parts.map((p) => ({
    id: p.id,
    role: p.role,
    roleLabel: p.label,
    audience: p.audience,
    title: p.title,
    files: [],
  }));
  for (const [i, p] of parts.entries()) {
    const folder = p.audience === "teacher" ? "teacher" : "student";
    const add = (path, data, format, extra = {}) => {
      put(path, data, { audience: p.audience, format, ...extra });
      info[i].files.push({ path, format, answersEmbedded: Boolean(extra.answersEmbedded) });
    };
    for (const format of p.formats) {
      if (format === "html") {
        const html = exportActivityHtml(p.activity, { js: deps.js, css: deps.css, lang });
        assertNoLeak(p, `${folder}/${p.id}.html`, html, false);
        add(`${folder}/${p.id}.html`, html, "html", { answersEmbedded: true });
        review.push(
          pair(
            `Part "${p.id}": the interactive page checks answers itself, so the answers are inside the page file. Hand it out only when self-checking is intended; use the print version for a copy without answers.`,
            `Parte "${p.id}": la página interactiva verifica las respuestas por sí misma, así que las respuestas están dentro del archivo. Entréguela solo si se quiere autoverificación; use la versión impresa para una copia sin respuestas.`,
          ),
        );
      } else if (format === "print") {
        const html = renderWorksheetParts(p.activity, {
          part: p.audience === "teacher" ? "key" : "student",
          lang,
        }).html;
        if (p.audience === "student") assertNoLeak(p, `${folder}/${p.id}-print.html`, html, true);
        add(`${folder}/${p.id}-print.html`, html, "print");
      } else add(`${folder}/${p.id}.docx`, await checkDocx(JSZip, p.id, deps.docx?.[p.id]), "docx");
    }
  }
  for (const id of Object.keys(deps.docx ?? {}))
    if (!parts.some((p) => p.id === id && p.formats.includes("docx")))
      fail(
        "stray-docx",
        `deps.docx has a file for "${id}", which is not a part with the docx format.`,
      );

  const combined = [];
  const studentParts = parts.filter((p) => p.audience === "student");
  if (selection.combined?.student) {
    if (!studentParts.length)
      fail("no-student-parts", "combined.student needs at least one student part.");
    const html = combinedPrintHtml(studentParts, { lang, title });
    put("student/all-print.html", html, { audience: "student", format: "combined" });
    combined.push({
      path: "student/all-print.html",
      audience: "student",
      includes: studentParts.map((p) => p.id),
    });
  }
  if (selection.combined?.keys) {
    const all = [...studentParts, ...parts.filter((p) => p.audience === "teacher")];
    const html = combinedPrintHtml(all, { lang, title, keys: "only" });
    put("teacher/all-keys-print.html", html, { audience: "teacher", format: "combined" });
    combined.push({
      path: "teacher/all-keys-print.html",
      audience: "teacher",
      includes: all.map((p) => p.id),
    });
  }

  // shared objectives and terms come from the activities themselves, plus anything the teacher added
  const objectives = dedupe(
    [
      ...(selection.objectives ?? []),
      ...parts.filter((p) => p.audience === "student").map((p) => p.activity.context.objective),
    ].map((s) => String(s ?? "").trim()),
    (s) => s,
  );
  const terms = dedupe(
    [
      ...(selection.terms ?? []),
      ...parts.flatMap((p) =>
        p.activity.blocks
          .filter((b) => b.type === "vocab")
          .flatMap((b) => b.items.map((v) => ({ term: v.term, es: v.es }))),
      ),
    ].map((t) =>
      typeof t === "string"
        ? { term: t.trim() }
        : { term: String(t.term ?? "").trim(), ...(t.es ? { es: String(t.es).trim() } : {}) },
    ),
    (t) => t.term,
  );

  const assemble = async (offline) => {
    const all = new Map(files);
    const launcher = launcherHtml({
      title,
      generatedAt: deps.generatedAt,
      objectives,
      terms,
      offline,
      student: info.filter((p) => p.audience === "student"),
      teacher: info.filter((p) => p.audience === "teacher"),
      combined,
    });
    all.set("index.html", { data: launcher, audience: "student", format: "launcher" });
    const size = (d) => (typeof d === "string" ? enc.encode(d).length : d.length);
    const manifest = {
      schema: MANIFEST_SCHEMA,
      title,
      generatedAt: deps.generatedAt,
      lang,
      objectives,
      terms,
      parts: info.map((p) => ({
        id: p.id,
        role: p.role,
        audience: p.audience,
        title: p.title,
        files: p.files.map((f) => ({
          path: f.path,
          format: f.format,
          answersEmbedded: f.answersEmbedded,
        })),
      })),
      combined,
      files: [...all.entries()]
        .map(([path, f]) => ({
          path,
          bytes: size(f.data),
          audience: path === "index.html" ? "launcher" : f.audience,
          format: f.format,
        }))
        .sort((a, b) => (a.path < b.path ? -1 : 1)),
    };
    const zip = new JSZip();
    const add = (path, data) =>
      zip.file(path, data, {
        date: stamp,
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
        createFolders: false,
      });
    add("package.json", `${JSON.stringify(manifest, null, 2)}\n`);
    for (const path of [...all.keys()].sort()) add(path, all.get(path).data);
    const bytes = await zip.generateAsync({ type: "uint8array", platform: "UNIX" });
    return { bytes, manifest, validation: await validatePackage(bytes, { JSZip }) };
  };
  let built = await assemble(true);
  if (!built.validation.offline) built = await assemble(false); // never claim "offline" in the launcher when it is not
  const { validation } = built;
  if (!validation.ok)
    fail(
      "self-check",
      `The package failed its own check: ${validation.errors.map((e) => `${e.code}${e.path ? ` (${e.path})` : ""}`).join(", ")}.`,
    );
  if (!validation.offline)
    review.push(
      pair(
        `The package may need internet: ${[...new Set(validation.offenders.map((o) => `${o.file} -> ${o.url}`))].slice(0, 5).join("; ")}${validation.missing.length ? `; ${validation.missing.length} missing local file(s)` : ""}.`,
        `El paquete puede necesitar internet: ${[...new Set(validation.offenders.map((o) => `${o.file} -> ${o.url}`))].slice(0, 5).join("; ")}${validation.missing.length ? `; faltan ${validation.missing.length} archivo(s) locales` : ""}.`,
      ),
    );
  return {
    zip: built.bytes,
    manifest: built.manifest,
    review,
    offline: validation.offline,
    validation,
  };
}
