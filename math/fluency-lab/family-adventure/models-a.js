/* Hands-on models, part 1: ten-frame, number line, array and area model.
 * Each is a real, keyboard-operable control with a spoken status line, not a picture. */
import { h, p, se } from "./core.js";
import { modelButton, statusLine, stepper } from "./model-kit.js";

const NS_LABEL = {
  empty: p("empty", "vacía"),
  filled: p("filled", "con ficha"),
};

/* ---- Ten-frame ------------------------------------------------------------------------------------------------ */
export function tenFrame(
  host,
  K,
  { initial = { count: 0 }, onChange, showMissing = false, masked = false } = {},
) {
  let n = initial.count ?? 0;
  let hide = masked;
  const st = statusLine();
  const cells = Array.from({ length: 10 }, (_, i) =>
    h("button", { type: "button", class: "tf-cell", "aria-pressed": "false" }),
  );
  const grid = h(
    "div",
    {
      class: "tf-grid",
      role: "group",
      "aria-label": K.plain(
        p(
          "Ten-frame: ten boxes in two rows of five",
          "Marco de diez: diez casillas en dos filas de cinco",
        ),
      ),
    },
    cells,
  );
  const eq = h("p", { class: "m-equation", "aria-hidden": "true" });
  const paint = () => {
    cells.forEach((c, i) => {
      const on = i < n;
      c.setAttribute("aria-pressed", String(on));
      c.dataset.row = i < 5 ? "a" : "b";
      c.dataset.missing = String(showMissing && !on);
      c.setAttribute(
        "aria-label",
        `${K.one() === "es" ? "Casilla" : "Box"} ${i + 1}: ${K.only(on ? NS_LABEL.filled : NS_LABEL.empty)}`,
      );
    });
    eq.textContent = hide ? `${n} + ? = 10` : `${n} + ${10 - n} = 10`;
    const es = K.one() === "es";
    st.say(
      hide
        ? es
          ? `${n} fichas en el marco.`
          : `${n} counters in the frame.`
        : es
          ? `${n} fichas y ${10 - n} casillas vacías. ${n} + ${10 - n} = 10.`
          : `${n} counters and ${10 - n} empty boxes. ${n} + ${10 - n} = 10.`,
    );
  };
  const set = (next, quiet) => {
    n = Math.max(0, Math.min(10, next));
    paint();
    if (!quiet) onChange?.({ count: n });
  };
  cells.forEach((c, i) => c.addEventListener("click", () => set(i < n ? i : i + 1)));
  const more = modelButton(K, p("Add a counter", "Poner una ficha"), () => set(n + 1));
  const less = modelButton(K, p("Take one away", "Quitar una ficha"), () => set(n - 1));
  const clear = modelButton(K, p("Clear", "Vaciar"), () => set(0), "m-btn m-btn-quiet");
  host.append(grid, eq, h("div", { class: "m-row" }, more, less, clear), st.el);
  paint();
  return {
    get: () => ({ count: n }),
    set: (v) => set(v.count, true),
    reveal: () => {
      hide = false;
      paint();
    },
  };
}

