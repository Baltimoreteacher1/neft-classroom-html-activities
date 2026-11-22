# The Language Page: activity quality overhaul report

Generated 2026-11-22 by `tools/assemble-report.mjs` from `inventory.json`, `baseline-scores.json`, 10 fragment(s). Baseline = origin/main at 2b47c0dbb4.
Numbers below are computed from those files. Where an input is missing the report says so instead of estimating.

## A. Executive summary

- Surface audited: 162 families (118 site-map destinations, 933 core-bank activities across 21 band x skill families, 23 static sibling-site families), 1987 enumerated activity or route records; 12 families are untestable and are listed with reasons.
- Area fragments received: 10 of 10 expected.
- Baseline mean overall score (weighted A-K): 3.2 over 33 scored families.
- After-state mean overall score: 3.6 over 21 scored entries (area-reported; before-state for the same entries: 3.1).
- Content records rewritten: 387; critical defects fixed: 16; shared-hotspot edits declared: 15.
- Fragment inventory records: 211 (upgraded 36, unchanged 161, untestable 13, blocked 1).
- Baseline testable families covered by at least one fragment record: 150 of 150.
- Baseline crawl: 214 pages x 390/768/1280px; load errors 0; pages with console/page errors 0; horizontal overflow (pages) 390px: 2, 768px: 2, 1280px: 0; axe 390px: 19 page(s) with serious/critical, 19 with any; 1280px: 16 page(s) with serious/critical, 16 with any; pages with targets under 44px at 390px: 212; interaction states: no-primary-cta 94, cta-responded 77, cta-no-visible-change 16, feedback-shown 16, no-check-button 5, no-visible-feedback 6.
- After crawl: not available.

## B. Inventory of activity families

Source: `inventory.json` (reports/language-page-quality/tools/enumerate.mjs). One row per family; `count` is the number of enumerable items. Priority is the baseline priority from measured content flags and crawl results.

| id | program | type | grade | count | testable | priority | covered by fragment |
|---|---|---|---|---|---|---|---|
| reading-path | Studios & practice | practice | all bands | 15 | yes | P2 | yes |
| newcomer-packs | For Teachers | tool | all bands | 9 | yes | P2 | yes |
| print-studio | For Teachers | studio | all bands |  | yes | P2 | yes |
| el-program | For Teachers | tool | all bands | 25 | yes | P2 | yes |
| live-speaking | For Teachers | tool | all bands |  | yes | P2 | yes |
| partner-talk | For Teachers | tool | all bands |  | yes | P2 | yes |
| listening | Studios & practice | practice | all bands | 238 | yes | P2 | yes |
| voice | Studios & practice | studio | all bands | 21 | yes | P2 | yes |
| conversation | Studios & practice | studio | 3-5, 6-8 |  | yes | P2 | yes |
| speaking | Studios & practice | practice | all bands | 219 | yes | P2 | yes |
| speak | Studios & practice | studio | all bands | 34 | yes | P2 | yes |
| speaking-task-packs | Studios & practice | tool | all bands |  | yes | P2 | yes |
| survival-vocabulary | Studios & practice | tool | all bands |  | yes | P2 | yes |
| arena | Studios & practice | studio | 3-5, 6-8 | 26 | yes | P2 | yes |
| reading-practice | Studios & practice | practice | all bands | 203 | yes | P2 | yes |
| reading-room | Studios & practice | story | all bands | 213 | yes | P2 | yes |
| ladder | Studios & practice | practice | all bands | 18 | yes | P2 | yes |
| stories | Studios & practice | story | all bands |  | yes | P2 | yes |
| science-of-reading | Studios & practice | studio | all bands |  | yes | P2 | yes |
| mentor | Studios & practice | studio | 3-5, 6-8 | 32 | yes | P2 | yes |
| reader | Studios & practice | tool | all bands |  | yes | P2 | yes |
| writing | Studios & practice | practice | all bands | 222 | yes | P2 | yes |
| write | Studios & practice | studio | all bands | 22 | yes | P2 | yes |
| book-studio | Studios & practice | studio | all bands | 26 | yes | P2 | yes |
| goals | Today & my progress | tool | all bands |  | yes | P2 | yes |
| language-labs | Studios & practice | studio | all bands |  | yes | P2 | yes |
| twr | Studios & practice | studio | all bands | 44 | yes | P2 | yes |
| communication | Studios & practice | studio | all bands | 16 | yes | P2 | yes |
| adventure-worlds | Games & Worlds | world | all bands |  | yes | P2 | yes |
| sentences | Studios & practice | studio | all bands |  | yes | P2 | yes |
| newsroom | Studios & practice | studio | all bands | 48 | yes | P2 | yes |
| scaffold | Studios & practice | tool | all bands |  | yes | P2 | yes |
| evidence | Studios & practice | studio | 3-5, 6-8 |  | yes | P2 | yes |
| construction | Studios & practice | studio | 3-5, 6-8 |  | yes | P2 | yes |
| wordlab | Studios & practice | studio | all bands | 755 | yes | P2 | yes |
| vocabulary | Studios & practice | practice | all bands |  | yes | P2 | yes |
| flashcards | Studios & practice | tool | all bands |  | yes | P2 | yes |
| detective | Studios & practice | studio | all bands | 25 | yes | P2 | yes |
| grammar | Studios & practice | practice | all bands | 7 | yes | P2 | yes |
| library | Studios & practice | tool | all bands |  | yes | P2 | yes |
| language-studios | Studios & practice | studio | all bands |  | yes | P2 | yes |
| units | Studios & practice | studio | all bands | 14 | yes | P2 | yes |
| signal-quest | Games & Worlds | game | 3-5, 6-8 |  | yes | P2 | yes |
| simulations | Games & Worlds | world | all bands |  | yes | P2 | yes |
| language-games | Games & Worlds | game | all bands |  | yes | P2 | yes |
| games | Games & Worlds | game | all bands | 22 | yes | P2 | yes |
| puzzles | Games & Worlds | game | all bands | 61 | yes | P2 | yes |
| quest | Games & Worlds | world | all bands | 10 | yes | P2 | yes |
| city | Games & Worlds | world | all bands | 12 | yes | P2 | yes |
| scenarios | Games & Worlds | world | all bands | 27 | yes | P2 | yes |
| adventures | Games & Worlds | world | all bands |  | yes | P2 | yes |
| language-studio | Games & Worlds | world | all bands |  | yes | P2 | yes |
| learning-studios | Games & Worlds | world | all bands |  | yes | P2 | yes |
| studio-app | Studios & practice | studio | all bands |  | NO | P2 | n/a |
| studio-app-speaking | Studios & practice | studio | all bands |  | NO | P2 | n/a |
| studio-app-writing | Studios & practice | studio | all bands |  | NO | P2 | n/a |
| studio-app-words | Studios & practice | studio | all bands |  | NO | P2 | n/a |
| studio-app-reading | Studios & practice | studio | all bands |  | NO | P2 | n/a |
| studio-app-foundations | Studios & practice | studio | all bands |  | NO | P2 | n/a |
| studio-app-games | Games & Worlds | game | all bands |  | NO | P2 | n/a |
| studio-app-stories | Games & Worlds | story | all bands |  | NO | P2 | n/a |
| studio-app-teacher | For Teachers | guide | all bands |  | NO | P2 | n/a |
| studio-app-family | For Families | guide | all bands |  | NO | P2 | n/a |
| worlds | Games & Worlds | world | all bands |  | yes | P2 | yes |
| exhibition | Games & Worlds | world | all bands |  | yes | P2 | yes |
| reality | Games & Worlds | world | all bands |  | yes | P2 | yes |
| road | Road to ACCESS | test | all bands |  | yes | P2 | yes |
| access-prep | Road to ACCESS | test | all bands | 8 | yes | P2 | yes |
| daily-drill | Road to ACCESS | practice | 3-5, 6-8 |  | yes | P2 | yes |
| extempore-speak | Road to ACCESS | studio | 3-5, 6-8 |  | yes | P2 | yes |
| tests | Road to ACCESS | test | all bands | 17 | yes | P2 | yes |
| assess | Road to ACCESS | test | all bands |  | yes | P2 | yes |
| diagnostic | Road to ACCESS | tool | all bands |  | yes | P2 | yes |
| journey | Today & my progress | progress | all bands |  | yes | P2 | yes |
| journey-map | Today & my progress | progress | all bands |  | yes | P2 | yes |
| pathways | Today & my progress | progress | all bands |  | yes | P2 | yes |
| time-machine | Today & my progress | progress | all bands |  | yes | P2 | yes |
| path | Today & my progress | progress | all bands |  | yes | P2 | yes |
| missions | Today & my progress | studio | all bands | 9 | yes | P2 | yes |
| learn | Today & my progress | studio | all bands |  | yes | P2 | yes |
| growth | Today & my progress | progress | all bands |  | yes | P2 | yes |
| passport | Today & my progress | progress | all bands |  | yes | P2 | yes |
| trip-journal | Today & my progress | progress | all bands |  | yes | P2 | yes |
| choice-boards | Today & my progress | practice | all bands |  | yes | P2 | yes |
| warmup | Today & my progress | practice | all bands |  | yes | P2 | yes |
| portfolio | Today & my progress | progress | all bands |  | yes | P2 | yes |
| collection | Studios & practice | progress | all bands |  | yes | P2 | yes |
| class | Today & my progress | tool | all bands |  | yes | P2 | yes |
| pairs | Today & my progress | tool | all bands |  | yes | P2 | yes |
| scenes | Today & my progress | tool | all bands |  | yes | P2 | yes |
| move | Today & my progress | tool | all bands |  | yes | P2 | yes |
| book-templates | For Teachers | tool | all bands | 26 | yes | P2 | yes |
| start | For Teachers | guide | all bands |  | yes | P2 | yes |
| teacher-hub | For Teachers | tool | all bands |  | yes | P2 | yes |
| wida-data-studio | For Teachers | tool | all bands |  | NO | P2 | n/a |
| teacher-tour | For Teachers | guide | all bands |  | yes | P2 | yes |
| teacher-tour-2 | For Teachers | guide | all bands |  | NO | P2 | n/a |
| classroom | For Teachers | tool | all bands |  | yes | P2 | yes |
| launch | For Teachers | tool | all bands |  | yes | P2 | yes |
| experience-builder | For Teachers | tool | all bands |  | yes | P2 | yes |
| lesson-builder | For Teachers | tool | all bands |  | yes | P2 | yes |
| class-quiz | For Teachers | tool | all bands |  | yes | P2 | yes |
| class-teacher | For Teachers | tool | all bands |  | yes | P2 | yes |
| journey-guide | For Teachers | guide | all bands |  | yes | P2 | yes |
| early | For Teachers | practice | K, 1, 2-3 |  | yes | P2 | yes |
| expedition | For Teachers | guide | all bands |  | yes | P2 | yes |
| family-start | For Families | guide | all bands |  | yes | P2 | yes |
| practice-together | For Families | guide | all bands |  | yes | P2 | yes |
| talk-table | For Families | tool | all bands |  | yes | P2 | yes |
| family-today | For Families | tool | all bands |  | yes | P2 | yes |
| family-corner | For Families | tool | all bands |  | yes | P2 | yes |
| explore | Help | guide | all bands |  | yes | P2 | yes |
| site-guide | Help | guide | all bands |  | yes | P2 | yes |
| videos | Help | guide | all bands |  | yes | P2 | yes |
| privacy | Help | guide | all bands |  | yes | P2 | yes |
| accessibility | Help | guide | all bands |  | yes | P2 | yes |
| search | Help | tool | all bands |  | yes | P2 | yes |
| tools | Help | tool | all bands |  | yes | P2 | yes |
| core-gK-Listening | Core practice bank | practice-bank | K | 9 | yes | P2 | yes |
| core-gK-Reading | Core practice bank | practice-bank | K | 9 | yes | P1 | yes |
| core-gK-Speaking | Core practice bank | practice-bank | K | 9 | yes | P2 | yes |
| core-gK-Writing | Core practice bank | practice-bank | K | 8 | yes | P2 | yes |
| core-g1-Listening | Core practice bank | practice-bank | 1 | 16 | yes | P2 | yes |
| core-g1-Reading | Core practice bank | practice-bank | 1 | 15 | yes | P2 | yes |
| core-g1-Speaking | Core practice bank | practice-bank | 1 | 14 | yes | P2 | yes |
| core-g1-Writing | Core practice bank | practice-bank | 1 | 14 | yes | P2 | yes |
| core-g2-3-Listening | Core practice bank | practice-bank |  | 23 | yes | P2 | yes |
| core-g2-3-Reading | Core practice bank | practice-bank |  | 23 | yes | P2 | yes |
| core-g2-3-Speaking | Core practice bank | practice-bank |  | 22 | yes | P2 | yes |
| core-g2-3-Writing | Core practice bank | practice-bank |  | 22 | yes | P2 | yes |
| core-g3-5-Listening | Core practice bank | practice-bank |  | 75 | yes | P3 | yes |
| core-g3-5-Reading | Core practice bank | practice-bank |  | 78 | yes | P3 | yes |
| core-g3-5-Speaking | Core practice bank | practice-bank |  | 66 | yes | P3 | yes |
| core-g3-5-Writing | Core practice bank | practice-bank |  | 67 | yes | P3 | yes |
| core-g6-8-Listening | Core practice bank | practice-bank |  | 115 | yes | P3 | yes |
| core-g6-8-Model-Test | Core practice bank | practice-bank |  | 51 | yes | P3 | yes |
| core-g6-8-Reading | Core practice bank | practice-bank |  | 78 | yes | P3 | yes |
| core-g6-8-Speaking | Core practice bank | practice-bank |  | 108 | yes | P2 | yes |
| core-g6-8-Writing | Core practice bank | practice-bank |  | 111 | yes | P2 | yes |
| language-adventures:adventures | Language Adventures (Next static export) | adventure mission | see pages | 21 | yes | P2 | yes |
| language-adventures:other | Language Adventures (Next static export) | page | see pages | 6 | yes | P1 | yes |
| language-adventures:hub | Language Adventures (Next static export) | page | see pages | 1 | yes | P2 | yes |
| language-adventures:notes | Language Adventures (Next static export) | teacher note | see pages | 12 | yes | P2 | yes |
| language-adventures:practice | Language Adventures (Next static export) | practice | see pages | 5 | yes | P2 | yes |
| language-adventures:print | Language Adventures (Next static export) | printable | see pages | 11 | yes | P1 | yes |
| language-adventures:studios | Language Adventures (Next static export) | studio | see pages | 13 | yes | P2 | yes |
| language-studio:adventures | Language Studio (Next static export) | adventure mission | see pages | 27 | yes | P2 | yes |
| language-studio:other | Language Studio (Next static export) | page | see pages | 2 | yes | P2 | yes |
| language-studio:hub | Language Studio (Next static export) | page | see pages | 1 | yes | P2 | yes |
| language-studio:notes | Language Studio (Next static export) | teacher note | see pages | 1 | yes | P1 | yes |
| language-studio:practice | Language Studio (Next static export) | practice | see pages | 4 | yes | P2 | yes |
| language-studio:print | Language Studio (Next static export) | printable | see pages | 18 | yes | P2 | yes |
| language-studio:studios | Language Studio (Next static export) | studio | see pages | 13 | yes | P1 | yes |
| esol:hub | ESOL math guides | page | see pages | 1 | yes | P2 | yes |
| esol:reveal-math-guides | ESOL math guides | page | see pages | 43 | yes | P1 | yes |
| wida-access:page | WIDA ACCESS practice (static) | page | see pages | 9 | yes | P1 | yes |
| wida-access:hub | WIDA ACCESS practice (static) | page | see pages | 1 | yes | P1 | yes |
| vocab-hub:hub | Vocab Hub | page | see pages | 1 | yes | P1 | yes |
| esol-reading-writing:page | ESOL reading/writing (static) | page | see pages | 15 | yes | P1 | yes |
| esol-reading-writing:hub | ESOL reading/writing (static) | page | see pages | 1 | yes | P2 | yes |
| teacher-family-static | Teacher tools | static page | see pages | 5 | yes | P2 | yes |
| vocab-hub:bank | Vocab Hub | vocabulary bank app | see app | 396 | yes | P1 | yes |

