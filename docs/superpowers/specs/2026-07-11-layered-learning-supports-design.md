# Layered Learning Supports — Publisher-Grade Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-11  
**Product:** EduWonderLab Grade 6 Reveal Math curriculum  
**Initial scope:** Curriculum hub and all 64 Reveal lesson launchers

## 1. Purpose

EduWonderLab will add a consistent Learning Supports layer to its Grade 6 Reveal Math lessons. The layer will help teachers provide accommodations and instructional scaffolds while allowing students to use discreet accessibility tools. It will not create a separate special-education curriculum, identify students by disability, or weaken the grade-level learning target.

The product principle is:

> One rigorous lesson, with optional layers that remove barriers without changing the mathematics.

The implementation must be additive. With supports off, unsupported, or unavailable, each lesson must retain its current content, controls, scoring, persistence, feedback, navigation, and visual behavior.

## 2. Goals

1. Give teachers fast, predictable ways to prepare supports for a lesson.
2. Give students private, age-respectful access to enabled learning tools.
3. Preserve grade-level standards and evidence of mastery.
4. Connect existing EduWonderLab assets such as Get Ready, Catch-Up, manipulatives, bilingual vocabulary, and My Math Path.
5. Provide consistent WIDA/ESOL and The Writing Revolution-style language supports.
6. Reach publisher-grade quality through authored lesson metadata, editorial consistency, accessibility, privacy, regression testing, and release controls.

## 3. Non-goals

- Storing names, diagnoses, disability categories, IEP documents, or accommodation records.
- Acting as an IEP authoring, compliance, case-management, or progress-monitoring system.
- Automatically determining what an individual student's IEP requires.
- Replacing existing Level 0/1/2 behavior in the initial release.
- Changing answer keys, grading rules, mastery thresholds, standards, or required mathematical evidence.
- Adding accounts, cloud synchronization, analytics, external services, or third-party dependencies.
- Producing unreviewed automatic translations or generic AI-generated lesson supports at runtime.

## 4. Instructional and legal boundary

The default system provides accommodations and scaffolds. These may change presentation, timing, task chunking, language access, available tools, or response method while preserving the learning target.

A curricular modification changes what a student is expected to learn or demonstrate. Modified targets are outside the initial release. If added later, they must be teacher-only, explicitly labeled, disabled by default, reviewed lesson by lesson, and used only when aligned with a student's documented instructional plan. EduWonderLab will not claim that activating a support makes a lesson IEP-compliant; the student's IEP team remains responsible for required services, accommodations, and modifications.

## 5. Experience model

### 5.1 Teacher entry point

Each supported lesson displays a **Prepare Supports** control in a consistent location that does not displace or obscure existing controls. It opens a teacher panel containing six functional profiles:

1. **Read & Understand** — listen controls, plain-language direction support, vocabulary previews, and one direction at a time.
2. **Focus & Organize** — focus mode, task chunking, progress checklist, reduced motion, and optional timer removal.
3. **Build the Math** — prerequisite link, worked example, manipulatives, reference card, and bounded hints.
4. **Express My Thinking** — teacher-approved response choices, TWR-style sentence frames, word banks, and evidence/reasoning prompts.
5. **Language Support** — visual vocabulary, concise directions, accurate bilingual vocabulary where authored, and WIDA-aligned language scaffolds.
6. **Challenge & Extend** — reduced repetition where appropriate, deeper reasoning, transfer prompts, and enrichment links without blocking core work.

Teachers may apply a profile, customize individual tools, reset to the lesson default, and preview the exact student experience. The panel explains that supports alter access, not the learning target.

### 5.2 Anonymous assignment settings

Teachers may copy a lesson URL whose fragment encodes a schema-versioned list of enabled support keys. URL fragments are not transmitted in normal HTTP requests. The encoded state must contain no student identifier, diagnosis, free-form notes, scores, or response data.

Unknown, expired, or invalid keys are ignored. The lesson then uses its normal default state.

### 5.3 Student experience

When at least one student-controlled support is available, the lesson displays a discreet **Learning Tools** button. The interface never uses public labels such as “IEP,” “special education,” “easy,” “low,” or a disability name.

Student tools use clear action labels:

- **Listen** — reads the current direction or prompt and offers stop/replay.
- **Focus** — reduces visual competition and shows one task segment at a time where the lesson manifest supports chunking.
- **Words** — opens authored definitions, visuals, symbols, examples, and optional Spanish vocabulary.
- **Example** — shows an authored worked example or completed first step that is distinct from the assessed answer.
- **Model** — opens an approved existing manipulative or reference representation.
- **Explain** — offers authored sentence frames, a word bank, and available response modes.

