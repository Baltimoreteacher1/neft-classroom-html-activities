// The picture under every "I can…" goal card has to be TRUE.
//
// There were three illustrations in the whole system and 222 lesson configs, so
// each photo was reused dozens of times and nothing about a wrong caption threw:
// the image still loaded, the card still rendered, the lesson still passed every
// other gate. The first captions were a `unit === n` ladder written against an
// older unit numbering, and they told students they were looking at fraction
// bars, double number lines, box plots and four-quadrant grids — over a photo of
// a girl folding a paper net. The `alt` on all three was the literal string
// "Visual Model Representation", so a screen-reader user got nothing at all.
//
// The first repair routed by standard and, where no photo showed a lesson's
// math, said so out loud ("Her model is not today's math"). That was honest, but
// it left 138 of 222 lessons (62%) apologising for their own picture. The real
// fix was to DRAW the missing figures — assets/objective-art/*.svg, one exact
// labelled model per topic plus a partner-talk version of that same model.
//
// This file pins the whole defect class:
//   1. every lesson resolves two images that actually exist on disk, in BOTH
//      served trees,
//   2. every caption still carries THIS lesson's own objective, so a caption can
//      never drift off the goal it sits under,
//   3. no caption describes a manipulative that is absent from its picture —
//      the ban list per image is COMPUTED from what the image declares it shows,
//      checked against the scene text (the module's claim about the picture) and
//      never against the quoted objective, which is free to name whatever math
//      the lesson is about,
//   4. alt text is real, distinct per image, and never the old placeholder,
//   5. EVERY lesson is placed by its own standard or its own wording — nothing
//      falls through to a strand fallback or a hard default,
//   6. the hedging wording is gone and cannot come back,
//   7. each SVG on disk still describes itself exactly as the catalogue does,
//   8. the renderer is still wired to this module.
//
// The banned-phrase detector and the hedge detector are both self-tested BEFORE
// the sweep: a gate that quietly stops firing reports a perfectly clean
// curriculum.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bannedFor, MANIPULATIVES } from "../engine/core/objective-art-catalog.js";
import {
  classifyLesson,
  lessonTopic,
  OBJECTIVE_IMAGES,
  objectivePhrase,
  resolveObjectiveVisuals,
  TOPICS,
} from "../engine/core/objective-visuals.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = resolve(ROOT, "lessons");

const OLD_PLACEHOLDER_ALT = "Visual Model Representation";

