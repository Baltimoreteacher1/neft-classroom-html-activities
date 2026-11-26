// living/order-of-ops-model.js — the mathematics of the order-of-ops play (6-4).
//
// Pure functions only (no DOM). An expression is a sum of terms; a term is one
// or two factors; a factor is a number or a power; the whole sum may sit in
// parentheses with a division after it:  2 × 15 + 4 × 20 + 8 × 2³  and
// (4 × 3² + 6) ÷ 7. The stages the lesson teaches are exactly the four kinds of
// operation: powers, then multiplying, then adding, then the division outside
// the parentheses. Every state the student sees is computed here, so
// order-of-ops.test.mjs can check each value in node.

import { okInt, placeCorrect } from "./mean-balance-model.js";
import { sup } from "./power-stack-model.js";

export { placeCorrect, sup };

const MAX_VALUE = 9999;
export const KINDS = ["pow", "mul", "add", "div"]; // the order the lesson teaches

/** "15" -> {v:15}; "2^3" -> {b:2, e:3}; anything else -> null. */
export function parseFactor(s) {
  const t = String(s).trim();
  if (/^\d{1,2}$/.test(t) && Number(t) >= 1) return { v: Number(t) };
  const m = /^(\d)\^(\d)$/.exec(t);
  if (m && okInt(Number(m[1]), 2, 9) && okInt(Number(m[2]), 2, 4)) return { b: +m[1], e: +m[2] };
  return null;
}

const fval = (f) => ("e" in f ? f.b ** f.e : f.v);
export const factorText = (f) => ("e" in f ? `${f.b}${sup(f.e)}` : String(f.v));
export const termText = (t) => t.map(factorText).join(" × ");
export const termValue = (t) => t.reduce((p, f) => p * fval(f), 1);

/** The whole expression as the student reads it, with the group's parentheses. */
export function stateText(st) {
  const sum = st.terms.map(termText).join(" + ");
  return st.div ? `${grouped(st) ? `(${sum})` : sum} ÷ ${st.div}` : sum;
}
export const grouped = (st) =>
  !!st.div &&
  (st.terms.length > 1 || (st.terms[0] ?? []).length > 1 || "e" in (st.terms[0]?.[0] ?? {}));

/** The value of a state: the same at every line of the evaluation. */
export function valueOf(st) {
  const sum = st.terms.reduce((s, t) => s + termValue(t), 0);
  return st.div ? sum / st.div : sum;
}

export const hasPower = (st) => st.terms.some((t) => t.some((f) => "e" in f));

/**
 * Every operation the student can ask for in this state — including the ones
 * that are not allowed yet. {kind, t?, f?}; one `add` (the leftmost pair).
 */
export function allOps(st) {
  const ops = [];
  st.terms.forEach((t, ti) =>
    t.forEach((f, fi) => "e" in f && ops.push({ kind: "pow", t: ti, f: fi })),
  );
  st.terms.forEach((t, ti) => t.length >= 2 && ops.push({ kind: "mul", t: ti }));
  if (st.terms.length >= 2) ops.push({ kind: "add" });
  if (st.div) ops.push({ kind: "div" });
  return ops;
}

/** The kind of operation the order of operations allows next. */
export function legalKind(st) {
  const kinds = new Set(allOps(st).map((o) => o.kind));
  return KINDS.find((k) => kinds.has(k)) ?? null;
}
export const isLegal = (st, op) => op.kind === legalKind(st);

/** What the student reads on the button: the piece of the expression it works on. */
export function opLabel(st, op) {
  if (op.kind === "pow") return factorText(st.terms[op.t][op.f]);
  if (op.kind === "mul") return termText(st.terms[op.t]);
  if (op.kind === "add") return `${termText(st.terms[0])} + ${termText(st.terms[1])}`;
  return `÷ ${st.div}`;
}

/** The number an allowed operation produces. */
export function opResult(st, op) {
  if (op.kind === "pow") return fval(st.terms[op.t][op.f]);
  if (op.kind === "mul") return termValue(st.terms[op.t]);
  if (op.kind === "add") return termValue(st.terms[0]) + termValue(st.terms[1]);
  return valueOf(st);
}

