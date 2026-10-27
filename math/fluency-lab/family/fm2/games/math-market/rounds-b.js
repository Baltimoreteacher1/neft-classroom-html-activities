// Round generators, grades 5-8: decimal prices, unit price, rate tables, percents, interest, and linear cost plans.
// Exact integer cents or exact rationals throughout; any result that is not a whole cent says so in the prompt and is
// rounded half up to the cent. @fm2 FM-053 FM-054 FM-056 FM-057 FM-058
import { frac } from "../../rational.js";
import { int, pick, sample } from "../../rng.js";
import { both, enter, F, lv, ROUND_NOTE, T, usd, wr } from "./build.js";
import { aEn, aEs, BULK, cap, itemFor, itemName, named, priceIn, SHOPPERS, SMALL, theEs, VISITS, WEIGHED } from "./items.js";
import { money, roundHalfUp } from "./money.js";

const fixedLine = (text) => ({ type: "receipt", lines: text });

export function decimalOps(level, rng) {
  const who = pick(rng, SHOPPERS);
  const op = lv(level, pick(rng, ["add", "sub"]), pick(rng, ["times", "split"]), pick(rng, ["weight", "splitround"]));
  let prompt;
  let cents;
  let wrongs = [];
  let params;
  if (op === "add") {
    const [a, b] = [int(rng, 105, 1499), int(rng, 105, 1499)];
    cents = a + b;
    prompt = T(`${who} buys one item for ${money(a)} and another for ${money(b)}. What is the total?`, `${who} compra un artículo por ${money(a)} y otro por ${money(b)}. ¿Cuál es el total?`);
    wrongs = [wr("dollars-only", "answer", usd(Math.floor(cents / 100) * 100))];
    params = { op, a, b };
  } else if (op === "sub") {
    const price = int(rng, 105, 995);
    const paid = pick(rng, [1000, 2000]);
    cents = paid - price;
    prompt = T(`${who} pays ${money(paid)} for something that costs ${money(price)}. How much change should ${who} get?`, `${who} paga ${money(paid)} por algo que cuesta ${money(price)}. ¿Cuánto cambio debe recibir?`);
    wrongs = [wr("added-instead", "answer", usd(paid + price))];
    params = { op, price, paid };
  } else if (op === "times") {
    const item = pick(rng, SMALL.filter((i) => i.hi <= 700));
    const [n, p] = [int(rng, 3, 12), int(rng, Math.max(item.lo, 35), item.hi)];
    cents = n * p;
    prompt = T(`One ${item.en} costs ${money(p)}. ${who} buys ${n}. What is the total cost?`, `${cap(aEs(item))} cuesta ${money(p)}. ${who} compra ${n}. ¿Cuál es el costo total?`);
    params = { op, n, p };
  } else if (op === "split") {
    const [n, c] = [int(rng, 2, 8), int(rng, 45, 399)];
    cents = c;
    prompt = T(`${n} friends share a bill of ${money(n * c)} equally. How much does each friend pay?`, `${n} amigos dividen en partes iguales una cuenta de ${money(n * c)}. ¿Cuánto paga cada amigo?`);
    params = { op, n, total: n * c };
  } else if (op === "weight") {
    const thing = pick(rng, WEIGHED);
    const [p, tenths] = [10 * int(rng, 15, 80), int(rng, 12, 48)];
    cents = (p / 10) * tenths;
    const lb = `${Math.floor(tenths / 10)}.${tenths % 10}`;
    prompt = T(`${cap(thing.en)} costs ${money(p)} per pound. ${who} buys ${lb} pounds. What does it cost?`, `${cap(theEs(thing))} cuesta ${money(p)} por libra. ${who} compra ${lb} libras. ¿Cuánto cuesta?`);
    params = { op, p, tenths };
  } else {
    let total;
    let n;
    do {
      n = pick(rng, [3, 6, 7, 9]);
      total = int(rng, 1000, 5000);
    } while (total % n === 0);
    cents = roundHalfUp(total, n);
    prompt = T(`${n} friends share ${money(total)} equally. How much does each pay? ${ROUND_NOTE.en}`, `${n} amigos dividen ${money(total)} en partes iguales. ¿Cuánto paga cada uno? ${ROUND_NOTE.es}`);
    wrongs = [wr("truncated", "answer", usd(Math.floor(total / n)))];
    params = { op, n, total };
  }
  return enter("decimal-ops", level, { prompt, scene: { type: "none" }, fields: [F("answer", "$", "Answer ($)", "Respuesta ($)")], expect: { answer: usd(cents) }, wrongs, params });
}

