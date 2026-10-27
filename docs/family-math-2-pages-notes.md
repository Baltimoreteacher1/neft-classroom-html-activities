# Family Math 2.0: pages layer (home, session host, progress)

Tags: @fm2 FM-001 FM-002 FM-003 FM-004 FM-005 FM-024 FM-025 FM-026 FM-027 FM-028 FM-029 FM-030 FM-031 FM-034 FM-035 FM-036 FM-043

## Files

| File                                                                                    | Role                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `family/index.html`, `family/home.js`, `family/fm2/home.css`, `family/fm2/home-copy.js` | New family home (copy in `home-copy.js`, keyed `{en, es}`; static text carries `data-t="key"`)   |
| `family/play.html`, `family/fm2/play.js`                                                | Activity host: single activity (as before) or a planned session                                  |
| `family/fm2/session-runner.js`                                                          | Runs a plan: activity, step between activities, completion, one `store.recordSession`            |
| `family/progress.html`, `family/fm2/progress.js`, `progress.css`, `progress-copy.js`    | Progress dashboard                                                                               |
| `family/fm2/page-kit.js`, `page-kit.css`                                                | Shared: URL builders, `loadAvailable`, learner bar, stars, session record, session-screen styles |
| `tools/verify-fluency-family-browser.mjs`                                               | Existing gate, edited to describe the new home (see report)                                      |
| `family/family.js`                                                                      | NOT loaded by any page any more; kept because `tools/fluency-family.test.mjs` reads its source   |

## URL contract

- Home: `/math/fluency-lab/family/?grade=<0-8>&profile=<0-5>&lang=<en|es>` (all optional; the page rewrites them with `replaceState`).
- Planned session: `play.html?plan=<encodePlan code>&grade=&profile=&lang=&mode=<solo|together>`. `plan` is authoritative for grade, mode and activities.
  After the session starts the page adds `&resume=1`, so a reload continues. Optional `&seed=<int>` fixes the session seed (tests).
- Continue: `play.html?plan=<code>&resume=1&grade=&profile=&lang=&mode=` (home resume banner; also works without `plan` when the saved resume carries one).
- Single activity: `play.html?game=<id>&skill=<id>&level=<1-3>&grade=&profile=&lang=&mode=` (+ `&resume=1`, `&rounds=`, `&seed=`). Unchanged behavior.
- Progress: `progress.html?profile=&lang=&grade=` (grade only chooses the drill-down grade).
- Tonight's Math: `tonight.html?grade=&profile=&skill=<fluency-lab skill id>&lang=` (same as before). Fluency Lab: `../?grade=&profile=`.
- Invalid / unknown plan or a plan naming a game that is not ready: `[data-testid=play-error]` with a link home.

## Storage

- `ewl-fm2-v1[:profile-N]` store (unchanged). Home writes `settings.grade|minutes|mode` only when the learner changes them.
- `ewl-fm2-session-v1[:profile-N]`: `{v, plan, sid, step, seed, startedAt, activeMs, minutes, summaries[], finished, recorded}`.
  `recorded` is set before `store.recordSession`, so a reload on the completion screen never records twice. Minutes = visible wall-clock,
  capped at 120% of `plan.estSec`, at least 1.
- Language: `ewl-fluency-lang-v1` through `fm2/lang.js` (toggle persists and re-renders without reload on every page).
- A game counts as "ready" only if its module loads and `validateGame` passes; otherwise the shelf card is `data-ready="false"` ("Coming soon").

## Test hooks (`data-testid` unless noted)

Learner bar (home, progress): `profile-select` (`#family-profile`), `add-learner`, `lang-toggle`, `storage-warning` (`#family-storage-warning`), `no-js`.

Home:

- Setup: `setup`, `grade-selector`, `grade-0`..`grade-8` (buttons, `aria-pressed`, `aria-label` "Grade N"/"Grado N"), `length-group`, `minutes-5|10|15` (radio inputs), `mode-group`, `mode-solo|mode-together` (radio inputs), `start-session` (`#start-link`, href = play URL with `plan=`; a disabled button when no game is ready), `plan-summary`.
- `resume-banner`, `resume-link` (only when `store.state.resume` exists).
- `mission-section`, `mission-activity` (`data-game`, `data-skill`), `mission-empty`.
- `progress-strip`, `stat-streak`, `stat-minutes`, `stat-stars`, `progress-empty`, `progress-link`.
- `games-shelf`, `game-card` (`data-game`, `data-ready`), `game-play`.
- `skill-browser`, `strand-group` (`data-strand`, a `<details>`), `skill-row` (`data-game`, `data-skill`), `skill-practice`, `skills-empty`.
- `coach-card`, `coach-ask`, `coach-empty`, `print-coach` (`#print-coach`).
- `realworld`, `rw-activity` (`data-id`, `<details>`), `rw-print`, `rw-toggle` (show all / fewer; 6 shown first).
- `tonight-link` (`#tonight-link`), `lab-link`, `home-error`, `home-error-card`.
- Printing sets `body[data-print="coach"|"realworld"]` (+ `[data-printing]` on one activity) and calls `window.print()`; cleared on `afterprint`.

Session host (`play.html`): `play-error`, `play-error-home`; `session-between` (`data-step`), `session-next`, `session-left`, `session-together`, `session-go`, `session-lang`, `session-stop`;
`session-complete`, `session-correct`, `session-minutes`, `session-skill-count`, `session-skills`, `session-activity` (`data-game`, `data-stars`), `session-recommendation`, `session-try`,
`session-reflection` (15-minute plans only), `session-again`, `session-home`, `session-progress`. The shell's own `[data-fm2-*]` hooks and `window.__fm2` are unchanged.

Progress: `learner-name`, `back-home`, `progress-body`, `stat-streak|minutes|stars|sessions`, `progress-empty`, `week-chart`, `week-table-wrap`, `week-table`, `next-list`/`next-row`, `due-list`/`due-row`/`due-empty`,
`game-stars`/`game-row` (`data-game`), `mastery-grid`, `mastery-cell` (`data-level` 0-3), `grade-skills`, `skill-row`, `session-list`/`session-row`/`sessions-empty`,
`export-json`, `reset-progress`, `reset-confirm`, `reset-yes`, `reset-no`, `data-notice`.

## Behaviors worth testing

- `showSummary:false` for every activity of a plan; the runner owns the completion screen. Between activities the step screen is the only interstitial; no timers or countdowns anywhere.
- Reloading inside an activity restores activity, round and earlier results; reloading on the between screen continues straight into the next activity (the shell's resume record is saved when the between screen opens); reloading on the completion screen shows it again without a second record.
- "Practice again" builds a new plan with a new seed; "Stop for now" and the shell's Back leave the resume record, so the home banner appears.
- Progress export downloads `family-math-<name>-<date>.json` = `{app, version, exportedAt, learner, data: store.state}`. Reset is an in-page confirm (`role=alertdialog`), clears the store and the session record for that learner only.
