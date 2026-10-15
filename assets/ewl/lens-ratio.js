/* EWL.Lens family "ratio": one ratio a:b (b of the second amount for every a of the first).
 * The quantity is the unit rate b/a. Highlight ids are "x<m>": m copies of the ratio, so "x2" means
 * 2a and 2b together. This file: the family, tape diagram, double number line, ratio table.
 * lens-ratio-plane.js adds the y = kx plane and the hanger balance.
 * Spec: { family:"ratio", a:"3", b:"5", steps?:[1,2,3,4], xLabel?, xLabelEs?, yLabel?, yLabelEs?,
 *         yMoney?, reps:[...] }. steps may be fractions: 1/3 of 3:6 is the unit-rate row (1, 2).
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.ratio = Lens.reg.ratio || {});
  fam.reps = fam.reps || {};
  const tx = (...a) => Lens.tx(...a);

  const parseId = (id) => {
    const r = /^x(.+)$/.exec(String(id || ""));
    return r ? EWL.Rat.parse(r[1]) : null;
  };

  function normalize(spec) {
    const R = EWL.Rat;
    const a = R.parse(spec.a);
    const b = R.parse(spec.b);
    if (!a || !b || a.sign() <= 0 || b.sign() <= 0) {
      throw new RangeError("ratio: a and b must be positive numbers");
    }
    const raw = spec.steps && spec.steps.length ? spec.steps : [1, 2, 3, 4];
    const steps = [];
    raw
      .map((s) => R.parse(s))
      .filter((s) => s && s.sign() > 0)
      .sort((p, q) => p.cmp(q))
      .forEach((s) => {
        if (!steps.some((t) => t.eq(s))) steps.push(s);
      });
    if (!steps.length || steps.length > 8) throw new RangeError("ratio: 1 to 8 steps");
    const ints = a.isInt() && b.isInt();
    return {
      spec: Object.assign({}, spec),
      value: b.div(a),
      a,
      b,
      steps,
      ints,
      money: !!spec.yMoney,
    };
  }

  /* shared by every ratio picture */
  const X = (Lens.XH = {
    X0: 70,
    AW: 500,
    gcd: (a, b) => (b ? X.gcd(b, a % b) : a),
    xl: (m, l) =>
      l === "es"
        ? m.spec.xLabelEs || m.spec.xLabel || "primera cantidad"
        : m.spec.xLabel || "first amount",
    yl: (m, l) =>
      l === "es"
        ? m.spec.yLabelEs || m.spec.yLabel || "segunda cantidad"
        : m.spec.yLabel || "second amount",
    pts: (m) =>
      m.steps.map((s) => ({
        key: `p${s.frac()}`,
        id: `x${s.frac()}`,
        s,
        x: m.a.mul(s),
        y: m.b.mul(s),
      })),
    exact: (parts) => (id) => parts.filter((p) => p.id === id).map((p) => p.id),
    slope: (p) => p.y.div(p.x),
    parseId,
    say(m, l, en, es) {
      const t = (a, b) => tx(l, a, b);
      const rate = Lens.fmt(m.value, m.money);
      const ratio = `${m.a.frac()}:${m.b.frac()}`;
      return `${t(en, es)} ${t("The ratio is", "La razón es")} ${ratio}, ${t("a unit rate of", "una tasa unitaria de")} ${rate}.`;
    },
  });

  /* ---------- tape diagram ---------- */
  fam.reps.tape = {
    label: "Tape diagram",
    labelEs: "Diagrama de cinta",
    available: (m) => (m.ints ? null : "tape needs whole numbers"),
    build(m) {
      const A = Number(m.a.n);
      const B = Number(m.b.n);
      const ints = m.steps.filter((s) => s.isInt()).map((s) => Number(s.n));
      const copies = Math.min(6, Math.max(1, ...ints));
      const parts = [];
      ["A", "B"].forEach((row) => {
        for (let j = 1; j <= copies; j++) {
          parts.push({ key: `t${row}${j}`, id: `x${j}`, row, j, count: row === "A" ? A : B });
        }
      });
      const sum = (row) => parts.filter((p) => p.row === row).reduce((s, p) => s + p.count, 0);
      return {
        parts,
        A,
        B,
        copies,
        read: () => EWL.Rat.of(sum("B"), sum("A")),
        alt: (l) =>
          X.say(
            m,
            l,
            `Tape diagram: ${copies} copies. Each copy has ${A} equal parts on the top tape and ${B} on the bottom tape.`,
            `Diagrama de cinta: ${copies} copias. Cada copia tiene ${A} partes iguales arriba y ${B} abajo.`,
          ),
        hits(id) {
          const q = parseId(id);
          if (!q) return [];
          const top = Number(q.floor());
          const out = [];
          for (let j = 1; j <= Math.min(top, copies); j++) out.push(`x${j}`);
          return out;
        },
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { X0, AW } = X;
      const title = ctx.t("Tape diagram", "Diagrama de cinta");
      const { svg, fill } = Lens.U.root(ctx, 600, 170, title, rep.alt(ctx.lang));
      const big = Math.max(rep.A, rep.B);
      const subdivide = rep.A <= 12 && rep.B <= 12 && rep.copies * big <= 40;
      const u = AW / (rep.copies * big);
      svg.appendChild(Lens.U.text(4, 50, X.xl(m, ctx.lang), "lens-tiny lens-a", "start"));
      svg.appendChild(Lens.U.text(4, 120, X.yl(m, ctx.lang), "lens-tiny lens-b", "start"));
      rep.parts.forEach((p) => {
        const w = p.count * u;
        const x = X0 + (p.j - 1) * w;
        const y = p.row === "A" ? 28 : 98;
        const r = S("rect", { x, y, width: w, height: 40, class: "lens-cell" });
        r.setAttribute("fill", p.row === "A" ? fill.a : fill.b);
        const who = (l) => (p.row === "A" ? X.xl(m, l) : X.yl(m, l));
        ctx.part({
          el: r,
          id: p.id,
          key: p.key,
          label: ctx.t(
            `Copy ${p.j}, ${who("en")}: ${p.count} parts`,
            `Copia ${p.j}, ${who("es")}: ${p.count} partes`,
          ),
        });
        svg.appendChild(r);
        if (subdivide) {
          for (let k = 1; k < p.count; k++) {
            svg.appendChild(
              S("line", { x1: x + k * u, y1: y, x2: x + k * u, y2: y + 40, class: "lens-sep" }),
            );
          }
        } else {
          svg.appendChild(Lens.U.text(x + w / 2, y + 26, String(p.count), "lens-tiny on"));
        }
        if (p.row === "A") {
          svg.appendChild(
            Lens.U.text(x + w / 2, 20, `${ctx.t("copy", "copia")} ${p.j}`, "lens-tiny"),
          );
        }
      });
      const keep = ctx.t(
        `Every copy keeps ${rep.A} : ${rep.B}`,
        `Cada copia mantiene ${rep.A} : ${rep.B}`,
      );
      svg.appendChild(Lens.U.text(X0 + AW / 2, 160, keep, "lens-tiny"));
      return svg;
    },
  };

  /* ---------- double number line ---------- */
  fam.reps.dnl = {
    label: "Double number line",
    labelEs: "Recta numérica doble",
    build(m) {
      const parts = X.pts(m);
      const line = parts.map((p) => `${Lens.fmt(p.x)} / ${Lens.fmt(p.y, m.money)}`).join("; ");
      return {
        parts,
        read: () => X.slope(parts[parts.length - 1]),
        alt: (l) =>
          X.say(
            m,
            l,
            `Double number line. Pairs: ${line}.`,
            `Recta numérica doble. Pares: ${line}.`,
          ),
        hits: X.exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { X0, AW } = X;
      const title = ctx.t("Double number line", "Recta numérica doble");
      const { svg } = Lens.U.root(ctx, 600, 190, title, rep.alt(ctx.lang));
      const top = m.steps[m.steps.length - 1];
      const px = (s) => X0 + (s.num() / top.num()) * AW;
      svg.appendChild(Lens.U.text(4, 20, X.xl(m, ctx.lang), "lens-tiny lens-a", "start"));
      svg.appendChild(Lens.U.text(4, 184, X.yl(m, ctx.lang), "lens-tiny lens-b", "start"));
      const axis = (y, cls) =>
        S("line", { x1: X0 - 10, y1: y, x2: X0 + AW + 10, y2: y, class: `lens-axis ${cls}` });
      svg.appendChild(axis(62, "lens-a-line"));
      svg.appendChild(axis(128, "lens-b-line"));
      svg.appendChild(Lens.U.text(X0, 48, "0", "lens-tick"));
      svg.appendChild(Lens.U.text(X0, 152, "0", "lens-tick"));
      rep.parts.forEach((p) => {
        const x = px(p.s);
        const g = S(
          "g",
          null,
          S("rect", {
            x: x - 22,
            y: 40,
            width: 44,
            height: 112,
            fill: "transparent",
            class: "lens-cell lens-over",
          }),
          S("line", { x1: x, y1: 62, x2: x, y2: 128, class: "lens-link" }),
          S("rect", { x: x - 6, y: 56, width: 12, height: 12, class: "lens-sq-a" }),
          S("circle", { cx: x, cy: 128, r: 7, class: "lens-dot-b" }),
          Lens.U.text(x, 48, Lens.fmt(p.x), "lens-tick"),
          Lens.U.text(x, 152, Lens.fmt(p.y, m.money), "lens-tick"),
          Lens.U.text(x + 12, 98, `×${Lens.fmt(p.s)}`, "lens-tiny", "start"),
        );
        const px1 = Lens.fmt(p.x);
        const py1 = Lens.fmt(p.y, m.money);
        ctx.part({
          el: g,
          id: p.id,
          key: p.key,
          label: ctx.t(
            `${px1} ${X.xl(m, "en")} goes with ${py1} ${X.yl(m, "en")}`,
            `${px1} ${X.xl(m, "es")} va con ${py1} ${X.yl(m, "es")}`,
          ),
        });
        svg.appendChild(g);
      });
      return svg;
    },
  };

  /* ---------- ratio table ---------- */
  fam.reps.table = {
    label: "Ratio table",
    labelEs: "Tabla de razones",
    build(m) {
      const parts = X.pts(m);
      return {
        parts,
        read() {
          const ks = parts.map(X.slope);
          return ks.every((k) => k.eq(ks[0])) ? ks[0] : null;
        },
        alt: (l) =>
          X.say(
            m,
            l,
            `Ratio table with ${parts.length} rows, all equivalent to ${m.a.frac()}:${m.b.frac()}.`,
            `Tabla de razones con ${parts.length} filas, todas equivalentes a ${m.a.frac()}:${m.b.frac()}.`,
          ),
        hits: X.exact(parts),
      };
    },
    draw(rep, ctx) {
      const h = EWL.h;
      const m = ctx.model;
      const rows = rep.parts.map((p) => {
        const btn = h("button", { type: "button", class: "lens-rowbtn" }, Lens.fmt(p.x));
        const tr = h(
          "tr",
          null,
          h("th", { scope: "row" }, btn),
          h("td", null, Lens.fmt(p.y, m.money)),
          h("td", { class: "lens-mult" }, `×${Lens.fmt(p.s)}`),
        );
        const px1 = Lens.fmt(p.x);
        const py1 = Lens.fmt(p.y, m.money);
        ctx.part({
          el: btn,
          marks: [tr],
          id: p.id,
          key: p.key,
          label: ctx.t(
            `${px1} ${X.xl(m, "en")}, ${py1} ${X.yl(m, "en")}`,
            `${px1} ${X.xl(m, "es")}, ${py1} ${X.yl(m, "es")}`,
          ),
        });
        return tr;
      });
      const th = (t) => h("th", { scope: "col" }, t);
      return h(
        "table",
        { class: "lens-table", "aria-label": rep.alt(ctx.lang) },
        h("caption", null, ctx.t("Equivalent ratios", "Razones equivalentes")),
        h(
          "thead",
          null,
          h("tr", null, th(X.xl(m, ctx.lang)), th(X.yl(m, ctx.lang)), th(ctx.t("Times", "Veces"))),
        ),
        h("tbody", null, rows),
      );
    },
  };

  Object.assign(fam, {
    id: "ratio",
    repOrder: ["tape", "dnl", "table", "plane", "balance"],
    normalize,
    setText(spec, text) {
      const R = EWL.Rat;
      const mm = /^\s*([\d./ ]+?)\s*(?::|to)\s*([\d./ ]+?)\s*$/i.exec(String(text));
      let a;
      let b;
      if (mm) {
        a = mm[1];
        b = mm[2];
      } else {
        const k = R.parse(text);
        if (!k || k.sign() <= 0) return null;
        a = "1";
        b = k.frac();
      }
      const pa = R.parse(a);
      const pb = R.parse(b);
      return pa && pb && pa.sign() > 0 && pb.sign() > 0 ? Object.assign({}, spec, { a, b }) : null;
    },
    describe(m, id, lang) {
      const q = parseId(id);
      if (!q) return "";
      const t = (en, es) => tx(lang, en, es);
      const copies = q.eq(1) ? t("copy", "copia") : t("copies", "copias");
      const x = `${Lens.fmt(m.a.mul(q))} ${X.xl(m, lang)}`;
      const y = `${Lens.fmt(m.b.mul(q), m.money)} ${X.yl(m, lang)}`;
      return `${Lens.fmt(q)} ${copies} ${t("of", "de")} ${m.a.frac()}:${m.b.frac()}: ${x} ${t("goes with", "va con")} ${y}.`;
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
