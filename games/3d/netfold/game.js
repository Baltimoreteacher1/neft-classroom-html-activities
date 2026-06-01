// NetFold Arena — "Match the net, fold the solid" (CCSS 6.G.A.4)
// Each round shows a translucent gold TARGET solid (rotating hologram) plus
// several flat NETS on the deck. Exactly one net folds into the target. The
// student highlights a net (←/→ or tap) and presses Space to FOLD it. A correct
// fold locks in, bursts particles, and reveals the surface area as a worked sum
// of the faces. A wrong net honestly folds into a DIFFERENT real solid, then
// unfolds and costs a life. This is a spatial game: the scored action is
// choosing + folding a net, not picking a multiple-choice answer.
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { compositeArea } from "/games/engine3d/geometry-math.js";

const COLORS = {
  target: 0xf2c15b, // gold hologram
  netFace: 0x5fa0e6, // flat net panels (idle)
  netEdge: 0x0e2542, // panel outlines
  highlight: 0x35e0d6, // selected net glow
  ok: 0x55c98a,
  bad: 0xe05a3a,
  ring: 0x35e0d6,
};

// ---- Surface-area builders (exact, via compositeArea) -----------------------
// Returns { faces:[{type,w,h}|{type,base,height}], sa, worked } where `worked`
// is a human "sum of faces" string for the reveal.
function cubeFaces(s) {
  const faces = [];
  for (let i = 0; i < 6; i++) faces.push({ type: "rect", w: s, h: s });
  const sa = compositeArea(faces);
  return { faces, sa, worked: `SA = 6 × (${s}×${s}) = ${sa} sq units` };
}
function prismFaces(l, w, h) {
  const faces = [
    { type: "rect", w: l, h: w },
    { type: "rect", w: l, h: w },
    { type: "rect", w: l, h: h },
    { type: "rect", w: l, h: h },
    { type: "rect", w: w, h: h },
    { type: "rect", w: w, h: h },
  ];
  const sa = compositeArea(faces);
  return {
    faces,
    sa,
    worked: `SA = 2(${l}×${w} + ${l}×${h} + ${w}×${h}) = ${sa} sq units`,
  };
}
function pyramidFaces(b, m) {
  // Square base + 4 triangles (base b, slant height m).
  const faces = [
    { type: "rect", w: b, h: b },
    { type: "triangle", base: b, height: m },
    { type: "triangle", base: b, height: m },
    { type: "triangle", base: b, height: m },
    { type: "triangle", base: b, height: m },
  ];
  const sa = compositeArea(faces);
  return {
    faces,
    sa,
    worked: `SA = ${b}×${b} + 4 × (½ × ${b} × ${m}) = ${sa} sq units`,
  };
}

// Compact SA string for Level 2.
function compactWorked(spec) {
  if (spec.type === "cube") return `SA = ${spec.sa} sq units`;
  if (spec.type === "prism") return `SA = ${spec.sa} sq units`;
  return `SA = ${spec.sa} sq units`;
}

// ---- Solid spec factories (dims chosen so SA is a clean integer) ------------
function cube(s) {
  const f = cubeFaces(s);
  return { type: "cube", s, sa: f.sa, faces: f.faces, worked: f.worked };
}
function prism(l, w, h) {
  const f = prismFaces(l, w, h);
  return {
    type: "prism",
    l,
    w,
    h,
    sa: f.sa,
    faces: f.faces,
    worked: f.worked,
  };
}
function pyramid(b, m) {
  // require m > b/2 for a valid apex above center
  const f = pyramidFaces(b, m);
  return { type: "pyramid", b, m, sa: f.sa, faces: f.faces, worked: f.worked };
}

