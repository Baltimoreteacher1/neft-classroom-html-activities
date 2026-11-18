(() => {
  const el = (id) => document.getElementById(`parts-${id}`);
  const slider = el("count");
  if (!slider) return;
  const stages = [
    [
      4,
      "n",
      6,
      "pencils",
      "One expression, three parts",
      "Each pouch holds 4 pencils. Six pencils are extra.",
      "Cada bolsa tiene 4 lápices. Hay 6 lápices extra.",
      "The letter changes. The 4 and 6 keep their jobs.",
      "La letra cambia. El 4 y el 6 conservan sus funciones.",
    ],
    [
      4,
      "n",
      6,
      "pencils",
      "Find what stays the same",
      "Move the slider. Watch the 6 extra pencils stay the same.",
      "Mueve el control. Observa que los 6 lápices extra no cambian.",
      "6 is the constant. The two terms are 4n and 6.",
      "6 es la constante. Los dos términos son 4n y 6.",
    ],
    [
      4,
      "n",
      6,
      "pencils",
      "Use the expression",
      "Try 3 pouches. Count, then check the total.",
      "Prueba con 3 bolsas. Cuenta y comprueba el total.",
      "Replace n with the number of pouches. Multiply, then add.",
      "Sustituye n por el número de bolsas. Multiplica y luego suma.",
    ],
    [
      5,
      "t",
      2,
      "dollars",
      "Try a new expression",
      "Each ticket costs $5. One fee costs $2.",
      "Cada boleto cuesta $5. Una cuota única cuesta $2.",
      "5 is the coefficient; t is the variable; 2 is the constant.",
      "5 es el coeficiente; t es la variable; 2 es la constante.",
    ],
    [
      3,
      "t",
      2,
      "dollars",
      "Use it for tickets",
      "Each ticket costs $3. The $2 fee is paid once.",
      "Cada boleto cuesta $3. La cuota de $2 se paga una vez.",
      "The ticket price goes with t. Add the one-time fee.",
      "El precio del boleto va con t. Suma la cuota única.",
    ],
  ];
  let current = stages[0];
  const pencil = '<i class="parts-pencil"></i>';
  function picture(n) {
    const [a, , b, unit] = current;
    return unit === "pencils"
      ? `<span class="parts-pouch"><span class="parts-pencils">${pencil.repeat(a)}</span><small>${a} pencils</small></span>`.repeat(
          n,
        ) +
          `<span class="parts-extra"><span class="parts-pencils">${pencil.repeat(b)}</span><small>${b} extra</small></span>`
      : `<span class="parts-ticket"><span aria-hidden="true">✦</span><strong>$${a}</strong><small>ticket</small></span>`.repeat(
          n,
        ) + `<span class="parts-fee"><strong>$${b}</strong><small>one fee</small></span>`;
  }
  function update() {
    const n = Math.max(1, Math.min(5, Number(slider.value) || 1));
    const [a, , b, unit] = current;
    el("count-value").textContent = String(n);
    el("pouches").innerHTML = picture(n);
    el("total").textContent = `${a} × ${n} + ${b} = ${a * n + b} ${unit}`;
  }
  function selectStage() {
    const stage = Math.max(
      1,
      Math.min(
        5,
        Number(document.querySelector('.tab-btn[aria-selected="true"]')?.dataset.tab || 1),
      ),
    );
    current = stages[stage - 1];
    const [a, v, b, unit, title, intro, introEs, rule, ruleEs] = current;
    el("title").textContent = title;
    el("intro").textContent = intro;
    el("intro-es").textContent = introEs;
    el("coef").textContent = String(a);
    el("var").textContent = v;
    el("constant").textContent = String(b);
    el("equation").setAttribute("aria-label", `${a} times ${v} plus ${b}`);
    el("legend").innerHTML =
      `<p><strong>${a}${v}</strong> means ${a} for each ${unit === "pencils" ? "pouch" : "ticket"} × ${v} ${unit === "pencils" ? "pouches" : "tickets"}.</p><p><strong>${b}</strong> is added once. <strong>${a}${v}</strong> and <strong>${b}</strong> are the two terms.</p>`;
    el("slider-label").textContent =
      `Change the number of ${unit === "pencils" ? "pouches" : "tickets"}:`;
    el("slider-label-es").textContent =
      `Cambia el número de ${unit === "pencils" ? "bolsas" : "boletos"}`;
    el("rule").textContent = rule;
    el("rule-es").textContent = ruleEs;
    slider.value = stage === 3 ? "3" : "2";
    update();
  }
  slider.addEventListener("input", update);
  const tabs = document.querySelector(".tab-list");
  if (tabs)
    new MutationObserver(selectStage).observe(tabs, {
      attributes: true,
      attributeFilter: ["aria-selected"],
      subtree: true,
    });
  selectStage();
})();
