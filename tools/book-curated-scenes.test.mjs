import assert from "node:assert/strict";
import test from "node:test";
import {
  CURATED_SCENES,
  importCuratedScene,
  readableSceneBacking,
  sceneSource,
} from "../access-practice-lab/src/book/curated-scenes.js";

test("curated scenes use a closed same-origin catalogue with both preview sizes", () => {
  assert.equal(CURATED_SCENES.length, 2);
  assert.equal(sceneSource("../../private"), "");
  assert.match(sceneSource("museum-gallery", true), /museum-gallery-640.jpg$/);
  assert.ok(CURATED_SCENES.every((scene) => scene.altEn && scene.altEs));
});
test("scene bytes pass through existing image preparation before use", async () => {
  let source;
  const result = await importCuratedScene(
    "museum-gallery",
    async (url) => {
      source = url;
      return { ok: true, blob: async () => new Blob(["original-bytes"]) };
    },
    async (file) => {
      assert.equal(file.type, "image/jpeg");
      assert.equal(await file.text(), "original-bytes");
      return { blob: new Blob(["sanitised"]), width: 1440, height: 810 };
    },
  );
  assert.match(source, /^\/access-practice-lab\/pictures\/premium\/museum-gallery.jpg$/);
  assert.equal(await result.blob.text(), "sanitised");
});
test("unknown scenes and unavailable files fail without inventing saved media", async () => {
  await assert.rejects(
    importCuratedScene("https://evil.test/a.jpg", () => {
      throw new Error("must not fetch");
    }),
    { code: "scene" },
  );
  await assert.rejects(
    importCuratedScene("newsroom-editorial", async () => ({ ok: false })),
    { code: "scene-load" },
  );
});

test("background mode protects light and dark authored text with opaque panels", () => {
  assert.equal(readableSceneBacking("#ffffff"), "#000000");
  assert.equal(readableSceneBacking("#1b1f3b"), "#ffffff");
  assert.equal(readableSceneBacking("#fff"), "#000000");
  assert.equal(readableSceneBacking("invalid"), "#ffffff");
});
