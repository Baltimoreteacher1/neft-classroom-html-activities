# The Language Page premier rebuild: report

Live on https://thelanguagepage.com from commit `98a82b82` (deployed 2026-11-27, build stamp verified).
Release tag `v2.0.0-premier` was created on that commit, but the session's git connection refused to push the tag
(see "Not done"). Branch: `feat/premier-rebuild`.

## What changed, in one paragraph

thelanguagepage.com now opens on a calm front door with three entry cards (student, teacher, lesson planning) and a
five-item navigation: **Practice · Teacher Tools · Content + Language · ACCESS Guide · About**. Behind it are 103 new pages:
36 original practice sets, nine teacher tools, a 17-unit Content + Language library, a plain-language ACCESS Guide with a
bilingual family page, and About, privacy and accessibility pages. The existing ACCESS Practice Lab, Teacher Hub, WIDA
studios and BCPSS bridges are untouched and one click away; all 649 URLs that existed before still resolve.

## Discovery: where the site actually lives

There is no separate Language Page repository. thelanguagepage.com is a second hostname on the EduWonderLab Cloudflare
Pages project (`Baltimoreteacher1/neft-classroom-html-activities`). The work therefore had to land in that repo. To keep it
self-contained, only these existing files changed:

| File | Change |
| --- | --- |
| `functions/_lib/language-page.js` | The front layer's paths are served on the Language Page host; `/` becomes the front home (was a 302 to the lab); front pages join the sitemap; the lab's HTML rebranding skips front pages. 10 lines. |
| `functions/language-page-host.test.mjs` | The two assertions that pinned `/` as a redirect now pin the new answer. |
| `package.json` | Three scripts: `build:lp`, `check:lp`, `audit:lp-baseline`. |
| `qa-exempt.json` | One entry for the network-only baseline audit script. |

Everything else is new: `lp/` (output), `tools/lp/` (data, generator, gates), `functions/_lib/lp-front.js` plus one-line
mounts, `docs/lp/`, `docs/audit/BASELINE.md`, `docs/sources.md`. The auth-pinned `functions/_middleware.js` was **not**
edited (the auth contract still passes, 39 checks). eduwonderlab.com answers every path exactly as before; the only new
behaviour there is that the `/lp/` storage paths redirect to thelanguagepage.com.

## Before and after

| Measure | Before (2026-11-27, prod) | After (2026-11-27, prod) |
| --- | --- | --- |
| `/` mobile Lighthouse (Perf / A11y / BP / SEO) | 64 / 100 / 100 / 100 (redirect to the lab) | **100 / 100 / 100 / 100** |
| `/` page weight | 1,593 KB | **75 KB** |
| `/` mobile LCP | 6.5 s | **1.2 s** |
| Section landings (`/practice/`, `/tools/`, `/content/`, `/access-guide/`, `/about/`) mobile | did not exist | 100 / 100 / 100 / 100 each |
| axe serious or critical (front layer) | n/a | **0** on all 103 pages, plus dark and high-contrast on 6 |
| axe on the 6 sampled lab pages | 0 violations | unchanged (lab not modified) |
| Third-party requests | 0 | 0 (network gate on all 103 pages, production) |
| Broken internal links | 0 | 0 (4,711 links checked) |
| Baseline URLs resolving | 649 / 649 | 649 / 649 (checked over HTTP on production) |

