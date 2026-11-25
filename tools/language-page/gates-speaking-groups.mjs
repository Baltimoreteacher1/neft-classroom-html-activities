// G-100 speaking-book-next-step (B2 Speaking Studio + B5 Book Tie-In & Find My Next Step)
// G-101 small-groups-and-assignments (C2 Small Groups Station Sheets + C3 Assignment v2 & My Work)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOK_STUDIO_BASE_HREF,
  buildBookTieIn,
  findNextStep,
} from "../../shared/bcpss/book-next-step.js";
import {
  ALLOWED_BLOCK_MINUTES,
  buildSmallGroupPlan,
  renderStationSheetsHtml,
} from "../../shared/bcpss/small-groups.js";
import {
  assertOnDeviceOnly,
  buildPartnerTurn,
  completionSummary,
  D8_ON_DEVICE_NOTICE,
  SELF_CHECK_LINES,
  SPEAKING_DB_NAME,
} from "../../shared/bcpss/speaking-studio.js";
import { DRAFT_NOTICE } from "../../shared/bcpss-provenance.js";
import {
  ASSIGNMENT_CONTRACT_VERSION,
  buildShareLinks,
  createAssignmentV2,
  filterMyWork,
  validateAssignmentV2,
} from "../../shared/class-platform/assignment-polish.js";
import { findLeaks } from "../../shared/packets/leak.js";
import { vocabOf } from "./dataset.mjs";
import { scanPalette } from "./gates-misc.mjs";
import { scanSourceForExternalEgress } from "./gates-offline-egress.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function stripHtmlToVisibleText(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── G-100 helpers ─────────────────────────────────────────────────────────────

export function checkCompletionSummary(summary) {
  const errors = [];
  if (!summary || typeof summary !== "object") {
    return ["completionSummary did not return an object"];
  }
  const keys = Object.keys(summary).sort();
  if (keys.join(",") !== "completedCount,lastCompletedAt") {
    errors.push(`completionSummary exposed unexpected keys: ${keys.join(", ")}`);
  }
  const forbiddenKeys = [
    "audio",
    "blob",
    "transcript",
    "name",
    "studentName",
    "alias",
    "score",
    "level",
    "wida",
  ];
  for (const k of forbiddenKeys) {
    if (k in summary) errors.push(`completionSummary leaked forbidden field: ${k}`);
  }
  if (typeof summary.completedCount !== "number" || summary.completedCount < 0) {
    errors.push(`invalid completedCount: ${summary.completedCount}`);
  }
  return errors;
}

