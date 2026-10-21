#!/usr/bin/env node
/**
 * validate-family-resources.mjs — the "Learn more online" links must be true.
 *
 * THE DEFECT THIS ENDS. Every family homework page printed, above its links, "these links go to
 * specific videos and lessons about tonight's topic — not general math pages". The percent
 * lessons 4-1..4-4 linked "Intro to ratios", "Ratio tables" and "Unit rates"; sixteen pages
 * (Unit 1, 2-6, 6-14, Unit 10) linked a "Grade 6 math overview"; and nothing had ever checked
 * that a link still reached a page. (Khan Academy answers HTTP 200 for paths that do not exist,
 * so the status code alone proves nothing — see scripts/verify-family-resources.mjs.)
 *
 * data/homework-external-resources.json now declares what each lesson teaches and which
 * resources teach it. This gate, OFFLINE, holds that file to the claim:
 *
 *   - every lesson (and homework page) declares its topics; no links needs a written reason
 *   - a linked resource shares a topic with its lesson: a mismatch fails
 *   - no overview / course / whole-grade title and no URL that is not one specific video
 *   - every resource has an English and a different Spanish title, and a recorded
 *     verification: ok, status 200, landed on the URL, a real page title and heading
 *   - a verification older than 180 days fails; run scripts/verify-family-resources.mjs
 *   - at most two links per lesson, none in Unit 10, no resource nothing links to
 *   - a Spanish page is offered only when it was verified, and is the same video
 *   - the "specific videos" sentence is rendered with its links or not at all, and only
 *     by renderExternalResourcesSection (the page template may not carry its own copy)
 *
 * Self-tests first: every rule has a fixture it must reject, and the real file is mutated
 * (a resource unverified, a topic changed, a lesson dropped) to prove the sweep still fires.
 *
 *   node tools/validate-family-resources.mjs [--today YYYY-MM-DD]
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESOURCES_PATH,
  renderExternalResourcesSection,
} from "../scripts/homework-external-resources.mjs";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";
import { checkResource, evaluateResources, MAX_AGE_DAYS } from "./lib/family-resources.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const todayArg = process.argv.find((a, i) => process.argv[i - 1] === "--today");
const TODAY = todayArg || new Date().toISOString().slice(0, 10);

const failures = [];
const expect = (cond, label) => {
  if (!cond) failures.push(`SELF-TEST: ${label}`);
};

/* ---------------------------------------------------------------- fixtures */

const NOW = "2026-10-21";
const resource = (over = {}) => ({
  source: "Khan Academy",
  kind: "video",
  titleEn: "Intro to ratios",
  titleEs: "Introducción a las razones",
  url: "https://www.khanacademy.org/math/cc-sixth-grade-math/u/l/v/ratios-intro",
  topics: ["ratios.intro"],
  verification: {
    ok: true,
    status: 200,
    verifiedOn: NOW,
    finalUrl: "https://www.khanacademy.org/math/cc-sixth-grade-math/u/l/v/ratios-intro",
    pageTitle: "Intro to ratios (video) | Khan Academy",
    heading: "Intro to ratios",
  },
  ...over,
});
const fixture = (over = {}) => ({
  schemaVersion: 1,
  resources: { a: resource() },
  lessons: {
    "3-1": { topics: ["ratios.intro"], resources: ["a"] },
    "1-1": {
      topics: ["process.mindset"],
      resources: [],
      reason: "Community lesson: no video teaches it.",
    },
    "10-1": { topics: ["unit10.not-taught"], resources: [], reason: "Unit 10 is not taught." },
  },
  ...over,
});
const CTX = {
  manifestIds: ["3-1", "1-1", "10-1"],
  pageIds: ["3-1", "3-1-part2", "1-1", "10-1"],
  unit10: new Set(["10-1"]),
};
const run = (data, ctx = CTX, opts = {}) =>
  evaluateResources(data, ctx, { today: NOW, ...opts }).problems;
const has = (problems, word) => problems.some((p) => p.includes(word));

