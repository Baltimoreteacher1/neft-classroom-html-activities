// The eight flagship experiences. Each is a declarative journey over one model: every check reads the exact model state,
// so a student who builds a different valid object is accepted, and a transfer problem is generated from a seed.
import { L, R, ask, explain, frame, hint, idea, opt, task, transfer, w, done, notYet, decimalAddition, gcd } from "./authoring.js";

const sq = (n) => String(n);
const T = (en, es) => L(en, es);

// ---- 1. Living Math Models: 3/4 becomes 6/8 -------------------------------------------------------------------------
export const fractionTransform = {
  id: "fraction-transform",
  innovation: "living",
  title: T("Cut it up: 3/4 becomes 6/8", "Córtalo: 3/4 se convierte en 6/8"),
  blurb: T("Build 3/4 yourself, cut every part in two, and watch what stays the same.", "Construye 3/4 tú mismo, corta cada parte en dos y observa qué se queda igual."),
  model: "fraction",
  params: { den: 1 },
  grades: [3, 4, 5],
  skills: ["3:fraction-equivalence", "4:fraction-equiv"],
  steps: [
    task(
      "build",
      T("Cut the whole bar into 4 equal parts and shade 3 of them.", "Corta la barra entera en 4 partes iguales y sombrea 3."),
      (s, d) => (d.den === 4 && d.num === 3 ? done(T("That is 3/4: three of four equal parts.", "Eso es 3/4: tres de cuatro partes iguales.")) : notYet(T(`You have ${d.num} of ${d.den} parts shaded. Make it 3 of 4.`, `Tienes ${d.num} de ${d.den} partes sombreadas. Haz que sean 3 de 4.`))),
      [hint("Use “Cut the whole into” and choose 4.", "Usa “Cortar el entero en” y elige 4."), hint("Then tap three parts to shade them.", "Luego toca tres partes para sombrearlas.")],
    ),
    ask("predict", T("You will cut every fourth into 2 equal pieces. Predict: what happens to the amount that is shaded?", "Vas a cortar cada cuarto en 2 piezas iguales. Predice: ¿qué le pasa a la cantidad sombreada?"), [
      opt("more", "It gets bigger.", "Se hace más grande.", false, "More pieces are shaded, but each piece is smaller.", "Hay más piezas sombreadas, pero cada pieza es más pequeña."),
      opt("same", "It stays the same.", "Se queda igual.", true),
      opt("less", "It gets smaller.", "Se hace más pequeña.", false, "The shaded pieces are smaller, but there are more of them.", "Las piezas sombreadas son más pequeñas, pero hay más."),
    ], { graded: false, revisit: true }),
    task(
      "split",
      T("Cut every part into 2 equal pieces. Keep the shading.", "Corta cada parte en 2 piezas iguales. Conserva el sombreado."),
      (s, d) => (d.den === 8 && d.num === 6 ? done(T("3/4 became 6/8, and the shaded amount did not change.", "3/4 se convirtió en 6/8 y la cantidad sombreada no cambió.")) : notYet(T("Use “Cut every part” with 2.", "Usa “Cortar cada parte” con 2."))),
      [hint("The button “Cut every part” splits all the parts at once.", "El botón “Cortar cada parte” divide todas las partes a la vez.")],
    ),
    ask("see", T("Compare your prediction with the bar. What stayed the same when 3/4 became 6/8?", "Compara tu predicción con la barra. ¿Qué se quedó igual cuando 3/4 se convirtió en 6/8?"), [
      opt("amount", "The amount of the bar that is shaded.", "La cantidad de la barra que está sombreada.", true, "The same part of the whole is shaded: 3/4 = 6/8.", "Se sombrea la misma parte del entero: 3/4 = 6/8."),
      opt("count", "The number of shaded pieces.", "El número de piezas sombreadas.", false, "There were 3 shaded pieces and now there are 6.", "Había 3 piezas sombreadas y ahora hay 6."),
      opt("parts", "The number of parts in the bar.", "El número de partes de la barra.", false, "There were 4 parts and now there are 8.", "Había 4 partes y ahora hay 8."),
    ]),
    ask("line", T("Open the number line view. Where does 6/8 land compared with 3/4?", "Abre la vista de la recta numérica. ¿Dónde cae 6/8 comparado con 3/4?"), [
      opt("same", "At exactly the same point.", "Exactamente en el mismo punto.", true, "Equal fractions are the same distance from 0.", "Las fracciones iguales están a la misma distancia del 0."),
      opt("right", "A little to the right.", "Un poco a la derecha.", false, "6/8 and 3/4 are the same amount, so they share one point.", "6/8 y 3/4 son la misma cantidad, así que comparten un punto."),
      opt("left", "A little to the left.", "Un poco a la izquierda.", false, "6/8 and 3/4 are the same amount, so they share one point.", "6/8 y 3/4 son la misma cantidad, así que comparten un punto."),
    ], { rep: "line" }),
    task(
      "another",
      T("Make a different fraction that is still equal to 3/4. Cut or join the parts, keeping the shaded amount.", "Haz otra fracción que siga siendo igual a 3/4. Corta o une las partes conservando la cantidad sombreada."),
      (s, d) => (d.value.eq(R(3, 4)) && ![4, 8].includes(d.den) ? done(T(`${d.num}/${d.den} is also 3/4.`, `${d.num}/${d.den} también es 3/4.`)) : notYet(T("Find a fraction equal to 3/4 with a different number of parts than 4 or 8.", "Encuentra una fracción igual a 3/4 con un número de partes distinto de 4 y 8."))),
      [hint("Try cutting every part into 3 pieces.", "Prueba cortar cada parte en 3 piezas."), hint("12 equal parts with 9 shaded works.", "12 partes iguales con 9 sombreadas sirven.")],
    ),
    explain(
      "why",
      T("Explain why the amount stays the same.", "Explica por qué la cantidad se queda igual."),
      [
        frame(T("When every part is cut into smaller equal pieces, the whole bar keeps the same", "Cuando cada parte se corta en piezas iguales más pequeñas, la barra entera conserva el mismo"), [w("size", "tamaño", true), w("number of parts", "número de partes"), w("color", "color")]),
        frame(T("The shaded amount stays the same because each piece gets", "La cantidad sombreada se queda igual porque cada pieza se vuelve"), [w("smaller as the number of pieces gets bigger", "más pequeña mientras el número de piezas crece", true), w("bigger", "más grande"), w("shaded", "sombreada")]),
      ],
      [idea("same", ["same", "equal", "stays", "igual", "mismo", "no change", "sigue"]), idea("cut", ["cut", "split", "pieces", "parts", "divid", "piezas", "partes", "corta"]), idea("both", ["both", "times", "twice", "double", "multipl", "numerator", "denominator", "numerador", "denominador", "doble", "veces"])],
      { reveal: T("Multiplying the top and the bottom by the same number cuts every part into equal smaller pieces, so the amount stays the same: 3/4 = (3 × 2)/(4 × 2) = 6/8.", "Multiplicar el numerador y el denominador por el mismo número corta cada parte en piezas iguales más pequeñas, así que la cantidad es la misma: 3/4 = (3 × 2)/(4 × 2) = 6/8.") },
    ),
    transfer("new", (rng) => {
      const [a, b] = rng.pick([[2, 3], [3, 5], [1, 2], [5, 6], [2, 5], [3, 8]]);
      const k = rng.int(2, Math.floor(24 / b) > 4 ? 4 : Math.floor(24 / b));
      return {
        kind: "build",
        prompt: T(`The bar shows ${a}/${b}. Change it to an equal fraction with ${b * k} equal parts.`, `La barra muestra ${a}/${b}. Cámbiala a una fracción igual con ${b * k} partes iguales.`),
        params: { den: b, shaded: Array.from({ length: a }, (_, i) => i) },
        check: (s, d) => d.den === b * k && d.num === a * k,
        hints: [hint(`Cut every part into ${k} equal pieces.`, `Corta cada parte en ${k} piezas iguales.`)],
        answerText: `${a * k}/${b * k}`,
      };
    }),
  ],
};

