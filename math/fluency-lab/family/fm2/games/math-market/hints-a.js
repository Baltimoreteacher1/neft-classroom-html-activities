// Hint ladders for kindergarten to grade 4. Each skill: [tier 0, tier 1, tier 2, tier 3]; tiers 0-2 return one copy or
// a list of candidates (the last one number-free), tier 3 receives (round, tools) and states the full solution.
import { h, m } from "./hint-tools.js";
import { sum } from "./money.js";

const biggestTwo = (coins) => [...coins].sort((a, b) => b - a).slice(0, 2);
const upTo = (k) => Array.from({ length: k }, (_, i) => i + 1).join(", ");

export const aHints = {
  "penny-count": [
    () => h("Touch each penny once as you count. Say one number for each coin.", "Toca cada centavo una vez mientras cuentas. Di un número por cada moneda."),
    () => h("Every penny is worth 1¢, so the number of cents is the number of pennies.", "Cada centavo vale 1¢, así que la cantidad de centavos es la cantidad de monedas."),
    () => [
      ...[3, 4].map((k) => h(`Try a smaller pile of ${k} pennies. Count ${upTo(k)}. That pile is worth ${k}¢. Count yours the same way.`, `Prueba con un montón más pequeño de ${k} centavos. Cuenta ${upTo(k)}. Ese montón vale ${k}¢. Cuenta el tuyo igual.`)),
      h("Count in small groups to keep your place, then put the groups together.", "Cuenta en grupos pequeños para no perderte y luego junta los grupos."),
    ],
    (r) => h(`There are ${r.params.n} pennies and each is worth 1¢, so the total is ${r.params.n}¢.`, `Hay ${r.params.n} centavos y cada uno vale 1¢, así que el total es ${r.params.n}¢.`),
  ],
  "costs-more": [
    (r) => (r.params.ask === "more" ? h("Look at the two price numbers. Which number is bigger?", "Mira los dos números de precio. ¿Cuál número es mayor?") : h("Look at the two price numbers. Which number is smaller?", "Mira los dos números de precio. ¿Cuál número es menor?")),
    (r) => (r.params.ask === "more" ? h("The bigger number means more cents, so that item costs more.", "El número mayor significa más centavos, así que ese artículo cuesta más.") : h("The smaller number means fewer cents, so that item costs less.", "El número menor significa menos centavos, así que ese artículo cuesta menos.")),
    (r) => (r.params.ask === "more" ? h("Try 3¢ and 8¢. 8 is more than 3, so the 8¢ item costs more. Now compare your two prices.", "Prueba con 3¢ y 8¢. 8 es más que 3, así que el de 8¢ cuesta más. Ahora compara tus dos precios.") : h("Try 3¢ and 8¢. 3 is less than 8, so the 3¢ item costs less. Now compare your two prices.", "Prueba con 3¢ y 8¢. 3 es menos que 8, así que el de 3¢ cuesta menos. Ahora compara tus dos precios.")),
    (r) => {
      const [a, b] = r.scene.tags;
      const win = r.scene.tags[r.answer];
      return h(`${a.name.en} costs ${a.cents}¢ and ${b.name.en} costs ${b.cents}¢. So ${win.name.en} costs ${r.params.ask}.`, `${a.name.es} cuesta ${a.cents}¢ y ${b.name.es} cuesta ${b.cents}¢. Así que ${win.name.es} cuesta ${r.params.ask === "more" ? "más" : "menos"}.`);
    },
  ],
  "count-pnd": [
    () => h("Sort the coins into piles by kind first.", "Primero separa las monedas en montones por tipo."),
    () => h("A dime is worth 10¢, a nickel is worth 5¢ and a penny is worth 1¢. Count the dimes by tens, then the nickels by fives, then the pennies by ones.", "Una moneda de 10 vale 10¢, una de 5 vale 5¢ y un centavo vale 1¢. Cuenta las de 10 de diez en diez, las de 5 de cinco en cinco y luego los centavos."),
    (r) => {
      const x = sum(biggestTwo(r.params.coins));
      return [h(`Start with the two biggest coins. Together they are worth ${x}¢. Keep counting on from ${x}¢.`, `Empieza con las dos monedas más grandes. Juntas valen ${x}¢. Sigue contando desde ${x}¢.`), h("Start with the biggest coins and keep counting on as you add each smaller coin.", "Empieza con las monedas más grandes y sigue contando al sumar cada moneda menor.")];
    },
    (r) => {
      const { d, n, p } = r.params;
      const total = d * 10 + n * 5 + p;
      const part = (count, value, en, es) => (count ? [h(`${count} × ${value}¢ = ${count * value}¢ (${en})`, `${count} × ${value}¢ = ${count * value}¢ (${es})`)] : []);
      const parts = [...part(d, 10, "dimes", "monedas de 10"), ...part(n, 5, "nickels", "monedas de 5"), ...part(p, 1, "pennies", "centavos")];
      const sums = [d * 10, n * 5, p].filter(Boolean).join(" + ");
      return h(`${parts.map((x) => x.en).join("; ")}. ${sums} = ${total}¢.`, `${parts.map((x) => x.es).join("; ")}. ${sums} = ${total}¢.`);
    },
  ],
  "dollars-cents": [
    (r) => (r.params.fives + r.params.ones ? h("Count the bills first, then the coins from biggest to smallest.", "Cuenta primero los billetes y luego las monedas, de la mayor a la menor.") : h("Count the coins from the biggest to the smallest.", "Cuenta las monedas de la mayor a la menor.")),
    () => h("Bills are whole dollars. Count quarters by 25s, dimes by 10s and nickels by 5s. When the cents pass 100, that is another dollar.", "Los billetes son dólares enteros. Cuenta las monedas de 25 de veinticinco en veinticinco, las de 10 de diez en diez y las de 5 de cinco en cinco. Cuando los centavos pasan de 100, es otro dólar."),
    (r) => {
      const { fives, ones, q, d, n, p } = r.params;
      const bills = fives * 500 + ones * 100;
      const coins = [...Array(q).fill(25), ...Array(d).fill(10), ...Array(n).fill(5), ...Array(p).fill(1)];
      if (bills) return [h(`The bills alone are worth ${m(bills)}. Start your count there and add the coins.`, `Los billetes solos valen ${m(bills)}. Empieza ahí y suma las monedas.`), h("Start with the bills, then add the coins one kind at a time.", "Empieza con los billetes y suma las monedas de un tipo a la vez.")];
      const x = sum(biggestTwo(coins));
      return [h(`The two biggest coins are worth ${x}¢ together. Keep counting on from there.`, `Las dos monedas más grandes valen ${x}¢ juntas. Sigue contando desde ahí.`), h("Start with the biggest coins and count on.", "Empieza con las monedas más grandes y sigue contando.")];
    },
    (r) => {
      const { fives, ones, q, d, n, p } = r.params;
      const parts = [[fives, 500], [ones, 100], [q, 25], [d, 10], [n, 5], [p, 1]].filter(([count]) => count);
      const total = sum(parts.map(([count, v]) => count * v));
      const text = parts.map(([count, v]) => `${count} × ${v >= 100 ? `$${v / 100}` : `${v}¢`}`).join(" + ");
      return h(`${text} = ${m(total)}.`, `${text} = ${m(total)}.`);
    },
  ],
  "make-change": [
    () => h("Change is the money you give back. Start at the price and count UP to the amount paid.", "El cambio es el dinero que devuelves. Empieza en el precio y cuenta HACIA ARRIBA hasta lo que se pagó."),
    () => h("Count up from the price in friendly jumps, like to the next nickel, dime or dollar, then on to the amount paid. The pieces you add are the change.", "Cuenta hacia arriba desde el precio con saltos fáciles, como hasta la siguiente moneda de 5, de 10 o el siguiente dólar, y luego hasta lo que se pagó. Las piezas que agregas son el cambio."),
    () => [
      h("Try a price of 35¢ paid with $1.00. 35¢ to 40¢ is a nickel. 40¢ to 50¢ is a dime. 50¢ to $1.00 is two quarters. Now count up from your own price.", "Prueba con un precio de 35¢ pagado con $1.00. De 35¢ a 40¢ es una moneda de 5. De 40¢ a 50¢ es una de 10. De 50¢ a $1.00 son dos de 25. Ahora cuenta hacia arriba desde tu precio."),
      h("Try a price of 82¢ paid with $1.00. 82¢ to 85¢ is three pennies. 85¢ to 90¢ is a nickel. 90¢ to $1.00 is a dime. Now count up from your own price.", "Prueba con un precio de 82¢ pagado con $1.00. De 82¢ a 85¢ son tres centavos. De 85¢ a 90¢ es una de 5. De 90¢ a $1.00 es una de 10. Ahora cuenta hacia arriba desde tu precio."),
      h("Try $3.40 paid with $5.00. $3.40 to $3.50 is a dime. $3.50 to $4.00 is two quarters. $4.00 to $5.00 is a $1 bill. Now count up from your own price.", "Prueba con $3.40 pagado con $5.00. De $3.40 a $3.50 es una moneda de 10. De $3.50 a $4.00 son dos de 25. De $4.00 a $5.00 es un billete de $1. Ahora cuenta hacia arriba desde tu precio."),
      h("Count up in small, friendly jumps and write down each jump. Then add the jumps together.", "Cuenta hacia arriba con saltos pequeños y fáciles y anota cada salto. Luego suma los saltos."),
    ],
    (r, t) => {
      const { price, paid } = r.params;
      return h(`${m(paid)} − ${m(price)} = ${m(r.target)}. One way to give it: ${t.piecesText(t.pieces(r)).en}.`, `${m(paid)} − ${m(price)} = ${m(r.target)}. Una forma de darlo: ${t.piecesText(t.pieces(r)).es}.`);
    },
  ],
  "exact-pay": [
    () => h("Start with the biggest coin or bill that is not more than the amount.", "Empieza con la moneda o el billete más grande que no pase de la cantidad."),
    () => h("Pay with the biggest piece that fits, then look at what is still left to pay. Repeat with the biggest piece that fits the leftover.", "Paga con la pieza más grande que quepa y mira lo que falta por pagar. Repite con la pieza más grande que quepa en lo que falta."),
    (r) => [
      ...(r.pool.includes(500) ? [h("Try $6.35. A $5 bill leaves $1.35. A $1 bill leaves 35¢. A quarter leaves 10¢. A dime finishes it.", "Prueba con $6.35. Un billete de $5 deja $1.35. Un billete de $1 deja 35¢. Una moneda de 25 deja 10¢. Una de 10 termina el pago.")] : []),
      ...(r.pool.includes(100) ? [h("Try $2.30. Two $1 bills leave 30¢. A quarter leaves 5¢. A nickel finishes it.", "Prueba con $2.30. Dos billetes de $1 dejan 30¢. Una moneda de 25 deja 5¢. Una de 5 termina el pago.")] : []),
      h("Try 43¢. A quarter leaves 18¢. A dime leaves 8¢. A nickel leaves 3¢. Then three pennies.", "Prueba con 43¢. Una moneda de 25 deja 18¢. Una de 10 deja 8¢. Una de 5 deja 3¢. Luego tres centavos."),
      h("Try 67¢. A quarter leaves 42¢. Another quarter leaves 17¢. A dime leaves 7¢. A nickel leaves 2¢. Then two pennies.", "Prueba con 67¢. Una de 25 deja 42¢. Otra de 25 deja 17¢. Una de 10 deja 7¢. Una de 5 deja 2¢. Luego dos centavos."),
      h("Always take the biggest piece that fits, then look at the leftover.", "Toma siempre la pieza más grande que quepa y mira lo que sobra."),
    ],
    (r, t) => h(`The fewest pieces for ${m(r.target)}: ${t.piecesText(t.pieces(r)).en}. That is ${r.min} pieces.`, `Las menos piezas para ${m(r.target)}: ${t.piecesText(t.pieces(r)).es}. Son ${r.min} piezas.`),
  ],
  "round-prices": [
    () => h("Find the digit just to the right of the place you are rounding to.", "Busca el dígito que está justo a la derecha del lugar al que vas a redondear."),
    () => h("If that digit is 5 or more, round up. If it is less than 5, round down. Round every price before you add.", "Si ese dígito es 5 o más, redondea hacia arriba. Si es menor que 5, redondea hacia abajo. Redondea cada precio antes de sumar."),
    (r) => (r.params.place === 10
      ? [h("Try $62: the ones digit is 2, so round down to $60.", "Prueba con $62: el dígito de las unidades es 2, así que baja a $60."), h("Try $38: the ones digit is 8, so round up to $40.", "Prueba con $38: el dígito de las unidades es 8, así que sube a $40."), h("Look at the ones digit of each price to decide whether to go up or down.", "Mira el dígito de las unidades de cada precio para decidir si subes o bajas.")]
      : [h("Try $318: the tens digit is 1, so round down to $300.", "Prueba con $318: el dígito de las decenas es 1, así que baja a $300."), h("Try $652: the tens digit is 5, so round up to $700.", "Prueba con $652: el dígito de las decenas es 5, así que sube a $700."), h("Look at the tens digit of each price to decide whether to go up or down.", "Mira el dígito de las decenas de cada precio para decidir si subes o bajas.")]),
    (r) => {
      const { prices, place } = r.params;
      const rounded = prices.map((p) => place * Math.floor((2 * p + place) / (2 * place)));
      const text = prices.map((p, i) => `$${p} → $${rounded[i]}`).join("; ");
      const total = m(sum(rounded) * 100);
      const plus = rounded.map((x) => `$${x}`).join(" + ");
      return prices.length > 1 ? h(`${text}; ${plus} = ${total}.`, `${text}; ${plus} = ${total}.`) : h(`${text}, so the rounded price is ${total}.`, `${text}, así que el precio redondeado es ${total}.`);
    },
  ],
  "fill-budget": [
    () => h("Add up the prices as you put items in the cart. Keep checking the total against the budget and the goal.", "Suma los precios al poner artículos en el carrito. Compara el total con el presupuesto y con la meta."),
    () => h("Start with one bigger item, then fill in with smaller ones. If you go over, take something out.", "Empieza con un artículo más caro y completa con otros más baratos. Si te pasas, quita algo."),
    (r) => {
      const [low, next] = [...r.params.prices].sort((a, b) => a - b);
      return [h(`The two cheapest items together cost ${m(low + next)}. That is a start, but check whether you can reach the goal.`, `Los dos artículos más baratos juntos cuestan ${m(low + next)}. Es un comienzo, pero revisa si puedes llegar a la meta.`), h("If your total is too low, add a small item. If it is too high, swap a big item for a smaller one.", "Si tu total es muy bajo, agrega un artículo pequeño. Si es muy alto, cambia uno grande por uno más pequeño.")];
    },
    (r, t) => {
      const cart = t.solveCart(r);
      const en = cart.map((i) => `${r.scene.tags[i].name.en} ${m(r.scene.tags[i].cents)}`).join(" + ");
      const es = cart.map((i) => `${r.scene.tags[i].name.es} ${m(r.scene.tags[i].cents)}`).join(" + ");
      const total = t.cartTotal(r, cart);
      return h(`One cart that works: ${en} = ${m(total)}.`, `Un carrito que sirve: ${es} = ${m(total)}.`);
    },
  ],
  "multi-step-money": [
    () => h("Plan your steps before you calculate. What do you need to find first?", "Planea tus pasos antes de calcular. ¿Qué necesitas hallar primero?"),
    (r) => (r.params.ask === "total" ? h("Multiply the number of items by the price of one.", "Multiplica la cantidad de artículos por el precio de uno.") : h(`Find the cost of each kind of item (how many × price of one), add them${r.params.coupon ? ", take off the coupon" : ""}, then subtract the total from the amount paid.`, `Halla el costo de cada tipo de artículo (cuántos × precio de uno), súmalos${r.params.coupon ? ", quita el cupón" : ""} y resta el total de lo que se pagó.`)),
    () => [
      h("Try 3 pens at $0.40 each: 3 × $0.40 = $1.20. Write your own first step the same way.", "Prueba con 3 bolígrafos a $0.40 cada uno: 3 × $0.40 = $1.20. Escribe tu primer paso de la misma manera."),
      h("Try 2 books at $1.50 each: 2 × $1.50 = $3.00. Write your own first step the same way.", "Prueba con 2 libros a $1.50 cada uno: 2 × $1.50 = $3.00. Escribe tu primer paso de la misma manera."),
      h("Write the first step as how many × price of one, and work out only that step.", "Escribe el primer paso como cuántos × precio de uno y resuelve solo ese paso."),
    ],
    (r) => {
      const { lines: ls, coupon, paid, ask } = r.params;
      const costs = ls.map(([q, c]) => q * c);
      const gross = sum(costs);
      const steps = ls.map(([q, c], i) => `${q} × ${m(c)} = ${m(costs[i])}`).join("; ");
      const net = gross - coupon;
      const tail = ask === "total" ? `Total ${m(net)}.` : `${coupon ? `${m(gross)} − ${m(coupon)} = ${m(net)}; ` : ls.length > 1 ? `${m(gross)} total; ` : ""}${m(paid)} − ${m(net)} = ${m(paid - net)}.`;
      return h(`${steps}; ${tail}`, `${steps}; ${tail}`);
    },
  ],
};
