// Round generators, kindergarten to grade 4: counting money, comparing prices, paying, making change, budgets.
// Pure functions of (level, rng, grade); all money is whole cents. @fm2 FM-050 FM-051 FM-060 FM-061
import { frac } from "../../rational.js";
import { int, pick, sample, shuffle } from "../../rng.js";
import { both, enter, F, lv, T, usd, wr } from "./build.js";
import { aEn, aEs, each, ITEMS, itemFor, named, PENNY_ITEMS, priceIn, SHOPPERS, SMALL } from "./items.js";
import { COINS, DENOMS, fewestPieces, money, roundTo, sum } from "./money.js";


const HOLDERS = [T("a jar", "un frasco"), T("a pocket", "un bolsillo"), T("a piggy bank", "una alcancía")];
// "Maya found these coins in a jar." / "Maya encontró estas monedas en un frasco." (varies the story, not the math)
function found(rng, what) {
  const who = pick(rng, SHOPPERS);
  const holder = pick(rng, HOLDERS);
  return T(`${who} found ${what.en} in ${holder.en}.`, `${who} encontró ${what.es} en ${holder.es}.`);
}

export function pennyCount(level, rng) {
  const n = int(rng, ...lv(level, [2, 5], [4, 10], [8, 20]));
  return enter("penny-count", level, {
    prompt: both(found(rng, T("these pennies", "estos centavos")), T("How many cents are they worth?", "¿Cuántos centavos valen en total?")),
    scene: { type: "coins", coins: Array(n).fill(1) },
    fields: [F("total", "c", "Total in cents", "Total en centavos")],
    expect: { total: frac(n) },
    wrongs: [wr("off-by-one", "total", frac(n + 1)), wr("off-by-one", "total", frac(n - 1))],
    params: { n },
  });
}

export function costsMore(level, rng, grade) {
  const [lo, hi, dmin, dmax] =
    grade === 0 ? lv(level, [1, 5, 2, 4], [1, 10, 2, 9], [1, 10, 1, 1]) : lv(level, [5, 20, 3, 15], [10, 50, 5, 40], [20, 99, 1, 4]);
  let a;
  let b;
  do {
    a = int(rng, lo, hi);
    b = int(rng, lo, hi);
  } while (Math.abs(a - b) < dmin || Math.abs(a - b) > dmax);
  const ask = (grade === 0 && level < 3) || (grade === 1 && level === 1) ? "more" : pick(rng, ["more", "less"]);
  const x = itemFor(rng, a, grade === 0 ? PENNY_ITEMS : SMALL);
  const y = itemFor(rng, b, grade === 0 ? PENNY_ITEMS : SMALL, [x]);
  return {
    skillId: "costs-more",
    level,
    kind: "pick",
    prompt: ask === "more" ? T("Which one costs more? Tap it.", "¿Cuál cuesta más? Tócalo.") : T("Which one costs less? Tap it.", "¿Cuál cuesta menos? Tócalo."),
    scene: { type: "tags", cents: true, pennies: grade === 0, tags: [{ name: named(x), cents: a }, { name: named(y), cents: b }] },
    answer: ask === "more" ? (a > b ? 0 : 1) : a < b ? 0 : 1,
    pickMistake: "picked-other",
    params: { ask, cents: [a, b] },
  };
}

function coinSetRound(skillId, level, coins, params, wrongs, fields, prompt) {
  const total = sum(coins);
  return enter(skillId, level, {
    prompt,
    scene: { type: "coins", coins },
    fields,
    expect: { total: fields[0].unit === "c" ? frac(total) : usd(total) },
    wrongs,
    params: { ...params, coins },
  });
}

