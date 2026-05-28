# engine3d — Shared Three.js 3D Game Framework

The single source of Three.js infrastructure that **every** Grade 6 unit game
imports. Unit games never re-implement scene/HUD/input/scoring — they define
math-as-mechanic gameplay and consume this framework.

Vanilla ES modules. No build step. Three.js loads from a pinned ESM CDN via an
import map so it stays offline-cacheable.

---

## Quick start (host HTML)

```html
<link rel="stylesheet" href="/assets/design-tokens.css" />
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
    }
  }
</script>
<div id="game" style="position:fixed;inset:0"></div>
<script type="module">
  import { mountGame } from "/games/engine3d/index.js";
  import myGame from "/games/3d/unit-5/game.js"; // your unit game module
  mountGame(document.getElementById("game"), myGame, {});
</script>
```

The mount element MUST be a positioned, sized container (it hosts the canvas,
HUD, touch controls, vocab gate, and level select as absolutely-positioned
layers).

---

## The contract — what every unit game exports

Each unit game is a **module object** with this shape:

```js
export default {
  id: "unit-5-area-architect", // string, used for scoring + progress keys
  vocab: [
    // Level 1 vocab-first terms (shown before play)
    {
      term: "Area",
      definition: "The amount of flat space inside a shape.",
      emoji: "▦",
    },
    {
      term: "Square unit",
      definition: "A 1-by-1 square used to measure area.",
      image: "/img/sq.png",
    },
  ],
  createGame(ctx) {
    /* ...build and return controller... */
  },
};
```

### `createGame(ctx)` — exact signature

```js
createGame(ctx) {
  // build your meshes, wire input, etc. using ctx (see ctx shape below)
  return {
    start() {},     // REQUIRED — called once after scene/HUD/input are ready
    dispose() {},   // OPTIONAL — unbind frame callbacks / timers you created
  };
}
```

- `start()` is invoked by the framework after the vocab gate completes and the
  scene/HUD/input/feel are constructed. Put round setup and listener wiring here.
- `dispose()` is invoked when the host tears the game down. The framework already
  disposes scene, renderer, input, HUD, feel, and announcer — only clean up what
  _you_ created (frame-callback unsubscribers, `setTimeout`/`setInterval`, etc.).

### The `ctx` object passed to `createGame(ctx)`

```js
ctx = {
  // --- Three.js core (from core.js) ---
  scene, // THREE.Scene (ambient + directional light already added)
  camera, // THREE.PerspectiveCamera
  renderer, // THREE.WebGLRenderer (DPR capped at 2 for Chromebooks)
  clock, // THREE.Clock
  THREE, // the THREE namespace (use this; do not re-import)
  onFrame, // (cb(dt, elapsed)) => unsubscribe — register per-frame logic
  loaders, // { loadTexture(url)->Promise, loadAudio(url)->Promise }

  // --- Input (from input.js) — keyboard AND touch ---
  input, // {
  //   state: { up,down,left,right,action,confirm, pointer{x,y,active}, ndc, isTouch },
  //   isTouch,
  //   onPress(cb(name)) => unsub      // name: 'up'|'down'|'left'|'right'|'action'|'confirm'
  //   onTap(cb('tap')) => unsub       // pointer/touch tap
  //   raycast(camera, objects, recursive?) => intersections[]
  //   direction() => THREE.Vector2    // normalized -1..1 from dpad/keys
  //   dispose()
  // }

  // --- HUD (from hud.js), DOM-over-canvas ---
  hud, // { setObjective(text), setScore(n), setLives(n), setTimer(seconds),
  //   setLevel(label), message(text,{duration,tone:'ok'|'warn'|'info'}),
  //   clearMessage() }

  // --- Juice (from feel.js); respects prefers-reduced-motion ---
  feel, // { reducedMotion, tween({from,to,duration,onUpdate,onComplete}),
  //   burst(position,{count,color,spread,size,life}),
  //   shake(magnitude,duration), syncCamera(),
  //   registerSound(key,url), sound(key, caption?), setAudioEnabled(on) }

  // --- Accessibility (from a11y.js) ---
  announce, // (text) => void   — writes to aria-live="polite" region
  caption, // (text) => void   — visible caption for audio (pass "" to clear)

  // --- Levels (from levels.js) ---
  level, // 1 (support / scaffolded) | 2 (enrichment / extension)
  levelInfo, // { id, label:'Level 1'|'Level 2', kind:'support'|'enrichment', blurb }

  // --- Scoring / persistence ---
  gameId, // resolved game id string
  onScore, // (points, meta?={}) => void
  //   adds to running total, updates HUD, POSTs /api/scores,
  //   saves /api/progress, falls back to localStorage offline.
  loadProgress, // () => Promise<savedProgress|null>  (network → localStorage fallback)
};
```