function selfTestRules() {
  expect(run(fixture()).length === 0, "a clean fixture passes");

  const bad = (patch, word, label) =>
    expect(has(run(fixture({ resources: { a: resource(patch) } })), word), label);
  bad({ titleEn: "Grade 6 math overview" }, "generic", "an overview title is rejected");
  bad({ titleEn: "6th grade math" }, "generic", "a whole-grade title is rejected");
  bad(
    { titleEs: "Resumen de matemáticas de 6° grado" },
    "generic",
    "a Spanish overview title is rejected",
  );
  bad(
    { titleEs: "Intro to ratios" },
    "copy of the English",
    "a Spanish title that is a copy is rejected",
  );
  bad({ titleEs: "" }, "titleEs", "a missing Spanish title is rejected");
  bad(
    { url: "https://www.khanacademy.org/math/cc-sixth-grade-math" },
    "not a specific video",
    "a course page is rejected",
  );
  bad(
    { url: "https://www.khanacademy.org/math/cc-sixth-grade-math/u/l/e/ratio-tables" },
    "not a specific video",
    "an exercise page is rejected",
  );
  bad({ url: "http://www.khanacademy.org/math/a/v/b" }, "https", "a non-https url is rejected");
  bad({ url: "https://example.com/math/a/v/b" }, "khanacademy.org", "another site is rejected");
  bad({ kind: "article" }, "kind", "a non-video is rejected (the page promises videos)");
  bad({ topics: [] }, "topics", "a resource with no topics is rejected");
  expect(
    has(
      run(fixture({ resources: { a: resource({ verification: undefined }) } })),
      "never verified",
    ),
    "an unverified resource is rejected",
  );
  const ver = (patch) => ({ ...resource().verification, ...patch });
  bad(
    { verification: ver({ ok: false, error: "timeout" }) },
    "verification failed",
    "a failed verification is rejected",
  );
  bad({ verification: ver({ status: 404 }) }, "not 200", "a non-200 record is rejected");
  bad(
    { verification: ver({ pageTitle: "Page not found | Khan Academy" }) },
    "not-found",
    "a not-found page title is rejected",
  );
  bad({ verification: ver({ heading: "Oops!" }) }, "not-found", "a not-found heading is rejected");
  bad(
    {
      verification: ver({
        finalUrl: "https://www.khanacademy.org/math/class-9-geometry-od/v/other",
      }),
    },
    "landed on",
    "a url that redirected elsewhere is rejected",
  );
  bad(
    { verification: ver({ verifiedOn: "2026-01-01" }) },
    "days ago",
    "a verification over 180 days old is rejected",
  );
  expect(
    !has(
      run(
        fixture({
          resources: { a: resource({ verification: ver({ verifiedOn: "2026-05-01" }) }) },
        }),
      ),
      "days ago",
    ),
    "a verification under 180 days old passes",
  );
  bad(
    { verification: ver({ verifiedOn: "2027-01-01" }) },
    "future",
    "a verification dated in the future is rejected",
  );
  bad(
    { verification: ver({ verifiedOn: "yesterday" }) },
    "not a date",
    "a verification without a date is rejected",
  );

  const es = "https://es.khanacademy.org/math/cc-sixth-grade-math/u/l/v/ratios-intro";
  const esVer = {
    ok: true,
    status: 200,
    verifiedOn: NOW,
    finalUrl: es,
    pageTitle: "Introducción",
    heading: "Introducción",
  };
  expect(
    run(fixture({ resources: { a: resource({ urlEs: es, verification: ver({ es: esVer }) }) } }))
      .length === 0,
    "a verified Spanish page passes",
  );
  bad(
    { urlEs: es },
    "no matching verification",
    "a Spanish page that was never verified is rejected",
  );
  bad(
    {
      urlEs: "https://www.khanacademy.org/math/cc-sixth-grade-math/u/l/v/ratios-intro",
      verification: ver({ es: esVer }),
    },
    "es.khanacademy.org",
    "a Spanish url on the English host is rejected",
  );
  bad(
    {
      urlEs: es.replace("ratios-intro", "other"),
      verification: ver({ es: { ...esVer, finalUrl: es.replace("ratios-intro", "other") } }),
    },
    "different page",
    "a Spanish page that is another video is rejected",
  );

  // lessons
  const lessonsWith = (patch) => fixture({ lessons: { ...fixture().lessons, ...patch } });
  expect(
    has(
      run(lessonsWith({ "3-1": { topics: ["percent.meaning"], resources: ["a"] } })),
      "topic mismatch",
    ),
    "a resource off the lesson's topic is rejected",
  );
  expect(
    has(run(lessonsWith({ "3-1": { topics: [], resources: ["a"] } })), "topics list"),
    "a lesson with no topics is rejected",
  );
  expect(
    has(
      run(
        fixture({
          resources: { a: resource(), b: resource(), c: resource() },
          lessons: {
            ...fixture().lessons,
            "3-1": { topics: ["ratios.intro"], resources: ["a", "b", "c"] },
          },
        }),
      ),
      "max 2",
    ),
    "three links on a lesson are rejected",
  );
  expect(
    has(run(lessonsWith({ "3-1": { topics: ["ratios.intro"], resources: ["a", "a"] } })), "twice"),
    "the same link twice is rejected",
  );
  expect(
    has(run(lessonsWith({ "1-1": { topics: ["x"], resources: [] } })), "written reason"),
    "no links without a reason is rejected",
  );
  expect(
    has(
      run(lessonsWith({ "10-1": { topics: ["unit10.not-taught"], resources: ["a"] } })),
      "Unit 10",
    ),
    "a link in Unit 10 is rejected",
  );
  expect(
    has(
      run(lessonsWith({ "3-1": { topics: ["ratios.intro"], resources: ["nope"] } })),
      "unknown resource",
    ),
    "an unknown resource id is rejected",
  );
  const noLesson = fixture();
  delete noLesson.lessons["1-1"];
  expect(has(run(noLesson), "declares no topics"), "a lesson missing from the file is rejected");
  expect(
    has(
      run(
        lessonsWith({
          "9-9": { topics: ["x"], resources: [], reason: "A reason that is long enough." },
        }),
      ),
      "not a lesson",
    ),
    "a stale lesson entry is rejected",
  );
  expect(
    has(run(fixture({ resources: { a: resource(), orphan: resource() } })), "linked by no lesson"),
    "a resource nothing links to is rejected",
  );
  expect(
    has(run(fixture(), { ...CTX, pageIds: [...CTX.pageIds, "4-4-part2"] }), "4-4-part2"),
    "a homework page without an entry is rejected",
  );
  expect(
    run(fixture(), { ...CTX, pageIds: [...CTX.pageIds, "3-1-part3"] }).length === 0,
    "a part page takes its core lesson's entry",
  );

  // what a family sees
  const claimNoLink = () => `<p><strong>specific</strong> videos</p>`;
  expect(
    has(run(fixture(), CTX, { render: claimNoLink }), "claim with no link"),
    "the claim rendered with no link is rejected",
  );
  expect(
    has(run(fixture(), CTX, { render: () => "<ul></ul>" }), "no links"),
    "a links section with no links is rejected",
  );
  expect(
    has(
      run(fixture(), CTX, {
        render: () =>
          '<a class="external-resource-link lang-en"></a><a class="external-resource-link lang-es"></a>',
      }),
      "without the claim",
    ),
    "links without the claim are rejected",
  );
  expect(renderExternalResourcesSection([]) === "", "the renderer returns nothing for no links");
  expect(
    renderExternalResourcesSection([
      { source: "Khan Academy", titleEn: "A", titleEs: "B", url: "https://x.test/", urlEs: "" },
    ]).includes("en inglés"),
    "an English-only Spanish link says so",
  );
  expect(
    has(
      run(fixture(), {
        ...CTX,
        templateSource: "<p>These links go to specific videos</p> renderExternalResourcesSection(",
      }),
      "writes the",
    ),
    "a template that carries its own claim is rejected",
  );
  expect(
    has(run(fixture(), { ...CTX, templateSource: "no call here" }), "does not call"),
    "a template that never calls the renderer is rejected",
  );
  expect(MAX_AGE_DAYS === 180, "the staleness limit is 180 days");
  expect(
    checkResource("x", resource(), NOW).length === 0,
    "checkResource accepts a clean resource",
  );
}

