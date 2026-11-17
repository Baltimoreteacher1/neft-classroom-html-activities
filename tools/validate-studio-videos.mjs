#!/usr/bin/env node
/**
 * validate:studio-videos: the studio video tool, end to end, without a browser.
 *
 *   1. data/studio-videos.json obeys the contract in tools/lib/studio-videos.mjs: schema, derived
 *      asset paths, files exist and are inside the size budget, every VTT parses and fits its video,
 *      mapped pages exist and are not teacher surfaces, one video per page.
 *   2. Everything generated from it is fresh (scripts/generate-studio-videos.mjs --check): the card
 *      block on each mapped page, the two hubs, the Language Page route table. That is also what
 *      proves a page that is NOT mapped carries no block.
 *   3. The component keeps its promises (componentProblems): no autoplay, preload none, native
 *      controls, a captions track that is not default, an IntersectionObserver, a prefers-reduced-motion path, no
 *      third-party URL, reserved 16:9 space, and a transcript disclosure in the markup.
 *
 * The behaviour in a real browser (poster first, play, captions, layout shift) is covered by the
 * recipe in docs/studio-videos.md, which is run by hand because it needs a browser and H.264.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cardHtml } from "../assets/studio-video/studio-video-markup.mjs";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import { hydrate, run } from "../scripts/generate-studio-videos.mjs";
import { BRANDS, readManifest, validateManifest } from "./lib/studio-videos.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Promises the shared component makes, as checks over its three source files and one rendered card. */
export function componentProblems(sources) {
  // Comments describe the promises; only code keeps them.
  const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const js = code(sources.js);
  const css = code(sources.css);
  const { markup, hub } = sources;
  const out = [];
  const need = (ok, msg) => ok || out.push(msg);
  need(!/\.autoplay\b|"autoplay"/i.test(js), "studio-video.js must not set autoplay");
  need(
    (js.match(/\.play\(/g) || []).length === 1 &&
      /addEventListener\("click",\s*\(\)\s*=>\s*\{\s*video\.play\(/.test(js),
    "the only play() call must be inside the play button's click handler",
  );
  need(/preload\s*=\s*"none"/.test(js), 'the <video> must be built with preload = "none"');
  need(/video\.controls\s*=\s*true/.test(js), "the <video> must have native controls");
  need(/track\.kind\s*=\s*"captions"/.test(js), "a captions <track> from the VTT is required");
  // A silent film (the default) carries its captions in the picture: its track is never default, starts
  // disabled, and the video is muted. Only an entry marked narrated may differ, and only through the one
  // `narrated` branch, so a silent film can never start showing a doubled caption or playing sound.
  const defaults = js.match(/\.default\s*=\s*true/g) || [];
  const narratedDefaults = js.match(/if\s*\(narrated\)\s*track\.default\s*=\s*true/g) || [];
  need(
    defaults.length === narratedDefaults.length &&
      !/setAttribute\("default"/.test(js) &&
      !/<track[^>]*\bdefault\b/.test(markup),
    "the captions track may be default only for a narrated film (silent films have burned-in captions and a showing track doubles every line)",
  );
  need(
    /t\.mode\s*=\s*narrated\s*\?\s*"showing"\s*:\s*"disabled"/.test(js),
    'the captions track must start "disabled", or "showing" for a narrated film only',
  );
  need(
    /video\.muted\s*=\s*!narrated/.test(js),
    "the <video> must start muted unless the entry is narrated (click-to-play only)",
  );
  need(
    /IntersectionObserver/.test(js),
    "the player must load lazily through an IntersectionObserver",
  );
  need(/prefers-reduced-motion/.test(js), "the player must honour prefers-reduced-motion");
  need(
    /prefers-reduced-motion:\s*reduce/.test(css),
    "the stylesheet needs a prefers-reduced-motion block",
  );
  need(/aspect-ratio:\s*16\s*\/\s*9/.test(css), "the frame must reserve 16:9 space");
  need(
    /<button type="button"|document\.createElement\("button"\)/.test(js),
    "play must be a real <button>",
  );
  need(/setAttribute\("aria-label"/.test(js), "the video and play button need accessible names");
  for (const [name, text] of Object.entries({ js, css, markup }))
    need(
      !/(?:src|href|url\()\s*=?\s*["']?https?:\/\//i.test(text),
      `${name} must not request a third-party URL`,
    );
  // Product decision studio-video-no-text-under-video (Joel 2026-11-17): no note or captions text under the video.
  need(
    !/class="sv-(?:note|transcript|cues)"/.test(markup),
    "no text under the video: the note and captions text were removed by product decision studio-video-no-text-under-video",
  );
  need(
    /<img [^>]*width="\d+" height="\d+"[^>]*alt=""/.test(markup),
    "the poster needs width, height and (decorative) empty alt",
  );
  need(
    /<a class="sv-fallback" href="[^"]+\.mp4">[^<]*<img[^>]*><span class="sv-fallback-label">Play video: /.test(
      markup,
    ),
    "without JavaScript the poster must be a labelled link to the MP4",
  );
  need(
    /<h1>Videos<\/h1>/.test(hub) && /<main id="main">/.test(hub) && /<html lang="en">/.test(hub),
    "hub needs lang, h1 and main",
  );
  return out;
}

export function validate(root = ROOT) {
  const problems = [];
  const manifest = readManifest(root);
  problems.push(...validateManifest(manifest, { root, isTeacherSurface }));
  if (problems.length) return problems;
  try {
    const stale = run(root, { check: true });
    for (const file of stale) problems.push(`${file} is stale: run npm run generate:studio-videos`);
  } catch (error) {
    problems.push(error.message);
  }
  const read = (rel) => readFileSync(join(root, rel), "utf8");
  const sample = manifest.videos[0];
  if (sample) {
    const markup = cardHtml(hydrate(root, sample));
    const hub = read(BRANDS[sample.brand].hubFile);
    problems.push(
      ...componentProblems({
        js: read("assets/studio-video/studio-video.js"),
        css: read("assets/studio-video/studio-video.css"),
        markup,
        hub,
      }),
    );
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = validate();
  if (problems.length) {
    console.error(`validate:studio-videos FAILED (${problems.length})\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  const { videos } = readManifest(ROOT);
  console.log(
    `validate:studio-videos OK: ${videos.length} videos, ${videos.reduce((n, v) => n + v.pages.length, 0)} mapped pages`,
  );
}
