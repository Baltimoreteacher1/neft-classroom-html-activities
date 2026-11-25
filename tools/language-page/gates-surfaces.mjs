// G-32 badges-and-claims, G-33 reveal-numbers-on-cards, G-34 standards-coverage-report, G-36 print-kit-and-pathways.
// G-32/G-33/G-34 render the REAL modules in jsdom (the lesson card is the exported timelineItem, the vocabulary
// cards are renderVisualVocabStudio in both modes). G-36 opens the real pages in Chromium and SKIPs without one.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BADGE_TEXT, DRAFT_NOTICE, lessonProvenance } from "../../shared/bcpss-provenance.js";
import { revealGroups } from "../../shared/bcpss-reveal.js";
import { clone } from "./dataset.mjs";
import { setupDom } from "./render.mjs";
import { startServer } from "./server.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const SHOTS =
  process.env.LP_SHOTS ||
  path.join(os.homedir(), "Documents/EduWonderLab/reports-2026-11-25/screens/phase3");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));

async function dom() {
  const window = setupDom();
  globalThis.Node ??= window.Node;
  return window;
}

// ── G-32 ──────────────────────────────────────────────────────────────────────
// A claim that content was checked by a person, anywhere a teacher reads it, must be backed by review state.
export const CLAIM_PATTERNS = [
  /\b(teacher|expert|human|peer|district|native|fluent)[- ](reviewed|verified|vetted|checked|approved)\b/i,
  /\b(fact-checked|vetted|officially (reviewed|verified))\b/i,
  /\bverified (by|content|translation|spanish)\b/i,
];
const CLAIM_DIRS = ["bcpss-teachers", "functions/_lib/bcpss", "shared"];
const CLAIM_SKIP = [/bcpss-teachers\/studio\//, /\.test\./, /shared\/(?!bcpss-)/];

/** Lines in `files` ([{file, text}]) that claim human review or verification. */
export function scanClaims(files) {
  const hits = [];
  for (const { file, text } of files)
    text.split("\n").forEach((line, i) => {
      if (CLAIM_PATTERNS.some((re) => re.test(line)))
        hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 110)}`);
    });
  return hits;
}

function claimFiles() {
  const out = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${ent.name}`;
      if (CLAIM_SKIP.some((re) => re.test(rel))) continue;
      if (ent.isDirectory()) walk(rel);
      else if (/\.(m?js|html)$/.test(ent.name))
        out.push({ file: rel, text: fs.readFileSync(path.join(ROOT, rel), "utf8") });
    }
  };
  for (const d of CLAIM_DIRS) walk(d);
  return out;
}

/** Lesson card -> problems with its badge. `expectState` is what the lesson's own fields say. */
export function checkLessonCard(card, lesson) {
  const chip = card?.querySelector?.(`[data-provenance][data-prov-block="${lesson.id}"]`);
  if (!chip) return [`${lesson.id}: lesson card has no provenance badge`];
  const want = lessonProvenance(lesson);
  const errors = [];
  if (chip.dataset.provenance !== want)
    errors.push(`${lesson.id}: badge says ${chip.dataset.provenance}, lesson data says ${want}`);
  if (chip.textContent !== BADGE_TEXT[chip.dataset.provenance])
    errors.push(`${lesson.id}: badge text "${chip.textContent}" does not match its state`);
  if (chip.dataset.provenance === "reviewed" && want !== "reviewed")
    errors.push(`${lesson.id}: card claims Reviewed`);
  return errors;
}

/** Vocabulary container -> problems: one chip in the header and one on every card, in every mode. */
export function checkVocabBadges(container, id, state) {
  const errors = [];
  for (const mode of ["cards", "print"]) {
    container.querySelector(`[data-vs-mode="${mode}"]`)?.click();
    const cards = [...container.querySelectorAll(".vs-card")];
    const chips = container.querySelectorAll(".vs-card [data-provenance]");
    if (!cards.length) errors.push(`${id}/${mode}: no vocabulary cards rendered`);
    if (chips.length !== cards.length)
      errors.push(`${id}/${mode}: ${chips.length} badges for ${cards.length} cards`);
    if (!container.querySelector(".vs-toolbar [data-provenance]"))
      errors.push(`${id}/${mode}: no badge in the studio header`);
    for (const c of container.querySelectorAll("[data-provenance]"))
      if (c.dataset.provenance !== state)
        errors.push(`${id}/${mode}: badge ${c.dataset.provenance} != unit state ${state}`);
    if (mode === "print" && state !== "reviewed" && !container.textContent.includes(DRAFT_NOTICE))
      errors.push(`${id}/print: printable set lacks the draft notice`);
  }
  return errors;
}

