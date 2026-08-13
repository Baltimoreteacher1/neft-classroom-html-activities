import { figureBlock } from "./small-group-labs.js";
import { el, esc } from "./small-group-ui.js";

const STRATEGIES = {
  equation: [
    {
      id: "balance-both-sides",
      category: "visual",
      label: "Balance Both Sides",
      icon: "⚖️",
      direction:
        "Treat the equal sign like a balanced scale. Write one side on each pan. Choose one inverse operation and apply it to both sides. Record the new equation, then decide your next move.",
    },
    {
      id: "inverse-operations",
      category: "calculate",
      label: "Undo Step-by-Step",
      icon: "↩️",
      direction:
        "Circle the operation attached to the variable. Write its inverse underneath, do it to both sides, and simplify one line at a time. Check by substituting your result into the original equation.",
    },
    {
      id: "explain-equivalence",
      category: "verbal",
      label: "Talk Through Equality",
      icon: "🗣️",
      direction:
        "Say: “Both sides stay equal because I ___ on the left and ___ on the right.” Name one move at a time. Your partner should stop you if the two sides do not get the same move.",
    },
  ],
  ratio: [
    {
      id: "ratio-table",
      category: "visual",
      label: "Build a Ratio Table",
      icon: "▦",
      direction:
        "Make two labeled rows. Put the given pair in the first column. Scale both rows by the same factor in each new column until one column matches the quantity the problem asks about.",
    },
    {
      id: "unit-rate",
      category: "calculate",
      label: "Find the Per-1 Rate",
      icon: "➗",
      direction:
        "Divide both quantities by the same number until one quantity is 1. Label what “per 1” means, then scale that rate to the amount in the question.",
    },
    {
      id: "explain-scaling",
      category: "verbal",
      label: "Explain the Scale Factor",
      icon: "🗣️",
      direction:
        "Use the frame: “I multiplied or divided both quantities by ___, so the ratio stayed equivalent.” Point to the two quantities each time you name a scale factor.",
    },
  ],
  percent: [
    {
      id: "percent-line",
      category: "visual",
      label: "Use a Double Number Line",
      icon: "↔️",
      direction:
        "Draw two aligned lines. Mark 0 and 100% first. Put 0 and the whole directly above them. Add a helpful benchmark such as 10%, 25%, or 50%, then locate the percent the problem asks for.",
    },
    {
      id: "percent-equation",
      category: "calculate",
      label: "Write a Percent Equation",
      icon: "✏️",
      direction:
        "Write part = percent × whole. Replace the percent with a decimal, substitute only the values the problem gives, and solve for the missing part. Keep the label with your result.",
    },
    {
      id: "percent-language",
      category: "verbal",
      label: "Name Part and Whole",
      icon: "🗣️",
      direction:
        "Say: “The whole is ___, the percent is ___ out of 100, and the part is what I need to find.” Explain how a benchmark percent helps before you calculate.",
    },
  ],
  "surface-area": [
    {
      id: "surface-net",
      category: "visual",
      label: "Sketch a Labeled Net",
      icon: "🧊",
      direction:
        "Sketch the solid opened flat. Label all six faces before calculating. Mark matching faces with the same symbol so you can see which rectangles occur in pairs.",
    },
    {
      id: "face-pairs",
      category: "calculate",
      label: "Calculate by Face Pairs",
      icon: "✏️",
      direction:
        "List the three different face areas: length × width, length × height, and width × height. Double each area for its opposite face, then add the three pair totals.",
    },
    {
      id: "surface-decompose",
      category: "verbal",
      label: "Talk Around the Solid",
      icon: "🗣️",
      direction:
        "Name the faces in order: top, bottom, front, back, left, right. For each face, say which two dimensions make it. Check that every face is counted exactly once.",
    },
  ],
  statistics: [
    {
      id: "data-display",
      category: "visual",
      label: "Make a Quick Data Display",
      icon: "▥",
      direction:
        "Plot or stack every data value. Mark the cluster, gaps, and any value far from the rest. Use the shape you see to decide which statistic or comparison makes sense.",
    },
    {
      id: "stat-calculation",
      category: "calculate",
      label: "Calculate in a Table",
      icon: "✏️",
      direction:
        "Order the data first. Make columns for the value, its distance from the center when needed, and the running total. Calculate one column at a time and check that every data value appears once.",
    },
    {
      id: "stat-explanation",
      category: "verbal",
      label: "Explain the Distribution",
      icon: "🗣️",
      direction:
        "Use the frame: “Most values are around ___, but ___ changes the distribution because ___.” Name the shape or outlier before choosing a measure or making a comparison.",
    },
  ],
  geometry: [
    {
      id: "decompose-shape",
      category: "visual",
      label: "Decompose the Figure",
      icon: "▧",
      direction:
        "Trace the outside edge, then draw one helpful line to split the figure into shapes you know. Label every needed length and mark any missing length you can find from the given dimensions.",
    },
    {
      id: "geometry-equations",
      category: "calculate",
      label: "Write One Formula per Part",
      icon: "✏️",
      direction:
        "Name each simple shape, write its formula, and substitute its own dimensions. Keep the part results separate until the last step, then add or subtract as the diagram requires.",
    },
    {
      id: "geometry-explain",
      category: "verbal",
      label: "Explain the Pieces",
      icon: "🗣️",
      direction:
        "Say: “I split the figure into ___ and ___ because ___.” Explain where each measurement belongs and why the part results should be added or subtracted.",
    },
  ],
  number: [
    {
      id: "number-line",
      category: "visual",
      label: "Reason on a Number Line",
      icon: "↔️",
      direction:
        "Mark the nearest useful benchmarks first. Place each given number relative to those benchmarks, then use equal jumps or distance from zero to reason about the same problem.",
    },
    {
      id: "number-equation",
      category: "calculate",
      label: "Write and Calculate",
      icon: "✏️",
      direction:
        "Rewrite the situation as one number sentence. Estimate first, calculate one operation at a time, and compare the result with your estimate before deciding it is reasonable.",
    },
    {
      id: "number-talk",
      category: "verbal",
      label: "Talk Step-by-Step",
      icon: "🗣️",
      direction:
        "Use the frame: “First I ___ because ___. Next I ___. I know the result is reasonable because ___.” Keep each sentence to one mathematical move.",
    },
  ],
  general: [
    {
      id: "visual-model",
      category: "visual",
      label: "Draw and Label a Model",
      icon: "▧",
      direction:
        "Draw a simple model of the quantities in the problem. Label what each part represents, circle the unknown, and add only the relationships the problem gives.",
    },
    {
      id: "write-calculate",
      category: "calculate",
      label: "Write and Calculate",
      icon: "✏️",
      direction:
        "Write one equation that matches the problem. Estimate the result, calculate one step at a time, and use the estimate to check whether your result makes sense.",
    },
    {
      id: "talk-steps",
      category: "verbal",
      label: "Talk Step-by-Step",
      icon: "🗣️",
      direction:
        "Explain one move per sentence: “First I ___ because ___. Next I ___. I checked by ___.” Ask a partner to point out any step that needs more evidence.",
    },
  ],
};
const DOMAIN_MATCHERS = [
  ["percent", /percent|%|percentage|markup|discount|\btax\b|\btip\b/i],
  ["surface-area", /surface area|net\b|faces? of (?:a |the )?(?:prism|cube)|wrapping paper/i],
  [
    "statistics",
    /statistics|data set|distribution|measure of center|mean|median|mode|range|outlier|deviation|mad\b|dot plot|box plot|histogram|variability/i,
  ],
  [
    "equation",
    /equation|inequalit|solve for|variable|expression|like terms|distributive|equivalent expression/i,
  ],
  ["ratio", /ratio|rate\b|unit rate|proportion|proportional|per 1|scale factor/i],
  [
    "geometry",
    /area|volume|coordinate|polygon|triangle|rectangle|parallelogram|trapezoid|prism|geometry/i,
  ],
  [
    "number",
    /fraction|decimal|integer|rational number|number line|absolute value|factor|multiple|exponent|divisib|divide|multiply|add|subtract/i,
  ],
];
function itemStrategyText(item) {
  return [item?.stem, item?.title, item?.prompt, item?.instructions, item?.standard]
    .filter(Boolean)
    .join(" ");
}

