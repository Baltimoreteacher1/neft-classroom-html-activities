#!/usr/bin/env node
/**
 * language-page-host.test.mjs — thelanguagepage.com serves Language Adventures and ACCESS lab, and
 * adding it changes nothing about what eduwonderlab.com answers.
 *
 * Two promises, both about boundaries:
 *   1. The lab host never becomes a second copy of the whole site (lessons, curriculum, teacher tools),
 *      and its robots.txt / sitemap.xml name its own host, not eduwonderlab.com.
 *   2. Every eduwonderlab.com URL answers exactly as before. The route contract pins that for the
 *      paths it lists; this pins the new code path itself, including the lab URLs the migration will
 *      eventually redirect (they must still be served here until progress has moved).
 *
 * Drives the real onRequest with no credentials.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  brandLabHtml,
  brandLabResponse,
  hubTitle,
  languagePageRoute,
  OG_IMAGE_PATH,
  shareMeta,
  SITEMAP_PATHS,
  setNoTransform,
} from "./_lib/language-page.js";
import { onRequest } from "./_middleware.js";
import { STUDIOS, studioPath } from "../access-practice-lab/src/studios.js";

let passed = 0;
const t = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};

/** The middleware's own answer for a URL, or "next" when it fell through to the site. */
async function answer(url, env = {}) {
  let fell = false;
  const res = await onRequest({
    request: new Request(url),
    env,
    data: {},
    next: async () => {
      fell = true;
      return new Response("site", { status: 200 });
    },
    functionPath: "",
    params: {},
    waitUntil() {},
  });
  return { fell, res };
}
const at = (u) => languagePageRoute(new URL(u));

await t("Teacher Hub pages are titled as the teacher area of The Language Page", () => {
  assert.equal(
    hubTitle("<title>ACCESS Practice Lab — Teacher Hub</title>"),
    "<title>Teacher Hub · The Language Page</title>",
  );
  assert.equal(
    hubTitle("<title>WIDA Data Intelligence Studio — Teacher Hub</title>"),
    "<title>WIDA Data Intelligence Studio · Teacher Hub · The Language Page</title>",
  );
  assert.equal(
    hubTitle("<title>Sheet &amp; Card Maker — ACCESS Teacher Hub</title>"),
    "<title>Sheet &amp; Card Maker · Teacher Hub · The Language Page</title>",
  );
  assert.equal(hubTitle("<title>Listening practice</title>"), "<title>Listening practice</title>");
});

