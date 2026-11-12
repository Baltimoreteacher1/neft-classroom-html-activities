// Grade 6 · Equivalent ratios. Authored explanation and living model.
// The model holds ONE invariant the student can watch: red : blue stays 2 : 3 while the number of groups
// changes. Counters, the ratio table, the double number line and the equation are drawn from the same
// two numbers (groups k, and an optional "only red" change) so they can never disagree.
const L = (en, es) => ({ en, es });
const RED = "var(--q1)";
const BLUE = "var(--q2)";

export const ratios6 = {
  concept: L(
    "A ratio compares two quantities. 2 : 3 means “2 red for every 3 blue.” An equivalent ratio describes the same mix with more (or fewer) of the same groups.",
    "Una razón compara dos cantidades. 2 : 3 significa «2 rojas por cada 3 azules». Una razón equivalente describe la misma mezcla con más (o menos) de los mismos grupos.",
  ),
  misconception: L(
    "Changing only one quantity changes the mix. To keep a ratio equivalent, multiply or divide BOTH quantities by the same number.",
    "Cambiar solo una cantidad cambia la mezcla. Para mantener una razón equivalente, multiplica o divide AMBAS cantidades por el mismo número.",
  ),
  reasons: [
    L("Each group always has 2 red and 3 blue.", "Cada grupo siempre tiene 2 rojas y 3 azules."),
    L(
      "Copying the whole group copies both numbers, so both are multiplied by the number of groups.",
      "Copiar el grupo completo copia ambos números, así que los dos se multiplican por el número de grupos.",
    ),
    L(
      "The amounts grow, but “2 for every 3” is still true, so 2 : 3 = 4 : 6.",
      "Las cantidades crecen, pero «2 por cada 3» sigue siendo cierto, así que 2 : 3 = 4 : 6.",
    ),
  ],
  living: { mount: mountRatioModel },
  // "a : b = c : □" answered with b + (c − a): the additive slip, named in the student's own numbers.
  misconceptions: [
    {
      id: "additive",
      detect(item, raw) {
        const m = String(item.question).match(/(\d+)\s*:\s*(\d+)\s*=\s*(\d+|□)\s*:\s*(\d+|□)/);
        if (!m) return false;
        const [a, b, c, d] = m.slice(1).map((v) => (v === "□" ? null : Number(v)));
        const guess = Number(String(raw).trim());
        if (!Number.isFinite(guess)) return false;
        if (d === null && c !== null) return guess === b + (c - a) && c - a !== 0;
        if (c === null && d !== null) return guess === a + (d - b) && d - b !== 0;
        return false;
      },
      feedback: L(
        "You added the same amount to both numbers. A ratio grows by groups: find what the known number was MULTIPLIED by, then multiply the other number by the same factor.",
        "Sumaste la misma cantidad a los dos números. Una razón crece por grupos: halla por cuánto se MULTIPLICÓ el número conocido y multiplica el otro número por el mismo factor.",
      ),
    },
  ],
  // A new context after three independent successes: the same structure, told as a story, not as a : b = c : □.
  transfer: {
    prompt: L(
      "A paint mix uses 2 cups of red for every 3 cups of blue. Maya makes a big batch with 12 cups of blue. How many cups of red does she need to keep the same color?",
      "Una mezcla de pintura usa 2 tazas de rojo por cada 3 tazas de azul. Maya hace una tanda grande con 12 tazas de azul. ¿Cuántas tazas de rojo necesita para mantener el mismo color?",
    ),
    answers: ["8"],
    kind: "number",
    unit: L("cups", "tazas"),
    hint: L(
      "How many groups of 3 cups of blue are in 12 cups?",
      "¿Cuántos grupos de 3 tazas de azul hay en 12 tazas?",
    ),
    explanation: L(
      "12 cups of blue is 4 groups of 3, so red is 4 groups of 2: 2 × 4 = 8 cups. 2 : 3 = 8 : 12.",
      "12 tazas de azul son 4 grupos de 3, así que el rojo es 4 grupos de 2: 2 × 4 = 8 tazas. 2 : 3 = 8 : 12.",
    ),
  },
};

function counters(k, extraRed, T) {
  const out = [];
  for (let g = 0; g < k; g += 1) {
    const x0 = 16 + g * 108;
    out.push(`<rect x="${x0 - 8}" y="8" width="100" height="74" rx="10" class="lm-group"/>`);
    for (let i = 0; i < 2; i += 1)
      out.push(`<circle cx="${x0 + 16 + i * 26}" cy="28" r="10" fill="${RED}"/>`);
    for (let i = 0; i < 3; i += 1)
      out.push(
        `<rect x="${x0 + 4 + i * 26}" y="52" width="20" height="20" rx="3" fill="${BLUE}"/>`,
      );
  }
  for (let i = 0; i < extraRed; i += 1)
    out.push(
      `<circle cx="${30 + k * 108 + i * 26}" cy="28" r="10" fill="${RED}" class="lm-extra"/>`,
    );
  const w = Math.max(340, 40 + k * 108 + extraRed * 26);
  return `<svg viewBox="0 0 ${w} 92" class="lm-svg" role="img" aria-label="${T(L(`${k} groups of 2 red circles and 3 blue squares${extraRed ? `, plus ${extraRed} extra red` : ""}`, `${k} grupos de 2 círculos rojos y 3 cuadrados azules${extraRed ? `, más ${extraRed} rojo extra` : ""}`))}">${out.join("")}</svg>`;
}

