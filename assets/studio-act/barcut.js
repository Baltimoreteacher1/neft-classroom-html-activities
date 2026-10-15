/**
 * Practice Studio activity: barcut (window.StudioAct kind "barcut").
 * Cut fraction bars into equal pieces, count the groups, then type the quotient.
 * Modes: wholeByFrac (3 / 1/4), fracByWhole (1/2 / 3), mixed (2 1/2 / 3/4). Level 4 is the reverse problem:
 * pick the division sentence the model shows. State: { d: pieces per bar, k: groups counted, ans, pick }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const F = (/** @type {number} */ n, /** @type {number} */ d = 1) => {
    const g = G.gcd(n, d) || 1;
    return [n / g, d / g];
  };
  const dv = (/** @type {number[]} */ a, /** @type {number[]} */ b) => F(a[0] * b[1], a[1] * b[0]);
  const tx = (/** @type {number[]} */ f) => G.mixed(f[0], f[1]);
  const num = (/** @type {number[]} */ f) => f[0] / f[1];
  const blank = (/** @type {any} */ s) => String(s ?? "").trim() === "";
  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);
  const OPTS = [2, 3, 4, 5, 6, 8, 10, 12];
  const THINGS = [
    ["ribbon", "cinta", "yards", "yardas"],
    ["rope", "cuerda", "feet", "pies"],
    ["strip of tape", "tira de cinta adhesiva", "feet", "pies"],
    ["wire", "alambre", "meters", "metros"],
    ["trail", "sendero", "miles", "millas"],
    ["board", "tabla", "feet", "pies"],
  ];
  const sing = (/** @type {string} */ u) => (u === "feet" ? "foot" : u.replace(/s$/, ""));
  const FRIENDS = [
    ["friends", "amigos"],
    ["students", "estudiantes"],
    ["teammates", "compañeros de equipo"],
    ["neighbors", "vecinos"],
  ];

  /** derived numbers for a cut of d pieces per bar, or null when the pieces do not line up */
  function cutInfo(/** @type {any} */ m, /** @type {number} */ d) {
    if (!d || d % m.dvd[1] !== 0) return null;
    const N = (m.dvd[0] * d) / m.dvd[1];
    if (m.mode === "fracByWhole")
      return N % m.dvs[0] === 0 ? { N, g: N / m.dvs[0], full: m.dvs[0], rest: 0 } : null;
    if (d % m.dvs[1] !== 0) return null;
    const g = (m.dvs[0] * d) / m.dvs[1];
    return { N, g, full: Math.floor(N / g), rest: N % g };
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode = ["wholeByFrac", "fracByWhole", "mixed"].includes(params.mode)
      ? params.mode
      : rng.pick(["wholeByFrac", "fracByWhole", "mixed"]);
    const th = rng.pick(THINGS);
    for (let t = 0; t < 900; t++) {
      /** @type {number[]} */ let dvd;
      /** @type {number[]} */ let dvs;
      const lvl = level === 4 ? rng.pick([2, 3]) : level;
      if (mode === "wholeByFrac") {
        dvd = [rng.int(2, 5), 1];
        const q = rng.int(2, lvl === 1 ? 6 : 8);
        dvs = lvl === 1 ? [1, q] : [rng.int(2, 3), q];
      } else if (mode === "fracByWhole") {
        const q = rng.int(2, lvl === 1 ? 5 : 6);
        const p = lvl === 1 ? 1 : rng.int(1, 3);
        const w = lvl === 3 ? rng.int(1, 2) : 0;
        dvd = [w * q + p, q];
        dvs = [rng.int(2, 4), 1];
      } else {
        const mm = rng.pick([2, 3, 4]);
        dvd = [rng.int(1, 3) * mm + rng.int(1, mm - 1), mm];
        const q = rng.int(2, 8);
        dvs = lvl === 1 ? [1, q] : [rng.int(2, 3), q];
      }
      dvd = F(dvd[0], dvd[1]);
      dvs = F(dvs[0], dvs[1]);
      if (mode !== "fracByWhole" && (dvs[0] >= dvs[1] || (mode === "mixed" && dvd[1] === 1)))
        continue;
      if (mode === "fracByWhole" && (dvd[0] % dvd[1] === 0 || (level < 3 && dvd[0] > dvd[1])))
        continue;
      const quo = dv(dvd, mode === "fracByWhole" ? [dvs[0], 1] : dvs);
      const m = { mode, dvd, dvs, quo, rev: level === 4, th: th[0] };
      const ok = OPTS.filter((d) => cutInfo(m, d));
      if (!ok.length) continue;
      const info = /** @type {any} */ (cutInfo(m, ok[0]));
      if (info.N > 34 || (mode !== "fracByWhole" && info.full > 18)) continue;
      const leftover = mode !== "fracByWhole" && quo[1] !== 1;
      if (mode !== "fracByWhole" && (level === 3 ? !leftover : level < 3 && leftover)) continue;
      if (mode === "fracByWhole" && level === 2 && quo[0] === 1 && dvd[0] === 1) continue;
      return pack(rng, level, m, ok, th);
    }
    throw new Error(`barcut: no task for ${mode} L${level}`);
  }

  function pack(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {any} */ m,
    /** @type {number[]} */ ok,
    /** @type {string[]} */ th,
  ) {
    const a = tx(m.dvd);
    const b = m.mode === "fracByWhole" ? String(m.dvs[0]) : tx(m.dvs);
    const expr = `${a} ÷ ${b}`;
    const qt = tx(m.quo);
    const fr = rng.pick(FRIENDS);
    const lone = m.mode !== "fracByWhole" && m.quo[1] !== 1;
    let q;
    let qEs;
    if (m.rev) {
      q =
        "This model shows a division. Pick the division sentence it matches, then type the quotient.";
      qEs =
        "Este modelo muestra una división. Elige la oración de división que le corresponde y luego escribe el cociente.";
    } else if (m.mode === "fracByWhole") {
      q = `A ${a}-${sing(th[2])} ${th[0]} is shared equally by ${b} ${fr[0]}. What fraction of one whole ${sing(th[2])} does each get?`;
      qEs = `Una ${th[1]} de ${a} ${th[3]} se reparte en partes iguales entre ${b} ${fr[1]}. ¿Qué fracción de ${th[3] === "millas" ? "una milla" : "un entero"} recibe cada uno?`;
    } else {
      q = `A ${th[0]} is ${a} ${th[2]} long. It is cut into pieces ${b} ${sing(th[2])} long. How many pieces fit${lone ? ", counting any part of a piece" : ""}?`;
      qEs = `${cap(th[1])} mide ${a} ${th[3]}. Se corta en trozos de ${b} ${th[3].replace(/s$/, "")}. ¿Cuántos trozos caben${lone ? ", contando cualquier parte de un trozo" : ""}?`;
    }
    let opts = null;
    if (m.rev) {
      const alt =
        m.mode === "fracByWhole"
          ? [`${b} ÷ ${a}`, `${a} × ${b}`, `${a} ÷ 1/${b}`]
          : [`${b} ÷ ${a}`, `${a} × ${b}`, `${a} ÷ ${tx([m.dvs[1], m.dvs[0]])}`];
      const list = rng.shuffle([expr, ...alt.filter((s) => s !== expr)].slice(0, 4));
      opts = { list, good: list.indexOf(expr) };
    }
    const need = ok[0];
    const hs =
      m.mode === "fracByWhole"
        ? [
            "Split the shaded part into equal parts. Then look at the whole bar: how many equal pieces would it have?",
            "Cut the bar so the shaded part can be shared with no pieces left over. Mark one share.",
            "Count the pieces in one share. Write that count over the number of pieces in one whole bar.",
          ]
        : [
            "Cut the bars so the group size is a whole number of pieces. Then count groups.",
            "A group is the size of the divisor. Mark each group and count how many you can make.",
            lone
              ? "Some pieces are left over. Say what part of a group they make."
              : "Count every group that fits in the bars.",
          ];
    const hsEs =
      m.mode === "fracByWhole"
        ? [
            "Divide la parte sombreada en partes iguales. Luego mira la barra entera: ¿cuántas partes iguales tendría?",
            "Corta la barra para repartir la parte sombreada sin que sobren trozos. Marca una parte.",
            "Cuenta los trozos de una parte. Escribe esa cantidad sobre el número de trozos de una barra entera.",
          ]
        : [
            "Corta las barras para que el tamaño del grupo sea un número entero de trozos. Luego cuenta los grupos.",
            "Un grupo tiene el tamaño del divisor. Marca cada grupo y cuenta cuántos puedes formar.",
            lone
              ? "Sobran algunos trozos. Di qué parte de un grupo forman."
              : "Cuenta todos los grupos que caben en las barras.",
          ];
    const ex =
      m.mode === "fracByWhole"
        ? `${expr} = ${qt}. Cutting each bar into ${need * 1} pieces shows each share is ${qt} of a whole bar.`
        : `${expr} = ${qt}. With ${need} pieces per bar, ${lone ? "the full groups plus the leftover part of a group make" : "the groups make"} ${qt}.`;
    const exEs =
      m.mode === "fracByWhole"
        ? `${expr} = ${qt}. Con ${need} trozos por barra, cada parte es ${qt} de una barra entera.`
        : `${expr} = ${qt}. Con ${need} trozos por barra, ${lone ? "los grupos completos más la parte sobrante de un grupo forman" : "los grupos forman"} ${qt}.`;
    return { q, qEs, x: ex, xEs: exEs, h: hs, hEs: hsEs, model: { ...m, expr, ok, opts, level } };
  }

  /* ---- grading -------------------------------------------------------------------------------- */
  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    st = st || {};
    const d = Number(st.d || 0);
    if (m.opts && Number(st.pick) !== m.opts.good) {
      return st.pick === undefined || st.pick === null || st.pick === ""
        ? bad("pick", "Pick the division sentence first.", "Primero elige la oración de división.")
        : bad(
            "pick",
            "Check the model again. The bars are the amount being divided, and one group or share is the divisor. Which sentence says that?",
            "Mira otra vez el modelo. Las barras son lo que se divide y un grupo o una parte es el divisor. ¿Qué oración dice eso?",
          );
    }
    if (!m.rev && !cutInfo(m, d))
      return d <= 1
        ? bad(
            "uncut",
            "Cut the bars into equal pieces first.",
            "Primero corta las barras en trozos iguales.",
          )
        : bad(
            "cut",
            `With ${d} pieces in each bar the pieces do not line up with the numbers. Try a different number of equal pieces.`,
            `Con ${d} trozos en cada barra, los trozos no coinciden con los números. Prueba otra cantidad de trozos iguales.`,
          );
    if (blank(st.ans))
      return bad(
        "empty",
        "Type the quotient in the answer boxes.",
        "Escribe el cociente en los casilleros de respuesta.",
      );
    const t = G.value(st.ans);
    const want = num(m.quo);
    if (Number.isNaN(t))
      return bad(
        "format",
        "Write the answer as a whole number, a fraction, or a mixed number.",
        "Escribe la respuesta como número entero, fracción o número mixto.",
      );
    if (Math.abs(t - want) < 1e-9) return { ok: true };
    const info = cutInfo(m, d || m.ok[0]);
    if (m.mode === "fracByWhole") {
      if (Math.abs(t - num(m.dvd) * m.dvs[0]) < 1e-9)
        return bad(
          "multiplied",
          "You multiplied. Sharing a part into equal groups makes each share smaller than the part.",
          "Multiplicaste. Repartir una parte en grupos iguales hace que cada parte sea menor que la parte original.",
        );
      if (Math.abs(t - m.dvs[0] / num(m.dvd)) < 1e-9)
        return bad(
          "flipped",
          "You divided the other way around. Here the shaded part is split into equal shares.",
          "Dividiste al revés. Aquí la parte sombreada se divide en partes iguales.",
        );
      return bad(
        "share",
        "Count the pieces in one share, then compare with the pieces in one whole bar.",
        "Cuenta los trozos de una parte y compáralos con los trozos de una barra entera.",
      );
    }
    if (Math.abs(t - num(m.dvd) * num(m.dvs)) < 1e-9)
      return bad(
        "multiplied",
        `You multiplied. Dividing asks how many groups of ${tx(m.dvs)} fit in ${tx(m.dvd)}.`,
        `Multiplicaste. Dividir pregunta cuántos grupos de ${tx(m.dvs)} caben en ${tx(m.dvd)}.`,
      );
    if (Math.abs(t - num(m.dvs) / num(m.dvd)) < 1e-9)
      return bad(
        "flipped",
        "You divided the other way around. Count how many groups fit in the bars.",
        "Dividiste al revés. Cuenta cuántos grupos caben en las barras.",
      );
    if (info && info.g > 1 && t === info.N)
      return bad(
        "pieces",
        "You counted pieces, not groups. One group is more than one piece here.",
        "Contaste trozos, no grupos. Aquí un grupo es más de un trozo.",
      );
    if (info && info.rest && t === info.full)
      return bad(
        "leftover",
        "The leftover pieces are part of one more group. Say what part of a group they make.",
        "Los trozos sobrantes son parte de un grupo más. Di qué parte de un grupo forman.",
      );
    return bad(
      "count",
      "Count the groups again, one by one, then write your count.",
      "Cuenta los grupos otra vez, uno por uno, y escribe tu conteo.",
    );
  }
  const solution = (/** @type {any} */ spec) => ({
    d: spec.model.ok[0],
    k: 0,
    ans: tx(spec.model.quo),
    pick: spec.model.opts ? spec.model.opts.good : undefined,
  });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const s = solution(spec);
    /** @type {any[]} */
    const c = [
      {
        ...s,
        ans: tx(
          F(Math.round(num(m.dvd) * (m.mode === "fracByWhole" ? m.dvs[0] : num(m.dvs)) * 12), 12),
        ),
      },
      { ...s, ans: tx(F(m.quo[1], m.quo[0])) },
      { ...s, d: 1 },
      { ...s, ans: "" },
      { ...s, ans: String(Math.floor(num(m.quo))) },
    ];
    if (m.opts) c.push({ ...s, pick: (m.opts.good + 1) % m.opts.list.length });
    return c.filter((st) => !grade(spec, st).ok);
  }

  /* ---- the widget ----------------------------------------------------------------------------- */
  const CSS = `
.bc{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;max-width:680px;color:var(--ink,#1B2733)}
.bc>*{min-width:0}
.bc-div{font-size:1.6rem;font-weight:800;color:var(--brand,#2C4A68);font-variant-numeric:tabular-nums}
.bc-box{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px 12px;display:grid;gap:8px}
.bc-lab{font-weight:800;display:block}
.bc-lab .es-text{margin:0;font-size:.85em;font-weight:600}
.bc-chips{display:flex;flex-wrap:wrap;gap:8px}
.bc-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:6px 14px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2;text-align:center}
.bc-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.bc-btn[aria-pressed=true]{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--ink,#1B2733)}
.bc-btn.go{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.bc-btn[disabled]{opacity:.5;cursor:not-allowed}
.bc-btn[hidden]{display:none}
.bc-btn .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.bc-btn:focus-visible,.bc input:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.bc-bars{display:grid;gap:8px}
.bc-bar{display:grid;height:52px;border:3px solid var(--ink,#1B2733);border-radius:10px;overflow:hidden;background:var(--surface,#fff)}
.bc-pc{position:relative;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;border-left:1px solid var(--brand-line,#BBCADA);background:var(--brand-tint,#E5ECF3);cursor:pointer;user-select:none}
.bc-pc:first-child{border-left:0}
.bc-pc.out{background:var(--surface,#fff);cursor:default;background-image:repeating-linear-gradient(135deg,transparent 0 6px,var(--border,#D5DCE5) 6px 7px)}
.bc-pc.gs{border-left:4px solid var(--ink,#1B2733)}
.bc-pc.c0{background:color-mix(in srgb,var(--brand,#2C4A68) 45%,var(--surface,#fff))}
.bc-pc.c1{background:color-mix(in srgb,var(--sun,#F0BD4F) 80%,var(--surface,#fff))}
.bc-pc.lo{background-image:repeating-linear-gradient(45deg,transparent 0 5px,var(--brand,#2C4A68) 5px 6px);outline:2px dashed var(--ink,#1B2733);outline-offset:-4px}
.bc-pc i{font-style:normal;background:var(--surface,#fff);color:var(--ink,#1B2733);border:2px solid var(--ink,#1B2733);border-radius:999px;min-width:22px;height:22px;display:grid;place-items:center;font-size:.8rem}
.bc-key{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:700}
.bc-key span.k{display:block;height:20px;border:3px solid var(--ink,#1B2733);border-radius:6px;background:color-mix(in srgb,var(--sun,#F0BD4F) 80%,var(--surface,#fff))}
.bc-cnt{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.bc-n{font-size:1.2rem;font-weight:800;color:var(--brand,#2C4A68)}
.bc-opts{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.bc-ans{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:1.3rem;font-weight:800}
.bc-in{font:inherit;font-size:1.3rem;font-weight:800;text-align:center;width:3.4em;min-height:48px;padding:4px;border:3px solid var(--brand,#2C4A68);border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.bc-in[readonly]{border-color:var(--ok,#0A7D4B)}
.bc-fr{display:inline-flex;flex-direction:column;align-items:center;gap:2px}
.bc-fr hr{width:100%;margin:0;border:0;border-top:3px solid var(--ink,#1B2733)}
.bc-bar2{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.bc-fb{flex:1 1 220px;margin:0;padding:8px 12px 8px 44px;border-radius:var(--radius-md,14px);font-weight:700;position:relative;border:2px solid var(--bad,#B42318);background:color-mix(in srgb,var(--bad,#B42318) 12%,var(--surface,#fff))}
.bc-fb::before{content:"!";position:absolute;left:10px;top:8px;width:26px;height:26px;border-radius:50%;background:var(--bad,#B42318);color:#fff;font-weight:800;text-align:center;line-height:26px}
.bc-fb.ok{border-color:var(--ok,#0A7D4B);background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff))}
.bc-fb.ok::before{content:"\\2713";background:var(--ok,#0A7D4B)}
.bc-fb[hidden]{display:none}
.bc-fb .es-text{color:inherit;font-weight:600;margin-top:2px}
@media (prefers-reduced-motion:no-preference){.bc-fb{animation:bc-pop .2s ease-out}@keyframes bc-pop{from{transform:scale(.97);opacity:.3}to{transform:none;opacity:1}}}
@media (forced-colors:active){.bc-bar,.bc-pc,.bc-key span.k{border-color:CanvasText}.bc-pc.c0,.bc-pc.c1{background:Highlight}.bc-btn{border-color:ButtonText}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("barcut", CSS);
    const m = spec.model;
    const T = A.t;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const solved = !!api.solved;
    const base = solved ? solution(spec) : api.restore || {};
    let ended = solved;
    const st = {
      d: Number(base.d || (m.rev ? m.ok[0] : 1)),
      k: Number(base.k || 0),
      ans: String(base.ans ?? ""),
      pick: base.pick,
    };
    if (m.rev) st.d = m.ok[0];
    host.textContent = "";
    const root = A.el("div", "bc");
    const head = A.el("div", "bc-div", `${m.expr} = ?`);
    const bars = A.el("div", "bc-bars", "", { "aria-hidden": "true" });
    const cutBox = A.el("div", "bc-box");
    const keyBox = A.el("div", "bc-key");
    const cntBox = A.el("div", "bc-box");
    const ansBox = A.el("div", "bc-box");
    const bar2 = A.el("div", "bc-bar2");
    const fb = A.el("p", "bc-fb");
    fb.hidden = true;
    if (!api.say) fb.setAttribute("role", "status");
    const check = A.el("button", "bc-btn go", T("Check", "Comprobar"), { type: "button" });
    bar2.append(check, fb);
    const emit = () => {
      fb.hidden = true;
      if (api.change) api.change({ ...st });
    };
    const counting =
      m.mode === "fracByWhole"
        ? ["Show a part", "Mostrar una parte", "Parts shown", "Partes mostradas"]
        : ["Count a group", "Contar un grupo", "Groups counted", "Grupos contados"];
    const cnt = A.el("span", "bc-n");
    const live = A.el("span", "bc-n");
    const more = /** @type {any} */ (
      A.el("button", "bc-btn", T(counting[0], counting[1]), { type: "button" })
    );
    const undo = /** @type {any} */ (
      A.el("button", "bc-btn", T("Undo", "Deshacer"), { type: "button" })
    );
    cntBox.append(A.el("span", "bc-lab", T("Count", "Contar")));
    const cc = A.el("div", "bc-cnt");
    cc.append(more, undo, cnt);
    cntBox.append(cc);
    const chips = A.el("div", "bc-chips");
    /** @type {any[]} */
    const chipEls = [];
    if (!m.rev) {
      cutBox.append(
        A.el(
          "span",
          "bc-lab",
          T(
            "Cut each bar into this many equal pieces",
            "Corta cada barra en esta cantidad de trozos iguales",
          ),
        ),
        chips,
      );
      for (const n of OPTS) {
        const b = /** @type {any} */ (
          A.el("button", "bc-btn", String(n), {
            type: "button",
            "aria-label": `${L("Cut into", "Cortar en")} ${n}`,
          })
        );
        b.addEventListener("click", () => {
          if (ended) return;
          st.d = n;
          st.k = 0;
          emit();
          draw();
        });
        chipEls.push([n, b]);
        chips.append(b);
      }
    }
    const info = () => cutInfo(m, st.d);
    function draw() {
      const i = info();
      const wholes = Math.ceil(num(m.dvd));
      const d = Math.max(1, st.d);
      const per = i ? i.g : 0;
      const total = i ? i.N : Math.round(num(m.dvd) * d);
      bars.innerHTML = "";
      for (let b = 0; b < wholes; b++) {
        const row = A.el("div", "bc-bar");
        row.style.gridTemplateColumns = `repeat(${d},1fr)`;
        if (!i) {
          const w = Math.max(0, Math.min(1, num(m.dvd) - b)) * 100;
          row.style.background = `linear-gradient(90deg,var(--brand-tint,#E5ECF3) ${w}%,var(--surface,#fff) ${w}%)`;
        }
        for (let c = 0; c < d; c++) {
          const idx = b * d + c;
          const pc = A.el("span", "bc-pc");
          const gid = i && idx < total ? Math.floor(idx / per) : -1;
          const inFull = i && gid >= 0 && gid < i.full;
          if (!i) pc.style.background = "transparent";
          else if (idx >= total) pc.classList.add("out");
          else {
            if (idx % per === 0) pc.classList.add("gs");
            if (!inFull) pc.classList.add("lo");
            else if (gid < st.k) {
              pc.classList.add(`c${gid % 2}`);
              if (idx % per === 0) pc.innerHTML = `<i>${gid + 1}</i>`;
            }
            if (inFull) pc.addEventListener("click", () => tap(gid));
          }
          row.append(pc);
        }
        bars.append(row);
      }
      for (const [n, b] of chipEls) b.setAttribute("aria-pressed", String(n === st.d));
      const full = i ? i.full : 0;
      cnt.innerHTML = `<b>${st.k}</b> ${T(counting[2].toLowerCase(), counting[3].toLowerCase())}`;
      more.disabled = ended || !i || st.k >= full;
      undo.disabled = ended || st.k === 0;
      keyBox.innerHTML =
        m.mode === "fracByWhole"
          ? `<span>${T(`Share the shaded part into ${m.dvs[0]} equal parts.`, `Reparte la parte sombreada en ${m.dvs[0]} partes iguales.`)}</span>`
          : `<span>${T("One group is", "Un grupo es")} ${tx(m.dvs)} ${T("of a bar:", "de una barra:")}</span><span class="k" style="width:${Math.min(100, Math.round(num(m.dvs) * 100))}%;max-width:100%"></span>`;
    }
    const tap = (/** @type {number} */ gid) => {
      if (ended) return;
      st.k = gid >= st.k ? gid + 1 : gid;
      emit();
      draw();
    };
    more.addEventListener("click", () => {
      st.k += 1;
      emit();
      draw();
    });
    undo.addEventListener("click", () => {
      st.k = Math.max(0, st.k - 1);
      emit();
      draw();
    });

    /* answer: whole + fraction boxes */
    const parts = (/** @type {string} */ s) => {
      const t = String(s).trim();
      let r = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
      if (r) return [r[1], r[2], r[3]];
      r = t.match(/^(\d+)\/(\d+)$/);
      if (r) return ["", r[1], r[2]];
      return [t, "", ""];
    };
    const p0 = parts(st.ans);
    const mkIn = (/** @type {string} */ v, /** @type {string} */ en, /** @type {string} */ esT) => {
      const inp = /** @type {any} */ (
        A.el("input", "bc-in", "", {
          type: "text",
          inputmode: "numeric",
          pattern: "[0-9]*",
          autocomplete: "off",
          "aria-label": L(en, esT),
        })
      );
      inp.value = v;
      inp.readOnly = ended;
      inp.addEventListener("input", () => {
        const [w, n, dd] = [wI.value.trim(), nI.value.trim(), dI.value.trim()];
        st.ans = n || dd ? `${w ? `${w} ` : ""}${n}/${dd}` : w;
        emit();
      });
      return inp;
    };
    const wI = mkIn(p0[0], "Whole number part", "Parte entera");
    const nI = mkIn(p0[1], "Numerator, the top number", "Numerador, el número de arriba");
    const dI = mkIn(p0[2], "Denominator, the bottom number", "Denominador, el número de abajo");
    const frac = A.el("span", "bc-fr");
    frac.append(nI, A.el("hr"), dI);
    ansBox.append(
      A.el(
        "span",
        "bc-lab",
        T(
          m.mode === "fracByWhole"
            ? "Size of one part (a fraction of the whole bar)"
            : "Quotient (whole number, fraction, or both)",
          m.mode === "fracByWhole"
            ? "Tamaño de una parte (fracción de la barra entera)"
            : "Cociente (entero, fracción o ambos)",
        ),
      ),
    );
    const line = A.el("div", "bc-ans");
    line.append(A.el("span", "", `${m.expr} =`), wI, frac);
    ansBox.append(line);

    root.append(head);
    if (m.opts) {
      const ob = A.el("div", "bc-box");
      ob.append(
        A.el(
          "span",
          "bc-lab",
          T("Which division does this model show?", "¿Qué división muestra este modelo?"),
        ),
      );
      const og = A.el("div", "bc-opts", "", { role: "group" });
      m.opts.list.forEach((/** @type {string} */ s, /** @type {number} */ k) => {
        const b = /** @type {any} */ (
          A.el("button", "bc-btn", s, { type: "button", "aria-pressed": String(st.pick === k) })
        );
        b.disabled = ended;
        b.addEventListener("click", () => {
          st.pick = k;
          for (const x of /** @type {any[]} */ ([...og.children]))
            x.setAttribute("aria-pressed", String(x === b));
          emit();
        });
        og.append(b);
      });
      ob.append(og);
      head.textContent = "? ÷ ?";
      root.append(ob);
    } else root.append(cutBox);
    root.append(A.el("div", "bc-box"), cntBox, ansBox, bar2);
    const mid = /** @type {any} */ (root.children[root.children.length - 4]);
    mid.append(A.el("span", "bc-lab", T("The bars", "Las barras")), bars, keyBox);
    host.append(root);
    void live;

    const show = (/** @type {any} */ r) => {
      fb.hidden = false;
      fb.className = `bc-fb${r.ok ? " ok" : ""}`;
      fb.innerHTML = r.ok
        ? T("You cut it and counted it.", "Lo cortaste y lo contaste.")
        : T(r.say || "Not yet.", r.sayEs || "Todavía no.");
      if (api.say)
        api.say(
          r.ok ? L("Correct", "Correcto") : L(r.say || "Not yet", r.sayEs || r.say || "Todavía no"),
        );
    };
    const lock = () => {
      ended = true;
      check.hidden = true;
      if (m.opts) head.textContent = `${m.expr} = ${tx(m.quo)}`;
      for (const b of /** @type {any[]} */ ([...root.querySelectorAll("button:not(.go)")]))
        b.disabled = true;
      for (const i of /** @type {any[]} */ ([...root.querySelectorAll("input")])) i.readOnly = true;
    };
    check.addEventListener("click", () => {
      if (ended) return;
      const local = def.grade(spec, st);
      const skip = ["uncut", "empty", "pick"].includes(local.tag || "");
      const out = skip ? null : api.submit && api.submit({ ...st });
      const res = out && typeof out === "object" && typeof out.ok === "boolean" ? out : local;
      if (res.ok) lock();
      show(res);
      draw();
    });
    draw();
    if (solved) {
      lock();
      show({ ok: true });
      draw();
    }
  }

  const def = {
    title: "Cut the bars",
    titleEs: "Corta las barras",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("barcut", def);
})();
