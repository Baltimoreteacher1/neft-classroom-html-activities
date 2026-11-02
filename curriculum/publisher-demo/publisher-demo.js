const root = document.querySelector(".publisher-demo-wrap");

const tourStops = [
  {
    title: "Start with a question students can picture.",
    copy: "In Understand Ratios, students compare quantities from a recipe, name the order of the comparison, and distinguish part-to-part from part-to-whole. The lesson moves through vocabulary, launch, learning, exploration, practice, connection, and reflection.",
    callout: "Look for the concept in context before the notation becomes the focus.",
    link: "/lessons/3-1/",
    label: "Open the flagship lesson",
  },
  {
    title: "Manipulate quantities while keeping the relationship.",
    copy: "The recipe model makes the scale factor visible: multiply both quantities by the same number to build an equivalent ratio. Continue into the self-paced Ratio Quest or open the connected ratio canvas.",
    callout: "Ask: what changed, what stayed the same, and how can the model prove it?",
    link: "/curriculum/ratio-quest/",
    label: "Play Ratio Quest",
  },
  {
    title: "Use feedback to make a more precise revision.",
    copy: "Students get another chance to reason through ratios with worked hints and explanation. A supported pathway revisits the quantities and the order named by the question; it keeps the same Grade 6 mathematical goal.",
    callout: "A revision is useful when the learner can explain why the new representation fits.",
    link: "/lessons/3-1-group1/practice.html",
    label: "Try the supported practice",
  },
  {
    title: "Let evidence shape the next teaching move.",
    copy: "This public example uses a clearly labeled synthetic response pattern. It separates a correct comparison from the specific misconception of reversing the named quantities and suggests a targeted prompt for reassessment.",
    callout: "The sample is instructional illustration, not a validated mastery estimate or prediction.",
    link: "#evidence-title",
    label: "View the synthetic evidence example",
  },
  {
    title: "Keep the idea moving beyond class.",
    copy: "Family Connections provides weekly learning context, homework, and bilingual guidance. The lesson’s family idea explains ratio order in plain language and offers a short check to discuss together.",
    callout: "Family practice is an invitation to talk about mathematics, not extra required work.",
    link: "/lessons/3-1/homework.html?lang=es",
    label: "Open the family learning page",
  },
];

const stops = [...(root?.querySelectorAll(".tour-stop") ?? [])];
const panel = root?.querySelector("#tour-detail");
const title = root?.querySelector("[data-detail-title]");
const copy = root?.querySelector("[data-detail-copy]");
const callout = root?.querySelector("[data-detail-callout]");
const link = root?.querySelector("[data-detail-link]");
const index = root?.querySelector(".detail-index");

