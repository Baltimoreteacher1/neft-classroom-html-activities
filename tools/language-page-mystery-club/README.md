# Language Page Graphic Novel Studio

This is the editable, no-build source for an accessible, browser-local graphic novel reader. It is mounted at `/language-adventures/mystery-club/` in the Language Adventures export by `tools/sync-static-apps.mjs`. The original adventure app's Next.js source checkout is separate and is not present in this workspace; the maintained overlay keeps its generated output durable without patching its compiled `_next` bundles.

Open `index.html` directly or through the site. Stories, interaction definitions, support pathways, and teacher notes are maintained in `stories.js`; the reusable player is in `engine.js`. Student launch links accept `story`, `cluster` (`2-3`, `4-5`, `6-8`), `pathway` (`guided`, `developing`, `independent`), and `domain` query parameters.

Progress, notebook clues, pathway preferences, ACCESS practice drafts, and student reflections remain in this browser's local storage. No student response is sent to a server. Speaking tasks can be completed without a microphone; recording is optional and remains in page memory for playback.

## WIDA planning

Teacher-facing activity notes use the 2020 Framework's Language Expectation reference pattern, the story Key Language Use, the selected grade cluster, interpretive mode for listening/reading, and expressive mode for speaking/writing. Grade 3 maps to 2–3; Grade 4–5 and 6–8 each have separate references. Science explanations in the sound and garden cases use the ELD-SC prefix; story and source-analysis activities use ELD-LA. These are planning references, not WIDA-approved curriculum or a proficiency score. Use the official [WIDA ELD Standards Framework](https://wida.wisc.edu/resources/wida-english-language-development-standards-framework-2020-edition) for the full Language Expectations and grade-cluster Proficiency Level Descriptors (PLDs). The three reader pathways are adjustable classroom supports, not PLDs.

## Lantern clue matrix

| Chapter | Established clue | Supports | Does not establish by itself |
| --- | --- | --- | --- |
| 1 · The Disappearance | The case is locked and unbroken; felt is warm; softened wax is at the plinth; catalog note names the lower east shelf; corridor recording captures a cart wheel and metal click at 5:52. | A narrow set of observations and leads; students must separate them from assumptions. | Who moved the lantern or where it went. |
| 2 · Conflicting Accounts | A 5:50 image shows the lantern; a 6:00 image shows an empty plinth and the wall clock runs two minutes fast; Vale recalls locking at 5:47; Imani logs a 5:56 door chime while the case alarm stays quiet; Ren reports a lamp glow, not an identified lantern. | An approximate time window and a real discrepancy about room access; accounts retain source and clock limitations. | A precise removal time, a case opening, or the identity of the lamp Ren saw. |
| 3 · The Investigation | Wheel mark turns toward conservation and not the public exit; 5:54 ticket records a brass base and separate shade for a safety check; photo shows catalog serial B-14; wrap and wax sample match conservation materials. | A corroborated identity, route, purpose, and alternative explanation for the wax. Either first investigative path adds partial evidence without changing the case facts. | Who placed the first wax crescent or an exact second when the lantern left. |
| 4 · The Final Explanation | The ticket, matching B-14, wrapped shade, route, quiet case alarm, and adjusted photo timeline agree. | Staff moved the lantern to conservation for a safety check; students justify that claim with several sources and retain the unresolved details above. | Intent to steal, an exact removal second, or who first placed wax. |

## Verification

`node validate.mjs` checks story counts, substantive scenes, speaker references, interaction coverage, branch outcomes, timelines, WIDA Key Language Uses, and ACCESS domain/cluster availability. `node verify-browser.mjs` exercises all story activities in Chromium, local resume, feedback/revision, teacher links, microphone denial, ACCESS retries, and desktop/mobile layouts. The browser script writes review screenshots to the host repository's ignored `.qa-logs/` directory.

## Artwork and integration limits

Scene illustrations are original hand-authored SVG compositions rendered from shared room and character parts. They are locally generated vector art, not commissioned or AI-generated publisher artwork. Existing Lantern URLs and progress remain intact. The export overlay repoints the existing elementary Mystery Files home launch to the new mascot case and the featured Lantern launch to chapter 1; direct legacy URLs continue to load their original pages. The new studio uses its own storage key and does not silently migrate or overwrite older saved work. Changes to the original app's page composition still require its separate Next.js source checkout. Do not patch compiled `_next` bundles.

After updating the Language Adventures static export, run `node tools/sync-static-apps.mjs --app language-adventures=<checkout>` to copy its latest output and overlay the story studio, then `node tools/sync-static-apps.mjs --check` to validate the mount and navigation links. If the Next.js source checkout is unavailable, `node tools/sync-static-apps.mjs --overlay-only` re-applies the maintained overlay to the existing export.

The overlay appends a deferred `entry-link.js` loader to exported pages. It waits for the hydrated Next.js navigation before adding the Mystery Club link, so React hydration does not discard it. The public mount contains only the four reader files and this small navigation helper.