Untestable or count-only surfaces:

| id | url | reason |
|---|---|---|
| studio-app | /studios/language | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-speaking | /studios/language/speaking | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-writing | /studios/language/writing | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-words | /studios/language/words | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-reading | /studios/language/reading | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-foundations | /studios/language/foundations | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-games | /studios/language/games | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-stories | /studios/language/stories | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-teacher | /studios/language/teacher | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-family | /studios/language/family | Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| wida-data-studio | /access-teacher/predictive/ | WIDA Data Studio (teacher predictive tool) needs roster data entered by the teacher and is outside the student-facing audit surface; shell checked via /access-teacher/. |
| teacher-tour-2 | /access-teacher/predictive/?demo=1&tour=1 | WIDA Data Studio (teacher predictive tool) needs roster data entered by the teacher and is outside the student-facing audit surface; shell checked via /access-teacher/. |
| book-studio:user-books | /access-practice-lab/book-studio/edit\|read\|play\|review/<id> | User-created books live in each browser's IndexedDB (accessPracticeLab-books); no authored books exist to enumerate. Only the 26 templates are enumerable. |
| wordlab:words | /access-practice-lab/wordlab | 755 words / 116 morphemes / 40 detective items enumerated as counts only, not individual records. |
| sentences:rows | /access-practice-lab/sentences | 316 sentence-lab rows + 10 boss paragraphs enumerated as counts only. |

## C. Activity-level findings

Baseline measured content flags for the core practice bank (static analysis of `content/g*/<Domain>.json`):

| flag | activities | of |
|---|---|---|
| hint-equals-support | 85 | 933 |
| directions-long | 41 | 933 |
| no-hint | 21 | 933 |
| thin-vocabulary | 18 | 933 |
| generic-correct-feedback | 8 | 933 |
| answer-is-longest-clue | 2 | 933 |
| no-item-feedback | 1 | 933 |

Core-bank metrics per band x skill family:

| family | n | avg directions words | generic correct % | full distractor fb % | item fb % | hint=support % | WIDA tag % | ES directions % | ES feedback % |
|---|---|---|---|---|---|---|---|---|---|
| core-gK-Listening | 9 | 7.7 | 0 | 100 | 0 | 0 | 100 | 100 | 100 |
| core-gK-Reading | 9 | 9.4 | 22 | 100 | 0 | 0 | 100 | 100 | 100 |
| core-gK-Speaking | 9 | 11.1 | 0 | n/a | 0 | 56 | 100 | 100 | 100 |
| core-gK-Writing | 8 | 10 | 0 | n/a | 0 | 100 | 100 | 100 | 100 |
| core-g1-Listening | 16 | 7.6 | 6 | 100 | 100 | 6 | 100 | 100 | 100 |
| core-g1-Reading | 15 | 7.5 | 33 | 100 | 100 | 7 | 100 | 100 | 100 |
| core-g1-Speaking | 14 | 11.1 | 0 | n/a | 0 | 71 | 100 | 100 | 100 |
| core-g1-Writing | 14 | 12.6 | 0 | n/a | 0 | 86 | 100 | 100 | 100 |
| core-g2-3-Listening | 23 | 10.3 | 0 | 100 | 100 | 9 | 100 | 100 | 100 |
| core-g2-3-Reading | 23 | 9.3 | 0 | 100 | 100 | 9 | 100 | 100 | 100 |
| core-g2-3-Speaking | 22 | 14.1 | 0 | n/a | 0 | 100 | 100 | 100 | 100 |
| core-g2-3-Writing | 22 | 14.8 | 0 | n/a | 0 | 100 | 100 | 100 | 100 |
| core-g3-5-Listening | 75 | 15 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g3-5-Reading | 78 | 13.6 | 0 | 100 | 96 | 0 | 100 | 100 | 100 |
| core-g3-5-Speaking | 66 | 16.1 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g3-5-Writing | 67 | 20.3 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g6-8-Listening | 115 | 15.9 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g6-8-Model-Test | 51 | 12.1 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g6-8-Reading | 78 | 15.8 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g6-8-Speaking | 108 | 20 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |
| core-g6-8-Writing | 111 | 19.8 | 0 | 100 | 100 | 0 | 100 | 100 | 100 |

Area findings (from fragments), by area:

**adventures**: 5 record(s) (upgraded 5).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| wida-access:word-builder | /wida-access/word-builder/ | P1 | upgraded | rebuilt page; earlier version had unverified word parts | word-part data was not checked against meanings | Rebuilt with verified word parts, teaching feedback, retry, saved daily quest. Meaning step still open (see unresolved). | node --test tools/wida-word-builder.test.mjs; tools/language-sibling-sites.test.mjs (word builder test and axe) |
| wida-access:directions-trainer | /wida-access/directions-trainer/ | P1 | upgraded | map places were not keyboard operable; finishing a tier used an alert() | wrong answers did not teach | Map places are keyboard buttons, wrong answers explain, tier completion announced in-page instead of alert(). | tools/language-sibling-sites.test.mjs |
| wida-access:reward-shop | /wida-access/reward-shop/ | P1 | upgraded | locked theme used a dialog |  | Locked theme explains how much XP is needed inline, no dialog. | tools/language-sibling-sites.test.mjs |
| wida-access:skill-pages | /wida-access/{listening,reading,speaking,writing}/ | P1 | upgraded | contrast and ARIA defects |  | Contrast and ARIA fixes. | axe (wcag2a, wcag2aa, wcag22aa) at 1280 in tools/language-sibling-sites.test.mjs |
| esol-reading-writing:studios | /esol-reading-writing/{esolreading,flushbooksummary,twr-math-writing-studio,math-writing}/ | P1 | upgraded | submit and save gave no inline feedback; alert() calls |  | Submit and save give inline status; alert() calls removed (9 removed in the branch diff, 0 added); contrast/ARIA fixes. | tools/language-sibling-sites.test.mjs |

**design**: 4 record(s) (upgraded 3, unchanged 1).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| shell-header-controls | /access-practice-lab/ (all views) | P1 | upgraded | sub-44px touch targets on tablet widths; footer 'Start everything fresh' 27px tall |  | 44px floor under (pointer: coarse) or <1100px; footer controls 44px | browser audit script at 390/768/1280 before and after; axe-sweep; access-comfort-e2e |
| scroll-regions | /access-practice-lab/exhibition/teacher, /reading-room/teacher | P1 | upgraded |  |  | focusableScrollRegions() in src/comfort.js names and focuses sideways-scrolling tables after every render | axe-sweep --width 390 --only teacher: no violations after; 2 violation groups before |
| activity-kit | shared component | P2 | upgraded | no shared 'success looks like' or example slot in directions; feedback panels differed per surface |  | added | tools/access-activity-kit.test.mjs (8 tests) and tools/access-activity-kit-e2e.mjs (axe, 44px, hint flow, states) |
| rooms-bank-player | /access-practice-lab/<Domain>/<Level>/<id> | P2 | unchanged | directions lack a success line and example slot |  | kit available; adoption belongs to the rooms/games agents | axe sweep, screenshots before/after |

**games**: 7 record(s) (upgraded 6, unchanged 1).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| acc-bank-engine | /access-practice-lab/assess/<set id> | P1 | upgraded | focus dropped to <body> after placing a token in matching/sorting (keyboard users lost their place) | 15 wrong-choice notes of 4-7 words ('Nobody mentions a race.') too thin to teach | fixed focus management; rewrote 15 notes; extended bank validator | validate-access-bank (0 errors, 320 items), access-acc-bank/engine/feedback tests, access-acc-bank-e2e, new access-acc-keyboard-e2e at 390 and 1280 |
| sentence-strategy | /access-practice-lab/games/sentence-strategy | P1 | upgraded |  | key was the longest option in 16 of 18 rounds and distractors were one-line strawmen ('Water is wet and clear.') | rewrote distractors in 16 rounds (EN+ES), equalised length, made each wrong choice a real misconception (fact vs opinion, no reason, new point instead of closing); explanations rewritten | item test, validate-access-game-studio (choice balance), access-game-studio-contract, access-games-keyboard-e2e |
| escape-room | /access-practice-lab/games/escape-room | P1 | upgraded |  | long-key distractors, vague 'stuff' distractors | 6 rounds rewritten | item test, studio playthrough, keyboard e2e |
| language-expeditions | /access-practice-lab/games/language-expeditions | P1 | upgraded |  | dialogue distractors were absurd non-sequiturs ('Data is a long word.') so listening was optional | 11 dialogue turns + 1 read act rewritten; wrong replies now fail on tense, wrong question type, wrong perspective or a contradiction of what was heard (EN+ES) | item test, studio playthrough |
| word-jeopardy,sentence-factory,language-arcade | /access-practice-lab/games/<id> | P1 | upgraded | word-jeopardy gave +50 for three no-hint answers in a row (penalised using hints, streak reset) | short, odd-one-out distractors | distractors rewritten (5 rounds + final); jeopardy streak bonus and streak chip removed | item test, validate-game-rules, studio playthrough, keyboard e2e |
| grammar-jungle,story-detective,story-world,story-creator,read-along-theater,match-mania | /access-practice-lab/games/<id> | P1 | upgraded | reset-on-miss streak/combo counters ('N in a row', 'Understanding streak', 'Spotlight streak') are a punitive mechanic |  | counters are now cumulative first-try / worked-out tallies that a miss never resets; 'in a row' and combo chips removed | access-games-keyboard-e2e asserts no streak language; studio playthrough; access-games-e2e |
| other 11 games (vocab-quest, sound-word-studio, fluency-echo, word-search-adventure, word-bingo, spelling-expedition, mystery-word, connector-climb, direction-dash, evidence-hunt, ...) | /access-practice-lab/games/<id> | P3 | unchanged |  | choice rounds audited by item test: no duplicate options, keys in range, hints do not leak keys; word-bingo content judged sound | audited, no change | item test + studio playthrough 22 games x 2 bands x 3 modes |

