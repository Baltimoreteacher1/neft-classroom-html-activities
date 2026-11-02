# ACCESS Practice Lab: publisher reference audit

Audit date: 2026-11-01
Scope: public pages available without an authenticated publisher account. This is a feature audit, not a claim of publisher partnership or licensed content.

## Permission and asset status

No permission agreement, publisher-supplied asset package, or license record for Magic Tale/Boldium or TCI was present in the local project files searched for this change. The user reports publisher permission, but its scope and terms could not be independently verified. No proprietary text, artwork, character, video, audio, or interaction implementation was copied. The Lab's stories, passages, diagrams, prompts, and visual assets remain original. Premium and account-gated material is marked inaccessible below.

## Public source inventory

| Source | Publicly inspectable material | Limits |
|---|---|---|
| [Magic Tale](https://magictale.net/) | Public landing page and its “How it works” description: interest hints, personalized story creation, independent or read-aloud reading, and reader choices during the story. | The create flow and any generated stories/assets were not accessible from the public landing page in this audit. No full sample library was available to inventory. |
| [TCI Try TCI](https://www.teachtci.com/try-tci/) | Public Sample Hub describes filters for program, grade band, and experience type; its current listing reports 46 results. Public descriptions cover lesson experiences and interactions. | Result pages with “Try it” links route to `subscriptions.teachtci.com`; account-gated interactions and embedded media could not be inspected. |
| [TCI Learning Interactions](https://www.teachtci.com/learning-interactions/) | Public inventory describes illustrated maps, 3D model manipulation, museum exploration, topographic maps, navigation clues, travel journals, drone/map exploration, primary-source listening, photo logs, geocaching, podcasts, animated historical scenes, economic reasoning, persuasive media, 360-degree images, and immersive site images. | These are descriptions of publisher activities, not permission to reuse their assets or content. The examples themselves were not all open for interaction. |

## Source-to-feature mapping

| Publicly described reference pattern | ACCESS Practice Lab integration | Status and evidence |
|---|---|---|
| Personal interests shape a story | Original Neighborhood Notes story episodes offer distinct school/community situations and differentiated text for Grades 3–5 and 6–8. | Implemented: `access-practice-lab/src/views/stories.js`; entry point from the Lab home and Language Worlds navigation. Stories are curated, not AI-generated. |
| Student decisions affect a story task | Episodes move through listening, reading, source-based decision, transfer, and student explanation. | Implemented: deterministic choices, explanatory feedback, retry, transfer writing, self-check, and local save in `stories.js`. |
| Narration and student-controlled pacing | Browser speech playback, transcript, replay, and explicit continue controls are provided. | Implemented with browser speech synthesis; speech availability/voice varies by device. Transcript is the equivalent access path. |
| Travel journal and geographic exploration | Four original Language Worlds and academic missions use contextual sources and decisions; separate field-trip companions connect to the Lab. | Implemented in Lab's `worlds` and `missions` routes and `/access-expedition/`. No TCI map or travel-journal assets are reused. |
| Maps, illustrated source analysis, and evidence | Reading, detective, evidence, world mission, and new Reading Ladder/Puzzle Den engines combine source reading, clues, categorization, and explanation. | Implemented in existing source activities; Reading Ladder and Puzzle Den are included in this branch with original authored content. |
| 360° / 3D / drone exploration | No verified 360 panorama, manipulable 3D model, or drone video is present in this change. | Gap. Do not represent static original diagrams or field-trip text as 360/3D media. |
| Historical role-play, photojournalism, and multimedia investigations | Academic missions and original speaking/writing activities support role-based response and evidence-based production. | Partial. A complete media-rich photojournalism or historical-role-play engine is not established by this audit. |
| Inquiry science | Original content includes investigation and explanation patterns; this branch's Puzzle Den and Reading Ladder provide additional reusable practice. | Partial. No full simulation lab with manipulated experimental variables is claimed here. |
| Cross-domain language production and feedback | Existing Lab uses all four domains, grade bands, Starting/Growing/Expanding supports, WIDA Key Language Uses, local progress, and revision-oriented feedback. | Implemented in the platform; new games remain original practice and do not estimate official WIDA scores. |

## Implementation priorities

1. Preserve and surface the integrated stories, Language Worlds, and academic missions as the main immersive experience.
2. Extend the activity library with distinct practice engines that require students to read/listen, decide, explain, and transfer; Reading Ladder and Puzzle Den add two such engines in this branch.
3. Add media-rich original maps, source sets, and investigations only when they include usable low-bandwidth and accessible alternatives.
4. Treat 360/3D/video and publisher-owned samples as gaps until supplied assets and license scope are documented.

## Verification boundary

This inventory covers public descriptions and links found on the three named public pages, not every publisher account experience, premium resource, internal state, or underlying asset. The 46-result TCI count is the result count displayed by its public sample hub at audit time; it does not mean 46 activities were opened and tested. Student data remains local in the Lab's existing storage contracts. This document records reference-derived patterns only and makes no WIDA assessment equivalence claim.
