/**
 * Studio videos: the ONE definition of the manifest contract (data/studio-videos.json).
 *
 * Read by the generator (scripts/generate-studio-videos.mjs), the validator
 * (tools/validate-studio-videos.mjs) and, from another repository, by the motion
 * studio's `publish:site` command, which imports this file from its CLASSROOM_REPO
 * checkout before it writes an entry. There is no second copy of the rules.
 *
 * Pure: no network, no DOM. File checks only run when a `root` is passed.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { clock } from "../../assets/studio-video/studio-video-markup.mjs";

export { clock };

export const MANIFEST_PATH = "data/studio-videos.json";
export const ASSET_DIR = "assets/studio-videos";
export const LAB_BASE = "/access-practice-lab";

/**
 * The Language Page half (its app routes, its hub, thelanguagepage.com) is held back: it needs changes under
 * access-practice-lab/ and functions/ that have not shipped. While false, the languagepage brand and every
 * /access-practice-lab/ page are rejected, and the generator writes nothing under access-practice-lab/.
 * The held-back pieces are saved as claude-motion-studio/docs/site-integration-language-page.patch,
 * which flips this to true.
 */
export const LAB_ENABLED = false;

/** brand id (as the studio names it) -> where that brand's videos are listed. */
export const BRANDS = Object.freeze({
  eduwonderlab: {
    name: "EduWonderLab",
    hubPath: "/videos/",
    hubFile: "videos/index.html",
    site: "eduwonderlab.com",
    enabled: true,
  },
  languagepage: {
    name: "The Language Page",
    hubPath: `${LAB_BASE}/videos/`,
    hubFile: "access-practice-lab/videos/index.html",
    site: "thelanguagepage.com",
    enabled: LAB_ENABLED,
  },
});

export const MAX_MP4_BYTES = 20 * 1024 * 1024; // Cloudflare Pages: 25 MiB per file; keep headroom.
export const MAX_POSTER_BYTES = 150 * 1024;

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE = /^\/[a-z0-9._~\-/]*$/;
const ENTRY_KEYS = [
  "id",
  "brand",
  "title",
  "description",
  "mp4",
  "poster",
  "vtt",
  "durationSec",
  "width",
  "height",
  "pages",
];

/** "/math" and "/math/" are one page; "/" stays "/". */
export function normalizePage(page) {
  return page.length > 1 ? page.replace(/\/+$/, "") : page;
}

export const isLabRoute = (page) =>
  normalizePage(page) === LAB_BASE || page.startsWith(`${LAB_BASE}/`);

/** The three files every entry owns, derived from its id (single naming rule). */
export function assetPaths(id) {
  const base = `/${ASSET_DIR}/${id}`;
  return { mp4: `${base}/${id}.mp4`, poster: `${base}/poster.jpg`, vtt: `${base}/${id}.vtt` };
}

/** Static page file for a mapped path (`/math/` -> `math/index.html`). */
export function pageFile(page) {
  const clean = normalizePage(page);
  return clean === "/" ? "index.html" : `${clean.slice(1)}/index.html`;
}

/* ------------------------------------------------------------------ WebVTT */

const TIME = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})\.(\d{3})$/;
const toSeconds = (stamp) => {
  const m = TIME.exec(stamp);
  if (!m) return Number.NaN;
  return Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
};

/**
 * Parse WebVTT into `{start, end, text}` cues. Throws on anything a browser would drop:
 * missing header, bad timestamps, end <= start, cues out of order, empty text.
 */
export function parseVtt(source) {
  const lines = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  if (!/^WEBVTT(?:[ \t].*)?$/.test(lines[0] || "")) throw new Error("missing WEBVTT header");
  const cues = [];
  let i = 1;
  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i += 1;
      continue;
    }
    let timing = lines[i];
    if (!timing.includes("-->")) {
      // An identifier line precedes the timing line.
      i += 1;
      timing = lines[i] ?? "";
    }
    const m = /^(\S+)\s+-->\s+(\S+)/.exec(timing);
    if (!m) throw new Error(`line ${i + 1}: expected "start --> end", got "${timing}"`);
    const start = toSeconds(m[1]);
    const end = toSeconds(m[2]);
    if (Number.isNaN(start) || Number.isNaN(end))
      throw new Error(`line ${i + 1}: bad timestamp in "${timing}"`);
    if (end <= start) throw new Error(`line ${i + 1}: cue ends before it starts`);
    if (cues.length && start < cues[cues.length - 1].start)
      throw new Error(`line ${i + 1}: cue starts before the previous one`);
    i += 1;
    const text = [];
    while (i < lines.length && lines[i].trim() !== "") text.push(lines[i++]);
    const joined = text
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!joined) throw new Error(`line ${i}: cue has no text`);
    cues.push({ start, end, text: joined });
  }
  if (!cues.length) throw new Error("no cues");
  return cues;
}

/* ---------------------------------------------------------------- manifest */

export function readManifest(root) {
  return JSON.parse(readFileSync(join(root, MANIFEST_PATH), "utf8"));
}

/**
 * Return a list of problems (empty = valid). With `root`, also checks that every referenced file
 * exists, the VTT parses, sizes are within budget and each mapped static page exists.
 * `isTeacherSurface(path)` is optional: mapped pages may never be teacher-gated.
 */
