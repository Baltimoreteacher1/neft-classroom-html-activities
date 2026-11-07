// Grades 4-5 keyboarding warm-up: level-matched sets, the offer on Writing pages, the Voice Lab list, and the
// house rules (accuracy only, English and Spanish, band scoped).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { checkTyping } from "../access-practice-lab/src/lang/keyboarding.js";

const dom = new JSDOM('<main id="app"></main><div id="labLive"></div>', {
  url: "https://lab.test/access-practice-lab/",
});
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = dom.window[key];
globalThis.CSS = { escape: (s) => String(s) };
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(
      await readFile(new URL(`../${String(url).replace(/^\//, "")}`, import.meta.url), "utf8"),
    ),
});
const { KEY_FRAMES, forBand, keyWarmupFor } = await import(
  "../access-practice-lab/src/content/voice-lab.js"
);
const { keyWarmupHTML } = await import("../access-practice-lab/src/views/key-warmup.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const view = await import("../access-practice-lab/src/views/activity.js");
const en = makeI18n("en");
const es = makeI18n("es");
const SPEED = /\b(wpm|per minute|timer|countdown|seconds|faster|hurry|speed)\b/i;

test("each 3-5 support level has its own set of five exactly typeable frames", () => {
  for (const level of ["A", "B", "C"]) {
    const set = keyWarmupFor("3-5", level);
    assert.ok(set, `level ${level}`);
    assert.equal(set.frames.length, 5);
    assert.ok(set.titleEs && set.titleEs !== set.title);
    for (const f of set.frames) {
      assert.match(f, /^[A-Z][\x20-\x7E]*[.?!]$/, f);
      assert.equal(checkTyping(f, f).exact, true);
      assert.equal(checkTyping(f, f.toLowerCase()).exact, false, "capitals count");
      assert.doesNotMatch(f, SPEED);
    }
  }
  assert.equal(keyWarmupFor("6-8", "A"), null);
  assert.equal(keyWarmupFor("3-5", "Z"), null);
});

test("frames grow with the level: the Level C frames are longer on average than Level A", () => {
  const avg = (l) => {
    const f = keyWarmupFor("3-5", l).frames;
    return f.reduce((n, x) => n + x.length, 0) / f.length;
  };
  assert.ok(avg("C") > avg("B") && avg("B") > avg("A"));
});

test("the Voice Lab lists the 3-5 sets for 3-5 only, and the older sets stay for every band", () => {
  const ids = (band) => forBand(KEY_FRAMES, band).map((s) => s.id);
  for (const id of ["kb-g45-a", "kb-g45-b", "kb-g45-c"]) {
    assert.ok(ids("3-5").includes(id));
    assert.ok(!ids("6-8").includes(id));
  }
  for (const id of ["kb-opinion", "kb-compare", "kb-narrate"]) {
    assert.ok(ids("3-5").includes(id) && ids("6-8").includes(id), id);
  }
});

test("the offer links to the matching set, shows device progress, and has Spanish", () => {
  const html = (I, band, level, voice) => toHtml(keyWarmupHTML(I, band, level, voice));
  const a = html(en, "3-5", "B", { keys: { "kb-g45-b": [0, 1] } });
  assert.match(a, /data-key-warmup="kb-g45-b"/);
  assert.match(a, /href="[^"]*\/voice\/keys\/kb-g45-b\?grades=3-5"/);
  assert.match(a, /2 of 5 typed exactly on this device/);
  assert.doesNotMatch(a, /\b(wpm|per minute|timer|countdown)\b/i);
  const b = html(es, "3-5", "B", {});
  assert.match(b, /Calienta tu escritura/);
  assert.match(b, /0 de 5 escritas con exactitud/);
  assert.equal(html(en, "6-8", "B", {}), "");
});

async function drawWriting(band, level, id) {
  const ctx = {
    band,
    prefs: {},
    route: { view: "activity", domain: "Writing", level, id },
    rerender() {},
    navigate() {},
  };
  history.replaceState({}, "", `/access-practice-lab/Writing/${level}/${id}`);
  document.querySelector("#app").innerHTML = toHtml((await view.render(ctx)).html);
}

test("a 3-5 Writing page offers the warm-up above the writing box; a 6-8 page does not", async () => {
  await drawWriting("3-5", "B", "g35-w-b-paragraph-pet");
  const offer = document.querySelector("[data-key-warmup]");
  assert.ok(offer, "warm-up offer renders");
  assert.equal(offer.dataset.keyWarmup, "kb-g45-b");
  const box = document.querySelector("textarea[data-note]");
  assert.ok(box, "writing box still renders");
  assert.ok(offer.compareDocumentPosition(box) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  await drawWriting("6-8", "B", "write-two-sentence-evidence");
  assert.equal(document.querySelector("[data-key-warmup]"), null);
  assert.ok(document.querySelector("textarea[data-note]"));
});
