# The Language Page: baseline audit before the front-layer rebuild

Measured 2026-11-27 against production (https://thelanguagepage.com), commit `2c14acad` on `main`.
Tools: `tools/lp/audit-baseline.mjs` (Chromium render of every sitemap page, link and request capture, axe-core 4 on six
pages, hop-by-hop status of every internal URL) and `tools/lp/lighthouse-run.mjs` (Lighthouse 12, simulated throttling).
Raw data: `docs/audit/baseline-raw.json`, `docs/audit/lighthouse-baseline.json`. The URL contract: `docs/audit/url-inventory.json`.

## 1. Where the site lives (discovery)

- **There is no separate Language Page repository or Pages project.** thelanguagepage.com is a second hostname on the
  EduWonderLab Cloudflare Pages project (`Baltimoreteacher1/neft-classroom-html-activities`, build `npm run build`,
  output `dist/`). `functions/_lib/language-page.js` decides what that hostname serves: the ACCESS Practice Lab
  (`/access-practice-lab/`), the Teacher Hub (`/access-teacher/`), the WIDA studios (`/wida-access/*`), Learning
  Studios (`/studios/`, proxied from a separate Worker), BCPSS bridges (`/bcpss-teachers`), and shared `/assets/`,
  `/shared/`, `/data/`. Every other path on the host is a 308 to eduwonderlab.com. `/` is a 302 to `/access-practice-lab/`.
- `Baltimoreteacher1/neft-language-studio` is a Next.js app exported into `/language-studio/`; it is not the site.
- Deploy path: push to `main` (via `ALLOW_DEPLOY=1 npm run ship`), Cloudflare Git integration builds and promotes.
  The deploy also ships eduwonderlab.com, so every change here is tested against both hostnames.
- `_headers`, `_redirects`: shared with eduwonderlab.com; host-specific behaviour lives in Pages Functions.
- `dist/` file count after a full local build: **17,755** (Pages refuses more than 20,000).

## 2. URL inventory

| Measure | Result |
| --- | --- |
| Sitemap URLs | 82 (+ `/`) |
| Pages rendered in Chromium | 83 |
| Internal URLs found (sitemap + every rendered link) | **649** |
| Status | 644 answer 200; 1 is a 302 (`/` to the lab); 4 are 308s (trailing-slash or host); all 649 end in 200 |
| Broken internal links | **0** |
| Links leaving the site | 0 anchors to other hosts on rendered pages; 1 internal link redirects off-host (`/directory/` to eduwonderlab.com) |
| Orphan sitemap pages (no inbound link) | 0 |
| Same-origin assets requested | 846; **1 returns 404**: `/wida-access/reading/design-tokens.css` (console error on `/wida-access/reading/`) |
| Console errors | 2 pages: `/wida-access/reading/` (the 404 above), `/bcpss-teachers` (one `net::ERR_FAILED` request) |
| Duplicate content (same rendered text) | `/` and `/access-practice-lab/` (redirect, expected); `/vocabulary/mastery` and `/vocab-curriculum`; `/family-tour/` and `/practice-together` |

By section: `/access-practice-lab` 541 URLs, `/studios` 87, `/wida-access` 7, `/bcpss-teachers` 5, `/access-teacher` 3, other 6.

## 3. Lighthouse (production, Lighthouse 12)

| Page | Form | Perf | A11y | BP | SEO | LCP | Weight |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` (redirects to the lab home) | mobile | **64** | 100 | 100 | 100 | 6.5 s | 1,593 KB |
| `/` | desktop | 92 | 100 | 100 | 100 | 1.5 s | 1,595 KB |
| `/access-practice-lab/learn` | mobile | **59** | 100 | 100 | 100 | 8.4 s | 1,517 KB |
| `/access-practice-lab/learn` | desktop | 90 | 100 | 100 | 100 | 1.6 s | 1,517 KB |
| `/wida-access/reading/` | mobile | 100 | 100 | 100 | 100 | 1.3 s | 242 KB |
| `/wida-access/reading/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 242 KB |
| `/access-practice-lab/speak` | mobile | **59** | 100 | 100 | 100 | 8.9 s | 1,669 KB |
| `/access-practice-lab/speak` | desktop | 88 | 100 | 100 | 100 | 1.8 s | 1,669 KB |
| `/bcpss-teachers` | mobile | 97 | 100 | 100 | 100 | 2.3 s | 463 KB |
| `/bcpss-teachers` | desktop | 100 | 100 | 100 | 100 | 0.5 s | 463 KB |
| `/access-teacher/classroom/` | mobile | 100 | 100 | 100 | **66** | 1.3 s | 175 KB |
| `/access-teacher/classroom/` | desktop | 93 | 100 | 100 | **66** | 0.3 s | 175 KB |

The lab shell pages are slow on mobile: about 1.6 MB, up to 203 requests, 124 render-blocking stylesheets on the shell
(already recorded in `docs/language-page/program-state.md`). The teacher kit page is missing SEO basics (66).

## 4. Accessibility (axe-core, WCAG 2.0/2.1/2.2 A and AA)

Zero violations on all six sampled pages: `/access-practice-lab/`, `/learn`, `/speak`, `/privacy`, `/wida-access/reading/`,
`/bcpss-teachers`. (axe finds roughly a third of WCAG issues; this is not a full conformance claim.)

## 5. Styles and components

- Stylesheets per page: 1 to 11 linked files (median 4), plus the lab's runtime-injected styles.
- Seven font families in use across the 83 pages: Inter, Plus Jakarta Sans, Atkinson Hyperlegible, Fraunces,
  Source Serif 4, Arial, system-ui. All web fonts are self-hosted under `/assets/fonts/`.
- Three visual systems coexist: the lab design system (`access-practice-lab/ds.css`), the WIDA studio pages
  (`/wida-access/*`, their own tokens) and the BCPSS studio. Headers and footers differ between them.

## 6. Third-party and CDN dependencies

**None.** No rendered page requested any host other than thelanguagepage.com (the Cloudflare Web Analytics beacon was
removed on 2026-11-25, decision `lp-no-third-party-analytics`). Fonts and scripts are already self-hosted.

## 7. Practice content today, by band and domain

From the lab's activity bank (`docs/language-page/coverage-matrix.md`, generated):

| Band | Listening | Reading | Speaking | Writing | With a Key Language Use | With a content area |
| --- | --- | --- | --- | --- | --- | --- |
| K | 9 | 9 | 9 | 8 | 0% | 0% |
| 1 | 16 | 15 | 14 | 14 | 3% | 0% |
| 2–3 | 23 | 23 | 22 | 22 | 8% | 0% |
| 3–5 | 75 | 78 | 66 | 67 | 88% | 54% |
| 6–8 | 115 | 78 | 108 | 111 | 29% | 0% |

**Gaps against the brief:**
- The lab's middle band is "3–5". The official WIDA ACCESS Online clusters are 2–3 and 4–5 (`docs/sources.md`), so grade 3
  practice is not separated from grades 4–5.
- Activities do not carry, per item, a recorded answer key **and** a reason each wrong choice is wrong **and** a target
  proficiency level, ELD Standard and Key Language Use. Only 16.5% carry a content area; the 6–8 band has none.
- No per-item distractor rationale or schema gate exists for the activity bank.

## 8. What the rebuild must keep

Every one of the 649 URLs above (gate G-02). Every Joel decision in `data/product-decisions.json` (one name; no
third-party analytics; keep sibling app URLs; deploy in tranches; ask before changing an existing URL's answer).