export function countPnd(level, rng) {
  for (;;) {
    const d = int(rng, 1, lv(level, 4, 4, 6));
    const n = lv(level, 0, int(rng, 1, 3), int(rng, 1, 4));
    const p = int(rng, 1, 9);
    const total = d * 10 + n * 5 + p;
    if (total > lv(level, 60, 100, 100) || total < lv(level, 15, 25, 40) || DENOMS.includes(total)) continue;
    const coins = [...Array(d).fill(10), ...Array(n).fill(5), ...Array(p).fill(1)];
    const wrongs = [wr("counted-coins", "total", frac(d + n + p))];
    if (n) wrongs.push(wr("nickels-as-dimes", "total", frac(total + 5 * n)), wr("nickels-as-pennies", "total", frac(total - 4 * n)));
    return coinSetRound("count-pnd", level, level === 3 ? shuffle(rng, coins) : coins, { d, n, p }, wrongs, [F("total", "c", "Total in cents", "Total en centavos")],
      both(found(rng, T("these coins", "estas monedas")), T("How many cents are they worth?", "¿Cuántos centavos valen en total?")));
  }
}

export function dollarsCents(level, rng) {
  for (;;) {
    const ones = lv(level, 0, int(rng, 1, 3), int(rng, 1, 4));
    const fives = lv(level, 0, 0, int(rng, 1, 2));
    const q = int(rng, 0, 3);
    const d = int(rng, 0, 3);
    const n = int(rng, 0, 3);
    const p = int(rng, 0, 6);
    const coinsTotal = q * 25 + d * 10 + n * 5 + p;
    const total = fives * 500 + ones * 100 + coinsTotal;
    const pieces = fives + ones + q + d + n + p;
    if (pieces < lv(level, 4, 5, 7) || total > lv(level, 99, 500, 2000) || DENOMS.includes(total) || coinsTotal === 0) continue;
    if ([q, d, n, p].filter(Boolean).length < 2) continue;
    const coins = [...Array(fives).fill(500), ...Array(ones).fill(100), ...Array(q).fill(25), ...Array(d).fill(10), ...Array(n).fill(5), ...Array(p).fill(1)];
    const wrongs = [wr("count-pieces", "total", frac(pieces))];
    if (fives + ones) wrongs.push(wr("forgot-bills", "total", usd(coinsTotal)));
    return coinSetRound("dollars-cents", level, coins, { fives, ones, q, d, n, p }, wrongs, [F("total", "$", "Total (dollars and cents)", "Total (dólares y centavos)")],
      both(found(rng, T("this money", "este dinero")), T("How much is it worth? Type the total with dollars and cents.", "¿Cuánto vale? Escribe el total en dólares y centavos.")));
  }
}

const receipt = (...lines) => ({ type: "receipt", lines });

export function makeChange(level, rng, grade) {
  let price;
  let paid = 100;
  let pool = COINS;
  if (grade >= 3) {
    paid = pick(rng, [500, 1000, 2000]);
    const top = paid - 100;
    price = lv(level, 100 * int(rng, 1, top / 100), 25 * int(rng, 4, top / 25), int(rng, 101, top));
    pool = [...COINS, 100, 500, 1000];
  } else price = lv(level, 10 * int(rng, 1, 9), 5 * int(rng, 1, 19), int(rng, 1, 99));
  const who = pick(rng, SHOPPERS);
  const item = itemFor(rng, price, grade >= 3 ? SMALL : [...PENNY_ITEMS, ...SMALL]);
  const bill = paid === 100 ? "$1" : `$${paid / 100}`;
  return {
    skillId: "make-change",
    level,
    kind: "tray",
    mode: "change",
    prompt: T(
      `${who} buys ${aEn(item)} for ${money(price)} and pays with a ${bill} bill. Build the change to give back.`,
      `${who} compra ${aEs(item)} por ${money(price)} y paga con un billete de ${bill}. Arma el cambio que hay que devolver.`,
    ),
    scene: receipt({ label: T("Price", "Precio"), cents: price }, { label: T("Paid", "Pagó"), cents: paid }),
    target: paid - price,
    pool,
    fewest: false,
    trayWrongs: { "gave-paid": paid, "gave-price": price },
    params: { price, paid },
  };
}

