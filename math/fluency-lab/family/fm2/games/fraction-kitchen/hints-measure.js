// Hint ladders for the cup, number-line, scoop, serving and place-value tasks. Tiers 0-2 never print this round's
// answer in any form (fraction, mixed number or decimal); tier 3 states the full solution. @fm2 FM-062
import { frac, toString } from "../../rational.js";
import { placeCount } from "./copy.js";
import { safe, T } from "./hints-shape.js";
import { decimalParts, decimalText, sci } from "./model.js";
import { digitsOf, measurePlan, scoopPlan, servingsOf } from "./solution.js";
import { decimalOf, ms } from "./words.js";

const unlike = (round, list) => list.filter((x) => !(x.v && x.v[0] * round.target.d === round.target.n * x.v[1])).map((x) => T(x.en, x.es));

// "5/4 = 1 1/4", or just "5/6" when the forms coincide
const chain = (steps, ticks, target) =>
  [`${steps}/${ticks}`, toString(target), ms(target)].filter((x, i, all) => all.indexOf(x) === i).join(" = ");

export function lineMarker(r, bad) {
  const { ticks: m, steps } = measurePlan(r);
  const examples = [
    T("Example: to mark 3/5, use marks every 1/5 and hop 3 times from 0.", "Ejemplo: para marcar 3/5, usa marcas cada 1/5 y salta 3 veces desde 0."),
    T("Example: to mark 5/6, use sixths and hop 5 times from 0.", "Ejemplo: para marcar 5/6, usa sextos y salta 5 veces desde 0."),
    T("Example: to mark 1 1/2, use halves and hop 3 times from 0.", "Ejemplo: para marcar 1 1/2, usa medios y salta 3 veces desde 0."),
  ];
  return [
    T("On a number line, the bottom number of the fraction tells how many equal steps fit between two whole numbers.", "En una recta numérica, el número de abajo de la fracción dice cuántos pasos iguales caben entre dos números enteros."),
    T("Choose marks that match the bottom number (or a multiple of it). Then hop the marker from 0, one mark at a time, and count the hops.", "Elige marcas que coincidan con el número de abajo (o un múltiplo). Luego salta con el marcador desde 0, una marca a la vez, y cuenta los saltos."),
    safe(examples, bad),
    T(`Choose marks every 1/${m} and hop ${steps} times from 0: ${chain(steps, m, r.target)}.`, `Elige marcas cada 1/${m} y salta ${steps} veces desde 0: ${chain(steps, m, r.target)}.`),
  ];
}

export function pourCup(r, bad) {
  const { ticks: m, steps } = measurePlan(r);
  const examples = [
    T("Example: to pour 3/8 cup, use a cup marked in eighths and pour 3 marks.", "Ejemplo: para echar 3/8 de taza, usa una taza marcada en octavos y echa 3 marcas."),
    T("Example: to pour 2/3 cup, use a cup marked in thirds and pour 2 marks.", "Ejemplo: para echar 2/3 de taza, usa una taza marcada en tercios y echa 2 marcas."),
    T("Example: to pour 1 1/4 cups, use fourths and pour 5 marks.", "Ejemplo: para echar 1 1/4 tazas, usa cuartos y echa 5 marcas."),
  ];
  return [
    T("Look at how each cup is marked. The marks have to be able to show the amount exactly.", "Mira cómo está marcada cada taza. Las marcas deben poder mostrar la cantidad con exactitud."),
    T("Choose a cup whose marks match the bottom number of the amount (or a multiple of it). Then pour mark by mark and watch the level in the equation.", "Elige una taza cuyas marcas coincidan con el número de abajo de la cantidad (o un múltiplo). Luego echa marca por marca y mira el nivel en la ecuación."),
    safe(examples, bad),
    T(`Use the cup with marks every 1/${m} and pour ${steps} marks: ${chain(steps, m, r.target)}.`, `Usa la taza con marcas cada 1/${m} y echa ${steps} marcas: ${chain(steps, m, r.target)}.`),
  ];
}

