// Specific, bilingual feedback for each named mistake. Never a bare "wrong": every text names the likely
// misunderstanding, using only numbers the learner already built or the order itself states. @fm2 FM-063 FM-017
import { partName } from "./copy.js";

const both = (en, es) => ({ en, es });
const side = (word) => ({ more: both("more", "más"), less: both("less", "menos") })[word];
const big = (word) => (word === "more" ? both("greater", "mayor") : both("less", "menor"));

const FB = {
  malformed: () => both("Something is not set up right. Press Reset this puzzle and try again.", "Algo no está bien armado. Presiona Reiniciar este reto e inténtalo otra vez."),
  unequal: (v) =>
    both(
      `These parts aren't equal-sized (${v.sizes}). Fair shares and fractions need parts that are exactly the same size.`,
      `Estas partes no tienen el mismo tamaño (${v.sizes}). Las partes justas y las fracciones necesitan partes exactamente iguales.`,
    ),
  noneServed: () => both("Nothing is served yet. Tap the pieces you want to serve.", "Todavía no has servido nada. Toca las piezas que quieres servir."),
  "fair.wrongParts": (v) =>
    both(
      `You cut ${v.n} equal ${v.n === 1 ? "part" : "parts"}, but ${v.f} friends need ${v.f} equal parts, one for each friend.`,
      `Cortaste ${v.n} ${v.n === 1 ? "parte igual" : "partes iguales"}, pero ${v.f} amigos necesitan ${v.f} partes iguales, una para cada amigo.`,
    ),
  "fair.wrongServed": (v) =>
    both(`You served ${v.count} of the parts, but the order asks you to serve ${v.m}.`, `Serviste ${v.count} de las partes, pero el pedido pide servir ${v.m}.`),
  "fix.wrongParts": (v) =>
    both(
      `The parts are equal, but there are ${v.n} of them. ${v.f} friends need exactly ${v.f} equal parts.`,
      `Las partes son iguales, pero hay ${v.n}. ${v.f} amigos necesitan exactamente ${v.f} partes iguales.`,
    ),
  "serve.wrongDenom": (v) =>
    both(`The order says to use ${partName(v.den, "en")}, but you cut ${v.n} equal parts.`, `El pedido dice usar ${partName(v.den, "es")}, pero cortaste ${v.n} partes iguales.`),
  "serve.partsMismatch": (v) =>
    both(
      `You served ${v.count} pieces, but your whole is cut into ${v.n} equal parts, not ${v.b}. The bottom number of a fraction is how many equal parts the whole has.`,
      `Serviste ${v.count} piezas, pero tu entero está cortado en ${v.n} partes iguales, no en ${v.b}. El número de abajo de una fracción es cuántas partes iguales tiene el entero.`,
    ),
  "serve.tooMuch": (v) => both(`You served ${v.value}. That is more than the order asks for.`, `Serviste ${v.value}. Eso es más de lo que pide el pedido.`),
  "serve.tooLittle": (v) => both(`You served ${v.value}. That is less than the order asks for.`, `Serviste ${v.value}. Eso es menos de lo que pide el pedido.`),
  "equiv.additive": () =>
    both(
      "It looks like the same number was added to the top and the bottom. Equal fractions come from cutting every piece the same way, which multiplies both numbers by the same number.",
      "Parece que se sumó el mismo número arriba y abajo. Las fracciones iguales se logran cortando cada pieza de la misma manera, lo que multiplica ambos números por el mismo número.",
    ),
  "equiv.sameCut": (v) =>
    both(
      `That is the same cut as the picture (${v.n} equal parts). Make a different one with a different number of equal parts.`,
      `Ese es el mismo corte del dibujo (${v.n} partes iguales). Haz uno distinto con otro número de partes iguales.`,
    ),
  "equiv.wrongDenom": (v) =>
    both(`The order asks for ${partName(v.den, "en")}, but you cut ${v.n} equal parts.`, `El pedido pide ${partName(v.den, "es")}, pero cortaste ${v.n} partes iguales.`),
  "equiv.tooMuch": (v) => both(`Yours shows ${v.value}, which is more than the amount to match.`, `El tuyo muestra ${v.value}, que es más que la cantidad que debes igualar.`),
  "equiv.tooLittle": (v) => both(`Yours shows ${v.value}, which is less than the amount to match.`, `El tuyo muestra ${v.value}, que es menos que la cantidad que debes igualar.`),
  "compare.wrongDenom": (v) =>
    both(`The order says to use ${v.den} equal parts, but you cut ${v.n}.`, `El pedido dice usar ${v.den} partes iguales, pero cortaste ${v.n}.`),
  "compare.wrongCount": (v) =>
    both(`The order says to serve exactly ${v.num} ${v.num === 1 ? "piece" : "pieces"}, but you served ${v.count}.`, `El pedido dice servir exactamente ${v.num} ${v.num === 1 ? "pieza" : "piezas"}, pero serviste ${v.count}.`),
  "compare.equalToRef": (v) =>
    both(
      `Your amount (${v.value}) is equal to the amount to beat, not ${side(v.relation).en} than it.`,
      `Tu cantidad (${v.value}) es igual a la cantidad de comparación, no ${side(v.relation).es} que ella.`,
    ),
  "compare.wrongSide": (v) =>
    both(
      `Your amount (${v.value}) is ${side(v.actual).en} than the reference, but the order asks for ${side(v.relation).en}.`,
      `Tu cantidad (${v.value}) es ${big(v.actual).es} que la de comparación, pero el pedido pide ${side(v.relation).es}.`,
    ),
  "compare.biggerBottom": () =>
    both(
      "More equal parts makes each piece smaller. Serving the same number of smaller pieces gives you less, not more.",
      "Más partes iguales hace cada pieza más pequeña. Servir el mismo número de piezas más pequeñas da menos, no más.",
    ),
  "compare.smallerBottom": () =>
    both(
      "Fewer equal parts makes each piece bigger. Serving the same number of bigger pieces gives you more, not less.",
      "Menos partes iguales hace cada pieza más grande. Servir el mismo número de piezas más grandes da más, no menos.",
    ),
  "area.outside": () =>
    both("Some served pieces are outside the dashed line. Only take pieces from the leftover.", "Algunas piezas servidas están fuera de la línea de rayas. Toma piezas solo de lo que sobra."),
  "area.tookAll": () => both("You served all of the leftover. The order only wants part of it.", "Serviste todo lo que sobra. El pedido solo quiere una parte."),
  "area.ofWhole": (v) =>
    both(
      `You served ${v.value} of the whole, but the order asks for a part of the leftover, not a part of the whole.`,
      `Serviste ${v.value} del entero, pero el pedido pide una parte de lo que sobra, no una parte del entero.`,
    ),
  "area.forgotLeftover": () =>
    both(
      "Each friend should get a share of the leftover, not of the whole. The leftover is smaller than the whole, so each share is smaller too.",
      "Cada amigo debe recibir una parte de lo que sobra, no del entero. Lo que sobra es menos que el entero, así que cada parte es más pequeña.",
    ),
  "area.tooMuch": (v) => both(`You served ${v.value} of the whole. That is more than one share of the leftover.`, `Serviste ${v.value} del entero. Eso es más de lo que corresponde.`),
  "area.tooLittle": (v) => both(`You served ${v.value} of the whole. That is less than the order asks for.`, `Serviste ${v.value} del entero. Eso es menos de lo que pide el pedido.`),
  wrongMarks: (v) =>
    both(
      `These marks are every ${v.mark}, so the amount you need falls between two marks. Choose marks that fit the bottom number of the amount.`,
      `Estas marcas son cada ${v.mark}, así que la cantidad que necesitas queda entre dos marcas. Elige marcas que encajen con el número de abajo de la cantidad.`,
    ),
  countedMarks: (v) =>
    both(
      `You counted ${v.steps} marks, but each mark here is ${v.mark}. The bottom number tells the size of each mark.`,
      `Contaste ${v.steps} marcas, pero cada marca aquí es ${v.mark}. El número de abajo dice el tamaño de cada marca.`,
    ),
  tooMuch: (v) => both(`You are at ${v.value}. That is more than the amount you need.`, `Estás en ${v.value}. Eso es más de la cantidad que necesitas.`),
  tooLittle: (v) => both(`You are at ${v.value}. That is less than the amount you need.`, `Estás en ${v.value}. Eso es menos de la cantidad que necesitas.`),
  "net.signFlip": () =>
    both(
      "It looks like a spill was counted as a pour. Pours move the level up and spills move it down.",
      "Parece que un derrame se contó como si fuera echar. Echar sube el nivel y derramar lo baja.",
    ),
  "net.forgotStart": () =>
    both(
      "The level did not start at 0. Include where the level starts before the pour and the spill.",
      "El nivel no empezó en 0. Incluye dónde empieza el nivel antes de echar y derramar.",
    ),
  "percent.ignoredAmount": (v) =>
    both(
      `${v.p}% is ${v.p} out of 100 of ONE whole. The order says ${v.p}% of ${v.of}, so find that part of the amount.`,
      `${v.p}% es ${v.p} de cada 100 de UN entero. El pedido dice ${v.p}% de ${v.of}, así que halla esa parte de la cantidad.`,
    ),
  "approx.tooFar": (v) =>
    both(
      `Your fraction is about ${v.dec} as a decimal, which is not close enough to ${v.symbol}. Try other numbers of marks.`,
      `Tu fracción es aproximadamente ${v.dec} como decimal, que no está lo bastante cerca de ${v.symbol}. Prueba con otro número de marcas.`,
    ),
  "approx.needVerdict": (v) => both(`Now decide: is your fraction exactly ${v.symbol}?`, `Ahora decide: ¿tu fracción es exactamente ${v.symbol}?`),
  "approx.saysEqual": (v) =>
    both(
      `No fraction is exactly ${v.symbol}. The decimal for ${v.symbol} never ends and never repeats, but a fraction's decimal always ends or repeats. Yours is only close.`,
      `Ninguna fracción es exactamente ${v.symbol}. El decimal de ${v.symbol} nunca termina ni se repite, pero el decimal de una fracción siempre termina o se repite. La tuya solo se acerca.`,
    ),
  "fill.empty": () => both("The pitcher is empty. Tap scoops to fill it.", "La jarra está vacía. Toca cucharones para llenarla."),
  "fill.notAllowed": () => both("That scoop is not allowed in this order.", "Ese cucharón no está permitido en este pedido."),
  "fill.mixedSizes": (v) =>
    both(`The order says to use only one size of scoop, and you used ${v.kinds} different sizes.`, `El pedido dice usar un solo tamaño de cucharón, y usaste ${v.kinds} tamaños distintos.`),
  "fill.topBottom": (v) =>
    both(
      `It looks like the tops were added (${v.tops}) and the bottoms were added (${v.bottoms}). Scoops of different sizes can't be added that way. Use one size of scoop that fits every amount.`,
      `Parece que se sumaron los números de arriba (${v.tops}) y los de abajo (${v.bottoms}). Los cucharones de tamaños distintos no se suman así. Usa un solo tamaño de cucharón que encaje en todas las cantidades.`,
    ),
  "fill.oneBatch": (v) => both(`That is only one batch. The order is for ${v.batches} batches.`, `Eso es solo una tanda. El pedido es para ${v.batches} tandas.`),
  "fill.wholeOnly": () => both("You filled only the whole cups. The fraction part is missing too.", "Llenaste solo las tazas enteras. También falta la parte de la fracción."),
  "fill.fractionOnly": () => both("You filled only the fraction part. The whole cups are missing too.", "Llenaste solo la parte de la fracción. También faltan las tazas enteras."),
  "fill.overfill": (v) => both(`The pitcher holds ${v.value}. That is more than the order.`, `La jarra tiene ${v.value}. Eso es más que el pedido.`),
  "fill.underfill": (v) => both(`The pitcher holds ${v.value}. That is less than the order.`, `La jarra tiene ${v.value}. Eso es menos que el pedido.`),
  "fill.needTwoKinds": () =>
    both("The amount is right, but the order says to use at least two kinds of scoop.", "La cantidad es correcta, pero el pedido dice usar al menos dos tipos de cucharón."),
  "serving.stoppedEarly": (v) =>
    both(
      `There is still ${v.left} in the pitcher. That is enough for more servings. Keep pouring until it is empty.`,
      `Todavía quedan ${v.left} en la jarra. Eso alcanza para más porciones. Sigue sirviendo hasta que quede vacía.`,
    ),
  "place.overfill": (v) => both(`The pitcher holds ${v.value}. That is more than the order.`, `La jarra tiene ${v.value}. Eso es más que el pedido.`),
  "place.underfill": (v) => both(`The pitcher holds ${v.value}. That is less than the order.`, `La jarra tiene ${v.value}. Eso es menos que el pedido.`),
  "place.placeShift": () =>
    both(
      "The digits are right, but they are one place off, which makes the amount ten times too big or too small. Check which scoop each digit belongs to.",
      "Los dígitos están bien, pero están un lugar corrido, así que la cantidad es diez veces mayor o menor. Revisa a qué cucharón corresponde cada dígito.",
    ),
  "place.digitsSwapped": () =>
    both(
      "The right digits are in the wrong places. A digit in the tenths place is worth ten times a digit in the hundredths place.",
      "Los dígitos correctos están en lugares equivocados. Un dígito en los décimos vale diez veces un dígito en los centésimos.",
    ),
  "place.claimedNever": () =>
    both(
      "This amount can be filled exactly: its decimal ends. Keep filling with the scoops.",
      "Esta cantidad sí se puede llenar con exactitud: su decimal termina. Sigue llenando con los cucharones.",
    ),
  "place.claimedExact": () =>
    both(
      "However you fill it, a little is always left over, because the decimal for this amount never ends. Say it can never be filled exactly.",
      "Lo llenes como lo llenes, siempre sobra un poquito, porque el decimal de esta cantidad nunca termina. Di que nunca se puede llenar con exactitud.",
    ),
  "place.needBlock": () => both("Choose which digits repeat forever.", "Elige qué dígitos se repiten para siempre."),
  "place.wrongBlock": () =>
    both(
      "Those digits do not repeat forever. Divide again and watch which remainder comes back.",
      "Esos dígitos no se repiten para siempre. Divide otra vez y fíjate qué residuo vuelve a aparecer.",
    ),
};

