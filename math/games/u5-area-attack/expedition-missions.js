/* Terrace Architects — board helpers and the first two mission builders.
 *
 *   frame  a slanted (parallelogram / rhombus) river plot: cut the end triangle off,
 *          slide it across, and size the paving frame to the rectangle it becomes.
 *          A frame sized with the slanted side leaves an empty strip; one that is
 *          too narrow lets the plot spill out.
 *   tiles  order exactly enough paving tiles for a triangle or trapezoid bed. The
 *          tiles are laid: too few leave a bare patch, too many leave a heap.
 * The maths (generators, judges, misconception tags) is in expedition-core.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.AA_MISSIONS;
  if (!X || !M) return;
  const { L, geom, fmt } = M;
  const SOIL = 0x4a3524;
  const SOIL_LINE = 0x6b5038;
  const STONE = 0xd9cfae;
  const LEAF = 0x7ee36d;
  const LIME = 0xccf589;
  const SPILL = 0xff8a5c;
  const GAP = 0xffb35c;
  const PANEL = 0x0b1a14;
  const GOLD = 0xffd76a;

  /* ── Board: a unit grid in grid units (y up) mapped to pixels ──────────── */
  function makeBoard(scene, kit, o) {
    const { x0, top, cols, rows, cell } = o;
    const ox = o.ox || 0; // grid-unit margin left of the shape (room for side labels)
    const X0 = (u) => x0 + (u + ox) * cell;
    const Y0 = (v) => top + (rows - v) * cell;
    const pt = (p) => ({ x: X0(p.x), y: Y0(p.y) });
    const base = scene.add.graphics().setDepth(19);
    base.fillStyle(0x07110c, 0.88).fillRoundedRect(x0 - 14, top - 14, cols * cell + 28, rows * cell + 28, 12);
    base.fillStyle(SOIL, 0.55).fillRect(x0, top, cols * cell, rows * cell);
    const lines = scene.add.graphics().setDepth(24);
    lines.lineStyle(1, 0xffffff, 0.13);
    for (let c = 0; c <= cols; c++) lines.lineBetween(x0 + c * cell, top, x0 + c * cell, top + rows * cell);
    for (let r = 0; r <= rows; r++) lines.lineBetween(x0, top + r * cell, x0 + cols * cell, top + r * cell);
    const labels = [];
    const B = {
      ...o,
      X: X0,
      Y: Y0,
      pt,
      fill(g, pts, color, alpha = 1) {
        if (pts.length >= 3) g.fillStyle(color, alpha).fillPoints(pts.map(pt), true);
      },
      stroke(g, pts, width, color, alpha = 1) {
        g.lineStyle(width, color, alpha).strokePoints(pts.map(pt), true, true);
      },
      dash(g, a, b, color = 0xffffff, width = 2, alpha = 0.95) {
        const A = pt(a);
        const Bp = pt(b);
        const len = Math.hypot(Bp.x - A.x, Bp.y - A.y);
        const n = Math.max(2, Math.floor(len / 9));
        g.lineStyle(width, color, alpha);
        for (let i = 0; i < n; i += 2) {
          const k0 = i / n;
          const k1 = Math.min(1, (i + 1) / n);
          g.lineBetween(
            A.x + (Bp.x - A.x) * k0,
            A.y + (Bp.y - A.y) * k0,
            A.x + (Bp.x - A.x) * k1,
            A.y + (Bp.y - A.y) * k1,
          );
        }
      },
      /** Length label beside edge a→b, pushed away from `inside` (a point inside the shape). */
      edgeLabel(a, b, text, color = "#ffffff", inside = null, gap = 15) {
        const A = pt(a);
        const Bp = pt(b);
        const mx = (A.x + Bp.x) / 2;
        const my = (A.y + Bp.y) / 2;
        const len = Math.hypot(Bp.x - A.x, Bp.y - A.y) || 1;
        let nx = -(Bp.y - A.y) / len;
        let ny = (Bp.x - A.x) / len;
        if (inside) {
          const I = pt(inside);
          if (nx * (I.x - mx) + ny * (I.y - my) > 0) {
            nx = -nx;
            ny = -ny;
          }
        }
        const t = kit.text(mx + nx * gap, my + ny * gap, text, 16, color, {
          weight: "900",
          depth: 27,
          stroke: "#06121c",
          strokeWidth: 4,
        });
        labels.push(t);
        return t;
      },
      rightAngle(foot, dir = 1, size = 8, color = 0xffffff) {
        const F = pt(foot);
        const g = scene.add.graphics().setDepth(26);
        g.lineStyle(2, color, 0.9);
        g.strokePoints(
          [
            { x: F.x + dir * size, y: F.y },
            { x: F.x + dir * size, y: F.y - size },
            { x: F.x, y: F.y - size },
          ],
          false,
        );
        return g;
      },
      clearLabels() {
        labels.splice(0).forEach((t) => t.destroy());
      },
    };
    return B;
  }
  function centroid(pts) {
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  }

  /* ── Number entry box (the keypad and typed digits write into it) ─────── */
  function entryBox(scene, kit, x, y, w, caption, opts = {}) {
    const g = scene.add.graphics().setDepth(25);
    const cap = kit.text(x, y - 34, caption, 13, "#cfe3ee", { weight: "800", depth: 26, wrap: w + 20 });
    const val = kit.text(x, y, "", opts.size || 26, "#ffffff", { weight: "900", depth: 26 });
    const unit = opts.unit ? kit.text(x, y + 30, opts.unit, 12, "#9fb7c4", { depth: 26 }) : null;
    const zone = scene.add.zone(x, y, w, 50).setInteractive({ useHandCursor: true }).setDepth(27);
    const box = {
      text: "",
      zone,
      cap,
      unit,
      draw(active, tone) {
        g.clear();
        const line = tone === "bad" ? SPILL : tone === "good" ? LEAF : active ? GOLD : 0x5e92b3;
        g.fillStyle(0x0d2230, 1).fillRoundedRect(x - w / 2, y - 24, w, 48, 10);
        g.lineStyle(active ? 4 : 2, line, 1).strokeRoundedRect(x - w / 2, y - 24, w, 48, 10);
        val.setText(box.text === "" ? (active ? "▮" : "?") : box.text);
        val.setColor(box.text === "" ? "#ffe9a8" : "#ffffff");
      },
      value: () => M.parseEntry(box.text),
    };
    return box;
  }
  /** Small −/+ stepper with a caption and live value (pointer + the caller's arrow keys). */
  function stepper(scene, kit, x, y, caption, get, bump, opts = {}) {
    kit.text(x, y - 30, caption, 13, "#cfe3ee", { weight: "800", depth: 26 });
    const val = kit.text(x, y, "", 24, "#ffffff", { weight: "900", depth: 26 });
    kit.button(x - 62, y, 40, 40, "−", () => bump(-1), {
      size: 22,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
      depth: 26,
    });
    kit.button(x + 62, y, 40, 40, "+", () => bump(1), { size: 22, depth: 26 });
    return {
      refresh(active) {
        val.setText(String(get()) + (opts.suffix || ""));
        val.setColor(active ? "#ffe9a8" : "#ffffff");
      },
    };
  }
  /** A heap of spare tiles: its size shows "too many" without being a countable answer. */
  function heap(g, cx, groundY, extra, area) {
    const k = Math.min(1.6, extra / Math.max(1, area));
    const layers = Math.max(1, Math.round(2 + k * 5));
    for (let i = 0; i < layers; i++) {
      const wdt = 26 + (layers - i) * 12;
      g.fillStyle(i % 2 ? 0xbdb08e : STONE, 1).fillRect(cx - wdt / 2 + (i % 2) * 4, groundY - (i + 1) * 9, wdt, 8);
      g.lineStyle(1, 0x6b6250, 0.8).strokeRect(cx - wdt / 2 + (i % 2) * 4, groundY - (i + 1) * 9, wdt, 8);
    }
  }
  function cardPanel(kit, x, y, w, h, title) {
    kit.panel(x, y, w, h, { fill: PANEL, alpha: 0.9, depth: 19 });
    if (title) kit.text(x + w / 2, y + 18, title, 13, "#ccf589", { weight: "800", depth: 26 });
  }

  /* ── frame: parallelograms and rhombuses (lesson 5-1) ─────────────────── */
  const FRAME_FB = {
    slantHeight: L(
      "The frame is as tall as the slanted side, so a strip stays empty. Height goes straight up from the base: the dashed line.",
      "El marco es tan alto como el lado inclinado y queda una franja vacía. La altura sube recta desde la base: la línea punteada.",
    ),
    fullWidth: L(
      "The frame is too wide: you measured corner to corner. After the slide, the rectangle is only as wide as the base.",
      "El marco es demasiado ancho: mediste de esquina a esquina. Después de deslizar, el rectángulo mide lo mismo que la base.",
    ),
    swapped: L(
      "Base and height are switched, so the plot does not fit. Width = the base. Height = the dashed line.",
      "La base y la altura están cambiadas y la parcela no cabe. Ancho = la base. Altura = la línea punteada.",
    ),
  };
  function frameOffFeedback(res) {
    const parts = [];
    if (res.wide > 0) parts.push(L("too wide", "demasiado ancho"));
    if (res.wide < 0) parts.push(L("too narrow", "demasiado angosto"));
    if (res.tall > 0) parts.push(L("too tall", "demasiado alto"));
    if (res.tall < 0) parts.push(L("too short", "demasiado bajo"));
    return L(
      `The slid plot does not match the frame: it is ${parts.map((x) => x.en).join(" and ")}. Orange = plot spills out. Dark = empty frame.`,
      `La parcela no coincide con el marco: es ${parts.map((x) => x.es).join(" y ")}. Naranja = la parcela se sale. Oscuro = marco vacío.`,
    );
  }

  function frame(scene, api) {
    const { kit, rng } = api;
    const p = M.gen.frame(rng, api.tier, api.mission.variant);
    const cols = p.cols + 1;
    const cell = Math.min(34, Math.floor(470 / cols), Math.floor(270 / p.rows));
    const x0 = 44 + Math.floor((470 - cols * cell) / 2);
    const top = 158 + Math.floor((270 - p.rows * cell) / 2);
    const B = makeBoard(scene, kit, { x0, top, cols, rows: p.rows, cell, ox: 1 });
    const rhombus = p.kind === "rhombus";
    api.setBrief(
      rhombus
        ? L(
            `A rhombus plot: all four sides are ${p.s} units. Cut the triangle off one end, slide it across, and size the paving frame to the rectangle you get.`,
            `Una parcela con forma de rombo: los cuatro lados miden ${p.s} unidades. Corta el triángulo de un extremo, deslízalo y ajusta el marco al rectángulo que se forma.`,
          )
        : L(
            "This river plot leans. Cut the triangle off the slanted end, slide it to the other end, and size the paving frame to the rectangle you get.",
            "Esta parcela del río está inclinada. Corta el triángulo del extremo inclinado, deslízalo al otro extremo y ajusta el marco al rectángulo que se forma.",
          ),
    );
    let w = 2;
    let hh = 2;
    let sel = 0; // 0 = width, 1 = height
    let shown = false;
    const plot = scene.add.graphics().setDepth(21);
    const cutG = scene.add.graphics().setDepth(22);
    const over = scene.add.graphics().setDepth(23);
    const frameG = scene.add.graphics().setDepth(25);
    const marks = scene.add.graphics().setDepth(26);
    const inside = centroid(p.pts);
    // Plot + labels.
    B.fill(plot, p.rest, 0x3d6b3a, 0.95);
    B.stroke(plot, p.rest, 3, LIME, 0.95);
    B.fill(cutG, p.cut, 0x4f8a48, 1);
    B.stroke(cutG, p.cut, 3, LIME, 0.95);
    const hx = p.lean > 0 ? p.off : p.b;
    B.dash(marks, { x: hx, y: 0 }, { x: hx, y: p.h }, 0xffffff, 3);
    B.rightAngle({ x: hx, y: 0 }, p.lean > 0 ? 1 : -1);
    const baseA = p.lean > 0 ? { x: 0, y: 0 } : { x: p.off, y: 0 };
    B.edgeLabel(baseA, { x: baseA.x + p.b, y: 0 }, `${p.b}`, "#ffffff", inside);
    B.edgeLabel(p.pts[1], p.pts[2], `${p.s}`, "#ffd9a0", inside);
    kit.text(B.X(hx) + (p.lean > 0 ? -14 : 14), B.Y(p.h / 2), `${p.h}`, 16, "#ffffff", {
      weight: "900",
      depth: 27,
      stroke: "#06121c",
      strokeWidth: 4,
    });
    if (rhombus) B.edgeLabel(p.pts[2], p.pts[3], `${p.s}`, "#ffd9a0", inside);

    // Controls card.
    cardPanel(kit, 548, 150, 248, 300, api.t(L("PAVING FRAME", "MARCO DE PAVIMENTO")));
    const sw = stepper(scene, kit, 672, 230, api.t(L("Width (base)", "Ancho (base)")), () => w, (d) => bump(0, d));
    const sh = stepper(scene, kit, 672, 320, api.t(L("Height", "Altura")), () => hh, (d) => bump(1, d));
    const key = kit.text(672, 400, "", 12, "#9fb7c4", { depth: 26, wrap: 220 });
    key.setText(
      api.t(L("Drag the gold handle, or use the arrow keys.", "Arrastra el punto dorado o usa las flechas.")),
    );
    const zone = scene.add
      .zone(B.x0 + (cols * cell) / 2, B.top + (p.rows * cell) / 2, cols * cell, p.rows * cell)
      .setInteractive({ useHandCursor: true })
      .setDepth(28);
    const fromPointer = (ptr) => {
      const nw = Phaser.Math.Clamp(Math.round((ptr.x - B.X(p.frameX)) / cell), 1, p.maxW);
      const nh = Phaser.Math.Clamp(Math.round((B.Y(0) - ptr.y) / cell), 1, p.maxH);
      if (nw !== w || nh !== hh) {
        w = nw;
        hh = nh;
        api.sfx.tick(Math.min(12, w + hh));
        draw();
        api.refresh();
      }
    };
    zone.on("pointerdown", fromPointer);
    zone.on("pointermove", (ptr) => ptr.isDown && fromPointer(ptr));

    function reset() {
      if (!shown) return;
      shown = false;
      cutG.x = 0;
      over.clear();
    }
    function draw() {
      reset();
      frameG.clear();
      const a = B.pt({ x: p.frameX, y: 0 });
      const b = B.pt({ x: p.frameX + w, y: hh });
      frameG.lineStyle(4, GOLD, 0.95).strokeRect(a.x, b.y, b.x - a.x, a.y - b.y);
      frameG.fillStyle(GOLD, 0.08).fillRect(a.x, b.y, b.x - a.x, a.y - b.y);
      frameG.fillStyle(GOLD, 1).fillCircle(b.x, b.y, 8);
      frameG.lineStyle(2, 0x06121c, 1).strokeCircle(b.x, b.y, 8);
      sw.refresh(sel === 0);
      sh.refresh(sel === 1);
    }
    function bump(which, d) {
      sel = which;
      if (which === 0) w = Phaser.Math.Clamp(w + d, 1, p.maxW);
      else hh = Phaser.Math.Clamp(hh + d, 1, p.maxH);
      api.sfx.tick(Math.min(12, which ? hh : w));
      draw();
      api.refresh();
    }
    draw();

    async function slideAndCompare() {
      api.sfx.whoosh();
      if (kit.reduced()) cutG.x = p.lean * p.b * cell;
      else {
        kit.tween({ targets: cutG, x: p.lean * p.b * cell, duration: 650, ease: "Cubic.easeInOut" });
        await kit.wait(700);
      }
      shown = true;
      over.clear();
      const fx = p.frameX;
      const ix = Math.min(w, p.b);
      const iy = Math.min(hh, p.h);
      const R = (x0, y0, x1, y1, color, alpha) => B.fill(over, geom.rect(x0, y0, x1, y1), color, alpha);
      R(fx, 0, fx + ix, iy, STONE, 0.55);
      if (p.b > w) R(fx + w, 0, fx + p.b, p.h, SPILL, 0.85);
      if (p.h > hh) R(fx, hh, fx + ix, p.h, SPILL, 0.85);
      if (w > p.b) R(fx + p.b, 0, fx + w, hh, 0x05090c, 0.85);
      if (hh > p.h) R(fx, p.h, fx + ix, hh, 0x05090c, 0.85);
      api.sfx.place();
    }
    return {
      checkLabel: L("Lay the paving", "Colocar el pavimento"),
      actions: [
        { key: "ArrowRight", label: L("Wider", "Más ancho"), run: () => bump(0, 1) },
        { key: "ArrowLeft", label: L("Narrower", "Más angosto"), run: () => bump(0, -1) },
        { key: "ArrowUp", label: L("Taller", "Más alto"), run: () => bump(1, 1) },
        { key: "ArrowDown", label: L("Shorter", "Más bajo"), run: () => bump(1, -1) },
      ],
      status: () => L(`Frame: width ${w}, height ${hh}`, `Marco: ancho ${w}, altura ${hh}`),
      hints: [
        L(
          "Cut the triangle off the slanted end and slide it to the other end. The plot becomes a rectangle with the same base and the same height.",
          "Corta el triángulo del extremo inclinado y deslízalo al otro extremo. La parcela se vuelve un rectángulo con la misma base y la misma altura.",
        ),
        L(
          `Width: count the squares along the bottom edge. Height: count along the dashed line. The slanted side (${p.s}) is not the height.`,
          `Ancho: cuenta los cuadrados del borde de abajo. Altura: cuenta a lo largo de la línea punteada. El lado inclinado (${p.s}) no es la altura.`,
        ),
      ],
      async check() {
        const res = M.judge.frame(p, { w, h: hh });
        await slideAndCompare();
        if (res.ok) {
          kit.burst(B.X(p.frameX + p.b / 2), B.Y(p.h / 2), LIME, 26);
          return { ok: true };
        }
        kit.shake(0.003, 140);
        return {
          ok: false,
          misconception: res.tag,
          feedback: FRAME_FB[res.tag] || frameOffFeedback(res),
        };
      },
      async demo() {
        sel = 0;
        while (w !== p.b) {
          bump(0, Math.sign(p.b - w));
          await kit.wait(140);
        }
        kit.floatText(B.X(p.frameX + p.b / 2), B.Y(0) + 20, api.t(L(`base ${p.b}`, `base ${p.b}`)), "#ffd76a", 20);
        sel = 1;
        while (hh !== p.h) {
          bump(1, Math.sign(p.h - hh));
          await kit.wait(140);
        }
        kit.floatText(B.X(hx), B.Y(p.h + 0.6), api.t(L(`height ${p.h}`, `altura ${p.h}`)), "#ffd76a", 20);
        await kit.wait(500);
        await slideAndCompare();
        kit.floatText(B.X(p.frameX + p.b / 2), B.Y(p.h / 2), `${p.b} × ${p.h} = ${p.area}`, "#ffffff", 24);
        await kit.wait(900);
      },
      explain: () =>
        L(
          `Cut and slide: the ${rhombus ? "rhombus" : "parallelogram"} becomes a ${p.b} × ${p.h} rectangle. Area = base × height = ${p.area} square units. The slanted side (${p.s}) is not the height.`,
          `Corta y desliza: el ${rhombus ? "rombo" : "paralelogramo"} se vuelve un rectángulo de ${p.b} × ${p.h}. Área = base × altura = ${p.area} unidades cuadradas. El lado inclinado (${p.s}) no es la altura.`,
        ),
    };
  }

  /* ── tiles: triangles (5-2) and trapezoids (5-3) ──────────────────────── */
  const TILE_FB = {
    noHalf: L(
      "Too many tiles: a heap is left over. Base × height covers TWO copies of this bed. This bed is half of that.",
      "Demasiadas baldosas: sobra un montón. Base × altura cubre DOS copias de este cantero. Este cantero es la mitad.",
    ),
    slantHeight: L(
      "You used the slanted side as the height. The height is the dashed line, at a right angle to the base.",
      "Usaste el lado inclinado como altura. La altura es la línea punteada, en ángulo recto con la base.",
    ),
    perimeter: L(
      "That number is the distance around the bed (perimeter). Area counts the square tiles inside.",
      "Ese número es la distancia alrededor del cantero (perímetro). El área cuenta las baldosas cuadradas de adentro.",
    ),
    addLengths: L(
      "You added the lengths. Area multiplies: tiles fill rows, not a line.",
      "Sumaste las longitudes. El área multiplica: las baldosas llenan filas, no una línea.",
    ),
    oneBase: L(
      "Only one base was used. A trapezoid's area uses BOTH bases added together.",
      "Usaste solo una base. El área del trapecio usa las DOS bases sumadas.",
    ),
    tooMany: L(
      "Too many tiles: a heap is left over. Find the area again.",
      "Demasiadas baldosas: sobra un montón. Calcula el área otra vez.",
    ),
    tooFew: L(
      "Not enough tiles: a bare patch of soil is left. Find the area again.",
      "No alcanzan las baldosas: queda un pedazo de tierra sin cubrir. Calcula el área otra vez.",
    ),
  };

  function tiles(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "tri";
    const p = M.gen.tiles(rng, api.tier, variant);
    const trap = p.shape === "trap";
    const bb = geom.bounds([...p.pts, ...p.twin]);
    const cols = Math.ceil(bb.x1) + 2;
    const rows = p.h + 1;
    const cell = Math.min(34, Math.floor(500 / cols), Math.floor(246 / rows));
    const x0 = 44 + Math.floor((500 - cols * cell) / 2);
    const top = 154 + Math.floor((246 - rows * cell) / 2);
    const B = makeBoard(scene, kit, { x0, top, cols, rows, cell, ox: 1 });
    api.setBrief(
      trap
        ? L(
            "Pave this trapezoid bed in the Sunken Courtyard. Order exactly enough square tiles: no bare soil, no heap left over.",
            "Pavimenta este cantero con forma de trapecio en el Patio Hundido. Pide las baldosas exactas: sin tierra descubierta y sin montón sobrante.",
          )
        : L(
            "Pave this triangle bed on the River Terrace. Order exactly enough square tiles: no bare soil, no heap left over.",
            "Pavimenta este cantero triangular en la Terraza del Río. Pide las baldosas exactas: sin tierra descubierta y sin montón sobrante.",
          ),
    );
    const bed = scene.add.graphics().setDepth(20.5);
    const pave = scene.add.graphics().setDepth(21);
    const twinG = scene.add.graphics().setDepth(22).setAlpha(0);
    const marks = scene.add.graphics().setDepth(26);
    const inside = centroid(p.pts);
    B.fill(bed, p.pts, 0x6b4a2e, 1);
    B.stroke(marks, p.pts, 3, LIME, 1);
    // Labels: bases, slanted side, dashed height.
    if (trap) {
      const sorted = p.pts.slice().sort((a, b) => a.y - b.y || a.x - b.x);
      const low = sorted.slice(0, 2);
      const high = sorted.slice(2);
      const bottomLen = Math.abs(low[1].x - low[0].x);
      B.edgeLabel(low[0], low[1], `${bottomLen}`, "#ffffff", inside);
      B.edgeLabel(high[0], high[1], `${Math.abs(high[1].x - high[0].x)}`, "#ffffff", inside);
    } else {
      B.edgeLabel(p.pts[0], p.pts[1], `${p.b}`, "#ffffff", inside);
    }
    B.edgeLabel(p.slantEdge[0], p.slantEdge[1], `${p.s}`, "#ffd9a0", inside);
    const [h0, h1] = p.heightLine;
    if (p.heightIsSide) B.edgeLabel(h0, h1, `${p.h}`, "#ffffff", inside);
    else {
      B.dash(marks, h0, h1, 0xffffff, 3);
      const right = h0.x >= inside.x;
      kit.text(B.X(h0.x) + (right ? 14 : -14), B.Y(p.h / 2), `${p.h}`, 16, "#ffffff", {
        weight: "900",
        depth: 27,
        stroke: "#06121c",
        strokeWidth: 4,
      });
    }
    const footY = Math.min(h0.y, h1.y);
    B.rightAngle({ x: h0.x, y: footY }, h0.x >= inside.x ? -1 : 1);
    if (p.baseExtension) B.dash(marks, p.baseExtension[0], p.baseExtension[1], 0xffffff, 2);

    // Order card + pallet.
    cardPanel(kit, 576, 150, 220, 300, api.t(L("TILE ORDER", "PEDIDO DE BALDOSAS")));
    const box = entryBox(scene, kit, 686, 230, 150, api.t(L("Tiles to order", "Baldosas a pedir")), {
      unit: api.t(L("square tiles", "baldosas cuadradas")),
    });
    kit.text(686, 300, api.t(L("PALLET", "PALÉ")), 12, "#9fb7c4", { weight: "800", depth: 26 });
    const pallet = scene.add.graphics().setDepth(25);
    function drawPallet(extra) {
      pallet.clear();
      pallet.fillStyle(0x6b4a2a, 1).fillRect(626, 424, 120, 10);
      pallet.fillStyle(0x4a321c, 1).fillRect(632, 434, 12, 8).fillRect(680, 434, 12, 8).fillRect(728, 434, 12, 8);
      if (extra > 0) heap(pallet, 686, 424, extra, p.area);
    }
    drawPallet(0);
    let tone = null;
    const draw = () => box.draw(true, tone);
    box.zone.on("pointerdown", draw);
    function type(key) {
      const next = M.typeInto(box.text, key, 3, false);
      if (next === box.text) return;
      box.text = next;
      tone = null;
      pave.clear();
      drawPallet(0);
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType(type);
    kit.keypad(44, 456, type, { size: 38 });
    draw();

    async function lay(v) {
      pave.clear();
      drawPallet(0);
      const frac = Math.min(1, v / p.area);
      const steps = kit.reduced() ? 1 : 10;
      api.sfx.place();
      for (let i = 1; i <= steps; i++) {
        const lvl = geom.fillLevel(p.pts, (frac * i) / steps);
        pave.clear();
        B.fill(pave, geom.clipBelow(p.pts, lvl), STONE, 1);
        await kit.wait(55);
      }
      if (v > p.area) drawPallet(v - p.area);
      if (v < p.area) {
        const lvl = geom.fillLevel(p.pts, frac);
        const bare = p.pts.length ? clipAbove(p.pts, lvl) : [];
        B.fill(pave, bare, 0x2a1a0e, 0.65);
        B.stroke(pave, bare, 2, GAP, 0.9);
      }
    }
    function clipAbove(pts, level) {
      // Mirror trick: the part above y = level is the part below after flipping y.
      const flip = pts.map((q) => ({ x: q.x, y: -q.y }));
      return geom.clipBelow(flip, -level).map((q) => ({ x: q.x, y: -q.y }));
    }
    const sum = trap ? p.b1 + p.b2 : 0;
    return {
      checkLabel: L("Lay the tiles", "Colocar baldosas"),
      actions: [{ key: "Delete", label: L("Erase digit", "Borrar dígito"), run: () => type("Backspace") }],
      status: () =>
        L(
          `Tiles ordered: ${box.text === "" ? "none yet" : box.text}`,
          `Baldosas pedidas: ${box.text === "" ? "ninguna aún" : box.text}`,
        ),
      hints: trap
        ? [
            L(
              "Two copies of a trapezoid make a parallelogram. Its base is both bases added. So area = ½ × (base 1 + base 2) × height.",
              "Dos copias de un trapecio forman un paralelogramo. Su base son las dos bases sumadas. Área = ½ × (base 1 + base 2) × altura.",
            ),
            L(
              `Add the bases: ${p.b1} + ${p.b2} = ${sum}. Multiply by the height ${p.h} (not the slanted ${p.s}), then take half.`,
              `Suma las bases: ${p.b1} + ${p.b2} = ${sum}. Multiplica por la altura ${p.h} (no el lado inclinado ${p.s}) y luego toma la mitad.`,
            ),
          ]
        : [
            L(
              "Two copies of this triangle make a parallelogram. So the triangle is half of base × height.",
              "Dos copias de este triángulo forman un paralelogramo. El triángulo es la mitad de base × altura.",
            ),
            L(
              `Multiply base ${p.b} by height ${p.h} (the dashed line, not the slanted ${p.s}). Then take half.`,
              `Multiplica la base ${p.b} por la altura ${p.h} (la línea punteada, no el lado inclinado ${p.s}). Luego toma la mitad.`,
            ),
          ],
      async check() {
        const v = box.value();
        if (v == null)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Type how many tiles to order first.", "Primero escribe cuántas baldosas pedir."),
          };
        const res = M.judge.tiles(p, v);
        await lay(v);
        tone = res.ok ? "good" : "bad";
        draw();
        if (res.ok) {
          kit.burst(B.X(inside.x), B.Y(inside.y), LIME, 24);
          return { ok: true };
        }
        return { ok: false, misconception: res.tag, feedback: TILE_FB[res.tag] || TILE_FB.tooFew };
      },
      async demo() {
        B.fill(twinG, p.twin, 0xbfe6ff, 0.35);
        B.stroke(twinG, p.twin, 3, 0xbfe6ff, 0.9);
        kit.tween({ targets: twinG, alpha: 1, duration: 500 });
        await kit.wait(600);
        const c = centroid([...p.pts, ...p.twin]);
        kit.floatText(
          B.X(c.x),
          B.Y(c.y),
          trap ? `(${p.b1} + ${p.b2}) × ${p.h} = ${p.double}` : `${p.b} × ${p.h} = ${p.double}`,
          "#ffffff",
          24,
        );
        await kit.wait(1300);
        kit.tween({ targets: twinG, alpha: 0, duration: 400 });
        kit.floatText(B.X(inside.x), B.Y(inside.y), `½ × ${p.double} = ${p.area}`, "#ffd76a", 24);
        await kit.wait(900);
        box.text = String(p.area);
        draw();
        await lay(p.area);
        tone = "good";
        draw();
        await kit.wait(500);
      },
      explain: () =>
        trap
          ? L(
              `Two trapezoids make a parallelogram with base ${p.b1} + ${p.b2}. Area = ½ × (${p.b1} + ${p.b2}) × ${p.h} = ${p.area} tiles.`,
              `Dos trapecios forman un paralelogramo de base ${p.b1} + ${p.b2}. Área = ½ × (${p.b1} + ${p.b2}) × ${p.h} = ${p.area} baldosas.`,
            )
          : L(
              `Two triangles make a parallelogram. Area = ½ × ${p.b} × ${p.h} = ${p.area} tiles. The height is the dashed line, not the slanted side.`,
              `Dos triángulos forman un paralelogramo. Área = ½ × ${p.b} × ${p.h} = ${p.area} baldosas. La altura es la línea punteada, no el lado inclinado.`,
            ),
    };
  }

  M.ui = { makeBoard, entryBox, stepper, heap, cardPanel, centroid };
  M.colors = { SOIL, SOIL_LINE, STONE, LEAF, LIME, SPILL, GAP, PANEL, GOLD };
  M.builders = Object.assign(M.builders || {}, { frame, tiles });
  M.fmtNum = fmt;
})();
