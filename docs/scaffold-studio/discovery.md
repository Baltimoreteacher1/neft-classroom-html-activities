# Scaffold Studio: Phase 0 discovery

Branch `feature/scaffold-studio`, base `81ac4cb4`. Read-only findings; every fact below was checked in this repo.
Nothing here has been built yet. Items marked **DECISION** are ones I resolved so work could continue after
"full approval"; each is reversible and listed again under open questions.

## 1. What the brief assumes vs. what is here

| The brief says | What the repo actually has |
| --- | --- |
| `src/quest/` | `access-practice-lab/src/quest/` (9 files, 3.1k lines). There is no root `src/quest`. Root `src/` is unrelated (`components`, `data`). |
| "Every unit and activity under /access-practice-lab/" are pages | The lab is **one vanilla-JS ES-module single-page app**. 180 view modules under `src/views/`, a router (`VIEW_LOADERS` in `src/main.js`), one shell `index.html` (served as `app-shell` for deep links). There are no per-unit HTML pages to annotate. |
| "Unannotated pages get baseline supports" via a script | True of the SPA: one script in the shell reaches every route. Per-route annotation is data (`content/*.json`), not markup. |
| `tools/sync-access-shell.mjs` injects into exported pages | It does not. It only keeps `index.html` / `app-shell` / `sw.js` in step with the lab's own modules (content hashes, import map, modulepreload, precache). Exported Next.js apps are published by `tools/sync-static-apps.mjs`. See section 4. |
| Fonts, tokens, light/dark/high-contrast | `ds.css` (3,085 lines) is **light only** by documented design. Fonts are already self-hosted (`/assets/fonts/`). No dark or high-contrast theme exists in the lab. |

## 2. Inventory

### 2.1 Authored in this repo (editable)

| Surface | Count / location | Notes |
| --- | --- | --- |
| Units | 14: 6 for grades 3-5, 8 for grades 6-8 (`content/units/g3-5.json`, `g6-8.json`) | Each carries `vocab`, `texts`, `speaking`, `writing`, `lessons`, `task`, `pacing`, `assessment`, `family`. |
| Quick-practice activities | 882 across 8 files (`content/g3-5|g6-8/{Listening,Reading,Speaking,Writing}.json`, 3 support levels each) | Authored JSON rendered by `views/activity.js`. |
| Glossary | 1,227 terms (`content/glossary.json`): `term`, `def`, `es`, `esDef` | **No image, audio, example sentence, Arabic or Haitian Creole.** At least 10 entries have the literal string `"spanish"` as the Spanish gloss (`across from`, `decaying`, `editorial`, `eruption`, `fifteen`, `gym`, `landfill`, `morning`, `next to`, `plentiful`). Real data defect, shipped today. |
| Games | 23 modules (`src/games/`) | State in `tlp_lab_v2` via `games/state.js`. |
| Language Worlds / Adventures worlds | 7 world modules (`src/adventures/worlds/`), 4 `worlds.json` worlds | |
| Language Quest | 9 modules in `src/quest/`, missions in `content/quest/missions/*.json`, validated by `tools/validate-quest.mjs` | Has its own fading ladder (below). |
| Studios, Journey, Vocab Academy, Reading Room, Science Lab, Exhibition, etc. | Dozens of `src/*` areas | All SPA routes, all authored. |
| Audio | 4 files under `audio/publisher/` (rain-garden-0..2.mp3 plus one) | Essentially no recorded model audio. Speaking models rely on browser speech synthesis (`speech.js`). |
| Image manifest | **None** (`content/image-manifest.json` does not exist; `human-required.md` H-02 refers to one) | There is no license ledger to fail a build against. |

### 2.2 Generated

`access-practice-lab/app-shell`, the import map and `sw.js` precache lists (by `sync-access-shell.mjs`), `critical-styles.json`,
`config.json` build stamp, access finder metadata, printables. Never hand-edit; regenerate.

### 2.3 Exported bundles with no editable source

| Bundle | Files | Source |
| --- | --- | --- |
| `/language-adventures/` | 70 HTML, `_next/static` | Gone. `docs/language-studio.md`: "source is no longer on disk". Has a React hydration warning (418) only its source can fix. |
| `/language-studio/` | 67 HTML, `_next/static` | Private repo `Baltimoreteacher1/neft-language-studio`; republished with `tools/sync-static-apps.mjs`. |

