// Writing Lab "My finished work": the sanitizer, the document builder (all 162 units x 3 levels) and the POST export route.
//   node --test tools/bcpss-writing-work.test.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, test } from "node:test";
import JSZip from "jszip";
import { getUnitDetail } from "../functions/_lib/bcpss/db.js";
import { renderStudioDocx } from "../functions/_lib/bcpss/studio-docx.js";
import { renderStudioPart } from "../functions/_lib/bcpss/studio-print-html.js";
import { sanitizeWork } from "../functions/_lib/bcpss/writing-work.js";
import { onRequest } from "../functions/api/bcpss/export/[unitId].js";

const UNITS = readdirSync(new URL("../db/seeds/bcpss/v2/writing/", import.meta.url))
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .map((f) => f.replace(".mjs", ""));
const WIDA = ["1_2", "3_4", "5_6"];

/** Every field the Lab can save, filled from the unit's own content (a student who finished everything). */
function fullWork(w) {
  const work = {
    notes: {},
    bbs: {},
    expand: {},
    frag: {},
    appos: {},
    sub: {},
    spo: {
      ts: "TS mine",
      picked: w.spo.details.map((d) => d.note),
      own: "own one\nown two",
      cs: "CS mine",
    },
    draft: { text: "My first sentence.\nMy second paragraph line." },
    revise: {
      done: ["I used transition words to connect ideas."],
      ideas: 3,
      sentences: 2,
      words: 1,
    },
    pub: { name: "Alex Q" },
    mpo: { thesis: "Thesis mine", conclusion: "Concl mine" },
  };
  w.notes.forEach((_, k) => {
    work.notes[`t${k}`] = `note ${k}`;
  });
  w.bbs.forEach((_, k) => {
    work.bbs[`m${k}`] = { because: true, but: true, so: true };
    for (const c of ["because", "but", "so"]) work.bbs[`${k}${c}`] = `ending ${c} ${k}`;
  });
  w.expand.forEach((e, k) => {
    work.expand[`s${k}`] = `expanded ${k}`;
    work.expand[`c${k}`] = Object.keys(e.parts).slice(0, 2);
    for (const q of Object.keys(e.parts)) work.expand[`${k}${q}`] = `part ${q}`;
  });
  w.fragments.forEach((_, k) => {
    work.frag[`a${k}`] = "F";
    work.frag[`f${k}`] = `fixed ${k}`;
  });
  w.appositives.forEach((a, k) => {
    work.appos[`p${k}`] = a.options[a.answer];
    work.appos[`o${k}`] = `own appositive ${k}`;
  });
  w.subordinate.forEach((_, k) => {
    work.sub[`t${k}`] = `clue part ${k}`;
  });
  w.mpo?.paragraphs.forEach((_, k) => {
    work.mpo[`p${k}`] = `body ${k}`;
  });
  return work;
}

const docxXml = async (bytes) => {
  const zip = await JSZip.loadAsync(bytes);
  return zip.file("word/document.xml").async("string");
};

describe("sanitizeWork", () => {
  test("keeps known sections, drops unknown ones and malformed fields, caps text", () => {
    const r = sanitizeWork({
      draft: { text: `hello\u0000 world${"x".repeat(9000)}`, "bad key!": "no", n: { nested: 1 } },
      evil: { text: "dropped" },
      revise: { done: ["a", 7, "b"], ideas: 99 },
      bbs: { m0: { because: true, x: true } },
    });
    assert.equal(r.ok, true);
    assert.equal(r.work.evil, undefined);
    assert.ok(r.work.draft.text.startsWith("hello world"));
    assert.equal(r.work.draft.text.length, 6000);
    assert.equal(r.work.draft["bad key!"], undefined);
    assert.deepEqual(r.work.revise.done, ["a", "b"]);
    assert.equal(r.work.revise.ideas, 9);
    assert.deepEqual(r.work.bbs.m0, { because: true });
  });
  test("rejects non-objects and too many fields", () => {
    assert.equal(sanitizeWork(null).ok, false);
    assert.equal(sanitizeWork([]).ok, false);
    const many = Object.fromEntries(Array.from({ length: 130 }, (_, k) => [`f${k}`, "x"]));
    assert.equal(sanitizeWork({ notes: many }).ok, false);
  });
});

