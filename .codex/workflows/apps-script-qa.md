# Apps Script QA

Trigger words/use cases: Apps Script, Google Forms, Google Sheets, Google Docs, Google Slides, Drive automation, `.gs` files.

Required inspection steps:
- Confirm the task belongs to `tools/google-apps-script/` or another Apps Script path.
- Read the local `.gs` files, README/setup docs, JSON/CSV data, and any deployment scripts.
- Verify the intended Google Workspace service: Forms, Sheets, Docs, Slides, Drive, Gmail, or Calendar.

Implementation rules:
- Use valid Apps Script APIs only.
- Batch reads/writes where possible; avoid per-cell loops for Sheets.
- Never print secrets, OAuth tokens, private IDs, or production data.
- Include clear run instructions and a self-test/validation helper when useful.
- Do not deploy, create triggers, or change permissions without explicit approval.

Verification commands:
- Run documented local validation scripts if present.
- If no script exists, perform static review of Apps Script API names, data paths, and setup instructions.

Final response format:
- Changed
- Verified
- Apps Script Notes / Risks
