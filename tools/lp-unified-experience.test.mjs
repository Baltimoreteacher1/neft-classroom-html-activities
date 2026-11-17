import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildResourceRegistry,
  composeLessonPathway,
  discoverResources,
  expandQueryWords,
  recommendDifferentiation,
  SCAFFOLD_CATALOG,
  whatNextRecommendations,
} from "../access-practice-lab/src/resource-intelligence.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_INDEX = JSON.parse(
  fs.readFileSync(path.join(ROOT, "access-practice-lab/content/index.json"), "utf8"),
);

test("Resource Intelligence: unified registry populates canonical resources without inventing fake claims", () => {
  const reg = buildResourceRegistry({ index: CONTENT_INDEX });
  assert.ok(reg.length >= 100, `expected >=100 registry entries, got ${reg.length}`);

  const types = new Set(reg.map((r) => r.type));
  assert.ok(types.has("activity"), "registry includes activities");
  assert.ok(types.has("game"), "registry includes games");
  assert.ok(types.has("studio"), "registry includes studios");
  assert.ok(types.has("book"), "registry includes Book Studio");

  for (const r of reg) {
    assert.ok(r.id, "every resource has a stable id");
    assert.ok(r.title, "every resource has a canonical title");
    assert.ok(r.route, `canonical route for ${r.id}`);
    assert.equal(typeof r.urlFor, "function", "has urlFor helper");
    assert.ok(Array.isArray(r.bands) && r.bands.length > 0, "has bands");
    assert.ok(Array.isArray(r.scaffolds), "has scaffolds");
    assert.ok(Array.isArray(r.contexts) && r.contexts.length > 0, "has contexts");
    assert.ok(Array.isArray(r.purposes) && r.purposes.length > 0, "has instructional purposes");
  }
});

test("Resource Intelligence: synonym expansion and explainable discovery", () => {
  const reg = buildResourceRegistry({ index: CONTENT_INDEX });
  const expanded = expandQueryWords("phonics story");
  assert.equal(expanded.length, 2, "returns synonym groups per query token");
  assert.ok(
    expanded[0].includes("decoding") || expanded[0].includes("sounds"),
    "expands phonics synonyms",
  );
  assert.ok(
    expanded[1].includes("stories") || expanded[1].includes("book"),
    "expands story synonyms",
  );

  const res = discoverResources(reg, {
    q: "story",
    band: "3-5",
    domain: "Reading",
    support: "B",
    context: "teacher",
    limit: 6,
  });
  assert.ok(res.length > 0 && res.length <= 6, "returns bounded high-value results");
  for (const hit of res) {
    assert.ok(hit.item && hit.item.id, "includes matched item");
    assert.ok(
      Array.isArray(hit.why) && hit.why.length === 2,
      "includes bilingual transparent ranking explanation",
    );
  }
});

test("Resource Intelligence: 5-stage guided lesson pathway composer (Introduce -> Explore -> Practice -> Apply -> Review)", () => {
  const reg = buildResourceRegistry({ index: CONTENT_INDEX });
  const plan = composeLessonPathway(reg, {
    band: "3-5",
    domain: "Speaking",
    support: "B",
    minutes: 30,
    skill: "sequence",
  });
  assert.equal(plan.stages.length, 5, "produces all 5 instructional stages");
  assert.deepEqual(
    plan.stages.map((s) => s.stageId),
    ["introduce", "explore", "practice", "apply", "review"],
  );
  for (const stage of plan.stages) {
    assert.ok(stage.resource && stage.resource.id, `stage ${stage.stageId} has selected resource`);
    assert.ok(Array.isArray(stage.alternatives), `stage ${stage.stageId} has swap alternatives`);
    assert.ok(
      Array.isArray(stage.whySelected) && stage.whySelected[0],
      `stage ${stage.stageId} explains why it was chosen`,
    );
  }
  assert.ok(plan.playlistUrl.includes("/play?ids="), "builds shareable playlist URL");
});

test("Resource Intelligence: WIDA differentiation recommender preserves grade-level objective and includes fade guidance", () => {
  const reg = buildResourceRegistry({ index: CONTENT_INDEX });
  assert.ok(SCAFFOLD_CATALOG.length >= 10, "scaffold catalog has >=10 concrete scaffolds");
  const diffA = recommendDifferentiation({
    band: "3-5",
    domain: "Writing",
    support: "A",
    observedNeeds: ["bilingual-glossary"],
    registry: reg,
  });
  const diffC = recommendDifferentiation({
    band: "3-5",
    domain: "Writing",
    support: "C",
    registry: reg,
  });

  assert.ok(
    diffA.pedagogicalPrinciple[0].includes("Keep the grade-level thinking goal"),
    "states core WIDA principle",
  );
  assert.ok(diffA.scaffolds.length >= 3, "returns concrete scaffolds for Starting support");
  for (const sc of diffA.scaffolds) {
    assert.ok(
      Array.isArray(sc.fadeTip) && sc.fadeTip[0],
      `scaffold ${sc.id} includes fade-out tip`,
    );
  }
  assert.ok(diffA.recommendedActivities.length > 0, "recommends matching activities");
  assert.notDeepEqual(
    diffA.scaffolds.map((s) => s.id),
    diffC.scaffolds.map((s) => s.id),
    "adapts scaffold selection to WIDA support tier",
  );
});

