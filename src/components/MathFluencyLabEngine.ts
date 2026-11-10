export type LabState =
  | "UNINITIALIZED"
  | "PRESENTATION"
  | "EVALUATING"
  | "SCAFFOLD_L1_PROMPT"
  | "SCAFFOLD_L2_BREAKDOWN"
  | "RESOLVED_EXPLANATION"
  | "MASTERY_COMMITTED";
export interface MisconceptionRule {
  id: string;
  tag:
    | "INVERTED_RATIO"
    | "ADDITIVE_THINKING"
    | "SIGN_ERROR"
    | "UNIT_MISMATCH"
    | "INCORRECT_PARTITION";
  detect: (studentInput: string, context: Record<string, unknown>) => boolean;
  conceptualAnchor: string;
  remediationStep: {
    scaffoldPrompt: string;
    targetSubQuestion: string;
    expectedSubValue: string;
    manipulativeActionHint: string;
  };
}
export interface ExerciseSchema {
  id: string;
  standard: string;
  tier: 1 | 2 | 3 | 4;
  prompt: string;
  modelComponent: "interactive-ratio-tape" | "interactive-double-number-line";
  modelConfig: {
    trackALabel: string;
    trackAUnits: number;
    trackBLabel: string;
    trackBUnits: number;
    unitVal: number;
  };
  correctAnswer: string;
  misconceptions: MisconceptionRule[];
  fullExplanation: {
    keyRule: string;
    stepByStep: Array<{ stepNumber: number; instruction: string; mathExpression: string }>;
    distractorAnalysis: string;
  };
}
const escapeHTML = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
const positive = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 24) : fallback;
};
const formatMath = (value: unknown) =>
  escapeHTML(value).replace(
    /(?<![\w])(-?\d+)\s*\/\s*(\d+)(?![\w])/g,
    (_, n, d) =>
      `<span class="math-fraction" role="math" aria-label="${n} over ${d}"><span class="math-fraction-num">${n}</span><span class="math-fraction-den">${d}</span></span>`,
  );

export const INJECTED_MATH_STYLES = `
  :host { color-scheme: dark; font: 16px/1.5 system-ui,sans-serif; color:#f8fafc; }
  *,*::before,*::after { box-sizing:border-box; }
  button,input { font:inherit; }
  button { min-height:44px; min-width:44px; cursor:pointer; border-radius:8px; border:1px solid #7dd3fc; background:#0369a1; color:white; padding:8px 16px; }
  button:hover { background:#075985; }
  :focus-visible { outline:3px solid #fbbf24; outline-offset:3px; }
  .math-fraction { display:inline-flex; flex-direction:column; vertical-align:middle; text-align:center; line-height:1.1; padding:0 3px; }
  .math-fraction-num { border-bottom:2px solid currentColor; padding:0 2px 2px; }
  .math-fraction-den { padding-top:2px; }
  .card { background:#182234; border:1px solid #64748b; border-radius:12px; padding:20px; margin:16px 0; }
  .hint { border-left:4px solid #fbbf24; background:#45340e; padding:12px; }
  .row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:16px 0; }
  input { min-height:44px; min-width:140px; max-width:100%; padding:8px 12px; border-radius:8px; border:2px solid #94a3b8; background:#0f172a; color:white; }
  .muted { color:#cbd5e1; }
  .math-line { color:#86efac; font-size:1.1rem; }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important; } }
`;