export function betterBuy(level, rng, grade) {
  const weigh = grade === 6;
  const thing = weigh ? pick(rng, WEIGHED) : pick(rng, BULK);
  const rounding = grade === 5 && level === 3;
  const wantBig = pick(rng, [true, false]);
  for (;;) {
    const quantity = () => (weigh ? lv(level, pick(rng, [4, 5, 6, 8, 10, 12]), int(rng, 8, 40), int(rng, 12, 64)) : int(rng, ...lv(level, [2, 6], [3, 12], [3, 12])));
    const [q1, q2] = [quantity(), quantity()];
    if (q1 === q2) continue;
    const unit = () => (weigh ? priceIn(rng, thing, 1, ...lv(level, [thing.lo, Math.min(thing.hi, thing.lo + 10)], [thing.lo, thing.hi], [thing.lo, thing.hi])) : priceIn(rng, thing, lv(level, 5, 1, 1)));
    let [p1, p2] = rounding ? [unit() * q1 + int(rng, 0, q1 - 1), unit() * q2 + int(rng, 0, q2 - 1)] : [unit() * q1, unit() * q2];
    if (rounding && q1 % 2 === 0 && rng() < 0.3) p1 = q1 * int(rng, 10, 90) + q1 / 2;
    const [u1, u2] = [roundHalfUp(p1, q1), roundHalfUp(p2, q2)];
    if (p1 * q2 === p2 * q1 || u1 === u2) continue;
    const better = p1 * q2 < p2 * q1 ? 0 : 1;
    const bigger = q1 > q2 ? 0 : 1;
    if ((better === bigger) !== wantBig) continue;
    if (rounding && p1 % q1 === 0 && p2 % q2 === 0) continue;
    const wrong = 1 - better;
    const offers = [{ q: q1, cents: p1 }, { q: q2, cents: p2 }];
    const one = weigh ? T("one ounce", "una onza") : T(`one ${itemName(thing, "en")}`, `${thing.g === "f" ? "una" : "un"} ${itemName(thing, "es")}`);
    const note = rounding ? ROUND_NOTE : { en: "", es: "" };
    const label = (i) => T(`Deal ${"AB"[i]}`, `Oferta ${"AB"[i]}`);
    const thingName = weigh ? T(`oz of ${thing.en}`, `oz de ${thing.es}`) : named(thing, 2);
    return {
      skillId: "better-buy",
      level,
      kind: "pickEnter",
      prompt: T(
        `Which deal is the better buy? Tap it, then type the price of ${one.en} in each deal. ${note.en}`.trim(),
        `¿Qué oferta es la mejor compra? Tócala y escribe el precio de ${one.es} en cada oferta. ${note.es}`.trim(),
      ),
      scene: { type: "tags", tags: offers.map((o, i) => ({ label: label(i), name: thingName, qty: o.q, cents: o.cents, total: true })) },
      fields: [F("a", "$", "Unit price, Deal A ($)", "Precio unitario, Oferta A ($)"), F("b", "$", "Unit price, Deal B ($)", "Precio unitario, Oferta B ($)")],
      expect: { a: usd(u1), b: usd(u2) },
      wrongs: [
        { mistake: "swapped", values: { a: usd(u2), b: usd(u1) } },
        ...(rounding ? [{ mistake: "truncated", values: { a: usd(Math.floor(p1 / q1)), b: usd(Math.floor(p2 / q2)) } }] : []),
      ],
      answer: better,
      pickMistake: offers[wrong].cents < offers[better].cents ? "compared-totals" : "bigger-pack",
      params: { offers, rounding, weigh },
    };
  }
}

