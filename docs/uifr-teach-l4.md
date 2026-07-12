# BCPS UIFR — TEACH · Level 4 evidence

Every Reveal Math lesson launcher is built to create the **conditions for a
Level 4 ("Highly Effective") rating** on the Baltimore City Public Schools
[Instructional Framework Rubric](../UIFR_Full.pdf) (June 2020), **TEACH** domain.

Level 4 on every TEACH indicator centers **student agency** — students _select_
strategies, _justify_ with evidence, _revise_ their own work, and _lead_ talk.
The lesson engine renders those student-agency surfaces for **every** lesson.

> **Honest framing:** the materials create the _conditions_ for Level 4. The
> actual rating on any given day depends on **observed student practice**. T1–T5
> are addressed **directly** by the lesson surfaces; T6–T7 are
> **teacher-facilitated** — the lesson supplies the supporting structure, the
> rating is enacted by the teacher and classroom culture.

## Indicator → lesson surface map

| Indicator                                   | Level 4 (student agency)                                           | Lesson surface (universal)                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **T1** Clear, standards-based content       | Students connect learning to essential questions / life / identity | Content + Language Objectives · Connect phase · Reflect "connections made" · Notice & Wonder |
| **T2** Strategies & rigorous tasks          | Students select strategies; voice & choice at grade level          | Show Your Work strategy chips · Practice level selector · adaptive practice                  |
| **T3** Intentional questioning              | Students justify with evidence; reflect on pathways                | "How I know" evidence box · Reflect "question I still have" · Turn & Talk justify stems      |
| **T4** Monitor & feedback                   | Students correct / clarify / expand / redo in response to feedback | "Check my thinking" self-check + Revise · hint ladder · adaptive remediation                 |
| **T5** Interactions & academic talk         | Students use academic language; lead / adapt talk                  | Turn & Talk bilingual stems + confidence self-assess · vocabulary glossary                   |
| **T6** Routines _(facilitated)_             | Students take academic risks; hold focus                           | Consistent phase routine · Save/Resume · calm no-fail practice                               |
| **T7** Supportive community _(facilitated)_ | Students support one another; feel safe sharing                    | Learning Supports · encouraging feedback tone · bilingual access                             |

## Where the evidence is recorded (students never see it)

The mapping is surfaced three ways — **none visible to students**, no rubric
language ("T4", "Level 4", "Highly Effective") ever appears in the student view:

1. **Hidden page stamp.** Every lesson stamps a `<meta name="nt-teach-l4-coverage">`
   and a `<script type="application/json" id="nt-teach-l4-evidence">` into
   `<head>` at boot (`engine/core/uifr.js` → `stampTeachL4Meta`). Neither renders
   on screen; an observer reads them via **View Source / DevTools**.
2. **Teacher Mode panel.** Inside Teacher Mode (PIN-gated) the floating teacher
   panel shows a **🧭 Teaching Evidence** section listing each indicator, its
   Level 4 descriptor, and the concrete lesson surfaces. Gated by
   `isTeacherMode()`, so students never see it.
3. **Coverage report.** `reports/uifr-teach-l4-coverage.{json,md}` — the durable,
   auditor-facing record for all lessons. Regenerate with `npm run generate:uifr`.

## Single source of truth

`engine/core/uifr.js` holds the indicator definitions **and** the evidence
computation, imported by runtime (stamp + teacher panel), the report generator,
and the CI gate — so all four can never drift.

## Commands

| Command                 | Purpose                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `npm run generate:uifr` | Rebuild `reports/uifr-teach-l4-coverage.{json,md}`                                   |
| `npm run validate:uifr` | CI gate: every lesson meets Level 4 conditions on T1–T5 (part of `npm run validate`) |