export class InteractiveRatioTape extends HTMLElement {
  protected root: ShadowRoot;
  public selectedA: number;
  public selectedB: number;
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.selectedA = 0;
    this.selectedB = 0;
  }
  static get observedAttributes() {
    return [
      "track-a-label",
      "track-a-units",
      "track-b-label",
      "track-b-units",
      "unit-val",
      "interactive",
    ];
  }
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }
  get config() {
    return {
      a: this.getAttribute("track-a-label") || "Quantity A",
      b: this.getAttribute("track-b-label") || "Quantity B",
      aUnits: positive(this.getAttribute("track-a-units"), 3),
      bUnits: positive(this.getAttribute("track-b-units"), 2),
      unit: positive(this.getAttribute("unit-val"), 1),
      interactive: this.getAttribute("interactive") !== "false",
    };
  }
  getModelValues() {
    const { unit } = this.config;
    return {
      selectedA: this.selectedA,
      selectedB: this.selectedB,
      totalA: this.selectedA * unit,
      totalB: this.selectedB * unit,
    };
  }
  highlightError(track: "A" | "B") {
    const el = this.root.getElementById(`track-${track.toLowerCase()}`);
    if (!el) return;
    el.classList.add("error-pulse");
    setTimeout(() => el.classList.remove("error-pulse"), 800);
  }
  select(track: "A" | "B", count: number) {
    const c = this.config;
    const max = track === "A" ? c.aUnits : c.bUnits;
    if (!c.interactive) return;
    const value = Math.max(0, Math.min(max, count));
    if (track === "A") this.selectedA = value;
    else this.selectedB = value;
    const isLine = this.tagName.toLowerCase() === "interactive-double-number-line";
    this.root.querySelectorAll<HTMLButtonElement>(`[data-track="${track}"]`).forEach((button) => {
      const index = Number(button.dataset.index);
      const selected = isLine ? index <= value : index < value;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(isLine ? index === value : selected));
    });
    const status = this.root.querySelector("[aria-live]");
    if (status)
      status.textContent = isLine
        ? `Matched ticks: ${this.selectedA * c.unit} and ${this.selectedB * c.unit}`
        : `Modeled ratio: ${this.selectedA} to ${this.selectedB}`;
    this.dispatchEvent(
      new CustomEvent("ratio-model-change", {
        detail: this.getModelValues(),
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    const c = this.config;
    const track = (name: "A" | "B", label: string, units: number, selected: number) =>
      `<div class="label">${escapeHTML(label)} <span>Selected: ${selected * c.unit}</span></div><div class="track" id="track-${name.toLowerCase()}" role="group" aria-label="${escapeHTML(label)}">${Array.from({ length: units }, (_, i) => `<button type="button" data-track="${name}" data-index="${i}" aria-pressed="${i < selected}" aria-label="${escapeHTML(label)}, segment ${i + 1} of ${units}, value ${c.unit}" ${c.interactive ? "" : "disabled"} class="segment ${i < selected ? "selected" : ""}">${c.unit}</button>`).join("")}</div>`;
    this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}:host{display:block}.wrap{padding:16px;background:#182234;border:1px solid #64748b;border-radius:12px}.label{display:flex;justify-content:space-between;gap:12px;margin:8px 0;font-weight:600}.track{display:flex;overflow-x:auto;gap:3px;padding:3px;border:2px solid #64748b;border-radius:8px}.segment{flex:1;min-width:44px;min-height:44px;padding:4px;background:#334155;border:1px solid #94a3b8}.segment.selected{background:#0369a1}.segment:disabled{cursor:default;opacity:1}.error-pulse{border-color:#fbbf24;box-shadow:0 0 0 3px #fbbf24}@media (prefers-reduced-motion:no-preference){.error-pulse{animation:pulse .8s ease-in-out}@keyframes pulse{50%{box-shadow:0 0 0 6px #fbbf24}}}</style><div class="wrap">${track("A", c.a, c.aUnits, this.selectedA)}${track("B", c.b, c.bUnits, this.selectedB)}<p aria-live="polite">Modeled ratio: ${this.selectedA} to ${this.selectedB}</p></div>`;
    this.root
      .querySelectorAll<HTMLButtonElement>(".segment")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this.select(button.dataset.track as "A" | "B", Number(button.dataset.index) + 1),
        ),
      );
  }
}
if (!customElements.get("interactive-ratio-tape"))
  customElements.define("interactive-ratio-tape", InteractiveRatioTape);
