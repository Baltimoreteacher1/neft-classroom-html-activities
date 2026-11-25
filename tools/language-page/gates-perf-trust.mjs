// G-97 performance-budgets, G-99 trust-efficacy-aggregate-d14.
import fs from "node:fs";
import path from "node:path";
import * as apiUnit from "../../functions/api/bcpss/units/[unitId].js";
import { MIN_CELL_SIZE, summarizeAggregate } from "../../shared/bcpss/aggregate-privacy.js";
import { scanPalette } from "./gates-misc.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// ── G-97 performance-budgets ──────────────────────────────────────────────────
export const UNIT_MAX_BYTES = 250 * 1024;
export const MIN_FIELDS_REDUCTION = 0.7;
export const REP_UNITS = ["gk-ela-u1", "g4-sci-u1", "g6-math-u1", "g8-ela-u1"];
export const TEST_FIELDS = ["unit.id", "unit.unit_title", "unit.grade", "unit.subject"];
export const ASSET_BUDGETS = [
  { path: "bcpss-teachers/bcpss-teachers.js", maxBytes: 120 * 1024 },
  { path: "bcpss-teachers/bcpss-teachers.css", maxBytes: 130 * 1024 },
  { path: "bcpss-teachers/index.html", maxBytes: 45 * 1024 },
];

async function invokeUnitApi(unitId, { query = "", headers = {} } = {}) {
  const url = `https://example.test/api/bcpss/units/${unitId}${query ? `?${query}` : ""}`;
  return apiUnit.onRequest({
    request: new Request(url, { headers }),
    env: {},
    params: { unitId },
  });
}

export async function checkUnitPerf(unitId, callUnit = invokeUnitApi) {
  const errors = [];

  // 1. Full response: 200, ETag present, <= 250 KB
  const fullRes = await callUnit(unitId);
  if (fullRes.status !== 200) {
    errors.push(`${unitId}: full request returned ${fullRes.status} (expected 200)`);
    return { errors, fullBytes: 0, filteredBytes: 0, reduction: 0 };
  }
  const etag = fullRes.headers.get("ETag");
  if (!etag) errors.push(`${unitId}: full response missing ETag header`);
  const fullText = await fullRes.text();
  const fullBytes = Buffer.byteLength(fullText, "utf8");
  if (fullBytes > UNIT_MAX_BYTES) {
    errors.push(`${unitId}: full payload ${fullBytes} bytes exceeds ${UNIT_MAX_BYTES} byte budget`);
  }

  // 2. Conditional GET with If-None-Match -> 304 Not Modified
  const res304 = await callUnit(unitId, { headers: { "If-None-Match": etag || 'W/"missing"' } });
  if (res304.status !== 304) {
    errors.push(`${unitId}: If-None-Match returned ${res304.status} (expected 304)`);
  }

  // 3. ?fields= selection: 200, exact fields only, >= 70% byte reduction
  const fieldsRes = await callUnit(unitId, { query: `fields=${TEST_FIELDS.join(",")}` });
  let filteredBytes = 0;
  let reduction = 0;
  if (fieldsRes.status !== 200) {
    errors.push(`${unitId}: ?fields= returned ${fieldsRes.status} (expected 200)`);
  } else {
    const filteredText = await fieldsRes.text();
    filteredBytes = Buffer.byteLength(filteredText, "utf8");
    reduction = fullBytes > 0 ? 1 - filteredBytes / fullBytes : 0;
    if (reduction < MIN_FIELDS_REDUCTION) {
      errors.push(
        `${unitId}: ?fields= reduction ${(reduction * 100).toFixed(1)}% is below ${MIN_FIELDS_REDUCTION * 100}% minimum`,
      );
    }
    try {
      const parsed = JSON.parse(filteredText);
      const topKeys = Object.keys(parsed).sort();
      if (topKeys.length !== 1 || topKeys[0] !== "unit") {
        errors.push(`${unitId}: ?fields= top-level keys [${topKeys.join(",")}] != [unit]`);
      } else {
        const expectedUnitKeys = ["grade", "id", "subject", "unit_title"];
        const actualUnitKeys = Object.keys(parsed.unit || {}).sort();
        if (JSON.stringify(actualUnitKeys) !== JSON.stringify(expectedUnitKeys)) {
          errors.push(
            `${unitId}: ?fields= unit keys [${actualUnitKeys.join(",")}] != [${expectedUnitKeys.join(",")}]`,
          );
        }
      }
    } catch {
      errors.push(`${unitId}: ?fields= response is not valid JSON`);
    }
  }

  // 4. Invalid ?fields=nonexistent_field -> 400
  const badRes = await callUnit(unitId, { query: "fields=nonexistent_field" });
  if (badRes.status !== 400) {
    errors.push(`${unitId}: invalid ?fields= returned ${badRes.status} (expected 400)`);
  }

  return { errors, fullBytes, filteredBytes, reduction };
}

