# Editorial standards for scaffold content

1. **Purpose first.** Every support states in one plain sentence (12+ characters) what it is for and which WIDA can-do ids it serves. The schema rejects a support without both.
2. **Review states.** `draft` -> `native-reviewed` -> `wida-reviewed` -> `approved`. `legacy-unreviewed` marks content carried from before this layer existed. Machine-drafted text is flagged `machineDrafted: true` and can never be `approved` without a named `reviewedBy`.
3. **Students only see approved content in production.** Legacy content shows until the strict switch is flipped; teachers always see everything with a "Needs human review" label.
4. **Home languages.** Spanish is authored (as drafts). Arabic and Haitian Creole are not authored and nothing may pretend otherwise: a gloss in an unauthored language is hidden, not guessed.
5. **Words.** A key word has a student-friendly definition, an example sentence from the unit, and a gloss per available language. Pictures need `src`, `alt` and a license (original, CC0, public domain, licensed). No stock photos of children.
6. **Chunks.** The chunks must rebuild the sentence word for word. Each chunk has a role and the role is named in words.
7. **Frames.** Four steps exactly. Step 1 shows the whole frame; step 4 shows nothing. No frame states the answer.
8. **Audio.** Human recording preferred; speech synthesis is a flagged fallback. Target loudness -16 LUFS (tolerance 1.5). Recordings by a person need `recordedBy`.
9. **Reading level.** Student-facing instructions at about grade 5 or below, with vocabulary the unit teaches excepted.
10. **No purple, no timers, no scores.**
