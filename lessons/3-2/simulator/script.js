"use strict";

const scenarios = [
  { id: "rice", category: "Groceries", icon: "🍚", item: "rice", unit: "pound", a: { name: "Pantry Bag", price: 5.76, qty: 4 }, b: { name: "Family Bag", price: 8.40, qty: 6 }, story: "Jordan is buying rice for a neighborhood dinner. Which bag costs less for each pound of rice?" },
  { id: "apples", category: "Groceries", icon: "🍎", item: "apples", unit: "pound", a: { name: "Orchard Bag", price: 6.30, qty: 3 }, b: { name: "Market Bag", price: 9.60, qty: 5 }, story: "Amari needs apples for snack boxes. Which bag has the lower price for one pound?" },
  { id: "juice", category: "Drinks", icon: "🧃", item: "juice boxes", unit: "box", a: { name: "Lunch Pack", price: 4.80, qty: 6 }, b: { name: "Party Pack", price: 8.40, qty: 12 }, story: "Kai is stocking drinks for a field trip. Which package costs less for each juice box?" },
  { id: "water", category: "Drinks", icon: "💧", item: "water bottles", unit: "bottle", a: { name: "Trail Pack", price: 5.25, qty: 7 }, b: { name: "Team Pack", price: 8.64, qty: 12 }, story: "Nia is buying water for soccer practice. Which pack gives the lower cost per bottle?" },
  { id: "granola", category: "Snacks", icon: "🥜", item: "granola bars", unit: "bar", a: { name: "Crunch Pack", price: 5.40, qty: 9 }, b: { name: "Adventure Pack", price: 7.20, qty: 15 }, story: "Luis wants granola bars for a hiking club. Which pack is the best buy per bar?" },
  { id: "popcorn", category: "Snacks", icon: "🍿", item: "popcorn bags", unit: "bag", a: { name: "Movie Box", price: 6.75, qty: 9 }, b: { name: "Big Screen Box", price: 8.40, qty: 14 }, story: "Maya is planning movie night. Which box has the lower unit price per popcorn bag?" },
  { id: "pencils", category: "School", icon: "✏️", item: "pencils", unit: "pencil", a: { name: "Study Pack", price: 3.60, qty: 8 }, b: { name: "Class Pack", price: 6.00, qty: 15 }, story: "Devon is buying pencils for a study group. Which pack costs less for each pencil?" },
  { id: "notebooks", category: "School", icon: "📓", item: "notebooks", unit: "notebook", a: { name: "Three Pack", price: 6.75, qty: 3 }, b: { name: "Five Pack", price: 10.00, qty: 5 }, story: "Sam needs notebooks for the semester. Which bundle has the better price per notebook?" },
  { id: "paper", category: "Household", icon: "🧻", item: "paper towel rolls", unit: "roll", a: { name: "Everyday Pack", price: 8.25, qty: 6 }, b: { name: "Stock-Up Pack", price: 13.20, qty: 12 }, story: "A family is restocking paper towels. Which package has the lower cost for one roll?" },
  { id: "soap", category: "Household", icon: "🧼", item: "soap bars", unit: "bar", a: { name: "Fresh Pack", price: 5.25, qty: 5 }, b: { name: "Home Pack", price: 8.64, qty: 9 }, story: "Riley is comparing soap packages. Which package costs less for each bar?" },
  { id: "dogtreats", category: "Pet Care", icon: "🐾", item: "dog treats", unit: "ounce", a: { name: "Training Bites", price: 6.30, qty: 7 }, b: { name: "Reward Bites", price: 9.60, qty: 12 }, story: "Taylor needs training treats for a puppy. Which bag has the lower cost per ounce?" },
  { id: "catfood", category: "Pet Care", icon: "🐈", item: "cat food cans", unit: "can", a: { name: "Tasty Six", price: 7.50, qty: 6 }, b: { name: "Pantry Ten", price: 11.50, qty: 10 }, story: "Morgan is stocking up on cat food. Which package costs less per can?" }
];

const categories = ["All", ...new Set(scenarios.map((item) => item.category))];
const state = { current: scenarios[0], category: "All", step: 1, mode: "practice", attempts: 0, solved: 0, problemNumber: 1, lastScenarioId: null };

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `$${Number(value).toFixed(2)}`;
const plural = (word, qty) => {
  if (Number(qty) === 1 || word.endsWith("s")) return word;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(ch|sh|x)$/i.test(word)) return `${word}es`;
  return `${word}s`;
};
const rate = (product) => product.price / product.qty;