---

## How the pieces work

### Boot sequence (`mountGame`)

1. If `options.level` is `1` or `2`, that level is used. Otherwise a
   **Level 1 / Level 2** selection screen shows first.
2. **Vocab-first gate** renders each term (word + plain-language definition +
   image/emoji) BEFORE gameplay. The student clicks through; then play begins.
   The gate always runs when `vocab` is non-empty (this is part of Level 1).
   Pass `options.skipVocabForL2: true` only if you intentionally want Level 2 to
   bypass it.
3. Scene, input, HUD, and feel are built; `createGame(ctx)` runs; `start()` fires.

### Scoring

Call `ctx.onScore(points, meta)` whenever the student earns points. The
framework keeps the running total, updates the HUD, fires `reportScore` to
`https://eduwonderlab.pages.dev/api/scores`, and `saveProgress` to `/api/progress`.
Both are **fire-and-forget** and **degrade gracefully**: offline writes go to
`localStorage` and are flushed automatically on the next `online` event.

### Levels (no "ESOL" anywhere)

- **Level 1** = support / scaffolded (vocab-first, smaller goals).
- **Level 2** = enrichment / extension (bigger goals, more elements).

Branch your difficulty on `ctx.level`. Never surface the word "ESOL" in UI or code.

### Accessibility

- `ctx.announce(text)` narrates state changes to screen readers (aria-live).
- Provide a keyboard path: use `input.onPress` (`action`/`confirm`) so the game
  is playable without a pointer. On-screen touch controls appear automatically
  on touch devices. Those d-pad/action buttons call `stopPropagation` on their
  pointer events, so a game wiring `input.onTap` on the canvas will **not**
  double-fire when a student presses an on-screen control. If you add your own
  DOM controls over the canvas, do the same (`e.stopPropagation()` in the
  pointer handler) to avoid spurious taps.
- `feel` checks `prefers-reduced-motion` and reduces/disables particles, tweens,
  and screen-shake automatically (`feel.reducedMotion` exposes the result).

### Performance (Chromebooks)

DPR is capped at 2. Keep geometry low-poly, reuse materials/geometries, and
prefer `MeshStandardMaterial`/`MeshBasicMaterial`. Dispose anything you add in
`dispose()` if `mountGame` does not already own it.

---

## Minimal example unit game

```js
// games/3d/unit-X/game.js
export default {
  id: "unit-x-demo",
  vocab: [
    {
      term: "Sum",
      definition: "The answer when you add numbers.",
      emoji: "➕",
    },
  ],
  createGame(ctx) {
    const { scene, camera, input, hud, feel, announce, THREE, level, onScore } =
      ctx;
    const cubes = [];
    let target = level === 2 ? 20 : 10;
    let current = 0;

    function build() {
      hud.setObjective(`Reach a sum of ${target}`);
      for (let i = 0; i < 5; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: 0x1fa6a2 }),
        );
        mesh.position.x = (i - 2) * 1.6;
        mesh.userData.value = 1 + Math.floor(Math.random() * 9);
        scene.add(mesh);
        cubes.push(mesh);
      }
    }

    function pick(mesh) {
      current += mesh.userData.value;
      feel.burst(mesh.position, { color: 0xf2c15b });
      announce(`Sum is ${current}`);
      if (current === target) {
        onScore(10);
        hud.message("Nice! +10", { tone: "ok" });
      }
    }

    return {
      start() {
        build();
        input.onTap(() => {
          const hits = input.raycast(camera, cubes);
          if (hits.length) pick(hits[0].object);
        });
      },
    };
  },
};
```

---

## Spatial helpers (grids, exact math, world labels)

Spatial/geometry games (area, volume, coordinate-plane units) must **not**
re-derive grid math or approximate area by counting cells. Use these shared,
exact helpers instead.

### `grid.js` — `createGrid(ctx, { n=8, cell=1, origin })`

