# Studio videos

Videos made in the motion studio (`claude-motion-studio`) appear on both sites from one manifest.
Nothing is hand-edited into a page.

| Piece | Where |
| --- | --- |
| Manifest (the only list of what appears where) | `data/studio-videos.json` |
| Contract, VTT parser, brand table | `tools/lib/studio-videos.mjs` |
| Player (custom element, no dependencies) | `assets/studio-video/studio-video.js`, `.css` |
| Card markup (one builder, build time and browser) | `assets/studio-video/studio-video-markup.mjs` |
| Files per video | `assets/studio-videos/<id>/<id>.mp4`, `poster.jpg`, `<id>.vtt` |
| Generator | `scripts/generate-studio-videos.mjs` (`npm run generate:studio-videos`) |
| Gate | `npm run validate:studio-videos`, `tools/studio-videos.test.mjs` |

## Held back: the Language Page half

Only EduWonderLab is live. The Language Page side (`brand: languagepage`, the `/access-practice-lab/videos/` hub, the card
on `/access-practice-lab/...` app routes, thelanguagepage.com) needs changes under `access-practice-lab/` and `functions/`
and is not enabled: `LAB_ENABLED` in `tools/lib/studio-videos.mjs` is `false`, so the validator rejects that brand and any
`/access-practice-lab/` page, and the generator writes nothing under `access-practice-lab/`. The code for it (app hook,
route table, hub bypass, sitemap entries, flag flip, tests) is saved as
`claude-motion-studio/docs/site-integration-language-page.patch`; apply it with `git apply`, then re-publish the
Language Page video from the studio and run the generator. The rest of this page describes the finished design.

## What the generator writes

- **Mapped static pages** (`pages[]`): one marked block, `<!-- studio-video:start -->` to `<!-- studio-video:end -->`,
  inserted before the page footer. A page that is not mapped is never read or written; a block whose page is
  no longer mapped is removed byte for byte.
- **The Language Page app** (`/access-practice-lab/...` routes are rendered by the app, not files):
  `access-practice-lab/src/studio-video-routes.js`. `main.js` looks the route up after each render; an
  unmapped route costs one object lookup and no request.
- **Hubs**: `/videos/` (brand `eduwonderlab`) and `/access-practice-lab/videos/` (brand `languagepage`), each
  listing only its own brand. They reach `data/catalog.json` (so `/directory/` and the sitemap) through the
  existing catalog generator, and `functions/_lib/language-page.js` lists the lab hub for thelanguagepage.com.
- `thelanguagepage.com` serves `/assets/`, `/data/` and `/access-practice-lab/` already, so the player, the files
  and the lab hub work on both domains. `/videos/` is EduWonderLab's hub and redirects there from the other host.

## Add a video to any page

From the studio (needs the project's QA report to show every objective check passed, and ffmpeg):

```sh
CLASSROOM_REPO=/path/to/classroom-checkout \
  npm run publish:site -- <slug> --page /math/ --page /math/games/
```

That copies the MP4, VTT and a generated poster here, upserts the manifest entry and runs the generator.
Review `git diff`, run `npm run validate:studio-videos` (and `npm run qa:fast`), commit, then ship the
commit with `ALLOW_DEPLOY=1 npm run ship -- <sha>`.

Rules the validator enforces: one video per page; a page must exist (static pages) and may not be a teacher
surface; files are named from the id; 16:9; MP4 <= 20 MiB; poster <= 150 KB; VTT must parse and end inside the video.
To remove a video from a page, delete the path from `pages[]` and run the generator.

## Player behaviour

Poster first (`preload="none"`; nothing but the poster is fetched until the card is within 300px of the viewport,
and the MP4 only after Play). Native controls, an English captions `<track>` from the VTT that is off until chosen in the captions menu (the films already show their words, so a default track would draw every line twice), muted,
click or key to play, never autoplay. `prefers-reduced-motion`: no transitions and the captions text opens by
default. Without JavaScript the card is a labelled link to the MP4 plus the full captions text. The films are
silent, and the card says so.

## Checking it in a browser (not part of the gate: needs a browser with H.264)

Serve `dist/` (a static server with Range support; the Language Page routes need the `app-shell` fallback) and,
at 1440x900 and 390x844, in light and dark, check on `/math/`, `/math/games/`, `/math/unit-6/`, `/videos/`,
`/access-practice-lab/`, `/access-practice-lab/explore/practice` and `/access-practice-lab/videos/`:
no console errors, no request to another origin, no `.mp4` request before Play, a `206` for the MP4 after Play,
the captions track `showing`, no layout shift attributed to `studio-video`, and the same with
`prefers-reduced-motion: reduce`. Playwright's bundled Chromium has no H.264; use `channel: "chrome"`.
