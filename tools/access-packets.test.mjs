import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { Packer } from "docx";
import { JSDOM } from "jsdom";
import { ITEM_TYPES } from "./lib/access-lab-content.mjs";
import { packetDocx } from "./lib/access-packet-docx.mjs";
import { packetHTML } from "./lib/access-packet-html.mjs";

// Resolve the ZIP reader from its declaring package; no generated files are written.
const requireDocx = createRequire(import.meta.resolve("docx"));
const JSZip = requireDocx("jszip");
const wordNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const xml = (source) => new JSDOM(source, { contentType: "text/xml" }).window.document;
const wordText = (document) =>
  [...document.getElementsByTagNameNS(wordNS, "t")].map((node) => node.textContent).join(" ");
const teacherScript = "TEACHER_ONLY_SCRIPT: The hidden speaker saw a purple kite.";
const teacherModel = "TEACHER_ONLY_MODEL: My reason explains the observed result.";
const base = (type, data) => ({
  id: `fixture-${type}`,
  type,
  title: `Exercise ${type}`,
  directions: `Directions for ${type}.`,
  prompt: `Prompt for ${type}.`,
  ...data,
});
const activities = [
  base("multipleChoice", {
    listening: true,
    script: [teacherScript],
    options: [
      {
        id: "a",
        text: "Choice cedar",
        picture: { src: "pictures/35-writing-seed-story.svg", alt: "A seed growing in sequence" },
      },
      { id: "b", text: "Choice maple", visual: "🌳" },
    ],
    answer: "b",
  }),
  base("multiSelect", {
    options: [
      { id: "a", text: "Select copper" },
      { id: "b", text: "Select silver" },
      { id: "c", text: "Select gold" },
    ],
    answers: ["a", "c"],
  }),
  base("order", {
    items: [
      { id: "first", text: "Sequence planting" },
      { id: "second", text: "Sequence watering" },
    ],
    answer: ["first", "second"],
  }),
  base("sort", {
    categories: ["Living group", "Nonliving group"],
    items: [
      { id: "a", text: "Sort butterfly", answer: "Living group" },
      { id: "b", text: "Sort pebble", answer: "Nonliving group" },
    ],
  }),
  base("cloze", {
    segments: [
      { text: "Cloze bridge " },
      { blank: { id: "blank", options: ["above", "below"], answer: "above" } },
      { text: " the river." },
    ],
  }),
  base("hotText", {
    sentences: [
      { id: "a", text: "Evidence sentence river" },
      { id: "b", text: "Evidence sentence mountain" },
    ],
    answers: ["b"],
  }),
  base("constructed", {
    passageTitle: "Read this context",
    passage: ["Passage orchard context."],
    picture: { src: "pictures/35-writing-park.svg", alt: "Children playing in the park" },
    chart: {
      type: "bar",
      title: "Plant heights",
      unit: "cm",
      data: [
        { label: "Bean", value: 4 },
        { label: "Pea", value: 7 },
      ],
    },
    table: {
      caption: "Observation table",
      headers: ["Trial heading", "Result heading"],
      rows: [
        ["Trial one", "Result twelve"],
        ["Trial two", "Result fourteen"],
      ],
    },
    successCriteria: ["Include one observed detail."],
    models: { A: teacherModel, B: "TEACHER_ONLY_GROWING", C: "TEACHER_ONLY_EXPANDING" },
  }),
  base("worksheet", {
    sheet: [
      {
        heading: "Worksheet response section",
        items: [
          "Worksheet first response",
          "Worksheet second response",
          "Worksheet story sketch: [draw here]",
        ],
      },
    ],
  }),
];
const job = {
  band: "3-5",
  domain: "Reading",
  level: "A",
  L: { activities, categories: [{ label: "Practice", activityIds: activities.map((a) => a.id) }] },
};
const contentMarkers = [
  "Choice cedar",
  "Choice maple",
  "Select copper",
  "Select silver",
  "Select gold",
  "Sequence planting",
  "Sequence watering",
  "Living group",
  "Nonliving group",
  "Sort butterfly",
  "Sort pebble",
  "Cloze bridge",
  "above",
  "below",
  "Evidence sentence river",
  "Evidence sentence mountain",
  "Passage orchard context.",
  "Trial heading",
  "Result heading",
  "Trial one",
  "Result twelve",
  "Worksheet response section",
  "Worksheet first response",
  "Worksheet second response",
];

