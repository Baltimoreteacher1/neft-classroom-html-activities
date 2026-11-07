// Graded interactive answers: the DOM half. mountResponse() draws the control an item's `response` asks for and
// reports the learner's build as one text value (formats in response-check.js), which the practice screen checks
// with the same validateAnswer() path as a typed answer. Every control works by keyboard: sliders take the arrow
// keys, Home and End; parts, boxes and dots are buttons. Nothing is pre-placed, so a control never starts on the
// answer. Drawings are aria-hidden; a polite readout says what the learner has built.
import { t } from "./i18n.js";
import { inequalityText, pointText, tickText } from "./response-check.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const range = (min, max, step = 1) => {
  const out = [];
  for (let k = 0; min + k * step <= max + 1e-9; k += 1)
    out.push(Number((min + k * step).toFixed(6)));
  return out;
};

// ---- number-line drawing shared by numberLine, inequality, dotPlot and boxPlot --------------------------------
const W = 320;
const PAD = 20;
const xOf = (value, min, max) => PAD + ((value - min) / (max - min)) * (W - 2 * PAD);
function axis(min, max, den, { y = 40, labelEvery = 1, mixed = false } = {}) {
  const ticks = range(min, max, 1 / den);
  const marks = ticks
    .map((value, i) => {
      const x = xOf(value, min, max);
      const whole = Math.abs(value - Math.round(value)) < 1e-9;
      const label =
        i % labelEvery === 0 || whole
          ? `<text x="${x}" y="${y + 20}" text-anchor="middle" class="rw-tick-label">${esc(tickText(value, den, { mixed }))}</text>`
          : "";
      return `<line x1="${x}" x2="${x}" y1="${y - (whole ? 8 : 5)}" y2="${y + (whole ? 8 : 5)}" class="rw-tick"/>${label}`;
    })
    .join("");
  return `<line x1="${PAD - 8}" x2="${W - PAD + 8}" y1="${y}" y2="${y}" class="rw-axis"/>${marks}`;
}
const valueFromPointer = (event, svg, min, max, den) => {
  const box = svg.getBoundingClientRect();
  const local = ((event.clientX - box.left) / (box.width || W)) * W;
  const raw = min + ((local - PAD) / (W - 2 * PAD)) * (max - min);
  return clamp(Math.round(raw * den) / den, min, max);
};

// A role="slider" element that moves over min..max in 1/den steps. `get`/`set` hold its value (null = not placed).
function sliderKeys(element, { min, max, den, get, set }) {
  element.addEventListener("keydown", (event) => {
    const step = 1 / den;
    const current = get();
    const moves = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: 1,
      PageDown: -1,
    };
    let next = null;
    if (event.key in moves) next = current === null ? min : current + moves[event.key];
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    if (next === null) return;
    event.preventDefault();
    set(clamp(Math.round(next * den) / den, min, max));
  });
}
const sliderAttrs = (label, min, max, value, den, mixed) =>
  `role="slider" tabindex="0" aria-label="${esc(label)}" aria-valuemin="${min}" aria-valuemax="${max}"${value === null ? ` aria-valuetext="${esc(t("Not placed yet"))}"` : ` aria-valuenow="${value}" aria-valuetext="${esc(tickText(value, den, { mixed }))}"`}`;

