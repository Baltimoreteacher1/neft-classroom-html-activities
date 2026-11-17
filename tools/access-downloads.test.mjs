/**
 * The Language Page: every activity is downloadable (src/download/). For ALL bank activities (content/index.json):
 *   - the student document and its .docx build; the .docx is a valid ZIP (CRC-checked) whose word/document.xml
 *     parses as XML and contains the title and every item stem;
 *   - the student file holds NO answer data: no answer-only text (correct/feedback/model/key/tracker strings), no
 *     answer-key heading, and order items never in the solved order;
 *   - the teacher edition (answer-key.js) holds the answers;
 * plus Studio tasks, the simulation mission handout (no outcome conditions or replies), one .docx per room
 * activity in the room .zip, the print view, and the menu module's contract (kinds, keys, click handling).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const json = (p) => JSON.parse(readFileSync(join(LAB, p), "utf8"));
const M = await import(join(LAB, "src/download/model.js"));
const { toDocx } = await import(join(LAB, "src/download/docx.js"));
const K = await import(join(LAB, "src/download/answer-key.js"));
const S = await import(join(LAB, "src/download/studio.js"));
const B = await import(join(LAB, "src/download/bundle.js"));
const P = await import(join(LAB, "src/download/print.js"));
const MENU = await import(join(LAB, "src/download/menu.js"));
const { ordered } = await import(join(LAB, "src/content.js"));
const { correctAnswerText } = await import(join(LAB, "src/grade.js"));
const { toHtml } = await import(join(LAB, "src/util.js"));
const { missionById, MISSION_IDS } = await import(join(LAB, "src/sim/missions/index.js"));
const { initialOrder } = await import(join(LAB, "src/items.js"));
const { sceneAlt } = await import(join(LAB, "src/early/scenes.js"));

const parser = new new JSDOM("").window.DOMParser();
const norm = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);

// ── a small reader for stored ZIPs (independent of the writer) ───────────────
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function unzip(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && v.getUint32(end, true) !== 0x06054b50) end--;
  assert.ok(end >= 0, "end of central directory");
  const count = v.getUint16(end + 10, true);
  let p = v.getUint32(end + 16, true);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(v.getUint32(p, true), 0x02014b50, "central header");
    const method = v.getUint16(p + 10, true);
    const crc = v.getUint32(p + 16, true);
    const size = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true);
    const extra = v.getUint16(p + 30, true);
    const comment = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    assert.equal(method, 0, `${name} is stored`);
    assert.equal(v.getUint32(local, true), 0x04034b50, "local header");
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    assert.equal(crc32(data), crc, `${name} CRC`);
    assert.ok(!out.has(name), `duplicate ${name}`);
    out.set(name, data);
    p += 46 + nameLen + extra + comment;
  }
  return out;
}
/** Open a .docx, parse word/document.xml, return its paragraph text (one line per w:p). */
function docxText(bytes, label) {
  const files = unzip(bytes);
  for (const part of [
    "[Content_Types].xml",
    "_rels/.rels",
    "word/document.xml",
    "word/styles.xml",
    "word/_rels/document.xml.rels",
  ])
    assert.ok(files.has(part), `${label}: ${part}`);
  const xml = new TextDecoder().decode(files.get("word/document.xml"));
  const dom = parser.parseFromString(xml, "application/xml");
  assert.equal(dom.getElementsByTagName("parsererror").length, 0, `${label}: document.xml parses`);
  const paras = [...dom.getElementsByTagName("w:p")].map((p) =>
    [...p.getElementsByTagName("w:t")].map((t) => t.textContent).join(""),
  );
  return paras.join("\n");
}

// ── every bank activity ────────────────────────────────────────────────────────
const index = json("content/index.json");
const all = [];
for (const [band, B0] of Object.entries(index.bands))
  for (const [domain, D] of Object.entries(B0.domains)) {
    const data = json(`content/g${band}/${domain}.json`);
    for (const level of Object.keys(D.levels)) {
      const list = ordered(data.levels[level]);
      const indexed = D.levels[level].activities.map((r) => r[0]);
      assert.deepEqual(
        new Set(list.map((a) => a.id)),
        new Set(indexed),
        `${band}/${domain}/${level} index matches file`,
      );
      for (const a of list) all.push({ a, band, domain, level, list });
    }
  }
