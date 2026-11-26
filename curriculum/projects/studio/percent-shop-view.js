/**
 * Pop-up shop view for the percent missions: stock a shelf, price it, set the discount rule, ring up
 * customer baskets and read an exact itemized receipt. Smart Shopper (unit-4-b) adds a second offer and a
 * side-by-side receipt. A 10 × 10 grid shows the discount as part of the selected item's price.
 * Every amount equal to an unchecked mission answer prints as "?" (see percent-shop.mjs guardKeys).
 * Pure logic lives in percent-shop.mjs.
 */
import { createHistory } from "./history.mjs";
import { esc, f2, INK, MINT, MUTED, ORANGE, PEACH, TEAL } from "./models-kit.mjs";
import {
  GUARDS,
  ITEM_TYPES,
  ITEMS,
  MAX_QTY,
  addBasket,
  answersOf,
  compareOffers,
  evaluateShop,
  guardKeys,
  missionOffer,
  money,
  nameOf,
  parseCoupon,
  priceOf,
  receipt,
  removeBasket,
  setPrice,
  setQty,
  shopOf,
  stepPrice,
  stock,
  unstock,
} from "./percent-shop.mjs";
import { eq, frac, mul, sub } from "./exact.mjs";

const L = {
  title: ["Pop-up shop register", "Caja registradora de la tienda"],
  intro: [
    "Stock the shelf, set prices and the discount rule, then ring up each customer's basket. The register prints an exact receipt and checks the customer budget.",
    "Surte el estante, pon precios y la regla de descuento, y luego cobra la canasta de cada cliente. La caja imprime un recibo exacto y revisa el presupuesto del cliente.",
  ],
  shelf: ["Shelf", "Estante"],
  stock: ["Stock an item", "Agrega un artículo"],
  stockBtn: ["Add to shelf", "Agregar al estante"],
  price: ["Price ($)", "Precio ($)"],
  select: ["Show on grid", "Ver en la cuadrícula"],
  remove: ["Remove", "Quitar"],
  rule: ["Discount rule", "Regla de descuento"],
  off: ["off everything", "de descuento en todo"],
  tax: ["Simulated tax on the sale price", "Impuesto simulado sobre el precio rebajado"],
  budget: ["Customer budget", "Presupuesto del cliente"],
  grid: ["Percent grid", "Cuadrícula de porcentaje"],
  baskets: ["Customer baskets", "Canastas de clientes"],
  customer: ["Customer", "Cliente"],
  addCustomer: ["Add a customer", "Agregar un cliente"],
  removeCustomer: ["Remove this customer", "Quitar este cliente"],
  receipt: ["Receipt", "Recibo"],
  subtotal: ["Subtotal", "Subtotal"],
  discount: ["Discount", "Descuento"],
  sale: ["Sale price", "Precio rebajado"],
  taxLine: ["Tax", "Impuesto"],
  total: ["TOTAL", "TOTAL"],
  change: ["Change from budget", "Cambio del presupuesto"],
  over: ["Over budget by", "Se pasa del presupuesto por"],
  hidden: [
    "? = this amount is one of your mission answers. Check it in Test first.",
    "? = esta cantidad es una de las respuestas de tu misión. Primero compruébala en Probar.",
  ],
  empty: [
    "Add items to this basket to ring it up.",
    "Agrega artículos a esta canasta para cobrarla.",
  ],
  checks: ["Constraint check", "Revisión de condiciones"],
  pricesOk: ["Every shelf price is a valid amount", "Cada precio del estante es válido"],
  within: ["fits the budget", "cabe en el presupuesto"],
  undo: ["Undo shop", "Deshacer tienda"],
  redo: ["Redo shop", "Rehacer tienda"],
  coupon: ["Offer B (the other store)", "Oferta B (la otra tienda)"],
  couponKind: ["Offer type", "Tipo de oferta"],
  dollarsOff: ["Dollars off the basket", "Dólares de descuento"],
  percentOff: ["Percent off the basket", "Porcentaje de descuento"],
  amount: ["Amount", "Cantidad"],
  compare: ["Side-by-side receipts", "Recibos lado a lado"],
  invalidCoupon: [
    "Enter whole cents from $0.25 to $200, or a whole percent from 1 to 90.",
    "Escribe centavos exactos de $0.25 a $200, o un porcentaje entero de 1 a 90.",
  ],
  badPrice: [
    "Use whole cents from $0.25 to $200 (for example 3.50).",
    "Usa centavos exactos de $0.25 a $200 (por ejemplo 3.50).",
  ],
};

