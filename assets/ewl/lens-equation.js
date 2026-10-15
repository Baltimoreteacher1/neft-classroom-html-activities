/* EWL.Lens family "equation": one equation p*x + q = r and the one number that makes it true.
 * Pictures: hanger balance (bags of x and unit blocks), tape diagram, number line.
 * The quantity is x = (r - q) / p. Doing the same thing to both sides changes the picture, never x.
 * Highlight ids are the parts of the sentence: "unknown" (x), "const" (the +q), "total" (the r side).
 * Spec: { family:"equation", p:"2", q:"3", r:"11", reps?:[...], test?:"4" } — test tilts the balance for
 * a guess. setText accepts "2x+3=11", "x+5=9", "3x=12".
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.equation = Lens.reg.equation || {});
  fam.reps = fam.reps || {};
  const tx = (...a) => Lens.tx(...a);
  const IDS = ["unknown", "const", "total"];
  const exact = (parts) => (id) =>
    IDS.indexOf(id) >= 0 ? parts.filter((p) => p.id === id).map((p) => p.id) : [];

  function normalize(spec) {
    const R = EWL.Rat;
    const p = R.parse(spec.p == null ? "1" : spec.p);
    const q = R.parse(spec.q == null ? "0" : spec.q);
    const r = R.parse(spec.r);
    if (!p || !q || !r || p.sign() <= 0 || q.sign() < 0 || r.sign() < 0) {
      throw new RangeError("equation: p must be positive, q and r zero or more");
    }
    if (r.cmp(q) < 0) throw new RangeError("equation: the answer would be negative");
    const guess = spec.test == null || spec.test === "" ? null : R.parse(spec.test);
    const ints = p.isInt() && q.isInt() && r.isInt();
    return { spec: Object.assign({}, spec), value: r.sub(q).div(p), p, q, r, guess, ints };
  }

  const sentence = (m) => {
    const x = m.p.eq(1) ? "x" : `${m.p.frac()}x`;
    return m.q.isZero() ? `${x} = ${m.r.frac()}` : `${x} + ${m.q.frac()} = ${m.r.frac()}`;
  };
  const say = (m, l, en, es) =>
    `${tx(l, en, es)} ${tx(l, "The equation is", "La ecuación es")} ${sentence(m)}; x = ${m.value.frac()}.`;
  const grid = (n, x0, y0, cols, size, gap) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: x0 + (i % cols) * (size + gap), y: y0 + Math.floor(i / cols) * (size + gap) });
    }
    return out;
  };

  /* ---------- hanger balance ---------- */
  fam.reps.balance = {
    label: "Hanger balance",
    labelEs: "Balanza de percha",
    available(m) {
      if (!m.ints) return "balance needs whole numbers";
      return m.p.cmp(6) > 0 || m.r.cmp(30) > 0 ? "too many to draw" : null;
    },
    build(m) {
      const P = Number(m.p.n);
      const Q = Number(m.q.n);
      const Rr = Number(m.r.n);
      const parts = [
        { key: "bags", id: "unknown" },
        { key: "plus", id: "const" },
        { key: "right", id: "total" },
      ].filter((p) => p.id !== "const" || Q > 0);
      return {
        parts,
        P,
        Q,
        Rr,
        read: () => EWL.Rat.of(Rr - Q, P),
        alt: (l) =>
          say(
            m,
            l,
            `Balance: ${P} bag${P > 1 ? "s" : ""} of x and ${Q} unit blocks on the left, ${Rr} unit blocks on the right.`,
            `Balanza: ${P} bolsa${P > 1 ? "s" : ""} de x y ${Q} bloques a la izquierda, ${Rr} bloques a la derecha.`,
          ),
        hits: exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { svg, fill } = Lens.U.root(
        ctx,
        600,
        270,
        ctx.t("Hanger balance", "Balanza de percha"),
        rep.alt(ctx.lang),
      );
      let tilt = 0;
      let mark = "=";
      if (m.guess) {
        const left = m.p.mul(m.guess).add(m.q);
        tilt = left.cmp(m.r) * 7;
        mark = left.cmp(m.r) > 0 ? ">" : left.cmp(m.r) < 0 ? "<" : "=";
      }
      const g = S("g", { transform: `rotate(${tilt} 300 50)` });
      g.appendChild(S("line", { x1: 70, y1: 50, x2: 530, y2: 50, class: "lens-beam" }));
      [120, 480].forEach((cx) =>
        g.appendChild(S("line", { x1: cx, y1: 50, x2: cx, y2: 100, class: "lens-rope" })),
      );
      const box = (x, y, w, h, cls, f) => {
        const r = S("rect", { x, y, width: w, height: h, rx: 7, class: cls });
        if (f) r.setAttribute("fill", f);
        return r;
      };
      const bagSpots = grid(rep.P, 120 - (Math.min(rep.P, 3) * 50) / 2, 108, 3, 44, 6);
      const bagEls = bagSpots.map((s) => {
        const e = S(
          "g",
          null,
          box(s.x, s.y, 44, 38, "lens-bag lens-bag-a", fill.a),
          Lens.U.text(s.x + 22, s.y + 26, "x", "lens-digit lens-xs"),
        );
        return e;
      });
      const bagGroup = S("g", null, bagEls);
      ctx.part({
        el: bagGroup,
        id: "unknown",
        key: "bags",
        label: ctx.t(
          `${rep.P} bag${rep.P > 1 ? "s" : ""}, each holding x`,
          `${rep.P} bolsa${rep.P > 1 ? "s" : ""}, cada una con x`,
        ),
      });
      g.appendChild(bagGroup);
      const qy = 108 + Math.ceil(rep.P / 3) * 50 + 4;
      if (rep.Q > 0) {
        const qs = grid(rep.Q, 70, qy, 6, 22, 4).map((s) =>
          box(s.x, s.y, 22, 22, "lens-unit lens-unit-b", fill.b),
        );
        const qg = S("g", null, qs);
        ctx.part({
          el: qg,
          id: "const",
          key: "plus",
          label: ctx.t(`${rep.Q} unit blocks`, `${rep.Q} bloques`),
        });
        g.appendChild(qg);
      }
      const rs = grid(rep.Rr, 396, 108, 6, 22, 4).map((s) =>
        box(s.x, s.y, 22, 22, "lens-unit lens-unit-b", fill.b),
      );
      const rg = S("g", null, rs);
      ctx.part({
        el: rg,
        id: "total",
        key: "right",
        label: ctx.t(`${rep.Rr} unit blocks on the right`, `${rep.Rr} bloques a la derecha`),
      });
      g.appendChild(rg);
      svg.appendChild(S("path", { d: "M300 50 L280 100 H320 Z", class: "lens-pivot" }));
      svg.appendChild(g);
      svg.appendChild(Lens.U.text(300, 40, mark, "lens-big"));
      if (m.guess) {
        const word =
          mark === "="
            ? ctx.t("balanced", "equilibrado")
            : mark === ">"
              ? ctx.t("left is heavier", "la izquierda pesa más")
              : ctx.t("right is heavier", "la derecha pesa más");
        svg.appendChild(Lens.U.text(300, 255, `x = ${m.guess.frac()}: ${word}`, "lens-tiny"));
      }
      return svg;
    },
  };

  /* ---------- tape diagram ---------- */
  fam.reps.tape = {
    label: "Tape diagram",
    labelEs: "Diagrama de cinta",
    build(m) {
      const chunks = [];
      const P = Math.max(1, Math.round(m.p.num()));
      for (let i = 0; i < P; i++) chunks.push({ key: `x${i}`, id: "unknown", w: m.value });
      if (m.q.sign() > 0) chunks.push({ key: "q", id: "const", w: m.q });
      const parts = chunks.concat([{ key: "all", id: "total", w: m.r }]);
      return {
        parts,
        chunks,
        read() {
          const xs = chunks.filter((c) => c.id === "unknown").length;
          const extra = chunks
            .filter((c) => c.id === "const")
            .reduce((a, c) => a.add(c.w), EWL.Rat.ZERO);
          return EWL.Rat.parse(parts[parts.length - 1].w)
            .sub(extra)
            .div(xs);
        },
        alt: (l) =>
          say(
            m,
            l,
            `Tape diagram: a bar of ${m.r.frac()} made of ${P} part${P > 1 ? "s" : ""} of x${m.q.sign() > 0 ? ` and a part of ${m.q.frac()}` : ""}.`,
            `Diagrama de cinta: una barra de ${m.r.frac()} formada por ${P} parte${P > 1 ? "s" : ""} de x${m.q.sign() > 0 ? ` y una parte de ${m.q.frac()}` : ""}.`,
          ),
        hits: exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { svg, fill } = Lens.U.root(
        ctx,
        600,
        150,
        ctx.t("Tape diagram", "Diagrama de cinta"),
        rep.alt(ctx.lang),
      );
      const total = m.p.mul(m.value).add(m.q).num();
      const u = 520 / total;
      let x = 40;
      rep.chunks.forEach((c) => {
        const w = c.w.num() * u;
        const isX = c.id === "unknown";
        const r = S("rect", { x, y: 62, width: w, height: 44, class: "lens-cell" });
        r.setAttribute("fill", isX ? fill.a : fill.b);
        ctx.part({
          el: r,
          id: c.id,
          key: c.key,
          label: isX
            ? ctx.t(
                `A part of size x, which is ${c.w.frac()}`,
                `Una parte de tamaño x, que es ${c.w.frac()}`,
              )
            : ctx.t(`The part ${c.w.frac()}`, `La parte ${c.w.frac()}`),
        });
        svg.appendChild(r);
        svg.appendChild(Lens.U.text(x + w / 2, 90, isX ? "x" : c.w.frac(), "lens-tiny on"));
        x += w;
      });
      const all = S(
        "g",
        null,
        S("rect", { x: 40, y: 8, width: 520, height: 40, fill: "transparent" }),
        S("path", { d: "M40 52 V28 H560 V52", class: "lens-brace" }),
        Lens.U.text(300, 22, m.r.frac(), "lens-big"),
      );
      ctx.part({
        el: all,
        id: "total",
        key: "all",
        label: ctx.t(`The whole bar, ${m.r.frac()}`, `La barra completa, ${m.r.frac()}`),
      });
      svg.appendChild(all);
      return svg;
    },
  };

  /* ---------- number line ---------- */
  fam.reps.line = {
    label: "Number line",
    labelEs: "Recta numérica",
    build(m) {
      const top = Math.max(2, Math.ceil(m.value.num()) + 1);
      const parts = [{ key: "pt", id: "unknown" }];
      return {
        parts,
        top,
        read: () => m.value,
        alt: (l) =>
          say(
            m,
            l,
            `Number line from 0 to ${top} with the solution marked.`,
            `Recta numérica de 0 a ${top} con la solución marcada.`,
          ),
        hits: exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { svg } = Lens.U.root(
        ctx,
        600,
        130,
        ctx.t("Number line", "Recta numérica"),
        rep.alt(ctx.lang),
      );
      const px = (v) => 40 + (v / rep.top) * 520;
      svg.appendChild(S("line", { x1: 40, y1: 70, x2: 560, y2: 70, class: "lens-axis" }));
      const every = rep.top > 12 ? Math.ceil(rep.top / 10) : 1;
      for (let i = 0; i <= rep.top; i += every) {
        svg.appendChild(S("line", { x1: px(i), y1: 62, x2: px(i), y2: 78, class: "lens-axis" }));
        svg.appendChild(Lens.U.text(px(i), 98, String(i), "lens-tick"));
      }
      const mx = px(m.value.num());
      const dot = S("circle", { cx: mx, cy: 70, r: 11, class: "lens-dot" });
      ctx.part({
        el: dot,
        id: "unknown",
        key: "pt",
        label: ctx.t(`The solution, x = ${m.value.frac()}`, `La solución, x = ${m.value.frac()}`),
      });
      svg.appendChild(S("path", { d: `M${mx} 40 l-8 -14 h16 z`, class: "lens-arrow" }));
      svg.appendChild(
        Lens.U.text(Math.min(Math.max(mx, 50), 550), 20, `x = ${m.value.frac()}`, "lens-big"),
      );
      svg.appendChild(dot);
      return svg;
    },
  };

  Object.assign(fam, {
    id: "equation",
    repOrder: ["balance", "tape", "line"],
    normalize,
    sentence,
    setText(spec, text) {
      const parts = String(text).replace(/\s+/g, "").toLowerCase().split("=");
      if (parts.length !== 2 || !/^\d+(\.\d+)?$/.test(parts[1])) return null;
      let p = null;
      let q = "0";
      for (const term of parts[0].split("+")) {
        const t = /^(\d*(?:\.\d+)?)x$/.exec(term);
        if (t && p === null) p = t[1] || "1";
        else if (/^\d+(\.\d+)?$/.test(term)) q = term;
        else return null;
      }
      if (p === null) return null;
      const next = Object.assign({}, spec, { p, q, r: parts[1] });
      try {
        normalize(next);
      } catch (_e) {
        return null;
      }
      return next;
    },
    describe(m, id, lang) {
      const t = (en, es) => tx(lang, en, es);
      if (id === "unknown")
        return `${t("The unknown number x is", "El número desconocido x es")} ${m.value.frac()}.`;
      if (id === "const")
        return `${t("The added amount is", "La cantidad que se suma es")} ${m.q.frac()}.`;
      if (id === "total")
        return `${t("Both sides are equal to", "Los dos lados son iguales a")} ${m.r.frac()}.`;
      return "";
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
