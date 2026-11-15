// Studio videos: the contract, the generator and the component promises, each proved able to fail.
// Run: node tools/studio-videos.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { studioVideoFor } from "../access-practice-lab/src/studio-video-mount.js";
import { cardHtml, esc } from "../assets/studio-video/studio-video-markup.mjs";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import {
  hubHtml,
  hydrate,
  plan,
  run,
  withBlock,
  withoutBlock,
} from "../scripts/generate-studio-videos.mjs";
import {
  assetPaths,
  BRANDS,
  normalizePage,
  pageFile,
  parseVtt,
  readManifest,
  validateManifest,
  videosFor,
} from "./lib/studio-videos.mjs";
import { componentProblems } from "./validate-studio-videos.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const entry = (id, extra = {}) => ({
  id,
  brand: "eduwonderlab",
  title: `Title ${id}`,
  description: `Description ${id}`,
  ...assetPaths(id),
  durationSec: 30,
  width: 1920,
  height: 1080,
  pages: ["/math/"],
  ...extra,
});
const manifest = (...videos) => ({ version: 1, videos });
const problemsFor = (m, opts) => validateManifest(m, opts).join("\n");

test("parseVtt accepts real captions and rejects what a browser would drop", () => {
  const cues = parseVtt(
    "WEBVTT\n\n1\n00:00:00.250 --> 00:00:06.233\nHello <b>there</b>\n\n2\n00:06.500 --> 00:07.000\nBye\n",
  );
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, "Hello there");
  for (const [bad, why] of [
    ["00:00.000 --> 00:01.000\nx", /WEBVTT/],
    ["WEBVTT\n\n00:01.000 --> 00:00.500\nx", /ends before/],
    ["WEBVTT\n\n00:01.000 --> 00:02.000\nx\n\n00:00.500 --> 00:00.900\ny", /before the previous/],
    ["WEBVTT\n\n00:00.000 --> 0:1\nx", /timestamp/],
    ["WEBVTT\n\n00:00.000 --> 00:01.000\n", /no text/],
    ["WEBVTT\n", /no cues/],
  ])
    assert.throws(() => parseVtt(bad), why, bad);
});

test("manifest contract: a good manifest passes, every class of bad entry fails", () => {
  assert.equal(problemsFor(manifest(entry("a"), entry("b", { pages: ["/math/games/"] }))), "");
  const bad = [
    [manifest(entry("a"), entry("a", { pages: [] })), /duplicate id/],
    [manifest(entry("Bad_Id")), /lowercase slug/],
    [manifest(entry("a", { brand: "acme" })), /brand must be one of/],
    [manifest(entry("a", { mp4: "/assets/other.mp4" })), /mp4 must be/],
    [manifest(entry("a", { width: 1080, height: 1920 })), /16:9/],
    [manifest(entry("a", { durationSec: 0 })), /durationSec/],
    [manifest(entry("a", { title: " " })), /title/],
    [manifest(entry("a", { pages: ["math"] })), /site path/],
    [manifest(entry("a", { pages: ["/math/?x=1"] })), /site path/],
    [manifest(entry("a", { pages: ["/math/", "/math"] })), /listed twice/],
    [manifest(entry("a"), entry("b")), /already mapped to "a"/],
    [manifest(entry("a", { pages: ["/videos/"] })), /brand hub/],
    [
      manifest(entry("a", { brand: "languagepage", pages: ["/access-practice-lab/videos"] })),
      /brand hub/,
    ],
    [{ ...manifest(entry("a")), videos: [{ ...entry("a"), extra: 1 }] }, /unknown key/],
    [{ version: 2, videos: [] }, /version/],
  ];
  for (const [m, why] of bad) assert.match(problemsFor(m), why, JSON.stringify(m).slice(0, 120));
  assert.match(
    problemsFor(manifest(entry("a", { pages: ["/access-teacher/"] })), { isTeacherSurface }),
    /teacher surface/,
  );
});

