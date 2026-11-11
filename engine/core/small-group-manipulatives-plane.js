// The two manipulatives with their own state machines: the coordinate plane (plot points
// by pointer, keyboard cursor or typed x and y) and the factor tree (split a number,
// the tool checks the product). Split from small-group-manipulatives.js to keep each
// file small; both are mounted through manipulativeFor().

import { el, esc } from "./small-group-ui.js";

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, parent = null) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const minus = (n) => String(n).replace("-", "−");

function whereIs(x, y) {
  if (x === 0 && y === 0) return "the origin";
  if (x === 0) return "on the y-axis";
  if (y === 0) return "on the x-axis";
  return `Quadrant ${x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III"}`;
}

/** Coordinate plane: click, arrow keys + Enter, or type x and y. */
export function coordinatePlane(fig) {
  const xMin = Number(fig.xMin ?? -5);
  const xMax = Number(fig.xMax ?? 5);
  const yMin = Number(fig.yMin ?? -5);
  const yMax = Number(fig.yMax ?? 5);
  if (!(xMax > xMin && yMax > yMin) || xMax - xMin > 40 || yMax - yMin > 40) return null;
  const cell = Math.min(36, 560 / Math.max(xMax - xMin, yMax - yMin));
  const pad = 26;
  const W = (xMax - xMin) * cell + pad * 2;
  const H = (yMax - yMin) * cell + pad * 2;
  const X = (x) => pad + (x - xMin) * cell;
  const Y = (y) => pad + (yMax - y) * cell;
  const root = el("div", "sgm-tool sgm-plane-wrap");
  const box = svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "sgm-svg",
    tabindex: 0,
    role: "application",
  });
  box.setAttribute(
    "aria-label",
    "Coordinate plane. Arrow keys move the cursor, Enter plots a point.",
  );
  for (let x = xMin; x <= xMax; x++)
    svgEl(
      "line",
      {
        x1: X(x),
        x2: X(x),
        y1: Y(yMax),
        y2: Y(yMin),
        class: x === 0 ? "sgm-axis-line" : "sgm-grid-line",
      },
      box,
    );
  for (let y = yMin; y <= yMax; y++)
    svgEl(
      "line",
      {
        x1: X(xMin),
        x2: X(xMax),
        y1: Y(y),
        y2: Y(y),
        class: y === 0 ? "sgm-axis-line" : "sgm-grid-line",
      },
      box,
    );
  for (let x = xMin; x <= xMax; x++)
    if (x !== 0)
      svgEl(
        "text",
        { x: X(x), y: Y(0) + 15, class: "sgm-num", "text-anchor": "middle" },
        box,
      ).textContent = minus(x);
  for (let y = yMin; y <= yMax; y++)
    if (y !== 0)
      svgEl(
        "text",
        { x: X(0) - 6, y: Y(y) + 4, class: "sgm-num", "text-anchor": "end" },
        box,
      ).textContent = minus(y);
  const layer = svgEl("g", {}, box);
  const cursor = svgEl("circle", { r: 9, class: "sgm-cursor" }, box);
  const points = [];
  let cur = { x: clamp(0, xMin, xMax), y: clamp(0, yMin, yMax) };
  const read = el("p", "sgm-read");
  read.setAttribute("aria-live", "polite");
  const list = el("p", "sgm-read", "");
  read.textContent = "Press a spot on the grid, or type x and y, to plot a point.";
  const draw = () => {
    layer.replaceChildren();
    for (const p of points)
      svgEl("circle", { cx: X(p.x), cy: Y(p.y), r: 7, class: "sgm-pt" }, layer);
    cursor.setAttribute("cx", X(cur.x));
    cursor.setAttribute("cy", Y(cur.y));
    list.textContent = points.length
      ? `Points: ${points.map((p) => `(${minus(p.x)}, ${minus(p.y)})`).join("  ")}`
      : "No points yet.";
  };
  const plot = (x, y) => {
    x = clamp(Math.round(x), xMin, xMax);
    y = clamp(Math.round(y), yMin, yMax);
    cur = { x, y };
    if (!points.some((p) => p.x === x && p.y === y)) points.push({ x, y });
    read.textContent = `Plotted (${minus(x)}, ${minus(y)}): ${whereIs(x, y)}. Move ${Math.abs(x)} ${x < 0 ? "left" : "right"}, then ${Math.abs(y)} ${y < 0 ? "down" : "up"}.`;
    draw();
  };
  box.addEventListener("pointerdown", (e) => {
    const r = box.getBoundingClientRect();
    plot(
      xMin + (((e.clientX - r.left) / r.width) * W - pad) / cell,
      yMax - (((e.clientY - r.top) / r.height) * H - pad) / cell,
    );
  });
  box.addEventListener("keydown", (e) => {
    const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
      e.key
    ];
    if (d) {
      cur = { x: clamp(cur.x + d[0], xMin, xMax), y: clamp(cur.y + d[1], yMin, yMax) };
      read.textContent = `Cursor at (${minus(cur.x)}, ${minus(cur.y)}).`;
      draw();
    } else if (e.key === "Enter" || e.key === " ") plot(cur.x, cur.y);
    else return;
    e.preventDefault();
  });
  const form = el("div", "sgm-row");
  const field = (label, lo, hi) => {
    const input = /** @type {HTMLInputElement} */ (el("input", "sgm-field"));
    input.type = "number";
    input.min = String(lo);
    input.max = String(hi);
    input.step = "1";
    input.value = "0";
    input.setAttribute("aria-label", label);
    return input;
  };
  const fx = field("x", xMin, xMax);
  const fy = field("y", yMin, yMax);
  const go = /** @type {HTMLButtonElement} */ (el("button", "btn sgm-btn-wide", "Plot point"));
  const undo = /** @type {HTMLButtonElement} */ (el("button", "btn ghost sgm-btn-wide", "Undo"));
  const clear = /** @type {HTMLButtonElement} */ (el("button", "btn ghost sgm-btn-wide", "Clear"));
  for (const b of [go, undo, clear]) b.type = "button";
  go.addEventListener("click", () => plot(Number(fx.value), Number(fy.value)));
  undo.addEventListener("click", () => (points.pop(), draw()));
  clear.addEventListener("click", () => ((points.length = 0), draw()));
  form.append(
    el("span", "sgm-step-lab", "("),
    fx,
    el("span", "sgm-step-lab", ","),
    fy,
    el("span", "sgm-step-lab", ")"),
    go,
    undo,
    clear,
  );
  draw();
  root.append(box, form, read, list);
  return root;
}

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

