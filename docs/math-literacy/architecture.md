# Math Literacy Studio: architecture and contracts

Route: `/access-practice-lab/math-literacy` (a lab view; code in `access-practice-lab/src/mls/`, content in `access-practice-lab/content/mls/`).
It sits in the lab's Teachers audience (sitemap id `math-literacy`, `for: ["teacher"]`). The directive proposed `/teachers/math-literacy/`;
that path is not served on thelanguagepage.com (the host allow-list in `functions/_lib/language-page.js` redirects it to eduwonderlab.com)
and creating it would add a route to the public route contract, which needs Joel's agreement. The lab route needs no route change.

## Layers (one job each)

| Layer | Files | Rule |
|---|---|---|
| Inventory (the denominator) | `content/mls/inventory.json` | 85 skills, 30 roles, 12 engines, 30 manipulatives, 12 games, ... Counts may not shrink (validator). |
| Skill content (authored) | `content/mls/skills/g1.json` .. `g8.json` | Original text only. Schema below. |
| Mathematics (generated) | `src/mls/kit.js`, `src/mls/families/*.js` | Seeded, deterministic. Every Problem is verified independently by `tools/mls-verify/`. |
| Visuals | `src/mls/visuals.js` | `renderVisual({kind,...args}) -> {svg, alt, summary}`; static SVG, no DOM needed. |
| Language support | `src/mls/lang.js` | WIDA-informed support bands, frame banks, sentence-studio operations. Independent of the math. |
| Content model | `src/mls/model.js`, `roles.js` | `buildResource(skill, type, opts) -> Resource` (blocks). The single source for every format. |
| Exports | `src/mls/export/{html,docx,pptx,print}.js` | Consume a Resource only. No format has its own content. |
| Interactive | `src/mls/engines.js`, `manips.js`, `games.js` | Student-facing; consume skill content + Problems. |
| Teacher UI | `src/views/math-literacy.js`, `mls.css` | Three doors, skill pages, builder, navigator, search, workspace. |

## Problem (output of a family generator)

`FAMILIES[id].gen(rng, params, opts) -> Problem`, always returned through `finalize(problem)` from `kit.js`.

```js
{
  family: "addsub",
  spec: { /* plain JSON, enough to RE-SOLVE the problem from scratch: the verifier reads only this */ },
  stem: { plain, standard, rich },  // situation text; "" for a bare computation. SAME numerals in all three.
  ask:  { plain, standard, rich },  // the question; same numerals in all three
  expr: "7 + 5" | null,             // symbolic form, typographic: use MINUS, TIMES, DIVIDE from kit.js
  answer: { value: "12", text: "12", kind: "int|frac|dec|text|pair|set|choice|bool", unit?: "cm" },
  // value is canonical: integers "12" or "-3"; fractions "3/4" reduced (improper stays improper); decimals as plain
  // digits "3.25" (no trailing zeros beyond the model's places); pair "(2,5)"; set "1,2,3" sorted; bool "true"/"false".
  work: ["step text", ...],         // model solution; every number in it must be arithmetically true
  visual: null | { kind, alt, ...args },  // see Visuals
  distractors: [{ text, misconception }],  // >= 3, none equal to the answer, each a real misconception (tag is a short kebab string)
  hints: { conceptual, procedural },       // never state the answer
  structure?: { happening, known:[{label,value}], unknown, relationship, model, reasonable },  // for story problems (Word Problem Anatomy)
  level: 1 | 2 | 3,
}
```

Rules:
- `opts = { level: 1|2|3, ctx: contextId }`. `level` is mathematical complexity inside the skill's own grade (1 = more support: smaller numbers, one step; 3 = extension: larger numbers or an extra step). It never changes the language. Level 1 must stay on-grade.
- `params` come from the skill (`inventory.json`) and override family defaults. A family must honour every param it documents in its header comment and ignore unknown ones.
- `plain` = short concrete sentences, no idioms, one idea per sentence. `standard` = grade-level text. `rich` = precise academic phrasing. All three describe the SAME situation and carry the SAME numerals (kit.finalize enforces this).
- Keyword tricks are forbidden: do not write stems whose operation is revealed by a cue word ("altogether" always meaning add). Vary structure so that the same phrase appears with different operations across seeds.
- Domain restrictions: no negative results below grade 6 unless the skill is integers; no remainders unless the problem says what to do with them; divisions are exact unless the family documents remainders; fractions reduce only when the skill says so; one correct answer.

