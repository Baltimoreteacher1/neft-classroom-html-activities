// Mixed-band class packets and print kits (G-36 style). No network, no browser.
// Run: node --test tools/packet-packets.test.mjs
//   - export text equals source (HTML and Word) for all 162 units x 3 bands
//   - no page-break element or CSS anywhere, in any part, in either format
//   - student papers carry no level/band/program/name/initial token (property test with a negative control)
//   - all three papers of a unit share one layout; only the opaque variant code tells them apart
//   - the cover sheet is a separate one-section file that decodes the codes; it never appears in a student file

import assert from "node:assert/strict";
import test from "node:test";
import { buildStudentPaper } from "../functions/_lib/bcpss/packet-doc.js";
import {
  buildPart,
  loadPacketSource,
  PACKET_PARTS,
  PACKET_UNIT_IDS,
} from "../functions/_lib/bcpss/packet-parts.js";
import { renderPacketDocx, renderPacketHtml } from "../functions/_lib/bcpss/packet-render.js";
import {
  BAND_LABEL,
  BANDS,
  CODE_RE,
  NOT_A_SCORE,
  parseCounts,
  variantCodes,
} from "../shared/packets/bands.js";
import {
  cardsSpec,
  coverSpec,
  DRAFT_TRANSLATION,
  keySpec,
  paperSpec,
} from "../shared/packets/content.js";
import { findLeaks, findSourceHits } from "../shared/packets/leak.js";
import {
  docxText,
  firstMissing,
  htmlText,
  PAGE_BREAK_HTML,
  PAGE_BREAK_XML,
  paperPieces,
  readZip,
  signature,
} from "./packet-test-kit.mjs";

const MIXES = ["1_2:8,3_4:12,5_6:5", "0_0", "3_4:25", "1_2:1", "1_2:60,3_4:60,5_6:60", "5_6:7"];
const GOOD_MIXES = MIXES.filter((m) => parseCounts(m).ok);

const sources = new Map();
for (const id of PACKET_UNIT_IDS) sources.set(id, await loadPacketSource(id));

test("all 162 units are authored and loadable", () => {
  assert.equal(PACKET_UNIT_IDS.length, 162);
  for (const [id, s] of sources)
    assert.ok(s?.studio && s.family, `${id}: missing studio or family`);
});

test("band counts: valid inputs parse, invalid ones are refused with a reason", () => {
  assert.deepEqual(parseCounts("1_2:8,3_4:12,5_6:5").counts, { "1_2": 8, "3_4": 12, "5_6": 5 });
  assert.deepEqual(parseCounts({ "3_4": 4 }).counts, { "1_2": 0, "3_4": 4, "5_6": 0 });
  for (const bad of [
    "",
    "0_0",
    "1_2:-1",
    "1_2:x",
    "7_8:3",
    "1_2:61",
    "1_2:3,1_2:4",
    "1_2:3:4",
    null,
    5,
    [],
    "1_2:1.5",
  ]) {
    const r = parseCounts(bad);
    assert.equal(r.ok, false, `accepted ${JSON.stringify(bad)}`);
    assert.ok(r.error, "refusal carries a reason");
  }
});

test("variant codes: opaque, distinct per unit, stable, and never spell a level", () => {
  const seen = new Set();
  for (const id of PACKET_UNIT_IDS) {
    const codes = variantCodes(id);
    assert.deepEqual(codes, variantCodes(id), `${id}: unstable`);
    const list = BANDS.map((b) => codes[b]);
    assert.equal(new Set(list).size, 3, `${id}: duplicate codes ${list}`);
    for (const c of list) {
      assert.match(c, CODE_RE);
      seen.add(c);
    }
  }
  assert.ok(seen.size >= 40, "codes vary across units");
  // No code order tracks band order (a code must not reveal its band).
  const ordered = PACKET_UNIT_IDS.filter((id) => {
    const c = variantCodes(id);
    return c["1_2"] < c["3_4"] && c["3_4"] < c["5_6"];
  }).length;
  assert.ok(ordered < PACKET_UNIT_IDS.length * 0.5, `codes ascend with band in ${ordered} units`);
});