function configStrategyText(config) {
  return [
    config?.title,
    config?.standard,
    config?.contentObjective,
    config?.launch?.conceptIntro?.keyIdea,
    config?.explore?.instructions,
  ]
    .filter(Boolean)
    .join(" ");
}

function matchDomain(text) {
  return DOMAIN_MATCHERS.find(([, matcher]) => matcher.test(text))?.[0];
}

export function resolveStrategyDomain(config = {}, item = {}) {
  const authored = item.tryAnotherWay?.domain || config.tryAnotherWay?.domain;
  if (authored && STRATEGIES[authored]) return authored;
  // A lesson can include review or bridge questions from another domain. Prefer
  // the current prompt so the alternative is appropriate to this exact problem.
  return (
    matchDomain(itemStrategyText(item)) || matchDomain(configStrategyText(config)) || "general"
  );
}

export function originalStrategyCategory(value) {
  const id = String(value || "").toLowerCase();
  if (/model|draw|visual|diagram|number line|table|manip|concrete/.test(id)) return "visual";
  if (/test|calc|write|equation|compute/.test(id)) return "calculate";
  if (/explain|teach|talk|verbal/.test(id)) return "verbal";
  return null;
}

export function resolveAlternativeStrategies(config = {}, item = {}, originalStrategy) {
  const domain = resolveStrategyDomain(config, item);
  const originalCategory = originalStrategyCategory(originalStrategy);
  const strategies = STRATEGIES[domain] || STRATEGIES.general;
  return {
    domain,
    strategies: strategies.filter((strategy) => strategy.category !== originalCategory),
  };
}

