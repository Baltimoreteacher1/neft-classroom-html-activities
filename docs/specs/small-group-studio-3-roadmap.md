# Small-Group Studio 3.0 — Shipped Wave + Future Iterations

Status: wave shipped 2026-07-16 (labs + persistence + language lanes).
Scope: all 128 small-group lessons + 20 catch-ups (shared engine modules —
every upgrade lands everywhere with no regeneration).

## What shipped in this wave

| Feature                                                                                                                                                      | Module                      | Derived from (existing config)                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------- |
| Explore Lab — live manipulative (drag-sort, fill-table, number-line, coordinate-grid, balance-scale, bar-model) with lazy per-kind import + discourse reveal | `small-group-labs.js`       | `explore`                                                     |
| Number-line shape adapters (items+range, inequality boundaries, equal-jump form)                                                                             | `small-group-labs.js`       | `explore`                                                     |
| Model Lab — connect diagram (interactive factor-tree/manip or shared SVG figure) + keyword-gated interpretation                                              | `small-group-labs.js`       | `connect`                                                     |
| Apply Lab — Polya workbench (tap the numbers → plan → solve → compare + self-assess)                                                                         | `small-group-labs.js`       | `revealWordProblem`                                           |
| Shared SVG figure builders (single source of truth with the 5-phase renderer)                                                                                | `visual-figures.js`         | —                                                             |
| Per-choice targeted feedback on multiple choice                                                                                                              | `small-group-practice.js`   | `practice[].choiceFeedback`                                   |
| Auto-opening step guide after 2 misses on a fill-in                                                                                                          | `small-group-practice.js`   | `explanation`                                                 |
| Vocabulary language lanes EN/ES/VI/AR (RTL-aware), ES read-aloud, example chips, bonus cloze round                                                           | `small-group-engagement.js` | `vocabulary[].term/definition{Es,Vi,Ar}`, `cloze`, `examples` |
| Mission visual from `launch.visual` (incl. data-chips) when no image                                                                                         | `small-group-engagement.js` | `launch.visual`                                               |
| Device-local studio persistence (`nt-sg:<lessonId>`): pulses, solved items, phase marks, language lane; welcome-back strip + Start fresh                     | `small-group-state.js`      | —                                                             |
| Data-driven progress rail (sections present decide the steps; headings renumber automatically)                                                               | `small-group-renderer.js`   | —                                                             |

Directive honored: **no notice/wonder anywhere in small-group lessons** (Joel,
2026-07-16). The mission uses `noticeAndWonder.context` as narrative only.

## Future iterations (ranked)

1. **Teacher evidence sync** — pipe the studio `state` (attempts, hints,
   pulses, proof path) into NTSignal/D1 so the Facilitation Console can show a
   cross-device class view during rotations. All hooks already exist in
   `events`/`store`; needs an opt-in POST + teacher dashboard card.
2. **Adaptive practice ladder** — use `chooseAdaptivePath` output to reorder
   or swap `practice.extending` items in when a Group 2 session is clean, and
   auto-scaffold (`scaffold=true`) every item after repeated misses.
3. **Voice recording for Talk** — MediaRecorder "record our best explanation"
   (device-local playback only) in the Talk + Model sections; ties to the
   reciprocal-questioning work in the discussion pop-ups layer.
4. **AR/3D model lane** — lessons whose diagram kind maps to a 3D manipulative
   (`solid-3d`, `cross-section`) can reuse the WebXR ar-solid bridge already in
   the interactive-visual registry; needs only kind coverage in configs.
5. **Per-word TTS voices for VI/AR** — currently ES only; add voice discovery
   with graceful fallback (many devices lack vi-VN/ar-SA voices).
6. **Printable studio packet** — one-click print bundling the evidence card,
   solved practice, and apply-lab work using the existing `printOnly()` lanes.
7. **Catch-up Apply Lab content** — catch-up configs lack `revealWordProblem`;
   regenerate via `generate-catchup-lessons.mjs` to add one so catch-ups get
   the Polya workbench too (regen order in project memory).
8. **Group composer hook** — deep-link `?group=1|2` from The Class Board's
   Group Builder so a tap on a student group opens the right variant.

## Invariants to preserve

- GENERATED lesson folders: never hand-edit `lessons/*-group*/`; engine modules
  only, or regen via the documented order.
- Every heading number is renumbered post-composition; never hardcode section
  numbers in new sections.
- Labs must skip cleanly (return `null`) when their config field is absent —
  the rail is data-driven and tolerates any subset.
- `chooseAdaptivePath` export is under test (`tools/small-group-innovation.test.mjs`).
- No timers that pressure students (talk timer is a discussion tool, not a game
  mechanic); no notice/wonder.
