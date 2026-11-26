// Word (.docx) files for the source material workspace. A .docx is a zip of XML; this reads only word/document.xml and
// word/numbering.xml, in memory, with hard limits, and turns them into text that ingestText understands.
//
// Safety: input size, entry count, declared and actual decompressed size are all capped (zip-bomb guard); encrypted,
// corrupt and non-Word files get a plain {en, es} error; nothing is ever evaluated; XML with a DOCTYPE or ENTITY
// declaration is refused; external relationships and hyperlinks are never read or followed; embedded pictures are only
// counted (they are NOT extracted) and reported for the teacher to handle. Nothing is logged and nothing leaves the device.

import { pair } from "../core/differentiate-util.js";
import { ingestText } from "./ingest.js";

export const DOCX_LIMITS = Object.freeze({
  inputBytes: 15 * 1024 * 1024,
  entries: 2000,
  declaredTotal: 256 * 1024 * 1024,
  documentBytes: 20 * 1024 * 1024,
  numberingBytes: 2 * 1024 * 1024,
});

const ERR = {
  input: pair("No file was given.", "No se dio ningún archivo."),
  tooBig: pair(
    "This file is too large to read safely. Try a shorter document.",
    "Este archivo es demasiado grande para leerlo con seguridad. Prueba con un documento más corto.",
  ),
  bomb: pair(
    "This file expands to an unsafe size, so it was not opened.",
    "Este archivo se expande a un tamaño inseguro, así que no se abrió.",
  ),
  encrypted: pair(
    "This file is password-protected or in the old .doc format, so it cannot be read. Save it as a regular .docx without a password, or paste the text.",
    "Este archivo tiene contraseña o está en el formato antiguo .doc, así que no se puede leer. Guárdalo como .docx normal sin contraseña, o pega el texto.",
  ),
  corrupt: pair(
    "This file is damaged or is not a Word (.docx) file, so it could not be read. Try saving it again, or paste the text.",
    "Este archivo está dañado o no es un archivo de Word (.docx), así que no se pudo leer. Prueba a guardarlo de nuevo o pega el texto.",
  ),
  notWord: pair(
    "This file does not contain a Word document. Open it in Word, save it as .docx, or paste the text.",
    "Este archivo no contiene un documento de Word. Ábrelo en Word, guárdalo como .docx o pega el texto.",
  ),
  unsafe: pair(
    "This document uses XML features that are not allowed, so it was not read.",
    "Este documento usa funciones XML que no se permiten, así que no se leyó.",
  ),
  empty: pair(
    "No readable text was found in this document (it may contain only pictures).",
    "No se encontró texto legible en este documento (quizá solo tenga imágenes).",
  ),
};
const bad = (error, code) => ({ ok: false, code, error });
const refuse = (error, code) => Object.assign(new Error(code), { ingest: bad(error, code) });

function decode(chunks, size) {
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.length;
  }
  return new TextDecoder("utf-8").decode(all);
}

/** Read one zip entry with a running size cap, so a bomb stops early instead of filling memory. */
function readEntry(zip, name, cap) {
  const file = zip.file(name);
  if (!file) return Promise.resolve(null);
  const declared = file._data?.uncompressedSize;
  if (Number.isFinite(declared) && declared > cap)
    return Promise.reject(refuse(ERR.bomb, "zip-bomb"));
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    const stop = (fn, v) => {
      if (done) return;
      done = true;
      fn(v);
    };
    const stream = file.internalStream("uint8array");
    stream
      .on("data", (c) => {
        size += c.length;
        if (size > cap) {
          stream.pause();
          stop(reject, refuse(ERR.bomb, "zip-bomb"));
        } else if (!done) chunks.push(c);
      })
      .on("error", (e) => stop(reject, e))
      .on("end", () => stop(resolve, decode(chunks, size)))
      .resume();
  });
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const unescapeXml = (s) =>
  s.replace(/&(?:#x([0-9a-f]{1,6})|#(\d{1,7})|(amp|lt|gt|quot|apos));/gi, (_, hex, dec, name) => {
    if (name) return ENTITIES[name.toLowerCase()];
    const cp = hex ? Number.parseInt(hex, 16) : Number(dec);
    return cp > 31 && cp < 0x110000 && !(cp >= 0xd800 && cp < 0xe000)
      ? String.fromCodePoint(cp)
      : " ";
  });
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";