function numbersIn(text) {
  const matches = String(text || "").match(/-?\d+(?:\.\d+)?/g) || [];
  return matches.map(Number).filter(Number.isFinite).slice(0, 10);
}

function equationSides(stem) {
  const sides = String(stem || "").match(/([^?.]{1,40})=([^?.]{1,40})/);
  if (!sides) return null;
  return [sides[1].trim(), sides[2].trim()];
}

// Models are derived only from the problem stem. Correct answers, explanations,
// and choice feedback are intentionally never inputs to this function.
export function strategyModel(strategy, item = {}) {
  const stem = item.stem || item.prompt || item.title || "";
  const values = numbersIn(stem);
  if (strategy.id === "balance-both-sides") {
    const sides = equationSides(stem);
    if (!sides) return null;
    return {
      kind: "tape-diagram",
      title: "Keep both sides equivalent",
      caption: "Choose the same operation for both rows. Finish the algebra yourself.",
      rows: [
        { label: "Left side", parts: [{ value: 1, label: sides[0] }] },
        { label: "Right side", parts: [{ value: 1, label: sides[1] }] },
      ],
    };
  }
  if (strategy.id === "ratio-table" && values.length >= 2) {
    return {
      kind: "tape-diagram",
      title: "Start with the given ratio pair",
      caption:
        "Scale both rows by the same factor. Add the next columns on paper or in your notes.",
      rows: [
        { label: "Quantity 1", parts: [{ value: Math.abs(values[0]) || 1, label: values[0] }] },
        { label: "Quantity 2", parts: [{ value: Math.abs(values[1]) || 1, label: values[1] }] },
      ],
    };
  }
  if (strategy.id === "percent-line") {
    return {
      kind: "tape-diagram",
      title: "100% is the whole",
      caption: "Use the ten equal sections as 10% benchmarks. Locate the needed percent yourself.",
      rows: [
        {
          label: "Percent",
          parts: Array.from({ length: 10 }, (_, index) => ({
            value: 1,
            label: index === 0 ? "10%" : index === 9 ? "100%" : "",
          })),
        },
      ],
    };
  }
  if (strategy.id === "surface-net") {
    return {
      kind: "solid-3d",
      shape: /cube/i.test(stem) ? "cube" : "rectangular-prism",
      label: "Rotate the solid and account for every face before you calculate.",
    };
  }
  if (strategy.id === "data-display" && values.length >= 3) {
    return {
      kind: "bar-chart",
      title: "The data values from this problem",
      caption:
        "Look for the cluster and any value far from it. The display does not choose the statistic for you.",
      bars: values.map((value, index) => ({ label: String(index + 1), value })),
    };
  }
  if (strategy.id === "number-line" && values.length) {
    const low = Math.min(0, ...values);
    const high = Math.max(1, ...values);
    const span = Math.max(1, high - low);
    return {
      kind: "number-line",
      title: "Set useful benchmarks",
      caption: "Add and label the problem’s important points yourself.",
      min: Math.floor(low),
      max: Math.ceil(high),
      step: Math.max(1, Math.ceil(span / 8)),
      points: [],
    };
  }
  return null;
}

let strategyUiSequence = 0;