// ---- the widgets -----------------------------------------------------------------------------------------------
const BUILDERS = {
  numberLine(host, r, emit) {
    const { min, max, den = 1, mixed = false } = r;
    let value = null;
    const draw = () => {
      const marker =
        value === null
          ? ""
          : `<circle cx="${xOf(value, min, max)}" cy="40" r="8" class="rw-point"/>`;
      host.innerHTML = `
        <div class="rw-line" ${sliderAttrs(t("Point on the number line"), min, max, value, den, mixed)}>
          <svg viewBox="0 0 ${W} 70" aria-hidden="true" focusable="false">${axis(min, max, den, { labelEvery: r.labelEvery || den, mixed })}${marker}</svg>
        </div>
        <p class="rw-hint">${esc(t("Tap the line, or focus it and use the arrow keys."))}</p>`;
      wire();
      emit(
        value === null ? "" : tickText(value, den).replace("−", "-"),
        value === null ? "" : t("Your point: {v}", { v: tickText(value, den, { mixed }) }),
      );
    };
    const set = (next) => {
      value = next;
      draw();
      host.querySelector(".rw-line").focus();
    };
    const wire = () => {
      const line = host.querySelector(".rw-line");
      sliderKeys(line, { min, max, den, get: () => value, set });
      line.addEventListener("pointerdown", (event) =>
        set(valueFromPointer(event, line.querySelector("svg"), min, max, den)),
      );
    };
    draw();
  },

  inequality(host, r, emit) {
    const { min, max, variable = "x" } = r;
    const state = { value: null, closed: null, side: null };
    const op = () =>
      state.side && state.closed !== null
        ? `${state.side === "left" ? "<" : ">"}${state.closed ? "=" : ""}`
        : null;
    const draw = () => {
      const x = state.value === null ? null : xOf(state.value, min, max);
      const ray =
        x === null || !state.side
          ? ""
          : `<line x1="${x}" x2="${state.side === "left" ? PAD - 6 : W - PAD + 6}" y1="40" y2="40" class="rw-ray"/><polygon points="${state.side === "left" ? `${PAD - 12},40 ${PAD - 2},34 ${PAD - 2},46` : `${W - PAD + 12},40 ${W - PAD + 2},34 ${W - PAD + 2},46`}" class="rw-ray-head"/>`;
      const dot =
        x === null
          ? ""
          : `<circle cx="${x}" cy="40" r="7" class="${state.closed ? "rw-point" : "rw-point rw-open"}"/>`;
      const pressed = (flag) => `aria-pressed="${flag ? "true" : "false"}"`;
      host.innerHTML = `
        <div class="rw-line" ${sliderAttrs(t("Boundary point"), min, max, state.value, 1, false)}>
          <svg viewBox="0 0 ${W} 70" aria-hidden="true" focusable="false">${axis(min, max, 1)}${ray}${dot}</svg>
        </div>
        <div class="rw-toggles" role="group" aria-label="${esc(t("Circle"))}">
          <button type="button" class="rw-chip" data-closed="0" ${pressed(state.closed === false)}>${esc(t("Open circle"))}</button>
          <button type="button" class="rw-chip" data-closed="1" ${pressed(state.closed === true)}>${esc(t("Closed circle"))}</button>
        </div>
        <div class="rw-toggles" role="group" aria-label="${esc(t("Direction"))}">
          <button type="button" class="rw-chip" data-side="left" ${pressed(state.side === "left")}>${esc(t("Shade left"))}</button>
          <button type="button" class="rw-chip" data-side="right" ${pressed(state.side === "right")}>${esc(t("Shade right"))}</button>
        </div>`;
      const line = host.querySelector(".rw-line");
      sliderKeys(line, {
        min,
        max,
        den: 1,
        get: () => state.value,
        set: (v) => update({ value: v }, ".rw-line"),
      });
      line.addEventListener("pointerdown", (event) =>
        update(
          { value: valueFromPointer(event, line.querySelector("svg"), min, max, 1) },
          ".rw-line",
        ),
      );
      for (const b of host.querySelectorAll("[data-closed]"))
        b.addEventListener("click", () =>
          update({ closed: b.dataset.closed === "1" }, `[data-closed="${b.dataset.closed}"]`),
        );
      for (const b of host.querySelectorAll("[data-side]"))
        b.addEventListener("click", () =>
          update({ side: b.dataset.side }, `[data-side="${b.dataset.side}"]`),
        );
      const ready = state.value !== null && op();
      emit(
        ready ? `${op()} ${state.value}` : "",
        ready ? t("Your graph: {v}", { v: inequalityText(op(), state.value, variable) }) : "",
      );
    };
    const update = (patch, focusSelector) => {
      Object.assign(state, patch);
      draw();
      host.querySelector(focusSelector)?.focus();
    };
    draw();
  },

  dotPlot(host, r, emit) {
    const { min, max } = r;
    const ticks = range(min, max);
    const counts = ticks.map(() => 0);
    const tall = Math.max(5, (r.target || []).reduce((m, n) => Math.max(m, n), 0) + 2);
    const draw = (focusSelector) => {
      const h = 30 + tall * 16;
      const dots = ticks
        .flatMap((value, i) =>
          Array.from(
            { length: counts[i] },
            (_, k) =>
              `<circle cx="${xOf(value, min, max)}" cy="${h - 40 - k * 16}" r="6" class="rw-point"/>`,
          ),
        )
        .join("");
      host.innerHTML = `
        <svg class="rw-plot" viewBox="0 0 ${W} ${h}" aria-hidden="true" focusable="false"><g transform="translate(0 ${h - 70})">${axis(min, max, 1)}</g>${dots}</svg>
        <div class="rw-columns" role="group" aria-label="${esc(t("Dots for each value"))}">${ticks
          .map(
            (
              value,
              i,
            ) => `<div class="rw-column"><span class="rw-column-label">${esc(tickText(value))}</span>
              <button type="button" class="rw-step" data-add="${i}" aria-label="${esc(t("Add a dot at {v}", { v: tickText(value) }))}">+</button>
              <button type="button" class="rw-step" data-remove="${i}" aria-label="${esc(t("Remove a dot at {v}", { v: tickText(value) }))}" ${counts[i] ? "" : "disabled"}>−</button>
              <span class="rw-count" aria-hidden="true">${counts[i]}</span></div>`,
          )
          .join("")}</div>`;
      for (const b of host.querySelectorAll("[data-add]"))
        b.addEventListener("click", () => {
          counts[b.dataset.add] = Math.min(tall, counts[b.dataset.add] + 1);
          draw(`[data-add="${b.dataset.add}"]`);
        });
      for (const b of host.querySelectorAll("[data-remove]"))
        b.addEventListener("click", () => {
          counts[b.dataset.remove] = Math.max(0, counts[b.dataset.remove] - 1);
          draw(
            counts[b.dataset.remove]
              ? `[data-remove="${b.dataset.remove}"]`
              : `[data-add="${b.dataset.remove}"]`,
          );
        });
      if (focusSelector) host.querySelector(focusSelector)?.focus();
      const total = counts.reduce((s, n) => s + n, 0);
      emit(total ? counts.join(",") : "", total ? t("{n} dots placed", { n: total }) : "");
    };
    draw();
  },

  boxPlot(host, r, emit) {
    const { min, max, den = 1 } = r;
    const names = ["Minimum", "Q1", "Median", "Q3", "Maximum"];
    const values = [null, null, null, null, null];
    const draw = (focusIndex = -1) => {
      const xs = values.map((v) => (v === null ? null : xOf(v, min, max)));
      const marks = xs
        .map((x, i) =>
          x === null
            ? ""
            : `<line x1="${x}" x2="${x}" y1="${i === 0 || i === 4 ? 22 : 12}" y2="${i === 0 || i === 4 ? 38 : 48}" class="rw-box-edge"/>`,
        )
        .join("");
      const box =
        xs[1] !== null && xs[3] !== null
          ? `<rect x="${Math.min(xs[1], xs[3])}" y="12" width="${Math.abs(xs[3] - xs[1])}" height="36" class="rw-box"/>`
          : "";
      const whiskers = [
        [0, 1],
        [3, 4],
      ]
        .map(([a, b]) =>
          xs[a] !== null && xs[b] !== null
            ? `<line x1="${xs[a]}" x2="${xs[b]}" y1="30" y2="30" class="rw-axis"/>`
            : "",
        )
        .join("");
      host.innerHTML = `
        <svg class="rw-plot" viewBox="0 0 ${W} 100" aria-hidden="true" focusable="false">${box}${whiskers}${marks}<g transform="translate(0 40)">${axis(min, max, den, { labelEvery: r.labelEvery || 1 })}</g></svg>
        <div class="rw-sliders">${names
          .map(
            (
              name,
              i,
            ) => `<div class="rw-slider-row"><span class="rw-slider-name">${esc(t(name))}</span>
              <button type="button" class="rw-step" data-down="${i}" aria-label="${esc(t("Move {name} left", { name: t(name) }))}">−</button>
              <span class="rw-slider-value" data-slider="${i}" ${sliderAttrs(t(name), min, max, values[i], den, false)}>${values[i] === null ? "—" : esc(tickText(values[i], den))}</span>
              <button type="button" class="rw-step" data-up="${i}" aria-label="${esc(t("Move {name} right", { name: t(name) }))}">+</button></div>`,
          )
          .join("")}</div>`;
      const set = (i, v, selector) => {
        values[i] = v;
        draw();
        host.querySelector(selector)?.focus();
      };
      const nudge = (i, d) =>
        values[i] === null
          ? i
            ? (values[i - 1] ?? min)
            : min
          : clamp(Math.round((values[i] + d / den) * den) / den, min, max);
      for (const el of host.querySelectorAll("[data-slider]")) {
        const i = Number(el.dataset.slider);
        sliderKeys(el, {
          min,
          max,
          den,
          get: () => values[i],
          set: (v) => set(i, v, `[data-slider="${i}"]`),
        });
      }
      for (const b of host.querySelectorAll("[data-up]"))
        b.addEventListener("click", () =>
          set(Number(b.dataset.up), nudge(Number(b.dataset.up), 1), `[data-up="${b.dataset.up}"]`),
        );
      for (const b of host.querySelectorAll("[data-down]"))
        b.addEventListener("click", () =>
          set(
            Number(b.dataset.down),
            nudge(Number(b.dataset.down), -1),
            `[data-down="${b.dataset.down}"]`,
          ),
        );
      if (focusIndex >= 0) host.querySelector(`[data-slider="${focusIndex}"]`)?.focus();
      const done = values.every((v) => v !== null);
      emit(
        done ? values.join(",") : "",
        done ? t("Your box plot: {v}", { v: values.map((v) => tickText(v, den)).join(", ") }) : "",
      );
    };
    draw();
  },

  fractionShade(host, r, emit) {
    const parts = r.parts;
    const shaded = Array.from({ length: parts }, () => false);
    const draw = (focusIndex = -1) => {
      host.innerHTML = `<div class="rw-bar" role="group" aria-label="${esc(t("A bar cut into {n} equal parts", { n: parts }))}">${shaded
        .map(
          (on, i) =>
            `<button type="button" class="rw-part" data-part="${i}" aria-pressed="${on}" aria-label="${esc(t("Part {n} of {d}", { n: i + 1, d: parts }))}"></button>`,
        )
        .join("")}</div>`;
      for (const b of host.querySelectorAll("[data-part]"))
        b.addEventListener("click", () => {
          shaded[b.dataset.part] = !shaded[b.dataset.part];
          draw(Number(b.dataset.part));
        });
      if (focusIndex >= 0) host.querySelector(`[data-part="${focusIndex}"]`)?.focus();
      const n = shaded.filter(Boolean).length;
      emit(n ? `${n}/${parts}` : "", n ? t("{n} of {d} parts shaded", { n, d: parts }) : "");
    };
    draw();
  },

  tenFrame(host, r, emit) {
    const size = (r.frames || 1) * 10;
    const filled = Array.from({ length: size }, () => false);
    const draw = (focusIndex = -1) => {
      host.innerHTML = `<div class="rw-frames">${Array.from(
        { length: size / 10 },
        (_, f) =>
          `<div class="rw-frame" role="group" aria-label="${esc(t("Ten-frame"))}">${filled
            .slice(f * 10, f * 10 + 10)
            .map(
              (on, k) =>
                `<button type="button" class="rw-cell" data-cell="${f * 10 + k}" aria-pressed="${on}" aria-label="${esc(t("Box {n}", { n: f * 10 + k + 1 }))}"><span class="rw-counter" aria-hidden="true"></span></button>`,
            )
            .join("")}</div>`,
      ).join("")}</div>`;
      for (const b of host.querySelectorAll("[data-cell]"))
        b.addEventListener("click", () => {
          filled[b.dataset.cell] = !filled[b.dataset.cell];
          draw(Number(b.dataset.cell));
        });
      if (focusIndex >= 0) host.querySelector(`[data-cell="${focusIndex}"]`)?.focus();
      const n = filled.filter(Boolean).length;
      emit(n ? String(n) : "", n ? t("{n} boxes filled", { n }) : "");
    };
    draw();
  },

  baseTen(host, r, emit) {
    const places = r.places || ["hundreds", "tens", "ones"];
    const counts = { hundreds: 0, tens: 0, ones: 0 };
    const names = { hundreds: "Hundreds", tens: "Tens", ones: "Ones" };
    const draw = (focusSelector) => {
      const picture = (place, n) =>
        Array.from(
          { length: n },
          () => `<span class="rw-block rw-${place}" aria-hidden="true"></span>`,
        ).join("");
      host.innerHTML = `<div class="rw-places">${places
        .map(
          (
            place,
          ) => `<div class="rw-place"><span class="rw-place-name">${esc(t(names[place]))}</span>
            <div class="rw-place-blocks">${picture(place, counts[place])}</div>
            <div class="rw-place-controls"><button type="button" class="rw-step" data-less="${place}" aria-label="${esc(t("Take away one from {place}", { place: t(names[place]) }))}" ${counts[place] ? "" : "disabled"}>−</button>
            <span class="rw-count">${counts[place]}</span>
            <button type="button" class="rw-step" data-more="${place}" aria-label="${esc(t("Add one to {place}", { place: t(names[place]) }))}">+</button></div></div>`,
        )
        .join("")}</div>`;
      for (const b of host.querySelectorAll("[data-more]"))
        b.addEventListener("click", () => {
          counts[b.dataset.more] = Math.min(19, counts[b.dataset.more] + 1);
          draw(`[data-more="${b.dataset.more}"]`);
        });
      for (const b of host.querySelectorAll("[data-less]"))
        b.addEventListener("click", () => {
          counts[b.dataset.less] = Math.max(0, counts[b.dataset.less] - 1);
          draw(
            counts[b.dataset.less]
              ? `[data-less="${b.dataset.less}"]`
              : `[data-more="${b.dataset.less}"]`,
          );
        });
      if (focusSelector) host.querySelector(focusSelector)?.focus();
      const any = counts.hundreds + counts.tens + counts.ones;
      emit(
        any ? `${counts.hundreds},${counts.tens},${counts.ones}` : "",
        any
          ? t("{h} hundreds, {t} tens, {o} ones", {
              h: counts.hundreds,
              t: counts.tens,
              o: counts.ones,
            })
          : "",
      );
    };
    draw();
  },

  point(host, r, emit) {
    const { min = -6, max = 6 } = r;
    const cells = max - min;
    const unit = (W - 2 * PAD) / cells;
    let point = null;
    const px = (x) => PAD + (x - min) * unit;
    const py = (y) => PAD + (max - y) * unit;
    const draw = (focus) => {
      const lines = range(min, max)
        .map(
          (v) =>
            `<line x1="${px(v)}" x2="${px(v)}" y1="${PAD}" y2="${W - PAD}" class="${v === 0 ? "rw-axis" : "rw-grid"}"/><line y1="${py(v)}" y2="${py(v)}" x1="${PAD}" x2="${W - PAD}" class="${v === 0 ? "rw-axis" : "rw-grid"}"/>`,
        )
        .join("");
      const labels = range(min, max)
        .filter((v) => v && v % (cells > 12 ? 2 : 1) === 0)
        .map(
          (v) =>
            `<text x="${px(v)}" y="${py(0) + 14}" text-anchor="middle" class="rw-tick-label">${tickText(v)}</text><text x="${px(0) - 6}" y="${py(v) + 4}" text-anchor="end" class="rw-tick-label">${tickText(v)}</text>`,
        )
        .join("");
      const dot = point
        ? `<circle cx="${px(point[0])}" cy="${py(point[1])}" r="7" class="rw-point"/>`
        : "";
      host.innerHTML = `
        <div class="rw-grid-wrap" role="application" tabindex="0" aria-roledescription="${esc(t("coordinate grid"))}" aria-label="${esc(t("Coordinate grid. Use the arrow keys to move the point."))}">
          <svg viewBox="0 0 ${W} ${W}" aria-hidden="true" focusable="false">${lines}${labels}${dot}</svg>
        </div>
        <p class="rw-hint">${esc(t("Tap the grid, or focus it and use the arrow keys."))}</p>`;
      const wrap = host.querySelector(".rw-grid-wrap");
      wrap.addEventListener("keydown", (event) => {
        const moves = {
          ArrowRight: [1, 0],
          ArrowLeft: [-1, 0],
          ArrowUp: [0, 1],
          ArrowDown: [0, -1],
        };
        if (!(event.key in moves)) return;
        event.preventDefault();
        const [dx, dy] = moves[event.key];
        point = point ? [clamp(point[0] + dx, min, max), clamp(point[1] + dy, min, max)] : [0, 0];
        draw(true);
      });
      wrap.addEventListener("pointerdown", (event) => {
        const box = wrap.querySelector("svg").getBoundingClientRect();
        const scale = W / (box.width || W);
        const x = Math.round(((event.clientX - box.left) * scale - PAD) / unit) + min;
        const y = max - Math.round(((event.clientY - box.top) * scale - PAD) / unit);
        point = [clamp(x, min, max), clamp(y, min, max)];
        draw(true);
      });
      if (focus) wrap.focus();
      emit(
        point ? pointText(point[0], point[1]) : "",
        point ? t("Your point: {v}", { v: pointText(point[0], point[1]) }) : "",
      );
    };
    draw(false);
  },
};