/** numId -> level -> numFmt, from word/numbering.xml (no external input, just two regex passes). */
function numberingFormats(xml) {
  const abs = new Map();
  for (const m of xml.matchAll(
    /<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g,
  )) {
    const levels = new Map();
    for (const l of m[2].matchAll(/<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/g))
      levels.set(Number(l[1]), attr(l[2].match(/<w:numFmt\b[^>]*>/)?.[0] ?? "", "w:val"));
    abs.set(m[1], levels);
  }
  const nums = new Map();
  for (const m of xml.matchAll(/<w:num\b[^>]*w:numId="(\d+)"[^>]*>([\s\S]*?)<\/w:num>/g))
    nums.set(
      m[1],
      abs.get(attr(m[2].match(/<w:abstractNumId\b[^>]*>/)?.[0] ?? "", "w:val")) ?? new Map(),
    );
  return nums;
}

const TAG =
  /<(\/?)(w:tbl|w:tr|w:tc|w:p|w:t|w:tab|w:br|w:cr|w:pStyle|w:ilvl|w:numId)(?=[\s/>])([^>]*)>/g;

/** document.xml -> [{ kind: "p"|"table", ... }] in reading order, plus a picture count. */
export function readDocument(xml) {
  const body = xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, "");
  const images =
    (body.match(/<a:blip\b/g) || []).length + (body.match(/<v:imagedata\b/g) || []).length;
  const out = [];
  const paras = [];
  let depth = 0;
  let rows = [];
  let row = [];
  let cell = [];
  TAG.lastIndex = 0;
  for (let m = TAG.exec(body); m; m = TAG.exec(body)) {
    const [, close, tag, rest] = m;
    const self = rest.trimEnd().endsWith("/");
    const p = paras.at(-1);
    if (tag === "w:t" && !close && !self) {
      const end = body.indexOf("</w:t>", TAG.lastIndex);
      if (end < 0) break;
      if (p) p.text += unescapeXml(body.slice(TAG.lastIndex, end));
      TAG.lastIndex = end + 6;
    } else if ((tag === "w:tab" || tag === "w:br" || tag === "w:cr") && !close) {
      if (p) p.text += " ";
    } else if (tag === "w:p") {
      if (close) {
        const done = paras.pop();
        if (done) {
          if (depth > 0) cell.push(done.text.trim());
          else out.push({ kind: "p", ...done });
        }
      } else if (!self) paras.push({ text: "", style: "", numId: "", ilvl: 0 });
    } else if (p && !close && tag === "w:pStyle") p.style = attr(rest, "w:val");
    else if (p && !close && tag === "w:numId") p.numId = attr(rest, "w:val");
    else if (p && !close && tag === "w:ilvl") p.ilvl = Number(attr(rest, "w:val")) || 0;
    else if (tag === "w:tbl") {
      if (!close) {
        depth++;
        if (depth === 1) rows = [];
      } else if (depth > 0 && --depth === 0) out.push({ kind: "table", rows });
    } else if (depth === 1 && tag === "w:tr") {
      if (!close) row = [];
      else rows.push(row);
    } else if (depth === 1 && tag === "w:tc") {
      if (!close) cell = [];
      else row.push(cell.join(" ").trim());
    }
  }
  return { elements: out, images };
}

const HEADING = /^(?:heading\s*(\d)|title)$/i;
const letters = (n) => String.fromCharCode(96 + (((n - 1) % 26) + 1));