export function rateTable(level, rng) {
  const thing = pick(rng, BULK);
  const m = pick(rng, [2, 3, 4, 5]);
  const u = priceIn(rng, thing, lv(level, 25, 5, 5));
  const head = [T("Items", "Artículos"), T("Cost", "Costo")];
  if (level === 1) {
    const n3 = pick(rng, [3 * m, 4 * m, 5 * m]);
    return enter("rate-table", level, {
      prompt: T(`This table shows the cost of ${itemName(thing, "en", 2)}. How much do ${n3} cost?`, `Esta tabla muestra el costo de ${itemName(thing, "es", 2)}. ¿Cuánto cuestan ${n3}?`),
      scene: { type: "table", head, rows: [[m, m * u], [2 * m, 2 * m * u], [n3, null]] },
      fields: [F("total", "$", "Cost ($)", "Costo ($)")],
      expect: { total: usd(n3 * u) },
      wrongs: [wr("additive", "total", usd(2 * m * u + (n3 - 2 * m) * 100)), wr("unit-price-only", "total", usd(u))],
      params: { type: "cost", rows: [[m, m * u], [2 * m, 2 * m * u]], n3 },
    });
  }
  if (level === 2) {
    const n3 = m * int(rng, 2, 4) + int(rng, 1, m - 1);
    return enter("rate-table", level, {
      prompt: T(`${m} ${itemName(thing, "en", m)} cost ${money(m * u)}. At that rate, what does 1 cost, and what do ${n3} cost?`, `${m} ${itemName(thing, "es", m)} cuestan ${money(m * u)}. A esa tasa, ¿cuánto cuesta 1 y cuánto cuestan ${n3}?`),
      scene: { type: "table", head, rows: [[m, m * u], [1, null], [n3, null]] },
      fields: [F("unit", "$", "Cost of 1 ($)", "Costo de 1 ($)"), F("total", "$", `Cost of ${n3} ($)`, `Costo de ${n3} ($)`)],
      expect: { unit: usd(u), total: usd(n3 * u) },
      wrongs: [wr("forgot-multiply", "total", usd(u)), wr("additive", "total", usd(m * u + (n3 - m) * 100))],
      params: { type: "unit", rows: [[m, m * u]], n3 },
    });
  }
  const n = int(rng, 10, 40);
  return enter("rate-table", level, {
    prompt: T(`${m} ${itemName(thing, "en", m)} cost ${money(m * u)}. You have ${money(n * u)}. How many ${itemName(thing, "en", 2)} can you buy?`, `${m} ${itemName(thing, "es", m)} cuestan ${money(m * u)}. Tienes ${money(n * u)}. ¿Cuántos puedes comprar?`),
    scene: { type: "table", head, rows: [[m, m * u], [2 * m, 2 * m * u], [null, n * u]] },
    fields: [F("count", "#", "Number of items", "Cantidad de artículos")],
    expect: { count: frac(n) },
    wrongs: [{ mistake: "groups-not-items", values: { count: frac(n * u, m * u) } }],
    params: { type: "budget", rows: [[m, m * u], [2 * m, 2 * m * u]], budget: n * u },
  });
}

function pctSteps(price, steps) {
  // Exact: price * product((100 - p)/100) in cents as a rational, then rounded once at the end.
  let num = price;
  let den = 1;
  for (const p of steps) {
    num *= 100 - p;
    den *= 100;
  }
  return { num, den, cents: roundHalfUp(num, den), exact: num % den === 0 };
}

