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
};

const UNIT = 0.62; // world units per integer step on the number line

function makeLevel(level) {
  if (level === 1) {
    return {
      min: -5,
      max: 5,
      hints: true,
      rounds: [
        { kind: "move", target: 3 },
        { kind: "move", target: -4 },
        { kind: "opposite", value: 2 }, // go to the opposite of +2
        { kind: "opposite", value: -5 },
        { kind: "order", values: [-3, 1, 4], pick: "least" },
      ],
    };
  }
  return {
    min: -10,
    max: 10,
    hints: false,
    rounds: [
      // Absolute value as distance from the surface (0).
      {
        kind: "absolute",
        value: -7,
        context: "A diver is 7 m below sea level.",
      },
      {
        kind: "absolute",
        value: 6,
        context: "A gull flies 6 m above sea level.",
      },
      // Compare two integers: move to the one that is greater/less.
      { kind: "compare", a: -8, b: -3, pick: "greater" },
      { kind: "compare", a: 5, b: -9, pick: "less" },
      // Order several integers; navigate to the requested one.
      { kind: "order", values: [-6, -2, 3, 8], pick: "greatest" },
      { kind: "order", values: [9, -4, -10, 2], pick: "least" },
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
    const RANGE_MIN = cfg.min;
    const RANGE_MAX = cfg.max;

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

    // ---- Water column (low-poly) ----
    const columnHeight = (RANGE_MAX - RANGE_MIN) * UNIT + UNIT * 2;
    const columnTopY = yFor(RANGE_MAX) + UNIT;
    const columnMidY = (yFor(RANGE_MAX) + yFor(RANGE_MIN)) / 2;

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
    track(water);
    group.add(water);

    // Surface plane at 0.
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
    track(surface);
    group.add(surface);

    // Seabed below the lowest integer.
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.4, 4),
      new THREE.MeshStandardMaterial({ color: COLORS.waterDeep, roughness: 1 }),
    );
    bed.position.y = yFor(RANGE_MIN) - UNIT;
    track(bed);
    group.add(bed);

    // ---- Number line: vertical spine + ticks + labels ----
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, columnHeight, 0.05),
      new THREE.MeshStandardMaterial({ color: COLORS.tick }),
    );
    spine.position.set(-1.5, columnMidY, 0);
    track(spine);
    group.add(spine);

    const tickGeo = new THREE.BoxGeometry(0.5, 0.05, 0.05);
    disposables.push(tickGeo);

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
      disposables.push(spr.material, tex);
      return spr;
    }

    for (let n = RANGE_MIN; n <= RANGE_MAX; n++) {
      const isZero = n === 0;
      const tick = new THREE.Mesh(
        tickGeo,
        new THREE.MeshStandardMaterial({
          color: isZero ? COLORS.tickZero : COLORS.tick,
        }),
      );
      tick.position.set(-1.5, yFor(n), 0);
      tick.scale.x = isZero ? 1.5 : 1;
      track(tick);
      group.add(tick);

      const label = makeLabel(String(n), isZero);
      label.position.set(-2.2, yFor(n), 0);
      group.add(label);
    }

    // "Sea level" hint near 0.
    const seaLabel = makeLabel("0 = sea level", false);
    seaLabel.scale.set(1.5, 0.42, 1);
    seaLabel.position.set(0.9, 0.0, 1.7);
    group.add(seaLabel);

    // ---- Submarine ----
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

    const window = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({
        color: COLORS.surface,
        emissive: COLORS.surface,
        emissiveIntensity: 0.4,
      }),
    );
    window.position.set(0.5, 0, 0);
    track(window);
    subGroup.add(window);

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

    // ---- Round state ----
    let pos = 0; // current integer position of the sub
    let round = null;
    let roundIndex = 0;
    let targetInt = null; // integer the sub must reach (when known)
    let solved = false;
    let streak = 0; // consecutive correct
    let bestStreak = 0;
    let solvedCount = 0;
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
          duration: 180,
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
        default:
          return 0;
      }
    }

    function startRound() {
      solved = false;
      round = cfg.rounds[roundIndex];
      targetInt = computeTarget(round);
      pos = 0;
      setSubY(0, false);

      marker.position.set(0, yFor(targetInt), 0);
      marker.material.color.setHex(COLORS.target);
      marker.visible = true;

      // Persistent "Step X of Y" for the whole round (both levels have 5 rounds).
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
        default:
          intro = `Round ${roundIndex + 1}.`;
      }
      announce(intro);
      updateHud();

      if (cfg.hints) {
        hud.message(
          "Use Up/Down (or the d-pad) to move. Press Space when you arrive.",
          {
            tone: "info",
            duration: 2800,
          },
        );
      } else {
        hud.message(
          "Up/Down to move. Space to confirm. Enter for a depth read-out.",
          {
            tone: "info",
            duration: 2200,
          },
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

    function confirmArrival() {
      if (solved) return;
      if (pos !== targetInt) {
        feel.shake(0.16);
        marker.material.color.setHex(COLORS.targetBad);
        later(() => marker.material.color.setHex(COLORS.target), 500);
        const hint =
          round.kind === "opposite"
            ? ` The opposite of ${round.value} is on the other side of 0, same distance.`
            : round.kind === "absolute"
              ? ` Distance from the surface is |${targetInt}| = ${Math.abs(targetInt)}.`
              : round.kind === "compare"
                ? ` Higher on the line means greater.`
                : "";
        const msg = `Not there yet. You are at ${pos}.${cfg.hints ? hint : ""}`;
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
      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const pts = base + levelBonus;
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        target: targetInt,
        absolute: Math.abs(targetInt),
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
        default:
          why = `You reached ${depthWord(targetInt)}.`;
      }
      const okMsg = `Docked! ${why} +${pts}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2600 });
      else hud.message(okMsg, { tone: "ok", duration: 2600 });
      announce(`Correct. ${why} You earned ${pts} points.`);

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          marker.visible = false;
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
        camera.position.set(4.2, columnMidY + 1.2, 6.4);
        camera.lookAt(0, columnMidY, 0);
        feel.syncCamera();

        startRound();

        unbindPress = input.onPress((name) => {
          if (name === "up") move(1);
          else if (name === "down") move(-1);
          else if (name === "action") confirmArrival();
          else if (name === "confirm") readOut();
        });

        // Tap/click: tap upper half to rise, lower half to dive; double role via marker tap = confirm.
        unbindTap = input.onTap(() => {
          if (solved) return;
          // Raycast the submarine or marker to confirm arrival.
          const hits = input.raycast(camera, [marker, subGroup], true);
          if (hits.length) {
            confirmArrival();
            return;
          }
          // Otherwise move toward where the player tapped (screen Y).
          const ny = input.state.ndc ? input.state.ndc.y : 0;
          move(ny >= 0 ? 1 : -1);
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            // Gentle bob + marker pulse.
            subGroup.position.x = Math.sin(t * 1.5) * 0.04;
            const s = 1 + Math.sin(t * 3) * 0.08;
            marker.scale.set(s, 1, s);
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        disposables.forEach((d) => d.dispose && d.dispose());
      },
    };
  },
};