/** The state after an ALLOWED operation; null when the order does not allow it. */
export function applyOp(st, op) {
  if (!isLegal(st, op)) return null;
  const terms = st.terms.map((t) => t.map((f) => ({ ...f })));
  if (op.kind === "pow") terms[op.t][op.f] = { v: opResult(st, op) };
  else if (op.kind === "mul") terms[op.t] = [{ v: opResult(st, op) }];
  else if (op.kind === "add") terms.splice(0, 2, [{ v: opResult(st, op) }]);
  else return { terms: [[{ v: opResult(st, op) }]], div: 0 };
  return { terms, div: st.div };
}

/** The canonical evaluation: [{state, op, label, result}] from first line to last. */
export function solve(expr) {
  const lines = [{ state: expr, op: null, label: "", result: null }];
  let st = expr;
  for (let guard = 0; guard < 20; guard++) {
    const kind = legalKind(st);
    if (!kind) break;
    const op = allOps(st).find((o) => o.kind === kind);
    const label = opLabel(st, op);
    const result = opResult(st, op);
    st = applyOp(st, op);
    lines.push({ state: st, op, label, result });
  }
  return lines;
}

/**
 * Wrong orders that give a different total — one per real slip. Only for a plain
 * sum of terms (no division): "left" works strictly left to right, "times" reads
 * 2³ as 2 × 3, "product" multiplies before raising (8 × 2)³.
 */
export function misorders(expr) {
  if (expr.div) return [];
  const toks = expr.terms.flatMap((t, ti) => t.map((f, fi) => ({ f, ti, fi })));
  let acc = fval(toks[0].f);
  for (let i = 1; i < toks.length; i++) {
    const n = fval(toks[i].f);
    acc = toks[i].ti === toks[i - 1].ti ? acc * n : acc + n;
  }
  const left = { kind: "left", value: acc };
  const times = {
    kind: "times",
    value: expr.terms.reduce(
      (s, t) => s + t.reduce((p, f) => p * ("e" in f ? f.b * f.e : f.v), 1),
      0,
    ),
  };
  const withPow = expr.terms.findIndex((t) => t.length === 2 && t.some((f) => "e" in f));
  const out = [left, times];
  if (withPow >= 0) {
    const value = expr.terms.reduce((s, t, ti) => {
      if (ti !== withPow) return s + termValue(t);
      const pw = t.find((f) => "e" in f);
      const other = t.find((f) => !("e" in f));
      return s + (other.v * pw.b) ** pw.e;
    }, 0);
    out.push({ kind: "product", value });
  }
  const right = valueOf(expr);
  return out.filter((o, i) => o.value !== right && out.findIndex((p) => p.value === o.value) === i);
}

/** The first-step choices: the allowed operation plus up to three that are not yet allowed. */
export function firstStepChoices(st) {
  const legal = legalKind(st);
  const ops = allOps(st);
  const pick = [ops.find((o) => o.kind === legal)];
  const wrongs = [
    ops.find((o) => o.kind === "mul" && !st.terms[o.t].some((f) => "e" in f)),
    ops.find((o) => o.kind === "mul" && st.terms[o.t].some((f) => "e" in f)),
    ops.find((o) => o.kind === "add"),
    ops.find((o) => o.kind === "div"),
  ].filter((o) => o && o.kind !== legal);
  for (const o of wrongs) if (pick.length < 4) pick.push(o);
  const seen = new Set();
  return pick
    .map((op) => ({ op, label: opLabel(st, op), correct: isLegal(st, op) }))
    .filter((c) => !seen.has(c.label) && seen.add(c.label));
}