// ---- 2. Math Physics: balance an equation -----------------------------------------------------------------------------
const eqSolve = (a, b, c) => ({ x: (c - b) / a });
export const balanceEquation = {
  id: "balance-equation",
  innovation: "physics",
  title: T("Balance an equation", "Equilibra una ecuación"),
  blurb: T("Take things off the scale and discover why both sides must change together.", "Quita cosas de la balanza y descubre por qué ambos lados deben cambiar juntos."),
  model: "balance",
  params: { x: 5, left: { x: 1, u: 3 }, right: { x: 0, u: 8 } },
  grades: [6, 7, 8],
  skills: ["6:one-step", "7:equations", "8:linear-equations"],
  steps: [
    ask("predict", T("The scale is balanced: x + 3 = 8. If you take 3 units off only the left pan, what will the scale do?", "La balanza está equilibrada: x + 3 = 8. Si quitas 3 unidades solo del platillo izquierdo, ¿qué hará la balanza?"), [
      opt("same", "It will stay balanced.", "Se quedará equilibrada.", false),
      opt("right", "The right side will be heavier.", "El lado derecho pesará más.", true),
      opt("left", "The left side will be heavier.", "El lado izquierdo pesará más.", false),
    ], { graded: false, revisit: true }),
    task(
      "break",
      T("Take 3 units off the left pan only.", "Quita 3 unidades solo del platillo izquierdo."),
      (s, d) => (s.left.u === 0 && s.right.u === 8 ? done(T("Now x < 8: the scale tips to the right because only one side changed.", "Ahora x < 8: la balanza se inclina a la derecha porque solo cambió un lado.")) : notYet(T("Remove the 3 units from the left pan and leave the right pan alone.", "Quita las 3 unidades del platillo izquierdo y deja el derecho."))),
      [hint("Use “Take 3 off” under the left pan.", "Usa “Quitar 3” debajo del platillo izquierdo.")],
    ),
    task(
      "restore",
      T("Make the scale balance again by changing only the right pan.", "Haz que la balanza se equilibre otra vez cambiando solo el platillo derecho."),
      (s, d) => (d.balanced && s.left.u === 0 ? done(T("Balanced again: you took 3 from each side, so equality came back.", "Equilibrada otra vez: quitaste 3 de cada lado, así que volvió la igualdad.")) : notYet(d.balanced ? T("Balanced, but leave the left pan alone.", "Equilibrada, pero deja en paz el platillo izquierdo.") : T(`The scale is not balanced yet: ${d.equation}.`, `La balanza aún no está equilibrada: ${d.equation}.`))),
      [hint("The right pan has 3 more than the left. Take away that much.", "El platillo derecho tiene 3 más que el izquierdo. Quita esa cantidad.")],
    ),
    ask("discover", T("Look at what you did to each side. What do you notice?", "Mira lo que hiciste en cada lado. ¿Qué notas?"), [
      opt("same", "I took away the same amount from both sides.", "Quité la misma cantidad de ambos lados.", true, "Equal changes on both sides keep the scale balanced.", "Cambios iguales en ambos lados mantienen la balanza equilibrada."),
      opt("one", "Changing one side keeps it balanced.", "Cambiar un lado la mantiene equilibrada.", false, "When only one side changed, the scale tipped.", "Cuando solo cambió un lado, la balanza se inclinó."),
      opt("random", "Any amount works on the right pan.", "Cualquier cantidad sirve en el platillo derecho.", false, "Only the amount that matches the left change restores balance.", "Solo la cantidad que coincide con el cambio izquierdo restaura el equilibrio."),
    ]),
    task(
      "solve",
      T("A new scale: 2x + 3 = 11. Change both sides to leave one x-bag alone and discover what x weighs.", "Una balanza nueva: 2x + 3 = 11. Cambia ambos lados para dejar una sola bolsa x y descubre cuánto pesa x."),
      (s, d) => (d.solved ? done(T(`x = ${s.right.u}. You kept the scale balanced all the way.`, `x = ${s.right.u}. Mantuviste la balanza equilibrada todo el camino.`)) : notYet(d.balanced ? T(`Still balanced: ${d.equation}. Keep going.`, `Sigue equilibrada: ${d.equation}. Continúa.`) : T("It tipped! Undo, or fix the other side.", "¡Se inclinó! Deshaz o arregla el otro lado."))),
      [hint("Take 3 units off each side first.", "Primero quita 3 unidades de cada lado."), hint("Then split both sides into 2 equal groups.", "Luego divide ambos lados en 2 grupos iguales.")],
      { params: { x: 4, left: { x: 2, u: 3 }, right: { x: 0, u: 11 } } },
    ),
    explain(
      "why",
      T("Explain why you must do the same thing to both sides.", "Explica por qué debes hacer lo mismo en ambos lados."),
      [
        frame(T("To keep a scale balanced, whatever I do to one side I must do to", "Para mantener una balanza equilibrada, lo que hago en un lado debo hacerlo en"), [w("the other side", "el otro lado", true), w("the same side again", "el mismo lado otra vez"), w("nothing else", "nada más")]),
        frame(T("That is why solving an equation keeps both sides", "Por eso al resolver una ecuación ambos lados se mantienen"), [w("equal", "iguales", true), w("different", "diferentes"), w("heavier", "más pesados")]),
      ],
      [idea("both", ["both", "other side", "same", "each side", "ambos", "otro lado", "mismo", "cada lado"]), idea("equal", ["equal", "balance", "equilib", "igual"]), idea("op", ["subtract", "add", "divide", "take", "remove", "resta", "suma", "divid", "quit"])],
      { reveal: T("If a = b, then a − 3 = b − 3 and a ÷ 2 = b ÷ 2. Equal operations on both sides keep an equation true.", "Si a = b, entonces a − 3 = b − 3 y a ÷ 2 = b ÷ 2. Operaciones iguales en ambos lados mantienen verdadera una ecuación.") },
    ),
    transfer("new", (rng) => {
      const a = rng.pick([1, 2, 3]);
      const x = rng.int(2, 9);
      const b = rng.int(1, 9);
      const c = a * x + b;
      return {
        kind: "build",
        prompt: T(`Solve ${a === 1 ? "" : a}x + ${b} = ${c} on the scale. What does x weigh?`, `Resuelve ${a === 1 ? "" : a}x + ${b} = ${c} en la balanza. ¿Cuánto pesa x?`),
        params: { x, left: { x: a, u: b }, right: { x: 0, u: c } },
        check: (s, d) => d.solved && s.right.u === x,
        hints: [hint(`Take ${b} off each side first.`, `Primero quita ${b} de cada lado.`)],
        answerText: `x = ${eqSolve(a, b, c).x}`,
      };
    }),
  ],
};

