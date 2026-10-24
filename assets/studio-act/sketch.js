/**
 * Practice Studio activity: sketch (window.StudioAct kind "sketch"), lesson 9-2 "Sketch the story".
 * A container fills steadily, rests, drains steadily. The student places one point for the amount at the end of each stage,
 * and the widget reads the graph back in words ("hours 2 to 3: stays the same"). The key graph is never drawn. After a miss
 * the widget shows nothing about which part is wrong unless the runtime grants per-part marks (verdict level 2).
 * State: { ys: (number | null)[] }, one value per point (the start plus the end of each stage).
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = () => A.kit;

  // [noun, article, Spanish noun, unit, Spanish unit]
  const CONTAINERS = [
    ["rain barrel", "El", "barril de lluvia", "liters", "litros"],
    ["bathtub", "La", "tina de baño", "liters", "litros"],
    ["fish tank", "El", "acuario", "liters", "litros"],
    ["water tank", "El", "tanque de agua", "liters", "litros"],
    ["wading pool", "La", "piscina pequeña", "gallons", "galones"],
  ];
  const hoursEn = (/** @type {number} */ d) => `${d} ${d === 1 ? "hour" : "hours"}`;
  const hoursEs = (/** @type {number} */ d) => `${d} ${d === 1 ? "hora" : "horas"}`;

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const cont = rng.pick(CONTAINERS);
    const ystep = lv === 1 ? 1 : lv === 4 ? 5 : rng.pick([2, 3]);
    const ymax = ystep * 10;
    const count = lv === 4 ? rng.pick([4, 5]) : lv === 3 ? rng.pick([3, 4]) : 3;
    const pattern = {
      1: ["fill", "rest", "drain"],
      2: rng.pick([
        ["fill", "rest", "drain"],
        ["fill", "fill", "rest"],
        ["fill", "drain", "rest"],
        ["fill", "rest", "fill"],
      ]),
    };
    const kinds =
      lv <= 2
        ? pattern[lv]
        : rng
            .shuffle(["fill", "drain", "rest", lv === 4 ? "fill" : "drain", "rest"])
            .slice(0, count);
    let y = lv >= 3 ? ystep * rng.int(3, 6) : 0;
    const y0 = y;
    const stages = [];
    let t = 0;
    const ys = [y];
    const ts = [0];
    for (let i = 0; i < kinds.length; i++) {
      let kind = kinds[i];
      let dur = kind === "rest" ? rng.int(1, 2) : rng.int(1, lv === 1 ? 2 : 3);
      let steps = kind === "rest" ? 0 : rng.int(1, lv === 1 ? 3 : lv === 4 ? 2 : 3);
      if (kind === "fill" && y + steps * ystep * dur > ymax) {
        steps = 1;
        dur = Math.min(dur, Math.max(1, Math.floor((ymax - y) / ystep)));
      }
      if (kind === "drain") {
        steps = Math.min(steps, Math.max(1, Math.floor(y / (ystep * dur)) || 1));
        while (dur > 1 && y - steps * ystep * dur < 0) dur--;
        if (y - steps * ystep * dur < 0) {
          kind = "rest";
          steps = 0;
        }
      }
      if (kind === "fill" && y + steps * ystep * dur > ymax) {
        kind = "rest";
        steps = 0;
      }
      const rate = (kind === "drain" ? -1 : 1) * steps * ystep;
      stages.push({ kind, dur, rate });
      y += rate * dur;
      t += dur;
      ys.push(y);
      ts.push(t);
    }
    const lastIdx = stages.length - 1;
    const words = stages.map((s, i) => {
      const r = Math.abs(s.rate);
      const [lead, leadEs] =
        i === 0
          ? ["First, it", "Primero,"]
          : i === lastIdx
            ? ["Last, it", "Al final,"]
            : ["Next, it", "Después,"];
      if (s.kind === "rest")
        return [
          `${lead} rests for ${hoursEn(s.dur)}. Nothing flows in or out.`,
          `${leadEs} descansa ${hoursEs(s.dur)}. No entra ni sale agua.`,
        ];
      return s.kind === "fill"
        ? [
            `${lead} fills steadily at ${r} ${cont[3]} each hour for ${hoursEn(s.dur)}.`,
            `${leadEs} se llena de forma constante a ${r} ${cont[4]} cada hora durante ${hoursEs(s.dur)}.`,
          ]
        : [
            `${lead} drains steadily at ${r} ${cont[3]} each hour for ${hoursEn(s.dur)}.`,
            `${leadEs} se vacía de forma constante a ${r} ${cont[4]} cada hora durante ${hoursEs(s.dur)}.`,
          ];
    });
    const start = [
      `At hour 0 the ${cont[0]} has ${y0} ${cont[3]}.`,
      `En la hora 0, ${cont[1] === "El" ? "el" : "la"} ${cont[2]} tiene ${y0} ${cont[4]}.`,
    ];
    const T = ts[ts.length - 1];
    return {
      ...k.pack({
        q: `${start[0]} ${words.map((w) => w[0]).join(" ")} Place one point for the amount at the end of each stage, starting at hour 0. ¦ ${start[1]} ${words.map((w) => w[1]).join(" ")} Coloca un punto para la cantidad al final de cada etapa, empezando en la hora 0.`,
        x: `A steady fill is a line that goes up, a rest is a flat line and a steady drain is a line that goes down. The graph of the amount of water over time has one straight piece for each stage. ¦ Un llenado constante es una línea que sube, un descanso es una línea plana y un vaciado constante es una línea que baja. La gráfica de la cantidad de agua en el tiempo tiene un tramo recto para cada etapa.`,
        h: [
          "Work one stage at a time. What does the amount do during that stage: go up, stay the same or go down? ¦ Trabaja una etapa a la vez. ¿Qué hace la cantidad durante esa etapa: sube, se mantiene o baja?",
          "For a steady stage, change in amount = rate × hours. Start from the point before it. ¦ En una etapa constante, cambio de cantidad = tasa × horas. Empieza desde el punto anterior.",
          "Read your graph back in words. Does each piece say what the story says? ¦ Lee tu gráfica en palabras. ¿Cada tramo dice lo que dice la historia?",
        ],
      }),
      cont: { en: cont[0], es: cont[2], unit: cont[3], unitEs: cont[4] },
      stages,
      ts,
      y0,
      grid: { xmax: T, ymax, ystep },
      want: { ys },
      model: { stages: stages.map((s) => `${s.kind}:${s.dur}h:${s.rate}`), y0 },
    };
  }

  const deltas = (/** @type {number[]} */ ys) => ys.slice(1).map((v, i) => v - ys[i]);

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const ys = st && Array.isArray(st.ys) ? st.ys : [];
    if (
      ys.length !== spec.ts.length ||
      ys.some((v) => typeof v !== "number" || !Number.isFinite(v))
    )
      return k.miss(
        "incomplete",
        "Place a point at hour 0 and at the end of every stage, then check. ¦ Coloca un punto en la hora 0 y al final de cada etapa; luego comprueba.",
      );
    const key = spec.want.ys;
    const kd = deltas(key);
    const sd = deltas(ys);
    const marks = [ys[0] === key[0], ...kd.map((d, i) => Math.abs(sd[i] - d) < 1e-9)];
    const parts = k.parts(marks);
    if (marks.every(Boolean)) return { ok: true, ...parts };
    if (!marks[0])
      return k.miss(
        "start",
        "Check the first point. What does the story say the amount is at hour 0? ¦ Revisa el primer punto. ¿Cuánto dice la historia que hay en la hora 0?",
        parts,
      );
    const i = marks.findIndex((m, j) => j > 0 && !m) - 1;
    const s = spec.stages[i];
    const span = `${spec.ts[i]} to ${spec.ts[i + 1]}`;
    const spanEs = `${spec.ts[i]} a ${spec.ts[i + 1]}`;
    const r = Math.abs(s.rate);
    if (s.kind === "rest")
      return k.miss(
        "rest-not-flat",
        `Hours ${span}: the story says nothing flows in or out. What should the line do there? ¦ Horas ${spanEs}: la historia dice que no entra ni sale agua. ¿Qué debe hacer la línea ahí?`,
        parts,
      );
    const up = s.kind === "fill";
    if (up ? sd[i] <= 0 : sd[i] >= 0)
      return k.miss(
        up ? "fill-direction" : "drain-direction",
        `Hours ${span}: the story says the ${spec.cont.en} ${up ? "fills" : "drains"}. Does your line ${up ? "go up" : "go down"} there? ¦ Horas ${spanEs}: la historia dice que ${up ? "se llena" : "se vacía"}. ¿Tu línea ${up ? "sube" : "baja"} ahí?`,
        parts,
      );
    const mine = Math.abs(sd[i]) / s.dur;
    return k.miss(
      "rate-amount",
      `Hours ${span}: the story says ${r} ${spec.cont.unit} each hour. Your line ${sd[i] > 0 ? "goes up" : "goes down"} ${k.n(Math.round(mine * 100) / 100)} each hour. ¦ Horas ${spanEs}: la historia dice ${r} ${spec.cont.unitEs} cada hora. Tu línea ${sd[i] > 0 ? "sube" : "baja"} ${k.n(Math.round(mine * 100) / 100)} cada hora.`,
      parts,
    );
  }

  function wrong(/** @type {any} */ spec, _rng) {
    const key = spec.want.ys;
    const step = spec.grid.ystep;
    const out = [];
    // one point off by a step
    out.push({ ys: key.map((v, i) => (i === key.length - 1 ? v + step : v)) });
    // the start point wrong
    out.push({ ys: key.map((v, i) => (i === 0 ? v + step : v)) });
    // the first moving stage mirrored: the line goes the other way
    const j = spec.stages.findIndex((s) => s.kind !== "rest");
    if (j >= 0) {
      const d = key[j + 1] - key[j];
      out.push({ ys: key.map((v, i) => (i > j ? v - 2 * d : v)) });
    }
    // a rest drawn as movement
    const rj = spec.stages.findIndex((s) => s.kind === "rest");
    if (rj >= 0) out.push({ ys: key.map((v, i) => (i > rj ? v + step : v)) });
    out.push({ ys: key.map(() => null) });
    return out.filter((s) => grade(spec, s).ok === false);
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.ak-sketch .sk-cols{display:flex;flex-wrap:wrap;gap:8px}
.ak-sketch .sk-col{flex:1 1 118px;min-width:118px;text-align:center}
.ak-sketch .sk-val{font-weight:800;font-size:1.2rem}
.ak-sketch .sk-read{margin:0;padding-left:1.2em;display:grid;gap:4px}
.ak-sketch .sk-seg{stroke:var(--brand,#2C4A68);stroke-width:4;fill:none}
.ak-sketch .sk-seg.bad{stroke:var(--bad,#B42318);stroke-dasharray:7 5}
.ak-sketch .sk-grid{stroke:var(--border,#D5DCE5);stroke-width:1}
.ak-sketch .sk-pt{fill:var(--brand,#2C4A68);stroke:var(--surface,#fff);stroke-width:2.5}
.ak-sketch .sk-pt.unset{fill:var(--surface,#fff);stroke:var(--brand,#2C4A68);stroke-dasharray:3 3}
@media (forced-colors:active){.ak-sketch .sk-seg{stroke:Highlight}.ak-sketch .sk-seg.bad{stroke:LinkText}.ak-sketch .sk-pt{fill:Highlight}.ak-sketch .sk-grid{stroke:GrayText}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("sketch", CSS);
    const k = K();
    const c = k.start(host, spec, api, "sketch");
    const { T, L } = c;
    const n = spec.ts.length;
    const sv = c.saved && Array.isArray(c.saved.ys) ? c.saved.ys : null;
    const st = { ys: (sv || (c.solved ? spec.want.ys : Array(n).fill(null))).slice(0, n) };
    while (st.ys.length < n) st.ys.push(null);
    const { xmax, ymax, ystep } = spec.grid;
    const VW = 620;
    const VH = 290;
    const ML = 52;
    const MB = 38;
    const MT = 14;
    const X = (/** @type {number} */ t) => ML + (t / xmax) * (VW - ML - 16);
    const Y = (/** @type {number} */ v) => VH - MB - (v / ymax) * (VH - MB - MT);
    const plot = A.el("div", "ak-svg", "", { role: "img" });
    c.label(
      plot,
      `Graph of the amount of water over time for the ${spec.cont.en}. Use the buttons below to place the points.`,
      `Gráfica de la cantidad de agua en el tiempo del ${spec.cont.es}. Usa los botones de abajo para colocar los puntos.`,
    );
    const cols = A.el("div", "sk-cols");
    const read = A.el("ol", "sk-read", "", { "aria-live": "polite" });
    const colEls = spec.ts.map((/** @type {number} */ t, /** @type {number} */ i) => {
      const card = A.el("div", "ak-card sk-col");
      const label = A.el("p", "ak-cap", T(`Hour ${t}`, `Hora ${t}`));
      const val = A.el("div", "sk-val", "");
      const row = A.el("div", "ak-row", "", { style: "justify-content:center" });
      const up = A.el("button", "ak-step", "▲", { type: "button" });
      const dn = A.el("button", "ak-step", "▼", { type: "button" });
      c.label(up, `Raise the point at hour ${t}`, `Subir el punto de la hora ${t}`);
      c.label(dn, `Lower the point at hour ${t}`, `Bajar el punto de la hora ${t}`);
      const bump = (/** @type {number} */ d) => {
        if (c.solved) return;
        const cur = st.ys[i];
        const next =
          cur === null ? (d > 0 ? ystep : 0) : Math.max(0, Math.min(ymax, cur + d * ystep));
        set(i, next);
      };
      up.addEventListener("click", () => bump(1));
      dn.addEventListener("click", () => bump(-1));
      row.append(dn, up);
      card.append(label, val, row);
      cols.append(card);
      return { val, up, dn, card };
    });
    c.body.append(plot, cols, A.el("p", "ak-cap", T("Your graph says", "Tu gráfica dice")), read);

    function set(/** @type {number} */ i, /** @type {number} */ v) {
      st.ys[i] = v;
      c.verdict = null;
      c.note.textContent = "";
      c.say(
        `Hour ${spec.ts[i]}: ${k.n(v)} ${spec.cont.unit}`,
        `Hora ${spec.ts[i]}: ${k.n(v)} ${spec.cont.unitEs}`,
      );
      c.emit(st);
      draw();
    }
    plot.addEventListener("pointerup", (/** @type {any} */ e) => {
      if (c.solved || (e.pointerType === "mouse" && e.button !== 0)) return;
      const r = plot.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * VW;
      const py = ((e.clientY - r.top) / r.height) * VH;
      let best = 0;
      for (let i = 1; i < n; i++)
        if (Math.abs(X(spec.ts[i]) - px) < Math.abs(X(spec.ts[best]) - px)) best = i;
      const v = ((VH - MB - py) / (VH - MB - MT)) * ymax;
      set(best, Math.max(0, Math.min(ymax, Math.round(v / ystep) * ystep)));
    });

    function describe(/** @type {number} */ i) {
      const a = st.ys[i];
      const b = st.ys[i + 1];
      if (a === null || b === null) return null;
      const dur = spec.ts[i + 1] - spec.ts[i];
      const rate = Math.round(((b - a) / dur) * 100) / 100;
      const hrs = `${spec.ts[i]}–${spec.ts[i + 1]}`;
      if (rate === 0)
        return A.t(
          `Hours ${hrs}: the ${spec.cont.en} stays the same.`,
          `Horas ${hrs}: ${spec.cont.es} se mantiene igual.`,
        );
      const upw = rate > 0;
      return A.t(
        `Hours ${hrs}: the amount ${upw ? "goes up" : "goes down"} ${k.n(Math.abs(rate))} ${spec.cont.unit} each hour.`,
        `Horas ${hrs}: la cantidad ${upw ? "sube" : "baja"} ${k.n(Math.abs(rate))} ${spec.cont.unitEs} cada hora.`,
      );
    }
    function draw() {
      const marks = c.marks();
      const s = [];
      for (let v = 0; v <= ymax; v += ystep) {
        s.push(`<line class="sk-grid" x1="${ML}" y1="${Y(v)}" x2="${VW - 10}" y2="${Y(v)}"/>`);
        if ((v / ystep) % (ymax / ystep > 10 ? 2 : 1) === 0 || v === ymax)
          s.push(
            `<text class="ak-lab" text-anchor="end" x="${ML - 6}" y="${Y(v) + 4}">${k.n(v)}</text>`,
          );
      }
      for (let t = 0; t <= xmax; t++) {
        s.push(`<line class="sk-grid" x1="${X(t)}" y1="${Y(0)}" x2="${X(t)}" y2="${Y(ymax)}"/>`);
        s.push(
          `<text class="ak-lab" text-anchor="middle" x="${X(t)}" y="${VH - MB + 18}">${t}</text>`,
        );
      }
      s.push(
        `<line class="ak-ink" x1="${ML}" y1="${Y(0)}" x2="${VW - 10}" y2="${Y(0)}"/><line class="ak-ink" x1="${ML}" y1="${Y(0)}" x2="${ML}" y2="${Y(ymax)}"/>`,
      );
      s.push(
        `<text class="ak-lab" text-anchor="middle" x="${(ML + VW) / 2}" y="${VH - 4}">${L("hours", "horas")}</text>`,
      );
      s.push(`<text class="ak-lab" x="6" y="12">${L(spec.cont.unit, spec.cont.unitEs)}</text>`);
      for (let i = 0; i < n - 1; i++) {
        const a = st.ys[i];
        const b = st.ys[i + 1];
        if (a === null || b === null) continue;
        const bad = !!marks && marks[i + 1] === false;
        s.push(
          `<line class="sk-seg${bad ? " bad" : ""}" x1="${X(spec.ts[i])}" y1="${Y(a)}" x2="${X(spec.ts[i + 1])}" y2="${Y(b)}"/>`,
        );
      }
      st.ys.forEach((v, i) => {
        s.push(
          v === null
            ? `<circle class="sk-pt unset" cx="${X(spec.ts[i])}" cy="${Y(0)}" r="8"/>`
            : `<circle class="sk-pt" cx="${X(spec.ts[i])}" cy="${Y(v)}" r="8"/>`,
        );
      });
      plot.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" aria-hidden="true" focusable="false">${s.join("")}</svg>`;
      colEls.forEach((e, i) => {
        const v = st.ys[i];
        e.val.textContent = v === null ? "?" : `${k.n(v)}`;
        e.up.disabled = e.dn.disabled = c.solved;
        e.card.classList.toggle("ak-mark-bad", !!marks && marks[i] === false && i === 0);
      });
      read.textContent = "";
      for (let i = 0; i < n - 1; i++) {
        const d = describe(i);
        if (d) read.append(A.el("li", "", d));
      }
      if (!read.children.length)
        read.append(
          A.el(
            "li",
            "",
            T(
              "Place two points to see the first piece.",
              "Coloca dos puntos para ver el primer tramo.",
            ),
          ),
        );
      c.checkBtn.disabled = st.ys.some((v) => v === null);
      c.clearBtn.disabled = st.ys.every((v) => v === null);
    }
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.ys = Array(n).fill(null);
        c.emit(st);
      },
    );
    draw();
  }

  A.register("sketch", {
    title: "Sketch the story",
    titleEs: "Dibuja la historia",
    levels: 4,
    make,
    solution: (/** @type {any} */ spec) => ({ ys: spec.want.ys.slice() }),
    wrong,
    grade,
    mount,
  });
})();