**genpath**: 5 record(s) (upgraded 3, unchanged 2).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| adaptive-missions | /access-practice-lab/missions/<id> | P1 | upgraded |  | 12 evidence tasks had no explanation of why statements support the idea; 2 question explanations under 60 chars (shade-r-q3, nook-r-q3) | rewrote 14 explanations, rebuilt feedback, tightened validator | tools/missions-feedback.test.mjs, tools/missions-feedback-e2e.mjs (390/1280), validate-access-studio |
| quest-missions | /access-practice-lab/quest/<id> | P1 | upgraded |  | 12 check items confirmed right with a generic sentence | authored 12 why lines; validateMission now requires why, distinct options, feedback of 5+ words on wrong options | tools/validate-quest.mjs, tools/quest-engine.test.mjs |
| experience-compiler | /access-practice-lab/experience-builder | P1 | upgraded |  |  | option reply teaches how to test a choice against evidence; fallback suggests what to ask; new validator rules | tools/compiler.test.mjs, tools/experience-compat.test.mjs, tools/access-experience.test.mjs |
| flagship-simulation | /access-practice-lab/simulations/city-that-stopped-talking | P3 | unchanged |  |  | none | node tools/sim-e2e.mjs passed |
| worlds-pathways-intel-early-prep | various | P2 | unchanged |  |  | none | baseline tests only (pathways, lesson-builder, intel-engine) |

**integration**: 0 record(s).

_None reported._

**inventory**: 162 record(s) (unchanged 150, untestable 12).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| reading-path | /access-practice-lab/reading-path | P2 | unchanged | 9 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| newcomer-packs | /access-practice-lab/packs | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| print-studio | /access-practice-lab/print-studio | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| el-program | /access-practice-lab/program | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| live-speaking | /access-practice-lab/live | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| partner-talk | /access-practice-lab/partner | P2 | unchanged | 1 targets under 24px at 390px (WCAG 2.2 minimum); 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| listening | /access-practice-lab/Listening | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| voice | /access-practice-lab/voice | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| conversation | /access-practice-lab/conversation | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| speaking | /access-practice-lab/Speaking | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| speak | /access-practice-lab/speak | P2 | unchanged | 9 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| speaking-task-packs | /access-practice-lab/task-packs | P2 | unchanged | 4 targets under 24px at 390px (WCAG 2.2 minimum); 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| survival-vocabulary | /access-practice-lab/packs/survival-vocabulary | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| arena | /access-practice-lab/arena | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| reading-practice | /access-practice-lab/Reading | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| reading-room | /access-practice-lab/reading-room | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| ladder | /access-practice-lab/ladder | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| stories | /access-practice-lab/stories | P2 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 6 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| science-of-reading | /access-practice-lab/science-of-reading | P2 | unchanged | 1 targets under 24px at 390px (WCAG 2.2 minimum); 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| mentor | /access-practice-lab/mentor | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| reader | /access-practice-lab/reader | P2 | unchanged | 41 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| writing | /access-practice-lab/Writing | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| write | /access-practice-lab/write | P2 | unchanged | 10 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| book-studio | /access-practice-lab/book-studio | P2 | unchanged | 11 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| goals | /access-practice-lab/goals | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-labs | /access-practice-lab/language-labs | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| twr | /access-practice-lab/twr | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| communication | /access-practice-lab/communication | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| adventure-worlds | /access-practice-lab/adventures | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| sentences | /access-practice-lab/sentences | P2 | unchanged | 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| newsroom | /access-practice-lab/newsroom | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| scaffold | /access-practice-lab/scaffold | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| evidence | /access-practice-lab/evidence | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| construction | /access-practice-lab/construction | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| wordlab | /access-practice-lab/wordlab | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| vocabulary | /access-practice-lab/vocabulary | P2 | unchanged | 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| flashcards | /access-practice-lab/flashcards | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| detective | /access-practice-lab/detective | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| grammar | /access-practice-lab/grammar | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| library | /access-practice-lab/library | P2 | unchanged | 19 targets under 24px at 390px (WCAG 2.2 minimum); 28 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studios | /access-practice-lab/language-studios | P2 | unchanged | 1 targets under 24px at 390px (WCAG 2.2 minimum); 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| units | /access-practice-lab/units | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| signal-quest | /language-adventures/signal-quest/ | P2 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 2 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| simulations | /access-practice-lab/simulations | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-games | /access-practice-lab/language-games | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| games | /access-practice-lab/games | P2 | unchanged | 53 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| puzzles | /access-practice-lab/puzzles | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| quest | /access-practice-lab/quest | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| city | /access-practice-lab/city | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| scenarios | /access-practice-lab/scenarios | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| adventures | /language-adventures/ | P2 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 27 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio | /language-studio/ | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| learning-studios | /learning-studios/ | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| studio-app | /studios/language | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-speaking | /studios/language/speaking | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-writing | /studios/language/writing | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-words | /studios/language/words | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-reading | /studios/language/reading | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-foundations | /studios/language/foundations | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-games | /studios/language/games | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-stories | /studios/language/stories | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-teacher | /studios/language/teacher | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| studio-app-family | /studios/language/family | P2 | untestable |  |  | document only | untestable: Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server. |
| worlds | /access-practice-lab/worlds | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| exhibition | /access-practice-lab/exhibition | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| reality | /access-practice-lab/reality | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| road | /access-practice-lab/road | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| access-prep | /access-practice-lab/access-prep | P2 | unchanged | 16 targets under 24px at 390px (WCAG 2.2 minimum); 38 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| daily-drill | /access-practice-lab/access-prep/daily-drill | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| extempore-speak | /access-practice-lab/access-prep/extempore-speak | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| tests | /access-practice-lab/tests | P2 | unchanged | 7 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| assess | /access-practice-lab/assess | P2 | unchanged | 1 targets under 24px at 390px (WCAG 2.2 minimum); 7 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| diagnostic | /access-practice-lab/diagnostic | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| journey | /access-practice-lab/journey | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| journey-map | /access-practice-lab/journey/map | P2 | unchanged | 25 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| pathways | /access-practice-lab/pathways | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| time-machine | /access-practice-lab/time-machine | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| path | /access-practice-lab/path | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| missions | /access-practice-lab/missions | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| learn | /access-practice-lab/learn | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| growth | /access-practice-lab/growth | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| passport | /access-practice-lab/passport | P2 | unchanged | 152 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| trip-journal | /access-practice-lab/passport/journal | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| choice-boards | /access-practice-lab/choice-boards | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| warmup | /access-practice-lab/warmup | P2 | unchanged | 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| portfolio | /access-practice-lab/portfolio | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| collection | /access-practice-lab/collection | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| class | /access-practice-lab/class | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| pairs | /access-practice-lab/pairs | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| scenes | /access-practice-lab/scenes | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| move | /access-practice-lab/move | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| book-templates | /access-practice-lab/book-studio/templates | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| start | /access-practice-lab/start | P2 | unchanged | 6 targets under 24px at 390px (WCAG 2.2 minimum); 17 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| teacher-hub | /access-teacher/ | P2 | unchanged | 9 targets under 24px at 390px (WCAG 2.2 minimum); 10 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| wida-data-studio | /access-teacher/predictive/ | P2 | untestable |  |  | document only | untestable: WIDA Data Studio (teacher predictive tool) needs roster data entered by the teacher and is outside the student-facing audit surface; shell checked via /access-teacher/. |
| teacher-tour | /access-practice-lab/start/tour | P2 | unchanged | 2 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| teacher-tour-2 | /access-teacher/predictive/?demo=1&tour=1 | P2 | untestable |  |  | document only | untestable: WIDA Data Studio (teacher predictive tool) needs roster data entered by the teacher and is outside the student-facing audit surface; shell checked via /access-teacher/. |
| classroom | /access-practice-lab/classroom | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| launch | /access-practice-lab/launch-studio | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| experience-builder | /access-practice-lab/experience-builder | P2 | unchanged | 1 targets under 24px at 390px (WCAG 2.2 minimum); 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| lesson-builder | /access-practice-lab/lesson-builder | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| class-quiz | /access-practice-lab/class/quiz | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| class-teacher | /access-practice-lab/class/teacher | P2 | unchanged | 1 failed request(s); 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| journey-guide | /access-practice-lab/journey/guide | P2 | unchanged | 11 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| early | /access-practice-lab/early?grades=K | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| expedition | /access-expedition/ | P2 | unchanged |  |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| family-start | /access-practice-lab/family-start | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| practice-together | /access-practice-lab/practice-together | P2 | unchanged |  |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| talk-table | /access-practice-lab/talk-table | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| family-today | /access-practice-lab/family/today | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| family-corner | /access-practice-lab/family | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| explore | /access-practice-lab/explore | P2 | unchanged | 32 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| site-guide | /access-practice-lab/site-guide | P2 | unchanged | 1 targets under 24px at 390px (WCAG 2.2 minimum); 5 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| videos | /access-practice-lab/videos/ | P2 | unchanged | 1 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| privacy | /access-practice-lab/privacy | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| accessibility | /access-practice-lab/accessibility | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| search | /access-practice-lab/search | P2 | unchanged | focus indicator not visible on 1 probe(s); 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| tools | /access-practice-lab/tools | P2 | unchanged | 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-gK-Listening | /access-practice-lab/Listening/A?grades=K | P2 | unchanged | 8 touch targets < 44px at 390px | only 0% of order/cloze/sort items have per-item feedback; only 0% of constructed items carry success criteria | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-gK-Reading | /access-practice-lab/Reading/A?grades=K | P1 | unchanged |  | 22% of correct-answer feedback is generic or under 4 words; only 0% of order/cloze/sort items have per-item feedback; only 0% of constructed items carry success criteria | audit + upgrade | static enumeration; crawl pending |
| core-gK-Speaking | /access-practice-lab/Speaking/A?grades=K | P2 | unchanged | 4 touch targets < 44px at 390px | only 0% of order/cloze/sort items have per-item feedback; 56% of items repeat the hint verbatim as support | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-gK-Writing | /access-practice-lab/Writing/A?grades=K | P2 | unchanged |  | only 0% of order/cloze/sort items have per-item feedback; 100% of items repeat the hint verbatim as support | audit + upgrade | static enumeration; crawl pending |
| core-g1-Listening | /access-practice-lab/Listening/A?grades=1 | P2 | unchanged | 12 touch targets < 44px at 390px | 6% of correct-answer feedback is generic or under 4 words; only 0% of constructed items carry success criteria | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g1-Reading | /access-practice-lab/Reading/A?grades=1 | P2 | unchanged |  | 33% of correct-answer feedback is generic or under 4 words; only 0% of constructed items carry success criteria | audit + upgrade | static enumeration; crawl pending |
| core-g1-Speaking | /access-practice-lab/Speaking/A?grades=1 | P2 | unchanged | 4 touch targets < 44px at 390px | only 0% of order/cloze/sort items have per-item feedback; 71% of items repeat the hint verbatim as support | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g1-Writing | /access-practice-lab/Writing/A?grades=1 | P2 | unchanged |  | only 0% of order/cloze/sort items have per-item feedback; 86% of items repeat the hint verbatim as support | audit + upgrade | static enumeration; crawl pending |
| core-g2-3-Listening | /access-practice-lab/Listening/A?grades=undefined | P2 | unchanged | 12 touch targets < 44px at 390px | only 0% of constructed items carry success criteria | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g2-3-Reading | /access-practice-lab/Reading/A?grades=undefined | P2 | unchanged |  | only 0% of constructed items carry success criteria | audit + upgrade | static enumeration; crawl pending |
| core-g2-3-Speaking | /access-practice-lab/Speaking/A?grades=undefined | P2 | unchanged | 4 touch targets < 44px at 390px | only 0% of order/cloze/sort items have per-item feedback; 100% of items repeat the hint verbatim as support | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g2-3-Writing | /access-practice-lab/Writing/A?grades=undefined | P2 | unchanged |  | only 0% of order/cloze/sort items have per-item feedback; 100% of items repeat the hint verbatim as support | audit + upgrade | static enumeration; crawl pending |
| core-g3-5-Listening | /access-practice-lab/Listening/A?grades=undefined | P3 | unchanged | 27 touch targets < 44px at 390px |  | monitor | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g3-5-Reading | /access-practice-lab/Reading/A?grades=undefined | P3 | unchanged | 4 touch targets < 44px at 390px |  | monitor | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g3-5-Speaking | /access-practice-lab/Speaking/A?grades=undefined | P3 | unchanged |  |  | monitor | static enumeration; crawl pending |
| core-g3-5-Writing | /access-practice-lab/Writing/A?grades=undefined | P3 | unchanged | 4 touch targets < 44px at 390px |  | monitor | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g6-8-Listening | /access-practice-lab/Listening/A?grades=undefined | P3 | unchanged | 34 touch targets < 44px at 390px |  | monitor | Playwright crawl (390/768/1280, console, axe) + content metrics |
| core-g6-8-Model-Test | /access-practice-lab/Model-Test/A?grades=undefined | P3 | unchanged |  |  | monitor | static enumeration; crawl pending |
| core-g6-8-Reading | /access-practice-lab/Reading/A?grades=undefined | P3 | unchanged |  |  | monitor | static enumeration; crawl pending |
| core-g6-8-Speaking | /access-practice-lab/Speaking/A?grades=undefined | P2 | unchanged |  | 21% of directions exceed 28 words | audit + upgrade | static enumeration; crawl pending |
| core-g6-8-Writing | /access-practice-lab/Writing/A?grades=undefined | P2 | unchanged |  | 12% of directions exceed 28 words | audit + upgrade | static enumeration; crawl pending |
| language-adventures:adventures | /language-adventures/adventures/communication-lab/cl-01/ | P2 | unchanged | 8 targets under 24px at 390px (WCAG 2.2 minimum); 38 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-adventures:other | /language-adventures/arcade/ | P1 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 4 serious/critical axe violation(s): color-contrast; 30 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-adventures:hub | /language-adventures/ | P2 | unchanged | 4 targets under 24px at 390px (WCAG 2.2 minimum); 54 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-adventures:notes | /language-adventures/notes/cl-01/ | P2 | unchanged | 4 targets under 24px at 390px (WCAG 2.2 minimum); 30 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-adventures:practice | /language-adventures/practice/ | P2 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 26 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-adventures:print | /language-adventures/print/cl-01/ | P1 | unchanged | 4 targets under 24px at 390px (WCAG 2.2 minimum); 4 serious/critical axe violation(s): aria-prohibited-attr; 26 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-adventures:studios | /language-adventures/studios/cohesion-xray/ | P2 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 50 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:adventures | /language-studio/adventures/communication-lab/cl-01/ | P2 | unchanged | 28 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:other | /language-studio/arcade/ | P2 | unchanged | 12 targets under 24px at 390px (WCAG 2.2 minimum); 74 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:hub | /language-studio/ | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:notes | /language-studio/notes/ | P1 | unchanged | horizontal overflow at 390px; 4 serious/critical axe violation(s): label; 22 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:practice | /language-studio/practice/listening/ | P2 | unchanged | 8 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:print | /language-studio/print/cl-01/ | P2 | unchanged | 20 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| language-studio:studios | /language-studio/studios/audience-card/ | P1 | unchanged | 4 serious/critical axe violation(s): label; 10 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| esol:hub | /esol/ | P2 | unchanged | 2 failed request(s); 2 targets under 24px at 390px (WCAG 2.2 minimum); 10 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| esol:reveal-math-guides | /esol/reveal-math-guides/ | P1 | unchanged | 2 failed request(s); 2 targets under 24px at 390px (WCAG 2.2 minimum); 4 serious/critical axe violation(s): color-contrast; 4 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| wida-access:page | /wida-access/directions-trainer/ | P1 | unchanged | 2 failed request(s); 4 serious/critical axe violation(s): color-contrast; 6 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| wida-access:hub | /wida-access/ | P1 | unchanged | 12 targets under 24px at 390px (WCAG 2.2 minimum); horizontal overflow at 768px; 4 serious/critical axe violation(s): color-contrast; 72 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| vocab-hub:hub | /vocab-hub/ | P1 | unchanged | 4 targets under 24px at 390px (WCAG 2.2 minimum); 2 serious/critical axe violation(s): button-name; 1596 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| esol-reading-writing:page | /esol-reading-writing/esolreading/ | P1 | unchanged | 2 failed request(s); 4 targets under 24px at 390px (WCAG 2.2 minimum); 4 serious/critical axe violation(s): color-contrast; 6 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| esol-reading-writing:hub | /esol-reading-writing/ | P2 | unchanged | 2 failed request(s); 2 targets under 24px at 390px (WCAG 2.2 minimum); 12 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| teacher-family-static | /access-teacher/ | P2 | unchanged | 18 targets under 24px at 390px (WCAG 2.2 minimum); 20 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |
| vocab-hub:bank | /vocab-hub/ | P1 | unchanged | 2 targets under 24px at 390px (WCAG 2.2 minimum); 1 serious/critical axe violation(s): button-name; 798 touch targets < 44px at 390px |  | audit + upgrade | Playwright crawl (390/768/1280, console, axe) + content metrics |

