//
// Public API:
//   renderDistExplorer(container, { max, unit, label }) -> { destroy }
//     max: highest value on the line (default 20); unit: optional axis unit.

const C = {
  navy: "#12355b",
  teal: "#1fa6a2",
  dot: "#1fa6a2",
  mean: "#e8663c", // orange — the "balance point"
  median: "#6d4ad6", // purple
  mode: "#f2a516", // amber
  line: "#cfe0f0",
  ink: "#1a2b3c",
  muted: "#54677c",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

export function renderDistExplorer(
  container,
  /** @type {{ max?: number, unit?: string, label?: string }} */
  { max = 20, unit = "", label: _label } = {},
) {
  const MAX = Math.max(4, max);
  let values = [];

  const root = document.createElement("div");
  root.className = "dist-explorer";
  root.style.cssText =
    "max-width:600px; margin:0 auto; background:#fff; border:1px solid " +
    C.line +
    "; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(12,27,42,.08);";

  const W = 560,
    H = 260,
    PADL = 24,
    PADR = 24,
    AXIS_Y = H - 54,
    DOT_R = 8,
    DOT_GAP = 3;
  const plotW = W - PADL - PADR;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.style.cssText =
    "display:block; width:100%; height:auto; cursor:pointer; touch-action:manipulation;";
  root.appendChild(svg);

  const readout = document.createElement("div");
  readout.setAttribute("aria-live", "polite");
  readout.style.cssText =
    "display:flex; flex-wrap:wrap; gap:10px 18px; margin:12px 0; font-size:1.05rem; justify-content:center;";
  root.appendChild(readout);

  const note = document.createElement("div");
  note.style.cssText =
    "text-align:center; color:" +
    C.muted +
    "; font-size:.95rem; margin-bottom:12px; min-height:1.2em;";
  root.appendChild(note);

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex; flex-wrap:wrap; gap:8px; justify-content:center;";
  controls.innerHTML =
    btn("clear", "🗑 Clear") + btn("sym", "Example: even") + btn("skew", "Example: with an outlier");
  root.appendChild(controls);

  function btn(k, t) {
    return (
      '<button type="button" data-act="' +
      k +
      '" style="min-height:44px;padding:0 16px;border:2px solid ' +
      C.line +
      ";border-radius:12px;background:#fff;color:" +
      C.navy +
      ';font-weight:600;cursor:pointer;">' +
      t +
      "</button>"
    );
  }

  const xFor = (v) => PADL + (v / MAX) * plotW;

  function stats() {
    const n = values.length;
    if (!n) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const counts = {};
    let mode = sorted[0],
      best = 0;
    for (const v of sorted) {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > best) {
        best = counts[v];
        mode = v;
      }
    }
    return { mean, median, mode, modeCount: best, n };
  }

  function marker(x, color, glyph, _labelText, yBase) {
    // A small triangle pointing up at the axis, with a colored label above.
    return (
      '<polygon points="' +
      (x - 7) +
      "," +
      (yBase + 16) +
      " " +
      (x + 7) +
      "," +
      (yBase + 16) +
      " " +
      x +
      "," +
      (yBase + 4) +
      '" fill="' +
      color +
      '" />' +
      '<text x="' +
      x +
      '" y="' +
      (yBase + 34) +
      '" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui" fill="' +
      color +
      '">' +
      esc(glyph) +
      "</text>"
    );
  }

  function draw() {
    const s = stats();
    // Axis line + ticks + numbers
    let body =
      '<line x1="' +
      PADL +
      '" y1="' +
      AXIS_Y +
      '" x2="' +
      (W - PADR) +
      '" y2="' +
      AXIS_Y +
      '" stroke="' +
      C.navy +
      '" stroke-width="2.5" />';
    const tickStep = MAX <= 20 ? 2 : Math.ceil(MAX / 10);
    for (let v = 0; v <= MAX; v += tickStep) {
      const x = xFor(v);
      body +=
        '<line x1="' +
        x +
        '" y1="' +
        AXIS_Y +
        '" x2="' +
        x +
        '" y2="' +
        (AXIS_Y + 6) +
        '" stroke="' +
        C.navy +
        '" stroke-width="1.5" />' +
        '<text x="' +
        x +
        '" y="' +
        (AXIS_Y + 20) +
        '" text-anchor="middle" font-size="12" font-family="system-ui" fill="' +
        C.muted +
        '">' +
        v +
        "</text>";
    }

    // Stacked dots per value
    const byVal = {};
    for (const v of values) byVal[v] = (byVal[v] || 0) + 1;
    for (const v in byVal) {
      const x = xFor(Number(v));
      for (let i = 0; i < byVal[v]; i++) {
        const cy = AXIS_Y - DOT_R - 2 - i * (DOT_R * 2 + DOT_GAP);
        body +=
          '<circle cx="' +
          x +
          '" cy="' +
          Math.max(DOT_R + 2, cy) +
          '" r="' +
          DOT_R +
          '" fill="' +
          C.dot +
          '" stroke="#fff" stroke-width="1.5" />';
      }
    }

    // Mean / median / mode markers under the axis
    if (s) {
      const round = (x) => Math.round(x * 10) / 10;
      body += marker(xFor(s.mean), C.mean, "mean " + round(s.mean), "", AXIS_Y);
      // Offset median label row down a touch if very close to the mean.
      const medY = Math.abs(xFor(s.median) - xFor(s.mean)) < 40 ? AXIS_Y + 20 : AXIS_Y;
      body += marker(xFor(s.median), C.median, "median " + round(s.median), "", medY);
    } else {
      body +=
        '<text x="' +
        W / 2 +
        '" y="' +
        (AXIS_Y - 60) +
        '" text-anchor="middle" font-size="15" font-family="system-ui" fill="' +
        C.muted +
        '">Tap the number line to add data points</text>';
    }

    svg.innerHTML = body;
    svg.setAttribute(
      "aria-label",
      s
        ? `Dot plot of ${s.n} values. Mean ${Math.round(s.mean * 10) / 10}, median ${Math.round(s.median * 10) / 10}, mode ${s.mode}.`
        : "Empty dot plot. Tap to add data points.",
    );

    // Readout chips
    if (s) {
      const chip = (color, name, val) =>
        '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:' +
        color +
        ';"></span><b style="color:' +
        C.navy +
        '">' +
        name +
        ":</b> " +
        val +
        (unit ? " " + esc(unit) : "") +
        "</span>";
      readout.innerHTML =
        chip(C.mean, "Mean", Math.round(s.mean * 10) / 10) +
        chip(C.median, "Median", Math.round(s.median * 10) / 10) +
        chip(C.mode, "Mode", s.mode + (s.modeCount > 1 ? "" : " (no repeat)")) +
        '<span style="color:' +
        C.muted +
        '">n = ' +
        s.n +
        "</span>";
      const gap = s.mean - s.median;
      note.textContent =
        Math.abs(gap) < 0.35
          ? "Mean ≈ median — this data is fairly balanced (symmetric)."
          : gap > 0
            ? "The mean sits to the RIGHT of the median — a high value is pulling the mean up. The median resists it."
            : "The mean sits to the LEFT of the median — a low value is pulling the mean down. The median resists it.";
    } else {
      readout.innerHTML = "";
      note.textContent = "";
    }
  }

  function valueFromEvent(e) {
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX ?? e.touches?.[0]?.clientX) - rect.left) * (W / rect.width);
    const v = Math.round(((px - PADL) / plotW) * MAX);
    return Math.max(0, Math.min(MAX, v));
  }

  svg.addEventListener("click", (e) => {
    if (values.length >= 60) return; // keep it readable
    values.push(valueFromEvent(e));
    draw();
  });

  controls.addEventListener("click", (e) => {
    const act = /** @type {HTMLElement} */ (e.target).closest("button")?.dataset.act;
    if (!act) return;
    if (act === "clear") values = [];
    else if (act === "sym")
      values = [6, 7, 8, 8, 9, 9, 10, 10, 10, 11, 11, 12, 12, 13, 14].map((v) => Math.min(MAX, v));
    else if (act === "skew") values = [3, 4, 4, 5, 5, 5, 6, 6, 7, Math.min(MAX, 19)];
    draw();
  });

  container.appendChild(root);
  draw();

  return {
    destroy() {
      root.remove();
    },
  };
}

export default renderDistExplorer;
