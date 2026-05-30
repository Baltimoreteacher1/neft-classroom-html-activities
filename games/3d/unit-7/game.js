const COLORS = {
  skyDeep: 0x0b3d66,
  water: 0x1f6f9c,
  waterDeep: 0x0a2c4a,
  surface: 0xbfe6ff,
  sub: 0xf2c15b,
  subTrim: 0xd9795d,
  target: 0x4aa978,
  targetBad: 0xb64e2f,
  tick: 0xbfe6ff,
  tickZero: 0xffffff,
  marker: 0x8b6fc4,
  ghost: 0xead24a,
};

const UNIT = 0.62; // world units per integer step on the number line

// Each round names a span [min, max] so the number line redraws to fit the
// problem. Difficulty rises by widening the range and varying the kind.
function makeLevel(level) {
  if (level === 1) {
    // Support: gentle ranges, hints on. Builds from simple moves to opposites,
    // a first taste of absolute value (distance), comparing, and ordering.
    return {
      hints: true,
      basePoints: 20,
      rounds: [
        { kind: "move", target: 3, min: -5, max: 5 },
        { kind: "move", target: -4, min: -5, max: 5 },
        { kind: "opposite", value: 2, min: -5, max: 5 },
        { kind: "opposite", value: -5, min: -5, max: 5 },
        {
          kind: "absolute",
          value: -3,
          context: "A diver is 3 m below sea level.",
          min: -6,
          max: 6,
        },
        { kind: "compare", a: -2, b: 4, pick: "greater", min: -6, max: 6 },
        { kind: "compare", a: -6, b: -1, pick: "less", min: -7, max: 7 },
        { kind: "order", values: [-3, 1, 4], pick: "least", min: -7, max: 7 },
        {
          kind: "order",
          values: [-2, -6, 3],
          pick: "greatest",
          min: -7,
          max: 7,
        },
        {
          kind: "absolute",
          value: 5,
          context: "A gull flies 5 m above sea level.",
          min: -7,
          max: 7,
        },
      ],
    };
  }
  // Enrichment: wider ranges, hints off, includes distance-between-integers and
  // ordering of four values with rising range.
  return {
    hints: false,
    basePoints: 30,
    rounds: [
      {
        kind: "absolute",
        value: -7,
        context: "A diver is 7 m below sea level.",
        min: -8,
        max: 8,
      },
      {
        kind: "absolute",
        value: 6,
        context: "A drone hovers 6 m above sea level.",
        min: -8,
        max: 8,
      },
      { kind: "opposite", value: -9, min: -10, max: 10 },
      { kind: "compare", a: -8, b: -3, pick: "greater", min: -10, max: 10 },
      { kind: "compare", a: 5, b: -9, pick: "less", min: -10, max: 10 },
      // Distance between two depths: |a - b|. Pilot to that distance (a count).
      {
        kind: "distance",
        a: 4,
        b: -3,
        context: "A whale at -3 m and a buoy at +4 m.",
        min: -10,
        max: 10,
      },
      {
        kind: "distance",
        a: -8,
        b: -2,
        context: "Two divers at -8 m and -2 m.",
        min: -10,
        max: 10,
      },
      {
        kind: "order",
        values: [-6, -2, 3, 8],
        pick: "greatest",
        min: -10,
        max: 10,
      },
      {
        kind: "order",
        values: [9, -4, -10, 2],
        pick: "least",
        min: -11,
        max: 11,
      },
      {
        kind: "order",
        values: [-11, 7, -5, 12],
        pick: "greatest",
        min: -12,
        max: 12,
      },
      {
        kind: "absolute",
        value: -12,
        context: "A submersible dives to 12 m below sea level.",
        min: -12,
        max: 12,
      },
      { kind: "opposite", value: 11, min: -12, max: 12 },
    ],
  };
}

