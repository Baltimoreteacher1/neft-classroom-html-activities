// Render-equals-data proof for the routine blocks (shared/bcpss-routines), used by G-61 (talk), G-62 (listen), G-63 (check).
// EXPECTED comes from the data itself (leafStrings walks the registered source, band-aware); ACTUAL is what the Studio
// card, the print HTML and the Word file really contain. Nothing here reads the renderers' own selection logic.

import { nodesHtml } from "../../bcpss-teachers/routines/render.js";
import { renderStudioDocx } from "../../functions/_lib/bcpss/studio-docx.js";
import {
  buildStudioDocument,
  renderStudioPart,
} from "../../functions/_lib/bcpss/studio-print-html.js";
import { DRAFT_NOTICE } from "../../shared/bcpss-provenance.js";
import {
  BANDS,
  blocksFor,
  buildBlock,
  leafStrings,
  ROUTINE_BLOCKS,
} from "../../shared/bcpss-routines/index.js";
import { setupDom } from "./render.mjs";

const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
export const plain = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENT[m])
    .replace(/\s+/g, " ")
    .trim();
const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const xmlEsc = (s) =>
  norm(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const bandLabel = (b) => b.replace("_", "-");

/** Strings expected on the page: all leaves, minus teacher-only ones on a student view. */
function expected(block, detail, band, view) {
  const src = block.source(detail);
  const leaves = leafStrings(src, band, block.skip || []);
  const teacherOnly = new Set(block.teacherOnly || []);
  return view === "student" ? leaves.filter((l) => !teacherOnly.has(l.key)) : leaves;
}

/** Errors for one block of one unit at one band: screen card, print part(s), band isolation, student/teacher split. */
export function checkBlock(block, detail, band, { build = block.build } = {}) {
  const id = `${detail.unit.id} ${block.id} ${bandLabel(band)}`;
  const errors = [];
  const run = { ...block, build };
  const view = (v) => plain(nodesHtml(buildBlock(run, detail, band, v)));
  const teacher = view("teacher");
  for (const l of expected(block, detail, band, "teacher"))
    if (!teacher.includes(norm(l.text)))
      errors.push(`${id}: Studio card missing ${l.key || "text"} "${norm(l.text).slice(0, 60)}"`);

  const sheet = block.audience === "student" ? "student" : "teacher";
  const student = view(sheet);
  for (const l of expected(block, detail, band, sheet))
    if (!student.includes(norm(l.text)))
      errors.push(`${id}: ${sheet} sheet missing "${norm(l.text).slice(0, 60)}"`);
  if (sheet === "student") {
    const keyOnly = new Set(block.teacherOnly || []);
    for (const l of leafStrings(block.source(detail), band, block.skip || []))
      if (keyOnly.has(l.key) && student.includes(norm(l.text)))
        errors.push(
          `${id}: student sheet leaks teacher-only ${l.key} "${norm(l.text).slice(0, 50)}"`,
        );
  }

  // Band isolation: other bands' text must not show on this band's page (unless it is also this band's text).
  // Short words ("so", "key detail") legitimately recur across bands; only whole phrases of 20+ characters count.
  const mineText = leafStrings(block.source(detail), band, block.skip || [])
    .map((l) => norm(l.text))
    .join(" ");
  for (const other of BANDS.filter((b) => b !== band))
    for (const l of leafStrings(block.source(detail), other, block.skip || []).map((x) =>
      norm(x.text),
    ))
      if (l.length >= 20 && !mineText.includes(l) && teacher.includes(l))
        errors.push(`${id}: shows ${bandLabel(other)} text "${l.slice(0, 50)}"`);
  return errors;
}

/** Print HTML for a block's part(s): every expected string present, notice on generated blocks, no page break element. */
export function checkPrint(block, detail, band, { docx = false } = {}) {
  const id = `${detail.unit.id} ${block.id} ${bandLabel(band)}`;
  const errors = [];
  const parts = [{ part: block.part, view: block.audience === "student" ? "student" : "teacher" }];
  if (block.keyPart) parts.push({ part: block.keyPart, view: "teacher" });
  for (const { part, view } of parts) {
    const html = renderStudioPart(detail, { part, level: band });
    const text = plain(html);
    for (const l of expected(block, detail, band, view))
      if (!text.includes(norm(l.text)))
        errors.push(`${id}: print ${part} missing "${norm(l.text).slice(0, 60)}"`);
    if (block.paths.every((p) => p.startsWith("esol_pack")) && !text.includes(DRAFT_NOTICE))
      errors.push(`${id}: print ${part} lacks the draft notice for generated content`);
    const doc = buildStudioDocument(detail, { part, level: band });
    if (doc.sections.length !== 1 || doc.sections[0].pageBreakBefore !== false)
      errors.push(`${id}: ${part} must be one continuous section with no page break`);
    if (view === "student" && /Levels \d–\d/.test(text))
      errors.push(`${id}: student sheet ${part} names a level`);
    if (docx) {
      const bytes = renderStudioDocx(detail, { part, wida: band });
      const raw = Buffer.from(bytes).toString("utf8");
      if (!raw.startsWith("PK")) errors.push(`${id}: ${part} docx is not a zip`);
      for (const l of expected(block, detail, band, view))
        if (!raw.includes(xmlEsc(l.text)))
          errors.push(`${id}: docx ${part} missing "${norm(l.text).slice(0, 50)}"`);
    }
  }
  return errors;
}

/** The real Studio tab in jsdom: every block with data has a card, assign only for students, links point at known parts. */
export async function checkStudioTab(detail, band) {
  const window = setupDom();
  const { renderStudioTab } = await import("../../bcpss-teachers/studio-tab.js");
  const panel = window.document.createElement("div");
  window.document.body.append(panel);
  renderStudioTab(panel, { detail, wida: band });
  const errors = [];
  const id = `${detail.unit.id} studio-tab ${bandLabel(band)}`;
  const want = blocksFor(detail);
  const rows = [...panel.querySelectorAll("[data-routine]")];
  if (rows.length !== want.length)
    errors.push(`${id}: ${rows.length} routine cards for ${want.length} blocks`);
  for (const b of want) {
    const row = panel.querySelector(`[data-routine="${b.id}"]`);
    if (!row) {
      errors.push(`${id}: no card for ${b.id}`);
      continue;
    }
    const assign = row.querySelector("[data-assign]");
    if (b.audience === "student" && !assign) errors.push(`${id}: ${b.id} has no Assign button`);
    if (b.audience !== "student" && assign)
      errors.push(`${id}: teacher block ${b.id} is assignable`);
    if (assign && assign.dataset.part !== b.part)
      errors.push(`${id}: ${b.id} assigns ${assign.dataset.part}`);
    const hrefs = [...row.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    for (const part of [b.part, b.keyPart].filter(Boolean))
      for (const fmt of ["html", "pdf", "docx"])
        if (
          !hrefs.some(
            (h) =>
              h.includes(`part=${part}&`) &&
              h.includes(`format=${fmt}`) &&
              h.includes(`wida=${band}`),
          )
        )
          errors.push(`${id}: ${b.id} has no ${fmt} link for ${part} at ${bandLabel(band)}`);
    if (!row.querySelector('input[type="checkbox"][id^="rt-used-"]'))
      errors.push(`${id}: ${b.id} has no Save/Resume tick`);
    if (
      b.paths.every((p) => p.startsWith("esol_pack")) &&
      !row.textContent.includes("Draft: generated")
    )
      errors.push(`${id}: ${b.id} shows no draft label`);
  }
  panel.remove();
  return errors;
}

export const familyBlocks = (family) => ROUTINE_BLOCKS.filter((b) => b.family === family);

/** Run a family over the dataset. Every unit x band for the card and print HTML; Word on a rotating sample. */
export async function runFamily(data, family) {
  const errors = [];
  let checks = 0;
  const blocks = familyBlocks(family);
  for (let u = 0; u < data.units.length; u++) {
    const detail = data.units[u];
    for (const band of BANDS) {
      for (const b of blocks) {
        if (!blocksFor(detail).includes(b)) continue;
        checks += 1;
        errors.push(...checkBlock(b, detail, band));
        errors.push(...checkPrint(b, detail, band, { docx: u % 27 === 0 && band === "3_4" }));
      }
    }
    if (u % 9 === 0) for (const band of BANDS) errors.push(...(await checkStudioTab(detail, band)));
  }
  return {
    errors,
    info: { family, blocks: blocks.map((b) => b.id), checks, units: data.units.length },
  };
}

/** Negative controls: a renderer that drops the last row, a student sheet that leaks the key, a datum that is not rendered. */
const BAND_BLOCKS = new Set(["talkline", "ladder", "goals", "passport"]);

export function familyControls(data, family, probe) {
  const block = familyBlocks(family).find((b) => b.id === probe);
  const detail = data.units.find((d) => blocksFor(d).includes(block));
  const band = "3_4";
  const dropLast = (...a) =>
    block.build(...a).map((n) => {
      if (n.items?.length > 1) return { ...n, items: n.items.slice(0, -1) };
      if (n.rows?.length > 1) return { ...n, rows: n.rows.slice(0, -1) };
      return n;
    });
  const leaky = (s, bnd) => block.build(s, bnd, "teacher");
  const out = [
    {
      name: `${probe}: renderer drops its last row`,
      errors: checkBlock(block, detail, band, { build: dropLast }),
    },
  ];
  if (block.teacherOnly)
    out.push({
      name: `${probe}: student sheet shows the teacher key`,
      errors: checkBlock(block, detail, band, { build: leaky }),
    });
  // A renderer that ignores the WIDA band shows the Levels 3-4 text to a Levels 5-6 teacher.
  if (BAND_BLOCKS.has(probe))
    out.push({
      name: `${probe}: renderer ignores the WIDA band`,
      errors: checkBlock(block, detail, "5_6", {
        build: (s, _b, v, d) => block.build(s, "3_4", v, d),
      }),
    });
  // A field the renderer does not know about: expected (from the data) has it, the card cannot.
  const extra = JSON.parse(JSON.stringify(detail));
  // Mutate the underlying data (some sources are rebuilt copies), at the block's first registered path.
  const [root, field] = block.paths[0].replace("[]", "").split(".");
  const holder = root === "connections" ? extra.connections[0] : extra[root];
  const target = holder[field];
  (Array.isArray(target) ? target[0] : target).__extra = `UNRENDERED ${probe}`;
  out.push({
    name: `${probe}: an authored field with no renderer`,
    errors: checkBlock(block, extra, band),
  });
  return out;
}