/** Factor tree: select a composite, enter two factors; the tool checks their product. */
export function factorTreeBuilder(fig) {
  const rootValue = Number(fig.root);
  if (!Number.isInteger(rootValue) || rootValue < 4 || rootValue > 9999) return null;
  const root = el("div", "sgm-tool");
  const holder = el("div", "sgm-tree");
  const read = el("p", "sgm-read");
  read.setAttribute("aria-live", "polite");
  const tree = { v: rootValue, kids: null };
  let open = null;

  const leaves = (n) => (n.kids ? n.kids.flatMap(leaves) : [n.v]);
  const render = (node) => {
    const wrap = el("div", "sgm-node");
    const prime = isPrime(node.v);
    const b = /** @type {HTMLButtonElement} */ (
      el("button", `sgm-nodebtn${prime ? " is-prime" : ""}`, esc(String(node.v)))
    );
    b.type = "button";
    b.setAttribute(
      "aria-label",
      prime ? `${node.v}, prime` : node.kids ? `${node.v}, split` : `${node.v}, press to split`,
    );
    if (!prime && !node.kids) {
      b.setAttribute("aria-expanded", String(open === node));
      b.addEventListener("click", () => {
        open = open === node ? null : node;
        redraw();
      });
    }
    wrap.appendChild(b);
    if (open === node) {
      const row = el("div", "sgm-split");
      const mk = (label) => {
        const i = /** @type {HTMLInputElement} */ (el("input", "sgm-field"));
        i.type = "number";
        i.min = "2";
        i.setAttribute("aria-label", label);
        return i;
      };
      const a = mk("First factor");
      const c = mk("Second factor");
      const go = /** @type {HTMLButtonElement} */ (el("button", "btn sgm-btn-wide", "Split"));
      go.type = "button";
      go.addEventListener("click", () => {
        const x = Number(a.value);
        const y = Number(c.value);
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 2 || y < 2) {
          read.textContent = "Use whole numbers greater than 1.";
        } else if (x * y !== node.v) {
          read.textContent = `${x} × ${y} = ${x * y}, not ${node.v}. Try two factors whose product is ${node.v}.`;
        } else {
          node.kids = [
            { v: x, kids: null },
            { v: y, kids: null },
          ];
          open = null;
          redraw();
          return;
        }
      });
      row.append(a, el("span", "sgm-step-lab", "×"), c, go);
      wrap.appendChild(row);
    }
    if (node.kids) {
      const kids = el("div", "sgm-kids");
      for (const k of node.kids) kids.appendChild(render(k));
      wrap.appendChild(kids);
    }
    return wrap;
  };
  function redraw() {
    holder.replaceChildren(render(tree));
    const all = leaves(tree);
    if (all.every(isPrime) && tree.kids)
      read.textContent = `All the ends are prime. ${rootValue} = ${all.sort((p, q) => p - q).join(" × ")}.`;
    else if (!read.textContent.includes("not"))
      read.textContent = "Press a number that is not prime to split it.";
  }
  const reset = /** @type {HTMLButtonElement} */ (
    el("button", "btn ghost sgm-btn-wide", "Start over")
  );
  reset.type = "button";
  reset.addEventListener("click", () => {
    tree.kids = null;
    open = null;
    read.textContent = "";
    redraw();
  });
  redraw();
  root.append(holder, reset, read);
  return root;
}
