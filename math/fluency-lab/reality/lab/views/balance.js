// The equation balance: a beam that tilts by the real weight difference, pans that hold unit blocks and x-bags, and
// buttons for every operation (blocks are also clickable). The hidden weight of x is revealed by X-Ray.
import { btn, group, h, row, s, stepper, svgRoot, text, fieldLabel } from "./common.js";

const PIVOT = { x: 320, y: 96 };
const HALF = 190;

function pan(side, cx, cy, pieces, xValue, xray, onRemove) {
  const g = s("g", { class: `mr-pan mr-pan-${side}` });
  g.append(s("line", { x1: cx, y1: cy - 62, x2: cx - 84, y2: cy, class: "mr-string" }));
  g.append(s("line", { x1: cx, y1: cy - 62, x2: cx + 84, y2: cy, class: "mr-string" }));
  g.append(s("path", { d: `M ${cx - 90} ${cy} h 180 q 0 28 -90 28 q -90 0 -90 -28 z`, class: "mr-tray" }));
  let slot = 0;
  const place = (kind, label) => {
    const col = slot % 7;
    const rowN = Math.floor(slot / 7);
    slot++;
    const x = cx - 78 + col * 24;
    const y = cy - 24 - rowN * 24;
    const el = s("g", { class: `mr-piece mr-piece-${kind}`, tabindex: 0, role: "button", "aria-label": kind === "x" ? "x-bag, remove" : "1 unit, remove" });
    if (kind === "x") {
      el.append(s("rect", { x, y, width: 22, height: 22, rx: 11, class: "mr-xbag" }));
      el.append(text(x + 11, y + 16, xray ? String(xValue) : "x", "mr-piece-t"));
    } else {
      el.append(s("rect", { x, y, width: 22, height: 22, rx: 4, class: "mr-unit" }));
      el.append(text(x + 11, y + 16, xray ? "1" : "", "mr-piece-t"));
    }
    el.addEventListener("click", () => onRemove(kind));
    el.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onRemove(kind);
      }
    });
    g.append(el);
  };
  for (let i = 0; i < pieces.x; i++) place("x");
  for (let i = 0; i < pieces.u; i++) place("u");
  return g;
}

