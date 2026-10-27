# Copy change log

Every edit `scripts/fix-copy-config.mjs --write` makes to a lesson config, in the order made. Fields are English prose only; no answer key, `choices` option, `correctIndex` or digit was changed. Notation (minus, times, divide, no-break spaces, thousands commas) is typeset at render time by `engine/core/math-typography.js` and is not edited in lesson data.

## Run 2026-10-27

| File | Field | Rule | Before | After |
|---|---|---|---|---|
| lessons/3-4/config.json | `printables[0].desc` | term-variant | Students complete ratio tables, plot the points, and interpret what each coordinate pair means. | Students complete ratio tables, plot the points, and interpret what each ordered pair means. |
| lessons/4-4/config.json | `launch.narrative` | multiple-exclamations | It's Discount Day at the arcade! Different games are offering percent-off deals on ticket prices. The claw machine is 25% off its usual 60-ticket price, and the racing game is 40% off 80 tickets. You need to calculate the discounts to figure out how many tickets each game actually costs! | It's Discount Day at the arcade. Different games are offering percent-off deals on ticket prices. The claw machine is 25% off its usual 60-ticket price, and the racing game is 40% off 80 tickets. You need to calculate the discounts to figure out how many tickets each game actually costs! |
| lessons/6-2/config.json | `practice.optional[3].hints[2]` | term-variant | That gives (7/8) × (4/1) = 28/8. Reduce that fraction to lowest terms. | That gives (7/8) × (4/1) = 28/8. Reduce that fraction to simplest form. |
| lessons/7-5/config.json | `turnAndTalk[2].question` | term-variant | How is reading a coordinate pair like reading directions on a map or in a video game? | How is reading an ordered pair like reading directions on a map or in a video game? |
| lessons/7-5/config.json | `practice.extending[1].hint` | term-variant | Compare what each coordinate pair tells you about horizontal and vertical moves. | Compare what each ordered pair tells you about horizontal and vertical moves. |
| lessons/7-7/config.json | `vocabulary[0].examples[0].why` | term-variant | It is a corner, and a coordinate pair names it. | It is a corner, and an ordered pair names it. |