test("student papers: export text equals source, in HTML and Word, for every unit and band", () => {
  for (const [id, src] of sources) {
    for (const band of BANDS) {
      const { doc, code } = buildPart(src, "student", { band });
      const pieces = paperPieces(paperSpec(src.unit, src.studio, band));
      const html = htmlText(renderPacketHtml(doc));
      const docx = docxText(renderPacketDocx(doc));
      assert.equal(firstMissing(html, pieces), null, `${id} ${band} html`);
      assert.equal(firstMissing(docx, pieces), null, `${id} ${band} docx`);
      assert.ok(
        renderPacketHtml(doc).includes(`content:"${code}"`),
        `${id} ${band}: code in @page footer`,
      );
      assert.match(
        readZip(renderPacketDocx(doc))["word/footer1.xml"] ||
          readZip(renderPacketDocx(doc))["word/footerP.xml"],
        new RegExp(`>${code}<`),
      );
    }
  }
});

test("answer key and cover sheet text equals source", () => {
  for (const [id, src] of sources) {
    const codes = variantCodes(id);
    const k = keySpec(src.unit, src.studio, codes);
    const keyDoc = buildPart(src, "key").doc;
    const pieces = [
      k.title,
      ...k.variants.flatMap((v) => [v.code, v.label, ...v.words.map((w) => w.response)]),
      k.exit.model,
    ];
    assert.equal(firstMissing(htmlText(renderPacketHtml(keyDoc)), pieces), null, `${id} key html`);
    assert.equal(firstMissing(docxText(renderPacketDocx(keyDoc)), pieces), null, `${id} key docx`);
    const counts = parseCounts(GOOD_MIXES[0]).counts;
    const c = coverSpec(src.unit, counts, codes);
    const coverDoc = buildPart(src, "cover", { counts: GOOD_MIXES[0] }).doc;
    const cp = [
      c.title,
      ...c.rows.flatMap((r) => [r.code, r.label, String(r.students)]),
      `Total: ${c.total} students.`,
    ];
    assert.equal(firstMissing(htmlText(renderPacketHtml(coverDoc)), cp), null, `${id} cover html`);
    assert.equal(firstMissing(docxText(renderPacketDocx(coverDoc)), cp), null, `${id} cover docx`);
  }
});

test("no page-break element or CSS in any part, any unit, either format", () => {
  for (const [id, src] of sources) {
    for (const mix of GOOD_MIXES) {
      for (const part of PACKET_PARTS) {
        const opts = { band: "3_4", counts: mix };
        const { doc } = buildPart(src, part, opts);
        assert.equal(doc.sections.length, 1, `${id} ${part}: one flowing section`);
        const html = renderPacketHtml(doc);
        assert.doesNotMatch(html, PAGE_BREAK_HTML, `${id} ${part} html`);
        const xml = readZip(renderPacketDocx(doc))["word/document.xml"];
        assert.doesNotMatch(xml, PAGE_BREAK_XML, `${id} ${part} docx`);
        assert.equal((xml.match(/<w:sectPr/g) || []).length, 1, `${id} ${part}: one Word section`);
        assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/, `${id} ${part}`);
        assert.doesNotMatch(html, /<script/i, `${id} ${part}`);
      }
      if (mix !== GOOD_MIXES[0]) break; // counts only change the cover; the other parts are identical per mix
    }
  }
});

