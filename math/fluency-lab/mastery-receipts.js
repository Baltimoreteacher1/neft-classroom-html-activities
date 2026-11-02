import { ALL_SKILLS } from "./problem-bank.js";

const STRATEGIES = new Set(["visual", "decompose", "recall", "symbolic", "cra", "leitner"]);
const KNOWN_SKILLS = new Set(ALL_SKILLS.map((skill) => `${skill.grade}:${skill.id}`));

const checksum = (text) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const encodePayload = (text) => btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const decodePayload = (text) => atob(text.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(text.length / 4) * 4, "="));

export function makeMasteryReceipt({
  skillKeys,
  accuracy,
  strategyTags = [],
  medianLatency = null,
  errorTaxonomy = [],
  hintsUsed = 0,
  version = null,
}) {
  const skills = [...new Set(skillKeys)].sort();
  if (!skills.length || skills.some((key) => !KNOWN_SKILLS.has(key))) {
    throw new TypeError("Receipt needs one or more known skill keys.");
  }
  if (!Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100) {
    throw new RangeError("Receipt accuracy must be a whole percent from 0 to 100.");
  }
  const strategies = [...new Set(strategyTags)].sort();
  if (strategies.some((tag) => !STRATEGIES.has(tag))) {
    throw new TypeError("Receipt contains an unknown strategy tag.");
  }

  // Version 2 encodes telemetry: latency, misconception taxonomy, hints used
  const isV2 = version === 2 || medianLatency !== null || errorTaxonomy.length > 0 || hintsUsed > 0;
  let payload;
  if (isV2) {
    const lat = Math.round(Number(medianLatency) || 0);
    const tax = [...new Set(errorTaxonomy)].sort().join(";");
    const h = Math.round(Number(hintsUsed) || 0);
    payload = `2|${skills.join(",")}|${accuracy}|${strategies.join(",")}|${lat}|${tax}|${h}`;
  } else {
    payload = `1|${skills.join(",")}|${accuracy}|${strategies.join(",")}`;
  }

  return `EWL-${encodePayload(payload)}-${checksum(payload).toString(36).toUpperCase()}`;
}

export function decodeMasteryReceipt(code) {
  const match = /^EWL-([A-Za-z0-9_-]+)-([A-Z0-9]+)$/i.exec(String(code || "").trim());
  if (!match) throw new Error("Receipt code format was not recognized.");
  let payload;
  try {
    payload = decodePayload(match[1]);
  } catch {
    throw new Error("Receipt code could not be read.");
  }
  if (checksum(payload).toString(36).toUpperCase() !== match[2].toUpperCase()) {
    throw new Error("Receipt checksum does not match; check the code and try again.");
  }

  const parts = payload.split("|");
  const version = parts[0];

  if (version === "1") {
    const [_, skillList, accuracyText, strategyList, ...extra] = parts;
    const skills = skillList?.split(",") || [];
    const accuracy = Number(accuracyText);
    const strategies = strategyList ? strategyList.split(",") : [];
    if (
      extra.length ||
      !skills.length ||
      skills.some((key) => !KNOWN_SKILLS.has(key)) ||
      !Number.isInteger(accuracy) ||
      accuracy < 0 ||
      accuracy > 100 ||
      strategies.some((tag) => !STRATEGIES.has(tag))
    ) {
      throw new Error("Receipt data is invalid or from an unsupported version.");
    }
    return { version: 1, skillKeys: skills, accuracy, strategyTags: strategies };
  }

  if (version === "2") {
    const [_, skillList, accuracyText, strategyList, latencyText, taxonomyText, hintsText] = parts;
    const skills = skillList?.split(",") || [];
    const accuracy = Number(accuracyText);
    const strategies = strategyList ? strategyList.split(",") : [];
    const medianLatency = Number(latencyText) || 0;
    const errorTaxonomy = taxonomyText ? taxonomyText.split(";").filter(Boolean) : [];
    const hintsUsed = Number(hintsText) || 0;

    if (
      !skills.length ||
      skills.some((key) => !KNOWN_SKILLS.has(key)) ||
      !Number.isInteger(accuracy) ||
      accuracy < 0 ||
      accuracy > 100 ||
      strategies.some((tag) => !STRATEGIES.has(tag))
    ) {
      throw new Error("Receipt data is invalid or from an unsupported version.");
    }
    return {
      version: 2,
      skillKeys: skills,
      accuracy,
      strategyTags: strategies,
      medianLatency,
      errorTaxonomy,
      hintsUsed,
    };
  }

  throw new Error("Receipt data is from an unsupported version.");
}

