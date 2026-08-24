# Overnight audit and hardening — 2026-08-18

**Read section 2 first.** Everything else is evidence for it.

Blocks 1–7 all reached. One work block shipped code; blocks 2–6 were audits and
changed nothing, as instructed. **No deploy was made** — see Decision 0.

---

## 1 · What shipped

One commit of code, on branch `claude/overnight-audit-hardening-iyngrn`:

- **`b491192e` — fix: the unit hub was handing every lesson a different lesson's
  worksheet.** Regenerates `curriculum/lesson-bonus-activities.js`, re-keys
  `LESSON_PRINTABLES` in `assets/curriculum-hub-search.js`, bumps the
  `curriculum-hub-search.js` cache stamp on BOTH hub pages, adds
  `npm run validate:lesson-catalogues`, and widens
  `tools/curriculum-hub-assets.test.mjs` to every tracked page.

Five report commits (`c1687af9`, `f49af72f`, `742b084e`, `ed6748bf`, `93e0bae6`)
carry blocks 2–6 of this document and one `.gitignore` line.

**Deploy sha: none.** `smoke:live --expect <sha>` is part of the chain R4
requires, and production is unreachable from this session — every request to
`eduwonderlab.com` fails with `CONNECT tunnel failed, response 403` at the agent
proxy. Deploying without the post-deploy verification would have broken the rule,
so I stopped. The change is committed and pushed and is one `ship` away.

---

## 2 · What you must decide

### Decision 0 — ship the hub fix

`b491192e` is ready and gated but not deployed, because production is not
reachable from this session and R4 requires `smoke:live --expect <sha>` to close
the chain. Until it ships, **every lesson row on `/curriculum/units/` keeps
offering the wrong lesson's worksheet and bonus activity** — 147 of 174 rows,
measured in a browser.

- **A (recommended):** `ALLOW_DEPLOY=1 npm run ship -- b491192e` from a machine
  with network, then read the `smoke:live` output. This is the single
  highest-impact student-facing fix in the report.
- **B:** review the diff first. It is 12 files; the two that matter are the
  regenerated bonus map and the re-keyed printables map, and both re-keys agree
  independently with `data/toc-migration.json`.

### Decision 1 — `LESSON_PROJECTS` is legacy-keyed and I did not touch it

34 keys in `assets/curriculum-hub-search.js` link to games under `/math/unit-N/`,
so the key-agreement invariant cannot see them. 16 of the 34 share more words
with the title the key USED to name than with the title it names today: lesson
1-1 "Math is Mine" is offered "Lesson 1-1: Prime Factorization Game"; lesson 9-3
"Write Equations to Represent Relationships Between Two Variables" is offered
"Lesson 9-3: Compare and Order Integers Game".

Re-keying needs someone to decide which current lesson each game belongs to.
That is a content call, so I stopped.

- **A (recommended):** you supply the 34-row mapping, I apply it and extend
  `validate:lesson-catalogues` to hold it against `data/curriculum-manifest.json`.
- **B:** re-key mechanically through `data/toc-migration.json` — fast, and wrong
  wherever a game was chosen for the lesson rather than the number.
- **C:** leave it and accept that the hub offers games labelled for one lesson on
  another lesson's row.

### Decision 2 — Insight Brief's catch-up routing

`CATCHUP_BANDS` in `teacher-tools/insight-brief/insight-engine.js` is a
hand-written map of catch-up stations, on the old unit numbering. Replaying its
own `catchupPath()` over all 84 lessons with `_redirects` applied: 69 land in
their own unit, **12 land in a different unit** (every unit-7 lesson goes to
`/lessons/8-7-catchup/`), **3 land nowhere** (10-4, 10-5 and 10-6 all route to
`/lessons/10-5-catchup/`, which has no page and no redirect), and **18 of the 36
built catch-up stations are unreachable**.

Which station covers which lessons is a pedagogical decision.

- **A (recommended):** you give the band table per unit from the 36 stations that
  exist; I replace `CATCHUP_BANDS`, derive it from disk where possible, and gate
  it both directions.
- **B:** fix only the dead one — point unit 10 at `10-6-catchup` — and leave the
  cross-unit routing. Smallest change, removes the 404, leaves 12 lessons
  pointing at another unit's station.
- **C:** audit only, no change.

### Decision 3 — `teacher-tools/post-forms/` and the Google Forms

Its catalogue is `forms-index.json`: 64 entries on the OLD lesson numbers,
pointing at real Google Forms that exist outside this repo. A teacher looking
for lesson 7-2's exit ticket has to know it is filed as 9-4, and 20 current
lessons have no form at all.

- **A:** re-key `forms-index.json` to current lesson ids, leaving the Google Form
  documents named as they are. Mechanical, no external change, fixes the search.
- **B (recommended):** re-key AND rename the Forms in Drive so the two agree.
  More work, but the alternative is a permanent translation layer in your head.
- **C:** leave it.

### Decision 4 — two "My Progress" pages showing disjoint data

The curriculum hub links both, four times, with nothing to say they differ.
`/curriculum/my-progress/` shows lesson and arcade work (`nt-signal:v1`);
`/math/my-progress/` shows standalone activities and choice boards
(`nt_results_v1`, `choiceboard-u*`) and tells the student it holds "Everything
you've completed on this device". Proven disjoint in a browser by seeding both.

- **A (recommended):** make `/math/my-progress/` read NTSignal too, so the page
  that claims everything has everything. Additive, no data migration.
- **B:** make each page say what it covers and link the other. Cheapest, honest,
  leaves the student with two pages.
- **C:** merge them into one and redirect. Cleanest end state, biggest change,
  and both URLs are load-bearing for bookmarks.

### Decision 5 — `place-value` and the 403 discarded misconception tags

`place-value` (363 uses), `sign-error` (36) and `fraction_digits_as_percent` (4)
are in no taxonomy, and I verified by running the shipped module that the engine
discards all 403: no label, no student sentence, no recorded count. That is
17.5% of every misconception tag authored in the curriculum.

`sign-error` → `sign-dropped` and `fraction_digits_as_percent` →
`percent-scale-off-by-100` look mechanical. **`place-value` is not**: the
taxonomy's `decimal-place-value` is narrower than what 363 authoring sites
appear to mean, and its student sentence talks about the decimal point.

- **A (recommended):** add a new `place-value` code to the taxonomy with its own
  label and student sentence, and alias the other two. You write the two
  sentences; I wire it and gate that every authored tag resolves.
- **B:** alias `place-value` → `decimal-place-value` and accept that non-decimal
  place-value errors get a decimal-flavoured explanation.
- **C:** leave it; 403 tags keep producing nothing.

### Decision 6 — small-group derivation, or just a consistency gate

Measured drift is 4 of 168 pairs, which does not justify a migration on its own.
What is missing is any check that a variant still matches its parent.

- **A (recommended):** the consistency gate alone — regenerate each variant in
  memory, fail on any difference outside the declared transform. ~1 day, would
  have caught all four drifted pairs, no migration.
- **B:** the full parent + declared-transform model, ~2–3 days, resolved at build
  time so no consumer changes.
- **C:** neither.

### Decision 7 — the one English-only project page

`math/unit-10/projects/world-architect/` has zero Spanish: no `.es-text`, no
`lang="es"`, no accented characters in 133 KB. The other 26 student-facing
project pages are 100% paired (3,995 of 3,995 `.en-text` elements). It became
reachable from the gallery in the previous commit, so students can now find it.

- **A (recommended):** translate it to match the other 26. Content, so yours.
- **B:** hide it from the gallery until it is translated.
- **C:** ship it English-only and note it.

### Decision 8 — the language objective is English-only in all 288 lessons

`contentObjective` and `languageObjective` carry no `Es` field in any lesson, so
the sentence telling a multilingual learner what language work the lesson expects
is only ever in English. Along with `cloze` (2,106), `question` (1,092),
`caption` (514) and `example` (317), these are surfaces the bilingual layer has
never covered — not omissions, absences by construction.

- **A (recommended):** add `languageObjectiveEs` and `contentObjectiveEs` to the
  schema and translate 288 of each. I can add the fields and the gate tonight's
  successor run; the strings are yours.
- **B:** language objective only (288 strings), leave the rest.
- **C:** record the gap and move on.

---

## 3 · Findings ranked by student impact

**1. The unit hub served every lesson a different lesson's worksheet.** FIXED,
not yet deployed. 147 of 174 lesson rows offering a bonus activity linked to
another lesson; 147 of 174 offering printables served another lesson's worksheet,
word search, colour-by-number and MCAP packet. Lesson 1-1 "Math is Mine" handed
out lesson 6-13's Prime Factorization worksheet. Every link resolved HTTP 200, so
nothing could see it. A student doing the assigned practice was practising a
different unit's mathematics. Proven in a browser before and after; 0 after.

**2. 403 misconception tags a teacher wrote are thrown away.** NOT FIXED
(Decision 5). 17.5% of every misconception tag in the curriculum names an error
the engine has no code for, so the student sees a generic "Not quite" instead of
their thinking named, and the teacher's top-misconceptions list never mentions
it. Verified by executing the shipped module.

**3. Two "My Progress" pages, disjoint data, both linked as "My Progress".** NOT
FIXED (Decision 4). A student who spent the week in lessons opens the page the
hub calls "Open My Progress" and is told they have done nothing.

**4. Insight Brief sends 3 lessons to a dead catch-up link and 12 to another
unit's station.** NOT FIXED (Decision 2). 18 of 36 built catch-up stations are
unreachable from it.

**5. Units 1, 9 and 10 are ~95% untranslated** against 37–47% elsewhere. NOT
FIXED, and not mine. Units 1 and 10 are the "Math is…" lessons that open and
close the year.

**6. One project page has no Spanish at all** and just became reachable from the
gallery (Decision 7).

**7. The review arcade records no standard and erases the resume point.** NOT
FIXED. `standard: ""` fails the store's key check, so every question answered
there is invisible to My Progress, Close the Loop and spaced review; and
`lesson: "unit-3"` overwrites `lastLesson`, after which the hub's "Pick up where
you left off" strip disappears rather than mislinking.

**8. `WARMUP_RETEACH` is shown to students as one of their skills.** NOT FIXED.
An internal sentinel written as a standard code, rendered raw by
`/curriculum/my-progress/`. Proven in a browser.

**9. The units hub was serving a cache-stamped-stale script** for this repo's
entire history. FIXED. Nothing could have reached a browser that had cached
`?v=8d0adf7a`, including fix 1.

**10. Project completions reach only the portfolio.** NOT FIXED. 27 completable
projects, and no progress consumer knows a student finished one.

**11. Small-group drift: 4 of 168 pairs.** NOT FIXED (Decision 6). Small, but
nothing detects the next one.

**12. Readability: 45 samples across 34 lessons above FK 6.** NOT FIXED, and a
report rather than a gate is the right form.

---

## 4 · Every fleet-wide number, with its hand-check

- **147 of 174** hub rows misrouted (bonus, and again printables) — detector
  compares each catalogue key against the lesson its own entries link to.
  Hand-checked 11 bonus keys and 10 printable keys against `lessons/<id>/config.json`:
  **21/21 correct, 0 false positives.** Cross-corroborated: all 55 re-keys agree
  with `data/toc-migration.json`, which was not used to compute them. An earlier
  version of this probe said 165 by counting group rows that correctly inherit
  from their parent; 147 is the corrected figure.
- **403 discarded misconception tags** (`place-value` 363, `sign-error` 36,
  `fraction_digits_as_percent` 4) — not sampled, **verified by executing** the
  shipped `recordMisconception` / `misconceptionLabel` / `studentExplanation` on
  each id. All three return nothing; `decimal-place-value` returns a label, which
  is the control.
- **107 misconception ids across five vocabularies** — exact set arithmetic over
  four files. Overlap re-checked case- and separator-insensitively; exactly one
  id is shared by any two vocabularies.
- **12 cross-unit and 3 dead catch-up routes; 18 of 36 stations unreachable** —
  hand-checked all 8 station paths involved against disk, `_redirects`,
  `data/routes.json` and `functions/_lib/redirect-map.js`: **8/8 correct.** The
  first version of this said "34 lessons 404" by reading disk without applying
  `_redirects`; that number is wrong and is not used.
- **68% of 43,751 translatable lesson slots carry Spanish; 288 lessons all
  partial** — hand-checked 12 sampled untranslated slots: 10 were fields that
  carry `Es` elsewhere (genuine gaps), 2 were fields that carry it nowhere. The
  reported figures separate those two populations for exactly that reason.
- **3,995 of 3,995 `.en-text` elements paired on 26 project pages; 1 page with
  none** — the one page verified directly (0 `.es-text`, 0 `lang="es"`, 0
  accented characters in 133 KB).
- **FK mean 4.18, median 4.0, 45 samples above 6.0 across 34 lessons** —
  hand-checked both extremes: **10/10 highest genuine**, **2/10 lowest genuine**
  (8 are fill-in-the-blank frames where FK does not apply). That check found two
  detector bugs, which is why the pre-fix figures (mean 5.27, max 21.4) are not
  reported.