function preserved(text) {
  for (const activity of activities) {
    assert.ok(text.includes(activity.title), `${activity.type}: title missing`);
    assert.ok(text.includes(activity.directions), `${activity.type}: directions missing`);
    assert.ok(text.includes(activity.prompt), `${activity.type}: prompt missing`);
  }
  for (const marker of contentMarkers)
    assert.ok(text.includes(marker), `Exercise content missing: ${marker}`);
}
function audience(text, teacher) {
  for (const marker of [
    teacherScript,
    teacherModel,
    "TEACHER_ONLY_GROWING",
    "TEACHER_ONLY_EXPANDING",
  ]) {
    assert.equal(
      text.includes(marker),
      teacher,
      `${teacher ? "Teacher missing" : "Student leaked"}: ${marker}`,
    );
  }
}
let packages;
async function documents() {
  packages ||= Promise.all(
    [false, true].map(async (teacher) => {
      const zip = await JSZip.loadAsync(
        await Packer.toBuffer(await packetDocx({ ...job, teacher })),
      );
      const document = xml(await zip.file("word/document.xml").async("string"));
      return { zip, document, teacher, text: wordText(document) };
    }),
  );
  return packages;
}

test("packet fixtures exercise every supported activity type", () => {
  assert.deepEqual(activities.map((a) => a.type).sort(), [...ITEM_TYPES].sort());
});

test("HTML preserves all exercises and separates student work from teacher scripts and keys", () => {
  for (const teacher of [false, true]) {
    const document = new JSDOM(packetHTML({ ...job, teacher })).window.document;
    const text = document.body.textContent;
    preserved(text);
    audience(text, teacher);
    assert.equal(
      document.querySelectorAll(".solution").length > 0,
      teacher,
      "Answer-key blocks must be teacher-only",
    );
    assert.ok(
      document.querySelector('img[src$="35-writing-park.svg"]'),
      "Picture stimulus missing",
    );
    assert.ok(
      document.querySelector('img[src$="35-writing-seed-story.svg"]'),
      "Picture answer option missing",
    );
    assert.ok(
      [...document.querySelectorAll("table")].some(
        (table) =>
          table.textContent.includes("Result twelve") &&
          table.textContent.includes("Trial heading"),
      ),
      "Data must remain a real table with headers and values",
    );
    assert.ok(
      text.includes("Plant heights") && text.includes("Bean") && text.includes("Pea"),
      "Chart stimulus and labels missing",
    );
    const printRules = [...document.querySelectorAll("style")]
      .map((style) => style.textContent)
      .join(" ");
    assert.match(
      printRules,
      /@page\s*\{[^}]*size:\s*(?:letter|8\.5in\s+11in)/i,
      "Print stylesheet must explicitly target Letter paper",
    );
  }
});

test("DOCX preserves every exercise and excludes teacher answers from student documents", async () => {
  for (const { text, teacher } of await documents()) {
    preserved(text);
    audience(text, teacher);
  }
});

test("picture-symbol answer options survive both printable formats", async () => {
  for (const teacher of [false, true]) {
    const document = new JSDOM(packetHTML({ ...job, teacher })).window.document;
    assert.match(
      document.querySelector(".options").textContent,
      /🌳/,
      "HTML omitted the answer option's visual",
    );
  }
  for (const { text } of await documents()) {
    assert.match(text, /🌳/, "DOCX omitted the answer option's visual");
  }
});