export class InteractiveDoubleNumberLine extends InteractiveRatioTape {
  render() {
    const c = this.config;
    const line = (track: "A" | "B", label: string, units: number, selected: number) =>
      `<div class="line-label">${escapeHTML(label)}</div><div class="line" id="track-${track.toLowerCase()}" role="group" aria-label="${escapeHTML(label)} number line">${Array.from({ length: units + 1 }, (_, i) => `<button type="button" class="tick ${i <= selected ? "selected" : ""}" data-track="${track}" data-index="${i}" aria-pressed="${i === selected}" aria-label="${escapeHTML(label)}, ${i * c.unit}, tick ${i} of ${units}" ${c.interactive ? "" : "disabled"}>${i * c.unit}</button>`).join("")}</div>`;
    this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}:host{display:block}.wrap{background:#182234;border:1px solid #64748b;border-radius:12px;padding:16px}.line-label{font-weight:700;margin:10px 0}.line{display:flex;overflow-x:auto;gap:2px;border-top:3px solid #7dd3fc;padding-top:8px}.tick{flex:1;min-width:44px;min-height:44px;padding:3px;background:#334155;border:1px solid #94a3b8}.tick.selected{background:#0369a1}.tick:disabled{opacity:1;cursor:default}.error-pulse{box-shadow:0 0 0 3px #fbbf24}</style><div class="wrap">${line("A", c.a, c.aUnits, this.selectedA)}${line("B", c.b, c.bUnits, this.selectedB)}<p aria-live="polite">Matched ticks: ${this.selectedA * c.unit} and ${this.selectedB * c.unit}</p></div>`;
    this.root
      .querySelectorAll<HTMLButtonElement>(".tick")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this.select(button.dataset.track as "A" | "B", Number(button.dataset.index)),
        ),
      );
  }
}
if (!customElements.get("interactive-double-number-line"))
  customElements.define("interactive-double-number-line", InteractiveDoubleNumberLine);

