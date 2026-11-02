# ACCESS Practice Lab — Family Experience 3.0

For caregivers of children in grades 3–8. Open the site → choose a language → choose a grade → start a short
session → get feedback → know what to practice next. No account, no child name, no email.
Read `PLATFORM.md` for the honesty rules (no invented proficiency; local-only data) — they bind every page here.

## Language modes (site-wide)

`prefs.lang` is `"en" | "es" | "bi"`; `prefs.langChosen` records that someone picked one. Any other value reads as English.

| Mode | Shows                                                                                     |
| ---- | ----------------------------------------------------------------------------------------- |
| `en` | English chrome, help and guidance                                                         |
| `es` | Spanish chrome, help and guidance. Activity directions show Spanish first, English second |
| `bi` | English with the Spanish directly under it, in its own `lang="es"` element                |

The practice itself is always English-language practice: passages, questions and answer choices never change.
`src/i18n.js` is the one place that decides how a mode renders. `T(en, es)` / `L("key")` return markup-safe text
(raw markup in bilingual mode); `S` / `LS` return plain strings (`"English / Español"`) for attributes and
`textContent`. Keyed copy lives in `src/strings.js`; long-form guidance in `content/family-help.json` and
`content/family-coach.json`. `docLang(view, mode)` sets `<html lang>`: `es` only on pages whose whole chrome is
Spanish (`family`); everywhere else the page stays `en` and Spanish text carries its own `lang="es"`.

The switch is in the header on every page (`EN · ES · EN+ES`), large on the family home and in setup, and a
first-visit banner offers it once (`langChosen`). Switching re-renders in place and never touches saved work.

**Localized this release:** header, footer, save panel labels, all `/family/*` pages, the Help My Child panel,
and the activity page chrome (step count, directions, mode switch, Check / Try again, navigation).
**Not yet:** the inside of studios, missions, worlds, tests, Passport, Road, and the recorder/listening
component labels. They stay English in every mode. Add a language by adding `fr:` to `strings.js` entries and
`LANG_MODES`; do not claim it until it is translated and tested.

## Routes

| Route              | Page                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `/family`          | Home: language, three ways to start, three steps, four skills, recommended session, tips, preview |
| `/family/start`    | Setup: language, grade, who, time (optional, 4 questions, auto-save, Skip, Back)                  |
| `/family/practice` | Session planner (5 / 10 / 15 min / own) + the activity finder                                     |
| `/family/progress` | What we practiced, completed, skills tried, what improved, next step; printable                   |
| `/family/help`     | Searchable Help Center (12 topics), printable quick-start                                         |
| `/family/save`     | Save & Continue Later: backup code, restore, site short code, switch learner                      |

`/family?skill=…&minutes=…&level=…` (old teacher share links) still opens the finder. Every existing activity,
room, test and Passport URL is unchanged.

## Data

Everything is in `localStorage` under the existing `accessPracticeLab:v1:` prefix; nothing new is uploaded.

```
prefs.family = { v: 1, grade: "3-5"|"6-8"|"", who: "together"|"independent"|"", minutes: 0|5|10|15,
                 done: boolean, skipped: boolean }
```

`getFamily()` (`src/family/state.js`) sanitizes on read; unknown or malformed values fall back to defaults and
no field can hold a name, birthday or email. Progress records, `ACCESS1.` backup codes and the site Save/Resume
short code are unchanged and still import. Restore keeps every activity already on the device and adds only
missing ones. Starting a new learner (`/family/save`) requires a backup first (copy, download, or a checked
confirmation), clears progress, and keeps language, text size and playback rate.

## Help My Child (Co-Pilot)

`src/family/coach.js` is pure. For each activity it reads the real goal (`skill`), title, sentence frame,
listen-for word and vocabulary (with its Spanish gloss), fills `{placeholders}` in `content/family-coach.json`,
and picks one of three variants per slot by a stable hash of the activity id. A line whose placeholder the
activity cannot supply is dropped, never guessed. With no goal it says it is giving general tips. It never reads a
child's answers, so it never claims to know the error. Spanish goals and directions for all 501 activities are in
`content/es-guide.json` (machine-drafted — see limitations). Hidden when setup says "my child practices on their own".

