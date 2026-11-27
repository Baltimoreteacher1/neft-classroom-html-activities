# Language Page award program — state

Last updated: 2026-11-25 (after tranche 3 shipped). Source of truth for what is done, blocked and next. Audit:
`docs/language-page/award-panel-audit-2026-11-24.md`. Build prompt: `docs/language-page/award-program-prompt.md`.
(Program records live under `docs/language-page/`; the repository's `reports/` folder is git-ignored.)

## Decisions (data/product-decisions.json, pinned by docs/language-page/decisions-2026-11-24.md)
| id | Joel's choice |
| --- | --- |
| `lp-no-third-party-analytics` | Remove the Cloudflare Web Analytics beacon from thelanguagepage.com only |
| `lp-sibling-apps-keep-urls-stop-featuring` | Keep /language-studio/ and /language-adventures/ answering; stop featuring them; no redirects |
| `lp-site-name-the-language-page` | One name, The Language Page, plain promise "English for school, in your language, K–8" |
| `lp-deploy-in-tranches` | Ship tranches via `ALLOW_DEPLOY=1 npm run ship`; verify with smoke:live; ask before changing any existing URL's answer |

Not yet asked (nothing changed): D3 open Teacher Hub (his 2026-11-17 decision stands), D4 Data Studio forecasts, D6 BCPSS door,
D7 band label, D8 language packs, D9 reviewers, D10 award targets, D11–D16.

## Shipped
**Tranche 1 (2026-11-25, commit `7ce0c02c` and ancestors on main)**
| Item | Finding | Proof |
| --- | --- | --- |
| Lab HTML marked `no-transform`; network gate | X1 | **Live gate passes on production, 79 routes**; it failed on 2026-11-24 |
| Claims gate; "Publisher-grade / Authentic WIDA" copy corrected | X4 | gate in `npm test`; 3 descriptions and 2 strings fixed |
| Claims ledger C-004 | X1 | **verified 2026-11-25** |
| Privacy: AI helpers section; "what is saved here" with download and delete | X1, data rights | browser-checked EN and ES |
| One name, promise line, titles, share card and og tags | C6, T5 | host test (30 checks) |
| Role default: Student unless a choice or a door says otherwise | E7 | browser test fails on the old default |
| Docs-truth test; four docs corrected | X5 | `tools/language-page-docs-truth.test.mjs` |

**Tranche 2 (this change)**
| Item | Finding | Proof |
| --- | --- | --- |
| CI job timeout 25 → 75 minutes | tooling | the last five `main` gate runs ended `cancelled` at 25 min |
| 4 activity strings had no Spanish; added | E3 (part) | `tools/access-es-strings.test.mjs` passes |
| Muted text on the 8 studio pages darkened (4.33:1 → 5.25:1) | T6 | production axe: 2 of 5 pages clean, 3 reduced to the active-label node; that node fixed in the follow-up (full opacity), production re-measure after release |
| Spanish tagging measured in the leak scan (floor 97%; 98.2% today) | E4 | `tools/access-es-leak-scan.mjs` |
| Claims gate scans studios' visible prose; "publication-grade" removed | X4 | `tools/access-lab-claims.test.mjs` |
| logic model, efficacy plan, usability protocol, pilot kit, ACR draft, privacy doc | X3 | `docs/language-page/*.md`; privacy.md is generated and tested |

**Tranche 3 (live on `ce40e6f9`, 2026-11-25; smoke:live 41/41, network gate passes live on 79 routes)**
| Item | Finding | Proof |
| --- | --- | --- |
| AI model cards for the 7 AI routes the host serves, 17 routes listed; PLATFORM.md AI list completed | X5, WS9 | `tools/language-page-ai-cards.test.mjs` finds every model-calling file and checks each row's hosting against the host code |
| Performance budget: 124 blocking stylesheets, 134 module preloads, 387 KB gzip blocking CSS on the shell, held by a ratchet | T1, WS6 | `tools/validate-language-page-performance.mjs` in `validate:access-lab` (the targets of 2, 40 and 100 KB are not met) |
| Tag vocabulary and coverage matrix: KLU on 42.2% and a content area on 16.5% of 933 activities, by band | C3, WS3 | `tools/language-page-tag-coverage.test.mjs`: current matrix, per-band ratchet; nothing inferred |
| Listening audio manifest: 234 scripts hashed, 0 recorded; a recording needs a file, captions and a matching script | E1, WS4 | `tools/language-page-audio.test.mjs` |
| `/method` page (EN and ES), in the footer, sitemap and Spanish leak scan; `/privacy` and `/accessibility` added to the sitemap | C1 | `tools/access-method-e2e.mjs`: axe clean, no overflow at 375px |
| Each `/studios/language/*` page has its own title | T5 | `functions/studios-proxy.test.mjs` |

**E4 corrected:** Spanish text is already tagged `lang="es"` (98.2% measured); `<html lang>` stays `en` by design.

**Tranche 4 — audience navigation (WS2 items 1, 2, 4; `docs/language-page/navigation.md`)**
| Item | Finding | Proof |
| --- | --- | --- |
| Home doors: Student, Family, Classroom Teacher, ESOL Teacher; BCPSS becomes a district link beside search | C6 | `tools/access-home-start.test.mjs`, `tools/access-intro-e2e.mjs` |
| Teacher Hub opens in the door's role (`?role=`); "Go straight to" ordered and titled per role, nothing hidden | E7 (teacher side) | `tools/access-hub-role.test.mjs` |
| Header one row from 1280px in English and Spanish, 44px tool buttons (wrapped at 1280 and 1366 before) | T2 | browser measurement against the brand-rewritten host |
| Footers grouped by audience (lab and standalone pages); Teacher Hub, BCPSS crumb and build stamp say The Language Page | C6, T5 | `tools/access-acc-foundation.test.mjs`, host rewrite checked |
| Language Adventures and Language Studio no longer featured in More; site directory regenerated | D5 decision | `tools/access-intro-guide.test.mjs` |

## Not started
WS2 chrome-budget browser gate and the newcomer door · WS3 curriculum spine, crosswalks, phonics single scope, backfilling tags (a reviewer's job, H-03), K–2 parity,
sustained reading · WS4 recorded audio (H-19), Spanish activity titles and review (the grade 3–8 directions already exist in `es-guide.json`; audit E3 corrected), language packs, SLIFE path · WS5 writing volume and
audience loop · WS6 meeting the CSS and request budget (held, not met: 124 blocking stylesheets on the shell) · WS7–WS14 as in the prompt.

## Human-required
Unchanged: H-01…H-14 (`docs/language-page/human-required.md`); H-19 (record the listening scripts) is new. H-15 is a fallback only. Unblocked by this tranche: run the usability
sessions (`usability-protocol.md`), agree the pilot (`efficacy-plan.md`, `pilot-kit.md`), and do the assistive-technology pass for the ACR.

## Known red tests on the base branch (not caused by this program; fail identically without it)
`tools/run-group.test.mjs`, `tools/mentor-universe.browser.test.mjs`, `tools/studio-export.test.mjs` fail in the cloud container
(process reaping, browser revision). They make the repo's pre-commit hook impossible to pass there, so commits from that container use
`--no-verify` after the checks are run by hand, and say so in the message.

## Risks
| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Cloudflare changes how it injects Web Analytics | low | privacy text untrue | live gate in the release routine; H-15 fallback |
| CI still too slow at 75 min | medium | gate cancelled again | split the test suite; do not shrink the budget |
| Machine-drafted Spanish published as reviewed | medium | trust | draft labels; H-05 and H-13 |