const transitions: Record<LabState, LabState[]> = {
  UNINITIALIZED: ["PRESENTATION"],
  PRESENTATION: ["EVALUATING"],
  EVALUATING: ["SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN", "MASTERY_COMMITTED"],
  SCAFFOLD_L1_PROMPT: ["EVALUATING"],
  SCAFFOLD_L2_BREAKDOWN: ["PRESENTATION", "RESOLVED_EXPLANATION"],
  RESOLVED_EXPLANATION: ["PRESENTATION"],
  MASTERY_COMMITTED: ["PRESENTATION"],
};
export class MathFluencyLabEngine {
  private host: HTMLElement;
  private root: ShadowRoot;
  private state: LabState;
  private attempts: number;
  private sibling: number;
  private studentInput: string;
  private distractorInput: string;
  private subValue: string;
  private modelValues: { selectedA: number; selectedB: number };
  private exercise!: ExerciseSchema;
  private detected?: MisconceptionRule;
  constructor(hostContainerId: string) {
    const host = document.getElementById(hostContainerId);
    if (!host) throw Error(`Container #${hostContainerId} not found`);
    this.host = host;
    this.root = host.attachShadow({ mode: "open" });
    this.state = "UNINITIALIZED";
    this.attempts = 0;
    this.sibling = 0;
    this.studentInput = "";
    this.distractorInput = "";
    this.modelValues = { selectedA: 0, selectedB: 0 };
    this.subValue = "";
  }
  loadExercise(schema: ExerciseSchema) {
    if (
      !schema ||
      !["interactive-ratio-tape", "interactive-double-number-line"].includes(
        schema.modelComponent,
      ) ||
      !Number.isFinite(Number(schema.correctAnswer)) ||
      !schema.modelConfig ||
      ![schema.modelConfig.trackAUnits, schema.modelConfig.trackBUnits].every(
        (n) => Number.isInteger(n) && n >= 1 && n <= 24,
      ) ||
      !Number.isFinite(schema.modelConfig.unitVal) ||
      schema.modelConfig.unitVal <= 0
    )
      throw Error("Invalid exercise");
    this.exercise = schema;
    this.attempts = 0;
    this.studentInput = "";
    this.detected = undefined;
    this.distractorInput = "";
    this.modelValues = { selectedA: 0, selectedB: 0 };
    this.subValue = "";
    this.transition("PRESENTATION");
  }
  transition(next: LabState) {
    if (!transitions[this.state]?.includes(next))
      throw Error(`Invalid lab transition: ${this.state} to ${next}`);
    this.state = next;
    if (next === "MASTERY_COMMITTED") this.commitMastery();
    this.render();
    if (
      next === "SCAFFOLD_L2_BREAKDOWN" ||
      next === "RESOLVED_EXPLANATION" ||
      next === "MASTERY_COMMITTED"
    ) {
      const heading =
        this.root.querySelector<HTMLElement>("#content h3") ||
        this.root.querySelector<HTMLElement>("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
    this.host.dispatchEvent(
      new CustomEvent("fluency-state-change", {
        detail: { state: next, exerciseId: this.exercise.id, attempts: this.attempts },
      }),
    );
  }
  commitMastery() {
    const record = {
      exerciseId: this.exercise.id,
      attempts: this.attempts + 1,
      independent: this.attempts === 0,
      completedAt: new Date().toISOString(),
    };
    try {
      const previous = JSON.parse(localStorage.getItem("ewl-fluency-publisher-mastery-v1") || "[]");
      const records = Array.isArray(previous) ? previous.slice(-99) : [];
      records.push(record);
      localStorage.setItem("ewl-fluency-publisher-mastery-v1", JSON.stringify(records));
    } catch {
      /* Practice remains available if browser storage is blocked. */
    }
    this.host.dispatchEvent(new CustomEvent("fluency-mastery-committed", { detail: record }));
  }
  submit(raw: string) {
    if (!["PRESENTATION", "SCAFFOLD_L1_PROMPT"].includes(this.state)) return;
    this.studentInput = String(raw).trim();
    if (!this.studentInput) return;
    this.transition("EVALUATING");
    if (Number(this.studentInput) === Number(this.exercise.correctAnswer)) {
      this.transition("MASTERY_COMMITTED");
      return;
    }
    this.attempts++;
    const detected = this.exercise.misconceptions.find((rule) =>
      rule.detect(this.studentInput, {
        expected: this.exercise.correctAnswer,
        modelConfig: this.exercise.modelConfig,
      }),
    );
    if (detected) {
      this.detected = detected;
      this.distractorInput = this.studentInput;
    }
    if (this.attempts > 1) this.modelValues = { selectedA: 0, selectedB: 0 };
    this.transition(
      this.attempts === 1
        ? "SCAFFOLD_L1_PROMPT"
        : this.attempts === 2
          ? "SCAFFOLD_L2_BREAKDOWN"
          : "RESOLVED_EXPLANATION",
    );
    if (this.state === "SCAFFOLD_L1_PROMPT")
      this.root
        .querySelector<InteractiveRatioTape>(
          "interactive-ratio-tape,interactive-double-number-line",
        )
        ?.highlightError(this.detected?.tag === "INVERTED_RATIO" ? "B" : "A");
  }
  model() {
    const c = this.exercise.modelConfig;
    const el = document.createElement(this.exercise.modelComponent) as InteractiveRatioTape;
    for (const [name, value] of Object.entries({
      "track-a-label": c.trackALabel,
      "track-a-units": c.trackAUnits,
      "track-b-label": c.trackBLabel,
      "track-b-units": c.trackBUnits,
      "unit-val": c.unitVal,
      interactive: "true",
    }))
      el.setAttribute(name, String(value));
    el.selectedA = this.modelValues.selectedA;
    el.selectedB = this.modelValues.selectedB;
    el.addEventListener("ratio-model-change", (event) => {
      this.modelValues = (event as CustomEvent).detail;
      this.updateSandbox();
    });
    return el;
  }
  updateSandbox() {
    if (this.state !== "SCAFFOLD_L2_BREAKDOWN") return;
    const c = this.exercise.modelConfig;
    const expected = this.detected?.remediationStep.expectedSubValue || String(c.unitVal);
    const ready =
      this.modelValues.selectedA === c.trackAUnits &&
      this.modelValues.selectedB === c.trackBUnits &&
      Number(this.subValue) === Number(expected);
    const button = this.root.getElementById("sandbox-next") as HTMLButtonElement | null;
    if (button) button.disabled = !ready;
    const retry = this.root.getElementById("sandbox-retry") as HTMLButtonElement | null;
    if (retry) retry.disabled = !ready;
    const status = this.root.getElementById("sandbox-status");
    if (status)
      status.textContent = ready
        ? "Both quantities are modeled. Continue to the explanation."
        : "Select every segment on both tracks and enter the value of one segment.";
  }
  render() {
    const e = this.exercise;
    this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}</style><div class="card" role="region" aria-label="Math Fluency Lab"><p class="muted">Standard ${escapeHTML(e.standard)} · Tier ${e.tier}</p><h2>${formatMath(e.prompt)}</h2><div id="content"></div><p id="announcement" role="status" aria-live="polite"></p></div>`;
    const content = this.root.getElementById("content")!;
    if (["PRESENTATION", "SCAFFOLD_L1_PROMPT"].includes(this.state)) {
      content.append(this.model());
      if (this.state === "SCAFFOLD_L1_PROMPT") {
        const hint = document.createElement("p");
        hint.className = "hint";
        hint.id = "conceptual-hint";
        hint.setAttribute("role", "status");
        hint.textContent =
          this.detected?.conceptualAnchor ||
          "Check the equal segment value and the order of the quantities.";
        content.append(hint);
      }
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<label for="answer">Your answer</label><input id="answer" inputmode="decimal" autocomplete="off" aria-describedby="answer-help${this.state === "SCAFFOLD_L1_PROMPT" ? " conceptual-hint" : ""}" value="${escapeHTML(this.studentInput)}"><button id="check" type="button">Check answer</button><span id="answer-help" class="muted">Enter a number.</span>`;
      content.append(row);
      row.querySelector<HTMLButtonElement>("#check")!.onclick = () =>
        this.submit(row.querySelector<HTMLInputElement>("#answer")!.value);
      row.querySelector<HTMLInputElement>("#answer")!.onkeydown = (event) => {
        if (event.key === "Enter") this.submit((event.currentTarget as HTMLInputElement).value);
      };
      if (this.state === "SCAFFOLD_L1_PROMPT")
        row.querySelector<HTMLInputElement>("#answer")!.focus();
    } else if (this.state === "SCAFFOLD_L2_BREAKDOWN") {
      const r = this.detected?.remediationStep;
      const p = document.createElement("h3");
      p.className = "hint";
      p.id = "scaffold-heading";
      p.textContent = r?.scaffoldPrompt || "Build both quantities using equal-value segments.";
      content.append(p, this.model());
      const sub = document.createElement("div");
      sub.className = "row";
      sub.innerHTML = `<label for="sub-answer">${escapeHTML(r?.targetSubQuestion || "Value of one segment")}</label><input id="sub-answer" inputmode="decimal" autocomplete="off" aria-describedby="sandbox-status">`;
      content.append(sub);
      sub.querySelector<HTMLInputElement>("input")!.addEventListener("input", (event) => {
        this.subValue = (event.currentTarget as HTMLInputElement).value;
        this.updateSandbox();
      });
      const status = document.createElement("p");
      status.id = "sandbox-status";
      status.setAttribute("role", "status");
      content.append(status);
      const button = document.createElement("button");
      button.id = "sandbox-next";
      button.textContent = "View complete step-by-step breakdown";
      button.disabled = true;
      button.onclick = () => this.transition("RESOLVED_EXPLANATION");
      content.append(button);
      const retry = document.createElement("button");
      retry.id = "sandbox-retry";
      retry.textContent = "Try the original question again";
      retry.disabled = true;
      retry.onclick = () => this.transition("PRESENTATION");
      content.append(retry);
      this.updateSandbox();
    } else if (this.state === "RESOLVED_EXPLANATION") {
      content.innerHTML = `<h3>Core conceptual rule</h3><p>${formatMath(e.fullExplanation.keyRule)}</p><h3>Algebra and model, step by step</h3><div id="steps"></div><h3>Why that answer was tempting</h3><p>${formatMath(this.detected?.tag === "ADDITIVE_THINKING" ? e.fullExplanation.distractorAnalysis : this.detected?.tag === "INVERTED_RATIO" ? `An answer of ${this.distractorInput} treats ${e.modelConfig.trackAUnits} ${e.modelConfig.trackALabel.toLowerCase()} as the unknown quantity's parts. The ${e.modelConfig.trackBUnits} ${e.modelConfig.trackBLabel.toLowerCase()} parts must each receive the same segment value.` : e.fullExplanation.distractorAnalysis)}</p><div class="row"><button id="sibling" type="button">Try an isomorphic problem</button></div>`;
      const steps = content.querySelector("#steps")!;
      e.fullExplanation.stepByStep.forEach((step) => {
        const item = document.createElement("div");
        item.className = "card";
        item.innerHTML = `<strong>Step ${step.stepNumber}</strong><p>${formatMath(step.instruction)}</p><p class="math-line">${formatMath(step.mathExpression)}</p>`;
        const visual = this.model();
        visual.setAttribute("interactive", "false");
        visual.selectedA = e.modelConfig.trackAUnits;
        visual.selectedB = step.stepNumber === 1 ? 0 : e.modelConfig.trackBUnits;
        item.append(visual);
        steps.append(item);
      });
      content.querySelector<HTMLButtonElement>("#sibling")!.onclick = () =>
        this.loadExercise(makeSibling(e, ++this.sibling));
    } else if (this.state === "MASTERY_COMMITTED") {
      content.innerHTML = `<h3>Practice complete</h3><p>You solved this problem in ${this.attempts + 1} ${this.attempts === 0 ? "attempt" : "attempts"}.</p><button id="next" type="button">Try another</button>`;
      content.querySelector<HTMLButtonElement>("#next")!.onclick = () =>
        this.loadExercise(makeSibling(e, ++this.sibling));
    }
    if (this.state === "EVALUATING")
      this.root.getElementById("announcement")!.textContent = "Checking answer";
  }
}