function parseExpr(c) {
  const rows = Array.isArray(c?.terms) ? c.terms : null;
  if (!rows || rows.length < 1 || rows.length > 4) return null;
  const terms = rows.map((r) => (Array.isArray(r) ? r.map(parseFactor) : null));
  if (terms.some((t) => !t || t.length < 1 || t.length > 2 || t.some((f) => !f))) return null;
  const div = c.div == null ? 0 : Number(c.div);
  if (div !== 0 && !okInt(div, 2, 12)) return null;
  const st = { terms, div };
  const v = valueOf(st);
  if (!Number.isInteger(v) || v > MAX_VALUE) return null;
  if (terms.some((t) => termValue(t) > MAX_VALUE)) return null;
  return st;
}

const storyOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 400), es: String(s.es || s.en).slice(0, 400) }
    : null;

export function validateOrderOfOps(cfg) {
  const main = parseExpr(cfg);
  if (!main || main.div || main.terms.length < 2 || !hasPower(main)) return null;
  const wrong = misorders(main);
  if (wrong.length < 3 || firstStepChoices(main).length < 4) return null;
  const transfer = parseExpr(cfg.transfer);
  if (!transfer || !hasPower(transfer) || firstStepChoices(transfer).length < 3) return null;
  const prefix = typeof cfg.prefix === "string" && cfg.prefix.length <= 2 ? cfg.prefix : "";
  const meanings =
    Array.isArray(cfg.meanings) && cfg.meanings.length === main.terms.length
      ? cfg.meanings.map((m) => ({
          en: String(m?.en ?? "").slice(0, 28),
          es: String(m?.es || m?.en || "").slice(0, 28),
        }))
      : null;
  if (meanings?.some((m) => !m.en)) return null;
  return {
    main,
    transfer,
    prefix,
    meanings,
    story: storyOf(cfg.story),
    transferStory: storyOf(cfg.transfer?.story),
  };
}

const pair = (en, es) => ({ en, es });
const money = (v, prefix) => `${prefix}${v}`;

/** What a not-yet-allowed choice says, as a question about the picture. */
export function cueFor(st, op) {
  const legal = legalKind(st);
  const hasPow = hasPower(st);
  const target = opLabel(st, op);
  if (op.kind === "mul") {
    const holdsPower = st.terms[op.t].some((f) => "e" in f);
    if (holdsPower)
      return pair(
        `${target} multiplies first, but the small raised number belongs to just one number. Is there a power inside it that must be evaluated before any multiplying?`,
        `${target} multiplica primero, pero el número pequeño y elevado pertenece a un solo número. ¿Hay una potencia dentro que se debe evaluar antes de multiplicar?`,
      );
    return pair(
      `${target} is a multiplication. But is there a power anywhere in the expression that comes before multiplying?`,
      `${target} es una multiplicación. Pero ¿hay alguna potencia en la expresión que va antes de multiplicar?`,
    );
  }
  if (op.kind === "add")
    return pair(
      `Adding comes after ${hasPow ? "powers and " : ""}multiplying. Look at the boxes: is there anything left to ${hasPow ? "raise or " : ""}multiply first?`,
      `Sumar va después de ${hasPow ? "las potencias y " : ""}multiplicar. Mira las cajas: ¿queda algo por ${hasPow ? "elevar o " : ""}multiplicar antes?`,
    );
  if (op.kind === "div")
    return pair(
      `The ÷ ${st.div} works on the whole group in parentheses. Is the group a single number yet?`,
      `El ÷ ${st.div} actúa sobre todo el grupo entre paréntesis. ¿Ya es un solo número el grupo?`,
    );
  // A power asked for out of turn cannot happen: powers always come first.
  return pair(
    `Not yet: ${legal === "mul" ? "multiplying" : legal === "add" ? "adding" : "dividing"} is the next stage.`,
    `Todavía no: la siguiente etapa es ${legal === "mul" ? "multiplicar" : legal === "add" ? "sumar" : "dividir"}.`,
  );
}