test("the committed manifest is valid against the real files", () => {
  const m = readManifest(ROOT);
  assert.deepEqual(validateManifest(m, { root: ROOT, isTeacherSurface }), []);
  assert.ok(m.videos.length >= 3);
  for (const v of m.videos) assert.ok(parseVtt(read(v.vtt.slice(1))).length > 0, v.id);
});

test("files that are missing, oversized or mis-timed are caught", () => {
  const m = manifest(entry("ghost"));
  const p = problemsFor(m, { root: ROOT });
  assert.match(p, /mp4 file missing/);
  assert.match(p, /poster file missing/);
  assert.match(p, /vtt file missing/);
  assert.match(
    problemsFor(manifest(entry("a", { pages: ["/no-such-page-xyz/"] })), { root: ROOT }),
    /no-such-page-xyz\/index\.html/,
  );
  const real = readManifest(ROOT).videos[0];
  assert.match(
    problemsFor(manifest({ ...real, durationSec: 5 }), { root: ROOT }),
    /past the 5s video/,
  );
});

test("page helpers", () => {
  assert.equal(normalizePage("/math/"), "/math");
  assert.equal(normalizePage("/"), "/");
  assert.equal(pageFile("/math/games/"), "math/games/index.html");
  assert.equal(pageFile("/"), "index.html");
});

test("a card is added only to mapped pages, and removing it restores the page byte for byte", () => {
  const e = hydrate(ROOT, readManifest(ROOT).videos[0]);
  for (const html of [
    '<main>\n<p>x</p>\n<footer class="site-footer">f</footer>\n</main>\n</body>',
    "<main>\n<p>x</p>\n</main>\n</body>",
    "<body>\n<p>x</p>\n</body>",
  ]) {
    const once = withBlock(html, e);
    assert.notEqual(once, html);
    assert.equal(withBlock(once, e), once, "idempotent");
    assert.equal(withoutBlock(once), html, "exact reversal");
  }
  assert.equal(withoutBlock("<p>untouched</p>"), "<p>untouched</p>");
  assert.throws(() => withBlock("<p>no anchor</p>", e), /insertion point/);
});

test("the committed tree matches the manifest: blocks on mapped pages only, nothing stale", () => {
  assert.deepEqual(run(ROOT, { check: true }), []);
  const m = readManifest(ROOT);
  const mapped = m.videos
    .flatMap((v) => v.pages.filter((p) => !p.startsWith("/access-practice-lab")).map(pageFile))
    .sort();
  const withBlockOnDisk = execFileSync(
    "git",
    ["grep", "-l", "-I", "studio-video:start", "--", "*.html"],
    { cwd: ROOT, encoding: "utf8" },
  )
    .split("\n")
    .filter((f) => f && !f.endsWith("videos/index.html"))
    .sort();
  assert.deepEqual(withBlockOnDisk, mapped);
  for (const file of mapped)
    assert.equal((read(file).match(/studio-video:start/g) || []).length, 1, file);
  // The plan touches nothing else: hubs, routes, mapped pages.
  const expected = new Set([
    ...mapped,
    BRANDS.eduwonderlab.hubFile,
    BRANDS.languagepage.hubFile,
    "access-practice-lab/src/studio-video-routes.js",
  ]);
  for (const file of plan(ROOT).keys()) assert.ok(expected.has(file), `unexpected output ${file}`);
});

test("each hub lists only its own brand's videos", () => {
  const m = readManifest(ROOT);
  const entries = m.videos.map((v) => hydrate(ROOT, v));
  for (const brandId of Object.keys(BRANDS)) {
    const html = read(BRANDS[brandId].hubFile);
    assert.equal(html, hubHtml(brandId, videosFor({ videos: entries }, brandId)));
    for (const v of m.videos)
      assert.equal(html.includes(`data-id="${v.id}"`), v.brand === brandId, `${brandId} / ${v.id}`);
    assert.match(html, new RegExp(`data-brand="${brandId}"`));
  }
  assert.match(hubHtml("eduwonderlab", []), /no videos here yet/);
});