// Full-spec equality: a candidate net only counts as correct if it is the same
// TYPE *and* the same DIMENSIONS as the target. Comparing type alone let a
// same-type net with different dimensions pass. For prisms the three edge
// lengths are compared as a sorted multiset, so a prism that is merely rotated
// (e.g. 3×2×4 vs 4×2×3) still matches, while a genuinely different prism fails.
function specsMatch(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === "cube") return a.s === b.s;
  if (a.type === "prism") {
    const da = [a.l, a.w, a.h].sort((x, y) => x - y);
    const db = [b.l, b.w, b.h].sort((x, y) => x - y);
    return da[0] === db[0] && da[1] === db[1] && da[2] === db[2];
  }
  if (a.type === "pyramid") return a.b === b.b && a.m === b.m;
  // Unknown type: fall back to surface-area equality as a last guard.
  return a.sa === b.sa;
}

function solidName(spec) {
  if (spec.type === "cube") return "cube";
  if (spec.type === "prism") return "rectangular prism";
  return "square pyramid";
}

// ---- Level definitions ------------------------------------------------------
// Level 1: cube + rect prism only, 2 nets/round, name shown, face dims labeled,
//          5 lives, 5 rounds, full worked SA.
// Level 2: + square pyramid, 3 nets/round, name hidden, no face labels,
//          3 lives, 6 rounds, compact SA.
function makeLevel(level) {
  if (level === 1) {
    return {
      lives: 5,
      candidates: 2,
      showName: true,
      labelFaces: true,
      compactSA: false,
      rounds: [
        { target: cube(2), distractors: [prism(2, 3, 4)] },
        { target: prism(3, 2, 4), distractors: [cube(3)] },
        { target: cube(3), distractors: [prism(2, 2, 5)] },
        { target: prism(4, 3, 2), distractors: [cube(4)] },
        { target: prism(5, 2, 3), distractors: [cube(2)] },
      ],
    };
  }
  return {
    lives: 3,
    candidates: 3,
    showName: false,
    labelFaces: false,
    compactSA: true,
    rounds: [
      { target: cube(3), distractors: [prism(2, 3, 4), pyramid(4, 5)] },
      { target: prism(4, 3, 2), distractors: [cube(2), pyramid(6, 5)] },
      { target: pyramid(4, 6), distractors: [cube(4), prism(3, 4, 5)] },
      { target: prism(5, 4, 3), distractors: [cube(3), pyramid(6, 8)] },
      { target: cube(4), distractors: [pyramid(4, 5), prism(2, 5, 6)] },
      { target: pyramid(6, 8), distractors: [cube(5), prism(4, 4, 6)] },
    ],
  };
}

