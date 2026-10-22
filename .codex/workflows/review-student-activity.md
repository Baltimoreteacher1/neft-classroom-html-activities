# Review Student Activity

Trigger words/use cases: review activity, QA student page, check classroom readiness, accessibility review, content review.

Required inspection steps:
- Open the activity HTML/CSS/JS and any shared engine components it uses.
- Inspect route links from root/category hubs.
- Check student path, teacher-only content, answer-key exposure, save/export behavior, and local assets.

Implementation rules:
- Prioritize correctness, navigation, accessibility, privacy, and classroom clarity.
- Use exact file references and reproducible steps.
- Separate content findings from UI findings.

Verification commands:
- Run the relevant activity check, then `scripts/codex/codex-verify.sh` once when fixes were made. An immediately following guarded `ship` runs the pre-push gate on the assembled commit.

Final response format:
- Findings first if reviewing only.
- Changed / Verified / Notes if fixes were made.
