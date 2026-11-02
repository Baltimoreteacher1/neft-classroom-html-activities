# One standard code per lesson

**Rule.** Every family-facing surface prints the lesson's `standard` from `lessons/<id>/config.json`, verbatim, and no other
standard code. Code: `scripts/lib/lesson-identity.mjs` (`lessonStandard(id)`). Gate: `npm run validate:family-standards`.

## Two taxonomies, one of them is not for families

| Taxonomy                                      | Looks like                                                  | Where it lives                                                                           | Used for                                     |
| --------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| Site / 2025 Maryland revision                 | `6.AT.4`, `6.AT.3c`, `6.NOS.3`, `6.GR.2`, `6.DS.4`, `MPP.3` | `lessons/<id>/config.json` `standard`; `data/ccss-standards.json` (keys)                 | **Everything a family or student sees**      |
| CCSS-style codes (publisher, district pacing) | `6.RP.A.3c`, `6.EE.B.5`, `6.SP.B.5c`, `6.NS.C.6c`           | `curriculum/district_scope_sequence_crosswalk.json`, the publisher homework `.docx` text | District pacing and the crosswalk tools only |

Lesson 4-5 is the example: the page, the family guide and the hub print `6.AT.4`; the publisher homework file and its PDF printed
`Maryland Standard 6.RP.A.3c`. A family comparing the two had no way to know they were the same expectation.

## Mapping (old publisher code -> config code, as found in the files)

The mapping is not stored anywhere new: the config is the single source, and the publisher text is overwritten from it, so there
is no second table to keep in sync. For reference, what the 185 publisher homework files carried versus what config says:

| Publisher (CCSS-style)                              | Config                                     | Example lesson      |
| --------------------------------------------------- | ------------------------------------------ | ------------------- |
| `6.RP.A.1`                                          | `6.AT.1`                                   | 3-1                 |
| `6.RP.A.3a`                                         | `6.AT.3a`                                  | 3-3                 |
| `6.RP.A.3b`                                         | `6.AT.3`                                   | 3-5                 |
| `6.RP.A.3c`                                         | `6.AT.4` (4-1, 4-5)                        | 4-5                 |
| `6.RP.A.3d`                                         | `6.AT.3c`                                  | 3-6                 |
| `6.EE.A.1` / `6.EE.A.2a`                            | `6.AT.5` / `6.AT.6a`                       | 6-3, 6-5            |
| `6.EE.B.5`                                          | `6.AT.8`                                   | 8-1                 |
| `6.EE.C.9`                                          | `6.AT.11`                                  | 9-1                 |
| `6.NS.A.1` / `6.NS.B.3`                             | `6.NOS.1` / `6.NOS.3`                      | 6-1, 2-7            |
| `6.NS.C.5` / `6.NS.C.6c` / `6.NS.C.7a`              | `6.NOS.5` / `6.NOS.6` / `6.NOS.8`          | 7-1, 7-2, 7-4       |
| `6.G.A.1`                                           | `6.GR.1`                                   | 5-1                 |
| `6.SP.A.1` / `6.SP.B.4` / `6.SP.B.5c` / `6.SP.B.5d` | `6.DS.1` / `6.DS.5` / `6.DS.4` / `6.DS.6d` | 2-1, 2-2, 2-3, 2-10 |

This table is documentation only. Where two lessons share a publisher code the config may differ (4-1 and 4-5 both read
`6.RP.A.3c`), which is one more reason not to translate by table.

## What changed

- `scripts/remediate-homework-docx.mjs` now writes `lessonStandard(id)` into the `Maryland Standard <code>` line of the
  publisher homework files (185 files, idempotent); `scripts/generate-homework-pdf.mjs` regenerates the homework PDFs from them.
  The label ("Maryland Standard") is the publisher's and is unchanged.
- `tools/build-curriculum-manifest.mjs` no longer overrides the standard for 3-6 and 3-7 (it printed `6.AT.3` against config's
  `6.AT.3c`). The curriculum manifest, the launch manifest, `src/data/family-lessons.json` and `families/lessons/*` follow.
- The family guide (`scripts/generate-lesson-support-pages.mjs`), the homework page, and the new Family Take-Home Sheet (PDF,
  Word, web "Print this plan") all read the same function.

## Naming

Ids stay `4-5` and `4-5-part2` (folders, URLs, storage keys). Print says **Lesson 4.5** and, for a second or third session,
**Lesson 4.5 · Session 2** (Spanish **Lección 4.5 · Sesión 2**): `lessonLabel(id, lang)` in the same module. Unit practice and
review pages have their own names there (`1-practice`, `1-review`, `6-1-6-2-practice`). Not yet normalized: the older publisher
homework files still print "Lesson 4-5 · Session 1" and the web page "Lesson 4-5"; the Family Take-Home Sheet is the first
surface on the print naming, and the page hero (workstream H) should adopt `lessonLabel`.

## Changing a lesson's standard

Edit `config.json` `standard` (it must exist in `data/ccss-standards.json`: `npm run validate:ccss`), then regenerate:

```bash
node tools/build-curriculum-manifest.mjs
npm run generate-curriculum-launch-manifest && node scripts/generate-family-pages.mjs
node scripts/remediate-homework-docx.mjs && node scripts/generate-homework-pdf.mjs
node scripts/generate-family-takehome.mjs && node scripts/generate-homework-html.mjs
node scripts/generate-lesson-support-pages.mjs
npm run validate:family-standards
```
