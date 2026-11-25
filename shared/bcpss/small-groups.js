// C2 Small Groups with Station Sheets — pure planner and tight-spacing printable HTML.
// Supports 45/60/90-minute blocks (D10 default 60), 2-4 alias-only groups, 1 teacher-led
// station + 1-3 independent paper/pencil or on-device stations, zero physical objects,
// zero purple, zero student-facing banned tokens, and visible DRAFT_NOTICE.

import { DRAFT_NOTICE } from "../bcpss-provenance.js";
import { findLeaks } from "../packets/leak.js";

export const ALLOWED_BLOCK_MINUTES = Object.freeze([45, 60, 90]);
export const DEFAULT_BLOCK_MINUTES = 60;
export const MIN_GROUPS = 2;
export const MAX_GROUPS = 4;
export const NEUTRAL_GROUP_NAMES = Object.freeze(["Cedar", "Maple", "River", "Harbor"]);

const INITIALS_RE = /\b[A-Z]\.\s*[A-Z]\.?\b/;
const EMAIL_RE = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/;
const STUDENT_ID_RE = /\b\d{5,}\b/;

function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Strips/replaces PII or banned level/program tokens so student sheets stay alias-only.
 */
export function sanitizeAlias(raw, fallback = "Learner") {
  const cleaned = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  if (INITIALS_RE.test(cleaned) || EMAIL_RE.test(cleaned) || STUDENT_ID_RE.test(cleaned)) {
    return fallback;
  }
  if (findLeaks(cleaned, []).length > 0) {
    return fallback;
  }
  return cleaned.slice(0, 32);
}

