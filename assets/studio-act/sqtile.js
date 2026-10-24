/**
 * Practice Studio activity: sqtile (window.StudioAct kind "sqtile", lesson 6-7).
 * The largest square tile for a rectangular floor. The student cuts the biggest squares that fit off the floor, again and
 * again, on a picture of the floor, until nothing is left over, then names the side of the largest tile that fills the
 * whole floor with no gaps. A square that is too tall for the strip, or smaller than the biggest that fits, is flagged.
 * State: { cuts: number[] (the side of each round of squares), ans: the tile side as text }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /** one round of cuts on a w by h strip (w >= h): the side, how many squares, and the strip that is left */
  const rounds = (/** @type {number} */ w0, /** @type {number} */ h0) => {
    let w = Math.max(w0, h0);
    let h = Math.min(w0, h0);
    /** @type {{s:number,k:number}[]} */
    const out = [];
    while (w > 0 && h > 0) {
      const k = Math.floor(w / h);
      out.push({ s: h, k });
      const r = w - k * h;
      if (r === 0) break;
      w = Math.max(h, r);
      h = Math.min(h, r);
    }
    return out;
  };
  /** replay the student's cuts: where it stands, which cuts are not the biggest square that fits */
  function replay(
    /** @type {number} */ w0,
    /** @type {number} */ h0,
    /** @type {number[]} */ cuts,
  ) {
    let w = Math.max(w0, h0);
    let h = Math.min(w0, h0);
    let done = false;
    for (let i = 0; i < cuts.length; i++) {
      if (done || cuts[i] !== h) return { w, h, done, badAt: i };
      const r = w - Math.floor(w / h) * h;
      if (r === 0) done = true;
      else {
        w = Math.max(h, r);
        h = Math.min(h, r);
      }
    }
    return { w, h, done, badAt: -1 };
  }

  const PLACES = [
    ["floor", "piso", "ft", "pies", "Un"],
    ["patio", "patio", "ft", "pies", "Un"],
    ["garden bed", "cantero", "ft", "pies", "Un"],
    ["banner", "pancarta", "in", "pulgadas", "Una"],
    ["quilt", "colcha", "in", "pulgadas", "Una"],
    ["gym mat", "tapete de gimnasio", "ft", "pies", "Un"],
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 1000; t++) {
      const p = rng.int(1, 8);
      const q = rng.int(p + 1, 9);
      if (G.gcd(p, q) !== 1) continue;
      const n = rounds(p, q).length;
      if (
        (level === 1 && !(p === 1 && n === 1)) ||
        (level === 2 && n !== 2) ||
        (level >= 3 && n !== 3)
      )
        continue;
      const g = rng.int(level === 1 ? 3 : 2, Math.max(3, Math.floor(60 / q)));
      const [L, Wd] = [g * q, g * p];
      if (L > 60 || (level === 4 && g < 3)) continue;
      const pl = rng.pick(PLACES);
      const seq = rounds(L, Wd);
      return {
        q: `A ${pl[0]} is ${L} ${pl[2]} long and ${Wd} ${pl[2]} wide. It will be covered with square tiles that are all the same size, with no gaps and no cutting. Cut the biggest squares you can, round after round, until nothing is left. Then name the side of the largest tile that works.`,
        qEs: `${pl[4]} ${pl[1]} mide ${L} ${pl[3]} de largo y ${Wd} ${pl[3]} de ancho. Se va a cubrir con baldosas cuadradas del mismo tamaño, sin huecos y sin cortar. Corta los cuadrados más grandes que puedas, ronda tras ronda, hasta que no sobre nada. Luego di el lado de la baldosa más grande que sirve.`,
        x: `Cut ${seq.map((r) => `${r.k} square${r.k > 1 ? "s" : ""} of side ${r.s}`).join(", then ")}. The last squares fill what is left exactly, so the largest tile has side ${g}, the greatest common factor of ${L} and ${Wd}.`,
        xEs: `Corta ${seq.map((r) => `${r.k} cuadrado${r.k > 1 ? "s" : ""} de lado ${r.s}`).join(", y luego ")}. Los últimos cuadrados llenan exactamente lo que queda, así que la baldosa más grande tiene lado ${g}, el máximo común divisor de ${L} y ${Wd}.`,
        h: [
          "A square tile that fits the whole floor must also fit every piece you cut off.",
          "After you cut the biggest squares, look at the strip that is left. Cut the biggest squares from that strip too.",
          "Keep going until the strip that is left is filled by squares with nothing over. Which tile fills that last piece?",
        ],
        hEs: [
          "Una baldosa cuadrada que cabe en todo el piso también debe caber en cada pedazo que cortas.",
          "Después de cortar los cuadrados más grandes, mira la tira que queda. Corta también los cuadrados más grandes de esa tira.",
          "Sigue hasta que la tira que queda se llene con cuadrados sin que sobre nada. ¿Qué baldosa llena ese último pedazo?",
        ],
        model: { L, Wd, g, seq, unit: pl[2], unitEs: pl[3], level },
      };
    }
    throw new Error(`sqtile: no task for L${level}`);
  }

  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({
    ok: false,
    tag,
    say,
    sayEs,
  });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    st = st || {};
    const cuts = (st.cuts || []).map(Number);
    if (!cuts.length)
      return bad(
        "empty",
        "Cut the biggest squares that fit off the floor first.",
        "Primero corta del piso los cuadrados más grandes que quepan.",
      );
    const r = replay(m.L, m.Wd, cuts);
    if (r.badAt >= 0)
      return bad(
        "bad-cut",
        "One of the cuts is not the biggest square that fits in what was left. Start again from the floor.",
        "Uno de los cortes no es el cuadrado más grande que cabe en lo que quedaba. Empieza otra vez desde el piso.",
      );
    if (!r.done)
      return bad(
        "keep-cutting",
        "There is still a strip left over. Keep cutting the biggest squares from it until nothing is left.",
        "Todavía sobra una tira. Sigue cortando de ella los cuadrados más grandes hasta que no sobre nada.",
      );
    if (String(st.ans ?? "").trim() === "")
      return bad(
        "empty",
        "Type the side of the largest tile.",
        "Escribe el lado de la baldosa más grande.",
      );
    const t = G.value(st.ans);
    if (Number.isNaN(t))
      return bad(
        "format",
        "Write the side as a whole number.",
        "Escribe el lado como número entero.",
      );
    if (t === m.g) return { ok: true };
    if (t === cuts[0] && t !== m.g)
      return bad(
        "first-square",
        "The first square does not fit the strip that was left over. A tile for the whole floor has to fit every piece you cut.",
        "El primer cuadrado no cabe en la tira que sobró. Una baldosa para todo el piso tiene que caber en cada pedazo que cortaste.",
      );
    if (t === m.L * m.Wd)
      return bad(
        "area",
        "That number is the area. A tile side is a length, and it cannot be longer than the shorter side of the floor.",
        "Ese número es el área. El lado de una baldosa es una longitud y no puede ser mayor que el lado más corto del piso.",
      );
    if (t > Math.min(m.L, m.Wd))
      return bad(
        "too-big",
        "A tile cannot be longer than the shorter side of the floor.",
        "Una baldosa no puede ser más larga que el lado más corto del piso.",
      );
    return bad(
      "not-last",
      "Check your answer against the last pieces you cut. Which square fills the last piece exactly?",
      "Compara tu respuesta con los últimos pedazos que cortaste. ¿Qué cuadrado llena exactamente el último pedazo?",
    );
  }
  const solution = (/** @type {any} */ spec) => ({
    cuts: spec.model.seq.map((/** @type {any} */ r) => r.s * 1),
    ans: String(spec.model.g),
  });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const s = solution(spec);
    /** @type {any[]} */
    const c = [
      { cuts: [], ans: "" },
      { ...s, ans: String(s.cuts[0]) },
      { ...s, ans: String(m.L * m.Wd) },
      { ...s, ans: "" },
      { cuts: [m.Wd + 1], ans: String(m.g) },
      { cuts: s.cuts.slice(0, -1), ans: String(m.g) },
      { ...s, ans: String(m.Wd + m.L) },
    ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.sq-floor{position:relative;width:100%;max-width:520px;border:3px solid var(--ink,#1B2733);border-radius:8px;overflow:hidden;background:var(--surface,#fff)}
.sq-sq{position:absolute;box-sizing:border-box;border:2px solid var(--ink,#1B2733);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem}
.sq-left{position:absolute;box-sizing:border-box;background-image:repeating-linear-gradient(45deg,transparent 0 6px,var(--brand,#2C4A68) 6px 7px);outline:2px dashed var(--ink,#1B2733);outline-offset:-4px}
.sq-c0{background:color-mix(in srgb,var(--sun,#F0BD4F) 80%,var(--surface,#fff))}
.sq-c1{background:color-mix(in srgb,var(--brand,#2C4A68) 40%,var(--surface,#fff))}
.sq-c2{background:color-mix(in srgb,var(--ok,#0A7D4B) 35%,var(--surface,#fff))}
.sq-step{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
@media (forced-colors:active){.sq-floor,.sq-sq{border-color:CanvasText}.sq-c0,.sq-c1,.sq-c2{background:Canvas}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const m = spec.model;
    let side = Math.min(m.L, m.Wd);
    let flag = "";
    K.mount(host, spec, api, {
      kind: "sqtile",
      css: CSS,
      def,
      okEn: "You cut until nothing was left and found the largest tile.",
      okEs: "Cortaste hasta que no sobró nada y encontraste la baldosa más grande.",
      init: (/** @type {any} */ b) => ({
        cuts: Array.isArray(b.cuts) ? b.cuts.map(Number) : [],
        ans: String(b.ans ?? ""),
      }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const unit = L(m.unit, m.unitEs);
        const head = el(
          "p",
          "k-note",
          T(
            `The floor is ${m.L} by ${m.Wd} ${m.unit}.`,
            `El piso mide ${m.L} por ${m.Wd} ${m.unitEs}.`,
          ),
        );
        const floor = el("div", "sq-floor", "", {
          role: "img",
          "aria-label": L(
            `Picture of the ${m.L} by ${m.Wd} floor with the squares you have cut`,
            `Dibujo del piso de ${m.L} por ${m.Wd} con los cuadrados que has cortado`,
          ),
        });
        const big = Math.max(m.L, m.Wd);
        const small = Math.min(m.L, m.Wd);
        floor.style.aspectRatio = `${big} / ${small}`;
        const place = (
          /** @type {string} */ cls,
          /** @type {number} */ x,
          /** @type {number} */ y,
          /** @type {number} */ w,
          /** @type {number} */ h,
          /** @type {string} */ txt,
        ) => {
          const d = el("div", cls, txt);
          d.style.left = `${(x / big) * 100}%`;
          d.style.top = `${(y / small) * 100}%`;
          d.style.width = `${(w / big) * 100}%`;
          d.style.height = `${(h / small) * 100}%`;
          floor.append(d);
        };
        let [x, y, w, h] = [0, 0, big, small];
        let done = false;
        st.cuts.forEach((/** @type {number} */ s, /** @type {number} */ i) => {
          if (done || s !== Math.min(w, h)) return;
          const along = w >= h;
          const k = Math.floor((along ? w : h) / s);
          for (let j = 0; j < k; j++)
            place(
              `sq-sq sq-c${i % 3}`,
              along ? x + j * s : x,
              along ? y : y + j * s,
              s,
              s,
              String(s),
            );
          if (along) {
            x += k * s;
            w -= k * s;
          } else {
            y += k * s;
            h -= k * s;
          }
          if (w === 0 || h === 0) done = true;
        });
        if (!done) place("sq-left", x, y, w, h, "");
        const step = K.box(
          "Cut the biggest squares that fit",
          "Corta los cuadrados más grandes que quepan",
        );
        const row = el("div", "sq-step");
        const shown = el("span", "k-big", `${side}`);
        row.append(
          K.btn(
            "−",
            "",
            () => {
              side = Math.max(1, side - 1);
              flag = "";
              c.update("less");
            },
            { key: "less", label: L("Smaller square", "Cuadrado más pequeño") },
          ),
          shown,
          K.btn(
            "+",
            "",
            () => {
              side = Math.min(big, side + 1);
              flag = "";
              c.update("more");
            },
            { key: "more", label: L("Bigger square", "Cuadrado más grande") },
          ),
          el("span", "k-note", unit),
          K.btn(
            "Cut",
            "Cortar",
            () => {
              const cur = Math.min(w, h);
              if (done) flag = L("Nothing is left to cut.", "No queda nada por cortar.");
              else if (side > cur)
                flag = L(
                  "That square is too tall for the strip. It does not fit.",
                  "Ese cuadrado es demasiado alto para la tira. No cabe.",
                );
              else if (side < cur)
                flag = L(
                  "A bigger square still fits. Try a bigger side.",
                  "Todavía cabe un cuadrado más grande. Prueba un lado mayor.",
                );
              else {
                flag = "";
                st.cuts.push(side);
                c.change("cut");
                return;
              }
              c.update("cut");
            },
            { key: "cut" },
          ),
          K.btn(
            "Undo",
            "Deshacer",
            () => {
              st.cuts.pop();
              flag = "";
              c.change("undo");
            },
            { key: "undo" },
          ),
        );
        step.append(row);
        if (flag) step.append(el("p", "k-note", flag, { role: "status" }));
        const ans = K.box(
          "The side of the largest tile that fills the whole floor",
          "El lado de la baldosa más grande que llena todo el piso",
        );
        const r2 = el("div", "k-row");
        r2.append(
          K.field(
            st.ans,
            L("Side of the largest tile", "Lado de la baldosa más grande"),
            (/** @type {string} */ v) => {
              st.ans = v;
              c.fb.hidden = true;
              if (api.change) api.change(K.clone(st));
            },
            { key: "ans" },
          ),
          el("span", "k-note", unit),
        );
        ans.append(r2);
        view.append(head, floor, step, ans);
      },
    });
  }

  const def = {
    title: "Largest square tile",
    titleEs: "La baldosa cuadrada más grande",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("sqtile", def);
})();