const els = {
  categoryList: $("#categoryList"), productComparison: $("#productComparison"), problemStory: $("#problemStory"),
  problemCounter: $("#problemCounter"), fractionInputs: $("#fractionInputs"), divisionInputs: $("#divisionInputs"),
  unitRateInputs: $("#unitRateInputs"), bestBuyOptions: $("#bestBuyOptions"), feedback: $("#feedback"),
  checkButton: $("#checkButton"), coachTitle: $("#coachTitle"), coachText: $("#coachText"),
  simulator: $("#simulatorLayout"), learnPanel: $("#learnPanel"), successPanel: $("#successPanel"),
  sessionScore: $("#sessionScore"), reasonInput: $("#reasonInput")
};

function renderCategories() {
  els.categoryList.innerHTML = categories.map((category) => `
    <button class="category-chip ${category === state.category ? "active" : ""}" type="button" data-category="${category}" aria-pressed="${category === state.category}">${category}</button>
  `).join("");
}

function productCard(product, letter) {
  return `<article class="product-ticket">
    <span class="product-letter" aria-hidden="true">${letter}</span>
    <span class="product-icon" aria-hidden="true">${state.current.icon}</span>
    <h3>${product.name}</h3>
    <span class="product-meta">${product.qty} ${plural(state.current.unit, product.qty)}</span>
    <p class="shelf-price">${money(product.price)}<small>STORE PRICE</small></p>
  </article>`;
}

function answerBlock(product, key, type) {
  const label = product.name;
  if (type === "fraction") {
    return `<div class="answer-block"><strong>${label}</strong><div class="fraction-entry">
      <label class="sr-only" for="${key}FractionPrice">${label} numerator, the price</label>
      <input id="${key}FractionPrice" inputmode="decimal" data-answer="${product.price}" aria-describedby="${key}FractionUnit" placeholder="price" />
      <span class="fraction-line" aria-hidden="true"></span>
      <label class="sr-only" for="${key}FractionQty">${label} denominator, the quantity</label>
      <input id="${key}FractionQty" inputmode="decimal" data-answer="${product.qty}" placeholder="quantity" />
      <span class="sr-only" id="${key}FractionUnit">dollars over ${plural(state.current.unit, product.qty)}</span>
    </div></div>`;
  }
  if (type === "division") {
    return `<div class="answer-block"><strong>${label}</strong><div class="math-expression">
      <label class="sr-only" for="${key}DivisionPrice">${label} dividend</label><input id="${key}DivisionPrice" inputmode="decimal" data-answer="${product.price}" placeholder="price" />
      <b aria-hidden="true">÷</b>
      <label class="sr-only" for="${key}DivisionQty">${label} divisor</label><input id="${key}DivisionQty" inputmode="decimal" data-answer="${product.qty}" placeholder="quantity" />
    </div></div>`;
  }
  return `<div class="answer-block"><strong>${label}</strong><div class="input-with-symbol">
    <span>$</span><label class="sr-only" for="${key}UnitRate">${label} unit rate</label>
    <input id="${key}UnitRate" inputmode="decimal" data-answer="${rate(product).toFixed(2)}" placeholder="0.00" />
    <span class="unit-label">per ${state.current.unit}</span>
  </div></div>`;
}

function renderProblem() {
  const { a, b } = state.current;
  els.problemCounter.textContent = `${state.mode === "challenge" ? "CHALLENGE" : "PRACTICE"} • PROBLEM ${state.problemNumber}`;
  els.problemStory.textContent = state.current.story;
  els.productComparison.innerHTML = productCard(a, "A") + productCard(b, "B");
  els.fractionInputs.innerHTML = answerBlock(a, "a", "fraction") + answerBlock(b, "b", "fraction");
  els.divisionInputs.innerHTML = answerBlock(a, "a", "division") + answerBlock(b, "b", "division");
  els.unitRateInputs.innerHTML = answerBlock(a, "a", "unit") + answerBlock(b, "b", "unit");
  els.bestBuyOptions.innerHTML = [a, b].map((product, index) => `<div class="choice-option">
    <input id="choice${index}" name="bestBuy" type="radio" value="${index === 0 ? "a" : "b"}" />
    <label for="choice${index}"><strong>Choice ${index === 0 ? "A" : "B"}</strong><span>${product.name}<br>${money(rate(product))} per ${state.current.unit}</span></label>
  </div>`).join("");
  resetWork();
}