## Family modules

`access-practice-lab/src/mls/families/g12.js`, `g34.js`, `g56.js`, `g78.js`, each `export const FAMILIES = { id: { title, grades, defaults, gen } }`.
`src/mls/families.js` (owned by the integrator) merges them and exports `generate(familyId, params, { seed, level, ctx })`.

## Verifier (independent)

`tools/mls-verify/g12.mjs`, `g34.mjs`, `g56.mjs`, `g78.mjs`, each `export const SOLVERS = { family: (spec) => "canonical answer string" }`.
A solver reads `spec` only, computes the answer by exact rational arithmetic (`scripts/lib/rational.mjs`), and never imports the generator or
trusts `answer`. `tools/mls-verify.mjs` runs every skill x levels 1-3 x 40 seeds x every context and fails on: solver != answer.value;
a distractor numerically equal to the answer; a stem whose numerals differ between language levels; a `work` line that states an
arithmetic fact that is false (`a op b = c` patterns are recomputed); a problem repeated within a set; a visual whose args do not render.

## Visuals

`renderVisual(spec) -> { svg, alt, summary }`. `svg` is a self-contained `<svg viewBox>` string (no external refs, `role="img"`,
`<title>` = alt), text drawn at >= 12 units, colors from the lab palette (navy #17324D, teal #1FA6A2, amber #F2C15B, coral #E8765A, blue #2F6FB0, ink #24323F, paper #F7F4EC; no purple), meaning never carried by color alone.
`summary` is a plain sentence a screen reader can use instead of the picture. Rational values are strings ("3/4") or numbers.

| kind | args |
|---|---|
| tenframe | `{ n, frames=1 }` dots in 2x5 frames |
| counters | `{ n, perRow=10, shape="circle" }` |
| bond | `{ whole, a, b, hide: "whole"\|"a"\|"b"\|null }` number bond; hidden part shows "?" |
| placevalue | `{ hundreds=0, tens=0, ones=0 }` blocks |
| numberline | `{ min, max, ticks, marks:[{at,label,hollow}], hops:[{from,to,label}], show:"int"\|"frac"\|"dec" }` `ticks` = number of equal intervals |
| array | `{ rows, cols, shade?:{rows,cols}, label=true }` |
| areamodel | `{ w, h, cutW? , cutH? , labels=true }` partial-product rectangle |
| fracstrip | `{ parts, shaded, compare?:{parts,shaded} }` |
| fracshape | `{ shape:"circle"\|"rect", parts, shaded }` |
| clock | `{ h, m, numerals=true }` analog |
| bar | `{ title, cats:[..], values:[..], scale=1, orient:"v"\|"h", picture=false, unit="" , axisLabel }` |
| lineplot | `{ min, max, step, values:[..], label }` step may be a fraction string; x marks stacked |
| boxplot | `{ min, q1, median, q3, max, label }` |
| coord | `{ xmin, xmax, ymin, ymax, step=1, points:[{x,y,label}], lines:[{m,b}\|{p1,p2}], polys:[{pts:[{x,y}],label}], labelAxes:[x,y] }` |
| tape | `{ rows:[{label, parts:[{label,value\|"?",n=1}]}], total? }` |
| ratiotable | `{ headers:[a,b], rows:[[x,y]..], hide:[[r,c]..] }` hidden cells show a box |
| doublenl | `{ top:{label,values:[..]}, bottom:{label,values:[..]} }` null = "?" |
| table | `{ headers:[..], rows:[[..]..], caption }` |
| shape | `{ name:"triangle"\|"square"\|"rectangle"\|"circle"\|"pentagon"\|"hexagon"\|"rhombus"\|"trapezoid"\|"half-circle"\|"quarter-circle", labels=false }` |
| prism | `{ l, w, h, units=true, unit="cubes" }` |
| rect | `{ w, h, unit, showArea=false, showPerimeter=false, labels:["w","h"]\|null }` |
| angle | `{ deg, label, protractor=false }` |
| circle | `{ r, show:"radius"\|"diameter"\|"both", unit }` |
| triangle | `{ a, b, c, right=true, labels:[...] }` side labels; `?` allowed |
| balance | `{ left:[token..], right:[token..] }` token = number or `"x"`; tilts by value when numeric |
| tiles | `{ x=0, one=0, negX=0, negOne=0 }` algebra tiles |
| scatter | `{ xmin,xmax,ymin,ymax, points:[{x,y}], line?:{m,b}, xLabel, yLabel }` |
| spinner | `{ sections:[{label,weight}] }` |
| ruler | `{ unit:"cm"\|"in", length, objectFrom=0, objectTo }` |
| machine | `{ rule:"x + 3", input, output }` function machine, `"?"` allowed |

## Skill content (authored): `content/mls/skills/gN.json`

`{ "grade": N, "skills": [ Skill ] }`, one Skill per inventory skill of that grade (ids match `inventory.json`; title, standards, family,
params and prereq are NOT repeated here: the inventory owns them). Original wording only. No keyword tricks. Mathematics stated must be correct.

```js
{
  id, objective /* teacher-facing, 1-2 sentences */, studentObjective /* "I can ..." */, languageObjective /* "I will ... using ..." */,
  successCriteria: [3-4 observable strings], bigIdea: "one sentence",
  keyLanguageUses: ["Narrate"|"Inform"|"Explain"|"Argue", ...],     // WIDA Key Language Uses
  languageDemands: { vocabulary:[..], syntax:[..], discourse:[..] },  // 2-3 / 1-3 / 1-2 short phrases
  domains: { listening, speaking, reading, writing },                // one sentence each: what students do in that mode
  vocab: [4-6 x { term, kind:"content"|"academic"|"symbol"|"multiple-meaning"|"comparison"|"spatial", def /* <= 18 words */,
                  example, nonExample, sentence, everyday?: "everyday meaning (required when kind is multiple-meaning)",
                  morphology?: "word-part note", cognateEs?: "Spanish cognate or null", visual?: { kind, ...args } /* a Visuals spec */ }],
  misconceptions: [3-4 x { id, belief, root:"conceptual"|"procedural"|"reading"|"language", why, fix,
                  errorCase?: { story /* one-sentence situation */, steps:[2-4 strings], firstWrong /* 0-based index of first wrong step */, explain } }]
                  // at least 2 per skill carry errorCase; the steps show a fictional student's work with a real error
  reading: { title, text /* 90-140 words, original, uses 3+ vocab terms */, simple /* 60-90 words, same mathematics and numbers */,
             questions: [3 x { q, a, kind:"literal"|"inference"|"math" }] },
  discourse: { wdntb: { items:[4 short strings], odd /* index of one defensible odd-one-out */, why },
               noticeWonder: { prompt }, asn:[2 x { claim, verdict:"always"|"sometimes"|"never", why }],
               wyr: { q, a, b }, compare: { a, b, prompt } /* two strategies, both valid or one flawed */,
               debate: { claim, forEvidence, againstEvidence } },
  listening: { script /* 60-110 words, spoken-style, original */, tasks:[2 x { type:"identify"|"match"|"error"|"build", q, options:[3-4], answer /* index */, why }] },
  story: { title, character, setting, goal, intro, beats:[3 x { lead /* narrative sentence; the engine appends a generated problem */, success, redirect }], ending },
  comic: { cast:[name, name], panels:[4-5 x { who, says }], predict:{ q, options:[3], answer, why } },
  transfer: { relationship /* the underlying structure in one phrase */, phrasings:[4 different wordings/representations of it], decoys:[2 x { text, why }] },
  modeling: { title, scenario /* fictional or clearly labeled data */, given:[{label,value,unit}], assumptions:[3], prompts:[3], limits:[2] },
  sentence: { base /* a short true statement */, because, but, so /* three expansions of the base: same mathematics */, targets:[2 vocab terms] },
  diagnostic: { prompt, lookFor:[2-3] , language /* what to check to tell a language barrier from a math barrier */ },
  extension: { task, reasoning /* a justification prompt */ },
  family: { en: { learning, say, ask, activity }, es: { learning, say, ask, activity } },  // plain, no jargon, no standards codes
  contexts: [3-6 context ids from kit.CONTEXTS suitable for this skill]
}
```

Spanish is drafted to the repo's Spanish style rules (ustedes with grown-ups, tú with students, `60%` unspaced, no English left, "el total" for the whole)
and is labelled as not yet reviewed by a native speaker everywhere it is shown.

## Resource (the shared content model)

`buildResource(skill, type, opts) -> Resource` where `opts = { support:"more"|"standard"|"extension", mathLevel:1-3, langBand:1-6, count, ctx, seed, key:true, edits }`.
`support` is a preset that sets `mathLevel`/`langBand`/scaffold amounts; every one of them can be set independently.

```js
Resource = {
  id, skillId, grade, type, title, subtitle,
  meta: { minutes, support, mathLevel, langBand, roles:[role ids], standards:[..], objective, seed },
  sections: [{ heading, blocks:[Block] }],
  key: [{ ref, answer, work:[..] }],           // teacher answer key, exported as a SEPARATE document
  notes: [teacher note strings]                // appear in the guide / key, never on student pages
}
Block =
  { t:"p", text, style?: "directions"|"note"|"quote"|"teacher" }
| { t:"list", items:[..], ordered? }
| { t:"table", headers:[..], rows:[[..]..], caption? }
| { t:"visual", spec:{kind,...}, alt }          // rasterised by exporters that need it
| { t:"problem", n, ask, stem?, expr?, visual?, choices?:[text..], workspace:{ kind:"lines"|"grid"|"box"|"none", size:1-6 }, frames?:[..] }
| { t:"frames", level:"1-2"|"3-4"|"5-6", items:[..] }
| { t:"wordbank", words:[..] }
| { t:"cards", items:[{ front, back?, visual? }], cols:2|3 }
| { t:"lines", prompt, n }
| { t:"check", items:[..] }                      // checkbox rows
| { t:"pagebreak" }
```

## Exports

`exportResource(resource, format, { key }) -> Promise<{ blob|string, filename, mime }>`, formats `print | docx | pptx | html`.
`print` opens a print view and uses the browser's print dialog (Save as PDF); it is labelled that way in the UI and nothing claims a generated PDF file.
DOCX and PPTX contain real editable text, real tables, and visuals embedded as PNG (rasterised in the browser); they are validated with python-docx / python-pptx and a LibreOffice round trip.
`html` is a standalone interactive file (inline CSS and JS, no network), showing the same blocks with working answer checking for `problem` blocks that have choices or an answer.

## Language support bands (WIDA-informed, not a measurement)

Teachers pick a support band; the studio never assigns one to a student and never states a proficiency level for a person.
Bands: `1-2` beginning (visuals, word banks, sentence kernels, matching/sequencing, oral rehearsal, home-language support), `3-4` developing (expanded frames,
transition words, guided comparison, partial representations), `5-6` expanding to advanced (extended explanations, precise language, counterexamples, independent revision).
The mathematics, objective and numbers are identical in every band. The scaffold-fading path is Model -> Guided -> Partial -> Independent -> Transfer.

## Ownership (parallel work)

Foundation (kit, inventory, validator, this doc): integrator. Families + solvers: four family agents, one file pair each. Visuals: visuals agent.
Skill content: one agent per grade. Exports: export agent. Engines/manipulatives/games: engine agents. The integrator owns `model.js`, `roles.js`, `lang.js`,
`search.js`, `store.js`, the teacher view, the stylesheet, wiring and the generated coverage report. Nobody edits another owner's files; ask via the integrator.

## Honest limits (carried into the UI and the report)

Spanish is unreviewed by a native speaker. WIDA-informed language supports are not reviewed by a WIDA-trained educator. Device speech (browser speechSynthesis) is the only audio;
there is no human narration. Usability targets (3 selections, 30-60 s) are measured by scripted runs, not by teachers. Standards alignments are informational CCSS-M 2010 codes.