test("the Language Page app mounts a card only on mapped routes", () => {
  const m = readManifest(ROOT);
  const routes = m.videos.flatMap((v) =>
    v.pages.filter((p) => p.startsWith("/access-practice-lab")).map((p) => [p, v.id]),
  );
  assert.ok(routes.length >= 2);
  for (const [page, id] of routes) {
    assert.equal(studioVideoFor(page)?.id, id, page);
    assert.equal(
      studioVideoFor(`${normalizePage(page)}/`)?.id,
      id,
      `${page} with a trailing slash`,
    );
  }
  for (const other of [
    "/access-practice-lab/explore/play",
    "/access-practice-lab/speak",
    "/access-practice-lab/videos/",
    "/math/",
    "/",
  ])
    assert.equal(studioVideoFor(other), null, other);
});

test("card markup escapes everything it prints", () => {
  const html = cardHtml({
    ...hydrate(ROOT, readManifest(ROOT).videos[0]),
    title: '<img src=x onerror="a()">',
    description: "a & b",
    cues: [{ start: 1, text: "<script>1</script>" }],
  });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<script>1"));
  assert.ok(html.includes("a &amp; b"));
  assert.equal(esc(`"'<>&`), "&quot;&#39;&lt;&gt;&amp;");
});

test("component promises hold, and each detector fires on a mutation of the real files", () => {
  const m = readManifest(ROOT);
  const base = {
    js: read("assets/studio-video/studio-video.js"),
    css: read("assets/studio-video/studio-video.css"),
    markup: cardHtml(hydrate(ROOT, m.videos[0])),
    hub: read(BRANDS[m.videos[0].brand].hubFile),
  };
  assert.deepEqual(componentProblems(base), []);
  const mutate = (key, from, to) => {
    assert.match(
      base[key],
      from instanceof RegExp ? from : new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `${key} lacks ${from}`,
    );
    return { ...base, [key]: base[key].replace(from, to) };
  };
  const cases = [
    [mutate("js", 'video.preload = "none"', 'video.preload = "auto"'), /preload/],
    [mutate("js", "video.controls = true", "video.controls = false"), /native controls/],
    [{ ...base, js: `${base.js}\ntrack.default = true;` }, /not be default/],
    [{ ...base, markup: `${base.markup}<track kind="captions" default>` }, /not be default/],
    [mutate("js", 't.mode = "disabled"', 't.mode = "showing"'), /disabled/],
    [mutate("js", 'track.kind = "captions"', 'track.kind = "subtitles"'), /captions <track>/],
    [mutate("js", "video.muted = true", "video.muted = false"), /muted/],
    [mutate("js", /IntersectionObserver/g, "Nope"), /IntersectionObserver/],
    [mutate("js", "transcript.open = true", "transcript.open = false"), /reduced-motion/],
    [{ ...base, js: `${base.js}\nvideo.autoplay = true;` }, /autoplay/],
    [{ ...base, js: `${base.js}\nsetTimeout(() => video.play(), 0);` }, /only play\(\) call/],
    [
      {
        ...base,
        js: `${base.js}\nfetch("https://cdn.example.com/x.js");`,
        css: `${base.css}\n.a{background:url(https://x.test/a.png)}`,
      },
      /third-party/,
    ],
    [mutate("css", "aspect-ratio: 16 / 9", "aspect-ratio: auto"), /16:9/],
    [
      mutate("css", "prefers-reduced-motion: reduce", "prefers-reduced-motion: none"),
      /reduced-motion/,
    ],
    [mutate("markup", "<summary>Captions text</summary>", "<summary>Text</summary>"), /disclosure/],
    [mutate("markup", 'alt=""', 'alt="x" data-x'), /alt/],
    [mutate("markup", "sv-fallback-label", "sv-x"), /labelled link/],
  ];
  for (const [input, why] of cases) assert.match(componentProblems(input).join("\n"), why);
});