export function percentOff(level, rng, grade) {
  let price;
  let steps;
  let flat = 0;
  let ask = "sale";
  if (grade === 6) {
    steps = [pick(rng, lv(level, [10, 20, 25, 50], [10, 20, 25, 30, 40, 50, 75], [10, 20, 25, 30, 40, 50]))];
    price = level === 2 ? 5 * int(rng, 40, 400) : 100 * int(rng, level === 3 ? 20 : 5, level === 3 ? 120 : 40);
    while ((price * steps[0]) % 100) price += 5;
    if (level === 2) ask = "saved";
    if (level === 3) flat = 100 * int(rng, 1, 5);
  } else {
    const ps = [5, 10, 15, 20, 25, 30, 35, 40, 45];
    price = level === 1 ? 100 * int(rng, 8, 80) : level === 2 ? int(rng, 300, 15000) : 100 * int(rng, 20, 150);
    steps = level === 3 ? [pick(rng, [10, 20, 25, 30, 40, 50]), pick(rng, [10, 20, 25, 30, 40, 50])] : [pick(rng, level === 1 ? [...ps, 50, 60, 75, 90] : ps)];
    while (level === 3 && pctSteps(price, steps).num % pctSteps(price, steps).den) price += 100;
  }
  const item = itemFor(rng, price);
  const { cents: sale, exact } = pctSteps(price, steps);
  const discount = price - pctSteps(price, [steps[0]]).cents;
  const final = sale - flat;
  const target = ask === "saved" ? discount : final;
  const first = pctSteps(price, [steps[0]]).cents;
  const wrongs =
    ask === "saved"
      ? [wr("gave-sale-price", "answer", usd(price - discount)), wr("percent-as-dollars", "answer", usd(steps[0] * 100))]
      : [wr("gave-discount", "answer", usd(price - final)), wr("added-discount", "answer", usd(price + (price - final))), wr("percent-as-dollars", "answer", usd(price - steps[0] * 100))];
  if (steps.length > 1) {
    wrongs.push(wr("first-only", "answer", usd(first)), wr("percents-added", "answer", usd(pctSteps(price, [steps[0] + steps[1]]).cents)));
  }
  if (flat) wrongs.push(wr("first-only", "answer", usd(first)), wr("added-coupon", "answer", usd(first + flat)));
  const stepEn = steps.map((p, i) => (i ? `then another ${p}% off` : `${p}% off`)).join(", ");
  const stepEs = steps.map((p, i) => (i ? `y luego otro ${p}% de descuento` : `${p}% de descuento`)).join(" ");
  const askEn = ask === "saved" ? "How much do you save?" : "What is the sale price?";
  const askEs = ask === "saved" ? "¿Cuánto ahorras?" : "¿Cuál es el precio de oferta?";
  const flatEn = flat ? ` Then a coupon takes ${money(flat)} off.` : "";
  const flatEs = flat ? ` Después, un cupón quita ${money(flat)}.` : "";
  const base = T(
    `${cap(aEn(item))} costs ${money(price)} and is on sale for ${stepEn}.${flatEn} ${askEn}`,
    `${cap(aEs(item))} cuesta ${money(price)} y está en oferta con ${stepEs}.${flatEs} ${askEs}`,
  );
  return enter("percent-off", level, {
    prompt: exact || ask === "saved" ? base : both(base, ROUND_NOTE),
    scene: fixedLine([{ label: named(item), cents: price }]),
    fields: [F("answer", "$", ask === "saved" ? "Amount saved ($)" : "Sale price ($)", ask === "saved" ? "Ahorro ($)" : "Precio de oferta ($)")],
    expect: { answer: usd(target) },
    wrongs,
    params: { price, steps, flat, ask },
  });
}

