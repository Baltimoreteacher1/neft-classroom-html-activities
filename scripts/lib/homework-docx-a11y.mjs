/**
 * homework-docx-a11y.mjs — accessibility remediation for the publisher-sourced
 * homework Word files (`lessons/<id>/homework.docx`).
 *
 * Those files are not produced by scripts/generate-homework.mjs: they are the
 * Reveal-aligned "Session 1 HW" documents, so there is no config to regenerate
 * them from. This module is the canonical, idempotent pass that makes them
 * usable with a screen reader and ready to print:
 *
 *   - real Heading 1 / Heading 2 styles on the title and section headings
 *     (the look is copied from the publisher styles, so the page is unchanged)
 *   - internal `PUBLISHER_WORKSPACE:` tokens removed from image alt text
 *   - layout tables captioned as layout; true data tables get a header row
 *   - a real document title and `dc:language` in docProps/core.xml
 *   - the internal "Version N / Regular" labels removed from every
 *     student-visible surface (header, footer, first page)
 *
 * Running it on an already-remediated file returns the identical document.
 */
import JSZip from "jszip";

const ENTRY_DATE = new Date("2026-01-01T00:00:00Z");
const DOC = "word/document.xml";
const STYLES = "word/styles.xml";
const CORE = "docProps/core.xml";

const TBLPR_ORDER = [
  "tblStyle",
  "tblpPr",
  "tblOverlap",
  "bidiVisual",
  "tblStyleRowBandSize",
  "tblStyleColBandSize",
  "tblW",
  "jc",
  "tblCellSpacing",
  "tblInd",
  "tblBorders",
  "shd",
  "tblLayout",
  "tblCellMar",
  "tblLook",
  "tblCaption",
  "tblDescription",
];

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const textOf = (xml) =>
  xml
    .replace(/<\/w:p>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** True for the Reveal-sourced documents (they carry the legacy style part). */
export async function isPublisherSourcedDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  return Boolean(zip.file("word/stylesWithEffects.xml"));
}

/** "Lesson 3-4  ·  Session 1" -> { lesson: "3.4", session: "1" } */
export function lessonFromKicker(documentXml) {
  const m = textOf(documentXml).match(/Lesson (\d+)-(\d+)\s*[·•]\s*Session (\d+)/);
  return m ? { lesson: `${m[1]}.${m[2]}`, session: m[3] } : null;
}

export function homeworkTitle({ lesson, session }) {
  return `Lesson ${lesson} Homework — Session ${session}`;
}

// ---------- tables ----------

function splitTopLevel(inner) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (const m of inner.matchAll(/<(\/?)w:(\w+)[^>]*?(\/?)>/g)) {
    const [, closing, , selfClosing] = m;
    if (selfClosing) {
      if (depth === 0) {
        parts.push(inner.slice(start, m.index + m[0].length));
        start = m.index + m[0].length;
      }
    } else if (closing) {
      depth--;
      if (depth === 0) {
        parts.push(inner.slice(start, m.index + m[0].length));
        start = m.index + m[0].length;
      }
    } else {
      depth++;
    }
  }
  return parts;
}

function describeTables(xml) {
  const tables = [];
  const stack = [];
  for (const m of xml.matchAll(/<w:tbl>|<\/w:tbl>|<w:tr[ >]|<w:gridCol |<w:drawing>/g)) {
    const tok = m[0];
    if (tok === "<w:tbl>") {
      const info = {
        rows: 0,
        cols: 0,
        nested: false,
        drawing: false,
        start: m.index,
        gridDone: false,
      };
      if (stack.length) stack[stack.length - 1].nested = true;
      tables.push(info);
      stack.push(info);
    } else if (tok === "</w:tbl>") {
      const info = stack.pop();
      info.end = m.index + tok.length;
    } else if (tok.startsWith("<w:tr")) {
      stack[stack.length - 1].rows++;
      // A table's own grid ends at its first row; nested grids belong to nested tables.
      stack[stack.length - 1].gridDone = true;
    } else if (tok === "<w:gridCol ") {
      const top = stack[stack.length - 1];
      if (!top.gridDone) top.cols++;
    } else if (tok === "<w:drawing>") {
      for (const t of stack) t.drawing = true;
    }
  }
  for (const t of tables) t.text = textOf(xml.slice(t.start, t.end));
  return tables;
}

// A checkbox-choice list ("□ A. 7") is a column of options, not a table of data.
function isDataTable(t) {
  return t.rows >= 2 && t.cols >= 2 && !t.nested && !t.drawing && !/[□☐]/.test(t.text);
}

