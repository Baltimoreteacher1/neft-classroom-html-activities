#!/usr/bin/env node
/**
 * language-page-host.test.mjs — thelanguagepage.com serves the ACCESS lab and nothing else, and
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
import { brandLabHtml, languagePageRoute, SITEMAP_PATHS } from "./_lib/language-page.js";
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

await t("the root lands on the lab with a temporary redirect", () => {
  const r = at("https://thelanguagepage.com/");
  assert.equal(r.status, 302);
  assert.equal(r.location, "https://thelanguagepage.com/access-practice-lab/");
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
  for (const path of ["/language-adventures/", "/language-adventures/adventures/", "/language-adventures/_next/static/a.js"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  for (const path of ["/language-adventures", "/language-adventures-evil/"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "redirect", path);
});

await t("everything else goes to eduwonderlab.com, so the lab host is not a second copy of the site", () => {
  for (const path of [
    "/lessons/5-6/",
    "/curriculum/units/",
    "/teacher-tools/",
    "/access-teacher/predictive/",
    "/access-teacher/flight-deck/",
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

await t("the Teacher Hub is served on the lab host (behind the teacher gate); the predictor and Flight Deck are not", async () => {
  for (const path of ["/access-teacher/", "/access-teacher", "/access-teacher/teacher.js", "/access-teacher/class-panel.js"])
    assert.equal(at(`https://thelanguagepage.com${path}`).kind, "serve", path);
  const gated = await answer("https://thelanguagepage.com/access-teacher/", { SITE_PASSWORD: "x" });
  assert.equal(gated.res.status, 401, "the same teacher gate answers on the lab host");
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
    locs.every((l) => l.startsWith("https://thelanguagepage.com/access-practice-lab/") || STUDIOS.some((s) => l === `https://thelanguagepage.com${studioPath(s.slug)}`)),
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
  assert.match(out, /<title>The Language Page · ACCESS Practice Lab<\/title>/);
  assert.match(out, /<strong>The Language Page<\/strong><small>Powered by EduWonderLab<\/small>/);
  assert.match(out, /<link rel="canonical" href="https:\/\/thelanguagepage\.com\/access-practice-lab\/path" \/>/);
  assert.equal((out.match(/rel="canonical"/g) || []).length, 1);
  assert.equal(out.length > shell.length, true);
});

await t("the shell still carries the exact strings the rewrite targets, so a rename cannot silently disable it", () => {
  assert.ok(shell.includes("<title>ACCESS Practice Lab</title>"));
  assert.ok(shell.includes("<strong>ACCESS Practice Lab</strong><small>EduWonderLab</small>"));
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

console.log(`language-page-host: ${passed} checks passed.`);