function selfTestSweep(data, ctx) {
  const clone = () => JSON.parse(JSON.stringify(data));
  expect(
    run(clone(), ctx, { today: TODAY }).length === 0,
    "the real file is clean before mutation",
  );
  const firstLinked = Object.keys(data.lessons).find((id) => data.lessons[id].resources.length);
  const rid = data.lessons[firstLinked].resources[0];
  const mutate = (fn) => {
    const d = clone();
    fn(d);
    return evaluateResources(d, ctx, { today: TODAY }).problems;
  };
  expect(
    has(
      mutate((d) => (d.resources[rid].verification.ok = false)),
      "verification failed",
    ),
    "SWEEP: unverifying a linked resource is caught",
  );
  expect(
    has(
      mutate((d) => (d.lessons[firstLinked].topics = ["not.a.topic"])),
      "topic mismatch",
    ),
    "SWEEP: changing a lesson's topic is caught",
  );
  expect(
    has(
      mutate((d) => (d.resources[rid].titleEn = "Grade 6 math overview")),
      "generic",
    ),
    "SWEEP: an overview title is caught",
  );
  expect(
    has(
      mutate((d) => (d.resources[rid].verification.verifiedOn = "2025-01-01")),
      "days ago",
    ),
    "SWEEP: a stale verification is caught",
  );
  expect(
    has(
      mutate((d) => delete d.lessons[firstLinked]),
      "declares no topics",
    ),
    "SWEEP: dropping a lesson is caught",
  );
  expect(
    has(
      mutate((d) => (d.resources[rid].url = d.resources[rid].url.replace(/\/v\/.*$/, ""))),
      "not a specific video",
    ),
    "SWEEP: a url cut back to a lesson index is caught",
  );
  expect(
    has(
      mutate((d) => d.lessons[firstLinked].resources.push(...Object.keys(d.resources).slice(0, 3))),
      "max 2",
    ),
    "SWEEP: a third link is caught",
  );
}

