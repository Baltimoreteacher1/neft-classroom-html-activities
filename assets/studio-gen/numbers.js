/**
 * Practice Studio generators for the number-sense lessons (window.StudioGen).
 *
 *   longDivision decimalDivision decimalAddSub decimalMultiply     lessons 2-6, 2-7, 2-11, 2-12
 *   factorsMultiples gcfFind lcmFind primeFactorization            lessons 6-7, 6-12, 6-13, 6-14
 *   exponentEval orderOfOps                                        lessons 6-3, 6-4
 *
 * Contract: docs/specs/practice-studio-v2.md section 4 and assets/studio-gen/core.js. Every item carries q/qEs, a worked
 * explanation x/xEs, a hint ladder h/hEs, a meta object and an independent check(). Wrong answers are NAMED
 * misconceptions: a multiple-choice item gets tag[] (and cEs[] when a choice has words) aligned with c[]; a typed item
 * lists its common wrong values in fw[] (each with tag and fEs). No feedback line ever prints the right answer.
 *
 * make() builds each problem FORWARD (pick the answer, then the problem). check() re-derives the key from meta by a
 * different route (the paper algorithm, counting, a shunting-yard parser, ...), so a slip on either side is caught.
 *
 * Text is written once as [English, Spanish] pairs with {name} placeholders that are filled from the item's variable
 * bag V. Feedback that more than one problem type needs lives in FB, keyed by the misconception tag. Text tables and
 * item specs are marked prettier-ignore / biome-ignore so each bilingual pair stays on one line instead of four.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  const { fmt, commas, lcm } = G;

  /* ---- numbers and text ---------------------------------------------------------------------------------------- */
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  /** 3 -> "³", 12 -> "¹²" */
  const sup = (/** @type {number} */ n) => [...String(n)].map((d) => SUP[Number(d)]).join("");
  /** "2³" */
  const pw = (/** @type {number} */ b, /** @type {number} */ e) => `${b}${sup(e)}`;
  /** thousands commas in the whole part: 12500 -> "12,500", 1204.5 -> "1,204.5" */
  const cm = (/** @type {number} */ n) => {
    const [whole, frac] = fmt(n).split(".");
    return frac ? `${commas(Number(whole))}.${frac}` : commas(Number(whole));
  };
  /** integer n scaled by 10^dp, always showing dp places: dec(1230, 2) = "12.30" */
  const dec = (/** @type {number} */ n, /** @type {number} */ dp) => {
    const s = String(n).padStart(dp + 1, "0");
    return dp ? `${s.slice(0, -dp)}.${s.slice(-dp)}` : s;
  };
  /** the same value without trailing zeros: dt(1230, 2) = "12.3", dt(500, 2) = "5" */
  const dt = (/** @type {number} */ n, /** @type {number} */ dp) => cm(n / 10 ** dp);
  /** a plain (no comma) value for typed answers */
  const pv = (/** @type {number} */ n, /** @type {number} */ dp) => fmt(n / 10 ** dp);
  const digitsOf = (/** @type {number} */ n) => String(n).length;
  const cap = (/** @type {string} */ s) => s[0].toUpperCase() + s.slice(1);
  const NAMES =
    "Ava Ben Carla Dev Elena Femi Gus Hana Ivan Jada Kai Lena Mateo Nia Omar Priya Rosa Sam Tariq Uma Wen Zoe".split(
      " ",
    );
  /** draw from gen() until ok(v) holds; the last draw is returned after `tries`, so a seed can never loop forever */
  const draw = (
    /** @type {() => any} */ gen,
    /** @type {(v: any) => boolean} */ ok,
    tries = 150,
  ) => {
    let v = gen();
    for (let i = 0; i < tries && !ok(v); i++) v = gen();
    return v;
  };
  /** parse a table written as "a|b|c" rows */
  const rows = (/** @type {string[]} */ list) => list.map((s) => s.split("|"));

  /* ---- Spanish agreement ---------------------------------------------------------------------------------------- */
  const gn = (/** @type {string} */ g, /** @type {string} */ m, /** @type {string} */ f) =>
    g === "f" ? f : m;
  /** words that agree with a noun of gender g; prefix p keeps the thing (a) and the container (b) apart */
  // prettier-ignore
  // biome-ignore format: one agreement word per column
  const gv = (/** @type {string} */ p, /** @type {string} */ g) => ({
    [`${p}Cu`]: gn(g, "cuántos", "cuántas"), [`${p}CuC`]: gn(g, "Cuántos", "Cuántas"), [`${p}El`]: gn(g, "el", "la"), [`${p}ElC`]: gn(g, "El", "La"),
    [`${p}Los`]: gn(g, "los", "las"), [`${p}Un`]: gn(g, "un", "una"), [`${p}Lleno`]: gn(g, "lleno", "llena"), [`${p}Llenos`]: gn(g, "llenos", "llenas"),
    [`${p}Ult`]: gn(g, "último", "última"), [`${p}Todos`]: gn(g, "todos", "todas"), [`${p}Nuevo`]: gn(g, "nuevo", "nueva"), [`${p}Compl`]: gn(g, "completos", "completas"),
  });

  /* ---- item builders ---------------------------------------------------------------------------------------------- */
  /** @type {Record<string, string[]>} feedback by misconception tag; {name} placeholders come from the item's V */
  const FB = {};
  const sub = (/** @type {any} */ s, /** @type {any} */ V) =>
    String(s).replace(/\{(\w+)\}/g, (m, k) => (k in V ? String(V[k]) : m));
  /** a [en, es] pair (or one language-neutral string) with its placeholders filled */
  const both = (/** @type {any} */ p, /** @type {any} */ V) =>
    Array.isArray(p) ? [sub(p[0], V), sub(p[1], V)] : [sub(p, V), sub(p, V)];
  const fb = (/** @type {string} */ tag) => {
    if (!FB[tag]) throw new Error(`numbers.js: no feedback written for "${tag}"`);
    return FB[tag];
  };
  const ladder = (/** @type {any[]} */ h, /** @type {any} */ V) => {
    const pairs = h.map((p) => both(p, V));
    return { h: pairs.map((p) => p[0]), hEs: pairs.map((p) => p[1]) };
  };
  /**
   * Multiple choice. o = { q, a, w:[[choice, tag, feedback?]], x, h:[3 pairs], meta }. q / x / h / choices are [en, es]
   * pairs (a choice may be one plain string); wrong feedback defaults to FB[tag]. Candidates are listed best first and
   * G.mc keeps the first three distinct ones. Adds tag[] (null at the key) and cEs[] when any choice carries words.
   */
  const mcB = (/** @type {any} */ rng, /** @type {any} */ V, /** @type {any} */ o) => {
    const norm = (/** @type {any} */ s) => String(s).trim().toLowerCase();
    const [aEn, aEs] = both(o.a, V);
    const wrong = o.w.map((/** @type {any[]} */ [val, tag, over]) => {
      const [vEn, vEs] = both(val, V);
      return { v: vEn, vEs, tag: tag.split("/")[0], f: both(over || fb(tag), V) };
    });
    const [qEn, qEs] = both(o.q, V);
    const [xEn, xEs] = both(o.x, V);
    const hs = ladder(o.h, V);
    const it = G.mc(rng, {
      q: qEn,
      qEs,
      right: { v: aEn },
      wrong: wrong.map((w) => ({ v: w.v, f: w.f[0], fEs: w.f[1] })),
      x: xEn,
      xEs,
      h: hs.h,
      hEs: hs.hEs,
      meta: o.meta,
    });
    const byV = new Map(wrong.map((w) => [norm(w.v), w]));
    it.tag = it.c.map((/** @type {string} */ c, /** @type {number} */ i) =>
      i === it.a ? null : (byV.get(norm(c))?.tag ?? "other-slip"),
    );
    if ([o.a, ...o.w.map((/** @type {any[]} */ w) => w[0])].some(Array.isArray))
      it.cEs = it.c.map((/** @type {string} */ c, /** @type {number} */ i) =>
        i === it.a ? aEs : (byV.get(norm(c))?.vEs ?? c),
      );
    return it;
  };
  /**
   * Typed answer. o = { q, a, unit?, w:[[value, tag, feedback?]], x, h, meta }. The tolerance is tight on purpose:
   * 0.02 must not be accepted for 0.024. Wrong values equal to the answer, repeated, or negative are dropped.
   */
  const numB = (/** @type {any} */ V, /** @type {any} */ o) => {
    const seen = new Set([G.value(o.a)]);
    const fw = (o.w || [])
      .filter((/** @type {any[]} */ [val]) => {
        const n = G.value(val);
        if (!Number.isFinite(n) || n < 0 || seen.has(n)) return false;
        seen.add(n);
        return true;
      })
      .map((/** @type {any[]} */ [val, tag, over]) => {
        const f = both(over || fb(tag), V);
        return { v: String(val), f: f[0], fEs: f[1], tag: tag.split("/")[0] };
      });
    const [qEn, qEs] = both(o.q, V);
    const [xEn, xEs] = both(o.x, V);
    const hs = ladder(o.h, V);
    return G.num({
      q: qEn,
      qEs,
      a: String(o.a),
      unit: o.unit,
      tol: 1e-6,
      fw,
      x: xEn,
      xEs,
      h: hs.h,
      hEs: hs.hEs,
      meta: o.meta,
    });
  };
  /** a typed item that is sometimes shown as multiple choice (same wrong values, now named choices) */
  const numMc = (/** @type {any} */ rng, /** @type {any} */ V, /** @type {any} */ o, p = 0.4) => {
    const ws = (o.w || []).filter(
      (/** @type {any[]} */ w) =>
        w[0] !== null && Number.isFinite(Number(w[0])) && Number(w[0]) !== Number(o.a),
    );
    if (!rng.chance(p) || new Set(ws.map((/** @type {any[]} */ w) => Number(w[0]))).size < 3)
      return numB(V, o);
    return mcB(rng, V, {
      ...o,
      a: cm(Number(o.a)),
      w: ws.map((/** @type {any[]} */ [v, tag, over]) => [cm(Number(v)), tag, over]),
    });
  };
  /** check() helper: does the keyed answer equal `want`? true, or a string saying how it differs */
  const agree = (/** @type {any} */ item, /** @type {any} */ want) => {
    if (item.k === "mc") {
      const got = item.c[item.a];
      return String(got) === String(want)
        ? true
        : `keyed choice is "${got}" but recomputing gives "${want}"`;
    }
    const got = G.value(item.a);
    return Math.abs(got - Number(want)) < 1e-9
      ? true
      : `keyed ${item.a} but recomputing gives ${want}`;
  };

  /* ================================================ longDivision ================================================== */
  /** The paper algorithm, one digit at a time: how many fit, multiply, subtract, bring down. */
  const paperDiv = (/** @type {number} */ dividend, /** @type {number} */ divisor) => {
    let left = 0;
    let q = "";
    /** @type {number[]} */
    const work = [];
    for (const ch of String(dividend)) {
      const cur = left * 10 + Number(ch);
      let fit = 0;
      while ((fit + 1) * divisor <= cur) fit++;
      work.push(cur);
      q += fit;
      left = cur - fit * divisor;
    }
    return { q: Number(q), r: left, work };
  };
  /** the first working number the divisor fits into: for 4,896 ÷ 12 it is 48 */
  const firstFit = (/** @type {number} */ dividend, /** @type {number} */ divisor) =>
    paperDiv(dividend, divisor).work.find((w) => w >= divisor) ?? dividend;
  /** hint: the first move of the cycle, without the digit it produces */
  // prettier-ignore
  // biome-ignore format: bilingual pair
  const startHint = (/** @type {number} */ N, /** @type {number} */ d) => [`Start the cycle: how many ${d}s fit into ${firstFit(N, d)}? Write that digit above, multiply, subtract, then bring down.`, `Empieza el ciclo: ¿cuántos ${d} caben en ${firstFit(N, d)}? Escribe ese dígito arriba, multiplica, resta y baja el siguiente dígito.`];

  // prettier-ignore
  // biome-ignore format: bilingual table
  const ROLE = {
    dividend: ["dividend", "dividendo", "the total being divided", "el total que se divide"],
    divisor: ["divisor", "divisor", "the number you divide by", "el número entre el que divides"],
    quotient: ["quotient", "cociente", "the answer to the division", "la respuesta de la división"],
    remainder: ["remainder", "residuo", "the amount left over", "lo que sobra"],
  };

  /** things packed into containers: thing en|es|gender, container en|plural|es|plural|gender, verb en|es, "all" en|es, fits "packed to a" stories, story en|es */
  // prettier-ignore
  // biome-ignore format: one context per line
  const PACK = rows([
    "pencils|lápices|m|box|boxes|caja|cajas|f|pack|empacar|all the pencils|todos los lápices|1|A school has {N} pencils. They are packed {n} to a box.|Una escuela tiene {N} lápices. Se empacan {n} en cada caja.",
    "muffins|muffins|m|tray|trays|bandeja|bandejas|f|hold|acomodar|all the muffins|todos los muffins|1|A bakery baked {N} muffins. Each tray holds {n} muffins.|Una panadería horneó {N} muffins. Cada bandeja lleva {n} muffins.",
    "students|estudiantes|m|bus|buses|autobús|autobuses|m|seat|llevar a|all the students|a todos los estudiantes|0|{N} students are going on a trip. Each bus seats {n} students.|{N} estudiantes van de excursión. Cada autobús tiene {n} asientos.",
    "stickers|calcomanías|f|album page|album pages|página del álbum|páginas del álbum|f|hold|guardar|all the stickers|todas las calcomanías|1|Maya has {N} stickers. Each album page holds {n} stickers.|Maya tiene {N} calcomanías. Cada página del álbum guarda {n} calcomanías.",
    "books|libros|m|shelf|shelves|estante|estantes|m|hold|guardar|all the books|todos los libros|1|A library has {N} books. Each shelf holds {n} books.|Una biblioteca tiene {N} libros. Cada estante guarda {n} libros.",
    "marbles|canicas|f|bag|bags|bolsa|bolsas|f|hold|guardar|all the marbles|todas las canicas|1|Omar has {N} marbles. He puts {n} marbles in each bag.|Omar tiene {N} canicas. Pone {n} canicas en cada bolsa.",
    "cookies|galletas|f|plate|plates|plato|platos|m|serve|servir|all the cookies|todas las galletas|1|A café has {N} cookies. It puts {n} cookies on each plate.|Una cafetería tiene {N} galletas. Pone {n} galletas en cada plato.",
    "seedlings|plántulas|f|row|rows|fila|filas|f|plant|sembrar|all the seedlings|todas las plántulas|1|A garden club has {N} seedlings. Each row holds {n} seedlings.|Un club de jardinería tiene {N} plántulas. Cada fila lleva {n} plántulas.",
  ]).map((r) => ({ a: r[0], aEs: r[1], ga: r[2], b: r[3], bs: r[4], bEs: r[5], bsEs: r[6], gb: r[7], hold: r[8], holdEs: r[9], all: r[10], allEs: r[11], pack: r[12] === "1", story: [r[13], r[14]] }));
  /** the variable bag for a packing story: nouns, plus the Spanish words that agree with them */
  // prettier-ignore
  // biome-ignore format: one bag
  const packV = (/** @type {any} */ c) => ({
    a: c.a, aEs: c.aEs, A: cap(c.a), b: c.b, bs: c.bs, bEs: c.bEs, bsEs: c.bsEs, an: /^[aeiou]/.test(c.b) ? "an" : "a",
    hold: c.hold, holdEs: c.holdEs, all: c.all, allEs: c.allEs, ...gv("a", c.ga), ...gv("b", c.gb),
  });
  /** the three questions a packing story can ask (the whole point of the remainder lesson) */
  // prettier-ignore
  // biome-ignore format: bilingual table
  const PACK_ASK = {
    full: ["How many full {bs} are there?", "¿{bCuC} {bsEs} se llenan por completo?"],
    left: ["How many {a} are left over?", "¿{aCuC} {aEs} sobran?"],
    need: ["How many {bs} are needed to {hold} {all}?", "¿{bCuC} {bsEs} se necesitan para {holdEs} {allEs}?"],
  };
  /** equal-share stories: big marks totals that can reach thousands */
  // prettier-ignore
  // biome-ignore format: one story per line
  const SHARE = rows([
    "0|A teacher shares {N} stickers equally among {n} students. How many stickers does each student get?|Una maestra reparte {N} calcomanías en partes iguales entre {n} estudiantes. ¿Cuántas calcomanías recibe cada estudiante?",
    "0|A coach splits {N} players into {n} equal teams. How many players are on each team?|Un entrenador divide a {N} jugadores en {n} equipos iguales. ¿Cuántos jugadores hay en cada equipo?",
    "1|A farmer plants {N} seeds in {n} equal rows. How many seeds are in each row?|Un agricultor siembra {N} semillas en {n} filas iguales. ¿Cuántas semillas hay en cada fila?",
    "1|A club earns ${N} and shares it equally among {n} teams. How many dollars does each team get?|Un club gana ${N} y lo reparte en partes iguales entre {n} equipos. ¿Cuántos dólares recibe cada equipo?",
    "0|A baker puts {N} cookies on {n} equal trays. How many cookies go on each tray?|Una panadera pone {N} galletas en {n} bandejas iguales. ¿Cuántas galletas van en cada bandeja?",
    "1|A library puts {N} books on {n} equal shelves. How many books are on each shelf?|Una biblioteca coloca {N} libros en {n} estantes iguales. ¿Cuántos libros hay en cada estante?",
    "1|A museum splits {N} visitors into {n} equal tour groups. How many visitors are in each group?|Un museo divide a {N} visitantes en {n} grupos de visita iguales. ¿Cuántos visitantes hay en cada grupo?",
  ]).map((r) => ({ big: r[0] === "1", story: [r[1], r[2]] }));
  /** three-step stories: items -> inner pack -> outer pack (en|plural|es|plural|gender for each of the three nouns) */
  // prettier-ignore
  // biome-ignore format: one story per line
  const NEST = rows([
    "pencils|lápices|m|box|boxes|caja|cajas|f|carton|cartons|cartón|cartones|m",
    "eggs|huevos|m|carton|cartons|cartón|cartones|m|crate|crates|cajón|cajones|m",
    "cans|latas|f|pack|packs|paquete|paquetes|m|case|cases|caja grande|cajas grandes|f",
    "markers|marcadores|m|set|sets|juego|juegos|m|bin|bins|contenedor|contenedores|m",
    "tiles|losetas|f|box|boxes|caja|cajas|f|pallet|pallets|tarima|tarimas|f",
    "stickers|calcomanías|f|sheet|sheets|hoja|hojas|f|pad|pads|bloc|blocs|m",
  ]).map((r) => ({ a: r[0], aEs: r[1], ga: r[2], b: r[3], bs: r[4], bEs: r[5], bsEs: r[6], gb: r[7], c: r[8], cs: r[9], cEs: r[10], csEs: r[11], gc: r[12] }));

  // prettier-ignore
  // biome-ignore format: one tag per line, English then Spanish
  Object.assign(FB, {
    "remainder-dropped": ["That is only the number of full groups. The leftover belongs in the answer too: write it after an R.", "Eso es solo el número de grupos completos. Lo que sobra también va en la respuesta: escríbelo después de una R."],
    "remainder-too-big": ["The remainder {rb} is as big as the divisor {d} or bigger. Another full group of {d} still fits, so keep dividing.", "El residuo {rb} es tan grande como el divisor {d} o más. Todavía cabe otro grupo completo de {d}, así que sigue dividiendo."],
    "quotient-remainder-swapped": ["The quotient comes first and the remainder comes after the R. These two numbers are in the wrong places.", "El cociente va primero y el residuo va después de la R. Estos dos números están en el lugar equivocado."],
    "quotient-one-too-big": ["Multiply to check: {d} × {q2} is already more than {N}. This quotient is too big.", "Multiplica para comprobar: {d} × {q2} ya es más que {N}. Este cociente es demasiado grande."],
    "quotient-one-too-small": ["Multiply to check: {d} × {q1} + {r} does not give back {N}. One more group of {d} fits.", "Multiplica para comprobar: {d} × {q1} + {r} no da {N}. Cabe un grupo más de {d}."],
    "division-quotient-missing-zero": ["This quotient is missing a digit. When the divisor does not fit into the digit you bring down, you still write a 0 in the quotient.", "A este cociente le falta un dígito. Cuando el divisor no cabe en el dígito que bajas, igual escribes un 0 en el cociente."],
    "zero-in-wrong-place": ["The digits are right, but the 0 is in the wrong place. Multiply this by {d}: does it come back to {N}?", "Los dígitos están bien, pero el 0 está en el lugar equivocado. Multiplica esto por {d}: ¿vuelve a {N}?"],
    "extra-zero-in-quotient": ["This quotient has too many digits. Multiply it by {d}: it is far bigger than {N}.", "Este cociente tiene demasiados dígitos. Multiplícalo por {d}: es mucho más grande que {N}."],
    "op-multiplied-instead-of-divided": ["That is {N} × {d}. This problem splits {N} into equal groups, so you divide.", "Eso es {N} × {d}. Este problema reparte {N} en grupos iguales, así que se divide."],
    "op-subtracted-instead-of-divided": ["That is {N} − {d}. Division asks how many {d}s fit into {N}, not what is left after taking one {d} away.", "Eso es {N} − {d}. La división pregunta cuántos {d} caben en {N}, no lo que queda al quitar un {d}."],
    "op-added-instead-of-divided": ["That is {N} + {d}. Division splits {N} into equal groups, so the answer is smaller than {N}.", "Eso es {N} + {d}. La división reparte {N} en grupos iguales, así que la respuesta es menor que {N}."],
    "bring-down-without-leftover": ["The {U} comes down next to the leftover from the subtraction. It does not stand alone.", "El {U} baja junto a lo que sobró de la resta. No se queda solo."],
    "leftover-only": ["That is what is left after subtracting. The next digit still has to come down beside it.", "Eso es lo que queda después de restar. Todavía falta bajar el siguiente dígito a su lado."],
    "whole-dividend-again": ["The whole dividend is not divided again. The next step uses the leftover with the digit that comes down.", "No se vuelve a dividir todo el dividendo. El siguiente paso usa lo que sobró con el dígito que baja."],
    "quotient-instead-of-remainder": ["That is the quotient, the number of full groups. The remainder is what is left after those groups are taken out.", "Ese es el cociente, el número de grupos completos. El residuo es lo que queda después de sacar esos grupos."],
    "gap-instead-of-remainder": ["That is how many more it would take to make one more full group. The remainder is how many are really left.", "Eso es cuánto falta para completar otro grupo. El residuo es cuánto sobra de verdad."],
    "subtracted-quotient": ["Subtracting the quotient from the total does not find what is left over. Multiply the quotient by {d} first.", "Restar el cociente del total no halla lo que sobra. Primero multiplica el cociente por {d}."],
    "check-leftover-left-out": ["Multiplying only the groups gives a number smaller than the dividend. The leftover has to go back in.", "Multiplicar solo los grupos da un número menor que el dividendo. Lo que sobró tiene que volver a sumarse."],
    "check-adds-everything": ["Adding the three numbers does not rebuild the dividend. Division is undone by multiplying.", "Sumar los tres números no reconstruye el dividendo. La división se deshace multiplicando."],
    "check-roles-mixed": ["The remainder is only the leftover, so it is added at the end. The divisor is the size of each group.", "El residuo es solo lo que sobra, así que se suma al final. El divisor es el tamaño de cada grupo."],
    "check-subtracts-remainder": ["The leftover was part of the dividend, so it is added back, not taken away.", "Lo que sobró era parte del dividendo, así que se suma de nuevo, no se quita."],
    "quotient-digits-same-as-dividend": ["The quotient is shorter than the dividend when the divisor is bigger than the first digit. Find where the first quotient digit lands.", "El cociente es más corto que el dividendo cuando el divisor es mayor que el primer dígito. Busca dónde cae el primer dígito del cociente."],
    "digit-count-too-many": ["That is one digit too many. Check which digits of the dividend the divisor fits into first.", "Eso es un dígito de más. Revisa en cuáles dígitos del dividendo cabe primero el divisor."],
    "digit-count-too-few": ["That is one digit too few. Check which digits of the dividend the divisor fits into first.", "Eso es un dígito de menos. Revisa en cuáles dígitos del dividendo cabe primero el divisor."],
    "quotient-instead-of-leftover": ["That counts the full {bs}. The question asks how many {a} are left over after those {bs} are filled.", "Eso cuenta {bLos} {bsEs} {bLlenos}. La pregunta es cuántos {aEs} sobran después de llenar {bLos} {bsEs}."],
    "gap-instead-of-leftover": ["That is how many more {a} it would take to fill one more {b}. The question asks how many are really left.", "Eso es cuántos {aEs} más harían falta para llenar {bUn} {bEs} más. La pregunta es cuántos sobran de verdad."],
    "quotient-remainder-form": ["The question asks for one number. An answer with an R mixes the groups and the leftover together.", "La pregunta pide un solo número. Una respuesta con R junta los grupos y lo que sobra."],
    "rounded-up-full-containers": ["The last {b} is not full, so it should not be counted as a full one.", "{bElC} {bUlt} {bEs} no está {bLleno}, así que no se cuenta como {bLleno}."],
    "remainder-instead-of-count": ["{r} is how many {a} are left over. The question asks about the {bs}, which counts the groups.", "{r} es cuántos {aEs} sobran. La pregunta es sobre {bLos} {bsEs}, que cuenta los grupos."],
    "remainder-ignored-no-round-up": ["That counts only the full {bs}. The {a} left over still need a place.", "Eso cuenta solo {bLos} {bsEs} {bLlenos}. {aLos} {aEs} que sobran todavía necesitan un lugar."],
    "rounded-up-too-far": ["That is one {b} more than needed. Only the {a} left over need one more.", "Eso es {bUn} {bEs} más de lo necesario. Solo {aLos} {aEs} que sobran necesitan {bUn} más."],
    "gave-the-leftover-not-the-gap": ["That is how many {a} are already in the last {b}. The question asks how many more it still needs.", "Eso es cuántos {aEs} ya hay en {bEl} {bUlt} {bEs}. La pregunta es cuántos más le faltan."],
    "whole-group": ["That would fill a whole new {b}. The last one is already partly full.", "Eso llenaría {bUn} {bEs} {bNuevo} por completo. {bElC} {bUlt} {bEs} ya tiene una parte."],
    "remainder-left-out": ["That counts only the {a} in the full {bs}. The {r} left over were there too.", "Eso cuenta solo {aLos} {aEs} de {bLos} {bsEs} {bLlenos}. {aLos} {r} que sobraron también estaban."],
    "added-all-three": ["Adding the three numbers does not rebuild the total. Each of the {q} {bs} holds {n}.", "Sumar los tres números no reconstruye el total. Cada {bEs} de las {q} guarda {n}."],
    "stopped-after-one-step": ["That is the number of {bs}. The {bs} still have to be grouped into {cs}.", "Ese es el número de {bsEs}. Todavía hay que agrupar {bsEs} en {csEs}."],
    "divided-by-the-sum": ["The two packing sizes combine by multiplying, not adding. Find how many {bs} there are first.", "Los dos tamaños de empaque se combinan multiplicando, no sumando. Primero halla cuántos {bsEs} hay."],
    "multiplied-instead-of-divided": ["Grouping {bs} into {cs} is a division, because each {c} holds {n2} of them.", "Agrupar {bsEs} en {csEs} es una división, porque cada {cEs} lleva {n2}."],
  });

  /** @type {Record<number, string[]>} */
  const LD_TYPES = {
    1: ["parts", "exact", "rem", "step"],
    2: ["exact", "rem", "remainder", "check"],
    3: ["zero", "zero", "estimate", "remBound", "digits"],
    4: ["interpret", "interpret", "fillUp", "reverse", "twoStep"],
  };
  /** 1-2 digit quotient for a 1-digit divisor (level 1), a 2-3 digit quotient for a 2-digit divisor */
  const quotientFor = (
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {number} */ d,
  ) =>
    level === 1
      ? rng.int(Math.ceil(20 / d), Math.floor(99 / d))
      : rng.int(Math.ceil(300 / d), Math.min(Math.floor(9000 / d), 400));

  /** @type {Record<string, (rng: any, level: number) => any>} */
  const longDivTypes = {
    /* ---- level 1 ---- */
    parts(rng) {
      const { N, d, q, r } = draw(
        () => {
          const dd = rng.int(3, 9);
          const qq = rng.int(4, 15);
          const rr = rng.int(1, dd - 1);
          return { N: qq * dd + rr, d: dd, q: qq, r: rr };
        },
        (v) => v.N >= 20 && v.N <= 99 && new Set([v.N, v.d, v.q, v.r]).size === 4,
      );
      const ask = rng.pick(["dividend", "divisor", "quotient", "remainder"]);
      /** @type {Record<string, number>} */
      const vals = { dividend: N, divisor: d, quotient: q, remainder: r };
      const role = /** @type {any} */ (ROLE);
      const R = role[ask];
      /** @type {Record<string, string[]>} */
      const where = {
        dividend: ["the number just before the ÷ sign", "el número justo antes del signo ÷"],
        divisor: ["the number just after the ÷ sign", "el número justo después del signo ÷"],
        quotient: ["the number just after the = sign", "el número justo después del signo ="],
        remainder: ["the number written after the R", "el número escrito después de la R"],
      };
      const V = {
        N,
        d,
        q,
        r,
        ask: R[0],
        askEs: R[1],
        askD: R[2],
        askDEs: R[3],
        was: where[ask][0],
        wasEs: where[ask][1],
        right: vals[ask],
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["In {N} ÷ {d} = {q} R {r}, which number is the {ask}?", "En {N} ÷ {d} = {q} R {r}, ¿qué número es el {askEs}?"],
        a: String(vals[ask]),
        w: Object.keys(vals).filter((k) => k !== ask).map((k) => [String(vals[k]), "division-terms-mixed", [`${vals[k]} is the ${role[k][0]}: ${role[k][2]}. The {ask} is {askD}.`, `${vals[k]} es el ${role[k][1]}: ${role[k][3]}. El {askEs} es {askDEs}.`]]),
        x: ["In {N} ÷ {d} = {q} R {r}, the {ask} is {right}. It is {askD}.", "En {N} ÷ {d} = {q} R {r}, el {askEs} es {right}. Es {askDEs}."],
        h: [
          ["A division fact reads: dividend ÷ divisor = quotient R remainder.", "Un hecho de división se lee: dividendo ÷ divisor = cociente R residuo."],
          ["The {ask} is {askD}.", "El {askEs} es {askDEs}."],
          ["Look for {was}.", "Busca {wasEs}."],
        ],
        meta: { kind: "parts", dividend: N, divisor: d, ask },
      });
    },
    exact(rng, level) {
      const { d, q } = draw(
        () => {
          const dd = level === 1 ? rng.int(2, 9) : rng.int(12, 48);
          return { d: dd, q: quotientFor(rng, level, dd) };
        },
        (v) => v.q !== v.d,
      );
      const N = q * d;
      const share = rng.pick(SHARE.filter((s) => level === 1 || s.big));
      const pack = rng.pick(PACK.filter((c) => c.pack || level === 1));
      const form = rng.pick(["bare", "share", "pack"]);
      const V = { N: cm(N), n: d, d, q: cm(q), ...packV(pack) };
      /** @type {Record<string, string[]>} */
      const text = {
        bare: ["What is {N} ÷ {d}?", "¿Cuánto es {N} ÷ {d}?"],
        share: share.story,
        pack: [`${pack.story[0]} ${PACK_ASK.full[0]}`, `${pack.story[1]} ${PACK_ASK.full[1]}`],
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: text[form],
        a: q,
        w: [[N * d, "op-multiplied-instead-of-divided"], [N - d, "op-subtracted-instead-of-divided"], [N + d, "op-added-instead-of-divided"]],
        x: ["{N} ÷ {d} = {q}, because {d} × {q} = {N}.", "{N} ÷ {d} = {q}, porque {d} × {q} = {N}."],
        h: [
          ["Division finds how many equal groups fit, or how big each group is.", "La división halla cuántos grupos iguales caben, o de qué tamaño es cada grupo."],
          ["Set up long division: {d} goes outside and {N} goes inside. Work one digit at a time.", "Escribe la división larga: {d} afuera y {N} adentro. Trabaja un dígito a la vez."],
          startHint(N, d),
        ],
        meta: { kind: "exact", dividend: N, divisor: d },
      });
    },
    rem(rng, level) {
      const { N, d, q, r } = draw(
        () => {
          const dd = level === 1 ? rng.int(3, 9) : rng.int(12, 45);
          const qq = quotientFor(rng, level, dd);
          const rr = rng.int(1, dd - 1);
          return { N: qq * dd + rr, d: dd, q: qq, r: rr };
        },
        (v) => v.q !== v.r && (level === 2 || (v.N >= 20 && v.N <= 99)),
      );
      const V = {
        N: cm(N),
        d,
        q: cm(q),
        r,
        rb: r + d,
        q1: cm(q - 1),
        q2: cm(q + 1),
        dq: cm(d * q),
      };
      // prettier-ignore
      // biome-ignore format: bilingual hints
      const h =
        level === 1
          ? [
              ["A remainder is what is left after you make as many equal groups as you can.", "Un residuo es lo que sobra después de formar todos los grupos iguales que puedas."],
              ["Find the biggest multiple of {d} that is not more than {N}. It tells you the number of groups.", "Halla el múltiplo de {d} más grande que no pase de {N}. Te dice el número de grupos."],
              [`Count by ${d}s: ${d}, ${2 * d}, ${3 * d}, and so on. Stop before you pass ${N}.`, `Cuenta de ${d} en ${d}: ${d}, ${2 * d}, ${3 * d}, y así. Detente antes de pasar de ${N}.`],
            ]
          : [
              ["Estimate first. Round {N} and {d} to friendly numbers to see how big the quotient should be.", "Estima primero. Redondea {N} y {d} a números fáciles para ver qué tan grande debe ser el cociente."],
              ["Use long division. The number left after the last subtraction is the remainder, and it must be less than {d}.", "Usa la división larga. El número que queda después de la última resta es el residuo, y debe ser menor que {d}."],
              startHint(N, d),
            ];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["What is {N} ÷ {d}? Write the quotient and the remainder.", "¿Cuánto es {N} ÷ {d}? Escribe el cociente y el residuo."],
        a: "{q} R {r}",
        w: [["{q}", "remainder-dropped"], ["{q1} R {rb}", "remainder-too-big"], ["{q2} R {r}", "quotient-one-too-big"], ["{r} R {q}", "quotient-remainder-swapped"], ["{q1} R {r}", "quotient-one-too-small"]],
        x: ["{d} × {q} = {dq}, and {N} − {dq} = {r}. So {N} ÷ {d} = {q} R {r}.", "{d} × {q} = {dq}, y {N} − {dq} = {r}. Así que {N} ÷ {d} = {q} R {r}."],
        h,
        meta: { kind: "rem", dividend: N, divisor: d },
      });
    },
    step(rng) {
      const { N, d, T, U, q1, r1 } = draw(
        () => {
          const dd = rng.int(2, 7);
          const t = rng.int(dd, 9);
          const u = rng.int(1, 9);
          const f = Math.floor(t / dd);
          return { N: t * 10 + u, d: dd, T: t, U: u, q1: f, r1: t - f * dd };
        },
        (v) => v.r1 >= 1,
      );
      const next = r1 * 10 + U;
      const V = { N, d, T, U, q1, r1, p: q1 * d, next };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["In {N} ÷ {d}, you divide {T} by {d} and write {q1} above the {T}. You multiply {q1} × {d} = {p} and subtract {T} − {p}. Then you bring down the {U}. What number do you divide by {d} next?", "En {N} ÷ {d}, divides {T} entre {d} y escribes {q1} arriba del {T}. Multiplicas {q1} × {d} = {p} y restas {T} − {p}. Luego bajas el {U}. ¿Qué número divides ahora entre {d}?"],
        a: next,
        w: [[U, "bring-down-without-leftover"], [r1, "leftover-only"], [N, "whole-dividend-again"]],
        x: ["{T} − {p} = {r1}. Bring the {U} down beside the {r1} to make {next}. Next you divide {next} by {d}.", "{T} − {p} = {r1}. Baja el {U} junto al {r1} para formar {next}. Luego divides {next} entre {d}."],
        h: [
          ["After you subtract, the next digit of the dividend comes down.", "Después de restar, baja el siguiente dígito del dividendo."],
          ["Subtract first to find what is left. The new digit sits right beside it.", "Resta primero para hallar lo que queda. El dígito nuevo se escribe justo al lado."],
          ["{T} − {p} leaves {r1}. The {U} comes down beside it.", "{T} − {p} deja {r1}. El {U} baja a su lado."],
        ],
        meta: { kind: "step", dividend: N, divisor: d },
      });
    },

    /* ---- level 2 ---- */
    remainder(rng) {
      const d = rng.int(12, 45);
      const q = quotientFor(rng, 2, d);
      const r = rng.int(1, d - 1);
      const N = q * d + r;
      const pack = rng.pick(PACK);
      const V = { N: cm(N), n: d, d, q: cm(q), r, dq: cm(q * d), ...packV(pack) };
      /** @type {any} */
      const text = rng.chance(0.5)
        ? [`${pack.story[0]} ${PACK_ASK.left[0]}`, `${pack.story[1]} ${PACK_ASK.left[1]}`]
        : [
            "What is the remainder when {N} is divided by {d}?",
            "¿Cuál es el residuo cuando {N} se divide entre {d}?",
          ];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: text,
        a: r,
        w: [[q, "quotient-instead-of-remainder"], [d - r, "gap-instead-of-remainder"], [N - q, "subtracted-quotient"]],
        x: ["{N} ÷ {d} = {q} R {r}. The {q} full groups use {dq}, and {N} − {dq} = {r} is left over.", "{N} ÷ {d} = {q} R {r}. Los {q} grupos completos usan {dq}, y {N} − {dq} = {r} es lo que sobra."],
        h: [
          ["The remainder is the part that is left after you make all the full groups of {d}.", "El residuo es lo que queda después de formar todos los grupos completos de {d}."],
          ["Divide {N} by {d}. Multiply the quotient by {d} and subtract from {N}.", "Divide {N} entre {d}. Multiplica el cociente por {d} y réstalo de {N}."],
          startHint(N, d),
        ],
        meta: { kind: "remainder", dividend: N, divisor: d },
      });
    },
    check(rng) {
      const d = rng.int(12, 45);
      const q = quotientFor(rng, 2, d);
      const r = rng.int(1, d - 1);
      const N = q * d + r;
      const V = { who: rng.pick(NAMES), N: cm(N), d, q: cm(q), r };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["{who} divides {N} by {d} and gets {q} R {r}. Which equation checks the answer?", "{who} divide {N} entre {d} y obtiene {q} R {r}. ¿Qué ecuación comprueba la respuesta?"],
        a: "{d} × {q} + {r} = {N}",
        w: [["{d} × {q} = {N}", "check-leftover-left-out"], ["{d} + {q} + {r} = {N}", "check-adds-everything"], ["{r} × {q} + {d} = {N}", "check-roles-mixed"], ["{d} × {q} − {r} = {N}", "check-subtracts-remainder"]],
        x: ["To check a division, multiply the quotient by the divisor and add the remainder: {d} × {q} + {r} = {N}.", "Para comprobar una división, multiplica el cociente por el divisor y suma el residuo: {d} × {q} + {r} = {N}."],
        h: [
          ["Division and multiplication undo each other.", "La división y la multiplicación se deshacen entre sí."],
          ["The full groups come from multiplying: how many groups times the size of each group.", "Los grupos completos salen de multiplicar: cuántos grupos por el tamaño de cada grupo."],
          ["Multiply {d} × {q} first. Then decide what happens to the {r}.", "Primero multiplica {d} × {q}. Luego decide qué pasa con el {r}."],
        ],
        meta: { kind: "check", dividend: N, divisor: d },
      });
    },

    /* ---- level 3 ---- */
    zero(rng) {
      const withR = rng.chance(0.4);
      const d = rng.int(12, 48);
      const { q, a, b } = draw(
        () => {
          const aa = rng.int(1, Math.max(1, Math.floor(9900 / d / 100)));
          const bb = rng.int(1, 9);
          return { q: aa * 100 + bb, a: aa, b: bb };
        },
        (v) => v.q * d + d <= 9999,
      );
      const r = withR ? rng.int(1, d - 1) : 0;
      const N = q * d + r;
      const V = {
        who: rng.pick(NAMES),
        N: cm(N),
        d,
        q,
        r,
        ab: `${a}${b}`,
        ab0: `${a}${b}0`,
        abb: `${a}00${b}`,
        tail: withR ? ` R ${r}` : "",
        q10: q + 10,
      };
      // prettier-ignore
      // biome-ignore format: bilingual hints
      const h = [
        ["Look closely at each step. Sometimes {d} does not fit into the digit you bring down.", "Observa bien cada paso. A veces {d} no cabe en el dígito que bajas."],
        ["When {d} does not fit, you still write a digit in the quotient: a 0. Then bring down the next digit.", "Cuando {d} no cabe, igual escribes un dígito en el cociente: un 0. Luego baja el siguiente dígito."],
        startHint(N, d),
      ];
      // prettier-ignore
      // biome-ignore format: bilingual pair
      const x = ["After the first step, {d} did not fit into the next digit, so the quotient gets a 0 there. {N} ÷ {d} = {q}{tail}.", "Después del primer paso, {d} no cupo en el siguiente dígito, así que el cociente lleva un 0 ahí. {N} ÷ {d} = {q}{tail}."];
      if (!withR && rng.chance(0.5)) {
        // prettier-ignore
        // biome-ignore format: bilingual spec
        return numB(V, {
          q: rng.chance(0.5) ? ["{who} divides {N} by {d}. What is the quotient?", "{who} divide {N} entre {d}. ¿Cuál es el cociente?"] : ["What is {N} ÷ {d}?", "¿Cuánto es {N} ÷ {d}?"],
          a: q,
          w: [[`${a}${b}`, "division-quotient-missing-zero"], [`${a}${b}0`, "zero-in-wrong-place"], [`${a}00${b}`, "extra-zero-in-quotient"]],
          x,
          h,
          meta: { kind: "zero", dividend: N, divisor: d },
        });
      }
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: withR ? ["What is {N} ÷ {d}? Write the quotient and the remainder.", "¿Cuánto es {N} ÷ {d}? Escribe el cociente y el residuo."] : ["What is {N} ÷ {d}?", "¿Cuánto es {N} ÷ {d}?"],
        a: "{q}{tail}",
        w: [
          ["{ab}{tail}", "division-quotient-missing-zero"],
          ["{ab0}{tail}", "zero-in-wrong-place"],
          ...(withR ? [["{q}", "remainder-dropped"]] : []),
          ["{abb}{tail}", "extra-zero-in-quotient"],
          ["{q10}{tail}", "quotient-one-too-big", ["Multiply to check: {d} × {q10} is more than {N}. One digit is too big.", "Multiplica para comprobar: {d} × {q10} es más que {N}. Un dígito es demasiado grande."]],
        ],
        x,
        h,
        meta: { kind: "zero", dividend: N, divisor: d },
      });
    },
    estimate(rng) {
      const { E, d10, d, N10, N } = draw(
        () => {
          const dd10 = rng.pick([20, 30, 40, 50]);
          const ee = rng.pick([20, 30, 40, 50, 60, 80, 100, 200, 300, 400, 500, 600]);
          const delta = rng.int(10, 49) * rng.pick([-1, 1]);
          return {
            E: ee,
            d10: dd10,
            d: dd10 + rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]),
            N10: ee * dd10,
            N: ee * dd10 + delta,
          };
        },
        (v) => v.N10 >= 600 && v.N10 <= 9900,
      );
      const near = (/** @type {number} */ v) => [`about ${cm(v)}`, `alrededor de ${cm(v)}`];
      // prettier-ignore
      // biome-ignore format: bilingual pair
      const test = (/** @type {number} */ v) => [`Test it: ${cm(v)} × ${d10} is about ${cm(v * d10)}, but the dividend is about ${cm(N10)}.`, `Pruébalo: ${cm(v)} × ${d10} es casi ${cm(v * d10)}, pero el dividendo es casi ${cm(N10)}.`];
      const pack = rng.pick(PACK.filter((c) => c.pack));
      const small = E / 100 < 1 ? E * 1000 : E / 100;
      const V = { N: cm(N), n: d, d, N10: cm(N10), d10, E: cm(E), ...packV(pack) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: rng.chance(0.4)
          ? [`${pack.story[0]} About how many {bs} is that? Estimate before you divide.`, `${pack.story[1]} Más o menos, ¿{bCu} {bsEs} son? Estima antes de dividir.`]
          : ["Without dividing exactly, which is the best estimate for {N} ÷ {d}?", "Sin dividir con exactitud, ¿cuál es la mejor estimación de {N} ÷ {d}?"],
        a: near(E),
        w: [[near(E * 10), "estimate-too-large", test(E * 10)], [near(E / 10), "estimate-too-small", test(E / 10)], [near(E * 100), "estimate-far-too-large", test(E * 100)], [near(small), "estimate-far-too-small", test(small)]],
        x: ["{N} is close to {N10} and {d} is close to {d10}. {N10} ÷ {d10} = {E}, so the quotient is about {E}.", "{N} está cerca de {N10} y {d} está cerca de {d10}. {N10} ÷ {d10} = {E}, así que el cociente es alrededor de {E}."],
        h: [
          ["Round the dividend and the divisor to friendly numbers before you divide.", "Redondea el dividendo y el divisor a números fáciles antes de dividir."],
          ["{d} is close to {d10}. Which friendly number is {N} close to?", "{d} está cerca de {d10}. ¿De qué número fácil está cerca {N}?"],
          ["Divide the two friendly numbers. Count the zeros carefully.", "Divide los dos números fáciles. Cuenta bien los ceros."],
        ],
        meta: { kind: "estimate", dividend: N, divisor: d },
      });
    },
    remBound(rng) {
      const d = rng.int(8, 48);
      const good = rng.int(1, d - 1);
      // prettier-ignore
      // biome-ignore format: bilingual pair
      const big = (/** @type {number} */ v) => [`A remainder of ${v} is too big. If ${v} are left over and the groups hold ${d}, another full group of ${d} still fits.`, `Un residuo de ${v} es demasiado grande. Si sobran ${v} y los grupos son de ${d}, todavía cabe otro grupo completo de ${d}.`];
      const extra = d + rng.int(1, 9);
      const V = { who: rng.pick(NAMES), d, good };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["{who} divides a number by {d} and gets a remainder. Which number could be the remainder?", "{who} divide un número entre {d} y obtiene un residuo. ¿Cuál número podría ser el residuo?"],
        a: String(good),
        w: [[String(d), "remainder-equals-divisor", big(d)], [String(extra), "remainder-bigger-than-divisor", big(extra)], [String(2 * d), "remainder-bigger-than-divisor", big(2 * d)], [String(3 * d - 1), "remainder-bigger-than-divisor", big(3 * d - 1)]],
        x: ["A remainder must be less than the divisor. If {d} or more were left over, another full group of {d} could be made. Only {good} is less than {d}.", "Un residuo debe ser menor que el divisor. Si sobraran {d} o más, se podría formar otro grupo completo de {d}. Solo {good} es menor que {d}."],
        h: [
          ["The remainder is what is left over after you make all the full groups.", "El residuo es lo que sobra después de formar todos los grupos completos."],
          ["If as many as {d} were left over, could you make one more group of {d}?", "Si sobraran {d} o más, ¿podrías formar un grupo más de {d}?"],
          ["Look for the choice that is smaller than the divisor.", "Busca la opción que es menor que el divisor."],
        ],
        meta: { kind: "remBound", divisor: d },
      });
    },
    digits(rng) {
      const { N, d, q } = draw(
        () => {
          const dd = rng.int(12, 48);
          const qq = rng.int(Math.ceil(1000 / dd), Math.floor(9999 / dd));
          return { N: qq * dd + (rng.chance(0.5) ? rng.int(1, dd - 1) : 0), d: dd, q: qq };
        },
        (v) => v.N <= 9999,
      );
      const idx = paperDiv(N, d).work.findIndex((w) => w >= d);
      const n = digitsOf(q);
      const before =
        idx === 1
          ? ["the first digit", "el primer dígito"]
          : ["the first two digits", "los dos primeros dígitos"];
      const V = {
        N: cm(N),
        d,
        n,
        lead: String(N).slice(0, idx + 1),
        pos: idx + 1,
        before: before[0],
        beforeEs: before[1],
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Without dividing, how many digits will the quotient of {N} ÷ {d} have? (Do not count the remainder.)", "Sin dividir, ¿cuántos dígitos tendrá el cociente de {N} ÷ {d}? (No cuentes el residuo.)"],
        a: n,
        w: [[digitsOf(N), "quotient-digits-same-as-dividend"], [n + 1, "digit-count-too-many"], [n - 1, "digit-count-too-few"]],
        x: ["{d} does not fit into {before}, but it fits into {lead}. The first quotient digit sits over digit number {pos} of {N}, and every digit after it adds one more. That makes {n} digits.", "{d} no cabe en {beforeEs}, pero sí cabe en {lead}. El primer dígito del cociente va sobre el dígito número {pos} de {N}, y cada dígito que sigue agrega uno más. Eso hace {n} dígitos."],
        h: [
          ["The first quotient digit goes above the first digit of the dividend that the divisor fits into.", "El primer dígito del cociente va arriba del primer dígito del dividendo en el que cabe el divisor."],
          ["Does the divisor fit into the first digit? If not, try the first two digits, then the first three.", "¿Cabe el divisor en el primer dígito? Si no, prueba con los dos primeros dígitos, luego con los tres primeros."],
          ["Count the digits of {N} from that spot to the end.", "Cuenta los dígitos de {N} desde ese lugar hasta el final."],
        ],
        meta: { kind: "digits", dividend: N, divisor: d },
      });
    },

    /* ---- level 4 ---- */
    interpret(rng) {
      const c = rng.pick(PACK);
      const ask = rng.pick(["full", "left", "need"]);
      const { n, q, r } = draw(
        () => {
          const nn = rng.int(12, 48);
          return { n: nn, q: rng.int(3, 30), r: rng.int(1, nn - 1) };
        },
        (v) => v.q !== v.n && v.q + 1 !== v.n,
      );
      const N = q * n + r;
      const V = {
        N: cm(N),
        n,
        q,
        r,
        q1: q - 1,
        q2: q + 1,
        q3: q + 2,
        gap: n - r,
        form: `${q} R ${r}`,
        NQ: cm(N - q),
        ...packV(c),
      };
      const key = { full: q, left: r, need: q + 1 }[/** @type {"full"} */ (ask)];
      // prettier-ignore
      // biome-ignore format: bilingual table
      const W = {
        full: [["{q2}", "rounded-up-full-containers"], ["{r}", "remainder-instead-of-count"], ["{form}", "quotient-remainder-form"], ["{q1}", "quotient-one-too-small", ["Check the division again: one more full {b} fits.", "Revisa la división: cabe {bUn} {bEs} {bLleno} más."]]],
        left: [["{q}", "quotient-instead-of-leftover"], ["{gap}", "gap-instead-of-leftover"], ["{form}", "quotient-remainder-form"], ["{NQ}", "subtracted-quotient", ["Subtracting the quotient from the total does not find what is left over. Multiply the quotient by {n} first.", "Restar el cociente del total no halla lo que sobra. Primero multiplica el cociente por {n}."]]],
        need: [["{q}", "remainder-ignored-no-round-up"], ["{r}", "remainder-instead-of-count", ["{r} is the number of {a} left over, not the number of {bs}.", "{r} es el número de {aEs} que sobran, no el número de {bsEs}."]], ["{form}", "quotient-remainder-form"], ["{q3}", "rounded-up-too-far"]],
      };
      // prettier-ignore
      // biome-ignore format: bilingual table
      const why = {
        full: ["{N} ÷ {n} = {form}. The quotient {q} counts the full {bs}. The {r} left over do not fill another one.", "{N} ÷ {n} = {form}. El cociente {q} cuenta {bLos} {bsEs} {bLlenos}. Los {r} que sobran no llenan otro."],
        left: ["{N} ÷ {n} = {form}. After {q} full {bs}, the remainder {r} is how many {a} are left over.", "{N} ÷ {n} = {form}. Después de {q} {bsEs} {bLlenos}, el residuo {r} es cuántos {aEs} sobran."],
        need: ["{N} ÷ {n} = {form}. {q} full {bs} are not enough: the {r} left over need one more. {q} + 1 = {q2}.", "{N} ÷ {n} = {form}. {q} {bsEs} {bLlenos} no alcanzan: los {r} que sobran necesitan {bUn} más. {q} + 1 = {q2}."],
      };
      const a = /** @type {"full"} */ (ask);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: [`${c.story[0]} ${PACK_ASK[a][0]}`, `${c.story[1]} ${PACK_ASK[a][1]}`],
        a: String(key),
        w: W[a],
        x: why[a],
        h: [
          ["Divide the total by the number in each {b}.", "Divide el total entre el número que hay en cada {bEs}."],
          ["Read the question again. Does it ask for full {bs}, for what is left over, or for enough {bs} to hold everything?", "Lee la pregunta otra vez. ¿Pide {bsEs} {bLlenos}, lo que sobra, o suficientes {bsEs} para todo?"],
          ["Use the remainder. If it is more than 0, ask what that leftover means in this story.", "Usa el residuo. Si es mayor que 0, pregunta qué significa esa sobra en esta historia."],
        ],
        meta: { kind: "interpret", ask, total: N, per: n },
      });
    },
    fillUp(rng) {
      const c = rng.pick(PACK.filter((p) => p.pack));
      const n = rng.int(12, 48);
      const q = rng.int(4, 30);
      const r = draw(
        () => rng.int(1, n - 1),
        (v) => v * 2 !== n,
      );
      const N = q * n + r;
      const V = { N: cm(N), n, q, r, gap: n - r, ...packV(c) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: [`${c.story[0]} How many more {a} are needed to fill the last {b}?`, `${c.story[1]} ¿{aCuC} {aEs} más hacen falta para llenar {bEl} {bUlt} {bEs}?`],
        a: n - r,
        w: [[r, "gave-the-leftover-not-the-gap"], [q, "quotient-instead-of-leftover", ["That counts the full {bs}. Look at what is left after them.", "Eso cuenta {bLos} {bsEs} {bLlenos}. Mira lo que queda después."]], [n, "whole-group"]],
        x: ["{N} ÷ {n} = {q} R {r}. The last {b} has {r} in it and holds {n}, so it needs {n} − {r} = {gap} more.", "{N} ÷ {n} = {q} R {r}. {bElC} {bUlt} {bEs} tiene {r} y guarda {n}, así que necesita {n} − {r} = {gap} más."],
        h: [
          ["Divide to find how many full {bs} there are and how many {a} are left over.", "Divide para hallar cuántos {bsEs} se llenan y cuántos {aEs} sobran."],
          ["The leftover {a} sit in a {b} that is not full yet. How many does a full {b} hold?", "{aLos} {aEs} que sobran están en {bUn} {bEs} que todavía no está {bLleno}. ¿Cuántos caben en {bUn} {bEs} {bLleno}?"],
          ["Compare {n}, the size of a full {b}, with the leftover you found.", "Compara {n}, el tamaño de {bUn} {bEs} {bLleno}, con la sobra que hallaste."],
        ],
        meta: { kind: "fillUp", total: N, per: n },
      });
    },
    reverse(rng) {
      const c = rng.pick(PACK.filter((p) => p.pack));
      const n = rng.int(12, 48);
      const q = rng.int(8, 40);
      const r = rng.int(2, n - 1);
      const N = q * n + r;
      const V = { N: cm(N), n, q, r, qn: cm(q * n), ...packV(c) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["{A} were packed {n} to {an} {b}. There were {q} full {bs} and {r} {a} left over. How many {a} were there in all?", "Se empacaron {aEs}, {n} en cada {bEs}. Hubo {q} {bsEs} {bLlenos} y sobraron {r} {aEs}. ¿{aCuC} {aEs} había en total?"],
        a: N,
        w: [
          [q * n, "remainder-left-out"],
          [q + n + r, "added-all-three"],
          [q * r + n, "check-roles-mixed", ["The {r} is the leftover, not the size of each {b}. Each {b} holds {n}.", "El {r} es lo que sobró, no el tamaño de cada {bEs}. Cada {bEs} guarda {n}."]],
          [q * n - r, "check-subtracts-remainder", ["The {r} left over are extra {a}, so they are added to the total, not taken away.", "{aLos} {r} {aEs} que sobraron son extra, así que se suman al total, no se quitan."]],
        ],
        x: ["{q} full {bs} of {n} hold {q} × {n} = {qn}. Add the {r} left over: {qn} + {r} = {N}.", "{q} {bsEs} {bLlenos} de {n} guardan {q} × {n} = {qn}. Suma los {r} que sobraron: {qn} + {r} = {N}."],
        h: [
          ["Division and multiplication undo each other. Work backward from the groups.", "La división y la multiplicación se deshacen entre sí. Trabaja hacia atrás desde los grupos."],
          ["First find how many {a} are in the full {bs}: groups times the size of each group.", "Primero halla cuántos {aEs} hay en {bLos} {bsEs} {bLlenos}: grupos por el tamaño de cada grupo."],
          ["Multiply {q} × {n}. Then think about the {r} that were left over.", "Multiplica {q} × {n}. Luego piensa en los {r} que sobraron."],
        ],
        meta: { kind: "reverse", quotient: q, divisor: n, remainder: r },
      });
    },
    twoStep(rng) {
      const c = rng.pick(NEST);
      const { n1, n2, q2, extra } = draw(
        () => {
          const a = rng.pick([6, 8, 10, 12, 15, 20, 24]);
          const b = rng.pick([6, 8, 10, 12, 15, 18, 20]);
          return { n1: a, n2: b, q2: rng.int(3, 30), extra: rng.int(0, b - 1) };
        },
        (v) => v.q2 !== v.n1 && v.q2 !== v.n2 && (v.q2 * v.n2 + v.extra) * v.n1 <= 20000,
      );
      const boxes = q2 * n2 + extra;
      const total = boxes * n1;
      const V = {
        total: cm(total),
        n1,
        n2,
        q2,
        boxes: cm(boxes),
        left: extra,
        ...c,
        ...gv("a", c.ga),
        ...gv("b", c.gb),
        ...gv("c", c.gc),
      };
      const tailEn = extra ? " R {left}" : "";
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["A factory has {total} {a}. It packs {n1} {a} in each {b}, then puts {n2} {bs} in each {c}. How many full {cs} can it fill?", "Una fábrica tiene {total} {aEs}. Empaca {n1} {aEs} en cada {bEs} y luego pone {n2} {bsEs} en cada {cEs}. ¿{cCuC} {csEs} puede llenar por completo?"],
        a: q2,
        w: [[boxes, "stopped-after-one-step"], [Math.floor(total / (n1 + n2)), "divided-by-the-sum"], [boxes * n2, "multiplied-instead-of-divided"]],
        x: [`{total} ÷ {n1} = {boxes} {bs}. Then {boxes} ÷ {n2} = {q2}${tailEn}, so {q2} full {cs}.`, `{total} ÷ {n1} = {boxes} {bsEs}. Luego {boxes} ÷ {n2} = {q2}${tailEn}, así que son {q2} {csEs} {cCompl}.`],
        h: [
          ["Do it in two steps: first the {a} into {bs}, then the {bs} into {cs}.", "Hazlo en dos pasos: primero {aLos} {aEs} en {bsEs}, luego {bLos} {bsEs} en {csEs}."],
          ["Step 1: divide {total} by {n1}. That gives the number of {bs}.", "Paso 1: divide {total} entre {n1}. Eso da el número de {bsEs}."],
          ["Step 2: divide your number of {bs} by {n2}. Only full {cs} count.", "Paso 2: divide tu número de {bsEs} entre {n2}. Solo cuentan {csEs} {cCompl}."],
        ],
        meta: { kind: "twoStep", total, inner: n1, outer: n2 },
      });
    },
  };

  G.register("longDivision", {
    title: "Long division",
    titleEs: "División larga",
    levels: 4,
    make(rng, level) {
      return longDivTypes[rng.pick(LD_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      const { q, r } = m.dividend
        ? paperDiv(m.dividend, m.divisor)
        : m.total
          ? paperDiv(m.total, m.per ?? m.inner * m.outer)
          : { q: 0, r: 0 };
      switch (m.kind) {
        case "parts":
          return agree(
            item,
            { dividend: m.dividend, divisor: m.divisor, quotient: q, remainder: r }[
              /** @type {"divisor"} */ (m.ask)
            ],
          );
        case "exact":
          return r === 0 ? agree(item, q) : `meta divides with remainder ${r}`;
        case "rem":
          return agree(item, `${cm(q)} R ${r}`);
        case "step":
          return agree(item, paperDiv(m.dividend, m.divisor).work[1]);
        case "remainder":
          return agree(item, r);
        case "check":
          return agree(item, `${m.divisor} × ${cm(q)} + ${r} = ${cm(m.dividend)}`);
        case "zero":
          return agree(item, item.k === "mc" ? `${q}${r ? ` R ${r}` : ""}` : q);
        case "estimate": {
          const near = item.c.map((/** @type {string} */ c) => Number(c.replace(/[^\d]/g, "")));
          const close = near.filter((/** @type {number} */ v) => Math.abs(v - q) / q < 0.25);
          return close.length === 1 && near[item.a] === close[0]
            ? true
            : `estimate choices ${item.c} vs exact ${q}`;
        }
        case "remBound": {
          const ok = item.c.map((/** @type {string} */ c) => Number(c) < m.divisor);
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one remainder below the divisor";
        }
        case "digits":
          return agree(item, String(q).length);
        case "interpret":
          return agree(item, m.ask === "full" ? q : m.ask === "left" ? r : r ? q + 1 : q);
        case "fillUp":
          return agree(item, r ? m.per - r : 0);
        case "reverse":
          return agree(item, m.divisor * m.quotient + m.remainder);
        case "twoStep":
          // one division by (inner x outer) must equal the two separate divisions
          return agree(item, q);
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ============================================== decimalDivision ================================================= */
  const r6 = (/** @type {number} */ x) => Math.round(x * 1e6) / 1e6;
  /** a number only if it is a terminating decimal (<= 6 places), else null so the wrong-answer list drops it */
  const term = (/** @type {number} */ x) => (Math.abs(x - r6(x)) < 1e-9 ? r6(x) : null);
  /** exact quotient of Ds/10^dpD by ds/10^dpd, from the scaled integers (null if it does not terminate within 6 places) */
  const exQ = (
    /** @type {number} */ Ds,
    /** @type {number} */ dpD,
    /** @type {number} */ ds,
    /** @type {number} */ dpd,
  ) => {
    const N = Ds * 10 ** (dpd + 6);
    const M = ds * 10 ** dpD;
    return N % M === 0 ? N / M / 1e6 : null;
  };
  /** value n/10^dp slid k places right, as text: mp(378, 2, 1) = "37.8" */
  const mp = (/** @type {number} */ n, /** @type {number} */ dp, /** @type {number} */ k) =>
    cm(r6((n / 10 ** dp) * 10 ** k));
  const places = (/** @type {number} */ n, /** @type {number} */ dp) =>
    (dt(n, dp).split(".")[1] || "").length;
  const nz = (/** @type {number} */ n) => n % 10 !== 0;
  /** share / fit stories: money flag | unit | en | es (each ends in its question) */
  // prettier-ignore
  // biome-ignore format: one story per line
  const DW = rows([
    "1||A group of {d} friends split a ${D} bill equally. How many dollars does each friend pay?|Un grupo de {d} amigos divide una cuenta de ${D} en partes iguales. ¿Cuántos dólares paga cada amigo?",
    "0|m|A {D} m rope is cut into {d} equal pieces. How long is each piece, in meters?|Una cuerda de {D} m se corta en {d} partes iguales. ¿Cuánto mide cada parte, en metros?",
    "0|L|{d} equal cups share {D} L of juice. How many liters go in each cup?|{d} vasos iguales se reparten {D} L de jugo. ¿Cuántos litros van en cada vaso?",
    "0|kg|{d} identical boxes weigh {D} kg in all. How many kilograms does one box weigh?|{d} cajas idénticas pesan {D} kg en total. ¿Cuántos kilogramos pesa una caja?",
    "0|min|A runner jogs {d} equal laps in {D} minutes. How many minutes does each lap take?|Una corredora trota {d} vueltas iguales en {D} minutos. ¿Cuántos minutos tarda cada vuelta?",
    "1||{d} equal tickets cost ${D} in all. How many dollars does one ticket cost?|{d} boletos iguales cuestan ${D} en total. ¿Cuántos dólares cuesta un boleto?",
  ]).map((r) => ({ money: r[0] === "1", unit: r[1], story: [r[2], r[3]] }));
  // prettier-ignore
  // biome-ignore format: one story per line
  const FIT = rows([
    "0|A {D} m ribbon is cut into pieces that are {d} m long. How many pieces are there?|Una cinta de {D} m se corta en piezas de {d} m de largo. ¿Cuántas piezas hay?",
    "0|A pitcher holds {D} L. Each cup holds {d} L. How many cups can be filled?|Una jarra tiene {D} L. Cada vaso tiene {d} L. ¿Cuántos vasos se pueden llenar?",
    "1|Markers cost ${d} each. How many markers can you buy with ${D}?|Cada marcador cuesta ${d}. ¿Cuántos marcadores puedes comprar con ${D}?",
    "0|A trail is {D} km long. A hiker walks {d} km each hour. How many hours does the hike take?|Un sendero mide {D} km. Un excursionista camina {d} km cada hora. ¿Cuántas horas dura la caminata?",
    "0|A bag holds {D} kg of flour. Each loaf needs {d} kg. How many loaves can be made?|Una bolsa tiene {D} kg de harina. Cada pan necesita {d} kg. ¿Cuántos panes se pueden hacer?",
    "0|A board is {D} m long. Each shelf needs {d} m. How many shelves can be cut from the board?|Una tabla mide {D} m. Cada repisa necesita {d} m. ¿Cuántas repisas se pueden cortar de la tabla?",
  ]).map((r) => ({ money: r[0] === "1", story: [r[1], r[2]] }));
  // prettier-ignore
  // biome-ignore format: one story per line
  const PRICE = rows([
    "{d} pounds of grapes cost ${D}. What is the cost of 1 pound, in dollars?|{d} libras de uvas cuestan ${D}. ¿Cuánto cuesta 1 libra, en dólares?",
    "{d} meters of cloth cost ${D}. What does 1 meter cost, in dollars?|{d} metros de tela cuestan ${D}. ¿Cuánto cuesta 1 metro, en dólares?",
    "{d} kg of rice cost ${D}. How many dollars does 1 kg cost?|{d} kg de arroz cuestan ${D}. ¿Cuántos dólares cuesta 1 kg?",
    "{d} liters of olive oil cost ${D}. What is the price of 1 liter, in dollars?|{d} litros de aceite de oliva cuestan ${D}. ¿Cuál es el precio de 1 litro, en dólares?",
    "A car used {d} gallons of gas that cost ${D}. How many dollars is 1 gallon?|Un carro usó {d} galones de gasolina que costaron ${D}. ¿Cuántos dólares cuesta 1 galón?",
  ]).map((r) => ({ story: [r[0], r[1]] }));
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "decimal-place-value/small": ["Your digits are right, but the decimal point is too far left, so the answer is too small. Estimate with whole numbers first to see about how big the quotient should be.", "Tus dígitos están bien, pero el punto decimal quedó muy a la izquierda, así que la respuesta es demasiado pequeña. Estima primero con números enteros para ver qué tan grande debe ser el cociente."],
    "decimal-place-value/large": ["Your digits are right, but the decimal point is too far right, so the answer is too big. Estimate with whole numbers first to see about how big the quotient should be.", "Tus dígitos están bien, pero el punto decimal quedó muy a la derecha, así que la respuesta es demasiado grande. Estima primero con números enteros para ver qué tan grande debe ser el cociente."],
    "decimal-point-dropped": ["That has no decimal point. The quotient keeps a decimal point in the column right above the dividend's point.", "Eso no tiene punto decimal. El cociente conserva un punto decimal en la columna justo arriba del punto del dividendo."],
    "moved-divisor-only": ["It looks like only the divisor's decimal point slid. Both points must slide the same number of places, or the problem changes.", "Parece que solo se deslizó el punto decimal del divisor. Los dos puntos deben deslizarse el mismo número de lugares, o el problema cambia."],
    "moved-dividend-only": ["It looks like only the dividend's decimal point slid. The divisor must become a whole number too, and both points slide together.", "Parece que solo se deslizó el punto decimal del dividendo. El divisor también debe volverse entero, y los dos puntos se deslizan juntos."],
    "moved-different-amounts": ["The two decimal points slid different numbers of places. Count the places in the divisor, then slide BOTH points that many places.", "Los dos puntos decimales se deslizaron distinto número de lugares. Cuenta los lugares del divisor y desliza LOS DOS puntos esa cantidad."],
    "forgot-to-annex-zeros": ["A whole number has a decimal point you cannot see, after its last digit. Write zeros there so both points can slide the same number of places.", "Un número entero tiene un punto decimal que no se ve, después de su último dígito. Escribe ceros ahí para que los dos puntos se deslicen igual."],
    "stopped-at-the-remainder": ["You stopped at the whole number. When something is left over, write a decimal point and zeros after the dividend, then keep dividing.", "Te detuviste en el número entero. Cuando algo sobra, escribe un punto decimal y ceros después del dividendo y sigue dividiendo."],
    "remainder-as-decimal-digit": ["The remainder is not the next digit of the quotient. Put a decimal point after the whole number, annex a zero, and keep dividing.", "El residuo no es el siguiente dígito del cociente. Escribe un punto decimal después del entero, agrega un cero y sigue dividiendo."],
    "op-added-instead-of-multiplied": ["Adding does not undo a division. To undo a division by {d}, multiply by {d}.", "Sumar no deshace una división. Para deshacer una división entre {d}, multiplica por {d}."],
    "op-reversed-division": ["The two numbers are in the wrong order. Ask what is being split: that number goes first.", "Los dos números están en el orden equivocado. Pregunta qué se está repartiendo: ese número va primero."],
    "stopped-at-the-unit-price": ["That is the price of one unit. The question asks for a different amount, so one more step is needed.", "Ese es el precio de una unidad. La pregunta pide otra cantidad, así que falta un paso más."],
    "bigger-divisor-bigger-quotient": ["A bigger divisor fits into the number fewer times, so its quotient is smaller. Compare how many times each divisor fits.", "Un divisor mayor cabe menos veces en el número, así que su cociente es menor. Compara cuántas veces cabe cada divisor."],
    "decimals-compared-by-length": ["Compare the divisors by place value: 0.25 is less than 0.5 even though 25 is more than 5. The smaller the divisor, the bigger the quotient.", "Compara los divisores por valor posicional: 0.25 es menor que 0.5 aunque 25 sea mayor que 5. Cuanto menor el divisor, mayor el cociente."],
  });

  /** pick a divisor/quotient pair: divisor ds (dpd places), quotient qs (dpq places), exact dividend Ds */
  const divPair = (
    /** @type {any} */ rng,
    /** @type {number} */ dpd,
    /** @type {number} */ dpq,
    /** @type {number[]} */ dr,
    /** @type {number[]} */ qr,
    /** @type {(v: any) => boolean} */ ok = () => true,
  ) =>
    draw(
      () => {
        const ds = rng.int(dr[0], dr[1]);
        const qs = rng.int(qr[0], qr[1]);
        return { ds, dpd, qs, dpq, Ds: ds * qs, dpD: dpd + dpq };
      },
      (v) => (dpd === 0 || nz(v.ds)) && (dpq === 0 || nz(v.qs)) && ok(v),
    );
  const decDivVars = (/** @type {any} */ p, /** @type {boolean} */ money = false) => ({
    D: money ? dec(p.Ds * 10 ** (2 - p.dpD), 2) : dt(p.Ds, p.dpD),
    N: money ? dec(p.Ds * 10 ** (2 - p.dpD), 2) : dt(p.Ds, p.dpD),
    d: dt(p.ds, p.dpd),
    n: dt(p.ds, p.dpd),
    Q: dt(p.qs, p.dpq),
  });
  const ddMeta = (/** @type {string} */ kind, /** @type {any} */ p) => ({
    kind,
    Ds: p.Ds,
    dpD: p.dpD,
    ds: p.ds,
    dpd: p.dpd,
  });
  /** @type {Record<number, string[]>} */
  const DD_TYPES = {
    1: ["div", "div", "point"],
    2: ["div", "shift", "fit"],
    3: ["wholeByDec", "annex", "reasonable", "price"],
    4: ["findDividend", "findDivisor", "which"],
  };
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const decDivTypes = {
    div(rng, level) {
      let p;
      let V;
      let text;
      let unit;
      if (level === 1) {
        const dp = rng.pick([1, 2]);
        const row = rng.pick(DW);
        p = divPair(rng, 0, dp, [2, 9], dp === 1 ? [11, 99] : [12, 399]);
        V = decDivVars(p, row.money);
        if (row.money) V.D = dec(p.Ds * 10 ** (2 - dp), 2);
        text = rng.chance(0.3) ? ["What is {D} ÷ {d}?", "¿Cuánto es {D} ÷ {d}?"] : row.story;
        unit = text === row.story ? row.unit : undefined;
      } else {
        const [dpd, dpq] = rng.pick([
          [1, 0],
          [1, 1],
          [2, 0],
        ]);
        p = divPair(
          rng,
          dpd,
          dpq,
          dpd === 1 ? [2, 99] : [4, 99],
          dpq === 0 ? [2, 90] : [11, 99],
          (v) => v.Ds % 10 ** v.dpD !== 0,
        );
        const useFit = dpq === 0 && rng.chance(0.5);
        const row = rng.pick(FIT);
        V = decDivVars(p, useFit && row.money);
        text = useFit ? row.story : ["What is {D} ÷ {d}?", "¿Cuánto es {D} ÷ {d}?"];
      }
      const q = p.qs / 10 ** p.dpq;
      const Dv = p.Ds / 10 ** p.dpD;
      const ds = p.ds / 10 ** p.dpd;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: text, a: pv(p.qs, p.dpq), unit,
        w: [[term(q * 10), "decimal-place-value/large"], [term(q / 10), "decimal-place-value/small"], [level === 1 ? term(Dv * ds) : term(Dv / (p.ds)), level === 1 ? "op-multiplied-instead-of-divided" : "moved-divisor-only"]],
        x: [`{D} ÷ {d}: ${level === 1 ? "divide as whole numbers and keep the decimal point above the dividend's" : `slide both points ${p.dpd} place(s) to make ${mp(p.Ds, p.dpD, p.dpd)} ÷ ${mp(p.ds, p.dpd, p.dpd)}`}. The quotient is {Q}. Check: {d} × {Q} = {D}.`, `{D} ÷ {d}: ${level === 1 ? "divide como con enteros y deja el punto decimal arriba del punto del dividendo" : `desliza los dos puntos ${p.dpd} lugar(es) para obtener ${mp(p.Ds, p.dpD, p.dpd)} ÷ ${mp(p.ds, p.dpd, p.dpd)}`}. El cociente es {Q}. Comprueba: {d} × {Q} = {D}.`],
        h: level === 1
          ? [["Dividing by a whole number works like whole-number division. The decimal point stays in the same column.", "Dividir entre un entero es como dividir enteros. El punto decimal se queda en la misma columna."], ["Set up long division with {d} outside and {D} inside. Write the quotient's point right above the dividend's point.", "Escribe la división larga con {d} afuera y {D} adentro. Escribe el punto del cociente justo arriba del punto del dividendo."], startHint(p.Ds, p.ds)]
          : [["Make the divisor a whole number by sliding its decimal point to the right. Slide the dividend's point the same number of places.", "Vuelve entero el divisor deslizando su punto decimal a la derecha. Desliza el punto del dividendo el mismo número de lugares."], [`Count the decimal places in {d}: that is how many places both points slide (${p.dpd}).`, `Cuenta las cifras decimales de {d}: esa es la cantidad de lugares que se deslizan los dos puntos (${p.dpd}).`], startHint(p.Ds * 10 ** Math.max(0, p.dpd - p.dpD), p.ds)],
        meta: ddMeta("div", p),
      });
    },
    point(rng) {
      const dp = rng.pick([1, 2]);
      const p = divPair(rng, 0, dp, [2, 9], dp === 1 ? [11, 99] : [12, 399]);
      const V = { ...decDivVars(p), digs: String(p.qs) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Dividing {D} ÷ {d} as whole numbers gives the digits {digs}. Which quotient is correct?", "Dividir {D} ÷ {d} como enteros da los dígitos {digs}. ¿Cuál es el cociente correcto?"],
        a: dt(p.qs, p.dpq),
        w: [[dt(p.qs, 0), "decimal-point-dropped"], [dt(p.qs, p.dpq + 1), "decimal-place-value/small"], [dt(p.qs * 10, p.dpq), "decimal-place-value/large"], [dt(p.qs, p.dpq + 2), "decimal-place-value/small"]],
        x: ["Estimate with whole numbers: the quotient should be about the size of {Q}. The digits {digs} with the point in that place make {Q}.", "Estima con enteros: el cociente debe tener el tamaño de {Q}. Los dígitos {digs} con el punto en ese lugar forman {Q}."],
        h: [["Round {D} to a whole number and divide by {d} to see about how big the quotient is.", "Redondea {D} a un entero y divídelo entre {d} para ver más o menos qué tan grande es el cociente."], ["The quotient's decimal point sits directly above the dividend's decimal point.", "El punto decimal del cociente va justo arriba del punto decimal del dividendo."], ["Compare each choice with your estimate.", "Compara cada opción con tu estimación."]],
        meta: ddMeta("point", p),
      });
    },
    shift(rng) {
      const dpd = rng.pick([1, 2]);
      const p = draw(
        () =>
          divPair(
            rng,
            dpd,
            rng.pick([0, 1, 2]),
            dpd === 1 ? [2, 99] : [4, 99],
            [11, 99],
            (v) => v.Ds % 10 ** v.dpD !== 0,
          ),
        (v) => places(v.Ds, v.dpD) !== dpd,
      );
      const sd = places(p.Ds, p.dpD);
      const V = decDivVars(p);
      const pair = (/** @type {string} */ a, /** @type {string} */ b) => `${a} ÷ ${b}`;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which division has the same answer as {D} ÷ {d}?", "¿Cuál división tiene la misma respuesta que {D} ÷ {d}?"],
        a: pair(mp(p.Ds, p.dpD, dpd), mp(p.ds, dpd, dpd)),
        w: [[pair(V.D, mp(p.ds, dpd, dpd)), "moved-divisor-only"], [pair(mp(p.Ds, p.dpD, dpd), V.d), "moved-dividend-only"], [pair(mp(p.Ds, p.dpD, sd), mp(p.ds, dpd, dpd)), "moved-different-amounts"], [pair(mp(p.Ds, p.dpD, dpd + 1), mp(p.ds, dpd, dpd)), "moved-different-amounts"]],
        x: [`Slide both points ${dpd} place(s) to the right: {D} becomes ${mp(p.Ds, p.dpD, dpd)} and {d} becomes ${mp(p.ds, dpd, dpd)}. Sliding both points the same amount keeps the quotient.`, `Desliza los dos puntos ${dpd} lugar(es) a la derecha: {D} pasa a ${mp(p.Ds, p.dpD, dpd)} y {d} pasa a ${mp(p.ds, dpd, dpd)}. Deslizar los dos puntos igual conserva el cociente.`],
        h: [["Equivalent divisions multiply BOTH numbers by the same power of ten.", "Las divisiones equivalentes multiplican LOS DOS números por la misma potencia de diez."], ["Count the decimal places in the divisor {d}.", "Cuenta las cifras decimales del divisor {d}."], ["Check each choice: did both numbers move the same number of places?", "Revisa cada opción: ¿los dos números se movieron el mismo número de lugares?"]],
        meta: ddMeta("shift", p),
      });
    },
    fit(rng) {
      return decDivTypes.div(rng, 2);
    },
    wholeByDec(rng) {
      const [ds, dpd] = rng.pick([
        [5, 1],
        [25, 2],
        [2, 1],
        [4, 1],
        [8, 1],
        [5, 2],
        [25, 1],
        [125, 2],
      ]);
      const row = rng.pick(FIT);
      const Q = draw(
        () => rng.int(3, 90),
        (v) => (ds * v) % 10 ** dpd === 0 && (ds * v) / 10 ** dpd >= 2,
      );
      const Dw = (ds * Q) / 10 ** dpd;
      const p = { Ds: Dw, dpD: 0, ds, dpd, qs: Q, dpq: 0 };
      const V = decDivVars(p, row.money);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: row.story, a: Q,
        w: [[term(Dw / ds), "moved-divisor-only", ["That divides by the digits of {d} and ignores its decimal point. Slide both points the same number of places, annexing zeros to {D}.", "Eso divide entre las cifras de {d} e ignora su punto decimal. Desliza los dos puntos igual, agregando ceros a {D}."]], [term((Dw * 10 ** (dpd - 1)) / ds), "forgot-to-annex-zeros"], [term(Q * 10), "decimal-place-value/large"], [term(Q / 10), "decimal-place-value/small"]],
        x: [`{D} ÷ {d}: annex zeros so {D} = ${mp(Dw, 0, dpd)} ÷ 10^${dpd}; slide both points ${dpd} place(s) to get ${mp(Dw, 0, dpd)} ÷ ${ds}. The quotient is ${Q}.`, `{D} ÷ {d}: agrega ceros y desliza los dos puntos ${dpd} lugar(es) para obtener ${mp(Dw, 0, dpd)} ÷ ${ds}. El cociente es ${Q}.`],
        h: [["A whole number has an invisible decimal point at its right end.", "Un número entero tiene un punto decimal invisible en su extremo derecho."], [`Slide both points ${dpd} place(s). The dividend needs zeros to make room.`, `Desliza los dos puntos ${dpd} lugar(es). El dividendo necesita ceros para tener espacio.`], [`Write ${mp(Dw, 0, dpd)} ÷ ${ds} and divide as whole numbers.`, `Escribe ${mp(Dw, 0, dpd)} ÷ ${ds} y divide como con enteros.`]],
        meta: ddMeta("div", p),
      });
    },
    annex(rng) {
      const d = rng.pick([2, 4, 5, 8]);
      const Dw = draw(
        () => rng.int(3, 60),
        (v) => v % d !== 0 && (d !== 8 || v % 2 === 0 || rng.chance(0.3)),
      );
      const row = rng.pick(DW);
      const p = { Ds: Dw, dpD: 0, ds: d, dpd: 0 };
      const V = { ...decDivVars({ ...p, qs: 0, dpq: 0 }, row.money), Q: fmt(Dw / d) };
      V.D = row.money ? dec(Dw * 100, 2) : String(Dw);
      const whole = Math.floor(Dw / d);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: row.story, a: fmt(Dw / d), unit: row.unit,
        w: [[whole, "stopped-at-the-remainder"], [term(Number(`${whole}.${Dw % d}`)), "remainder-as-decimal-digit"], [term(Dw / d / 10), "decimal-place-value/small"], [term((Dw / d) * 10), "decimal-place-value/large"]],
        x: ["{D} ÷ {d}: {d} goes into {D} {w} times with {r} left over. Annex zeros and keep dividing: the quotient is {Q}. Check: {d} × {Q} = {D}.".replace("{w}", String(whole)).replace("{r}", String(Dw % d)), "{D} ÷ {d}: {d} cabe {w} veces en {D} y sobran {r}. Agrega ceros y sigue dividiendo: el cociente es {Q}. Comprueba: {d} × {Q} = {D}.".replace("{w}", String(whole)).replace("{r}", String(Dw % d))],
        h: [["The quotient is not a whole number here, so the division continues past the ones place.", "Aquí el cociente no es un número entero, así que la división sigue más allá de las unidades."], ["After the whole-number part, write a decimal point and annex a zero to the remainder.", "Después de la parte entera, escribe un punto decimal y agrega un cero al residuo."], startHint(Dw, d)],
        meta: { kind: "div", Ds: Dw, dpD: 0, ds: d, dpd: 0 },
      });
    },
    reasonable(rng) {
      const dpd = 1;
      const p = divPair(
        rng,
        dpd,
        rng.pick([0, 1]),
        [2, 99],
        [12, 95],
        (v) => v.Ds % 10 ** v.dpD !== 0,
      );
      const Qv = p.qs / 10 ** p.dpq;
      const mag = 10 ** Math.floor(Math.log10(Qv));
      const E = Math.round(Qv / mag) * mag;
      const V = { ...decDivVars(p), E: fmt(E), dE: fmt((p.ds / 10 ** p.dpd) * E) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Estimate first. Which answer is reasonable for {D} ÷ {d}?", "Estima primero. ¿Cuál respuesta es razonable para {D} ÷ {d}?"],
        a: dt(p.qs, p.dpq),
        w: [[dt(p.qs, p.dpq + 1), "decimal-place-value/small"], [dt(p.qs * 10, p.dpq), "decimal-place-value/large"], [dt(p.qs, p.dpq + 2), "decimal-place-value/small"], [dt(p.qs * 100, p.dpq), "decimal-place-value/large"]],
        x: ["{d} × {E} = {dE}, which is close to {D}. So the quotient is about {E}, and only {Q} is close to that.", "{d} × {E} = {dE}, que está cerca de {D}. Así que el cociente es cercano a {E}, y solo {Q} se acerca."],
        h: [["Use multiplication to test a guess: guess × divisor should be close to the dividend.", "Usa la multiplicación para probar: respuesta × divisor debe ser cercano al dividendo."], ["Try a friendly guess such as 4, 40 or 400 times {d}.", "Prueba con una respuesta fácil como 4, 40 o 400 por {d}."], ["Which choice is the same size as your best guess?", "¿Cuál opción tiene el mismo tamaño que tu mejor respuesta?"]],
        meta: ddMeta("point", p),
      });
    },
    price(rng) {
      const p = divPair(rng, 1, 1, [11, 99], [11, 99], (v) => v.qs !== v.ds);
      const row = rng.pick(PRICE);
      const V = { ...decDivVars(p), D: dec(p.Ds, 2) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: row.story, a: pv(p.qs, 1),
        w: [[term(p.Ds / 100 / p.ds), "moved-divisor-only"], [term(p.qs / 100), "decimal-place-value/small"], [term(p.qs), "decimal-place-value/large"]],
        x: ["The cost of 1 unit is ${D} ÷ {d}. Slide both points one place: ${D10} ÷ {d10} = {Q}. Check: {d} × {Q} = {D}.".replace("{D10}", mp(p.Ds, 2, 1)).replace("{d10}", mp(p.ds, 1, 1)), "El costo de 1 unidad es ${D} ÷ {d}. Desliza los dos puntos un lugar: {D10} ÷ {d10} = {Q}. Comprueba: {d} × {Q} = {D}.".replace("{D10}", mp(p.Ds, 2, 1)).replace("{d10}", mp(p.ds, 1, 1))],
        h: [["A unit price is the total cost divided by the number of units.", "Un precio unitario es el costo total dividido entre el número de unidades."], ["Divide ${D} by {d}. The divisor has a decimal point, so slide both points.", "Divide ${D} entre {d}. El divisor tiene punto decimal, así que desliza los dos puntos."], ["Slide both points one place right, then divide as whole numbers.", "Desliza los dos puntos un lugar a la derecha y divide como con enteros."]],
        meta: ddMeta("div", p),
      });
    },
    findDividend(rng) {
      const dpd = rng.pick([1, 2]);
      const dpq = rng.pick([0, 1]);
      const p = divPair(rng, dpd, dpq, [2, 99], dpq ? [11, 99] : [3, 40]);
      const V = { ...decDivVars(p), who: rng.pick(NAMES) };
      const Dv = p.Ds / 10 ** p.dpD;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: rng.chance(0.5) ? ["{who} divided a number by {d} and got {Q}. What number did {who} start with?", "{who} dividió un número entre {d} y obtuvo {Q}. ¿Con qué número empezó {who}?"] : ["A number divided by {d} is {Q}. What is the number?", "Un número dividido entre {d} es {Q}. ¿Cuál es el número?"],
        a: pv(p.Ds, p.dpD),
        w: [[term(Dv * 10), "decimal-place-value/large"], [term(Dv / 10), "decimal-place-value/small"], [term(Number(V.d) + Number(V.Q)), "op-added-instead-of-multiplied"]],
        x: ["Undo the division by multiplying: {Q} × {d} = {D}. Check: {D} ÷ {d} = {Q}.", "Deshaz la división multiplicando: {Q} × {d} = {D}. Comprueba: {D} ÷ {d} = {Q}."],
        h: [["Division and multiplication undo each other.", "La división y la multiplicación se deshacen entre sí."], ["The starting number is what you get when you put {Q} groups of size {d} back together.", "El número inicial es lo que obtienes al juntar de nuevo {Q} grupos de tamaño {d}."], ["Multiply {Q} × {d}, counting the decimal places in both factors.", "Multiplica {Q} × {d}, contando las cifras decimales de los dos factores."]],
        meta: { kind: "dividend", ds: p.ds, dpd: p.dpd, qs: p.qs, dpq: p.dpq },
      });
    },
    findDivisor(rng) {
      const dpd = rng.pick([1, 2]);
      const p = divPair(
        rng,
        dpd,
        rng.pick([0, 1]),
        [2, 99],
        [2, 60],
        (v) => v.Ds % 10 ** v.dpD !== 0,
      );
      const V = decDivVars(p);
      const Dv = p.Ds / 10 ** p.dpD;
      const Qv = p.qs / 10 ** p.dpq;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Find the missing divisor: {D} ÷ ? = {Q}", "Halla el divisor que falta: {D} ÷ ? = {Q}"],
        a: pv(p.ds, p.dpd),
        w: [[term(Qv / Dv), "op-reversed-division", ["The two numbers are in the wrong order. The dividend is what gets split, so it goes first.", "Los dos números están en el orden equivocado. El dividendo es lo que se reparte, así que va primero."]], [term(Dv * Qv), "op-multiplied-instead-of-divided", ["That multiplies the dividend by the quotient. The missing divisor comes from dividing.", "Eso multiplica el dividendo por el cociente. El divisor que falta sale de dividir."]], [term(p.ds / 10 ** (p.dpd - 1)), "decimal-place-value/large"], [term(p.ds / 10 ** (p.dpd + 1)), "decimal-place-value/small"]],
        x: ["The divisor times the quotient gives the dividend, so the divisor is {D} ÷ {Q} = {d}. Check: {D} ÷ {d} = {Q}.", "El divisor por el cociente da el dividendo, así que el divisor es {D} ÷ {Q} = {d}. Comprueba: {D} ÷ {d} = {Q}."],
        h: [["In a division sentence, divisor × quotient = dividend.", "En una división, divisor × cociente = dividendo."], ["So the missing divisor is the dividend divided by the quotient.", "Así que el divisor que falta es el dividendo dividido entre el cociente."], ["Divide {D} by {Q}. Slide both points if {Q} has a decimal point.", "Divide {D} entre {Q}. Desliza los dos puntos si {Q} tiene punto decimal."]],
        meta: { kind: "divisor", Ds: p.Ds, dpD: p.dpD, qs: p.qs, dpq: p.dpq, ds: p.ds, dpd: p.dpd },
      });
    },
    which(rng) {
      const ds = rng.shuffle([0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 2, 2.5, 4, 5, 10]).slice(0, 4);
      if (!ds.some((v) => v < 1)) ds[0] = 0.5;
      if (ds.includes(0.5) && ds.filter((v) => v === 0.5).length > 1) ds[1] = 4;
      const uniq = [...new Set(ds)];
      const D = rng.pick([2, 3, 4, 6, 8, 12, 15, 2.4, 4.8, 7.5]);
      const best = Math.min(...uniq);
      const e = (/** @type {number} */ v) => `${cm(D)} ÷ ${cm(v)}`;
      const V = {
        D: cm(D),
        best: cm(best),
        all: uniq.map((v) => `${e(v)} = ${cm(r6(D / v))}`).join(", "),
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Without finishing the division, which expression has the greatest quotient?", "Sin terminar la división, ¿cuál expresión tiene el cociente mayor?"],
        a: e(best),
        w: uniq.filter((v) => v !== best).sort((a, b) => b - a).map((v) => [e(v), v >= 1 ? "bigger-divisor-bigger-quotient" : "decimals-compared-by-length"]),
        x: ["The smaller the divisor, the more times it fits into {D}. {all}. The greatest is {D} ÷ {best}.", "Cuanto menor es el divisor, más veces cabe en {D}. {all}. El mayor es {D} ÷ {best}."],
        h: [["Think about how many times each divisor fits into {D}.", "Piensa cuántas veces cabe cada divisor en {D}."], ["A divisor less than 1 fits more than {D} times.", "Un divisor menor que 1 cabe más de {D} veces."], ["Put the divisors in order from least to greatest.", "Ordena los divisores de menor a mayor."]],
        meta: { kind: "which", D, ds: uniq },
      });
    },
  };

  G.register("decimalDivision", {
    title: "Divide decimals",
    titleEs: "Dividir decimales",
    levels: 4,
    make(rng, level) {
      return decDivTypes[rng.pick(DD_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      const q =
        m.kind === "dividend" || m.kind === "which"
          ? 0
          : exQ(
              m.Ds,
              m.dpD,
              m.kind === "divisor" ? m.qs : m.ds,
              m.kind === "divisor" ? m.dpq : m.dpd,
            );
      switch (m.kind) {
        case "div":
          return q === null ? "meta does not divide exactly" : agree(item, q);
        case "point":
          return q === null ? "no exact quotient" : agree(item, cm(q));
        case "divisor":
          return q === null ? "no exact divisor" : agree(item, q);
        case "dividend":
          return agree(item, r6((m.qs * m.ds) / 10 ** (m.dpq + m.dpd)));
        case "shift": {
          const target = exQ(m.Ds, m.dpD, m.ds, m.dpd);
          const val = (/** @type {string} */ c) => {
            const [a, b] = c.split(" ÷ ").map((t) => Number(t.replace(/,/g, "")));
            return a / b;
          };
          const hits = item.c.filter(
            (/** @type {string} */ c) => Math.abs(val(c) - Number(target)) < 1e-9,
          );
          return hits.length === 1 && hits[0] === item.c[item.a]
            ? true
            : `equivalent choices: ${hits.length}`;
        }
        case "which": {
          const v = item.c.map(
            (/** @type {string} */ c) => m.D / Number(c.split(" ÷ ")[1].replace(/,/g, "")),
          );
          const top = Math.max(...v);
          return v.filter((/** @type {number} */ x) => x === top).length === 1 && v[item.a] === top
            ? true
            : "greatest quotient is not the keyed choice";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ============================================== decimalAddSub =================================================== */
  /** column by column with no carrying or borrowing (a and b are integers at the same scale) */
  const colwise = (
    /** @type {number} */ a,
    /** @type {number} */ b,
    /** @type {"add"|"sub"} */ op,
  ) => {
    const x = String(a);
    const y = String(b).padStart(x.length, "0");
    return Number(
      [...x]
        .map((c, i) =>
          op === "add" ? (Number(c) + Number(y[i])) % 10 : Math.abs(Number(c) - Number(y[i])),
        )
        .join(""),
    );
  };
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "decimal-columns": ["Check the columns. Decimal points must line up so tenths sit under tenths and hundredths under hundredths. Lining up the right edges mixes place values.", "Revisa las columnas. Los puntos decimales deben alinearse para que las décimas queden bajo las décimas y las centésimas bajo las centésimas. Alinear los bordes derechos mezcla valores posicionales."],
    "forgot-to-regroup": ["Some column needed regrouping (a carry in addition). Work every column from right to left and carry when a column reaches 10.", "Alguna columna necesitaba reagrupar (llevar en la suma). Trabaja cada columna de derecha a izquierda y lleva cuando llegue a 10."],
    "smaller-from-larger": ["In each column, take the bottom digit from the top digit and regroup when you need to. Taking the smaller digit from the larger changes the number.", "En cada columna, resta el dígito de abajo del de arriba y reagrupa cuando haga falta. Restar el menor del mayor cambia el número."],
    "whole-minus-decimal-kept-fraction": ["The decimal part of the second number has to be taken away too. Write the whole number with zeros after the point, then subtract column by column.", "También hay que restar la parte decimal del segundo número. Escribe el entero con ceros después del punto y resta columna por columna."],
    "op-added-instead-of-subtracted": ["That adds the two numbers. This problem takes an amount away or finds how much more is needed.", "Eso suma los dos números. Este problema quita una cantidad o halla cuánto más se necesita."],
    "op-subtracted-instead-of-added": ["That subtracts. This problem puts the amounts together.", "Eso resta. Este problema junta las cantidades."],
    "forgot-second-item": ["That uses only one of the amounts. Read the problem again and use every amount it gives.", "Eso usa solo una de las cantidades. Lee el problema otra vez y usa todas las cantidades que da."],
    "grouping-error": ["Both costs come out of the starting amount. Add the two costs first, then subtract that total.", "Los dos costos se restan de la cantidad inicial. Suma primero los dos costos y luego resta ese total."],
    "total-only": ["That is the total of the amounts. The question asks what is left or still needed.", "Eso es el total de las cantidades. La pregunta es cuánto queda o cuánto falta."],
    "zero-in-wrong-place": ["Annexed zeros go at the END of the decimal digits. A zero before the last digit changes the value.", "Los ceros que se agregan van al FINAL de las cifras decimales. Un cero antes de la última cifra cambia el valor."],
    "digits-shifted": ["Writing a zero must not move the decimal point. The value stays the same only when the zero goes after the last decimal digit.", "Escribir un cero no debe mover el punto decimal. El valor no cambia solo cuando el cero va después de la última cifra decimal."],
    "op-reversed-subtraction": ["The two amounts are in the wrong order. The amount you start with comes first, so the answer cannot be negative.", "Las dos cantidades están en el orden equivocado. La cantidad con la que empiezas va primero, así que la respuesta no puede ser negativa."],
    "wrong-digit-column": ["Look at the place value of the digit, not its position from the right edge.", "Fíjate en el valor posicional del dígito, no en su posición desde el borde derecho."],
  });
  const ASTORY = [
    // [money, add?, en, es]
    [
      1,
      1,
      "{who} buys a book for ${a} and a pen for ${b}. How many dollars does {who} spend in all?",
      "{who} compra un libro por ${a} y un bolígrafo por ${b}. ¿Cuántos dólares gasta {who} en total?",
    ],
    [
      0,
      1,
      "One board is {a} m long and another is {b} m long. How long are they together, in meters?",
      "Una tabla mide {a} m y otra mide {b} m. ¿Cuánto miden juntas, en metros?",
    ],
    [
      0,
      1,
      "A tank holds {a} L. Then {b} L more is added. How many liters are in the tank now?",
      "Un tanque tiene {a} L. Luego se agregan {b} L más. ¿Cuántos litros hay ahora en el tanque?",
    ],
    [
      1,
      0,
      "{who} has ${a} and spends ${b}. How many dollars are left?",
      "{who} tiene ${a} y gasta ${b}. ¿Cuántos dólares le quedan?",
    ],
    [
      0,
      0,
      "A rope is {a} m long. A piece {b} m long is cut off. How long is the rest, in meters?",
      "Una cuerda mide {a} m. Se corta un pedazo de {b} m. ¿Cuánto mide el resto, en metros?",
    ],
    [
      0,
      0,
      "A jug has {a} L of juice. {b} L is poured out. How many liters are left?",
      "Una jarra tiene {a} L de jugo. Se sirven {b} L. ¿Cuántos litros quedan?",
    ],
  ];
  const AS_TYPES = {
    1: ["align", "zero", "calc"],
    2: ["calc", "calc", "whole", "mcCalc"],
    3: ["addend", "addend", "need"],
    4: ["change", "exprMc", "measure"],
  };
  /** two decimals and the operation: a at dpa places, b at dpb places, a - b stays positive */
  const asPair = (
    /** @type {any} */ rng,
    /** @type {number} */ dpa,
    /** @type {number} */ dpb,
    /** @type {"add"|"sub"} */ op,
    /** @type {number} */ maxWhole = 60,
  ) =>
    draw(
      () => ({
        A: rng.int(10 ** dpa + 1, maxWhole * 10 ** dpa - 1),
        B: rng.int(10 ** dpb + 1, maxWhole * 10 ** dpb - 1),
      }),
      (v) =>
        (dpa === 0 || nz(v.A)) &&
        (dpb === 0 || nz(v.B)) &&
        (op === "add" || v.A / 10 ** dpa > v.B / 10 ** dpb + 0.5),
    );
  /** exact result of a(dpa) op b(dpb) as an integer at the larger scale */
  const asResult = (
    /** @type {number} */ A,
    /** @type {number} */ dpa,
    /** @type {number} */ B,
    /** @type {number} */ dpb,
    /** @type {"add"|"sub"} */ op,
  ) => {
    const dp = Math.max(dpa, dpb);
    const a = A * 10 ** (dp - dpa);
    const b = B * 10 ** (dp - dpb);
    return { dp, a, b, r: op === "add" ? a + b : a - b };
  };
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const addSubTypes = {
    align(rng) {
      const p = draw(
        () => ({ A: rng.int(1000, 99999), B: rng.int(11, 99) }),
        (v) =>
          nz(v.A) &&
          nz(v.B) &&
          v.A > 0 &&
          new Set(String(v.A).split("")).size === String(v.A).length &&
          String(v.A).length === 4,
      );
      const A = p.A; // dp 2, e.g. 12.75
      const B = Math.floor(p.B / 10); // one digit at dp 1
      const s = String(A);
      const digit = (/** @type {number} */ place) => s[s.length - 1 - place];
      const V = { a: dt(A, 2), b: dt(B, 1), bd: B };
      const right = digit(1);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["To add {a} + {b}, you line up the decimal points. Which digit of {a} sits in the same column as the {bd} in {b}?", "Para sumar {a} + {b}, alineas los puntos decimales. ¿Cuál dígito de {a} está en la misma columna que el {bd} de {b}?"],
        a: right,
        w: [[digit(0), "decimal-columns"], [digit(2), "wrong-digit-column"], [digit(3), "wrong-digit-column"]],
        x: ["{b} has one decimal place, so its {bd} is in the tenths column. The digit of {a} in the tenths column is " + right + ".", "{b} tiene una cifra decimal, así que su {bd} está en la columna de las décimas. El dígito de {a} en las décimas es " + right + "."],
        h: [["Place value, not position, decides the column: tenths go with tenths.", "El valor posicional, no la posición, decide la columna: décimas con décimas."], ["Which place is the {bd} in {b}: tenths or hundredths?", "¿En qué lugar está el {bd} de {b}: décimas o centésimas?"], ["Find the digit of {a} in that same place.", "Busca el dígito de {a} en ese mismo lugar."]],
        meta: { kind: "align", A, B },
      });
    },
    zero(rng) {
      const n = rng.int(11, 99);
      const x = dt(n, 1);
      const V = { x };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Add a zero so {x} has two decimal places without changing its value. What do you write?", "Agrega un cero para que {x} tenga dos cifras decimales sin cambiar su valor. ¿Qué escribes?"],
        a: dec(n * 10, 2),
        w: [[`${Math.floor(n / 10)}.0${n % 10}`, "zero-in-wrong-place"], [dt(n, 2), "digits-shifted"], [dt(n * 10, 1), "digits-shifted"], [dec(n, 3), "digits-shifted"]],
        x: ["A zero after the last decimal digit does not change the value: {x} = " + dec(n * 10, 2) + ". Now both numbers can have the same number of decimal places.", "Un cero después de la última cifra decimal no cambia el valor: {x} = " + dec(n * 10, 2) + ". Ahora los dos números pueden tener las mismas cifras decimales."],
        h: [["Annexing a zero only adds tenths of nothing: it adds a place, not value.", "Agregar un cero solo agrega un lugar vacío, no valor."], ["The zero goes at the right end of the decimal digits.", "El cero va al extremo derecho de las cifras decimales."], ["Which choice still means the same amount as {x}?", "¿Cuál opción sigue significando la misma cantidad que {x}?"]],
        meta: { kind: "zero", n },
      });
    },
    calc(rng, level) {
      const op = rng.pick(["add", "sub"]);
      const [dpa, dpb] =
        level === 1
          ? rng.pick([
              [1, 1],
              [2, 2],
            ])
          : rng.pick([
              [1, 2],
              [2, 1],
              [2, 2],
              [1, 3],
              [3, 1],
              [2, 2],
            ]);
      const { A, B } = asPair(rng, dpa, dpb, op, level === 1 ? 20 : 60);
      const { dp, a, b, r } = asResult(A, dpa, B, dpb, op);
      const st = rng.pick(
        ASTORY.filter((s) => s[1] === (op === "add" ? 1 : 0) && (s[0] === 0 || dp <= 2)),
      );
      const useStory = level === 2 || rng.chance(0.6);
      const money = st[0] === 1;
      const V = {
        who: rng.pick(NAMES),
        a: money ? dec(A * 10 ** (2 - dpa), 2) : dt(A, dpa),
        b: money ? dec(B * 10 ** (2 - dpb), 2) : dt(B, dpb),
      };
      const edge =
        op === "add"
          ? (A + B) / 10 ** Math.max(dpa, dpb)
          : Math.abs(A - B) / 10 ** Math.max(dpa, dpb);
      const sym = op === "add" ? "+" : "−";
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: useStory ? [st[2], st[3]] : [`What is {a} ${sym} {b}?`, `¿Cuánto es {a} ${sym} {b}?`],
        a: pv(r, dp),
        w: [[term(edge), "decimal-columns"], [term(colwise(a, b, op) / 10 ** dp), op === "add" ? "forgot-to-regroup" : "smaller-from-larger"], [op === "add" ? pv(a - b > 0 ? a - b : b - a, dp) : pv(a + b, dp), op === "add" ? "op-subtracted-instead-of-added" : "op-added-instead-of-subtracted"], [term(r / 10 ** dp / 10), "decimal-place-value/small"]],
        x: [`Line up the decimal points and annex zeros: ${dec(a, dp)} ${sym} ${dec(b, dp)} = ${dec(r, dp)}${pv(r, dp) !== dec(r, dp) ? `, which is ${pv(r, dp)}` : ""}.`, `Alinea los puntos decimales y agrega ceros: ${dec(a, dp)} ${sym} ${dec(b, dp)} = ${dec(r, dp)}${pv(r, dp) !== dec(r, dp) ? `, o sea ${pv(r, dp)}` : ""}.`],
        h: [["Line up the decimal points so equal place values sit in the same column.", "Alinea los puntos decimales para que los valores posicionales iguales queden en la misma columna."], ["Annex zeros so both numbers have the same number of decimal places.", "Agrega ceros para que los dos números tengan las mismas cifras decimales."], [`Write ${dec(a, dp)} on top and ${dec(b, dp)} below it. Start at the right-hand column.`, `Escribe ${dec(a, dp)} arriba y ${dec(b, dp)} debajo. Empieza por la columna de la derecha.`]],
        meta: { kind: "calc", A, dpa, B, dpb, op },
      });
    },
    whole(rng) {
      const W0 = rng.int(20, 90);
      const B = draw(() => rng.int(101, 999), nz);
      const wholeB = Math.floor(B / 100);
      const V = { a: String(W0), b: dt(B, 2) };
      const r = W0 * 100 - B;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["What is {a} − {b}?", "¿Cuánto es {a} − {b}?"],
        a: pv(r, 2),
        w: [[term(W0 - wholeB + (B % 100) / 100), "whole-minus-decimal-kept-fraction"], [term(colwise(W0 * 100, B, "sub") / 100), "smaller-from-larger"], [term(r / 1000), "decimal-place-value/small"]],
        x: [`Write ${W0} as ${dec(W0 * 100, 2)} so the places line up: ${dec(W0 * 100, 2)} − ${dec(B, 2)} = ${dec(r, 2)}.`, `Escribe ${W0} como ${dec(W0 * 100, 2)} para alinear los lugares: ${dec(W0 * 100, 2)} − ${dec(B, 2)} = ${dec(r, 2)}.`],
        h: [["A whole number has a hidden decimal point at its right end.", "Un número entero tiene un punto decimal escondido en su extremo derecho."], ["Annex zeros: write {a} with two decimal places.", "Agrega ceros: escribe {a} con dos cifras decimales."], ["Subtract column by column, regrouping from the left when a digit is too small.", "Resta columna por columna, reagrupando desde la izquierda cuando un dígito es muy pequeño."]],
        meta: { kind: "calc", A: W0, dpa: 0, B, dpb: 2, op: "sub" },
      });
    },
    mcCalc(rng) {
      const op = rng.pick(["add", "sub"]);
      const [dpa, dpb] = rng.pick([
        [1, 2],
        [2, 1],
        [2, 2],
      ]);
      const { A, B } = asPair(rng, dpa, dpb, op, 60);
      const { dp, a, b, r } = asResult(A, dpa, B, dpb, op);
      const V = { a: dt(A, dpa), b: dt(B, dpb) };
      const sym = op === "add" ? "+" : "−";
      const edge =
        op === "add"
          ? (A + B) / 10 ** Math.max(dpa, dpb)
          : Math.abs(A - B) / 10 ** Math.max(dpa, dpb);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: [`What is {a} ${sym} {b}?`, `¿Cuánto es {a} ${sym} {b}?`],
        a: dt(r, dp),
        w: [[cm(r6(edge)), "decimal-columns"], [cm(r6(colwise(a, b, op) / 10 ** dp)), op === "add" ? "forgot-to-regroup" : "smaller-from-larger"], [cm(r6(op === "add" ? Math.abs(a - b) / 10 ** dp : (a + b) / 10 ** dp)), op === "add" ? "op-subtracted-instead-of-added" : "op-added-instead-of-subtracted"], [cm(r6(r / 10 ** dp / 10)), "decimal-place-value/small"], [cm(r6(r / 10 ** dp + 0.1)), "forgot-to-regroup"]],
        x: [`Line up the points: ${dec(a, dp)} ${sym} ${dec(b, dp)} = ${dec(r, dp)}.`, `Alinea los puntos: ${dec(a, dp)} ${sym} ${dec(b, dp)} = ${dec(r, dp)}.`],
        h: [["Line up the decimal points first.", "Primero alinea los puntos decimales."], ["Annex zeros so both numbers have the same number of decimal places.", "Agrega ceros para que los dos números tengan las mismas cifras decimales."], ["Work from the right-hand column, regrouping when needed.", "Trabaja desde la columna de la derecha, reagrupando cuando haga falta."]],
        meta: { kind: "calc", A, dpa, B, dpb, op },
      });
    },
    addend(rng) {
      const dp = rng.pick([1, 2]);
      const known = draw(() => rng.int(11, dp === 1 ? 99 : 999), nz);
      const unk = draw(() => rng.int(11, dp === 1 ? 99 : 999), nz);
      const form = rng.pick(["a", "b", "c"]);
      const tot = known + unk;
      const V = { k: dt(known, dp), t: dt(tot, dp), u: dt(unk, dp) };
      const sentence = { a: "? + {k} = {t}", b: "{t} − ? = {k}", c: "? − {k} = {u}" }[
        /** @type {"a"} */ (form)
      ];
      const ans = form === "a" ? unk : form === "b" ? unk : tot;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: [`Find the missing number: ${sentence}`, `Halla el número que falta: ${sentence}`],
        a: pv(ans, dp),
        w: [form === "c" ? [pv(unk - known > 0 ? unk - known : known - unk, dp), "op-subtracted-instead-of-added"] : [pv(tot + known, dp), "op-added-instead-of-subtracted"], [term(colwise(form === "c" ? unk : tot, known, form === "c" ? "add" : "sub") / 10 ** dp), "decimal-columns"], [term(ans / 10 ** dp / 10), "decimal-place-value/small"]],
        x: [form === "c" ? `Undo the subtraction by adding: {u} + {k} = ${dt(tot, dp)}.` : `Undo with the other operation: ${dt(tot, dp)} − ${dt(known, dp)} = ${dt(unk, dp)}.`, form === "c" ? `Deshaz la resta sumando: {u} + {k} = ${dt(tot, dp)}.` : `Deshaz con la otra operación: ${dt(tot, dp)} − ${dt(known, dp)} = ${dt(unk, dp)}.`],
        h: [["Addition and subtraction undo each other.", "La suma y la resta se deshacen entre sí."], [form === "c" ? "The missing number was reduced by the known amount, so put that amount back." : "The whole is the sum of the parts, so a missing part is the whole minus the known part.", form === "c" ? "Al faltante se le quitó la cantidad conocida, así que devuelve esa cantidad." : "El total es la suma de las partes, así que una parte que falta es el total menos la parte conocida."], ["Line up the decimal points before you compute.", "Alinea los puntos decimales antes de calcular."]],
        meta: { kind: "addend", form, known, unk, dp },
      });
    },
    need(rng) {
      const want = draw(() => rng.int(1500, 9999), nz);
      const have = draw(() => rng.int(500, want - 300), nz);
      const V = { who: rng.pick(NAMES), want: dec(want, 2), have: dec(have, 2) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["{who} wants a game that costs ${want}. {who} has ${have}. How many more dollars does {who} need?", "{who} quiere un juego que cuesta ${want}. {who} tiene ${have}. ¿Cuántos dólares más necesita {who}?"],
        a: pv(want - have, 2),
        w: [[pv(want + have, 2), "op-added-instead-of-subtracted"], [term(colwise(want, have, "sub") / 100), "smaller-from-larger"], [term((want - have) / 1000), "decimal-place-value/small"]],
        x: ["Find how much more: ${want} − ${have} = $" + dec(want - have, 2) + ".", "Halla cuánto más: ${want} − ${have} = $" + dec(want - have, 2) + "."],
        h: [["\"How many more\" compares two amounts by subtracting.", "\"Cuántos más\" compara dos cantidades restando."], ["Subtract the smaller amount from the larger one.", "Resta la cantidad menor de la mayor."], ["Line up the decimal points: ${want} on top.", "Alinea los puntos decimales: ${want} arriba."]],
        meta: { kind: "calc", A: want, dpa: 2, B: have, dpb: 2, op: "sub" },
      });
    },
    change(rng) {
      const a = draw(() => rng.int(250, 1199), nz);
      const b = draw(() => rng.int(250, 1199), nz);
      const X = pick20(rng, a + b);
      const V = {
        who: rng.pick(NAMES),
        X: dec(X, 2),
        a: dec(a, 2),
        b: dec(b, 2),
        s: dec(a + b, 2),
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["{who} has ${X}. {who} buys a snack for ${a} and a drink for ${b}. How many dollars does {who} have left?", "{who} tiene ${X}. {who} compra un bocadillo por ${a} y una bebida por ${b}. ¿Cuántos dólares le quedan a {who}?"],
        a: pv(X - a - b, 2),
        w: [[pv(X - a, 2), "forgot-second-item"], [pv(X - a + b, 2), "grouping-error"], [pv(a + b, 2), "total-only"]],
        x: ["Add the two costs: ${a} + ${b} = ${s}. Then subtract: ${X} − ${s} = $" + dec(X - a - b, 2) + ".", "Suma los dos costos: ${a} + ${b} = ${s}. Luego resta: ${X} − ${s} = $" + dec(X - a - b, 2) + "."],
        h: [["Find the total cost of the two things first.", "Primero halla el costo total de las dos cosas."], ["Then subtract that total from the money {who} started with.", "Luego resta ese total del dinero con el que {who} empezó."], ["Line up the decimal points each time.", "Alinea los puntos decimales cada vez."]],
        meta: { kind: "change", X, a, b },
      });
    },
    exprMc(rng) {
      const a = draw(() => rng.int(250, 1199), nz);
      const b = draw(() => rng.int(250, 1199), nz);
      const X = pick20(rng, a + b);
      const V = { X: dec(X, 2), a: dec(a, 2), b: dec(b, 2), who: rng.pick(NAMES) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["{who} has ${X}, then buys one item for ${a} and another for ${b}. Which expression finds the money left?", "{who} tiene ${X} y compra un artículo por ${a} y otro por ${b}. ¿Cuál expresión halla el dinero que queda?"],
        a: "{X} − ({a} + {b})",
        w: [["{X} − {a} + {b}", "grouping-error"], ["({a} + {b}) − {X}", "op-reversed-subtraction"], ["{X} + {a} + {b}", "op-added-instead-of-subtracted"], ["{X} − {a}", "forgot-second-item"]],
        x: ["The two costs are added together first, and that total is subtracted from {X}: {X} − ({a} + {b}).", "Los dos costos se suman primero y ese total se resta de {X}: {X} − ({a} + {b})."],
        h: [["The money left is what you started with minus everything you spent.", "El dinero que queda es lo que tenías menos todo lo que gastaste."], ["Everything spent is {a} plus {b}.", "Todo lo gastado es {a} más {b}."], ["Use parentheses so the subtraction covers the whole amount spent.", "Usa paréntesis para que la resta cubra todo lo gastado."]],
        meta: { kind: "expr", X, a, b },
      });
    },
    measure(rng) {
      const cap2 = draw(() => rng.int(2000, 9999), nz);
      const a = draw(() => rng.int(300, 900), nz);
      const b = draw(() => rng.int(300, 900), nz);
      const V = {
        who: rng.pick(NAMES),
        cap: dec(cap2, 2),
        a: dec(a, 2),
        b: dec(b, 2),
        s: dec(a + b, 2),
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["A tank holds {cap} L. {who} pours in {a} L and then {b} L. How many more liters will fit?", "Un tanque tiene capacidad para {cap} L. {who} vierte {a} L y luego {b} L. ¿Cuántos litros más caben?"],
        a: pv(cap2 - a - b, 2),
        w: [[pv(cap2 - a, 2), "forgot-second-item"], [pv(cap2 - a + b, 2), "grouping-error"], [pv(a + b, 2), "total-only"]],
        x: ["{a} + {b} = {s} L poured in. Then {cap} − {s} = " + dec(cap2 - a - b, 2) + " L will still fit.", "{a} + {b} = {s} L vertidos. Luego {cap} − {s} = " + dec(cap2 - a - b, 2) + " L todavía caben."],
        h: [["Find how much water went in altogether first.", "Primero halla cuánta agua entró en total."], ["Then subtract that from the tank's capacity.", "Luego réstalo de la capacidad del tanque."], ["Annex zeros if you need them to line up the places.", "Agrega ceros si los necesitas para alinear los lugares."]],
        meta: { kind: "change", X: cap2, a, b },
      });
    },
  };
  /** a "money you started with" a little over the amount spent, in cents, ending in 00 */
  const pick20 = (/** @type {any} */ rng, /** @type {number} */ spent) =>
    Math.ceil((spent + rng.int(150, 700)) / 500) * 500;

  G.register("decimalAddSub", {
    title: "Add and subtract decimals",
    titleEs: "Sumar y restar decimales",
    levels: 4,
    make(rng, level) {
      return addSubTypes[rng.pick(AS_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      switch (m.kind) {
        case "calc": {
          const dp = Math.max(m.dpa, m.dpb);
          const sA = String(m.A) + "0".repeat(dp - m.dpa);
          const sB = String(m.B) + "0".repeat(dp - m.dpb);
          // column arithmetic on the digit strings, with an explicit carry/borrow
          let carry = 0;
          const out = [];
          const n = Math.max(sA.length, sB.length);
          const x = sA.padStart(n, "0");
          const y = sB.padStart(n, "0");
          for (let i = n - 1; i >= 0; i--) {
            let v =
              m.op === "add"
                ? Number(x[i]) + Number(y[i]) + carry
                : Number(x[i]) - Number(y[i]) - carry;
            carry = 0;
            if (v >= 10) {
              v -= 10;
              carry = 1;
            } else if (v < 0) {
              v += 10;
              carry = 1;
            }
            out.unshift(v);
          }
          if (carry) out.unshift(1);
          const val = Number(out.join("")) / 10 ** dp;
          return item.k === "mc" ? agree(item, cm(r6(val))) : agree(item, val);
        }
        case "align": {
          const place = (/** @type {number} */ n, /** @type {number} */ p) =>
            Math.floor(n / 10 ** p) % 10;
          return agree(item, place(m.A, 1));
        }
        case "zero":
          return item.c.filter((/** @type {string} */ c) => Number(c) === m.n / 10).length === 1 &&
            Number(item.c[item.a]) === m.n / 10 &&
            item.c[item.a].split(".")[1].length === 2
            ? true
            : "zero choice mismatch";
        case "addend":
          return agree(item, (m.form === "c" ? m.unk + m.known : m.unk) / 10 ** m.dp);
        case "change":
          return agree(item, (m.X - m.a - m.b) / 100);
        case "expr": {
          const want = (m.X - m.a - m.b) / 100;
          const vals = item.c.map((/** @type {string} */ c) => r6(evalStr(c)));
          return vals.filter((/** @type {number} */ v) => Math.abs(v - want) < 1e-9).length === 1 &&
            Math.abs(vals[item.a] - want) < 1e-9
            ? true
            : `expression values ${vals} vs ${want}`;
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ============================================== decimalMultiply ================================================= */
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "product-too-small": ["That is much too small. Round each factor to a whole number and multiply: the product should be near that.", "Eso es demasiado pequeño. Redondea cada factor a un entero y multiplica: el producto debe estar cerca de eso."],
    "product-too-large": ["That is much too big. Round each factor to a whole number and multiply: the product should be near that.", "Eso es demasiado grande. Redondea cada factor a un entero y multiplica: el producto debe estar cerca de eso."],
    "decimal-places-counted-once": ["The decimal places of BOTH factors count. Add them up: that is how many places the product has.", "Cuentan las cifras decimales de LOS DOS factores. Súmalas: ese es el número de cifras decimales del producto."],
    "times-always-makes-bigger": ["Multiplying by a number greater than 1 makes the product bigger than {W}. Only a factor less than 1 makes it smaller.", "Multiplicar por un número mayor que 1 hace el producto mayor que {W}. Solo un factor menor que 1 lo hace menor."],
    "area-perimeter-swap": ["That adds the sides. Area is found by multiplying length by width.", "Eso suma los lados. El área se halla multiplicando largo por ancho."],
    "stopped-after-first-product": ["That is only the first product. The problem needs one more step.", "Ese es solo el primer producto. El problema necesita un paso más."],
    "added-before-multiplying": ["Each price goes with its own amount. Multiply each pair first, then add the two products.", "Cada precio va con su propia cantidad. Multiplica cada pareja primero y luego suma los dos productos."],
    "place-value-not-shifted": ["The whole-number product and the decimal product have the same digits. Count how many places each factor moved to place the point.", "El producto con enteros y el producto con decimales tienen las mismas cifras. Cuenta cuántos lugares se movió cada factor para colocar el punto."],
    "op-added-instead-of-multiplied-d": ["That adds the factors. This problem asks for groups of an amount, so multiply.", "Eso suma los factores. Este problema pide grupos de una cantidad, así que se multiplica."],
  });
  const MSTORY = [
    // [money, unit, en, es]  {x} = the first factor, {y} = the second, {z} = unit-price text
    [
      1,
      "",
      "{who} buys {x} pounds of apples at ${y} per pound. How many dollars does {who} pay?",
      "{who} compra {x} libras de manzanas a ${y} la libra. ¿Cuántos dólares paga {who}?",
    ],
    [
      1,
      "",
      "A ribbon costs ${y} per meter. How many dollars do {x} meters cost?",
      "Una cinta cuesta ${y} el metro. ¿Cuántos dólares cuestan {x} metros?",
    ],
    [
      0,
      "L",
      "A bottle holds {y} L. How many liters are in {x} bottles?",
      "Una botella tiene {y} L. ¿Cuántos litros hay en {x} botellas?",
    ],
    [
      0,
      "kg",
      "One bag of soil weighs {y} kg. How many kilograms do {x} bags weigh?",
      "Una bolsa de tierra pesa {y} kg. ¿Cuántos kilogramos pesan {x} bolsas?",
    ],
    [
      0,
      "mi",
      "A trail loop is {y} miles long. How many miles is {x} loops?",
      "Un circuito de sendero mide {y} millas. ¿Cuántas millas son {x} circuitos?",
    ],
  ];
  const MM_TYPES = {
    1: ["reasonable", "lessThan", "simple"],
    2: ["prod", "place", "prod"],
    3: ["given", "given", "placeMc"],
    4: ["area", "cost2", "change"],
  };
  /** a factor at dp places with no trailing zero */
  const fac = (
    /** @type {any} */ rng,
    /** @type {number} */ dp,
    /** @type {number} */ lo,
    /** @type {number} */ hi,
  ) =>
    draw(
      () => rng.int(lo, hi),
      (v) => dp === 0 || nz(v),
    );
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const mulTypes = {
    reasonable(rng) {
      const { a, b } = draw(
        () => ({ a: fac(rng, 1, 21, 99), b: fac(rng, 1, 21, 99) }),
        (v) => {
          const E = Math.round(v.a / 10) * Math.round(v.b / 10);
          const ex = (v.a * v.b) / 100;
          return Math.abs(E - ex) / ex < 0.25;
        },
      );
      const E = Math.round(a / 10) * Math.round(b / 10);
      const V = { a: dt(a, 1), b: dt(b, 1) };
      const near = (/** @type {number} */ v) => [`about ${cm(v)}`, `alrededor de ${cm(v)}`];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Estimate first. Which is a reasonable product for {a} × {b}?", "Estima primero. ¿Cuál es un producto razonable para {a} × {b}?"],
        a: near(E),
        w: [[near(E / 10), "product-too-small"], [near(E * 10), "product-too-large"], [near(E / 100), "product-too-small"], [near(E * 100), "product-too-large"]],
        x: [`{a} is close to ${Math.round(a / 10)} and {b} is close to ${Math.round(b / 10)}. ${Math.round(a / 10)} × ${Math.round(b / 10)} = ${E}, so the product is about ${E}.`, `{a} está cerca de ${Math.round(a / 10)} y {b} está cerca de ${Math.round(b / 10)}. ${Math.round(a / 10)} × ${Math.round(b / 10)} = ${E}, así que el producto es alrededor de ${E}.`],
        h: [["Round each factor to the nearest whole number.", "Redondea cada factor al entero más cercano."], ["Multiply the two rounded numbers.", "Multiplica los dos números redondeados."], ["Compare each choice with that estimate.", "Compara cada opción con esa estimación."]],
        meta: { kind: "reasonable", a, b },
      });
    },
    lessThan(rng) {
      const Wn = rng.int(3, 40);
      const small = rng.pick([0.9, 0.5, 0.25, 0.75, 0.8, 0.4]);
      const bigs = rng.shuffle([1.2, 2.5, 1.5, 1.01, 3, 1.1]).slice(0, 3);
      const e = (/** @type {number} */ f) => `${Wn} × ${cm(f)}`;
      const V = { W: Wn };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Without calculating, which product is less than {W}?", "Sin calcular, ¿cuál producto es menor que {W}?"],
        a: e(small),
        w: bigs.map((f) => [e(f), "times-always-makes-bigger"]),
        x: [`Multiplying {W} by ${cm(small)}, a number less than 1, gives a product less than {W}. The other factors are greater than 1, so those products are greater than {W}.`, `Multiplicar {W} por ${cm(small)}, un número menor que 1, da un producto menor que {W}. Los otros factores son mayores que 1, así que esos productos son mayores que {W}.`],
        h: [["Think of the second factor as 'part of' or 'more than' one group of {W}.", "Piensa en el segundo factor como 'una parte de' o 'más de' un grupo de {W}."], ["A factor less than 1 takes only part of {W}.", "Un factor menor que 1 toma solo una parte de {W}."], ["Which factor is less than 1?", "¿Cuál factor es menor que 1?"]],
        meta: { kind: "lessThan", W: Wn, small, others: bigs },
      });
    },
    simple(rng) {
      const w = rng.int(2, 9);
      const y = fac(rng, 1, 3, 99);
      const st = rng.pick(MSTORY);
      const V = { who: rng.pick(NAMES), x: w, y: st[0] ? dec(y * 10, 2) : dt(y, 1) };
      const pr = w * y;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: [st[2], st[3]], a: pv(pr, 1), unit: st[1] || undefined,
        w: [[term(pr / 100), "decimal-place-value/small"], [term(pr), "decimal-place-value/large"], [term(w + y / 10), "op-added-instead-of-multiplied-d"]],
        x: [`${w} × ${dt(y, 1)}: multiply ${w} × ${y} = ${pr}, then put the point one place from the right: ${dt(pr, 1)}.`, `${w} × ${dt(y, 1)}: multiplica ${w} × ${y} = ${pr} y pon el punto un lugar desde la derecha: ${dt(pr, 1)}.`],
        h: [["Multiply as if there were no decimal point.", "Multiplica como si no hubiera punto decimal."], ["Count the decimal places in the factors: that many places go in the product.", "Cuenta las cifras decimales de los factores: ese número de cifras va en el producto."], ["Estimate: is the answer a little more or a lot more than the whole-number factor?", "Estima: ¿la respuesta es un poco o mucho mayor que el factor entero?"]],
        meta: { kind: "prod", A: w, dpa: 0, B: y, dpb: 1 },
      });
    },
    prod(rng) {
      const [dpa, dpb] = rng.pick([
        [1, 1],
        [1, 1],
        [1, 2],
        [2, 1],
      ]);
      const A = fac(rng, dpa, dpa === 1 ? 12 : 105, dpa === 1 ? 99 : 399);
      const B = fac(rng, dpb, dpb === 1 ? 12 : 105, dpb === 1 ? 99 : 399);
      const pr = A * B;
      const dp = dpa + dpb;
      const st = rng.pick(MSTORY);
      const useStory = dp === 2 && rng.chance(0.5);
      const V = {
        who: rng.pick(NAMES),
        a: dt(A, dpa),
        b: dt(B, dpb),
        x: dt(A, dpa),
        y: st[0] ? dec(B * 10 ** (2 - dpb), 2) : dt(B, dpb),
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: useStory ? [st[2], st[3]] : ["What is {a} × {b}?", "¿Cuánto es {a} × {b}?"], a: pv(pr, dp), unit: useStory ? st[1] || undefined : undefined,
        w: [[term(pr / 10 ** Math.max(dpa, dpb)), "decimal-places-counted-once"], [term(pr / 10 ** (dp + 1)), "decimal-place-value/small"], [term(pr / 10 ** (dp - 1)), "decimal-place-value/large"]],
        x: [`${A} × ${B} = ${cm(pr)}. {a} has ${dpa} decimal place(s) and {b} has ${dpb}, so the product has ${dp}: ${dt(pr, dp)}.`, `${A} × ${B} = ${cm(pr)}. {a} tiene ${dpa} cifra(s) decimal(es) y {b} tiene ${dpb}, así que el producto tiene ${dp}: ${dt(pr, dp)}.`],
        h: [["Multiply the numbers as if they were whole numbers.", "Multiplica los números como si fueran enteros."], ["Count the decimal places in BOTH factors and add them.", "Cuenta las cifras decimales de LOS DOS factores y súmalas."], [`Multiply ${A} × ${B}, then place the point.`, `Multiplica ${A} × ${B} y luego coloca el punto.`]],
        meta: { kind: "prod", A, dpa, B, dpb },
      });
    },
    place(rng) {
      return mulTypes.placeMc(rng, 3);
    },
    placeMc(rng) {
      const [dpa, dpb] = rng.pick([
        [1, 1],
        [1, 2],
        [2, 1],
      ]);
      const A = fac(rng, dpa, 12, dpa === 1 ? 99 : 399);
      const B = fac(rng, dpb, 12, 99);
      const pr = A * B;
      const dp = dpa + dpb;
      const V = { a: dt(A, dpa), b: dt(B, dpb), A, B, pr: cm(pr) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Multiplying {A} × {B} as whole numbers gives {pr}. What is {a} × {b}?", "Multiplicar {A} × {B} como enteros da {pr}. ¿Cuánto es {a} × {b}?"],
        a: dt(pr, dp),
        w: [[dt(pr, Math.max(dpa, dpb)), "decimal-places-counted-once"], [dt(pr, dp + 1), "decimal-place-value/small"], [dt(pr, dp - 1), "decimal-place-value/large"], [dt(pr, dp + 2), "decimal-place-value/small"]],
        x: ["{a} has " + dpa + " decimal place(s) and {b} has " + dpb + ", so the product has " + dp + ": " + dt(pr, dp) + ".", "{a} tiene " + dpa + " cifra(s) decimal(es) y {b} tiene " + dpb + ", así que el producto tiene " + dp + ": " + dt(pr, dp) + "."],
        h: [["The digits stay the same. Only the position of the decimal point changes.", "Las cifras son las mismas. Solo cambia la posición del punto decimal."], ["Count the decimal places in {a} and in {b}.", "Cuenta las cifras decimales de {a} y de {b}."], ["Add those counts. Start at the right of {pr} and move the point left that many places.", "Suma esas cantidades. Empieza a la derecha de {pr} y mueve el punto a la izquierda esa cantidad de lugares."]],
        meta: { kind: "prod", A, dpa, B, dpb },
      });
    },
    given(rng) {
      const A = rng.int(12, 49);
      const B = rng.int(12, 49);
      const dpa = rng.pick([0, 1, 1, 2]);
      const dpb = dpa === 0 ? rng.pick([1, 2]) : rng.pick([0, 1, 2]);
      const pr = A * B;
      const up = rng.chance(0.3);
      const V = { A, B, pr: cm(pr), a: dt(A, dpa), b: dt(B, dpb), p: dt(pr, dpa + dpb) };
      if (up) {
        // prettier-ignore
        // biome-ignore format: bilingual spec
        return numB(V, {
          q: ["Use {a} × {b} = {p}. What is {A} × {B}?", "Usa {a} × {b} = {p}. ¿Cuánto es {A} × {B}?"], a: pr,
          w: [[term(pr / 10), "decimal-place-value/small"], [term(pr * 10), "decimal-place-value/large"], [term(pr / 100), "decimal-place-value/small"]],
          x: ["{a} became {A} and {b} became {B}: the decimal points moved " + (dpa + dpb) + " place(s) in all, so the product moves the same: {p} becomes " + cm(pr) + ".", "{a} pasó a {A} y {b} pasó a {B}: los puntos decimales se movieron " + (dpa + dpb) + " lugar(es) en total, así que el producto se mueve igual: {p} pasa a " + cm(pr) + "."],
          h: [["Compare the factors: how many places did each one move?", "Compara los factores: ¿cuántos lugares se movió cada uno?"], ["Add the places moved by both factors.", "Suma los lugares que se movió cada factor."], ["Move the decimal point of {p} that many places to the right.", "Mueve el punto decimal de {p} esa cantidad de lugares a la derecha."]],
          meta: { kind: "prod", A, dpa: 0, B, dpb: 0 },
        });
      }
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Use {A} × {B} = {pr}. What is {a} × {b}?", "Usa {A} × {B} = {pr}. ¿Cuánto es {a} × {b}?"], a: pv(pr, dpa + dpb),
        w: [[term(pr / 10 ** Math.max(dpa, dpb)), "decimal-places-counted-once"], [term(pr / 10 ** (dpa + dpb + 1)), "decimal-place-value/small"], [pr, "place-value-not-shifted"]],
        x: ["{a} has " + dpa + " decimal place(s) and {b} has " + dpb + ", so the product has " + (dpa + dpb) + ". Start with {pr} and place the point: {p}.", "{a} tiene " + dpa + " cifra(s) decimal(es) y {b} tiene " + dpb + ", así que el producto tiene " + (dpa + dpb) + ". Empieza con {pr} y coloca el punto: {p}."],
        h: [["The digits of the product stay the same: {pr}.", "Las cifras del producto son las mismas: {pr}."], ["How many places did {A} move to become {a}? How many did {B} move to become {b}?", "¿Cuántos lugares se movió {A} para volverse {a}? ¿Cuántos se movió {B} para volverse {b}?"], ["Add those moves and put the point that many places from the right of {pr}.", "Suma esos movimientos y pon el punto esa cantidad de lugares desde la derecha de {pr}."]],
        meta: { kind: "prod", A, dpa, B, dpb },
      });
    },
    area(rng) {
      const A = fac(rng, 1, 12, 99);
      const B = fac(rng, 1, 12, 99);
      const [who, unit, en, es] = rng.pick([
        [
          "garden",
          "m²",
          "A rectangular garden is {a} m long and {b} m wide. What is its area, in square meters?",
          "Un jardín rectangular mide {a} m de largo y {b} m de ancho. ¿Cuál es su área, en metros cuadrados?",
        ],
        [
          "rug",
          "m²",
          "A rug is {a} m by {b} m. What is its area, in square meters?",
          "Una alfombra mide {a} m por {b} m. ¿Cuál es su área, en metros cuadrados?",
        ],
        [
          "poster",
          "cm²",
          "A poster is {a} cm tall and {b} cm wide. What is its area, in square centimeters?",
          "Un cartel mide {a} cm de alto y {b} cm de ancho. ¿Cuál es su área, en centímetros cuadrados?",
        ],
        [
          "field",
          "km²",
          "A park is {a} km long and {b} km wide. What is its area, in square kilometers?",
          "Un parque mide {a} km de largo y {b} km de ancho. ¿Cuál es su área, en kilómetros cuadrados?",
        ],
      ]);
      void who;
      const pr = A * B;
      const V = { a: dt(A, 1), b: dt(B, 1) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: [en, es], a: pv(pr, 2), unit,
        w: [[term((A + B) / 10), "area-perimeter-swap"], [term(2 * (A + B) / 10), "area-perimeter-swap"], [term(pr / 10), "decimal-places-counted-once"], [term(pr / 1000), "decimal-place-value/small"]],
        x: [`Area = length × width = {a} × {b}. ${A} × ${B} = ${cm(pr)}, and two decimal places make ${dt(pr, 2)} ${unit}.`, `Área = largo × ancho = {a} × {b}. ${A} × ${B} = ${cm(pr)}, y dos cifras decimales dan ${dt(pr, 2)} ${unit}.`],
        h: [["Area of a rectangle: length times width.", "Área de un rectángulo: largo por ancho."], ["Multiply the numbers without the points, then count the decimal places.", "Multiplica los números sin los puntos y luego cuenta las cifras decimales."], [`Multiply ${A} × ${B}.`, `Multiplica ${A} × ${B}.`]],
        meta: { kind: "prod", A, dpa: 1, B, dpb: 1 },
      });
    },
    cost2(rng) {
      const [x1, y1, x2, y2] = [
        fac(rng, 1, 12, 59),
        fac(rng, 1, 12, 59),
        fac(rng, 1, 12, 59),
        fac(rng, 1, 12, 59),
      ];
      const p1 = x1 * y1;
      const p2 = x2 * y2;
      const V = {
        who: rng.pick(NAMES),
        x1: dt(x1, 1),
        y1: dec(y1 * 10, 2),
        x2: dt(x2, 1),
        y2: dec(y2 * 10, 2),
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["{who} buys {x1} kg of apples at ${y1} per kg and {x2} kg of pears at ${y2} per kg. How many dollars does {who} spend in all?", "{who} compra {x1} kg de manzanas a ${y1} el kg y {x2} kg de peras a ${y2} el kg. ¿Cuántos dólares gasta {who} en total?"],
        a: pv(p1 + p2, 2),
        w: [[pv(p1, 2), "stopped-after-first-product"], [term(((x1 + x2) * (y1 + y2)) / 100), "added-before-multiplying"], [term((p1 + p2) / 1000), "decimal-place-value/small"]],
        x: [`Apples: {x1} × {y1} = ${dec(p1, 2)}. Pears: {x2} × {y2} = ${dec(p2, 2)}. Total: ${dec(p1 + p2, 2)} dollars.`, `Manzanas: {x1} × {y1} = ${dec(p1, 2)}. Peras: {x2} × {y2} = ${dec(p2, 2)}. Total: ${dec(p1 + p2, 2)} dólares.`],
        h: [["Find the cost of each fruit separately.", "Halla el costo de cada fruta por separado."], ["Cost = amount × price per kg.", "Costo = cantidad × precio por kg."], ["Multiply for apples, multiply for pears, then add.", "Multiplica para las manzanas, multiplica para las peras y luego suma."]],
        meta: { kind: "cost2", x1, y1, x2, y2 },
      });
    },
    change(rng) {
      const x = fac(rng, 1, 12, 59);
      const y = fac(rng, 1, 12, 59);
      const p = x * y;
      const X = Math.ceil((p / 100 + 1) / 5) * 5;
      const V = { who: rng.pick(NAMES), x: dt(x, 1), y: dec(y * 10, 2), X: dec(X * 100, 2) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["{who} buys {x} lb of cheese at ${y} per lb and pays with ${X}. How many dollars of change should {who} get?", "{who} compra {x} lb de queso a ${y} la lb y paga con ${X}. ¿Cuántos dólares de cambio debe recibir {who}?"],
        a: pv(X * 100 - p, 2),
        w: [[pv(p, 2), "stopped-after-first-product"], [term((X * 100 - p) / 10), "decimal-place-value/large"], [term((X * 100 + p) / 100), "op-added-instead-of-subtracted"]],
        x: [`Cost: {x} × {y} = ${dec(p, 2)}. Change: {X} − ${dec(p, 2)} = ${dec(X * 100 - p, 2)}.`, `Costo: {x} × {y} = ${dec(p, 2)}. Cambio: {X} − ${dec(p, 2)} = ${dec(X * 100 - p, 2)}.`],
        h: [["First find what the cheese costs.", "Primero halla cuánto cuesta el queso."], ["Cost = pounds × price per pound.", "Costo = libras × precio por libra."], ["Subtract the cost from the money paid.", "Resta el costo del dinero pagado."]],
        meta: { kind: "change", x, y, X },
      });
    },
  };

  G.register("decimalMultiply", {
    title: "Multiply decimals",
    titleEs: "Multiplicar decimales",
    levels: 4,
    make(rng, level) {
      return mulTypes[rng.pick(MM_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      switch (m.kind) {
        case "prod": {
          // repeated addition of the second factor, then the point from the decimal places
          let sum = 0;
          for (let i = 0; i < m.A; i++) sum += m.B;
          return item.k === "mc"
            ? agree(item, dt(sum, m.dpa + m.dpb))
            : agree(item, sum / 10 ** (m.dpa + m.dpb));
        }
        case "reasonable": {
          const ex = (m.a * m.b) / 100;
          const E = Number(item.c[item.a].replace(/[^\d.]/g, ""));
          const near = item.c
            .map((/** @type {string} */ c) => Number(c.replace(/[^\d.]/g, "")))
            .filter((/** @type {number} */ v) => Math.abs(v - ex) / ex < 0.3);
          return near.length === 1 && near[0] === E ? true : `estimate ${E} vs exact ${ex}`;
        }
        case "lessThan": {
          const less = item.c.map((/** @type {string} */ c) => Number(c.split(" × ")[1]) < 1);
          return less.filter(Boolean).length === 1 && less[item.a]
            ? true
            : "not exactly one factor below 1";
        }
        case "cost2":
          return agree(item, (m.x1 * m.y1 + m.x2 * m.y2) / 100);
        case "change":
          return agree(item, (m.X * 100 - m.x * m.y) / 100);
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ============================================ expressions: evalStr ============================================== */
  const SUPMAP = /** @type {Record<string, number>} */ ({
    "⁰": 0,
    "¹": 1,
    "²": 2,
    "³": 3,
    "⁴": 4,
    "⁵": 5,
    "⁶": 6,
    "⁷": 7,
    "⁸": 8,
    "⁹": 9,
  });
  /**
   * Precedence-climbing evaluator for the printed expressions (numbers, + − × ÷, parentheses, superscript powers).
   * opts: ltr = every operator ties, left to right; rev = + − bind tighter than × ÷; noParens = parentheses removed;
   * powMul = a power means base × exponent. These switches reproduce the classic wrong orders for the distractors.
   */
  const evalStr = (/** @type {string} */ str, /** @type {any} */ opts = {}) => {
    const src = opts.noParens ? str.replace(/[()]/g, "") : str;
    if (opts.sumAll) {
      /** @type {string[]} */
      const nums = str.match(/\d+(?:\.\d+)?/g) || [];
      return nums.reduce((s, d) => s + Number(d), 0);
    }
    const tok = src.match(/\d+(?:\.\d+)?|[+−×÷()]|[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g) || [];
    let i = 0;
    const prec = (/** @type {string} */ op) =>
      opts.ltr ? 1 : opts.rev ? ("+−".includes(op) ? 2 : 1) : "+−".includes(op) ? 1 : 2;
    const apply = (/** @type {string} */ op, /** @type {number} */ a, /** @type {number} */ b) =>
      op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b;
    const atom = () => {
      let v;
      if (tok[i] === "(") {
        i++;
        v = expr(0);
        i++;
      } else v = Number(tok[i++]);
      if (tok[i] && SUPMAP[tok[i][0]] !== undefined) {
        const e = Number([...tok[i++]].map((c) => SUPMAP[c]).join(""));
        v = opts.powMul ? v * e : v ** e;
      }
      return v;
    };
    const expr = (/** @type {number} */ min) => {
      let left = atom();
      while (i < tok.length && "+−×÷".includes(tok[i]) && prec(tok[i]) >= Math.max(min, 1)) {
        const op = tok[i++];
        const right = expr(prec(op) + 1);
        left = apply(op, left, right);
      }
      return left;
    };
    if (opts.partial) {
      const first = atom();
      if (i >= tok.length) return first;
      const op = tok[i++];
      return apply(op, first, atom());
    }
    return expr(0);
  };

  /* ================================================= orderOfOps =================================================== */
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "order-of-operations-left-to-right": ["It looks like the operations were done strictly left to right. Powers come first, then multiplying and dividing, then adding and subtracting.", "Parece que las operaciones se hicieron estrictamente de izquierda a derecha. Primero las potencias, luego multiplicar y dividir, y al final sumar y restar."],
    "parentheses-ignored": ["It looks like the parentheses were skipped. Work inside the parentheses first.", "Parece que se saltaron los paréntesis. Primero se trabaja lo que está dentro de los paréntesis."],
    "exponent-as-multiplication": ["It looks like a power was read as base × exponent. An exponent says how many times the base is a factor.", "Parece que una potencia se leyó como base × exponente. El exponente dice cuántas veces la base es factor."],
    "add-before-multiply": ["It looks like adding or subtracting happened before multiplying or dividing. Multiply and divide first.", "Parece que se sumó o restó antes de multiplicar o dividir. Primero se multiplica y se divide."],
    "parens-around-what-is-already-first": ["Those parentheses surround something that was already done first, so they change nothing. The value is still {cur}.", "Esos paréntesis rodean algo que ya se hacía primero, así que no cambian nada. El valor sigue siendo {cur}."],
    "added-everything": ["That adds all the numbers. Each price goes with its own amount, so multiply each pair first.", "Eso suma todos los números. Cada precio va con su propia cantidad, así que multiplica cada pareja primero."],
    "missing-grouping": ["The multiplier applies to the whole group, so the group needs parentheses.", "El multiplicador se aplica a todo el grupo, así que el grupo necesita paréntesis."],
    "stopped-after-first-operation": ["It looks like the work stopped after the first operation. Keep going until every operation is done.", "Parece que el trabajo se detuvo después de la primera operación. Sigue hasta hacer todas las operaciones."],
    "treated-all-operations-alike": ["It looks like every number was added. Each operation in the expression does its own job, in the agreed order.", "Parece que se sumaron todos los números. Cada operación de la expresión cumple su función, en el orden acordado."],
    "forgot-to-undo-the-power": ["You found the value of the power, but the question asks for the base that was squared or cubed.", "Hallaste el valor de la potencia, pero la pregunta pide la base que se elevó."],
  });
  const BUGS = [
    [
      "ltr",
      { ltr: true },
      "order-of-operations-left-to-right",
      "Worked strictly left to right",
      "Trabajó estrictamente de izquierda a derecha",
    ],
    [
      "noParens",
      { noParens: true },
      "parentheses-ignored",
      "Ignored the parentheses",
      "Ignoró los paréntesis",
    ],
    [
      "powMul",
      { powMul: true },
      "exponent-as-multiplication",
      "Multiplied the base by the exponent",
      "Multiplicó la base por el exponente",
    ],
    [
      "rev",
      { rev: true },
      "add-before-multiply",
      "Added or subtracted before multiplying or dividing",
      "Sumó o restó antes de multiplicar o dividir",
    ],
    [
      "partial",
      { partial: true },
      "stopped-after-first-operation",
      "Stopped after the first operation",
      "Se detuvo después de la primera operación",
    ],
    [
      "sumAll",
      { sumAll: true },
      "treated-all-operations-alike",
      "Added all the numbers",
      "Sumó todos los números",
    ],
  ];
  // template: [printed, js function, minLevel]; letters a-d are random 2-9, e squares/cubes use sup
  // prettier-ignore
  // biome-ignore format: one template per line
  const OPS = [
    ["{a} + {b} × {c}", (a, b, c) => a + b * c, 1], ["{a} − {b} × {c}", (a, b, c) => a - b * c, 1], ["{a} × {b} + {c}", (a, b, c) => a * b + c, 1],
    ["{a} × {b} − {c}", (a, b, c) => a * b - c, 1], ["{a} + {b} ÷ {c}", (a, b, c) => a + b / c, 1], ["{a} − {b} ÷ {c}", (a, b, c) => a - b / c, 1],
    ["{a} + {b}²", (a, b) => a + b ** 2, 1], ["{a}² − {b}", (a, b) => a ** 2 - b, 1], ["{a} × {b}² + {c}", (a, b, c) => a * b ** 2 + c, 1],
    ["({a} + {b}) × {c}", (a, b, c) => (a + b) * c, 2], ["({a} − {b}) × {c} + {d}", (a, b, c, d) => (a - b) * c + d, 2], ["{a} × ({b} + {c})", (a, b, c) => a * (b + c), 2],
    ["{a}² + {b} × {c}", (a, b, c) => a ** 2 + b * c, 2], ["{a} × {b}² − {c}", (a, b, c) => a * b ** 2 - c, 2], ["({a} + {b})²", (a, b) => (a + b) ** 2, 2],
    ["{a} + ({b} + {c}) ÷ {d}", (a, b, c, d) => a + (b + c) / d, 2], ["{d} − ({a} + {b}) ÷ {c}", (a, b, c, d) => d - (a + b) / c, 2], ["({a} + {b}) ÷ {c} + {d}²", (a, b, c, d) => (a + b) / c + d ** 2, 2],
    ["{a} + {b} × ({c} − {d})²", (a, b, c, d) => a + b * (c - d) ** 2, 3], ["({a} + {b})² − {c} × {d}", (a, b, c, d) => (a + b) ** 2 - c * d, 3], ["{a} × {b}² ÷ {c} + {d}", (a, b, c, d) => (a * b ** 2) / c + d, 3],
    ["{a}² − ({b} + {c}) × {d}", (a, b, c, d) => a ** 2 - (b + c) * d, 3], ["{a} × ({b} + {c}²) − {d}", (a, b, c, d) => a * (b + c ** 2) - d, 3], ["({a} − {b})³ + {c} × {d}", (a, b, c, d) => (a - b) ** 3 + c * d, 3],
  ];
  /** print a template: digits for {a}.. and exponents already in the template as superscripts */
  const fillOps = (/** @type {string} */ t, /** @type {number[]} */ v) =>
    t.replace(/\{([a-d])\}/g, (_m, k) => String(v[k.charCodeAt(0) - 97]));
  /** a valid expression: integer steps, positive value, and at least 3 different wrong values from the classic bugs */
  const mkExpr = (
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {number} */ needWrong = 3,
    /** @type {any[]} */ bugSet = BUGS,
  ) =>
    draw(
      () => {
        const pool = OPS.filter((o) =>
          level >= 3 ? o[2] === 3 : level === 2 ? o[2] === 2 : o[2] === 1,
        );
        const [t, fn] = rng.pick(pool);
        const v = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)];
        const s = fillOps(t, v);
        const val = fn(...v);
        const wrong = bugSet
          .map((b) => [b, evalStr(s, b[1])])
          .filter(([, w]) => Number.isInteger(w) && w >= 0 && w !== val);
        const neg =
          (t.includes("({a} − {b}") && v[0] <= v[1]) || (t.includes("({c} − {d})") && v[2] <= v[3]);
        return {
          s,
          val,
          neg,
          wrong: wrong.filter((w, i, arr) => arr.findIndex((x) => x[1] === w[1]) === i),
        };
      },
      (e) =>
        !e.neg &&
        Number.isInteger(e.val) &&
        e.val >= 0 &&
        e.val <= 999 &&
        Math.abs(evalStr(e.s) - e.val) < 1e-9 &&
        e.wrong.length >= needWrong,
    );
  /** the wrong expressions of a "write the expression" item must all differ in value from the right one */
  const n_ok = (/** @type {string} */ form, /** @type {number[]} */ [n, p, m, s]) => {
    const want = form === "pair" ? n * p + m * s : form === "each" ? n * (p + s) : 0;
    const wrong =
      form === "pair"
        ? [(n + m) * (p + s), n + p + m + s, n * p + m + s, n * (p + m) * s]
        : form === "each"
          ? [n * p + s, n + p + s, n * p * s, (n + p) * s]
          : [];
    return wrong.every((w) => w !== want);
  };
  const OPS_TYPES = {
    1: ["eval", "eval"],
    2: ["eval", "eval", "evalNum"],
    3: ["evalNum", "parens", "write"],
    4: ["diagnose", "missing", "diagnose", "write"],
  };
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const opTypes = {
    eval(rng, level) {
      const e = mkExpr(rng, level);
      const V = { s: e.s, v: e.val };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Evaluate {s}.", "Evalúa {s}."], a: String(e.val),
        w: e.wrong.map(([b, w]) => [String(w), b[2]]),
        x: [`Follow the order of operations: grouping symbols, then powers, then × and ÷, then + and −. {s} = ${e.val}.`, `Sigue el orden de las operaciones: símbolos de agrupación, luego potencias, luego × y ÷, y al final + y −. {s} = ${e.val}.`],
        h: [["Grouping symbols first, then powers, then multiply and divide, then add and subtract.", "Primero los símbolos de agrupación, luego las potencias, luego multiplicar y dividir, y al final sumar y restar."], ["Circle the operation that must be done first.", "Encierra en un círculo la operación que debe hacerse primero."], ["Do that one, rewrite the expression, and repeat.", "Hazla, reescribe la expresión y repite."]],
        meta: { kind: "eval", s: e.s },
      });
    },
    evalNum(rng, level) {
      const e = mkExpr(rng, level);
      const V = { s: e.s };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Evaluate {s}.", "Evalúa {s}."], a: e.val,
        w: e.wrong.map(([b, w]) => [w, b[2]]),
        x: [`Follow the order of operations. {s} = ${e.val}.`, `Sigue el orden de las operaciones. {s} = ${e.val}.`],
        h: [["Grouping symbols first, then powers, then multiply and divide, then add and subtract.", "Primero los símbolos de agrupación, luego las potencias, luego multiplicar y dividir, y al final sumar y restar."], ["Circle the operation that must be done first.", "Encierra en un círculo la operación que debe hacerse primero."], ["Do that one, rewrite the expression, and repeat.", "Hazla, reescribe la expresión y repite."]],
        meta: { kind: "eval", s: e.s },
      });
    },
    parens(rng) {
      const { a, b, c, form } = draw(
        () => ({ a: rng.int(2, 9), b: rng.int(2, 9), c: rng.int(2, 9), form: rng.pick([0, 1]) }),
        (v) =>
          v.form ? v.a * (v.b + v.c) !== v.a * v.b + v.c : (v.a + v.b) * v.c !== v.a + v.b * v.c,
      );
      const base = form ? `${a} × ${b} + ${c}` : `${a} + ${b} × ${c}`;
      const cur = form ? a * b + c : a + b * c;
      const T = form ? a * (b + c) : (a + b) * c;
      const right = form ? `${a} × (${b} + ${c})` : `(${a} + ${b}) × ${c}`;
      const wr = form
        ? [`(${a} × ${b}) + ${c}`, `(${a} × ${b} + ${c})`, `${a} × ${b} + (${c})`]
        : [`${a} + (${b} × ${c})`, `(${a} + ${b} × ${c})`, `${a} + ${b} × (${c})`];
      const V = { base, T, cur };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Where can you put parentheses so that {base} = {T}?", "¿Dónde puedes poner paréntesis para que {base} = {T}?"], a: right,
        w: wr.map((x) => [x, "parens-around-what-is-already-first"]),
        x: [`With ${right} the addition happens first, and the value is {T}. The other placements change nothing: the value stays {cur}.`, `Con ${right} la suma se hace primero y el valor es {T}. Las otras posiciones no cambian nada: el valor sigue siendo {cur}.`],
        h: [["Parentheses make the operation inside happen first.", "Los paréntesis hacen que la operación de adentro se haga primero."], ["Without parentheses, multiplication comes before addition. Which operation must change places?", "Sin paréntesis, la multiplicación va antes de la suma. ¿Cuál operación debe cambiar de lugar?"], ["Group the two numbers that are added.", "Agrupa los dos números que se suman."]],
        meta: { kind: "parens", base, T, cur },
      });
    },
    write(rng) {
      const form = rng.pick(["pair", "each", "square"]);
      const who = rng.pick(NAMES);
      const [n, p, m, s] = draw(
        () => [rng.int(2, 6), rng.int(3, 9), rng.int(2, 6), rng.int(2, 5)],
        (v) => new Set(v).size === 4 && n_ok(form, v),
      );
      if (form === "pair") {
        const V = { who, n, p, m, s };
        // prettier-ignore
        // biome-ignore format: bilingual spec
        return mcB(rng, V, {
          q: ["{who} buys {n} tickets at ${p} each and {m} snacks at ${s} each. Which expression gives the total cost?", "{who} compra {n} boletos a ${p} cada uno y {m} bocadillos a ${s} cada uno. ¿Cuál expresión da el costo total?"],
          a: "{n} × {p} + {m} × {s}",
          w: [["({n} + {m}) × ({p} + {s})", "added-everything"], ["{n} + {p} + {m} + {s}", "added-everything"], ["{n} × {p} + {m} + {s}", "missing-grouping"], ["{n} × ({p} + {m}) × {s}", "missing-grouping"]],
          x: ["Each kind of item costs amount × price: {n} × {p} and {m} × {s}. The total adds those two costs.", "Cada tipo de artículo cuesta cantidad × precio: {n} × {p} y {m} × {s}. El total suma esos dos costos."],
          h: [["Find the cost of the tickets by themselves.", "Halla el costo de los boletos por separado."], ["Find the cost of the snacks by themselves.", "Halla el costo de los bocadillos por separado."], ["Combine the two costs.", "Combina los dos costos."]],
          meta: { kind: "write", right: `${n} × ${p} + ${m} × ${s}`, want: n * p + m * s, form },
        });
      }
      if (form === "each") {
        const V = { who, n, p, s };
        // prettier-ignore
        // biome-ignore format: bilingual spec
        return mcB(rng, V, {
          q: ["{n} friends each pay for a ${p} ticket and a ${s} snack. Which expression gives the total they pay?", "{n} amigos pagan cada uno un boleto de ${p} y un bocadillo de ${s}. ¿Cuál expresión da el total que pagan?"],
          a: "{n} × ({p} + {s})",
          w: [["{n} × {p} + {s}", "missing-grouping"], ["{n} + {p} + {s}", "added-everything"], ["{n} × {p} × {s}", "added-everything"], ["({n} + {p}) × {s}", "missing-grouping"]],
          x: ["Each friend pays {p} + {s}, and there are {n} friends, so the group is multiplied by {n}: {n} × ({p} + {s}).", "Cada amigo paga {p} + {s} y son {n} amigos, así que el grupo se multiplica por {n}: {n} × ({p} + {s})."],
          h: [["What does ONE friend pay?", "¿Cuánto paga UN amigo?"], ["Write that amount as a sum.", "Escribe esa cantidad como una suma."], ["Every friend pays the same, so multiply that sum.", "Todos pagan lo mismo, así que multiplica esa suma."]],
          meta: { kind: "write", right: `${n} × (${p} + ${s})`, want: n * (p + s), form },
        });
      }
      const { k, sq } = draw(
        () => ({ k: rng.int(2, 9), sq: rng.int(3, 9) }),
        (v) =>
          [v.sq * 2 + v.k, (v.sq + v.k) ** 2, v.sq + v.sq + v.k, v.sq ** 2 * v.k].every(
            (w) => w !== v.sq ** 2 + v.k,
          ),
      );
      const V = { sq, k };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["A garden has {sq} rows with {sq} plants in each row, plus {k} extra plants. Which expression gives the number of plants?", "Un jardín tiene {sq} filas con {sq} plantas en cada fila, más {k} plantas extra. ¿Cuál expresión da el número de plantas?"],
        a: "{sq}² + {k}",
        w: [["{sq} × 2 + {k}", "exponent-as-multiplication"], ["({sq} + {k})²", "missing-grouping"], ["{sq} + {sq} + {k}", "added-everything"], ["{sq}² × {k}", "added-everything"]],
        x: ["{sq} rows of {sq} plants is {sq} × {sq} = {sq}². The extra {k} plants are added: {sq}² + {k}.", "{sq} filas de {sq} plantas es {sq} × {sq} = {sq}². Se suman las {k} plantas extra: {sq}² + {k}."],
        h: [["How many plants are in the rows alone?", "¿Cuántas plantas hay solo en las filas?"], ["{sq} groups of {sq} is a power.", "{sq} grupos de {sq} es una potencia."], ["Add the extra plants after the power.", "Suma las plantas extra después de la potencia."]],
        meta: { kind: "write", right: `${sq}² + ${k}`, want: sq * sq + k, form },
      });
    },
    missing(rng) {
      const x = rng.int(2, 6);
      const [a, b] = [rng.int(2, 9), rng.int(2, 5)];
      const form = rng.pick([0, 1]);
      const T = form ? a * x ** 2 - b : a + b * x ** 2;
      const s = form ? `${a} × □² − ${b} = ${T}` : `${a} + ${b} × □² = ${T}`;
      const V = { s };
      const step = form ? (T + b) / a : (T - a) / b;
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["What number goes in the box? {s}", "¿Qué número va en el recuadro? {s}"], a: x,
        w: [[step, "forgot-to-undo-the-power"], [T - (form ? -b : a), "forgot-to-undo-the-power"], [term(step / 2), "exponent-as-multiplication"]],
        x: [`Work backward. ${form ? `${T} + ${b} = ${T + b}, then ${T + b} ÷ ${a} = ${step}` : `${T} − ${a} = ${T - a}, then ${T - a} ÷ ${b} = ${step}`}. The box squared is ${step}, so the box is ${x}.`, `Trabaja hacia atrás. ${form ? `${T} + ${b} = ${T + b}, luego ${T + b} ÷ ${a} = ${step}` : `${T} − ${a} = ${T - a}, luego ${T - a} ÷ ${b} = ${step}`}. El recuadro al cuadrado es ${step}, así que el recuadro es ${x}.`],
        h: [["Undo the operations in reverse order.", "Deshaz las operaciones en orden inverso."], ["First undo the adding or subtracting, then undo the multiplying.", "Primero deshaz la suma o la resta, luego deshaz la multiplicación."], ["You will have a square number. Which number times itself makes it?", "Tendrás un número cuadrado. ¿Qué número por sí mismo lo forma?"]],
        meta: { kind: "missing", form, a, b, T, x },
      });
    },
    diagnose(rng) {
      const bugs4 = BUGS.slice(0, 4);
      const e = draw(
        () => mkExpr(rng, 3, 1, bugs4),
        (x) => x.wrong.some((w) => bugs4.filter((b) => evalStr(x.s, b[1]) === w[1]).length === 1),
      );
      const pick = e.wrong.find(
        (w) => bugs4.filter((b) => evalStr(e.s, b[1]) === w[1]).length === 1,
      );
      const V = { who: rng.pick(NAMES), s: e.s, got: pick[1] };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["{who} evaluated {s} and got {got}. What did {who} most likely do?", "{who} evaluó {s} y obtuvo {got}. ¿Qué hizo {who} probablemente?"],
        a: [pick[0][3], pick[0][4]],
        w: bugs4.filter((b) => b !== pick[0]).map((b) => [[b[3], b[4]], b[2], ["Try that mistake on the expression. It does not give {got}.", "Prueba ese error en la expresión. No da {got}."]]),
        x: ["Doing that gives {got}. The correct value of {s} is " + e.val + ".", "Hacer eso da {got}. El valor correcto de {s} es " + e.val + "."],
        h: [["Try each possible mistake on the expression and see which one gives {got}.", "Prueba cada posible error en la expresión y mira cuál da {got}."], ["Do the expression strictly left to right. What do you get?", "Haz la expresión estrictamente de izquierda a derecha. ¿Qué obtienes?"], ["Now try skipping the parentheses, then reading each power as base × exponent.", "Ahora prueba saltándote los paréntesis y luego leyendo cada potencia como base × exponente."]],
        meta: { kind: "diagnose", s: e.s, got: pick[1], bug: pick[0][0] },
      });
    },
  };
  G.register("orderOfOps", {
    title: "Order of operations",
    titleEs: "Orden de las operaciones",
    levels: 4,
    make(rng, level) {
      return opTypes[rng.pick(OPS_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      switch (m.kind) {
        case "eval":
          return agree(item, evalStr(m.s));
        case "parens": {
          const vals = item.c.map((/** @type {string} */ c) => evalStr(c));
          return vals.filter((/** @type {number} */ v) => v === m.T).length === 1 &&
            vals[item.a] === m.T &&
            evalStr(m.base) === m.cur
            ? true
            : `parenthesis values ${vals}`;
        }
        case "write": {
          const vals = item.c.map((/** @type {string} */ c) => evalStr(c));
          return vals.filter((/** @type {number} */ v) => v === m.want).length === 1 &&
            vals[item.a] === m.want
            ? true
            : `expression values ${vals} vs ${m.want}`;
        }
        case "missing": {
          const f = (/** @type {number} */ x) => (m.form ? m.a * x * x - m.b : m.a + m.b * x * x);
          let x = 0;
          while (f(x) !== m.T && x < 100) x++;
          return agree(item, x);
        }
        case "diagnose": {
          const bug = BUGS.find((b) => b[0] === m.bug);
          if (!bug || evalStr(m.s, bug[1]) !== m.got) return "bug does not give the stated answer";
          const others = BUGS.slice(0, 4).filter(
            (b) => b[0] !== m.bug && evalStr(m.s, b[1]) === m.got,
          );
          return others.length ? "another bug gives the same answer" : agree(item, bug[3]);
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ================================================ exponentEval ================================================== */
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "exponent-as-multiplication/v": ["That multiplies the base by the exponent. An exponent says how many times the base is a FACTOR: {b}{e} means {fac}.", "Eso multiplica la base por el exponente. El exponente dice cuántas veces la base es FACTOR: {b}{e} significa {fac}."],
    "exponent-added-to-base": ["That adds the base and the exponent. A power is repeated multiplication, not addition.", "Eso suma la base y el exponente. Una potencia es multiplicación repetida, no suma."],
    "power-written-as-digits": ["The base and the exponent are not digits of one number. The small number tells how many times to multiply the base.", "La base y el exponente no son cifras de un solo número. El número pequeño dice cuántas veces se multiplica la base."],
    "one-factor-too-many": ["Count the factors. This uses one more copy of the base than the exponent asks for.", "Cuenta los factores. Esto usa una copia más de la base de las que pide el exponente."],
    "one-factor-too-few": ["Count the factors. This uses one fewer copy of the base than the exponent asks for.", "Cuenta los factores. Esto usa una copia menos de la base de las que pide el exponente."],
    "base-exponent-swapped": ["The base and the exponent are swapped. The base is the number being multiplied; the exponent is the small raised number.", "La base y el exponente están cambiados. La base es el número que se multiplica; el exponente es el número pequeño elevado."],
    "repeated-addition": ["That adds the base to itself. A power multiplies the base by itself.", "Eso suma la base consigo misma. Una potencia multiplica la base por sí misma."],
    "factors-collapsed": ["That is one multiplication of two numbers. A power repeats the SAME factor.", "Eso es una sola multiplicación de dos números. Una potencia repite el MISMO factor."],
    "compared-without-evaluating": ["Evaluate each power before comparing. A bigger base or a bigger exponent does not always win.", "Evalúa cada potencia antes de comparar. Una base mayor o un exponente mayor no siempre gana."],
    "value-for-exponent": ["That is the value of the power. The exponent is the small raised number.", "Ese es el valor de la potencia. El exponente es el número pequeño elevado."],
    "base-for-exponent": ["That is the base, the number being multiplied. The exponent is the small raised number.", "Esa es la base, el número que se multiplica. El exponente es el número pequeño elevado."],
    "counted-one-fewer-time": ["Check how many times the amount grows. Each step multiplies once, and you took one step too few.", "Revisa cuántas veces crece la cantidad. Cada paso multiplica una vez, y diste un paso de menos."],
    "divided-for-exponent": ["Dividing the value by the base only undoes ONE factor. Count how many times you can divide until you reach 1.", "Dividir el valor entre la base solo deshace UN factor. Cuenta cuántas veces puedes dividir hasta llegar a 1."],
    "value-shifted": ["Check the zeros: 10 to a power has as many zeros as the exponent says.", "Revisa los ceros: 10 elevado a una potencia tiene tantos ceros como dice el exponente."],
  });
  const STORIES = [
    // [base, EN, ES] {n} = steps
    [
      2,
      "A pond has 1 lily today. Every day the number of lilies doubles. How many lilies are there after {n} days?",
      "Un estanque tiene hoy 1 lirio. Cada día el número de lirios se duplica. ¿Cuántos lirios hay después de {n} días?",
    ],
    [
      2,
      "A sheet of paper is folded in half {n} times. How many layers thick is the folded paper?",
      "Una hoja de papel se dobla por la mitad {n} veces. ¿Cuántas capas de grosor tiene el papel doblado?",
    ],
    [
      3,
      "A message is sent to 3 people. Each of them sends it to 3 new people, and this repeats. How many people get the message in round {n}?",
      "Un mensaje se envía a 3 personas. Cada una lo envía a 3 personas nuevas, y esto se repite. ¿Cuántas personas reciben el mensaje en la ronda {n}?",
    ],
    [
      2,
      "A tournament has {n} rounds. Half the teams are knocked out each round until 1 team wins. How many teams started?",
      "Un torneo tiene {n} rondas. En cada ronda se elimina la mitad de los equipos hasta que gana 1. ¿Cuántos equipos empezaron?",
    ],
    [
      4,
      "A video is shared so that every viewer shows it to 4 new viewers. How many new viewers are there in round {n}?",
      "Un video se comparte de modo que cada espectador se lo muestra a 4 espectadores nuevos. ¿Cuántos espectadores nuevos hay en la ronda {n}?",
    ],
    [
      5,
      "A rumor starts with 1 student. Every hour each student who knows it tells 4 more, so the number who know it multiplies by 5. How many know it after {n} hours?",
      "Un rumor empieza con 1 estudiante. Cada hora cada estudiante que lo sabe se lo cuenta a 4 más, así que el número que lo sabe se multiplica por 5. ¿Cuántos lo saben después de {n} horas?",
    ],
  ];
  const EX_TYPES = {
    1: ["eval", "toPower", "parts", "eval"],
    2: ["evalNum", "tenPow", "story"],
    3: ["greatest", "asPower", "sum"],
    4: ["missingExp", "missingBase", "storyN"],
  };
  const facStr = (/** @type {number} */ b, /** @type {number} */ e) => Array(e).fill(b).join(" × ");
  const ipow = (/** @type {number} */ b, /** @type {number} */ e) => {
    let r = 1;
    for (let i = 0; i < e; i++) r *= b;
    return r;
  };
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const expTypes = {
    eval(rng) {
      const b = rng.pick([2, 3, 4, 5, 6, 7, 10]);
      const e = rng.pick(b === 10 ? [2, 3] : [2, 3, 3]);
      const V = { b, e: sup(e), fac: facStr(b, e), n: e };
      const v = ipow(b, e);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["What is the value of {b}{e}?", "¿Cuál es el valor de {b}{e}?"], a: cm(v),
        w: [[cm(b * e), "exponent-as-multiplication/v"], [cm(b + e), "exponent-added-to-base"], [cm(Number(`${b}${e}`)), "power-written-as-digits"], [cm(ipow(b, e + 1)), "one-factor-too-many"], [cm(ipow(b, e - 1)), "one-factor-too-few"]],
        x: ["{b}{e} means {fac}. Multiplying gives " + v + ".", "{b}{e} significa {fac}. Al multiplicar se obtiene " + v + "."],
        h: [["The exponent tells how many times the base is used as a factor.", "El exponente dice cuántas veces se usa la base como factor."], ["Write {b}{e} as repeated multiplication.", "Escribe {b}{e} como multiplicación repetida."], ["Multiply two factors at a time.", "Multiplica dos factores a la vez."]],
        meta: { kind: "pow", b, e },
      });
    },
    toPower(rng) {
      const b = rng.int(2, 9);
      const k = rng.pick([2, 3, 4, 5].filter((x) => x !== b));
      const V = { b, fac: facStr(b, k), sp: pw(b, k), k };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which power shows {fac}?", "¿Cuál potencia muestra {fac}?"], a: pw(b, k),
        w: [[pw(k, b), "base-exponent-swapped"], [`${b} × ${k}`, "factors-collapsed"], [Array(k).fill(b).join(" + "), "repeated-addition"], [pw(b, k + 1), "one-factor-too-many"]],
        x: ["{b} is used as a factor {k} times, so the base is {b} and the exponent is {k}: {sp}.", "{b} se usa como factor {k} veces, así que la base es {b} y el exponente es {k}: {sp}."],
        h: [["The base is the factor that repeats.", "La base es el factor que se repite."], ["Count how many times the base appears. That count is the exponent.", "Cuenta cuántas veces aparece la base. Esa cantidad es el exponente."], ["Write the base big, then the count small and raised.", "Escribe la base grande y la cantidad pequeña y elevada."]],
        meta: { kind: "toPower", b, k },
      });
    },
    parts(rng) {
      const b = rng.int(2, 9);
      const e = rng.pick([2, 3, 4, 5].filter((x) => x !== b));
      const ask = rng.pick(["exponent", "base"]);
      const V = { b, e, p: pw(b, e), ask, askEs: ask === "base" ? "base" : "exponente" };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["In {p}, which number is the {ask}?", "En {p}, ¿cuál número es el {askEs}?"], a: String(ask === "base" ? b : e),
        w: [[String(ask === "base" ? e : b), "base-exponent-swapped"], [String(b * e), "exponent-as-multiplication/v"], [String(ipow(b, e)), "value-for-exponent"]].map((w, i) => (i === 2 && ask === "base" ? [w[0], "value-for-exponent"] : w)),
        x: ["In {p}, the base is {b} (the number being multiplied) and the exponent is {e} (how many times).", "En {p}, la base es {b} (el número que se multiplica) y el exponente es {e} (cuántas veces)."],
        h: [["The base is the big number. The exponent is the small raised number.", "La base es el número grande. El exponente es el número pequeño elevado."], ["The exponent sits up and to the right of the base.", "El exponente está arriba y a la derecha de la base."], ["Which number is raised?", "¿Cuál número está elevado?"]],
        meta: { kind: "parts", b, e, ask },
      });
    },
    evalNum(rng) {
      const e = rng.pick([2, 2, 3, 3, 4, 5, 6]);
      const b = rng.int(2, { 2: 20, 3: 10, 4: 6, 5: 4, 6: 3 }[/** @type {2} */ (e)]);
      const words = e <= 3 && rng.chance(0.3);
      const ph = rng.pick([
        ["Evaluate", "Evalúa", "."],
        ["What is the value of", "¿Cuál es el valor de", "?"],
        ["Find the value of", "Halla el valor de", "."],
        ["Calculate", "Calcula", "."],
      ]);
      const V = { b, e: sup(e), fac: facStr(b, e), eN: e };
      const v = ipow(b, e);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numMc(rng, V, {
        q: words ? [`What is {b} ${e === 2 ? "squared" : "cubed"}?`, `¿Cuánto es {b} ${e === 2 ? "al cuadrado" : "al cubo"}?`] : [`${ph[0]} {b}{e}${ph[2]}`, `${ph[1]} {b}{e}${ph[2]}`], a: v,
        w: [[b * e, "exponent-as-multiplication/v"], [ipow(b, e - 1), "one-factor-too-few"], [ipow(b, e + 1), "one-factor-too-many"], [ipow(e, b) < 1e6 ? ipow(e, b) : null, "base-exponent-swapped"]],
        x: ["{b}{e} = {fac} = " + cm(v) + ".", "{b}{e} = {fac} = " + cm(v) + "."],
        h: [["The exponent tells how many times the base is a factor.", "El exponente dice cuántas veces la base es factor."], ["Write {b}{e} as repeated multiplication.", "Escribe {b}{e} como multiplicación repetida."], ["Multiply two factors at a time, left to right.", "Multiplica dos factores a la vez, de izquierda a derecha."]],
        meta: { kind: "pow", b, e },
      });
    },
    tenPow(rng) {
      const n = rng.int(2, 9);
      const form = rng.pick(["value", "zeros", "asPow"]);
      const V = { p: pw(10, n), n };
      if (form === "zeros") {
        // prettier-ignore
        // biome-ignore format: bilingual spec
        return numB(V, {
          q: ["When {p} is written as a whole number, how many zeros does it have?", "Cuando {p} se escribe como número entero, ¿cuántos ceros tiene?"], a: n,
          w: [[n + 1, "value-shifted"], [n - 1, "value-shifted"]],
          x: ["10 to the power {n} is 1 followed by {n} zeros.", "10 elevado a la {n} es 1 seguido de {n} ceros."],
          h: [["Each factor of 10 adds one place.", "Cada factor de 10 agrega un lugar."], ["Write 10, then 10 × 10, then 10 × 10 × 10 and watch the zeros.", "Escribe 10, luego 10 × 10, luego 10 × 10 × 10 y observa los ceros."], ["Compare the exponent with the number of zeros you see.", "Compara el exponente con el número de ceros que ves."]],
          meta: { kind: "zeros", n },
        });
      }
      if (form === "asPow") {
        // prettier-ignore
        // biome-ignore format: bilingual spec
        return numB({ ...V, v: cm(ipow(10, n)) }, {
          q: ["{v} can be written as 10 to a power. What is the exponent?", "{v} se puede escribir como 10 elevado a una potencia. ¿Cuál es el exponente?"], a: n,
          w: [[n + 1, "value-shifted"], [n - 1, "value-shifted"], [ipow(10, n), "value-for-exponent"]],
          x: ["{v} is 1 followed by {n} zeros, so {v} = {p}.", "{v} es 1 seguido de {n} ceros, así que {v} = {p}."],
          h: [["Powers of 10 are 1 followed by zeros.", "Las potencias de 10 son un 1 seguido de ceros."], ["Count the zeros in {v}.", "Cuenta los ceros de {v}."], ["The number of zeros is the exponent.", "El número de ceros es el exponente."]],
          meta: { kind: "zeros", n },
        });
      }
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Write {p} as a whole number.", "Escribe {p} como número entero."], a: ipow(10, n),
        w: [[10 * n, "exponent-as-multiplication/v", ["That is 10 × {n}. A power of 10 multiplies 10 by itself {n} times: 1 followed by {n} zeros.", "Eso es 10 × {n}. Una potencia de 10 multiplica 10 por sí mismo {n} veces: un 1 seguido de {n} ceros."]], [ipow(10, n - 1), "value-shifted"], [ipow(10, n + 1), "value-shifted"]],
        x: ["{p} = 1 followed by {n} zeros = " + cm(ipow(10, n)) + ".", "{p} = 1 seguido de {n} ceros = " + cm(ipow(10, n)) + "."],
        h: [["Powers of 10 follow a pattern: 10¹ = 10, 10² = 100.", "Las potencias de 10 siguen un patrón: 10¹ = 10, 10² = 100."], ["The exponent is the number of zeros after the 1.", "El exponente es el número de ceros después del 1."], ["Write a 1 and then add the zeros.", "Escribe un 1 y luego agrega los ceros."]],
        meta: { kind: "pow", b: 10, e: n },
      });
    },
    story(rng) {
      const st = rng.pick(STORIES);
      const b = st[0];
      const n = rng.int(3, b === 2 ? 8 : b === 3 ? 5 : 4);
      const V = { n, b, bn: pw(b, n) };
      const v = ipow(b, n);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numMc(rng, V, {
        q: [st[1], st[2]], a: v,
        w: [[b * n, "exponent-as-multiplication/v", ["That is {b} × {n}. The amount is multiplied by {b} each time, so {b} is used as a factor {n} times.", "Eso es {b} × {n}. La cantidad se multiplica por {b} cada vez, así que {b} se usa como factor {n} veces."]], [ipow(b, n - 1), "counted-one-fewer-time"], [ipow(b, n + 1), "one-factor-too-many"]],
        x: ["Each step multiplies by {b}, and there are {n} steps: {bn} = " + cm(v) + ".", "Cada paso multiplica por {b}, y hay {n} pasos: {bn} = " + cm(v) + "."],
        h: [["Find what the amount is multiplied by each time.", "Halla por cuánto se multiplica la cantidad cada vez."], ["Repeated multiplication by the same number is a power.", "La multiplicación repetida por el mismo número es una potencia."], ["Write the power with that base and the number of steps.", "Escribe la potencia con esa base y el número de pasos."]],
        meta: { kind: "pow", b, e: n },
      });
    },
    greatest(rng) {
      const set = draw(
        () => {
          const picked = rng
            .shuffle([2, 3, 4, 5, 6])
            .slice(0, 4)
            .map((b) => [b, rng.int(2, 5)]);
          return picked;
        },
        (s) => {
          const vals = s.map(([b, e]) => ipow(b, e));
          const top = Math.max(...vals);
          const i = vals.indexOf(top);
          return (
            new Set(vals).size === 4 &&
            top < 5000 &&
            s[i][0] !== Math.max(...s.map((x) => x[0])) &&
            s[i][1] !== Math.max(...s.map((x) => x[1])) &&
            new Set(s.map((x) => x[1])).size >= 3
          );
        },
      );
      const vals = set.map(([b, e]) => ipow(b, e));
      const best = vals.indexOf(Math.max(...vals));
      const maxB = Math.max(...set.map((x) => x[0]));
      const maxE = Math.max(...set.map((x) => x[1]));
      const list = set.map(([b, e], i) => `${pw(b, e)} = ${cm(vals[i])}`).join(", ");
      const V = { list };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which power has the greatest value?", "¿Cuál potencia tiene el mayor valor?"], a: pw(set[best][0], set[best][1]),
        w: set.map(([b, e], i) => [pw(b, e), "compared-without-evaluating", i === best ? null : b === maxB ? ["The base {b} is the biggest here, but a bigger base does not always win. Evaluate this power and compare.".replace("{b}", String(b)), "La base " + b + " es la mayor aquí, pero una base mayor no siempre gana. Evalúa esta potencia y compara."] : e === maxE ? ["This power has the biggest exponent, but a bigger exponent does not always win. Evaluate it and compare.", "Esta potencia tiene el mayor exponente, pero un exponente mayor no siempre gana. Evalúala y compara."] : undefined]).filter((_, i) => i !== best).map((w) => (w[2] ? w : [w[0], w[1]])),
        x: ["Evaluate each power: {list}. The greatest is " + cm(vals[best]) + ".", "Evalúa cada potencia: {list}. La mayor es " + cm(vals[best]) + "."],
        h: [["Do not guess from the base or the exponent alone.", "No adivines solo por la base o el exponente."], ["Write each power as repeated multiplication and find its value.", "Escribe cada potencia como multiplicación repetida y halla su valor."], ["Compare the four values.", "Compara los cuatro valores."]],
        meta: { kind: "greatest", set },
      });
    },
    asPower(rng) {
      const b = rng.pick([2, 3, 4, 5, 10]);
      const e = rng.int(3, b === 10 ? 5 : b === 2 ? 7 : 4);
      const V = { b, v: cm(ipow(b, e)) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which power of {b} equals {v}?", "¿Cuál potencia de {b} es igual a {v}?"], a: pw(b, e),
        w: [[pw(b, e + 1), "one-factor-too-many"], [pw(b, e - 1), "one-factor-too-few"], [pw(e, b), "base-exponent-swapped"], [pw(b, e + 2), "one-factor-too-many"]],
        x: ["{b} × {b} × ... multiplied until you reach {v}: " + facStr(b, e) + " = {v}, so it is " + pw(b, e) + ".", "{b} × {b} × ... multiplicado hasta llegar a {v}: " + facStr(b, e) + " = {v}, así que es " + pw(b, e) + "."],
        h: [["Keep multiplying by {b} and count the factors.", "Sigue multiplicando por {b} y cuenta los factores."], ["Stop when the product reaches {v}.", "Detente cuando el producto llegue a {v}."], ["The number of factors is the exponent.", "El número de factores es el exponente."]],
        meta: { kind: "asPower", b, e },
      });
    },
    sum(rng) {
      const [a, m, b, n] = draw(
        () => [rng.int(2, 6), rng.int(2, 4), rng.int(2, 6), rng.int(2, 3)],
        (v) => v[0] !== v[2] && ipow(v[0], v[1]) !== ipow(v[2], v[3]),
      );
      const V = { s: `${pw(a, m)} + ${pw(b, n)}` };
      const v = ipow(a, m) + ipow(b, n);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Evaluate {s}.", "Evalúa {s}."], a: v,
        w: [[a * m + b * n, "exponent-as-multiplication/v", ["That multiplies each base by its exponent. Each power means repeated multiplication of its base.", "Eso multiplica cada base por su exponente. Cada potencia significa multiplicación repetida de su base."]], [ipow(a, m) + b, "forgot-second-power", ["The second power was not evaluated. Both powers need their own value before you add.", "No se evaluó la segunda potencia. Las dos potencias necesitan su valor antes de sumar."]], [ipow(a + b, m + n), "added-bases-and-exponents", ["Powers with different bases cannot be combined by adding bases and exponents. Evaluate each power, then add.", "Las potencias con bases distintas no se combinan sumando bases y exponentes. Evalúa cada potencia y luego suma."]]],
        x: [`${pw(a, m)} = ${ipow(a, m)} and ${pw(b, n)} = ${ipow(b, n)}, so the sum is ${v}.`, `${pw(a, m)} = ${ipow(a, m)} y ${pw(b, n)} = ${ipow(b, n)}, así que la suma es ${v}.`],
        h: [["Powers come before adding.", "Las potencias van antes de sumar."], ["Find the value of each power by itself.", "Halla el valor de cada potencia por separado."], ["Add the two values.", "Suma los dos valores."]],
        meta: { kind: "sum", a, m, b, n },
      });
    },
    missingExp(rng) {
      const b = rng.pick([2, 3, 4, 5, 6, 7, 10]);
      const e = draw(
        () => rng.int(3, b === 10 ? 6 : b === 2 ? 10 : b <= 4 ? 5 : 4),
        (x) => x !== b,
      );
      const V = { b, v: cm(ipow(b, e)) };
      const ph = rng.pick([
        ["What exponent makes this true?", "¿Qué exponente hace verdadera esta igualdad?"],
        ["Find the missing exponent:", "Halla el exponente que falta:"],
        ["Solve for the exponent:", "Resuelve para el exponente:"],
      ]);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numMc(rng, V, {
        q: [ph[0] + " {b} to the power ? = {v}", ph[1] + " {b} elevado a la potencia ? = {v}"], a: e,
        w: [[ipow(b, e) / b, "divided-for-exponent"], [b, "base-for-exponent"], [e + 1, "one-factor-too-many"], [e - 1, "one-factor-too-few"]],
        x: ["Multiply {b} by itself: " + facStr(b, e) + " = {v}. That is " + e + " factors, so the exponent is " + e + ".", "Multiplica {b} por sí mismo: " + facStr(b, e) + " = {v}. Son " + e + " factores, así que el exponente es " + e + "."],
        h: [["The exponent is the number of times {b} is a factor.", "El exponente es el número de veces que {b} es factor."], ["Multiply {b} × {b}, then × {b} again, and keep going.", "Multiplica {b} × {b}, luego × {b} otra vez, y sigue."], ["Count the factors when you reach {v}.", "Cuenta los factores cuando llegues a {v}."]],
        meta: { kind: "missingExp", b, e },
      });
    },
    missingBase(rng) {
      const e = rng.pick([2, 2, 3, 3, 4, 5]);
      const b = draw(
        () =>
          e === 2
            ? rng.int(3, 20)
            : e === 3
              ? rng.int(2, 10)
              : e === 4
                ? rng.int(2, 6)
                : rng.int(2, 4),
        (x) => x !== e,
      );
      const ph = rng.pick([
        ["What base makes this true?", "¿Qué base hace verdadera esta igualdad?"],
        ["Find the missing base:", "Halla la base que falta:"],
        ["Solve for the base:", "Resuelve para la base:"],
      ]);
      const V = { e, v: cm(ipow(b, e)), eS: sup(e) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numMc(rng, V, {
        q: [ph[0] + " ?{eS} = {v}", ph[1] + " ?{eS} = {v}"], a: b,
        w: [[term(ipow(b, e) / e), "divided-for-exponent", ["Dividing the value by the exponent does not undo a power. Ask: what number multiplied by itself {e} times makes the value?", "Dividir el valor entre el exponente no deshace una potencia. Pregunta: ¿qué número multiplicado por sí mismo {e} veces da el valor?"]], [e, "base-for-exponent"], [b + 1, "one-factor-too-many", ["Test it: use that number as a factor {e} times and compare with {v}.", "Pruébalo: usa ese número como factor {e} veces y compara con {v}."]], [b - 1, "one-factor-too-few", ["Test it: use that number as a factor {e} times and compare with {v}.", "Pruébalo: usa ese número como factor {e} veces y compara con {v}."]]],
        x: ["Try bases: " + b + " used " + e + " times is " + facStr(b, e) + " = {v}. The base is " + b + ".", "Prueba bases: " + b + " usado " + e + " veces es " + facStr(b, e) + " = {v}. La base es " + b + "."],
        h: [["Ask: what number times itself {e} times gives {v}?", "Pregunta: ¿qué número multiplicado por sí mismo {e} veces da {v}?"], ["Use the ones digit of {v} to narrow the choices.", "Usa la cifra de las unidades de {v} para reducir las opciones."], ["Test a base by multiplying it out.", "Prueba una base multiplicándola."]],
        meta: { kind: "missingBase", b, e },
      });
    },
    storyN(rng) {
      const st = rng.pick(STORIES.filter((s) => s[0] === 2 || s[0] === 3));
      const b = st[0];
      const n = draw(
        () => rng.int(3, b === 2 ? 9 : 5),
        (x) => x !== b,
      );
      const nm = ["folds", "days", "rounds"][
        st[1].includes("folded") ? 0 : st[1].includes("days") ? 1 : 2
      ];
      const V = { b, n, v: cm(ipow(b, n)) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: rng.pick([[`The amount grows by a factor of {b} each step. After some steps it is {v}. How many steps were there? (Start from 1.)`, `La cantidad crece por un factor de {b} en cada paso. Después de algunos pasos es {v}. ¿Cuántos pasos hubo? (Empieza en 1.)`], [`Starting from 1, the amount is multiplied by {b} again and again until it reaches {v}. How many times was it multiplied?`, `Desde 1, la cantidad se multiplica por {b} una y otra vez hasta llegar a {v}. ¿Cuántas veces se multiplicó?`], [`A number starts at 1 and is multiplied by {b} each round. It reaches {v} after how many rounds?`, `Un número empieza en 1 y se multiplica por {b} en cada ronda. ¿Después de cuántas rondas llega a {v}?`]]), a: n,
        w: [[ipow(b, n) / b, "divided-for-exponent"], [n + 1, "one-factor-too-many"], [n - 1, "counted-one-fewer-time"]],
        x: ["Keep multiplying 1 by {b}: " + facStr(b, n) + " = {v}. That took {n} steps.", "Sigue multiplicando 1 por {b}: " + facStr(b, n) + " = {v}. Eso tomó {n} pasos."],
        h: [["Each step multiplies by {b}. Start at 1.", "Cada paso multiplica por {b}. Empieza en 1."], ["Make a list: 1, then 1 × {b}, then times {b} again.", "Haz una lista: 1, luego 1 × {b}, luego otra vez por {b}."], ["Count the steps until you reach {v}.", "Cuenta los pasos hasta llegar a {v}."]],
        meta: { kind: "pow", b, e: n, inverse: true, nm },
      });
    },
  };

  G.register("exponentEval", {
    title: "Powers and exponents",
    titleEs: "Potencias y exponentes",
    levels: 4,
    make(rng, level) {
      return expTypes[rng.pick(EX_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      // BigInt exponentiation as the independent route
      const big = (/** @type {number} */ b, /** @type {number} */ e) =>
        Number(BigInt(b) ** BigInt(e));
      switch (m.kind) {
        case "pow":
          return m.inverse
            ? agree(item, Math.round(Math.log(big(m.b, m.e)) / Math.log(m.b)))
            : agree(item, item.k === "mc" ? cm(big(m.b, m.e)) : big(m.b, m.e));
        case "toPower":
          return agree(item, pw(m.b, m.k));
        case "parts":
          return agree(item, m.ask === "base" ? m.b : m.e);
        case "zeros":
          return agree(item, String(big(10, m.n)).length - 1);
        case "greatest": {
          const vals = m.set.map(([b, e]) => big(b, e));
          const top = Math.max(...vals);
          const i = vals.indexOf(top);
          return vals.filter((v) => v === top).length === 1
            ? agree(item, pw(m.set[i][0], m.set[i][1]))
            : "tie for greatest";
        }
        case "asPower":
          return agree(item, pw(m.b, Math.round(Math.log(big(m.b, m.e)) / Math.log(m.b))));
        case "sum":
          return agree(item, big(m.a, m.m) + big(m.b, m.n));
        case "missingExp":
          return agree(item, Math.round(Math.log(big(m.b, m.e)) / Math.log(m.b)));
        case "missingBase": {
          const v = big(m.b, m.e);
          let g = 1;
          while (big(g, m.e) < v) g++;
          return big(g, m.e) === v ? agree(item, g) : "no integer base";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ================================== factors, multiples, GCF, LCM, primes ======================================== */
  /** every factor of n, by testing 1..n */
  const factorsOf = (/** @type {number} */ n) => {
    const out = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
    return out;
  };
  /** the same by pairing small factors with their partners up to the square root (the independent route) */
  const factorPairs = (/** @type {number} */ n) => {
    const out = new Set();
    for (let i = 1; i * i <= n; i++) if (n % i === 0) out.add(i).add(n / i);
    return [...out].sort((a, b) => a - b);
  };
  const isPrime = (/** @type {number} */ n) => n > 1 && factorsOf(n).length === 2;
  const list = (/** @type {number[]} */ a) => a.join(", ");
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "factors-multiples-confused": ["Factors go INTO a number and multiples come OUT of it by counting. Ask which number divides which.", "Los factores ENTRAN en un número y los múltiplos SALEN de él al contar. Pregunta cuál número divide a cuál."],
    "chose-both": ["Only a number that is equal to the other one can be both. Compare their sizes.", "Solo un número igual al otro puede ser las dos cosas. Compara sus tamaños."],
    "divisibility-missed": ["Check by dividing: one of the numbers does divide the other with nothing left over.", "Comprueba dividiendo: uno de los números sí divide al otro sin que sobre nada."],
    "divisibility-assumed": ["Check by dividing: no division here comes out even.", "Comprueba dividiendo: ninguna división aquí sale exacta."],
    "forgot-the-number-itself": ["Every number is a factor of itself, so the number itself belongs in the list.", "Todo número es factor de sí mismo, así que el número mismo va en la lista."],
    "skipped-a-factor": ["A factor is missing from this list. Test every number from 1 up with division.", "A esta lista le falta un factor. Prueba cada número desde 1 con una división."],
    "left-out-1-and-itself": ["1 and the number itself are always factors, so both belong in the list.", "El 1 y el número mismo siempre son factores, así que los dos van en la lista."],
    "counted-by-ones": ["Multiples are found by counting by the number, not by 1.", "Los múltiplos se hallan contando de la cantidad en cantidad, no de 1 en 1."],
    "skipped-a-multiple": ["A multiple is missing. Count by the number: add it each time.", "Falta un múltiplo. Cuenta de la cantidad en cantidad: súmala cada vez."],
    "doubled-each-time": ["Multiples add the number each time; they do not double each time.", "Los múltiplos suman el número cada vez; no se duplican cada vez."],
    "near-multiple": ["This number is close to a multiple of {m}, but dividing by {m} leaves a remainder.", "Este número está cerca de un múltiplo de {m}, pero al dividir entre {m} sobra algo."],
    "factor-of-one-only": ["That divides only one of the two numbers. A common factor must divide both.", "Eso divide solo a uno de los dos números. Un factor común debe dividir a los dos."],
    "common-multiple-for-factor": ["That is a multiple of both numbers. A common FACTOR goes into both numbers instead.", "Eso es un múltiplo de los dos números. Un FACTOR común entra en los dos números."],
    "gave-the-greatest-only": ["That is only the greatest common factor. The question counts ALL the common factors.", "Ese es solo el máximo común divisor. La pregunta cuenta TODOS los factores comunes."],
    "counted-one-number": ["That counts the factors of just one number. Count only the factors the two numbers share.", "Eso cuenta los factores de un solo número. Cuenta solo los factores que comparten los dos."],
    "missed-a-condition": ["That fits some of the clues but not all of them. Check every clue.", "Eso cumple algunas pistas pero no todas. Revisa cada pista."],
    "counted-too-many": ["That counts one multiple too many. Check which multiples are really less than the limit.", "Eso cuenta un múltiplo de más. Revisa cuáles múltiplos son de verdad menores que el límite."],
    "counted-too-few": ["That misses a multiple. List the multiples in order and stop just before the limit.", "Eso se deja un múltiplo. Haz la lista en orden y detente justo antes del límite."],
    "gcf-lcm-confused": ["That is a multiple idea. The GCF is a factor: it divides both numbers, so it is never bigger than the smaller one.", "Eso es una idea de múltiplos. El MCD es un factor: divide a los dos números, así que nunca es mayor que el menor."],
    "stopped-at-a-common-factor": ["That divides both numbers, but a bigger number does too. The GCF is the GREATEST common factor.", "Eso divide a los dos números, pero uno mayor también. El MCD es el MAYOR factor común."],
    "not-a-common-factor": ["Test it: that number does not divide both quantities with nothing left over.", "Pruébalo: ese número no divide a las dos cantidades sin que sobre algo."],
    "ignored-the-third-number": ["That is the GCF of only two of the numbers. The third number has to be divided evenly too.", "Ese es el MCD de solo dos de los números. El tercer número también debe dividirse exacto."],
    "gave-the-group-count": ["That is the number of groups. The question asks how many are in each group.", "Ese es el número de grupos. La pregunta es cuántos hay en cada grupo."],
    "gave-the-other-item": ["That is the count for the other item. Check which item the question asks about.", "Ese es el conteo del otro artículo. Revisa por cuál artículo pregunta la pregunta."],
    "lcm-product-of-both": ["Multiplying the two numbers gives a common multiple, but a smaller one may exist. Look for the FIRST number both lists share.", "Multiplicar los dos números da un múltiplo común, pero puede haber uno menor. Busca el PRIMER número que comparten las dos listas."],
    "lcm-only-the-larger": ["The larger number alone is not a multiple of the smaller one. Check that both numbers divide your answer evenly.", "El número mayor solo no es múltiplo del menor. Revisa que los dos números dividan tu respuesta exacto."],
    "lcm-added": ["Adding the numbers does not find when the cycles meet. Use multiples of each number.", "Sumar los números no halla cuándo se juntan los ciclos. Usa los múltiplos de cada número."],
    "not-the-least": ["That is a common multiple, but not the least one. Look for the first number both lists share.", "Ese es un múltiplo común, pero no el menor. Busca el primer número que comparten las dos listas."],
    "lcm-gcf-confused": ["That is a factor idea. The LCM is a multiple, so it is at least as big as the larger number.", "Esa es una idea de factores. El mcm es un múltiplo, así que es al menos tan grande como el número mayor."],
  });
  const FMTYPES = {
    1: ["fm", "listF", "multList"],
    2: ["countF", "isMult", "common"],
    3: ["countCommon", "countMult", "riddle"],
    4: ["four", "four", "riddle"],
  };
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const fmTypes = {
    fm(rng) {
      const kase = rng.pick(["factor", "multiple", "neither"]);
      const a = rng.int(2, 9);
      const k = rng.int(2, 9);
      const { x, y } =
        kase === "factor"
          ? { x: a, y: a * k }
          : kase === "multiple"
            ? { x: a * k, y: a }
            : draw(
                () => ({ x: rng.int(4, 15), y: rng.int(4, 15) }),
                (v) => v.x !== v.y && v.x % v.y !== 0 && v.y % v.x !== 0,
              );
      const V = { x, y, k, kx: y / x };
      const [F, M, B, N] = [
        ["A factor", "Un factor"],
        ["A multiple", "Un múltiplo"],
        ["Both a factor and a multiple", "Ambos: factor y múltiplo"],
        ["Neither", "Ninguno"],
      ];
      const right = { factor: F, multiple: M, neither: N }[/** @type {"factor"} */ (kase)];
      const w =
        kase === "neither"
          ? [
              [F, "divisibility-assumed"],
              [M, "divisibility-assumed"],
              [B, "divisibility-assumed"],
            ]
          : [
              [kase === "factor" ? M : F, "factors-multiples-confused"],
              [B, "chose-both"],
              [N, "divisibility-missed"],
            ];
      const why = {
        factor: [
          "{y} ÷ {x} = {kx} with nothing left over, so {x} goes into {y}: {x} is a factor of {y}.",
          "{y} ÷ {x} = {kx} sin que sobre nada, así que {x} entra en {y}: {x} es un factor de {y}.",
        ],
        multiple: [
          "{x} ÷ {y} = {k} with nothing left over, so {x} is made by counting by {y}: {x} is a multiple of {y}.",
          "{x} ÷ {y} = {k} sin que sobre nada, así que {x} se forma contando de {y} en {y}: {x} es un múltiplo de {y}.",
        ],
        neither: [
          "Neither number divides the other evenly, so {x} is neither a factor nor a multiple of {y}.",
          "Ninguno de los números divide exacto al otro, así que {x} no es factor ni múltiplo de {y}.",
        ],
      }[/** @type {"factor"} */ (kase)];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Is {x} a factor or a multiple of {y}?", "¿{x} es un factor o un múltiplo de {y}?"], a: right, w, x: why,
        h: [["Factors divide a number evenly. Multiples are what you get by counting by a number.", "Los factores dividen un número exacto. Los múltiplos se obtienen contando de un número en ese número."], ["Divide the larger of the two numbers by the smaller one.", "Divide el mayor de los dos números entre el menor."], ["Does it come out even? Which number divides which?", "¿Sale exacto? ¿Cuál número divide a cuál?"]],
        meta: { kind: "fm", x, y },
      });
    },
    listF(rng) {
      const n = rng.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 48]);
      const f = factorsOf(n);
      const mid = f[Math.floor(f.length / 2) - 1];
      const V = { n, m: n };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which list shows all the factors of {n}?", "¿Cuál lista muestra todos los factores de {n}?"], a: list(f),
        w: [[list(f.slice(0, -1)), "forgot-the-number-itself"], [list(f.filter((v) => v !== mid)), "skipped-a-factor"], [list([1, 2, 3, 4].map((i) => n * i)), "factors-multiples-confused"], [list(f.slice(1, -1)), "left-out-1-and-itself"]],
        x: [`Test each number from 1 up: ${list(f)} all divide {n} evenly, and no others do.`, `Prueba cada número desde 1: ${list(f)} dividen a {n} exacto, y ningún otro lo hace.`],
        h: [["A factor divides the number evenly, with nothing left over.", "Un factor divide el número exacto, sin que sobre nada."], ["Start with 1 and the number itself, then test 2, 3, 4, and so on.", "Empieza con 1 y el número mismo, luego prueba 2, 3, 4, y así."], ["Factors come in pairs that multiply to {n}.", "Los factores vienen en parejas que se multiplican para dar {n}."]],
        meta: { kind: "listF", n },
      });
    },
    multList(rng) {
      const m = rng.int(3, 12);
      const right = [1, 2, 3, 4].map((i) => m * i);
      const f = factorsOf(m);
      const V = { m };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which list shows the first four multiples of {m}?", "¿Cuál lista muestra los primeros cuatro múltiplos de {m}?"], a: list(right),
        w: [[list(f.length >= 4 ? f.slice(0, 4) : [...f, ...[2, 3].map((i) => m + i)].slice(0, 4)), "factors-multiples-confused"], [list([m, m + 1, m + 2, m + 3]), "counted-by-ones"], [list([m, 2 * m, 3 * m, 5 * m]), "skipped-a-multiple"], [list([m, 2 * m, 4 * m, 8 * m]), "doubled-each-time"]],
        x: [`Count by {m}s: ${list(right)}.`, `Cuenta de {m} en {m}: ${list(right)}.`],
        h: [["A multiple of {m} is what you get by multiplying {m} by 1, 2, 3, ...", "Un múltiplo de {m} es lo que obtienes al multiplicar {m} por 1, 2, 3, ..."], ["Start at {m} and add {m} each time.", "Empieza en {m} y suma {m} cada vez."], ["Write four numbers in a row.", "Escribe cuatro números seguidos."]],
        meta: { kind: "multList", m },
      });
    },
    countF(rng) {
      const n = rng.pick([24, 30, 36, 40, 42, 48, 54, 56, 60, 72, 80, 84, 90, 96]);
      const c = factorsOf(n).length;
      const V = { n };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numMc(rng, V, {
        q: ["How many factors does {n} have?", "¿Cuántos factores tiene {n}?"], a: c,
        w: [[c - 2, "left-out-1-and-itself", ["That leaves out 1 and {n} itself. Both are factors.", "Eso deja fuera el 1 y {n} mismo. Los dos son factores."]], [c / 2, "skipped-a-factor", ["That counts only one number from each factor pair. Each pair has two different factors.", "Eso cuenta un solo número de cada pareja de factores. Cada pareja tiene dos factores distintos."]], [c - 1, "skipped-a-factor"], [c + 1, "skipped-a-factor"]],
        x: [`The factors of {n} are ${list(factorsOf(n))}. That is ${c} factors.`, `Los factores de {n} son ${list(factorsOf(n))}. Son ${c} factores.`],
        h: [["List the factors in pairs that multiply to {n}.", "Haz la lista de factores en parejas que se multiplican para dar {n}."], ["Start with 1 × {n}, then try 2, 3, 4, ...", "Empieza con 1 × {n}, luego prueba 2, 3, 4, ..."], ["Count every number in your list.", "Cuenta cada número de tu lista."]],
        meta: { kind: "countF", n },
      }, 0.4);
    },
    isMult(rng) {
      const m = rng.int(6, 13);
      const k = rng.int(4, 12);
      const v = m * k;
      const V = { m };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which number is a multiple of {m}?", "¿Cuál número es un múltiplo de {m}?"], a: String(v),
        w: [[String(v + 1), "near-multiple"], [String(v - 1), "near-multiple"], [String(v + 2), "near-multiple"], [String(v - 2), "near-multiple"]],
        x: [`${v} ÷ {m} = ${k} with nothing left over, so ${v} is a multiple of {m}.`, `${v} ÷ {m} = ${k} sin que sobre nada, así que ${v} es un múltiplo de {m}.`],
        h: [["A multiple of {m} can be divided by {m} with no remainder.", "Un múltiplo de {m} se puede dividir entre {m} sin residuo."], ["Count by {m}s until you get close to the choices.", "Cuenta de {m} en {m} hasta acercarte a las opciones."], ["Divide each choice by {m} and look at the remainder.", "Divide cada opción entre {m} y mira el residuo."]],
        meta: { kind: "isMult", m, choices: 4 },
      });
    },
    common(rng) {
      const { a, b } = draw(
        () => ({ a: rng.int(12, 60), b: rng.int(12, 60) }),
        (v) => v.a !== v.b && G.gcd(v.a, v.b) > 1 && G.gcd(v.a, v.b) < Math.min(v.a, v.b),
      );
      const g = G.gcd(a, b);
      const cf = factorsOf(g).filter((f) => f > 1);
      const right = rng.pick(cf);
      const onlyA = factorsOf(a).filter((f) => f > 1 && b % f !== 0);
      const onlyB = factorsOf(b).filter((f) => f > 1 && a % f !== 0);
      const V = { a, b };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which number is a common factor of {a} and {b}?", "¿Cuál número es un factor común de {a} y {b}?"], a: String(right),
        w: [[String(rng.pick(onlyA)), "factor-of-one-only"], [String(rng.pick(onlyB)), "factor-of-one-only"], [String(lcm(a, b)), "common-multiple-for-factor"], [String(a * b), "common-multiple-for-factor"]].filter((w) => w[0] !== "undefined"),
        x: [`${right} divides {a} (${a / right}) and {b} (${b / right}) evenly, so it is a common factor.`, `${right} divide a {a} (${a / right}) y a {b} (${b / right}) exacto, así que es un factor común.`],
        h: [["A common factor divides BOTH numbers evenly.", "Un factor común divide a LOS DOS números exacto."], ["List the factors of {a}, then the factors of {b}.", "Haz la lista de factores de {a} y luego la de {b}."], ["Which choice is in both lists?", "¿Cuál opción está en las dos listas?"]],
        meta: { kind: "common", a, b },
      });
    },
    countCommon(rng) {
      const g = rng.pick([6, 8, 12, 18, 20, 24]);
      const { p, q } = draw(
        () => ({ p: rng.int(2, 6), q: rng.int(2, 6) }),
        (v) => v.p !== v.q && G.gcd(v.p, v.q) === 1,
      );
      const [a, b] = [g * p, g * q];
      const c = factorsOf(g).length;
      const V = { a, b };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["How many common factors do {a} and {b} have?", "¿Cuántos factores comunes tienen {a} y {b}?"], a: c,
        w: [[g, "gave-the-greatest-only"], [factorsOf(a).length, "counted-one-number"], [c - 1, "left-out-1-and-itself", ["That misses a common factor. Remember that 1 is a factor of every number.", "Eso se deja un factor común. Recuerda que 1 es factor de todos los números."]], [c + 1, "counted-one-number"]],
        x: [`The common factors are ${list(factorsOf(g))}. Every common factor divides the GCF ${g}. That is ${c} common factors.`, `Los factores comunes son ${list(factorsOf(g))}. Cada factor común divide al MCD ${g}. Son ${c} factores comunes.`],
        h: [["List the factors of each number.", "Haz la lista de factores de cada número."], ["Circle the numbers that appear in both lists.", "Encierra los números que aparecen en las dos listas."], ["Count the circled numbers, including 1.", "Cuenta los números encerrados, incluyendo el 1."]],
        meta: { kind: "countCommon", a, b },
      });
    },
    countMult(rng) {
      const m = rng.int(4, 12);
      const N = draw(
        () => rng.int(40, 130),
        (v) => v % m !== 0,
      );
      const c = Math.floor((N - 1) / m);
      const V = { m, N };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["How many multiples of {m} are less than {N}? (Start counting at {m}.)", "¿Cuántos múltiplos de {m} son menores que {N}? (Empieza a contar en {m}.)"], a: c,
        w: [[c + 1, "counted-too-many"], [c - 1, "counted-too-few"], [Math.round(N / m), "counted-too-many"]],
        x: [`Multiples of {m}: ${list([...Array(c)].map((_, i) => m * (i + 1)))}. The next one, ${m * (c + 1)}, is more than {N}. That is ${c} multiples.`, `Múltiplos de {m}: ${list([...Array(c)].map((_, i) => m * (i + 1)))}. El siguiente, ${m * (c + 1)}, es mayor que {N}. Son ${c} múltiplos.`],
        h: [["List the multiples of {m} in order.", "Haz la lista de múltiplos de {m} en orden."], ["Stop before you pass {N}.", "Detente antes de pasar de {N}."], ["Count the numbers in your list.", "Cuenta los números de tu lista."]],
        meta: { kind: "countMult", m, N },
      });
    },
    riddle(rng, level) {
      const r = draw(
        () => {
          const N = rng.pick([48, 60, 72, 84, 90, 96, 120, 180]);
          const m = rng.pick(factorsOf(N).filter((f) => f > 1 && f < N / 2));
          const extra = rng.pick([
            ["odd", "an odd number", "un número impar", (/** @type {number} */ v) => v % 2 === 1],
            ["even", "an even number", "un número par", (/** @type {number} */ v) => v % 2 === 0],
            ["gt", `greater than ${rng.int(8, 30)}`, "", null],
          ]);
          const g = Number(String(extra[1]).replace(/\D/g, "")) || 0;
          const clues = [
            (/** @type {number} */ v) => N % v === 0,
            (/** @type {number} */ v) => v % m === 0,
            extra[0] === "gt" ? (/** @type {number} */ v) => v > g : /** @type {any} */ (extra[3]),
          ];
          const fits = (/** @type {((v: number) => boolean)[]} */ cl) =>
            [...Array(N).keys()].map((i) => i + 1).filter((v) => cl.every((c) => c(v)));
          return { N, m, extra, g, all: fits(clues), two: fits(clues.slice(0, 2)) };
        },
        (v) => v.all.length === 1 && v.two.length >= 2 && v.two.length <= 4,
      );
      const ans = r.all[0];
      const clue =
        r.extra[0] === "gt"
          ? [`greater than ${r.g}`, `mayor que ${r.g}`]
          : [r.extra[1], r.extra[2]];
      const V = { N: r.N, m: r.m, c1: clue[0], c2: clue[1] };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["I am a factor of {N}. I am a multiple of {m}. I am {c1}. What number am I?", "Soy un factor de {N}. Soy un múltiplo de {m}. Soy {c2}. ¿Qué número soy?"], a: ans,
        w: r.two.filter((/** @type {number} */ v) => v !== ans).map((/** @type {number} */ v) => [v, "missed-a-condition"]),
        x: [`The factors of {N} that are multiples of {m} are ${list(r.two)}. Only ${ans} is also {c1}.`, `Los factores de {N} que son múltiplos de {m} son ${list(r.two)}. Solo ${ans} también es {c2}.`],
        h: [["List the factors of {N}.", "Haz la lista de factores de {N}."], ["Cross out the ones that are not multiples of {m}.", "Tacha los que no son múltiplos de {m}."], ["Use the last clue to pick one.", "Usa la última pista para elegir uno."]],
        meta: { kind: "riddle", N: r.N, m: r.m, extra: r.extra[0], g: r.g, level },
      });
    },
    four(rng) {
      const pool = [14, 15, 21, 22, 26, 27, 33, 34, 35, 38, 39, 46, 51, 55];
      const right = rng.pick(pool);
      const others = rng
        .shuffle([2, 3, 5, 7, 11, 13, 4, 9, 25, 49, 12, 16, 18, 20, 24, 28, 30, 36, 45, 48])
        .filter((n) => factorsOf(n).length !== 4)
        .slice(0, 3);
      const V = { n: right };
      const info = (/** @type {number} */ n) => [
        `${n} has ${factorsOf(n).length} factors, not 4. Count its factors in pairs.`,
        `${n} tiene ${factorsOf(n).length} factores, no 4. Cuenta sus factores en parejas.`,
      ];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which number has exactly 4 factors?", "¿Cuál número tiene exactamente 4 factores?"], a: String(right),
        w: others.map((n) => [String(n), isPrime(n) ? "prime-has-two" : "counted-factors-wrong", info(n)]),
        x: [`${right} has exactly 4 factors: ${list(factorsOf(right))}.`, `${right} tiene exactamente 4 factores: ${list(factorsOf(right))}.`],
        h: [["Count ALL the factors of a number: 1, the number itself, and every pair in between.", "Cuenta TODOS los factores de un número: el 1, el número mismo y cada pareja intermedia."], ["Try each choice: list its factors and count them.", "Prueba cada opción: haz la lista de sus factores y cuéntalos."], ["Prime numbers have only 2 factors, so they cannot be the answer.", "Los números primos tienen solo 2 factores, así que no pueden ser la respuesta."]],
        meta: { kind: "four" },
      });
    },
  };
  G.register("factorsMultiples", {
    title: "Factors and multiples",
    titleEs: "Factores y múltiplos",
    levels: 4,
    make(rng, level) {
      return fmTypes[rng.pick(FMTYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      switch (m.kind) {
        case "fm": {
          const rel =
            m.y % m.x === 0 && m.x !== m.y
              ? "A factor"
              : m.x % m.y === 0 && m.x !== m.y
                ? "A multiple"
                : "Neither";
          return agree(item, rel);
        }
        case "listF":
          return agree(item, list(factorPairs(m.n)));
        case "multList":
          return agree(item, list([m.m, m.m + m.m, m.m + m.m + m.m, m.m * 4]));
        case "countF":
          return agree(item, factorPairs(m.n).length);
        case "isMult": {
          const ok = item.c.map((/** @type {string} */ c) => Number(c) % m.m === 0);
          return ok.filter(Boolean).length === 1 && ok[item.a] ? true : "not exactly one multiple";
        }
        case "common": {
          const ok = item.c.map(
            (/** @type {string} */ c) => m.a % Number(c) === 0 && m.b % Number(c) === 0,
          );
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one common factor";
        }
        case "countCommon":
          return agree(item, factorPairs(m.a).filter((f) => m.b % f === 0).length);
        case "countMult": {
          let c = 0;
          for (let v = m.m; v < m.N; v += m.m) c++;
          return agree(item, c);
        }
        case "riddle": {
          const hits = [];
          for (let v = 1; v <= m.N; v++)
            if (
              m.N % v === 0 &&
              v % m.m === 0 &&
              (m.extra === "odd" ? v % 2 === 1 : m.extra === "even" ? v % 2 === 0 : v > m.g)
            )
              hits.push(v);
          return hits.length === 1 ? agree(item, hits[0]) : `riddle has ${hits.length} answers`;
        }
        case "four": {
          const ok = item.c.map((/** @type {string} */ c) => factorPairs(Number(c)).length === 4);
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one number with 4 factors";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ===================================================== gcfFind ================================================== */
  // prettier-ignore
  // biome-ignore format: one context per line
  const KITS = rows([
    "pencils|lápices|erasers|borradores|pens|bolígrafos|supply kits|kits de útiles|m",
    "roses|rosas|tulips|tulipanes|daisies|margaritas|bouquets|ramos|m",
    "cookies|galletas|crackers|galletas saladas|grapes|uvas|snack plates|platos de merienda|m",
    "red beads|cuentas rojas|blue beads|cuentas azules|white beads|cuentas blancas|bracelets|pulseras|f",
    "tomato plants|plantas de tomate|pepper plants|plantas de pimiento|bean plants|plantas de frijol|garden rows|filas de jardín|f",
    "stickers|calcomanías|trading cards|cartas|pins|insignias|gift bags|bolsas de regalo|f",
  ]).map((r) => ({ x: r[0], xEs: r[1], y: r[2], yEs: r[3], w: r[4], wEs: r[5], z: r[6], zEs: r[7], gz: r[8] }));
  /** @type {Record<number, string[]>} */
  const GCF_TYPES = {
    1: ["bare", "kit", "greatestOf"],
    2: ["kit", "kit", "each"],
    3: ["kit3", "bare3", "kit"],
    4: ["factorOut", "reverse", "coprime", "kit3"],
  };
  const gcfByTrial = (/** @type {number[]} */ nums) => {
    for (let d = Math.min(...nums); d >= 1; d--) if (nums.every((n) => n % d === 0)) return d;
    return 1;
  };
  /** small distinct numbers with a chosen GCF: g times coprime-ish multipliers */
  const gcfSet = (
    /** @type {any} */ rng,
    /** @type {number} */ count,
    /** @type {number} */ gLo,
    /** @type {number} */ gHi,
    /** @type {number} */ mHi,
  ) =>
    draw(
      () => {
        const g = rng.int(gLo, gHi);
        const ms = Array.from({ length: count }, () => rng.int(2, mHi));
        return { g, nums: ms.map((m) => g * m) };
      },
      (v) =>
        new Set(v.nums).size === count &&
        gcfByTrial(v.nums) === v.g &&
        v.g > 1 &&
        v.nums.every((n) => n !== v.g),
    );
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const gcfTypes = {
    bare(rng) {
      const { g, nums } = gcfSet(rng, 2, 2, 6, 6);
      return gcfBuild(rng, g, nums, false);
    },
    bare3(rng) {
      const { g, nums } = gcfSet(rng, 3, 3, 12, 6);
      return gcfBuild(rng, g, nums, false);
    },
    kit(rng, level) {
      const { g, nums } = level === 1 ? gcfSet(rng, 2, 2, 6, 6) : gcfSet(rng, 2, 3, 15, 8);
      return gcfBuild(rng, g, nums, true);
    },
    kit3(rng) {
      const { g, nums } = gcfSet(rng, 3, 3, 12, 7);
      return gcfBuild(rng, g, nums, true);
    },
    greatestOf(rng) {
      const { g, nums } = gcfSet(rng, 2, 2, 8, 6);
      const cf = factorsOf(g);
      const V = { a: nums[0], b: nums[1], lst: list(cf) };
      const tooSmall = cf.filter((f) => f < g);
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["The common factors of {a} and {b} are {lst}. What is their greatest common factor (GCF)?", "Los factores comunes de {a} y {b} son {lst}. ¿Cuál es su máximo común divisor (MCD)?"], a: String(g),
        w: [[String(tooSmall[tooSmall.length - 1] ?? 1), "stopped-at-a-common-factor"], [String(tooSmall[0] ?? 1), "stopped-at-a-common-factor"], [String(lcm(nums[0], nums[1])), "gcf-lcm-confused"], [String(nums[0] * nums[1]), "gcf-lcm-confused"]],
        x: [`The GCF is the greatest number in the list: ${g}.`, `El MCD es el mayor número de la lista: ${g}.`],
        h: [["Greatest means the biggest one.", "Mayor significa el más grande."], ["Look at the list of common factors.", "Mira la lista de factores comunes."], ["Which number in the list is largest?", "¿Cuál número de la lista es el más grande?"]],
        meta: { kind: "gcf", nums },
      });
    },
    each(rng) {
      const { g, nums } = gcfSet(rng, 2, 3, 12, 8);
      const k = rng.pick(KITS);
      const which = rng.chance(0.5) ? 0 : 1;
      const V = {
        who: rng.pick(NAMES),
        A: nums[0],
        B: nums[1],
        x: k.x,
        xEs: k.xEs,
        y: k.y,
        yEs: k.yEs,
        z: k.z,
        zEs: k.zEs,
        zId: gn(k.gz, "idénticos", "idénticas"),
        g,
        ask: which ? k.y : k.x,
        askEs: which ? k.yEs : k.xEs,
        per: nums[which] / g,
        other: nums[1 - which] / g,
        nAsk: nums[which],
      };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["{who} has {A} {x} and {B} {y}. {who} makes the greatest possible number of identical {z}, using every item. How many {ask} are in each one?", "{who} tiene {A} {xEs} y {B} {yEs}. {who} arma el mayor número posible de {zEs} {zId}, usando todos los artículos. ¿Cuántas piezas de {askEs} hay en cada uno?"], a: nums[which] / g,
        w: [[g, "gave-the-group-count"], [nums[1 - which] / g, "gave-the-other-item"], [nums[which], "gave-the-group-count", ["That is all of the {ask}. They are shared out among the {z}, so each one gets only part.", "Esa es la cantidad total de piezas de {askEs}. Se reparten entre los {zEs}, así que cada uno recibe solo una parte."]]],
        x: ["The GCF of {A} and {B} is " + g + ", so " + g + " {z} can be made. Each one gets {nAsk} ÷ " + g + " = {per} {ask}.", "El MCD de {A} y {B} es " + g + ", así que se pueden armar " + g + " {zEs}. Cada uno recibe {nAsk} ÷ " + g + " = {per} {askEs}."],
        h: [["First find the greatest number of identical groups: the GCF of {A} and {B}.", "Primero halla el mayor número de grupos idénticos: el MCD de {A} y {B}."], ["Then share the {ask} equally among those groups.", "Luego reparte los(as) {askEs} en partes iguales entre esos grupos."], ["Divide {nAsk} by the number of groups.", "Divide {nAsk} entre el número de grupos."]],
        meta: { kind: "each", nums, which },
      });
    },
    factorOut(rng) {
      const { g, nums } = gcfSet(rng, 2, 3, 12, 9);
      const V = { a: nums[0], b: nums[1], a2: nums[0] / g, b2: nums[1] / g, g };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["You want to write {a} + {b} as a product: (a number) × (a sum). What is the greatest number you can factor out of both {a} and {b}?", "Quieres escribir {a} + {b} como un producto: (un número) × (una suma). ¿Cuál es el mayor número que puedes sacar como factor de {a} y de {b}?"], a: g,
        w: [[term(g / ([2, 3, 5, 7].find((p) => g % p === 0) ?? g)), "stopped-at-a-common-factor"], [lcm(nums[0], nums[1]), "gcf-lcm-confused"], [nums[0] + nums[1], "gcf-lcm-confused", ["That is the sum itself. The number to factor out must divide both {a} and {b}.", "Esa es la suma misma. El número que se saca como factor debe dividir a {a} y a {b}."]]],
        x: ["The GCF of {a} and {b} is {g}, so {a} + {b} = {g} × ({a2} + {b2}).", "El MCD de {a} y {b} es {g}, así que {a} + {b} = {g} × ({a2} + {b2})."],
        h: [["The greatest number that divides both terms is their GCF.", "El mayor número que divide a los dos términos es su MCD."], ["List the factors of {a} and of {b}.", "Haz la lista de factores de {a} y de {b}."], ["Pick the greatest factor on both lists.", "Elige el mayor factor que está en las dos listas."]],
        meta: { kind: "gcf", nums },
      });
    },
    reverse(rng) {
      const g = rng.int(3, 9);
      const known = g * rng.int(3, 8);
      const right = g * rng.pick([5, 7, 9, 11].filter((m) => G.gcd(known / g, m) === 1));
      const wrongs = draw(
        () => Array.from({ length: 4 }, () => rng.int(10, 90)),
        (ws) => new Set(ws).size === 4 && ws.every((n) => G.gcd(known, n) !== g && n !== right),
      );
      const V = { known, g };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["The GCF of {known} and another number is {g}. Which could the other number be?", "El MCD de {known} y otro número es {g}. ¿Cuál podría ser el otro número?"], a: String(right),
        w: wrongs.map((n) => [String(n), "not-the-gcf", [`The GCF of {known} and ${n} is ${G.gcd(known, n)}, not {g}.`, `El MCD de {known} y ${n} es ${G.gcd(known, n)}, no {g}.`]]),
        x: [`${right} is ${right / g} × {g}, and {known} is ${known / g} × {g}, with no larger common factor, so the GCF is {g}.`, `${right} es ${right / g} × {g} y {known} es ${known / g} × {g}, sin un factor común mayor, así que el MCD es {g}.`],
        h: [["Both numbers must be multiples of the GCF.", "Los dos números deben ser múltiplos del MCD."], ["Test each choice: find its GCF with {known}.", "Prueba cada opción: halla su MCD con {known}."], ["Keep the choice whose GCF with {known} is exactly {g}.", "Quédate con la opción cuyo MCD con {known} es exactamente {g}."]],
        meta: { kind: "reverse", known, g },
      });
    },
    coprime(rng) {
      const mk = () => {
        const a = rng.int(6, 30);
        const b = rng.int(6, 30);
        return a === b ? [a, b + 1] : [a, b];
      };
      const right = draw(mk, (p) => G.gcd(p[0], p[1]) === 1);
      const wrongs = [];
      for (let t = 0; t < 400 && wrongs.length < 3; t++) {
        const p = mk();
        if (G.gcd(p[0], p[1]) > 1 && !wrongs.some((w) => w[0] === p[0] && w[1] === p[1]))
          wrongs.push(p);
      }
      const V = {};
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which pair of numbers has a greatest common factor of 1?", "¿Cuál pareja de números tiene un máximo común divisor de 1?"], a: [`${right[0]} and ${right[1]}`, `${right[0]} y ${right[1]}`],
        w: wrongs.map((p) => [[`${p[0]} and ${p[1]}`, `${p[0]} y ${p[1]}`], "shares-a-factor", [`${p[0]} and ${p[1]} both divide by ${G.gcd(p[0], p[1])}, so their GCF is ${G.gcd(p[0], p[1])}, not 1.`, `${p[0]} y ${p[1]} se dividen entre ${G.gcd(p[0], p[1])}, así que su MCD es ${G.gcd(p[0], p[1])}, no 1.`]]),
        x: [`${right[0]} and ${right[1]} share no factor except 1, so their GCF is 1.`, `${right[0]} y ${right[1]} no comparten ningún factor salvo el 1, así que su MCD es 1.`],
        h: [["A GCF of 1 means the only shared factor is 1.", "Un MCD de 1 significa que el único factor compartido es 1."], ["Look for a number (not 1) that divides both numbers in a pair.", "Busca un número (que no sea 1) que divida a los dos números de una pareja."], ["Cross out each pair that has one.", "Tacha cada pareja que lo tenga."]],
        meta: { kind: "coprime" },
      });
    },
  };
  /** build the shared GCF item: bare numbers or a sharing story */
  const gcfBuild = (
    /** @type {any} */ rng,
    /** @type {number} */ g,
    /** @type {number[]} */ nums,
    /** @type {boolean} */ story,
  ) => {
    const k = rng.pick(KITS);
    const n = nums.length;
    const V = {
      who: rng.pick(NAMES),
      A: nums[0],
      B: nums[1],
      C: nums[2],
      g,
      x: k.x,
      xEs: k.xEs,
      y: k.y,
      yEs: k.yEs,
      w: k.w,
      wEs: k.wEs,
      z: k.z,
      zEs: k.zEs,
      zId: gn(k.gz, "idénticos", "idénticas"),
    };
    const two = n === 2;
    const sorted = [...nums].sort((a, b) => a - b);
    const smallCf = factorsOf(g).filter((f) => f < g);
    /** @type {any[]} */
    const w = [
      [smallCf.length ? smallCf[smallCf.length - 1] : 1, "stopped-at-a-common-factor"],
      [two ? lcm(nums[0], nums[1]) : nums.reduce((a, b) => lcm(a, b)), "gcf-lcm-confused"],
      [two ? G.gcd(nums[0], nums[1]) * 2 : G.gcd(nums[0], nums[1]), "ignored-the-third-number"],
      [sorted[0], "not-a-common-factor"],
    ];
    if (two)
      w[2] = [
        nums[0] + nums[1],
        "gcf-lcm-confused",
        [
          "Adding the numbers does not find a common factor. Look for the greatest number that divides both.",
          "Sumar los números no halla un factor común. Busca el mayor número que divide a ambos.",
        ],
      ];
    // prettier-ignore
    // biome-ignore format: bilingual spec
    return numB(V, {
      q: story
        ? two
          ? ["{who} has {A} {x} and {B} {y}. {who} makes identical {z}, using every item with none left over. What is the greatest number of {z} {who} can make?", "{who} tiene {A} {xEs} y {B} {yEs}. {who} arma {zEs} {zId}, usando todos los artículos sin que sobre ninguno. ¿Cuál es el mayor número de {zEs} que puede armar {who}?"]
          : ["{who} has {A} {x}, {B} {y}, and {C} {w}. {who} makes identical {z}, using every item with none left over. What is the greatest number of {z} {who} can make?", "{who} tiene {A} {xEs}, {B} {yEs} y {C} {wEs}. {who} arma {zEs} {zId}, usando todos los artículos sin que sobre ninguno. ¿Cuál es el mayor número de {zEs} que puede armar {who}?"]
        : ["What is the greatest common factor (GCF) of " + (two ? "{A} and {B}" : "{A}, {B}, and {C}") + "?", "¿Cuál es el máximo común divisor (MCD) de " + (two ? "{A} y {B}" : "{A}, {B} y {C}") + "?"],
      a: g,
      w,
      x: [`The common factors of ${nums.join(", ")} are ${list(factorsOf(g))}. The greatest is ${g}${story ? `, so ${g} identical groups can be made` : ""}.`, `Los factores comunes de ${nums.join(", ")} son ${list(factorsOf(g))}. El mayor es ${g}${story ? `, así que se pueden armar ${g} grupos idénticos` : ""}.`],
      h: [["The GCF is the greatest number that divides every number in the problem.", "El MCD es el mayor número que divide a todos los números del problema."], ["List the factors of each number, or use a factor tree.", "Haz la lista de factores de cada número, o usa un árbol de factores."], ["Find the greatest factor that appears on every list.", "Halla el mayor factor que aparece en todas las listas."]],
      meta: { kind: "gcf", nums },
    });
  };
  Object.assign(FB, {
    "not-the-gcf": [
      "Test it: find the GCF of the two numbers. It is not the target.",
      "Pruébalo: halla el MCD de los dos números. No es el que se busca.",
    ],
    "shares-a-factor": [
      "Those two numbers share a factor bigger than 1.",
      "Esos dos números comparten un factor mayor que 1.",
    ],
  });
  G.register("gcfFind", {
    title: "Greatest common factor",
    titleEs: "Máximo común divisor",
    levels: 4,
    make(rng, level) {
      return gcfTypes[rng.pick(GCF_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      switch (m.kind) {
        case "gcf":
          return agree(item, gcfByTrial(m.nums));
        case "each":
          return agree(item, m.nums[m.which] / gcfByTrial(m.nums));
        case "reverse": {
          const ok = item.c.map(
            (/** @type {string} */ c) => gcfByTrial([m.known, Number(c)]) === m.g,
          );
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one number with that GCF";
        }
        case "coprime": {
          const ok = item.c.map(
            (/** @type {string} */ c) => gcfByTrial(c.split(/ and | y /).map(Number)) === 1,
          );
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one coprime pair";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ===================================================== lcmFind ================================================== */
  // prettier-ignore
  // biome-ignore format: one context per line
  const CYCLES = rows([
    "Bus A leaves the station every {a} minutes and Bus B every {b} minutes. They just left together.|El autobús A sale de la estación cada {a} minutos y el autobús B cada {b} minutos. Acaban de salir juntos.|minutes|minutos",
    "A red light blinks every {a} seconds and a blue light every {b} seconds. They just blinked together.|Una luz roja parpadea cada {a} segundos y una luz azul cada {b} segundos. Acaban de parpadear juntas.|seconds|segundos",
    "{who} swims every {a} days and runs every {b} days. Both happen today.|{who} nada cada {a} días y corre cada {b} días. Hoy hacen las dos cosas.|days|días",
    "A drum beats every {a} counts and a bell rings every {b} counts. They just sounded together.|Un tambor suena cada {a} tiempos y una campana suena cada {b} tiempos. Acaban de sonar juntos.|counts|tiempos",
    "A lighthouse flashes every {a} seconds and a buoy every {b} seconds. They just flashed together.|Un faro destella cada {a} segundos y una boya cada {b} segundos. Acaban de destellar juntos.|seconds|segundos",
    "A tram arrives every {a} minutes and a ferry every {b} minutes. They both just arrived.|Un tranvía llega cada {a} minutos y un ferri cada {b} minutos. Los dos acaban de llegar.|minutes|minutos",
  ]).map((r) => ({ en: r[0], es: r[1], u: r[2], uEs: r[3] }));
  const lcmByCount = (/** @type {number[]} */ nums) => {
    const top = Math.max(...nums);
    for (let m = top; ; m += top) if (nums.every((n) => m % n === 0)) return m;
  };
  /** clock text: 8:00 AM + minutes */
  const clock = (/** @type {number} */ start, /** @type {number} */ plus) => {
    const t = (start + plus) % 1440;
    const h = Math.floor(t / 60);
    const h12 = h % 12 || 12;
    return [
      `${h12}:${String(t % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
      `${h12}:${String(t % 60).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`,
    ];
  };
  const LCM_TYPES = {
    1: ["lists", "bare", "story"],
    2: ["story", "story", "bare"],
    3: ["clock", "story", "between"],
    4: ["three", "reverse", "packs"],
  };
  /** two numbers that share a factor (so the product is NOT the LCM) */
  const lcmPair = (
    /** @type {any} */ rng,
    /** @type {number} */ lo,
    /** @type {number} */ hi,
    /** @type {boolean} */ share = true,
  ) =>
    draw(
      () => [rng.int(lo, hi), rng.int(lo, hi)],
      (p) =>
        p[0] !== p[1] &&
        (share
          ? G.gcd(p[0], p[1]) > 1 && p[0] % p[1] !== 0 && p[1] % p[0] !== 0
          : G.gcd(p[0], p[1]) === 1),
    );
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const lcmTypes = {
    lists(rng) {
      const [a, b] = lcmPair(rng, 3, 9);
      const L = lcmByCount([a, b]);
      const ma = [...Array(Math.ceil((2 * L) / a))]
        .map((_, i) => a * (i + 1))
        .filter((v) => v <= 2 * L);
      const mb = [...Array(Math.ceil((2 * L) / b))]
        .map((_, i) => b * (i + 1))
        .filter((v) => v <= 2 * L);
      const V = { a, b, la: list(ma), lb: list(mb), L };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Multiples of {a}: {la}. Multiples of {b}: {lb}. What is the least common multiple (LCM) of {a} and {b}?", "Múltiplos de {a}: {la}. Múltiplos de {b}: {lb}. ¿Cuál es el mínimo común múltiplo (mcm) de {a} y {b}?"], a: String(L),
        w: [[String(2 * L), "not-the-least"], [String(a * b), "lcm-product-of-both"], [String(Math.max(a, b)), "lcm-only-the-larger"], [String(G.gcd(a, b)), "lcm-gcf-confused"]],
        x: ["The first number on both lists is {L}, so the LCM of {a} and {b} is {L}.", "El primer número en las dos listas es {L}, así que el mcm de {a} y {b} es {L}."],
        h: [["A common multiple is on both lists. The least one is the first.", "Un múltiplo común está en las dos listas. El menor es el primero."], ["Read both lists from the left.", "Lee las dos listas desde la izquierda."], ["Which is the first number that appears in both?", "¿Cuál es el primer número que aparece en las dos?"]],
        meta: { kind: "lcm", nums: [a, b] },
      });
    },
    bare(rng, level) {
      const [a, b] = lcmPair(rng, level === 1 ? 2 : 4, level === 1 ? 6 : 15, level > 1);
      return lcmBuild(rng, [a, b], false);
    },
    story(rng, level) {
      const [a, b] = lcmPair(rng, level === 1 ? 3 : 4, level === 1 ? 8 : 16, level > 1);
      return lcmBuild(rng, [a, b], true);
    },
    three(rng) {
      const nums = draw(
        () => [rng.int(2, 12), rng.int(2, 12), rng.int(2, 12)],
        (v) =>
          new Set(v).size === 3 &&
          lcmByCount(v) <= 180 &&
          lcmByCount(v) > Math.max(...v) * 1.5 &&
          lcmByCount(v) !== lcmByCount([v[0], v[1]]) &&
          lcmByCount(v) !== lcmByCount([v[0], v[2]]),
      );
      return lcmBuild(rng, nums, true);
    },
    between(rng) {
      const [a, b] = lcmPair(rng, 4, 12);
      const L = lcmByCount([a, b]);
      const lo = L + rng.int(5, L - 2);
      const first = L * Math.ceil((lo + 1) / L);
      const V = { a, b, lo, L };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["What is the least number greater than {lo} that is a multiple of both {a} and {b}?", "¿Cuál es el menor número mayor que {lo} que es múltiplo de {a} y de {b}?"], a: first,
        w: [[L, "not-the-least", ["That is the LCM, but it is not greater than {lo}. Common multiples of {a} and {b} repeat by the LCM.", "Ese es el mcm, pero no es mayor que {lo}. Los múltiplos comunes de {a} y {b} se repiten de mcm en mcm."]], [a * b > lo ? a * b : null, "lcm-product-of-both"], [first + L, "not-the-least"]],
        x: ["The common multiples of {a} and {b} are the multiples of their LCM, {L}: " + list([1, 2, 3, 4].map((i) => L * i)) + ". The first one above {lo} is " + first + ".", "Los múltiplos comunes de {a} y {b} son los múltiplos de su mcm, {L}: " + list([1, 2, 3, 4].map((i) => L * i)) + ". El primero mayor que {lo} es " + first + "."],
        h: [["Common multiples of two numbers are multiples of their LCM.", "Los múltiplos comunes de dos números son múltiplos de su mcm."], ["Find the LCM of {a} and {b} first.", "Primero halla el mcm de {a} y {b}."], ["Count by the LCM until you pass {lo}.", "Cuenta de mcm en mcm hasta pasar de {lo}."]],
        meta: { kind: "between", nums: [a, b], lo },
      });
    },
    clock(rng) {
      const [a, b] = lcmPair(rng, 4, 15);
      const L = lcmByCount([a, b]);
      const start = rng.pick([7, 8, 9, 10]) * 60;
      const t = (/** @type {number} */ p) => clock(start, p);
      const V = { a, b, st: t(0)[0], stEs: t(0)[1], L };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Bus A leaves every {a} minutes and Bus B every {b} minutes. They both leave at {st}. When do they next leave together?", "El autobús A sale cada {a} minutos y el autobús B cada {b} minutos. Los dos salen a las {stEs}. ¿Cuándo vuelven a salir juntos?"], a: t(L),
        w: [[t(a * b), "lcm-product-of-both"], [t(Math.max(a, b)), "lcm-only-the-larger"], [t(a + b), "lcm-added"], [t(G.gcd(a, b)), "lcm-gcf-confused"]],
        x: ["The LCM of {a} and {b} is {L}, so they leave together {L} minutes after {st}.", "El mcm de {a} y {b} es {L}, así que salen juntos {L} minutos después de las {stEs}."],
        h: [["Find how many minutes pass until both buses leave together: that is the LCM.", "Halla cuántos minutos pasan hasta que los dos autobuses salen juntos: ese es el mcm."], ["List multiples of {a} and of {b} until they match.", "Haz la lista de múltiplos de {a} y de {b} hasta que coincidan."], ["Add that many minutes to {st}.", "Suma esa cantidad de minutos a las {stEs}."]],
        meta: { kind: "clock", nums: [a, b], start },
      });
    },
    reverse(rng) {
      const a = rng.pick([4, 6, 8, 9, 10, 12]);
      const p = rng.pick([5, 7, 11, 13].filter((x) => G.gcd(a, x) === 1));
      const L = a * p;
      const right = p;
      const wrongPool = [];
      for (let x = 2; x <= L + 6; x++) if (lcmByCount([a, x]) !== L && x !== a) wrongPool.push(x);
      const ws = rng.shuffle(wrongPool).slice(0, 4);
      const V = { a, L };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["The LCM of {a} and another number is {L}. Which number could the other number be?", "El mcm de {a} y otro número es {L}. ¿Cuál podría ser el otro número?"], a: String(right),
        w: ws.map((x) => [String(x), lcmByCount([a, x]) < L ? "lcm-too-small" : "lcm-too-big", [`With ${x}, the LCM of {a} and ${x} is ${lcmByCount([a, x])}, not {L}.`, `Con ${x}, el mcm de {a} y ${x} es ${lcmByCount([a, x])}, no {L}.`]]),
        x: [`The LCM of {a} and ${right} is {L}: the first multiple of {a} that ${right} also divides is {L}.`, `El mcm de {a} y ${right} es {L}: el primer múltiplo de {a} que ${right} también divide es {L}.`],
        h: [["Both numbers must divide the LCM {L}.", "Los dos números deben dividir al mcm {L}."], ["Test each choice: find its LCM with {a}.", "Prueba cada opción: halla su mcm con {a}."], ["Keep the choice whose LCM with {a} is exactly {L}.", "Quédate con la opción cuyo mcm con {a} es exactamente {L}."]],
        meta: { kind: "lcmReverse", a, L },
      });
    },
    packs(rng) {
      const [a, b] = lcmPair(rng, 4, 12);
      const L = lcmByCount([a, b]);
      const V = { who: rng.pick(NAMES), a, b, L, pa: L / a, pb: L / b };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["Pens come in packs of {a} and notebooks come in packs of {b}. {who} wants the same number of pens and notebooks, with none left over. What is the fewest packs of pens {who} can buy?", "Los bolígrafos vienen en paquetes de {a} y los cuadernos en paquetes de {b}. {who} quiere la misma cantidad de bolígrafos y cuadernos, sin que sobre ninguno. ¿Cuál es el menor número de paquetes de bolígrafos que puede comprar {who}?"], a: L / a,
        w: [[L, "gave-the-item-count", ["That is the number of pens, not the number of packs. Divide by the pack size.", "Esa es la cantidad de bolígrafos, no de paquetes. Divide entre el tamaño del paquete."]], [L / b, "gave-the-other-item"], [b, "lcm-product-of-both", ["That is the pack size of the notebooks. Find the LCM first, then count the pen packs.", "Ese es el tamaño del paquete de cuadernos. Halla primero el mcm y luego cuenta los paquetes de bolígrafos."]]],
        x: ["The LCM of {a} and {b} is {L}, so {who} needs {L} pens. {L} ÷ {a} = {pa} packs of pens (and {pb} packs of notebooks).", "El mcm de {a} y {b} es {L}, así que {who} necesita {L} bolígrafos. {L} ÷ {a} = {pa} paquetes de bolígrafos (y {pb} paquetes de cuadernos)."],
        h: [["Find the smallest number of pens that also fits whole notebook packs: the LCM.", "Halla la menor cantidad de bolígrafos que también cabe en paquetes enteros de cuadernos: el mcm."], ["Divide that number of pens by the size of a pen pack.", "Divide esa cantidad de bolígrafos entre el tamaño de un paquete de bolígrafos."], ["Check: notebooks should come out equal.", "Comprueba: los cuadernos deben quedar iguales."]],
        meta: { kind: "packs", nums: [a, b] },
      });
    },
  };
  const lcmBuild = (
    /** @type {any} */ rng,
    /** @type {number[]} */ nums,
    /** @type {boolean} */ story,
  ) => {
    const L = lcmByCount(nums);
    const cy = rng.pick(CYCLES);
    const three = nums.length === 3;
    const V = { who: rng.pick(NAMES), a: nums[0], b: nums[1], c: nums[2], L, u: cy.u, uEs: cy.uEs };
    const sp = (/** @type {string} */ s) =>
      s.replace("{a}", String(nums[0])).replace("{b}", String(nums[1]));
    const extraEn = three ? ` A third one repeats every {c} ${cy.u}.` : "";
    const extraEs = three ? ` Un tercero se repite cada {c} ${cy.uEs}.` : "";
    const prod = nums.reduce((p, n) => p * n, 1);
    const pair = lcmByCount(nums.slice(0, 2));
    const w = [
      [prod === L ? null : prod, "lcm-product-of-both"],
      [Math.max(...nums), "lcm-only-the-larger"],
      [three ? pair : nums[0] + nums[1], three ? "not-the-least" : "lcm-added"],
      [gcfByTrial(nums), "lcm-gcf-confused"],
      [L * 2, "not-the-least"],
    ];
    // prettier-ignore
    // biome-ignore format: bilingual spec
    return numMc(rng, V, {
      q: story ? [sp(cy.en) + extraEn + ` In how many ${cy.u} will they happen together again?`, sp(cy.es) + extraEs + ` ¿En cuántos ${cy.uEs} volverán a coincidir?`] : ["What is the least common multiple (LCM) of " + (three ? "{a}, {b}, and {c}" : "{a} and {b}") + "?", "¿Cuál es el mínimo común múltiplo (mcm) de " + (three ? "{a}, {b} y {c}" : "{a} y {b}") + "?"],
      a: L,
      w,
      x: [`List multiples until all numbers match: the first common multiple of ${nums.join(", ")} is {L}.`, `Haz la lista de múltiplos hasta que coincidan todos: el primer múltiplo común de ${nums.join(", ")} es {L}.`],
      h: [["The LCM is the first multiple that every number divides.", "El mcm es el primer múltiplo que todos los números dividen."], ["List multiples of the largest number and test each one.", "Haz la lista de múltiplos del número mayor y prueba cada uno."], ["Stop at the first multiple that all the other numbers divide evenly.", "Detente en el primer múltiplo que todos los demás números dividen exacto."]],
      meta: { kind: "lcm", nums },
    }, 0.35);
  };
  Object.assign(FB, {
    "lcm-too-small": [
      "That makes the LCM smaller than needed. The other number must bring in the factors that make {L}.",
      "Eso hace el mcm menor de lo necesario. El otro número debe aportar los factores que forman {L}.",
    ],
    "lcm-too-big": [
      "That makes the LCM bigger than needed. Test it.",
      "Eso hace el mcm mayor de lo necesario. Pruébalo.",
    ],
    "gave-the-item-count": [
      "That is the number of items, not the number of packs.",
      "Esa es la cantidad de artículos, no de paquetes.",
    ],
  });
  G.register("lcmFind", {
    title: "Least common multiple",
    titleEs: "Mínimo común múltiplo",
    levels: 4,
    make(rng, level) {
      return lcmTypes[rng.pick(LCM_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      switch (m.kind) {
        case "lcm":
          return agree(item, item.k === "mc" ? String(lcmByCount(m.nums)) : lcmByCount(m.nums));
        case "between": {
          const L = lcmByCount(m.nums);
          let v = L;
          while (v <= m.lo) v += L;
          return agree(item, v);
        }
        case "clock":
          return agree(item, clock(m.start, lcmByCount(m.nums))[0]);
        case "packs":
          return agree(item, lcmByCount(m.nums) / m.nums[0]);
        case "lcmReverse": {
          const ok = item.c.map((/** @type {string} */ c) => lcmByCount([m.a, Number(c)]) === m.L);
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one number with that LCM";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ================================================ primeFactorization ============================================ */
  /** prime -> exponent map by trial division */
  const pfMap = (/** @type {number} */ n) => {
    /** @type {Record<number, number>} */
    const m = {};
    let r = n;
    for (let p = 2; r > 1; p++)
      while (r % p === 0) {
        m[p] = (m[p] || 0) + 1;
        r /= p;
      }
    return m;
  };
  const pfStr = (/** @type {Record<number, number>} */ m) =>
    Object.keys(m)
      .map(Number)
      .sort((a, b) => a - b)
      .map((p) => (m[p] > 1 ? pw(p, m[p]) : String(p)))
      .join(" × ");
  const pfVal = (/** @type {Record<number, number>} */ m) =>
    Object.keys(m).reduce((v, p) => v * ipow(Number(p), m[Number(p)]), 1);
  const NEXT_PRIME = /** @type {Record<number, number>} */ ({
    2: 3,
    3: 5,
    5: 7,
    7: 11,
    11: 13,
    13: 17,
  });
  /** parse "2² × 3 × 10" into the list of factors */
  const parseProd = (/** @type {string} */ s) =>
    s.split(" × ").flatMap((t) => {
      const m = t.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/);
      const e = m && m[2] ? Number([...m[2]].map((c) => SUPMAP[c]).join("")) : 1;
      return Array(e).fill(Number(m ? m[1] : NaN));
    });
  // prettier-ignore
  // biome-ignore format: one tag per line
  Object.assign(FB, {
    "factorization-stopped-early": ["One factor in that product is not prime yet, so the tree is not finished. Keep splitting until every factor is prime.", "Un factor de ese producto todavía no es primo, así que el árbol no está terminado. Sigue dividiendo hasta que todos los factores sean primos."],
    "repeated-prime-written-once": ["That writes a repeated prime only once. If a prime appears twice, write it twice or give it an exponent of 2.", "Eso escribe un primo repetido una sola vez. Si un primo aparece dos veces, escríbelo dos veces o dale exponente 2."],
    "exponent-off-by-one": ["Count how many times each prime really appears. The exponent must match that count exactly.", "Cuenta cuántas veces aparece de verdad cada primo. El exponente debe coincidir exactamente con ese conteo."],
    "exponents-swapped": ["The exponents are on the wrong primes. Check which prime appears more times.", "Los exponentes están en los primos equivocados. Revisa cuál primo aparece más veces."],
    "wrong-prime-used": ["Multiply it out. This product uses a different prime, so it does not equal the number.", "Multiplícalo. Este producto usa otro primo, así que no es igual al número."],
    "wrong-reason": ["Being odd, big, or ending in a certain digit does not decide it. Look for a factor other than 1 and the number itself.", "Ser impar, grande o terminar en cierto dígito no lo decide. Busca un factor distinto de 1 y del número mismo."],
    "exponent-ignored": ["That uses each prime only once. An exponent says how many copies of the prime to multiply.", "Eso usa cada primo una sola vez. El exponente dice cuántas copias del primo se multiplican."],
    "needs-more-copies": ["That needs more copies of a prime than the number has. A factor can use only the primes that are in the factorization.", "Eso necesita más copias de un primo de las que tiene el número. Un factor solo puede usar los primos de la factorización."],
    "prime-not-in-factorization": ["That has a prime that is not in the factorization, so it cannot divide the number.", "Eso tiene un primo que no está en la factorización, así que no puede dividir al número."],
  });
  const PF_TYPES = {
    1: ["whichPrime", "whichComposite", "whyComposite"],
    2: ["factorize", "factorize", "countPrime"],
    3: ["factorize", "product", "largestPrime"],
    4: ["build", "compare", "divisible"],
  };
  /** four candidate factorizations, best misconceptions first; early = allow an unfinished tree */
  const pfWrongs = (/** @type {Record<number, number>} */ m, /** @type {boolean} */ early) => {
    const primes = Object.keys(m)
      .map(Number)
      .sort((a, b) => a - b);
    const flat = primes.flatMap((p) => Array(m[p]).fill(p));
    const out = [];
    if (early && flat.length >= 3)
      out.push([
        [flat[0] * flat[1], ...flat.slice(2)].sort((a, b) => a - b).join(" × "),
        "factorization-stopped-early",
      ]);
    if (primes.some((p) => m[p] > 1)) out.push([primes.join(" × "), "repeated-prime-written-once"]);
    const bump = (/** @type {number} */ i, /** @type {number} */ d) =>
      pfStr({ ...m, [primes[i]]: Math.max(1, m[primes[i]] + d) });
    primes.forEach((_, i) => out.push([bump(i, 1), "exponent-off-by-one"]));
    primes.forEach((_, i) => m[primes[i]] > 1 && out.push([bump(i, -1), "exponent-off-by-one"]));
    if (primes.length >= 2 && m[primes[0]] !== m[primes[1]])
      out.push([
        pfStr({ ...m, [primes[0]]: m[primes[1]], [primes[1]]: m[primes[0]] }),
        "exponents-swapped",
      ]);
    const big = primes[primes.length - 1];
    out.push([
      pfStr({ ...m, [big]: 0, [NEXT_PRIME[big] ?? big + 2]: m[big] }).replace(
        /(^| × )0(?= ×|$)/g,
        "",
      ),
      "wrong-prime-used",
    ]);
    return out.filter((w) => w[0] && !/(^| )0( |$)/.test(String(w[0])));
  };
  /** @type {Record<string, (rng: any, level: number) => any>} */
  const pfTypes = {
    whichPrime(rng) {
      const right = rng.pick([
        11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
      ]);
      const comps = rng
        .shuffle([9, 15, 21, 27, 33, 35, 39, 49, 51, 55, 57, 63, 77, 87, 91, 93, 95])
        .slice(0, 4);
      const smallest = (/** @type {number} */ n) => factorsOf(n)[1];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, {}, {
        q: ["Which number is prime?", "¿Cuál número es primo?"], a: String(right),
        w: comps.map((n) => [String(n), "odd-means-prime", [`${n} can be divided by ${smallest(n)}, so it has more than two factors. It is composite.`, `${n} se puede dividir entre ${smallest(n)}, así que tiene más de dos factores. Es compuesto.`]]),
        x: [`${right} has only two factors, 1 and ${right}, so it is prime. The others have a factor besides 1 and themselves.`, `${right} tiene solo dos factores, 1 y ${right}, así que es primo. Los demás tienen un factor además del 1 y de ellos mismos.`],
        h: [["A prime number has exactly two factors: 1 and itself.", "Un número primo tiene exactamente dos factores: 1 y él mismo."], ["Test each choice: can you divide it by 3, 5, or 7?", "Prueba cada opción: ¿puedes dividirla entre 3, 5 o 7?"], ["Keep the one that nothing smaller divides.", "Quédate con la que ningún número menor divide."]],
        meta: { kind: "whichPrime" },
      });
    },
    whichComposite(rng) {
      const right = rng.pick([51, 57, 77, 87, 91, 93, 95, 85, 69, 65, 49, 39]);
      const primes = rng
        .shuffle([23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89])
        .slice(0, 4);
      const p = factorsOf(right)[1];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, { p, q: right / p }, {
        q: ["Which number is composite?", "¿Cuál número es compuesto?"], a: String(right),
        w: primes.map((n) => [String(n), "looks-composite-but-prime", [`${n} has only two factors, 1 and ${n}. It is prime.`, `${n} tiene solo dos factores, 1 y ${n}. Es primo.`]]),
        x: [`${right} = {p} × {q}, so it has a factor besides 1 and itself. It is composite.`, `${right} = {p} × {q}, así que tiene un factor además del 1 y de sí mismo. Es compuesto.`],
        h: [["A composite number has more than two factors.", "Un número compuesto tiene más de dos factores."], ["Look for a number other than 1 that divides it.", "Busca un número distinto de 1 que lo divida."], ["Try 3, 7, 11 on each choice.", "Prueba 3, 7 y 11 en cada opción."]],
        meta: { kind: "whichComposite" },
      });
    },
    whyComposite(rng) {
      const n = rng.pick([51, 57, 63, 69, 77, 87, 91, 93, 95, 85, 39, 33]);
      const p = factorsOf(n)[1];
      const V = { n, p, q: n / p, last: n % 10 };
      const wr = (/** @type {string} */ s, /** @type {string} */ es) => [[s, es], "wrong-reason"];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Why is {n} a composite number?", "¿Por qué {n} es un número compuesto?"], a: ["It has a factor besides 1 and itself: {n} = {p} × {q}", "Tiene un factor además del 1 y de sí mismo: {n} = {p} × {q}"],
        w: [wr("It is an odd number", "Es un número impar"), wr("It is greater than 30", "Es mayor que 30"), wr("It ends in {last}", "Termina en {last}")],
        x: ["A number is composite when it has more than two factors. {n} = {p} × {q}, so {p} and {q} are factors too.", "Un número es compuesto cuando tiene más de dos factores. {n} = {p} × {q}, así que {p} y {q} también son factores."],
        h: [["Prime means exactly two factors. Composite means more.", "Primo significa exactamente dos factores. Compuesto significa más."], ["The reason must be about the factors of {n}.", "La razón debe tratar de los factores de {n}."], ["Which choice names a factor?", "¿Cuál opción nombra un factor?"]],
        meta: { kind: "whyComposite", n },
      });
    },
    factorize(rng, level) {
      const n = draw(
        () => rng.int(level === 2 ? 12 : 100, level === 2 ? 100 : 300),
        (v) =>
          Object.values(pfMap(v)).reduce((s, e) => s + e, 0) >= 3 &&
          Object.keys(pfMap(v)).length >= 2 &&
          Math.max(...Object.keys(pfMap(v)).map(Number)) <= 13,
      );
      const m = pfMap(n);
      const V = { n, f: pfStr(m) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["What is the prime factorization of {n}? Use exponents when a prime repeats.", "¿Cuál es la factorización prima de {n}? Usa exponentes cuando un primo se repite."], a: pfStr(m),
        w: pfWrongs(m, true),
        x: ["Split {n} into factors until every factor is prime: {n} = {f}.", "Divide {n} en factores hasta que todos sean primos: {n} = {f}."],
        h: [["Start a factor tree: split {n} into two factors.", "Empieza un árbol de factores: divide {n} en dos factores."], ["Keep splitting any factor that is not prime.", "Sigue dividiendo cualquier factor que no sea primo."], ["Write the primes from least to greatest, with an exponent for repeats, and multiply to check.", "Escribe los primos de menor a mayor, con exponente para los repetidos, y multiplica para comprobar."]],
        meta: { kind: "factorize", n },
      });
    },
    product(rng) {
      const n = draw(
        () => rng.int(100, 300),
        (v) =>
          Object.keys(pfMap(v)).length >= 2 &&
          Object.values(pfMap(v)).reduce((s, e) => s + e, 0) >= 4 &&
          Math.max(...Object.keys(pfMap(v)).map(Number)) <= 13,
      );
      const m = pfMap(n);
      const V = { n };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which product equals {n}?", "¿Cuál producto es igual a {n}?"], a: pfStr(m),
        w: pfWrongs(m, false),
        x: ["{n} = " + pfStr(m) + ". The other products work out to different numbers.", "{n} = " + pfStr(m) + ". Los otros productos dan números distintos."],
        h: [["Multiply out each choice and compare with {n}.", "Multiplica cada opción y compárala con {n}."], ["Or factor {n} yourself and look for a match.", "O factoriza {n} tú mismo y busca la coincidencia."], ["Watch the exponents: which prime appears more times?", "Fíjate en los exponentes: ¿cuál primo aparece más veces?"]],
        meta: { kind: "product", n },
      });
    },
    countPrime(rng) {
      const n = draw(
        () => rng.int(24, 100),
        (v) =>
          Math.max(...Object.values(pfMap(v))) >= 2 &&
          Object.keys(pfMap(v)).length >= 2 &&
          Math.max(...Object.values(pfMap(v))) !==
            Number(
              Object.keys(pfMap(v)).find(
                (k) => pfMap(v)[Number(k)] === Math.max(...Object.values(pfMap(v))),
              ),
            ),
      );
      const m = pfMap(n);
      const p = Number(Object.keys(m).find((k) => m[Number(k)] === Math.max(...Object.values(m))));
      const c = m[p];
      const V = { n, p, c };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["In the prime factorization of {n}, how many times does the prime {p} appear as a factor?", "En la factorización prima de {n}, ¿cuántas veces aparece el primo {p} como factor?"], a: c,
        w: [[Object.keys(m).length, "repeated-prime-written-once", ["That counts the different primes. Count how many copies of {p} there are.", "Eso cuenta los primos distintos. Cuenta cuántas copias de {p} hay."]], [c + 1, "exponent-off-by-one"], [c - 1 > 0 ? c - 1 : null, "exponent-off-by-one"], [Object.values(m).reduce((s, e) => s + e, 0), "exponent-off-by-one", ["That counts every prime factor, not only {p}. Count just the copies of {p}.", "Eso cuenta todos los factores primos, no solo {p}. Cuenta solo las copias de {p}."]]],
        x: ["{n} = " + pfStr(m) + ", so {p} appears {c} time(s).", "{n} = " + pfStr(m) + ", así que {p} aparece {c} vez/veces."],
        h: [["Find the full prime factorization of {n} first.", "Primero halla la factorización prima completa de {n}."], ["Write repeated primes out, like 2 × 2 × 2.", "Escribe los primos repetidos, como 2 × 2 × 2."], ["Count only the copies of {p}.", "Cuenta solo las copias de {p}."]],
        meta: { kind: "countPrime", n, p },
      });
    },
    largestPrime(rng) {
      const n = draw(
        () => rng.int(100, 300),
        (v) =>
          Object.keys(pfMap(v)).length >= 2 && Math.max(...Object.keys(pfMap(v)).map(Number)) >= 5,
      );
      const m = pfMap(n);
      const ps = Object.keys(m)
        .map(Number)
        .sort((a, b) => a - b);
      const best = ps[ps.length - 1];
      const V = { n, f: pfStr(m) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["What is the greatest prime factor of {n}?", "¿Cuál es el mayor factor primo de {n}?"], a: best,
        w: [[n / ps[0], "factorization-stopped-early", ["That is a big factor, but it is not prime. Keep splitting until the factor is prime.", "Ese es un factor grande, pero no es primo. Sigue dividiendo hasta que el factor sea primo."]], [ps[0], "stopped-at-the-first-prime", ["That is the smallest prime factor. The question asks for the greatest.", "Ese es el menor factor primo. La pregunta pide el mayor."]], [Math.max(...Object.keys(m).map((k) => m[Number(k)] * Number(k))), "exponent-as-multiplication"]],
        x: ["{n} = {f}. The greatest prime in the list is " + best + ".", "{n} = {f}. El mayor primo de la lista es " + best + "."],
        h: [["Find the prime factorization of {n}.", "Halla la factorización prima de {n}."], ["List only the primes that appear.", "Haz la lista de solo los primos que aparecen."], ["Pick the greatest one.", "Elige el mayor."]],
        meta: { kind: "largestPrime", n },
      });
    },
    build(rng) {
      const m = draw(
        () => ({ 2: rng.int(1, 4), 3: rng.int(0, 3), 5: rng.int(0, 2), 7: rng.int(0, 1) }),
        (v) =>
          Object.values(v).filter((e) => e > 0).length >= 2 &&
          Object.values(v).some((e) => e > 1) &&
          pfVal(v) <= 1500,
      );
      const clean = Object.fromEntries(Object.entries(m).filter(([, e]) => e > 0));
      const n = pfVal(clean);
      const V = { f: pfStr(clean) };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return numB(V, {
        q: ["What number has the prime factorization {f}?", "¿Qué número tiene la factorización prima {f}?"], a: n,
        w: [[Object.entries(clean).reduce((v, [p, e]) => v * Number(p) * e, 1), "exponent-as-multiplication", ["That multiplies each prime by its exponent. An exponent means the prime is a factor that many times.", "Eso multiplica cada primo por su exponente. Un exponente significa que el primo es factor esas veces."]], [Object.keys(clean).reduce((v, p) => v * Number(p), 1), "exponent-ignored"], [Object.entries(clean).reduce((v, [p, e]) => v * (Number(p) + e), 1), "exponent-added-to-base", ["That adds each prime and its exponent. Multiply the prime by itself instead.", "Eso suma cada primo y su exponente. Mejor multiplica el primo por sí mismo."]]],
        x: ["Write each power out and multiply: {f} = " + parseProd(pfStr(clean)).join(" × ") + " = " + cm(n) + ".", "Escribe cada potencia y multiplica: {f} = " + parseProd(pfStr(clean)).join(" × ") + " = " + cm(n) + "."],
        h: [["An exponent says how many times a prime is a factor.", "Un exponente dice cuántas veces un primo es factor."], ["Write each power as repeated multiplication.", "Escribe cada potencia como multiplicación repetida."], ["Multiply the factors two at a time.", "Multiplica los factores de dos en dos."]],
        meta: { kind: "build", f: pfStr(clean) },
      });
    },
    compare(rng) {
      const set = draw(
        () =>
          Array.from({ length: 4 }, () => ({
            2: rng.int(1, 4),
            3: rng.int(0, 3),
            5: rng.int(0, 1),
          })).map((o) => Object.fromEntries(Object.entries(o).filter(([, e]) => e > 0))),
        (s) =>
          s.every((m) => Object.keys(m).length >= 2) &&
          new Set(s.map(pfVal)).size === 4 &&
          new Set(s.map(pfStr)).size === 4,
      );
      const vals = set.map(pfVal);
      const best = vals.indexOf(Math.max(...vals));
      const V = { all: set.map((m, i) => `${pfStr(m)} = ${vals[i]}`).join("; ") };
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["Which number is the greatest?", "¿Cuál número es el mayor?"], a: pfStr(set[best]),
        w: set.filter((_, i) => i !== best).map((m) => [pfStr(m), "compared-without-evaluating"]),
        x: ["Multiply each one out: {all}. The greatest is " + vals[best] + ".", "Multiplica cada uno: {all}. El mayor es " + vals[best] + "."],
        h: [["Do not compare the exponents alone.", "No compares solo los exponentes."], ["Write each product as a whole number.", "Escribe cada producto como número entero."], ["Compare the four numbers.", "Compara los cuatro números."]],
        meta: { kind: "compare", set },
      });
    },
    divisible(rng) {
      const m = { 2: rng.int(2, 3), 3: rng.int(1, 2), 5: rng.int(1, 2) };
      const N = pfVal(m);
      const g2 = rng.pick(factorsOf(N).filter((f) => f >= 4 && f < N));
      const V = { f: pfStr(m), N };
      const bads = [
        [ipow(2, m[2] + 1), "needs-more-copies"],
        [2 * ipow(3, m[3] + 1), "needs-more-copies"],
        [ipow(5, m[5] + 1), "needs-more-copies"],
        [14, "prime-not-in-factorization"],
        [22, "prime-not-in-factorization"],
      ];
      // prettier-ignore
      // biome-ignore format: bilingual spec
      return mcB(rng, V, {
        q: ["N = {f}. Which number is a factor of N? (Use the factorization, not a calculator.)", "N = {f}. ¿Cuál número es un factor de N? (Usa la factorización, no una calculadora.)"], a: String(g2),
        w: bads.map(([v, t]) => [String(v), t]),
        x: [`${g2} = ${pfStr(pfMap(g2))} uses only primes and copies that N has, so it divides N.`, `${g2} = ${pfStr(pfMap(g2))} usa solo primos y copias que tiene N, así que divide a N.`],
        h: [["A factor of N can use only the primes in N, and no more copies of each than N has.", "Un factor de N solo puede usar los primos de N, y no más copias de cada uno que las que tiene N."], ["Factor each choice into primes.", "Factoriza cada opción en primos."], ["Compare its primes and exponents with N's.", "Compara sus primos y exponentes con los de N."]],
        meta: { kind: "divisible", m, N },
      });
    },
  };
  G.register("primeFactorization", {
    title: "Prime factorization",
    titleEs: "Factorización prima",
    levels: 4,
    make(rng, level) {
      return pfTypes[rng.pick(PF_TYPES[level])](rng, level);
    },
    check(item) {
      const m = item.meta;
      const isP = (/** @type {number} */ n) =>
        n > 1 && ![...Array(Math.max(0, n - 2)).keys()].some((i) => n % (i + 2) === 0);
      const goodProd = (/** @type {string} */ s, /** @type {number} */ n) => {
        const f = parseProd(s);
        return f.every(isP) && f.reduce((a, b) => a * b, 1) === n;
      };
      switch (m.kind) {
        case "whichPrime": {
          const ok = item.c.map((/** @type {string} */ c) => isP(Number(c)));
          return ok.filter(Boolean).length === 1 && ok[item.a] ? true : "not exactly one prime";
        }
        case "whichComposite": {
          const ok = item.c.map((/** @type {string} */ c) => !isP(Number(c)));
          return ok.filter(Boolean).length === 1 && ok[item.a] ? true : "not exactly one composite";
        }
        case "whyComposite":
          return item.c[item.a].includes("=") && !isP(m.n) ? true : "wrong reason keyed";
        case "factorize":
        case "product": {
          const ok = item.c.map((/** @type {string} */ c) => goodProd(c, m.n));
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : `valid factorizations: ${ok.filter(Boolean).length}`;
        }
        case "countPrime":
          return agree(item, parseProd(pfStr(pfMap(m.n))).filter((p) => p === m.p).length);
        case "largestPrime":
          return agree(item, Math.max(...parseProd(pfStr(pfMap(m.n)))));
        case "build":
          return agree(
            item,
            parseProd(m.f).reduce((a, b) => a * b, 1),
          );
        case "compare": {
          const vals = item.c.map((/** @type {string} */ c) =>
            parseProd(c).reduce((a, b) => a * b, 1),
          );
          const top = Math.max(...vals);
          return vals.filter((/** @type {number} */ v) => v === top).length === 1 &&
            vals[item.a] === top
            ? true
            : "greatest is not the keyed choice";
        }
        case "divisible": {
          const ok = item.c.map((/** @type {string} */ c) => m.N % Number(c) === 0);
          return ok.filter(Boolean).length === 1 && ok[item.a]
            ? true
            : "not exactly one factor of N";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* @@NEXT@@ */
})();
