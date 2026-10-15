/**
 * Practice Studio activity: ftree (prime factor tree, 6.NOS.4).
 * The student taps a composite number, picks a factor pair, and repeats until every branch ends in a prime,
 * then taps the ends into a base-and-exponent builder. Any valid tree is accepted.
 * State: { nodes: [{v, k: [i, j] | null}], f: [{b, e}] }. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const TIMES = "×";
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (/** @type {number} */ e) =>
    e === 1 ? "" : String(e).replace(/\d/g, (d) => SUP[+d]);
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const fac = (/** @type {number} */ n) => {
    const out = [];
    for (let p = 2; n > 1; p++) while (n % p === 0) out.push(p), (n /= p);
    return out;
  };
  const isPrime = (/** @type {number} */ n) => n > 1 && fac(n).length === 1;
  const powers = (/** @type {number[]} */ ps) => {
    /** @type {Record<number, number>} */ const c = {};
    for (const p of ps) c[p] = (c[p] || 0) + 1;
    return Object.entries(c).map(([b, e]) => ({ b: +b, e }));
  };
  const expText = (/** @type {{b: number, e: number}[]} */ f) =>
    f.map((r) => `${r.b}${sup(r.e)}`).join(` ${TIMES} `);
  const POOL = [[], [], [], [], []].map((_, _i) => /** @type {number[]} */ ([]));
  for (let n = 4; n <= 360; n++) {
    const w = fac(n).length;
    if (w === 2 && n <= 169) POOL[1].push(n);
    if (w === 3 && n <= 250) POOL[2].push(n);
    if (w === 4) POOL[3].push(n);
    if (w === 5 || w === 6) POOL[4].push(n);
  }
  // biome-ignore format: compact table
  const OPEN = [
    ["Locker N has a secret code.", "El casillero N tiene un código secreto."],
    ["Mission code N is locked.", "El código de misión N está bloqueado."],
    ["A treasure chest shows N.", "Un cofre del tesoro muestra N."],
    ["The robot display reads N.", "La pantalla del robot dice N."],
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    const n = rng.pick(POOL[level]);
    const o = rng.pick(OPEN);
    const f = powers(fac(n));
    const full = expText(f);
    return {
      model: { n },
      q: `${o[0].replace("N", String(n))} Build a factor tree, then write it with exponents.`,
      qEs: `${o[1].replace("N", String(n))} Construye un árbol de factores y escríbelo con exponentes.`,
      x: `${n} = ${fac(n).join(` ${TIMES} `)}. With exponents: ${full}. Every end of the tree is a prime.`,
      xEs: `${n} = ${fac(n).join(` ${TIMES} `)}. Con exponentes: ${full}. Cada extremo del árbol es un número primo.`,
      h: [
        "A prime has only two factors, 1 and itself. Keep splitting until every end is a prime.",
        `Start with any factor pair of ${n}. Then split each number that is not prime.`,
        "Count how many times each prime shows up at the ends. That count is its exponent.",
      ],
      hEs: [
        "Un primo solo tiene dos factores, 1 y él mismo. Sigue dividiendo hasta que cada extremo sea primo.",
        `Empieza con cualquier par de factores de ${n}. Luego divide cada número que no sea primo.`,
        "Cuenta cuántas veces aparece cada primo en los extremos. Esa cuenta es su exponente.",
      ],
    };
  }
  /** Canonical tree: split off the smallest prime each time. */
  function build(/** @type {number} */ n) {
    const nodes = [{ v: n, k: /** @type {number[]|null} */ (null) }];
    for (let i = 0; i < nodes.length; i++) {
      const v = nodes[i].v;
      if (isPrime(v)) continue;
      const p = fac(v)[0];
      nodes.push({ v: p, k: null }, { v: v / p, k: null });
      nodes[i].k = [nodes.length - 2, nodes.length - 1];
    }
    return nodes;
  }
  const solution = (/** @type {any} */ spec) => ({
    nodes: build(spec.model.n),
    f: powers(fac(spec.model.n)),
  });
  function wrong(/** @type {any} */ spec) {
    const n = spec.model.n;
    const full = solution(spec);
    const f = full.f;
    const badExp = clone(f);
    badExp[0].e += 1;
    const badSplit = clone(full);
    badSplit.nodes[badSplit.nodes[0].k[0]].v += 1;
    return [
      { nodes: [{ v: n, k: null }], f: [] },
      { nodes: full.nodes, f: badExp },
      badSplit,
      { nodes: full.nodes, f: f.slice(1) },
      {
        nodes: full.nodes,
        f: [...f.map((r) => ({ b: r.b, e: 1 })), { b: f[0].b, e: 1 }].slice(0, f.length + 1),
      },
    ];
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const n = spec.model.n;
    const nodes = st && st.nodes;
    if (!Array.isArray(nodes) || !nodes[0] || nodes[0].v !== n)
      return miss(
        "no-tree",
        "Tap the top number to start your tree.",
        "Toca el número de arriba para empezar tu árbol.",
      );
    for (const nd of nodes) {
      if (!nd.k) continue;
      const a = nodes[nd.k[0]];
      const b = nodes[nd.k[1]];
      if (!a || !b || a.v * b.v !== nd.v || a.v < 2 || b.v < 2)
        return miss(
          "bad-split",
          `A split in your tree does not work: ${a && b ? `${a.v} ${TIMES} ${b.v} makes ${a.v * b.v}, not ${nd.v}` : "a branch is missing"}. Multiply to check each split.`,
          `Una división de tu árbol no funciona: ${a && b ? `${a.v} ${TIMES} ${b.v} da ${a.v * b.v}, no ${nd.v}` : "falta una rama"}. Multiplica para revisar cada división.`,
        );
    }
    const open = nodes.find((/** @type {any} */ nd) => !nd.k && !isPrime(nd.v));
    if (open)
      return miss(
        "open-branch",
        `The branch ending in ${open.v} can still be split. A finished tree ends only in primes.`,
        `La rama que termina en ${open.v} todavía se puede dividir. Un árbol terminado solo acaba en primos.`,
      );
    const f = (st.f || []).filter((/** @type {any} */ r) => r && r.e > 0);
    if (!f.length)
      return miss(
        "no-exp",
        "The tree is done. Now tap the ends to write the number with exponents.",
        "El árbol está listo. Ahora toca los extremos para escribirlo con exponentes.",
      );
    const bad = f.find((/** @type {any} */ r) => !isPrime(r.b));
    if (bad)
      return miss(
        "base-not-prime",
        `${bad.b} is not a prime, so it cannot be a base here. Use the primes at the ends of the tree.`,
        `${bad.b} no es primo, así que no puede ser base. Usa los primos de los extremos del árbol.`,
      );
    const bases = f.map((/** @type {any} */ r) => r.b);
    if (new Set(bases).size < bases.length)
      return miss(
        "not-combined",
        "The same prime is written twice. Combine it into one base with one exponent.",
        "El mismo primo está escrito dos veces. Combínalo en una base con un exponente.",
      );
    const want = powers(fac(n));
    for (const r of f) {
      const w = want.find((x) => x.b === r.b);
      if (!w)
        return miss(
          "extra-base",
          `${r.b} is not one of the prime factors of ${n}. Check it against the ends of your tree.`,
          `${r.b} no es uno de los factores primos de ${n}. Compáralo con los extremos de tu árbol.`,
        );
      if (w.e !== r.e)
        return miss(
          "wrong-exp",
          `Count the ${r.b}s at the ends of the tree. The exponent for ${r.b} does not match that count.`,
          `Cuenta los ${r.b} en los extremos del árbol. El exponente de ${r.b} no coincide con esa cuenta.`,
        );
    }
    if (want.length !== f.length)
      return miss(
        "missing-base",
        "A prime from the ends of the tree is missing from your product.",
        "Falta un primo de los extremos del árbol en tu producto.",
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
.sa-btn[aria-pressed="true"]{background:var(--sa-bt);border-color:var(--sa-b);box-shadow:inset 0 0 0 2px var(--sa-b)}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-status.sa-bad{color:var(--sa-bad)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.ft-tree{position:relative;margin:6px auto;max-width:100%;overflow-x:auto}
.ft-wrap{position:relative;margin:0 auto}
.ft-wrap svg{position:absolute;inset:0;pointer-events:none}
.ft-wrap line{stroke:var(--sa-b);stroke-width:2.5}
.ft-n{position:absolute;width:44px;height:44px;min-width:44px;padding:0;border-radius:50%;border:3px solid var(--sa-b);background:var(--sa-s);color:var(--sa-i);font:inherit;font-weight:800;font-size:1rem;cursor:pointer}
.ft-n.ft-open{border-style:dashed;background:var(--sa-bt)}
.ft-n.ft-sel{box-shadow:0 0 0 4px var(--sa-sun);background:var(--sa-sunt)}
.ft-n.ft-done{background:var(--sa-bt);cursor:default;border-color:var(--sa-bl)}
.ft-n.ft-prime{background:var(--sa-b);color:var(--sa-s);cursor:default}
.ft-n.ft-prime::after{content:"\\2713";position:absolute;right:-6px;top:-8px;width:18px;height:18px;border-radius:50%;background:var(--sa-sun);color:#1B2C3F;font-size:.7rem;line-height:18px}
.ft-menu{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
.ft-menu .sa-btn{font-size:1.15rem;min-width:84px}
.ft-leg{font-size:.85rem;color:var(--sa-mute);margin:2px 0 6px;text-align:center}
.ft-bld{border:2px solid var(--sa-bd);border-radius:var(--sa-r);padding:10px;margin-top:10px}
.ft-rows{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0;min-height:52px;font-size:1.5rem;font-weight:800}
.ft-pow{display:inline-flex;align-items:center;gap:2px;border:2px solid var(--sa-bl);border-radius:12px;padding:2px 6px}
.ft-pow .sa-btn{min-height:44px;padding:0 10px}
.ft-leaf.ft-used{opacity:.4}
@media (prefers-reduced-motion:no-preference){.ft-n{transition:transform .15s}.ft-n:hover:not(.ft-prime):not(.ft-done){transform:scale(1.06)}}
@media (forced-colors:active){.sa-btn,.ft-n,.ft-pow{border-color:ButtonText}.ft-n.ft-sel{outline:3px solid Highlight}}
`;

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("ftree", CSS);
    const n = spec.model.n;
    const ro = !!api.solved;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${en}<span class="sa-es" lang="es">${es}</span>`;
    const root = A.el("div", "sa-root");
    if (api.es?.()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ nodes: [{ v: n, k: null }], f: [] });
    if (api.restore) Object.assign(st, clone(api.restore));
    let sel = -1;
    const emit = () => api.change?.(clone(st));
    const say = (/** @type {string} */ en, /** @type {string} */ es, bad = false) => {
      status.innerHTML = T(en, es);
      status.classList.toggle("sa-bad", bad);
      api.say?.(L(en, es));
    };
    const tree = A.el("div", "ft-tree");
    const leg = A.el(
      "p",
      "ft-leg",
      T(
        "Dashed = can still split. Filled with a check = prime (an end).",
        "Rayado = se puede dividir. Relleno con marca = primo (un extremo).",
      ),
    );
    const menu = A.el("div", "ft-menu", "", { role: "group" });
    const bld = A.el("div", "ft-bld");
    const status = A.el("p", "sa-status");
    root.append(leg, tree, menu, bld, status);
    const leaves = () =>
      st.nodes.map((nd, i) => ({ nd, i })).filter((o) => !o.nd.k && isPrime(o.nd.v));
    const firstOpen = () => st.nodes.findIndex((nd) => !nd.k && !isPrime(nd.v));

    function layoutTree() {
      const pos = /** @type {{x: number, d: number}[]} */ ([]);
      let slot = 0;
      let depth = 0;
      const walk = (/** @type {number} */ i, /** @type {number} */ d) => {
        const nd = st.nodes[i];
        depth = Math.max(depth, d);
        if (!nd.k) pos[i] = { x: slot++, d };
        else {
          const [a, b] = nd.k.map((j) => walk(j, d + 1));
          pos[i] = { x: (a.x + b.x) / 2, d };
        }
        return pos[i];
      };
      walk(0, 0);
      return { pos, slots: Math.max(slot, 1), depth };
    }
    function paintTree() {
      const { pos, slots, depth } = layoutTree();
      const sw = 52;
      const lh = 62;
      const w = slots * sw;
      const h = (depth + 1) * lh;
      const wrap = A.el("div", "ft-wrap", "", { style: `width:${w}px;height:${h}px` });
      let lines = "";
      st.nodes.forEach((nd, i) => {
        if (nd.k && pos[i])
          for (const j of nd.k)
            lines += `<line x1="${pos[i].x * sw + sw / 2}" y1="${pos[i].d * lh + 22}" x2="${pos[j].x * sw + sw / 2}" y2="${pos[j].d * lh + 22}"/>`;
      });
      wrap.innerHTML = `<svg width="${w}" height="${h}" aria-hidden="true">${lines}</svg>`;
      st.nodes.forEach((nd, i) => {
        if (!pos[i]) return;
        const prime = isPrime(nd.v);
        const open = !nd.k && !prime;
        const b = A.el(
          "button",
          `ft-n ${prime ? "ft-prime" : open ? "ft-open" : "ft-done"} ${i === sel ? "ft-sel" : ""}`,
          String(nd.v),
          { type: "button" },
        );
        b.style.left = `${pos[i].x * sw + (sw - 44) / 2}px`;
        b.style.top = `${pos[i].d * lh}px`;
        const kids = nd.k ? `${st.nodes[nd.k[0]].v} ${TIMES} ${st.nodes[nd.k[1]].v}` : "";
        b.setAttribute(
          "aria-label",
          prime
            ? L(`${nd.v}, prime, an end of the tree`, `${nd.v}, primo, un extremo del árbol`)
            : open
              ? L(`${nd.v}, not prime, tap to split`, `${nd.v}, no es primo, toca para dividir`)
              : L(`${nd.v}, split into ${kids}`, `${nd.v}, dividido en ${kids}`),
        );
        if (open) b.setAttribute("aria-pressed", String(i === sel));
        if (ro || !open) b.setAttribute(open ? "disabled" : "aria-disabled", "true");
        if (open && !ro)
          b.addEventListener(
            "click",
            () => ((sel = i), paint(), menu.querySelector("button")?.focus()),
          );
        wrap.append(b);
      });
      tree.replaceChildren(wrap);
    }
    function paintMenu() {
      menu.replaceChildren();
      menu.hidden = sel < 0 || ro;
      if (menu.hidden) return;
      const v = st.nodes[sel].v;
      const rng = G.rng(`${spec.seed}|${v}`);
      const good = [];
      for (let a = 2; a * a <= v; a++) if (v % a === 0) good.push([a, v / a]);
      const opts = rng
        .shuffle(good)
        .slice(0, 3)
        .map((p) => ({ p, ok: true }));
      const bads = [{ p: [1, v] }];
      for (let t = 0; t < 12 && bads.length < 6 - opts.length; t++) {
        const g = rng.pick(good);
        const p = rng.chance(0.5)
          ? [g[0] + rng.pick([-1, 1]), g[1]]
          : [g[0], g[1] + rng.pick([-1, 1, 2])];
        if (
          p[0] >= 2 &&
          p[1] >= 2 &&
          p[0] * p[1] !== v &&
          !bads.some((x) => x.p[0] === p[0] && x.p[1] === p[1])
        )
          bads.push({ p });
      }
      menu.setAttribute(
        "aria-label",
        L(`Pick a factor pair for ${v}`, `Elige un par de factores para ${v}`),
      );
      for (const o of rng.shuffle([...opts, ...bads.map((b) => ({ ...b, ok: false }))])) {
        const [a, b] = o.p;
        const btn = A.el("button", "sa-btn", `${a} ${TIMES} ${b}`, {
          type: "button",
          "aria-label": `${a} ${L("times", "por")} ${b}`,
        });
        btn.addEventListener("click", () => {
          if (!o.ok) {
            const msg =
              a === 1
                ? [
                    `1 ${TIMES} ${v} does not split ${v} into smaller numbers. Try a pair with no 1.`,
                    `1 ${TIMES} ${v} no divide ${v} en números menores. Prueba un par sin 1.`,
                  ]
                : [
                    `${a} ${TIMES} ${b} makes ${a * b}, not ${v}. Multiply to check.`,
                    `${a} ${TIMES} ${b} da ${a * b}, no ${v}. Multiplica para revisar.`,
                  ];
            return say(msg[0], msg[1], true);
          }
          st.nodes.push({ v: a, k: null }, { v: b, k: null });
          st.nodes[sel].k = [st.nodes.length - 2, st.nodes.length - 1];
          sel = firstOpen();
          paint();
          emit();
          say(
            `Split ${v} into ${a} ${TIMES} ${b}.${sel < 0 ? " Every end is prime. Now write it with exponents." : ""}`,
            `${v} se dividió en ${a} ${TIMES} ${b}.${sel < 0 ? " Cada extremo es primo. Ahora escríbelo con exponentes." : ""}`,
          );
          (sel < 0 ? bld.querySelector("button") : tree.querySelector(".ft-open"))?.focus();
        });
        menu.append(btn);
      }
    }
    function paintBuilder() {
      bld.hidden = firstOpen() >= 0;
      if (bld.hidden) return;
      const lv = leaves().map((o) => o.nd.v);
      const left = { ...Object.fromEntries(st.f.map((r) => [r.b, r.e])) };
      const chips = lv.map((p) => {
        const used = (left[p] || 0) > 0;
        if (used) left[p]--;
        return { p, used };
      });
      bld.innerHTML = `<b>${T("Tap the ends to write the product with exponents", "Toca los extremos para escribir el producto con exponentes")}</b>`;
      const ends = A.el("div", "ft-rows");
      chips.forEach((c) => {
        const b = A.el("button", `sa-btn ft-leaf ${c.used ? "ft-used" : ""}`, String(c.p), {
          type: "button",
          "aria-label": L(
            `End ${c.p}${c.used ? ", already used" : ""}`,
            `Extremo ${c.p}${c.used ? ", ya usado" : ""}`,
          ),
        });
        if (ro || c.used) b.disabled = true;
        b.addEventListener("click", () => {
          const r = st.f.find((x) => x.b === c.p);
          if (r) r.e++;
          else st.f.push({ b: c.p, e: 1 });
          paint();
          emit();
        });
        ends.append(b);
      });
      const rows = A.el("div", "ft-rows", "", { "aria-label": L("Your product", "Tu producto") });
      st.f.forEach((r, i) => {
        const g = A.el("span", "ft-pow", `<span>${r.b}${sup(r.e) || ""}</span>`);
        const step = (
          /** @type {number} */ d,
          /** @type {string} */ txt,
          /** @type {string} */ lab,
        ) => {
          const b = A.el("button", "sa-btn", txt, { type: "button", "aria-label": lab });
          if (ro) b.disabled = true;
          b.addEventListener("click", () => {
            r.e = Math.min(8, r.e + d);
            if (r.e < 1) st.f.splice(i, 1);
            paint();
            emit();
          });
          return b;
        };
        g.prepend(step(-1, "−", L(`Lower the exponent of ${r.b}`, `Baja el exponente de ${r.b}`)));
        g.append(step(1, "+", L(`Raise the exponent of ${r.b}`, `Sube el exponente de ${r.b}`)));
        g.setAttribute("aria-label", `${r.b} ${L("to the power", "a la potencia")} ${r.e}`);
        rows.append(g);
        if (i < st.f.length - 1) rows.append(A.el("span", "", TIMES, { "aria-hidden": "true" }));
      });
      if (!st.f.length)
        rows.append(
          A.el(
            "span",
            "",
            `<span style="font-weight:600;color:var(--sa-mute);font-size:1rem">${T("Your product shows here.", "Tu producto aparece aquí.")}</span>`,
          ),
        );
      bld.append(ends, rows);
    }
    function paint() {
      paintTree();
      paintMenu();
      paintBuilder();
    }
    if (!ro) {
      const row = A.el("div", "sa-row");
      const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
        type: "button",
        "aria-label": L("Check my tree", "Comprobar mi árbol"),
      });
      chk.addEventListener("click", () => {
        const r = api.submit?.(clone(st));
        if (r && r.ok === false) status.textContent = "";
      });
      const undo = A.el("button", "sa-btn", T("Start over", "Empezar de nuevo"), {
        type: "button",
      });
      undo.addEventListener("click", () => {
        st.nodes = [{ v: n, k: null }];
        st.f = [];
        sel = 0;
        paint();
        emit();
        say("Started over.", "Empezamos de nuevo.");
      });
      row.append(chk, undo);
      root.append(row);
      sel = firstOpen();
    }
    paint();
    if (ro) say("Solved.", "Resuelto.");
  }

  A.register("ftree", {
    title: "Factor tree",
    titleEs: "Árbol de factores",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();