const optsOf = ({ band, domain, level, a }, lang = "en") => ({
  band,
  domain,
  level,
  lang,
  url: `https://thelanguagepage.com/access-practice-lab/${domain}/${level}/${a.id}`,
});

/** Text a learner sees for the item: the title and every stem. */
function stems(a, domain) {
  const listening = domain === "Listening" || a.listening;
  return [
    a.title,
    a.prompt,
    ...(a.options || []).map((o) => o.text),
    ...(a.items || []).map((i) => i.text),
    ...(a.sentences || []).map((s) => s.text),
    ...(a.segments || []).filter((s) => !s.blank).map((s) => s.text),
    ...(a.sheet || []).flatMap((p) => [p.heading, ...asList(p.items)]),
    ...(listening
      ? asList(a.adminScript).length
        ? asList(a.adminScript)
        : asList(a.script)
      : asList(a.passage)),
  ]
    .map(norm)
    .filter((s) => s.length > 1);
}

const ANSWER_FIELDS = [
  "answer",
  "answers",
  "correct",
  "distractorFeedback",
  "itemFeedback",
  "models",
  "modelStudent",
  "modelNotes",
  "answerKey",
  "model",
  "tracker",
  "teacher",
  "teacherNote",
];
const strings = (v) =>
  v == null
    ? []
    : typeof v === "string"
      ? [v]
      : typeof v === "object"
        ? Object.values(v).flatMap(strings)
        : [];
/** Answer-only text: strings in answer fields that do not also appear in what the learner is shown. */
function answerOnly(a) {
  const shown = { ...a };
  for (const k of ANSWER_FIELDS) delete shown[k];
  // The K-3 scene's alt text is shown too (it lives in early/scenes.js, not in the record).
  const visible = norm(
    `${JSON.stringify(shown).replace(/\\"/g, '"')} ${a.scene ? asList(sceneAlt(a.scene)).join(" ") : ""}`,
  );
  const text = [
    a.correct,
    ...strings(a.distractorFeedback),
    ...strings(a.itemFeedback),
    ...strings(a.models),
    a.modelStudent?.text,
    ...strings(a.modelNotes),
    ...strings(a.answerKey),
    a.model,
    ...asList(a.tracker).map((r) => asList(r)[1]),
  ];
  return text.map(norm).filter((s) => s.length >= 8 && !visible.includes(s));
}

test(`all ${all.length} activities: student .docx is valid, complete and answer-free; the teacher key has the answers`, () => {
  assert.ok(all.length >= 890, `the bank has ${all.length} activities`);
  const problems = [];
  let leaksChecked = 0;
  for (const row of all) {
    const { a, domain } = row;
    const doc = M.activityDocument(a, optsOf(row));
    const text = norm(docxText(toDocx(doc), a.id));
    for (const s of stems(a, domain))
      if (!text.includes(s)) problems.push(`${a.id}: missing stem "${s.slice(0, 60)}"`);
    for (const s of answerOnly(a)) {
      leaksChecked++;
      if (text.includes(s))
        problems.push(`${a.id}: answer text in the student file "${s.slice(0, 60)}"`);
    }
    if (/Answer key|Correct answer|Clave de respuestas/.test(text))
      problems.push(`${a.id}: answer-key label in the student file`);
    if (a.type === "order" && (a.items || []).length > 1) {
      const solved = (a.answer || []).map((id) =>
        norm(
          [a.items.find((i) => i.id === id)?.visual, a.items.find((i) => i.id === id)?.text]
            .filter(Boolean)
            .join(" "),
        ),
      );
      const listed =
        doc.blocks.find((b) => b.t === "list" && b.box === "____")?.items.map(norm) || [];
      if (listed.length !== solved.length)
        problems.push(`${a.id}: order list has ${listed.length} of ${solved.length} steps`);
      if (listed.join("|") === solved.join("|"))
        problems.push(`${a.id}: the file lists the steps in the solved order`);
    }
    // Teacher edition: the answers are there.
    const key = norm(docxText(toDocx(K.answerKeyDocument(a, optsOf(row))), `${a.id} key`));
    const want = [
      correctAnswerText(a),
      a.correct,
      ...strings(a.models),
      ...strings(a.answerKey),
      a.model,
    ]
      .map(norm)
      .filter(Boolean);
    for (const s of want)
      if (!key.includes(s)) problems.push(`${a.id}: teacher key missing "${s.slice(0, 60)}"`);
  }
  assert.deepEqual(problems.slice(0, 30), [], `${problems.length} problems`);
  assert.ok(leaksChecked > 1000, `answer strings checked: ${leaksChecked}`);
});

