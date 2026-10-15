/* EWL.Lens family "scale": a scale factor k (1 to 5) and what it does to length, area and volume.
 * Pictures: grid of unit squares, stack of unit cubes, table. Highlight ids: "len", "area", "vol".
 * Spec: { family:"scale", k:"3", edge?:"1" } — edge is the length of the original side (default 1).
 * Each picture reads k back by counting its own parts, and checks squares = k^2 and cubes = k^3.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.scale = Lens.reg.scale || {});
  fam.reps = fam.reps || {};
  const tx = (...a) => Lens.tx(...a);
  const IDS = ["len", "area", "vol"];
  const exact = (parts) => (id) =>
    IDS.indexOf(id) >= 0 ? parts.filter((p) => p.id === id).map((p) => p.id) : [];

  function normalize(spec) {
    const R = EWL.Rat;
    const k = R.parse(spec.k);
    const edge = R.parse(spec.edge == null ? "1" : spec.edge);
    if (!k || !k.isInt() || k.cmp(1) < 0 || k.cmp(5) > 0)
      throw new RangeError("scale: k is a whole number from 1 to 5");
    if (!edge || edge.sign() <= 0) throw new RangeError("scale: edge must be positive");
    return { spec: Object.assign({}, spec), value: k, k: Number(k.n), edge };
  }
  const say = (m, l, en, es) =>
    `${tx(l, en, es)} ${tx(l, "The scale factor is", "El factor de escala es")} ${m.k}.`;

  /* ---------- squares ---------- */
  fam.reps.squares = {
    label: "Squares (area)",
    labelEs: "Cuadrados (área)",
    build(m) {
      const parts = [
        { key: "edge", id: "len" },
        { key: "grid", id: "area" },
      ];
      return {
        parts,
        cells: m.k * m.k,
        read() {
          const e = Math.round(Math.sqrt(m.k * m.k));
          return e * e === m.k * m.k ? EWL.Rat.of(e) : null;
        },
        alt: (l) =>
          say(
            m,
            l,
            `A square ${m.k} long on each side is made of ${m.k * m.k} unit squares, ${m.k} times ${m.k}.`,
            `Un cuadrado de ${m.k} de lado se forma con ${m.k * m.k} cuadrados unidad, ${m.k} por ${m.k}.`,
          ),
        hits: exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { svg, fill } = Lens.U.root(
        ctx,
        420,
        260,
        ctx.t("Squares", "Cuadrados"),
        rep.alt(ctx.lang),
      );
      const c = Math.min(48, 190 / m.k);
      const x0 = 120;
      const y0 = 20;
      const one = S("rect", {
        x: 16,
        y: y0 + 170 - 36,
        width: 36,
        height: 36,
        class: "lens-cell lens-quiet",
        fill: "none",
      });
      svg.appendChild(one);
      svg.appendChild(Lens.U.text(34, y0 + 190, ctx.t("1 square", "1 cuadrado"), "lens-tiny"));
      const area = S("g", null);
      for (let i = 0; i < m.k * m.k; i++) {
        const r = S("rect", {
          x: x0 + (i % m.k) * c,
          y: y0 + Math.floor(i / m.k) * c,
          width: c,
          height: c,
          class: "lens-cell",
        });
        r.setAttribute("fill", fill.a);
        area.appendChild(r);
      }
      ctx.part({
        el: area,
        id: "area",
        key: "grid",
        label: ctx.t(`${m.k * m.k} unit squares`, `${m.k * m.k} cuadrados unidad`),
      });
      svg.appendChild(area);
      const by = y0 + m.k * c + 14;
      const edge = S(
        "g",
        null,
        S("rect", { x: x0, y: by - 10, width: m.k * c, height: 28, fill: "transparent" }),
        S("path", { d: `M${x0} ${by} V${by + 8} H${x0 + m.k * c} V${by}`, class: "lens-brace" }),
        Lens.U.text(x0 + (m.k * c) / 2, by + 24, `${m.k}`, "lens-tick"),
      );
      ctx.part({
        el: edge,
        id: "len",
        key: "edge",
        label: ctx.t(`Each side is ${m.k} long`, `Cada lado mide ${m.k}`),
      });
      svg.appendChild(edge);
      svg.appendChild(Lens.U.text(335, 110, `${m.k} × ${m.k} = ${m.k * m.k}`, "lens-big"));
      svg.appendChild(Lens.U.text(335, 136, ctx.t("squares", "cuadrados"), "lens-tiny"));
      return svg;
    },
  };

  /* ---------- cubes ---------- */
  fam.reps.cubes = {
    label: "Cubes (volume)",
    labelEs: "Cubos (volumen)",
    build(m) {
      const parts = [
        { key: "edge", id: "len" },
        { key: "front", id: "area" },
        { key: "all", id: "vol" },
      ];
      return {
        parts,
        cubes: m.k ** 3,
        read() {
          const e = Math.round(Math.cbrt(m.k * m.k * m.k));
          return e * e * e === m.k * m.k * m.k ? EWL.Rat.of(e) : null;
        },
        alt: (l) =>
          say(
            m,
            l,
            `A cube ${m.k} long on each edge is built from ${m.k ** 3} unit cubes, ${m.k} layers of ${m.k * m.k}.`,
            `Un cubo de ${m.k} por arista se arma con ${m.k ** 3} cubos unidad, ${m.k} capas de ${m.k * m.k}.`,
          ),
        hits: exact(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { svg, fill } = Lens.U.root(ctx, 420, 280, ctx.t("Cubes", "Cubos"), rep.alt(ctx.lang));
      const s = Math.min(42, 170 / m.k);
      const ox = s * 0.45;
      const oy = s * 0.45;
      const x0 = 40;
      const y0 = 40 + m.k * oy;
      const all = S("g", null);
      const poly = (pts, cls, f) => {
        const p = S("path", { d: `M${pts.join(" L")} Z`, class: `lens-face ${cls}` });
        if (f) p.setAttribute("fill", f);
        return p;
      };
      for (let d = m.k - 1; d >= 0; d--) {
        for (let r = m.k - 1; r >= 0; r--) {
          for (let c = 0; c < m.k; c++) {
            const x = x0 + c * s + d * ox;
            const y = y0 + r * s - d * oy;
            all.appendChild(
              poly(
                [`${x} ${y}`, `${x + s} ${y}`, `${x + s} ${y + s}`, `${x} ${y + s}`],
                "lens-face-f",
                fill.a,
              ),
            );
            all.appendChild(
              poly(
                [`${x} ${y}`, `${x + ox} ${y - oy}`, `${x + s + ox} ${y - oy}`, `${x + s} ${y}`],
                "lens-face-t",
                fill.a,
              ),
            );
            all.appendChild(
              poly(
                [
                  `${x + s} ${y}`,
                  `${x + s + ox} ${y - oy}`,
                  `${x + s + ox} ${y + s - oy}`,
                  `${x + s} ${y + s}`,
                ],
                "lens-face-r",
                fill.a,
              ),
            );
          }
        }
      }
      ctx.part({
        el: all,
        id: "vol",
        key: "all",
        label: ctx.t(`${m.k ** 3} unit cubes`, `${m.k ** 3} cubos unidad`),
      });
      svg.appendChild(all);
      const front = S("rect", {
        x: x0,
        y: y0,
        width: m.k * s,
        height: m.k * s,
        fill: "transparent",
        class: "lens-cell lens-over",
      });
      ctx.part({
        el: front,
        id: "area",
        key: "front",
        label: ctx.t(
          `The front face, ${m.k * m.k} squares`,
          `La cara de frente, ${m.k * m.k} cuadrados`,
        ),
      });
      svg.appendChild(front);
      const by = y0 + m.k * s + 16;
      const edge = S(
        "g",
        null,
        S("rect", { x: x0, y: by - 10, width: m.k * s, height: 28, fill: "transparent" }),
        S("path", { d: `M${x0} ${by} V${by + 8} H${x0 + m.k * s} V${by}`, class: "lens-brace" }),
        Lens.U.text(x0 + (m.k * s) / 2, by + 24, `${m.k}`, "lens-tick"),
      );
      ctx.part({
        el: edge,
        id: "len",
        key: "edge",
        label: ctx.t(`Each edge is ${m.k} long`, `Cada arista mide ${m.k}`),
      });
      svg.appendChild(edge);
      svg.appendChild(Lens.U.text(335, 110, `${m.k} × ${m.k} × ${m.k} = ${m.k ** 3}`, "lens-big"));
      svg.appendChild(Lens.U.text(335, 136, ctx.t("cubes", "cubos"), "lens-tiny"));
      return svg;
    },
  };

  /* ---------- table ---------- */
  fam.reps.table = {
    label: "Table of scale",
    labelEs: "Tabla de escala",
    build(m) {
      const R = EWL.Rat;
      const rows = [
        { key: "len", id: "len", pow: 1 },
        { key: "area", id: "area", pow: 2 },
        { key: "vol", id: "vol", pow: 3 },
      ].map((r) => Object.assign(r, { before: m.edge.pow(r.pow), times: R.of(m.k).pow(r.pow) }));
      return {
        parts: rows,
        rows,
        read: () => {
          const [a, b, c] = rows.map((r) => r.times);
          return b.eq(a.mul(a)) && c.eq(a.mul(a).mul(a)) ? a : null;
        },
        alt: (l) =>
          say(
            m,
            l,
            `Table: length is multiplied by ${m.k}, area by ${m.k ** 2}, volume by ${m.k ** 3}.`,
            `Tabla: la longitud se multiplica por ${m.k}, el área por ${m.k ** 2}, el volumen por ${m.k ** 3}.`,
          ),
        hits: exact(rows),
      };
    },
    draw(rep, ctx) {
      const h = EWL.h;
      const names = {
        len: ctx.t("Length", "Longitud"),
        area: ctx.t("Area", "Área"),
        vol: ctx.t("Volume", "Volumen"),
      };
      const body = rep.rows.map((r) => {
        const btn = h("button", { type: "button", class: "lens-rowbtn" }, names[r.id]);
        const tr = h(
          "tr",
          null,
          h("th", { scope: "row" }, btn),
          h("td", null, Lens.fmt(r.before)),
          h("td", null, Lens.fmt(r.before.mul(r.times))),
          h("td", { class: "lens-mult" }, `×${Lens.fmt(r.times)}`),
        );
        ctx.part({
          el: btn,
          marks: [tr],
          id: r.id,
          key: r.key,
          label: ctx.t(
            `${names[r.id]} is multiplied by ${r.times.frac()}`,
            `${names[r.id]} se multiplica por ${r.times.frac()}`,
          ),
        });
        return tr;
      });
      const th = (t) => h("th", { scope: "col" }, t);
      return h(
        "table",
        { class: "lens-table", "aria-label": rep.alt(ctx.lang) },
        h("caption", null, ctx.t("What a scale factor does", "Qué hace un factor de escala")),
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            th(ctx.t("Measure", "Medida")),
            th(ctx.t("Before", "Antes")),
            th(ctx.t("After", "Después")),
            th(ctx.t("Times", "Veces")),
          ),
        ),
        h("tbody", null, body),
      );
    },
  };

  Object.assign(fam, {
    id: "scale",
    repOrder: ["squares", "cubes", "table"],
    normalize,
    setText(spec, text) {
      const k = EWL.Rat.parse(text);
      if (!k || !k.isInt() || k.cmp(1) < 0 || k.cmp(5) > 0) return null;
      return Object.assign({}, spec, { k: k.frac() });
    },
    describe(m, id, lang) {
      const t = (en, es) => tx(lang, en, es);
      const R = EWL.Rat.of(m.k);
      if (id === "len")
        return `${t("Every length is multiplied by", "Cada longitud se multiplica por")} ${m.k}.`;
      if (id === "area")
        return `${t("Every area is multiplied by", "Cada área se multiplica por")} ${m.k} × ${m.k} = ${R.pow(2).frac()}.`;
      if (id === "vol")
        return `${t("Every volume is multiplied by", "Cada volumen se multiplica por")} ${m.k} × ${m.k} × ${m.k} = ${R.pow(3).frac()}.`;
      return "";
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
