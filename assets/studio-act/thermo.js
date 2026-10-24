/**
 * Practice Studio activity: thermo (window.StudioAct kind "thermo"), lessons 7-1 to 7-4.
 * A vertical thermometer (a number line stood on end) with below-zero and above-zero readings, and a Rotate button that
 * lays the same line down horizontally. Modes: place a reading, place the opposite of a shown reading, and place a reading
 * between two others. State: { v: number | null }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const r4 = (/** @type {number} */ v) => Math.round(v * 1e4) / 1e4;
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-6;
  const n = (/** @type {number} */ v) => K.n(v);
  const MODES = ["place", "opposite", "between"];
  const CTX = {
    temp: {
      unit: "°C",
      say: (/** @type {number} */ v) => {
        const a = Math.abs(v);
        return v < 0
          ? [`${n(a)} degrees below zero`, `${n(a)} grados bajo cero`]
          : v > 0
            ? [`${n(a)} degrees above zero`, `${n(a)} grados sobre cero`]
            : ["zero degrees", "cero grados"];
      },
      less: ["colder than", "más frío que"],
      more: ["warmer than", "más cálido que"],
    },
    elev: {
      unit: "m",
      say: (/** @type {number} */ v) => {
        const a = Math.abs(v);
        return v < 0
          ? [`${n(a)} meters below sea level`, `${n(a)} metros bajo el nivel del mar`]
          : v > 0
            ? [`${n(a)} meters above sea level`, `${n(a)} metros sobre el nivel del mar`]
            : ["at sea level", "al nivel del mar"];
      },
      less: ["lower than", "más abajo que"],
      more: ["higher than", "más arriba que"],
    },
  };
  const LINES = [
    { min: -10, max: 10, step: 1, lab: 5 },
    { min: -12, max: 12, step: 1, lab: 2 },
    { min: -6, max: 6, step: 0.5, lab: 1 },
    { min: -8, max: 8, step: 0.5, lab: 2 },
  ];
  const ticks = (/** @type {any} */ ln) => Math.round((ln.max - ln.min) / ln.step);
  const valAt = (/** @type {any} */ ln, /** @type {number} */ k) => r4(ln.min + k * ln.step);

  function mkThermo(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ p) {
    const mode = MODES.includes(p.mode) ? p.mode : rng.pick(MODES);
    const ln = LINES[lv - 1];
    const ctxKey = rng.pick(["temp", "elev"]);
    const C = /** @type {any} */ (CTX)[ctxKey];
    const N = ticks(ln);
    const pickV = (/** @type {number} */ lim) => {
      for (let i = 0; i < 200; i++) {
        const v = valAt(ln, rng.int(0, N));
        if (near(v, 0) || Math.abs(v) > lim) continue;
        if (Math.abs(v / ln.lab - Math.round(v / ln.lab)) < 1e-6 && rng.chance(0.8)) continue;
        return v;
      }
      return valAt(ln, N - 1);
    };
    let base;
    if (mode === "place") {
      const v = pickV(ln.max);
      const s = C.say(v);
      base = {
        q: `The reading is ${s[0]}. Tap the thermometer to place the marker. ¦ La lectura es ${s[1]}. Toca el termómetro para poner el marcador.`,
        x: `${s[0]} is ${n(Math.abs(v))} ${ctxKey === "temp" ? "degrees" : "meters"} ${v < 0 ? "below" : "above"} zero, so the marker sits at ${n(v)}. ¦ ${s[1]} está a ${n(Math.abs(v))} ${ctxKey === "temp" ? "grados" : "metros"} ${v < 0 ? "bajo" : "sobre"} cero, así que el marcador queda en ${n(v)}.`,
        want: [v],
        given: null,
      };
    } else if (mode === "opposite") {
      const g = pickV(ln.max - ln.step);
      const s = C.say(g);
      base = {
        q: `The marker shows ${s[0]}. Place the opposite reading. ¦ El marcador muestra ${s[1]}. Pon la lectura opuesta.`,
        x: `Opposites are the same distance from zero on opposite sides. The opposite of ${n(g)} is ${n(-g)}. ¦ Los opuestos están a la misma distancia del cero, en lados opuestos. El opuesto de ${n(g)} es ${n(-g)}.`,
        want: [-g],
        given: g,
      };
    } else {
      let lo = 0;
      let hi = 0;
      for (let i = 0; i < 200; i++) {
        lo = valAt(ln, rng.int(1, N - 3));
        hi = valAt(ln, rng.int(1, N - 1));
        if (hi - lo >= 3 * ln.step && hi - lo <= 14 && (lo < 0 || hi > 0)) break;
      }
      const mid = r4(lo + ln.step * Math.floor(Math.round((hi - lo) / ln.step) / 2));
      const sh = C.say(hi);
      const sl = C.say(lo);
      base = {
        q: `Place a reading that is ${C.less[0]} ${sh[0]} and ${C.more[0]} ${sl[0]}. ¦ Pon una lectura ${C.less[1]} ${sh[1]} y ${C.more[1]} ${sl[1]}.`,
        x: `The marker must be above ${n(lo)} and below ${n(hi)} on the thermometer. A reading such as ${n(mid)} fits. ¦ El marcador debe estar arriba de ${n(lo)} y debajo de ${n(hi)} en el termómetro. Una lectura como ${n(mid)} cumple.`,
        want: [mid],
        given: null,
        lo,
        hi,
      };
    }
    const pack = K.pack({
      q: base.q,
      x: base.x,
      h: [
        "Find zero first. Readings below zero are under it, and readings above zero are over it. ¦ Busca primero el cero. Las lecturas bajo cero están debajo de él y las lecturas sobre cero están arriba.",
        mode === "between"
          ? "Decide which reading is lower on the thermometer and which is higher. The marker goes between them. ¦ Decide cuál lectura está más abajo en el termómetro y cuál más arriba. El marcador va entre las dos."
          : "Count the ticks from zero, one at a time, up or down. ¦ Cuenta las marcas desde el cero, una por una, hacia arriba o hacia abajo.",
        ln.step < 1
          ? "Each tick is one half. Two ticks make one whole unit. ¦ Cada marca vale un medio. Dos marcas forman una unidad entera."
          : "Use the labeled numbers to help you count. ¦ Usa los números rotulados para ayudarte a contar.",
      ],
    });
    return {
      ...pack,
      mode,
      ctx: ctxKey,
      line: ln,
      ...base,
      q: pack.q,
      x: pack.x,
      model: { mode, ctx: ctxKey, want: base.want, given: base.given },
    };
  }

  function gradeThermo(/** @type {any} */ spec, /** @type {any} */ state) {
    const raw = state && state.v;
    const v =
      raw === null || raw === undefined || !Number.isFinite(Number(raw)) ? null : Number(raw);
    if (v === null)
      return K.miss(
        "no-point",
        "Tap the thermometer to place the marker first. ¦ Toca primero el termómetro para poner el marcador.",
      );
    const st = spec.line.step;
    if (spec.mode === "between") {
      if (v > spec.lo + 1e-6 && v < spec.hi - 1e-6) return { ok: true };
      if (near(v, spec.lo) || near(v, spec.hi))
        return K.miss(
          "compare-assumed-equal",
          "That is one of the two readings. The marker must sit strictly between them. ¦ Esa es una de las dos lecturas. El marcador debe quedar estrictamente entre las dos.",
        );
      if (v > 0 && spec.hi < 0 && v > Math.abs(spec.hi) && v < Math.abs(spec.lo))
        return K.miss(
          "integer-order-by-size",
          "That reading fits the sizes of the numbers but not their signs. Below zero is under zero. ¦ Esa lectura cabe en el tamaño de los números pero no en sus signos. Bajo cero está debajo del cero.",
        );
      return K.miss(
        "compare-direction-reversed",
        "That reading is not between the two. Find the lower reading and the higher reading on the thermometer, then place the marker between them. ¦ Esa lectura no está entre las dos. Busca la lectura más baja y la más alta en el termómetro y pon el marcador entre ellas.",
      );
    }
    const want = spec.want[0];
    if (near(v, want)) return { ok: true };
    if (spec.mode === "opposite" && near(v, spec.given))
      return K.miss(
        "opposite-misread",
        "That is the reading itself. The opposite is on the other side of zero, the same distance away. ¦ Esa es la lectura misma. El opuesto está al otro lado del cero, a la misma distancia.",
      );
    if (spec.mode === "place" && near(v, -want))
      return K.miss(
        "negative-direction-reversed",
        "That reading is on the other side of zero. Below zero is down on the thermometer, and above zero is up. ¦ Esa lectura está al otro lado del cero. Bajo cero está abajo en el termómetro y sobre cero está arriba.",
      );
    if (near(v, 0))
      return K.miss(
        "zero-reference-misused",
        "Zero is the starting reading. This reading is some distance away from zero. ¦ El cero es la lectura de partida. Esta lectura está a cierta distancia del cero.",
      );
    if (near(Math.abs(v - want), st))
      return K.miss(
        "number-line-misread",
        "You are very close. Count the ticks again from the nearest labeled number. ¦ Estás muy cerca. Cuenta otra vez las marcas desde el número rotulado más cercano.",
      );
    return K.miss(
      "number-line-misread",
      "Check two things: which side of zero, and how many ticks from zero. ¦ Revisa dos cosas: de qué lado del cero está y cuántas marcas hay desde el cero.",
    );
  }

  const CSS = `
.th-wrap{display:grid;gap:10px}
.th-view{max-width:560px}
.th-view.vert{max-width:230px}
.th-tube{fill:var(--brand-tint,#E5ECF3);stroke:var(--brand,#2C4A68);stroke-width:2}
.th-zero{stroke:var(--sun,#F0BD4F);stroke-width:5}
.th-tk{stroke:var(--ink,#1B2733);stroke-width:1.6}
.th-lab{fill:var(--ink,#1B2733);font:700 12px system-ui,sans-serif;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.th-lab.big{font-size:13px;fill:var(--brand,#2C4A68)}
.th-mk{fill:var(--brand,#2C4A68);stroke:var(--surface,#fff);stroke-width:2.5}
.th-given{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:2}
.th-mk.ok{fill:var(--ok,#0A7D4B)}
.th-cur{fill:none;stroke:var(--ink,#1B2733);stroke-width:3}
.th-sl{cursor:crosshair;touch-action:none}
.th-sl:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
@media (forced-colors:active){.th-mk{fill:Highlight;stroke:Canvas}.th-tk,.th-zero,.th-cur,.th-tube{stroke:CanvasText}.th-lab{fill:CanvasText}.th-given{fill:Canvas;stroke:CanvasText}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("thermo", CSS);
    const c = K.start(host, spec, api, "thermo");
    const { L, T } = c;
    const ln = spec.line;
    const N = ticks(ln);
    const C = /** @type {any} */ (CTX)[spec.ctx];
    /** @type {number | null} */
    let v = c.saved && c.saved.v !== null && c.saved.v !== undefined ? Number(c.saved.v) : null;
    if (c.solved) v = spec.want[0];
    let vertical = true;
    const view = A.el("div", "ak-svg th-sl th-view vert", "", {
      tabindex: c.solved ? "-1" : "0",
      role: "slider",
    });
    const rot = A.el("button", "ak-btn", "", { type: "button", "aria-pressed": "false" });
    const up = A.el("button", "ak-step", "▲", { type: "button" });
    const down = A.el("button", "ak-step", "▼", { type: "button" });
    const out = A.el("p", "ak-text");
    const idx = () =>
      v === null ? Math.round(-ln.min / ln.step) : Math.round((v - ln.min) / ln.step);
    const text = (/** @type {number} */ x) => C.say(x);

    function relabel() {
      rot.textContent = "";
      rot.append(
        ...(vertical
          ? [T("Rotate: lay it flat", "Girar: acostarlo")]
          : [T("Rotate: stand it up", "Girar: ponerlo de pie")]),
      );
      rot.setAttribute("aria-pressed", String(!vertical));
      c.label(
        up,
        vertical ? "Up one tick" : "Right one tick",
        vertical ? "Subir una marca" : "Una marca a la derecha",
      );
      c.label(
        down,
        vertical ? "Down one tick" : "Left one tick",
        vertical ? "Bajar una marca" : "Una marca a la izquierda",
      );
      view.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
      view.setAttribute("aria-valuemin", String(ln.min));
      view.setAttribute("aria-valuemax", String(ln.max));
      view.setAttribute(
        "aria-label",
        L(
          `Thermometer line from ${n(ln.min)} to ${n(ln.max)}. Arrow keys move the marker one tick.`,
          `Línea de termómetro de ${n(ln.min)} a ${n(ln.max)}. Las flechas mueven el marcador una marca.`,
        ),
      );
      if (v !== null) {
        view.setAttribute("aria-valuenow", String(v));
        view.setAttribute("aria-valuetext", L(text(v)[0], text(v)[1]));
      } else {
        view.removeAttribute("aria-valuenow");
        view.setAttribute("aria-valuetext", L("No marker yet", "Todavía no hay marcador"));
      }
    }
    function draw() {
      const Wd = vertical ? 200 : 540;
      const Hd = vertical ? 340 : 130;
      const a0 = vertical ? 20 : 30; // start of the scale along its length
      const len = (vertical ? Hd : Wd) - 2 * a0;
      const pos = (/** @type {number} */ x) =>
        Math.round(
          (vertical
            ? a0 + ((ln.max - x) / (ln.max - ln.min)) * len
            : a0 + ((x - ln.min) / (ln.max - ln.min)) * len) * 10,
        ) / 10;
      const ax = vertical ? 70 : 50;
      let s = vertical
        ? `<rect class="th-tube" x="${ax - 12}" y="${a0 - 10}" width="24" height="${len + 20}" rx="12"/>`
        : `<rect class="th-tube" x="${a0 - 10}" y="${ax - 12}" width="${len + 20}" height="24" rx="12"/>`;
      s += vertical
        ? `<line class="th-zero" x1="${ax - 16}" y1="${pos(0)}" x2="${ax + 16}" y2="${pos(0)}"/>`
        : `<line class="th-zero" x1="${pos(0)}" y1="${ax - 16}" x2="${pos(0)}" y2="${ax + 16}"/>`;
      for (let k = 0; k <= N; k++) {
        const x = valAt(ln, k);
        const lab = Math.abs(x / ln.lab - Math.round(x / ln.lab)) < 1e-6;
        const h = lab ? 10 : 6;
        s += vertical
          ? `<line class="th-tk" x1="${ax + 14}" y1="${pos(x)}" x2="${ax + 14 + h}" y2="${pos(x)}"/>`
          : `<line class="th-tk" x1="${pos(x)}" y1="${ax + 14}" x2="${pos(x)}" y2="${ax + 14 + h}"/>`;
        if (lab)
          s += vertical
            ? `<text class="th-lab" x="${ax + 34}" y="${pos(x) + 4}">${n(x)}</text>`
            : `<text class="th-lab" text-anchor="middle" x="${pos(x)}" y="${ax + 42}">${n(x)}</text>`;
      }
      s += vertical
        ? `<text class="th-lab big" x="${ax}" y="${Hd - 4}" text-anchor="middle">${C.unit}</text>`
        : `<text class="th-lab big" x="${Wd - 20}" y="${ax - 18}" text-anchor="end">${C.unit}</text>`;
      if (spec.given !== null && spec.given !== undefined)
        s += vertical
          ? `<path class="th-given" d="M${ax - 14} ${pos(spec.given)} l14 -12 l14 12 l-14 12z"/><text class="th-lab big" x="${ax - 20}" y="${pos(spec.given) - 14}" text-anchor="end">${n(spec.given)}</text>`
          : `<path class="th-given" d="M${pos(spec.given)} ${ax - 14} l12 14 l-12 14 l-12 -14z"/><text class="th-lab big" x="${pos(spec.given)}" y="${ax - 22}" text-anchor="middle">${n(spec.given)}</text>`;
      if (spec.mode === "between" && c.solved) {
        /* the two readings stay unmarked: the item gives them in words */
      }
      if (v !== null)
        s += `<circle class="th-mk${c.solved ? " ok" : ""}" cx="${vertical ? ax : pos(v)}" cy="${vertical ? pos(v) : ax}" r="11"/><text class="th-lab big" ${vertical ? `x="${ax - 18}" y="${pos(v) + 4}" text-anchor="end"` : `x="${pos(v)}" y="${ax - 18}" text-anchor="middle"`}>${n(v)}</text>`;
      view.innerHTML = `<svg viewBox="0 0 ${Wd} ${Hd}" role="img" aria-hidden="true" focusable="false">${s}</svg>`;
      view.classList.toggle("vert", vertical);
      view.dataset.geom = JSON.stringify({ Wd, Hd, a0, len });
      out.textContent =
        v === null
          ? L("No marker yet.", "Todavía no hay marcador.")
          : L(`Marker: ${text(v)[0]}`, `Marcador: ${text(v)[1]}`);
      c.checkBtn.disabled = v === null;
      up.disabled = down.disabled = c.solved;
    }
    const set = (/** @type {number} */ k, /** @type {boolean} */ speak = true) => {
      k = Math.max(0, Math.min(N, k));
      v = valAt(ln, k);
      c.emit({ v });
      if (speak) c.say(text(v)[0], text(v)[1]);
      relabel();
      draw();
    };
    const fromPointer = (/** @type {any} */ e) => {
      const b = view.getBoundingClientRect();
      const g = JSON.parse(view.dataset.geom || "{}");
      const px =
        ((vertical ? e.clientY - b.top : e.clientX - b.left) * (vertical ? g.Hd : g.Wd)) /
        (vertical ? b.height || g.Hd : b.width || g.Wd);
      const f = Math.max(0, Math.min(1, (px - g.a0) / g.len));
      return Math.round((vertical ? 1 - f : f) * N);
    };
    if (!c.solved) {
      view.addEventListener("pointerdown", (e) => {
        view.focus({ preventScroll: true });
        set(fromPointer(e), false);
      });
      view.addEventListener("pointermove", (e) => {
        if (e.buttons || e.pointerType === "touch") set(fromPointer(e), false);
      });
      view.addEventListener("pointerup", (e) => set(fromPointer(e)));
      view.addEventListener("keydown", (e) => {
        const lab = Math.max(1, Math.round(ln.lab / ln.step));
        const d = /** @type {any} */ ({
          ArrowUp: 1,
          ArrowRight: 1,
          ArrowDown: -1,
          ArrowLeft: -1,
          PageUp: lab,
          PageDown: -lab,
        })[e.key];
        if (d) {
          e.preventDefault();
          set(idx() + d);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          set(e.key === "Home" ? 0 : N);
        }
      });
      up.addEventListener("click", () => set(idx() + 1));
      down.addEventListener("click", () => set(idx() - 1));
      rot.addEventListener("click", () => {
        vertical = !vertical;
        relabel();
        draw();
        c.say(
          vertical ? "Thermometer standing up" : "Thermometer lying flat",
          vertical ? "Termómetro de pie" : "Termómetro acostado",
        );
      });
    }
    const tools = A.el("div", "ak-row");
    tools.append(down, up, rot);
    c.body.append(A.el("div", "th-wrap"));
    c.body.firstChild.append(view, ...(c.solved ? [] : [tools]), out);
    c.redraws.push(() => {
      relabel();
      draw();
    });
    c.wire(
      () => ({ v }),
      () => {
        v = null;
        c.emit({ v });
      },
    );
    relabel();
    draw();
  }

  A.register("thermo", {
    title: "Thermometer line",
    titleEs: "Línea de termómetro",
    levels: 4,
    make: mkThermo,
    solution: (spec) => ({ v: spec.want[0] }),
    wrong(spec) {
      const st = spec.line.step;
      if (spec.mode === "between")
        return [
          { v: spec.lo },
          { v: spec.hi },
          { v: r4(spec.hi + 2 * st) },
          { v: r4(spec.lo - 2 * st) },
          { v: null },
        ];
      const w = spec.want[0];
      const out = [{ v: r4(-w) }, { v: r4(w + st) }, { v: r4(w - st) }, { v: 0 }, { v: null }];
      if (spec.mode === "opposite") out.push({ v: spec.given });
      return out.filter(
        (s) =>
          s.v === null ||
          (!near(s.v, w) && Math.abs(s.v) <= spec.line.max + 1e-6 && Math.abs(s.v) >= 0),
      );
    },
    grade: gradeThermo,
    mount,
  });
})();