// ---- 3. Predict, manipulate, discover: doubling the width --------------------------------------------------------------
const pairsDoubling = (cases) => {
  const out = [];
  for (const a of cases) for (const b of cases) if (b.w === 2 * a.w && b.h === a.h) out.push([a, b]);
  return out;
};
export const discoverArea = {
  id: "discover-area",
  innovation: "discover",
  title: T("Discover what doubling does to area", "Descubre qué hace duplicar el área"),
  blurb: T("Predict, stretch a rectangle, test more cases, then say the rule yourself.", "Predice, estira un rectángulo, prueba más casos y di la regla tú mismo."),
  model: "area",
  params: { w: 3, h: 4, maxW: 12, maxH: 12 },
  grades: [3, 4, 5],
  skills: ["3:area"],
  steps: [
    ask("predict", T("A rectangle is 3 units wide and 4 units tall. If its width doubles, what happens to its area?", "Un rectángulo mide 3 unidades de ancho y 4 de alto. Si su ancho se duplica, ¿qué le pasa al área?"), [
      opt("same", "The area stays the same.", "El área se queda igual.", false),
      opt("double", "The area doubles.", "El área se duplica.", true),
      opt("add", "The area goes up by 2.", "El área aumenta en 2.", false),
      opt("four", "The area is 4 times as big.", "El área es 4 veces más grande.", false),
    ], { graded: false, revisit: true }),
    task(
      "double",
      T("Save the 3 × 4 rectangle. Then drag its right edge (or use the width buttons) to make it 6 wide and save that one too.", "Guarda el rectángulo de 3 × 4. Luego arrastra su borde derecho (o usa los botones de ancho) para hacerlo de 6 de ancho y guárdalo también."),
      (s, d) => (d.cases.some((c) => c.w === 3 && c.h === 4) && d.cases.some((c) => c.w === 6 && c.h === 4) ? done(T("3 × 4 = 12 and 6 × 4 = 24.", "3 × 4 = 12 y 6 × 4 = 24.")) : notYet(T("Save 3 × 4, then stretch to 6 × 4 and save again. The height stays 4.", "Guarda 3 × 4, luego estira a 6 × 4 y guarda otra vez. El alto sigue siendo 4."))),
      [hint("The width is the bottom side. Make it 6.", "El ancho es el lado de abajo. Hazlo 6.")],
    ),
    ask("compare", T("Compare the two saved rectangles. How many times as big is the second area?", "Compara los dos rectángulos guardados. ¿Cuántas veces más grande es la segunda área?"), [
      opt("2", "2 times as big.", "2 veces más grande.", true, "24 is 2 times 12.", "24 es 2 veces 12."),
      opt("4", "4 times as big.", "4 veces más grande.", false, "24 ÷ 12 = 2.", "24 ÷ 12 = 2."),
      opt("1", "The same size.", "El mismo tamaño.", false, "24 is not 12.", "24 no es 12."),
    ]),
    task(
      "test",
      T("Does it work for other sizes? Save at least two more pairs: a rectangle and the same rectangle with its width doubled.", "¿Funciona con otros tamaños? Guarda al menos dos pares más: un rectángulo y el mismo con su ancho duplicado."),
      (s, d) => {
        const pairs = pairsDoubling(d.cases).filter(([a]) => !(a.w === 3 && a.h === 4));
        return pairs.length >= 2 ? done(T("Every time the width doubled, the area doubled too.", "Cada vez que el ancho se duplicó, el área también se duplicó.")) : notYet(T(`${pairs.length} of 2 new pairs found.`, `${pairs.length} de 2 pares nuevos encontrados.`));
      },
      [hint("Try 2 × 5 and 4 × 5, or 1 × 3 and 2 × 3.", "Prueba 2 × 5 y 4 × 5, o 1 × 3 y 2 × 3.")],
    ),
    ask("discover", T("What rule did you find?", "¿Qué regla encontraste?"), [
      opt("rule", "Doubling the width doubles the area, as long as the height stays the same.", "Duplicar el ancho duplica el área, mientras el alto no cambie.", true),
      opt("add", "Doubling the width adds 12 to the area.", "Duplicar el ancho suma 12 al área.", false, "Try 2 × 5: doubling the width adds 10, not 12.", "Prueba 2 × 5: duplicar el ancho suma 10, no 12."),
      opt("four", "Doubling the width makes the area 4 times as big.", "Duplicar el ancho hace el área 4 veces más grande.", false, "Your pairs show 2 times, not 4.", "Tus pares muestran 2 veces, no 4."),
    ]),
    explain(
      "why",
      T("Say why the rule works.", "Di por qué funciona la regla."),
      [
        frame(T("When the width doubles and the height stays the same, the area gets", "Cuando el ancho se duplica y el alto no cambia, el área se vuelve"), [w("twice as big", "dos veces más grande", true), w("four times as big", "cuatro veces más grande"), w("2 more", "2 más")]),
        frame(T("because every column added has the same ___ of squares as the first.", "porque cada columna que se agrega tiene el mismo ___ de cuadros que la primera."), [w("number", "número", true), w("color", "color"), w("perimeter", "perímetro")], "."),
      ],
      [idea("twice", ["twice", "double", "2 times", "two times", "doble", "dos veces", "el doble"]), idea("columns", ["column", "row", "squares", "same height", "copy", "columna", "fila", "cuadros", "cuadrados", "misma altura"]), idea("mult", ["multiply", "×", "times", "width", "multipl", "ancho"])],
      { reveal: T("The area is width × height. With a width of 2w and the same height: (2w) × h = 2 × (w × h). The area is exactly doubled.", "El área es ancho × alto. Con un ancho de 2a y el mismo alto: (2a) × h = 2 × (a × h). El área se duplica exactamente.") },
    ),
    transfer("new", (rng) => {
      const w0 = rng.int(2, 9);
      const h0 = rng.int(2, 9);
      const side = rng.pick(["width", "height"]);
      return {
        kind: "answer",
        prompt: T(`A rectangle is ${w0} units by ${h0} units. Its ${side} doubles and the other side stays the same. What is the new area?`, `Un rectángulo mide ${w0} por ${h0} unidades. Su ${side === "width" ? "ancho" : "alto"} se duplica y el otro lado no cambia. ¿Cuál es el área nueva?`),
        expect: 2 * w0 * h0,
        hints: [hint("First find the original area.", "Primero halla el área original."), hint(`The original area is ${w0 * h0}. What does doubling do?`, `El área original es ${w0 * h0}. ¿Qué hace duplicar?`)],
      };
    }),
  ],
};