export function taxTip(level, rng) {
  if (level === 1) {
    const price = 100 * int(rng, 10, 90);
    const item = itemFor(rng, price);
    const r = pick(rng, [5, 6, 8, 10]);
    const tax = (price * r) / 100;
    return enter("tax-tip", level, {
      prompt: T(`${cap(aEn(item))} costs ${money(price)}. The sales tax is ${r}%. What is the total with tax?`, `${cap(aEs(item))} cuesta ${money(price)}. El impuesto sobre la venta es ${r}%. ¿Cuál es el total con impuesto?`),
      scene: fixedLine([{ label: named(item), cents: price }]),
      fields: [F("answer", "$", "Total ($)", "Total ($)")],
      expect: { answer: usd(price + tax) },
      wrongs: [wr("amount-only", "answer", usd(tax)), wr("percent-as-dollars", "answer", usd(price + r * 100))],
      params: { price, tax: r, tip: 0 },
    });
  }
  const bill = level === 2 ? int(rng, 1200, 9000) : int(rng, 2000, 12000);
  const tip = pick(rng, level === 2 ? [15, 18, 20, 25] : [15, 18, 20]);
  const tax = level === 3 ? pick(rng, [5, 6, 7, 8]) : 0;
  const taxC = roundHalfUp(bill * tax, 100);
  const tipC = roundHalfUp(bill * tip, 100);
  const wrongs = [wr("amount-only", "answer", usd(tipC)), wr("percent-as-dollars", "answer", usd(bill + tip * 100)), wr("truncated", "answer", usd(bill + Math.floor((bill * tax) / 100) + Math.floor((bill * tip) / 100)))];
  if (level === 3) {
    wrongs.push(wr("tip-on-total", "answer", usd(bill + taxC + roundHalfUp((bill + taxC) * tip, 100))), wr("forgot-tax", "answer", usd(bill + tipC)), wr("forgot-tip", "answer", usd(bill + taxC)));
  }
  const taxEn = tax ? ` Sales tax of ${tax}% is added to the bill.` : "";
  const taxEs = tax ? ` Se suma un impuesto sobre la venta de ${tax}%.` : "";
  const ruleEn = level === 3 ? " Figure the tip on the bill before tax. Round the tax and the tip each to the nearest cent (half a cent rounds up), then add." : " Round to the nearest cent (half a cent rounds up).";
  const ruleEs = level === 3 ? " Calcula la propina sobre la cuenta antes del impuesto. Redondea el impuesto y la propina al centavo más cercano (medio centavo sube) y suma." : ` ${ROUND_NOTE.es}`;
  return enter("tax-tip", level, {
    prompt: T(`A dinner bill is ${money(bill)}.${taxEn} You leave a ${tip}% tip. What is the total you pay?${ruleEn}`, `La cuenta de una cena es ${money(bill)}.${taxEs} Dejas una propina de ${tip}%. ¿Cuál es el total que pagas?${ruleEs}`),
    scene: fixedLine([{ label: T("Bill", "Cuenta"), cents: bill }]),
    fields: [F("answer", "$", "Total paid ($)", "Total pagado ($)")],
    expect: { answer: usd(bill + taxC + tipC) },
    wrongs,
    params: { price: bill, tax, tip },
  });
}