- **168 pairs: 123 field paths identical, 24 transformed, 194 dropped, 15 drift
  candidates; real drift 4 pairs** — hand-checked the dangerous candidate class:
  of 24 items whose `correctIndex` differs from the parent's, **0 have the same
  stem and choices**, so none marks a different option correct.
- **491 mismatched and 78 shared warm-up ids** — checked the consumer rather than
  assuming: saved answers are keyed by array index inside a per-lesson record, and
  no `q.id` consumer exists in the renderer. Cosmetic.

Three detectors were wrong before they were right tonight, and each was caught by
the hand-check rather than by review: the lesson-id comparison that produced
identical results across eight unrelated files, the readability tokeniser that
counted stripped numerals as words, and the catch-up probe that read disk without
applying `_redirects`. The numbers those produced are recorded in the block log
and are not used anywhere in this report.

---

## 5 · What I could not verify

- **Anything about the live site.** `eduwonderlab.com` is unreachable from this
  session: every request fails with `CONNECT tunnel failed, response 403` at the
  agent proxy, confirmed against `$HTTPS_PROXY/__agentproxy/status`. So
  `smoke:live`, `ship:verify`, `diagnose:student-access` and
  `diagnose:production-access` did not run. **Student access being public,
  teacher HTML and APIs returning 401, and the absence of Cloudflare Access on
  the student runtime are all UNVERIFIED tonight** — not failing, not passing,
  not checked.
- **Whether the deployed build carries any of this.** No deploy was made and no
  build stamp was read.
- **How many parent-lesson changes failed to propagate over the last N commits.**
  This clone has 55 commits and only two touch a lesson config, one of them a
  bulk import. The content-based measurement in Block 6 replaces it; the history
  measurement is simply not available here.
- **Shell-control Spanish coverage.** In a built lesson at `?lang=es`, 7 of 9
  visible controls carry no `.i18n-es` lane, including "💾 Save / Resume" and
  "🧰 Tools". I did not trace each label to its source, so some may be bilingual
  by a mechanism the probe cannot see. A lead, not a count.
- **Whether the 34 `LESSON_PROJECTS` entries are genuinely mislabelled.** The
  text-overlap evidence is strong for 16 of them and undecidable for 17. It is
  evidence, not a verdict.

**Still yours, still not done: the Canvas Student View test on lesson 1-1.** It
has not run. Every statement anyone has made about live Canvas behaviour —
including everything in this repo's docs and everything I could have said
tonight — remains inference until that test is run against a real Canvas course.
Nothing in this report changes that, and nothing tonight tested it.

---

## 6 · Blocks reached

All seven. Blocks 2, 3, 4, 5 and 6 were audit-only by instruction and changed no
code. Block 1 shipped one commit. Block 7 ran the full gate.

---

## 7 · Validator and contract results

### The full pre-push gate — PASS 76/76

    npm run qa:loop        PASS 76/76   wall 334.1s
    log: .qa-logs/qa-2026-08-18T09-15-40-933Z.log
    STATUS: PASS — no deploy, commit, or push performed.

Every member green, including the new `validate:lesson-catalogues` and the
widened `curriculum-hub-assets` ratchet. `npm test` 213/213 within it.

**One honesty note on that run.** `validate:lesson-boot` reported PASS in 5.9s
inside `qa:loop`. This repo's own documentation says a real run takes ~200s and
that the time difference is the tell — a 1s pass means it found no browser and
probed nothing. So I re-ran it standalone with `PW_CHROMIUM_PATH` pointing at the
system Chromium:

    PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
      npm run validate:lesson-boot
    → 17/17 pages rendered; 0 failed.   PASS — all probed pages render.
    (took over two minutes, which is what a real run looks like)

The 5.9s figure inside `qa:loop` should be read as SKIPPED, not as 17 pages
rendering. The standalone run is the one that counts, and it is green.

### The contract checks — NOT AVAILABLE IN THIS ENVIRONMENT

None of these ran, because `eduwonderlab.com` is unreachable from this session
(`CONNECT tunnel failed, response 403` at the agent proxy, confirmed against
`$HTTPS_PROXY/__agentproxy/status`):

- `npm run smoke:live` — NOT AVAILABLE
- `npm run diagnose:production-access` — NOT AVAILABLE
- `npm run diagnose:student-access` — NOT AVAILABLE
- `npm run ship:verify` — NOT AVAILABLE

So **student access being public, teacher HTML and APIs returning 401, and the
absence of Cloudflare Access on the student runtime are UNVERIFIED tonight.**
Not failing — unchecked. Please run `npm run diagnose:production-access` from a
networked machine before relying on any statement about the live contract.

### What the source-level gates did confirm

These ran and passed, and they cover the parts of the contract that do not need
the network:

- **Routes resolve without cross-redirect** — `audit:links` PASS,
  `validate:static` PASS, `validate:curriculum-links` PASS.
- **SCORM package targets resolve across all families** — `validate:scorm` PASS,
  `validate:scorm-runtime` PASS, `validate:scorm:fleet` PASS (all 554 packages
  opened and CRC-checked).
- **Project completion** — `validate:projects-check` PASS,
  `validate:projects-publication` PASS, `validate:preunit-project` PASS, and
  `validate:hub` PASS, which is the check that holds all three project
  catalogues against disk in both directions at 27 completable variants.
- **Pacing** — `validate:pacing-unit-order` PASS, `validate:planning` PASS.
- **Supports on all declared surfaces** — `validate:lesson-supports` PASS and
  `validate:support-equivalence` PASS (1,588 configurations across screen, print
  and export). `e2e:supports`, which drives the workflow in a real browser
  including SCORM and `?lang=es`, needs a preview server and was **not run**.
- **Auth is still pinned** — `validate:auth-contract` PASS, so the five
  auth-critical files are byte-identical to the frozen baseline.


### Addendum — two CI checks are red on `main`, found by opening the PR

Neither is caused by tonight's change; both reproduce on `main`. Full diagnosis
is in the PR thread. Recorded here because one of them is a real finding:

- **`master-copy-guard` is pointed at the wrong file.** It greps
  `curriculum/index.html` for `>Google Slides</a` and reports "the slides wiring
  was lost". There are 0 there and **84 in `curriculum/units/index.html`** — the
  per-lesson content moved and the guard's target did not follow. `origin/main`
  has 0 too, so it fails on every PR. Its other four assertions (activity
  dropdown, Teacher Tools panel, the 3,000-line floor, no Vercel Forms) are being
  evaluated against the same wrong file, so **the guard currently protects very
  little of what it was written to protect.** Decision needed: point it at
  `curriculum/units/index.html`, or check both.
- **`smoke` pins Node 20 against a lockfile that needs Node ≥ 22.19.**
  `undici@8.9.0` declares `"engines": {"node": ">=22.19.0"}`, `jsdom@30.0.1`
  needs it, and `scripts/generate-download-manifest.mjs` imports jsdom inside
  `npm run build`, which is the Playwright `webServer`. Last green run was
  2026-08-16, before that lockfile landed. One-line fix:
  `.github/workflows/games-smoke-test.yml:35`, `"20"` → `"22"`.

I did not push either fix: both are CI-config changes that alter what a gate
asserts, both predate this branch, and neither is what tonight was for.
`claude-review` passed; `Required quality gate` was still running at hand-off.


---

## 8 · Frozen-path diff

Empty, as required.

    git diff c1883486..HEAD -- functions/_lib/ functions/api/ tools/scorm/ \
        assets/lib/zip-store.js assets/canvas-bridge.js
    (no output)

The complete list of files changed tonight is 12: `.gitignore`, `CLAUDE.md`,
`assets/curriculum-hub-search.js`, `curriculum/index.html`,
`curriculum/lesson-bonus-activities.js`, `curriculum/units/index.html`,
`package.json`, `reports/overnight-2026-08-18.md`,
`scripts/generate-lesson-bonus-map.mjs`, `scripts/qa-run.mjs`,
`tools/curriculum-hub-assets.test.mjs`, `tools/validate-lesson-catalogues.mjs`.
None is in a frozen path. `og-curriculum.png`, catch-up package filenames and
small-group packaging were out of scope and were not touched.

### Was any gate weakened?

No, and one error path was deliberately made non-fatal — stated plainly because
it is the only change of its kind:

- `tools/curriculum-hub-assets.test.mjs` — **strictly stronger.** The removed
  lines are the single-page versions of two assertions; both are replaced by
  multi-page equivalents that still require `curriculum/index.html` to reference
  each asset. It checked 5 stamps on 1 page and now checks 7 across every tracked
  page.
- `scripts/qa-run.mjs` — additive: one new `COVERAGE` rule. `tools/qa-run.test.mjs`
  (the ratchet that fails if the parallel set stops covering the serial one)
  passes.
- `package.json` — additive: `validate:lesson-catalogues` added to `validate`.
- `scripts/generate-lesson-bonus-map.mjs` — **this one relaxed a throw.** The
  generator refused to run at all unless `curriculum/index.html` contained
  `BEGIN/END_LESSON_BONUS_MAP` markers, which it has not for this repo's whole
  history because both hub pages now load the file with a plain `<script src>`.
  That throw is precisely why the map on disk still carried the pre-renumber
  lesson numbers. It is a generator, not a gate, and the check it enforced was
  about where to write a second copy nobody reads. It now injects when the
  markers are present and reports when they are not.

---

## Block log — the evidence behind everything above

Written as each block finished, before the summary above existed.

---

## BLOCK 1 · Private-catalogue sweep

### 1.1 The headline finding — the unit hub serves the wrong lesson's materials

**Status: PROVEN IN A BROWSER, on the real page, with the shipped code.**

`/curriculum/units/` is the page a student or teacher opens to reach a lesson's
bonus activity and its printables. It builds that list at runtime in
`assets/curriculum-hub-search.js`: it scrapes each `details.lesson` block, reads
the lesson id out of that lesson's own `/lessons/<id>/` link, and looks that id
up in two catalogues — `LESSON_BONUS_ACTIVITIES` (loaded from
`curriculum/lesson-bonus-activities.js`) and `LESSON_PRINTABLES` (an inline map
in `curriculum-hub-search.js`).

Both catalogues are keyed by the **pre-2026-08-10 lesson numbers**. The page
looks them up with **current** lesson numbers. The two number spaces overlap, so
almost every lookup succeeds — and returns a different lesson's material.

Measured in Chromium against `window.NTHubUnits`, the hub's own canonical
scrape, after the page finished rendering:

- 252 lesson rows on the page (84 core lessons × core + group1 + group2)
- 174 rows are offered a bonus activity — **147 of them link to a different
  lesson**
- 174 rows are offered printables — **147 of them serve a different lesson's
  worksheet, word search, colour-by-number and MCAP packet**
- 78 rows (26 core lessons × 3) are offered **neither**, including lessons whose
  materials exist on disk and are being shown on some other lesson's row

Concrete instances, read off the rendered page:

- Lesson **1-1 "Math is Mine"** offers "🔐 Factor Tree Code Breaker" →
  `/lessons/6-13/?extra=activity`, and "📝 Practice Worksheet (A & B)" →
  `/lessons/6-13/worksheet.html`. Lesson 6-13 is *Prime Factorization*.
- Lesson **8-3 "Write and Solve Equations Using Multiplication or Division"**
  serves lesson **2-9**'s printables — *Describe Data by Mean Absolute
  Deviation*.
- Lesson **10-4 "Math is Ingenuity"** serves lesson **5-7**'s printables —
  *Determine Surface Area of Prisms*.
- Lesson **6-13 "Prime Factorization"** — whose activity is being handed to 1-1
  — is itself offered nothing.

Student impact: a student who clicks "Practice Worksheet" on the lesson they are
actually in downloads a worksheet for a different unit. A teacher who assigns
the bonus activity from the hub assigns the wrong one. This is silent: every
link resolves HTTP 200, so nothing 404s and no check that only asks "does this
link work?" can see it.

Root cause: both catalogues were generated before the 2026-08-10 Reveal-TOC
renumber and never regenerated. `curriculum/lesson-bonus-activities.js` says
"Auto-generated … do not edit by hand", and its generator
(`scripts/generate-lesson-bonus-map.mjs`) keys strictly by the on-disk lesson
directory — so a fresh run cannot produce the committed file. The committed file
is stale, not wrong-by-design.

**Hand-check (R3).** The fleet number 147 rests on a detector that compares each
map key against the lesson id its own entries link to. Sampled 10 printable keys
and 11 bonus keys deterministically and checked each against
`lessons/<id>/config.json` on disk:

