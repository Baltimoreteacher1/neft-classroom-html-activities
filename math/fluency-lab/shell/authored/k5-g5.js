// Grade 5 — authored explanations. Decimals as place value, fractions as operations on amounts, volume as layers of
// unit cubes, and expressions as instructions with an order.
import {
  L,
  binop,
  isFrac,
  isNum,
  mis,
  places,
  q,
  round,
} from "./k5-kit.js";
import { remainderDetectors } from "./k5-g4.js";
import { coordinateModel, orderOpsModel, volumeModel } from "./lm-35.js";

// Decimal column arithmetic, computed on whole numbers of the smallest place so no floating-point error creeps in.
const scaleUp = (x, p) => Math.round(x * 10 ** p);
const decOp = (item, sign) => {
  const p = binop(item);
  if (!p || p[1] !== sign) return null;
  return { a: p[0], b: p[2], pa: places(p[0]), pb: places(p[2]) };
};
/** Digits lined up on the RIGHT edge instead of on the decimal point. */
const rightAligned = (d, op) => {
  const P = Math.max(d.pa, d.pb);
  const A = scaleUp(d.a, d.pa);
  const B = scaleUp(d.b, d.pb);
  return round((op === "+" ? A + B : A - B) / 10 ** P);
};
const colNoCarry = (x, y) => {
  const a = String(x).split("").reverse().map(Number);
  const b = String(y).split("").reverse().map(Number);
  let out = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1)
    out += (((a[i] || 0) + (b[i] || 0)) % 10) * 10 ** i;
  return out;
};
const colFlip = (x, y) => {
  const a = String(x).split("").reverse().map(Number);
  const b = String(y).split("").reverse().map(Number);
  let out = 0;
  for (let i = 0; i < a.length; i += 1)
    out += Math.abs(a[i] - (b[i] || 0)) * 10 ** i;
  return out;
};
const fracOp = (item) => {
  const m = q(item).match(/^(\d+)\/(\d+)\s*([+\-×])\s*(\d+)\/(\d+)\s*=\s*\?/);
  return m
    ? {
        a: Number(m[1]),
        b: Number(m[2]),
        op: m[3],
        c: Number(m[4]),
        d: Number(m[5]),
      }
    : null;
};
const gcd = (x, y) => (y ? gcd(y, x % y) : x);
const lcm = (x, y) => (x * y) / gcd(x, y);
/** Evaluate + − × with parentheses. `precedence: false` works strictly left to right (inside parentheses too). */
function evaluate(expr, { precedence = true } = {}) {
  const tokens = expr.replaceAll("−", "-").match(/\d+|[()+\-×]/g) || [];
  let i = 0;
  const atom = () => {
    const t = tokens[i++];
    if (t === "(") {
      const v = sum();
      i += 1;
      return v;
    }
    return Number(t);
  };
  const apply = (x, op, y) => (op === "+" ? x + y : op === "-" ? x - y : x * y);
  function sum() {
    if (!precedence) {
      let v = atom();
      while (i < tokens.length && tokens[i] !== ")") {
        const op = tokens[i++];
        v = apply(v, op, atom());
      }
      return v;
    }
    let v = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      const op = tokens[i++];
      v = apply(v, op, product());
    }
    return v;
  }
  function product() {
    let v = atom();
    while (tokens[i] === "×") {
      i += 1;
      v *= atom();
    }
    return v;
  }
  return sum();
}
const evalQ = (item) => q(item).match(/^Evaluate: (.+)\.$/)?.[1] || null;
const coordMove = (item) => {
  let m = q(item).match(
    /A point is at \((\d+), (\d+)\)\. It moves (\d+) units right and (\d+) units up/,
  );
  if (m)
    return {
      x: Number(m[1]) + Number(m[3]),
      y: Number(m[2]) + Number(m[4]),
      sx: Number(m[1]),
      sy: Number(m[2]),
      r: Number(m[3]),
      u: Number(m[4]),
    };
  m = q(item).match(/Move (\d+) units right and (\d+) units up/);
  return m
    ? {
        x: Number(m[1]),
        y: Number(m[2]),
        sx: 0,
        sy: 0,
        r: Number(m[1]),
        u: Number(m[2]),
      }
    : null;
};
const pair = (raw) => {
  const m = String(raw)
    .replace(/\s+/g, "")
    .match(/^\((-?\d+),(-?\d+)\)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const DEC_PLACES = { tenths: 1, hundredths: 2, thousandths: 3 };

export const G5 = {
  "5:multiply-whole": {
    title: L(
      "Multiply multi-digit numbers",
      "Multiplica números de varios dígitos",
    ),
    concept: L(
      "Multiply by each place of the second number, one at a time. Each partial product is shifted to show its place value; then add the partial products.",
      "Multiplica por cada lugar del segundo número, uno a la vez. Cada producto parcial se corre según su valor posicional; luego suma los productos parciales.",
    ),
    reasons: [
      L("413 × 26 = 413 × 6 + 413 × 20.", "413 × 26 = 413 × 6 + 413 × 20."),
      L(
        "413 × 20 is 413 × 2 tens, so that row ends in 0.",
        "413 × 20 es 413 × 2 decenas, así que esa fila termina en 0.",
      ),
      L(
        "2,478 + 8,260 = 10,738. Estimate first: 400 × 25 = 10,000.",
        "2,478 + 8,260 = 10,738. Primero estima: 400 × 25 = 10,000.",
      ),
    ],
    misconception: L(
      "The tens row needs its 0. Without it you multiplied by 2, not by 20, and the answer is far too small.",
      "La fila de las decenas necesita su 0. Sin él multiplicaste por 2, no por 20, y la respuesta queda muy pequeña.",
    ),
    misconceptions: [
      mis(
        "no-zero",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×" || p[2] < 10 || p[2] > 99) return false;
          return isNum(raw, p[0] * (p[2] % 10) + p[0] * Math.floor(p[2] / 10));
        },
        "The second partial product needs a 0 at the end: you are multiplying by TENS. Without it, that row is 10 times too small.",
        "El segundo producto parcial necesita un 0 al final: estás multiplicando por DECENAS. Sin él, esa fila es 10 veces más pequeña.",
      ),
      mis(
        "one-row",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×" || p[2] < 10 || p[2] > 99) return false;
          return [p[0] * (p[2] % 10), p[0] * (p[2] - (p[2] % 10))].some(
            (w) => w > 0 && isNum(raw, w),
          );
        },
        "That is only one partial product. Multiply by the ones digit AND by the tens, then add the two rows.",
        "Ese es solo un producto parcial. Multiplica por el dígito de las unidades Y por las decenas, y luego suma las dos filas.",
      ),
    ],
    transfer: {
      prompt: L(
        "A school orders 24 boxes of paper. Each box has 500 sheets. How many sheets is that?",
        "Una escuela pide 24 cajas de papel. Cada caja tiene 500 hojas. ¿Cuántas hojas son?",
      ),
      answers: ["12000"],
      kind: "number",
      hint: L("24 × 5 hundreds.", "24 × 5 centenas."),
      explanation: L(
        "24 × 5 = 120, so 24 × 500 is 120 hundreds = 12,000 sheets.",
        "24 × 5 = 120, así que 24 × 500 son 120 centenas = 12,000 hojas.",
      ),
    },
  },
  "5:divide-whole": {
    title: L(
      "Divide by two-digit numbers",
      "Divide entre números de dos dígitos",
    ),
    concept: L(
      "Divide by taking out as many groups of the divisor as you can, biggest first. Estimate with friendly numbers, multiply to check, and keep the 0 when a place has no groups.",
      "Divide sacando tantos grupos del divisor como puedas, los más grandes primero. Estima con números cómodos, multiplica para comprobar y conserva el 0 cuando un lugar no tiene grupos.",
    ),
    reasons: [
      L(
        "2,268 ÷ 21: 100 groups of 21 = 2,100, leaving 168.",
        "2,268 ÷ 21: 100 grupos de 21 = 2,100 y quedan 168.",
      ),
      L(
        "168 is 8 groups of 21, so there are 0 tens: the quotient is 108.",
        "168 son 8 grupos de 21, así que hay 0 decenas: el cociente es 108.",
      ),
      L("Check: 108 × 21 = 2,268.", "Comprueba: 108 × 21 = 2,268."),
    ],
    misconception: L(
      "If a place has no groups, write 0 there. Dropping it makes the quotient 10 times too small.",
      "Si un lugar no tiene grupos, escribe 0 ahí. Si lo quitas, el cociente queda 10 veces más pequeño.",
    ),
    misconceptions: [
      ...remainderDetectors,
      mis(
        "dropped-zero",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "÷" || !Number.isInteger(p[0] / p[2]))
            return false;
          const qt = String(p[0] / p[2]);
          return (
            qt.includes("0") && raw.replace(/,/g, "") === qt.replaceAll("0", "")
          );
        },
        "A 0 is missing from your quotient. When a place has no groups, write 0 there to hold the place. Multiply to check.",
        "Falta un 0 en tu cociente. Cuando un lugar no tiene grupos, escribe 0 ahí para guardar el lugar. Multiplica para comprobar.",
      ),
    ],
    transfer: {
      prompt: L(
        "1,456 students go on a trip in buses that each hold 52 students. Every bus is full. How many buses are used?",
        "1,456 estudiantes van de excursión en autobuses donde caben 52 estudiantes cada uno. Todos los autobuses van llenos. ¿Cuántos autobuses se usan?",
      ),
      answers: ["28"],
      kind: "number",
      hint: L(
        "Try 20 buses first: 20 × 52 = 1,040.",
        "Prueba primero 20 autobuses: 20 × 52 = 1,040.",
      ),
      explanation: L(
        "20 × 52 = 1,040, leaving 416. 8 × 52 = 416. 20 + 8 = 28 buses. 1,456 ÷ 52 = 28.",
        "20 × 52 = 1,040 y quedan 416. 8 × 52 = 416. 20 + 8 = 28 autobuses. 1,456 ÷ 52 = 28.",
      ),
    },
  },
  "5:decimal-place": {
    concept: L(
      "Places to the right of the decimal point are tenths, hundredths and thousandths. Each place is one tenth of the place to its left.",
      "Los lugares a la derecha del punto decimal son décimos, centésimos y milésimos. Cada lugar es la décima parte del lugar de su izquierda.",
    ),
    reasons: [
      L(
        "1 one = 10 tenths, 1 tenth = 10 hundredths, 1 hundredth = 10 thousandths.",
        "1 unidad = 10 décimos, 1 décimo = 10 centésimos, 1 centésimo = 10 milésimos.",
      ),
      L(
        "Count from the decimal point: 1st place tenths, 2nd hundredths, 3rd thousandths.",
        "Cuenta desde el punto decimal: 1.er lugar décimos, 2.º centésimos, 3.er milésimos.",
      ),
      L(
        "There is no “oneths” place: the ones are left of the point.",
        "No existe el lugar de los «unésimos»: las unidades están a la izquierda del punto.",
      ),
    ],
    misconception: L(
      "Count places starting just right of the decimal point, not from the end of the number.",
      "Cuenta los lugares empezando justo a la derecha del punto decimal, no desde el final del número.",
    ),
    misconceptions: [
      mis(
        "neighbour-place",
        (item, raw) => {
          const m = q(item).match(
            /in the (tenths|hundredths|thousandths) place of (\d+)\.(\d+)/,
          );
          if (!m) return false;
          const k = DEC_PLACES[m[1]];
          const ds = m[3];
          const want = ds[k - 1];
          return [ds[k - 2], ds[k], k === 1 ? m[2].at(-1) : undefined].some(
            (d) => d !== undefined && d !== want && raw === d,
          );
        },
        "That digit is in the place next door. Start at the decimal point: tenths, then hundredths, then thousandths.",
        "Ese dígito está en el lugar de al lado. Empieza en el punto decimal: décimos, luego centésimos, luego milésimos.",
      ),
      mis(
        "last-digit",
        (item, raw) => {
          const m = q(item).match(
            /in the (tenths|hundredths|thousandths) place of (\d+)\.(\d+)/,
          );
          if (!m) return false;
          const k = DEC_PLACES[m[1]];
          return (
            k !== m[3].length &&
            m[3].at(-1) !== m[3][k - 1] &&
            raw === m[3].at(-1)
          );
        },
        "You gave the last digit. The place names count from the decimal point, not from the end of the number.",
        "Diste el último dígito. Los nombres de los lugares se cuentan desde el punto decimal, no desde el final del número.",
      ),
    ],
    transfer: {
      prompt: L(
        "A runner's time is 12.375 seconds. Which digit is in the hundredths place?",
        "El tiempo de una corredora es 12.375 segundos. ¿Qué dígito está en el lugar de los centésimos?",
      ),
      answers: ["7"],
      kind: "number",
      hint: L(
        "Tenths is the first place after the point.",
        "Los décimos son el primer lugar después del punto.",
      ),
      explanation: L(
        "After the point: 3 tenths, 7 hundredths, 5 thousandths. The hundredths digit is 7.",
        "Después del punto: 3 décimos, 7 centésimos, 5 milésimos. El dígito de los centésimos es 7.",
      ),
    },
  },
  "5:decimal-add": {
    title: L("Add decimals", "Suma decimales"),
    concept: L(
      "Add decimals the way you add whole numbers, keeping like places together: line up the decimal points so tenths add to tenths and hundredths to hundredths.",
      "Suma decimales como sumas números enteros, con los lugares iguales juntos: alinea los puntos decimales para que los décimos se sumen con décimos y los centésimos con centésimos.",
    ),
    reasons: [
      L(
        "Lining up the points lines up the places.",
        "Alinear los puntos alinea los lugares.",
      ),
      L(
        "A missing digit is a 0: 27.2 = 27.20.",
        "Un dígito que falta es un 0: 27.2 = 27.20.",
      ),
      L(
        "10 hundredths make 1 tenth, and 10 tenths make 1 one, so regroup as usual.",
        "10 centésimos forman 1 décimo y 10 décimos forman 1 unidad, así que reagrupa como siempre.",
      ),
    ],
    misconception: L(
      "Do not line up the last digits. Line up the decimal points, and write 0s in empty places.",
      "No alinees los últimos dígitos. Alinea los puntos decimales y escribe 0 en los lugares vacíos.",
    ),
    misconceptions: [
      mis(
        "right-aligned",
        (item, raw) => {
          const d = decOp(item, "+");
          return (
            Boolean(d) && d.pa !== d.pb && isNum(raw, rightAligned(d, "+"))
          );
        },
        "You lined up the last digits instead of the decimal points, so tenths were added to hundredths. Line up the points and fill empty places with 0.",
        "Alineaste los últimos dígitos en vez de los puntos decimales, así que sumaste décimos con centésimos. Alinea los puntos y llena los lugares vacíos con 0.",
      ),
      mis(
        "no-regroup",
        (item, raw) => {
          const d = decOp(item, "+");
          if (!d) return false;
          const P = Math.max(d.pa, d.pb);
          const w = colNoCarry(scaleUp(d.a, P), scaleUp(d.b, P)) / 10 ** P;
          return w !== round(d.a + d.b) && isNum(raw, w);
        },
        "A column made 10 or more and the extra was lost. 10 hundredths make 1 tenth; 10 tenths make 1 one. Carry it.",
        "Una columna dio 10 o más y se perdió lo extra. 10 centésimos forman 1 décimo; 10 décimos forman 1 unidad. Llévalo.",
      ),
    ],
    transfer: {
      prompt: L(
        "A notebook costs 3.75 dollars and a pen costs 1.5 dollars. How many dollars do they cost together?",
        "Un cuaderno cuesta 3.75 dólares y una pluma cuesta 1.5 dólares. ¿Cuántos dólares cuestan juntos?",
      ),
      answers: ["5.25"],
      kind: "number",
      hint: L(
        "Write 1.5 as 1.50 and line up the points.",
        "Escribe 1.5 como 1.50 y alinea los puntos.",
      ),
      explanation: L(
        "3.75 + 1.50 = 5.25 dollars: 5 + 0 hundredths, 7 + 5 = 12 tenths = 1 one and 2 tenths.",
        "3.75 + 1.50 = 5.25 dólares: 5 + 0 centésimos, 7 + 5 = 12 décimos = 1 unidad y 2 décimos.",
      ),
    },
  },
  "5:decimal-sub": {
    title: L("Subtract decimals", "Resta decimales"),
    concept: L(
      "Line up the decimal points, write 0s in empty places, and subtract like whole numbers. Regroup when a top digit is too small.",
      "Alinea los puntos decimales, escribe 0 en los lugares vacíos y resta como con números enteros. Reagrupa cuando un dígito de arriba es muy pequeño.",
    ),
    reasons: [
      L(
        "4 = 4.0, so 4 − 2.9 is 4.0 − 2.9.",
        "4 = 4.0, así que 4 − 2.9 es 4.0 − 2.9.",
      ),
      L(
        "1 one = 10 tenths, so there are enough tenths to take away.",
        "1 unidad = 10 décimos, así que hay suficientes décimos para quitar.",
      ),
      L(
        "Check by adding the answer back.",
        "Comprueba sumando la respuesta de vuelta.",
      ),
    ],
    misconception: L(
      "An empty place is not nothing to ignore: it is 0, and you may need to regroup into it. Never flip a subtraction in a column.",
      "Un lugar vacío no se ignora: vale 0 y quizá tengas que reagrupar en él. Nunca voltees una resta en una columna.",
    ),
    misconceptions: [
      mis(
        "right-aligned",
        (item, raw) => {
          const d = decOp(item, "-");
          return (
            Boolean(d) && d.pa !== d.pb && isNum(raw, rightAligned(d, "-"))
          );
        },
        "You lined up the last digits instead of the decimal points. Line up the points so tenths are under tenths, and write 0s in empty places.",
        "Alineaste los últimos dígitos en vez de los puntos decimales. Alinea los puntos para que los décimos queden bajo los décimos y escribe 0 en los lugares vacíos.",
      ),
      mis(
        "smaller-from-larger",
        (item, raw) => {
          const d = decOp(item, "-");
          if (!d) return false;
          const P = Math.max(d.pa, d.pb);
          const w = colFlip(scaleUp(d.a, P), scaleUp(d.b, P)) / 10 ** P;
          return w !== round(d.a - d.b) && isNum(raw, w);
        },
        "In a column you took the top digit from the bottom one. Regroup instead: 1 one is 10 tenths, 1 tenth is 10 hundredths.",
        "En una columna restaste el dígito de arriba del de abajo. Mejor reagrupa: 1 unidad son 10 décimos, 1 décimo son 10 centésimos.",
      ),
    ],
    transfer: {
      prompt: L(
        "A bottle holds 2 liters of water. Kai drinks 0.65 liters. How many liters are left?",
        "Una botella tiene 2 litros de agua. Kai bebe 0.65 litros. ¿Cuántos litros quedan?",
      ),
      answers: ["1.35"],
      kind: "number",
      hint: L("Write 2 as 2.00.", "Escribe 2 como 2.00."),
      explanation: L(
        "2.00 − 0.65 = 1.35 liters. Check: 1.35 + 0.65 = 2.",
        "2.00 − 0.65 = 1.35 litros. Comprueba: 1.35 + 0.65 = 2.",
      ),
    },
  },
  "5:decimal-mul": {
    title: L("Multiply decimals", "Multiplica decimales"),
    concept: L(
      "Multiply as if there were no decimal points, then place the point. Tenths × tenths make hundredths, so the product has as many decimal places as both factors together.",
      "Multiplica como si no hubiera puntos decimales y luego coloca el punto. Décimos × décimos dan centésimos, así que el producto tiene tantos lugares decimales como los dos factores juntos.",
    ),
    reasons: [
      L(
        "0.3 × 0.4: 3 tenths of 4 tenths is 12 hundredths, 0.12.",
        "0.3 × 0.4: 3 décimos de 4 décimos son 12 centésimos, 0.12.",
      ),
      L(
        "2.6 × 3 = 26 tenths × 3 = 78 tenths = 7.8.",
        "2.6 × 3 = 26 décimos × 3 = 78 décimos = 7.8.",
      ),
      L(
        "Estimate to check the point: 2.6 × 3 is about 3 × 3 = 9.",
        "Estima para comprobar el punto: 2.6 × 3 es más o menos 3 × 3 = 9.",
      ),
    ],
    misconception: L(
      "Count decimal places in BOTH factors and add them. Do not just copy the places from one factor.",
      "Cuenta los lugares decimales de LOS DOS factores y súmalos. No copies solo los lugares de un factor.",
    ),
    misconceptions: [
      mis(
        "point-misplaced",
        (item, raw) => {
          const d = decOp(item, "×");
          if (!d || d.pa + d.pb === Math.max(d.pa, d.pb)) return false;
          const digits = scaleUp(d.a, d.pa) * scaleUp(d.b, d.pb);
          return isNum(raw, digits / 10 ** Math.max(d.pa, d.pb));
        },
        "The digits are right but the decimal point is in the wrong place. Count the decimal places in BOTH factors and give the product that many. Estimate to check.",
        "Los dígitos están bien pero el punto decimal está en el lugar equivocado. Cuenta los lugares decimales de LOS DOS factores y dale esa cantidad al producto. Estima para comprobar.",
      ),
      mis(
        "split-parts",
        (item, raw) => {
          const d = decOp(item, "×");
          if (!d || !d.pa || !d.pb) return false;
          const w =
            Math.trunc(d.a) * Math.trunc(d.b) + round((d.a % 1) * (d.b % 1));
          return isNum(raw, round(w));
        },
        "You multiplied wholes by wholes and decimals by decimals, but every part of one number must multiply every part of the other (an area model has four parts).",
        "Multiplicaste enteros por enteros y decimales por decimales, pero cada parte de un número debe multiplicar cada parte del otro (un modelo de área tiene cuatro partes).",
      ),
    ],
    transfer: {
      prompt: L(
        "Apples cost 1.25 dollars per pound. How many dollars do 4 pounds cost?",
        "Las manzanas cuestan 1.25 dólares la libra. ¿Cuántos dólares cuestan 4 libras?",
      ),
      answers: ["5"],
      kind: "number",
      hint: L("125 hundredths × 4.", "125 centésimos × 4."),
      explanation: L(
        "125 × 4 = 500 hundredths = 5.00, so 1.25 × 4 = 5 dollars.",
        "125 × 4 = 500 centésimos = 5.00, así que 1.25 × 4 = 5 dólares.",
      ),
    },
  },
  "5:fraction-add": {
    title: L("Add and subtract fractions", "Suma y resta fracciones"),
    concept: L(
      "You can only add or subtract pieces of the same size. Rewrite both fractions with a common denominator, then add or subtract the numerators. The denominator stays the same.",
      "Solo puedes sumar o restar piezas del mismo tamaño. Escribe las dos fracciones con un denominador común y luego suma o resta los numeradores. El denominador no cambia.",
    ),
    reasons: [
      L(
        "1/3 + 1/5: thirds and fifths are different sizes, so use fifteenths.",
        "1/3 + 1/5: los tercios y los quintos son de tamaños distintos, así que usa quinceavos.",
      ),
      L(
        "1/3 = 5/15 and 1/5 = 3/15. Now both are fifteenths, so add the numerators.",
        "1/3 = 5/15 y 1/5 = 3/15. Ahora las dos son quinceavos, así que suma los numeradores.",
      ),
      L(
        "Adding the denominators would change the piece size, which is never right.",
        "Sumar los denominadores cambiaría el tamaño de las piezas, y eso nunca es correcto.",
      ),
    ],
    misconception: L(
      "Do not add the denominators. Two halves make 1 whole, not 2/4. Make the pieces the same size, then add only the numerators.",
      "No sumes los denominadores. Dos mitades hacen 1 entero, no 2/4. Haz las piezas del mismo tamaño y luego suma solo los numeradores.",
    ),
    misconceptions: [
      mis(
        "across",
        (item, raw) => {
          const f = fracOp(item);
          if (!f || f.op === "×") return false;
          const top = f.op === "+" ? f.a + f.c : f.a - f.c;
          const bot = f.op === "+" ? f.b + f.d : f.b - f.d;
          return bot > 0 && isFrac(raw, top / bot);
        },
        "You added (or subtracted) the denominators too. The denominator names the SIZE of the pieces; it does not get added. Find a common denominator first.",
        "Sumaste (o restaste) también los denominadores. El denominador nombra el TAMAÑO de las piezas; no se suma. Primero encuentra un denominador común.",
      ),
      mis(
        "numerators-not-scaled",
        (item, raw) => {
          const f = fracOp(item);
          if (!f || f.op === "×" || f.b === f.d) return false;
          const top = f.op === "+" ? f.a + f.c : f.a - f.c;
          return isFrac(raw, top / lcm(f.b, f.d));
        },
        "You changed the denominators but not the numerators. When the pieces are cut smaller, there are more of them: multiply each numerator by the same number as its denominator.",
        "Cambiaste los denominadores pero no los numeradores. Cuando las piezas se cortan más pequeñas, hay más: multiplica cada numerador por el mismo número que su denominador.",
      ),
    ],
    transfer: {
      prompt: L(
        "Leo walks 1/2 mile to the park and then 1/3 mile to the store. How many miles does he walk?",
        "Leo camina 1/2 milla al parque y luego 1/3 de milla a la tienda. ¿Cuántas millas camina?",
      ),
      answers: ["5/6"],
      kind: "fraction",
      hint: L("Use sixths for both.", "Usa sextos para las dos."),
      explanation: L(
        "1/2 = 3/6 and 1/3 = 2/6. 3/6 + 2/6 = 5/6 mile.",
        "1/2 = 3/6 y 1/3 = 2/6. 3/6 + 2/6 = 5/6 de milla.",
      ),
    },
  },
  "5:fraction-mul": {
    title: L("Multiply fractions", "Multiplica fracciones"),
    concept: L(
      "2/3 × 3/4 means 2/3 OF 3/4. In an area model, one fraction cuts one way and the other cuts the other way: multiply the numerators for the shaded pieces and the denominators for all the pieces.",
      "2/3 × 3/4 significa 2/3 DE 3/4. En un modelo de área, una fracción corta en un sentido y la otra en el otro: multiplica los numeradores para las piezas sombreadas y los denominadores para todas las piezas.",
    ),
    reasons: [
      L(
        "Cut a square into 3 rows and 4 columns: 12 equal pieces.",
        "Corta un cuadrado en 3 filas y 4 columnas: 12 piezas iguales.",
      ),
      L(
        "2 rows of 3 columns are shaded twice: 6 pieces.",
        "2 filas de 3 columnas quedan sombreadas dos veces: 6 piezas.",
      ),
      L(
        "So 2/3 of 3/4 is 6 of the 12 pieces. Simplify at the end if you can.",
        "Así que 2/3 de 3/4 son 6 de las 12 piezas. Simplifica al final si puedes.",
      ),
    ],
    misconception: L(
      "Multiplying fractions does not need a common denominator, and you do not cross-multiply. Multiply straight across: top × top, bottom × bottom.",
      "Para multiplicar fracciones no hace falta un denominador común, y no se multiplica en cruz. Multiplica en línea: arriba × arriba, abajo × abajo.",
    ),
    misconceptions: [
      mis(
        "cross",
        (item, raw) => {
          const f = fracOp(item);
          return (
            Boolean(f) && f.op === "×" && isFrac(raw, (f.a * f.d) / (f.b * f.c))
          );
        },
        "You multiplied across diagonally. For a product, multiply top × top and bottom × bottom.",
        "Multiplicaste en diagonal. Para un producto, multiplica arriba × arriba y abajo × abajo.",
      ),
      mis(
        "added",
        (item, raw) => {
          const f = fracOp(item);
          return (
            Boolean(f) && f.op === "×" && isFrac(raw, f.a / f.b + f.c / f.d)
          );
        },
        "You added the fractions. “×” means “of”: 2/3 × 3/4 is 2/3 OF 3/4, which is less than 3/4.",
        "Sumaste las fracciones. «×» significa «de»: 2/3 × 3/4 es 2/3 DE 3/4, que es menos que 3/4.",
      ),
    ],
    transfer: {
      prompt: L(
        "3/4 of a garden is planted. 2/5 of the planted part is tomatoes. What fraction of the whole garden is tomatoes?",
        "Se sembraron 3/4 de un huerto. 2/5 de la parte sembrada son tomates. ¿Qué fracción de todo el huerto son tomates?",
      ),
      answers: ["3/10"],
      kind: "fraction",
      hint: L("2/5 of 3/4 is 2/5 × 3/4.", "2/5 de 3/4 es 2/5 × 3/4."),
      explanation: L(
        "2 × 3 = 6 and 5 × 4 = 20, so 6/20 = 3/10 of the garden.",
        "2 × 3 = 6 y 5 × 4 = 20, así que 6/20 = 3/10 del huerto.",
      ),
    },
  },
  "5:fraction-of": {
    title: L(
      "Find a fraction of a number",
      "Encuentra una fracción de un número",
    ),
    concept: L(
      "To find 3/4 of a number, split it into 4 equal parts and take 3 of them. Divide by the denominator to find one part, then multiply by the numerator.",
      "Para encontrar 3/4 de un número, divídelo en 4 partes iguales y toma 3. Divide entre el denominador para encontrar una parte y luego multiplica por el numerador.",
    ),
    reasons: [
      L(
        "3/4 of 28: one fourth of 28 is 28 ÷ 4 = 7.",
        "3/4 de 28: un cuarto de 28 es 28 ÷ 4 = 7.",
      ),
      L(
        "Three fourths is 3 of those parts: 3 × 7 = 21.",
        "Tres cuartos son 3 de esas partes: 3 × 7 = 21.",
      ),
      L(
        "A tape diagram shows it: one bar, 4 equal sections, 3 shaded.",
        "Un diagrama de cinta lo muestra: una barra, 4 secciones iguales, 3 sombreadas.",
      ),
    ],
    misconception: L(
      "Finding one part is not the end. 1/4 of 28 is 7, but 3/4 of 28 is 3 parts: 21.",
      "Encontrar una parte no es el final. 1/4 de 28 es 7, pero 3/4 de 28 son 3 partes: 21.",
    ),
    misconceptions: [
      mis(
        "one-part",
        (item, raw) => {
          const m = q(item).match(/What is (\d+)\/(\d+) of (\d+)\?/);
          return (
            Boolean(m) &&
            Number(m[1]) > 1 &&
            isNum(raw, Number(m[3]) / Number(m[2]))
          );
        },
        "That is ONE part. The numerator says how many parts to take: multiply your answer by it.",
        "Esa es UNA parte. El numerador dice cuántas partes tomar: multiplica tu respuesta por él.",
      ),
      mis(
        "forgot-divide",
        (item, raw) => {
          const m = q(item).match(/What is (\d+)\/(\d+) of (\d+)\?/);
          return Boolean(m) && isNum(raw, Number(m[1]) * Number(m[3]));
        },
        "A fraction less than 1 of a number is SMALLER than the number. Divide by the denominator to make equal parts first.",
        "Una fracción menor que 1 de un número es MÁS PEQUEÑA que el número. Primero divide entre el denominador para hacer partes iguales.",
      ),
    ],
    transfer: {
      prompt: L(
        "A class has 30 students. 2/3 of them ride the bus. How many students ride the bus?",
        "Una clase tiene 30 estudiantes. 2/3 de ellos van en autobús. ¿Cuántos estudiantes van en autobús?",
      ),
      answers: ["20"],
      kind: "number",
      hint: L("First find 1/3 of 30.", "Primero encuentra 1/3 de 30."),
      explanation: L(
        "30 ÷ 3 = 10, so 1/3 is 10 students and 2/3 is 2 × 10 = 20 students.",
        "30 ÷ 3 = 10, así que 1/3 son 10 estudiantes y 2/3 son 2 × 10 = 20 estudiantes.",
      ),
    },
  },
  "5:unit-fraction-division": {
    title: L("Divide with unit fractions", "Divide con fracciones unitarias"),
    concept: L(
      "There are two kinds of question. How many 1/4s fit in 3? Each whole holds 4 of them, so the answer is MORE than 3. What is 1/4 shared by 3? Each share is LESS than 1/4.",
      "Hay dos tipos de pregunta. ¿Cuántos 1/4 caben en 3? Cada entero tiene 4, así que la respuesta es MÁS que 3. ¿Cuánto es 1/4 repartido entre 3? Cada parte es MENOS que 1/4.",
    ),
    reasons: [
      L(
        "Dividing a whole number by a unit fraction counts how many pieces fit, so the answer is bigger.",
        "Dividir un número entero entre una fracción unitaria cuenta cuántas piezas caben, así que la respuesta es mayor.",
      ),
      L(
        "Sharing a unit fraction cuts it into smaller pieces, so each share is smaller.",
        "Repartir una fracción unitaria la corta en piezas más pequeñas, así que cada parte es más pequeña.",
      ),
      L(
        "Check with multiplication: number of pieces × size of a piece gives back the amount you started with.",
        "Comprueba con una multiplicación: número de piezas × tamaño de una pieza da la cantidad con la que empezaste.",
      ),
    ],
    misconception: L(
      "Ask which way the amount goes. How many small servings fit in a whole: MORE than the whole number. Sharing a small piece: LESS than the piece.",
      "Pregúntate hacia dónde va la cantidad. Cuántas porciones pequeñas caben en un entero: MÁS que el número entero. Repartir un trozo pequeño: MENOS que el trozo.",
    ),
    misconceptions: [
      mis(
        "divided-whole",
        (item, raw) => {
          const m = q(item).match(
            /holds (\d+) liters\. How many 1\/(\d+)-liter servings/,
          );
          return Boolean(m) && isFrac(raw, Number(m[1]) / Number(m[2]));
        },
        "Each serving is smaller than a liter, so MANY servings fit in each liter: 1 liter holds as many as the denominator. Multiply.",
        "Cada porción es más pequeña que un litro, así que en cada litro caben MUCHAS: 1 litro tiene tantas como dice el denominador. Multiplica.",
      ),
      mis(
        "multiplied-share",
        (item, raw) => {
          const m = q(item).match(
            /1\/(\d+) meter long is shared equally by (\d+) students/,
          );
          return Boolean(m) && isFrac(raw, Number(m[2]) / Number(m[1]));
        },
        "Sharing makes each piece SMALLER. Cut the piece into as many parts as there are students: the denominator gets bigger.",
        "Repartir hace cada trozo MÁS PEQUEÑO. Corta el trozo en tantas partes como estudiantes hay: el denominador se hace mayor.",
      ),
    ],
    transfer: {
      prompt: L(
        "A pan of cornbread is 1/2 of a full tray. 4 friends share it equally. What fraction of a full tray does each friend get?",
        "Un molde de pan de maíz es 1/2 de una bandeja completa. 4 amigos lo reparten en partes iguales. ¿Qué fracción de una bandeja completa recibe cada amigo?",
      ),
      answers: ["1/8"],
      kind: "fraction",
      hint: L(
        "Cut the half into 4 equal pieces.",
        "Corta la mitad en 4 piezas iguales.",
      ),
      explanation: L(
        "1/2 ÷ 4 = 1/8, because 4 × 1/8 = 4/8 = 1/2.",
        "1/2 ÷ 4 = 1/8, porque 4 × 1/8 = 4/8 = 1/2.",
      ),
    },
  },
  "5:volume": {
    title: L("Volume of a box", "Volumen de una caja"),
    concept: L(
      "Volume is how many unit cubes fill a solid. A box is layers of cubes: one layer is length × width cubes, and the height says how many layers.",
      "El volumen es cuántos cubos unitarios llenan un cuerpo. Una caja son capas de cubos: una capa tiene largo × ancho cubos, y la altura dice cuántas capas hay.",
    ),
    reasons: [
      L(
        "A 4 by 3 floor holds 4 × 3 = 12 cubes.",
        "Un piso de 4 por 3 tiene 4 × 3 = 12 cubos.",
      ),
      L(
        "Stacking 2 layers gives 12 × 2 = 24 cubes.",
        "Apilar 2 capas da 12 × 2 = 24 cubos.",
      ),
      L(
        "So V = length × width × height, in cubic units.",
        "Así que V = largo × ancho × altura, en unidades cúbicas.",
      ),
    ],
    misconception: L(
      "Volume multiplies all three dimensions. Adding them, or multiplying only two, does not count the cubes.",
      "El volumen multiplica las tres dimensiones. Sumarlas, o multiplicar solo dos, no cuenta los cubos.",
    ),
    misconceptions: [
      mis(
        "added",
        (item, raw) => {
          const m = q(item).match(/prism: (\d+) × (\d+) × (\d+)/);
          return (
            Boolean(m) && isNum(raw, Number(m[1]) + Number(m[2]) + Number(m[3]))
          );
        },
        "You added the edges. Volume counts cubes: one layer is length × width, and there is one layer for each unit of height.",
        "Sumaste las aristas. El volumen cuenta cubos: una capa es largo × ancho, y hay una capa por cada unidad de altura.",
      ),
      mis(
        "one-layer",
        (item, raw) => {
          const m = q(item).match(/prism: (\d+) × (\d+) × (\d+)/);
          if (!m) return false;
          const [l, w, h] = m.slice(1).map(Number);
          return [l * w, l * h, w * h].some((x) => isNum(raw, x));
        },
        "That counts the cubes in one layer. Multiply by the third dimension to count every layer.",
        "Eso cuenta los cubos de una capa. Multiplica por la tercera dimensión para contar todas las capas.",
      ),
    ],
    living: volumeModel,
    transfer: {
      prompt: L(
        "A fish tank is 5 feet long, 2 feet wide and 3 feet tall. How many cubic feet of water fill it?",
        "Una pecera mide 5 pies de largo, 2 pies de ancho y 3 pies de alto. ¿Cuántos pies cúbicos de agua la llenan?",
      ),
      answers: ["30"],
      kind: "number",
      unit: L("cubic feet", "pies cúbicos"),
      hint: L("One layer: 5 × 2 cubes.", "Una capa: 5 × 2 cubos."),
      explanation: L(
        "One layer is 5 × 2 = 10 cubic feet, and there are 3 layers: 10 × 3 = 30 cubic feet.",
        "Una capa son 5 × 2 = 10 pies cúbicos y hay 3 capas: 10 × 3 = 30 pies cúbicos.",
      ),
    },
  },
  "5:coordinate-plane": {
    concept: L(
      "An ordered pair (x, y) gives directions from the origin (0, 0): x says how far right, then y says how far up. The order matters.",
      "Un par ordenado (x, y) da instrucciones desde el origen (0, 0): x dice cuánto a la derecha y luego y dice cuánto hacia arriba. El orden importa.",
    ),
    reasons: [
      L(
        "(3, 5) and (5, 3) are different points.",
        "(3, 5) y (5, 3) son puntos diferentes.",
      ),
      L(
        "Moving right changes only x; moving up changes only y.",
        "Moverse a la derecha cambia solo x; moverse hacia arriba cambia solo y.",
      ),
      L(
        "Two points with the same y are on one horizontal line; their distance is the difference of the x's.",
        "Dos puntos con la misma y están en una línea horizontal; su distancia es la diferencia de las x.",
      ),
    ],
    misconception: L(
      "Right comes first, up comes second: (right, up). And distance counts the spaces between the points, not the points.",
      "Primero va la derecha y después arriba: (derecha, arriba). Y la distancia cuenta los espacios entre los puntos, no los puntos.",
    ),
    misconceptions: [
      mis(
        "swapped",
        (item, raw) => {
          const c = coordMove(item);
          const p = pair(raw);
          return Boolean(c && p) && c.x !== c.y && p[0] === c.y && p[1] === c.x;
        },
        "You swapped the numbers. The first number is always how far RIGHT (x), the second is how far UP (y).",
        "Cambiaste el orden de los números. El primero siempre dice cuánto a la DERECHA (x) y el segundo cuánto hacia ARRIBA (y).",
      ),
      mis(
        "moved-wrong-way",
        (item, raw) => {
          const c = coordMove(item);
          const p = pair(raw);
          return (
            Boolean(c && p) &&
            c.sx + c.u === p[0] &&
            c.sy + c.r === p[1] &&
            c.r !== c.u
          );
        },
        "You added the right move to y and the up move to x. Moving right changes x; moving up changes y.",
        "Sumaste el movimiento a la derecha a y, y el de arriba a x. Moverse a la derecha cambia x; moverse hacia arriba cambia y.",
      ),
      mis(
        "counted-points",
        (item, raw) => {
          const m = q(item).match(
            /\((\d+), (\d+)\) and \((\d+), (\d+)\)\. How many units apart/,
          );
          return (
            Boolean(m) && isNum(raw, Math.abs(Number(m[3]) - Number(m[1])) + 1)
          );
        },
        "One too many: you counted grid points. Distance counts the units BETWEEN the points: subtract the x-coordinates.",
        "Una de más: contaste los puntos de la cuadrícula. La distancia cuenta las unidades ENTRE los puntos: resta las coordenadas x.",
      ),
    ],
    living: coordinateModel,
    transfer: {
      prompt: L(
        "On a map grid, the school is at (2, 6) and the library is at (9, 6). How many blocks apart are they?",
        "En la cuadrícula de un mapa, la escuela está en (2, 6) y la biblioteca en (9, 6). ¿A cuántas cuadras están?",
      ),
      answers: ["7"],
      kind: "number",
      unit: L("blocks", "cuadras"),
      hint: L(
        "Same y, so they are on one horizontal line.",
        "Tienen la misma y, así que están en una línea horizontal.",
      ),
      explanation: L(
        "Only x changes, from 2 to 9: 9 − 2 = 7 blocks.",
        "Solo cambia x, de 2 a 9: 9 − 2 = 7 cuadras.",
      ),
    },
  },
  "5:order-ops": {
    title: L("Order of operations", "Orden de las operaciones"),
    concept: L(
      "An expression is a set of instructions, and everyone must get the same answer. So we agree: parentheses first, then multiplication and division, then addition and subtraction, left to right.",
      "Una expresión es un conjunto de instrucciones y todos deben obtener la misma respuesta. Por eso acordamos: primero los paréntesis, luego multiplicación y división, y luego suma y resta, de izquierda a derecha.",
    ),
    reasons: [
      L(
        "In 3 + 4 × 10, the 4 × 10 is one group of things: 3 + 40 = 43.",
        "En 3 + 4 × 10, el 4 × 10 es un solo grupo de cosas: 3 + 40 = 43.",
      ),
      L(
        "Parentheses change the groups: (3 + 4) × 10 = 7 × 10 = 70.",
        "Los paréntesis cambian los grupos: (3 + 4) × 10 = 7 × 10 = 70.",
      ),
      L(
        "The picture shows the difference: 10 rows of 7, or 3 alone plus 10 rows of 4.",
        "El dibujo muestra la diferencia: 10 filas de 7, o 3 solos más 10 filas de 4.",
      ),
    ],
    misconception: L(
      "Do not just work left to right. Multiply before you add or subtract, unless parentheses say otherwise.",
      "No trabajes solo de izquierda a derecha. Multiplica antes de sumar o restar, a menos que los paréntesis digan otra cosa.",
    ),
    misconceptions: [
      mis(
        "left-to-right",
        (item, raw) => {
          const e = evalQ(item);
          return Boolean(e) && isNum(raw, evaluate(e, { precedence: false }));
        },
        "You worked left to right. Multiplication comes before addition and subtraction: do the × first (after anything in parentheses).",
        "Trabajaste de izquierda a derecha. La multiplicación va antes que la suma y la resta: haz primero la × (después de lo que esté entre paréntesis).",
      ),
      mis(
        "ignored-parentheses",
        (item, raw) => {
          const e = evalQ(item);
          return (
            Boolean(e) &&
            e.includes("(") &&
            isNum(raw, evaluate(e.replace(/[()]/g, "")))
          );
        },
        "You skipped the parentheses. Whatever is inside ( ) is done first, even an addition.",
        "Te saltaste los paréntesis. Lo que está dentro de ( ) se hace primero, aunque sea una suma.",
      ),
    ],
    living: orderOpsModel,
    transfer: {
      prompt: L(
        "Tickets cost 6 dollars each. A family buys 3 tickets and one 4-dollar snack. The total is 4 + 3 × 6. How many dollars is that?",
        "Los boletos cuestan 6 dólares cada uno. Una familia compra 3 boletos y un bocadillo de 4 dólares. El total es 4 + 3 × 6. ¿Cuántos dólares son?",
      ),
      answers: ["22"],
      kind: "number",
      unit: L("dollars", "dólares"),
      hint: L("The 3 tickets are 3 × 6.", "Los 3 boletos son 3 × 6."),
      explanation: L(
        "3 × 6 = 18 for tickets, then 4 + 18 = 22 dollars.",
        "3 × 6 = 18 por los boletos y luego 4 + 18 = 22 dólares.",
      ),
    },
  },
};