function resetWork() {
  state.step = 1;
  state.attempts = 0;
  els.successPanel.hidden = true;
  els.simulator.hidden = false;
  els.feedback.hidden = true;
  els.reasonInput.value = "";
  $$("input", $("#workForm")).forEach((input) => {
    if (input.type === "radio") input.checked = false;
    else input.value = "";
    input.classList.remove("valid", "invalid");
  });
  goToStep(1, true);
}

function goToStep(step, force = false) {
  if (!force && step > state.step) return;
  state.step = step;
  $$(".work-step").forEach((panel) => { const active = Number(panel.dataset.stepPanel) === step; panel.hidden = !active; panel.classList.toggle("active", active); });
  $$(".step-marker").forEach((marker) => {
    const markerStep = Number(marker.dataset.step);
    marker.classList.toggle("active", markerStep === step);
    marker.classList.toggle("complete", markerStep < step);
    marker.disabled = markerStep > step;
    marker.removeAttribute("aria-current");
    if (markerStep === step) marker.setAttribute("aria-current", "step");
  });
  els.feedback.hidden = true;
  const messages = {
    1: ["Write as a fraction", "Write each rate as a fraction: price on top, quantity on bottom."],
    2: ["Divide both parts", "Divide both parts (top and bottom) by the bottom number."],
    3: ["Fraction over 1", `Your unit rate is in fraction form over 1 ($/1 ${state.current.unit}).`],
    4: ["Compare unit rates", "Both rates are now per 1 unit. Choose the lower price for the best buy."]
  };
  [els.coachTitle.textContent, els.coachText.textContent] = messages[step];
  els.checkButton.textContent = step === 4 ? "Check my choice →" : "Check my work →";
}

function numericMatch(input) {
  const entered = Number(String(input.value).replace(/[$,]/g, ""));
  return input.value.trim() !== "" && Math.abs(entered - Number(input.dataset.answer)) <= 0.011;
}

function showFeedback(message, type = "error") {
  els.feedback.className = `feedback ${type}`;
  els.feedback.textContent = message;
  els.feedback.hidden = false;
}

function validateStep() {
  state.attempts += 1;
  const panel = $(`[data-step-panel="${state.step}"]`);
  if (state.step < 4) {
    const inputs = $$("input[data-answer]", panel);
    const invalid = inputs.filter((input) => {
      const correct = numericMatch(input);
      input.classList.toggle("valid", correct);
      input.classList.toggle("invalid", !correct);
      return !correct;
    });
    if (invalid.length) {
      showFeedback(state.step === 3 ? "Not quite yet. Check each division result and round to the nearest cent." : "One or more boxes need another look. Use the labels and read each rate from top to bottom.");
      invalid[0].focus();
      return;
    }
    showFeedback("Yes—that step is correct. Keep going!", "success");
    window.setTimeout(() => goToStep(state.step + 1, true), 420);
    return;
  }

  const selected = $("input[name='bestBuy']:checked");
  const best = rate(state.current.a) < rate(state.current.b) ? "a" : "b";
  if (!selected) { showFeedback("Choose A or B, then support your choice with the unit rates."); return; }
  if (selected.value !== best) { showFeedback("Compare the two costs per unit again. For a price, the smaller number is the better buy."); return; }
  if (els.reasonInput.value.trim().length < 12) { showFeedback("Add a complete sentence that names the lower unit rate."); els.reasonInput.focus(); return; }
  completeProblem(best);
}

