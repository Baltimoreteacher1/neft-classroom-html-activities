/* Hands-on models, part 3: a ratio tape with its table, and a slope graph for Grade 8. */
import { h, p, se } from "./core.js";
import { fmt, modelButton, statusLine, stepper } from "./model-kit.js";

/* ---- Ratio tape + table --------------------------------------------------------------------------------------- */
/* a of nameA for every b of nameB. Batches stack side by side; the table adds a row per batch. */
export function ratioModel(
  host,
  K,
  {
    a = 2,
    b = 3,
    nameA,
    nameB,
    max = 8,
    unitRow = false,
    initial = { n: 1, unit: false },
    onChange,
  } = {},
) {
  let n = initial.n;
  let unit = initial.unit;
  const st = statusLine();
  const tape = h("div", { class: "rt-tape", role: "img" });
  const table = h("table", { class: "rt-table" });
  const batches = stepper(K, p("Batches", "Tandas"), {
    min: 1,
    max,
    value: n,
    onChange: (v) => {
      n = v;
      paint();
      emit();
    },
  });
  const unitBtn = modelButton(
    K,
    p("Find the amount for 1", "Hallar la cantidad para 1"),
    () => {
      unit = !unit;
      unitBtn.setAttribute("aria-pressed", String(unit));
      paint();
      emit();
    },
    "m-btn",
  );
  unitBtn.setAttribute("aria-pressed", String(unit));
  const emit = () => onChange?.({ n, unit });
  const paint = () => {
    const rowOf = (cls, count, per) =>
      h(
        "div",
        { class: "rt-line" },
        Array.from({ length: n }, () =>
          h(
            "span",
            { class: "rt-batch" },
            Array.from({ length: per }, () => h("i", { class: `rt-unit ${cls}` })),
          ),
        ),
      );
    const small = a > 6 || b > 6;
    tape.dataset.small = String(small);
    tape.replaceChildren(
      h("p", { class: "rt-cap" }, K.only(nameA)),
      rowOf("rt-a", n, a),
      h("p", { class: "rt-cap" }, K.only(nameB)),
      rowOf("rt-b", n, b),
    );
    const head = h(
      "tr",
      {},
      h("th", { scope: "col" }, K.only(nameA)),
      h("th", { scope: "col" }, K.only(nameB)),
    );
    const rowsHtml = [];
    if (unitRow && unit)
      rowsHtml.push(h("tr", { class: "rt-unit-row" }, h("td", {}, "1"), h("td", {}, fmt(b / a))));
    for (let i = 1; i <= n; i += 1)
      rowsHtml.push(
        h(
          "tr",
          { class: i === n ? "rt-now" : "" },
          h("td", {}, String(a * i)),
          h("td", {}, String(b * i)),
        ),
      );
    table.replaceChildren(h("thead", {}, head), h("tbody", {}, rowsHtml));
    const es = K.one() === "es";
    const spoken = es
      ? `${n} ${n === 1 ? "tanda" : "tandas"}: ${a * n} ${K.only(nameA)} y ${b * n} ${K.only(nameB)}.${unitRow && unit ? ` Para 1 ${K.only(nameA)}: ${fmt(b / a)} ${K.only(nameB)}.` : ""}`
      : `${n} ${n === 1 ? "batch" : "batches"}: ${a * n} ${K.only(nameA)} and ${b * n} ${K.only(nameB)}.${unitRow && unit ? ` For 1 ${K.only(nameA)}: ${fmt(b / a)} ${K.only(nameB)}.` : ""}`;
    tape.setAttribute("aria-label", spoken);
    st.say(spoken);
  };
  host.append(
    h("div", { class: "rt-wrap" }, tape, table),
    h("div", { class: "m-row" }, batches.el, unitRow ? unitBtn : null),
    st.el,
  );
  paint();
  return { get: () => ({ n, unit }), set: () => {} };
}