export function appendTryAnotherWay(
  card,
  { config, item, originalStrategy, storageKey, store } = {},
) {
  const sequence = strategyUiSequence++;
  const panelId = `sg-another-${String(config?.lessonId || "lesson").replace(/[^a-z0-9-]/gi, "-")}-${sequence}`;
  const wrapper = el("div", "sg-another");
  const toggle = el("button", "btn ghost sg-another-toggle", "↗ Try Another Way");
  toggle.type = "button";
  toggle.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", panelId);

  const panel = el("section", "sg-another-panel");
  panel.id = panelId;
  panel.hidden = true;
  panel.setAttribute("aria-label", "Try another way for this problem");
  panel.append(
    el("div", "sg-another-kicker", "Same problem · new path"),
    // Not a heading. This panel repeats once per problem, so as an <h3> it put
    // nine identically-titled entries into the document outline — a screen
    // reader's heading list became "Choose a different strategy" nine times with
    // nothing to tell them apart. The panel already carries an aria-label that
    // names the problem it belongs to, which is the useful landmark; this line
    // is a visible label, so it is styled as one.
    el("p", "sg-another-title", "Choose a different strategy"),
    el(
      "p",
      "sg-another-lede",
      "Pick one path below. You still do the math—this support will not reveal the answer.",
    ),
  );

  const choices = el("div", "sg-another-choices");
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-label", "Alternative strategies");
  const prompt = el("div", "sg-another-prompt");
  prompt.setAttribute("aria-live", "polite");
  prompt.hidden = true;
  const modelHost = el("div", "sg-another-model");
  const notesLabel = document.createElement("label");
  const notes = el("textarea", "sg-ta sg-another-notes");
  notes.id = `${panelId}-notes`;
  notesLabel.htmlFor = notes.id;
  notesLabel.className = "block-lab";
  notesLabel.textContent =
    "Work this way here—show a step, label a model, or rehearse your explanation";
  notes.placeholder = "My first step with this strategy is…";
  notes.hidden = true;
  notesLabel.hidden = true;

  const savedAll = store?.get("tryAnotherWay", {}) || {};
  const saved = savedAll[storageKey] || {};
  if (typeof saved.notes === "string") notes.value = saved.notes;
  const buttons = [];
  let builtForCategory;
  const currentOriginalStrategy = () =>
    originalStrategy?.() || card.querySelector(".sg-strat-btn.active")?.dataset.strat;
  const clearModel = () => {
    modelHost
      .querySelectorAll(".interactive-visual")
      .forEach((host) => host.__ivHandle?.destroy?.());
    modelHost.replaceChildren();
  };
  const select = (strategy, { focusNotes = false } = {}) => {
    buttons.forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.strategy === strategy.id)),
    );
    prompt.hidden = false;
    prompt.innerHTML = `<b>${esc(strategy.label)}:</b> ${esc(strategy.direction)}`;
    clearModel();
    const model = strategyModel(strategy, item);
    const figure = model ? figureBlock(model, { ariaLabel: `${strategy.label} model` }) : null;
    if (figure) modelHost.appendChild(figure);
    notesLabel.hidden = false;
    notes.hidden = false;
    const current = store?.get("tryAnotherWay", {}) || {};
    store?.set("tryAnotherWay", {
      ...current,
      [storageKey]: { ...current[storageKey], strategy: strategy.id, notes: notes.value },
    });
    if (focusNotes) notes.focus();
  };

  const buildChoices = () => {
    const currentCategory = originalStrategyCategory(currentOriginalStrategy()) || "unknown";
    if (builtForCategory === currentCategory && buttons.length) return;
    builtForCategory = currentCategory;
    buttons.length = 0;
    choices.innerHTML = "";
    prompt.hidden = true;
    clearModel();
    notesLabel.hidden = true;
    notes.hidden = true;
    const { strategies } = resolveAlternativeStrategies(config, item, currentOriginalStrategy());
    strategies.forEach((strategy) => {
      const button = el(
        "button",
        "sg-another-choice",
        `<span aria-hidden="true">${strategy.icon}</span><span>${esc(strategy.label)}</span>`,
      );
      button.type = "button";
      button.dataset.strategy = strategy.id;
      button.setAttribute("aria-pressed", "false");
      button.onclick = () => select(strategy, { focusNotes: true });
      buttons.push(button);
      choices.appendChild(button);
    });
    if (saved.strategy) {
      const strategy = strategies.find((candidate) => candidate.id === saved.strategy);
      if (strategy) select(strategy);
    }
  };

  notes.addEventListener("input", () => {
    const current = store?.get("tryAnotherWay", {}) || {};
    store?.set("tryAnotherWay", {
      ...current,
      [storageKey]: { ...current[storageKey], notes: notes.value },
    });
  });

  toggle.onclick = () => {
    const opening = panel.hidden;
    if (opening) buildChoices();
    panel.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
    toggle.textContent = opening ? "↓ Hide Another Way" : "↗ Try Another Way";
    if (opening) buttons[0]?.focus();
  };

  panel.append(choices, prompt, modelHost, notesLabel, notes);
  wrapper.append(toggle, panel);
  card.appendChild(wrapper);

  return () => {
    buildChoices();
    toggle.hidden = false;
  };
}