/** Every sentence the play says. `v` is the validated config. */
export function orderCopy(v) {
  const { main, transfer, prefix, meanings, story, transferStory } = v;
  const text = stateText(main);
  const lines = solve(main);
  const total = valueOf(main);
  const tText = stateText(transfer);
  const tLines = solve(transfer);
  const tTotal = valueOf(transfer);
  const f = (x) => money(x, prefix);
  const powerOp = lines.find((l) => l.op?.kind === "pow");
  const powText = powerOp?.label ?? "";
  const powVal = powerOp?.result ?? 0;
  const stepNote = (l) => `${l.label} = ${l.result}`;
  const wrong = misorders(main);
  const pw = main.terms.flat().find((fa) => "e" in fa);
  return {
    kicker: pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: pair("Which part comes first?", "¿Qué parte va primero?"),
    ariaLabel: pair(
      `The expression ${text} on screen, with each product in its own box. Powers first, then the products, then the sums: ${lines
        .slice(1)
        .map(stepNote)
        .join("; ")}. The total is ${f(total)}.`,
      `La expresión ${text} en pantalla, con cada producto en su caja. Primero las potencias, luego los productos y luego las sumas: ${lines
        .slice(1)
        .map(stepNote)
        .join("; ")}. El total es ${f(total)}.`,
    ),
    printSummary: pair(
      `${text}. Evaluate in order: powers first (${powText} = ${powVal}), then multiply, then add, left to right. The whole expression is equal at every line, and the total is ${f(total)}.`,
      `${text}. Evalúa en orden: primero las potencias (${powText} = ${powVal}), luego multiplica y luego suma, de izquierda a derecha. La expresión completa es igual en cada línea y el total es ${f(total)}.`,
    ),
    scene: {
      situate: pair("One expression", "Una sola expresión"),
      predict: pair("Predict", "Predice"),
      evaluate: pair("Evaluate in order", "Evalúa en orden"),
      connect: pair("What each part means", "Qué significa cada parte"),
      check: pair("Does the order matter?", "¿Importa el orden?"),
      transfer: pair("On your own", "Por tu cuenta"),
    },
    situateSay: pair(
      `${story ? `${story.en} ` : ""}One expression keeps every part visible: ${text}. Each product sits in its own box.`,
      `${story ? `${story.es} ` : ""}Una sola expresión mantiene visible cada parte: ${text}. Cada producto está en su caja.`,
    ),
    predictSay: pair(
      `To find the value, you must do the parts of ${text} in some order. Which part is done first?`,
      `Para hallar el valor hay que hacer las partes de ${text} en algún orden. ¿Qué parte se hace primero?`,
    ),
    predictQ: pair("Which part do you evaluate first?", "¿Qué parte evalúas primero?"),
    predictOk: pair(
      `Yes: ${powText} comes first, and it is ${powVal}. Powers come before multiplying and adding. Now evaluate the whole expression yourself.`,
      `Sí: ${powText} va primero y vale ${powVal}. Las potencias van antes de multiplicar y sumar. Ahora evalúa tú toda la expresión.`,
    ),
    cue: cueFor,
    verb: {
      pow: pair("Power", "Potencia"),
      mul: pair("Multiply", "Multiplicar"),
      add: pair("Add", "Sumar"),
      div: pair("Divide", "Dividir"),
    },
    evalSay: pair(
      "Tap the part to evaluate next. The whole expression stays on screen, and every line is equal to the one before it.",
      "Toca la parte que se evalúa después. La expresión completa se queda en pantalla y cada línea es igual a la anterior.",
    ),
    evalDone: pair(
      `Done: ${text} = ${f(total)}. Every line has the same value. Powers came first, then the products, then the sum.`,
      `Listo: ${text} = ${f(total)}. Todas las líneas valen lo mismo. Primero fueron las potencias, luego los productos y luego la suma.`,
    ),
    startOver: pair("Start over", "Empezar de nuevo"),
    stepNote: (l) =>
      pair(
        `${stepNote(l)}. The new line is equal to the one above.`,
        `${stepNote(l)}. La línea nueva es igual a la de arriba.`,
      ),
    connectSay: pair(
      `Read the expression as the order: ${meanings ? meanings.map((m, i) => `${termText(main.terms[i])} is ${m.en}`).join("; ") : text}. The sum of the three boxes is the total.`,
      `Lee la expresión como el pedido: ${meanings ? meanings.map((m, i) => `${termText(main.terms[i])} es ${m.es}`).join("; ") : text}. La suma de las tres cajas es el total.`,
    ),
    connectDone: pair(
      `${lines
        .filter((l) => l.op?.kind === "mul" || l.op?.kind === "pow")
        .map((l) => stepNote(l))
        .join(", ")}; the total is ${f(total)}.`,
      `${lines
        .filter((l) => l.op?.kind === "mul" || l.op?.kind === "pow")
        .map((l) => stepNote(l))
        .join(", ")}; el total es ${f(total)}.`,
    ),
    checkSay: pair(
      `Three students evaluated ${text} in a different order. Only one total is right.`,
      `Tres estudiantes evaluaron ${text} en otro orden. Solo un total es correcto.`,
    ),
    checkQ: pair(`What is the value of ${text}?`, `¿Cuál es el valor de ${text}?`),
    checkOk: pair(
      `Right: ${f(total)}. The order of operations gives one value, so everyone who follows it gets the same total.`,
      `Correcto: ${f(total)}. El orden de las operaciones da un solo valor, así que todos los que lo siguen obtienen el mismo total.`,
    ),
    /** A wrong total: names the slip and asks what the rule says. */
    checkCue(opt) {
      const x = f(opt.value);
      const raised = pw ? factorText(pw) : "";
      const other = main.terms.find((t) => t.includes(pw))?.find((fa) => !("e" in fa));
      return {
        left: pair(
          `${x} comes from working strictly left to right, one operation after another. Do products and powers wait for their turn, or do they go before the sums?`,
          `${x} sale de trabajar estrictamente de izquierda a derecha, una operación tras otra. ¿Los productos y las potencias esperan su turno o van antes de las sumas?`,
        ),
        times: pair(
          `${x} treats ${raised} as ${pw?.b} × ${pw?.e}. What does the small raised ${pw?.e} count?`,
          `${x} toma ${raised} como ${pw?.b} × ${pw?.e}. ¿Qué cuenta el ${pw?.e} pequeño y elevado?`,
        ),
        product: pair(
          `${x} multiplies ${other?.v} × ${pw?.b} first and raises that product. The small raised ${pw?.e} belongs to ${pw?.b} only. Which comes first, the multiplying or the power?`,
          `${x} multiplica primero ${other?.v} × ${pw?.b} y eleva ese producto. El ${pw?.e} pequeño y elevado pertenece solo a ${pw?.b}. ¿Qué va primero, multiplicar o la potencia?`,
        ),
      }[opt.kind];
    },
    transferSay: pair(
      `${transferStory ? `${transferStory.en} ` : ""}One expression: ${tText}. Its value is ${tTotal}. Which part is evaluated first?`,
      `${transferStory ? `${transferStory.es} ` : ""}Una sola expresión: ${tText}. Su valor es ${tTotal}. ¿Qué parte se evalúa primero?`,
    ),
    transferQ: pair("Which part do you evaluate first?", "¿Qué parte evalúas primero?"),
    transferOk: pair(
      `Yes. The lines show the whole order: ${tLines
        .slice(1)
        .map(stepNote)
        .join(", ")}. Inside the parentheses first, then the ÷ ${transfer.div}.`,
      `Sí. Las líneas muestran todo el orden: ${tLines
        .slice(1)
        .map(stepNote)
        .join(", ")}. Primero dentro del paréntesis y luego el ÷ ${transfer.div}.`,
    ),
    explainLabel: pair(
      `Explain: in ${tText}, why can the ÷ ${transfer.div} not be done first?`,
      `Explica: en ${tText}, ¿por qué no se puede hacer primero el ÷ ${transfer.div}?`,
    ),
    explainFrame: pair(
      "First I ___ because ___, then I ___, and last I ___.",
      "Primero ___ porque ___, luego ___ y al final ___.",
    ),
    wrong,
    tText,
    tTotal,
  };
}