test("worksheet drawing prompts provide an actual blank drawing area", async () => {
  const htmlDocument = new JSDOM(packetHTML({ ...job, teacher: false })).window.document;
  const sketchItem = [...htmlDocument.querySelectorAll(".sheet-item")].find((node) =>
    node.textContent.includes("Worksheet story sketch"),
  );
  assert.ok(
    sketchItem?.querySelector(".drawing-box"),
    "HTML drawing prompt needs a drawing area, not ruled answer lines",
  );
  const { document } = (await documents()).find((entry) => !entry.teacher);
  const drawingBox = [...document.getElementsByTagNameNS(wordNS, "tbl")].find(
    (node) => !wordText(node).trim() && node.getElementsByTagNameNS(wordNS, "tc").length === 1,
  );
  assert.ok(drawingBox, "DOCX drawing prompt needs a blank single-cell drawing box");
  const height = drawingBox.getElementsByTagNameNS(wordNS, "trHeight")[0];
  assert.ok(
    Number(height?.getAttributeNS(wordNS, "val")) >= 1800,
    "Drawing box must provide at least 1.25 inches of drawing space",
  );
  const borders =
    drawingBox.getElementsByTagNameNS(wordNS, "tblBorders")[0] ||
    drawingBox.getElementsByTagNameNS(wordNS, "tcBorders")[0];
  assert.ok(borders, "Drawing box borders missing");
  for (const edge of ["top", "bottom", "left", "right"]) {
    const border = borders.getElementsByTagNameNS(wordNS, edge)[0];
    assert.ok(
      border && !["nil", "none", ""].includes(border.getAttributeNS(wordNS, "val")),
      `Drawing box ${edge} border missing`,
    );
  }
});

test("DOCX embeds usable picture and chart images and native data tables", async () => {
  for (const { zip, document } of await documents()) {
    const media = Object.keys(zip.files).filter((path) => /^word\/media\/.*\.png$/.test(path));
    assert.ok(
      media.length >= 3,
      "Stimulus picture, picture answer option, and chart should be embedded raster images",
    );
    for (const path of media) {
      const data = await zip.file(path).async("nodebuffer");
      assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `Invalid PNG: ${path}`);
    }
    assert.ok(
      document.getElementsByTagNameNS(wordNS, "drawing").length >= 3,
      "Images must be referenced in the document",
    );
    const table = [...document.getElementsByTagNameNS(wordNS, "tbl")].find((node) =>
      wordText(node).includes("Result twelve"),
    );
    assert.ok(table, "Table data must not be flattened into prose");
    assert.ok(wordText(table).includes("Trial heading"), "Table headers missing");
    assert.ok(table.getElementsByTagNameNS(wordNS, "tr").length >= 3, "Data table rows missing");
    assert.ok(table.getElementsByTagNameNS(wordNS, "tc").length >= 6, "Data table cells missing");
    assert.ok(
      !wordText(document).includes("[Picture:"),
      "Alt text cannot replace the actual stimulus",
    );
  }
});

test("DOCX uses explicit Letter pages, readable body typography, and page-number fields", async () => {
  for (const { zip, document } of await documents()) {
    const page = document.getElementsByTagNameNS(wordNS, "pgSz")[0];
    assert.ok(page, "Explicit page dimensions missing");
    assert.equal(page.getAttributeNS(wordNS, "w"), "12240");
    assert.equal(page.getAttributeNS(wordNS, "h"), "15840");
    const styles = xml(await zip.file("word/styles.xml").async("string"));
    const defaults = styles.getElementsByTagNameNS(wordNS, "docDefaults")[0];
    const sizes = [...(defaults?.getElementsByTagNameNS(wordNS, "sz") || [])].map((node) =>
      Number(node.getAttributeNS(wordNS, "val")),
    );
    assert.ok(
      sizes.some((size) => size >= 22 && size <= 24),
      "Default body should remain 11–12 pt",
    );
    assert.ok(
      defaults?.getElementsByTagNameNS(wordNS, "rFonts").length,
      "Explicit default font missing",
    );
    const footerPaths = Object.keys(zip.files).filter((path) =>
      /^word\/footer\d+\.xml$/.test(path),
    );
    const footers = (
      await Promise.all(footerPaths.map((path) => zip.file(path).async("string")))
    ).join(" ");
    assert.match(footers, /\bPAGE\b/, "Running page-number field missing");
  }
});
