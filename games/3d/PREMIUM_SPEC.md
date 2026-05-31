# Neft Teacher — 3D Unit Games: Premium Rebuild Spec

Every unit game is rebuilt to this bar against the upgraded `engine3d/`.
Goal: **enterprise / educational-gaming-company quality** — not a 3D quiz wrapper.

## Hard rules (do not break)

- **Edit in place only.** Touch only `games/3d/unit-N/game.js` and `games/3d/unit-N/index.html`. Do NOT rename/move/delete files or folders.
- **Keep the module contract.** `game.js` must `export default { id, vocab, totalSteps?, createGame(ctx) }`. The engine (`engine3d/game-base.js`) mounts it. `createGame(ctx)` returns `{ start(), dispose() }`.
- **Preserve the math.** Keep the unit's standard(s), theme, and learning targets from the existing `game.js`. You may expand/clean the problem set, but it must stay curriculum-correct for the listed CCSS standard.
- **Vocab-first** (engine enforces): keep a strong `vocab` array — `{ term, definition, emoji }`, kid-friendly ESOL-level definitions. Vocab shows before play automatically.
- **Levels = Level 1 (support) and Level 2 (enrichment).** NEVER label content "ESOL". Level 1 = scaffolds/hints/smaller numbers; Level 2 = enrichment/larger numbers/multi-step. More rounds per level than the old version (aim 6–8 rounds/level).
- Respect `feel.reducedMotion`: gate idle animation/particles/shake behind it.
- Keep keyboard + on-screen touch controls and `announce()`/`caption()` accessibility.

## ctx API (from game-base.js)

`ctx = { scene, camera, renderer, clock, onFrame, loaders, THREE, input, hud, feel, announce, caption, level, levelInfo, gameId, onScore, loadProgress }`

- `onScore(points, meta)` — call on each correct step; engine handles score/streak/progress HUD.
- `hud.setObjective(text)`, `hud.message(text,{tone:'ok'|'warn'|'info',duration})`, `hud.setProgress(done,total)`, `hud.setStreak(n)`.
- `input.onPress(name=>…)` names: left/right/up/down/action/confirm. `input.onTap(cb)`, `input.raycast(camera, objects, recursive)`, `input.state.ndc`.
- `feel.tween({from,to,duration,onUpdate,onComplete})`, `feel.burst(pos,{color,count,spread})`, `feel.shake(mag,dur)`, `feel.syncCamera()`.
- `feel.sfx(name, caption?)` — procedural, no files. names: `pop|add|remove|correct|win|wrong|select|fanfare`. Call on EVERY meaningful action.
- `onFrame(cb)` registered callbacks get `(dt, elapsed)`.

## Engine now provides (use it)

ACES tone mapping, soft shadows, hemi+key+fill+rim lights, gradient sky, fog, PMREM env, and **UnrealBloom** are ON by default in `createScene`. To make them load you MUST add the addons importmap to `index.html` (see below). Emissive materials will glow via bloom.

## Visual quality recipe (apply in game.js)

1. **Geometry:** use `RoundedBoxGeometry` (`import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"`) for blocks; lathe/bevel/extrude for props. No bare flat boxes as hero objects.
2. **Materials:** `MeshStandardMaterial` with deliberate `roughness`/`metalness`; add subtle `emissive` + `emissiveIntensity` on interactive/feedback objects so bloom makes them pop. A clearcoat-ish look via `MeshPhysicalMaterial` for glass/liquids.
3. **Shadows:** add a ground/stage mesh with `receiveShadow = true`; set `castShadow = true` on hero meshes. (Engine enables the shadow map + configures the key light.)
4. **Animation/juice:** animated camera intro (tween into framing), gentle idle motion, tween every state change (scale-pop on spawn, ease moves), particle `burst` + `feel.shake` + `sfx('correct')` on success, `sfx('wrong')` + small shake on miss.
5. **Problem presentation:** a large, legible 3D problem card/label (use `makeLabel`-style CanvasTexture sprites or `engine3d/label3d.js`) AND `hud.setObjective(...)`. The math question must be unmistakable on screen at all times.
6. **Game shell:** clear round flow, running score/streak (engine HUD), and a satisfying completion state (`sfx('fanfare')`, confetti burst, "all complete" objective).
7. **Theme cohesion:** pick a palette per theme; set `sceneOpts.background` to a themed deep color and a good `cameraPos`.

## index.html requirements

- Keep the existing boot structure (title, intro caption, fallback). Update the importmap to include addons:

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
</script>
```

- Mount with themed scene options, e.g.:
  `mountGame(document.getElementById("game"), unitGame, { sceneOpts: { background: 0x12203a, cameraPos: [0, 6.5, 12] } });`
- Update the intro `<p>` and aria-labels to match the rebuilt gameplay/controls.

## Definition of done (per game)

- Loads with no console errors; first paint shows the premium scene (bloom/shadows/gradient).
- Vocab gate → level select → playable rounds → completion, all working by keyboard AND tap.
- Math is correct and clearly displayed every round; 6–8 rounds/level; Level 2 harder than Level 1.
- Uses rounded/PBR geometry, shadows, emissive+bloom, tweened juice, and `feel.sfx` on actions.
- No leaks: `dispose()` clears timers, frame callbacks, and added DOM controls.
