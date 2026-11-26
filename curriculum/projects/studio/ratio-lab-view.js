/**
 * Ratio lab view (ratio missions). Hosts one station per mission: the Smoothie Bar mixing station
 * (ratio-smoothie-view.js) or the Sports Stats Scout comparator (ratio-scout-view.js), plus the shared
 * linked representations both use: a ratio table and a double number line drawn from the same exact state.
 * Owns the lab's undo/redo, focus-preserving render and event routing. Pure logic lives in ratio-lab.mjs.
 */
import { createHistory } from "./history.mjs";
import { esc, MUTED, ORANGE, TEAL } from "./models-kit.mjs";
import { mul, frac } from "./exact.mjs";
import { MAX_BATCH, guardFor, ratioOf, show, tableRows } from "./ratio-lab.mjs";
import { smoothieStation } from "./ratio-smoothie-view.js";
import { scoutStation } from "./ratio-scout-view.js";

const HIDDEN = [
  "? = one of your mission answers. Check it in Test first.",
  "? = una de las respuestas de tu misión. Primero compruébala en Probar.",
];

export function createRatioLab({
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
  const kind = project.id === "unit-3-b" ? "scout" : "smoothie";
  if (data().kind !== kind) setData({ ...data(), kind });
  const history = createHistory(data());
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const tr = (en, es) => (lang() ? es : en);
  const seen = (id) => getState().role === "teacher" || getState().checked?.[id] === true;
  const field = (k) => fields.find((f) => f.key === k);
  const clampField = (k, v) =>
    Math.min(field(k).max, Math.max(field(k).min, field(k).integer ? Math.round(v) : v));
  let masked = false;

  const ctx = {
    project,
    tr,
    lang,
    values,
    lab: () => data(),
    seen,
    field,
    clampField,
    applyDesign,
    announce,
    /** Print a value, or "?" when it equals an unchecked answer (guard = list of question ids). */
    mask(value, guard) {
      if (guard.some((id) => !seen(id))) {
        masked = true;
        return '<span class="wb-unknown">?</span>';
      }
      return esc(show(value));
    },
    hiddenNote: () => (masked ? `<p class="muted">${HIDDEN[lang()]}</p>` : ""),
    commit(next, tag, message) {
      setData(next);
      history.record(next, tag);
      save();
      render();
      if (message) announce(message);
    },
    stepper(attr, value, label, { min = -Infinity, max = Infinity, extra = "" } = {}) {
      return `<span class="ps-row rl-stepper" role="group" aria-label="${esc(label)}"><button type="button" class="secondary small" ${attr} data-dir="-1" aria-label="${esc(tr("Decrease", "Bajar"))}: ${esc(label)}"${value <= min ? " disabled" : ""}>−</button><output>${esc(String(value))}</output><button type="button" class="secondary small" ${attr} data-dir="1" aria-label="${esc(tr("Increase", "Subir"))}: ${esc(label)}"${value >= max ? " disabled" : ""}>+</button>${extra}</span>`;
    },
    tableMarkup,
    dnlMarkup,
    twistMarkup,
  };
  const station = kind === "scout" ? scoutStation(ctx) : smoothieStation(ctx);

  /* ---------------------------------------------------------------- shared representations */
  function tableMarkup(r, k, names) {
    const rows = tableRows(r, k)
      .map((row) => {
        const cur = row.n === k;
        return `<tr${cur ? ' class="rl-current"' : ""}><th scope="row">${row.n}${cur ? ` <span class="rl-tag">${esc(names.current)}</span>` : ""}</th><td>${ctx.mask(row.A, row.guardA)}</td><td>${ctx.mask(row.B, row.guardB)}</td>${names.total ? `<td>${ctx.mask(row.total, [...row.guardA, ...row.guardB])}</td>` : ""}</tr>`;
      })
      .join("");
    return `<div class="table-scroll"><table class="wb-table rl-table"><caption>${esc(tr("Ratio table: every row multiplies both parts by the same number", "Tabla de razones: cada fila multiplica las dos partes por el mismo número"))}</caption><thead><tr><th scope="col">${esc(names.n)}</th><th scope="col">${esc(names.A)}</th><th scope="col">${esc(names.B)}</th>${names.total ? `<th scope="col">${esc(names.total)}</th>` : ""}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function dnlMarkup(r, k, names) {
    const N = Math.min(MAX_BATCH, Math.max(6, k));
    const x0 = 90,
      x1 = 600,
      step = (x1 - x0) / N;
    let body = `<line x1="${x0}" y1="44" x2="${x1}" y2="44" stroke="${TEAL}" stroke-width="3"/><line x1="${x0}" y1="112" x2="${x1}" y2="112" stroke="${ORANGE}" stroke-width="3"/>`;
    body += `<text x="6" y="48" font-size="13" font-weight="700" fill="${TEAL}">${esc(names.A)}</text><text x="6" y="116" font-size="13" font-weight="700" fill="${ORANGE}">${esc(names.B)}</text>`;
    const labelEvery = N > 10 ? 2 : 1;
    for (let n = 0; n <= N; n++) {
      const x = x0 + n * step;
      body += `<line x1="${x}" y1="36" x2="${x}" y2="52" stroke="${TEAL}" stroke-width="2"/><line x1="${x}" y1="104" x2="${x}" y2="120" stroke="${ORANGE}" stroke-width="2"/>`;
      if (n === k)
        body += `<rect x="${x - 15}" y="56" width="30" height="44" rx="6" fill="none" stroke="${TEAL}" stroke-width="2" stroke-dasharray="4 3"/>`;
      if (n % labelEvery && n !== k) continue;
      let a = "0",
        b = "0";
      if (n) {
        const A = mul(r.a, frac(BigInt(n))), B = mul(r.b, frac(BigInt(n)));
        const ga = guardFor(A, r, ["scale-a"]).filter((id) => !seen(id)), gb = guardFor(B, r, ["scale-b"]).filter((id) => !seen(id));
        if (ga.length || gb.length) masked = true;
        a = ga.length ? "?" : show(A);
        b = gb.length ? "?" : show(B);
      }
      body += `<text x="${x}" y="28" font-size="12" text-anchor="middle" fill="#142c3b"${n === k ? ' font-weight="700"' : ""}>${esc(a)}</text><text x="${x}" y="138" font-size="12" text-anchor="middle" fill="#142c3b"${n === k ? ' font-weight="700"' : ""}>${esc(b)}</text>`;
    }
    const aria = tr(
      `Double number line. ${names.A} and ${names.B} jump together; one jump is ${show(r.a)} and ${show(r.b)}. Your batch count ${k} is boxed.`,
      `Recta numérica doble. ${names.A} y ${names.B} saltan juntos; un salto es ${show(r.a)} y ${show(r.b)}. Tu número de tandas, ${k}, está marcado.`,
    );
    return `<svg class="rl-dnl" viewBox="0 0 620 150" role="img" aria-label="${esc(aria)}"><rect width="620" height="150" fill="#fff"/>${body}</svg><p class="muted rl-cupnote">${esc(tr(`Double number line: ${N} equal jumps on both lines. The dashed box marks ${k}.`, `Recta numérica doble: ${N} saltos iguales en las dos rectas. El recuadro marca ${k}.`))}</p>`;
  }

  function twistMarkup(text) {
    const c = Number(values().c);
    return `<button type="button" class="secondary small" data-rl="twist"${c * 2 > field("c").max ? " disabled" : ""}>${esc(text)}</button>`;
  }

  /* ---------------------------------------------------------------- render + events */
  function render() {
    if (!host) return;
    const body = host.querySelector("#rl-body");
    if (!body) return;
    const r = ratioOf(values());
    if (!r) {
      body.innerHTML = `<p class="muted">${tr("Fix the design numbers to open the lab.", "Corrige los números del diseño para abrir el laboratorio.")}</p>`;
      return;
    }
    masked = false;
    const active = document.activeElement;
    let keep = null;
    if (active && host.contains(active)) {
      const attr = [...active.attributes].find((a) => a.name.startsWith("data-rl"));
      keep = {
        id: active.id,
        attr: attr && [attr.name, attr.value],
        dir: active.dataset.dir,
        caret: active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null,
      };
    }
    const before = station.snapshot?.();
    body.innerHTML = station.markup(r) + ctx.hiddenNote();
    station.afterRender?.(host, before);
    const undo = host.querySelector('[data-rl="undo"]'),
      redo = host.querySelector('[data-rl="redo"]');
    if (undo) undo.disabled = !history.canUndo();
    if (redo) redo.disabled = !history.canRedo();
    if (keep) {
      let next = keep.id ? host.querySelector(`#${CSS.escape(keep.id)}`) : null;
      if (!next && keep.attr)
        next = [...host.querySelectorAll(`[${keep.attr[0]}]`)].find(
          (el) => el.getAttribute(keep.attr[0]) === keep.attr[1] && el.dataset.dir === keep.dir,
        );
      if (next && next.disabled)
        next = next.parentElement?.querySelector("button:not([disabled])") || null;
      if (next) {
        next.focus({ preventScroll: true });
        if (keep.caret && next.setSelectionRange) next.setSelectionRange(...keep.caret);
      }
    }
  }

  function html() {
    const title =
      kind === "scout"
        ? tr("Scouting comparator", "Comparador de estadísticas")
        : tr("Smoothie Bar mixing station", "Estación de mezclas del bar de batidos");
    return `<section class="card fd rl" id="rl" aria-labelledby="rl-h"><h3 id="rl-h">${title}</h3><p>${station.intro()}</p><div id="rl-body"></div><div class="ps-row"><button type="button" class="secondary small" data-rl="undo">${tr("Undo lab", "Deshacer laboratorio")}</button><button type="button" class="secondary small" data-rl="redo">${tr("Redo lab", "Rehacer laboratorio")}</button></div><p id="fd-status" class="notice" role="status"></p></section>`;
  }

  function onClick(event) {
    const el = event.target.closest("button");
    if (!el || !host.contains(el)) return;
    const name = el.dataset.rl;
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (!next) return;
      setData(next);
      save();
      render();
      return announce(
        name === "undo"
          ? tr("Undid the last lab change.", "Se deshizo el último cambio.")
          : tr("Redid the lab change.", "Se rehizo el cambio."),
      );
    }
    if (name === "twist") {
      const c = clampField("c", Number(values().c) * 2);
      return applyDesign(
        { c: String(c) },
        null,
        tr(
          `Scale factor doubled to ${c}. Test the model again.`,
          `El factor de escala se duplicó a ${c}. Vuelve a probar el modelo.`,
        ),
      );
    }
    station.onClick(el);
  }

  return {
    html,
    render,
    attach(section) {
      host = section.querySelector("#rl");
      if (!host) return;
      host.addEventListener("click", onClick);
      host.addEventListener("input", (e) => station.onInput(e.target));
      host.addEventListener("change", (e) => {
        station.onChange?.(e.target);
        history.breakRun();
      });
      render();
    },
    detach() {
      host = null;
    },
    restored(next) {
      setData({ ...next, kind });
      history.record(data(), null);
      render();
    },
  };
}
