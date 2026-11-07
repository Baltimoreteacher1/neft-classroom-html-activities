# Math Fluency Lab visual direction

## Direction selected

**Mathematics field guide**: a warm, precise learning studio that combines the
legibility of a publisher's workbook with the clarity of a measuring instrument.
The custom math sculpture and the learner's work remain the visual focus; chrome
uses calm ink, paper, and one copper signal.

### Three-sentence brief

The Fluency Lab should feel like a beautifully made mathematics field guide: warm
paper, dark instrument ink, a single copper cue, and generous space around the
learner's work. The page moves from the brand and purpose, to grade choice, to
Today / Practice / Explore / Growth, with each section doing one clear job. Motion
stays functional: the existing illustration enters once, the existing sticky
section tabs remain available while a long view is explored, and selection changes use a brief
reduced-motion-aware transition.

## Directions considered

| Direction | Fit | Decision |
| --- | --- | --- |
| Mathematics field guide (warm editorial) | Builds on the existing custom geometry sculpture, Fraunces/Lexend pairing, porcelain surfaces, and copper/teal material cues. | Selected; it strengthens the product's existing identity. |
| Arctic instrument panel | Cool slate, pale blue, precise grids, and technical labels would make measurement feel rigorous. | Rejected; the lab serves K–8 learners and should retain its established warmth. |
| Botanical learning atlas | Leaf greens, natural paper, and specimen-like illustrations could make math approachable. | Rejected; grade-specific worlds already vary, and a new green system would compete with their meaning. |
| Neo-brutalist workshop | Hard edges, condensed display type, and high contrast signal a maker's bench. | Rejected; it would make the existing hand-drawn sculpture and younger-grade flows feel harsh. |

## System decisions

- **Type**: keep the existing locally hosted Fraunces display face and Lexend
  interface face. They are already part of the Lab's identity and support both
  the editorial hierarchy and clear student directions; no external font or
  dependency is added.
- **Color**: porcelain paper (`#F5F1E8`, `#FDFBF5`) is the dominant surface;
  obsidian ink (`#080F25`, `#13294B`) anchors navigation and text; copper
  (`#C97D5D`, `#8A4A33`) is the single expressive accent. Teal remains a brand
  and functional state color, while success, warning, error, and focus keep their
  existing semantic tokens.
- **Atmosphere**: use the existing hand-authored mathematics illustration and
  quiet measurement linework. Keep the app canvas calm and avoid additional
  decorative gradients or card mosaics.
- **Motion**: preserve the existing one-time hero entrance and sticky section
  tabs; use a short, state-linked grade selection change. Reduced-motion
  preferences remove transitions.
- **Surface**: this is a student-facing learning app, not a marketing landing
  page. Navigation, current grade, learning route, and next action stay visible
  in that order, with the selected grade easy to identify without color alone.

## Validation notes

The implementation retains the site's locally served typefaces and existing
palette rather than introducing a new brand or font download. The accent ratio
is approximate (about 65% paper, 27% ink/surfaces, 8% copper); semantic teal and
feedback colors are not competing accents. Browser checks cover desktop and
mobile layouts, grade selection, and reduced-motion behavior.
