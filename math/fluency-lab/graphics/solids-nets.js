// Explore, build and check whether six connected squares fold into the six different faces of a cube.
import { createShell, button, h, s, t } from "./b-core.js";
import { isCubeNet } from "./solids-polyomino.js";

const VALID = [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]];
const INVALID = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]];
const copy = (cells) => cells.map(([r, c]) => [r, c]);

export function mount(container, config = {}) {
  const shell = createShell(container, config, "solids-nets", {
    defaultLabel: t("Cube net"),
    help: t("A cube net has six connected squares. Fold the squares across shared edges and check whether each becomes a different face."),
  });
  let cells = copy(config.initial?.cells || VALID);
  let selected = 0;
  let checked = mode !== "check";
  const { svg, controls, readout, announce, mode } = shell;
  const render = () => {
    svg.replaceChildren();
    const minR = Math.min(...cells.map(([r]) => r));
    const minC = Math.min(...cells.map(([, c]) => c));
    const maxR = Math.max(...cells.map(([r]) => r));
    const maxC = Math.max(...cells.map(([, c]) => c));
    const size = Math.min(54, 300 / Math.max(maxC - minC + 1, maxR - minR + 1));
    const ox = 280 - ((maxC - minC + 1) * size) / 2;
    const oy = 165 - ((maxR - minR + 1) * size) / 2;
    cells.forEach(([r, c], i) => {
      const x = ox + (c - minC) * size;
      const y = oy + (r - minR) * size;
      const face = s("rect", { x, y, width: size, height: size, rx: 3, class: `gb-net-face${i === selected ? " is-selected" : ""}`, tabindex: "0", role: "button", "aria-pressed": String(i === selected), "aria-label": t("Square {n}", { n: i + 1 }) });
      face.addEventListener("click", () => { selected = i; render(); });
      face.addEventListener("keydown", (event) => {
        const delta = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[event.key];
        if (!delta || mode !== "build") return;
        event.preventDefault();
        const candidate = [cells[i][0] + delta[0], cells[i][1] + delta[1]];
        if (!cells.some(([rr, cc], j) => j !== i && rr === candidate[0] && cc === candidate[1])) {
          cells[i] = candidate;
          render();
        }
      });
      svg.append(face);
      const label = s("text", { x: x + size / 2, y: y + size / 2 + 5, "text-anchor": "middle", class: "gb-net-label" });
      label.textContent = String(i + 1);
      svg.append(label);
    });
    const result = isCubeNet(cells);
    readout.replaceChildren(h("p", { text: t("{n} connected squares", { n: cells.length }) }));
    if (mode !== "build" && checked) readout.append(h("p", { class: result.valid ? "gb-net-result is-valid" : "gb-net-result", text: result.valid ? t("This net folds into a cube. Each square becomes a different face.") : t("This arrangement does not fold into a cube: {reason}.", { reason: t(result.reason) }) }));
    shell.emit({ cells: copy(cells) }, result.valid);
  };
  const setExample = (next) => { cells = copy(next); render(); };
  const actions = [];
  if (mode === "explore") {
    actions.push(button(t("Try a valid cube net"), () => setExample(VALID)));
    actions.push(button(t("Try a folded-over arrangement"), () => setExample(INVALID)));
  } else if (mode === "build") {
    actions.push(button(t("Start with a valid net"), () => setExample(VALID)));
    actions.push(button(t("Start with an overlapping net"), () => setExample(INVALID)));
    actions.push(h("p", { class: "gb-help", text: t("Select a square, then use the arrow keys to move it one space.") }));
  } else {
    const target = config.target?.cells || VALID;
    actions.push(button(t("Check this net"), () => { checked = true; const result = isCubeNet(cells); announce(result.valid ? t("Yes. This net folds into a cube.") : t("Not yet. Check whether every face stays separate when folded.")); render(); }));
    cells = copy(config.initial?.cells || target);
  }
  controls.replaceChildren(...actions);
  render();
  return {
    kind: "solids-nets",
    getState: () => ({ cells: copy(cells) }),
    setState: (state) => { if (Array.isArray(state?.cells) && state.cells.length === 6) { cells = copy(state.cells); selected = 0; render(); } },
    describe: () => { const result = isCubeNet(cells); return result.valid ? t("This net folds into a cube. Each square becomes a different face.") : t("This arrangement does not fold into a cube: {reason}.", { reason: t(result.reason) }); },
    destroy: shell.destroy,
  };
}