// ---- 4. X-Ray: why 3/4 ÷ 1/8 = 6 --------------------------------------------------------------------------------------------
export const xrayDivision = {
  id: "xray-division",
  innovation: "xray",
  title: T("X-Ray: why 3/4 ÷ 1/8 = 6", "Rayos X: por qué 3/4 ÷ 1/8 = 6"),
  blurb: T("Turn on X-Ray, cut into same-size pieces and count the groups yourself.", "Activa los Rayos X, corta en piezas del mismo tamaño y cuenta los grupos tú mismo."),
  model: "fracdiv",
  params: { dividend: [3, 4], divisor: [1, 8] },
  grades: [5, 6],
  skills: ["5:unit-fraction-division", "6:divide-fractions"],
  xray: true,
  steps: [
    ask("predict", T("How many groups of 1/8 do you think fit inside 3/4?", "¿Cuántos grupos de 1/8 crees que caben en 3/4?"), [
      opt("3", "3", "3", false), opt("6", "6", "6", true), opt("8", "8", "8", false),
    ], { graded: false, revisit: true }),
    task(
      "xray",
      T("Turn on X-Ray and cut the bar into same-size pieces.", "Activa los Rayos X y corta la barra en piezas del mismo tamaño."),
      (s) => (s.xray && s.split ? done(T("The bar is cut into eighths, so 3/4 and 1/8 are measured in the same unit.", "La barra está cortada en octavos, así que 3/4 y 1/8 se miden con la misma unidad.")) : notYet(T("Turn on X-Ray and press “Cut into same-size pieces”.", "Activa los Rayos X y pulsa “Cortar en piezas del mismo tamaño”."))),
      [hint("Use the X-Ray switch, then the cut button.", "Usa el interruptor de Rayos X y luego el botón de cortar.")],
    ),
    task(
      "count",
      T("Tap each group of 1/8 inside the shaded 3/4 to count it. You can keep X-Ray on while you tap.", "Toca cada grupo de 1/8 dentro del 3/4 sombreado para contarlo. Puedes dejar los Rayos X encendidos."),
      (s, d) => (d.markedAll ? done(T(`3/4 ÷ 1/8 = ${d.quotientText}. You counted ${d.markedCount} groups.`, `3/4 ÷ 1/8 = ${d.quotientText}. Contaste ${d.markedCount} grupos.`)) : notYet(T(`${d.markedCount} of ${d.groups.length} groups counted.`, `${d.markedCount} de ${d.groups.length} grupos contados.`))),
      [hint("Each group is one small piece.", "Cada grupo es una pieza pequeña."), hint("Use the “Count the next group” button if tapping is hard.", "Usa el botón “Contar el siguiente grupo” si tocar es difícil.")],
    ),
    ask("see", T("3/4 is the same amount as how many eighths?", "3/4 es la misma cantidad que ¿cuántos octavos?"), [
      opt("6", "6 eighths", "6 octavos", true, "6/8 = 3/4, and 6 ÷ 1 = 6 groups.", "6/8 = 3/4 y 6 ÷ 1 = 6 grupos."),
      opt("3", "3 eighths", "3 octavos", false, "3/8 is only half of 3/4.", "3/8 es solo la mitad de 3/4."),
      opt("4", "4 eighths", "4 octavos", false, "4/8 is 1/2, not 3/4.", "4/8 es 1/2, no 3/4."),
    ]),
    explain(
      "why",
      T("Explain why the answer is 6.", "Explica por qué la respuesta es 6."),
      [
        frame(T("3/4 is the same amount as ___ eighths.", "3/4 es la misma cantidad que ___ octavos."), [w("6", "6", true), w("3", "3"), w("8", "8")], ""),
        frame(T("So the number of groups of 1/8 inside 3/4 is", "Así que el número de grupos de 1/8 dentro de 3/4 es"), [w("6", "6", true), w("4", "4"), w("3/4", "3/4")]),
      ],
      [idea("units", ["eighth", "same size", "same unit", "octavo", "mismo tamaño", "misma unidad"]), idea("six", ["6", "six", "seis"]), idea("groups", ["group", "fit", "how many", "grupo", "caben", "cuántos", "cuantos"])],
      { reveal: T("3/4 = 6/8, so dividing by 1/8 asks how many eighths are in 6 eighths: 6 ÷ 1 = 6.", "3/4 = 6/8, así que dividir entre 1/8 pregunta cuántos octavos hay en 6 octavos: 6 ÷ 1 = 6.") },
    ),
    transfer("new", (rng) => {
      const pool = [[[2, 3], [1, 6]], [[5, 6], [1, 12]], [[3, 4], [3, 8]], [[1, 2], [1, 8]], [[4, 5], [1, 10]], [[3, 5], [1, 10]]];
      const [a, b] = rng.pick(pool);
      const q = R(a[0], a[1]).div(R(b[0], b[1]));
      return {
        kind: "answer",
        prompt: T(`How many groups of ${b[0]}/${b[1]} fit in ${a[0]}/${a[1]}? (${a[0]}/${a[1]} ÷ ${b[0]}/${b[1]})`, `¿Cuántos grupos de ${b[0]}/${b[1]} caben en ${a[0]}/${a[1]}? (${a[0]}/${a[1]} ÷ ${b[0]}/${b[1]})`),
        expect: String(q),
        hints: [hint("Write both fractions with the same denominator.", "Escribe ambas fracciones con el mismo denominador."), hint("Now count how many of the small pieces fit in the big amount.", "Ahora cuenta cuántas piezas pequeñas caben en la cantidad grande.")],
      };
    }),
  ],
};