// ============================================================================
// Geometry: build a flat NET as a tree of pivot Groups that fold up into +Y.
// Everything starts flat in the XZ plane (y≈0). Folding animates each pivot's
// rotation.x from 0 toward its fold target * t (t: 0→1).
// ============================================================================
function buildNet(THREE, spec, faceMat, edgeMat, opts = {}) {
  const root = new THREE.Group();
  const pivots = []; // { group, target } — fold target rotation.x

  // Build a rectangular panel that lies flat in local XZ, extending from local
  // z=0 (the hinge) to z=depth. width along local X, centered on x=0.
  function rectPanel(width, depth) {
    const g = new THREE.BufferGeometry();
    const hw = width / 2;
    const verts = new Float32Array([
      -hw,
      0,
      0,
      hw,
      0,
      0,
      hw,
      0,
      depth,
      -hw,
      0,
      depth,
    ]);
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, faceMat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat);
    mesh.add(edges);
    mesh.userData._geos = [g, edges.geometry];
    return mesh;
  }

  // A rectangle centered on the origin in the XZ plane (used for base faces,
  // which are not hinged). width along X, depth along Z, both centered.
  function centerRectPanel(width, depth) {
    const g = new THREE.BufferGeometry();
    const hw = width / 2;
    const hd = depth / 2;
    const verts = new Float32Array([
      -hw,
      0,
      -hd,
      hw,
      0,
      -hd,
      hw,
      0,
      hd,
      -hw,
      0,
      hd,
    ]);
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, faceMat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat);
    mesh.add(edges);
    mesh.userData._geos = [g, edges.geometry];
    return mesh;
  }

  // Triangular panel: base along local X (hinge), apex at local (0,0,height).
  function triPanel(base, height) {
    const g = new THREE.BufferGeometry();
    const hb = base / 2;
    const verts = new Float32Array([-hb, 0, 0, hb, 0, 0, 0, 0, height]);
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, faceMat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat);
    mesh.add(edges);
    mesh.userData._geos = [g, edges.geometry];
    return mesh;
  }

  // Make a hinge pivot at a base edge: outward orientation via rotation.y.
  // dir: "+z" | "-z" | "+x" | "-x". The pivot sits at the hinge line, and its
  // local +Z points outward from the base.
  function sidePivot(dir, halfL, halfW) {
    const g = new THREE.Group();
    if (dir === "+z") {
      g.position.set(0, 0, halfW);
      g.rotation.y = 0;
    } else if (dir === "-z") {
      g.position.set(0, 0, -halfW);
      g.rotation.y = Math.PI;
    } else if (dir === "+x") {
      g.position.set(halfL, 0, 0);
      g.rotation.y = Math.PI / 2;
    } else {
      g.position.set(-halfL, 0, 0);
      g.rotation.y = -Math.PI / 2;
    }
    return g;
  }

  if (spec.type === "cube" || spec.type === "prism") {
    const L = spec.type === "cube" ? spec.s : spec.l; // along X
    const W = spec.type === "cube" ? spec.s : spec.w; // along Z
    const H = spec.type === "cube" ? spec.s : spec.h; // up
    const halfL = L / 2;
    const halfW = W / 2;

    // Base face L(x) × W(z), flat at origin (root, not hinged).
    const base = centerRectPanel(L, W);
    root.add(base);

    // 4 side pivots. Each side: width(localX)=edge length, depth(localZ)=H.
    // +Z and -Z sides span L; +X and -X sides span W.
    const sZpos = sidePivot("+z", halfL, halfW);
    const pZpos = rectPanel(L, H);
    sZpos.add(pZpos);

    const sZneg = sidePivot("-z", halfL, halfW);
    const pZneg = rectPanel(L, H);
    sZneg.add(pZneg);

    const sXpos = sidePivot("+x", halfL, halfW);
    const pXpos = rectPanel(W, H);
    sXpos.add(pXpos);

    const sXneg = sidePivot("-x", halfL, halfW);
    const pXneg = rectPanel(W, H);
    sXneg.add(pXneg);

    root.add(sZpos, sZneg, sXpos, sXneg);
    const sideTarget = -Math.PI / 2;
    pivots.push(
      { group: sZpos, target: sideTarget },
      { group: sZneg, target: sideTarget },
      { group: sXpos, target: sideTarget },
      { group: sXneg, target: sideTarget },
    );

    // TOP face: child of +Z side pivot, placed at parent-local (0,0,H), default
    // orientation; folds child rotation.x = -π/2 so it lays across the top.
    // depth(localZ)=W, width(localX)=L.
    const sTop = new THREE.Group();
    sTop.position.set(0, 0, H);
    const pTop = rectPanel(L, W);
    sTop.add(pTop);
    sZpos.add(sTop);
    pivots.push({ group: sTop, target: -Math.PI / 2 });
  } else {
    // SQUARE PYRAMID: base b×b flat (root). 4 triangular flaps on base edges.
    const b = spec.b;
    const m = spec.m; // slant height
    const halfB = b / 2;

    const base = centerRectPanel(b, b);
    root.add(base);

    // Fold target: apexes meet above center at height sqrt(m²-(b/2)²).
    const foldTarget = -Math.acos(halfB / m);
    const dirs = ["+z", "-z", "+x", "-x"];
    for (const dir of dirs) {
      const piv = sidePivot(dir, halfB, halfB);
      piv.add(triPanel(b, m));
      root.add(piv);
      pivots.push({ group: piv, target: foldTarget });
    }
  }

  return { root, pivots };
}

