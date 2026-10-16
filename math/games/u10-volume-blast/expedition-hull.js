/* Orbital Builders — hull plating (surface area of prisms and square pyramids).
 *
 *   hull   the student orders hull plating in square units. The order is laid onto the
 *          module's net face by face: too little leaves faces bare (outlined red), too
 *          much leaves a pile of spare plates. The picture shows which faces the number
 *          covered, never the face areas, so a miss does not hand over the solution.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.VB_MATH;
  const K = window.VB_MISSIONS;
  if (!X || !M || !K) return;
  const { L } = M;
  const { PANEL } = K;
  const HULL = 0xa1c3ff;
  const BARE = 0x2a3b4d;

  /** Net faces in unit coordinates (x, y, w, h) or triangles (pts), in plating order. */
  function prismNet(p) {
    const { l, w, h } = p;
    // Cross layout: top above front; left, front, right, back in a row; bottom below front.
    return [
      { name: L("Front", "Frente"), r: { x: w, y: w, w: l, h } },
      { name: L("Back", "Atrás"), r: { x: 2 * w + l, y: w, w: l, h } },
      { name: L("Left", "Izq."), r: { x: 0, y: w, w, h } },
      { name: L("Right", "Der."), r: { x: w + l, y: w, w, h } },
      { name: L("Top", "Arriba"), r: { x: w, y: 0, w: l, h: w } },
      { name: L("Bottom", "Abajo"), r: { x: w, y: w + h, w: l, h: w } },
    ].map((f, i) => ({ ...f, area: [l * h, l * h, w * h, w * h, l * w, l * w][i] }));
  }
  function pyramidNet(p) {
    const { s, sl } = p;
    const o = sl; // the base square starts one slant height in from the corner
    const tri = (pts) => ({ name: L("Triangle", "Triángulo"), pts, area: (s * sl) / 2 });
    return [
      tri([
        [o, o],
        [o + s, o],
        [o + s / 2, 0],
      ]),
      tri([
        [o + s, o],
        [o + s, o + s],
        [o + s + sl, o + s / 2],
      ]),
      tri([
        [o, o + s],
        [o + s, o + s],
        [o + s / 2, o + s + sl],
      ]),
      tri([
        [o, o],
        [o, o + s],
        [0, o + s / 2],
      ]),
      { name: L("Base", "Base"), r: { x: o, y: o, w: s, h: s }, area: s * s },
    ];
  }

  function hull(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "prism";
    const p = M.genHull(rng, api.tier, variant);
    const pyr = variant === "pyramid";
    const showGrid = !pyr && api.tier === 1;
    api.setBrief(
      pyr
        ? L(
            `Square pyramid roof: base ${p.s} by ${p.s}, slant height ${p.sl}, height ${p.ht}. Order hull plating to cover every face, base included, with none left over.`,
            `Techo en forma de pirámide cuadrada: base de ${p.s} por ${p.s}, altura inclinada ${p.sl}, altura ${p.ht}. Pide placas para cubrir todas las caras, con la base, sin que sobre nada.`,
          )
        : L(
            `Module ${p.l} × ${p.w} × ${p.h}. Order hull plating (square units) to cover the whole outside, with none left over.`,
            `Módulo ${p.l} × ${p.w} × ${p.h}. Pide placas del casco (unidades cuadradas) para cubrir todo el exterior, sin que sobre nada.`,
          ),
    );
    // Left: the 3D figure.
    const fig = scene.add.graphics().setDepth(21);
    const figBox = { x: 34, y: 152, w: 230, h: 180 };
    if (pyr) {
      const { P } = K.isoFit(figBox, p.s, p.s, p.ht);
      const s = p.s;
      const A = P(s / 2, s / 2, p.ht);
      fig.lineStyle(1.5, 0xeaf6ff, 0.45);
      K.dashed(fig, P(0, 0, 0), P(s, 0, 0));
      K.dashed(fig, P(0, 0, 0), P(0, s, 0));
      K.dashed(fig, P(0, 0, 0), A);
      fig.lineStyle(1.5, 0xffd76a, 0.9);
      K.dashed(fig, P(s / 2, s / 2, 0), A, 5);
      fig.fillStyle(0x6f93dd, 0.9).fillPoints([P(s, 0, 0), P(s, s, 0), A], true);
      fig.fillStyle(0x4566b0, 0.9).fillPoints([P(0, s, 0), P(s, s, 0), A], true);
      fig.lineStyle(2.5, 0xeaf6ff, 0.95);
      [
        [P(s, 0, 0), P(s, s, 0)],
        [P(0, s, 0), P(s, s, 0)],
        [P(s, 0, 0), A],
        [P(s, s, 0), A],
        [P(0, s, 0), A],
      ].forEach(([a, b]) => fig.lineBetween(a.x, a.y, b.x, b.y));
      const m = P(s / 2, s, 0);
      fig.lineStyle(2.5, 0x9cf27f, 1).lineBetween(m.x, m.y, A.x, A.y);
      const mid = (a, b, t = 0.5) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      const ls = mid(m, A, 0.55);
      kit.text(ls.x - 12, ls.y, `ℓ = ${p.sl}`, 16, "#9cf27f", {
        weight: "900",
        depth: 24,
        ox: 1,
        stroke: "#06121c",
      });
      const hs = mid(P(s / 2, s / 2, 0), A, 0.45);
      kit.text(hs.x + 8, hs.y, `h = ${p.ht}`, 16, "#ffd76a", {
        weight: "900",
        depth: 24,
        ox: 0,
        stroke: "#06121c",
      });
      const bl = mid(P(0, s, 0), P(s, s, 0));
      kit.text(bl.x - 14, bl.y + 16, String(s), 16, "#eaf6ff", {
        weight: "900",
        depth: 24,
        stroke: "#06121c",
      });
      const br = mid(P(s, 0, 0), P(s, s, 0));
      kit.text(br.x + 14, br.y + 16, String(s), 16, "#eaf6ff", {
        weight: "900",
        depth: 24,
        stroke: "#06121c",
      });
    } else {
      const { P } = K.isoFit(figBox, p.l, p.w, p.h);
      fig
        .fillStyle(0xb9d4ff, 0.95)
        .fillPoints([P(0, 0, p.h), P(p.l, 0, p.h), P(p.l, p.w, p.h), P(0, p.w, p.h)], true);
      fig
        .fillStyle(0x6f93dd, 0.95)
        .fillPoints([P(p.l, 0, 0), P(p.l, p.w, 0), P(p.l, p.w, p.h), P(p.l, 0, p.h)], true);
      fig
        .fillStyle(0x4566b0, 0.95)
        .fillPoints([P(0, p.w, 0), P(p.l, p.w, 0), P(p.l, p.w, p.h), P(0, p.w, p.h)], true);
      fig.lineStyle(1.5, 0xeaf6ff, 0.35);
      K.dashed(fig, P(0, 0, 0), P(p.l, 0, 0));
      K.dashed(fig, P(0, 0, 0), P(0, p.w, 0));
      K.dashed(fig, P(0, 0, 0), P(0, 0, p.h));
      K.bayFront(fig, P, p.l, p.w, p.h, 0xeaf6ff, 0.95, 2);
      K.edgeLabels(kit, P, p.l, p.w, p.h, [p.l, p.w, p.h].map(String));
    }
    // Right: the net, drawn to scale.
    const faces = pyr ? pyramidNet(p) : prismNet(p);
    const netW = pyr ? p.s + 2 * p.sl : 2 * p.l + 2 * p.w;
    const netH = pyr ? p.s + 2 * p.sl : 2 * p.w + p.h;
    const area = { x: 300, y: 150, w: 486, h: 270 };
    const u = Math.min(area.w / netW, area.h / netH);
    const nx = area.x + (area.w - netW * u) / 2;
    const ny = area.y + (area.h - netH * u) / 2;
    const toPx = ([x, y]) => ({ x: nx + x * u, y: ny + y * u });
    kit.panel(290, 140, 504, 290, { fill: PANEL, alpha: 0.75, lineAlpha: 0.3 });
    const netG = scene.add.graphics().setDepth(21);
    const labels = faces.map((f) => {
      const c = f.r
        ? toPx([f.r.x + f.r.w / 2, f.r.y + f.r.h / 2])
        : toPx(f.pts.reduce((a, q) => [a[0] + q[0] / 3, a[1] + q[1] / 3], [0, 0]));
      const dimsTxt = f.r && !pyr ? `${f.r.w} × ${f.r.h}` : "";
      return kit.text(c.x, c.y, dimsTxt, Math.max(11, Math.min(16, u * 0.9)), "#eaf6ff", {
        weight: "800",
        depth: 23,
        stroke: "#06121c",
        strokeWidth: 3,
      });
    });
    if (pyr) {
      // Dimension marks on the net: one base edge and one slant height.
      const t = faces[2].pts;
      const a = toPx([t[0][0], t[0][1]]);
      const b = toPx([t[1][0], t[1][1]]);
      kit.text((a.x + b.x) / 2, a.y - 12, String(p.s), 14, "#eaf6ff", {
        weight: "900",
        depth: 23,
        stroke: "#06121c",
      });
      const mb = toPx([(t[0][0] + t[1][0]) / 2, t[0][1]]);
      const ap = toPx(t[2]);
      netG.lineStyle(2, 0x9cf27f, 1);
      K.dashed(netG, mb, ap, 5);
      kit.text(ap.x + 10, (mb.y + ap.y) / 2, `ℓ = ${p.sl}`, 14, "#9cf27f", {
        weight: "900",
        depth: 23,
        ox: 0,
        stroke: "#06121c",
      });
    }
    const spare = scene.add.graphics().setDepth(22);
    function drawNet(cover) {
      netG.clear();
      faces.forEach((f, i) => {
        const c = cover ? cover[i] : 0;
        const bare = cover && c < 1;
        const col = c > 0 ? HULL : BARE;
        const alpha = c >= 1 ? 0.95 : c > 0 ? 0.45 : 0.9;
        if (f.r) {
          const a = toPx([f.r.x, f.r.y]);
          netG.fillStyle(BARE, 0.9).fillRect(a.x, a.y, f.r.w * u, f.r.h * u);
          if (c > 0)
            netG.fillStyle(col, alpha).fillRect(a.x, a.y, f.r.w * u * Math.min(1, c), f.r.h * u);
          if (showGrid) {
            netG.lineStyle(1, 0xeaf6ff, 0.18);
            for (let x = 1; x < f.r.w; x++)
              netG.lineBetween(a.x + x * u, a.y, a.x + x * u, a.y + f.r.h * u);
            for (let y = 1; y < f.r.h; y++)
              netG.lineBetween(a.x, a.y + y * u, a.x + f.r.w * u, a.y + y * u);
          }
          netG.lineStyle(bare ? 3 : 2, bare ? 0xff7a5c : 0xeaf6ff, bare ? 1 : 0.7);
          netG.strokeRect(a.x, a.y, f.r.w * u, f.r.h * u);
        } else {
          const pts = f.pts.map(toPx);
          netG.fillStyle(c > 0 ? col : BARE, c > 0 ? alpha : 0.9).fillPoints(pts, true);
          netG
            .lineStyle(bare ? 3 : 2, bare ? 0xff7a5c : 0xeaf6ff, bare ? 1 : 0.7)
            .strokePoints(pts, true);
        }
      });
    }
    drawNet(null);
    // Order console.
    kit.panel(24, 344, 250, 128, { fill: PANEL, alpha: 0.9 });
    kit.text(149, 362, api.t(L("PLATING ORDER", "PEDIDO DE PLACAS")), 14, "#ffd76a", {
      weight: "800",
    });
    const field = K.numField(scene, kit, 149, 404, { digits: 4, w: 150 });
    kit.text(149, 451, api.t(L("square units", "unidades cuadradas")), 14, "#cfe3ee");
    kit.keypad(290, 452, (k) => type(k), { size: 40, gap: 6 });
    function type(k) {
      if (field.type(k)) {
        api.sfx.tap();
        api.refresh();
      }
    }
    kit.onType(type);
    async function plate(n) {
      let left = n;
      const cover = faces.map(() => 0);
      spare.clear();
      faces.forEach((f, i) => {
        cover[i] = left >= f.area ? 1 : Math.max(0, left / f.area);
        left = Math.max(0, left - f.area);
      });
      // Reveal the plating in three passes (a few frames, even on a slow Chromebook).
      for (const upto of K.stages(faces.length)) {
        drawNet(cover.map((c, i) => (i < upto ? c : 0)));
        api.sfx.tick(upto * 2);
        await kit.wait(220);
      }
      if (left > 0) {
        // Spare plates pile up beside the net (a picture, not a number).
        const rowsN = Math.min(6, Math.ceil(left / Math.max(1, p.SA / 6)));
        for (let r = 0; r < rowsN; r++) {
          spare.fillStyle(0xffb35c, 0.95).fillRect(746, 404 - r * 9, 38, 7);
          spare.lineStyle(1, 0x4a1d0c, 1).strokeRect(746, 404 - r * 9, 38, 7);
        }
      }
      return cover;
    }
    const FEEDBACK = {
      volumeNotArea: L(
        "That is the volume (the space inside). Plating covers the outside: add the areas of the faces.",
        "Eso es el volumen (el espacio de adentro). Las placas cubren el exterior: suma las áreas de las caras.",
      ),
      halfFaces: L(
        "Only half the hull got plates. A prism has 6 faces: every face has a matching face on the other side.",
        "Solo la mitad del casco tiene placas. Un prisma tiene 6 caras: cada cara tiene una cara igual del otro lado.",
      ),
      faceCount: pyr
        ? L(
            "Some faces are still bare. Count the faces again: 1 square base and 4 triangles.",
            "Algunas caras siguen sin placas. Cuenta las caras otra vez: 1 base cuadrada y 4 triángulos.",
          )
        : L(
            "Some faces are still bare. Count the faces of the prism again: it has 6.",
            "Algunas caras siguen sin placas. Cuenta otra vez las caras del prisma: tiene 6.",
          ),
      forgotBase: L(
        "The 4 triangles are covered, but the square base is bare. Surface area includes the base.",
        "Los 4 triángulos están cubiertos, pero la base cuadrada no. El área de superficie incluye la base.",
      ),
      noHalf: L(
        "Each triangle got twice the plating it needs. Triangle area is ½ × base × height.",
        "Cada triángulo recibió el doble de placas. El área del triángulo es ½ × base × altura.",
      ),
      usedHeight: L(
        "You used the pyramid's height h. The triangle faces use the slant height ℓ, measured along the face.",
        "Usaste la altura h de la pirámide. Las caras triangulares usan la altura inclinada ℓ, medida sobre la cara.",
      ),
      addDims: L(
        "You added edge lengths. Plating covers area: multiply to find the area of each face.",
        "Sumaste longitudes de aristas. Las placas cubren área: multiplica para hallar el área de cada cara.",
      ),
      plateShort: L(
        "Not enough: some faces stay bare (red). Find the area of every face and add them all.",
        "No alcanza: algunas caras quedan sin placas (rojo). Halla el área de cada cara y súmalas todas.",
      ),
      plateOver: L(
        "Too much: spare plates are left over (orange). Find the area of every face and add them all.",
        "Demasiado: sobran placas (naranja). Halla el área de cada cara y súmalas todas.",
      ),
    };
    const tri = (p.s * p.sl) / 2;
    return {
      checkLabel: L("Plate the hull", "Cubrir el casco"),
      actions: [
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => type("Backspace"),
        },
      ],
      status: () =>
        L(
          `Order: ${field.value || "empty"} square units`,
          `Pedido: ${field.value || "vacío"} unidades cuadradas`,
        ),
      hints: pyr
        ? [
            L(
              "Surface area = the square base + 4 triangles. Use the slant height ℓ for the triangles, not the height h.",
              "Área de superficie = la base cuadrada + 4 triángulos. Usa la altura inclinada ℓ para los triángulos, no la altura h.",
            ),
            L(
              `Base: ${p.s} × ${p.s}. Each triangle: ½ × ${p.s} × ${p.sl}. Add the base and all 4 triangles.`,
              `Base: ${p.s} × ${p.s}. Cada triángulo: ½ × ${p.s} × ${p.sl}. Suma la base y los 4 triángulos.`,
            ),
          ]
        : [
            L(
              "Surface area = the areas of all 6 faces. A prism has 3 pairs of matching faces.",
              "Área de superficie = las áreas de las 6 caras. Un prisma tiene 3 pares de caras iguales.",
            ),
            L(
              `The faces are ${p.l} × ${p.w}, ${p.l} × ${p.h} and ${p.w} × ${p.h}. Find each area, then count each one twice.`,
              `Las caras son ${p.l} × ${p.w}, ${p.l} × ${p.h} y ${p.w} × ${p.h}. Halla cada área y cuenta cada una dos veces.`,
            ),
          ],
      async check() {
        const n = field.num();
        if (n == null || n === 0)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Type how many square units of plating to order.",
              "Escribe cuántas unidades cuadradas de placas vas a pedir.",
            ),
          };
        await plate(n);
        const tag = M.classifyHull(p, n);
        if (!tag) {
          kit.burst(540, 285, HULL, 32);
          return { ok: true };
        }
        return { ok: false, misconception: tag, feedback: FEEDBACK[tag] };
      },
      async demo() {
        let total = 0;
        const cover = faces.map(() => 0);
        for (let i = 0; i < faces.length; i++) {
          cover[i] = 1;
          total += faces[i].area;
          drawNet(cover);
          labels[i].setText(String(faces[i].area));
          api.sfx.tick(i * 2);
          await kit.wait(520);
        }
        field.set(total);
        await kit.wait(500);
      },
      explain: () =>
        pyr
          ? L(
              `Base ${p.s} × ${p.s} = ${p.s * p.s}, plus 4 triangles of ½ × ${p.s} × ${p.sl} = ${tri}. Total: ${p.SA} square units.`,
              `Base ${p.s} × ${p.s} = ${p.s * p.s}, más 4 triángulos de ½ × ${p.s} × ${p.sl} = ${tri}. Total: ${p.SA} unidades cuadradas.`,
            )
          : L(
              `2 × (${p.l * p.w} + ${p.l * p.h} + ${p.w * p.h}) = ${p.SA} square units: 3 pairs of matching faces.`,
              `2 × (${p.l * p.w} + ${p.l * p.h} + ${p.w * p.h}) = ${p.SA} unidades cuadradas: 3 pares de caras iguales.`,
            ),
      _p: p,
    };
  }

  Object.assign(window.VB_MISSIONS, { hull });
})();