async function renderVocab(detail, provenance = detail.provenance) {
  const window = await dom();
  const { renderVisualVocabStudio } = await import("../../bcpss-teachers/vocab-studio.js");
  const container = window.document.createElement("div");
  window.document.body.append(container);
  renderVisualVocabStudio(container, {
    unit: detail.unit,
    connection: detail.connections[0],
    blueprint: {},
    wida: "3_4",
    provenance,
  });
  return container;
}

async function lessonCard(unitId, lesson) {
  await dom();
  const { timelineItem } = await import("../../bcpss-teachers/language-studio/studio-lessons.js");
  return timelineItem({ unitId, level: "l3_4" }, lesson);
}

export const g32 = {
  id: "G-32",
  name: "badges-and-claims",
  async run({ data }) {
    const errors = [];
    const states = {};
    let cards = 0;
    for (let i = 0; i < data.units.length; i += 1) {
      const id = data.units[i].unit.id;
      for (const l of data.lessons[i].lessons) {
        cards += 1;
        const state = lessonProvenance(l);
        states[state] = (states[state] ?? 0) + 1;
        errors.push(...checkLessonCard(await lessonCard(id, l), l));
      }
      const container = await renderVocab(data.units[i]);
      errors.push(...checkVocabBadges(container, id, data.units[i].provenance?.state ?? "draft"));
      container.remove();
    }
    const claims = scanClaims(claimFiles());
    errors.push(...claims.map((c) => `unsupported review claim: ${c}`));
    return { errors, info: { lessonCards: cards, units: data.units.length, ...states } };
  },
  async controls({ data }) {
    const i = data.units.findIndex((d) => d.provenance?.state === "draft");
    const id = data.units[i].unit.id;
    const lesson = data.lessons[i].lessons[0];
    const card = await lessonCard(id, lesson);
    const lying = card.cloneNode(true);
    const chip = lying.querySelector("[data-provenance]");
    chip.dataset.provenance = "reviewed";
    chip.textContent = BADGE_TEXT.reviewed;
    const bare = card.cloneNode(true);
    bare.querySelector("[data-provenance]").remove();
    // Cards rendered as if the unit were reviewed, judged against what the unit really is.
    const vocab = await renderVocab(data.units[i], { state: "reviewed" });
    return [
      { name: "lesson card that claims Reviewed", errors: checkLessonCard(lying, lesson) },
      { name: "lesson card with no badge", errors: checkLessonCard(bare, lesson) },
      {
        name: "vocabulary cards that say Reviewed for a draft unit",
        errors: checkVocabBadges(vocab, id, "draft"),
      },
      {
        name: "source line claiming teacher review",
        errors: scanClaims([
          { file: "x.js", text: 'tip: "Spanish glosses are teacher-reviewed drafts."' },
        ]),
      },
    ];
  },
};

// ── G-33 ──────────────────────────────────────────────────────────────────────
/** Card -> problems: every Reveal id and unit in `lesson.reveal` is shown; a lesson without reveal shows none. */
export function checkRevealCard(card, lesson) {
  const note = card.querySelector("[data-reveal]");
  const rows = lesson.reveal ?? [];
  if (!rows.length)
    return note ? [`${lesson.id}: card shows Reveal numbers the data does not carry`] : [];
  if (!note) return [`${lesson.id}: card does not show its ${rows.length} Reveal lesson(s)`];
  const text = note.textContent;
  const errors = [];
  for (const r of rows) {
    if (!text.includes(r.id))
      errors.push(`${lesson.id}: Reveal lesson ${r.id} missing from the card`);
    if (!new RegExp(`Unit ${r.unit}\\b`).test(text))
      errors.push(`${lesson.id}: Reveal unit ${r.unit} missing from the card`);
  }
  if (!/Reveal Math/.test(text)) errors.push(`${lesson.id}: card does not name Reveal Math`);
  return errors;
}

