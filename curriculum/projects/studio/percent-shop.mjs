/**
 * Pop-up shop / checkout simulator for the percent missions (Pop-Up Shop Owner, Smart Shopper Showdown).
 * Pure; no DOM. All money is exact (BigInt fractions from exact.mjs), so a receipt never drifts by a cent.
 *
 * The register follows the mission's own model (math.mjs case "percent"):
 *   discount = gross × p / 100 (not rounded), sale = gross − discount,
 *   tax = sale × c / 100 rounded half up to cents, total = (sale + tax) rounded half up to cents,
 *   change = budget − total (negative means over budget).
 * The mission price tag (design `a`) is always on the shelf as item "tag"; the student stocks up to six
 * more fictional items with their own prices and rings up to three customer baskets.
 *
 * Hidden-answer rule: a receipt amount that equals one of the mission's unchecked answers (discount, sale,
 * tax, total, budget) is masked by the view (`guardKeys` names which). The decimal form of the discount
 * is never printed here at all.
 */
import { add, cmp, eq, frac, mul, num, parse, sub } from "./exact.mjs";

export const MAX_SHELF = 6;
export const MAX_BASKETS = 3;
export const MAX_QTY = 20;
const ZERO = frac(0n);
const HUNDRED = frac(100n);

export const ITEMS = {
  stickers: { en: "Sticker sheet", es: "Hoja de calcomanías", price: "3.50" },
  pins: { en: "Button pin", es: "Botón decorativo", price: "2.25" },
  notebook: { en: "Mini notebook", es: "Libreta mini", price: "4.75" },
  bookmark: { en: "Bookmark", es: "Separador de libros", price: "1.20" },
  pencils: { en: "Pencil pack", es: "Paquete de lápices", price: "2.80" },
  cards: { en: "Greeting card", es: "Tarjeta de saludo", price: "3.00" },
  keychain: { en: "Keychain", es: "Llavero", price: "5.50" },
  tote: { en: "Tote bag", es: "Bolsa de tela", price: "12.00" },
};
export const ITEM_TYPES = Object.keys(ITEMS);
export const TAG = { en: "Mission price tag", es: "Artículo de la misión" };

const empty = () => ({
  shelf: [],
  baskets: [{ id: "b1", qty: { tag: 1 } }],
  active: "b1",
  sel: "tag",
  coupon: { kind: "dollars", amount: "10" },
});
const clip = (s, n) => String(s ?? "").slice(0, n);

/** Validate stored shop data. Never throws; garbage becomes the starting shop. */
export function cleanShop(raw) {
  const out = empty();
  if (!raw || typeof raw !== "object") return out;
  const ids = new Set(["tag"]);
  if (Array.isArray(raw.shelf))
    for (const it of raw.shelf.slice(0, MAX_SHELF)) {
      if (!it || !ITEM_TYPES.includes(it.type) || typeof it.id !== "string" || !/^s\d{1,2}$/.test(it.id)) continue;
      if (ids.has(it.id)) continue;
      ids.add(it.id);
      out.shelf.push({ id: it.id, type: it.type, price: clip(it.price, 8) });
    }
  if (Array.isArray(raw.baskets)) {
    const baskets = [];
    for (const b of raw.baskets.slice(0, MAX_BASKETS)) {
      if (!b || typeof b.id !== "string" || !/^b\d$/.test(b.id) || baskets.some((x) => x.id === b.id)) continue;
      const qty = {};
      for (const [k, v] of Object.entries(b.qty || {}))
        if (ids.has(k) && Number.isInteger(v) && v > 0 && v <= MAX_QTY) qty[k] = v;
      baskets.push({ id: b.id, qty });
    }
    if (baskets.length) out.baskets = baskets;
  }
  out.active = out.baskets.some((b) => b.id === raw.active) ? raw.active : out.baskets[0].id;
  out.sel = ids.has(raw.sel) ? raw.sel : "tag";
  if (raw.coupon && typeof raw.coupon === "object")
    out.coupon = { kind: raw.coupon.kind === "percent" ? "percent" : "dollars", amount: clip(raw.coupon.amount, 8) };
  return out;
}

/** A shelf price: whole cents from $0.25 to $200. Returns an exact value or null. */
export function parsePrice(text) {
  const p = parse(String(text ?? "").replace(/^\$/, ""));
  if (!p || !eq(mul(p, HUNDRED), frac(mul(p, HUNDRED).n / mul(p, HUNDRED).d))) return null;
  if (cmp(p, frac(1n, 4n)) < 0 || cmp(p, frac(200n)) > 0) return null;
  return p;
}
/** A coupon: dollars off (whole cents, $0.25–$200) or percent off (whole number 1–90). */
export function parseCoupon(coupon) {
  if (coupon.kind === "percent") {
    const p = parse(coupon.amount);
    return p && p.d === 1n && p.n >= 1n && p.n <= 90n ? { kind: "percent", value: p } : null;
  }
  const v = parsePrice(coupon.amount);
  return v ? { kind: "dollars", value: v } : null;
}

