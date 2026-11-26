/**
 * Coordinate map designer view (Theme Park Map Designer, Submarine Mission Control).
 * Students drag the mission points A and B (this edits the design numbers through applyDesign, so checks
 * and design undo stay consistent), place attractions or waypoints, connect paths, mirror attractions and
 * read a live leg-by-leg distance log. Every pointer action has a keyboard path. Pure logic: coord-map.mjs.
 */
import {
  CATALOG,
  FENCE,
  LIMIT,
  PARK_KINDS,
  addItem,
  addPath,
  evaluate,
  flipPath,
  flipTrip,
  legText,
  mirrorItem,
  modeOf,
  moveItem,
  nameOf,
  nudgeItem,
  pointOf,
  pointsOf,
  removeItem,
  removePath,
  reorder,
} from "./coord-map.mjs";
import { createHistory } from "./history.mjs";
import { L } from "./coord-map-text.mjs";
import { esc, INK, MINT, MUTED, ORANGE, PEACH, TEAL, BLUE } from "./models-kit.mjs";

const U = 22,
  PAD = 26,
  SIZE = 2 * LIMIT * U + 2 * PAD;
const X = (x) => PAD + (x + LIMIT) * U,
  Y = (y) => PAD + (LIMIT - y) * U;
const sg = (n) => String(n).replace("-", "−");
const pt = (p) => `(${sg(p.x)}, ${sg(p.y)})`;

