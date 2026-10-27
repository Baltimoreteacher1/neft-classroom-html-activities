import test from "node:test";
import assert from "node:assert/strict";
import { ALL_SKILLS } from "./problem-bank.js";
import { assignmentUrl, decodeAssignment, encodeAssignment, localQrMarkup, printablePacket } from "./school-tools.js";

const skill = ALL_SKILLS.find((entry) => entry.grade === 6);
const assignment = (overrides = {}) => ({
  version: 1,
  grade: skill.grade,
  keys: [`${skill.grade}:${skill.id}`],
  count: 10,
  mode: "adaptive",
  challenge: "adaptive",
  label: "Class practice",
  ...overrides,
});

test("compact assignment links round trip while legacy links remain readable", () => {
  const current = assignment({ label: "Razones | Fracciones · Día 2", lang: "es", mode: "guided", challenge: "grade-stretch" });
  const decoded = decodeAssignment(encodeAssignment(current));
  assert.deepEqual(decoded, { ...current, keys: [...current.keys] });

  const legacyToken = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(assignment()))));
  assert.deepEqual(decodeAssignment(legacyToken), assignment());
});

test("local assignment QR renders only within the QR encoder's validated input limit", () => {
  const oneSkillUrl = assignmentUrl(assignment());
  const qr = localQrMarkup(oneSkillUrl, { label: "Grade 6 skill QR" });
  assert.match(qr, /^<svg[^>]+role="img"[^>]*>/);
  assert.match(qr, /<\/svg>$/);

  const gradeSkills = ALL_SKILLS.filter((entry) => entry.grade === skill.grade).slice(0, 10);
  const longUrl = assignmentUrl(assignment({ keys: gradeSkills.map((entry) => `${entry.grade}:${entry.id}`) }));
  assert.equal(localQrMarkup(longUrl), null);
  assert.ok(longUrl.length > 134);
});

test("print packets include fresh skill-specific local QR codes and optional answer key", () => {
  const html = printablePacket(assignment(), { includeKey: true, seed: 123 });
  assert.equal((html.match(/class="packet-page"/g) || []).length, 5);
  assert.match(html, /class="packet-page teacher-answer-page"/);
  assert.match(html, /Continue online/);
  assert.match(html, /QR code for /);
  assert.match(html, /<svg[^>]+role="img"/);
  assert.match(html, /Teacher answer key/);
  assert.doesNotMatch(html, /api\.qrserver\.com|qrserver/);
});