Builds a floor plate + `GridHelper` + an invisible raycast **pick-plane** sized
to the grid, all on the XZ plane at `origin.y`. Cells are indexed `i` (along +X)
and `j` (along +Z), `0..n-1`; vertices are `0..n`. Coordinates are exact and
consistent across all the conversions.

```js
import { createGrid } from "/games/engine3d/grid.js";

const grid = createGrid(ctx, { n: 8, cell: 1 }); // adds grid.group to ctx.scene
const center = grid.cellCenter(2, 3); // THREE.Vector3 world center of cell (2,3)
grid.highlightCell(2, 3); // translucent highlight; null/out-of-bounds hides it

// Raycast a tap through the camera onto the grid:
input.onTap(() => {
  const hits = input.raycast(camera, [grid.pickPlane]);
  if (hits.length) {
    const { i, j, inBounds } = grid.worldToCell(hits[0].point);
    if (inBounds) grid.highlightCell(i, j);
  }
});

const v = grid.vertexWorld(0, 0); // corner vertex world position
const nv = grid.worldToVertex(somePoint); // -> { i, j, inBounds } nearest vertex
grid.dispose(); // removes group + frees geometry/materials
```

Returns: `{ group, pickPlane, n, cell, origin, cellCenter(i,j), worldToCell(p),
vertexWorld(i,j), worldToVertex(p), highlightCell(i,j), dispose() }`.

### `geometry-math.js` — exact area/volume (pure, unit-tested)

Pure functions (no Three.js) so they are testable in Node and guarantee
mathematically correct values.

```js
import {
  rectArea, // (w, h) -> w*h
  triangleArea, // (base, height) -> base*height/2
  polygonArea, // (points[{x,y}|{x,z}]) -> shoelace area (winding-independent)
  compositeArea, // (parts[]) -> signed sum; part.sign:-1 subtracts (holes)
  prismVolume, // (l, w, h) -> l*w*h
  decompose, // (parts[]) -> { parts:[{...,area,signedArea}], total }
} from "/games/engine3d/geometry-math.js";

rectArea(4, 3); // 12
triangleArea(6, 4); // 12
compositeArea([
  { type: "rect", w: 4, h: 3 },
  { type: "triangle", base: 4, height: 2 },
]); // 16
prismVolume(2, 3, 4); // 24
```

Part shapes for `compositeArea`/`decompose`: `{ type:"rect", w, h }`,
`{ type:"triangle", base, height }`, `{ type:"polygon", points }`. Any part may
add `sign: -1` to subtract it (cut-out).

Run the tests: `node games/engine3d/geometry-math.test.mjs`.

### `label3d.js` — world-space text sprites

```js
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";

const label = makeLabel("4×3=12", { scale: 0.9 }); // -> THREE.Sprite
label.position.copy(grid.cellCenter(2, 3));
label.position.y += 0.5;
scene.add(label);
updateLabel(label, "4×3=12 ✓"); // re-render text in place, stays crisp
```

Canvas size is capped (`maxWidth`, default 1024px) so labels stay crisp on
Chromebooks without blowing texture memory.

---

## Module map

| File               | Export(s)                                                                              |
| ------------------ | -------------------------------------------------------------------------------------- |
| `core.js`          | `createScene(mountEl, opts)`                                                           |
| `input.js`         | `createInput(domEl)`                                                                   |
| `hud.js`           | `createHUD(mountEl)`                                                                   |
| `vocab-gate.js`    | `showVocabGate(mountEl, { terms, onComplete, announce })`                              |
| `levels.js`        | `showLevelSelect`, `levelInfo`, `LEVELS`                                               |
| `feel.js`          | `createFeel(ctx2)`                                                                     |
| `a11y.js`          | `createAnnouncer`, `prefersReducedMotion`, `trapFocus`, `onActivate`                   |
| `progress.js`      | `reportScore`, `saveProgress`, `loadProgress`, `flushQueue`                            |
| `grid.js`          | `createGrid(ctx, { n, cell, origin })`                                                 |
| `geometry-math.js` | `rectArea`, `triangleArea`, `polygonArea`, `compositeArea`, `prismVolume`, `decompose` |
| `label3d.js`       | `makeLabel(text, opts)`, `updateLabel(sprite, text)`                                   |
| `game-base.js`     | `mountGame(mountEl, gameModule, options)`                                              |
| `index.js`         | barrel re-export of all of the above                                                   |

See `demo.html` for a complete, runnable Cube-Sum game using the full pipeline.