Tools are reversible during the lesson. A student can close or disable a tool without losing entered work.

### 5.4 Local preferences

Student-controlled visual and interaction preferences may be saved in local browser storage. Stored values are limited to support keys and schema version. They must not include student work, names, disability information, assignment membership, or teacher notes. A visible reset action clears the preferences.

### 5.5 Print behavior

Existing print output remains unchanged by default. When a teacher deliberately chooses **Print with supports**, the print view may include authored vocabulary, sentence frames, checklists, or reference tools. It must not print hidden answers, interactive-only controls, disability labels, or private configuration metadata.

## 6. Publisher-grade content standard

Every supported lesson must have an authored and reviewed manifest. A lesson does not receive a tool merely because the shared controller can render it.

Required editorial review fields are:

- lesson ID, title, unit, standard, and grade-level learning target;
- prerequisite and Get Ready/Catch-Up links where they are instructionally accurate;
- high-utility vocabulary, student-safe definitions, symbols, and accurate Spanish terms or cognates when included;
- chunk boundaries that preserve mathematical sequence;
- worked example that models process without revealing an assessed answer;
- approved manipulative or representation;
- TWR-style sentence frames progressing from sentence completion to independent explanation;
- common misconception and bounded hint language;
- support-to-barrier rationale;
- reviewer status for math accuracy, accessibility/editorial quality, and language support.

Content requirements:

- Directions are concise, explicit, and free of unnecessary idiom.
- Student text remains age-respectful and does not imply deficit.
- Vocabulary translations are human-reviewed and context-specific.
- Frames support mathematical reasoning rather than replacing it.
- Examples preserve units, notation, conventions, and the lesson's intended strategy.
- No student-facing manifest value contains an answer key.

## 7. Technical architecture

### 7.1 Shared assets

The feature has one canonical implementation:

- `/assets/learning-supports/learning-supports.css`
- `/assets/learning-supports/learning-supports.js`
- `/assets/learning-supports/manifest.json`
- a schema validator and curriculum integration script under `/scripts/`

No third-party runtime dependency is introduced.

### 7.2 Lesson integration contract

Each lesson integration consists only of:

1. the shared stylesheet reference;
2. a stable lesson ID on the document or support mount point;
3. the shared deferred script reference;
4. a non-invasive mount location for the optional controls.

The controller enhances only elements that match explicit Learning Supports hooks or manifest selectors. It must not infer answers, rewrite arbitrary text nodes, monkey-patch existing lesson functions, intercept form submission, or change existing storage keys.

### 7.3 Namespacing

All CSS classes, custom properties, data attributes, events, and storage keys use a unique `ewl-supports` namespace. Styles are scoped to the support UI or an explicit support-active root state. Global element selectors and unscoped resets are prohibited.

### 7.4 State flow

1. The original lesson HTML and scripts load normally.
2. The deferred support controller checks for a valid lesson ID and manifest entry.
3. If either is absent or invalid, it exits without DOM mutation.
4. It parses allowlisted URL-fragment settings and local preferences.
5. It mounts controls without moving or replacing existing lesson elements.
6. A user action applies a reversible, namespaced state.
7. Disabling the state restores the original presentation and preserves student inputs.

### 7.5 Fail-closed behavior

The controller must catch manifest, parsing, selector, speech, and storage failures at the feature boundary. Failure results in the unmodified lesson, not a blocking message. Optional tools that are unsupported by the browser remain hidden or provide a concise unavailable message; they never prevent lesson completion.

### 7.6 Security and privacy

- Manifest content is static, validated, and treated as untrusted before insertion.
- Student-visible content is rendered with safe DOM APIs; manifest strings are not injected as raw HTML.
- URL settings are schema-versioned, length-bounded, and allowlisted.
- No network requests are made by the support controller after static assets load.
- No tracking, fingerprinting, telemetry, external fonts, or external media are added.
- Teacher explanations and answer-related metadata remain excluded from student-delivered assets.

## 8. Preservation invariants

The following are release-blocking invariants:

1. With supports disabled, the rendered lesson and observable behavior match the baseline except for the additive support entry control.
2. Removing or blocking the support assets leaves the original lesson usable.
3. Existing questions, choices, inputs, buttons, feedback, scoring, hints, save/resume, exports, print behavior, analytics-free assumptions, navigation, and teacher tools remain present and functional.
4. Support actions do not write to, rename, or clear existing storage keys.
5. Support actions do not reveal answers or change correctness logic.
6. Existing public routes and asset paths remain stable.
7. Existing Level 0/1/2 features remain available and unchanged during the initial release.