await t("lab and studio pages carry share tags, and the share card they name is a real 1200x630 PNG", () => {
  const og = (html, p) => new RegExp(`<meta property="${p}" content="([^"]*)"`).exec(html)?.[1];
  const labShell = readFileSync(new URL("../access-practice-lab/index.html", import.meta.url), "utf8");
  const lab = brandLabHtml(labShell, "/access-practice-lab/path");
  assert.equal(og(lab, "og:title"), "The Language Page · English for school, in your language, K–8");
  assert.equal(og(lab, "og:image"), `https://thelanguagepage.com${OG_IMAGE_PATH}`);
  assert.equal(og(lab, "og:image:width"), "1200");
  assert.equal(og(lab, "og:image:height"), "630");
  assert.ok(og(lab, "og:description").length > 40, "the share description is empty");
  assert.match(lab, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.equal((lab.match(/property="og:image"/g) || []).length, 1, "og:image must appear once");
  // the studios keep their own page description in the share text
  const studio = brandLabHtml(
    '<html><head><meta name="description" content="Original WIDA ACCESS-style Listening practice. Practice only, not an official test."><title>x</title></head><body></body></html>',
    "/wida-access/listening/",
  );
  assert.equal(og(studio, "og:image"), `https://thelanguagepage.com${OG_IMAGE_PATH}`);
  assert.match(og(studio, "og:description"), /^Original WIDA ACCESS-style Listening practice/);
  assert.match(og(studio, "og:title"), /· The Language Page$/);
  // a page that already sets og:image is left alone; a quote in a title cannot break the attribute
  assert.equal(shareMeta('<meta property="og:image" content="x"><title>t</title>'), "");
  assert.ok(!/content="[^"]*"[^>]*"[^"]*" \/>/.test(shareMeta('<title>say "hi"</title>').split("\n")[1]));
  // the file the tags point to exists and is the size the tags say
  const png = readFileSync(new URL(`../${OG_IMAGE_PATH.slice(1)}`, import.meta.url));
  assert.equal(png.readUInt32BE(0), 0x89504e47, "the share card is not a PNG");
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
});

await t("lab-host HTML is marked no-transform so Cloudflare cannot inject its analytics beacon", async () => {
  const page = (cc) =>
    new Response("<html><head><title>ACCESS Practice Lab</title></head></html>", {
      headers: { "content-type": "text/html; charset=utf-8", ...(cc ? { "cache-control": cc } : {}) },
    });
  for (const cc of [undefined, "no-store", "public, max-age=60"]) {
    const res = await brandLabResponse(page(cc), new URL("https://thelanguagepage.com/access-practice-lab/"));
    assert.match(res.headers.get("cache-control"), /(^|,)\s*no-transform\s*(,|$)/i);
    if (cc) assert.ok(res.headers.get("cache-control").startsWith(cc), "the existing directive survives");
  }
  // idempotent
  const h = new Headers({ "cache-control": "no-store, no-transform" });
  setNoTransform(h);
  assert.equal(h.get("cache-control"), "no-store, no-transform");
  // other hosts and non-HTML are untouched
  const other = await brandLabResponse(page("no-store"), new URL("https://eduwonderlab.com/lessons/1-1/"));
  assert.equal(other.headers.get("cache-control"), "no-store");
  const json = new Response("{}", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const j = await brandLabResponse(json, new URL("https://thelanguagepage.com/api/class/x"));
  assert.equal(j.headers.get("cache-control"), "no-store");
});

await t("only thelanguagepage.com and www.thelanguagepage.com are lab hosts", () => {
  assert.equal(at("https://eduwonderlab.com/"), null);
  assert.equal(at("https://www.eduwonderlab.com/"), null);
  assert.equal(at("https://eduwonderlab-xyz.pages.dev/"), null);
  assert.equal(at("https://thelanguagepage.com.evil.example/"), null);
  assert.equal(at("https://notthelanguagepage.com/"), null);
  assert.ok(at("https://thelanguagepage.com/"));
  assert.ok(at("https://www.thelanguagepage.com/"));
});

await t("www redirects to the apex with 308, keeping path and query", () => {
  const r = at("https://www.thelanguagepage.com/access-practice-lab/path?x=1");
  assert.deepEqual(r, {
    kind: "redirect",
    status: 308,
    location: "https://thelanguagepage.com/access-practice-lab/path?x=1",
  });
});

await t("Language Page library and letter short routes open their ACCESS Lab destinations", () => {
  assert.deepEqual(at("https://thelanguagepage.com/library?grades=6-8"), {
    kind: "redirect",
    status: 302,
    location: "https://thelanguagepage.com/access-practice-lab/library?grades=6-8",
  });
  assert.deepEqual(at("https://thelanguagepage.com/letters/a?grades=3-5"), {
    kind: "redirect",
    status: 302,
    location: "https://thelanguagepage.com/access-practice-lab/reading-path/letters/a?grades=3-5",
  });
});

await t("the root lands on the lab with a temporary redirect", () => {
  const r = at("https://thelanguagepage.com/");
  assert.equal(r.status, 302);
  assert.equal(r.location, "https://thelanguagepage.com/access-practice-lab/");
});

await t("/access-prep redirects to the lab's Access Prep hub, keeping queries", () => {
  const r = at("https://thelanguagepage.com/access-prep?grades=6-8");
  assert.equal(r.status, 302);
  assert.equal(r.location, "https://thelanguagepage.com/access-practice-lab/access-prep?grades=6-8");
});

await t("Activity Studio addresses redirect into the lab: /activity-studio and a shared /do/<id> link", () => {
  const studio = at("https://thelanguagepage.com/activity-studio/mine");
  assert.equal(studio.kind, "redirect");
  assert.equal(studio.location, "https://thelanguagepage.com/access-practice-lab/activity-studio/mine");
  const link = at("https://thelanguagepage.com/do/s0a1b2c3d4e?x=1");
  assert.equal(link.location, "https://thelanguagepage.com/access-practice-lab/do/s0a1b2c3d4e?x=1");
  // Other unknown paths still leave for eduwonderlab.com, so only the studio's own addresses are claimed.
  assert.equal(at("https://thelanguagepage.com/do/../etc").status, 308);
});

await t("/twr and its sets redirect into the lab, keeping queries", () => {
  const hub = at("https://thelanguagepage.com/twr?grades=2-3");
  assert.equal(hub.status, 302);
  assert.equal(hub.location, "https://thelanguagepage.com/access-practice-lab/twr?grades=2-3");
  const set = at("https://thelanguagepage.com/twr/because-but-so/g35-because-but-so-1/");
  assert.equal(set.location, "https://thelanguagepage.com/access-practice-lab/twr/because-but-so/g35-because-but-so-1");
});

await t("everything the lab loads is served on the lab host", () => {
  for (const path of [
    "/access-practice-lab/",
    "/access-practice-lab",
    "/access-practice-lab/path",
    "/access-practice-lab/src/lang/dna.js",
    "/assets/mobile-access.css",
    "/assets/fonts/fraunces-175f6e93.woff2",
    "/shared/save-resume/save-resume-engine.js",
    "/data/anything.json",
    "/family-app/home-link.js",
    "/api/signal",
    "/api/class/join",
    "/api/class/room/state",
    "/cdn-cgi/scripts/x.js",
  ])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
});

await t("the Language adventures app is served on the lab host, and a look-alike prefix is not", () => {
  for (const path of ["/language-adventures/", "/language-adventures/adventures/", "/language-adventures/mystery-club/", "/language-adventures/mystery-club/stories.js", "/language-adventures/_next/static/a.js"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  for (const path of ["/language-adventures", "/language-adventures-evil/"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "redirect", path);
});

await t("the Language Studio app is served on the lab host, and a look-alike prefix is not", () => {
  for (const path of ["/language-studio/", "/language-studio/adventures/word-forge/wf-01/", "/language-studio/_next/static/a.js"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  for (const path of ["/language-studio", "/language-studio-evil/"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "redirect", path);
});

await t("the Learning Studios landing page is served on the lab host, and a look-alike prefix is not", () => {
  for (const path of ["/learning-studios/", "/learning-studios/index.html"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  for (const path of ["/learning-studios", "/learning-studios-evil/"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "redirect", path);
});

await t("the Graphic Novels are not on the lab host: they go to eduwonderlab.com", () => {
  for (const path of ["/graphic-novels/", "/graphic-novels/unit1/graphic-novel-1.html", "/graphic-novels"])
    assert.equal(at(`https://thelanguagepage.com${path}`).location, `https://eduwonderlab.com${path}`, path);
});

await t("everything else goes to eduwonderlab.com, so the lab host is not a second copy of the site", () => {
  for (const path of [
    "/lessons/5-6/",
    "/curriculum/units/",
    "/teacher-tools/",
    "/access-teacher-evil/",
    "/api/pacing/days",
    "/family-app/",
    "/access-practice-lab-evil/",
  ]) {
    const r = at(`https://thelanguagepage.com${path}?q=1`);
    assert.equal(r.kind, "redirect", path);
    assert.equal(r.status, 308, path);
    assert.equal(r.location, `https://eduwonderlab.com${path}?q=1`, path);
  }
});

await t("the Teacher Hub and WIDA Data Studio are served on the lab host with no password", async () => {
  for (const path of ["/access-teacher/", "/access-teacher", "/access-teacher/teacher.js", "/access-teacher/class-panel.js", "/access-teacher/predictive/", "/access-teacher/predictive/app.js"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  for (const path of ["/access-teacher/", "/access-teacher/predictive/", "/access-practice-lab/teacher"]) {
    const open = await answer(`https://thelanguagepage.com${path}`, { SITE_PASSWORD: "x" });
    assert.ok(open.fell, `${path} is served without a password on the lab host`);
    assert.notEqual(open.res.status, 401, path);
  }
});

await t("robots.txt and sitemap.xml are generated for the lab host and name only that host", async () => {
  const robots = await answer("https://thelanguagepage.com/robots.txt");
  assert.equal(robots.fell, false);
  const text = await robots.res.text();
  assert.match(text, /Sitemap: https:\/\/thelanguagepage\.com\/sitemap\.xml/);
  assert.doesNotMatch(text, /eduwonderlab/);
  const sitemap = await answer("https://thelanguagepage.com/sitemap.xml");
  assert.match(sitemap.res.headers.get("content-type"), /xml/);
  const xml = await sitemap.res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, SITEMAP_PATHS.length);
  assert.ok(
    locs.every(
      (l) =>
        l.startsWith("https://thelanguagepage.com/access-practice-lab/") ||
        l.startsWith("https://thelanguagepage.com/studios/") ||
        l === "https://thelanguagepage.com/bcpss-teachers" ||
        l === "https://thelanguagepage.com/bcpss-teachers/insights" ||
        l === "https://thelanguagepage.com/bcpss-teachers/pathways" ||
        l === "https://thelanguagepage.com/family/bcpss" ||
        STUDIOS.some((s) => l === `https://thelanguagepage.com${studioPath(s.slug)}`),
    ),
  );
  assert.ok(!locs.some((l) => l === "https://thelanguagepage.com/wida-access/"));
  assert.ok(locs.includes("https://thelanguagepage.com/access-practice-lab/portfolio"));
  assert.ok(!locs.some((l) => l.includes("portfolio?")), "stateful family view is not a separate sitemap URL");
});

await t("the middleware redirects a non-lab path on the lab host before any gate runs", async () => {
  const { fell, res } = await answer("https://thelanguagepage.com/lessons/1-1/", { SITE_PASSWORD: "x" });
  assert.equal(fell, false);
  assert.equal(res.status, 308);
  assert.equal(res.headers.get("location"), "https://eduwonderlab.com/lessons/1-1/");
  assert.equal(res.headers.get("cache-control"), "no-store");
});

await t("the lab root redirect is cacheable so a return visit skips the hop", async () => {
  const { fell, res } = await answer("https://thelanguagepage.com/");
  assert.equal(fell, false);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://thelanguagepage.com/access-practice-lab/");
  assert.equal(res.headers.get("cache-control"), "public, max-age=3600");
});

await t("lab pages on the lab host fall through to the site", async () => {
  const { fell, res } = await answer("https://thelanguagepage.com/access-practice-lab/path");
  assert.equal(fell, true);
  assert.equal(res.status, 200);
});

await t("eduwonderlab.com is untouched: lab URLs are served, not redirected, and robots.txt falls through", async () => {
  for (const path of ["/access-practice-lab/", "/access-practice-lab/path", "/robots.txt", "/sitemap.xml", "/lessons/5-6/"]) {
    const { fell, res } = await answer(`https://eduwonderlab.com${path}`);
    assert.equal(fell, true, path);
    assert.equal(res.status, 200, path);
  }
  const teacher = await answer("https://eduwonderlab.com/access-teacher/predictive/", { SITE_PASSWORD: "x" });
  assert.equal(teacher.res.status, 401, "the teacher gate still answers 401 on the legacy host");
});

const shell = readFileSync(new URL("../access-practice-lab/index.html", import.meta.url), "utf8");

await t("the lab host's HTML names The Language Page, powered by EduWonderLab, with its own canonical", () => {
  const out = brandLabHtml(shell, "/access-practice-lab/path");
  assert.ok(/<title>(ELL Lab|ACCESS Practice Lab)<\/title>/.test(shell));
  // One name and one plain promise (Joel, 2026-11-24); "ACCESS Practice Lab" is a section, not the site's title.
  assert.ok(out.includes("<title>The Language Page · English for school, in your language, K–8</title>"));
  assert.ok(!/<title>[^<]*ACCESS Practice Lab[^<]*<\/title>/.test(out), "the site title may not be ACCESS Practice Lab");
  assert.match(out, /<strong>The Language Page<\/strong><small>English for school, in your language, K–8<\/small>/);
  assert.match(out, /<link rel="canonical" href="https:\/\/thelanguagepage\.com\/access-practice-lab\/path" \/>/);
  assert.equal((out.match(/rel="canonical"/g) || []).length, 1);
  assert.equal(out.length > shell.length, true);
});

await t("the shell still carries the exact strings the rewrite targets, so a rename cannot silently disable it", () => {
  assert.match(shell, /<title>(ELL Lab|ACCESS Practice Lab)<\/title>/);
  assert.match(shell, /<strong>(ELL Lab|ACCESS Practice Lab)<\/strong><small>EduWonderLab<\/small>/);
  assert.ok(shell.includes("</head>"));
});

await t("the middleware brands lab HTML on the lab host only", async () => {
  const run = async (url) => {
    const res = await onRequest({
      request: new Request(url),
      env: {},
      data: {},
      next: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }),
      functionPath: "",
      params: {},
      waitUntil() {},
    });
    return res.text();
  };
  assert.match(await run("https://thelanguagepage.com/access-practice-lab/"), /The Language Page/);
  const legacy = await run("https://eduwonderlab.com/access-practice-lab/");
  assert.equal(legacy, shell, "eduwonderlab.com gets the shell byte for byte");
});

await t("the WIDA practice studios are served on the lab host; the score dashboard and the gradebook are not", () => {
  assert.equal(STUDIOS.length, 7);
  for (const st of STUDIOS) {
    assert.equal(at(`https://thelanguagepage.com${studioPath(st.slug)}`).kind, "serve", st.slug);
    assert.ok(readFileSync(new URL(`..${studioPath(st.slug)}index.html`, import.meta.url)), st.slug);
  }
  for (const path of ["/wida-access/", "/wida-access", "/wida-access/portfolio/", "/wida-access/listening-v2/", "/wida-access/listening-evil/"]) {
    const r = at(`https://thelanguagepage.com${path}`);
    assert.equal(r.kind, "redirect", path);
    assert.equal(r.location, `https://eduwonderlab.com${path}`, path);
  }
});

await t("every studio page is re-dressed in the lab's chrome and keeps its own work and Save/Resume", () => {
  for (const st of STUDIOS) {
    const path = studioPath(st.slug);
    const src = readFileSync(new URL(`..${path}index.html`, import.meta.url), "utf8");
    const out = brandLabHtml(src, path);
    assert.equal((out.match(/class="lp-top"/g) || []).length, 1, `${st.slug}: one lab top bar`);
    assert.match(out, new RegExp(`<title>${st.title} · The Language Page</title>`), st.slug);
    assert.match(out, new RegExp(`<link rel="canonical" href="https://thelanguagepage\\.com${path}" />`), st.slug);
    assert.match(out, /href="\/access-practice-lab\/studio-chrome\.css"/, st.slug);
    assert.doesNotMatch(out, /Neft Hub|WIDA Center/, `${st.slug}: old chrome gone`);
    assert.doesNotMatch(out, /href="\/wida-access\/"|href="\/"/, `${st.slug}: no link to the dashboard or the site root`);
    assert.doesNotMatch(out, /math-workbench-launcher|formula-popup|edupulse-/, `${st.slug}: no math tools or score bridge`);
    assert.doesNotMatch(out, /class="top-nav"|class="breadcrumb"/, `${st.slug}: old header removed`);
    assert.match(out, /save-resume-engine\.js/, `${st.slug}: Save/Resume kept`);
    assert.ok(out.indexOf('class="lp-top"') > out.indexOf("<body"), `${st.slug}: chrome inside body`);
    assert.ok(out.indexOf("lp-studio-theme") < out.indexOf("</head>"), `${st.slug}: theme in head`);
  }
});

await t("eduwonderlab.com serves the studios byte for byte", async () => {
  const path = studioPath(STUDIOS[0].slug);
  const page = readFileSync(new URL(`..${path}index.html`, import.meta.url), "utf8");
  const res = await onRequest({
    request: new Request(`https://eduwonderlab.com${path}`),
    env: {},
    data: {},
    next: async () => new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } }),
    functionPath: "",
    params: {},
    waitUntil() {},
  });
  assert.equal(await res.text(), page);
});

await t("the Family Tour is thelanguagepage.com only: other hosts are sent to their own Family Corner", async () => {
  for (const host of ["eduwonderlab.com", "preview.eduwonderlab.pages.dev"]) {
    for (const path of ["/access-practice-lab/family-tour/", "/access-practice-lab/family-tour", "/access-practice-lab/Family-Tour/picks.json"]) {
      const { fell, res } = await answer(`https://${host}${path}`);
      assert.equal(fell, false, `${host}${path} must not reach the tour`);
      assert.equal(res.status, 302);
      assert.equal(res.headers.get("location"), `https://${host}/access-practice-lab/family`);
    }
  }
  const lab = await answer("https://thelanguagepage.com/access-practice-lab/family-tour/");
  assert.equal(lab.fell, true, "the lab host serves the tour");
  assert.ok(SITEMAP_PATHS.includes("/access-practice-lab/family-tour/"));
  const old = await answer("https://thelanguagepage.com/access-family-tour/");
  assert.equal(old.res.headers.get("location"), "https://thelanguagepage.com/access-practice-lab/family-tour/");
  const other = await answer("https://eduwonderlab.com/access-family-tour/");
  assert.equal(other.fell, true, "eduwonderlab.com keeps its own Family Expedition page");
});

await t("the BCPSS Teachers Hub, shared plan routes, family cards, insights, and APIs are served on the lab host", async () => {
  for (const path of [
    "/bcpss-teachers",
    "/bcpss-teachers/",
    "/bcpss-teachers/plan/abc123",
    "/bcpss-teachers/insights",
    "/bcpss-teachers/pathways",
    "/family/bcpss",
    "/family/bcpss/g6-math-u2?lang=es",
    "/api/bcpss/units?grade=6&subject=Math",
    "/api/bcpss/pathways?grade=6",
    "/api/bcpss/family-guide/g6-math-u2",
    "/api/bcpss/deconstruct",
    "/api/bcpss/telemetry",
    "/api/bcpss/insights",
    "/api/public/bcpss-bridge?grade=6&subject=Math&unit=2",
  ]) {
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  }
  assert.ok(SITEMAP_PATHS.includes("/bcpss-teachers"));
  assert.ok(SITEMAP_PATHS.includes("/bcpss-teachers/insights"));
  assert.ok(SITEMAP_PATHS.includes("/bcpss-teachers/pathways"));
  assert.ok(SITEMAP_PATHS.includes("/family/bcpss"));
  for (const path of ["/bcpss-teachers/plan/abc123", "/bcpss-teachers/insights", "/family/bcpss/g6-math-u2?lang=es"]) {
    const open = await answer(`https://thelanguagepage.com${path}`, {
      SITE_PASSWORD: "x",
    });
    assert.ok(open.fell, `${path} is served without a password on the lab host`);
    assert.notEqual(open.res.status, 401);
  }
});

await t("the presented tour and its live room are served on the lab host; look-alike paths are not", () => {
  for (const path of ["/tour", "/tour/", "/tour/join/?r=ABCDE", "/tour/stops.js", "/api/tour-room/state?code=ABCDE", "/api/tour-room/open"])
    assert.deepEqual(at(`https://thelanguagepage.com${path}`), { kind: "serve" }, path);
  for (const path of ["/tourist", "/tours/", "/api/tour-roomx/state"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "redirect", `${path} must go to eduwonderlab.com`);
});

await t("lab-host HTML asks the Workers runtime to compress it (no-transform stops Cloudflare's edge doing it)", async () => {
  // Measured 2026-11-27: the lab shell went out as 208,906 bytes on thelanguagepage.com, 30,646 on eduwonderlab.com.
  // A Content-Encoding header with encodeBody "automatic" (the default) makes workerd encode for the visitor's real
  // Accept-Encoding; a pre-compressed body ("manual") would send gzip to a client that cannot read it.
  const html = "<html><head><title>ACCESS Practice Lab</title></head><body>hello</body></html>";
  const page = (headers = {}) =>
    new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...headers } });
  const url = new URL("https://thelanguagepage.com/access-practice-lab/");
  const res = await brandLabResponse(page(), url);
  assert.equal(res.headers.get("content-encoding"), "gzip");
  assert.equal(res.headers.get("vary"), "Accept-Encoding");
  assert.match(res.headers.get("cache-control"), /no-transform/);
  assert.equal(await res.text(), brandLabHtml(html, url.pathname), "the body is the branded page; the runtime encodes it");
  const varied = await brandLabResponse(page({ vary: "Origin" }), url);
  assert.equal(varied.headers.get("vary"), "Origin, Accept-Encoding");
  const already = await brandLabResponse(page({ vary: "accept-encoding" }), url);
  assert.equal(already.headers.get("vary"), "accept-encoding", "Vary is not doubled");
  // other hosts, non-HTML and errors are untouched
  const other = await brandLabResponse(page(), new URL("https://eduwonderlab.com/access-practice-lab/"));
  assert.equal(other.headers.get("content-encoding"), null);
  const js = await brandLabResponse(new Response("x", { headers: { "content-type": "application/javascript" } }), url);
  assert.equal(js.headers.get("content-encoding"), null);
  const gone = await brandLabResponse(new Response("no", { status: 404, headers: { "content-type": "text/html" } }), url);
  assert.equal(gone.headers.get("content-encoding"), null);
  // never a pre-compressed body: that would reach clients that sent `identity`
  const src = readFileSync(new URL("./_lib/language-page.js", import.meta.url), "utf8");
  assert.ok(!/encodeBody:\s*["']manual/.test(src) && !/CompressionStream/.test(src), "lab HTML must not be pre-compressed");
});

console.log(`language-page-host: ${passed} checks passed.`);
