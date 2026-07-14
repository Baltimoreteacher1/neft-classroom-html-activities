# Community Math Studio Implementation Guide

Version: 1.0 · 2026-07-14

## Purpose

Community Math Studio is the common culminating-project contract for the 22 standard Grade 6 project experiences. It preserves each project's context and calculations while adding evidence of mathematical modeling, multilingual discourse, critique, revision, defense, and transfer.

## Required student evidence

Every implementation collects:

1. stakeholder or client role;
2. need and success criteria;
3. estimate and assumptions;
4. two models, strategies, or representations;
5. tradeoff decision;
6. validation and limitations;
7. peer notice, question, and challenge;
8. mathematical revision memo;
9. final claim, evidence, and reasoning;
10. audience feedback and response; and
11. novel transfer response.

The shared browser layer stores these fields locally and exposes them through `window.NeftAwardStudio`. Existing report generation appends the evidence summary when available.

## Source of truth

- Project-specific content and bilingual targets: `shared/projects/projects-award-config.json`
- Shared behavior: `shared/projects/projects-award.js`
- Shared presentation: `shared/projects/projects-award.css`
- Idempotent injection: `tools/inject-projects-award.mjs`
- Contract validation: `tools/validate-projects-award.mjs`
- Browser coverage: `tests/projects-smoke.spec.ts`
- Public evidence framework: `/evidence/`
- Teacher quick start: `/teacher-tools/project-award-kit/`

Do not hand-author divergent copies of the Community Math Studio markup inside project pages. Change the shared implementation or the centralized configuration and rerun the injector.

## Teacher sequence

| Phase | Teacher responsibility | Student evidence |
|---|---|---|
| Launch | Clarify non-negotiable mathematics, audience, choices, and constraints | Entry task and project brief |
| Model | Press for quantities, units, relationships, and connected representations | Estimate, assumptions, two models |
| Validate | Ask students to test reasonableness without giving the method | Validation and limitations |
| Critique | Structure notice/question/challenge and equitable participation | Peer feedback |
| Revise | Require a mathematical change or evidence-based decision | Revision memo |
| Defend | Invite questions from a real or role-based audience | Claim-evidence-reasoning and audience response |
| Transfer | Present a changed case without the original scaffolding | Individual transfer response |

## Mathematical quality criteria

- The task retains the target grade-level content.
- Students interpret quantities and units.
- At least two representations, strategies, or models are connected.
- Assumptions and constraints are explicit.
- Validation uses evidence, measurement, a prototype, an extreme case, or another representation.
- A limitation or possible failure is acknowledged.
- Feedback produces a mathematical revision.
- The final recommendation follows from evidence.
- The transfer task changes a material condition and requires adaptation.

## Multilingual mathematics criteria

- Display a content target and a WIDA-aligned Explain/Argue target.
- Allow private thinking, annotation, rehearsal, and research using students' full language repertoires.
- Offer optional word, sentence, and argument supports that students can dismiss.
- Structure partner work around explaining, revoicing, comparing, questioning, and revising.
- Score mathematical understanding separately from English-language development.
- Preserve the same cognitive demand for every student.
- Use bilingual or multilingual final artifacts when appropriate for the audience.

## Accessibility requirements

- All shared controls are keyboard operable with visible focus.
- Labels are programmatically associated with response fields.
- Status changes use polite live regions.
- Layout reflows at 360 CSS pixels without horizontal overflow.
- Color is not the only state cue.
- Reduced-motion preferences are honored.
- The complete workflow must remain possible with print/paper.
- Project smoke tests run axe against the shared goals and studio components.

## External replication protocol

For each partner classroom, record:

- school/class context and dates;
- number of students and project dosage;
- teacher preparation time;
- adaptations and why they were made;
- phases completed as designed;
- support requests and technical failures;
- representative student work at baseline, draft, revision, and transfer;
- teacher and student feedback, including negative cases; and
- recommended changes for the next version.

An implementation is not considered independently replicated until a teacher outside the design team can launch, facilitate, assess, and complete the cycle using the published kit.

## Release checklist

1. Run `npm run inject:projects-award`.
2. Run `npm run validate:projects-award`.
3. Run the project Playwright suite.
4. Run the full repository validation and build.
5. Confirm `/curriculum/` launches the correct domain for every unit.
6. Confirm `/evidence/` and the teacher kit are present in `dist/`.
7. Review the diff for generated or unrelated changes before commit.