export function checkAssetBudgets(budgets = ASSET_BUDGETS) {
  const errors = [];
  const sizes = {};
  for (const { path: rel, maxBytes } of budgets) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      errors.push(`missing budgeted asset: ${rel}`);
      continue;
    }
    const size = fs.statSync(abs).size;
    sizes[rel] = size;
    if (size > maxBytes) {
      errors.push(`${rel}: ${size} bytes exceeds ${maxBytes} byte budget`);
    }
  }
  return { errors, sizes };
}

export const g97 = {
  id: "G-97",
  name: "performance-budgets",
  async run() {
    const errors = [];
    let maxUnitBytes = 0;
    let minReduction = 1;

    for (const unitId of REP_UNITS) {
      const res = await checkUnitPerf(unitId);
      errors.push(...res.errors);
      if (res.fullBytes > maxUnitBytes) maxUnitBytes = res.fullBytes;
      if (res.reduction < minReduction) minReduction = res.reduction;
    }

    const assets = checkAssetBudgets();
    errors.push(...assets.errors);

    return {
      errors,
      info: {
        unitsChecked: REP_UNITS.length,
        maxUnitBytes,
        minFieldsReductionPct: Number((minReduction * 100).toFixed(1)),
        assets: assets.sizes,
      },
    };
  },
  async controls() {
    // Control A: simulated oversized payload (300 KB) + 0% fields reduction
    const oversizedBody = JSON.stringify({
      unit: { id: "gk-ela-u1", unit_title: "T", grade: "K", subject: "ELA" },
      blob: "x".repeat(300 * 1024),
    });
    const oversizedCaller = async (_unitId, { query = "", headers = {} } = {}) => {
      if (query === "fields=nonexistent_field") return new Response("bad", { status: 400 });
      if (headers["If-None-Match"]) return new Response(null, { status: 304 });
      return new Response(oversizedBody, {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: 'W/"big"' },
      });
    };
    const ctrlOversized = await checkUnitPerf("gk-ela-u1", oversizedCaller);

    // Control B: missing ETag and 200 instead of 304 on matching If-None-Match
    const noCacheCaller = async (unitId, { query = "" } = {}) => {
      const res = await invokeUnitApi(unitId, { query });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    };
    const ctrlNoCache = await checkUnitPerf("gk-ela-u1", noCacheCaller);

    return [
      {
        name: "oversized 300 KB payload & 0% ?fields= reduction",
        errors: ctrlOversized.errors,
      },
      {
        name: "missing ETag and 200 instead of 304 on If-None-Match",
        errors: ctrlNoCache.errors,
      },
    ];
  },
};