**listenspeak**: 6 record(s) (upgraded 4, unchanged 1, untestable 1).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| voice-retell-listen | /voice/retell/<id> | P1 | upgraded | single Listen button, no speed or part replay; transcript hidden until after speaking; no purpose, vocabulary prep, success criteria or second-attempt guidance | retell sources were single-narrator; no comprehension check | Rebuilt as Prepare/Speak/Review/Improve with a shared listening card; 3 new authentic listening tasks (announcement, interview, directions dialogue) | tools/access-voice-listen.test.mjs + tools/access-voice-listen-e2e.mjs (Chromium 1280/390, stubbed speechSynthesis, keyboard, mic denied, axe 2.2 AA, console) |
| speak-audio-stimulus | /speak/<task> | P1 | upgraded | single Listen button; some speaker labels read aloud as text; no speed or part replay | no comprehension check before speaking | Same listening card; listenFor and 2 check questions on all 9 audio tasks; opening the transcript is recorded as a support so the ledger shows supported, not independent | tools/access-voice-listen.test.mjs + tools/access-voice-listen-e2e.mjs (Chromium 1280/390, stubbed speechSynthesis, keyboard, mic denied, axe 2.2 AA, console) |
| listening-bank-g68-A | /learn (grades 6-8 Listening level A) | P1 | upgraded |  | 11-15 word isolated sentences; exit-ticket prompt asked 'first step' that a fuller script would contradict | Rewrote 4 isolated-sentence scripts into short spoken announcements and directions; fixed an ambiguous prompt in exit-ticket | validate-access-lab, validate-access-bank, access-lab-index --check, access-listening-strategy test |
| listening-player-fallback | shared listenPlayerHTML | P1 | upgraded | only 'ask your teacher' |  | Practice mode shows the script with a note that this is reading, not listening; not shown under test conditions | access-acc-audio and access-listening-strategy tests; node unit test without window |
| voice-ladder-sounds-shadow-read | /voice/ladder\|sounds\|shadow\|read\|keys | P3 | unchanged |  |  | Audited, not changed (model student, frames, Spanish tips, honest length meter already present) | code read; access-lab-voice and access-lab-voice-views tests pass |
| language-city-scenarios | /city, /scenarios | P3 | untestable |  |  | Not audited in this pass | access-language-city and access-scenarios tests pass; no browser review of these pages |