describe("My finished work document", () => {
  test("all units x all levels build with a full set of answers (HTML)", async () => {
    assert.ok(UNITS.length >= 162, `expected 162 writing units, found ${UNITS.length}`);
    for (const id of UNITS) {
      const { detail } = await getUnitDetail({}, id);
      assert.ok(detail?.writing, `${id} has writing`);
      const clean = sanitizeWork(fullWork(detail.writing)).work;
      for (const wida of WIDA) {
        const html = renderStudioPart(detail, { part: "writing-work", level: wida, work: clean });
        assert.ok(html.includes("Alex Q"), `${id} ${wida} name`);
        assert.ok(html.includes("My first sentence."), `${id} ${wida} draft`);
        assert.ok(html.includes("TS mine"), `${id} ${wida} plan`);
        assert.ok(html.includes("My self-check"), `${id} ${wida} self-check`);
      }
    }
  });

  test("an untouched Lab prints a blank paragraph page, not an error", async () => {
    const { detail } = await getUnitDetail({}, UNITS[0]);
    const html = renderStudioPart(detail, { part: "writing-work", level: "3_4", work: {} });
    assert.ok(html.includes("My paragraph"));
    assert.ok(!html.includes("My plan"));
  });

  test("student text is escaped in HTML and in Word", async () => {
    const { detail } = await getUnitDetail({}, UNITS[0]);
    const work = sanitizeWork({
      draft: { text: '<script>alert(1)</script> & "q"' },
      pub: { name: "<b>x</b>" },
    }).work;
    const html = renderStudioPart(detail, { part: "writing-work", level: "3_4", work });
    assert.ok(!html.includes("<script>alert(1)</script>"));
    assert.ok(html.includes("&lt;script&gt;"));
    const xml = await docxXml(
      renderStudioDocx(detail, { part: "writing-work", wida: "3_4", work }),
    );
    assert.ok(!xml.includes("<script>"));
    assert.ok(xml.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  });

  test("Word file carries the student's paragraph and plan for every unit and level", async () => {
    for (const id of UNITS) {
      const { detail } = await getUnitDetail({}, id);
      const work = sanitizeWork(fullWork(detail.writing)).work;
      for (const wida of WIDA) {
        const bytes = renderStudioDocx(detail, { part: "writing-work", wida, work });
        assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
        if (id === UNITS[0] || id === UNITS[UNITS.length - 1]) {
          const xml = await docxXml(bytes);
          assert.ok(xml.includes("My second paragraph line."), `${id} ${wida} draft in docx`);
          assert.ok(xml.includes("CS mine"), `${id} ${wida} plan in docx`);
        }
      }
    }
  });
});

describe("POST /api/bcpss/export/<unit>", () => {
  let ip = 0;
  const call = (method, url, body) =>
    onRequest({
      request: new Request(`https://thelanguagepage.com${url}`, {
        method,
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": `10.1.0.${++ip}` },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      params: { unitId: UNITS[0] },
      env: {},
    });

  test("200 Word download, never cached, filename carries no student name", async () => {
    const res = await call("POST", `/api/bcpss/export/${UNITS[0]}?format=docx&wida=3_4`, {
      work: { draft: { text: "Route paragraph." }, pub: { name: "Sam Secret" } },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.ok(!res.headers.get("content-disposition").includes("Sam"));
    assert.match(res.headers.get("content-disposition"), /writing-work/);
    assert.ok(
      (await docxXml(new Uint8Array(await res.arrayBuffer()))).includes("Route paragraph."),
    );
  });

  test("PDF without Browser Rendering falls back to a print page that carries the work", async () => {
    const res = await call("POST", `/api/bcpss/export/${UNITS[0]}?format=pdf&wida=1_2`, {
      work: { draft: { text: "Print me." } },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.ok((await res.text()).includes("Print me."));
  });

  test("400 for a bad work payload; GET cannot ask for the work part", async () => {
    assert.equal(
      (await call("POST", `/api/bcpss/export/${UNITS[0]}?format=docx`, { work: 5 })).status,
      400,
    );
    assert.equal(
      (await call("GET", `/api/bcpss/export/${UNITS[0]}?format=docx&part=writing-work`)).status,
      400,
    );
  });

  test("429 after a burst from one client", async () => {
    const mk = () =>
      onRequest({
        request: new Request(
          `https://thelanguagepage.com/api/bcpss/export/${UNITS[0]}?format=html`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.9.9.9" },
            body: JSON.stringify({ work: {} }),
          },
        ),
        params: { unitId: UNITS[0] },
        env: {},
      });
    let last = 200;
    for (let k = 0; k < 14; k++) last = (await mk()).status;
    assert.equal(last, 429);
  });
});
