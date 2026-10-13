/* Math Workbench — drawing helpers.
 *
 *   - Straightedge: a guide strokes can slide along, with an angle readout.
 *   - Point eraser: rubs out just the touched part of a stroke (the default
 *     eraser removes the whole stroke).
 *   - Saved colors: a color picker and a row of saved swatches in the pen palette.
 *
 * Palm rejection and pressure handling stay in index.html; this file only
 * adjusts points (MWB.constrainPoint) and the eraser (MWB.pointErase).
 */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  const M = root.WBMath;
  if (!MWB || !M) return;
  const { h, svg } = MWB;
  const t = MWB.t;

  const COLORS_KEY = "neft.mathWorkbench.savedColors";
  const ERASER_KEY = "neft.mathWorkbench.eraserMode";
  const NEAR = 26; // px: a stroke that starts this close to the straightedge follows it

  /* ======================= Straightedge ======================= */
  const ruler = {
    on: false,
    a: { x: 200, y: 260 },
    b: { x: 560, y: 260 },
    locked: false,
    el: null,
  };
  MWB.ruler = ruler;

  const angleDeg = () => {
    let d = (Math.atan2(ruler.b.y - ruler.a.y, ruler.b.x - ruler.a.x) * 180) / Math.PI;
    if (d < 0) d += 180;
    if (d >= 180) d -= 180;
    return Math.round(d);
  };

  MWB.constrainPoint = (q) => {
    if (!ruler.on) return;
    // q.t === 0 marks the first point of a stroke (see samplePt in index.html)
    if (q.t === 0) {
      const p = M.projectOnLine(q.x, q.y, ruler.a, ruler.b);
      ruler.locked = p.dist <= NEAR;
    }
    if (ruler.locked) {
      const p = M.projectOnLine(q.x, q.y, ruler.a, ruler.b);
      q.x = p.x;
      q.y = p.y;
    }
  };

  function drawRuler() {
    if (!ruler.el) return;
    const dx = ruler.b.x - ruler.a.x;
    const dy = ruler.b.y - ruler.a.y;
    const len = Math.hypot(dx, dy);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    ruler.el.style.transform = `translate(${ruler.a.x}px, ${ruler.a.y}px) rotate(${ang}deg)`;
    const body = ruler.el.querySelector(".wbx-ruler-body");
    body.style.width = `${len}px`;
    const ticks = ruler.el.querySelector(".wbx-ruler-ticks");
    ticks.textContent = "";
    for (let i = 0; i <= len; i += 28)
      ticks.appendChild(
        h("i", { style: { left: `${i}px`, height: i % 140 === 0 ? "14px" : "8px" } }),
      );
    ruler.el.querySelector(".wbx-ruler-end.b").style.left = `${len}px`;
    ruler.el.querySelector(".wbx-ruler-grip").style.left = `${len / 2}px`;
    ruler.el.querySelector(".wbx-ruler-angle").textContent = `${angleDeg()}°`;
    ruler.el.querySelector(".wbx-ruler-angle").style.left = `${len / 2}px`;
  }

  function dragHandle(node, onMove) {
    MWB.guard(node);
    node.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const c = MWB.ctx;
      const wr = c.workspace.getBoundingClientRect();
      const toDoc = (ev) => ({
        x: ev.clientX - wr.left,
        y: ev.clientY - wr.top + c.workspace.scrollTop,
      });
      const start = toDoc(e);
      const a0 = { ...ruler.a };
      const b0 = { ...ruler.b };
      const move = (ev) => {
        onMove(toDoc(ev), start, a0, b0, ev);
        drawRuler();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  }

  function mountRuler() {
    const c = MWB.ctx;
    ruler.el = h(
      "div",
      { class: "wbx-ruler", "aria-label": t("Straightedge guide", "Guía de regla"), role: "group" },
      h("div", { class: "wbx-ruler-body" }, h("div", { class: "wbx-ruler-ticks" })),
      h("button", {
        type: "button",
        class: "wbx-ruler-end a",
        "aria-label": t(
          "Move the left end of the straightedge",
          "Mover el extremo izquierdo de la regla",
        ),
      }),
      h("button", {
        type: "button",
        class: "wbx-ruler-end b",
        "aria-label": t(
          "Move the right end of the straightedge",
          "Mover el extremo derecho de la regla",
        ),
      }),
      h(
        "button",
        {
          type: "button",
          class: "wbx-ruler-grip",
          "aria-label": t("Move the straightedge", "Mover la regla"),
        },
        "⠿",
      ),
      h("span", { class: "wbx-ruler-angle", "aria-hidden": "true" }, "0°"),
    );
    ruler.el.hidden = true;
    c.overlay.parentElement.appendChild(ruler.el);
    const [ea, eb, grip] = [".wbx-ruler-end.a", ".wbx-ruler-end.b", ".wbx-ruler-grip"].map((s) =>
      ruler.el.querySelector(s),
    );
    dragHandle(ea, (p, _s, _a0, b0) => {
      ruler.a = p;
      ruler.b = b0;
    });
    dragHandle(eb, (p, _s, a0, _b0, ev) => {
      ruler.a = a0;
      ruler.b = ev.shiftKey ? snap15(a0, p) : p;
    });
    dragHandle(grip, (p, s, a0, b0) => {
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      ruler.a = { x: a0.x + dx, y: a0.y + dy };
      ruler.b = { x: b0.x + dx, y: b0.y + dy };
    });
    for (const [node, key] of [
      [ea, "a"],
      [eb, "b"],
      [grip, "both"],
    ]) {
      node.addEventListener("keydown", (e) => {
        const d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[
          e.key
        ];
        if (!d) return;
        e.preventDefault();
        const k = e.shiftKey ? 4 : 1;
        for (const end of key === "both" ? ["a", "b"] : [key]) {
          ruler[end] = { x: ruler[end].x + d[0] * k, y: ruler[end].y + d[1] * k };
        }
        drawRuler();
      });
    }
    drawRuler();
  }
  /** Snap the b end to the nearest 15 degrees. */
  function snap15(a, p) {
    const len = Math.hypot(p.x - a.x, p.y - a.y);
    const ang = Math.round(Math.atan2(p.y - a.y, p.x - a.x) / (Math.PI / 12)) * (Math.PI / 12);
    return { x: a.x + len * Math.cos(ang), y: a.y + len * Math.sin(ang) };
  }
  function setRuler(on) {
    ruler.on = on;
    if (on) {
      const c = MWB.ctx;
      const r = c.workspace.getBoundingClientRect();
      const y = Math.round(c.workspace.scrollTop + r.height / 2);
      if (ruler.a.y < c.workspace.scrollTop || ruler.a.y > c.workspace.scrollTop + r.height) {
        ruler.a = { x: 160, y };
        ruler.b = { x: Math.min(520, r.width - 100), y };
      }
    }
    ruler.el.hidden = !on;
    drawRuler();
  }
  function setAngle(deg) {
    const len = Math.hypot(ruler.b.x - ruler.a.x, ruler.b.y - ruler.a.y) || 300;
    const rad = (deg * Math.PI) / 180;
    ruler.b = { x: ruler.a.x + len * Math.cos(rad), y: ruler.a.y + len * Math.sin(rad) };
    drawRuler();
  }

  /* ======================= Eraser mode ======================= */
  try {
    MWB.eraserMode = localStorage.getItem(ERASER_KEY) === "point" ? "point" : "stroke";
  } catch (_) {}
  MWB.pointErase = (p, r, state) => {
    let changed = false;
    for (let i = state.strokes.length - 1; i >= 0; i--) {
      const pieces = M.splitStroke(state.strokes[i], p, r);
      if (pieces) {
        state.strokes.splice(i, 1, ...pieces);
        changed = true;
      }
    }
    return changed;
  };
  function setEraser(mode) {
    MWB.eraserMode = mode;
    try {
      localStorage.setItem(ERASER_KEY, mode);
    } catch (_) {}
  }

  /* ======================= Saved colors ======================= */
  const loadColors = () => {
    try {
      const v = JSON.parse(localStorage.getItem(COLORS_KEY));
      return Array.isArray(v) ? v.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 12) : [];
    } catch (_) {
      return [];
    }
  };
  const saveColors = (list) => {
    try {
      localStorage.setItem(COLORS_KEY, JSON.stringify(list.slice(0, 12)));
    } catch (_) {}
  };

  MWB.on("afterPenFlyout", (flyout, tool) => {
    if (tool !== "pen" && tool !== "highlighter") return;
    const c = MWB.ctx;
    const isHi = tool === "highlighter";
    const apply = (color) => (isHi ? c.setHiColor(color) : c.setPenColor(color));
    const current = () => (isHi ? c.hiColor() : c.penColor());
    const row = h("div", {
      class: "opt-row wbx-saved",
      role: "group",
      "aria-label": t("Saved colors", "Colores guardados"),
    });
    const picker = h("input", {
      type: "color",
      class: "wbx-colorpick",
      value: /^#[0-9a-f]{6}$/i.test(current()) ? current() : "#14223a",
      "aria-label": t("Pick any color", "Elige cualquier color"),
    });
    MWB.guard(picker);
    function paintSaved() {
      row.textContent = "";
      for (const col of loadColors()) {
        const b = h("button", {
          type: "button",
          class: "swatch",
          style: { background: col },
          "aria-label": t(`Use saved color ${col}`, `Usar el color guardado ${col}`),
        });
        b.addEventListener("click", () => {
          apply(col);
          flyout.querySelectorAll(".swatch").forEach((x) => x.classList.remove("sel"));
          b.classList.add("sel");
        });
        row.appendChild(b);
      }
    }
    picker.addEventListener("input", () => apply(picker.value));
    const save = MWB.btn(
      t("Save this color", "Guardar este color"),
      t("Save this color to the palette", "Guardar este color en la paleta"),
      () => {
        const list = loadColors().filter((x) => x.toLowerCase() !== picker.value.toLowerCase());
        list.unshift(picker.value);
        saveColors(list);
        paintSaved();
      },
    );
    const forget = MWB.btn(
      t("Clear saved", "Borrar guardados"),
      t("Forget all saved colors", "Olvidar todos los colores guardados"),
      () => {
        saveColors([]);
        paintSaved();
      },
    );
    paintSaved();
    const holder = h(
      "div",
      { class: "wbx" },
      h("p", { class: "field-lbl" }, t("More colors", "Más colores")),
      h("div", { class: "wbx-row" }, picker, save, forget),
      row,
    );
    flyout.appendChild(holder);
  });

  /* ======================= panel section ======================= */
  if (MWB.panel) {
    MWB.panel.addSection("draw", "Drawing helpers", "Ayudas de dibujo", () => {
      const stack = h("div", { class: "wbx-stack" });
      const ruleBtn = MWB.btn(
        t("Straightedge", "Regla"),
        t("Show or hide the straightedge guide", "Mostrar u ocultar la guía de regla"),
        () => {
          setRuler(!ruler.on);
          ruleBtn.setAttribute("aria-pressed", String(ruler.on));
        },
      );
      ruleBtn.setAttribute("aria-pressed", String(ruler.on));
      const angles = h("div", {
        class: "wbx-row",
        role: "group",
        "aria-label": t("Set the straightedge angle", "Fijar el ángulo de la regla"),
      });
      for (const d of [0, 30, 45, 60, 90, 120, 135, 150])
        angles.appendChild(
          MWB.btn(
            `${d}°`,
            t(`Turn the straightedge to ${d} degrees`, `Girar la regla a ${d} grados`),
            () => setAngle(d),
          ),
        );
      const eraser = h("div", {
        class: "wbx-row",
        role: "group",
        "aria-label": t("What the eraser removes", "Qué quita la goma"),
      });
      for (const [k, en, es] of [
        ["stroke", "Whole stroke", "Trazo completo"],
        ["point", "Just where I rub", "Solo donde froto"],
      ]) {
        const b = MWB.btn(t(en, es), t(`Eraser: ${en}`, `Goma: ${es}`), () => {
          setEraser(k);
          eraser
            .querySelectorAll("button")
            .forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.k === k)));
        });
        b.dataset.k = k;
        b.setAttribute("aria-pressed", String(MWB.eraserMode === k));
        eraser.appendChild(b);
      }
      stack.append(
        h("p", { class: "wbx-title" }, t("Straightedge", "Regla")),
        h("div", { class: "wbx-row" }, ruleBtn),
        angles,
        h(
          "p",
          { class: "wbx-live" },
          t(
            "Pick the Pen and start a line close to the straightedge. The pen slides along it. Drag the ends to turn it; hold Shift for 15° steps.",
            "Elige el Lápiz y empieza una línea cerca de la regla. El lápiz se desliza por ella. Arrastra los extremos para girarla; con Shift avanza de 15° en 15°.",
          ),
        ),
        h("p", { class: "wbx-title" }, t("Eraser", "Goma")),
        eraser,
      );
      return stack;
    });
  }

  MWB.onReady(mountRuler);
})(window);
