/* Orbital Builders — fractional packing and hull nets.
 *
 *   packer   a greenhouse tray with fractional edges, packed with ½- or ⅓-unit cubes.
 *            The student types its volume as a mixed number; the packer loads exactly
 *            that much, so a short volume leaves the top bare and a big one spills.
 *   net      a module's hull plates laid out on a cutting sheet with plates missing.
 *            The student places them; the sheet folds and every plate shows the side
 *            it lands on — a doubled side and an open side show exactly what went wrong.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.VB_MATH;
  const K = window.VB_MISSIONS;
  if (!X || !M || !K) return;
  const { L, fr, ffmt, fmul, fval } = M;
  const { PANEL } = K;
  const LEAF = { top: 0xa9f0b4, right: 0x5fc27a, front: 0x3e9659, edge: 0x123d22 };

  /* ── packer: volume with fractional edges ─────────────────────────────── */
  function packer(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "half";
    const p = M.genPacker(rng, api.tier, variant);
    const { k, edges, V, B } = p;
    const [a, b, c] = edges;
    const ev = edges.map(fval);
    const briefs = {
      half: L(
        `Seed tray: ${ffmt(a)} × ${ffmt(b)} × ${ffmt(c)} units. Pack it with ½-unit cubes. What is its volume in cubic units?`,
        `Bandeja de semillas: ${ffmt(a)} × ${ffmt(b)} × ${ffmt(c)} unidades. Llénala con cubos de ½ unidad. ¿Cuál es su volumen en unidades cúbicas?`,
      ),
      base: L(
        `Grow box: the base is ${ffmt(a)} by ${ffmt(b)} and the height is ${ffmt(c)}. Use V = B × h. What volume of soil fills it?`,
        `Caja de cultivo: la base mide ${ffmt(a)} por ${ffmt(b)} y la altura es ${ffmt(c)}. Usa V = B × h. ¿Qué volumen de tierra la llena?`,
      ),
      third: L(
        `Water tank: ${ffmt(a)} × ${ffmt(b)} × ${ffmt(c)} units, packed with ⅓-unit cubes. What is its volume in cubic units?`,
        `Tanque de agua: ${ffmt(a)} × ${ffmt(b)} × ${ffmt(c)} unidades, lleno de cubos de ⅓ de unidad. ¿Cuál es su volumen en unidades cúbicas?`,
      ),
    };
    api.setBrief(briefs[variant]);
    const box = { x: 30, y: 150, w: 420, h: 274 };
    const { P } = K.isoFit(box, ev[0], ev[1], ev[2], 0.8);
    const back = scene.add.graphics().setDepth(20);
    const fill = scene.add.graphics().setDepth(21);
    const front = scene.add.graphics().setDepth(22);
    K.bayBack(back, P, ev[0], ev[1], ev[2], { step: 1 / k, color: 0xa9f0b4 });
    K.bayFront(front, P, ev[0], ev[1], ev[2], 0xa9f0b4);
    K.edgeLabels(kit, P, ev[0], ev[1], ev[2], edges.map(ffmt));
    if (variant === "base") {
      // Shade the base so B reads as an area.
      back
        .fillStyle(0xffd76a, 0.22)
        .fillPoints([P(0, 0, 0), P(ev[0], 0, 0), P(ev[0], ev[1], 0), P(0, ev[1], 0)], true);
      const m = P(ev[0] / 2, ev[1] / 2, 0);
      kit.text(m.x, m.y, "B", 20, "#ffd76a", { weight: "900", depth: 23, stroke: "#06121c" });
    }
    // Right console: legend + mixed-number entry.
    kit.panel(470, 146, 320, 284, { fill: PANEL, alpha: 0.9 });
    if (variant !== "base") {
      const lg = scene.add.graphics().setDepth(22);
      const unit = K.isoFit({ x: 488, y: 156, w: 70, h: 62 }, 1, 1, 1).P;
      for (let i = 0; i < k; i++)
        for (let j = 0; j < k; j++)
          for (let z = 0; z < k; z++) K.cube(lg, unit, i / k, j / k, z / k, 1 / k, LEAF);
      kit.text(
        572,
        187,
        api.t(
          k === 3
            ? L("27 small cubes\nmake 1 unit cube", "27 cubos pequeños\nforman 1 cubo unidad")
            : L("8 small cubes\nmake 1 unit cube", "8 cubos pequeños\nforman 1 cubo unidad"),
        ),
        14,
        "#cfe3ee",
        { ox: 0, align: "left", depth: 23 },
      );
    } else kit.text(630, 186, "V = B × h", 24, "#ffd76a", { weight: "900" });
    kit.text(630, 236, api.t(L("VOLUME", "VOLUMEN")), 14, "#ffd76a", { weight: "800" });
    const field = K.fracField(scene, kit, 630, 296);
    field.zones(() => api.refresh());
    kit.text(630, 352, api.t(L("cubic units", "unidades cúbicas")), 15, "#cfe3ee");
    kit.text(630, 400, api.t(L("→ next box", "→ casilla siguiente")), 13, "#8fa6b5");
    kit.keypad(290, 452, (key) => type(key), { size: 40, gap: 6 });
    function type(key) {
      if (field.type(key)) {
        api.sfx.tap();
        api.refresh();
      }
    }
    kit.onType(type);
    const cellsL = Math.round(ev[0] * k);
    const cellsW = Math.round(ev[1] * k);
    const cellsH = Math.round(ev[2] * k);
    async function pack(count) {
      const per = cellsL * cellsW;
      const layers = Math.min(Math.ceil(count / per), cellsH + 2);
      for (const z of K.stages(Math.max(1, layers))) {
        fill.clear();
        K.fillCells(fill, P, cellsL, cellsW, cellsH, 1 / k, Math.min(count, per * z), {
          col: LEAF,
        });
        front.clear();
        K.bayFront(front, P, ev[0], ev[1], ev[2], 0xa9f0b4);
        api.sfx.tick(Math.min(12, z));
        await kit.wait(220);
      }
    }
    const cubeWord = k === 3 ? "⅓ × ⅓ × ⅓" : "½ × ½ × ½";
    const many = k === 3 ? 27 : 8;
    const FEEDBACK = {
      addDims: L(
        "You added the edges. Volume multiplies them: length × width × height.",
        "Sumaste las aristas. El volumen las multiplica: largo × ancho × alto.",
      ),
      countSmall: L(
        "You counted small cubes as if each one were a whole unit cube. Each small cube is only part of a unit cube.",
        "Contaste los cubos pequeños como si cada uno fuera un cubo unidad. Cada cubo pequeño es solo una parte.",
      ),
      smallCube: L(
        `Check one small cube: ${cubeWord} is a product, not a sum. It takes ${many} small cubes to make 1 unit cube.`,
        `Revisa un cubo pequeño: ${cubeWord} es un producto, no una suma. Se necesitan ${many} cubos pequeños para formar 1 cubo unidad.`,
      ),
      splitMixed: L(
        "You multiplied the whole numbers and left the fraction alone. Write each mixed number as a fraction, then multiply.",
        "Multiplicaste los enteros y dejaste la fracción sola. Escribe cada número mixto como fracción y luego multiplica.",
      ),
      roundedEdges: L(
        "You turned a fractional edge into a whole number. The fraction part holds cubes too: use the exact edge.",
        "Convertiste una arista fraccionaria en un número entero. La parte fraccionaria también tiene cubos: usa la arista exacta.",
      ),
      packShort: L(
        "Too little: the top of the tray stays bare (red). Multiply the exact edges again.",
        "Muy poco: la parte de arriba queda vacía (rojo). Multiplica otra vez las aristas exactas.",
      ),
      packOver: L(
        "Too much: cubes spill over the top (orange). Multiply the exact edges again.",
        "Demasiado: los cubos se desbordan por arriba (naranja). Multiplica otra vez las aristas exactas.",
      ),
    };
    const improper = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
    const hints = {
      half: [
        L(
          `Multiply length × width × height. Or count ½-cubes: ${ffmt(a)} holds ${Math.round(ev[0] * 2)} of them along its edge, and ${many} small cubes make 1 unit cube.`,
          `Multiplica largo × ancho × alto. O cuenta cubos de ½: en ${ffmt(a)} caben ${Math.round(ev[0] * 2)} a lo largo, y ${many} cubos pequeños forman 1 cubo unidad.`,
        ),
        L(
          `Write the edges as fractions: ${improper(a)} × ${improper(b)} × ${improper(c)}. Multiply the tops, then the bottoms.`,
          `Escribe las aristas como fracciones: ${improper(a)} × ${improper(b)} × ${improper(c)}. Multiplica los numeradores y luego los denominadores.`,
        ),
      ],
      base: [
        L(
          "First find the base area B = length × width. Then multiply B by the height.",
          "Primero halla el área de la base B = largo × ancho. Luego multiplica B por la altura.",
        ),
        L(
          `B = ${ffmt(a)} × ${ffmt(b)} = ${ffmt(B)}. Now find ${ffmt(B)} × ${ffmt(c)}: write both as fractions (${improper(B)} × ${improper(c)}).`,
          `B = ${ffmt(a)} × ${ffmt(b)} = ${ffmt(B)}. Ahora halla ${ffmt(B)} × ${ffmt(c)}: escribe los dos como fracciones (${improper(B)} × ${improper(c)}).`,
        ),
      ],
      third: [
        L(
          `Multiply length × width × height. A ⅓-unit edge fits 3 times in 1 unit, and ${many} small cubes make 1 unit cube.`,
          `Multiplica largo × ancho × alto. Una arista de ⅓ cabe 3 veces en 1 unidad, y ${many} cubos pequeños forman 1 cubo unidad.`,
        ),
        L(
          `Write the edges as fractions: ${improper(a)} × ${improper(b)} × ${improper(c)}. Multiply the tops, then the bottoms.`,
          `Escribe las aristas como fracciones: ${improper(a)} × ${improper(b)} × ${improper(c)}. Multiplica los numeradores y luego los denominadores.`,
        ),
      ],
    };
    return {
      checkLabel: L("Pack it", "Llenar"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next box", "Casilla siguiente"),
          run: () => (field.move(1), api.refresh()),
        },
        {
          key: "ArrowLeft",
          label: L("Previous box", "Casilla anterior"),
          run: () => (field.move(-1), api.refresh()),
        },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => type("Backspace"),
        },
      ],
      status: () => {
        const e = field.e;
        const s = `${e.w || "_"} ${e.n || "_"}/${e.d || "_"}`;
        return L(`Volume entry: ${s}`, `Volumen escrito: ${s}`);
      },
      hints: hints[variant],
      async check() {
        const v = field.value();
        if (!v || field.empty())
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Type the volume. A fraction needs a top and a bottom number.",
              "Escribe el volumen. Una fracción necesita un número arriba y uno abajo.",
            ),
          };
        await pack(Math.floor(fval(fmul(v, fr(k * k * k))) + 1e-9));
        const tag = M.classifyPacker(p, v);
        if (!tag) {
          const top = P(ev[0] / 2, ev[1] / 2, ev[2]);
          kit.burst(top.x, top.y, 0xa9f0b4, 30);
          return { ok: true };
        }
        if (fval(v) < fval(V)) {
          const filled = Math.floor((fval(v) * k * k * k) / (cellsL * cellsW)) / k;
          K.markGap(front, P, ev[0], ev[1], ev[2], filled);
        }
        return { ok: false, misconception: tag, feedback: FEEDBACK[tag] };
      },
      async demo() {
        field.e = { w: "", n: "", d: "" };
        field.draw();
        const steps =
          variant === "base"
            ? [
                [a, b, B],
                [B, c, V],
              ]
            : [
                [a, b, fmul(a, b)],
                [fmul(a, b), c, V],
              ];
        for (const [x, y, z] of steps) {
          const tip = P(ev[0], 0, ev[2]);
          kit.floatText(
            tip.x + 40,
            tip.y + 30,
            `${ffmt(x)} × ${ffmt(y)} = ${ffmt(z)}`,
            "#ffd76a",
            20,
          );
          api.sfx.tick(6);
          await kit.wait(1100);
        }
        field.set(V);
        await pack(p.N);
        await kit.wait(400);
      },
      explain: () =>
        variant === "base"
          ? L(
              `B = ${ffmt(a)} × ${ffmt(b)} = ${ffmt(B)}. V = B × h = ${ffmt(B)} × ${ffmt(c)} = ${ffmt(V)} cubic units.`,
              `B = ${ffmt(a)} × ${ffmt(b)} = ${ffmt(B)}. V = B × h = ${ffmt(B)} × ${ffmt(c)} = ${ffmt(V)} unidades cúbicas.`,
            )
          : L(
              `${ffmt(a)} × ${ffmt(b)} × ${ffmt(c)} = ${ffmt(V)} cubic units — that is ${p.N} small cubes ÷ ${many}.`,
              `${ffmt(a)} × ${ffmt(b)} × ${ffmt(c)} = ${ffmt(V)} unidades cúbicas: ${p.N} cubos pequeños ÷ ${many}.`,
            ),
      _p: p,
      _field: field,
    };
  }

  /* ── net: place the missing hull plates so the sheet folds shut ────────── */
  function net(scene, api) {
    const { kit, rng } = api;
    const nt = M.genNet(rng, api.tier);
    const { dims, cols, rows, given, missing } = nt;
    const isCube = dims.a === dims.b && dims.b === dims.c;
    api.setBrief(
      isCube
        ? L(
            `This crate is a cube. Its net is missing ${missing.length === 1 ? "one plate" : "two plates"}. Place the gold plate so the net folds into a closed cube.`,
            `Esta caja es un cubo. A su red le ${missing.length === 1 ? "falta una placa" : "faltan dos placas"}. Coloca la placa dorada para que la red se doble en un cubo cerrado.`,
          )
        : L(
            `Module ${dims.a} × ${dims.b} × ${dims.c}. The hull net is missing ${missing.length === 1 ? "one plate" : "two plates"}. Place the gold ${missing.length === 1 ? "plate" : "plates"} so every side is covered once.`,
            `Módulo ${dims.a} × ${dims.b} × ${dims.c}. A la red del casco le ${missing.length === 1 ? "falta una placa" : "faltan dos placas"}. Coloca ${missing.length === 1 ? "la placa dorada" : "las placas doradas"} para cubrir cada lado una vez.`,
          ),
    );
    const cs = Math.floor(Math.min(440 / cols, 272 / rows, 58));
    const gx = 26 + Math.floor((448 - cs * cols) / 2);
    const gy = 150 + Math.floor((272 - cs * rows) / 2);
    const sheet = scene.add.graphics().setDepth(20);
    const plates = scene.add.graphics().setDepth(21);
    const plateText = [];
    // Student plates: start somewhere free on the sheet, possibly turned.
    const placed = missing.map((m) => {
      const turn = !isCube && m.w !== m.h && rng.int(0, 1) === 1;
      return { w: turn ? m.h : m.w, h: turn ? m.w : m.h, x: 0, y: 0, moved: false };
    });
    const clear = (q, others) =>
      q.x >= 0 &&
      q.y >= 0 &&
      q.x + q.w <= cols &&
      q.y + q.h <= rows &&
      others.every((f) => q.x + q.w < f.x || f.x + f.w < q.x || q.y + q.h < f.y || f.y + f.h < q.y);
    placed.forEach((q, i) => {
      const others = [...given, ...placed.slice(0, i)];
      outer: for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          if (clear({ ...q, x, y }, others)) {
            q.x = x;
            q.y = y;
            break outer;
          }
        }
    });
    let sel = 0;
    let folded = null;
    // Right: the module and a side checklist.
    kit.panel(486, 146, 304, 326, { fill: PANEL, alpha: 0.9 });
    const prev = scene.add.graphics().setDepth(22);
    const { P } = K.isoFit({ x: 520, y: 156, w: 236, h: 150 }, dims.a, dims.b, dims.c);
    K.edgeLabels(kit, P, dims.a, dims.b, dims.c, [dims.a, dims.b, dims.c].map(String));
    const sideKeys = Object.keys(M.SIDES);
    const tileText = sideKeys.map((key, i) =>
      kit.text(560 + (i % 2) * 150, 352 + Math.floor(i / 2) * 38, "", 14, "#cfe3ee", {
        depth: 23,
        weight: "800",
      }),
    );
    const tiles = scene.add.graphics().setDepth(22);
    function drawPreview() {
      prev.clear();
      const showSide = (key) =>
        folded && folded.side.some((s, j) => s === key && !folded.double.includes(j));
      const col = (key) => (showSide(key) ? M.SIDES[key].color : 0x2a3b4d);
      const dims3 = [dims.a, dims.b, dims.c];
      const [A, Bb, C] = dims3;
      prev
        .fillStyle(col("0,0,1"), 0.95)
        .fillPoints([P(0, 0, C), P(A, 0, C), P(A, Bb, C), P(0, Bb, C)], true);
      prev
        .fillStyle(col("1,0,0"), 0.8)
        .fillPoints([P(A, 0, 0), P(A, Bb, 0), P(A, Bb, C), P(A, 0, C)], true);
      prev
        .fillStyle(col("0,1,0"), 0.65)
        .fillPoints([P(0, Bb, 0), P(A, Bb, 0), P(A, Bb, C), P(0, Bb, C)], true);
      K.bayFront(prev, P, A, Bb, C, 0xeaf6ff, 0.8, 2);
      tiles.clear();
      sideKeys.forEach((key, i) => {
        const x = 560 + (i % 2) * 150;
        const y = 352 + Math.floor(i / 2) * 38;
        const s = M.SIDES[key];
        let mark = "?";
        let line = 0x5e92b3;
        if (folded) {
          const n = folded.side.filter((v) => v === key).length;
          mark = n === 1 ? "✓" : n === 0 ? "✗" : "×" + n;
          line = n === 1 ? s.color : 0xff7a5c;
        }
        tiles.fillStyle(0x10283a, 1).fillRoundedRect(x - 66, y - 16, 132, 32, 8);
        tiles.lineStyle(2, line, 1).strokeRoundedRect(x - 66, y - 16, 132, 32, 8);
        tileText[i].setText(`${api.t(s.name)}  ${mark}`);
      });
    }
    function rect(f) {
      return { x: gx + f.x * cs, y: gy + f.y * cs, w: f.w * cs, h: f.h * cs };
    }
    function draw() {
      sheet.clear();
      sheet
        .fillStyle(0x0c1d2c, 0.95)
        .fillRoundedRect(gx - 8, gy - 8, cols * cs + 16, rows * cs + 16, 10);
      sheet.lineStyle(1, 0x9fc6ff, 0.16);
      for (let x = 0; x <= cols; x++)
        sheet.lineBetween(gx + x * cs, gy, gx + x * cs, gy + rows * cs);
      for (let y = 0; y <= rows; y++)
        sheet.lineBetween(gx, gy + y * cs, gx + cols * cs, gy + y * cs);
      plates.clear();
      plateText.forEach((t) => t.destroy());
      plateText.length = 0;
      const all = [...given, ...placed];
      all.forEach((f, j) => {
        const r = rect(f);
        const mine = j >= given.length;
        const key = folded?.side[j];
        const bad =
          folded &&
          (folded.double.includes(j) ||
            folded.overlap.includes(j) ||
            folded.size.includes(j) ||
            folded.detached.includes(j));
        let fill = mine ? 0xffc94d : 0x5f7f9c;
        if (key) fill = M.SIDES[key].color;
        plates
          .fillStyle(fill, mine && !key ? 0.92 : 0.88)
          .fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        plates
          .fillStyle(0xffffff, 0.12)
          .fillRect(r.x + 3, r.y + 3, r.w - 6, Math.max(3, r.h * 0.18));
        const active = mine && j - given.length === sel && !folded;
        plates.lineStyle(
          active ? 4 : bad ? 4 : 2,
          active ? 0xffffff : bad ? 0xff5a3c : 0x0b1622,
          1,
        );
        plates.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        if (key || (mine && !folded)) {
          const label = key
            ? api.t(M.SIDES[key].name)
            : missing.length > 1
              ? String(j - given.length + 1)
              : "★";
          plateText.push(
            kit.text(
              r.x + r.w / 2,
              r.y + r.h / 2,
              label,
              Math.max(10, Math.min(15, cs * 0.3)),
              "#06121c",
              {
                weight: "900",
                depth: 23,
              },
            ),
          );
        }
      });
      drawPreview();
    }
    function move(dx, dy) {
      const q = placed[sel];
      q.x = Phaser.Math.Clamp(q.x + dx, 0, cols - q.w);
      q.y = Phaser.Math.Clamp(q.y + dy, 0, rows - q.h);
      q.moved = true;
      folded = null;
      api.sfx.tick(4);
      draw();
      api.refresh();
    }
    function rotate() {
      const q = placed[sel];
      [q.w, q.h] = [q.h, q.w];
      q.x = Phaser.Math.Clamp(q.x, 0, cols - q.w);
      q.y = Phaser.Math.Clamp(q.y, 0, rows - q.h);
      q.moved = true;
      folded = null;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    // Pointer: grab a gold plate and drag it, or tap a cell to send the selected plate there.
    let grab = null;
    const cellAt = (pt) => ({ cx: Math.floor((pt.x - gx) / cs), cy: Math.floor((pt.y - gy) / cs) });
    const zone = scene.add
      .zone(gx + (cols * cs) / 2, gy + (rows * cs) / 2, cols * cs, rows * cs)
      .setInteractive({ useHandCursor: true })
      .setDepth(25);
    zone.on("pointerdown", (pt) => {
      const { cx, cy } = cellAt(pt);
      const hit = placed.findIndex(
        (q) => cx >= q.x && cx < q.x + q.w && cy >= q.y && cy < q.y + q.h,
      );
      if (hit >= 0) {
        sel = hit;
        grab = { dx: cx - placed[hit].x, dy: cy - placed[hit].y };
        draw();
        api.refresh();
        return;
      }
      grab = { dx: 0, dy: 0 };
      move(cx - placed[sel].x, cy - placed[sel].y);
    });
    zone.on("pointermove", (pt) => {
      if (!pt.isDown || !grab) return;
      const { cx, cy } = cellAt(pt);
      const q = placed[sel];
      const nx = cx - grab.dx;
      const ny = cy - grab.dy;
      if (nx !== q.x || ny !== q.y) move(nx - q.x, ny - q.y);
    });
    zone.on("pointerup", () => {
      grab = null;
    });
    if (!isCube)
      kit.button(150, 452, 170, 42, "⟳ " + api.t(L("Turn (R)", "Girar (R)")), rotate, { size: 15 });
    if (missing.length > 1)
      kit.button(
        340,
        452,
        170,
        42,
        api.t(L("Next plate (N)", "Otra placa (N)")),
        () => {
          sel = (sel + 1) % placed.length;
          draw();
          api.refresh();
        },
        { size: 15, fill: 0x2f4b5c, color: "#eaf6ff" },
      );
    draw();
    async function fold() {
      folded = M.foldNet(dims, [...given, ...placed]);
      draw();
      api.sfx.flow?.();
      await kit.wait(350);
      return folded;
    }
    const sideName = (key) => api.t(M.SIDES[key].phrase);
    const plateIdx = placed.map((_, i) => given.length + i);
    const firstMissingKey = missing[0].key;
    return {
      checkLabel: L("Fold the hull", "Doblar el casco"),
      get actions() {
        const list = [
          {
            key: "ArrowLeft",
            label: L("Move left", "Mover a la izquierda"),
            run: () => move(-1, 0),
          },
          {
            key: "ArrowRight",
            label: L("Move right", "Mover a la derecha"),
            run: () => move(1, 0),
          },
          { key: "ArrowUp", label: L("Move up", "Mover arriba"), run: () => move(0, -1) },
          { key: "ArrowDown", label: L("Move down", "Mover abajo"), run: () => move(0, 1) },
        ];
        if (!isCube)
          list.push({ key: "r", label: L("Turn the plate", "Girar la placa"), run: rotate });
        if (placed.length > 1)
          list.push({
            key: "n",
            label: L("Next plate", "Otra placa"),
            run: () => {
              sel = (sel + 1) % placed.length;
              draw();
              api.refresh();
            },
          });
        return list;
      },
      status: () =>
        L(
          placed
            .map((q, i) => `Plate ${i + 1}: column ${q.x + 1}, row ${q.y + 1}, ${q.w} by ${q.h}`)
            .join("; "),
          placed
            .map((q, i) => `Placa ${i + 1}: columna ${q.x + 1}, fila ${q.y + 1}, ${q.w} por ${q.h}`)
            .join("; "),
        ),
      hints: [
        L(
          "A closed module needs each of its six sides exactly once. Picture folding the sheet up around the bottom plate: which side has no plate yet?",
          "Un módulo cerrado necesita cada uno de sus seis lados una sola vez. Imagina doblar la hoja alrededor de la placa de abajo: ¿qué lado no tiene placa?",
        ),
        L(
          `The ${sideName(firstMissingKey)} side has no plate yet. Join the gold plate along a full edge of the same length, where it will fold onto that side.`,
          `El lado ${sideName(firstMissingKey)} no tiene placa. Une la placa dorada por una arista completa del mismo largo, donde se doble hacia ese lado.`,
        ),
      ],
      async check() {
        if (placed.some((q) => !q.moved))
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Move the gold plate onto the net first (arrow keys or drag).",
              "Primero mueve la placa dorada a la red (flechas o arrastra).",
            ),
          };
        const res = await fold();
        const tag = M.classifyNet(res, plateIdx);
        if (!tag) {
          kit.burst(640, 230, 0xa1c3ff, 30);
          return { ok: true };
        }
        const dup = res.double.length ? res.side[res.double[res.double.length - 1]] : null;
        const FEEDBACK = {
          netOverlap: L(
            "Two plates overlap on the sheet. The same metal cannot be cut twice.",
            "Dos placas se enciman en la hoja. No se puede cortar el mismo metal dos veces.",
          ),
          netDetached: L(
            "That plate does not touch the net along a full edge, so it floats away when the sheet folds.",
            "Esa placa no toca la red por una arista completa, así que se suelta al doblar la hoja.",
          ),
          netSize: L(
            "The plate's edge does not match the edge it is joined to. Turn it or move it so the joined edges are the same length.",
            "La arista de la placa no coincide con la arista donde está unida. Gírala o muévela para que las aristas unidas midan lo mismo.",
          ),
          netDouble: L(
            `When it folds, two plates land on the ${dup ? sideName(dup) : ""} side, and another side stays open.`,
            `Al doblar, dos placas caen en el lado ${dup ? sideName(dup) : ""} y otro lado queda abierto.`,
          ),
        };
        return { ok: false, misconception: tag, feedback: FEEDBACK[tag] };
      },
      async demo() {
        folded = null;
        for (let i = 0; i < placed.length; i++) {
          sel = i;
          const q = placed[i];
          const m = missing[i];
          if (q.w !== m.w) {
            [q.w, q.h] = [q.h, q.w];
            draw();
            await kit.wait(300);
          }
          while (q.x !== m.x || q.y !== m.y) {
            q.x += Math.sign(m.x - q.x);
            q.y += Math.sign(m.y - q.y);
            q.moved = true;
            draw();
            api.sfx.tick(3);
            await kit.wait(160);
          }
          q.moved = true;
        }
        await fold();
        await kit.wait(600);
      },
      explain: () =>
        L(
          `Six plates, one on each side: the net folds into a closed ${dims.a} × ${dims.b} × ${dims.c} ${isCube ? "cube" : "module"}.`,
          `Seis placas, una en cada lado: la red se dobla en un ${isCube ? "cubo" : "módulo"} cerrado de ${dims.a} × ${dims.b} × ${dims.c}.`,
        ),
      _nt: nt,
      _placed: placed,
    };
  }

  Object.assign(window.VB_MISSIONS, { packer, net });
})();
