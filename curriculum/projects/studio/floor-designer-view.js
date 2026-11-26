/**
 * Floor-plan designer view: a direct-manipulation editor for the area missions.
 * Students drag the walls and the nook to change the design numbers (the same fields the Build form
 * edits, through the workbench's applyDesign, so checks and undo stay consistent), and place furniture
 * that is judged live against the mission constraint. Every pointer action has a keyboard equivalent.
 * Pure logic lives in floor-designer.mjs.
 */
import {
  CATALOG,
  DOOR,
  GRID,
  TYPES,
  addItem,
  evaluate,
  nameOf,
  nudgeItem,
  removeItem,
  roomOf,
  rotateItem,
  sizeOf,
  moveItem,
} from "./floor-designer.mjs";
import { createHistory } from "./history.mjs";
import { esc, f2, INK, LIME, MINT, MUTED, ORANGE, PEACH, TEAL } from "./models-kit.mjs";

const W = 640,
  PAD = 40;
const L = {
  title: ["Floor-plan designer", "Diseñador de planos"],
  intro: [
    "Drag a wall handle to resize the room, or focus it and use the arrow keys. Add furniture, then move it the same way. Each grid square is 1 m by 1 m.",
    "Arrastra una manija de la pared para cambiar el tamaño del cuarto, o selecciónala y usa las flechas. Agrega muebles y muévelos igual. Cada cuadrado de la cuadrícula mide 1 m por 1 m.",
  ],
  add: ["Add furniture", "Agrega muebles"],
  undo: ["Undo layout", "Deshacer plano"],
  redo: ["Redo layout", "Rehacer plano"],
  path: ["Show the 1 m walking path", "Muestra el camino de 1 m"],
  rotate: ["Rotate", "Girar"],
  remove: ["Remove", "Quitar"],
  selected: ["Selected", "Seleccionado"],
  none: [
    "Select a piece of furniture to rotate, remove or move it with these buttons.",
    "Selecciona un mueble para girarlo, quitarlo o moverlo con estos botones.",
  ],
  checks: ["Constraint check", "Revisión de condiciones"],
  inside: ["Every item is inside the walls", "Cada mueble está dentro de las paredes"],
  overlap: ["No two items overlap", "Ningún mueble se encima con otro"],
  pathOk: [
    "A 1 m wide path reaches every item from the door",
    "Un camino de 1 m llega a cada mueble desde la puerta",
  ],
  foot: ["Furniture footprint", "Superficie ocupada por los muebles"],
  open: ["Open floor left", "Piso libre"],
  openHidden: [
    "? m² — match the combined floor area in Test first",
    "? m² — primero comprueba el área combinada en Probar",
  ],
  empty: [
    "No furniture yet. Add a piece to test the plan.",
    "Todavía no hay muebles. Agrega uno para probar el plano.",
  ],
  full: [
    "The plan already has 16 items. Remove one first.",
    "El plano ya tiene 16 muebles. Quita uno primero.",
  ],
  noRoom: [
    "There is no free space for that item. Make the room larger or move something.",
    "No hay espacio libre para ese mueble. Agranda el cuarto o mueve algo.",
  ],
};

