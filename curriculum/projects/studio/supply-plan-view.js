/**
 * Supply-plan simulator view for the division missions. Three linked bars: seat people in groups, buy
 * complete supply packs inside the budget, and cut pieces from a length of material (with fraction
 * marks). The student sets each count by dragging along the bar, the arrow keys, −/+ or typing; the
 * simulation shows the consequences and checks the plan live. The mission twist can be applied and
 * undone. Test answers stay "?" until they match in Test. Pure logic lives in supply-plan.mjs.
 */
import { frac, mul, sub } from "./exact.mjs";
import { createHistory } from "./history.mjs";
import { esc, INK, LIME, MINT, MUTED, ORANGE, PEACH, TEAL } from "./models-kit.mjs";
import {
  applyTwist,
  cutMarks,
  evaluate,
  MAX_COUNT,
  money,
  numbersOf,
  revertTwist,
  show,
  TWISTS,
  twistActive,
} from "./supply-plan.mjs";
import { L, NOUNS } from "./supply-plan-text.mjs";

const W = 600,
  X0 = 16,
  BW = W - 2 * X0,
  BAR_Y = 28,
  BAR_H = 44,
  H = 104;
const KINDS = { groups: ["a", "b"], packs: ["c", "d"], cuts: ["e", "f"] };

