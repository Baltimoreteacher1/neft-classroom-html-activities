// Resource Studio layout contracts: Bridging prints no frames, subject frames lead, and teacher notes never end a
// page on a heading whose text is overleaf. Run: node --test tools/studio-print-layout.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { buildDocument, TEMPLATES } from "../bcpss-teachers/studio/print/templates.js";
import { framesFor, makeCtx, SUBJECT_FRAMES, supportBlocks } from "../bcpss-teachers/studio/print/templates/kit.js";
import { fixtureInput } from "./studio-print-fixtures.mjs";

const BANDS = ["k-2", "3-5", "6-8"];

test("Bridging / Reaching support blocks print a checklist, never frames", () => {
  for (const band of BANDS) {
    const ctx = makeCtx(fixtureInput(band));
    const blocks = supportBlocks(ctx, "br", { bankWords: ["ratio"], klu: "Explain" });
    assert.ok(!blocks.some((b) => b.type === "frames"), `${band}: frames printed at Bridging`);
    assert.ok(blocks.some((b) => b.type === "check"), `${band}: no precision checklist at Bridging`);
  }
});

test("subject discourse frames come before generic frames", () => {
  const ctx = makeCtx(fixtureInput("6-8"));
  assert.equal(ctx.subject, "math");
  for (const tier of ["ee", "dev", "exp"]) assert.equal(framesFor(ctx, tier, "Explain")[0], SUBJECT_FRAMES.math[tier][0]);
});

test("no teacher-notes page ends on a heading", () => {
  for (const band of BANDS)
    for (const t of TEMPLATES.filter((x) => x.bands.includes(band))) {
      let doc;
      try {
        doc = buildDocument(t.id, fixtureInput(band, { tiers: ["ee", "dev", "exp", "br"], lang: "bilingual" }));
      } catch (e) {
        if (e.name === "NeedsContent") continue;
        throw e;
      }
      for (const pg of doc.sections.find((s) => s.kind === "notes").pages) {
        const last = pg.blocks.filter(Boolean).at(-1);
        assert.notEqual(last.type, "h", `${t.id} ${band}: notes page ends on heading "${last.text}"`);
      }
    }
});
