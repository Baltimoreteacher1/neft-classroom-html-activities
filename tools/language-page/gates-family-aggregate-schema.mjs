// G-102 family-language-pluggable-d2, G-103 aggregate-ui-and-schemas-f3.
import fs from "node:fs";
import path from "node:path";
import { MIN_CELL_SIZE, summarizeAggregate } from "../../shared/bcpss/aggregate-privacy.js";
import { API_SCHEMAS, validatePayload } from "../../shared/bcpss/api-schemas.js";
import {
  REQUIRED_FAMILY_KEYS,
  registerLocalePack,
  resolveFamilyStrings,
  validateLanguagePack,
} from "../../shared/bcpss/family-language-pack.js";
import { scanPalette } from "./gates-misc.mjs";
import { scanSourceForExternalEgress } from "./gates-offline-egress.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

// ── G-102 family-language-pluggable-d2 ────────────────────────────────────────

export function checkFamilyLocales(enPack, esPack, templatePack) {
  const errors = [];

  for (const [name, pack] of [
    ["en.json", enPack],
    ["es.json", esPack],
    ["template.json", templatePack],
  ]) {
    if (!pack || typeof pack !== "object") {
      errors.push(`${name}: missing or invalid JSON object`);
      continue;
    }
    if (pack.provenance?.status !== "draft") {
      errors.push(`${name}: provenance.status must be "draft" (got "${pack.provenance?.status}")`);
    }
    if (pack.provenance?.reviewedBy !== null) {
      errors.push(`${name}: draft pack must have reviewedBy: null`);
    }
  }

  for (const [name, pack] of [
    ["en.json", enPack],
    ["es.json", esPack],
  ]) {
    const check = validateLanguagePack(pack);
    if (!check.ok) {
      errors.push(`${name}: validateLanguagePack failed (${check.errors.join("; ")})`);
    }
  }

  // Prove a synthetic 3rd locale (ar, rtl: true) plugs in with zero code changes.
  const syntheticAr = {
    locale: "ar",
    label: "العربية (Arabic)",
    rtl: true,
    provenance: {
      status: "draft",
      source: "synthetic_g102_probe",
      reviewedBy: null,
    },
    strings: {
      heading: "دليل اللغة للعائلة",
      weeklyPlanTitle: "ما نتعلمه هذا الأسبوع",
      tryAtHome: "جرّب هذا في المنزل",
      askYourChild: "اسأل طفلك",
      readAloudNote: "القراءة والتحدث بأي لغة منزلية يدعمان التعلم.",
      privacyNote: "لا يتم تخزين أو مشاركة أي بيانات طلابية هنا.",
      draftNotice: "مسودة: دليل دعم عائلي غير رسمي.",
    },
  };

  let registry = {};
  try {
    registry = registerLocalePack(registry, enPack);
    registry = registerLocalePack(registry, esPack);
    registry = registerLocalePack(registry, syntheticAr);
  } catch (err) {
    errors.push(`registerLocalePack failed: ${err.message}`);
  }

  if (!registry.ar) {
    errors.push('registerLocalePack did not register synthetic "ar" locale');
  }

  // Also test partial locale fallback to EN while preserving rtl & draft provenance.
  const partialAr = {
    locale: "ar",
    label: "العربية (Arabic)",
    rtl: true,
    provenance: { status: "draft", source: "partial_probe", reviewedBy: null },
    strings: { heading: "دليل اللغة للعائلة" },
  };
  const resolved = resolveFamilyStrings(partialAr, enPack);
  if (resolved.rtl !== true || resolved.dir !== "rtl") {
    errors.push("resolveFamilyStrings did not preserve rtl: true");
  }
  if (resolved.provenance.status !== "draft") {
    errors.push("resolveFamilyStrings did not preserve draft provenance");
  }
  for (const key of REQUIRED_FAMILY_KEYS) {
    if (!resolved.strings[key]) {
      errors.push(`resolveFamilyStrings missing fallback value for key "${key}"`);
    }
  }
  if (resolved.strings.heading !== "دليل اللغة للعائلة") {
    errors.push("resolveFamilyStrings overwrote provided target string");
  }
  if (resolved.strings.privacyNote !== enPack.strings.privacyNote) {
    errors.push("resolveFamilyStrings did not fall back to EN for missing privacyNote");
  }

  return errors;
}