export function percentChange(level, rng) {
  if (level === 1) {
    const [type, p] = [pick(rng, ["markup", "markdown"]), pick(rng, [10, 20, 25, 50])];
    const price = 100 * int(rng, 10, 80);
    const item = itemFor(rng, price);
    const amount = (price * p) / 100;
    const up = type === "markup";
    return enter("percent-change", level, {
      prompt: up
        ? T(`A store buys ${aEn(item)} for ${money(price)} and marks the price up ${p}%. What is the selling price?`, `Una tienda compra ${aEs(item)} por ${money(price)} y aumenta el precio ${p}%. ¿Cuál es el precio de venta?`)
        : T(`${cap(aEn(item))} regularly costs ${money(price)}. The store marks it down ${p}%. What is the new price?`, `${cap(aEs(item))} cuesta normalmente ${money(price)}. La tienda lo rebaja ${p}%. ¿Cuál es el nuevo precio?`),
      scene: fixedLine([{ label: named(item), cents: price }]),
      fields: [F("answer", "$", "New price ($)", "Precio nuevo ($)")],
      expect: { answer: usd(up ? price + amount : price - amount) },
      wrongs: [wr("wrong-direction", "answer", usd(up ? price - amount : price + amount)), wr("gave-amount", "answer", usd(amount))],
      params: { type, price, p },
    });
  }
  const eighth = level === 3;
  const pct = eighth ? frac(pick(rng, [25, 75, 125, 175]), 2) : frac(pick(rng, [10, 20, 25, 40, 50, 60, 75]));
  const dir = pick(rng, ["increase", "decrease"]);
  let old;
  let delta;
  do {
    old = 40 * int(rng, 5, 40);
    delta = (old * pct.n) / (pct.d * 100);
  } while (!Number.isInteger(delta) || delta < 1);
  const next = dir === "increase" ? old + delta : old - delta;
  const diff = Math.abs(next - old);
  const item = itemFor(rng, old, SMALL);
  return enter("percent-change", level, {
    prompt: T(
      `The price of ${aEn(item)} changed from ${money(old)} to ${money(next)}. What is the percent ${dir}? (Type just the number.)`,
      `El precio de ${aEs(item)} cambió de ${money(old)} a ${money(next)}. ¿Cuál es el porcentaje de ${dir === "increase" ? "aumento" : "disminución"}? (Escribe solo el número.)`,
    ),
    scene: fixedLine([{ label: T("Old price", "Precio anterior"), cents: old }, { label: T("New price", "Precio nuevo"), cents: next }]),
    fields: [F("answer", "%", `Percent ${dir} (%)`, `Porcentaje de ${dir === "increase" ? "aumento" : "disminución"} (%)`)],
    expect: { answer: pct },
    wrongs: [wr("wrong-base", "answer", frac(diff * 100, next)), wr("difference-only", "answer", usd(diff)), wr("percent-as-decimal", "answer", frac(pct.n, pct.d * 100))],
    params: { old, next, dir },
  });
}

export function simpleInterest(level, rng) {
  const principal = 100 * int(rng, 1, 20);
  const r = int(rng, 2, 10);
  const months = level === 3 ? pick(rng, [6, 9, 18, 30]) : 12 * int(rng, level === 1 ? 1 : 2, level === 1 ? 4 : 5);
  const interest = (principal * r * months) / 12;
  const ask = level === 2 ? "balance" : "interest";
  const timeEn = months % 12 === 0 ? `${months / 12} year${months === 12 ? "" : "s"}` : `${months} months`;
  const timeEs = months % 12 === 0 ? `${months / 12} ${months === 12 ? "año" : "años"}` : `${months} meses`;
  const wrongs = [wr("forgot-time", "answer", usd(principal * r)), wr(ask === "balance" ? "interest-not-balance" : "balance-not-interest", "answer", usd(ask === "balance" ? interest : principal * 100 + interest))];
  if (level === 3) wrongs.push(wr("months-as-years", "answer", usd(principal * r * months)));
  return enter("simple-interest", level, {
    prompt: T(
      `You put ${money(principal * 100)} in an account that earns ${r}% simple interest per year. ${ask === "balance" ? `What is the balance after ${timeEn}?` : `How much interest do you earn in ${timeEn}?`}`,
      `Pones ${money(principal * 100)} en una cuenta que gana ${r}% de interés simple al año. ${ask === "balance" ? `¿Cuál es el saldo después de ${timeEs}?` : `¿Cuánto interés ganas en ${timeEs}?`}`,
    ),
    scene: fixedLine([{ label: T("Deposit", "Depósito"), cents: principal * 100 }, { label: T("Rate per year", "Tasa por año"), text: `${r}%` }, { label: T("Time", "Tiempo"), text: { en: timeEn, es: timeEs } }]),
    fields: [F("answer", "$", ask === "balance" ? "Balance ($)" : "Interest ($)", ask === "balance" ? "Saldo ($)" : "Interés ($)")],
    expect: { answer: usd(ask === "balance" ? principal * 100 + interest : interest) },
    wrongs,
    params: { principal: principal * 100, r, months, ask },
  });
}

