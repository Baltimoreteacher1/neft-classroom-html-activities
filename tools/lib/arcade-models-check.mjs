// Pure checks behind tools/validate-arcade-models.mjs and tools/arcade-models.test.mjs.
// Everything here takes data in and returns findings out, so a test can feed it a known-bad
// fixture and prove the detector still fires.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const read = (root, rel) => readFileSync(new URL(rel, root), "utf8");

/** Whole-word, case-insensitive test; keywords may be multi-word or contain symbols ("y ="). */
export const mentions = (text, word) => {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(text);
};

/**
 * Distinctive keywords: those that belong to exactly one model family. A game's coach text
 * may not use another family's distinctive keyword unless the game lists that word itself.
 * (Observed leak: the median tip under Equation Escape.)
 */
export function foreignKeywordFindings(games, coachById) {
  const families = new Map();
  for (const g of games)
    for (const k of g.topicKeywords) {
      if (!families.has(k)) families.set(k, new Set());
      families.get(k).add(g.model);
    }
  const findings = [];
  for (const g of games) {
    const coach = coachById.get(g.id);
    if (!coach) continue;
    if (!g.topicKeywords.some((k) => mentions(coach, k)))
      findings.push({
        id: g.id,
        rule: "COACH_OFF_TOPIC",
        detail: "coach text names none of the game's own topic keywords",
      });
    for (const [k, fam] of families) {
      if (fam.has(g.model) || g.topicKeywords.includes(k)) continue;
      if (mentions(coach, k))
        findings.push({
          id: g.id,
          rule: "COACH_FOREIGN_TOPIC",
          detail: `coach text uses "${k}", a ${[...fam].join("/")} keyword`,
        });
    }
  }
  return findings;
}

/** The hub card for each game: link present, kicker equals the registry kind, listed under its unit. */
export function hubCardFindings(games, hubHtml) {
  const doc = new JSDOM(hubHtml).window.document;
  const cards = new Map();
  for (const a of doc.querySelectorAll("a.card")) {
    const sect = a.closest("section,details")?.id || "";
    cards.set(a.getAttribute("href"), {
      kicker: a.querySelector(".card-kicker")?.textContent.trim().toLowerCase() || "",
      unit: Number(sect.replace(/\D+/g, "")) || null,
    });
  }
  const findings = [];
  for (const g of games) {
    const card = cards.get(g.route);
    if (!card) {
      findings.push({ id: g.id, rule: "HUB_CARD_MISSING", detail: g.route });
      continue;
    }
    const want = `${g.kind} game`;
    if (card.kicker !== want)
      findings.push({
        id: g.id,
        rule: "HUB_KIND_MISMATCH",
        detail: `hub says "${card.kicker}", registry says "${want}"`,
      });
    if (card.unit !== g.unit)
      findings.push({
        id: g.id,
        rule: "HUB_UNIT_MISMATCH",
        detail: `hub lists it under unit ${card.unit}, registry says ${g.unit}`,
      });
  }
  return findings;
}

/** Flagship configs must declare the registry's model kind. */
export function flagshipModelFindings(games, studioSrc) {
  const findings = [];
  for (const g of games.filter((x) => x.flagshipSlug)) {
    const start = studioSrc.indexOf(`"${g.flagshipSlug}": {`);
    if (start < 0) {
      findings.push({ id: g.id, rule: "FLAGSHIP_CONFIG_MISSING", detail: g.flagshipSlug });
      continue;
    }
    const m = studioSrc.slice(start, start + 400).match(/model: "([a-z-]+)"/);
    if (!m) findings.push({ id: g.id, rule: "FLAGSHIP_MODEL_UNDECLARED", detail: g.flagshipSlug });
    else if (m[1] !== g.model)
      findings.push({
        id: g.id,
        rule: "FLAGSHIP_MODEL_MISMATCH",
        detail: `config ${m[1]} vs registry ${g.model}`,
      });
  }
  return findings;
}

/** The shared scaffold may not fall back to a ratio picture for a miss it cannot classify. */
export function scaffoldFallbackFindings(studioJs) {
  const i = studioJs.indexOf("const patternKind");
  const block = i < 0 ? "" : studioJs.slice(i, i + 700);
  return /:\s*"ratios";/.test(block) && !/unscaled-ratio/.test(block)
    ? [
        {
          id: "game-studio",
          rule: "SCAFFOLD_DEFAULTS_TO_RATIOS",
          detail: "pattern fallback draws a ratio model",
        },
      ]
    : [];
}

/** Loads the shipped game-studio.js in jsdom and returns its renderer. */
export function loadRenderer(root) {
  const dom = new JSDOM("<!doctype html><body></body>", {
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  // jsdom has no matchMedia or speech synthesis; the shipped script only needs them to exist.
  dom.window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  dom.window.eval(read(root, "assets/game-studio.js"));
  const gs = dom.window.GameStudio;
  if (!gs?.renderMathModelSVG) throw new Error("GameStudio.renderMathModelSVG is not exposed");
  return gs.renderMathModelSVG;
}

/** A sample state per kind, proving each renderer draws from its own parameters. */
export const SAMPLES = {
  balance: { v: "x", xs: 1, units: 6, unitsSign: "+", right: 11, left: "x + 6", rightLabel: "11" },
  "data-display": { values: [12, 18, 15, 21, 14] },
  "percent-grid": { pct: 35 },
  "area-shapes": { type: "triangle", b: 10, h: 6 },
  "volume-cubes": { l: 3, w: 2, h: 4 },
  "rule-table": {
    rows: [
      ["1", "5"],
      ["2", "10"],
      ["3", "15"],
    ],
  },
  "variable-roles": {},
  progress: { done: 3, total: 12 },
};
