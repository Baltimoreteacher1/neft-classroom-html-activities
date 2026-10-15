/* Lesson Path tracks + teacher layer: the switcher, ?track=, Shift+T, and that no answer content ships in the page. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const js = fs.readFileSync("assets/ewl/lesson-path.js", "utf8");
function load(id, query = "") {
  const html = fs.readFileSync(`math/lesson-path/${id}/index.html`, "utf8");
  const dom = new JSDOM(html, {
    url: `https://eduwonderlab.com/math/lesson-path/${id}/${query}`,
    runScripts: "outside-only",
  });
  const errors = [];
  dom.window.addEventListener("error", (e) => errors.push(e.message));
  dom.window.eval(js);
  return { dom, doc: dom.window.document, errors };
}
const key = (w, k, extra = {}) =>
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, ...extra }));

const withTracks = fs
  .readdirSync("math/lesson-path")
  .filter((id) => fs.existsSync(`math/lesson-path/${id}/index.html`))
  .filter((id) =>
    fs.readFileSync(`math/lesson-path/${id}/index.html`, "utf8").includes("lp-tracks"),
  );
assert.ok(withTracks.length > 20, `tracks present on many lessons (${withTracks.length})`);

const id = withTracks[0];
{
  const { dom, doc, errors } = load(id);
  const w = dom.window;
  const steps = [...doc.querySelectorAll(".lp-step")];
  assert.ok(
    steps.every((s) => !s.hidden),
    "core shows all four steps",
  );
  const scaf = doc.querySelector('[data-track="scaffold"]');
  const enr = doc.querySelector('[data-track="enrichment"]');
  (scaf || enr).click();
  const name = (scaf || enr).dataset.track;
  assert.ok(
    steps.every((s) => s.hidden),
    "other tracks hide the core steps",
  );
  assert.equal(doc.querySelector(`[data-track-panel="${name}"]`).hidden, false, "panel shows");
  assert.match(w.location.search, new RegExp(`track=${name}`), "URL carries ?track=");
  assert.equal(w.localStorage.getItem("lp_track"), name, "choice remembered");
  doc.querySelector('[data-track="core"]').click();
  assert.ok(
    steps.every((s) => !s.hidden),
    "core restores",
  );
  assert.equal(w.location.search, "", "?track removed for core");
  // teacher layer
  const t = doc.querySelector(".lp-teacher");
  assert.equal(t.hidden, true, "teacher layer hidden by default");
  key(w, "T", { shiftKey: true });
  assert.equal(t.hidden, false, "Shift+T reveals");
  key(w, "T", { shiftKey: true });
  assert.equal(t.hidden, true, "Shift+T hides");
  assert.deepEqual(errors, []);
}
{
  const { doc } = load(id, "?teacher=1");
  assert.equal(doc.querySelector(".lp-teacher").hidden, false, "?teacher=1 reveals");
}
{
  const { doc } = load(id, "?track=core");
  assert.ok([...doc.querySelectorAll(".lp-step")].every((s) => !s.hidden));
}
// nothing answer-shaped in any lesson-path page, teacher layer included
for (const lid of withTracks) {
  const html = fs.readFileSync(`math/lesson-path/${lid}/index.html`, "utf8");
  assert.ok(
    !/answer key|answer-key|teacher guidance/i.test(
      html.replace(/Answer keys and teaching guidance stay on signed-in teacher pages\./g, ""),
    ),
    `${lid} ships no answer content`,
  );
}
console.log(
  `lesson-path-tracks: ${withTracks.length} pages with tracks; switcher, ?track, Shift+T OK.`,
);