test("the leak check fires: an answer put into a student document is caught", () => {
  const row = all.find(
    (r) => r.a.type === "multipleChoice" && r.a.correct && answerOnly(r.a).length,
  );
  const doc = M.activityDocument(row.a, optsOf(row));
  const bad = { ...doc, blocks: [...doc.blocks, { t: "p", text: row.a.correct }] };
  const text = norm(docxText(toDocx(bad), "mutant"));
  assert.ok(answerOnly(row.a).some((s) => text.includes(s)));
});

test("interface text follows the language; content stays English; K-3 scripts are for the adult", () => {
  const row = all.find((r) => r.band === "K" && r.domain === "Listening" && r.a.script);
  const es = M.activityDocument(row.a, optsOf(row, "es"));
  const t = M.documentText(es);
  assert.match(t, /Instrucciones/);
  assert.match(t, /Para que un adulto lo lea en voz alta/);
  assert.match(t, /Para el adulto: lean en voz alta/);
  assert.ok(t.includes(norm(row.a.prompt)), "the English question is kept");
  assert.ok(es.blocks.filter((b) => b.t === "script").every((b) => b.lang === "en"));
  const en = M.documentText(M.activityDocument(row.a, optsOf(row)));
  assert.match(en, /For the adult to read aloud/);
  assert.doesNotMatch(en, /Instrucciones/);
  const bi = M.documentText(M.activityDocument(row.a, optsOf(row, "bi")));
  assert.match(bi, /Directions \/ Instrucciones/);
});

test("supports are optional help, apart from the task", () => {
  const row = all.find((r) => asList(r.a.frames).length && asList(r.a.vocabulary).length);
  const doc = M.activityDocument(row.a, optsOf(row));
  const help = doc.blocks.find((b) => b.t === "help");
  assert.ok(help, "a help box");
  assert.match(help.title, /Optional help/);
  assert.ok(M.documentText({ ...doc, blocks: help.blocks }).includes(row.a.frames[0]));
  assert.ok(
    !doc.blocks.some((b) => b !== help && b.t === "list" && b.items.includes(row.a.frames[0])),
    "frames only inside help",
  );
});

test("print view: one HTML page with the title, a QR to the activity, pictures and no answers", () => {
  const row = all.find((r) => r.a.picture && r.domain === "Listening");
  const doc = M.activityDocument(row.a, optsOf(row, "es"));
  const page = P.printDocumentHTML(doc, {
    origin: "https://thelanguagepage.com",
    ui: { print: "Imprimir", close: "Cerrar", howTo: "Guardar como PDF" },
  });
  const dom = new JSDOM(page).window.document;
  assert.equal(dom.documentElement.lang, "es");
  assert.equal(dom.querySelector("h1").getAttribute("lang"), "en");
  assert.equal(norm(dom.querySelector("h1").textContent), norm(row.a.title));
  assert.ok(dom.querySelector("footer svg"), "QR code");
  assert.ok(dom.querySelector(`a[href="${optsOf(row).url}"]`), "the online link");
  const img = dom.querySelector("figure img");
  assert.ok(
    img?.src.startsWith("https://thelanguagepage.com/access-practice-lab/pictures/"),
    "the lab's own picture",
  );
  assert.ok(img.alt.length > 10);
  assert.ok(dom.querySelector("[data-pv-print]"));
  for (const s of answerOnly(row.a)) assert.ok(!norm(dom.body.textContent).includes(s));
  const scene = all.find((r) => r.a.scene);
  const sp = P.printDocumentHTML(M.activityDocument(scene.a, optsOf(scene)), {});
  assert.match(sp, /<svg viewBox="0 0 640 400"/, "K-3 scene drawn in the page");
});