export function checkBookTieInPacket(packet, detail) {
  const errors = [];
  const uid = detail?.unit?.id || "unknown";
  const authoredSet = new Set(
    vocabOf(detail)
      .map((v) =>
        String(typeof v === "string" ? v : v?.term || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );
  if (!packet || typeof packet !== "object") {
    return [`${uid}: buildBookTieIn returned non-object`];
  }
  if (packet.unitId !== uid) errors.push(`${uid}: unitId mismatch (${packet.unitId})`);
  if (!String(packet.bookStudioHref || "").startsWith(BOOK_STUDIO_BASE_HREF)) {
    errors.push(`${uid}: bookStudioHref does not link to ${BOOK_STUDIO_BASE_HREF}`);
  }
  if (packet.derived?.status !== "draft" || packet.derived?.source !== "unit-authored") {
    errors.push(`${uid}: invalid derived provenance ${JSON.stringify(packet.derived)}`);
  }
  if (!Array.isArray(packet.targetWords)) {
    errors.push(`${uid}: targetWords is not an array`);
  } else {
    for (const w of packet.targetWords) {
      if (!authoredSet.has(String(w).trim().toLowerCase())) {
        errors.push(`${uid}: invented/unauthored vocab term in book tie-in: "${w}"`);
      }
    }
  }
  return errors;
}

export const gateSpeakingBookNextStep = {
  id: "G-100",
  name: "speaking-book-next-step",
  async run({ data }) {
    const errors = [];

    // B2 Speaking Studio checks
    if (SPEAKING_DB_NAME !== "ewl-speaking-studio-v1") {
      errors.push(`unexpected SPEAKING_DB_NAME: ${SPEAKING_DB_NAME}`);
    }
    if (!Array.isArray(SELF_CHECK_LINES) || SELF_CHECK_LINES.length !== 3) {
      errors.push(`SELF_CHECK_LINES must have exactly 3 items (got ${SELF_CHECK_LINES?.length})`);
    } else {
      for (const line of SELF_CHECK_LINES) {
        if (!line.en || !line.es) errors.push(`self-check line missing EN/ES text: ${line.id}`);
      }
    }

    const onDevice = assertOnDeviceOnly();
    if (!onDevice?.ok) errors.push("assertOnDeviceOnly() did not return ok:true");
    let uploadBlocked = false;
    try {
      assertOnDeviceOnly({ uploadUrl: "https://example.test/upload" });
    } catch {
      uploadBlocked = true;
    }
    if (!uploadBlocked) errors.push("assertOnDeviceOnly() failed to reject uploadUrl");

    const sampleRecords = [
      {
        id: "r1",
        createdAt: "2026-11-20T10:00:00.000Z",
        blob: { size: 1024 },
        transcript: "sensitive student voice text",
        studentName: "Jordan Doe",
        score: 4,
      },
      {
        id: "r2",
        createdAt: "2026-11-21T15:30:00.000Z",
        audio: "base64-audio",
        transcript: "another utterance",
      },
    ];
    const summary = completionSummary(sampleRecords);
    errors.push(...checkCompletionSummary(summary));
    if (summary.completedCount !== 2 || summary.lastCompletedAt !== "2026-11-21T15:30:00.000Z") {
      errors.push(`unexpected completionSummary values: ${JSON.stringify(summary)}`);
    }

    const sampleUnit = data.units[0];
    const turnA = buildPartnerTurn(sampleUnit, "A");
    const turnB = buildPartnerTurn(sampleUnit, "B");
    if (turnA.role !== "A" || turnB.role !== "B" || !turnA.prompt || !turnB.prompt) {
      errors.push("buildPartnerTurn failed to generate valid Partner A/B prompts");
    }

    const speakingHtmlRel = "bcpss-teachers/speaking-studio/index.html";
    const speakingHtmlAbs = path.join(ROOT, speakingHtmlRel);
    if (!fs.existsSync(speakingHtmlAbs)) {
      errors.push(`missing ${speakingHtmlRel}`);
    } else {
      const html = fs.readFileSync(speakingHtmlAbs, "utf8");
      if (!html.includes("Recordings stay on this device and are never uploaded")) {
        errors.push(`${speakingHtmlRel}: missing D8 on-device notice`);
      }
      if (!D8_ON_DEVICE_NOTICE.includes("never uploaded")) {
        errors.push("D8_ON_DEVICE_NOTICE missing 'never uploaded'");
      }
      errors.push(...scanPalette([[speakingHtmlRel, html]]));
      errors.push(...scanSourceForExternalEgress(speakingHtmlRel, html));
    }

    // B5 Book tie-in across all 162 units
    for (const detail of data.units) {
      const packet = buildBookTieIn(detail, "3_4");
      errors.push(...checkBookTieInPacket(packet, detail));
    }

    // B5 Find My Next Step determinism & score-free checks
    const nextInput = {
      unitId: sampleUnit.unit.id,
      completedKinds: ["vocab"],
      domainCounts: { listening: 2, speaking: 0, writing: 1, book: 1 },
      band: "3_4",
    };
    const next1 = findNextStep(nextInput);
    const next2 = findNextStep(nextInput);
    if (JSON.stringify(next1) !== JSON.stringify(next2)) {
      errors.push("findNextStep is not deterministic");
    }
    if (next1.kind !== "speak") {
      errors.push(`expected findNextStep to recommend lowest-count 'speak', got '${next1.kind}'`);
    }
    if (next1.derived?.status !== "draft" || next1.derived?.source !== "deterministic-rules") {
      errors.push(`findNextStep invalid derived metadata: ${JSON.stringify(next1.derived)}`);
    }
    if ("score" in next1 || "level" in next1 || "wida" in next1) {
      errors.push("findNextStep must not include score, level, or wida fields");
    }
    const nextTextLeaks = findLeaks(`${next1.label} ${next1.reason}`, []);
    if (nextTextLeaks.length) {
      errors.push(`findNextStep exposed banned tokens: ${nextTextLeaks.join(", ")}`);
    }

    return {
      errors,
      info: {
        unitsChecked: data.units.length,
        selfCheckLines: SELF_CHECK_LINES.length,
        nextStepRecommended: next1.kind,
      },
    };
  },
  async controls({ data }) {
    const leakySummary = {
      completedCount: 1,
      lastCompletedAt: "2026-11-21T15:30:00.000Z",
      transcript: "I think the river flows south",
      audio: "blob:fake",
    };
    const sampleDetail = data.units[0];
    const inventedPacket = {
      ...buildBookTieIn(sampleDetail, "3_4"),
      targetWords: ["quantum-flux-invented-term"],
    };
    return [
      {
        name: "completion summary leaking transcript/audio",
        errors: checkCompletionSummary(leakySummary),
      },
      {
        name: "invented vocab term in book tie-in",
        errors: checkBookTieInPacket(inventedPacket, sampleDetail),
      },
    ];
  },
};

// ── G-101 helpers ─────────────────────────────────────────────────────────────

export function checkStationSheetHtml(html, sourceStrings = [], label = "station-sheet") {
  const errors = [];
  if (!/@page\s*\{[^}]*margin:\s*0\.5in\b/i.test(html)) {
    errors.push(`${label}: missing @page { margin: 0.5in; }`);
  }
  if (/page-break-before\s*:\s*always|break-before\s*:\s*page/i.test(html)) {
    errors.push(`${label}: forbidden forced page break detected`);
  }
  if (!html.includes(DRAFT_NOTICE)) {
    errors.push(`${label}: missing DRAFT_NOTICE`);
  }
  errors.push(...scanPalette([[`${label}.html`, html]]));
  const visible = stripHtmlToVisibleText(html);
  const leaks = findLeaks(visible, sourceStrings);
  if (leaks.length) {
    errors.push(`${label}: student-facing banned tokens leaked: ${[...new Set(leaks)].join(", ")}`);
  }
  return errors;
}

export function checkAssignmentContract(assignment) {
  const res = validateAssignmentV2(assignment);
  return res.valid ? [] : res.errors;
}

export const gateSmallGroupsAndAssignments = {
  id: "G-101",
  name: "small-groups-and-assignments",
  async run({ data }) {
    const errors = [];
    const sampleDetail = data.units[0];
    const sourceStrings = [
      sampleDetail.unit.unit_title,
      sampleDetail.unit.essential_question,
      ...vocabOf(sampleDetail).map((v) => (typeof v === "string" ? v : v?.term || "")),
    ].filter(Boolean);

    // C2 Station sheets across 45/60/90-min blocks and 2-4 groups
    const testGroups = [
      { name: "Cedar", members: ["Cedar 1", "Cedar 2"] },
      { name: "Maple", members: ["Maple 1", "Maple 2"] },
      { name: "River", members: ["River 1", "River 2"] },
      { name: "Harbor", members: ["Harbor 1", "Harbor 2"] },
    ];
    for (const blockMinutes of ALLOWED_BLOCK_MINUTES) {
      for (const groupCount of [2, 3, 4]) {
        const plan = buildSmallGroupPlan({
          unit: sampleDetail,
          groups: testGroups.slice(0, groupCount),
          blockMinutes,
        });
        if (plan.teacherCount !== 1) {
          errors.push(`block ${blockMinutes}/${groupCount}: teacherCount must be 1`);
        }
        if (!Array.isArray(plan.physicalObjects) || plan.physicalObjects.length !== 0) {
          errors.push(`block ${blockMinutes}/${groupCount}: physicalObjects must be empty`);
        }
        const html = renderStationSheetsHtml(plan);
        errors.push(
          ...checkStationSheetHtml(html, sourceStrings, `station-${blockMinutes}m-${groupCount}g`),
        );
      }
    }

    const sgHtmlRel = "bcpss-teachers/small-groups/index.html";
    const sgHtmlAbs = path.join(ROOT, sgHtmlRel);
    if (!fs.existsSync(sgHtmlAbs)) {
      errors.push(`missing ${sgHtmlRel}`);
    } else {
      const sgHtml = fs.readFileSync(sgHtmlAbs, "utf8");
      errors.push(...scanPalette([[sgHtmlRel, sgHtml]]));
      errors.push(...scanSourceForExternalEgress(sgHtmlRel, sgHtml));
    }

    // C3 Assignment Polish & My Work
    if (ASSIGNMENT_CONTRACT_VERSION !== "ewl-assignment/2") {
      errors.push(`unexpected ASSIGNMENT_CONTRACT_VERSION: ${ASSIGNMENT_CONTRACT_VERSION}`);
    }
    const a1 = createAssignmentV2({
      id: "g6-ela-u1-speak",
      unitId: "g6-ela-u1",
      title: "Speaking Studio Practice",
      bandOrGroup: "3_4",
      dueDate: "2026-12-05",
      activityUrl: "/bcpss-teachers/speaking-studio/?unit=g6-ela-u1",
      notes: "Use two key words from class.",
    });
    const a2 = createAssignmentV2({
      id: "g6-ela-u1-vocab",
      unitId: "g6-ela-u1",
      title: "Key Words Practice",
      bandOrGroup: "3_4",
      dueDate: "2026-12-02",
      activityUrl: "/bcpss-teachers/language-studio/?unit=g6-ela-u1&mode=vocab",
    });
    errors.push(...checkAssignmentContract(a1));
    errors.push(...checkAssignmentContract(a2));

    const links = buildShareLinks(a1, "https://classroom.example.org");
    if (
      links.directUrl !==
      "https://classroom.example.org/bcpss-teachers/speaking-studio/?unit=g6-ela-u1"
    ) {
      errors.push(`unexpected directUrl: ${links.directUrl}`);
    }
    if (
      !links.googleClassroomText.includes(links.directUrl) ||
      !links.googleClassroomText.includes(a1.dueDate)
    ) {
      errors.push("googleClassroomText missing directUrl or dueDate");
    }
    if (!links.canvasPasteHtml.includes(links.directUrl)) {
      errors.push("canvasPasteHtml missing directUrl");
    }
    errors.push(...scanPalette([["canvas-paste.html", links.canvasPasteHtml]]));

    const myWork = filterMyWork([a1, a2], {
      alias: "Cedar 1",
      groupId: "3_4",
      completedIds: ["g6-ela-u1-vocab"],
    });
    if (myWork.items.length !== 2 || myWork.items[0].id !== "g6-ela-u1-vocab") {
      errors.push("filterMyWork did not sort by dueDate ascending");
    }
    if (!myWork.items[0].completed || myWork.items[1].completed) {
      errors.push("filterMyWork completion state mismatch");
    }
    for (const item of myWork.items) {
      if ("bandOrGroup" in item || "band" in item || "level" in item) {
        errors.push(`filterMyWork exposed band/level field on item ${item.id}`);
      }
    }

    const mwHtmlRel = "bcpss-teachers/my-work/index.html";
    const mwHtmlAbs = path.join(ROOT, mwHtmlRel);
    if (!fs.existsSync(mwHtmlAbs)) {
      errors.push(`missing ${mwHtmlRel}`);
    } else {
      const mwHtml = fs.readFileSync(mwHtmlAbs, "utf8");
      errors.push(...scanPalette([[mwHtmlRel, mwHtml]]));
      errors.push(...scanSourceForExternalEgress(mwHtmlRel, mwHtml));
      const mwVisible = stripHtmlToVisibleText(mwHtml);
      const mwLeaks = findLeaks(mwVisible, []);
      if (mwLeaks.length) {
        errors.push(`${mwHtmlRel}: leaked banned tokens: ${[...new Set(mwLeaks)].join(", ")}`);
      }
    }

    return {
      errors,
      info: {
        blocksTested: ALLOWED_BLOCK_MINUTES.length,
        assignmentVersion: ASSIGNMENT_CONTRACT_VERSION,
        myWorkItems: myWork.items.length,
      },
    };
  },
  async controls({ data }) {
    const sampleDetail = data.units[0];
    const plan = buildSmallGroupPlan({
      unit: sampleDetail,
      groups: [
        { name: "Cedar", members: ["Cedar 1"] },
        { name: "Maple", members: ["Maple 1"] },
      ],
      blockMinutes: 60,
    });
    const leakyStationHtml = renderStationSheetsHtml(plan).replace(
      "</body>",
      "<p>WIDA Level 2 / IEP</p></body>",
    );
    const missingVersionAssignment = {
      id: "bad-1",
      unitId: "g6-ela-u1",
      title: "Missing Version",
      dueDate: "2026-12-05",
      activityUrl: "/bcpss-teachers/speaking-studio/",
    };
    const externalUrlAssignment = {
      version: ASSIGNMENT_CONTRACT_VERSION,
      id: "bad-2",
      unitId: "g6-ela-u1",
      title: "External URL",
      dueDate: "2026-12-05",
      activityUrl: "https://evil.example/phish",
    };
    return [
      {
        name: "station sheet containing WIDA Level 2 / IEP",
        errors: checkStationSheetHtml(leakyStationHtml, [], "control-leaky-station"),
      },
      {
        name: "invalid assignment missing version",
        errors: checkAssignmentContract(missingVersionAssignment),
      },
      {
        name: "invalid assignment with external URL",
        errors: checkAssignmentContract(externalUrlAssignment),
      },
    ];
  },
};
