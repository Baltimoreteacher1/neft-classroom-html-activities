/**
 * Practice Studio activity: tiles (algebra tiles, 6.AT.7). Variable x only, integer coefficients.
 * Modes: combine (group like tiles, type the shorter expression), equivalent (build an arrangement from a bank),
 * simplify (copy a group n times, combine, type). Graded by evaluating at test values AND requiring no like terms.
 * State: combine { g: [{k, q}], ans }, simplify { c, g, ans }, equivalent { m: [x, -x, 1, -1 counts] }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const MINUS = "−";
  const _TIMES = "×";
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const esc = (/** @type {any} */ s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c,
    );
  const sgn = (/** @type {number} */ n) => (n < 0 ? MINUS : "");
  /** terms: [{k: "x" | "u", c: signed count}] */
  const termText = (/** @type {any} */ t) =>
    t.k === "x" ? (Math.abs(t.c) === 1 ? "x" : `${Math.abs(t.c)}x`) : String(Math.abs(t.c));
  const termsText = (/** @type {any[]} */ ts) =>
    ts.map((t, i) => (i ? ` ${t.c < 0 ? MINUS : "+"} ` : sgn(t.c)) + termText(t)).join("");
  const lin = (/** @type {number} */ a, /** @type {number} */ b) =>
    a === 0
      ? String(b).replace("-", MINUS)
      : `${a === 1 ? "" : a === -1 ? MINUS : String(a).replace("-", MINUS)}x${b ? ` ${b < 0 ? MINUS : "+"} ${Math.abs(b)}` : ""}`;
  const sum = (/** @type {any[]} */ ts, /** @type {string} */ k) =>
    ts.filter((t) => t.k === k).reduce((s, t) => s + t.c, 0);

  /* ---- generation ------------------------------------------------------------------------------------ */
  function comboTerms(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 200; t++) {
      let ts;
      if (level === 1)
        ts = [
          { k: "x", c: rng.int(1, 4) },
          { k: "u", c: rng.int(1, 4) },
          { k: "x", c: rng.int(1, 3) },
          { k: "u", c: rng.int(1, 4) },
        ];
      else if (level === 2)
        ts = [
          { k: "x", c: rng.int(1, 4) },
          { k: "u", c: rng.int(3, 6) },
          { k: "x", c: rng.int(1, 3) },
          { k: "u", c: -rng.int(1, 5) },
        ];
      else if (level === 3)
        ts = [
          { k: "x", c: rng.int(3, 6) },
          { k: "u", c: rng.int(-5, 6) || 2 },
          { k: "x", c: -rng.int(1, 4) },
          { k: "u", c: rng.int(-5, 5) || -3 },
        ];
      else
        ts = [
          { k: "x", c: rng.int(2, 5) },
          { k: "u", c: rng.int(2, 6) },
          { k: "x", c: -rng.int(1, 4) },
          { k: "u", c: -rng.int(1, 6) },
          { k: "x", c: rng.int(1, 3) },
        ];
      ts = rng.shuffle(ts);
      const a = sum(ts, "x");
      const b = sum(ts, "u");
      const tiles = ts.reduce((n, x) => n + Math.abs(x.c), 0);
      if (
        a !== 0 &&
        (b !== 0 || (level === 4 && rng.chance(0.3))) &&
        tiles <= 15 &&
        ts.every((x) => x.c !== 0)
      )
        return ts;
    }
    return [
      { k: "x", c: 2 },
      { k: "u", c: 3 },
      { k: "x", c: 1 },
      { k: "u", c: 1 },
    ];
  }
  function groupSpec(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {boolean} */ extra,
  ) {
    const n = rng.int(2, level === 1 ? 4 : 5);
    const a = rng.int(1, level === 1 ? 2 : 4);
    const c = rng.int(1, 6 + level);
    const grp = [
      { k: "x", c: level === 4 && rng.chance(0.3) ? -a : a },
      { k: "u", c: level >= 3 ? -c : c },
    ];
    const ex = extra
      ? [
          { k: "x", c: rng.int(1, 3) },
          { k: "u", c: rng.pick([-1, 1]) * rng.int(1, 5) },
        ]
      : [];
    return {
      n,
      grp,
      extra: ex,
      a: n * sum(grp, "x") + sum(ex, "x"),
      b: n * sum(grp, "u") + sum(ex, "u"),
    };
  }
  const exprOf = (/** @type {any} */ m) => {
    const head = m.n > 1 ? `${m.n}(${termsText(m.grp)})` : "";
    const tail = (m.extra || [])
      .map(
        (/** @type {any} */ t, /** @type {number} */ i) =>
          (head || i ? ` ${t.c < 0 ? MINUS : "+"} ` : sgn(t.c)) + termText(t),
      )
      .join("");
    return head + tail;
  };
  const OPEN = {
    combine: ["Combine the like terms in", "Combina los términos semejantes de"],
    equivalent: [
      "Build tiles for an expression equivalent to",
      "Arma fichas de una expresión equivalente a",
    ],
    simplify: ["Simplify", "Simplifica"],
  };

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode =
      params.mode || (level === 1 ? "combine" : rng.pick(["combine", "equivalent", "simplify"]));
    const spec = /** @type {any} */ ({ mode });
    let model;
    let expr;
    if (mode === "combine") {
      const terms = comboTerms(rng, level);
      model = { terms, a: sum(terms, "x"), b: sum(terms, "u") };
      expr = termsText(terms);
    } else if (mode === "equivalent") {
      if (level === 1) {
        const terms = [
          { k: "x", c: rng.int(1, 4) },
          { k: "x", c: rng.int(1, 4) },
          { k: "u", c: rng.int(1, 5) },
        ];
        model = {
          n: 1,
          grp: [],
          extra: rng.shuffle(terms),
          a: sum(terms, "x"),
          b: sum(terms, "u"),
        };
      } else model = groupSpec(rng, level - 1 || 1, level === 4);
      expr = exprOf(model);
    } else {
      model = groupSpec(rng, level, false);
      expr = exprOf(model);
    }
    spec.model = model;
    const target = lin(model.a, model.b);
    spec.q = `${OPEN[mode][0]} ${expr}. ${mode === "combine" ? "Tap like tiles to group them, then type the shorter expression." : mode === "equivalent" ? "Add tiles from the bank. Do not leave tiles that cancel." : "Make copies of the group, combine like tiles, then type the result."}`;
    spec.qEs = `${OPEN[mode][1]} ${expr}. ${mode === "combine" ? "Toca fichas semejantes para agruparlas y escribe la expresión más corta." : mode === "equivalent" ? "Añade fichas del banco. No dejes fichas que se cancelen." : "Haz copias del grupo, combina fichas semejantes y escribe el resultado."}`;
    const nm = (/** @type {number} */ n) => String(n).replace("-", MINUS);
    const xs =
      model.a === 0 ? "0" : `${model.a === 1 ? "" : model.a === -1 ? MINUS : nm(model.a)}x`;
    spec.x = `The x-tiles make ${xs} and the unit tiles make ${nm(model.b)}. So the expression is ${target}.`;
    spec.xEs = `Las fichas x forman ${xs} y las fichas de unidad forman ${nm(model.b)}. La expresi\u00F3n queda ${target}.`;
    spec.h =
      mode === "simplify"
        ? [
            "The number in front tells how many copies of the group to make.",
            "Every tile in the group is copied, not only the first one.",
            "Now group like tiles across all the copies and count each kind.",
          ]
        : mode === "equivalent"
          ? [
              "Each group in the bracket has the same tiles. How many groups are there?",
              "Count all the x-tiles from every group, then all the unit tiles.",
              "Build that many tiles from the bank and watch the readout.",
            ]
          : [
              "Only tiles with the same shape are like terms: x-tiles with x-tiles, units with units.",
              "A hatched tile is negative. A positive and a negative tile of the same shape cancel.",
              "Count the x-tiles (positive minus negative), then do the same for the units.",
            ];
    spec.hEs =
      mode === "simplify"
        ? [
            "El número de adelante dice cuántas copias del grupo hacer.",
            "Cada ficha del grupo se copia, no solo la primera.",
            "Ahora agrupa fichas semejantes de todas las copias y cuenta cada tipo.",
          ]
        : mode === "equivalent"
          ? [
              "Cada grupo del paréntesis tiene las mismas fichas. ¿Cuántos grupos hay?",
              "Cuenta todas las fichas x de cada grupo y luego todas las de unidad.",
              "Arma esa cantidad de fichas del banco y mira la lectura.",
            ]
          : [
              "Solo las fichas de la misma forma son semejantes: x con x, unidades con unidades.",
              "Una ficha rayada es negativa. Una positiva y una negativa de la misma forma se cancelan.",
              "Cuenta las fichas x (positivas menos negativas) y haz lo mismo con las unidades.",
            ];
    return spec;
  }

  /* ---- parsing and grading ----------------------------------------------------------------------------- */
  /** Typed expression to its terms, or null when it is not a plain sum of x-terms and numbers. */
  function parse(/** @type {string} */ raw) {
    const t = String(raw)
      .replace(/\s+/g, "")
      .replace(/[−–—]/g, "-")
      .replace(/[×·*]/g, "")
      .toLowerCase();
    if (!/^[+-]?(\d*x|\d+)([+-](\d*x|\d+))*$/.test(t)) return null;
    return (t.match(/[+-]?(\d*x|\d+)/g) || []).map((s) => {
      const neg = s[0] === "-";
      const body = s.replace(/^[+-]/, "");
      const isX = body.endsWith("x");
      const num = isX ? (body.length > 1 ? Number(body.slice(0, -1)) : 1) : Number(body);
      return { x: isX, c: neg ? -num : num };
    });
  }
  const evalTerms = (/** @type {any[]} */ ts, /** @type {number} */ v) =>
    ts.reduce((s, t) => s + t.c * (t.x ? v : 1), 0);
  const TESTS = [0, 1, 2, 3, 5, -2, 7];
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  const equals = (/** @type {any[]} */ ts, /** @type {number} */ a, /** @type {number} */ b) =>
    TESTS.every((v) => evalTerms(ts, v) === a * v + b);

  function solution(/** @type {any} */ spec) {
    const { a, b } = spec.model;
    if (spec.mode === "equivalent")
      return { m: [Math.max(a, 0), Math.max(-a, 0), Math.max(b, 0), Math.max(-b, 0)] };
    const g = [];
    if (a) g.push({ k: "x", q: a });
    if (b) g.push({ k: "u", q: b });
    const st = /** @type {any} */ ({ g, ans: lin(a, b) });
    if (spec.mode === "simplify") st.c = spec.model.n;
    return st;
  }
  function wrong(/** @type {any} */ spec) {
    const { a, b } = spec.model;
    const m = spec.model;
    if (spec.mode === "equivalent") {
      const sol = /** @type {any} */ (solution(spec)).m;
      const cands = [
        { m: [0, 0, 0, 0] },
        { m: [sol[0] + 1, sol[1] + 1, sol[2], sol[3]] },
        { m: [sol[0], sol[1], sol[2] + 1, sol[3]] },
        { m: [Math.max(sol[0] - 1, 0), sol[1], sol[2], sol[3]] },
      ];
      return cands.filter((c) => c.m.join() !== sol.join());
    }
    const first = m.grp ? m.grp[0].c : 0;
    const cands = [
      { ans: lin(a, -b) },
      { ans: lin(a + b, 0) },
      { ans: "" },
      {
        ans: m.grp
          ? `${m.n * first}x ${m.grp[1].c < 0 ? MINUS : "+"} ${Math.abs(m.grp[1].c)}`
          : `${a}x ${b < 0 ? "+" : MINUS} ${Math.abs(b) + 1}`,
      },
      { ans: m.terms ? termsText(m.terms) : "x+x" },
    ];
    return cands
      .filter(
        (c) => c.ans === "" || !equals(parse(c.ans) || [], a, b) || !(parse(c.ans) || []).length,
      )
      .map((c) => ({ ...c, c: spec.mode === "simplify" ? m.n : undefined, g: [] }));
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const { a, b } = spec.model;
    if (spec.mode === "equivalent") {
      const [px, nx, pu, nu] = (st && st.m) || [0, 0, 0, 0];
      if (!px && !nx && !pu && !nu)
        return miss(
          "empty",
          "Add tiles from the bank to build your arrangement.",
          "Añade fichas del banco para armar tu arreglo.",
        );
      if ((px && nx) || (pu && nu))
        return miss(
          "zero-pair",
          "You have a positive and a negative tile of the same shape. They cancel, so take both off the mat.",
          "Tienes una ficha positiva y una negativa de la misma forma. Se cancelan; quita las dos de la mesa.",
        );
      const ga = px - nx;
      const gb = pu - nu;
      if (ga === a && gb === b) return { ok: true };
      if (ga === a)
        return miss(
          "units",
          "The x-tiles are right. Check the unit tiles: how many are there in all, and are they positive or negative?",
          "Las fichas x están bien. Revisa las de unidad: ¿cuántas hay en total y son positivas o negativas?",
        );
      if (gb === b)
        return miss(
          "x-tiles",
          "The unit tiles are right. Check the x-tiles: count them from every group, and check each sign.",
          "Las fichas de unidad están bien. Revisa las x: cuenta las de cada grupo y revisa cada signo.",
        );
      return miss(
        "both",
        "Not yet. Count the x-tiles and the unit tiles separately, from every group, with their signs.",
        "Todavía no. Cuenta por separado las fichas x y las de unidad, de cada grupo, con sus signos.",
      );
    }
    const raw = String((st && st.ans) || "").trim();
    if (!raw)
      return miss(
        "blank",
        "Type the shorter expression after you group the tiles.",
        "Escribe la expresión más corta después de agrupar las fichas.",
      );
    const ts = parse(raw);
    if (!ts)
      return miss(
        "syntax",
        "Write it with x, numbers, + and − only, like 3x + 2. Leave out parentheses.",
        "Escríbelo solo con x, números, + y −, como 3x + 2. Sin paréntesis.",
      );
    if (!equals(ts, a, b)) {
      const m = spec.model;
      const vals = (/** @type {number} */ p, /** @type {number} */ q) => equals(ts, p, q);
      if (b !== 0 && vals(a, -b))
        return miss(
          "sign-units",
          "The number of unit tiles looks right, but check the sign. Hatched tiles are negative.",
          "La cantidad de fichas de unidad parece bien, pero revisa el signo. Las fichas rayadas son negativas.",
        );
      if (vals(a + b, 0) || vals(0, a + b))
        return miss(
          "unlike",
          "An x-tile and a unit tile are not like terms, so they cannot be added into one term.",
          "Una ficha x y una de unidad no son términos semejantes; no se suman en un solo término.",
        );
      if (m.grp && vals(m.n * m.grp[0].c, m.grp[1].c))
        return miss(
          "partial",
          "Every tile in the group is copied, not only the first one. Check the unit tiles.",
          "Cada ficha del grupo se copia, no solo la primera. Revisa las de unidad.",
        );
      return miss(
        "value",
        "That expression does not match the tiles. Count the x-tiles and the unit tiles separately, with their signs.",
        "Esa expresión no coincide con las fichas. Cuenta por separado las fichas x y las de unidad, con sus signos.",
      );
    }
    if (ts.filter((t) => t.x).length > 1 || ts.filter((t) => !t.x).length > 1)
      return miss(
        "not-combined",
        "The value is right, but there are still like terms. Combine them into one x term and one number.",
        "El valor es correcto, pero todavía hay términos semejantes. Combínalos en un término x y un número.",
      );
    return { ok: true };
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.sa-root{--sa-i:var(--ink,#1B2733);--sa-s:var(--surface,#fff);--sa-b:var(--brand,#2C4A68);--sa-bt:var(--brand-tint,#E5ECF3);--sa-bl:var(--brand-line,#BBCADA);--sa-sun:var(--sun,#F0BD4F);--sa-ok:var(--ok,#0A7D4B);--sa-bad:var(--bad,#B42318);--sa-bd:var(--border,#D5DCE5);--sa-dk:var(--brand-dark,#1B2C3F);--sa-r:var(--radius-md,14px);--sa-mute:#566475;--sa-okt:#E4F7EC;--sa-badt:#FDECEA;--sa-sunt:#FAF2DC;color:var(--sa-i);max-width:640px;margin:0 auto;font-family:inherit}
@supports (color:color-mix(in srgb,red,blue)){.sa-root{--sa-mute:color-mix(in srgb,var(--sa-i) 72%,var(--sa-s));--sa-okt:color-mix(in srgb,var(--sa-ok) 16%,var(--sa-s));--sa-badt:color-mix(in srgb,var(--sa-bad) 14%,var(--sa-s));--sa-sunt:color-mix(in srgb,var(--sa-sun) 32%,var(--sa-s))}}
.sa-root *{box-sizing:border-box}
.sa-root [hidden]{display:none!important}
.sa-root :focus-visible{outline:3px solid var(--sa-i);outline-offset:1px;box-shadow:0 0 0 5px var(--sa-sun)}
.sa-es{display:none;font-size:.82em;font-weight:600;color:var(--sa-b);line-height:1.25}
body.show-es .sa-es,.sa-root[data-es="1"] .sa-es{display:block}
.sa-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 14px;border-radius:var(--sa-r);border:2px solid var(--sa-bl);border-bottom-width:4px;background:var(--sa-s);color:var(--sa-b);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;text-align:center}
.sa-btn:hover:not([disabled]){background:var(--sa-bt);border-color:var(--sa-b)}
.sa-btn:active:not([disabled]){transform:translateY(2px);border-bottom-width:2px}
.sa-btn[disabled]{opacity:.5;cursor:not-allowed}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-status.sa-bad{color:var(--sa-bad)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.sa-in{font:inherit;font-weight:800;font-size:1.3rem;min-height:48px;width:11em;max-width:100%;padding:6px 10px;border:3px solid var(--sa-bl);border-radius:var(--sa-r);background:var(--sa-s);color:var(--sa-i)}
.sa-in:focus{border-color:var(--sa-b)}
.tl-mat{display:flex;flex-wrap:wrap;gap:8px;min-height:72px;padding:10px;border:2px dashed var(--sa-bl);border-radius:var(--sa-r);background:var(--sa-s);align-items:flex-start}
.tl-g{appearance:none;font:inherit;min-width:44px;min-height:44px;padding:4px;border:2px solid transparent;border-radius:12px;background:transparent;color:var(--sa-i);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;gap:2px}
.tl-g:hover:not([disabled]){background:var(--sa-bt)}
.tl-g.tl-sel{border-color:var(--sa-dk);background:var(--sa-sunt)}
.tl-g b{font-size:1.05rem}
.tl-g[disabled]{cursor:default}
.tl-t{stroke-width:2.5}
.tl-x{fill:var(--sa-bt);stroke:var(--sa-b)}.tl-u{fill:var(--sa-sunt);stroke:var(--sa-dk)}
.tl-neg{stroke-dasharray:5 3}
.tl-h{fill:none;stroke:var(--sa-i);stroke-width:1.5;opacity:.55}
.tl-tx{fill:var(--sa-i);font:800 17px system-ui,sans-serif;text-anchor:middle}
.tl-bank{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.tl-bank .sa-btn{flex-direction:row;gap:8px;padding:4px 12px}
.tl-read{font-size:1.4rem;font-weight:800;margin:8px 0;color:var(--sa-b)}
.tl-tgt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;border:2px solid var(--sa-bd);border-radius:var(--sa-r);margin:6px 0}
.tl-br{display:inline-flex;gap:4px;padding:4px 8px;border-left:3px solid var(--sa-i);border-right:3px solid var(--sa-i);border-radius:6px}
.tl-copies{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:800;margin:6px 0}.tl-copies .tl-br{max-width:100%;overflow-x:auto;flex-wrap:wrap}
@media (prefers-reduced-motion:no-preference){.tl-shake{animation:tl-sh .35s}@keyframes tl-sh{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}}
@media (forced-colors:active){.sa-btn,.sa-in,.tl-g{border-color:ButtonText}.tl-g.tl-sel{outline:3px solid Highlight}.tl-t{stroke:CanvasText}}
`;

  let uid = 0;
  const hatchId = `tl-hatch${++uid}`;
  /** One tile (or a stack of them) as SVG. k: x or u; q: signed count. */
  function tilesSVG(/** @type {string} */ k, /** @type {number} */ q, /** @type {boolean} */ mini) {
    const n = Math.abs(q);
    const neg = q < 0;
    const cls = `tl-t tl-${k}${neg ? " tl-neg" : ""}`;
    const tw = k === "x" ? (mini ? 52 : 80) : mini ? 18 : 36;
    const th = mini ? (k === "x" ? 16 : 18) : 36;
    const cols = k === "x" ? 1 : Math.min(n, 4);
    const rows = Math.ceil(n / cols);
    const W2 = cols * (tw + 4) + 2;
    const H = rows * (th + 4) + 2;
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = 2 + (i % cols) * (tw + 4);
      const y = 2 + Math.floor(i / cols) * (th + 4);
      s += `<rect class="${cls}" x="${x}" y="${y}" width="${tw}" height="${th}" rx="5"/>${neg ? `<rect class="tl-h" style="fill:url(#${hatchId});stroke:none" x="${x}" y="${y}" width="${tw}" height="${th}" rx="5"/>` : ""}`;
      if (!mini || n === 1)
        s += `<text class="tl-tx" x="${x + tw / 2}" y="${y + th / 2 + 6}"${mini ? ' style="font-size:11px"' : ""}>${neg ? MINUS : ""}${k === "x" ? "x" : "1"}</text>`;
    }
    return `<svg width="${W2}" height="${H}" viewBox="0 0 ${W2} ${H}" aria-hidden="true" focusable="false">${s}</svg>`;
  }
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="${hatchId}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0 M-2 2 L2 -2 M6 10 L10 6" stroke="currentColor" stroke-width="1.6" style="stroke:var(--sa-i)"/></pattern></defs></svg>`;
  const kindWord = (
    /** @type {string} */ k,
    /** @type {number} */ q,
    /** @type {boolean} */ es,
  ) => {
    const n = Math.abs(q);
    const base = k === "x" ? (es ? "ficha" : "x-tile") : es ? "ficha de unidad" : "unit tile";
    return `${n} ${q < 0 ? (es ? "negativa" : "negative") + " " : ""}${base}${n === 1 ? "" : es ? "s" : "s"}`;
  };

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("tiles", CSS);
    const m = spec.model;
    const mode = spec.mode;
    const ro = !!api.solved;
    const isEs = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (isEs() ? es : en);
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${en}<span class="sa-es" lang="es">${es}</span>`;
    const root = A.el("div", "sa-root", defs);
    if (isEs()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ g: null, ans: "", c: 1, m: [0, 0, 0, 0] });
    if (api.restore) Object.assign(st, clone(api.restore));
    const emit = () => api.change?.(clone(st));
    const status = A.el("p", "sa-status");
    const say = (/** @type {string} */ en, /** @type {string} */ es, bad = false) => {
      status.innerHTML = T(en, es);
      status.classList.toggle("sa-bad", bad);
      api.say?.(L(en, es));
    };
    const mat = A.el("div", "tl-mat", "", {
      role: "group",
      "aria-label": L("Tile mat", "Mesa de fichas"),
    });
    const flatTiles = (/** @type {any[]} */ ts) =>
      ts.flatMap((t) =>
        Array.from({ length: Math.abs(t.c) }, () => ({ k: t.k, q: Math.sign(t.c) })),
      );
    const baseTiles = () =>
      mode === "combine"
        ? flatTiles(m.terms)
        : flatTiles(Array.from({ length: st.c }, () => m.grp).flat());
    let sel = -1;
    const emptyMsg = status;
    if (mode !== "equivalent") {
      if (!st.g) st.g = baseTiles();
      const read = A.el("div", "", "");
      if (mode === "simplify") {
        const cp = A.el("div", "tl-copies");
        const bracket = A.el(
          "span",
          "tl-br",
          m.grp.map((/** @type {any} */ t) => tilesSVG(t.k, t.c, true)).join(""),
          {
            role: "img",
            "aria-label": L(`The group ${termsText(m.grp)}`, `El grupo ${termsText(m.grp)}`),
          },
        );
        const num = A.el("span", "", String(st.c), { "aria-live": "polite" });
        const mk = (
          /** @type {number} */ d,
          /** @type {string} */ txt,
          /** @type {string} */ lab,
        ) => {
          const b = A.el("button", "sa-btn", txt, { type: "button", "aria-label": lab });
          if (ro) b.disabled = true;
          b.addEventListener("click", () => {
            st.c = Math.max(1, Math.min(6, st.c + d));
            st.g = baseTiles();
            sel = -1;
            num.textContent = String(st.c);
            paint();
            emit();
            say(
              `${st.c} ${st.c === 1 ? "copy" : "copies"} of the group.`,
              `${st.c} ${st.c === 1 ? "copia" : "copias"} del grupo.`,
            );
          });
          return b;
        };
        cp.append(
          A.el("span", "", `${T("Copies of the group:", "Copias del grupo:")}`),
          mk(-1, MINUS, L("Fewer copies", "Menos copias")),
          num,
          mk(1, "+", L("More copies", "Más copias")),
          bracket,
        );
        root.append(cp);
      }
      root.append(read, mat);
      var _paintGroups = () => {
        mat.replaceChildren();
        st.g.forEach((/** @type {any} */ g, /** @type {number} */ i) => {
          const label = `${g.q < 0 ? MINUS : ""}${g.k === "x" ? (Math.abs(g.q) === 1 ? "x" : `${Math.abs(g.q)}x`) : Math.abs(g.q)}`;
          const b = A.el(
            "button",
            `tl-g${i === sel ? " tl-sel" : ""}`,
            `${tilesSVG(g.k, g.q, Math.abs(g.q) > 1)}<b>${label}</b>`,
            {
              type: "button",
              "aria-pressed": String(i === sel),
              "aria-label": L(
                `${kindWord(g.k, g.q, false)}${i === sel ? ", selected" : ""}. Tap another group to combine.`,
                `${kindWord(g.k, g.q, true)}${i === sel ? ", seleccionado" : ""}. Toca otro grupo para combinar.`,
              ),
            },
          );
          if (ro) b.disabled = true;
          b.addEventListener("click", () => tap(i, b));
          mat.append(b);
        });
        if (!st.g.length)
          mat.append(
            A.el("span", "", T("All tiles cancelled.", "Todas las fichas se cancelaron.")),
          );
      };
      var tap = (/** @type {number} */ i, /** @type {HTMLElement} */ b) => {
        if (sel < 0 || sel === i) {
          sel = sel === i ? -1 : i;
          return paint();
        }
        const a = st.g[sel];
        const c = st.g[i];
        if (a.k !== c.k) {
          b.classList.add("tl-shake");
          b.addEventListener("animationend", () => b.classList.remove("tl-shake"), { once: true });
          return say(
            "An x-tile and a unit tile are not like terms. Pick tiles with the same shape.",
            "Una ficha x y una de unidad no son términos semejantes. Elige fichas de la misma forma.",
            true,
          );
        }
        const q = a.q + c.q;
        const cancel = Math.sign(a.q) !== Math.sign(c.q);
        const lo = Math.min(sel, i);
        st.g[lo] = { k: a.k, q };
        st.g.splice(Math.max(sel, i), 1);
        if (q === 0) st.g.splice(lo, 1);
        sel = -1;
        paint();
        emit();
        say(
          cancel
            ? "A positive and a negative tile make a zero pair, so they cancel."
            : "Grouped like tiles.",
          cancel
            ? "Una ficha positiva y una negativa forman un par cero y se cancelan."
            : "Fichas semejantes agrupadas.",
        );
      };
    } else {
      var paintGroups = () => {};
    }
    const readout = A.el("p", "tl-read");
    const bank = A.el("div", "tl-bank", "", {
      role: "group",
      "aria-label": L("Tile bank", "Banco de fichas"),
    });
    function paintEquiv() {
      mat.replaceChildren();
      const defsK = [
        ["x", 1],
        ["x", -1],
        ["u", 1],
        ["u", -1],
      ];
      st.m.forEach((/** @type {number} */ n, /** @type {number} */ j) => {
        for (let i = 0; i < n; i++) {
          const [k, s] = defsK[j];
          const b = A.el(
            "button",
            "tl-g",
            tilesSVG(/** @type {string} */ (k), /** @type {number} */ (s), false),
            {
              type: "button",
              "aria-label": L(
                `Remove ${kindWord(/** @type {string} */ (k), /** @type {number} */ (s), false)}`,
                `Quitar ${kindWord(/** @type {string} */ (k), /** @type {number} */ (s), true)}`,
              ),
            },
          );
          if (ro) b.disabled = true;
          b.addEventListener("click", () => {
            st.m[j]--;
            paint();
            emit();
            say("Removed a tile.", "Se quitó una ficha.");
          });
          mat.append(b);
        }
      });
      if (!st.m.some((/** @type {number} */ n) => n))
        mat.append(
          A.el(
            "span",
            "",
            T(
              "Tap tiles in the bank to add them here.",
              "Toca fichas del banco para añadirlas aquí.",
            ),
          ),
        );
      const a = st.m[0] - st.m[1];
      const b = st.m[2] - st.m[3];
      readout.innerHTML = `${T("Your expression:", "Tu expresión:")} <span>${esc(a === 0 && b === 0 ? "0" : lin(a, b))}</span>`;
    }
    if (mode === "equivalent") {
      const tgt = A.el("div", "tl-tgt", "", {
        role: "img",
        "aria-label": L(`Target: ${exprOf(m)}`, `Meta: ${exprOf(m)}`),
      });
      const parts = [];
      for (let i = 0; i < m.n && m.n > 1; i++)
        parts.push(
          `<span class="tl-br">${m.grp.map((/** @type {any} */ t) => tilesSVG(t.k, t.c, true)).join("")}</span>`,
        );
      parts.push(...(m.extra || []).map((/** @type {any} */ t) => tilesSVG(t.k, t.c, true)));
      tgt.innerHTML = `<b>${esc(exprOf(m))} =</b>${parts.join("")}`;
      const bk = [
        ["x", 1, "x"],
        ["x", -1, `${MINUS}x`],
        ["u", 1, "1"],
        ["u", -1, `${MINUS}1`],
      ];
      bk.forEach((t, j) => {
        const b = A.el(
          "button",
          "sa-btn",
          `${tilesSVG(/** @type {string} */ (t[0]), /** @type {number} */ (t[1]), true)}<span>${t[2]}</span>`,
          {
            type: "button",
            "aria-label": L(
              `Add ${kindWord(/** @type {string} */ (t[0]), /** @type {number} */ (t[1]), false)}`,
              `Añadir ${kindWord(/** @type {string} */ (t[0]), /** @type {number} */ (t[1]), true)}`,
            ),
          },
        );
        if (ro) b.disabled = true;
        b.addEventListener("click", () => {
          if (st.m.reduce((s2, n) => s2 + n, 0) >= 16)
            return say(
              "The mat is full. Remove a tile first.",
              "La mesa está llena. Quita una ficha primero.",
              true,
            );
          st.m[j]++;
          paint();
          emit();
          say(`Added a tile. ${readout.textContent}`, `Ficha añadida. ${readout.textContent}`);
        });
        bank.append(b);
      });
      root.append(tgt, bank, mat, readout);
    }
    const ansIn = /** @type {HTMLInputElement} */ (
      A.el("input", "sa-in", "", {
        type: "text",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": L("Your simplified expression", "Tu expresión simplificada"),
      })
    );
    if (mode !== "equivalent") {
      ansIn.value = st.ans || "";
      if (ro) ansIn.readOnly = true;
      const row = A.el("div", "sa-row", `<b>=</b>`);
      row.append(ansIn);
      if (!ro)
        for (const [ch, lab] of [
          ["x", "x"],
          ["+", L("plus", "más")],
          [MINUS, L("minus", "menos")],
        ]) {
          const b = A.el("button", "sa-btn", ch, {
            type: "button",
            "aria-label": L(`Insert ${lab}`, `Insertar ${lab}`),
          });
          b.addEventListener("click", () => {
            const p = ansIn.selectionStart ?? ansIn.value.length;
            ansIn.value = ansIn.value.slice(0, p) + ch + ansIn.value.slice(ansIn.selectionEnd ?? p);
            ansIn.focus();
            ansIn.setSelectionRange(p + 1, p + 1);
            st.ans = ansIn.value;
            emit();
          });
          row.append(b);
        }
      root.append(row);
      ansIn.addEventListener("input", () => {
        st.ans = ansIn.value;
        emit();
      });
      ansIn.addEventListener(
        "keydown",
        (/** @type {KeyboardEvent} */ e) => e.key === "Enter" && !ro && api.submit?.(clone(st)),
      );
    }
    function paint() {
      if (mode === "equivalent") paintEquiv();
      else paintGroups();
    }
    if (!ro) {
      const r = A.el("div", "sa-row");
      const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
        type: "button",
        "aria-label": L("Check my answer", "Comprobar mi respuesta"),
      });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      const reset = A.el("button", "sa-btn", T("Start over", "Empezar de nuevo"), {
        type: "button",
      });
      reset.addEventListener("click", () => {
        if (mode === "equivalent") st.m = [0, 0, 0, 0];
        else {
          st.g = baseTiles();
          st.ans = "";
          ansIn.value = "";
        }
        sel = -1;
        paint();
        emit();
        say("Started over.", "Empezamos de nuevo.");
      });
      r.append(chk, reset);
      root.append(r);
    }
    root.append(status);
    paint();
    if (ro) say("Solved.", "Resuelto.");
    void emptyMsg;
  }

  A.register("tiles", {
    title: "Algebra tiles",
    titleEs: "Fichas algebraicas",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();