export const g33 = {
  id: "G-33",
  name: "reveal-numbers-on-cards",
  async run({ data }) {
    const errors = [];
    let withReveal = 0;
    const grades = new Set();
    for (let i = 0; i < data.units.length; i += 1) {
      const id = data.units[i].unit.id;
      for (const l of data.lessons[i].lessons) {
        if (l.reveal?.length) {
          withReveal += 1;
          grades.add(id.split("-")[0]);
        }
        errors.push(...checkRevealCard(await lessonCard(id, l), l));
      }
    }
    if (withReveal < 30)
      errors.push(`only ${withReveal} lessons carry reveal[] (expected the Grade 6 math set)`);
    // Spot check by hand-written expectation: site Unit 2 lesson 1 maps to Reveal 3-1, 3-2 and 3-9.
    const u2 = data.lessons[data.units.findIndex((d) => d.unit.id === "g6-math-u2")].lessons[0];
    const ids = (u2.reveal ?? []).map((r) => r.id).join(",");
    if (ids !== "3-1,3-2,3-9")
      errors.push(`g6-math-u2-l01 reveal ids are ${ids}, expected 3-1,3-2,3-9`);
    return {
      errors,
      info: { lessonsWithReveal: withReveal, gradesWithReveal: [...grades].join(",") },
    };
  },
  async controls({ data }) {
    const i = data.units.findIndex((d) => d.unit.id === "g6-math-u2");
    const lesson = data.lessons[i].lessons[0];
    const stripped = await lessonCard("g6-math-u2", { ...lesson, reveal: [] });
    const wrong = await lessonCard("g6-math-u2", {
      ...clone(lesson),
      reveal: [{ id: "9-9", title: "x", unit: 9, terms: ["x"] }],
    });
    const ghost = await lessonCard("g6-math-u2", lesson);
    return [
      { name: "card rendered without its reveal[]", errors: checkRevealCard(stripped, lesson) },
      { name: "card showing different Reveal numbers", errors: checkRevealCard(wrong, lesson) },
      {
        name: "card showing Reveal numbers for a lesson without any",
        errors: checkRevealCard(ghost, { ...lesson, reveal: [] }),
      },
    ];
  },
};

// ── G-34 ──────────────────────────────────────────────────────────────────────
// Recomputed here from the unit API documents (a different path from the report's seed import) and the raw
// reference list, then compared to the committed file field by field.
const BRIEF_G6_ABSENT = [
  "6.G.A.3",
  "6.NS.B.4",
  "6.EE.A.3",
  "6.EE.A.4",
  "6.EE.B.5",
  "6.EE.B.6",
  "6.EE.B.8",
  "6.SP.A.2",
  "6.SP.A.3",
];

export function recompute(units, reference) {
  const out = {};
  for (const s of reference.standards) {
    const g = Number(s.grade) === 0 ? "K" : String(s.grade);
    (out[g] ??= { ref: [], used: new Map() }).ref.push(s.code);
  }
  for (const d of units) {
    if (d.unit.subject !== "Math") continue;
    const g = String(d.unit.grade);
    for (const code of d.unit.core_standards ?? [])
      (out[g].used.get(code) ?? out[g].used.set(code, []).get(code)).push(d.unit.id);
  }
  return out;
}

export function checkCoverage(report, units, reference) {
  const errors = [];
  const want = recompute(units, reference);
  if (report?.grades?.[0]?.grade !== "6") errors.push("Grade 6 is not first");
  if (report?.status !== "draft") errors.push('report is not labelled "draft"');
  if (!/ELA, Science and Social Studies/.test(report?.scope ?? ""))
    errors.push("scope does not say which subjects are not covered");
  for (const [grade, w] of Object.entries(want)) {
    const g = report?.grades?.find((x) => x.grade === grade);
    if (!g) {
      errors.push(`grade ${grade}: missing from report`);
      continue;
    }
    const inCodes = [...w.used.keys()].filter((c) => w.ref.includes(c)).sort();
    const outCodes = w.ref.filter((c) => !w.used.has(c)).sort();
    if (g.reference_count !== w.ref.length)
      errors.push(`grade ${grade}: reference_count ${g.reference_count} != ${w.ref.length}`);
    if (JSON.stringify(g.in_studio.map((r) => r.code)) !== JSON.stringify(inCodes))
      errors.push(`grade ${grade}: in_studio codes differ from recomputed`);
    if (JSON.stringify(g.not_in_studio.map((r) => r.code)) !== JSON.stringify(outCodes))
      errors.push(`grade ${grade}: not_in_studio codes differ from recomputed`);
    if (g.in_studio_count !== inCodes.length || g.not_in_studio_count !== outCodes.length)
      errors.push(`grade ${grade}: counts differ from recomputed`);
    if (g.in_studio_count + g.not_in_studio_count !== g.reference_count)
      errors.push(`grade ${grade}: in + out != reference`);
    for (const r of g.in_studio)
      if (JSON.stringify(r.units) !== JSON.stringify((w.used.get(r.code) ?? []).slice().sort()))
        errors.push(`grade ${grade}: ${r.code} unit list differs`);
    const stray = [...w.used.keys()].filter((c) => !w.ref.includes(c));
    if (JSON.stringify(g.listed_not_in_reference) !== JSON.stringify(stray.sort()))
      errors.push(`grade ${grade}: listed_not_in_reference differs`);
  }
  const g6 = report?.grades?.find((x) => x.grade === "6");
  if (
    JSON.stringify(g6?.not_in_studio?.map((r) => r.code).sort()) !==
    JSON.stringify([...BRIEF_G6_ABSENT].sort())
  )
    errors.push(
      "Grade 6 'not in the Studio' set differs from the audit's hand-listed 9 absent standards",
    );
  return errors;
}

