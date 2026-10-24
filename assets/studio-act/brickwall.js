/**
 * Practice Studio activity: brickwall (window.StudioAct kind "brickwall", lesson 6-12).
 * Bricks a wide and b tall, all laid facing the same way, build a SQUARE wall. The student sets the side of the wall and sees
 * the bricks laid: a gap shows along the side or the top where a brick does not fit. The smallest wall that is filled exactly
 * has a side equal to the least common multiple, which is NOT always the product of the two brick sizes.
 * State: { s: the side of the square wall }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const BRICKS = {
    1: [
      [3, 6],
      [4, 8],
      [2, 6],
      [5, 10],
      [4, 6],
      [6, 9],
    ],
    2: [
      [4, 6],
      [6, 8],
      [6, 9],
      [4, 10],
      [6, 10],
      [8, 12],
      [9, 12],
      [10, 15],
      [4, 14],
      [6, 15],
    ],
    3: [
      [8, 12],
      [12, 18],
      [9, 15],
      [10, 15],
      [12, 16],
      [14, 21],
      [8, 20],
      [6, 16],
      [10, 12],
      [15, 20],
    ],
    4: [
      [4, 6],
      [6, 8],
      [5, 7],
      [4, 9],
      [6, 7],
      [8, 12],
      [12, 18],
      [9, 15],
      [5, 8],
      [10, 15],
    ],
  };
  const TASKS = [
    ["A mason lays bricks", "Un albañil coloca ladrillos"],
    ["A garden club builds a wall", "Un club de jardinería construye un muro"],
    [
      "A game designer builds a castle wall",
      "Un diseñador de juegos construye el muro de un castillo",
    ],
    ["A school builds a play wall", "Una escuela construye un muro de juego"],
    ["A class builds a cardboard wall", "Una clase construye un muro de cartón"],
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    const [a0, b0] = rng.pick(/** @type {any} */ (BRICKS)[level]);
    const [a, b] = rng.chance(0.5) ? [a0, b0] : [b0, a0];
    const lcm = G.lcm(a, b);
    const tk = rng.pick(TASKS);
    return {
      q: `${tk[0]} with bricks that are ${a} wide and ${b} tall. All bricks face the same way, and none are cut. Set the side of a SQUARE wall so the bricks fill it exactly. Find the smallest square wall that works.`,
      qEs: `${tk[1]} con ladrillos de ${a} de ancho y ${b} de alto. Todos los ladrillos miran hacia el mismo lado y ninguno se corta. Elige el lado de un muro CUADRADO para que los ladrillos lo llenen exactamente. Halla el muro cuadrado más pequeño que sirve.`,
      x: `The wall's side has to be a multiple of ${a} (so the bricks fit across) and a multiple of ${b} (so they fit up the wall). The smallest such number is the least common multiple, ${lcm}.${G.gcd(a, b) > 1 ? ` It is smaller than ${a} × ${b} = ${a * b} because ${a} and ${b} share a factor.` : ""}`,
      xEs: `El lado del muro tiene que ser múltiplo de ${a} (para que los ladrillos quepan a lo ancho) y múltiplo de ${b} (para que quepan hacia arriba). El menor de esos números es el mínimo común múltiplo, ${lcm}.${G.gcd(a, b) > 1 ? ` Es menor que ${a} × ${b} = ${a * b} porque ${a} y ${b} comparten un factor.` : ""}`,
      h: [
        "Look at the gaps. A gap along the side means the bricks do not fit across. A gap along the top means they do not fit going up.",
        "The side of the wall must work for the width of a brick AND for the height of a brick at the same time.",
        "List the sides that fit across, then the sides that fit going up. Look for the first number that is in both lists.",
      ],
      hEs: [
        "Mira los huecos. Un hueco a un lado significa que los ladrillos no caben a lo ancho. Un hueco arriba significa que no caben hacia arriba.",
        "El lado del muro debe servir para el ancho de un ladrillo Y para el alto de un ladrillo al mismo tiempo.",
        "Haz la lista de los lados que caben a lo ancho y luego los que caben hacia arriba. Busca el primer número que está en las dos listas.",
      ],
      model: { a, b, lcm, level },
    };
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
    const { a, b, lcm } = spec.model;
    const s = Number((st || {}).s || 0);
    if (!s)
      return bad("empty", "Set the side of the wall first.", "Primero elige el lado del muro.");
    const across = s % a === 0;
    const up = s % b === 0;
    if (!across && !up)
      return bad(
        "gap-both",
        "There is a gap along the side and along the top. The bricks do not fit across or going up.",
        "Hay un hueco a un lado y arriba. Los ladrillos no caben a lo ancho ni hacia arriba.",
      );
    if (!across)
      return bad(
        "gap-side",
        "There is a gap along the side. The bricks do not fit across this wall without cutting one.",
        "Hay un hueco a un lado. Los ladrillos no caben a lo ancho de este muro sin cortar uno.",
      );
    if (!up)
      return bad(
        "gap-top",
        "There is a gap along the top. The bricks do not fit going up this wall without cutting one.",
        "Hay un hueco arriba. Los ladrillos no caben hacia arriba en este muro sin cortar uno.",
      );
    if (s === lcm) return { ok: true };
    if (s === a * b)
      return bad(
        "product",
        "This wall is filled exactly, but a smaller square wall is also filled exactly. The two brick sizes share a factor.",
        "Este muro queda lleno exactamente, pero un muro cuadrado más pequeño también queda lleno exactamente. Los dos tamaños de ladrillo comparten un factor.",
      );
    return bad(
      "not-smallest",
      "This wall is filled exactly, but it is not the smallest. A smaller square wall also works.",
      "Este muro queda lleno exactamente, pero no es el más pequeño. Un muro cuadrado más pequeño también sirve.",
    );
  }
  const solution = (/** @type {any} */ spec) => ({ s: spec.model.lcm });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const { a, b, lcm } = spec.model;
    /** @type {any[]} */
    const c = [
      { s: a * b },
      { s: lcm * 2 },
      { s: a },
      { s: b },
      { s: Math.max(a, b) + 1 },
      { s: 0 },
      { s: lcm + a },
      { s: lcm - 1 },
    ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.bw-wall{position:relative;width:100%;max-width:460px;aspect-ratio:1/1;border:3px solid var(--ink,#1B2733);background:var(--surface,#fff);overflow:hidden}
.bw-b{position:absolute;box-sizing:border-box;border:1px solid var(--ink,#1B2733);background:color-mix(in srgb,var(--sun,#F0BD4F) 70%,var(--surface,#fff))}
.bw-b.alt{background:color-mix(in srgb,var(--brand,#2C4A68) 35%,var(--surface,#fff))}
.bw-gap{position:absolute;box-sizing:border-box;background-image:repeating-linear-gradient(45deg,transparent 0 5px,var(--bad,#B42318) 5px 6px);outline:2px dashed var(--bad,#B42318);outline-offset:-3px}
.bw-ctl{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
@media (forced-colors:active){.bw-wall,.bw-b{border-color:CanvasText}.bw-b{background:Canvas}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const { a, b } = spec.model;
    K.mount(host, spec, api, {
      kind: "brickwall",
      css: CSS,
      def,
      okEn: "The bricks fill the smallest square wall exactly.",
      okEs: "Los ladrillos llenan exactamente el muro cuadrado más pequeño.",
      init: (/** @type {any} */ s) => ({ s: Math.max(0, Math.min(60, Number(s.s || 0))) }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const head = el(
          "p",
          "k-note",
          T(`Bricks: ${a} wide, ${b} tall.`, `Ladrillos: ${a} de ancho, ${b} de alto.`),
        );
        const wall = el("div", "bw-wall", "", {
          role: "img",
          "aria-label": st.s
            ? L(
                `A square wall with side ${st.s} and the bricks laid in it`,
                `Un muro cuadrado de lado ${st.s} con los ladrillos colocados`,
              )
            : L("No wall yet", "Todavía no hay muro"),
        });
        if (st.s) {
          const cols = Math.floor(st.s / a);
          const rows = Math.floor(st.s / b);
          const rect = (
            /** @type {string} */ cls,
            /** @type {number} */ x,
            /** @type {number} */ y,
            /** @type {number} */ w,
            /** @type {number} */ h,
          ) => {
            const d = el("div", cls);
            d.style.left = `${(x / st.s) * 100}%`;
            d.style.bottom = `${(y / st.s) * 100}%`;
            d.style.width = `${(w / st.s) * 100}%`;
            d.style.height = `${(h / st.s) * 100}%`;
            wall.append(d);
          };
          for (let r = 0; r < rows; r++)
            for (let q = 0; q < cols; q++)
              rect(`bw-b${(r + q) % 2 ? " alt" : ""}`, q * a, r * b, a, b);
          if (st.s - cols * a > 0) rect("bw-gap", cols * a, 0, st.s - cols * a, st.s);
          if (st.s - rows * b > 0) rect("bw-gap", 0, rows * b, cols * a, st.s - rows * b);
        }
        const ctl = K.box("The side of the square wall", "El lado del muro cuadrado");
        const row = el("div", "bw-ctl");
        const set = (/** @type {number} */ d, /** @type {string} */ key) => () => {
          st.s = Math.max(1, Math.min(60, (st.s || Math.max(a, b)) + d));
          c.change(key);
        };
        row.append(
          K.btn("−5", "", set(-5, "m5"), { key: "m5", label: L("Smaller by 5", "5 menos") }),
          K.btn("−1", "", set(-1, "m1"), { key: "m1", label: L("Smaller by 1", "1 menos") }),
          el("span", "k-big", st.s ? String(st.s) : "?"),
          K.btn("+1", "", set(1, "p1"), { key: "p1", label: L("Bigger by 1", "1 más") }),
          K.btn("+5", "", set(5, "p5"), { key: "p5", label: L("Bigger by 5", "5 más") }),
        );
        ctl.append(row);
        view.append(head, wall, ctl);
      },
    });
  }

  const def = {
    title: "Brick wall",
    titleEs: "Muro de ladrillos",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("brickwall", def);
})();
