// Routine blocks through the real export endpoint: every rt-* part answers as web page and Word for a sample of units,
// the print part list and the registry agree, and a bad part is still refused.
// Run: node --test functions/_lib/bcpss/studio-routines.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import * as exportApi from "../../api/bcpss/export/[unitId].js";
import { blocksFor, ROUTINE_PART_IDS, routineParts } from "../../../shared/bcpss-routines/index.js";
import { PRINT_PARTS, isKnownPart } from "./studio-print-html.js";

const UNITS = ["gk-ela-u1", "g2-math-u1", "g6-math-u1", "g8-sci-u1"];

async function get(unitId, query) {
  const url = `https://x.test/api/bcpss/export/${unitId}?${query}`;
  return exportApi.onRequest({ request: new Request(url), env: {}, params: { unitId }, waitUntil() {} });
}

test("registry parts are print parts, and every part names a block and a view", () => {
  assert.ok(ROUTINE_PART_IDS.length >= 15);
  for (const part of ROUTINE_PART_IDS) {
    assert.ok(PRINT_PARTS.includes(part), `${part} missing from PRINT_PARTS`);
    assert.ok(isKnownPart(part));
    assert.match(part, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(part.length <= 14, `${part} is longer than the assignment part limit (14)`);
  }
  for (const [part, { block, view }] of routineParts()) {
    assert.ok(["student", "teacher"].includes(view), part);
    if (view === "student") assert.equal(block.audience, "student");
  }
});

for (const unitId of UNITS)
  test(`export endpoint serves every routine part for ${unitId}`, async () => {
    for (const part of ROUTINE_PART_IDS)
      for (const wida of ["1_2", "5_6"]) {
        const html = await get(unitId, `format=html&part=${part}&wida=${wida}`);
        assert.equal(html.status, 200, `${part} html ${wida}`);
        assert.match(await html.text(), /<section class="sec/);
        const docx = await get(unitId, `format=docx&part=${part}&wida=${wida}&download=1`);
        assert.equal(docx.status, 200, `${part} docx ${wida}`);
        assert.equal(Buffer.from(await docx.arrayBuffer()).subarray(0, 2).toString(), "PK");
      }
  });

test("an unknown routine part is still refused", async () => {
  const res = await get("g6-math-u1", "format=html&part=rt-nothing&wida=3_4");
  assert.equal(res.status, 400);
});

test("partly missing data yields no card instead of a crash", () => {
  assert.deepEqual(blocksFor({}), []);
  assert.deepEqual(blocksFor({ connections: [{}], esol_pack: {} }), []);
  // The redirect block names two sources; with both empty it has nothing to show.
  const half = { connections: [{ common_language_misconception: undefined, l1_watchouts: [] }] };
  assert.equal(blocksFor(half).some((b) => b.id === "redirect"), false);
});