// ---- 5. Mistake Laboratory: repair 0.4 + 0.35 = 0.39 -------------------------------------------------------------------------
export const mistakeDecimal = {
  id: "mistake-decimal",
  innovation: "mistake",
  title: T("Mistake Lab: decimal addition", "Laboratorio de errores: suma de decimales"),
  blurb: T("Check an answer, look for what we know and what we only guess, then repair it with a model.", "Revisa una respuesta, busca lo que sabemos y lo que solo suponemos, y repárala con un modelo."),
  model: "place",
  params: { set: "decimal", rows: ["A", "B"] },
  grades: [5],
  skills: ["5:decimal-add", "5:decimal-sub", "5:decimal-place"],
  defaultInput: { a: "0.4", b: "0.35", response: "0.39" },
  detect: (input) => decimalAddition(input.a, input.b, input.response),
  steps: [
    { kind: "diagnose", id: "look", prompt: T("What we can tell, and what we can only guess", "Lo que podemos saber y lo que solo podemos suponer"), probes: [{ answer: "a" }] },
    task(
      "buildA",
      (session) => T(`Build ${session.input.a} with the pieces: tenths are tall strips, hundredths are small squares.`, `Construye ${session.input.a} con las piezas: los décimos son tiras altas y los centésimos son cuadritos.`),
      (s, d, session) => {
        const a = d.rows.A?.value;
        const target = session && R(0).add(parseDec(session.input.a));
        return a && target && a.eq(target) ? done(T("That number is built.", "Ese número está construido.")) : notYet(T("Keep adding pieces until the value matches.", "Sigue agregando piezas hasta que el valor coincida."), a);
      },
      [hint("One tenth is worth 0.1 and one hundredth is worth 0.01.", "Un décimo vale 0.1 y un centésimo vale 0.01.")],
    ),
    task(
      "buildB",
      (session) => T(`Now build ${session.input.b} in the second row.`, `Ahora construye ${session.input.b} en la segunda fila.`),
      (s, d, session) => {
        const b = d.rows.B?.value;
        const target = session && parseDec(session.input.b);
        return b && target && b.eq(target) ? done(T("Both numbers are built.", "Ya están construidos los dos números.")) : notYet(T("Keep adding pieces to the second row.", "Sigue agregando piezas a la segunda fila."));
      },
      [hint("35 hundredths is 35 small squares. You can also use 3 tenths and 5 hundredths.", "35 centésimos son 35 cuadritos. También puedes usar 3 décimos y 5 centésimos.")],
    ),
    task(
      "regroup",
      T("Join the two numbers. Then trade every group of ten for one piece of the next place until no place has 10 or more.", "Une los dos números. Luego cambia cada grupo de diez por una pieza del lugar siguiente hasta que ningún lugar tenga 10 o más."),
      (s, d, session) => {
        const sum = session && parseDec(session.input.a).add(parseDec(session.input.b));
        return d.combined && d.regrouped && sum && d.total.eq(sum) ? done(T(`The pieces make ${d.totalText}.`, `Las piezas forman ${d.totalText}.`)) : notYet(d.combined ? T("Keep trading groups of ten.", "Sigue cambiando grupos de diez.") : T("Press “Join the numbers” first.", "Primero pulsa “Unir los números”."));
      },
      [hint("10 hundredths can be traded for 1 tenth.", "10 centésimos se pueden cambiar por 1 décimo.")],
    ),
    ask("check", T("Compare your first answer with the model. What do you notice?", "Compara tu primera respuesta con el modelo. ¿Qué notas?"), [
      opt("small", "My first answer was too small. The sum has to be bigger than each number I added.", "Mi primera respuesta fue muy pequeña. La suma tiene que ser mayor que cada número que sumé.", true),
      opt("fine", "My first answer was fine.", "Mi primera respuesta estuvo bien.", false, "Check the total on the mat.", "Revisa el total en el tablero."),
      opt("big", "My first answer was too big.", "Mi primera respuesta fue muy grande.", false, "Compare it with the total on the mat.", "Compárala con el total en el tablero."),
    ]),
    explain(
      "why",
      T("Explain why you could only trade 10 of one piece for 1 of the next.", "Explica por qué solo podías cambiar 10 de una pieza por 1 de la siguiente."),
      [
        frame(T("Tenths and hundredths are different sizes. 1 tenth is the same as", "Los décimos y los centésimos son de distinto tamaño. 1 décimo es lo mismo que"), [w("10 hundredths", "10 centésimos", true), w("2 hundredths", "2 centésimos"), w("100 hundredths", "100 centésimos")]),
        frame(T("So I can only add pieces that are in the same", "Así que solo puedo sumar piezas que están en el mismo"), [w("place", "lugar", true), w("row", "renglón"), w("color", "color")]),
      ],
      [idea("size", ["size", "different", "place", "tamaño", "diferente", "lugar", "valor"]), idea("ten", ["10", "ten", "diez"]), idea("same", ["same", "line up", "align", "igual", "mismo", "alinear"])],
    ),
    transfer("new", (rng) => {
      const pairs = [["0.6", "0.27"], ["0.5", "0.34"], ["0.7", "0.15"], ["0.8", "0.45"], ["0.3", "0.62"], ["0.9", "0.28"], ["0.2", "0.57"], ["1.4", "0.35"]];
      const [a, b] = rng.pick(pairs);
      const sum = parseDec(a).add(parseDec(b));
      return {
        kind: "answer",
        prompt: T(`${a} + ${b} = ?`, `${a} + ${b} = ?`),
        expect: String(sum),
        detect: (response) => decimalAddition(a, b, response),
        hints: [hint("Think about which place each digit is in.", "Piensa en qué lugar está cada dígito."), hint("Write both numbers with hundredths: one of them needs a zero.", "Escribe ambos números con centésimos: uno necesita un cero.")],
      };
    }),
  ],
};