// ── G-99 trust-efficacy-aggregate-d14 ─────────────────────────────────────────
const EXTERNAL_RESOURCE_PATTERNS = [
  { label: "external script/link/img URL", re: /\b(?:src|href)\s*=\s*["']https?:\/\//i },
  { label: "external CSS import/url", re: /(?:@import|url\()\s*["']?https?:\/\//i },
  {
    label: "CDN host reference",
    re: /(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.|unpkg\.com|jsdelivr\.net)/i,
  },
  { label: "network fetch call", re: /\bfetch\s*\(/i },
];

const BANNED_DEMO_PII = [
  { label: "IEP/SPED/504 label", re: /\b(?:IEP|SPED|504)\b/i },
  { label: "SSN/DOB/student_id token", re: /\b(?:SSN|DOB|student_id)\b/i },
  { label: "proficiency level code", re: /\b(?:WIDA\s+Level|ELP\s+Level)\b/i },
  { label: "email address", re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { label: "phone number", re: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/ },
];

function checkStaticHygiene(html, file) {
  const errors = [];
  errors.push(...scanPalette([[file, html]]));
  for (const { label, re } of EXTERNAL_RESOURCE_PATTERNS) {
    if (re.test(html)) errors.push(`${file}: contains ${label}`);
  }
  return errors;
}

export function checkTrustPage(html, file = "bcpss-teachers/trust/index.html") {
  const errors = [...checkStaticHygiene(html, file)];
  if (!html.includes("Draft: pending legal review")) {
    errors.push(`${file}: missing "Draft: pending legal review" notice`);
  }
  if (!/\bD8\b/.test(html) || !/student writing/i.test(html) || !/audio/i.test(html)) {
    errors.push(`${file}: missing D8 lock notice for student writing/audio`);
  }
  if (!/alias-only/i.test(html)) {
    errors.push(`${file}: missing alias-only student privacy commitment`);
  }
  if (!/\bD14\b/.test(html) || !/minimum cell size/i.test(html)) {
    errors.push(`${file}: missing D14 minimum cell size 10 commitment`);
  }
  if (!/inspired by WIDA/i.test(html)) {
    errors.push(`${file}: missing "inspired by WIDA" disclaimer`);
  }
  return errors;
}

export function checkEfficacyPage(html, file = "bcpss-teachers/efficacy/index.html") {
  const errors = [...checkStaticHygiene(html, file)];
  if (!/no outcome claims/i.test(html)) {
    errors.push(`${file}: missing "No outcome claims" notice`);
  }
  if (!html.includes("Draft: pending review")) {
    errors.push(`${file}: missing "Draft: pending review" notice`);
  }
  return errors;
}

export function checkDemoPage(html, file = "bcpss-teachers/demo/index.html") {
  const errors = [...checkStaticHygiene(html, file)];
  if (!html.includes("DEMO MODE")) {
    errors.push(`${file}: missing "DEMO MODE" badge`);
  }
  if (!html.includes("Synthetic")) {
    errors.push(`${file}: missing "Synthetic" data marker`);
  }
  for (const { label, re } of BANNED_DEMO_PII) {
    if (re.test(html)) errors.push(`${file}: contains banned PII token (${label})`);
  }
  return errors;
}

export function checkAggregatePrivacy(summarizeFn = summarizeAggregate) {
  const errors = [];
  if (MIN_CELL_SIZE !== 10) {
    errors.push(`MIN_CELL_SIZE is ${MIN_CELL_SIZE} (expected 10)`);
  }

  const rows = [];
  const pushRows = (group, n) => {
    for (let i = 0; i < n; i += 1) {
      rows.push({ group, alias: `SecretAlias_${group}_${i}` });
    }
  };
  pushRows("band_1", 1);
  pushRows("band_5", 5);
  pushRows("band_9", 9);
  pushRows("band_10", 10);
  pushRows("band_15", 15);

  const result = summarizeFn(rows, "group");
  const byKey = new Map((result?.cells || []).map((c) => [c.key, c]));

  for (const [key, expected] of [
    ["band_1", 1],
    ["band_5", 5],
    ["band_9", 9],
  ]) {
    const cell = byKey.get(key);
    if (!cell) {
      errors.push(`aggregate missing cell "${key}"`);
      continue;
    }
    if (cell.suppressed !== true || cell.count !== null) {
      errors.push(
        `cell "${key}" (raw ${expected}) was NOT suppressed (suppressed=${cell.suppressed}, count=${cell.count})`,
      );
    }
    if (cell.display !== "<10 (suppressed)") {
      errors.push(`cell "${key}" display "${cell.display}" != "<10 (suppressed)"`);
    }
  }

  for (const [key, expected] of [
    ["band_10", 10],
    ["band_15", 15],
  ]) {
    const cell = byKey.get(key);
    if (!cell) {
      errors.push(`aggregate missing cell "${key}"`);
      continue;
    }
    if (cell.suppressed !== false || cell.count !== expected) {
      errors.push(
        `cell "${key}" (raw ${expected}) should be allowed (suppressed=${cell.suppressed}, count=${cell.count})`,
      );
    }
  }

  if (JSON.stringify(result).includes("SecretAlias_")) {
    errors.push("aggregate output leaked student/alias row data");
  }

  return errors;
}

export const g99 = {
  id: "G-99",
  name: "trust-efficacy-aggregate-d14",
  async run() {
    const errors = [
      ...checkTrustPage(read("bcpss-teachers/trust/index.html")),
      ...checkEfficacyPage(read("bcpss-teachers/efficacy/index.html")),
      ...checkDemoPage(read("bcpss-teachers/demo/index.html")),
      ...checkAggregatePrivacy(summarizeAggregate),
    ];
    return {
      errors,
      info: {
        minCellSize: MIN_CELL_SIZE,
        pagesChecked: 3,
      },
    };
  },
  async controls() {
    const leakySummarize = (rows, groupKey) => {
      const base = summarizeAggregate(rows, groupKey);
      return {
        ...base,
        cells: base.cells.map((c) =>
          c.key === "band_9" ? { ...c, suppressed: false, count: 9, display: "9" } : c,
        ),
      };
    };

    const trustWithoutDraft = read("bcpss-teachers/trust/index.html").replaceAll(
      "Draft: pending legal review",
      "Approved final policy",
    );

    const demoWithPii = `${read("bcpss-teachers/demo/index.html")}\n<!-- IEP record -->`;

    return [
      {
        name: "unsuppressed cell with count 9",
        errors: checkAggregatePrivacy(leakySummarize),
      },
      {
        name: 'trust page missing "Draft: pending legal review"',
        errors: checkTrustPage(trustWithoutDraft),
      },
      {
        name: "demo page containing banned PII token",
        errors: checkDemoPage(demoWithPii),
      },
    ];
  },
};