/* ---- Number line ---------------------------------------------------------------------------------------------- */
export function numberLine(
  host,
  K,
  { min = 0, max = 100, start = 0, hops = [10, 1], initial, onChange } = {},
) {
  let path = initial?.path?.length ? initial.path.slice() : [start];
  const W = 700;
  const x = (v) => 30 + ((v - min) / (max - min)) * (W - 60);
  const every = max - min <= 12 ? 1 : max - min <= 30 ? 5 : 10;
  const st = statusLine();
  const root = se("svg", {
    viewBox: `0 0 ${W} 150`,
    class: "nl-svg",
    role: "img",
    "aria-label": K.plain(p("Number line", "Recta numérica")),
  });
  const arcs = se("g");
  const marker = se(
    "g",
    { class: "nl-marker" },
    se("circle", { r: 11, cy: 96, fill: "#d8613c", stroke: "#17324d", "stroke-width": 3 }),
  );
  root.append(
    se("line", {
      x1: x(min),
      x2: x(max),
      y1: 96,
      y2: 96,
      stroke: "#17324d",
      "stroke-width": 4,
      "stroke-linecap": "round",
    }),
  );
  for (let v = min; v <= max; v += 1) {
    const major = (v - min) % every === 0;
    root.append(se("line", { x1: x(v), x2: x(v), y1: 96 - (major ? 11 : 5), y2: 96 + (major ? 11 : 5), stroke: "#17324d", "stroke-width": major ? 2.6 : 1.2 }));
    if (major) {
      const t = se("text", { x: x(v), y: 126, "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: "#17324d" });
      t.textContent = String(v);
      root.append(t);
    }
  }
  root.append(arcs, marker);
  const draw = () => {
    arcs.replaceChildren();
    for (let i = 1; i < path.length; i += 1) {
      const a = x(path[i - 1]);
      const b = x(path[i]);
      const mid = (a + b) / 2;
      const lift = Math.min(60, 22 + Math.abs(b - a) / 6);
      arcs.append(
        se("path", {
          d: `M${a} 86Q${mid} ${86 - lift} ${b} 86`,
          fill: "none",
          stroke: "#1fa6a2",
          "stroke-width": 3.4,
          "stroke-linecap": "round",
        }),
      );
      const lab = se("text", {
        x: mid,
        y: 78 - lift / 2,
        "text-anchor": "middle",
        "font-size": 14,
        "font-weight": 700,
        fill: "#0b6b68",
      });
      lab.textContent = `${path[i] - path[i - 1] > 0 ? "+" : "−"}${Math.abs(path[i] - path[i - 1])}`;
      arcs.append(lab);
    }
    marker.setAttribute("transform", `translate(${x(path.at(-1))} 0)`);
    const here = path.at(-1);
    st.say(
      K.one() === "es"
        ? `Empiezas en ${path[0]}. Estás en ${here}. Camino: ${path.join(" → ")}.`
        : `You started at ${path[0]}. You are at ${here}. Path: ${path.join(" → ")}.`,
    );
    for (const b of buttons) b.el.disabled = here + b.d < min || here + b.d > max;
  };
  const hop = (d) => {
    const next = path.at(-1) + d;
    if (next < min || next > max) return;
    path.push(next);
    draw();
    onChange?.({ path: path.slice(), at: next });
  };
  const buttons = hops
    .flatMap((d) => [d, -d])
    .map((d) => ({
      d,
      el: modelButton(
        K,
        p(`Hop ${d > 0 ? "+" : "−"}${Math.abs(d)}`, `Salto ${d > 0 ? "+" : "−"}${Math.abs(d)}`),
        () => hop(d),
      ),
    }));
  const reset = modelButton(
    K,
    p("Back to start", "Volver al inicio"),
    () => {
      path = [start];
      draw();
      onChange?.({ path: path.slice(), at: start });
    },
    "m-btn m-btn-quiet",
  );
  host.append(
    h("div", { class: "nl-wrap" }, root),
    h(
      "div",
      { class: "m-row" },
      buttons.map((b) => b.el),
      reset,
    ),
    st.el,
  );
  draw();
  return { get: () => ({ path: path.slice(), at: path.at(-1) }), set: () => {} };
}

/* ---- Array ---------------------------------------------------------------------------------------------------- */
export function arrayModel(
  host,
  K,
  { initial = { rows: 3, cols: 4 }, onChange, maxR = 10, maxC = 10 } = {},
) {
  let rows = initial.rows;
  let cols = initial.cols;
  const st = statusLine();
  const dots = se("g");
  const cell = 30;
  const root = se("svg", {
    class: "ar-svg",
    viewBox: `0 0 ${maxC * cell + 10} ${maxR * cell + 10}`,
    role: "img",
  });
  root.append(dots);
  const sum = h("p", { class: "m-equation", "aria-hidden": "true" });
  const paint = () => {
    dots.replaceChildren();
    root.setAttribute("viewBox", `0 0 ${cols * cell + 10} ${rows * cell + 10}`);
    root.style.width = `${cols * cell + 10}px`;
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1)
        dots.append(
          se("circle", {
            cx: 5 + c * cell + cell / 2,
            cy: 5 + r * cell + cell / 2,
            r: 11,
            fill: r % 2 ? "#f2c15b" : "#1fa6a2",
            stroke: "#17324d",
            "stroke-width": 1.6,
          }),
        );
    const adds = Array(rows).fill(cols);
    const text = adds.length > 6 ? `${cols} + ${cols} + … + ${cols}` : adds.join(" + ");
    sum.textContent = `${text} = ${rows * cols}   ·   ${rows} × ${cols} = ${rows * cols}`;
    const spoken =
      K.one() === "es"
        ? `${rows} filas de ${cols}. En total ${rows * cols}.`
        : `${rows} rows of ${cols}. ${rows * cols} in all.`;
    root.setAttribute("aria-label", spoken);
    st.say(spoken);
  };
  const r = stepper(K, p("Rows", "Filas"), {
    min: 1,
    max: maxR,
    value: rows,
    onChange: (v) => {
      rows = v;
      paint();
      onChange?.({ rows, cols });
    },
  });
  const c = stepper(K, p("In each row", "En cada fila"), {
    min: 1,
    max: maxC,
    value: cols,
    onChange: (v) => {
      cols = v;
      paint();
      onChange?.({ rows, cols });
    },
  });
  const turn = modelButton(
    K,
    p("Turn the array", "Girar el arreglo"),
    () => {
      [rows, cols] = [cols, rows];
      r.set(rows, true);
      c.set(cols, true);
      paint();
      onChange?.({ rows, cols });
    },
    "m-btn m-btn-quiet",
  );
  host.append(
    h("div", { class: "ar-wrap" }, root),
    h("div", { class: "m-row" }, r.el, c.el, turn),
    sum,
    st.el,
  );
  paint();
  return { get: () => ({ rows, cols }), set: () => {} };
}

/* ---- Area model (a two-digit number times a one-digit number) ------------------------------------------------- */
export function areaModel(
  host,
  K,
  { a = 23, b = 4, initial = { split: false }, onChange, masked = false } = {},
) {
  let split = initial.split;
  let hide = masked;
  const tens = Math.floor(a / 10) * 10;
  const ones = a - tens;
  const st = statusLine();
  const W = 600;
  const L = 30;
  const unit = (W - L - 10) / a;
  const H = 30 * b;
  const root = se("svg", {
    class: "am-svg",
    viewBox: `0 0 ${W} ${H + 70}`,
    role: "img",
    "aria-label": K.plain(p(`Area model: ${b} rows of ${a}`, `Modelo de área: ${b} filas de ${a}`)),
  });
  const eq = h("p", { class: "m-equation", "aria-hidden": "true" });
  const paint = () => {
    root.replaceChildren();
    root.append(
      se("rect", {
        x: L,
        y: 40,
        width: unit * tens,
        height: H,
        fill: "#cfeeed",
        stroke: "#17324d",
        "stroke-width": 2.4,
      }),
    );
    if (ones)
      root.append(
        se("rect", {
          x: L + unit * tens,
          y: 40,
          width: unit * ones,
          height: H,
          fill: split ? "#fdf3d8" : "#cfeeed",
          stroke: "#17324d",
          "stroke-width": 2.4,
        }),
      );
    const label = (tx, ty, text, size = 17) => {
      const t = se("text", {
        x: tx,
        y: ty,
        "text-anchor": "middle",
        "font-size": size,
        "font-weight": 700,
        fill: "#17324d",
      });
      t.textContent = text;
      root.append(t);
    };
    label(L + (unit * a) / 2, 22, split ? `${tens}` : `${a}`);
    if (split && ones) label(L + unit * tens + (unit * ones) / 2, 22, `${ones}`);
    if (split) {
      label(L + (unit * tens) / 2, 40 + H / 2 + 6, hide ? `${b} × ${tens}` : `${b} × ${tens} = ${b * tens}`, 20);
      if (ones) label(L + unit * tens + (unit * ones) / 2, 40 + H / 2 + 6, hide ? `${b} × ${ones}` : `${b * ones}`, 18);
    } else label(L + (unit * a) / 2, 40 + H / 2 + 6, `${b} × ${a} = ?`, 22);
    label(14, 40 + H / 2 + 6, `${b}`, 17);
    eq.textContent = split
      ? hide
        ? `${b} × ${a} = ${b} × ${tens} + ${b} × ${ones} = ?`
        : `${b} × ${a} = ${b} × ${tens} + ${b} × ${ones} = ${b * tens} + ${b * ones} = ${b * a}`
      : `${b} × ${a} = ?`;
    st.say(
      split
        ? K.one() === "es"
          ? hide
            ? `Descompusiste ${a} en ${tens} y ${ones}: ${b} × ${tens} y ${b} × ${ones}.`
            : `Descompusiste ${a} en ${tens} y ${ones}: ${b * tens} más ${b * ones} es ${b * a}.`
          : hide
            ? `You broke ${a} into ${tens} and ${ones}: ${b} × ${tens} and ${b} × ${ones}.`
            : `You broke ${a} into ${tens} and ${ones}: ${b * tens} plus ${b * ones} is ${b * a}.`
        : K.one() === "es"
          ? `Un rectángulo de ${b} filas por ${a} columnas.`
          : `A rectangle ${b} rows tall and ${a} columns wide.`,
    );
  };
  const toggle = modelButton(
    K,
    p(`Break ${a} into ${tens} + ${ones}`, `Descomponer ${a} en ${tens} + ${ones}`),
    () => {
      split = !split;
      toggle.setAttribute("aria-pressed", String(split));
      paint();
      onChange?.({ split });
    },
  );
  toggle.setAttribute("aria-pressed", String(split));
  host.append(
    h("div", { class: "am-wrap" }, root),
    eq,
    h("div", { class: "m-row" }, toggle),
    st.el,
  );
  paint();
  return {
    get: () => ({ split }),
    set: () => {},
    reveal: () => {
      hide = false;
      paint();
    },
  };
}