export function createFloorDesigner({
  project,
  fields,
  getState,
  save,
  applyDesign,
  announce,
  values,
}) {
  let host = null;
  let selected = null;
  let showPath = true;
  let drag = null;
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (key) => L[key][lang()];
  const layout = () => getState().workbench.layout;
  const history = createHistory(layout() || []);
  const limit = (key, v) => {
    const f = fields.find((x) => x.key === key);
    return Math.min(f.max, Math.max(f.min, Math.round(v / GRID) * GRID));
  };

  function setLayout(next, tag, message) {
    const s = getState();
    s.workbench.layout = next;
    history.record(next, tag);
    save();
    render();
    if (message) announce(message);
  }

  const frameFor = (room) => {
    const bw = room.a + room.c,
      bh = Math.max(room.b, room.d);
    const u = Math.min((W - 2 * PAD) / bw, 380 / bh);
    return { bw, bh, u, h: bh * u + 2 * PAD };
  };

  function svgMarkup(room, frame, verdict, { interactive = true } = {}) {
    const { u, bh } = frame;
    const X = (m) => PAD + m * u,
      Y = (m) => PAD + (bh - m) * u;
    const { a, b, c, d } = room;
    const outline = [
      [0, 0],
      [a + c, 0],
      [a, d],
      [a, b],
      [0, b],
    ]
      .map(([x, y]) => `${f2(X(x))},${f2(Y(y))}`)
      .join(" ");
    let body = `<defs><clipPath id="fd-clip"><polygon points="${outline}"/></clipPath><pattern id="fd-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${PEACH}"/><line x1="0" y1="0" x2="0" y2="8" stroke="${ORANGE}" stroke-width="3"/></pattern></defs>`;
    body += `<polygon points="${outline}" fill="#fff"/>`;
    if (showPath && verdict) {
      let cells = "";
      verdict.reach.forEach((row, r) =>
        row.forEach((on, ci) => {
          if (on)
            cells += `<rect x="${f2(X(ci * GRID))}" y="${f2(Y((r + 1) * GRID))}" width="${f2(GRID * u)}" height="${f2(GRID * u)}" fill="${MINT}"/>`;
        }),
      );
      body += `<g clip-path="url(#fd-clip)">${cells}</g>`;
    }
    let grid = "";
    for (let x = 1; x < frame.bw; x++)
      grid += `<line x1="${f2(X(x))}" y1="${f2(Y(bh))}" x2="${f2(X(x))}" y2="${f2(Y(0))}" stroke="#b9c8c0" stroke-width="1"/>`;
    for (let y = 1; y < bh; y++)
      grid += `<line x1="${f2(X(0))}" y1="${f2(Y(y))}" x2="${f2(X(frame.bw))}" y2="${f2(Y(y))}" stroke="#b9c8c0" stroke-width="1"/>`;
    body += `<g clip-path="url(#fd-clip)">${grid}</g>`;
    body += `<line x1="${f2(X(a))}" y1="${f2(Y(0))}" x2="${f2(X(a))}" y2="${f2(Y(Math.min(b, d)))}" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    body += `<polygon points="${outline}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
    // Door: a gap in the bottom wall with its swing.
    body += `<line x1="${f2(X(DOOR.x0))}" y1="${f2(Y(0))}" x2="${f2(X(DOOR.x1))}" y2="${f2(Y(0))}" stroke="#fff" stroke-width="7"/>`;
    body += `<path d="M ${f2(X(DOOR.x0))} ${f2(Y(0))} L ${f2(X(DOOR.x0))} ${f2(Y(1))} A ${f2(u)} ${f2(u)} 0 0 1 ${f2(X(DOOR.x1))} ${f2(Y(0))}" fill="none" stroke="${MUTED}" stroke-width="1.5"/>`;
    body += label(X(DOOR.x0 + 0.5), Y(0) + 26, lang() ? "puerta" : "door", 12, MUTED);
    // Dimensions (the student's own inputs, never a computed answer).
    body += label(X(a / 2), Y(0) + 26, `${f2(a)} m`, 13, INK, true);
    body += label(X(0) - 8, Y(b / 2) + 4, `${f2(b)} m`, 13, INK, true, "end");
    body += label(X(a + c / 2), Y(0) + 26, `${f2(c)} m`, 13, ORANGE, true);
    body += label(
      X(a) + 8,
      Y(Math.min(d, b) / 2 + (d > b ? d - b : 0) / 2 + 0.2),
      `${f2(d)} m`,
      13,
      ORANGE,
      true,
      "start",
    );
    for (const it of layout()) body += itemMarkup(it, room, verdict, X, Y, u, interactive);
    if (interactive) {
      body += handle(
        "ab",
        X(a),
        Y(b),
        lang()
          ? `Esquina del cuarto: largo ${f2(a)} m, ancho ${f2(b)} m. Flechas izquierda y derecha cambian el largo; arriba y abajo, el ancho.`
          : `Room corner: length ${f2(a)} m, width ${f2(b)} m. Left and right arrows change the length; up and down change the width.`,
      );
      body += handle(
        "c",
        X(a + c),
        Y(0),
        lang()
          ? `Punta del rincón: base ${f2(c)} m. Flechas izquierda y derecha.`
          : `Nook tip: base ${f2(c)} m. Left and right arrows change it.`,
      );
      body += handle(
        "d",
        X(a),
        Y(d),
        lang()
          ? `Cima del rincón: altura ${f2(d)} m. Flechas arriba y abajo.`
          : `Nook peak: perpendicular height ${f2(d)} m. Up and down arrows change it.`,
      );
    }
    const desc = lang()
      ? `Plano: rectángulo de ${f2(a)} m por ${f2(b)} m y un rincón triangular de base ${f2(c)} m y altura ${f2(d)} m. ${layout().length} muebles.`
      : `Floor plan: a ${f2(a)} m by ${f2(b)} m rectangle with a triangular nook, base ${f2(c)} m and perpendicular height ${f2(d)} m, against its right wall. ${layout().length} pieces of furniture.`;
    return `<svg class="fd-svg" viewBox="0 0 ${W} ${f2(frame.h)}" role="group" aria-label="${esc(desc)}" style="overflow:visible"><rect width="${W}" height="${f2(frame.h)}" fill="#f7faf8"/>${body}</svg>`;
  }

  function label(x, y, s, size, fill, bold = false, anchor = "middle") {
    return `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${bold ? 'font-weight="700"' : ""} font-family="inherit">${esc(s)}</text>`;
  }
  function handle(kind, x, y, aria) {
    return `<g class="fd-handle" data-fd-handle="${kind}" tabindex="0" role="button" aria-label="${esc(aria)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="22" fill="transparent"/><circle class="fd-knob" cx="${f2(x)}" cy="${f2(y)}" r="10" fill="#fff" stroke="${TEAL}" stroke-width="4"/></g>`;
  }
  function itemMarkup(it, room, verdict, X, Y, u, interactive) {
    const { w, h } = sizeOf(it, room);
    const v = verdict?.items.find((x) => x.id === it.id);
    const problems = v
      ? [
          !v.inside && (lang() ? "fuera" : "outside"),
          v.overlaps.length && (lang() ? "se encima" : "overlap"),
          v.inside && !v.reachable && (lang() ? "sin camino" : "no path"),
        ].filter(Boolean)
      : [];
    const x = X(it.x),
      y = Y(it.y + h),
      pw = w * u,
      ph = h * u;
    const sel = it.id === selected;
    const fill = v && v.overlaps.length ? "url(#fd-hatch)" : it.type === "storage" ? LIME : PEACH;
    const stroke = problems.length ? ORANGE : TEAL;
    const dash = problems.length ? 'stroke-dasharray="6 4"' : "";
    const name = nameOf(it, lang() ? "es" : "en");
    const aria = `${name}, ${f2(w)} m × ${f2(h)} m, ${f2(it.x)} m ${lang() ? "desde la pared izquierda" : "from the left wall"}, ${f2(it.y)} m ${lang() ? "desde la pared de la puerta" : "from the door wall"}.${problems.length ? ` ${problems.join(", ")}.` : ""} ${lang() ? "Flechas: mover. R: girar. Supr: quitar." : "Arrow keys move it, R rotates, Delete removes."}`;
    const short = name.split(" (")[0];
    const fits = pw > 46 && ph > 22;
    const attrs = interactive
      ? `tabindex="0" role="button" aria-pressed="${sel}" aria-label="${esc(aria)}"`
      : `role="img" aria-label="${esc(aria)}"`;
    return `<g class="fd-item${sel ? " is-selected" : ""}" data-fd-item="${it.id}" ${attrs}><rect x="${f2(x)}" y="${f2(y)}" width="${f2(pw)}" height="${f2(ph)}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sel ? 4 : 2}" ${dash}/>${fits ? label(x + pw / 2, y + ph / 2 + 4, short, Math.min(13, Math.max(10, ph / 2.4)), INK, true) : ""}${problems.length ? label(x + pw / 2, y - 5, `! ${problems.join(" · ")}`, 11, ORANGE, true) : ""}</g>`;
  }

  function checksMarkup(room, verdict) {
    const s = getState();
    if (!verdict.count) return `<p class="muted">${t("empty")}</p>`;
    const row = (ok, text) =>
      `<li class="${ok ? "fd-ok" : "fd-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> ${esc(text)} <span class="sr-only">${ok ? (lang() ? "sí" : "yes") : lang() ? "todavía no" : "not yet"}</span></li>`;
    const revealed = s.role === "teacher" || s.checked?.composite === true;
    const composite = room.a * room.b + (room.c * room.d) / 2;
    const placed = layout().filter(
      (it, i) => verdict.items[i].inside && !verdict.items[i].overlaps.length,
    );
    const used = placed.reduce((sum, it) => {
      const { w, h } = sizeOf(it, room);
      return sum + w * h;
    }, 0);
    return `<ul class="fd-checklist">${row(verdict.inside, t("inside"))}${row(verdict.noOverlap, t("overlap"))}${row(verdict.path, t("pathOk"))}</ul><p><strong>${t("foot")}:</strong> ${f2(verdict.footprint)} m²</p><p><strong>${t("open")}:</strong> ${revealed ? `${f2(composite - used)} m²` : t("openHidden")}</p>`;
  }

  function controlsMarkup(room) {
    const sel = layout().find((it) => it.id === selected);
    const arrows = [
      ["left", "←", -1, 0],
      ["up", "↑", 0, 1],
      ["down", "↓", 0, -1],
      ["right", "→", 1, 0],
    ];
    const moveName = {
      left: ["Move left", "Mover a la izquierda"],
      up: ["Move up", "Mover arriba"],
      down: ["Move down", "Mover abajo"],
      right: ["Move right", "Mover a la derecha"],
    };
    const selBlock = sel
      ? `<p><strong>${t("selected")}:</strong> ${esc(nameOf(sel, lang() ? "es" : "en"))} (${f2(sizeOf(sel, room).w)} m × ${f2(sizeOf(sel, room).h)} m)</p><div class="fd-row">${arrows.map(([k, sym, dx, dy]) => `<button type="button" class="secondary small" data-fd-nudge="${dx},${dy}" aria-label="${moveName[k][lang()]}">${sym}</button>`).join("")}<button type="button" class="secondary small" data-fd="rotate">${t("rotate")}</button><button type="button" class="secondary small" data-fd="remove">${t("remove")}</button></div>`
      : `<p class="muted">${t("none")}</p>`;
    return selBlock;
  }

  function render() {
    if (!host) return;
    const stage = host.querySelector("#fd-stage");
    const room = roomOf(values());
    if (!stage) return;
    if (!room) {
      stage.innerHTML = `<p class="muted">${lang() ? "Corrige los números del diseño para ver el plano." : "Fix the design numbers to see the plan."}</p>`;
      return;
    }
    if (selected && !layout().some((it) => it.id === selected)) selected = null;
    const active = document.activeElement;
    const focusKey =
      active && host.contains(active)
        ? active.dataset.fdItem
          ? `[data-fd-item="${active.dataset.fdItem}"]`
          : active.dataset.fdHandle
            ? `[data-fd-handle="${active.dataset.fdHandle}"]`
            : null
        : null;
    const verdict = evaluate(layout(), room);
    const frame = drag?.frame || frameFor(room);
    stage.innerHTML = svgMarkup(room, frame, verdict);
    host.querySelector("#fd-checks").innerHTML = checksMarkup(room, verdict);
    host.querySelector("#fd-selected").innerHTML = controlsMarkup(room);
    const undo = host.querySelector('[data-fd="undo"]'),
      redo = host.querySelector('[data-fd="redo"]');
    if (undo) undo.disabled = !history.canUndo();
    if (redo) redo.disabled = !history.canRedo();
    if (focusKey) host.querySelector(focusKey)?.focus({ preventScroll: true });
  }

  function html() {
    const addButtons = TYPES.map(
      (type) =>
        `<button type="button" class="secondary small" data-fd-add="${type}">+ ${esc(CATALOG[type][lang() ? "es" : "en"])}</button>`,
    ).join("");
    return `<section class="card fd" id="fd" aria-labelledby="fd-h"><h3 id="fd-h">${t("title")}</h3><p>${t("intro")}</p><div class="fd-row" role="group" aria-label="${t("add")}">${addButtons}</div><div class="fd-layout"><div id="fd-stage" class="fd-stage"></div><div class="fd-side"><h4>${t("checks")}</h4><div id="fd-checks" aria-live="polite"></div><div id="fd-selected"></div><div class="fd-row"><button type="button" class="secondary small" data-fd="undo">${t("undo")}</button><button type="button" class="secondary small" data-fd="redo">${t("redo")}</button></div><p id="fd-status" class="notice" role="status"></p><label class="fd-toggle"><input type="checkbox" data-fd-path ${showPath ? "checked" : ""}> ${t("path")}</label></div></div></section>`;
  }

  /* ---------------------------------------------------------------- interaction */
  function toMeters(event, frame) {
    const svg = host.querySelector("#fd-stage svg");
    const box = svg.getBoundingClientRect();
    const k = W / box.width;
    const px = (event.clientX - box.left) * k,
      py = (event.clientY - box.top) * k;
    return { x: (px - PAD) / frame.u, y: frame.bh - (py - PAD) / frame.u };
  }
  function handlePatch(kind, m, room) {
    if (kind === "ab") return { a: String(limit("a", m.x)), b: String(limit("b", m.y)) };
    if (kind === "c") return { c: String(limit("c", m.x - room.a)) };
    return { d: String(limit("d", m.y)) };
  }
  function applyHandle(kind, patch) {
    const s = getState();
    const changed = Object.entries(patch).some(([k, v]) => String(s.design[k]) !== v);
    if (!changed) return;
    const msg =
      kind === "ab"
        ? `${lang() ? "Cuarto" : "Room"} ${patch.a} m × ${patch.b} m.`
        : kind === "c"
          ? `${lang() ? "Base del rincón" : "Nook base"} ${patch.c} m.`
          : `${lang() ? "Altura del rincón" : "Nook height"} ${patch.d} m.`;
    applyDesign(patch, `fd-${kind}`, msg);
  }

  function onPointerDown(event) {
    const room = roomOf(values());
    if (!room || event.button > 0) return;
    const itemEl = event.target.closest("[data-fd-item]");
    const handleEl = event.target.closest("[data-fd-handle]");
    if (!itemEl && !handleEl) return;
    event.preventDefault();
    const frame = frameFor(room);
    const start = toMeters(event, frame);
    if (itemEl) {
      const it = layout().find((x) => x.id === itemEl.dataset.fdItem);
      if (!it) return;
      selected = it.id;
      drag = {
        kind: "item",
        id: it.id,
        start,
        origin: { x: it.x, y: it.y },
        frame,
        before: JSON.stringify(layout()),
      };
    } else drag = { kind: handleEl.dataset.fdHandle, frame };
    host.querySelector("#fd-stage").setPointerCapture?.(event.pointerId);
    render();
    host
      .querySelector(itemEl ? `[data-fd-item="${drag.id}"]` : `[data-fd-handle="${drag.kind}"]`)
      ?.focus({ preventScroll: true });
  }
  function onPointerMove(event) {
    if (!drag) return;
    const room = roomOf(values());
    if (!room) return;
    const m = toMeters(event, drag.frame);
    if (drag.kind === "item") {
      const it = layout().find((x) => x.id === drag.id);
      const nx = drag.origin.x + (m.x - drag.start.x),
        ny = drag.origin.y + (m.y - drag.start.y);
      const next = moveItem(layout(), drag.id, nx, ny);
      const moved = next.find((x) => x.id === drag.id);
      if (it && (moved.x !== it.x || moved.y !== it.y)) {
        getState().workbench.layout = next;
        render();
      }
    } else applyHandle(drag.kind, handlePatch(drag.kind, m, room));
  }
  function onPointerUp() {
    if (!drag) return;
    const was = drag;
    drag = null;
    if (was.kind === "item" && JSON.stringify(layout()) !== was.before) {
      const it = layout().find((x) => x.id === was.id);
      setLayout(
        layout(),
        null,
        `${nameOf(it, lang() ? "es" : "en")}: ${f2(it.x)} m, ${f2(it.y)} m.`,
      );
    } else render();
  }

  function onKey(event) {
    const itemEl = event.target.closest?.("[data-fd-item]");
    const handleEl = event.target.closest?.("[data-fd-handle]");
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
      event.key
    ];
    if (itemEl) {
      const id = itemEl.dataset.fdItem;
      selected = id;
      if (dir) {
        event.preventDefault();
        return nudge(id, dir[0] * GRID, dir[1] * GRID);
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        return act("rotate");
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        return act("remove");
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        render();
      }
      return;
    }
    if (handleEl && dir) {
      event.preventDefault();
      const room = roomOf(values());
      if (!room) return;
      const kind = handleEl.dataset.fdHandle;
      const [dx, dy] = dir;
      if (kind === "ab")
        applyHandle(kind, {
          a: String(limit("a", room.a + dx * GRID)),
          b: String(limit("b", room.b + dy * GRID)),
        });
      else if (kind === "c" && dx) applyHandle(kind, { c: String(limit("c", room.c + dx * GRID)) });
      else if (kind === "d" && dy) applyHandle(kind, { d: String(limit("d", room.d + dy * GRID)) });
    }
  }
  function nudge(id, dx, dy) {
    const next = nudgeItem(layout(), id, dx, dy);
    const it = next.find((x) => x.id === id);
    setLayout(
      next,
      `nudge-${id}`,
      `${nameOf(it, lang() ? "es" : "en")}: ${f2(it.x)} m, ${f2(it.y)} m.`,
    );
  }
  function act(name) {
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (!next) return;
      getState().workbench.layout = next;
      save();
      render();
      return announce(
        name === "undo"
          ? lang()
            ? "Se deshizo el último cambio del plano."
            : "Undid the last layout change."
          : lang()
            ? "Se rehizo el cambio del plano."
            : "Redid the layout change.",
      );
    }
    const it = layout().find((x) => x.id === selected);
    if (!it) return;
    if (name === "rotate")
      setLayout(
        rotateItem(layout(), it.id),
        null,
        `${nameOf(it, lang() ? "es" : "en")} ${lang() ? "girado" : "rotated"}.`,
      );
    if (name === "remove") {
      selected = null;
      setLayout(
        removeItem(layout(), it.id),
        null,
        `${nameOf(it, lang() ? "es" : "en")} ${lang() ? "quitado" : "removed"}.`,
      );
      host.querySelector("#fd-stage svg")?.focus?.();
    }
  }
  function onClick(event) {
    const add = event.target.closest("[data-fd-add]");
    if (add) {
      const room = roomOf(values());
      if (!room) return;
      const result = addItem(layout(), add.dataset.fdAdd, room);
      if (result.error) return announce(result.error === "full" ? t("full") : t("noRoom"));
      selected = result.item.id;
      setLayout(
        result.layout,
        null,
        `${nameOf(result.item, lang() ? "es" : "en")} ${lang() ? "agregado" : "added"}: ${f2(result.item.x)} m, ${f2(result.item.y)} m.`,
      );
      return host
        .querySelector(`[data-fd-item="${result.item.id}"]`)
        ?.focus({ preventScroll: true });
    }
    const n = event.target.closest("[data-fd-nudge]");
    if (n && selected) {
      const [dx, dy] = n.dataset.fdNudge.split(",").map(Number);
      return nudge(selected, dx * GRID, dy * GRID);
    }
    const b = event.target.closest("[data-fd]");
    if (b) return act(b.dataset.fd);
    const item = event.target.closest("[data-fd-item]");
    if (item && !drag) {
      selected = item.dataset.fdItem;
      render();
    }
  }

  return {
    html,
    render,
    /** Called after the workbench inserts html(); wires events on the designer's own element. */
    attach(section) {
      host = section.querySelector("#fd");
      if (!host) return;
      const stage = host.querySelector("#fd-stage");
      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerup", onPointerUp);
      stage.addEventListener("pointercancel", onPointerUp);
      host.addEventListener("keydown", onKey);
      host.addEventListener("click", onClick);
      host.addEventListener("change", (e) => {
        if (e.target.matches("[data-fd-path]")) {
          showPath = e.target.checked;
          render();
        }
      });
      render();
    },
    detach() {
      host = null;
      drag = null;
    },
    /** A checkpoint restored a saved layout. */
    restored(next) {
      getState().workbench.layout = next;
      history.record(next, null);
      render();
    },
    /** Static copy of the plan for the printable report (no handles, no path shading). */
    staticSVG(room) {
      const keep = showPath;
      showPath = false;
      const out = svgMarkup(room, frameFor(room), evaluate(layout(), room), { interactive: false });
      showPath = keep;
      return out;
    },
  };
}
