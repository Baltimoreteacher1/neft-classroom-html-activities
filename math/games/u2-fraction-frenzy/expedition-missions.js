/* Reef Rescue — shared board widgets and the first two machines of the Fraction Frenzy expedition.
 *
 *   frames  the student types how many coral frames fit; the frames are mounted along the
 *           reef wall (a number line), leaving a gap or sticking out past the end when wrong
 *   beds    the student sets each nursery bed's share of kelp feed; the feed is dealt out,
 *           leaving starving beds or wasted feed when wrong
 * Pure mathematics lives in expedition-math.js (window.FF_MATH).
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.FF_MATH;
  if (!X || !M) return;
  const { W } = X;
  const L = (en, es) => ({ en, es });
  const { F, fmt, fmtImp, eq, val, mul, sub, div, floor, cmp } = M;
  const C = {
    panel: 0x07202b,
    rock: 0x4a5560,
    rockTop: 0x6d7a84,
    coral: 0xff8f7a,
    coralDim: 0x8a6a66,
    kelp: 0x5fd38a,
    kelpDim: 0x6d7764,
    feed: 0xffc35a,
    water: 0x4cc9f0,
    bad: 0xff7a59,
    gold: 0xffd76a,
    ink: "#eaf6ff",
  };
  const clampR = (w, h, r) => Math.max(0, Math.min(r, w / 2 - 0.5, h / 2 - 0.5));

  /* ── Mixed-number entry: [whole] [num / den] boxes ─────────────────────── */
  function makeEntry(scene, api, cx, cy, label) {
    const { kit } = api;
    const st = { w: "", n: "", d: "" };
    const boxes = [
      { k: "w", x: cx, y: cy, w: 62, h: 68, size: 34 },
      { k: "n", x: cx + 64, y: cy - 25, w: 54, h: 42, size: 24 },
      { k: "d", x: cx + 64, y: cy + 25, w: 54, h: 42, size: 24 },
    ];
    const g = scene.add.graphics().setDepth(22);
    const txt = boxes.map((b) =>
      kit.text(b.x, b.y, "", b.size, "#ffffff", { weight: "900", depth: 23 }),
    );
    if (label)
      kit.text(cx - 44, cy, api.t(label), 15, "#bfe9ef", {
        ox: 1,
        weight: "800",
        wrap: 150,
        align: "right",
      });
    const ent = { st, sel: -1, onPick: null, hot: false };
    boxes.forEach((b, i) => {
      scene.add
        .zone(b.x, b.y, b.w, b.h)
        .setInteractive({ useHandCursor: true })
        .setDepth(24)
        .on("pointerdown", () => ent.onPick?.(i));
    });
    ent.draw = () => {
      g.clear();
      boxes.forEach((b, i) => {
        const active = ent.sel === i;
        g.fillStyle(0x0b2a36, 1).fillRoundedRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 10);
        g.lineStyle(active ? 4 : 2, active ? C.gold : ent.hot ? 0x63eed8 : 0x3f7d8c, 1);
        g.strokeRoundedRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 10);
        txt[i].setText(st[b.k] || (active ? "▮" : ""));
        txt[i].setColor(st[b.k] ? "#ffffff" : "#ffd76a");
      });
      g.lineStyle(3, 0xeaf6ff, 0.9).lineBetween(cx + 38, cy, cx + 90, cy);
    };
    ent.type = (key) => {
      if (ent.sel < 0) return false;
      const k = boxes[ent.sel].k;
      if (key === "Backspace") st[k] = st[k].slice(0, -1);
      else if (/^[0-9]$/.test(key) && st[k].length < 2) st[k] = st[k] === "0" ? key : st[k] + key;
      else return false;
      return true;
    };
    ent.read = () => M.readEntry(st.w, st.n, st.d);
    ent.set = (e) => Object.assign(st, e);
    ent.text = () => {
      const r = ent.read();
      return r.v ? fmt(r.v) : "—";
    };
    ent.draw();
    return ent;
  }
  /** One keyboard focus across several entries' boxes (← → move, digits type). */
  function entryGroup(scene, api, entries) {
    const slots = entries.flatMap((e) => [0, 1, 2].map((i) => ({ e, i })));
    const grp = { idx: 0 };
    grp.draw = () => {
      entries.forEach((e) => {
        e.sel = slots[grp.idx].e === e ? slots[grp.idx].i : -1;
        e.draw();
      });
    };
    grp.focus = (e, i) => {
      grp.idx = slots.findIndex((s) => s.e === e && s.i === i);
      api.sfx.tap();
      grp.draw();
      api.refresh();
    };
    entries.forEach((e) => {
      e.onPick = (i) => grp.focus(e, i);
    });
    grp.move = (d) => {
      grp.idx = (grp.idx + d + slots.length) % slots.length;
      api.sfx.tick(grp.idx);
      grp.draw();
      api.refresh();
    };
    grp.type = (key) => {
      const s = slots[grp.idx];
      if (s.e.type(key)) {
        api.sfx.tap();
        grp.draw();
        grp.onChange?.();
        api.refresh();
      }
    };
    // Backspace arrives through the action deck; kit.onType would erase twice.
    api.kit.onType((key) => key !== "Backspace" && grp.type(key));
    grp.actions = [
      { key: "ArrowRight", label: L("Next box →", "Casilla siguiente →"), run: () => grp.move(1) },
      {
        key: "ArrowLeft",
        label: L("← Previous box", "← Casilla anterior"),
        run: () => grp.move(-1),
      },
      {
        key: "Backspace",
        label: L("Erase digit", "Borrar dígito"),
        run: () => grp.type("Backspace"),
      },
    ];
    grp.draw();
    return grp;
  }
  function keypadFor(api, grp, y = 452) {
    api.kit.keypad(160, y, (k) => grp.type(k), { size: 40 });
  }
  const entryMsg = (r) =>
    r.empty
      ? L("Type a number first.", "Primero escribe un número.")
      : r.bad === "den"
        ? L("The bottom number cannot be 0.", "El número de abajo no puede ser 0.")
        : L(
            "Fill both the top and the bottom of the fraction, or leave both empty.",
            "Completa arriba y abajo de la fracción, o deja las dos vacías.",
          );

  /* ── Reef wall ruler: a rock ledge marked in meters and 1/tick pieces ──── */
  function ruler(scene, kit, o) {
    const g = scene.add.graphics().setDepth(21);
    const x1 = o.x0 + o.len * o.px;
    g.fillStyle(C.rock, 1).fillRoundedRect(o.x0, o.y, x1 - o.x0, 20, 4);
    g.fillStyle(C.rockTop, 1).fillRect(o.x0, o.y, x1 - o.x0, 5);
    const steps = Math.round(o.len * o.tick);
    for (let i = 0; i <= steps; i++) {
      const x = o.x0 + (i / o.tick) * o.px;
      const whole = i % o.tick === 0;
      g.lineStyle(whole ? 3 : 1.5, 0xeaf6ff, whole ? 0.95 : 0.55);
      g.lineBetween(x, o.y + 20, x, o.y + (whole ? 32 : 27));
      if (whole)
        kit.text(x, o.y + 44, String(i / o.tick), 14, "#d4eef3", { weight: "800", depth: 21 });
    }
    kit.text(x1 + 6, o.y + 44, "m", 14, "#9fc6cf", { ox: 0, depth: 21 });
    return g;
  }
  /** One coral frame (a lattice tile) of width w at x. */
  function drawFrame(g, x, y, w, h, color, pieces, pw) {
    const r = clampR(w, h, 6);
    g.fillStyle(color, 1).fillRoundedRect(x + 1, y, Math.max(1, w - 2), h, r);
    g.lineStyle(2, 0xffffff, 0.45).strokeRoundedRect(x + 1, y, Math.max(1, w - 2), h, r);
    g.lineStyle(1, 0x5a1f1a, 0.35);
    for (let p = 1; p < pieces; p++)
      if (p * pw < w - 2) g.lineBetween(x + p * pw, y + 3, x + p * pw, y + h - 3);
    g.lineStyle(2, 0xffe2d8, 0.5).lineBetween(x + 4, y + h / 2, x + w - 4, y + h / 2);
  }

  /* ── Misconception feedback shared by the division machines ────────────── */
  /** N = noun pack: sized(y), howMany, items, one, oneMore, wholeItems, unit. */
  function divMiss(tag, N, xs, ys) {
    const s = N.sized(ys);
    const msg = {
      multiply: L(
        `You multiplied ${xs} × ${ys}. Dividing asks ${N.howMany.en} ${s.en} fit in ${xs} ${N.unit.en}.`,
        `Multiplicaste ${xs} × ${ys}. Dividir pregunta ${N.howMany.es} ${s.es} caben en ${xs} ${N.unit.es}.`,
      ),
      inverted: L(
        `You divided the wrong way (${ys} ÷ ${xs}). Start with the whole amount, ${xs} ${N.unit.en}, and divide it by the size of ${N.one.en}.`,
        `Dividiste al revés (${ys} ÷ ${xs}). Empieza con la cantidad total, ${xs} ${N.unit.es}, y divídela entre el tamaño de ${N.one.es}.`,
      ),
      invertBoth: L(
        `You flipped both numbers. Keep the first number as it is. Flip only the divisor, ${ys}.`,
        `Volteaste los dos números. Deja el primer número igual. Voltea solo el divisor, ${ys}.`,
      ),
      mixedSplit: L(
        `You did not divide all of ${xs}: the whole part and the fraction part got split up. Change ${xs} to an improper fraction first.`,
        `No dividiste todo ${xs}: separaste la parte entera y la fracción. Primero cambia ${xs} a fracción impropia.`,
      ),
      remainderUnit: L(
        `Your leftover is counted in ${N.unitWord.en}, not in ${N.items.en}. The leftover is part of ${N.one.en}. What fraction of ${N.one.en} is it?`,
        `Contaste lo que sobra en ${N.unitWord.es}, no en ${N.items.es}. Lo que sobra es parte de ${N.one.es}. ¿Qué fracción de ${N.one.es} es?`,
      ),
      remainderDropped: L(
        `You counted only ${N.wholeItems.en}, so a gap is left. Part of ${N.oneMore.en} still fits.`,
        `Contaste solo ${N.wholeItems.es}, así que queda un hueco. Todavía cabe parte de ${N.oneMore.es}.`,
      ),
      roundedUp: L(
        `${N.tooManyOne.en}: the last one does not fit all the way. Use only part of it.`,
        `${N.tooManyOne.es}: la última no cabe completa. Usa solo una parte.`,
      ),
    }[tag];
    return msg || null;
  }
  const FRAME_NOUNS = {
    sized: (y) => L(`${y}-m frames`, `marcos de ${y} m`),
    howMany: L("how many", "cuántos"),
    items: L("frames", "marcos"),
    one: L("one frame", "un marco"),
    oneMore: L("one more frame", "un marco más"),
    wholeItems: L("whole frames", "marcos completos"),
    unit: L("m", "m"),
    unitWord: L("meters", "metros"),
    tooManyOne: L("One frame too many", "Un marco de más"),
  };

  /* ── frames: how many coral frames fit along the reef wall ─────────────── */
  function frames(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const P = M.genFrames(rng, tier);
    const { x: D, y: d, q, tick } = P;
    const Ds = fmt(D);
    const ds = fmt(d);
    api.setBrief(
      tier <= 1
        ? L(
            `The reef wall is ${Ds} m long. Each coral frame is ${ds} m long. How many frames fit along the wall? Type the number of frames.`,
            `La pared del arrecife mide ${Ds} m. Cada marco de coral mide ${ds} m. ¿Cuántos marcos caben a lo largo de la pared? Escribe el número de marcos.`,
          )
        : L(
            `The reef wall is ${Ds} m long. Each coral frame is ${ds} m long, and a frame can be cut. How many frames (and part of a frame) cover the wall exactly?`,
            `La pared del arrecife mide ${Ds} m. Cada marco de coral mide ${ds} m y se puede cortar. ¿Cuántos marcos (y parte de un marco) cubren la pared exactamente?`,
          ),
    );
    const X0 = 60;
    const px = Math.min(240, 660 / (val(D) * 1.16));
    const wallEnd = X0 + val(D) * px;
    const RIGHT = 790;
    const FY = 186;
    const FH = 30;
    const pieces = Math.round(val(d) * tick);
    const pw = px / tick;
    // Legend: one frame at the same scale as the wall.
    kit.text(40, 154, api.t(L("One frame:", "Un marco:")), 15, "#bfe9ef", { ox: 0, weight: "800" });
    const leg = scene.add.graphics().setDepth(21);
    drawFrame(leg, 150, 142, val(d) * px, 24, C.coral, pieces, pw);
    kit.text(160 + val(d) * px, 154, `${ds} m`, 16, "#ffd2c6", { ox: 0, weight: "900" });
    ruler(scene, kit, { x0: X0, px, y: 218, len: val(D), tick });
    const wallGlow = scene.add.graphics().setDepth(20);
    const placed = scene.add.graphics().setDepth(22);
    const marks = scene.add.graphics().setDepth(23);
    const note = kit.text(W / 2, 290, "", 15, "#ffd2c6", { weight: "800", depth: 23 });
    const entry = makeEntry(
      scene,
      api,
      330,
      360,
      L("Frames along the wall:", "Marcos en la pared:"),
    );
    const grp = entryGroup(scene, api, [entry]);
    keypadFor(api, grp);
    const preview = kit.text(450, 360, "", 18, "#ffffff", { ox: 0, weight: "800" });
    grp.onChange = () => {
      preview.setText(
        entry.read().v ? `= ${fmt(entry.read().v)} ${api.t(L("frames", "marcos"))}` : "",
      );
      placed.setAlpha(0.35);
      marks.clear();
      note.setText("");
    };

    /** Mount v frames from the left end of the wall; returns the covered length. */
    async function mount(v, slow) {
      placed.clear().setAlpha(1);
      marks.clear();
      wallGlow.clear();
      note.setText("");
      const len = mul(v, d);
      const whole = floor(v);
      const n = Math.min(60, Math.ceil(val(v)));
      for (let i = 0; i < n; i++) {
        const start = X0 + i * val(d) * px;
        if (start > RIGHT) break;
        const part = i < whole ? 1 : val(v) - whole;
        const w = Math.min(val(d) * px * part, RIGHT - start);
        const over = start + w > wallEnd + 0.5;
        drawFrame(placed, start, FY, w, FH, over ? C.bad : i % 2 ? 0xff9f8c : C.coral, pieces, pw);
        if (slow) {
          api.sfx.tick(Math.min(i, 14));
          if (i < 14)
            kit.floatText(
              start + w / 2,
              FY - 6,
              i < whole ? String(i + 1) : fmt(F(Math.round(part * pieces), pieces)),
              "#ffd76a",
              16,
            );
          await kit.wait(i < 16 ? 260 : 60);
        }
      }
      const cover = val(len) * px;
      if (eq(len, D)) {
        wallGlow
          .fillStyle(0x63eed8, 0.35)
          .fillRoundedRect(X0 - 6, FY - 10, wallEnd - X0 + 12, 70, 12);
      } else if (cmp(len, D) < 0) {
        const gx = X0 + cover;
        marks.fillStyle(C.bad, 0.28).fillRect(gx, FY - 4, wallEnd - gx, FH + 8);
        marks.lineStyle(2, C.bad, 1).strokeRect(gx, FY - 4, Math.max(2, wallEnd - gx), FH + 8);
        note
          .setText(api.t(L("Gap: bare rock, no coral", "Hueco: roca sin coral")))
          .setX(Math.min(700, Math.max(130, (gx + wallEnd) / 2)));
      } else {
        marks.lineStyle(3, C.bad, 1).lineBetween(wallEnd, FY - 14, wallEnd, FY + FH + 8);
        note
          .setText(
            api.t(
              L(
                "Too long: frames stick out past the wall",
                "Demasiado largo: los marcos salen de la pared",
              ),
            ),
          )
          .setX(Math.min(620, Math.max(200, wallEnd)));
      }
      return len;
    }

    const T = tick;
    const hints = [
      tier >= 3
        ? L(
            `Change ${Ds} and ${ds} to improper fractions first. Then Keep, Change, Flip: keep ${fmtImp(D)}, change ÷ to ×, flip the divisor.`,
            `Primero cambia ${Ds} y ${ds} a fracciones impropias. Luego Mantén, Cambia, Voltea: mantén ${fmtImp(D)}, cambia ÷ por ×, voltea el divisor.`,
          )
        : L(
            `Dividing asks: how many ${ds}-m frames fit in ${Ds} m? You can also multiply by the reciprocal: ${Ds} ÷ ${ds} = ${Ds} × ${d.d}/${d.n}.`,
            `Dividir pregunta: ¿cuántos marcos de ${ds} m caben en ${Ds} m? También puedes multiplicar por el recíproco: ${Ds} ÷ ${ds} = ${Ds} × ${d.d}/${d.n}.`,
          ),
      L(
        `Each meter on the wall is cut into ${T} pieces. The wall has ${val(D) * T} pieces. One frame uses ${pieces} pieces. How many groups of ${pieces} are in ${val(D) * T}?${M.isInt(q) ? "" : " Leftover pieces are part of a frame."}`,
        `Cada metro de la pared está cortado en ${T} partes. La pared tiene ${val(D) * T} partes. Un marco usa ${pieces} partes. ¿Cuántos grupos de ${pieces} hay en ${val(D) * T}?${M.isInt(q) ? "" : " Las partes que sobran son parte de un marco."}`,
      ),
    ];

    return {
      checkLabel: L("Mount the frames", "Montar los marcos"),
      actions: grp.actions,
      status: () => L(`Frames: ${entry.text()}`, `Marcos: ${entry.text()}`),
      hints,
      async check() {
        const r = entry.read();
        if (!r.v) return { ok: false, incomplete: true, feedback: entryMsg(r) };
        const len = await mount(r.v, false);
        if (eq(len, D)) {
          kit.burst(X0 + (wallEnd - X0) / 2, FY + 10, 0x63eed8, 30);
          return { ok: true };
        }
        const tag = M.classify(P.list, r.v);
        const fb = tag && divMiss(tag, FRAME_NOUNS, Ds, ds);
        if (fb) return { ok: false, misconception: tag, feedback: fb };
        return cmp(len, D) < 0
          ? {
              ok: false,
              misconception: "tooFew",
              feedback: L(
                "Too few frames: part of the wall is still bare rock. Count the pieces again.",
                "Muy pocos marcos: parte de la pared sigue sin coral. Cuenta las partes otra vez.",
              ),
            }
          : {
              ok: false,
              misconception: "tooMany",
              feedback: L(
                "Too many frames: they stick out past the end of the wall. Count the pieces again.",
                "Demasiados marcos: salen del final de la pared. Cuenta las partes otra vez.",
              ),
            };
      },
      async demo() {
        entry.set({ w: "", n: "", d: "" });
        grp.draw();
        await mount(q, true);
        entry.set(M.entryFor(q));
        grp.draw();
        grp.onChange();
        placed.setAlpha(1);
        await mount(q, false);
        await kit.wait(500);
      },
      explain: () =>
        L(
          `${Ds} ÷ ${ds} = ${fmt(q)}: ${fmt(q)} frames of ${ds} m cover the ${Ds}-m wall.`,
          `${Ds} ÷ ${ds} = ${fmt(q)}: ${fmt(q)} marcos de ${ds} m cubren la pared de ${Ds} m.`,
        ),
    };
  }

  /* ── beds: share kelp feed equally among the nursery beds ──────────────── */
  function beds(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const P = M.genBeds(rng, tier);
    const { f, n, q } = P;
    const fs = fmt(f);
    api.setBrief(
      L(
        `The nursery has ${fs} kg of kelp feed. Share it equally among ${n} beds. Set how much feed each bed gets.`,
        `El vivero tiene ${fs} kg de alimento de algas. Repártelo en partes iguales entre ${n} lechos. Indica cuánto alimento recibe cada lecho.`,
      ),
    );
    const X0 = 70;
    const span = Math.max(1, Math.ceil(val(f)));
    const px = 640 / span;
    const TY = 164;
    const TH = 30;
    kit.text(40, 147, api.t(L(`Kelp feed: ${fs} kg`, `Alimento: ${fs} kg`)), 15, "#ffe2a6", {
      ox: 0,
      weight: "800",
    });
    const tape = scene.add.graphics().setDepth(21);
    const cuts = scene.add.graphics().setDepth(22);
    const bedG = scene.add.graphics().setDepth(21);
    const bedFeed = scene.add.graphics().setDepth(22);
    const tapeNote = kit.text(W / 2, 214, "", 14, "#ffd2c6", { weight: "800", depth: 23 });
    // Kilogram outline + scale labels so the student can read the size of the feed.
    for (let k = 0; k <= span; k++)
      kit.text(X0 + k * px, TY + TH + 12, `${k} kg`, 12, "#9fc6cf", { depth: 21 });
    function drawTape(used) {
      tape.clear();
      tape.lineStyle(2, 0x9fc6cf, 0.5).strokeRect(X0, TY, span * px, TH);
      const pieceW = px / f.d;
      for (let i = 0; i < f.n; i++) {
        const x = X0 + i * pieceW;
        const spent = used != null && (i + 1) / f.d <= used + 1e-9;
        tape.fillStyle(spent ? 0x3a4a52 : C.feed, 1).fillRect(x + 1, TY + 1, pieceW - 2, TH - 2);
      }
      if (used != null && used > 0) {
        const ux = X0 + Math.min(used, val(f)) * px;
        tape.fillStyle(0x3a4a52, 0.85).fillRect(X0, TY, ux - X0, TH);
      }
      for (let k = 1; k < span; k++)
        tape.lineStyle(3, 0xffffff, 0.8).lineBetween(X0 + k * px, TY - 4, X0 + k * px, TY + TH + 4);
    }
    drawTape(null);
    // Beds.
    const BY = 236;
    const BH = 84;
    const gap = 12;
    const bw = (680 - gap * (n - 1)) / n;
    const bedX = (i) => 70 + i * (bw + gap);
    const bedLbl = [];
    function drawBeds(states) {
      bedG.clear();
      for (let i = 0; i < n; i++) {
        const x = bedX(i);
        const s = states ? states[i] : "idle";
        bedG.fillStyle(0x0b2a36, 0.92).fillRoundedRect(x, BY, bw, BH, 12);
        bedG
          .lineStyle(2, s === "fed" ? 0x63eed8 : s === "starve" ? C.bad : 0x3f7d8c, 1)
          .strokeRoundedRect(x, BY, bw, BH, 12);
        bedG.fillStyle(0x8b7a5a, 1).fillRoundedRect(x + 6, BY + BH - 18, bw - 12, 12, 5);
        const sprouts = Math.max(2, Math.min(6, Math.floor(bw / 22)));
        for (let k = 0; k < sprouts; k++) {
          const sx = x + ((k + 0.5) * bw) / sprouts;
          const h = s === "fed" ? 44 : s === "starve" ? 10 : 22;
          bedG.lineStyle(4, s === "fed" ? C.kelp : s === "starve" ? 0x6b6f66 : 0x4e9a6c, 1);
          bedG.lineBetween(sx, BY + BH - 18, sx + (k % 2 ? 4 : -4), BY + BH - 18 - h);
        }
      }
    }
    for (let i = 0; i < n; i++)
      bedLbl.push(
        kit.text(
          bedX(i) + bw / 2,
          BY + 12,
          api.t(L(`Bed ${i + 1}`, `Lecho ${i + 1}`)),
          13,
          "#bfe9ef",
          { weight: "800", depth: 23 },
        ),
      );
    drawBeds(null);

    // Share dial: numerator and denominator steppers (digits also type into the active box).
    let num = 0;
    let den = 1;
    let act = 0;
    const DX = 410;
    const NY = 382;
    const DY = 444;
    const dial = scene.add.graphics().setDepth(22);
    const numT = kit.text(DX, NY, "", 28, "#ffffff", { weight: "900", depth: 23 });
    const denT = kit.text(DX, DY, "", 28, "#ffffff", { weight: "900", depth: 23 });
    kit.text(DX - 100, 413, api.t(L("Each bed gets", "Cada lecho recibe")), 16, "#bfe9ef", {
      ox: 1,
      weight: "800",
    });
    const unitT = kit.text(DX + 110, 413, "", 17, "#ffe2a6", { ox: 0, weight: "800" });
    const typed = { buf: "" };
    function drawDial() {
      dial.clear();
      [NY, DY].forEach((y, i) => {
        dial.fillStyle(0x0b2a36, 1).fillRoundedRect(DX - 34, y - 24, 68, 48, 10);
        dial
          .lineStyle(act === i ? 4 : 2, act === i ? C.gold : 0x3f7d8c, 1)
          .strokeRoundedRect(DX - 34, y - 24, 68, 48, 10);
      });
      dial.lineStyle(3, 0xeaf6ff, 0.9).lineBetween(DX - 30, 413, DX + 30, 413);
      numT.setText(String(num));
      denT.setText(String(den));
      const v = F(num, den);
      unitT.setText("kg" + (M.isMixed(v) ? `  (= ${fmt(v)} kg)` : ""));
    }
    const setN = (v) => {
      num = Phaser.Math.Clamp(v, 0, M.DIAL_MAX);
      act = 0;
    };
    const setD = (v) => {
      den = Phaser.Math.Clamp(v, 1, M.DIAL_MAX);
      act = 1;
    };
    function bump(which, dlt) {
      typed.buf = "";
      if (which === 0) setN(num + dlt);
      else setD(den + dlt);
      api.sfx.tick(Math.min(12, which === 0 ? num : den));
      drawDial();
      bedFeed.clear();
      api.refresh();
    }
    [
      [NY, 0],
      [DY, 1],
    ].forEach(([y, which]) => {
      kit.button(DX - 66, y, 40, 40, "−", () => bump(which, -1), { size: 22 });
      kit.button(DX + 66, y, 40, 40, "+", () => bump(which, 1), { size: 22 });
      scene.add
        .zone(DX, y, 68, 48)
        .setInteractive({ useHandCursor: true })
        .setDepth(24)
        .on("pointerdown", () => {
          act = which;
          typed.buf = "";
          drawDial();
          api.refresh();
        });
    });
    kit.onType((key) => {
      if (!/^[0-9]$/.test(key)) return;
      typed.buf = (typed.buf + key).slice(-2);
      if (act === 0) setN(Number(typed.buf));
      else setD(Math.max(1, Number(typed.buf)));
      api.sfx.tap();
      drawDial();
      bedFeed.clear();
      api.refresh();
    });
    drawDial();

    /** Deal share v to each bed from the feed; returns {left, starving}. */
    async function deal(v, slow) {
      bedFeed.clear();
      cuts.clear();
      tapeNote.setText("");
      drawBeds(null);
      let used = 0;
      const states = [];
      for (let i = 0; i < n; i++) {
        const give = Math.max(0, Math.min(val(v), val(f) - used));
        used += give;
        const full = give >= val(v) - 1e-9 && give > 0;
        states.push(full ? "fed" : "starve");
        const x = bedX(i) + 8;
        const wFeed = Math.min(give * px, bw - 16);
        if (wFeed > 0) bedFeed.fillStyle(C.feed, 1).fillRect(x, BY + 26, Math.max(2, wFeed), 12);
        if (give * px > bw - 16)
          bedFeed
            .fillStyle(0xffffff, 1)
            .fillTriangle(x + bw - 16, BY + 22, x + bw - 16, BY + 42, x + bw - 8, BY + 32);
        drawTape(used);
        drawBeds(states.concat(Array(n - states.length).fill("idle")));
        if (slow || !kit.reduced()) {
          api.sfx.place();
          await kit.wait(slow ? 420 : 90);
        }
      }
      const left = sub(f, mul(v, F(n)));
      if (left.n > 0)
        tapeNote.setText(
          api.t(
            L(
              "Leftover feed drifts away and clouds the water",
              "El alimento que sobra se va y enturbia el agua",
            ),
          ),
        );
      const starving = states.filter((s) => s === "starve").length;
      if (starving)
        tapeNote.setText(
          api.t(
            L(
              starving === 1 ? "The feed ran out: 1 bed starves" : `The feed ran out: ${starving} beds starve`,
              starving === 1 ? "Se acabó el alimento: 1 lecho sin comida" : `Se acabó el alimento: ${starving} lechos sin comida`,
            ),
          ),
        );
      return { left, starving };
    }

    const imp = fmtImp(f);
    const pieceN = f.n;
    const hints = [
      M.isMixed(f)
        ? L(
            `Sharing equally means dividing: ${fs} ÷ ${n}. Change ${fs} to an improper fraction first, then multiply by 1/${n}.`,
            `Repartir en partes iguales es dividir: ${fs} ÷ ${n}. Primero cambia ${fs} a fracción impropia y luego multiplica por 1/${n}.`,
          )
        : L(
            `Sharing equally means dividing: ${fs} ÷ ${n}. Dividing by ${n} is the same as multiplying by 1/${n}.`,
            `Repartir en partes iguales es dividir: ${fs} ÷ ${n}. Dividir entre ${n} es lo mismo que multiplicar por 1/${n}.`,
          ),
      L(
        `${fs} kg = ${imp} kg: ${pieceN} pieces of 1/${f.d} kg. Cut every piece into ${n} slices. Each slice is 1/${f.d * n} kg. How many slices does each bed get?`,
        `${fs} kg = ${imp} kg: ${pieceN} partes de 1/${f.d} kg. Corta cada parte en ${n} trozos. Cada trozo es 1/${f.d * n} kg. ¿Cuántos trozos recibe cada lecho?`,
      ),
    ];
    const BED_COLORS = [0xffc35a, 0x63eed8, 0xff8f7a, 0xb59cff, 0x8fe388, 0x6ec8ff];

    return {
      checkLabel: L("Feed the beds", "Alimentar los lechos"),
      actions: [
        { key: "ArrowUp", label: L("Top number +1", "Número de arriba +1"), run: () => bump(0, 1) },
        {
          key: "ArrowDown",
          label: L("Top number −1", "Número de arriba −1"),
          run: () => bump(0, -1),
        },
        {
          key: "ArrowRight",
          label: L("Bottom number +1", "Número de abajo +1"),
          run: () => bump(1, 1),
        },
        {
          key: "ArrowLeft",
          label: L("Bottom number −1", "Número de abajo −1"),
          run: () => bump(1, -1),
        },
      ],
      status: () => L(`Each bed: ${num}/${den} kg`, `Cada lecho: ${num}/${den} kg`),
      hints,
      async check() {
        if (num === 0)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Set a share bigger than 0 first.",
              "Primero elige una porción mayor que 0.",
            ),
          };
        const v = F(num, den);
        const { left, starving } = await deal(v, false);
        if (left.n === 0) {
          kit.burst(W / 2, BY + 40, C.kelp, 30);
          return { ok: true };
        }
        const tag = M.classify(P.list, v);
        const fbs = {
          multiply: L(
            `You multiplied ${fs} × ${n}. Each bed would get more than all the feed! Sharing means dividing ${fs} into ${n} equal parts.`,
            `Multiplicaste ${fs} × ${n}. ¡Cada lecho recibiría más que todo el alimento! Repartir es dividir ${fs} en ${n} partes iguales.`,
          ),
          inverted: L(
            `You divided the wrong way (${n} ÷ ${fs}). Start with the feed, ${fs} kg, and divide it among ${n} beds.`,
            `Dividiste al revés (${n} ÷ ${fs}). Empieza con el alimento, ${fs} kg, y divídelo entre ${n} lechos.`,
          ),
          noDivide: L(
            `Each bed got ${fs} kg, the whole bundle, so the feed runs out after one bed. Dividing the top and the bottom by the same number does not make a smaller share.`,
            `Cada lecho recibió ${fs} kg, todo el alimento, y se acaba después del primer lecho. Dividir arriba y abajo entre el mismo número no hace una porción más pequeña.`,
          ),
          mixedSplit: L(
            `You divided only part of ${fs}. Change ${fs} to an improper fraction first, then divide all of it by ${n}.`,
            `Dividiste solo una parte de ${fs}. Primero cambia ${fs} a fracción impropia y luego divide todo entre ${n}.`,
          ),
        };
        if (tag && fbs[tag]) return { ok: false, misconception: tag, feedback: fbs[tag] };
        return starving
          ? {
              ok: false,
              misconception: "shareTooBig",
              feedback: L(
                "Each share is too big: the feed runs out and some beds starve.",
                "Cada porción es demasiado grande: el alimento se acaba y algunos lechos no comen.",
              ),
            }
          : {
              ok: false,
              misconception: "shareTooSmall",
              feedback: L(
                "Each share is too small: feed is left over and drifts away. The beds can get more.",
                "Cada porción es demasiado pequeña: sobra alimento y se va. Los lechos pueden recibir más.",
              ),
            };
      },
      async demo() {
        // Cut every 1/d piece of the feed into n slices; slice j goes to bed j mod n.
        drawTape(null);
        cuts.clear();
        const sliceW = px / (f.d * n);
        const total = f.n * n;
        for (let j = 0; j < total; j++) {
          cuts
            .fillStyle(BED_COLORS[(j % n) % BED_COLORS.length], 0.9)
            .fillRect(X0 + j * sliceW + 1, TY + 2, Math.max(1, sliceW - 2), TH - 4);
          if (j % 4 === 0 || !kit.reduced()) await kit.wait(total > 40 ? 30 : 90);
        }
        for (let i = 0; i < n; i++) bedLbl[i].setColor(kit.css(BED_COLORS[i % BED_COLORS.length]));
        tapeNote.setText(
          api.t(
            L(
              `${total} slices of 1/${f.d * n} kg: ${total / n} slices for each bed`,
              `${total} trozos de 1/${f.d * n} kg: ${total / n} trozos para cada lecho`,
            ),
          ),
        );
        await kit.wait(1400);
        num = q.n;
        den = q.d;
        drawDial();
        api.refresh();
        await kit.wait(500);
        cuts.clear();
        await deal(q, true);
      },
      explain: () =>
        L(
          `${fs} ÷ ${n} = ${fmtImp(q)}. Each of the ${n} beds gets ${fmtImp(q)} kg, and no feed is wasted.`,
          `${fs} ÷ ${n} = ${fmtImp(q)}. Cada uno de los ${n} lechos recibe ${fmtImp(q)} kg y no se desperdicia alimento.`,
        ),
    };
  }

  window.FF_MISSIONS = Object.assign(window.FF_MISSIONS || {}, {
    L,
    C,
    clampR,
    makeEntry,
    entryGroup,
    keypadFor,
    entryMsg,
    ruler,
    drawFrame,
    divMiss,
    frames,
    beds,
  });
})();
