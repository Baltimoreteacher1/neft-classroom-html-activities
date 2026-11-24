// Language Studio Word renderer: every part x level for every authored unit builds a valid, well-formed, well-structured .docx. No network.
// Run: node --test functions/_lib/bcpss/studio-docx.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getUnitDetail } from "./db.js";
import { renderStudioDocx } from "./studio-docx.js";
import { buildStudioDocument } from "./studio-print-html.js";
import { renderUnitDocxPacket } from "./unit-packet.js";

const UNITS_DIR = new URL("../../../db/seeds/bcpss/v2/units/", import.meta.url);
const FAMILY_DIR = new URL("../../../db/seeds/bcpss/v2/family/", import.meta.url);
const WIDA = ["1_2", "3_4", "5_6"];
const LEVEL_PARTS = /^(packet|book|key|strips|activity-\d+)$/;
const PARTS = ["packet", "book", "key", "cards", "bingo", "wall", "poster", "strips", "talk", "family"];

// ---- tiny strict readers: stored-zip + XML (well-formedness, entities, attributes) -----------------------------
function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = bytes.length - 22;
  while (eocd >= 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd--;
  assert.ok(eocd >= 0, "zip end record");
  const count = dv.getUint16(eocd + 10, true);
  let at = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let k = 0; k < count; k++) {
    assert.equal(dv.getUint32(at, true), 0x02014b50, "central header");
    const method = dv.getUint16(at + 10, true);
    const size = dv.getUint32(at + 24, true);
    const nameLen = dv.getUint16(at + 28, true);
    const extra = dv.getUint16(at + 30, true);
    const comment = dv.getUint16(at + 32, true);
    const local = dv.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLen));
    assert.equal(method, 0, "stored entry");
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    files[name] = new TextDecoder().decode(bytes.subarray(start, start + size));
    at += 46 + nameLen + extra + comment;
  }
  return files;
}