export function validateManifest(manifest, { root = null, isTeacherSurface = null } = {}) {
  const problems = [];
  const add = (where, msg) => problems.push(`${where}: ${msg}`);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    return ["manifest must be an object"];
  if (manifest.version !== 1) add("manifest", "version must be 1");
  if (!Array.isArray(manifest.videos)) return [...problems, "manifest.videos must be an array"];

  const ids = new Set();
  const claimed = new Map(); // normalized page -> video id
  for (const [index, v] of manifest.videos.entries()) {
    const at = `videos[${index}]${v && typeof v === "object" && v.id ? ` (${v.id})` : ""}`;
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      add(at, "must be an object");
      continue;
    }
    for (const key of Object.keys(v))
      if (!ENTRY_KEYS.includes(key)) add(at, `unknown key "${key}"`);
    for (const key of ENTRY_KEYS) if (!(key in v)) add(at, `missing "${key}"`);

    if (typeof v.id !== "string" || !ID.test(v.id)) add(at, "id must be a lowercase slug");
    else if (ids.has(v.id)) add(at, "duplicate id");
    else ids.add(v.id);
    if (!(v.brand in BRANDS)) add(at, `brand must be one of ${Object.keys(BRANDS).join(", ")}`);
    else if (!BRANDS[v.brand].enabled)
      add(at, `brand ${v.brand} is not enabled yet (see LAB_ENABLED)`);
    for (const key of ["title", "description"]) {
      const max = key === "title" ? 120 : 400;
      if (typeof v[key] !== "string" || !v[key].trim() || v[key].length > max)
        add(at, `${key} must be a non-empty string up to ${max} characters`);
      else if (v[key] !== v[key].trim()) add(at, `${key} has leading or trailing whitespace`);
    }
    if (typeof v.id === "string" && ID.test(v.id)) {
      const want = assetPaths(v.id);
      for (const key of ["mp4", "poster", "vtt"])
        if (v[key] !== want[key]) add(at, `${key} must be ${want[key]}`);
    }
    if (typeof v.durationSec !== "number" || !(v.durationSec > 0) || v.durationSec > 3600)
      add(at, "durationSec must be a number of seconds (0, 3600]");
    for (const key of ["width", "height"])
      if (!Number.isInteger(v[key]) || v[key] <= 0) add(at, `${key} must be a positive integer`);
    if (Number.isInteger(v.width) && Number.isInteger(v.height) && v.width > 0 && v.height > 0) {
      const ratio = v.width / v.height;
      if (Math.abs(ratio - 16 / 9) > 0.02)
        add(at, `must be 16:9 (landscape); got ${v.width}x${v.height}`);
    }

    if (!Array.isArray(v.pages)) add(at, "pages must be an array");
    else
      for (const page of v.pages) {
        if (
          typeof page !== "string" ||
          !PAGE.test(page) ||
          page.includes("//") ||
          page.includes("/.")
        )
          add(at, `page "${page}" must be a site path such as /math/`);
        else {
          const key = normalizePage(page);
          if (claimed.has(key) && claimed.get(key) === v.id) add(at, `page ${page} listed twice`);
          else if (claimed.has(key))
            add(at, `page ${page} is already mapped to "${claimed.get(key)}" (one video per page)`);
          else claimed.set(key, v.id);
          if (BRANDS[v.brand] && key === normalizePage(BRANDS[v.brand].hubPath))
            add(at, `page ${page} is the brand hub, which lists every video already`);
          if (isLabRoute(page) && !LAB_ENABLED)
            add(
              at,
              `page ${page} is a Language Page app route, which is not enabled yet (see LAB_ENABLED)`,
            );
          if (isTeacherSurface?.(page)) add(at, `page ${page} is a teacher surface`);
          if (root && !isLabRoute(page) && !existsSync(join(root, pageFile(page))))
            add(at, `page ${page} has no ${pageFile(page)}`);
        }
      }

    if (root && typeof v.id === "string" && ID.test(v.id)) fileProblems(v, root, add, at);
  }
  return problems;
}

function fileProblems(v, root, add, at) {
  for (const [key, max] of [
    ["mp4", MAX_MP4_BYTES],
    ["poster", MAX_POSTER_BYTES],
    ["vtt", 256 * 1024],
  ]) {
    if (typeof v[key] !== "string") continue;
    const file = join(root, v[key].slice(1));
    if (!existsSync(file)) {
      add(at, `${key} file missing: ${v[key]}`);
      continue;
    }
    const size = statSync(file).size;
    if (size === 0) add(at, `${key} file is empty`);
    if (size > max) add(at, `${key} is ${size} bytes; limit ${max}`);
  }
  const vtt = join(root, String(v.vtt).slice(1));
  if (existsSync(vtt))
    try {
      const cues = parseVtt(readFileSync(vtt, "utf8"));
      const last = cues[cues.length - 1].end;
      if (typeof v.durationSec === "number" && last > v.durationSec + 0.5)
        add(at, `captions run to ${last}s, past the ${v.durationSec}s video`);
    } catch (error) {
      add(at, `vtt invalid: ${error.message}`);
    }
}

/** Videos of one brand, in manifest order. */
export const videosFor = (manifest, brand) => manifest.videos.filter((v) => v.brand === brand);