export function percentAmount(r, bad) {
  const { ticks: m, steps } = measurePlan(r);
  const examples = [
    T("Example: 20% of 1/2 cup. 20% = 20/100 = 1/5, and 1/5 of 1/2 is 1/10 cup.", "Ejemplo: 20% de 1/2 taza. 20% = 20/100 = 1/5, y 1/5 de 1/2 es 1/10 de taza."),
    T("Example: 50% of 3 cups. 50% = 1/2, and half of 3 cups is 1 1/2 cups.", "Ejemplo: 50% de 3 tazas. 50% = 1/2, y la mitad de 3 tazas es 1 1/2 tazas."),
    T("Example: 10% of 2 cups. 10% = 1/10, and 1/10 of 2 cups is 1/5 cup.", "Ejemplo: 10% de 2 tazas. 10% = 1/10, y 1/10 de 2 tazas es 1/5 de taza."),
  ];
  return [
    T("A percent is a part out of 100. Change the percent into a fraction first.", "Un porcentaje es una parte de 100. Primero convierte el porcentaje en una fracción."),
    T("Multiply that fraction by the amount in the order. Then choose a cup whose marks can show the result exactly.", "Multiplica esa fracción por la cantidad del pedido. Luego elige una taza cuyas marcas puedan mostrar el resultado con exactitud."),
    safe(examples, bad),
    T(
      `${r.percent}% of ${ms(r.of)} = ${r.percent}/100 × ${ms(r.of)} = ${ms(r.target)}. Use marks every 1/${m} and pour ${steps} marks.`,
      `${r.percent}% de ${ms(r.of)} = ${r.percent}/100 × ${ms(r.of)} = ${ms(r.target)}. Usa marcas cada 1/${m} y echa ${steps} marcas.`,
    ),
  ];
}

export function pourSpill(r, bad) {
  let level = r.start;
  const trail = [ms(level)];
  for (const move of r.moves) {
    level = frac(level.n * move.d + move.n * level.d, level.d * move.d);
    trail.push(ms(level));
  }
  const examples = [
    T("Example: start at 1/2, pour 1/4, then spill 1. The level goes from 1/2 up to 3/4, then down to -1/4.", "Ejemplo: empieza en 1/2, echa 1/4 y luego derrama 1. El nivel sube de 1/2 a 3/4 y luego baja a -1/4."),
    T("Example: start at -1, pour 1/2, then pour 1/2 again. The level goes from -1 up to -1/2, then up to 0.", "Ejemplo: empieza en -1, echa 1/2 y luego echa 1/2 otra vez. El nivel sube de -1 a -1/2 y luego a 0."),
    T("Example: start at 1/3, then spill 1/3 two times. The level goes from 1/3 down to 0, then down to -1/3.", "Ejemplo: empieza en 1/3 y luego derrama 1/3 dos veces. El nivel baja de 1/3 a 0 y luego a -1/3."),
  ];
  return [
    T("A pour moves the level up and a spill moves it down. Start where the level begins.", "Echar sube el nivel y derramar lo baja. Empieza donde empieza el nivel."),
    T("Take the actions in order. Hop the marker up for a pour and down for a spill, using marks that fit every amount.", "Sigue las acciones en orden. Salta con el marcador hacia arriba al echar y hacia abajo al derramar, usando marcas que encajen con todas las cantidades."),
    safe(examples, bad),
    T(`The level goes ${trail.join(" → ")}. It ends at ${ms(r.target)}.`, `El nivel va ${trail.join(" → ")}. Termina en ${ms(r.target)}.`),
  ];
}

const APPROX_EXAMPLES = {
  pi: [["25/8", "3.125"], ["19/6", "3.1667"], ["31/10", "3.1"]],
  sqrt2: [["7/5", "1.4"], ["3/2", "1.5"], ["10/7", "1.4286"]],
  sqrt3: [["7/4", "1.75"], ["5/3", "1.6667"], ["12/7", "1.7143"]],
  e: [["8/3", "2.6667"], ["11/4", "2.75"], ["5/2", "2.5"]],
};