export function makeSibling(
  source: ExerciseSchema & { siblingBaseUnit?: number },
  index: number,
): ExerciseSchema & { siblingBaseUnit: number } {
  const baseUnit = source.siblingBaseUnit || source.modelConfig.unitVal;
  const c = source.modelConfig;
  const unit = baseUnit * (index + 1);
  const known = c.trackAUnits * unit;
  const answer = c.trackBUnits * unit;
  const aLabel = c.trackALabel.toLowerCase();
  const bLabel = c.trackBLabel.toLowerCase();
  const additiveDistractor = c.trackBUnits + (known - c.trackAUnits);
  const invertedDistractor = (known * c.trackAUnits) / c.trackBUnits;
  return {
    ...source,
    id: `${source.id.split("_S")[0]}_S${index}`,
    siblingBaseUnit: baseUnit,
    modelComponent: index % 2 ? "interactive-double-number-line" : "interactive-ratio-tape",
    prompt: `For every ${c.trackAUnits} ${aLabel}, there are ${c.trackBUnits} ${bLabel}. If there are ${known} ${aLabel}, how many ${bLabel} are needed?`,
    modelConfig: { ...c, unitVal: unit },
    correctAnswer: String(answer),
    misconceptions: source.misconceptions.map((rule) => ({
      ...rule,
      detect: (input) =>
        Number(input) ===
        (rule.tag === "ADDITIVE_THINKING" ? additiveDistractor : invertedDistractor),
      remediationStep: { ...rule.remediationStep, expectedSubValue: String(unit) },
    })),
    fullExplanation: {
      ...source.fullExplanation,
      stepByStep: [
        {
          stepNumber: 1,
          instruction: `Divide the ${aLabel} total by its number of segments.`,
          mathExpression: `${known} ÷ ${c.trackAUnits} = ${unit}`,
        },
        {
          stepNumber: 2,
          instruction: `Multiply the segment value by the number of ${bLabel} segments.`,
          mathExpression: `${c.trackBUnits} × ${unit} = ${answer}`,
        },
      ],
      distractorAnalysis: `Adding the increase from ${c.trackAUnits} to ${known} to the second quantity gives ${additiveDistractor}. Both quantities must scale by the same factor.`,
    },
  };
}

