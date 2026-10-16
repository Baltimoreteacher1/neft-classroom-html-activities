/* Cloudline Courier — exact decimal math, shared widgets and the cargo manifest builder.
 *
 * Every mission is a piece of the sky-courier network that only works when the
 * student's decimal arithmetic is right:
 *   manifest  a place-value cargo ledger; slide rows until the decimal points line up,
 *             then write the total (or the room left). A wrong total makes the ship list.
 * The fuel route lives in expedition-fuel.js; the long-division sorter and the crate
 * hold live in expedition-cargo.js.
 *
 * All math is exact: decimals are BigInt digits with a scale, never floats. The pure
 * generators and judges are exported on window.DD_MISSIONS.math so they can be tested
 * without Phaser.
 */
(function () {
  "use strict";
  const L = (en, es) => ({ en, es });
  const W = 820;

  /* ── Exact decimals: {n: BigInt digits, s: decimal places} ────────────── */
  function D(str) {
    const s = String(str).trim();
    if (!/^\d*\.?\d*$/.test(s) || !/\d/.test(s)) return null;
    const [i, f = ""] = s.split(".");
    return { n: BigInt((i || "0") + f), s: f.length };
  }
  const p10 = (k) => 10n ** BigInt(k);
  function lift(a, s) {
    return a.n * p10(s - a.s);
  }
  function add(a, b) {
    const s = Math.max(a.s, b.s);
    return { n: lift(a, s) + lift(b, s), s };
  }
  function sub(a, b) {
    const s = Math.max(a.s, b.s);
    return { n: lift(a, s) - lift(b, s), s };
  }
  const mul = (a, b) => ({ n: a.n * b.n, s: a.s + b.s });
  /** Multiply by 10^k (k may be negative). */
  function shift(a, k) {
    return k >= 0
      ? a.s >= k
        ? { n: a.n, s: a.s - k }
        : { n: a.n * p10(k - a.s), s: 0 }
      : { n: a.n, s: a.s - k };
  }
  function cmp(a, b) {
    const s = Math.max(a.s, b.s);
    const x = lift(a, s);
    const y = lift(b, s);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const eq = (a, b) => !!a && !!b && cmp(a, b) === 0;
  const abs = (a) => ({ n: a.n < 0n ? -a.n : a.n, s: a.s });
  /** Canonical text: no leading zeros, no trailing decimal zeros. */
  function fmt(a) {
    const neg = a.n < 0n;
    let digits = (neg ? -a.n : a.n).toString().padStart(a.s + 1, "0");
    let out = a.s ? digits.slice(0, -a.s) + "." + digits.slice(-a.s) : digits;
    if (out.includes(".")) out = out.replace(/0+$/, "").replace(/\.$/, "");
    digits = out;
    return (neg ? "−" : "") + digits;
  }
  /** Significant digits only (point, leading and trailing zeros removed). */
  const sig = (a) => abs(a).n.toString().replace(/0+$/, "") || "";
  const decPlaces = (str) => (String(str).split(".")[1] || "").length;
  const num = (a) => Number(fmt(a).replace("−", "-"));
  /** Keep only digits and one decimal point, within maxInt/maxDec places. */
  function editNumber(str, key, maxInt = 4, maxDec = 4) {
    if (key === "Backspace") return str.slice(0, -1);
    if (key === ".") return str.includes(".") ? null : (str || "0") + ".";
    if (!/^[0-9]$/.test(key)) return null;
    const [i, f] = str.split(".");
    if (f !== undefined) return f.length < maxDec ? str + key : null;
    if (i === "0") return key;
    return i.length < maxInt ? str + key : null;
  }

  /* ── Generators and judges (pure; tested in Node) ─────────────────────── */
  const decimalOf = (r, lo, hi, places) => {
    let v;
    do v = r.int(lo, hi);
    while (v % 10 === 0);
    return fmt({ n: BigInt(v), s: places });
  };

  /** manifest: rows of decimals with different place counts, so alignment matters. */
  function genManifest(r, tier, variant) {
    for (let guard = 0; guard < 400; guard++) {
      let rows;
      if (variant === "sub") {
        rows =
          tier >= 2
            ? [decimalOf(r, 150, 690, 1), decimalOf(r, 1001, 9989, 3)]
            : [String(r.int(6, 30)), decimalOf(r, 101, 989, 2)];
        if (cmp(D(rows[0]), D(rows[1])) <= 0) continue;
      } else if (tier >= 2) {
        rows = r.shuffle([
          decimalOf(r, 101, 399, 1),
          decimalOf(r, 11, 899, 2),
          decimalOf(r, 1001, 9999, 3),
        ]);
      } else {
        rows = r.shuffle([decimalOf(r, 101, 499, 1), decimalOf(r, 11, 999, 2)]);
      }
      const vals = rows.map(D);
      const total =
        variant === "sub" ? sub(vals[0], vals[1]) : vals.reduce((s, v) => add(s, v), D("0"));
      if (cmp(total, D("100")) >= 0 || total.n <= 0n) continue;
      if (rows.some((x) => x.split(".")[0].length > 2)) continue;
      return {
        variant: variant || "add",
        rows,
        truth: fmt(total),
        D: Math.max(...rows.map(decPlaces)),
      };
    }
    throw new Error("genManifest exhausted");
  }
  /** Column digits of a row on a 2-integer, 3-decimal grid (aligned). */
  function columns(str) {
    const [i, f = ""] = str.split(".");
    return (i.padStart(2, "0") + f.padEnd(3, "0")).split("").map(Number);
  }
  function fromColumns(cols) {
    return D(cols.slice(0, 2).join("") + "." + cols.slice(2).join(""));
  }
  function judgeManifest(p, ans) {
    const s = D(ans);
    if (!s) return { ok: false, incomplete: true };
    const vals = p.rows.map(D);
    const sign = (i) => (p.variant === "sub" && i > 0 ? -1n : 1n);
    if (eq(s, D(p.truth))) return { ok: true };
    // Misaligned: the student's total matches the rows read with shifted decimal points.
    const ks = [-3, -2, -1, 0, 1, 2, 3];
    const combos =
      vals.length === 2
        ? ks.flatMap((a) => ks.map((b) => [a, b]))
        : ks.flatMap((a) => ks.flatMap((b) => ks.map((c) => [a, b, c])));
    for (const k of combos) {
      if (k.every((x) => x === 0)) continue;
      const v = vals.reduce((acc, x, i) => {
        const t = shift(x, k[i]);
        return add(acc, { n: t.n * sign(i), s: t.s });
      }, D("0"));
      if (eq(s, abs(v))) return { ok: false, tag: "misaligned" };
    }
    const cols = vals.map((_, i) => columns(p.rows[i]));
    if (p.variant === "sub") {
      const [a, b] = p.rows;
      const noBorrow = fromColumns(cols[0].map((d, i) => Math.abs(d - cols[1][i])));
      if (eq(s, noBorrow)) return { ok: false, tag: "regroup" };
      // "Bring down": subtract the whole numbers and copy the bottom decimals.
      const wa = D(a.split(".")[0]);
      const wb = D(b.split(".")[0]);
      const fb = D("0." + (b.split(".")[1] || "0"));
      if (cmp(wa, wb) >= 0 && eq(s, add(sub(wa, wb), fb)) && decPlaces(a) < decPlaces(b))
        return { ok: false, tag: "annexZero" };
    } else {
      const noCarry = fromColumns(cols[0].map((_, i) => cols.reduce((t, c) => t + c[i], 0) % 10));
      if (eq(s, noCarry)) return { ok: false, tag: "regroup" };
    }
    return { ok: false, tag: "addSub", high: cmp(s, D(p.truth)) > 0 };
  }

  /** fuel: rate × distance with decimal factors. */
  function genFuel(r, tier) {
    let rate;
    let dist;
    if (tier <= 1) {
      rate = decimalOf(r, 2, 48, 1);
      dist = String(r.int(3, 12));
    } else if (tier === 2) {
      rate = decimalOf(r, 12, 48, 1);
      dist = r.next() < 0.5 ? decimalOf(r, 2, 9, 1) : decimalOf(r, 11, 39, 1);
    } else {
      rate = decimalOf(r, 105, 395, 2);
      dist = r.next() < 0.5 ? decimalOf(r, 2, 9, 1) : decimalOf(r, 11, 49, 1);
    }
    return { rate, dist, truth: fmt(mul(D(rate), D(dist))) };
  }
  function judgeFuel(p, ans) {
    const s = D(ans);
    if (!s) return { ok: false, incomplete: true };
    const t = D(p.truth);
    const a = D(p.rate);
    const b = D(p.dist);
    if (eq(s, t)) return { ok: true };
    if (sig(s) === sig(t)) return { ok: false, tag: "pointPlace", high: cmp(s, t) > 0 };
    if (eq(s, add(a, b))) return { ok: false, tag: "added", high: cmp(s, t) > 0 };
    const big = cmp(a, b) > 0 ? a : b;
    const small = big === a ? b : a;
    if (cmp(small, D("1")) < 0 && cmp(s, big) > 0)
      return { ok: false, tag: "biggerProduct", high: true };
    return { ok: false, tag: "multDec", high: cmp(s, t) > 0 };
  }

  /* ── Shared Phaser widgets ────────────────────────────────────────────── */
  const SHIP = 0x75e0ff;
  const PANEL = 0x081a28;
  const INK = "#eaf6ff";
  const GOLD = "#ffd76a";
  /** A small courier airship (container; rotate/move it as a whole). */
  function airship(scene, x, y, scale = 1, tint = SHIP, depth = 22) {
    const c = scene.add.container(x, y).setDepth(depth);
    const g = scene.add.graphics();
    const dark = Phaser.Display.Color.IntegerToColor(tint).darken(35).color;
    g.fillStyle(0x000000, 0.22).fillEllipse(6, 10, 140, 50);
    g.fillStyle(dark, 1).fillTriangle(-58, -6, -86, -30, -78, 0);
    g.fillTriangle(-58, 6, -86, 30, -78, 0);
    g.fillStyle(tint, 1).fillEllipse(0, 0, 140, 52);
    g.fillStyle(0xffffff, 0.28).fillEllipse(-6, -13, 96, 14);
    g.lineStyle(2, dark, 0.7);
    [-36, 0, 36].forEach((bx) => {
      const hh = 26 * Math.sqrt(1 - (bx / 70) ** 2);
      g.lineBetween(bx, -hh + 2, bx, hh - 2);
    });
    g.lineStyle(2, 0x2a3a44, 1).lineBetween(-18, 24, -22, 34).lineBetween(18, 24, 22, 34);
    g.fillStyle(0x3b2b1e, 1).fillRoundedRect(-30, 32, 60, 16, 5);
    g.fillStyle(0xffd76a, 1);
    [-18, -4, 10].forEach((wx) => g.fillRect(wx, 36, 8, 6));
    g.fillStyle(0xcfd8de, 1).fillEllipse(-36, 40, 6, 18);
    c.add(g);
    c.setScale(scale);
    return c;
  }
  /** Two-row touch keypad (digits, point, erase) in the lower-right corner. */
  function pad(scene, kit, onKey, withDot = true, x = 524, y = 410) {
    kit.keypad(x, y, onKey, { keys: ["1", "2", "3", "4", "5", "6"], size: 40, gap: 6 });
    kit.keypad(x, y + 46, onKey, {
      keys: ["7", "8", "9", "0", withDot ? "." : "", "⌫"].filter(Boolean),
      size: 40,
      gap: 6,
    });
  }
  /** Typed-number box. */
  function entry(scene, kit, x, y, w, unit, depth = 24) {
    const g = scene.add.graphics().setDepth(depth);
    const txt = kit.text(x + w / 2, y + 26, "", 30, "#ffffff", { weight: "900", depth: depth + 1 });
    const u = kit.text(x + w - 12, y + 30, unit || "", 15, "#9fd6ff", {
      ox: 1,
      depth: depth + 1,
      weight: "800",
    });
    return {
      set(str, state = "idle") {
        g.clear();
        g.fillStyle(0x0c2232, 1).fillRoundedRect(x, y, w, 52, 12);
        const col = state === "bad" ? 0xff8a5c : state === "good" ? 0x7ee36d : 0xffd76a;
        g.lineStyle(3, col, 1).strokeRoundedRect(x, y, w, 52, 12);
        txt.setText(str === "" ? "▮" : str);
        txt.setColor(str === "" ? "#56707f" : "#ffffff");
      },
      unit: u,
    };
  }
  /** Feed keyboard digits/point to fn, leaving Backspace to the action deck (no double erase). */
  function typeDigits(kit, fn) {
    kit.onType((k) => {
      if (k !== "Backspace" && k !== "-") fn(k);
    });
  }
  const eraseAction = (fn) => ({
    key: "Backspace",
    label: L("Erase digit", "Borrar dígito"),
    run: fn,
  });

  /* ── manifest: line up the decimal points, then total the cargo ───────── */
  const PLACE = {
    en: ["tens", "ones", "tenths", "hundredths", "thousandths"],
    es: ["decenas", "unidades", "décimos", "centésimos", "milésimos"],
  };
  function manifest(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "add";
    const p = genManifest(rng, api.tier, variant);
    const n = p.rows.length;
    const COLS = 5;
    const P = 2; // grid point sits after the ones column
    const CW = 50;
    const PG = 16;
    const GX = 70;
    const ROW0 = 214;
    const RH = 44;
    const ansY = ROW0 + n * RH + 22;
    const colX = (c) => GX + c * CW + (c >= P ? PG : 0) + CW / 2;
    const meta = p.rows.map((s) => ({
      int: s.split(".")[0],
      dec: s.split(".")[1] || "",
    }));
    // Rows start flush right, the way a careless manifest printer stacks them.
    const k = meta.map((m) => COLS - m.dec.length);
    const kMin = meta.map((m) => m.int.length);
    const kMax = meta.map((m) => COLS - m.dec.length);
    let sel = 0;
    let ans = "";
    let tilt = 0;
    const aligned = () => k.every((x) => x === P);
    const sub = variant === "sub";
    api.setBrief(
      sub
        ? L(
            `The airship may carry ${p.rows[0]} tons. It already holds ${p.rows[1]} tons. Line up the manifest and write how many more tons fit.`,
            `La aeronave puede llevar ${p.rows[0]} toneladas. Ya lleva ${p.rows[1]} toneladas. Alinea el manifiesto y escribe cuántas toneladas más caben.`,
          )
        : L(
            `${n} pallets go aboard: ${p.rows.join(" t, ")} t. Line up the manifest and write the total load so the ballast can balance it.`,
            `Suben ${n} palés: ${p.rows.join(" t, ")} t. Alinea el manifiesto y escribe la carga total para equilibrar el lastre.`,
          ),
    );
    kit.panel(24, 140, 456, 334, { fill: PANEL, alpha: 0.9 });
    kit.text(40, 158, api.t(L("CARGO MANIFEST", "MANIFIESTO DE CARGA")), 14, GOLD, {
      ox: 0,
      weight: "800",
    });
    ["10", "1", "0.1", "0.01", "0.001"].forEach((h, c) =>
      kit.text(colX(c), 186, h, 13, "#8fb7cc", { weight: "800" }),
    );
    const grid = scene.add.graphics().setDepth(20);
    const rowsG = scene.add.graphics().setDepth(21);
    const pool = [];
    const glyph = (x, y, s, color, size = 28) => {
      let t = pool.find((o) => !o.visible);
      if (!t) {
        t = kit.text(0, 0, "", size, color, { weight: "900", depth: 23 });
        pool.push(t);
      }
      return t.setVisible(true).setPosition(x, y).setText(s).setColor(color).setFontSize(size);
    };
    // Row selection, drag and ◀ ▶ nudges.
    p.rows.forEach((_, i) => {
      const y = ROW0 + i * RH;
      const z = scene.add.zone(GX + (COLS * CW + PG) / 2, y, COLS * CW + PG, RH - 4).setDepth(24);
      z.setInteractive({ useHandCursor: true });
      let startX = 0;
      let startK = 0;
      z.on("pointerdown", (pt) => {
        sel = i;
        startX = pt.x;
        startK = k[i];
        draw();
        api.refresh();
      });
      z.on("pointermove", (pt) => {
        if (!pt.isDown || sel !== i) return;
        const nk = Phaser.Math.Clamp(startK + Math.round((pt.x - startX) / CW), kMin[i], kMax[i]);
        if (nk !== k[i]) slide(i, nk - k[i]);
      });
      kit.button(GX + COLS * CW + PG + 34, y, 38, 34, "◀", () => slide(i, -1), {
        size: 15,
        fill: 0x2f4b5c,
        color: INK,
      });
      kit.button(GX + COLS * CW + PG + 78, y, 38, 34, "▶", () => slide(i, 1), {
        size: 15,
        fill: 0x2f4b5c,
        color: INK,
      });
    });
    function slide(i, d) {
      sel = i;
      const nk = Phaser.Math.Clamp(k[i] + d, kMin[i], kMax[i]);
      if (nk === k[i]) return;
      k[i] = nk;
      api.sfx.tick(k[i] * 2);
      if (aligned()) {
        api.sfx.select();
        kit.floatText(colX(P) - CW / 2 - PG / 2, ROW0 - 18, "✓", "#7ee36d", 20);
      }
      draw();
      api.refresh();
    }
    function draw() {
      pool.forEach((t) => t.setVisible(false));
      grid.clear();
      rowsG.clear();
      const ok = aligned();
      grid.fillStyle(ok ? 0x7ee36d : 0x5e92b3, ok ? 0.16 : 0.08);
      grid.fillRect(colX(P) - CW / 2 - PG, 196, PG, ansY - 196 + 22);
      for (let c = 0; c < COLS; c++)
        grid
          .lineStyle(1, 0x5e92b3, 0.25)
          .lineBetween(colX(c) + CW / 2, 196, colX(c) + CW / 2, ansY + 22);
      meta.forEach((m, i) => {
        const y = ROW0 + i * RH;
        const active = sel === i;
        rowsG
          .fillStyle(active ? 0x15344a : 0x0c2232, 1)
          .fillRoundedRect(GX - 6, y - 19, COLS * CW + PG + 12, 38, 9);
        if (active)
          rowsG
            .lineStyle(3, 0xffd76a, 1)
            .strokeRoundedRect(GX - 6, y - 19, COLS * CW + PG + 12, 38, 9);
        const ints = m.int.split("");
        ints.forEach((d, j) => glyph(colX(k[i] - ints.length + j), y, d, INK));
        m.dec.split("").forEach((d, j) => glyph(colX(k[i] + j), y, d, INK));
        // Ghost zeros once the points line up: empty places are worth 0.
        if (ok && api.tier < 3)
          for (let c = P + m.dec.length; c < COLS && c < P + p.D; c++)
            glyph(colX(c), y, "0", "#5f8296");
        if (m.dec || ok) {
          const px = k[i] === P ? colX(P) - CW / 2 - PG / 2 : (colX(k[i] - 1) + colX(k[i])) / 2;
          rowsG.fillStyle(m.dec ? 0xffd76a : 0x5f8296, 1).fillCircle(px, y + 10, 4);
        }
        if (i > 0) glyph(GX - 26, y, sub ? "−" : "+", GOLD, 26);
      });
      const ly = ansY - 24;
      rowsG.lineStyle(3, 0xeaf6ff, 0.8).lineBetween(GX - 30, ly, GX + COLS * CW + PG + 6, ly);
      rowsG.fillStyle(0x0c2232, 1).fillRoundedRect(GX - 6, ansY - 21, COLS * CW + PG + 12, 42, 9);
      rowsG
        .lineStyle(3, 0x75e0ff, 0.9)
        .strokeRoundedRect(GX - 6, ansY - 21, COLS * CW + PG + 12, 42, 9);
      const [ai, af] = ans.split(".");
      const aInts = (ai || "").split("").filter(Boolean);
      aInts.forEach((d, j) => glyph(colX(P - aInts.length + j), ansY, d, GOLD));
      (af || "").split("").forEach((d, j) => glyph(colX(P + j), ansY, d, GOLD));
      if (ans.includes("."))
        rowsG.fillStyle(0xffd76a, 1).fillCircle(colX(P) - CW / 2 - PG / 2, ansY + 10, 4);
      if (!ans) glyph(colX(P - 1), ansY, "▮", "#56707f");
    }
    // The airship and its ballast.
    kit.panel(496, 140, 300, 236, { fill: PANEL, alpha: 0.55 });
    kit.text(
      646,
      160,
      api.t(sub ? L("ROOM LEFT", "ESPACIO LIBRE") : L("TOTAL LOAD", "CARGA TOTAL")),
      14,
      GOLD,
      {
        weight: "800",
      },
    );
    const dock = scene.add.graphics().setDepth(21);
    dock.fillStyle(0x3d4b56, 1).fillRect(520, 340, 252, 10);
    dock.fillStyle(0x2a343c, 1).fillRect(540, 350, 14, 20).fillRect(738, 350, 14, 20);
    const ship = airship(scene, 646, 252, 0.95);
    const crates = scene.add.graphics().setDepth(21);
    crates.fillStyle(0x9a6b3c, 1);
    for (let i = 0; i < n + 1; i++) crates.fillRect(585 + i * 34, 318, 28, 22);
    const gaugeTxt = kit.text(646, 192, "", 15, INK, { weight: "800", depth: 23 });
    function setTilt(deg) {
      tilt = deg;
      kit.tween({ targets: ship, angle: deg, duration: 420, ease: "Sine.easeInOut" });
    }
    function type(key) {
      const next = editNumber(ans, key, 2, 3);
      if (next == null) return;
      ans = next;
      api.sfx.tap();
      if (tilt) setTilt(0);
      draw();
      api.refresh();
    }
    typeDigits(kit, type);
    pad(scene, kit, type, true);
    draw();
    async function liftOff() {
      gaugeTxt.setText(`${ans} t ✓`).setColor("#7ee36d");
      crates.clear();
      setTilt(0);
      kit.tween({ targets: ship, y: 232, duration: 600, ease: "Sine.easeOut" });
      api.sfx.whoosh();
      await kit.wait(600);
      kit.burst(646, 250, 0x75e0ff, 24);
    }
    const unit = L("tons", "toneladas");
    const placeName = (c) => api.t({ en: PLACE.en[c], es: PLACE.es[c] });
    const padded = p.rows.map((s) => {
      const [i, f = ""] = s.split(".");
      return i + "." + f.padEnd(p.D, "0");
    });
    return {
      checkLabel: sub ? L("Load the cargo", "Cargar") : L("Set the ballast", "Ajustar lastre"),
      get actions() {
        return [
          {
            key: "ArrowLeft",
            label: L("Slide row left", "Mover fila a la izquierda"),
            run: () => slide(sel, -1),
          },
          {
            key: "ArrowRight",
            label: L("Slide row right", "Mover fila a la derecha"),
            run: () => slide(sel, 1),
          },
          {
            key: "ArrowUp",
            label: L("Row above", "Fila de arriba"),
            run: () => {
              sel = (sel + n - 1) % n;
              draw();
              api.refresh();
            },
          },
          {
            key: "ArrowDown",
            label: L("Row below", "Fila de abajo"),
            run: () => {
              sel = (sel + 1) % n;
              draw();
              api.refresh();
            },
          },
          eraseAction(() => type("Backspace")),
        ];
      },
      status: () =>
        L(
          `Points lined up: ${aligned() ? "yes" : "no"} · Your answer: ${ans || "—"} ${unit.en}`,
          `Puntos alineados: ${aligned() ? "sí" : "no"} · Tu respuesta: ${ans || "—"} ${unit.es}`,
        ),
      hints: sub
        ? [
            L(
              "Slide the rows until both decimal points sit in one column. If the top number has fewer decimal places, write zeros at its end.",
              "Mueve las filas hasta que los dos puntos decimales estén en la misma columna. Si el número de arriba tiene menos decimales, escribe ceros al final.",
            ),
            L(
              `${p.rows[0]} is the same as ${padded[0]}. Subtract the ${placeName(1 + p.D)} first. When the top digit is smaller, regroup from the next place.`,
              `${p.rows[0]} es lo mismo que ${padded[0]}. Resta primero los ${placeName(1 + p.D)}. Si el dígito de arriba es menor, reagrupa del lugar siguiente.`,
            ),
          ]
        : [
            L(
              "Slide the rows until every decimal point sits in one column. Then add place by place, starting at the right.",
              "Mueve las filas hasta que todos los puntos decimales estén en la misma columna. Luego suma lugar por lugar, empezando por la derecha.",
            ),
            L(
              `Write each number with ${p.D} decimal places: ${padded.join(", ")}. Add the ${placeName(1 + p.D)} first and carry when a column makes 10 or more.`,
              `Escribe cada número con ${p.D} decimales: ${padded.join(", ")}. Suma primero los ${placeName(1 + p.D)} y lleva cuando una columna llegue a 10 o más.`,
            ),
          ],
      async check() {
        if (!ans || ans === "0.") {
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Write your answer in the bottom row of the manifest first.",
              "Primero escribe tu respuesta en la fila de abajo del manifiesto.",
            ),
          };
        }
        const res = judgeManifest(p, ans);
        if (res.ok) {
          while (!aligned()) {
            const i = k.findIndex((x) => x !== P);
            k[i] += k[i] < P ? 1 : -1;
            draw();
            await kit.wait(120);
          }
          await liftOff();
          return { ok: true };
        }
        const high = cmp(D(ans), D(p.truth)) > 0;
        setTilt(high ? -16 : 16);
        gaugeTxt.setText(`${ans} t ?`).setColor("#ffb35c");
        kit.shake(0.004, 200);
        const world = high
          ? sub
            ? L(
                "Too much cargo goes aboard and the ship lists. ",
                "Sube demasiada carga y la nave se inclina. ",
              )
            : L(
                "The ballast is set too heavy and the nose tips up. ",
                "El lastre queda muy pesado y la proa se levanta. ",
              )
          : sub
            ? L(
                "Room is wasted and the ship flies lopsided. ",
                "Sobra espacio y la nave vuela torcida. ",
              )
            : L(
                "The ballast is set too light and the nose dips. ",
                "El lastre queda muy ligero y la proa se hunde. ",
              );
        const why = {
          misaligned: L(
            "The decimal points were not lined up. Tenths go under tenths, hundredths under hundredths.",
            "Los puntos decimales no estaban alineados. Décimos debajo de décimos, centésimos debajo de centésimos.",
          ),
          regroup: sub
            ? L(
                "In one place you took the smaller digit from the bigger one. When the top digit is smaller, regroup first.",
                "En un lugar restaste el dígito menor del mayor. Si el dígito de arriba es menor, reagrupa primero.",
              )
            : L(
                "A place added up to 10 or more, but nothing was carried to the next place.",
                "Un lugar sumó 10 o más, pero no llevaste nada al lugar siguiente.",
              ),
          annexZero: L(
            `The empty places in ${p.rows[0]} are zeros. Write the zeros and subtract those places too.`,
            `Los lugares vacíos de ${p.rows[0]} son ceros. Escribe los ceros y resta esos lugares también.`,
          ),
          addSub: aligned()
            ? L(
                "Check each place again, from right to left.",
                "Revisa cada lugar otra vez, de derecha a izquierda.",
              )
            : L(
                "Line up the decimal points first, then work place by place.",
                "Primero alinea los puntos decimales y luego trabaja lugar por lugar.",
              ),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(world.en + why.en, world.es + why.es),
        };
      },
      async demo() {
        ans = "";
        draw();
        for (let i = 0; i < n; i++) {
          sel = i;
          while (k[i] !== P) {
            k[i] += k[i] < P ? 1 : -1;
            api.sfx.tick(k[i] * 2);
            draw();
            await kit.wait(260);
          }
        }
        kit.floatText(
          colX(P) - CW / 2 - PG / 2,
          ROW0 - 18,
          api.t(L("points lined up", "puntos alineados")),
          "#7ee36d",
          16,
        );
        await kit.wait(500);
        for (const ch of p.truth) {
          ans += ch;
          api.sfx.tap();
          draw();
          await kit.wait(260);
        }
        await liftOff();
      },
      explain: () =>
        sub
          ? L(
              `${padded[0]} − ${padded[1]} = ${p.truth}. The decimal points lined up, and the empty places were zeros.`,
              `${padded[0]} − ${padded[1]} = ${p.truth}. Los puntos decimales se alinearon y los lugares vacíos eran ceros.`,
            )
          : L(
              `${p.rows.join(" + ")} = ${p.truth}. With the decimal points lined up, each place adds to the same place.`,
              `${p.rows.join(" + ")} = ${p.truth}. Con los puntos alineados, cada lugar se suma con el mismo lugar.`,
            ),
    };
  }

  window.DD_MISSIONS = Object.assign(window.DD_MISSIONS || {}, {
    L,
    airship,
    pad,
    entry,
    typeDigits,
    eraseAction,
    editNumber,
    SHIP,
    PANEL,
    INK,
    GOLD,
    manifest,
    math: {
      D,
      fmt,
      add,
      sub,
      mul,
      shift,
      cmp,
      eq,
      sig,
      decPlaces,
      num,
      genManifest,
      judgeManifest,
      genFuel,
      judgeFuel,
      decimalOf,
    },
  });
})();
