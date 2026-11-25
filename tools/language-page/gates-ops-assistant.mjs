// G-104 overnight-qa-provenance-telemetry-f4-f6, G-105 teacher-assistant-and-support-g1-g2.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as apiTelemetry from "../../functions/api/bcpss/telemetry.js";
import {
  attachFieldProvenance,
  summarizeFieldProvenance,
} from "../../shared/bcpss/content-provenance.js";
import { buildSupportScaffold } from "../../shared/bcpss/support-scaffold.js";
import {
  buildTeacherDraft,
  TEACHER_DRAFT_FLAG_KEY,
  validateTeacherInput,
} from "../../shared/bcpss/teacher-draft-assistant.js";
import registry from "../../shared/flags/registry.js";
import { diffAgainstBaseline, resolveReportDir } from "../overnight-qa-language-page.mjs";
import { scanPalette } from "./gates-misc.mjs";
import { scanSourceForExternalEgress } from "./gates-offline-egress.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function postTelemetry(handlerFn, body, ip = "198.51.100.201") {
  return handlerFn({
    request: new Request("https://x.test/api/bcpss/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
      body: JSON.stringify(body),
    }),
    env: {},
    params: {},
    waitUntil() {},
  });
}

// ── G-104 helpers ─────────────────────────────────────────────────────────────
export function checkBaselineDiff(diffFn = diffAgainstBaseline) {
  const errors = [];
  const sampleBaseline = { version: 1, gates: { "G-01": "PASS", "G-02": "PASS" } };
  const sampleRows = [
    { id: "G-01", name: "sample-a", status: "FAIL", errors: 2 },
    { id: "G-02", name: "sample-b", status: "PASS", errors: 0 },
  ];
  const diff = diffFn(sampleRows, sampleBaseline);
  if (!Array.isArray(diff?.regressions) || diff.regressions.length !== 1) {
    errors.push(
      `diffAgainstBaseline did not detect PASS->FAIL regression (got ${diff?.regressions?.length ?? 0})`,
    );
  } else if (diff.regressions[0].id !== "G-01") {
    errors.push(
      `diffAgainstBaseline flagged wrong gate "${diff.regressions[0].id}" instead of G-01`,
    );
  }
  return errors;
}

export async function checkTelemetryV2(handlerFn = apiTelemetry.onRequest) {
  const errors = [];
  const base = {
    unit_id: "g6-math-u2",
    wida_tier: "3_4",
    event_type: "vocab_lookup",
    internal: true,
  };

  const validV2 = await postTelemetry(
    handlerFn,
    {
      ...base,
      grade: "6",
      subject: "Math",
      activity_type: "vocab",
      feature: "vocab_drawer",
    },
    "198.51.100.210",
  );
  if (validV2.status !== 202) {
    errors.push(`valid telemetry v2 payload returned ${validV2.status} (expected 202)`);
  }

  const badGrade = await postTelemetry(handlerFn, { ...base, grade: "99" }, "198.51.100.211");
  if (badGrade.status !== 400) {
    errors.push(`invalid grade "99" returned ${badGrade.status} (expected 400)`);
  }

  const piiField = await postTelemetry(
    handlerFn,
    { ...base, student_name: "Ada Lovelace" },
    "198.51.100.212",
  );
  if (piiField.status !== 400) {
    errors.push(`PII field "student_name" returned ${piiField.status} (expected 400)`);
  }

  const badFeature = await postTelemetry(
    handlerFn,
    { ...base, feature: "Bad Feature!" },
    "198.51.100.213",
  );
  if (badFeature.status !== 400) {
    errors.push(`invalid feature slug returned ${badFeature.status} (expected 400)`);
  }

  return errors;
}