export function createRatioExercise(config: {
  id: string;
  standard: string;
  tier: 1 | 2 | 3 | 4;
  trackALabel: string;
  trackBLabel: string;
  trackAUnits: number;
  trackBUnits: number;
  unitVal: number;
  modelComponent?: ExerciseSchema["modelComponent"];
}): ExerciseSchema {
  const { id, standard, tier, trackALabel, trackBLabel, trackAUnits, trackBUnits, unitVal } =
    config;
  if (
    ![trackAUnits, trackBUnits].every((n) => Number.isInteger(n) && n >= 1 && n <= 24) ||
    !Number.isFinite(unitVal) ||
    unitVal <= 0
  ) {
    throw new Error("Invalid ratio exercise quantities");
  }
  const known = trackAUnits * unitVal;
  const answer = trackBUnits * unitVal;
  const additive = trackBUnits + known - trackAUnits;
  const inverted = (known * trackAUnits) / trackBUnits;
  return {
    id,
    standard,
    tier,
    prompt: `For every ${trackAUnits} ${trackALabel.toLowerCase()}, there are ${trackBUnits} ${trackBLabel.toLowerCase()}. If there are ${known} ${trackALabel.toLowerCase()}, how many ${trackBLabel.toLowerCase()} are needed?`,
    modelComponent: config.modelComponent || "interactive-ratio-tape",
    modelConfig: { trackALabel, trackAUnits, trackBLabel, trackBUnits, unitVal },
    correctAnswer: String(answer),
    misconceptions: [
      {
        id: "ADDITIVE_THINKING",
        tag: "ADDITIVE_THINKING",
        detect: (input) => Number(input) === additive && additive !== answer,
        conceptualAnchor: "Equivalent ratios multiply both quantities by the same scale factor.",
        remediationStep: {
          scaffoldPrompt: `Build ${trackAUnits} equal parts for ${trackALabel.toLowerCase()}, then ${trackBUnits} for ${trackBLabel.toLowerCase()}.`,
          targetSubQuestion: "Value of one segment",
          expectedSubValue: String(unitVal),
          manipulativeActionHint: "Select every segment on both tracks.",
        },
      },
      {
        id: "INVERTED_RATIO",
        tag: "INVERTED_RATIO",
        detect: (input) => Number(input) === inverted && inverted !== answer,
        conceptualAnchor: "Keep the two quantities in the order named in the problem.",
        remediationStep: {
          scaffoldPrompt: `Compare ${trackAUnits} parts with ${trackBUnits} parts.`,
          targetSubQuestion: "Value of one segment",
          expectedSubValue: String(unitVal),
          manipulativeActionHint: "Select every segment on both tracks.",
        },
      },
    ],
    fullExplanation: {
      keyRule: "Equivalent ratios use one constant segment value for both quantities.",
      stepByStep: [
        {
          stepNumber: 1,
          instruction: `Divide the known ${trackALabel.toLowerCase()} total by its number of segments.`,
          mathExpression: `${known} ÷ ${trackAUnits} = ${unitVal}`,
        },
        {
          stepNumber: 2,
          instruction: `Multiply by the number of ${trackBLabel.toLowerCase()} segments.`,
          mathExpression: `${trackBUnits} × ${unitVal} = ${answer}`,
        },
      ],
      distractorAnalysis: `Adding the increase in the first quantity gives ${additive}. Each quantity must instead be scaled by the same factor.`,
    },
  };
}