export const g102 = {
  id: "G-102",
  name: "family-language-pluggable-d2",
  async run() {
    const enPack = readJson("data/bcpss/family-locales/en.json");
    const esPack = readJson("data/bcpss/family-locales/es.json");
    const templatePack = readJson("data/bcpss/family-locales/template.json");
    const errors = checkFamilyLocales(enPack, esPack, templatePack);
    return {
      errors,
      info: {
        locales: [enPack.locale, esPack.locale, templatePack.locale],
        requiredKeys: REQUIRED_FAMILY_KEYS.length,
        pluggableRtlProbe: "ar",
      },
    };
  },
  async controls() {
    const enPack = readJson("data/bcpss/family-locales/en.json");

    // Control A: pack missing required keys -> MUST fail
    const missingKeysPack = {
      ...enPack,
      locale: "fr",
      strings: { heading: "Guide Familial" },
    };
    const ctrlMissing = validateLanguagePack(missingKeysPack);

    // Control B: pack claiming status: "reviewed" with no reviewer -> MUST fail
    const unreviewedClaimPack = {
      ...enPack,
      locale: "fr",
      provenance: { status: "reviewed", source: "unverified", reviewedBy: null },
    };
    const ctrlUnreviewed = validateLanguagePack(unreviewedClaimPack);

    return [
      {
        name: "pack missing required keys",
        errors: ctrlMissing.errors,
      },
      {
        name: 'pack claiming status "reviewed" with no reviewer',
        errors: ctrlUnreviewed.errors,
      },
    ];
  },
};

// ── G-103 aggregate-ui-and-schemas-f3 ─────────────────────────────────────────

const REQUIRED_ROUTES = [
  "/api/bcpss/units",
  "/api/bcpss/units/:unitId",
  "/api/bcpss/units/:unitId/lessons",
  "/api/bcpss/family-guide/:unitId",
  "/api/bcpss/week-plan",
  "/api/bcpss/packet",
  "/api/bcpss/pathways",
  "/api/bcpss/insights",
  "/api/bcpss/telemetry",
  "/api/bcpss/plans",
  "/api/bcpss/plans/:id",
  "/api/class/create",
  "/api/class/join",
  "/api/class/astatus/act",
  "/api/class/astatus/board",
  "/api/class/info",
];

