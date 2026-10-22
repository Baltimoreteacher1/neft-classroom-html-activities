# Problem Workspace

One drawing pad, one notes box and an optional guide under a practice problem, on every student- and family-facing HTML practice surface. The component is `assets/workspace/problem-workspace.js` (behavior and markup) and `assets/workspace/problem-workspace.css`; nothing about it is written twice.

## Where it appears

| Surface | How it gets the workspace |
| --- | --- |
| Family homework, 166 pages (`lessons/<id>/homework.html`) | `scripts/generate-homework-html.mjs` `renderWorkspace()`, every problem, closed until opened; the tap-to-graph widgets keep their own surface and gain the notes and guide |
| Family and student word problems (`lessons/<id>/family/word-problems/`, `lessons/<id>/word-problems/`) | `scripts/lib/family-word-problems-page.mjs`, `scripts/lib/student-word-problems.mjs`, open by default |
| Practice and Challenge studios, 67 lessons x 2 (`/math/practice-studio/<id>/`) | `assets/studio/runtime.js` `mountWorkspace()` under the kinds a student works out on paper: `mc num err tbl wr`. Sort, match, number line, hands-on and lab items are their own work surface |
| Hand-built Unit 4 studios (`/math/unit-4/*practice-studio*`) | `assets/u4-studio.js` `workspaces()`, one workspace per section and active step dot, beside the card because the page redraws the card on every answer |

## Contract

1. **Guidance never carries an answer.** Five steps (Know, Find, Plan, Solve, Check) with a sentence starter each, the same on every problem, plus at most one authored tip line (a way to start, never a result). `tools/family-workspace.test.mjs` holds that the steps carry no digits.
2. **Optional.** The guide is a closed `<details>`; nothing is required to check an answer.
3. **Saved on the device, nowhere else.** Strokes (not pixels) in `localStorage` under `fw:<path>:<key>`; notes under the same key with `:notes` where the host page has no save hook of its own (the homework pages keep `work_<n>` in `saveState()`). A re-rolled studio problem and a studio "start over" call `NTWorkspace.forget()`.
4. **Two languages.** The `pair` dialect (family pages) and the `studio` dialect (`es-text` spans) come from one builder; starters are inserted in the language the page is showing.
5. **Lean pages.** Server pages carry a shell per problem; the toolbar and guide are built on first open, so twenty problems do not carry twenty copies.
6. **Print.** Toolbar, guide and the saved tag never print; the pad and notes do, and `beforeprint` wakes every workspace.
7. **44px targets, 14px text,** keyboard path through the notes box (the pad is pointer-only and says so in its label).

## Changing it

Edit the two files in `assets/workspace/`, then run `npm run generate-homework-html`, `npm run generate-word-problems` and `npm run generate:practice-studios`. The stamps (double number line, 100 grid, coordinate plane) are drawn in the CSS and chosen by unit in `STAMPS`.
