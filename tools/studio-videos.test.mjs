// Studio videos: the contract, the generator and the component promises, each proved able to fail.
// Run: node tools/studio-videos.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { placeCard, studioVideoFor } from "../access-practice-lab/src/studio-video-mount.js";
import { cardHtml, esc } from "../assets/studio-video/studio-video-markup.mjs";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import {
  hubHtml,
  hydrate,
  plan,
  routesModule,
  run,
  withBlock,
  withBlocks,
  withoutBlock,
} from "../scripts/generate-studio-videos.mjs";
import { locateAnchor } from "./lib/studio-video-anchor.mjs";
import {
  assetPaths,
  BRANDS,
  isClip,
  normalizePage,
  pageFile,
  parseVtt,
  placementOf,
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
    [
      manifest(entry("a", { pages: [{ path: "/math/", after: "#x", extra: 1 }] })),
      /unknown key "extra"/,
    ],
    [manifest(entry("a", { pages: [{ path: "/math/", up: 1 }] })), /`up` without `after`/],
    [manifest(entry("a", { pages: [{ path: "/math/", after: "#x", up: 4 }] })), /`up` must be/],
    [manifest(entry("a", { pages: [{ path: "/math/", after: " " }] })), /one-line CSS selector/],
    [
      manifest(
        entry("a", {
          pages: [
            { path: "/math/", after: "#x" },
            { path: "/math", after: "#x" },
          ],
        }),
      ),
      /listed twice/,
    ],
    [
      manifest(
        entry("a", { pages: [{ path: "/math/", after: "#x" }] }),
        entry("b", { pages: [{ path: "/math/", after: "#x" }] }),
      ),
      /already mapped to "a" \(one video per place/,
    ],
    [
      manifest(entry("a", { pages: [{ path: "/access-practice-lab/speak", after: "a[" }] })),
      /not a valid CSS selector/,
    ],
    [{ ...manifest(entry("a")), videos: [{ ...entry("a"), extra: 1 }] }, /unknown key/],
    [{ version: 2, videos: [] }, /version/],
  ];
  for (const [m, why] of bad) assert.match(problemsFor(m), why, JSON.stringify(m).slice(0, 120));
  assert.match(
    problemsFor(manifest(entry("a", { pages: ["/access-teacher/"] })), { isTeacherSurface }),
    /teacher surface/,
  );
  // The same page can carry several videos when each has its own place on it.
  assert.equal(
    problemsFor(
      manifest(
        entry("a", { pages: ["/math/"] }),
        entry("b", { pages: [{ path: "/math/", after: "#x" }] }),
        entry("c", { pages: [{ path: "/math/", after: "#x", up: 1 }] }),
      ),
    ),
    "",
  );
});

test("anchors are checked against the real page: a renamed section fails", () => {
  // Static pages only: a Language Page app route (/access-practice-lab/…) is rendered at run time, so its anchor is
  // checked by placeCard in the browser, not against a file (the home's card is anchored since 2026-11-17).
  const staticAnchor = (p) => typeof p !== "string" && !p.path.startsWith("/access-practice-lab/");
  const real = readManifest(ROOT).videos.find((v) => v.pages.some(staticAnchor));
  assert.ok(real, "the manifest uses at least one anchored placement");
  const anchored = real.pages.find(staticAnchor);
  assert.deepEqual(problemsFor(manifest(real), { root: ROOT }), "");
  const bad = (page) => problemsFor(manifest({ ...real, pages: [page] }), { root: ROOT });
  assert.match(bad({ ...anchored, after: "#no-such-section" }), /no element inside <body> matches/);
  assert.match(bad({ ...anchored, after: "h2[" }), /not a valid CSS selector/);
  assert.match(bad({ ...anchored, after: "main", up: 2 }), /no parent 2 level|no parent 1 level/);
});

test("locateAnchor lands after the element, climbs parents, and rejects what is missing", () => {
  const html = '<body><div id="a"><h2 id="h">T</h2><p>x</p></div><p id="z">end</p></body>';
  const at = (opts) => html.slice(0, locateAnchor(html, opts));
  assert.ok(at({ after: "#h" }).endsWith("</h2>"));
  assert.ok(at({ after: "#h", up: 1 }).endsWith("<p>x</p></div>"));
  assert.ok(at({ after: "p" }).endsWith("<p>x</p>"), "first match wins");
  assert.throws(() => locateAnchor(html, { after: "#nope" }), /no element inside/);
  assert.throws(() => locateAnchor(html, { after: "#a", up: 1 }), /parent 1/);
  assert.throws(() => locateAnchor(html, { after: "body" }), /no element inside/);
});

test("placementOf reads both page forms", () => {
  assert.deepEqual(placementOf("/math/"), { path: "/math/", after: null, up: 0 });
  assert.deepEqual(placementOf({ path: "/math/", after: "#a", up: 2 }), {
    path: "/math/",
    after: "#a",
    up: 2,
  });
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
  const placed = m.videos.flatMap((v) =>
    v.pages
      .map((p) => placementOf(p).path)
      .filter((p) => !p.startsWith("/access-practice-lab"))
      .map(pageFile),
  );
  const mapped = [...new Set(placed)].sort();
  const withBlockOnDisk = execFileSync(
    "git",
    ["grep", "-l", "-I", "studio-video:start", "--", "*.html"],
    { cwd: ROOT, encoding: "utf8" },
  )
    .split("\n")
    .filter((f) => f && !f.endsWith("videos/index.html"))
    .sort();
  assert.deepEqual(withBlockOnDisk, mapped);
  for (const file of mapped) {
    const html = read(file);
    assert.equal(
      (html.match(/studio-video:start/g) || []).length,
      placed.filter((f) => f === file).length,
      file,
    );
    assert.equal(
      (html.match(/studio-video\.css"/g) || []).length,
      1,
      `${file}: assets once per page`,
    );
  }
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
    v.pages
      .map((p) => placementOf(p).path)
      .filter((p) => p.startsWith("/access-practice-lab"))
      .map((p) => [p, v.id]),
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
    "/access-practice-lab/voice",
    "/access-practice-lab/videos/",
    "/math/",
    "/",
  ])
    assert.equal(studioVideoFor(other), null, other);
});