function completeProblem(bestKey) {
  const best = state.current[bestKey];
  const other = state.current[bestKey === "a" ? "b" : "a"];
  const difference = rate(other) - rate(best);
  state.solved += 1;
  localStorage.setItem("unitRateSolved", String(state.solved));
  els.sessionScore.textContent = `${state.solved} SOLVED`;
  $("#successSummary").textContent = `${best.name} is the best buy at ${money(rate(best))} per ${state.current.unit}, compared with ${money(rate(other))} per ${state.current.unit}.`;
  $("#savingsCallout").textContent = `That saves ${money(difference)} per ${state.current.unit} — or ${money(difference * 10)} for 10 ${plural(state.current.unit, 10)}.`;
  els.simulator.hidden = true;
  els.successPanel.hidden = false;
  els.successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function chooseProblem() {
  const pool = scenarios.filter((item) => state.category === "All" || item.category === state.category);
  const choices = pool.filter((item) => item.id !== state.current.id);
  state.lastScenarioId = state.current.id;
  state.current = choices[Math.floor(Math.random() * choices.length)] || pool[0];
  state.problemNumber += 1;
  renderProblem();
  window.scrollTo({ top: $(".control-bar").offsetTop - 90, behavior: "smooth" });
}

function openHint() {
  const a = state.current.a, b = state.current.b;
  const hints = {
    1: ["Build the two fractions", `<p>The word <strong>per</strong> can be represented with a fraction bar. Put dollars above that bar.</p><div class="hint-equation">${money(a.price)} / ${a.qty} &nbsp;&nbsp; and &nbsp;&nbsp; ${money(b.price)} / ${b.qty}</div>`],
    2: ["Read top ÷ bottom", `<p>A fraction is another way to show division. Do not switch the order.</p><div class="hint-equation">price ÷ quantity</div>`],
    3: ["Calculate one at a time", `<p>For Choice A, enter this in a calculator if needed:</p><div class="hint-equation">${a.price} ÷ ${a.qty}</div><p>Then repeat the same process for Choice B. Round money to two decimal places.</p>`],
    4: ["Let the unit rates decide", `<p>Look at the two numbers labeled <strong>per ${state.current.unit}</strong>. The lower cost gets you the same one unit for less money.</p>`]
  };
  [$("#hintTitle").textContent, $("#hintContent").innerHTML] = hints[state.step];
  $("#hintDialog").showModal();
}

function setMode(mode) {
  state.mode = mode;
  $$(".mode-button").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  document.body.classList.toggle("challenge-mode", mode === "challenge");
  if (mode === "learn") {
    els.learnPanel.hidden = false; els.simulator.hidden = true; els.successPanel.hidden = true;
    els.learnPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    els.learnPanel.hidden = true; els.simulator.hidden = false; els.successPanel.hidden = true;
    resetWork(); renderProblem();
  }
}

function readProblem() {
  if (!("speechSynthesis" in window)) { showFeedback("Read-aloud is not available in this browser."); return; }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${state.current.story} Choice A: ${state.current.a.name}, ${money(state.current.a.price)} for ${state.current.a.qty} ${plural(state.current.unit, state.current.a.qty)}. Choice B: ${state.current.b.name}, ${money(state.current.b.price)} for ${state.current.b.qty} ${plural(state.current.unit, state.current.b.qty)}.`);
  utterance.rate = 0.92;
  speechSynthesis.speak(utterance);
}

function createCustomProblem(form) {
  const data = new FormData(form);
  const item = String(data.get("item")).trim();
  const unit = String(data.get("unit")).trim();
  state.current = {
    id: `custom-${Date.now()}`, category: "Custom", icon: "🛒", item, unit,
    a: { name: String(data.get("nameA")).trim(), price: Number(data.get("priceA")), qty: Number(data.get("qtyA")) },
    b: { name: String(data.get("nameB")).trim(), price: Number(data.get("priceB")), qty: Number(data.get("qtyB")) },
    story: `You are shopping for ${item}. Which choice gives you the lower cost per ${unit}?`
  };
  state.category = "All";
  state.problemNumber += 1;
  renderCategories(); renderProblem();
  $("#customDialog").close();
}

els.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories(); chooseProblem();
});
$("#workForm").addEventListener("submit", (event) => { event.preventDefault(); validateStep(); });
$("#newProblemButton").addEventListener("click", chooseProblem);
$("#nextProblemButton").addEventListener("click", chooseProblem);
$("#reviewWorkButton").addEventListener("click", () => { els.successPanel.hidden = true; els.simulator.hidden = false; goToStep(4, true); });
$("#hintButton").addEventListener("click", openHint);
$("#listenButton").addEventListener("click", readProblem);
$("#openHelp").addEventListener("click", () => $("#helpDialog").showModal());
$("#customProblemButton").addEventListener("click", () => $("#customDialog").showModal());
$("#customForm").addEventListener("submit", (event) => { event.preventDefault(); if (event.currentTarget.reportValidity()) createCustomProblem(event.currentTarget); });
$$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
$$('dialog').forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));
$$('.mode-button').forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
$(".start-practice").addEventListener("click", () => setMode("practice"));
$$('.step-marker').forEach((button) => button.addEventListener("click", () => goToStep(Number(button.dataset.step))));

state.solved = Number(localStorage.getItem("unitRateSolved") || 0);
els.sessionScore.textContent = `${state.solved} SOLVED`;
renderCategories();
renderProblem();
