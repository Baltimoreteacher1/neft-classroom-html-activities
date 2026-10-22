# Accessibility Pass

Trigger words/use cases: accessibility, a11y, readable, Chromebook, mobile, student UI, contrast, keyboard.

Required inspection steps:
- Inspect HTML semantics, labels, heading order, focus styles, viewport behavior, and shared CSS.
- Check colors, font sizes, spacing, and responsive constraints.
- Use browser testing for meaningful UI changes when possible.

Implementation rules:
- Fix real barriers first: contrast, labels, focus, keyboard traps, clipping, tiny controls.
- Keep directions plain and visible.
- Preserve student progress and navigation.

Verification commands:
- Run the relevant accessibility check, then `scripts/codex/codex-verify.sh` once for local verification. An immediately following guarded `ship` runs the pre-push gate on the assembled commit.
- Browser console and responsive smoke test when UI changed.

Final response format:
- Changed
- Verified
- Accessibility Notes
