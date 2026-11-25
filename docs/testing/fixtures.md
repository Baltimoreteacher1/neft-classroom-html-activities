# Fixture library

`shared/fixtures/` builds deterministic synthetic classes and practice histories for tests. No real
data, no names: students are the aliases `Star 1` .. `Star 28`.

```js
import { fixtureClasses, getFixtureClass, getFixtureHistory, fixtureCorpus, validateFixture } from "../shared/fixtures/index.js";
const cls = getFixtureClass("fx-6-split");      // { id, name, grade, bandMix, teacherId, students: [{ id, name, band }] }
const attempts = getFixtureHistory(cls);        // [{ studentId, domain, nodeId, ts, correct, hintsUsed, durationSec }]
```

## API (stable; `FIXTURE_API_VERSION = 1`)

`fixtureClasses()`, `getFixtureClass(id)`, `getFixtureHistory(classOrId, { attemptsPerStudent = 40 })`,
`fixtureCorpus()`, `buildClass(spec)`, `buildHistory(cls, opts)`, `createRng(seed)`, `validateFixture(x)`,
`assertFixture(x)`, constants `GRADES`, `BANDS`, `DOMAINS`, `BAND_MIXES`, `CLASS_SPECS`, `HISTORY_START`,
`nodeIdsFor(domain, grade)`. Every call returns fresh objects, safe to mutate.

## Content

- 11 classes, grades K-8, sizes 12-28, four band mixes (`balanced`, `emerging_heavy`, `bridging_heavy`, `split`). Ids `fx-<grade>-<mix>`.
- `band` (`emerging|developing|expanding|bridging`) is a synthetic skill band that only drives history generation. Never show it to students.
- Histories: `domain` is `listening|speaking|reading|writing`; `nodeId` is a free string like `reading.g3.n07` (12 per domain per grade), so later waves map their own graph onto it. Timestamps start at `2026-09-08T13:00:00.000Z` and only move forward. Higher bands answer correctly more often.

## Determinism

Seed to uint32 by 32-bit FNV-1a over the UTF-8 bytes; stream is mulberry32 (full algorithm in the
header of `shared/fixtures/prng.js`). No `Date`, no `Math.random`. `npm run validate:fixtures-digest`
pins the whole corpus by sha256; changing the PRNG, specs or history model fails it until you run
`node tools/fixtures-digest.mjs --update` on purpose and check the consumers.

## Validator

`validateFixture` rejects: student names other than `Star 1..28`, duplicate aliases, any key naming a
personal or background attribute (email, phone, address, birth/country/citizenship/immigration, income,
disability/IEP/program, home language, notes/comment, and so on, matched by word), keys such as
`firstName`, strings that look like email, URL, phone or SSN, strings over 64 characters, and ids that
are not slugs. It is a minimal alias-shape check, independent of any other PII scanner. Tests:
`tools/fixtures-library.test.mjs` (includes the known-bad negative controls).