export function exactPay(level, rng) {
  const pool = lv(level, COINS, [...COINS, 100], [...COINS, 100, 500, 1000]);
  let target;
  do target = lv(level, 5 * int(rng, 4, 19), int(rng, 106, 499), int(rng, 501, 1999));
  while (DENOMS.includes(target));
  const who = pick(rng, SHOPPERS);
  const item = itemFor(rng, target, [...PENNY_ITEMS, ...ITEMS]);
  return {
    skillId: "exact-pay",
    level,
    kind: "tray",
    mode: "pay",
    prompt: T(
      `${who} buys ${aEn(item)}. The register says ${money(target)}. Pay exactly that amount using the fewest coins and bills.`,
      `${who} compra ${aEs(item)}. La caja dice ${money(target)}. Paga exactamente esa cantidad con la menor cantidad de monedas y billetes.`,
    ),
    scene: receipt({ label: T("Total due", "Total a pagar"), cents: target }),
    target,
    pool,
    fewest: true,
    min: fewestPieces(target, pool).length,
    trayWrongs: {},
    params: { target, pool },
  };
}

export function roundPrices(level, rng) {
  const place = level === 3 ? 100 : 10;
  const count = level === 1 ? 1 : 2;
  const prices = [];
  while (prices.length < count) {
    const price = level === 3 ? int(rng, 101, 499) : int(rng, 11, 99);
    if (price % place) prices.push(price);
  }
  const rounded = prices.map((price) => roundTo(price, place));
  const wrongs = [
    wr("truncated", "total", frac(sum(prices.map((price) => price - (price % place))))),
    wr("not-rounded", "total", frac(sum(prices))),
  ];
  if (place === 100) wrongs.push(wr("rounded-wrong-place", "total", frac(sum(prices.map((price) => roundTo(price, 10))))));
  const items = [];
  for (const price of prices) items.push(itemFor(rng, price * 100, ITEMS, items));
  const word = place === 10 ? T("ten dollars", "diez dólares") : T("hundred dollars", "cien dólares");
  const near = place === 10 ? T("nearest $10", "múltiplo de $10 más cercano") : T("nearest $100", "múltiplo de $100 más cercano");
  return enter("round-prices", level, {
    prompt: T(
      `Round ${count === 1 ? "the price" : "each price"} to the ${near.en} (5 or more rounds up)${count === 1 ? "." : ", then add to estimate the total."} Type the ${count === 1 ? "rounded price" : "estimate"}.`,
      `Redondea ${count === 1 ? "el precio" : "cada precio"} al ${near.es} (5 o más sube)${count === 1 ? "." : " y suma para estimar el total."} Escribe ${count === 1 ? "el precio redondeado" : "la estimación"}.`,
    ),
    scene: { type: "tags", tags: items.map((item, i) => ({ name: named(item), cents: prices[i] * 100 })) },
    fields: [F("total", "$", count === 1 ? "Rounded price ($)" : "Estimate ($)", count === 1 ? "Precio redondeado ($)" : "Estimación ($)")],
    expect: { total: frac(sum(rounded)) },
    wrongs,
    params: { prices, place, word: word.en },
  });
}