export const g34 = {
  id: "G-34",
  name: "standards-coverage-report",
  async run({ data }) {
    const report = readJson("data/bcpss-standards-coverage.json");
    const reference = readJson("math/fluency-lab/content/ccss-k8.json");
    const errors = checkCoverage(report, data.units, reference);
    const g6 = report.grades[0];
    return {
      errors,
      info: { grade6: `${g6.in_studio_count}/${g6.reference_count}`, grades: report.grades.length },
    };
  },
  async controls({ data }) {
    const report = readJson("data/bcpss-standards-coverage.json");
    const reference = readJson("math/fluency-lab/content/ccss-k8.json");
    const moved = clone(report);
    moved.grades[0].in_studio.push(moved.grades[0].not_in_studio.shift());
    const counted = clone(report);
    counted.grades[0].in_studio_count += 1;
    const dropped = clone(report);
    dropped.grades[3].in_studio.pop();
    const shrunk = clone(reference);
    shrunk.standards = shrunk.standards.filter((s) => s.code !== "6.RP.A.1");
    return [
      {
        name: "a not-in-Studio standard moved to in-Studio",
        errors: checkCoverage(moved, data.units, reference),
      },
      {
        name: "an in-Studio count that disagrees",
        errors: checkCoverage(counted, data.units, reference),
      },
      {
        name: "a Grade 2 standard silently dropped",
        errors: checkCoverage(dropped, data.units, reference),
      },
      {
        name: "reference list changed under the report",
        errors: checkCoverage(report, data.units, shrunk),
      },
    ];
  },
};

// ── G-36 ──────────────────────────────────────────────────────────────────────
async function launch() {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (err) {
    return { skip: String(err?.message || err).split("\n")[0] };
  }
}

/** Pathways unit cards -> problems: distinct link targets and labels, one "Mark taught" control each. */
export function checkPathwaysCards(cards) {
  const errors = [];
  if (!cards.length) return ["pathways: no unit cards rendered"];
  for (const c of cards) {
    const hrefs = c.links.map((l) => l.href);
    const labels = c.links.map((l) => l.text.trim().toLowerCase());
    if (new Set(hrefs).size !== hrefs.length)
      errors.push(`${c.title}: two links share one destination (${hrefs.join(", ")})`);
    if (new Set(labels).size !== labels.length)
      errors.push(`${c.title}: two links share one label`);
    if (!/^Mark taught/.test(c.taught))
      errors.push(`${c.title}: taught control reads "${c.taught}"`);
    if (c.takenBoxes !== 1) errors.push(`${c.title}: ${c.takenBoxes} taught controls`);
  }
  return errors;
}

const readCards = () =>
  [...document.querySelectorAll(".pw-unit")].map((li) => ({
    title: li.querySelector("h4")?.textContent ?? "?",
    links: [...li.querySelectorAll(".pw-links a")].map((a) => ({
      text: a.textContent,
      href: a.getAttribute("href"),
    })),
    taught: li.querySelector(".pw-check span")?.firstChild?.textContent ?? "",
    takenBoxes: li.querySelectorAll("[data-taught]").length,
  }));

/** The lesson list host must not begin with a stringified null (replaceChildren(null) writes "null"). */
export const checkListHost = (text) =>
  /^\s*(null|undefined)/.test(text)
    ? ['language studio: the lesson list starts with the text "null"']
    : [];

export function checkPrintKit({ provCount, kitText }) {
  const errors = [];
  if (!kitText.trim()) errors.push("print kit rendered empty");
  if (provCount < 1) errors.push("print kit has no provenance badge");
  if (!kitText.includes(DRAFT_NOTICE)) errors.push("print kit lacks the draft notice");
  return errors;
}