Also static one-pagers (`access-expedition`, `access-family-expedition`, `access-guide`, `access-teacher`: 1-3 HTML each).

## 3. Existing support machinery (this is the main finding)

Scaffold Studio overlaps **a dozen existing modules**. Building it as a new parallel system would repeat exactly the
duplication `docs/language-world-audit.md` section 4 warns against.

| Module | What it already does |
| --- | --- |
| `src/quest/engine.js` `RUNGS = model, frame, partial, cue, independent`; `src/quest/pathway.js` `suggestRung`, `moreSupport` | A five-rung fading ladder with reasons, teacher pin/start/fade-off, "ask for more help", two-strong-in-a-row fade rule. **This is the ladder the brief says to extend.** The brief's four rungs (full, partial, hint, none) are a coarser view of these five. |
| `src/lang/fade.js` | Gradual-release trend per Key Language Use (guided, supported, independent). Never a level. |
| `src/lang/supports-report.js` | Counts of supports opened and own-work share for Passport, teacher sheet and family letter. No score, no percentage. |
| `src/lang/thermostat.js` | 3-position support dial (Full, Balanced, Solo) per domain in localStorage. The "support dial" the brief wants exists in a small form. |
| `src/support-engine/engine.js` | One place answering "which scaffolds for this support level, domain, activity". Reads `book/lang/profiles.js` and `resource-intelligence.js`. |
| `src/glossary.js` | Tap-a-word on passages: kid definition and Spanish, supports-mode only, counts as opened help, first occurrence, max 12 per text, keyboard list alternative. |
| `src/lang/scaffolds.js`, `src/multilingual.js` | Morphology bridges, 40-ish academic cognates, false friends (English-Spanish only). |
| `src/lang/silent-bridge.js` | Whisper / build-silently mode for the silent period; receptive mastery kept separate. |
| `src/lang/scaffold-check.js` | Rule-based checks for Sentence Architecture, Evidence Builder, Upgrade Lab. Names what is missing; no score. |
| `src/lang/rehearsal-route.js`, `speech-feedback.js`, `recorder.js`, `audio-session.js` | Rehearsal routing, speech feedback, in-memory recorder, iOS audio rules. |
| `src/ladder.js`, `comfort.js` | Reading Ladder (6 steps), comfort settings. |

**Integration strategy: one orchestration layer, not a second stack.** `src/scaffold/` (new) owns the schema, the
levels-by-WIDA-and-band defaults, the single support-dial state, and the profile/export. It *calls into* the modules above
(glossary, thermostat, ladder, supports-report, recorder) through thin adapters, and the existing modules keep working
unchanged when the layer is absent.

## 4. Storage, tokens, privacy

- **Storage.** All keys are `accessPracticeLab:v1:*` (`store.js` `PREFIX`). `/move`, "Start fresh" and the offline pack treat that
  prefix as lab data, and old keys are a compatibility contract. New state will be one versioned key,
  `accessPracticeLab:v1:scaffold` (dial, per-domain fade, supports used/dropped).
- **Tokens.** `ds.css` `:root` plus `engine/design/tokens.json`, compiled to `ds-tokens.generated.css` with computed contrast
  pairs (`npm run validate:design-tokens`). Type: Plus Jakarta Sans (headings), Inter (UI/body), Source Serif 4 (passages),
  JetBrains Mono (codes). Body 16px/1.6, measure at most 68ch. Domain colours are each paired with an icon and a word.
- **Hard rule: no purple/violet/magenta anywhere** (`validate:palette`, `validate:no-purple`, and a standing instruction from
  Joel). Any dark or high-contrast theme must obey it.
- **Privacy.** No accounts, no analytics, no third-party scripts (`validate:external-scripts`, `validate:self-hosted-fonts`).

## 5. Conflicts between the brief and standing repo rules (DECISIONs)

1. **WIDA level targets.** `language-world-audit.md` section 6: "No WIDA level or ACCESS score is computed or shown (the validator fails a mission that names one)."
   *Decision:* the schema's `widaTarget` is a **teacher-set starting point for default support**, never inferred from student
   work and never shown to students. Level-aware defaults are keyed by a teacher-chosen "support starting point" labelled by
   WIDA 1-6 descriptor for planning only. `validate-quest` rules stay intact.
