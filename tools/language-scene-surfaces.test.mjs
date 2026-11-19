import assert from "node:assert/strict";
import test from "node:test";
import { toHtml } from "../access-practice-lab/src/util.js";
import { museumSceneHTML } from "../access-practice-lab/src/views/museum-scene.js";
import { newsroomDeskHTML } from "../access-practice-lab/src/views/newsroom-scene.js";

const I = { S: (en) => en, T: (en) => en };
test("museum scene reflects collected evidence without revealing the answer", () => {
  const markup = toHtml(
    museumSceneHTML(
      I,
      [{ id: "lock", text: { en: "The lock is <closed>." }, relevant: true }],
      ["lock"],
    ),
  );
  assert.match(markup, /data-collected="true"/);
  assert.doesNotMatch(markup, /The lock is/);
  assert.match(markup, /On your board/);
  assert.doesNotMatch(markup, /relevant|correct answer/);
});
test("newsroom desk reports actual local notes and word counts, never publication success", () => {
  const markup = toHtml(
    newsroomDeskHTML(
      I,
      {
        w5: { who: "Students", what: "Plant a garden" },
        draft: { lead: "Students planted a garden." },
        fmt: "article",
      },
      "draft",
    ),
  );
  assert.match(markup, /data-nr-desk-notes>2/);
  assert.match(markup, /data-nr-desk-words>4/);
  assert.match(markup, /Shape your report/);
  assert.match(markup, /work stays on this device/);
  assert.doesNotMatch(markup, /Published successfully|WIDA score/);
});

test("scene paintings stay within delivery budgets and remain available in the offline pack", async () => {
  const { readFileSync, statSync } = await import("node:fs");
  const worker = readFileSync(new URL("../access-practice-lab/sw.js", import.meta.url), "utf8");
  for (const scene of ["museum-gallery", "newsroom-editorial"]) {
    for (const [suffix, budget] of [
      ["", 320000],
      ["-640", 90000],
    ]) {
      const asset = `access-practice-lab/pictures/premium/${scene}${suffix}.jpg`;
      assert.ok(
        statSync(new URL(`../${asset}`, import.meta.url)).size <= budget,
        `${asset}: delivery budget`,
      );
      assert.ok(worker.includes(`/${asset}`), `${asset}: optional offline coverage`);
    }
  }
});
