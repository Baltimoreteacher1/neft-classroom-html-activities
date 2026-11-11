const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const positive = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 24) : fallback;
};
const positiveValue = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};
const displayNumber = (value) => String(Number(value.toFixed(6)));
const percentParts = (percent) => {
    let divisor = percent;
    let remainder = 100;
    while (remainder !== 0)
        [divisor, remainder] = [remainder, divisor % remainder];
    return { part: percent / divisor, whole: 100 / divisor };
};
const formatMath = (value) => escapeHTML(value).replace(/(?<![\w])(-?\d+|[a-zA-Z])\s*\/\s*(\d+|[a-zA-Z])(?![\w])/g, (_, n, d) => `<span class="math-fraction" role="math" aria-label="${n} over ${d}"><span class="math-fraction-num">${n}</span><span class="math-fraction-den">${d}</span></span>`);
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
const HTMLElementBase = typeof HTMLElement === "undefined"
    ? class {
    }
    : HTMLElement;
export class InteractiveRatioTape extends HTMLElementBase {
    root;
    selectedA;
    selectedB;
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
        if (this.isConnected)
            this.render();
    }
    get config() {
        return {
            a: this.getAttribute("track-a-label") || "Quantity A",
            b: this.getAttribute("track-b-label") || "Quantity B",
            aUnits: positive(this.getAttribute("track-a-units"), 3),
            bUnits: positive(this.getAttribute("track-b-units"), 2),
            unit: positiveValue(this.getAttribute("unit-val"), 1),
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
    highlightError(track) {
        const el = this.root.getElementById(`track-${track.toLowerCase()}`);
        if (!el)
            return;
        el.classList.add("error-pulse");
        setTimeout(() => el.classList.remove("error-pulse"), 800);
    }
    select(track, count) {
        const c = this.config;
        const max = track === "A" ? c.aUnits : c.bUnits;
        if (!c.interactive)
            return;
        const value = Math.max(0, Math.min(max, count));
        if (track === "A")
            this.selectedA = value;
        else
            this.selectedB = value;
        const isLine = this.tagName.toLowerCase() === "interactive-double-number-line";
        this.root.querySelectorAll(`[data-track="${track}"]`).forEach((button) => {
            const index = Number(button.dataset.index);
            const selected = isLine ? index <= value : index < value;
            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(isLine ? index === value : selected));
        });
        const status = this.root.querySelector("[aria-live]");
        if (status)
            status.textContent = isLine
                ? `Matched ticks: ${displayNumber(this.selectedA * c.unit)} and ${displayNumber(this.selectedB * c.unit)}`
                : `Modeled ratio: ${this.selectedA} to ${this.selectedB}`;
        this.dispatchEvent(new CustomEvent("ratio-model-change", {
            detail: this.getModelValues(),
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        const c = this.config;
        const track = (name, label, units, selected) => `<div class="label">${escapeHTML(label)} <span>Selected: ${displayNumber(selected * c.unit)}</span></div><div class="track" id="track-${name.toLowerCase()}" role="group" aria-label="${escapeHTML(label)}">${Array.from({ length: units }, (_, i) => `<button type="button" data-track="${name}" data-index="${i}" aria-pressed="${i < selected}" aria-label="${escapeHTML(label)}, segment ${i + 1} of ${units}, value ${displayNumber(c.unit)}" ${c.interactive ? "" : "disabled"} class="segment ${i < selected ? "selected" : ""}">${displayNumber(c.unit)}</button>`).join("")}</div>`;
        this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}:host{display:block}.wrap{padding:16px;background:#182234;border:1px solid #64748b;border-radius:12px}.label{display:flex;justify-content:space-between;gap:12px;margin:8px 0;font-weight:600}.track{display:flex;overflow-x:auto;gap:3px;padding:3px;border:2px solid #64748b;border-radius:8px}.segment{flex:1;min-width:44px;min-height:44px;padding:4px;background:#334155;border:1px solid #94a3b8}.segment.selected{background:#0369a1}.segment:disabled{cursor:default;opacity:1}.error-pulse{border-color:#fbbf24;box-shadow:0 0 0 3px #fbbf24}@media (prefers-reduced-motion:no-preference){.error-pulse{animation:pulse .8s ease-in-out}@keyframes pulse{50%{box-shadow:0 0 0 6px #fbbf24}}}</style><div class="wrap">${track("A", c.a, c.aUnits, this.selectedA)}${track("B", c.b, c.bUnits, this.selectedB)}<p aria-live="polite">Modeled ratio: ${this.selectedA} to ${this.selectedB}</p></div>`;
        this.root
            .querySelectorAll(".segment")
            .forEach((button) => button.addEventListener("click", () => this.select(button.dataset.track, Number(button.dataset.index) + 1)));
    }
}
if (typeof customElements !== "undefined" && !customElements.get("interactive-ratio-tape"))
    customElements.define("interactive-ratio-tape", InteractiveRatioTape);
export class InteractiveDoubleNumberLine extends InteractiveRatioTape {
    render() {
        const c = this.config;
        const line = (track, label, units, selected) => `<div class="line-label">${escapeHTML(label)}</div><div class="line" id="track-${track.toLowerCase()}" role="group" aria-label="${escapeHTML(label)} number line">${Array.from({ length: units + 1 }, (_, i) => `<button type="button" class="tick ${i <= selected ? "selected" : ""}" data-track="${track}" data-index="${i}" aria-pressed="${i === selected}" aria-label="${escapeHTML(label)}, ${displayNumber(i * c.unit)}, tick ${i} of ${units}" ${c.interactive ? "" : "disabled"}>${displayNumber(i * c.unit)}</button>`).join("")}</div>`;
        this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}:host{display:block}.wrap{background:#182234;border:1px solid #64748b;border-radius:12px;padding:16px}.line-label{font-weight:700;margin:10px 0}.line{display:flex;overflow-x:auto;gap:2px;border-top:3px solid #7dd3fc;padding-top:8px}.tick{flex:1;min-width:44px;min-height:44px;padding:3px;background:#334155;border:1px solid #94a3b8}.tick.selected{background:#0369a1}.tick:disabled{opacity:1;cursor:default}.error-pulse{box-shadow:0 0 0 3px #fbbf24}</style><div class="wrap">${line("A", c.a, c.aUnits, this.selectedA)}${line("B", c.b, c.bUnits, this.selectedB)}<p aria-live="polite">Matched ticks: ${displayNumber(this.selectedA * c.unit)} and ${displayNumber(this.selectedB * c.unit)}</p></div>`;
        this.root
            .querySelectorAll(".tick")
            .forEach((button) => button.addEventListener("click", () => this.select(button.dataset.track, Number(button.dataset.index))));
    }
}
if (typeof customElements !== "undefined" && !customElements.get("interactive-double-number-line"))
    customElements.define("interactive-double-number-line", InteractiveDoubleNumberLine);
const transitions = {
    UNINITIALIZED: ["PRESENTATION"],
    PRESENTATION: ["EVALUATING"],
    EVALUATING: ["PRESENTATION", "SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN", "MASTERY_COMMITTED"],
    SCAFFOLD_L1_PROMPT: ["EVALUATING"],
    SCAFFOLD_L2_BREAKDOWN: ["PRESENTATION", "RESOLVED_EXPLANATION"],
    RESOLVED_EXPLANATION: ["PRESENTATION"],
    MASTERY_COMMITTED: ["PRESENTATION"],
};
export class MathFluencyLabEngine {
    host;
    root;
    state;
    attempts;
    sibling;
    studentInput;
    distractorInput;
    subValue;
    modelValues;
    exercise;
    detected;
    constructor(hostContainerId) {
        const host = document.getElementById(hostContainerId);
        if (!host)
            throw Error(`Container #${hostContainerId} not found`);
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
    loadExercise(schema) {
        if (!schema ||
            !["interactive-ratio-tape", "interactive-double-number-line"].includes(schema.modelComponent) ||
            (!schema.evaluateAnswer && !Number.isFinite(Number(schema.correctAnswer))) ||
            !schema.modelConfig ||
            ![schema.modelConfig.trackAUnits, schema.modelConfig.trackBUnits].every((n) => Number.isInteger(n) && n >= 1 && n <= 24) ||
            !Number.isFinite(schema.modelConfig.unitVal) ||
            schema.modelConfig.unitVal <= 0)
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
    getSnapshot() {
        if (!["PRESENTATION", "SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN"].includes(this.state))
            return null;
        return {
            exerciseId: this.exercise.id,
            state: this.state,
            attempts: this.attempts,
            misconceptionId: this.detected?.id || null,
            selectedA: this.modelValues.selectedA,
            selectedB: this.modelValues.selectedB,
        };
    }
    restoreSnapshot(snapshot) {
        if (!snapshot || snapshot.exerciseId !== this.exercise.id || !["PRESENTATION", "SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN"].includes(snapshot.state) || !Number.isInteger(snapshot.attempts) || snapshot.attempts < 0 || snapshot.attempts > 99)
            return false;
        const c = this.exercise.modelConfig;
        if (![snapshot.selectedA, snapshot.selectedB].every(Number.isInteger) || snapshot.selectedA < 0 || snapshot.selectedA > c.trackAUnits || snapshot.selectedB < 0 || snapshot.selectedB > c.trackBUnits)
            return false;
        if ((snapshot.state === "SCAFFOLD_L1_PROMPT" && snapshot.attempts !== 1) || (snapshot.state === "SCAFFOLD_L2_BREAKDOWN" && snapshot.attempts < 2))
            return false;
        this.attempts = snapshot.attempts;
        this.detected = this.exercise.misconceptions.find((rule) => rule.id === snapshot.misconceptionId);
        this.modelValues = { selectedA: snapshot.selectedA, selectedB: snapshot.selectedB };
        this.studentInput = "";
        this.subValue = "";
        this.state = snapshot.state;
        this.render();
        if (this.state === "SCAFFOLD_L2_BREAKDOWN") {
            const heading = this.root.querySelector("#scaffold-heading");
            if (heading)
                heading.tabIndex = -1;
        }
        return true;
    }
    transition(next) {
        if (!transitions[this.state]?.includes(next))
            throw Error(`Invalid lab transition: ${this.state} to ${next}`);
        this.state = next;
        if (next === "MASTERY_COMMITTED")
            this.commitMastery();
        this.render();
        if (next === "SCAFFOLD_L2_BREAKDOWN" ||
            next === "RESOLVED_EXPLANATION" ||
            next === "MASTERY_COMMITTED") {
            const heading = this.root.querySelector("#content h3") ||
                this.root.querySelector("h2");
            if (heading) {
                heading.tabIndex = -1;
                heading.focus();
            }
        }
        this.host.dispatchEvent(new CustomEvent("fluency-state-change", {
            detail: { state: next, exerciseId: this.exercise.id, attempts: this.attempts },
        }));
        if (next === "RESOLVED_EXPLANATION") {
            this.host.dispatchEvent(new CustomEvent("fluency-resolution", {
                detail: {
                    exerciseId: this.exercise.id,
                    attempts: this.attempts,
                    misconceptionId: this.detected?.id || null,
                    correct: false,
                },
            }));
        }
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
        }
        catch {
            /* Practice remains available if browser storage is blocked. */
        }
        this.host.dispatchEvent(new CustomEvent("fluency-mastery-committed", { detail: record }));
    }
    submit(raw) {
        if (!["PRESENTATION", "SCAFFOLD_L1_PROMPT"].includes(this.state))
            return;
        this.studentInput = String(raw).trim();
        if (!this.studentInput)
            return;
        this.transition("EVALUATING");
        let correct;
        try {
            correct = this.exercise.evaluateAnswer
                ? this.exercise.evaluateAnswer(this.studentInput)
                : Number(this.studentInput) === Number(this.exercise.correctAnswer);
        }
        catch {
            this.transition("PRESENTATION");
            this.root.getElementById("announcement").textContent =
                "Unable to check this answer. Try again.";
            return;
        }
        const detected = correct
            ? undefined
            : this.exercise.misconceptions.find((rule) => rule.detect(this.studentInput, {
                expected: this.exercise.correctAnswer,
                modelConfig: this.exercise.modelConfig,
            }));
        this.host.dispatchEvent(new CustomEvent("fluency-attempt", {
            detail: {
                exerciseId: this.exercise.id,
                attempt: this.attempts + 1,
                correct,
                misconceptionId: detected?.id || null,
                // The response stays in memory. The mastery receipt never persists it.
                response: this.studentInput,
            },
        }));
        if (correct) {
            this.transition("MASTERY_COMMITTED");
            return;
        }
        this.attempts++;
        if (detected) {
            this.detected = detected;
            this.distractorInput = this.studentInput;
        }
        if (this.attempts > 1)
            this.modelValues = { selectedA: 0, selectedB: 0 };
        this.transition(this.attempts === 1
            ? "SCAFFOLD_L1_PROMPT"
            : "SCAFFOLD_L2_BREAKDOWN");
        if (this.state === "SCAFFOLD_L1_PROMPT")
            this.root
                .querySelector("interactive-ratio-tape,interactive-double-number-line")
                ?.highlightError(this.detected?.tag === "INVERTED_RATIO" ? "B" : "A");
    }
    model() {
        const c = this.exercise.modelConfig;
        const el = document.createElement(this.exercise.modelComponent);
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
            this.modelValues = event.detail;
            this.updateSandbox();
        });
        return el;
    }
    updateSandbox() {
        if (this.state !== "SCAFFOLD_L2_BREAKDOWN")
            return;
        const c = this.exercise.modelConfig;
        const expected = this.detected?.remediationStep.expectedSubValue || String(c.unitVal);
        const ready = this.modelValues.selectedA === c.trackAUnits &&
            this.modelValues.selectedB === c.trackBUnits &&
            Number(this.subValue) === Number(expected);
        const button = this.root.getElementById("sandbox-next");
        if (button)
            button.disabled = !ready;
        const retry = this.root.getElementById("sandbox-retry");
        if (retry)
            retry.disabled = !ready;
        const status = this.root.getElementById("sandbox-status");
        if (status)
            status.textContent = ready
                ? "Both quantities are modeled. Continue to the explanation."
                : "Select every segment on both tracks and enter the value of one segment.";
    }
    render() {
        const e = this.exercise;
        this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}</style><div class="card" role="region" aria-label="Math Fluency Lab"><p class="muted">Standard ${escapeHTML(e.standard)} · Tier ${e.tier}</p><h2>${formatMath(e.prompt)}</h2><div id="content"></div><p id="announcement" role="status" aria-live="polite"></p></div>`;
        const content = this.root.getElementById("content");
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
            row.querySelector("#check").onclick = () => this.submit(row.querySelector("#answer").value);
            row.querySelector("#answer").onkeydown = (event) => {
                if (event.key === "Enter")
                    this.submit(event.currentTarget.value);
            };
            if (this.state === "SCAFFOLD_L1_PROMPT")
                row.querySelector("#answer").focus();
        }
        else if (this.state === "SCAFFOLD_L2_BREAKDOWN") {
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
            sub.querySelector("input").addEventListener("input", (event) => {
                this.subValue = event.currentTarget.value;
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
        }
        else if (this.state === "RESOLVED_EXPLANATION") {
            content.innerHTML = `<h3>Core conceptual rule</h3><p>${formatMath(e.fullExplanation.keyRule)}</p><h3>Algebra and model, step by step</h3><div id="steps"></div><h3>Why that answer was tempting</h3><p>${formatMath(this.detected?.tag === "ADDITIVE_THINKING" ? e.fullExplanation.distractorAnalysis : this.detected?.tag === "INVERTED_RATIO" ? `An answer of ${this.distractorInput} treats ${e.modelConfig.trackAUnits} ${e.modelConfig.trackALabel.toLowerCase()} as the unknown quantity's parts. The ${e.modelConfig.trackBUnits} ${e.modelConfig.trackBLabel.toLowerCase()} parts must each receive the same segment value.` : this.detected?.conceptualAnchor || e.fullExplanation.distractorAnalysis)}</p><div class="row"><button id="sibling" type="button">Try an isomorphic problem</button></div>`;
            const steps = content.querySelector("#steps");
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
            content.querySelector("#sibling").onclick = () => this.loadExercise(makeSibling(e, ++this.sibling));
        }
        else if (this.state === "MASTERY_COMMITTED") {
            content.innerHTML = `<h3>Practice complete</h3><p>You solved this problem in ${this.attempts + 1} ${this.attempts === 0 ? "attempt" : "attempts"}.</p><button id="next" type="button">Try another</button>`;
            content.querySelector("#next").onclick = () => this.loadExercise(makeSibling(e, ++this.sibling));
        }
        if (this.state === "EVALUATING")
            this.root.getElementById("announcement").textContent = "Checking answer";
    }
}
export function makeSibling(source, index) {
    const baseUnit = source.siblingBaseUnit || source.modelConfig.unitVal;
    const c = source.modelConfig;
    const unit = baseUnit * (index + 1);
    if (source.siblingKind === "UNIT_RATE") {
        const total = displayNumber(c.trackAUnits * unit);
        const sibling = adaptUnitRateItem({
            question: `${total} dollars for ${c.trackAUnits} items: what is the unit rate?`,
            answers: [displayNumber(unit)],
            skill: { standard: source.standard },
            tier: source.tier,
        });
        if (!sibling)
            throw Error("Unable to generate unit-rate sibling");
        return { ...sibling, id: `${source.id.split("_S")[0]}_S${index}`, siblingBaseUnit: baseUnit };
    }
    if (source.siblingKind === "PERCENT_PART") {
        const percent = displayNumber((c.trackBUnits / c.trackAUnits) * 100);
        const whole = displayNumber(c.trackAUnits * unit);
        const sibling = adaptPercentPartItem({
            question: `Find ${percent}% of ${whole}.`,
            answers: [displayNumber(c.trackBUnits * unit)],
            skill: { standard: source.standard },
            tier: source.tier,
        });
        if (!sibling)
            throw Error("Unable to generate percent sibling");
        return { ...sibling, id: `${source.id.split("_S")[0]}_S${index}`, siblingBaseUnit: baseUnit };
    }
    if (source.siblingKind === "PERCENT_WHOLE") {
        const percent = displayNumber((c.trackAUnits / c.trackBUnits) * 100);
        const part = displayNumber(c.trackAUnits * unit);
        const sibling = adaptPercentWholeItem({
            question: `${part} is ${percent}% of what number?`,
            answers: [displayNumber(c.trackBUnits * unit)],
            skill: { standard: source.standard },
            tier: source.tier,
        });
        if (!sibling)
            throw Error("Unable to generate percent-whole sibling");
        return { ...sibling, id: `${source.id.split("_S")[0]}_S${index}`, siblingBaseUnit: baseUnit };
    }
    const sibling = createRatioExercise({
        id: `${source.id.split("_S")[0]}_S${index}`,
        standard: source.standard,
        tier: source.tier,
        trackALabel: c.trackALabel,
        trackBLabel: c.trackBLabel,
        trackAUnits: c.trackAUnits,
        trackBUnits: c.trackBUnits,
        unitVal: unit,
        modelComponent: index % 2 ? "interactive-double-number-line" : "interactive-ratio-tape",
    });
    return {
        ...sibling,
        siblingBaseUnit: baseUnit,
    };
}
export function createRatioExercise(config) {
    const { id, standard, tier, trackALabel, trackBLabel, trackAUnits, trackBUnits, unitVal } = config;
    if (![trackAUnits, trackBUnits].every((n) => Number.isInteger(n) && n >= 1 && n <= 24) ||
        !Number.isFinite(unitVal) ||
        unitVal <= 0) {
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
export function adaptProportionItem(item, evaluateAnswer) {
    const forward = item.question.match(/^Solve the proportion:\s*(\d+)\s*\/\s*(\d+)\s*=\s*(\d+)\s*\/\s*x\.?$/i);
    const reverse = item.question.match(/^(\d+)\s*\/\s*(\d+)\s*=\s*x\s*\/\s*(\d+)\.\s*Find x\.$/i);
    const match = forward || reverse;
    if (!match || !item.answers?.length)
        return null;
    const [, first, second, scaled] = match;
    const a = Number(first);
    const b = Number(second);
    const c = Number(scaled);
    const knownParts = forward ? a : b;
    const unknownParts = forward ? b : a;
    const unitVal = c / knownParts;
    if (!Number.isInteger(knownParts) || !Number.isInteger(unknownParts) ||
        knownParts < 1 || unknownParts < 1 || knownParts > 24 || unknownParts > 24 ||
        !Number.isInteger(unitVal) || unitVal <= 0 || unknownParts * unitVal !== Number(item.answers[0]))
        return null;
    const tier = Math.max(1, Math.min(4, Number(item.tier) || 2));
    const schema = createRatioExercise({
        id: `proportion-${forward ? "forward" : "reverse"}-${a}-${b}-${c}`,
        standard: item.skill?.standard || "7.RP.A.2",
        tier,
        trackALabel: forward ? "first quantity" : "denominator quantity",
        trackBLabel: forward ? "second quantity" : "numerator quantity",
        trackAUnits: knownParts,
        trackBUnits: unknownParts,
        unitVal,
        modelComponent: "interactive-double-number-line",
    });
    const authoredRules = (item.meta?.wrong || [])
        .filter((wrong) => Number.isFinite(Number(wrong.text)))
        .map((wrong, index) => ({
        id: `AUTHOR_DISTRACTOR_${index}`,
        tag: /add/i.test(wrong.why)
            ? "ADDITIVE_THINKING"
            : /revers|invert/i.test(wrong.why)
                ? "INVERTED_RATIO"
                : "INCORRECT_PARTITION",
        detect: (input) => Number(input) === Number(wrong.text),
        conceptualAnchor: `That answer ${wrong.why}. Find one equal segment before scaling the second quantity.`,
        remediationStep: { ...schema.misconceptions[0].remediationStep },
    }));
    return {
        ...schema,
        prompt: item.question,
        correctAnswer: item.answers[0],
        evaluateAnswer,
        misconceptions: [...authoredRules, ...schema.misconceptions],
    };
}
export function adaptEquivalentRatioItem(item, evaluateAnswer) {
    const secondUnknown = item.question.match(/^(\d+):(\d+)\s*=\s*(\d+):□\.?$/);
    const firstUnknown = item.question.match(/^(\d+):(\d+)\s*=\s*□:(\d+)\.?$/);
    const match = secondUnknown || firstUnknown;
    if (!match || !item.answers?.length)
        return null;
    const a = Number(match[1]);
    const b = Number(match[2]);
    const scaled = Number(match[3]);
    const knownParts = secondUnknown ? a : b;
    const unknownParts = secondUnknown ? b : a;
    const unitVal = scaled / knownParts;
    if (![knownParts, unknownParts].every((n) => Number.isInteger(n) && n >= 1 && n <= 24) ||
        !Number.isInteger(unitVal) || unitVal <= 0 || unknownParts * unitVal !== Number(item.answers[0]))
        return null;
    const tier = Math.max(1, Math.min(4, Number(item.tier) || 2));
    const schema = createRatioExercise({
        id: `equivalent-ratio-${secondUnknown ? "second" : "first"}-${a}-${b}-${scaled}`,
        standard: item.skill?.standard || "6.RP.A.1",
        tier,
        trackALabel: secondUnknown ? "first quantity" : "second quantity",
        trackBLabel: secondUnknown ? "second quantity" : "first quantity",
        trackAUnits: knownParts,
        trackBUnits: unknownParts,
        unitVal,
    });
    return { ...schema, prompt: item.question, correctAnswer: item.answers[0], evaluateAnswer };
}
export function adaptUnitRateItem(item, evaluateAnswer) {
    const authored = item.question.match(/^([\d.]+) dollars for (\d+) items: what is the unit rate\?$/i);
    const legacy = item.question.match(/^([\d.]+) for (\d+) items\. How much for 1 item\?$/i);
    const match = authored || legacy;
    if (!match || !item.answers?.length)
        return null;
    const total = Number(match[1]);
    const count = Number(match[2]);
    const unit = total / count;
    const expected = Number(item.answers[0]);
    if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(count) || count < 2 || count > 24 || !Number.isFinite(unit) || unit <= 0 || !Number.isFinite(expected) || Math.abs(unit - expected) > 1e-9)
        return null;
    const tier = Math.max(1, Math.min(4, Number(item.tier) || 2));
    const schema = createRatioExercise({
        id: `unit-rate-${count}-${displayNumber(total)}`,
        standard: item.skill?.standard || "6.RP.A.2",
        tier,
        trackALabel: "Cost for all items",
        trackBLabel: "Cost for one item",
        trackAUnits: count,
        trackBUnits: 1,
        unitVal: unit,
    });
    const remediationStep = {
        scaffoldPrompt: `Build ${count} equal cost segments, then select the one-item cost segment.`,
        targetSubQuestion: "Cost of one item",
        expectedSubValue: displayNumber(unit),
        manipulativeActionHint: "Select every segment on both tracks.",
    };
    return {
        ...schema,
        prompt: item.question,
        correctAnswer: item.answers[0],
        evaluateAnswer,
        siblingKind: "UNIT_RATE",
        misconceptions: [
            {
                id: "TOTAL_AS_UNIT_RATE",
                tag: "UNIT_MISMATCH",
                detect: (input) => Number(input) === total,
                conceptualAnchor: `${displayNumber(total)} is the cost for all ${count} items. Divide it into ${count} equal costs to find one item.`,
                remediationStep,
            },
            {
                id: "ITEM_COUNT_AS_RATE",
                tag: "UNIT_MISMATCH",
                detect: (input) => Number(input) === count,
                conceptualAnchor: `${count} counts the items. The answer needs dollars for one item, found by dividing total dollars by items.`,
                remediationStep,
            },
            {
                id: "MULTIPLIED_TOTAL",
                tag: "INCORRECT_PARTITION",
                detect: (input) => Number(input) === total * count,
                conceptualAnchor: "The total already covers every item. Divide it into equal groups instead of multiplying it again.",
                remediationStep,
            },
        ],
        fullExplanation: {
            keyRule: "A unit rate gives the amount for exactly one item.",
            stepByStep: [
                { stepNumber: 1, instruction: `Partition the total cost across ${count} equal item segments.`, mathExpression: `${displayNumber(total)} ÷ ${count} = ${displayNumber(unit)}` },
                { stepNumber: 2, instruction: "Read the value of one segment as the unit rate.", mathExpression: `1 item × ${displayNumber(unit)} = ${displayNumber(unit)} dollars per item` },
            ],
            distractorAnalysis: `The total ${displayNumber(total)} is for ${count} items. The rate for one item is ${displayNumber(unit)}.`,
        },
    };
}
export function adaptPercentPartItem(item, evaluateAnswer) {
    const direct = item.question.match(/^(?:Find|What is) (\d+)% of ([\d.]+)[.?]$/i);
    const missing = item.question.match(/^(\d+)% of ([\d.]+) is x\. Find x\.$/i);
    const match = direct || missing;
    if (!match || !item.answers?.length)
        return null;
    const percent = Number(match[1]);
    const whole = Number(match[2]);
    if (!Number.isInteger(percent) || percent <= 0 || percent > 100 || !Number.isFinite(whole) || whole <= 0)
        return null;
    const { part: selectedParts, whole: wholeParts } = percentParts(percent);
    if (wholeParts > 24 || selectedParts > 24)
        return null;
    const unit = whole / wholeParts;
    const answer = selectedParts * unit;
    const expected = Number(item.answers[0]);
    if (!Number.isFinite(expected) || Math.abs(answer - expected) > 1e-9)
        return null;
    const tier = Math.max(1, Math.min(4, Number(item.tier) || 2));
    const schema = createRatioExercise({
        id: `percent-part-${percent}-${displayNumber(whole)}`,
        standard: item.skill?.standard || "6.RP.A.3",
        tier,
        trackALabel: "Whole (100%)",
        trackBLabel: `Part (${percent}%)`,
        trackAUnits: wholeParts,
        trackBUnits: selectedParts,
        unitVal: unit,
    });
    const remediationStep = {
        scaffoldPrompt: `Partition the whole into ${wholeParts} equal parts. Build the ${selectedParts} parts that make ${percent}%.`,
        targetSubQuestion: "Value of one equal part",
        expectedSubValue: displayNumber(unit),
        manipulativeActionHint: "Select all whole segments and the percent part segments.",
    };
    return {
        ...schema,
        prompt: item.question,
        correctAnswer: item.answers[0],
        evaluateAnswer,
        siblingKind: "PERCENT_PART",
        misconceptions: [
            {
                id: "WHOLE_AS_PART",
                tag: "UNIT_MISMATCH",
                detect: (input) => Number(input) === whole,
                conceptualAnchor: `${displayNumber(whole)} is the whole, or 100%. The question asks for ${percent}% of it.`,
                remediationStep,
            },
            {
                id: "PERCENT_AS_AMOUNT",
                tag: "UNIT_MISMATCH",
                detect: (input) => Number(input) === percent,
                conceptualAnchor: `${percent} tells the number of parts per hundred, not the amount in this whole. Partition the whole first.`,
                remediationStep,
            },
            {
                id: "MISSING_PERCENT_DIVISION",
                tag: "INCORRECT_PARTITION",
                detect: (input) => Number(input) === percent * whole,
                conceptualAnchor: "A percent is per hundred. Multiplying by the percent without dividing by 100 makes the part too large.",
                remediationStep,
            },
        ],
        fullExplanation: {
            keyRule: "A percent names a part of a whole measured out of one hundred equal parts.",
            stepByStep: [
                { stepNumber: 1, instruction: `Use the simplest equal-part model for ${percent}%.`, mathExpression: `${displayNumber(whole)} ÷ ${wholeParts} = ${displayNumber(unit)}` },
                { stepNumber: 2, instruction: `Take ${selectedParts} of those equal parts.`, mathExpression: `${selectedParts} × ${displayNumber(unit)} = ${displayNumber(answer)}` },
            ],
            distractorAnalysis: `${displayNumber(whole)} is the full 100%. The requested ${percent}% is ${displayNumber(answer)}.`,
        },
    };
}
export function adaptPercentWholeItem(item, evaluateAnswer) {
    const match = item.question.match(/^([\d.]+) is (\d+)% of what number\?$/i);
    if (!match || !item.answers?.length)
        return null;
    const part = Number(match[1]);
    const percent = Number(match[2]);
    if (!Number.isFinite(part) || part <= 0 || !Number.isInteger(percent) || percent <= 0 || percent >= 100)
        return null;
    const { part: partSegments, whole: wholeSegments } = percentParts(percent);
    if (partSegments > 24 || wholeSegments > 24)
        return null;
    const unit = part / partSegments;
    const whole = wholeSegments * unit;
    const expected = Number(item.answers[0]);
    if (!Number.isFinite(expected) || Math.abs(whole - expected) > 1e-9)
        return null;
    const tier = Math.max(1, Math.min(4, Number(item.tier) || 2));
    const schema = createRatioExercise({
        id: `percent-whole-${percent}-${displayNumber(part)}`,
        standard: item.skill?.standard || "6.RP.A.3",
        tier,
        trackALabel: `Known part (${percent}%)`,
        trackBLabel: "Whole (100%)",
        trackAUnits: partSegments,
        trackBUnits: wholeSegments,
        unitVal: unit,
    });
    const remediationStep = {
        scaffoldPrompt: `Build ${partSegments} equal parts for the known ${percent}%, then build all ${wholeSegments} parts of the whole.`,
        targetSubQuestion: "Value of one equal part",
        expectedSubValue: displayNumber(unit),
        manipulativeActionHint: "Select all segments on both tracks.",
    };
    return {
        ...schema,
        prompt: item.question,
        correctAnswer: item.answers[0],
        evaluateAnswer,
        siblingKind: "PERCENT_WHOLE",
        misconceptions: [
            {
                id: "PART_AS_WHOLE",
                tag: "UNIT_MISMATCH",
                detect: (input) => Number(input) === part,
                conceptualAnchor: `${displayNumber(part)} is only ${percent}% of the whole. Build up to 100% to find the full amount.`,
                remediationStep,
            },
            {
                id: "PERCENT_AS_WHOLE",
                tag: "UNIT_MISMATCH",
                detect: (input) => Number(input) === percent,
                conceptualAnchor: `${percent} is the percent label, not the total amount. Use the known part to find one equal segment.`,
                remediationStep,
            },
            {
                id: "PERCENT_OF_PART",
                tag: "INCORRECT_PARTITION",
                detect: (input) => Number(input) === (part * percent) / 100,
                conceptualAnchor: "Taking the percent of the known part makes a smaller part. Scale the known part up to 100% instead.",
                remediationStep,
            },
        ],
        fullExplanation: {
            keyRule: "The known part is less than the whole; divide it into equal percent parts, then build 100%.",
            stepByStep: [
                { stepNumber: 1, instruction: `Find one of the ${partSegments} equal parts in the known ${percent}%.`, mathExpression: `${displayNumber(part)} ÷ ${partSegments} = ${displayNumber(unit)}` },
                { stepNumber: 2, instruction: `Build all ${wholeSegments} parts of the whole.`, mathExpression: `${wholeSegments} × ${displayNumber(unit)} = ${displayNumber(whole)}` },
            ],
            distractorAnalysis: `${displayNumber(part)} is the ${percent}% part. The complete 100% whole is ${displayNumber(whole)}.`,
        },
    };
}
export function adaptPracticeItem(item, evaluateAnswer) {
    const skill = `${item.skill?.grade}:${item.skill?.id}`;
    if (skill === "7:proportions")
        return adaptProportionItem(item, evaluateAnswer);
    if (skill === "6:ratios")
        return adaptEquivalentRatioItem(item, evaluateAnswer);
    if (skill === "6:unit-rates" || skill === "7:unit-rate")
        return adaptUnitRateItem(item, evaluateAnswer);
    if (skill === "6:percent")
        return adaptPercentPartItem(item, evaluateAnswer);
    if (skill === "6:percent-whole")
        return adaptPercentWholeItem(item, evaluateAnswer);
    return null;
}
export const SEED_EXERCISE = {
    id: "6.RP.A.3_RATIO_TAPE_01",
    standard: "6.RP.A.3",
    tier: 2,
    prompt: "A recipe uses 3 cups of flour for every 2 teaspoons of vanilla. If you use 12 cups of flour, how many teaspoons of vanilla are required?",
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
            conceptualAnchor: "Ratios grow by multiplication through a constant scale factor, not addition.",
            remediationStep: {
                scaffoldPrompt: "Find the factor multiplied by 3 to reach 12. Select all three flour segments, then both vanilla segments.",
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
        distractorAnalysis: "An answer of 11 adds the flour increase to vanilla. Equivalent ratios scale both quantities by multiplication.",
    },
};
