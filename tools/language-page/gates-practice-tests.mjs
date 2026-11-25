// G-92 practice-test-balance-and-disclaimer (B6 Honest Practice ACCESS Tests):
// Verifies every practice test form (access-practice-lab/content/tests/*.json and shared/access-lab2/
// generated forms) for non-empty sections, domain coverage, and balanced multiple-choice answer-key
// distributions, and verifies that result screens and generated reports carry the honest practice-estimate
// disclaimer ("Practice estimate, not an official score" / Spanish equivalent + WIDA disclaimer).
import fs from "node:fs";
import path from "node:path";
import { buildPracticeTest, scorePracticeTest } from "../../shared/access-lab2/builder.js";
import { DEMO_ITEMS } from "../../shared/access-lab2/demo-items.js";
import {
  DISCLAIMER,
  DISCLAIMER_ES,
  disclaimerOk,
  findMissingDisclaimers,
  hasDisclaimer,
} from "../../shared/access-lab2/disclaimer.js";
import { bestAnswer, reviewedDemo } from "../access-lab2-helpers.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const TESTS_DIR = path.join(ROOT, "access-practice-lab", "content", "tests");
const TEST_REPORT_FILE = path.join(ROOT, "access-practice-lab", "src", "views", "test-report.js");
const TEST_VIEW_FILE = path.join(ROOT, "access-practice-lab", "src", "views", "test.js");

const VALID_DOMAINS = new Set(["Listening", "Reading", "Speaking", "Writing"]);
const MIN_MC_FOR_BALANCE = 6;
const MAX_KEY_SHARE = 0.5;
const ESTIMATE_PHRASE_EN = "practice estimate, not an official score";
const ESTIMATE_PHRASE_ES = "estimación de práctica, no es una puntuación oficial";

/** Load all authored practice test JSON forms under access-practice-lab/content/tests/. */
export function loadPracticeTestForms() {
  const files = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((file) => ({
    file,
    form: JSON.parse(fs.readFileSync(path.join(TESTS_DIR, file), "utf8")),
  }));
}

/** Build representative shared/access-lab2 generated forms and scored results. */
export function buildLab2Artifacts() {
  const reviewed = reviewedDemo();
  const byId = new Map(reviewed.map((it) => [it.id, it]));
  const forms = [];
  const reports = [];
  for (const length of ["mini", "standard"]) {
    const test = buildPracticeTest({
      items: reviewed,
      gradeBand: "3-5",
      length,
      seed: "g92-balance",
      viewer: "student",
    });
    const answers = Object.fromEntries(test.itemIds.map((id) => [id, bestAnswer(byId.get(id))]));
    const results = scorePracticeTest({ test, items: reviewed, answers, alias: "Star 1" });
    forms.push({
      id: `access-lab2:${test.id}`,
      sections: test.sections.map((s) => ({
        domain: s.domain,
        items: s.itemIds.map((id) => {
          const it = byId.get(id);
          if (it?.response?.mode === "select") {
            return {
              id: it.id,
              type: "multipleChoice",
              options: it.response.constraints?.options || [],
              answer: it.scoring?.key,
            };
          }
          return { id: it?.id || id, type: it?.response?.mode || "other" };
        }),
      })),
      expectAllDomains: true,
    });
    reports.push({ name: `access-lab2:${length}:test`, doc: test });
    reports.push({ name: `access-lab2:${length}:results`, doc: results });
  }
  return { forms, reports, demoItemCount: DEMO_ITEMS.length };
}

/**
 * Pure evaluation of practice test forms, result screen sources, and access-lab2 reports.
 * Used by both `run()` and negative `controls()`.
 */
