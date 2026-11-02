import { ALL_SKILLS } from "./problem-bank.js";

const STRATEGIES = new Set(["visual", "decompose", "recall", "symbolic"]);
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

export function makeMasteryReceipt({ skillKeys, accuracy, strategyTags = [] }) {
  const skills = [...new Set(skillKeys)].sort();
  if (!skills.length || skills.some((key) => !KNOWN_SKILLS.has(key))) throw new TypeError("Receipt needs one or more known skill keys.");
  if (!Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100) throw new RangeError("Receipt accuracy must be a whole percent from 0 to 100.");
  const strategies = [...new Set(strategyTags)].sort();
  if (strategies.some((tag) => !STRATEGIES.has(tag))) throw new TypeError("Receipt contains an unknown strategy tag.");
  const payload = `1|${skills.join(",")}|${accuracy}|${strategies.join(",")}`;
  return `EWL-${encodePayload(payload)}-${checksum(payload).toString(36).toUpperCase()}`;
}

export function decodeMasteryReceipt(code) {
  const match = /^EWL-([A-Za-z0-9_-]+)-([A-Z0-9]+)$/i.exec(String(code || "").trim());
  if (!match) throw new Error("Receipt code format was not recognized.");
  let payload;
  try { payload = decodePayload(match[1]); } catch { throw new Error("Receipt code could not be read."); }
  if (checksum(payload).toString(36).toUpperCase() !== match[2].toUpperCase()) throw new Error("Receipt checksum does not match; check the code and try again.");
  const [version, skillList, accuracyText, strategyList, ...extra] = payload.split("|");
  const skills = skillList?.split(",") || [];
  const accuracy = Number(accuracyText);
  const strategies = strategyList ? strategyList.split(",") : [];
  if (version !== "1" || extra.length || !skills.length || skills.some((key) => !KNOWN_SKILLS.has(key)) || !Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100 || strategies.some((tag) => !STRATEGIES.has(tag))) throw new Error("Receipt data is invalid or from an unsupported version.");
  return { version: 1, skillKeys: skills, accuracy, strategyTags: strategies };
}
