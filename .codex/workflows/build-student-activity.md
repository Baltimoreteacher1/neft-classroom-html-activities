# Build Student Activity

Trigger words/use cases: new activity, student activity, classroom game, practice page, ESOL scaffold, math review, interactive HTML.

Required inspection steps:
- Read `AGENTS.md`, `README.md`, root/category `index.html`, shared assets, and the nearest similar activity.
- Confirm whether work belongs to standalone HTML, `engine/`, `lessons/`, generated curriculum, or teacher tools.
- Check route stability and Vite copy behavior before moving/renaming anything.

Implementation rules:
- Keep activity URLs stable.
- Use clear directions, large readable type, high contrast, and obvious navigation.
- Include WIDA/ESOL/TWR scaffolds when useful.
- Add real print/export/save only when needed; do not fake controls.
- Keep answer keys out of student-facing pages.

Verification commands:
- `npm run validate`
- `npm run build` when build output or deployable routes are affected.
- `scripts/codex/codex-verify.sh`

Final response format:
- Changed
- Verified
- Notes / Risks
