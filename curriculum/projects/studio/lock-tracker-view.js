/**
 * Fundraiser goal tracker markup for the lock studio (unit-8-b). The student's first progress equation
 * (x + p = goal, or p · n = goal) and their proposed value drive a progress bar; tested amounts are
 * judged against the goal inequality (≥ includes the boundary, > excludes it) on a number line.
 * The total is a derived number, so it prints through `fmt` (hidden Test answers show as "?").
 */
import { parse, show } from "./exact.mjs";
import { holds, meetsGoal, opText, trackerTotal } from "./lock-model.mjs";
import { esc, INK, MUTED, ORANGE, TEAL } from "./models-kit.mjs";

export function trackerMarkup(d, fmt, es, t) {
  const l = d.locks[0];
  if (!l)
    return `<p class="muted">${es() ? "Agrega una ecuación de progreso para ver la barra." : "Add a progress equation to see the bar."}</p>`;
  const goal = parse(l.q);
  const total = d.secret ? trackerTotal(l, d.secret) : null;
  const ratio = total
    ? Math.min(1.25, Number(total.n) / Number(total.d) / (Number(goal.n) / Number(goal.d)))
    : 0;
  const meets = total ? meetsGoal(d.goalOp, total, goal) : false;
  const typedTotal = total && d.tries.some((s) => show(parse(s)) === show(total));
  const totalText = total ? (typedTotal ? show(total) : fmt(total)) : "—";
  const bar = `<div class="eq-bar" role="img" aria-label="${esc(`${es() ? "Progreso" : "Progress"}: ${totalText} / ${l.q}. ${meets ? (es() ? "Meta cumplida" : "Goal met") : es() ? "Meta no cumplida" : "Goal not met"}`)}"><span style="width:${((ratio / 1.25) * 100).toFixed(1)}%"></span><i style="left:${(100 / 1.25).toFixed(1)}%" aria-hidden="true"></i></div>`;
  const status = !d.secret
    ? es()
      ? "Fija tu valor propuesto para mover la barra."
      : "Set your proposed value to move the bar."
    : `${es() ? "Total con tu valor" : "Total with your value"}: $${totalText} ${es() ? "de" : "of"} $${l.q}. ${meets ? (es() ? "✓ Cumple la meta." : "✓ Meets the goal.") : es() ? "✗ Todavía no cumple la meta." : "✗ Does not meet the goal yet."}`;
  const tries = d.tries
    .map((s) => {
      const ok = holds(d.goalOp, goal, parse(s));
      const edge = show(parse(s)) === show(goal);
      return `<li class="${ok ? "eq-ok" : "eq-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> $${esc(s)}: ${ok ? (es() ? "cumple" : "meets the goal") : es() ? "no cumple" : "does not meet the goal"}${edge ? (es() ? ` (el límite: ${d.goalOp === ">=" ? "“por lo menos” lo incluye" : "“más que” lo excluye"})` : ` (the boundary: ${d.goalOp === ">=" ? "“at least” includes it" : "“more than” excludes it"})`) : ""} <button type="button" class="secondary small" data-eq-trm="${esc(s)}">${t("remove")}</button></li>`;
    })
    .join("");
  return `${bar}<p>${esc(status)}</p><fieldset class="eq-goalop"><legend>${es() ? "Desigualdad de la meta" : "Goal inequality"}: total ${opText(d.goalOp)} ${esc(l.q)}</legend><label class="wb-radio"><input type="radio" name="eq-goalop" value=">=" ${d.goalOp === ">=" ? "checked" : ""}> ${t("atLeast")}</label><label class="wb-radio"><input type="radio" name="eq-goalop" value=">" ${d.goalOp === ">" ? "checked" : ""}> ${t("more")}</label></fieldset>${numberLine(goal, d, es)}<form class="eq-grid" data-eq-form="try" novalidate><label for="eq-try">${t("tries")} ($)<input id="eq-try" inputmode="decimal" maxlength="9" autocomplete="off"></label><button type="submit" class="secondary small">${t("test")}</button></form><ul class="eq-tries">${tries}</ul>`;
}
function numberLine(goal, d, es) {
  const g = Number(goal.n) / Number(goal.d);
  const vals = d.tries.map((s) => Number(parse(s).n) / Number(parse(s).d));
  const max = Math.max(g * 2, ...vals, 1);
  const W = 560,
    x = (v) => 30 + (v / max) * (W - 60),
    y = 50;
  const closed = d.goalOp === ">=";
  let body = `<line x1="30" y1="${y}" x2="${W - 20}" y2="${y}" stroke="${INK}" stroke-width="2"/><polygon points="${W - 20},${y - 6} ${W - 8},${y} ${W - 20},${y + 6}" fill="${INK}"/><line x1="${x(g)}" y1="${y}" x2="${W - 22}" y2="${y}" stroke="${TEAL}" stroke-width="8" opacity=".55"/><circle cx="${x(g)}" cy="${y}" r="8" fill="${closed ? TEAL : "#fff"}" stroke="${TEAL}" stroke-width="3"/><text x="${x(g)}" y="${y + 30}" font-size="13" text-anchor="middle" fill="${INK}">$${esc(d.locks[0].q)} ${closed ? (es() ? "(incluido)" : "(included)") : es() ? "(excluido)" : "(excluded)"}</text><text x="30" y="${y + 30}" font-size="12" fill="${MUTED}">0</text>`;
  d.tries.forEach((s, i) => {
    const v = vals[i];
    const ok = holds(d.goalOp, goal, parse(s));
    body += `<line x1="${x(v)}" y1="${y - 26}" x2="${x(v)}" y2="${y - 6}" stroke="${ok ? TEAL : ORANGE}" stroke-width="2"/><text x="${x(v)}" y="${y - 30 - (i % 2) * 14}" font-size="12" text-anchor="middle" font-weight="700" fill="${ok ? TEAL : ORANGE}">${ok ? "✓" : "✗"} ${esc(s)}</text>`;
  });
  return `<svg class="eq-line" viewBox="0 0 ${W} 100" role="img" aria-label="${esc(`${es() ? "Recta numérica" : "Number line"}: total ${opText(d.goalOp)} ${d.locks[0].q}, ${closed ? (es() ? "círculo cerrado" : "closed circle") : es() ? "círculo abierto" : "open circle"}${d.tries.length ? `; ${d.tries.join(", ")}` : ""}`)}"><rect width="${W}" height="100" fill="#fff"/>${body}</svg>`;
}
