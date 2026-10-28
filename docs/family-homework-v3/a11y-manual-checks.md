# Family Math Studio v3.0: accessibility checks that need a person

`npm run validate:family-a11y` automates what a browser can measure (axe WCAG 2.2 A/AA, the accessibility tree,
computed style, layout, focus, emulated preferences). These checks cannot be automated here. Run them before a release
on one phone page and one desktop page per unit, in English and Spanish. Record the date, device and result below.

## Screen readers

- [ ] VoiceOver on iPhone (Safari): swipe through the start screen, Learn, Words, Check, Play, Done. Each control is
      announced with a name that makes sense out of context ("Problem 3", not "3"; no "speaker high volume").
- [ ] VoiceOver on macOS and NVDA on Windows (Chrome): the heading list (`VO+U`, `NVDA+F7`) is one h1 and a clean
      outline; the landmark list has banner, main, contentinfo.
- [ ] Switch language with the picker: only the new language is read; the old one is gone. The page is announced in
      the right voice (Spanish text is not read with an English voice).
- [ ] Check an answer: the result is announced once, politely, without moving focus. A wrong answer is announced as
      "try another look" feedback, never as an error alert.
- [ ] Vocabulary flashcards: the flip button turns the card, the hidden face is not reachable, the focused control
      stays on screen.

## Keyboard and switch

- [ ] Tab through a whole stop with the keyboard only. Every control is reachable, the focus ring is always visible and
      is not hidden under the fixed bars, nothing traps focus, Escape closes the help drawer and the lightbox.
- [ ] Sorting and ordering problems: complete each without a mouse using the move buttons and the category selects.
- [ ] Scratch pad and the graph/coordinate tools: the notes box and the text alternative are enough to finish the task.
- [ ] Switch Control (iOS) or Voice Control ("tap Start") reaches every control by its visible label.

## Zoom, reflow and spacing

- [ ] Browser zoom to 200% and to 400% at a 1280px-wide window: no horizontal scroll, nothing clipped, nothing
      overlaps. (The gate emulates this with 640px and 320px viewports; a real zoom also scales fixed bars.)
- [ ] Apply the WCAG text-spacing bookmarklet (line height 1.5, paragraph spacing 2x, letter spacing 0.12em, word
      spacing 0.16em): nothing is cut off.
- [ ] Text size control at 150%, dyslexia-friendly option and spacing option persist after reload and keep the layout.
- [ ] Rotate a phone to landscape: nothing is locked to one orientation.

## Colour, contrast and preferences

- [ ] Windows High Contrast / forced colors: controls have edges, the focus ring is the system highlight, icons and
      the progress meter are still readable.
- [ ] Dark mode and the high-contrast option: no text on a dark surface keeps a light-surface colour.
- [ ] Grayscale (iOS Display Accommodations): every state (selected, correct, try another look, locked-looking) is
      still distinguishable by shape, text or icon, not colour alone.
- [ ] Reduce Motion on: no movement on entrance, tab change or celebration; a static equivalent is shown.
- [ ] Sound off by default; every audio cue (read aloud, success sound) has a visible cue.

## Known gaps, owned elsewhere

- Text inside math drawings: some SVG diagrams scale below 11px on a phone. The gate reports it as a warning. The fix
  is the math-visual grammar (label size >= 14px at 390px), not a page rule.
- Each cell of the "find the whole" bar on 4-5 and 4-4 prints "$7" (`homework-guided-notes.mjs`, `family-whole-bar`).
  This looks like a content slip, so it was left alone; only its colours were raised to pass contrast.
- Injected layers (`nsr-err` from save/resume, `ci-hm-msg` from the Canvas bridge) use assertive error regions. They
  report failures, not feedback, so the gate allows exactly those two ids.
- First view is about 172 KB gzip against a 150 KB target. The two homework layer stylesheets are 74 KB of it; the
  body restyle removes that. `data/family-performance-budget.json` pins the ratchet so it can only go down.

## Log

| Date | Page | Device and tool | Result |
| ---- | ---- | --------------- | ------ |
|      |      |                 |        |