export function rationalApprox(r, bad) {
  const { symbol, digits, tol } = r.irr;
  const { ticks: m, steps } = measurePlan(r);
  const examples = APPROX_EXAMPLES[r.irr.id].map(([ex, dec]) =>
    T(
      `Example: ${ex} is a fraction near ${symbol}. Divide to get ${dec} and compare it with ${digits}… to see how far away it is.`,
      `Ejemplo: ${ex} es una fracción cercana a ${symbol}. Divide para obtener ${dec} y compárala con ${digits}… para ver qué tan lejos está.`,
    ),
  );
  const tolText = decimalOf(tol);
  return [
    T(`Many fractions are very close to ${symbol}. Turn a fraction into a decimal and compare it with ${digits}…`, `Muchas fracciones están muy cerca de ${symbol}. Convierte una fracción en decimal y compárala con ${digits}…`),
    T("Try different numbers of marks. For each one, find the mark nearest the line, divide to get its decimal, and see if it is close enough.", "Prueba con distintos números de marcas. Con cada una, busca la marca más cercana a la línea, divide para obtener su decimal y mira si está lo bastante cerca."),
    safe(examples, bad),
    T(
      `${steps}/${m} = ${(steps / m).toFixed(4)}… is within ${tolText} of ${symbol} (${digits}…), but it is not exactly ${symbol}: a fraction's decimal always ends or repeats, and the decimal for ${symbol} never does.`,
      `${steps}/${m} = ${(steps / m).toFixed(4)}… está a menos de ${tolText} de ${symbol} (${digits}…), pero no es exactamente ${symbol}: el decimal de una fracción siempre termina o se repite, y el decimal de ${symbol} nunca lo hace.`,
    ),
  ];
}

export const groupsText = (scoops) => {
  const groups = [];
  for (const size of scoops) {
    const found = groups.find((g) => g.key === toString(size));
    if (found) found.count += 1;
    else groups.push({ key: toString(size), count: 1 });
  }
  return groups.map((g) => `${g.count} × ${g.key}`).join(" + ");
};