const planCard = (name, fee, rateC) => ({ name, fee, rate: rateC });

function planPair(level, rng, integerBreak) {
  for (;;) {
    let fa;
    let fb;
    let ca;
    let cb;
    if (level === 1) {
      ca = 100 * int(rng, 3, 6);
      cb = ca - 100 * int(rng, 1, 2);
      fa = 0;
      fb = 100 * int(rng, 4, 12);
    } else {
      ca = 25 * int(rng, level === 2 ? 6 : 8, 24);
      cb = ca - 25 * int(rng, 2, 8);
      fa = 100 * int(rng, 0, 5);
      fb = fa + 100 * int(rng, 5, 20);
    }
    if (cb < 25) continue;
    if (integerBreak) {
      const n = int(rng, ...lv(level, [3, 12], [5, 30], [10, 60]));
      fb = fa + n * (ca - cb);
      if (fb - fa > 6000) continue;
    }
    return { fa, fb, ca, cb };
  }
}

export function comparePlans(level, rng) {
  const club = pick(rng, VISITS);
  for (;;) {
    const { fa, fb, ca, cb } = planPair(level, rng, false);
    const breakEven = (fb - fa) / (ca - cb);
    const n = level === 3 ? Math.round(breakEven) + pick(rng, [-3, -2, -1, 1, 2, 3]) : int(rng, ...lv(level, [3, 10], [8, 20], [20, 40]));
    const costs = [fa + ca * n, fb + cb * n];
    if (n < 3 || costs[0] === costs[1]) continue;
    const swap = rng() < 0.5;
    const plans = swap ? [planCard("A", fb, cb), planCard("B", fa, ca)] : [planCard("A", fa, ca), planCard("B", fb, cb)];
    const totals = plans.map((p) => p.fee + p.rate * n);
    const best = totals[0] < totals[1] ? 0 : 1;
    const wrong = plans[1 - best];
    const other = plans[best];
    const unitEn = (count) => (count === 1 ? club.unit.en : club.unit.enPl);
    const unitEs = (count) => (count === 1 ? club.unit.es : club.unit.esPl);
    return {
      skillId: "compare-plans",
      level,
      kind: "pickEnter",
      prompt: T(
        `${club.en} has two plans. Think about ${n} ${unitEn(n)}. Which plan costs less for that many? Tap it, then type each plan's total cost.`,
        `${club.es} tiene dos planes. Piensa en ${n} ${unitEs(n)}. ¿Qué plan cuesta menos para esa cantidad? Tócalo y escribe el costo total de cada plan.`,
      ),
      scene: { type: "plans", plans: plans.map((p) => ({ ...p, label: T(`Plan ${p.name}`, `Plan ${p.name}`) })), unit: club.unit },
      fields: [F("a", "$", "Total cost, Plan A ($)", "Costo total, Plan A ($)"), F("b", "$", "Total cost, Plan B ($)", "Costo total, Plan B ($)")],
      expect: { a: usd(totals[0]), b: usd(totals[1]) },
      wrongs: [
        { mistake: "forgot-fee", values: { a: usd(plans[0].rate * n), b: usd(plans[1].rate * n) } },
        { mistake: "fee-times-n", values: { a: usd(n * (plans[0].fee + plans[0].rate)), b: usd(n * (plans[1].fee + plans[1].rate)) } },
        { mistake: "swapped", values: { a: usd(totals[1]), b: usd(totals[0]) } },
      ],
      answer: best,
      pickMistake: wrong.fee < other.fee ? "lower-fee" : "lower-rate",
      params: { plans, n },
    };
  }
}