// The exact wording the previous pass used when no photo showed a lesson's math.
// None of it may survive anywhere a student can read it.
const HEDGES = [
  /not today['’]s math/i,
  /the way she works is/i,
  /copy the move, not the words/i,
  /openly borrowed/i,
  /is not this lesson/i,
];

// Word-boundary match so "net" does not fire on "notebook" and "area" does not
// fire on "nearest".
function findBanned(text, banned) {
  const haystack = String(text || "").toLowerCase();
  return banned.filter((phrase) => new RegExp(`\\b${phrase.toLowerCase()}\\b`).test(haystack));
}

function findHedges(text) {
  return HEDGES.filter((re) => re.test(String(text || "")));
}

// ── Self-test the detectors ─────────────────────────────────────────────────
// If either stops matching, every assertion below passes vacuously.
assert.deepEqual(findBanned("she folds a paper net", ["net"]), ["net"], "detector must fire");
assert.deepEqual(findBanned("her notebook is open", ["net"]), [], "no false hit inside a word");
assert.deepEqual(
  findBanned("plotting on a DOUBLE NUMBER LINE", ["double number line"]),
  ["double number line"],
  "detector is case-insensitive and matches multi-word phrases",
);
// The exact wording of the original defect, against the photo it was printed on.
assert.deepEqual(
  findBanned(
    "A student dividing fraction bar strips on her desk grid mat.",
    OBJECTIVE_IMAGES.net.banned,
  ),
  ["fraction bar"],
  "the original defect must be detectable",
);
assert.equal(
  findHedges("Her model is not today's math — the way she works is.").length,
  2,
  "the hedge detector must fire on the wording it exists to ban",
);
assert.deepEqual(findHedges("A student folds a paper net on her grid mat."), []);

// ── Self-test the computed ban lists ────────────────────────────────────────
// `banned` is derived from `shows` rather than hand-maintained, so the
// derivation itself is now the thing that can rot.
assert.ok(MANIPULATIVES.includes("box plot") && MANIPULATIVES.includes("number line"));
assert.equal(
  bannedFor([]).length,
  MANIPULATIVES.length,
  "an image that shows no listed model bans every one of them",
);
assert.ok(!bannedFor(["box plot"]).includes("box plot"), "an image never bans what it shows");
assert.ok(bannedFor(["box plot"]).includes("histogram"), "…and still bans what it does not");
assert.ok(
  !bannedFor(["double number line"]).includes("number line"),
  "a shown phrase that CONTAINS a banned one cannot be failed by its own name",
);
assert.ok(
  bannedFor(["number line"]).includes("double number line"),
  "…but the containing phrase stays banned, which is the direction that matters",
);

// ── Self-test objectivePhrase ───────────────────────────────────────────────
assert.equal(
  objectivePhrase("I can write a number as a product of its prime factors."),
  "write a number as a product of its prime factors",
);
assert.equal(
  objectivePhrase("With my small group, I can divide fractions — one step at a time."),
  "divide fractions — one step at a time",
);
assert.equal(
  objectivePhrase("I can write inequalities using < and >."),
  "write inequalities using < and >",
  "comparison symbols must survive; the renderer escapes them",
);
assert.equal(objectivePhrase("Students will graph ordered pairs."), "graph ordered pairs");
assert.equal(objectivePhrase("Nothing recognisable here"), "Nothing recognisable here");
assert.equal(objectivePhrase(""), "");
assert.equal(objectivePhrase(undefined), "");

// ── Self-test the routing ───────────────────────────────────────────────────
// Routing is by standard, never by unit number — the old ladder is what a unit
// re-cut cost last time.
assert.equal(lessonTopic({ standard: "6.AT.8", unit: 7 }), "equations");
assert.equal(lessonTopic({ standard: "6.AT.9", unit: 7 }), "inequalities");
assert.equal(lessonTopic({ standard: "6.AT.6a", unit: 6 }), "expressions");
assert.equal(lessonTopic({ standard: "6.AT.5", unit: 6 }), "exponents");
assert.equal(lessonTopic({ standard: "6.GR.4", unit: 10 }), "solids");
assert.equal(lessonTopic({ standard: "6.GR.2", unit: 10 }), "solids");
assert.equal(lessonTopic({ standard: "6.GR.1", unit: 5 }), "planeArea");
assert.equal(lessonTopic({ standard: "6.DS.5", unit: 8 }), "boxPlot");
assert.equal(lessonTopic({ standard: "6.NOS.1", unit: 2 }), "fractionDivision");
assert.equal(lessonTopic({ standard: "6.NOS.4", unit: 1 }), "factors");
// 6.AT.3a must not be read as 6.AT.3, and 6.AT.3c must not be read as either.
assert.equal(lessonTopic({ standard: "6.AT.3" }), "ratios");
assert.equal(lessonTopic({ standard: "6.AT.3a" }), "ratioTables");
assert.equal(lessonTopic({ standard: "6.AT.3c" }), "measurement");
// One standard, two different models — the wording has to break the tie.
assert.equal(
  lessonTopic({ standard: "6.DS.5", title: "Display Data: Histograms" }),
  "histogram",
  "a histogram lesson must not be handed a box plot",
);
assert.equal(lessonTopic({ standard: "6.NOS.3", title: "Multiply Decimals" }), "decimalProduct");
assert.equal(lessonTopic({ standard: "6.NOS.3", title: "Divide Decimals" }), "decimalQuotient");
assert.equal(
  lessonTopic({ standard: "6.NOS.3", title: "Add and Subtract Decimals" }),
  "decimalSum",
);
assert.equal(
  lessonTopic({ standard: "6.AT.8", title: "Solve and Graph Inequalities" }),
  "inequalities",
);
// A catch-up whose own objective is generic is placed from the lessons it lists.
assert.equal(
  lessonTopic({
    standard: "6.AT.8",
    title: "7.4–7.7 Catch-Up",
    contentObjective: "I can show I am caught up by using each lesson's big idea.",
    vocabulary: [{ term: "Write Inequalities" }, { term: "Graph Inequalities" }],
  }),
  "inequalities",
);
// …but a catch-up that spans two models must NOT pick a favourite.
assert.equal(
  lessonTopic({
    standard: "6.NOS.3",
    title: "1.4–1.7 Catch-Up",
    contentObjective: "I can show I am caught up by using each lesson's big idea.",
    vocabulary: [{ term: "Multiply Decimals" }, { term: "Divide Decimals" }],
  }),
  "decimalSum",
  "an ambiguous catch-up falls back to its standard's default, not a coin toss",
);
assert.equal(
  lessonTopic({ title: "Surface Area Using Nets" }),
  "solids",
  "wording is the fallback when no standard is set",
);
assert.equal(classifyLesson({ standard: "6.DS.5" }).source, "standard");
assert.equal(classifyLesson({ title: "Area of Trapezoids" }).source, "wording");
assert.equal(classifyLesson({}).source, "default", "a config with nothing in it IS a fallback");

// Every topic points at two registered images, and no two topics share a picture
// — a shared picture is how a lesson ends up under somebody else's math.
const seenImage = new Map();
for (const [topic, pair] of Object.entries(TOPICS)) {
  for (const side of ["content", "language"]) {
    const key = pair[side];
    assert.ok(OBJECTIVE_IMAGES[key], `topic ${topic}.${side} points at unregistered image ${key}`);
    const owner = seenImage.get(key);
    assert.equal(
      owner,
      undefined,
      `${key} is used by both ${owner} and ${topic}.${side} — one topic per picture`,
    );
    seenImage.set(key, `${topic}.${side}`);
  }
}

// An algebra lesson gets the balance photo, a nets lesson gets the net photo,
// and a box-plot lesson now gets a box plot instead of either.
assert.equal(
  resolveObjectiveVisuals({ standard: "6.AT.8", contentObjective: "I can solve x + 3 = 7." })
    .content.src,
  OBJECTIVE_IMAGES.balance.src,
);
assert.equal(
  resolveObjectiveVisuals({ standard: "6.GR.4", contentObjective: "I can use a net." }).content.src,
  OBJECTIVE_IMAGES.solidsContent.src,
);
{
  const v = resolveObjectiveVisuals({
    standard: "6.DS.5",
    contentObjective: "I can display data in a box plot.",
    languageObjective: "I can describe a distribution using the word median.",
  });
  assert.equal(v.content.src, OBJECTIVE_IMAGES.boxPlotContent.src);
  assert.equal(v.language.src, OBJECTIVE_IMAGES.boxPlotTalk.src);
  assert.deepEqual(findHedges(v.content.caption), [], "no lesson may apologise for its picture");
  assert.ok(v.content.caption.includes("display data in a box plot"));
  assert.match(v.content.scene, /box plot/i, "the box-plot lesson's caption describes a box plot");
}

// Author overrides always win.
{
  const v = resolveObjectiveVisuals({
    standard: "6.DS.5",
    contentObjective: "I can build a box plot.",
    contentVisualCaption: "Hand-written caption.",
    languageVisualCaption: "Hand-written talk caption.",
  });
  assert.equal(v.content.caption, "Hand-written caption.");
  assert.equal(v.language.caption, "Hand-written talk caption.");
}
{
  const v = resolveObjectiveVisuals({
    standard: "6.DS.5",
    contentObjective: "I can build a box plot.",
    contentVisualImg: "/assets/somebody-elses-art.png",
  });
  assert.equal(v.content.src, "/assets/somebody-elses-art.png");
  assert.ok(v.content.alt.length > 0, "an unknown override still gets non-empty alt text");
}

// ── Every registered picture is on disk, in both served trees ───────────────
for (const [key, image] of Object.entries(OBJECTIVE_IMAGES)) {
  const rel = image.src.replace(/^\//, "");
  assert.ok(
    existsSync(resolve(ROOT, rel)) || existsSync(resolve(ROOT, "public", rel)),
    `${key}: ${image.src} is not on disk`,
  );
  if (!image.src.endsWith(".svg")) continue;
  // Generated artwork ships from BOTH trees; a file in only one of them is a
  // broken picture the moment the other tree is the one that gets published.
  assert.ok(existsSync(resolve(ROOT, rel)), `${key}: missing from assets/ — run generate`);
  assert.ok(
    existsSync(resolve(ROOT, "public", rel)),
    `${key}: missing from public/assets/ — run generate`,
  );
  // The file describes itself with the catalogue's alt. If somebody hand-edits
  // an SVG, or the catalogue drifts, this is where it surfaces.
  const svg = readFileSync(resolve(ROOT, rel), "utf8");
  const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(svg);
  assert.ok(title, `${key}: SVG has no <title>`);
  const decoded = title[1]
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
  assert.equal(
    decoded,
    image.alt,
    `${key}: the SVG's own description has drifted from the catalogue`,
  );
  assert.match(svg, /role="img"/, `${key}: SVG is missing role="img"`);
  assert.ok(
    !/<image\b|<script\b|https?:\/\/(?!www\.w3\.org)/i.test(svg),
    `${key}: SVG is not self-contained`,
  );
}

// ── Sweep every lesson ──────────────────────────────────────────────────────
const lessonDirs = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(resolve(LESSONS, d.name, "config.json")))
  .map((d) => d.name);

assert.ok(
  lessonDirs.length > 100,
  `objective-visuals sweep matched ${lessonDirs.length} lessons — a probe that walks nothing reports a clean site`,
);

const altBySrc = new Map();
const topicCounts = new Map();
const unplaced = [];
let checked = 0;

for (const id of lessonDirs) {
  const config = JSON.parse(readFileSync(resolve(LESSONS, id, "config.json"), "utf8"));
  const visuals = resolveObjectiveVisuals(config);
  const placement = classifyLesson(config);

  // 5. Placed by its own standard or its own wording — never by a strand
  //    fallback and never by the hard default. A lesson that lands in "family"
  //    or "default" is one nobody taught this module about, and it would be
  //    wearing a picture chosen for a stranger.
  if (placement.source !== "standard" && placement.source !== "wording") {
    unplaced.push(`${id} (${config.standard || "no standard"} → ${placement.source})`);
  }
  assert.ok(TOPICS[placement.topic], `${id}: resolved to unknown topic ${placement.topic}`);

  for (const [side, v] of Object.entries(visuals)) {
    const where = `${id} · ${side} objective`;

    // 1. The image exists where it is served from.
    const rel = v.src.replace(/^\//, "");
    assert.ok(
      existsSync(resolve(ROOT, "public", rel)) || existsSync(resolve(ROOT, rel)),
      `${where}: image ${v.src} is not on disk`,
    );

    // 2. The caption still carries this lesson's own objective.
    assert.ok(v.goalPhrase.length > 3, `${where}: no objective phrase resolved`);
    assert.ok(
      v.caption.includes(v.goalPhrase),
      `${where}: caption has drifted off its objective\n  caption: ${v.caption}\n  objective: ${v.goalPhrase}`,
    );

    // 3. The description of the PICTURE names nothing that is not in it.
    const image = Object.values(OBJECTIVE_IMAGES).find((i) => i.src === v.src);
    assert.ok(image, `${where}: ${v.src} has no entry in OBJECTIVE_IMAGES`);
    const sceneHits = findBanned(v.scene, image.banned);
    assert.deepEqual(
      sceneHits,
      [],
      `${where}: the caption describes ${sceneHits.join(", ")}, which is not in ${v.src}\n  scene: ${v.scene}`,
    );
    const altHits = findBanned(v.alt, image.banned);
    assert.deepEqual(
      altHits,
      [],
      `${where}: the alt text describes ${altHits.join(", ")}, which is not in ${v.src}`,
    );

    // 4. Real alt text — never the old placeholder, and one alt per picture.
    assert.ok(v.alt && v.alt.trim().length >= 40, `${where}: alt text is missing or too thin`);
    assert.notEqual(v.alt, OLD_PLACEHOLDER_ALT, `${where}: alt text is still the placeholder`);
    assert.notEqual(
      v.alt.trim(),
      v.caption.trim(),
      `${where}: alt text repeats the caption verbatim — a screen reader would read it twice`,
    );
    const seen = altBySrc.get(v.src);
    if (seen === undefined) altBySrc.set(v.src, v.alt);
    else assert.equal(seen, v.alt, `${where}: ${v.src} has two different alt texts`);

    // 6. Nothing anywhere still tells a student the picture is not their math.
    for (const text of [v.scene, v.caption, v.alt]) {
      assert.deepEqual(findHedges(text), [], `${where}: the hedging wording is back\n  ${text}`);
    }

    // The picture a lesson gets is the one its OWN topic registers — never one
    // inherited from a neighbouring topic.
    const expected = OBJECTIVE_IMAGES[TOPICS[placement.topic][side]];
    assert.equal(
      v.src,
      expected.src,
      `${where}: topic ${placement.topic} should show ${expected.src}`,
    );

    checked += 1;
  }

  topicCounts.set(placement.topic, (topicCounts.get(placement.topic) || 0) + 1);
}

assert.deepEqual(
  unplaced,
  [],
  `these lessons fall through to a generic picture instead of their own math:\n  ${unplaced.join("\n  ")}`,
);

assert.ok(checked > 200, `expected 2 visuals per lesson, checked only ${checked}`);

// Every alt must be distinct BETWEEN pictures too, or two different pictures
// read identically to a screen-reader user.
const alts = [...altBySrc.values()];
assert.equal(new Set(alts).size, alts.length, "two images share the same alt text");

// ── The renderer is still wired to this module ──────────────────────────────
const renderer = readFileSync(resolve(ROOT, "engine/core/lesson-renderer.js"), "utf8");
assert.match(
  renderer,
  /import \{ resolveObjectiveVisuals \} from "\.\/objective-visuals\.js"/,
  "lesson-renderer.js no longer imports the objective visuals module",
);
assert.ok(
  !renderer.includes(`alt="${OLD_PLACEHOLDER_ALT}"`),
  "the placeholder alt text is back in lesson-renderer.js",
);
assert.match(
  renderer,
  /alt="\$\{esc\(o\.alt\)\}"/,
  "the goal-card image must render an escaped, per-image alt",
);
assert.match(
  renderer,
  /<strong>Visual Representation:<\/strong> \$\{esc\(o\.caption\)\}/,
  "the caption must be escaped — inequality objectives contain < and >",
);

console.log(
  `objective-visuals: ${lessonDirs.length} lessons, ${checked} visuals checked, ` +
    `${Object.keys(OBJECTIVE_IMAGES).length} pictures registered · ` +
    `${[...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k}=${n}`)
      .join(" ")}`,
);
