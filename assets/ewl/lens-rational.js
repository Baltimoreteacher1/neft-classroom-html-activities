/* EWL.Lens family "rational": one amount from 0 up, drawn several ways.
 * This file: the family, fraction strip, 100-grid, table of equal names. See lens-rational-line.js for
 * number line, place value and percent bar, and lens-rational-fit.js for "how many fit".
 * Every picture reports the amount back through rep.read() from its own parts, as an exact EWL.Rat.
 * Highlight ids are stretches of the whole: "a~b" (Lens.pid). A part answers to a highlight when the
 * two stretches overlap.
 * Spec: { family:"rational", value:"3/5", reps:[...], den?:5, whole?:"80", per?:"1/2", ghost?:"3/10" }
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.rational = Lens.reg.rational || {});
  fam.reps = fam.reps || {};
  const tx = (...a) => Lens.tx(...a);

  /** Denominators that name the amount exactly (up to 5, smallest first); `first` is its own (reduced) one. */
  const denOptions = (v) => {
    const d = Number(v.d);
    const ok = [];
    [d, 10, 100, 2 * d, 20, 3 * d, 4 * d].forEach((D) => {
      if (D >= 1 && D <= 100 && ok.indexOf(D) < 0 && (v.n * BigInt(D)) % v.d === 0n) ok.push(D);
    });
    return { options: ok.slice(0, 5).sort((a, b) => a - b), first: ok[0] };
  };
  const optRat = (x) => (x == null || x === "" ? null : EWL.Rat.parse(x));

  function normalize(spec) {
    const R = EWL.Rat;
    const v = R.parse(spec.value);
    if (!v || v.sign() < 0) throw new RangeError("rational: value must be a number from 0 up");
    const wholes = v.isZero() ? 1 : Number(v.floor() + (v.isInt() ? 0n : 1n));
    if (wholes > 5) throw new RangeError("rational: too large to draw");
    const d = denOptions(v);
    const den = d.options.indexOf(Number(spec.den)) >= 0 ? Number(spec.den) : d.first;
    const per = optRat(spec.per);
    if (per && per.sign() <= 0) throw new RangeError("rational: group size must be positive");
    return {
      spec: Object.assign({}, spec, { den }),
      value: v,
      wholes,
      dens: d.options,
      den,
      whole: optRat(spec.whole),
      per,
      ghost: optRat(spec.ghost),
    };
  }

  /* shared by every rational picture */
  const H = (Lens.RH = {
    X0: 30,
    AW: 540,
    mk: (a, b) => ({ from: a, to: b, id: Lens.pid(a, b) }),
    names(r) {
      const n = EWL.Rat.names(r);
      return `${n.simplest} = ${n.decimal} = ${n.percent}`;
    },
    say(m, lang, en, es) {
      const q = tx(lang, "The amount is", "La cantidad es");
      return `${tx(lang, en, es)} ${q} ${H.names(m.value)}.`;
    },
    hitsOf: (parts) => (id) => {
      const q = Lens.parsePid(id);
      return q && q.to.cmp(q.from) > 0
        ? parts.filter((p) => Lens.overlaps(p, q)).map((p) => p.id)
        : [];
    },
  });

  const ordinal = (D, lang) => {
    if (lang === "es") return `${D} partes`;
    return { 2: "halves", 3: "thirds", 4: "fourths" }[D] || `${D}ths`;
  };

  /* ---------- fraction strip ---------- */
  fam.reps.strip = {
    label: "Fraction strip",
    labelEs: "Tira de fracciones",
    available: (m) => (m.dens.length ? null : "no equal pieces"),
    build(m) {
      const R = EWL.Rat;
      const D = m.den;
      const shaded = Number((m.value.n * BigInt(D)) / m.value.d);
      const parts = [];
      for (let i = 0; i < m.wholes * D; i++) {
        const p = H.mk(R.of(i, D), R.of(i + 1, D));
        parts.push(Object.assign(p, { key: `s${i}`, i, filled: i < shaded }));
      }
      return {
        parts,
        D,
        shaded,
        read: () => R.of(parts.filter((p) => p.filled).length, D),
        alt: (l) =>
          H.say(
            m,
            l,
            `Fraction strip cut into ${D} equal pieces per whole. ${shaded} pieces are shaded.`,
            `Tira dividida en ${D} partes iguales por entero. ${shaded} partes están sombreadas.`,
          ),
        hits: H.hitsOf(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const W = ctx.model.wholes;
      const label = ctx.t("Fraction strip", "Tira de fracciones");
      const { svg, fill } = Lens.U.root(ctx, 600, 36 + W * 66, label, rep.alt(ctx.lang));
      const w = H.AW / rep.D;
      rep.parts.forEach((p) => {
        const row = Math.floor(p.i / rep.D);
        const k = (p.i % rep.D) + 1;
        const x = H.X0 + (p.i % rep.D) * w;
        const y = 14 + row * 66;
        const r = S("rect", { x, y, width: w, height: 40, class: "lens-cell" });
        r.setAttribute("fill", p.filled ? fill.a : "none");
        r.setAttribute("data-filled", p.filled ? "1" : "0");
        const wh = W > 1 ? `, whole ${row + 1}` : "";
        const whEs = W > 1 ? `, entero ${row + 1}` : "";
        ctx.part({
          el: r,
          id: p.id,
          key: p.key,
          label: ctx.t(
            `Piece ${k} of ${rep.D}${wh}, ${p.filled ? "shaded" : "not shaded"}`,
            `Parte ${k} de ${rep.D}${whEs}, ${p.filled ? "sombreada" : "sin sombrear"}`,
          ),
        });
        svg.appendChild(r);
        if (rep.D <= 10) {
          svg.appendChild(
            Lens.U.text(
              x + w / 2,
              y + 26,
              `${k}/${rep.D}`,
              p.filled ? "lens-tiny on" : "lens-tiny",
            ),
          );
        }
      });
      for (let row = 0; row < W; row++) {
        svg.appendChild(Lens.U.text(H.X0, 14 + row * 66 + 58, String(row), "lens-tick"));
      }
      svg.appendChild(Lens.U.text(H.X0 + H.AW, 14 + (W - 1) * 66 + 58, String(W), "lens-tick"));
      return svg;
    },
    controls(_rep, ctx) {
      const m = ctx.model;
      if (m.dens.length < 2) return null;
      const chip = (D) =>
        EWL.h(
          "button",
          {
            type: "button",
            class: "ewl-chip",
            "data-ctl": `den${D}`,
            "aria-pressed": D === m.den ? "true" : "false",
            onclick: () => ctx.update({ den: D }),
          },
          ordinal(D, ctx.lang),
        );
      return EWL.h(
        "div",
        {
          class: "lens-chips",
          role: "group",
          "aria-label": ctx.t("Cut the strip into equal pieces", "Corta la tira en partes iguales"),
        },
        EWL.h("span", { class: "lens-chiplabel" }, ctx.t("Cut into:", "Cortar en:")),
        m.dens.map(chip),
      );
    },
  };

  /* ---------- 10 x 10 grid ---------- */
  fam.reps.grid = {
    label: "100-square grid",
    labelEs: "Cuadrícula de 100",
    available: (m) => (m.value.mul(100).isInt() ? null : "needs hundredths"),
    build(m) {
      const R = EWL.Rat;
      const shaded = Number(m.value.mul(100).n);
      const parts = [];
      for (let i = 0; i < m.wholes * 100; i++) {
        const p = H.mk(R.of(i, 100), R.of(i + 1, 100));
        parts.push(Object.assign(p, { key: `g${i}`, i, filled: i < shaded }));
      }
      return {
        parts,
        cols: 10,
        shaded,
        read: () => R.of(parts.filter((p) => p.filled).length, 100),
        alt: (l) =>
          H.say(
            m,
            l,
            `100-square grid. ${shaded} of every 100 squares are shaded.`,
            `Cuadrícula de 100 cuadrados. ${shaded} de cada 100 están sombreados.`,
          ),
        hits: H.hitsOf(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const W = ctx.model.wholes;
      const label = ctx.t("100-square grid", "Cuadrícula de 100");
      const { svg, fill } = Lens.U.root(
        ctx,
        Math.min(W, 2) * 228,
        Math.ceil(W / 2) * 228,
        label,
        rep.alt(ctx.lang),
      );
      rep.parts.forEach((p) => {
        const g = Math.floor(p.i / 100);
        const c = p.i % 100;
        const r = S("rect", {
          x: 12 + (g % 2) * 228 + (c % 10) * 20,
          y: 12 + Math.floor(g / 2) * 228 + Math.floor(c / 10) * 20,
          width: 20,
          height: 20,
          class: "lens-cell",
        });
        r.setAttribute("fill", p.filled ? fill.a : "none");
        r.setAttribute("data-filled", p.filled ? "1" : "0");
        ctx.part({
          el: r,
          id: p.id,
          key: p.key,
          label: ctx.t(
            `Square ${c + 1} of 100, ${p.filled ? "shaded" : "not shaded"}`,
            `Cuadrado ${c + 1} de 100, ${p.filled ? "sombreado" : "sin sombrear"}`,
          ),
        });
        svg.appendChild(r);
      });
      return svg;
    },
  };

  /* ---------- table of equal names: "n out of D" ---------- */
  fam.reps.table = {
    label: "Table of equal names",
    labelEs: "Tabla de nombres iguales",
    available: (m) => (m.dens.length ? null : "no equal pieces"),
    build(m) {
      const R = EWL.Rat;
      const id = Lens.pid(R.ZERO, m.value);
      const rows = m.dens.map((D) => ({
        key: `r${D}`,
        id,
        from: R.ZERO,
        to: m.value,
        D,
        n: Number((m.value.n * BigInt(D)) / m.value.d),
      }));
      return {
        parts: rows,
        rows,
        read() {
          const rs = rows.map((r) => R.of(r.n, r.D));
          return rs.every((x) => x.eq(rs[0])) ? rs[0] : null;
        },
        alt: (l) =>
          H.say(
            m,
            l,
            `Table: ${rows.map((r) => `${r.n} out of ${r.D}`).join(", ")}.`,
            `Tabla: ${rows.map((r) => `${r.n} de ${r.D}`).join(", ")}.`,
          ),
        hits: (hl) => {
          const q = Lens.parsePid(hl);
          const all = { from: R.ZERO, to: m.value };
          return q && Lens.overlaps(all, q) ? [id] : [];
        },
      };
    },
    draw(rep, ctx) {
      const h = EWL.h;
      const n = EWL.Rat.names(ctx.model.value);
      const th = (en, es) => h("th", { scope: "col" }, ctx.t(en, es));
      const body = rep.rows.map((r) => {
        const btn = h("button", { type: "button", class: "lens-rowbtn" }, String(r.n));
        const tr = h(
          "tr",
          null,
          h("th", { scope: "row" }, btn),
          h("td", null, String(r.D)),
          h("td", null, `${r.n}/${r.D}`),
        );
        ctx.part({
          el: btn,
          marks: [tr],
          id: r.id,
          key: r.key,
          label: ctx.t(`${r.n} out of ${r.D} equal parts`, `${r.n} de ${r.D} partes iguales`),
        });
        return tr;
      });
      const foot = `${ctx.t("As a decimal: ", "Como decimal: ")}${n.decimal} · ${ctx.t("As a percent: ", "Como porcentaje: ")}${n.percent}`;
      return h(
        "table",
        { class: "lens-table", "aria-label": rep.alt(ctx.lang) },
        h(
          "caption",
          null,
          ctx.t(
            "Equal ways to name the shaded amount",
            "Maneras iguales de nombrar la cantidad sombreada",
          ),
        ),
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            th("Shaded", "Sombreadas"),
            th("Equal parts in the whole", "Partes iguales en el entero"),
            th("Fraction", "Fracción"),
          ),
        ),
        h("tbody", null, body),
        h("tfoot", null, h("tr", null, h("td", { colspan: 3 }, foot))),
      );
    },
  };

  Object.assign(fam, {
    id: "rational",
    repOrder: ["strip", "grid", "line", "place", "percent", "table"],
    normalize,
    denOptions,
    setText(spec, text) {
      const v = EWL.Rat.parse(text);
      if (!v || v.sign() < 0) return null;
      const next = Object.assign({}, spec, { value: String(text).trim() });
      delete next.den;
      return next;
    },
    describe(m, id, lang) {
      const q = Lens.parsePid(id);
      const len = q ? q.to.sub(q.from) : null;
      if (!len || len.sign() <= 0) return "";
      const n = EWL.Rat.names(len);
      const t = (en, es) => tx(lang, en, es);
      let s = `${t("This part is", "Esta parte es")} ${n.simplest} ${t("of the whole", "del entero")} (${n.decimal}, ${n.percent}).`;
      if (m.whole) {
        s += ` ${t("Of", "De")} ${Lens.fmt(m.whole)} ${t("that is", "eso es")} ${Lens.fmt(len.mul(m.whole))}.`;
      }
      return s;
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
