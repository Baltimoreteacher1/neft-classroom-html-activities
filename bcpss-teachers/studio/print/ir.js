// Resource document model (IR). Templates build it; the HTML, DOCX and plain-text writers read it.
// doc = { v, template, title, meta, format, sections:[{kind, title, pages:[{id, tag?, blocks:[...]}]}], seq }
// Strings are always plain text (never HTML); each writer escapes for its own format.

export const SECTION_KINDS = ["cover", "student", "key", "notes"];
/** Sections a student copy never contains. */
export const TEACHER_ONLY = new Set(["key", "notes"]);

const cell = (c) => (typeof c === "object" && c ? { t: "", ...c } : { t: String(c ?? "") });

export const B = {
  title: (text, sub = "") => ({ type: "title", text, sub }),
  h: (text, level = 2) => ({ type: "h", text, level }),
  p: (text, tone = "") => ({ type: "p", text, tone }),
  list: (items, ordered = false, bare = false) => ({ type: "list", items: [...items], ordered, bare }),
  lines: (n = 2, label = "") => ({ type: "lines", n, label }),
  box: (n = 4, label = "", opts = {}) => ({ type: "box", n, label, grid: !!opts.grid, hint: opts.hint || "" }),
  frames: (items, label = "") => ({ type: "frames", label, items: [...items] }),
  bank: (words, label = "Word bank") => ({ type: "bank", label, words: [...words] }),
  visual: (spec, opts = {}) => ({ type: "visual", spec, wMm: opts.wMm || 70, caption: opts.caption || "" }),
  table: ({ cols, head = null, rows, rowLines = 0, accentHead = true }) => ({
    type: "table",
    cols: cols || rows[0].map(() => 1),
    head: head ? head.map(cell) : null,
    rows: rows.map((r) => r.map(cell)),
    rowLines,
    accentHead,
  }),
  cards: ({ cols, rows, hMm, items, cut = true }) => ({
    type: "cards",
    cols,
    rows,
    hMm,
    cut,
    items: items.map((c) => ({ tag: "", head: "", headSize: "", body: "", foot: "", num: "", lines: 0, frames: [], ...c })),
  }),
  fold: ({ kind, flaps, hMm = 120 }) => ({ type: "fold", kind, hMm, flaps: flaps.map((f) => ({ label: "", n: 3, ...f })) }),
  sep: (kind = "rule", label = "") => ({ type: "sep", kind, label }),
  check: (items) => ({ type: "check", items: [...items] }),
  namebar: (fields = ["Name", "Date"]) => ({ type: "namebar", fields: [...fields] }),
  trace: (words) => ({ type: "trace", words: [...words] }),
  spacer: (mm = 4) => ({ type: "spacer", mm }),
  row: (cols) => ({ type: "row", cols: cols.map((c) => ({ fr: 1, ...c })) }),
};

export const page = (blocks, extra = {}) => ({ blocks: blocks.filter(Boolean), ...extra });
export const section = (kind, pages, title = "") => ({ kind, title, pages: pages.filter((p) => p.blocks.length) });

/** Assign stable ids to every page and block. Called once by the template builder and after structural edits. */
export function finalize(doc) {
  let n = doc.seq || 0;
  const nextId = () => `b${++n}`;
  const walk = (blocks) => {
    for (const b of blocks) {
      if (!b.id) b.id = nextId();
      if (b.type === "row") for (const c of b.cols) walk(c.blocks);
    }
  };
  for (const s of doc.sections) {
    for (const pg of s.pages) {
      if (!pg.id) pg.id = `p${++n}`;
      walk(pg.blocks);
    }
  }
  doc.seq = n;
  return doc;
}

export function allBlocks(doc, kinds) {
  const out = [];
  const walk = (blocks, ctx) => {
    for (const b of blocks) {
      out.push({ block: b, ...ctx });
      if (b.type === "row") for (const c of b.cols) walk(c.blocks, ctx);
    }
  };
  for (const s of doc.sections) {
    if (kinds && !kinds.includes(s.kind)) continue;
    for (const pg of s.pages) walk(pg.blocks, { section: s, page: pg });
  }
  return out;
}

export function locate(doc, id) {
  const search = (blocks, owner) => {
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].id === id) return { blocks, index: i, block: blocks[i], owner };
      if (blocks[i].type === "row") {
        for (const c of blocks[i].cols) {
          const hit = search(c.blocks, owner);
          if (hit) return hit;
        }
      }
    }
    return null;
  };
  for (const s of doc.sections) {
    for (const pg of s.pages) {
      const hit = search(pg.blocks, { section: s, page: pg });
      if (hit) return hit;
    }
  }
  return null;
}

/** Resolve "<blockId>:<dotted.path>" to its container and key. */
function resolvePath(doc, path) {
  const [id, rest] = String(path).split(":");
  const hit = locate(doc, id);
  if (!hit || !rest) return null;
  const keys = rest.split(".");
  const last = keys.pop();
  let node = hit.block;
  for (const k of keys) {
    node = node?.[k];
    if (node == null) return null;
  }
  return { node, key: last, block: hit.block };
}

export function getText(doc, path) {
  const r = resolvePath(doc, path);
  return r ? String(r.node[r.key] ?? "") : "";
}