export function createPercentShop({
  project,
  fields,
  getState,
  save,
  applyDesign,
  announce,
  values,
  data,
  setData,
}) {
  let host = null;
  const smart = project.id === "unit-4-b";
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (k) => L[k][lang()];
  const lc = () => (lang() ? "es" : "en");
  const shop = () => data();
  const history = createHistory(shop());
  const seen = (id) => getState().role === "teacher" || getState().checked?.[id] === true;
  const field = (k) => fields.find((f) => f.key === k);
  const clampField = (k, v) => Math.min(field(k).max, Math.max(field(k).min, v));

  function commit(next, tag, message) {
    setData(next);
    history.record(next, tag);
    save();
    render();
    if (message) announce(message);
  }

  /* ---------------------------------------------------------------- markup pieces */
  const amount = (r, key, m) =>
    guardKeys(r, m).includes(key) && !seen(GUARDS[key])
      ? '<span class="wb-unknown">?</span>'
      : esc(money(r[key]));

  function receiptMarkup(r, m, label, offerText) {
    if (!r.count) return `<p class="muted">${t("empty")}</p>`;
    const lines = r.lines
      .map(
        (l) =>
          `<tr><td>${l.qty} × ${esc(nameOf(shop(), l.id, lc()))} @ ${esc(money(l.unit))}</td><td>${esc(money(l.amount))}</td></tr>`,
      )
      .join("");
    const masked = guardKeys(r, m).some((k) => !seen(GUARDS[k]));
    const neg = r.change.n < 0n;
    const changeRow = neg
      ? `<tr class="ps-over"><th scope="row">${t("over")}</th><td>${guardKeys(r, m).includes("change") && !seen("budget") ? '<span class="wb-unknown">?</span>' : esc(money(sub(frac(0n), r.change)))}</td></tr>`
      : `<tr><th scope="row">${t("change")}</th><td>${amount(r, "change", m)}</td></tr>`;
    return `<table class="ps-receipt"><caption>${esc(label)}</caption><tbody>${lines}<tr class="ps-rule"><th scope="row">${t("subtotal")}</th><td>${esc(money(r.gross))}</td></tr><tr><th scope="row">${t("discount")} (${esc(offerText)})</th><td>−${amount(r, "discount", m)}</td></tr><tr><th scope="row">${t("sale")}</th><td>${amount(r, "sale", m)}</td></tr><tr><th scope="row">${t("taxLine")} (${f2(values().c)}% ${lang() ? "del precio rebajado" : "of sale price"})</th><td>${amount(r, "tax", m)}</td></tr><tr class="ps-total"><th scope="row">${t("total")}</th><td>${amount(r, "total", m)}</td></tr><tr><th scope="row">${t("budget")}</th><td>${esc(money(m.d))}</td></tr>${changeRow}</tbody></table><p class="ps-verdict ${r.within ? "ok" : "no"}"><span aria-hidden="true">${r.within ? "✓" : "✗"}</span> ${r.within ? (lang() ? "Cabe en el presupuesto." : "Fits the budget.") : lang() ? "Se pasa del presupuesto." : "Over the budget."}</p>${r.invalid.length ? `<p class="ps-warn">${lang() ? "Se omitieron artículos con precio no válido." : "Items with a price that is not valid were left out."}</p>` : ""}${masked ? `<p class="muted">${t("hidden")}</p>` : ""}`;
  }

  function shelfMarkup(m) {
    const s = shop();
    const card = (id) => {
      const it = s.shelf.find((x) => x.id === id);
      const name = esc(nameOf(s, id, lc()));
      const value = id === "tag" ? String(getState().design.a ?? "") : it.price;
      const bad = id !== "tag" && !priceOf(s, id, m);
      const sel = s.sel === id;
      return `<li class="ps-item${sel ? " is-selected" : ""}"><strong>${name}</strong><label for="ps-price-${id}">${t("price")}</label><div class="ps-row"><button type="button" class="secondary small" data-ps-step="${id}" data-dir="-1" aria-label="${lang() ? "Bajar precio" : "Lower price"}: ${name}">−</button><input id="ps-price-${id}" data-ps-price="${id}" type="text" inputmode="decimal" maxlength="8" autocomplete="off" value="${esc(value)}"${bad ? ` aria-invalid="true" aria-describedby="ps-bad-${id}"` : ""}><button type="button" class="secondary small" data-ps-step="${id}" data-dir="1" aria-label="${lang() ? "Subir precio" : "Raise price"}: ${name}">+</button></div>${bad ? `<p class="ps-warn" id="ps-bad-${id}">${t("badPrice")}</p>` : ""}<div class="ps-row"><button type="button" class="secondary small" data-ps-sel="${id}" aria-pressed="${sel}">${t("select")}</button>${id === "tag" ? "" : `<button type="button" class="secondary small" data-ps-unstock="${id}">${t("remove")}<span class="sr-only"> ${name}</span></button>`}</div></li>`;
    };
    const options = ITEM_TYPES.map(
      (k) =>
        `<option value="${k}">${esc(ITEMS[k][lc()])} (${esc(money(priceOf({ shelf: [{ id: "x", price: ITEMS[k].price }] }, "x", m)))})</option>`,
    ).join("");
    return `<h4>${t("shelf")}</h4><ul class="ps-shelf">${["tag", ...s.shelf.map((x) => x.id)].map(card).join("")}</ul><div class="ps-row"><label for="ps-stock">${t("stock")}</label><select id="ps-stock">${options}</select><button type="button" class="secondary small" data-ps="stock">${t("stockBtn")}</button></div>`;
  }

  function ruleMarkup(m) {
    const v = values();
    const twist = smart
      ? `<button type="button" class="secondary small" data-ps="twist">${lang() ? "Giro: el precio de la misión sube $10" : "Twist: the mission price rises by $10"}</button>`
      : `<button type="button" class="secondary small" data-ps="twist">${lang() ? "Giro: el descuento sube 5 puntos" : "Twist: the discount rises 5 percentage points"}</button>`;
    return `<h4>${t("rule")}</h4><div class="ps-row"><button type="button" class="secondary small" data-ps-pct="-1" aria-label="${lang() ? "Menos descuento" : "Less discount"}">−</button><strong class="ps-big">${f2(v.b)}% ${t("off")}</strong><button type="button" class="secondary small" data-ps-pct="1" aria-label="${lang() ? "Más descuento" : "More discount"}">+</button>${twist}</div><p>${t("tax")}: <strong>${f2(v.c)}%</strong> · ${t("budget")}: <strong>${esc(money(m.d))}</strong></p>`;
  }

  function gridMarkup(m) {
    const s = shop();
    const p = priceOf(s, s.sel, m);
    const b = values().b;
    const name = nameOf(s, s.sel, lc());
    if (!p) return `<h4>${t("grid")}</h4><p class="muted">${t("badPrice")}</p>`;
    const ans = answersOf(m);
    const off = mul(p, frac(BigInt(Math.round(b)), 100n));
    const rest = sub(p, off);
    const offText = eq(off, ans.discount) && !seen("discount") ? "?" : money(off);
    const restText = eq(rest, ans.sale) && !seen("sale") ? "?" : money(rest);
    const prices = ["tag", ...s.shelf.map((x) => x.id)]
      .map((id) => priceOf(s, id, m))
      .filter(Boolean)
      .map((x) => Number(x.n) / Number(x.d));
    const share = Number(p.n) / Number(p.d) / Math.max(...prices);
    let cells = "";
    for (let i = 0; i < 100; i++) {
      const on = i < b;
      cells += `<rect data-ps-sq="${i + 1}" x="${20 + (i % 10) * 26}" y="${14 + Math.floor(i / 10) * 22}" width="24" height="20" rx="2" fill="${on ? PEACH : MINT}" stroke="${on ? ORANGE : "#8aa59b"}" stroke-width="1.2"/>${on ? `<line x1="${22 + (i % 10) * 26}" y1="${32 + Math.floor(i / 10) * 22}" x2="${42 + (i % 10) * 26}" y2="${16 + Math.floor(i / 10) * 22}" stroke="${ORANGE}" stroke-width="1.2" pointer-events="none"/>` : ""}`;
    }
    const barW = Math.max(24, 260 * share);
    const bar = `<rect x="20" y="246" width="${f2(barW)}" height="18" rx="3" fill="#fff" stroke="${INK}" stroke-width="1.5"/><rect x="20" y="246" width="${f2((barW * b) / 100)}" height="18" rx="3" fill="${PEACH}" stroke="${ORANGE}"/><text x="20" y="282" font-size="12" fill="${MUTED}">${esc(lang() ? "el total, a escala del artículo más caro" : "the whole, to scale with the priciest item")}</text>`;
    const aria = lang()
      ? `${b} de 100 cuadrados sombreados para ${name}. Flechas cambian el descuento.`
      : `${b} of 100 squares shaded for ${name}. Arrow keys change the discount.`;
    return `<h4>${t("grid")}: ${esc(name)}</h4><div class="ps-grid" role="slider" tabindex="0" data-ps-grid aria-label="${esc(aria)}" aria-valuemin="${field("b").min}" aria-valuemax="${field("b").max}" aria-valuenow="${b}" aria-valuetext="${b}%"><svg viewBox="0 0 300 290" aria-hidden="true" focusable="false"><rect width="300" height="290" fill="#fff"/>${cells}${bar}</svg></div><ul class="ps-facts"><li>${lang() ? "El total" : "Whole"} = ${esc(money(p))} = 100%</li><li>${lang() ? "Cada cuadrado" : "Each square"} = ${esc(money(mul(p, frac(1n, 100n))))}</li><li><svg class="ps-key ps-key-off" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><line x1="1" y1="13" x2="13" y2="1" stroke="#b53e20" stroke-width="1.5"/></svg> ${b} ${lang() ? "cuadrados rayados (descuento)" : "hatched squares (discount)"} = ${esc(offText)}</li><li><span class="ps-key" aria-hidden="true"></span> ${f2(100 - b)} ${lang() ? "cuadrados que se pagan" : "squares you pay"} = ${esc(restText)}</li></ul>${offText === "?" || restText === "?" ? `<p class="muted">${t("hidden")}</p>` : ""}<p class="muted">${lang() ? "Haz clic en un cuadrado para fijar el descuento, o enfoca la cuadrícula y usa las flechas." : "Click a square to set the discount, or focus the grid and use the arrow keys."}</p>`;
  }

  function basketMarkup(m) {
    const s = shop();
    const tabs = s.baskets
      .map(
        (b, i) =>
          `<button type="button" class="secondary small" data-ps-basket="${b.id}" aria-pressed="${b.id === s.active}">${t("customer")} ${i + 1}</button>`,
      )
      .join("");
    const active = s.baskets.find((b) => b.id === s.active);
    const rows = ["tag", ...s.shelf.map((x) => x.id)]
      .map((id) => {
        const q = active.qty[id] || 0;
        const name = esc(nameOf(s, id, lc()));
        return `<li class="ps-qty"><span>${name}</span><span class="ps-row"><button type="button" class="secondary small" data-ps-qty="${id}" data-dir="-1" aria-label="${lang() ? "Quitar uno" : "Take one out"}: ${name}"${q ? "" : " disabled"}>−</button><output aria-live="off">${q}</output><button type="button" class="secondary small" data-ps-qty="${id}" data-dir="1" aria-label="${lang() ? "Agregar uno" : "Add one"}: ${name}"${q >= MAX_QTY ? " disabled" : ""}>+</button></span></li>`;
      })
      .join("");
    const idx = s.baskets.indexOf(active) + 1;
    let receipts;
    if (smart) {
      const cmpd = compareOffers(s, s.active, m);
      const offerB = cmpd.coupon
        ? cmpd.coupon.kind === "percent"
          ? `${cmpd.coupon.value.n}% ${lang() ? "menos" : "off"}`
          : `${money(cmpd.coupon.value)} ${lang() ? "menos" : "off"}`
        : "";
      const verdict = (() => {
        if (!cmpd.b || !cmpd.a.count) return "";
        const hidden = [...guardKeys(cmpd.a, m), ...guardKeys(cmpd.b, m)].some(
          (k) => k === "total" && !seen("total"),
        );
        if (hidden)
          return `<p class="muted">${lang() ? "Compara los totales después de comprobar el total en Probar." : "Compare the totals after you check the total in Test."}</p>`;
        if (cmpd.better === "tie")
          return `<p class="ps-verdict ok">${lang() ? "Las dos ofertas cuestan lo mismo." : "Both offers cost the same."}</p>`;
        return `<p class="ps-verdict ok">${lang() ? `La oferta ${cmpd.better} cuesta ${money(cmpd.gap)} menos para esta canasta.` : `Offer ${cmpd.better} costs ${money(cmpd.gap)} less for this basket.`} ${lang() ? "¿Es también la más útil? Explica tu decisión." : "Is it also the more useful choice? Explain your decision."}</p>`;
      })();
      receipts = `<h4>${t("compare")}</h4><div class="ps-two"><div>${receiptMarkup(cmpd.a, m, `${lang() ? "Oferta A" : "Offer A"} · ${t("customer")} ${idx}`, `${f2(values().b)}%`)}</div><div>${cmpd.b ? receiptMarkup(cmpd.b, m, `${lang() ? "Oferta B" : "Offer B"} · ${t("customer")} ${idx}`, offerB) : `<p class="ps-warn">${t("invalidCoupon")}</p>`}</div></div>${verdict}`;
    } else
      receipts = `<h4>${t("receipt")}</h4>${receiptMarkup(receipt(s, s.active, missionOffer(m), m), m, `${t("customer")} ${idx}`, `${f2(values().b)}%`)}`;
    const coupon = smart
      ? `<fieldset class="ps-coupon"><legend>${t("coupon")}</legend><label for="ps-ckind">${t("couponKind")}</label><select id="ps-ckind" data-ps-ckind><option value="dollars"${s.coupon.kind === "dollars" ? " selected" : ""}>${t("dollarsOff")}</option><option value="percent"${s.coupon.kind === "percent" ? " selected" : ""}>${t("percentOff")}</option></select><label for="ps-camount">${t("amount")} (${s.coupon.kind === "percent" ? "%" : "$"})</label><input id="ps-camount" data-ps-camount type="text" inputmode="decimal" maxlength="8" autocomplete="off" value="${esc(s.coupon.amount)}"${parseCoupon(s.coupon) ? "" : ' aria-invalid="true"'}></fieldset>`
      : "";
    return `<h4>${t("baskets")}</h4><div class="ps-row" role="group" aria-label="${t("baskets")}">${tabs}<button type="button" class="secondary small" data-ps="add-basket"${s.baskets.length >= 3 ? " disabled" : ""}>+ ${t("addCustomer")}</button>${s.baskets.length > 1 ? `<button type="button" class="secondary small" data-ps="remove-basket">${t("removeCustomer")}</button>` : ""}</div><ul class="ps-basket">${rows}</ul>${coupon}${receipts}`;
  }

  function checksMarkup(m) {
    const verdict = evaluateShop(shop(), m);
    const row = (ok, text) =>
      `<li class="${ok ? "fd-ok" : "fd-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> ${esc(text)} <span class="sr-only">${ok ? (lang() ? "sí" : "yes") : lang() ? "todavía no" : "not yet"}</span></li>`;
    const baskets = verdict.baskets
      .map((b, i) => (b.empty ? "" : row(b.within, `${t("customer")} ${i + 1} ${t("within")}`)))
      .join("");
    return `<h4>${t("checks")}</h4><ul class="fd-checklist">${row(verdict.pricesOk, t("pricesOk"))}${baskets || `<li class="muted">${t("empty")}</li>`}</ul>`;
  }

  function render() {
    if (!host) return;
    const body = host.querySelector("#ps-body");
    if (!body) return;
    const m = shopOf(values());
    if (!m) {
      body.innerHTML = `<p class="muted">${lang() ? "Corrige los números del diseño para abrir la tienda." : "Fix the design numbers to open the shop."}</p>`;
      return;
    }
    const active = document.activeElement;
    const keep =
      active && host.contains(active)
        ? {
            id: active.id,
            sel: active.dataset ? Object.entries(active.dataset)[0] : null,
            caret:
              active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null,
          }
        : null;
    body.innerHTML = `<div class="ps-cols"><div>${ruleMarkup(m)}${shelfMarkup(m)}</div><div>${gridMarkup(m)}</div></div>${basketMarkup(m)}${checksMarkup(m)}`;
    const undo = host.querySelector('[data-ps="undo"]'),
      redo = host.querySelector('[data-ps="redo"]');
    if (undo) undo.disabled = !history.canUndo();
    if (redo) redo.disabled = !history.canRedo();
    if (keep) {
      let next = keep.id ? host.querySelector(`#${CSS.escape(keep.id)}`) : null;
      if (!next && keep.sel) {
        const [k, v] = keep.sel;
        const attr = `data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
        next = [...host.querySelectorAll(`[${attr}]`)].find(
          (el) =>
            el.getAttribute(attr) === v &&
            (!active.dataset.dir || el.dataset.dir === active.dataset.dir),
        );
      }
      if (next && !next.disabled) {
        next.focus({ preventScroll: true });
        if (keep.caret && next.setSelectionRange) next.setSelectionRange(...keep.caret);
      }
    }
  }

  function html() {
    return `<section class="card fd ps" id="ps" aria-labelledby="ps-h"><h3 id="ps-h">${t("title")}</h3><p>${t("intro")}</p><div id="ps-body"></div><div class="ps-row"><button type="button" class="secondary small" data-ps="undo">${t("undo")}</button><button type="button" class="secondary small" data-ps="redo">${t("redo")}</button></div><p id="fd-status" class="notice" role="status"></p></section>`;
  }

  /* ---------------------------------------------------------------- interaction */
  const setPct = (b) => {
    const next = clampField("b", Math.round(b));
    if (next === Number(values().b)) return;
    applyDesign(
      { b: String(next) },
      "ps-b",
      lang() ? `Descuento: ${next}%.` : `Discount: ${next}%.`,
    );
  };
  function act(name) {
    const s = shop();
    const m = shopOf(values());
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (!next) return;
      setData(next);
      save();
      render();
      return announce(
        name === "undo"
          ? lang()
            ? "Se deshizo el último cambio de la tienda."
            : "Undid the last shop change."
          : lang()
            ? "Se rehizo el cambio de la tienda."
            : "Redid the shop change.",
      );
    }
    if (name === "stock") {
      const type = host.querySelector("#ps-stock")?.value;
      const r = stock(s, type);
      if (r.error)
        return announce(
          lang()
            ? "El estante ya tiene 6 artículos más el de la misión."
            : "The shelf already holds 6 items plus the mission tag.",
        );
      return commit(
        r.shop,
        null,
        `${ITEMS[type][lc()]} ${lang() ? "en el estante" : "is on the shelf"}.`,
      );
    }
    if (name === "add-basket") {
      const r = addBasket(s);
      if (!r.error) commit(r.shop, null, `${t("customer")} ${r.shop.baskets.length}.`);
      return;
    }
    if (name === "remove-basket")
      return commit(
        removeBasket(s, s.active),
        null,
        lang() ? "Cliente quitado." : "Customer removed.",
      );
    if (name === "twist" && m) {
      if (smart) {
        const a = Math.min(field("a").max, values().a + 10);
        return applyDesign(
          { a: String(a) },
          null,
          lang()
            ? `Precio de la misión: $${f2(a)}. Revisa los recibos.`
            : `Mission price: $${f2(a)}. Check the receipts again.`,
        );
      }
      return setPct(values().b + 5);
    }
  }
  function onClick(event) {
    const el = event.target.closest("button, [data-ps-sq]");
    if (!el || !host.contains(el)) return;
    const s = shop();
    const d = el.dataset;
    if (d.psSq) return setPct(Number(d.psSq));
    if (d.ps) return act(d.ps);
    if (d.psPct) return setPct(values().b + Number(d.psPct));
    if (d.psSel)
      return commit(
        { ...s, sel: d.psSel },
        null,
        `${nameOf(s, d.psSel, lc())}: ${lang() ? "en la cuadrícula" : "on the grid"}.`,
      );
    if (d.psUnstock)
      return commit(
        unstock(s, d.psUnstock),
        null,
        `${nameOf(s, d.psUnstock, lc())} ${lang() ? "quitado" : "removed"}.`,
      );
    if (d.psBasket)
      return commit(
        { ...s, active: d.psBasket },
        null,
        `${t("customer")} ${s.baskets.findIndex((b) => b.id === d.psBasket) + 1}.`,
      );
    if (d.psQty) {
      const b = s.baskets.find((x) => x.id === s.active);
      const q = (b.qty[d.psQty] || 0) + Number(d.dir);
      return commit(
        setQty(s, s.active, d.psQty, q),
        null,
        `${nameOf(s, d.psQty, lc())}: ${Math.max(0, q)}.`,
      );
    }
    if (d.psStep) {
      if (d.psStep === "tag") {
        const a = Math.round(clampField("a", values().a + Number(d.dir) * 0.25) * 100) / 100;
        return applyDesign(
          { a: String(a) },
          "ps-a",
          `${nameOf(s, "tag", lc())}: $${a.toFixed(2)}.`,
        );
      }
      const next = stepPrice(s, d.psStep, Number(d.dir));
      return commit(
        next,
        null,
        `${nameOf(s, d.psStep, lc())}: $${next.shelf.find((x) => x.id === d.psStep).price}.`,
      );
    }
  }
  function onInput(event) {
    const el = event.target;
    const s = shop();
    if (el.dataset.psPrice) {
      if (el.dataset.psPrice === "tag") return applyDesign({ a: el.value }, "ps-a");
      return commit(setPrice(s, el.dataset.psPrice, el.value), `price-${el.dataset.psPrice}`);
    }
    if (el.hasAttribute("data-ps-camount"))
      return commit({ ...s, coupon: { ...s.coupon, amount: el.value.slice(0, 8) } }, "coupon");
  }
  function onChange(event) {
    if (event.target.hasAttribute("data-ps-ckind")) {
      const s = shop();
      commit(
        {
          ...s,
          coupon: {
            kind: event.target.value === "percent" ? "percent" : "dollars",
            amount: s.coupon.amount,
          },
        },
        null,
      );
    }
    history.breakRun();
  }
  function onKey(event) {
    if (!event.target.closest?.("[data-ps-grid]")) return;
    const delta = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    }[event.key];
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    event.stopPropagation();
    setPct(
      event.key === "Home"
        ? field("b").min
        : event.key === "End"
          ? field("b").max
          : values().b + delta,
    );
  }

  return {
    html,
    render,
    attach(section) {
      host = section.querySelector("#ps");
      if (!host) return;
      host.addEventListener("click", onClick);
      host.addEventListener("input", onInput);
      host.addEventListener("change", onChange);
      host.addEventListener("keydown", onKey);
      render();
    },
    detach() {
      host = null;
    },
    restored(next) {
      setData(next);
      history.record(next, null);
      render();
    },
  };
}
