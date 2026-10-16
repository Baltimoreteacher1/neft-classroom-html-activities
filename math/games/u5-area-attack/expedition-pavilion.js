/* Terrace Architects — pavilion and edging builders.
 *
 *   pavilion   a regular-polygon pavilion floor built from identical triangles,
 *              one per side. Wrong-sized triangles overlap or leave gaps.
 *   edging     a rectangular bed with a fixed length of edging and a planting goal.
 *              The edging runs out or coils up; the plants show the area.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.AA_MISSIONS;
  if (!X || !M || !M.ui) return;
  const { L, geom, fmt } = M;
  const { makeBoard, entryBox, stepper, cardPanel } = M.ui;
  const { STONE, LEAF, LIME, SPILL, GAP, GOLD } = M.colors;

  /* ── pavilion: regular polygons from identical triangles (5-9) ─────────── */
  const PAV_FB = {
    noHalf: L(
      "Each triangle got side × apothem: that is double one triangle, so they overlap. Take half.",
      "Cada triángulo recibió lado × apotema: es el doble de un triángulo y se enciman. Toma la mitad.",
    ),
    radius: L(
      "You used the slanted edge from the center to a corner. The triangle's height is the apothem: the dashed line to the middle of a side.",
      "Usaste el borde inclinado del centro a una esquina. La altura del triángulo es la apotema: la línea punteada al centro de un lado.",
    ),
    addLengths: L(
      "You added the side and the apothem. Area multiplies: ½ × side × apothem.",
      "Sumaste el lado y la apotema. El área multiplica: ½ × lado × apotema.",
    ),
    wedgeOver: L(
      "Your triangles are too big: they overlap the edge of the floor.",
      "Tus triángulos son demasiado grandes: se salen del borde del piso.",
    ),
    wedgeUnder: L(
      "Your triangles are too small: gaps show between them.",
      "Tus triángulos son demasiado pequeños: quedan huecos entre ellos.",
    ),
    wedgeCount: L(
      "The floor needs one triangle for each side. Count the sides of the pavilion.",
      "El piso necesita un triángulo por cada lado. Cuenta los lados del pabellón.",
    ),
    perimeter: L(
      "That is the distance around the pavilion (perimeter). Area = number of triangles × area of one triangle.",
      "Eso es la distancia alrededor del pabellón (perímetro). Área = número de triángulos × área de un triángulo.",
    ),
    oneWedge: L(
      "That is only ONE triangle. The floor has one triangle for each side.",
      "Eso es solo UN triángulo. El piso tiene un triángulo por cada lado.",
    ),
    tooMany: L("Too much floor: the tiles overlap the edge.", "Demasiado piso: las baldosas se salen del borde."),
    tooFew: L("Not enough floor: gaps show.", "No alcanza el piso: quedan huecos."),
  };
  const POLY_NAME = {
    5: L("pentagon", "pentágono"),
    6: L("hexagon", "hexágono"),
    8: L("octagon", "octágono"),
  };

  function pavilion(scene, api) {
    const { kit, rng } = api;
    const p = M.gen.pavilion(rng, api.tier);
    const cx = 250;
    const cy = 304;
    const R = 122;
    const ang = (k) => Math.PI / 2 + Math.PI / p.n + (2 * Math.PI * k) / p.n;
    const V = (k, rr = R) => ({ x: cx + Math.cos(ang(k)) * rr, y: cy + Math.sin(ang(k)) * rr });
    const name = POLY_NAME[p.n];
    api.setBrief(
      p.totalOnly
        ? L(
            `Tile the floor of this regular ${name.en} pavilion. Type the area of the whole floor.`,
            `Cubre el piso de este pabellón con forma de ${name.es} regular. Escribe el área de todo el piso.`,
          )
        : L(
            `Build the floor of this regular ${name.en} pavilion from identical triangles. Set how many triangles, and the area of one.`,
            `Construye el piso de este pabellón con forma de ${name.es} regular con triángulos iguales. Elige cuántos triángulos y el área de uno.`,
          ),
    );
    const back = scene.add.graphics().setDepth(19);
    back.fillStyle(0x07110c, 0.88).fillRoundedRect(cx - 200, 146, 400, 294, 14);
    const floor = scene.add.graphics().setDepth(21);
    const marks = scene.add.graphics().setDepth(26);
    const outline = Array.from({ length: p.n }, (_, k) => V(k));
    floor.fillStyle(0x4a3524, 1).fillPoints(outline, true);
    marks.lineStyle(3, LIME, 1).strokePoints(outline, true, true);
    // The labeled triangle is the bottom one: centre, V(n−1), V(0).
    const A0 = V(p.n - 1);
    const A1 = V(0);
    const mid = { x: (A0.x + A1.x) / 2, y: (A0.y + A1.y) / 2 };
    const dashLine = (a, b, color, wdt = 2) => {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.floor(len / 8);
      marks.lineStyle(wdt, color, 1);
      for (let i = 0; i < n; i += 2)
        marks.lineBetween(
          a.x + ((b.x - a.x) * i) / n,
          a.y + ((b.y - a.y) * i) / n,
          a.x + ((b.x - a.x) * (i + 1)) / n,
          a.y + ((b.y - a.y) * (i + 1)) / n,
        );
    };
    marks.lineStyle(2, 0xffffff, 0.9).lineBetween(cx, cy, A0.x, A0.y).lineBetween(cx, cy, A1.x, A1.y);
    dashLine({ x: cx, y: cy }, mid, 0xffffff, 3);
    marks.fillStyle(0xffffff, 1).fillCircle(cx, cy, 4);
    const lbl = (x, y, s, color) =>
      kit.text(x, y, s, 16, color, { weight: "900", depth: 27, stroke: "#06121c", strokeWidth: 4 });
    lbl(mid.x, mid.y + 18, String(p.s), "#ffffff");
    lbl(cx + 12, (cy + mid.y) / 2, String(p.a), "#ffffff").setOrigin(0, 0.5);
    lbl((cx + A1.x) / 2 + 16, (cy + A1.y) / 2 - 4, String(p.r), "#ffd9a0").setOrigin(0, 0.5);
    kit.text(cx, 162, api.t(L(`side ${p.s} · apothem ${p.a} (dashed)`, `lado ${p.s} · apotema ${p.a} (punteada)`)), 13, "#cfe3ee", {
      weight: "800",
      depth: 27,
    });
    const wedges = scene.add.graphics().setDepth(22);

    let count = 1;
    cardPanel(kit, 506, 150, 290, 290, api.t(L("FLOOR PLAN", "PLANO DEL PISO")));
    const box = entryBox(
      scene,
      kit,
      651,
      p.totalOnly ? 250 : 318,
      170,
      p.totalOnly
        ? api.t(L("Floor area", "Área del piso"))
        : api.t(L("Area of ONE triangle", "Área de UN triángulo")),
      { size: 24, unit: api.t(L("square units", "unidades cuadradas")) },
    );
    const cnt = p.totalOnly
      ? null
      : stepper(scene, kit, 651, 218, api.t(L("Triangles", "Triángulos")), () => count, (d) => bumpCount(d));
    const totalT = kit.text(651, 404, "", 14, "#ffffff", { weight: "800", depth: 26, wrap: 260 });
    let tone = null;
    function drawWedges(scale = 1, n = count, missing = false) {
      wedges.clear();
      for (let k = 0; k < Math.max(n, p.n); k++) {
        const slot = (p.n - 1 + k) % p.n;
        const a = V(slot, R * scale);
        const b = V(slot + 1, R * scale);
        if (k < n) {
          const extra = k >= p.n;
          wedges.fillStyle(extra ? SPILL : STONE, extra ? 0.7 : 0.95).fillTriangle(cx, cy, a.x, a.y, b.x, b.y);
          wedges.lineStyle(1.5, 0x6b6250, 1).strokeTriangle(cx, cy, a.x, a.y, b.x, b.y);
        } else if (missing) {
          const a1 = V(slot);
          const b1 = V(slot + 1);
          wedges.lineStyle(2, GAP, 0.9).strokeTriangle(cx, cy, a1.x, a1.y, b1.x, b1.y);
        }
      }
    }
    function draw() {
      if (cnt) cnt.refresh(false);
      box.draw(true, tone);
      if (!p.totalOnly) {
        drawWedges(1, count);
        const v = box.text === "" ? "?" : box.text;
        const prod = box.value() == null ? "" : ` = ${fmt(count * box.value())}`;
        totalT.setText(api.t(L("Floor: ", "Piso: ")) + `${count} × ${v}${prod}`);
      } else drawWedges(1, 0);
    }
    function bumpCount(d) {
      count = Phaser.Math.Clamp(count + d, 1, 12);
      tone = null;
      api.sfx.tick(count);
      draw();
      api.refresh();
    }
    function type(key) {
      const next = M.typeInto(box.text, key, 5, true);
      if (next === box.text) return;
      box.text = next;
      tone = null;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType(type);
    kit.keypad(30, 462, type, { size: 34, gap: 5, keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "⌫"] });
    draw();

    async function build(scale, n) {
      const steps = kit.reduced() ? 1 : n;
      for (let i = 1; i <= steps; i++) {
        drawWedges(scale, Math.round((n * i) / steps), i === steps);
        api.sfx.tick(i % 12);
        await kit.wait(110);
      }
    }
    const per = round(p.n * p.s);
    function round(x) {
      return M.round2(x);
    }
    return {
      checkLabel: L("Build the floor", "Construir el piso"),
      actions: p.totalOnly
        ? [{ key: "Delete", label: L("Erase digit", "Borrar dígito"), run: () => type("Backspace") }]
        : [
            { key: "ArrowUp", label: L("One more triangle", "Un triángulo más"), run: () => bumpCount(1) },
            { key: "ArrowDown", label: L("One less triangle", "Un triángulo menos"), run: () => bumpCount(-1) },
            { key: "Delete", label: L("Erase digit", "Borrar dígito"), run: () => type("Backspace") },
          ],
      status: () =>
        p.totalOnly
          ? L(`Floor area: ${box.text || "?"}`, `Área del piso: ${box.text || "?"}`)
          : L(
              `Triangles: ${count} · One triangle: ${box.text || "?"}`,
              `Triángulos: ${count} · Un triángulo: ${box.text || "?"}`,
            ),
      hints: [
        L(
          "Lines from the center cut the floor into identical triangles, one for each side. One triangle = ½ × side × apothem.",
          "Las líneas desde el centro cortan el piso en triángulos iguales, uno por cada lado. Un triángulo = ½ × lado × apotema.",
        ),
        L(
          `One triangle: ½ × ${p.s} × ${p.a}. The ${name.en} has ${p.n} sides, so ${p.n} triangles.`,
          `Un triángulo: ½ × ${p.s} × ${p.a}. El ${name.es} tiene ${p.n} lados, así que hay ${p.n} triángulos.`,
        ),
      ],
      async check() {
        const v = box.value();
        if (v == null)
          return {
            ok: false,
            incomplete: true,
            feedback: p.totalOnly
              ? L("Type the floor area first.", "Primero escribe el área del piso.")
              : L("Type the area of one triangle first.", "Primero escribe el área de un triángulo."),
          };
        const inp = p.totalOnly ? { total: v } : { count, wedge: v };
        const res = M.judge.pavilion(p, inp);
        const wedgeV = p.totalOnly ? v / p.n : v;
        const scale = Math.min(1.35, Math.sqrt(Math.max(0.05, wedgeV / p.wedge)));
        await build(scale, p.totalOnly ? p.n : count);
        if (scale > 1.001) marks.lineStyle(3, SPILL, 1).strokePoints(outline, true, true);
        tone = res.ok ? "good" : "bad";
        box.draw(true, tone);
        if (res.ok) {
          marks.lineStyle(3, LIME, 1).strokePoints(outline, true, true);
          kit.burst(cx, cy, LIME, 28);
          return { ok: true };
        }
        return { ok: false, misconception: res.tag, feedback: PAV_FB[res.tag] || PAV_FB.tooFew };
      },
      async demo() {
        kit.floatText(cx, cy - 30, `½ × ${p.s} × ${p.a} = ${fmt(p.wedge)}`, "#ffd76a", 22);
        await kit.wait(1100);
        if (!p.totalOnly) {
          box.text = fmt(p.wedge);
          count = 0;
          for (let i = 0; i < p.n; i++) {
            count++;
            draw();
            api.sfx.tick(i);
            await kit.wait(160);
          }
        } else {
          await build(1, p.n);
          kit.floatText(cx, cy + 10, `${p.n} × ${fmt(p.wedge)} = ${fmt(p.area)}`, "#ffffff", 22);
          await kit.wait(1000);
          box.text = fmt(p.area);
          draw();
          await build(1, p.n);
        }
        tone = "good";
        box.draw(true, tone);
        await kit.wait(500);
      },
      explain: () =>
        L(
          `${p.n} triangles × (½ × ${p.s} × ${p.a}) = ${p.n} × ${fmt(p.wedge)} = ${fmt(p.area)} square units. Perimeter (${per}) is not area.`,
          `${p.n} triángulos × (½ × ${p.s} × ${p.a}) = ${p.n} × ${fmt(p.wedge)} = ${fmt(p.area)} unidades cuadradas. El perímetro (${per}) no es el área.`,
        ),
    };
  }

  /* ── edging: perimeter vs area with a fixed edging length (5-4) ─────────── */
  const EDGE_FB = {
    perimeterArea: L(
      "You mixed up edging and area. Edging goes AROUND the bed (perimeter). Planting area is the squares INSIDE.",
      "Confundiste el borde con el área. El borde va ALREDEDOR del cantero (perímetro). El área de siembra son los cuadrados de ADENTRO.",
    ),
    halfEdging: L(
      "Length + width only goes halfway around. The edging must go around all four sides.",
      "Largo + ancho solo da media vuelta. El borde tiene que rodear los cuatro lados.",
    ),
    areaOff: L(
      "The edging fits! But the bed has the wrong number of plants. Try another shape with the same edging.",
      "¡El borde alcanza justo! Pero el cantero tiene un número equivocado de plantas. Prueba otra forma con el mismo borde.",
    ),
    edgingOff: L(
      "Right planting area, but the edging does not fit around it. Try another shape with the same area.",
      "El área de siembra es correcta, pero el borde no alcanza justo. Prueba otra forma con la misma área.",
    ),
    bedOff: L(
      "Neither fits yet. Check the edging (around) and the planting area (inside).",
      "Todavía no encaja nada. Revisa el borde (alrededor) y el área de siembra (adentro).",
    ),
  };

  function edging(scene, api) {
    const { kit, rng } = api;
    const p = M.gen.edging(rng);
    const cell = 20;
    const cols = p.maxL;
    const rows = p.maxW;
    const B = makeBoard(scene, kit, { x0: 50, top: 166, cols, rows, cell });
    api.setBrief(
      L(
        `You have ${p.P} units of edging. Build a rectangle bed that uses ALL of it and has exactly ${p.A} square units for planting.`,
        `Tienes ${p.P} unidades de borde. Construye un cantero rectangular que use TODO el borde y tenga exactamente ${p.A} unidades cuadradas para sembrar.`,
      ),
    );
    let l = 2;
    let w = 2;
    let sel = 0;
    const bed = scene.add.graphics().setDepth(21);
    const rope = scene.add.graphics().setDepth(25);
    const plants = scene.add.graphics().setDepth(23);
    cardPanel(kit, 470, 150, 326, 300, api.t(L("GARDEN BED", "CANTERO")));
    const sl = stepper(scene, kit, 560, 222, api.t(L("Length", "Largo")), () => l, (d) => bump(0, d));
    const sw = stepper(scene, kit, 712, 222, api.t(L("Width", "Ancho")), () => w, (d) => bump(1, d));
    const spool = scene.add.graphics().setDepth(25);
    const spoolT = kit.text(633, 300, "", 14, "#ffffff", { weight: "800", depth: 26, wrap: 300 });
    const plantT = kit.text(633, 390, "", 14, "#cfe3ee", { weight: "800", depth: 26, wrap: 300 });
    kit.text(633, 425, api.t(L("Arrows: ←/→ length, ↑/↓ width", "Flechas: ←/→ largo, ↑/↓ ancho")), 12, "#9fb7c4", {
      depth: 26,
    });
    const zone = scene.add
      .zone(B.x0 + (cols * cell) / 2, B.top + (rows * cell) / 2, cols * cell, rows * cell)
      .setInteractive({ useHandCursor: true })
      .setDepth(28);
    const fromPointer = (ptr) => {
      const nl = Phaser.Math.Clamp(Math.round((ptr.x - B.x0) / cell), 1, p.maxL);
      const nw = Phaser.Math.Clamp(Math.round((B.Y(0) - ptr.y) / cell), 1, p.maxW);
      if (nl !== l || nw !== w) {
        l = nl;
        w = nw;
        api.sfx.tick(Math.min(12, l + w));
        draw();
        api.refresh();
      }
    };
    zone.on("pointerdown", fromPointer);
    zone.on("pointermove", (ptr) => ptr.isDown && fromPointer(ptr));
    function perimeterPath() {
      return [
        { x: 0, y: 0 },
        { x: 0, y: w },
        { x: l, y: w },
        { x: l, y: 0 },
        { x: 0, y: 0 },
      ].map(B.pt);
    }
    function drawRope() {
      rope.clear();
      const per = 2 * (l + w);
      const path = perimeterPath();
      let left = Math.min(per, p.P) * cell;
      for (let i = 0; i < 4; i++) {
        const a = path[i];
        const b = path[i + 1];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        const use = Math.max(0, Math.min(seg, left));
        if (use > 0) {
          rope.lineStyle(6, GOLD, 1).lineBetween(a.x, a.y, a.x + ((b.x - a.x) * use) / seg, a.y + ((b.y - a.y) * use) / seg);
        }
        if (use < seg) {
          const sx = a.x + ((b.x - a.x) * use) / seg;
          const sy = a.y + ((b.y - a.y) * use) / seg;
          rope.lineStyle(3, SPILL, 0.9).lineBetween(sx, sy, b.x, b.y);
        }
        left -= use;
      }
      // Spool: what is left on the reel (or how much is missing).
      spool.clear();
      const leftOver = p.P - per;
      spool.fillStyle(0x6b4a2a, 1).fillCircle(520, 340, 26);
      spool.fillStyle(GOLD, 1).fillCircle(520, 340, 8 + Math.max(0, Math.min(16, leftOver)));
      spool.lineStyle(3, 0x3a2614, 1).strokeCircle(520, 340, 26);
      spoolT.setText(
        api.t(L(`Edging on the reel: ${p.P}`, `Borde en el carrete: ${p.P}`)) +
          "\n" +
          (leftOver > 0
            ? api.t(L(`Left on the reel: ${leftOver}`, `Sobra en el carrete: ${leftOver}`))
            : leftOver < 0
              ? api.t(L(`Runs out: ${-leftOver} short`, `No alcanza: faltan ${-leftOver}`))
              : api.t(L("Uses all the edging ✓", "Usa todo el borde ✓"))),
      );
    }
    function draw() {
      bed.clear();
      plants.clear();
      plantT.setText("");
      B.fill(bed, geom.rect(0, 0, l, w), 0x6b4a2e, 1);
      drawRope();
      sl.refresh(sel === 0);
      sw.refresh(sel === 1);
    }
    function bump(which, d) {
      sel = which;
      if (which === 0) l = Phaser.Math.Clamp(l + d, 1, p.maxL);
      else w = Phaser.Math.Clamp(w + d, 1, p.maxW);
      api.sfx.tick(Math.min(12, which ? w : l));
      draw();
      api.refresh();
    }
    draw();
    async function plant() {
      plants.clear();
      const total = l * w;
      const steps = kit.reduced() ? 1 : Math.min(8, w);
      for (let s = 1; s <= steps; s++) {
        const upto = Math.round((w * s) / steps);
        plants.clear();
        for (let r = 0; r < upto; r++)
          for (let c = 0; c < l; c++) {
            const q = B.pt({ x: c + 0.5, y: r + 0.5 });
            plants.fillStyle(LEAF, 1).fillCircle(q.x, q.y, cell * 0.28);
          }
        api.sfx.tick(s);
        await kit.wait(70);
      }
      plantT.setText(
        api.t(L(`Planted: ${total} squares · Goal: ${p.A}`, `Sembrado: ${total} cuadrados · Meta: ${p.A}`)),
      );
    }
    return {
      checkLabel: L("Plant the bed", "Sembrar el cantero"),
      actions: [
        { key: "ArrowRight", label: L("Longer", "Más largo"), run: () => bump(0, 1) },
        { key: "ArrowLeft", label: L("Shorter", "Más corto"), run: () => bump(0, -1) },
        { key: "ArrowUp", label: L("Wider", "Más ancho"), run: () => bump(1, 1) },
        { key: "ArrowDown", label: L("Narrower", "Más angosto"), run: () => bump(1, -1) },
      ],
      status: () => L(`Bed: length ${l}, width ${w}`, `Cantero: largo ${l}, ancho ${w}`),
      hints: [
        L(
          "Edging goes all the way around: perimeter = 2 × (length + width). Planting area = length × width.",
          "El borde rodea todo: perímetro = 2 × (largo + ancho). Área de siembra = largo × ancho.",
        ),
        L(
          `Length + width must be ${p.P} ÷ 2 = ${p.P / 2}. List pairs that add to ${p.P / 2}, and multiply each pair.`,
          `Largo + ancho debe ser ${p.P} ÷ 2 = ${p.P / 2}. Haz una lista de pares que sumen ${p.P / 2} y multiplica cada par.`,
        ),
      ],
      async check() {
        const res = M.judge.edging(p, { w, l });
        await plant();
        if (res.ok) {
          kit.burst(B.X(l / 2), B.Y(w / 2), LIME, 26);
          return { ok: true };
        }
        return { ok: false, misconception: res.tag, feedback: EDGE_FB[res.tag] };
      },
      async demo() {
        const half = p.P / 2;
        for (let a = 1; a <= Math.min(p.w, half - 1); a++) {
          kit.floatText(633, 460 - a * 4, `${a} + ${half - a} → ${a} × ${half - a} = ${a * (half - a)}`, "#ffd76a", 16);
          await kit.wait(450);
        }
        while (l !== p.l) bump(0, Math.sign(p.l - l));
        while (w !== p.w) bump(1, Math.sign(p.w - w));
        await kit.wait(300);
        await plant();
        await kit.wait(500);
      },
      explain: () =>
        L(
          `${p.l} × ${p.w}: edging 2 × (${p.l} + ${p.w}) = ${p.P}, planting area ${p.l} × ${p.w} = ${p.A}. Perimeter goes around; area fills inside.`,
          `${p.l} × ${p.w}: borde 2 × (${p.l} + ${p.w}) = ${p.P}, área de siembra ${p.l} × ${p.w} = ${p.A}. El perímetro rodea; el área llena por dentro.`,
        ),
    };
  }

  M.builders = Object.assign(M.builders || {}, { pavilion, edging });
})();
