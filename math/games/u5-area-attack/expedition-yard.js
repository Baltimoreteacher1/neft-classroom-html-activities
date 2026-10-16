/* Terrace Architects — courtyard builder.
 *
 *   courtyard  a composite courtyard: choose the cut, find each piece's area, and
 *              (when a flower bed is cut out) subtract it. Pieces pave one by one;
 *              an overlap is paved twice, a paved-over flower bed shows.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.AA_MISSIONS;
  if (!X || !M || !M.ui) return;
  const { L, geom, fmt } = M;
  const { makeBoard, entryBox, cardPanel, centroid } = M.ui;
  const { STONE, LIME, SPILL, GAP, GOLD } = M.colors;
  const PIECE = [0x4fb3a0, 0x9d7be0];
  const FLOWER = 0xf28bb8;
  const NAMES = ["A", "B"];

  /* ── courtyard: composite figures (5-4) ───────────────────────────────── */
  const YARD_FB = {
    overlap: (k) =>
      L(
        `Piece ${k} overlaps the other piece, so that part gets paved twice. Use only the part left after the cut.`,
        `La pieza ${k} se encima con la otra y esa parte se pavimenta dos veces. Usa solo la parte que queda después del corte.`,
      ),
    wholeRect: (k) =>
      L(
        `Piece ${k} uses the whole outer rectangle. The missing corner is not part of the courtyard.`,
        `La pieza ${k} usa todo el rectángulo de afuera. La esquina que falta no es parte del patio.`,
      ),
    missingLength: (k) =>
      L(
        `Piece ${k} uses a side that does not belong to it. Find its missing side by subtracting.`,
        `La pieza ${k} usa un lado que no es suyo. Halla el lado que falta restando.`,
      ),
    noHalf: (k) =>
      L(
        `Piece ${k} is a triangle, but you found base × height: a whole rectangle. The triangle is half.`,
        `La pieza ${k} es un triángulo, pero calculaste base × altura: un rectángulo entero. El triángulo es la mitad.`,
      ),
    perimeter: () =>
      L(
        "That is the distance around the courtyard (perimeter). Area counts the square tiles inside.",
        "Eso es la distancia alrededor del patio (perímetro). El área cuenta las baldosas cuadradas de adentro.",
      ),
    addedHole: () =>
      L(
        "The flower bed got paved over! The bed is cut OUT of the lawn, so subtract its area.",
        "¡Se pavimentó encima del cantero de flores! El cantero se quita del césped, así que resta su área.",
      ),
    pieceOver: (k) =>
      L(
        `Piece ${k} has too many tiles: they spill out. Check its length and width.`,
        `A la pieza ${k} le sobran baldosas: se salen. Revisa su largo y su ancho.`,
      ),
    pieceUnder: (k) =>
      L(
        `Piece ${k} is short of tiles: a bare patch shows. Check its length and width.`,
        `A la pieza ${k} le faltan baldosas: queda tierra sin cubrir. Revisa su largo y su ancho.`,
      ),
  };

  function courtyard(scene, api) {
    const { kit, rng } = api;
    const p = M.gen.courtyard(rng, api.tier);
    const extra = p.dimLine ? 3 : 1;
    const cols = p.W + extra + 1;
    const rows = p.H + 1;
    const cell = Math.min(30, Math.floor(440 / cols), Math.floor(248 / rows));
    const B = makeBoard(scene, kit, { x0: 44, top: 152 + Math.floor((248 - rows * cell) / 2), cols, rows, cell });
    const sh = (q) => ({ x: q.x + 1, y: q.y });
    const shift = (pts) => pts.map(sh);
    const briefs = {
      ell: L(
        "Pave this L-shaped courtyard. Choose a cut (C) to split it into two rectangles, then type the tiles for each piece.",
        "Pavimenta este patio en forma de L. Elige un corte (C) para dividirlo en dos rectángulos y escribe las baldosas de cada pieza.",
      ),
      gable: L(
        "This courtyard is a rectangle with a triangle garden on top. Type the tiles for each piece.",
        "Este patio es un rectángulo con un jardín triangular arriba. Escribe las baldosas de cada pieza.",
      ),
      corner: L(
        "Pave the lawn, but NOT the triangle flower bed in the corner. Find both areas, then choose + or − (S).",
        "Pavimenta el césped, pero NO el cantero triangular de la esquina. Halla las dos áreas y elige + o − (S).",
      ),
    };
    api.setBrief(briefs[p.kind]);
    const ground = scene.add.graphics().setDepth(20.5);
    const pave = scene.add.graphics().setDepth(21);
    const pieceG = scene.add.graphics().setDepth(22);
    const marks = scene.add.graphics().setDepth(26);
    const outline = shift(p.outline);
    const inside = centroid(outline);
    B.fill(ground, outline, 0x6b4a2e, 1);
    if (p.hole) drawFlowers(ground, shift(p.hole));
    B.stroke(marks, outline, 3, LIME, 1);
    p.labels.forEach((lb) => B.edgeLabel(sh(lb.a), sh(lb.b), String(lb.v), "#ffffff", inside));
    if (p.dimLine) {
      const d = p.dimLine;
      const a = { x: d.x + 1, y: d.y0 };
      const b = { x: d.x + 1, y: d.y1 };
      B.dash(marks, a, b, 0xffd9a0, 2);
      [a, b].forEach((q) => {
        const Q = B.pt(q);
        marks.lineStyle(2, 0xffd9a0, 1).lineBetween(Q.x - 7, Q.y, Q.x + 7, Q.y);
      });
      kit.text(B.X(a.x) + 16, B.Y(d.y1 / 2), String(d.v), 16, "#ffd9a0", {
        weight: "900",
        depth: 27,
        stroke: "#06121c",
        strokeWidth: 4,
      });
    }
    if (p.apexDash) B.dash(marks, sh(p.apexDash[0]), sh(p.apexDash[1]), 0xffffff, 1.5, 0.5);
    function drawFlowers(g, tri) {
      B.fill(g, tri, 0x3c2a3a, 1);
      const c = centroid(tri);
      [
        [0, 0],
        [-0.5, 0.25],
        [0.45, -0.3],
        [0.2, 0.45],
      ].forEach(([dx, dy]) => {
        const P0 = B.pt({ x: c.x + dx, y: c.y + dy });
        g.fillStyle(FLOWER, 1).fillCircle(P0.x, P0.y, Math.max(3, cell * 0.16));
      });
    }

    // State.
    const cutKeys = p.needsCut ? ["across", "down"] : ["fixed"];
    let cut = p.needsCut ? null : "fixed";
    let sel = 0;
    let sign = null;
    const boxes = [];
    const cardX = 504;
    cardPanel(kit, cardX, 150, 292, 300, api.t(L("PAVING ORDER", "PEDIDO DE PAVIMENTO")));
    const pieceCaption = (i) => {
      if (p.kind === "corner")
        return i === 0
          ? api.t(L("A · whole rectangle", "A · rectángulo entero"))
          : api.t(L("B · flower bed", "B · cantero de flores"));
      return api.t(L(`Piece ${NAMES[i]}`, `Pieza ${NAMES[i]}`));
    };
    for (let i = 0; i < 2; i++) {
      const bx = cardX + 76 + i * 140;
      const b = entryBox(scene, kit, bx, 236, 112, pieceCaption(i), { size: 24 });
      b.zone.on("pointerdown", () => select(i));
      boxes.push(b);
    }
    const signBtn =
      p.kind === "corner"
        ? kit.button(cardX + 146, 236, 40, 40, "?", () => toggleSign(), { size: 20, depth: 27 })
        : null;
    const totalT = kit.text(cardX + 146, 300, "", 15, "#ffffff", { weight: "800", depth: 26, wrap: 270 });
    const cutT = kit.text(cardX + 146, 342, "", 13, "#ffe9a8", { weight: "800", depth: 26, wrap: 270 });
    if (p.needsCut)
      kit.button(cardX + 146, 386, 190, 40, api.t(L("✂ Change cut (C)", "✂ Cambiar corte (C)")), () => nextCut(), {
        size: 15,
        depth: 27,
        fill: 0x2f4b5c,
        color: "#eaf6ff",
      });
    if (p.needsSign)
      kit.text(cardX + 146, 386, api.t(L("S = switch + / −", "S = cambiar + / −")), 13, "#9fb7c4", { depth: 26 });
    // Pick a piece by tapping it on the board.
    const zone = scene.add
      .zone(B.x0 + (cols * cell) / 2, B.top + (rows * cell) / 2, cols * cell, rows * cell)
      .setInteractive({ useHandCursor: true })
      .setDepth(28);
    zone.on("pointerdown", (ptr) => {
      const gx = (ptr.x - B.x0) / cell - 1;
      const gy = (B.Y(0) - ptr.y) / cell;
      if (p.needsCut && !cut) {
        nextCut();
        return;
      }
      const pieces = p.cuts[cut].pieces;
      const hit = pieces.findIndex((pc) => inPoly({ x: gx, y: gy }, pc.pts));
      if (hit >= 0) select(p.kind === "corner" ? (inPoly({ x: gx, y: gy }, pieces[1].pts) ? 1 : 0) : hit);
    });
    function inPoly(q, pts) {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i];
        const b = pts[j];
        if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) c = !c;
      }
      return c;
    }
    const state = () => ({ cut, vals: boxes.map((b) => b.value()), ops: [null, sign] });
    function draw() {
      pieceG.clear();
      B.clearLabels();
      p.labels.forEach((lb) => B.edgeLabel(sh(lb.a), sh(lb.b), String(lb.v), "#ffffff", inside));
      if (p.needsCut)
        cutKeys.forEach((k) => {
          const ln = p.cuts[k].line;
          B.dash(pieceG, sh(ln[0]), sh(ln[1]), k === cut ? GOLD : 0xffffff, k === cut ? 4 : 2, k === cut ? 1 : 0.35);
        });
      if (cut) {
        p.cuts[cut].pieces.forEach((pc, i) => {
          const pts = shift(pc.pts);
          B.stroke(pieceG, pts, i === sel ? 4 : 2, PIECE[i], i === sel ? 1 : 0.7);
          B.fill(pieceG, pts, PIECE[i], i === sel ? 0.22 : 0.1);
          const c = B.pt(centroid(pts));
          pieceG.fillStyle(0x06121c, 0.75).fillCircle(c.x, c.y, 13);
          pieceG.lineStyle(2, PIECE[i], 1).strokeCircle(c.x, c.y, 13);
        });
      }
      pieceLetters();
      boxes.forEach((b, i) => b.draw(i === sel && !!cut, null));
      if (signBtn) signBtn.setLabel(sign || "?");
      const tot = M.courtyardTotal(p, state());
      const v = boxes.map((b) => (b.text === "" ? "?" : b.text));
      const op = p.needsSign ? sign || "?" : "+";
      totalT.setText(
        api.t(L("Total tiles: ", "Total de baldosas: ")) + `${v[0]} ${op} ${v[1]}` + (tot == null ? "" : ` = ${fmt(tot)}`),
      );
      cutT.setText(
        p.needsCut
          ? cut
            ? api.t(cut === "across" ? L("Cut: across", "Corte: horizontal") : L("Cut: down", "Corte: vertical"))
            : api.t(L("No cut yet: press C or tap the board.", "Sin corte: pulsa C o toca el tablero."))
          : "",
      );
    }
    const letters = [];
    function pieceLetters() {
      letters.splice(0).forEach((t) => t.destroy());
      if (!cut) return;
      p.cuts[cut].pieces.forEach((pc, i) => {
        const c = B.pt(centroid(shift(pc.pts)));
        letters.push(kit.text(c.x, c.y, NAMES[i], 14, "#ffffff", { weight: "900", depth: 27 }));
      });
    }
    function select(i) {
      sel = i;
      api.sfx.select();
      draw();
      api.refresh();
    }
    function nextCut() {
      if (!p.needsCut) return;
      cut = cut === "across" ? "down" : "across";
      boxes.forEach((b) => {
        b.text = "";
      });
      sel = 0;
      pave.clear();
      api.sfx.place();
      draw();
      api.refresh();
    }
    function toggleSign() {
      if (!p.needsSign) return;
      sign = sign === "−" ? "+" : "−";
      api.sfx.tap();
      pave.clear();
      draw();
      api.refresh();
    }
    function type(key) {
      if (!cut) return;
      const b = boxes[sel];
      const next = M.typeInto(b.text, key, 3, false);
      if (next === b.text) return;
      b.text = next;
      pave.clear();
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType(type);
    kit.keypad(44, 456, type, { size: 38 });
    draw();

    async function pavePiece(i, v) {
      const pc = p.cuts[cut].pieces[i];
      const pts = shift(pc.pts);
      const frac = Math.min(1, v / pc.area);
      const steps = kit.reduced() ? 1 : 8;
      for (let s = 1; s <= steps; s++) {
        const lvl = geom.fillLevel(pts, (frac * s) / steps);
        B.fill(pave, geom.clipBelow(pts, lvl), STONE, 0.95);
        await kit.wait(45);
      }
      api.sfx.place();
      if (v > pc.area) B.stroke(pave, pts, 5, SPILL, 1);
      if (v < pc.area) B.stroke(pave, pts, 4, GAP, 1);
    }
    return {
      checkLabel: L("Pave the courtyard", "Pavimentar el patio"),
      get actions() {
        const list = [
          { key: "ArrowRight", label: L("Next piece", "Pieza siguiente"), run: () => select((sel + 1) % 2) },
          { key: "ArrowLeft", label: L("Other piece", "Otra pieza"), run: () => select((sel + 1) % 2) },
          { key: "Delete", label: L("Erase digit", "Borrar dígito"), run: () => type("Backspace") },
        ];
        if (p.needsCut) list.push({ key: "c", label: L("Change the cut", "Cambiar el corte"), run: nextCut });
        if (p.needsSign) list.push({ key: "s", label: L("Switch + / −", "Cambiar + / −"), run: toggleSign });
        return list;
      },
      status: () => {
        const v = boxes.map((b) => (b.text === "" ? "?" : b.text));
        return L(`Piece A: ${v[0]} · Piece B: ${v[1]}`, `Pieza A: ${v[0]} · Pieza B: ${v[1]}`);
      },
      hints: {
        ell: [
          L(
            "Cut the courtyard into two rectangles. Find each rectangle's area (length × width), then add.",
            "Corta el patio en dos rectángulos. Halla el área de cada uno (largo × ancho) y súmalas.",
          ),
          L(
            `The notch sides are not labeled. Subtract: ${p.W} − ${p.W - (p.cw || 0)} across, and ${p.H} − ${p.H - (p.ch || 0)} up.`,
            `Los lados del hueco no tienen medida. Resta: ${p.W} − ${p.W - (p.cw || 0)} a lo ancho y ${p.H} − ${p.H - (p.ch || 0)} a lo alto.`,
          ),
        ],
        gable: [
          L(
            "Split it into the rectangle and the triangle. Rectangle = base × height. Triangle = ½ × base × height.",
            "Divídelo en el rectángulo y el triángulo. Rectángulo = base × altura. Triángulo = ½ × base × altura.",
          ),
          L(
            `The triangle's height is the total height minus the wall: ${p.H} − ${p.R}. Its base is ${p.W}.`,
            `La altura del triángulo es la altura total menos la pared: ${p.H} − ${p.R}. Su base es ${p.W}.`,
          ),
        ],
        corner: [
          L(
            "Find the whole rectangle, then SUBTRACT the triangle flower bed. The bed gets no paving.",
            "Halla el rectángulo entero y RESTA el cantero triangular. El cantero no se pavimenta.",
          ),
          L(
            `The bed's two short sides: ${p.W} − ${p.W - (p.a || 0)} and ${p.H} − ${p.H - (p.c || 0)}. Triangle = ½ × side × side.`,
            `Los dos lados cortos del cantero: ${p.W} − ${p.W - (p.a || 0)} y ${p.H} − ${p.H - (p.c || 0)}. Triángulo = ½ × lado × lado.`,
          ),
        ],
      }[p.kind],
      async check() {
        const inp = state();
        const res = M.judge.courtyard(p, inp);
        if (res.incomplete) {
          const msg = {
            cut: L("Choose a cut first: press C or tap the board.", "Primero elige un corte: pulsa C o toca el tablero."),
            vals: L("Type the tiles for both pieces first.", "Primero escribe las baldosas de las dos piezas."),
            sign: L("Choose + or − for the flower bed (S).", "Elige + o − para el cantero (S)."),
          }[res.need];
          return { ok: false, incomplete: true, feedback: msg };
        }
        pave.clear();
        const order = res.ok ? [0, 1] : [0, 1].slice(0, res.piece + 1);
        for (const i of order) {
          if (p.needsSign && i === 1) continue;
          await pavePiece(i, inp.vals[i]);
          await kit.wait(150);
        }
        const pieces = p.cuts[cut].pieces;
        if (p.hole) {
          const hole = shift(p.hole);
          if (sign === "−" && (res.ok || res.piece !== 1)) drawFlowers(pave, hole);
          else if (sign === "+") {
            B.fill(pave, hole, STONE, 1);
            B.stroke(pave, hole, 5, SPILL, 1);
          }
        }
        if (res.ok) {
          kit.burst(B.X(inside.x), B.Y(inside.y), LIME, 28);
          return { ok: true };
        }
        const k = NAMES[res.piece];
        if (p.hole && res.piece === 1) B.stroke(pave, shift(p.hole), 5, res.over ? SPILL : GAP, 1);
        if (res.tag === "overlap") {
          const other = shift(pieces[1 - res.piece].pts);
          B.fill(pave, other, SPILL, 0.55);
          kit.floatText(B.X(centroid(other).x), B.Y(centroid(other).y), api.t(L("paved twice!", "¡dos veces!")), "#ffb35c", 18);
        }
        boxes[res.piece].draw(true, "bad");
        const fb = (YARD_FB[res.tag] || YARD_FB.pieceUnder)(k);
        return { ok: false, misconception: res.tag, feedback: fb };
      },
      async demo() {
        const ans = M.answer.courtyard(p);
        if (p.needsCut && cut !== ans.cut) {
          cut = ans.cut;
          draw();
        }
        const pieces = p.cuts[cut].pieces;
        for (let i = 0; i < pieces.length; i++) {
          sel = i;
          boxes[i].text = String(pieces[i].area);
          draw();
          const c = B.pt(centroid(shift(pieces[i].pts)));
          kit.floatText(c.x, c.y - 18, `${NAMES[i]} = ${pieces[i].area}`, "#ffd76a", 20);
          api.sfx.tick(i * 4);
          await kit.wait(1000);
        }
        if (p.needsSign) {
          sign = "−";
          draw();
          await kit.wait(500);
        }
        pave.clear();
        for (let i = 0; i < pieces.length; i++) if (!(p.needsSign && i === 1)) await pavePiece(i, pieces[i].area);
        if (p.hole) drawFlowers(pave, shift(p.hole));
        kit.floatText(B.X(inside.x), B.Y(inside.y), `= ${p.area}`, "#ffffff", 26);
        await kit.wait(800);
      },
      explain: () => {
        const pcs = p.cuts[cut || "across"].pieces;
        const op = p.needsSign ? "−" : "+";
        return L(
          `Decompose, then combine: ${pcs[0].area} ${op} ${pcs[1].area} = ${p.area} square tiles. Each piece counted once.`,
          `Descompón y combina: ${pcs[0].area} ${op} ${pcs[1].area} = ${p.area} baldosas cuadradas. Cada pieza se cuenta una vez.`,
        );
      },
    };
  }

  M.builders = Object.assign(M.builders || {}, { courtyard });
})();
