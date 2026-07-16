# Small-Group Math Studio — Award Edition Design

## Goal

Elevate all 128 small-group studios from polished guided lessons into an adaptive, student-owned learning system that makes mathematical thinking, collaboration, revision, and transfer visible without collecting student identities or requiring a backend.

## Design choice

The selected direction is an **Adaptive Studio + Evidence Lab**. It adds instructional intelligence and authentic student creation inside the existing seven-phase flow. It deliberately avoids a points-and-badges game layer, which could increase clicks without improving the mathematics, and avoids live multi-device synchronization, which would add accounts, network dependence, and privacy risk.

The memorable product idea is: **every small group leaves with visible evidence of how its thinking changed.**

## Research and standards basis

- CAST UDL Guidelines 3.0 emphasize learner agency, collaboration, multiple means of representation, and multiple means of action and expression.
- NCTM's effective mathematics teaching practices emphasize reasoning tasks, connected representations, meaningful discourse, productive struggle, purposeful questions, and evidence of student thinking.
- ISTE Student Standards emphasize the Empowered Learner, Innovative Designer, Creative Communicator, and Global Collaborator roles.

These principles translate into student choice, revision after peer discussion, original problem design, strategy explanation, and a private teacher evidence workflow. Sources:

- https://udlguidelines.cast.org/more/udl-goal/
- https://www.nctm.org/Conferences-and-Professional-Development/Professional-Services/Productive-Struggle/
- https://iste.org/standards/students

## Student experience

The existing seven phases remain recognizable and fast. Premium interactions are embedded where they improve instruction rather than adding extra navigation.

### Choose Your Proof Path

During Build, students choose how they want to make the idea visible:

- **Model it:** draw, diagram, table, number line, or concrete representation.
- **Explain it:** use precise words and a sentence frame.
- **Test it:** try an example and check whether the idea holds.
- **Teach it:** prepare a short explanation for a partner.

The selected path changes the response prompt and becomes part of the final evidence card. Group 1 receives reassuring, scaffolded wording. Group 2 receives proof, generalization, and counterexample wording.

### Team Consensus Protocol

During Talk, teams use a shared-device, pass-the-device protocol:

1. Each of three voices privately chooses a proof path.
2. The board reveals the anonymous distribution only after all voices respond.
3. The team selects the evidence it will use.
4. After discussion, the team records whether it kept or revised its position and why.

No names, accounts, or individual scores are stored. The interaction rewards revision and evidence rather than conformity.

### Adaptive Next-Move Coach

The coach uses only in-memory session signals:

- readiness confidence;
- practice attempts;
- hints opened;
- completed practice checks;
- selected representation;
- whether the team revised after discussion.

It assigns one of three transparent pathways:

- **Stabilize:** revisit the anchor idea with a representation and one focused question.
- **Connect:** explain how two representations or steps show the same idea.
- **Stretch:** test a boundary case, generalization, or counterexample.

The coach never reveals an answer, labels ability, or makes a permanent placement decision. Students can choose another path.

### Create-a-Challenge Design Lab

During Show It, each group creates a new problem or example that meets a lesson-derived design brief, predicts what a solver should notice, and writes a verification note.

- Group 1 remixes a familiar structure while changing one meaningful feature.
- Group 2 adds a constraint, tricky case, or plausible misconception that requires justification.

The task uses the lesson objective, key idea, and vocabulary already present in the config, so all studios receive aligned prompts without duplicating curriculum content.

### Studio Evidence Card

At completion, the studio generates a printable student-owned artifact containing:

- lesson title and standard;
- before/after confidence growth;
- chosen proof path;
- one vocabulary term used;
- whether the group revised after discussion;
- adaptive pathway completed;
- original challenge and verification note.

The card contains no student name field and stays on the device unless deliberately printed or saved as PDF.

## Teacher experience

Teacher mode adds a private **Facilitation Console** above the student flow. It includes:

- anonymous observation toggles for representation, vocabulary, questioning, revision, justification, and transfer;
- a live evidence count;
- a deterministic next-move recommendation based on unchecked evidence and session signals;
- one-click print/save of the observation summary;
- explicit confirmation that no names or individual responses are transmitted.

The console does not appear in student mode or in student accessibility trees.

## Differentiation

Group 1 emphasizes modeling, accessible language, one-variable changes, productive retry, and rehearsed teach-back. Group 2 emphasizes conjecture, proof selection, generalization, counterexample, constraint design, and defense to a skeptic. Both groups receive the same dignity, visual quality, and opportunity to create original mathematics.

## Architecture

- Create `engine/core/small-group-innovation.js` as the focused owner of proof-path choice, consensus, adaptive coaching, challenge design, evidence cards, and teacher evidence controls.
- Keep `small-group-renderer.js` as the composition layer. It creates one shared `studioState`, connects innovation callbacks to existing phases, and inserts premium interactions without changing the seven-phase rail.
- Add small instrumentation hooks to `small-group-practice.js` for attempts, hints, and solved checks. Hooks report session events without coupling practice rendering to the innovation UI.
- Extend `small-group-ui.js` only with scoped styles for the new components. Keep the module below the repository file-size cap by moving the expanded style sheet into a new `small-group-innovation.css` asset loaded by the UI module.
- Existing lesson configs remain the only source of lesson-specific content.

## State and privacy

`studioState` is an in-memory plain object. It contains no name, email, ID, class, or free-response transmission. Existing save/resume can continue observing the page, but the innovation layer adds no network calls, analytics, cookies, accounts, or external services.

## Accessibility and resilience

- All controls use native buttons, textareas, labels, fieldsets, and live regions.
- Pass-the-device votes are anonymous and keyboard operable.
- Color is never the only status cue.
- Reduced-motion and print modes cover every new component.
- Missing optional objective, key idea, vocabulary, or talk data produces a useful generic prompt.
- Unsupported printing or speech features do not block lesson completion.
- Responsive layouts support phones and Chromebooks without horizontal overflow.

## Verification

- Add failing Playwright tests for student proof-path choice, anonymous consensus and revision, adaptive pathways, challenge creation, evidence card, and teacher-console privacy.
- Add module-level tests for deterministic pathway selection.
- Syntax-check every modified JavaScript module.
- Run small-group validation across 64 parents and 128 variants.
- Run focused accessibility and responsive browser checks for Group 1, Group 2, student mode, and teacher mode.
- Run repository tests, validation, production build, and the guarded ship flow.
- Verify the live build stamp, direct studio routes, ordinary curriculum URL, and public browser console after deployment.
