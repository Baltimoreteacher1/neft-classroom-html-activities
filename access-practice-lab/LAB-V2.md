# Language Lab v2

The layer that makes Games & Worlds, My Progress, the Road, Teachers and Families agree. Source: `src/lab/`.
The inventory of every game, world and Road week is generated: `npm run lab:inventory` → `LAB-INVENTORY.md`.

## Honesty rules (same as PLATFORM.md)

- A scaffold **tier** is a classroom support choice, never a WIDA proficiency level.
- Readiness is **practice coverage** (how many games a learner has finished per domain). It is not a score and does not predict ACCESS.
- Language-pattern tags say what to reteach. They are not grades. A sentence with no tag is **not** certified correct.
- ES and EN+ES translate directions, chrome, hints and summaries. They **never** replace the English being practiced or assessed. Use `I.TARGET(en, es)` for a choice or clue that carries a Spanish gloss; `I.T` replaces the English in ES mode and is for chrome only.

## URLs

| Route                                               | Notes                    |
| --------------------------------------------------- | ------------------------ |
| `/access-practice-lab/games/:gameId`                | one game                 |
| `/access-practice-lab/worlds/:worldId[/:missionId]` | the four Language Worlds |
| `/access-practice-lab/road/:week`                   | the 12-week Road         |

Query parameters (`src/lab/query.js`) work on any lab URL and are remembered, so a refresh keeps them:

- `band=3-5|6-8` (alias `grades=`)
- `lang=en|es|en-es` (EN+ES is `bi` internally)
- `support=independent|guided|hands-on` (alias `mode=A|B|C`; A = Hands-on, B = Guided, C = Independent)

Build links with `labRoutes.game / world / road`.

## State: `tlp_lab_v2`

`src/lab/store.js`, key `accessPracticeLab:v1:tlp_lab_v2` (inside the existing Save/Resume boundary). Language, band and tier stay in the lab prefs; they are not duplicated here.

An event is `{ kind: "round" | "mission", gameId, gradeBand, widaDomain, widaContentArea, scaffoldTier, languageErrorTag, ok, timestamp }`. No name, no learner text, no recording. Worlds log as `world:<id>`. The record is capped at 600 events.

`migrateState` accepts any stored shape, `validateState` reports every problem, `migrateLegacyGames` folds old game history in once, and `mergeLab` unions two records for a backup import.

A game reports a round with `env.report({ id, skill, ok, ..., languageErrorTag })`; the controller (`views/games.js`) logs it. A finished game logs one mission event.

## Pieces

- **HUD** (`hud.js`): title, band, L/R/S/W badges, tier, language, mic/audio pill, reset. The Math Workbench link appears only for tasks tagged `LoMA`; `meta.js` holds the per-game content area.
- **Listening** (`listening.js`): Independent gets 2 plays per clip; Guided and Hands-on are unlimited with a 0.85× toggle. Applies to games whose domain is Listening.
- **AudioGuard** (`audio-guard.js`): `IDLE → REQUESTING_MIC → MONITORING_LEVEL → RECORDING → PLAYBACK_READY | MIC_BLOCKED_FALLBACK`. Never throws, including with no `navigator.mediaDevices`. A blocked mic offers retry and a typed fallback.
- **Speaking** (`speaking-flow.js`, `speaking-ui.js`, `speaking-session.js`): Plan & Frame, record, playback, three-point self-check (Complete idea / Academic word / Clear voice).
- **Reading** (`evidence-highlight.js`): mark the supporting phrase before locking in an answer; Tier-2 word popovers.
- **Writing** (`workbench.js`, `workbench-ui.js`, `workbench-round.js`, `tags.js`): sentence expansion, clause combining, live pattern hints. Tags: `MISSING_SUBJECT`, `ADJECTIVE_ORDER`, `VERB_TENSE_SHIFT`, `CONNECTOR_MISSING`, `SUBJECT_VERB_AGREEMENT`; each maps to a remediation game.
- **Progress** (`progress-ui.js`): readiness bars, the family snapshot and the teacher card.
- **Class view** (`class-patterns.js`): a teacher pastes students' Save/Resume codes; only the `tlp_lab_v2` record is read (names in a code are ignored) and the top 2 patterns are ranked by distinct students.

## Checks

- `node --test tools/access-lab-*.test.mjs tools/directory-partition.test.mjs`
- `npm run e2e:access-lab-v2`: deep links, refresh, HUD, replay limit, no-mic, 1366×768 and 768×1024 layout.
- `npm run e2e:access-lab-axe`: WCAG 2.1 AA (axe) on all 23 games, start and play, EN and EN+ES. Set `PW_CHROMIUM_PATH` to use an installed Chrome.
- `tools/access-lab-i18n-stems.test.mjs`: English answer choices stay on screen in ES and EN+ES.

## Adding a game

1. Add it to `src/games/registry.js` (skills, klu, objectives in both languages).
2. Tag a non-ELA content area in `AREA_OVERRIDES` (`src/lab/meta.js`) if it is science, social studies or math.
3. Report rounds with `env.report`; add `languageErrorTag` only when you can name one honestly.
4. Use `glossInline` (not `glossHTML`) for a Spanish gloss inside a button, and `I.TARGET` for English choices.
5. Run the checks above.

## Known limits

- The error-tag analyzer is heuristic and covers five patterns.
- The teacher card and class view see only data on the device or in pasted codes; there is no server-side roster.
- `/directory/` defaults to the language view on `thelanguagepage.com`, but that host currently redirects `/directory/`; changing that is a routing decision.
