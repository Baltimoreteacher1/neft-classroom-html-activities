/**
 * Practice Studio generators: problem SHAPES for Unit 7 (lessons 7-1 to 7-9).
 *
 * coordinate.js registers the eight generators with their forward problems. This file adds the other shapes a lesson
 * can ask for, using the toolkit coordinate.js exposes (StudioGen.coordKit):
 *
 *   reverse      the result is given, the student names the starting point or number
 *   which-input  the student picks the input (a split, a pair, a vertex set) that makes a stated result true
 *   compare-two  the student compares two numbers, routes, balances or shapes
 *
 * Every template keeps the same contract as the forward ones: make() computes with arithmetic, check() re-derives the
 * key from item.meta or from the choice text by a different route. Wrong answers use tags the studios already name;
 * the five taxonomy ids written out here get their feedback below. Feedback explains the slip and never prints the key.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  const K = G.coordKit;
  const { S, P, M, f, bad, badEs, Q, X, H, mcq, numq, judge, typed, pairOf, near, DL } = K;
  const { oppOf, steps, angQ, ROMAN, ptIn, SG, NAMES, offAxes, isRefl, AXN } = K;

  Object.assign(K.FB, {
    "number-line-misread": [
      "With this split the number lands between two ticks. Look at the denominator of the number.",
      "Con esta división el número cae entre dos marcas. Mira el denominador del número.",
    ],
    "integer-order-by-size": [
      "Compare where the numbers sit on the number line. Owing more, or being colder, is farther left of 0. Having more is farther right.",
      "Compara dónde están los números en la recta numérica. Deber más, o tener más frío, queda más a la izquierda del 0. Tener más queda más a la derecha.",
    ],
    "compare-assumed-equal": [
      "These two are not at the same point on the number line. Find where each one sits.",
      "Estos dos no están en el mismo punto de la recta numérica. Busca dónde está cada uno.",
    ],
    "coord-quadrant-mixup": [
      "Check the signs of both coordinates of this point, then compare them with the other points.",
      "Revisa los signos de las dos coordenadas de este punto y compáralos con los otros puntos.",
    ],
    "measure-area-perimeter-swap": [
      "That rectangle wins on the other measure. Find the one the question asks for, for both rectangles, then compare.",
      "Ese rectángulo gana en la otra medida. Halla la que pide la pregunta, para los dos rectángulos, y luego compara.",
    ],
  });

  /* ---- small helpers -------------------------------------------------------------------------------- */
  const MAG = [
    [2, 15],
    [10, 30],
    [20, 50],
    [30, 99],
  ];
  const mag = (rng, lv) => rng.int(MAG[lv - 1][0], MAG[lv - 1][1]);
  const sg = (rng) => rng.pick([-1, 1]);
  /** A value k/den as text in the form "frac", "mixed" or "dec" (true minus). */
  const rtxt = (k, den, form) => {
    const a = Math.abs(k);
    let body = f(a / den);
    if (form === "frac") body = G.frac(a, den);
    if (form === "mixed") body = G.mixed(a, den);
    return (k < 0 ? M : "") + body;
  };
  /** Tenths, quarters, halves and fifths scaled to twentieths: exact integers for comparing. */
  const tw = (t) => Math.round(G.value(t) * 20);
  /** All "(x, y)" pairs in a choice, as numbers. */
  const pairsIn = (c) =>
    [...String(c).matchAll(/\(([^,()]+), ([^()]+)\)/g)].map((m) => [G.value(m[1]), G.value(m[2])]);

  /* ===== integerOpposites ============================================================================= */
  K.addShapes("integerOpposites", {
    opRev: {
      shape: "reverse",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const m = mag(rng, lv) * sg(rng);
        const ans = -m;
        const q = rng.pick([
          [
            `The opposite of a number is ${S(m)}. What is the number?`,
            `El opuesto de un número es ${S(m)}. ¿Cuál es el número?`,
          ],
          [
            `Point B is the opposite of point A. Point B is at ${S(m)} on a number line. Where is point A?`,
            `El punto B es el opuesto del punto A. El punto B está en ${S(m)} en una recta numérica. ¿Dónde está el punto A?`,
          ],
          [
            `A diver and a gull are at opposite readings. The gull is at ${S(m)}. What is the diver's reading?`,
            `Un buzo y una gaviota están en lecturas opuestas. La gaviota está en ${S(m)}. ¿Cuál es la lectura del buzo?`,
          ],
          [
            `Two readings are opposites. One reading is ${S(m)}. What is the other reading?`,
            `Dos lecturas son opuestas. Una lectura es ${S(m)}. ¿Cuál es la otra lectura?`,
          ],
          [
            `On a number line, ${S(m)} is the opposite of a point. What number is that point?`,
            `En una recta numérica, ${S(m)} es el opuesto de un punto. ¿Cuál es el número de ese punto?`,
          ],
          [
            `A hiker is ${S(m)} meters from sea level. The reading is the opposite of another point. What is the other reading?`,
            `Un excursionista está a ${S(m)} metros del nivel del mar. La lectura es el opuesto de otro punto. ¿Cuál es la otra lectura?`,
          ],
          [
            `The opposite of ${S(m)} is the number at point C. What number is at point C?`,
            `El opuesto de ${S(m)} es el número del punto C. ¿Qué número está en el punto C?`,
          ],
          [
            `A temperature is ${S(m)} degrees. Its opposite is recorded at another station. What is that reading?`,
            `Una temperatura es de ${S(m)} grados. Su opuesto se registra en otra estación. ¿Cuál es esa lectura?`,
          ],
        ]);
        return numq({
          ...Q(...q),
          a: ans,
          fw: [
            bad(m, "same-number"),
            bad(2 * ans, "doubled-distance"),
            bad(ans + (ans > 0 ? -1 : 1), "off-by-one"),
          ],
          ...X(
            `${S(m)} and ${S(ans)} are the same distance from 0 on opposite sides, so they are opposites. The number is ${S(ans)}.`,
            `${S(m)} y ${S(ans)} están a la misma distancia del 0, en lados opuestos, así que son opuestos. El número es ${S(ans)}.`,
          ),
          ...H(
            [
              "Opposites are the same distance from 0 on opposite sides.",
              "Los opuestos están a la misma distancia del 0, en lados opuestos.",
            ],
            [
              `Count how far ${S(m)} is from 0. The other number is that far away on the other side.`,
              `Cuenta qué tan lejos del 0 está ${S(m)}. El otro número está igual de lejos, del otro lado.`,
            ],
            [
              "Change the side of 0. Keep the distance the same.",
              "Cambia el lado del 0. Deja la distancia igual.",
            ],
          ),
          meta: { m },
        });
      },
      check: (item) => typed(item, oppOf(item.meta.m)),
    },

    opPair: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const n = Math.max(2, mag(rng, lv)) * sg(rng);
        const pair = (a, b, flip) => {
          const t = flip ? [b, a] : [a, b];
          return [`${t[0]} and ${t[1]}`, `${t[0]} y ${t[1]}`];
        };
        const flip = rng.chance(0.5);
        const inv = `${n < 0 ? M : ""}1/${Math.abs(n)}`;
        const mk = (a, b) => {
          const [en, es] = pair(a, b, flip);
          return { v: en, vEs: es };
        };
        return mcq(rng, {
          ...Q("Which pair of numbers are opposites?", "¿Cuál par de números son opuestos?"),
          right: mk(S(n), S(-n)),
          wrong: [
            badEs(...Object.values(mk(S(n), S(n))), "same-number"),
            badEs(...Object.values(mk(S(n), inv)), "reciprocal"),
            badEs(...Object.values(mk(S(n), S(-n - Math.sign(n)))), "off-by-one"),
          ],
          ...X(
            `Opposites are the same distance from 0 on opposite sides. ${S(n)} and ${S(-n)} add to 0, so they are opposites.`,
            `Los opuestos están a la misma distancia del 0, en lados opuestos. ${S(n)} y ${S(-n)} suman 0, así que son opuestos.`,
          ),
          ...H(
            [
              "Opposites are on opposite sides of 0.",
              "Los opuestos están en lados opuestos del 0.",
            ],
            [
              "Opposites are also the same distance from 0.",
              "Los opuestos también están a la misma distancia del 0.",
            ],
            ["Two opposites add to 0. Test each pair.", "Dos opuestos suman 0. Prueba cada par."],
          ),
          meta: { n },
        });
      },
      check: (item) =>
        judge(item, (c) => {
          const m = /^(.+) (?:and|y) (.+)$/.exec(String(c));
          return !!m && near(G.value(m[1]) + G.value(m[2]), 0);
        }),
    },
  });

  /** Kinds of equal parts a unit can be cut into; n is the number of parts. */
  const PARTS = [
    { n: 2, en: "halves", es: "medios" },
    { n: 3, en: "thirds", es: "tercios" },
    { n: 4, en: "fourths", es: "cuartas partes" },
    { n: 5, en: "fifths", es: "quintos" },
    { n: 7, en: "sevenths", es: "séptimos" },
    { n: 8, en: "eighths", es: "octavos" },
    { n: 10, en: "tenths", es: "décimos" },
  ];

  /* ===== rationalNumberLine =========================================================================== */
  K.addShapes("rationalNumberLine", {
    ratZoom: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const d = rng.pick(lv === 1 ? [2, 4] : lv === 2 ? [2, 4, 5] : [2, 4, 5, 10]);
        let k;
        do k = rng.int(1, d * (lv + 1) - 1);
        while (G.gcd(k, d) !== 1);
        const neg = rng.chance(0.55);
        const form = k > d ? rng.pick(["frac", "mixed", "dec"]) : rng.pick(["frac", "dec"]);
        const t = rtxt(neg ? -k : k, d, form);
        const right = rng.pick(PARTS.filter((p) => p.n % d === 0));
        // sevenths is never right for halves, fourths, fifths or tenths; it keeps the key from being the longest word
        const pool = PARTS.filter((p) => p.n % d !== 0 && p.n !== 7);
        const wrong = [PARTS.find((p) => p.n === 7), ...rng.shuffle(pool).slice(0, 2)];
        const frac = `${neg ? M : ""}${G.frac(k, d)}`;
        return mcq(rng, {
          ...Q(
            `Each unit of a number line is cut into equal parts. Which parts put ${t} exactly on a tick?`,
            `Cada unidad de una recta numérica se corta en partes iguales. ¿Cuáles partes ponen ${t} exactamente en una marca?`,
          ),
          right: { v: right.en, vEs: right.es },
          wrong: wrong.map((p) => badEs(p.en, p.es, "number-line-misread")),
          ...X(
            `${t} is ${frac} in lowest terms. Cutting each unit into ${right.en} makes ticks every 1/${right.n}, and ${right.n} is a multiple of ${d}, so ${t} lands exactly on a tick.`,
            `${t} es ${frac} en su mínima expresión. Cortar cada unidad en ${right.es} pone marcas cada 1/${right.n}, y ${right.n} es múltiplo de ${d}, así que ${t} cae exactamente en una marca.`,
          ),
          ...H(
            [
              "Write the number as a fraction in lowest terms.",
              "Escribe el número como fracción en su mínima expresión.",
            ],
            [
              "Cutting a unit into n equal parts puts a tick at every 1/n.",
              "Cortar una unidad en n partes iguales pone una marca en cada 1/n.",
            ],
            [
              "Test each choice. Does a tick land exactly on the number?",
              "Prueba cada opción. ¿Una marca cae exactamente en el número?",
            ],
          ),
          meta: { num: t },
        });
      },
      check(item) {
        const v = G.value(item.meta.num);
        return judge(item, (c) => {
          const n = PARTS.find((p) => p.en === c).n;
          return Math.abs(v * n - Math.round(v * n)) < 1e-9;
        });
      },
    },

    ratFar: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const lim = [2, 3, 4, 6][lv - 1];
        const one = () => {
          const d = rng.pick(lv === 1 ? [2, 4] : [2, 4, 5, 10]);
          return { k: rng.int(1, lim * d) * sg(rng), d };
        };
        for (let i = 0; i < 400; i++) {
          const a = one();
          const b = one();
          const va = a.k / a.d;
          const vb = b.k / b.d;
          if (Math.abs(va - vb) < 0.2) continue;
          const A = rtxt(
            a.k,
            a.d,
            rng.pick(Math.abs(a.k) > a.d ? ["frac", "mixed", "dec"] : ["frac", "dec"]),
          );
          const B = rtxt(
            b.k,
            b.d,
            rng.pick(Math.abs(b.k) > b.d ? ["frac", "mixed", "dec"] : ["frac", "dec"]),
          );
          if (A === B) continue;
          const lowest = va < vb ? A : B;
          const highest = va < vb ? B : A;
          return mcq(rng, {
            ...Q(
              `Which number is farther to the left on a number line: ${A} or ${B}?`,
              `¿Cuál número está más a la izquierda en una recta numérica: ${A} o ${B}?`,
            ),
            right: lowest,
            wrong: [
              bad(highest, va < 0 && vb < 0 ? "negatives-by-digit" : "misordered"),
              badEs("They are at the same point", "Están en el mismo punto", "thought-equal"),
            ],
            ...X(
              `${lowest} is farther left, because it is the lesser number on the number line.`,
              `${lowest} está más a la izquierda, porque es el número menor en la recta numérica.`,
            ),
            ...H(
              [
                "Write both numbers in the same form, such as decimals.",
                "Escribe los dos números en la misma forma, como decimales.",
              ],
              [
                "The number line grows to the right. The lesser number is farther left.",
                "La recta numérica crece hacia la derecha. El número menor está más a la izquierda.",
              ],
              [
                "Place both on a number line. Which one is left of the other?",
                "Ubica los dos en una recta numérica. ¿Cuál queda a la izquierda del otro?",
              ],
            ),
            meta: { A, B },
          });
        }
        throw new Error("ratFar: no pair");
      },
      check(item) {
        const a = tw(item.meta.A);
        const b = tw(item.meta.B);
        return judge(item, (c) =>
          /same point|mismo punto/.test(c) ? a === b : a !== b && tw(c) === Math.min(a, b),
        );
      },
    },
  });

  /* ===== absoluteValue ================================================================================ */
  K.addShapes("absoluteValue", {
    absWhich: {
      shape: "reverse",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const t =
          lv === 1
            ? String(rng.int(2, 9))
            : lv === 2
              ? String(rng.int(10, 40))
              : lv === 3
                ? f(rng.int(1, 9) + rng.pick([0.5, 0.25, 0.75, 0.2, 0.4]))
                : `${rng.pick([3, 5, 7, 9, 11])}/${rng.pick([2, 4])}`;
        const d = G.value(t);
        return mcq(rng, {
          ...Q(
            `Which numbers x make |x| = ${t} true?`,
            `¿Cuáles números x hacen verdadero |x| = ${t}?`,
          ),
          right: { v: `${t} and ${M}${t}`, vEs: `${t} y ${M}${t}` },
          wrong: [
            badEs(`${t} only`, `solo ${t}`, "only-one-side"),
            badEs(`${M}${t} only`, `solo ${M}${t}`, "only-one-side"),
            badEs(`0, ${t} and ${M}${t}`, `0, ${t} y ${M}${t}`, "counted-endpoints"),
          ],
          ...X(
            `|x| = ${t} means x is ${t} units from 0. That is true at ${t} on the right and at ${M}${t} on the left.`,
            `|x| = ${t} significa que x está a ${t} unidades del 0. Eso pasa en ${t}, a la derecha, y en ${M}${t}, a la izquierda.`,
          ),
          ...H(
            ["|x| is the distance from x to 0.", "|x| es la distancia de x a 0."],
            [
              `Find numbers that are ${t} units from 0 on the number line.`,
              `Busca números que estén a ${t} unidades del 0 en la recta numérica.`,
            ],
            [
              "A distance can go to the right of 0 or to the left of 0.",
              "Una distancia puede ir a la derecha del 0 o a la izquierda del 0.",
            ],
          ),
          meta: { d, num: t },
        });
      },
      check(item) {
        const d = G.value(item.meta.num);
        return judge(item, (c) => {
          const vals = String(c)
            .replace(/,| and | y |only|solo/g, " ")
            .trim()
            .split(/\s+/)
            .map((s) => G.value(s));
          return (
            vals.length === 2 &&
            vals.every((v) => near(Math.abs(v), d)) &&
            near(vals[0] + vals[1], 0)
          );
        });
      },
    },

    absFar: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const dens = lv < 3 ? [1] : [2, 4, 5, 10];
        const lim = [9, 20, 6, 9][lv - 1];
        for (let i = 0; i < 400; i++) {
          const d1 = rng.pick(dens);
          const d2 = rng.pick(dens);
          const a = { k: rng.int(1, lim * d1) * sg(rng), d: d1 };
          const b = { k: rng.int(1, lim * d2) * sg(rng), d: d2 };
          const ma = Math.abs(a.k) / a.d;
          const mb = Math.abs(b.k) / b.d;
          if (Math.abs(ma - mb) < 0.2) continue;
          const form = () => (lv >= 3 ? rng.pick(["frac", "dec"]) : "dec");
          const A = rtxt(a.k, a.d, form());
          const B = rtxt(b.k, b.d, form());
          if (A === B) continue;
          const farther = ma > mb ? A : B;
          return mcq(rng, {
            ...Q(
              `Which number is farther from 0 on a number line: ${A} or ${B}?`,
              `¿Cuál número está más lejos del 0 en una recta numérica: ${A} o ${B}?`,
            ),
            right: farther,
            wrong: [
              bad(ma > mb ? B : A, "misread-distance"),
              badEs(
                "They are the same distance",
                "Están a la misma distancia",
                "compare-assumed-equal",
              ),
            ],
            ...X(
              `${farther} is ${f(Math.max(ma, mb))} units from 0 and the other is ${f(Math.min(ma, mb))} units from 0, so ${farther} is farther. Farther from 0 does not mean farther right.`,
              `${farther} está a ${f(Math.max(ma, mb))} unidades del 0 y el otro está a ${f(Math.min(ma, mb))} unidades del 0, así que ${farther} está más lejos. Más lejos del 0 no significa más a la derecha.`,
            ),
            ...H(
              ["Distance from 0 is the absolute value.", "La distancia al 0 es el valor absoluto."],
              [
                "Find the absolute value of each number first.",
                "Primero halla el valor absoluto de cada número.",
              ],
              [
                "Compare the two distances. Ignore which side of 0 each number is on.",
                "Compara las dos distancias. No importa de qué lado del 0 esté cada número.",
              ],
            ),
            meta: { A, B },
          });
        }
        throw new Error("absFar: no pair");
      },
      check(item) {
        const a = Math.abs(tw(item.meta.A));
        const b = Math.abs(tw(item.meta.B));
        return judge(item, (c) =>
          /same distance|misma distancia/.test(c)
            ? a === b
            : a !== b && Math.abs(tw(c)) === Math.max(a, b),
        );
      },
    },
  });

  /* ===== compareOrder ================================================================================= */
  K.addShapes("compareOrder", {
    cmpBetween: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const a = rng.int(lv === 1 ? 6 : 8, lv === 1 ? 9 : lv === 2 ? 20 : lv === 3 ? 35 : 60);
        const b = rng.int(1, Math.max(2, Math.floor(a / 3)));
        const r = b + rng.int(1, a - b - 1);
        const lo = -a;
        const hi = -b;
        const right = -r;
        const digitsBetween = r; // positive: sits between the digits, ignoring signs
        const below = -(a + rng.int(1, 3));
        const above = -Math.max(0, b - rng.int(1, 2));
        return mcq(rng, {
          ...Q(
            `Which number makes this true?  ${S(lo)} < ___ < ${S(hi)}`,
            `¿Cuál número hace verdadera esta desigualdad?  ${S(lo)} < ___ < ${S(hi)}`,
          ),
          right: S(right),
          wrong: [
            bad(S(digitsBetween), "ordered-by-size"),
            bad(S(below), "negatives-by-digit"),
            bad(S(above), "misordered"),
          ],
          ...X(
            `On the number line, ${S(right)} is to the right of ${S(lo)} and to the left of ${S(hi)}, so it is between them.`,
            `En la recta numérica, ${S(right)} está a la derecha de ${S(lo)} y a la izquierda de ${S(hi)}, así que está entre los dos.`,
          ),
          ...H(
            [
              "Picture the number line. The number must be right of the first and left of the second.",
              "Imagina la recta numérica. El número debe estar a la derecha del primero y a la izquierda del segundo.",
            ],
            [
              "Check the sign of each choice before you look at its digits.",
              "Revisa el signo de cada opción antes de mirar sus dígitos.",
            ],
            [
              "Test each choice with both symbols: is it greater than the first, and less than the second?",
              "Prueba cada opción con los dos símbolos: ¿es mayor que el primero y menor que el segundo?",
            ],
          ),
          meta: { lo, hi },
        });
      },
      check: (item) => judge(item, (c) => item.meta.lo < G.value(c) && G.value(c) < item.meta.hi),
    },

    cmpOwes: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const [n1, n2] = rng.shuffle(NAMES).slice(0, 2);
        const lim = [30, 50, 80, 99][lv - 1];
        const ask = rng.pick(
          lv < 3 ? ["owes-more", "has-less"] : ["owes-more", "has-less", "has-more"],
        );
        let a;
        let b;
        do {
          a = -rng.int(5, lim);
          b = ask === "has-more" && rng.chance(0.5) ? rng.int(5, lim) : -rng.int(5, lim);
        } while (Math.abs(a - b) < 5);
        const Q1 = {
          "owes-more": ["Who owes more money?", "¿Quién debe más dinero?"],
          "has-less": ["Who has less money?", "¿Quién tiene menos dinero?"],
          "has-more": ["Who has more money?", "¿Quién tiene más dinero?"],
        }[ask];
        const lowest = a < b;
        const win = ask === "has-more" ? (a > b ? n1 : n2) : lowest ? n1 : n2;
        const lose = win === n1 ? n2 : n1;
        const said = (n) => `${n}'s balance is ${DL(n === n1 ? a : b)}`;
        const saidEs = (n) => `El saldo de ${n} es ${DL(n === n1 ? a : b)}`;
        return mcq(rng, {
          ...Q(`${said(n1)}. ${said(n2)}. ${Q1[0]}`, `${saidEs(n1)}. ${saidEs(n2)}. ${Q1[1]}`),
          right: win,
          wrong: [
            bad(lose, "integer-order-by-size"),
            badEs("They are equal", "Son iguales", "compare-assumed-equal"),
          ],
          ...X(
            `${DL(a)} and ${DL(b)} are different points on the number line. ${win} is ${ask === "has-more" ? "farther right, so has more money" : "farther left, so has less money and owes more"}.`,
            `${DL(a)} y ${DL(b)} son puntos distintos en la recta numérica. ${win} está ${ask === "has-more" ? "más a la derecha, así que tiene más dinero" : "más a la izquierda, así que tiene menos dinero y debe más"}.`,
          ),
          ...H(
            [
              "A negative balance means money is owed. Place each balance on a number line.",
              "Un saldo negativo significa que se debe dinero. Ubica cada saldo en una recta numérica.",
            ],
            [
              "Farther left means less. Farther right means more.",
              "Más a la izquierda es menos. Más a la derecha es más.",
            ],
            [
              "Which balance is farther left? Which is farther right?",
              "¿Cuál saldo está más a la izquierda? ¿Cuál está más a la derecha?",
            ],
          ),
          meta: { n1, n2, a, b, ask },
        });
      },
      check(item) {
        const { n1, n2, a, b, ask } = item.meta;
        const pos = (v) => steps(-100, v);
        const want = ask === "has-more" ? (pos(a) > pos(b) ? n1 : n2) : pos(a) < pos(b) ? n1 : n2;
        return judge(item, (c) => c === want);
      },
    },
  });

  /* ===== quadrantId =================================================================================== */
  const pairTxt = (x, y) => P(x, y);
  K.addShapes("quadrantId", {
    quadRev: {
      shape: "reverse",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const q = rng.int(1, 4);
        const [x, y] = ptIn(rng, q, [5, 8, 10, 12][lv - 1]);
        const side = x < 0 ? ["left", "izquierda"] : ["right", "derecha"];
        const vert = y < 0 ? ["below", "debajo de"] : ["above", "arriba de"];
        return mcq(rng, {
          ...Q(
            `A point is ${Math.abs(x)} units to the ${side[0]} of the y-axis and ${Math.abs(y)} units ${vert[0]} the x-axis. Which ordered pair names it?`,
            `Un punto está a ${Math.abs(x)} unidades a la ${side[1]} del eje y y a ${Math.abs(y)} unidades ${vert[1]}l eje x. ¿Cuál par ordenado lo nombra?`
              .replace("debajo del", "debajo del")
              .replace("arriba del", "arriba del"),
          ),
          right: pairTxt(x, y),
          wrong: [
            bad(pairTxt(y, x), "swapped-x-y"),
            bad(pairTxt(-x, y), "x-sign-wrong"),
            bad(pairTxt(x, -y), "y-sign-wrong"),
          ],
          ...X(
            `The distance from the y-axis is the x-coordinate: ${Math.abs(x)} units ${side[0]} makes x = ${S(x)}. The distance from the x-axis is the y-coordinate: ${Math.abs(y)} units ${vert[0]} makes y = ${S(y)}. The pair is ${P(x, y)}.`,
            `La distancia al eje y es la coordenada x: ${Math.abs(x)} unidades a la ${side[1]} dan x = ${S(x)}. La distancia al eje x es la coordenada y: ${Math.abs(y)} unidades ${vert[1]}l eje x dan y = ${S(y)}. El par es ${P(x, y)}.`,
          ),
          ...H(
            [
              "An ordered pair is (x, y). The x-coordinate comes first.",
              "Un par ordenado es (x, y). La coordenada x va primero.",
            ],
            [
              "Left or right of the y-axis gives x. Above or below the x-axis gives y.",
              "Izquierda o derecha del eje y da x. Arriba o debajo del eje x da y.",
            ],
            [
              "Left and below are negative. Right and above are positive.",
              "Izquierda y abajo son negativos. Derecha y arriba son positivos.",
            ],
          ),
          meta: {
            dx: Math.abs(x),
            sx: x < 0 ? "left" : "right",
            dy: Math.abs(y),
            sy: y < 0 ? "below" : "above",
          },
        });
      },
      check(item) {
        const { dx, sx, dy, sy } = item.meta;
        let x = 0;
        for (let i = 0; i < dx; i++) x += sx === "left" ? -1 : 1;
        let y = 0;
        for (let i = 0; i < dy; i++) y += sy === "below" ? -1 : 1;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && v[0] === x && v[1] === y;
        });
      },
    },

    quadPairIn: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const target = rng.int(1, 4);
        const m = [5, 8, 10, 12][lv - 1];
        const pts = [1, 2, 3, 4].map((q) => ptIn(rng, q, m));
        const tag = (q) => {
          const dx = SG[q][0] !== SG[target][0];
          const dy = SG[q][1] !== SG[target][1];
          return dx && dy ? "both-signs-wrong" : dx ? "x-sign-wrong" : "y-sign-wrong";
        };
        const [tx, ty] = pts[target - 1];
        return mcq(rng, {
          ...Q(
            `Which ordered pair is in Quadrant ${ROMAN[target - 1]}?`,
            `¿Cuál par ordenado está en el Cuadrante ${ROMAN[target - 1]}?`,
          ),
          right: pairTxt(tx, ty),
          wrong: [1, 2, 3, 4]
            .filter((q) => q !== target)
            .map((q) => bad(pairTxt(...pts[q - 1]), tag(q))),
          ...X(
            `Quadrant ${ROMAN[target - 1]} has x ${tx < 0 ? "negative" : "positive"} and y ${ty < 0 ? "negative" : "positive"}. Only ${P(tx, ty)} has those signs.`,
            `El Cuadrante ${ROMAN[target - 1]} tiene x ${tx < 0 ? "negativa" : "positiva"} y y ${ty < 0 ? "negativa" : "positiva"}. Solo ${P(tx, ty)} tiene esos signos.`,
          ),
          ...H(
            [
              "Quadrants are numbered I to IV, going counterclockwise from the upper right.",
              "Los cuadrantes se numeran de I a IV, en sentido contrario a las agujas del reloj, desde arriba a la derecha.",
            ],
            [
              "Decide the sign of x and the sign of y for that quadrant.",
              "Decide el signo de x y el signo de y para ese cuadrante.",
            ],
            [
              "Check the signs of both numbers in each pair.",
              "Revisa los signos de los dos números de cada par.",
            ],
          ),
          meta: {},
        });
      },
      check(item) {
        const target = ROMAN.indexOf(/Quadrant (IV|I{1,3})/.exec(item.q)[1]) + 1;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && angQ(v[0], v[1]) === target;
        });
      },
    },

    quadOdd: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const q = rng.int(1, 4);
        const q2 = rng.pick([1, 2, 3, 4].filter((n) => n !== q));
        const m = [5, 8, 10, 12][lv - 1];
        const same = [0, 1, 2].map(() => ptIn(rng, q, m));
        const odd = ptIn(rng, q2, m);
        const seen = new Set(same.concat([odd]).map((p) => p.join()));
        if (seen.size < 4) return this.make(rng, lv);
        const dx = SG[q][0] !== SG[q2][0];
        const dy = SG[q][1] !== SG[q2][1];
        return mcq(rng, {
          ...Q(
            "Three of these points are in the same quadrant. Which point is in a different quadrant?",
            "Tres de estos puntos están en el mismo cuadrante. ¿Cuál punto está en un cuadrante distinto?",
          ),
          right: pairTxt(...odd),
          wrong: same.map((p) => bad(pairTxt(...p), "coord-quadrant-mixup")),
          ...X(
            `${P(...odd)} has ${dx ? `x ${odd[0] < 0 ? "negative" : "positive"}` : ""}${dx && dy ? " and " : ""}${dy ? `y ${odd[1] < 0 ? "negative" : "positive"}` : ""}, so it is in a different quadrant from the other three.`,
            `${P(...odd)} tiene ${dx ? `x ${odd[0] < 0 ? "negativa" : "positiva"}` : ""}${dx && dy ? " y " : ""}${dy ? `y ${odd[1] < 0 ? "negativa" : "positiva"}` : ""}, así que está en un cuadrante distinto del de los otros tres.`,
          ),
          ...H(
            [
              "Find the quadrant of each point from its two signs.",
              "Halla el cuadrante de cada punto con sus dos signos.",
            ],
            [
              "Three points have the same pair of signs.",
              "Tres puntos tienen el mismo par de signos.",
            ],
            [
              "Which point has a different pair of signs?",
              "¿Cuál punto tiene un par de signos distinto?",
            ],
          ),
          meta: {},
        });
      },
      check(item) {
        const quads = item.c.map((c) => {
          const v = pairOf(c);
          return v ? angQ(v[0], v[1]) : null;
        });
        const counts = new Map();
        for (const k of quads) counts.set(k, (counts.get(k) || 0) + 1);
        return judge(item, (_c, i) => counts.get(quads[i]) === 1 && counts.size === 2);
      },
    },
  });

  /* ===== coordDistance ================================================================================ */
  K.addShapes("coordDistance", {
    dstRev: {
      shape: "reverse",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const horiz = rng.chance(0.5);
        const x = rng.int(-8, 8);
        const y = rng.int(-8, 8);
        const d = rng.int(3, [8, 12, 18, 25][lv - 1]);
        const dir = sg(rng);
        const start = horiz ? x : y;
        const ans = start + dir * d;
        const word = horiz
          ? dir > 0
            ? ["right", "a la derecha"]
            : ["left", "a la izquierda"]
          : dir > 0
            ? ["above", "arriba"]
            : ["below", "abajo"];
        const shared = horiz ? y : x;
        return numq({
          ...Q(
            `Point A is at ${P(x, y)}. Point B is on the same ${horiz ? "row" : "column"}, ${d} units ${horiz ? "to the " : ""}${word[0]} A. What is the ${horiz ? "x" : "y"}-coordinate of point B?`,
            `El punto A está en ${P(x, y)}. El punto B está en la misma ${horiz ? "fila" : "columna"}, a ${d} unidades ${word[1]} de A. ¿Cuál es la coordenada ${horiz ? "x" : "y"} del punto B?`,
          ),
          a: ans,
          fw: [
            bad(d, "distance-as-coordinate"),
            bad(start - dir * d, "went-wrong-way"),
            bad(shared, "used-shared-coordinate"),
          ],
          ...X(
            `Start at ${horiz ? "x" : "y"} = ${S(start)} and move ${d} units ${word[0]}: ${S(start)} ${dir > 0 ? "+" : "−"} ${d} = ${S(ans)}. The ${horiz ? "y" : "x"}-coordinate stays ${S(shared)}.`,
            `Empieza en ${horiz ? "x" : "y"} = ${S(start)} y avanza ${d} unidades ${word[1]}: ${S(start)} ${dir > 0 ? "+" : "−"} ${d} = ${S(ans)}. La coordenada ${horiz ? "y" : "x"} se queda en ${S(shared)}.`,
          ),
          ...H(
            [
              `On the same ${horiz ? "row" : "column"} only one coordinate changes.`,
              `En la misma ${horiz ? "fila" : "columna"} solo cambia una coordenada.`,
            ],
            [
              "Start at the coordinate of A and count the units in the direction given.",
              "Empieza en la coordenada de A y cuenta las unidades en la dirección dada.",
            ],
            [
              "Right and up add. Left and down subtract.",
              "Derecha y arriba suman. Izquierda y abajo restan.",
            ],
          ),
          meta: { start, d, dir },
        });
      },
      check(item) {
        const { start, d, dir } = item.meta;
        let p = start;
        for (let i = 0; i < d; i++) p += dir;
        return typed(item, p);
      },
    },

    dstRoute: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const m = [6, 9, 12, 15][lv - 1];
        // route X crosses an axis; route Y stays on one side
        const y1 = rng.int(-6, 6);
        const lx = rng.int(2, m);
        const rx = rng.int(2, m);
        const crossH = rng.chance(0.5);
        const X1 = crossH ? [-lx, y1, rx, y1] : [y1, -lx, y1, rx];
        const side = sg(rng);
        const lo = rng.int(1, m - 1);
        const len = rng.int(2, 2 * m - 2);
        const hiV = lo + len;
        if (hiV > 2 * m) return this.make(rng, lv);
        const fixed = rng.int(-6, 6);
        const Y1 = crossH
          ? [fixed, side * lo, fixed, side * hiV]
          : [side * lo, fixed, side * hiV, fixed];
        const lenX = lx + rx;
        const lenY = len;
        const equal = lenX === lenY;
        if (!equal && rng.chance(0.15)) return this.make(rng, lv);
        const swap = rng.chance(0.5);
        const routes = swap ? [Y1, X1] : [X1, Y1];
        const crossIdx = swap ? 1 : 0;
        const ask = rng.pick(["shorter", "longer"]);
        const lens = routes.map((r) => Math.abs(r[2] - r[0]) + Math.abs(r[3] - r[1]));
        const pickIdx =
          lens[0] === lens[1] ? -1 : lens[0] < lens[1] === (ask === "shorter") ? 0 : 1;
        const txt = (r) => `from ${P(r[0], r[1])} to ${P(r[2], r[3])}`;
        const txtEs = (r) => `de ${P(r[0], r[1])} a ${P(r[2], r[3])}`;
        const R = ["Route 1", "Route 2"];
        const REs = ["Ruta 1", "Ruta 2"];
        const crossLonger = lens[crossIdx] > lens[1 - crossIdx];
        // a route that crosses an axis is measured by adding its two parts; subtracting them makes it look too short
        const tagFor = (i) =>
          crossLonger && (ask === "shorter" ? i === crossIdx : i !== crossIdx)
            ? "subtracted-across-zero"
            : "misread-distance";
        const right =
          pickIdx < 0
            ? { v: "Same length", vEs: "Misma longitud" }
            : { v: R[pickIdx], vEs: REs[pickIdx] };
        const wrongs = [0, 1]
          .filter((i) => i !== pickIdx)
          .map((i) => badEs(R[i], REs[i], tagFor(i)));
        if (pickIdx >= 0)
          wrongs.push(badEs("Same length", "Misma longitud", "compare-assumed-equal"));
        return mcq(rng, {
          ...Q(
            `Each unit is 1 block. Route 1 runs ${txt(routes[0])}. Route 2 runs ${txt(routes[1])}. Which route is ${ask}?`,
            `Cada unidad es 1 cuadra. La ruta 1 va ${txtEs(routes[0])}. La ruta 2 va ${txtEs(routes[1])}. ¿Cuál ruta es ${ask === "shorter" ? "más corta" : "más larga"}?`,
          ),
          right,
          wrong: wrongs,
          ...X(
            `Route 1 is ${lens[0]} blocks and Route 2 is ${lens[1]} blocks. ${pickIdx < 0 ? "They are the same length." : `${R[pickIdx]} is ${ask}.`} A route that crosses an axis adds its two parts.`,
            `La ruta 1 mide ${lens[0]} cuadras y la ruta 2 mide ${lens[1]} cuadras. ${pickIdx < 0 ? "Tienen la misma longitud." : `La ${REs[pickIdx].toLowerCase()} es ${ask === "shorter" ? "más corta" : "más larga"}.`} Una ruta que cruza un eje suma sus dos partes.`,
          ),
          ...H(
            [
              "Find the length of each route by itself.",
              "Halla la longitud de cada ruta por separado.",
            ],
            [
              "On one side of 0, subtract. If a route crosses 0, add the two parts.",
              "De un solo lado del 0, resta. Si una ruta cruza el 0, suma las dos partes.",
            ],
            ["Now compare the two lengths.", "Ahora compara las dos longitudes."],
          ),
          meta: { routes, ask },
        });
      },
      check(item) {
        const { routes, ask } = item.meta;
        const len = (r) => steps(r[0], r[2]) + steps(r[1], r[3]);
        const l = routes.map(len);
        return judge(item, (c) =>
          /Same length|Misma longitud/.test(c)
            ? l[0] === l[1]
            : l[0] !== l[1] &&
              l[/2/.test(c) ? 1 : 0] === (ask === "shorter" ? Math.min(...l) : Math.max(...l)),
        );
      },
    },

    dstWhich: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const x = rng.int(-9, 4);
        const y = rng.int(-6, 6);
        const d = rng.int(3, [8, 12, 16, 22][lv - 1]);
        return mcq(rng, {
          ...Q(
            `Point A is at ${P(x, y)}. Which point is on the same row as A, ${d} units to the right of A?`,
            `El punto A está en ${P(x, y)}. ¿Cuál punto está en la misma fila que A, a ${d} unidades a la derecha de A?`,
          ),
          right: P(x + d, y),
          wrong: [
            bad(P(x - d, y), "went-wrong-way"),
            bad(P(d, y), "distance-as-coordinate"),
            bad(P(x + d + 1, y), "counted-endpoints"),
          ],
          ...X(
            `On the same row, y stays ${S(y)}. Moving ${d} units right adds ${d} to x: ${S(x)} + ${d} = ${S(x + d)}. The point is ${P(x + d, y)}.`,
            `En la misma fila, y se queda en ${S(y)}. Avanzar ${d} unidades a la derecha suma ${d} a x: ${S(x)} + ${d} = ${S(x + d)}. El punto es ${P(x + d, y)}.`,
          ),
          ...H(
            [
              "The same row means the y-coordinate does not change.",
              "La misma fila significa que la coordenada y no cambia.",
            ],
            ["To the right means x gets greater.", "A la derecha significa que x aumenta."],
            [
              "Start at x and move the number of units. Then check the distance between the two x values.",
              "Empieza en x y avanza esa cantidad de unidades. Luego revisa la distancia entre los dos valores de x.",
            ],
          ),
          meta: { x, y, d },
        });
      },
      check(item) {
        const { x, y, d } = item.meta;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && v[1] === y && v[0] > x && steps(x, v[0]) === d;
        });
      },
    },
  });

  /* ===== polygonCoordinates =========================================================================== */
  const isAxisRect = (pts) => {
    if (pts.length !== 4) return false;
    const xs = [...new Set(pts.map((p) => p[0]))];
    const ys = [...new Set(pts.map((p) => p[1]))];
    return (
      xs.length === 2 &&
      ys.length === 2 &&
      xs.every((x) => ys.every((y) => pts.some((p) => p[0] === x && p[1] === y)))
    );
  };
  K.addShapes("polygonCoordinates", {
    polyRect: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const m = [5, 7, 9, 12][lv - 1];
        let x1;
        let x2;
        let y1;
        let y2;
        do {
          x1 = rng.int(-m, m);
          x2 = rng.int(-m, m);
          y1 = rng.int(-m, m);
          y2 = rng.int(-m, m);
        } while (Math.abs(x1 - x2) < 2 || Math.abs(y1 - y2) < 2);
        const L = ["A", "B", "C", "D"];
        const good = [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
        ];
        const show = (pts) => pts.map((p, i) => `${L[i]}${P(p[0], p[1])}`).join(", ");
        const bent = (i) => {
          const pts = good.map((p) => p.slice());
          const axis = rng.int(0, 1);
          const cur = pts[i][axis];
          let nv = cur + rng.pick([-2, -1, 1, 2]);
          if (nv === cur) nv = cur + 1;
          pts[i][axis] = nv;
          return pts;
        };
        const idx = rng.shuffle([0, 1, 2, 3]).slice(0, 3);
        return mcq(rng, {
          ...Q(
            "Which set of vertices makes a rectangle with its sides along the grid lines?",
            "¿Cuál conjunto de vértices forma un rectángulo con sus lados sobre las líneas de la cuadrícula?",
          ),
          right: show(good),
          wrong: idx.map((i) => bad(show(bent(i)), "not-a-corner")),
          ...X(
            `A rectangle on the grid has two x-values and two y-values, and its four vertices use every pairing of them: x = ${S(x1)} and ${S(x2)}, y = ${S(y1)} and ${S(y2)}.`,
            `Un rectángulo en la cuadrícula tiene dos valores de x y dos valores de y, y sus cuatro vértices usan todas las combinaciones: x = ${S(x1)} y ${S(x2)}, y = ${S(y1)} y ${S(y2)}.`,
          ),
          ...H(
            [
              "Sides along the grid lines are horizontal or vertical.",
              "Los lados sobre las líneas de la cuadrícula son horizontales o verticales.",
            ],
            [
              "Two vertices on the same horizontal side share a y-coordinate.",
              "Dos vértices de un mismo lado horizontal comparten la coordenada y.",
            ],
            [
              "Two vertices on the same vertical side share an x-coordinate. Check every side.",
              "Dos vértices de un mismo lado vertical comparten la coordenada x. Revisa cada lado.",
            ],
          ),
          meta: {},
        });
      },
      check: (item) => judge(item, (c) => isAxisRect(pairsIn(c))),
    },

    polyCmp: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const m = [4, 6, 8, 10][lv - 1];
        const dims = () => [rng.int(1, m + 3), rng.int(1, m + 3)];
        const ask = rng.pick(["perimeter", "area"]);
        const val = (d) => (ask === "area" ? d[0] * d[1] : 2 * (d[0] + d[1]));
        const other = (d) => (ask === "area" ? 2 * (d[0] + d[1]) : d[0] * d[1]);
        for (let i = 0; i < 600; i++) {
          const a = dims();
          const b = dims();
          if (val(a) === val(b) || other(a) === other(b)) continue;
          if (val(a) > val(b) === other(a) > other(b)) continue;
          const corner = () => [rng.int(-6, 3), rng.int(-6, 3)];
          const ca = corner();
          const cb = corner();
          const opp = (c, d) => [c[0] + d[0], c[1] + d[1]];
          const oa = opp(ca, a);
          const ob = opp(cb, b);
          const win = val(a) > val(b) ? "Rectangle R" : "Rectangle S";
          const winEs = val(a) > val(b) ? "Rectángulo R" : "Rectángulo S";
          const lose = win === "Rectangle R" ? "Rectangle S" : "Rectangle R";
          const loseEs = win === "Rectangle R" ? "Rectángulo S" : "Rectángulo R";
          return mcq(rng, {
            ...Q(
              `Rectangle R has opposite corners ${P(...ca)} and ${P(...oa)}. Rectangle S has opposite corners ${P(...cb)} and ${P(...ob)}. Each unit is 1 meter. Which rectangle has the greater ${ask}?`,
              `El rectángulo R tiene esquinas opuestas ${P(...ca)} y ${P(...oa)}. El rectángulo S tiene esquinas opuestas ${P(...cb)} y ${P(...ob)}. Cada unidad es 1 metro. ¿Cuál rectángulo tiene ${ask === "area" ? "mayor área" : "mayor perímetro"}?`,
            ),
            right: { v: win, vEs: winEs },
            wrong: [
              badEs(lose, loseEs, "measure-area-perimeter-swap"),
              badEs("Both are equal", "Los dos son iguales", "compare-assumed-equal"),
            ],
            ...X(
              `Rectangle R is ${a[0]} by ${a[1]} and Rectangle S is ${b[0]} by ${b[1]}. The ${ask} of R is ${val(a)} and of S is ${val(b)}, so ${win} has the greater ${ask}.`,
              `El rectángulo R mide ${a[0]} por ${a[1]} y el rectángulo S mide ${b[0]} por ${b[1]}. El ${ask === "area" ? "área" : "perímetro"} de R es ${val(a)} y el de S es ${val(b)}, así que el ${winEs.toLowerCase()} tiene mayor ${ask === "area" ? "área" : "perímetro"}.`,
            ),
            ...H(
              [
                "Find the width and the height of each rectangle from its corners.",
                "Halla el ancho y el alto de cada rectángulo con sus esquinas.",
              ],
              [
                ask === "area"
                  ? "Area is width times height."
                  : "Perimeter adds all four sides: twice the width plus twice the height.",
                ask === "area"
                  ? "El área es ancho por alto."
                  : "El perímetro suma los cuatro lados: dos veces el ancho más dos veces el alto.",
              ],
              [
                "Use the measure the question asks for on both. Then compare.",
                "Usa la medida que pide la pregunta en los dos. Luego compara.",
              ],
            ),
            meta: { ca, oa, cb, ob, ask },
          });
        }
        throw new Error("polyCmp: no pair");
      },
      check(item) {
        const { ca, oa, cb, ob, ask } = item.meta;
        const dim = (c, o) => [steps(c[0], o[0]), steps(c[1], o[1])];
        const m = (d) => {
          let n = 0;
          if (ask === "area") for (let i = 0; i < d[0]; i++) n += d[1];
          else n = 2 * d[0] + 2 * d[1];
          return n;
        };
        const r = m(dim(ca, oa));
        const s = m(dim(cb, ob));
        return judge(item, (c) => {
          if (/equal|iguales/.test(c)) return r === s;
          const pickR = /R$/.test(c);
          return r !== s && (pickR ? r > s : s > r);
        });
      },
    },
  });

  /* ===== reflectPoint ================================================================================= */
  K.addShapes("reflectPoint", {
    rfRev: {
      shape: "reverse",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const [x, y] = offAxes(rng, [5, 8, 10, 12][lv - 1]);
        const ax = rng.pick(["x", "y"]);
        const img = ax === "x" ? [x, -y] : [-x, y];
        return mcq(rng, {
          ...Q(
            `Point P is reflected across the ${AXN[ax][0]}. Its image is P' = ${P(...img)}. What are the coordinates of P?`,
            `El punto P se refleja sobre el ${AXN[ax][1]}. Su imagen es P' = ${P(...img)}. ¿Cuáles son las coordenadas de P?`,
          ),
          right: P(x, y),
          wrong: [
            bad(P(-x, -y), "changed-both"),
            bad(ax === "x" ? P(-x, y) : P(x, -y), "changed-wrong-coordinate"),
            bad(P(...img), "thought-unchanged"),
          ],
          ...X(
            `A reflection across the ${AXN[ax][0]} changes the ${ax === "x" ? "y" : "x"}-coordinate's sign. Undo it: P' = ${P(...img)} came from P = ${P(x, y)}.`,
            `Una reflexión sobre el ${AXN[ax][1]} cambia el signo de la coordenada ${ax === "x" ? "y" : "x"}. Deshazla: P' = ${P(...img)} viene de P = ${P(x, y)}.`,
          ),
          ...H(
            [
              `Across the ${AXN[ax][0]}, only one coordinate changes sign.`,
              `Sobre el ${AXN[ax][1]}, solo una coordenada cambia de signo.`,
            ],
            [
              "The point and its image are the same distance from the axis, on opposite sides.",
              "El punto y su imagen están a la misma distancia del eje, en lados opuestos.",
            ],
            [
              "Reflect the image back across the same axis.",
              "Refleja la imagen de vuelta sobre el mismo eje.",
            ],
          ),
          meta: { img, ax },
        });
      },
      check(item) {
        const { img, ax } = item.meta;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && isRefl(v, img, ax);
        });
      },
    },

    rfAxis: {
      shape: "which-input",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const [x, y] = offAxes(rng, [5, 8, 10, 12][lv - 1]);
        const ax = rng.pick(["x", "y"]);
        const img = ax === "x" ? [x, -y] : [-x, y];
        const names = { x: ["the x-axis", "el eje x"], y: ["the y-axis", "el eje y"] };
        const wrongAx = ax === "x" ? "y" : "x";
        return mcq(rng, {
          ...Q(
            `A reflection moves A${P(x, y)} to A'${P(...img)}. Across which axis was A reflected?`,
            `Una reflexión mueve A${P(x, y)} a A'${P(...img)}. ¿Sobre cuál eje se reflejó A?`,
          ),
          right: { v: names[ax][0], vEs: names[ax][1] },
          wrong: [
            badEs(names[wrongAx][0], names[wrongAx][1], "changed-wrong-coordinate"),
            badEs("both axes", "ambos ejes", "changed-both"),
            badEs("neither axis", "ningún eje", "thought-unchanged"),
          ],
          ...X(
            `Only the ${ax === "x" ? "y" : "x"}-coordinate changed sign, from ${S(ax === "x" ? y : x)} to ${S(ax === "x" ? -y : -x)}. A point flips across the ${AXN[ax][0]} when its ${ax === "x" ? "y" : "x"}-coordinate changes sign.`,
            `Solo cambió de signo la coordenada ${ax === "x" ? "y" : "x"}, de ${S(ax === "x" ? y : x)} a ${S(ax === "x" ? -y : -x)}. Un punto se voltea sobre el ${AXN[ax][1]} cuando cambia el signo de su coordenada ${ax === "x" ? "y" : "x"}.`,
          ),
          ...H(
            [
              "Compare the x-coordinates, then the y-coordinates.",
              "Compara las coordenadas x y luego las coordenadas y.",
            ],
            [
              "Which coordinate changed sign? Which stayed the same?",
              "¿Cuál coordenada cambió de signo? ¿Cuál se quedó igual?",
            ],
            [
              "Across the x-axis a point flips up or down. Across the y-axis it flips left or right.",
              "Sobre el eje x un punto se voltea hacia arriba o abajo. Sobre el eje y se voltea a la izquierda o a la derecha.",
            ],
          ),
          meta: { p: [x, y], img },
        });
      },
      check(item) {
        const { p, img } = item.meta;
        const hit = ["x", "y"].filter((a) => isRefl(p, img, a));
        return judge(item, (c) => hit.length === 1 && c === `the ${hit[0]}-axis`);
      },
    },

    rfFar: {
      shape: "compare-two",
      lv: [1, 2, 3, 4],
      make(rng, lv) {
        const m = [6, 8, 10, 12][lv - 1];
        for (let i = 0; i < 400; i++) {
          const a = offAxes(rng, m);
          const b = offAxes(rng, m);
          const axis = rng.pick(["x", "y"]);
          const dist = (p) => Math.abs(axis === "x" ? p[1] : p[0]);
          const alt = (p) => Math.abs(axis === "x" ? p[0] : p[1]);
          if (a.join() === b.join()) continue;
          const same = rng.chance(0.2);
          const bb = same
            ? axis === "x"
              ? [-b[0], -a[1] * (b[1] < 0 ? -1 : 1)]
              : [-a[0] * (b[0] < 0 ? -1 : 1), b[1]]
            : b;
          const da = dist(a);
          const db = dist(bb);
          if (same ? da !== db : da === db) continue;
          if (alt(a) === alt(bb)) continue;
          if (bb[0] === 0 || bb[1] === 0 || Math.abs(bb[0]) > m || Math.abs(bb[1]) > m) continue;
          if (a.join() === bb.join()) continue;
          const farther = da > db ? "P" : "Q";
          const sameD = da === db;
          const right = sameD
            ? { v: "They are the same distance", vEs: "Están a la misma distancia" }
            : { v: `Point ${farther}`, vEs: `Punto ${farther}` };
          const wrongPt = farther === "P" ? "Q" : "P";
          return mcq(rng, {
            ...Q(
              `Point P is at ${P(...a)} and point Q is at ${P(...bb)}. Which point is farther from the ${AXN[axis][0]}?`,
              `El punto P está en ${P(...a)} y el punto Q está en ${P(...bb)}. ¿Cuál punto está más lejos del ${AXN[axis][1]}?`,
            ),
            right,
            wrong: sameD
              ? ["P", "Q"].map((t) => badEs(`Point ${t}`, `Punto ${t}`, "axis-distance-swapped"))
              : [
                  badEs(`Point ${wrongPt}`, `Punto ${wrongPt}`, "axis-distance-swapped"),
                  badEs(
                    "They are the same distance",
                    "Están a la misma distancia",
                    "compare-assumed-equal",
                  ),
                ],
            ...X(
              `The distance from the ${AXN[axis][0]} is the ${axis === "x" ? "y" : "x"}-coordinate without its sign. P is ${da} units away and Q is ${db} units away${sameD ? ", so they are the same distance" : `, so point ${farther} is farther`}.`,
              `La distancia al ${AXN[axis][1]} es la coordenada ${axis === "x" ? "y" : "x"} sin su signo. P está a ${da} unidades y Q está a ${db} unidades${sameD ? ", así que están a la misma distancia" : `, así que el punto ${farther} está más lejos`}.`,
            ),
            ...H(
              [
                `Distance from the ${AXN[axis][0]} uses one coordinate. Which one?`,
                `La distancia al ${AXN[axis][1]} usa una coordenada. ¿Cuál?`,
              ],
              [
                `Use the ${axis === "x" ? "y" : "x"}-coordinate of each point. Ignore its sign.`,
                `Usa la coordenada ${axis === "x" ? "y" : "x"} de cada punto. No tomes en cuenta su signo.`,
              ],
              ["Compare the two distances.", "Compara las dos distancias."],
            ),
            meta: { a, b: bb, axis },
          });
        }
        throw new Error("rfFar: no pair");
      },
      check(item) {
        const { a, b, axis } = item.meta;
        const d = (p) => steps(0, axis === "x" ? p[1] : p[0]);
        return judge(item, (c) =>
          /same distance|misma distancia/.test(c)
            ? d(a) === d(b)
            : d(a) !== d(b) && (/ P$/.test(c) ? d(a) > d(b) : d(b) > d(a)),
        );
      },
    },
  });
})();
