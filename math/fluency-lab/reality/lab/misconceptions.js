// Mistake Laboratory rules. A detector reads one submitted answer and returns what is CONFIRMED (a fact about the
// numbers that any reader can check) separately from HYPOTHESES (ways of thinking that would produce the answer).
// One wrong answer is never proof of how a student thinks, so every hypothesis carries a probe: a question whose
// answer tells the hypotheses apart before any repair starts. No AI, no randomness.
import { L, Rational, parseRational, fracText, decimalText } from "./kernel.js";

const digitsOf = (text) => String(text).replace(/[^\d]/g, "");
const decimalsIn = (text) => (String(text).split(".")[1] || "").length;

const fmt = (q) => decimalText(q) ?? fracText(q);

// Decimal addition: a + b answered as r (all strings the student saw or typed).
export function decimalAddition(a, b, response) {
  const A = parseRational(a);
  const B = parseRational(b);
  const r = parseRational(response);
  if (!A || !B) return null;
  const exact = A.add(B);
  if (!r) return { correct: false, unreadable: true, confirmed: [], hypotheses: [], probes: [] };
  if (r.eq(exact)) return { correct: true, confirmed: [], hypotheses: [], probes: [] };

  const confirmed = [];
  const hypotheses = [];
  if (r.lt(A) || r.lt(B)) {
    confirmed.push({
      id: "smaller-than-addend",
      text: L(
        "Your answer is smaller than one of the numbers you were adding. Adding positive numbers can only make a number bigger.",
        "Tu respuesta es menor que uno de los números que sumabas. Sumar números positivos solo puede hacer el número más grande.",
      ),
    });
  }
  const places = Math.max(decimalsIn(a), decimalsIn(b));
  const stripped = (x) => digitsOf(x).replace(/^0+/, "") || "0";
  const wholeSum = BigInt(digitsOf(a) || 0) + BigInt(digitsOf(b) || 0);
  if (places && r.eq(new Rational(wholeSum, 10n ** BigInt(places)))) {
    hypotheses.push({
      id: "digits-as-whole",
      text: L(
        `You may have added the digits as if they were whole numbers (${stripped(a)} + ${stripped(b)} = ${wholeSum}).`,
        `Quizá sumaste los dígitos como si fueran números enteros (${stripped(a)} + ${stripped(b)} = ${wholeSum}).`,
      ),
    });
  }
  // Lining up from the right: the shorter decimal's last digit is dropped into the last place.
  const shortIsA = decimalsIn(a) < decimalsIn(b);
  const shortText = shortIsA ? a : b;
  const shifted = places && decimalsIn(a) !== decimalsIn(b) ? Rational.of(`0.${(String(shortText).split(".")[1] || "").padStart(places, "0")}`).add(BigInt(String(shortText).split(".")[0] || 0)) : null;
  if (shifted && r.eq(shortIsA ? shifted.add(B) : A.add(shifted))) {
    hypotheses.push({
      id: "aligned-from-right",
      text: L(
        `You may have lined the numbers up from the right, so ${shortText} was read as ${fmt(shifted)}.`,
        `Quizá alineaste los números desde la derecha, así que ${shortText} se leyó como ${fmt(shifted)}.`,
      ),
    });
  }
  const gap = r.sub(exact).abs();
  if (!hypotheses.length && (gap.eq(Rational.of("0.1")) || gap.eq(Rational.of("0.01")) || gap.eq(1))) {
    hypotheses.push({
      id: "regroup-slip",
      text: L("A group of ten may not have been traded for one of the next place.", "Quizá no se cambió un grupo de diez por uno del lugar siguiente."),
    });
  }
  // The probe tells the two place-value hypotheses apart from a one-off slip before any repair starts.
  const probes = shifted
    ? [
        {
          id: "compare",
          prompt: L("Which number is greater?", "¿Qué número es mayor?"),
          options: [
            { id: "a", text: L(shortText, shortText) },
            { id: "b", text: L(fmt(shifted), fmt(shifted)) },
          ],
          answer: "a",
          explains: L("Tenths are bigger than hundredths, so the number with its digit in the tenths place is greater.", "Los décimos son más grandes que los centésimos, así que el número con su dígito en los décimos es mayor."),
        },
      ]
    : [];
  return {
    correct: false,
    exact,
    confirmed,
    hypotheses: hypotheses.length ? hypotheses : [{ id: "unknown", text: L("I cannot tell yet how this answer was made. The model will help us find out.", "Todavía no sé cómo se obtuvo esta respuesta. El modelo nos ayudará a averiguarlo.") }],
    probes,
    tag: hypotheses[0]?.id || "decimal-add-unknown",
  };
}

// Fraction addition: a/b + c/d answered as (a+c)/(b+d).
export function fractionAddition(a, b, response) {
  const A = parseRational(`${a[0]}/${a[1]}`);
  const B = parseRational(`${b[0]}/${b[1]}`);
  const r = parseRational(response);
  if (!r) return { correct: false, unreadable: true, confirmed: [], hypotheses: [], probes: [] };
  const exact = A.add(B);
  if (r.eq(exact)) return { correct: true, confirmed: [], hypotheses: [], probes: [] };
  const confirmed = [];
  const hypotheses = [];
  const flat = new Rational(BigInt(a[0] + b[0]), BigInt(a[1] + b[1]));
  if (r.lt(A) || r.lt(B)) {
    confirmed.push({
      id: "smaller-than-addend",
      text: L("Your answer is smaller than one of the fractions you added.", "Tu respuesta es menor que una de las fracciones que sumaste."),
    });
  }
  if (r.eq(flat)) {
    hypotheses.push({
      id: "add-denominators",
      text: L(
        `You may have added the tops and the bottoms (${a[0]} + ${b[0]} over ${a[1]} + ${b[1]}).`,
        `Quizá sumaste los numeradores y los denominadores (${a[0]} + ${b[0]} sobre ${a[1]} + ${b[1]}).`,
      ),
    });
  }
  return {
    correct: false,
    exact,
    confirmed,
    hypotheses: hypotheses.length ? hypotheses : [{ id: "unknown", text: L("I cannot tell yet how this answer was made. The bars will help us find out.", "Todavía no sé cómo se obtuvo esta respuesta. Las barras nos ayudarán a averiguarlo.") }],
    probes: [],
    tag: hypotheses[0]?.id || "fraction-add-unknown",
  };
}
