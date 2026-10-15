/* EWL.Lens family "ratio", part 2: the y = kx coordinate plane and the hanger balance (a*y = b*x).
 * Registers into EWL.Lens.reg.ratio.reps (lens-ratio.js owns the family and the shared helpers, EWL.Lens.XH).
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.ratio = Lens.reg.ratio || {});
  fam.reps = fam.reps || {};
  const X = () => Lens.XH;

  /** Axis maximum and tick step for a value v (about five ticks, steps of 1, 2, 5 x 10^n). */
  const axis = (v) => {
    const e = 10 ** Math.floor(Math.log10(v / 5));
    const f = v / 5 / e;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
    return { step, max: Math.ceil(v / step - 1e-9) * step };
  };
  const round = (v) => String(Math.round(v * 100) / 100);

  /* ---------- y = kx plane ---------- */
  fam.reps.plane = {
    label: "Coordinate plane, y = kx",
    labelEs: "Plano de coordenadas, y = kx",
    build(m) {
      const parts = X().pts(m);
      const pairs = parts.map((p) => `(${Lens.fmt(p.x)}, ${Lens.fmt(p.y)})`).join(", ");
      const k = Lens.fmt(m.value);
      return {
        parts,
        read: () => X().slope(parts[0]),
        alt: (l) =>
          X().say(
            m,
            l,
            `Coordinate plane. The points ${pairs} lie on the line y = ${k}x.`,
            `Plano de coordenadas. Los puntos ${pairs} están en la recta y = ${k}x.`,
          ),
        hits: X().exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const x = X();
      const top = m.steps[m.steps.length - 1];
      const title = ctx.t("Coordinate plane", "Plano de coordenadas");
      const { svg } = Lens.U.root(ctx, 600, 290, title, rep.alt(ctx.lang));
      const ax = axis(m.a.mul(top).num());
      const ay = axis(m.b.mul(top).num());
      const px = (v) => 70 + (v / ax.max) * 490;
      const py = (v) => 244 - (v / ay.max) * 212;
      for (let v = 0; v <= ax.max + 1e-9; v += ax.step) {
        svg.appendChild(
          S("line", { x1: px(v), y1: 32, x2: px(v), y2: 244, class: "lens-grid-line" }),
        );
        svg.appendChild(Lens.U.text(px(v), 262, round(v), "lens-tiny"));
      }
      for (let v = 0; v <= ay.max + 1e-9; v += ay.step) {
        svg.appendChild(
          S("line", { x1: 70, y1: py(v), x2: 560, y2: py(v), class: "lens-grid-line" }),
        );
        svg.appendChild(Lens.U.text(62, py(v) + 4, round(v), "lens-tiny", "end"));
      }
      svg.appendChild(S("line", { x1: 70, y1: 244, x2: 560, y2: 244, class: "lens-axis" }));
      svg.appendChild(S("line", { x1: 70, y1: 32, x2: 70, y2: 244, class: "lens-axis" }));
      svg.appendChild(Lens.U.text(315, 284, x.xl(m, ctx.lang), "lens-tiny lens-a"));
      svg.appendChild(Lens.U.text(12, 20, x.yl(m, ctx.lang), "lens-tiny lens-b", "start"));
      const k = m.value.num();
      const xe = Math.min(ax.max, ay.max / k);
      svg.appendChild(
        S("line", { x1: px(0), y1: py(0), x2: px(xe), y2: py(xe * k), class: "lens-rule" }),
      );
      const eq = `y = ${Lens.fmt(m.value)}x`;
      svg.appendChild(
        Lens.U.text(Math.min(px(xe) - 6, 520), py(xe * k) - 10, eq, "lens-big", "end"),
      );
      rep.parts.forEach((p) => {
        const cx = px(p.x.num());
        const cy = py(p.y.num());
        const g = S(
          "g",
          null,
          S("circle", { cx, cy, r: 14, fill: "transparent", class: "lens-cell lens-over" }),
          S("path", { d: `M${cx} ${cy - 9} l9 9 l-9 9 l-9 -9 z`, class: "lens-diamond" }),
        );
        const pair = `(${Lens.fmt(p.x)}, ${Lens.fmt(p.y)})`;
        ctx.part({ el: g, id: p.id, key: p.key, label: ctx.t(`Point ${pair}`, `Punto ${pair}`) });
        svg.appendChild(g);
        svg.appendChild(Lens.U.text(cx + 12, cy + 22, pair, "lens-tiny", "start"));
      });
      return svg;
    },
  };

  /* ---------- hanger balance: a*y = b*x ---------- */
  fam.reps.balance = {
    label: "Hanger balance",
    labelEs: "Balanza de percha",
    available(m) {
      if (!m.ints) return "balance needs whole numbers";
      const g = X().gcd(Number(m.a.n), Number(m.b.n));
      return Number(m.a.n) / g > 9 || Number(m.b.n) / g > 9 ? "too many bags" : null;
    },
    build(m) {
      const g = X().gcd(Number(m.a.n), Number(m.b.n));
      const left = Number(m.a.n) / g;
      const right = Number(m.b.n) / g;
      return {
        parts: X().pts(m),
        left,
        right,
        read: () => EWL.Rat.of(right, left),
        alt: (l) =>
          X().say(
            m,
            l,
            `Balance: ${left} bags of the second amount hang on the left and ${right} bags of the first amount on the right. They balance.`,
            `Balanza: ${left} bolsas de la segunda cantidad cuelgan a la izquierda y ${right} bolsas de la primera a la derecha. Se equilibran.`,
          ),
        hits: X().exact(X().pts(m)),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const h = EWL.h;
      const m = ctx.model;
      const title = ctx.t("Hanger balance", "Balanza de percha");
      const { svg, fill } = Lens.U.root(ctx, 600, 250, title, rep.alt(ctx.lang));
      svg.appendChild(S("path", { d: "M300 40 L282 86 H318 Z", class: "lens-pivot" }));
      svg.appendChild(S("line", { x1: 90, y1: 40, x2: 510, y2: 40, class: "lens-beam" }));
      [130, 470].forEach((cx) => {
        svg.appendChild(S("line", { x1: cx, y1: 40, x2: cx, y2: 92, class: "lens-rope" }));
      });
      const bags = (cx, n, cls, f) => {
        const cols = Math.min(n, 3);
        for (let i = 0; i < n; i++) {
          const bx = cx - (cols * 46) / 2 + (i % cols) * 46 + 4;
          const by = 96 + Math.floor(i / cols) * 40;
          const bag = S("rect", {
            x: bx,
            y: by,
            width: 38,
            height: 32,
            rx: 8,
            class: `lens-bag ${cls}`,
          });
          bag.setAttribute("fill", f);
          svg.appendChild(bag);
        }
      };
      bags(130, rep.left, "lens-bag-b", fill.b);
      bags(470, rep.right, "lens-bag-a", fill.a);
      const lt = Lens.U.text(130, 232, "", "lens-tiny");
      const rt = Lens.U.text(470, 232, "", "lens-tiny");
      [lt, rt, Lens.U.text(300, 140, "=", "lens-big")].forEach((n) => svg.appendChild(n));
      const first = m.steps.filter((s) => s.eq(1))[0] || m.steps[0];
      rep.update = (id) => {
        const q = X().parseId(id);
        const mult = q && m.steps.some((s) => s.eq(q)) ? q : first;
        const bx = m.a.mul(mult);
        const by = m.b.mul(mult);
        lt.textContent = `${rep.left} × ${Lens.fmt(by, m.money)} = ${Lens.fmt(by.mul(rep.left), m.money)}`;
        rt.textContent = `${rep.right} × ${Lens.fmt(bx)} = ${Lens.fmt(bx.mul(rep.right))}`;
      };
      rep.update(null);
      const chip = (p) => {
        const b = h(
          "button",
          { type: "button", class: "ewl-chip", "data-ctl": `bal${p.key}` },
          `×${Lens.fmt(p.s)}`,
        );
        const word = Lens.fmt(p.s);
        ctx.part({
          el: b,
          id: p.id,
          key: p.key,
          label: ctx.t(`Show ${word} copies of the ratio`, `Mostrar ${word} copias de la razón`),
        });
        return b;
      };
      const chips = h(
        "div",
        {
          class: "lens-chips",
          role: "group",
          "aria-label": ctx.t("How many copies of the ratio", "Cuántas copias de la razón"),
        },
        h("span", { class: "lens-chiplabel" }, ctx.t("Copies:", "Copias:")),
        rep.parts.map(chip),
      );
      return h("div", { class: "lens-balance" }, svg, chips);
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
