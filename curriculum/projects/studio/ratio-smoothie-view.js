/**
 * Smoothie Bar mixing station (unit-3-a), mounted by ratio-lab-view.js. The student names the two
 * ingredients, sets the recipe parts (the design's a : b), scales batches, taste-tests a batch of their own
 * and plans a purchase from the mission's two offers. The animated cup, the ratio table and the double
 * number line all read the same exact state.
 */
import { esc } from "./models-kit.mjs";
import {
  INGREDIENT_KEYS,
  INGREDIENTS,
  MAX_BATCH,
  MAX_PACKS,
  dollars,
  purchase,
  show,
  tasteTest,
} from "./ratio-lab.mjs";
import { add } from "./exact.mjs";

const frac01 = (p, q) => Number(p.n * q.d) / Number(p.n * q.d + q.n * p.d);

export function smoothieStation(ctx) {
  const { tr, lab, values, mask, commit, applyDesign, clampField, field } = ctx;
  const name = (key) => INGREDIENTS[key][ctx.lang() ? "es" : "en"];
  let lastK = null;

  function cupSVG(id, fa, colorA, colorB, label, refLine) {
    const path = "M20 20 L140 20 L124 210 L36 210 Z";
    const ref =
      refLine === null
        ? ""
        : `<line x1="16" x2="144" y1="${(210 - 190 * refLine).toFixed(1)}" y2="${(210 - 190 * refLine).toFixed(1)}" stroke="#142c3b" stroke-width="2" stroke-dasharray="6 4"/>`;
    return `<svg class="rl-cup" viewBox="0 0 160 240" role="img" aria-label="${esc(label)}"><defs><clipPath id="${id}-clip"><path d="${path}"/></clipPath></defs><g clip-path="url(#${id}-clip)"><g class="rl-liquid" data-rl-liquid="${id}"><rect x="0" y="20" width="160" height="190" fill="${colorB}"/><rect class="rl-layer" data-rl-layer="${id}" data-f="${fa.toFixed(4)}" x="0" y="20" width="160" height="190" fill="${colorA}" style="transform:scaleY(${fa.toFixed(4)})"/></g></g>${ref}<path d="${path}" fill="none" stroke="#142c3b" stroke-width="4" stroke-linejoin="round"/></svg>`;
  }

  function recipeMarkup(r) {
    const l = lab();
    const opts = (sel, other) =>
      INGREDIENT_KEYS.filter((k) => k !== other)
        .map((k) => `<option value="${k}"${k === sel ? " selected" : ""}>${esc(name(k))}</option>`)
        .join("");
    const total = add(r.a, r.b);
    return `<h4>${tr("1. Build the recipe", "1. Arma la receta")}</h4><div class="rl-grid2"><div><label for="rl-ia">${tr("Ingredient A", "Ingrediente A")}</label><select id="rl-ia" data-rl-ing="ia">${opts(l.ia, l.ib)}</select>${ctx.stepper('data-rl-part="a"', show(r.a), tr(`Parts of ${name(l.ia)}`, `Partes de ${name(l.ia)}`), { min: field("a").min, max: field("a").max, extra: `<span>${tr("parts", "partes")}</span>` })}</div><div><label for="rl-ib">${tr("Ingredient B", "Ingrediente B")}</label><select id="rl-ib" data-rl-ing="ib">${opts(l.ib, l.ia)}</select>${ctx.stepper('data-rl-part="b"', show(r.b), tr(`Parts of ${name(l.ib)}`, `Partes de ${name(l.ib)}`), { min: field("b").min, max: field("b").max, extra: `<span>${tr("parts", "partes")}</span>` })}</div></div><ul class="ps-facts"><li>${tr("Ingredient to ingredient", "Ingrediente a ingrediente")}: <strong>${show(r.a)} : ${show(r.b)}</strong> (${esc(name(l.ia))} : ${esc(name(l.ib))})</li><li>${tr("Ingredient to total", "Ingrediente al total")}: <strong>${show(r.a)} : ${show(total)}</strong> — ${tr(`${name(l.ia)} is ${show(r.a)} of every ${show(total)} parts`, `${name(l.ia)} es ${show(r.a)} de cada ${show(total)} partes`)}</li></ul>`;
  }

  function batchMarkup(r) {
    const l = lab();
    const taste = tasteTest(r, l.tx, l.ty);
    const fa = frac01(r.a, r.b);
    const A = INGREDIENTS[l.ia],
      B = INGREDIENTS[l.ib];
    const rows = ctx.tableMarkup(r, l.k, {
      n: tr("Batches", "Tandas"),
      A: name(l.ia),
      B: name(l.ib),
      total: tr("Total parts", "Partes en total"),
      current: tr("your batch", "tu tanda"),
    });
    const cupLabel = tr(
      `Recipe cup: ${name(l.ia)} fills ${show(r.a)} of ${show(add(r.a, r.b))} equal parts at the bottom, ${name(l.ib)} the rest.`,
      `Vaso de la receta: ${name(l.ia)} llena ${show(r.a)} de ${show(add(r.a, r.b))} partes iguales abajo y ${name(l.ib)} el resto.`,
    );
    const testCup =
      taste.status === "invalid"
        ? `<p class="muted rl-cupnote">${tr("Enter a batch below to fill the taste-test cup.", "Escribe una tanda abajo para llenar el vaso de prueba.")}</p>`
        : cupSVG(
            "rl-cup-t",
            frac01(taste.x, taste.y),
            A.color,
            B.color,
            tr(
              `Taste-test cup: ${show(taste.x)} to ${show(taste.y)}. Dashed line marks the recipe's layer.`,
              `Vaso de prueba: ${show(taste.x)} a ${show(taste.y)}. La línea punteada marca la capa de la receta.`,
            ),
            fa,
          );
    return `<h4>${tr("2. Scale the batch", "2. Escala la tanda")}</h4><div class="ps-row"><span>${tr("Batches", "Tandas")}:</span>${ctx.stepper("data-rl-k", l.k, tr("Number of batches", "Número de tandas"), { min: 1, max: MAX_BATCH })}${ctx.twistMarkup(tr("Twist: demand doubles (scale factor × 2)", "Giro: la demanda se duplica (factor × 2)"))}</div><div class="rl-cups"><figure><figcaption>${tr("Recipe", "Receta")}</figcaption>${cupSVG("rl-cup-r", fa, A.color, B.color, cupLabel, null)}<p class="rl-cupnote">${l.k} × (${show(r.a)} + ${show(r.b)})</p></figure><figure><figcaption>${tr("Taste test", "Prueba de sabor")}</figcaption>${testCup}</figure></div><p class="muted">${tr("The bottom layer is the first ingredient. Equivalent batches fill the cup in the same layers, whatever the size.", "La capa de abajo es el primer ingrediente. Las tandas equivalentes llenan el vaso con las mismas capas, sin importar el tamaño.")}</p>${rows}${ctx.dnlMarkup(r, l.k, { A: name(l.ia), B: name(l.ib) })}`;
  }

  function tasteMarkup(r) {
    const l = lab();
    const res = tasteTest(r, l.tx, l.ty);
    const A = name(l.ia),
      B = name(l.ib);
    let verdict = "";
    if (res.status === "invalid")
      verdict =
        l.tx || l.ty
          ? `<p class="ps-warn">${tr("Enter two positive amounts (whole numbers, decimals or fractions).", "Escribe dos cantidades positivas (enteros, decimales o fracciones).")}</p>`
          : "";
    else if (res.status === "equivalent")
      verdict = `<p class="ps-verdict ok"><span aria-hidden="true">✓</span> ${tr(`Same taste. ${show(res.x)} : ${show(res.y)} multiplies both parts by ${show(res.factor)}.`, `Mismo sabor. ${show(res.x)} : ${show(res.y)} multiplica las dos partes por ${show(res.factor)}.`)}</p>`;
    else {
      const more = res.richer === "A" ? A : B;
      const why =
        res.status === "additive"
          ? tr(
              `You added ${show(res.added)} to both parts. Adding the same amount keeps the difference, not the ratio. Try multiplying both parts by one number.`,
              `Sumaste ${show(res.added)} a las dos partes. Sumar lo mismo conserva la diferencia, no la razón. Prueba multiplicar las dos partes por un mismo número.`,
            )
          : tr(
              `${A} was multiplied by ${show(res.fa)} but ${B} by ${show(res.fb)}. Use one multiplier for both parts.`,
              `${A} se multiplicó por ${show(res.fa)} pero ${B} por ${show(res.fb)}. Usa un solo multiplicador para las dos partes.`,
            );
      verdict = `<p class="ps-verdict no"><span aria-hidden="true">✗</span> ${tr(`Different taste: more ${more}-heavy than the recipe.`, `Sabor diferente: sabe más a ${more} que la receta.`)} ${why}</p>`;
    }
    return `<h4>${tr("3. Taste test a batch", "3. Prueba el sabor de una tanda")}</h4><div class="rl-grid2"><div><label for="rl-tx">${tr(`Parts of ${A}`, `Partes de ${A}`)}</label><input id="rl-tx" data-rl-taste="tx" type="text" inputmode="decimal" maxlength="8" autocomplete="off" value="${esc(l.tx)}"></div><div><label for="rl-ty">${tr(`Parts of ${B}`, `Partes de ${B}`)}</label><input id="rl-ty" data-rl-taste="ty" type="text" inputmode="decimal" maxlength="8" autocomplete="off" value="${esc(l.ty)}"></div></div><div aria-live="polite">${verdict}</div>`;
  }

  function buyMarkup(r) {
    const l = lab();
    const p = purchase(r, l);
    const A = name(l.ia);
    const needText = mask(p.need, p.guardNeed);
    const needHidden = p.guardNeed.some((id) => !ctx.seen(id));
    const row = (ok, text) =>
      `<li class="${ok ? "fd-ok" : "fd-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> ${text} <span class="sr-only">${ok ? tr("yes", "sí") : tr("not yet", "todavía no")}</span></li>`;
    const extra = needHidden
      ? ""
      : p.covers
        ? ` ${tr("Left over", "Sobran")}: ${show(p.leftover)} ${tr("cups", "tazas")}.`
        : ` ${tr("Short by", "Faltan")}: ${show(p.short)} ${tr("cups", "tazas")}.`;
    return `<h4>${tr("4. Buy the ingredients", "4. Compra los ingredientes")}</h4><p>${tr(`One recipe part is 1 cup. ${l.k === 1 ? "1 batch needs" : `${l.k} batches need`}`, `Una parte es 1 taza. ${l.k === 1 ? "1 tanda necesita" : `${l.k} tandas necesitan`}`)} <strong>${needText}</strong> ${tr(`cups of ${A}`, `tazas de ${A}`)}.</p><div class="rl-grid2"><div><strong>${tr("Offer A", "Oferta A")}</strong>: ${dollars(r.d)} ${tr("for", "por")} ${show(r.e)} ${tr("cups", "tazas")}${ctx.stepper('data-rl-pack="na"', l.na, tr("Packs of Offer A", "Paquetes de la oferta A"), { min: 0, max: MAX_PACKS })}</div><div><strong>${tr("Offer B", "Oferta B")}</strong>: ${dollars(r.f)} ${tr("for", "por")} ${show(r.g)} ${tr("cups", "tazas")}${ctx.stepper('data-rl-pack="nb"', l.nb, tr("Packs of Offer B", "Paquetes de la oferta B"), { min: 0, max: MAX_PACKS })}</div></div><label for="rl-budget">${tr("Your spending limit ($, optional)", "Tu límite de gasto ($, opcional)")}</label><input id="rl-budget" data-rl-budget type="text" inputmode="decimal" maxlength="8" autocomplete="off" value="${esc(l.budget)}"><p>${tr("Bought", "Compraste")}: <strong>${show(p.bought)}</strong> ${tr("cups", "tazas")} · ${tr("Cost", "Costo")}: <strong>${dollars(p.cost)}</strong>.${extra}</p><ul class="fd-checklist">${row(p.covers, tr("Enough for the batch", "Alcanza para la tanda"))}${p.within === null ? "" : row(p.within, tr("Within your spending limit", "Dentro de tu límite de gasto"))}</ul><p class="muted">${tr("Which offer is the better buy? Compare the cost of ONE cup in Test, then defend your plan.", "¿Qué oferta conviene más? Compara el costo de UNA taza en Probar y luego defiende tu plan.")}</p>`;
  }

  return {
    intro: () =>
      tr(
        "Build a recipe from parts, scale it, and taste-test a batch. The cup, the table and the number line all update together.",
        "Arma una receta con partes, escálala y prueba el sabor de una tanda. El vaso, la tabla y la recta numérica cambian juntos.",
      ),
    markup: (r) => recipeMarkup(r) + batchMarkup(r) + tasteMarkup(r) + buyMarkup(r),
    /** Remember the cup layers so the next render can animate from them. */
    snapshot() {
      const out = {};
      for (const el of document.querySelectorAll("[data-rl-layer]"))
        out[el.dataset.rlLayer] = el.dataset.f;
      return out;
    },
    afterRender(host, before) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const refill = lastK !== null && lastK !== lab().k;
      lastK = lab().k;
      if (reduce) return;
      for (const el of host.querySelectorAll("[data-rl-layer]")) {
        const prev = before?.[el.dataset.rlLayer];
        if (prev === undefined || prev === el.dataset.f) continue;
        el.style.transition = "none";
        el.style.transform = `scaleY(${prev})`;
        requestAnimationFrame(() => {
          el.style.transition = "";
          el.style.transform = `scaleY(${el.dataset.f})`;
        });
      }
      if (refill)
        for (const g of host.querySelectorAll('[data-rl-liquid="rl-cup-r"]')) {
          g.style.transition = "none";
          g.style.transform = "scaleY(0.15)";
          requestAnimationFrame(() => {
            g.style.transition = "";
            g.style.transform = "scaleY(1)";
          });
        }
    },
    onClick(el) {
      const l = lab();
      const dir = Number(el.dataset.dir);
      if (el.dataset.rlPart) {
        const k = el.dataset.rlPart;
        const v = clampField(k, Number(values()[k]) + dir);
        return applyDesign(
          { [k]: String(v) },
          `rl-${k}`,
          tr(
            `Recipe ${k === "a" ? v : values().a} : ${k === "b" ? v : values().b}.`,
            `Receta ${k === "a" ? v : values().a} : ${k === "b" ? v : values().b}.`,
          ),
        );
      }
      if (el.hasAttribute("data-rl-k")) {
        const k = Math.max(1, Math.min(MAX_BATCH, l.k + dir));
        return commit({ ...l, k }, null,
          tr(`${k} batch${k === 1 ? "" : "es"}.`, `${k} tanda${k === 1 ? "" : "s"}.`),
        );
      }
      if (el.dataset.rlPack) {
        const key = el.dataset.rlPack;
        const n = Math.max(0, Math.min(MAX_PACKS, l[key] + dir));
        return commit({ ...l, [key]: n }, null,
          `${key === "na" ? tr("Offer A", "Oferta A") : tr("Offer B", "Oferta B")}: ${n}.`,
        );
      }
    },
    onInput(el) {
      const l = lab();
      if (el.dataset.rlTaste) commit({ ...l, [el.dataset.rlTaste]: el.value.slice(0, 8) }, "taste");
      else if (el.hasAttribute("data-rl-budget"))
        commit({ ...l, budget: el.value.slice(0, 8) }, "budget");
    },
    onChange(el) {
      const key = el.dataset.rlIng;
      if (!key || !INGREDIENT_KEYS.includes(el.value)) return;
      commit(
        { ...lab(), [key]: el.value },
        null,
        `${tr("Ingredient", "Ingrediente")} ${key === "ia" ? "A" : "B"}: ${name(el.value)}.`,
      );
    },
  };
}
