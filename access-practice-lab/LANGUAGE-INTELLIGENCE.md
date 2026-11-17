# Language Intelligence Engine

One feedback loop for a learner's own words, used by Speaking Studio, Writing Studio, Book Studio, ACCESS learning
mode, simulations, pathways and the Time Machine. Contracts: `docs/part2-integration-map.md`.

```
response → feedback → guided practice → revision → what changed → new task (on my own) → share with my teacher → done
```

## Files (`src/intel/`)

| File                  | Owns                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `engine.js`           | `buildFeedback`, `isGrounded`, `dropUngrounded`, `nextStepOptions`, `preferFromSecondLook`. Pure.          |
| `compare.js`          | `compareWork(before, after, opts)` (re-exported from `engine.js`). Pure.                                   |
| `bank.js`             | `TRANSFER_BANK`, `transferFor({ keyUse, taskId, band, prompt, exclude })` (re-exported from `engine.js`).  |
| `wording.js`          | Every sentence a learner reads, English and Spanish. The engine only chooses entries.                      |
| `practice.js`         | `buildPractice`, `checkPractice`: one guided try from the learner's own sentences, checked by rule.        |
| `review.js`           | The instructor's decision: `encodeDecision`, `decodeDecision`, `applyTeacherReviews`, `effectiveFeedback`. |
| `loop.js`, `share.js` | The loop store and class sharing (coordinator-owned).                                                      |
| `ui.js`, `ui-view.js` | `startTextLoop`, `loopPanelHTML`, `onLoopClick`, `onLoopInput`.                                            |
| `book-coach.js`       | "Language coach for this page" in the Book Studio reader.                                                  |

The engine is built on `src/lang/analyze.js` (`analyzeResponse`, `compareDrafts`), `purpose.js` and `errors.js`.
There is no second analyzer.

## Rules that must keep holding

- Every quote is a verbatim substring of the response. An observation with no quote in the text is dropped.
- One strength and at most one next step. Differences are not all "corrected".
- Accent, dialect and speed are never judged. Dialect-sensitive patterns are never named for speech.
- Whether an idea is true (science, mathematics) is never inferred from grammar.
- A transcript: `uncertainty.level` is `"transcript"`; spelling, capitals and punctuation are never observed.
- Under 12 words: `uncertainty.level` is `"short"` and there are no sentence-variety claims.
- The text is data. All wording is authored; nothing in the text changes the result's shape.
- A revision is always supported. A new task is independent only when no help was opened. They are separate records.
- No score, level, percent, timer or proficiency label.
- The optional AI second look (`src/class/ai-feedback.js`, existing endpoint, on the learner's press) can only pick
  among next steps the rules already support for that text. The loop then records `feedbackSource: "ai"`.

## Using it in a view

```js
import { loopPanelHTML, onLoopClick, onLoopInput, startTextLoop } from "../intel/ui.js";

const id = startTextLoop(ctx, {
  src: "speak",
  task: { id, title, prompt, keyUse, domain },
  text,
  source,
  supports,
});
// keep `id` in the view's own saved state, then in render():
html`${loopPanelHTML(ctx, id, { compact: false, allowSpeech: true, onDone: (loop) => {} })}`;
// and first thing in the handlers:
if (onLoopClick(e, ctx)) return true;
if (onLoopInput(e, ctx)) return;
```

Panel state (drafts, opened help, the "what changed" step) is saved on the loop as `loop.panel`, so a reload resumes
at the same stage. A "try again" starts a new loop and the old one points to it (`panel.nextLoop`).

## The instructor's decision

A shared loop is the digest from `loopDigest(loop)` in the class review queue. The queue shows its labelled parts and
adds a decision (accept / replace / another attempt) and an optional next activity. The server shape is unchanged:
the decision is a prefix on the existing comment, `[LP replace next=/speak] comment`, with 220 characters left for
the words. On the learner's device `review/mine` is read into `loop.stages.review.teacher` (from the panel and from
My class), and `effectiveFeedback(loop)` returns the instructor's next step when they replaced the suggestion.

## Tests

`node --test tools/intel-engine.test.mjs` · `node tools/intel-e2e.mjs`