export function setText(doc, path, value) {
  const r = resolvePath(doc, path);
  if (!r) return false;
  r.node[r.key] = String(value).replace(/\s+/g, " ").trim();
  return true;
}

export function moveBlock(doc, id, dir) {
  const hit = locate(doc, id);
  if (!hit) return false;
  const j = hit.index + dir;
  if (j < 0 || j >= hit.blocks.length) return false;
  [hit.blocks[hit.index], hit.blocks[j]] = [hit.blocks[j], hit.blocks[hit.index]];
  return true;
}

export function removeBlock(doc, id) {
  const hit = locate(doc, id);
  if (!hit) return false;
  hit.blocks.splice(hit.index, 1);
  return true;
}

const BLANK_FRAME = "______________________________";

/** "Add a line": extends the block's own list where it has one, otherwise adds a writing line after it. */
export function addLine(doc, id) {
  const hit = locate(doc, id);
  if (!hit) return false;
  const b = hit.block;
  if (b.type === "lines") b.n += 1;
  else if (b.type === "box") b.n += 1;
  else if (b.type === "list" || b.type === "check") b.items.push("Add your own");
  else if (b.type === "frames") b.items.push(BLANK_FRAME);
  else if (b.type === "bank") b.words.push("new word");
  else if (b.type === "table") b.rows.push(b.cols.map(() => cell("")));
  else hit.blocks.splice(hit.index + 1, 0, { ...B.lines(1), id: `b${++doc.seq}` });
  return true;
}

export function removeItem(doc, id, index) {
  const hit = locate(doc, id);
  if (!hit) return false;
  const b = hit.block;
  const list = b.items || b.words || b.rows || b.flaps || b.fields;
  if (!Array.isArray(list) || list.length <= 1) return false;
  list.splice(index, 1);
  return true;
}

export function movePage(doc, pageId, dir) {
  for (const s of doc.sections) {
    const i = s.pages.findIndex((p) => p.id === pageId);
    if (i < 0) continue;
    const j = i + dir;
    if (j < 0 || j >= s.pages.length) return false;
    [s.pages[i], s.pages[j]] = [s.pages[j], s.pages[i]];
    return true;
  }
  return false;
}

export function removePage(doc, pageId) {
  for (const s of doc.sections) {
    const i = s.pages.findIndex((p) => p.id === pageId);
    if (i < 0) continue;
    if (doc.sections.flatMap((x) => x.pages).length <= 1) return false;
    s.pages.splice(i, 1);
    return true;
  }
  return false;
}

/** Sections shown for an audience, with global page numbers. */
export function visibleSections(doc, audience = "student") {
  const secs = doc.sections.filter((s) => s.pages.length && (audience === "teacher" || !TEACHER_ONLY.has(s.kind)));
  let n = 0;
  return secs.map((s) => ({ ...s, pages: s.pages.map((pg) => ({ ...pg, number: ++n })) }));
}
export const pageCount = (doc, audience) => visibleSections(doc, audience).reduce((a, s) => a + s.pages.length, 0);

const cellText = (c) => (c && typeof c === "object" ? c.t : String(c ?? ""));
const squash = (s) => String(s ?? "").replace(/_{3,}/g, "____");

export function blockText(b) {
  switch (b.type) {
    case "title": return [b.text, b.sub];
    case "h": case "p": return [b.text];
    case "list": return b.items.map((t, i) => (b.ordered ? `${i + 1}. ` : b.bare ? "" : "- ") + t);
    case "check": return b.items.map((t) => `[ ] ${t}`);
    case "frames": return [b.label, ...b.items.map(squash)];
    case "bank": return [`${b.label}: ${b.words.join(", ")}`];
    case "lines": return [b.label];
    case "box": return [b.label, b.hint];
    case "visual": return [b.spec?.alt ? `[Picture: ${b.spec.alt}]` : "[Picture]", b.caption];
    case "table": return [...(b.head ? [b.head.map(cellText).join(" | ")] : []), ...b.rows.map((r) => r.map(cellText).join(" | "))];
    case "cards": return b.items.map((c, i) => [c.num || i + 1, c.tag, c.head, c.body, ...(c.frames || []).map(squash), c.foot].filter((x) => x !== "" && x != null).join(" - "));
    case "fold": return [`Foldable (${b.kind}): ${b.flaps.map((f) => f.label).join(" / ")}`];
    case "sep": return [b.label];
    case "namebar": return [b.fields.map((f) => `${f}: ________`).join("    ")];
    case "trace": return [b.words.join("  ")];
    case "row": return b.cols.flatMap((c) => c.blocks.flatMap(blockText));
    default: return [];
  }
}

/** Plain-text copy of the resource for pasting into a doc, email or LMS. */
export function docToText(doc, audience = "student") {
  const out = [];
  for (const s of visibleSections(doc, audience)) {
    if (s.kind === "key") out.push("ANSWER KEY");
    if (s.kind === "notes") out.push("TEACHER NOTES");
    for (const pg of s.pages) {
      for (const b of pg.blocks) for (const t of blockText(b)) if (t && String(t).trim()) out.push(String(t));
      out.push("");
    }
  }
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}