/** The mission numbers, exact: price a, discount b (%), tax c (%), budget d. Null when the design is invalid. */
export function shopOf(values) {
  if (!values) return null;
  const out = {};
  for (const k of ["a", "b", "c", "d"]) {
    if (typeof values[k] !== "number" || !Number.isFinite(values[k])) return null;
    out[k] = num(String(values[k]));
    if (!out[k]) return null;
  }
  return out;
}

/** Round a nonnegative exact amount half up to whole cents (6.165 → 6.17, like math.mjs toCents). */
export function roundCents(x) {
  const cents = (x.n * 200n + x.d) / (2n * x.d);
  return frac(cents, 100n);
}

export const priceOf = (shop, id, m) => {
  if (id === "tag") return m.a;
  const it = shop.shelf.find((x) => x.id === id);
  return it ? parsePrice(it.price) : null;
};
export const nameOf = (shop, id, lang = "en") => {
  const l = lang === "es" ? "es" : "en";
  if (id === "tag") return TAG[l];
  const it = shop.shelf.find((x) => x.id === id);
  return it ? ITEMS[it.type][l] : "";
};

/** Ring up totals for a gross amount under an offer ({kind:"percent"|"dollars", value}). */
export function ring(gross, offer, m) {
  let discount;
  if (offer.kind === "percent") discount = mul(gross, frac(offer.value.n, offer.value.d * 100n));
  else discount = cmp(offer.value, gross) > 0 ? gross : offer.value;
  const sale = sub(gross, discount);
  const tax = roundCents(mul(sale, frac(m.c.n, m.c.d * 100n)));
  const total = roundCents(add(sale, tax));
  const change = sub(m.d, total);
  return { gross, discount, sale, tax, total, change, within: cmp(total, m.d) <= 0 };
}

/** Itemized receipt for one basket. Lines with an invalid shelf price are listed in `invalid` and skipped. */
export function receipt(shop, basketId, offer, m) {
  const basket = shop.baskets.find((b) => b.id === basketId);
  const lines = [];
  const invalid = [];
  let gross = ZERO;
  for (const id of ["tag", ...shop.shelf.map((s) => s.id)]) {
    const q = basket?.qty[id] || 0;
    if (!q) continue;
    const unit = priceOf(shop, id, m);
    if (!unit) {
      invalid.push(id);
      continue;
    }
    const amount = mul(unit, frac(BigInt(q)));
    gross = add(gross, amount);
    lines.push({ id, qty: q, unit, amount });
  }
  return { lines, invalid, count: lines.reduce((s, l) => s + l.qty, 0), ...ring(gross, offer, m) };
}

export const missionOffer = (m) => ({ kind: "percent", value: m.b });

/** The mission's six answers, exact (the same formulas as math.mjs). */
export function answersOf(m) {
  const r = ring(m.a, missionOffer(m), m);
  return { decimal: frac(m.b.n, m.b.d * 100n), discount: r.discount, sale: r.sale, tax: r.tax, total: r.total, budget: r.change };
}
/** Receipt field → the question id whose answer it could print. */
export const GUARDS = { discount: "discount", sale: "sale", tax: "tax", total: "total", change: "budget" };
/** Which receipt fields equal an answer (and so must stay hidden until that answer is checked). */
export function guardKeys(r, m) {
  const ans = answersOf(m);
  return Object.entries(GUARDS)
    .filter(([field, id]) => eq(r[field], ans[id]))
    .map(([field]) => field);
}

