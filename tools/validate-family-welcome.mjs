#!/usr/bin/env node
/**
 * validate-family-welcome.mjs — guard for "A note from Mr. Neft", the optional
 * per-week welcome at the top of the family hub (/curriculum/family-connections/).
 *
 *   node tools/validate-family-welcome.mjs
 *
 * WHY A GATE. The welcome is a data file Joel edits by hand once a week, with a
 * phone video that families watch with the sound off, in a language that may not
 * be the one spoken. The failure that matters is silent: a video saved with an
 * English caption track and no Spanish one still plays, still looks finished, and
 * is useless to the parent it was recorded for. So:
 *
 *   1. SELF-TEST FIRST. The checker (curriculum/family-connections/shared/
 *      family-welcome.js) is run against known-bad fixtures — each must be
 *      refused — and known-good ones that must pass. A checker that stopped
 *      firing would otherwise report a clean file forever.
 *   2. THE FILE. data/family-welcome.json must satisfy the checker, and every
 *      video, caption and poster it names must exist on disk; a caption file
 *      must be WebVTT.
 *   3. THE WIRING. The hub reads the file through the shared one-request-per-file
 *      cache, loads that cache before its own module, and renders the note only
 *      through the checked path.
 *
 * No dependencies. Non-zero exit on any failure.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeWelcome,
  welcomeForWeek,
  welcomeProblems,
} from "../curriculum/family-connections/shared/family-welcome.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(resolve(root, path), "utf8");

/* ------------------------------------------------------------ 1. self-test */
const good = {
  en: "Welcome back. This week we compare rates.",
  es: "Bienvenidos de nuevo. Esta semana comparamos razones.",
};
const goodVideo = {
  src: "/curriculum/family-connections/welcome/2026-10-26.mp4",
  captions: {
    en: "/curriculum/family-connections/welcome/2026-10-26.en.vtt",
    es: "/curriculum/family-connections/welcome/2026-10-26.es.vtt",
  },
};
const file = (weeks, extra = {}) => ({ enabled: true, weeks, ...extra });
const MONDAY = "2026-10-26";

const mustPass = {
  "a disabled, empty file (the shipped state)": { enabled: false, weeks: {} },
  "an enabled file with no weeks": file({}),
  "a text-only note": file({ [MONDAY]: good }),
  "a note with a fully captioned video": file({ [MONDAY]: { ...good, video: goodVideo } }),
  "a captioned video with a poster": file({
    [MONDAY]: {
      ...good,
      video: { ...goodVideo, poster: "/curriculum/family-connections/welcome/p.jpg" },
    },
  }),
};
const mustFail = {
  "a video with no captions at all": file({ [MONDAY]: { ...good, video: { src: goodVideo.src } } }),
  "a video with English captions only": file({
    [MONDAY]: { ...good, video: { ...goodVideo, captions: { en: goodVideo.captions.en } } },
  }),
  "a video with Spanish captions only": file({
    [MONDAY]: { ...good, video: { ...goodVideo, captions: { es: goodVideo.captions.es } } },
  }),
  "a video with a third caption language": file({
    [MONDAY]: {
      ...good,
      video: { ...goodVideo, captions: { ...goodVideo.captions, ar: "/x.vtt" } },
    },
  }),
  "captions that are not .vtt": file({
    [MONDAY]: { ...good, video: { ...goodVideo, captions: { en: "/a.txt", es: "/b.txt" } } },
  }),
  "a remote video URL": file({
    [MONDAY]: { ...good, video: { ...goodVideo, src: "https://example.com/v.mp4" } },
  }),
  "a protocol-relative video URL": file({
    [MONDAY]: { ...good, video: { ...goodVideo, src: "//example.com/v.mp4" } },
  }),
  "a video path that climbs out with ..": file({
    [MONDAY]: { ...good, video: { ...goodVideo, src: "/welcome/../../secret.mp4" } },
  }),
  "an English-only note": file({ [MONDAY]: { en: good.en } }),
  "a Spanish-only note": file({ [MONDAY]: { es: good.es } }),
  "Spanish that is a copy of the English": file({ [MONDAY]: { en: good.en, es: good.en } }),
  "a week key that is not a Monday": file({ "2026-10-27": good }),
  "a week key that is not a date": file({ "next-week": good }),
  "an unknown note field": file({ [MONDAY]: { ...good, french: "Bonjour" } }),
  "an unknown top-level field": file({}, { fr: {} }),
  "a non-boolean enabled": { enabled: "yes", weeks: {} },
  "a missing weeks object": { enabled: true },
  "a note over the length limit": file({ [MONDAY]: { en: "x".repeat(601), es: "y".repeat(601) } }),
  "a file that is not an object": [],
};
for (const [name, data] of Object.entries(mustPass))
  if (welcomeProblems(data).length)
    fail(`self-test: ${name} was refused: ${welcomeProblems(data).join("; ")}`);
