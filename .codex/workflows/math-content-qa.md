# Math Content QA

Trigger words/use cases: math content, Grade 6 math, Reveal Math, MCAP, equations, ratios, geometry, statistics, answer key.

Required inspection steps:
- Read the student-facing task, supporting data/config, and any answer logic.
- Check standards/skill alignment, vocabulary, units, examples, and misconceptions.
- Look for answer-key leakage in student HTML/JS/data files.

Implementation rules:
- Prioritize mathematical accuracy and student comprehension.
- Add sentence frames or explain-your-thinking prompts when useful.
- Keep hints supportive without revealing answers immediately.

Verification commands:
- `npm run validate`
- `scripts/codex/codex-verify.sh`
- Manual content check documented in final response.

Final response format:
- Changed
- Verified
- Content Notes
