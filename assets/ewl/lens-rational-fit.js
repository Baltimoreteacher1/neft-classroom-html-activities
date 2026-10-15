/* EWL.Lens family "rational", part 3: "how many fit" — an amount cut into groups of a size (fraction division).
 * Spec adds per:"1/2" (the group size). The picture reads back count x size + leftover = the amount.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  const fam = (Lens.reg.rational = Lens.reg.rational || {});
  fam.reps = fam.reps || {};
  const H = () => Lens.RH;

  fam.reps.fit = {
    label: "How many fit",
    labelEs: "Cuántos caben",
    available(m) {
      if (!m.per) return "needs a group size";
      return m.value.isZero() || m.value.div(m.per).cmp(24) > 0 ? "too many groups" : null;
    },
    build(m) {
      const R = EWL.Rat;
      const count = Number(m.value.div(m.per).floor());
      const parts = [];
      for (let i = 0; i < count; i++) {
        const p = H().mk(m.per.mul(i), m.per.mul(i + 1));
        parts.push(Object.assign(p, { key: `f${i}`, i, full: true }));
      }
      const rest = m.value.sub(m.per.mul(count));
      if (rest.sign() > 0) {
        const p = H().mk(m.per.mul(count), m.value);
        parts.push(Object.assign(p, { key: "fr", i: count, full: false }));
      }
      return {
        parts,
        count,
        rest,
        read: () => R.of(count).mul(m.per).add(rest),
        alt: (l) =>
          H().say(
            m,
            l,
            `A bar of length ${m.value.frac()} cut into pieces of ${m.per.frac()}. ${count} whole pieces fit.`,
            `Una barra de largo ${m.value.frac()} cortada en piezas de ${m.per.frac()}. Caben ${count} piezas completas.`,
          ),
        hits: H().hitsOf(parts),
      };
    },
    draw(rep, ctx) {
      const S = EWL.svg;
      const m = ctx.model;
      const { X0, AW } = H();
      const { svg, fill } = Lens.U.root(
        ctx,
        600,
        120,
        ctx.t("How many fit", "Cuántos caben"),
        rep.alt(ctx.lang),
      );
      const px = (r) => X0 + (r.num() / m.value.num()) * AW;
      rep.parts.forEach((p) => {
        const r = S("rect", {
          x: px(p.from),
          y: 40,
          width: px(p.to) - px(p.from),
          height: 40,
          class: "lens-cell",
        });
        r.setAttribute("fill", p.full ? fill.b : "none");
        r.setAttribute("data-filled", p.full ? "1" : "0");
        ctx.part({
          el: r,
          id: p.id,
          key: p.key,
          label: p.full
            ? ctx.t(
                `Group ${p.i + 1} of size ${m.per.frac()}`,
                `Grupo ${p.i + 1} de tamaño ${m.per.frac()}`,
              )
            : ctx.t("Leftover piece", "Pieza sobrante"),
        });
        svg.appendChild(r);
        if (p.full)
          svg.appendChild(
            Lens.U.text((px(p.from) + px(p.to)) / 2, 66, String(p.i + 1), "lens-tiny on"),
          );
      });
      svg.appendChild(Lens.U.text(X0, 106, "0", "lens-tick"));
      svg.appendChild(Lens.U.text(X0 + AW, 106, m.value.frac(), "lens-tick"));
      const head = ctx.t(
        `${rep.count} groups of ${m.per.frac()} fit in ${m.value.frac()}`,
        `${rep.count} grupos de ${m.per.frac()} caben en ${m.value.frac()}`,
      );
      svg.appendChild(Lens.U.text(X0 + AW / 2, 22, head, "lens-big"));
      return svg;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