function tableLabel(t) {
  const ex = t.text.match(/^(\d+)\.\s/);
  if (ex) return { caption: `Exercise ${ex[1]}`, kind: "exercise" };
  if (/^REMEMBER/i.test(t.text)) return { caption: "Learn from a model", kind: "model" };
  if (t.drawing && t.rows === 1 && !t.nested) return { caption: "Workspace", kind: "workspace" };
  return { caption: "Layout", kind: "layout" };
}

function rebuildTblPr(tblPrXml, caption, description) {
  const inner = tblPrXml.replace(/^<w:tblPr>/, "").replace(/<\/w:tblPr>$/, "");
  const byName = new Map();
  for (const part of splitTopLevel(inner)) {
    const name = part.match(/^<w:(\w+)/)[1];
    if (name === "tblCaption" || name === "tblDescription") continue;
    byName.set(name, part);
  }
  byName.set("tblCaption", `<w:tblCaption w:val="${xmlEscape(caption)}"/>`);
  byName.set("tblDescription", `<w:tblDescription w:val="${xmlEscape(description)}"/>`);
  const known = TBLPR_ORDER.filter((n) => byName.has(n)).map((n) => byName.get(n));
  const extra = [...byName].filter(([n]) => !TBLPR_ORDER.includes(n)).map(([, v]) => v);
  return `<w:tblPr>${[...known, ...extra].join("")}</w:tblPr>`;
}

function markFirstRowAsHeader(tableXml) {
  const rowStart = tableXml.search(/<w:tr[ >]/);
  const rowOpenEnd = tableXml.indexOf(">", rowStart) + 1;
  const after = tableXml.slice(rowOpenEnd);
  if (after.startsWith("<w:trPr>")) {
    if (after.slice(0, after.indexOf("</w:trPr>")).includes("<w:tblHeader")) return tableXml;
    return `${tableXml.slice(0, rowOpenEnd)}<w:trPr><w:tblHeader/>${after.slice("<w:trPr>".length)}`;
  }
  return `${tableXml.slice(0, rowOpenEnd)}<w:trPr><w:tblHeader/></w:trPr>${after}`;
}

function remediateTables(xml) {
  const tables = describeTables(xml);
  let index = 0;
  let out = xml.replace(/<w:tblPr>[\s\S]*?<\/w:tblPr>/g, (tblPr) => {
    const t = tables[index++];
    if (!t) return tblPr;
    if (isDataTable(t)) {
      return rebuildTblPr(
        tblPr,
        "Data table",
        "Data table. The first row holds the column headings.",
      );
    }
    const { caption, kind } = tableLabel(t);
    const description =
      kind === "workspace"
        ? "Layout table that frames the blank workspace for this exercise."
        : "Layout table. It only arranges the page; read its cells in order.";
    return rebuildTblPr(tblPr, caption, description);
  });
  // Header-row flags on true data tables (re-describe: offsets moved).
  const dataTables = describeTables(out)
    .filter(isDataTable)
    .sort((a, b) => b.start - a.start);
  for (const t of dataTables) {
    out =
      out.slice(0, t.start) + markFirstRowAsHeader(out.slice(t.start, t.end)) + out.slice(t.end);
  }
  return out;
}

// ---------- document body ----------

const WORKSPACE_TOKEN = /^\s*PUBLISHER_WORKSPACE:\s*/;

function remediateAltText(xml) {
  return xml.replace(/(<wp:docPr\b[^>]*?)\sdescr="([^"]*)"/g, (_, head, descr) => {
    const clean = descr.replace(WORKSPACE_TOKEN, "").trim();
    return `${head} descr="${clean || "Blank workspace for this exercise"}"`;
  });
}

function dropEditionLine(xml) {
  return xml.replace(
    /<w:p(?: [^>]*)?>(?:(?!<\/w:p>)[\s\S])*?w:val="PublisherEdition"(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/g,
    "",
  );
}

function remediateDocumentXml(xml) {
  let out = dropEditionLine(xml);
  out = out.replace('<w:pStyle w:val="Title"/>', '<w:pStyle w:val="Heading1"/>');
  out = out.replace(/<w:pStyle w:val="PublisherSection"\/>/g, '<w:pStyle w:val="Heading2"/>');
  out = remediateAltText(out);
  return remediateTables(out);
}

// ---------- styles ----------

function styleBlock(xml, id) {
  const m = xml.match(new RegExp(`<w:style [^>]*w:styleId="${id}"[\\s\\S]*?</w:style>`));
  return m ? m[0] : null;
}

function copyLook(from, to, outline) {
  const pPr = from
    .match(/<w:pPr>[\s\S]*?<\/w:pPr>/)[0]
    .replace("</w:pPr>", `<w:outlineLvl w:val="${outline}"/></w:pPr>`);
  const rPr = from.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)[0];
  return to.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, pPr).replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, rPr);
}