function parseDec(text) {
  const [i, f = ""] = String(text).split(".");
  return R(BigInt(i + f), 10n ** BigInt(f.length));
}

// ---- 6. Build the Answer: rectangles with area 24 ------------------------------------------------------------------------------
const unordered = (cases) => {
  const seen = new Map();
  for (const c of cases) seen.set([Math.min(c.w, c.h), Math.max(c.w, c.h)].join("x"), c);
  return [...seen.keys()];
};
const minPerimeter = (A) => {
  let best = Infinity;
  for (let w2 = 1; w2 <= A; w2++) if (A % w2 === 0) best = Math.min(best, 2 * (w2 + A / w2));
  return best;
};
export const buildArea24 = {
  id: "build-area-24",
  innovation: "build",
  tags: ["reverse"],
  title: T("Build the answer: area 24", "Construye la respuesta: área 24"),
  blurb: T("Build rectangles with area 24, compare their perimeters and find the smallest.", "Construye rectángulos con área 24, compara sus perímetros y encuentra el menor."),
  model: "area",
  params: { w: 4, h: 5, maxW: 24, maxH: 24 },
  grades: [3, 4, 5],
  skills: ["3:perimeter", "4:factors"],
  steps: [
    task(
      "three",
      T("Build and save 3 different rectangles that each have an area of 24 square units.", "Construye y guarda 3 rectángulos diferentes que tengan cada uno un área de 24 unidades cuadradas."),
      (s, d) => {
        const good = unordered(d.cases.filter((c) => c.area === 24));
        return good.length >= 3 ? done(T("Three different rectangles, all with area 24.", "Tres rectángulos diferentes, todos con área 24.")) : notYet(T(`${good.length} of 3 rectangles with area 24 saved. The one on screen has area ${d.area}.`, `${good.length} de 3 rectángulos con área 24 guardados. El de la pantalla tiene área ${d.area}.`));
      },
      [hint("Which two numbers multiply to 24?", "¿Qué dos números se multiplican para dar 24?"), hint("4 × 6 and 3 × 8 both work.", "4 × 6 y 3 × 8 sirven.")],
    ),
    ask("compare", T("Look at the perimeters in your list. Do rectangles with the same area always have the same perimeter?", "Mira los perímetros de tu lista. ¿Los rectángulos con la misma área siempre tienen el mismo perímetro?"), [
      opt("no", "No. The perimeter changes while the area stays 24.", "No. El perímetro cambia mientras el área sigue siendo 24.", true),
      opt("yes", "Yes. Same area means same perimeter.", "Sí. La misma área significa el mismo perímetro.", false, "Compare 4 × 6 and 1 × 24.", "Compara 4 × 6 y 1 × 24."),
    ]),
    task(
      "all",
      T("Can you find every rectangle with whole-number sides and area 24? Save them all.", "¿Puedes encontrar todos los rectángulos de lados enteros con área 24? Guárdalos todos."),
      (s, d) => {
        const have = new Set(unordered(d.cases.filter((c) => c.area === 24)));
        const need = ["1x24", "2x12", "3x8", "4x6"];
        return need.every((n) => have.has(n)) ? done(T("You found all four: 1 × 24, 2 × 12, 3 × 8 and 4 × 6.", "Encontraste los cuatro: 1 × 24, 2 × 12, 3 × 8 y 4 × 6.")) : notYet(T(`${need.filter((n) => have.has(n)).length} of 4 found.`, `${need.filter((n) => have.has(n)).length} de 4 encontrados.`));
      },
      [hint("List the factor pairs of 24 in order: 1, 2, 3, 4…", "Haz la lista de pares de factores de 24 en orden: 1, 2, 3, 4…")],
    ),
    ask("smallest", T("Which of these rectangles has the smallest perimeter?", "¿Cuál de estos rectángulos tiene el menor perímetro?"), [
      opt("1", "1 × 24 (perimeter 50)", "1 × 24 (perímetro 50)", false, "That is the longest and thinnest.", "Ese es el más largo y delgado."),
      opt("2", "2 × 12 (perimeter 28)", "2 × 12 (perímetro 28)", false),
      opt("3", "3 × 8 (perimeter 22)", "3 × 8 (perímetro 22)", false),
      opt("4", "4 × 6 (perimeter 20)", "4 × 6 (perímetro 20)", true, "Its sides are the closest to each other.", "Sus lados son los más parecidos."),
    ]),
    explain(
      "why",
      T("Explain which rectangle has the smallest perimeter and why.", "Explica qué rectángulo tiene el menor perímetro y por qué."),
      [frame(T("The perimeter is smallest when the two side lengths are", "El perímetro es menor cuando las dos longitudes de los lados son"), [w("close to each other", "parecidas entre sí", true), w("very different", "muy diferentes"), w("equal to 24", "iguales a 24")])],
      [idea("close", ["close", "near", "similar", "square", "equal", "closer", "parecid", "cerca", "cuadrad", "iguales"]), idea("perimeter", ["perimeter", "around", "perímetro", "perimetro", "alrededor"]), idea("area", ["area", "24", "área"])],
      { need: 1, reveal: T("For a fixed area, the sides that are closest together give the smallest perimeter. A square is the best possible shape.", "Con un área fija, los lados más parecidos dan el menor perímetro. Un cuadrado es la mejor forma posible.") },
    ),
    transfer("new", (rng) => {
      const A = rng.pick([18, 30, 36, 48, 20, 40]);
      const best = minPerimeter(A);
      return {
        kind: "build",
        prompt: T(`Save the rectangle with area ${A} square units that has the smallest perimeter. Use whole-number sides.`, `Guarda el rectángulo de área ${A} unidades cuadradas que tenga el menor perímetro. Usa lados enteros.`),
        params: { w: 1, h: 1, maxW: A, maxH: A },
        check: (s, d) => d.cases.some((c) => c.area === A && c.perimeter === best),
        hints: [hint("List the pairs of factors of the area.", "Haz la lista de pares de factores del área.")],
      };
    }),
  ],
};