/* ------------------------------------------------------------------ sweep */

selfTestRules();

const data = JSON.parse(readFileSync(RESOURCES_PATH, "utf8"));
const manifest = JSON.parse(
  readFileSync(join(ROOT, "data", "curriculum-launch-manifest.json"), "utf8"),
);
const ctx = {
  manifestIds: manifest.lessons.map((l) => l.id),
  pageIds: listLessonDirs().filter((id) => existsSync(lessonPath(id, "homework.html"))),
  unit10: new Set(manifest.lessons.filter((l) => l.unit === 10).map((l) => l.id)),
  templateSource: readFileSync(join(ROOT, "scripts", "homework-guided-notes.mjs"), "utf8"),
};
if (!ctx.manifestIds.length || !ctx.pageIds.length)
  failures.push("the sweep found no lessons at all");
selfTestSweep(data, { ...ctx, templateSource: undefined });

const { problems, stats } = evaluateResources(data, ctx, { today: TODAY });
failures.push(...problems);

if (failures.length) {
  for (const f of failures) console.error(f);
  console.error(`\n${failures.length} problem(s).`);
  process.exit(1);
}
console.log(
  `family resources: ${stats.resources} videos (${stats.withSpanish} with a Spanish page) on ${stats.linkedLessons}/${stats.lessons} lessons, ` +
    `${stats.links} links, ${stats.lessons - stats.linkedLessons} lessons honestly link nothing (${stats.unlinked.join(", ")}); every record under ${MAX_AGE_DAYS} days old.`,
);
