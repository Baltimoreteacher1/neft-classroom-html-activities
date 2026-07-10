# ESOL “Write About the Math” Redesign

**Date:** 2026-07-10  
**Status:** Approved design  
**Audience:** Grade 6 mathematics students, including multilingual learners across WIDA proficiency levels

## Goal

Replace the vague, repetitive “Write About the Math” exercises in all 74 curriculum lessons with a clear, lesson-specific writing routine that helps students understand the task, rehearse mathematical language, write an evidence-based explanation, and check their work.

The redesign must improve the canonical generator so regenerated lessons remain consistent. Plain English and language-neutral scaffolds are primary. Spanish remains as an additional support for key directions and sentence frames.

## Problems to Solve

The existing section asks students to write generic sentences such as “___ matters in math” and to produce statements, questions, exclamations, and commands. These tasks do not consistently help students explain the lesson’s mathematics. Several Spanish prompts also retain untranslated English terms.

Students need:

- one visible purpose for the writing;
- short directions with one action at a time;
- a lesson-specific question;
- relevant vocabulary and meanings;
- a low-risk oral rehearsal;
- different amounts of language support;
- an example of a strong response; and
- a concrete way to check whether the response is complete.

## Student Experience

Every lesson uses the same four-step routine so students learn the process once.

### 1. Understand the Question

- Show one lesson-specific mathematical writing question.
- Add a short “Your job” statement: answer the question and explain how the math proves the answer.
- Highlight the action word, such as *explain*, *compare*, *describe*, or *justify*.
- Provide a concise Spanish translation when authored lesson data supports it.

### 2. Plan Your Math Words

- Show three to five relevant vocabulary terms from the lesson configuration.
- Pair each term with its student-friendly definition.
- Ask students to select at least two words they plan to use.
- Add “Say it first”: students orally rehearse one frame with a partner or quietly to themselves.

### 3. Build Your Explanation

Students choose the support level they need. The levels change language support, not mathematical rigor.

- **Start:** A highly scaffolded one- or two-sentence fill-in frame with a small word bank.
- **Build:** Two connected sentences using a mathematical claim plus *because*, *so*, or *but*.
- **Explain:** A three-part claim–evidence–reasoning response with lighter prompting.

All three paths answer the same lesson-specific question. Students may begin with a more supported path and then expand their response.

### 4. Check Your Explanation

Use a five-item, student-readable checklist:

- I answered the question.
- I used math evidence: numbers, an equation, a model, or a comparison.
- I explained how the evidence proves my answer.
- I used at least two math words.
- I reread complete sentences and punctuation.

The teacher guide uses the same five criteria, avoiding a second competing rubric.

## Worked Model

Each section includes one short model that demonstrates the response structure without completing the student’s assigned writing task. The model will use an already-authored lesson definition, worked example, or analogous context. It will visibly label the claim, evidence, and reasoning. It must not introduce new mathematical facts or expose an answer intended for independent assessment.

## Content Derivation and Source Priority

`engine/core/twr.js` remains the single source of truth. It will derive a structured writing-support object from existing lesson configuration fields in this order:

1. authored Turn & Talk or discussion question and bilingual stems;
2. authored explore/discussion prompts;
3. content and language objectives;
4. vocabulary definitions and worked-example explanations; and
5. a deterministic objective-based fallback.

The derivation layer will output:

- focus question and optional Spanish translation;
- action word and student job statement;
- vocabulary bank with definitions and available translations;
- oral rehearsal frame;
- Start, Build, and Explain frames;
- labeled model parts;
- student checklist; and
- matching teacher criteria.

No renderer will independently invent writing prompts or rules.

## Rendering Surfaces

The same canonical data will feed:

- generated lesson `notes.html` packets;
- the live interactive writing component;
- editable DOCX lesson packets; and
- PDFs produced from the generated HTML/DOCX workflow when those artifacts are regenerated.

HTML will use semantic headings, lists, fieldsets or equivalent grouped controls, visible focus states, readable contrast, and print-safe layouts. Directions and support labels must remain understandable without color or emoji.

## ESOL and Accessibility Rules

- Use short, direct sentences and familiar verbs.
- Put one instruction in each sentence.
- Explain academic action words in plain English.
- Keep mathematical terms precise; define rather than replace them.
- Never require Spanish to use the activity.
- Never assume every multilingual learner speaks Spanish.
- Keep Spanish visually secondary but readable and properly translated.
- Do not mix untranslated English topic phrases into Spanish sentences when a configured translation exists.
- Keep tap targets at least 44 CSS pixels on interactive surfaces.
- Preserve keyboard access, screen-reader names, print readability, and reduced-motion behavior.

## Failure Handling

Generation must fail with a useful lesson ID and field name when required writing data is malformed. If optional bilingual or discussion data is absent, the engine uses a deterministic English fallback and omits unavailable Spanish instead of displaying broken or fabricated translation.

The implementation must not silently return the old generic “matters in math,” “Wow,” or sentence-type prompts.

## Verification

Automated checks will cover representative lessons from fractions, expressions, equations, geometry, ratios, and statistics, plus all flagship variants. They will verify:

- all 74 lesson configurations generate a complete writing routine;
- every focus question is lesson-specific;
- Start, Build, and Explain paths are present and aligned to one question;
- vocabulary comes from the lesson configuration;
- generic banned prompts are absent;
- bilingual text is omitted safely when unavailable;
- the five checklist criteria match the teacher guide;
- generated HTML has valid structure and no broken local links;
- DOCX generation completes; and
- the existing full validation, curriculum audit, build, and browser smoke tests pass.

Browser QA will inspect at least one narrow mobile viewport, a Chromebook-sized viewport, print preview, keyboard navigation, and representative lessons with and without Spanish content.

## Deployment

Implementation will occur on `feature/esol-write-about-math` in an isolated worktree based on the latest `origin/main`. After fresh verification, the feature will be committed, integrated into `main`, pushed, deployed through the repository’s existing Cloudflare production path with `ALLOW_DEPLOY=1`, and verified at `https://eduwonderlab.com/curriculum/` and representative lesson URLs.

Deployment will stop if the remote main branch advances unexpectedly, required checks fail, or the live result does not match the verified build.

## Acceptance Criteria

- All 74 lessons show the redesigned routine.
- Prompts are specific to each lesson’s mathematics.
- A student can understand what to write without teacher reinterpretation.
- Students can choose among three language-support levels without receiving different math tasks.
- Core directions and frames use clear English, with Spanish as optional support.
- No old generic sentence-type or “matters in math” exercise remains on active lesson surfaces.
- HTML, live interactive, DOCX, and regenerated PDF outputs stay aligned to one canonical data model.
- Full repository validation, curriculum audit, build, targeted accessibility checks, and live smoke tests pass.

## Out of Scope

- Rewriting lesson mathematics, standards, practice problems, or assessment answers.
- Adding machine translation or a new external dependency.
- Changing curriculum routes, authentication, analytics, save/resume, or grading systems.
- Redesigning unrelated lesson sections.