function selectStop(nextIndex, moveFocus = false) {
  if (!tourStops[nextIndex] || !panel) return;
  const stop = tourStops[nextIndex];
  stops.forEach((button, i) => {
    const selected = i === nextIndex;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", `stop-${nextIndex + 1}`);
  if (title) title.textContent = stop.title;
  if (copy) copy.textContent = stop.copy;
  if (callout) callout.textContent = stop.callout;
  if (link) {
    link.href = stop.link;
    link.replaceChildren(document.createTextNode(`${stop.label} `));
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    link.append(arrow);
  }
  if (index) index.textContent = String(nextIndex + 1).padStart(2, "0");
  if (moveFocus) stops[nextIndex]?.focus();
}

stops.forEach((button, i) => {
  button.addEventListener("click", () => selectStop(i));
  button.addEventListener("keydown", (event) => {
    let next = i;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % stops.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i - 1 + stops.length) % stops.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = stops.length - 1;
    else return;
    event.preventDefault();
    selectStop(next, true);
  });
});

root?.querySelector("[data-next]")?.addEventListener("click", () => {
  const selected = Math.max(0, stops.findIndex((button) => button.getAttribute("aria-selected") === "true"));
  const next = (selected + 1) % tourStops.length;
  selectStop(next);
  panel?.focus();
});

const batch = root?.querySelector("#batch-count");
const batchValue = root?.querySelector("#batch-value");
const juiceTotal = root?.querySelector("#juice-total");
const waterTotal = root?.querySelector("#water-total");
const juiceBar = root?.querySelector("#juice-bar");
const waterBar = root?.querySelector("#water-bar");
const explanation = root?.querySelector("#model-explain");

function updateRatioModel() {
  if (!batch) return;
  const batches = Number(batch.value);
  if (!Number.isInteger(batches) || batches < 1 || batches > 5) return;
  const juice = batches * 3;
  const water = batches * 2;
  if (batchValue) batchValue.value = String(batches);
  if (juiceTotal) juiceTotal.value = String(juice);
  if (waterTotal) waterTotal.value = String(water);
  if (juiceBar) juiceBar.style.setProperty("--bar", `${(juice / 25) * 100}%`);
  if (waterBar) waterBar.style.setProperty("--bar", `${(water / 25) * 100}%`);
  if (explanation) {
    explanation.replaceChildren(
      document.createTextNode(`${batches} × 3 cups : ${batches} × 2 cups = `),
      Object.assign(document.createElement("strong"), { textContent: `${juice} : ${water}` }),
      document.createTextNode(". The scale factor is the same for both quantities."),
    );
  }
  batch.setAttribute("aria-valuetext", `${batches} ${batches === 1 ? "batch" : "batches"}: ${juice} cups of juice and ${water} cups of water`);
}

batch?.addEventListener("input", updateRatioModel);
updateRatioModel();

const predictionForm = root?.querySelector("#prediction-form");
const predictionFeedback = root?.querySelector("#prediction-feedback");
predictionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const juice = Number(root.querySelector("#predict-juice")?.value);
  const water = Number(root.querySelector("#predict-water")?.value);
  if (!Number.isInteger(juice) || !Number.isInteger(water)) {
    if (predictionFeedback) predictionFeedback.textContent = "Enter a whole-number prediction for both quantities.";
    return;
  }
  if (juice === 9 && water === 6) {
    if (predictionFeedback) predictionFeedback.textContent = "Yes. Three batches multiply each amount by 3: 3 × 3 = 9 cups of juice and 3 × 2 = 6 cups of water. Now move the model to 3 batches to check your prediction.";
  } else if (juice === 6 && water === 9) {
    if (predictionFeedback) predictionFeedback.textContent = "You found the two totals but reversed their order. The question asks for juice first, then water. Revise your prediction.";
  } else if (juice === 3 && water === 2) {
    if (predictionFeedback) predictionFeedback.textContent = "That is the one-batch ratio. For 3 batches, multiply both parts by 3. Revise each amount.";
  } else if (predictionFeedback) {
    predictionFeedback.textContent = "Use the same scale factor for both quantities. Three batches means 3 groups of 3 cups of juice and 3 groups of 2 cups of water.";
  }
});

const transferForm = root?.querySelector("#transfer-form");
const transferFeedback = root?.querySelector("#transfer-feedback");
transferForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const water = Number(root.querySelector("#transfer-water")?.value);
  if (!Number.isInteger(water)) {
    if (transferFeedback) transferFeedback.textContent = "Enter a whole-number amount of water.";
    return;
  }
  if (water === 8) {
    if (transferFeedback) transferFeedback.textContent = "Correct. 12 cups is 4 groups of 3 cups, so multiply the 2 cups of water by 4: 8 cups. The ratio remains equivalent.";
  } else if (water === 6) {
    if (transferFeedback) transferFeedback.textContent = "You kept the original 2 cups of water. Find how many groups of 3 fit into 12 cups of juice, then scale the water by that same factor.";
  } else {
    if (transferFeedback) transferFeedback.textContent = "Find the scale factor from 3 cups of juice to 12 cups. Apply that same factor to the 2 cups of water, then revise.";
  }
});