2. **AI layer.** The lab promises "no AI calls". *Decision:* Phase 7 ships as an adapter interface, a deterministic
   fallback, the privacy/proxy doc and the eval harness, with the feature flag **off and unreachable in production builds**
   until the eval thresholds pass. No keys, no proxy, no network code that can run.
3. **"Block unapproved content in production."** All 1,227 existing glosses are unreviewed. Enforcing the gate on legacy
   content would blank today's tap-a-word help for every student. *Decision:* the review-status gate applies to
   **Scaffold Studio content** (new `content/scaffold/`); legacy glossary entries are read as `legacy-unreviewed`, surfaced
   in the teacher UI and in `human-required.md`, and can be switched to strict by one constant.
4. **"Build fails on missing audio / glosses / unlicensed assets."** There is no audio and no image ledger today, so a
   global failing gate is red on day one. *Decision:* gates are scoped to a `pilotUnits` list (the two pilots) and to new content;
   everything else is reported with a ratchet that may only go down, the same pattern as `validate:family-readability`.
5. **Haitian Creole and Arabic.** None exist in the lab. They will be machine-drafted, labelled `draft`, and kept out of student view.

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Duplicating the modules above | Orchestrate and adapt; no second ladder, second glossary or second recorder. |
| ~200-check `validate` gate; `dist/` was documented on 2026-11-04 as 5 files under Cloudflare's 20,000-file cap | Keep new files few; no per-term pages; data as a few JSON files. Check `validate:dist-file-budget` before every push. |
| Existing URL answers (CLAUDE.md "never change what a URL answers") | Add routes only (`/access-practice-lab/styleguide`); redirect/gate nothing. |
| Core layer under 60 KB gzipped | Lazy-load data, audio and every component; measured by a script, not asserted. |
| Student-facing behaviour change in production | Layer ships **default-off for students** behind a flag until the pilot units are reviewed; teachers can enable. |
| Safari and Firefox, Chromebook Lighthouse profile, screen-reader pass | Cannot be run from this environment. Written as scripts and manual checklists; reported as "not run", never as passed. |
| Native-speaker and WIDA review, human-recorded audio, BCPS approvals | Cannot be done by software. Data model and release gate exist; the work is listed in `human-required.md`. |

## 7. Effort by phase (honest)

| Phase | What is realistic in code | Needs people |
| --- | --- | --- |
| 1 Design system | Tokens (light/dark/high-contrast, no purple), computed contrast gate, reading-face and size/dyslexia options, 8 components, style guide route | Visual review; dyslexia font choice and license check |
| 2 Architecture | Versioned schema + validator, fading logic with tests, level defaults, research-basis doc (uncertain items marked) | WIDA-trained review of defaults and citations |
| 3 Features | Word popover, sentence chunking, frame tray, grow-a-sentence, rehearsal recorder, briefing, ask-the-passage with refusal | Linguist review of chunk explanations |
| 4 Content/audio | Audio manifest + loudness/validation pipeline, review-status field and gates, images ledger, editorial doc | **All** human audio, native review, licensed art |
| 5 Integration | Web component + baseline layer on the SPA, quest-step hook, one global dial, two pilot units | Pilot unit selection; export-bundle injection is a separate decision |
| 6 Profile/evidence | Local profile, student view, CSV/JSON export, one-page print summary | Data-meeting format review |
| 7 AI | Adapter, fallback, eval harness, privacy doc, flag off | District privacy review before any proxy |

## 8. Open questions (answers assumed above; tell me to change any)

1. Which two units pilot? *Assumed:* the first unit of `g3-5.json` and the first unit of `g6-8.json`.
2. Is injection into the two Next.js exports in scope now? *Assumed no:* they are untouchable without source, and
   `/language-adventures/` already links back to the lab. A `sync-static-apps.mjs` post-step is the only safe route and
   changes what those URLs serve, so it needs Joel's call per CLAUDE.md.
3. Dyslexia-friendly face: *Assumed* Atkinson Hyperlegible (SIL OFL) plus a spacing/line-height option, rather than OpenDyslexic,
   because the evidence for OpenDyslexic is weak (**needs verification** in `research-basis.md`).
4. Is shipping the layer to production default-off acceptable as "deploy"? *Assumed yes.*