export function adaptProportionItem(item: {
  question: string;
  answers: string[];
  skill?: { standard?: string };
  tier?: number;
}): ExerciseSchema | null {
  const match = item.question.match(
    /^Solve the proportion:\s*(\d+)\s*\/\s*(\d+)\s*=\s*(\d+)\s*\/\s*x\.?$/i,
  );
  if (!match || !item.answers?.length) return null;
  const [, first, second, scaled] = match;
  const a = Number(first);
  const b = Number(second);
  const c = Number(scaled);
  const unitVal = c / a;
  if (!Number.isInteger(unitVal) || unitVal <= 0 || b * unitVal !== Number(item.answers[0]))
    return null;
  const tier = Math.max(1, Math.min(4, Number(item.tier) || 2)) as 1 | 2 | 3 | 4;
  const schema = createRatioExercise({
    id: `proportion-${a}-${b}-${c}`,
    standard: item.skill?.standard || "7.RP.A.2",
    tier,
    trackALabel: "first quantity",
    trackBLabel: "second quantity",
    trackAUnits: a,
    trackBUnits: b,
    unitVal,
    modelComponent: "interactive-double-number-line",
  });
  return { ...schema, prompt: item.question, correctAnswer: item.answers[0] };
}

export const SEED_EXERCISE: ExerciseSchema = {
  id: "6.RP.A.3_RATIO_TAPE_01",
  standard: "6.RP.A.3",
  tier: 2,
  prompt:
    "A recipe uses 3 cups of flour for every 2 teaspoons of vanilla. If you use 12 cups of flour, how many teaspoons of vanilla are required?",
  modelComponent: "interactive-ratio-tape",
  modelConfig: {
    trackALabel: "Cups of Flour",
    trackAUnits: 3,
    trackBLabel: "Teaspoons of Vanilla",
    trackBUnits: 2,
    unitVal: 4,
  },
  correctAnswer: "8",
  misconceptions: [
    {
      id: "ADDITIVE_TRAP",
      tag: "ADDITIVE_THINKING",
      detect: (input) => input === "11",
      conceptualAnchor:
        "Ratios grow by multiplication through a constant scale factor, not addition.",
      remediationStep: {
        scaffoldPrompt:
          "Find the factor multiplied by 3 to reach 12. Select all three flour segments, then both vanilla segments.",
        targetSubQuestion: "Scale factor per block",
        expectedSubValue: "4",
        manipulativeActionHint: "Partition 12 evenly into the 3 flour segments.",
      },
    },
    {
      id: "INVERTED_RATIO",
      tag: "INVERTED_RATIO",
      detect: (input) => input === "18",
      conceptualAnchor: "Keep the flour and vanilla quantities in their original order.",
      remediationStep: {
        scaffoldPrompt: "Flour has 3 parts; vanilla has 2 parts. Build both tracks.",
        targetSubQuestion: "Unit value",
        expectedSubValue: "4",
        manipulativeActionHint: "Select the vanilla segments.",
      },
    },
  ],
  fullExplanation: {
    keyRule: "Equivalent ratios use the same scale factor for both quantities.",
    stepByStep: [
      {
        stepNumber: 1,
        instruction: "Find the value of one segment from the flour total.",
        mathExpression: "12 ÷ 3 = 4",
      },
      {
        stepNumber: 2,
        instruction: "Use that value for the two vanilla segments.",
        mathExpression: "2 × 4 = 8",
      },
    ],
    distractorAnalysis:
      "An answer of 11 adds the flour increase to vanilla. Equivalent ratios scale both quantities by multiplication.",
  },
};