## 9. Accessibility standard

The feature targets WCAG 2.2 AA behavior for its own UI and must not reduce the accessibility of the host lesson.

- Semantic buttons, dialogs, headings, lists, labels, and status messages.
- Complete keyboard operation, logical focus order, focus trapping within modal panels, Escape-to-close, and visible focus indicators.
- Screen-reader names and descriptions that communicate tool state.
- Minimum 16px body text and touch targets appropriate for Chromebook/tablet use.
- AA contrast in default, hover, focus, selected, disabled, and high-contrast states.
- 200% zoom without loss of content or horizontal page scrolling.
- Reduced-motion support and no new required animation.
- Speech controls that never autoplay and always expose stop.
- No reliance on color, sound, hover, or icons alone.
- Print and offline recovery appropriate to the host lesson.

## 10. Verification strategy

### 10.1 Manifest and static validation

- Schema validation for every manifest entry and support key.
- Unique lesson IDs and a manifest-to-launcher coverage report for all 64 launchers.
- Route, local asset, prerequisite, manipulative, and cross-link checks.
- Editorial scans for placeholders, forbidden deficit labels, raw HTML, hidden answers, and unreviewed translation markers.

### 10.2 Unit-level browser checks

- Valid, empty, malformed, oversized, and unknown URL-fragment settings.
- Local preference load, update, reset, unavailable storage, and schema migration behavior.
- Reversible support state without input loss.
- Unsupported speech synthesis and reduced-motion behavior.
- Safe rendering of punctuation and adversarial manifest strings.

### 10.3 Regression checks

For representative lesson architectures and every distinct launcher template:

- capture baseline and support-disabled screenshots at Chromebook, tablet, and mobile widths;
- compare the inventory of prompts, inputs, controls, scripts, links, and storage keys;
- exercise scoring, retries, hints, save/resume, reset, print, and navigation before and after support activation;
- block the shared assets and confirm the original lesson remains usable;
- check browser console errors and unhandled promise rejections.

The 64-launcher suite must at minimum load each route, verify the original primary task is visible, mount the correct support metadata, and confirm no page-level runtime error.

### 10.4 Accessibility and editorial QA

- Keyboard-only walkthrough of teacher and student flows.
- Automated accessibility scan plus manual screen-reader spot checks.
- Contrast, zoom, reflow, focus, reduced-motion, speech-control, and print checks.
- Human review of every manifest entry for math accuracy, age-respectful language, scaffold quality, and answer leakage.
- Spanish terms reviewed in mathematical context; no bulk machine translation acceptance.

### 10.5 Repository gates

Run the repository-defined checks, including the narrow support validators followed by:

- `npm run validate`
- `npm run build`
- `scripts/codex/codex-verify.sh`

Any pre-existing failure must be documented separately. A new failure in a preservation invariant, build, route, support validator, or representative regression check blocks release.

## 11. Rollout and deployment

1. Implement in an isolated feature worktree branched from current `origin/main`.
2. Keep support mode off by default and preserve all current routes.
3. Complete content review and automated gates before merging.
4. Review the final diff for unrelated files and generated-output drift.
5. Commit the reviewed implementation on the feature branch.
6. Deploy only through the repository's guarded `ALLOW_DEPLOY=1 npm run ship -- <sha>` workflow, as explicitly authorized by the user for this task.
7. Poll the public build stamp until production serves the expected commit.
8. Smoke-test the curriculum hub and representative lesson types in production with supports off, on, and assets unavailable where feasible.
9. If a regression is observed, stop rollout and use the repository's guarded rollback/recovery procedure; do not patch production manually.

## 12. Acceptance criteria

The release is complete only when:

- all 64 Reveal lesson launchers have valid, reviewed support manifests;
- every launcher retains its original lesson behavior when supports are off;
- the teacher can configure, preview, reset, and copy anonymous support settings;
- students can use enabled tools without disability or level labels;
- support state is reversible and never loses entered work;
- support failures degrade to the original lesson;
- no sensitive student information is requested, stored, encoded, or transmitted;
- the shared UI passes the defined accessibility checks;
- all repository, regression, route, manifest, editorial, and build gates pass;
- production serves the intended commit and passes post-deploy smoke checks.

## 13. Future phases

After the Grade 6 Reveal launch proves stable, the same validated support contract may expand to games, projects, WebQuests, HyperDocs, reading-and-math activities, and other curricula. Expansion requires template-specific regression baselines and authored manifests; the system must not be enabled indiscriminately across unreviewed pages.

