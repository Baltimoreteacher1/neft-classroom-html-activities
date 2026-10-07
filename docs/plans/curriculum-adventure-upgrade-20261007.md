# Curriculum game overhaul · 7 October 2026

Authorized scope: individually audit and substantially enhance curriculum games, preserve classroom contracts, commit and integrate reviewed changes into main using the guarded ship command, confirm production.

## Acceptance criteria
- Each playable title has a recorded inspection, game-specific implementation, and browser result.
- Actual gameplay gains purposeful missions/decisions/progression; cosmetic launcher changes alone do not satisfy this task.
- Correct math earns progression; misses teach, retries remain available, no countdown pressure.
- Keyboard/touch controls, reduced motion, responsive layout, local persistence, existing SCORM and routing remain functional.
- Required repository validation/build and an independent QA gate precede shipping. Production stamp and served game bytes must match the release.

## Work plan
1. Inventory direct curriculum/arcade/unit links, the game catalogue, and embedded learning-lab games.
2. Upgrade core cabinets (11), flagship games (11), Practice/Placement and eight review adventures in parallel through Game Pipeline delegation.
3. Upgrade learning-lab finales and remaining curriculum game families; reconcile inventory coverage before claiming completion.
4. Play through each title, inspect rendered worlds, verify responsive controls and persistence, repair failures.
5. Review precise diff, commit reviewed files, ship selected SHAs through ALLOW_DEPLOY=1 npm run ship, verify live.

## Ownership
- cabinet_adventures: math/games/u* and cabinet integration.
- flagship_adventures: math/unit-*/games and Ratio Kitchen integration.
- practice_expeditions: Practice Arcade, Placement Quest, unit review adventures.
- root: inventory, learning labs, remaining curriculum games, hub, integration/release.

## Release constraints
Working tree is isolated at `.Codex/worktrees/curriculum-adventure-upgrade` from origin/main 5e1daf0be4. No unrelated source changes are included. Existing installed dependencies are reused. Never use direct Wrangler upload or bypass the deploy gate.
