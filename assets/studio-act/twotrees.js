/**
 * Practice Studio activity: twotrees (window.StudioAct kind "twotrees", lesson 6-13).
 * Two trees, one fingerprint. The student builds a factor tree for a number. The activity then forces a DIFFERENT first split
 * and the student builds a second tree. The leaves of the two trees are shown side by side; a leaf that is not prime is
 * marked "still splits". Last, the student counts how many of each prime the leaves hold: the same for both trees.
 * State: { t1: [[n, d], ...] splits of tree 1, t2: splits of tree 2 (its first split is forced), cnt: { 2, 3, 5, 7 } }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;

  const PRIMES = [2, 3, 5, 7];
  const isPrime = (/** @type {number} */ n) =>
    n > 1 &&
    [...Array(Math.max(0, Math.floor(Math.sqrt(n)) - 1))].every((_, i) => n % (i + 2) !== 0);
  const NUMS = {
    1: [24, 30, 36, 40, 45, 48, 54, 60],
    2: [72, 84, 90, 96, 100, 108, 120],
    3: [126, 140, 150, 168, 180, 200, 210],
    4: [216, 240, 252, 270, 300, 360],
  };
  /** factor pairs [d, n/d] with 2 <= d <= n/d, smallest d first */
  const pairs = (/** @type {number} */ n) => {
    /** @type {number[][]} */
    const out = [];
    for (let d = 2; d * d <= n; d++) if (n % d === 0) out.push([d, n / d]);
    return out;
  };
  const smallestPrime = (/** @type {number} */ n) => {
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
    return n;
  };
  /** leaves after the splits, or null when a split names a leaf or factor that does not exist */
  function leavesOf(/** @type {number} */ N, /** @type {number[][]} */ splits) {
    let leaves = [N];
    for (const sp of splits || []) {
      const [n, d] = sp.map(Number);
      const i = leaves.indexOf(n);
      if (i < 0 || !(d > 1 && d < n && n % d === 0) || isPrime(n)) return null;
      leaves = [...leaves.slice(0, i), d, n / d, ...leaves.slice(i + 1)];
    }
    return leaves;
  }
  const canon = (/** @type {number[]} */ sp) => (sp ? Math.min(sp[1], sp[0] / sp[1]) : 0);
  /** the forced first split of tree 2: the smallest pair that is not the pair tree 1 started with */
  const forced = (/** @type {number} */ N, /** @type {number[]} */ first) => {
    const c = first ? canon(first) : 0;
    const p = pairs(N).find((x) => x[0] !== c) || pairs(N)[0];
    return [N, p[0]];
  };
  /** every composite leaf split at its smallest prime factor, after the given first split */
  function finish(/** @type {number} */ N, /** @type {number[]} */ first) {
    /** @type {number[][]} */
    const sp = [first];
    let leaves = /** @type {number[]} */ (leavesOf(N, sp));
    for (;;) {
      const n = leaves.find((x) => !isPrime(x));
      if (!n) return sp;
      const s = [n, smallestPrime(n)];
      sp.push(s);
      leaves = /** @type {number[]} */ (leavesOf(N, sp));
    }
  }
  const counts = (/** @type {number[]} */ leaves) => {
    /** @type {Record<number, number>} */
    const c = {};
    for (const p of PRIMES) c[p] = leaves.filter((x) => x === p).length;
    return c;
  };

  const WHO = ["Ana", "Ben", "Cruz", "Dara", "Eli", "Fay", "Gus", "Hana"];

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    const N = rng.pick(/** @type {any} */ (NUMS)[level]);
    const who = rng.pick(WHO);
    const ps = pairs(N);
    const first = [N, rng.pick(ps)[0]];
    const sol1 = finish(N, first);
    const sol2 = finish(N, forced(N, first));
    const cnt = counts(/** @type {number[]} */ (leavesOf(N, sol1)));
    const fp = PRIMES.filter((p) => cnt[p])
      .map((p) => (cnt[p] > 1 ? `${p}${"⁰¹²³⁴⁵⁶⁷⁸⁹"[cnt[p]]}` : `${p}`))
      .join(" × ");
    return {
      q: `${who} builds a factor tree for ${N} until every leaf is prime. Then the activity makes ${who} start a second tree with a different first split. Compare the leaves of the two trees, and count how many of each prime they hold.`,
      qEs: `${who} construye un árbol de factores para ${N} hasta que cada hoja sea un número primo. Luego la actividad hace que ${who} empiece un segundo árbol con una primera división diferente. Compara las hojas de los dos árboles y cuenta cuántos de cada primo tienen.`,
      x: `Different first splits make different-looking trees, but both end with the same prime leaves: ${fp} = ${N}. Every number has just one prime factorization.`,
      xEs: `Distintas primeras divisiones hacen árboles que se ven diferentes, pero los dos terminan con las mismas hojas primas: ${fp} = ${N}. Cada número tiene una sola factorización prima.`,
      h: [
        "Pick two factors that multiply to the number. Each factor becomes a leaf, and a leaf that is not prime still splits.",
        "Split every leaf that is not prime until all the leaves are prime numbers.",
        "Write the leaves of both trees in a list and count each prime. Do the two lists agree?",
      ],
      hEs: [
        "Elige dos factores que se multipliquen para dar el número. Cada factor es una hoja, y una hoja que no es prima todavía se divide.",
        "Divide cada hoja que no sea prima hasta que todas las hojas sean números primos.",
        "Escribe en una lista las hojas de los dos árboles y cuenta cada primo. ¿Coinciden las dos listas?",
      ],
      model: { N, level, sol1, sol2, cnt },
    };
  }

  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
    /** @type {any} */ more = {},
  ) => ({ ok: false, tag, say, sayEs, ...more });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const { N } = spec.model;
    st = st || {};
    const t1 = st.t1 || [];
    const t2 = st.t2 || [];
    const l1 = leavesOf(N, t1);
    const l2 = leavesOf(N, t2);
    if (!t1.length)
      return bad(
        "empty",
        "Build tree 1 first: split the number into two factors.",
        "Primero construye el árbol 1: divide el número en dos factores.",
      );
    if (!l1 || (t2.length && !l2))
      return bad(
        "bad-split",
        "One split does not multiply back to its number. Undo it and try another pair of factors.",
        "Una división no se multiplica de nuevo para dar su número. Deshazla y prueba otro par de factores.",
      );
    if (l1.some((x) => !isPrime(x)))
      return bad(
        "unset",
        "A leaf that is not prime still splits. Keep splitting tree 1.",
        "Una hoja que no es prima todavía se divide. Sigue dividiendo el árbol 1.",
      );
    if (!t2.length)
      return bad(
        "unset",
        "Tree 2 starts with a different split. Build it next.",
        "El árbol 2 empieza con una división diferente. Constrúyelo ahora.",
      );
    if (canon(t2[0]) === canon(t1[0]))
      return bad(
        "same-first",
        "Tree 2 must start with a different first split than tree 1.",
        "El árbol 2 debe empezar con una primera división diferente a la del árbol 1.",
      );
    if (/** @type {number[]} */ (l2).some((x) => !isPrime(x)))
      return bad(
        "unset",
        "A leaf that is not prime still splits. Keep splitting tree 2.",
        "Una hoja que no es prima todavía se divide. Sigue dividiendo el árbol 2.",
      );
    const want = counts(/** @type {number[]} */ (l1));
    const cnt = st.cnt || {};
    const marks = [true, true, ...PRIMES.map((p) => Number(cnt[p] || 0) === want[p])];
    const right = marks.filter(Boolean).length;
    if (right === marks.length) return { ok: true, right, of: marks.length, marks };
    const sum = PRIMES.reduce((s, p) => s + Number(cnt[p] || 0), 0);
    const leafN = /** @type {number[]} */ (l1).length;
    return bad(
      sum === leafN ? "wrong-primes" : "wrong-total",
      sum === leafN
        ? "The number of leaves is right, but they are not shared out among the primes correctly. Count one prime at a time in a tree."
        : "Count the leaves of one tree, one prime at a time. The counts for all the primes should account for every leaf.",
      sum === leafN
        ? "El número de hojas es correcto, pero no están repartidas bien entre los primos. Cuenta un primo a la vez en un árbol."
        : "Cuenta las hojas de un árbol, un primo a la vez. Los conteos de todos los primos deben incluir todas las hojas.",
      { right, of: marks.length, marks },
    );
  }
  const solution = (/** @type {any} */ spec) => ({
    t1: spec.model.sol1,
    t2: spec.model.sol2,
    cnt: spec.model.cnt,
  });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const s = solution(spec);
    const p0 = PRIMES.find((p) => m.cnt[p]) || 2;
    /** @type {any[]} */
    const c = [
      { ...s, cnt: { ...m.cnt, [p0]: m.cnt[p0] + 1 } },
      { ...s, cnt: { ...m.cnt, [p0]: Math.max(0, m.cnt[p0] - 1) } },
      { ...s, t1: s.t1.slice(0, 1) },
      { ...s, t2: [] },
      { ...s, t2: s.t1 },
      { t1: [], t2: [], cnt: {} },
      { ...s, cnt: { 2: 0, 3: 0, 5: 0, 7: 0 } },
      { ...s, t1: [[m.N, m.N + 1]] },
    ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.tt-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.tt-leaf{flex-direction:column;min-width:56px}
.tt-leaf small{font-weight:600;font-size:.7rem}
.tt-split{margin:0;padding-left:1.2em;font-weight:600}
.tt-prime{background:color-mix(in srgb,var(--ok,#0A7D4B) 30%,var(--surface,#fff))}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const { N } = spec.model;
    /** @type {Record<string, number>} */
    const sel = { t1: 0, t2: 0 };
    K.mount(host, spec, api, {
      kind: "twotrees",
      css: CSS,
      def,
      okEn: "Two different trees, one set of prime leaves.",
      okEs: "Dos árboles diferentes, un solo conjunto de hojas primas.",
      init: (/** @type {any} */ b) => ({
        t1: Array.isArray(b.t1)
          ? b.t1.map((/** @type {number[]} */ s) => [Number(s[0]), Number(s[1])])
          : [],
        t2: Array.isArray(b.t2)
          ? b.t2.map((/** @type {number[]} */ s) => [Number(s[0]), Number(s[1])])
          : [],
        cnt: { 2: 0, 3: 0, 5: 0, 7: 0, ...(b.cnt || {}) },
      }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const l1 = leavesOf(N, st.t1) || [N];
        const done1 = st.t1.length > 0 && l1.every(isPrime);
        if (!done1 && st.t2.length) st.t2 = [];
        if (done1 && !st.t2.length) st.t2 = [forced(N, st.t1[0])];
        const l2 = leavesOf(N, st.t2) || [N];
        const tree = (
          /** @type {string} */ key,
          /** @type {number[]} */ leaves,
          /** @type {string} */ en,
          /** @type {string} */ esT,
        ) => {
          const bx = K.box(en, esT);
          const splits = st[key];
          if (splits.length) {
            const ol = el("ol", "tt-split");
            splits.forEach((/** @type {number[]} */ s, /** @type {number} */ i) => {
              const f = key === "t2" && i === 0 ? ` (${L("forced", "obligada")})` : "";
              ol.append(el("li", "", `${s[0]} = ${s[1]} × ${s[0] / s[1]}${f}`));
            });
            bx.append(ol);
          }
          const row = el("div", "k-chips");
          leaves.forEach((n, i) => {
            if (isPrime(n))
              row.append(
                el("span", "k-cell tt-leaf tt-prime", `${n}<small>${T("prime", "primo")}</small>`),
              );
            else
              row.append(
                K.btn(
                  String(n),
                  "",
                  () => {
                    sel[key] = sel[key] === n ? 0 : n;
                    c.update(`${key}l${i}`);
                  },
                  {
                    pressed: sel[key] === n,
                    key: `${key}l${i}`,
                    label: `${n}, ${L("still splits", "todavía se divide")}`,
                    cls: "tt-leaf",
                  },
                ),
              );
            if (!isPrime(n))
              row.lastChild.insertAdjacentHTML(
                "beforeend",
                `<small>${T("still splits", "todavía se divide")}</small>`,
              );
          });
          bx.append(row);
          const n = sel[key];
          if (n && !isPrime(n) && leaves.includes(n)) {
            const ch = el("div", "k-chips", "", {
              role: "group",
              "aria-label": L(`Split ${n} into two factors`, `Divide ${n} en dos factores`),
            });
            for (const [d, e] of pairs(n))
              ch.append(
                K.btn(
                  `${d} × ${e}`,
                  "",
                  () => {
                    st[key].push([n, d]);
                    sel[key] = 0;
                    c.change(`${key}l0`);
                  },
                  { key: `${key}p${d}` },
                ),
              );
            bx.append(el("span", "k-note", T(`Split ${n} into:`, `Divide ${n} en:`)), ch);
          }
          if (splits.length && !(key === "t2" && splits.length === 1))
            bx.append(
              K.btn(
                "Undo",
                "Deshacer",
                () => {
                  splits.pop();
                  sel[key] = 0;
                  c.change(`${key}u`);
                },
                { key: `${key}u` },
              ),
            );
          return bx;
        };
        const cols = el("div", "tt-cols");
        cols.append(tree("t1", l1, `Tree 1 for ${N}`, `Árbol 1 de ${N}`));
        if (done1)
          cols.append(
            tree(
              "t2",
              l2,
              `Tree 2 for ${N} (a different first split)`,
              `Árbol 2 de ${N} (otra primera división)`,
            ),
          );
        view.append(cols);
        if (done1) {
          const sum = K.box("The leaves side by side", "Las hojas lado a lado");
          sum.append(
            el(
              "p",
              "k-note",
              T(
                `Tree 1: ${l1.length} leaves: ${[...l1].sort((x, y) => x - y).join(", ")}.`,
                `Árbol 1: ${l1.length} hojas: ${[...l1].sort((x, y) => x - y).join(", ")}.`,
              ),
            ),
            el(
              "p",
              "k-note",
              T(
                `Tree 2: ${l2.length} leaves: ${[...l2].sort((x, y) => x - y).join(", ")}.`,
                `Árbol 2: ${l2.length} hojas: ${[...l2].sort((x, y) => x - y).join(", ")}.`,
              ),
            ),
          );
          view.append(sum);
          if (l2.every(isPrime)) {
            const cb = K.box(
              "How many of each prime are in the leaves of one tree?",
              "¿Cuántos de cada primo hay en las hojas de un árbol?",
            );
            PRIMES.forEach((p, i) => {
              const mk = c.mark(2 + i);
              const row = el("div", `k-row${mk.cls}`);
              row.append(
                el("span", "k-lab", `${p}${mk.html}`),
                K.btn(
                  "−",
                  "",
                  () => {
                    st.cnt[p] = Math.max(0, Number(st.cnt[p] || 0) - 1);
                    c.change(`c${p}m`);
                  },
                  { key: `c${p}m`, label: `${L("Fewer", "Menos")} ${p}` },
                ),
                el("span", "k-big", String(st.cnt[p] || 0)),
                K.btn(
                  "+",
                  "",
                  () => {
                    st.cnt[p] = Math.min(9, Number(st.cnt[p] || 0) + 1);
                    c.change(`c${p}p`);
                  },
                  { key: `c${p}p`, label: `${L("More", "Más")} ${p}` },
                ),
              );
              cb.append(row);
            });
            view.append(cb);
          }
        }
      },
    });
  }

  const def = {
    title: "Two trees, one fingerprint",
    titleEs: "Dos árboles, una sola huella",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("twotrees", def);
})();