export function breakEven(level, rng) {
  const club = pick(rng, VISITS);
  const { fa, fb, ca, cb } = planPair(level, rng, true);
  const n = (fb - fa) / (ca - cb);
  const cost = fa + ca * n;
  const swap = rng() < 0.5;
  const plans = swap ? [planCard("A", fb, cb), planCard("B", fa, ca)] : [planCard("A", fa, ca), planCard("B", fb, cb)];
  const fields = [F("n", "#", `Number of ${club.unit.enPl}`, `Cantidad de ${club.unit.esPl}`)];
  const expect = { n: frac(n) };
  if (level === 3) {
    fields.push(F("cost", "$", "Cost at that point ($)", "Costo en ese punto ($)"));
    expect.cost = usd(cost);
  }
  const wrongs = [{ mistake: "added-rates", values: { n: frac(fb - fa, ca + cb) } }];
  if (fa > 0) wrongs.push({ mistake: "used-one-fee", values: { n: frac(fb, ca - cb) } });
  return enter("break-even", level, {
    prompt: T(
      `${club.en} has two plans. After how many ${club.unit.enPl} do the two plans cost exactly the same?${level === 3 ? " Also give that cost." : ""}`,
      `${club.es} tiene dos planes. ¿Después de cuántas ${club.unit.esPl} los dos planes cuestan exactamente lo mismo?${level === 3 ? " Escribe también ese costo." : ""}`,
    ),
    scene: { type: "plans", plans: plans.map((p) => ({ ...p, label: T(`Plan ${p.name}`, `Plan ${p.name}`) })), unit: club.unit },
    fields,
    expect,
    wrongs,
    params: { plans, level3: level === 3 },
  });
}

export function slopeUnitCost(level, rng) {
  const club = pick(rng, VISITS);
  const fee = level === 1 ? 0 : 100 * int(rng, 2, 10);
  const r = level === 1 ? 25 * int(rng, 4, 32) : 25 * int(rng, 4, 24);
  const ns = [...sample(rng, [1, 2, 3, 4, 5, 6, 8, 10, 12], 3)].sort((a, b) => a - b);
  const rows = ns.map((n) => [n, fee + r * n]);
  const [n1, c1] = rows[0];
  const [n2, c2] = rows[1];
  const wrongs = [];
  if (fee) wrongs.push(wr("first-row-ratio", "rate", frac(c1, 100 * n1)));
  if (n2 - n1 > 1) wrongs.push(wr("cost-difference", "rate", usd(c2 - c1)));
  const fields = [F("rate", "$", `Cost per ${club.unit.en} ($)`, `Costo por ${club.unit.es} ($)`)];
  const expect = { rate: usd(r) };
  if (level === 3) {
    fields.push(F("fee", "$", "Fixed fee ($)", "Cuota fija ($)"));
    expect.fee = usd(fee);
  }
  return enter("slope-unit-cost", level, {
    prompt: T(
      `The table shows the total ${club.en} charges for different numbers of ${club.unit.enPl}. ${level === 3 ? "Find the cost per " + club.unit.en + " and the fixed fee." : `Find the cost of each extra ${club.unit.en}.`}`,
      `La tabla muestra el total que cobra ${club.es} por distintas cantidades de ${club.unit.esPl}. ${level === 3 ? `Halla el costo por ${club.unit.es} y la cuota fija.` : `Halla el costo de cada ${club.unit.es} adicional.`}`,
    ),
    scene: { type: "table", head: [T(cap(club.unit.enPl), cap(club.unit.esPl)), T("Total cost", "Costo total")], rows },
    fields,
    expect,
    wrongs,
    params: { rows, fee, r, both: level === 3 },
  });
}
