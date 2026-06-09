# CardForge Input Adapters

Adapters live in `../lib/adapters.mjs`. Each takes a source file and returns a
partial **lesson-analysis** object (`../schemas/lesson-analysis.schema.json`),
which `../lib/analyze.mjs` then enriches with conservative inference.

## Implemented (real parsing)

| Type       | Extensions         | Notes                                                                         |
| ---------- | ------------------ | ----------------------------------------------------------------------------- |
| `text`     | `.txt`             | Plain text; title from first non-empty line.                                  |
| `markdown` | `.md`, `.markdown` | Title from first `#`/`##`/`###` heading.                                      |
| `html`     | `.html`, `.htm`    | Tags/scripts/styles stripped, entities decoded.                               |
| `json`     | `.json`            | Reads EduWonderLab lesson `config.json` fields directly (highest confidence). |

## Scaffolded (honest "not yet supported")

`pptx`, `ppt`, `pdf`, `docx`, `doc`, `gslides` return `supported: false` with a
clear message and **invent no content**. To use one of these sources today,
export it to text/markdown/html (or paste its outline into a `.md`) and re-run,
or author the package directly via a `job.json`.

## Adding a new adapter

1. Add the extension(s) to `EXT_MAP` and the type to `IMPLEMENTED` in
   `lib/adapters.mjs`.
2. Implement parsing in `runAdapter()` that returns at least
   `{ sourceType, sourceFile, supported: true, title, rawText, confidence }`.
3. Update `cardforge.config.json` (`adapters.implemented`).
4. Test: `npm run cardforge:analyze -- path/to/source.ext`.

Only ever move a type from scaffolded → implemented once it genuinely parses.
