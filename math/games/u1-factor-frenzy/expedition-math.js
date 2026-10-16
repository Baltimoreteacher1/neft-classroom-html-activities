/* The Primekeeper — pure mathematics for the Factor Frenzy expedition.
 *
 * Problem generators, answer judges and misconception classifiers for every mission
 * type, with no Phaser or DOM dependency, so they can be tested in Node with a tiny
 * shim. Builders (expedition-missions.js, expedition-forge.js) draw the world and call
 * these. Every judge returns an engine Result: {ok} or {ok:false, misconception,
 * feedback:{en,es}} or {ok:false, incomplete:true, feedback}. Feedback names the
 * error in plain words and never states the correct answer.
 */
(function (root) {
  "use strict";
  const L = (en, es) => ({ en, es });
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  function isPrime(n) {
    if (n < 2) return false;
    for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
    return true;
  }
  function primeList(n) {
    const out = [];
    let m = n;
    for (let p = 2; p * p <= m; p++)
      while (m % p === 0) {
        out.push(p);
        m /= p;
      }
    if (m > 1) out.push(m);
    return out;
  }
  function factorsOf(n) {
    const out = [];
    for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
    return out;
  }
  /** Factor pairs as their smaller member: 24 → [1, 2, 3, 4] (1×24, 2×12, 3×8, 4×6). */
  function pairKeys(n) {
    const out = [];
    for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push(a);
    return out;
  }
  const SUP = { 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸" };
  function exponentForm(primes) {
    const count = {};
    primes.forEach((p) => {
      count[p] = (count[p] || 0) + 1;
    });
    return Object.keys(count)
      .map(Number)
      .sort((a, b) => a - b)
      .map((p) => (count[p] > 1 ? p + (SUP[count[p]] || "^" + count[p]) : String(p)))
      .join(" × ");
  }
  const times = (list) => list.join(" × ");

  /* ── gate: every factor pair of N is a copper plate on the gate ───────── */
  const GATE_POOLS = {
    1: [12, 16, 18, 20, 24, 28, 30, 32, 36],
    2: [36, 40, 42, 45, 48, 54, 56, 60, 64],
    3: [72, 80, 84, 90, 96, 100],
  };
  function genGate(rng, tier) {
    const N = rng.pick(GATE_POOLS[tier] || GATE_POOLS[1]);
    return { N, pairs: pairKeys(N), maxWidth: N };
  }
  /** plates = widths the student forged, in order. */
  function judgeGate(N, plates) {
    if (!plates.length)
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Forge at least one plate first: set a width and press Forge.",
          "Primero forja una placa: elige un ancho y pulsa Forjar.",
        ),
      };
    const bad = plates.find((w) => N % w !== 0);
    if (bad != null) {
      const rows = Math.floor(N / bad);
      const left = N - rows * bad;
      return {
        ok: false,
        misconception: "notFactor",
        bad,
        feedback: L(
          `The ${bad}-wide plate cracked: ${N} tiles in rows of ${bad} leave ${left} extra. ${bad} is not a factor of ${N}.`,
          `La placa de ancho ${bad} se rompió: ${N} fichas en filas de ${bad} dejan ${left} de sobra. ${bad} no es factor de ${N}.`,
        ),
      };
    }
    const have = new Set(plates.map((w) => Math.min(w, N / w)));
    const missing = pairKeys(N).filter((k) => !have.has(k));
    if (!missing.length) return { ok: true };
    if (missing.length === 1 && missing[0] === 1)
      return {
        ok: false,
        misconception: "forgotOne",
        missing,
        feedback: L(
          `One slot is still empty. Every number has a pair that uses 1. Did you forge it for ${N}?`,
          `Queda un espacio vacío. Todo número tiene un par que usa el 1. ¿Lo forjaste para ${N}?`,
        ),
      };
    return {
      ok: false,
      misconception: "missedPair",
      missing,
      feedback:
        missing.length === 1
          ? L(
              `The gate has a gap: 1 factor pair of ${N} is still missing. Test the widths in order.`,
              `La puerta tiene un hueco: falta 1 par de factores de ${N}. Prueba los anchos en orden.`,
            )
          : L(
              `The gate has gaps: ${missing.length} factor pairs of ${N} are still missing. Test the widths in order.`,
              `La puerta tiene huecos: faltan ${missing.length} pares de factores de ${N}. Prueba los anchos en orden.`,
            ),
    };
  }

  /* ── lock: pack two cargoes into the most identical crates (GCF) ──────── */
  const LOCK_SPEC = {
    1: { g: [2, 6], pq: 5, max: 30 },
    2: { g: [3, 8], pq: 7, max: 60 },
    3: { g: [4, 12], pq: 8, max: 96 },
  };
  function genLock(rng, tier) {
    const s = LOCK_SPEC[tier] || LOCK_SPEC[1];
    for (;;) {
      const g = rng.int(s.g[0], s.g[1]);
      const p = rng.int(2, s.pq);
      const q = rng.int(2, s.pq);
      if (p === q || gcd(p, q) !== 1) continue;
      const a = g * p;
      const b = g * q;
      if (a > s.max || b > s.max) continue;
      return { a, b, g, p, q };
    }
  }
  function judgeLock(a, b, k) {
    if (k == null || !(k >= 1))
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Type how many crates to use first.",
          "Primero escribe cuántas cajas vas a usar.",
        ),
      };
    const g = gcd(a, b);
    const fitsA = a % k === 0;
    const fitsB = b % k === 0;
    if (fitsA && fitsB) {
      if (k === g) return { ok: true };
      return {
        ok: false,
        misconception: "notGreatest",
        feedback: L(
          `The lock clicked open only partway. ${k} crates work with nothing left over, but a greater number of crates also works.`,
          `El candado se abrió solo un poco. ${k} cajas funcionan sin que sobre nada, pero un número mayor de cajas también funciona.`,
        ),
      };
    }
    if (k === lcm(a, b) || k === a * b)
      return {
        ok: false,
        misconception: "lcmForGcf",
        feedback: L(
          `The lock jammed: ${k} is a multiple of ${a} and ${b}, not a factor. Crates must split both piles evenly, so you need a common FACTOR.`,
          `El candado se trabó: ${k} es un múltiplo de ${a} y ${b}, no un factor. Las cajas deben repartir las dos pilas por igual, así que necesitas un FACTOR común.`,
        ),
      };
    return {
      ok: false,
      misconception: "notCommon",
      feedback:
        fitsA || fitsB
          ? L(
              `The lock jammed: ${k} crates split the ${fitsA ? a : b} ${fitsA ? "bars" : "crystals"} evenly, but the ${fitsA ? b : a} ${fitsA ? "crystals" : "bars"} have some left over. The number must be a factor of BOTH.`,
              `El candado se trabó: ${k} cajas reparten bien ${fitsA ? "las " + a + " barras" : "los " + b + " cristales"}, pero ${fitsA ? "de los " + b + " cristales" : "de las " + a + " barras"} sobra algo. El número debe ser factor de LOS DOS.`,
            )
          : L(
              `The lock jammed: ${k} crates leave bars AND crystals left over. ${k} is not a factor of ${a} or of ${b}.`,
              `El candado se trabó: con ${k} cajas sobran barras Y cristales. ${k} no es factor de ${a} ni de ${b}.`,
            ),
    };
  }

  /* ── gears: two marked gears line up again after LCM teeth ────────────── */
  const GEAR_SPEC = {
    1: { lo: 2, hi: 10, max: 40, shared: false },
    2: { lo: 4, hi: 15, max: 90, shared: true },
    3: { lo: 6, hi: 18, max: 144, shared: true },
  };
  function genGears(rng, tier) {
    const s = GEAR_SPEC[tier] || GEAR_SPEC[1];
    for (;;) {
      const a = rng.int(s.lo, s.hi);
      const b = rng.int(s.lo, s.hi);
      if (a >= b || b % a === 0) continue;
      if (s.shared && gcd(a, b) === 1) continue;
      const L0 = lcm(a, b);
      if (L0 > s.max) continue;
      return rng.next() < 0.5 ? { a, b, L: L0 } : { a: b, b: a, L: L0 };
    }
  }
  function judgeGears(a, b, T) {
    if (T == null || !(T >= 1))
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Type how many teeth the drive should turn first.",
          "Primero escribe cuántos dientes debe girar el motor.",
        ),
      };
    const okA = T % a === 0;
    const okB = T % b === 0;
    if (okA && okB) {
      if (T === lcm(a, b)) return { ok: true };
      if (T === a * b)
        return {
          ok: false,
          misconception: "productLCM",
          feedback: L(
            `Both marks lined up, but you multiplied ${a} × ${b}. That is a common multiple, not always the LEAST one. The marks met earlier.`,
            `Las dos marcas se alinearon, pero multiplicaste ${a} × ${b}. Ese es un múltiplo común, no siempre el MENOR. Las marcas se encontraron antes.`,
          ),
        };
      return {
        ok: false,
        misconception: "notLeast",
        feedback: L(
          `Both marks lined up at ${T}, but they also lined up at a smaller number. Find the LEAST common multiple.`,
          `Las dos marcas se alinearon en ${T}, pero también se alinearon en un número menor. Busca el MENOR múltiplo común.`,
        ),
      };
    }
    if (T === gcd(a, b) && T > 1)
      return {
        ok: false,
        misconception: "gcfForLcm",
        feedback: L(
          `The gears slipped: ${T} is a common FACTOR of ${a} and ${b}. The marks meet again at a common MULTIPLE.`,
          `Los engranajes patinaron: ${T} es un FACTOR común de ${a} y ${b}. Las marcas se vuelven a encontrar en un MÚLTIPLO común.`,
        ),
      };
    if (okA || okB) {
      const yes = okA ? a : b;
      const no = okA ? b : a;
      return {
        ok: false,
        misconception: "oneMultiple",
        feedback: L(
          `Only the ${yes}-tooth gear came back to the top. ${T} is a multiple of ${yes} but not of ${no}. It must be a multiple of both.`,
          `Solo el engranaje de ${yes} dientes volvió arriba. ${T} es múltiplo de ${yes} pero no de ${no}. Debe ser múltiplo de los dos.`,
        ),
      };
    }
    return {
      ok: false,
      misconception: "notMultiple",
      feedback: L(
        `The gears slipped: neither mark came back to the top. ${T} is not a multiple of ${a} or of ${b}.`,
        `Los engranajes patinaron: ninguna marca volvió arriba. ${T} no es múltiplo de ${a} ni de ${b}.`,
      ),
    };
  }
  /** Multiples of n that are smaller than limit (at most count of them). */
  function multiplesBelow(n, limit, count) {
    const out = [];
    for (let m = n; m < limit && out.length < count; m += n) out.push(m);
    return out;
  }

  /* ── forge: split an ingot into a factor tree until every piece is prime ─ */
  const FORGE_POOLS = {
    1: [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 50, 56],
    2: [48, 54, 60, 63, 72, 75, 84, 90, 98, 100, 108, 126],
    3: [120, 135, 144, 150, 168, 180, 196, 210, 225, 240, 252, 270, 300],
  };
  const MAX_DEPTH = 7;
  const MAX_LEAVES = 10;
  function genForge(rng, tier) {
    const N = rng.pick(FORGE_POOLS[tier] || FORGE_POOLS[1]);
    return { N, primes: primeList(N) };
  }
  const makeNode = (v, depth = 0) => ({ v, kids: null, stamped: false, depth });
  function forgeLeaves(node, acc = []) {
    if (!node.kids) acc.push(node);
    else node.kids.forEach((k) => forgeLeaves(k, acc));
    return acc;
  }
  /** Try to split a leaf by factor f. Returns {ok} or {ok:false, reason, feedback}. */
  function forgeSplit(rootNode, node, f) {
    if (node.kids) return { ok: false, reason: "split" };
    if (!(f >= 1))
      return {
        ok: false,
        reason: "empty",
        feedback: L("Type a factor first.", "Primero escribe un factor."),
      };
    if (node.v % f !== 0)
      return {
        ok: false,
        reason: "notFactor",
        feedback: L(
          `The hammer bounced: ${node.v} ÷ ${f} does not come out even, so ${f} is not a factor of ${node.v}.`,
          `El martillo rebotó: ${node.v} ÷ ${f} no da exacto, así que ${f} no es factor de ${node.v}.`,
        ),
      };
    if (node.depth + 1 >= MAX_DEPTH || forgeLeaves(rootNode).length >= MAX_LEAVES)
      return {
        ok: false,
        reason: "full",
        feedback: L(
          "The anvil is full. Melt a branch back and split another way.",
          "El yunque está lleno. Funde una rama y divide de otra forma.",
        ),
      };
    node.stamped = false;
    node.kids = [makeNode(f, node.depth + 1), makeNode(node.v / f, node.depth + 1)];
    return { ok: true };
  }
  function judgeForge(rootNode) {
    const leaves = forgeLeaves(rootNode);
    if (leaves.some((l) => !l.stamped))
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Every piece needs a choice: split it with the hammer, or stamp it PRIME.",
          "Cada pieza necesita una decisión: divídela con el martillo o séllala como PRIMO.",
        ),
      };
    const one = leaves.find((l) => l.v === 1);
    if (one)
      return {
        ok: false,
        misconception: "oneAsPrime",
        node: one,
        feedback: L(
          "The 1 ingot melted away in the fire. 1 is not prime: it has only one factor. Splitting off 1 never breaks a number down.",
          "El lingote de 1 se derritió en el fuego. El 1 no es primo: tiene un solo factor. Separar un 1 nunca descompone un número.",
        ),
      };
    const comp = leaves.find((l) => !isPrime(l.v));
    if (comp)
      return {
        ok: false,
        misconception: "stopEarly",
        node: comp,
        feedback: L(
          `The ${comp.v} ingot cracked in the fire. ${comp.v} is not prime: it has a factor other than 1 and ${comp.v}. The tree stopped too early.`,
          `El lingote de ${comp.v} se agrietó en el fuego. ${comp.v} no es primo: tiene un factor distinto de 1 y de ${comp.v}. El árbol se detuvo muy pronto.`,
        ),
      };
    return { ok: true };
  }
  /** Lay out the tree: leaves get equal slots left→right, parents sit above their kids. */
  function forgeLayout(rootNode) {
    const leaves = forgeLeaves(rootNode);
    const out = [];
    let depth = 0;
    let slot = 0;
    (function walk(node, parent) {
      depth = Math.max(depth, node.depth);
      const rec = { node, parent, x: 0 };
      out.push(rec);
      if (node.kids) {
        const kids = node.kids.map((k) => walk(k, rec));
        rec.x = (kids[0].x + kids[1].x) / 2;
      } else rec.x = slot++;
      return rec;
    })(rootNode, null);
    return { nodes: out, leaves: leaves.length, depth };
  }
  /** The demo's path: split off the smallest prime each time. */
  function forgeSolve(rootNode) {
    const steps = [];
    (function go(node) {
      if (isPrime(node.v)) {
        steps.push({ node, stamp: true });
        return;
      }
      const p = primeList(node.v)[0];
      forgeSplit(rootNode, node, p);
      steps.push({ node, split: p });
      go(node.kids[0]);
      go(node.kids[1]);
    })(rootNode);
    steps.forEach((s) => {
      if (s.stamp) s.node.stamped = true;
    });
    return steps;
  }

  root.PK_MATH = {
    L,
    gcd,
    lcm,
    isPrime,
    primeList,
    factorsOf,
    pairKeys,
    exponentForm,
    times,
    genGate,
    judgeGate,
    genLock,
    judgeLock,
    genGears,
    judgeGears,
    multiplesBelow,
    genForge,
    judgeForge,
    forgeSplit,
    forgeLeaves,
    forgeLayout,
    forgeSolve,
    makeNode,
    MAX_DEPTH,
    MAX_LEAVES,
    POOLS: { gate: GATE_POOLS, lock: LOCK_SPEC, gears: GEAR_SPEC, forge: FORGE_POOLS },
  };
})(typeof window !== "undefined" ? window : globalThis);
