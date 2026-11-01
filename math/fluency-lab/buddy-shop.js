// Buddy shop: coins (one per game star) buy extra buddy accessories. Prices are fixed, nothing is timed, and a
// purchase can never go below zero coins.
import { SHOP } from "./buddy-items.js";
import { buddySvg } from "./buddy.js";
import { t } from "./i18n.js";
import { coinBalance } from "./rewards.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function shopPanel(rewards) {
  const balance = coinBalance(rewards);
  const card = (item) => {
    const owned = rewards.shop.includes(item.id);
    const afford = balance >= item.price;
    const action = owned
      ? `<span class="shop-owned">${t("Owned")}</span>`
      : `<button type="button" class="tr-tool" data-buy="${item.id}"${afford ? "" : " disabled"} aria-label="${esc(t("Buy {name} for {n} coins", { name: t(item.name), n: item.price }))}">${t("Buy for {n} coins", { n: item.price })}</button>`;
    return `<li class="shop-item"><span class="shop-art" aria-hidden="true">${buddySvg({ ...rewards.buddy, hat: "", face: "", back: "", [item.slot]: item.id })}</span><b>${esc(t(item.name))}</b>${action}</li>`;
  };
  return `<section class="shop-panel" aria-labelledby="shop-title"><h3 id="shop-title">${t("Buddy shop")}</h3>
    <p class="shop-balance" role="status"><b aria-hidden="true">🪙</b> ${t("{n} coins", { n: balance })} <small>${t("You earn 1 coin for each star in a game.")}</small></p>
    <ul class="shop-grid">${SHOP.map(card).join("")}</ul></section>`;
}