export function fillScoops(r, bad) {
  const plan = scoopPlan(r);
  const groups = groupsText(plan);
  const sizeText = toString(plan[0]);
  const e = plan[0].d;
  const lists = {
    mixed: [
      { v: [7, 4], en: "Example: to fill 1 3/4 cups with 1/4-cup scoops, 4 scoops make 1 cup, so you need 4 + 3 = 7 scoops.", es: "Ejemplo: para llenar 1 3/4 tazas con cucharones de 1/4 de taza, 4 cucharones hacen 1 taza, así que necesitas 4 + 3 = 7 cucharones." },
      { v: [7, 3], en: "Example: to fill 2 1/3 cups with 1/3-cup scoops, 3 scoops make 1 cup, so you need 3 + 3 + 1 = 7 scoops.", es: "Ejemplo: para llenar 2 1/3 tazas con cucharones de 1/3 de taza, 3 cucharones hacen 1 taza, así que necesitas 3 + 3 + 1 = 7 cucharones." },
      { v: [3, 2], en: "Example: 3 scoops of 1/2 cup fill 1 1/2 cups, because 3 halves make 1 and 1 half.", es: "Ejemplo: 3 cucharones de 1/2 taza llenan 1 1/2 tazas, porque 3 medios son 1 y 1 medio." },
    ],
    batch: [
      { v: [3, 4], en: "Example: 3 batches of 1/4 cup need 3 scoops of 1/4 cup, which is 3/4 cup in all.", es: "Ejemplo: 3 tandas de 1/4 de taza necesitan 3 cucharones de 1/4 de taza, que son 3/4 de taza en total." },
      { v: [4, 3], en: "Example: 2 batches of 2/3 cup need 2 × 2 = 4 scoops of 1/3 cup.", es: "Ejemplo: 2 tandas de 2/3 de taza necesitan 2 × 2 = 4 cucharones de 1/3 de taza." },
      { v: [2, 1], en: "Example: 4 batches of 1/2 cup need 4 scoops of 1/2 cup, which is 2 cups.", es: "Ejemplo: 4 tandas de 1/2 taza necesitan 4 cucharones de 1/2 taza, que son 2 tazas." },
    ],
    sum: [
      { v: [3, 4], en: "Example: 1/2 + 1/4. Fourths fit both amounts. 1/2 is 2 fourths, so 2 fourths + 1 fourth = 3 fourths.", es: "Ejemplo: 1/2 + 1/4. Los cuartos encajan en ambas cantidades. 1/2 son 2 cuartos, así que 2 cuartos + 1 cuarto = 3 cuartos." },
      { v: [5, 6], en: "Example: 2/3 + 1/6. Sixths fit both amounts. 2/3 is 4 sixths, so 4 sixths + 1 sixth = 5 sixths.", es: "Ejemplo: 2/3 + 1/6. Los sextos encajan en ambas cantidades. 2/3 son 4 sextos, así que 4 sextos + 1 sexto = 5 sextos." },
      { v: [7, 8], en: "Example: 3/8 + 1/2. Eighths fit both amounts. 1/2 is 4 eighths, so 3 eighths + 4 eighths = 7 eighths.", es: "Ejemplo: 3/8 + 1/2. Los octavos encajan en ambas cantidades. 1/2 son 4 octavos, así que 3 octavos + 4 octavos = 7 octavos." },
    ],
    diff: [
      { v: [1, 4], en: "Example: 3/4 - 1/2. Fourths fit both amounts. 3 fourths - 2 fourths = 1 fourth.", es: "Ejemplo: 3/4 - 1/2. Los cuartos encajan en ambas cantidades. 3 cuartos - 2 cuartos = 1 cuarto." },
      { v: [1, 6], en: "Example: 2/3 - 1/2. Sixths fit both amounts. 4 sixths - 3 sixths = 1 sixth.", es: "Ejemplo: 2/3 - 1/2. Los sextos encajan en ambas cantidades. 4 sextos - 3 sextos = 1 sexto." },
      { v: [3, 8], en: "Example: 7/8 - 1/2. Eighths fit both amounts. 7 eighths - 4 eighths = 3 eighths.", es: "Ejemplo: 7/8 - 1/2. Los octavos encajan en ambas cantidades. 7 octavos - 4 octavos = 3 octavos." },
    ],
  };
  const pool = unlike(r, lists[r.op]);
  const strategy =
    r.op === "mixed"
      ? T("Fill the whole cups first, then use smaller scoops to finish the rest. Watch the equation under the pitcher.", "Llena primero las tazas enteras y luego usa cucharones más pequeños para terminar. Mira la ecuación debajo de la jarra.")
      : r.op === "batch"
        ? T("Add the batch amount once for each batch. Count the scoops as you go; the equation under the pitcher keeps the total.", "Suma la cantidad de una tanda una vez por cada tanda. Cuenta los cucharones; la ecuación debajo de la jarra lleva el total.")
        : T("Find a scoop size that fits evenly into each amount, and rewrite each amount with scoops of that size. Then add (or take away) the scoops.", "Busca un tamaño de cucharón que quepa exacto en cada cantidad y reescribe cada cantidad con cucharones de ese tamaño. Luego suma (o quita) los cucharones.");
  const nudge =
    r.op === "mixed" || r.op === "batch"
      ? T("Think about how many scoops of each size make one whole cup.", "Piensa cuántos cucharones de cada tamaño hacen una taza entera.")
      : T("Scoops of different sizes cannot be counted together. Look for one scoop size that fits every amount.", "Los cucharones de tamaños distintos no se pueden contar juntos. Busca un tamaño de cucharón que encaje en todas las cantidades.");
  let solution;
  if (r.single) {
    const rewritten = r.terms.map((t) => `${ms(t)} = ${(t.n * e) / t.d} × 1/${e}`).join(", ");
    solution = T(
      `Use scoops of ${sizeText} cup: ${rewritten}. ${r.op === "diff" ? "Take away" : "Add"} the scoops: ${groups} = ${ms(r.target)} cups.`,
      `Usa cucharones de ${sizeText} de taza: ${rewritten}. ${r.op === "diff" ? "Quita" : "Suma"} los cucharones: ${groups} = ${ms(r.target)} tazas.`,
    );
  } else {
    solution = T(`${r.op === "batch" ? `${r.batches} × ${ms(r.amount)} = ${ms(r.target)}. ` : ""}For example: ${groups} = ${ms(r.target)} cups.`, `${r.op === "batch" ? `${r.batches} × ${ms(r.amount)} = ${ms(r.target)}. ` : ""}Por ejemplo: ${groups} = ${ms(r.target)} tazas.`);
  }
  return [nudge, strategy, safe(pool, bad), solution];
}