for (const [name, data] of Object.entries(mustFail))
  if (!welcomeProblems(data).length) fail(`self-test: ${name} was ACCEPTED`);

// The browser must never show what the gate refuses, and must never throw on it.
for (const [name, data] of Object.entries(mustFail)) {
  let shown;
  try {
    shown = normalizeWelcome(data);
  } catch (error) {
    fail(`self-test: normalizeWelcome threw on ${name}: ${error.message}`);
    continue;
  }
  for (const note of Object.values(shown.weeks)) {
    const captions = note.video?.captions;
    if (note.video && !(captions?.en && captions?.es))
      fail(`self-test: normalizeWelcome would SHOW a video without both captions (${name})`);
    if (!(note.en && note.es))
      fail(`self-test: normalizeWelcome would show a one-language note (${name})`);
  }
}
if (welcomeForWeek(normalizeWelcome(file({ [MONDAY]: good })), MONDAY)?.en !== good.en)
  fail("self-test: welcomeForWeek no longer finds a valid note");
if (welcomeForWeek(normalizeWelcome({ enabled: false, weeks: { [MONDAY]: good } }), MONDAY))
  fail("self-test: a DISABLED file still shows a note");
if (welcomeForWeek(normalizeWelcome(file({ [MONDAY]: good })), "2026-11-02"))
  fail("self-test: a week with no entry shows a note (the hub must render nothing)");

/* ------------------------------------------------------------- 2. the file */
const DATA = "data/family-welcome.json";
let data = null;
try {
  data = JSON.parse(read(DATA));
} catch (error) {
  fail(`${DATA} cannot be read as JSON: ${error.message}`);
}
let notes = 0;
let videos = 0;
if (data) {
  for (const problem of welcomeProblems(data)) fail(`${DATA}: ${problem}`);
  for (const [week, note] of Object.entries(data.weeks ?? {})) {
    notes += 1;
    if (!note?.video) continue;
    videos += 1;
    const files = [
      note.video.src,
      note.video.captions?.en,
      note.video.captions?.es,
      note.video.poster,
    ].filter(Boolean);
    for (const path of files)
      if (!existsSync(resolve(root, `.${path}`)))
        fail(`${DATA}: weeks["${week}"] names ${path}, which is not in the repo`);
    for (const lang of ["en", "es"]) {
      const path = note.video.captions?.[lang];
      if (path && existsSync(resolve(root, `.${path}`)) && !read(`.${path}`).startsWith("WEBVTT"))
        fail(`${DATA}: ${path} is not a WebVTT file (it must start with WEBVTT)`);
    }
  }
}

/* ----------------------------------------------------------- 3. the wiring */
const html = read("curriculum/family-connections/index.html");
const app = read("curriculum/family-connections/family-app.js");
const hub = read("curriculum/family-connections/shared/homework-hub.js");
const panels = read("curriculum/family-connections/shared/hub-panels.js");
const cacheAt = html.indexOf("/assets/curriculum-json-cache.js");
const moduleAt = html.indexOf('src="./family-app.js"');
if (cacheAt < 0 || moduleAt < 0 || cacheAt > moduleAt)
  fail(
    "family-connections/index.html must load /assets/curriculum-json-cache.js BEFORE family-app.js",
  );
if (!/NTJsonCache\??\.json\(\s*["']\/data\/family-welcome\.json["']/.test(app))
  fail("family-app.js must read /data/family-welcome.json through window.NTJsonCache");
if (!/normalizeWelcome\(/.test(app))
  fail("family-app.js must pass the welcome file through normalizeWelcome()");
if (!/welcomeForWeek\(/.test(hub))
  fail("homework-hub.js must find the note through welcomeForWeek()");
if (/innerHTML|insertAdjacentHTML/.test(panels))
  fail("hub-panels.js sets HTML; the welcome note is data and must go in as text");
if (
  !/preload["'],\s*["']none/.test(panels) ||
  !/playsinline/.test(panels) ||
  !/kind["'],\s*["']captions/.test(panels)
)
  fail(
    'hub-panels.js must render <video controls preload="none" playsinline> with <track kind="captions">',
  );

if (failures.length) {
  console.error(`family-welcome validation FAILED (${failures.length} problem(s)):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `family-welcome validation PASS ✅ (${Object.keys(mustFail).length} bad fixtures refused, ${Object.keys(mustPass).length} good accepted; ${notes} note(s), ${videos} video(s), enabled=${data?.enabled})`,
);