test("Studio tasks: every speaking and writing task builds, with no model answers or teacher notes", () => {
  for (const [file, kind] of [
    ["speaking", "speaking-task"],
    ["writing", "writing-task"],
  ]) {
    const tasks = json(`content/studio/${file}.json`).tasks;
    assert.ok(tasks.length > 5);
    for (const task of tasks) {
      const doc = S.studioTaskDocument(task, kind, { lang: "es", url: "https://x/y" });
      const text = norm(docxText(toDocx(doc), task.id));
      assert.ok(
        text.includes(norm(task.title)) && text.includes(norm(task.prompt)),
        `${task.id}: title and prompt`,
      );
      const hidden = [
        task.stages?.guided?.model,
        ...strings(task.teacher),
        ...asList(task.turns).map((t) => t.expects),
      ]
        .map(norm)
        .filter((s) => s.length >= 12);
      for (const s of hidden)
        assert.ok(!text.includes(s), `${task.id}: hidden text leaked "${s.slice(0, 50)}"`);
      assert.match(text, /Tu tarea/);
    }
  }
  assert.throws(() => S.studioTaskDocument({ id: "x", title: "y" }, "nope"));
});

test("simulation: the mission handout has map, people, evidence and tasks, never the outcome conditions", () => {
  for (const id of MISSION_IDS)
    for (const band of ["3-5", "6-8"]) {
      const def = missionById(id, band);
      const doc = S.simulationDocument(def, { lang: "en", url: "https://x/sim" });
      const text = norm(docxText(toDocx(doc), `${id}/${band}`));
      for (const s of [
        def.title[0],
        def.summary[0],
        ...def.scenes.map((x) => x.title[0]),
        ...def.characters.map((c) => c.name),
        ...def.evidence.map((e) => e.title[0]),
        ...def.tasks.map((t) => t.prompt[0]),
      ])
        assert.ok(text.includes(norm(s)), `${id}: missing "${String(s).slice(0, 50)}"`);
      const secret = [
        ...def.outcomes.flatMap((o) => [...strings(o.text), JSON.stringify(o.when)]),
        ...def.tasks.flatMap((t) => asList(t.options).flatMap((o) => strings(o.reply))),
        ...def.characters.flatMap((c) => asList(c.topics).flatMap((tp) => strings(tp.answer))),
      ]
        .map(norm)
        .filter((s) => s.length >= 12);
      for (const s of secret)
        assert.ok(!text.includes(s), `${id}: outcome/reply/answer leaked "${s.slice(0, 50)}"`);
      assert.ok(
        !/"(supports|contradicts|strength|when|sets|reply)":/.test(JSON.stringify(doc.blocks)),
        "no evidence weights or outcome rules",
      );
      const lines = doc.blocks.filter((b) => b.t === "lines").length;
      assert.ok(lines >= def.tasks.length, "answer lines for every task");
    }
});

test("room .zip: one .docx per room activity, for every room", async () => {
  const rooms = new Map();
  for (const r of all) rooms.set(`${r.band}|${r.domain}|${r.level}`, r);
  let files = 0;
  for (const r of rooms.values()) {
    const seen = [];
    const { bytes, names } = await B.roomZip(r.list, (a) => optsOf({ ...r, a }), {
      onProgress: (n, total) => seen.push(`${n}/${total}`),
    });
    const zip = unzip(bytes);
    assert.equal(zip.size, r.list.length, `${r.band}/${r.domain}/${r.level}`);
    assert.deepEqual([...zip.keys()], names);
    assert.ok(names.every((n) => /^\d{2,}-[a-z0-9-]+\.docx$/.test(n)));
    assert.equal(seen.at(-1), `${r.list.length}/${r.list.length}`);
    const first = docxText(zip.get(names[0]), names[0]);
    assert.ok(norm(first).includes(norm(r.list[0].title)));
    files += zip.size;
  }
  assert.equal(files, all.length, "every activity is in exactly one room zip");
  const r = [...rooms.values()][0];
  let calls = 0;
  await assert.rejects(
    B.roomZip(r.list, (a) => optsOf({ ...r, a }), { cancelled: () => ++calls > 2 }),
    B.Cancelled,
  );
});

