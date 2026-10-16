/* The Primekeeper — Gear Train (LCM) and Prime Forge (prime factorization) builders.
 *
 *   gears  two marked gears mesh. The student sets how many teeth the drive turns; the
 *          marks line up at the top again only after a common multiple of the two tooth
 *          counts, and the LEAST one is the goal. Wrong counts make the gears slip.
 *   forge  a number ingot is split on the anvil into factor pairs. Each piece is split
 *          again or stamped PRIME; the furnace cracks any stamped piece that is not prime
 *          and melts a 1. Every piece prime = the prime factorization.
 * The math judges live in expedition-math.js (PK_MATH).
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.PK_MATH;
  const P = window.PK_MISSIONS;
  if (!X || !M || !P) return;
  const L = M.L;
  const { COPPER, CRYSTAL, BAD, PANEL, KEYPAD_Y } = P;
  const GOLD = 0xffc779;
  const TAU = Math.PI * 2;

  /* ── gears: least common multiple as a gear train ──────────────────────── */
  function drawGear(g, n, r, body, mark, phase = 0) {
    const pts = [];
    const tip = r + 6;
    const root = r - 5;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + phase + (i / n) * TAU;
      const w = (TAU / n) * 0.24;
      pts.push({ x: Math.cos(a0 - 2 * w) * root, y: Math.sin(a0 - 2 * w) * root });
      pts.push({ x: Math.cos(a0 - w) * tip, y: Math.sin(a0 - w) * tip });
      pts.push({ x: Math.cos(a0 + w) * tip, y: Math.sin(a0 + w) * tip });
      pts.push({ x: Math.cos(a0 + 2 * w) * root, y: Math.sin(a0 + 2 * w) * root });
    }
    g.fillStyle(body, 1).fillPoints(pts, true);
    g.lineStyle(2, 0x2a1a10, 0.8).strokePoints(pts, true);
    g.fillStyle(0x2a1a10, 0.55).fillCircle(0, 0, r * 0.62);
    g.fillStyle(body, 1).fillCircle(0, 0, r * 0.22);
    for (let s = 0; s < 4; s++) {
      const ang = (s / 4) * TAU + Math.PI / 4;
      g.lineStyle(5, body, 1).lineBetween(0, 0, Math.cos(ang) * r * 0.6, Math.sin(ang) * r * 0.6);
    }
    g.fillStyle(mark, 1).fillCircle(0, -r + 3, 6);
    g.lineStyle(2, 0xffffff, 0.9).strokeCircle(0, -r + 3, 6);
  }
  function gears(scene, api) {
    const { kit, rng, t } = api;
    const { a, b, L: lcm } = M.genGears(rng, api.tier);
    let ran = null; // T of the last run
    api.setBrief(
      L(
        `Two gears guard the Crystal Gate: ${a} teeth and ${b} teeth. Both gold marks start at the top. How many teeth must the drive turn until BOTH marks first meet at the top again?`,
        `Dos engranajes cuidan la Puerta de Cristal: ${a} dientes y ${b} dientes. Las dos marcas doradas empiezan arriba. ¿Cuántos dientes debe girar el motor hasta que las DOS marcas vuelvan a estar arriba juntas por primera vez?`,
      ),
    );
    kit.panel(24, 140, 524, 292, { fill: PANEL, alpha: 0.9 });
    const rA = 26 + a * 3.6;
    const rB = 26 + b * 3.6;
    const cy = 272;
    const xA = 286 - rB - 2;
    const xB = xA + rA + rB + 4;
    const gearA = scene.add.container(xA, cy).setDepth(22);
    const gearB = scene.add.container(xB, cy).setDepth(22);
    const gA = scene.add.graphics();
    const gB = scene.add.graphics();
    drawGear(gA, a, rA, COPPER, GOLD);
    drawGear(gB, b, rB, 0x9aa7b4, GOLD, Math.PI / b); // tooth into gap at the mesh
    gearA.add(gA);
    gearB.add(gB);
    const pointers = scene.add.graphics().setDepth(23);
    const labA = kit.text(xA, cy + rA + 16, t(L(`${a} teeth`, `${a} dientes`)), 15, "#ffd9a8", {
      weight: "800",
    });
    const labB = kit.text(xB, cy + rB + 16, t(L(`${b} teeth`, `${b} dientes`)), 15, "#dbe6ef", {
      weight: "800",
    });
    const turnA = kit.text(286, 402, "", 13, "#f3e6d8", { wrap: 500 });
    const turnB = kit.text(286, 421, "", 13, "#f3e6d8", { wrap: 500 });
    labA.setDepth(24);
    labB.setDepth(24);
    // Drive panel (right).
    kit.panel(560, 140, 236, 292, { fill: PANEL, alpha: 0.9 });
    kit.text(678, 162, t(L("DRIVE SHAFT", "EJE MOTOR")), 15, "#ffc779", { weight: "800" });
    kit.text(678, 206, t(L("Turn the drive by", "Gira el motor")), 14, "#f3e6d8");
    const big = kit.text(678, 254, "", 44, "#ffffff", { weight: "900" });
    kit.text(678, 296, t(L("teeth", "dientes")), 15, "#f3e6d8");
    const result = kit.text(678, 370, "", 15, "#ffffff", { wrap: 210, weight: "800" });
    const entry = P.numberEntry(scene, api, 999, () => {
      ran = null;
      big.setText(entry.text || "?");
      result.setText("");
      drawPointers(null);
      turnA.setText("");
      turnB.setText("");
    });
    big.setText("?");
    function drawPointers(T) {
      pointers.clear();
      [
        [xA, rA, a],
        [xB, rB, b],
      ].forEach(([x, r, n]) => {
        const col = T == null ? 0xffffff : T % n === 0 ? 0x6ff0a0 : BAD;
        const y = cy - r - 12;
        pointers.fillStyle(col, 1).fillTriangle(x - 9, y - 14, x + 9, y - 14, x, y);
      });
    }
    drawPointers(null);
    const turnsText = (T, n) => {
      const full = Math.floor(T / n);
      const rem = T % n;
      return rem
        ? L(
            `${n}-tooth gear: ${full} turns and ${rem} teeth. Mark NOT on top.`,
            `Engranaje de ${n}: ${full} vueltas y ${rem} dientes. La marca NO está arriba.`,
          )
        : L(
            `${n}-tooth gear: ${full} full turns. Mark on top ✓`,
            `Engranaje de ${n}: ${full} vueltas completas. Marca arriba ✓`,
          );
    };
    async function run(T) {
      gearA.rotation = 0;
      gearB.rotation = 0;
      drawPointers(null);
      const visual = (n) => {
        const full = Math.min(Math.floor(T / n), 2);
        return (full + (T % n) / n) * TAU;
      };
      api.sfx.hum();
      kit.tween({ targets: gearA, rotation: visual(a), duration: 1500, ease: "Cubic.easeInOut" });
      kit.tween({
        targets: gearB,
        rotation: -visual(b),
        duration: 1500,
        ease: "Cubic.easeInOut",
      });
      await kit.wait(1550);
      gearA.rotation = ((T % a) / a) * TAU;
      gearB.rotation = -((T % b) / b) * TAU;
      ran = T;
      drawPointers(T);
      turnA.setText(t(turnsText(T, a))).setColor(T % a ? "#ffb39f" : "#9ff5c0");
      turnB.setText(t(turnsText(T, b))).setColor(T % b ? "#ffb39f" : "#9ff5c0");
    }
    return {
      checkLabel: L("Run the gears", "Girar los engranajes"),
      actions: [
        { key: "ArrowUp", label: L("One more tooth", "Un diente más"), run: () => entry.step(1) },
        {
          key: "ArrowDown",
          label: L("One less tooth", "Un diente menos"),
          run: () => entry.step(-1),
        },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => entry.type("Backspace"),
        },
      ],
      status: () =>
        L(
          `Drive: ${entry.text || "?"} teeth${ran ? " (last run " + ran + ")" : ""}`,
          `Motor: ${entry.text || "?"} dientes${ran ? " (última prueba " + ran + ")" : ""}`,
        ),
      hints: [
        L(
          `A mark is back on top after every full turn: at multiples of its teeth. List the multiples of ${a} and of ${b}. The first number on BOTH lists is the least common multiple.`,
          `Una marca vuelve arriba en cada vuelta completa: en los múltiplos de sus dientes. Haz la lista de múltiplos de ${a} y de ${b}. El primer número que está en LAS DOS listas es el mínimo común múltiplo.`,
        ),
        L(
          `Multiples of ${a}: ${M.multiplesBelow(a, lcm, 4).join(", ")}, … Multiples of ${b}: ${M.multiplesBelow(b, lcm, 4).join(", ")}, … Keep both lists going until they share a number.`,
          `Múltiplos de ${a}: ${M.multiplesBelow(a, lcm, 4).join(", ")}, … Múltiplos de ${b}: ${M.multiplesBelow(b, lcm, 4).join(", ")}, … Sigue las dos listas hasta que compartan un número.`,
        ),
      ],
      async check() {
        const T = entry.value;
        const res = M.judgeGears(a, b, T);
        if (res.incomplete) return res;
        await run(T);
        if (res.ok) {
          result.setText(t(L("Both marks on top!", "¡Las dos marcas arriba!")));
          result.setColor("#8ff0b4");
          api.sfx.unlock();
          kit.burst(xA, cy - rA, GOLD, 16);
          kit.burst(xB, cy - rB, GOLD, 16);
        } else {
          result.setText(t(L("The gears slipped.", "Los engranajes patinaron.")));
          result.setColor("#ffb39f");
          kit.shake(0.004, 160);
        }
        return res;
      },
      async demo() {
        const big2 = Math.max(a, b);
        const small = Math.min(a, b);
        for (let T = big2; T <= lcm; T += big2) {
          entry.set(T);
          kit.floatText(
            678,
            230,
            T % small === 0 ? `${T} ✓` : `${T} ✗`,
            T % small === 0 ? "#8ff0b4" : "#ff9a80",
            24,
          );
          await kit.wait(T === lcm ? 300 : 650);
        }
        await run(lcm);
        result.setText(t(L("Both marks on top!", "¡Las dos marcas arriba!")));
        result.setColor("#8ff0b4");
      },
      explain: () =>
        L(
          `LCM(${a}, ${b}) = ${lcm}. After ${lcm} teeth the ${a}-tooth gear made ${lcm / a} turns and the ${b}-tooth gear made ${lcm / b} turns, so both marks were on top.`,
          `MCM(${a}, ${b}) = ${lcm}. Después de ${lcm} dientes, el engranaje de ${a} dio ${lcm / a} vueltas y el de ${b} dio ${lcm / b} vueltas, así que las dos marcas quedaron arriba.`,
        ),
    };
  }

  /* ── forge: a factor tree hammered out on the anvil ────────────────────── */
  function forge(scene, api) {
    const { kit, rng, t } = api;
    const { N, primes } = M.genForge(rng, api.tier);
    let root = M.makeNode(N);
    let sel = root;
    let marks = new Map(); // node -> 'crack' | 'melt' | 'glow' after a firing
    api.setBrief(
      L(
        `Forge the ${N} ingot into PRIME ingots. Select a piece, type a factor and Split it. Stamp a piece PRIME when it cannot be split. Then fire the furnace.`,
        `Forja el lingote de ${N} en lingotes PRIMOS. Elige una pieza, escribe un factor y divídela. Sella una pieza como PRIMO cuando no se pueda dividir. Luego enciende el horno.`,
      ),
    );
    kit.panel(24, 140, 540, 292, { fill: PANEL, alpha: 0.9 });
    const lines = scene.add.graphics().setDepth(21);
    const ingots = scene.add.graphics().setDepth(22);
    const zones = [];
    const labels = [];
    for (let i = 0; i < 24; i++)
      labels.push(kit.text(0, 0, "", 16, "#1a0d06", { weight: "900", depth: 23 }));
    const stamps = [];
    for (let i = 0; i < 24; i++)
      stamps.push(kit.text(0, 0, "", 10, "#ffd76a", { weight: "900", depth: 23 }));
    // Anvil panel (right).
    kit.panel(576, 140, 220, 292, { fill: PANEL, alpha: 0.9 });
    kit.text(686, 160, t(L("ANVIL", "YUNQUE")), 15, "#ffc779", { weight: "800" });
    const selText = kit.text(686, 190, "", 14, "#f3e6d8", { wrap: 200 });
    const facText = kit.text(686, 228, "", 22, "#ffffff", { weight: "900" });
    const readout = kit.text(686, 404, "", 14, "#ffd9a8", { wrap: 204, weight: "800" });
    kit.button(686, 274, 190, 38, "⚒ " + t(L("Split [S]", "Dividir [S]")), () => split(), {
      size: 15,
    });
    kit.button(
      686,
      318,
      190,
      38,
      "✦ " + t(L("Stamp PRIME [P]", "Sellar PRIMO [P]")),
      () => stamp(),
      {
        size: 15,
        fill: 0xffd76a,
      },
    );
    kit.button(686, 362, 190, 34, "↶ " + t(L("Melt back [U]", "Fundir [U]")), () => melt(), {
      size: 14,
      fill: 0x4a3a3a,
      color: "#f3e6d8",
    });
    const entry = P.numberEntry(scene, api, 999, () => draw());

    const leaves = () => M.forgeLeaves(root);
    function draw() {
      lines.clear();
      ingots.clear();
      zones.forEach((z) => z.destroy());
      zones.length = 0;
      labels.forEach((l) => l.setText(""));
      stamps.forEach((l) => l.setText(""));
      const lay = M.forgeLayout(root);
      const slots = Math.max(1, lay.leaves);
      const sw = Math.min(96, 516 / slots);
      const x0 = 36 + (516 - slots * sw) / 2;
      const dy = Math.min(58, 236 / Math.max(1, lay.depth));
      const iw = Math.min(54, sw - 6);
      const pos = new Map();
      lay.nodes.forEach((r) =>
        pos.set(r.node, { x: x0 + (r.x + 0.5) * sw, y: 176 + r.node.depth * dy }),
      );
      lay.nodes.forEach((r) => {
        if (r.parent) {
          const p = pos.get(r.parent.node);
          const c = pos.get(r.node);
          lines.lineStyle(3, 0x8a5a34, 0.9).lineBetween(p.x, p.y + 14, c.x, c.y - 14);
        }
      });
      lay.nodes.forEach((r, i) => {
        const n = r.node;
        const { x, y } = pos.get(n);
        const m = marks.get(n);
        let fill = n.kids ? 0x4a3a36 : n.stamped ? 0xffd76a : 0xc8552e;
        if (m === "crack") fill = BAD;
        if (m === "glow") fill = 0xffe9a8;
        const alpha = m === "melt" ? 0.25 : 1;
        ingots.fillStyle(0x000000, 0.35 * alpha).fillRoundedRect(x - iw / 2, y - 12, iw, 30, 7);
        ingots.fillStyle(fill, alpha).fillRoundedRect(x - iw / 2, y - 15, iw, 30, 7);
        if (!n.kids && !n.stamped)
          ingots
            .fillStyle(0xffe0b0, 0.35 * alpha)
            .fillRoundedRect(x - iw / 2 + 4, y - 12, iw - 8, 8, 4);
        if (n.stamped && stamps[i])
          stamps[i].setPosition(x, y + 23).setText(t(L("PRIME", "PRIMO"))).setAlpha(alpha);
        if (n === sel && !n.kids)
          ingots.lineStyle(4, 0xffffff, 1).strokeRoundedRect(x - iw / 2 - 4, y - 19, iw + 8, 38, 9);
        if (m === "crack") {
          ingots.lineStyle(3, 0x200606, 1);
          ingots.lineBetween(x - 6, y - 15, x + 2, y - 2);
          ingots.lineBetween(x + 2, y - 2, x - 4, y + 15);
        }
        const lab = labels[i];
        if (lab) {
          lab.setPosition(x, y).setText(String(n.v));
          lab.setColor(n.kids || !n.stamped ? "#fff1e2" : "#1a0d06");
          lab.setFontSize(n.v >= 100 && iw < 50 ? 13 : 16);
          lab.setAlpha(alpha);
        }
        if (!n.kids) {
          const z = scene.add
            .zone(x, y, iw + 8, 38)
            .setInteractive({ useHandCursor: true })
            .setDepth(24);
          z.on("pointerdown", () => {
            sel = n;
            api.sfx.select();
            draw();
            api.refresh();
          });
          zones.push(z);
        }
      });
      selText.setText(
        sel
          ? t(L(`Selected piece: ${sel.v}`, `Pieza elegida: ${sel.v}`))
          : t(L("Select a piece", "Elige una pieza")),
      );
      facText.setText(t(L("Factor: ", "Factor: ")) + (entry.text || "?"));
      readout.setText(
        `${N} = ${leaves()
          .map((l) => l.v)
          .join(" × ")}`,
      );
    }
    function clearMarks() {
      marks = new Map();
    }
    clearMarks();
    function nextOpen(from) {
      const list = leaves();
      const open = list.filter((l) => !l.stamped);
      if (!open.length) return list[0];
      const i = list.indexOf(from);
      return open.find((l) => list.indexOf(l) > i) || open[0];
    }
    function split() {
      if (!sel || sel.kids) return;
      const res = M.forgeSplit(root, sel, entry.value);
      if (!res.ok) {
        api.sfx.miss();
        if (res.feedback) api.feedback(res.feedback, "info");
        return;
      }
      clearMarks();
      api.sfx.place();
      kit.shake(0.002, 80);
      const kids = sel.kids;
      sel = kids[0];
      entry.set(null);
      draw();
      kit.burst(286, 260, GOLD, 12, { speed: 160 });
      api.say(L(`Split: ${kids[0].v} × ${kids[1].v}`, `Dividido: ${kids[0].v} × ${kids[1].v}`));
      api.refresh();
    }
    function stamp() {
      if (!sel || sel.kids) return;
      sel.stamped = !sel.stamped;
      clearMarks();
      api.sfx.select();
      const was = sel;
      if (sel.stamped) sel = nextOpen(sel);
      draw();
      api.say(
        was.stamped
          ? L(`${was.v} stamped PRIME`, `${was.v} sellado como PRIMO`)
          : L(`Stamp removed from ${was.v}`, `Sello quitado de ${was.v}`),
      );
      api.refresh();
    }
    function parentOf(target) {
      let found = null;
      (function walk(n) {
        if (!n.kids) return;
        if (n.kids.includes(target)) found = n;
        n.kids.forEach(walk);
      })(root);
      return found;
    }
    function melt() {
      const p = sel && parentOf(sel);
      if (!p) return;
      p.kids = null;
      p.stamped = false;
      sel = p;
      clearMarks();
      api.sfx.whoosh();
      draw();
      api.refresh();
    }
    function cycle(d) {
      const list = leaves();
      const i = Math.max(0, list.indexOf(sel));
      sel = list[(i + d + list.length) % list.length];
      api.sfx.tick(i);
      draw();
      api.refresh();
    }
    draw();
    const p0 = primes[0];
    return {
      checkLabel: L("Fire the furnace", "Encender el horno"),
      actions: [
        { key: "ArrowRight", label: L("Next piece →", "Pieza siguiente →"), run: () => cycle(1) },
        {
          key: "ArrowLeft",
          label: L("← Previous piece", "← Pieza anterior"),
          run: () => cycle(-1),
        },
        { key: "s", label: L("Split by the factor", "Dividir por el factor"), run: () => split() },
        {
          key: "p",
          label: L("Stamp PRIME (or remove stamp)", "Sellar PRIMO (o quitar sello)"),
          run: () => stamp(),
        },
        { key: "u", label: L("Melt back this branch", "Fundir esta rama"), run: () => melt() },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => entry.type("Backspace"),
        },
      ],
      status: () => {
        const list = leaves();
        const s = list.filter((l) => l.stamped).length;
        return L(
          `Pieces: ${list.map((l) => l.v + (l.stamped ? "(P)" : "")).join(", ")} · stamped ${s} of ${list.length} · selected ${sel ? sel.v : "none"} · factor ${entry.text || "?"}`,
          `Piezas: ${list.map((l) => l.v + (l.stamped ? "(P)" : "")).join(", ")} · selladas ${s} de ${list.length} · elegida ${sel ? sel.v : "ninguna"} · factor ${entry.text || "?"}`,
        );
      },
      hints: [
        L(
          "Split any piece that is not prime into two factors. Try the small primes first: 2, 3, 5, 7. Stamp PRIME only when the only factors are 1 and the number itself.",
          "Divide cada pieza que no sea prima en dos factores. Prueba primero los primos pequeños: 2, 3, 5, 7. Sella PRIMO solo cuando los únicos factores son 1 y el mismo número.",
        ),
        L(
          `Start with ${N} ÷ ${p0} = ${N / p0}, so ${N} = ${p0} × ${N / p0}. Then ask about ${N / p0}: can it be split too?`,
          `Empieza con ${N} ÷ ${p0} = ${N / p0}, así que ${N} = ${p0} × ${N / p0}. Luego pregúntate: ¿${N / p0} también se puede dividir?`,
        ),
      ],
      async check() {
        const res = M.judgeForge(root);
        if (res.incomplete) return res;
        clearMarks();
        api.sfx.flow();
        kit.flash(0xffb060, 160);
        await kit.wait(300);
        if (res.ok) {
          leaves().forEach((l) => marks.set(l, "glow"));
          draw();
          kit.burst(286, 300, GOLD, 30, { speed: 260 });
          return res;
        }
        marks.set(res.node, res.misconception === "oneAsPrime" ? "melt" : "crack");
        sel = res.node;
        draw();
        kit.shake(0.005, 180);
        await kit.wait(300);
        return res;
      },
      async demo() {
        root = M.makeNode(N);
        sel = root;
        clearMarks();
        draw();
        await kit.wait(400);
        const go = async (node) => {
          sel = node;
          if (M.isPrime(node.v)) {
            node.stamped = true;
            draw();
            kit.floatText(286, 200, `${node.v} ✦`, "#ffd76a", 20);
            await kit.wait(260);
            return;
          }
          const p = M.primeList(node.v)[0];
          entry.set(p);
          await kit.wait(200);
          M.forgeSplit(root, node, p);
          draw();
          kit.floatText(286, 200, `${node.v} = ${p} × ${node.v / p}`, "#ffd76a", 20);
          api.sfx.place();
          await kit.wait(450);
          await go(node.kids[0]);
          await go(node.kids[1]);
        };
        await go(root);
        entry.set(null);
        leaves().forEach((l) => marks.set(l, "glow"));
        draw();
      },
      explain: () =>
        L(
          `${N} = ${M.times(primes)} = ${M.exponentForm(primes)}. Every piece is prime, so the factor tree is finished.`,
          `${N} = ${M.times(primes)} = ${M.exponentForm(primes)}. Cada pieza es prima, así que el árbol de factores está terminado.`,
        ),
    };
  }

  window.PK_MISSIONS = Object.assign(window.PK_MISSIONS || {}, { gears, forge, CRYSTAL });
})();
