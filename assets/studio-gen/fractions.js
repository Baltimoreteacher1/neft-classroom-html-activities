/**
 * Practice Studio generators: fraction division (lessons 6-1, 6-2, 6-9, 6-10, 6-11).
 *   fracDivWhole  6-1   unit fractions and fractions by whole numbers; whole numbers by unit fractions
 *   fracDivMixed  6-2   fraction by fraction, mixed numbers, two-step
 *   wholeDivFrac  6-9   whole number by a fraction: reciprocal, estimates, missing values
 *   mixedDivide   6-10  convert, invert, multiply, simplify with mixed numbers
 *   fracDivWord   6-11  how many groups fit / how much is in one group, leftovers, two stages
 *
 * Every quotient is exact. make() multiplies by the reciprocal (lowest terms through gcd); check() never does:
 * it parses what the item SHOWS and verifies quotient x divisor = dividend with integer cross-multiplication.
 * Text that has a Spanish sibling is written "English | Español" and split by en() / es().
 * Mistake tags (kebab-case, one vocabulary across the five generators) end up in item.tag[] for choices and in
 * item.fw[].tag for typed answers, which is what the Mistake Map reads.
 */
(() => {
  const W = /** @type {any} */ (window);
  const R = W.StudioGen;
  if (!R?.register)
    throw new Error("studio-gen/fractions.js needs studio-gen/core.js loaded first");

  /* ---- exact fractions: [numerator, denominator] in lowest terms ------------------------------- */
  const rat = (n, d = 1) => {
    const g = R.gcd(n, d) || 1;
    return [n / g, d / g];
  };
  const mul = (a, b) => rat(a[0] * b[0], a[1] * b[1]);
  const div = (a, b) => rat(a[0] * b[1], a[1] * b[0]);
  const plus = (a, b) => rat(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const minus = (a, b) => rat(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const inv = (a) => [a[1], a[0]];
  const same = (a, b) => a[0] * b[1] === a[1] * b[0];
  const whole = (a) => Math.floor(a[0] / a[1]);
  const frac = (a) => minus(a, [whole(a), 1]);
  const isMixed = (a) => a[1] > 1 && a[0] > a[1];
  const mixedOf = (w, n, d) => rat(w * d + n, d);
  /** Simplest form, mixed: "2 1/3". */
  const S = (a) => R.mixed(a[0], a[1]);
  /** Improper form: "7/3"; whole numbers print bare. */
  const FR = (a) => (a[1] === 1 ? String(a[0]) : `${a[0]}/${a[1]}`);
  const ask = (a, b) => `${S(a)} ÷ ${S(b)}`;

  /* ---- bilingual strings: "English | Español" ----------------------------------------------------- */
  const en = (s) => String(s).split(" | ")[0];
  const es = (s) => {
    const p = String(s).split(" | ");
    return p[p.length - 1];
  };
  const cat = (...p) => {
    const a = p.filter(Boolean);
    return `${a.map(en).join(" ")} | ${a.map(es).join(" ")}`;
  };
  const norm = (s) => String(s).trim().toLowerCase();

  /* ---- quantities with units ---------------------------------------------------------------------- */
  const UNIT = {
    yd: ["yard", "yards", "yarda", "yardas"],
    cup: ["cup", "cups", "taza", "tazas"],
    lb: ["pound", "pounds", "libra", "libras"],
    gal: ["gallon", "gallons", "galón", "galones"],
    mi: ["mile", "miles", "milla", "millas"],
    ac: ["acre", "acres", "acre", "acres"],
    hr: ["hour", "hours", "hora", "horas"],
    pz: ["pizza", "pizzas", "pizza", "pizzas", true],
  };
  /** "3/4 cup", "1 1/2 cups", "3/4 of a pizza" / "3/4 de taza", "1 1/2 tazas". */
  const qty = (a, u, sp) => {
    const [e1, e2, s1, s2, part] = UNIT[u];
    const v = a[0] / a[1];
    if (v === 1) return `1 ${sp ? s1 : e1}`;
    if (v < 1) return sp ? `${S(a)} de ${s1}` : `${S(a)} ${part ? `of a ${e1}` : e1}`;
    return `${S(a)} ${sp ? s2 : e2}`;
  };
  /** "3-yard" / "de 3 yardas". */
  const adj = (a, u, sp) => (sp ? `de ${qty(a, u, true)}` : `${S(a)}-${UNIT[u][0]}`);
  /** The label after an answer box for a measurement, matched to the answer's size. */
  const uLab = (u, a) => {
    const [e1, e2, s1, s2, part] = UNIT[u];
    const v = a[0] / a[1];
    if (v === 1) return `${e1} | ${s1}`;
    return v < 1 ? `${part ? `of a ${e1}` : e1} | de ${s1}` : `${e2} | ${s2}`;
  };
  const NAMES = ["Mia", "Leo", "Ana", "Sam", "Dara", "Kofi", "Noor", "Luis", "Priya", "Omar"];
  /** Fill {T} {P} {E} {A} {B} (amounts, {T:a} = adjective form) and {k} {n} {b} {F} {N} (plain). */
  const fill = (pair, vars, u) => {
    const sub = (s, sp) =>
      s.replace(/\{(\w)(:a)?\}/g, (_, k, a) => {
        const v = vars[k];
        return Array.isArray(v) ? (a ? adj(v, u, sp) : qty(v, u, sp)) : String(v);
      });
    return `${sub(en(pair), false)} | ${sub(es(pair), true)}`;
  };

  /* ---- story kits: one context, every shape ---------------------------------------------------------
   * G group (T total, P size of one group): body, question, "full" question   S share (T among k)
   * W whole (part P is the fraction F of the whole)   RG / RS reverse stories   X second stage (m per group)
   * I interpret phrases   M multiply / add stories for "which story matches"   N plural noun, n1 singular, a1 "one more"
   */
  const KITS = [
    {
      id: "ribbon",
      u: "yd",
      N: "pieces | trozos",
      n1: "piece | trozo",
      a1: "one more piece | un trozo más",
      G: [
        "A {T:a} ribbon is cut into {P:a} pieces. | Una cinta {T:a} se corta en trozos {P:a}.",
        "How many pieces can be cut? | ¿Cuántos trozos se pueden cortar?",
        "How many full pieces can be cut? | ¿Cuántos trozos completos se pueden cortar?",
      ],
      S: [
        "A {T:a} ribbon is cut into {k} equal pieces. | Una cinta {T:a} se corta en {k} trozos iguales.",
        "How long is each piece? | ¿Cuánto mide cada trozo?",
      ],
      W: [
        "{N} used {P} of ribbon to wrap gifts. That is {F} of the whole roll. | {N} usó {P} de cinta para envolver regalos. Eso es {F} del rollo completo.",
        "How much ribbon is on the whole roll? | ¿Cuánta cinta hay en el rollo completo?",
      ],
      RG: "{N} cuts a ribbon into {P:a} pieces and gets {n} pieces. How long was the ribbon? | {N} corta una cinta en trozos {P:a} y obtiene {n} trozos. ¿Cuánto medía la cinta?",
      RS: "{N} cuts a ribbon into {k} equal pieces. Each piece is {E} long. How long was the ribbon? | {N} corta una cinta en {k} trozos iguales. Cada trozo mide {E}. ¿Cuánto medía la cinta?",
      X: [
        "Every {m} pieces are tied into one bundle. | Cada {m} trozos se atan en un paquete.",
        "How many full bundles are there? | ¿Cuántos paquetes completos hay?",
      ],
      I: {
        cnt: "the number of pieces | la cantidad de trozos",
        pc: "the length of one piece | la longitud de un trozo",
        tot: "the length of the whole ribbon | la longitud de toda la cinta",
        shn: "the number of pieces | la cantidad de trozos",
        sh: "the length of one piece | la longitud de un trozo",
      },
    },
    {
      id: "pizza",
      u: "pz",
      N: "servings | porciones",
      n1: "serving | porción",
      a1: "one more serving | una porción más",
      fit: (s, v) =>
        s === "G"
          ? v.P[0] <= v.P[1]
          : s === "S"
            ? v.T[0] < v.T[1]
            : s === "RG"
              ? v.P[0] < v.P[1]
              : s === "RS"
                ? v.E[0] < v.E[1]
                : s !== "X" || v.P[0] <= v.P[1],
      G: [
        "A pizza shop has {T}. Each serving is {P}. | Una pizzería tiene {T}. Cada porción es de {P}.",
        "How many servings can the shop make? | ¿Cuántas porciones puede preparar la pizzería?",
        "How many full servings can the shop make? | ¿Cuántas porciones completas puede preparar la pizzería?",
      ],
      S: [
        "{N} has {T} left over and shares it equally among {k} friends. | {N} tiene {T} de sobra y la reparte en partes iguales entre {k} amigos.",
        "How much pizza does each friend get? | ¿Cuánta pizza recibe cada amigo?",
      ],
      RG: "A pizza shop makes {n} servings. Each serving is {P}. How much pizza did the shop use? | Una pizzería prepara {n} porciones. Cada porción es de {P}. ¿Cuánta pizza usó la pizzería?",
      RS: "{N} shared pizza equally among {k} friends. Each friend got {E}. How much pizza did {N} share? | {N} repartió pizza en partes iguales entre {k} amigos. Cada amigo recibió {E}. ¿Cuánta pizza repartió {N}?",
      X: [
        "Every {m} servings go in one box. | Cada {m} porciones van en una caja.",
        "How many full boxes are there? | ¿Cuántas cajas completas hay?",
      ],
      I: {
        cnt: "the number of servings | la cantidad de porciones",
        pc: "the amount of pizza in one serving | la cantidad de pizza en una porción",
        tot: "the amount of pizza at the start | la cantidad de pizza al inicio",
        shn: "the number of friends | la cantidad de amigos",
        sh: "the amount of pizza each friend gets | la cantidad de pizza que recibe cada amigo",
      },
    },
    {
      id: "trailmix",
      u: "lb",
      N: "bags | bolsas",
      n1: "bag | bolsa",
      a1: "one more bag | una bolsa más",
      G: [
        "A bin holds {T} of trail mix. Each snack bag gets {P}. | Un recipiente tiene {T} de mezcla de frutos secos. Cada bolsa lleva {P}.",
        "How many bags can be filled? | ¿Cuántas bolsas se pueden llenar?",
        "How many full bags can be filled? | ¿Cuántas bolsas completas se pueden llenar?",
      ],
      S: [
        "{N} shares {T} of trail mix equally among {k} hikers. | {N} reparte {T} de mezcla de frutos secos en partes iguales entre {k} excursionistas.",
        "How much trail mix does each hiker get? | ¿Cuánta mezcla recibe cada excursionista?",
      ],
      W: [
        "{N} poured {P} of trail mix into a jar. That filled {F} of the jar. | {N} echó {P} de mezcla de frutos secos en un frasco. Eso llenó {F} del frasco.",
        "How much trail mix does a full jar hold? | ¿Cuánta mezcla cabe en un frasco lleno?",
      ],
      RG: "{N} fills {n} bags with trail mix. Each bag gets {P}. How much trail mix did {N} use? | {N} llena {n} bolsas con mezcla de frutos secos. Cada bolsa lleva {P}. ¿Cuánta mezcla usó {N}?",
      RS: "{N} shared trail mix equally among {k} hikers. Each hiker got {E}. How much trail mix did {N} share? | {N} repartió mezcla de frutos secos en partes iguales entre {k} excursionistas. Cada excursionista recibió {E}. ¿Cuánta mezcla repartió {N}?",
      X: [
        "Every {m} bags go in one box. | Cada {m} bolsas van en una caja.",
        "How many full boxes are there? | ¿Cuántas cajas completas hay?",
      ],
      I: {
        cnt: "the number of bags | la cantidad de bolsas",
        pc: "the amount of trail mix in one bag | la cantidad de mezcla en una bolsa",
        tot: "the amount of trail mix at the start | la cantidad de mezcla al inicio",
        shn: "the number of hikers | la cantidad de excursionistas",
        sh: "the amount of trail mix each hiker gets | la cantidad de mezcla que recibe cada excursionista",
      },
      M: [
        "Each hiker gets {A} of trail mix. How much trail mix do {b} hikers get in all? | Cada excursionista recibe {A} de mezcla de frutos secos. ¿Cuánta mezcla reciben {b} excursionistas en total?",
        "{N} has {A} of trail mix and gets {B} more. How much trail mix does {N} have now? | {N} tiene {A} de mezcla de frutos secos y recibe {B} más. ¿Cuánta mezcla tiene {N} ahora?",
      ],
    },
    {
      id: "garden",
      u: "ac",
      N: "plots | parcelas",
      n1: "plot | parcela",
      a1: "one more plot | una parcela más",
      G: [
        "A farm has {T} of land. Each garden plot uses {P}. | Una granja tiene {T} de terreno. Cada parcela de jardín usa {P}.",
        "How many plots can the farm make? | ¿Cuántas parcelas puede hacer la granja?",
        "How many full plots can the farm make? | ¿Cuántas parcelas completas puede hacer la granja?",
      ],
      S: [
        "A community garden covers {T}. It is divided equally among {k} families. | Un huerto comunitario ocupa {T}. Se divide en partes iguales entre {k} familias.",
        "How much land does each family get? | ¿Cuánto terreno recibe cada familia?",
      ],
      W: [
        "A farmer has planted {P} of a field. That is {F} of the whole field. | Un agricultor ha sembrado {P} de un campo. Eso es {F} de todo el campo.",
        "How big is the whole field? | ¿Qué tamaño tiene todo el campo?",
      ],
      RG: "A farm makes {n} garden plots. Each plot uses {P}. How much land do the plots use in all? | Una granja hace {n} parcelas de jardín. Cada parcela usa {P}. ¿Cuánto terreno usan las parcelas en total?",
      RS: "A community garden is divided equally among {k} families. Each family gets {E}. How big is the garden? | Un huerto comunitario se divide en partes iguales entre {k} familias. Cada familia recibe {E}. ¿Qué tamaño tiene el huerto?",
      X: [
        "Every {m} plots form one garden block. | Cada {m} parcelas forman un bloque de jardín.",
        "How many full blocks are there? | ¿Cuántos bloques completos hay?",
      ],
      I: {
        cnt: "the number of plots | la cantidad de parcelas",
        pc: "the size of one plot | el tamaño de una parcela",
        tot: "the amount of land at the start | la cantidad de terreno al inicio",
        shn: "the number of families | la cantidad de familias",
        sh: "the amount of land each family gets | la cantidad de terreno que recibe cada familia",
      },
      M: [
        "Each family gets {A} of land. How much land do {b} families get in all? | Cada familia recibe {A} de terreno. ¿Cuánto terreno reciben {b} familias en total?",
        "{N} has {A} of land and buys {B} more. How much land does {N} have now? | {N} tiene {A} de terreno y compra {B} más. ¿Cuánto terreno tiene {N} ahora?",
      ],
    },
    {
      id: "paint",
      u: "gal",
      N: "doors | puertas",
      n1: "door | puerta",
      a1: "one more door | una puerta más",
      G: [
        "{N} has {T} of paint. One cabinet door takes {P}. | {N} tiene {T} de pintura. Una puerta de gabinete necesita {P}.",
        "How many doors can {N} paint? | ¿Cuántas puertas puede pintar {N}?",
        "How many doors can {N} paint completely? | ¿Cuántas puertas puede pintar {N} por completo?",
      ],
      S: [
        "{N} has {T} of paint and pours the paint equally into {k} cups. | {N} tiene {T} de pintura y vierte la pintura en partes iguales en {k} vasos.",
        "How much paint is in each cup? | ¿Cuánta pintura hay en cada vaso?",
      ],
      W: [
        "{N} used {P} of paint on a fence. That was {F} of the fence. | {N} usó {P} de pintura en una cerca. Eso fue {F} de la cerca.",
        "How much paint would the whole fence need? | ¿Cuánta pintura necesitaría toda la cerca?",
      ],
      RG: "{N} paints {n} doors. Each door takes {P} of paint. How much paint did {N} use? | {N} pinta {n} puertas. Cada puerta necesita {P} de pintura. ¿Cuánta pintura usó {N}?",
      RS: "{N} poured paint equally into {k} cups. Each cup has {E}. How much paint did {N} pour? | {N} vertió pintura en partes iguales en {k} vasos. Cada vaso tiene {E}. ¿Cuánta pintura vertió {N}?",
      X: [
        "Every {m} doors make one set. | Cada {m} puertas forman un juego.",
        "How many full sets are there? | ¿Cuántos juegos completos hay?",
      ],
      I: {
        cnt: "the number of doors | la cantidad de puertas",
        pc: "the amount of paint for one door | la cantidad de pintura para una puerta",
        tot: "the amount of paint at the start | la cantidad de pintura al inicio",
        shn: "the number of cups | la cantidad de vasos",
        sh: "the amount of paint in each cup | la cantidad de pintura en cada vaso",
      },
      M: [
        "Each cup has {A} of paint. How much paint is in {b} cups in all? | Cada vaso tiene {A} de pintura. ¿Cuánta pintura hay en {b} vasos en total?",
        "{N} has {A} of paint and buys {B} more. How much paint does {N} have now? | {N} tiene {A} de pintura y compra {B} más. ¿Cuánta pintura tiene {N} ahora?",
      ],
    },
    {
      id: "relay",
      u: "mi",
      N: "legs | tramos",
      n1: "leg | tramo",
      a1: "one more leg | un tramo más",
      G: [
        "A relay race is {T} long. Each runner runs {P}. | Una carrera de relevos mide {T}. Cada corredor recorre {P}.",
        "How many legs are in the race? | ¿Cuántos tramos tiene la carrera?",
        "How many full legs are in the race? | ¿Cuántos tramos completos tiene la carrera?",
      ],
      S: [
        "A {T:a} relay race is split equally among {k} runners. | Una carrera de relevos {T:a} se divide en partes iguales entre {k} corredores.",
        "How far does each runner run? | ¿Qué distancia recorre cada corredor?",
      ],
      W: [
        "{N} ran {P} of a race. That was {F} of the whole race. | {N} corrió {P} de una carrera. Eso fue {F} de la carrera completa.",
        "How long is the whole race? | ¿Cuánto mide la carrera completa?",
      ],
      RG: "A relay race has {n} legs. Each leg is {P} long. How long is the race? | Una carrera de relevos tiene {n} tramos. Cada tramo mide {P}. ¿Cuánto mide la carrera?",
      RS: "A relay race is split equally among {k} runners. Each runner runs {E}. How long is the race? | Una carrera de relevos se divide en partes iguales entre {k} corredores. Cada corredor recorre {E}. ¿Cuánto mide la carrera?",
      X: [
        "Every {m} legs are run by one team. | Cada {m} tramos los corre un equipo.",
        "How many full teams are there? | ¿Cuántos equipos completos hay?",
      ],
      I: {
        cnt: "the number of legs | la cantidad de tramos",
        pc: "the length of one leg | la longitud de un tramo",
        tot: "the length of the whole race | la longitud de toda la carrera",
        shn: "the number of runners | la cantidad de corredores",
        sh: "the distance each runner runs | la distancia que recorre cada corredor",
      },
      M: [
        "Each runner runs {A}. How far do {b} runners run in all? | Cada corredor recorre {A}. ¿Qué distancia recorren {b} corredores en total?",
        "{N} runs {A} and then runs {B} more. How far does {N} run in all? | {N} corre {A} y luego corre {B} más. ¿Qué distancia corre {N} en total?",
      ],
    },
    {
      id: "juice",
      u: "cup",
      N: "glasses | vasos",
      n1: "glass | vaso",
      a1: "one more glass | un vaso más",
      G: [
        "A pitcher holds {T} of juice. Each glass gets {P}. | Una jarra tiene {T} de jugo. Cada vaso recibe {P}.",
        "How many glasses can be filled? | ¿Cuántos vasos se pueden llenar?",
        "How many full glasses can be filled? | ¿Cuántos vasos completos se pueden llenar?",
      ],
      S: [
        "{N} pours {T} of juice equally into {k} glasses. | {N} sirve {T} de jugo en partes iguales en {k} vasos.",
        "How much juice is in each glass? | ¿Cuánto jugo hay en cada vaso?",
      ],
      W: [
        "A jug has {P} of juice in it. That fills {F} of the jug. | Una jarra tiene {P} de jugo. Eso llena {F} de la jarra.",
        "How much juice does a full jug hold? | ¿Cuánto jugo cabe en una jarra llena?",
      ],
      RG: "{N} fills {n} glasses with juice. Each glass gets {P}. How much juice did {N} use? | {N} llena {n} vasos con jugo. Cada vaso recibe {P}. ¿Cuánto jugo usó {N}?",
      RS: "{N} poured juice equally into {k} glasses. Each glass has {E}. How much juice did {N} pour? | {N} sirvió jugo en partes iguales en {k} vasos. Cada vaso tiene {E}. ¿Cuánto jugo sirvió {N}?",
      X: [
        "Every {m} glasses go on one tray. | Cada {m} vasos van en una bandeja.",
        "How many full trays are there? | ¿Cuántas bandejas completas hay?",
      ],
      I: {
        cnt: "the number of glasses | la cantidad de vasos",
        pc: "the amount of juice in one glass | la cantidad de jugo en un vaso",
        tot: "the amount of juice at the start | la cantidad de jugo al inicio",
        shn: "the number of glasses | la cantidad de vasos",
        sh: "the amount of juice in each glass | la cantidad de jugo en cada vaso",
      },
      M: [
        "Each glass has {A} of juice. How much juice is in {b} glasses in all? | Cada vaso tiene {A} de jugo. ¿Cuánto jugo hay en {b} vasos en total?",
        "{N} has {A} of juice and pours in {B} more. How much juice is there now? | {N} tiene {A} de jugo y agrega {B} más. ¿Cuánto jugo hay ahora?",
      ],
    },
    {
      id: "reading",
      u: "hr",
      N: "chapters | capítulos",
      n1: "chapter | capítulo",
      a1: "one more chapter | un capítulo más",
      G: [
        "{N} has {T} to read. Each chapter takes {P}. | {N} tiene {T} para leer. Cada capítulo dura {P}.",
        "How many chapters can {N} read? | ¿Cuántos capítulos puede leer {N}?",
        "How many full chapters can {N} read? | ¿Cuántos capítulos completos puede leer {N}?",
      ],
      S: [
        "{N} splits {T} of homework time equally among {k} subjects. | {N} divide {T} de tiempo de tarea en partes iguales entre {k} materias.",
        "How much time does each subject get? | ¿Cuánto tiempo recibe cada materia?",
      ],
      W: [
        "{N} read for {P}. That was {F} of the reading goal. | {N} leyó durante {P}. Eso fue {F} de la meta de lectura.",
        "How long is the whole reading goal? | ¿Cuánto dura la meta de lectura completa?",
      ],
      RG: "{N} reads {n} chapters. Each chapter takes {P}. How long did {N} read? | {N} lee {n} capítulos. Cada capítulo dura {P}. ¿Cuánto tiempo leyó {N}?",
      RS: "{N} split homework time equally among {k} subjects. Each subject got {E}. How long was the homework time? | {N} dividió el tiempo de tarea en partes iguales entre {k} materias. Cada materia recibió {E}. ¿Cuánto duró el tiempo de tarea?",
      X: [
        "Every {m} chapters make one book part. | Cada {m} capítulos forman una parte del libro.",
        "How many full parts can be finished? | ¿Cuántas partes completas se pueden terminar?",
      ],
      I: {
        cnt: "the number of chapters | la cantidad de capítulos",
        pc: "the time one chapter takes | el tiempo que dura un capítulo",
        tot: "the time at the start | el tiempo al inicio",
        shn: "the number of subjects | la cantidad de materias",
        sh: "the time each subject gets | el tiempo que recibe cada materia",
      },
      M: [
        "Each subject gets {A}. How much time do {b} subjects get in all? | Cada materia recibe {A}. ¿Cuánto tiempo reciben {b} materias en total?",
        "{N} studies for {A} and then for {B} more. How long does {N} study in all? | {N} estudia durante {A} y luego durante {B} más. ¿Cuánto tiempo estudia {N} en total?",
      ],
    },
  ];
  /** A kit that supports the shape (and whose own fit() accepts these numbers). */
  const kitFor = (rng, shape, vars) =>
    rng.pick(KITS.filter((k) => k[shape] && (!k.fit || k.fit(shape, vars))));
  /** Story text of one shape: body, optional note, question ("full" asks for whole groups only). */
  const story = (kit, shape, vars, { full = false, note = "", noAsk = false } = {}) => {
    const p = [].concat(kit[shape]);
    const f = (s) => (s ? fill(s, vars, kit.u) : "");
    return cat(f(p[0]), note, p.length > 1 && !noAsk ? f(full && p[2] ? p[2] : p[1]) : "");
  };
  const storyVars = (shape, A, B, N) => ({
    N,
    ...(shape === "G" ? { T: A, P: B } : shape === "S" ? { T: A, k: B[0] } : { P: A, F: S(B) }),
  });

  /* ---- item builders ----------------------------------------------------------------------------- */
  /** Multiple choice. wrong: [["choice", "tag", "feedback"], ...] (all "English | Español"). */
  const mcq = (rng, o) => {
    const wrong = rng.shuffle(o.wrong).map(([v, tag, f]) => ({
      v: en(v),
      vEs: es(v),
      f: en(f),
      fEs: es(f),
      tag,
    }));
    const item = R.mc(rng, {
      q: en(o.q),
      qEs: es(o.q),
      right: { v: en(o.right) },
      wrong,
      x: en(o.x),
      xEs: es(o.x),
      h: o.h.map(en),
      hEs: o.h.map(es),
      viz: o.viz,
      meta: o.meta,
    });
    const by = new Map(wrong.map((w) => [norm(w.v), w]));
    item.tag = item.c.map((c) => by.get(norm(c))?.tag ?? "");
    const spanish = item.c.map((c) =>
      norm(c) === norm(en(o.right)) ? es(o.right) : (by.get(norm(c))?.vEs ?? c),
    );
    if (spanish.some((s, i) => s !== item.c[i])) item.cEs = spanish;
    return item;
  };
  /** Typed answer (a is a fraction). fw: [[fraction, "tag", "feedback"], ...] typical wrong values. */
  const numq = (o) => {
    const a = S(o.a);
    const seen = new Set([a]);
    const fw = [];
    for (const [r, tag, f] of o.fw || []) {
      const v = S(r);
      if (seen.has(v) || !(r[0] > 0) || fw.length === 5) continue;
      seen.add(v);
      fw.push({ v, f: en(f), fEs: es(f), tag });
    }
    const item = R.num({
      q: en(o.q),
      qEs: es(o.q),
      a,
      unit: o.unit ? en(o.unit) : undefined,
      tol: 1e-6,
      fw,
      x: en(o.x),
      xEs: es(o.x),
      h: o.h.map(en),
      hEs: o.h.map(es),
      viz: o.viz,
      meta: o.meta,
    });
    if (o.unit) item.unitEs = es(o.unit);
    return item;
  };
  const NUMTOK = /\d+ \d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/g;
  /** True when the stem or the last hint states the answer as a standalone number. */
  const leaks = (item) => {
    const ans = R.value(item.k === "num" ? item.a : (item.c?.[item.a] ?? ""));
    if (!Number.isFinite(ans)) return false;
    const toks = (s) => (String(s).match(NUMTOK) || []).map((t) => R.value(t));
    return [item.q, item.h[item.h.length - 1]].some((s) =>
      toks(s).some((v) => Math.abs(v - ans) < 1e-9),
    );
  };
  const tailFmt = (Q) =>
    Q[1] === 1
      ? ""
      : "Write fractions like 3/8 and mixed numbers like 1 1/2. | Escribe las fracciones así: 3/8 y 1 1/2.";

  /* ---- worked solution and shared feedback -------------------------------------------------------- */
  /** convert -> reciprocal -> multiply -> simplify -> check, for A ÷ B = Q. */
  const work = (A, B, Q) => {
    const r = inv(B);
    const conv = [A, B].filter(isMixed).map((a) => [S(a), FR(a)]);
    const pn = A[0] * r[0];
    const pd = A[1] * r[1];
    const prod = pd === 1 ? `${pn}` : `${pn}/${pd}`;
    const e = [
      conv.length ? `Rewrite ${conv.map(([m, f]) => `${m} as ${f}`).join(" and ")}.` : "",
      `Dividing by ${S(B)} is the same as multiplying by its reciprocal, ${FR(r)}.`,
      `So ${ask(A, B)} = ${FR(A)} × ${FR(r)} = ${prod}.`,
      prod === S(Q) ? "" : `In simplest form, ${prod} = ${S(Q)}.`,
      `Check by multiplying: ${S(Q)} × ${S(B)} = ${S(A)}.`,
    ];
    const s = [
      conv.length ? `Escribe ${conv.map(([m, f]) => `${m} como ${f}`).join(" y ")}.` : "",
      `Dividir entre ${S(B)} es lo mismo que multiplicar por su recíproco, ${FR(r)}.`,
      `Así que ${ask(A, B)} = ${FR(A)} × ${FR(r)} = ${prod}.`,
      prod === S(Q) ? "" : `En su forma más simple, ${prod} = ${S(Q)}.`,
      `Comprueba multiplicando: ${S(Q)} × ${S(B)} = ${S(A)}.`,
    ];
    return `${e.filter(Boolean).join(" ")} | ${s.filter(Boolean).join(" ")}`;
  };
  const FB = {
    "multiplied-instead": (A, B) =>
      `That is ${S(A)} × ${S(B)}. The problem asks you to divide. | Eso es ${S(A)} × ${S(B)}. El problema pide dividir.`,
    "swapped-dividend-divisor": (A, B) =>
      `You divided ${S(B)} by ${S(A)}, but the amount being divided, ${S(A)}, goes first. | Dividiste ${S(B)} entre ${S(A)}, pero la cantidad que se divide, ${S(A)}, va primero.`,
    "fraction-of-instead": (A, B) =>
      `That is ${S(B)} of ${S(A)}. The question asks how many ${S(B)}s FIT in ${S(A)}, so divide. | Eso es ${S(B)} de ${S(A)}. La pregunta es cuántos ${S(B)} CABEN en ${S(A)}, así que se divide.`,
    "added-instead": (A, B) =>
      `That adds ${S(A)} and ${S(B)}. This problem asks you to divide. | Eso suma ${S(A)} y ${S(B)}. Este problema pide dividir.`,
    "shared-one-whole": (A) =>
      `That shares ONE whole. You only have ${S(A)} to share. | Eso reparte UN entero. Solo tienes ${S(A)} para repartir.`,
    "forgot-to-flip": (A, B) =>
      `You multiplied by ${S(B)} itself. Dividing by ${S(B)} means multiplying by its reciprocal, ${FR(inv(B))}. | Multiplicaste por ${S(B)}. Dividir entre ${S(B)} es multiplicar por su recíproco, ${FR(inv(B))}.`,
    "inverted-wrong-fraction": (A, B) =>
      `You flipped ${S(A)}, the first number. Keep ${S(A)} as it is and flip only the divisor, ${S(B)}. | Invertiste ${S(A)}, el primer número. Deja ${S(A)} como está e invierte solo el divisor, ${S(B)}.`,
    "flipped-both": (A, B) =>
      `You flipped both numbers. Only the divisor, ${S(B)}, gets flipped. | Invertiste los dos números. Solo se invierte el divisor, ${S(B)}.`,
    "ignored-numerator": (A, B) =>
      `You used 1/${B[1]} instead of ${S(B)}. The numerator counts: each group is ${B[0]} of those small pieces, so fewer groups fit. | Usaste 1/${B[1]} en lugar de ${S(B)}. El numerador cuenta: cada grupo tiene ${B[0]} de esas partes pequeñas, así que caben menos grupos.`,
    "dropped-whole-part": (A) =>
      `You left out the whole number. ${S(A)} is the whole number AND the fraction together. | Dejaste fuera el número entero. ${S(A)} es el número entero Y la fracción juntos.`,
    "divided-straight-across": () =>
      "You divided the tops, then divided the bottoms the other way around. Both divisions must go in the same order: dividend ÷ divisor. | Dividiste los numeradores y luego los denominadores al revés. Ambas divisiones deben ir en el mismo orden: dividendo ÷ divisor.",
    "divided-parts-separately": () =>
      "You divided the whole numbers and the fractions separately. Rewrite each mixed number as one improper fraction first. | Dividiste los números enteros y las fracciones por separado. Primero escribe cada número mixto como una sola fracción impropia.",
  };
  /** Typical wrong values for A ÷ B, each with its named mistake and feedback. */
  const slips = (A, B) => {
    const L = [];
    const put = (r, tag, f) => L.push([r, tag, f || FB[tag](A, B)]);
    if (B[1] === 1) {
      put(
        mul(A, B),
        "multiplied-instead",
        `That is ${S(A)} × ${B[0]}. Sharing gives each share LESS than ${S(A)}, but multiplying makes MORE. | Eso es ${S(A)} × ${B[0]}. Al repartir, cada parte recibe MENOS que ${S(A)}, pero multiplicar da MÁS.`,
      );
      put(div(B, A), "swapped-dividend-divisor");
      if (!same(A, [1, 1])) put([1, B[0]], "shared-one-whole");
    } else if (A[1] === 1 && B[0] === 1) {
      put(mul(A, B), "fraction-of-instead");
      put(div(B, A), "swapped-dividend-divisor");
      put(plus(A, inv(B)), "added-instead");
    } else {
      put(mul(A, B), "forgot-to-flip");
      put(mul(inv(A), B), "inverted-wrong-fraction");
      put(mul(inv(A), inv(B)), "flipped-both");
      put(div(B, A), "swapped-dividend-divisor");
      if (A[1] === 1 && B[0] > 1) put(mul(A, [B[1], 1]), "ignored-numerator");
      if (isMixed(A)) put(div(frac(A), B), "dropped-whole-part");
      if (isMixed(A) && isMixed(B))
        put(
          plus(div([whole(A), 1], [whole(B), 1]), div(frac(A), frac(B))),
          "divided-parts-separately",
        );
      if (A[0] < A[1] && B[0] < B[1] && A[0] % B[0] === 0 && B[1] % A[1] === 0 && B[1] !== A[1])
        put(rat(A[0] / B[0], B[1] / A[1]), "divided-straight-across");
    }
    return L;
  };
  const calcHints = (A, B, shape) => {
    const r = FR(inv(B));
    if (B[1] === 1)
      return [
        "Sharing equally means dividing the amount by the number of shares. | Repartir en partes iguales es dividir la cantidad entre el número de partes.",
        `Dividing by ${B[0]} is the same as multiplying by 1/${B[0]}. | Dividir entre ${B[0]} es lo mismo que multiplicar por 1/${B[0]}.`,
        `Multiply ${S(A)} × 1/${B[0]}: multiply the tops, then the bottoms. | Multiplica ${S(A)} × 1/${B[0]}: multiplica los numeradores y luego los denominadores.`,
      ];
    if (shape === "W")
      return [
        "A part is a fraction of the whole. To find the whole, divide the part by that fraction. | Una parte es una fracción del total. Para hallar el total, divide la parte entre esa fracción.",
        `Dividing by ${S(B)} is the same as multiplying by its reciprocal. | Dividir entre ${S(B)} es lo mismo que multiplicar por su recíproco.`,
        `Flip ${S(B)} to get ${r}, then multiply ${FR(A)} × ${r}. | Invierte ${S(B)} para obtener ${r}, y luego multiplica ${FR(A)} × ${r}.`,
      ];
    if (A[1] === 1 && B[0] === 1)
      return [
        "Dividing by a unit fraction asks how many of those pieces fit. | Dividir entre una fracción unitaria pregunta cuántas de esas partes caben.",
        `How many ${S(B)}s fit in one whole? Do the same for every whole. | ¿Cuántos ${S(B)} caben en un entero? Haz lo mismo con cada entero.`,
        `One whole holds ${B[1]} pieces of size ${S(B)}, so multiply ${S(A)} × ${B[1]}. | Un entero tiene ${B[1]} partes de tamaño ${S(B)}, así que multiplica ${S(A)} × ${B[1]}.`,
      ];
    const conv = [A, B].filter(isMixed).map((a) => S(a));
    return [
      "Dividing by a fraction is the same as multiplying by its reciprocal. | Dividir entre una fracción es lo mismo que multiplicar por su recíproco.",
      conv.length
        ? `First rewrite ${conv.join(" and ")} as improper fraction${conv.length > 1 ? "s" : ""}. Then keep, change ÷ to ×, and flip the divisor. | Primero escribe ${conv.join(" y ")} como fracción${conv.length > 1 ? "es" : ""} impropia${conv.length > 1 ? "s" : ""}. Luego conserva, cambia ÷ por × e invierte el divisor.`
        : `Keep ${S(A)}, change ÷ to ×, and flip ${S(B)}. | Conserva ${S(A)}, cambia ÷ por × e invierte ${S(B)}.`,
      `The reciprocal of ${FR(B)} is ${r}. Multiply ${FR(A)} × ${r}, then simplify. | El recíproco de ${FR(B)} es ${r}. Multiplica ${FR(A)} × ${r} y luego simplifica.`,
    ];
  };

  /* ---- item types ------------------------------------------------------------------------------- */
  /** Compute A ÷ B. shape: bare | G (how many fit) | S (share among B) | W (A is the fraction B of the whole). */
  const calc = (rng, A, B, shape = "bare", { bar = false } = {}) => {
    const Q = div(A, B);
    const v = storyVars(shape, A, B, rng.pick(NAMES));
    const kit = shape === "bare" ? null : kitFor(rng, shape, v);
    const unit = !kit ? "" : shape === "G" ? kit.N : uLab(kit.u, Q);
    const useBar = bar && shape === "S" && A[0] < A[1];
    const note = useBar
      ? "The bar shows the amount that is shared. | La barra muestra la cantidad que se reparte."
      : "";
    const stem = cat(
      kit ? story(kit, shape, v, { note }) : `Find ${ask(A, B)}. | Calcula ${ask(A, B)}.`,
      tailFmt(Q),
    );
    const lead = {
      bare: "",
      G: `${ask(A, B)} asks how many groups of ${S(B)} fit in ${S(A)}. | ${ask(A, B)} pregunta cuántos grupos de ${S(B)} caben en ${S(A)}.`,
      S: `Sharing ${S(A)} equally among ${B[0]} means ${ask(A, B)}. | Repartir ${S(A)} en partes iguales entre ${B[0]} es ${ask(A, B)}.`,
      W: `${S(A)} is ${S(B)} of the whole, so the whole is ${ask(A, B)}. | ${S(A)} es ${S(B)} del total, así que el total es ${ask(A, B)}.`,
    }[shape];
    const close = unit
      ? `So the answer is ${S(Q)} ${en(unit)}. | Así que la respuesta es ${S(Q)} ${es(unit)}.`
      : "";
    return numq({
      q: stem,
      a: Q,
      unit,
      fw: slips(A, B),
      x: cat(lead, work(A, B, Q), close),
      h: calcHints(A, B, shape),
      viz: useBar ? { t: "bar1", n: A[0], d: A[1] } : undefined,
      meta: { kind: "calc", A, B, shape },
    });
  };

  /** Choose the expression that matches a story. shape G | S | W. eq: choices read "A ÷ B = ☐". */
  const expression = (rng, A, B, shape, { viz = "", eq = false } = {}) => {
    const Q = div(A, B);
    const v = storyVars(shape, A, B, rng.pick(NAMES));
    const kit = kitFor(rng, shape, v);
    const t = eq ? " = ☐" : "";
    const x = (a, op, b) => `${S(a)} ${op} ${S(b)}${t}`;
    const k = [B[0], 1];
    const wrong = {
      G: [
        [
          x(B, "÷", A),
          "swapped-dividend-divisor",
          "This divides the size of one piece by the total. The total goes first. | Esta divide el tamaño de una porción entre el total. El total va primero.",
        ],
        [
          x(A, "×", B),
          "multiplied-instead",
          "Multiplying finds a part OF the total. The question asks how many pieces FIT, which is division. | Multiplicar halla una parte DEL total. La pregunta es cuántas porciones CABEN, que es dividir.",
        ],
        B[0] === 1
          ? [
              x(A, "÷", [B[1], 1]),
              "denominator-as-divisor",
              `This divides by ${B[1]}, which splits the total into ${B[1]} equal groups. Each piece is ${S(B)}, so divide by ${S(B)}. | Esta divide entre ${B[1]}, que reparte el total en ${B[1]} grupos iguales. Cada porción es de ${S(B)}, así que se divide entre ${S(B)}.`,
            ]
          : [
              x(inv(A), "÷", B),
              "inverted-wrong-fraction",
              "This flips the total before dividing. The total stays as it is in the expression. | Esta invierte el total antes de dividir. En la expresión el total queda como está.",
            ],
        [
          x(A, "−", B),
          "subtracted-instead",
          "Subtracting takes away ONE piece. The question asks how many pieces fit. | Restar quita UNA porción. La pregunta es cuántas porciones caben.",
        ],
      ],
      S: [
        [
          x(k, "÷", A),
          "swapped-dividend-divisor",
          "This divides the number of shares by the amount. The amount being shared goes first. | Esta divide el número de partes entre la cantidad. La cantidad que se reparte va primero.",
        ],
        [
          x(A, "×", k),
          "multiplied-instead",
          "Sharing gives each share LESS than the whole amount. Multiplying makes MORE. | Repartir da a cada parte MENOS que la cantidad total. Multiplicar da MÁS.",
        ],
        [
          x(A, "÷", [1, B[0]]),
          "shares-as-unit-fraction",
          `Dividing by 1/${B[0]} asks how many 1/${B[0]}s fit. Sharing among ${B[0]} means dividing by ${B[0]} itself. | Dividir entre 1/${B[0]} pregunta cuántos 1/${B[0]} caben. Repartir entre ${B[0]} es dividir entre ${B[0]}.`,
        ],
        [
          x(A, "+", k),
          "added-instead",
          "Adding joins amounts. Sharing splits one amount into equal parts. | Sumar junta cantidades. Repartir divide una cantidad en partes iguales.",
        ],
      ],
      W: [
        [
          x(B, "÷", A),
          "swapped-dividend-divisor",
          `This divides the fraction by the part. The part, ${S(A)}, is what gets divided. | Esta divide la fracción entre la parte. La parte, ${S(A)}, es lo que se divide.`,
        ],
        [
          x(A, "×", B),
          "multiplied-instead",
          `Multiplying finds ${S(B)} OF ${S(A)}. But ${S(A)} is already ${S(B)} of the whole, so the whole is bigger. | Multiplicar halla ${S(B)} DE ${S(A)}. Pero ${S(A)} ya es ${S(B)} del total, así que el total es mayor.`,
        ],
        [
          x(A, "−", B),
          "subtracted-instead",
          "Subtracting does not turn a part into the whole. | Restar no convierte una parte en el total.",
        ],
        [
          x(A, "+", B),
          "added-instead",
          "Adding does not turn a part into the whole. | Sumar no convierte una parte en el total.",
        ],
      ],
    }[shape];
    const note = viz
      ? {
          tape:
            shape === "G"
              ? "The tape diagram shows the pieces. | El diagrama de cinta muestra las porciones."
              : "The tape diagram shows the shares. | El diagrama de cinta muestra las partes.",
          bar1: "The bar shows the amount that is shared. | La barra muestra la cantidad que se reparte.",
        }[viz]
      : "";
    const ask2 = eq
      ? "Which equation fits the story? | ¿Qué ecuación corresponde a la situación?"
      : {
          G: `Which expression finds the number of ${en(kit.N)}? | ¿Qué expresión halla la cantidad de ${es(kit.N)}?`,
          S: "Which expression finds the size of one share? | ¿Qué expresión halla el tamaño de una parte?",
          W: "Which expression finds the whole? | ¿Qué expresión halla el total?",
        }[shape];
    const figure =
      viz === "bar1"
        ? { t: "bar1", n: A[0], d: A[1] }
        : viz === "tape"
          ? shape === "G"
            ? { t: "tape", parts: Array.from({ length: Q[0] }, () => ({ v: S(B) })), total: S(A) }
            : { t: "tape", parts: Array.from({ length: B[0] }, () => ({ v: "?" })), total: S(A) }
          : undefined;
    const lead = {
      G: `${S(A)} is the total and ${S(B)} is one piece, so ${ask(A, B)} tells how many pieces fit. | ${S(A)} es el total y ${S(B)} es una porción, así que ${ask(A, B)} dice cuántas porciones caben.`,
      S: `${S(A)} is shared among ${B[0]}, so ${ask(A, B)} finds one share. | ${S(A)} se reparte entre ${B[0]}, así que ${ask(A, B)} halla una parte.`,
      W: `The part ${S(A)} is ${S(B)} of the whole, so the whole is ${ask(A, B)}. | La parte ${S(A)} es ${S(B)} del total, así que el total es ${ask(A, B)}.`,
    }[shape];
    const hints = {
      G: [
        "Ask what the question wants. How many pieces FIT in the total? That is division. | Pregunta qué se quiere. ¿Cuántas porciones CABEN en el total? Eso es dividir.",
        "In a division expression the total goes first and the size of one piece comes after ÷. | En una expresión de división el total va primero y el tamaño de una porción va después de ÷.",
        `The total is ${S(A)} and one piece is ${S(B)}. | El total es ${S(A)} y una porción es ${S(B)}.`,
      ],
      S: [
        "Sharing equally means dividing. | Repartir en partes iguales es dividir.",
        "The amount that gets shared goes first. The number of shares comes after ÷. | La cantidad que se reparte va primero. El número de partes va después de ÷.",
        `The amount shared is ${S(A)} and the number of shares is ${B[0]}. | La cantidad repartida es ${S(A)} y el número de partes es ${B[0]}.`,
      ],
      W: [
        "The part you have is a fraction of the whole. To find the whole, divide the part by that fraction. | La parte que tienes es una fracción del total. Para hallar el total, divide la parte entre esa fracción.",
        "The part goes first. The fraction it fills goes after ÷. | La parte va primero. La fracción que ocupa va después de ÷.",
        `The part is ${S(A)} and it fills ${S(B)} of the whole. | La parte es ${S(A)} y ocupa ${S(B)} del total.`,
      ],
    }[shape];
    return mcq(rng, {
      q: cat(story(kit, shape, v, { note, noAsk: !eq }), ask2),
      right: x(A, "÷", B),
      wrong,
      x: cat(lead, `It equals ${S(Q)}. | Es igual a ${S(Q)}.`),
      h: hints,
      viz: figure,
      meta: { kind: "expr", A, B, eq },
    });
  };
  /** What does A ÷ B ask? A whole divisor reads as a share; a fraction divisor reads as "how many fit". */
  const meaning = (rng, A, B) => {
    const Q = div(A, B);
    const share = B[1] === 1;
    const k = B[0];
    const right = share
      ? `If ${S(A)} is shared equally among ${k}, how much is in each share? | Si ${S(A)} se reparte en partes iguales entre ${k}, ¿cuánto hay en cada parte?`
      : `How many ${S(B)}s fit in ${S(A)}? | ¿Cuántos ${S(B)} caben en ${S(A)}?`;
    const wrong = share
      ? [
          [
            `How many ${S(A)}s fit in ${k}? | ¿Cuántos ${S(A)} caben en ${k}?`,
            "swapped-dividend-divisor",
            `That asks ${k} ÷ ${S(A)}. The amount being shared, ${S(A)}, is what gets divided. | Eso pregunta ${k} ÷ ${S(A)}. La cantidad que se reparte, ${S(A)}, es lo que se divide.`,
          ],
          [
            `What is ${k} groups of ${S(A)}? | ¿Cuánto es ${k} grupos de ${S(A)}?`,
            "multiplied-instead",
            `That is ${S(A)} × ${k}. Division splits an amount or counts how many fit. | Eso es ${S(A)} × ${k}. Dividir reparte una cantidad o cuenta cuántos caben.`,
          ],
          [
            `What is ${k} more than ${S(A)}? | ¿Cuánto es ${k} más que ${S(A)}?`,
            "added-instead",
            `That is ${S(A)} + ${k}. The ÷ sign does not mean adding. | Eso es ${S(A)} + ${k}. El signo ÷ no significa sumar.`,
          ],
        ]
      : [
          [
            `What is ${S(B)} of ${S(A)}? | ¿Cuánto es ${S(B)} de ${S(A)}?`,
            "fraction-of-instead",
            `"${S(B)} of ${S(A)}" is multiplication. ${ask(A, B)} asks how many ${S(B)}s FIT in ${S(A)}. | "${S(B)} de ${S(A)}" es multiplicación. ${ask(A, B)} pregunta cuántos ${S(B)} CABEN en ${S(A)}.`,
          ],
          [
            `What is ${S(A)} split into ${B[1]} equal groups? | ¿Cuánto es ${S(A)} dividido en ${B[1]} grupos iguales?`,
            "denominator-as-divisor",
            `That divides by ${B[1]}, the denominator. The divisor is the whole fraction, ${S(B)}. | Eso divide entre ${B[1]}, el denominador. El divisor es la fracción completa, ${S(B)}.`,
          ],
          [
            `How many ${S(A)}s fit in ${S(B)}? | ¿Cuántos ${S(A)} caben en ${S(B)}?`,
            "swapped-dividend-divisor",
            `That asks ${ask(B, A)}. The first number, ${S(A)}, is the amount you start with. | Eso pregunta ${ask(B, A)}. El primer número, ${S(A)}, es la cantidad con la que empiezas.`,
          ],
          [
            `What is ${S(B)} more than ${S(A)}? | ¿Cuánto es ${S(B)} más que ${S(A)}?`,
            "added-instead",
            `That is ${S(A)} + ${S(B)}. The ÷ sign does not mean adding. | Eso es ${S(A)} + ${S(B)}. El signo ÷ no significa sumar.`,
          ],
        ];
    return mcq(rng, {
      q: `Which question does ${ask(A, B)} ask? | ¿Qué pregunta plantea ${ask(A, B)}?`,
      right,
      wrong,
      x: cat(
        `Read ${ask(A, B)} as: ${en(right)} | Lee ${ask(A, B)} así: ${es(right)}`,
        `The answer is ${S(Q)}. | La respuesta es ${S(Q)}.`,
      ),
      h: [
        "A division sentence asks one of two things: how many fit, or how much is in each share. | Una división pregunta una de dos cosas: cuántos caben o cuánto hay en cada parte.",
        `Say ${ask(A, B)} out loud: "${S(A)} divided by ${S(B)}". The first number is the amount you start with. | Lee ${ask(A, B)} en voz alta: "${S(A)} dividido entre ${S(B)}". El primer número es la cantidad con la que empiezas.`,
        share
          ? `A whole-number divisor like ${k} means ${k} equal shares. | Un divisor entero como ${k} significa ${k} partes iguales.`
          : "A fraction divisor is the size of one group, so ask how many of that size fit. | Un divisor fraccionario es el tamaño de un grupo, así que pregunta cuántos de ese tamaño caben.",
      ],
      meta: { kind: "meaning", A, B, ans: en(right) },
    });
  };

  const ROLE = { quotient: "cociente", divisor: "divisor", dividend: "dividendo" };
  /** In a story with A ÷ B = Q written out, what does the dividend / divisor / quotient stand for? */
  const interp = (rng, A, B, shape) => {
    const Q = div(A, B);
    const v = storyVars(shape, A, B, rng.pick(NAMES));
    const kit = kitFor(rng, shape, v);
    const role = rng.pick(["quotient", "divisor", "dividend"]);
    const key =
      shape === "G"
        ? { quotient: "cnt", divisor: "pc", dividend: "tot" }
        : { quotient: "sh", divisor: "shn", dividend: "tot" };
    const val = { quotient: S(Q), divisor: S(B), dividend: S(A) };
    const right = kit.I[key[role]];
    const wrong = Object.keys(key)
      .filter((r) => r !== role)
      .map((r) => [
        kit.I[key[r]],
        `${role}-as-${r}`,
        `That describes the ${r}, not the ${role}. | Eso describe el ${ROLE[r]}, no el ${ROLE[role]}.`,
      ]);
    wrong.push([
      "the amount left over | la cantidad que sobra",
      `${role}-as-leftover`,
      "Nothing is left over: the division is exact. | No sobra nada: la división es exacta.",
    ]);
    const hint3 = {
      quotient:
        "The quotient is the answer to the question the story asks. | El cociente es la respuesta a la pregunta de la situación.",
      divisor: `The divisor is the number after ÷. Find ${val.divisor} in the story. | El divisor es el número después de ÷. Busca ${val.divisor} en la situación.`,
      dividend: `The dividend is the number before ÷. Find ${val.dividend} in the story. | El dividendo es el número antes de ÷. Busca ${val.dividend} en la situación.`,
    }[role];
    return mcq(rng, {
      q: cat(
        story(kit, shape, v),
        `A student writes ${ask(A, B)} = ${S(Q)}. What does the ${val[role]} (the ${role}) tell you? | Se escribe ${ask(A, B)} = ${S(Q)}. ¿Qué indica el ${val[role]} (el ${ROLE[role]})?`,
      ),
      right,
      wrong,
      x: `In ${ask(A, B)} = ${S(Q)}, ${S(A)} is the dividend (${en(kit.I.tot)}), ${S(B)} is the divisor (${en(kit.I[key.divisor])}) and ${S(Q)} is the quotient (${en(kit.I[key.quotient])}). | En ${ask(A, B)} = ${S(Q)}, ${S(A)} es el dividendo (${es(kit.I.tot)}), ${S(B)} es el divisor (${es(kit.I[key.divisor])}) y ${S(Q)} es el cociente (${es(kit.I[key.quotient])}).`,
      h: [
        "In a division sentence, the dividend is what gets divided, the divisor is what you divide by, and the quotient is the answer. | En una división, el dividendo es lo que se divide, el divisor es entre lo que se divide y el cociente es la respuesta.",
        "Reread the story. What is the starting amount? What is the size of one group, or the number of shares? What do you find? | Vuelve a leer la situación. ¿Cuál es la cantidad inicial? ¿Cuál es el tamaño de un grupo, o el número de partes? ¿Qué hallas?",
        hint3,
      ],
      meta: { kind: "interp", A, B, Q, ans: en(right) },
    });
  };

  /** Which story matches A ÷ B? Shape G: whole ÷ unit fraction. Shape S: fraction ÷ whole. */
  const storyMatch = (rng, A, B, shape) => {
    const N = rng.pick(NAMES);
    const kit = rng.pick(KITS.filter((k) => k.M));
    const Q = div(A, B);
    const f = (s, v) => fill(s, v, kit.u);
    const k = [B[0], 1];
    const G = shape === "G";
    const right = G ? story(kit, "G", { N, T: A, P: B }) : story(kit, "S", { N, T: A, k: B[0] });
    const swapped = G ? story(kit, "S", { N, T: B, k: A[0] }) : story(kit, "G", { N, T: k, P: A });
    const mult = f(kit.M[0], G ? { N, A: B, b: A[0] } : { N, A, b: B[0] });
    const added = f(kit.M[1], G ? { N, A, B } : { N, A, B: k });
    return mcq(rng, {
      q: `Which story matches ${ask(A, B)}? | ¿Qué situación corresponde a ${ask(A, B)}?`,
      right,
      wrong: [
        [
          swapped,
          "swapped-dividend-divisor",
          `This story divides ${S(B)} by ${S(A)}. In ${ask(A, B)}, ${S(A)} is the amount being divided. | Esta situación divide ${S(B)} entre ${S(A)}. En ${ask(A, B)}, ${S(A)} es la cantidad que se divide.`,
        ],
        [
          mult,
          "multiplied-instead",
          `This story multiplies equal groups. ${ask(A, B)} splits an amount or counts how many fit. | Esta situación multiplica grupos iguales. ${ask(A, B)} reparte una cantidad o cuenta cuántos caben.`,
        ],
        [
          added,
          "added-instead",
          "This story adds two amounts. It is not a division story. | Esta situación suma dos cantidades. No es una situación de división.",
        ],
      ],
      x: `The matching story divides ${S(A)} by ${S(B)}. The others swap the numbers, multiply or add. Here ${ask(A, B)} = ${S(Q)}. | La situación correcta divide ${S(A)} entre ${S(B)}. Las otras cambian los números de lugar, multiplican o suman. Aquí ${ask(A, B)} = ${S(Q)}.`,
      h: [
        "Say the division in words. Does it ask how many fit, or how much is in each share? | Di la división con palabras. ¿Pregunta cuántos caben o cuánto hay en cada parte?",
        `The first number, ${S(A)}, is the amount that gets divided. Look for the story that starts with that amount. | El primer número, ${S(A)}, es la cantidad que se divide. Busca la situación que empieza con esa cantidad.`,
        "Cross out the stories that multiply or add. Then check which one divides the right number by the right number. | Tacha las situaciones que multiplican o suman. Luego revisa cuál divide el número correcto entre el correcto.",
      ],
      meta: { kind: "story", A, B, Q, ans: en(right) },
    });
  };

  /** Which expression has the same value? Dividing by 1/d is × d; dividing by k is × 1/k. */
  const equiv = (rng, A, B) => {
    const unit = B[0] === 1 && B[1] > 1;
    const Bi = unit ? [B[1], 1] : [1, B[0]];
    const x = (a, op, b) => `${S(a)} ${op} ${S(b)}`;
    const wrong = unit
      ? [
          [
            x(A, "×", B),
            "forgot-to-flip",
            `Multiplying by ${S(B)} finds ${S(B)} of ${S(A)}. Dividing by ${S(B)} is the same as multiplying by its reciprocal, ${FR(Bi)}. | Multiplicar por ${S(B)} halla ${S(B)} de ${S(A)}. Dividir entre ${S(B)} es lo mismo que multiplicar por su recíproco, ${FR(Bi)}.`,
          ],
          [
            x(A, "÷", Bi),
            "denominator-as-divisor",
            `Dividing by ${B[1]} is not the same as dividing by ${S(B)}. | Dividir entre ${B[1]} no es lo mismo que dividir entre ${S(B)}.`,
          ],
          [
            x(inv(A), "×", Bi),
            "inverted-wrong-fraction",
            `You flipped ${S(A)}. Only the divisor gets flipped. | Invertiste ${S(A)}. Solo se invierte el divisor.`,
          ],
        ]
      : [
          [
            x(A, "×", [B[0], 1]),
            "forgot-to-flip",
            `Multiplying by ${B[0]} makes MORE. Dividing by ${B[0]} is the same as multiplying by its reciprocal, 1/${B[0]}. | Multiplicar por ${B[0]} da MÁS. Dividir entre ${B[0]} es lo mismo que multiplicar por su recíproco, 1/${B[0]}.`,
          ],
          [
            x(inv(A), "×", Bi),
            "inverted-wrong-fraction",
            `You flipped ${S(A)}. Only the divisor gets flipped. | Invertiste ${S(A)}. Solo se invierte el divisor.`,
          ],
          [
            x(A, "÷", Bi),
            "shares-as-unit-fraction",
            `Dividing by 1/${B[0]} asks how many 1/${B[0]}s fit. It is not the same as dividing by ${B[0]}. | Dividir entre 1/${B[0]} pregunta cuántos 1/${B[0]} caben. No es lo mismo que dividir entre ${B[0]}.`,
          ],
        ];
    return mcq(rng, {
      q: `Which expression has the same value as ${ask(A, B)}? | ¿Qué expresión tiene el mismo valor que ${ask(A, B)}?`,
      right: x(A, "×", Bi),
      wrong,
      x: `Dividing by a number is the same as multiplying by its reciprocal. The reciprocal of ${S(B)} is ${FR(Bi)}, so ${ask(A, B)} = ${x(A, "×", Bi)}. | Dividir entre un número es lo mismo que multiplicar por su recíproco. El recíproco de ${S(B)} es ${FR(Bi)}, así que ${ask(A, B)} = ${x(A, "×", Bi)}.`,
      h: [
        "Dividing by a number is the same as multiplying by its reciprocal. | Dividir entre un número es lo mismo que multiplicar por su recíproco.",
        `The reciprocal of ${S(B)} is ${S(B)} turned upside down. | El recíproco de ${S(B)} es ${S(B)} puesto al revés.`,
        `Keep ${S(A)}, change ÷ to ×, and flip only ${S(B)}. | Conserva ${S(A)}, cambia ÷ por × e invierte solo ${S(B)}.`,
      ],
      meta: { kind: "equiv", A, B },
    });
  };

  /** One value of A ÷ B = Q is hidden. hole "A" hides the dividend, "B" the divisor. */
  const reverse = (rng, A, B, hole, useStory) => {
    const Q = div(A, B);
    const N = rng.pick(NAMES);
    let stem = "";
    let unit = "";
    const target = hole === "A" ? A : B;
    if (useStory && hole === "A" && Q[1] === 1 && Q[0] >= 2) {
      const v = { N, P: B, n: Q[0] };
      const kit = kitFor(rng, "RG", v);
      stem = fill(kit.RG, v, kit.u);
      unit = uLab(kit.u, A);
    } else if (useStory && hole === "A" && B[1] === 1 && B[0] >= 2) {
      const v = { N, k: B[0], E: Q };
      const kit = kitFor(rng, "RS", v);
      stem = fill(kit.RS, v, kit.u);
      unit = uLab(kit.u, A);
    } else if (useStory && hole === "B" && A[1] === 1 && Q[1] === 1 && Q[0] >= 2) {
      const v = { N, T: A, k: Q[0] };
      const kit = kitFor(rng, "S", v);
      stem = story(kit, "S", v);
      unit = uLab(kit.u, B);
    }
    const storied = Boolean(stem);
    const bare =
      hole === "A"
        ? `What number makes this true? ☐ ÷ ${S(B)} = ${S(Q)} | ¿Qué número hace verdadera esta igualdad? ☐ ÷ ${S(B)} = ${S(Q)}`
        : `What number makes this true? ${S(A)} ÷ ☐ = ${S(Q)} | ¿Qué número hace verdadera esta igualdad? ${S(A)} ÷ ☐ = ${S(Q)}`;
    const fw =
      hole === "A"
        ? [
            [
              div(Q, B),
              "divided-instead-of-multiplied",
              `That is ${S(Q)} ÷ ${S(B)}. To undo a division, multiply: dividend = quotient × divisor. | Eso es ${S(Q)} ÷ ${S(B)}. Para deshacer una división, multiplica: dividendo = cociente × divisor.`,
            ],
            [
              div(B, Q),
              "swapped-dividend-divisor",
              `That is ${S(B)} ÷ ${S(Q)}. Put your number in and divide to see if it gives ${S(Q)}. | Eso es ${S(B)} ÷ ${S(Q)}. Pon tu número y divide para ver si da ${S(Q)}.`,
            ],
            [
              plus(Q, B),
              "added-instead",
              `That adds ${S(Q)} and ${S(B)}. Division and multiplication undo each other, not addition. | Eso suma ${S(Q)} y ${S(B)}. La división y la multiplicación se deshacen entre sí, no la suma.`,
            ],
          ]
        : [
            [
              div(Q, A),
              "swapped-dividend-divisor",
              `That is ${S(Q)} ÷ ${S(A)}. The dividend ${S(A)} comes first. | Eso es ${S(Q)} ÷ ${S(A)}. El dividendo ${S(A)} va primero.`,
            ],
            [
              mul(A, Q),
              "multiplied-instead",
              `That is ${S(A)} × ${S(Q)}. To find a divisor, divide the dividend by the quotient. | Eso es ${S(A)} × ${S(Q)}. Para hallar un divisor, divide el dividendo entre el cociente.`,
            ],
            [
              inv(B),
              "gave-the-reciprocal",
              `Try it: ${S(A)} ÷ ${S(inv(B))} does not give ${S(Q)}. You gave the reciprocal. | Pruébalo: ${S(A)} ÷ ${S(inv(B))} no da ${S(Q)}. Diste el recíproco.`,
            ],
          ];
    const intro = storied
      ? "Undo a division with multiplication: (number of groups) × (size of one group) = total. | Deshaz una división con multiplicación: (número de grupos) × (tamaño de un grupo) = total."
      : "A division can be checked by multiplying: quotient × divisor = dividend. | Una división se comprueba multiplicando: cociente × divisor = dividendo.";
    return numq({
      q: storied ? cat(stem, tailFmt(target)) : cat(bare, tailFmt(target)),
      a: target,
      unit,
      fw,
      x:
        hole === "A"
          ? `Division and multiplication undo each other: dividend = quotient × divisor. The missing number is ${S(Q)} × ${S(B)} = ${S(A)}. Check: ${ask(A, B)} = ${S(Q)}. | La división y la multiplicación se deshacen entre sí: dividendo = cociente × divisor. El número que falta es ${S(Q)} × ${S(B)} = ${S(A)}. Comprueba: ${ask(A, B)} = ${S(Q)}.`
          : cat(
              `The missing divisor is the dividend ÷ the quotient: ${ask(A, Q)}. | El divisor que falta es el dividendo ÷ el cociente: ${ask(A, Q)}.`,
              work(A, Q, B),
            ),
      h: [
        intro,
        hole === "A"
          ? "The dividend is missing, so multiply the quotient by the divisor. | Falta el dividendo, así que multiplica el cociente por el divisor."
          : `The divisor is missing. Ask: what number times ${S(Q)} equals ${S(A)}? | Falta el divisor. Pregunta: ¿qué número multiplicado por ${S(Q)} da ${S(A)}?`,
        hole === "A"
          ? `Calculate ${S(Q)} × ${S(B)}. | Calcula ${S(Q)} × ${S(B)}.`
          : `Divide ${S(A)} ÷ ${S(Q)} to find it. | Divide ${S(A)} ÷ ${S(Q)} para hallarlo.`,
      ],
      meta: { kind: "rev", A, B, Q, hole },
    });
  };

  /** Which expression gives the dividend back when you check A ÷ B = Q? */
  const mulCheck = (rng, A, B) => {
    const Q = div(A, B);
    const x = (a, op, b) => `${S(a)} ${op} ${S(b)}`;
    const cand = [
      [
        x(A, "×", B),
        mul(A, B),
        "multiplied-the-dividend",
        `That multiplies the dividend by the divisor. To check, multiply the QUOTIENT by the divisor. | Eso multiplica el dividendo por el divisor. Para comprobar, multiplica el COCIENTE por el divisor.`,
      ],
      [
        x(Q, "÷", B),
        div(Q, B),
        "divided-again",
        "That divides again. A check uses the opposite operation, multiplication. | Eso vuelve a dividir. Una comprobación usa la operación contraria, la multiplicación.",
      ],
      [
        x(A, "÷", Q),
        div(A, Q),
        "checked-with-the-dividend",
        `That gives the divisor back, not the dividend. | Eso devuelve el divisor, no el dividendo.`,
      ],
      [
        x(Q, "+", B),
        plus(Q, B),
        "added-instead",
        "Division and multiplication undo each other, not addition. | La división y la multiplicación se deshacen entre sí, no la suma.",
      ],
    ].filter((c) => !same(c[1], A));
    return mcq(rng, {
      q: `Dana divided and got ${ask(A, B)} = ${S(Q)}. Which expression should give ${S(A)} back, to check the answer? | Dana dividió y obtuvo ${ask(A, B)} = ${S(Q)}. ¿Qué expresión debería dar ${S(A)} otra vez, para comprobar la respuesta?`,
      right: x(Q, "×", B),
      wrong: cand.map(([c, , tag, f]) => [c, tag, f]),
      x: `Quotient × divisor = dividend: ${S(Q)} × ${S(B)} = ${S(A)}, so the answer checks out. | Cociente × divisor = dividendo: ${S(Q)} × ${S(B)} = ${S(A)}, así que la respuesta es correcta.`,
      h: [
        "To check a division, use the opposite operation. | Para comprobar una división, usa la operación contraria.",
        "Multiply the quotient by the divisor. The result should be the dividend. | Multiplica el cociente por el divisor. El resultado debe ser el dividendo.",
        `The quotient is ${S(Q)} and the divisor is ${S(B)}. | El cociente es ${S(Q)} y el divisor es ${S(B)}.`,
      ],
      meta: { kind: "mulcheck", A, B, Q },
    });
  };

  /** Two classic wrong beliefs for lesson 6-1, each answered with a reason. */
  const trap61 = (rng, A, B, variant) => {
    if (variant === 1) {
      const T = A[0];
      const d = B[1];
      const right = `Not here. ${T} ÷ 1/${d} counts how many 1/${d}s fit in ${T}, and that is more than ${T}. | Aquí no. ${T} ÷ 1/${d} cuenta cuántos 1/${d} caben en ${T}, y eso es más que ${T}.`;
      return mcq(rng, {
        q: `Jess says: "Dividing always makes a number smaller, so ${T} ÷ 1/${d} must be less than ${T}." What is the best reply? | Jess dice: "Dividir siempre hace más pequeño un número, así que ${T} ÷ 1/${d} debe ser menor que ${T}". ¿Cuál es la mejor respuesta?`,
        right,
        wrong: [
          [
            "She is right. Dividing always gives a smaller number. | Tiene razón. Dividir siempre da un número menor.",
            "division-makes-smaller",
            "Dividing by a number less than 1 gives MORE pieces. Try a small case: how many halves fit in 1? | Dividir entre un número menor que 1 da MÁS partes. Prueba un caso pequeño: ¿cuántas mitades caben en 1?",
          ],
          [
            `The quotient equals ${T}, because dividing by a fraction does not change the number. | El cociente es igual a ${T}, porque dividir entre una fracción no cambia el número.`,
            "quotient-equals-dividend",
            `Each whole holds more than one piece of size 1/${d}, so the count cannot be ${T}. | Cada entero tiene más de una parte de tamaño 1/${d}, así que la cantidad no puede ser ${T}.`,
          ],
          [
            `The quotient is 1/${d} of ${T}, which is less than ${T}. | El cociente es 1/${d} de ${T}, que es menor que ${T}.`,
            "fraction-of-instead",
            `1/${d} of ${T} is ${T} × 1/${d}. Dividing by 1/${d} asks how many 1/${d}s fit. | 1/${d} de ${T} es ${T} × 1/${d}. Dividir entre 1/${d} pregunta cuántos 1/${d} caben.`,
          ],
          [
            `She is right when the dividend is a whole number, like ${T}. | Tiene razón cuando el dividendo es un número entero, como ${T}.`,
            "whole-dividend-only",
            `${T} is a whole number and the quotient is still bigger. The size of the DIVISOR matters. | ${T} es un número entero y el cociente sigue siendo mayor. Importa el tamaño del DIVISOR.`,
          ],
        ],
        x: `${T} ÷ 1/${d} = ${T} × ${d} = ${T * d}. Dividing by a number less than 1 gives a quotient greater than the dividend. | ${T} ÷ 1/${d} = ${T} × ${d} = ${T * d}. Dividir entre un número menor que 1 da un cociente mayor que el dividendo.`,
        h: [
          "Test the idea with a small example: how many 1/2s fit in 1? | Prueba la idea con un ejemplo pequeño: ¿cuántas mitades caben en 1?",
          `${T} ÷ 1/${d} asks how many pieces of size 1/${d} fit in ${T}. | ${T} ÷ 1/${d} pregunta cuántas partes de tamaño 1/${d} caben en ${T}.`,
          `Does one whole hold more than one piece of size 1/${d}, or fewer? | ¿Un entero contiene más de una parte de tamaño 1/${d}, o menos?`,
        ],
        meta: { kind: "trap", variant: 1, A, B, ans: en(right) },
      });
    }
    const k = B[0];
    const right = `Order matters. ${ask(A, B)} shares ${S(A)} into ${k} parts, but ${k} ÷ ${S(A)} counts how many ${S(A)}s fit in ${k}. | El orden importa. ${ask(A, B)} reparte ${S(A)} en ${k} partes, pero ${k} ÷ ${S(A)} cuenta cuántos ${S(A)} caben en ${k}.`;
    return mcq(rng, {
      q: `Marcus finds ${ask(A, B)} by working out ${k} ÷ ${S(A)}. He says, "You can divide in either order." What is wrong? | Marcus halla ${ask(A, B)} calculando ${k} ÷ ${S(A)}. Dice: "Se puede dividir en cualquier orden". ¿Qué está mal?`,
      right,
      wrong: [
        [
          "Nothing is wrong. Division gives the same answer in either order. | No hay nada mal. La división da la misma respuesta en cualquier orden.",
          "order-doesnt-matter",
          "The two expressions ask different questions: one shares, one counts how many fit. | Las dos expresiones plantean preguntas distintas: una reparte, otra cuenta cuántos caben.",
        ],
        [
          `He should have multiplied ${S(A)} × ${k}. | Debió multiplicar ${S(A)} × ${k}.`,
          "multiplied-instead",
          `Multiplying makes more than ${S(A)}. Sharing ${S(A)} makes each share smaller. | Multiplicar da más que ${S(A)}. Repartir ${S(A)} hace cada parte más pequeña.`,
        ],
        [
          "He should have flipped both numbers first. | Debió invertir los dos números primero.",
          "flipped-both",
          "Only the divisor is flipped, and only when you multiply by its reciprocal. | Solo se invierte el divisor, y solo cuando multiplicas por su recíproco.",
        ],
        [
          `He should have added ${S(A)} + ${k}. | Debió sumar ${S(A)} + ${k}.`,
          "added-instead",
          "The ÷ sign does not mean adding. | El signo ÷ no significa sumar.",
        ],
      ],
      x: `${ask(A, B)} = ${S(div(A, B))} but ${k} ÷ ${S(A)} = ${S(div(B, A))}. Swapping the numbers changes the question and the answer. | ${ask(A, B)} = ${S(div(A, B))} pero ${k} ÷ ${S(A)} = ${S(div(B, A))}. Cambiar los números de lugar cambia la pregunta y la respuesta.`,
      h: [
        "Say each one in words. What question does each one ask? | Di cada una con palabras. ¿Qué pregunta plantea cada una?",
        "Try a simple case: 1/2 ÷ 2 and 2 ÷ 1/2. Are they equal? | Prueba un caso sencillo: 1/2 ÷ 2 y 2 ÷ 1/2. ¿Son iguales?",
        `Estimate both: is each quotient bigger or smaller than ${S(A)}? | Estima ambos: ¿cada cociente es mayor o menor que ${S(A)}?`,
      ],
      meta: { kind: "trap", variant: 2, A, B, ans: en(right) },
    });
  };

  /* ---- check(): recompute from what the item SHOWS, by a different route than make() ------------- */
  const num = (s) => {
    const m = String(s)
      .trim()
      .match(/^(?:(\d+) )?(\d+)(?:\/(\d+))?$/);
    if (!m || (m[1] && !m[3])) return null;
    const d = m[3] ? Number(m[3]) : 1;
    return [(m[1] ? Number(m[1]) : 0) * d + Number(m[2]), d];
  };
  /** Sign of a - b by cross-multiplication; no reducing, no division. */
  const cmp = (a, b) => Math.sign(a[0] * b[1] - b[0] * a[1]);
  const times = (a, b) => [a[0] * b[0], a[1] * b[1]];
  const over = (a, b) => [a[0] * b[1], a[1] * b[0]];
  const OPS = {
    "÷": over,
    "×": times,
    "+": (x, y) => [x[0] * y[1] + y[0] * x[1], x[1] * y[1]],
    "−": (x, y) => [x[0] * y[1] - y[0] * x[1], x[1] * y[1]],
  };
  /** "2 1/2 ÷ 1/4" (optionally "… = ☐") -> { a, op, b } with a and b as [n, d]. */
  const parts = (s) => {
    const m = String(s)
      .replace(/ = ☐$/, "")
      .split(/ ([÷×−+]) /);
    return m.length === 3 && num(m[0]) && num(m[2])
      ? { a: num(m[0]), op: m[1], b: num(m[2]) }
      : null;
  };
  const valueOf = (s) => {
    const p = parts(s);
    return p ? OPS[p.op](p.a, p.b) : null;
  };
  const picked = (item) => item.c[item.a];
  const ok = (cond, msg) => (cond ? true : msg);
  const CHECKS = {
    calc: (item, m) => {
      const Q = num(item.a);
      return ok(Q && cmp(times(Q, m.B), m.A) === 0, `calc: ${item.a} × ${S(m.B)} is not ${S(m.A)}`);
    },
    expr: (item, m) => {
      const hits = item.c.map((c) => {
        const p = parts(c);
        return !!p && p.op === "÷" && cmp(p.a, m.A) === 0 && cmp(p.b, m.B) === 0;
      });
      return ok(hits[item.a] && hits.filter(Boolean).length === 1, `expr: ${JSON.stringify(hits)}`);
    },
    meaning: (item, m) => ok(picked(item) === m.ans, "meaning: marked choice is not the keyed one"),
    interp: (item, m) =>
      ok(cmp(times(m.Q, m.B), m.A) === 0, "interp: shown quotient is not A ÷ B") === true
        ? ok(picked(item) === m.ans, "interp: marked choice is not the keyed one")
        : "interp: shown quotient is not A ÷ B",
    story: (item, m) =>
      ok(cmp(times(m.Q, m.B), m.A) === 0, "story: shown quotient is not A ÷ B") === true
        ? ok(picked(item) === m.ans, "story: marked choice is not the keyed one")
        : "story: shown quotient is not A ÷ B",
    equiv: (item, m) => {
      const target = over(m.A, m.B);
      const hits = item.c.map((c) => {
        const v = valueOf(c);
        return !!v && cmp(v, target) === 0;
      });
      return ok(
        hits[item.a] && hits.filter(Boolean).length === 1,
        `equiv: ${JSON.stringify(hits)}`,
      );
    },
    mulcheck: (item, m) => {
      const hits = item.c.map((c) => {
        const v = valueOf(c);
        return !!v && cmp(v, m.A) === 0;
      });
      return ok(
        cmp(times(m.Q, m.B), m.A) === 0 && hits[item.a] && hits.filter(Boolean).length === 1,
        `mulcheck: ${JSON.stringify(hits)}`,
      );
    },
    rev: (item, m) => {
      const X = num(item.a);
      if (!X || cmp(times(m.Q, m.B), m.A) !== 0) return "rev: Q × B is not A";
      return ok(
        cmp(m.hole === "A" ? over(X, m.B) : over(m.A, X), m.Q) === 0,
        `rev: ${item.a} does not restore the equation`,
      );
    },
    trap: (item, m) => {
      const fact =
        m.variant === 1 ? cmp(over(m.A, m.B), m.A) > 0 : cmp(over(m.A, m.B), over(m.B, m.A)) !== 0;
      return ok(fact, "trap: the fact the reply relies on is false") === true
        ? ok(picked(item) === m.ans, "trap: marked choice is not the keyed one")
        : "trap: the fact the reply relies on is false";
    },
  };
  const check = (item) => {
    const m = item.meta;
    const fn = m && CHECKS[m.kind];
    if (!fn) return `no check for meta.kind=${m?.kind}`;
    if (item.k === "num")
      for (const w of item.fw || [])
        if (Math.abs(R.value(w.v) - R.value(item.a)) < 1e-9)
          return `fw value ${w.v} equals the answer`;
    return fn(item, m);
  };

  /* ---- number pickers and registration ----------------------------------------------------------- */
  const draw = (make, accept = () => true) => {
    for (let i = 0; i < 500; i++) {
      const v = make();
      if (accept(v)) return v;
    }
    throw new Error("fractions.js: no numbers satisfy the constraints");
  };
  /** whole ÷ unit fraction: [[T, 1], [1, d]] with T·d <= qMax. */
  const unitGroup = (rng, tMax, ds, qMax) => {
    const v = draw(
      () => ({ T: rng.int(2, tMax), d: rng.pick(ds) }),
      (o) => o.T * o.d <= qMax,
    );
    return [
      [v.T, 1],
      [1, v.d],
    ];
  };
  /** fraction ÷ whole: [[n, d] in lowest terms, [k, 1]] with d·k <= prodMax. */
  const shareSet = (rng, ds, kMax, prodMax, unitOdds = 0.4) => {
    const v = draw(
      () => {
        const d = rng.pick(ds);
        return { n: rng.chance(unitOdds) ? 1 : rng.int(1, d - 1), d, k: rng.int(2, kMax) };
      },
      (o) => R.gcd(o.n, o.d) === 1 && o.d * o.k <= prodMax,
    );
    return [
      [v.n, v.d],
      [v.k, 1],
    ];
  };
  const roll = (rng, table) => {
    let t = rng.next() * table.reduce((s, r) => s + r[0], 0);
    for (const [w, fn] of table) {
      t -= w;
      if (t < 0) return fn;
    }
    return table[table.length - 1][1];
  };
  const reg = (id, title, titleEs, tables) =>
    R.register(id, {
      title,
      titleEs,
      levels: 4,
      make(rng, level) {
        const fn = roll(rng, tables[level - 1]);
        let item = fn(rng);
        for (let i = 0; i < 30 && leaks(item); i++) item = fn(rng);
        return item;
      },
      check,
    });

  const D6 = [2, 3, 4, 5, 6, 8];
  const either = (rng, a, b) => (rng.chance(0.5) ? a() : b());

  reg(
    "fracDivWhole",
    "Divide with fractions and whole numbers",
    "Dividir con fracciones y números enteros",
    [
      [
        [
          4,
          (rng) => {
            const [A, B] = unitGroup(rng, 4, [2, 3, 4, 5, 6], 12);
            return expression(rng, A, B, "G", { viz: rng.chance(0.5) ? "tape" : "" });
          },
        ],
        [
          3,
          (rng) => {
            const [A, B] = shareSet(rng, [2, 3, 4, 5], 4, 20);
            return expression(rng, A, B, "S", { viz: rng.pick(["", "bar1", "tape"]) });
          },
        ],
        [
          3,
          (rng) => {
            const [A, B] = either(
              rng,
              () => unitGroup(rng, 6, D6, 30),
              () => shareSet(rng, D6, 6, 30),
            );
            return meaning(rng, A, B);
          },
        ],
      ],
      [
        [
          4,
          (rng) => {
            const [A, B] = unitGroup(rng, 8, [2, 3, 4, 5, 6, 8, 10], 40);
            return calc(rng, A, B, rng.chance(0.6) ? "G" : "bare");
          },
        ],
        [
          5,
          (rng) => {
            const [A, B] = shareSet(rng, D6, 6, 30);
            return calc(rng, A, B, rng.chance(0.6) ? "S" : "bare", { bar: rng.chance(0.5) });
          },
        ],
      ],
      [
        [
          4,
          (rng) => {
            const g = rng.chance(0.5);
            const [A, B] = g ? unitGroup(rng, 8, D6, 40) : shareSet(rng, D6, 6, 30);
            return interp(rng, A, B, g ? "G" : "S");
          },
        ],
        [
          3,
          (rng) => {
            const g = rng.chance(0.5);
            const [A, B] = g ? unitGroup(rng, 5, [2, 3, 4, 5, 6], 24) : shareSet(rng, D6, 6, 30);
            return storyMatch(rng, A, B, g ? "G" : "S");
          },
        ],
        [
          3,
          (rng) => {
            const [A, B] = either(
              rng,
              () => unitGroup(rng, 8, D6, 40),
              () => shareSet(rng, D6, 6, 30),
            );
            return equiv(rng, A, B);
          },
        ],
      ],
      [
        [
          3,
          (rng) => {
            const [A, B] = either(
              rng,
              () => unitGroup(rng, 9, D6, 60),
              () => shareSet(rng, D6, 6, 36),
            );
            return reverse(rng, A, B, "A", rng.chance(0.5));
          },
        ],
        [
          3,
          (rng) => {
            const [A, B] = either(
              rng,
              () => unitGroup(rng, 9, D6, 60),
              () => shareSet(rng, D6, 6, 36),
            );
            return reverse(rng, A, B, "B", rng.chance(0.5));
          },
        ],
        [
          2,
          (rng) => {
            const [A, B] = either(
              rng,
              () => unitGroup(rng, 9, D6, 60),
              () => shareSet(rng, D6, 6, 36),
            );
            return mulCheck(rng, A, B);
          },
        ],
        [
          2,
          (rng) => {
            if (rng.chance(0.5)) {
              const [A, B] = unitGroup(rng, 9, D6, 60);
              return trap61(rng, A, B, 1);
            }
            const [A, B] = shareSet(rng, D6, 6, 36);
            return trap61(rng, A, B, 2);
          },
        ],
      ],
    ],
  );

  /* ---- more item types: reciprocal, conversion, set-up, chains, estimates, leftovers ---------------- */
  /** mc whose numeric choices must include exactly one value equal to `target`. */
  const valueMc = (rng, o) =>
    mcq(rng, {
      ...o,
      wrong: o.wrong.filter(([c]) => !same(num(c), o.target)),
      right: FR(o.target),
      meta: { kind: "vals", target: o.target },
    });
  const recip = (rng, A) => {
    const target = inv(A);
    const k = A[1] === 1;
    const cand = k
      ? [
          [
            A,
            "kept-same",
            "That is the same number. A reciprocal swaps the top and bottom (a whole number is k/1). | Es el mismo número. Un recíproco intercambia numerador y denominador (un entero es k/1).",
          ],
          [
            [A[0] - 1, 1],
            "subtracted-one",
            "A reciprocal is not 'one less'. Write the number as k/1 and flip it. | Un recíproco no es 'uno menos'. Escribe el número como k/1 e inviértelo.",
          ],
          [
            [A[0] + 1, 1],
            "added-one",
            "A reciprocal is not 'one more'. Write the number as k/1 and flip it. | Un recíproco no es 'uno más'. Escribe el número como k/1 e inviértelo.",
          ],
          [
            [1, A[0] + 1],
            "off-by-one",
            "The denominator should be the number itself, not one more. | El denominador debe ser el número mismo, no uno más.",
          ],
        ]
      : [
          [
            A,
            "kept-same",
            "That is the same fraction. A reciprocal turns it upside down. | Es la misma fracción. Un recíproco la pone al revés.",
          ],
          [
            minus([1, 1], A),
            "used-complement",
            "That is 1 minus the fraction, how far it is from 1. A reciprocal flips the fraction. | Eso es 1 menos la fracción. Un recíproco invierte la fracción.",
          ],
          [
            plus(A, [1, 1]),
            "added-one",
            "A reciprocal is not 'add one'. Swap the top and bottom numbers. | Un recíproco no es 'sumar uno'. Intercambia numerador y denominador.",
          ],
          [
            [A[1], A[0] + A[1]],
            "swapped-sum",
            "Only swap the top and bottom; do not add them. | Solo intercambia numerador y denominador; no los sumes.",
          ],
        ];
    return valueMc(rng, {
      q: `What is the reciprocal of ${S(A)}? | ¿Cuál es el recíproco de ${S(A)}?`,
      target,
      wrong: cand.map(([r, t, f]) => [FR(r), t, f]),
      x: `The reciprocal of ${S(A)} is ${FR(A)} turned upside down: ${FR(target)}. Check: ${S(A)} × ${FR(target)} = 1. | El recíproco de ${S(A)} es ${FR(A)} al revés: ${FR(target)}. Comprueba: ${S(A)} × ${FR(target)} = 1.`,
      h: [
        "Two numbers are reciprocals when their product is 1. | Dos números son recíprocos cuando su producto es 1.",
        "Write the number as a fraction (a whole number is over 1). | Escribe el número como fracción (un entero va sobre 1).",
        "Swap the top and bottom numbers. | Intercambia el numerador y el denominador.",
      ],
    });
  };
  const convert = (rng, A) => {
    const w = whole(A);
    const f = frac(A);
    const raw = (n, d) => [n, d];
    const cand = [
      [
        raw(w * 10 ** String(f[0]).length + f[0], A[1]),
        "glued-digits",
        "You wrote the whole number and numerator side by side. Multiply the whole number by the denominator, then add. | Escribiste el entero y el numerador juntos. Multiplica el entero por el denominador y suma.",
      ],
      [
        raw(w * A[1], A[1]),
        "forgot-to-add-numerator",
        "You multiplied the whole number by the denominator but forgot to add the numerator. | Multiplicaste el entero por el denominador pero olvidaste sumar el numerador.",
      ],
      [
        raw(w * f[0], A[1]),
        "multiplied-whole-by-numerator",
        "You multiplied the whole number by the numerator. Multiply it by the denominator instead. | Multiplicaste el entero por el numerador. Multiplícalo por el denominador.",
      ],
      [
        raw(w + f[0], A[1]),
        "added-whole-and-numerator",
        "You added the whole number and the numerator. Multiply the whole number by the denominator first. | Sumaste el entero y el numerador. Primero multiplica el entero por el denominador.",
      ],
    ];
    return valueMc(rng, {
      q: `Rewrite ${S(A)} as an improper fraction. | Escribe ${S(A)} como fracción impropia.`,
      target: A,
      wrong: cand.map(([r, t, fb]) => [`${r[0]}/${r[1]}`, t, fb]),
      x: `${w} × ${A[1]} + ${f[0]} = ${A[0]}, and the denominator stays ${A[1]}: ${S(A)} = ${FR(A)}. | ${w} × ${A[1]} + ${f[0]} = ${A[0]}, y el denominador sigue siendo ${A[1]}: ${S(A)} = ${FR(A)}.`,
      h: [
        "An improper fraction has a numerator bigger than its denominator. | Una fracción impropia tiene un numerador mayor que su denominador.",
        "Multiply the whole number by the denominator, then add the numerator. | Multiplica el entero por el denominador y suma el numerador.",
        `Here: ${w} × ${A[1]} + ${f[0]}, over the same denominator ${A[1]}. | Aquí: ${w} × ${A[1]} + ${f[0]}, sobre el mismo denominador ${A[1]}.`,
      ],
    });
  };
  /** Which choice rewrites A ÷ B as improper fractions multiplied by the reciprocal? */
  const setup = (rng, A, B) => {
    const x = (a, op, b) => `${a} ${op} ${b}`;
    const r = FR(inv(B));
    const wrong = [
      [
        x(FR(A), "×", FR(B)),
        "forgot-to-flip",
        `This keeps ${FR(B)} as it is. The divisor gets flipped. | Esto deja ${FR(B)} como está. El divisor se invierte.`,
      ],
      [
        x(FR(inv(A)), "×", FR(B)),
        "inverted-wrong-fraction",
        `This flips ${FR(A)}, the first number. Only the divisor is flipped. | Esto invierte ${FR(A)}, el primer número. Solo se invierte el divisor.`,
      ],
      [
        x(FR(inv(A)), "×", r),
        "flipped-both",
        "This flips both numbers. Only the divisor is flipped. | Esto invierte los dos números. Solo se invierte el divisor.",
      ],
      [
        x(FR(A), "÷", r),
        "kept-division-sign",
        "This flips the divisor but keeps ÷. Change ÷ to × when you flip. | Esto invierte el divisor pero deja ÷. Cambia ÷ por × al invertir.",
      ],
    ];
    if (isMixed(A))
      wrong.push([
        x(S(A), "×", r),
        "forgot-to-convert",
        `${S(A)} is still a mixed number. Rewrite it as an improper fraction first. | ${S(A)} sigue siendo un número mixto. Primero escríbelo como fracción impropia.`,
      ]);
    return mcq(rng, {
      q: `Which choice rewrites ${ask(A, B)} as a multiplication of improper fractions, using the reciprocal? | ¿Qué opción reescribe ${ask(A, B)} como multiplicación de fracciones impropias, con el recíproco?`,
      right: x(FR(A), "×", r),
      wrong,
      x: cat(work(A, B, div(A, B))),
      h: [
        "Convert mixed numbers to improper fractions first. | Primero convierte los números mixtos en fracciones impropias.",
        "Keep the first number, change ÷ to ×, and flip only the divisor. | Conserva el primer número, cambia ÷ por × e invierte solo el divisor.",
        `The divisor is ${S(B)}. What do you get when you flip it? | El divisor es ${S(B)}. ¿Qué obtienes al invertirlo?`,
      ],
      meta: { kind: "setup", A, B },
    });
  };
  /** (A ÷ B) ÷ C, two divisions in a row. */
  const chain = (rng, A, B, C) => {
    const Q1 = div(A, B);
    const Q2 = div(Q1, C);
    return numq({
      q: cat(`Find (${ask(A, B)}) ÷ ${S(C)}. | Calcula (${ask(A, B)}) ÷ ${S(C)}.`, tailFmt(Q2)),
      a: Q2,
      fw: [
        [
          Q1,
          "stopped-after-step-1",
          `That is only ${ask(A, B)}. There is a second division. | Eso es solo ${ask(A, B)}. Hay una segunda división.`,
        ],
        [
          div(A, div(B, C)),
          "ignored-parentheses",
          `That divides ${S(A)} by (${S(B)} ÷ ${S(C)}). Work inside the parentheses first. | Eso divide ${S(A)} entre (${S(B)} ÷ ${S(C)}). Primero resuelve lo que está entre paréntesis.`,
        ],
        [
          mul(Q1, C),
          "multiplied-instead",
          `That multiplies by ${S(C)} in the second step. Divide instead. | Eso multiplica por ${S(C)} en el segundo paso. Divide.`,
        ],
      ],
      x: cat(`First: | Primero:`, work(A, B, Q1), "Then: | Luego:", work(Q1, C, Q2)),
      h: [
        "Work inside the parentheses first. | Primero resuelve lo que está entre paréntesis.",
        `Find ${ask(A, B)}, then divide that quotient by ${S(C)}. | Halla ${ask(A, B)} y luego divide ese cociente entre ${S(C)}.`,
        `${ask(A, B)} is the same as ${FR(A)} × ${FR(inv(B))}. | ${ask(A, B)} es lo mismo que ${FR(A)} × ${FR(inv(B))}.`,
      ],
      meta: { kind: "chain", A, B, C },
    });
  };
  /** Greater or less than the dividend? Depends only on whether the divisor is below or above 1. */
  const bigger = (rng, A, B) => {
    const less = cmp(B, [1, 1]) < 0;
    const [rt, wr1, wr2, wr3] = less
      ? [
          [
            `Greater than ${S(A)}. A divisor less than 1 makes the quotient bigger. | Mayor que ${S(A)}. Un divisor menor que 1 hace el cociente más grande.`,
          ],
          [
            `Less than ${S(A)}, because dividing always makes a number smaller. | Menor que ${S(A)}, porque dividir siempre hace más pequeño un número.`,
            "division-makes-smaller",
            "Dividing by a number less than 1 fits MORE groups. Try 2 ÷ 1/2. | Dividir entre un número menor que 1 cabe MÁS grupos. Prueba 2 ÷ 1/2.",
          ],
          [
            `Equal to ${S(A)}, because dividing by a fraction does not change the number. | Igual a ${S(A)}, porque dividir entre una fracción no cambia el número.`,
            "quotient-equals-dividend",
            "Only dividing by exactly 1 leaves a number unchanged. | Solo dividir entre exactamente 1 deja el número igual.",
          ],
          [
            `Less than ${S(A)}, because ${S(B)} is smaller than ${S(A)}. | Menor que ${S(A)}, porque ${S(B)} es menor que ${S(A)}.`,
            "compared-divisor-to-dividend",
            "What matters is whether the divisor is more or less than 1, not how it compares with the dividend. | Importa si el divisor es mayor o menor que 1, no cómo se compara con el dividendo.",
          ],
        ]
      : [
          [
            `Less than ${S(A)}. A divisor greater than 1 makes the quotient smaller. | Menor que ${S(A)}. Un divisor mayor que 1 hace el cociente más pequeño.`,
          ],
          [
            `Greater than ${S(A)}, because dividing by a fraction always gives a bigger number. | Mayor que ${S(A)}, porque dividir entre una fracción siempre da un número mayor.`,
            "fraction-always-bigger",
            "That is only true when the fraction is less than 1. Here the divisor is more than 1. | Eso solo es cierto si la fracción es menor que 1. Aquí el divisor es mayor que 1.",
          ],
          [
            `Equal to ${S(A)}, because dividing by a fraction does not change the number. | Igual a ${S(A)}, porque dividir entre una fracción no cambia el número.`,
            "quotient-equals-dividend",
            "Only dividing by exactly 1 leaves a number unchanged. | Solo dividir entre exactamente 1 deja el número igual.",
          ],
          [
            `Greater than ${S(A)}, because ${S(B)} has a fraction part. | Mayor que ${S(A)}, porque ${S(B)} tiene una parte fraccionaria.`,
            "divisor-has-fraction",
            "Compare the divisor with 1, not whether it has a fraction part. | Compara el divisor con 1, no si tiene parte fraccionaria.",
          ],
        ];
    return mcq(rng, {
      q: `Without calculating, will ${ask(A, B)} be greater than or less than ${S(A)}? | Sin calcular, ¿${ask(A, B)} será mayor o menor que ${S(A)}?`,
      right: rt[0],
      wrong: [wr1, wr2, wr3],
      x: `${S(B)} is ${less ? "less" : "greater"} than 1, so the quotient is ${less ? "greater" : "less"} than ${S(A)}. In fact ${ask(A, B)} = ${S(div(A, B))}. | ${S(B)} es ${less ? "menor" : "mayor"} que 1, así que el cociente es ${less ? "mayor" : "menor"} que ${S(A)}. De hecho ${ask(A, B)} = ${S(div(A, B))}.`,
      h: [
        "Compare the divisor with 1. | Compara el divisor con 1.",
        "How many groups of the divisor fit in 1 whole: more than one, or less than one? | ¿Cuántos grupos del divisor caben en 1 entero: más de uno o menos de uno?",
        `Is ${S(B)} more than 1 or less than 1? | ¿${S(B)} es mayor o menor que 1?`,
      ],
      meta: { kind: "bigger", A, B },
    });
  };
  /** Which range holds W ÷ P? Benchmarks: ÷1 = W, ÷1/2 = 2W, ÷1/3 = 3W. */
  const band = (rng, Wn, P) => {
    const k = Math.floor(P[1] / P[0]);
    const text = (i) =>
      [
        `Less than ${Wn} | Menos de ${Wn}`,
        `Between ${Wn} and ${2 * Wn} | Entre ${Wn} y ${2 * Wn}`,
        `Between ${2 * Wn} and ${3 * Wn} | Entre ${2 * Wn} y ${3 * Wn}`,
        `More than ${3 * Wn} | Más de ${3 * Wn}`,
      ][i];
    const bench = `Use benchmarks: ${Wn} ÷ 1 = ${Wn}, ${Wn} ÷ 1/2 = ${2 * Wn}, ${Wn} ÷ 1/3 = ${3 * Wn}. Where does ${S(P)} sit? | Usa referencias: ${Wn} ÷ 1 = ${Wn}, ${Wn} ÷ 1/2 = ${2 * Wn}, ${Wn} ÷ 1/3 = ${3 * Wn}. ¿Dónde está ${S(P)}?`;
    const wrong = [0, 1, 2, 3]
      .filter((i) => i !== k)
      .map((i) => [
        text(i),
        i === 0 ? "division-makes-smaller" : i > k ? "overestimated" : "underestimated",
        i === 0
          ? "Dividing by a fraction less than 1 gives MORE than the whole number. | Dividir entre una fracción menor que 1 da MÁS que el número entero."
          : bench,
      ]);
    return mcq(rng, {
      q: `Which range holds ${Wn} ÷ ${S(P)}? | ¿En qué rango está ${Wn} ÷ ${S(P)}?`,
      right: text(k),
      wrong,
      x: `${S(P)} is ${P[0] * 2 > P[1] ? "between 1/2 and 1" : "between 1/3 and 1/2"}, so ${Wn} ÷ ${S(P)} falls ${k === 1 ? `between ${Wn} and ${2 * Wn}` : `between ${2 * Wn} and ${3 * Wn}`}. Exactly, ${Wn} ÷ ${S(P)} = ${S(div([Wn, 1], P))}. | ${S(P)} está ${P[0] * 2 > P[1] ? "entre 1/2 y 1" : "entre 1/3 y 1/2"}, así que ${Wn} ÷ ${S(P)} queda ${k === 1 ? `entre ${Wn} y ${2 * Wn}` : `entre ${2 * Wn} y ${3 * Wn}`}. Exactamente, ${Wn} ÷ ${S(P)} = ${S(div([Wn, 1], P))}.`,
      h: [
        "Compare the fraction with the benchmarks 1, 1/2 and 1/3. | Compara la fracción con las referencias 1, 1/2 y 1/3.",
        "A smaller divisor fits more groups, so the quotient is bigger. | Un divisor menor cabe más grupos, así que el cociente es mayor.",
        bench,
      ],
      meta: { kind: "band", Wn, P, ans: en(text(k)) },
    });
  };
  /** How many FULL groups? The quotient is not a whole number; only its whole part counts. */
  const full = (rng, T, P) => {
    const Q = div(T, P);
    const f = whole(Q);
    const v = { N: rng.pick(NAMES), T, P };
    const kit = kitFor(rng, "G", v);
    return numq({
      q: story(kit, "G", v, { full: true }),
      a: [f, 1],
      unit: kit.N,
      fw: [
        [
          Q,
          "included-leftover",
          `${S(Q)} counts the leftover part too. Only whole groups count here. | ${S(Q)} cuenta también la parte que sobra. Aquí solo cuentan los grupos completos.`,
        ],
        [
          [f + 1, 1],
          "rounded-up",
          "A group that is only partly filled is not a full group, so do not round up. | Un grupo lleno solo en parte no es un grupo completo, así que no redondees hacia arriba.",
        ],
        [
          div(P, T),
          "swapped-dividend-divisor",
          `That is ${ask(P, T)}. The total goes first. | Eso es ${ask(P, T)}. El total va primero.`,
        ],
      ],
      x: cat(
        work(T, P, Q),
        `The whole-number part counts full groups, so the answer is ${f}. | La parte entera cuenta los grupos completos, así que la respuesta es ${f}.`,
      ),
      h: [
        "First divide to see how many groups fit, even if the answer is not whole. | Primero divide para ver cuántos grupos caben, aunque la respuesta no sea entera.",
        "Only complete groups count. Look at the whole-number part. | Solo cuentan los grupos completos. Mira la parte entera.",
        `Divide ${S(T)} by ${S(P)}. | Divide ${S(T)} entre ${S(P)}.`,
      ],
      meta: { kind: "full", A: T, B: P },
    });
  };
  /** After the full groups are made, how much is left (in the story's unit)? */
  const leftover = (rng, T, P) => {
    const Q = div(T, P);
    const f = whole(Q);
    const L = mul(frac(Q), P);
    const v = { N: rng.pick(NAMES), T, P };
    const kit = kitFor(rng, "G", v);
    return numq({
      q: cat(
        story(kit, "G", v, { noAsk: true }),
        "After making as many full groups as possible, how much is left over? | Después de hacer todos los grupos completos posibles, ¿cuánto sobra?",
        tailFmt(L),
      ),
      a: L,
      unit: uLab(kit.u, L),
      fw: [
        [
          frac(Q),
          "fraction-is-amount",
          `${S(frac(Q))} is the leftover as part of ONE group, not an amount in the story's unit. | ${S(frac(Q))} es lo que sobra como parte de UN grupo, no una cantidad en la unidad de la situación.`,
        ],
        [
          minus(P, L),
          "used-complement",
          "That is how much more would be needed to fill one more group. | Eso es lo que faltaría para llenar un grupo más.",
        ],
        [
          [f, 1],
          "answered-count",
          "That is the number of full groups, not the amount left. | Esa es la cantidad de grupos completos, no lo que sobra.",
        ],
      ],
      x: cat(
        work(T, P, Q),
        `${f} full groups use ${f} × ${S(P)} = ${S(mul([f, 1], P))}. Left over: ${S(T)} − ${S(mul([f, 1], P))} = ${S(L)}. | ${f} grupos completos usan ${f} × ${S(P)} = ${S(mul([f, 1], P))}. Sobra: ${S(T)} − ${S(mul([f, 1], P))} = ${S(L)}.`,
      ),
      h: [
        "Find how many full groups you can make first. | Primero halla cuántos grupos completos puedes hacer.",
        "Multiply the number of full groups by the size of one group to find how much was used. | Multiplica los grupos completos por el tamaño de un grupo para hallar lo usado.",
        "Subtract the amount used from the total. | Resta lo usado del total.",
      ],
      meta: { kind: "left", A: T, B: P },
    });
  };
  /** Two stages: T ÷ P whole groups, then packed m to a box; how many FULL boxes? */
  const twoStage = (rng, T, P, m) => {
    const N = div(T, P)[0];
    const f = Math.floor(N / m);
    const v = { N: rng.pick(NAMES), T, P, m };
    const kit = kitFor(rng, "X", v);
    return numq({
      q: cat(
        story(kit, "G", v, { noAsk: true }),
        fill(kit.X[0], v, kit.u),
        fill(kit.X[1], v, kit.u),
      ),
      a: [f, 1],
      fw: [
        [
          [N, 1],
          "stopped-after-step-1",
          `${N} is only the first stage. Now group those by ${m}. | ${N} es solo la primera etapa. Ahora agrúpalos de ${m} en ${m}.`,
        ],
        ...(N % m
          ? [
              [
                [f + 1, 1],
                "rounded-up",
                "A box that is not full does not count. | Una caja que no está llena no cuenta.",
              ],
            ]
          : []),
        [
          mul([N, 1], [m, 1]),
          "multiplied-instead",
          `Grouping by ${m} means dividing, not multiplying. | Agrupar de ${m} en ${m} es dividir, no multiplicar.`,
        ],
      ],
      x: cat(
        work(T, P, [N, 1]),
        `Then ${N} ÷ ${m}: ${f} full group${f === 1 ? "" : "s"}${N % m ? ` and ${N % m} left over` : ""}. | Luego ${N} ÷ ${m}: ${f} grupo${f === 1 ? "" : "s"} completo${f === 1 ? "" : "s"}${N % m ? ` y sobran ${N % m}` : ""}.`,
      ),
      h: [
        "There are two stages. Do the first division, then use its answer in the second. | Hay dos etapas. Haz la primera división y usa su respuesta en la segunda.",
        `First find how many groups fit: ${ask(T, P)}. | Primero halla cuántos grupos caben: ${ask(T, P)}.`,
        `Then divide that number by ${m} and keep only the full groups. | Luego divide ese número entre ${m} y conserva solo los grupos completos.`,
      ],
      meta: { kind: "two", A: T, B: P, m },
    });
  };

  Object.assign(CHECKS, {
    vals: (item, m) => {
      const hits = item.c.map((c) => {
        const v = num(c);
        return !!v && cmp(v, m.target) === 0;
      });
      return ok(hits[item.a] && hits.filter(Boolean).length === 1, `vals: ${JSON.stringify(hits)}`);
    },
    setup: (item, m) => {
      const hits = item.c.map((c) => {
        const p = String(c).match(/^(\S+) × (\S+)$/);
        return !!p && cmp(num(p[1]), m.A) === 0 && cmp(num(p[2]), [m.B[1], m.B[0]]) === 0;
      });
      return ok(
        hits[item.a] && hits.filter(Boolean).length === 1,
        `setup: ${JSON.stringify(hits)}`,
      );
    },
    chain: (item, m) => {
      const X = num(item.a);
      return ok(X && cmp(times(times(X, m.C), m.B), m.A) === 0, "chain: answer × C × B is not A");
    },
    bigger: (item, m) => {
      const word = cmp(over(m.A, m.B), m.A) > 0 ? "Greater" : "Less";
      const hits = item.c.map((c) => c.startsWith(word));
      return ok(
        hits[item.a] && hits.filter(Boolean).length === 1,
        `bigger: ${JSON.stringify(hits)}`,
      );
    },
    band: (item, m) => {
      const q = m.Wn * m.P[1];
      const k = Math.floor(q / (m.Wn * m.P[0]));
      const lo = [0, 1, 2, 3][k];
      const t = picked(item);
      const want =
        lo === 0
          ? `Less than ${m.Wn}`
          : lo === 3
            ? `More than ${3 * m.Wn}`
            : `Between ${lo * m.Wn} and ${(lo + 1) * m.Wn}`;
      return ok(t === want && t === m.ans, `band: expected "${want}", marked "${t}"`);
    },
    full: (item, m) => {
      const n = m.A[0] * m.B[1];
      const d = m.A[1] * m.B[0];
      return ok(
        Number(item.a) === (n - (n % d)) / d && n % d !== 0,
        "full: not the whole part of a non-whole quotient",
      );
    },
    left: (item, m) => {
      const n = m.A[0] * m.B[1];
      const d = m.A[1] * m.B[0];
      const f = (n - (n % d)) / d;
      const X = num(item.a);
      return ok(
        X && n % d !== 0 && cmp(X, [m.A[0] * m.B[1] - f * m.B[0] * m.A[1], m.A[1] * m.B[1]]) === 0,
        "left: A − full × B differs",
      );
    },
    two: (item, m) => {
      const n = m.A[0] * m.B[1];
      const d = m.A[1] * m.B[0];
      return ok(
        n % d === 0 && Number(item.a) === Math.floor(n / d / m.m),
        "two: stage-2 count differs",
      );
    },
  });

  /* ---- more number pickers ------------------------------------------------------------------------- */
  const QW = [2, 3, 4, 5, 6, 8, 9].map((n) => [n, 1]);
  const QM = [
    [3, 2],
    [5, 2],
    [4, 3],
    [5, 3],
    [5, 4],
    [7, 4],
    [7, 2],
  ];
  const QP = [
    [1, 2],
    [1, 3],
    [2, 3],
    [1, 4],
    [3, 4],
    [2, 5],
    [3, 5],
  ];
  const proper = (rng, ds) => {
    const v = draw(
      () => {
        const d = rng.pick(ds);
        return [rng.int(1, d - 1), d];
      },
      (o) => R.gcd(o[0], o[1]) === 1,
    );
    return v;
  };
  /** Build A from a chosen quotient so every division is exact: returns [A, B]. mixB: divisor may be mixed. */
  const pairBy = (
    rng,
    { qs, ds = [2, 3, 4, 6, 8, 10, 12], mixA = false, mixB = false, aMax = 30 },
  ) => {
    const v = draw(
      () => {
        let B = proper(rng, ds);
        if (mixB) B = plus(B, [rng.int(1, 2), 1]);
        const Q = rng.pick(qs);
        return [mul(Q, B), B, Q];
      },
      ([A, B, Q]) =>
        A[1] <= 12 &&
        A[0] <= aMax &&
        !same(A, B) &&
        !same(Q, [1, 1]) &&
        A[1] > 1 === true &&
        (!mixA || isMixed(A)) &&
        (mixA || A[0] <= 2 * A[1]),
    );
    return [v[0], v[1]];
  };
  /** whole ÷ fraction: [[W, 1], [c, d]] with c >= 2. */
  const wholeFrac = (rng, wMax = 12) => {
    const B = draw(
      () => {
        const d = rng.int(3, 10);
        return [rng.int(2, 5), d];
      },
      (o) => R.gcd(o[0], o[1]) === 1 && o[0] < o[1],
    );
    return [[rng.int(2, wMax), 1], B];
  };
  /** T = Q × P with Q whole (exact) or Q = whole + fraction (leftover). */
  const groupSet = (rng, leftoverToo) => {
    const v = draw(
      () => {
        const P = proper(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
        const Q = leftoverToo
          ? plus(
              [rng.int(1, 6), 1],
              rng.pick([
                [1, 2],
                [1, 3],
                [2, 3],
                [1, 4],
                [3, 4],
              ]),
            )
          : [rng.int(2, 9), 1];
        return [mul(Q, P), P];
      },
      ([T, P]) => T[1] <= 12 && T[0] <= 40,
    );
    return v;
  };

  reg("fracDivMixed", "Divide fractions and mixed numbers", "Dividir fracciones y números mixtos", [
    [
      [
        3,
        (rng) => recip(rng, rng.chance(0.3) ? [rng.int(2, 9), 1] : proper(rng, [2, 3, 4, 5, 6, 8])),
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QP], aMax: 12 });
          return expression(rng, A, B, "G");
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QP, ...QM], aMax: 12 });
          return meaning(rng, A, B);
        },
      ],
    ],
    [
      [
        4,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM, ...QP], aMax: 12 });
          return calc(rng, A, B, "bare");
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM], aMax: 12 });
          return calc(rng, A, B, "G");
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QP, ...QM], aMax: 12 });
          return calc(rng, A, B, "W");
        },
      ],
    ],
    [
      [
        3,
        (rng) =>
          convert(
            rng,
            mixedOf(
              rng.int(1, 5),
              ...rng.pick([
                [1, 2],
                [2, 3],
                [3, 4],
                [2, 5],
                [1, 4],
                [3, 5],
                [5, 6],
              ]),
            ),
          ),
      ],
      [
        4,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM], mixA: true, aMax: 40 });
          return calc(rng, A, B, rng.chance(0.5) ? "G" : "bare");
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM, ...QP], mixA: true, aMax: 40 });
          return setup(rng, A, B);
        },
      ],
    ],
    [
      [
        4,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW.slice(0, 4), ...QM], aMax: 12 });
          const C = rng.pick([
            [2, 1],
            [3, 1],
            [1, 2],
            [3, 2],
          ]);
          return chain(rng, A, B, C);
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM, ...QP], aMax: 12 });
          return reverse(rng, A, B, "A", false);
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM, ...QP], aMax: 12 });
          return reverse(rng, A, B, "B", false);
        },
      ],
    ],
  ]);

  reg(
    "wholeDivFrac",
    "Divide whole numbers by fractions",
    "Dividir números enteros entre fracciones",
    [
      [
        [
          4,
          (rng) => {
            const [A, B] = wholeFrac(rng, 9);
            return setup(rng, A, B);
          },
        ],
        [
          3,
          (rng) => {
            const [A, B] = unitGroup(rng, 9, [2, 3, 4, 5, 6, 8], 40);
            return calc(rng, A, B, rng.chance(0.5) ? "G" : "bare");
          },
        ],
        [2, (rng) => recip(rng, wholeFrac(rng)[1])],
      ],
      [
        [3, (rng) => calc(rng, ...wholeFrac(rng), "bare")],
        [4, (rng) => calc(rng, ...wholeFrac(rng), "G")],
        [4, (rng) => calc(rng, ...wholeFrac(rng), "W")],
      ],
      [
        [
          4,
          (rng) => {
            const [A, B] = wholeFrac(rng, 12);
            return bigger(rng, A, rng.chance(0.3) ? inv(B) : B);
          },
        ],
        [
          4,
          (rng) => {
            const P = draw(
              () => proper(rng, [3, 4, 5, 6, 7, 8, 9, 10]),
              (o) => o[0] * 2 !== o[1] && o[1] < o[0] * 3 + 3 && o[1] > o[0] * 1 && o[0] * 3 > o[1],
            );
            return band(rng, rng.int(2, 9), P);
          },
        ],
      ],
      [
        [
          3,
          (rng) => {
            const [A, B] = wholeFrac(rng);
            return reverse(rng, A, B, "A", rng.chance(0.6));
          },
        ],
        [
          3,
          (rng) => {
            const [A, B] = wholeFrac(rng);
            return reverse(rng, A, B, "B", rng.chance(0.4));
          },
        ],
        [
          2,
          (rng) => {
            const [A, B] = wholeFrac(rng);
            return mulCheck(rng, A, B);
          },
        ],
      ],
    ],
  );

  const mixedSet = (rng, qs, mixB) =>
    pairBy(rng, { qs, ds: [2, 3, 4, 5, 6], mixA: true, mixB, aMax: 48 });
  reg("mixedDivide", "Divide mixed numbers", "Dividir números mixtos", [
    [
      [
        3,
        (rng) =>
          convert(
            rng,
            mixedOf(
              rng.int(1, 6),
              ...rng.pick([
                [1, 2],
                [2, 3],
                [3, 4],
                [2, 5],
                [1, 4],
                [3, 5],
                [5, 6],
                [1, 3],
              ]),
            ),
          ),
      ],
      [
        4,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW, ...QM], false);
          return setup(rng, A, B);
        },
      ],
      [2, (rng) => recip(rng, proper(rng, [2, 3, 4, 5, 6, 8]))],
    ],
    [
      [
        4,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW, ...QM], false);
          return calc(rng, A, B, "bare");
        },
      ],
      [
        4,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW, ...QM], false);
          return calc(rng, A, B, "G");
        },
      ],
      [
        2,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW, ...QM], true);
          return setup(rng, A, B);
        },
      ],
    ],
    [
      [
        4,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW.slice(0, 5), ...QM], true);
          return calc(rng, A, B, "bare");
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW.slice(0, 5), ...QM], true);
          return calc(rng, A, B, "G");
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW.slice(0, 5), ...QM], rng.chance(0.6));
          return bigger(rng, A, B);
        },
      ],
    ],
    [
      [
        4,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW.slice(0, 5), ...QM, ...QP], true);
          return reverse(rng, A, B, "A", false);
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW.slice(0, 5), ...QM], true);
          return reverse(rng, A, B, "B", false);
        },
      ],
      [
        4,
        (rng) => {
          const [A, B] = mixedSet(rng, [...QW.slice(0, 4), ...QM], false);
          return chain(
            rng,
            A,
            B,
            rng.pick([
              [2, 1],
              [3, 1],
              [3, 2],
              [5, 4],
            ]),
          );
        },
      ],
    ],
  ]);

  reg("fracDivWord", "Fraction division word problems", "Problemas de división de fracciones", [
    [
      [
        4,
        (rng) => {
          const [A, B] = groupSet(rng, false);
          return expression(rng, A, B, "G", { eq: true });
        },
      ],
      [
        3,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM], aMax: 12 });
          return expression(rng, A, B, "W", { eq: true });
        },
      ],
    ],
    [
      [
        5,
        (rng) => {
          const [A, B] = groupSet(rng, false);
          return calc(rng, A, B, "G");
        },
      ],
      [
        4,
        (rng) => {
          const [A, B] = pairBy(rng, { qs: [...QW, ...QM], aMax: 12 });
          return calc(rng, A, B, "W");
        },
      ],
    ],
    [
      [5, (rng) => full(rng, ...groupSet(rng, true))],
      [
        3,
        (rng) => {
          const [A, B] = groupSet(rng, true);
          return calc(rng, A, B, "G");
        },
      ],
    ],
    [
      [
        4,
        (rng) => {
          const [T, P] = groupSet(rng, false);
          return twoStage(rng, T, P, rng.int(2, 4));
        },
      ],
      [4, (rng) => leftover(rng, ...groupSet(rng, true))],
      [3, (rng) => twoStage(rng, ...groupSet(rng, false), rng.int(2, 5))],
    ],
  ]);
})();