export function fillBudget(level, rng, grade) {
  const step = grade === 3 ? 100 : level === 3 ? 5 : 50;
  const count = lv(level, 4, 6, 8);
  const pool = ITEMS.filter((item) => (grade === 3 ? item.hi >= 200 && item.hi <= 1500 : item.lo >= 20 && item.hi <= 1500));
  for (;;) {
    const names = sample(rng, pool, count);
    const prices = names.map((item) => priceIn(rng, item, step, Math.max(item.lo, step), Math.min(item.hi, grade === 3 ? 900 : 1000)));
    const chosen = sample(rng, [...prices.keys()], int(rng, ...lv(level, [2, 3], [3, 3], [3, 4])));
    const total = sum(chosen.map((i) => prices[i]));
    const unit = step === 5 ? 50 : step;
    const b = Math.ceil((total + int(rng, 0, lv(level, 300, 200, 100))) / unit) * unit;
    if (b > (grade === 3 ? 2000 : 5000) || prices.some((p) => p > b)) continue;
    const width = lv(level, Math.floor(b * 0.4), Math.floor(b * 0.25), Math.max(step, Math.floor(b * 0.1)));
    const min = Math.min(Math.floor((b - width) / unit) * unit, total);
    return {
      skillId: "fill-budget",
      level,
      kind: "cart",
      prompt: T(
        `You have ${money(b)} to spend. Fill your cart so the total is at most ${money(b)} and at least ${money(min)}.`,
        `Tienes ${money(b)} para gastar. Llena tu carrito para que el total sea como máximo ${money(b)} y como mínimo ${money(min)}.`,
      ),
      scene: { type: "tags", tags: names.map((item, i) => ({ name: named(item), cents: prices[i] })) },
      budget: b,
      min,
      params: { prices, budget: b, min },
    };
  }
}

export function multiStepMoney(level, rng) {
  for (;;) {
    const [x, y] = sample(rng, SMALL.filter((item) => item.hi <= 700), 2);
    const who = pick(rng, SHOPPERS);
    const a = int(rng, 2, 6);
    const p = priceIn(rng, x, 5);
    const b = level === 1 ? 0 : int(rng, 2, 5);
    const q = priceIn(rng, y, 5);
    const coupon = level === 3 ? 25 * int(rng, 1, 12) : 0;
    const gross = a * p + b * q;
    const net = gross - coupon;
    if (net <= 0 || gross >= 2000) continue;
    const paid = [500, 1000, 2000].find((bill) => bill > net);
    const lines = [{ item: x, qty: a, cents: p }];
    if (b) lines.push({ item: y, qty: b, cents: q });
    const buyEn = lines.map((l) => `${l.qty} ${named(l.item, l.qty).en} at ${money(l.cents)} each`).join(" and ");
    const buyEs = lines.map((l) => `${l.qty} ${named(l.item, l.qty).es} a ${money(l.cents)} ${each(l.item)}`).join(" y ");
    const ask = level === 1 ? "total" : "change";
    const unitsOnce = lines.reduce((s, l) => s + l.cents, 0);
    const wrongs =
      ask === "total"
        ? [wr("forgot-multiply", "answer", usd(p))]
        : [wr("forgot-multiply", "answer", usd(paid - (unitsOnce - coupon))), wr("gave-total", "answer", usd(net))];
    if (coupon) wrongs.push(wr("added-coupon", "answer", usd(paid - gross - coupon)));
    const couponEn = coupon ? ` A coupon takes ${money(coupon)} off the total.` : "";
    const couponEs = coupon ? ` Un cupón le quita ${money(coupon)} al total.` : "";
    return enter("multi-step-money", level, {
      prompt: T(
        `${who} buys ${buyEn}.${couponEn}${ask === "total" ? " What is the total cost?" : ` ${who} pays with a $${paid / 100} bill. How much change does ${who} get?`}`,
        `${who} compra ${buyEs}.${couponEs}${ask === "total" ? " ¿Cuál es el costo total?" : ` ${who} paga con un billete de $${paid / 100}. ¿Cuánto cambio recibe?`}`,
      ),
      scene: { type: "tags", tags: lines.map((l) => ({ name: named(l.item, l.qty), cents: l.cents, qty: l.qty, each: true })) },
      fields: [ask === "total" ? F("answer", "$", "Total cost ($)", "Costo total ($)") : F("answer", "$", "Change ($)", "Cambio ($)")],
      expect: { answer: usd(ask === "total" ? net : paid - net) },
      wrongs,
      params: { lines: lines.map((l) => [l.qty, l.cents]), coupon, paid: ask === "total" ? 0 : paid, ask },
    });
  }
}
