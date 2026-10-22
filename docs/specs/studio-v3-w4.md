# Studio v3 · W4 — explore first, canonical models, linked representations

Builds on §10 of `practice-studio-v2.md` (the lab bench inside every studio) and `AUDIT_REPORT.md` ("Lessons whose canonical model students
cannot manipulate in the studio"). Nothing timed, a wrong answer never reveals the answer, English and Spanish only.

## W4a — explore-first opener (built)

In Practice, the lab bench's explore-and-write items (`lab-explore`, `lab-investigate`) open the studio as the first items of section 1 instead
of waiting in section 4; the mission stays in section 4. Their ids are unchanged, so saved progress keeps its keys. The explore item carries an
"Explore first" chip. Challenge keeps its stretch item in section 3. Unit 4's hand-built pages keep their single lab card in section 4.

## W4b — the 13 canonical models (built)

Every lesson already had a lab model, but for these 13 it was not the lesson's own picture: 2-3 median (ordered dot plot, count in from both ends),
2-11 decimal addition (aligned place-value columns, zeros annexed; the old bench multiplied a price by a count), 3-2 unit rate (equal groups + double
number line), 4-3, 4-4, 4-5 percent (benchmark jumps / tape and Part = Percent × Whole / the whole from a part), 5-6, 5-7, 5-8 nets and surface area
(prism net with face areas, triangular-prism net, square-pyramid net with the slant height), 5-9 regular polygon cut into triangles by its apothem,
6-8 equivalent expressions (regroup without changing the value; the old bench was a GCF model), 8-5 inequality graph (open or closed circle and a
shaded ray), 9-1 input/output table (which quantity responds).

Architecture: `curriculum/learning-labs/shared/models/<kind>-<mode>.mjs`, one module per model, registered in `models/index.mjs` (contract:
`models/README.md`). `math.mjs` (`controls`, `evaluate`, `puzzle`), `model.mjs` (`visual`, `guidance`) and `direct.mjs` (`isDirect`) ask the registry
first; a model nobody registered behaves exactly as before, and a registered `kind:mode` must not shadow one the standalone labs use (tested). Shared
numeric helpers live in `models/util.mjs` and drawing helpers in `models/draw.mjs` (modules never import `math.mjs`: that is a cycle). A module keeps
the controls and readout of the model it replaces wherever the lesson's skill allows, so the lesson's bench tasks stay true and only `bench.model.mode`
changes; 2-11, 5-7 and 6-8 needed new benches (a different operation or solid), 5-8 and 5-9 dropped an unused third value. The mode names are
new (`median`, `columns`, `unit-rate`, `benchmark`, `tape`, `find-whole`, `faces`, `tri-prism`, `pyramid-net`, `apothem`, `regroup`, `graph`,
`table`); `kind` is still the kind of the lab the lesson uses. The lab stamp (`labV`) now covers `models/`.

Gates: `tools/studio-models.test.mjs` (contract, every setting of every control, picture bounds/text size/NaN, mission puzzles, the lesson's bench
contract, no shadowing), one `tools/studio-model-<kind>-<mode>.test.mjs` per model that re-derives its numbers independently,
`tools/studio-lab-bench.test.mjs` (goal search) and `validate:studio-lab-browser` (every bench driven as a student).

## W4c — linked representations (planned)

One item kind, `link`, in which a single control drives two to four representations at once (table, double number line, graph, equation) and
the student answers questions that need two of them. Used first by the ratio and rate lessons.

## Gates

`validate:studio-lab-browser` (144 pages, bench driven end to end), `tools/studio-lab-bench.test.mjs` (goal search over every bench and lab).
