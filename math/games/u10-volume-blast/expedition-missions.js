/* Orbital Builders — shared drawing kit + the volume missions (loader, module).
 *
 *   loader   a cargo bay with its floor layer and a corner stack drawn; the student
 *            orders crates and the loader fills the bay with exactly that many —
 *            a gap at the top or crates floating loose shows what the number did
 *   module   the student sets a module's length, width and height (or just its number
 *            of layers on a fixed floor); the manifest's crates are loaded into it, so
 *            a wrong product leaves empty slots or spills crates
 * Mathematics (generators, judges, misconception tags) lives in expedition-math.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.VB_MATH;
  if (!X || !M) return;
  const { L } = M;
  const PANEL = 0x0a1626;
  const CRATE = { top: 0xb9d4ff, right: 0x6f93dd, front: 0x4566b0, edge: 0x15244a };
  const SPILL = { top: 0xffc2a0, right: 0xe9845a, front: 0xb95a35, edge: 0x4a1d0c };
  const GUIDE = { top: 0xffe39a, right: 0xe0b14f, front: 0xb3862e, edge: 0x4a3510 };
  const BAY = 0x9fc6ff;

  /* ── Isometric kit ────────────────────────────────────────────────────── */
  /** Projection that fits an l × w × h box (plus `extraH` headroom) in rect r. */
  function isoFit(r, l, w, h, extraH = 0) {
    const c = 0.866;
    const s = 0.5;
    const hh = h + extraH;
    const u = Math.min(r.w / ((l + w) * c), r.h / ((l + w) * s + hh));
    const ox = r.x + r.w / 2 - ((l - w) / 2) * c * u;
    const oy = r.y + (r.h - ((l + w) * s + hh) * u) / 2 + hh * u;
    const P = (x, y, z) => ({ x: ox + (x - y) * c * u, y: oy + (x + y) * s * u - z * u });
    return { P, u };
  }
  function cube(g, P, x, y, z, d, col, alpha = 1) {
    const t = [P(x, y, z + d), P(x + d, y, z + d), P(x + d, y + d, z + d), P(x, y + d, z + d)];
    const rt = [P(x + d, y, z), P(x + d, y + d, z), P(x + d, y + d, z + d), P(x + d, y, z + d)];
    const f = [P(x, y + d, z), P(x + d, y + d, z), P(x + d, y + d, z + d), P(x, y + d, z + d)];
    [
      [t, col.top],
      [rt, col.right],
      [f, col.front],
    ].forEach(([pts, c]) => {
      g.fillStyle(c, alpha).fillPoints(pts, true);
      g.lineStyle(1, col.edge, 0.9 * alpha).strokePoints(pts, true);
    });
  }
  function dashed(g, a, b, dash = 6) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.floor(len / dash));
    for (let i = 0; i < n; i += 2) {
      const t0 = i / n;
      const t1 = Math.min(1, (i + 1) / n);
      g.lineBetween(
        a.x + (b.x - a.x) * t0,
        a.y + (b.y - a.y) * t0,
        a.x + (b.x - a.x) * t1,
        a.y + (b.y - a.y) * t1,
      );
    }
  }
  /** Bay interior: floor and the two far walls, with a grid every `step` units. */
  function bayBack(g, P, l, w, h, opts = {}) {
    const step = opts.step || 1;
    const col = opts.color ?? BAY;
    const quad = (pts, a) => g.fillStyle(col, a).fillPoints(pts, true);
    quad([P(0, 0, 0), P(l, 0, 0), P(l, w, 0), P(0, w, 0)], 0.16);
    quad([P(0, 0, 0), P(0, w, 0), P(0, w, h), P(0, 0, h)], 0.08);
    quad([P(0, 0, 0), P(l, 0, 0), P(l, 0, h), P(0, 0, h)], 0.08);
    const line = (a, b, major) => g.lineStyle(major ? 1.5 : 1, col, major ? 0.5 : 0.22).lineBetween(a.x, a.y, b.x, b.y);
    const isMajor = (v) => Math.abs(v - Math.round(v)) < 1e-6;
    for (let x = step; x < l - 1e-6; x += step) {
      line(P(x, 0, 0), P(x, w, 0), isMajor(x));
      line(P(x, 0, 0), P(x, 0, h), isMajor(x));
    }
    for (let y = step; y < w - 1e-6; y += step) {
      line(P(0, y, 0), P(l, y, 0), isMajor(y));
      line(P(0, y, 0), P(0, y, h), isMajor(y));
    }
    for (let z = step; z < h - 1e-6; z += step) {
      line(P(0, 0, z), P(l, 0, z), isMajor(z));
      line(P(0, 0, z), P(0, w, z), isMajor(z));
    }
    g.lineStyle(1.5, col, 0.45);
    dashed(g, P(0, 0, 0), P(l, 0, 0));
    dashed(g, P(0, 0, 0), P(0, w, 0));
    dashed(g, P(0, 0, 0), P(0, 0, h));
  }
  /** The nine visible edges of the bay, drawn over the crates. */
  function bayFront(g, P, l, w, h, color = BAY, alpha = 0.95, width = 2.5) {
    g.lineStyle(width, color, alpha);
    const e = (a, b) => g.lineBetween(a.x, a.y, b.x, b.y);
    e(P(0, 0, h), P(l, 0, h));
    e(P(l, 0, h), P(l, w, h));
    e(P(l, w, h), P(0, w, h));
    e(P(0, w, h), P(0, 0, h));
    e(P(l, 0, 0), P(l, 0, h));
    e(P(l, w, 0), P(l, w, h));
    e(P(0, w, 0), P(0, w, h));
    e(P(0, w, 0), P(l, w, 0));
    e(P(l, 0, 0), P(l, w, 0));
  }
  /** Edge labels: length (front-left bottom), width (front-right bottom), height (right). */
  function edgeLabels(kit, P, l, w, h, texts, depth = 24) {
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const a = mid(P(0, w, 0), P(l, w, 0));
    const b = mid(P(l, 0, 0), P(l, w, 0));
    const c = mid(P(l, 0, 0), P(l, 0, h));
    const style = ["#ffe39a", 17, { weight: "900", depth, stroke: "#06121c", strokeWidth: 4 }];
    return [
      kit.text(a.x - 16, a.y + 16, texts[0], style[1], style[0], style[2]),
      kit.text(b.x + 16, b.y + 16, texts[1], style[1], style[0], style[2]),
      kit.text(c.x + 14, c.y, texts[2], style[1], style[0], { ...style[2], ox: 0 }),
    ];
  }
  /**
   * Draw `count` cubes of edge d (units) filling an L × W × H grid of cells (cell counts)
   * layer by layer from the floor. Cubes past the grid stack above it as spilled cargo.
   */
  function fillCells(g, P, Lc, Wc, Hc, d, count, opts = {}) {
    const cells = [];
    const per = Lc * Wc;
    const cap = per * Hc;
    const maxShow = per * (Hc + (opts.extraLayers ?? 2));
    for (let n = 0; n < Math.min(count, maxShow); n++) {
      const k = Math.floor(n / per);
      const r = n % per;
      cells.push({ i: r % Lc, j: Math.floor(r / Lc), k, spill: n >= cap });
    }
    cells.sort((a, b) => a.i + a.j + a.k - (b.i + b.j + b.k) || a.k - b.k);
    cells.forEach((c) =>
      cube(g, P, c.i * d, c.j * d, c.k * d, d, c.spill ? SPILL : opts.col || CRATE, c.spill ? 0.9 : 1),
    );
    return { shown: cells.length, hidden: Math.max(0, count - maxShow) };
  }
  /** Outline the empty part of the bay after a short load. */
  function markGap(g, P, l, w, h, filledH) {
    if (filledH >= h) return;
    g.lineStyle(3, 0xff7a5c, 0.95);
    const z = filledH;
    const pts = [P(0, 0, z), P(l, 0, z), P(l, w, z), P(0, w, z)];
    g.strokePoints(pts, true);
    g.fillStyle(0xff7a5c, 0.16).fillPoints(
      [P(0, w, z), P(l, w, z), P(l, w, h), P(0, w, h)],
      true,
    );
    g.fillStyle(0xff7a5c, 0.16).fillPoints(
      [P(l, 0, z), P(l, w, z), P(l, w, h), P(l, 0, h)],
      true,
    );
  }

  /** At most `parts` increasing steps up to n: check animations stay a few frames long. */
  function stages(n, parts = 3) {
    const out = [];
    for (let s = 1; s <= parts; s++) {
      const v = Math.ceil((n * s) / parts);
      if (v > 0 && !out.includes(v)) out.push(v);
    }
    return out.length ? out : [n];
  }

  /* ── Number entry widgets ─────────────────────────────────────────────── */
  /** A single whole-number field. */
  function numField(scene, kit, x, y, opts = {}) {
    const w = opts.w || 150;
    const g = scene.add.graphics().setDepth(22);
    const txt = kit.text(x, y, "", 30, "#ffffff", { weight: "900", depth: 23 });
    const f = {
      value: "",
      max: opts.digits || 3,
      draw() {
        g.clear();
        g.fillStyle(0x10283a, 1).fillRoundedRect(x - w / 2, y - 28, w, 56, 12);
        g.lineStyle(3, 0xffd76a, 1).strokeRoundedRect(x - w / 2, y - 28, w, 56, 12);
        txt.setText(f.value === "" ? "▮" : f.value);
        txt.setColor(f.value === "" ? "#6f8a9c" : "#ffffff");
      },
      type(key) {
        if (key === "Backspace") f.value = f.value.slice(0, -1);
        else if (/^[0-9]$/.test(key) && f.value.length < f.max)
          f.value = (f.value + key).replace(/^0+(?=\d)/, "");
        else return false;
        f.draw();
        return true;
      },
      num: () => (f.value === "" ? null : Number(f.value)),
      set(v) {
        f.value = String(v);
        f.draw();
      },
    };
    f.draw();
    return f;
  }
  /** Mixed-number entry: whole, numerator over denominator. */
  function fracField(scene, kit, x, y) {
    const g = scene.add.graphics().setDepth(22);
    const boxes = [
      { x: x - 52, y, w: 78, h: 64, size: 34 },
      { x: x + 34, y: y - 22, w: 56, h: 40, size: 24 },
      { x: x + 34, y: y + 24, w: 56, h: 40, size: 24 },
    ];
    const txt = boxes.map((b) => kit.text(b.x, b.y, "", b.size, "#ffffff", { weight: "900", depth: 23 }));
    const f = {
      e: { w: "", n: "", d: "" },
      sel: 0,
      keys: ["w", "n", "d"],
      draw() {
        g.clear();
        boxes.forEach((b, i) => {
          const on = i === f.sel;
          g.fillStyle(0x10283a, 1).fillRoundedRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 10);
          g.lineStyle(on ? 4 : 2, on ? 0xffd76a : 0x5e92b3, 1).strokeRoundedRect(
            b.x - b.w / 2,
            b.y - b.h / 2,
            b.w,
            b.h,
            10,
          );
          const v = f.e[f.keys[i]];
          txt[i].setText(v === "" ? (on ? "▮" : "") : v);
        });
        g.lineStyle(3, 0xeaf6ff, 0.9).lineBetween(x + 6, y + 2, x + 62, y + 2);
      },
      type(key) {
        const k = f.keys[f.sel];
        if (key === "Backspace") f.e[k] = f.e[k].slice(0, -1);
        else if (/^[0-9]$/.test(key) && f.e[k].length < (k === "w" ? 3 : 2))
          f.e[k] = (f.e[k] + key).replace(/^0+(?=\d)/, "");
        else return false;
        f.draw();
        return true;
      },
      move(d) {
        f.sel = (f.sel + d + 3) % 3;
        f.draw();
      },
      value: () => M.parseEntry(f.e),
      empty: () => !f.e.w && !f.e.n && !f.e.d,
      set(v) {
        f.e = M.toEntry(v);
        f.draw();
      },
      zones(onPick) {
        boxes.forEach((b, i) => {
          scene.add
            .zone(b.x, b.y, b.w, b.h)
            .setInteractive({ useHandCursor: true })
            .setDepth(24)
            .on("pointerdown", () => {
              f.sel = i;
              f.draw();
              onPick?.();
            });
        });
      },
    };
    f.draw();
    return f;
  }

  /* ── loader: count the crates that fill a bay ─────────────────────────── */
  function loader(scene, api) {
    const { kit, rng } = api;
    const p = M.genLoader(rng, api.tier);
    const { l, w, h, V } = p;
    // Guide crates: the full floor layer (tier 1) or one floor row (tier 2), plus a corner stack.
    const guide = [];
    for (let j = 0; j < (api.tier >= 2 ? 1 : w); j++)
      for (let i = 0; i < l; i++) guide.push({ i, j: w - 1 - j, k: 0 });
    for (let k = 1; k < h; k++) guide.push({ i: l - 1, j: w - 1, k });
    api.setBrief(
      L(
        `Cargo bay ${l} × ${w} × ${h}. The yellow crates show the floor and one stack. Order exactly enough crates to fill the whole bay.`,
        `Bodega de carga ${l} × ${w} × ${h}. Las cajas amarillas muestran el piso y una pila. Pide exactamente las cajas que llenan toda la bodega.`,
      ),
    );
    const box = { x: 40, y: 150, w: 400, h: 274 };
    const { P } = isoFit(box, l, w, h, 2);
    const back = scene.add.graphics().setDepth(20);
    const crates = scene.add.graphics().setDepth(21);
    const front = scene.add.graphics().setDepth(22);
    bayBack(back, P, l, w, h);
    edgeLabels(kit, P, l, w, h, [String(l), String(w), String(h)]);
    function drawGuides() {
      crates.clear();
      guide
        .slice()
        .sort((a, b) => a.i + a.j + a.k - (b.i + b.j + b.k))
        .forEach((c) => cube(crates, P, c.i, c.j, c.k, 1, GUIDE));
      front.clear();
      bayFront(front, P, l, w, h);
    }
    drawGuides();
    // Order console.
    kit.panel(470, 150, 320, 270, { fill: PANEL, alpha: 0.9 });
    kit.text(630, 176, api.t(L("CRATE ORDER", "PEDIDO DE CAJAS")), 15, "#ffd76a", { weight: "800" });
    const field = numField(scene, kit, 630, 236, { digits: 3 });
    kit.text(630, 286, api.t(L("crates", "cajas")), 16, "#cfe3ee");
    const loadedTxt = kit.text(630, 340, "", 15, "#9fc6ff", { weight: "800", wrap: 290 });
    kit.keypad(290, 452, (k) => type(k), { size: 40, gap: 6 });
    function type(k) {
      if (field.type(k)) {
        api.sfx.tap();
        api.refresh();
      }
    }
    kit.onType(type);

    async function load(n) {
      crates.clear();
      front.clear();
      const per = l * w;
      const layers = Math.ceil(Math.min(n, per * (h + 2)) / per);
      for (const k of stages(layers)) {
        crates.clear();
        front.clear();
        fillCells(crates, P, l, w, h, 1, Math.min(n, per * k));
        bayFront(front, P, l, w, h);
        api.sfx.tick(Math.min(12, k * 2));
        await kit.wait(220);
      }
      loadedTxt.setText(api.t(L(`Loaded: ${n} crates`, `Cargadas: ${n} cajas`)));
    }
    const fb = (en, es) => L(en, es);
    const FEEDBACK = {
      addDims: fb(
        "You added the three edges. Volume counts every crate: multiply length × width × height.",
        "Sumaste las tres aristas. El volumen cuenta todas las cajas: multiplica largo × ancho × alto.",
      ),
      oneLayer: fb(
        "That fills only the floor layer. The bay has more layers stacked on top.",
        "Eso llena solo la capa del piso. La bodega tiene más capas encima.",
      ),
      visibleOnly: fb(
        "You counted only the yellow crates in the picture. The empty spaces need crates too.",
        "Contaste solo las cajas amarillas del dibujo. Los espacios vacíos también necesitan cajas.",
      ),
      areaNotVolume: fb(
        "That number covers the outside faces (surface area). Volume fills the inside with crates.",
        "Ese número cubre las caras de afuera (área de superficie). El volumen llena el interior con cajas.",
      ),
    };
    return {
      checkLabel: L("Load the bay", "Cargar la bodega"),
      actions: [
        { key: "Backspace", label: L("Erase digit", "Borrar dígito"), run: () => type("Backspace") },
      ],
      status: () =>
        L(
          `Order: ${field.value || "empty"} crates`,
          `Pedido: ${field.value || "vacío"} cajas`,
        ),
      hints: [
        L(
          "Count the crates in one floor layer (length × width). Then count how many layers stack up.",
          "Cuenta las cajas de una capa del piso (largo × ancho). Luego cuenta cuántas capas hay.",
        ),
        L(
          `One layer is ${l} × ${w} = ${l * w} crates. The bay is ${h} layers tall: multiply.`,
          `Una capa es ${l} × ${w} = ${l * w} cajas. La bodega tiene ${h} capas: multiplica.`,
        ),
      ],
      async check() {
        const n = field.num();
        if (n == null || n === 0)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Type how many crates to order.", "Escribe cuántas cajas vas a pedir."),
          };
        await load(n);
        const tag = M.classifyLoader(p, n);
        if (!tag) {
          kit.burst(240, 300, 0xb9d4ff, 30);
          return { ok: true };
        }
        if (n < V) markGap(front, P, l, w, h, Math.floor(n / (l * w)));
        return {
          ok: false,
          misconception: tag,
          feedback:
            FEEDBACK[tag] ||
            (n < V
              ? fb(
                  "Too few: the top of the bay is still empty (red). Count again, layer by layer.",
                  "Muy pocas: la parte de arriba sigue vacía (rojo). Cuenta otra vez, capa por capa.",
                )
              : fb(
                  "Too many: extra crates float out of the bay (orange). Count again, layer by layer.",
                  "Demasiadas: sobran cajas que flotan fuera de la bodega (naranja). Cuenta otra vez, capa por capa.",
                )),
        };
      },
      async demo() {
        field.set("");
        crates.clear();
        for (let k = 1; k <= h; k++) {
          crates.clear();
          fillCells(crates, P, l, w, h, 1, l * w * k);
          front.clear();
          bayFront(front, P, l, w, h);
          const top = P(l / 2, w / 2, k);
          kit.floatText(top.x, top.y - 10, `+${l * w}`, "#ffd76a", 20);
          api.sfx.tick(k * 2);
          await kit.wait(520);
        }
        field.set(V);
        await kit.wait(500);
      },
      explain: () =>
        L(
          `${l} × ${w} × ${h} = ${V} crates: ${h} layers of ${l * w}.`,
          `${l} × ${w} × ${h} = ${V} cajas: ${h} capas de ${l * w}.`,
        ),
      _p: p,
    };
  }

  /* ── module: set the dimensions (dims) or the number of layers (base) ─── */
  function module(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "dims";
    const p = M.genModule(rng, api.tier, variant);
    const b = variant === "base" ? { l: p.l, w: p.w, h: 1 } : { l: 1, w: 1, h: 1 };
    const editable = variant === "base" ? ["h"] : ["l", "w", "h"];
    let sel = 0;
    let loaded = 0;
    const lim =
      variant === "base"
        ? { l: p.l, w: p.w, h: 9 }
        : { l: p.maxL + 2, w: p.maxW + 2, h: p.maxH + 2 };
    if (variant === "base")
      api.setBrief(
        L(
          `The dock floor is fixed: ${p.l} × ${p.w}. The manifest has ${p.V} crates. Stack the right number of layers so every crate fits with no empty space.`,
          `El piso del muelle es fijo: ${p.l} × ${p.w}. El manifiesto tiene ${p.V} cajas. Apila el número correcto de capas para que todas las cajas quepan sin espacio vacío.`,
        ),
      );
    else
      api.setBrief(
        L(
          `Build a module that holds exactly ${p.V} crates and fits the docking bay (up to ${p.maxL} long, ${p.maxW} wide, ${p.maxH} tall).`,
          `Construye un módulo que guarde exactamente ${p.V} cajas y quepa en la bahía (hasta ${p.maxL} de largo, ${p.maxW} de ancho y ${p.maxH} de alto).`,
        ),
      );
    const box = { x: 30, y: 146, w: 430, h: 326 };
    const fit = isoFit(box, lim.l, lim.w, lim.h, variant === "base" ? 0 : 1);
    const { P } = fit;
    const back = scene.add.graphics().setDepth(20);
    const crates = scene.add.graphics().setDepth(21);
    const front = scene.add.graphics().setDepth(22);
    const labels = edgeLabels(kit, P, 1, 1, 1, ["", "", ""]);
    // Manifest + steppers.
    kit.panel(480, 146, 310, 326, { fill: PANEL, alpha: 0.9 });
    kit.text(635, 170, api.t(L("MANIFEST", "MANIFIESTO")), 15, "#ffd76a", { weight: "800" });
    kit.text(635, 198, api.t(L(`${p.V} crates`, `${p.V} cajas`)), 22, "#ffffff", { weight: "900" });
    const names = { l: L("Length", "Largo"), w: L("Width", "Ancho"), h: L("Height", "Alto") };
    const rows = {};
    ["l", "w", "h"].forEach((k, i) => {
      const y = 250 + i * 66;
      const canEdit = editable.includes(k);
      kit.text(510, y, api.t(variant === "base" && k === "h" ? L("Layers", "Capas") : names[k]), 16, "#cfe3ee", {
        ox: 0,
        weight: "800",
      });
      const val = kit.text(680, y, "", 26, canEdit ? "#ffffff" : "#8fa6b5", { weight: "900" });
      const ring = scene.add.graphics().setDepth(21);
      if (canEdit) {
        kit.button(626, y, 44, 44, "−", () => bump(k, -1), { size: 22, fill: 0x2f4b5c, color: "#eaf6ff" });
        kit.button(734, y, 44, 44, "+", () => bump(k, 1), { size: 22 });
      }
      rows[k] = { val, ring, y, canEdit };
    });
    function bump(k, d) {
      sel = Math.max(0, editable.indexOf(k));
      b[k] = Phaser.Math.Clamp(b[k] + d, 1, lim[k]);
      loaded = 0;
      api.sfx.tick(Math.min(12, b[k]));
      draw();
      api.refresh();
    }
    function draw() {
      back.clear();
      crates.clear();
      front.clear();
      if (variant === "dims") {
        // Docking bay limit (dashed frame).
        front.lineStyle(2, 0xffd76a, 0.8);
        const q = [P(0, 0, p.maxH), P(p.maxL, 0, p.maxH), P(p.maxL, p.maxW, p.maxH), P(0, p.maxW, p.maxH)];
        for (let i = 0; i < 4; i++) dashed(front, q[i], q[(i + 1) % 4]);
        dashed(front, P(p.maxL, 0, 0), P(p.maxL, 0, p.maxH));
        dashed(front, P(p.maxL, p.maxW, 0), P(p.maxL, p.maxW, p.maxH));
        dashed(front, P(0, p.maxW, 0), P(0, p.maxW, p.maxH));
        back.fillStyle(0xffd76a, 0.08).fillPoints(
          [P(0, 0, 0), P(p.maxL, 0, 0), P(p.maxL, p.maxW, 0), P(0, p.maxW, 0)],
          true,
        );
      }
      bayBack(back, P, b.l, b.w, b.h);
      if (loaded) fillCells(crates, P, b.l, b.w, b.h, 1, loaded, { extraLayers: 3 });
      const outside = variant === "dims" && !M.fits(p, b);
      bayFront(front, P, b.l, b.w, b.h, outside ? 0xff8a5c : BAY);
      const pos = [
        [P(b.l / 2, b.w, 0), -16, 16],
        [P(b.l, b.w / 2, 0), 16, 16],
        [P(b.l, 0, b.h / 2), 22, 0],
      ];
      ["l", "w", "h"].forEach((k, i) => {
        labels[i].setPosition(pos[i][0].x + pos[i][1], pos[i][0].y + pos[i][2]).setText(String(b[k]));
        const r = rows[k];
        r.val.setText(String(b[k]));
        r.ring.clear();
        if (r.canEdit && editable[sel] === k)
          r.ring.lineStyle(3, 0xffd76a, 1).strokeRoundedRect(496, r.y - 26, 280, 52, 12);
      });
    }
    draw();
    async function loadManifest() {
      const per = b.l * b.w;
      const layers = Math.ceil(p.V / per);
      for (const k of stages(Math.min(layers, b.h + 3))) {
        loaded = Math.min(p.V, per * k);
        draw();
        api.sfx.tick(Math.min(12, k * 2));
        await kit.wait(220);
      }
      loaded = p.V;
      draw();
    }
    const FEEDBACK = {
      noFit: L(
        "It holds the right number of crates, but the module sticks out of the docking bay. Try other dimensions.",
        "Guarda el número correcto de cajas, pero el módulo se sale de la bahía. Prueba otras medidas.",
      ),
      addDims: L(
        "You added length + width + height. The crates fill length × width × height.",
        "Sumaste largo + ancho + alto. Las cajas llenan largo × ancho × alto.",
      ),
      areaNotVolume: L(
        "That matches the outside faces (surface area), not the crates inside.",
        "Eso coincide con las caras de afuera (área de superficie), no con las cajas de adentro.",
      ),
      oneLayer: L(
        "One layer of that floor already holds every crate. Count all the layers, not just the floor.",
        "Una capa de ese piso ya guarda todas las cajas. Cuenta todas las capas, no solo el piso.",
      ),
      subtractBase: L(
        "You subtracted the floor from the crates. Each layer holds a whole floor of crates: divide into equal layers.",
        "Restaste el piso a las cajas. Cada capa guarda un piso completo de cajas: divide en capas iguales.",
      ),
      oneEdge: L(
        "You divided by only one edge of the floor. One layer holds length × width crates.",
        "Dividiste solo entre una arista del piso. Una capa guarda largo × ancho cajas.",
      ),
    };
    return {
      checkLabel: L("Dock the module", "Acoplar el módulo"),
      get actions() {
        const list = [
          { key: "ArrowUp", label: L("+1 to this edge", "+1 a esta arista"), run: () => bump(editable[sel], 1) },
          { key: "ArrowDown", label: L("−1 from this edge", "−1 a esta arista"), run: () => bump(editable[sel], -1) },
        ];
        if (editable.length > 1)
          list.push(
            {
              key: "ArrowRight",
              label: L("Next edge", "Siguiente arista"),
              run: () => {
                sel = (sel + 1) % editable.length;
                draw();
                api.refresh();
              },
            },
            {
              key: "ArrowLeft",
              label: L("Previous edge", "Arista anterior"),
              run: () => {
                sel = (sel + editable.length - 1) % editable.length;
                draw();
                api.refresh();
              },
            },
          );
        return list;
      },
      status: () =>
        L(
          `Module ${b.l} × ${b.w} × ${b.h}`,
          `Módulo ${b.l} × ${b.w} × ${b.h}`,
        ),
      hints:
        variant === "base"
          ? [
              L(
                "V = B × h: the floor area B times the number of layers.",
                "V = B × h: el área del piso B por el número de capas.",
              ),
              L(
                `B = ${p.l} × ${p.w} = ${p.B} crates per layer. How many groups of ${p.B} make ${p.V}?`,
                `B = ${p.l} × ${p.w} = ${p.B} cajas por capa. ¿Cuántos grupos de ${p.B} forman ${p.V}?`,
              ),
            ]
          : [
              L(
                `Volume = length × width × height. Find three numbers that multiply to ${p.V}, each one inside the bay limits.`,
                `Volumen = largo × ancho × alto. Busca tres números que multiplicados den ${p.V}, cada uno dentro de los límites.`,
              ),
              L(
                `Try a length of ${p.sol.l}. Then width × height must make ${p.V} ÷ ${p.sol.l} = ${p.V / p.sol.l}.`,
                `Prueba un largo de ${p.sol.l}. Entonces ancho × alto debe dar ${p.V} ÷ ${p.sol.l} = ${p.V / p.sol.l}.`,
              ),
            ],
      async check() {
        await loadManifest();
        const tag = M.classifyModule(p, b);
        if (!tag) {
          const c = P(b.l / 2, b.w / 2, b.h);
          kit.burst(c.x, c.y, 0xb9d4ff, 30);
          return { ok: true };
        }
        const cap = b.l * b.w * b.h;
        return {
          ok: false,
          misconception: tag,
          feedback:
            FEEDBACK[tag] ||
            (cap < p.V
              ? L(
                  "Too small: crates spill out of the module (orange). It needs more room.",
                  "Muy pequeño: las cajas se salen del módulo (naranja). Necesita más espacio.",
                )
              : L(
                  "Too big: the module has empty space left over. It must hold exactly the manifest.",
                  "Muy grande: al módulo le sobra espacio vacío. Debe guardar exactamente el manifiesto.",
                )),
        };
      },
      async demo() {
        const target = variant === "base" ? { h: p.h } : p.sol;
        for (const k of editable) {
          sel = editable.indexOf(k);
          while (b[k] !== target[k]) {
            b[k] += b[k] < target[k] ? 1 : -1;
            loaded = 0;
            draw();
            api.sfx.tick(b[k]);
            await kit.wait(200);
          }
          const tip = P(b.l, b.w, b.h);
          kit.floatText(tip.x, tip.y - 16, api.t(names[k]) + " " + b[k], "#ffd76a", 18);
          await kit.wait(300);
        }
        await loadManifest();
      },
      explain: () =>
        variant === "base"
          ? L(
              `B = ${p.l} × ${p.w} = ${p.B}. V = B × h = ${p.B} × ${p.h} = ${p.V} crates.`,
              `B = ${p.l} × ${p.w} = ${p.B}. V = B × h = ${p.B} × ${p.h} = ${p.V} cajas.`,
            )
          : L(
              `${b.l} × ${b.w} × ${b.h} = ${p.V} crates, and it fits the bay.`,
              `${b.l} × ${b.w} × ${b.h} = ${p.V} cajas, y cabe en la bahía.`,
            ),
      _p: p,
      _b: b,
    };
  }

  window.VB_MISSIONS = Object.assign(window.VB_MISSIONS || {}, {
    loader,
    module,
    stages,
    isoFit,
    cube,
    dashed,
    bayBack,
    bayFront,
    edgeLabels,
    fillCells,
    markGap,
    numField,
    fracField,
    PANEL,
    CRATE,
    SPILL,
    GUIDE,
    BAY,
  });
})();
