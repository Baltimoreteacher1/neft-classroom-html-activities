// File readers for the import wizard. Everything runs in the browser on the teacher's device: nothing is
// uploaded, and there is no OCR or AI service. XLSX: the first worksheet of a standard Office Open XML file
// (ZIP + XML), read with the browser's own DecompressionStream. PDF: the text layer of a digitally generated
// score report (FlateDecode streams, Tj/TJ strings); scanned PDFs have no text layer and are refused with a
// message. Extracted values are never trusted: they go to the review step like any other import.

const td = new TextDecoder();

async function inflateRaw(bytes) {
  const ds = new DecompressionStream("deflate-raw");
  const out = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(out).arrayBuffer());
}
async function inflate(bytes) {
  const ds = new DecompressionStream("deflate");
  const out = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Entries of a ZIP archive from its central directory: Map(name -> async () => Uint8Array). */
export function zipEntries(buf) {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--)
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  if (eocd < 0) throw new Error("This is not an .xlsx file (no ZIP directory found).");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("The .xlsx file is damaged.");
    const method = dv.getUint16(p + 10, true);
    const size = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = td.decode(u8.subarray(p + 46, p + 46 + nameLen));
    entries.set(name, async () => {
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const data = u8.subarray(start, start + size);
      if (method === 0) return data;
      if (method === 8) return inflateRaw(data);
      throw new Error(`Unsupported compression in ${name}.`);
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

const colIndex = (ref) => {
  const letters = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** First worksheet of an .xlsx file as rows of strings. Needs DOMParser (browser). */
export async function readXlsx(buf) {
  const zip = zipEntries(buf);
  const text = async (name) => (zip.has(name) ? td.decode(await zip.get(name)()) : null);
  const parse = (xml) => new DOMParser().parseFromString(xml, "application/xml");
  const shared = [];
  const ss = await text("xl/sharedStrings.xml");
  if (ss)
    for (const si of parse(ss).getElementsByTagName("si"))
      shared.push([...si.getElementsByTagName("t")].map((t) => t.textContent).join(""));
  const sheetName = [...zip.keys()]
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort()[0];
  if (!sheetName) throw new Error("The workbook has no worksheet.");
  const doc = parse(await text(sheetName));
  const rows = [];
  for (const r of doc.getElementsByTagName("row")) {
    const row = [];
    for (const c of r.getElementsByTagName("c")) {
      const ref = c.getAttribute("r") || "";
      const t = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
      const value =
        t === "s"
          ? (shared[Number(v)] ?? "")
          : t === "inlineStr"
            ? [...c.getElementsByTagName("t")].map((x) => x.textContent).join("")
            : v;
      row[ref ? colIndex(ref) : row.length] = value;
    }
    rows.push(Array.from(row, (x) => (x == null ? "" : String(x))));
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

function pdfString(s) {
  return s.replace(/\\([nrtbf()\\]|\d{1,3})/g, (_, e) =>
    /\d/.test(e)
      ? String.fromCharCode(Number.parseInt(e, 8))
      : ({ n: "\n", r: "\r", t: "\t", b: "", f: "" }[e] ?? e),
  );
}

/** Text of the content streams of a digitally generated PDF. Returns "" when nothing readable is found. */
export async function readPdfText(buf) {
  const u8 = new Uint8Array(buf);
  const latin = new TextDecoder("latin1").decode(u8);
  const parts = [];
  const re = /<<([^]*?)>>\s*stream\r?\n/g;
  let m;
  while ((m = re.exec(latin))) {
    const start = m.index + m[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) break;
    let data = u8.subarray(start, end);
    if (/FlateDecode/.test(m[1])) {
      try {
        data = await inflate(data);
      } catch {
        continue;
      }
    } else if (/Filter/.test(m[1])) continue;
    const content = new TextDecoder("latin1").decode(data);
    const lines = [];
    const tok = /\[((?:\\.|[^\]])*)\]\s*TJ|\(((?:\\.|[^)])*)\)\s*(?:Tj|'|")|(T\*|Td|TD|ET)/g;
    let t;
    let line = "";
    while ((t = tok.exec(content))) {
      if (t[1] != null)
        line += [...t[1].matchAll(/\(((?:\\.|[^)])*)\)/g)].map((x) => pdfString(x[1])).join("");
      else if (t[2] != null) line += pdfString(t[2]);
      else if (line) {
        lines.push(line);
        line = "";
      }
    }
    if (line) lines.push(line);
    if (lines.length) parts.push(lines.join("\n"));
  }
  return parts
    .join("\n")
    .replace(/[^\x20-\x7e\n]/g, " ")
    .trim();
}

/**
 * Pull domain and composite scores out of score-report TEXT (from a PDF text layer or pasted by the teacher).
 * Looks for a label followed by a scale score (3 digits) and/or a level (d.d). Returns a draft for the
 * review step; anything it cannot find is left blank, never guessed.
 */
export function scoresFromReportText(text) {
  const labels = {
    Listening: /listening/i,
    Speaking: /speaking/i,
    Reading: /reading/i,
    Writing: /writing/i,
    Oral: /oral\s+language/i,
    Literacy: /literacy/i,
    Comprehension: /comprehension/i,
    Overall: /overall/i,
  };
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const scores = {};
  for (const [key, re] of Object.entries(labels)) {
    const i = lines.findIndex(
      (l) => re.test(l) && /\d/.test(l + (lines[lines.indexOf(l) + 1] || "")),
    );
    if (i < 0) continue;
    const window = `${lines[i]} ${lines[i + 1] || ""}`.replace(re, " ");
    const scale = window.match(/\b([1-9]\d{2})\b/);
    const level = window.match(/\b([1-6]\.\d)\b/);
    if (scale || level) scores[key] = { scale: scale?.[1] || "", level: level?.[1] || "" };
  }
  const year = String(text || "").match(/\b(20\d{2})\s*[-–/]\s*(20)?(\d{2})\b/);
  const grade = String(text || "").match(/\bgrade\s*:?\s*(K|\d{1,2})\b/i);
  return {
    scores,
    year: year ? `${year[1]}-${year[3]}` : "",
    grade: grade?.[1] || "",
    found: Object.keys(scores).length,
  };
}
