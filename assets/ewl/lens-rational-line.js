/* EWL.Lens family "rational", part 2: number line, decimal place value, percent bar.
 * Registers into EWL.Lens.reg.rational.reps (lens-rational.js owns the family and shared helpers, EWL.Lens.RH).
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.rational = Lens.reg.rational || {});
  fam.reps = fam.reps || {};
  const H = () => Lens.RH;

  /* ---------- number line ---------- */
  fam.reps.line = {
    label: "Number line",
    labelEs: "Recta numérica",
    build(m) {
      const R = EWL.Rat;
      const ld = m.den <= 20 ? m.den : 10;
      const parts = [];
      for (let i = 0; i < m.wholes * ld; i++) {
        const p = H().mk(R.of(i, ld), R.of(i + 1, ld));
        parts.push(Object.assign(p, { key: `l${i}`, i, kind: "seg" }));
      }
      const point = Object.assign(H().mk(R.ZERO, m.value), { key: "pt", kind: "point" });
      const scaled = m.value.mul(ld);
      const whole = Number(scaled.floor());
      return {
        parts: [point].concat(parts),
        point,
        ld,
        read: () => R.of(whole, ld).add(scaled.sub(R.of(whole)).div(ld)),
        alt: (l) =>
          H().say(
            m,
            l,
            `Number line from 0 to ${m.wholes} with a point at ${m.value.frac()}.`,
            `Recta numérica de 0 a ${m.wholes} con un punto en ${m.value.frac()}.`,
          ),
        hits: H().hitsOf(parts.concat(m.value.isZero() ? [] : [point])),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const W = m.wholes;
      const { X0, AW } = H();
      const { svg, fill } = Lens.U.root(
        ctx,
        600,
        150,
        ctx.t("Number line", "Recta numérica"),
        rep.alt(ctx.lang),
      );
      const px = (r) => X0 + (r.num() / W) * AW;
      const y = 78;
      rep.parts.forEach((p) => {
        if (p.kind !== "seg") return;
        const filled = p.to.cmp(m.value) <= 0;
        const r = S("rect", {
          x: px(p.from),
          y: y - 9,
          width: px(p.to) - px(p.from),
          height: 18,
          class: "lens-cell",
        });
        r.setAttribute("fill", filled ? fill.a : "none");
        r.setAttribute("data-filled", filled ? "1" : "0");
        ctx.part({
          el: r,
          id: p.id,
          key: p.key,
          label: ctx.t(
            `From ${p.from.frac()} to ${p.to.frac()}`,
            `De ${p.from.frac()} a ${p.to.frac()}`,
          ),
        });
        svg.appendChild(r);
      });
      const every = rep.ld > 12 ? Math.ceil(rep.ld / 10) : 1;
      for (let i = 0; i <= W * rep.ld; i++) {
        const x = X0 + (i / (W * rep.ld)) * AW;
        const whole = i % rep.ld === 0;
        const tick = { x1: x, y1: y - (whole ? 16 : 10), x2: x, y2: y + (whole ? 16 : 10) };
        svg.appendChild(S("line", Object.assign(tick, { class: "lens-axis" })));
        if (whole) svg.appendChild(Lens.U.text(x, y + 36, String(i / rep.ld), "lens-tick"));
        else if (i % every === 0)
          svg.appendChild(Lens.U.text(x, y + 34, `${i}/${rep.ld}`, "lens-tiny"));
      }
      const mx = px(m.value);
      const dot = S("circle", { cx: mx, cy: y, r: 11, class: "lens-dot" });
      if (!m.value.isZero()) {
        ctx.part({
          el: dot,
          id: rep.point.id,
          key: "pt",
          label: ctx.t(
            `The point at ${m.value.frac()}, the shaded amount`,
            `El punto en ${m.value.frac()}, la cantidad sombreada`,
          ),
        });
      }
      svg.appendChild(S("path", { d: `M${mx} ${y - 32} l-8 -14 h16 z`, class: "lens-arrow" }));
      svg.appendChild(
        Lens.U.text(Math.min(Math.max(mx, 56), 544), y - 58, m.value.frac(), "lens-big"),
      );
      svg.appendChild(dot);
      if (m.ghost) {
        const gx = px(m.ghost);
        svg.appendChild(S("line", { x1: gx, y1: y - 30, x2: gx, y2: y + 30, class: "lens-ghost" }));
        svg.appendChild(
          Lens.U.text(gx, y + 54, ctx.spec.ghostLabel || m.ghost.percent(), "lens-ghosttxt"),
        );
      }
      return svg;
    },
  };

  /* ---------- decimal place value ---------- */
  const PLACES = ["ones", "tenths", "hundredths", "thousandths", "ten-thousandths"];
  const PLACES_ES = ["unidades", "décimos", "centésimos", "milésimos", "diezmilésimos"];
  fam.reps.place = {
    label: "Decimal place value",
    labelEs: "Valor posicional decimal",
    available(m) {
      const t = m.value.decimal(8);
      const bits = t.text.split(".");
      return t.terminating && (bits[1] || "").length <= 4 && bits[0].length <= 1
        ? null
        : "needs a short decimal";
    },
    build(m) {
      const R = EWL.Rat;
      const bits = m.value.decimal(8).text.split(".");
      const digits = (bits[0] + (bits[1] || "")).split("").map(Number);
      let run = R.ZERO;
      const cols = digits.map((d, i) => {
        const worth = R.of(1, 10 ** i);
        const from = run;
        run = run.add(worth.mul(d));
        return Object.assign(H().mk(from, run), { key: `p${i}`, i, digit: d, worth });
      });
      return {
        parts: cols,
        read: () => cols.reduce((s, c) => s.add(c.worth.mul(c.digit)), R.ZERO),
        alt: (l) =>
          H().say(
            m,
            l,
            `Place value chart for ${m.value.decimal().text}.`,
            `Tabla de valor posicional de ${m.value.decimal().text}.`,
          ),
        hits: H().hitsOf(cols),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const n = rep.parts.length;
      const cw = Math.min(110, 520 / n);
      const title = ctx.t("Decimal place value", "Valor posicional decimal");
      const { svg, fill } = Lens.U.root(ctx, 600, 190, title, rep.alt(ctx.lang));
      rep.parts.forEach((c) => {
        const x = 40 + c.i * cw + (c.i > 0 ? 18 : 0);
        const cx = x + (cw - 8) / 2;
        const box = S("rect", {
          x,
          y: 14,
          width: cw - 8,
          height: 150,
          rx: 6,
          class: "lens-cell lens-col",
        });
        const worth = c.worth.mul(c.digit).frac();
        ctx.part({
          el: box,
          id: c.id,
          key: c.key,
          label: ctx.t(
            `The ${PLACES[c.i]} place is ${c.digit}, worth ${worth}`,
            `El lugar de los ${PLACES_ES[c.i]} es ${c.digit}, vale ${worth}`,
          ),
        });
        svg.appendChild(box);
        svg.appendChild(Lens.U.text(cx, 38, ctx.t(PLACES[c.i], PLACES_ES[c.i]), "lens-tiny"));
        svg.appendChild(Lens.U.text(cx, 86, String(c.digit), "lens-digit"));
        const bw = (cw - 20) / 5;
        for (let k = 0; k < 10; k++) {
          const mini = S("rect", {
            x: x + 6 + (k % 5) * bw,
            y: 108 + Math.floor(k / 5) * 22,
            width: bw - 3,
            height: 18,
            class: "lens-mini",
          });
          mini.setAttribute("fill", k < c.digit ? fill.a : "none");
          mini.setAttribute("data-filled", k < c.digit ? "1" : "0");
          svg.appendChild(mini);
        }
      });
      if (n > 1) svg.appendChild(Lens.U.text(40 + cw + 5, 90, ".", "lens-digit"));
      return svg;
    },
  };

  /* ---------- percent bar ---------- */
  fam.reps.percent = {
    label: "Percent bar",
    labelEs: "Barra de porcentaje",
    build(m) {
      const R = EWL.Rat;
      const segs = [];
      for (let j = 0; j < m.wholes * 10; j++) {
        const from = R.of(j, 10);
        const cover = m.value.sub(from).div(R.of(1, 10));
        const f = cover.cmp(0) <= 0 ? R.ZERO : cover.cmp(1) >= 0 ? R.ONE : cover;
        segs.push(Object.assign(H().mk(from, R.of(j + 1, 10)), { key: `b${j}`, j, fraction: f }));
      }
      const fill = Object.assign(H().mk(R.ZERO, m.value), { key: "fill", kind: "fill" });
      return {
        parts: m.value.isZero() ? segs : [fill].concat(segs),
        segs,
        fill,
        read: () => segs.reduce((s, x) => s.add(x.fraction.div(10)), R.ZERO),
        alt: (l) =>
          H().say(
            m,
            l,
            `Percent bar, 0% to ${m.wholes * 100}%. The shaded part is ${m.value.percent()}.`,
            `Barra de porcentaje de 0 % a ${m.wholes * 100} %. La parte sombreada es ${m.value.percent()}.`,
          ),
        hits: H().hitsOf(segs.concat(m.value.isZero() ? [] : [fill])),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const W = m.wholes;
      const { X0, AW } = H();
      const title = ctx.t("Percent bar", "Barra de porcentaje");
      const { svg, fill } = Lens.U.root(ctx, 600, m.whole ? 170 : 130, title, rep.alt(ctx.lang));
      const sw = AW / (W * 10);
      rep.segs.forEach((s) => {
        const x = X0 + s.j * sw;
        svg.appendChild(
          S("rect", {
            x,
            y: 48,
            width: sw,
            height: 36,
            class: "lens-cell lens-quiet",
            fill: "none",
          }),
        );
        if (s.fraction.sign() > 0) {
          svg.appendChild(
            S("rect", {
              x,
              y: 48,
              width: sw * s.fraction.num(),
              height: 36,
              class: "lens-fillbar",
              fill: fill.a,
            }),
          );
        }
        const hit = S("rect", {
          x,
          y: 48,
          width: sw,
          height: 36,
          class: "lens-cell lens-over",
          fill: "transparent",
        });
        ctx.part({
          el: hit,
          id: s.id,
          key: s.key,
          label: ctx.t(
            `From ${s.from.percent()} to ${s.to.percent()}`,
            `De ${s.from.percent()} a ${s.to.percent()}`,
          ),
        });
        svg.appendChild(hit);
        svg.appendChild(Lens.U.text(x, 104, `${s.j * 10}%`, "lens-tiny"));
        if (m.whole && (W === 1 || s.j % 10 === 0)) {
          svg.appendChild(Lens.U.text(x, 128, Lens.fmt(m.whole.mul(s.from)), "lens-tiny lens-b"));
        }
      });
      svg.appendChild(Lens.U.text(X0 + AW, 104, `${W * 100}%`, "lens-tiny"));
      if (m.whole)
        svg.appendChild(Lens.U.text(X0 + AW, 128, Lens.fmt(m.whole.mul(W)), "lens-tiny lens-b"));
      if (!m.value.isZero()) {
        const bx = X0 + (m.value.num() / W) * AW;
        const g = S(
          "g",
          { class: "lens-bracket" },
          S("rect", { x: X0, y: 8, width: bx - X0, height: 34, fill: "transparent" }),
          S("path", { d: `M${X0} 38 V24 H${bx} V38`, class: "lens-brace" }),
          Lens.U.text((X0 + bx) / 2, 20, m.value.percent(), "lens-big"),
        );
        ctx.part({
          el: g,
          id: rep.fill.id,
          key: "fill",
          label: ctx.t(
            `The shaded amount, ${m.value.percent()}`,
            `La cantidad sombreada, ${m.value.percent()}`,
          ),
        });
        svg.appendChild(g);
      }
      if (m.ghost) {
        const gx = X0 + (m.ghost.num() / W) * AW;
        svg.appendChild(S("line", { x1: gx, y1: 40, x2: gx, y2: 92, class: "lens-ghost" }));
        svg.appendChild(
          Lens.U.text(gx, 40, ctx.spec.ghostLabel || m.ghost.percent(), "lens-ghosttxt"),
        );
      }
      return svg;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
