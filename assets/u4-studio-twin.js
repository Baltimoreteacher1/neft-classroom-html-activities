/**
 * Unit 4 Practice Studio: the "fresh problem" generator (window.U4Twin).
 *
 * When a student answers a hand-built Unit 4 item only after two or more misses, the answer is not yet shown: assets/u4-studio-guess.js
 * asks for one fresh problem on the same skill before the star is earned. The items on the ten pages are authored, so the twin comes
 * from here: four seeded families, one per lesson, matching the page's Bonus Round generator (`bonus.gen`):
 *
 *   pctMeaning  "n of d is what percent?"             4-1
 *   fdp         "write n/d as a percent or decimal"   4-2
 *   partOf      "what is p% of w?"                    4-3, 4-4
 *   wholeOf     "part is p% of what number?"          4-5
 *
 * Pure (no DOM), so tools/unit4-guess.test.mjs can re-derive every answer from the question text. The same seed always gives the same
 * problem; a new seed gives new numbers. A wrong answer is named for the likely mistake and never prints the right answer.
 *
 *   make(family, seed) -> { family, q, qEs, ans, unit, hint, hintEs, check(raw) }
 *   check(raw)         -> { ok: true } | { ok: false, say, sayEs, tag }
 */
(() => {
  const W = /** @type {any} */ (typeof window === "undefined" ? globalThis : window);

  /** mulberry32 */
  function rng(/** @type {number} */ seed) {
    let a = (seed >>> 0) + 0x6d2b79f5;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (/** @type {() => number} */ r, /** @type {any[]} */ list) =>
    list[Math.floor(r() * list.length)];
  const fmt = (/** @type {number} */ n) => String(Math.round(n * 1e6) / 1e6);
  const places = (/** @type {number} */ n) => (fmt(n).split(".")[1] || "").length;
  const gcd = (/** @type {number} */ a, /** @type {number} */ b) => (b ? gcd(b, a % b) : a);
  const near = (/** @type {number} */ a, /** @type {number} */ b) =>
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

  /** "37", " 37 % ", "$1,200", "0.5" -> number; anything else -> NaN. */
  function parse(/** @type {any} */ raw) {
    const t = String(raw ?? "").replace(/[%$,\s]/g, "");
    return /^(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : Number.NaN;
  }

  /** @typedef {{ en: string, es: string, tag?: string }} Say */

  /**
   * @param {string} family @param {string} q @param {string} qEs @param {number} ans @param {string} unit
   * @param {{ en: string, es: string }} hint @param {(v: number) => Say | null} diagnose
   * @param {Say} generic
   */
  function build(family, q, qEs, ans, unit, hint, diagnose, generic) {
    return {
      family,
      q,
      qEs,
      ans,
      unit,
      hint: hint.en,
      hintEs: hint.es,
      check(/** @type {any} */ raw) {
        const v = parse(raw);
        if (Number.isNaN(v)) {
          return {
            ok: false,
            say: "Type a number in the box, then check.",
            sayEs: "Escribe un número en el recuadro y luego revisa.",
            tag: null,
          };
        }
        if (near(v, ans)) return { ok: true };
        const s = diagnose(v) || generic;
        return { ok: false, say: s.en, sayEs: s.es, tag: s.tag || null };
      },
    };
  }

  const SCALE_STORIES = [
    {
      en: (/** @type {number} */ n, /** @type {number} */ d) =>
        `In a bag of ${d} marbles, ${n} are blue. What percent of the marbles are blue?`,
      es: (/** @type {number} */ n, /** @type {number} */ d) =>
        `En una bolsa de ${d} canicas, ${n} son azules. ¿Qué porcentaje de las canicas es azul?`,
    },
    {
      en: (/** @type {number} */ n, /** @type {number} */ d) =>
        `A team played ${d} games and won ${n}. What percent of the games did the team win?`,
      es: (/** @type {number} */ n, /** @type {number} */ d) =>
        `Un equipo jugó ${d} partidos y ganó ${n}. ¿Qué porcentaje de los partidos ganó el equipo?`,
    },
    {
      en: (/** @type {number} */ n, /** @type {number} */ d) =>
        `A grid has ${d} squares. ${n} squares are shaded. What percent of the grid is shaded?`,
      es: (/** @type {number} */ n, /** @type {number} */ d) =>
        `Una cuadrícula tiene ${d} cuadros. ${n} cuadros están sombreados. ¿Qué porcentaje de la cuadrícula está sombreado?`,
    },
  ];

  const FAMILIES = {
    pctMeaning(/** @type {() => number} */ r) {
      const d = pick(r, [2, 4, 5, 10, 20, 25, 50]);
      let n = 1 + Math.floor(r() * (d - 1));
      if (n * 2 === d) n = Math.max(1, n - 1); // not the one-half benchmark
      const ans = (n * 100) / d;
      const s = pick(r, SCALE_STORIES);
      return build(
        "pctMeaning",
        s.en(n, d),
        s.es(n, d),
        ans,
        "%",
        {
          en: "Scale the whole up to 100. What do you multiply the whole by to get 100? Do the same to the part.",
          es: "Lleva el total hasta 100. ¿Por cuánto multiplicas el total para llegar a 100? Haz lo mismo con la parte.",
        },
        (v) => {
          if (v === n)
            return {
              tag: "percent-part-count-as-percent",
              en: "That is the count of the part. It is out of the whole, not out of 100. Rewrite the ratio so the whole is 100.",
              es: "Esa es la cantidad de la parte. Es de todo el total, no de 100. Reescribe la razón para que el total sea 100.",
            };
          if (near(v, n / d))
            return {
              tag: "percent-conversion-skipped",
              en: "That is the part written as a decimal. A percent is out of 100, so scale it to 100.",
              es: "Eso es la parte escrita como decimal. Un porcentaje es de 100, así que llévalo a 100.",
            };
          if (v === d)
            return {
              tag: "percent-total-as-percent",
              en: "That is the whole. The percent tells how many out of 100 are the part.",
              es: "Ese es el total. El porcentaje dice cuántos de cada 100 son la parte.",
            };
          return null;
        },
        {
          tag: "percent-part-count-as-percent",
          en: "A percent is out of 100. Rewrite the ratio so the whole is 100, then read the part.",
          es: "Un porcentaje es de 100. Reescribe la razón para que el total sea 100 y lee la parte.",
        },
      );
    },

    fdp(/** @type {() => number} */ r) {
      /** @type {[number, number][]} */
      const pairs = [];
      for (const d of [2, 4, 5, 8, 10, 20, 25, 40, 50])
        for (let n = 1; n < d; n++) {
          if (gcd(n, d) !== 1) continue;
          const dec = n / d;
          if (places(dec) <= 3 && places(dec * 100) <= 2 && dec !== 0.5) pairs.push([n, d]);
        }
      const [n, d] = pick(r, pairs);
      const dec = n / d;
      const asPct = r() < 0.6;
      const ans = asPct ? dec * 100 : dec;
      return build(
        "fdp",
        `Write ${n}/${d} as a ${asPct ? "percent" : "decimal"}.`,
        `Escribe ${n}/${d} como ${asPct ? "porcentaje" : "decimal"}.`,
        Math.round(ans * 1e6) / 1e6,
        asPct ? "%" : "",
        asPct
          ? {
              en: "Divide the top number by the bottom number to get a decimal. Then ask: how many out of 100?",
              es: "Divide el número de arriba entre el de abajo para obtener un decimal. Luego pregunta: ¿cuántos de cada 100?",
            }
          : {
              en: "A fraction is a division. Divide the top number by the bottom number.",
              es: "Una fracción es una división. Divide el número de arriba entre el de abajo.",
            },
        (v) => {
          if (asPct && near(v, dec))
            return {
              tag: "percent-conversion-skipped",
              en: "That is the decimal. A percent says how many out of 100, so scale the decimal to 100.",
              es: "Eso es el decimal. Un porcentaje dice cuántos de cada 100, así que lleva el decimal a 100.",
            };
          if (!asPct && near(v, dec * 100))
            return {
              tag: "percent-conversion-skipped",
              en: "That is the percent. A decimal is the percent divided by 100.",
              es: "Eso es el porcentaje. Un decimal es el porcentaje dividido entre 100.",
            };
          if (near(v, asPct ? (d / n) * 100 : d / n))
            return {
              tag: "fraction-part-whole-misread",
              en: "Check which number you divide by. The top number is the part, so it is divided by the bottom number.",
              es: "Revisa entre qué número divides. El número de arriba es la parte, así que se divide entre el de abajo.",
            };
          return null;
        },
        {
          tag: "pest-percent-fraction-mismatch",
          en: "Divide the top number by the bottom number first. Then check that your answer matches the size of the fraction.",
          es: "Primero divide el número de arriba entre el de abajo. Luego revisa que tu respuesta coincida con el tamaño de la fracción.",
        },
      );
    },

    partOf(/** @type {() => number} */ r) {
      const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
      const w = pick(r, [40, 60, 80, 120, 140, 160, 180, 200, 240, 300, 360, 400, 500]);
      const part = (p * w) / 100;
      if (places(part) > 2 || part === 100) return FAMILIES.partOf(r);
      return build(
        "partOf",
        `What is ${p}% of ${w}?`,
        `¿Cuánto es el ${p}% de ${w}?`,
        part,
        "",
        {
          en: `Write ${p}% as a decimal. Then multiply it by ${w}.`,
          es: `Escribe ${p}% como decimal. Luego multiplícalo por ${w}.`,
        },
        (v) => {
          if (near(v, p * w))
            return {
              tag: "percent-used-as-whole-number",
              en: "You used the percent as a plain number. A percent means out of 100, so write it as a decimal first.",
              es: "Usaste el porcentaje como un número común. Un porcentaje es de 100, así que escríbelo primero como decimal.",
            };
          if (near(v, w / p))
            return {
              tag: "pof-divided-by-percent-number",
              en: "You divided by the percent number. A percent of a number is a multiplication by the percent written as a decimal.",
              es: "Dividiste entre el número del porcentaje. Un porcentaje de un número es una multiplicación por el porcentaje escrito como decimal.",
            };
          if (near(v, w - part))
            return {
              tag: "percent-wrong-part-named",
              en: "That is the amount left over. Underline which part the question asks about.",
              es: "Esa es la cantidad que sobra. Subraya qué parte pide la pregunta.",
            };
          if (v === p || v === w)
            return {
              tag: "percent-wrong-part-named",
              en: "That number is in the question. Find the part of the whole that the percent names.",
              es: "Ese número ya está en la pregunta. Halla la parte del total que nombra el porcentaje.",
            };
          return null;
        },
        {
          tag: "pof-percent-wrong-decimal",
          en: "Percent means out of 100. Divide the percent number by 100 to get the decimal, then check that your answer is smaller than the whole.",
          es: "Porcentaje significa de cada 100. Divide el número del porcentaje entre 100 para obtener el decimal y revisa que tu respuesta sea menor que el total.",
        },
      );
    },

    wholeOf(/** @type {() => number} */ r) {
      const p = pick(r, [10, 20, 25, 40, 50, 60, 75, 80]);
      const whole = pick(r, [40, 60, 80, 120, 140, 160, 200, 240, 300, 400]);
      const part = (p * whole) / 100;
      if (places(part) > 0) return FAMILIES.wholeOf(r);
      return build(
        "wholeOf",
        `${part} is ${p}% of a number. What is the number?`,
        `${part} es el ${p}% de un número. ¿Cuál es el número?`,
        whole,
        "",
        {
          en: "The number you are given is the part. Divide the part by the percent written as a decimal.",
          es: "El número que te dan es la parte. Divide la parte entre el porcentaje escrito como decimal.",
        },
        (v) => {
          if (near(v, (part * p) / 100))
            return {
              tag: "whole-percent-taken-of-part",
              en: "That finds the percent of the number you were given. But that number is already the percent piece. Ask: is the number I was given the part or the whole?",
              es: "Eso halla el porcentaje del número que te dieron. Pero ese número ya es la parte del porcentaje. Pregunta: ¿el número que me dieron es la parte o el total?",
            };
          if (near(v, part + (part * p) / 100))
            return {
              tag: "whole-percent-added-to-part",
              en: "The part already is a percent of the whole. Write part = percent × whole, then undo the multiplication.",
              es: "La parte ya es un porcentaje del total. Escribe parte = porcentaje × total y luego deshaz la multiplicación.",
            };
          if (near(v, part / p) || near(v, part * p))
            return {
              tag: "whole-percent-decimal-misplaced",
              en: "Percent means out of 100, so write the percent as a decimal first. Then check that the whole is bigger than the part.",
              es: "Porcentaje significa de cada 100, así que primero escribe el porcentaje como decimal. Luego revisa que el total sea mayor que la parte.",
            };
          if (v < part)
            return {
              tag: "whole-smaller-than-part",
              en: "Compare the percent with 100%. Less than 100% means the whole is bigger than the part.",
              es: "Compara el porcentaje con 100%. Menos de 100% significa que el total es mayor que la parte.",
            };
          return null;
        },
        {
          tag: "whole-answer-not-checked",
          en: "Check backward: take the percent of your answer. If you do not get the part, try again.",
          es: "Revisa al revés: halla el porcentaje de tu respuesta. Si no obtienes la parte, intenta otra vez.",
        },
      );
    },
  };

  /** @param {string} family @param {number} seed */
  function make(family, seed) {
    const f = /** @type {any} */ (FAMILIES)[family];
    if (typeof f !== "function") return null;
    return f(rng(seed));
  }

  W.U4Twin = { families: Object.keys(FAMILIES), make, parse };
})();