## Tests

| Command                                  | Proves                                                                                                                                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --test tools/access-i18n.test.mjs` | Dictionary parity and keys; mode rendering and lang tagging; help/coach schema and banned claims; es-guide covers all 501 activities; Co-Pilot has all three phases for every activity; planner, summary, setup state, help search |
| `npm run e2e:access-family`              | Journeys L, A–G, K (keyboard), W (width ladder): see below. Part of `validate:access-lab`                                                                                                                                          |

| Journey | Executed assertions (`tools/access-family-e2e.mjs`)                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| L       | three modes on all six family pages: no overflow, no `undefined`; `lang` tagging; persistence; switching keeps state                                  |
| A       | Español caregiver: setup → planner → five-minute playlist → Co-Pilot (Spanish, no placeholders) → Spanish progress → remembered                       |
| B       | independent grade 7: no Co-Pilot, reading answer + feedback, next recommendation, no mastery claims; axe                                              |
| C       | microphone denied: explanation + partner option, nothing stored as a recording                                                                        |
| D       | shared device: switch refused without backup; ACCESS1 code equals lab export; language survives; restore brings work back; short site code recognised |
| E       | 320px, bilingual, 140% text: no horizontal scroll on every family page and an activity; Help opens; targets ≥ 24px; axe                               |
| F       | offline notice, reconnect, no completed local work lost                                                                                               |
| G       | pre-3.0 record + `lang:"es"` prefs: untouched, counted, deep links and legacy finder link still resolve                                               |
| K       | keyboard-only setup: skip link first, Tab order, Space/Enter select, focus moves to the next question, 2px focus ring                                 |
| W       | 375 / 390 / 768 / 1024 / 1440 × three modes: no horizontal scroll                                                                                     |

## Requirements → code → test

| Brief §                    | Code                                                                  | Evidence                    |
| -------------------------- | --------------------------------------------------------------------- | --------------------------- |
| 3 Family landing           | `family/hub.js`, `family.css`                                         | L, A, W; screenshots        |
| 4 Setup wizard             | `family/setup.js`, `family/state.js`                                  | A, K; unit (state)          |
| 5 English / Español / both | `i18n.js`, `strings.js`, header switch, banner                        | L, W, i18n unit tests       |
| 6 Family Co-Pilot          | `family/coach.js`, `family/copilot.js`, `content/family-coach.json`   | A, E; unit (501 activities) |
| 7 Practice planner         | `family/plan.js`, `family/planner.js`                                 | A; unit (trim)              |
| 8 Activity shell           | `views/activity.js` (chrome, Spanish directions, Co-Pilot slot)       | A, E, B                     |
| 13 Progress                | `family/summary.js`, `family/progress.js`                             | A, B, G; unit (summary)     |
| 14 Save & Continue Later   | `family/save.js` over `store.js` export/import                        | D, G                        |
| 15 Help Center             | `family/help.js`, `content/family-help.json`                          | unit (schema, search)       |
| 17 Accessibility           | semantic headings/groups, `aria-pressed`, live regions, focus handoff | axe in A, B, E; K           |
| 23–24 Tests / journeys     | `tools/access-family-e2e.mjs`, `tools/access-i18n.test.mjs`           | above                       |

## Known limitations (do not describe these as done)

- **Spanish and bilingual coverage is the family experience, the header/footer and the activity chrome.** Studios,
  missions, worlds, practice tests, Passport and the recorder/listening component labels remain English.
- **Spanish text is machine-drafted** (`es-guide.json`, `family-help.json`, `family-coach.json`, `strings.js`) and
  checked mechanically, not by a native-speaker reviewer. Treat it as "reviewed for structure", not "reviewed for meaning".
- Not built in this release: weekly family challenges, skill achievement badges, speaking/writing process
  redesign (existing recorder and writing check remain), per-item content audit beyond `validate:access-lab`,
  captions/transcripts for instructional video (not audited), learner-profile switching other than clear-and-restore.
- Axe runs on the activity, progress and setup journeys, not on every screen; no screen-reader (VoiceOver/NVDA) pass.
- Offline: the existing service worker precaches the shell; the new content files are precached by `sync-access-shell`.