const FORBIDDEN_AGGREGATE_PATTERNS = [
  { label: "student_id row field", re: /\bstudent_id\b/i },
  { label: "student alias column", re: /\bstudent\s+alias\b|<th[^>]*>\s*alias\s*<\/th>/i },
  { label: "network fetch call", re: /\bfetch\s*\(/i },
  {
    label: "unsuppressed <10 raw count marker",
    re: /data-unsuppressed-count\s*=\s*["'][1-9]["']/i,
  },
];

export function checkAggregateDashboard(html, file = "bcpss-teachers/aggregate/index.html") {
  const errors = [];
  errors.push(...scanPalette([[file, html]]));
  errors.push(...scanSourceForExternalEgress(file, html));

  if (!html.includes("aggregate-privacy.js") || !html.includes("summarizeAggregate")) {
    errors.push(`${file}: must import summarizeAggregate from aggregate-privacy.js`);
  }
  if (!html.includes("Draft: aggregate view")) {
    errors.push(`${file}: missing "Draft: aggregate view" notice`);
  }
  if (!html.includes("district_aggregate_view")) {
    errors.push(`${file}: missing district_aggregate_view flag note`);
  }
  if (!/no outcome claims/i.test(html)) {
    errors.push(`${file}: missing "No outcome claims" notice`);
  }
  if (!html.includes("overflow-x: auto")) {
    errors.push(`${file}: missing overflow-x: auto for 320px table safety`);
  }
  if (!html.includes("<10 (suppressed)") && !html.includes("&lt;10 (suppressed)")) {
    errors.push(`${file}: missing "<10 (suppressed)" D14 suppression disclosure`);
  }
  for (const { label, re } of FORBIDDEN_AGGREGATE_PATTERNS) {
    if (re.test(html)) {
      errors.push(`${file}: contains forbidden ${label}`);
    }
  }

  // Runtime check on aggregate-privacy MIN_CELL_SIZE = 10
  if (MIN_CELL_SIZE !== 10) {
    errors.push(`MIN_CELL_SIZE must be 10 (got ${MIN_CELL_SIZE})`);
  }
  const probe = summarizeAggregate(
    [
      ...Array.from({ length: 4 }, () => ({ group: "small" })),
      ...Array.from({ length: 12 }, () => ({ group: "large" })),
    ],
    "group",
  );
  const smallCell = probe.cells.find((c) => c.key === "small");
  if (!smallCell || !smallCell.suppressed || smallCell.count !== null) {
    errors.push("summarizeAggregate did not suppress cell with count 4");
  }

  return errors;
}

export function checkApiSchemas(sampleUnit) {
  const errors = [];

  for (const route of REQUIRED_ROUTES) {
    const def = API_SCHEMAS[route];
    if (!def) {
      errors.push(`API_SCHEMAS missing route "${route}"`);
      continue;
    }
    if (typeof def.validateRequest !== "function" || typeof def.validateResponse !== "function") {
      errors.push(`API_SCHEMAS["${route}"] missing validateRequest/validateResponse functions`);
    }
  }

  // Validate real unit payload from dataset
  if (sampleUnit) {
    const unitRes = validatePayload("/api/bcpss/units/:unitId:response", sampleUnit);
    if (!unitRes.ok) {
      errors.push(`real unit detail failed schema validation: ${unitRes.errors.join("; ")}`);
    }
  } else {
    errors.push("no sample unit available to validate /api/bcpss/units/:unitId");
  }

  // Validate valid telemetry request & response
  const telReq = validatePayload("/api/bcpss/telemetry:request", {
    unit_id: sampleUnit?.unit?.id || "g6-math-u1",
    wida_tier: "3_4",
    event_type: "scaffold_toggle",
    internal: false,
  });
  if (!telReq.ok) {
    errors.push(`valid telemetry request failed schema validation: ${telReq.errors.join("; ")}`);
  }

  const telRes = validatePayload("TelemetryResponse", { ok: true, grade: "6" });
  if (!telRes.ok) {
    errors.push(`valid telemetry response failed schema validation: ${telRes.errors.join("; ")}`);
  }

  return errors;
}

export const g103 = {
  id: "G-103",
  name: "aggregate-ui-and-schemas-f3",
  async run({ data }) {
    const html = read("bcpss-teachers/aggregate/index.html");
    const sampleUnit = data?.units?.[0] || null;
    const errors = [...checkAggregateDashboard(html), ...checkApiSchemas(sampleUnit)];
    return {
      errors,
      info: {
        routesCovered: Object.keys(API_SCHEMAS).length,
        minCellSize: MIN_CELL_SIZE,
        sampleUnitId: sampleUnit?.unit?.id || null,
      },
    };
  },
  async controls() {
    // Control A: invalid telemetry payload / missing required field -> MUST fail
    const badTelemetry = validatePayload("/api/bcpss/telemetry:request", {
      unit_id: "g6-math-u1",
      wida_tier: "9_9",
      unexpected_pii: "Student Name",
    });

    // Control B: aggregate page with unsuppressed <10 raw count and forbidden purple -> MUST fail
    const baseHtml = read("bcpss-teachers/aggregate/index.html");
    const badAggregate = checkAggregateDashboard(
      `${baseHtml}\n<style>.bad{color:#4A2580}</style><span data-unsuppressed-count="4">4</span>`,
    );

    return [
      {
        name: "invalid telemetry payload / missing required field",
        errors: badTelemetry.errors,
      },
      {
        name: "aggregate page with purple #4A2580 and unsuppressed <10 count",
        errors: badAggregate,
      },
    ];
  },
};
