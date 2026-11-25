# Content review workflow, provenance badges and release trains

Prompt 3 section 3.4. Gates: G-26 (provenance and hash invalidation), G-37 (review log), rollback drill.

Content blocks are schema v2 blocks (`shared/content-schema/v2.mjs`) produced on the fly by migrating what
`loadStudio` and `loadLessons` return. Nothing about a block's content is stored by this feature. D1 holds only
who reviewed which hash, and which set of hashes shipped as a release. There is no student data in any of it.

## Review

- Five checks per block: pedagogy, language, accessibility, bias and sensitivity, and (math and science only)
  accuracy; plus one per translation language a block carries. The state machine is the schema's:
  `draft -> in_review -> reviewed | needs_changes`, `reviewed -> in_review`, `retired` terminal.
- **Human only.** A decision carries `reviewer: { name, role, actor: "human" }`. The API refuses a missing actor
  (400), a model or bot actor (403) and a reviewer name that names a model or tool (403). The database refuses it
  again: `review_event.actor` has `CHECK (actor = 'human')`. This is an attestation by the person holding the
  teacher key; it cannot prove who is typing, and the log records the name they gave.
- **The server owns the hash.** The server loads the block itself, recomputes `contentHash(content)` and binds the
  decision to it. The request body is allow-listed: a `contentHash`, date or any other extra field is a 400. The
  reviewer date is today's date on the server.
- **Hash invalidation.** `effectiveState` (schema) reads a `reviewed` dimension whose `reviewedHash` differs from
  the block's current hash as `in_review`. Edit a lesson in a deploy and its approval lapses by itself.
- `needs_changes` and `retired` need a comment. Comments (500 characters) pass `rejectIfPII` (422 on a name,
  contact detail or personal circumstance). Reviewer names are adult staff, not students.

### Bulk approval

`POST /api/review/bulk` moves up to 100 items in one transaction. Moving to `in_review` needs nothing extra.
**Approving more than 10 items needs a confirmed random sample of 3:**

1. `POST /api/review/bulk/sample { items, reviewer }` returns `{ token, sample: [3 items] }`. The server picks the
   3 (CSPRNG; tests inject the seeded PRNG) and signs the token over the item set, the sample, the reviewer name
   and a 30 minute expiry (HMAC keyed from the teacher key).
2. The reviewer opens each sampled item and approves it on its own (`/api/review/decide`).
3. `POST /api/review/bulk` with `sample: { token, reviewed: [the 3 keys] }`. The server verifies the token, that
   the echoed keys are exactly the sample, and that the log holds an individual (non-bulk) decision for each, by the
   same reviewer, for the current hash, made after the token was issued. A sampled item sent back for changes
   blocks the bulk (409). Items already in the target state are skipped.

## Log

`review_event` is append-only (triggers refuse UPDATE and DELETE) and hash-chained: each row's `digest` covers its
fields and the previous digest; `prior_digest` is UNIQUE so two writers cannot fork the chain (the loser retries).
`snapshot_json` keeps the content at decision time for the side-by-side diff. `review_state` is the projection the
API overlays on the migrated defaults; replaying the log reproduces it.

- `GET /api/review/log.csv` exports the log (no snapshots). Columns are fixed, one header, LF rows, RFC 4180
  quoting, `created_at` ISO. Cells in free-text columns that a spreadsheet would run as a formula get a leading
  apostrophe. `tools/review-api.test.mjs` proves the CSV equals the table.
- `GET /api/review/verify` recomputes every digest and chain link (and reports an edit made outside the API).

## API (all under the teacher gate: `x-teacher-key` = `TEACHER_KEY`, as the class API)

| Route | Purpose |
| --- | --- |
| `GET /api/review/queue?grade&subject&unit&dimension&state&olderThanDays&verifier&limit&offset` | Blocks with effective state per check, age, verifier finding counts |
| `GET /api/review/block/:id` | Current content, last approved snapshot, recent decisions |
| `POST /api/review/decide` | One decision |
| `POST /api/review/bulk/sample`, `POST /api/review/bulk` | Bulk, with the sample check |
| `GET /api/review/log.csv`, `GET /api/review/log.json`, `GET /api/review/verify` | Export (CSV or JSON, same columns and rows), chain check |
| `GET/POST /api/review/releases`, `GET /api/review/releases/current`, `/releases/:id`, `POST /releases/rollback` | Release trains |
| `GET /api/review/summary[?unit=]` | **Open read** (no key): badge states and counts only, cached 60 s |

Age is whole days since the block's last review activity; a block never touched has no age and counts as older
than any `olderThanDays`. Verifier counts come from `shared/content-schema/review-verifier-counts.js`
(`{ verifier: { blockId: n } }`); it is empty until verifier baselines publish per-block counts into it.
Rate limits and body caps use `handler()` options (60 per minute per client, 300 per address; 4 KB for a
decision, 32 KB for bulk).

## Release trains

`POST /api/review/releases { reviewer, verifiersRan }` snapshots every block's content hash into
`content_release.manifest_json` (canonical JSON), computes the changelog (added, removed, changed ids) against the
current release, names it `content-YYYY.M.N`, and moves `release_pointer` to it in one transaction. Rows are
immutable (only `status` may change) and never deleted. `POST /api/review/releases/rollback` moves the pointer to
the current release's `previous_id` in one step and marks the replaced release `rolled_back`; the earlier manifest
is returned byte for byte because it was never touched. A release cut after a rollback links to the release that
was current. `GET /releases/current?drift=1` counts live blocks added, removed or changed since the current release.
Cutting a release does not require every block to be reviewed: decision D19 keeps "Reviewed units only" off by
default, so a release records state, it does not gate on it.

## Review log as JSON

`GET /api/review/log.json[?afterSeq=&limit=]` returns `{ schema: "ewl-review-log/1", columns, generated_at, count,
next_after_seq, events[] }`. Each event has exactly the CSV's columns in the CSV's order (`created_at` ISO, `seq` a number,
no snapshots). `functions/_lib/review/log-json.js` holds the one schema both exports are checked against (gate G-35).

## Badges beyond the unit page (Phase 3)

Lesson cards in the Language Studio, vocabulary cards (and the printable set), the Quick Print Kit and the exports all
carry a provenance chip from `shared/bcpss-provenance.js`. The chip always renders from what the content says about
itself (`lessons[].review`, `source`); when `GET /api/review/summary?unit=` can be reached, `bcpss-teachers/provenance-live.js`
upgrades it to In review / Reviewed. The overlay only reads. Vocabulary carries its unit's state (it has no review record of
its own). Gates: G-31 (state integrity), G-32 (badges and claims), G-35 (log export schema).

## Studio

Unit cards (Find) and the unit page show Draft / In review / Reviewed from the summary. "Reviewed units only"
is a per-viewer toggle (localStorage `ewl_review_reviewed_only`, default off); if the summary cannot be loaded
nothing is hidden. The reviewer queue is `#/review` (block page `#/review/<id>`); it asks for the teacher key,
the reviewer's name and role, and a human attestation, and keeps the key in sessionStorage only.
The Studio's "Studio lessons" cards are a separate catalog from the schema-v2 lesson blocks, so they carry no
badge of their own; the unit badge's tooltip counts the parts reviewed.

## Run

```sh
npm run test:review
node tools/privacy-inventory.mjs --check
node tools/privacy-forbidden-scan.mjs
npx -y wrangler@3.114.9 pages functions build --outdir <scratch dir>
```

Apply the migration with `wrangler d1 migrations apply` (additive, idempotent). Until it is applied every gated
route answers 503 `review-migration-missing` and the badges stay hidden.