/** Heading 1/2 take the publisher Title / Section look, so the page looks the same. */
function remediateStyles(xml) {
  const title = styleBlock(xml, "Title");
  const section = styleBlock(xml, "PublisherSection");
  const h1 = styleBlock(xml, "Heading1");
  const h2 = styleBlock(xml, "Heading2");
  if (!title || !section || !h1 || !h2) return xml;
  return xml.replace(h1, copyLook(title, h1, 0)).replace(h2, copyLook(section, h2, 1));
}

// ---------- header / footer ----------

const INTERNAL_LABEL_TAIL =
  /\s*\/\s*(?:Regular|Support|Enrichment|Level [0-9]|Standard)\s*\/\s*V\d+\s*$/;
const VERSION_TAIL = /\s*\/\s*V\d+\s*$/;

function scrubLabels(xml) {
  return xml.replace(/(<w:t(?: [^>]*)?>)([^<]*)(<\/w:t>)/g, (_, open, text, close) => {
    const cleaned = text.replace(INTERNAL_LABEL_TAIL, "").replace(VERSION_TAIL, "");
    return `${open}${cleaned}${close}`;
  });
}

// ---------- core properties ----------

function remediateCore(xml, title) {
  let out = xml.replace(
    /<dc:title>[\s\S]*?<\/dc:title>|<dc:title\/>/,
    `<dc:title>${xmlEscape(title)}</dc:title>`,
  );
  out = out.replace(
    /<dc:creator>[\s\S]*?<\/dc:creator>|<dc:creator\/>/,
    "<dc:creator>Neft Teacher</dc:creator>",
  );
  if (!/<dc:language>/.test(out)) {
    out = out.replace(
      "</cp:coreProperties>",
      "<dc:language>en-US</dc:language></cp:coreProperties>",
    );
  }
  return out;
}

async function partText(zip, name) {
  const f = zip.file(name);
  return f ? f.async("string") : "";
}

/**
 * Remediate one publisher homework .docx buffer. Returns a new Buffer.
 * Throws when the kicker ("Lesson 3-4 · Session 1") cannot be found, since the
 * document title is derived from it.
 */
export async function remediatePublisherHomework(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file(DOC).async("string");
  const kicker =
    lessonFromKicker(docXml) ?? lessonFromKicker(await partText(zip, "word/footer1.xml"));
  if (!kicker)
    throw new Error("homework docx: no 'Lesson N-M · Session S' kicker to title it from");

  const writes = new Map();
  writes.set(DOC, remediateDocumentXml(docXml));
  writes.set(STYLES, remediateStyles(await zip.file(STYLES).async("string")));
  writes.set(CORE, remediateCore(await zip.file(CORE).async("string"), homeworkTitle(kicker)));
  for (const name of Object.keys(zip.files)) {
    if (/^word\/(header|footer)\d*\.xml$/.test(name)) {
      writes.set(name, scrubLabels(await zip.file(name).async("string")));
    }
  }
  for (const [name, text] of writes) zip.file(name, text, { date: ENTRY_DATE });
  for (const name of Object.keys(zip.files)) {
    if (!writes.has(name) && !zip.files[name].dir) zip.files[name].date = ENTRY_DATE;
  }
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}

/**
 * Strip the teacher answer key page from a generated homework .docx so the
 * student-facing PDF never carries it. Returns the buffer unchanged when the
 * document has no key.
 */
export async function withoutTeacherKey(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file(DOC).async("string");
  const at = xml.indexOf("Answer Key (Teacher)");
  if (at < 0) return buffer;
  const headStart = xml.lastIndexOf("<w:p>", at);
  const breakStart = xml.lastIndexOf("<w:p>", headStart - 1);
  const keyStart = xml.slice(breakStart, headStart).includes('w:type="page"')
    ? breakStart
    : headStart;
  const bodyEnd = xml.lastIndexOf("<w:sectPr");
  zip.file(DOC, xml.slice(0, keyStart) + xml.slice(bodyEnd), { date: ENTRY_DATE });
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
