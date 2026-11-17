# Connected Pathways (System E, Connected Learning Engine)

One language objective carried through features that already exist. Contracts: `docs/part2-integration-map.md`.
Routes: `/pathways` (hub), `/pathways/<id>` (runner), `/pathways/c?o=…&s=…` (a teacher's custom pathway),
`/pathways/build` (the builder, a labelled "For teachers" mode).

## Modules (`src/pathways/`)

| File | What it is |
| --- | --- |
| `graph.js`, `refs.js`, `objectives-*.js` | The skill graph: 8 objectives (stable slugs, first is `explain-with-evidence`) linked to a Key Language Use (`src/lang/klu.js`), WIDA framework entries read from `src/acc/wida/catalog.js` (never re-listed), the three language dimensions, real activities, supports, evidence sources, needs and transfer tasks. `validateGraph` proves every reference exists. |
| `pathways.js` | Built-in pathways (4), the custom-pathway URL (encode, decode with full validation), the one class assignment. |
| `progress.js` | Key `accessPracticeLab:v1:pathways`. Holds context only; completion is derived from each feature's own record. |
| `recommend.js` | The next activity for the same objective, with the evidence that led to it. |
| `builder.js`, `build-controller.js`, `ui-build.js` | The builder: pure draft operations, its events, its markup. |
| `banner.js` | `pathwayBannerHTML(ctx)`: "Step 3 of 6 · Goal · Back to my pathway" for any view opened with `?pw=&st=`. |
| `family-card.js` | The optional family conversation (3 prompts, EN + ES, printable); also on the Family hub. |
| `ui.js` | Hub and runner markup. View: `src/views/pathways.js`. Styles: `pathways.css` (`pw-`). |

## Rules this system keeps

1. **A step is done only when its own feature saved the work after the pathway was started.** ACCESS item: the
   activity record, answered correctly. Speaking/Writing Studio: a ledger entry for that task (or a loop). Simulation:
   the save under `accessPracticeLab:v1:sim` with an outcome. Book Studio: a book created by the hand-off
   (`source.kind = "pathway"`) and saved again by the learner (rev 2 or more). Transfer: a loop with `src: "pathway"`
   and this objective. Family: the family's own tick. Opening a link completes nothing; earlier work is named as
   "before you started" and does not count.
2. **Independent and supported stay apart.** Any help opened makes that work "with help". A revision is supported.
3. **Recommendations never leave the objective** and always state their counts. Under three relevant pieces of
   work the answer is "not enough evidence yet" plus the pathway's next step. A teacher's assigned pathway decides
   the objective; a teacher can reject a suggestion rule for a pathway.
4. No level, score, timer, points or ranking. Framework entries are references, not results.
5. Nothing leaves the device except "Share my pathway evidence with my teacher" (the existing review queue).

## Custom pathway URL

`/pathways/c?o=<objective>&s=<key.key…>&t=<Title_with_underscores>&h=<help letters>&x=<rejected needs>&n=<follow-up>`

Stage keys: `r<id>` ACCESS item, `s<id>` Speaking Studio task, `w<id>` Writing Studio task, `m` the simulation,
`b` the goal's book, `d<id>` a sitemap destination, `t` transfer, `f` family. An upper-case first letter marks a
step optional. Steps are separated by `.` (a comma is not allowed in an assignment path). Unknown keys are dropped
and listed on the page. The whole path must fit the class server's 200-character limit; the builder shows the
length and refuses to assign past it. An unchanged built-in pathway is assigned by its own short route.

## Teachers

- **Build and assign:** `/pathways/build` → goal → steps (Up / Down / Optional / Remove) → add resources → helps,
  accept or reject suggestions, follow-up → preview → copy the link, or "Assign to <class>" when a class is open on
  this device (it appends ONE `{ id: "pw:…", title, path, due }` through the existing class settings API).
- **Review:** students press "Share my pathway evidence with my teacher". One packet labelled `Pathway: <title>`
  arrives in the class review queue (Class teacher view → shared work): each step, the date, on their own or with
  which helps, and their own words.

## Tests

`node --test tools/pathways.test.mjs` (graph validity, objective persistence, completion from seeded state,
recommendations, URL round trip, assignment rules) and `node tools/pathways-e2e.mjs` (real browser; the header of
that file lists what is driven and what is seeded).

## Limits

- Speaking Studio tasks exist for grades 6-8 only, so grades 3-5 pathways use an ACCESS Speaking activity there.
- The banner is wired into ACCESS activities. Speaking Studio, Writing Studio, Book Studio and the simulation show
  it once their owners add `pathwayBannerHTML(ctx)`.
- The site's QR helper holds 106 bytes: built-in pathway links get a QR code, long custom links do not.
- Spanish is machine-assisted and not reviewed by a human translator.