function doubleLine(k, extraRed, T) {
  const max = 5;
  const step = 300 / max;
  const ticks = [];
  for (let i = 0; i <= max; i += 1) {
    const x = 30 + i * step;
    const on = i === k;
    ticks.push(
      `<line x1="${x}" y1="30" x2="${x}" y2="40" class="lm-tick"/><text x="${x}" y="24" class="lm-num${on ? " lm-on" : ""}" fill="${RED}">${2 * i}</text>`,
    );
    ticks.push(
      `<line x1="${x}" y1="70" x2="${x}" y2="80" class="lm-tick"/><text x="${x}" y="98" class="lm-num${on ? " lm-on" : ""}" fill="${BLUE}">${3 * i}</text>`,
    );
  }
  const x = 30 + k * step;
  const off = extraRed
    ? `<text x="${x + 8}" y="14" class="lm-warn">${2 * k + extraRed}?</text>`
    : "";
  return `<svg viewBox="0 0 360 106" class="lm-svg" role="img" aria-label="${T(L(`Double number line: red 0 to 10, blue 0 to 15, matched at ${2 * k} and ${3 * k}`, `Recta numérica doble: rojo de 0 a 10, azul de 0 a 15, emparejados en ${2 * k} y ${3 * k}`))}">
    <line x1="30" y1="35" x2="330" y2="35" class="lm-axis"/><line x1="30" y1="75" x2="330" y2="75" class="lm-axis"/>
    <line x1="${x}" y1="35" x2="${x}" y2="75" class="lm-link"/>${ticks.join("")}${off}</svg>`;
}

function mountRatioModel(host, { lang, say }) {
  let k = 1;
  let extra = 0;
  const T = (v) => (lang() === "es" ? v.es : v.en);
  host.innerHTML = `
    <div class="lm" data-lm>
      <div class="lm-controls" role="group" aria-label="${T(L("Change the model", "Cambia el modelo"))}">
        <button type="button" class="btn btn-quiet" data-act="less">− ${T(L("group", "grupo"))}</button>
        <button type="button" class="btn btn-primary" data-act="more">+ ${T(L("Copy the whole group", "Copiar el grupo completo"))}</button>
        <button type="button" class="btn btn-quiet" data-act="red" aria-pressed="false">${T(L("What if only red changes?", "¿Y si solo cambia el rojo?"))}</button>
      </div>
      <figure class="lm-figure" data-counters></figure>
      <div class="lm-pair">
        <table class="lm-table" data-table><caption>${T(L("Ratio table", "Tabla de razones"))}</caption></table>
        <figure class="lm-figure" data-line></figure>
      </div>
      <p class="lm-eq" data-eq aria-live="polite"></p>
    </div>`;
  const q = (s) => host.querySelector(s);
  const draw = () => {
    const red = 2 * k + extra;
    const blue = 3 * k;
    q("[data-counters]").innerHTML = counters(k, extra, T);
    q("[data-line]").innerHTML = doubleLine(k, extra, T);
    const rows = [];
    for (let i = 1; i <= k; i += 1)
      rows.push(
        `<tr${i === k ? ' class="lm-row-on"' : ""}><td style="color:${RED}">${2 * i}</td><td style="color:${BLUE}">${3 * i}</td></tr>`,
      );
    q("[data-table]").innerHTML =
      `<caption>${T(L("Ratio table", "Tabla de razones"))}</caption><thead><tr><th scope="col">${T(L("Red", "Rojo"))}</th><th scope="col">${T(L("Blue", "Azul"))}</th></tr></thead><tbody>${rows.join("")}</tbody>`;
    const eq = extra
      ? T(
          L(
            `2 : 3 ≠ ${red} : ${blue}. Only red changed, so the mix is no longer “2 for every 3.”`,
            `2 : 3 ≠ ${red} : ${blue}. Solo cambió el rojo, así que la mezcla ya no es «2 por cada 3».`,
          ),
        )
      : k === 1
        ? T(
            L(
              "One group: 2 red for every 3 blue. 2 : 3",
              "Un grupo: 2 rojas por cada 3 azules. 2 : 3",
            ),
          )
        : T(
            L(
              `${k} groups: 2 × ${k} = ${red} red and 3 × ${k} = ${blue} blue. 2 : 3 = ${red} : ${blue}`,
              `${k} grupos: 2 × ${k} = ${red} rojas y 3 × ${k} = ${blue} azules. 2 : 3 = ${red} : ${blue}`,
            ),
          );
    q("[data-eq]").innerHTML = eq;
    q('[data-act="less"]').disabled = k <= 1;
    q('[data-act="more"]').disabled = k >= 5;
    q('[data-act="red"]').setAttribute("aria-pressed", String(extra > 0));
    say(eq);
  };
  host.addEventListener("click", (event) => {
    const act = event.target.closest("[data-act]")?.dataset.act;
    if (act === "more" && k < 5) k += 1;
    if (act === "less" && k > 1) k -= 1;
    if (act === "red") extra = extra ? 0 : 1;
    if (act) draw();
  });
  draw();
  return { observed: () => k >= 2 };
}
