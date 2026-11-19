(() => {
  const slider = document.getElementById("alg-n-slider");
  const cluePanel = document.getElementById("alg-clue-panel");
  const presetsBox = document.getElementById("alg-presets");
  if (!slider || !cluePanel || !presetsBox) return;

  const CLUES = {
    "+": {
      words: [
        "Above",
        "Add",
        "Altogether",
        "And",
        "Ascend",
        "Deposit",
        "Grew",
        "Gain",
        "Increase",
        "Longer than",
        "More",
        "Plus",
        "Save",
        "Sum",
        "Total",
      ],
      note: "",
      noteEs: "",
    },
    "-": {
      words: [
        "Below",
        "Decline",
        "Decrease",
        "Descend",
        "Difference",
        "Discount",
        "Fewer",
        "Less",
        "Minus",
        "Shorter than",
        "Subtract",
        "Take away",
        "Withdraw",
        "Lost",
        "Remove",
        "Fewer than *",
        "Less than *",
        "Subtracted from *",
      ],
      note: "* Order is reversed! Example: '9 fewer than n' means n − 9, NOT 9 − n.",
      noteEs: "* ¡El orden se invierte! Ejemplo: '9 menos que n' significa n − 9, NO 9 − n.",
    },
    "*": {
      words: ["Double (× 2)", "Every", "Of", "Product", "Times", "Triple (× 3)", "Twice"],
      note: "Numbers multiplying a variable are written right in front: 4 × n = 4n.",
      noteEs: "Los números que multiplican a una variable se escriben delante: 4 × n = 4n.",
    },
    "/": {
      words: [
        "Distribute",
        "Divide",
        "Find each",
        "Find per",
        "Quotient",
        "Share",
        "Split into",
        "Half (÷ 2)",
      ],
      note: "Order matters for division! 'The quotient of n and 8' means n ÷ 8.",
      noteEs: "¡El orden importa al dividir! 'El cociente de n y 8' significa n ÷ 8.",
    },
  };

  const STAGE_PRESETS = [
    [
      {
        en: "A number plus 9",
        es: "Un número más 9",
        expr: "n + 9",
        op: "+",
        evalStr: (n) => `${n} + 9 = ${n + 9}`,
      },
      {
        en: "A number decreased by 6",
        es: "Un número disminuido en 6",
        expr: "n − 6",
        op: "-",
        evalStr: (n) => `${n} − 6 = ${n - 6}`,
      },
      {
        en: "Double a number",
        es: "El doble de un número",
        expr: "2n",
        op: "*",
        evalStr: (n) => `2 × ${n} = ${2 * n}`,
      },
      {
        en: "A number split into 5 equal groups",
        es: "Un número dividido en 5 grupos iguales",
        expr: "n ÷ 5",
        op: "/",
        evalStr: (n) => `${n} ÷ 5 = ${(n / 5).toFixed(1).replace(/\.0$/, "")}`,
      },
    ],
    [
      {
        en: "9 fewer than a number",
        es: "9 menos que un número",
        expr: "n − 9",
        op: "-",
        evalStr: (n) => `${n} − 9 = ${n - 9}`,
      },
      {
        en: "6 less than a number",
        es: "6 menos que un número",
        expr: "n − 6",
        op: "-",
        evalStr: (n) => `${n} − 6 = ${n - 6}`,
      },
      {
        en: "4 more than a number",
        es: "4 más que un número",
        expr: "n + 4",
        op: "+",
        evalStr: (n) => `${n} + 4 = ${n + 4}`,
      },
      {
        en: "The quotient of a number and 8",
        es: "El cociente de un número y 8",
        expr: "n ÷ 8",
        op: "/",
        evalStr: (n) => `${n} ÷ 8 = ${(n / 8).toFixed(3).replace(/\.?0+$/, "")}`,
      },
    ],
    [
      {
        en: "Triple a number",
        es: "El triple de un número",
        expr: "3n",
        op: "*",
        evalStr: (n) => `3 × ${n} = ${3 * n}`,
      },
      {
        en: "Half a number",
        es: "La mitad de un número",
        expr: "n ÷ 2",
        op: "/",
        evalStr: (n) => `${n} ÷ 2 = ${(n / 2).toFixed(1).replace(/\.0$/, "")}`,
      },
      {
        en: "A number increased by 12",
        es: "Un número aumentado en 12",
        expr: "n + 12",
        op: "+",
        evalStr: (n) => `${n} + 12 = ${n + 12}`,
      },
      {
        en: "7 fewer than a number",
        es: "7 menos que un número",
        expr: "n − 7",
        op: "-",
        evalStr: (n) => `${n} − 7 = ${n - 7}`,
      },
    ],
    [
      {
        en: "Triple a number, increased by 2",
        es: "El triple de un número, aumentado en 2",
        expr: "3n + 2",
        op: "+",
        evalStr: (n) => `3 × ${n} + 2 = ${3 * n + 2}`,
      },
      {
        en: "7 less than double a number",
        es: "7 menos que el doble de un número",
        expr: "2n − 7",
        op: "-",
        evalStr: (n) => `2 × ${n} − 7 = ${2 * n - 7}`,
      },
      {
        en: "The sum of a number and 3, times 8",
        es: "La suma de un número y 3, multiplicada por 8",
        expr: "8(n + 3)",
        op: "*",
        evalStr: (n) => `8 × (${n} + 3) = ${8 * (n + 3)}`,
      },
      {
        en: "10 subtracted from the product of 4 and a number",
        es: "10 restado del producto de 4 y un número",
        expr: "4n − 10",
        op: "-",
        evalStr: (n) => `4 × ${n} − 10 = ${4 * n - 10}`,
      },
    ],
    [
      {
        en: "The quotient of a number and 5, plus 9",
        es: "El cociente de un número y 5, más 9",
        expr: "n ÷ 5 + 9",
        op: "/",
        evalStr: (n) => `${n} ÷ 5 + 9 = ${Number((n / 5 + 9).toFixed(1))}`,
      },
      {
        en: "Half of the difference between a number and 6",
        es: "La mitad de la diferencia entre un número y 6",
        expr: "(n − 6) ÷ 2",
        op: "/",
        evalStr: (n) => `(${n} − 6) ÷ 2 = ${(n - 6) / 2}`,
      },
      {
        en: "The sum of a number and 8, divided by 3",
        es: "La suma de un número y 8, dividida entre 3",
        expr: "(n + 8) ÷ 3",
        op: "/",
        evalStr: (n) => `(${n} + 8) ÷ 3 = ${Number(((n + 8) / 3).toFixed(2))}`,
      },
    ],
  ];

  let activeStage = 0;
  let activePreset = 0;

  function renderClues(op) {
    const entry = CLUES[op] || CLUES["+"];
    document.querySelectorAll(".alg-op-tab").forEach((btn) => {
      const on = btn.dataset.op === op;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    const chips = entry.words
      .map((w) => `<li class="alg-word-chip${w.includes("*") ? " is-reverse" : ""}">${w}</li>`)
      .join("");
    const note = entry.note
      ? `<p class="alg-reverse-note"><span class="t-en">${entry.note}</span><span class="t-es" lang="es">${entry.noteEs}</span></p>`
      : "";
    cluePanel.innerHTML = `<ul class="alg-word-list">${chips}</ul>${note}`;
  }

  function renderEval() {
    const n = Math.max(1, Math.min(6, Number(slider.value) || 4));
    const list = STAGE_PRESETS[activeStage] || STAGE_PRESETS[0];
    const item = list[activePreset] || list[0];
    document.getElementById("alg-n-val").textContent = String(n);
    document.getElementById("alg-phrase-en").textContent = item.en;
    document.getElementById("alg-phrase-es").textContent = item.es;
    document.getElementById("alg-expr-out").textContent = item.expr;
    document.getElementById("alg-eval-out").textContent = item.evalStr(n);
  }

  function renderPresets() {
    const list = STAGE_PRESETS[activeStage] || STAGE_PRESETS[0];
    presetsBox.innerHTML = list
      .map(
        (item, idx) =>
          `<button type="button" class="alg-preset-btn${idx === activePreset ? " is-active" : ""}" data-idx="${idx}"><span class="t-en">${item.en}</span><span class="t-es" lang="es">${item.es}</span></button>`,
      )
      .join("");
    presetsBox.querySelectorAll(".alg-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activePreset = Number(btn.dataset.idx) || 0;
        const item = list[activePreset] || list[0];
        renderClues(item.op);
        renderPresets();
        renderEval();
      });
    });
  }

  function selectStage() {
    const tab = Number(document.querySelector('.tab-btn[aria-selected="true"]')?.dataset.tab || 1);
    activeStage = Math.max(0, Math.min(4, tab - 1));
    activePreset = 0;
    const item = STAGE_PRESETS[activeStage][0];
    renderClues(item.op);
    renderPresets();
    renderEval();
  }

  document.querySelectorAll(".alg-op-tab").forEach((btn) => {
    btn.addEventListener("click", () => renderClues(btn.dataset.op));
  });
  slider.addEventListener("input", renderEval);

  const tabs = document.querySelector(".tab-list");
  if (tabs) {
    new MutationObserver(selectStage).observe(tabs, {
      attributes: true,
      attributeFilter: ["aria-selected"],
      subtree: true,
    });
  }
  selectStage();
})();