export default {
  id: "unit-7-submarine",
  vocab: [
    {
      term: "Integer",
      definition: "A whole number that can be positive, negative, or zero.",
      emoji: "🔢",
    },
    {
      term: "Negative number",
      definition:
        "A number less than zero, like -3. Here it means below the surface.",
      emoji: "⬇️",
    },
    {
      term: "Opposite",
      definition:
        "Two numbers the same distance from zero, on opposite sides. 4 and -4 are opposites.",
      emoji: "↕️",
    },
    {
      term: "Number line",
      definition:
        "A line where numbers are placed in order. Up is positive, down is negative.",
      emoji: "📏",
    },
    {
      term: "Absolute value",
      definition:
        "How far a number is from zero. It is never negative. The absolute value of -7 is 7.",
      emoji: "📐",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      input,
      hud,
      feel,
      announce,
      caption,
      THREE,
      level,
      onScore,
    } = ctx;

    const cfg = makeLevel(level);

    // Integer -> world Y. 0 sits at sea level (y = 0).
    const yFor = (n) => n * UNIT;

    const group = new THREE.Group();
    scene.add(group);
    const disposables = [];
    const track = (obj) => {
      if (obj.geometry) disposables.push(obj.geometry);
      if (obj.material) disposables.push(obj.material);
      return obj;
    };

    // ---- Number-line scenery rebuilt per range ----
    // We rebuild the water column / ticks / labels each round so the line can
    // grow with the difficulty. These live in a child group we can clear.
    let lineGroup = new THREE.Group();
    group.add(lineGroup);
    let RANGE_MIN = cfg.rounds[0].min;
    let RANGE_MAX = cfg.rounds[0].max;
    let columnMidY = 0;

    function clearLine() {
      lineGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      group.remove(lineGroup);
      lineGroup = new THREE.Group();
      group.add(lineGroup);
    }

    function makeLabel(text, big) {
      const cv = document.createElement("canvas");
      cv.width = 96;
      cv.height = 64;
      const c = cv.getContext("2d");
      c.fillStyle = big ? "#ffffff" : "#bfe6ff";
      c.font = (big ? "bold 44px " : "bold 36px ") + "system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 48, 34);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.scale.set(0.7, 0.46, 1);
      return spr;
    }

    function buildLine(min, max) {
      clearLine();
      RANGE_MIN = min;
      RANGE_MAX = max;
      const columnHeight = (RANGE_MAX - RANGE_MIN) * UNIT + UNIT * 2;
      columnMidY = (yFor(RANGE_MAX) + yFor(RANGE_MIN)) / 2;

      const water = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, columnHeight, 3.2),
        new THREE.MeshStandardMaterial({
          color: COLORS.water,
          transparent: true,
          opacity: 0.32,
          roughness: 0.85,
        }),
      );
      water.position.y = columnMidY;
      lineGroup.add(water);

      const surface = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.06, 3.6),
        new THREE.MeshStandardMaterial({
          color: COLORS.surface,
          transparent: true,
          opacity: 0.5,
          emissive: COLORS.surface,
          emissiveIntensity: 0.25,
        }),
      );
      surface.position.y = 0;
      lineGroup.add(surface);

      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.4, 4),
        new THREE.MeshStandardMaterial({
          color: COLORS.waterDeep,
          roughness: 1,
        }),
      );
      bed.position.y = yFor(RANGE_MIN) - UNIT;
      lineGroup.add(bed);

      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, columnHeight, 0.05),
        new THREE.MeshStandardMaterial({ color: COLORS.tick }),
      );
      spine.position.set(-1.5, columnMidY, 0);
      lineGroup.add(spine);

      const tickGeo = new THREE.BoxGeometry(0.5, 0.05, 0.05);
      for (let n = RANGE_MIN; n <= RANGE_MAX; n++) {
        const isZero = n === 0;
        const tick = new THREE.Mesh(
          tickGeo.clone(),
          new THREE.MeshStandardMaterial({
            color: isZero ? COLORS.tickZero : COLORS.tick,
          }),
        );
        tick.position.set(-1.5, yFor(n), 0);
        tick.scale.x = isZero ? 1.5 : 1;
        lineGroup.add(tick);

        const label = makeLabel(String(n), isZero);
        label.position.set(-2.2, yFor(n), 0);
        lineGroup.add(label);
      }
      tickGeo.dispose();

      const seaLabel = makeLabel("0 = sea level", false);
      seaLabel.scale.set(1.5, 0.42, 1);
      seaLabel.position.set(0.9, 0.0, 1.7);
      lineGroup.add(seaLabel);
    }

    // ---- Submarine (persists across rounds) ----
    const subGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 0.7, 4, 10),
      new THREE.MeshStandardMaterial({
        color: COLORS.sub,
        roughness: 0.5,
        metalness: 0.15,
      }),
    );
    hull.rotation.z = Math.PI / 2;
    track(hull);
    subGroup.add(hull);

    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.26, 0.22),
      new THREE.MeshStandardMaterial({ color: COLORS.subTrim, roughness: 0.6 }),
    );
    tower.position.y = 0.34;
    track(tower);
    subGroup.add(tower);

    const windowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({
        color: COLORS.surface,
        emissive: COLORS.surface,
        emissiveIntensity: 0.4,
      }),
    );
    windowMesh.position.set(0.5, 0, 0);
    track(windowMesh);
    subGroup.add(windowMesh);

    subGroup.position.set(0, yFor(0), 0);
    group.add(subGroup);

    // ---- Target marker (depth band the sub must reach) ----
    const markerGeo = new THREE.BoxGeometry(1.1, UNIT * 0.5, 1.1);
    disposables.push(markerGeo);
    const marker = new THREE.Mesh(
      markerGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.target,
        transparent: true,
        opacity: 0.35,
        emissive: COLORS.target,
        emissiveIntensity: 0.4,
      }),
    );
    track(marker);
    marker.visible = false;
    group.add(marker);

    // ---- Ghost reference markers (e.g. the two depths in a distance round) ----
    const ghosts = [];
    function clearGhosts() {
      ghosts.forEach((g) => {
        lineGroup.remove(g);
        group.remove(g);
        if (g.geometry) g.geometry.dispose();
        if (g.material) {
          if (g.material.map) g.material.map.dispose();
          g.material.dispose();
        }
      });
      ghosts.length = 0;
    }
    function addGhost(n, text) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshStandardMaterial({
          color: COLORS.ghost,
          emissive: COLORS.ghost,
          emissiveIntensity: 0.5,
        }),
      );
      dot.position.set(-1.5, yFor(n), 0);
      group.add(dot);
      ghosts.push(dot);
      if (text) {
        const lbl = makeLabel(text, false);
        lbl.scale.set(0.95, 0.42, 1);
        lbl.position.set(-0.6, yFor(n), 0.2);
        group.add(lbl);
        ghosts.push(lbl);
      }
    }

    // ---- Round state ----
    let pos = 0; // current integer position of the sub
    let round = null;
    let roundIndex = 0;
    let targetInt = null; // integer the sub must reach
    let solved = false;
    let streak = 0; // consecutive correct
    let bestStreak = 0;
    let solvedCount = 0;
    let attempts = 0; // wrong confirms on the current round
    let unbindFrame = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function depthWord(n) {
      if (n > 0) return `${n} (${Math.abs(n)} above sea level)`;
      if (n < 0) return `${n} (${Math.abs(n)} below sea level)`;
      return "0 (at sea level)";
    }

    function setSubY(n, animate) {
      const toY = yFor(n);
      if (animate && !feel.reducedMotion) {
        const fromY = subGroup.position.y;
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.18,
          onUpdate: (t) => {
            subGroup.position.y = fromY + (toY - fromY) * t;
          },
        });
      } else {
        subGroup.position.y = toY;
      }
    }

    function updateHud() {
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
      const depthTxt =
        pos === 0
          ? "Depth 0 m (sea level)"
          : pos < 0
            ? `Depth ${Math.abs(pos)} m below`
            : `Height ${pos} m above`;
      hud.setObjective(
        roundObjective() + " — " + depthTxt + ` | position ${pos}`,
      );
    }

    function roundObjective() {
      if (!round) return "Pilot the submarine";
      switch (round.kind) {
        case "move":
          return `Pilot the submarine to ${round.target} on the number line, then confirm`;
        case "opposite":
          return `Pilot to the opposite of ${round.value}, then confirm`;
        case "absolute":
          return `Pilot to the integer for "${round.context}", then confirm`;
        case "compare":
          return `Pilot to the ${round.pick} of ${round.a} and ${round.b}, then confirm`;
        case "order":
          return `Pilot to the ${round.pick} of ${round.values.join(", ")}, then confirm`;
        case "distance":
          return `Pilot to the distance between ${round.a} and ${round.b}, then confirm`;
        default:
          return "Pilot the submarine";
      }
    }

    function computeTarget(r) {
      switch (r.kind) {
        case "move":
          return r.target;
        case "opposite":
          return -r.value;
        case "absolute":
          // The integer described by the context (the signed value itself).
          return r.value;
        case "compare":
          return r.pick === "greater" ? Math.max(r.a, r.b) : Math.min(r.a, r.b);
        case "order":
          return r.pick === "greatest"
            ? Math.max(...r.values)
            : Math.min(...r.values);
        case "distance":
          // |a - b| — a positive count; pilot up to that height.
          return Math.abs(r.a - r.b);
        default:
          return 0;
      }
    }

    function startRound() {
      solved = false;
      attempts = 0;
      round = cfg.rounds[roundIndex];
      targetInt = computeTarget(round);

      buildLine(round.min, round.max);
      clearGhosts();

      pos = 0;
      setSubY(0, false);

      marker.position.set(0, yFor(targetInt), 0);
      marker.material.color.setHex(COLORS.target);
      marker.visible = true;

      // Show reference dots for compare / order / distance rounds.
      if (round.kind === "compare") {
        addGhost(round.a, String(round.a));
        addGhost(round.b, String(round.b));
      } else if (round.kind === "order") {
        round.values.forEach((v) => addGhost(v, String(v)));
      } else if (round.kind === "distance") {
        addGhost(round.a, `A ${round.a}`);
        addGhost(round.b, `B ${round.b}`);
      }

      // Persistent "Step X of Y" for the whole game.
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);

      let intro;
      switch (round.kind) {
        case "move":
          intro = `Round ${roundIndex + 1}. Pilot the submarine to ${depthWord(round.target)}.`;
          break;
        case "opposite":
          intro = `Round ${roundIndex + 1}. Travel to the opposite of ${round.value}. Opposites are the same distance from 0 on the other side.`;
          break;
        case "absolute":
          intro = `Round ${roundIndex + 1}. ${round.context} Travel to that integer. Its absolute value is the distance from the surface.`;
          break;
        case "compare":
          intro = `Round ${roundIndex + 1}. Which is ${round.pick}, ${round.a} or ${round.b}? Pilot to it. Remember: higher on the line is greater.`;
          break;
        case "order":
          intro = `Round ${roundIndex + 1}. Of ${round.values.join(", ")}, pilot to the ${round.pick}.`;
          break;
        case "distance":
          intro = `Round ${roundIndex + 1}. ${round.context} How far apart are they? Pilot to that distance, the absolute value of ${round.a} minus ${round.b}.`;
          break;
        default:
          intro = `Round ${roundIndex + 1}.`;
      }
      announce(intro);
      updateHud();

      if (cfg.hints) {
        hud.message(
          "Use Up/Down (or the d-pad) to move. Press Space when you arrive.",
          { tone: "info", duration: 2800 },
        );
      } else {
        hud.message(
          "Up/Down to move. Space to confirm. Enter for a depth read-out.",
          { tone: "info", duration: 2200 },
        );
      }
    }

    function move(dir) {
      if (solved) return;
      const next = Math.max(RANGE_MIN, Math.min(RANGE_MAX, pos + dir));
      if (next === pos) {
        feel.shake(0.08);
        return;
      }
      pos = next;
      setSubY(pos, true);
      feel.burst(
        { x: 0, y: yFor(pos), z: 0 },
        { color: COLORS.surface, count: 6, spread: 0.4, size: 0.06, life: 0.4 },
      );
      announce(`Now at ${depthWord(pos)}.`);
      updateHud();
    }

    function readOut() {
      const av = Math.abs(pos);
      const msg = `Position ${pos}. Absolute value ${av}. That is ${av} meter${av === 1 ? "" : "s"} from the surface.`;
      caption(msg);
      announce(msg);
      hud.message(`|${pos}| = ${av}`, { tone: "info", duration: 1800 });
      later(() => caption(""), 1800);
    }

    function wrongHint() {
      switch (round.kind) {
        case "opposite":
          return ` The opposite of ${round.value} is on the other side of 0, the same distance.`;
        case "absolute":
          return ` Distance from the surface is |${targetInt}| = ${Math.abs(targetInt)}.`;
        case "compare":
          return ` Higher on the line means greater.`;
        case "distance":
          return ` Distance is |${round.a} − ${round.b}| = ${Math.abs(round.a - round.b)}.`;
        case "order":
          return round.pick === "greatest"
            ? ` The greatest is highest on the line.`
            : ` The least is lowest on the line.`;
        default:
          return "";
      }
    }

    function confirmArrival() {
      if (solved) return;
      if (pos !== targetInt) {
        attempts += 1;
        feel.shake(0.16);
        marker.material.color.setHex(COLORS.targetBad);
        later(() => marker.material.color.setHex(COLORS.target), 500);
        // Reveal a hint after the first miss even when hints are off.
        const showHint = cfg.hints || attempts >= 1;
        const msg = `Not there yet. You are at ${pos}.${showHint ? wrongHint() : ""}`;
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
        if (typeof hud.feedback === "function") hud.feedback(false, msg);
        else hud.message(msg, { tone: "warn", duration: 2200 });
        announce(msg);
        return;
      }

      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      // Scoring: base per level, +5 streak bonus per consecutive solve,
      // halved (rounded) if the player needed more than one try this round.
      const base = cfg.basePoints;
      const streakBonus = (streak - 1) * 5;
      let pts = base + streakBonus;
      if (attempts > 0) pts = Math.round(pts / 2);
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        target: targetInt,
        absolute: Math.abs(targetInt),
        streak,
        firstTry: attempts === 0,
      });

      feel.shake(0.3);
      feel.burst(
        { x: 0, y: yFor(targetInt), z: 0 },
        { color: COLORS.target, count: 32, spread: 1.4 },
      );

      let why;
      switch (round.kind) {
        case "opposite":
          why = `${targetInt} is the opposite of ${round.value}.`;
          break;
        case "absolute":
          why = `|${targetInt}| = ${Math.abs(targetInt)}, the distance from the surface.`;
          break;
        case "compare":
          why = `${targetInt} is the ${round.pick} of ${round.a} and ${round.b}.`;
          break;
        case "order":
          why = `${targetInt} is the ${round.pick} of ${round.values.join(", ")}.`;
          break;
        case "distance":
          why = `${round.a} and ${round.b} are |${round.a} − ${round.b}| = ${targetInt} apart.`;
          break;
        default:
          why = `You reached ${depthWord(targetInt)}.`;
      }
      const streakTxt = streak >= 2 ? ` Streak ${streak}!` : "";
      const okMsg = `Docked! ${why} +${pts}${streakTxt}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2600 });
      else hud.message(okMsg, { tone: "ok", duration: 2600 });
      announce(`Correct. ${why} You earned ${pts} points.${streakTxt}`);

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          marker.visible = false;
          clearGhosts();
          hud.setObjective(
            `All depths reached — ${solvedCount} of ${cfg.rounds.length}, best streak ${bestStreak}. Great piloting, Captain!`,
          );
          hud.message("All rounds complete!", { tone: "ok", duration: 0 });
          announce(
            `All rounds complete. You reached ${solvedCount} depths with a best streak of ${bestStreak}. Great piloting, Captain.`,
          );
        }
      }, 2700);
    }

    let unbindPress = null;
    let unbindTap = null;

    return {
      start() {
        startRound();
        camera.position.set(4.2, columnMidY + 1.2, 6.4);
        camera.lookAt(0, columnMidY, 0);
        feel.syncCamera();

        unbindPress = input.onPress((name) => {
          if (name === "up") move(1);
          else if (name === "down") move(-1);
          else if (name === "action") confirmArrival();
          else if (name === "confirm") readOut();
        });

        // Tap/click: tap upper half to rise, lower half to dive; tapping the
        // submarine or the target marker confirms arrival.
        unbindTap = input.onTap(() => {
          if (solved) return;
          const hits = input.raycast(camera, [marker, subGroup], true);
          if (hits.length) {
            confirmArrival();
            return;
          }
          const ny = input.state.ndc ? input.state.ndc.y : 0;
          move(ny >= 0 ? 1 : -1);
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            // Gentle bob + marker pulse + ghost pulse.
            subGroup.position.x = Math.sin(t * 1.5) * 0.04;
            const s = 1 + Math.sin(t * 3) * 0.08;
            marker.scale.set(s, 1, s);
            const gs = 1 + Math.sin(t * 4) * 0.12;
            for (const g of ghosts) {
              if (g.isMesh) g.scale.setScalar(gs);
            }
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearGhosts();
        clearLine();
        disposables.forEach((d) => d.dispose && d.dispose());
        scene.remove(group);
      },
    };
  },
};
