# Studio v3 · W4 — explore first, canonical models, linked representations

Builds on §10 of `practice-studio-v2.md` (the lab bench inside every studio) and `AUDIT_REPORT.md` ("Lessons whose canonical model students
cannot manipulate in the studio"). Nothing timed, a wrong answer never reveals the answer, English and Spanish only.

## W4a — explore-first opener (built)

In Practice, the lab bench's explore-and-write items (`lab-explore`, `lab-investigate`) open the studio as the first items of section 1 instead
of waiting in section 4; the mission stays in section 4. Their ids are unchanged, so saved progress keeps its keys. The explore item carries an
"Explore first" chip. Challenge keeps its stretch item in section 3. Unit 4's hand-built pages keep their single lab card in section 4.

## W4b — the 13 canonical models (planned)

Every lesson already has a lab model, but for these 13 it is not the lesson's own picture: 2-3 median (ordered dot plot, count in from both ends),
2-11 decimal addition (aligned place-value columns, zeros annexed), 3-2 unit rate (equal groups + double number line), 4-3, 4-4, 4-5 percent
(double number line / tape with benchmark jumps; the whole from a part), 5-6, 5-7, 5-8 nets and surface area (prism and pyramid nets, faces
added), 5-9 regular polygon cut into triangles by its apothem, 6-8 equivalent expressions (regroup without changing the value), 8-5 inequality
graph (open or closed circle and a shaded ray), 9-1 input/output table (which quantity responds).

Architecture: `curriculum/learning-labs/shared/models/<mode>.mjs`, one module per model, registered in `models/index.mjs`; `model.mjs` and
`math.mjs` dispatch to a registered module before their own `kind`/`mode` cases. A module exports `{ kind, mode, controls, compute, visual,
guidance }` and nothing else, so authors never share a file. The studio bench of the lesson (`bench.model`) names the new mode; the standalone lab
pages keep their models. The goal search in `tools/studio-lab-bench.test.mjs` (a goal no setting reaches, a model that starts solved, a goal one
click from the start) runs on every new model unchanged.

## W4c — linked representations (planned)

One item kind, `link`, in which a single control drives two to four representations at once (table, double number line, graph, equation) and
the student answers questions that need two of them. Used first by the ratio and rate lessons.

## Gates

`validate:studio-lab-browser` (144 pages, bench driven end to end), `tools/studio-lab-bench.test.mjs` (goal search over every bench and lab).