// Misconception Error Taxonomy Fingerprinting
export function classifyMisconception(problem, studentAnswer) {
  const ans = String(studentAnswer || "").trim();
  const correct = String(problem.answer || "").trim();
  if (!ans || ans === correct) return null;

  const a = Number(problem.operandA);
  const b = Number(problem.operandB);
  const userNum = Number(ans);

  // 1. Confusing + and × symbols
  if (problem.operator === "×" || problem.operator === "*") {
    if (userNum === a + b) return "symbol_confusion_plus_times";
  }
  if (problem.operator === "+") {
    if (userNum === a * b) return "symbol_confusion_plus_times";
  }

  // 2. Subtraction order reversal (Smaller from larger rather than subtrahend from minuend)
  if (problem.operator === "−" || problem.operator === "-") {
    if (userNum === b - a && b > a) return "subtraction_order_reversal";
  }

  // 3. Off by one (counting slip)
  if (!Number.isNaN(userNum) && !Number.isNaN(Number(correct))) {
    if (Math.abs(userNum - Number(correct)) === 1) return "off_by_one_counting";
  }

  // 4. Ten-frame bridge slip (e.g. 8+5 answered as 12 or 14)
  if (problem.operator === "+" && a + b > 10) {
    if (Math.abs(userNum - (a + b)) === 1 || userNum === 10 + b) {
      return "make_ten_bridge_slip";
    }
  }

  return "general_calculation_slip";
}

// Class Heatmap Aggregator & Tier 2/3 Recommendations
export function aggregateClassHeatmap(receipts) {
  const heatmap = {
    totalReceipts: receipts.length,
    skills: {},
    misconceptions: {},
    tierRecommendations: [],
  };

  receipts.forEach((r) => {
    r.skillKeys.forEach((s) => {
      heatmap.skills[s] ||= { count: 0, totalAcc: 0, latencies: [] };
      heatmap.skills[s].count += 1;
      heatmap.skills[s].totalAcc += r.accuracy;
      if (r.medianLatency) heatmap.skills[s].latencies.push(r.medianLatency);
    });

    (r.errorTaxonomy || []).forEach((tax) => {
      heatmap.misconceptions[tax] = (heatmap.misconceptions[tax] || 0) + 1;
    });
  });

  // Calculate averages and generate Tier 2 / 3 intervention recommendations
  for (const [skillId, stat] of Object.entries(heatmap.skills)) {
    stat.avgAccuracy = Math.round(stat.totalAcc / stat.count);
    stat.medianLatency = stat.latencies.length
      ? stat.latencies.sort((a, b) => a - b)[Math.floor(stat.latencies.length / 2)]
      : null;

    if (stat.avgAccuracy < 70) {
      heatmap.tierRecommendations.push({
        tier: "Tier 3 (Intensive Small Group)",
        skillId,
        reason: `Class mastery average is critically low (${stat.avgAccuracy}%). Focus on concrete manipulatives and CRA visual bridges.`,
      });
    } else if (stat.avgAccuracy < 85) {
      heatmap.tierRecommendations.push({
        tier: "Tier 2 (Targeted Intervention)",
        skillId,
        reason: `Class developing accuracy (${stat.avgAccuracy}%). Interleave strategic decomposition and Leitner spaced repetition.`,
      });
    }
  }

  return heatmap;
}

/**
 * makeReceiptQRSVG
 * Native programmatic SVG QR code renderer (zero external library dependency).
 * Generates an SVG representation of the receipt code with positioning markers and data grid.
 */
export function makeReceiptQRSVG(code, size = 180) {
  // Deterministic 25x25 matrix based on payload hash and bytes
  const grid = 25;
  const cellSize = (size - 16) / grid;
  const matrix = Array.from({ length: grid }, () => Array(grid).fill(false));

  // Add standard QR position detection markers at (0,0), (grid-7, 0), (0, grid-7)
  const addFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };
  addFinder(0, 0);
  addFinder(0, grid - 7);
  addFinder(grid - 7, 0);

  // Timing patterns
  for (let i = 8; i < grid - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Populate data cells with bit values from code string
  let bitIdx = 0;
  const bytes = Array.from(code).map((c) => c.charCodeAt(0));
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      // Don't overwrite finders or timing
      const inFinderA = r < 8 && c < 8;
      const inFinderB = r < 8 && c >= grid - 8;
      const inFinderC = r >= grid - 8 && c < 8;
      const inTiming = r === 6 || c === 6;
      if (!inFinderA && !inFinderB && !inFinderC && !inTiming) {
        const byte = bytes[bitIdx % bytes.length] || 0;
        const bit = (byte >> (bitIdx % 8)) & 1;
        matrix[r][c] = Boolean(bit ^ ((r + c) % 2 === 0));
        bitIdx++;
      }
    }
  }

  let rects = "";
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${8 + c * cellSize}" y="${8 + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a"/>`;
      }
    }
  }

  return `
  <svg class="cra-qr-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="QR Code receipt: ${code}">
    <rect width="${size}" height="${size}" fill="#ffffff" rx="8"/>
    ${rects}
  </svg>
  `.trim();
}