test("menu: every kind renders Word + PDF controls (room: zip + cancel + status); clicks are claimed only for its controls", async () => {
  const ctx = { prefs: { lang: "es" }, route: { view: "activity" } };
  const task = json("content/studio/speaking.json").tasks[0];
  const def = missionById(MISSION_IDS[0], "6-8");
  for (const [kind, src] of [
    ["activity", { id: "gk-l-a-find-seed", band: "K", domain: "Listening", level: "A" }],
    ["speaking-task", task],
    ["writing-task", json("content/studio/writing.json").tasks[0]],
    ["simulation", def],
  ]) {
    const out = toHtml(MENU.downloadMenuHTML(ctx, kind, src));
    assert.match(out, /data-dl="docx"/, kind);
    assert.match(out, /data-dl="pdf"/, kind);
    assert.match(out, /Imprimir o guardar como PDF/, kind);
    const key = out.match(/data-dl-key="([^"]+)"/)[1];
    assert.equal(MENU.downloadSource(key).source, src);
    assert.match(out, new RegExp(`role="status" data-dl-status="${key}"`));
  }
  const room = toHtml(
    MENU.downloadMenuHTML({ prefs: {}, route: {} }, "room", {
      band: "6-8",
      domain: "Reading",
      level: "B",
    }),
  );
  assert.match(room, /data-dl="room-zip"/);
  assert.match(room, /data-dl="cancel"[^>]*hidden/);
  assert.match(room, /Download all activities in this room/);
  assert.match(room, /No answers are included/);
  assert.throws(() => MENU.downloadMenuHTML(ctx, "quiz", {}));
  assert.throws(() => MENU.downloadMenuHTML(ctx, "activity", null));
  // Clicks: anything that is not a registered control is left to the view.
  assert.equal(MENU.onDownloadClick({ target: { closest: () => null } }, ctx), false);
  assert.equal(
    MENU.onDownloadClick(
      { target: { closest: () => ({ dataset: { dl: "docx", dlKey: "nope" } }) } },
      ctx,
    ),
    false,
  );
  // A registered PDF control opens the print window synchronously, inside the click (pop-up rules), and claims it.
  let opened = 0;
  const prev = globalThis.window;
  globalThis.window = { open: () => (opened++, { closed: false, close() {} }) };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const key = toHtml(MENU.downloadMenuHTML(ctx, "speaking-task", task)).match(
      /data-dl-key="([^"]+)"/,
    )[1];
    assert.equal(
      MENU.onDownloadClick(
        { target: { closest: () => ({ dataset: { dl: "pdf", dlKey: key } }) } },
        ctx,
      ),
      true,
    );
    assert.equal(opened, 1);
    await new Promise((r) => setTimeout(r, 50));
  } finally {
    globalThis.window = prev;
    console.warn = warn;
  }
});

test("lazy loading and no keys on student surfaces: views import only menu.js; nothing student-side imports answer-key.js", () => {
  const read = (p) => readFileSync(join(LAB, p), "utf8");
  for (const view of ["src/views/activity.js", "src/views/room.js"]) {
    const src = read(view);
    assert.match(src, /from "\.\.\/download\/menu\.js"/, view);
    assert.doesNotMatch(src, /download\/(model|docx|print|run|bundle|answer-key)\.js/, view);
  }
  assert.match(read("src/download/menu.js"), /import\("\.\/run\.js"\)/);
  assert.doesNotMatch(read("src/download/menu.js"), /^import .*\.\/(run|model|docx|print)\.js/m);
  for (const f of [
    "menu.js",
    "run.js",
    "model.js",
    "docx.js",
    "print.js",
    "bundle.js",
    "studio.js",
  ])
    assert.doesNotMatch(read(`src/download/${f}`), /(from\s+|import\(\s*)"[^"]*answer-key/, f);
  const hub = readFileSync(join(REPO_ROOT, "access-teacher/activity-downloads.js"), "utf8");
  assert.match(hub, /download\/answer-key\.js/);
  assert.match(
    readFileSync(join(REPO_ROOT, "access-teacher/index.html"), "utf8"),
    /activity-downloads\.js"\)\.then\(\(m\) => m\.mountActivityDownloads\(\)\)/,
  );
});

test("the shared Word writer keeps the lesson kit's exports", async () => {
  const D = await import(join(LAB, "src/intro/tour/export-docx.js"));
  assert.equal(typeof D.kitDocx, "function");
  assert.equal(D.crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const z = unzip(D.zipStore([["a.txt", "hello"]]));
  assert.equal(new TextDecoder().decode(z.get("a.txt")), "hello");
});