async function probe(page, base) {
  const errors = [];
  const shot = async (p, name) => {
    fs.mkdirSync(SHOTS, { recursive: true });
    await p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
  };
  // Teacher page: print kit + vocabulary badges on a draft unit.
  await page.goto(`${base}/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1&tab=vocab`, {
    waitUntil: "load",
  });
  await page.waitForSelector("#panel-vocab .vs-card", { timeout: 8000 });
  const kit = await page.evaluate(() => ({
    provCount: document.querySelectorAll("#printKit [data-provenance]").length,
    kitText: document.querySelector("#printKit")?.textContent ?? "",
  }));
  errors.push(...checkPrintKit(kit));
  const cards = await page.$$eval("#panel-vocab .vs-card", (els) =>
    els.map((e) => !!e.querySelector("[data-provenance]")),
  );
  if (cards.some((x) => !x)) errors.push("vocabulary: a card in the real page has no badge");
  await page.locator("#panel-vocab .vs-card").first().scrollIntoViewIfNeeded();
  await shot(page, "vocab-badges");
  // Language Studio lesson cards: badge + Reveal text from the real API.
  await page.goto(`${base}/bcpss-teachers/language-studio/?unit=g6-math-u2`, { waitUntil: "load" });
  await page
    .waitForSelector(".sl-tl__item", { timeout: 8000 })
    .catch(() => errors.push("language studio: no lesson cards rendered"));
  const items = await page.$$eval(".sl-tl__item", (els) =>
    els.map((e) => ({
      chip: !!e.querySelector("[data-provenance]"),
      reveal: e.querySelector("[data-reveal]")?.textContent ?? "",
    })),
  );
  if (items.some((x) => !x.chip)) errors.push("language studio: a lesson card has no badge");
  if (!items.some((x) => /3-1/.test(x.reveal)))
    errors.push("language studio: Reveal 3-1 not shown on any Grade 6 Unit 2 card");
  const host = await page.$eval(".sl-tl-host", (e) => e.textContent).catch(() => "");
  errors.push(...checkListHost(host));
  await page.locator(".sl-tl__item").first().scrollIntoViewIfNeeded();
  await shot(page, "lesson-cards");
  // Pathways.
  await page.goto(`${base}/bcpss-teachers/pathways/?grade=6`, { waitUntil: "load" });
  await page.waitForSelector(".pw-unit", { timeout: 8000 });
  errors.push(...checkPathwaysCards(await page.evaluate(readCards)));
  const g6 = readJson("data/bcpss-standards-coverage.json").grades[0];
  await page
    .waitForSelector("[data-coverage-grade]", { timeout: 4000 })
    .catch(() => errors.push("pathways: no standards coverage section"));
  const cov = await page.$eval("[data-coverage-grade]", (e) => e.textContent).catch(() => "");
  if (!cov.includes(`${g6.in_studio_count} of ${g6.reference_count}`))
    errors.push("pathways: coverage section does not show the report's Grade 6 count");
  await shot(page, "pathways-coverage");
  return errors;
}

export const g36 = {
  id: "G-36",
  name: "print-kit-and-pathways (real browser)",
  browser: true,
  async run() {
    const browser = await launch();
    if (browser.skip) return { skip: browser.skip };
    const { server, base } = await startServer();
    try {
      const page = await (
        await browser.newContext({ viewport: { width: 1280, height: 900 } })
      ).newPage();
      return { errors: await probe(page, base), info: { shots: SHOTS } };
    } finally {
      await browser.close();
      server.close();
    }
  },
  async controls() {
    const card = (over = {}) => ({
      title: "U",
      links: [
        { text: "Open unit", href: "/a" },
        { text: "Family guide", href: "/b" },
      ],
      taught: "Mark taught",
      takenBoxes: 1,
      ...over,
    });
    return [
      {
        name: "two Pathways links to one destination",
        errors: checkPathwaysCards([
          card({
            links: [
              { text: "Open unit", href: "/a" },
              { text: "Activities", href: "/a" },
            ],
          }),
        ]),
      },
      {
        name: "taught control mislabelled",
        errors: checkPathwaysCards([card({ taught: "Taught" })]),
      },
      { name: "lesson list that starts with nullnull", errors: checkListHost("nullnullLesson 1") },
      {
        name: "print kit without a badge or notice",
        errors: checkPrintKit({ provCount: 0, kitText: "Unit 1 anchor chart" }),
      },
    ];
  },
};