export const g104 = {
  id: "G-104",
  name: "overnight-qa-provenance-telemetry-f4-f6",
  async run() {
    const errors = [];

    // F4: baseline file + external report directory + regression detection
    const baseline = JSON.parse(read("tools/language-page/qa-baseline.json"));
    if (baseline.version !== 1 || !baseline.gates || typeof baseline.gates !== "object") {
      errors.push("qa-baseline.json missing version: 1 or gates map");
    }
    const reportDir = resolveReportDir("2026-11-25");
    if (!reportDir.endsWith(path.join("Documents", "EduWonderLab", "reports-2026-11-25"))) {
      errors.push(`resolveReportDir returned unexpected path: ${reportDir}`);
    }
    if (reportDir.startsWith(ROOT)) {
      errors.push(`resolveReportDir points inside repo root: ${reportDir}`);
    }
    errors.push(...checkBaselineDiff(diffAgainstBaseline));

    // F5: per-field provenance
    const drafted = attachFieldProvenance(
      { title: "Unit 1", summary: "Fractions", extra: "Unattributed" },
      { source: "pipeline-v1", fields: ["title", "summary"] },
    );
    if (
      drafted._provenance?.title?.status !== "draft" ||
      drafted._provenance?.title?.derived !== true ||
      drafted._provenance?.title?.source !== "pipeline-v1"
    ) {
      errors.push("attachFieldProvenance did not mark draft field provenance correctly");
    }
    const summary = summarizeFieldProvenance(drafted);
    if (
      summary.totalFields !== 3 ||
      summary.draftFields !== 2 ||
      summary.reviewedFields !== 0 ||
      summary.unattributedFields !== 1
    ) {
      errors.push(`summarizeFieldProvenance mismatch: ${JSON.stringify(summary)}`);
    }

    let threwOnAutoReview = false;
    try {
      attachFieldProvenance({ title: "Unit 1" }, { source: "pipeline-v1", status: "reviewed" });
    } catch {
      threwOnAutoReview = true;
    }
    if (!threwOnAutoReview) {
      errors.push(
        'attachFieldProvenance allowed status "reviewed" without human reviewerId/reviewedAt',
      );
    }

    const reviewed = attachFieldProvenance(
      { title: "Unit 1" },
      {
        source: "human-review",
        status: "reviewed",
        reviewerId: "teacher-01",
        reviewedAt: "2026-11-25T12:00:00Z",
      },
    );
    if (reviewed._provenance?.title?.status !== "reviewed") {
      errors.push("attachFieldProvenance did not record human-reviewed status");
    }

    // F6: telemetry v2 validation
    errors.push(...(await checkTelemetryV2(apiTelemetry.onRequest)));

    return {
      errors,
      info: {
        baselineGates: Object.keys(baseline.gates ?? {}).length,
        reportDirEndsExternal: !reportDir.startsWith(ROOT),
        f5Summary: summary,
      },
    };
  },
  async controls() {
    // Control A: baseline diff missing a PASS->FAIL regression -> MUST fail
    const blindDiff = (rows) => ({
      regressions: [],
      improvements: [],
      newGates: [],
      summary: {
        total: rows.length,
        pass: rows.length,
        fail: 0,
        skip: 0,
        regressionCount: 0,
        improvementCount: 0,
        newGateCount: 0,
      },
    });

    // Control B: telemetry v2 handler accepting PII -> MUST fail
    const piiAcceptingHandler = async () =>
      new Response(JSON.stringify({ ok: true }), { status: 202 });

    return [
      {
        name: "baseline diff misses PASS->FAIL regression",
        errors: checkBaselineDiff(blindDiff),
      },
      {
        name: "telemetry v2 accepts PII field",
        errors: await checkTelemetryV2(piiAcceptingHandler),
      },
    ];
  },
};

// ── G-105 helpers ─────────────────────────────────────────────────────────────
export function checkG1Assistant(validateFn = validateTeacherInput, draftFn = buildTeacherDraft) {
  const errors = [];
  const goodPrompt = "Explain how equivalent ratios represent the same relationship.";
  const okCheck = validateFn(goodPrompt);
  if (!okCheck?.ok) {
    errors.push(`valid teacher prompt was rejected: ${okCheck?.reason}`);
  }

  const badInputs = [
    ["IEP student writing", "IEP student John Smith wrote: I think ratios are cool."],
    ["student-writing marker", "My student wrote: The water cycle starts with evaporation."],
    ["email PII", "Email parent@example.com about this lesson."],
  ];
  for (const [label, sample] of badInputs) {
    const res = validateFn(sample);
    if (res?.ok) {
      errors.push(`G1 validateTeacherInput accepted forbidden input (${label})`);
    }
  }

  const draft = draftFn({
    teacherText: goodPrompt,
    grade: "6",
    subject: "Math",
    klu: "Explain",
    band: "3_4",
  });
  if (draft?.provenance?.status !== "draft") {
    errors.push("G1 buildTeacherDraft did not mark provenance.status as draft");
  }
  if (draft?.flagKey !== TEACHER_DRAFT_FLAG_KEY) {
    errors.push(`G1 buildTeacherDraft flagKey mismatch: ${draft?.flagKey}`);
  }
  if (!Array.isArray(draft?.draftFrames) || draft.draftFrames.length === 0) {
    errors.push("G1 buildTeacherDraft returned no draftFrames");
  }
  if (!Array.isArray(draft?.wordBankHints) || draft.wordBankHints.length === 0) {
    errors.push("G1 buildTeacherDraft returned no wordBankHints");
  }
  if (!draft?.checkQuestion) {
    errors.push("G1 buildTeacherDraft returned empty checkQuestion");
  }

  return errors;
}