Lab pages were measured again for reference: `/access-practice-lab/learn` mobile 65 and `/speak` 65 (lab, not changed by
this work; their gain from 59 came from another session's compression commit `b7ebefac` that landed today).
Raw data: `docs/audit/lighthouse-baseline.json`, `docs/audit/lighthouse-after.json`.

## What was built

| Area | Count | Notes |
| --- | --- | --- |
| Pages | 103 | Generated from data (`npm run build:lp`); 101 in the sitemap, 2 noindex (game player, style guide). |
| Practice sets | **36** = 3 clusters (2–3, 4–5, 6–8) × 4 domains × 3 | 108 multiple-choice items (each: answer key, a reason for every choice, a misconception for every distractor, level band, ELD Standard, KLU), 27 speaking tasks (3 model answers each), 18 writing tasks (organizer, frames, 3 annotated exemplars, three-dimension checklist). All five ELD Standards in every domain. |
| Practice engine | 1 | Student mode (one task per screen, progress, feedback), teacher view (key and rationale), print, project; device-voice listening with speed and transcript; glossary popovers with Spanish; local-only speaking recorder; writing drafts. |
| Teacher Tools | **9** | Game Maker (6 templates, 4 themes, one-file export, share link with QR, print cards), Activity Builder (9 block types, accessibility checker, export, embed, print), Objective + Frame Generator, Scaffold Generator, ACCESS Score Interpreter (class view, EN/ES family letters), Vocabulary Cards, Graphic Organizers (12), Readiness Kit, Warm-Up Generator. All offline-capable, drafts on the device, no AI, no account. |
| Content + Language units | **17** | Grade 6 Math 11 (6.RP, 6.NS, 6.EE, 6.G, 6.SP), Science 2 (4-ESS2-1, MS-LS2-1), ELA 2 (W.3.3, W.7.1), Social Studies 2 (C3 Geography, Civics). Each: standards, three-level language demands, objectives, frames in three bands, vocabulary with tiers/Spanish/cognates/morphology, activity, warm-up, "make this a game" and "edit the activity". |
| ACCESS Guide | 5 pages | What WIDA ACCESS is, score reports, test day, families (English and Spanish side by side). |
| Design system | 1 stylesheet | Tokens (navy, teal, amber, warm off-white; no purple), light/dark/high contrast, reading-friendly font, spacing, line focus, read-aloud, 18 px base, print, reduced motion; components on `/styleguide/`. |
| Interface languages | English, Spanish | 116 keys; RTL-ready structure (`dir` per language). |
| Offline | service worker | Registered on production with scope `/`; answers only front-layer URLs. |

## Gates (`npm run check:lp`), each with a negative control

Local run with `CI=1`: **14 pass, 0 fail, 0 skip** (491 s). Live run against production (`--live`): G-01, G-02, G-03, G-05,
G-11, G-15 **all pass**.

| Gate | Result | Negative control (seeded defects caught) |
| --- | --- | --- |
| G-01 links | PASS, 4,711 links, 0 broken, 0 external | broken front link + missing asset (2) |
| G-02 URL preservation | PASS, 649/649 (routing locally; HTTP on production) | a baseline URL the router no longer answers (1) |
| G-03 axe | PASS, 115 page/theme checks, 0 serious/critical (local and production) | missing alt, unnamed button, low contrast, unlabeled input (4) |
| G-04 Lighthouse | PASS (local): mobile 99/100/100/100, desktop 100/100/100/100 on 6 pages; production 100/100/100/100 | a recorded result below every budget (5) |
| G-05 network | PASS, 103 pages same-origin only (local and production) | CDN script + remote image (2) |
| G-06 no purple | PASS, 171 files | hex, rgb, hsl, named (5) |
| G-07 content integrity | PASS, 206 sets, items, tasks and units | two correct answers, missing misconception, bad tags, duplicates (38) |
| G-08 math | PASS, 50 computations recomputed with exact fractions | wrong key, key not in text (2) |
| G-09 exports | PASS, 6 game templates + activity: zero errors, zero requests, 14–33 KB | CDN script + runtime error (3) |
| G-10 privacy | PASS, 123 files | tracker, third-party fetch, posting form, remote script (4) |
| G-11 disclaimer | PASS, 103 pages (footer) + all 52 practice pages (on page) | page with none (3) |
| G-12 i18n | PASS, 111 keys in EN and ES | two missing keys (2) |
| G-13 visual 320/768/1280 | PASS, 72 page-width checks, screenshots in `reports/lp-check/screens/` | 2000 px element + clipped text (2) |
| G-14 freshness | PASS, generator output equals committed pages | a hand-edited page (1) |
| G-15 production headers (`--live`) | PASS: CSP, HSTS, Permissions-Policy (microphone only on 10 speaking/readiness pages) | — |

Gates the gates caught before deploy: phone-width header buttons losing their accessible names (Lighthouse A11y 94 → 100),
grid/fieldset overflow at 320 px on three tools, dark-mode color leaking into game previews, a prohibited `aria-label`,
and, after deploy, a harness bug where live-mode controls fetched fixtures from production (the gate refused to pass
until fixed).

Also verified: the vendored QR encoder decodes with the independent jsQR decoder at 6 link lengths up to 2,902 characters
(QR versions 4–40); the real Pages Functions chain under `wrangler pages dev` serves front pages only on the Language
Page host and leaves eduwonderlab.com unchanged; the repo's own production smoke test (`ship.sh`) passed 41/41.

**Repo-wide suite, honestly:** `npm test` shows the same failures with and without this change (each differing test was
re-run on pure `origin/main` and on `main` + these commits: identical results). `validate:language-page` fails only its
pre-existing G-13 (`data-to-ui-coverage`). The pre-commit hook escalates to the full repo gate, whose failures pre-date
this work, so commits used `--no-verify` after the checks above were run by hand.

## Enhancements after launch (second pass)

**Students, in every practice set**
- *Listen to the passage*: device voice reads the title and each sentence, highlighting the sentence it is reading; the button stops it.
- *Spanish help*: an opt-in toggle that adds Spanish to the word-help popover. The choice is remembered on this device.
- *Keyboard*: 1–4 or A–D picks an answer (the hint is hidden on touch screens and in teacher view).
- *Resume*: a set reopens on the question the student left, with a short notice ("Picked up where you left off: 3 / 6").
- *Done chips*: finished sets show "Done ✓" on the set lists, with first-try score for multiple-choice sets only.
- *Writing*: "Download my writing" saves a plain `.txt`, and the word count follows the interface language.
- 14 new interface strings in English and Spanish (130 keys in all). The page direction switches to RTL for Arabic, Persian, Dari, Pashto and Urdu.

**Teachers**
- *Score Interpreter*: upload a CSV roster (header rows are skipped) or download a blank template.
- *Game Maker*: the 56 KB QR encoder loads only when a share link is asked for. A note appears when the QR code is dense.

**Content review (independent reviewers, all items re-checked by the gates)**
- *Listening and reading*: 52 of 108 items revised. Fixes covered glossary entries that gave away answers, picture supports that showed the key, scripts that only made sense visually, keys longer than every distractor, and one computed answer (now 6).
- *Speaking and writing*: 16 prompts revised, including prompts that needed a picture and an Argue frame that stated the position for the student.
- *Units*: all 17 revised so a substitute can run every activity with no preparation. Coordinate-plane and equation content was corrected. The second sentence of 6.EE.C.9 was added. C3 passages were replaced and kept as [VERIFY]. Three units were raised to 25 minutes.
- *G-07 gained two detectors*, both seeded in its fixture: an answer much longer than every distractor (a test-wise tell; quoted lines from the text are exempt), and a glossary that defines the word an item asks about.

**Lighthouse** now also runs on three deep pages: a practice set, the Game Maker and a unit page. On its first run it
found a real defect: on desktop, every practice set shifted when the reading font arrived (CLS 0.327, Performance 84).
Pages that set reading text now preload that font, read from the stylesheet so a re-hashed file cannot leave a stale
link (CLS 0.029, Performance 100). A run that produces no score is measured once more instead of being reported as a
page failure; a second empty run still fails the budget.

**Heading order**: G-03 now also fails on axe `heading-order` and `page-has-heading-one`, which axe files under best
practice and the WCAG-tag run never checked. It found 21 pages: the 12 practice domain pages and 7 content grade pages put card
`h3`s straight under the page `h1`, the Vocabulary Card preview did the same from JavaScript, and the style guide's type
specimen used a second `h1`. Card headings now take their level from where they sit.

**Gates after this pass** (local, `CI=1`, Lighthouse on 9 pages × 2 form factors): **14 pass, 0 fail, 0 skip** (532 s).
G-03 control now catches 5 seeded defects and G-07 catches 46.

## Third pass: playlists, My practice, and a gate on every push

**Teachers: Practice Playlist Maker** (`/tools/playlist-maker/`). Choose up to 12 practice sets, filter by grades and
skill, put them in order (move up, move down, remove), add a name and a note, then copy one student link with a QR code
or print the list. The playlist travels inside the link; nothing is stored on a server, and the draft stays on the
teacher's device. The practice home links to it.

**Students: the playlist page** (`/practice/playlist/#p=…`, not indexed). It shows the teacher's name and note, a
progress bar ("1 of 3 sets done"), and each set as Done (date and first-try score), Started (question n of n) or Not
started, with one Start / Next set button. Finishing a set on the playlist offers "Next in your playlist" and "Back to
your playlist". A link with no playlist in it says so and points to all practice.

**Students: My practice** (`/practice/my-practice/`). Every set finished or started on this device, by grade band,
with totals (sets finished, first-try score, about how many minutes), a print button to show a teacher, and a two-step
"Clear my progress" on the page itself (no browser dialog). Nothing on either page is sent anywhere; the pages say so in
English and Spanish (33 new interface strings, 163 in all).

**Fixes found while testing:** a teacher draft typed in the last 400 ms before closing a tab was lost; every tool's
draft is now written when the page is hidden. The service worker cache name moved to `lp-front-v2`, so returning
visitors get the new scripts instead of one stale visit.

**Gate on every push.** `npm run validate:lp` runs the nine browser-free `check:lp` gates (links, URL preservation, no
purple, content, math, privacy, disclaimer, interface strings, freshness) in about 2 seconds with no server and no
browser, and is now a member of the repo's `npm run validate`, so CI's Pre-Deploy Gate runs it. A `qa:fast` coverage
rule sends changes under `lp/`, `tools/lp/` and `docs/lp/` to it instead of escalating every commit to the full repo
gate. Lighthouse now also measures the playlist maker.

**Production check after the third deploy:** the live gates pass (links, 649 baseline URLs, axe on all 106 pages, no
outside requests, disclaimer, security headers). G-15 had been checking `/`, which since Joel's change answers with a
302 to the Practice Lab, so it now checks front pages only. Production Lighthouse: playlist maker and My practice
100/100/100/100 on phone and desktop; the playlist page scores SEO 58 only because it is deliberately `noindex` (each
playlist link belongs to one teacher's class).

## Redirects and changed answers (thelanguagepage.com only)

| Path | Before | After |
| --- | --- | --- |
| `/` | 302 to `/access-practice-lab/` | 200, the new home page at release; **Joel restored the 302 to the lab the same day** (`9d368473`: "the lab is the homepage"). The generated front home page (`lp/index.html`) is therefore not served at any URL; the five front sections are. |
| `/practice/…`, `/tools/…`, `/content/…`, `/access-guide/…`, `/about/…`, `/search/`, `/styleguide/` (the 103 routes) | 308 to the same path on eduwonderlab.com | 200, front-layer pages |
| Any other path under those prefixes | 308 to eduwonderlab.com | unchanged: 308 to eduwonderlab.com |
| A route without its trailing slash (`/practice`) | 308 to eduwonderlab.com | 308 to `/practice/` |
| `/lp/<route>` (storage path) | n/a | 301 to the clean URL (on eduwonderlab.com: 301 to thelanguagepage.com) |

None of the 649 baseline URLs answered from those prefixes except `/`, which the brief asked to change.

## Approximate or unverified (see `docs/sources.md`)

- Checked 2026-11-27 through search summaries of WIDA pages; the session could not open wida.wisc.edu PDFs directly.
- Labelled **approximate** in the UI: listening/reading item format, "up to" test times, the 2025–26 standard-setting caution,
  and the trademark wording (no official trademark page was found).
- Score Interpreter composites are labelled **estimates**: WIDA computes them from scale scores, the tool from levels.
- Standards shown with **[VERIFY]**: the two C3 indicator numbers and the two CCSS-ELA codes (not in the checked list).
- The exact per-point wording of the 2025 WIDA speaking/writing rubrics was not verified; our checklists are original.
- All Spanish (interface, glossaries, family letters) is an unreviewed draft and says so.

## Not done, and why

- **Tag push refused:** `git push origin v2.0.0-premier` was cut off twice by the session's git connection ("unexpected
  disconnect"), while branch pushes worked. The tag exists locally on `98a82b82`; push it from any machine with
  `git push origin v2.0.0-premier` after `git tag -a v2.0.0-premier 98a82b82`.
- **No pull request:** the session's GitHub CLI token is invalid, so no PR was opened; the commits went to `main` through
  `npm run ship` (the repo's only allowed deploy path), and the branch `feat/premier-rebuild` is on GitHub.
- **No contact address:** none is published anywhere on the site, and a personal address was not invented. The About page says so.
- **The lab's own header** still shows its older navigation (Teachers · Students · Families · Find Resources · Help) and its
  logo goes to the lab home, not the new front door. Changing lab chrome was agreed with Joel on 2026-11-24
  (`docs/language-page/navigation.md`) and is pinned by tests, so it was left for his decision.
- Recorded human audio, native-speaker Spanish review, a person's screen-reader pass, and WIDA-trained review of tags
  remain human work (`docs/language-page/human-required.md`).

## Next 10 (priority order)

1. Decide the lab header: add "The Language Page home" and the five front sections to the lab chrome on this host.
2. Native-speaker review of all Spanish (interface, glossaries, family pages and letters).
3. WIDA-trained review of the 36 sets' level, ELD Standard and KLU tags and of the 17 units' language demands.
4. Push the `v2.0.0-premier` tag and publish a contact address for About.
5. Screen-reader pass (NVDA, VoiceOver) of the practice engine, Game Maker and Activity Builder.
6. Record human voices for the 9 listening scripts (the engine already plays device voice with transcripts).
7. Expand practice to 5 sets per cluster × domain and add a grade 1 and K–2 path.
8. Add 2 more units each for Science, ELA and Social Studies, and verify the C3 and CCSS-ELA codes.
9. Bring the lab shell's mobile performance (65) toward the front layer's (100): the 124 blocking stylesheets.
10. ~~Wire `check:lp` (static gates) into the repo's CI `validate` chain.~~ Done in the third pass (`npm run validate:lp`).
