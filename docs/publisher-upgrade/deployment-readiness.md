# Deployment readiness

Not deployed. This branch was not merged and was not pushed to `main`.

Rollback is: do not merge the branch. Production stays on the current `main` build until a human ships a reviewed commit with the repo’s deploy path.

## Post-deploy checks for a human

1. Open `/curriculum/` and confirm Teach today, Plan, Respond, and Resource library are present, and that Forge, the Living Map, Class Boss, pacing, SCORM, family links, and the command center still resolve.
2. Open `/curriculum/math-canvas/?scene=equivalent-ratios&lesson=3-3`. Change the copies control. Confirm the quantity model, tape, double number line, table, and statement stay on one ratio.
3. Open `/curriculum/almost-right-lab/#exponent-repair`. Submit 6 for `3^2` and confirm the repair says the answer may indicate a misunderstanding, then complete the fresh power. Submit 9 and confirm it is accepted.
4. Open `/lessons/6-4/` and `/lessons/6-4-part2/` and confirm they are still different lessons. Confirm the 6-4 target matches evaluating expressions at specific values.
5. Open `/lessons/3-3-group1/` in teacher mode and confirm the launch card is in the teacher view and the student stage names are unchanged.
6. Open `/lessons/6-4/homework.html?lang=es`, type an answer, switch language, and confirm the answer is still there. Confirm the page still describes the work as optional.
7. Open `/curriculum/projects/studio/?project=discovery` and confirm the stages read Plan, Build, Test, Revise, Explain.
8. Run `npm run qa:fast -- --push` or the CI Pre-Deploy Gate before any production ship.
9. After deploy, `npm run smoke:live -- --expect <sha>` against production.

Do not run `npm run deploy` or `wrangler pages deploy`.