function extractUnitMeta(unitOrDetail) {
  const unit = unitOrDetail?.unit || unitOrDetail || {};
  const vocab =
    unitOrDetail?.connections?.[0]?.tier2_tier3_vocab ||
    unitOrDetail?.tier2_tier3_vocab ||
    unitOrDetail?.vocab ||
    [];
  const targetWords = [];
  const seen = new Set();
  for (const item of vocab) {
    const raw = typeof item === "string" ? item : item?.term;
    const term = String(raw || "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    targetWords.push(term);
    if (targetWords.length >= 4) break;
  }
  return {
    unitId: String(unit.id || "").trim(),
    unitTitle: String(unit.unit_title || unit.title || "Current Unit").trim(),
    essentialQuestion: String(
      unit.essential_question || "How do key ideas connect in this unit?",
    ).trim(),
    targetWords,
  };
}

function buildStations(count, meta) {
  const words = meta.targetWords.length ? meta.targetWords.join(", ") : "unit key words";
  const all = [
    {
      id: "teacher-table",
      name: "Teacher Table",
      ledBy: "teacher",
      format: "paper-pencil",
      task: `Talk through "${meta.essentialQuestion}" together and build 2 clear sentences using ${words}.`,
      studentSteps: [
        "Listen to the focus question and read the key words.",
        "Share one idea out loud with the group.",
        "Write one complete sentence on your paper.",
      ],
    },
    {
      id: "word-desk",
      name: "Word & Reading Desk",
      ledBy: "independent",
      format: "paper-pencil",
      task: `Review the key words (${words}) and sketch or write one example for each word in your notebook.`,
      studentSteps: [
        "Read each key word quietly to yourself.",
        "Write a short example sentence for two words.",
        "Underline the key words in your sentences.",
      ],
    },
    {
      id: "speaking-corner",
      name: "Speaking Corner",
      ledBy: "independent",
      format: "on-device",
      task: `Open Speaking Studio on your device and record a 2-sentence answer to "${meta.essentialQuestion}".`,
      studentSteps: [
        "Plan 2 sentences using at least one key word.",
        "Record your voice on this device and listen back.",
        "Complete the 3-line self-check.",
      ],
    },
    {
      id: "writing-desk",
      name: "Writing Desk",
      ledBy: "independent",
      format: "paper-pencil",
      task: `Draft a short paragraph answering "${meta.essentialQuestion}" using at least two key words.`,
      studentSteps: [
        "Start with a clear topic sentence.",
        "Add one detail or example from class.",
        "Read your draft once to check punctuation and key words.",
      ],
    },
  ];
  return all.slice(0, count);
}

/**
 * Pure small-group rotation builder runnable by ONE teacher in ONE block (45, 60, or 90 min).
 */
export function buildSmallGroupPlan({ unit, groups, blockMinutes = DEFAULT_BLOCK_MINUTES } = {}) {
  const mins = Number(blockMinutes);
  if (!ALLOWED_BLOCK_MINUTES.includes(mins)) {
    throw new Error(
      `Invalid blockMinutes (${blockMinutes}). Allowed values: ${ALLOWED_BLOCK_MINUTES.join(", ")}.`,
    );
  }
  if (!Array.isArray(groups) || groups.length < MIN_GROUPS || groups.length > MAX_GROUPS) {
    throw new Error(`Small-group plans require between ${MIN_GROUPS} and ${MAX_GROUPS} groups.`);
  }

  const meta = extractUnitMeta(unit);
  const groupCount = groups.length;
  const sanitizedGroups = groups.map((g, idx) => {
    const defaultName = NEUTRAL_GROUP_NAMES[idx] || `Group ${idx + 1}`;
    const name = sanitizeAlias(g?.name, defaultName);
    const rawMembers = Array.isArray(g?.members) ? g.members : [];
    const members = rawMembers
      .map((m, mIdx) => sanitizeAlias(m, `${defaultName} ${mIdx + 1}`))
      .filter(Boolean);
    return {
      id: `g${idx + 1}`,
      name,
      members: members.length ? members : [`${name} 1`, `${name} 2`],
    };
  });

  const stations = buildStations(groupCount, meta);
  const launchMinutes = mins === 90 ? 10 : 5;
  const wrapUpMinutes = mins === 90 ? 8 : 5;
  const transitionMinutes = Math.max(0, (groupCount - 1) * 2);
  const usable = mins - launchMinutes - wrapUpMinutes - transitionMinutes;
  const minutesPerRotation = Math.floor(usable / groupCount);

  const rotations = [];
  for (let round = 0; round < groupCount; round += 1) {
    const assignments = sanitizedGroups.map((group, gIdx) => {
      const station = stations[(gIdx + round) % groupCount];
      return {
        groupId: group.id,
        groupName: group.name,
        stationId: station.id,
        stationName: station.name,
        ledBy: station.ledBy,
        format: station.format,
      };
    });
    rotations.push({
      round: round + 1,
      minutes: minutesPerRotation,
      assignments,
    });
  }

  return {
    unitId: meta.unitId,
    unitTitle: meta.unitTitle,
    essentialQuestion: meta.essentialQuestion,
    targetWords: meta.targetWords,
    blockMinutes: mins,
    launchMinutes,
    wrapUpMinutes,
    minutesPerRotation,
    groups: sanitizedGroups,
    stations,
    rotations,
    teacherCount: 1,
    physicalObjects: [],
    notice: DRAFT_NOTICE,
    derived: {
      status: "draft",
      source: "small-group-planner",
    },
  };
}

/**
 * Renders tight-spacing printable station sheets HTML:
 * - @page { margin: 0.5in; }
 * - No page-break-before: always
 * - Zero purple
 * - Carries DRAFT_NOTICE
 * - Zero student-facing banned tokens
 */
export function renderStationSheetsHtml(plan) {
  const wordsHtml = plan.targetWords.length
    ? plan.targetWords.map((w) => `<span class="kw">${escHtml(w)}</span>`).join(" ")
    : '<span class="kw">Unit Key Words</span>';

  const groupChips = plan.groups
    .map(
      (g) =>
        `<div class="grp-card"><strong>${escHtml(g.name)}</strong><div class="grp-members">${g.members.map(escHtml).join(" · ")}</div></div>`,
    )
    .join("");

  const scheduleRows = plan.rotations
    .map(
      (rot) =>
        `<tr><td><strong>Round ${rot.round}</strong> (${rot.minutes} min)</td>${rot.assignments
          .map((a) => `<td>${escHtml(a.stationName)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const stationCards = plan.stations
    .map(
      (st, idx) => `<section class="station-card">
        <div class="station-head">
          <h2>Station ${idx + 1}: ${escHtml(st.name)}</h2>
          <span class="tag">${st.ledBy === "teacher" ? "With Teacher" : st.format === "on-device" ? "On Device" : "Paper & Pencil"}</span>
        </div>
        <p class="station-task">${escHtml(st.task)}</p>
        <ol class="station-steps">${st.studentSteps.map((s) => `<li>${escHtml(s)}</li>`).join("")}</ol>
        <div class="response-lines" aria-label="Student writing space">
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Station Sheets — ${escHtml(plan.unitTitle)}</title>
  <style>
    @page { margin: 0.5in; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #182230; background: #ffffff; font-size: 10.5pt; line-height: 1.35; }
    .notice { background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; padding: 6px 10px; border-radius: 6px; font-size: 9pt; font-weight: 600; margin-bottom: 10px; }
    header { border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; margin-bottom: 10px; }
    h1 { margin: 0 0 4px; font-size: 14pt; color: #1e3a5f; }
    .meta { font-size: 9.5pt; color: #475467; margin: 0 0 6px; }
    .kw-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
    .kw { display: inline-block; padding: 2px 7px; border-radius: 999px; background: #ecfdf5; border: 1px solid #99f6e4; color: #0f766e; font-size: 9pt; font-weight: 600; }
    .groups-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 6px; margin-bottom: 10px; }
    .grp-card { border: 1px solid #dcd6cb; background: #faf9f6; border-radius: 6px; padding: 6px 8px; font-size: 9pt; }
    .grp-members { color: #475467; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt; }
    th, td { border: 1px solid #dcd6cb; padding: 4px 6px; text-align: left; }
    th { background: #f2efe9; color: #1e3a5f; }
    .stations-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .station-card { border: 1px solid #dcd6cb; border-radius: 8px; padding: 8px 10px; break-inside: avoid; background: #ffffff; }
    .station-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 4px; }
    .station-head h2 { margin: 0; font-size: 11pt; color: #1e3a5f; }
    .tag { font-size: 8pt; font-weight: 600; padding: 2px 6px; border-radius: 999px; background: #f2efe9; color: #182230; border: 1px solid #dcd6cb; white-space: nowrap; }
    .station-task { margin: 0 0 5px; font-size: 9.5pt; }
    .station-steps { margin: 0 0 8px; padding-left: 18px; font-size: 9pt; }
    .station-steps li { margin-bottom: 2px; }
    .response-lines { margin-top: 6px; }
    .line { border-bottom: 1px solid #94a3b8; height: 18px; }
  </style>
</head>
<body>
  <div class="notice" role="note">${escHtml(plan.notice || DRAFT_NOTICE)}</div>
  <header>
    <h1>${escHtml(plan.unitTitle)} — Station Rotation Plan</h1>
    <p class="meta">Block: ${plan.blockMinutes} min · Launch ${plan.launchMinutes} min · ${plan.rotations.length} rounds × ${plan.minutesPerRotation} min · Wrap-up ${plan.wrapUpMinutes} min</p>
    <p class="meta"><strong>Focus Question:</strong> ${escHtml(plan.essentialQuestion)}</p>
    <div class="kw-row"><strong>Key Words:</strong> ${wordsHtml}</div>
  </header>
  <section class="groups-grid" aria-label="Groups">${groupChips}</section>
  <table aria-label="Rotation schedule">
    <thead>
      <tr><th>Round</th>${plan.groups.map((g) => `<th>${escHtml(g.name)}</th>`).join("")}</tr>
    </thead>
    <tbody>${scheduleRows}</tbody>
  </table>
  <div class="stations-grid">${stationCards}</div>
</body>
</html>`;
}