test("Resource Intelligence: contextual What Next? recommendations for student, family, and teacher", () => {
  const studentNext = whatNextRecommendations({
    role: "student",
    band: "3-5",
    domain: "Speaking",
    trigger: "after-story",
  });
  assert.equal(studentNext.length, 2, "returns clear student next steps after story");
  assert.ok(
    studentNext.some((n) => n.href.includes("/book-studio")),
    "includes Book Studio creation link",
  );

  const familyNext = whatNextRecommendations({
    role: "family",
    band: "3-5",
    domain: "Reading",
    hasSavedWork: true,
  });
  assert.equal(familyNext.length, 3, "returns 3 family next steps when saved work exists");
  assert.ok(familyNext[0].title[1].includes("Continuar"), "includes Spanish translation");

  const teacherNext = whatNextRecommendations({
    role: "teacher",
    band: "6-8",
    domain: "Writing",
    trigger: "pathway-created",
  });
  assert.equal(teacherNext.length, 2, "returns teacher next steps after pathway creation");
});

test("Teacher Command Center & 3-Step Embedded Hub Tour exist and wire all 6 workflows", () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, "access-teacher/index.html"), "utf8");
  const ccJs = fs.readFileSync(path.join(ROOT, "access-teacher/command-center.js"), "utf8");
  const tourJs = fs.readFileSync(path.join(ROOT, "access-teacher/hub-tour.js"), "utf8");

  assert.ok(
    indexHtml.includes('id="tcCommandCenter"'),
    "Teacher Hub mounts Teaching Command Center",
  );
  assert.ok(
    indexHtml.includes("/access-teacher/command-center.js"),
    "Teacher Hub loads command-center.js",
  );

  for (const wf of ["plan", "support", "assign", "analyze", "resources", "create"]) {
    assert.ok(ccJs.includes(`id: "${wf}"`), `Command center defines workflow: ${wf}`);
  }
  assert.ok(tourJs.includes("HUB_TOUR_STEPS"), "Hub tour defines steps array");
  const stepMatches = tourJs.match(/\{\s*n:\s*\d+/g) || [];
  // Cut from 8 steps to 3 on 2026-11-17 (Joel: "not overwhelming, clear, easy to do"): pick, supports, share.
  assert.equal(stepMatches.length, 3, "Embedded Teacher Hub tour has 3 steps");
  assert.ok(tourJs.includes("assembleStarterKit"), "The last step builds the ready-to-use kit");
});

test("Family Hub 4 primary actions & Activity Family Companion + Family Tour Step 6 actions", () => {
  const hubJs = fs.readFileSync(path.join(ROOT, "access-practice-lab/src/family/hub.js"), "utf8");
  const compJs = fs.readFileSync(
    path.join(ROOT, "access-practice-lab/src/family/journey-companion.js"),
    "utf8",
  );
  const ftMain = fs.readFileSync(
    path.join(ROOT, "access-practice-lab/family-tour/main.js"),
    "utf8",
  );
  const ftActions = fs.readFileSync(
    path.join(ROOT, "access-practice-lab/family-tour/actions.js"),
    "utf8",
  );

  assert.ok(hubJs.includes('data-fam-action="start"'), "Family Hub has Start an Activity door");
  assert.ok(hubJs.includes('data-fam-action="read"'), "Family Hub has Read Together door");
  assert.ok(hubJs.includes('data-fam-action="help"'), "Family Hub has Help in My Language door");
  assert.ok(hubJs.includes('data-fam-action="progress"'), "Family Hub has See Progress door");

  assert.ok(
    compJs.includes("activityCompanionPage"),
    "Family companion renders per-activity companion card",
  );

  assert.ok(
    ftActions.includes('data-act="choose-another"'),
    "Family Tour Step 6 has Choose Another Activity",
  );
  assert.ok(
    ftActions.includes("kit.returnFamilyHome"),
    "Family Tour Step 6 has Return to Family Home",
  );
  assert.ok(ftMain.includes('"choose-another"'), "Family Tour main wires choose-another action");
});

test("Student Experience connects Language Quest with Book Studio and Connected Pathways", () => {
  const questJs = fs.readFileSync(
    path.join(ROOT, "access-practice-lab/src/views/quest.js"),
    "utf8",
  );
  const questMoreJs = fs.readFileSync(
    path.join(ROOT, "access-practice-lab/src/views/quest-more.js"),
    "utf8",
  );

  assert.ok(questJs.includes("/book-studio"), "Language Quest links directly to Book Studio");
  assert.ok(questJs.includes("/pathways"), "Language Quest links directly to Connected Pathways");
  assert.ok(questMoreJs.includes("/book-studio"), "Quest Create Room links to Book Studio");
});
