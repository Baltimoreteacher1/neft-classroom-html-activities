# The Language Page front layer

The front door of thelanguagepage.com: a calm, fast, static layer in front of the ACCESS Practice Lab.
Five sections (Practice, Teacher Tools, Content + Language, ACCESS Guide, About), 103 pages, no accounts and no data
collection. The lab, the Teacher Hub, the WIDA studios and BCPSS bridges keep every URL they had.

## Where things live

| Path | What |
| --- | --- |
| `tools/lp/data/` | All content as JSON: practice sets (`practice/<cluster>/<domain>.json`), Content + Language units (`content/<area>/<slug>.json`), tool registry, phrase banks, interface strings (`i18n.json`). Contract: `tools/lp/data/SCHEMA.md`. |
| `tools/lp/site/` | Page renderers (layout, practice, content, tools, routes, icons). |
| `tools/lp/build-site.mjs` | Writes the pages into `lp/` and the route list into `functions/_lib/lp-routes.js`. `--check` fails when anything is stale. |
| `lp/` | **Generated** pages (`lp/**/index.html`, `lp/assets/icons.svg`, `search-index.json`, `units.json`, `routes.json`) plus hand-written assets in `lp/assets/` (CSS, scripts, game and activity runtimes, vendored QR encoder) and `lp/sw.js`. |
| `functions/_lib/lp-front.js` | Serves the clean URLs from `lp/` on thelanguagepage.com only, with strict security headers. Every other host passes through. |
| `functions/index.js`, `functions/{practice,tools,content,access-guide,about,search,styleguide,lp}/[[path]].js` | One-line mounts of that handler. The auth-pinned `functions/_middleware.js` is not touched. |
| `functions/_lib/language-page.js` | Adds the front paths to what the Language Page host serves, makes `/` the front-layer home, adds the pages to the sitemap, and skips the lab's HTML branding for front pages. |
| `tools/lp/check.mjs` | `npm run check:lp`: every gate, each with a negative control (`tools/lp/fixtures/`). |
| `tools/lp/server.mjs` | Local server with the same routing and headers as production. |

## Everyday tasks

- **Add a practice set or a content unit:** add JSON that follows `SCHEMA.md`, then run `npm run build:lp` and
  `npm run check:lp`. No HTML is written by hand.
- **Change wording in the interface:** `tools/lp/data/i18n.json` (English and Spanish together; G-12 fails on a missing language).
- **Preview locally:** `node tools/lp/server.mjs` and open http://localhost:4810/.
- **Check production after a deploy:** `node tools/lp/check.mjs --live --base https://thelanguagepage.com`.

## Gates (`npm run check:lp`)

Exit 0 PASS, 1 FAIL, 3 SKIP; with `CI` set a SKIP is a FAIL. A gate that checks nothing FAILS. Each gate first runs
its detector on a known-bad fixture and FAILS if that control passes.

| Gate | What it proves |
| --- | --- |
| G-01 | Every internal link on every page resolves (front pages, assets, or a URL that answered 200 at baseline). |
| G-02 | Every one of the 649 baseline URLs (`docs/audit/url-inventory.json`) still resolves; `--live` follows every hop over HTTP. |
| G-03 | axe-core (WCAG 2.0–2.2 A/AA) on all pages, plus dark and high-contrast themes on a sample: zero serious or critical. |
| G-04 | Lighthouse (mobile and desktop) on the home page and every section landing page: Perf ≥ 95, A11y 100, BP ≥ 95, SEO 100, home < 500 KB. Needs `LIGHTHOUSE_DIR`. |
| G-05 | Playwright network log on every page and tool interaction: same-origin requests only. |
| G-06 | No purple, violet or lavender (hex, rgb, hsl, named) in the layer's CSS, JS, HTML, SVG, JSON or renderers. |
| G-07 | Content schema: answer key, a reason for every choice, a misconception for every distractor, level, ELD Standard, KLU; no duplicate ids, stems or slugs; 3 sets per cluster and domain; all 5 ELD Standards per domain. |
| G-08 | Every computed answer is recomputed with exact fractions and must appear in the keyed text. |
| G-09 | Six game exports and the activity export open from `file://` with zero console errors, zero requests, under 300 KB. |
| G-10 | No third-party fetch/XHR/beacon/socket, no trackers, no forms that post. |
| G-11 | The disclaimer is in every footer and on every practice page. |
| G-12 | Every interface key used by a page or script exists in English and Spanish. |
| G-13 | Key pages at 320, 768 and 1280 px: no horizontal overflow, no clipped text. Screenshots go to `reports/lp-check/screens/`. |
| G-14 | The committed `lp/` output is exactly what the generator writes. |
| G-15 | `--live` only: production front pages carry the CSP, HSTS and Permissions-Policy headers. |

## Facts and sources

WIDA facts and their confidence: `docs/sources.md`. Anything not confirmed word for word is labelled **approximate**
in the interface; standard codes not checked against the official source show **[VERIFY]**
(`VERIFIED_CODES` in `tools/lp/site/content.mjs`).
