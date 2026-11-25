// G-07 provenance-visible, G-09 palette.
import fs from "node:fs";
import path from "node:path";
import {
  buildStudioDocument,
  renderStudioPart,
} from "../../functions/_lib/bcpss/studio-print-html.js";
import { DRAFT_FOOTER, DRAFT_NOTICE } from "../../shared/bcpss-provenance.js";
import { clone } from "./dataset.mjs";
import { setupDom } from "./render.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;

// ── G-07 ──────────────────────────────────────────────────────────────────────
export async function checkProvenance(detail, lessonsDoc, renderOverview) {
  const id = detail.unit.id;
  const errors = [];
  const p = detail.provenance;
  if (!p) return [`${id}: unit detail has no provenance`];
  const draftSource = lessonsDoc.source === "draft_standards_based";
  const pending = lessonsDoc.lessons.some(
    (l) => l.review?.pedagogy !== "reviewed" || l.review?.language_qa !== "reviewed",
  );
  if (draftSource && p.state !== "draft") errors.push(`${id}: draft source reported as ${p.state}`);
  if (!draftSource && pending && p.state !== "authored")
    errors.push(`${id}: authored/pending unit reported as ${p.state}`);
  if (p.state !== "reviewed") {
    const panel = setupDom().document.createElement("div");
    renderOverview(panel, { detail, wida: "3_4" });
    if (!panel.querySelector(`[data-provenance="${p.state}"]`))
      errors.push(`${id}: no visible ${p.state} badge on the unit overview`);
    if (!panel.textContent.includes(DRAFT_NOTICE))
      errors.push(`${id}: overview lacks the draft notice text`);
    const html = renderStudioPart(detail, { part: "packet", level: "l3_4" });
    if (!html.includes(DRAFT_NOTICE)) errors.push(`${id}: HTML/PDF export lacks the draft notice`);
    for (const part of ["book", "family"]) {
      const doc = buildStudioDocument(detail, { part, level: "l3_4" });
      if (doc.notice !== DRAFT_NOTICE || doc.footerLabel !== DRAFT_FOOTER)
        errors.push(`${id}: ${part} document model (Word/PDF) lacks the notice and footer label`);
    }
  }
  return errors;
}

export const g07 = {
  id: "G-07",
  name: "provenance-visible",
  async run({ data }) {
    const { renderOverview } = await import("../../bcpss-teachers/overview-tab.js");
    const errors = [];
    let draft = 0;
    for (let i = 0; i < data.units.length; i += 1) {
      if (data.units[i].provenance?.state === "draft") draft += 1;
      errors.push(...(await checkProvenance(data.units[i], data.lessons[i], renderOverview)));
    }
    if (draft < 150) errors.push(`only ${draft} draft units detected (expected ~159)`);
    return {
      errors,
      info: {
        draftUnits: draft,
        authored: data.units.filter((d) => d.provenance?.state === "authored").length,
      },
    };
  },
  async controls({ data }) {
    const { renderOverview } = await import("../../bcpss-teachers/overview-tab.js");
    const i = data.units.findIndex((d) => d.provenance?.state === "draft");
    const noProv = clone(data.units[i]);
    delete noProv.provenance;
    const lying = clone(data.units[i]);
    lying.provenance = { ...lying.provenance, state: "reviewed", notice: null };
    const silentOverview = () => {};
    return [
      {
        name: "unit detail without provenance",
        errors: await checkProvenance(noProv, data.lessons[i], renderOverview),
      },
      {
        name: "draft unit reported reviewed",
        errors: await checkProvenance(lying, data.lessons[i], renderOverview),
      },
      {
        name: "overview that renders no badge",
        errors: await checkProvenance(data.units[i], data.lessons[i], silentOverview),
      },
    ];
  },
};

// ── G-09 ──────────────────────────────────────────────────────────────────────
// Surfaces owned by this work. Legacy trees (bcpss-teachers/studio/**, shared/** other than the bcpss-*
// modules) hold pre-existing violet hits that are reported in the audit, not silently rewritten here.
const SCAN_DIRS = ["bcpss-teachers"];
const SCAN_SKIP = ["bcpss-teachers/studio/"];
const SCAN_FILES = ["shared/bcpss-telemetry-schema.js", "shared/bcpss-provenance.js"];
const SCAN_EXT = new Set([".css", ".js", ".html", ".svg"]);
// Indigo starts near 240 degrees; the brief says purple, violet and indigo-leaning hues are all out.
export const PURPLE_BAND = { min: 240, max: 300, minSat: 0.15 };

function rgbToHsl(r, g, b) {
  const [R, G, B] = [r, g, b].map((v) => v / 255);
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

export function colorsIn(text) {
  const out = [];
  for (const m of text.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    out.push({
      raw: m[0],
      ...rgbToHsl(
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
      ),
    });
  }
  for (const m of text.matchAll(/rgba?\(\s*(\d{1,3})[ ,]+(\d{1,3})[ ,]+(\d{1,3})/g))
    out.push({ raw: m[0], ...rgbToHsl(+m[1], +m[2], +m[3]) });
  for (const m of text.matchAll(
    /hsla?\(\s*(\d{1,3}(?:\.\d+)?)(?:deg)?[ ,]+(\d{1,3}(?:\.\d+)?)%[ ,]+(\d{1,3}(?:\.\d+)?)%/g,
  ))
    out.push({ raw: m[0], h: +m[1], s: +m[2] / 100, l: +m[3] / 100 });
  return out;
}

export const isPurple = ({ h, s, l }) =>
  h >= PURPLE_BAND.min && h <= PURPLE_BAND.max && s > PURPLE_BAND.minSat && l > 0.05 && l < 0.97;

export function scanPalette(files) {
  const hits = [];
  for (const [file, text] of files)
    for (const c of colorsIn(text))
      if (isPurple(c)) hits.push(`${file}: ${c.raw} (hue ${Math.round(c.h)})`);
  return hits;
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (SCAN_EXT.has(path.extname(e.name))) yield p;
  }
}

export const g09 = {
  id: "G-09",
  name: "palette (no purple)",
  async run() {
    const files = [];
    for (const d of SCAN_DIRS)
      for (const f of walk(path.join(ROOT, d))) {
        const rel = path.relative(ROOT, f);
        if (!SCAN_SKIP.some((s) => rel.startsWith(s)))
          files.push([rel, fs.readFileSync(f, "utf8")]);
      }
    for (const rel of SCAN_FILES) files.push([rel, fs.readFileSync(path.join(ROOT, rel), "utf8")]);
    const hits = scanPalette(files);
    if (files.length < 20) hits.push(`only ${files.length} files scanned (floor 20)`);
    return { errors: hits, info: { filesScanned: files.length } };
  },
  async controls() {
    return [
      { name: "violet hex fixture", errors: scanPalette([["fixture.css", ".a{color:#6d28d9}"]]) },
      {
        name: "indigo rgb fixture",
        errors: scanPalette([["fixture.css", ".a{background:rgb(79,70,229)}"]]),
      },
      {
        name: "purple hsl fixture",
        errors: scanPalette([
          [
            "fixture.svg",
            'fill="hsl(270 50% 40%)"'.replace("hsl(270 50% 40%)", "hsl(270, 50%, 40%)"),
          ],
        ]),
      },
    ];
  },
};
