/* Math Workbench — selection and arrangement tools, and the "Board tools"
 * panel that hosts them.
 *
 *   - multi-select (Shift/Ctrl-click, lasso on empty space, Ctrl+A)
 *   - group / ungroup, lock / unlock
 *   - align, distribute, alignment guides while dragging
 *   - copy / cut / paste, including onto another page
 *
 * Objects carry `group` (an id) and `locked` (bool). Those are plain object
 * properties, so they save, undo and travel through Live Board snapshots.
 * The panel is shared: other modules add sections with MWB.panel.addSection().
 */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  if (!MWB) return;
  const { h } = MWB;
  const t = MWB.t;

  const sel = new Set();
  MWB.sel = sel;
  const CLIP_KEY = "neft.mathWorkbench.clipboard";
  let clip = null;
  let pasteCount = 0;
  let statusEl = null;

  const ctx = () => MWB.ctx;
  const objs = () => ctx().state.objects;
  const byId = (id) => ctx().objById(id);
  const elOf = (id) => ctx().overlay.querySelector(`[data-id="${id}"]`);
  const selected = () => [...sel].map(byId).filter(Boolean);
  const box = (o) => {
    const el = elOf(o.id);
    return { x: o.x, y: o.y, w: el ? el.offsetWidth : 80, h: el ? el.offsetHeight : 40 };
  };
  const say = (msg) => {
    if (statusEl) statusEl.textContent = msg;
  };

  function paintSel() {
    ctx()
      .overlay.querySelectorAll(".obj")
      .forEach((el) => el.classList.toggle("msel", sel.has(el.dataset.id)));
    const n = sel.size;
    say(
      n > 1
        ? t(`${n} items selected`, `${n} elementos seleccionados`)
        : n === 1
          ? t("1 item selected", "1 elemento seleccionado")
          : t(
              "Nothing selected. Shift-click items or drag a box around them.",
              "Nada seleccionado. Haz Shift+clic en elementos o arrastra un recuadro.",
            ),
    );
  }
  function setSel(ids) {
    sel.clear();
    for (const id of ids) sel.add(id);
    paintSel();
  }
  /** Expand to whole groups. */
  function withGroups(ids) {
    const out = new Set(ids);
    const groups = new Set();
    for (const id of ids) {
      const o = byId(id);
      if (o && o.group) groups.add(o.group);
    }
    if (groups.size) for (const o of objs()) if (groups.has(o.group)) out.add(o.id);
    return [...out];
  }
  const commit = () => {
    ctx().pushHistory();
    paintSel();
  };

  /* ---------------- decorate every object element ---------------- */
  MWB.on("decorateEl", (el, o) => {
    el.classList.toggle("locked", !!o.locked);
    el.classList.toggle("grouped", !!o.group);
    el.classList.toggle("is-trace", !!o.trace);
    if (sel.has(o.id)) el.classList.add("msel");
  });
  // Tool headers hold bare number inputs and selects whose caption is the text beside
  // them ("[4] columns", "[>] greater"). Name each from that caption so a screen reader
  // does not announce an unnamed field (axe: label / select-name).
  MWB.on("afterRender", () => {
    const fields = document.querySelectorAll(
      ".tool-head input:not([aria-label]):not([type=hidden]), .tool-head select:not([aria-label])",
    );
    for (const field of fields) {
      const near = [field.nextSibling, field.previousSibling].find(
        (n) => n && (n.textContent || "").trim() && !/^(INPUT|SELECT)$/.test(n.nodeName),
      );
      const caption = near ? near.textContent.trim().slice(0, 40) : "";
      const tool = field.closest(".obj")?.getAttribute("data-type") || "tool";
      field.setAttribute("aria-label", caption || `${tool} setting`);
    }
  });
  MWB.on("afterRender", () => {
    for (const id of [...sel]) if (!byId(id)) sel.delete(id);
    paintSel();
  });
  MWB.on("extendMiniTools", (o, mk) => {
    const b = mk(
      o.locked ? "🔓" : "🔒",
      o.locked
        ? t("Unlock this item", "Desbloquear este elemento")
        : t("Lock this item in place", "Bloquear este elemento en su lugar"),
      "wbx-lockbtn",
      () => {
        o.locked = !o.locked;
        ctx().renderAll();
        ctx().selectObject(o.id);
        ctx().pushHistory();
      },
    );
    b.setAttribute("aria-pressed", String(!!o.locked));
  });

  /* ---------------- actions ---------------- */
  function selectAll() {
    setSel(objs().map((o) => o.id));
  }
  function group() {
    const list = selected();
    if (list.length < 2)
      return say(
        t("Select two or more items to group.", "Selecciona dos o más elementos para agrupar."),
      );
    const gid = `g${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    list.forEach((o) => {
      o.group = gid;
    });
    ctx().renderAll();
    commit();
    say(
      t(
        `Grouped ${list.length} items. They now move together.`,
        `Se agruparon ${list.length} elementos. Ahora se mueven juntos.`,
      ),
    );
  }
  function ungroup() {
    const list = withGroups([...sel])
      .map(byId)
      .filter(Boolean);
    if (!list.some((o) => o.group))
      return say(t("Those items are not grouped.", "Esos elementos no están agrupados."));
    list.forEach((o) => {
      delete o.group;
    });
    ctx().renderAll();
    commit();
    say(t("Ungrouped.", "Desagrupado."));
  }
  function toggleLock() {
    const list = selected();
    if (!list.length) return;
    const lock = list.some((o) => !o.locked);
    list.forEach((o) => {
      if (lock) o.locked = true;
      else delete o.locked;
    });
    ctx().renderAll();
    commit();
    say(
      lock
        ? t(
            "Locked. These items cannot be moved or deleted.",
            "Bloqueado. Estos elementos no se pueden mover ni borrar.",
          )
        : t("Unlocked.", "Desbloqueado."),
    );
  }
  function align(how) {
    const list = selected().filter((o) => !o.locked);
    if (list.length < 2)
      return say(
        t("Select two or more items to line up.", "Selecciona dos o más elementos para alinear."),
      );
    const b = list.map((o) => ({ o, ...box(o) }));
    const minX = Math.min(...b.map((i) => i.x));
    const maxR = Math.max(...b.map((i) => i.x + i.w));
    const minY = Math.min(...b.map((i) => i.y));
    const maxB = Math.max(...b.map((i) => i.y + i.h));
    for (const i of b) {
      if (how === "left") i.o.x = minX;
      else if (how === "right") i.o.x = maxR - i.w;
      else if (how === "center") i.o.x = Math.round((minX + maxR) / 2 - i.w / 2);
      else if (how === "top") i.o.y = minY;
      else if (how === "bottom") i.o.y = maxB - i.h;
      else if (how === "middle") i.o.y = Math.round((minY + maxB) / 2 - i.h / 2);
    }
    list.forEach((o) => ctx().updateObjEl(o));
    commit();
  }
  function distribute(axis) {
    const list = selected().filter((o) => !o.locked);
    if (list.length < 3)
      return say(
        t(
          "Select three or more items to space out evenly.",
          "Selecciona tres o más elementos para espaciarlos por igual.",
        ),
      );
    const horiz = axis === "h";
    const b = list.map((o) => ({ o, ...box(o) })).sort((p, q) => (horiz ? p.x - q.x : p.y - q.y));
    const start = horiz ? b[0].x : b[0].y;
    const last = b[b.length - 1];
    const end = horiz ? last.x + last.w : last.y + last.h;
    const total = b.reduce((n, i) => n + (horiz ? i.w : i.h), 0);
    const gap = (end - start - total) / (b.length - 1);
    let cursor = start;
    for (const i of b) {
      if (horiz) i.o.x = Math.round(cursor);
      else i.o.y = Math.round(cursor);
      cursor += (horiz ? i.w : i.h) + gap;
    }
    list.forEach((o) => ctx().updateObjEl(o));
    commit();
  }
  function copy(cut) {
    const list = selected();
    if (!list.length)
      return say(t("Select something to copy first.", "Selecciona algo para copiar primero."));
    const x0 = Math.min(...list.map((o) => o.x));
    const y0 = Math.min(...list.map((o) => o.y));
    clip = list.map((o) => ({ ...JSON.parse(JSON.stringify(o)), x: o.x - x0, y: o.y - y0 }));
    pasteCount = 0;
    try {
      localStorage.setItem(CLIP_KEY, JSON.stringify(clip));
    } catch (_) {}
    say(
      t(
        `Copied ${list.length}. Paste it here or on another page.`,
        `Se copiaron ${list.length}. Pégalos aquí o en otra página.`,
      ),
    );
    if (cut) {
      list.filter((o) => !o.locked).forEach((o) => ctx().deleteObject(o.id));
      sel.clear();
    }
  }
  function paste() {
    if (!clip) {
      try {
        clip = JSON.parse(localStorage.getItem(CLIP_KEY));
      } catch (_) {
        clip = null;
      }
    }
    if (!Array.isArray(clip) || !clip.length)
      return say(
        t(
          "Nothing to paste yet. Copy something first.",
          "Todavía no hay nada para pegar. Copia algo primero.",
        ),
      );
    pasteCount++;
    const c = ctx();
    const r = c.workspace.getBoundingClientRect();
    const baseX = Math.round(r.width / 2 - 60) + pasteCount * 24;
    const baseY = Math.round(c.workspace.scrollTop + r.height / 3) + pasteCount * 24;
    // a pasted group needs its own group id so it stays separate from the source group
    const remap = {};
    const made = c.addObjects(
      clip.map((o) => {
        const copyObj = { ...JSON.parse(JSON.stringify(o)), x: baseX + o.x, y: baseY + o.y };
        delete copyObj.locked;
        if (copyObj.group)
          copyObj.group =
            remap[copyObj.group] ||
            (remap[copyObj.group] =
              `g${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`);
        return copyObj;
      }),
    );
    setSel(made.map((o) => o.id));
    say(t(`Pasted ${made.length}.`, `Se pegaron ${made.length}.`));
  }
  MWB.pasteObjects = () => paste();
  function deleteSel() {
    const list = selected().filter((o) => !o.locked);
    if (!list.length) return;
    const c = ctx();
    const ids = new Set(list.map((o) => o.id));
    c.state.objects = c.state.objects.filter((o) => !ids.has(o.id));
    sel.clear();
    c.renderAll();
    c.pushHistory();
  }
  function toggleTrace() {
    const list = selected().filter((o) => o.type === "shape2d" || o.type === "shape3d");
    if (!list.length)
      return say(t("Select a shape to trace over.", "Selecciona una figura para repasar."));
    const on = list.some((o) => !o.trace);
    list.forEach((o) => {
      if (on) o.trace = true;
      else delete o.trace;
    });
    ctx().renderAll();
    commit();
    say(
      on
        ? t(
            "Trace mode: pick the Pen and draw over the faded shape.",
            "Modo repasar: elige el Lápiz y dibuja sobre la figura tenue.",
          )
        : t("Trace mode off.", "Modo repasar apagado."),
    );
  }

  /* ---------------- pointer: multi-select, lasso, group drag ---------------- */
  let drag = null;
  let lasso = null;
  const rectOf = (a, b) => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });

  function startGroupDrag(e, ids) {
    const list = ids.map(byId).filter((o) => o && !o.locked);
    if (!list.length) return;
    drag = {
      mx: e.clientX,
      my: e.clientY,
      items: list.map((o) => ({ o, x: o.x, y: o.y })),
      moved: false,
    };
    e.preventDefault();
    e.stopPropagation();
    const move = (ev) => {
      const dx = ev.clientX - drag.mx;
      const dy = ev.clientY - drag.my;
      if (!drag.moved && Math.hypot(dx, dy) < 3) return;
      drag.moved = true;
      for (const i of drag.items) {
        i.o.x = Math.max(0, Math.round(i.x + dx));
        i.o.y = Math.max(0, Math.round(i.y + dy));
        const el = elOf(i.o.id);
        if (el) ctx().applyTransform(el, i.o);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (drag && drag.moved) {
        if (ctx().snapOn) {
          for (const i of drag.items) {
            i.o.x = Math.max(0, Math.round(i.o.x / 28) * 28);
            i.o.y = Math.max(0, Math.round(i.o.y / 28) * 28);
            ctx().updateObjEl(i.o);
          }
        }
        ctx().growToFit();
        ctx().pushHistory();
      }
      drag = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function startLasso(e) {
    const c = ctx();
    const wr = c.workspace.getBoundingClientRect();
    const toDoc = (ev) => ({
      x: ev.clientX - wr.left,
      y: ev.clientY - wr.top + c.workspace.scrollTop,
    });
    const from = toDoc(e);
    lasso = { from, el: null, moved: false, additive: e.shiftKey };
    const move = (ev) => {
      const to = toDoc(ev);
      if (!lasso.moved && Math.hypot(to.x - from.x, to.y - from.y) < 6) return;
      lasso.moved = true;
      const r = rectOf(from, to);
      if (!lasso.el) {
        lasso.el = h("div", { class: "wbx-lasso", "aria-hidden": "true" });
        c.overlay.appendChild(lasso.el);
      }
      Object.assign(lasso.el.style, {
        left: `${r.x}px`,
        top: `${r.y}px`,
        width: `${r.w}px`,
        height: `${r.h}px`,
      });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (lasso && lasso.moved) {
        const r = rectOf(from, toDoc(ev));
        const hit = objs().filter((o) => {
          const b = box(o);
          return b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.h > r.y;
        });
        setSel(withGroups([...(lasso.additive ? sel : []), ...hit.map((o) => o.id)]));
        c.deselect();
      } else if (!lasso.additive) {
        sel.clear();
        paintSel();
      }
      if (lasso && lasso.el) lasso.el.remove();
      lasso = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function installPointer() {
    const c = ctx();
    c.workspace.addEventListener(
      "pointerdown",
      (e) => {
        if (document.body.dataset.draw === "1" || e.button > 0) return;
        const objEl = e.target.closest ? e.target.closest(".obj") : null;
        if (!objEl) {
          if (e.target === c.overlay && c.tool === "move") startLasso(e);
          return;
        }
        const id = objEl.dataset.id;
        const o = byId(id);
        if (!o) return;
        if (
          e.target.closest(".obj-tools") ||
          e.target.classList.contains("rs") ||
          e.target.classList.contains("endpt")
        ) {
          if (
            o.locked &&
            (e.target.classList.contains("rs") || e.target.classList.contains("endpt"))
          ) {
            e.stopPropagation();
            e.preventDefault();
          }
          return;
        }
        const additive = e.shiftKey || e.ctrlKey || e.metaKey;
        if (additive) {
          if (!sel.size && c.selectedId) sel.add(c.selectedId);
          const ids = withGroups([id]);
          const has = sel.has(id);
          ids.forEach((i) => (has ? sel.delete(i) : sel.add(i)));
          c.deselect();
          paintSel();
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const inGroup = o.group ? withGroups([id]) : null;
        if (sel.size > 1 && sel.has(id)) return startGroupDrag(e, [...sel]);
        if (inGroup && inGroup.length > 1) {
          setSel(inGroup);
          c.deselect();
          return startGroupDrag(e, inGroup);
        }
        sel.clear();
        paintSel();
        if (o.locked) {
          c.selectObject(id);
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  }

  /* ---------------- alignment guides while dragging one object ---------------- */
  const SNAP = 6;
  let guides = [];
  function clearGuides() {
    guides.forEach((g) => g.remove());
    guides = [];
  }
  function installGuides() {
    const c = ctx();
    let active = null;
    c.workspace.addEventListener(
      "pointerdown",
      (e) => {
        if (document.body.dataset.draw === "1" || e.button > 0) return;
        const el = e.target.closest ? e.target.closest(".obj") : null;
        if (
          !el ||
          e.target.closest(".obj-tools") ||
          e.target.classList.contains("rs") ||
          e.target.isContentEditable
        )
          return;
        const o = byId(el.dataset.id);
        if (o && !o.locked && !o.group && o.type !== "line") active = o;
      },
      true,
    );
    window.addEventListener("pointermove", () => {
      if (!active) return;
      clearGuides();
      const me = box(active);
      const mine = {
        l: me.x,
        c: me.x + me.w / 2,
        r: me.x + me.w,
        t: me.y,
        m: me.y + me.h / 2,
        b: me.y + me.h,
      };
      let bestX = null;
      let bestY = null;
      for (const other of objs()) {
        if (other.id === active.id) continue;
        const ob = box(other);
        const theirs = {
          l: ob.x,
          c: ob.x + ob.w / 2,
          r: ob.x + ob.w,
          t: ob.y,
          m: ob.y + ob.h / 2,
          b: ob.y + ob.h,
        };
        for (const a of ["l", "c", "r"])
          for (const bk of ["l", "c", "r"]) {
            const d = theirs[bk] - mine[a];
            if (Math.abs(d) <= SNAP && (!bestX || Math.abs(d) < Math.abs(bestX.d)))
              bestX = { d, at: theirs[bk] };
          }
        for (const a of ["t", "m", "b"])
          for (const bk of ["t", "m", "b"]) {
            const d = theirs[bk] - mine[a];
            if (Math.abs(d) <= SNAP && (!bestY || Math.abs(d) < Math.abs(bestY.d)))
              bestY = { d, at: theirs[bk] };
          }
      }
      if (bestX) active.x = Math.round(active.x + bestX.d);
      if (bestY) active.y = Math.round(active.y + bestY.d);
      if (bestX || bestY) {
        const el = elOf(active.id);
        if (el) c.applyTransform(el, active);
        if (bestX) guides.push(guideLine("v", bestX.at));
        if (bestY) guides.push(guideLine("h", bestY.at));
        guides.forEach((g) => c.overlay.appendChild(g));
      }
    });
    const end = () => {
      active = null;
      clearGuides();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }
  function guideLine(kind, at) {
    const g = h("div", { class: `wbx-guide ${kind}`, "aria-hidden": "true" });
    if (kind === "v") Object.assign(g.style, { left: `${at}px`, top: "0", height: "100%" });
    else Object.assign(g.style, { top: `${at}px`, left: "0", width: "100%" });
    return g;
  }

  /* ---------------- keyboard ---------------- */
  function installKeys() {
    document.addEventListener(
      "keydown",
      (e) => {
        const tag = e.target && e.target.tagName;
        if (e.target && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(tag))) return;
        if (document.querySelector(".mwr-overlay.is-open")) return; // Reasoning Studio is open
        const mod = e.ctrlKey || e.metaKey;
        const k = e.key.toLowerCase();
        if (mod && k === "a") {
          e.preventDefault();
          e.stopPropagation();
          selectAll();
        } else if (mod && k === "g") {
          e.preventDefault();
          e.stopPropagation();
          e.shiftKey ? ungroup() : group();
        } else if (mod && (k === "c" || k === "x")) {
          if (!sel.size && ctx().selectedId) sel.add(ctx().selectedId);
          if (sel.size) {
            e.preventDefault();
            e.stopPropagation();
            copy(k === "x");
          }
        } else if (sel.size > 1 && (k === "delete" || k === "backspace")) {
          e.preventDefault();
          e.stopPropagation();
          deleteSel();
        } else if (sel.size > 1 && k.startsWith("arrow")) {
          e.preventDefault();
          e.stopPropagation();
          const step = e.shiftKey ? 16 : 4;
          const d = {
            arrowleft: [-step, 0],
            arrowright: [step, 0],
            arrowup: [0, -step],
            arrowdown: [0, step],
          }[k];
          selected()
            .filter((o) => !o.locked)
            .forEach((o) => {
              o.x = Math.max(0, o.x + d[0]);
              o.y = Math.max(0, o.y + d[1]);
              ctx().updateObjEl(o);
            });
          clearTimeout(installKeys.t);
          installKeys.t = setTimeout(() => ctx().pushHistory(), 350);
        } else if (k === "escape" && sel.size) {
          sel.clear();
          paintSel();
        }
      },
      true,
    );
  }

  /* ---------------- the Board tools panel ---------------- */
  const panelState = { open: false, sections: [] };
  MWB.panel = {
    /** build() returns the section's content element; it runs each time the panel opens. */
    addSection(id, title, titleEs, build) {
      panelState.sections.push({ id, title, titleEs, build });
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
  let panelEl = null;
  let btnEl = null;
  function setOpen(on) {
    if (!panelEl) return;
    panelState.open = on;
    panelEl.hidden = !on;
    btnEl.setAttribute("aria-expanded", String(on));
    if (on) {
      buildPanel();
      panelEl.querySelector("summary, button")?.focus();
    }
  }
  function buildPanel() {
    panelEl.textContent = "";
    panelEl.appendChild(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Board tools", "Herramientas de la pizarra")),
        MWB.btn("✕", t("Close board tools", "Cerrar herramientas"), () => setOpen(false)),
      ),
    );
    for (const s of panelState.sections) {
      const d = h(
        "details",
        { class: "wbx-sec", open: s.id === "selection" ? true : null },
        h("summary", null, t(s.title, s.titleEs)),
      );
      try {
        d.appendChild(s.build());
      } catch (_) {
        d.appendChild(
          h(
            "p",
            { class: "wbx-live" },
            t("This section could not load.", "Esta sección no se pudo cargar."),
          ),
        );
      }
      panelEl.appendChild(d);
    }
    paintSel();
  }

  MWB.panel.addSection(
    "selection",
    "Select, arrange & copy",
    "Seleccionar, ordenar y copiar",
    () => {
      const box1 = h("div", { class: "wbx-grid" });
      const add = (label, aria, fn, extra) => box1.appendChild(MWB.btn(label, aria, fn, extra));
      add(
        t("Select all", "Seleccionar todo"),
        t("Select every item on this page", "Seleccionar todos los elementos de esta página"),
        selectAll,
      );
      add(
        t("Group", "Agrupar"),
        t("Group the selected items", "Agrupar los elementos seleccionados"),
        group,
      );
      add(
        t("Ungroup", "Desagrupar"),
        t("Ungroup the selected items", "Desagrupar los elementos seleccionados"),
        ungroup,
      );
      add(
        t("Lock / unlock", "Bloquear / desbloquear"),
        t(
          "Lock or unlock the selected items",
          "Bloquear o desbloquear los elementos seleccionados",
        ),
        toggleLock,
      );
      add(
        t("Copy", "Copiar"),
        t("Copy the selected items", "Copiar los elementos seleccionados"),
        () => copy(false),
      );
      add(
        t("Cut", "Cortar"),
        t("Cut the selected items", "Cortar los elementos seleccionados"),
        () => copy(true),
      );
      add(t("Paste", "Pegar"), t("Paste on this page", "Pegar en esta página"), paste);
      add(
        t("Trace shape", "Repasar figura"),
        t(
          "Fade the selected shape so you can trace over it with the pen",
          "Atenuar la figura seleccionada para repasarla con el lápiz",
        ),
        toggleTrace,
      );
      const al = h("div", { class: "wbx-grid" });
      for (const [k, en, es, glyph] of [
        ["left", "Align left", "Alinear a la izquierda", "⇤"],
        ["center", "Align centers", "Centrar horizontalmente", "↔"],
        ["right", "Align right", "Alinear a la derecha", "⇥"],
        ["top", "Align tops", "Alinear arriba", "⤒"],
        ["middle", "Align middles", "Centrar verticalmente", "↕"],
        ["bottom", "Align bottoms", "Alinear abajo", "⤓"],
      ]) {
        al.appendChild(MWB.btn(glyph, t(en, es), () => align(k)));
      }
      al.appendChild(
        MWB.btn(
          "↔ ···",
          t("Space out evenly, left to right", "Espaciar por igual, de izquierda a derecha"),
          () => distribute("h"),
        ),
      );
      al.appendChild(
        MWB.btn(
          "↕ ···",
          t("Space out evenly, top to bottom", "Espaciar por igual, de arriba a abajo"),
          () => distribute("v"),
        ),
      );
      statusEl = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
      return h(
        "div",
        { class: "wbx-stack" },
        box1,
        h("p", { class: "wbx-title" }, t("Line up", "Alinear")),
        al,
        statusEl,
        h(
          "p",
          { class: "wbx-live" },
          t(
            "Keys: Shift-click or drag a box to select · Ctrl+C / X / V copy, cut, paste · Ctrl+G group · Ctrl+A all",
            "Teclas: Shift+clic o arrastra un recuadro para seleccionar · Ctrl+C / X / V copiar, cortar, pegar · Ctrl+G agrupar · Ctrl+A todo",
          ),
        ),
      );
    },
  );

  function mountPanel() {
    btnEl = h(
      "button",
      {
        type: "button",
        id: "wbxBoardBtn",
        class: "wbx-boardbtn",
        "aria-expanded": "false",
        "aria-controls": "wbxPanel",
        title: t(
          "Board tools: select, arrange, draw helpers, pages, export",
          "Herramientas: seleccionar, ordenar, ayudas de dibujo, páginas, exportar",
        ),
      },
      t("Board tools", "Herramientas"),
    );
    panelEl = h("section", {
      id: "wbxPanel",
      class: "wbx wbx-panel",
      role: "region",
      "aria-label": t("Board tools", "Herramientas de la pizarra"),
      hidden: true,
    });
    btnEl.addEventListener("click", () => setOpen(!panelState.open));
    panelEl.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        setOpen(false);
        btnEl.focus();
      }
    });
    panelEl.addEventListener("pointerdown", (e) => e.stopPropagation());
    document.body.append(btnEl, panelEl);
  }

  MWB.onReady(() => {
    installPointer();
    installGuides();
    installKeys();
    mountPanel();
  });
})(window);
