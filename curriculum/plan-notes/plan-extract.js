/* plan-extract.js — turn a dropped file (or pasted text) into annotatable pages.
 *
 * Everything here runs in the browser. Plan documents are district material and
 * there is no reason for their bytes to make a round trip just to be read.
 *
 * The vendored pdf.js and jszip already on this site are reused rather than
 * copied: /teacher-tools/lesson-plan-generator/vendor/ is where they live, and
 * a second copy would be 3 MB of duplicate that audit:duplicates would rightly
 * flag. Both are lazy-loaded, so a teacher who only ever pastes text never
 * downloads either.
 */

const PDF_MJS = "/teacher-tools/lesson-plan-generator/vendor/pdf.min.mjs";
const PDF_WORKER = "/teacher-tools/lesson-plan-generator/vendor/pdf.worker.min.mjs";
const JSZIP_JS = "/teacher-tools/lesson-plan-generator/vendor/jszip.min.js";

/** Content hash — the identity of a plan. Same file, same notes, always. */
export async function sha256Hex(arrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  // Chunked: String.fromCharCode(...bytes) blows the argument limit on anything
  // over ~100 KB, which every real plan is.
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

let jszipPromise = null;
function loadJsZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (!jszipPromise) {
    jszipPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = JSZIP_JS;
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => {
        jszipPromise = null;
        reject(new Error("The .docx reader could not load. Paste the plan text instead."));
      };
      document.head.appendChild(s);
    });
  }
  return jszipPromise;
}

function docxParagraphText(chunk) {
  const runs = chunk.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  return runs
    .map((r) => r.replace(/<[^>]+>/g, ""))
    .join("")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function extractDocx(arrayBuffer) {
  const JSZip = await loadJsZip();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("That .docx has no readable document body.");
  const xml = await entry.async("string");
  const paras = xml
    .split(/<\/w:p>/)
    .map(docxParagraphText)
    .filter(Boolean);
  const text = paras.join("\n");
  if (!text) throw new Error("That .docx contained no readable text.");
  // A Word file has no page boundaries until it is laid out, so the whole
  // document is page 1. Quote anchoring carries the weight here, which is why
  // quote match is the primary strategy and page only the fallback.
  return { text, pages: [{ page: 1, text }] };
}

async function extractPdf(arrayBuffer, onProgress) {
  let pdfjs;
  try {
    pdfjs = await import(PDF_MJS);
  } catch {
    throw new Error("The PDF reader could not load. Paste the plan text instead.");
  }
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
  } catch {
    /* worker is optional; pdf.js falls back to the main thread */
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Rebuild real lines from the hasEOL markers, so "Warm-Up: 5 min" survives
    // as its own line instead of dissolving into a page-long run-on. Anchoring
    // quotes are only as good as the line structure they come from.
    const lines = [];
    let line = [];
    for (const it of content.items) {
      if (it.str?.trim()) line.push(it.str.trim());
      if (it.hasEOL && line.length) {
        lines.push(line.join(" "));
        line = [];
      }
    }
    if (line.length) lines.push(line.join(" "));
    const txt = lines
      .join("\n")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (txt) pages.push({ page: p, text: txt });
    onProgress?.(p, doc.numPages);
  }
  if (!pages.length) {
    throw new Error(
      "That PDF has no text layer — it is a scan. Paste the plan text instead, or export a text PDF.",
    );
  }
  return {
    text: pages.map((pg) => `--- Page ${pg.page} ---\n${pg.text}`).join("\n\n"),
    pages,
    pageCount: doc.numPages,
  };
}

function extractPlainText(text) {
  const clean = String(text || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!clean) throw new Error("There was no text to read.");
  return { text: clean, pages: [{ page: 1, text: clean }] };
}

/**
 * Read one file into { text, pages, sha256, mime, filename, pageCount }.
 * `pages` is what anchoring relocates against; `text` is what the model reads.
 */
export async function extractFile(file, onProgress) {
  const buf = await file.arrayBuffer();
  const sha = await sha256Hex(buf);
  const name = file.name || "plan";
  const lower = name.toLowerCase();

  let out;
  if (lower.endsWith(".pdf") || file.type === "application/pdf") {
    out = await extractPdf(buf, onProgress);
  } else if (lower.endsWith(".docx")) {
    out = await extractDocx(buf);
  } else if (lower.endsWith(".txt") || lower.endsWith(".md") || file.type.startsWith("text/")) {
    out = extractPlainText(new TextDecoder().decode(buf));
  } else {
    throw new Error(`${name}: only PDF, DOCX, TXT and MD plans can be read.`);
  }

  return {
    ...out,
    sha256: sha,
    filename: name,
    mime: file.type || "application/octet-stream",
    bytes: buf.byteLength,
    buffer: buf,
    pageCount: out.pageCount ?? out.pages.length,
  };
}

/** Pasted text gets the same shape, hashed on its own content. */
export async function extractPastedText(text, label) {
  const out = extractPlainText(text);
  const buf = new TextEncoder().encode(out.text).buffer;
  return {
    ...out,
    sha256: await sha256Hex(buf),
    filename: label || "Pasted plan",
    mime: "text/plain",
    bytes: buf.byteLength,
    buffer: buf,
    pageCount: 1,
  };
}

/**
 * Suggest a repo lesson for a plan, from the filename and the opening text.
 * Returns the best candidate with a confidence, or null. Never auto-applies —
 * a wrong link routes notes to the wrong lesson and quietly poisons the rollup,
 * so the answer is always a suggestion the teacher confirms.
 */
export function suggestLesson(extracted, lessons) {
  const hay = `${extracted.filename}\n${extracted.text.slice(0, 1500)}`.toLowerCase();
  let best = null;

  for (const l of lessons) {
    let score = 0;
    // "4-4", "4.4", "Lesson 4-4", "Unit 4 Lesson 4"
    const idPatterns = [
      new RegExp(`\\b${l.unit}\\s*[-–.]\\s*${l.lesson}\\b`),
      new RegExp(`lesson\\s*${l.unit}\\s*[-–.]?\\s*${l.lesson}\\b`),
      new RegExp(`unit\\s*${l.unit}\\b[\\s\\S]{0,40}lesson\\s*${l.lesson}\\b`),
    ];
    if (idPatterns.some((re) => re.test(hay))) score += 6;

    const title = l.title.toLowerCase();
    if (title.length > 6 && hay.includes(title)) score += 5;
    else {
      // Partial title credit, but only for words that carry meaning. "the" and
      // "of" match every plan ever written.
      const words = title.split(/\s+/).filter((w) => w.length > 4);
      const hits = words.filter((w) => hay.includes(w)).length;
      if (words.length && hits) score += Math.min(3, (hits / words.length) * 3);
    }
    if (l.standard && hay.includes(l.standard.toLowerCase())) score += 4;

    if (score > 0 && (!best || score > best.score)) best = { lesson: l, score };
  }

  // Below this, the evidence is one weak title word and a coincidence. Offering
  // nothing is better than offering a wrong link that looks authoritative.
  if (!best || best.score < 4) return null;
  return {
    lessonId: best.lesson.id,
    title: best.lesson.title,
    confidence: best.score >= 9 ? "high" : best.score >= 6 ? "medium" : "low",
  };
}