/* ---- Slope graph: a line through the origin, its point, and a slope triangle ---------------------------------- */
export function slopeGraph(
  host,
  K,
  { x: px = 4, y: py = 6, maxX = 8, maxY = 10, initial = { run: 1 }, onChange, masked = false } = {},
) {
  let hide = masked;
  let run = initial.run;
  const k = py / px;
  const st = statusLine();
  const S = 46;
  const ox = 40;
  const oy = 20 + maxY * S * 0.5;
  const sy = S * 0.5;
  const root = se("svg", {
    class: "sg-svg",
    viewBox: `0 0 ${ox + maxX * S + 30} ${oy + 44}`,
    role: "img",
  });
  const X = (v) => ox + v * S;
  const Y = (v) => oy - v * sy;
  for (let i = 0; i <= maxX; i += 1)
    root.append(
      se("line", {
        x1: X(i),
        x2: X(i),
        y1: Y(0),
        y2: Y(maxY),
        stroke: "#d6dde3",
        "stroke-width": 1,
      }),
    );
  for (let j = 0; j <= maxY; j += 1)
    root.append(
      se("line", {
        x1: X(0),
        x2: X(maxX),
        y1: Y(j),
        y2: Y(j),
        stroke: "#d6dde3",
        "stroke-width": 1,
      }),
    );
  root.append(
    se("path", {
      d: `M${X(0)} ${Y(maxY)}V${Y(0)}H${X(maxX)}`,
      fill: "none",
      stroke: "#17324d",
      "stroke-width": 3,
    }),
  );
  for (let i = 0; i <= maxX; i += 2) {
    const t = se("text", {
      x: X(i),
      y: Y(0) + 22,
      "text-anchor": "middle",
      "font-size": 14,
      "font-weight": 700,
      fill: "#17324d",
    });
    t.textContent = String(i);
    root.append(t);
  }
  for (let j = 0; j <= maxY; j += 2) {
    const t = se("text", {
      x: X(0) - 10,
      y: Y(j) + 5,
      "text-anchor": "end",
      "font-size": 14,
      "font-weight": 700,
      fill: "#17324d",
    });
    t.textContent = String(j);
    root.append(t);
  }
  const endX = Math.min(maxX, maxY / k);
  root.append(
    se("line", {
      x1: X(0),
      y1: Y(0),
      x2: X(endX),
      y2: Y(endX * k),
      stroke: "#1fa6a2",
      "stroke-width": 4.5,
      "stroke-linecap": "round",
    }),
  );
  root.append(
    se("circle", {
      cx: X(px),
      cy: Y(py),
      r: 7.5,
      fill: "#d8613c",
      stroke: "#17324d",
      "stroke-width": 2.4,
    }),
  );
  const tri = se("g");
  root.append(tri);
  const eq = h("p", { class: "m-equation", "aria-hidden": "true" });
  const paint = () => {
    tri.replaceChildren();
    const rise = run * k;
    tri.append(
      se("path", {
        d: `M${X(0)} ${Y(0)}H${X(run)}V${Y(rise)}`,
        fill: "rgba(242,193,91,.35)",
        stroke: "#a3401f",
        "stroke-width": 3,
        "stroke-dasharray": "7 5",
      }),
    );
    const lab = (tx, ty, text, anchor) => {
      const t = se("text", {
        x: tx,
        y: ty,
        "text-anchor": anchor,
        "font-size": 15,
        "font-weight": 700,
        fill: "#a3401f",
      });
      t.textContent = text;
      tri.append(t);
    };
    lab(X(run / 2), Y(0) - 8, `${K.one() === "es" ? "avance" : "run"} ${run}`, "middle");
    lab(X(run) + 8, Y(rise / 2), `${K.one() === "es" ? "subida" : "rise"} ${fmt(rise)}`, "start");
    eq.textContent = hide ? `${fmt(rise)} ÷ ${run} = ?` : `${fmt(rise)} ÷ ${run} = ${fmt(k)}`;
    const spoken =
      K.one() === "es"
        ? `La recta pasa por (0, 0) y (${px}, ${py}). Con avance ${run}, la subida es ${fmt(rise)}.${hide ? "" : ` Subida entre avance es ${fmt(k)}.`}`
        : `The line passes through (0, 0) and (${px}, ${py}). With a run of ${run}, the rise is ${fmt(rise)}.${hide ? "" : ` Rise divided by run is ${fmt(k)}.`}`;
    root.setAttribute("aria-label", spoken);
    st.say(spoken);
  };
  const runStep = stepper(K, p("Run (steps right)", "Avance (pasos a la derecha)"), {
    min: 1,
    max: maxX,
    value: run,
    onChange: (v) => {
      run = v;
      paint();
      onChange?.({ run });
    },
  });
  host.append(
    h("div", { class: "sg-wrap" }, root),
    eq,
    h("div", { class: "m-row" }, runStep.el),
    st.el,
  );
  paint();
  return {
    get: () => ({ run }),
    set: () => {},
    reveal: () => {
      hide = false;
      paint();
    },
  };
}