export function createSupplyDesigner({
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
  let drag = null;
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (key) => L[key][lang()];
  const words = NOUNS[project.id] || NOUNS["unit-1-a"];
  const w = (key, n = 2) => {
    const v = words[key][lang()];
    return Array.isArray(v) ? v[n === 1 ? 0 : 1] : v;
  };
  const history = createHistory(data());
  const revealed = (id) => getState().role === "teacher" || getState().checked?.[id] === true;
  const nums = () => numbersOf(values());
  const maxOf = (kind, v) => {
    const [T, U] = KINDS[kind];
    return Math.min(MAX_COUNT, Math.floor((1.25 * v[T]) / v[U]) + 1);
  };

  function commit(next, tag, message) {
    setData(next);
    history.record(next, tag);
    save();
    render();
    if (message) announce(message);
  }
  function setCount(kind, value, tag = `sp-${kind}`) {
    const v = values();
    const n = Math.max(0, Math.min(maxOf(kind, v), Math.round(Number(value) || 0)));
    if (n === data()[kind]) return render();
    commit(
      { ...data(), [kind]: n },
      tag,
      `${n} ${kind === "groups" ? w("group", n) : kind === "packs" ? w("pack", n) : w("piece", n)}.`,
    );
  }

  /* ------------------------------------------------------------------ drawing */
  function label(x, y, s, o = {}) {
    return `<text x="${x.toFixed(1)}" y="${y}" font-size="${o.size || 15}" fill="${o.fill || INK}" text-anchor="${o.anchor || "middle"}"${o.bold ? ' font-weight="700"' : ""} font-family="inherit">${esc(s)}</text>`;
  }
  function bar(kind, v, x) {
    const [T, U] = KINDS[kind];
    const total = v[T],
      unit = v[U],
      count = data()[kind],
      max = maxOf(kind, v);
    const scale = BW / Math.max(max * unit, total);
    const px = (u) => X0 + u * scale;
    const end = count * unit;
    let s = `<defs><pattern id="sp-hatch-${kind}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${PEACH}"/><line x1="0" y1="0" x2="0" y2="8" stroke="${ORANGE}" stroke-width="3"/></pattern></defs>`;
    s += `<rect x="${X0}" y="${BAR_Y}" width="${(total * scale).toFixed(1)}" height="${BAR_H}" fill="#f2f5f3" stroke="${MUTED}" stroke-width="1.5"/>`;
    if (end < total)
      s += `<rect x="${px(end).toFixed(1)}" y="${BAR_Y}" width="${((total - end) * scale).toFixed(1)}" height="${BAR_H}" fill="${kind === "groups" ? `url(#sp-hatch-${kind})` : "#fff"}" stroke="${kind === "groups" ? ORANGE : MUTED}" stroke-dasharray="5 3"/>`;
    const draw = Math.min(count, 150);
    for (let k = 0; k < draw; k++) {
      const a0 = k * unit,
        a1 = (k + 1) * unit,
        inEnd = Math.min(a1, total);
      if (a0 < total)
        s += `<rect x="${px(a0).toFixed(1)}" y="${BAR_Y + 4}" width="${Math.max(0, (inEnd - a0) * scale).toFixed(1)}" height="${BAR_H - 8}" fill="${k % 2 ? LIME : MINT}" stroke="${TEAL}" stroke-width="1.5"/>`;
      if (a1 > total + 1e-9) {
        const b0 = Math.max(a0, total);
        s += `<rect x="${px(b0).toFixed(1)}" y="${BAR_Y + 4}" width="${((a1 - b0) * scale).toFixed(1)}" height="${BAR_H - 8}" fill="${kind === "groups" ? "#fff" : `url(#sp-hatch-${kind})`}" stroke="${kind === "groups" ? TEAL : ORANGE}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      }
    }
    if (count > draw)
      s += `<rect x="${px(draw * unit).toFixed(1)}" y="${BAR_Y + 4}" width="${((Math.min(end, Math.max(max * unit, total)) - draw * unit) * scale).toFixed(1)}" height="${BAR_H - 8}" fill="${MINT}" stroke="${TEAL}"/>`;
    if (kind === "cuts") {
      const m = cutMarks(x);
      if (m)
        for (let k = 1; k < m.total; k++) {
          const at = px(k / m.unit),
            major = k % m.per === 0;
          if (scale / m.unit >= 3 || major)
            s += `<line x1="${at.toFixed(1)}" y1="${BAR_Y + (major ? 0 : 26)}" x2="${at.toFixed(1)}" y2="${BAR_Y + BAR_H}" stroke="${major ? INK : MUTED}" stroke-width="${major ? 1.5 : 1}"/>`;
        }
    }
    s +=
      label(X0, BAR_Y - 8, "0", { anchor: "start", fill: MUTED }) +
      label(px(total), BAR_Y - 8, totalText(kind, x), {
        anchor: total * scale > BW - 40 ? "end" : "middle",
        fill: INK,
        bold: true,
      });
    const note =
      end < total
        ? kind === "groups"
          ? t("noSeat")
          : `${kind === "packs" ? (revealed("money") ? money(sub(x.c, mul(frac(BigInt(count)), x.d))) : "$?") : revealed("leftover") ? `${show(sub(x.e, mul(frac(BigInt(count)), x.f)))} m` : "? m"} ${t("left")}`
        : end > total + 1e-9 && kind !== "groups"
          ? kind === "packs"
            ? t("over")
            : t("short")
          : "";
    if (note)
      s += label(Math.min(px(Math.max(end, total)), W - X0), BAR_Y + BAR_H + 20, note, {
        anchor: "end",
        fill: ORANGE,
        bold: true,
      });
    return `<svg class="sp-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><rect width="${W}" height="${H}" fill="#fff"/>${s}</svg>`;
  }
  const totalText = (kind, x) =>
    kind === "groups"
      ? `${show(x.a)} ${w("who")}`
      : kind === "packs"
        ? money(x.c)
        : `${show(x.e)} m`;

  /* ------------------------------------------------------------------ panels */
  function control(kind, title, v, x, summary) {
    const n = data()[kind],
      max = maxOf(kind, v);
    const noun = kind === "groups" ? w("group") : kind === "packs" ? w("pack") : w("piece");
    const valuetext = `${n} ${kind === "groups" ? w("group", n) : kind === "packs" ? w("pack", n) : w("piece", n)}`;
    return `<section class="sp-part" aria-labelledby="sp-h-${kind}"><h4 id="sp-h-${kind}">${title}</h4><div class="sp-bar" role="slider" tabindex="0" data-sp-bar="${kind}" aria-labelledby="sp-h-${kind}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${n}" aria-valuetext="${esc(valuetext)}">${bar(kind, v, x)}</div><div class="sp-row"><button type="button" class="secondary small" data-sp-step="${kind}" data-dir="-1" aria-label="${t("less")}: ${esc(noun)}">−</button><label class="sp-count" for="sp-in-${kind}">${t("howMany")} ${esc(noun)}?<input id="sp-in-${kind}" data-sp-input="${kind}" inputmode="numeric" maxlength="4" autocomplete="off" value="${n}"></label><button type="button" class="secondary small" data-sp-step="${kind}" data-dir="1" aria-label="${t("more")}: ${esc(noun)}">+</button></div>${summary}</section>`;
  }
  function seatingSummary(v, x, r) {
    const n = data().groups;
    const last = r.everyone && r.noEmpty && n > 0;
    const occupants = last ? v.a - (n - 1) * v.b : null;
    const lastLine = last
      ? `<p>${revealed("remainder") ? (occupants === v.b ? t("meaningExact") : `${occupants} ${t("lastGroup")}`) : `? ${t("lastGroup")} <span class="muted">(${t("hidden")})</span>`}</p>`
      : "";
    const meaning =
      revealed("groups") && revealed("remainder")
        ? `<p class="sp-meaning">${v.a % v.b ? t("meaningSeat") : t("meaningExact")}</p>`
        : "";
    const step = (dir, sym, name) =>
      `<button type="button" class="secondary small" data-sp-b="${dir}" aria-label="${name}">${sym}</button>`;
    return `<p><strong>${n} × ${v.b} = ${show(r.seats)}</strong> ${lang() ? "lugares para" : "places for"} ${v.a} ${esc(w("who"))}.</p>${lastLine}${meaning}<div class="sp-row" role="group" aria-label="${t("perGroup")} ${esc(w("group", 1))}"><span>${t("perGroup")} ${esc(w("group", 1))}: <strong>${v.b}</strong></span>${step(-1, "−", `${t("less")}: ${t("perGroup")} ${w("group", 1)}`)}${step(1, "+", `${t("more")}: ${t("perGroup")} ${w("group", 1)}`)}</div>`;
  }
  function buyingSummary(v, x, r) {
    const meaning =
      revealed("packs") && revealed("money") ? `<p class="sp-meaning">${t("meaningBuy")}</p>` : "";
    return `<p><strong>${data().packs} × ${money(x.d)} = ${money(r.cost)}</strong> ${lang() ? "de un presupuesto de" : "of a"} ${money(x.c)}${lang() ? "" : " budget"}.</p>${meaning}`;
  }
  function cuttingSummary(v, x, r) {
    const m = cutMarks(x);
    const q = mul(x.e, frac(x.f.d, x.f.n));
    const marks = m
      ? `<p class="muted">${t("marks")} 1/${m.unit} m; ${lang() ? "cada pieza son" : "each piece is"} ${m.per} ${lang() ? "marcas" : "marks"} (${show(x.f)} m = ${m.per}/${m.unit} m).</p>`
      : "";
    const meaning =
      revealed("quotient") && revealed("leftover")
        ? `<p class="sp-meaning">${isWholeQ(q) ? t("meaningExact") : t("meaningCut")}</p>`
        : "";
    return `<p><strong>${data().cuts} × ${show(x.f)} m = ${show(r.used)} m</strong> ${lang() ? "de" : "of"} ${show(x.e)} m ${esc(w("stuff"))}.</p><p>${show(x.e)} ÷ ${show(x.f)} = <strong>${revealed("quotient") ? show(q) : "?"}</strong> (${t("quotient")})${revealed("quotient") ? "" : ` <span class="muted">(${t("hidden")})</span>`}</p>${marks}${meaning}`;
  }
  const isWholeQ = (q) => q.d === 1n;
  function checksMarkup(r) {
    const row = (ok, text) =>
      `<li class="${ok ? "sp-ok" : "sp-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> ${esc(text)} <span class="sr-only">${ok ? (lang() ? "sí" : "yes") : lang() ? "todavía no" : "not yet"}</span></li>`;
    const plan = data();
    return `<ul class="sp-checklist">${row(plan.groups > 0 && r.everyone, t("everyone"))}${row(plan.groups > 0 && r.noEmpty, t("noEmpty"))}${plan.limit !== null ? row(r.withinLimit, `${t("limit")} (${plan.limit})`) : ""}${row(plan.packs > 0 && r.withinBudget, t("budget"))}${row(plan.cuts > 0 && r.enough, t("enough"))}</ul>`;
  }
  function twistMarkup() {
    const tw = TWISTS[project.id];
    if (!tw) return "";
    const on = twistActive(data(), values());
    return `<h4>${t("twist")}</h4><p>${esc(tw[lang() ? "es" : "en"])}</p><div class="sp-row"><button type="button" class="secondary small" data-sp="${on ? "untwist" : "twist"}">${on ? t("undoTwist") : t("applyTwist")}</button></div>${on ? `<p class="notice">${t("twistOn")}</p>` : ""}`;
  }

  function render() {
    if (!host) return;
    const v = values(),
      x = nums();
    const stage = host.querySelector("#sp-parts");
    if (!x) {
      stage.innerHTML = `<p class="muted">${lang() ? "Corrige los números del diseño para ver el plan." : "Fix the design numbers to see the plan."}</p>`;
      return;
    }
    const active = document.activeElement;
    const focusSel =
      active && host.contains(active)
        ? active.dataset.spBar
          ? `[data-sp-bar="${active.dataset.spBar}"]`
          : active.dataset.spInput
            ? `[data-sp-input="${active.dataset.spInput}"]`
            : active.dataset.spStep
              ? `[data-sp-step="${active.dataset.spStep}"][data-dir="${active.dataset.dir}"]`
              : active.dataset.spB
                ? `[data-sp-b="${active.dataset.spB}"]`
                : null
        : null;
    const caret =
      focusSel && active.selectionStart != null
        ? [active.selectionStart, active.selectionEnd]
        : null;
    const r = evaluate(data(), x);
    stage.innerHTML =
      control("groups", t("seating"), v, x, seatingSummary(v, x, r)) +
      control("packs", t("buying"), v, x, buyingSummary(v, x, r)) +
      control("cuts", t("cutting"), v, x, cuttingSummary(v, x, r));
    host.querySelector("#sp-checks").innerHTML = checksMarkup(r);
    host.querySelector("#sp-twist").innerHTML = twistMarkup();
    host.querySelector('[data-sp="undo"]').disabled = !history.canUndo();
    host.querySelector('[data-sp="redo"]').disabled = !history.canRedo();
    if (focusSel) {
      const el = host.querySelector(focusSel);
      el?.focus({ preventScroll: true });
      if (caret && el?.setSelectionRange) el.setSelectionRange(...caret);
    }
  }

  function html() {
    return `<section class="card sp" id="sp" aria-labelledby="sp-h"><h3 id="sp-h">${t("title")}</h3><p>${t("intro")}</p><div class="sp-layout"><div class="sp-side"><div><h4>${t("checks")}</h4><div id="sp-checks" aria-live="polite"></div><div class="sp-row"><button type="button" class="secondary small" data-sp="undo">${t("undo")}</button><button type="button" class="secondary small" data-sp="redo">${t("redo")}</button></div><p id="fd-status" class="notice" role="status"></p></div><div id="sp-twist"></div></div><div id="sp-parts" class="sp-parts"></div></div></section>`;
  }

  /* ------------------------------------------------------------------ events */
  function fromPointer(event, el) {
    const kind = el.dataset.spBar,
      v = values();
    const [T, U] = KINDS[kind];
    const box = el.querySelector("svg").getBoundingClientRect();
    const scale = BW / Math.max(maxOf(kind, v) * v[U], v[T]);
    const units = ((event.clientX - box.left) * (W / box.width) - X0) / scale;
    return Math.ceil(units / v[U] - 1e-9);
  }
  function onPointerDown(event) {
    const el = event.target.closest("[data-sp-bar]");
    if (!el || event.button > 0) return;
    event.preventDefault();
    drag = el.dataset.spBar;
    host.setPointerCapture?.(event.pointerId);
    el.focus({ preventScroll: true });
    setCount(drag, fromPointer(event, el), `sp-drag-${drag}`);
  }
  function onPointerMove(event) {
    if (!drag) return;
    const el = host.querySelector(`[data-sp-bar="${drag}"]`);
    if (el) setCount(drag, fromPointer(event, el), `sp-drag-${drag}`);
  }
  function onPointerUp() {
    if (!drag) return;
    drag = null;
    history.breakRun();
  }
  function onKey(event) {
    const el = event.target.closest?.("[data-sp-bar]");
    if (!el) return;
    const kind = el.dataset.spBar,
      n = data()[kind];
    const next = {
      ArrowRight: n + 1,
      ArrowUp: n + 1,
      ArrowLeft: n - 1,
      ArrowDown: n - 1,
      PageUp: n + 10,
      PageDown: n - 10,
      Home: 0,
      End: maxOf(kind, values()),
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setCount(kind, next, null);
  }
  function twist(on) {
    const plan = twistActive(data(), values()) ? data() : { ...data(), twist: null, limit: null };
    const r = on ? applyTwist(project.id, plan, values()) : revertTwist(plan);
    if (r.error) return announce(r.error === "plan-first" ? t("planFirst") : t("bounds"));
    commit(r.plan, null, on ? `${t("twist")}: ${TWISTS[project.id][lang() ? "es" : "en"]}` : t("undoTwist"));
    if (r.patch) applyDesign(r.patch, null, on ? `${t("twist")}: ${TWISTS[project.id][lang() ? "es" : "en"]}` : t("undoTwist"));
  }
  function onClick(event) {
    const step = event.target.closest("[data-sp-step]");
    if (step)
      return setCount(
        step.dataset.spStep,
        data()[step.dataset.spStep] + Number(step.dataset.dir),
        null,
      );
    const b = event.target.closest("[data-sp-b]");
    if (b) {
      const f = fields.find((x) => x.key === "b"),
        v = values();
      const next = Math.min(f.max, Math.max(f.min, v.b + Number(b.dataset.spB)));
      if (next !== v.b)
        applyDesign({ b: String(next) }, null, `${t("perGroup")} ${w("group", 1)}: ${next}.`);
      return;
    }
    const a = event.target.closest("[data-sp]");
    if (!a) return;
    const name = a.dataset.sp;
    if (name === "twist" || name === "untwist") return twist(name === "twist");
    const next = name === "undo" ? history.undo() : history.redo();
    if (!next) return;
    setData(next);
    save();
    render();
    announce(
      name === "undo"
        ? lang()
          ? "Se deshizo el último cambio del plan."
          : "Undid the last plan change."
        : lang()
          ? "Se rehizo el cambio del plan."
          : "Redid the plan change.",
    );
  }
  function onInput(event) {
    const el = event.target.closest?.("[data-sp-input]");
    if (!el) return;
    const raw = el.value.trim();
    if (/^\d{1,4}$/.test(raw))
      setCount(el.dataset.spInput, Number(raw), `sp-type-${el.dataset.spInput}`);
  }

  return {
    html,
    render,
    attach(section) {
      host = section.querySelector("#sp");
      if (!host) return;
      host.addEventListener("pointerdown", onPointerDown);
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerup", onPointerUp);
      host.addEventListener("pointercancel", onPointerUp);
      host.addEventListener("keydown", onKey);
      host.addEventListener("click", onClick);
      host.addEventListener("input", onInput);
      render();
    },
    detach() {
      host = null;
      drag = null;
    },
    restored(next) {
      setData(next);
      history.record(next, null);
      render();
    },
  };
}