function parseXml(xml, label) {
  assert.ok(xml.startsWith("<?xml"), `${label}: xml declaration`);
  const root = { name: "#root", attrs: {}, kids: [] };
  const stack = [root];
  const tokens = xml.match(/<[^>]+>|[^<]+/g) || [];
  for (const tok of tokens) {
    const top = stack[stack.length - 1];
    if (tok.startsWith("<?")) continue;
    if (tok.startsWith("</")) {
      const name = tok.slice(2, -1).trim();
      assert.equal(top.name, name, `${label}: mismatched </${name}> (open <${top.name}>)`);
      stack.pop();
    } else if (tok.startsWith("<")) {
      const m = tok.match(/^<([\w:.-]+)((?:\s+[\w:.-]+="[^"<]*")*)\s*(\/?)>$/);
      assert.ok(m, `${label}: bad tag ${tok.slice(0, 80)}`);
      const attrs = {};
      for (const a of m[2].matchAll(/([\w:.-]+)="([^"]*)"/g)) {
        assert.ok(!/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(a[2]), `${label}: bad entity in attribute`);
        attrs[a[1]] = a[2];
      }
      const node = { name: m[1], attrs, kids: [], text: "" };
      top.kids.push(node);
      if (!m[3]) stack.push(node);
    } else {
      assert.ok(!/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(tok), `${label}: bad entity in text`);
      top.text = (top.text || "") + tok;
    }
  }
  assert.equal(stack.length, 1, `${label}: unclosed tags`);
  return root.kids[0];
}

const indexes = new WeakMap();
const index = (node) => {
  if (!indexes.has(node)) {
    const map = new Map();
    const visit = (n) => {
      if (!map.has(n.name)) map.set(n.name, []);
      map.get(n.name).push(n);
      for (const k of n.kids) visit(k);
    };
    visit(node);
    indexes.set(node, map);
  }
  return indexes.get(node);
};
const find = (node, name) => index(node).get(name) || [];
const text = (node) => find(node, "w:t").map((t) => t.text || "").join("");
const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

// Paragraph-by-paragraph text of the document (cells and nested tables included), NBSP folded to spaces.
function paragraphs(root) {
  return find(root, "w:p").map((p) => decode(text(p)).replace(/\u00a0/g, " "));
}

// ---- units -----------------------------------------------------------------------------------------------------
const familyFixture = (studio) => {
  const bi = (s) => ({ en: s, es: `${s} (es)` });
  return {
    summary: bi("Your child is learning to talk about shapes."),
    vocab: studio.vocab.map((v) => ({ term: v.term, def_es: `Definición de ${v.term}.`, example_es: `Ejemplo con ${v.term}.` })),
    talk: [1, 2, 3, 4].map((n) => bi(`Question ${n}?`)),
    try_at_home: [1, 2, 3].map((n) => ({ title: bi(`Activity ${n}`), minutes: 10, materials: bi("paper"), steps: { en: ["One.", "Two."], es: ["Uno.", "Dos."] } })),
    say_it: [1, 2, 3].map((n) => bi(`Sentence ${n} has a [word] in it.`)),
    help: { en: ["Ask and listen."], es: ["Pregunte."] },
    home_language: bi("Say the words in your home language too."),
    celebrate: bi("Your child explains with because."),
  };
};

const units = [];
for (const file of fs.readdirSync(UNITS_DIR)) {
  if (!file.endsWith(".mjs")) continue;
  const id = file.replace(/\.mjs$/, "");
  let detail;
  try {
    detail = (await getUnitDetail({}, id)).detail;
  } catch {
    continue;
  }
  if (!detail?.unit) continue;
  if (!detail.studio) detail.studio = (await import(new URL(file, UNITS_DIR))).default;
  if (!detail.family) {
    detail.family = fs.existsSync(new URL(file, FAMILY_DIR))
      ? (await import(new URL(file, FAMILY_DIR))).default
      : familyFixture(detail.studio);
  }
  units.push(detail);
}

const build = (detail, part, wida = "3_4") => {
  const bytes = renderStudioDocx(detail, { part, wida });
  const files = readZip(bytes);
  const label = `${detail.unit.id} ${part} ${wida}`;
  const root = parseXml(files["word/document.xml"], label);
  return { bytes, files, root, label, paras: paragraphs(root) };
};

test("authored units are present", () => {
  assert.ok(units.some((d) => d.unit.id === "g6-math-u1"));
  assert.ok(units.some((d) => d.unit.id === "gk-ela-u1"));
});

test("every part x level is a well-formed docx with the right page structure", () => {
  let built = 0;
  for (const detail of units) {
    const parts = [...PARTS, "activity-1", `activity-${detail.studio.activities.length}`];
    for (const wida of WIDA) {
      for (const part of parts) {
        // Level only changes the frames and supports; level-free parts must come out identical, so parse them once.
        if (wida !== "3_4" && !LEVEL_PARTS.test(part)) {
          const a = readZip(renderStudioDocx(detail, { part, wida }))["word/document.xml"];
          const b = readZip(renderStudioDocx(detail, { part, wida: "3_4" }))["word/document.xml"];
          assert.equal(a, b, `${detail.unit.id} ${part}: level-free part differs by level`);
          built++;
          continue;
        }
        const { files, root, label, paras } = build(detail, part, wida);
        built++;
        for (const name of ["[Content_Types].xml", "_rels/.rels", "word/_rels/document.xml.rels", "word/styles.xml", "word/settings.xml", "word/footerP.xml", "word/footerL.xml"])
          assert.ok(files[name], `${label}: ${name}`);
        for (const [name, xml] of Object.entries(files)) if (name !== "word/document.xml") parseXml(xml, `${label} ${name}`);
        const all = Object.values(files).join("\n");
        assert.ok(!/undefined|\[object Object\]|NaN/.test(all), `${label}: undefined/NaN/[object Object]`);
        assert.ok(!/\bESOL\b/i.test(paras.join(" ")), `${label}: ESOL label`);
        assert.ok(!/&lt;w:/.test(files["word/document.xml"]), `${label}: raw xml leaked into text`);

        // sections: one sectPr per model section, landscape where the model says so, Letter sizes, real footers.
        const doc = buildStudioDocument(detail, { part, level: wida });
        const sects = find(root, "w:sectPr");
        assert.equal(sects.length, doc.sections.length, `${label}: section count`);
        sects.forEach((sp, k) => {
          const pg = find(sp, "w:pgSz")[0].attrs;
          const land = doc.sections[k].layout === "landscape";
          assert.equal(`${pg["w:w"]}x${pg["w:h"]}`, land ? "15840x12240" : "12240x15840", `${label}: page size of section ${k}`);
          assert.equal(pg["w:orient"] === "landscape", land, `${label}: orientation of section ${k}`);
          const mar = find(sp, "w:pgMar")[0].attrs;
          if (!doc.sections[k].bleed) for (const side of ["top", "right", "bottom", "left"]) assert.ok(Number(mar[`w:${side}`]) >= 864 && Number(mar[`w:${side}`]) <= 1080, `${label}: margin ${side}`);
          assert.equal(find(sp, "w:footerReference").length, 1, `${label}: footer on section ${k}`);
        });
        const bleed = doc.sections.filter((s) => s.bleed).length;
        assert.equal(find(root, "w:sectPr").filter((sp) => find(sp, "w:pgMar")[0].attrs["w:top"] === "0").length, bleed, `${label}: bleed cover`);

        // footer: unit title, The Language Page, a PAGE field.
        const footer = files["word/footerP.xml"];
        const footerText = decode(text(parseXml(footer, `${label} footer`)));
        assert.ok(footerText.includes("The Language Page") && footer.includes("PAGE") && footerText.includes(doc.unitTitle), `${label}: footer`);

        // headings keep with next; every table cell ends in a paragraph; grids add up; header rows repeat.
        for (const p of find(root, "w:p")) {
          const pPr = p.kids.find((k) => k.name === "w:pPr");
          const style = pPr?.kids.find((k) => k.name === "w:pStyle")?.attrs["w:val"];
          if (/^Heading/.test(style || "")) assert.ok(pPr.kids.some((k) => k.name === "w:keepNext"), `${label}: heading keepNext`);
        }
        for (const tbl of find(root, "w:tbl")) {
          const grid = find(tbl, "w:tblGrid")[0].kids.length;
          for (const tr of tbl.kids.filter((n) => n.name === "w:tr")) {
            const cells = tr.kids.filter((n) => n.name === "w:tc");
            const span = cells.reduce((n, tc) => n + Number(tc.kids[0].kids.find((k) => k.name === "w:gridSpan")?.attrs["w:val"] || 1), 0);
            assert.equal(span, grid, `${label}: row cells vs grid`);
            for (const tc of cells) assert.equal(tc.kids[tc.kids.length - 1].name, "w:p", `${label}: cell must end with a paragraph`);
          }
        }
        // every model table with headers produces a repeating header row.
        let headed = 0;
        const countHeaded = (blocks) =>
          (blocks || []).forEach((b) => {
            if (b.type === "table" && b.headers) headed++;
            if (b.type === "table") b.rows.forEach((r) => r.forEach((c) => c?.blocks && countHeaded(c.blocks)));
            if (b.type === "callout") countHeaded(b.blocks);
            if (b.type === "columns") b.cols.forEach(countHeaded);
            if (b.type === "cardGrid") b.cards.forEach((c) => countHeaded(c.blocks));
          });
        doc.sections.forEach((s) => countHeaded(s.blocks));
        assert.ok(find(root, "w:tblHeader").length >= headed + 0, `${label}: repeat header rows (${headed})`);
      }
    }
  }
  assert.ok(built > 100, `built ${built}`);
});

test("cut-out card rows never split and keep the model's card count", () => {
  for (const detail of units) {
    for (const part of ["cards", "talk", "strips", "wall", "bingo"]) {
      const { root, label } = build(detail, part);
      const doc = buildStudioDocument(detail, { part, level: "l3_4" });
      let expected = 0;
      for (const s of doc.sections) for (const b of s.blocks) if (b.type === "cardGrid" && b.cut) expected += b.cards.filter((c) => !c.empty).length;
      const dashed = find(root, "w:tbl").filter((t) => find(t, "w:tblBorders")[0]?.kids.some((k) => k.name === "w:insideV" && k.attrs["w:val"] === "dashed"));
      let cells = 0;
      for (const t of dashed)
        for (const tr of t.kids.filter((n) => n.name === "w:tr")) {
          assert.ok(find(tr, "w:cantSplit").length, `${label}: card row cantSplit`);
          cells += tr.kids.filter((n) => n.name === "w:tc").length;
        }
      if (part !== "bingo") assert.ok(cells >= expected, `${label}: ${cells} cells for ${expected} cards`);
      if (["cards", "talk", "strips"].includes(part)) assert.ok(expected > 0 || part === "strips", `${label}: has cut cards`);
    }
  }
});

test("student book carries every activity, mission and exit ticket", () => {
  for (const detail of units) {
    const { paras, label } = build(detail, "book");
    const all = paras.join("\n");
    for (const a of detail.studio.activities) {
      assert.ok(all.includes(a.title), `${label}: ${a.title}`);
      assert.ok(all.includes(a.mission), `${label}: mission of ${a.title}`);
      if (a.kind === "match") for (const p of a.payload.pairs) assert.ok(all.includes(p.l) && all.includes(p.r), `${label}: pair ${p.l}`);
      if (a.kind === "cloze") for (const w of a.payload.bank) assert.ok(all.includes(w), `${label}: bank ${w}`);
    }
    assert.ok(all.includes(detail.studio.exit_ticket.prompt), `${label}: exit ticket`);
    for (const v of detail.studio.vocab) assert.ok(all.includes(v.term), `${label}: ${v.term}`);
  }
});

test("answer key lists match pairs, cloze answers, model responses and tips", () => {
  for (const detail of units) {
    const { paras, label } = build(detail, "key");
    const all = paras.join("\n");
    for (const a of detail.studio.activities) {
      const p = a.payload;
      assert.ok(all.includes(a.tip), `${label}: tip ${a.title}`);
      if (a.kind === "match") for (const x of p.pairs) assert.ok(all.includes(x.l) && all.includes(x.r), `${label}: pair`);
      if (a.kind === "cloze") for (const ans of p.answers) assert.ok(all.includes(ans), `${label}: cloze ${ans}`);
      if (a.kind === "write_scaffold") assert.ok(all.includes(p.model), `${label}: model`);
      if (a.kind === "sentence_combine") for (const it of p.items) assert.ok(all.includes(it.model), `${label}: combine`);
      if (a.kind === "quiz") for (const it of p.items) assert.ok(all.includes(it.options[it.answer]), `${label}: quiz answer`);
    }
    for (const rub of Object.values(detail.studio.exit_ticket.rubric)) assert.ok(all.includes(rub), `${label}: rubric`);
  }
});

test("answer-key activity pages pre-fill answers in the Word version too", () => {
  const detail = units.find((d) => d.unit.id === "g6-math-u1");
  const cloze = detail.studio.activities.findIndex((a) => a.kind === "cloze");
  const bytes = renderStudioDocx(detail, { part: `activity-${cloze + 1}`, wida: "3_4", answerKey: true });
  const paras = paragraphs(parseXml(readZip(bytes)["word/document.xml"], "key activity")).join("\n");
  for (const ans of detail.studio.activities[cloze].payload.answers) assert.ok(paras.includes(ans), ans);
});

test("kits and packet carry unit content", () => {
  for (const detail of units) {
    for (const part of ["cards", "wall", "bingo"]) {
      const { paras, label } = build(detail, part);
      for (const v of detail.studio.vocab) assert.ok(paras.join("\n").includes(v.term), `${label}: ${v.term}`);
    }
    const poster = build(detail, "poster").paras.join("\n");
    for (const c of detail.studio.mentor.chunks) assert.ok(poster.includes(c.text.trim()), `${detail.unit.id}: poster chunk`);
    const packet = build(detail, "packet").paras.join("\n");
    assert.ok(packet.includes(detail.unit.unit_title) && packet.includes(detail.studio.essential_question), `${detail.unit.id}: packet`);
    const fam = build(detail, "family").paras.join("\n");
    assert.ok(fam.includes(detail.family.summary.en) && fam.includes(detail.family.summary.es), `${detail.unit.id}: family`);
  }
});

test("only Word-safe fonts are used", () => {
  const detail = units.find((d) => d.unit.id === "g6-math-u1");
  const ok = new Set(["Calibri", "Arial Rounded MT Bold", "Segoe UI Emoji", "Segoe UI Symbol"]);
  for (const part of PARTS) {
    const { files } = build(detail, part);
    for (const xml of Object.values(files)) for (const m of xml.matchAll(/w:ascii="([^"]+)"/g)) assert.ok(ok.has(m[1]), `${part}: font ${m[1]}`);
  }
});

test("legacy packet docx still builds (now through the shared kit) and has no leaked xml", () => {
  const detail = units.find((d) => d.unit.id === "g6-math-u1");
  const files = readZip(renderUnitDocxPacket(detail, "3_4"));
  const xml = files["word/document.xml"];
  parseXml(xml, "legacy document");
  parseXml(files["word/styles.xml"], "legacy styles");
  assert.ok(!xml.includes("&lt;w:r"), "legacy docx must not print raw run xml");
  assert.ok(xml.includes(detail.unit.unit_title.replace(/&/g, "&amp;")));
});