export function serving(r, bad) {
  const k = servingsOf(r);
  const examples = [
    T("Example: from 1 1/2 cups you can pour 3 servings of 1/2 cup, because 3 × 1/2 = 1 1/2.", "Ejemplo: de 1 1/2 tazas puedes servir 3 porciones de 1/2 taza, porque 3 × 1/2 = 1 1/2."),
    T("Example: from 2 cups you can pour 8 servings of 1/4 cup, because there are 4 servings in each cup.", "Ejemplo: de 2 tazas puedes servir 8 porciones de 1/4 de taza, porque en cada taza hay 4 porciones."),
    T("Example: from 1 cup you can pour 5 servings of 1/5 cup, because 5 × 1/5 = 1.", "Ejemplo: de 1 taza puedes servir 5 porciones de 1/5 de taza, porque 5 × 1/5 = 1."),
  ];
  return [
    T("Each serving takes out the same amount. Keep pouring until the pitcher is empty.", "Cada porción saca la misma cantidad. Sigue sirviendo hasta que la jarra esté vacía."),
    T("Pour one serving at a time and count them. The picture shows the cups you have filled and the equation shows what is left.", "Sirve una porción a la vez y cuéntalas. El dibujo muestra las tazas que has llenado y la ecuación muestra lo que queda."),
    safe(examples, bad),
    T(`${ms(r.amount)} ÷ ${ms(r.size)} = ${k}, so pour ${k} servings.`, `${ms(r.amount)} ÷ ${ms(r.size)} = ${k}, así que sirve ${k} porciones.`),
  ];
}

const partsText = (digits, lang) =>
  digits
    .map((d, i) => (d ? placeCount(i, d, lang) : null))
    .filter(Boolean)
    .join(" + ");

