# Math Fluency Lab student app — design system

The student app (`/math/fluency-lab/`) draws with one small set of tokens and components. Everything below is what the
code does today; `shell.css` (tokens + components), `graphics.css` (pictures), `reward.css` (meter and celebrations) are
the source. Nothing here is aspirational.

## Principles

1. **One dominant action per screen.** A screen has one `.btn-primary`; secondary actions are outlined (`.btn-secondary`)
   or quiet (`.btn-quiet`, header utilities and "Choose another skill" style links). Home is verified to carry exactly one.
2. **Quantity is never colour alone.** Colour pairs with a label, a position or a shape.
3. **Praise thinking, never speed.** No timers, streaks or rankings. The meter counts only independent first-try answers;
   supported work is shown on its own line ("counted separately").
4. **The picture, the notation and the words are one thing.** They come from one frame (`studio/core.js` `frame`) so they
   cannot drift; the equation line and the screen-reader description follow the language (`eq-language.js`, `svgAlt`).
5. **Phone first.** Every screen is checked at 320, 375, 768, 1024 and 1440px with no sideways scroll.

## Tokens (`:root` in `shell.css`)

| Group                        | Tokens                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ink and paper                | `--navy #14284b` (header), `--ink #17233a`, `--ink-2 #4a5873`, `--paper #f7f5f0` (page), `--surface #fff`, `--line #dfe3ea`, `--line-2 #c4ccd8`                                                         |
| Action and state             | `--blue #1f5fbf` (primary, focus ring), `--blue-ink #174a96`, `--teal #0f7a74`, `--warm #b4541b`, `--right #146c43` / `--right-bg`, `--wrong #a3401f` / `--wrong-bg`                                    |
| Mathematical colour language | `--q1 #c2410c` first quantity, `--q2 #1d4ed8` second quantity, `--q3 #0f766e` result or emphasis. The studio engines read the same values (`COLORS` in `studio/core.js`).                               |
| Space                        | `--s1 4px`, `--s2 8px`, `--s3 12px`, `--s4 16px`, `--s5 24px`, `--s6 32px`, `--s7 48px`                                                                                                                 |
| Radius                       | `--r-sm 8px`, `--r 14px`, `--r-lg 20px`                                                                                                                                                                 |
| Type                         | `--font` Lexend (body), `--font-display` Fraunces (headings); `--fs 1rem`, `--fs-lead 1.2rem`, `--fs-problem clamp(1.6rem, 4.5vw, 2.4rem)`, `--fs-h1 clamp(1.6rem, 4vw, 2.4rem)`; body line-height 1.55 |
| Depth                        | `--shadow` (one soft shadow for raised cards)                                                                                                                                                           |

Content width is capped (`max-width: 1040px` for the app, 60–64ch for reading text).

## Components

| Component          | Classes                                                                                                                              | Notes                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Header             | `.topbar`, `.brand`, `.nav`, `.nav-link`, `.topbar-end`                                                                              | Brand and two utilities (language, More) on one row on phones; three destinations as equal tabs beneath.                               |
| Buttons            | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-quiet`, `.btn-link`, `.btn-sm`, `.btn-lg`, `.btn-icon`, `.btn-choice`, `.btn-listen` | Every button is at least 44px tall, `.btn-sm` included.                                                                                |
| Cards and panels   | `.card`, `.panel`, `.panel-kicker`, `.panel-lead`, `.hero`, `.eyebrow`, `.lead`                                                      | A skill card is a name, one sentence and one Start button (plus a mini meter once started).                                            |
| Choosers           | `.grade-grid`, `.grade-btn`, `.chip` (filters)                                                                                       | The grade chooser lists K–8 and preselects nothing.                                                                                    |
| Stepper            | `.stepper`, `.stepper-btn`                                                                                                           | See it → Try it → Practice it.                                                                                                         |
| Explanation canvas | `.cv-stage`, `.cv-eq`, `.cv-cap`, `.cv-nav`, `.cv-predict`, `.cv-choices`, `.cv-strip`                                               | Picture, notation and caption move together; a Predict point asks before it shows.                                                     |
| Help ladder        | `.rung`, `.steps`, `.note`                                                                                                           | Hint → picture → worked steps, only on request; never prints the answer.                                                               |
| Mastery meter      | `.meter`, `.meter-dots`, `.meter-stage`, `.meter-count`, `.meter-help`, `.meter-mini`                                                | Eight segments for eight independent answers; stage in words; announced to screen readers.                                             |
| More drawer        | `.more-list`                                                                                                                         | Explore, For families, For teachers, Settings (larger text, reading font, reduce motion, read aloud, learner on this device, back up). |

## Pictures (`graphics.css`, `legible.js`)

- Labels are at least 14px at the rendered size and never overlap or clip (`keepLegible`, `legibleSvg`). A picture wider
  than its box scrolls inside it (`.pan-host`), never the page. Grids that hold pictures use `minmax(0, 1fr)` so a wide
  picture cannot widen the page.
- Both languages are drawn into one picture and the stylesheet shows the one matching `<html lang>` (`txt()` and
  `bilingualText()` in `studio/core.js`); the description (`aria-label`) comes from the frame's `alt` pair.

## Accessibility rules the code follows

- Focus: a 3px `--blue` outline with 2px offset on every focusable element (`:focus-visible`).
- Targets: 44px minimum for buttons, nav tabs, the brand link and links in lists.
- Motion: `prefers-reduced-motion: reduce` removes animation in the app and the celebrations (verified: 0 animated
  elements in the skill screen with the setting on).
- Language: one `Español` / `English` button; the current skill and step survive the switch. Spanish is written for the
  learner (tú), numbers and notation unchanged.
- Text: Larger text and Reading font are Settings, not separate pages.

## Language layers

| Layer                                               | Where                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Interface strings                                   | `words.js` `tr()` (82 strings, all with Spanish; `shell-content.test.mjs`)                        |
| Skill content                                       | `authored/*.js` bilingual `{en, es}` pairs for all 128 skills                                     |
| Picture labels, equation line, description          | `studio/core.js`, `studio/eq-language.js`, `studio/percent-model-es.js` (`svg-language.test.mjs`) |
| Hints, steps and explanations of generated problems | `bank-es.js` + `bank-es-data.js` (`bank-es.test.mjs`)                                             |
| Search words                                        | `search.js` (`search.test.mjs`, 35 everyday queries)                                              |

None of the Spanish has had native-speaker review.

## Guarded by tests

`shell-content.test.mjs` (128 skills, no answer in any help rung), `explanation-model-alignment.test.mjs` (steps and
interactive models share one plan), `svg-language.test.mjs`, `bank-es.test.mjs`, `search.test.mjs`,
`meter-awards.test.mjs`, `authored/k5.test.mjs`, `authored/g68.test.mjs`, and the browser sweep recorded in
`docs/fluency-redesign-report.md`.