// Multi-line work: the given line, then one text box per line the learner writes. Enter starts a new line (it never
// submits), Check grades every line, and showVerdict() marks each line as following from the one above or not.
BUILDERS.work = (host, r, emit) => {
  const lines = [""];
  const label = { equation: "Solve. Write one step per line.", expression: "Rewrite. Write one step per line.", numeric: "Simplify. Write one step per line." }[r.mode];
  const send = () => {
    const written = lines.map((line) => line.replaceAll(";", ",").trim()).filter(Boolean);
    emit(written.join("; "), written.length ? t("{n} lines written", { n: written.length }) : "");
  };
  const draw = (focusIndex) => {
    host.innerHTML = `
      <p class="rw-hint">${esc(t(label))}</p>
      <ol class="rw-work">
        <li class="rw-work-line rw-given"><span class="rw-work-text">${esc(r.start)}</span><span class="rw-work-mark">${esc(t("Given"))}</span></li>
        ${lines
          .map(
            (line, i) => `<li class="rw-work-line"><input class="rw-work-input" data-line="${i}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(line)}" aria-label="${esc(t("Line {n}", { n: i + 2 }))}" aria-describedby="rw-mark-${i}"><span class="rw-work-mark" id="rw-mark-${i}" data-mark="${i}"></span></li>`,
          )
          .join("")}
      </ol>
      <div class="rw-toggles">
        <button type="button" class="rw-chip" data-add-line>${esc(t("Add a line"))}</button>
        <button type="button" class="rw-chip" data-remove-line ${lines.length > 1 ? "" : "disabled"}>${esc(t("Remove the last line"))}</button>
      </div>`;
    for (const input of host.querySelectorAll("[data-line]")) {
      input.addEventListener("input", () => {
        lines[input.dataset.line] = input.value;
        for (const mark of host.querySelectorAll("[data-mark]")) mark.textContent = "";
        send();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const i = Number(input.dataset.line);
        if (i === lines.length - 1 && lines.length < 12 && input.value.trim()) {
          lines.push("");
          draw(i + 1);
        } else host.querySelector(`[data-line="${Math.min(i + 1, lines.length - 1)}"]`)?.focus();
      });
    }
    host.querySelector("[data-add-line]").addEventListener("click", () => {
      if (lines.length < 12) lines.push("");
      draw(lines.length - 1);
    });
    host.querySelector("[data-remove-line]").addEventListener("click", () => {
      lines.pop();
      draw(lines.length - 1);
      send();
    });
    if (focusIndex !== undefined) host.querySelector(`[data-line="${focusIndex}"]`)?.focus();
  };
  draw();
  send();
  return {
    showVerdict(verdict) {
      const written = lines.map((line, i) => [line.trim(), i]).filter(([line]) => line);
      for (const mark of host.querySelectorAll("[data-mark]")) {
        mark.textContent = "";
        delete mark.dataset.state;
      }
      (verdict?.lines || []).slice(1).forEach((good, k) => {
        const mark = host.querySelector(`[data-mark="${written[k]?.[1]}"]`);
        if (!mark || good === null) return;
        mark.dataset.state = good ? "ok" : "check";
        mark.textContent = good ? `✓ ${t("Follows")}` : `✕ ${t("Check this line")}`;
      });
    },
  };
};

// Mount the control for `item.response` into `host`. `onChange(value)` gets every new build ("" until something is
// built). Returns a handle with value() and destroy().
export function mountResponse(host, item, { onChange = () => {} } = {}) {
  const response = item?.response;
  const build = BUILDERS[response?.type];
  if (!host || !build) return null;
  host.hidden = false;
  host.className = `response-widget rw-${response.type}`;
  host.innerHTML = "";
  const stage = document.createElement("div");
  stage.className = "rw-stage";
  const readout = document.createElement("p");
  readout.className = "rw-readout";
  readout.setAttribute("aria-live", "polite");
  host.append(stage, readout);
  let current = "";
  const extra = build(stage, response, (value, said) => {
    current = value;
    readout.textContent = said || t("Nothing built yet.");
    onChange(value);
  });
  return {
    value: () => current,
    showVerdict: (verdict) => extra?.showVerdict?.(verdict),
    destroy() {
      host.innerHTML = "";
      host.hidden = true;
    },
  };
}
