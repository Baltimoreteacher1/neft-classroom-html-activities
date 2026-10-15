/**
 * Practice Studio generators: ratios and rates (lessons 3-1 .. 3-10).
 *
 *   ratioWrite unitRate eqRatioTable ratioGraphRead compareRatios convertUnits convertBetween unitRateWord eqRatioMissing
 *
 * Every item is bilingual and carries a hint ladder, a worked explanation, a named misconception on every wrong
 * choice (tag[] on mc, tag on num fw entries) and a meta block. check() re-derives the key by a different route than
 * make(): by substitution into the choice text, by search, or by cross-products - never by repeating make's arithmetic.
 * Grade 6 scope: ratio language, unit rates, ratio tables / double number lines / tape diagrams, first-quadrant
 * graphs and unit conversion by ratio reasoning. No cross-multiplication formalism is taught to the student.
 *
 * Loaded as a plain <script> after assets/studio-gen/core.js (or through node:vm in tests); touches only `window`.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  if (!G) throw new Error("studio-gen/ratio.js needs assets/studio-gen/core.js first");
  const { fmt, gcd, value, commas } = G;

  /* ===================================================================================================
   * Plumbing
   * =================================================================================================== */
  class Redraw extends Error {}
  /** Reject this draw and try fresh numbers (the rng stream moves on, so it stays deterministic). */
  const redo = () => {
    throw new Redraw("redraw");
  };
  const draw = (/** @type {() => any} */ fn) => {
    for (let i = 0; i < 160; i++) {
      try {
        return fn();
      } catch (e) {
        if (!(e instanceof Redraw)) throw e;
      }
    }
    throw new Error("ratio.js: no valid draw after 160 tries");
  };

  /** {name} placeholders; a var is one string (both languages) or an [en, es] pair. */
  const sub = (/** @type {string} */ s, /** @type {any} */ v, /** @type {number} */ i) =>
    s.replace(/\{(\w+)\}/g, (_, k) => {
      const x = v[k];
      if (x === undefined) throw new Error(`ratio.js: missing {${k}} in "${s}"`);
      return Array.isArray(x) ? x[i] : String(x);
    });
  /** T(en, es, vars) -> [en, es] */
  const T = (/** @type {string} */ en, /** @type {string} */ es, /** @type {any} */ v = {}) => [
    sub(en, v, 0),
    sub(es, v, 1),
  ];
  /** A countable thing: Q(sing, plur, singEs, plurEs). */
  const Q = (
    /** @type {string} */ s,
    /** @type {string} */ p,
    /** @type {string} */ ss,
    /** @type {string} */ sp,
  ) => ({
    s: [s, ss],
    p: [p, sp],
  });
  const show = (/** @type {number} */ n) => (Math.abs(n) >= 1000 ? commas(n) : fmt(n));
  /** "3 cups of flour" / "3 tazas de harina" */
  const np = (/** @type {any} */ q, /** @type {number} */ n) => [
    `${show(n)} ${n === 1 ? q.s[0] : q.p[0]}`,
    `${show(n)} ${n === 1 ? q.s[1] : q.p[1]}`,
  ];
  const usd = (/** @type {number} */ cents) => `$${(cents / 100).toFixed(2)}`;
  const split = (/** @type {any[][]} */ pairs) => [pairs.map((p) => p[0]), pairs.map((p) => p[1])];
  const same = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    Math.abs(a - b) <= eps;
  const coprimePair = (
    /** @type {any} */ rng,
    /** @type {number} */ lo,
    /** @type {number} */ hi,
  ) => {
    for (let i = 0; i < 400; i++) {
      const a = rng.int(lo, hi);
      const b = rng.int(lo, hi);
      if (a !== b && gcd(a, b) === 1) return [a, b];
    }
    return [lo, lo + 1];
  };
  const NAMES = [
    "Maya",
    "Dev",
    "Lena",
    "Omar",
    "Priya",
    "Sam",
    "Ana",
    "Kai",
    "Zoe",
    "Mateo",
    "Imani",
    "Noor",
  ];

  const numsIn = (/** @type {any} */ s) =>
    (String(s).match(/\d[\d,]*(?:\.\d+)?/g) || []).map((t) => Number(t.replace(/,/g, "")));
  /** numbers a figure prints (blank cells excluded) - used so no figure or stem hands over the answer */
  const vizNums = (/** @type {any} */ v) => {
    if (!v) return [];
    const out = [];
    for (const r of v.rows || []) for (const c of r) out.push(...numsIn(c));
    for (const k of ["top", "bottom"])
      for (const c of (v[k] && v[k].vals) || []) if (c !== null) out.push(...numsIn(c));
    for (const p of v.parts || []) out.push(...numsIn(p.v));
    if (v.total !== undefined) out.push(...numsIn(v.total));
    return out;
  };

  /**
   * Multiple choice from bilingual parts.
   *   o.q / o.x   [en, es]            o.h  [[en, es], ...]
   *   o.right     "text" | { v, vEs }
   *   o.wrong     [{ v, vEs?, f: [en, es], tag }]   best distractor first; the first three distinct ones are shown
   */
  function mcB(/** @type {any} */ rng, /** @type {any} */ o) {
    const rv = typeof o.right === "object" ? o.right : { v: o.right };
    const rt = String(rv.v).trim().toLowerCase();
    const texts = [o.q[0], ...o.h.map((/** @type {any} */ p) => p[0])].map((s) => s.toLowerCase());
    if (!o.loose && rt.length >= 5 && texts.some((s) => s.includes(rt))) redo();
    if (/^\$?\d[\d,]*(\.\d+)?$/.test(rt)) {
      const a = value(rt);
      if (texts.some((s) => numsIn(s).some((n) => same(n, a)))) redo();
    }
    const [h, hEs] = split(o.h);
    const it = G.mc(rng, {
      q: o.q[0],
      qEs: o.q[1],
      x: o.x[0],
      xEs: o.x[1],
      h,
      hEs,
      viz: o.viz,
      meta: o.meta,
      right: { v: rv.v },
      wrong: o.wrong.map((/** @type {any} */ w) => ({ v: w.v, f: w.f[0], fEs: w.f[1] })),
      choices: 4,
    });
    if (it.c.length !== 4) redo();
    const first = new Map();
    for (const w of o.wrong) {
      const k = String(w.v).trim().toLowerCase();
      if (!first.has(k)) first.set(k, w);
    }
    const low = (/** @type {any} */ c) => String(c).trim().toLowerCase();
    it.tag = it.c.map((/** @type {any} */ c, /** @type {number} */ i) =>
      i === it.a ? "" : (first.get(low(c)) || {}).tag || "",
    );
    if (rv.vEs !== undefined || o.wrong.some((/** @type {any} */ w) => w.vEs !== undefined))
      it.cEs = it.c.map((/** @type {any} */ c, /** @type {number} */ i) =>
        i === it.a ? (rv.vEs !== undefined ? rv.vEs : c) : ((first.get(low(c)) || {}).vEs ?? c),
      );
    return it;
  }

  /**
   * Typed answer from bilingual parts.
   *   o.a   answer string      o.fw  [{ v, f: [en, es], tag }]  specific feedback for common wrong values
   */
  function numB(/** @type {any} */ o) {
    const a = value(o.a);
    if (!Number.isFinite(a)) throw new Error(`ratio.js: non-numeric answer ${o.a}`);
    const stem = [o.q[0], ...o.h.map((/** @type {any} */ p) => p[0])];
    if (
      stem.some((s) => numsIn(s).some((n) => same(n, a))) ||
      vizNums(o.viz).some((n) => same(n, a))
    )
      redo();
    const [h, hEs] = split(o.h);
    const seen = new Set([a]);
    const fw = [];
    for (const w of o.fw || []) {
      const v = typeof w.v === "number" ? w.v : value(w.v);
      if (!Number.isFinite(v) || v < 0 || seen.has(v)) continue;
      seen.add(v);
      fw.push({ v: String(w.v), f: w.f[0], fEs: w.f[1], tag: w.tag });
    }
    return G.num({
      q: o.q[0],
      qEs: o.q[1],
      a: String(o.a),
      unit: o.unit,
      tol: o.tol,
      fw,
      x: o.x[0],
      xEs: o.x[1],
      h,
      hEs,
      viz: o.viz,
      meta: o.meta,
    });
  }

  /** exactly one choice passes `isRight` (an independent test on the choice text) and it is the key */
  const pickOne = (
    /** @type {any} */ item,
    /** @type {(c: string, i: number) => boolean} */ isRight,
  ) => {
    const ok = item.c.map(
      (/** @type {any} */ c, /** @type {number} */ i) => !!isRight(String(c), i),
    );
    const n = ok.filter(Boolean).length;
    if (n !== 1) return `${n} choices pass the independent test (${ok.map(Number).join("")})`;
    return ok[item.a]
      ? true
      : `key is choice ${item.a} but the independent test accepts choice ${ok.indexOf(true)}`;
  };
  const wantNum = (/** @type {any} */ item, /** @type {number} */ expect, eps = 1e-9) =>
    same(value(item.a), expect, eps) || `key ${item.a} but recomputed ${fmt(expect, 6)}`;
  /** the stem must print every raw number the meta says it uses */
  const stemHas = (/** @type {any} */ item, /** @type {number[]} */ ns) => {
    const have = numsIn(item.q);
    const missing = ns.filter((n) => !have.some((h) => same(h, n)));
    return missing.length ? `stem does not print ${missing.join(", ")}` : true;
  };

  /**
   * A generator = levels of "forms". form = { kind, make(rng) -> item, check(item) }. The kind is stamped into
   * meta so check() finds its form again.
   */
  function suite(
    /** @type {string} */ id,
    /** @type {string} */ title,
    /** @type {string} */ titleEs,
    /** @type {Record<number, any[]>} */ levels,
  ) {
    const byKind = /** @type {Record<string, any>} */ ({});
    for (const l of Object.values(levels)) for (const f of l) byKind[f.kind] = f;
    G.register(id, {
      title,
      titleEs,
      levels: 4,
      make(/** @type {any} */ rng, /** @type {number} */ level) {
        return draw(() => {
          const f = rng.pick(levels[level]);
          const it = f.make(rng);
          it.meta = { kind: f.kind, ...it.meta };
          return it;
        });
      },
      check(/** @type {any} */ item) {
        const f = byKind[item.meta && item.meta.kind];
        return f ? f.check(item) : `unknown form ${item.meta && item.meta.kind}`;
      },
    });
  }
  const form = (/** @type {string} */ kind, /** @type {any} */ make, /** @type {any} */ check) => ({
    kind,
    make,
    check,
  });

  /* ===================================================================================================
   * Shared banks
   * =================================================================================================== */
  /** Two or three kinds of thing in one place (ratio language). */
  const COLL = [
    {
      a: Q("red marble", "red marbles", "canica roja", "canicas rojas"),
      b: Q("blue marble", "blue marbles", "canica azul", "canicas azules"),
      c: Q("green marble", "green marbles", "canica verde", "canicas verdes"),
      all: ["marbles", "canicas"],
      home: ["A bag has", "Una bolsa tiene"],
    },
    {
      a: Q("cat", "cats", "gato", "gatos"),
      b: Q("dog", "dogs", "perro", "perros"),
      c: Q("rabbit", "rabbits", "conejo", "conejos"),
      all: ["animals", "animales"],
      home: ["A shelter has", "Un refugio tiene"],
    },
    {
      a: Q("guitar", "guitars", "guitarra", "guitarras"),
      b: Q("drum", "drums", "tambor", "tambores"),
      c: Q("violin", "violins", "violín", "violines"),
      all: ["instruments", "instrumentos"],
      home: ["A music room has", "Un salón de música tiene"],
    },
    {
      a: Q("apple", "apples", "manzana", "manzanas"),
      b: Q("pear", "pears", "pera", "peras"),
      c: Q("orange", "oranges", "naranja", "naranjas"),
      all: ["pieces of fruit", "frutas"],
      home: ["A fruit bowl has", "Un frutero tiene"],
    },
    {
      a: Q("tomato plant", "tomato plants", "planta de tomate", "plantas de tomate"),
      b: Q("pepper plant", "pepper plants", "planta de pimiento", "plantas de pimiento"),
      c: Q("bean plant", "bean plants", "planta de frijol", "plantas de frijol"),
      all: ["plants", "plantas"],
      home: ["A garden has", "Un huerto tiene"],
    },
    {
      a: Q("road bike", "road bikes", "bicicleta de carretera", "bicicletas de carretera"),
      b: Q("mountain bike", "mountain bikes", "bicicleta de montaña", "bicicletas de montaña"),
      c: Q("electric bike", "electric bikes", "bicicleta eléctrica", "bicicletas eléctricas"),
      all: ["bikes", "bicicletas"],
      home: ["A bike shop has", "Una tienda de bicicletas tiene"],
    },
    {
      a: Q("fiction book", "fiction books", "libro de ficción", "libros de ficción"),
      b: Q("nonfiction book", "nonfiction books", "libro de no ficción", "libros de no ficción"),
      c: Q("poetry book", "poetry books", "libro de poesía", "libros de poesía"),
      all: ["books", "libros"],
      home: ["A class library has", "La biblioteca del salón tiene"],
    },
    {
      a: Q("pop song", "pop songs", "canción pop", "canciones pop"),
      b: Q("rock song", "rock songs", "canción de rock", "canciones de rock"),
      c: Q("jazz song", "jazz songs", "canción de jazz", "canciones de jazz"),
      all: ["songs", "canciones"],
      home: ["A playlist has", "Una lista de reproducción tiene"],
    },
  ];
  for (const c of COLL) {
    c.na = c.a.p;
    c.nb = c.b.p;
  }

  /**
   * Two-ingredient mixtures. key = the ingredient whose larger share makes the batch "more" of something;
   * qs asks about that property. unit = the unit both amounts share.
   */
  const MIX = [
    {
      a: Q("cup of flour", "cups of flour", "taza de harina", "tazas de harina"),
      b: Q("cup of sugar", "cups of sugar", "taza de azúcar", "tazas de azúcar"),
      na: ["flour", "harina"],
      nb: ["sugar", "azúcar"],
      mix: ["cookie dough", "masa de galletas"],
      unit: ["cups", "tazas"],
      key: "b",
      qs: T("Which batch is sweeter?", "¿Cuál tanda es más dulce?"),
    },
    {
      a: Q(
        "cup of blue paint",
        "cups of blue paint",
        "taza de pintura azul",
        "tazas de pintura azul",
      ),
      b: Q(
        "cup of yellow paint",
        "cups of yellow paint",
        "taza de pintura amarilla",
        "tazas de pintura amarilla",
      ),
      na: ["blue paint", "pintura azul"],
      nb: ["yellow paint", "pintura amarilla"],
      mix: ["green paint", "pintura verde"],
      unit: ["cups", "tazas"],
      key: "a",
      qs: T("Which batch is bluer?", "¿Cuál tanda es más azul?"),
    },
    {
      a: Q(
        "cup of lemon juice",
        "cups of lemon juice",
        "taza de jugo de limón",
        "tazas de jugo de limón",
      ),
      b: Q("cup of water", "cups of water", "taza de agua", "tazas de agua"),
      na: ["lemon juice", "jugo de limón"],
      nb: ["water", "agua"],
      mix: ["lemonade", "limonada"],
      unit: ["cups", "tazas"],
      key: "a",
      qs: T("Which batch tastes more lemony?", "¿Cuál tanda sabe más a limón?"),
    },
    {
      a: Q("cup of strawberries", "cups of strawberries", "taza de fresas", "tazas de fresas"),
      b: Q("cup of yogurt", "cups of yogurt", "taza de yogur", "tazas de yogur"),
      na: ["strawberries", "fresas"],
      nb: ["yogurt", "yogur"],
      mix: ["smoothie", "licuado"],
      unit: ["cups", "tazas"],
      key: "a",
      qs: T("Which smoothie tastes more like strawberries?", "¿Cuál licuado sabe más a fresa?"),
    },
    {
      a: Q("shovel of sand", "shovels of sand", "pala de arena", "palas de arena"),
      b: Q("shovel of cement", "shovels of cement", "pala de cemento", "palas de cemento"),
      na: ["sand", "arena"],
      nb: ["cement", "cemento"],
      mix: ["concrete", "concreto"],
      unit: ["shovels", "palas"],
      key: "b",
      qs: T("Which mix makes stronger concrete?", "¿Cuál mezcla hace un concreto más resistente?"),
    },
    {
      a: Q("cup of peanuts", "cups of peanuts", "taza de maní", "tazas de maní"),
      b: Q("cup of raisins", "cups of raisins", "taza de pasas", "tazas de pasas"),
      na: ["peanuts", "maní"],
      nb: ["raisins", "pasas"],
      mix: ["trail mix", "mezcla de bocadillos"],
      unit: ["cups", "tazas"],
      key: "b",
      qs: T("Which trail mix is sweeter?", "¿Cuál mezcla de bocadillos es más dulce?"),
    },
    {
      a: Q(
        "tablespoon of vinegar",
        "tablespoons of vinegar",
        "cucharada de vinagre",
        "cucharadas de vinagre",
      ),
      b: Q(
        "tablespoon of oil",
        "tablespoons of oil",
        "cucharada de aceite",
        "cucharadas de aceite",
      ),
      na: ["vinegar", "vinagre"],
      nb: ["oil", "aceite"],
      mix: ["salad dressing", "aderezo para ensalada"],
      unit: ["tablespoons", "cucharadas"],
      key: "a",
      qs: T("Which dressing is tangier?", "¿Cuál aderezo es más ácido?"),
    },
    {
      a: Q(
        "cup of apple juice",
        "cups of apple juice",
        "taza de jugo de manzana",
        "tazas de jugo de manzana",
      ),
      b: Q(
        "cup of sparkling water",
        "cups of sparkling water",
        "taza de agua con gas",
        "tazas de agua con gas",
      ),
      na: ["apple juice", "jugo de manzana"],
      nb: ["sparkling water", "agua con gas"],
      mix: ["fruit punch", "ponche de frutas"],
      unit: ["cups", "tazas"],
      key: "a",
      qs: T("Which punch tastes more like apple?", "¿Cuál ponche sabe más a manzana?"),
    },
    {
      a: Q("cup of water", "cups of water", "taza de agua", "tazas de agua"),
      b: Q("cup of vinegar", "cups of vinegar", "taza de vinagre", "tazas de vinagre"),
      na: ["water", "agua"],
      nb: ["vinegar", "vinagre"],
      mix: ["cleaning spray", "limpiador en aerosol"],
      unit: ["cups", "tazas"],
      key: "b",
      qs: T("Which spray is stronger?", "¿Cuál limpiador es más fuerte?"),
    },
    {
      a: Q(
        "can of orange concentrate",
        "cans of orange concentrate",
        "lata de concentrado de naranja",
        "latas de concentrado de naranja",
      ),
      b: Q("can of water", "cans of water", "lata de agua", "latas de agua"),
      na: ["orange concentrate", "concentrado de naranja"],
      nb: ["water", "agua"],
      mix: ["orange drink", "bebida de naranja"],
      unit: ["cans", "latas"],
      key: "a",
      qs: T("Which pitcher tastes more like orange?", "¿Cuál jarra sabe más a naranja?"),
    },
  ];

  /* feedback lines reused across the ratio-language forms */
  const FB = {
    inv: (/** @type {any} */ n) =>
      T(
        "That flips the order. The question names {n} first, so the number for {n} comes first.",
        "Eso invierte el orden. La pregunta nombra primero {n}, así que el número de {n} va primero.",
        { n },
      ),
    toAll: (/** @type {any} */ n) =>
      T(
        "That compares {n} to the total, not to the other group. A part-to-part ratio compares the two groups with each other.",
        "Eso compara {n} con el total, no con el otro grupo. Una razón de parte a parte compara los dos grupos entre sí.",
        { n },
      ),
    toAllOther: (/** @type {any} */ n) =>
      T(
        "That compares {n} to the total. The question asks you to compare the two groups with each other.",
        "Eso compara {n} con el total. La pregunta pide comparar los dos grupos entre sí.",
        { n },
      ),
    pp: () =>
      T(
        "That compares the two groups with each other. A part-to-whole ratio compares one group to the total of everything.",
        "Eso compara los dos grupos entre sí. Una razón de parte a todo compara un grupo con el total de todo.",
      ),
    group: (/** @type {any} */ n) =>
      T(
        "That is the ratio for the other group. The question is about {n}.",
        "Esa es la razón del otro grupo. La pregunta se refiere a {n}.",
        { n },
      ),
    flip: () =>
      T(
        "That puts the total first. The question asks for the group first and the total second.",
        "Eso pone el total primero. La pregunta pide primero el grupo y después el total.",
      ),
    flipBack: () =>
      T(
        "That puts the group first. This question asks for the total first and the group second.",
        "Eso pone el grupo primero. Esta pregunta pide primero el total y después el grupo.",
      ),
  };

  /** ratio text in the chosen notation; choices carry a Spanish sibling ("4 to 7" -> "4 a 7") */
  const ratioText = (
    /** @type {number} */ x,
    /** @type {number} */ y,
    /** @type {string} */ mode,
  ) => (mode === "to" ? [`${x} to ${y}`, `${x} a ${y}`] : [`${x}:${y}`, `${x}:${y}`]);
  const RC = (
    /** @type {number} */ x,
    /** @type {number} */ y,
    /** @type {string} */ mode,
    /** @type {any} */ f,
    /** @type {string} */ tag,
  ) => {
    const [v, vEs] = ratioText(x, y, mode);
    return { v, vEs, f, tag };
  };
  const parseRatio = (/** @type {string} */ s) => {
    const m = String(s)
      .trim()
      .match(/^(\d+)\s*(?::|to)\s*(\d+)$/i);
    return m ? [Number(m[1]), Number(m[2])] : null;
  };
  const isRatio = (/** @type {string} */ s, /** @type {number} */ x, /** @type {number} */ y) => {
    const r = parseRatio(s);
    return !!r && r[0] === x && r[1] === y;
  };

  /* ===================================================================================================
   * ratioWrite (3-1)
   * =================================================================================================== */
  const sayColl = (/** @type {any} */ c, /** @type {number} */ x, /** @type {number} */ y) =>
    T("{home} {A} and {B}.", "{home} {A} y {B}.", {
      home: c.home,
      A: np(c.a, x),
      B: np(c.b, y),
    });
  const sayMix = (/** @type {any} */ c, /** @type {number} */ x, /** @type {number} */ y) =>
    T("A batch of {mix} uses {A} for every {B}.", "Una tanda de {mix} usa {A} por cada {B}.", {
      mix: c.mix,
      A: np(c.a, x),
      B: np(c.b, y),
    });
  const NOT_SIMPLE = T(
    "That is a correct ratio, but it is not in simplest form. Divide both numbers by the same number.",
    "Esa razón es correcta, pero no está en su forma más simple. Divide ambos números entre el mismo número.",
  );

  /** L1: two groups, part-to-part; `style` picks the collection sentence or the recipe sentence */
  const rwPartToPart = (/** @type {"coll"|"mix"} */ style) => (/** @type {any} */ rng) => {
    const mixed = style === "mix";
    const c = rng.pick(mixed ? MIX : COLL);
    const [a, b] = coprimePair(rng, 2, 9);
    const flip = rng.chance(0.5);
    const mode = rng.pick(["colon", "to"]);
    const [x, y] = flip ? [b, a] : [a, b];
    const xn = flip ? c.nb : c.na;
    const yn = flip ? c.na : c.nb;
    return mcB(rng, {
      q: T(
        "{intro} What is the ratio of {xn} to {yn}?",
        "{intro} ¿Cuál es la razón de {xn} a {yn}?",
        { intro: (mixed ? sayMix : sayColl)(c, a, b), xn, yn },
      ),
      right: RC(x, y, mode),
      wrong: [
        RC(y, x, mode, FB.inv(xn), "ratio-inverted"),
        RC(x, x + y, mode, FB.toAll(xn), "part-whole-mixup"),
        RC(y, x + y, mode, FB.toAllOther(yn), "part-whole-mixup"),
      ],
      x: T(
        "The question asks for {xn} to {yn}, so the number for {xn} comes first. The ratio is {R}. Adding the two numbers would give the total, which is a different comparison.",
        "La pregunta pide {xn} a {yn}, así que el número de {xn} va primero. La razón es {R}. Sumar los dos números daría el total, que es otra comparación.",
        { xn, yn, R: ratioText(x, y, mode) },
      ),
      h: [
        T(
          "A ratio compares two amounts. Say them in the same order the question names them.",
          "Una razón compara dos cantidades. Dilas en el mismo orden en que las nombra la pregunta.",
        ),
        T(
          "The question asks for {xn} to {yn}. Find the number that goes with each one.",
          "La pregunta pide {xn} a {yn}. Busca el número que corresponde a cada uno.",
          { xn, yn },
        ),
        T(
          "Write the number for {xn} first and the number for {yn} second. You do not need to add anything.",
          "Escribe primero el número de {xn} y después el de {yn}. No hace falta sumar nada.",
          { xn, yn },
        ),
      ],
      meta: { a, b, flip, mode },
    });
  };
  const rwPartToPartCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const s = stemHas(it, [m.a, m.b]);
    return s !== true
      ? s
      : pickOne(it, (c) => (m.flip ? isRatio(c, m.b, m.a) : isRatio(c, m.a, m.b)));
  };

  /** L2: one group to the total of two groups */
  const rwPartToWhole = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [a, b] = coprimePair(rng, 3, 12);
    const flip = rng.chance(0.5);
    const mode = rng.pick(["colon", "to"]);
    const [x, y] = flip ? [b, a] : [a, b];
    const xn = flip ? c.nb : c.na;
    return mcB(rng, {
      q: T(
        "{intro} What is the ratio of {xn} to all the {all}?",
        "{intro} ¿Cuál es la razón de {xn} al total de {all}?",
        { intro: sayColl(c, a, b), xn, all: c.all },
      ),
      right: RC(x, x + y, mode),
      wrong: [
        RC(x, y, mode, FB.pp(), "part-whole-mixup"),
        RC(x + y, x, mode, FB.flip(), "ratio-inverted"),
        RC(y, x + y, mode, FB.group(xn), "wrong-group"),
      ],
      x: T(
        "All the {all} together are {x} + {y} = {t}. Part-to-whole puts {xn} first and the total second: {R}.",
        "Todos los grupos juntos son {x} + {y} = {t}. Parte a todo pone primero {xn} y después el total: {R}.",
        { all: c.all, x, y, t: x + y, xn, R: ratioText(x, x + y, mode) },
      ),
      h: [
        T(
          "A part-to-whole ratio compares one group to everything together.",
          "Una razón de parte a todo compara un grupo con todo junto.",
        ),
        T("First find the total number of {all}.", "Primero halla el total de {all}.", {
          all: c.all,
        }),
        T(
          "Write the number of {xn} first, then the total you just found.",
          "Escribe primero el número de {xn} y después el total que acabas de hallar.",
          { xn },
        ),
      ],
      meta: { a, b, flip, mode },
    });
  };
  const rwPartToWholeCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const s = stemHas(it, [m.a, m.b]);
    return s !== true ? s : pickOne(it, (c) => isRatio(c, m.flip ? m.b : m.a, m.a + m.b));
  };

  /** L2: read a ratio statement back as a sentence */
  const rwInterp = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [a, b] = coprimePair(rng, 2, 9);
    if (Math.abs(a - b) < 2) redo();
    const flip = rng.chance(0.5);
    const mode = rng.pick(["colon", "to"]);
    const [x, y] = flip ? [b, a] : [a, b];
    const X = flip ? c.b : c.a;
    const Y = flip ? c.a : c.b;
    const [big, small] = x > y ? [X, Y] : [Y, X];
    const lo = Math.min(x, y);
    const hi = Math.max(x, y);
    const say = (
      /** @type {number} */ p,
      /** @type {any} */ P,
      /** @type {number} */ q,
      /** @type {any} */ Z,
    ) =>
      T("For every {p} {P} there are {q} {Z}.", "Por cada {p} {P} hay {q} {Z}.", {
        p,
        P: P.p,
        q,
        Z: Z.p,
      });
    const choice = (/** @type {any} */ s, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: s[0],
      vEs: s[1],
      f,
      tag,
    });
    const right = say(x, X, y, Y);
    return mcB(rng, {
      q: T(
        "The ratio of {xn} to {yn} is {R}. Which statement is true?",
        "La razón de {xn} a {yn} es {R}. ¿Cuál enunciado es verdadero?",
        { xn: X.p, yn: Y.p, R: ratioText(x, y, mode) },
      ),
      right: { v: right[0], vEs: right[1] },
      wrong: [
        choice(
          say(x, Y, y, X),
          T(
            "That swaps the two groups. The ratio names {xn} first, so the first number belongs to {xn}.",
            "Eso intercambia los grupos. La razón nombra primero {xn}, así que el primer número es de {xn}.",
            { xn: X.p },
          ),
          "ratio-inverted",
        ),
        choice(
          T("{lo} out of every {hi} {all} are {n}.", "{lo} de cada {hi} {all} son {n}.", {
            lo,
            hi,
            all: c.all,
            n: (x < y ? X : Y).p,
          }),
          T(
            "That reads the ratio as a part of the whole. A ratio of two groups compares the groups with each other.",
            "Eso lee la razón como una parte del total. Una razón entre dos grupos compara los grupos entre sí.",
          ),
          "part-whole-mixup",
        ),
        choice(
          T("There are {d} more {big} than {small}.", "Hay {d} {big} más que {small}.", {
            d: hi - lo,
            big: big.p,
            small: small.p,
          }),
          T(
            "A ratio compares amounts by multiplying and dividing, not by how many more there are.",
            "Una razón compara cantidades multiplicando y dividiendo, no por cuántos más hay.",
          ),
          "ratio-as-difference",
        ),
      ],
      x: T(
        "The ratio {R} means that for every {x} {xn} there are {y} {yn}. It does not tell how many more there are or how many there are in all.",
        "La razón {R} significa que por cada {x} {xn} hay {y} {yn}. No dice cuántos más hay ni cuántos hay en total.",
        { R: ratioText(x, y, mode), x, y, xn: X.p, yn: Y.p },
      ),
      h: [
        T(
          "Read the ratio in order: the first number goes with the first group named.",
          "Lee la razón en orden: el primer número va con el primer grupo nombrado.",
        ),
        T(
          '"For every ___ there are ___" matches the two numbers to the two groups.',
          '"Por cada ___ hay ___" une los dos números con los dos grupos.',
        ),
        T(
          "Check which group the first number belongs to. A ratio is not a subtraction.",
          "Revisa a qué grupo pertenece el primer número. Una razón no es una resta.",
        ),
      ],
      meta: { x, y, xn: X.p[0], yn: Y.p[0] },
    });
  };
  const rwInterpCheck = (/** @type {any} */ it) =>
    pickOne(it, (c) => {
      const m = c.match(/^For every (\d+) (.+) there are (\d+) (.+)\.$/);
      const t = it.meta;
      return !!m && Number(m[1]) === t.x && m[2] === t.xn && Number(m[3]) === t.y && m[4] === t.yn;
    });

  /** L3: read a tape diagram */
  const rwTape = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [a, b] = coprimePair(rng, 2, 9);
    const mode = rng.pick(["colon", "to"]);
    const ask = rng.pick(["A:all", "B:all", "all:A"]);
    const t = a + b;
    const [Gx, x] = ask === "B:all" ? [c.b, b] : [c.a, a];
    const o = ask === "B:all" ? a : b;
    const vars = { an: c.a.p, bn: c.b.p, all: c.all, xn: Gx.p };
    const allFirst = ask === "all:A";
    const right = allFirst ? RC(t, a, mode) : RC(x, t, mode);
    const wrong = allFirst
      ? [
          RC(a, t, mode, FB.flipBack(), "ratio-inverted"),
          RC(t, b, mode, FB.group(c.a.p), "wrong-group"),
          RC(a, b, mode, FB.pp(), "part-whole-mixup"),
        ]
      : [
          RC(x, o, mode, FB.pp(), "part-whole-mixup"),
          RC(o, t, mode, FB.group(Gx.p), "wrong-group"),
          RC(t, x, mode, FB.flip(), "ratio-inverted"),
        ];
    return mcB(rng, {
      q: allFirst
        ? T(
            "The tape diagram shows the number of {an} and {bn}. What is the ratio of all the {all} to {an}?",
            "El diagrama de cintas muestra la cantidad de {an} y de {bn}. ¿Cuál es la razón del total de {all} a {an}?",
            vars,
          )
        : T(
            "The tape diagram shows the number of {an} and {bn}. What is the ratio of {xn} to all the {all}?",
            "El diagrama de cintas muestra la cantidad de {an} y de {bn}. ¿Cuál es la razón de {xn} al total de {all}?",
            vars,
          ),
      viz: {
        t: "tape",
        parts: [
          { v: a, l: c.a.p[0], lEs: c.a.p[1] },
          { v: b, l: c.b.p[0], lEs: c.b.p[1] },
        ],
      },
      right,
      wrong,
      x: T(
        "The tape shows {a} {an} and {b} {bn}, so all the {all} are {a} + {b} = {t}. {answer}",
        "La cinta muestra {a} {an} y {b} {bn}, así que el total de {all} es {a} + {b} = {t}. {answer}",
        {
          a,
          b,
          t,
          ...vars,
          answer: allFirst
            ? T(
                "The ratio of all the {all} to {an} is {R}.",
                "La razón del total de {all} a {an} es {R}.",
                { ...vars, R: ratioText(t, a, mode) },
              )
            : T(
                "The ratio of {xn} to all the {all} is {R}.",
                "La razón de {xn} al total de {all} es {R}.",
                { ...vars, R: ratioText(x, t, mode) },
              ),
        },
      ),
      h: [
        T(
          "Each part of the tape is one group. Read the two numbers off the tape.",
          "Cada parte de la cinta es un grupo. Lee los dos números de la cinta.",
        ),
        T(
          '"All the {all}" is the whole tape, so you need the two parts added together.',
          '"El total de {all}" es toda la cinta, así que necesitas las dos partes sumadas.',
          { all: c.all },
        ),
        T(
          "Add the two parts to get the whole. Then write the ratio in the order the question gives.",
          "Suma las dos partes para obtener el total. Luego escribe la razón en el orden que da la pregunta.",
        ),
      ],
      meta: { a, b, ask, mode },
    });
  };
  const rwTapeCheck = (/** @type {any} */ it) => {
    const parts = (it.viz && it.viz.parts) || [];
    if (parts.length !== 2 || parts[0].v !== it.meta.a || parts[1].v !== it.meta.b)
      return "tape does not match meta";
    const A = parts[0].v;
    const B = parts[1].v;
    const exp =
      it.meta.ask === "A:all" ? [A, A + B] : it.meta.ask === "B:all" ? [B, A + B] : [A + B, A];
    return pickOne(it, (c) => isRatio(c, exp[0], exp[1]));
  };

  /** L3: give the ratio in simplest form */
  const rwSimplest = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [p, q] = coprimePair(rng, 1, 8);
    const g = rng.int(2, 6);
    const A = p * g;
    const B = q * g;
    if (A > 48 || B > 48) redo();
    const mode = rng.pick(["colon", "to"]);
    const flip = rng.chance(0.5);
    const [x, y, sx, sy] = flip ? [B, A, q, p] : [A, B, p, q];
    const xn = flip ? c.nb : c.na;
    const yn = flip ? c.na : c.nb;
    const half = [2, 3, 5].find((f) => g % f === 0 && g !== f);
    return mcB(rng, {
      q: T(
        "{intro} Write the ratio of {xn} to {yn} in simplest form.",
        "{intro} Escribe la razón de {xn} a {yn} en su forma más simple.",
        { intro: sayColl(c, A, B), xn, yn },
      ),
      right: RC(sx, sy, mode),
      wrong: [
        half
          ? RC(x / half, y / half, mode, NOT_SIMPLE, "not-simplified")
          : RC(x, y, mode, NOT_SIMPLE, "not-simplified"),
        RC(x, y, mode, NOT_SIMPLE, "not-simplified"),
        RC(sy, sx, mode, FB.inv(xn), "ratio-inverted"),
        RC(sx, sx + sy, mode, FB.toAll(xn), "part-whole-mixup"),
      ],
      x: T(
        "The greatest common factor of {x} and {y} is {g}. {x} ÷ {g} = {sx} and {y} ÷ {g} = {sy}, so the simplest form is {R}.",
        "El máximo común divisor de {x} y {y} es {g}. {x} ÷ {g} = {sx} y {y} ÷ {g} = {sy}, así que la forma más simple es {R}.",
        { x, y, g, sx, sy, R: ratioText(sx, sy, mode) },
      ),
      h: [
        T(
          "Simplest form means no number except 1 divides both terms.",
          "La forma más simple significa que ningún número salvo el 1 divide a ambos términos.",
        ),
        T(
          "Find a number that divides both {x} and {y}. The greatest one is best.",
          "Busca un número que divida a {x} y a {y}. Lo mejor es el mayor.",
          { x, y },
        ),
        T(
          "Divide both numbers by it, and keep {xn} first.",
          "Divide ambos números entre él y deja {xn} primero.",
          { xn },
        ),
      ],
      meta: { A, B, flip, mode },
    });
  };
  const rwSimplestCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    let lo = m.flip ? [m.B, m.A] : [m.A, m.B];
    for (let d = 2; d <= Math.min(lo[0], lo[1]); d++)
      while (lo[0] % d === 0 && lo[1] % d === 0) lo = [lo[0] / d, lo[1] / d];
    return pickOne(it, (c) => isRatio(c, lo[0], lo[1]));
  };

  /** L3: turn a part-to-part ratio into a part-to-whole ratio */
  const rwConvert = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [a, b] = coprimePair(rng, 2, 9);
    const mode = rng.pick(["colon", "to"]);
    const flip = rng.chance(0.5);
    const [Gx, x] = flip ? [c.b, b] : [c.a, a];
    const o = flip ? a : b;
    const t = a + b;
    return mcB(rng, {
      q: T(
        "The ratio of {an} to {bn} is {R}. What is the ratio of {xn} to all the {all}?",
        "La razón de {an} a {bn} es {R}. ¿Cuál es la razón de {xn} al total de {all}?",
        { an: c.a.p, bn: c.b.p, R: ratioText(a, b, mode), xn: Gx.p, all: c.all },
      ),
      right: RC(x, t, mode),
      wrong: [
        RC(o, t, mode, FB.group(Gx.p), "wrong-group"),
        RC(x, o, mode, FB.pp(), "part-whole-mixup"),
        RC(t, x, mode, FB.flip(), "ratio-inverted"),
      ],
      x: T(
        "In {R} the groups have {a} and {b} parts, so the whole has {a} + {b} = {t} parts. {xn} has {x} of them: {S}.",
        "En {R} los grupos tienen {a} y {b} partes, así que el total tiene {a} + {b} = {t} partes. {xn} tiene {x} de ellas: {S}.",
        {
          R: ratioText(a, b, mode),
          a,
          b,
          t,
          xn: Gx.p,
          x,
          S: ratioText(x, t, mode),
        },
      ),
      h: [
        T(
          "Think of the ratio as parts: each number is a number of equal parts.",
          "Piensa en la razón como partes: cada número es una cantidad de partes iguales.",
        ),
        T(
          "The whole is all the parts together. Add the two numbers of the ratio.",
          "El total son todas las partes juntas. Suma los dos números de la razón.",
        ),
        T(
          "Write the parts for {xn} first, then the parts for the whole.",
          "Escribe primero las partes de {xn} y luego las partes del total.",
          { xn: Gx.p },
        ),
      ],
      meta: { a, b, flip, mode },
    });
  };
  const rwConvertCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const x = m.flip ? m.b : m.a;
    // a choice is right when its first term is the asked part and the rest of its second term is the other group
    return pickOne(it, (c) => {
      const r = parseRatio(c);
      return !!r && r[0] === x && r[1] - r[0] === (m.flip ? m.a : m.b);
    });
  };

  /** L4: batches of a recipe (scale a collection up by whole batches) */
  const rwBatch = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const a = rng.int(2, 6);
    const b = rng.int(2, 6);
    const k = rng.int(3, 9);
    const who = rng.pick(NAMES);
    const ask = rng.pick(["total", "A", "B"]);
    const per = ask === "B" ? b : a;
    const ans = ask === "total" ? k * (a + b) : k * per;
    const nm = ask === "B" ? c.nb : c.na;
    const base = T(
      "One batch of {mix} uses {A} and {B}. {who} makes {k} batches.",
      "Una tanda de {mix} usa {A} y {B}. {who} hace {k} tandas.",
      { mix: c.mix, A: np(c.a, a), B: np(c.b, b), who, k },
    );
    const question =
      ask === "total"
        ? T("How many {unit} does {who} use in all?", "¿Cuántas {unit} usa {who} en total?", {
            unit: c.unit,
            who,
          })
        : T("How many {unit} of {n} does {who} use?", "¿Cuántas {unit} de {n} usa {who}?", {
            unit: c.unit,
            n: nm,
            who,
          });
    const fw =
      ask === "total"
        ? [
            {
              v: a + b,
              f: T(
                "That is only one batch. {who} makes {k} batches, so every amount is used {k} times.",
                "Eso es solo una tanda. {who} hace {k} tandas, así que cada cantidad se usa {k} veces.",
                { who, k },
              ),
              tag: "forgot-batches",
            },
            {
              v: k * a + b,
              f: T(
                "Only the first ingredient was multiplied by the number of batches. Both ingredients are used in every batch.",
                "Solo se multiplicó el primer ingrediente por el número de tandas. Ambos ingredientes se usan en cada tanda.",
              ),
              tag: "ratio-one-term-scaled",
            },
            {
              v: k * a,
              f: T(
                "That counts only one ingredient. The question asks for both ingredients together.",
                "Eso cuenta solo un ingrediente. La pregunta pide los dos ingredientes juntos.",
              ),
              tag: "wrong-group",
            },
          ]
        : [
            {
              v: per,
              f: T(
                "That is the amount for one batch. {who} makes {k} batches.",
                "Esa es la cantidad de una tanda. {who} hace {k} tandas.",
                { who, k },
              ),
              tag: "forgot-batches",
            },
            {
              v: per + k,
              f: T(
                "Batches are repeated groups, so multiply the amount in one batch by the number of batches. Adding does not repeat a group.",
                "Las tandas son grupos repetidos, así que multiplica la cantidad de una tanda por el número de tandas. Sumar no repite un grupo.",
              ),
              tag: "op-added-instead-of-multiplied",
            },
            {
              v: k * (a + b),
              f: T(
                "That counts both ingredients. The question asks about one ingredient only.",
                "Eso cuenta ambos ingredientes. La pregunta pide solo un ingrediente.",
              ),
              tag: "wrong-group",
            },
          ];
    return numB({
      q: T("{base} {question}", "{base} {question}", { base, question }),
      a: ans,
      fw,
      x: T(
        ask === "total"
          ? "One batch uses {a} + {b} = {s} {unit}. {k} batches use {k} × {s} = {ans} {unit}."
          : "Each batch uses {per} {unit} of {n}. {k} batches use {k} × {per} = {ans} {unit}.",
        ask === "total"
          ? "Una tanda usa {a} + {b} = {s} {unit}. {k} tandas usan {k} × {s} = {ans} {unit}."
          : "Cada tanda usa {per} {unit} de {n}. {k} tandas usan {k} × {per} = {ans} {unit}.",
        { a, b, s: a + b, unit: c.unit, k, ans, per, n: nm },
      ),
      h: [
        T(
          "The recipe is repeated, so each batch is the same size.",
          "La receta se repite, así que cada tanda tiene el mismo tamaño.",
        ),
        ask === "total"
          ? T(
              "Find how much one whole batch uses. Then think about {k} batches.",
              "Halla cuánto usa una tanda completa. Luego piensa en {k} tandas.",
              { k },
            )
          : T(
              "Find how much one batch uses of that ingredient. Then think about {k} batches.",
              "Halla cuánto usa una tanda de ese ingrediente. Luego piensa en {k} tandas.",
              { k },
            ),
        T(
          "Multiply the amount in one batch by the number of batches.",
          "Multiplica la cantidad de una tanda por el número de tandas.",
        ),
      ],
      meta: { a, b, k, ask },
    });
  };
  const rwBatchCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const s = stemHas(it, [m.a, m.b, m.k]);
    if (s !== true) return s;
    let sum = 0; // build the batches up one at a time
    for (let i = 0; i < m.k; i++) sum += m.ask === "total" ? m.a + m.b : m.ask === "A" ? m.a : m.b;
    return wantNum(it, sum);
  };

  /** L4: split a total using a ratio */
  const rwShare = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [a, b] = coprimePair(rng, 1, 9);
    const m = rng.int(3, 9);
    const t = m * (a + b);
    if (t > 120) redo();
    const askB = rng.chance(0.5);
    const xn = askB ? c.nb : c.na;
    const own = askB ? b : a;
    return numB({
      q: T(
        "The tape diagram shows the ratio of {an} to {bn}, {a}:{b}. There are {t} {all} in all. How many {xn} are there?",
        "El diagrama de cintas muestra la razón de {an} a {bn}, {a}:{b}. Hay {t} {all} en total. ¿Cuál es la cantidad de {xn}?",
        { an: c.na, bn: c.nb, a, b, t, all: c.all, xn },
      ),
      viz: {
        t: "tape",
        parts: [
          { v: a, l: c.na[0], lEs: c.na[1] },
          { v: b, l: c.nb[0], lEs: c.nb[1] },
        ],
        total: t,
      },
      a: m * own,
      fw: [
        {
          v: m,
          f: T(
            "That is the size of one part. The group has more than one part.",
            "Ese es el tamaño de una parte. El grupo tiene más de una parte.",
          ),
          tag: "one-part-only",
        },
        {
          v: m * (askB ? a : b),
          f: T(
            "That is the other group. Check which group the question asks about.",
            "Ese es el otro grupo. Revisa de qué grupo trata la pregunta.",
          ),
          tag: "wrong-group",
        },
        {
          v: own,
          f: T(
            "That is the ratio number, not the amount. Each part stands for more than 1.",
            "Ese es el número de la razón, no la cantidad. Cada parte representa más de 1.",
          ),
          tag: "ratio-as-count",
        },
      ],
      x: T(
        "The ratio has {a} + {b} = {s} equal parts. {t} ÷ {s} = {m} in each part. There are {p} parts for {xn}, so {p} × {m} = {ans}.",
        "La razón tiene {a} + {b} = {s} partes iguales. {t} ÷ {s} = {m} en cada parte. Hay {p} partes de {xn}, así que {p} × {m} = {ans}.",
        { a, b, s: a + b, t, m, xn, p: own, ans: m * own },
      ),
      h: [
        T(
          "The tape has one equal part for each number in the ratio.",
          "La cinta tiene una parte igual por cada número de la razón.",
        ),
        T(
          "Add the ratio numbers to count the equal parts. Then split the total evenly among them.",
          "Suma los números de la razón para contar las partes iguales. Luego reparte el total en partes iguales.",
        ),
        T(
          "Find how many are in one part, then multiply by the number of parts for {xn}.",
          "Halla cuántos hay en una parte y multiplica por el número de partes de {xn}.",
          { xn },
        ),
      ],
      meta: { a, b, t, askB },
    });
  };
  const rwShareCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    let first = -1;
    for (let x = 0; x <= m.t; x++) if (x * m.b === (m.t - x) * m.a) first = x; // x of group one, the rest group two
    if (first < 0) return "no whole-number split";
    return wantNum(it, m.askB ? m.t - first : first);
  };

  /** L4: which total is possible for a given ratio */
  const rwPossible = (/** @type {any} */ rng) => {
    const c = rng.pick(COLL);
    const [a, b] = coprimePair(rng, 2, 8);
    const s = a + b;
    const right = s * rng.int(2, 7);
    const wrongs = [];
    for (const step of [a, b]) {
      const cand = [];
      for (let i = 2; i <= 12; i++)
        if ((step * i) % s !== 0 && Math.abs(step * i - right) <= 2 * s) cand.push(step * i);
      if (cand.length) wrongs.push({ v: rng.pick(cand), step });
    }
    wrongs.push({ v: right + (rng.chance(0.5) ? 1 : -1), step: 0 });
    wrongs.push({ v: right + rng.pick([2, -2, 3, -3]), step: 0 });
    if (wrongs.some((w) => w.v < 4 || w.v % s === 0)) redo();
    return mcB(rng, {
      q: T(
        "The ratio of {an} to {bn} is {a}:{b}. Which could be the total number of {all}?",
        "La razón de {an} a {bn} es {a}:{b}. ¿Cuál podría ser el número total de {all}?",
        { an: c.na, bn: c.nb, a, b, all: c.all },
      ),
      right: String(right),
      wrong: wrongs.map((w) => ({
        v: String(w.v),
        f: w.step
          ? T(
              "{v} is a multiple of {step}, but the total has to be a whole number of groups of {a} + {b} = {s}.",
              "{v} es múltiplo de {step}, pero el total tiene que ser un número entero de grupos de {a} + {b} = {s}.",
              { v: w.v, step: w.step, a, b, s },
            )
          : T(
              "The total has to be a whole number of groups of {a} + {b} = {s}, and {v} is not one.",
              "El total tiene que ser un número entero de grupos de {a} + {b} = {s}, y {v} no lo es.",
              { v: w.v, a, b, s },
            ),
        tag: "total-parts-missed",
      })),
      x: T(
        "Every full group in {a}:{b} has {a} + {b} = {s} things, so the total must be a multiple of {s}. {right} = {m} × {s}.",
        "Cada grupo completo de {a}:{b} tiene {a} + {b} = {s} cosas, así que el total debe ser múltiplo de {s}. {right} = {m} × {s}.",
        { a, b, s, right, m: right / s },
      ),
      h: [
        T(
          "Think of the ratio as groups of parts that repeat.",
          "Piensa en la razón como grupos de partes que se repiten.",
        ),
        T(
          "One full group has {a} + {b} things. Any total has to be made of whole groups.",
          "Un grupo completo tiene {a} + {b} cosas. Cualquier total tiene que estar formado por grupos completos.",
          { a, b },
        ),
        T(
          "Test each choice: can it be split into whole groups of the size you found?",
          "Prueba cada opción: ¿se puede repartir en grupos completos del tamaño que hallaste?",
        ),
      ],
      meta: { a, b },
    });
  };
  const rwPossibleCheck = (/** @type {any} */ it) => {
    const s = it.meta.a + it.meta.b;
    return pickOne(it, (c) => {
      for (let g = 1; g * s <= Number(c); g++) if (g * s === Number(c)) return true;
      return false;
    });
  };

  suite("ratioWrite", "Write ratios", "Escribir razones", {
    1: [
      form("pp", rwPartToPart("coll"), rwPartToPartCheck),
      form("pm", rwPartToPart("mix"), rwPartToPartCheck),
    ],
    2: [form("pw", rwPartToWhole, rwPartToWholeCheck), form("interp", rwInterp, rwInterpCheck)],
    3: [
      form("tape", rwTape, rwTapeCheck),
      form("simplest", rwSimplest, rwSimplestCheck),
      form("convert", rwConvert, rwConvertCheck),
    ],
    4: [
      form("batch", rwBatch, rwBatchCheck),
      form("share", rwShare, rwShareCheck),
      form("possible", rwPossible, rwPossibleCheck),
    ],
  });

  /* ===================================================================================================
   * Rate situations (unitRate, unitRateWord, compareRatios)
   * Amounts of the first quantity (A) are kept in "units": cents for money, plain numbers otherwise.
   * =================================================================================================== */
  const ent = (/** @type {string} */ en, /** @type {string} */ es, /** @type {string} */ cap) => ({
    n: [en, es],
    N: [en, cap],
  });
  const ENTS = /** @type {Record<string, any[]>} */ ({
    store: [
      ent("Store A", "la tienda A", "La tienda A"),
      ent("Store B", "la tienda B", "La tienda B"),
    ],
    plan: [ent("Plan A", "el plan A", "El plan A"), ent("Plan B", "el plan B", "El plan B")],
    box: [ent("Box A", "la caja A", "La caja A"), ent("Box B", "la caja B", "La caja B")],
    printer: [
      ent("Printer A", "la impresora A", "La impresora A"),
      ent("Printer B", "la impresora B", "La impresora B"),
    ],
    pump: [ent("Pump A", "la bomba A", "La bomba A"), ent("Pump B", "la bomba B", "La bomba B")],
  });
  /** two distinct entities for a context (people get random names) */
  const entsOf = (/** @type {any} */ rng, /** @type {any} */ c) => {
    if (c.ent !== "person") return ENTS[c.ent];
    const [a, b] = rng.shuffle(NAMES).slice(0, 2);
    return [ent(a, a, a), ent(b, b, b)];
  };
  const wh = (/** @type {any} */ e) => ({ who: e.n, Who: e.N });

  /**
   * lo..hi: rate range in units (cents for money); bl..bh: range for the count of B; step: the granularity
   * the rate moves in at each level [L1, L3, L4]. better: which rate wins a comparison.
   * hdE / hdA / hdB: table headers (entity, first quantity, second quantity).
   */
  const RATES = [
    {
      id: "bike",
      g: "f",
      A: Q("mile", "miles", "milla", "millas"),
      B: Q("hour", "hours", "hora", "horas"),
      ent: "person",
      better: "high",
      lo: 6,
      hi: 16,
      bl: 2,
      bh: 6,
      prep: ["in", "en"],
      hd: [
        ["Rider", "Ciclista"],
        ["Miles", "Millas"],
        ["Hours", "Horas"],
      ],
      say: (/** @type {any} */ e, /** @type {any} */ A, /** @type {any} */ B) =>
        T("{Who} rides {A} in {B}.", "{Who} recorre {A} en {B}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (/** @type {any} */ e, /** @type {any} */ r) =>
        T("{Who} rides at {r}.", "{Who} anda a {r}.", { ...wh(e), r }),
      askA: (/** @type {any} */ e, /** @type {any} */ B) =>
        T("How many miles does {who} ride in {B}?", "¿Cuántas millas recorre {who} en {B}?", {
          ...wh(e),
          B,
        }),
      askB: (/** @type {any} */ e, /** @type {any} */ A) =>
        T(
          "How many hours does {who} need to ride {A}?",
          "¿Cuántas horas necesita {who} para recorrer {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Who rides faster?", "¿Quién anda más rápido?"),
    },
    {
      id: "typing",
      g: "f",
      A: Q("word", "words", "palabra", "palabras"),
      B: Q("minute", "minutes", "minuto", "minutos"),
      ent: "person",
      better: "high",
      lo: 20,
      hi: 60,
      bl: 2,
      bh: 6,
      prep: ["in", "en"],
      hd: [
        ["Student", "Estudiante"],
        ["Words", "Palabras"],
        ["Minutes", "Minutos"],
      ],
      say: (e, A, B) =>
        T("{Who} types {A} in {B}.", "{Who} escribe {A} en {B}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) => T("{Who} types at {r}.", "{Who} escribe a {r}.", { ...wh(e), r }),
      askA: (e, B) =>
        T("How many words does {who} type in {B}?", "¿Cuántas palabras escribe {who} en {B}?", {
          ...wh(e),
          B,
        }),
      askB: (e, A) =>
        T(
          "How many minutes does {who} need to type {A}?",
          "¿Cuántos minutos necesita {who} para escribir {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Who types faster?", "¿Quién escribe más rápido?"),
    },
    {
      id: "reading",
      g: "f",
      A: Q("page", "pages", "página", "páginas"),
      B: Q("hour", "hours", "hora", "horas"),
      ent: "person",
      better: "high",
      lo: 12,
      hi: 40,
      bl: 2,
      bh: 6,
      prep: ["in", "en"],
      hd: [
        ["Student", "Estudiante"],
        ["Pages", "Páginas"],
        ["Hours", "Horas"],
      ],
      say: (e, A, B) => T("{Who} reads {A} in {B}.", "{Who} lee {A} en {B}.", { ...wh(e), A, B }),
      rate: (e, r) => T("{Who} reads at {r}.", "{Who} lee a {r}.", { ...wh(e), r }),
      askA: (e, B) =>
        T("How many pages does {who} read in {B}?", "¿Cuántas páginas lee {who} en {B}?", {
          ...wh(e),
          B,
        }),
      askB: (e, A) =>
        T(
          "How many hours does {who} need to read {A}?",
          "¿Cuántas horas necesita {who} para leer {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Who reads faster?", "¿Quién lee más rápido?"),
    },
    {
      id: "printer",
      g: "f",
      A: Q("page", "pages", "página", "páginas"),
      B: Q("minute", "minutes", "minuto", "minutos"),
      ent: "printer",
      better: "high",
      lo: 6,
      hi: 24,
      bl: 3,
      bh: 9,
      prep: ["in", "en"],
      hd: [
        ["Printer", "Impresora"],
        ["Pages", "Páginas"],
        ["Minutes", "Minutos"],
      ],
      say: (e, A, B) =>
        T("{Who} prints {A} in {B}.", "{Who} imprime {A} en {B}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) => T("{Who} prints at {r}.", "{Who} imprime a {r}.", { ...wh(e), r }),
      askA: (e, B) =>
        T("How many pages does {who} print in {B}?", "¿Cuántas páginas imprime {who} en {B}?", {
          ...wh(e),
          B,
        }),
      askB: (e, A) =>
        T(
          "How many minutes does {who} need to print {A}?",
          "¿Cuántos minutos necesita {who} para imprimir {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Which printer is faster?", "¿Cuál impresora es más rápida?"),
    },
    {
      id: "pump",
      g: "m",
      A: Q("gallon", "gallons", "galón", "galones"),
      B: Q("minute", "minutes", "minuto", "minutos"),
      ent: "pump",
      better: "high",
      lo: 3,
      hi: 15,
      bl: 3,
      bh: 9,
      prep: ["in", "en"],
      hd: [
        ["Pump", "Bomba"],
        ["Gallons", "Galones"],
        ["Minutes", "Minutos"],
      ],
      say: (e, A, B) =>
        T("{Who} moves {A} of water in {B}.", "{Who} mueve {A} de agua en {B}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) =>
        T("{Who} moves water at {r}.", "{Who} mueve agua a {r}.", {
          ...wh(e),
          r,
        }),
      askA: (e, B) =>
        T("How many gallons does {who} move in {B}?", "¿Cuántos galones mueve {who} en {B}?", {
          ...wh(e),
          B,
        }),
      askB: (e, A) =>
        T(
          "How many minutes does {who} need to move {A}?",
          "¿Cuántos minutos necesita {who} para mover {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Which pump moves water faster?", "¿Cuál bomba mueve el agua más rápido?"),
    },
    {
      id: "pay",
      g: "m",
      A: Q("dollar", "dollars", "dólar", "dólares"),
      B: Q("hour", "hours", "hora", "horas"),
      money: true,
      ent: "person",
      better: "high",
      lo: 800,
      hi: 1600,
      bl: 3,
      bh: 8,
      prep: ["for", "por"],
      hd: [
        ["Worker", "Trabajador"],
        ["Pay", "Pago"],
        ["Hours", "Horas"],
      ],
      say: (e, A, B) =>
        T("{Who} earns {A} for {B} of dog walking.", "{Who} gana {A} por {B} de pasear perros.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) => T("{Who} earns {r}.", "{Who} gana {r}.", { ...wh(e), r }),
      askA: (e, B) =>
        T("How much does {who} earn in {B}?", "¿Cuánto gana {who} en {B}?", {
          ...wh(e),
          B,
        }),
      askB: (e, A) =>
        T(
          "How many hours does {who} need to work to earn {A}?",
          "¿Cuántas horas necesita trabajar {who} para ganar {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Who earns more per hour?", "¿Quién gana más por hora?"),
    },
    {
      id: "apples",
      g: "m",
      A: Q("dollar", "dollars", "dólar", "dólares"),
      B: Q("pound", "pounds", "libra", "libras"),
      money: true,
      ent: "store",
      better: "low",
      lo: 100,
      hi: 500,
      bl: 2,
      bh: 8,
      prep: ["for", "por"],
      hd: [
        ["Store", "Tienda"],
        ["Cost", "Costo"],
        ["Pounds", "Libras"],
      ],
      say: (e, A, B) =>
        T("At {who}, {B} of apples cost {A}.", "En {who}, {B} de manzanas cuestan {A}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) =>
        T("At {who}, apples cost {r}.", "En {who}, las manzanas cuestan {r}.", {
          ...wh(e),
          r,
        }),
      askA: (e, B) =>
        T(
          "At {who}, how much do {B} of apples cost?",
          "En {who}, ¿cuánto cuestan {B} de manzanas?",
          {
            ...wh(e),
            B,
          },
        ),
      askB: (e, A) =>
        T(
          "At {who}, how many pounds of apples can you buy for {A}?",
          "En {who}, ¿cuántas libras de manzanas se pueden comprar con {A}?",
          { ...wh(e), A },
        ),
      cmp: T(
        "Which store has the lower price per pound?",
        "¿Cuál tienda tiene el precio más bajo por libra?",
      ),
    },
    {
      id: "phone",
      g: "m",
      A: Q("dollar", "dollars", "dólar", "dólares"),
      B: Q("GB", "GB", "GB", "GB"),
      money: true,
      ent: "plan",
      better: "low",
      lo: 300,
      hi: 1000,
      bl: 2,
      bh: 6,
      prep: ["for", "por"],
      hd: [
        ["Plan", "Plan"],
        ["Cost", "Costo"],
        ["Data (GB)", "Datos (GB)"],
      ],
      say: (e, A, B) =>
        T("With {who}, {B} of data cost {A}.", "Con {who}, {B} de datos cuestan {A}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) =>
        T("With {who}, data costs {r}.", "Con {who}, los datos cuestan {r}.", {
          ...wh(e),
          r,
        }),
      askA: (e, B) =>
        T("With {who}, how much do {B} of data cost?", "Con {who}, ¿cuánto cuestan {B} de datos?", {
          ...wh(e),
          B,
        }),
      askB: (e, A) =>
        T(
          "With {who}, how many GB do you get for {A}?",
          "Con {who}, ¿cuántos GB se obtienen por {A}?",
          { ...wh(e), A },
        ),
      cmp: T("Which plan has the lower cost per GB?", "¿Cuál plan tiene el menor costo por GB?"),
    },
    {
      id: "granola",
      g: "m",
      A: Q("dollar", "dollars", "dólar", "dólares"),
      B: Q("granola bar", "granola bars", "barra de granola", "barras de granola"),
      money: true,
      ent: "box",
      better: "low",
      lo: 50,
      hi: 250,
      bl: 4,
      bh: 12,
      prep: ["for", "por"],
      hd: [
        ["Box", "Caja"],
        ["Cost", "Costo"],
        ["Bars", "Barras"],
      ],
      say: (e, A, B) =>
        T("{Who} holds {B} and costs {A}.", "{Who} trae {B} y cuesta {A}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) => T("{Who} costs {r}.", "{Who} cuesta {r}.", { ...wh(e), r }),
      askA: (e, B) =>
        T(
          "At the price of {who}, how much do {B} cost?",
          "Al precio de {who}, ¿cuánto cuestan {B}?",
          {
            ...wh(e),
            B,
          },
        ),
      askB: (e, A) =>
        T(
          "At the price of {who}, how many bars can you buy for {A}?",
          "Al precio de {who}, ¿cuántas barras se pueden comprar con {A}?",
          { ...wh(e), A },
        ),
      cmp: T(
        "Which box has the lower price per bar?",
        "¿Cuál caja tiene el precio más bajo por barra?",
      ),
    },
    {
      id: "laps",
      g: "m",
      A: Q("minute", "minutes", "minuto", "minutos"),
      B: Q("lap", "laps", "vuelta", "vueltas"),
      ent: "person",
      better: "low",
      lo: 3,
      hi: 9,
      bl: 4,
      bh: 10,
      prep: ["for", "por"],
      hd: [
        ["Runner", "Corredor"],
        ["Minutes", "Minutos"],
        ["Laps", "Vueltas"],
      ],
      say: (e, A, B) =>
        T("{Who} jogs {B} in {A}.", "{Who} trota {B} en {A}.", {
          ...wh(e),
          A,
          B,
        }),
      rate: (e, r) => T("{Who} takes {r}.", "{Who} tarda {r}.", { ...wh(e), r }),
      askA: (e, B) =>
        T(
          "How many minutes does {who} need for {B}?",
          "¿Cuántos minutos necesita {who} para {B}?",
          {
            ...wh(e),
            B,
          },
        ),
      askB: (e, A) =>
        T("How many laps does {who} jog in {A}?", "¿Cuántas vueltas trota {who} en {A}?", {
          ...wh(e),
          A,
        }),
      cmp: T("Who jogs faster?", "¿Quién trota más rápido?"),
    },
  ];

  /** a quantity of A in units: "$12.50" or "36 miles" */
  const showA = (/** @type {any} */ c, /** @type {number} */ u) =>
    c.money ? [usd(u), usd(u)] : np(c.A, u);
  const showB = (/** @type {any} */ c, /** @type {number} */ n) => np(c.B, n);
  /** a rate in units per 1 B: "$2.50 per pound" or "12 miles per hour" */
  const showRate = (/** @type {any} */ c, /** @type {number} */ u) =>
    c.money
      ? [`${usd(u)} per ${c.B.s[0]}`, `${usd(u)} por ${c.B.s[1]}`]
      : [`${show(u)} ${c.A.p[0]} per ${c.B.s[0]}`, `${show(u)} ${c.A.p[1]} por ${c.B.s[1]}`];
  /** "miles per hour" (no number) */
  const perOf = (/** @type {any} */ c) => [
    `${c.A.p[0]} per ${c.B.s[0]}`,
    `${c.A.p[1]} por ${c.B.s[1]}`,
  ];
  /** an amount in units for prose: "$12.50" or "36" */
  const plain = (/** @type {any} */ c, /** @type {number} */ u) => (c.money ? usd(u) : show(u));
  /** a typed answer for an amount in units */
  const realOf = (/** @type {any} */ c, /** @type {number} */ u) => (c.money ? u / 100 : u);
  const ansOf = (/** @type {any} */ c, /** @type {number} */ u) =>
    c.money ? (u / 100).toFixed(2) : fmt(u);
  /** a rate drawn in units at a given granularity (whole dollars, nickels, quarters; plain steps otherwise) */
  const drawRate = (/** @type {any} */ rng, /** @type {any} */ c, /** @type {number} */ step) => {
    if (!c.money) return rng.int(c.lo, c.hi);
    const lo = Math.ceil(c.lo / step);
    const hi = Math.floor(c.hi / step);
    return step * rng.int(lo, hi);
  };
  const MONEY_STEP = [100, 25, 5, 25]; // by level (index = level - 1): whole dollars, quarters, nickels, quarters

  /* ===================================================================================================
   * unitRate (3-2)
   * =================================================================================================== */
  const cuantos = (/** @type {any} */ c) => (c.g === "f" ? "Cuántas" : "Cuántos");
  const winRule = {
    high: T("The higher unit rate wins", "Gana la tasa unitaria mayor"),
    low: T("The lower unit rate wins", "Gana la tasa unitaria menor"),
  };
  const betterWord = {
    high: T("a higher unit rate", "una tasa unitaria mayor"),
    low: T("a lower unit rate", "una tasa unitaria menor"),
  };

  /** L1: find the unit rate from two quantities (typed) */
  const urBasic = (/** @type {any} */ rng) => {
    const c = rng.pick(RATES);
    const e = entsOf(rng, c)[0];
    const r = drawRate(rng, c, MONEY_STEP[0]);
    const n = rng.int(c.bl, c.bh);
    const t = r * n;
    const asBlank = rng.chance(0.5);
    const sentence = c.say(e, showA(c, t), showB(c, n));
    const vars = {
      Ap: c.A.p,
      Bs: c.B.s,
      Bp: c.B.p,
      per: perOf(c),
      prep: c.prep,
      n,
      tt: ansOf(c, t),
    };
    const tail = asBlank
      ? T(
          "How many {Ap} {prep} 1 {Bs} at the same rate?",
          "¿{Q} {Ap} {prep} 1 {Bs} a la misma tasa?",
          { ...vars, Q: ["", cuantos(c)] },
        )
      : T("What is the unit rate in {per}?", "¿Cuál es la tasa unitaria en {per}?", vars);
    if (asBlank) tail[0] = tail[0].replace(/^\s+/, "");
    return numB({
      q: T("{s} {t}", "{s} {t}", { s: sentence, t: tail }),
      a: ansOf(c, r),
      fw: [
        {
          v: realOf(c, t),
          f: T(
            "{tt} is the total, not the amount for 1 {Bs}. Divide to find the amount for one.",
            "{tt} es el total, no la cantidad para 1 {Bs}. Divide para hallar la cantidad de uno.",
            vars,
          ),
          tag: "rate-not-per-one",
        },
        {
          v: `${n}/${realOf(c, t)}`,
          f: T(
            "That divides the {Bp} by the {Ap}, which is the other way round. A rate in {per} needs the {Ap} divided by the {Bp}.",
            "Eso divide {Bp} entre {Ap}, que es al revés. Una tasa en {per} necesita dividir {Ap} entre {Bp}.",
            vars,
          ),
          tag: "op-reversed-division",
        },
        {
          v: realOf(c, t * n),
          f: T(
            "Multiplying makes a much bigger number. The amount for 1 {Bs} must be smaller than the total.",
            "Multiplicar da un número mucho mayor. La cantidad para 1 {Bs} debe ser menor que el total.",
            vars,
          ),
          tag: "op-multiplied-instead-of-divided",
        },
      ],
      x: T(
        "Divide by the number of {Bp}: {tt} ÷ {n} = {rr}. The unit rate is {rt}.",
        "Divide entre el número de {Bp}: {tt} ÷ {n} = {rr}. La tasa unitaria es {rt}.",
        { ...vars, rr: ansOf(c, r), rt: showRate(c, r) },
      ),
      h: [
        T(
          "A unit rate tells the amount of {Ap} for exactly 1 {Bs}.",
          "Una tasa unitaria indica la cantidad de {Ap} para exactamente 1 {Bs}.",
          vars,
        ),
        T(
          "Split {A} into {n} equal groups, one for each {Bs}.",
          "Reparte {A} en {n} grupos iguales, uno por cada {Bs}.",
          { ...vars, A: showA(c, t) },
        ),
        T(
          "Divide the total by the number of {Bp}: {tt} ÷ {n}.",
          "Divide el total entre el número de {Bp}: {tt} ÷ {n}.",
          vars,
        ),
      ],
      meta: { id: c.id, t, n },
    });
  };
  const urBasicCheck = (/** @type {any} */ it) => {
    const c = RATES.find((r) => r.id === it.meta.id);
    const s = stemHas(it, [it.meta.n]);
    if (s !== true) return s;
    // substitution: rate x number of B must rebuild the total
    return (
      same(Math.round(value(it.a) * it.meta.n * 100), realOf(c, it.meta.t) * 100) ||
      "rate x count does not rebuild the total"
    );
  };

  /* ---- L2: which unit rate answers the question ------------------------------------------------- */
  const ITEMS = [
    { it: Q("notebook", "notebooks", "cuaderno", "cuadernos"), g: "m" },
    { it: Q("pen", "pens", "bolígrafo", "bolígrafos"), g: "m" },
    {
      it: Q("granola bar", "granola bars", "barra de granola", "barras de granola"),
      g: "f",
    },
    { it: Q("sticker", "stickers", "calcomanía", "calcomanías"), g: "f" },
    { it: Q("pencil", "pencils", "lápiz", "lápices"), g: "m" },
    {
      it: Q("juice box", "juice boxes", "caja de jugo", "cajas de jugo"),
      g: "f",
    },
    { it: Q("marker", "markers", "marcador", "marcadores"), g: "m" },
    {
      it: Q("bottle of water", "bottles of water", "botella de agua", "botellas de agua"),
      g: "f",
    },
    { it: Q("trading card", "trading cards", "carta", "cartas"), g: "f" },
    { it: Q("muffin", "muffins", "muffin", "muffins"), g: "m" },
  ];
  const PRICES = [20, 25, 40, 50, 80, 125, 250, 400]; // cents per item; 100 / price is a short decimal too

  const urPick = (/** @type {any} */ rng) => {
    const { it, g } = rng.pick(ITEMS);
    const who = rng.pick(NAMES);
    const p = rng.pick(PRICES);
    const n = rng.int(4, 12);
    const t = p * n;
    const k = 100 / p;
    const ask = rng.chance(0.5) ? 1 : 2;
    const vars = { who, items: it.p, item: it.s, n, tot: usd(t), g };
    const perItem = [`${usd(p)} per ${it.s[0]}`, `${usd(p)} por ${it.s[1]}`];
    const perDollar = (/** @type {number} */ v) => [
      `${fmt(v)} ${it.p[0]} per dollar`,
      `${fmt(v)} ${it.p[1]} por dólar`,
    ];
    const cost = (/** @type {number} */ u) => [
      `${usd(u)} per ${it.s[0]}`,
      `${usd(u)} por ${it.s[1]}`,
    ];
    const right = ask === 1 ? perItem : perDollar(k);
    const wrong =
      ask === 1
        ? [
            [
              perDollar(k),
              "op-reversed-division",
              T(
                "That tells how many {items} you get for $1. The question asks how much 1 {item} costs.",
                "Eso dice la cantidad de {items} que se obtiene con $1. La pregunta pide cuánto cuesta 1 {item}.",
                vars,
              ),
            ],
            [
              cost(t),
              "rate-not-per-one",
              T(
                "{tot} is the cost of the whole purchase, not of 1 {item}.",
                "{tot} es el costo de toda la compra, no de 1 {item}.",
                vars,
              ),
            ],
            [
              cost(t * n),
              "op-multiplied-instead-of-divided",
              T(
                "Multiplying makes a number that is far too big. One {item} costs less than the whole purchase.",
                "Multiplicar da un número demasiado grande. Cada {item} cuesta menos que la compra completa.",
                vars,
              ),
            ],
          ]
        : [
            [
              perItem,
              "op-reversed-division",
              T(
                "That is the cost of 1 {item}. The question asks how many {items} $1 buys.",
                "Eso es el costo de 1 {item}. La pregunta pide la cantidad de {items} que compra $1.",
                vars,
              ),
            ],
            [
              perDollar(n),
              "rate-not-per-one",
              T(
                "{n} is the number of {items} bought for {tot}, not for $1.",
                "{n} es el número de {items} comprados por {tot}, no por $1.",
                vars,
              ),
            ],
            [
              perDollar(t / 100),
              "rate-not-per-one",
              T(
                "{tot} is the number of dollars spent. It is not the number of {items} for $1.",
                "{tot} es el número de dólares gastados. No es el número de {items} por $1.",
                vars,
              ),
            ],
          ];
    const q1 = T("How much does 1 {item} cost?", "¿Cuánto cuesta 1 {item}?", vars);
    const q2 = T(
      "How many {items} can {who} buy for $1?",
      "¿{Q} {items} puede comprar {who} con $1?",
      { ...vars, Q: ["", cuantos({ g })] },
    );
    return mcB(rng, {
      q: T("{who} buys {B} for {tot}. {q}", "{who} compra {B} por {tot}. {q}", {
        who,
        B: np(it, n),
        tot: usd(t),
        q: ask === 1 ? q1 : q2,
      }),
      right: { v: right[0], vEs: right[1] },
      wrong: wrong.map(([r, tag, f]) => ({ v: r[0], vEs: r[1], f, tag })),
      x:
        ask === 1
          ? T(
              "The question is about 1 {item}, so divide the cost by the number of {items}: {tot} ÷ {n} = {pp}.",
              "La pregunta trata de 1 {item}, así que divide el costo entre el número de {items}: {tot} ÷ {n} = {pp}.",
              { ...vars, pp: usd(p) },
            )
          : T(
              "The question is about $1, so divide the number of {items} by the dollars: {n} ÷ {d} = {kk}.",
              "La pregunta trata de $1, así que divide el número de {items} entre los dólares: {n} ÷ {d} = {kk}.",
              { ...vars, d: (t / 100).toFixed(2), kk: fmt(k) },
            ),
      h: [
        T(
          'A unit rate is "per 1" of something. Find the thing the question puts at 1.',
          'Una tasa unitaria es "por 1" de algo. Busca lo que la pregunta pone en 1.',
        ),
        ask === 1
          ? T(
              'The question asks about 1 {item}, so the rate must say "per {item}".',
              'La pregunta trata de 1 {item}, así que la tasa debe decir "por {item}".',
              vars,
            )
          : T(
              'The question asks about $1, so the rate must say "per dollar".',
              'La pregunta trata de $1, así que la tasa debe decir "por dólar".',
              vars,
            ),
        ask === 1
          ? T(
              "Divide the dollars by the number of {items}.",
              "Divide los dólares entre el número de {items}.",
              vars,
            )
          : T(
              "Divide the number of {items} by the dollars.",
              "Divide el número de {items} entre los dólares.",
              vars,
            ),
      ],
      meta: { ask, n, t, p },
    });
  };
  const urPickCheck = (/** @type {any} */ it) => {
    const { ask, n, t } = it.meta;
    const dollars = t / 100;
    return pickOne(it, (c) => {
      if (ask === 1) {
        const m = c.match(/^\$([\d.]+) per /);
        return !!m && same(Number(m[1]) * n, dollars, 1e-6);
      }
      const m = c.match(/^([\d.]+) .+ per dollar$/);
      return !!m && same(Number(m[1]) * dollars, n, 1e-6);
    });
  };

  /* ---- L3: compare two rates / rank three --------------------------------------------------------- */
  /** `show` text for an entity with a claimed rate: "Maya: 50 words per minute" */
  const claim = (/** @type {any} */ e, /** @type {any} */ c, /** @type {number} */ u) => {
    const r = showRate(c, u);
    return { v: `${e.N[0]}: ${r[0]}`, vEs: `${e.N[1]}: ${r[1]}` };
  };
  const urCompare = (/** @type {any} */ rng) => {
    const c = rng.pick(RATES);
    const [e1, e2] = entsOf(rng, c);
    const step = c.money ? MONEY_STEP[2] : 1;
    const r1 = drawRate(rng, c, step);
    const r2 = drawRate(rng, c, step);
    const n1 = rng.int(c.bl, c.bh);
    const n2 = rng.int(c.bl, c.bh);
    if (r1 === r2 || n1 === n2) redo();
    const t1 = r1 * n1;
    const t2 = r2 * n2;
    if (t1 === t2) redo();
    const high = c.better === "high";
    const win = (high ? r1 > r2 : r1 < r2) ? 0 : 1;
    const naive = (high ? t1 > t2 : t1 < t2) ? 0 : 1; // the entity a totals-only student would pick
    if (naive === win) redo(); // always a trap: the totals point the wrong way
    const E = [e1, e2];
    const R = [r1, r2];
    const Tt = [t1, t2];
    const N = [n1, n2];
    const W = E[win];
    const L = E[1 - win];
    const vars = {
      Bs: c.B.s,
      Bp: c.B.p,
      per: perOf(c),
      bet: betterWord[c.better],
    };
    const mk = (
      /** @type {any} */ e,
      /** @type {number} */ u,
      /** @type {any} */ f,
      /** @type {string} */ tag,
    ) => ({ ...claim(e, c, u), f, tag });
    return mcB(rng, {
      q: T("{s1} {s2} {cmp}", "{s1} {s2} {cmp}", {
        s1: c.say(e1, showA(c, t1), showB(c, n1)),
        s2: c.say(e2, showA(c, t2), showB(c, n2)),
        cmp: c.cmp,
      }),
      right: claim(W, c, R[win]),
      wrong: [
        mk(
          L,
          R[1 - win],
          T(
            "That unit rate belongs to the other one. {bet} wins here, and {w} has it.",
            "Esa tasa unitaria es de la otra opción. Aquí gana {bet}, y la tiene {w}.",
            { ...vars, w: W.n },
          ),
          "compared-wrong-direction",
        ),
        mk(
          L,
          Tt[1 - win],
          T(
            "That compares the totals. The totals are for different numbers of {Bp}, so find each unit rate first.",
            "Eso compara los totales. Los totales son para distintos números de {Bp}, así que halla primero cada tasa unitaria.",
            vars,
          ),
          "ratio-compared-without-common-basis",
        ),
        mk(
          W,
          Tt[win],
          T(
            "That total is not a rate for 1 {Bs}. Divide to find the unit rate first.",
            "Ese total no es una tasa para 1 {Bs}. Divide primero para hallar la tasa unitaria.",
            vars,
          ),
          "rate-not-per-one",
        ),
      ],
      x: T(
        "Compare unit rates, not totals. {a}: {t1} ÷ {n1} = {r1}. {b}: {t2} ÷ {n2} = {r2}. {rule}, so the answer is {w}.",
        "Compara tasas unitarias, no totales. {a}: {t1} ÷ {n1} = {r1}. {b}: {t2} ÷ {n2} = {r2}. {rule}, así que la respuesta es {w}.",
        {
          a: e1.N,
          b: e2.N,
          t1: plain(c, t1),
          n1,
          r1: plain(c, r1),
          t2: plain(c, t2),
          n2,
          r2: plain(c, r2),
          rule: winRule[c.better],
          w: W.n,
        },
      ),
      h: [
        T(
          "Do not compare the totals. Compare the amount for exactly 1 {Bs}.",
          "No compares los totales. Compara la cantidad para exactamente 1 {Bs}.",
          vars,
        ),
        T(
          "Find the unit rate for each one: divide each total by its number of {Bp}.",
          "Halla la tasa unitaria de cada uno: divide cada total entre su número de {Bp}.",
          vars,
        ),
        T("Then pick the one with {bet}.", "Luego elige la que tiene {bet}.", vars),
      ],
      meta: { id: c.id, names: [e1.N[0], e2.N[0]], t: [t1, t2], n: N },
    });
  };
  const urCompareCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const c = RATES.find((r) => r.id === m.id);
    // winner by cross-products (no division): t1/n1 > t2/n2  <=>  t1*n2 > t2*n1
    const cross = m.t[0] * m.n[1] - m.t[1] * m.n[0];
    const winner = (c.better === "high" ? cross > 0 : cross < 0) ? 0 : 1;
    return pickOne(it, (txt) => {
      const mm = txt.match(/^(.+?): \$?([\d.]+)/);
      if (!mm) return false;
      const i = m.names.indexOf(mm[1]);
      if (i < 0 || i !== winner) return false;
      const claimed = Number(mm[2]) * (c.money ? 1 : 1);
      return same(claimed * m.n[i], m.t[i] / (c.money ? 100 : 1), 1e-6);
    });
  };

  const urRank = (/** @type {any} */ rng) => {
    const c = rng.pick(RATES);
    const step = c.money ? MONEY_STEP[2] : 1;
    const rows = ["A", "B", "C"].map((name) => ({
      name,
      r: drawRate(rng, c, step),
      n: rng.int(c.bl, c.bh),
    }));
    for (const x of rows) x.t = x.r * x.n;
    const distinct = (/** @type {number[]} */ a) => new Set(a).size === a.length;
    if (
      !distinct(rows.map((x) => x.r)) ||
      !distinct(rows.map((x) => x.n)) ||
      !distinct(rows.map((x) => x.t))
    )
      redo();
    const order = (/** @type {string} */ key, rev = false) => {
      const s = [...rows].sort((a, b) => a[key] - b[key]).map((x) => x.name);
      return rev ? s.reverse() : s;
    };
    const right = order("r");
    const cands = [
      [
        order("r", true),
        "compared-wrong-direction",
        T(
          "That list goes from the highest unit rate to the lowest. The question asks for the lowest first.",
          "Esa lista va de la tasa unitaria mayor a la menor. La pregunta pide primero la menor.",
        ),
      ],
      [
        order("t"),
        "ratio-compared-without-common-basis",
        T(
          "That list is ordered by the first number column. Totals cannot be ranked until each one is divided by its second number.",
          "Esa lista está ordenada por la primera columna de números. Los totales no se pueden ordenar hasta dividir cada uno entre su segundo número.",
        ),
      ],
      [
        order("t", true),
        "ratio-compared-without-common-basis",
        T(
          "That list is ordered by the first number column, biggest first. Totals cannot be ranked until each one is divided.",
          "Esa lista está ordenada por la primera columna de números, de mayor a menor. Los totales no se pueden ordenar hasta dividir cada uno.",
        ),
      ],
      [
        order("n"),
        "ratio-compared-without-common-basis",
        T(
          "That list is ordered by the second number column only. A unit rate uses both numbers.",
          "Esa lista está ordenada solo por la segunda columna de números. Una tasa unitaria usa ambos números.",
        ),
      ],
      [
        order("n", true),
        "ratio-compared-without-common-basis",
        T(
          "That list is ordered by the second number column only. A unit rate uses both numbers.",
          "Esa lista está ordenada solo por la segunda columna de números. Una tasa unitaria usa ambos números.",
        ),
      ],
    ];
    const key = (/** @type {string[]} */ a) => a.join(", ");
    const used = new Set([key(right)]);
    const wrong = [];
    for (const [lst, tag, f] of cands) {
      if (used.has(key(lst))) continue;
      used.add(key(lst));
      wrong.push({ v: key(lst), f, tag });
    }
    if (wrong.length < 3) redo();
    const hd = c.hd;
    return mcB(rng, {
      q: T(
        "Use the table. Which list puts A, B and C in order from the lowest unit rate to the highest unit rate ({per})?",
        "Usa la tabla. ¿Cuál lista ordena A, B y C de la tasa unitaria menor a la mayor ({per})?",
        { per: perOf(c) },
      ),
      viz: {
        t: "table",
        hd: [hd[0][0], hd[1][0], hd[2][0]],
        hdEs: [hd[0][1], hd[1][1], hd[2][1]],
        rows: rows.map((x) => [x.name, c.money ? usd(x.t) : x.t, x.n]),
      },
      right: key(right),
      wrong,
      x: T(
        "Divide each first number by its second number: {parts}. From lowest to highest the order is {ord}.",
        "Divide cada primer número entre su segundo número: {parts}. De menor a mayor el orden es {ord}.",
        {
          parts: rows.map((x) => `${x.name} = ${plain(c, x.r)}`).join(", "),
          ord: key(right),
        },
      ),
      h: [
        T(
          "A unit rate uses both numbers in a row. Do not rank by one column.",
          "Una tasa unitaria usa ambos números de una fila. No ordenes por una sola columna.",
        ),
        T(
          "For each row, divide the first number by the second number.",
          "En cada fila, divide el primer número entre el segundo.",
        ),
        T(
          "Write the three unit rates, then list the rows from the smallest rate to the largest.",
          "Escribe las tres tasas unitarias y luego enumera las filas de la tasa menor a la mayor.",
        ),
      ],
      meta: {
        id: c.id,
        rows: rows.map((x) => ({ name: x.name, t: x.t, n: x.n })),
      },
    });
  };
  const urRankCheck = (/** @type {any} */ it) => {
    const byName = Object.fromEntries(it.meta.rows.map((/** @type {any} */ x) => [x.name, x]));
    return pickOne(it, (txt) => {
      const names = txt.split(", ");
      if (names.length !== 3 || new Set(names).size !== 3) return false;
      for (let i = 0; i < 2; i++) {
        const a = byName[names[i]];
        const b = byName[names[i + 1]];
        if (!a || !b || !(a.t * b.n < b.t * a.n)) return false; // a's rate < b's rate, cross-multiplied
      }
      return true;
    });
  };

  /* ---- L4: the unit rate is given; find the total or the missing count ----------------------------- */
  const urGiven = (/** @type {any} */ rng) => {
    const c = rng.pick(RATES);
    const e = entsOf(rng, c)[0];
    const r = drawRate(rng, c, MONEY_STEP[3]);
    const n = rng.int(c.bl + 2, c.bh + 6);
    const t = r * n;
    const total = rng.chance(0.5);
    const rr = showRate(c, r);
    const vars = {
      Bs: c.B.s,
      Bp: c.B.p,
      rt: rr,
      r: ansOf(c, r),
      n,
      At: showA(c, t),
    };
    const ans = total ? ansOf(c, t) : String(n);
    const fw = total
      ? [
          {
            v: realOf(c, r) + n,
            f: T(
              "Adding the rate and the number of {Bp} mixes two different things. {n} {Bp} means {n} groups, so multiply.",
              "Sumar la tasa y el número de {Bp} mezcla dos cosas distintas. {n} {Bp} significan {n} grupos, así que multiplica.",
              vars,
            ),
            tag: "op-added-instead-of-multiplied",
          },
          {
            v: `${realOf(c, r)}/${n}`,
            f: T(
              "Dividing makes the amount smaller. More {Bp} should give a bigger total, not a smaller one.",
              "Dividir hace la cantidad menor. Más {Bp} deben dar un total mayor, no menor.",
              vars,
            ),
            tag: "op-divided-instead-of-multiplied",
          },
        ]
      : [
          {
            v: realOf(c, r) * realOf(c, t),
            f: T(
              "Multiplying makes a huge number. Ask how many groups of the unit rate fit in the total, which is a division.",
              "Multiplicar da un número enorme. Pregunta cuántos grupos de la tasa unitaria caben en el total, que es una división.",
            ),
            tag: "op-multiplied-instead-of-divided",
          },
          {
            v: `${realOf(c, r)}/${realOf(c, t)}`,
            f: T(
              "That divides the rate by the total, the wrong way round. Divide the total by the rate.",
              "Eso divide la tasa entre el total, al revés. Divide el total entre la tasa.",
            ),
            tag: "op-reversed-division",
          },
          {
            v: realOf(c, t) - realOf(c, r),
            f: T(
              "Subtracting does not match the story. Each {Bs} adds the same amount again and again, so use division.",
              "Restar no encaja con la situación. Cada {Bs} suma la misma cantidad una y otra vez, así que usa la división.",
              vars,
            ),
            tag: "ratio-as-difference",
          },
        ];
    return numB({
      q: T("{a} {b}", "{a} {b}", {
        a: c.rate(e, rr),
        b: total ? c.askA(e, showB(c, n)) : c.askB(e, showA(c, t)),
      }),
      a: ans,
      fw,
      x: total
        ? T(
            "The unit rate is {rt}. For {n} {Bp}: {r} × {n} = {ans}.",
            "La tasa unitaria es {rt}. Para {n} {Bp}: {r} × {n} = {ans}.",
            { ...vars, ans: plain(c, t), r: plain(c, r) },
          )
        : T(
            "The unit rate is {rt}. The number of {Bp} is {tt} ÷ {r} = {ans}.",
            "La tasa unitaria es {rt}. El número de {Bp} es {tt} ÷ {r} = {ans}.",
            { ...vars, tt: plain(c, t), ans: show(n), r: plain(c, r) },
          ),
      h: total
        ? [
            T(
              "The unit rate is the amount for 1 {Bs}. You need the amount for {n} of them.",
              "La tasa unitaria es la cantidad para 1 {Bs}. Necesitas la cantidad para {n}.",
              vars,
            ),
            T(
              "Picture {n} equal groups, and each group holds the unit rate.",
              "Imagina {n} grupos iguales, y cada grupo tiene la tasa unitaria.",
              vars,
            ),
            T(
              "Multiply the unit rate by the number of {Bp}.",
              "Multiplica la tasa unitaria por el número de {Bp}.",
              vars,
            ),
          ]
        : [
            T(
              "The unit rate is the amount for 1 {Bs}. The question gives the total and asks for the number of {Bp}.",
              "La tasa unitaria es la cantidad para 1 {Bs}. La pregunta da el total y pide el número de {Bp}.",
              vars,
            ),
            T(
              "Ask: how many groups of {r} fit into the total?",
              "Pregunta: ¿cuántos grupos de {r} caben en el total?",
              vars,
            ),
            T("Divide the total by the unit rate.", "Divide el total entre la tasa unitaria."),
          ],
      meta: { id: c.id, r, n, t, total },
    });
  };
  const urGivenCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const c = RATES.find((x) => x.id === m.id);
    const a = value(it.a);
    // total: answer / count must give back the rate; count: answer x rate must give back the total
    return m.total
      ? same(Math.round((a / m.n) * 100), realOf(c, m.r) * 100, 1e-6) ||
          "total / count does not give the rate"
      : same(Math.round(a * realOf(c, m.r) * 100), realOf(c, m.t) * 100, 1e-6) ||
          "count x rate does not give the total";
  };

  suite("unitRate", "Find unit rates", "Hallar tasas unitarias", {
    1: [form("basic", urBasic, urBasicCheck)],
    2: [form("pick", urPick, urPickCheck)],
    3: [form("compare", urCompare, urCompareCheck), form("rank", urRank, urRankCheck)],
    4: [form("given", urGiven, urGivenCheck)],
  });

  /* ===================================================================================================
   * eqRatioTable (3-3)
   * =================================================================================================== */
  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** table headers / number-line labels for a mixture: "Flour (cups)" */
  const labelsOf = (/** @type {any} */ c) => [
    [`${cap(c.na[0])} (${c.unit[0]})`, `${cap(c.na[1])} (${c.unit[1]})`],
    [`${cap(c.nb[0])} (${c.unit[0]})`, `${cap(c.nb[1])} (${c.unit[1]})`],
  ];
  /** a ratio-table figure; cells listed in `blank` print as empty boxes (their rows entry is just "?") */
  const tableViz = (
    /** @type {any} */ c,
    /** @type {number[][]} */ rows,
    /** @type {number[][]} */ blank = [],
  ) => {
    const [la, lb] = labelsOf(c);
    const out = {
      t: "table",
      hd: [la[0], lb[0]],
      hdEs: [la[1], lb[1]],
      rows: rows.map((r, i) =>
        r.map((v, j) => (blank.some(([bi, bj]) => bi === i && bj === j) ? "?" : v)),
      ),
    };
    if (blank.length) /** @type {any} */ (out).blank = blank;
    return out;
  };
  const dnlViz = (
    /** @type {any} */ c,
    /** @type {number[]} */ top,
    /** @type {number[]} */ bottom,
    /** @type {number} */ nullAt,
    /** @type {number} */ side,
  ) => {
    const [la, lb] = labelsOf(c);
    const t = top.slice();
    const b = bottom.slice();
    /** @type {any[]} */ (side === 0 ? t : b)[nullAt] = null;
    return {
      t: "dnl",
      top: { label: la[0], labelEs: la[1], vals: t },
      bottom: { label: lb[0], labelEs: lb[1], vals: b },
    };
  };
  /** every pair of rows is equivalent (cross-products, no division) */
  const allEquivalent = (/** @type {number[][]} */ rows) =>
    rows.every((r) => rows.every((s) => r[0] * s[1] === r[1] * s[0]));
  /** fill the blank in a figure with the typed answer and test that the whole table still holds together */
  const filledOk = (/** @type {any} */ it) => {
    const v = it.viz;
    const x = value(it.a);
    if (v.t === "table") {
      const rows = v.rows.map((/** @type {any[]} */ r) => r.slice());
      if (!v.blank || v.blank.length !== 1) return "expected exactly one blank cell";
      const [bi, bj] = v.blank[0];
      rows[bi][bj] = x;
      if (rows.some((r) => r.some((n) => typeof n !== "number")))
        return "table still has a non-number";
      return allEquivalent(rows) || `filling ${it.a} does not make every row equivalent`;
    }
    const idx = v.top.vals.concat(v.bottom.vals).findIndex((n) => n === null);
    if (idx < 0) return "number line has no blank";
    const top = v.top.vals.map((/** @type {any} */ n) => (n === null ? x : n));
    const bot = v.bottom.vals.map((/** @type {any} */ n) => (n === null ? x : n));
    return (
      allEquivalent(top.map((/** @type {number} */ n, /** @type {number} */ i) => [n, bot[i]])) ||
      `filling ${it.a} breaks the number line`
    );
  };

  const slip = {
    add: T(
      "That adds the same amount to both numbers. A ratio table multiplies both numbers by the same factor.",
      "Eso suma la misma cantidad a ambos números. Una tabla de razones multiplica ambos números por el mismo factor.",
    ),
    addFactor: T(
      "That adds the scale factor. To keep the ratio equivalent you multiply by it.",
      "Eso suma el factor de escala. Para mantener la razón equivalente se multiplica por él.",
    ),
    same: T(
      "That copies the number from the first row. Both numbers in a row must be multiplied by the same factor.",
      "Eso copia el número de la primera fila. Ambos números de una fila deben multiplicarse por el mismo factor.",
    ),
  };

  /** L1: the next rows are plain multiples; the blank sits in one of the rows (table or double number line) */
  const etNext = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 9);
    const ks = rng.pick([
      [1, 2, 3],
      [1, 2, 3, 4],
      [1, 2, 4],
    ]);
    const rows = ks.map((k) => [p * k, q * k]);
    const bi = rng.int(1, ks.length - 1);
    const bj = rng.int(0, 1);
    const k = ks[bi];
    const ans = rows[bi][bj];
    const useLine = rng.chance(0.4);
    let viz;
    if (useLine) {
      const top = [0, ...rows.map((r) => r[0])];
      const bottom = [0, ...rows.map((r) => r[1])];
      viz = dnlViz(c, top, bottom, bi + 1, bj);
    } else viz = tableViz(c, rows, [[bi, bj]]);
    const kind = useLine
      ? T("double number line", "recta numérica doble")
      : T("ratio table", "tabla de razones");
    const nm = bj === 0 ? c.na : c.nb;
    const other = bj === 0 ? q : p; // not used for display, only to word the explanation
    void other;
    return numB({
      q: T(
        "The {kind} shows equivalent amounts of {na} and {nb} for {mix}. What number goes in the blank?",
        "La {kind} muestra cantidades equivalentes de {na} y {nb} para {mix}. ¿Qué número va en el espacio vacío?",
        { kind, na: c.na, nb: c.nb, mix: c.mix },
      ),
      viz,
      a: ans,
      fw: [
        {
          v: [p, q][bj] + (rows[bi][1 - bj] - [p, q][1 - bj]),
          f: slip.add,
          tag: "ratio-scaled-additively",
        },
        {
          v: [p, q][bj] + k,
          f: slip.addFactor,
          tag: "op-added-instead-of-multiplied",
        },
        { v: [p, q][bj], f: slip.same, tag: "ratio-one-term-scaled" },
      ],
      x: T(
        "Look at the row with the blank. Its other number went from {b0} to {b1}, so the scale factor is {k}. {nm} goes from {s} to {s} × {k} = {ans}.",
        "Mira la fila con el espacio vacío. Su otro número pasó de {b0} a {b1}, así que el factor de escala es {k}. {nm} pasa de {s} a {s} × {k} = {ans}.",
        {
          b0: [p, q][1 - bj],
          b1: rows[bi][1 - bj],
          k,
          nm: [cap(nm[0]), cap(nm[1])],
          s: [p, q][bj],
          ans,
        },
      ),
      h: [
        T(
          "In a ratio table every row is the first row multiplied by the same number for both columns.",
          "En una tabla de razones, cada fila es la primera fila multiplicada por el mismo número en ambas columnas.",
        ),
        T(
          "Use the number you can see in the blank's row. What do you multiply the first row's number by to get it?",
          "Usa el número que ves en la fila del espacio vacío. ¿Por qué número multiplicas el de la primera fila para obtenerlo?",
        ),
        T(
          "Multiply the first row's number in the blank's column by that same factor.",
          "Multiplica el número de la primera fila, en la columna del espacio vacío, por ese mismo factor.",
        ),
      ],
      meta: { p, q, ks },
    });
  };
  const etFill = (/** @type {any} */ it) => {
    if (!it.viz) return "no figure";
    const r = filledOk(it);
    if (r !== true) return r;
    // the first visible row must be the recipe's own ratio
    const first =
      it.viz.t === "table" ? it.viz.rows[0] : [it.viz.top.vals[1], it.viz.bottom.vals[1]];
    return first[0] * it.meta.q === first[1] * it.meta.p || "first row is not p:q";
  };

  /** L2: the blank is a few steps away from the first row; the factor comes from the row's other number */
  const etFar = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 9);
    const [ka, kb] = rng
      .shuffle([2, 3, 4, 5, 6, 7, 8, 9])
      .slice(0, 2)
      .sort((a, b) => a - b);
    const ks = [1, ka, kb];
    const rows = ks.map((k) => [p * k, q * k]);
    const bi = rng.pick([1, 2]);
    const bj = rng.int(0, 1);
    const k = ks[bi];
    const base = [p, q];
    return numB({
      q: T(
        "The ratio table shows equivalent amounts of {na} and {nb} for {mix}. What number goes in the blank cell?",
        "La tabla de razones muestra cantidades equivalentes de {na} y {nb} para {mix}. ¿Qué número va en la celda vacía?",
        { na: c.na, nb: c.nb, mix: c.mix },
      ),
      viz: tableViz(c, rows, [[bi, bj]]),
      a: rows[bi][bj],
      fw: [
        {
          v: base[bj] + (rows[bi][1 - bj] - base[1 - bj]),
          f: slip.add,
          tag: "ratio-scaled-additively",
        },
        {
          v: base[bj] + k,
          f: slip.addFactor,
          tag: "op-added-instead-of-multiplied",
        },
        { v: base[bj], f: slip.same, tag: "ratio-one-term-scaled" },
      ],
      x: T(
        "In the blank's row the other number is {b1}, which is {b0} × {k}. The scale factor is {k}, so the blank is {s} × {k} = {ans}.",
        "En la fila del espacio vacío el otro número es {b1}, que es {b0} × {k}. El factor de escala es {k}, así que el espacio es {s} × {k} = {ans}.",
        {
          b0: base[1 - bj],
          b1: rows[bi][1 - bj],
          k,
          s: base[bj],
          ans: rows[bi][bj],
        },
      ),
      h: [
        T(
          "Both columns of a row use the same scale factor from the first row.",
          "Ambas columnas de una fila usan el mismo factor de escala de la primera fila.",
        ),
        T(
          "Find the factor in the blank's row: what times the first row's number gives the number you can see?",
          "Halla el factor en la fila del espacio vacío: ¿qué número multiplicado por el de la primera fila da el número que ves?",
        ),
        T(
          "Multiply the first row's number in the blank's column by that factor.",
          "Multiplica el número de la primera fila, en la columna del espacio vacío, por ese factor.",
        ),
      ],
      meta: { p, q, ks },
    });
  };

  /** L2: name the scale factor */
  const etFactor = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 9);
    const [ka, kb] = rng
      .shuffle([2, 3, 4, 5, 6, 7, 8, 9])
      .slice(0, 2)
      .sort((a, b) => a - b);
    const rows = [1, ka, kb].map((k) => [p * k, q * k]);
    const last = rows[2];
    return numB({
      q: T(
        "The ratio table shows equivalent amounts of {na} and {nb} for {mix}. What scale factor takes the first row to the last row?",
        "La tabla de razones muestra cantidades equivalentes de {na} y {nb} para {mix}. ¿Qué factor de escala lleva la primera fila a la última?",
        { na: c.na, nb: c.nb, mix: c.mix },
      ),
      viz: tableViz(c, rows),
      a: kb,
      fw: [
        {
          v: last[0] - p,
          f: T(
            "That subtracts. A scale factor is what you multiply by.",
            "Eso resta. Un factor de escala es el número por el que se multiplica.",
          ),
          tag: "ratio-scaled-additively",
        },
        {
          v: `${p}/${last[0]}`,
          f: T(
            "That divides the first row by the last row, the wrong way round. Ask what the first number is multiplied by.",
            "Eso divide la primera fila entre la última, al revés. Pregunta por qué número se multiplica el primero.",
          ),
          tag: "op-reversed-division",
        },
        {
          v: ka,
          f: T(
            "That is the factor for the middle row, not the last row.",
            "Ese es el factor de la fila del medio, no de la última.",
          ),
          tag: "wrong-row-factor",
        },
      ],
      x: T(
        "{p} × ? = {l0} and {q} × ? = {l1}. Both work with {k}, so the scale factor is {k}.",
        "{p} × ? = {l0} y {q} × ? = {l1}. Ambos funcionan con {k}, así que el factor de escala es {k}.",
        { p, q, l0: last[0], l1: last[1], k: kb },
      ),
      h: [
        T(
          "A scale factor is the number you multiply both numbers by.",
          "Un factor de escala es el número por el que multiplicas ambos números.",
        ),
        T(
          "Look at the first row and the last row. What times {p} gives the last row's first number?",
          "Mira la primera fila y la última. ¿Qué número multiplicado por {p} da el primer número de la última fila?",
          { p },
        ),
        T(
          "Check your factor on the other column too.",
          "Comprueba tu factor también en la otra columna.",
        ),
      ],
      meta: { p, q, rows },
    });
  };
  const etFactorCheck = (/** @type {any} */ it) => {
    const rows = it.viz.rows;
    const first = rows[0];
    const last = rows[rows.length - 1];
    const k = value(it.a);
    // substitution: the factor must rebuild both numbers of the last row
    return (
      (same(first[0] * k, last[0]) && same(first[1] * k, last[1])) ||
      "factor does not rebuild the last row"
    );
  };

  /** L3: which list could be the rows of a ratio table */
  const etWhich = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 8);
    const ks = rng.pick([
      [2, 3],
      [2, 4],
      [3, 5],
      [2, 5],
    ]);
    const list = (/** @type {number[][]} */ rows) => rows.map((r) => `${r[0]}:${r[1]}`).join(", ");
    const d = rng.int(1, 3);
    const right = [[p, q], ...ks.map((k) => [p * k, q * k])];
    const additive = [
      [p, q],
      [p + d, q + d],
      [p + 2 * d, q + 2 * d],
    ];
    const oneTerm = [[p, q], ...ks.map((k) => [p * k, q])];
    const uneven = [[p, q], ...ks.map((k) => [p * k, q * (k + 1)])];
    const inverted = [[p, q], ...ks.map((k) => [q * k, p * k])];
    const wrong = [
      {
        v: list(additive),
        tag: "ratio-scaled-additively",
        f: T(
          "Each row adds {d} to both numbers, so the ratio changes. A ratio table multiplies both numbers by the same factor.",
          "Cada fila suma {d} a ambos números, así que la razón cambia. Una tabla de razones multiplica ambos números por el mismo factor.",
          { d },
        ),
      },
      {
        v: list(oneTerm),
        tag: "ratio-one-term-scaled",
        f: T(
          "Only the first number changes. Both numbers in a row must be multiplied by the same factor.",
          "Solo cambia el primer número. Ambos números de una fila deben multiplicarse por el mismo factor.",
        ),
      },
      {
        v: list(uneven),
        tag: "ratio-one-term-scaled",
        f: T(
          "The two numbers in each row are multiplied by different factors, so the ratio changes.",
          "Los dos números de cada fila se multiplican por factores distintos, así que la razón cambia.",
        ),
      },
      {
        v: list(inverted),
        tag: "ratio-inverted",
        f: T(
          "After the first row, the order of the two amounts flips. Every row must keep {na} first and {nb} second.",
          "Después de la primera fila, el orden de las dos cantidades se invierte. Cada fila debe tener {na} primero y {nb} segundo.",
          { na: c.na, nb: c.nb },
        ),
      },
    ];
    return mcB(rng, {
      q: T(
        "A batch of {mix} uses {A} for every {B}. Which list shows rows of a ratio table for this recipe? Each pair is {na}:{nb}.",
        "Una tanda de {mix} usa {A} por cada {B}. ¿Cuál lista muestra filas de una tabla de razones para esta receta? Cada par es {na}:{nb}.",
        { mix: c.mix, A: np(c.a, p), B: np(c.b, q), na: c.na, nb: c.nb },
      ),
      right: list(right),
      wrong,
      x: T(
        "In a ratio table both numbers are multiplied by the same factor each time: {R}. The other lists add, change one number, or flip the order.",
        "En una tabla de razones ambos números se multiplican cada vez por el mismo factor: {R}. Las otras listas suman, cambian un solo número o invierten el orden.",
        { R: list(right) },
      ),
      h: [
        T(
          "Every row of a ratio table is the first row multiplied by one number.",
          "Cada fila de una tabla de razones es la primera fila multiplicada por un solo número.",
        ),
        T(
          "Check the second row of each list: did both numbers get multiplied by the same factor?",
          "Revisa la segunda fila de cada lista: ¿se multiplicaron ambos números por el mismo factor?",
        ),
        T(
          "Rule out any list where a row adds to a number or where only one number changes.",
          "Descarta cualquier lista donde una fila suma a un número o donde solo cambia un número.",
        ),
      ],
      meta: { p, q },
    });
  };
  const parseRows = (/** @type {string} */ s) => s.split(", ").map((r) => r.split(":").map(Number));
  const etWhichCheck = (/** @type {any} */ it) =>
    pickOne(it, (txt) => {
      const rows = parseRows(txt);
      return rows[0][0] === it.meta.p && rows[0][1] === it.meta.q && allEquivalent(rows);
    });

  /** L3: find the row with a mistake */
  const etErrorRow = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 9);
    const ks = rng
      .shuffle([1, 2, 3, 4, 5, 6, 7, 8])
      .slice(0, 4)
      .sort((a, b) => a - b);
    const rows = ks.map((k) => [p * k, q * k]);
    const e = rng.int(0, 3);
    const col = rng.int(0, 1);
    const shift = rng.pick([-2, -1, 1, 2]);
    const bad = rows.map((r) => r.slice());
    bad[e][col] += shift;
    if (bad[e][col] <= 0) redo();
    const word = (/** @type {number} */ i) => [`Row ${i + 1}`, `Fila ${i + 1}`];
    const fixed = rows[e];
    return mcB(rng, {
      q: T(
        "The ratio table is for {mix}. One row has a mistake. Which row is it?",
        "La tabla de razones es para {mix}. Una fila tiene un error. ¿Cuál fila es?",
        { mix: c.mix },
      ),
      viz: tableViz(c, bad),
      right: { v: word(e)[0], vEs: word(e)[1] },
      wrong: [0, 1, 2, 3]
        .filter((i) => i !== e)
        .map((i) => ({
          v: word(i)[0],
          vEs: word(i)[1],
          f: T(
            "Row {n} shows {a}:{b}. It matches the pattern of the other rows, so it is not the mistake.",
            "La fila {n} muestra {a}:{b}. Coincide con el patrón de las otras filas, así que no es el error.",
            { n: i + 1, a: bad[i][0], b: bad[i][1] },
          ),
          tag: "ratio-not-checked",
        })),
      x: T(
        "Three rows are equivalent to {p}:{q}. Row {n} shows {a}:{b}, but it should be {fa}:{fb}.",
        "Tres filas son equivalentes a {p}:{q}. La fila {n} muestra {a}:{b}, pero debería ser {fa}:{fb}.",
        {
          p,
          q,
          n: e + 1,
          a: bad[e][0],
          b: bad[e][1],
          fa: fixed[0],
          fb: fixed[1],
        },
      ),
      h: [
        T(
          "Every row of a ratio table should be equivalent to every other row.",
          "Cada fila de una tabla de razones debe ser equivalente a todas las demás.",
        ),
        T(
          "Simplify or compare the rows. Three of them will match each other.",
          "Simplifica o compara las filas. Tres de ellas coincidirán entre sí.",
        ),
        T(
          "Look for the row whose two numbers do not use the same scale factor.",
          "Busca la fila cuyos dos números no usan el mismo factor de escala.",
        ),
      ],
      meta: { p, q, ks, e },
    });
  };
  const etErrorRowCheck = (/** @type {any} */ it) => {
    const rows = it.viz.rows;
    // the odd row is the only one with no equivalent partner
    const partners = rows.map(
      (/** @type {number[]} */ r, /** @type {number} */ i) =>
        rows.filter(
          (/** @type {number[]} */ s, /** @type {number} */ j) =>
            j !== i && r[0] * s[1] === r[1] * s[0],
        ).length,
    );
    const odd = partners.findIndex((/** @type {number} */ n) => n === 0);
    if (odd < 0 || partners.filter((/** @type {number} */ n) => n === 0).length !== 1)
      return "no single odd row";
    return pickOne(it, (txt) => Number(txt.replace(/\D/g, "")) === odd + 1);
  };

  /** L4: the blank is in a row smaller than the visible ones (scale down) */
  const etReverse = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 8);
    const ks = rng
      .shuffle([2, 3, 4, 5, 6, 7, 8, 9])
      .slice(0, 3)
      .sort((a, b) => b - a); // big to small
    const rows = ks.map((k) => [p * k, q * k]);
    const bi = 2;
    const bj = rng.int(0, 1);
    const ans = rows[bi][bj];
    const vis = rows[0];
    return numB({
      q: T(
        "The ratio table for {mix} is written from the biggest batch down to the smallest. What number goes in the blank cell?",
        "La tabla de razones para {mix} está escrita del lote más grande al más pequeño. ¿Qué número va en la celda vacía?",
        { mix: c.mix },
      ),
      viz: tableViz(c, rows, [[bi, bj]]),
      a: ans,
      fw: [
        {
          v: rows[bi][1 - bj] - (rows[0][1 - bj] - rows[0][bj]),
          f: slip.add,
          tag: "ratio-scaled-additively",
        },
        {
          v: rows[bi][1 - bj],
          f: T(
            "That repeats the number from the same row. The blank is in the other column and has a different value.",
            "Eso repite el número de la misma fila. El espacio está en la otra columna y tiene un valor distinto.",
          ),
          tag: "ratio-inverted",
        },
      ],
      x: T(
        "Going down, the numbers get smaller, so divide. In the blank's row the other number is {o}, down from {vo} in the first row. Whatever happened to {vo} happens to {vv} too, so the blank is {ans}.",
        "Hacia abajo los números son menores, así que se divide. En la fila del espacio el otro número es {o}, menor que {vo} en la primera fila. Lo que le pasó a {vo} le pasa también a {vv}, así que el espacio es {ans}.",
        { o: rows[bi][1 - bj], vo: vis[1 - bj], vv: vis[bj], ans },
      ),
      h: [
        T(
          "The table goes from big batches to small batches, so the scale factor makes numbers smaller.",
          "La tabla va de lotes grandes a lotes pequeños, así que el factor de escala hace los números menores.",
        ),
        T(
          "Compare the first row with the blank's row using the number you can see in the blank's row. By what do you divide?",
          "Compara la primera fila con la fila del espacio usando el número que ves en esa fila. ¿Entre qué número divides?",
        ),
        T(
          "Divide the first row's number in the blank's column by that same number.",
          "Divide el número de la primera fila, en la columna del espacio, entre ese mismo número.",
        ),
      ],
      meta: { p, q, ks },
    });
  };

  /** L4: five rows that look additive, but the blank is far down the table */
  const etTrap = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 7);
    const far = rng.int(8, 12);
    const rows = [1, 2, 3, 4, far].map((k) => [p * k, q * k]);
    const bj = rng.int(0, 1);
    const base = [p, q];
    const bi = 4;
    return numB({
      q: T(
        "The ratio table for {mix} has been started. What number goes in the blank cell?",
        "La tabla de razones para {mix} se empezó a llenar. ¿Qué número va en la celda vacía?",
        { mix: c.mix },
      ),
      viz: tableViz(c, rows, [[bi, bj]]),
      a: rows[bi][bj],
      fw: [
        {
          v: base[bj] + (rows[bi][1 - bj] - base[1 - bj]),
          f: slip.add,
          tag: "ratio-scaled-additively",
        },
        {
          v: rows[3][bj] + base[bj],
          f: T(
            "That keeps adding the first row's number as if the pattern continued one more step. The blank is much further down, so use the scale factor.",
            "Eso sigue sumando el número de la primera fila como si el patrón continuara un paso más. El espacio está mucho más abajo, así que usa el factor de escala.",
          ),
          tag: "ratio-scaled-additively",
        },
        {
          v: base[bj] * (rows[bi][1 - bj] > base[1 - bj] ? 2 : 1),
          f: slip.same,
          tag: "ratio-one-term-scaled",
        },
      ],
      x: T(
        "The rows grow by {p} and {q} at first, but the last row jumps. Its other number is {o} = {b} × {k}, so the scale factor is {k} and the blank is {s} × {k} = {ans}.",
        "Las filas crecen primero de {p} en {p} y de {q} en {q}, pero la última fila salta. Su otro número es {o} = {b} × {k}, así que el factor de escala es {k} y el espacio es {s} × {k} = {ans}.",
        {
          p,
          q,
          o: rows[bi][1 - bj],
          b: base[1 - bj],
          k: far,
          s: base[bj],
          ans: rows[bi][bj],
        },
      ),
      h: [
        T(
          "The first rows go up by the same amount, but that pattern will not help for a row far down the table.",
          "Las primeras filas suben la misma cantidad, pero ese patrón no sirve para una fila muy abajo en la tabla.",
        ),
        T(
          "Use the number you can see in the blank's row to find the scale factor from the first row.",
          "Usa el número que ves en la fila del espacio para hallar el factor de escala desde la primera fila.",
        ),
        T(
          "Multiply the first row's number in the blank's column by that factor.",
          "Multiplica el número de la primera fila, en la columna del espacio, por ese factor.",
        ),
      ],
      meta: { p, q, far },
    });
  };

  /** L4: two blanks in different rows */
  const etTwoBlanks = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 8);
    const [k2, k3] = rng.shuffle([2, 3, 4, 5, 6, 7]).slice(0, 2);
    const rows = [
      [p, q],
      [p * k2, q * k2],
      [p * k3, q * k3],
    ];
    const A = rows[1][0];
    const B = rows[2][1];
    const pair = (/** @type {number} */ x, /** @type {number} */ y) => `${x} and ${y}`;
    const pairEs = (/** @type {number} */ x, /** @type {number} */ y) => `${x} y ${y}`;
    const C = (
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {any} */ f,
      /** @type {string} */ tag,
    ) => ({ v: pair(x, y), vEs: pairEs(x, y), f, tag });
    return mcB(rng, {
      q: T(
        "The ratio table for {mix} has two blank cells. Which numbers fill them, in order from the top?",
        "La tabla de razones para {mix} tiene dos celdas vacías. ¿Qué números las llenan, de arriba hacia abajo?",
        { mix: c.mix },
      ),
      viz: tableViz(c, rows, [
        [1, 0],
        [2, 1],
      ]),
      right: { v: pair(A, B), vEs: pairEs(A, B) },
      wrong: [
        C(p + (rows[1][1] - q), q + (rows[2][0] - p), slip.add, "ratio-scaled-additively"),
        C(
          B,
          A,
          T(
            "Those are in the wrong order. The first blank is in the top row of the two and in the first column.",
            "Esos están en el orden equivocado. El primer espacio está en la fila de arriba y en la primera columna.",
          ),
          "ratio-inverted",
        ),
        C(
          A,
          q * k2,
          T(
            "The second blank uses the factor from the middle row. Each row has its own scale factor.",
            "El segundo espacio usa el factor de la fila del medio. Cada fila tiene su propio factor de escala.",
          ),
          "wrong-row-factor",
        ),
        C(
          p * k3,
          B,
          T(
            "The first blank uses the factor from the last row. Each row has its own scale factor.",
            "El primer espacio usa el factor de la última fila. Cada fila tiene su propio factor de escala.",
          ),
          "wrong-row-factor",
        ),
      ],
      x: T(
        "Row 2: {q2} = {q} × {k2}, so the first blank is {p} × {k2} = {A}. Row 3: {p3} = {p} × {k3}, so the second blank is {q} × {k3} = {B}.",
        "Fila 2: {q2} = {q} × {k2}, así que el primer espacio es {p} × {k2} = {A}. Fila 3: {p3} = {p} × {k3}, así que el segundo espacio es {q} × {k3} = {B}.",
        { q2: rows[1][1], q, k2, p, A, p3: rows[2][0], k3, B },
      ),
      h: [
        T(
          "Each row has its own scale factor from the first row. Work on one blank at a time.",
          "Cada fila tiene su propio factor de escala desde la primera fila. Trabaja con un espacio a la vez.",
        ),
        T(
          "For each blank, use the number you can see in the same row to find that row's factor.",
          "Para cada espacio, usa el número que ves en la misma fila para hallar el factor de esa fila.",
        ),
        T(
          "Multiply the first row's number in the blank's column by that row's factor.",
          "Multiplica el número de la primera fila, en la columna del espacio, por el factor de esa fila.",
        ),
      ],
      meta: { p, q, k2, k3 },
    });
  };
  const etTwoBlanksCheck = (/** @type {any} */ it) => {
    const v = it.viz;
    return pickOne(it, (txt) => {
      const m = txt.match(/^(\d+) and (\d+)$/);
      if (!m) return false;
      const rows = v.rows.map((/** @type {any[]} */ r) => r.slice());
      rows[1][0] = Number(m[1]);
      rows[2][1] = Number(m[2]);
      return (
        rows.every((/** @type {any[]} */ r) => r.every((n) => typeof n === "number")) &&
        allEquivalent(rows)
      );
    });
  };

  suite("eqRatioTable", "Complete ratio tables", "Completar tablas de razones", {
    1: [form("next", etNext, etFill)],
    2: [form("far", etFar, etFill), form("factor", etFactor, etFactorCheck)],
    3: [form("which", etWhich, etWhichCheck), form("errorRow", etErrorRow, etErrorRowCheck)],
    4: [
      form("reverse", etReverse, etFill),
      form("trap", etTrap, etFill),
      form("twoBlanks", etTwoBlanks, etTwoBlanksCheck),
    ],
  });

  /* ===================================================================================================
   * ratioGraphRead (3-4): first-quadrant graphs, x = first quantity, y = second quantity
   * =================================================================================================== */
  const coordViz = (
    /** @type {any} */ c,
    /** @type {any[]} */ pts,
    /** @type {any} */ extra = {},
  ) => {
    const [la, lb] = labelsOf(c);
    return {
      t: "coord",
      xmin: 0,
      ymin: 0,
      xmax: Math.max(...pts.map((p) => p.x)) + 1,
      ymax: Math.max(...pts.map((p) => p.y)) + 2,
      points: pts,
      xlabel: la[0],
      xlabelEs: la[1],
      ylabel: lb[0],
      ylabelEs: lb[1],
      ...extra,
    };
  };
  const axes = (/** @type {any} */ c) =>
    T("x = {na} and y = {nb}", "x = {na} y y = {nb}", { na: c.na, nb: c.nb });
  const ptTxt = (/** @type {number} */ x, /** @type {number} */ y) => `(${x}, ${y})`;
  const hGraph = [
    T(
      "Each point is an ordered pair: the x-value is across, the y-value is up.",
      "Cada punto es un par ordenado: el valor x va a lo ancho y el valor y va hacia arriba.",
    ),
  ];

  /** L1: read the ordered pair of a point */
  const grPair = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const m = rng.int(2, 4);
    const xs = rng
      .shuffle([1, 2, 3, 4, 5])
      .slice(0, 3)
      .sort((a, b) => a - b);
    const names = ["A", "B", "C"];
    const pts = xs.map((x, i) => ({ x, y: m * x, l: names[i] }));
    const t = rng.int(0, 2);
    const { x, y } = pts[t];
    const f = (/** @type {any} */ a, /** @type {string} */ tag) => ({
      v: a[0],
      f: a[1],
      tag,
    });
    return mcB(rng, {
      q: T(
        "The graph shows {axes}. Which ordered pair names point {n}?",
        "La gráfica muestra {axes}. ¿Qué par ordenado nombra el punto {n}?",
        { axes: axes(c), n: names[t] },
      ),
      viz: coordViz(c, pts),
      right: ptTxt(x, y),
      wrong: [
        f(
          [
            ptTxt(y, x),
            T(
              "The numbers are swapped. The x-value (across) comes first.",
              "Los números están intercambiados. El valor x (a lo ancho) va primero.",
            ),
          ],
          "coord-xy-swapped",
        ),
        f(
          [
            ptTxt(x, y + 1),
            T(
              "The y-value is one off. Count up from 0 to the point carefully.",
              "El valor y está desfasado en uno. Cuenta con cuidado hacia arriba desde 0 hasta el punto.",
            ),
          ],
          "coord-read-slip",
        ),
        f(
          [
            ptTxt(x + 1, y),
            T(
              "The x-value is one off. Count across from 0 to the point carefully.",
              "El valor x está desfasado en uno. Cuenta con cuidado a lo ancho desde 0 hasta el punto.",
            ),
          ],
          "coord-read-slip",
        ),
      ],
      x: T(
        "Point {n} is {x} across and {y} up, so it is {pt}.",
        "El punto {n} está {x} a lo ancho y {y} hacia arriba, así que es {pt}.",
        { n: names[t], x, y, pt: ptTxt(x, y) },
      ),
      h: [
        ...hGraph,
        T(
          "Go straight down from the point to the x-axis to read the x-value.",
          "Baja en línea recta desde el punto hasta el eje x para leer el valor x.",
        ),
        T(
          "Go straight across to the y-axis to read the y-value. Write x first.",
          "Ve en línea recta hasta el eje y para leer el valor y. Escribe x primero.",
        ),
      ],
      meta: { t },
    });
  };
  const grPairCheck = (/** @type {any} */ it) => {
    const p = it.viz.points["ABC".indexOf(it.q.match(/point (\w)/)[1])];
    return pickOne(it, (txt) => txt === ptTxt(p.x, p.y));
  };

  /** L1: the point (1, r) is the unit rate */
  const grUnitPoint = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const m = rng.int(2, 6);
    const pts = [
      { x: 1, y: m, l: "P" },
      { x: 2, y: 2 * m, l: "Q" },
      { x: 3, y: 3 * m, l: "R" },
    ];
    return numB({
      q: T(
        "The graph shows {axes}. Point P is at x = 1. How many {unit} of {nb} go with 1 {unit1} of {na}?",
        "La gráfica muestra {axes}. El punto P está en x = 1. ¿Cuántas {unit} de {nb} van con 1 {unit1} de {na}?",
        {
          axes: axes(c),
          nb: c.nb,
          na: c.na,
          unit: c.unit,
          unit1: [c.unit[0].replace(/s$/, ""), c.unit[1].replace(/s$/, "")],
        },
      ),
      viz: coordViz(c, pts),
      a: m,
      fw: [
        {
          v: 1,
          f: T(
            "1 is the x-value. The question asks for the y-value of point P.",
            "1 es el valor x. La pregunta pide el valor y del punto P.",
          ),
          tag: "coord-xy-swapped",
        },
        {
          v: 2 * m,
          f: T(
            "That is the y-value of point Q, which is at x = 2.",
            "Ese es el valor y del punto Q, que está en x = 2.",
          ),
          tag: "coord-read-slip",
        },
      ],
      x: T(
        "Point P is (1, {m}). The y-value at x = 1 is the unit rate: {m} for every 1.",
        "El punto P es (1, {m}). El valor y en x = 1 es la tasa unitaria: {m} por cada 1.",
        { m },
      ),
      h: [
        T(
          "The point where x is 1 shows the amount for exactly one.",
          "El punto donde x es 1 muestra la cantidad para exactamente uno.",
        ),
        T(
          "Find point P on the graph and read how high it is.",
          "Encuentra el punto P en la gráfica y lee qué tan alto está.",
        ),
      ],
      meta: { m },
    });
  };
  const grUnitPointCheck = (/** @type {any} */ it) => {
    const p = it.viz.points.find((/** @type {any} */ q) => q.x === 1);
    return same(value(it.a), p.y) || "unit point y differs";
  };

  /** L2: which two points show the same ratio */
  const grSame = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const m = rng.int(2, 4);
    const [a, b] = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 2);
    const d = rng.int(1, 3);
    const xc = a + d;
    const A = { x: a, y: m * a };
    const B = { x: b, y: m * b };
    const C = { x: xc, y: m * a + d }; // same y - x as A, different ratio
    if ([A, B].some((p) => p.x === C.x) || C.y === B.y) redo();
    const roles = rng.shuffle([A, B, C]);
    const pts = roles.map((p, i) => ({ ...p, l: "ABC"[i] }));
    const name = (/** @type {any} */ p) => pts.find((q) => q.x === p.x && q.y === p.y).l;
    const pair = (/** @type {any} */ p, /** @type {any} */ q) =>
      [name(p), name(q)].sort().join(" and ");
    const [pAB, pAC, pBC] = [pair(A, B), pair(A, C), pair(B, C)];
    return mcB(rng, {
      q: T(
        "The graph shows {axes}. Which two points show equivalent ratios?",
        "La gráfica muestra {axes}. ¿Cuáles dos puntos muestran razones equivalentes?",
        { axes: axes(c) },
      ),
      viz: coordViz(c, pts),
      right: { v: pAB, vEs: pAB.replace(" and ", " y ") },
      wrong: [
        {
          v: pAC,
          vEs: pAC.replace(" and ", " y "),
          tag: "ratio-scaled-additively",
          f: T(
            "Those two points have the same difference between y and x, but their ratios of y to x are not equal.",
            "Esos dos puntos tienen la misma diferencia entre y y x, pero sus razones de y a x no son iguales.",
          ),
        },
        {
          v: pBC,
          vEs: pBC.replace(" and ", " y "),
          tag: "ratio-compared-without-common-basis",
          f: T(
            "Those two points have the same y-value, but equal ratios need y ÷ x to match.",
            "Esos dos puntos tienen el mismo valor y, pero las razones iguales necesitan que y ÷ x coincida.",
          ),
        },
        {
          v: "None of the pairs",
          vEs: "Ninguna de las parejas",
          tag: "ratio-not-checked",
          f: T(
            "Check y ÷ x for each point. Two of them match.",
            "Revisa y ÷ x en cada punto. Dos de ellos coinciden.",
          ),
        },
      ],
      x: T(
        "y ÷ x is {m} for {a1} and {a2}, but it is different for the third point. Equal ratios need the same y ÷ x.",
        "y ÷ x es {m} para {a1} y {a2}, pero es distinto para el tercer punto. Las razones iguales necesitan el mismo y ÷ x.",
        { m, a1: name(A), a2: name(B) },
      ),
      h: [
        ...hGraph,
        T(
          "Equivalent ratios have the same y compared with x. Read each point's pair.",
          "Las razones equivalentes tienen la misma relación de y con x. Lee el par de cada punto.",
        ),
        T(
          "For each point work out how many y there are for each 1 x.",
          "En cada punto calcula cuántos y hay por cada 1 de x.",
        ),
      ],
      meta: {},
    });
  };
  const grSameCheck = (/** @type {any} */ it) => {
    const P = it.viz.points;
    const eq = (/** @type {any} */ p, /** @type {any} */ q) => p.y * q.x === q.y * p.x;
    return pickOne(it, (txt) => {
      const m = txt.match(/^(\w) and (\w)$/);
      if (!m) return false;
      const p = P.find((/** @type {any} */ q) => q.l === m[1]);
      const q = P.find((/** @type {any} */ r) => r.l === m[2]);
      return eq(p, q);
    });
  };

  /** L2: unit rate from a point on a line */
  const grUnitFrom = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const m = rng.pick([1.5, 2, 2.5, 3, 3.5, 4, 5]);
    const x = m % 1 ? rng.pick([2, 4, 6, 8]) : rng.int(2, 8);
    const y = m * x;
    const pts = [{ x, y, l: "P" }];
    return numB({
      q: T(
        "The line on the graph shows {axes}. Point P is on the line. How many {nb} go with 1 {na}?",
        "La recta de la gráfica muestra {axes}. El punto P está en la recta. ¿Cuántas unidades de {nb} van con 1 unidad de {na}?",
        { axes: axes(c), na: c.na, nb: c.nb },
      ),
      viz: coordViz(c, pts, { line: { m, b: 0 } }),
      a: m,
      fw: [
        {
          v: y,
          f: T(
            "That is the y-value of P. It goes with {x} units of x, not with 1.",
            "Ese es el valor y de P. Va con {x} unidades de x, no con 1.",
            { x },
          ),
          tag: "rate-not-per-one",
        },
        {
          v: `${x}/${y}`,
          f: T(
            "That divides x by y, the wrong way round. The question asks for y for each 1 of x.",
            "Eso divide x entre y, al revés. La pregunta pide y por cada 1 de x.",
          ),
          tag: "op-reversed-division",
        },
      ],
      x: T(
        "P is ({x}, {y}). Divide y by x: {y} ÷ {x} = {m}. The line passes through (1, {m}).",
        "P es ({x}, {y}). Divide y entre x: {y} ÷ {x} = {m}. La recta pasa por (1, {m}).",
        { x, y, m },
      ),
      h: [
        T(
          "The unit rate is the y-value when x is 1.",
          "La tasa unitaria es el valor y cuando x es 1.",
        ),
        T(
          "Read the pair for P. Split its y-value into x equal parts.",
          "Lee el par de P. Reparte su valor y en x partes iguales.",
        ),
        T("Divide the y-value of P by its x-value.", "Divide el valor y de P entre su valor x."),
      ],
      meta: { m },
    });
  };
  const grUnitFromCheck = (/** @type {any} */ it) => {
    const p = it.viz.points[0];
    return same(value(it.a) * p.x, p.y) || "rate x x does not rebuild y";
  };

  /** L3: the point that breaks the pattern */
  const grOdd = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const m = rng.int(2, 4);
    const xs = rng
      .shuffle([1, 2, 3, 4, 5, 6])
      .slice(0, 4)
      .sort((a, b) => a - b);
    const odd = rng.int(0, 3);
    const pts = xs.map((x, i) => ({
      x,
      y: m * x + (i === odd ? rng.pick([-1, 1]) : 0),
      l: "ABCD"[i],
    }));
    if (pts[odd].y <= 0) redo();
    return mcB(rng, {
      q: T(
        "The graph shows {axes}. Three points show the same ratio. Which point does not?",
        "La gráfica muestra {axes}. Tres puntos muestran la misma razón. ¿Cuál punto no la muestra?",
        { axes: axes(c) },
      ),
      viz: coordViz(c, pts),
      right: pts[odd].l,
      wrong: pts
        .filter((_, i) => i !== odd)
        .map((p) => ({
          v: p.l,
          tag: "ratio-not-checked",
          f: T(
            "Point {n} has {y} ÷ {x} = {m}, the same as the other matching points.",
            "El punto {n} tiene {y} ÷ {x} = {m}, igual que los otros puntos que coinciden.",
            { n: p.l, x: p.x, y: p.y, m },
          ),
        })),
      x: T(
        "Points other than {n} all have y ÷ x = {m}. Point {n} is ({x}, {y}), so its ratio is different.",
        "Los puntos distintos de {n} tienen y ÷ x = {m}. El punto {n} es ({x}, {y}), así que su razón es distinta.",
        { n: pts[odd].l, m, x: pts[odd].x, y: pts[odd].y },
      ),
      h: [
        ...hGraph,
        T(
          "Equal ratios have the same y ÷ x. Work out y ÷ x for each point.",
          "Las razones iguales tienen el mismo y ÷ x. Calcula y ÷ x en cada punto.",
        ),
        T(
          "Three of the answers match. Pick the point whose answer does not.",
          "Tres de las respuestas coinciden. Elige el punto cuya respuesta no coincide.",
        ),
      ],
      meta: {},
    });
  };
  const grOddCheck = (/** @type {any} */ it) => {
    const P = it.viz.points;
    const partners = P.map(
      (/** @type {any} */ p) =>
        P.filter((/** @type {any} */ q) => q !== p && p.y * q.x === q.y * p.x).length,
    );
    const idx = partners.findIndex((/** @type {number} */ n) => n === 0);
    if (partners.filter((/** @type {number} */ n) => n === 0).length !== 1)
      return "no single odd point";
    return pickOne(it, (txt) => txt === P[idx].l);
  };

  /** L3: straight line or equal ratios? */
  const grVerdict = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const prop = rng.chance(0.5);
    const m = rng.int(2, 3);
    const off = rng.int(1, 3);
    const xs = rng
      .shuffle([1, 2, 3, 4, 5])
      .slice(0, 4)
      .sort((a, b) => a - b);
    const pts = xs.map((x, i) => ({
      x,
      y: prop ? m * x : x + off + (m - 1) * 0 + 0 * i,
      l: "ABCD"[i],
    }));
    if (!prop && pts.some((p) => p.y === 0)) redo();
    const S1 = T(
      "Yes. Every point has the same ratio of y to x.",
      "Sí. Todos los puntos tienen la misma razón de y a x.",
    );
    const S2 = T(
      "No. The ratio of y to x is different for different points.",
      "No. La razón de y a x es distinta en distintos puntos.",
    );
    const S3 = T("Yes. The points make a straight line.", "Sí. Los puntos forman una línea recta.");
    const S4 = T("No. The points do not include (0, 0).", "No. Los puntos no incluyen (0, 0).");
    const S5 = T(
      "No. The points do not make a straight line.",
      "No. Los puntos no forman una línea recta.",
    );
    const S6 = T(
      "No. The y-value is not the same for every point.",
      "No. El valor y no es el mismo en todos los puntos.",
    );
    const o = (/** @type {any} */ s, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: s[0],
      vEs: s[1],
      f,
      tag,
    });
    const fCheck = T(
      "Check y ÷ x for each point before you decide.",
      "Revisa y ÷ x en cada punto antes de decidir.",
    );
    return mcB(rng, {
      q: T(
        "The graph shows {axes}. Do the points show equivalent ratios?",
        "La gráfica muestra {axes}. ¿Los puntos muestran razones equivalentes?",
        { axes: axes(c) },
      ),
      viz: coordViz(c, pts),
      right: prop ? { v: S1[0], vEs: S1[1] } : { v: S2[0], vEs: S2[1] },
      wrong: prop
        ? [
            o(S2, fCheck, "ratio-not-checked"),
            o(
              S4,
              T(
                "The given points do not have to include (0, 0). The question is whether y ÷ x is the same.",
                "Los puntos dados no tienen que incluir (0, 0). La pregunta es si y ÷ x es igual.",
              ),
              "origin-misread",
            ),
            o(
              S6,
              T(
                "Equal ratios do not need equal y-values. They need y ÷ x to match.",
                "Las razones iguales no necesitan valores y iguales. Necesitan que y ÷ x coincida.",
              ),
              "ratio-compared-without-common-basis",
            ),
          ]
        : [
            o(
              S3,
              T(
                "A straight line is not enough. For equal ratios the line must also pass through (0, 0).",
                "Una línea recta no basta. Para razones iguales la recta debe pasar también por (0, 0).",
              ),
              "straight-line-only",
            ),
            o(S1, fCheck, "ratio-not-checked"),
            o(
              S5,
              T(
                "These points do make a straight line. Check y ÷ x instead.",
                "Estos puntos sí forman una línea recta. Revisa y ÷ x.",
              ),
              "ratio-not-checked",
            ),
          ],
      x: prop
        ? T(
            "y ÷ x is {m} for every point, so the ratios are equivalent.",
            "y ÷ x es {m} en todos los puntos, así que las razones son equivalentes.",
            { m },
          )
        : T(
            "The points rise in a straight line, but y ÷ x changes ({r1} then {r2}), so the ratios are not equivalent.",
            "Los puntos suben en línea recta, pero y ÷ x cambia ({r1} y luego {r2}), así que las razones no son equivalentes.",
            { r1: `${pts[0].y}/${pts[0].x}`, r2: `${pts[1].y}/${pts[1].x}` },
          ),
      h: [
        T(
          "Equivalent ratios need y ÷ x to be the same for every point.",
          "Las razones equivalentes necesitan que y ÷ x sea igual en todos los puntos.",
        ),
        T(
          "Read each point's pair and work out y ÷ x.",
          "Lee el par de cada punto y calcula y ÷ x.",
        ),
        T(
          "Do all the answers match? Then decide.",
          "¿Coinciden todas las respuestas? Entonces decide.",
        ),
      ],
      meta: {},
    });
  };
  const grVerdictCheck = (/** @type {any} */ it) => {
    const P = it.viz.points;
    const prop = P.every((/** @type {any} */ p) => p.y * P[0].x === P[0].y * p.x);
    return pickOne(it, (txt) =>
      prop ? txt.startsWith("Yes. Every") : txt.startsWith("No. The ratio of y to x"),
    );
  };

  /** L4: which of two lines is steeper (faster)? */
  const grSteeper = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const xa = rng.int(2, 6);
    const xb = rng.int(2, 6);
    const ma = rng.int(2, 5);
    const mb = rng.int(2, 5);
    const ya = ma * xa;
    const yb = mb * xb;
    if (ma === mb || xa === xb || ya === yb) redo();
    const fast = ma > mb ? "A" : "B";
    const taller = ya > yb ? "A" : "B";
    if (taller === fast) redo(); // the higher end point is the slower one
    const pts = [
      { x: 0, y: 0, l: "" },
      { x: xa, y: ya, l: "A" },
      { x: xb, y: yb, l: "B" },
    ];
    const nm = (/** @type {string} */ k) => [`Recipe ${k}`, `Receta ${k}`];
    const slow = fast === "A" ? "B" : "A";
    const o = (/** @type {string} */ k, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: nm(k)[0],
      vEs: nm(k)[1],
      f,
      tag,
    });
    return mcB(rng, {
      q: T(
        "The graph shows two recipes for {mix} ({axes}). Which recipe uses more {nb} for each 1 of {na}?",
        "La gráfica muestra dos recetas de {mix} ({axes}). ¿Cuál receta usa más {nb} por cada 1 de {na}?",
        { mix: c.mix, axes: axes(c), na: c.na, nb: c.nb },
      ),
      viz: coordViz(
        c,
        pts.map((p) => (p.l ? p : { x: 0, y: 0 })),
        {
          segments: [
            [0, 1],
            [0, 2],
          ],
        },
      ),
      right: { v: nm(fast)[0], vEs: nm(fast)[1] },
      wrong: [
        o(
          slow,
          T(
            "Recipe {k} ends higher up, but it also goes farther across. Compare y for each 1 of x, not the end heights.",
            "La receta {k} termina más arriba, pero también llega más lejos a lo ancho. Compara y por cada 1 de x, no las alturas finales.",
            { k: slow },
          ),
          "ratio-compared-without-common-basis",
        ),
        {
          v: "They use the same amount",
          vEs: "Usan la misma cantidad",
          tag: "ratio-not-checked",
          f: T(
            "Work out y ÷ x for each end point. They are not equal.",
            "Calcula y ÷ x en cada punto final. No son iguales.",
          ),
        },
        {
          v: "Not enough information",
          vEs: "No hay suficiente información",
          tag: "ratio-not-checked",
          f: T(
            "Each line has a point you can read, and the line starts at (0, 0). That is enough.",
            "Cada recta tiene un punto que puedes leer y empieza en (0, 0). Eso basta.",
          ),
        },
      ],
      x: T(
        "Recipe A: y ÷ x = {ra}. Recipe B: y ÷ x = {rb}. The steeper line, Recipe {k}, uses more {nb} for each 1 of {na}.",
        "Receta A: y ÷ x = {ra}. Receta B: y ÷ x = {rb}. La recta más inclinada, la receta {k}, usa más {nb} por cada 1 de {na}.",
        { ra: ma, rb: mb, k: fast, na: c.na, nb: c.nb },
      ),
      h: [
        T(
          "Each line starts at (0, 0). Compare how much y goes with 1 of x.",
          "Cada recta empieza en (0, 0). Compara cuánto y va con 1 de x.",
        ),
        T(
          "For each labeled end point, divide y by x.",
          "En cada punto final con letra, divide y entre x.",
        ),
        T(
          "The recipe with the bigger answer is the steeper line.",
          "La receta con la respuesta mayor es la recta más inclinada.",
        ),
      ],
      meta: { fast },
    });
  };
  const grSteeperCheck = (/** @type {any} */ it) => {
    const [, A, B] = it.viz.points;
    const winner = A.y * B.x > B.y * A.x ? "A" : "B"; // cross-products, no division
    return pickOne(it, (txt) => txt === `Recipe ${winner}`);
  };

  /** L4: which recipe fits the graph */
  const grFits = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [p, q] = coprimePair(rng, 2, 6);
    const ks = [1, 2, 3];
    const pts = ks.map((k, i) => ({ x: p * k, y: q * k, l: "ABC"[i] }));
    const say = (/** @type {number} */ a, /** @type {number} */ b) =>
      T("{B} for every {A}", "{B} por cada {A}", {
        A: np(c.a, a),
        B: np(c.b, b),
      });
    const ch = (/** @type {any} */ s, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: s[0],
      vEs: s[1],
      f,
      tag,
    });
    const right = say(p, q);
    return mcB(rng, {
      q: T(
        "The graph shows {axes} for {mix}. Which recipe matches the graph?",
        "La gráfica muestra {axes} para {mix}. ¿Cuál receta coincide con la gráfica?",
        { axes: axes(c), mix: c.mix },
      ),
      viz: coordViz(c, pts, { line: { m: q / p, b: 0 } }),
      right: { v: right[0], vEs: right[1] },
      wrong: [
        ch(
          say(q, p),
          T(
            "The amounts are swapped. y (up) is {nb} and x (across) is {na}.",
            "Las cantidades están intercambiadas. y (arriba) es {nb} y x (a lo ancho) es {na}.",
            { na: c.na, nb: c.nb },
          ),
          "ratio-inverted",
        ),
        ch(
          say(p, q + 1),
          T(
            "That ratio is close, but it is not the same. Check a point on the graph.",
            "Esa razón se parece, pero no es la misma. Revisa un punto de la gráfica.",
          ),
          "ratio-not-checked",
        ),
        ch(
          say(p + 1, q),
          T(
            "That ratio is close, but it is not the same. Check a point on the graph.",
            "Esa razón se parece, pero no es la misma. Revisa un punto de la gráfica.",
          ),
          "ratio-not-checked",
        ),
      ],
      x: T(
        "Every point has y ÷ x = {q}/{p}, which means {q} of {nb} for every {p} of {na}.",
        "Todos los puntos tienen y ÷ x = {q}/{p}, es decir, {q} de {nb} por cada {p} de {na}.",
        { p, q, na: c.na, nb: c.nb },
      ),
      h: [
        ...hGraph,
        T(
          "Read one point and write a ratio of y to x.",
          "Lee un punto y escribe una razón de y a x.",
        ),
        T(
          "Check that the other points give an equivalent ratio, then match it to a recipe.",
          "Comprueba que los otros puntos dan una razón equivalente y luego únela con una receta.",
        ),
      ],
      meta: { p, q },
    });
  };
  const grFitsCheck = (/** @type {any} */ it) => {
    const [P] = it.viz.points;
    return pickOne(it, (txt) => {
      const m = txt.match(/^(\d+) .* for every (\d+) /);
      return !!m && Number(m[1]) * P.x === Number(m[2]) * P.y;
    });
  };

  suite("ratioGraphRead", "Read ratio graphs", "Leer gráficas de razones", {
    1: [form("pair", grPair, grPairCheck), form("unitPoint", grUnitPoint, grUnitPointCheck)],
    2: [form("same", grSame, grSameCheck), form("unitFrom", grUnitFrom, grUnitFromCheck)],
    3: [form("odd", grOdd, grOddCheck), form("verdict", grVerdict, grVerdictCheck)],
    4: [form("steeper", grSteeper, grSteeperCheck), form("fits", grFits, grFitsCheck)],
  });

  /* ===================================================================================================
   * compareRatios (3-5): mixtures and deals compared by a common amount or by unit rates
   * =================================================================================================== */
  const lcm2 = (/** @type {number} */ a, /** @type {number} */ b) => (a * b) / gcd(a, b);
  const batchName = (/** @type {number} */ i) => [`Batch ${i + 1}`, `Tanda ${i + 1}`];
  /** [key, other] amounts of batch i: the key ingredient is the one whose bigger share wins */
  const sayBatch = (
    /** @type {any} */ c,
    /** @type {number} */ i,
    /** @type {number} */ a,
    /** @type {number} */ b,
  ) =>
    T("{n} uses {A} and {B}.", "{n} usa {A} y {B}.", {
      n: batchName(i),
      A: np(c.a, a),
      B: np(c.b, b),
    });
  const keyOf = (/** @type {any} */ c) =>
    c.key === "a" ? { k: c.a, nk: c.na, o: c.b, no: c.nb } : { k: c.b, nk: c.nb, o: c.a, no: c.na };
  /** [key amount, other amount] for a batch written as (a, b) */
  const kv = (/** @type {any} */ c, /** @type {number[]} */ ab) =>
    c.key === "a" ? ab : [ab[1], ab[0]];

  /** build the Batch-1 / Batch-2 menu: right = winner; wrong = loser (compared key amounts), same, can't tell */
  const twoBatchItem = (
    /** @type {any} */ rng,
    /** @type {any} */ c,
    /** @type {number[][]} */ B,
    /** @type {any} */ extra,
  ) => {
    const [K1, O1] = kv(c, B[0]);
    const [K2, O2] = kv(c, B[1]);
    const win = K1 * O2 > K2 * O1 ? 0 : 1;
    const lose = 1 - win;
    const kk = keyOf(c);
    const opt = (/** @type {number} */ i, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: batchName(i)[0],
      vEs: batchName(i)[1],
      f,
      tag,
    });
    return mcB(rng, {
      q: T("{s1} {s2} {qs}", "{s1} {s2} {qs}", {
        s1: sayBatch(c, 0, B[0][0], B[0][1]),
        s2: sayBatch(c, 1, B[1][0], B[1][1]),
        qs: c.qs,
      }),
      loose: true,
      right: { v: batchName(win)[0], vEs: batchName(win)[1] },
      wrong: [
        opt(
          lose,
          T(
            "{n} is the other batch. Compare how much {nk} there is for the same amount of {no}.",
            "{n} es la otra tanda. Compara cuánto hay de {nk} para la misma cantidad de {no}.",
            { n: batchName(lose), nk: kk.nk, no: kk.no },
          ),
          extra.trap(lose),
        ),
        {
          v: "They are the same",
          vEs: "Son iguales",
          tag: "ratio-not-checked",
          f: T(
            "The ratios are not equal once you use the same amount of {no} in both.",
            "Las razones no son iguales cuando usas la misma cantidad de {no} en ambas.",
            { no: kk.no },
          ),
        },
        {
          v: "You cannot tell",
          vEs: "No se puede saber",
          tag: "ratio-not-checked",
          f: T(
            "You can tell: scale both batches to the same amount of {no} and compare.",
            "Sí se puede saber: lleva ambas tandas a la misma cantidad de {no} y compara.",
            { no: kk.no },
          ),
        },
      ],
      x: extra.x(win, [K1, K2], [O1, O2]),
      h: extra.h,
      meta: { c: c.mix[0], B },
    });
  };
  const twoBatchCheck = (/** @type {any} */ it) => {
    const c = MIX.find((m) => m.mix[0] === it.meta.c);
    const [K1, O1] = kv(c, it.meta.B[0]);
    const [K2, O2] = kv(c, it.meta.B[1]);
    const cross = K1 * O2 - K2 * O1; // K1/O1 versus K2/O2 without dividing
    return pickOne(it, (txt) =>
      cross === 0 ? txt === "They are the same" : txt === (cross > 0 ? "Batch 1" : "Batch 2"),
    );
  };

  /** L1: the other ingredient is the same in both batches */
  const crSameBase = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const o = rng.int(3, 9);
    const [k1, k2] = rng.shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, 2);
    const mk = (/** @type {number} */ k) => (c.key === "a" ? [k, o] : [o, k]);
    const kk = keyOf(c);
    return twoBatchItem(rng, c, [mk(k1), mk(k2)], {
      trap: () => "compared-wrong-direction",
      x: (/** @type {number} */ w, /** @type {number[]} */ K) =>
        T(
          "Both batches use {o} of {no}, so compare the {nk}: {a} and {b}. {n} has more, so it wins.",
          "Ambas tandas usan {o} de {no}, así que compara {nk}: {a} y {b}. {n} tiene más, así que es la ganadora.",
          {
            o,
            no: kk.no,
            nk: kk.nk,
            a: K[0],
            b: K[1],
            n: batchName(w),
            strong: "stronger",
          },
        ),
      h: [
        T(
          "Look at the amount that is the same in both batches.",
          "Mira la cantidad que es igual en ambas tandas.",
        ),
        T(
          "When one amount is the same, you can compare the other amount directly.",
          "Cuando una cantidad es igual, puedes comparar la otra directamente.",
        ),
      ].concat([
        T(
          "Which batch has more of the ingredient that matters?",
          "¿Cuál tanda tiene más del ingrediente que importa?",
        ),
      ]),
    });
  };

  /** L2: scale both ratios to a common amount */
  const crScale = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const [o1, o2] = coprimePair(rng, 2, 9);
    const k1 = rng.int(2, 9);
    const k2 = rng.int(2, 9);
    if (k1 * o2 === k2 * o1) redo();
    const L = lcm2(o1, o2);
    if (L > 40) redo();
    const win = k1 * o2 > k2 * o1 ? 0 : 1;
    if ((win === 0 ? k1 > k2 : k2 > k1) === false) redo(); // the winner has fewer key units in all: totals mislead
    const mk = (/** @type {number} */ k, /** @type {number} */ o) =>
      c.key === "a" ? [k, o] : [o, k];
    const kk = keyOf(c);
    return twoBatchItem(rng, c, [mk(k1, o1), mk(k2, o2)], {
      trap: () => "ratio-compared-without-common-basis",
      x: (/** @type {number} */ w, /** @type {number[]} */ K, /** @type {number[]} */ O) =>
        T(
          "Scale both to {L} of {no}: Batch 1 becomes {a1} of {nk}, Batch 2 becomes {a2}. {n} has more {nk} for the same {no}.",
          "Lleva ambas a {L} de {no}: la tanda 1 pasa a {a1} de {nk} y la tanda 2 a {a2}. {n} tiene más {nk} para la misma cantidad de {no}.",
          {
            L,
            no: kk.no,
            nk: kk.nk,
            a1: (K[0] * L) / O[0],
            a2: (K[1] * L) / O[1],
            n: batchName(w),
          },
        ),
      h: [
        T(
          "Do not compare the amounts of {nk} alone. The batches have different amounts of {no}.",
          "No compares solo las cantidades de {nk}. Las tandas tienen distintas cantidades de {no}.",
          { nk: kk.nk, no: kk.no },
        ),
        T(
          "Find an amount of {no} that both batches can be scaled to.",
          "Halla una cantidad de {no} a la que se puedan llevar ambas tandas.",
          { no: kk.no },
        ),
        T(
          "Scale each batch to that amount and compare the {nk}.",
          "Lleva cada tanda a esa cantidad y compara {nk}.",
          { nk: kk.nk },
        ),
      ],
    });
  };

  /** L3: better buy with unit prices */
  const crDeal = (/** @type {any} */ rng) => {
    const { it, g } = rng.pick(ITEMS);
    void g;
    const step = 5;
    const p1 = step * rng.int(8, 80);
    const p2 = step * rng.int(8, 80);
    const n1 = rng.int(3, 12);
    const n2 = rng.int(3, 12);
    if (p1 === p2 || n1 === n2) redo();
    const t1 = p1 * n1;
    const t2 = p2 * n2;
    const win = p1 < p2 ? 0 : 1;
    const lose = 1 - win;
    const tt = [t1, t2];
    if (tt[lose] >= tt[win]) redo(); // the worse buy has the smaller total: totals mislead
    const P = [p1, p2];
    const N = [n1, n2];
    const nm = (/** @type {number} */ i) => [`Pack ${"AB"[i]}`, `Paquete ${"AB"[i]}`];
    const rate = (/** @type {number} */ i, /** @type {number} */ cents) => ({
      v: `${nm(i)[0]}: ${usd(cents)} per ${it.s[0]}`,
      vEs: `${nm(i)[1]}: ${usd(cents)} por ${it.s[1]}`,
    });
    return mcB(rng, {
      q: T(
        "{n1} has {A1} for {t1}. {n2} has {A2} for {t2}. Which pack is the better buy?",
        "{n1} trae {A1} por {t1}. {n2} trae {A2} por {t2}. ¿Cuál paquete es la mejor compra?",
        {
          n1: nm(0),
          n2: nm(1),
          A1: np(it, n1),
          A2: np(it, n2),
          t1: usd(t1),
          t2: usd(t2),
        },
      ),
      right: rate(win, P[win]),
      wrong: [
        {
          ...rate(lose, P[lose]),
          tag: "compared-wrong-direction",
          f: T(
            "That is the other pack's unit price. The better buy has the lower price for one {item}.",
            "Ese es el precio unitario del otro paquete. La mejor compra tiene el precio más bajo por {item}.",
            { item: it.s },
          ),
        },
        {
          v: `${nm(lose)[0]}, because ${usd(tt[lose])} is less than ${usd(tt[win])}`,
          vEs: `${nm(lose)[1]}, porque ${usd(tt[lose])} es menos que ${usd(tt[win])}`,
          tag: "ratio-compared-without-common-basis",
          f: T(
            "That compares the total prices, but the packs hold different numbers of {items}. Compare the price of one.",
            "Eso compara los precios totales, pero los paquetes tienen distinto número de {items}. Compara el precio de uno.",
            { items: it.p },
          ),
        },
        {
          v: `They cost the same per ${it.s[0]}`,
          vEs: `Cuestan lo mismo por ${it.s[1]}`,
          tag: "ratio-not-checked",
          f: T(
            "Divide each price by its number of {items}. The unit prices are not equal.",
            "Divide cada precio entre su número de {items}. Los precios unitarios no son iguales.",
            { items: it.p },
          ),
        },
      ],
      x: T(
        "{a}: {t1} ÷ {n1} = {p1} each. {b}: {t2} ÷ {n2} = {p2} each. {w} has the lower unit price, so it is the better buy.",
        "{a}: {t1} ÷ {n1} = {p1} cada uno. {b}: {t2} ÷ {n2} = {p2} cada uno. {w} tiene el precio unitario menor, así que es la mejor compra.",
        {
          a: nm(0),
          b: nm(1),
          t1: usd(t1),
          n1,
          p1: usd(p1),
          t2: usd(t2),
          n2,
          p2: usd(p2),
          w: nm(win),
        },
      ),
      h: [
        T(
          "A better buy has a lower price for one item. Do not compare the total prices.",
          "Una mejor compra tiene un precio menor por artículo. No compares los precios totales.",
        ),
        T(
          "Find the price of one {item} in each pack.",
          "Halla el precio de un {item} en cada paquete.",
          { item: it.s },
        ),
        T(
          "Divide each total price by the number of {items} in that pack, then compare.",
          "Divide cada precio total entre el número de {items} de ese paquete y luego compara.",
          { items: it.p },
        ),
      ],
      meta: { t: tt, n: N },
    });
  };
  const crDealCheck = (/** @type {any} */ it) => {
    const { t, n } = it.meta;
    const cross = t[0] * n[1] - t[1] * n[0];
    const win = cross < 0 ? 0 : 1; // lower unit price wins
    return pickOne(it, (txt) => {
      const m = txt.match(/^Pack ([AB]): \$([\d.]+) per /);
      if (!m) return false;
      const i = "AB".indexOf(m[1]);
      return i === win && same(Number(m[2]) * n[i], t[i] / 100, 1e-6);
    });
  };

  /** L4: three batches, which is strongest */
  const crThree = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const os = rng.shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
    const ks = os.map((o) => rng.int(1, o + 3));
    const val = ks.map((k, i) => k / os[i]);
    if (new Set(val.map((v) => v.toFixed(6))).size < 3) redo();
    const win = val.indexOf(Math.max(...val));
    const bigK = ks.indexOf(Math.max(...ks));
    if (bigK === win) redo(); // the most key in all is not the strongest batch
    const kk = keyOf(c);
    const mk = (/** @type {number} */ i) => (c.key === "a" ? [ks[i], os[i]] : [os[i], ks[i]]);
    const opt = (/** @type {number} */ i) => ({
      v: batchName(i)[0],
      vEs: batchName(i)[1],
      tag: i === bigK ? "ratio-compared-without-common-basis" : "ratio-not-checked",
      f:
        i === bigK
          ? T(
              "{n} has the most {nk} in all, but it also has more {no}. Compare for the same amount of {no}.",
              "{n} tiene más {nk} en total, pero también más {no}. Compara para la misma cantidad de {no}.",
              { n: batchName(i), nk: kk.nk, no: kk.no },
            )
          : T(
              "{n} has {r} {nk} for each 1 {no}. Another batch has more.",
              "{n} tiene {r} de {nk} por cada 1 de {no}. Otra tanda tiene más.",
              { n: batchName(i), r: fmt(val[i], 2), nk: kk.nk, no: kk.no },
            ),
    });
    return mcB(rng, {
      q: T("{s1} {s2} {s3} {qs}", "{s1} {s2} {s3} {qs}", {
        s1: sayBatch(c, 0, ...mk(0)),
        s2: sayBatch(c, 1, ...mk(1)),
        s3: sayBatch(c, 2, ...mk(2)),
        qs: c.qs,
      }),
      right: { v: batchName(win)[0], vEs: batchName(win)[1] },
      wrong: [
        ...[0, 1, 2]
          .filter((i) => i !== win)
          .sort((a) => (a === bigK ? -1 : 1))
          .map(opt),
        {
          v: "They are all the same",
          vEs: "Todas son iguales",
          tag: "ratio-not-checked",
          f: T(
            "Find {nk} for each 1 {no} in each batch. The amounts are different.",
            "Halla {nk} por cada 1 de {no} en cada tanda. Las cantidades son distintas.",
            { nk: kk.nk, no: kk.no },
          ),
        },
      ],
      x: T(
        "{nk} for each 1 {no}: Batch 1 is {r0}, Batch 2 is {r1}, Batch 3 is {r2}. {n} is the biggest.",
        "{nk} por cada 1 de {no}: la tanda 1 es {r0}, la tanda 2 es {r1} y la tanda 3 es {r2}. {n} es la mayor.",
        {
          nk: [cap(kk.nk[0]), cap(kk.nk[1])],
          no: kk.no,
          r0: fmt(val[0], 2),
          r1: fmt(val[1], 2),
          r2: fmt(val[2], 2),
          n: batchName(win),
        },
      ),
      h: [
        T(
          "Do not look for the batch with the most {nk}. Compare the same amount of {no} in each.",
          "No busques la tanda con más {nk}. Compara la misma cantidad de {no} en cada una.",
          { nk: kk.nk, no: kk.no },
        ),
        T(
          "Find how much {nk} goes with 1 {no} in each batch.",
          "Halla cuánto {nk} va con 1 de {no} en cada tanda.",
          { nk: kk.nk, no: kk.no },
        ),
        T("Compare the three answers.", "Compara las tres respuestas."),
      ],
      meta: { c: c.mix[0], ks, os },
    });
  };
  const crThreeCheck = (/** @type {any} */ it) => {
    const { ks, os } = it.meta;
    const best = [0, 1, 2].find((i) => [0, 1, 2].every((j) => ks[i] * os[j] >= ks[j] * os[i]));
    return pickOne(it, (txt) => txt === `Batch ${best + 1}`);
  };

  /** L4: how many more of the key ingredient to match another batch */
  const crMatch = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const kk = keyOf(c);
    const oB = rng.int(2, 6);
    const kB = rng.int(2, 8);
    const m = rng.int(2, 5);
    const oA = oB * m;
    const need = kB * m;
    const kA = rng.int(1, need - 1);
    if (gcd(kB, oB) !== 1) redo();
    const who = rng.pick(NAMES);
    const pairA = c.key === "a" ? [kA, oA] : [oA, kA];
    const pairB = c.key === "a" ? [kB, oB] : [oB, kB];
    return numB({
      q: T(
        "Batch A uses {A} and {B}. Batch B uses {A2} for every {B2}. {who} keeps the {no} in Batch A the same. How many more {unit} of {nk} must {who} add so Batch A matches Batch B?",
        "La tanda A usa {A} y {B}. La tanda B usa {A2} por cada {B2}. {who} deja igual {no} en la tanda A. ¿Cuántas {unit} más de {nk} debe agregar {who} para que la tanda A coincida con la tanda B?",
        {
          A: np(c.a, pairA[0]),
          B: np(c.b, pairA[1]),
          A2: np(c.a, pairB[0]),
          B2: np(c.b, pairB[1]),
          who,
          no: kk.no,
          nk: kk.nk,
          unit: c.unit,
        },
      ),
      a: need - kA,
      fw: [
        {
          v: need,
          f: T(
            "That is how much {nk} Batch A needs in all. Subtract what it already has.",
            "Esa es la cantidad de {nk} que necesita la tanda A en total. Resta lo que ya tiene.",
            { nk: kk.nk },
          ),
          tag: "stopped-early",
        },
        {
          v: kB - kA,
          f: T(
            "That subtracts the numbers of the two recipes. The batches have different amounts of {no}, so scale first.",
            "Eso resta los números de las dos recetas. Las tandas tienen distintas cantidades de {no}, así que primero escala.",
            { no: kk.no },
          ),
          tag: "ratio-as-difference",
        },
        {
          v: kB + m - kA,
          f: T(
            "Scaling multiplies both numbers by the same factor; it does not add.",
            "Escalar multiplica ambos números por el mismo factor; no suma.",
          ),
          tag: "op-added-instead-of-multiplied",
        },
      ],
      x: T(
        "Batch A has {m} times the {no} of one Batch B recipe, so scale Batch B by {m}: the {nk} becomes {kB} × {m} = {need}. Batch A has {kA}, so it needs {need} − {kA} = {ans} more.",
        "La tanda A tiene {m} veces la cantidad de {no} de una receta de la tanda B, así que escala la tanda B por {m}: la cantidad de {nk} pasa a {kB} × {m} = {need}. La tanda A tiene {kA}, así que necesita {need} − {kA} = {ans} más.",
        { m, no: kk.no, nk: kk.nk, kB, need, kA, ans: need - kA },
      ),
      h: [
        T(
          "To match, Batch A needs the same ratio as Batch B.",
          "Para coincidir, la tanda A necesita la misma razón que la tanda B.",
        ),
        T(
          "Scale Batch B so it uses the same amount of {no} as Batch A.",
          "Escala la tanda B para que use la misma cantidad de {no} que la tanda A.",
          { no: kk.no },
        ),
        T(
          "Subtract the {nk} Batch A already has from the scaled amount.",
          "Resta el {nk} que ya tiene la tanda A de la cantidad escalada.",
          { nk: kk.nk },
        ),
      ],
      meta: { c: c.mix[0], pairA, pairB },
    });
  };
  const crMatchCheck = (/** @type {any} */ it) => {
    const c = MIX.find((m) => m.mix[0] === it.meta.c);
    const [kA, oA] = kv(c, it.meta.pairA);
    const [kB, oB] = kv(c, it.meta.pairB);
    return same((value(it.a) + kA) * oB, kB * oA) || "adding the answer does not match batch B";
  };

  suite("compareRatios", "Compare ratios", "Comparar razones", {
    1: [form("sameBase", crSameBase, twoBatchCheck)],
    2: [form("scale", crScale, twoBatchCheck)],
    3: [form("deal", crDeal, crDealCheck)],
    4: [form("three", crThree, crThreeCheck), form("match", crMatch, crMatchCheck)],
  });

  /* ===================================================================================================
   * convertUnits (3-6, 3-10) and convertBetween (3-7)
   * =================================================================================================== */
  const U = {
    yard: Q("yard", "yards", "yarda", "yardas"),
    foot: Q("foot", "feet", "pie", "pies"),
    inch: Q("inch", "inches", "pulgada", "pulgadas"),
    meter: Q("meter", "meters", "metro", "metros"),
    cm: Q("centimeter", "centimeters", "centímetro", "centímetros"),
    km: Q("kilometer", "kilometers", "kilómetro", "kilómetros"),
    pound: Q("pound", "pounds", "libra", "libras"),
    ounce: Q("ounce", "ounces", "onza", "onzas"),
    kg: Q("kilogram", "kilograms", "kilogramo", "kilogramos"),
    gram: Q("gram", "grams", "gramo", "gramos"),
    mg: Q("milligram", "milligrams", "miligramo", "miligramos"),
    gallon: Q("gallon", "gallons", "galón", "galones"),
    quart: Q("quart", "quarts", "cuarto de galón", "cuartos de galón"),
    pint: Q("pint", "pints", "pinta", "pintas"),
    cup: Q("cup", "cups", "taza", "tazas"),
    liter: Q("liter", "liters", "litro", "litros"),
    ml: Q("milliliter", "milliliters", "mililitro", "mililitros"),
    hour: Q("hour", "hours", "hora", "horas"),
    minute: Q("minute", "minutes", "minuto", "minutos"),
    second: Q("second", "seconds", "segundo", "segundos"),
    day: Q("day", "days", "día", "días"),
    week: Q("week", "weeks", "semana", "semanas"),
    mile: Q("mile", "miles", "milla", "millas"),
    qt: Q("quart", "quarts", "cuarto de galón", "cuartos de galón"),
  };
  /** [big, small, k, system] */
  const FACTS = [
    [U.yard, U.foot, 3, "len"],
    [U.foot, U.inch, 12, "len"],
    [U.meter, U.cm, 100, "len"],
    [U.km, U.meter, 1000, "len"],
    [U.pound, U.ounce, 16, "mass"],
    [U.kg, U.gram, 1000, "mass"],
    [U.gram, U.mg, 1000, "mass"],
    [U.gallon, U.quart, 4, "cap"],
    [U.quart, U.pint, 2, "cap"],
    [U.pint, U.cup, 2, "cap"],
    [U.liter, U.ml, 1000, "cap"],
    [U.hour, U.minute, 60, "time"],
    [U.minute, U.second, 60, "time"],
    [U.day, U.hour, 24, "time"],
    [U.week, U.day, 7, "time"],
  ];
  /** three-unit chains: [a, b, c, k1, k2, system] */
  const CHAINS = [
    [U.gallon, U.quart, U.pint, 4, 2, "cap"],
    [U.quart, U.pint, U.cup, 2, 2, "cap"],
    [U.day, U.hour, U.minute, 24, 60, "time"],
    [U.hour, U.minute, U.second, 60, 60, "time"],
    [U.yard, U.foot, U.inch, 3, 12, "len"],
    [U.kg, U.gram, U.mg, 1000, 1000, "mass"],
    [U.km, U.meter, U.cm, 1000, 100, "len"],
    [U.week, U.day, U.hour, 7, 24, "time"],
  ];
  const SCENES = {
    len: [
      ["A rope is {X} long.", "Una cuerda mide {X}."],
      ["A ribbon is {X} long.", "Un listón mide {X}."],
      ["A board is {X} long.", "Una tabla mide {X}."],
      ["A path is {X} long.", "Un camino mide {X}."],
    ],
    mass: [
      ["A bag weighs {X}.", "Una bolsa pesa {X}."],
      ["A box weighs {X}.", "Una caja pesa {X}."],
      ["A package weighs {X}.", "Un paquete pesa {X}."],
      ["A watermelon weighs {X}.", "Una sandía pesa {X}."],
    ],
    cap: [
      ["A jug holds {X}.", "Una jarra tiene {X}."],
      ["A tank holds {X}.", "Un tanque tiene {X}."],
      ["A bucket holds {X}.", "Un balde tiene {X}."],
      ["A bottle holds {X}.", "Una botella tiene {X}."],
    ],
    time: [
      ["A project takes {X}.", "Un proyecto dura {X}."],
      ["A movie lasts {X}.", "Una película dura {X}."],
      ["A trip takes {X}.", "Un viaje dura {X}."],
      ["A game lasts {X}.", "Un juego dura {X}."],
    ],
  };
  const scene = (/** @type {any} */ rng, /** @type {string} */ sys, /** @type {any} */ X) => {
    const [en, es] = rng.pick(SCENES[/** @type {"len"} */ (sys)]);
    return T(en, es, { X });
  };
  const SCENE_MULTI = {
    len: (/** @type {any} */ d, /** @type {any} */ X) =>
      T(
        "Mia cuts {d} ribbons. Each ribbon is {X} long.",
        "Mia corta {d} listones. Cada listón mide {X}.",
        { d, X },
      ),
    mass: (/** @type {any} */ d, /** @type {any} */ X) =>
      T("Mia buys {d} bags. Each bag weighs {X}.", "Mia compra {d} bolsas. Cada bolsa pesa {X}.", {
        d,
        X,
      }),
    cap: (/** @type {any} */ d, /** @type {any} */ X) =>
      T("Mia fills {d} jugs. Each jug holds {X}.", "Mia llena {d} jarras. Cada jarra tiene {X}.", {
        d,
        X,
      }),
  };
  const factTxt = (/** @type {any} */ big, /** @type {any} */ small, /** @type {number} */ k) => [
    `1 ${big.s[0]} = ${show(k)} ${small.p[0]}`,
    `1 ${big.s[1]} = ${show(k)} ${small.p[1]}`,
  ];
  const capP = (/** @type {any} */ q) => [cap(q.p[0]), cap(q.p[1])];
  const unitHd = (/** @type {any} */ a, /** @type {any} */ b) => ({
    hd: [capP(a)[0], capP(b)[0]],
    hdEs: [capP(a)[1], capP(b)[1]],
  });
  const dirTag = {
    mulInstead: T(
      "That multiplies, but going to a bigger unit needs fewer of them, so divide.",
      "Eso multiplica, pero al pasar a una unidad mayor se necesitan menos, así que divide.",
    ),
    divInstead: T(
      "That divides, but going to a smaller unit needs more of them, so multiply.",
      "Eso divide, pero al pasar a una unidad menor se necesitan más, así que multiplica.",
    ),
    add: T(
      "That adds the number from the fact. Converting multiplies or divides by it.",
      "Eso suma el número del dato. Convertir multiplica o divide por él.",
    ),
  };

  /** L1: bigger unit to smaller unit on a double number line */
  const cuUp = (/** @type {any} */ rng) => {
    const [big, small, k, sys] = rng.pick(FACTS);
    const n = rng.int(2, 6);
    const top = [0, ...Array.from({ length: n }, (_, i) => i + 1)];
    const bottom = top.map((v) => v * k);
    const hd = unitHd(big, small);
    const viz = {
      t: "dnl",
      top: { label: hd.hd[0], labelEs: hd.hdEs[0], vals: top },
      bottom: {
        label: hd.hd[1],
        labelEs: hd.hdEs[1],
        vals: bottom.map((v, i) => (i === n ? null : v)),
      },
    };
    return numB({
      q: T(
        "{s} Use the double number line and {fact}. What is that in {sp}?",
        "{s} Usa la recta numérica doble y {fact}. ¿Cuál es esa medida en {sp}?",
        {
          s: scene(rng, sys, np(big, n)),
          fact: factTxt(big, small, k),
          sp: small.p,
        },
      ),
      viz,
      a: n * k,
      fw: [
        { v: n + k, f: dirTag.add, tag: "op-added-instead-of-multiplied" },
        {
          v: `${n}/${k}`,
          f: dirTag.divInstead,
          tag: "op-divided-instead-of-multiplied",
        },
      ],
      x: T(
        "Each 1 {bs} is {k} {sp}. {n} {bp} is {n} × {k} = {ans} {sp}.",
        "Cada 1 {bs} es {k} {sp}. {n} {bp} son {n} × {k} = {ans} {sp}.",
        { bs: big.s, bp: big.p, sp: small.p, k, n, ans: n * k },
      ),
      h: [
        T(
          "On a double number line, each jump on one line matches a jump on the other.",
          "En una recta numérica doble, cada salto en una recta corresponde a un salto en la otra.",
        ),
        T(
          "One jump of 1 {bs} on the top line matches {k} {sp} on the bottom line.",
          "Un salto de 1 {bs} en la recta de arriba corresponde a {k} {sp} en la de abajo.",
          { bs: big.s, sp: small.p, k },
        ),
        T(
          "Keep jumping by {k} until you reach {n} {bp}.",
          "Sigue saltando de {k} en {k} hasta llegar a {n} {bp}.",
          { k, n, bp: big.p },
        ),
      ],
      meta: { n, k },
    });
  };
  const cuUpCheck = (/** @type {any} */ it) => {
    let acc = 0;
    for (let i = 0; i < it.meta.n; i++) acc += it.meta.k; // jump k at a time
    return wantNum(it, acc);
  };

  /** L2: either direction, ratio table with a blank; typed or multiple choice */
  const cuBoth = (/** @type {any} */ rng) => {
    const [big, small, k, sys] = rng.pick(FACTS);
    const up = rng.chance(0.5);
    const m = rng.int(2, 12);
    const given = up ? m : m * k;
    const ans = up ? m * k : m;
    const [from, to] = up ? [big, small] : [small, big];
    const hd = unitHd(big, small);
    const viz = {
      t: "table",
      ...hd,
      rows: up
        ? [
            [1, k],
            [m, "?"],
          ]
        : [
            [1, k],
            ["?", m * k],
          ],
      blank: [up ? [1, 1] : [1, 0]],
    };
    const wrong = [
      [
        up ? `${given}/${k}` : given * k,
        up ? dirTag.divInstead : dirTag.mulInstead,
        up ? "op-divided-instead-of-multiplied" : "op-multiplied-instead-of-divided",
      ],
      [
        up ? given + k : given - k,
        dirTag.add,
        up ? "op-added-instead-of-multiplied" : "op-added-instead-of-multiplied",
      ],
      [
        up ? given : given,
        T(
          "That is the number you started with. The unit changed, so the number must change too.",
          "Ese es el número con el que empezaste. La unidad cambió, así que el número también debe cambiar.",
        ),
        "unit-mismatch",
      ],
    ];
    const base = {
      q: T(
        "{s} Use the ratio table and {fact}. How many {tp} is that?",
        "{s} Usa la tabla de razones y {fact}. ¿Cuál es esa medida en {tp}?",
        {
          s: scene(rng, sys, np(from, given)),
          fact: factTxt(big, small, k),
          tp: to.p,
        },
      ),
      viz,
      x: up
        ? T(
            "{Fp} are the smaller unit, so there are more of them: {m} × {k} = {ans}.",
            "La unidad menor es {tp}, así que hay más: {m} × {k} = {ans}.",
            { Fp: capP(small), fp: small.p, tp: small.p, m, k, ans },
          )
        : T(
            "{Bp} are the bigger unit, so there are fewer of them: {g} ÷ {k} = {ans}.",
            "La unidad mayor es {bp}, así que hay menos: {g} ÷ {k} = {ans}.",
            { Bp: capP(big), bp: big.p, g: given, k, ans },
          ),
      h: [
        T(
          "Ask which unit is bigger. Bigger units mean fewer of them.",
          "Pregunta cuál unidad es mayor. Unidades mayores significan menos cantidad.",
        ),
        T(
          "The table row 1 : {k} shows the exchange rate between the units.",
          "La fila 1 : {k} de la tabla muestra el cambio entre las unidades.",
          { k },
        ),
        up
          ? T(
              "You are going to the smaller unit, so multiply by {k}.",
              "Vas a la unidad menor, así que multiplica por {k}.",
              { k },
            )
          : T(
              "You are going to the bigger unit, so divide by {k}.",
              "Vas a la unidad mayor, así que divide entre {k}.",
              { k },
            ),
      ],
      meta: { up, given, k },
    };
    if (rng.chance(0.5))
      return numB({
        ...base,
        a: ans,
        fw: wrong.map(([v, f, tag]) => ({ v, f, tag })),
      });
    const lab = (/** @type {number} */ v) => [
      `${show(Math.round(v * 100) / 100)} ${to.p[0]}`,
      `${show(Math.round(v * 100) / 100)} ${to.p[1]}`,
    ];
    const vals = wrong.map(([v, f, tag]) => ({
      v: typeof v === "string" ? fmt(given / k, 2) : v,
      f,
      tag,
    }));
    return mcB(rng, {
      ...base,
      right: { v: lab(ans)[0], vEs: lab(ans)[1] },
      wrong: vals.map((w) => ({
        v: lab(w.v)[0],
        vEs: lab(w.v)[1],
        f: w.f,
        tag: w.tag,
      })),
    });
  };
  const cuBothCheck = (/** @type {any} */ it) => {
    const { up, given, k } = it.meta;
    const ok = (/** @type {number} */ v) =>
      up ? same(v / k, given, 1e-6) : same(v * k, given, 1e-6);
    return it.k === "num"
      ? ok(value(it.a)) || "answer does not convert back"
      : pickOne(it, (c) => ok(value(c.split(" ")[0])));
  };

  /** L3: two-step chain, or a mixed measure */
  const cuChain = (/** @type {any} */ rng) => {
    const [a, b, c, k1, k2, sys] = rng.pick(CHAINS);
    const mixed = rng.chance(0.4);
    if (mixed) {
      const n = rng.int(2, 6);
      const r = rng.int(1, k1 - 1);
      const hd = FACTS.find((f) => f[0] === a && f[1] === b);
      void hd;
      return numB({
        q: T(
          "{s} Use {fact}. How many {sp} is that?",
          "{s} Usa {fact}. ¿Cuál es esa medida en {sp}?",
          {
            s: scene(rng, sys, T("{A} and {B}", "{A} y {B}", { A: np(a, n), B: np(b, r) })),
            fact: factTxt(a, b, k1),
            sp: b.p,
          },
        ),
        a: n * k1 + r,
        fw: [
          {
            v: (n + r) * k1,
            f: T(
              "Only the {ap} should be multiplied. The {bp} are already in the unit you want.",
              "Solo se deben multiplicar {ap}. Las {bp} ya están en la unidad que quieres.",
              { ap: a.p, bp: b.p },
            ),
            tag: "unit-mismatch",
          },
          {
            v: n + r,
            f: T(
              "That adds the numbers without changing units. Convert the bigger unit first.",
              "Eso suma los números sin cambiar de unidad. Primero convierte la unidad mayor.",
            ),
            tag: "unit-mismatch",
          },
          {
            v: n * k1,
            f: T("That leaves out the extra {bp}.", "Eso deja fuera las {bp} adicionales.", {
              bp: b.p,
            }),
            tag: "forgot-part",
          },
        ],
        x: T(
          "Convert the bigger unit: {n} × {k} = {nk} {bp}. Then add the extra {r}: {nk} + {r} = {ans}.",
          "Convierte la unidad mayor: {n} × {k} = {nk} {bp}. Luego suma lo que sobra, {r}: {nk} + {r} = {ans}.",
          { ap: a.p, bp: b.p, n, k: k1, nk: n * k1, r, ans: n * k1 + r },
        ),
        h: [
          T(
            "The measure has two parts. Put both in the same unit before you add.",
            "La medida tiene dos partes. Pon ambas en la misma unidad antes de sumar.",
          ),
          T(
            "Change the bigger unit into the smaller unit first.",
            "Cambia primero la unidad mayor a la unidad menor.",
          ),
          T(
            "Multiply the {ap} by {k}, then add the {bp}.",
            "Multiplica las {ap} por {k} y luego suma las {bp}.",
            { ap: a.p, bp: b.p, k: k1 },
          ),
        ],
        meta: { mixed: true, n, r, k1 },
      });
    }
    const down = rng.chance(0.4);
    const n = rng.int(2, 5);
    const total = n * k1 * k2;
    const [from, to, given, ans] = down ? [c, a, total, n] : [a, c, n, total];
    return numB({
      q: T(
        "{s} Use {f1} and {f2}. How many {tp} is that?",
        "{s} Usa {f1} y {f2}. ¿Cuál es esa medida en {tp}?",
        {
          s: scene(rng, sys, np(from, given)),
          f1: factTxt(a, b, k1),
          f2: factTxt(b, c, k2),
          tp: to.p,
        },
      ),
      a: ans,
      fw: down
        ? [
            {
              v: given / k1,
              f: T(
                "That converts only one step. Go from {c} to {b}, then from {b} to {a}.",
                "Eso convierte un solo paso. Ve de {c} a {b} y luego de {b} a {a}.",
                { a: a.p, b: b.p, c: c.p },
              ),
              tag: "one-step-only",
            },
            {
              v: given * k1 * k2,
              f: dirTag.mulInstead,
              tag: "op-multiplied-instead-of-divided",
            },
          ]
        : [
            {
              v: given * k1,
              f: T(
                "That converts only one step. Go from {a} to {b}, then from {b} to {c}.",
                "Eso convierte un solo paso. Ve de {a} a {b} y luego de {b} a {c}.",
                { a: a.p, b: b.p, c: c.p },
              ),
              tag: "one-step-only",
            },
            {
              v: given + k1 + k2,
              f: dirTag.add,
              tag: "op-added-instead-of-multiplied",
            },
            {
              v: `${given}/${k1 * k2}`,
              f: dirTag.divInstead,
              tag: "op-divided-instead-of-multiplied",
            },
          ],
      x: down
        ? T(
            "Go up one unit at a time: {g} ÷ {k2} = {mid} {bp}, then {mid} ÷ {k1} = {ans} {ap}.",
            "Sube una unidad a la vez: {g} ÷ {k2} = {mid} {bp} y luego {mid} ÷ {k1} = {ans} {ap}.",
            { g: given, k1, k2, mid: given / k2, ans, bp: b.p, ap: a.p },
          )
        : T(
            "Go down one unit at a time: {g} × {k1} = {mid} {bp}, then {mid} × {k2} = {ans} {cp}.",
            "Baja una unidad a la vez: {g} × {k1} = {mid} {bp} y luego {mid} × {k2} = {ans} {cp}.",
            { g: given, k1, k2, mid: given * k1, ans, bp: b.p, cp: c.p },
          ),
      h: [
        T(
          "Use the two facts one after the other. The middle unit connects them.",
          "Usa los dos datos uno tras otro. La unidad del medio los conecta.",
        ),
        down
          ? T(
              "Going to bigger units means dividing. Do the second fact first.",
              "Ir a unidades mayores significa dividir. Haz primero el segundo dato.",
            )
          : T(
              "Going to smaller units means multiplying. Start with the first fact.",
              "Ir a unidades menores significa multiplicar. Empieza con el primer dato.",
            ),
        T(
          "Write the result of the first step before you start the second.",
          "Escribe el resultado del primer paso antes de empezar el segundo.",
        ),
      ],
      meta: { down, given, k1, k2 },
    });
  };
  const cuChainCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const a = value(it.a);
    if (m.mixed) {
      let acc = m.r; // rebuild the mixed measure one big unit at a time
      for (let i = 0; i < m.n; i++) acc += m.k1;
      return same(a, acc) || "mixed measure does not rebuild";
    }
    return (
      (m.down ? same(a * m.k1 * m.k2, m.given) : same(a, m.given * m.k1 * m.k2)) ||
      "chain does not convert back"
    );
  };

  /** L4: which measure is greater? */
  const cuCompare = (/** @type {any} */ rng) => {
    const [big, small, k, sys] = rng.pick(FACTS.filter((f) => f[2] <= 100));
    const n1 = rng.int(2, 9);
    const n2 = n1 * k + rng.pick([-1, 1, 2, -2]) * rng.int(1, Math.max(1, Math.min(9, k - 1)));
    if (n2 <= 0 || n2 === n1 * k) redo();
    const bigWins = n1 * k > n2;
    const left = rng.chance(0.5);
    const M1 = np(big, n1);
    const M2 = np(small, n2);
    const ch = (/** @type {any} */ P, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: P[0],
      vEs: P[1],
      f,
      tag,
    });
    const right = bigWins ? M1 : M2;
    const loser = bigWins ? M2 : M1;
    return mcB(rng, {
      loose: true,
      q: T(
        "{s} Use {fact}. Which measure is greater: {A} or {B}?",
        "{s} Usa {fact}. ¿Cuál medida es mayor: {A} o {B}?",
        {
          s: T("Compare two measures.", "Compara dos medidas."),
          fact: factTxt(big, small, k),
          A: left ? M1 : M2,
          B: left ? M2 : M1,
        },
      ),
      right: { v: right[0], vEs: right[1] },
      wrong: [
        ch(
          loser,
          T(
            "Compare after converting to the same unit. The size of the number alone does not decide.",
            "Compara después de convertir a la misma unidad. El tamaño del número por sí solo no decide.",
          ),
          "unit-mismatch",
        ),
        {
          v: "They are equal",
          vEs: "Son iguales",
          tag: "ratio-not-checked",
          f: T(
            "Convert one measure to the other's unit. The two amounts are not the same.",
            "Convierte una medida a la unidad de la otra. Las dos cantidades no son iguales.",
          ),
        },
        {
          v: "You cannot compare them",
          vEs: "No se pueden comparar",
          tag: "unit-mismatch",
          f: T(
            "You can compare them once both are in the same unit.",
            "Se pueden comparar cuando ambas están en la misma unidad.",
          ),
        },
      ],
      x: T(
        "{n1} {bp} = {n1} × {k} = {c1} {sp}. Compare {c1} with {n2}: {w} is greater.",
        "{n1} {bp} = {n1} × {k} = {c1} {sp}. Compara {c1} con {n2}: {w} es mayor.",
        { n1, bp: big.p, k, c1: n1 * k, sp: small.p, n2, w: right },
      ),
      h: [
        T(
          "You cannot compare numbers in different units. Put both in the same unit.",
          "No puedes comparar números de unidades distintas. Pon ambos en la misma unidad.",
        ),
        T(
          "Change the bigger unit to the smaller unit, since that is easy to multiply.",
          "Cambia la unidad mayor a la menor, porque es fácil multiplicar.",
        ),
        T("Now compare the two numbers.", "Ahora compara los dos números."),
      ],
      meta: { n1, n2, k, bn: big.p[0], sn: small.p[0] },
    });
  };
  const cuCompareCheck = (/** @type {any} */ it) => {
    const { n1, n2, k, bn } = it.meta;
    return pickOne(it, (txt) => {
      const m = txt.match(/^([\d,.]+) (.+)$/);
      if (!m) return false;
      const inSmall = m[2] === bn ? value(m[1]) * k : value(m[1]);
      const other = m[2] === bn ? n2 : n1 * k;
      return inSmall > other;
    });
  };

  /** L4: how many containers? convert first, then divide */
  const cuFit = (/** @type {any} */ rng) => {
    const opts = [
      [U.liter, U.ml, 1000, [200, 250, 500, 125]],
      [U.pound, U.ounce, 16, [2, 4, 8]],
      [U.hour, U.minute, 60, [5, 10, 12, 15, 20]],
      [U.meter, U.cm, 100, [4, 5, 10, 20, 25]],
      [U.kg, U.gram, 1000, [50, 100, 250, 500]],
      [U.gallon, U.quart, 4, [1]],
    ].slice(0, 5);
    const [big, small, k, sizes] = rng.pick(opts);
    const s = rng.pick(sizes);
    const N = rng.int(2, 9);
    const ans = (N * k) / s;
    if (!Number.isInteger(ans)) redo();
    return numB({
      q: T(
        "A total of {X} is divided into equal portions of {Y} each. Use {fact}. How many portions are there?",
        "Una cantidad total de {X} se divide en porciones iguales de {Y} cada una. Usa {fact}. ¿Cuántas porciones hay?",
        { X: np(big, N), Y: np(small, s), fact: factTxt(big, small, k) },
      ),
      a: ans,
      fw: [
        {
          v: `${N}/${s}`,
          f: T(
            "That divides without converting. {N} {bp} and {s} {sp} are different units.",
            "Eso divide sin convertir. {N} {bp} y {s} {sp} son unidades distintas.",
            { N, s, bp: big.p, sp: small.p },
          ),
          tag: "unit-mismatch",
        },
        {
          v: N * k,
          f: T(
            "That only converts. Now find how many portions of the smaller size fit.",
            "Eso solo convierte. Ahora halla cuántas porciones del tamaño menor caben.",
          ),
          tag: "stopped-early",
        },
        {
          v: N * k * s,
          f: T(
            "Multiplying by the portion size makes the number far too big. Divide by it.",
            "Multiplicar por el tamaño de la porción da un número demasiado grande. Divide entre él.",
          ),
          tag: "op-multiplied-instead-of-divided",
        },
      ],
      x: T(
        "{N} {bp} = {N} × {k} = {tot} {sp}. Then {tot} ÷ {s} = {ans} portions.",
        "{N} {bp} = {N} × {k} = {tot} {sp}. Luego {tot} ÷ {s} = {ans} porciones.",
        { N, bp: big.p, k, tot: N * k, sp: small.p, s, ans },
      ),
      h: [
        T(
          "The total and the portion are in different units. Convert first.",
          "El total y la porción están en unidades distintas. Convierte primero.",
        ),
        T("Change the total into the smaller unit.", "Cambia el total a la unidad menor."),
        T(
          "Then ask how many portions of that size fit in it.",
          "Luego pregunta cuántas porciones de ese tamaño caben.",
        ),
      ],
      meta: { N, k, s },
    });
  };
  const cuFitCheck = (/** @type {any} */ it) => {
    const { N, k, s } = it.meta;
    const portions = value(it.a);
    return same(portions * s, N * k) || "portions x size does not rebuild the total";
  };

  suite("convertUnits", "Convert units", "Convertir unidades", {
    1: [form("up", cuUp, cuUpCheck)],
    2: [form("both", cuBoth, cuBothCheck)],
    3: [form("chain", cuChain, cuChainCheck)],
    4: [form("compare", cuCompare, cuCompareCheck), form("fit", cuFit, cuFitCheck)],
  });

  /* ---- convertBetween: customary <-> metric with a given fact, rounded to a stated place ---------- */
  /** [from, to, factor x1000 (integer), exact?, system] ; fact says 1 from = f to */
  const XF = [
    [U.inch, U.cm, 2540, true, "len"],
    [U.mile, U.km, 1610, false, "len"],
    [U.pound, U.kg, 450, false, "mass"],
    [U.kg, U.pound, 2200, false, "mass"],
    [U.gallon, U.liter, 3800, false, "cap"],
    [U.ounce, U.gram, 28000, false, "mass"],
    [U.yard, U.meter, 910, false, "len"],
    [U.km, U.mile, 620, false, "len"],
    [U.liter, U.qt, 1060, false, "cap"],
  ];
  const XF1 = [
    [U.kg, U.pound, 2200, false, "mass"],
    [U.gallon, U.liter, 3800, false, "cap"],
    [U.mile, U.km, 1600, false, "len"],
    [U.pound, U.kg, 500, false, "mass"],
    [U.km, U.mile, 600, false, "len"],
    [U.liter, U.qt, 1100, false, "cap"],
    [U.ounce, U.gram, 28000, false, "mass"],
  ];
  const dec = (/** @type {number} */ thousandths) => fmt(thousandths / 1000, 3);
  const xfFact = (/** @type {any[]} */ f) => {
    const sym = f[3] ? "=" : "≈";
    return [
      `1 ${f[0].s[0]} ${sym} ${dec(f[2])} ${f[1].p[0]}`,
      `1 ${f[0].s[1]} ${sym} ${dec(f[2])} ${f[1].p[1]}`,
    ];
  };
  const PLACES = [
    ["whole", 0, T("Round to the nearest whole number.", "Redondea al número entero más cercano.")],
    ["tenth", 1, T("Round to the nearest tenth.", "Redondea a la décima más cercana.")],
    ["hundredth", 2, T("Round to the nearest hundredth.", "Redondea a la centésima más cercana.")],
  ];
  /** exact half-up rounding of an integer count of 1/1000 to `places`; redraws on an exact tie */
  const roundThousandths = (/** @type {number} */ x, /** @type {number} */ places) => {
    const unit = 10 ** (3 - places);
    if (x % unit === unit / 2) redo();
    return Math.floor((x + unit / 2) / unit) / 10 ** places;
  };

  /** L1: easy multiples on a double number line (no rounding) */
  const cbEasy = (/** @type {any} */ rng) => {
    const f = rng.pick(XF1);
    const [from, to, F, , sys] = f;
    const n = rng.int(2, 9);
    const top = Array.from({ length: n + 1 }, (_, i) => i);
    const bottom = top.map((i) => (i * F) / 1000);
    const [la, lb] = [capP(from), capP(to)];
    const ans = (n * F) / 1000;
    return numB({
      q: T(
        "{s} Use the double number line and {fact}. About how many {tp} is that?",
        "{s} Usa la recta numérica doble y {fact}. ¿Aproximadamente cuántos {tp} es eso?",
        { s: scene(rng, sys, np(from, n)), fact: xfFact(f), tp: to.p },
      ),
      viz: {
        t: "dnl",
        top: { label: la[0], labelEs: la[1], vals: top },
        bottom: {
          label: lb[0],
          labelEs: lb[1],
          vals: bottom.map((v, i) => (i === n ? null : v)),
        },
      },
      a: fmt(ans),
      fw: [
        {
          v: fmt(n + F / 1000),
          f: dirTag.add,
          tag: "op-added-instead-of-multiplied",
        },
        {
          v: fmt(n / (F / 1000), 2),
          f: dirTag.divInstead,
          tag: "op-divided-instead-of-multiplied",
        },
      ],
      x: T(
        "Each 1 {fs} is about {f} {tp}. So {n} {fp} is about {n} × {f} = {ans} {tp}.",
        "Cada 1 {fs} es aproximadamente {f} {tp}. Así que {n} {fp} son aproximadamente {n} × {f} = {ans} {tp}.",
        { fs: from.s, fp: from.p, tp: to.p, f: dec(F), n, ans: fmt(ans) },
      ),
      h: [
        T(
          "The fact tells how much of the second unit matches 1 of the first.",
          "El dato dice cuánto de la segunda unidad corresponde a 1 de la primera.",
        ),
        T(
          "Each jump on the top line is 1 {fs}. Each jump on the bottom line is {f} {tp}.",
          "Cada salto en la recta de arriba es 1 {fs}. Cada salto en la de abajo es {f} {tp}.",
          { fs: from.s, f: dec(F), tp: to.p },
        ),
        T(
          "Keep adding the jump until you reach {n} {fp}.",
          "Sigue sumando el salto hasta llegar a {n} {fp}.",
          { n, fp: from.p },
        ),
      ],
      meta: { fi: XF1.indexOf(f), n },
    });
  };
  const cbEasyCheck = (/** @type {any} */ it) => {
    const [, , F] = XF1[it.meta.fi];
    let acc = 0;
    for (let i = 0; i < it.meta.n; i++) acc += F; // add one jump at a time, in thousandths
    return wantNum(it, acc / 1000);
  };

  /** L2: convert and round to a stated place */
  const cbRound = (/** @type {any} */ rng) => {
    const f = rng.pick(XF);
    const [from, to, F, , sys] = f;
    const n = rng.int(3, 25);
    const [pn, places, ptxt] = rng.pick(PLACES);
    void pn;
    const exact = n * F;
    const ans = roundThousandths(exact, places);
    const raw = exact / 1000;
    if (same(raw, ans)) redo();
    return numB({
      q: T(
        "{s} Use {fact}. About how many {tp} is that? {r}",
        "{s} Usa {fact}. ¿Aproximadamente cuántos {tp} es eso? {r}",
        { s: scene(rng, sys, np(from, n)), fact: xfFact(f), tp: to.p, r: ptxt },
      ),
      a: fmt(ans, 3),
      fw: [
        {
          v: fmt(raw, 3),
          f: T(
            "That is the unrounded product. Round it as the question says.",
            "Ese es el producto sin redondear. Redondéalo como indica la pregunta.",
          ),
          tag: "rounded-wrong-place",
        },
        {
          v: fmt(n / (F / 1000), 2),
          f: dirTag.divInstead,
          tag: "op-divided-instead-of-multiplied",
        },
        {
          v: fmt(n + F / 1000, 2),
          f: dirTag.add,
          tag: "op-added-instead-of-multiplied",
        },
      ],
      x: T(
        "{n} × {f} = {raw}. Rounded as asked, it is about {ans} {tp}.",
        "{n} × {f} = {raw}. Redondeado como se pide, son aproximadamente {ans} {tp}.",
        { n, f: dec(F), raw: fmt(raw, 3), ans: fmt(ans, 3), tp: to.p },
      ),
      h: [
        T(
          "The fact says how much 1 {fs} is in the new unit. Multiply to find {n}.",
          "El dato dice cuánto es 1 {fs} en la nueva unidad. Multiplica para hallar {n}.",
          { fs: from.s, n },
        ),
        T(
          "Multiply {n} × {f} first. Do not round until the end.",
          "Primero multiplica {n} × {f}. No redondees hasta el final.",
          { n, f: dec(F) },
        ),
        T(
          "Look at the digit just after the place you are rounding to.",
          "Mira el dígito que sigue al lugar al que vas a redondear.",
        ),
      ],
      meta: { fi: XF.indexOf(f), n, places },
    });
  };
  const cbRoundCheck = (/** @type {any} */ it) => {
    const { fi, n, places } = it.meta;
    const raw = n * (XF[fi][2] / 1000);
    const want = Number((Math.round(raw * 10 ** places + 1e-9) / 10 ** places).toFixed(places)); // float route with a tiny nudge
    return wantNum(it, want, 1e-9);
  };

  /** L2: convert back with division (exact multiples) */
  const cbBack = (/** @type {any} */ rng) => {
    const f = rng.pick(XF.filter((x) => x[2] % 10 === 0 && x[2] !== 28000));
    const [from, to, F, , sys] = f;
    const m = rng.int(2, 12);
    const given = (m * F) / 1000;
    const lab = (/** @type {number} */ v) => [
      `${fmt(v, 2)} ${from.p[0]}`,
      `${fmt(v, 2)} ${from.p[1]}`,
    ];
    const w = (/** @type {number} */ v, /** @type {any} */ fb, /** @type {string} */ tag) => ({
      v: lab(v)[0],
      vEs: lab(v)[1],
      f: fb,
      tag,
    });
    return mcB(rng, {
      q: T(
        "{s} Use {fact}. About how many {fp} is that?",
        "{s} Usa {fact}. ¿Aproximadamente cuántos {fp} es eso?",
        { s: scene(rng, sys, np(to, given)), fact: xfFact(f), fp: from.p },
      ),
      right: { v: lab(m)[0], vEs: lab(m)[1] },
      wrong: [
        w(
          given * (F / 1000),
          T(
            "That multiplies, but you are going back to the first unit. Divide by the fact instead.",
            "Eso multiplica, pero vuelves a la primera unidad. Divide entre el dato.",
          ),
          "op-multiplied-instead-of-divided",
        ),
        w(
          given - F / 1000,
          T(
            "That subtracts the fact. Converting uses multiplication or division.",
            "Eso resta el dato. Convertir usa multiplicación o división.",
          ),
          "op-added-instead-of-multiplied",
        ),
        w(
          Math.round(given * 10) / 10 + 1,
          T(
            "The result is not the number of times the fact fits. Divide the measure by the fact.",
            "El resultado no es el número de veces que cabe el dato. Divide la medida entre el dato.",
          ),
          "unit-mismatch",
        ),
      ],
      x: T(
        "The fact says 1 {fs} is about {f} {tp}. {g} ÷ {f} = {m}, so it is about {m} {fp}.",
        "El dato dice que 1 {fs} es aproximadamente {f} {tp}. {g} ÷ {f} = {m}, así que son aproximadamente {m} {fp}.",
        { fs: from.s, f: dec(F), tp: to.p, g: fmt(given, 3), m, fp: from.p },
      ),
      h: [
        T(
          "You are going back to the first unit, so ask how many times the fact fits.",
          "Vuelves a la primera unidad, así que pregunta cuántas veces cabe el dato.",
        ),
        T(
          "One {fs} is {f} {tp}. How many of those are in the measure?",
          "Un {fs} es {f} {tp}. ¿Cuántos de esos hay en la medida?",
          { fs: from.s, f: dec(F), tp: to.p },
        ),
        T("Divide the measure by the fact.", "Divide la medida entre el dato."),
      ],
      meta: { fi: XF.indexOf(f), m, given },
    });
  };
  const cbBackCheck = (/** @type {any} */ it) => {
    const [, , F] = XF[it.meta.fi];
    return pickOne(it, (txt) => same(Number.parseFloat(txt) * (F / 1000), it.meta.given, 1e-6));
  };

  /** L3: several equal pieces, then convert and round */
  const cbMulti = (/** @type {any} */ rng) => {
    const f = rng.pick(XF.filter((x) => x[4] !== "time"));
    const [from, to, F, , sys] = f;
    const d = rng.int(3, 9);
    const n = rng.int(2, 12);
    const places = rng.pick([0, 1]);
    const exact = n * d * F;
    const ans = roundThousandths(exact, places);
    const raw = exact / 1000;
    if (same(raw, ans)) redo();
    return numB({
      q: T(
        "{s} Use {fact}. About how many {tp} in all? {r}",
        "{s} Usa {fact}. ¿Aproximadamente cuántos {tp} hay en total? {r}",
        {
          s: SCENE_MULTI[/** @type {"len"} */ (sys)](d, np(from, n)),
          fact: xfFact(f),
          tp: to.p,
          r: PLACES[places][2],
        },
      ),
      a: fmt(ans, 3),
      fw: [
        {
          v: fmt((n * F) / 1000, 3),
          f: T(
            "That converts one piece only. Count all {d} pieces.",
            "Eso convierte una sola pieza. Cuenta las {d} piezas.",
            { d },
          ),
          tag: "one-step-only",
        },
        {
          v: fmt(raw, 3),
          f: T(
            "Round the answer as the question says.",
            "Redondea la respuesta como indica la pregunta.",
          ),
          tag: "rounded-wrong-place",
        },
        {
          v: fmt(d * n, 3),
          f: T(
            "That counts the {fp} but never converts them.",
            "Eso cuenta los {fp} pero nunca los convierte.",
            { fp: from.p },
          ),
          tag: "unit-mismatch",
        },
      ],
      x: T(
        "{d} × {n} = {tot} {fp}. Then {tot} × {f} = {raw}, which rounds to about {ans} {tp}.",
        "{d} × {n} = {tot} {fp}. Luego {tot} × {f} = {raw}, que redondea a aproximadamente {ans} {tp}.",
        {
          d,
          n,
          tot: d * n,
          fp: from.p,
          f: dec(F),
          raw: fmt(raw, 3),
          ans: fmt(ans, 3),
          tp: to.p,
        },
      ),
      h: [
        T(
          "There are two steps: find the total in the first unit, then convert it.",
          "Hay dos pasos: halla el total en la primera unidad y luego conviértelo.",
        ),
        T(
          "Multiply the number of pieces by the size of each piece.",
          "Multiplica el número de piezas por el tamaño de cada una.",
        ),
        T(
          "Multiply that total by the fact, then round as asked.",
          "Multiplica ese total por el dato y luego redondea como se pide.",
        ),
      ],
      meta: { fi: XF.indexOf(f), d, n, places },
    });
  };
  const cbMultiCheck = (/** @type {any} */ it) => {
    const { fi, d, n, places } = it.meta;
    const raw = d * n * (XF[fi][2] / 1000);
    return wantNum(
      it,
      Number((Math.round(raw * 10 ** places + 1e-9) / 10 ** places).toFixed(places)),
    );
  };

  /** L4: compare across systems */
  const cbCompare = (/** @type {any} */ rng) => {
    const f = rng.pick(XF.filter((x) => x[2] % 10 === 0 && x[2] !== 28000));
    const [from, to, F] = f;
    const n = rng.int(3, 12);
    const conv = (n * F) / 1000;
    const m = Math.round(conv) + rng.pick([-3, -2, -1, 1, 2, 3]);
    if (m <= 0 || m === conv || Math.abs(m - conv) < 0.5) redo();
    const M1 = np(from, n);
    const M2 = np(to, m);
    const right = conv > m ? M1 : M2;
    const loser = conv > m ? M2 : M1;
    const left = rng.chance(0.5);
    return mcB(rng, {
      loose: true,
      q: T(
        "Use {fact}. Which measure is greater: {A} or {B}?",
        "Usa {fact}. ¿Cuál medida es mayor: {A} o {B}?",
        { fact: xfFact(f), A: left ? M1 : M2, B: left ? M2 : M1 },
      ),
      right: { v: right[0], vEs: right[1] },
      wrong: [
        {
          v: loser[0],
          vEs: loser[1],
          tag: "unit-mismatch",
          f: T(
            "The numbers are in different units, so the bigger number does not decide. Convert first.",
            "Los números están en unidades distintas, así que el número mayor no decide. Convierte primero.",
          ),
        },
        {
          v: "They are about equal",
          vEs: "Son aproximadamente iguales",
          tag: "ratio-not-checked",
          f: T(
            "Convert one measure. The amounts are clearly different.",
            "Convierte una medida. Las cantidades son claramente distintas.",
          ),
        },
        {
          v: "You cannot compare them",
          vEs: "No se pueden comparar",
          tag: "unit-mismatch",
          f: T(
            "You can compare them once both are in the same unit.",
            "Se pueden comparar cuando ambas están en la misma unidad.",
          ),
        },
      ],
      x: T(
        "{n} {fp} ≈ {n} × {f} = {c} {tp}. {c} {tp} is {cmp} {m} {tp}, so {w} is greater.",
        "{n} {fp} ≈ {n} × {f} = {c} {tp}. {c} {tp} es {cmp} {m} {tp}, así que {w} es mayor.",
        {
          n,
          fp: from.p,
          f: dec(F),
          c: fmt(conv, 2),
          tp: to.p,
          m,
          cmp: conv > m ? T("more than", "más que") : T("less than", "menos que"),
          w: right,
        },
      ),
      h: [
        T(
          "Put both measures in the same unit before you compare.",
          "Pon ambas medidas en la misma unidad antes de comparar.",
        ),
        T("Use the fact to change the {fp} into {tp}.", "Usa el dato para cambiar {fp} a {tp}.", {
          fp: from.p,
          tp: to.p,
        }),
        T("Now compare the two numbers.", "Ahora compara los dos números."),
      ],
      meta: { fi: XF.indexOf(f), n, m, fromName: from.p[0] },
    });
  };
  const cbCompareCheck = (/** @type {any} */ it) => {
    const { fi, n, m, fromName } = it.meta;
    const [, , F] = XF[fi];
    return pickOne(it, (txt) => {
      const mm = txt.match(/^([\d.]+) (.+)$/);
      if (!mm) return false;
      const v = Number(mm[1]);
      const inTo = mm[2] === fromName ? v * (F / 1000) : v;
      const otherVal = mm[2] === fromName ? m : n * (F / 1000);
      return inTo > otherVal;
    });
  };

  suite("convertBetween", "Convert between systems", "Convertir entre sistemas", {
    1: [form("easy", cbEasy, cbEasyCheck)],
    2: [form("round", cbRound, cbRoundCheck), form("back", cbBack, cbBackCheck)],
    3: [form("multi", cbMulti, cbMultiCheck)],
    4: [form("compare", cbCompare, cbCompareCheck)],
  });

  /* ===================================================================================================
   * unitRateWord (3-8): multi-step unit-rate stories
   * =================================================================================================== */
  /** L1 and L2: find the unit rate, then use it for a new count (apply) or a new total (until) */
  const uwUse = (/** @type {boolean} */ until) => (/** @type {any} */ rng) => {
    const c = rng.pick(RATES);
    const e = entsOf(rng, c)[0];
    const r = drawRate(rng, c, MONEY_STEP[1]);
    const n = rng.int(c.bl, c.bh);
    const n2 = rng.int(c.bl, c.bh + 5);
    if (n2 === n) redo();
    const t = r * n;
    const t2 = r * n2;
    const vars = { Bs: c.B.s, Bp: c.B.p, r: plain(c, r), t: plain(c, t), n, n2, t2: plain(c, t2) };
    const ask = until ? c.askB(e, showA(c, t2)) : c.askA(e, showB(c, n2));
    const ans = until ? String(n2) : ansOf(c, t2);
    return numB({
      q: T("{s} At this rate, {ask}", "{s} A esta tasa, {ask}", {
        s: c.say(e, showA(c, t), showB(c, n)),
        ask: [
          ask[0].charAt(0).toLowerCase() + ask[0].slice(1),
          ask[1].charAt(0).toLowerCase() + ask[1].slice(1),
        ],
      }),
      a: ans,
      fw: until
        ? [
            {
              v: realOf(c, r),
              f: T(
                "That is the unit rate, only the first step. Use it to find the number of {Bp} needed.",
                "Esa es la tasa unitaria, solo el primer paso. Úsala para hallar el número de {Bp} necesarios.",
                vars,
              ),
              tag: "stopped-at-unit-rate",
            },
            {
              v: realOf(c, r * t2),
              f: T(
                "Multiplying the rate by the total gives a huge number. Ask how many groups of the rate fit in the total.",
                "Multiplicar la tasa por el total da un número enorme. Pregunta cuántos grupos de la tasa caben en el total.",
              ),
              tag: "op-multiplied-instead-of-divided",
            },
            {
              v: realOf(c, t2 - t),
              f: T(
                "Subtracting the two totals does not use the rate. Find the rate first, then divide.",
                "Restar los dos totales no usa la tasa. Halla primero la tasa y luego divide.",
              ),
              tag: "ratio-as-difference",
            },
          ]
        : [
            {
              v: realOf(c, r),
              f: T(
                "That is the unit rate, only the first step. Now find the amount for {n2} {Bp}.",
                "Esa es la tasa unitaria, solo el primer paso. Ahora halla la cantidad para {n2} {Bp}.",
                vars,
              ),
              tag: "stopped-at-unit-rate",
            },
            {
              v: realOf(c, t * n2),
              f: T(
                "That multiplies the total by the new number. First divide to find the amount for 1 {Bs}.",
                "Eso multiplica el total por el nuevo número. Primero divide para hallar la cantidad para 1 {Bs}.",
                vars,
              ),
              tag: "op-multiplied-instead-of-divided",
            },
            {
              v: realOf(c, t + (n2 - n)),
              f: T(
                "Adding the extra {Bp} to the total does not keep the rate. Each {Bs} adds the same amount again.",
                "Sumar las {Bp} adicionales al total no mantiene la tasa. Cada {Bs} suma la misma cantidad otra vez.",
                vars,
              ),
              tag: "op-added-instead-of-multiplied",
            },
          ],
      x: until
        ? T(
            "First find the unit rate: {t} ÷ {n} = {r} per {Bs}. Then {t2} ÷ {r} = {n2} {Bp}.",
            "Primero halla la tasa unitaria: {t} ÷ {n} = {r} por {Bs}. Luego {t2} ÷ {r} = {n2} {Bp}.",
            vars,
          )
        : T(
            "First find the unit rate: {t} ÷ {n} = {r} per {Bs}. Then {r} × {n2} = {t2}.",
            "Primero halla la tasa unitaria: {t} ÷ {n} = {r} por {Bs}. Luego {r} × {n2} = {t2}.",
            vars,
          ),
      h: [
        T(
          "This takes two steps. First find the amount for exactly 1 {Bs}.",
          "Esto lleva dos pasos. Primero halla la cantidad para exactamente 1 {Bs}.",
          vars,
        ),
        T(
          "Divide the first total by its number of {Bp} to get the unit rate.",
          "Divide el primer total entre su número de {Bp} para obtener la tasa unitaria.",
          vars,
        ),
        until
          ? T(
              "Then divide the new total by the unit rate.",
              "Luego divide el nuevo total entre la tasa unitaria.",
            )
          : T(
              "Then multiply the unit rate by the new number of {Bp}.",
              "Luego multiplica la tasa unitaria por el nuevo número de {Bp}.",
              vars,
            ),
      ],
      meta: { id: c.id, t, t2, n, n2, until },
    });
  };
  const uwUseCheck = (/** @type {any} */ it) => {
    const m = it.meta;
    const c = RATES.find((x) => x.id === m.id);
    const a = value(it.a);
    // the two situations are proportional: first total / first count = second total / second count (cross-products)
    return (
      (m.until
        ? m.t * a === m.t2 * m.n
        : m.t * m.n2 === Math.round(a * (c.money ? 100 : 1)) * m.n) ||
      "the two situations are not proportional"
    );
  };

  /** L3: which store, and what is the least to pay for a bigger order */
  const uwBest = (/** @type {any} */ rng) => {
    const c = rng.pick(RATES.filter((r) => r.money && r.better === "low"));
    const [e1, e2] = entsOf(rng, c);
    const who = rng.pick(NAMES);
    const p1 = drawRate(rng, c, 5);
    const p2 = drawRate(rng, c, 5);
    const n1 = rng.int(c.bl, c.bh);
    const n2 = rng.int(c.bl, c.bh);
    if (p1 === p2 || n1 === n2) redo();
    const t = [p1 * n1, p2 * n2];
    const win = p1 < p2 ? 0 : 1;
    if (t[1 - win] >= t[win]) redo(); // the dearer unit price has the smaller pack total
    const need = rng.int(c.bh + 2, c.bh + 14);
    const P = [p1, p2];
    const N = [n1, n2];
    const cost = (/** @type {number} */ u) => ({ v: usd(u), vEs: usd(u) });
    const w = (/** @type {number} */ u, /** @type {any} */ f, /** @type {string} */ tag) => ({
      ...cost(u),
      f,
      tag,
    });
    return mcB(rng, {
      q: T(
        "{s1} {s2} {who} needs {nb}. What is the least {who} can pay?",
        "{s1} {s2} {who} necesita {nb}. ¿Cuál es lo menos que puede pagar {who}?",
        {
          s1: c.say(e1, showA(c, t[0]), showB(c, n1)),
          s2: c.say(e2, showA(c, t[1]), showB(c, n2)),
          who,
          nb: showB(c, need),
        },
      ),
      right: cost(P[win] * need),
      wrong: [
        w(
          P[1 - win] * need,
          T(
            "That uses the dearer unit price. Compare the unit prices first and use the lower one.",
            "Eso usa el precio unitario más alto. Compara primero los precios unitarios y usa el menor.",
          ),
          "compared-wrong-direction",
        ),
        w(
          P[win],
          T(
            "That is the price of 1 {Bs}, only part of the way. {who} needs {need} of them.",
            "Ese es el precio de 1 {Bs}, solo parte del camino. {who} necesita {need}.",
            { Bs: c.B.s, who, need },
          ),
          "stopped-at-unit-rate",
        ),
        w(
          t[win] * need,
          T(
            "That multiplies a pack total by the number needed. Use the price for 1, not the pack total.",
            "Eso multiplica el total de un paquete por el número necesario. Usa el precio de 1, no el total del paquete.",
          ),
          "op-multiplied-instead-of-divided",
        ),
      ],
      x: T(
        "Unit prices: {a} = {p1}, {b} = {p2}. The lower is {win}. {need} × {pw} = {ans}.",
        "Precios unitarios: {a} = {p1}, {b} = {p2}. El menor es {win}. {need} × {pw} = {ans}.",
        {
          a: e1.n,
          b: e2.n,
          p1: usd(p1),
          p2: usd(p2),
          win: (win ? e2 : e1).n,
          need,
          pw: usd(P[win]),
          ans: usd(P[win] * need),
        },
      ),
      h: [
        T(
          "Find which deal has the lower price for 1 {Bs}.",
          "Halla cuál oferta tiene el precio menor por 1 {Bs}.",
          { Bs: c.B.s },
        ),
        T(
          "Divide each total by its number of {Bp} to compare.",
          "Divide cada total entre su número de {Bp} para comparar.",
          { Bp: c.B.p },
        ),
        T(
          "Multiply the lower unit price by the number {who} needs.",
          "Multiplica el precio unitario menor por el número que necesita {who}.",
          { who },
        ),
      ],
      loose: true,
      meta: { t, n: N, need },
    });
  };
  const uwBestCheck = (/** @type {any} */ it) => {
    const { t, n, need } = it.meta;
    const costs = t.map((tt, i) => (tt * need) / n[i]); // cents for the whole order at each deal
    const least = Math.min(...costs);
    return pickOne(it, (txt) => same(Math.round(value(txt) * 100), least, 1e-6));
  };

  /** L4: average rate over two legs (do not average the rates) */
  const uwAverage = (/** @type {any} */ rng) => {
    const c = rng.pick(RATES.filter((r) => !r.money && r.better === "high"));
    const e = entsOf(rng, c)[0];
    const r1 = rng.int(c.lo, c.hi);
    const r2 = rng.int(c.lo, c.hi);
    const n1 = rng.int(1, 5);
    const n2 = rng.int(1, 5);
    if (r1 === r2 || n1 === n2) redo();
    const A = r1 * n1;
    const B = r2 * n2;
    if ((A + B) % (n1 + n2) !== 0) redo();
    const avg = (A + B) / (n1 + n2);
    const mean = (r1 + r2) / 2;
    if (mean === avg || avg === r1 || avg === r2) redo();
    const ch = (/** @type {number} */ u, /** @type {any} */ f, /** @type {string} */ tag) => ({
      v: showRate(c, u)[0],
      vEs: showRate(c, u)[1],
      f,
      tag,
    });
    return mcB(rng, {
      q: T(
        "{s1} Later, {s2} What is the unit rate for both together, in {per}?",
        "{s1} Después, {s2} ¿Cuál es la tasa unitaria de ambas juntas, en {per}?",
        {
          s1: c.say(e, showA(c, A), showB(c, n1)),
          s2: (() => {
            const z = c.say(e, showA(c, B), showB(c, n2));
            return [z[0].charAt(0).toLowerCase() + z[0].slice(1).replace(/^(\S+)/, (m) => m), z[1]];
          })(),
          per: perOf(c),
        },
      ),
      right: { v: showRate(c, avg)[0], vEs: showRate(c, avg)[1] },
      wrong: [
        ch(
          mean,
          T(
            "That averages the two rates. The two parts last different amounts, so add the totals and add the {Bp} first.",
            "Eso promedia las dos tasas. Las dos partes duran distinto, así que primero suma los totales y suma los {Bp}.",
            { Bp: c.B.p },
          ),
          "averaged-rates",
        ),
        ch(
          A + B,
          T(
            "That is the total for both parts, not the amount for 1 {Bs}. Divide by the total {Bp}.",
            "Ese es el total de ambas partes, no la cantidad para 1 {Bs}. Divide entre el total de {Bp}.",
            { Bs: c.B.s, Bp: c.B.p },
          ),
          "rate-not-per-one",
        ),
        ch(
          Math.max(r1, r2),
          T(
            "That is the faster part only. Use both parts together.",
            "Esa es solo la parte más rápida. Usa ambas partes juntas.",
          ),
          "used-one-leg",
        ),
      ],
      x: T(
        "Total: {A} + {B} = {tot}. Total {Bp}: {n1} + {n2} = {nn}. {tot} ÷ {nn} = {avg}, so the unit rate is {rt}.",
        "Total: {A} + {B} = {tot}. Total de {Bp}: {n1} + {n2} = {nn}. {tot} ÷ {nn} = {avg}, así que la tasa unitaria es {rt}.",
        {
          A,
          B,
          tot: A + B,
          Bp: c.B.p,
          n1,
          n2,
          nn: n1 + n2,
          avg,
          rt: showRate(c, avg),
        },
      ),
      h: [
        T(
          "A unit rate for both parts uses the total amount and the total {Bp}.",
          "Una tasa unitaria de ambas partes usa la cantidad total y el total de {Bp}.",
          { Bp: c.B.p },
        ),
        T(
          "Add the two amounts. Then add the two numbers of {Bp}.",
          "Suma las dos cantidades. Luego suma los dos números de {Bp}.",
          { Bp: c.B.p },
        ),
        T(
          "Divide the total amount by the total number of {Bp}.",
          "Divide la cantidad total entre el total de {Bp}.",
          { Bp: c.B.p },
        ),
      ],
      meta: { A, B, n1, n2 },
    });
  };
  const uwAverageCheck = (/** @type {any} */ it) => {
    const { A, B, n1, n2 } = it.meta;
    return pickOne(it, (txt) => same(Number.parseFloat(txt) * (n1 + n2), A + B, 1e-6));
  };

  /** L4: two rates in a row (gallons per minute, then dollars per gallon) */
  const CHAIN2 = [
    {
      r: [3, 12],
      p: [2, 3, 4, 5, 6, 8],
      n: [3, 10],
      t: (/** @type {number} */ r, /** @type {number} */ p, /** @type {number} */ n) =>
        T(
          "A hose fills a tank at {r} gallons per minute. The water costs {p} cents per gallon. What is the cost of the water after {n} minutes of filling? Answer in dollars.",
          "Una manguera llena un tanque a {r} galones por minuto. El agua cuesta {p} centavos por galón. ¿Cuánto cuesta el agua después de {n} minutos de llenado? Responde en dólares.",
          { r, p, n },
        ),
    },
    {
      r: [6, 20],
      p: [2, 3, 5, 6],
      n: [3, 10],
      t: (r, p, n) =>
        T(
          "A printer prints {r} pages per minute. Each page uses {p} cents of ink. What is the cost of the ink for {n} minutes of printing? Answer in dollars.",
          "Una impresora imprime {r} páginas por minuto. Cada página usa {p} centavos de tinta. ¿Cuánto cuesta la tinta de {n} minutos de impresión? Responde en dólares.",
          { r, p, n },
        ),
    },
    {
      r: [4, 12],
      p: [50, 75, 125, 150],
      n: [2, 8],
      t: (r, p, n) =>
        T(
          "A bakery makes {r} muffins per hour and sells each muffin for {p} cents. How much money do the muffins made in {n} hours bring in? Answer in dollars.",
          "Una panadería hace {r} panecillos por hora y vende cada uno por {p} centavos. ¿Cuánto dinero dejan los panecillos hechos en {n} horas? Responde en dólares.",
          { r, p, n },
        ),
    },
  ];
  const uwChain = (/** @type {any} */ rng) => {
    const i = rng.int(0, CHAIN2.length - 1);
    const s = CHAIN2[i];
    const r = rng.int(s.r[0], s.r[1]);
    const p = rng.pick(s.p);
    const n = rng.int(s.n[0], s.n[1]);
    const cents = r * n * p;
    return numB({
      q: s.t(r, p, n),
      a: (cents / 100).toFixed(2),
      fw: [
        {
          v: r * n,
          f: T(
            "That counts the items but not what each one costs. Multiply by the cents next.",
            "Eso cuenta los artículos pero no lo que cuesta cada uno. Multiplica por los centavos a continuación.",
          ),
          tag: "stopped-early",
        },
        {
          v: ((r * p) / 100).toFixed(2),
          f: T(
            "That is the cost for just one unit of time. Use all {n}.",
            "Eso es el costo de una sola unidad de tiempo. Usa los {n}.",
            { n },
          ),
          tag: "stopped-early",
        },
        {
          v: cents,
          f: T(
            "That is in cents. The question asks for dollars, so divide by 100.",
            "Eso está en centavos. La pregunta pide dólares, así que divide entre 100.",
          ),
          tag: "cents-dollars",
        },
      ],
      x: T(
        "{r} × {n} = {items} items. {items} × {p} cents = {cents} cents. {cents} ÷ 100 = ${d}.",
        "{r} × {n} = {items} artículos. {items} × {p} centavos = {cents} centavos. {cents} ÷ 100 = ${d}.",
        { r, n, items: r * n, p, cents, d: (cents / 100).toFixed(2) },
      ),
      h: [
        T(
          "There are two rates. Use the first rate to find the total number of items.",
          "Hay dos tasas. Usa la primera tasa para hallar el número total de artículos.",
        ),
        T(
          "Then use the second rate: multiply the number of items by the cents for each.",
          "Luego usa la segunda tasa: multiplica el número de artículos por los centavos de cada uno.",
        ),
        T("Change cents to dollars at the end.", "Cambia los centavos a dólares al final."),
      ],
      meta: { i, r, p, n },
    });
  };
  const uwChainCheck = (/** @type {any} */ it) => {
    const { r, p, n } = it.meta;
    let cents = 0;
    for (let k = 0; k < n; k++) cents += r * p; // one minute (or hour) at a time
    return wantNum(it, cents / 100);
  };

  suite("unitRateWord", "Unit rate word problems", "Problemas de tasas unitarias", {
    1: [form("apply", uwUse(false), uwUseCheck)],
    2: [form("until", uwUse(true), uwUseCheck)],
    3: [form("best", uwBest, uwBestCheck)],
    4: [form("average", uwAverage, uwAverageCheck), form("chain", uwChain, uwChainCheck)],
  });

  /* ===================================================================================================
   * eqRatioMissing (3-9): a:b = c:d with one number missing
   * =================================================================================================== */
  const eqLine = (/** @type {number[]} */ v, /** @type {number} */ blank) =>
    `${blank === 0 ? "?" : v[0]}:${blank === 1 ? "?" : v[1]} = ${blank === 2 ? "?" : v[2]}:${blank === 3 ? "?" : v[3]}`;
  /** do the four numbers form equivalent ratios? (cross-products) */
  const eqHolds = (/** @type {number[]} */ v) => v[0] * v[3] === v[1] * v[2];

  const eqTexts = {
    add: T(
      "That adds the same amount to both terms. Equivalent ratios multiply or divide both terms by the same factor.",
      "Eso suma la misma cantidad a ambos términos. Las razones equivalentes multiplican o dividen ambos términos por el mismo factor.",
    ),
    one: T(
      "That copies a number instead of scaling it. Both terms of a ratio must be scaled by the same factor.",
      "Eso copia un número en lugar de escalarlo. Ambos términos de una razón deben escalarse por el mismo factor.",
    ),
    inv: T(
      "That scales the wrong way round. Match each term with the same term of the other ratio.",
      "Eso escala al revés. Empareja cada término con el mismo término de la otra razón.",
    ),
  };
  /** wrong values for a blank: additive, copied, flipped */
  const eqWrong = (/** @type {number[]} */ v, /** @type {number} */ blank) => {
    const across = blank < 2 ? blank + 2 : blank - 2;
    const pr = blank ^ 1;
    const acrossPr = pr < 2 ? pr + 2 : pr - 2;
    // additive: the same difference applied to the term across
    const additive = v[across] + (v[acrossPr] - v[pr]);
    return [
      [additive, eqTexts.add, "ratio-scaled-additively"],
      [v[across], eqTexts.one, "ratio-one-term-scaled"],
      [v[pr], eqTexts.inv, "ratio-inverted"],
    ];
  };
  const eqFill = (
    /** @type {number[]} */ v,
    /** @type {number} */ blank,
    /** @type {number} */ x,
  ) => v.map((n, i) => (i === blank ? x : n));
  const eqCheckValue = (/** @type {any} */ it) => {
    const { v, blank } = it.meta;
    return (
      eqHolds(
        eqFill(v, blank, 0).map((n, i) =>
          i === blank ? value(it.k === "mc" ? it.c[it.a] : it.a) : n,
        ),
      ) || "filling the answer does not make the ratios equivalent"
    );
  };

  /** build either a typed or multiple-choice item for a missing term */
  const eqItem = (/** @type {any} */ rng, /** @type {any} */ o) => {
    const { v, blank, q, x, h, asMc } = o;
    const ans = v[blank];
    const wr = eqWrong(v, blank);
    const meta = { v, blank };
    if (!asMc)
      return numB({
        q,
        a: ans,
        fw: wr.map(([val, f, tag]) => ({ v: val, f, tag })),
        x,
        h,
        meta,
      });
    return mcB(rng, {
      q,
      right: String(ans),
      wrong: wr.map(([val, f, tag]) => ({ v: String(val), f, tag })),
      x,
      h,
      meta,
    });
  };
  const eqHints = (
    /** @type {number[]} */ v,
    /** @type {number} */ blank,
    /** @type {boolean} */ easy,
  ) => {
    const across = blank < 2 ? blank + 2 : blank - 2;
    const pr = blank ^ 1;
    const acrossPr = pr < 2 ? pr + 2 : pr - 2;
    return [
      T(
        "Equivalent ratios come from multiplying or dividing both terms by the same number.",
        "Las razones equivalentes salen de multiplicar o dividir ambos términos por el mismo número.",
      ),
      T(
        "Look at the two terms you can match: {a} and {b}. What do you do to {a} to get {b}?",
        "Mira los dos términos que puedes emparejar: {a} y {b}. ¿Qué haces con {a} para obtener {b}?",
        { a: v[pr], b: v[acrossPr] },
      ),
      easy
        ? T("Do the same thing to the other term, {c}.", "Haz lo mismo con el otro término, {c}.", {
            c: v[across],
          })
        : T(
            "Find the scale factor, which may be a fraction. Then do the same thing to {c}.",
            "Halla el factor de escala, que puede ser una fracción. Luego haz lo mismo con {c}.",
            { c: v[across] },
          ),
    ];
  };

  /** L1: whole-number scale factor up, blank on the right */
  const emInt = (/** @type {any} */ rng) => {
    const [p, q] = coprimePair(rng, 2, 9);
    const k = rng.int(2, 9);
    const v = [p, q, p * k, q * k];
    const blank = rng.pick([2, 3]);
    const c = rng.pick(MIX);
    const story = rng.chance(0.5);
    const ask = story
      ? blank === 3
        ? T(
            "A batch of {mix} uses {A} for every {B}. How many {unitn} of {nb} go with {K} {unitn} of {na}?",
            "Una tanda de {mix} usa {A} por cada {B}. ¿Cuántas {unitn} de {nb} van con {K} {unitn} de {na}?",
            {
              mix: c.mix,
              A: np(c.a, p),
              B: np(c.b, q),
              unitn: c.unit,
              nb: c.nb,
              na: c.na,
              K: v[2],
            },
          )
        : T(
            "A batch of {mix} uses {A} for every {B}. How many {unitn} of {na} go with {K} {unitn} of {nb}?",
            "Una tanda de {mix} usa {A} por cada {B}. ¿Cuántas {unitn} de {na} van con {K} {unitn} de {nb}?",
            {
              mix: c.mix,
              A: np(c.a, p),
              B: np(c.b, q),
              unitn: c.unit,
              nb: c.nb,
              na: c.na,
              K: v[3],
            },
          )
      : T("Find the missing number: {eq}", "Halla el número que falta: {eq}", {
          eq: eqLine(v, blank),
        });
    return eqItem(rng, {
      v,
      blank,
      asMc: false,
      q: ask,
      x: T(
        "The terms {a} and {b} show the scale factor: {a} × {k} = {b}. So the missing number is {t} × {k} = {ans}.",
        "Los términos {a} y {b} muestran el factor de escala: {a} × {k} = {b}. Así que el número que falta es {t} × {k} = {ans}.",
        {
          a: v[(blank ^ 1) - 2],
          b: v[blank ^ 1],
          k,
          t: v[blank - 2],
          ans: v[blank],
        },
      ),
      h: eqHints(v, blank, true),
    });
  };

  /** L2: scale up or down, the blank can be anywhere; multiple choice or typed */
  const emAny = (/** @type {any} */ rng) => {
    const [p, q] = coprimePair(rng, 2, 9);
    const [k1, k2] = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 2);
    const v = [p * k1, q * k1, p * k2, q * k2];
    const blank = rng.int(0, 3);
    const k = Math.max(k1, k2) / Math.min(k1, k2);
    return eqItem(rng, {
      v,
      blank,
      asMc: rng.chance(0.5),
      q: T("Find the missing number: {eq}", "Halla el número que falta: {eq}", {
        eq: eqLine(v, blank),
      }),
      x: T(
        "In the ratio with the blank, the other term shows the scale factor compared with the other ratio. Apply the same factor to the term across from the blank. The missing number is {ans}.",
        "En la razón con el espacio vacío, el otro término muestra el factor de escala respecto a la otra razón. Aplica el mismo factor al término que está frente al espacio. El número que falta es {ans}.",
        { ans: v[blank] },
      ),
      h: eqHints(v, blank, k % 1 === 0),
    });
  };

  /** L3: the scale factor is not a whole number */
  const emFrac = (/** @type {any} */ rng) => {
    const [p, q] = coprimePair(rng, 2, 6);
    const pairs = [
      [2, 3],
      [2, 5],
      [2, 7],
      [4, 6],
      [4, 10],
      [3, 6],
      [6, 9],
    ];
    const [k1, k2] = rng.pick(pairs);
    if (k2 % k1 === 0 || k1 % k2 === 0) redo();
    const flip = rng.chance(0.5);
    const [a, b] = flip ? [k2, k1] : [k1, k2];
    const v = [p * a, q * a, p * b, q * b];
    const blank = rng.int(0, 3);
    return eqItem(rng, {
      v,
      blank,
      asMc: false,
      q: T("Find the missing number: {eq}", "Halla el número que falta: {eq}", {
        eq: eqLine(v, blank),
      }),
      x: T(
        "First scale to the simplest ratio, {p}:{q}, then up to the other ratio. The missing number is {ans}.",
        "Primero lleva la razón a su forma más simple, {p}:{q}, y luego escala hasta la otra razón. El número que falta es {ans}.",
        { p, q, ans: v[blank] },
      ),
      h: [
        T(
          "The scale factor is not a whole number, so go through the simplest ratio.",
          "El factor de escala no es un número entero, así que pasa por la razón más simple.",
        ),
        T(
          "Divide both terms of the complete ratio by their greatest common factor.",
          "Divide ambos términos de la razón completa entre su máximo común divisor.",
        ),
        T(
          "Now multiply that simple ratio to match the number you are given in the other ratio.",
          "Ahora multiplica esa razón simple para coincidir con el número que te dan en la otra razón.",
        ),
      ],
    });
  };

  /** L4: the scale factor hides in a third quantity (servings) */
  const emServings = (/** @type {any} */ rng) => {
    const c = rng.pick(MIX);
    const s1 = rng.pick([2, 4, 6, 8]);
    const kk = rng.pick([
      [3, 2],
      [5, 2],
      [3, 1],
      [4, 1],
      [5, 1],
      [7, 2],
      [5, 4],
    ]);
    const s2 = (s1 * kk[0]) / kk[1];
    if (!Number.isInteger(s2) || s2 === s1) redo();
    const a = rng.int(1, 4) * kk[1];
    const b = rng.int(1, 4) * kk[1];
    if ((a * s2) % s1 || (b * s2) % s1) redo();
    const askB = rng.chance(0.5);
    const ans = ((askB ? b : a) * s2) / s1;
    return numB({
      q: T(
        "A recipe for {s1} servings of {mix} uses {A} and {B}. How many {unit} of {n} are needed for {s2} servings?",
        "Una receta para {s1} porciones de {mix} usa {A} y {B}. ¿Cuántas {unit} de {n} se necesitan para {s2} porciones?",
        {
          s1,
          mix: c.mix,
          A: np(c.a, a),
          B: np(c.b, b),
          unit: c.unit,
          n: askB ? c.nb : c.na,
          s2,
        },
      ),
      a: ans,
      fw: [
        {
          v: (askB ? b : a) + (s2 - s1),
          f: T(
            "That adds the extra servings. Servings are scaled by multiplying, and so is every ingredient.",
            "Eso suma las porciones adicionales. Las porciones se escalan multiplicando, y también cada ingrediente.",
          ),
          tag: "ratio-scaled-additively",
        },
        {
          v: askB ? b : a,
          f: T(
            "That is the amount for the original servings. The question asks about {s2} servings.",
            "Esa es la cantidad para las porciones originales. La pregunta es sobre {s2} porciones.",
            { s2 },
          ),
          tag: "forgot-scale",
        },
        {
          v: (askB ? a : b) * (s2 / s1),
          f: T(
            "That is the other ingredient. Check which one the question asks about.",
            "Ese es el otro ingrediente. Revisa cuál pregunta la pregunta.",
          ),
          tag: "wrong-group",
        },
      ],
      x: T(
        "The servings go from {s1} to {s2}, so every amount is multiplied by {s2}/{s1}. {t} × {s2} ÷ {s1} = {ans}.",
        "Las porciones pasan de {s1} a {s2}, así que cada cantidad se multiplica por {s2}/{s1}. {t} × {s2} ÷ {s1} = {ans}.",
        { s1, s2, t: askB ? b : a, ans },
      ),
      h: [
        T(
          "The scale factor is hidden in the servings. Compare {s1} servings with {s2} servings.",
          "El factor de escala está oculto en las porciones. Compara {s1} porciones con {s2} porciones.",
          { s1, s2 },
        ),
        T(
          "Find what you multiply {s1} by to get {s2}. It may not be a whole number.",
          "Halla por cuánto multiplicas {s1} para obtener {s2}. Puede no ser un número entero.",
          { s1, s2 },
        ),
        T(
          "Multiply the ingredient amount by that same factor.",
          "Multiplica la cantidad del ingrediente por ese mismo factor.",
        ),
      ],
      meta: { s1, s2, a, b, askB },
    });
  };
  const emServingsCheck = (/** @type {any} */ it) => {
    const { s1, s2, a, b, askB } = it.meta;
    const t = askB ? b : a;
    return same(value(it.a) * s1, t * s2) || "answer is not in proportion to the servings";
  };

  /** L4: two missing numbers in one chain of equal ratios */
  const emTwo = (/** @type {any} */ rng) => {
    const [p, q] = coprimePair(rng, 2, 7);
    const [k1, k2, k3] = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3);
    const row = [(k) => p * k, (k) => q * k];
    const line = `${p * k1}:${q * k1} = ?:${q * k2} = ${p * k3}:?`;
    const A = row[0](k2);
    const B = row[1](k3);
    const pair = (x, y) => ({ v: `${x} and ${y}`, vEs: `${x} y ${y}` });
    const w = (x, y, f, tag) => ({ ...pair(x, y), f, tag });
    return mcB(rng, {
      q: T(
        "Find the two missing numbers, in order: {line}",
        "Halla los dos números que faltan, en orden: {line}",
        { line },
      ),
      right: pair(A, B),
      wrong: [
        w(
          p * k1 + (q * k2 - q * k1),
          q * k1 + (p * k3 - p * k1),
          eqTexts.add,
          "ratio-scaled-additively",
        ),
        w(
          B,
          A,
          T(
            "Those are in the wrong order. The first blank is the first term of the middle ratio.",
            "Esos están en el orden equivocado. El primer espacio es el primer término de la razón del medio.",
          ),
          "ratio-inverted",
        ),
        w(
          A,
          q * k2,
          T(
            "The second blank repeats the middle ratio's second term instead of scaling the first ratio up to {c}.",
            "El segundo espacio repite el segundo término de la razón del medio en lugar de escalar la primera razón hasta {c}.",
            { c: p * k3 },
          ),
          "wrong-row-factor",
        ),
        w(
          p * k3,
          B,
          T(
            "The first blank uses the last ratio's first term. Each blank has its own factor.",
            "El primer espacio usa el primer término de la última razón. Cada espacio tiene su propio factor.",
          ),
          "wrong-row-factor",
        ),
      ],
      x: T(
        "In the middle ratio the second term went from {q1} to {q2}. Do the same to {p1} and it becomes {A}. In the last ratio the first term went from {p1} to {p3}. Do the same to {q1} and it becomes {B}.",
        "En la razón del medio el segundo término pasó de {q1} a {q2}. Haz lo mismo con {p1} y se convierte en {A}. En la última razón el primer término pasó de {p1} a {p3}. Haz lo mismo con {q1} y se convierte en {B}.",
        { q2: q * k2, q1: q * k1, p1: p * k1, p3: p * k3, A, B },
      ),
      h: [
        T(
          "Each blank has its own scale factor from the first ratio. Do one at a time.",
          "Cada espacio tiene su propio factor de escala desde la primera razón. Hazlos uno a la vez.",
        ),
        T(
          "For each blank, use the number in the same ratio to find the factor.",
          "Para cada espacio, usa el número de la misma razón para hallar el factor.",
        ),
        T(
          "Multiply the matching term of the first ratio by that factor.",
          "Multiplica el término correspondiente de la primera razón por ese factor.",
        ),
      ],
      meta: { p, q, k: [k1, k2, k3] },
    });
  };
  const emTwoCheck = (/** @type {any} */ it) => {
    const { p, q, k } = it.meta;
    const first = [p * k[0], q * k[0]];
    return pickOne(it, (txt) => {
      const m = txt.match(/^(\d+) and (\d+)$/);
      if (!m) return false;
      return (
        eqHolds([first[0], first[1], Number(m[1]), q * k[1]]) &&
        eqHolds([first[0], first[1], p * k[2], Number(m[2])])
      );
    });
  };

  suite(
    "eqRatioMissing",
    "Missing numbers in equivalent ratios",
    "Números que faltan en razones equivalentes",
    {
      1: [form("int", emInt, eqCheckValue)],
      2: [form("any", emAny, eqCheckValue)],
      3: [form("frac", emFrac, eqCheckValue)],
      4: [form("servings", emServings, emServingsCheck), form("two", emTwo, emTwoCheck)],
    },
  );
})();