export function createMapDesigner({
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
  const mode = modeOf(project);
  const sub = mode === "sub";
  let host = null,
    selected = null,
    connectFrom = null,
    connectMode = false,
    drag = null;
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (key) => {
    const v = L[key];
    return Array.isArray(v[0]) ? v[sub ? 1 : 0][lang()] : v[lang()];
  };
  const map = () => {
    const d = data();
    if (d.mode !== mode) setData({ ...d, mode, items: [], paths: [] });
    return data();
  };
  const history = createHistory(map());
  const revealed = (id) => getState().role === "teacher" || getState().checked?.[id] === true;
  const nm = (id) => nameOf(id, map(), lang() ? "es" : "en");
  const field = (k) => fields.find((f) => f.key === k);
  const clampField = (k, v) =>
    String(Math.min(field(k).max, Math.max(field(k).min, Math.round(v))));

  function commit(next, tag, message) {
    setData(next);
    history.record(next, tag);
    save();
    render();
    if (message) announce(message);
  }

  /* ------------------------------------------------------------------ drawing */
  function gridMarkup() {
    let g = "";
    if (sub)
      g += `<rect x="${X(-LIMIT)}" y="${Y(0)}" width="${2 * LIMIT * U}" height="${LIMIT * U}" fill="${MINT}"/>`;
    for (let k = -LIMIT; k <= LIMIT; k++)
      g += `<line x1="${X(k)}" y1="${Y(LIMIT)}" x2="${X(k)}" y2="${Y(-LIMIT)}" stroke="#d5dfda"/><line x1="${X(-LIMIT)}" y1="${Y(k)}" x2="${X(LIMIT)}" y2="${Y(k)}" stroke="#d5dfda"/>`;
    g += `<line x1="${X(-LIMIT)}" y1="${Y(0)}" x2="${X(LIMIT)}" y2="${Y(0)}" stroke="${INK}" stroke-width="2"/><line x1="${X(0)}" y1="${Y(LIMIT)}" x2="${X(0)}" y2="${Y(-LIMIT)}" stroke="${INK}" stroke-width="2"/>`;
    for (let k = -10; k <= 10; k += 2)
      if (k)
        g +=
          label(X(k), Y(0) + 14, sg(k), 10, MUTED) +
          label(X(0) - 5, Y(k) + 4, sg(k), 10, MUTED, false, "end");
    g += `<rect x="${X(-FENCE)}" y="${Y(FENCE)}" width="${2 * FENCE * U}" height="${2 * FENCE * U}" fill="none" stroke="${TEAL}" stroke-width="2" stroke-dasharray="8 5"/>`;
    g += label(
      X(-FENCE) + 4,
      Y(FENCE) - 6,
      sub
        ? lang()
          ? "borde de la carta"
          : "chart edge"
        : lang()
          ? "cerca del parque"
          : "park fence",
      11,
      TEAL,
      true,
      "start",
    );
    if (sub)
      g += label(
        X(LIMIT) - 4,
        Y(0) - 6,
        lang() ? "superficie (profundidad 0)" : "surface (depth 0)",
        11,
        BLUE,
        true,
        "end",
      );
    return g;
  }
  function label(x, y, s, size, fill, bold = false, anchor = "middle") {
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${bold ? ' font-weight="700"' : ""} font-family="inherit">${esc(s)}</text>`;
  }
  function tripMarkup(p, q, legs, shown, warn) {
    let s = "",
      at = p;
    for (const leg of legs) {
      const end = leg.axis === "x" ? { x: leg.to, y: at.y } : { x: at.x, y: leg.to };
      s += `<line x1="${X(at.x)}" y1="${Y(at.y)}" x2="${X(end.x)}" y2="${Y(end.y)}" stroke="${warn ? ORANGE : TEAL}" stroke-width="4" stroke-linecap="round"${warn ? ' stroke-dasharray="7 5"' : ""}/>`;
      const mx = (X(at.x) + X(end.x)) / 2,
        my = (Y(at.y) + Y(end.y)) / 2;
      s += `<rect x="${mx - 13}" y="${my - 10}" width="26" height="18" rx="4" fill="#fff" stroke="${warn ? ORANGE : TEAL}"/>${label(mx, my + 4, shown ? String(leg.length) : "?", 12, INK, true)}`;
      at = end;
    }
    return s;
  }
  function nodeMarkup(id, p, verdict) {
    const it = map().items.find((x) => x.id === id);
    const mission = id === "A" || id === "B";
    const mark = mission ? id : sub ? String(map().items.indexOf(it) + 1) : CATALOG[it.kind].mark;
    const bad =
      verdict.clashes.includes(id) ||
      verdict.outside.includes(id) ||
      (!sub && verdict.unreached.includes(id) && verdict.oneGate);
    const fill = id === "A" ? TEAL : id === "B" ? ORANGE : it.kind === "gate" ? "#fff" : PEACH;
    const ink = mission ? "#fff" : INK;
    const problems = [
      verdict.clashes.includes(id) && (lang() ? "punto repetido" : "shared point"),
      verdict.outside.includes(id) && (lang() ? "fuera" : "outside"),
      !sub &&
        verdict.oneGate &&
        verdict.unreached.includes(id) &&
        (lang() ? "sin ruta" : "no route"),
    ].filter(Boolean);
    const keys = mission
      ? id === "B"
        ? lang()
          ? "Flechas izquierda y derecha: mover B en su fila."
          : "Left and right arrows move B along its row."
        : lang()
          ? "Flechas: mover A."
          : "Arrow keys move A."
      : lang()
        ? "Flechas: mover. Supr: quitar."
        : "Arrow keys move it, Delete removes it.";
    const aria = `${nm(id)} ${pt(p)}.${problems.length ? ` ${problems.join(", ")}.` : ""} ${keys}${connectMode ? (lang() ? " Enter: conectar." : " Enter connects.") : ""}`;
    const sel = selected === id || connectFrom === id;
    const r = 14;
    const lx = p.x > 7 ? -18 : 18;
    return `<g class="cm-node${sel ? " is-selected" : ""}" data-cm-node="${id}" tabindex="0" role="button" aria-pressed="${sel}" aria-label="${esc(aria)}"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="22" fill="transparent"/><circle class="cm-dot" cx="${X(p.x)}" cy="${Y(p.y)}" r="${r}" fill="${fill}" stroke="${bad ? ORANGE : INK}" stroke-width="${sel ? 4 : 2}"${bad ? ' stroke-dasharray="4 3"' : ""}/>${label(X(p.x), Y(p.y) + 4, mark, mark.length > 1 ? 10 : 12, ink, true)}${label(X(p.x) + lx, Y(p.y) - 14, `${problems.length ? "! " : ""}${pt(p)}`, 11, bad ? ORANGE : INK, true, lx < 0 ? "end" : "start")}</g>`;
  }
  function svgMarkup(pts, verdict) {
    let body = gridMarkup();
    if (sub) {
      const hz = verdict.hazard;
      body += `<defs><pattern id="cm-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${PEACH}"/><line x1="0" y1="0" x2="0" y2="8" stroke="${ORANGE}" stroke-width="3"/></pattern></defs><rect x="${X(hz.x0)}" y="${Y(hz.y1)}" width="${(hz.x1 - hz.x0) * U}" height="${(hz.y1 - hz.y0) * U}" fill="url(#cm-hatch)" stroke="${ORANGE}" stroke-width="2"/>${label((X(hz.x0) + X(hz.x1)) / 2, Y(hz.y1) - 6, lang() ? "peligro" : "hazard", 12, ORANGE, true)}`;
      for (const trip of verdict.trips)
        body += tripMarkup(
          trip.p,
          trip.q,
          trip.legs,
          !trip.hidden || revealed(trip.hidden),
          trip.hits,
        );
    } else
      for (const p of verdict.paths)
        body += tripMarkup(
          pointOf(p.from, map(), pts),
          pointOf(p.to, map(), pts),
          p.legs,
          !p.hidden || revealed(p.hidden),
          false,
        );
    body += nodeMarkup("A", pts.A, verdict) + nodeMarkup("B", pts.B, verdict);
    for (const it of map().items) body += nodeMarkup(it.id, it, verdict);
    const desc = sub
      ? `${lang() ? "Carta de coordenadas" : "Coordinate chart"}: ${nm("A")} ${pt(pts.A)}, ${nm("B")} ${pt(pts.B)}, ${map().items.length} ${lang() ? "puntos de ruta" : "waypoints"}.`
      : `${lang() ? "Mapa del parque en cuatro cuadrantes" : "Four-quadrant park map"}: ${nm("A")} ${pt(pts.A)}, ${nm("B")} ${pt(pts.B)}, ${map().items.length} ${lang() ? "atracciones más" : "more attractions"}, ${map().paths.length} ${lang() ? "caminos" : "paths"}.`;
    return `<svg class="cm-svg" viewBox="0 0 ${SIZE} ${SIZE}" role="group" aria-label="${esc(desc)}"><rect width="${SIZE}" height="${SIZE}" fill="#fff"/>${body}</svg>`;
  }

  /* ------------------------------------------------------------------ panels */
  function legsHTML(legs, shown) {
    return (
      legs
        .map(
          (l) =>
            `${l.axis === "x" ? (lang() ? "horizontal" : "across") : lang() ? "vertical" : "up/down"} ${legText(l, shown)}`,
        )
        .join("; ") || (lang() ? "mismo punto" : "same point")
    );
  }
  function logMarkup(verdict) {
    const small = (attr, text, aria) =>
      `<button type="button" class="secondary small" ${attr} aria-label="${esc(aria)}">${esc(text)}</button>`;
    if (sub) {
      const anyHidden =
        verdict.trips.some((x) => x.hidden && !revealed(x.hidden)) ||
        (verdict.total === Math.abs(values().c - values().a) && !revealed("distance"));
      const rows = verdict.trips.map((trip) => {
        const shown = !trip.hidden || revealed(trip.hidden);
        return `<li><strong>${esc(nm(trip.from))} → ${esc(nm(trip.to))}</strong>: ${esc(legsHTML(trip.legs, shown))}. <strong>${shown ? trip.length : "?"}</strong> ${lang() ? "unidades" : "units"}${trip.hits ? ` <span class="cm-warn">! ${lang() ? "entra al peligro" : "enters the hazard"}</span>` : ""} ${trip.legs.length > 1 ? small(`data-cm-flip="${trip.to}"`, t("flip"), `${t("flip")}: ${nm(trip.from)} → ${nm(trip.to)}`) : ""}</li>`;
      });
      return `<ol class="cm-log">${rows.join("")}</ol>${map().items.length ? "" : `<p class="muted">${t("noPaths")}</p>`}<p><strong>${t("total")}:</strong> ${anyHidden ? "?" : verdict.total} ${lang() ? "unidades" : "units"}</p>`;
    }
    if (!verdict.paths.length) return `<p class="muted">${t("noPaths")}</p>`;
    return `<ul class="cm-log">${verdict.paths
      .map((p) => {
        const shown = !p.hidden || revealed(p.hidden);
        return `<li><strong>${esc(nm(p.from))} — ${esc(nm(p.to))}</strong>: ${esc(legsHTML(p.legs, shown))}. <strong>${shown ? p.length : "?"}</strong> ${lang() ? "unidades" : "units"} ${p.legs.length < 2 ? "" : small(`data-cm-flip="${p.id}"`, t("flip"), `${t("flip")}: ${nm(p.from)} — ${nm(p.to)}`)}${small(`data-cm-unpath="${p.id}"`, t("remove"), `${t("remove")}: ${nm(p.from)} — ${nm(p.to)}`)}</li>`;
      })
      .join("")}</ul>`;
  }
  function checksMarkup(verdict) {
    const row = (ok, text) =>
      `<li class="${ok ? "cm-ok" : "cm-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> ${esc(text)} <span class="sr-only">${ok ? (lang() ? "sí" : "yes") : lang() ? "todavía no" : "not yet"}</span></li>`;
    const extra = sub ? row(verdict.safe, t("safe")) : row(verdict.routes, t("routes"));
    const mirrors =
      !sub && verdict.mirrors.length
        ? `<p class="muted">${verdict.mirrors.map((m) => `${esc(nm(m.id))}: ${lang() ? "reflejo de" : "mirror of"} ${esc(nm(m.of))} (${m.axis}) ${m.holds ? "✓" : lang() ? "✗ ya no coincide" : "✗ no longer mirrored"}`).join(" · ")}</p>`
        : "";
    return `<ul class="cm-checklist">${row(verdict.distinct, t("distinct"))}${row(verdict.inside, t("inside"))}${extra}</ul>${mirrors}`;
  }
  function selectedMarkup() {
    const id = selected;
    if (!id) return `<p class="muted">${t("none")}</p>`;
    const pts = pointsOf(values());
    const p = pointOf(id, map(), pts);
    if (!p) return `<p class="muted">${t("none")}</p>`;
    const btn = (attr, text, aria = text) =>
      `<button type="button" class="secondary small" ${attr} aria-label="${esc(aria)}">${esc(text)}</button>`;
    const arrows = [
      ["←", -1, 0, ["Move left", "Mover a la izquierda"]],
      ["↑", 0, 1, ["Move up", "Mover arriba"]],
      ["↓", 0, -1, ["Move down", "Mover abajo"]],
      ["→", 1, 0, ["Move right", "Mover a la derecha"]],
    ]
      .filter(([, , dy]) => !(id === "B" && dy))
      .map(([s, dx, dy, n]) => btn(`data-cm-nudge="${dx},${dy}"`, s, n[lang()]))
      .join("");
    let more = "";
    if (id === "A" || id === "B") more = `<p class="muted">${t("missionPt")}</p>`;
    else if (sub)
      more =
        btn('data-cm="earlier"', t("earlier")) +
        btn('data-cm="later"', t("later")) +
        btn('data-cm="remove"', t("remove"));
    else
      more =
        btn('data-cm="mirror-y"', t("mirrorY")) +
        btn('data-cm="mirror-x"', t("mirrorX")) +
        btn('data-cm="remove"', t("remove"));
    return `<p><strong>${t("selected")}:</strong> ${esc(nm(id))} ${pt(p)}</p><div class="cm-row">${arrows}${more}</div>`;
  }
  function pathPicker() {
    if (sub) return "";
    const opts = ["A", "B", ...map().items.map((it) => it.id)]
      .map((id) => `<option value="${id}">${esc(nm(id))}</option>`)
      .join("");
    return `<div class="cm-picker"><label for="cm-from">${t("from")}</label><select id="cm-from">${opts}</select><label for="cm-to">${t("to")}</label><select id="cm-to">${opts.replace('value="B"', 'value="B" selected')}</select><button type="button" class="secondary small" data-cm="path">${t("addPath")}</button><label class="cm-toggle"><input type="checkbox" data-cm-connect ${connectMode ? "checked" : ""}> ${t("connect")}</label></div>`;
  }

  function render() {
    if (!host) return;
    const stage = host.querySelector("#cm-stage");
    const pts = pointsOf(values());
    if (!pts) {
      stage.innerHTML = `<p class="muted">${lang() ? "Corrige los números del diseño para ver el mapa." : "Fix the design numbers to see the map."}</p>`;
      return;
    }
    if (selected && !pointOf(selected, map(), pts)) selected = null;
    const active = document.activeElement;
    const focusId =
      active && host.contains(active) && active.dataset.cmNode ? active.dataset.cmNode : null;
    const verdict = evaluate(map(), pts);
    stage.innerHTML = svgMarkup(pts, verdict);
    host.querySelector("#cm-checks").innerHTML = checksMarkup(verdict);
    host.querySelector("#cm-log").innerHTML = logMarkup(verdict);
    host.querySelector("#cm-selected").innerHTML = selectedMarkup();
    const picker = host.querySelector("#cm-picker");
    if (picker && !picker.contains(document.activeElement)) picker.innerHTML = pathPicker();
    const tw = host.querySelector('[data-cm="twist"]');
    if (tw) tw.disabled = !revealed("reflect-x");
    host.querySelector("#cm-twist-note").textContent = revealed("reflect-x")
      ? ""
      : t("twistLocked");
    host.querySelector('[data-cm="undo"]').disabled = !history.canUndo();
    host.querySelector('[data-cm="redo"]').disabled = !history.canRedo();
    if (focusId) host.querySelector(`[data-cm-node="${focusId}"]`)?.focus({ preventScroll: true });
  }

  function html() {
    const kinds = sub ? ["wp"] : PARK_KINDS;
    const adds = kinds
      .map(
        (k) =>
          `<button type="button" class="secondary small" data-cm-add="${k}">+ ${esc(CATALOG[k][lang() ? "es" : "en"])}</button>`,
      )
      .join("");
    return `<section class="card cm" id="cm" aria-labelledby="cm-h"><h3 id="cm-h">${t("title")}</h3><p>${t("intro")}</p><div class="cm-row" role="group" aria-label="${t("add")}">${adds}</div><div class="cm-layout"><div id="cm-stage" class="cm-stage"></div><div class="cm-side"><div><h4>${t("checks")}</h4><div id="cm-checks" aria-live="polite"></div><div id="cm-selected"></div><div class="cm-row"><button type="button" class="secondary small" data-cm="undo">${t("undo")}</button><button type="button" class="secondary small" data-cm="redo">${t("redo")}</button></div><p id="fd-status" class="notice" role="status"></p></div><div><h4>${t("log")}</h4><p class="muted">${t("hiddenNote")}</p><div id="cm-log"></div><div id="cm-picker">${pathPicker()}</div><div class="cm-row"><button type="button" class="secondary small" data-cm="twist">${t("twist")}</button></div><p id="cm-twist-note" class="muted"></p></div></div></div></section>`;
  }

  /* ------------------------------------------------------------------ editing */
  function moveNode(id, x, y, tag) {
    const pts = pointsOf(values());
    if (!pts) return;
    if (id === "A") {
      const patch = { a: clampField("a", x), b: clampField("b", y) };
      if (patch.a !== String(pts.a) || patch.b !== String(pts.b))
        applyDesign(patch, tag, `${nm("A")} (${sg(patch.a)}, ${sg(patch.b)}).`);
    } else if (id === "B") {
      const c = clampField("c", x);
      if (c !== String(pts.c)) applyDesign({ c }, tag, `${nm("B")} (${sg(c)}, ${sg(pts.b)}).`);
    } else {
      const next = moveItem(map(), id, x, y);
      const it = next.items.find((i) => i.id === id);
      const old = map().items.find((i) => i.id === id);
      if (it.x !== old.x || it.y !== old.y) commit(next, tag, `${nm(id)} ${pt(it)}.`);
    }
  }
  function nudge(id, dx, dy) {
    const pts = pointsOf(values());
    const p = pts && pointOf(id, map(), pts);
    if (!p) return;
    if (id === "A" || id === "B") return moveNode(id, p.x + dx, p.y + dy, null);
    const next = nudgeItem(map(), id, dx, dy);
    commit(next, `cm-nudge-${id}`, `${nm(id)} ${pt(next.items.find((i) => i.id === id))}.`);
  }
  function linkTo(id) {
    if (!connectFrom) {
      connectFrom = id;
      render();
      return announce(t("connecting"));
    }
    const from = connectFrom;
    connectFrom = null;
    makePath(from, id);
  }
  function makePath(from, to) {
    const r = addPath(map(), from, to);
    if (r.error) {
      render();
      return announce(t(r.error === "full" ? "pathsFull" : r.error));
    }
    commit(r.data, null, `${lang() ? "Camino" : "Path"} ${nm(from)} — ${nm(to)}.`);
  }
  function act(name) {
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (!next) return;
      setData(next);
      save();
      render();
      return announce(
        name === "undo"
          ? lang()
            ? "Se deshizo el último cambio del mapa."
            : "Undid the last map change."
          : lang()
            ? "Se rehizo el cambio del mapa."
            : "Redid the map change.",
      );
    }
    if (name === "path")
      return makePath(host.querySelector("#cm-from").value, host.querySelector("#cm-to").value);
    if (name === "twist") {
      const pts = pointsOf(values());
      if (!pts || !revealed("reflect-x")) return announce(t("twistLocked"));
      return applyDesign(
        { a: String(-pts.a) },
        null,
        lang()
          ? "A se movió al otro lado del eje y. Recalcula la distancia en Probar."
          : "A moved across the y-axis. Recalculate the distance in Test.",
      );
    }
    const id = selected;
    if (!id || id === "A" || id === "B") return;
    if (name === "remove") {
      selected = null;
      return commit(removeItem(map(), id), null, `${nm(id)} ${lang() ? "quitado" : "removed"}.`);
    }
    if (name === "earlier" || name === "later")
      return commit(
        reorder(map(), id, name === "earlier" ? -1 : 1),
        null,
        `${nm(id)}: ${map().items.findIndex((i) => i.id === id) + 1}`,
      );
    if (name === "mirror-y" || name === "mirror-x") {
      const r = mirrorItem(map(), id, name === "mirror-y" ? "y" : "x", pointsOf(values()));
      if (r.error)
        return announce(
          t(r.error === "on-axis" ? "onAxis" : r.error === "taken" ? "taken" : "full"),
        );
      selected = r.item.id;
      commit(r.data, null, `${nm(r.item.id)} ${pt(r.item)}.`);
    }
  }

  /* ------------------------------------------------------------------ events */
  function toGrid(event) {
    const box = host.querySelector("#cm-stage svg").getBoundingClientRect();
    const k = SIZE / box.width;
    return {
      x: Math.round(((event.clientX - box.left) * k - PAD) / U - LIMIT),
      y: Math.round(LIMIT - ((event.clientY - box.top) * k - PAD) / U),
    };
  }
  function onPointerDown(event) {
    const el = event.target.closest("[data-cm-node]");
    if (!el || event.button > 0) return;
    event.preventDefault();
    const id = el.dataset.cmNode;
    if (connectMode) return linkTo(id);
    selected = id;
    drag = { id, moved: false };
    host.querySelector("#cm-stage").setPointerCapture?.(event.pointerId);
    render();
    host.querySelector(`[data-cm-node="${id}"]`)?.focus({ preventScroll: true });
  }
  function onPointerMove(event) {
    if (!drag) return;
    const g = toGrid(event);
    if (drag.last && drag.last.x === g.x && drag.last.y === g.y) return;
    drag.last = g;
    drag.moved = true;
    moveNode(drag.id, g.x, g.y, `cm-drag-${drag.id}`);
  }
  function onPointerUp() {
    if (!drag) return;
    drag = null;
    history.breakRun();
    render();
  }
  function onKey(event) {
    const el = event.target.closest?.("[data-cm-node]");
    if (!el) return;
    const id = el.dataset.cmNode;
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
      event.key
    ];
    if (dir) {
      event.preventDefault();
      selected = id;
      return nudge(id, dir[0], dir[1]);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (connectMode) return linkTo(id);
      selected = id;
      return render();
    }
    if ((event.key === "Delete" || event.key === "Backspace") && id !== "A" && id !== "B") {
      event.preventDefault();
      selected = id;
      act("remove");
      host.querySelector("#cm-stage svg")?.focus?.();
    }
  }
  function onClick(event) {
    const add = event.target.closest("[data-cm-add]");
    if (add) {
      const pts = pointsOf(values());
      if (!pts) return;
      const r = addItem(map(), add.dataset.cmAdd, pts);
      if (r.error) return announce(t(r.error === "full" ? "full" : "noRoom"));
      selected = r.item.id;
      commit(r.data, null, `${nm(r.item.id)} ${lang() ? "agregado" : "added"} ${pt(r.item)}.`);
      return host.querySelector(`[data-cm-node="${r.item.id}"]`)?.focus({ preventScroll: true });
    }
    const flip = event.target.closest("[data-cm-flip]");
    if (flip)
      return commit(
        sub ? flipTrip(map(), flip.dataset.cmFlip) : flipPath(map(), flip.dataset.cmFlip),
        null,
        lang() ? "Esquina cambiada." : "Corner flipped.",
      );
    const un = event.target.closest("[data-cm-unpath]");
    if (un)
      return commit(
        removePath(map(), un.dataset.cmUnpath),
        null,
        lang() ? "Camino quitado." : "Path removed.",
      );
    const n = event.target.closest("[data-cm-nudge]");
    if (n && selected) {
      const [dx, dy] = n.dataset.cmNudge.split(",").map(Number);
      return nudge(selected, dx, dy);
    }
    const b = event.target.closest("[data-cm]");
    if (b) act(b.dataset.cm);
  }

  return {
    html,
    render,
    attach(section) {
      host = section.querySelector("#cm");
      if (!host) return;
      const stage = host.querySelector("#cm-stage");
      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerup", onPointerUp);
      stage.addEventListener("pointercancel", onPointerUp);
      host.addEventListener("keydown", onKey);
      host.addEventListener("click", onClick);
      host.addEventListener("change", (e) => {
        if (!e.target.matches("[data-cm-connect]")) return;
        connectMode = e.target.checked;
        connectFrom = null;
        render();
      });
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
