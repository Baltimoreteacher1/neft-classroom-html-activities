# The Language Page — who goes where

How thelanguagepage.com is organized for its four audiences, and where each one's resources live. Award audit findings
C6, T2 and T5 (`award-panel-audit-2026-11-24.md`); Workstream 2 of `award-program-prompt.md`. Every existing URL keeps
answering exactly as before: this change moves links and emphasis, never routes.

## The four doors (home, `src/views/home-audience.js`)

| Door | Link | What opens first |
| --- | --- | --- |
| I'm a Student | `/access-practice-lab/students` | grade, then one "Start practicing" or "Continue", then skill choice |
| I'm a Family Member | `/access-practice-lab/family-start` | grade, a 5-minute activity, the Family Tour, family questions |
| I'm a Classroom Teacher | `/access-teacher/?role=classroom` | Teacher Hub, "For your classroom": BCPSS curriculum language bridges, activities, printables, content library |
| I'm an ESOL Teacher | `/access-teacher/?role=esol` | Teacher Hub, "Your ESOL toolkit": WIDA Data Studio, practice tests, class code, Road to ACCESS links |

Under the doors: **I know what I need** (search) and the district door, **Baltimore City teacher? BCPSS curriculum
language bridges** (`/bcpss-teachers`). BCPSS was a fifth audience card; it serves one district's teachers, so it is a
link beside search (audit C6). It is also the first card for the Classroom Teacher role in the Hub.

## One Teacher Hub, two teacher views

Both teacher doors open `/access-teacher/`. `?role=` is read once (`roleFromSearch` in `src/audience.js`), remembered
on the device with the existing "I am a…" menu, and orders two things (`TEACHER_ROLES`):

- the first three task cards (unchanged behaviour: `order`), and
- "Go straight to" (`library`, `access-teacher/hub-role.js`), with a heading per role.

Nothing is hidden from any role; `tools/access-hub-role.test.mjs` fails if a role's list drops or invents a card. A door
click also remembers the role (`data-door-role`), so the Hub opens in that view on later visits too.

## Chrome

- **Header** (`src/nav.js`, `registers.css`): Teachers · Students · Families · Find Resources · Help, grade, language,
  tools, More. One 64px row from 1280px (it wrapped "More" onto a second row at 1280 and 1366 and pushed every page down
  30–45px); the promise line leaves the masthead between 1280 and 1599px and stays in the title and share card. Tool
  buttons keep 44px. 1100–1279px keeps the two-row bar.
- **Footer** (`src/nav.js`): one column per audience — Students, Families, Classroom teachers, ESOL teachers — then Site
  Guide, Everything on the site, help, privacy and accessibility. Every link the old "Curriculum Modules / Standards
  Alignment / District and Educator Resources" columns held is still there.
- **Teacher Hub, Family Expedition and other standalone pages** (`src/acc/shell.js` `FOOTER_GROUPS`): the same
  audience grouping. The old footer listed internal names (Side Quest, Family Adventure) whose links leave this host.
- **Name**: on thelanguagepage.com the Teacher Hub masthead, its kicker and the BCPSS studio's home crumb say The
  Language Page (`functions/_lib/language-page.js`), as do the footer build stamp and titles (decision
  `lp-site-name-the-language-page`). eduwonderlab.com keeps "ACCESS Practice Lab".
- **More menu**: Language Adventures and Language Studio are no longer featured (decision
  `lp-sibling-apps-keep-urls-stop-featuring`); their URLs keep answering.

## Not changed here (needs Joel)

- The student page's "Explore more" and the after-practice transfer still link `/language-adventures/` (a contextual
  suggestion, pinned by `tools/access-home-start.test.mjs`).
- An "I'm new to English" newcomer door (Workstream 2 item 2) needs the newcomer path content first (audit E5).
