# Arcade design system: shared model layer

Rules every arcade game follows for the picture of the mathematics. Code: `assets/game-studio.js`
(renderers, scaffold), `math/games/shared/flagship-studio.js` (per-game adapters),
`data/arcade-games.json` (registry). Gate: `npm run validate:arcade-models`.

## One registry

`data/arcade-games.json` is the source of truth for game id, route, family, kind
(`skill` | `adventure`), curriculum unit, topic model and topic keywords. The hub
(`curriculum/arcade/index.html`), the flagship configs and the validator are checked against it;
edit the registry first. Registry ids are the stable keys for audits and tests.

## The model contract

A model is `{ kind, params }`, drawn by `GameStudio.renderMathModelSVG(kind, params)`.

1. **Derived from state.** Params come from what the game currently shows (question text, dimensions,
   table rows, selected lane). Never from a counter, a constant, or the answer pattern.
2. **Never the answer.** A model draws the givens. Dot plots carry no mean or median; rule tables carry
   no rule; area shapes print base and height, not area. Misses may add hint text, never the solution
   (`validate:game-rules`).
3. **Silence over a wrong picture.** An unknown kind, an invalid parameter (140%, a 40-unit edge) or a
   question the adapter cannot read returns `""` and nothing is drawn. There is no default kind.
4. **No silent truncation.** A quantity too large to draw block by block is one labelled bar with its
   real value.
5. **Accessible.** Every SVG is `role="img"` with an `aria-label` that states the real values; meaning
   is never color alone (labels, dashed outline for subtracted units); text is escaped.
6. **Offline and light.** Inline SVG, 360 px wide, no network, no images.

### Kinds

| kind | topic | draws | adapter reads |
|---|---|---|---|
| `balance` | one-step equations | two-pan balance: variable blocks + unit blocks vs units; subtracted units dashed | equation parsed from the question text (`x + 8 = 13`, `3x = 21`, `n ÷ 4 = 7`); inequalities and word forms draw nothing |
| `data-display` | statistics | dot plot of the quoted data | `q.data` |
| `percent-grid` | percent | 10×10 grid with exactly p squares shaded | selected lane's percent |
| `area-shapes` | area | rectangle / triangle / parallelogram with base and height | `q.type`, `q.dims` |
| `volume-cubes` | volume | rectangular prism with length, width, height | `window.__flagshipState` |
| `rule-table` | two variables | input/output table | `q.table` |
| `variable-roles` | two variables | independent → dependent roles, names withheld | `q.kind === "id"` |
| `progress` | any | missions complete (expedition journal) | mission state |
| `ratios`, `fractions`, `coordinates`, `integers` | ratio / fraction / coordinate / integer | pre-existing models, kept | pattern or explicit request only |

Planned, registered but not yet drawn: `factor-tree`, `decimal-line`, `expression-tree`
(`validate:arcade-models` prints them).

## The wrong-answer scaffold

`syncCDDAScaffold` asks `GameStudio.setModelProvider` for the current model. A game that registers a
provider (flagship-studio does) is scaffolded with its own model or nothing. A game without one gets a
picture only when the detected error pattern names its own topic (`coord-swap`, `sign-flip`,
`partition-mismatch`, `unscaled-ratio`); an unclassified miss draws nothing. The earlier default drew a
ratio bar under any topic.

## Adding a model

1. Add the kind to `renderMathModelSVG` (validate params, return `""` when invalid, label it).
2. Add a sample to `SAMPLES` in `tools/lib/arcade-models-check.mjs` and assertions to
   `tools/arcade-models.test.mjs`.
3. Add the adapter case to `modelState` in `flagship-studio.js` and set `model:` on the game's config.
4. Set the same `model` in `data/arcade-games.json`, then run `npm run validate:arcade-models`.

## Coach text

A game's coach text must name one of its registry `topicKeywords` and must not use another topic's
distinctive keyword (`COACH_OFF_TOPIC`, `COACH_FOREIGN_TOPIC`). Add a keyword to the registry when a
game legitimately teaches across topics (Volume Vault lists `area` for surface area).