// ---- 7. Connected representations: recipe scaling ------------------------------------------------------------------------------
export const recipeScaling = {
  id: "recipe-scaling",
  innovation: "connected",
  title: T("Scale a recipe", "Escala una receta"),
  blurb: T("Change the servings and watch the table, number line, graph and equation move together.", "Cambia las porciones y mira cómo la tabla, la recta numérica, la gráfica y la ecuación se mueven juntas."),
  model: "recipe",
  params: {},
  grades: [6, 7],
  skills: ["6:ratios", "6:unit-rates", "7:proportions", "7:unit-rate"],
  steps: [
    ask("predict", T("The recipe makes 2 servings and uses 1 cup of flour. How much flour will 6 servings need?", "La receta rinde 2 porciones y usa 1 taza de harina. ¿Cuánta harina necesitarán 6 porciones?"), [
      opt("3", "3 cups", "3 tazas", true), opt("5", "5 cups", "5 tazas", false), opt("7", "7 cups", "7 tazas", false),
    ], { graded: false, revisit: true }),
    task(
      "six",
      T("Change the recipe to 6 servings. Watch every view.", "Cambia la receta a 6 porciones. Mira todas las vistas."),
      (s) => (s.servings.eq(R(6)) ? done(T("6 servings: every amount is 3 times as big.", "6 porciones: cada cantidad es 3 veces más grande.")) : notYet(T("Set the servings to 6.", "Pon las porciones en 6."))),
      [hint("Use the servings stepper or type 6.", "Usa el contador de porciones o escribe 6.")],
    ),
    ask("factor", T("What happened to every ingredient when the servings went from 2 to 6?", "¿Qué les pasó a todos los ingredientes cuando las porciones pasaron de 2 a 6?"), [
      opt("times", "Every amount was multiplied by 3.", "Cada cantidad se multiplicó por 3.", true),
      opt("add", "Every amount went up by 4.", "Cada cantidad aumentó en 4.", false, "Flour went from 1 to 3, which is +2, not +4.", "La harina pasó de 1 a 3, que es +2, no +4."),
      opt("some", "Only the flour changed.", "Solo cambió la harina.", false, "Check the milk and eggs in the table.", "Mira la leche y los huevos en la tabla."),
    ]),
    task(
      "other",
      T("Now change the recipe a different way: set the flour to 4 cups (type it, or move the point on the graph). What happens to the servings?", "Ahora cambia la receta de otra manera: pon la harina en 4 tazas (escríbelo o mueve el punto en la gráfica). ¿Qué pasa con las porciones?"),
      (s) => (s.servings.eq(R(8)) && s.via !== "servings" ? done(T("4 cups of flour makes 8 servings. A different view gave the same relationship.", "4 tazas de harina rinden 8 porciones. Otra vista dio la misma relación.")) : notYet(s.via === "servings" ? T("Change the flour amount or the graph point instead of the servings.", "Cambia la cantidad de harina o el punto de la gráfica en lugar de las porciones.") : T("Make the flour 4 cups.", "Pon la harina en 4 tazas."))),
      [hint("1 cup of flour is for 2 servings. 4 cups is 4 times as much.", "1 taza de harina es para 2 porciones. 4 tazas es 4 veces más.")],
    ),
    ask("why", T("Why do all the amounts scale by the same factor?", "¿Por qué todas las cantidades cambian por el mismo factor?"), [
      opt("rate", "Each serving always uses the same amount of each ingredient.", "Cada porción siempre usa la misma cantidad de cada ingrediente.", true),
      opt("fast", "Because bigger recipes need extra.", "Porque las recetas más grandes necesitan extra.", false, "The numbers show exact multiples, with no extra.", "Los números muestran múltiplos exactos, sin extra."),
      opt("luck", "It only works for flour.", "Solo funciona con la harina.", false, "Check the other ingredients.", "Revisa los otros ingredientes."),
    ]),
    explain(
      "why2",
      T("Explain the pattern in your own words.", "Explica el patrón con tus palabras."),
      [
        frame(T("For every 1 serving, the recipe uses", "Por cada 1 porción, la receta usa"), [w("1/2 cup of flour", "1/2 taza de harina", true), w("1 cup of flour", "1 taza de harina"), w("2 cups of flour", "2 tazas de harina")]),
        frame(T("So the cups of flour equal", "Así que las tazas de harina son iguales a"), [w("1/2 × servings", "1/2 × porciones", true), w("servings + 1/2", "porciones + 1/2"), w("2 × servings", "2 × porciones")]),
      ],
      [idea("rate", ["each", "every", "per", "one serving", "cada", "por", "una porción"]), idea("times", ["times", "multipl", "same factor", "× ", "veces", "multiplic", "mismo factor"]), idea("line", ["line", "straight", "origin", "zero", "recta", "origen", "cero"])],
      { reveal: T("The constant of proportionality is the amount per serving: flour = 1/2 × servings. A proportional graph is a straight line through (0, 0).", "La constante de proporcionalidad es la cantidad por porción: harina = 1/2 × porciones. Una gráfica proporcional es una recta que pasa por (0, 0).") },
    ),
    transfer("new", (rng) => {
      const s0 = rng.pick([2, 3, 4, 5]);
      const rate = rng.pick([R(1, 2), R(3, 4), R(2), R(3, 2), R(5, 2)]);
      const a0 = rate.mul(s0);
      const s1 = rng.pick([6, 8, 10, 12, 15]);
      const want = a0.mul(s1).div(s0);
      return {
        kind: "answer",
        prompt: T(`A smoothie recipe uses ${a0} cups of juice for ${s0} servings. How many cups of juice for ${s1} servings?`, `Una receta de licuado usa ${a0} tazas de jugo para ${s0} porciones. ¿Cuántas tazas de jugo para ${s1} porciones?`),
        expect: String(want),
        hints: [hint("Find the juice for 1 serving first.", "Primero halla el jugo para 1 porción."), hint(`1 serving uses ${rate} cups.`, `1 porción usa ${rate} tazas.`)],
      };
    }),
  ],
};