**reading**: 7 record(s) (upgraded 4, unchanged 3).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| reading-room-lessons-k5 | /access-practice-lab/reading-room/<id> | P1 | upgraded |  | bland predictable 85-100 word passages; absurd distractors; key usually longest/first | 10 passages rewritten as original multi-paragraph texts across varied contexts, mixed question types | reading-room-quality.test, validate-reading-room, reading-room e2e |
| reading-room-lessons-68-912 | /access-practice-lab/reading-room/<id> | P1 | upgraded |  | wrong choices without teaching note; generic guiding questions; praise-opening rationales shown on wrong answers; key position/length bias | every wrong choice has a why note; specific guiding questions; evidence hints; balanced keys | quality ratchet over 183 lessons, 0 debt |
| reading-room-lessons-existing | /access-practice-lab/reading-room/rr-existing-* | P1 | upgraded |  | 235 templated guiding questions; 52 rationales opened with praise; no distractor feedback | 61 lessons patched (passages unchanged; derived from source practice activities) | quality ratchet |
| reading-room-reader | /access-practice-lab/reading-room/<id> | P0 | upgraded |  | evidence activity never said right/wrong and showed only 'Paragraph N'; explanation (which states the key) shown on first miss; stale feedback stayed after changing answer; cloze/order/sort feedback gave no diagnostic; open response had no check/revise loop; vocabulary only in a separate list; evidence handler hard-coded revision 1.0.0 key | tiered feedback, evidence highlighting + sentence picker, inline glosses, write-check-revise with first-draft history, stale-feedback reset, revision-safe evidence key | access-reading-room-loop-e2e at 390 and 1280 incl. axe; access-reading-room-e2e |
| reading-room-adventures-strategies | /access-practice-lab/reading-room/adventures, /strategies | P3 | unchanged |  |  | not changed | not audited beyond existing validators |
| reading-path-phonics | /access-practice-lab/reading-path | P3 | unchanged |  |  | not audited in depth | validate-reading-path not re-run |
| book-studio | /access-practice-lab/book-studio/* | P2 | unchanged |  | no regression pin for teacher-authored rendering | added render regression over 26 templates x en/es plus v1/v2 saved-book fixtures; no Book Studio behavior changed | book-render-regression.test, book-studio.test |

**vocab**: 7 record(s) (upgraded 6, unchanged 1).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| wordlab-explore | /access-practice-lab/wordlab/explore | P1 | upgraded |  | 22 examples too short or trivial; circular/incorrect definitions (compare, matter, multiply, tone); bisector/mode/solve keyed wrong for Spanish twin | Added Go deeper panel; rewrote records | jsdom test + Playwright 390/1280 + axe |
| wordlab-garden | /access-practice-lab/wordlab/garden | P1 | upgraded |  | only meaning/Spanish/blank questions; distractors ignored grade band | Four-step path, collocation/relation/sense tasks, sentence check with honest criteria, transfer to other subjects incl. speaking self-report, optional mixed review that never moves the 1/3/7/14 schedule | tools/access-wordlab-depth.test.mjs (11) + Playwright keyboard + reload persistence |
| wordlab-frayer | /access-practice-lab/wordlab/frayer | P2 | upgraded |  |  | Shows authored near non-example to compare after the card is complete | wordlab tests + studios-b e2e |
| word-builder | /access-practice-lab/vocabulary | P0 | upgraded | 60-second Word Sprint with clock, best score and Time is up screen | only 12 and 10 items | Replaced the timed sprint with an untimed six-word Word Round (no best score); 18 items per band | access-word-sprint tests (5), Playwright no clock, axe |
| vocab-hub | /vocab-hub/ | P1 | upgraded | running elapsed-time clock in match game; bare Nice/Try again feedback |  | Removed clock; specific match and miss feedback | node --check, Playwright load, clock element absent; quiz and quest not changed |
| esol-vocab-scrambler | /esol-vocab-scrambler/ | P0 | upgraded | drag-only matching; div tiles not focusable; alert() at end; contrast 4.34 | 2 rounds | Select-then-place matching, buttons, status region, 4 rounds | Playwright keyboard match + axe |
| inline-glossary | (in-page) | P3 | unchanged |  |  | none | access-glossary.test.mjs passes |

**writing**: 8 record(s) (upgraded 5, unchanged 2, blocked 1).

| id | url | priority | status | design issues | content issues | action | verification |
|---|---|---|---|---|---|---|---|
| sentences-build | /access-practice-lab/sentences | P0 | upgraded |  | only 5 of 316 tasks had alternates, so valid reorderings were rejected | checkBuild now accepts equivalent constructions (movable details, and/or clause swap, because/although front or back with comma rule) | tools/access-writing-checkers.test.mjs; access-craft-studios.test.mjs; access-craft-studios-e2e.mjs |
| scaffold-language-upgrade | /access-practice-lab/scaffold/language-upgrade | P0 | upgraded |  | detail passed on word count alone; repeated words or a dangling connector could pass | checkUpgrade requires new distinct content words and a connector with ideas on both sides | access-writing-checkers.test.mjs padding/repetition cases |
| mentor-try-it | /access-practice-lab/mentor/try/<move> | P1 | upgraded |  | empty box with a one-line prompt; no audience/purpose; models for prec 'Mia came...' failed own check; hard-coded index 1 in onInput | rewrote all 32 tasks with audience, given sentence or frame, success criteria; fixed checks | browser: draft persists across reload, keyboard check, axe; unit tests |
| newsroom | /access-practice-lab/newsroom/<id> | P1 | upgraded |  | one-sentence 'imagine' seeds; writer invented every fact | added reporter's notes (4 specifics + quote/counterpoint) to all 48 prompts; observe() reports notes used and word-for-word copying | access-newsroom.test.mjs; new tests; browser notes visible |
| detective | /access-practice-lab/detective/<pattern> | P1 | upgraded |  | transfer success message implied the rule was used correctly when only absence of errors was checked | transfer self-check steps and honest message | source review; not browser-run |
| writing-studio | /access-practice-lab/write | P2 | unchanged |  | only 6 tasks for 3-5 | audited, already has scenario, sources, organizer, criteria, revision prompts | twr-writing, access-writing-transfer tests pass |
| arena | /access-practice-lab/arena | P3 | unchanged |  |  | audited | access-craft-studios-e2e.mjs |
| twr | /access-practice-lab/twr | P1 | blocked |  | no generative writing item kind | not changed: needs a new item kind in src/twr (outside owned paths) | twr-content, twr-writing tests pass |

## D. Original scores (baseline)

Rubric: `RUBRIC.md` (A-K, weights in `rubric.json`). Columns A-K are the 1-5 scores; overall is weighted. Basis and evidence per score are in `baseline-scores.json`.

| family | A | B | C | D | E | F | G | H | I | J | K | overall |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| core-gK-Listening | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| core-gK-Reading | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| core-gK-Speaking | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| core-gK-Writing | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| core-g1-Listening | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 3.3 |
| core-g1-Reading | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 3.3 |
| core-g1-Speaking | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| core-g1-Writing | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 2.9 |
| core-g2-3-Listening | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.4 |
| core-g2-3-Reading | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.4 |
| core-g2-3-Speaking | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 4 | 2.9 |
| core-g2-3-Writing | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 4 | 2.9 |
| core-g3-5-Listening | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| core-g3-5-Reading | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| core-g3-5-Speaking | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| core-g3-5-Writing | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.1 |
| core-g6-8-Listening | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| core-g6-8-Model-Test | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 3.1 |
| core-g6-8-Reading | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| core-g6-8-Speaking | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.1 |
| core-g6-8-Writing | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.1 |
| studio-speaking | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 2 | 4 | 4 | 3.4 |
| studio-writing | 3 | 4 | 3 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 4 | 3.6 |
| newsroom-arena-mentor | 3 | 4 | 3 | 4 | 4 | 2 | 3 | 3 | 3 | 4 | 3 | 3.3 |
| voice-conversation | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3.3 |
| words-and-grammar | 3 | 4 | 3 | 4 | 4 | 3 | 4 | 4 | 3 | 4 | 3 | 3.6 |
| worlds-and-games | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 2 | 4 | 3 | 3.3 |
| road-tests-prep | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | 4 | 4 | 3.3 |
| progress-and-planning | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 2 | 4 | 3 | 3.4 |
| reading | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 4 | 2 | 4 | 4 | 3.5 |
| book-studio | 3 | 4 | 3 | 5 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3.4 |
| home-nav-help | 4 | 4 | 4 | 3 | 3 | 3 | - | - | 2 | 4 | 4 | partial |
| teacher-tools | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 4 | 2 | 4 | 3 | 3.4 |
| family | 3 | 4 | 4 | 4 | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 3.5 |
| static-adventures | 2 | 4 | 3 | 4 | 3 | 2 | - | - | 1 | 4 | 3 | partial |
| static-wida-esol | 2 | 3 | 3 | 3 | 3 | 3 | - | - | 1 | 3 | 2 | partial |

Mean by dimension: A Visual design 3; B Writing / language quality 3.4; C Directions clarity 3.2; D Engagement and authenticity 3.3; E Instructional rigor 3.2; F Interaction design 2.9; G Feedback quality 2.9; H WIDA / ESOL scaffolding 3.8; I Accessibility (WCAG 2.2 AA) 2.7; J Age appropriateness 3.6; K Cross-template consistency 3.7.

Area-reported before scores:

| area | entry | A | B | C | D | E | F | G | H | I | J | K | overall |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| design | shared chrome | 4 | 0 | 3 | 3 | 0 | 3 | 3 | 3 | 3 | 4 | 3 | 2.1 |
| games | acc-bank-engine | 3 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 3.8 |
| games | sentence-strategy | 3 | 3 | 4 | 3 | 2 | 3 | 4 | 4 | 4 | 3 | 4 | 3.2 |
| games | language-expeditions dialogue | 3 | 3 | 4 | 3 | 2 | 3 | 4 | 4 | 4 | 3 | 4 | 3.2 |
| games | streak games | 3 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | 3 | 3 | 3.8 |
| genpath | adaptive-missions | 3 | 4 | 4 | 4 | 4 | 3 | 3 | 4 | 4 | 4 | 4 | 3.7 |
| genpath | quest-missions | 3 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 3.9 |
| genpath | experience-compiler | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 4 | 3 | 4 | 3 |
| inventory | core-gK-Listening | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| inventory | core-gK-Reading | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| inventory | core-gK-Speaking | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| inventory | core-gK-Writing | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| inventory | core-g1-Listening | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 3.3 |
| inventory | core-g1-Reading | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 3.3 |
| inventory | core-g1-Speaking | 3 | 3 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 3 |
| inventory | core-g1-Writing | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 4 | 3 | 4 | 4 | 2.9 |
| inventory | core-g2-3-Listening | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.4 |
| inventory | core-g2-3-Reading | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.4 |
| inventory | core-g2-3-Speaking | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 4 | 2.9 |
| inventory | core-g2-3-Writing | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 4 | 2.9 |
| inventory | core-g3-5-Listening | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| inventory | core-g3-5-Reading | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| inventory | core-g3-5-Speaking | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| inventory | core-g3-5-Writing | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.1 |
| inventory | core-g6-8-Listening | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| inventory | core-g6-8-Model-Test | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 3.1 |
| inventory | core-g6-8-Reading | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.2 |
| inventory | core-g6-8-Speaking | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.1 |
| inventory | core-g6-8-Writing | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 3.1 |
| inventory | studio-speaking | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 2 | 4 | 4 | 3.4 |
| inventory | studio-writing | 3 | 4 | 3 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 4 | 3.6 |
| inventory | newsroom-arena-mentor | 3 | 4 | 3 | 4 | 4 | 2 | 3 | 3 | 3 | 4 | 3 | 3.3 |
| inventory | voice-conversation | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3.3 |
| inventory | words-and-grammar | 3 | 4 | 3 | 4 | 4 | 3 | 4 | 4 | 3 | 4 | 3 | 3.6 |
| inventory | worlds-and-games | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 2 | 4 | 3 | 3.3 |
| inventory | road-tests-prep | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | 4 | 4 | 3.3 |
| inventory | progress-and-planning | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 2 | 4 | 3 | 3.4 |
| inventory | reading | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 4 | 2 | 4 | 4 | 3.5 |
| inventory | book-studio | 3 | 4 | 3 | 5 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3.4 |
| inventory | home-nav-help | 4 | 4 | 4 | 3 | 3 | 3 | - | - | 2 | 4 | 4 | partial |
| inventory | teacher-tools | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 4 | 2 | 4 | 3 | 3.4 |
| inventory | family | 3 | 4 | 4 | 4 | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 3.5 |
| inventory | static-adventures | 2 | 4 | 3 | 4 | 3 | 2 | - | - | 1 | 4 | 3 | partial |
| inventory | static-wida-esol | 2 | 3 | 3 | 3 | 3 | 3 | - | - | 1 | 3 | 2 | partial |
| listenspeak | voice-retell-listen | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 2.4 |
| listenspeak | speak-audio-stimulus | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 3.3 |
| listenspeak | listening-bank-g68-A | 3 | 2 | 3 | 2 | 2 | 3 | 4 | 4 | 3 | 3 | 3 | 2.8 |
| reading | reading-room reader | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 2.8 |
| reading | reading-room K-5 passages | 3 | 2 | 3 | 2 | 2 | 3 | 2 | 3 | 3 | 3 | 3 | 2.5 |
| vocab | Word Lab garden | 3 | 3 | 3 | 2 | 2 | 3 | 2 | 3 | 4 | 4 | 3 | 2.7 |
| vocab | Word Builder | 3 | 3 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 4 | 3 | 2.8 |
| vocab | Scrambler | 2 | 2 | 2 | 3 | 2 | 1 | 1 | 2 | 1 | 3 | 2 | 1.8 |
| writing | sentence-build | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3.1 |
| writing | language-upgrade | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| writing | mentor-try-it | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2.7 |
| writing | newsroom | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 3.1 |
| writing | detective-transfer | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |

## E. Problems found

- adventures: Sibling static sites used alert() for feedback (9 removed in the diff against origin/main, none added)
- adventures: Directions Trainer map places were not keyboard buttons
- adventures: Word Builder word parts were not verified
- adventures: Contrast and ARIA defects on wida-access and esol-reading-writing pages
- design: Header controls (EN/ES/EN+ES, search/read/voice/comfort icon buttons, More, grade select) 34-40px at 768 and 1280; footer start-fresh button 27px tall
- design: Two teacher tables scroll sideways at 390 with no keyboard access (axe scrollable-region-focusable); assets/mobile-access.css turns every table into a scroller
- design: No shared directions card with a success line or example; feedback, hint and progress markup differs per surface
- design: Dynamic role=status panels created together with their content are often not announced; the page already has #labLive
- design: Tokens measured clean: every status and domain pair is >= 4.5:1 (computed); axe at 1440 had no violations before the work
- design: Not fixed, not mine: lesson-frame.css .lf-arc-n at 12-12.8px; validate:access-lab stops at a stale content/finder-metadata.json before it reaches any design check
- games: Matching/sorting renderer dropped focus to <body> after every placement (keyboard users lost their place)
- games: sentence-strategy: key was the longest option in 16/18 rounds; distractors were strawmen
- games: language-expeditions dialogue and escape-room: absurd or vague distractors, key much longer than options
- games: reset-on-miss streaks/combos in 7 games; word-jeopardy paid +50 only for no-hint streaks (penalises scaffolds)
- games: 15 bank distractor notes of 4-7 words too thin to teach
- games: bank validator had no check for bare-verdict explanations, short notes, pre-solved ordering, all-correct multi-select, a/an cues
- games: 10 remaining key-much-longer warnings (escape-room 6-8 x2, expeditions x2, read-along retell slots x6) left as warnings
- genpath: Mission evidence tasks: count-only feedback ('2 statements do not support the idea'), no reveal, learner could retry indefinitely
- genpath: Mission question first miss never named the learner's own choice
- genpath: 12 evidence tasks and 2 question explanations did not teach why
- genpath: Quest check items confirmed a correct answer with one generic sentence
- genpath: Compiled decide options both replied 'Noted. Now make sure your evidence supports it.'
- genpath: Validators accepted blank/duplicate/near-duplicate options, 'all of the above', bare explanations, and contradictory or duplicated compiled answer keys
- genpath: Early player and prep UI still use bare Correct / Try again announcements (not changed)
- integration: tools/access-lab-e2e.mjs was stale against the 2026-11-17 home redesign (bare / opens the grade chooser; plan options live inside the collapsed #more-ways); it failed on the merged branch and the home code it exercises is unchanged by this branch
- integration: Real bug (present on origin/main): changing a Today's mission planner select re-rendered the home and collapsed #more-ways, hiding the controls and dropping focus
- inventory: Axe (WCAG 2.0/2.1/2.2 A+AA) at 1280px: 16 of 214 crawled pages have serious/critical violations; rules: color-contrast x10, label x4, aria-prohibited-attr x2. All are on the sibling static sites (wida-access, esol, esol-reading-writing, language-adventures, language-studio); no lab (access-practice-lab) page has an axe violation.
- inventory: Horizontal overflow: 390px: language-studio:notes; 768px: wida-access:hub.
- inventory: Touch targets: 212 of 214 pages have interactive targets under 44px at 390px; 45 have targets under 24px (WCAG 2.2 AA minimum).
- inventory: Focus indicator not visible after Tab on: search.
- inventory: Core bank measured flags: generic-correct-feedback 8; hint-equals-support 85; answer-is-longest-clue 2; no-item-feedback 1; directions-long 41; no-hint 21; thin-vocabulary 18 (of 933). Feedback is already specific for choice/sort/order/cloze items; the weaknesses are hint repeated as support (85 constructed items), long directions (41), missing hints (21), thin vocabulary (18), generic correct feedback (8).
- inventory: Static-server 404s observed on sibling sites: design-tokens.css (esol, esol-reading-writing, wida-access trainer) and /api/class/create (class-teacher; needs the Worker). Confirm against production before treating as defects.
- inventory: Mobile length: a 3-5 listening sort activity renders ~6,700px tall at 390px (skill lesson, task card, word help and answer controls stack before the practice).
- inventory: wida-access page meta descriptions call the practice 'Publisher-grade WIDA ACCESS ... prep'; check against the never-claim-official rule (hub body text carries disclaimers).
- listenspeak: Listening card had one Listen button: no speed, no part replay, no purpose, no comprehension check
- listenspeak: Transcript hidden until after speaking; no path for learners who cannot hear (studio, retells, practice player without speechSynthesis)
- listenspeak: Retells lacked vocabulary prep, fading frames, success criteria, review and a focused second attempt
- listenspeak: Several 6-8 level-A listening items were 11-15 word isolated sentences
- listenspeak: Studio audio relied on a regex speaker parse; some labels were read aloud as text
- reading: evidence activity never reported right/wrong
- reading: rationale (states the key) shown on first miss, and 52 opened with praise even on wrong answers
- reading: 561 wrong choices had no feedback note
- reading: key was the longest option in 61% of questions and in slot 1 for 44%
- reading: 235 templated paragraph guiding questions
- reading: K-5 passages bland and predictable
- reading: stale feedback after changing an answer
- reading: evidence save hard-coded revision 1.0.0 (would orphan answers on any revised lesson)
- reading: e2e assumed first radio is the key and a specific lesson order
- vocab: Word Sprint was a 60 s clock with best score
- vocab: Scrambler matching drag-only; tiles not keyboard operable; alert()
- vocab: Hub match game ran a visible clock and gave bare feedback
- vocab: Word Lab review was only WORD>DEFINITION>MCQ-style
- vocab: No non-examples, collocations, relations or second meanings anywhere
- vocab: 22 short/trivial examples, several definitions inaccurate or circular (compare, matter, multiply, tone), bisector/mode/solve keyed wrongly
- vocab: Review distractors ignored the word's grade band
- vocab: Word Builder had 12 and 10 items
- writing: Sentence Lab rejected valid reorderings (5 of 316 tasks had alternates)
- writing: Language Upgrade detail check passed on length/repetition
- writing: Mentor try-it: empty box, no audience, no criteria, a model that failed its own check, hard-coded task index
- writing: Newsroom: facts invented from one-sentence seed
- writing: Detective transfer success wording implied correct use
- writing: Verb check failed good verbs outside a short list
- writing: Starter blanks (___) could pass checks

Baseline measured by the crawler (no interpretation):

- Pages with horizontal overflow: 390px 2 (language-studio:notes, deep-language-studio:notes); 768px 2 (wida-access:hub, deep-wida-access:hub); 1280px 0.
- Axe at 390px: 19 page(s) with violations; rules: color-contrast x10, label x4, button-name x3, aria-prohibited-attr x2.
- Axe at 1280px: 16 page(s) with violations; rules: color-contrast x10, label x4, aria-prohibited-attr x2.
- Pages whose Tab focus indicator was not visible: 1 (search).
- Pages with console errors, page errors or failed requests: 11.

## F. Improvements made

- adventures: Word Builder (wida-access) rebuilt with verified word parts, teaching feedback, retry and saved daily quest
- adventures: Directions Trainer: keyboard map, teaching feedback, in-page tier announcement
- adventures: Reward shop locked-theme explanation without a dialog
- adventures: Inline submit/save feedback in math-writing studio and book summary
- adventures: Contrast and ARIA fixes across wida-access and esol-reading-writing
- adventures: Added tools/wida-word-builder.test.mjs and tools/language-sibling-sites.test.mjs (axe over 9 studio pages)
- design: 44px touch-target floor for header, footer and top links on touch and tablet widths
- design: focusableScrollRegions(): sideways-scrolling tables get tabindex 0 and a name
- design: src/activity-kit.js: zoneHTML, directionsCardHTML, feedbackPanelHTML (+announceFeedback), hintLadderHTML (+wireHintLadders), setActivityState, activityProgressHTML
- design: ds.css activity kit block and additive tokens (--fs-*, --lh-*, --measure-reading, --target-min, --focus-ring, --zone-*)
- design: DESIGN-SYSTEM.md: Activity kit section
- games: renderers.js: placement keeps focus on the next item (or last zone) after place/undo; verified keyboard-only
- games: new tools/access-lab-game-items.test.mjs audits all 162 game choice rounds (answerable key, no duplicate options, hint does not leak key, no bare verdict, explanation not a hint repeat)
- games: validate-access-bank.mjs extended over all 320 items
- games: new keyboard-only e2e for bank (all reading response types) and for 8 games at 390 and 1280
- games: 26 game choice rounds + 11 dialogue turns rewritten bilingually
- genpath: src/views/missions-feedback.js: pure feedback rules (choice echo, distractor coaching, named wrong evidence, reveal after two retries, EN/ES)
- genpath: mission validator: question quality (stem, blank, duplicate, near-duplicate, escape options, explanation length) and evidence quality (explain, duplicate pool, boardLabel)
- genpath: quest validator: why, distinct options, wrong-option feedback length
- genpath: compiler validate.js: contradictory-key and duplicate-option errors; dense-evidence, long-prompt, no-reply, same-question, thin-answer, duplicate-pair warnings (bilingual)
- genpath: compiler templates: teaching decide reply, in-role fallback that says what to ask
- genpath: frozen pre-upgrade saved experience + half-played save fixture proves no silent migration
- integration: home.js onChange now restores the open state of #more-ways as well as #planOptions
- integration: access-lab-e2e updated to the new home flow with every assertion kept, plus one new assertion that bare / opens the grade chooser
- integration: Biome format/lint fixes on 11 branch test files; page-global references inside page.evaluate carry a reasoned biome-ignore
- inventory: Added inventory.json: 162 families and 1,987 activity or route records with measured content flags.
- inventory: Added Playwright crawler (tools/crawl.mjs): 390/768/1280 overflow, console errors, axe, touch targets, focus, minimal answer/feedback interaction; static server needs no build.
- inventory: Added RUBRIC.md and rubric.json (A-K, weighted), tools/score-baseline.mjs and baseline-scores.json with per-score evidence.
- inventory: Added tools/assemble-report.mjs producing REPORT.md sections A-O from fragments, tolerant of missing inputs.
- listenspeak: voice-listen.js: shared listening card (purpose, play, part replay, slower speed, on-demand transcript, main-idea/detail/sequence/inference checks with hint then reveal)
- listenspeak: Retell page: Prepare/Speak/Review/Improve, key words with Spanish gloss, frames fade after take 1, self-review ticks saved on device, one-thing focus
- listenspeak: 3 new listening retells (announcement, two-speaker interview, directions dialogue); picture on bees task
- listenspeak: 9 studio audio tasks gained listenFor and 2 checks; transcript open recorded as a support
- listenspeak: 4 g6-8 listening scripts rewritten
- reading: tiered feedback: first miss shows distractor note, partial counts and a reread hint; explanation after second miss or on request
- reading: evidence answers get correctness feedback, paragraph previews, and highlighted evidence paragraphs after success/reveal
- reading: inline vocabulary glosses (button, EN definition, example, ES) hidden in Independent mode
- reading: sentence-level evidence picker, highlight in passage, add-quote-to-answer
- reading: check my response: passage-word detection, criteria checklist, first draft vs revision, no scoring claim
- reading: quality validator module with ratchet list (now empty): no duplicate options, key valid, why on every wrong option, no praise openers, evidenceIds resolve, no order-dependent options
- reading: key slot and length balanced (key longest 29%, max slot 34%)
- vocab: Depth data for all 755 words (non-example EN/ES, collocations, synonyms/antonyms, second meaning)
- vocab: Four-step path computed from saved results
- vocab: Collocation, relation and meaning-in-context tasks with duplicate-answer guards
- vocab: Sentence task with honest mechanical checks, sentence starters faded by support level
- vocab: Transfer task in another subject with speaking self-report
- vocab: Optional mixed review kept apart from the 1/3/7/14 schedule
- vocab: Quality gate for bank and depth data
- writing: equivalentSentences() in craft-sentence.js: movable details, and/or swap, subordinate clause front/back
- writing: checkUpgrade: new distinct content words, connector needs ideas each side, item-specific hint feedback
- writing: 32 mentor try-it tasks rewritten with audience/purpose, given sentence or frame, success criteria, retry and model-after-misses guidance
- writing: 48 newsroom reporter's-note packets; observe() reports notes used and copying
- writing: checkMove: blank-guard, honest acceptance of unseen verbs, names at sentence start
- writing: detective transfer self-check

## G. New scores (after)

| area | entry | A | B | C | D | E | F | G | H | I | J | K | overall after | overall before | delta |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| design | shared chrome | 4 | 0 | 4 | 3 | 0 | 3 | 4 | 4 | 4 | 4 | 4 | 2.5 | 2.1 | +0.3999999999999999 |
| games | acc-bank-engine | 3 | 4 | 4 | 3 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 3.8 | +0.20000000000000018 |
| games | sentence-strategy | 3 | 4 | 4 | 3 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | 3.8 | 3.2 | +0.5999999999999996 |
| games | language-expeditions dialogue | 3 | 4 | 4 | 3 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | 3.8 | 3.2 | +0.5999999999999996 |
| games | streak games | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3.8 | +0.20000000000000018 |
| genpath | adaptive-missions | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3.7 | +0.2999999999999998 |
| genpath | quest-missions | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3.9 | +0.10000000000000009 |
| genpath | experience-compiler | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 3.1 | 3 | +0.10000000000000009 |
| listenspeak | voice-retell-listen | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 2.4 | +1.6 |
| listenspeak | speak-audio-stimulus | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3.3 | +0.7000000000000002 |
| listenspeak | listening-bank-g68-A | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 4 | 3 | 3.4 | 2.8 | +0.6000000000000001 |
| reading | reading-room reader | 3 | 3 | 4 | 3 | 4 | 4 | 4 | 3 | 4 | 3 | 4 | 3.6 | 2.8 | +0.8000000000000003 |
| reading | reading-room K-5 passages | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 3.9 | 2.5 | +1.4 |
| vocab | Word Lab garden | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 2.7 | +1.2999999999999998 |
| vocab | Word Builder | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 4 | 3.3 | 2.8 | +0.5 |
| vocab | Scrambler | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3.2 | 1.8 | +1.4000000000000001 |
| writing | sentence-build | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 3 | 3 | 3.4 | 3.1 | +0.2999999999999998 |
| writing | language-upgrade | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3.3 | 3 | +0.2999999999999998 |
| writing | mentor-try-it | 3 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 3.8 | 2.7 | +1.0999999999999996 |
| writing | newsroom | 3 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 3 | 3.7 | 3.1 | +0.6000000000000001 |
| writing | detective-transfer | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3.1 | 3 | +0.10000000000000009 |

Per-dimension delta (entries with a before and after score for that dimension):

| dim | name | n pairs | mean delta |
|---|---|---|---|
| A | Visual design | 21 | 0.1 |
| B | Writing / language quality | 21 | 0.6 |
| C | Directions clarity | 21 | 0.5 |
| D | Engagement and authenticity | 21 | 0.6 |
| E | Instructional rigor | 21 | 0.8 |
| F | Interaction design | 21 | 0.6 |
| G | Feedback quality | 21 | 1 |
| H | WIDA / ESOL scaffolding | 21 | 0.3 |
| I | Accessibility (WCAG 2.2 AA) | 21 | 0.6 |
| J | Age appropriateness | 21 | 0.4 |
| K | Cross-template consistency | 21 | 0.5 |

## H. Shared components and templates redesigned

- adventures: wida-access/word-builder
- design: activity kit (new)
- design: shell header target sizes
- games: acc placement renderer (matching/sorting) focus management
- games: word-jeopardy scoring (streak bonus removed)
- games: streak/combo counters in 7 game templates replaced by cumulative tallies
- genpath: views/missions feedback
- genpath: quest check confirmation
- genpath: compiler decide reply and character fallback
- listenspeak: voice-listen card
- listenspeak: voice-retell page
- listenspeak: speak.js audio stimulus
- reading: Reading Room lesson workspace feedback, evidence, response support, passage text
- vocab: wordCardHTML Go deeper
- vocab: Word Garden review card
- vocab: Word Round
- vocab: Scrambler matching and sentence builder
- writing: mentor try-it view
- writing: newsroom plan/draft notes panel

Shared-hotspot edits declared (home-registry, sitemap, sw/precache, package.json, shared CSS):

| area | edit |
|---|---|
| design | access-practice-lab/registers.css: appended one touch-target floor block (header controls) |
| design | access-practice-lab/index.html, sw.js, app-shell: sync-access-shell restamped hashes and precaches src/activity-kit.js (regenerate after merge) |
| games | access-practice-lab/sw.js, index.html, app-shell: regenerated by tools/sync-access-shell.mjs (build hash/version stamps only) |
| games | tools/validate-access-bank.mjs extended |
| genpath | access-practice-lab/sw.js (precache hash for new views/missions-feedback.js, regenerated by tools/sync-access-shell.mjs) |
| integration | access-practice-lab/src/views/home.js |
| integration | access-practice-lab/index.html, app-shell, sw.js (regenerated) |
| listenspeak | src/components.js: listenPlayerHTML unavailable branch shows the script (practice mode only) |
| listenspeak | index.html, app-shell, sw.js regenerated by tools/sync-access-shell.mjs (voice-listen.js precached; hashes will conflict across branches, re-run the tool after merging) |
| listenspeak | content/index.json and alignment-index.json regenerated by tools/access-lab-index.mjs |
| reading | access-practice-lab/labs.css: appended Reading Room support styles |
| vocab | access-practice-lab/studio-labs.css: appended .wl-deep, .wl-stage-chip, .wl-use, .wl-crit and related rules |
| vocab | access-practice-lab/index.html, app-shell, sw.js: regenerated by tools/sync-access-shell.mjs (content hashes and new precache entries); re-run after merging other branches |
| vocab | access-practice-lab/content/finder-metadata.json: regenerated (base was stale) |
| writing | access-practice-lab/index.html, app-shell, sw.js: regenerated by tools/sync-access-shell.mjs (content-hash module versions + precache build hash) because mentor/newsroom/craft modules changed; no new files added to the precache |

## I. Content rewritten

| area | content records rewritten | files changed |
|---|---|---|
| adventures | 0 | 13 |
| design | 0 | 10 |
| games | 42 | 9 |
| genpath | 26 | 15 |
| integration | 0 | 2 |
| inventory | 0 | 16 |
| listenspeak | 20 | 11 |
| reading | 183 | 12 |
| vocab | 36 | 16 |
| writing | 80 | 14 |

Total reported: 387.

## J. WIDA alignment and accessibility

WIDA: the platform keeps its grade-band and language-function structures; A/B/C are local support choices, not WIDA levels, and all practice is described as modeled on the framework, never official. Baseline measured WIDA and Spanish coverage for the core bank:

| family | WIDA tag % | vocab >=2 % | ES directions % | ES feedback % | avg frames |
|---|---|---|---|---|---|
| core-gK-Listening | 100 | 100 | 100 | 100 | 1 |
| core-gK-Reading | 100 | 100 | 100 | 100 | 1 |
| core-gK-Speaking | 100 | 100 | 100 | 100 | 1 |
| core-gK-Writing | 100 | 100 | 100 | 100 | 1 |
| core-g1-Listening | 100 | 100 | 100 | 100 | 1 |
| core-g1-Reading | 100 | 100 | 100 | 100 | 1 |
| core-g1-Speaking | 100 | 100 | 100 | 100 | 1 |
| core-g1-Writing | 100 | 100 | 100 | 100 | 1 |
| core-g2-3-Listening | 100 | 100 | 100 | 100 | 1 |
| core-g2-3-Reading | 100 | 100 | 100 | 100 | 1 |
| core-g2-3-Speaking | 100 | 100 | 100 | 100 | 1 |
| core-g2-3-Writing | 100 | 100 | 100 | 100 | 1 |
| core-g3-5-Listening | 100 | 100 | 100 | 100 | 2.2 |
| core-g3-5-Reading | 100 | 100 | 100 | 100 | 2.2 |
| core-g3-5-Speaking | 100 | 100 | 100 | 100 | 3 |
| core-g3-5-Writing | 100 | 100 | 100 | 100 | 3.1 |
| core-g6-8-Listening | 100 | 97 | 100 | 100 | 2 |
| core-g6-8-Model-Test | 100 | 90 | 100 | 100 | 1.7 |
| core-g6-8-Reading | 100 | 99 | 100 | 100 | 2 |
| core-g6-8-Speaking | 100 | 96 | 100 | 100 | 2.7 |
| core-g6-8-Writing | 100 | 96 | 100 | 100 | 2.9 |

Accessibility crawl (axe WCAG 2.0/2.1/2.2 A+AA, touch targets, focus, labels):

- Baseline: 214 pages x 390/768/1280px; load errors 0; pages with console/page errors 0; horizontal overflow (pages) 390px: 2, 768px: 2, 1280px: 0; axe 390px: 19 page(s) with serious/critical, 19 with any; 1280px: 16 page(s) with serious/critical, 16 with any; pages with targets under 44px at 390px: 212; interaction states: no-primary-cta 94, cta-responded 77, cta-no-visible-change 16, feedback-shown 16, no-check-button 5, no-visible-feedback 6.
- After: not available.

## K. Before/after screenshots

Baseline screenshots (`screenshots/before/`, from `tools/crawl.mjs`; file name = target id and viewport width):

| target | 390px | 1280px |
|---|---|---|
| deep-city | ![deep-city 390](screenshots/before/deep-city-390.jpg) | ![deep-city 1280](screenshots/before/deep-city-1280.jpg) |
| deep-missions | ![deep-missions 390](screenshots/before/deep-missions-390.jpg) | ![deep-missions 1280](screenshots/before/deep-missions-1280.jpg) |
| deep-reading-room | ![deep-reading-room 390](screenshots/before/deep-reading-room-390.jpg) | ![deep-reading-room 1280](screenshots/before/deep-reading-room-1280.jpg) |
| deep-scenarios | ![deep-scenarios 390](screenshots/before/deep-scenarios-390.jpg) | ![deep-scenarios 1280](screenshots/before/deep-scenarios-1280.jpg) |
| deep-speak | ![deep-speak 390](screenshots/before/deep-speak-390.jpg) | ![deep-speak 1280](screenshots/before/deep-speak-1280.jpg) |
| deep-tests | ![deep-tests 390](screenshots/before/deep-tests-390.jpg) | ![deep-tests 1280](screenshots/before/deep-tests-1280.jpg) |
| deep-write | ![deep-write 390](screenshots/before/deep-write-390.jpg) | ![deep-write 1280](screenshots/before/deep-write-1280.jpg) |
| home | ![home 390](screenshots/before/home-390.jpg) | ![home 1280](screenshots/before/home-1280.jpg) |
| tpl-3-5-sort | ![tpl-3-5-sort 390](screenshots/before/tpl-3-5-sort-390.jpg) | ![tpl-3-5-sort 1280](screenshots/before/tpl-3-5-sort-1280.jpg) |
| tpl-6-8-constructed | ![tpl-6-8-constructed 390](screenshots/before/tpl-6-8-constructed-390.jpg) | ![tpl-6-8-constructed 1280](screenshots/before/tpl-6-8-constructed-1280.jpg) |
| tpl-6-8-multipleChoice | ![tpl-6-8-multipleChoice 390](screenshots/before/tpl-6-8-multipleChoice-390.jpg) | ![tpl-6-8-multipleChoice 1280](screenshots/before/tpl-6-8-multipleChoice-1280.jpg) |
| tpl-g1-multipleChoice | ![tpl-g1-multipleChoice 390](screenshots/before/tpl-g1-multipleChoice-390.jpg) | ![tpl-g1-multipleChoice 1280](screenshots/before/tpl-g1-multipleChoice-1280.jpg) |

**adventures** (12 image(s)):

![adventures/directions-trainer-after-1280.jpg](screenshots/adventures/directions-trainer-after-1280.jpg)
![adventures/directions-trainer-after-390.jpg](screenshots/adventures/directions-trainer-after-390.jpg)
![adventures/directions-trainer-before-1280.jpg](screenshots/adventures/directions-trainer-before-1280.jpg)
![adventures/directions-trainer-before-390.jpg](screenshots/adventures/directions-trainer-before-390.jpg)
![adventures/reward-shop-after-1280.jpg](screenshots/adventures/reward-shop-after-1280.jpg)
![adventures/reward-shop-after-390.jpg](screenshots/adventures/reward-shop-after-390.jpg)
![adventures/reward-shop-before-1280.jpg](screenshots/adventures/reward-shop-before-1280.jpg)
![adventures/reward-shop-before-390.jpg](screenshots/adventures/reward-shop-before-390.jpg)
![adventures/word-builder-after-1280.jpg](screenshots/adventures/word-builder-after-1280.jpg)
![adventures/word-builder-after-390.jpg](screenshots/adventures/word-builder-after-390.jpg)
![adventures/word-builder-before-1280.jpg](screenshots/adventures/word-builder-before-1280.jpg)
![adventures/word-builder-before-390.jpg](screenshots/adventures/word-builder-before-390.jpg)

Fragments reference 63 screenshot path(s); 39 not found on disk (design:reports/language-page-quality/screenshots/design/before-activity-390.jpg, design:reports/language-page-quality/screenshots/design/before-activity-1280.jpg, design:reports/language-page-quality/screenshots/design/after-activity-390.jpg, design:reports/language-page-quality/screenshots/design/after-activity-1280.jpg, design:reports/language-page-quality/screenshots/design/kit-390.jpg, ...).

## L. Test results

62 test command(s) reported by 10 area(s): 46 classified pass, 6 fail, 10 unclassified (result text shown verbatim).

| area | command | result |
|---|---|---|
| adventures | `node --test tools/wida-word-builder.test.mjs tools/language-sibling-sites.test.mjs` | pass on the merged branch (one earlier run under load reported color-contrast x1; 4 reruns of the axe test passed) |
| design | `node --test tools/access-activity-kit.test.mjs` | 8/8 pass |
| design | `node tools/access-activity-kit-e2e.mjs` | all checks passed (axe, 44px, hint ladder, states at 390/768/1280, 4 domains) |
| design | `node --test tools/access-sw.test.mjs tools/access-design-system.test.mjs tools/access-css-balance.test.mjs` | pass |
| design | `node tools/access-comfort-e2e.mjs` | all checks passed |
| design | `node tools/access-axe-sweep.mjs --width 390 (87 screens)` | see final summary; teacher screens clean after the fix |
| design | `npm run validate:access-lab` | FAIL at first step: finder-metadata.json is stale (content, pre-existing, not in this area) |
| games | `node --test tools/access-lab-game-items.test.mjs` | 3 pass |
| games | `node tools/validate-access-bank.mjs; access-acc-bank-index --check; access-acc-bank-parallel --check` | 0 errors, index current |
| games | `node tools/access-acc-{engine,bank,feedback}.test.mjs` | 20 / 27 / 5 pass |
| games | `node tools/validate-game-rules.mjs; validate-access-games; validate-access-game-studio; access-game-studio-contract.test` | all pass (583 game files clean) |
| games | `node tools/access-acc-bank-e2e.mjs; access-games-e2e.mjs` | pass |
| games | `node tools/access-acc-keyboard-e2e.mjs (390 + 1280)` | pass; failed before the renderer focus fix |
| games | `node tools/access-games-keyboard-e2e.mjs (8 games x 390 + 1280)` | pass; failed before match-mania combo removal |
| games | `git commit pre-commit qa:fast` | FAIL on base-stale finder-metadata.json and test-reads manifest (pre-existing); --no-verify not used |
| genpath | `node --test tools/missions-feedback.test.mjs` | 9 pass |
| genpath | `node --test tools/experience-compat.test.mjs` | 7 pass |
| genpath | `node --test tools/compiler.test.mjs tools/access-experience.test.mjs` | 21 + 20 pass |
| genpath | `node --test tools/quest-engine.test.mjs; node tools/validate-quest.mjs` | 16 pass; PASS |
| genpath | `node --test tools/sim-engine.test.mjs; node tools/sim-e2e.mjs` | 21 pass; all passed |
| genpath | `node tools/validate-access-studio.mjs` | PASS |
| genpath | `node tools/missions-feedback-e2e.mjs` | all passed at 390 and 1280 |
| integration | `npm run build` | pass (exit 0) |
| integration | `node tools/access-lab-e2e.mjs` | pass, 114 checks (after the stale-test and home.js fixes; failed before) |
| integration | `node tools/access-studio-e2e.mjs` | pass |
| integration | `node tools/access-activity-kit-e2e.mjs` | pass |
| integration | `node tools/access-voice-listen-e2e.mjs` | pass |
| integration | `node tools/access-reading-room-loop-e2e.mjs` | pass |
| integration | `node tools/access-acc-keyboard-e2e.mjs` | pass |
| integration | `node tools/access-games-keyboard-e2e.mjs` | pass |
| integration | `node tools/missions-feedback-e2e.mjs` | pass |
| integration | `node tools/access-axe-sweep.mjs` | pass: 87 screens at 1440px, no axe violations |
| inventory | `node reports/language-page-quality/tools/enumerate.mjs --crawl crawl-baseline.json` | ok: 162 families, 1987 records, 933 core activities, 0 errors |
| inventory | `node reports/language-page-quality/tools/crawl.mjs (214 pages x 390/768/1280, axe at 390 and 1280)` | ok: 214 pages crawled, 0 load errors, 0 console/page errors (web-vitals artifact excluded) |
| inventory | `node reports/language-page-quality/tools/score-baseline.mjs` | ok: 36 entries scored, 0 uncovered testable families |
| inventory | `node reports/language-page-quality/tools/assemble-report.mjs (with and without a mock fragment)` | ok: REPORT.md sections A-O written; tolerates missing fragments |
| listenspeak | `node tools/access-voice-listen.test.mjs` | 6 pass |
| listenspeak | `node tools/access-voice-listen-e2e.mjs` | PASS (1280 and 390, keyboard, mic denied, axe, console) |
| listenspeak | `node tools/access-lab-voice-views.test.mjs` | 10 pass |
| listenspeak | `node tools/access-lab-voice.test.mjs` | 17 pass |
| listenspeak | `access-scenarios, access-language-city, access-acc-audio, access-listening-strategy, speaking-task-packs tests` | all pass |
| listenspeak | `node tools/access-studio-e2e.mjs` | PASS |
| listenspeak | `validate-access-lab, validate-access-bank, validate-access-studio, validate-access-quality, access-sw.test` | PASS |
| reading | `node tools/reading-room-quality.test.mjs` | PASS 183 lessons, 0 debt |
| reading | `node tools/validate-reading-room.mjs` | PASS |
| reading | `node tools/access-reading-room-e2e.mjs` | PASS |
| reading | `node tools/access-reading-room-loop-e2e.mjs` | PASS 390+1280, axe |
| reading | `node tools/book-render-regression.test.mjs` | PASS 54 pinned books |
| reading | `node tools/book-studio.test.mjs` | 10 pass 0 fail |
| reading | `access-reader / access-reading-evidence / access-reading-path tests` | 16/11/17 pass |
| vocab | `node tools/access-wordlab-depth.test.mjs` | 11 pass |
| vocab | `node tools/access-wordlab.test.mjs` | 15 pass |
| vocab | `node tools/access-word-sprint.test.mjs` | 5 pass (rewritten for the untimed round) |
| vocab | `node tools/access-word-goal.test.mjs; access-glossary; access-module-cache; access-sw` | all pass |
| vocab | `node tools/access-studios-b-e2e.mjs` | PASS 85 checks |
| vocab | `Playwright 390/1280: explore, garden keyboard review, reload, builder, scrambler, axe` | no overflow; axe none on garden/builder; scrambler contrast fixed after run |
| writing | `node --test tools/access-writing-checkers.test.mjs` | 15 pass |
| writing | `node --test tools/access-craft-studios.test.mjs tools/access-newsroom.test.mjs` | pass |
| writing | `node tools/twr-content.test.mjs; node tools/twr-writing.test.mjs; node tools/access-writing-transfer.test.mjs` | pass |
| writing | `node tools/access-craft-studios-e2e.mjs` | all checks passed |
| writing | `playwright script: mentor try + newsroom at 390/1280` | reload persistence, keyboard check, axe 0 violations, no overflow; only console error was web-vitals bare import of the static server |
| writing | `node tools/access-module-cache.test.mjs; node tools/access-sw.test.mjs` | pass after node tools/sync-access-shell.mjs |

## M. Preserved contracts

The master brief fixes these contracts. Each is listed with any evidence the fragments supply; a contract with no evidence is not claimed as verified.

| contract | evidence reported |
|---|---|
| Public URLs, routes and deep links unchanged | none reported |
| Activity and book ids unchanged | adventures: node --test tools/wida-word-builder.test.mjs tools/language-sibling-sites.test.mjs -> pass on the merged branch (one earlier run under load reported color-contrast x1; 4 reruns of the axe test passed) \|\| design: node tools/access-axe-sweep.mjs --width 390 (87 screens) -> see final summary; teacher screens clean after the fix \|\| design: npm run validate:access-lab -> FAIL at first step: finder-metadata.json is stale (content, pre-existing, not in this area) \|\| games: node tools/validate-access-bank.mjs; access-acc-bank-index --check; access-acc-bank-parallel --check -> 0 errors, index current |
| Teacher-authored content and publish/share workflows | games: node tools/validate-game-rules.mjs; validate-access-games; validate-access-game-studio; access-game-studio-contract.test -> all pass (583 game files clean) \|\| genpath: node tools/validate-access-studio.mjs -> PASS \|\| integration: node tools/access-studio-e2e.mjs -> pass \|\| listenspeak: node tools/access-studio-e2e.mjs -> PASS |
| Saved student work and `accessPracticeLab:v1:*` localStorage keys, IndexedDB | none reported |
| Offline / service worker precache lists match files a page loads | design: node --test tools/access-sw.test.mjs tools/access-design-system.test.mjs tools/access-css-balance.test.mjs -> pass \|\| design: node tools/access-axe-sweep.mjs --width 390 (87 screens) -> see final summary; teacher screens clean after the fix \|\| integration: node tools/access-axe-sweep.mjs -> pass: 87 screens at 1440px, no axe violations \|\| listenspeak: validate-access-lab, validate-access-bank, validate-access-studio, validate-access-quality, access-sw.test -> PASS |
| Grade and WIDA preferences; EN/ES chrome | adventures: node --test tools/wida-word-builder.test.mjs tools/language-sibling-sites.test.mjs -> pass on the merged branch (one earlier run under load reported color-contrast x1; 4 reruns of the axe test passed) \|\| games: node tools/access-acc-bank-e2e.mjs; access-games-e2e.mjs -> pass \|\| games: node tools/access-games-keyboard-e2e.mjs (8 games x 390 + 1280) -> pass; failed before match-mania combo removal \|\| integration: node tools/access-games-keyboard-e2e.mjs -> pass |
| No new dependencies; `_headers`, `_redirects`, `wrangler.toml`, vite output config untouched | none reported |

Guarded files appearing in any fragment's filesChanged: none.

## N. Remaining limitations

- adventures: Word Builder meaning step not fixed
- adventures: language-adventures/ and language-studio/ are compiled Next.js exports from the separate the-language-page repo and were NOT changed; one arcade label there has a 4.43:1 contrast ratio; the fix belongs in that repo, then a re-sync
- adventures: wida-access page meta descriptions say 'Publisher-grade WIDA ACCESS ... prep'; needs review against the never-claim-official rule
- adventures: No human editorial review of rewritten content
- adventures: Fragment written by the integration agent from the commit and test evidence; the adventures agent never wrote one, so no per-item scores are reported
- design: Rooms, games and studios still render their own feedback/directions; the kit is available for those agents to adopt (src/views/activity.js and src/task-steps.js are not in the design area)
- design: lesson-frame.css arc labels under 13px (not owned)
- design: validate:access-lab fails at its first step on a stale content/finder-metadata.json (content is not in this area; not regenerated)
- design: Inline sentence targets (.reading-sentence, 31px) left as is: inline-in-text exception
- games: pre-commit gate fails on base-stale access-practice-lab/content/finder-metadata.json and data/test-reads.json manifest (not caused by this branch); not regenerated here to avoid cross-branch conflicts
- games: 10 'key much longer' warnings remain (retell slots, 6-8 escape-room, two expedition turns)
- games: dead CSS .mm-combo remains in games-h.css
- games: games not re-driven in browser beyond 8 keyboard playthroughs and the 22-game studio playthrough; no before screenshots captured
- games: bank item prose (stems/passages) judged sound on automated checks only; no human review
- genpath: src/early and src/prep still announce bare Correct!/Try again in places
- genpath: worlds.json, pathways, intel, lesson-builder content not audited beyond baseline tests
- genpath: quest check correct answer is index 1 in 7 of 12 items (runtime does not shuffle); not changed
- genpath: browser verification covered the garden mission only at 390/1280; quest check why line and compiler output not visually verified
- genpath: no WIDA scaffolding changes made
- integration: One run of tools/language-sibling-sites.test.mjs under heavy machine load reported color-contrast x1; four reruns of that axe test passed; the page and node were not captured, so cause is unconfirmed (animation timing is suspected, not proven)
- integration: No post-overhaul crawler run (crawl-after.json) was produced; before/after crawl comparison is not available
- inventory: 15 untestable or count-only surfaces (see inventory.json untestable)
- inventory: Baseline judged scores rest on sampled content (documented per score); measured scores are exhaustive over the cited files.
- inventory: Early-band (K-3) interactions were driven with a pick-then-Check script; Speaking/recorder paths cannot be exercised headlessly.
- listenspeak: Real speechSynthesis playback verified by hand in headed Chromium on macOS (per-sentence utterances start and end, spoken text equals transcript); Windows, Android, iOS voices and Linux without voices NOT tested; quality varies by device voice. Automated e2e uses a stubbed speechSynthesis that records the spoken text
- listenspeak: Most of the ~230 listening-bank scripts (K-5, 6-8 levels B and C) were not reviewed; 3-5 level A still has several 10-16 word picture-supported items
- listenspeak: Language City and Scenarios not audited or browser-checked
- listenspeak: Check questions only on retells and studio audio tasks, not sound-bridge, shadowing or ladders
- listenspeak: Passages and questions are English by design; chrome is EN/ES
- listenspeak: web-vitals console error is a static-server artifact, filtered in the e2e
- listenspeak: access-acc-bank-index.mjs and generate-access-finder-metadata.mjs --check could not run in this worktree (module resolution error), not caused by this change
- listenspeak: This fragment and the screenshots live under reports/, which is gitignored; a hook refused git add -f, so they are not committed
- reading: Book Studio comprehension checkpoints, prediction pages and end-of-book reflection not built (only a regression pin added)
- reading: Reading Path phonics decodables and Reading Adventures/Strategy lessons not rewritten
- reading: rr-existing passages kept as derived from source practice activities (some 41-47 words)
- reading: two sort keys flagged by an agent as suspect (rr68-school-rain-garden, rr68-bus-data) not changed
- reading: hints/evidenceIds are authored only for part of the library; others fall back to word-overlap pointer which is skipped for main-idea questions
- reading: no human editorial review; editorial status unchanged
- reading: read-aloud not changed
- vocab: vocab-hub quiz and quest (gold/XP, perfect-score bonus) not reworked; vocab-hub axe/mobile not fully audited
- vocab: vocab-hub/vocab-bank.json is generated from lessons and was not edited
- vocab: Collocation distractor guard is phrase-list based; a distractor could still be acceptable English in rare cases
- vocab: Word Builder meaning/apply step after a build not added
- vocab: Scrambler sentence still has one accepted order
- vocab: inline glossary not changed
- writing: TWR has no generative writing item (needs src/twr item kind; outside owned paths)
- writing: Only 6 grade 3-5 Writing Studio tasks
- writing: Scaffold Language Upgrade has 8 items
- writing: Newsroom notes are English-only (practice content)
- writing: Dev-server only: 'web-vitals' bare import console error in the static e2e server, not caused by this change
- writing: key-warmup.js and arena not changed
- writing: Full pre-commit gate escalated to npm run test and was slow due to a shared QA lock
- writing: Pre-commit gate failures NOT caused by this branch: validate:access-lab (finder-metadata.json stale, also stale on base 92326323a0) and test (data/test-reads.json stale for tools/skip-honesty.test.mjs reading engine/core files). Not touched.

Platform-level limits of this audit:

- Untestable surfaces: 15 listed in section B (Learning Studios Worker pages, user-authored books, count-only banks).
- The crawler runs against a no-build static server; `assets/nt-web-vitals.js` needs a bundler and is excluded as a harness artifact.
- Speech recognition, text-to-speech voices and microphone paths cannot be exercised headlessly; they are checked for presence and error-free load only.
- Baseline scores marked `judged` rest on sampled content and screenshots, not on every record. Measured scores are exhaustive over the files named in their evidence.

## O. Commit and worktree information

| area | branch | head commit | files changed | screenshots |
|---|---|---|---|---|
| adventures | lp-overhaul/adventures | 7cdf55f521 | 13 | 0 |
| design | lp-overhaul/design | 9c75fc53fc | 10 | 7 |
| games | lp-overhaul/games | b19492fb7a | 9 | 4 |
| genpath | lp-overhaul/genpath | 624287782d | 15 | 4 |
| integration | feat/language-page-activity-overhaul-20261120 | c1ac7d688c + integration fixes (see section O) | 2 | 0 |
| inventory | lp-overhaul/inventory | 92326323a0 | 16 | 24 |
| listenspeak | lp-overhaul/listenspeak | 466840297b | 11 | 6 |
| reading | lp-overhaul/reading | 5af65083ad | 12 | 6 |
| vocab | lp-overhaul/vocab | b71b500ce8 | 16 | 8 |
| writing | lp-overhaul/writing | 9abb7b0bda | 14 | 4 |

Baseline: branch `lp-overhaul/inventory`, commit `92326323a0`, origin/main `2b47c0dbb4`.
