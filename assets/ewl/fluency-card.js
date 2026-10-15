/* "Class sprint" card for the Fluency index: pick a unit, optionally type your class's code, press Start.
 * 12 short questions, no clock; the whole class gets the same questions from one code (EWL.Fluency).
 * The Fluency Spiral loads only when the student presses Start. Mount point: <section data-ewl-sprint>. */
(() => {
  const host = document.querySelector("[data-ewl-sprint]");
  if (!host) return;
  const UNITS = [
    [1, "Unit 1 · Math is Discovery"],
    [2, "Unit 2 · Statistics"],
    [3, "Unit 3 · Ratios and rates"],
    [4, "Unit 4 · Percents"],
    [5, "Unit 5 · Geometry"],
    [6, "Unit 6 · Fractions, exponents, expressions"],
    [7, "Unit 7 · Integers and coordinates"],
    [8, "Unit 8 · Equations and inequalities"],
    [9, "Unit 9 · Two variables"],
  ];
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    n.append(...kids);
    return n;
  };
  const select = el(
    "select",
    { id: "ewl-sprint-unit" },
    ...UNITS.map(([n, t]) => el("option", { value: String(n) }, t)),
  );
  const code = el("input", {
    id: "ewl-sprint-code",
    type: "text",
    autocomplete: "off",
    maxlength: "14",
    placeholder: "KITE-4821",
  });
  const start = el(
    "button",
    { type: "button", class: "ewl-btn", "data-primary": "1" },
    "Start a class sprint",
  );
  const out = el("div", { id: "ewl-sprint-out" });
  host.append(
    el("h2", {}, "Class sprint · Carrera de clase"),
    el(
      "p",
      {},
      "12 short questions with no clock. Older skills come back while the new one grows. Your teacher can give the whole class one code so everyone gets the same questions.",
    ),
    el(
      "p",
      { class: "ewl-row" },
      el("label", { for: "ewl-sprint-unit" }, "Unit "),
      select,
      el("label", { for: "ewl-sprint-code" }, " Class code (optional) "),
      code,
      start,
    ),
    out,
  );
  const load = (src) =>
    new Promise((ok) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => ok(true);
      s.onerror = () => ok(false);
      document.head.appendChild(s);
    });
  start.addEventListener("click", async () => {
    for (const f of ["rational", "state-store", "reasoning", "ui", "fluency"]) {
      if (
        !window.EWL?.[
          {
            rational: "Rat",
            "state-store": "state",
            reasoning: "Reason",
            ui: "h",
            fluency: "Fluency",
          }[f]
        ] &&
        !(await load(`/assets/ewl/${f}.js`))
      ) {
        out.textContent = "The sprint could not load. Check your connection and try again.";
        return;
      }
    }
    const typed = code.value.trim();
    const parsed = window.EWL.Fluency.parseCode(typed);
    if (typed && !parsed) {
      out.textContent = "That code should look like KITE-4821.";
      return;
    }
    window.EWL.Fluency.mount(out, {
      unit: Number(select.value),
      code: parsed ? typed : undefined,
      n: 12,
    });
  });
})();