/** Rendered text, with heading line numbers: list numbers and letters are written out so ingestText sees "1." / "a)". */
function render(elements, formats) {
  const lines = [];
  const headings = new Map();
  const counters = new Map();
  let prev = "";
  const blank = () => {
    if (lines.length && lines.at(-1) !== "") lines.push("");
  };
  const listy = /^\s*(?:\d{1,2}[).:]|[A-Ha-h][).:]|[-*•]|(?:answer|ans|respuesta)\s*[:=])\s*\S/i;
  for (const el of elements) {
    if (el.kind === "table") {
      blank();
      for (const r of el.rows)
        if (r.some(Boolean)) lines.push(r.map((c) => c.replace(/[\t\r\n]+/g, " ")).join("\t"));
      blank();
      prev = "";
      continue;
    }
    let text = el.text.trim().replace(/\s+/g, " ");
    if (!text) continue;
    const head = el.style.replace(/\s+/g, "").match(HEADING);
    if (head) {
      blank();
      lines.push(text);
      headings.set(lines.length, Number(head[1]) || 1);
      blank();
      prev = "";
      continue;
    }
    if (el.numId) {
      const fmt = formats.get(el.numId)?.get(el.ilvl) ?? "";
      const key = el.numId;
      const levels = counters.get(key) ?? [];
      levels[el.ilvl] = (levels[el.ilvl] || 0) + 1;
      levels.length = el.ilvl + 1;
      counters.set(key, levels);
      const n = levels[el.ilvl];
      if (fmt === "decimal") text = `${n}. ${text}`;
      else if (fmt === "lowerLetter" || fmt === "upperLetter") text = `${letters(n)}) ${text}`;
      else if (fmt === "bullet" || fmt === "") text = `- ${text}`;
      else text = `${n}. ${text}`;
    }
    if (!(listy.test(text) && listy.test(prev))) blank();
    lines.push(text);
    prev = text;
  }
  return { text: lines.join("\n"), headings };
}

/** The browser passes the vendored global JSZip; Node falls back to the installed package. */
async function loadJSZip(injected) {
	return injected || globalThis.JSZip || (await import("jszip")).default;
}

/**
 * Read a .docx. @param {ArrayBuffer|Uint8Array} input  @param {{filename?: string, limits?: object}} opts
 * @returns {Promise<object>} the ingestText result (plus provenance.images), or { ok: false, code, error }
 */
export async function ingestDocx(input, opts = {}) {
  const lim = { ...DOCX_LIMITS, ...opts.limits };
  const bytes = input instanceof Uint8Array ? input : input ? new Uint8Array(input) : null;
  if (!bytes?.length) return bad(ERR.input, "no-file");
  if (bytes.length > lim.inputBytes) return bad(ERR.tooBig, "too-big");
  const head = [...bytes.slice(0, 4)];
  if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0)
    return bad(ERR.encrypted, "encrypted");
  if (!(head[0] === 0x50 && head[1] === 0x4b)) return bad(ERR.corrupt, "corrupt");
  try {
    const JSZip = await loadJSZip(opts.JSZip);
    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files);
    const declared = names.reduce((a, n) => a + (zip.files[n]._data?.uncompressedSize || 0), 0);
    if (names.length > lim.entries || declared > lim.declaredTotal)
      return bad(ERR.bomb, "zip-bomb");
    const xml = await readEntry(zip, "word/document.xml", lim.documentBytes);
    if (xml == null) return bad(ERR.notWord, "not-word");
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return bad(ERR.unsafe, "unsafe-xml");
    const numXml = await readEntry(zip, "word/numbering.xml", lim.numberingBytes);
    if (numXml && /<!DOCTYPE|<!ENTITY/i.test(numXml)) return bad(ERR.unsafe, "unsafe-xml");
    const { elements, images } = readDocument(xml);
    const { text, headings } = render(elements, numXml ? numberingFormats(numXml) : new Map());
    const result = ingestText(text, {
      filename: opts.filename,
      type: "docx",
      bytes: bytes.length,
      hints: { headings, tabsAreTables: true },
    });
    if (!result.ok) return bad(ERR.empty, "empty");
    result.provenance.images = images;
    result.provenance.lineBasis = "extracted-text";
    if (images)
      result.review.push({
        id: `rv${result.review.length + 1}`,
        itemId: "",
        code: "images",
        lines: null,
        reason: pair(
          `This file has ${images} picture${images === 1 ? "" : "s"}. Pictures are not copied from uploaded files. Add the ones you need yourself and write what each shows.`,
          `Este archivo tiene ${images === 1 ? "1 imagen" : `${images} imágenes`}. Las imágenes no se copian de los archivos subidos. Agrega tú las que necesites y escribe qué muestra cada una.`,
        ),
      });
    return result;
  } catch (e) {
    if (e?.ingest) return e.ingest;
    return /encrypted/i.test(String(e?.message))
      ? bad(ERR.encrypted, "encrypted")
      : bad(ERR.corrupt, "corrupt");
  }
}