export function placeScoops(r, bad) {
  const digits = digitsOf(r.target);
  const dec = decimalOf(r.target);
  if (r.mode === "repeat") return repeating(r, bad, dec);
  const sciExamples = [
    T("Example: 4 × 10⁻³ = 0.004, which is 4 thousandths.", "Ejemplo: 4 × 10⁻³ = 0.004, que son 4 milésimos."),
    T("Example: 3.5 × 10⁻¹ = 0.35, which is 3 tenths and 5 hundredths.", "Ejemplo: 3.5 × 10⁻¹ = 0.35, que son 3 décimos y 5 centésimos."),
    T("Example: 2 × 10⁰ = 2, which is 2 ones.", "Ejemplo: 2 × 10⁰ = 2, que son 2 unidades."),
  ];
  const decExamples = [
    T("Example: 0.52 cup is 5 tenth-scoops and 2 hundredth-scoops.", "Ejemplo: 0.52 de taza son 5 cucharones de décimos y 2 de centésimos."),
    T("Example: 0.205 cup is 2 tenths, 0 hundredths and 5 thousandths.", "Ejemplo: 0.205 de taza son 2 décimos, 0 centésimos y 5 milésimos."),
    T("Example: 1.4 cups is 1 whole-cup scoop and 4 tenth-scoops.", "Ejemplo: 1.4 tazas son 1 cucharón de taza entera y 4 de décimos."),
  ];
  const sciText = r.mode === "sci" ? `${r.terms.map(sci).join(" + ")} = ${dec}; ` : "";
  return [
    T("Each kind of scoop holds ten times less than the one before it: ten tenths make one, and ten hundredths make one tenth.", "Cada tipo de cucharón guarda diez veces menos que el anterior: diez décimos hacen una unidad y diez centésimos hacen un décimo."),
    r.mode === "sci"
      ? T("Write each term as a decimal: a power of ten tells which place its digit goes in. Then use the digit of each place as the number of scoops.", "Escribe cada término como decimal: una potencia de diez dice en qué lugar va su dígito. Luego usa el dígito de cada lugar como el número de cucharones.")
      : T("Read the amount one digit at a time. The digit in each place says how many scoops of that place to use.", "Lee la cantidad un dígito a la vez. El dígito de cada lugar dice cuántos cucharones de ese lugar usar."),
    safe(r.mode === "sci" ? sciExamples : decExamples, bad),
    T(`${sciText}${dec} cup is ${partsText(digits, "en")}. Tap that many scoops of each kind.`, `${sciText}${dec} de taza son ${partsText(digits, "es")}. Toca esa cantidad de cucharones de cada tipo.`),
  ];
}

function repeating(r, bad, dec) {
  const parts = decimalParts(r.target);
  const ends = parts.rep === "";
  const pool = [
    { v: [1, 4], en: "Example: 1/4 = 0.25 and it ends, because 4 goes into 100 exactly.", es: "Ejemplo: 1/4 = 0.25 y termina, porque 4 cabe exacto en 100." },
    { v: [2, 9], en: "Example: 2/9 = 0.222… never ends. The remainder 2 comes back every time, so the digit 2 repeats.", es: "Ejemplo: 2/9 = 0.222… nunca termina. El residuo 2 vuelve cada vez, así que el dígito 2 se repite." },
    { v: [5, 6], en: "Example: 5/6 = 0.8333… After the 8, the same remainder keeps coming back, so only the 3 repeats.", es: "Ejemplo: 5/6 = 0.8333… Después del 8, el mismo residuo sigue volviendo, así que solo el 3 se repite." },
  ].filter((x) => x.v[0] * r.target.d !== r.target.n * x.v[1]);
  const fraction = toString(r.target);
  return [
    T("Try the scoops. After you use as many as you can without going over, is anything still missing?", "Prueba los cucharones. Cuando uses todos los que puedas sin pasarte, ¿todavía falta algo?"),
    T("Divide the top number by the bottom number with long division. If the remainder reaches 0, the decimal ends. If a remainder comes back, the digits repeat.", "Divide el número de arriba entre el de abajo con la división larga. Si el residuo llega a 0, el decimal termina. Si vuelve un residuo, los dígitos se repiten."),
    safe(pool.map((x) => T(x.en, x.es)), bad),
    ends
      ? T(`${fraction} = ${dec} exactly, so it can be filled: ${partsText(digitsOf(r.target), "en")}.`, `${fraction} = ${dec} exactamente, así que sí se puede llenar: ${partsText(digitsOf(r.target), "es")}.`)
      : T(
          `${fraction} = ${decimalText(parts)}: the digits ${parts.rep} repeat forever, so no number of tenths, hundredths and thousandths fills it exactly. Say it never ends and choose ${parts.rep}.`,
          `${fraction} = ${decimalText(parts)}: los dígitos ${parts.rep} se repiten para siempre, así que ningún número de décimos, centésimos y milésimos la llena con exactitud. Di que nunca termina y elige ${parts.rep}.`,
        ),
  ];
}