- bonus map, 11 sampled: 9 disagreeing keys all genuinely misrouted (the
  activity name matches the *target* lesson's `practice.optionalActivity.name`,
  never the key lesson's); 2 agreeing keys (4-2, 5-1) genuinely coincide because
  the renumber left those ids unchanged. 11/11 correct.
- printables map, 10 sampled: 8 disagreeing keys all genuinely misrouted (served
  files sit under the target lesson's folder and match its title); 2 agreeing
  keys (3-1, 5-1) genuinely coincide. 10/10 correct.
- No false positives found. All 280 printable hrefs resolve to files that exist
  on disk, no key has more than one target lesson, and no two keys target the
  same lesson — so the re-key has exactly one unambiguous answer.

### 1.2 The false lead this detector started as (recorded so it is not repeated)

The first pass of this sweep counted distinct `"N-M"` literals per file and
compared them against `data/curriculum-manifest.json`. It reported that eight
unrelated surfaces were each missing the same 26 lessons and each listed the same
6 phantoms. Identical results across eight independent files is the signature of
a broken detector, not of eight independent bugs.

It was broken. Those files are **legacy-keyed**, and the legacy and current id
spaces are both `\d+-\d+`, so every legacy key looked like a current lesson and
every renumbered lesson looked missing. The second pass — resolve each literal
through `data/toc-migration.json` first — was also wrong, in the other
direction: it "translated" files that were already current-keyed
(`curriculum/lesson-family-homework.js`, `engine/core/small-group-math-check.js`)
and reported 19 phantom gaps in files that are complete.

Neither number is in this report. The detector that is reported here compares a
key against **the link inside its own entry**, which needs no external table and
cannot be fooled by an id that exists in both schemes.


### 1.3 What shipped in Block 1

Three mechanical fixes, one new gate, one widened ratchet.

**Fix A — regenerate the bonus-activity catalogue.**
`curriculum/lesson-bonus-activities.js` is auto-generated and says so, but its
generator threw on every run: it insisted on `BEGIN/END_LESSON_BONUS_MAP`
markers in `curriculum/index.html` that no longer exist, because both hub pages
now load the file with a plain `<script src>`. A generator that cannot be run is
not a source of truth, which is exactly how the file stayed on the old numbers.
The generator now injects when the markers are present, says so when they are
not, and always writes the file that is actually loaded. Regenerated output: 65
entries, every key equal to the lesson its own link targets.

**Fix B — re-key the printables catalogue.**
`LESSON_PRINTABLES` in `assets/curriculum-hub-search.js` cannot be regenerated
here: `scripts/integrate-lesson-printables.mjs` is a one-shot import from source
folders on Joel's own machine. It did not need to be. Every entry's files
already sit under the correct current lesson folder — only the key was stale —
so each key was set to the lesson its own hrefs point at. That answer is unique
and checkable: no key had more than one target lesson, no two keys targeted the
same lesson, and all 280 hrefs resolve to files that exist. As an independent
corroboration, all 55 re-keys agree exactly with `data/toc-migration.json`,
which was never consulted to compute them.

**Fix C — the units hub was serving a cache-stamped-stale script.**
`curriculum/units/index.html` loaded `/assets/curriculum-hub-search.js?v=8d0adf7a`.
That stamp matches no version of the file — not the current one and not HEAD's
(`9b8781e6`) — and it has been there for this repo's entire history. The stamp
IS the content hash, so a browser that cached that URL could never be given a
hub-search update, including the fix above. Both pages now carry `?v=ebba8de4`.

**Gate — `npm run validate:lesson-catalogues`** (`tools/validate-lesson-catalogues.mjs`,
wired into `npm run validate` and into `qa:fast` coverage). Three invariants over
all three hub catalogues, each with its own consequence message: key agreement,
disk in both directions, and parents-as-well-as-children. Self-tests six
detectors against known-bad fixtures before sweeping. Each direction was proven
to fire independently and then reverted clean:

- revert the printables re-key → 55 mislabelled keys reported, plus 24 omissions
- revert the regenerated bonus map → 55 mislabelled, 24 omitted, 23 phantom
- drop one key → the omission fires alone, naming the lesson
- add a key for a lesson with nothing on disk → the phantom check fires alone
- key `5-1-group1` instead of `5-1` → the variant-key check fires
- create an orphan `lessons/77-7-group1/` → the parent check fires

**Ratchet widened — `tools/curriculum-hub-assets.test.mjs`.** It recomputed each
hub asset's content hash but read only `curriculum/index.html`, which is why
Fix C's stale stamp survived indefinitely. It now checks every tracked HTML page
that references one of those assets, discovered by scanning rather than listed,
so a third consumer cannot escape it the way the second one did. Proven by
restoring the stale stamp on `curriculum/units/index.html` (it names the file and
the exact replacement) and reverting.

**Browser verification, before and after,** on `/curriculum/units/` in Chromium,
reading the hub's own `window.NTHubUnits` after render:

- rows offered a bonus activity — before 174, after 195
- …of those, linking to a different lesson — before **147**, after **0**
- rows offered printables — before 174, after 192
- …of those, serving a different lesson's files — before **147**, after **0**
- rows offered no bonus at all — before 78, after 57

The remaining 57 are the 19 lessons (× 3 rows) whose `config.json` declares no
`practice.optionalActivity` — that is authored content, not a gap, and the gate
holds it against disk rather than against a number.

A note on that probe, since it was wrong once: the first version counted a
`-group1` row linking to its parent lesson as a mismatch and reported 165. Group
rows deliberately inherit the parent's activities — `curriculum-hub-search.js`
resolves `MAP[lessonId] || MAP[baseLessonId]` — so that is correct behaviour.
Corrected, the same pre-fix tree measures 147. 147 is the number in this report.

### 1.4 Second finding — Insight Brief's catch-up routing

`teacher-tools/insight-brief/insight-engine.js` carries `CATCHUP_BANDS`, a
hand-written map of which catch-up stations exist per unit (`1: [3, 7]` and so
on). It is used by `catchupPath()` to build the "send this student to a catch-up
station" link. The bands are on the OLD unit numbering, and 36 catch-up stations
exist on disk against the 20 the table declares.

Replaying the engine's own `catchupPath()` over all 84 lessons, with `_redirects`
applied:

- 69 lessons land on a catch-up station in their own unit
- **12 land in a different unit** — every unit-7 lesson (7-4…7-9) is sent to
  `/lessons/8-7-catchup/`, unit-1 lessons 1-4…1-6 to `/lessons/2-7-catchup/`,
  4-4 and 4-5 to `/lessons/3-8-catchup/`, and 9-4 to `/lessons/7-9-catchup/`
- **3 land nowhere**: lessons 10-4, 10-5 and 10-6 all route to
  `/lessons/10-5-catchup/`, which has no directory, no `_redirects` entry and no
  entry in `functions/_lib/redirect-map.js` — a dead link
- **18 of the 36 built catch-up stations can never be reached** from Insight
  Brief at all

This one is NOT fixed. Choosing which catch-up station covers which lessons is a
pedagogical decision, not a mechanical one. See Decision 2.

**Correction worth recording (R7).** The first pass on this reported that 34 of
84 lessons hit a 404. That was wrong, and it was wrong in the way this rule
exists to prevent: it read the disk and inferred the result. A local static
server does not apply `_redirects`; Cloudflare Pages does, and six of the seven
phantom stations are rescued by a 301. Parsing `_redirects` and re-resolving
gives 12 cross-unit and 3 dead, not 34 dead. Hand-checked 8 of the 8 station
paths involved against disk, `_redirects`, `data/routes.json` and
`functions/_lib/redirect-map.js`: 8/8 correct.

I could not confirm this against production — `https://eduwonderlab.com` was
unreachable from this session (curl exit 56 on every attempt), so every claim
about the live site tonight is from source and from a local browser, never from
the live origin.

### 1.5 Third finding — the projects catalogue is legacy-keyed too, and needs a human

`LESSON_PROJECTS` (also inline in `assets/curriculum-hub-search.js`, 34 keys)
links to games under `/math/unit-N/...` rather than `/lessons/<id>/`, so the
key-agreement invariant cannot see it. Its entry text can. Comparing each
entry's own text against lesson titles:

- 16 of 34 keys share more significant words with the title the key USED to name
  before the renumber than with the title it names today
- 1 matches the current lesson
- 17 are undecidable from text alone (generic game names like "Kitchen Chef Game")

Examples, all read off the file:

- key `1-1` → "Lesson 1-1: Prime Factorization Game". Lesson 1-1 today is *Math
  is Mine*; before the renumber it was *Prime Factorization*.
- key `9-3` → "Lesson 9-3: Compare and Order Integers Game". Lesson 9-3 today is
  *Write Equations to Represent Relationships Between Two Variables*.
- key `10-1` → "Lesson 10-1: Volume of Rectangular Prisms Game". Lesson 10-1
  today is *Math is Everywhere*.

The labels are internally self-consistent — they name the same number as the key
— so a teacher sees a plausible label attached to the wrong lesson's
mathematics. This is not mechanically fixable: re-keying requires deciding which
current lesson each game belongs to, and that is a content call. See Decision 1.

### 1.6 Catalogues checked and found sound

Recorded so they are not re-audited:

- **Arcade** (`curriculum/arcade/`, `math/games/index.html`): two hand-written
  lists of the same 12 game folders, and both are complete against
  `math/games/` in both directions. No gap.
- **Resource Finder**: derived — reads `/data/asset-concept-map.json`. Not a
  private catalogue.
- **Living Curriculum Map** (`curriculum/map/`): derived — reads the generated
  `/data/curriculum-nervous-system.json`. Not a private catalogue.
- **Study Pack**: single-sourced from `shared/study-pack/` and copied into both
  deploy roots by `tools/sync-study-pack.mjs` during `npm run build`. All three
  copies are byte-identical today.
- **Pacing Planner** (`curriculum/planning/`): derived — reads
  `/data/curriculum-launch-manifest.json` and `/data/pacing-baseline-2026-27.json`,
  and is already held by `validate:planning` and `validate:pacing-unit-order`.
- **Both project index mirrors** and the portfolio: already held against disk in
  both directions by `validate:hub`, added in `c1883486`.
- **`LESSON_FAMILY_HOMEWORK`**: correctly keyed — all 84 keys equal the lesson
  they link to, matching all 84 lessons with a `homework.html`. It is now under
  the new gate so it stays that way.
- **`teacher-tools/post-forms/`**: its catalogue is `forms-index.json`, 64
  entries on the OLD numbering, pointing at real external Google Forms. Not
  fixed and not gated — see Decision 3.


---

## BLOCK 2 · Progress event keys

Audit only. Nothing here had exactly one unambiguous canonical form, so nothing
was changed. Every finding is written as a decision below.

### 2.1 There is not one on-device signal — there are five stores

The Close the Loop card on `/curriculum/` says, in its own copy, "Reads the same
on-device learning signal that powers Insight Brief." That sentence is not true
of the code. The stores, with who writes and who reads each:

**Store A — `nt-signal:v1`** (`assets/nt-signal.js`, `window.NTSignal`)
- written by: `engine/core/lesson-renderer.js` (miss path + warm-up reteach),
  `engine/core/grade-emit.js` (the correct-answer path), the small-group studio
  (`engine/core/small-group-renderer.js`, under the BASE lesson id),
  `math/games/practice-arcade/`, `math/review-arcade/`
- read by: `/curriculum/my-progress/`, Close the Loop
  (`assets/curriculum-hub-pacing.js`, via `weakStandards`), the hub resume strip,
  both arcades (`topMisconceptions`, `suggestTier`), `engine/core/retrieval.js`
  (`dueStandards`)

**Store B — `nt_results_v1`** (`assets/nt-activity-kit.js`, `assets/nt-page-enhance.js`)
- written by: standalone graded activities — WebQuests, HyperDocs, Architect
  activities and anything else mounting the activity kit
- read by: `/math/my-progress/`, `assets/brain/brain.js`
- schema: `{schema, studentAlias, section, activityId, activityTitle, standard,
  scorePercent, skills, completedAt, deviceOnly}`

**Store C — `choiceboard-u1` … `choiceboard-u10`** (10 choice-board pages)
- written by: `math/choice-boards/unit-N/index.html`, cell-indexed array
- read by: `/math/my-progress/` only

**Store D — `neft-class-brain-v1`** (`curriculum/class-brain/`)
- self-contained; no other file writes or reads it

**Store E — `nt-project-complete:v1`** (`shared/projects/projects-complete.js`)
- read by exactly one surface, `math/projects/portfolio/index.html`

**Server — D1** via `/api/progress/*`
- this is what **Insight Brief** actually reads (`/api/progress/insight`, plus
  digest / mastery-rollup / struggles / grades). It touches no on-device store at
  all.

So Close the Loop and Insight Brief do not read the same signal: one is
`localStorage`, one is D1. Insight Brief shows the class; Close the Loop shows
this one device. A teacher reading the hub copy would reasonably expect the
Close the Loop panel to reflect what Insight Brief just told them, and it does
not.

### 2.2 Two student-facing "My Progress" pages on disjoint stores — PROVEN

`/curriculum/index.html` links both, from four places, with nothing to say they
differ: "📈 Open My Progress" → `/math/my-progress/` (line 2991), and "See my
skills →" → `/curriculum/my-progress/` (lines 582, 3686).

Seeded one browser profile with work in all three device stores, using each
store's real schema, then opened both pages in Chromium:

- `/curriculum/my-progress/` showed the NTSignal skills (`6.AT.2`, `6.NOS.1`)
  and showed **nothing** from `nt_results_v1` or the choice boards
- `/math/my-progress/` showed the `nt_results_v1` activity and the choice-board
  bingo and showed **nothing** that exists only in NTSignal (`6.NOS.1` is
  absent)

`/math/my-progress/` tells the student it holds "Everything you've completed on
this device". It does not hold their lesson or arcade work. A student who spent
the week in lessons and opens the page the hub calls "Open My Progress" is told,
in effect, that they did nothing.

**Hand-check (R3), and a correction.** The first run of this probe reported that
`/math/my-progress/` showed neither store. That was my seed, not the page: I
wrote `{id, title, score, total}` where the activity kit writes
`{activityId, activityTitle, scorePercent, completedAt}`, and I wrote the choice
board as a list of names where the page writes a cell-indexed array. Re-seeded
from the real writers in `assets/nt-activity-kit.js:241` and
`math/choice-boards/unit-1/index.html:71`, the page renders both correctly. The
disjointness above is what survives that correction, and it rests on two facts
that cannot be confused: `6.NOS.1` exists only in Store A and appears only on the
curriculum page; "Seeded Activity One" exists only in Store B and appears only on
the math page.

### 2.3 An internal sentinel is shown to students as a skill — PROVEN

`engine/core/lesson-renderer.js:3225` records the warm-up reteach attempt as

    standard: config.standard || "WARMUP_RETEACH"

`WARMUP_RETEACH` is not a standard code. `nt-signal.js` documents the field as
"only standard codes (e.g. `6.NOS.A.1`)", and every consumer treats the value as
one. `/curriculum/my-progress/` renders `registry[d.standard]?.shortLabel ||
d.standard`, so with no registry entry it prints the raw string. Seeded and
confirmed in Chromium: the page shows `WARMUP_RETEACH` to the student as one of
their skills. Close the Loop would likewise rank it as a weakest standard and
then report "No lesson tagged — open Resource Finder".

It also consumes one of the 64 slots in a bounded store, evicting a real
standard.

### 2.4 The review arcade contributes no standard evidence, and erases the resume point

`math/review-arcade/index.html:1906` records:

    { standard: "", correct: !!correct, misconceptionTag: q.topic, lesson: "unit-" + unit }

Two consequences, both from reading `nt-signal.js`'s own handling:

- `standard: ""` fails `cleanKey`, so **no standard is recorded at all**. Every
  question a student answers in the review arcade is invisible to
  `/curriculum/my-progress/`, to Close the Loop and to spaced review. Only the
  misconception tag survives.
- `lesson: "unit-3"` overwrites `store.lastLesson`. The hub's resume strip
  guards with `/^\d{1,2}-\d{1,2}$/` (`curriculum/index.html:1831`), so it does
  not produce a broken link — it produces **no link**: "Pick up where you left
  off" silently disappears, and the student's real last lesson is gone.

`misconceptionTag: q.topic` is also a different vocabulary from the tag slugs the
lessons emit, so review-arcade tags and lesson tags pile into one bounded map of
32 without being the same kind of thing.

### 2.5 What is emitted but read by nobody

- **project completions** (`nt-project-complete:v1`): 27 completable projects,
  and finishing one reaches only the portfolio page. No progress consumer —
  not My Progress on either path, not Class Brain, not Close the Loop, not
  Insight Brief — knows a student finished a project.
- **`nt-journey-last`**, written by both `lesson-renderer.js` and
  `small-group-renderer.js`, is read by nothing in the repo.
- **Class Brain's `neft-class-brain-v1`** is written and read only by its own
  page, so nothing else can see what it holds and it cannot see anything else.

### 2.6 What was checked and is sound

- **Standard-code format across the NTSignal seam.** This was the most likely
  silent-failure mode: Close the Loop uppercases the recorded standard and looks
  it up in `data/asset-concept-map.json`'s `byStandard`, and lesson configs are
  keyed by the 2025 MCCRS codes. All 37 distinct standards used by the 84 lesson
  configs are present in that map — 0 misses, 84 of 84 lessons covered. Close
  the Loop resolves real lesson signals correctly.
- The small-group studio records under the BASE lesson id
  (`small-group-renderer.js:1338`), so a group variant's evidence lands on the
  parent lesson rather than fragmenting it.


---

## BLOCK 3 · EN/ES parity

Audit only. Nothing translated, nothing changed — translation is content.

### 3.1 Method, and what the numbers mean

Two different bilingual conventions exist in this codebase, and they have to be
measured separately:

- **lessons** use a `<field>` / `<field>Es` pair inside `config.json`, rendered
  by `engine/core/i18n.js` as a stacked `.i18n-en` / `.i18n-es` block
- **project pages** use sibling `.en-text` / `.es-text` ELEMENTS in the HTML —
  a parallel system that shares no code with the engine's

For lessons, every config on disk was walked and each translatable English
string paired with its `Es` sibling. The fields were then split into two
populations, because they mean different things:

- fields that carry an `Es` sibling SOMEWHERE in the fleet have a translation
  convention, and a missing one is a per-lesson gap;
- fields that carry one in NO lesson are surfaces the bilingual layer has never
  covered at all.

That split matters: without it the audit reported ~5,000 phantom "gaps" in
fields that were never bilingual by design.

### 3.2 Classification

288 lesson configs audited (84 whole-group, 168 small-group, 36 catch-up).
**Every single one is PARTIAL.** None is fully bilingual; none is English only.

43,751 translatable string slots in fields that have an `Es` convention;
29,683 of them carry Spanish (68%).

### 3.3 Surfaces the bilingual layer has never covered

These field names carry `Es` in **no lesson anywhere**, so the surface is
English-only by construction, not by omission:

- 2,106 `cloze` — every vocabulary cloze sentence
- 1,092 `question` — Turn-and-Talk / discussion questions
- 514 `caption`
- 317 `example` — vocabulary examples
- 288 `contentObjective` (one per lesson, all 288)
- 288 `languageObjective` (one per lesson, all 288) — the language objective
  itself is English only
- 288 `heading`
- 110 `answer`
- 10 `objective`

The language objective being English-only is the one I would look at first: it
is the sentence that tells a multilingual learner what language work the lesson
expects of them.

### 3.4 Untranslated slots by surface, across all 288 lessons

- 3,699 other prose
- 2,460 vocabulary
- 2,315 feedback & explanations
- 2,076 headings & labels
- 1,056 practice prompts
- 1,039 hints
- 548 worked example (Learn It)
- 384 exit ticket
- 261 launch / warm-up
- 227 discussion prompts
- 3 interactive tool labels

Hints and feedback are the two that matter most for the students this is for: a
student who is doing the problem in Spanish and then misses it gets the
explanation of why in English.

### 3.5 By unit — the clustering is unmistakable

Whole-group lessons only, so variants do not triple-count:

- unit 1: 6 lessons, 495 of 529 slots untranslated (94%)
- unit 2: 12 lessons, 693 of 1,650 (42%)
- unit 3: 10 lessons, 631 of 1,442 (44%)
- unit 4: 5 lessons, 419 of 605 (69%)
- unit 5: 10 lessons, 550 of 1,482 (37%)
- unit 6: 15 lessons, 774 of 1,768 (44%)
- unit 7: 9 lessons, 565 of 1,213 (47%)
- unit 8: 7 lessons, 385 of 925 (42%)
- unit 9: 4 lessons, 403 of 425 (95%)
- unit 10: 6 lessons, 539 of 570 (95%)

Units 1, 9 and 10 sit at ~95% untranslated while the rest cluster at 37–47%.
Unit 4 (69%) is the middle case. Units 1 and 10 are the "Math is…" identity
lessons that open and close the year — the two moments a newly-arrived student is
most likely to be in the room and least likely to have any English footing.

Worst individual lessons: 2-5 (134 of 153), 6-7 (116 of 134), 4-5 (115 of 132),
9-1 (115 of 120), 4-1 (111 of 133), 3-6 (106 of 126).

### 3.6 Project pages — 26 of 27 are fully paired, 1 has no Spanish at all

27 student-facing project pages (answer keys excluded). **3,995 `.en-text`
elements, 3,995 with a Spanish sibling — 100% pairing on 26 of them.**

The exception is **`math/unit-10/projects/world-architect/`**: 133 KB, zero
`.es-text`, zero `.i18n-es`, zero `lang="es"`, and zero Spanish words by an
accent/keyword scan. It is the only English-only student-facing project page in
the repo — and it is one of the three projects made reachable from the gallery
only last commit (`c1883486`), so students can now find it.

### 3.7 Functional paths — what I can and cannot stand behind

**Chrome strings are complete.** All 143 fixed UI strings in
`engine/core/i18n.js` (`STRINGS` 129, `PHASE_NAMES` 8, `BADGE_NAMES` 6) have a
non-empty `es`. There is no empty-Spanish-button failure mode there.

**The engine's content fallback is correct.** `stackContentHtml` returns the
English alone when the Spanish is blank or identical, rather than emitting an
empty `.i18n-es`, so a missing translation degrades to English rather than to a
blank line. That is the right behaviour and it is deliberate — the reasoning is
written into the function's own comment.

**Answer checking is not at risk from a label mismatch.** Both language lanes
are placed in the DOM and CSS chooses between them; grading compares against the
config value, not against rendered text. The article-bug shape — a label
mismatch destroying a completion — does not reproduce on this path.

**Observed in a browser, built lesson at `?lang=es`** (`<html lang="es">`
confirmed stamped): of 9 visible controls on the lesson shell, 7 carry no
`.i18n-es` lane — including **"💾 Save / Resume"** and **"🧰 Tools"**. Those two
are the controls a student uses most. I did **not** trace each label back to its
source, so some may be bilingual by a mechanism this probe cannot see; treat
this as a lead to check, not a settled count.

**A detector I am NOT reporting a number from.** I also counted "interactive
controls with no Spanish" on project pages. Hand-checking 4 flagged pages found
at least 3 false positives: `math/unit-7/projects/version-a` renders the Spanish
as a SEPARATE button ("Use Example Coordinates" and "Usar Coordenadas de
Ejemplo" are two elements), and `math/unit-9/projects/version-b` has "Siguiente
paso" and "Atrás" on the page with the English swapped in by script. The
sibling-element assumption does not hold for controls, so no control-level count
from that pass is in this report. The `.en-text`/`.es-text` pairing figure in 3.6
does not depend on it.


---

## BLOCK 4 · Readability baseline

Audit only. Nothing rewritten — simplifying a sentence is a content decision.

### 4.1 The measure, and why

**Flesch–Kincaid Grade Level**, `0.39·(words/sentence) + 11.8·(syllables/word) − 15.59`.

Chosen because it reports in grade levels, which is the unit the decision is
actually made in ("is this above grade 6?"). Its weakness is real: FK is
syllable-driven, and math prose is full of numerals, symbols and long domain
terms that raise the score without making the sentence harder for a student who
has been taught the term. So the text is prepared first:

1. markup, LaTeX fragments and math symbols stripped
2. numerals deleted — a number contributes nothing to how hard a sentence is to
   read, so it belongs in neither the numerator nor the denominator
3. **every term in that lesson's own vocabulary word bank removed**, with its
   plural, because that vocabulary is the point of the lesson; counting
   "denominator" against a lesson penalises it for teaching the word it exists to
   teach
4. a surface is scored only with ≥ 40 words and ≥ 3 sentences

Scope: all 84 whole-group lesson configs, five student-facing prose surfaces
each (worked example / practice prompts / hints / explanations / explore /
connect). 376 scored samples.

### 4.2 The distribution

- mean FK **4.18**
- p10 2.3 · p25 3.2 · **median 4.0** · p75 4.9 · p90 6.3 · max 11.5 · min 0.1

By band:

- below 4.0 — 184 samples (49%)
- 4–6 — 147 (39%)
- 6–8 — 33 (9%)
- 8–10 — 9 (2%)
- 10–12 — 3 (1%)

By surface (mean FK, n):

- explanations 5.21 (n=84)
- connect 4.05 (n=80)
- practice prompts 3.95 (n=84)
- explore 3.93 (n=44)
- hints 3.65 (n=84)

Above thresholds:

- above FK 6 — 45 of 376 samples (12%), across 34 lessons
- above FK 8 — 12 of 376 (3%), across 11 lessons, all `explanations` or `connect`
- above FK 10 — 3 of 376 (1%), all `connect`

### 4.3 Hand-check of the extremes (R3)

**10 highest — 10 of 10 are genuine.** Every one has both a high
syllables-per-word (1.35–1.69 against a corpus mean near 1.25) and long
sentences (12–23 words). The text really is denser:

- 1-6 connect, FK 11.5 — "Propose a class agreement for working ___, and another
  for working alone, based on showing ___ for classmates."
- 9-2 connect, FK 11.4 — "___ is the independent variable, while ___ is the
  dependent variable."
- 10-6 connect, FK 10.1 — "Describe how your math story has ___ this year, ask a
  ___ about their story, and then ___ the two to see how they are alike and
  different."
- then 2-1 explanations (9.5), 10-4 connect (9.4), 9-3 connect (9.3), 1-2
  connect (8.9), 1-4 connect (8.8), 1-1 connect (8.8), 3-7 explanations (8.5)

Seven of the ten are `connect` — the "put it in words" surface. Some density
there is the point of that surface; the three above FK 10 are still worth a
read.

**10 lowest — only 2 of 10 are genuine.** Eight are fill-in-the-blank frames or
coordinate lists where blanks and equations, not words, make up most of the
surface: "The chest's SA is ___ ft² because SA = 2(___×___) + 2(___×___) +
2(___×___) = ___ + ___ + ___ = ___" (5-7, FK 1.1) is not simple prose, it is not
prose. The two that are genuine are `8-2 explore` (FK 0.7) and `4-3 hints`
(FK 1.4) — short, plain, and appropriately so.

**Conclusion from the hand-check: the top of this distribution can be acted on;
the bottom cannot.** Any target should be a ceiling, never a floor, because a
floor would be measuring blanks.

### 4.4 Two detector bugs found and fixed before these numbers were produced

Both were caught by hand-checking the extremes, and both would have produced a
confidently wrong baseline:

1. **Numerals were replaced with the token `num`**, which the word regex then
   counted as a word. Lesson 6-2's explanations scored **FK 21.4** on "891
   words in 15 sentences" — almost all of those words were stripped numerals.
   Fixed by deleting numerals instead of tokenising them.
2. **The numeral regex swallowed sentence-final periods.** `/\d[\d.,:\/]*/`
   consumed the full stop of every sentence ending in a number, so "so it is
   n + 7." ran into the next explanation. Lesson 6-5's explanations came out as
   "sentences" of 85 words and scored FK 13.7; the source sentences are ordinary
   length. Fixed so a period is consumed only when a digit follows it.

Before those fixes the corpus mean was 5.27 with a max of 21.4. After: mean
4.18, max 11.5. **Only the second set of numbers is in this report.**

### 4.5 Recommended target, with reasoning

**Ceiling of FK 6.0 for student-facing prose, measured with the lesson's own word
bank excluded; anything above FK 8 reviewed by hand.**

Reasoning:

- The corpus already sits at median 4.0 and 88% of samples are at or below 6.0,
  so this is a ratchet on a healthy body of writing, not a rewrite programme. It
  makes 45 samples across 34 lessons the work, and 12 samples across 11 lessons
  the urgent part.
- 6.0 is the grade being taught. Above it, the sentence is harder than the
  mathematics, which inverts what the lesson is for — and this class has many
  multilingual learners, for whom an English sentence above grade level is a
  second barrier in front of a first one.
- It must be a **ceiling, not a band**. A floor would push writers to add
  syllables, and the hand-check shows the low tail is measurement artefact, not
  writing.
- Vocabulary exclusion has to stay part of the definition. Without it the target
  would penalise exactly the lessons doing the most vocabulary teaching.
- I would NOT gate this in CI. FK is a rough instrument on math prose even after
  the two fixes above, and a build that fails on a sentence a teacher wrote
  deliberately trains people to work around the gate. A report, re-run when
  lesson prose changes, with 34 named lessons to look at, is the useful form.


---

## BLOCK 5 · Misconception taxonomy

Inventory and proposal. **Nothing implemented** — the code list is yours to
approve.

### 5.1 There are five vocabularies, and they share almost nothing

**1. The canonical taxonomy — `engine/core/misconceptions.js`, 37 codes.**
kebab-case. Five fields each: `label`, `labelEs`, `watchFor` (teacher-facing next
move), `student`, `studentEs`. This is the one with a real design behind it: it
never guesses from the wrong answer alone, it predicts what each named
misconception would produce and reports only when exactly one prediction
matches. Two generated artefacts publish it: `data/misconception-labels.json`
(labels + `watchFor`) and `data/misconception-taxonomy.json` (adds `student`).

**2. Lesson `config.json` `misconceptionTags` — 2,303 tag instances across 272
configs, 37 distinct tags.** Not the same 37.

**3. The Thinking Trails Evidence Layer — `shared/evidence/misconception-tags.json`,
22 ids.** snake_case. Different field names: `category`, `studentFriendlyName`,
`teacherDescription`. Its own note says "Keep tag ids stable; they are stored in
saved sessions and CSV exports."

**4. The 2D games — `assets/games2d-data.js`, 45 codes across 25 game blocks.**
kebab-case, third naming scheme, fields `tag` / `trigger` / `feedback`.

**5. Class Boss (`BOSS_TAGS`, 37) and Teach the Machine (`personas.js`, 37)** —
these two are keyed to the canonical taxonomy and are **complete, 37 of 37**, in
both directions. Only their header comments are stale: both still say "19
misconception tags in data/misconception-labels.json", which is what that file
held when they were written.

**Overlap between vocabularies 1, 3 and 4: essentially zero.** Not one id is
shared between the canonical taxonomy and the evidence layer, or between the
canonical taxonomy and the games. Normalising case and separators finds exactly
one shared id in the whole set — `one_side_only` (evidence) and `one-side-only`
(games), which the canonical taxonomy does not have at all.

**Union: 104 distinct ids across the four coded vocabularies, plus 3 strays in
lesson configs — 107 names for a body of student thinking that a teacher would
describe with far fewer.**

### 5.2 403 authored misconception tags are silently discarded — VERIFIED BY EXECUTION

Three tags appear in lesson configs and in no taxonomy:

- **`place-value` — 363 uses.** The single most-used misconception tag in the
  entire curriculum. The canonical taxonomy has `decimal-place-value`.
- **`sign-error` — 36 uses.** The taxonomy has `sign-dropped`.
- **`fraction_digits_as_percent` — 4 uses.** snake_case, in a kebab-case field.

I did not infer the consequence — I ran the shipped module against these ids:

    place-value                    recorded: NO   label: ""   student: ""
    sign-error                     recorded: NO   label: ""   student: ""
    fraction_digits_as_percent     recorded: NO   label: ""   student: ""
    decimal-place-value            recorded: YES  label: "Right digits, wrong magnitude"

`recordMisconception` returns `null` and stores nothing for an unknown id;
`misconceptionLabel` and `studentExplanation` return empty strings; and
`topMisconceptions` filters unknown ids out even if one is forced into the
store. So at all 403 of those authoring sites — **17.5% of every misconception
tag in the curriculum** — a teacher deliberately named the error a student made,
and the product throws it away: no diagnosis chip, no student sentence, no count
in the facilitation console, nothing in the teacher's top-misconceptions list.

Three canonical codes point the other way and are never used by any lesson:
`fraction-added-denominators`, `fraction-straight-across-division`,
`exponent-as-multiplication`.

### 5.3 Duplicates expressed differently across surfaces

Same idea, different name, no code path connecting them. These are candidates,
not verdicts — the pairing is a reading judgement:

- adding instead of scaling a ratio — canonical `ratio-scaled-additively`,
  evidence `additive_reasoning`, games `added-instead-of-scaled` (**three names**)
- area vs perimeter — canonical `measure-area-perimeter-swap`, evidence
  `area_perimeter_confusion`
- volume vs surface area — canonical `geom-surface-area-as-volume`, evidence
  `volume_surface_area_confusion`
- wrong inverse operation — canonical `equation-not-inverse-operation`, evidence
  `inverse_operation_confusion`
- unit rate set up wrong — canonical `rate-not-per-one`, evidence
  `unit_rate_setup_error`
- sign slip — canonical `sign-dropped`, evidence `operation_sign_error`, lesson
  configs `sign-error`
- order of operations — canonical `order-of-operations-left-to-right`, games
  `order-of-operations` and `added-before-multiplying`
- reversed division — canonical `op-reversed-division`, games `divided-backward`
- place value — canonical `decimal-place-value`, lesson configs `place-value`
- changed only one side of an equation — evidence `one_side_only`, games
  `one-side-only`, **no canonical code at all**

**No true conflicts were found** — no id means two different things in two
places. The problem is fragmentation, not collision. That is the better problem
to have: a merge can be mechanical once the names are decided.

**Two things in the evidence layer are not misconceptions and should not be
merged into a misconception taxonomy**: `explanation_too_short`,
`no_math_vocabulary`, `answer_without_reasoning`, `copied_formula_without_context`
describe the quality of a written explanation, not a mathematical error. They
belong in a separate discourse/writing vocabulary.

### 5.4 What the canonical taxonomy is missing structurally

- **No standard is attached to any of the 37 codes.** Every consumer that wants
  to route from a misconception to a lesson has to guess. This is the single
  biggest gap for a canonical version.
- **`watchFor` has no Spanish.** `label`/`labelEs` and `student`/`studentEs` are
  both paired; the teacher's next-move sentence is English only.
- The evidence layer carries a `category` (Statistics / Equations / Ratios /
  Geometry / Explanation); the canonical taxonomy has no grouping field, though
  its id prefixes (`op-`, `stat-`, `geom-`, `fraction-`, `ratio-`, `percent-`,
  `inequality-`, `equation-`, `algebra-`, `measure-`, `coord-`, `decimal-`,
  `sign-`, `order-`, `exponent-`, `rate-`) already encode one informally.

### 5.5 PROPOSED canonical taxonomy — for approval, not implementation

**Shape.** One file, `data/misconception-taxonomy.source.json`, hand-authored,
with the generated artefacts continuing to be derived from it. One entry per
code:

    id             stable kebab-case, prefix = domain, never renamed once shipped
    domain         one of: number, fraction, decimal, ratio, percent, expression,
                   equation, inequality, statistics, geometry, coordinate
    label          teacher-facing short name, EN
    labelEs        the same, ES
    watchFor       teacher's next move, imperative, EN
    watchForEs     the same, ES                                        (NEW)
    student        what the learner reads instead of "Not quite", EN
    studentEs      the same, ES
    standards      array of MCCRS codes this error attaches to          (NEW)
    aliases        every historical id that maps here                   (NEW)
    kind           "misconception" | "discourse"                        (NEW)

`aliases` is what makes the migration safe: it lets every existing id keep
resolving while the authored sites are converted, and it is the field that turns
"we renamed a tag" from a data-loss event into a lookup.

**Starting code list: the existing 37, plus the additions the audit found.** I am
not proposing new codes without your sign-off, but the audit says at minimum
these need a home: changed-only-one-side (evidence + games, no canonical code),
gcf-lcm-swap (games), slant-as-height (games), median-not-ordered and the three
other median/mode codes (evidence, finer-grained than canonical
`stat-mean-vs-median`), range-adds-instead-of-subtracts (evidence). Plus the
four discourse codes as `kind: "discourse"`.

**Alias table to seed:** `place-value` → `decimal-place-value` (or a new broader
code — **this is a real decision, see Decision 5**); `sign-error` →
`sign-dropped`; `fraction_digits_as_percent` → `percent-scale-off-by-100`;
plus the ten duplicate pairs in 5.3.

### 5.6 Migration cost and risk, per surface

- **Lesson configs — 2,303 tag instances across 272 files.** Mechanical once the
  alias table exists: a scripted rewrite plus the existing generator-safety
  write-set guard. Risk LOW. Cost: hours, not days. The 403 stray instances are
  the only ones that change meaning, and each of those is currently worth
  nothing, so the change can only improve them.
- **`engine/core/misconceptions.js` — 37 entries.** Adding `standards`,
  `watchForEs`, `aliases`, `kind`, `domain` is additive; no consumer breaks.
  Risk LOW. The `watchForEs` strings are translation, which is content, so this
  is your work not mine.
- **Class Boss (37 templates) and Teach the Machine (37 personas).** Both are
  already complete against the canonical 37 and both have validators
  (`validate:class-boss`, `validate:teach-machine`) that will fail loudly on any
  new code with no template or persona. Risk LOW but cost REAL: every code added
  to the taxonomy costs one boss template and one persona, authored. Budget that
  before approving additions.
- **The evidence layer — 22 ids.** Highest risk on the list, and the reason is
  in its own header: the ids "are stored in saved sessions and CSV exports". A
  rename silently orphans work students already saved and reports teachers
  already filed. Migrate by adding `aliases` and a read-time resolver, never by
  rewriting the ids. Risk MEDIUM.
- **The 2D games — 45 codes across 25 blocks.** Codes drive `trigger`/`feedback`
  prose that is game-specific and often finer-grained than the taxonomy
  ("overhang", "gap-open-early"). Not all 45 should merge. Risk MEDIUM, and it
  is a content review, not a rename.
- **Generated artefacts and their gates** — `generate-misconception-labels.mjs`,
  `generate-evidence-group-data.mjs`, `generate-plan-vocab.mjs`,
  `misconception-labels.test.mjs`, `validate-nervous-system`, plus the heatmap
  and participation views that fetch the labels file. All derive from the source,
  so they follow for free. Risk LOW.
- **D1 telemetry already in the table.** `NTtelemetry.track("misconception", …)`
  has been writing raw tag strings, including the 403 strays. Historical rows
  carry old ids forever. The alias table has to be applied at READ time in the
  heatmap and Insight Brief, not by rewriting history. Risk MEDIUM — this is the
  part most likely to be forgotten.

**Recommended order:** author the source file with aliases → add the read-time
resolver everywhere ids are displayed → rewrite lesson configs → leave the games
and the evidence layer alone until the first four are settled.


---

## BLOCK 6 · Small-group derivation

Measurement only. No migration begun.

### 6.1 The load-bearing number cannot be answered from history in this clone

The question was: how many parent-lesson changes over the last N commits did NOT
propagate to their group pathways. **This clone has 55 commits, and only TWO of
them touch any `lessons/*/config.json` — one of which is a bulk import that
touches everything.** Every one of the 84 parent-change events in that history
changed its variants in the same commit, which is an artefact of the import, not
evidence of healthy propagation.

So the history answer is: **not measurable here**, and I am not going to dress up
a number from two commits as a trend. What follows measures the same thing from
the CONTENT, which does not depend on history depth.

### 6.2 Drift measured against the parent, on disk today

168 parent→variant pairs (84 lessons × group1 + group2). Catch-up stations are
**excluded**: each one covers a BAND of lessons, so `2-5-catchup` is not a
variant of `2-5` and diffing them measures nothing. The first run included them
and every "drift" example it printed was a catch-up compared against an
unrelated lesson.

Of 373 field paths present in most parents:

- **123 are identical in every single pair** — inherited cleanly
- **24 are transformed in most or all pairs** — the declared transform:
  `lessonId`, `title`, `contentObjective`, `languageObjective`, `timeEstimate`,
  `launch.narrative`, `launch.conceptIntro.heading` / `.intro`,
  `reflect.exitTicket.stem`, the whole `practice.onLevel` hint and explanation
  set, and the `practice.extending` length — all 168/168
- **194 are dropped by the variant in most pairs** — phase subsets and chunking
- **15 are identical in >90% of pairs and differ in a handful** — the only place
  drift could be hiding

### 6.3 Hand-check of the drift candidates (R3) — the alarming one is benign

The candidate that would matter most is an item whose `correctIndex` differs
from its parent's. There are **24** such items. If the stem and choices were the
same, the variant would be marking a different option correct — a defect that
directly harms a student.

**All 24 have a different stem AND different choices.** They are genuinely
different items, which is what the generator is supposed to produce. **0
dangerous cases.** Reporting "24 items where the variant disagrees with the
parent about the right answer" would have been true and completely misleading.

### 6.4 What real drift there is: 4 pairs, and a renumber fingerprint

**Un-propagated parent changes, measured from content: 4 of 168 pairs**, in two
lesson families. `6-13-group1`, `6-13-group2`, `6-7-group1` and `6-7-group2`
carry warm-up question ids (`warmup-1-1-*`, `warmup-1-2-*`) that their parents no
longer have (`warmup-6-13-*`, `warmup-6-7-*`). The parents were regenerated after
the 2026-08-10 renumber; those four variants were not.

More broadly, **491 warm-up question ids across the fleet name a lesson other
than the file they live in** — lesson 2-10's warm-up questions are still
`warmup-8-4-*` — and **78 warm-up ids are shared by more than one lesson family**
(`warmup-1-1-1` appears in lessons 1-1, 6-12 and 6-13).

**These are cosmetic, and I checked rather than assumed.** Saved warm-up answers
are keyed by ARRAY INDEX inside a per-lesson response record
(`savedAnswers[qIdx]`, `state.saveResponse(0, "warmup_answers", …)`), and I found
no consumer of `q.id` in the renderer. So the collisions cannot cross-contaminate
a student's saved work. They are a fingerprint of the renumber, and they are the
clearest available signal of which files have been regenerated since.

### 6.5 Verdict: hand-authored copies or generated?

**Generated, and mostly faithfully.** 123 field paths inherit byte-identically
across all 168 pairs, and the 24 transformed paths are transformed in 168/168 —
that regularity is not what hand-authored copies look like. The drift that
exists is 4 pairs deep, not fleet-wide.

But the model is *generate-and-commit*, not *derive-at-read-time*, and this repo
already documents what that costs: `validate:generator-safety` exists because a
full generator run used to erase the Spanish overlay and the authored
`interactiveVisual` choice out of the very files it was regenerating, and the
answer at the time was a documented workaround telling humans to remember a
flag. The authored-overlay merge fixed the erasure. It did not remove the need
to re-run the generator for every parent edit, and nothing fails when someone
does not.

### 6.6 Proposed model — parent lesson + declared transform

**Shape.** `lessons/<id>-group1/transform.json` replaces the full config:

    { "parent": "6-13",
      "level": "group1",
      "phases": ["launch", "explore", "practice", "reflect"],
      "overrides": { "contentObjective": "…", "timeEstimate": 25, … },
      "practice": { "onLevel": { "hints": [...], "explanation": [...] } },
      "authored": { … anything a human wrote that the generator does not emit … } }

The variant is then resolved at BUILD time by merging parent + transform, so the
committed `config.json` is still what ships (no runtime cost, no engine change)
but it is a derived artefact that a gate can regenerate and compare.

**Why this shape and not runtime inheritance:** the engine, the SCORM builders,
the print generators and the download manifest all read `lessons/<id>/config.json`
today. Keeping that file as the build output means none of them change.

**Cost estimate.**

- Write the resolver and the transform extractor: the extractor is the real work
  — for each of the 168 variants, split the current config into "equals parent"
  (drop it), "matches the declared transform" (encode it) and "neither" (goes in
  `authored`). The 123/24/194 split above says this is tractable: most paths fall
  cleanly into one bucket. Estimate **2–3 days** including the extractor, the
  resolver, and a gate that regenerates all 168 and fails on any byte difference.
- Migrate the 36 catch-up stations: **do not**, at least not in the same step.
  They are not parent-derived, and forcing them into this model would invent a
  parent relationship that does not exist.
- Ongoing: one gate run per lesson edit instead of a remembered generator
  invocation. That is the whole benefit, and it is the reason to do it.

**Recommendation.** The drift measured is 4 pairs, which is small. On that
evidence alone the migration is not urgent. What makes it worth doing is not
today's drift but the fact that nothing detects tomorrow's: there is no check
anywhere that a variant is still consistent with its parent. A cheaper first
step, if you want most of the benefit for a fraction of the cost, is a
**consistency gate without the migration** — regenerate each variant in memory
and fail on any difference outside the declared transform. That is roughly a day
and it would have caught all four drifted pairs. See Decision 6.


---

# SESSION 2 — 2026-08-18, after the overnight report was accepted

## Phase 1 · Deploy — BLOCKED, not deployed

Production is unreachable from this session. Diagnosed rather than assumed:

- **DNS is healthy.** `eduwonderlab.com` → `104.21.52.55` and
  `2606:4700:3030::6815:3437` (Cloudflare). `www` resolves to the same.
- **Through the agent proxy** (`127.0.0.1:45435`): `CONNECT eduwonderlab.com:443`
  → `HTTP/1.1 403 Forbidden`, curl exit 56. The same 403 comes back for
  `example.com` and `cloudflare.com`, so this is not domain-specific.
- **Bypassing the proxy** (`--noproxy '*'`): raw TCP to port 443 connects, TLS
  completes, and the response is `HTTP/2 403` with header
  `x-deny-reason: host_not_allowed` and body *"Host not in allowlist:
  eduwonderlab.com. Add this host to your network egress settings to allow
  access."*
- **The allowlist is host-specific**: on that same direct path `github.com` and
  `registry.npmjs.org` both return 200.

**Verdict: this session's egress allowlist. The interceptor names itself.** No
packet reached Cloudflare, so this is also NOT evidence that production is
healthy — nothing was learned about the live site in either direction.

The deploy TRIGGER would work (`git ls-remote origin` succeeds, so a push to
`main` would fire the Cloudflare build). The VERIFICATION cannot: `ship.sh`
polls `/access-practice-lab/config.json` on `eduwonderlab.com`, and
`smoke:live --expect <sha>` hits the same host. Deploying now would be deploying
blind, which R4 exists to prevent. Stopped.

Hosts to allowlist: `eduwonderlab.com`, `www.eduwonderlab.com` (the www→apex
canonicalization check), `script.google.com` (one probe in `smoke:live`).

## The pre-deploy gates — why they were red, and whether a healthy one would have caught #191

All three red checks on PR #191 are **pre-existing on `main`** and none is caused
by that branch.

**1. `master-copy-guard`** — greps `curriculum/index.html` for `>Google Slides</a`
and reports "the slides wiring was lost". There are 0 there and **84 in
`curriculum/units/index.html`**, where the per-lesson content moved. It fails on
`origin/main` identically. Its other four assertions (extracted assets loaded, no
Vercel Forms link, `select-control` present, "Teacher Tools" present, ≥3,000
lines) are evaluated against the same wrong file, so the guard currently protects
very little of what it was written to protect.

**2. `smoke`** — `.github/workflows/games-smoke-test.yml:35` pins
`node-version: "20"`, and the lockfile's `undici@8.9.0` declares
`"engines": {"node": ">=22.19.0"}`. `jsdom@30.0.1` requires it, and
`scripts/generate-download-manifest.mjs:32` imports jsdom inside `npm run build`,
which is the Playwright `webServer`. Fails on any commit in this state. One-line
fix: `"20"` → `"22"`.

**3. `Required quality gate` → "Browser journeys"** — 5 of 16 e2e tests fail in
`tests/curriculum-journey.spec.ts`. `enterTeacherMode` asserts
`#hub-mode-toggle` contains `"Teacher Mode"`; the button now reads
`"👩‍🏫 You're in Teacher view — switch to Student"`. That label lives in
`assets/curriculum-enhancements.js`, which PR #191 does not touch (empty diff),
and it is present at `origin/main`'s tip. The label was rewritten and the test
was not updated. The gate's other five steps — Biome, unit and contract tests,
repository validation, Vite build, dependency audit — all PASSED.

### Would a healthy `smoke` have caught the wrong-materials bug?

**No. And this is not speculation — a healthy `smoke` ran while the bug was live
and did not catch it.** The renumber landed 2026-08-10; the `smoke` workflow has
green runs on 2026-08-15 and 2026-08-16, before the lockfile change broke it.
The bug was live through every one of those green runs.

The reason is structural, and the same is true of all three gates:

- **`tests/games-smoke.spec.ts`** iterates a list of **game URLs** — it never
  loads `/curriculum/units/`. Its assertions are: the page loads, no uncaught
  page errors, no broken same-origin assets, no console errors, a `<canvas>`
  rendered. Every one asks *does this page WORK*. The bug produced HTTP 200 on
  every link, zero 404s, zero console errors.
- **`tests/curriculum-journey.spec.ts`** visits `/curriculum/` (not
  `/curriculum/units/`) and asserts on the teacher workflow guide: which view
  opens on a click, focus order, mobile overflow. It never opens a lesson row's
  activity list.
- **`master-copy-guard`** is five presence-and-count greps on one file. Not one
  of them compares a key to the thing it points at.

So the answer to "healthy or blind" is **blind** — all three, by construction.
They test whether pages work, never whether a link points at the right lesson. A
200 was always going to satisfy them.

**What is not blind now:** `validate:lesson-catalogues`, added in `b491192e`,
holds each catalogue key against the lesson its own entries link to. It runs
inside `npm run validate`, which is the "Repository validation" step of this same
pre-deploy gate — and that step **PASSED** on this branch. The check for this
class is live and green; it just needs the branch to land.

## Phase 2 · Insight Brief routing — HELD at your instruction

Not started. Held until #191 is deployed and verified, so a second mapping change
is not stacked behind an unverified first one.

## Phase 3 · Spanish work order — Units 1, 9, 10 (audit only)

Full per-lesson, per-surface inventory: **`reports/es-workorder-units-1-9-10.md`**.

**Totals — 16 lessons, 1,437 strings to write** in fields the schema already
supports:

- unit 1: 6 lessons, 495 strings (34 already have Spanish)
- unit 9: 4 lessons, 403 strings (22 already have Spanish)
- unit 10: 6 lessons, 539 strings (31 already have Spanish)

**Ranked by student impact — functional path first (831 of the 1,437):**

- 360 practice prompts — the stem and choices ARE the graded question
- 242 feedback and explanations — what a student reads after a miss, before the retry
- 199 hints — the documented route forward when stuck
- 30 exit tickets — records completion

**Everything else (606):** 162 explore, 144 vocabulary, 130 launch/warm-up, 99
connect, 55 Learn It worked example, 16 headings and labels.

**Seven fields need a schema change before anything can be stored** — they carry
no `Es` sibling in ANY lesson fleet-wide, so there is nowhere to put a
translation today:

- 80 `cloze` → needs `clozeEs`
- 79 `example` → needs `exampleEs`
- 64 `question` → needs `questionEs` (Turn-and-Talk / discussion)
- 16 `contentObjective` → needs `contentObjectiveEs`
- 16 `languageObjective` → needs `languageObjectiveEs`
- 16 `heading` → needs `headingEs`
- 13 `caption` → needs `captionEs`

**Hand-check (R3).** Sampled 10 flagged slots across all three units — 1-1, 1-2,
1-4, 1-6, 9-1, 9-2, 9-3, 10-1, 10-3, 10-5 — and read the config directly.
**10/10 genuinely have no Spanish** (`stemEs` / `explanationEs` undefined), and
`stem` carries `stemEs` in 441 places fleet-wide, so the schema supports them.
No false positives.

### The one project page with no Spanish, and where it is reachable from

**`math/unit-10/projects/world-architect/`** — 133 KB, zero `.es-text`, zero
`.i18n-es`, zero `lang="es"`, zero accented characters. The other 26
student-facing project pages are 100% paired (3,995 of 3,995 `.en-text`
elements).

It is linked from **four places**, including two students reach directly:

- `math/projects/index.html` — the student projects gallery
- `curriculum/projects/index.html` — the curriculum projects page
- `math/unit-10/projects/index.html` — the unit-10 project set page
- `math/projects/portfolio/index.html` — the portfolio

It was added to the gallery in `c1883486`, the commit immediately before this
work, so it became student-reachable at that point.

### The mechanism, and the cheapest correct way to add translations

**Where translations live.** Lessons use inline `<field>Es` siblings inside
`lessons/<id>/config.json` (`stem`/`stemEs`, `hints`/`hintsEs`, …). Project pages
use a completely different convention — sibling `.en-text` / `.es-text` ELEMENTS
in the HTML, sharing no code with the lesson engine.

**The rendering contract is already correct and safe.**
`engine/core/i18n.js`'s `stackContentHtml` returns the English alone when the
Spanish is blank or identical, rather than emitting an empty `.i18n-es`. So a
missing translation degrades to English, never to a blank line — adding
translations one at a time is safe and never leaves a half-state.

**There IS an extract/apply pipeline, and it does not cover this work.**
`tools/extract-es-gap.mjs` → author into `data/es-translations/*.json` →
`tools/apply-es-translations.mjs` is exactly the right shape: it prints
`{"english": ""}` batches ready to fill, deduplicates strings shared across
variants, and skips anything already translated. But `tools/es-parity-lib.mjs`
scopes it to **small-group and catch-up variants only** (`SMALL_GROUP_RE`) and to
**`practice` tiers only**. Units 1/9/10's 16 lessons are whole-group cores, so
they are outside both the tooling and the gate.

**Cheapest correct route:** extend `es-parity-lib.mjs`'s lesson selector to
include whole-group cores and its field selector beyond `practice`, then use the
existing extract → author → apply loop unchanged. That is a small change to two
selectors in a library that already exists, and it gets you JSON batches to fill
in rather than 1,437 hand edits across 16 config files. It also deduplicates: a
stem shared with that lesson's group1/group2 variants gets translated once.

**Can a gate detect an untranslated string at build time? Yes — the pattern is
already here.** `npm run validate:es-parity` does exactly this for small-group
practice: it fails on a missing `Es`, on a ragged parallel array
(`choicesEs` of a different length pairs a Spanish hint with the wrong English
one), and on a Spanish string byte-identical to its English. Widening its scope
alongside the pipeline would gate whole-group lessons the same way. I would gate
it as a RATCHET — a count that may only shrink — rather than a hard zero, so it
does not block every unrelated push for the length of a 1,437-string translation
effort.


---

# Block 9 — Ratchet gap (Section 2) and font-blocking diagnosis (Section 1)

## Section 2 — the ratchet gap: the premise was wrong, a different one was real

**The authorized change would not have worked, and the gap it described does not
exist.** Both facts were established by running things, not by reading.

### The stamp was already held

`/assets/curriculum-download.js?v=` is held by `validate:downloads`
(`tools/validate-download-manifest.mjs` §9), on both pages, plus the
`curriculum-download.css` stamp that lives *inside the JS module* and that no
HTML-scanning ratchet could ever see. Three mutations, three correct failures,
each naming the exact replacement:

- stamp corrupted in `curriculum/units/index.html` (the `src=` reference) → FAIL
- stamp corrupted in `curriculum/index.html` (the dynamic `import()`) → FAIL
- asset edited, both stamps left alone → FAIL, both pages named

### Adding it to the hub-assets ratchet fails, for a correct reason

Making the one-line edit and running it:

```
   ✗ no <script> tag loading /assets/curriculum-download.js
✗ curriculum hub assets: 1 failure(s)
```

That ratchet requires every `.js` asset to be loaded by a `<script src=… defer>`
tag. The downloader is deliberately NOT loaded that way — `curriculum/index.html`
pulls it with a dynamic `import()` so it costs the hub nothing until a teacher
opens it, which is what keeps that page inside its 60-request budget. The
ratchet is right to fail; the asset does not belong in its list.

### The corrected sweep: 10 content-hash references, not 8, and all 10 are held

My earlier sweep required `(?:src|href)="` before the path, so it could only see
stamps in a tag attribute. Two references are not attributes — the dynamic
`import()` on the hub, and the stylesheet reference inside
`curriculum-download.js`. Corrected count:

```
CONTENT-HASH (8-hex) references: 10
   matching the file:        10
   STALE:                    0
```

Coverage: `curriculum-hub-assets.test.mjs` holds 7 (its 5 named assets, on every
tracked page); `validate:downloads` holds 3 (the module on 2 pages + its CSS).
7 + 3 = 10. **Nothing was uncovered.** The 345/542 date and opaque build tokens
are untouched, as instructed.

### The real gap, proven by isolation test

`validate:downloads` used `.exec()` — first match only — against a **hardcoded
two-page list**. Both shortcuts were blind, and both reported `PASS ✅` where they
should have failed:

- a SECOND, stale `<script src="…?v=deadbeef">` added to
  `curriculum/units/index.html` → **PASS** (`.exec()` reads only the first match)
- a stale reference added to `curriculum/planning/index.html` → **PASS**
  (a third consumer is simply not in the list)

This is the same hole `curriculum-hub-assets.test.mjs` already closed for the hub
assets — its own comment says "adding a third consumer cannot quietly escape the
ratchet the way the second one did." `validate:downloads` still had the pre-fix
shape.

**Fixed** (`4438c342`): pages discovered from tracked HTML, every reference on a
page checked, the two known pages still asserted by name so losing the wiring is
a failure rather than a quietly empty sweep, `dist/` excluded as build output.

Four mutations after the fix:

- second stale ref on a listed page → PASS → **FAIL**, names the page
- stale ref on a third page → PASS → **FAIL**, names the page
- asset edited, stamps stale → **FAIL**, both pages, names the replacement
- wiring removed from a required page → **FAIL**, names the page

`npm test` 213/213. Biome clean. Tree clean after every mutation.

**Judgement call, flagged:** you authorized a one-line edit whose premise turned
out to be false. I did not make it — it fails — and I made the mechanically
equivalent fix to the gate that actually owns the stamp instead. That is a
different file from the one you named. If you would rather I had stopped and
asked, say so and I will revert `4438c342`.

---

## Section 1 — font blocking: diagnosis only, no fix implemented

### 1.1 Scope, from disk

**1,736 tracked source files carry at least one render-blocking third-party
request.** My earlier figure of 290 was not wrong so much as narrow: it measured
`dist/lessons/*/index.html` plus the two hubs — one file per lesson folder, in
the build output only. The source tree carries the same link on every surface of
every lesson.

```
BLOCKING  <link rel="stylesheet" href="https://…">   1240 refs   fonts.googleapis.com
BLOCKING  @import url(https://…)                      761 refs   fonts.googleapis.com
BLOCKING  <script src="https://…"> (no defer/async)    49 refs   cdn.jsdelivr.net 33
                                                                  unpkg.com         9
                                                                  cdnjs.cloudflare  7
DISTINCT FILES with ≥1 blocking third-party request: 1736
```

A first pass at this reported 20 stylesheet links. That detector required
`rel="stylesheet"` to appear *before* `href=`, and this site writes href first
(`<link href="…" rel="stylesheet" />`). Re-parsed order-independently → 1,240.
Ten hits sampled deterministically across the corpus and read by eye: **10/10
genuine** (2 `@import`, 7 `<link>`, 1 blocking CDN `<script>`).

By area: 1,517 files under `lessons/`, 96 under `math/`, 28 under `curriculum/`,
the rest scattered across standalone activities. Within a lesson folder the link
is on `index.html` (289), `worksheet.html` (288), `worksheet-answer-key.html`
(288), and on `vocab/slides/notes/notes-teacher/learn/homework/handout` (84 each).

**Families and weights actually requested** (top 5 URLs, 1,483 of the references):

- Fraunces, variable `opsz 9..144`, weights 400/500/600/700 — 652 refs
- Fraunces 600/700 + Hanken Grotesk 400/500/600/700 — 577 refs
- **Atkinson Hyperlegible 400/700** + Nunito 700/800/900 — 204 refs
- Outfit 400–900 + Hanken Grotesk incl. italics — 170 refs across two URLs

Atkinson Hyperlegible is the Braille Institute's low-vision face. It is on 233
files including both curriculum hubs, the ACCESS practice lab and the AI hub.
That one is not decoration — it is the accessibility choice, and it is the one
currently delivered by a third party.

**There is already a self-hosting precedent in this repo.**
`engine/styles/theme-warm.css` declares four `@font-face` blocks against
`engine/styles/fonts/*.woff2` — Baloo 2, Fredoka, and **Nunito variable
(roman + italic)** — 105,828 bytes total, referenced from `engine/core/app.js`.
The pattern, the directory and one of the five families are already here.

**Existing fallback:** every URL carries `&display=swap`, and the CSS declares
real stacks (`"Nunito", system-ui, sans-serif`, `"Outfit", system-ui, sans-serif`).
So the *font file* never blocks text. What blocks is the **stylesheet request
itself** — a `<link rel="stylesheet">` gates first paint until it resolves or
errors, and `@import` inside a `<style>` block is worse: serial, and inside the
cascade.

### 1.3 The failure mode, measured

Three network conditions on `/curriculum/units/`, served from the built `dist/`.
Only the shape of the failure is simulated; the page is real.

```
condition     first text painted      252 rows at      final state
failfast      128ms                   324ms            252 rows / 40,035 chars
blackhole     none in 330s            not reached      0 rows / 0 chars
```

- **failfast** — the network rejects the connection immediately (a filter that
  sends RST, or a device that is simply offline). Cost: **~0**. 128ms to text.
- **blackhole** — the network silently drops the packets, which is how a good
  many school content filters behave. **The page stays blank.** Not slow: blank.
  No text, no rows.

The blackhole case was re-run with a 330-second budget specifically because the
first run's "never" was **my** 45s cutoff, not the browser's. It is not 45
seconds:

```
/curriculum/units/       STILL BLANK after 330s
/lessons/1-1/            STILL BLANK after 330s
```

**Still blank after 5½ minutes on both the hub and a student lesson page** — no
first contentful paint, zero characters of text. Chromium does eventually
abandon a hung connect, but not inside any window a student would wait through.
For classroom purposes this mode is: the page never loads. The lesson page
matters most here — that is the 1,517-file surface, and it is what a student
opens.

This is the finding. The severity of a blocked font host is not a spectrum — it
is bimodal, and which mode a school lands in depends on how its filter says no.

**What I am NOT claiming.** This sandbox's own passthrough number (13.2s to first
paint) is an artifact and should be ignored: Chromium here is not configured for
the agent proxy and gets `ERR_CONNECTION_RESET` after ~13s, while `curl` (which
uses the proxy) reaches `fonts.googleapis.com` fine. That is a container quirk,
not a prediction about any school network. I have no measurement of what Baltimore
County's filter actually does with `fonts.googleapis.com`, and cannot get one
from here. The honest statement is: *if* it is reachable, cost is ~0; *if* it is
rejected fast, cost is ~0; *if* it is dropped silently, students get a blank page.

### 1.2 Options

**A — Self-host the fonts.** Measured, not estimated: pulling the actual woff2
files for the five most-used URLs, latin + latin-ext only (the site is EN/ES, so
cyrillic/greek/vietnamese subsets are not needed), de-duplicated across URLs:
**14 files, 379,512 bytes (~370 KB)** one time, cached thereafter. For scale, the
four faces already self-hosted here are 105,828 bytes.

- Effect: eliminates the class entirely for fonts. No third party in the render
  path, blank-page mode impossible.
- Appearance: **unchanged** — same faces, same weights. The one thing to check is
  that Fraunces' optical-size axis survives, since it is a variable axis rather
  than a weight.
- Risk: 1,736 files to edit. It is mechanical (swap a `<link>`/`@import` for one
  local stylesheet) but it is not small, and the `@import`-inside-`<style>` cases
  are 761 of them.
- Cost: ~370 KB added to the repo and to `dist/`.

**B — Make the request non-blocking, keep the CDN.**
`media="print" onload="this.media='all'"`, or `rel="preload" as="style"`. Text
paints immediately in the fallback face and swaps when the webfont arrives.

- Effect: kills the blank-page mode. Does not remove the third-party dependency.
- Appearance: introduces a visible font swap on first load — the exact thing
  `display=swap` already permits, but now unavoidable rather than rare.
- Risk: low per-file, but does not work for the 761 `@import` cases without
  converting them to `<link>` first.

**C — Self-host only the accessibility face, non-block the rest.** Atkinson
Hyperlegible local (it is the a11y commitment and should not depend on a third
party at all); B for the decorative faces.

- Effect: the a11y guarantee becomes unconditional; the rest degrades gracefully.
- Cost: far smaller than A. Touches the 233 Atkinson files plus a mechanical
  sweep for the rest.

**D — Do nothing, and find out first.** One `curl` from a classroom Chromebook
answers which of the three modes Baltimore County is actually in. If the host is
reachable, this is a hygiene item and not a student-impact item at all.

**My recommendation: D first, then C.** D is one command and it decides whether
this is urgent or cosmetic — and I have no measurement that can substitute for
it. C is the right shape regardless of the answer, because the accessibility face
should not be a third-party dependency on any network.

### 1.4 Proposed gate — NOT implemented

`npm run validate:no-blocking-third-party`

**Invariant:** no tracked student-facing page introduces a render-blocking
request to a host we do not control.

- Blocking = `<link rel="stylesheet" href="https://…">`, `@import url(https://…)`
  in a stylesheet or a `<style>` block, or `<script src="https://…">` without
  `defer`/`async`/`type="module"`.
- Parsed **attribute-order-independently**. The first version of this detector
  assumed `rel` before `href` and reported 20 hits where there are 1,240; the
  self-test must pin both orderings, plus the `@import`-inside-`<style>` form.
- Ratchet, not zero: a count that may only shrink, seeded at today's 1,736, so it
  cannot block unrelated pushes for the length of the remediation. New pages get
  the hard rule.
- Self-tests its detectors against known-bad fixtures before sweeping, and fails
  on zero findings, per the house pattern.
- The 49 blocking CDN `<script>` tags fall under the same invariant and are
  arguably worse — a blocking third-party script is both a render dependency and
  a supply-chain surface.

Awaiting your choice of approach before writing any of this.

---

## Section 3 — live verification: still blocked

`origin/main` is still `c1883486`. The branch is 17 commits ahead. PR #191 is
open and not merged, so there is no deployed SHA to verify against — the
placeholder in the brief is still blank because nothing has shipped.

Egress, tested once (not looped, as instructed):

```
https://eduwonderlab.com/          403 CONNECT tunnel failed
https://www.eduwonderlab.com/      403 CONNECT tunnel failed
https://script.google.com          000
https://github.com                 400  (reached — the host answered)
https://fonts.googleapis.com/css2  400  (reached — the host answered)
```

The three hosts you added are still denied; `fonts.googleapis.com`, which you did
not add, is reachable. So the container does have a working allowlist — your edit
to it has not reached this session. My earlier hypothesis stands and is still
only a hypothesis: the allowlist may resolve at container start, in which case a
fresh session picks it up. I have not verified that and cannot from inside.

Section 3 and Section 4 remain blocked on this. Nothing scheduled.

---

# Block 10 — The pre-push QA gate was not installed in this clone

Found by checking, not by reading, after a push completed in about two seconds
and produced no gate output.

```
core.hooksPath          : ''        (empty — git uses .git/hooks only)
.git/hooks/pre-push     : ABSENT
.githooks/pre-push      : present, executable, tracked
package.json prepare    : none
```

`.githooks/pre-push` is the canonical copy and it is correct. Nothing installs
it. There is no `prepare` script, and `scripts/install-git-hooks.sh` exists but
is only run by hand via `npm run qa:install-hooks`.

**Why this matters more than a missing local convenience.** `scripts/ship.sh` —
the single documented deploy path — does not run the QA loop itself. It says so
in its own header: *"Pushes HEAD:main — the pre-push hook runs the full QA loop
first."* CLAUDE.md's "Which checks actually block deployment?" section describes
the same chain. In a clone without the hook, `ALLOW_DEPLOY=1 npm run ship` pushes
straight to `main`, and Cloudflare deploys it, **with no gate at all**.

**`tools/deploy-path.test.mjs` cannot see this.** It does
`readFileSync(".githooks/pre-push")` and asserts the text contains `qa:loop`. It
proves the file says the right thing. It cannot prove git will ever run it —
which is precisely the failure mode CLAUDE.md already documents for
`pre-bash-guard.sh`: *"a hook that never runs looks identical to a hook that
allows everything."* The repo learned that lesson once and the deploy hook still
has the same shape.

**Fixed here (machine-local, untracked):** ran `npm run qa:install-hooks`.
Installed `pre-commit` and `pre-push` into `.git/hooks/`.

Isolation test, which is what makes this more than an assertion:

- BEFORE: a real `git push` finished in ~2s with no gate output.
- AFTER: `git push --dry-run` ran past 120 seconds because `qa:loop` was
  executing under it. Same command, same branch, opposite behaviour.

**Not fixed, because it needs your judgement.** The durable fix is for
`deploy-path.test.mjs` to assert the hook is *installed* rather than merely
*correct* — but a fresh CI checkout never installs hooks and never pushes, so a
naive version turns every CI run red. Options: (a) assert installation only when
not running under `CI`; (b) add a `prepare` script so `npm ci` installs hooks,
and have the test assert `prepare` exists; (c) have `ship.sh` run `qa:loop`
itself rather than delegating to a hook that may not exist. **(c) is the one I
would pick** — it puts the gate on the deploy path rather than on the developer's
machine configuration, and it removes the dependency on a manual setup step
entirely. Not implemented.

## Gate status for this block's own commits

`npm run qa:fast` escalated to `FULL (no changes detected)` and ran the whole
gate: **213/213 test scripts, build 36.4s, 3m37s wall, all PASS.**

One honest caveat, flagged rather than buried: within that run
`validate:lesson-boot` reported `PASS` in **1.8s**, which is the documented skip
signature — Playwright wants Chromium 1234 and this sandbox has 1194, so it
could not launch a browser and skipped the render probe. Re-run standalone with
`PW_CHROMIUM_PATH` pointed at the sandbox's Chromium to get a real answer rather
than accepting the 1.8s green.

### validate:lesson-boot, run honestly — and the 8-1 scare, resolved

Because the gate reported `PASS` in 1.8s (the documented skip signature), it was
re-run standalone with `PW_CHROMIUM_PATH` pointed at this sandbox's Chromium.

**First honest run: 16/17, with lesson 8-1 FAILING** —
`uncaught: Failed to resolve module specifier "web-vitals"`, which the probe
correctly labels "the blank-page class of bug."

That was NOT reported as a defect, because two facts argued against it:
`dist/assets/nt-web-vitals.js` was correctly bundled (0 bare imports — Vite
inlines the package), and `smoke-lesson-boot.mjs`'s own header blames concurrent
builds sharing `node_modules` for dist churn of exactly this kind. A `git commit`
had fired the newly-installed pre-commit hook, which runs
`scripts/codex/codex-verify.sh` → `run_npm_script_if_present build`, rebuilding
`dist/` underneath the running probe.

**Isolation test:** killed every competing process, rebuilt clean (0 vite
processes, 0 bare imports), re-ran the probe alone.

```
PASS  8-1                    #app/mount 882
17/17 pages rendered; 0 failed.
```

Same command, same commit, no concurrent build → 8-1 renders. The failure was
the build-tooling artifact, not a page defect. Recorded here because "I saw a
student lesson fail to render and then it passed" is worth a written trace
either way.

**Operational note:** `npm run qa:install-hooks` installs `pre-commit` as well as
`pre-push`, and that pre-commit hook runs a full Vite build. On this repo's
commit-often workflow that makes every commit cost minutes and, as above, it can
corrupt a concurrent measurement. Worth knowing before installing it on a
machine where you commit in a tight loop.

---

# Block 11 — reconciling with main, and verifying the font fix rather than trusting it

`origin/main` moved **165 commits** (`c1883486` → `dc00d0dd`) while this branch
sat, and PR #191 went `mergeable_state: dirty`. Merged main in; two conflicts,
both resolved: `package.json` took main's `validate` line wholesale (verified it
still carries `validate:lesson-catalogues`, `validate:downloads` and
`validate:workflow-yaml`), and the report kept this branch's later blocks, which
main's copy does not have.

**The headline fix already shipped.** `ecaf7eb1` on main is a cherry-pick of
`b491192e` — the wrong-materials fix — and `tools/validate-lesson-catalogues.mjs`
went with it. So the defect that motivated PR #191 is live independently of the
PR.

## Section 1 was overtaken, and by more than I proposed

Three commits on main — `4111143a`, `7b3aacfa`, `fed97ea4` — self-host the fonts
for the **whole site**, not just the accessibility face, behind
`validate:self-hosted-fonts`. `1b3c504e` did the blocking-CDN-`<script>` half
and pinned `validate:external-scripts` at 0. Between them they cover both halves
of the class I described in Block 9.

**Two of my own numbers were wrong on the way to confirming this, and neither
reached a conclusion.**

1. I first read "zero `fonts.googleapis.com` on main" out of
   `git grep -c … <rev> | wc -l`, which counts lines of output from a form that
   printed none. The honest count is **56 files**.
2. I then nearly reported those 56 as unconverted pages. They are the **bundle
   CSS files themselves**, carrying the original Google URL as a provenance
   comment on line 2. Checked for a fetching position (`@import`, `src:`) across
   all 56: **zero**. Pages referencing both a bundle and the CDN: **zero**.

The gate is also honest about its own scope in a way worth repeating: it does
NOT assert repo-wide zero, because 941 printables were deliberately reverted
when a superset bundle changed their font matching and shifted their layout. The
invariant it holds is "a converted page may not regress", which is true and
keepable, rather than a zero that would fail on a deliberate decision.

## The verification that matters: the same probe, on the fixed tree

A passing gate is not a painting page. Re-ran the Block 9 blackhole probe — both
font hosts routed to a handler that never answers, which is how a filter that
drops packets behaves — against a fresh `npm run build`:

```
path                        first paint      requests to font host   text rendered
/curriculum/units/          596ms            0                       40,035 chars
/curriculum/                228ms            0                        5,852 chars
/lessons/1-1/               364ms            0                          637 chars
/lessons/1-1/worksheet.html 184ms            0                        3,693 chars
```

Block 9 measured `/curriculum/units/` **blank at 330 seconds** under exactly this
condition. It now paints in 596ms and never contacts the host at all. The
built `dist/` has **0** live font-CDN references in a fetching position.

The blank-page failure mode is gone. Not mitigated — the request is not made.

## Item 3: the QA gate no longer depends on a per-clone setting

`scripts/ship.sh` delegated the whole gate to `.githooks/pre-push`, which only
fires when `core.hooksPath` points at `.githooks` — a per-clone setting made by
`npm run qa:install-hooks` and not carried by a clone. This clone was found with
it empty. `ship.sh` now runs `npm run qa:loop` itself against `"$WT"`, the
assembled deploy worktree, and aborts before the push on failure. Four
assertions added to `tools/deploy-path.test.mjs`, each proven by mutation:

- remove the `qa:loop` run → 3 assertions fail
- gate the local tree instead of `$WT` → the `$WT` assertion fails
- move the gate after the push → the ordering assertion fails
- downgrade `fail` to `say` → the abort assertion fails

7/7 restored.

---

# Block 12 — the gate refused a push, and the skip heuristic is now inverted

## The gate did its job

With `ship.sh`/`qa:loop` actually running, the first push of the merged branch
was **rejected**: `PASS 96/99`, `FAILED: validate:hub, smoke:injection`,
`SKIPPED (verified NOTHING): validate:lesson-boot`. Nothing was bypassed.

**`validate:hub`** — `tools/validate-notebook-render.mjs` launched Playwright
with no `executablePath` and no `PW_CHROMIUM_PATH` support, and threw an
UNCAUGHT exception on any machine whose browser is not the exact pinned build.
That is a crash, not a verdict: it says nothing about the notebooks, and it
blocks every push. Three sibling tools already follow the convention
(`smoke-lesson-boot.mjs`, `validate-scorm-self-contained.mjs`,
`canvas-notebook-probe.mjs`); this one missed it. Added — and deliberately NOT a
skip, since a browser probe that quietly passes when it cannot open a browser is
the precise failure this repo documents. With a browser it runs and passes: **24
assertions** across 2-4, 5-10 and 6-2.

**`smoke:injection`** — passes standalone, 6/6 pages clean. Transient inside the
loop; the 404s on `/shared/…` and the `web-vitals` pageerror in that output are
the mid-build `dist/` churn signature already recorded in Block 10. It passed in
the clean re-run (12.1s).

Re-run with `PW_CHROMIUM_PATH` exported: **PASS 99/99, wall 265s, zero skips.**
Pushed `844c6dfe..9b6567b1`.

## The documented skip-detection heuristic is now WRONG, and dangerously so

CLAUDE.md said, in two places, that a real `validate:lesson-boot` costs ~200s and
**"that time difference is the tell"** for spotting a skip. That is dead.

Measured standalone, with a browser, on this tree:

```
17/17 pages rendered; 0 failed.
PASS — all probed pages render.
real  0m7.412s
```

7.4 seconds, naming every page with its render evidence. Under the old rule that
green would be dismissed as a skip wearing a costume — the exact heuristic I have
been applying all session, now pointing the wrong way.

**Why it changed, stated as strongly-supported inference rather than measurement:**
the self-hosted-font work removed a render-blocking `fonts.googleapis.com`
stylesheet from every page. Block 9 measured that stall at ~12.9s per page in
this sandbox; 16 pages × 12.9s ≈ **206s**, against a documented ~200s. The
arithmetic matches closely enough to be the explanation, but the old timing was
never re-measured on the old tree in this session, so it is consistent-with
rather than proven.

**Corrected in CLAUDE.md**: judge the check by its OUTPUT, not the clock. A real
run names each page (`PASS 1-1 #app/mount 999`) and ends `17/17 pages rendered`;
a skipped one is reported by name as `SKIPPED (verified NOTHING)`. The runner
already prints that line — it is what caught the skip in the rejected push above.

