// Hint ladders for grades 5 to 8. Same shape as hints-a.js: [tier 0, tier 1, tier 2, tier 3].
import { h, m } from "./hint-tools.js";
import { roundHalfUp } from "./money.js";

const pct = (price, p) => roundHalfUp(price * p, 100);

export const bHints = {
  "decimal-ops": [
    (r) => ({
      add: h("Line up the decimal points so dollars sit over dollars and cents over cents.", "Alinea los puntos decimales: dólares con dólares y centavos con centavos."),
      sub: h("Line up the decimal points before you subtract.", "Alinea los puntos decimales antes de restar."),
      times: h("Multiply the price of one by how many were bought.", "Multiplica el precio de uno por la cantidad que se compró."),
      split: h("Sharing equally means dividing the total by the number of friends.", "Repartir en partes iguales significa dividir el total entre la cantidad de amigos."),
      weight: h("Multiply the price for one pound by the number of pounds.", "Multiplica el precio de una libra por la cantidad de libras."),
      splitround: h("Divide the total by the number of friends, then round to the nearest cent.", "Divide el total entre la cantidad de amigos y redondea al centavo más cercano."),
    })[r.params.op],
    (r) => ({
      add: h("Add the cents first and regroup 100 cents as one dollar, then add the dollars.", "Suma primero los centavos y reagrupa 100 centavos como un dólar; luego suma los dólares."),
      sub: h("Count up from the price to the amount paid, or subtract with the decimal points lined up.", "Cuenta hacia arriba desde el precio hasta lo que se pagó, o resta con los puntos decimales alineados."),
      times: h("Estimate first: round the price to a friendly number and multiply, so you know about how big the answer is.", "Estima primero: redondea el precio a un número fácil y multiplica para saber más o menos qué tan grande será la respuesta."),
      split: h("Divide the total by the number of friends, then check by multiplying back.", "Divide el total entre la cantidad de amigos y comprueba multiplicando de vuelta."),
      weight: h("Estimate with whole pounds first, then adjust for the part of a pound.", "Estima primero con libras enteras y luego ajusta por la parte de libra."),
      splitround: h("Divide until you have a digit past the cents place. If that digit is 5 or more, round the cents up.", "Divide hasta tener un dígito después de los centavos. Si ese dígito es 5 o más, sube los centavos."),
    })[r.params.op],
    (r) => [
      ...({
        add: [h("Try $1.35 + $2.40: 35¢ + 40¢ is 75¢, and $1 + $2 is $3, so $3.75.", "Prueba con $1.35 + $2.40: 35¢ + 40¢ son 75¢ y $1 + $2 son $3, así que $3.75.")],
        sub: [h("Try $10.00 − $6.40: count up from $6.40 to $7.00 (60¢), then to $10.00 ($3), so $3.60.", "Prueba con $10.00 − $6.40: cuenta de $6.40 a $7.00 (60¢) y luego a $10.00 ($3); son $3.60.")],
        times: [h("Try 4 × $2.30: 4 × $2 = $8 and 4 × 30¢ = $1.20, so $9.20.", "Prueba con 4 × $2.30: 4 × $2 = $8 y 4 × 30¢ = $1.20; son $9.20.")],
        split: [h("Try $9.60 shared by 4: $9.60 ÷ 4 = $2.40.", "Prueba con $9.60 entre 4: $9.60 ÷ 4 = $2.40.")],
        weight: [h("Try 1.5 pounds at $2.00 per pound: 1 pound is $2.00 and half a pound is $1.00, so $3.00.", "Prueba con 1.5 libras a $2.00 la libra: 1 libra son $2.00 y media libra es $1.00; son $3.00.")],
        splitround: [h("Try $10.00 shared by 3: $10.00 ÷ 3 = 3.333..., so round to $3.33.", "Prueba con $10.00 entre 3: $10.00 ÷ 3 = 3.333..., así que redondea a $3.33.")],
      })[r.params.op],
      h("Do one small step at a time and write each result down.", "Haz un paso pequeño a la vez y anota cada resultado."),
    ],
    (r) => {
      const p = r.params;
      const t = {
        add: `${m(p.a)} + ${m(p.b)} = ${m(p.a + p.b)}.`,
        sub: `${m(p.paid)} − ${m(p.price)} = ${m(p.paid - p.price)}.`,
        times: `${p.n} × ${m(p.p)} = ${m(p.n * p.p)}.`,
        split: `${m(p.total)} ÷ ${p.n} = ${m(p.total / p.n)}.`,
        weight: `${m(p.p)} × ${Math.floor(p.tenths / 10)}.${p.tenths % 10} = ${m((p.p / 10) * p.tenths)}.`,
        splitround: `${m(p.total)} ÷ ${p.n} is about ${m(roundHalfUp(p.total, p.n))} after rounding to the nearest cent.`,
      }[p.op];
      return h(t, p.op === "splitround" ? `${m(p.total)} ÷ ${p.n} es aproximadamente ${m(roundHalfUp(p.total, p.n))} al redondear al centavo más cercano.` : t);
    },
  ],
  "better-buy": [
    () => h("The total price is not the whole story. Find the price of ONE in each deal.", "El precio total no lo dice todo. Halla el precio de UNO en cada oferta."),
    (r) => h(`Divide the price by how many you get. The deal with the lower price for one is the better buy.${r.params.rounding ? " Round each price for one to the nearest cent." : ""}`, `Divide el precio entre la cantidad que recibes. La oferta con el menor precio por uno es la mejor compra.${r.params.rounding ? " Redondea cada precio por uno al centavo más cercano." : ""}`),
    () => [
      h("Try 4 for $2.00 and 6 for $2.70. $2.00 ÷ 4 = $0.50 for one. $2.70 ÷ 6 = $0.45 for one. The second deal is the better buy.", "Prueba con 4 por $2.00 y 6 por $2.70. $2.00 ÷ 4 = $0.50 por uno. $2.70 ÷ 6 = $0.45 por uno. La segunda oferta es la mejor compra."),
      h("Try 10 for $4.00 and 5 for $1.50. $4.00 ÷ 10 = $0.40 for one. $1.50 ÷ 5 = $0.30 for one. The second deal is the better buy.", "Prueba con 10 por $4.00 y 5 por $1.50. $4.00 ÷ 10 = $0.40 por uno. $1.50 ÷ 5 = $0.30 por uno. La segunda oferta es la mejor compra."),
      h("Find the price for one in each deal, then compare those two numbers.", "Halla el precio por uno en cada oferta y compara esos dos números."),
    ],
    (r) => {
      const [x, y] = r.params.offers;
      const u = r.expect;
      const line = (lang) => `Deal A: ${m(x.cents)} ÷ ${x.q} = ${m(u.a.n * 100 / u.a.d)}; Deal B: ${m(y.cents)} ÷ ${y.q} = ${m(u.b.n * 100 / u.b.d)}. Deal ${"AB"[r.answer]} ${lang === "en" ? "has the lower price for one, so it is the better buy" : "tiene el menor precio por uno, así que es la mejor compra"}.`;
      return h(line("en"), line("es").replaceAll("Deal", "Oferta"));
    },
  ],
  "rate-table": [
    () => h("Look for what ONE item costs. A rate table grows by multiplying, not by adding.", "Busca cuánto cuesta UN artículo. Una tabla de tasas crece multiplicando, no sumando."),
    (r) => ({
      cost: h("Divide a row's cost by its items to find the cost of one, then multiply by the new number of items.", "Divide el costo de una fila entre sus artículos para hallar el costo de uno y luego multiplica por la nueva cantidad."),
      unit: h("Divide the cost by the number of items to find the cost of one, then multiply by the new number of items.", "Divide el costo entre la cantidad de artículos para hallar el costo de uno y luego multiplica por la nueva cantidad."),
      budget: h("Find the cost of one item, then ask how many of those fit in the money you have.", "Halla el costo de un artículo y pregunta cuántos caben en el dinero que tienes."),
    })[r.params.type],
    () => [
      h("Try 4 items for $6.00. One costs $6.00 ÷ 4 = $1.50, and 10 cost 10 × $1.50 = $15.00.", "Prueba con 4 artículos por $6.00. Uno cuesta $6.00 ÷ 4 = $1.50 y 10 cuestan 10 × $1.50 = $15.00."),
      h("Try 5 items for $7.50. One costs $7.50 ÷ 5 = $1.50, and $12.00 buys $12.00 ÷ $1.50 = 8 items.", "Prueba con 5 artículos por $7.50. Uno cuesta $7.50 ÷ 5 = $1.50 y con $12.00 compras $12.00 ÷ $1.50 = 8 artículos."),
      h("Find the cost of one first, then scale up or down.", "Primero halla el costo de uno y luego escala hacia arriba o hacia abajo."),
    ],
    (r) => {
      const p = r.params;
      const [n, c] = p.rows[0];
      const u = c / n;
      const t = p.type === "budget" ? `One item costs ${m(c)} ÷ ${n} = ${m(u)}. ${m(p.budget)} ÷ ${m(u)} = ${p.budget / u} items.` : `One item costs ${m(c)} ÷ ${n} = ${m(u)}. ${p.n3} items cost ${p.n3} × ${m(u)} = ${m(p.n3 * u)}.`;
      return h(t, t);
    },
  ],
  "percent-off": [
    (r) => (r.params.steps.length > 1 ? h("Take the discounts one at a time, using the NEW price for the second one.", "Aplica los descuentos uno a la vez, usando el precio NUEVO para el segundo.") : r.params.ask === "saved" ? h("The amount you save is the percent of the price.", "El ahorro es el porcentaje del precio.") : h("Find the percent of the price first. That is the amount taken off.", "Primero halla el porcentaje del precio. Esa es la cantidad que se quita.")),
    (r) => (r.params.ask === "saved" ? h("Percent means per hundred: multiply the price by the percent, then divide by one hundred.", "Porcentaje significa por cada cien: multiplica el precio por el porcentaje y divide entre cien.") : h(`Percent means per hundred: multiply the price by the percent and divide by one hundred. Then subtract that amount from the price.${r.params.flat ? " Take the coupon off last." : ""}`, `Porcentaje significa por cada cien: multiplica el precio por el porcentaje y divide entre cien. Luego resta esa cantidad del precio.${r.params.flat ? " Resta el cupón al final." : ""}`)),
    () => [
      h("Try $40.00 with 25% off. 25% of $40.00 is $10.00, so the sale price is $40.00 − $10.00 = $30.00.", "Prueba con $40.00 con 25% de descuento. El 25% de $40.00 es $10.00, así que el precio de oferta es $40.00 − $10.00 = $30.00."),
      h("Try $60.00 with 10% off. 10% of $60.00 is $6.00, so the sale price is $60.00 − $6.00 = $54.00.", "Prueba con $60.00 con 10% de descuento. El 10% de $60.00 es $6.00, así que el precio de oferta es $60.00 − $6.00 = $54.00."),
      h("Find the percent of the price, then decide whether to subtract it.", "Halla el porcentaje del precio y decide si lo restas."),
    ],
    (r) => {
      const { price, steps, flat, ask } = r.params;
      const cuts = [];
      let now = price;
      for (const p of steps) {
        const next = roundHalfUp(now * (100 - p), 100);
        cuts.push(`${p}% of ${m(now)} is ${m(pct(now, p))}, so ${m(now)} − ${m(now - next)} = ${m(next)}`);
        now = next;
      }
      const es = cuts.join("; ");
      const finish = flat ? `; ${m(now)} − ${m(flat)} = ${m(now - flat)}` : "";
      const saved = `; the amount saved is ${m(price - now)}`;
      return ask === "saved" ? h(`${es}${saved}.`, `${es.replaceAll(" of ", " de ").replaceAll(" is ", " es ").replaceAll(", so ", ", así que ")}; el ahorro es ${m(price - now)}.`) : h(`${es}${finish}.`, `${es.replaceAll(" of ", " de ").replaceAll(" is ", " es ").replaceAll(", so ", ", así que ")}${finish}.`);
    },
  ],
  "tax-tip": [
    (r) => (r.params.tax && r.params.tip ? h("Find the tax and the tip separately, each on the bill before tax. Round each to the nearest cent.", "Halla el impuesto y la propina por separado, cada uno sobre la cuenta antes del impuesto. Redondea cada uno al centavo más cercano.") : h("Find the tax or tip amount first, then add it to the price.", "Primero halla el impuesto o la propina y luego súmalo al precio.")),
    () => h("Percent means per hundred: multiply the amount by the percent and divide by one hundred. Round to the nearest cent, then add it on.", "Porcentaje significa por cada cien: multiplica la cantidad por el porcentaje y divide entre cien. Redondea al centavo más cercano y súmalo."),
    () => [
      h("Try a $20.00 bill with a 15% tip. 15% of $20.00 is $3.00, so the total is $20.00 + $3.00 = $23.00.", "Prueba con una cuenta de $20.00 y propina de 15%. El 15% de $20.00 es $3.00, así que el total es $20.00 + $3.00 = $23.00."),
      h("Try $50.00 with 6% tax. 6% of $50.00 is $3.00, so the total is $50.00 + $3.00 = $53.00.", "Prueba con $50.00 con 6% de impuesto. El 6% de $50.00 es $3.00, así que el total es $50.00 + $3.00 = $53.00."),
      h("Find the amount for the percent, round it to the cent, then add it to the bill.", "Halla la cantidad del porcentaje, redondéala al centavo y súmala a la cuenta."),
    ],
    (r) => {
      const { price, tax, tip } = r.params;
      const parts = [];
      if (tax) parts.push(`tax ${tax}% of ${m(price)} = ${m(pct(price, tax))}`);
      if (tip) parts.push(`tip ${tip}% of ${m(price)} = ${m(pct(price, tip))}`);
      const total = price + pct(price, tax) + pct(price, tip);
      const partsEs = parts.map((x) => x.replace("tax", "impuesto").replace("tip", "propina").replace(" of ", " de "));
      return h(`${parts.join("; ")}; ${m(price)} + ${m(pct(price, tax) + pct(price, tip))} = ${m(total)}.`, `${partsEs.join("; ")}; ${m(price)} + ${m(pct(price, tax) + pct(price, tip))} = ${m(total)}.`);
    },
  ],
  "percent-change": [
    (r) => (r.params.type ? h("Decide whether the price goes up or down, and by what percent of the OLD price.", "Decide si el precio sube o baja, y en qué porcentaje del precio ANTERIOR.") : h("First find how much the price changed, in dollars.", "Primero halla cuánto cambió el precio, en dólares.")),
    (r) => (r.params.type ? h("Find the percent of the old price, then add it for a markup or subtract it for a markdown.", "Halla el porcentaje del precio anterior y súmalo si es un aumento o réstalo si es una rebaja.") : h("Divide the change by the OLD price, then multiply by one hundred to make it a percent.", "Divide el cambio entre el precio ANTERIOR y multiplica por cien para convertirlo en porcentaje.")),
    (r) => (r.params.type
      ? [h("Try a $20.00 item marked up 50%. 50% of $20.00 is $10.00, so the new price is $30.00.", "Prueba con un artículo de $20.00 con aumento de 50%. El 50% de $20.00 es $10.00, así que el precio nuevo es $30.00."), h("Try a $50.00 item marked down 10%. 10% of $50.00 is $5.00, so the new price is $45.00.", "Prueba con un artículo de $50.00 con rebaja de 10%. El 10% de $50.00 es $5.00, así que el precio nuevo es $45.00."), h("Find the amount for the percent of the old price, then add or subtract it.", "Halla la cantidad del porcentaje del precio anterior y súmala o réstala.")]
      : [h("Try $20.00 changing to $25.00. The change is $5.00, and $5.00 ÷ $20.00 = 0.25, which is 25%.", "Prueba con $20.00 que cambia a $25.00. El cambio es $5.00 y $5.00 ÷ $20.00 = 0.25, que es 25%."), h("Try $80.00 dropping to $60.00. The change is $20.00, and $20.00 ÷ $80.00 = 0.25, which is 25%.", "Prueba con $80.00 que baja a $60.00. El cambio es $20.00 y $20.00 ÷ $80.00 = 0.25, que es 25%."), h("Divide the change by the old price, then write the result as a percent.", "Divide el cambio entre el precio anterior y escribe el resultado como porcentaje.")]),
    (r) => {
      const p = r.params;
      if (p.type) {
        const amount = (p.price * p.p) / 100;
        const up = p.type === "markup";
        return h(`${p.p}% of ${m(p.price)} is ${m(amount)}. ${m(p.price)} ${up ? "+" : "−"} ${m(amount)} = ${m(up ? p.price + amount : p.price - amount)}.`, `El ${p.p}% de ${m(p.price)} es ${m(amount)}. ${m(p.price)} ${up ? "+" : "−"} ${m(amount)} = ${m(up ? p.price + amount : p.price - amount)}.`);
      }
      const diff = Math.abs(p.next - p.old);
      const value = `${r.expect.answer.n / r.expect.answer.d}`;
      return h(`The change is ${m(diff)}. ${m(diff)} ÷ ${m(p.old)} = ${value}% after multiplying by one hundred.`, `El cambio es ${m(diff)}. ${m(diff)} ÷ ${m(p.old)} = ${value}% al multiplicar por cien.`);
    },
  ],
  "simple-interest": [
    () => h("Simple interest is earned on the money you put in, the same amount each year.", "El interés simple se gana sobre el dinero que depositas, la misma cantidad cada año."),
    (r) => h(`Interest = deposit × rate × time in years.${r.params.months % 12 ? " Turn the months into a part of a year first." : ""}${r.params.ask === "balance" ? " The balance is the deposit plus the interest." : ""}`, `Interés = depósito × tasa × tiempo en años.${r.params.months % 12 ? " Primero convierte los meses en una parte de un año." : ""}${r.params.ask === "balance" ? " El saldo es el depósito más el interés." : ""}`),
    () => [
      h("Try $200.00 at 5% for 2 years. One year earns 5% of $200.00, which is $10.00, so 2 years earn $20.00.", "Prueba con $200.00 al 5% por 2 años. Un año gana el 5% de $200.00, que son $10.00, así que 2 años ganan $20.00."),
      h("Try $400.00 at 3% for 6 months. A full year earns $12.00, so half a year earns $6.00.", "Prueba con $400.00 al 3% por 6 meses. Un año completo gana $12.00, así que medio año gana $6.00."),
      h("Find one year of interest first, then scale it by the time.", "Primero halla el interés de un año y luego escálalo según el tiempo."),
    ],
    (r) => {
      const { principal, r: rate, months, ask } = r.params;
      const oneYear = (principal * rate) / 100;
      const interest = (principal * rate * months) / 1200;
      const years = months % 12 ? `${months}/12 of a year` : `${months / 12} year${months === 12 ? "" : "s"}`;
      const yearsEs = months % 12 ? `${months}/12 de año` : `${months / 12} ${months === 12 ? "año" : "años"}`;
      const core = `${m(principal)} × ${rate}% = ${m(oneYear)} per year; × ${years} = ${m(interest)} interest.`;
      const coreEs = `${m(principal)} × ${rate}% = ${m(oneYear)} por año; × ${yearsEs} = ${m(interest)} de interés.`;
      return ask === "balance" ? h(`${core} Balance: ${m(principal)} + ${m(interest)} = ${m(principal + interest)}.`, `${coreEs} Saldo: ${m(principal)} + ${m(interest)} = ${m(principal + interest)}.`) : h(core, coreEs);
    },
  ],
  "compare-plans": [
    () => h("The cheaper plan can change as the number of uses changes. Work out the whole cost of EACH plan.", "El plan más barato puede cambiar según la cantidad de useas. Calcula el costo total de CADA plan."),
    () => h("Total cost = fixed fee + (price each × how many). The fee is paid once.", "Costo total = cuota fija + (precio de cada uno × cantidad). La cuota se paga una sola vez."),
    () => [
      h("Try a plan with a $5.00 fee and $2.00 each, for 4 uses: $5.00 + 4 × $2.00 = $5.00 + $8.00 = $13.00.", "Prueba con un plan de cuota $5.00 y $2.00 cada uno, para 4 useas: $5.00 + 4 × $2.00 = $5.00 + $8.00 = $13.00."),
      h("Try a plan with no fee and $3.50 each, for 6 uses: 6 × $3.50 = $21.00.", "Prueba con un plan sin cuota y $3.50 cada uno, para 6 useas: 6 × $3.50 = $21.00."),
      h("Multiply the price each by the number of uses, then add the fee once.", "Multiplica el precio de cada uno por la cantidad de useas y suma la cuota una sola vez."),
    ],
    (r) => {
      const { plans, n } = r.params;
      const parts = plans.map((pl) => `Plan ${pl.name}: ${m(pl.fee)} + ${n} × ${m(pl.rate)} = ${m(pl.fee + n * pl.rate)}`);
      const best = r.answer;
      return h(`${parts.join("; ")}. Plan ${plans[best].name} costs less.`, `${parts.join("; ")}. El Plan ${plans[best].name} cuesta menos.`);
    },
  ],
  "break-even": [
    () => h("Break-even means the two plans cost the same. Write the cost of each plan with the same number of uses.", "Punto de equilibrio significa que los dos planes cuestan lo mismo. Escribe el costo de cada plan con la misma cantidad de useas."),
    () => h("The plan with the bigger fee saves money on each use. Divide the difference in fees by how much is saved on each use.", "El plan con la cuota mayor ahorra dinero en cada usea. Divide la diferencia de cuotas entre lo que se ahorra en cada usea."),
    () => [
      h("Try Plan A: $0 fee and $5.00 each, and Plan B: $12.00 fee and $2.00 each. B saves $3.00 per use, so it catches up after $12.00 ÷ $3.00 = 4 uses.", "Prueba con el Plan A: sin cuota y $5.00 cada uno, y el Plan B: cuota $12.00 y $2.00 cada uno. B ahorra $3.00 por usea, así que se iguala después de $12.00 ÷ $3.00 = 4 useas."),
      h("Try fees of $6.00 and $10.00, with prices of $3.00 and $2.00 each. The extra $4.00 fee is paid back at $1.00 saved per use, which takes 4 uses.", "Prueba con cuotas de $6.00 y $10.00, y precios de $3.00 y $2.00 cada uno. Los $4.00 de cuota extra se recuperan ahorrando $1.00 por usea, y eso toma 4 useas."),
      h("Divide the extra fee by the amount saved on each use.", "Divide la cuota extra entre lo que se ahorra en cada usea."),
    ],
    (r) => {
      const [x, y] = [...r.params.plans].sort((a, b) => a.fee - b.fee);
      const n = (y.fee - x.fee) / (x.rate - y.rate);
      const cost = x.fee + x.rate * n;
      const base = `Extra fee ${m(y.fee - x.fee)} ÷ saved per use ${m(x.rate - y.rate)} = ${n} uses.`;
      const baseEs = `Cuota extra ${m(y.fee - x.fee)} ÷ ahorro por usea ${m(x.rate - y.rate)} = ${n} useas.`;
      const tail = r.params.level3 ? ` Cost: ${m(x.fee)} + ${n} × ${m(x.rate)} = ${m(cost)}.` : "";
      const tailEs = r.params.level3 ? ` Costo: ${m(x.fee)} + ${n} × ${m(x.rate)} = ${m(cost)}.` : "";
      return h(base + tail, baseEs + tailEs);
    },
  ],
  "slope-unit-cost": [
    (r) => (r.params.fee ? h("The first row includes a fixed fee, so do not just divide it. Compare two rows instead.", "La primera fila incluye una cuota fija, así que no la dividas sin más. Compara dos filas.") : h("Look at one row: the cost divided by the number of items is the cost of each.", "Mira una fila: el costo dividido entre la cantidad de artículos es el costo de cada uno.")),
    (r) => (r.params.fee ? h("Subtract to see how much the cost CHANGES between two rows, and how many items were added. Divide the first by the second.", "Resta para ver cuánto CAMBIA el costo entre dos filas y cuántos artículos se agregaron. Divide lo primero entre lo segundo.") : h("Divide the cost by the number of items. Check with another row.", "Divide el costo entre la cantidad de artículos. Comprueba con otra fila.")),
    () => [
      h("Try rows (2 items, $9.00) and (5 items, $18.00). The cost changes by $9.00 while 3 items are added, so each item costs $9.00 ÷ 3 = $3.00.", "Prueba con las filas (2 artículos, $9.00) y (5 artículos, $18.00). El costo cambia $9.00 al agregar 3 artículos, así que cada uno cuesta $9.00 ÷ 3 = $3.00."),
      h("Try rows (1 item, $7.00) and (3 items, $11.00). The cost changes by $4.00 while 2 items are added, so each costs $2.00 and the fee is $7.00 − $2.00 = $5.00.", "Prueba con las filas (1 artículo, $7.00) y (3 artículos, $11.00). El costo cambia $4.00 al agregar 2 artículos, así que cada uno cuesta $2.00 y la cuota es $7.00 − $2.00 = $5.00."),
      h("Pick two rows, subtract to find the change in cost and the change in items, then divide.", "Elige dos filas, resta para hallar el cambio en el costo y en los artículos y luego divide."),
    ],
    (r) => {
      const [[n1, c1], [n2, c2]] = r.params.rows;
      const rate = (c2 - c1) / (n2 - n1);
      const base = `(${m(c2)} − ${m(c1)}) ÷ (${n2} − ${n1}) = ${m(rate)} per item.`;
      const fee = r.params.fee ? ` Fixed fee: ${m(c1)} − ${n1} × ${m(rate)} = ${m(c1 - n1 * rate)}.` : "";
      return h(base + fee, `(${m(c2)} − ${m(c1)}) ÷ (${n2} − ${n1}) = ${m(rate)} por artículo.${r.params.fee ? ` Cuota fija: ${m(c1)} − ${n1} × ${m(rate)} = ${m(c1 - n1 * rate)}.` : ""}`);
    },
  ],
};