// ---- 8. Reverse Math: invent expressions equal to 36 ----------------------------------------------------------------------------
const valid36 = (entries, N = 36, k = 3) => entries.filter((e) => e.value && String(e.value) === String(N) && e.ops === k);
export const reverse36 = {
  id: "reverse-36",
  innovation: "reverse",
  title: T("Reverse Math: make 36", "Matemática al revés: haz 36"),
  blurb: T("Invent expressions that equal 36 using exactly three operations, then compare strategies.", "Inventa expresiones que valgan 36 con exactamente tres operaciones y compara estrategias."),
  model: "builder",
  params: { kind: "expr" },
  grades: [4, 5, 6, 7, 8],
  skills: ["6:evaluate"],
  steps: [
    task(
      "one",
      T("Build an expression that equals 36 using exactly three operations (+, −, ×, ÷). For example, 4 + 5 uses one operation.", "Construye una expresión que valga 36 con exactamente tres operaciones (+, −, ×, ÷). Por ejemplo, 4 + 5 usa una operación."),
      (s, d) => (valid36(d.entries).length ? done(T("That equals 36 and uses exactly three operations.", "Eso vale 36 y usa exactamente tres operaciones.")) : notYet(d.entries.length ? T(`Your last one equals ${d.entries.at(-1).value ? String(d.entries.at(-1).value) : "?"} with ${d.entries.at(-1).ops} operations. Aim for 36 with 3.`, `Tu última vale ${d.entries.at(-1).value ? String(d.entries.at(-1).value) : "?"} con ${d.entries.at(-1).ops} operaciones. Busca 36 con 3.`) : T("Type an expression and press Add.", "Escribe una expresión y pulsa Agregar."))),
      [hint("36 = 4 × 9 uses one operation. Add two more.", "36 = 4 × 9 usa una operación. Agrega dos más."), hint("Try (4 + 5) × 4.", "Prueba (4 + 5) × 4.")],
    ),
    task(
      "three",
      T("Now build three different expressions that each equal 36 with exactly three operations.", "Ahora construye tres expresiones diferentes que valgan 36, cada una con exactamente tres operaciones."),
      (s, d) => (valid36(d.entries).length >= 3 ? done(T("Three different ways to make 36.", "Tres maneras diferentes de hacer 36.")) : notYet(T(`${valid36(d.entries).length} of 3 valid expressions.`, `${valid36(d.entries).length} de 3 expresiones válidas.`))),
      [hint("Start from a fact such as 6 × 6 and add two operations that cancel: 6 × 6 + 5 − 5.", "Empieza con un hecho como 6 × 6 y agrega dos operaciones que se cancelen: 6 × 6 + 5 − 5.")],
    ),
    ask("strategy", T("Which strategy did you use for at least one of your expressions?", "¿Qué estrategia usaste en al menos una de tus expresiones?"), [
      opt("back", "I started with a fact for 36 and added operations that cancel.", "Empecé con un hecho de 36 y agregué operaciones que se cancelan.", true),
      opt("guess", "I tried numbers until one worked.", "Probé números hasta que uno funcionó.", true),
      opt("factors", "I used factors of 36.", "Usé factores de 36.", true),
    ], { graded: false }),
    explain(
      "why",
      T("Pick one of your expressions and explain why it equals 36.", "Elige una de tus expresiones y explica por qué vale 36."),
      [
        frame(T("I made 36 by", "Hice 36"), [w("multiplying factors of 36", "multiplicando factores de 36", true), w("adding random numbers", "sumando números al azar"), w("guessing", "adivinando")]),
        frame(T("I know it uses three operations because I", "Sé que usa tres operaciones porque"), [w("counted each +, −, × or ÷", "conté cada +, −, × o ÷", true), w("counted the numbers", "conté los números"), w("counted the brackets", "conté los paréntesis")]),
      ],
      [idea("because", ["because", "so ", "since", "porque", "así", "ya que"]), idea("ops", ["+", "−", "×", "÷", "add", "multiply", "times", "plus", "suma", "multiplic"]), idea("36", ["36"])],
    ),
    transfer("new", (rng) => {
      const N = rng.pick([24, 30, 40, 48, 20]);
      const k = rng.pick([2, 3]);
      return {
        kind: "build",
        prompt: T(`Build an expression that equals ${N} using exactly ${k} operations.`, `Construye una expresión que valga ${N} con exactamente ${k} operaciones.`),
        params: { kind: "expr" },
        check: (s, d) => valid36(d.entries, N, k).length > 0,
        hints: [hint("Start with a multiplication fact.", "Empieza con un hecho de multiplicación.")],
      };
    }),
  ],
};

export const FLAGSHIPS = [fractionTransform, balanceEquation, discoverArea, xrayDivision, mistakeDecimal, buildArea24, recipeScaling, reverse36];
export { sq };