export function evaluatePracticeTests({
  forms,
  resultScreens,
  disclaimerEn,
  disclaimerEs,
  lab2Reports,
}) {
  const errors = [];
  let formsChecked = 0;
  let balancedFormsChecked = 0;
  let mcItemsTotal = 0;

  if (!forms.length) errors.push("no practice test forms found");

  for (const entry of forms) {
    formsChecked += 1;
    const label = entry.id || entry.file || "unknown-form";
    const sections = Array.isArray(entry.sections) ? entry.sections : [];
    if (sections.length === 0) {
      errors.push(`${label}: has no sections`);
      continue;
    }

    const seenDomains = new Set();
    const keyCounts = new Map();
    let mcCount = 0;

    for (let si = 0; si < sections.length; si += 1) {
      const sec = sections[si];
      if (!VALID_DOMAINS.has(sec.domain)) {
        errors.push(`${label}: section[${si}] has invalid domain "${sec.domain}"`);
      } else {
        seenDomains.add(sec.domain);
      }
      const items = Array.isArray(sec.items) ? sec.items : [];
      if (items.length === 0) {
        errors.push(`${label}: section[${si}] (${sec.domain}) has no items`);
        continue;
      }
      for (const item of items) {
        if (item.type !== "multipleChoice") continue;
        const options = Array.isArray(item.options) ? item.options : [];
        const idx =
          typeof item.answer === "number"
            ? item.answer
            : options.findIndex((o) => o?.id === item.answer);
        if (idx < 0 || idx >= options.length) {
          errors.push(
            `${label}: MC item "${item.id}" answer "${item.answer}" not found in options`,
          );
          continue;
        }
        mcCount += 1;
        mcItemsTotal += 1;
        keyCounts.set(idx, (keyCounts.get(idx) || 0) + 1);
      }
    }

    if (entry.expectAllDomains) {
      for (const d of VALID_DOMAINS) {
        if (!seenDomains.has(d)) errors.push(`${label}: full form missing domain "${d}"`);
      }
    }

    if (mcCount >= MIN_MC_FOR_BALANCE) {
      balancedFormsChecked += 1;
      const counts = [...keyCounts.values()];
      const maxCount = Math.max(...counts);
      const share = maxCount / mcCount;
      if (keyCounts.size < 2) {
        errors.push(
          `${label}: MC answer keys use only ${keyCounts.size} distinct option index across ${mcCount} items`,
        );
      }
      if (share > MAX_KEY_SHARE) {
        errors.push(
          `${label}: MC answer-key imbalance (${maxCount}/${mcCount} = ${Math.round(share * 100)}% on one option index, max 50%)`,
        );
      }
    }
  }

  for (const screen of resultScreens) {
    const lower = String(screen.text || "").toLowerCase();
    if (!lower.includes(ESTIMATE_PHRASE_EN)) {
      errors.push(`${screen.name}: missing "${ESTIMATE_PHRASE_EN}" disclaimer`);
    }
    if (!lower.includes(ESTIMATE_PHRASE_ES)) {
      errors.push(`${screen.name}: missing Spanish "${ESTIMATE_PHRASE_ES}" disclaimer`);
    }
  }

  if (!disclaimerOk(disclaimerEn)) {
    errors.push("shared/access-lab2/disclaimer.js: DISCLAIMER fails disclaimerOk()");
  }
  if (
    !String(disclaimerEn || "")
      .toLowerCase()
      .includes(ESTIMATE_PHRASE_EN)
  ) {
    errors.push(`shared/access-lab2/disclaimer.js: DISCLAIMER missing "${ESTIMATE_PHRASE_EN}"`);
  }
  if (
    !String(disclaimerEs || "")
      .toLowerCase()
      .includes(ESTIMATE_PHRASE_ES)
  ) {
    errors.push(`shared/access-lab2/disclaimer.js: DISCLAIMER_ES missing "${ESTIMATE_PHRASE_ES}"`);
  }

  for (const rep of lab2Reports) {
    if (!hasDisclaimer(rep.doc)) {
      errors.push(`${rep.name}: missing top-level disclaimer`);
    }
    const missing = findMissingDisclaimers(rep.doc);
    if (missing.length > 0) {
      errors.push(`${rep.name}: nested outputs missing disclaimer at ${missing.join(", ")}`);
    }
  }

  return {
    errors,
    info: {
      formsChecked,
      balancedFormsChecked,
      mcItemsTotal,
      resultScreensChecked: resultScreens.length,
      lab2ReportsChecked: lab2Reports.length,
    },
  };
}

function loadInputs() {
  const jsonForms = loadPracticeTestForms().map(({ file, form }) => ({
    id: form.id || file,
    file,
    sections: form.sections || [],
    expectAllDomains: form.kind === "full",
  }));
  const lab2 = buildLab2Artifacts();
  return {
    forms: [...jsonForms, ...lab2.forms],
    resultScreens: [
      {
        name: "access-practice-lab/src/views/test-report.js",
        text: fs.readFileSync(TEST_REPORT_FILE, "utf8"),
      },
      {
        name: "access-practice-lab/src/views/test.js",
        text: fs.readFileSync(TEST_VIEW_FILE, "utf8"),
      },
    ],
    disclaimerEn: DISCLAIMER,
    disclaimerEs: DISCLAIMER_ES,
    lab2Reports: lab2.reports,
  };
}

export const gatePracticeTests = {
  id: "G-92",
  name: "practice-test-balance-and-disclaimer",
  run() {
    return evaluatePracticeTests(loadInputs());
  },
  controls() {
    const base = loadInputs();

    // Negative control 1: missing disclaimer on result screen (and stripped lab2 report disclaimer).
    const noDisclaimerInputs = {
      ...base,
      resultScreens: base.resultScreens.map((s) => ({
        ...s,
        text: s.text
          .replace(/practice estimate, not an official score/gi, "")
          .replace(/estimación de práctica, no es una puntuación oficial/gi, ""),
      })),
      lab2Reports: base.lab2Reports.map((r, idx) => {
        if (idx !== 0) return r;
        const stripped = JSON.parse(JSON.stringify(r.doc));
        delete stripped.disclaimer;
        return { ...r, doc: stripped };
      }),
    };

    // Negative control 2: biased answer key (all MC items in a >=6-item form set to option 0).
    const biasedForms = base.forms.map((f, idx) => {
      if (idx !== 0) return f;
      const cloned = JSON.parse(JSON.stringify(f));
      for (const sec of cloned.sections) {
        for (const item of sec.items) {
          if (item.type === "multipleChoice" && Array.isArray(item.options) && item.options[0]) {
            item.answer = item.options[0].id;
          }
        }
      }
      return cloned;
    });

    return [
      {
        name: "missing disclaimer on result screen",
        errors: evaluatePracticeTests(noDisclaimerInputs).errors,
      },
      {
        name: "biased answer key (all MC items set to option 0)",
        errors: evaluatePracticeTests({ ...base, forms: biasedForms }).errors,
      },
    ];
  },
};
