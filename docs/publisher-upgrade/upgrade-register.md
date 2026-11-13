# Upgrade register

Shared engines were extended. A second curriculum, lab platform, or badge system was not added. Public lesson ids were kept.

| Family | Existed | Preserved | Redesigned | Extended | Routes | Why |
| --- | --- | --- | --- | --- | --- | --- |
| Lessons | Engine shell, phases, hint ladder, EN/ES | Stage ids, save/resume, SCORM, Part 1 vs Part 2 | Lesson 6-4 learning target aligned to standard `6.AT.6c`, the title’s powers, and the launch substitution | Sidebar shows the learning target on every engine lesson. Hints carry strategic / representation / parallel roles. Local learning events record lesson, skill, attempt, result, support used. | `/lessons/<id>/` | One shell reaches the 84 core launchers. |
| Practice | Generated studios and clarity menu | Item data, answers, Spanish | No | Runtime practice arc: prepare, explore, guided, independent, reason, apply, improve. Challenge line says reasoning, not bigger numbers. | `/math/practice-studio/<id>/` | Studios share `assets/studio/clarity.js`. Pages were not regenerated. |
| Small groups | Five stage ids and teacher drawer | Stage ids `sg-tab-*` | No | Teacher launch card lists the practice arc, support vs challenge, and optional hints. | `/lessons/<id>-group1/`, `-group2`, `-catchup` | Student tabs stay the saved ids. |
| Family | Five-stop mission, optional and ungraded, EN/ES toggle | Stop ids, optional extras | No | Hero keeps its existing promise (“Optional. No grades, no account.”); a drafted path sentence was withdrawn because it pushed Start below the first screen. Toggle comment locks “do not clear answers.” | `/lessons/<id>/homework.html?lang=es` | The guard test reads every shipped homework page. |
| Representations | Canvas ratio lens (tape, double number line, table) | Scene id `equivalent-ratios` | Scene now includes quantity model and symbolic statement | Scale factor still drives every picture from one ratio. | `/curriculum/math-canvas/?scene=equivalent-ratios&lesson=3-3` | Same canvas, five linked representations. |
| Misconceptions | `exponent-as-multiplication` predictor | Taxonomy ids and existing student strings | No | Repair task and fresh item for `3^2`. Mounted on the Almost-Right Lab. Equation both-sides helper tested. | `/curriculum/almost-right-lab/#exponent-repair` | Logic is re-exported from `engine/core/misconceptions.js`. |
| Teacher home | Full hub with Forge, map, Class Boss, pacing, SCORM, family, command center | All existing sections below the new block | First screen adds Teach today, Plan, Respond, Resource library | Progressive disclosure with links into tools that already exist. | `/curriculum/` | Nothing was removed from the hub. |
| Living map | Prerequisite trace, assets, coverage | Graph data | No | Selected standard shows understanding, stored prerequisites, lessons, practice, support/challenge counts, and a next step. | `/curriculum/map/` | `traceBack` is the only prerequisite source. |
| Learning labs | Mission, Learn, Investigate, Practice, Create, Games | Models and stages | No | Investigate copy states that the control changes the lab’s mathematics. | `/curriculum/learning-labs/<slug>/` | Shared `activities.mjs` already mounted the model. |
| Projects / workbench | Plan-like stages Choose, Build, Test, Revise, Publish | Stage indexes and stories | Labels are Plan, Build, Test, Revise, Explain | Workbench page left in place. | `/curriculum/projects/studio/?project=discovery` | Characters and missions were not replaced. |
| Graphic novels | Existing stories | Stories and characters | No | Inventory only | `/graphic-novels/` | Not rewritten. |
| Arcade / games | Shared fluency and canvas engines plus bespoke cabinets | All of them | No | Reviewed, not rebuilt | `/math/games/`, `/curriculum/arcade/` | A shared stylesheet is not a new game. |

## Reviewed, not rebuilt

Seventeen game directories were inventoried. They were not individually rebuilt because each cabinet has its own rules, and this pass did not add unrelated quiz games. Ratio, percent, area, volume, expressions, equations, coordinates, and data still use the engines they already had. The ratio canvas is the representation that was actually extended.