/** Exact money text: cents when whole cents, otherwise every exact decimal digit (e.g. $14.9975). */
export function money(raw) {
  const x = frac(raw.n, raw.d);
  const neg = x.n < 0n;
  const n = neg ? -x.n : x.n;
  let out;
  if ((n * 100n) % x.d === 0n) {
    const cents = (n * 100n) / x.d;
    out = `$${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
  } else {
    let d = x.d, twos = 0, fives = 0;
    while (d % 2n === 0n) [d, twos] = [d / 2n, twos + 1];
    while (d % 5n === 0n) [d, fives] = [d / 5n, fives + 1];
    const places = Math.max(twos, fives);
    if (d !== 1n) out = `$${n}/${x.d}`;
    else {
      const scaled = (n * 10n ** BigInt(places)) / x.d;
      const s = scaled.toString().padStart(places + 1, "0");
      out = `$${s.slice(0, -places)}.${s.slice(-places)}`;
    }
  }
  return neg ? `−${out}` : out;
}

/* ------------------------------------------------------------------ edits (pure) */
const nextId = (list, prefix) => `${prefix}${list.reduce((top, x) => Math.max(top, Number(x.id.slice(1))), 0) + 1}`;
export function stock(shop, type) {
  if (!ITEM_TYPES.includes(type)) return { error: "unknown" };
  if (shop.shelf.length >= MAX_SHELF) return { error: "full" };
  const id = nextId(shop.shelf, "s");
  return { shop: { ...shop, shelf: [...shop.shelf, { id, type, price: ITEMS[type].price }], sel: id }, id };
}
export function unstock(shop, id) {
  if (id === "tag") return shop;
  const baskets = shop.baskets.map((b) => {
    const qty = { ...b.qty };
    delete qty[id];
    return { ...b, qty };
  });
  return { ...shop, shelf: shop.shelf.filter((s) => s.id !== id), baskets, sel: shop.sel === id ? "tag" : shop.sel };
}
export const setPrice = (shop, id, price) => ({ ...shop, shelf: shop.shelf.map((s) => (s.id === id ? { ...s, price: clip(price, 8) } : s)) });
/** Step a shelf price by ±$0.25, staying in $0.25–$200. */
export function stepPrice(shop, id, dir) {
  const it = shop.shelf.find((s) => s.id === id);
  const p = it && parsePrice(it.price);
  const base = p || parsePrice(ITEMS[it?.type]?.price || "1");
  let next = add(base, frac(BigInt(dir), 4n));
  if (cmp(next, frac(1n, 4n)) < 0) next = frac(1n, 4n);
  if (cmp(next, frac(200n)) > 0) next = frac(200n);
  return setPrice(shop, id, money(next).slice(1));
}
export function setQty(shop, basketId, id, q) {
  const qty = Math.max(0, Math.min(MAX_QTY, Math.round(q)));
  return {
    ...shop,
    baskets: shop.baskets.map((b) => {
      if (b.id !== basketId) return b;
      const next = { ...b.qty };
      if (qty) next[id] = qty;
      else delete next[id];
      return { ...b, qty: next };
    }),
  };
}
export function addBasket(shop) {
  if (shop.baskets.length >= MAX_BASKETS) return { error: "full" };
  const id = nextId(shop.baskets, "b");
  return { shop: { ...shop, baskets: [...shop.baskets, { id, qty: {} }], active: id }, id };
}
export function removeBasket(shop, id) {
  if (shop.baskets.length <= 1) return shop;
  const baskets = shop.baskets.filter((b) => b.id !== id);
  return { ...shop, baskets, active: shop.active === id ? baskets[0].id : shop.active };
}

/** Live constraint verdicts: every shelf price valid, every basket within the customer budget. */
export function evaluateShop(shop, m) {
  const offer = missionOffer(m);
  const badPrices = shop.shelf.filter((s) => !parsePrice(s.price)).map((s) => s.id);
  const baskets = shop.baskets.map((b) => {
    const r = receipt(shop, b.id, offer, m);
    return { id: b.id, empty: !r.count, within: r.within, receipt: r };
  });
  const rung = baskets.filter((b) => !b.empty);
  return { pricesOk: !badPrices.length, badPrices, baskets, rung: rung.length, allWithin: rung.length > 0 && rung.every((b) => b.within) };
}

/** Compare the mission offer with the student's coupon on one basket (Smart Shopper). */
export function compareOffers(shop, basketId, m) {
  const coupon = parseCoupon(shop.coupon);
  const a = receipt(shop, basketId, missionOffer(m), m);
  if (!coupon) return { a, b: null, coupon: null };
  const b = receipt(shop, basketId, coupon, m);
  const c = cmp(a.total, b.total);
  return { a, b, coupon, better: c < 0 ? "A" : c > 0 ? "B" : "tie", gap: c < 0 ? sub(b.total, a.total) : sub(a.total, b.total) };
}

/** Plain-text report lines. Amounts equal to a mission answer are withheld (the Test stage owns them). */
export function shopReport(shop, values, fmt = String) {
  const m = shopOf(values);
  if (!m) return [];
  const guarded = (r, field) => (guardKeys(r, m).includes(field) ? "(see your Test answer)" : money(r[field]));
  const out = ["POP-UP SHOP", `Offer: ${fmt(values.b)}% off · simulated tax ${fmt(values.c)}% on the sale price · customer budget ${money(m.d)}`];
  out.push(`Shelf: ${TAG.en} ${money(m.a)}${shop.shelf.map((s) => `; ${ITEMS[s.type].en} ${parsePrice(s.price) ? money(parsePrice(s.price)) : "(price not valid)"}`).join("")}`);
  shop.baskets.forEach((b, i) => {
    const r = receipt(shop, b.id, missionOffer(m), m);
    if (!r.count) return;
    out.push(`Customer ${i + 1}: ${r.lines.map((l) => `${l.qty} × ${nameOf(shop, l.id)} @ ${money(l.unit)}`).join(", ")}`);
    out.push(`  Subtotal ${money(r.gross)} · discount −${guarded(r, "discount")} · sale price ${guarded(r, "sale")} · tax ${guarded(r, "tax")} · total ${guarded(r, "total")} · change ${guarded(r, "change")} · within budget: ${r.within ? "yes" : "NO"}`);
  });
  const coupon = parseCoupon(shop.coupon);
  if (coupon) out.push(`Comparison offer: ${coupon.kind === "percent" ? `${coupon.value.n}% off` : `${money(coupon.value)} off`}`);
  out.push("");
  return out;
}