const GROUP = { fair: "fair", fix: "fix", serve: "serve", equiv: "equiv", compare: "compare", area: "area", fill: "fill", serving: "serving", place: "place" };

export function feedbackFor(round, key, vars = {}) {
  const make = FB[`${GROUP[round.kind] ?? round.skillId}.${key}`] ?? FB[`${round.skill}.${key}`] ?? FB[key];
  return make(vars);
}

export const MISTAKE_KEYS = Object.keys(FB);

const PRAISE = {
  fair: (v) => both(`${v.n} equal parts, one for each friend. ${v.count}/${v.n} served.`, `${v.n} partes iguales, una para cada amigo. Servido: ${v.count}/${v.n}.`),
  fix: (v) => both(`All ${v.n} parts are equal now.`, `Ahora las ${v.n} partes son iguales.`),
  serve: (v) => both(`${v.count} of ${v.n} equal parts is ${v.value}.`, `${v.count} de ${v.n} partes iguales es ${v.value}.`),
  equiv: (v) => both(`${v.count}/${v.n} is the same amount, cut a different way.`, `${v.count}/${v.n} es la misma cantidad, cortada de otra manera.`),
  compare: (v) => both(`${v.value} is ${side(v.relation).en} than the reference.`, `${v.value} es ${big(v.relation).es} que la de comparación.`),
  area: (v) => both(`You took ${v.value} of the whole.`, `Tomaste ${v.value} del entero.`),
  measure: (v) => both(`The level is exactly ${v.value}.`, `El nivel es exactamente ${v.value}.`),
  approx: (v) => both(`${v.value} is close to ${v.symbol}, but not exactly ${v.symbol}.`, `${v.value} se acerca a ${v.symbol}, pero no es exactamente ${v.symbol}.`),
  fill: (v) => both(`The pitcher holds exactly ${v.value}.`, `La jarra tiene exactamente ${v.value}.`),
  serving: (v) => both(`${v.k} servings, and the pitcher is empty.`, `${v.k} porciones, y la jarra queda vacía.`),
  place: (v) => both(`The pitcher holds exactly ${v.value}.`, `La jarra tiene exactamente ${v.value}.`),
  repeat: (v) => both(`The digits ${v.block} repeat forever, so it can never be filled exactly.`, `Los dígitos ${v.block} se repiten para siempre, así que nunca se puede llenar con exactitud.`),
};

export const praiseFor = (kind, vars) => PRAISE[kind](vars);
