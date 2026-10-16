/* Reef Rescue — the tank and the two-step machines of the Fraction Frenzy expedition.
 *
 *   scoops  pour whole scoops and part of a scoop into the nutrient tank; it overflows or
 *           stays thin unless scoops × scoop size is exactly the tank's capacity
 *   rescue  a two-step reef problem: a bracket shows the student's step-1 amount on the
 *           trench, then their mats are laid along it (gap, overlap, or a planted bed)
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.FF_MATH;
  const K = window.FF_MISSIONS;
  if (!X || !M || !K) return;
  const { L, C, makeEntry, entryGroup, keypadFor, entryMsg, ruler, drawFrame, divMiss } = K;
  const { F, fmt, eq, val, mul, cmp, floor } = M;

  /* ── scoops: fill the nutrient tank with s-cup scoops ──────────────────── */
  const SCOOP_NOUNS = {
    sized: (y) => L(`${y}-cup scoops`, `medidas de ${y} de taza`),
    howMany: L("how many", "cuántas"),
    items: L("scoops", "medidas"),
    one: L("one scoop", "una medida"),
    oneMore: L("one more scoop", "una medida más"),
    wholeItems: L("whole scoops", "medidas completas"),
    unit: L("cups", "tazas"),
    unitWord: L("cups", "tazas"),
    tooManyOne: L("One scoop too many", "Una medida de más"),
  };
  function scoops(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const P = M.genScoops(rng, tier);
    const { c, s, q, pieces: a } = P;
    const b = s.d;
    const cs = fmt(c);
    const ss = fmt(s);
    api.setBrief(
      tier >= 3
        ? L(
            `The nutrient tank holds ${cs} cups. Your scoop holds ${ss} cup. Pour whole scoops, and part of a scoop if you need it, so the tank is exactly full.`,
            `El tanque de nutrientes tiene capacidad para ${cs} tazas. Tu medida tiene ${ss} de taza. Vierte medidas completas, y parte de una si hace falta, para llenar el tanque exactamente.`,
          )
        : L(
            `The nutrient tank holds ${cs} cups. Your scoop holds ${ss} cup. How many scoops fill the tank exactly?`,
            `El tanque de nutrientes tiene capacidad para ${cs} tazas. Tu medida tiene ${ss} de taza. ¿Cuántas medidas llenan el tanque exactamente?`,
          ),
    );
    // Scoop card.
    kit.panel(28, 140, 214, 128, { fill: C.panel, alpha: 0.9 });
    kit.text(135, 156, api.t(L("ONE SCOOP", "UNA MEDIDA")), 14, "#ffd76a", { weight: "800" });
    const card = scene.add.graphics().setDepth(21);
    const ph = Math.min(36, 82 / a);
    for (let i = 0; i < a; i++) {
      card.fillStyle(C.feed, 1).fillRect(56, 254 - (i + 1) * ph + 1, 52, ph - 2);
    }
    card.lineStyle(3, 0xeaf6ff, 0.9).strokeRoundedRect(52, 254 - a * ph - 4, 60, a * ph + 6, 6);
    kit.text(178, 196, `${ss} ${api.t(L("cup", "de taza"))}`, 18, "#ffffff", { weight: "900" });
    kit.text(
      178,
      228,
      api.t(
        L(
          `${a} part${a === 1 ? "" : "s"} of 1/${b} cup`,
          `${a} parte${a === 1 ? "" : "s"} de 1/${b} de taza`,
        ),
      ),
      13,
      "#bfe9ef",
      {
        wrap: 120,
      },
    );

    // Pour queue.
    kit.panel(254, 140, 316, 196, { fill: C.panel, alpha: 0.85 });
    kit.text(412, 156, api.t(L("Scoops to pour", "Medidas para verter")), 14, "#ffd76a", {
      weight: "800",
    });
    const queue = scene.add.graphics().setDepth(21);
    const readout = kit.text(412, 316, "", 17, "#ffffff", { weight: "800", depth: 22 });
    let whole = 0;
    let part = 0;
    const pourV = () => M.scoopValue(whole, part, a);
    function drawQueue() {
      queue.clear();
      const n = whole + (part ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const x = 270 + (i % 7) * 42;
        const y = 178 + Math.floor(i / 7) * 62;
        const filled = i < whole ? a : part;
        const h = 48;
        const pp = h / a;
        for (let k = 0; k < a; k++)
          queue
            .fillStyle(k < filled ? C.feed : 0x23404a, 1)
            .fillRect(x + 2, y + h - (k + 1) * pp + 1, 28, Math.max(1, pp - 2));
        queue
          .lineStyle(2, i < whole ? 0xeaf6ff : C.gold, 0.85)
          .strokeRoundedRect(x, y - 2, 32, h + 4, 5);
      }
      readout.setText(
        api.t(
          L(
            `You will pour ${fmt(pourV())} scoop${eq(pourV(), F(1)) ? "" : "s"}`,
            `Vas a verter ${fmt(pourV())} medida${eq(pourV(), F(1)) ? "" : "s"}`,
          ),
        ),
      );
    }

    // Tank.
    const TX = 610;
    const TW = 140;
    const TB = 462;
    const TT = 150;
    const cupPx = (TB - TT) / (val(c) * 1.3);
    const tank = scene.add.graphics().setDepth(21);
    const level = scene.add.graphics().setDepth(22);
    const tankNote = kit.text(TX + TW / 2, TT - 2, "", 13, "#ffd2c6", { weight: "800", depth: 23 });
    tank.fillStyle(0x062430, 0.92).fillRoundedRect(TX, TT, TW, TB - TT, 12);
    for (let k = 1; k <= Math.floor(val(c) * 1.3); k++) {
      const y = TB - k * cupPx;
      tank.lineStyle(1.5, 0xeaf6ff, 0.35).lineBetween(TX + 6, y, TX + 26, y);
      kit.text(TX - 6, y, String(k), 12, "#9fc6cf", { ox: 1, depth: 21 });
    }
    const fullY = TB - val(c) * cupPx;
    tank.lineStyle(3, 0x63eed8, 1).lineBetween(TX - 4, fullY, TX + TW + 4, fullY);
    kit.text(
      TX + TW / 2,
      fullY - 12,
      api.t(L(`FULL: ${cs} cups`, `LLENO: ${cs} tazas`)),
      13,
      "#63eed8",
      { weight: "800", depth: 23 },
    );
    kit.text(TX + TW / 2, TB + 12, api.t(L("cups", "tazas")), 12, "#9fc6cf", { depth: 21 });
    tank.lineStyle(3, 0x9fc6cf, 0.8).strokeRoundedRect(TX, TT, TW, TB - TT, 12);

    function bump(which, d) {
      if (which === 0) whole = Phaser.Math.Clamp(whole + d, 0, M.SCOOP_MAX);
      else if (a > 1) part = Phaser.Math.Clamp(part + d, 0, a - 1);
      api.sfx.tick(Math.min(12, which === 0 ? whole : part * 2));
      level.clear();
      tankNote.setText("");
      redraw();
      api.refresh();
    }
    const rows = [
      [376, 0, L("Whole scoops", "Medidas completas")],
      ...(a > 1 ? [[432, 1, L("Parts of one more scoop", "Partes de otra medida")]] : []),
    ];
    const vals = [];
    rows.forEach(([y, which, label]) => {
      kit.text(330, y, api.t(label), 15, "#bfe9ef", {
        ox: 1,
        weight: "800",
        wrap: 280,
        align: "right",
      });
      kit.button(370, y, 42, 42, "−", () => bump(which, -1), { size: 22 });
      kit.button(486, y, 42, 42, "+", () => bump(which, 1), { size: 22 });
      vals[which] = kit.text(428, y, "", 22, "#ffffff", { weight: "900" });
    });
    const syncVals = () => {
      vals[0].setText(String(whole));
      if (vals[1]) vals[1].setText(`${part}/${a}`);
    };
    function redraw() {
      drawQueue();
      syncVals();
    }
    redraw();

    async function pour(v, slow) {
      level.clear();
      tankNote.setText("");
      const cups = mul(v, s);
      const n = Math.ceil(val(v));
      let cur = 0;
      for (let i = 0; i < n; i++) {
        cur = Math.min(val(cups), cur + val(s));
        const h = Math.min(cur, val(c) * 1.3) * cupPx;
        level.clear();
        level
          .fillStyle(kit.mix(C.water, C.feed, 0.35), 0.9)
          .fillRoundedRect(TX + 4, TB - h, TW - 8, Math.max(1, h - 4), 8);
        api.sfx.tick(Math.min(i, 14));
        await kit.wait(slow ? 380 : 60);
      }
      const over = cmp(cups, c) > 0;
      if (over) {
        level.fillStyle(C.bad, 0.85).fillRect(TX + TW, TT + 10, 10, TB - TT - 10);
        level.fillStyle(C.bad, 0.85).fillEllipse(TX + TW + 6, TB + 4, 50, 12);
        tankNote.setText(
          api.t(L("Overflow! Nutrients spill out", "¡Se desborda! Se derraman nutrientes")),
        );
      } else if (cmp(cups, c) < 0) {
        tankNote.setText(
          api.t(L("Not full: the mix is too thin", "No está lleno: la mezcla queda débil")),
        );
      } else {
        level.lineStyle(4, 0x63eed8, 1).strokeRoundedRect(TX + 4, fullY, TW - 8, TB - fullY - 4, 8);
      }
      return cups;
    }

    const hints = [
      L(
        `How many ${ss}-cup scoops are in ${cs} cups? Change ${cs} to an improper fraction, then Keep, Change, Flip.`,
        `¿Cuántas medidas de ${ss} de taza hay en ${cs} tazas? Cambia ${cs} a fracción impropia y luego Mantén, Cambia, Voltea.`,
      ),
      L(
        `${cs} cups = ${val(c) * b} parts of 1/${b} cup. One scoop is ${a} part${a === 1 ? "" : "s"}. How many groups of ${a} are in ${val(c) * b}?${a > 1 ? " Leftover parts go in the last scoop." : ""}`,
        `${cs} tazas = ${val(c) * b} partes de 1/${b} de taza. Una medida es ${a} parte${a === 1 ? "" : "s"}. ¿Cuántos grupos de ${a} hay en ${val(c) * b}?${a > 1 ? " Las partes que sobran van en la última medida." : ""}`,
      ),
    ];

    return {
      checkLabel: L("Pour into the tank", "Verter en el tanque"),
      actions: [
        {
          key: "ArrowUp",
          label: L("One more whole scoop", "Una medida completa más"),
          run: () => bump(0, 1),
        },
        {
          key: "ArrowDown",
          label: L("One less whole scoop", "Una medida completa menos"),
          run: () => bump(0, -1),
        },
        ...(a > 1
          ? [
              {
                key: "ArrowRight",
                label: L("One more part of a scoop", "Una parte más"),
                run: () => bump(1, 1),
              },
              {
                key: "ArrowLeft",
                label: L("One less part of a scoop", "Una parte menos"),
                run: () => bump(1, -1),
              },
            ]
          : []),
      ],
      status: () => L(`Scoops to pour: ${fmt(pourV())}`, `Medidas para verter: ${fmt(pourV())}`),
      hints,
      async check() {
        const v = pourV();
        if (v.n === 0)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Add some scoops first.", "Primero agrega medidas."),
          };
        const cups = await pour(v, false);
        if (eq(cups, c)) {
          kit.burst(TX + TW / 2, fullY, 0x63eed8, 30);
          return { ok: true };
        }
        const tag = M.classify(P.list, v);
        const fb = tag && divMiss(tag, SCOOP_NOUNS, cs, ss);
        if (fb) return { ok: false, misconception: tag, feedback: fb };
        return cmp(cups, c) > 0
          ? {
              ok: false,
              misconception: "tooMany",
              feedback: L(
                "Too many scoops: the tank overflows. Count the parts of 1/" + b + " cup again.",
                "Demasiadas medidas: el tanque se desborda. Cuenta otra vez las partes de 1/" +
                  b +
                  " de taza.",
              ),
            }
          : {
              ok: false,
              misconception: "tooFew",
              feedback: L(
                "Too few scoops: the tank is not full yet. Count the parts of 1/" +
                  b +
                  " cup again.",
                "Muy pocas medidas: el tanque todavía no está lleno. Cuenta otra vez las partes de 1/" +
                  b +
                  " de taza.",
              ),
            };
      },
      async demo() {
        whole = 0;
        part = 0;
        redraw();
        const w = floor(q);
        for (let i = 1; i <= w; i++) {
          whole = i;
          redraw();
          kit.floatText(TX + TW / 2, TB - val(mul(F(i), s)) * cupPx, `+${ss}`, "#ffd76a", 16);
          api.sfx.tick(i);
          await kit.wait(360);
        }
        part = Math.round((val(q) - w) * a);
        redraw();
        await kit.wait(400);
        await pour(q, true);
        await kit.wait(400);
      },
      explain: () =>
        L(
          `${cs} ÷ ${ss} = ${fmt(q)}: ${fmt(q)} scoops of ${ss} cup fill the ${cs}-cup tank.`,
          `${cs} ÷ ${ss} = ${fmt(q)}: ${fmt(q)} medidas de ${ss} de taza llenan el tanque de ${cs} tazas.`,
        ),
    };
  }

  /* ── rescue: two-step problem on the Deep Garden trench ────────────────── */
  const MAT_NOUNS = {
    sized: (y) => L(`${y}-m mats`, `tapetes de ${y} m`),
    howMany: L("how many", "cuántos"),
    items: L("mats", "tapetes"),
    one: L("one mat", "un tapete"),
    oneMore: L("one more mat", "un tapete más"),
    wholeItems: L("whole mats", "tapetes completos"),
    unit: L("m", "m"),
    unitWord: L("meters", "metros"),
    tooManyOne: L("One mat too many", "Un tapete de más"),
  };
  const TILE_NOUNS = {
    ...MAT_NOUNS,
    sized: (y) => L(`${y}-m tiles`, `losetas de ${y} m`),
    howMany: L("how many", "cuántas"),
    items: L("tiles", "losetas"),
    one: L("one tile", "una loseta"),
    oneMore: L("one more tile", "una loseta más"),
    wholeItems: L("whole tiles", "losetas completas"),
    tooManyOne: L("One tile too many", "Una loseta de más"),
  };
  function rescue(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const P = M.genRescue(rng, tier);
    const { kind, total, part, m, first, q } = P;
    const trench = kind === "trench";
    const Ts = fmt(total);
    const Ps = fmt(part);
    const ms = fmt(m);
    const fs = fmt(first);
    const N = trench ? MAT_NOUNS : TILE_NOUNS;
    api.setBrief(
      trench
        ? L(
            `The garden trench is ${Ts} m long. Divers already planted ${Ps} m. Each sea-grass mat is ${ms} m long. How many mats fill the rest of the trench?`,
            `La zanja del jardín mide ${Ts} m. Los buzos ya plantaron ${Ps} m. Cada tapete de pasto marino mide ${ms} m. ¿Cuántos tapetes llenan el resto de la zanja?`,
          )
        : L(
            `Two coral ledges, ${Ts} m and ${Ps} m long, sit end to end. Each sponge tile covers ${ms} m. How many tiles cover both ledges?`,
            `Dos repisas de coral de ${Ts} m y ${Ps} m están una tras otra. Cada loseta de esponja cubre ${ms} m. ¿Cuántas losetas cubren las dos repisas?`,
          ),
    );
    const lineLen = trench ? val(total) : val(total) + val(part);
    const X0 = 60;
    const px = 670 / (lineLen * 1.14);
    const start = trench ? val(part) : 0;
    const endX = X0 + lineLen * px;
    const RIGHT = 792;
    const MY = 184;
    const MH = 26;
    ruler(scene, kit, { x0: X0, px, y: 214, len: lineLen, tick: P.tick });
    const base = scene.add.graphics().setDepth(21);
    if (trench) {
      const pw = val(part) * px;
      base.fillStyle(0x2f6b48, 1).fillRect(X0, MY, pw, MH);
      for (let x = X0 + 5; x < X0 + pw - 2; x += 9)
        base.lineStyle(3, C.kelp, 1).lineBetween(x, MY + MH, x + 3, MY + 4);
      kit.text(
        X0 + pw / 2,
        MY - 12,
        api.t(L(`planted ${Ps} m`, `plantado ${Ps} m`)),
        13,
        "#9ff0b8",
        { weight: "800", depth: 23 },
      );
      base.lineStyle(2, 0x9fc6cf, 0.6).strokeRect(X0 + pw, MY, endX - X0 - pw, MH);
    } else {
      const ax = X0 + val(total) * px;
      base.fillStyle(0x3a7d8c, 0.9).fillRect(X0, 206, ax - X0, 8);
      base.fillStyle(0x8a6fd1, 0.9).fillRect(ax, 206, endX - ax, 8);
      kit.text(
        (X0 + ax) / 2,
        152,
        api.t(L(`ledge A: ${Ts} m`, `repisa A: ${Ts} m`)),
        13,
        "#9fe3ef",
        { weight: "800", depth: 23 },
      );
      kit.text(
        (ax + endX) / 2,
        152,
        api.t(L(`ledge B: ${Ps} m`, `repisa B: ${Ps} m`)),
        13,
        "#cdb9ff",
        { weight: "800", depth: 23 },
      );
    }
    const bracket = scene.add.graphics().setDepth(23);
    const mats = scene.add.graphics().setDepth(22);
    const note = kit.text(400, 288, "", 15, "#ffd2c6", { weight: "800", depth: 23 });
    const bLabel = kit.text(400, 170, "", 13, "#ffd76a", { weight: "800", depth: 24 });
    const e1 = makeEntry(
      scene,
      api,
      200,
      366,
      trench
        ? L("Step 1: meters left", "Paso 1: metros que faltan")
        : L("Step 1: total meters", "Paso 1: metros en total"),
    );
    const e2 = makeEntry(
      scene,
      api,
      560,
      366,
      trench ? L("Step 2: mats", "Paso 2: tapetes") : L("Step 2: tiles", "Paso 2: losetas"),
    );
    const grp = entryGroup(scene, api, [e1, e2]);
    keypadFor(api, grp);
    grp.onChange = () => {
      bracket.clear();
      mats.setAlpha(0.35);
      note.setText("");
      bLabel.setText("");
    };

    function showStep1(v) {
      bracket.clear();
      const x1 = Math.min(RIGHT, X0 + (start + val(v)) * px);
      const xs = X0 + start * px;
      const ok = eq(v, first);
      bracket.lineStyle(3, ok ? 0x63eed8 : C.gold, 1);
      bracket.lineBetween(xs, MY - 4, x1, MY - 4);
      bracket.lineBetween(xs, MY - 10, xs, MY + 2);
      bracket.lineBetween(x1, MY - 10, x1, MY + 2);
      bLabel
        .setText(api.t(L(`step 1: ${fmt(v)} m`, `paso 1: ${fmt(v)} m`)))
        .setX(Math.max(110, Math.min(700, (xs + x1) / 2)));
      if (!ok) {
        bracket.lineStyle(3, C.bad, 1).lineBetween(endX, MY - 14, endX, MY + MH + 6);
      }
    }
    async function lay(v, slow) {
      mats.clear().setAlpha(1);
      const ticks = Math.round(val(m) * P.tick);
      const w0 = val(m) * px;
      const whole = floor(v);
      const n = Math.min(50, Math.ceil(val(v)));
      for (let i = 0; i < n; i++) {
        const sx = X0 + (start + i * val(m)) * px;
        if (sx > RIGHT) break;
        const frac = i < whole ? 1 : val(v) - whole;
        const w = Math.min(w0 * frac, RIGHT - sx);
        const over = sx + w > endX + 0.5;
        drawFrame(
          mats,
          sx,
          MY,
          w,
          MH,
          over ? C.bad : trench ? (i % 2 ? 0x7fe0a0 : 0x5fd38a) : i % 2 ? 0xf2b36b : 0xffc98a,
          ticks,
          px / P.tick,
        );
        if (slow) {
          api.sfx.tick(Math.min(i, 14));
          await kit.wait(260);
        }
      }
      return mul(v, m);
    }

    const recip = `${m.d}/${m.n}`;
    const den = M.lcm(total.d, part.d);
    const hints = [
      trench
        ? L(
            `Two steps. Step 1: subtract to find the meters left: ${Ts} − ${Ps}. Step 2: divide the meters left by ${ms}.`,
            `Dos pasos. Paso 1: resta para hallar los metros que faltan: ${Ts} − ${Ps}. Paso 2: divide los metros que faltan entre ${ms}.`,
          )
        : L(
            `Two steps. Step 1: add the two ledges: ${Ts} + ${Ps}. Step 2: divide the total by ${ms}.`,
            `Dos pasos. Paso 1: suma las dos repisas: ${Ts} + ${Ps}. Paso 2: divide el total entre ${ms}.`,
          ),
      L(
        `Step 1: write ${Ts} and ${Ps} as fractions with denominator ${den}, then ${trench ? "subtract" : "add"}. Step 2: Keep, Change, Flip: (your step 1 answer) × ${recip}.`,
        `Paso 1: escribe ${Ts} y ${Ps} como fracciones con denominador ${den}, luego ${trench ? "resta" : "suma"}. Paso 2: Mantén, Cambia, Voltea: (tu respuesta del paso 1) × ${recip}.`,
      ),
    ];

    return {
      checkLabel: trench
        ? L("Lay the mats", "Colocar los tapetes")
        : L("Lay the tiles", "Colocar las losetas"),
      actions: grp.actions,
      status: () =>
        L(
          `Step 1: ${e1.text()} · Step 2: ${e2.text()}`,
          `Paso 1: ${e1.text()} · Paso 2: ${e2.text()}`,
        ),
      hints,
      async check() {
        const r1 = e1.read();
        const r2 = e2.read();
        if (!r1.v) return { ok: false, incomplete: true, feedback: entryMsg(r1) };
        if (!r2.v) return { ok: false, incomplete: true, feedback: entryMsg(r2) };
        showStep1(r1.v);
        mats.clear();
        if (!eq(r1.v, first)) {
          await kit.wait(150);
          const flipped = eq(r1.v, P.wrongFirst);
          const fb = trench
            ? flipped
              ? L(
                  `Step 1: you added. Part of the trench is already planted, so fewer meters are left: subtract ${Ps} from ${Ts}.`,
                  `Paso 1: sumaste. Una parte de la zanja ya está plantada, así que faltan menos metros: resta ${Ps} de ${Ts}.`,
                )
              : L(
                  "Step 1 is off: your bracket does not end at the end of the trench. Check the subtraction with a common denominator.",
                  "El paso 1 no es correcto: tu marca no termina al final de la zanja. Revisa la resta con un denominador común.",
                )
            : flipped
              ? L(
                  "Step 1: you subtracted. The ledges sit end to end, so put their lengths together: add.",
                  "Paso 1: restaste. Las repisas están una tras otra, así que junta sus longitudes: suma.",
                )
              : L(
                  "Step 1 is off: your bracket does not reach the end of ledge B. Check the addition with a common denominator.",
                  "El paso 1 no es correcto: tu marca no llega al final de la repisa B. Revisa la suma con un denominador común.",
                );
          return { ok: false, misconception: "firstStep", feedback: fb };
        }
        const len = await lay(r2.v, false);
        if (eq(len, first)) {
          kit.burst((X0 + endX) / 2, MY + 10, C.kelp, 30);
          return { ok: true };
        }
        note.setText(
          api.t(
            cmp(len, first) < 0
              ? L("Gap: part of the seabed is still bare", "Hueco: parte del fondo sigue vacía")
              : L("Too long: past the end", "Demasiado largo: pasa del final"),
          ),
        );
        const tag = M.classify(P.list, r2.v);
        if (tag === "skippedStep")
          return {
            ok: false,
            misconception: tag,
            feedback: trench
              ? L(
                  `You divided the whole trench, ${Ts} m. The planted part needs no mats: divide only the meters left.`,
                  `Dividiste toda la zanja, ${Ts} m. La parte plantada no necesita tapetes: divide solo los metros que faltan.`,
                )
              : L(
                  `You divided only ledge A, ${Ts} m. Divide the total of both ledges.`,
                  `Dividiste solo la repisa A, ${Ts} m. Divide el total de las dos repisas.`,
                ),
          };
        const fb = tag && divMiss(tag, N, fs, ms);
        if (fb) return { ok: false, misconception: tag, feedback: fb };
        return {
          ok: false,
          misconception: cmp(len, first) < 0 ? "tooFew" : "tooMany",
          feedback:
            cmp(len, first) < 0
              ? L(
                  "Step 1 is right, but step 2 leaves a gap. Divide again.",
                  "El paso 1 está bien, pero el paso 2 deja un hueco. Divide otra vez.",
                )
              : L(
                  "Step 1 is right, but step 2 runs past the end. Divide again.",
                  "El paso 1 está bien, pero el paso 2 pasa del final. Divide otra vez.",
                ),
        };
      },
      async demo() {
        e1.set(M.entryFor(first));
        e2.set({ w: "", n: "", d: "" });
        grp.draw();
        showStep1(first);
        kit.floatText(
          X0 + (start + val(first) / 2) * px,
          MY - 30,
          trench ? `${Ts} − ${Ps}` : `${Ts} + ${Ps}`,
          "#ffd76a",
          18,
        );
        await kit.wait(1100);
        await lay(q, true);
        e2.set(M.entryFor(q));
        grp.draw();
        api.refresh();
        await kit.wait(600);
      },
      explain: () =>
        trench
          ? L(
              `${Ts} − ${Ps} = ${fs} m left. ${fs} ÷ ${ms} = ${fmt(q)} mats.`,
              `${Ts} − ${Ps} = ${fs} m que faltan. ${fs} ÷ ${ms} = ${fmt(q)} tapetes.`,
            )
          : L(
              `${Ts} + ${Ps} = ${fs} m in all. ${fs} ÷ ${ms} = ${fmt(q)} tiles.`,
              `${Ts} + ${Ps} = ${fs} m en total. ${fs} ÷ ${ms} = ${fmt(q)} losetas.`,
            ),
    };
  }

  window.FF_MISSIONS = Object.assign(window.FF_MISSIONS, { scoops, rescue });
})();