export function checkG2Scaffold(buildFn = buildSupportScaffold) {
  const errors = [];
  const out = buildFn({
    unitId: "g6-math-u2",
    grade: "6",
    subject: "Math",
    klu: "Explain",
    targetWords: ["ratio", "equivalent"],
    band: "3_4",
  });

  if (out?.unitId !== "g6-math-u2" || out?.provenance?.status !== "draft") {
    errors.push("G2 buildSupportScaffold missing expected unitId or draft provenance");
  }
  if (
    !Array.isArray(out?.scaffolds?.sentenceStarters) ||
    out.scaffolds.sentenceStarters.length === 0 ||
    !out?.scaffolds?.visualCue ||
    !out?.scaffolds?.partnerCheck
  ) {
    errors.push("G2 buildSupportScaffold missing required scaffold fields");
  }

  for (const badKey of ["studentWork", "student", "alias", "recording"]) {
    let threw = false;
    try {
      buildFn({ unitId: "g6-math-u2", [badKey]: "forbidden-value" });
    } catch {
      threw = true;
    }
    if (!threw) {
      errors.push(`G2 buildSupportScaffold accepted forbidden key "${badKey}"`);
    }
  }

  return errors;
}

export const g105 = {
  id: "G-105",
  name: "teacher-assistant-and-support-g1-g2",
  async run() {
    const errors = [];

    // 1. Flag check: model_teacher_assistant MUST remain default: false
    const flag = registry.flags.find((f) => f.key === TEACHER_DRAFT_FLAG_KEY);
    if (!flag) {
      errors.push(`flag "${TEACHER_DRAFT_FLAG_KEY}" missing from shared/flags/registry.js`);
    } else if (flag.default !== false) {
      errors.push(`flag "${TEACHER_DRAFT_FLAG_KEY}" default must be false, got ${flag.default}`);
    }

    // 2. G1 module checks
    errors.push(...checkG1Assistant(validateTeacherInput, buildTeacherDraft));

    // 3. G1 standalone HTML page hygiene
    const pageRel = "bcpss-teachers/draft-assistant/index.html";
    const html = read(pageRel);
    if (!/never paste student writing or student names/i.test(html)) {
      errors.push(`${pageRel}: missing D8 student-writing/names prohibition notice`);
    }
    if (!html.includes("Draft — teacher review required")) {
      errors.push(`${pageRel}: missing "Draft — teacher review required" marker`);
    }
    errors.push(...scanPalette([[pageRel, html]]));
    errors.push(...scanSourceForExternalEgress(pageRel, html));
    if (/\bfetch\s*\(/i.test(html)) {
      errors.push(`${pageRel}: contains network fetch() call`);
    }

    // 4. G2 support scaffold checks
    errors.push(...checkG2Scaffold(buildSupportScaffold));

    return {
      errors,
      info: {
        flagDefault: flag?.default ?? null,
        pageChecked: pageRel,
      },
    };
  },
  async controls() {
    // Control A: G1 accepting "IEP student John Smith wrote..." -> MUST fail
    const permissiveValidate = () => ({ ok: true });

    // Control B: G2 accepting { studentWork: "..." } -> MUST fail
    const permissiveG2 = (input) => ({
      unitId: input.unitId,
      band: input.band ?? "3_4",
      klu: input.klu ?? "Explain",
      scaffolds: {
        sentenceStarters: ["Starter"],
        visualCue: "Cue",
        partnerCheck: "Check",
      },
      provenance: { status: "draft", source: "permissive-mock" },
    });

    return [
      {
        name: 'G1 accepts "IEP student John Smith wrote..."',
        errors: checkG1Assistant(permissiveValidate, buildTeacherDraft),
      },
      {
        name: 'G2 accepts { studentWork: "..." }',
        errors: checkG2Scaffold(permissiveG2),
      },
    ];
  },
};
