# Free-text PII and never-collect screen

Source: `shared/privacy/pii.mjs`. Tests: `shared/privacy/pii.test.mjs` with corpora in `shared/privacy/fixtures/`.

## Contract

- `detectPII(text)` returns `{ found, kinds }`. `rejectIfPII(value, field)` returns `null` or a 422 JSON response naming the field and rule kinds. It never echoes, stores or logs the text.
- Call `rejectIfPII` before storing any free-text field. Today that is `teacher_note` in `POST /api/bcpss/plans`. Every new free-text field that can reach storage must call it and add an abuse test (`tools/abuse-endpoints.test.mjs`).
- Aliases `Star 1` to `Star 28` are removed before any rule runs and always pass.

## Rules

Direct identifiers: `name`, `email`, `phone`, `ssn`, `id`, `address`, `dob`.
Never-collect topics: `birthplace`, `nationality`, `immigration`, `disability`, `program`, `income`.

## Tradeoffs

- Strict on explicit phrasing ("I was born in", "my country", "visa", "IEP", "free lunch"). Blind to bare topic words: "Turkey", "China", "immigration", "citizen" pass, because units use them as ordinary vocabulary.
- First-person and he/she/they phrasing is covered. A named third party ("Lincoln was born in 1809") passes.
- Names: lead-in phrases ("my name is"), honorifics ("Mr. Neft"), "my friend <Name>", and a curated first-name list followed by a capitalised surname. A lone first name in running text is not detectable and will pass. Use the Star aliases.
- Program labels (ESOL, ELL, IEP, 504, SPED, FARMS) are flagged anywhere they appear, including by teachers.
- It is a heuristic net, not a guarantee. It does not replace not collecting the data.

## Gates G-32 / G-44

`pii.test.mjs` is the known-bad (every string must be flagged, with its expected kind) and known-good (every string must pass) gate. Negative control: removing any rule makes its bad fixtures pass, and every rule must have at least one bad fixture. To extend: add the phrase to the matching corpus first, watch the test fail, then change the rule.

## Not covered

`POST /api/bcpss/deconstruct` takes a teacher-pasted reading passage that is analysed and not stored, and `POST /api/bcpss/export/[unitId]` renders a student's own Writing Lab answers and stores nothing. Both are exempt on purpose: a passage may legitimately contain character names. If either starts storing text, add `rejectIfPII` first.