export default {
  id: "netfold-arena",
  totalSteps: 6, // rounds per level (Level 2); Level 1 uses 5
  vocab: [
    {
      term: "Net",
      definition:
        "A flat shape that folds up to make a 3D solid. Every face is shown unfolded.",
      emoji: "📰",
    },
    {
      term: "Face",
      definition: "One flat surface of a 3D solid, like one side of a box.",
      emoji: "⬜",
    },
    {
      term: "Edge",
      definition: "A line where two faces of a solid meet.",
      emoji: "📏",
    },
    {
      term: "Fold",
      definition: "To bend a flat net along its edges to build the solid.",
      emoji: "🙏",
    },
    {
      term: "Surface area",
      definition:
        "The total area of all the faces of a solid, in square units.",
      emoji: "▦",
    },
    {
      term: "Solid",
      definition:
        "A 3D shape such as a cube, a rectangular prism, or a pyramid.",
      emoji: "🧊",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      renderer,
      input,
      hud,
      feel,
      announce,
      THREE,
      level,
      onScore,
      onFrame,
    } = ctx;

    const cfg = makeLevel(level);
    const totalRounds = cfg.rounds.length;

    if (typeof hud.setLevel === "function")
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    // ---- Scene group + disposable tracking ----------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };

    // Shared materials (reused across nets for performance).
    const faceMat = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.netFace,
        roughness: 0.55,
        metalness: 0.1,
        side: THREE.DoubleSide,
        emissive: COLORS.netFace,
        emissiveIntensity: 0.08,
      }),
    );
    const faceMatHi = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.highlight,
        roughness: 0.45,
        metalness: 0.12,
        side: THREE.DoubleSide,
        emissive: COLORS.highlight,
        emissiveIntensity: 0.45,
      }),
    );
    const edgeMat = track(
      new THREE.LineBasicMaterial({ color: COLORS.netEdge }),
    );

    // Build deck.
    const deckGeo = track(new THREE.BoxGeometry(22, 0.4, 12));
    const deckMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x14304f,
        roughness: 0.85,
        metalness: 0.14,
        emissive: 0x14304f,
        emissiveIntensity: 0.1,
      }),
    );
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = -0.22;
    deck.receiveShadow = true;
    group.add(deck);

    // Target hologram material (translucent gold).
    const targetMat = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.target,
        transparent: true,
        opacity: 0.42,
        emissive: COLORS.target,
        emissiveIntensity: 0.55,
        roughness: 0.4,
        side: THREE.DoubleSide,
      }),
    );

    // Selection ring under highlighted net.
    const ringGeo = track(new THREE.RingGeometry(2.0, 2.3, 32));
    const ringMat = track(
      new THREE.MeshBasicMaterial({
        color: COLORS.ring,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
    );
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    group.add(ring);

    // ---- Target solid hologram ----------------------------------------------
    const targetGroup = new THREE.Group();
    targetGroup.position.set(0, 4.4, -3);
    group.add(targetGroup);

    // Card label (floats above target).
    const cardLabel = makeLabel("", {
      THREE,
      fontSize: 56,
      scale: 1.1,
      color: "#ffffff",
      background: "rgba(13,32,56,0.92)",
    });
    cardLabel.position.set(0, 7.6, -3);
    group.add(cardLabel);

    // ---- Per-round state ----------------------------------------------------
    let roundIndex = 0;
    let lives = cfg.lives;
    let solvedCount = 0;
    let candidates = []; // { spec, net:{root,pivots}, isCorrect, baseX, labels[] }
    let selected = 0;
    let folding = false;
    let locked = false; // round solved, awaiting next
    let introDone = false;
    let gameOver = false;

    const frameUnbinders = [];
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    let unbindPress = null;
    let unbindTap = null;

    // ---- Target build -------------------------------------------------------
    function buildTargetMesh(spec) {
      let geo;
      if (spec.type === "cube") {
        geo = new THREE.BoxGeometry(spec.s, spec.s, spec.s);
      } else if (spec.type === "prism") {
        geo = new THREE.BoxGeometry(spec.l, spec.h, spec.w);
      } else {
        // square pyramid: ConeGeometry with 4 radial segments. Base diagonal
        // = b√2 → radius = b/√2. Height from slant: sqrt(m² - (b/2)²).
        const radius = (spec.b / 2) * Math.SQRT2;
        const height = Math.sqrt(
          Math.max(0.01, spec.m * spec.m - (spec.b / 2) * (spec.b / 2)),
        );
        geo = new THREE.ConeGeometry(radius, height, 4);
        geo.rotateY(Math.PI / 4);
      }
      const mesh = new THREE.Mesh(geo, targetMat);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: COLORS.target }),
      );
      mesh.add(edges);
      mesh.userData._geos = [geo, edges.geometry];
      return mesh;
    }

    function clearTarget() {
      while (targetGroup.children.length) {
        const m = targetGroup.children.pop();
        if (m.userData._geos) m.userData._geos.forEach((g) => g.dispose());
        m.traverse((o) => {
          if (o.material && o.material !== targetMat) o.material.dispose();
        });
      }
    }

    function disposeNet(net) {
      net.root.traverse((o) => {
        if (o.userData && o.userData._geos)
          o.userData._geos.forEach((g) => g && g.dispose());
      });
    }

    function clearCandidates() {
      candidates.forEach((c) => {
        group.remove(c.net.root);
        disposeNet(c.net);
        (c.labels || []).forEach((lab) => {
          group.remove(lab);
          if (lab.material.map) lab.material.map.dispose();
          lab.material.dispose();
        });
      });
      candidates = [];
    }

    // Apply fold progress t (0..1) to a net.
    function applyFold(net, t) {
      net.pivots.forEach((p) => {
        p.group.rotation.x = p.target * t;
      });
    }

    // ---- Dimension labels for the target ------------------------------------
    let targetLabels = [];
    function clearTargetLabels() {
      targetLabels.forEach((lab) => {
        group.remove(lab);
        if (lab.material.map) lab.material.map.dispose();
        lab.material.dispose();
      });
      targetLabels = [];
    }
    function addTargetDimLabel(text) {
      const lab = makeLabel(text, { THREE, fontSize: 48, scale: 0.7 });
      lab.position.set(0, 1.0, -3);
      group.add(lab);
      targetLabels.push(lab);
    }

    function targetDimsText(spec) {
      if (spec.type === "cube") return `side = ${spec.s}`;
      if (spec.type === "prism") return `${spec.l} × ${spec.w} × ${spec.h}`;
      return `base = ${spec.b}, slant = ${spec.m}`;
    }

    // ---- Round setup --------------------------------------------------------
    function startRound() {
      clearCandidates();
      clearTarget();
      clearTargetLabels();
      folding = false;
      locked = false;
      selected = 0;

      const r = cfg.rounds[roundIndex];

      // Target hologram.
      targetGroup.add(buildTargetMesh(r.target));

      // Dimension label under the target (Level 1 + 2 both show dims).
      addTargetDimLabel(targetDimsText(r.target));

      // Assemble candidate specs: correct + distractors, shuffled.
      const specs = [r.target, ...r.distractors].slice(0, cfg.candidates);
      shuffle(specs);

      // Lay nets spaced along X.
      const span = cfg.candidates === 2 ? 7 : 6.5;
      const start = (-(specs.length - 1) * span) / 2;
      specs.forEach((spec, i) => {
        const net = buildNet(THREE, spec, faceMat, edgeMat);
        const baseX = start + i * span;
        net.root.position.set(baseX, 0.02, 2.4);
        applyFold(net, 0);
        group.add(net.root);

        const cand = {
          spec,
          net,
          isCorrect: specsMatch(spec, r.target),
          baseX,
          labels: [],
        };

        // Level 1: label the face dims on each net.
        if (cfg.labelFaces) {
          const lab = makeLabel(faceDimText(spec), {
            THREE,
            fontSize: 42,
            scale: 0.55,
          });
          lab.position.set(baseX, 0.6, 5.6);
          group.add(lab);
          cand.labels.push(lab);
        }

        candidates.push(cand);
      });

      highlightSelected();
      updateCard();
      updateObjective();

      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, totalRounds);
      if (typeof hud.setLives === "function") hud.setLives(lives);

      const nameOrShape = cfg.showName
        ? `this ${solidName(r.target)}`
        : "this solid";
      if (clarity)
        clarity.setTarget(
          cfg.showName
            ? `${solidName(r.target)} · ${targetDimsText(r.target)}`
            : targetDimsText(r.target),
        );

      announce(
        `Round ${roundIndex + 1} of ${totalRounds}. Which net folds into ${nameOrShape}? Highlight a net and press Space to fold it.`,
      );
      if (typeof feel.sfx === "function")
        feel.sfx("select", "New target solid.");
    }

    function faceDimText(spec) {
      if (spec.type === "cube") return `${spec.s} × ${spec.s} faces`;
      if (spec.type === "prism") return `${spec.l} × ${spec.w} × ${spec.h}`;
      return `base ${spec.b}, slant ${spec.m}`;
    }

    function updateCard() {
      const r = cfg.rounds[roundIndex];
      const namePart = cfg.showName
        ? `Target: ${solidName(r.target)}`
        : `Target solid`;
      updateLabel(cardLabel, `${namePart}\nWhich net folds into it?`);
    }

    function updateObjective() {
      const r = cfg.rounds[roundIndex];
      const shape = cfg.showName ? solidName(r.target) : "solid";
      const text = `Round ${roundIndex + 1}: Which net folds into this ${shape}? Highlight it and press Space to fold.`;
      hud.setObjective(text);
      if (clarity) clarity.setObjective(text);
    }

    function highlightSelected() {
      candidates.forEach((c, i) => {
        const on = i === selected;
        c.net.root.traverse((o) => {
          if (o.isMesh) o.material = on ? faceMatHi : faceMat;
        });
      });
      const c = candidates[selected];
      if (c) {
        ring.visible = true;
        ring.position.set(c.baseX, 0.03, 2.4 + 1.0);
      } else {
        ring.visible = false;
      }
    }

    function moveSelection(d) {
      if (folding || locked || gameOver) return;
      const n = candidates.length;
      selected = (selected + d + n) % n;
      highlightSelected();
      if (typeof feel.sfx === "function") feel.sfx("select");
      announce(`Net ${selected + 1} of ${n} highlighted.`);
    }

    // ---- Fold + check -------------------------------------------------------
    function foldSelected() {
      if (folding || locked || gameOver || !introDone) return;
      const c = candidates[selected];
      if (!c) return;
      folding = true;
      announce("Folding the net.");
      if (typeof feel.sfx === "function") feel.sfx("pop");

      const dur = feel.reducedMotion ? 0.25 : 0.9;
      feel.tween({
        from: 0,
        to: 1,
        duration: dur,
        onUpdate: (v) => {
          // gentle ease-in-out
          const e = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
          applyFold(c.net, e);
        },
        onComplete: () => {
          folding = false;
          if (c.isCorrect) onCorrectFold(c);
          else onWrongFold(c);
        },
      });
    }

    function onCorrectFold(c) {
      locked = true;
      solvedCount += 1;
      const r = cfg.rounds[roundIndex];

      // Particle burst at the folded solid.
      const p = c.net.root.position;
      feel.burst(
        { x: p.x, y: 2.0, z: p.z },
        { color: COLORS.target, count: 40, spread: 4.5 },
      );
      if (typeof feel.sfx === "function") feel.sfx("correct");
      feel.shake(0.3);

      // Tint the solved net gold.
      c.net.root.traverse((o) => {
        if (o.isMesh) o.material = targetMat;
      });
      ring.visible = false;

      // SA reveal.
      const worked = cfg.compactSA ? compactWorked(r.target) : r.target.worked;
      const okMsg = `Correct! ${worked}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2800 });
      else hud.message(okMsg, { tone: "ok", duration: 2800 });
      updateLabel(cardLabel, `Match!\n${worked}`);
      announce(
        `Correct. That net folds into the ${solidName(r.target)}. Surface area is ${r.target.sa} square units.`,
      );

      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const lifeBonus = lives === cfg.lives ? 5 : 0;
      const pts = base + levelBonus + lifeBonus;
      onScore(pts, {
        round: roundIndex + 1,
        solid: r.target.type,
        sa: r.target.sa,
      });

      later(() => {
        if (roundIndex < totalRounds - 1) {
          roundIndex += 1;
          startRound();
        } else {
          finishGame();
        }
      }, 3000);
    }

    function onWrongFold(c) {
      const r = cfg.rounds[roundIndex];
      lives -= 1;
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (typeof feel.sfx === "function") feel.sfx("wrong");
      feel.shake(0.18);

      const msg = `That net makes a ${solidName(c.spec)}, not a ${solidName(r.target)}.`;
      if (typeof hud.feedback === "function")
        hud.feedback(false, msg, { duration: 2600 });
      else hud.message(msg, { tone: "warn", duration: 2600 });
      announce(`${msg} It will unfold. Try another net.`);

      // Unfold it back flat, then resume (unless game over).
      const dur = feel.reducedMotion ? 0.2 : 0.6;
      folding = true;
      feel.tween({
        from: 1,
        to: 0,
        duration: dur,
        onUpdate: (v) => applyFold(c.net, v),
        onComplete: () => {
          folding = false;
          if (lives <= 0) loseGame();
        },
      });
    }

    function finishGame() {
      hud.setObjective(
        `Done! You matched ${solvedCount} of ${totalRounds} solids. Great spatial work!`,
      );
      hud.message("All solids matched!", { tone: "ok", duration: 0 });
      if (typeof feel.sfx === "function")
        feel.sfx("fanfare", "All solids matched!");
      updateLabel(cardLabel, `Arena cleared!\nYou matched every solid.`);
      if (!feel.reducedMotion) {
        for (let i = 0; i < 6; i++) {
          later(
            () =>
              feel.burst(
                {
                  x: (Math.random() - 0.5) * 12,
                  y: 2 + Math.random() * 2,
                  z: (Math.random() - 0.5) * 4,
                },
                { color: COLORS.target, count: 28, spread: 5 },
              ),
            i * 180,
          );
        }
      }
      announce(
        `All rounds complete. You matched ${solvedCount} solids and learned to read their surface area. Great work.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Arena cleared!",
          badge: "🧊",
          stats: `You matched all ${totalRounds} solids. Score saved.`,
        });
      }
    }

    function loseGame() {
      gameOver = true;
      hud.message("Out of tries!", { tone: "warn", duration: 0 });
      if (typeof feel.sfx === "function") feel.sfx("wrong");
      announce(
        `Out of tries. You matched ${solvedCount} of ${totalRounds} solids. Press Play again to try once more.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.lose({
          titleEn: "Out of tries!",
          badge: "🔁",
          stats: `You matched ${solvedCount} of ${totalRounds} solids. Try again!`,
        });
      }
    }

    // ---- Pointer tap → pick / fold ------------------------------------------
    function netRootForObject(obj) {
      // Walk up to find which candidate's root contains this object.
      for (const c of candidates) {
        let found = false;
        c.net.root.traverse((o) => {
          if (o === obj) found = true;
        });
        if (found) return c;
      }
      return null;
    }

    function onTap() {
      if (folding || locked || gameOver || !introDone) return;
      const meshes = [];
      candidates.forEach((c) =>
        c.net.root.traverse((o) => {
          if (o.isMesh) meshes.push(o);
        }),
      );
      const hits = input.raycast(camera, meshes, true);
      if (!hits.length) return;
      const c = netRootForObject(hits[0].object);
      if (!c) return;
      const idx = candidates.indexOf(c);
      if (idx === selected) {
        // Second tap on the already-selected net = fold it.
        foldSelected();
      } else {
        selected = idx;
        highlightSelected();
        if (typeof feel.sfx === "function") feel.sfx("select");
        announce(`Net ${selected + 1} highlighted. Tap again to fold.`);
      }
    }

    // ---- Camera intro -------------------------------------------------------
    function cameraIntro() {
      const targetPos = { x: 0, y: 9, z: 12 };
      if (feel.reducedMotion) {
        camera.position.set(targetPos.x, targetPos.y, targetPos.z);
        camera.lookAt(0, 2.5, -1);
        feel.syncCamera();
        introDone = true;
        return;
      }
      const start = { x: -7, y: 13, z: 15 };
      camera.position.set(start.x, start.y, start.z);
      camera.lookAt(0, 2.5, -1);
      feel.tween({
        from: 0,
        to: 1,
        duration: 1.4,
        onUpdate: (v) => {
          camera.position.set(
            start.x + (targetPos.x - start.x) * v,
            start.y + (targetPos.y - start.y) * v,
            start.z + (targetPos.z - start.z) * v,
          );
          camera.lookAt(0, 2.5, -1);
        },
        onComplete: () => {
          feel.syncCamera();
          introDone = true;
        },
      });
    }

    return {
      start() {
        cameraIntro();

        function beginGameplay() {
          roundIndex = 0;
          lives = cfg.lives;
          solvedCount = 0;
          gameOver = false;
          startRound();

          unbindPress = input.onPress((name) => {
            if (gameOver) return;
            if (name === "left") moveSelection(-1);
            else if (name === "right") moveSelection(1);
            else if (name === "up") moveSelection(-1);
            else if (name === "down") moveSelection(1);
            else if (name === "action" || name === "confirm") foldSelected();
          });

          unbindTap = input.onTap(onTap);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "NetFold Arena — Match the Net, Fold the Solid",
          objectiveEn:
            "Look at the gold target solid. Pick the flat net that folds into it, then fold it to check. Match every solid to win.",
          objectiveEs:
            "Mira el sólido dorado. Elige la red plana que se pliega para formarlo y pliégala para comprobar. Empareja todos los sólidos para ganar.",
          standard: "6.G.A.4 · Nets & Surface Area",
          controls: [
            {
              key: "← / →",
              actionEn: "Highlight a different net",
              actionEs: "Resalta otra red",
            },
            {
              key: "Space",
              actionEn: "Fold the highlighted net to check it",
              actionEs: "Pliega la red resaltada para comprobarla",
            },
            {
              key: "Tap / Click",
              actionEn: "Tap a net to pick it, tap again to fold",
              actionEs: "Toca una red para elegirla, toca otra vez para plegar",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "A net is correct when it folds into the target solid. Surface area is the total area of all its faces. Match all the solids before your tries run out.",
          howToWinEs:
            "Una red es correcta cuando se pliega para formar el sólido objetivo. El área de superficie es el área total de todas sus caras. Empareja todos los sólidos antes de quedarte sin intentos.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        // Idle motion: rotate the target hologram + gentle card bob.
        if (!feel.reducedMotion) {
          frameUnbinders.push(
            onFrame((dt, t) => {
              targetGroup.rotation.y += dt * 0.6;
              cardLabel.position.y = 7.6 + Math.sin(t * 1.2) * 0.12;
              if (ring.visible) {
                ringMat.opacity = 0.6 + Math.sin(t * 5) * 0.25;
              }
            }),
          );
        } else {
          // Still face the target sensibly without spinning.
          targetGroup.rotation.y = Math.PI / 6;
        }
      },

      dispose() {
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        frameUnbinders.forEach((u) => u && u());
        frameUnbinders.length = 0;
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearCandidates();
        clearTarget();
        clearTargetLabels();
        if (cardLabel.material.map) cardLabel.material.map.dispose();
        cardLabel.material.dispose();
        scene.remove(group);
        disposables.forEach((d) => d && d.dispose && d.dispose());
      },
    };
  },
};

// ---- small util -------------------------------------------------------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