test("several cards on one page: assets once, each in its place, exact reversal", () => {
  const [a, b] = readManifest(ROOT)
    .videos.slice(0, 2)
    .map((v) => hydrate(ROOT, v));
  const html = [
    "<body>",
    "<main><section><h1>T</h1>",
    "<p>lead</p>",
    '<h2 id="s2">Two</h2><div id="w"><p>w</p></div></section></main>',
    "</body>",
  ].join("\n");
  const placed = withBlocks(html, [
    { entry: b, after: "#s2" },
    { entry: a },
    { entry: { ...a, id: "third" }, after: "#w", up: 0 },
  ]);
  const order = [...placed.matchAll(/studio-video:start ([a-z0-9-]+)/g)].map((m) => m[1]);
  assert.deepEqual(order, [a.id, b.id, "third"], "document order, not manifest order");
  assert.equal((placed.match(/studio-video\.css"/g) || []).length, 1);
  assert.ok(
    placed.indexOf("studio-video.css") < placed.indexOf("<studio-video"),
    "assets before the first card",
  );
  assert.equal(
    withBlocks(placed, [
      { entry: b, after: "#s2" },
      { entry: a },
      { entry: { ...a, id: "third" }, after: "#w" },
    ]),
    placed,
    "idempotent",
  );
  assert.equal(withoutBlock(placed), html, "exact reversal");
  assert.throws(() => withBlocks(html, [{ entry: a, after: "#gone" }]), /no element inside/);
});

test("the Language Page route table carries each route's placement", () => {
  const e = hydrate(
    ROOT,
    readManifest(ROOT).videos.find((v) => v.brand === "languagepage"),
  );
  const text = routesModule([
    {
      ...e,
      pages: ["/access-practice-lab/x", { path: "/access-practice-lab/y/", after: ".a", up: 1 }],
    },
  ]);
  assert.match(text, /"\/access-practice-lab\/x": \{\s*"id": "[a-z0-9-]+"\s*\}/);
  assert.match(text, /"\/access-practice-lab\/y": \{[^}]*"after": "\.a",\s*"up": 1/);
});

test("placeCard honours `after` / `up` and falls back to the default spot", () => {
  const entry = hydrate(ROOT, readManifest(ROOT).videos[0]);
  const fresh = () => {
    const { document } = new JSDOM(
      '<div id="root"><h1>T</h1><p>lead</p><section><h2 id="h">H</h2></section><p id="tail">t</p></div>',
    ).window;
    return document.getElementById("root");
  };
  const next = (el) => el.nextElementSibling?.tagName;
  const a = fresh();
  assert.equal(placeCard(a, cardHtml(entry), { after: "#h" }).previousElementSibling.id, "h");
  const b = fresh();
  assert.equal(
    placeCard(b, cardHtml(entry), { after: "#h", up: 1 }).previousElementSibling.tagName,
    "SECTION",
  );
  const c = fresh();
  const warn = console.warn;
  console.warn = () => {};
  try {
    const card = placeCard(c, cardHtml(entry), { after: "#renamed" });
    assert.equal(card.previousElementSibling.tagName, "P", "default: under the title and lead");
    assert.equal(next(c.querySelector("h1")), "P");
  } finally {
    console.warn = warn;
  }
  const d = fresh();
  assert.equal(placeCard(d, cardHtml(entry)).previousElementSibling.textContent, "lead");
});

test("hubs group concept clips apart from full films", () => {
  const m = readManifest(ROOT);
  assert.ok(m.videos.some(isClip) && m.videos.some((v) => !isClip(v)));
  for (const brandId of Object.keys(BRANDS)) {
    const html = read(BRANDS[brandId].hubFile);
    const group = (kind) =>
      html.match(new RegExp(`data-kind="${kind}"[\\s\\S]*?</section>`))?.[0] ?? "";
    for (const v of videosFor(m, brandId))
      assert.ok(
        group(isClip(v) ? "clips" : "films").includes(`data-id="${v.id}"`),
        `${brandId} / ${v.id}`,
      );
  }
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
    [{ ...base, js: `${base.js}\ntrack.default = true;` }, /default only for a narrated/],
    [
      { ...base, markup: `${base.markup}<track kind="captions" default>` },
      /default only for a narrated/,
    ],
    [mutate("js", 't.mode = narrated ? "showing" : "disabled"', 't.mode = "showing"'), /disabled/],
    [mutate("js", 'track.kind = "captions"', 'track.kind = "subtitles"'), /captions <track>/],
    [mutate("js", "video.muted = !narrated", "video.muted = false"), /muted/],
    [mutate("js", /IntersectionObserver/g, "Nope"), /IntersectionObserver/],
    [mutate("js", /prefers-reduced-motion/g, "motion-pref"), /reduced-motion/],
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
    [
      { ...base, markup: `${base.markup}<p class="sv-note">Captions are on.</p>` },
      /no text under the video/,
    ],
    [mutate("markup", 'alt=""', 'alt="x" data-x'), /alt/],
    [mutate("markup", "sv-fallback-label", "sv-x"), /labelled link/],
  ];
  for (const [input, why] of cases) assert.match(componentProblems(input).join("\n"), why);
});
