# Interactive learning integration map

This is a working map, not a claim that the full program has been implemented or verified. The production baseline inspected is `a3ddb244f2`. Both domains use this repository and its existing host routing; they are not separate applications to deploy independently.

| Innovation and instructional target | Existing destination and decision | Architecture and journey to preserve | Verification and status |
| --- | --- | --- | --- |
| Exponent machine: repeated factors and powers | Enhance Power Plant, lessons 6-3 and 6-4 | Learning Lab shell and lesson links; machine state is stored locally alongside the existing progress bridge | Model test and sampled mobile interaction passed. Machine state is separate from the lab save; Spanish and full accessibility testing remain |
| Equivalent-ratio answer validation | Enhance Recipe Remix's Unit 3 challenge | Existing lab shell and progress; preserve the order of the quantities | Lab tests cover equivalent ratios, reversed order and zero denominators. Ratio Railway itself has not been upgraded in this work |
| Expressions and operation structure | Extend Expression Remix, lessons 6-5 and 6-6 | Existing lab content and model; preserve lesson ordering | Not yet implemented as the requested Expression Factory |
| Student mathematical artifacts | Extend `curriculum/projects/studio/` | Existing models, history, validation, and local persistence; no new public sharing | Checkpoint comparison and explanation revision, plus a selectable expression test input, were added and sampled in Unit 6-A. The full four-template requirement remains incomplete |
| Language changes the environment | Extend ACCESS Journey and its existing mission content | Existing grade bands, language supports, ledger, local state and return navigation | Grade 3–5 Mission 1 now distinguishes ambiguous and specific instructions. Four Language Forest chapters are not implemented |
| Language missions | Extend existing ACCESS Journey, worlds, city, scenarios and newsroom | Existing authored engines, grade bands and support-aware evidence; no external student data service | Mission 12 has evidence-specific revision feedback for both bands. Existing experiences require a detailed audit against all four requested worlds |
| Language creator | Extend existing writing and storytelling pathways | Existing authoring and local save where supported; no public gallery | Destination and full capabilities still require audit and implementation |
| Playable explanations | Extend existing Learning Labs and generated Practice Studio source | Preserve lesson identifiers and generated-source workflow; do not edit generated output alone | Broader practice, family, small-group and language rollout remains incomplete |
| Delivery, power distribution and district construction | Map each to lessons by mathematical objective, not visual theme | Reuse a suitable lab and its bridge only after content and model review | Not implemented; Delivery Dispatch currently teaches division, not necessarily rates |

## Existing contracts and constraints

- Learning Labs use `curriculum/learning-labs/shared/app.mjs`, versioned content JSON, local state and `ewl-bridge.mjs`. Preserve existing URLs and stage behavior.
- Practice Studio pages are generated. Their data and generator are the authoritative source.
- ACCESS routes are lazy loaded and use the existing language ledger and origin-specific local storage. Preserve band and support distinctions.
- Project Studio already has mathematical models, state, history and feedback. Avoid a second editor or progress store.
- Student work remains local unless an existing authorized submission mechanism supports it. No new analytics or public sharing is implied by this map.

## Reference research limits

The public descriptions of Earth: A Primer, The Evolution of Trust, Tablecraft, Dreams, Lost Words, Influent and The Pudding informed the principles of manipulation, prediction, consequence and creation. The interactive products were not directly played during this review. The Language Page could not be accessed by the web reader, but Playwright reached its home route. Playwright also reached the live Ratio Railway mission screen; this was not a full interaction or accessibility audit. The computer-use browser host was unavailable.

## Remaining program gates

The requested audit of every activity and the five complete systems are not finished. Before any production release, complete the remaining integration work, independently verify mathematical and language content, exercise affected journeys on desktop and mobile including keyboard and reduced motion, and run the repository's required gates. Do not treat this document as evidence of those checks.
