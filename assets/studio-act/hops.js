/**
 * Practice Studio activity: hops (hoppers on a number line; multiples, LCM and factors, 6.NOS.4).
 * Goals: multiples (tap every shared landing), lcm (tap the first shared landing; L4 reverses it), factors
 * (tap every hop size that lands exactly on the flag; L4 uses two flags). No timers: the student hops by tapping.
 * State: { h: hops taken by each hopper, pick: number | number[] | null, v: last tested hop size }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const lcmOf = (/** @type {number[]} */ xs) => xs.reduce((a, b) => G.lcm(a, b), 1);
  const divisors = (/** @type {number} */ n) => {
    const out = [];
    for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
    return out;
  };
  const NAMES = [
    ["Frog", "Rana"],
    ["Rabbit", "Conejo"],
    ["Kangaroo", "Canguro"],
  ];
  const sameSet = (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
    a.length === b.length && a.every((v) => b.includes(v));

  /** Step sets where no step divides another, so the LCM is bigger than every step. */
  function steps(
    /** @type {any} */ rng,
    /** @type {number} */ k,
    /** @type {number} */ lo,
    /** @type {number} */ hi,
    /** @type {number} */ cap,
  ) {
    for (let t = 0; t < 400; t++) {
      const s = rng.distinct(k, lo, hi).sort((a, b) => a - b);
      const ok = s.every((x, i) => s.every((y, j) => i === j || y % x !== 0));
      if (ok && lcmOf(s) <= cap) return s;
    }
    return k === 2 ? [3, 4] : [2, 3, 5];
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const goal = params.goal || (level === 4 ? "lcm" : rng.pick(["lcm", "multiples", "factors"]));
    const spec = /** @type {any} */ ({ goal });
    if (goal === "factors") return makeFactors(rng, level, spec);
    if (goal === "lcm" && level === 4) return makeReverse(rng, spec);
    const k = level === 3 && rng.chance(0.5) ? 3 : 2;
    const st =
      level === 1
        ? steps(rng, 2, 2, 7, 42)
        : level === 2
          ? steps(rng, 2, 3, 12, 72)
          : level === 3 && k === 3
            ? steps(rng, 3, 2, 6, 60)
            : steps(rng, 2, level === 4 ? 4 : 3, 12, 40);
    const L = lcmOf(st);
    const mult = goal === "lcm" ? 1 : level === 3 ? 2 : 3;
    const ctx = level === 3 && k === 2 ? rng.pick(["bus", "light"]) : "";
    const names = ctx
      ? st.map((_, i) => [
          `${ctx === "bus" ? "Bus" : "Light"} ${"ABC"[i]}`,
          `${ctx === "bus" ? "Autobús" : "Luz"} ${"ABC"[i]}`,
        ])
      : rng.shuffle(NAMES).slice(0, k);
    spec.model = { steps: st, max: goal === "lcm" ? L + Math.max(...st) : L * mult };
    spec.names = names;
    const listEn = st.map((s, i) =>
      ctx === "bus"
        ? `${names[i][0]} leaves every ${s} minutes`
        : ctx === "light"
          ? `${names[i][0]} flashes every ${s} beats`
          : `${names[i][0]} hops ${s} at a time`,
    );
    const listEs = st.map((s, i) =>
      ctx === "bus"
        ? `${names[i][1]} sale cada ${s} minutos`
        : ctx === "light"
          ? `${names[i][1]} parpadea cada ${s} tiempos`
          : `${names[i][1]} salta de ${s} en ${s}`,
    );
    const join = (/** @type {string[]} */ a, /** @type {string} */ w) =>
      a.length === 2 ? `${a[0]} ${w} ${a[1]}` : `${a[0]}, ${a[1]} ${w} ${a[2]}`;
    const start = ctx ? " All start at 0." : " All start at 0.";
    const task =
      goal === "lcm"
        ? [
            ctx
              ? "Tap the first number where they all line up."
              : "Tap the first number where all land.",
            ctx
              ? "Toca el primer número donde todos coinciden."
              : "Toca el primer número donde todos caen.",
          ]
        : [
            `Tap every number up to ${spec.model.max} where all land.`,
            `Toca cada número hasta ${spec.model.max} donde todos caen.`,
          ];
    spec.q = `${join(listEn, "and")}.${start} ${task[0]}`;
    spec.qEs = `${join(listEs, "y")}. Todos empiezan en 0. ${task[1]}`;
    const commons = [];
    for (let v = L; v <= spec.model.max; v += L) commons.push(v);
    spec.x =
      goal === "lcm"
        ? `All the hoppers first land together on ${L}. That is the least common multiple.`
        : `All the hoppers land together on ${commons.join(", ")}. Each one is a multiple of the least common multiple, ${L}.`;
    spec.xEs =
      goal === "lcm"
        ? `Todos caen juntos por primera vez en ${L}. Ese es el mínimo común múltiplo.`
        : `Todos caen juntos en ${commons.join(", ")}. Cada uno es múltiplo del mínimo común múltiplo, ${L}.`;
    spec.h =
      goal === "lcm"
        ? [
            "Hop each one. Every landing leaves a mark.",
            "Hop the one who is behind, so no one gets far ahead.",
            "Look for the first number that has a mark from every hopper.",
          ]
        : [
            "Hop each one. Every landing leaves a mark.",
            "Find a number that has a mark from every hopper.",
            "After they meet once, keep hopping. Do they meet again?",
          ];
    spec.hEs =
      goal === "lcm"
        ? [
            "Haz saltar a cada uno. Cada caída deja una marca.",
            "Haz saltar al que va atrás, para que nadie se adelante mucho.",
            "Busca el primer número con una marca de cada saltador.",
          ]
        : [
            "Haz saltar a cada uno. Cada caída deja una marca.",
            "Busca un número con una marca de cada saltador.",
            "Cuando se encuentren una vez, sigue saltando. ¿Se encuentran otra vez?",
          ];
    return spec;
  }
  function makeReverse(/** @type {any} */ rng, /** @type {any} */ spec) {
    for (let t = 0; t < 400; t++) {
      const a = rng.int(4, 15);
      const b0 = rng.int(3, 20);
      const L = G.lcm(a, b0);
      if (a === b0 || L > 90 || L % a !== 0 || L === a || L === b0 || L < 24) continue;
      const valid = divisors(L).filter((d) => d > 1 && G.lcm(a, d) === L);
      const bad = divisors(L).filter((d) => d > 1 && G.lcm(a, d) !== L);
      if (valid.length < 2 || bad.length < 2) continue;
      const cands = rng
        .shuffle([...rng.shuffle(valid).slice(0, 3), ...rng.shuffle(bad).slice(0, 3)])
        .sort((x, y) => x - y);
      spec.model = { steps: [a], max: L, L, cands };
      spec.names = [
        ["Light A", "Luz A"],
        ["Light B", "Luz B"],
      ];
      spec.q = `Light A flashes every ${a} beats. Light B flashes every ? beats. Both start at 0 and next flash together at ${L}. Tap every step Light B could have.`;
      spec.qEs = `La luz A parpadea cada ${a} tiempos. La luz B parpadea cada ? tiempos. Ambas empiezan en 0 y vuelven a coincidir en ${L}. Toca cada paso que podría tener la luz B.`;
      const ok = cands.filter((c) => G.lcm(a, c) === L);
      spec.x = `Step sizes ${ok.join(", ")} make the lights first flash together at ${L}. The others meet sooner, because their first shared multiple with ${a} is smaller.`;
      spec.xEs = `Los pasos ${ok.join(", ")} hacen que las luces coincidan por primera vez en ${L}. Los otros coinciden antes, porque su primer múltiplo común con ${a} es menor.`;
      spec.h = [
        "Try one step size for Light B and see where it first lines up with Light A.",
        `The first match has to be exactly ${L}. Not sooner, not later.`,
        "Test the sizes one at a time. More than one can work.",
      ];
      spec.hEs = [
        "Prueba un paso para la luz B y mira dónde coincide primero con la luz A.",
        `La primera coincidencia debe ser exactamente ${L}. Ni antes ni después.`,
        "Prueba los pasos uno por uno. Puede servir más de uno.",
      ];
      return spec;
    }
    return makeReverse(rng, spec);
  }
  function makeFactors(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {any} */ spec,
  ) {
    let targets;
    for (let t = 0; t < 400; t++) {
      if (level === 4) {
        const g = rng.int(4, 12);
        const x = rng.int(2, 6);
        const y = rng.int(2, 6);
        if (x === y || G.gcd(x, y) !== 1 || g * Math.max(x, y) > 72) continue;
        targets = [g * x, g * y].sort((p, q) => p - q);
      } else {
        const n = level === 1 ? rng.int(6, 20) : level === 2 ? rng.int(20, 36) : rng.int(36, 64);
        if (divisors(n).length < 4) continue;
        targets = [n];
      }
      break;
    }
    targets = targets || [24];
    const facs = divisors(targets[0]).filter((d) => targets.every((n) => n % d === 0));
    const near = [];
    for (let d = 2; d < Math.max(...targets); d++)
      if (
        !facs.includes(d) &&
        targets.some((n) => n % d === 0 || Math.abs(n - d * Math.round(n / d)) <= 2)
      )
        near.push(d);
    const pool = rng.shuffle(near).slice(0, level === 1 ? 3 : 5);
    const cands = [...new Set([...(level === 4 ? facs : divisors(targets[0])), ...pool])].sort(
      (a, b) => a - b,
    );
    const final = [
      ...new Set([
        ...cands,
        ...(level === 4
          ? divisors(targets[1])
              .filter((d) => !facs.includes(d))
              .slice(0, 3)
          : []),
      ]),
    ].sort((a, b) => a - b);
    spec.model = { targets, steps: [], max: Math.max(...targets), cands: final };
    spec.names = [["Frog", "Rana"]];
    const tl = targets.join(" and ");
    spec.q =
      targets.length === 1
        ? `A frog hops from 0 to the flag at ${targets[0]}. Tap every hop size that lands exactly on the flag.`
        : `A frog hops from 0. There are flags at ${targets[0]} and ${targets[1]}. Tap every hop size that lands exactly on both flags.`;
    spec.qEs =
      targets.length === 1
        ? `Una rana salta desde 0 hasta la bandera en ${targets[0]}. Toca cada tamaño de salto que cae exactamente en la bandera.`
        : `Una rana salta desde 0. Hay banderas en ${targets[0]} y ${targets[1]}. Toca cada tamaño de salto que cae exactamente en ambas banderas.`;
    spec.x = `Hop sizes ${facs.join(", ")} land exactly on ${tl}. They come in pairs: a hop of s takes (number ÷ s) hops, so both numbers are factors.`;
    spec.xEs = `Los saltos de ${facs.join(", ")} caen exactamente en ${tl}. Vienen en pares: un salto de s necesita (número ÷ s) saltos, así que ambos son factores.`;
    spec.h = [
      "A hop size works only if you can land exactly on the flag with no overshoot.",
      "Test a size and count its hops. The number of hops works as a hop size too.",
      "Go through the sizes one at a time and look at the last landing.",
    ];
    spec.hEs = [
      "Un salto sirve solo si puedes caer exactamente en la bandera sin pasarte.",
      "Prueba un tamaño y cuenta sus saltos. El número de saltos también sirve como tamaño.",
      "Revisa los tamaños uno por uno y mira la última caída.",
    ];
    return spec;
  }

  const truth = (/** @type {any} */ spec) => {
    const m = spec.model;
    if (spec.goal === "factors")
      return m.cands.filter((/** @type {number} */ d) =>
        m.targets.every((/** @type {number} */ n) => n % d === 0),
      );
    if (m.L) return m.cands.filter((/** @type {number} */ c) => G.lcm(m.steps[0], c) === m.L);
    const L = lcmOf(m.steps);
    const out = [];
    for (let v = L; v <= m.max; v += L) out.push(v);
    return spec.goal === "lcm" ? L : out;
  };
  function solution(/** @type {any} */ spec) {
    const m = spec.model;
    const t = truth(spec);
    return { h: m.steps.map((/** @type {number} */ s) => Math.floor(m.max / s)), pick: t, v: null };
  }
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const t = truth(spec);
    const hs = m.steps.map((/** @type {number} */ s) => Math.floor(m.max / s));
    if (!Array.isArray(t)) {
      const prod = m.steps.reduce((a, b) => a * b, 1);
      return [
        { h: hs, pick: prod !== t ? prod : 2 * t },
        { h: hs, pick: m.steps[0] },
        { h: hs, pick: null },
        { h: hs, pick: t + m.steps[1] === t ? 1 : t + m.steps[0] },
      ];
    }
    const pool = spec.goal === "multiples" ? [] : m.cands;
    const extra =
      spec.goal === "multiples"
        ? m.steps[0] * 1
        : pool.find((/** @type {number} */ d) => !t.includes(d));
    const missingOne = t.slice(0, -1);
    return [
      { h: hs, pick: [] },
      { h: hs, pick: missingOne },
      { h: hs, pick: [...t, extra] },
      { h: hs, pick: t.length > 1 ? [t[0], extra] : [extra] },
    ].filter((s) => !sameSet(s.pick, t));
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const pick = st ? st.pick : null;
    const t = truth(spec);
    const nm = (/** @type {number} */ i) => spec.names[i][0];
    if (spec.goal === "lcm" && !m.L) {
      if (typeof pick !== "number")
        return miss(
          "none",
          "Tap the first number where all of them land.",
          "Toca el primer número donde todos caen.",
        );
      const off = m.steps.findIndex((/** @type {number} */ s) => pick % s !== 0);
      if (off >= 0)
        return miss(
          "not-shared",
          `${nm(off)} does not land on ${pick}. A shared number needs a mark from every hopper.`,
          `${spec.names[off][1]} no cae en ${pick}. Un número compartido necesita una marca de cada saltador.`,
        );
      if (pick !== t)
        return miss(
          "not-first",
          `Every hopper lands on ${pick}, but they all land together earlier. Look for the FIRST shared mark.`,
          `Todos caen en ${pick}, pero coinciden antes. Busca la PRIMERA marca compartida.`,
        );
      return { ok: true };
    }
    const arr = Array.isArray(pick) ? pick : [];
    if (!arr.length) return miss("none", "Tap your answer first.", "Primero toca tu respuesta.");
    const extra = arr.find((v) => !t.includes(v));
    if (extra !== undefined) {
      if (spec.goal === "multiples") {
        const off = m.steps.findIndex((/** @type {number} */ s) => extra % s !== 0);
        return miss(
          "not-shared",
          `${nm(off)} does not land on ${extra}. Every hopper needs a mark there.`,
          `${spec.names[off][1]} no cae en ${extra}. Cada saltador necesita una marca ahí.`,
        );
      }
      if (m.L)
        return miss(
          "not-first",
          `With a step of ${extra}, the lights first flash together at ${G.lcm(m.steps[0], extra)}, not ${m.L}.`,
          `Con un paso de ${extra}, las luces coinciden primero en ${G.lcm(m.steps[0], extra)}, no en ${m.L}.`,
        );
      const bad = m.targets.find((/** @type {number} */ n) => n % extra !== 0);
      return miss(
        "overshoot",
        `A hop of ${extra} does not land exactly on ${bad}: it lands on ${Math.floor(bad / extra) * extra}, then ${(Math.floor(bad / extra) + 1) * extra}.`,
        `Un salto de ${extra} no cae exactamente en ${bad}: cae en ${Math.floor(bad / extra) * extra} y luego en ${(Math.floor(bad / extra) + 1) * extra}.`,
      );
    }
    if (arr.length < t.length) {
      if (
        spec.goal === "factors" &&
        m.targets.length === 1 &&
        arr.some((v) => !arr.includes(m.targets[0] / v))
      )
        return miss(
          "partner",
          "Every factor comes with a partner. Check the partner of each size you picked.",
          "Cada factor viene con un compañero. Revisa el compañero de cada tamaño que elegiste.",
        );
      return miss(
        "missing",
        spec.goal === "multiples"
          ? `Some shared landings are missing. Check every shared mark up to ${m.max}.`
          : m.L
            ? "More step sizes work. Test the ones you have not picked."
            : "More hop sizes land exactly. Keep testing the sizes you have not picked.",
        spec.goal === "multiples"
          ? `Faltan algunas caídas compartidas. Revisa cada marca compartida hasta ${m.max}.`
          : m.L
            ? "Sirven más pasos. Prueba los que no has elegido."
            : "Más saltos caen exactamente. Sigue probando los tamaños que no has elegido.",
      );
    }
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
.sa-btn[aria-pressed="true"]{background:var(--sa-sunt);border-color:var(--sa-dk);box-shadow:inset 0 0 0 2px var(--sa-dk)}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-status.sa-bad{color:var(--sa-bad)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.hp-lane{overflow-x:auto;border:2px solid var(--sa-bd);border-radius:var(--sa-r);background:var(--sa-s);margin:6px 0}
.hp-lane svg{display:block}
.hp-lane text{fill:var(--sa-i);font:700 12px system-ui,sans-serif;text-anchor:middle}
.hp-ax{stroke:var(--sa-i);stroke-width:2}.hp-tk{stroke:var(--sa-mute);stroke-width:1}
.hp-arc{fill:none;stroke-width:2}
.hp-r0{--c:var(--sa-b)}.hp-r1{--c:var(--sa-dk)}.hp-r2{--c:var(--sa-ok)}
.hp-arc,.hp-mk{stroke:var(--c)}.hp-mk{fill:var(--c);stroke-width:1.5}
.hp-r1 .hp-mk{fill:var(--sa-sun)}.hp-r1 .hp-arc{stroke-dasharray:5 3}.hp-r2 .hp-arc{stroke-dasharray:1 4;stroke-linecap:round}
.hp-guide{stroke:var(--sa-bad);stroke-width:2;stroke-dasharray:4 3}
.hp-flag{fill:var(--sa-bad);stroke:none}.hp-lane .hp-flagt{fill:var(--sa-bad);font-weight:800}
.hp-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.hp-chips .sa-btn{min-width:48px;padding:6px 10px;font-size:1.1rem}
.hp-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-weight:700;margin:4px 0}
.hp-info{margin:6px 0;font-weight:700;min-height:1.5em}
@media (forced-colors:active){.sa-btn{border-color:ButtonText}.sa-btn[aria-pressed="true"]{outline:3px solid Highlight}.hp-ax,.hp-arc,.hp-mk{stroke:CanvasText}}
`;

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("hops", CSS);
    const m = spec.model;
    const goal = spec.goal;
    const ro = !!api.solved;
    const multi = goal !== "lcm" || !!m.L;
    const test = goal === "factors" || !!m.L;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${en}<span class="sa-es" lang="es">${es}</span>`;
    const root = A.el("div", "sa-root");
    if (api.es?.()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ h: m.steps.map(() => 0), pick: multi ? [] : null, v: null });
    if (api.restore) Object.assign(st, clone(api.restore));
    const emit = () => api.change?.(clone(st));
    const status = A.el("p", "sa-status");
    const say = (/** @type {string} */ en, /** @type {string} */ es, bad = false) => {
      status.innerHTML = T(en, es);
      status.classList.toggle("sa-bad", bad);
      api.say?.(L(en, es));
    };
    const laneBox = A.el("div", "hp-lane", "", { tabindex: "0", role: "group" });
    const info = A.el("p", "hp-info");
    const chips = A.el("div", "hp-chips", "", { role: "group" });
    const legend = A.el("div", "hp-legend");
    const ctrl = A.el("div", "sa-row");
    root.append(legend, laneBox, info, ctrl, chips, status);
    const mx = m.max;
    const unit = Math.max(9, Math.min(30, Math.floor(560 / mx)));
    const lands = (/** @type {number} */ i) =>
      Array.from({ length: st.h[i] }, (_, j) => (j + 1) * m.steps[i]);
    /** Rows to draw: [{label, step, marks}] */
    const rows = () => {
      if (!test) return m.steps.map((s, i) => ({ s, marks: lands(i), name: spec.names[i][0] }));
      const t = st.v;
      const base =
        goal === "factors"
          ? []
          : [
              {
                s: m.steps[0],
                marks: Array.from(
                  { length: Math.floor(mx / m.steps[0]) },
                  (_, j) => (j + 1) * m.steps[0],
                ),
                name: spec.names[0][0],
              },
            ];
      if (t)
        base.push({
          s: t,
          marks: Array.from(
            { length: Math.floor((goal === "factors" ? mx + t : mx) / t) },
            (_, j) => (j + 1) * t,
          ).filter((v) => goal !== "factors" || v < mx + t),
          name: `${t}`,
        });
      return base;
    };
    function paintLane() {
      const rs = rows();
      const W2 = mx * unit + 56;
      const H = Math.max(1, rs.length) * 40 + 44;
      const ls = [1, 2, 5, 10, 20].find((k) => k * unit >= 26) || 20;
      const x = (/** @type {number} */ v) => 28 + v * unit;
      let s = `<line class="hp-ax" x1="${x(0)}" x2="${x(mx)}" y1="${H - 30}" y2="${H - 30}"/>`;
      for (let v = 0; v <= mx; v++)
        s += `<line class="hp-tk" x1="${x(v)}" x2="${x(v)}" y1="${H - 30}" y2="${H - (v % ls === 0 ? 22 : 26)}"/>${v % ls === 0 ? `<text x="${x(v)}" y="${H - 8}">${v}</text>` : ""}`;
      rs.forEach((r, ri) => {
        const y = H - 30 - ri * 40 - 6;
        let prev = 0;
        let g = `<g class="hp-r${Math.min(ri, 2)}">`;
        for (const v of r.marks) {
          const mid = (x(prev) + x(v)) / 2;
          g += `<path class="hp-arc" d="M${x(prev)} ${y} Q${mid} ${y - 30} ${x(v)} ${y}"/>`;
          g +=
            ri === 1
              ? `<rect class="hp-mk" x="${x(v) - 5}" y="${y - 5}" width="10" height="10"/>`
              : ri === 2
                ? `<path class="hp-mk" d="M${x(v)} ${y - 7} l7 7 l-7 7 l-7 -7z"/>`
                : `<circle class="hp-mk" cx="${x(v)}" cy="${y}" r="5"/>`;
          if (r.s * unit >= 30)
            g += `<text x="${x(v)}" y="${y - 10}" style="font-size:11px">${v}</text>`;
          prev = v;
        }
        s += `${g}</g>`;
      });
      for (const t of m.targets || (m.L ? [m.L] : []))
        s += `<path class="hp-flag" d="M${x(t)} ${H - 30} V10 L${x(t) + 14} 16 L${x(t)} 22z"/><text class="hp-flagt" x="${x(t)}" y="8">${t}</text>`;
      const picks = Array.isArray(st.pick) ? (test ? [] : st.pick) : st.pick ? [st.pick] : [];
      for (const v of picks)
        s += `<line class="hp-guide" x1="${x(v)}" x2="${x(v)}" y1="${H - 34}" y2="14"/>`;
      laneBox.innerHTML = `<svg width="${W2}" height="${H}" viewBox="0 0 ${W2} ${H}" role="img" aria-label="${L(`Number line from 0 to ${mx}. ` + rs.map((r) => `${r.name} has landed on ${r.marks.join(", ") || "nothing yet"}.`).join(" "), `Recta numérica de 0 a ${mx}. ` + rs.map((r) => `${r.name} ha caído en ${r.marks.join(", ") || "nada todavía"}.`).join(" "))}">${s}</svg>`;
      laneBox.setAttribute("aria-label", L("Number line", "Recta numérica"));
    }
    const pickList = () => (Array.isArray(st.pick) ? st.pick : []);
    function paintChips() {
      chips.replaceChildren();
      const vals = test
        ? m.cands
        : [...new Set(m.steps.flatMap((_, i) => lands(i)))].sort((a, b) => a - b);
      chips.setAttribute(
        "aria-label",
        L(
          test ? "Hop sizes" : "Numbers where a hopper has landed",
          test ? "Tamaños de salto" : "Números donde ha caído un saltador",
        ),
      );
      for (const v of vals) {
        const on = multi ? pickList().includes(v) : st.pick === v;
        const b = A.el("button", "sa-btn", String(v), {
          type: "button",
          "aria-pressed": String(on),
          "aria-label": test
            ? L(`Hop size ${v}${on ? ", picked" : ""}`, `Salto de ${v}${on ? ", elegido" : ""}`)
            : L(`Number ${v}${on ? ", picked" : ""}`, `Número ${v}${on ? ", elegido" : ""}`),
        });
        if (ro) b.disabled = true;
        b.addEventListener("click", () => {
          if (test) st.v = v;
          if (multi)
            st.pick = on
              ? pickList().filter((p) => p !== v)
              : [...pickList(), v].sort((a, b2) => a - b2);
          else st.pick = on ? null : v;
          paint();
          emit();
          if (test) describe(v);
        });
        chips.append(b);
      }
      if (!vals.length)
        chips.append(
          A.el(
            "span",
            "",
            T("Hop to make marks you can tap.", "Salta para hacer marcas que puedas tocar."),
          ),
        );
    }
    function describe(/** @type {number} */ v) {
      const ts = m.targets || [m.L];
      const parts = ts.map((n) =>
        n % v === 0
          ? [`${n} after ${n / v} hops`, `${n} tras ${n / v} saltos`]
          : [
              `skips over ${n} (lands on ${Math.floor(n / v) * v}, then ${(Math.floor(n / v) + 1) * v})`,
              `se pasa de ${n} (cae en ${Math.floor(n / v) * v} y luego en ${(Math.floor(n / v) + 1) * v})`,
            ],
      );
      if (goal === "factors")
        say(
          `A hop of ${v}: ${parts.map((p) => p[0]).join("; ")}.`,
          `Un salto de ${v}: ${parts.map((p) => p[1]).join("; ")}.`,
        );
      else
        say(
          `Light B with step ${v} first lines up with Light A at ${G.lcm(m.steps[0], v)}.`,
          `La luz B con paso ${v} coincide primero con la luz A en ${G.lcm(m.steps[0], v)}.`,
        );
    }
    function paintLegend() {
      legend.innerHTML = spec.names
        .map((n, i) =>
          test && goal === "factors"
            ? ""
            : `<span>${["●", "■", "◆"][i]} ${T(n[0], n[1])}${m.steps[i] && !m.L ? ` (+${m.steps[i]})` : ""}</span>`,
        )
        .join("");
    }
    function paint() {
      paintLane();
      paintChips();
      info.textContent = "";
      ctrl.querySelectorAll("button[data-i]").forEach((b) => {
        const i = Number(/** @type {HTMLElement} */ (b).dataset.i);
        /** @type {HTMLButtonElement} */ (b).disabled =
          ro ||
          (i >= 0 && (st.h[i] + 1) * m.steps[i] > mx) ||
          (i < 0 && m.steps.every((s, k) => (st.h[k] + 1) * s > mx));
      });
    }
    if (!test && !ro) {
      m.steps.forEach((s, i) => {
        const b = A.el(
          "button",
          "sa-btn",
          T(`${spec.names[i][0]} hops +${s}`, `${spec.names[i][1]} salta +${s}`),
          {
            type: "button",
            "data-i": String(i),
            "aria-label": L(
              `Hop ${spec.names[i][0]} by ${s}`,
              `Hacer saltar a ${spec.names[i][1]} de ${s}`,
            ),
          },
        );
        b.addEventListener("click", () => {
          st.h[i]++;
          paint();
          emit();
          say(
            `${spec.names[i][0]} lands on ${st.h[i] * s}.`,
            `${spec.names[i][1]} cae en ${st.h[i] * s}.`,
          );
        });
        ctrl.append(b);
      });
      const behind = A.el("button", "sa-btn", T("Hop the one behind", "Salta el que va atrás"), {
        type: "button",
        "data-i": "-1",
      });
      behind.addEventListener("click", () => {
        const nxt = m.steps.map((s, k) => (st.h[k] + 1) * s);
        const low = Math.min(...nxt.filter((v) => v <= mx));
        nxt.forEach((v, k) => v === low && st.h[k]++);
        paint();
        emit();
        say(`The one behind hopped to ${low}.`, `El que iba atrás saltó a ${low}.`);
      });
      const reset = A.el("button", "sa-btn", T("Start over", "Empezar de nuevo"), {
        type: "button",
      });
      reset.addEventListener("click", () => {
        st.h = m.steps.map(() => 0);
        st.pick = multi ? [] : null;
        paint();
        emit();
        say("Started over.", "Empezamos de nuevo.");
      });
      ctrl.append(behind, reset);
    }
    if (test && !ro)
      info.innerHTML = T(
        "Tap a size to test it. Tapped sizes are your answer.",
        "Toca un tamaño para probarlo. Los tamaños tocados son tu respuesta.",
      );
    if (!ro) {
      const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
        type: "button",
        "aria-label": L("Check my answer", "Comprobar mi respuesta"),
      });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      const r = A.el("div", "sa-row");
      r.append(chk);
      root.append(r);
    }
    paintLegend();
    paint();
    if (ro) say("Solved.", "Resuelto.");
  }

  A.register("hops", {
    title: "Hops",
    titleEs: "Saltos",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();