test("student papers contain no level, band, program, name or initial token (all units, all bands)", () => {
  const failures = [];
  for (const [id, src] of sources) {
    const codes = variantCodes(id);
    for (const band of BANDS) {
      const { doc } = buildPart(src, "student", { band });
      const spec = paperSpec(src.unit, src.studio, band);
      const mask = paperPieces(spec);
      for (const [fmt, text] of [
        ["html", htmlText(renderPacketHtml(doc))],
        ["docx", docxText(renderPacketDocx(doc))],
      ]) {
        const leaks = findLeaks(text, mask);
        if (leaks.length) failures.push(`${id} ${band} ${fmt}: ${leaks.join(", ")}`);
        for (const other of BANDS) {
          if (other !== band && text.includes(codes[other]))
            failures.push(`${id} ${band}: carries another paper's code`);
        }
        for (const label of Object.values(BAND_LABEL))
          if (text.includes(label)) failures.push(`${id} ${band}: ${label}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("negative control: a paper that leaks a label is caught", () => {
  const src = sources.get("g6-math-u1");
  for (const leak of [
    "Level 2",
    "Newcomer packet",
    "WIDA 3_4",
    "ESOL group",
    "Student initials: J.S.",
    "IEP",
    "Band 5_6",
    "Lvl 2",
  ]) {
    const { doc } = buildPart(src, "student", { band: "1_2" });
    doc.sections[0].blocks.push({ type: "paragraph", runs: [{ t: leak }] });
    const spec = paperSpec(src.unit, src.studio, "1_2");
    const hits = findLeaks(htmlText(renderPacketHtml(doc)), paperPieces(spec));
    assert.ok(hits.length > 0, `"${leak}" slipped through`);
    assert.ok(
      findLeaks(docxText(renderPacketDocx(doc)), paperPieces(spec)).length > 0,
      `"${leak}" slipped through (docx)`,
    );
  }
  // The scan masks authored source only: a unit that teaches the word "level" is not a false alarm.
  assert.deepEqual(
    findLeaks("Find sea level on the map. Write.", ["Find sea level on the map."]),
    [],
  );
});

test("authored source that contains a label word is reported, never edited", () => {
  const hits = [];
  for (const [id, src] of sources) {
    for (const band of BANDS) {
      for (const h of findSourceHits(paperPieces(paperSpec(src.unit, src.studio, band))))
        hits.push(`${id}: ${h.token}`);
    }
  }
  // Content owners decide these; the packet must not rewrite them. Listed so a new one is a visible change.
  assert.ok(hits.length < 400, `source hits: ${hits.length}`);
  console.log(
    `source strings that contain a label word (reported, not edited): ${hits.length} hits in ${new Set(hits.map((h) => h.split(":")[0])).size} units`,
  );
});

test("all three papers of a unit share one layout; the footer code is the only mark", () => {
  for (const [id, src] of sources) {
    const sigs = BANDS.map((b) => signature(buildPart(src, "student", { band: b }).doc));
    assert.equal(new Set(sigs).size, 1, `${id}: layouts differ between bands`);
    const htmlNoCode = BANDS.map((b) => {
      const { doc, code } = buildPart(src, "student", { band: b });
      return renderPacketHtml(doc).replace(`content:"${code}"`, 'content:"X0"');
    });
    // Bands differ in content, so the pages are not byte-equal, but chrome (title, headings, labels) is.
    const chrome = htmlNoCode.map((h) =>
      (h.match(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/g) || []).join("|"),
    );
    assert.equal(new Set(chrome).size, 1, `${id}: headings differ between bands`);
    const docs = BANDS.map((b) => buildPart(src, "student", { band: b }).doc);
    assert.equal(new Set(docs.map((d) => d.title)).size, 1, `${id}: title differs`);
    assert.equal(new Set(docs.map((d) => d.partLabel)).size, 1);
  }
});

test("bands differ in content: practice mode, frames and help box", () => {
  for (const [id, src] of sources) {
    const specs = BANDS.map((b) => paperSpec(src.unit, src.studio, b));
    assert.equal(
      new Set(specs.map((s) => s.words[0].practice.prefix)).size >= 2,
      true,
      `${id}: practice modes`,
    );
    assert.equal(new Set(specs.map((s) => s.frames.join("|"))).size, 3, `${id}: frames`);
    assert.equal(new Set(specs.map((s) => s.exit.help.lead)).size, 3, `${id}: help box`);
    assert.deepEqual(new Set(specs.map((s) => s.words.length)), new Set([specs[0].words.length]));
    assert.deepEqual(new Set(specs.map((s) => s.frames.length)), new Set([3]));
  }
});

test("cover sheet: a separate one-section file that decodes every code and the copy counts", () => {
  for (const [id, src] of sources) {
    const codes = variantCodes(id);
    const student = BANDS.map((b) =>
      htmlText(renderPacketHtml(buildPart(src, "student", { band: b }).doc)).toLowerCase(),
    );
    for (const t of student) {
      assert.ok(!t.includes("cover sheet"), `${id}: cover text inside a student file`);
      assert.ok(!t.includes("copies to print"));
    }
    for (const mix of GOOD_MIXES) {
      const counts = parseCounts(mix).counts;
      const { doc } = buildPart(src, "cover", { counts: mix });
      assert.equal(doc.sections.length, 1);
      const text = htmlText(renderPacketHtml(doc));
      for (const b of BANDS) {
        assert.ok(
          text.includes(codes[b]) && text.includes(BAND_LABEL[b]),
          `${id} ${mix}: ${b} not decoded`,
        );
        if (counts[b] === 0) assert.ok(text.includes("none"));
      }
      assert.ok(text.includes(NOT_A_SCORE), "disclaimer");
      assert.ok(text.includes(`Total: ${counts["1_2"] + counts["3_4"] + counts["5_6"]} students.`));
    }
  }
});

test("print kits: Spanish glosses are marked draft unless reviewed; no pictures; no band labels", () => {
  for (const [id, src] of sources) {
    const cards = cardsSpec(src.studio);
    for (const c of cards) assert.equal(c.esDraft, Boolean(c.es), `${id} ${c.term}`);
    for (const c of cardsSpec(src.studio, { esReviewed: true })) assert.equal(c.esDraft, false);
    const text = htmlText(renderPacketHtml(buildPart(src, "kit-cards").doc));
    const drafts = (text.match(new RegExp(`\\(${DRAFT_TRANSLATION}\\)`, "g")) || []).length;
    assert.equal(drafts, cards.filter((c) => c.es).length, `${id}: draft markers`);
    for (const v of src.studio.vocab)
      if (v.icon) assert.ok(!text.includes(v.icon), `${id}: picture on a card`);
    assert.ok(buildPart(src, "kit-family").doc.sections.length === 1);
    assert.match(
      htmlText(renderPacketHtml(buildPart(src, "kit-family").doc)),
      new RegExp(DRAFT_TRANSLATION),
    );
    for (const part of ["kit-cards", "kit-frames", "kit-exit"]) {
      const t = htmlText(renderPacketHtml(buildPart(src, part).doc));
      const leaks = findLeaks(t, [
        ...src.studio.vocab.flatMap((v) => [v.term, v.def, v.es_note || "", v.es || ""]),
        src.unit.unit_title,
        ...Object.values(src.studio.frames)
          .flat()
          .map((f) => f.replace(/\[([^\]]+)\]/g, "$1")),
        src.studio.exit_ticket.prompt,
        ...Object.values(src.studio.exit_ticket.rubric),
      ]);
      assert.deepEqual(leaks, [], `${id} ${part}`);
    }
  }
  // reviewed Spanish prints with no draft marker
  const src = sources.get("g6-math-u1");
  const reviewed = htmlText(
    renderPacketHtml(buildPart(src, "kit-cards", { esReviewed: true }).doc),
  );
  assert.ok(!reviewed.includes(DRAFT_TRANSLATION));
});

test("kit frame strips carry only the opaque codes", () => {
  for (const [id, src] of sources) {
    const codes = variantCodes(id);
    const text = htmlText(renderPacketHtml(buildPart(src, "kit-frames").doc));
    for (const b of BANDS) assert.ok(text.includes(codes[b]));
    for (const label of Object.values(BAND_LABEL)) assert.ok(!text.includes(label));
  }
});

test("buildPart refuses bad input with an HTTP status", () => {
  const src = sources.get("g6-math-u1");
  assert.throws(
    () => buildPart(src, "student", { band: "9_9" }),
    (e) => e.status === 400,
  );
  assert.throws(
    () => buildPart(src, "student", {}),
    (e) => e.status === 400,
  );
  assert.throws(
    () => buildPart(src, "cover", { counts: "nope" }),
    (e) => e.status === 400,
  );
  assert.throws(
    () => buildPart(src, "nope"),
    (e) => e.status === 400,
  );
  assert.throws(
    () => buildPart({ ...src, family: null }, "kit-family"),
    (e) => e.status === 404,
  );
});

test("the student paper is a plain document model: no names, no program words in the source file", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of ["../functions/_lib/bcpss/packet-doc.js", "../shared/packets/content.js"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.ok(
      !/localStorage|fetch\(|alias|initials/i.test(src.replace(/\/\/.*$/gm, "")),
      `${f}: reads or stores identity`,
    );
  }
  assert.equal(typeof buildStudentPaper, "function");
});