export const balanceView = {
  render(ctx) {
    const { state, d, act, xray, lang } = ctx;
    const es = lang === "es";
    const svg = svgRoot(330, ctx.describe());
    const mag = d.tilt === 0 ? 0 : Math.min(13, 3 + Math.abs(d.leftWeight - d.rightWeight) * 1.2);
    const angle = (-d.tilt * mag * Math.PI) / 180;
    const lx = PIVOT.x - HALF * Math.cos(angle);
    const ly = PIVOT.y - HALF * Math.sin(angle);
    const rx = PIVOT.x + HALF * Math.cos(angle);
    const ry = PIVOT.y + HALF * Math.sin(angle);
    svg.append(s("path", { d: `M ${PIVOT.x - 26} 318 L ${PIVOT.x} ${PIVOT.y + 8} L ${PIVOT.x + 26} 318 z`, class: "mr-stand" }));
    svg.append(s("line", { x1: lx, y1: ly, x2: rx, y2: ry, class: `mr-beam ${d.balanced ? "is-balanced" : "is-tipped"}` }));
    svg.append(s("circle", { cx: PIVOT.x, cy: PIVOT.y, r: 10, class: "mr-pivot" }));
    svg.append(pan("left", lx, ly + 62, state.left, d.xValue, xray, (kind) => act({ type: "remove", side: "left", what: kind, n: 1 })));
    svg.append(pan("right", rx, ry + 62, state.right, d.xValue, xray, (kind) => act({ type: "remove", side: "right", what: kind, n: 1 })));
    svg.append(text(lx, 40, d.leftText, "mr-side-label"));
    svg.append(text(rx, 40, d.rightText, "mr-side-label"));
    svg.append(text(PIVOT.x, 40, d.balanced ? "=" : d.tilt > 0 ? ">" : "<", `mr-sym ${d.balanced ? "is-balanced" : "is-tipped"}`));
    if (xray) {
      svg.append(text(lx, 306, `${es ? "Peso" : "Weight"}: ${d.leftWeight}`, "mr-xray-line"));
      svg.append(text(rx, 306, `${es ? "Peso" : "Weight"}: ${d.rightWeight}`, "mr-xray-line"));
    }
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { state, act, lang, ui } = ctx;
    const es = lang === "es";
    const n = ui.n ?? 1;
    const side = (id, label) =>
      group(label,
        fieldLabel(label),
        btn(`${es ? "Quitar" : "Take off"} ${n}`, () => act({ type: "remove", side: id, what: "u", n }), { key: `${id}-rem-u`, aria: `${label}: ${es ? "quitar" : "take off"} ${n} ${es ? "unidades" : "units"}` }),
        btn(`${es ? "Poner" : "Add"} ${n}`, () => act({ type: "add", side: id, what: "u", n }), { key: `${id}-add-u`, aria: `${label}: ${es ? "poner" : "add"} ${n} ${es ? "unidades" : "units"}` }),
        btn(es ? "Quitar x" : "Take off x", () => act({ type: "remove", side: id, what: "x", n: 1 }), { key: `${id}-rem-x`, aria: `${label}: ${es ? "quitar una bolsa x" : "take off one x-bag"}` }),
        btn(es ? "Poner x" : "Add x", () => act({ type: "add", side: id, what: "x", n: 1 }), { key: `${id}-add-x`, aria: `${label}: ${es ? "poner una bolsa x" : "add one x-bag"}` }));
    return h("div", { class: "mr-controls" },
      stepper(es ? "Cantidad" : "Amount", n, { key: "amt", onMinus: () => ui.set({ n: Math.max(1, n - 1) }), onPlus: () => ui.set({ n: Math.min(9, n + 1) }), minDisabled: n <= 1, plusDisabled: n >= 9 }),
      h("div", { class: "mr-cols" }, side("left", es ? "Platillo izquierdo" : "Left pan"), side("right", es ? "Platillo derecho" : "Right pan")),
      group(es ? "Ambos lados" : "Both sides",
        fieldLabel(es ? "Ambos lados" : "Both sides"),
        btn(`${es ? "Quitar" : "Take off"} ${n}`, () => act({ type: "remove", side: "both", what: "u", n }), { key: "both-rem-u", aria: `${es ? "Ambos lados: quitar" : "Both sides: take off"} ${n}` }),
        btn(`${es ? "Poner" : "Add"} ${n}`, () => act({ type: "add", side: "both", what: "u", n }), { key: "both-add-u", aria: `${es ? "Ambos lados: poner" : "Both sides: add"} ${n}` }),
        btn(es ? "Quitar x" : "Take off x", () => act({ type: "remove", side: "both", what: "x", n: 1 }), { key: "both-rem-x", aria: es ? "Ambos lados: quitar una bolsa x" : "Both sides: take off one x-bag" }),
        fieldLabel(es ? "Dividir en grupos" : "Split into groups"),
        ...[2, 3, 4].map((k) => btn(`÷${k}`, () => act({ type: "divide", k }), { key: `div-${k}`, aria: es ? `Dividir ambos lados en ${k} grupos iguales` : `Split both sides into ${k} equal groups` }))),
    );
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [
      ["equation", h("span", { class: `mr-ro mr-big ${d.balanced ? "is-ok" : "is-warn"}` }, d.equation)],
      ["scale", h("span", { class: "mr-ro" }, d.balanced ? (lang === "es" ? "Equilibrada" : "Balanced") : lang === "es" ? "Inclinada" : "Tipped")],
      d.solved ? ["x", h("span", { class: "mr-ro mr-big is-ok" }, `x = ${d.rightText}`)] : null,
    ].filter(Boolean);
  },
};
