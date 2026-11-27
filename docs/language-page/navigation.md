# The Language Page — who goes where

How thelanguagepage.com is organized for its four audiences, and where each one's resources live. Award audit findings
C6, T2 and T5 (`award-panel-audit-2026-11-24.md`); Workstream 2 of `award-program-prompt.md`. Every existing URL keeps
answering exactly as before: this change moves links and emphasis, never routes.

## The four doors (home, `src/views/home-audience.js`)

| Door | Link | What opens first |
| --- | --- | --- |
| I'm a Student | `/access-practice-lab/students` | grade, then one "Start practicing" or "Continue", then skill choice |
| I'm a Family Member | `/access-practice-lab/family-start` | grade, a 5-minute activity, the Family Tour, family questions |
| I'm a Classroom Teacher | `/access-teacher/classroom/` | **Today's lesson kit**: one form (grade, topic, key words, what students do with language) and, on the same page, teaching moves, a sentence-frame card at three support levels, word cards and a student practice link |
| I'm an ESOL Teacher | `/access-teacher/?role=esol` | Teacher Hub, "Your ESOL toolkit": WIDA Data Studio, practice tests, class code, Road to ACCESS links |

Under the doors: **I know what I need** (search) and the district door, **Baltimore City teacher? BCPSS curriculum
language bridges** (`/bcpss-teachers`). BCPSS was a fifth audience card; it serves one district's teachers, so it is a
link beside search (audit C6). It is also the first card for the Classroom Teacher role in the Hub.

## Classroom teachers: one page for today's lesson

A content teacher is not an ESOL specialist, and the full Teacher Hub (ACCESS prep, WIDA data, six tabs) was the wrong
first screen for them (Joel, 2026-11-27: "overwhelming, disjointed"). `access-teacher/classroom/` asks one question,
"what are you teaching today?", and answers it on the same page, in the order a teacher uses it:

1. **Teaching moves**: three for the chosen language use, three for any lesson. No prep.
2. **Sentence frames**: one printable card, three support levels (more support, some support, on my own), key words,
   connecting words and a partner-talk routine. Optional Spanish directions, marked as unreviewed drafts.
3. **Word cards**: one per key word (draw it, it means, my sentence), printed two to a row.
4. **Student practice**: a copyable link to the Student Hub for that grade, opened at the skill that fits the language use.

Everything comes from `access-teacher/classroom/frames.js` (authored, original; tested by
`tools/access-classroom-kit.test.mjs`). The BCPSS curriculum bridges and the full Teacher Hub sit under "More when you
need it". The Hub links back to this page from its hero and from "Go straight to".

## The Teacher Hub's teacher views

The ESOL door opens `/access-teacher/?role=esol`; `?role=classroom` still works for anyone who wants the Hub. `?role=` is read once (`roleFromSearch` in `src/audience.js`), remembered
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

## Student Hub: My week

`/access-practice-lab/students` (once a grade is chosen) shows the learner's week: practice days against their own goal
(changeable there), the four skills practiced this week, and one "Next: try <skill>" link into the skill chooser.
Counts only, from what the device records (`src/my-week.js`, `tools/access-my-week.test.mjs`); its styles load with
the page (`my-week.css`), not in the shell.

## Not changed here (needs Joel)

- The student page's "Explore more" and the after-practice transfer still link `/language-adventures/` (a contextual
  suggestion, pinned by `tools/access-home-start.test.mjs`).
- An "I'm new to English" newcomer door (Workstream 2 item 2) needs the newcomer path content first (audit E5).
