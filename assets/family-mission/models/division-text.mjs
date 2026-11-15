// Every sentence the "division" family shows or speaks, in English and Spanish. Nothing here
// states the digit the student has yet to choose; the answer appears only after the steps are done.
import { fmtNumber, frac, mul, parseRational, t } from "./core.mjs";
import { fmtDec, judgeDigit, num, shifted } from "./division-math.mjs";

const plural = (n, one, many) => (n === 1 ? one : many);

export const STR = {
  problem: { en: "Pick a problem", es: "Elige un problema" },
  digit: { en: "Choose a digit", es: "Elige un dígito" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  done: { en: "All steps done.", es: "Todos los pasos hechos." },
  right: { en: "Just right.", es: "Justo. Ese dígito encaja." },
  taken: { en: "taken", es: "tomado" },
  left: { en: "not taken", es: "sin tomar" },
  pile: { en: "in all", es: "en total" },
  groupsLabel: { en: "Groups", es: "Grupos" },
};

const ACT = {
  move: { en: "Move both points 1 place right", es: "Mueve los dos puntos 1 lugar a la derecha" },
  point: { en: "Write the point in the answer", es: "Escribe el punto en la respuesta" },
  mult: { en: "Multiply", es: "Multiplicar" },
  sub: { en: "Subtract", es: "Restar" },
  bring: { en: "Bring down", es: "Bajar" },
  check: { en: "Check the answer", es: "Comprobar la respuesta" },
};

export function actionLabel(kind, d, L) {
  if (kind === "split") {
    return t(L, { en: `Split into ${d.problem.d} equal groups`, es: `Repartir en ${d.problem.d} grupos iguales` });
  }
  return t(L, ACT[kind]);
}

export const digitsOf = (pl) => fmtNumber(frac(pl.A, 10 ** pl.dec));
const unitOf = (p, L) => (p.unit ? ` ${t(L, p.unit)}` : "");

/** The problem as the page prints it ("1,344 ÷ 12", "2/3 of 60"). */
export function problemText(mode, p, L) {
  if (mode === "fractionof") return `${p.n}/${p.d} ${t(L, { en: "of", es: "de" })} ${p.whole}`;
  return `${fmtDec(p.dividend)} ÷ ${fmtDec(p.divisor)}`;
}

/** The equation as it stands now (decimal: after the points have moved). */
export function equation(d, L) {
  const p = d.problem;
  if (d.mode === "fractionof") return problemText(d.mode, p, L);
  return d.moved ? `${shifted(p.dividend, d.moved)} ÷ ${shifted(p.divisor, d.moved)}` : problemText(d.mode, p, L);
}

export function movedLine(d, L) {
  if (!d.moved) return "";
  const j = d.moved;
  return t(L, {
    en: `Both points moved ${j} ${plural(j, "place", "places")} right (× ${10 ** j}).`,
    es: `Los dos puntos se movieron ${j} ${plural(j, "lugar", "lugares")} a la derecha (× ${10 ** j}).`,
  });
}

// ── Instructions for the next step ───────────────────────────────────────────

function pickHint(d, L) {
  const pl = d.plan;
  const c = pl.cycles[d.next.k];
  const B = num(pl.B);
  const w = num(c.working);
  const first = d.next.k === 0 && c.pos > 0 ? num(Number(pl.digits.slice(0, c.pos))) : null;
  const pre = first
    ? t(L, {
        en: `${B} does not fit into ${first}, so the working number is ${w}. `,
        es: `${B} no cabe en ${first}, así que el número de trabajo es ${w}. `,
      })
    : "";
  return pre + t(L, { en: `Divide: how many ${B}s fit into ${w}? Choose a digit.`, es: `Divide: ¿cuántos ${B} caben en ${w}? Elige un dígito.` });
}

function stepHint(d, L) {
  const { kind, k } = d.next;
  const pl = d.plan;
  const c = pl.cycles[k ?? 0];
  const B = num(pl.B);
  if (kind === "pick") return pickHint(d, L);
  if (kind === "move") {
    const p = d.problem;
    return d.moved
      ? t(L, {
          en: `${movedLine(d, "en")} The divisor is ${shifted(p.divisor, d.moved)}, so it still has a decimal point. Move both points one more place.`,
          es: `${movedLine(d, "es")} El divisor es ${shifted(p.divisor, d.moved)}, así que todavía tiene punto decimal. Mueve los dos puntos un lugar más.`,
        })
      : t(L, {
          en: "Make the divisor a whole number. Multiply both numbers by the same power of 10: move both decimal points the same number of places right.",
          es: "Haz que el divisor sea un número entero. Multiplica los dos números por la misma potencia de 10: mueve los dos puntos decimales el mismo número de lugares a la derecha.",
        });
  }
  if (kind === "point") {
    return t(L, {
      en: `Now the problem is ${equation(d, "en")}. Write the decimal point in the answer, directly above the point in the dividend.`,
      es: `Ahora el problema es ${equation(d, "es")}. Escribe el punto decimal en la respuesta, justo arriba del punto del dividendo.`,
    });
  }
  if (kind === "mult") {
    return t(L, {
      en: `Multiply: ${c.q} × ${B}. Write the product under ${num(c.working)}.`,
      es: `Multiplica: ${c.q} × ${B}. Escribe el producto debajo de ${num(c.working)}.`,
    });
  }
  if (kind === "sub") {
    return t(L, {
      en: `Subtract: ${num(c.working)} − ${num(c.product)}. Write what is left under the line.`,
      es: `Resta: ${num(c.working)} − ${num(c.product)}. Escribe lo que queda debajo de la línea.`,
    });
  }
  if (kind === "bring") {
    return c.pos + 1 >= pl.digits.length
      ? t(L, {
          en: "No digits are left. Write a 0 at the end of the dividend and bring it down. A 0 at the end of a decimal does not change its value.",
          es: "Ya no quedan dígitos. Escribe un 0 al final del dividendo y bájalo. Un 0 al final de un decimal no cambia su valor.",
        })
      : t(L, { en: `Bring down the next digit, ${c.bring}, next to what is left.`, es: `Baja el siguiente dígito, ${c.bring}, junto a lo que queda.` });
  }
  return pl.mode === "whole"
    ? t(L, {
        en: "Check: multiply the quotient by the divisor, then add the remainder. It should give the dividend.",
        es: "Comprueba: multiplica el cociente por el divisor y suma el residuo. Debe dar el dividendo.",
      })
    : t(L, {
        en: "Check: multiply the answer by the divisor. It should give the dividend.",
        es: "Comprueba: multiplica la respuesta por el divisor. Debe dar el dividendo.",
      });
}

function groupsHint(d, L) {
  const { n, d: parts, whole } = d.problem;
  const u = unitOf(d.problem, L);
  if (d.next.kind === "split") {
    return t(L, {
      en: `The bottom number is ${parts}. Split the ${whole}${u} into ${parts} equal groups: divide by the bottom number.`,
      es: `El denominador es ${parts}. Reparte ${whole}${u} en ${parts} grupos iguales: divide entre el denominador.`,
    });
  }
  const more = n - d.taken.length;
  return t(L, {
    en: `Each group has ${d.each}${u}. The top number is ${n}: take ${more} more ${plural(more, "group", "groups")}. Tap a group to take it.`,
    es: `Cada grupo tiene ${d.each}${u}. El numerador es ${n}: toma ${more} ${plural(more, "grupo", "grupos")} más. Toca un grupo para tomarlo.`,
  });
}

export const hint = (d, L) => (!d.next ? t(L, STR.done) : d.mode === "fractionof" ? groupsHint(d, L) : stepHint(d, L));

// ── Feedback for a choice that does not work: a look, never a score ──────────

export function digitFeedback(d, digit, L) {
  const pl = d.plan;
  const c = pl.cycles[d.next.k];
  const B = num(pl.B);
  const w = num(c.working);
  const p = num(digit * pl.B);
  const v = judgeDigit(c.working, pl.B, digit);
  if (v === "ok") return t(L, STR.right);
  const head = `${digit} × ${B} = ${p}.`;
  if (v === "big") {
    return t(L, {
      en: `${head} That is more than ${w}: too big. Try another look.`,
      es: `${head} Es más que ${w}: demasiado grande. Mira otra vez.`,
    });
  }
  const rest = num(c.working - digit * pl.B);
  return t(L, {
    en: `${head} ${w} − ${p} = ${rest}, and ${B} still fits in ${rest}: too small. Try another look.`,
    es: `${head} ${w} − ${p} = ${rest}, y todavía cabe ${B} en ${rest}: demasiado pequeño. Mira otra vez.`,
  });
}

export function tooManyGroups(d, L) {
  const n = d.problem.n;
  return t(L, {
    en: `The top number is ${n}, so take only ${n} groups. Tap a taken group to put it back. Try another look.`,
    es: `El numerador es ${n}, así que toma solo ${n} grupos. Toca un grupo tomado para devolverlo. Mira otra vez.`,
  });
}

// ── Results ──────────────────────────────────────────────────────────────────

const fill = (tpl, L, q, r) => t(L, tpl).replace("{q}", q).replace("{r}", r);

/** True once every digit of the quotient is down (the answer line may show before the check). */
export function answered(d) {
  if (d.mode === "fractionof") return d.finished;
  return d.prog.at(-1) >= 3;
}

/** { answer, notes[], check } for the finished (or nearly finished) problem. */
export function parts(d, L) {
  const p = d.problem;
  if (d.mode === "fractionof") {
    const u = unitOf(p, L);
    return {
      answer: `${problemText(d.mode, p, L)} = ${p.n} × (${p.whole} ÷ ${p.d}) = ${p.n} × ${d.each} = ${d.answer}`,
      notes: [
        t(L, { en: `That is ${p.n} groups of ${d.each}: ${d.answer}${u}.`, es: `Son ${p.n} grupos de ${d.each}: ${d.answer}${u}.` }),
      ],
      check: t(L, { en: `Check: ${p.d} groups of ${d.each} make ${d.each * p.d}.`, es: `Comprueba: ${p.d} grupos de ${d.each} forman ${d.each * p.d}.` }),
    };
  }
  const pl = d.plan;
  const q = fmtNumber(pl.quotient);
  const a = fmtDec(p.dividend);
  const b = fmtDec(p.divisor);
  const ctx = p.context ? [`${fill(p.context, L, q, num(pl.remainder))}.`] : [];
  if (pl.mode === "whole") {
    const r = pl.remainder;
    const Q = pl.quotient.n;
    return {
      answer: `${a} ÷ ${b} = ${q}${r ? t(L, { en: ` R ${num(r)}`, es: ` residuo ${num(r)}` }) : ""}`,
      notes: [
        ...ctx,
        r
          ? t(L, {
              en: `The remainder, ${num(r)}, is less than ${b}, so no more groups of ${b} fit.`,
              es: `El residuo, ${num(r)}, es menor que ${b}, así que ya no caben más grupos de ${b}.`,
            })
          : t(L, { en: `The remainder is 0: ${b} fits into ${a} exactly.`, es: `El residuo es 0: ${b} cabe exactamente en ${a}.` }),
      ],
      check: t(L, { en: `Check: ${q} × ${b} + ${num(r)} = ${num(Q * pl.B + r)}.`, es: `Comprueba: ${q} × ${b} + ${num(r)} = ${num(Q * pl.B + r)}.` }),
    };
  }
  const same = pl.need
    ? [
        t(L, {
          en: `${shifted(p.dividend, pl.need)} ÷ ${shifted(p.divisor, pl.need)} has the same answer, because both numbers were multiplied by ${10 ** pl.need}.`,
          es: `${shifted(p.dividend, pl.need)} ÷ ${shifted(p.divisor, pl.need)} tiene la misma respuesta, porque los dos números se multiplicaron por ${10 ** pl.need}.`,
        }),
      ]
    : [];
  const back = fmtNumber(mul(pl.quotient, parseRational(p.divisor)));
  return {
    answer: `${a} ÷ ${b} = ${q}`,
    notes: [...same, ...ctx],
    check: t(L, { en: `Check: ${q} × ${b} = ${back}.`, es: `Comprueba: ${q} × ${b} = ${back}.` }),
  };
}

/** What is on the board, one line per finished stage (for the text alternative). */
export function workLines(d, L) {
  const pl = d.plan;
  const B = num(pl.B);
  const out = [];
  pl.cycles.forEach((c, k) => {
    const n = d.prog[k];
    const w = num(c.working);
    if (n >= 1) out.push(t(L, { en: `${w} ÷ ${B}: write ${c.q}.`, es: `${w} ÷ ${B}: escribe ${c.q}.` }));
    if (n >= 2) out.push(`${c.q} × ${B} = ${num(c.product)}.`);
    if (n >= 3) out.push(`${w} − ${num(c.product)} = ${num(c.left)}.`);
    if (n >= 4) out.push(t(L, { en: `Bring down ${c.bring}.`, es: `Baja ${c.bring}.` }));
  });
  return out;
}

export function boardLabel(d, L) {
  const pl = d.plan;
  const head = t(L, {
    en: `Long division: ${num(pl.B)} into ${digitsOf(pl)}.`,
    es: `División larga: ${num(pl.B)} dentro de ${digitsOf(pl)}.`,
  });
  return [head, ...workLines(d, L)].join(" ");
}
