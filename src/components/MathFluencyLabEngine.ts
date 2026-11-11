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
    | "INCORRECT_PARTITION"
    | "WHOLE_AS_PART"
    | "SIGN_REVERSAL"
    | "OFF_BY_ONE"
    | "DIGIT_VS_VALUE"
    | "INVERTED_COMPARE"
    | "ADDITIVE_INSTEAD_OF_MULTIPLICATIVE"
    | "ADDED_DENOMINATORS"
    | "FORGOT_RECIPROCAL"
    | "SIGNED_SIGN_ERROR"
    | "ORDER_OF_OPS_LEFT_TO_RIGHT"
    | "INVERSE_OP_CONFUSION"
    | "PROB_PART_TO_PART"
    | "ANGLE_COMP_SUPP_SWAP"
    | "AREA_PERIMETER_SWAP";
  detect: (studentInput: string, context: Record<string, unknown>) => boolean;
  conceptualAnchor: string;
  remediationStep: {
    scaffoldPrompt: string;
    targetSubQuestion: string;
    expectedSubValue: string;
    manipulativeActionHint?: string;
  };
}
export type PublisherModelTag =
  | "interactive-ratio-tape"
  | "interactive-double-number-line"
  | "interactive-counters-frame"
  | "interactive-place-value-mat"
  | "interactive-array-area"
  | "interactive-fraction-bar"
  | "interactive-signed-number-line"
  | "interactive-algebra-balance"
  | "interactive-geometry-board"
  | "interactive-data-board";

export type PublisherResponseType =
  | "number"
  | "fraction"
  | "expression"
  | "inequality"
  | "order"
  | "choice"
  | "text";

export interface PracticeItemInput {
  question: string;
  answers: string[];
  displayAnswer?: string;
  kind?: string;
  unit?: string | null;
  choices?: string[] | null;
  response?: unknown;
  generator?: string;
  hint?: string;
  explanation?: string;
  steps?: string[];
  skill?: {
    grade?: number;
    id?: string;
    name?: string;
    standard?: string;
    generator?: string;
    strand?: string;
  };
  model?: Record<string, unknown> | null;
  tier?: number;
  meta?: { wrong?: Array<{ text: string; why: string }> };
}

export interface ExerciseSchema {
  id: string;
  standard: string;
  tier: 1 | 2 | 3 | 4;
  prompt: string;
  modelComponent: PublisherModelTag;
  modelConfig: {
    trackALabel: string;
    trackAUnits: number;
    trackBLabel: string;
    trackBUnits: number;
    unitVal: number;
  };
  modelSpec?: Record<string, unknown>;
  responseType?: PublisherResponseType;
  choices?: string[];
  inputPlaceholder?: string;
  correctAnswer: string;
  evaluateAnswer?: (studentInput: string) => boolean;
  siblingKind?: string;
  siblingBaseUnit?: number;
  siblingSpec?: Record<string, unknown>;
  misconceptions: MisconceptionRule[];
  fullExplanation: {
    keyRule: string;
    stepByStep: Array<{ stepNumber: number; instruction: string; mathExpression: string }>;
    distractorAnalysis: string;
  };
}
export interface LabSnapshot {
  exerciseId: string;
  state: "PRESENTATION" | "SCAFFOLD_L1_PROMPT" | "SCAFFOLD_L2_BREAKDOWN";
  attempts: number;
  misconceptionId: string | null;
  selectedA: number;
  selectedB: number;
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
const positiveValue = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const displayNumber = (value: number) => String(Number(value.toFixed(6)));
const gcd = (a: number, b: number): number => {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) [x, y] = [y, x % y];
  return x || 1;
};
const simplifyFraction = (n: number, d: number): string => {
  if (d === 0) return String(n);
  const sign = (n < 0) !== (d < 0) ? -1 : 1;
  const absN = Math.abs(n);
  const absD = Math.abs(d);
  const g = gcd(absN, absD);
  const sn = (absN / g) * sign;
  const sd = absD / g;
  return sd === 1 ? String(sn) : `${sn}/${sd}`;
};
const parseRational = (raw: unknown): { num: number; den: number; value: number } | null => {
  const clean = String(raw ?? "").trim().replaceAll("−", "-").replaceAll(",", "");
  if (!clean) return null;
  const mixed = /^([+-]?)(\d+)\s+(\d+)\/(\d+)$/.exec(clean);
  if (mixed) {
    const den = Number(mixed[4]);
    if (!den) return null;
    const sign = mixed[1] === "-" ? -1 : 1;
    const whole = Number(mixed[2]);
    const num = Number(mixed[3]);
    return { num: sign * (whole * den + num), den, value: sign * (whole + num / den) };
  }
  const frac = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(clean);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (!den) return null;
    return { num, den, value: num / den };
  }
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(clean)) {
    const val = Number(clean);
    if (Number.isFinite(val)) return { num: val, den: 1, value: val };
  }
  return null;
};
const normalizeMathToken = (raw: unknown): string =>
  String(raw ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("−", "-")
    .replaceAll("×", "*")
    .replaceAll("·", "*")
    .replaceAll("<=", "≤")
    .replaceAll(">=", "≥")
    .replace(/\s+/g, "");
export function mathAnswersMatch(
  submittedRaw: unknown,
  expectedRaw: unknown,
  responseType?: PublisherResponseType,
): boolean {
  const sub = String(submittedRaw ?? "").trim();
  const exp = String(expectedRaw ?? "").trim();
  if (!sub || !exp) return false;
  if (normalizeMathToken(sub) === normalizeMathToken(exp)) return true;
  if (responseType === "order") {
    const split = (s: string) =>
      s
        .split(",")
        .map((p) => {
          const r = parseRational(p);
          return r ? displayNumber(r.value) : normalizeMathToken(p);
        });
    const sa = split(sub);
    const ea = split(exp);
    return sa.length === ea.length && sa.every((v, i) => v === ea[i]);
  }
  if (responseType === "expression") {
    const normExpr = (s: string) =>
      normalizeMathToken(s)
        .replace(/\+\-/g, "-")
        .replace(/1([a-z])/g, "$1")
        .replace(/^([a-z])\*(-?\d+)/, "$2$1");
    return normExpr(sub) === normExpr(exp);
  }
  if (responseType === "inequality") {
    return normalizeMathToken(sub) === normalizeMathToken(exp);
  }
  const rSub = parseRational(sub);
  const rExp = parseRational(exp);
  if (rSub && rExp) return Math.abs(rSub.value - rExp.value) <= 1e-6;
  return false;
}
const percentParts = (percent: number) => {
  let divisor = percent;
  let remainder = 100;
  while (remainder !== 0) [divisor, remainder] = [remainder, divisor % remainder];
  return { part: percent / divisor, whole: 100 / divisor };
};
export const formatMath = (value: unknown) =>
  escapeHTML(value)
    .replace(
      /(?<![\w/])(?:([−-])?\s*(\d{1,4})|([a-zA-Z]))\s*\/\s*(?:(\d{1,4})|([a-zA-Z]))(?![\w/])/g,
      (full, sign, numDigits, numVar, denDigits, denVar) => {
        if (numVar && denVar) return full;
        const n = (sign ? "−" : "") + (numDigits ?? numVar);
        const d = denDigits ?? denVar;
        if (!d || d === "0") return full;
        const spoken = `${sign ? "negative " : ""}${numDigits ?? numVar} over ${d}`;
        return `<span class="math-fraction" role="math" aria-label="${spoken}"><span class="math-fraction-num" aria-hidden="true">${n}</span><span class="math-fraction-den" aria-hidden="true">${d}</span></span>`;
      },
    )
    .replace(/(\b\d+|10|[a-zA-Z])\^(-?\d+)/g, "$1<sup>$2</sup>");

export const INJECTED_MATH_STYLES = `
  :host { color-scheme: dark; font: 16px/1.5 system-ui,sans-serif; color:#f8fafc; --pub-navy:#17324D; --pub-teal:#1FA6A2; --pub-amber:#F2C15B; --pub-coral:#d8613c; }
  *,*::before,*::after { box-sizing:border-box; }
  button,input { font:inherit; }
  button { min-height:44px; min-width:44px; cursor:pointer; border-radius:8px; border:1px solid #7dd3fc; background:#0369a1; color:white; padding:8px 16px; }
  button:hover:not(:disabled) { background:#075985; }
  button:disabled { opacity:0.5; cursor:not-allowed; }
  :focus-visible { outline:3px solid #fbbf24; outline-offset:3px; }
  .math-fraction { display:inline-flex; flex-direction:column; vertical-align:middle; text-align:center; line-height:1.1; padding:0 3px; }
  .math-fraction-num { border-bottom:2px solid currentColor; padding:0 2px 2px; }
  .math-fraction-den { padding-top:2px; }
  .card { background:#182234; border:1px solid #64748b; border-radius:12px; padding:20px; margin:16px 0; max-width:100%; }
  .hint { border-left:4px solid #fbbf24; background:#45340e; padding:12px; }
  .row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:16px 0; }
  .choices-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(128px, 1fr)); gap:10px; margin:16px 0; }
  .choice-btn { min-height:48px; min-width:44px; background:#0f172a; border:2px solid #7dd3fc; color:#f8fafc; font-weight:700; display:flex; align-items:center; justify-content:center; padding:10px 14px; border-radius:10px; }
  .choice-btn[aria-pressed="true"] { background:#0369a1; border-color:#fbbf24; }
  .choice-btn.is-wrong { border-color:#d8613c; background:#451a14; }
  input { min-height:44px; min-width:140px; max-width:100%; padding:8px 12px; border-radius:8px; border:2px solid #94a3b8; background:#0f172a; color:white; }
  .muted { color:#cbd5e1; }
  .math-line { color:#86efac; font-size:1.1rem; }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important; } }
`;

const HTMLElementBase: typeof HTMLElement = typeof HTMLElement === "undefined"
  ? class {} as typeof HTMLElement
  : HTMLElement;

export class InteractiveRatioTape extends HTMLElementBase {
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
        ? `Matched ticks: ${displayNumber(this.selectedA * c.unit)} and ${displayNumber(this.selectedB * c.unit)}`
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
      `<div class="label">${escapeHTML(label)} <span>Selected: ${displayNumber(selected * c.unit)}</span></div><div class="track" id="track-${name.toLowerCase()}" role="group" aria-label="${escapeHTML(label)}">${Array.from({ length: units }, (_, i) => `<button type="button" data-track="${name}" data-index="${i}" aria-pressed="${i < selected}" aria-label="${escapeHTML(label)}, segment ${i + 1} of ${units}, value ${displayNumber(c.unit)}" ${c.interactive ? "" : "disabled"} class="segment ${i < selected ? "selected" : ""}">${displayNumber(c.unit)}</button>`).join("")}</div>`;
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
if (typeof customElements !== "undefined" && !customElements.get("interactive-ratio-tape"))
  customElements.define("interactive-ratio-tape", InteractiveRatioTape);
export class InteractiveDoubleNumberLine extends InteractiveRatioTape {
  render() {
    const c = this.config;
    const line = (track: "A" | "B", label: string, units: number, selected: number) =>
      `<div class="line-label">${escapeHTML(label)}</div><div class="line" id="track-${track.toLowerCase()}" role="group" aria-label="${escapeHTML(label)} number line">${Array.from({ length: units + 1 }, (_, i) => `<button type="button" class="tick ${i <= selected ? "selected" : ""}" data-track="${track}" data-index="${i}" aria-pressed="${i === selected}" aria-label="${escapeHTML(label)}, ${displayNumber(i * c.unit)}, tick ${i} of ${units}" ${c.interactive ? "" : "disabled"}>${displayNumber(i * c.unit)}</button>`).join("")}</div>`;
    this.root.innerHTML = `<style>${INJECTED_MATH_STYLES}:host{display:block}.wrap{background:#182234;border:1px solid #64748b;border-radius:12px;padding:16px}.line-label{font-weight:700;margin:10px 0}.line{display:flex;overflow-x:auto;gap:2px;border-top:3px solid #7dd3fc;padding-top:8px}.tick{flex:1;min-width:44px;min-height:44px;padding:3px;background:#334155;border:1px solid #94a3b8}.tick.selected{background:#0369a1}.tick:disabled{opacity:1;cursor:default}.error-pulse{box-shadow:0 0 0 3px #fbbf24}</style><div class="wrap">${line("A", c.a, c.aUnits, this.selectedA)}${line("B", c.b, c.bUnits, this.selectedB)}<p aria-live="polite">Matched ticks: ${displayNumber(this.selectedA * c.unit)} and ${displayNumber(this.selectedB * c.unit)}</p></div>`;
    this.root
      .querySelectorAll<HTMLButtonElement>(".tick")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this.select(button.dataset.track as "A" | "B", Number(button.dataset.index)),
        ),
      );
  }
}
if (typeof customElements !== "undefined" && !customElements.get("interactive-double-number-line"))
  customElements.define("interactive-double-number-line", InteractiveDoubleNumberLine);

export const PUBLISHER_MODEL_TAGS: PublisherModelTag[] = [
  "interactive-ratio-tape",
  "interactive-double-number-line",
  "interactive-counters-frame",
  "interactive-place-value-mat",
  "interactive-array-area",
  "interactive-fraction-bar",
  "interactive-signed-number-line",
  "interactive-algebra-balance",
  "interactive-geometry-board",
  "interactive-data-board",
];

const MODEL_SHARED_CSS = `
  :host { display:block; color-scheme:dark; font:15px/1.45 system-ui,-apple-system,sans-serif; color:#f8fafc; }
  *,*::before,*::after { box-sizing:border-box; }
  .pm-wrap { background:#101c2d; border:1px solid #475569; border-radius:14px; padding:14px; max-width:100%; overflow:hidden; }
  .pm-head { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px; }
  .pm-title { font-weight:700; color:#e2e8f0; margin:0; font-size:0.95rem; }
  .pm-pill { font-size:0.8rem; font-weight:700; padding:3px 9px; border-radius:999px; background:#17324D; border:1px solid #1FA6A2; color:#a7f3d0; }
  .pm-controls { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; align-items:center; }
  .pm-btn { min-height:44px; min-width:44px; padding:8px 12px; border-radius:10px; border:1px solid #7dd3fc; background:#0369a1; color:#ffffff; font:700 14px/1.2 inherit; cursor:pointer; }
  .pm-btn:hover:not(:disabled) { background:#075985; }
  .pm-btn[aria-pressed="true"] { background:#1FA6A2; border-color:#F2C15B; color:#09202e; }
  .pm-btn.alt { background:#1e293b; border-color:#94a3b8; color:#f8fafc; }
  .pm-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .pm-status { margin:10px 0 0; font-size:0.9rem; color:#cbd5e1; }
  .pm-alert { margin:8px 0 0; padding:8px 10px; border-radius:8px; border-left:4px solid #F2C15B; background:#3b2c0a; color:#fef3c7; font-size:0.88rem; }
  .pm-grid { display:grid; gap:6px; }
  .pm-svg { width:100%; max-width:440px; height:auto; display:block; background:#0f172a; border:1px solid #334155; border-radius:10px; }
  .pm-math-frac { display:inline-flex; flex-direction:column; vertical-align:middle; text-align:center; line-height:1.05; padding:0 3px; }
  .pm-math-frac > span:first-child { border-bottom:1.5px solid currentColor; padding:0 2px 1px; }
  :focus-visible { outline:3px solid #F2C15B; outline-offset:2px; }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { transition:none!important; animation:none!important; } }
`;

class PublisherModelBase extends HTMLElementBase {
  protected root: ShadowRoot;
  protected cfg: Record<string, any> = {};
  protected interactive = true;
  protected completed = false;
  protected stepIndex = -1;
  protected alertText = "";
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }
  static get observedAttributes() {
    return ["config", "interactive", "step-index"];
  }
  attributeChangedCallback(name: string, _old: string | null, val: string | null) {
    if (name === "config" && val) {
      try {
        this.cfg = JSON.parse(val);
      } catch {
        this.cfg = {};
      }
      this.onConfigChange();
    } else if (name === "interactive") {
      this.interactive = val !== "false";
    } else if (name === "step-index" && val !== null) {
      this.stepIndex = Number(val);
    }
    this.render();
  }
  connectedCallback() {
    this.interactive = this.getAttribute("interactive") !== "false";
    const raw = this.getAttribute("config");
    if (raw && !Object.keys(this.cfg).length) {
      try {
        this.cfg = JSON.parse(raw);
      } catch {
        this.cfg = {};
      }
      this.onConfigChange();
    }
    this.render();
  }
  set configData(data: Record<string, any>) {
    this.cfg = data || {};
    this.onConfigChange();
    this.render();
  }
  protected onConfigChange() {}
  setStepState(index: number) {
    this.stepIndex = index;
    this.completed = true;
    this.render();
  }
  highlightError(hint = "Inspect this relationship carefully.") {
    this.alertText = String(hint);
    this.render();
  }
  reset() {
    this.completed = false;
    this.alertText = "";
    this.onConfigChange();
    this.render();
  }
  protected emitChange(summary: string, value?: unknown) {
    this.completed = true;
    this.dispatchEvent(
      new CustomEvent("model-change", {
        bubbles: true,
        composed: true,
        detail: { completed: this.completed, summary, value, stepIndex: this.stepIndex },
      }),
    );
  }
  protected shell(title: string, badge: string, body: string, status: string) {
    this.root.innerHTML = `<style>${MODEL_SHARED_CSS}${this.extraCss()}</style><div class="pm-wrap" role="region" aria-label="${escapeHTML(title)}"><div class="pm-head"><p class="pm-title">${escapeHTML(title)}</p><span class="pm-pill">${escapeHTML(badge)}</span></div>${body}${this.alertText ? `<p class="pm-alert" role="status">${escapeHTML(this.alertText)}</p>` : ""}<p class="pm-status" role="status" aria-live="polite">${escapeHTML(status)}</p></div>`;
  }
  protected extraCss() {
    return "";
  }
  protected render() {}
}

const registerModel = (tag: string, ctor: typeof HTMLElementBase) => {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, ctor as unknown as CustomElementConstructor);
  }
};

export class InteractiveCountersFrame extends PublisherModelBase {
  private filled = 0;
  private stepShown = 1;
  protected onConfigChange() {
    const mode = String(this.cfg.mode || "ten-frame");
    this.filled = Number(this.cfg.initial ?? (mode === "takeAway" ? (this.cfg.countA ?? 5) : 0));
    this.stepShown = this.stepIndex >= 0 ? 1 : 0;
  }
  protected extraCss() {
    return `
      .ten-frame { display:grid; grid-template-columns:repeat(5, minmax(44px, 1fr)); gap:6px; max-width:290px; }
      .tf-cell { min-height:44px; min-width:44px; border-radius:10px; border:2px solid #475569; background:#0f172a; display:flex; align-items:center; justify-content:center; font-weight:700; color:#f8fafc; cursor:pointer; }
      .tf-cell.on-a { background:#0369a1; border-color:#7dd3fc; }
      .tf-cell.on-b { background:#1FA6A2; border-color:#a7f3d0; color:#09202e; }
      .tf-cell.crossed { background:#451a14; border-color:#d8613c; text-decoration:line-through; }
      .seq-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .seq-box { min-width:44px; min-height:44px; padding:6px 10px; border-radius:8px; border:2px solid #475569; background:#0f172a; font-weight:700; display:inline-flex; align-items:center; justify-content:center; }
      .seq-box.active { border-color:#F2C15B; background:#17324D; }
    `;
  }
  render() {
    const mode = String(this.cfg.mode || "ten-frame");
    if (mode === "sequence" || mode === "pattern") {
      const seq: string[] = Array.isArray(this.cfg.seq) ? this.cfg.seq.map(String) : ["?", "?", "?"];
      const stepLabel = this.cfg.step ? `+${this.cfg.step}` : "repeat unit";
      const html = `<div class="seq-row">${seq.map((t, i) => `<span class="seq-box ${this.stepShown && i >= seq.length - 2 ? "active" : ""}">${escapeHTML(t)}</span>`).join("")}</div>
        ${this.interactive ? `<div class="pm-controls"><button type="button" class="pm-btn" id="cf-step">${mode === "pattern" ? "Highlight repeating core" : `Trace jump (${escapeHTML(stepLabel)})`}</button></div>` : ""}`;
      this.shell(
        mode === "pattern" ? "Pattern Strip" : "Counting Pattern Strip",
        mode === "pattern" ? "Repeating unit" : `Jump ${stepLabel}`,
        html,
        this.stepShown ? `Highlighted rule: ${stepLabel}.` : "Activate the button to highlight the repeating change.",
      );
      this.root.getElementById("cf-step")?.addEventListener("click", () => {
        this.stepShown = 1;
        this.emitChange(`Highlighted ${stepLabel}`, stepLabel);
        this.render();
      });
      return;
    }
    const maxCells = Number(this.cfg.capacity ?? (Math.max(Number(this.cfg.total ?? 10), Number(this.cfg.countA ?? 0) + Number(this.cfg.countB ?? 0), 10) > 10 ? 20 : 10));
    const countA = Number(this.cfg.countA ?? 0);
    const activeCount = this.stepIndex >= 0 ? Number(this.cfg.targetCount ?? this.filled) : this.filled;
    const cells = Array.from({ length: maxCells }, (_, i) => {
      const on = i < activeCount;
      const cross = mode === "takeAway" && i >= activeCount && i < countA;
      const cls = cross ? "crossed" : on ? (i >= countA && countA > 0 ? "on-b" : "on-a") : "";
      const sym = cross ? "×" : on ? "●" : "";
      return `<button type="button" class="tf-cell ${cls}" data-idx="${i}" aria-pressed="${on}" aria-label="Counter slot ${i + 1}${on ? " filled" : cross ? " removed" : " empty"}" ${this.interactive ? "" : "disabled"}>${sym}</button>`;
    }).join("");
    const controls = this.interactive
      ? `<div class="pm-controls"><button type="button" class="pm-btn" id="cf-minus" aria-label="Remove one counter">−1</button><button type="button" class="pm-btn" id="cf-plus" aria-label="Add one counter">+1</button><button type="button" class="pm-btn alt" id="cf-reset">Reset</button></div>`
      : "";
    this.shell(
      mode === "subitize" ? "Dot Grouping Frame" : "Interactive Ten-Frame",
      `${activeCount} / ${maxCells}`,
      `<div class="ten-frame" role="group" aria-label="Ten frame">${cells}</div>${controls}`,
      `Counters active: ${activeCount} of ${maxCells}.`,
    );
    if (!this.interactive) return;
    this.root.querySelectorAll<HTMLButtonElement>(".tf-cell").forEach((b) =>
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.idx);
        this.filled = idx + 1 === this.filled ? idx : idx + 1;
        this.emitChange(`Set ${this.filled} counters`, this.filled);
        this.render();
      }),
    );
    this.root.getElementById("cf-plus")?.addEventListener("click", () => {
      this.filled = Math.min(maxCells, this.filled + 1);
      this.emitChange(`Added to ${this.filled}`, this.filled);
      this.render();
    });
    this.root.getElementById("cf-minus")?.addEventListener("click", () => {
      this.filled = Math.max(0, this.filled - 1);
      this.emitChange(`Reduced to ${this.filled}`, this.filled);
      this.render();
    });
    this.root.getElementById("cf-reset")?.addEventListener("click", () => this.reset());
  }
}
registerModel("interactive-counters-frame", InteractiveCountersFrame);

export class InteractivePlaceValueMat extends PublisherModelBase {
  private activeCol = -1;
  private roundChoice: "low" | "high" | null = null;
  protected onConfigChange() {
    this.activeCol = typeof this.cfg.highlightIdx === "number" ? this.cfg.highlightIdx : -1;
    this.roundChoice = this.stepIndex > 0 && this.cfg.roundTarget ? this.cfg.roundTarget : null;
  }
  protected extraCss() {
    return `
      .pv-row { display:flex; flex-wrap:wrap; gap:6px; }
      .pv-col { min-width:54px; min-height:56px; padding:6px 8px; border-radius:10px; border:2px solid #475569; background:#0f172a; color:#f8fafc; cursor:pointer; text-align:center; }
      .pv-col[aria-pressed="true"] { border-color:#F2C15B; background:#17324D; }
      .pv-name { display:block; font-size:0.7rem; color:#94a3b8; }
      .pv-digit { display:block; font-size:1.25rem; font-weight:800; }
      .bench { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:8px; }
    `;
  }
  render() {
    const mode = String(this.cfg.mode || "place");
    if (mode === "round") {
      const low = String(this.cfg.low ?? "0");
      const mid = String(this.cfg.mid ?? "5");
      const high = String(this.cfg.high ?? "10");
      const val = String(this.cfg.number ?? mid);
      const body = `<div class="bench" role="group" aria-label="Rounding benchmarks">
        <button type="button" class="pm-btn" id="pv-low" aria-pressed="${this.roundChoice === "low"}" ${this.interactive ? "" : "disabled"}>Down: ${escapeHTML(low)}</button>
        <span class="pm-pill">Midpoint ${escapeHTML(mid)} · Value ${escapeHTML(val)}</span>
        <button type="button" class="pm-btn" id="pv-high" aria-pressed="${this.roundChoice === "high"}" ${this.interactive ? "" : "disabled"}>Up: ${escapeHTML(high)}</button>
      </div>`;
      this.shell("Benchmark Number Line", `Nearest ${escapeHTML(this.cfg.targetPlace || "benchmark")}`, body, this.roundChoice ? `Testing benchmark ${this.roundChoice === "low" ? low : high} compared to midpoint ${mid}.` : `Compare ${val} with midpoint ${mid}.`);
      this.root.getElementById("pv-low")?.addEventListener("click", () => {
        this.roundChoice = "low";
        this.emitChange(`Selected lower benchmark ${low}`, low);
        this.render();
      });
      this.root.getElementById("pv-high")?.addEventListener("click", () => {
        this.roundChoice = "high";
        this.emitChange(`Selected upper benchmark ${high}`, high);
        this.render();
      });
      return;
    }
    const cols: Array<{ label: string; digit: string }> = Array.isArray(this.cfg.columns)
      ? this.cfg.columns
      : [{ label: "Tens", digit: "1" }, { label: "Ones", digit: "0" }];
    const extraLine = this.cfg.numberB ? `<p class="pm-status">Second value: ${escapeHTML(this.cfg.numberB)}</p>` : "";
    const body = `<div class="pv-row" role="group" aria-label="Place value columns">${cols.map((c, idx) => `<button type="button" class="pv-col" data-idx="${idx}" aria-pressed="${this.activeCol === idx}" ${this.interactive ? "" : "disabled"}><span class="pv-name">${escapeHTML(c.label)}</span><span class="pv-digit">${escapeHTML(c.digit)}</span></button>`).join("")}</div>${extraLine}`;
    const chosen = this.activeCol >= 0 && cols[this.activeCol] ? `${cols[this.activeCol].label} place has digit ${cols[this.activeCol].digit}` : "Select a place column to inspect its value.";
    this.shell(mode === "vertical" ? "Aligned Place-Value Columns" : "Place-Value Mat", String(this.cfg.number || "Columns"), body, chosen);
    if (!this.interactive) return;
    this.root.querySelectorAll<HTMLButtonElement>(".pv-col").forEach((b) =>
      b.addEventListener("click", () => {
        this.activeCol = Number(b.dataset.idx);
        const col = cols[this.activeCol];
        this.emitChange(`Inspected ${col.label}: ${col.digit}`, col);
        this.render();
      }),
    );
  }
}
registerModel("interactive-place-value-mat", InteractivePlaceValueMat);

export class InteractiveArrayArea extends PublisherModelBase {
  private activeRows = 0;
  private checkedPart = false;
  protected onConfigChange() {
    this.activeRows = this.stepIndex >= 0 ? Number(this.cfg.rows ?? 1) : Math.min(1, Number(this.cfg.rows ?? 1));
    this.checkedPart = this.stepIndex > 0;
  }
  render() {
    const mode = String(this.cfg.mode || "array");
    const rows = Math.max(1, Math.min(12, Number(this.cfg.rows ?? 3)));
    const cols = Math.max(1, Math.min(12, Number(this.cfg.cols ?? 4)));
    if (mode === "area2d" || mode === "division" || mode === "factors" || mode === "exponent" || mode === "pow10" || mode === "sci") {
      const boxLabel = String(this.cfg.label || "Product / Factor Partition");
      const chips: string[] = Array.isArray(this.cfg.chips) ? this.cfg.chips : [`${rows} × ${cols}`];
      const body = `<div class="pm-controls">${chips.map((ch, idx) => `<button type="button" class="pm-btn ${this.checkedPart ? "" : "alt"}" data-chip="${idx}" aria-pressed="${this.checkedPart}" ${this.interactive ? "" : "disabled"}>${escapeHTML(ch)}</button>`).join("")}</div>`;
      this.shell(boxLabel, String(this.cfg.badge || "Multiplicative structure"), body, this.checkedPart ? "Partial structure checked." : "Select a factor or partial product box to verify the grouping.");
      this.root.querySelectorAll<HTMLButtonElement>("[data-chip]").forEach((b) =>
        b.addEventListener("click", () => {
          this.checkedPart = true;
          this.emitChange(`Checked ${b.textContent}`, b.textContent);
          this.render();
        }),
      );
      return;
    }
    const cellW = 24;
    const cellH = 22;
    const width = Math.max(120, cols * cellW + 24);
    const height = Math.max(70, rows * cellH + 20);
    const rects = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (__, c) => {
        const lit = r < this.activeRows;
        return `<rect x="${12 + c * cellW}" y="${10 + r * cellH}" width="${cellW - 3}" height="${cellH - 3}" rx="4" fill="${lit ? "#1FA6A2" : "#1e293b"}" stroke="${lit ? "#F2C15B" : "#475569"}" stroke-width="1.5" />`;
      }).join(""),
    ).join("");
    const shownCount = this.activeRows * cols;
    const body = `<svg class="pm-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${rows} rows of ${cols}">${rects}</svg>
      ${this.interactive ? `<div class="pm-controls"><button type="button" class="pm-btn" id="ar-add">+1 Row (${cols})</button><button type="button" class="pm-btn alt" id="ar-all">Show All ${rows} Rows</button></div>` : ""}`;
    this.shell("Array / Area Model", `${this.activeRows} × ${cols} = ${shownCount}`, body, `Highlighted ${this.activeRows} of ${rows} rows (${shownCount} square units).`);
    this.root.getElementById("ar-add")?.addEventListener("click", () => {
      this.activeRows = this.activeRows >= rows ? 1 : this.activeRows + 1;
      this.emitChange(`${this.activeRows} rows`, shownCount);
      this.render();
    });
    this.root.getElementById("ar-all")?.addEventListener("click", () => {
      this.activeRows = rows;
      this.emitChange(`All ${rows} rows`, rows * cols);
      this.render();
    });
  }
}
registerModel("interactive-array-area", InteractiveArrayArea);

export class InteractiveFractionBar extends PublisherModelBase {
  private shaded = 1;
  private scaled = 1;
  protected onConfigChange() {
    this.shaded = Number(this.cfg.numA ?? 1);
    this.scaled = 1;
  }
  protected extraCss() {
    return `
      .fbar { display:flex; gap:3px; margin:6px 0; }
      .fseg { flex:1; min-width:24px; min-height:44px; border:2px solid #64748b; border-radius:6px; background:#0f172a; color:#f8fafc; font-weight:700; cursor:pointer; padding:2px; }
      .fseg.lit { background:#0369a1; border-color:#7dd3fc; }
      .fseg.lit-b { background:#1FA6A2; border-color:#a7f3d0; color:#09202e; }
    `;
  }
  render() {
    const mode = String(this.cfg.mode || "partition");
    const denA = Math.max(1, Math.min(16, Number(this.cfg.denA ?? 4) * this.scaled));
    const numA = Math.max(0, Math.min(denA, this.stepIndex >= 0 ? Number(this.cfg.numA ?? 1) * this.scaled : this.shaded));
    const barA = `<div class="fbar" role="group" aria-label="First fraction bar (${numA} of ${denA})">${Array.from({ length: denA }, (_, i) => `<button type="button" class="fseg ${i < numA ? "lit" : ""}" data-seg="${i + 1}" aria-pressed="${i < numA}" ${this.interactive ? "" : "disabled"}>1/${denA}</button>`).join("")}</div>`;
    let barB = "";
    if (this.cfg.denB) {
      const denB = Math.max(1, Math.min(16, Number(this.cfg.denB)));
      const numB = Math.max(0, Math.min(denB, Number(this.cfg.numB ?? 1)));
      barB = `<div class="fbar" role="group" aria-label="Second fraction bar (${numB} of ${denB})">${Array.from({ length: denB }, (_, i) => `<span class="fseg ${i < numB ? "lit-b" : ""}" style="display:flex;align-items:center;justify-content:center">${i < numB ? `1/${denB}` : ""}</span>`).join("")}</div>`;
    }
    const subBtn = this.interactive ? `<div class="pm-controls"><button type="button" class="pm-btn" id="fb-sub">${this.scaled === 1 ? "Subdivide Parts (×2)" : "Reset Splits"}</button>${mode === "ops" ? `<button type="button" class="pm-btn alt" id="fb-common">Check Equal Parts</button>` : ""}</div>` : "";
    this.shell("Interactive Fraction Bar", `${numA}/${denA}`, `${barA}${barB}${subBtn}`, `Showing ${numA} out of ${denA} equal parts.`);
    this.root.querySelectorAll<HTMLButtonElement>(".fseg[data-seg]").forEach((b) =>
      b.addEventListener("click", () => {
        this.shaded = Number(b.dataset.seg);
        this.emitChange(`Selected ${this.shaded}/${denA}`, `${this.shaded}/${denA}`);
        this.render();
      }),
    );
    this.root.getElementById("fb-sub")?.addEventListener("click", () => {
      if (this.scaled === 1 && Number(this.cfg.denA ?? 4) <= 8) {
        this.scaled = 2;
        this.shaded *= 2;
      } else {
        this.shaded = Math.max(1, Math.round(this.shaded / this.scaled));
        this.scaled = 1;
      }
      this.emitChange(`Scaled bar to ${this.shaded}/${Math.max(1, Number(this.cfg.denA ?? 4) * this.scaled)}`, this.shaded);
      this.render();
    });
    this.root.getElementById("fb-common")?.addEventListener("click", () => {
      this.emitChange("Checked common unit parts", numA);
      this.render();
    });
  }
}
registerModel("interactive-fraction-bar", InteractiveFractionBar);

export class InteractiveSignedNumberLine extends PublisherModelBase {
  private pos = 0;
  private inclusive = true;
  protected onConfigChange() {
    this.pos = Number(this.cfg.start ?? 0);
    this.inclusive = String(this.cfg.symbol || "≥").includes("≤") || String(this.cfg.symbol || "≥").includes("≥");
  }
  render() {
    const mode = String(this.cfg.mode || "op");
    const min = Number(this.cfg.min ?? -15);
    const max = Number(this.cfg.max ?? 15);
    const span = Math.max(1, max - min);
    const toX = (v: number) => 24 + ((Math.max(min, Math.min(max, v)) - min) / span) * 312;
    const xZero = toX(0);
    const xPos = toX(this.stepIndex > 0 && typeof this.cfg.target === "number" ? this.cfg.target : this.pos);
    const xStart = toX(Number(this.cfg.start ?? 0));
    const body = `<svg class="pm-svg" viewBox="0 0 360 110" role="img" aria-label="Signed number line from ${min} to ${max}">
      <line x1="20" y1="64" x2="340" y2="64" stroke="#94a3b8" stroke-width="3" />
      ${xZero >= 20 && xZero <= 340 ? `<line x1="${xZero}" y1="44" x2="${xZero}" y2="84" stroke="#F2C15B" stroke-width="2.5" /><text x="${xZero}" y="98" fill="#F2C15B" font-size="12" text-anchor="middle">0</text>` : ""}
      <text x="24" y="98" fill="#cbd5e1" font-size="11" text-anchor="middle">${min}</text>
      <text x="336" y="98" fill="#cbd5e1" font-size="11" text-anchor="middle">${max}</text>
      ${mode === "op" ? `<path d="M ${xStart} 56 Q ${(xStart + xPos) / 2} 18 ${xPos} 56" fill="none" stroke="#1FA6A2" stroke-width="3" />` : ""}
      <circle cx="${xPos}" cy="64" r="9" fill="${mode === "inequality" && !this.inclusive ? "#0f172a" : "#7dd3fc"}" stroke="#7dd3fc" stroke-width="3" />
      <text x="${xPos}" y="42" fill="#f8fafc" font-size="13" font-weight="700" text-anchor="middle">${displayNumber(this.stepIndex > 0 && typeof this.cfg.target === "number" ? Number(this.cfg.target) : this.pos)}</text>
    </svg>${this.interactive ? `<div class="pm-controls">
      <button type="button" class="pm-btn" id="sn-left">Step −1</button>
      <button type="button" class="pm-btn" id="sn-right">Step +1</button>
      ${mode === "inequality" ? `<button type="button" class="pm-btn alt" id="sn-circle">${this.inclusive ? "Switch to Open ○" : "Switch to Closed ●"}</button>` : `<button type="button" class="pm-btn alt" id="sn-jump">Jump to ${displayNumber(Number(this.cfg.target ?? 0))}</button>`}
    </div>` : ""}`;
    this.shell("Signed Number Line", `Position ${displayNumber(this.pos)}`, body, `Marker is at ${displayNumber(this.pos)} (origin 0 marked in gold).`);
    this.root.getElementById("sn-left")?.addEventListener("click", () => {
      this.pos = Math.max(min, this.pos - 1);
      this.emitChange(`Moved left to ${this.pos}`, this.pos);
      this.render();
    });
    this.root.getElementById("sn-right")?.addEventListener("click", () => {
      this.pos = Math.min(max, this.pos + 1);
      this.emitChange(`Moved right to ${this.pos}`, this.pos);
      this.render();
    });
    this.root.getElementById("sn-circle")?.addEventListener("click", () => {
      this.inclusive = !this.inclusive;
      this.emitChange(this.inclusive ? "Closed circle" : "Open circle", this.inclusive);
      this.render();
    });
    this.root.getElementById("sn-jump")?.addEventListener("click", () => {
      this.pos = Number(this.cfg.target ?? 0);
      this.emitChange(`Jumped to ${this.pos}`, this.pos);
      this.render();
    });
  }
}
registerModel("interactive-signed-number-line", InteractiveSignedNumberLine);

export class InteractiveAlgebraBalance extends PublisherModelBase {
  private balanced = false;
  private testX = 1;
  protected onConfigChange() {
    this.balanced = this.stepIndex > 0;
    this.testX = Number(this.cfg.xVal ?? 1);
  }
  protected extraCss() {
    return `.pans { display:grid; grid-template-columns:1fr 32px 1fr; gap:8px; align-items:center; } .pan { padding:10px; border:2px solid #1FA6A2; border-radius:10px; background:#0f172a; text-align:center; font-weight:700; } .eq { text-align:center; font-size:1.3rem; font-weight:800; color:#F2C15B; }`;
  }
  render() {
    const left = String(this.cfg.left || "Expression");
    const right = String(this.cfg.right || "Value");
    const actionLabel = String(this.cfg.moveLabel || "Apply Balance Step");
    const afterText = String(this.cfg.afterText || "Equivalent balanced step");
    const body = `<div class="pans"><div class="pan">${escapeHTML(left)}</div><div class="eq">=</div><div class="pan">${escapeHTML(this.balanced ? afterText : right)}</div></div>
      ${this.interactive ? `<div class="pm-controls"><button type="button" class="pm-btn" id="ab-move">${escapeHTML(actionLabel)}</button><button type="button" class="pm-btn alt" id="ab-sub">Test x = ${this.testX}</button></div>` : ""}`;
    this.shell(String(this.cfg.title || "Algebraic Balance"), `Test x = ${this.testX}`, body, this.balanced ? `Balanced transformation applied: ${afterText}.` : "Keep both sides balanced using inverse or equivalent operations.");
    this.root.getElementById("ab-move")?.addEventListener("click", () => {
      this.balanced = true;
      this.emitChange(`Applied ${actionLabel}`, afterText);
      this.render();
    });
    this.root.getElementById("ab-sub")?.addEventListener("click", () => {
      this.testX = this.testX >= 5 ? 1 : this.testX + 1;
      this.emitChange(`Tested x = ${this.testX}`, this.testX);
      this.render();
    });
  }
}
registerModel("interactive-algebra-balance", InteractiveAlgebraBalance);

export class InteractiveGeometryBoard extends PublisherModelBase {
  private highlight = false;
  protected onConfigChange() {
    this.highlight = this.stepIndex > 0;
  }
  render() {
    const mode = String(this.cfg.mode || "shape");
    const label = String(this.cfg.summary || "Inspect geometric attributes");
    let svgInner = `<rect x="40" y="24" width="120" height="72" fill="none" stroke="#7dd3fc" stroke-width="3" />`;
    if (mode === "angle") {
      svgInner = `<line x1="40" y1="95" x2="310" y2="95" stroke="#94a3b8" stroke-width="3" /><line x1="175" y1="95" x2="255" y2="30" stroke="#7dd3fc" stroke-width="3" /><path d="M 215 95 A 40 40 0 0 0 202 71" fill="none" stroke="#1FA6A2" stroke-width="3" />`;
    } else if (mode === "pythagorean" || mode === "triangle") {
      svgInner = `<polygon points="75,98 75,24 245,98" fill="${this.highlight ? "rgba(31,166,162,0.22)" : "none"}" stroke="#7dd3fc" stroke-width="3" /><rect x="75" y="84" width="14" height="14" fill="none" stroke="#F2C15B" stroke-width="2" />`;
    } else if (mode === "circle") {
      svgInner = `<circle cx="170" cy="60" r="46" fill="${this.highlight ? "rgba(31,166,162,0.18)" : "none"}" stroke="#7dd3fc" stroke-width="3" /><line x1="170" y1="60" x2="216" y2="60" stroke="#F2C15B" stroke-width="3" />`;
    } else if (mode === "coord" || mode === "transform") {
      svgInner = `<line x1="180" y1="10" x2="180" y2="110" stroke="#64748b" stroke-width="2" /><line x1="40" y1="60" x2="320" y2="60" stroke="#64748b" stroke-width="2" /><circle cx="235" cy="36" r="7" fill="#1FA6A2" />${this.highlight ? `<circle cx="125" cy="84" r="7" fill="#F2C15B" />` : ""}`;
    } else if (mode === "clock") {
      svgInner = `<circle cx="175" cy="60" r="44" fill="#0f172a" stroke="#7dd3fc" stroke-width="3" /><line x1="175" y1="60" x2="175" y2="32" stroke="#F2C15B" stroke-width="3" /><line x1="175" y1="60" x2="205" y2="60" stroke="#1FA6A2" stroke-width="2.5" />`;
    }
    const body = `<svg class="pm-svg" viewBox="0 0 360 120" role="img" aria-label="${escapeHTML(label)}">${svgInner}<text x="180" y="114" fill="#cbd5e1" font-size="11" text-anchor="middle">${escapeHTML(label)}</text></svg>
      ${this.interactive ? `<div class="pm-controls"><button type="button" class="pm-btn" id="gb-toggle">${this.highlight ? "Clear Measure Highlight" : "Highlight Key Measure"}</button></div>` : ""}`;
    this.shell("Geometry & Measurement Board", String(this.cfg.badge || mode), body, this.highlight ? `Highlighted relation: ${label}.` : label);
    this.root.getElementById("gb-toggle")?.addEventListener("click", () => {
      this.highlight = !this.highlight;
      this.emitChange(`Toggled measure highlight`, this.highlight);
      this.render();
    });
  }
}
registerModel("interactive-geometry-board", InteractiveGeometryBoard);

export class InteractiveDataBoard extends PublisherModelBase {
  private sorted = false;
  protected onConfigChange() {
    this.sorted = this.stepIndex > 0;
  }
  render() {
    const mode = String(this.cfg.mode || "stats");
    const values: number[] = Array.isArray(this.cfg.values) ? this.cfg.values.map(Number) : [2, 4, 6];
    const shown = this.sorted ? [...values].sort((a, b) => a - b) : values;
    const maxV = Math.max(1, ...shown.map((v) => Math.abs(v)));
    const bars = shown.slice(0, 8).map((v, i) => {
      const h = Math.max(12, Math.round((Math.abs(v) / maxV) * 68));
      return `<rect x="${20 + i * 38}" y="${86 - h}" width="26" height="${h}" rx="4" fill="${i % 2 ? "#1FA6A2" : "#0369a1"}" /><text x="${33 + i * 38}" y="102" fill="#f8fafc" font-size="11" text-anchor="middle">${displayNumber(v)}</text>`;
    }).join("");
    const body = `<svg class="pm-svg" viewBox="0 0 350 112" role="img" aria-label="Data chart">${bars}</svg>
      ${this.interactive ? `<div class="pm-controls"><button type="button" class="pm-btn" id="db-sort">${this.sorted ? "Show Original Order" : mode === "probability" ? "Compare Part to Total" : "Order / Inspect Data"}</button></div>` : ""}`;
    this.shell("Data & Probability Board", `${shown.length} values`, body, this.sorted ? `Ordered values: ${shown.join(", ")}` : `Inspecting ${String(this.cfg.summary || "dataset distribution")}.`);
    this.root.getElementById("db-sort")?.addEventListener("click", () => {
      this.sorted = !this.sorted;
      this.emitChange(`Inspected data order`, shown);
      this.render();
    });
  }
}
registerModel("interactive-data-board", InteractiveDataBoard);

export const LAB_TRANSITIONS: Record<LabState, LabState[]> = {
  UNINITIALIZED: ["PRESENTATION"],
  PRESENTATION: ["EVALUATING"],
  EVALUATING: ["PRESENTATION", "SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN", "MASTERY_COMMITTED"],
  SCAFFOLD_L1_PROMPT: ["EVALUATING"],
  SCAFFOLD_L2_BREAKDOWN: ["PRESENTATION", "RESOLVED_EXPLANATION"],
  RESOLVED_EXPLANATION: ["PRESENTATION"],
  MASTERY_COMMITTED: ["PRESENTATION"],
};
export const canTransitionLabState = (from: LabState, to: LabState): boolean =>
  Boolean(LAB_TRANSITIONS[from]?.includes(to));
const transitions = LAB_TRANSITIONS;
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
  private modelCompleted: boolean;
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
    this.modelCompleted = false;
    this.subValue = "";
  }
  private isRatioModel(schema: ExerciseSchema = this.exercise) {
    return (
      schema.modelComponent === "interactive-ratio-tape" ||
      schema.modelComponent === "interactive-double-number-line"
    );
  }
  loadExercise(schema: ExerciseSchema) {
    const ratioModel = schema ? this.isRatioModel(schema) : false;
    if (
      !schema ||
      !PUBLISHER_MODEL_TAGS.includes(schema.modelComponent) ||
      (!schema.evaluateAnswer &&
        (ratioModel
          ? !Number.isFinite(Number(schema.correctAnswer))
          : !String(schema.correctAnswer ?? "").trim())) ||
      !schema.modelConfig ||
      (ratioModel &&
        (![schema.modelConfig.trackAUnits, schema.modelConfig.trackBUnits].every(
          (n) => Number.isInteger(n) && n >= 1 && n <= 24,
        ) ||
          !Number.isFinite(schema.modelConfig.unitVal) ||
          schema.modelConfig.unitVal <= 0))
    )
      throw Error("Invalid exercise");
    this.exercise = schema;
    this.attempts = 0;
    this.studentInput = "";
    this.detected = undefined;
    this.distractorInput = "";
    this.modelValues = { selectedA: 0, selectedB: 0 };
    this.modelCompleted = false;
    this.subValue = "";
    this.state = "UNINITIALIZED";
    this.transition("PRESENTATION");
  }
  getSnapshot(): LabSnapshot | null {
    if (!["PRESENTATION", "SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN"].includes(this.state)) return null;
    return {
      exerciseId: this.exercise.id,
      state: this.state as LabSnapshot["state"],
      attempts: this.attempts,
      misconceptionId: this.detected?.id || null,
      selectedA: this.modelValues.selectedA,
      selectedB: this.modelValues.selectedB,
    };
  }
  restoreSnapshot(snapshot: LabSnapshot) {
    if (!snapshot || snapshot.exerciseId !== this.exercise.id || !["PRESENTATION", "SCAFFOLD_L1_PROMPT", "SCAFFOLD_L2_BREAKDOWN"].includes(snapshot.state) || !Number.isInteger(snapshot.attempts) || snapshot.attempts < 0 || snapshot.attempts > 99) return false;
    const c = this.exercise.modelConfig;
    if (![snapshot.selectedA, snapshot.selectedB].every(Number.isInteger) || snapshot.selectedA < 0 || snapshot.selectedA > c.trackAUnits || snapshot.selectedB < 0 || snapshot.selectedB > c.trackBUnits) return false;
    if ((snapshot.state === "SCAFFOLD_L1_PROMPT" && snapshot.attempts !== 1) || (snapshot.state === "SCAFFOLD_L2_BREAKDOWN" && snapshot.attempts < 2)) return false;
    this.attempts = snapshot.attempts;
    this.detected = this.exercise.misconceptions.find((rule) => rule.id === snapshot.misconceptionId);
    this.modelValues = { selectedA: snapshot.selectedA, selectedB: snapshot.selectedB };
    this.modelCompleted = snapshot.selectedA > 0 || snapshot.selectedB > 0;
    this.studentInput = "";
    this.subValue = "";
    this.state = snapshot.state;
    this.render();
    if (this.state === "SCAFFOLD_L2_BREAKDOWN") {
      const heading = this.root.querySelector<HTMLElement>("#scaffold-heading");
      if (heading) heading.tabIndex = -1;
    }
    return true;
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
    if (next === "RESOLVED_EXPLANATION") {
      this.host.dispatchEvent(
        new CustomEvent("fluency-resolution", {
          detail: {
            exerciseId: this.exercise.id,
            attempts: this.attempts,
            misconceptionId: this.detected?.id || null,
            correct: false,
          },
        }),
      );
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
    let correct: boolean;
    try {
      correct = this.exercise.evaluateAnswer
        ? this.exercise.evaluateAnswer(this.studentInput)
        : mathAnswersMatch(this.studentInput, this.exercise.correctAnswer, this.exercise.responseType);
    } catch {
      this.transition("PRESENTATION");
      this.root.getElementById("announcement")!.textContent =
        "Unable to check this answer. Try again.";
      return;
    }
    const detected = correct
      ? undefined
      : this.exercise.misconceptions.find((rule) =>
          rule.detect(this.studentInput, {
            expected: this.exercise.correctAnswer,
            modelConfig: this.exercise.modelConfig,
          }),
        );
    this.host.dispatchEvent(
      new CustomEvent("fluency-attempt", {
        detail: {
          exerciseId: this.exercise.id,
          attempt: this.attempts + 1,
          correct,
          misconceptionId: detected?.id || null,
          // The response stays in memory. The mastery receipt never persists it.
          response: this.studentInput,
        },
      }),
    );
    if (correct) {
      this.transition("MASTERY_COMMITTED");
      return;
    }
    this.attempts++;
    if (detected) {
      this.detected = detected;
      this.distractorInput = this.studentInput;
    }
    if (this.attempts > 1) {
      this.modelValues = { selectedA: 0, selectedB: 0 };
      this.modelCompleted = false;
    }
    this.transition(
      this.attempts === 1
        ? "SCAFFOLD_L1_PROMPT"
        : "SCAFFOLD_L2_BREAKDOWN",
    );
    if (this.state === "SCAFFOLD_L1_PROMPT") {
      if (this.isRatioModel()) {
        this.root
          .querySelector<InteractiveRatioTape>(
            "interactive-ratio-tape,interactive-double-number-line",
          )
          ?.highlightError(this.detected?.tag === "INVERTED_RATIO" ? "B" : "A");
      } else {
        const domainModel = this.root.querySelector<PublisherModelBase>(
          PUBLISHER_MODEL_TAGS.slice(2).join(","),
        );
        domainModel?.highlightError(
          this.detected?.conceptualAnchor || "Inspect the quantities shown in the model.",
        );
      }
    }
  }
  model(): HTMLElement {
    if (this.isRatioModel()) {
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
    const el = document.createElement(this.exercise.modelComponent) as PublisherModelBase;
    el.setAttribute("config", JSON.stringify(this.exercise.modelSpec || {}));
    el.setAttribute("interactive", "true");
    el.addEventListener("model-change", (event) => {
      const detail = (event as CustomEvent).detail || {};
      this.modelCompleted = Boolean(detail.completed);
      this.updateSandbox();
    });
    return el;
  }
  updateSandbox() {
    if (this.state !== "SCAFFOLD_L2_BREAKDOWN") return;
    const c = this.exercise.modelConfig;
    const expected = this.detected?.remediationStep.expectedSubValue || String(c.unitVal);
    const ready = this.isRatioModel()
      ? this.modelValues.selectedA === c.trackAUnits &&
        this.modelValues.selectedB === c.trackBUnits &&
        Number(this.subValue) === Number(expected)
      : this.modelCompleted && mathAnswersMatch(this.subValue, expected, "text");
    const button = this.root.getElementById("sandbox-next") as HTMLButtonElement | null;
    if (button) button.disabled = !ready;
    const retry = this.root.getElementById("sandbox-retry") as HTMLButtonElement | null;
    if (retry) retry.disabled = !ready;
    const status = this.root.getElementById("sandbox-status");
    if (status)
      status.textContent = ready
        ? this.isRatioModel()
          ? "Both quantities are modeled. Continue to the explanation."
          : "Model verified. Continue to the explanation or retry the problem."
        : this.isRatioModel()
          ? "Select every segment on both tracks and enter the value of one segment."
          : "Interact with the model above and enter your check value.";
  }
  private triggerSibling() {
    const e = this.exercise;
    const nextIdx = ++this.sibling;
    const schema = makeSibling(e, nextIdx);
    const event = new CustomEvent("fluency-sibling-request", {
      detail: { sourceExercise: e, siblingIndex: nextIdx, schema },
      bubbles: true,
      cancelable: true,
    });
    if (this.host.dispatchEvent(event)) {
      this.loadExercise(schema);
    }
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
        hint.innerHTML = formatMath(
          this.detected?.conceptualAnchor ||
            (this.isRatioModel()
              ? "Check the equal segment value and the order of the quantities."
              : "Check the relationship and equal groups shown in the model."),
        );
        content.append(hint);
      }
      if (e.choices?.length) {
        const grid = document.createElement("div");
        grid.className = "choices-grid";
        grid.setAttribute("role", "group");
        grid.setAttribute("aria-label", "Answer choices");
        if (this.state === "SCAFFOLD_L1_PROMPT") grid.setAttribute("aria-describedby", "conceptual-hint");
        grid.innerHTML = e.choices
          .map((choice) => {
            const wasWrong = this.state === "SCAFFOLD_L1_PROMPT" && this.studentInput === choice;
            return `<button type="button" class="choice-btn ${wasWrong ? "is-wrong" : ""}" data-choice="${escapeHTML(choice)}" aria-pressed="false">${formatMath(choice)}</button>`;
          })
          .join("");
        content.append(grid);
        const btns = [...grid.querySelectorAll<HTMLButtonElement>(".choice-btn")];
        btns.forEach((btn, idx) => {
          btn.onclick = () => this.submit(btn.dataset.choice || "");
          btn.onkeydown = (ev) => {
            if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
              ev.preventDefault();
              btns[(idx + 1) % btns.length]?.focus();
            } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
              ev.preventDefault();
              btns[(idx - 1 + btns.length) % btns.length]?.focus();
            }
          };
        });
        if (this.state === "SCAFFOLD_L1_PROMPT") btns[0]?.focus();
      } else {
        const isNum = !e.responseType || e.responseType === "number" || e.responseType === "fraction";
        const helpMsg =
          e.responseType === "fraction"
            ? "Enter a fraction or mixed number (for example 3/4 or 1 1/2)."
            : e.responseType === "expression"
              ? "Enter an algebraic expression (for example 8x + 48)."
              : e.responseType === "inequality"
                ? "Enter an inequality (for example c <= 35 or c ≤ 35)."
                : e.responseType === "order"
                  ? "Separate values with commas from least to greatest."
                  : e.responseType === "text"
                    ? "Enter your response."
                    : "Enter a number.";
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `<label for="answer">Your answer</label><input id="answer" inputmode="${isNum ? "decimal" : "text"}" autocomplete="off" placeholder="${escapeHTML(e.inputPlaceholder || "")}" aria-describedby="answer-help${this.state === "SCAFFOLD_L1_PROMPT" ? " conceptual-hint" : ""}" value="${escapeHTML(this.studentInput)}"><button id="check" type="button">Check answer</button><span id="answer-help" class="muted">${helpMsg}</span>`;
        content.append(row);
        row.querySelector<HTMLButtonElement>("#check")!.onclick = () =>
          this.submit(row.querySelector<HTMLInputElement>("#answer")!.value);
        row.querySelector<HTMLInputElement>("#answer")!.onkeydown = (event) => {
          if (event.key === "Enter") this.submit((event.currentTarget as HTMLInputElement).value);
        };
        if (this.state === "SCAFFOLD_L1_PROMPT")
          row.querySelector<HTMLInputElement>("#answer")!.focus();
      }
    } else if (this.state === "SCAFFOLD_L2_BREAKDOWN") {
      const r = this.detected?.remediationStep;
      const p = document.createElement("h3");
      p.className = "hint";
      p.id = "scaffold-heading";
      p.textContent = r?.scaffoldPrompt || (this.isRatioModel() ? "Build both quantities using equal-value segments." : "Explore the interactive model and answer the check question.");
      content.append(p, this.model());
      const sub = document.createElement("div");
      sub.className = "row";
      sub.innerHTML = `<label for="sub-answer">${escapeHTML(r?.targetSubQuestion || "Check value")}</label><input id="sub-answer" inputmode="text" autocomplete="off" aria-describedby="sandbox-status">`;
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
      content.innerHTML = `<h3>Core conceptual rule</h3><p>${formatMath(e.fullExplanation.keyRule)}</p><h3>Step-by-step model and solution</h3><div id="steps"></div><h3>Why that answer was tempting</h3><p>${formatMath(this.detected?.tag === "ADDITIVE_THINKING" ? e.fullExplanation.distractorAnalysis : this.detected?.tag === "INVERTED_RATIO" ? `An answer of ${this.distractorInput} treats ${e.modelConfig.trackAUnits} ${e.modelConfig.trackALabel.toLowerCase()} as the unknown quantity's parts. The ${e.modelConfig.trackBUnits} ${e.modelConfig.trackBLabel.toLowerCase()} parts must each receive the same segment value.` : this.detected?.conceptualAnchor || e.fullExplanation.distractorAnalysis)}</p><div class="row"><button id="sibling" type="button">Try an isomorphic problem</button></div>`;
      const steps = content.querySelector("#steps")!;
      e.fullExplanation.stepByStep.forEach((step) => {
        const item = document.createElement("div");
        item.className = "card";
        item.innerHTML = `<strong>Step ${step.stepNumber}</strong><p>${formatMath(step.instruction)}</p><p class="math-line">${formatMath(step.mathExpression)}</p>`;
        const visual = this.model();
        visual.setAttribute("interactive", "false");
        if (this.isRatioModel()) {
          const rVisual = visual as InteractiveRatioTape;
          rVisual.selectedA = e.modelConfig.trackAUnits;
          rVisual.selectedB = step.stepNumber === 1 ? 0 : e.modelConfig.trackBUnits;
        } else {
          (visual as PublisherModelBase).setStepState?.(step.stepNumber - 1);
        }
        item.append(visual);
        steps.append(item);
      });
      content.querySelector<HTMLButtonElement>("#sibling")!.onclick = () => this.triggerSibling();
    } else if (this.state === "MASTERY_COMMITTED") {
      content.innerHTML = `<h3>Practice complete</h3><p>You solved this problem in ${this.attempts + 1} ${this.attempts === 0 ? "attempt" : "attempts"}.</p><button id="next" type="button">Try another</button>`;
      content.querySelector<HTMLButtonElement>("#next")!.onclick = () => this.triggerSibling();
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
  if (source.siblingSpec) {
    const shift = (index % 4) + 1;
    const sp = source.siblingSpec;
    let nextQ = "";
    let nextA = "";
    let nextChoices: string[] | undefined;
    if (sp.template === "binary" && typeof sp.a === "number" && typeof sp.b === "number") {
      const a = sp.a + shift;
      const b = sp.op === "−" ? sp.b : sp.b + (sp.keepB ? 0 : 1);
      const ans =
        sp.op === "+"
          ? a + b
          : sp.op === "−"
            ? Math.max(0, a - b)
            : sp.op === "×"
              ? a * b
              : Math.round((a / Math.max(1, b)) * 1000) / 1000;
      if (sp.op === "−" && a < b) {
        const na = b + shift + 2;
        nextQ = `${na} − ${b} = ?`;
        nextA = String(na - b);
      } else if (sp.op === "÷") {
        const divisor = Math.max(2, sp.b);
        const quotient = Math.max(2, Math.round(sp.a / divisor) + shift);
        nextQ = `${quotient * divisor} ÷ ${divisor} = ?`;
        nextA = String(quotient);
      } else {
        nextQ = `${a} ${sp.op} ${b} = ?`;
        nextA = displayNumber(ans);
      }
    } else if (sp.template === "fractionOp" && typeof sp.n1 === "number" && typeof sp.d1 === "number" && typeof sp.n2 === "number" && typeof sp.d2 === "number") {
      const n1 = Math.max(1, Math.min(sp.d1 - 1, ((sp.n1 + shift - 1) % Math.max(1, sp.d1 - 1)) + 1));
      const d1 = sp.d1;
      const n2 = sp.n2;
      const d2 = sp.d2;
      const op = String(sp.op || "+");
      nextQ = `${n1}/${d1} ${op} ${n2}/${d2} = ?`;
      if (op === "+") nextA = simplifyFraction(n1 * d2 + n2 * d1, d1 * d2);
      else if (op === "−" || op === "-") nextA = simplifyFraction(n1 * d2 - n2 * d1, d1 * d2);
      else if (op === "×") nextA = simplifyFraction(n1 * n2, d1 * d2);
      else nextA = simplifyFraction(n1 * d2, d1 * n2);
    } else if (sp.template === "solve" && typeof sp.coeff === "number" && typeof sp.k === "number" && typeof sp.xVal === "number") {
      const nx = sp.xVal + shift;
      const rhs = sp.coeff * nx + sp.k;
      const sign = sp.k >= 0 ? `+ ${sp.k}` : `− ${Math.abs(sp.k)}`;
      nextQ = sp.coeff === 1 ? `x ${sign} = ${rhs}. Find x.` : `${sp.coeff}x ${sign} = ${rhs}. Find x.`;
      nextA = String(nx);
    } else if (sp.template === "compare" && typeof sp.a === "number" && typeof sp.b === "number") {
      const a = sp.a + shift * 2;
      const b = sp.b + shift;
      nextQ = `${a} ___ ${b}`;
      nextA = a > b ? ">" : a < b ? "<" : "=";
      nextChoices = ["<", "=", ">"];
    } else if (sp.template === "integerOp" && typeof sp.a === "number" && typeof sp.b === "number") {
      const a = sp.a >= 0 ? sp.a + shift : sp.a - shift;
      const b = sp.b;
      const op = String(sp.op || "+");
      const bDisp = b < 0 ? `(${b})` : String(b);
      nextQ = `${a} ${op} ${bDisp} = ?`;
      const res = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / (b || 1);
      nextA = displayNumber(res);
    } else if (sp.template === "sequence" && Array.isArray(sp.seq) && typeof sp.step === "number") {
      const stepDelta = sp.step as number;
      const shifted = sp.seq.map((v: number) => v + stepDelta * shift);
      nextQ = `${shifted.join(", ")}, ___`;
      nextA = String(shifted[shifted.length - 1] + stepDelta);
    } else if (sp.template === "angle" && typeof sp.targetTotal === "number" && typeof sp.given === "number") {
      const given = Math.min(sp.targetTotal - 5, Math.max(5, sp.given + shift * 3));
      nextQ = sp.targetTotal === 180
        ? `Two supplementary angles include one angle that measures ${given}°. What is the other angle?`
        : `Two complementary angles include one angle that measures ${given}°. What is the other angle?`;
      nextA = String(sp.targetTotal - given);
    } else if (sp.template === "probability" && typeof sp.fav === "number" && typeof sp.total === "number") {
      const scale = shift + 1;
      const fav = sp.fav * scale;
      const total = sp.total * scale;
      nextQ = `${fav} of ${total} equal sections are winning sections. What is P(win)?`;
      nextA = simplifyFraction(fav, total);
    } else if (sp.template === "scale" && typeof sp.scale === "number" && typeof sp.draw === "number") {
      const draw = sp.draw + shift;
      nextQ = `A scale drawing uses 1 cm to represent ${sp.scale} m. A wall is ${draw} cm long in the drawing. How long is the real wall in meters?`;
      nextA = String(draw * sp.scale);
    }
    if (nextQ && nextA) {
      const rebuilt = adaptPracticeItem({
        question: nextQ,
        answers: [nextA],
        choices: nextChoices || source.choices,
        kind: source.responseType,
        skill: {
          grade: Number(sp.grade ?? 5),
          id: String(sp.skillId ?? "fluency"),
          standard: source.standard,
          generator: String(sp.generator ?? ""),
        },
        tier: source.tier,
      });
      if (rebuilt) {
        return {
          ...rebuilt,
          id: `${source.id.split("_S")[0]}_S${index}`,
          siblingBaseUnit: baseUnit,
        };
      }
    }
  }
  if (source.siblingKind === "UNIT_RATE") {
    const total = displayNumber(c.trackAUnits * unit);
    const sibling = adaptUnitRateItem({
      question: `${total} dollars for ${c.trackAUnits} items: what is the unit rate?`,
      answers: [displayNumber(unit)],
      skill: { standard: source.standard },
      tier: source.tier,
    });
    if (!sibling) throw Error("Unable to generate unit-rate sibling");
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
    if (!sibling) throw Error("Unable to generate percent sibling");
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
    if (!sibling) throw Error("Unable to generate percent-whole sibling");
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

export function adaptProportionItem(
  item: {
    question: string;
    answers: string[];
    skill?: { standard?: string };
    tier?: number;
    meta?: { wrong?: Array<{ text: string; why: string }> };
  },
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  const forward = item.question.match(
    /^Solve the proportion:\s*(\d+)\s*\/\s*(\d+)\s*=\s*(\d+)\s*\/\s*x\.?$/i,
  );
  const reverse = item.question.match(
    /^(\d+)\s*\/\s*(\d+)\s*=\s*x\s*\/\s*(\d+)\.\s*Find x\.$/i,
  );
  const match = forward || reverse;
  if (!match || !item.answers?.length) return null;
  const [, first, second, scaled] = match;
  const a = Number(first);
  const b = Number(second);
  const c = Number(scaled);
  const knownParts = forward ? a : b;
  const unknownParts = forward ? b : a;
  const unitVal = c / knownParts;
  if (
    !Number.isInteger(knownParts) || !Number.isInteger(unknownParts) ||
    knownParts < 1 || unknownParts < 1 || knownParts > 24 || unknownParts > 24 ||
    !Number.isInteger(unitVal) || unitVal <= 0 || unknownParts * unitVal !== Number(item.answers[0])
  )
    return null;
  const tier = Math.max(1, Math.min(4, Number(item.tier) || 2)) as 1 | 2 | 3 | 4;
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
  const authoredRules: MisconceptionRule[] = (item.meta?.wrong || [])
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

export function adaptEquivalentRatioItem(
  item: {
    question: string;
    answers: string[];
    skill?: { standard?: string };
    tier?: number;
  },
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  const secondUnknown = item.question.match(/^(\d+):(\d+)\s*=\s*(\d+):□\.?$/);
  const firstUnknown = item.question.match(/^(\d+):(\d+)\s*=\s*□:(\d+)\.?$/);
  const match = secondUnknown || firstUnknown;
  if (!match || !item.answers?.length) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const scaled = Number(match[3]);
  const knownParts = secondUnknown ? a : b;
  const unknownParts = secondUnknown ? b : a;
  const unitVal = scaled / knownParts;
  if (
    ![knownParts, unknownParts].every((n) => Number.isInteger(n) && n >= 1 && n <= 24) ||
    !Number.isInteger(unitVal) || unitVal <= 0 || unknownParts * unitVal !== Number(item.answers[0])
  ) return null;
  const tier = Math.max(1, Math.min(4, Number(item.tier) || 2)) as 1 | 2 | 3 | 4;
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

export function adaptUnitRateItem(
  item: {
    question: string;
    answers: string[];
    skill?: { standard?: string };
    tier?: number;
  },
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  const authored = item.question.match(/^([\d.]+) dollars for (\d+) items: what is the unit rate\?$/i);
  const legacy = item.question.match(/^([\d.]+) for (\d+) items\. How much for 1 item\?$/i);
  const match = authored || legacy;
  if (!match || !item.answers?.length) return null;
  const total = Number(match[1]);
  const count = Number(match[2]);
  const unit = total / count;
  const expected = Number(item.answers[0]);
  if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(count) || count < 2 || count > 24 || !Number.isFinite(unit) || unit <= 0 || !Number.isFinite(expected) || Math.abs(unit - expected) > 1e-9) return null;
  const tier = Math.max(1, Math.min(4, Number(item.tier) || 2)) as 1 | 2 | 3 | 4;
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

export function adaptPercentPartItem(
  item: {
    question: string;
    answers: string[];
    skill?: { standard?: string };
    tier?: number;
  },
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  const direct = item.question.match(/^(?:Find|What is) (\d+)% of ([\d.]+)[.?]$/i);
  const missing = item.question.match(/^(\d+)% of ([\d.]+) is x\. Find x\.$/i);
  const match = direct || missing;
  if (!match || !item.answers?.length) return null;
  const percent = Number(match[1]);
  const whole = Number(match[2]);
  if (!Number.isInteger(percent) || percent <= 0 || percent > 100 || !Number.isFinite(whole) || whole <= 0) return null;
  const { part: selectedParts, whole: wholeParts } = percentParts(percent);
  if (wholeParts > 24 || selectedParts > 24) return null;
  const unit = whole / wholeParts;
  const answer = selectedParts * unit;
  const expected = Number(item.answers[0]);
  if (!Number.isFinite(expected) || Math.abs(answer - expected) > 1e-9) return null;
  const tier = Math.max(1, Math.min(4, Number(item.tier) || 2)) as 1 | 2 | 3 | 4;
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

export function adaptPercentWholeItem(
  item: {
    question: string;
    answers: string[];
    skill?: { standard?: string };
    tier?: number;
  },
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  const match = item.question.match(/^([\d.]+) is (\d+)% of what number\?$/i);
  if (!match || !item.answers?.length) return null;
  const part = Number(match[1]);
  const percent = Number(match[2]);
  if (!Number.isFinite(part) || part <= 0 || !Number.isInteger(percent) || percent <= 0 || percent >= 100) return null;
  const { part: partSegments, whole: wholeSegments } = percentParts(percent);
  if (partSegments > 24 || wholeSegments > 24) return null;
  const unit = part / partSegments;
  const whole = wholeSegments * unit;
  const expected = Number(item.answers[0]);
  if (!Number.isFinite(expected) || Math.abs(whole - expected) > 1e-9) return null;
  const tier = Math.max(1, Math.min(4, Number(item.tier) || 2)) as 1 | 2 | 3 | 4;
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

const hashId = (text: string): string => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase();
};

const extractNums = (text: string): number[] =>
  (String(text || "").replaceAll("−", "-").replace(/(\d),(?=\d{3}\b)/g, "$1").match(/-?\d+(?:\.\d+)?/g) || [])
    .map(Number)
    .filter(Number.isFinite);

const extractFractions = (text: string): Array<{ n: number; d: number; raw: string }> => {
  const out: Array<{ n: number; d: number; raw: string }> = [];
  const re = /(-?\d+)\s*\/\s*(\d+)/g;
  const clean = String(text || "").replaceAll("−", "-");
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const n = Number(m[1]);
    const d = Number(m[2]);
    if (d !== 0) out.push({ n, d, raw: `${n}/${d}` });
  }
  return out;
};

const responseTypeOf = (item: PracticeItemInput): PublisherResponseType => {
  if (item.choices?.length) return "choice";
  if (item.kind === "fraction") return "fraction";
  if (item.kind === "expression") return "expression";
  if (item.kind === "inequality") return "inequality";
  if (item.kind === "order") return "order";
  if (item.kind === "text") return "text";
  const ans = String(item.answers?.[0] ?? "").trim();
  if (/^-?\d+\s+\d+\/\d+$|^-?\d+\/\d+$/.test(ans)) return "fraction";
  if (/^\(.+,.+\)$/.test(ans)) return "text";
  return Number.isFinite(Number(ans.replaceAll("−", "-").replaceAll(",", ""))) ? "number" : "text";
};

const mergeMisconceptions = (
  item: PracticeItemInput,
  domainRules: MisconceptionRule[],
): MisconceptionRule[] => {
  const bankRules: MisconceptionRule[] = (item.meta?.wrong || []).slice(0, 3).map((w, idx) => ({
    id: `M_BANK_${idx}`,
    tag: "WHOLE_AS_PART",
    detect: (raw) => mathAnswersMatch(raw, w.text, responseTypeOf(item)),
    conceptualAnchor: w.why,
    remediationStep: {
      scaffoldPrompt: w.why,
      targetSubQuestion: "Check the correct value after using the interactive model.",
      expectedSubValue: String(item.answers[0] ?? ""),
    },
  }));
  return [...bankRules, ...domainRules];
};

function buildDomainSchema(
  item: PracticeItemInput,
  spec: {
    prefix: string;
    modelComponent: PublisherModelTag;
    modelSpec: Record<string, unknown>;
    misconceptions?: MisconceptionRule[];
    keyRule: string;
    steps?: Array<{ instruction: string; mathExpression: string }>;
    distractorAnalysis: string;
    subQuestion?: string;
    subExpected?: string;
    siblingSpec?: Record<string, unknown>;
    placeholder?: string;
  },
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema {
  const correct = String(item.answers?.[0] ?? item.displayAnswer ?? "").trim();
  const rType = responseTypeOf(item);
  const tierVal = item.tier === 1 || item.tier === 2 || item.tier === 3 || item.tier === 4 ? item.tier : 2;
  const fallbackSteps = (item.steps?.length ? item.steps : [item.hint || spec.keyRule]).slice(0, 3).map((s, idx, arr) => ({
    stepNumber: idx + 1,
    instruction: String(s),
    mathExpression: idx === arr.length - 1 ? `Result: ${correct}` : String(item.question),
  }));
  const stepByStep = (spec.steps?.length ? spec.steps : fallbackSteps).map((s, i) => ({
    stepNumber: i + 1,
    instruction: s.instruction,
    mathExpression: s.mathExpression,
  }));
  const defaultRule: MisconceptionRule = {
    id: `M_${spec.prefix}_CHECK`,
    tag: "WHOLE_AS_PART",
    detect: () => true,
    conceptualAnchor: item.hint || spec.keyRule,
    remediationStep: {
      scaffoldPrompt: `Use the interactive model above, then confirm the key step.`,
      targetSubQuestion: spec.subQuestion || "Enter the correct answer to continue.",
      expectedSubValue: spec.subExpected ?? correct,
    },
  };
  return {
    id: `${spec.prefix}_${hashId(item.question)}`,
    standard: item.skill?.standard || "CCSS",
    tier: tierVal,
    prompt: item.question,
    modelComponent: spec.modelComponent,
    modelConfig: {
      trackALabel: "Quantity A",
      trackAUnits: 2,
      trackBLabel: "Quantity B",
      trackBUnits: 3,
      unitVal: 1,
    },
    modelSpec: spec.modelSpec,
    responseType: rType,
    choices: item.choices || undefined,
    inputPlaceholder: spec.placeholder,
    correctAnswer: correct,
    evaluateAnswer:
      evaluateAnswer || ((raw: string) => (item.answers || [correct]).some((a) => mathAnswersMatch(raw, a, rType))),
    siblingSpec: spec.siblingSpec,
    misconceptions: mergeMisconceptions(item, [...(spec.misconceptions || []), defaultRule]),
    fullExplanation: {
      keyRule: spec.keyRule,
      stepByStep,
      distractorAnalysis: spec.distractorAnalysis,
    },
  };
}

function adaptDomainFamily(
  item: PracticeItemInput,
  gen: string,
  skillId: string,
  grade: number,
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  const q = String(item.question || "").trim();
  const ans = String(item.answers?.[0] ?? item.displayAnswer ?? "").trim();
  if (!q || !ans) return null;
  const cleanQ = q.replaceAll("−", "-");
  const nums = extractNums(cleanQ);
  const fracs = extractFractions(cleanQ);
  const symMatch = /^(.+?)\s*([+\-*×÷]|−)\s*(.+?)\s*=\s*\??$/i.exec(q);

  // 1. Counting, sequence, ten-frame, subitizing, patterns, small K-2 add/sub, missing addend, hidden parts, even/odd, doubles
  if (
    ["sequence", "countSet", "subitize", "makeTarget", "missingAddend", "pattern", "hiddenParts", "evenOdd", "doublesNear"].includes(gen) ||
    (gen === "fact" && grade <= 2 && !["add-100", "subtract-100", "add-1000"].includes(skillId))
  ) {
    const mode =
      gen === "sequence"
        ? "sequence"
        : gen === "pattern"
          ? "pattern"
          : gen === "subitize"
            ? "subitize"
            : q.includes("−") || q.includes("-") || gen === "missingAddend" || gen === "hiddenParts"
              ? "takeAway"
              : "join";
    const ansNum = Number(ans.replaceAll("−", "-"));
    const a = nums[0] ?? 5;
    const b = nums[1] ?? Math.abs(ansNum);
    const seqNums = gen === "sequence" ? nums.slice(0, 5) : undefined;
    const step = seqNums && seqNums.length >= 2 ? seqNums[1] - seqNums[0] : 1;
    const misconceptions: MisconceptionRule[] = [
      {
        id: "M_SIGN_OR_PART_WHOLE",
        tag: "SIGN_REVERSAL",
        detect: (raw) => {
          const r = Number(raw);
          if (!Number.isFinite(r) || nums.length < 2) return false;
          if (q.includes("?") || q.includes("□") || q.includes("hiding") || q.includes("−")) {
            return r === nums[0] + nums[1];
          }
          return Math.abs(r - Math.abs(nums[0] - nums[1])) === 0 && q.includes("+");
        },
        conceptualAnchor: "Look at whether the question joins two parts to make a total, or finds a missing part from a whole.",
        remediationStep: {
          scaffoldPrompt: "Use the ten-frame counters to separate what is already shown from the missing or remaining part.",
          targetSubQuestion: "What number makes the statement true?",
          expectedSubValue: ans,
        },
      },
      {
        id: "M_OFF_BY_ONE",
        tag: "OFF_BY_ONE",
        detect: (raw) => Number.isFinite(ansNum) && Math.abs(Number(raw) - ansNum) === 1,
        conceptualAnchor: "You are 1 away. Recount using groups of 5 on the ten-frame row.",
        remediationStep: {
          scaffoldPrompt: "Tap the counters on the ten-frame to verify the exact count.",
          targetSubQuestion: "What is the exact count?",
          expectedSubValue: ans,
        },
      },
    ];
    return buildDomainSchema(
      item,
      {
        prefix: "CNT",
        modelComponent: "interactive-counters-frame",
        modelSpec: {
          mode,
          countA: Math.min(20, Math.max(0, a)),
          countB: Math.min(20, Math.max(0, b)),
          total: Number.isFinite(ansNum) ? Math.min(20, Math.max(0, ansNum)) : 10,
          targetCount: Number.isFinite(ansNum) ? Math.min(20, Math.max(0, ansNum)) : 5,
          step,
          seq: gen === "pattern" ? q.split(/\s+/).filter((t) => ["▲", "●", "■"].includes(t)) : seqNums,
        },
        misconceptions,
        keyRule:
          gen === "sequence"
            ? `Notice the constant step (${step >= 0 ? `+${step}` : step}) between consecutive numbers.`
            : "Organize counters in groups of 5 and 10 to compose or decompose quantities without recounting by ones.",
        steps: [
          { instruction: "Identify the starting quantities or repeating pattern step.", mathExpression: q },
          { instruction: "Count or combine/take away by anchored groups of 5 and 10.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: `Mixing up adding vs. missing part, or miscounting by 1 without ten-frame anchors, gives a nearby off-target answer.`,
        siblingSpec:
          gen === "sequence" && seqNums && seqNums.length >= 2
            ? { template: "sequence", seq: seqNums, step, grade, skillId, generator: gen }
            : gen === "fact" && nums.length >= 2
              ? { template: "binary", a: nums[0], b: nums[1], op: q.includes("−") || q.includes("-") ? "−" : "+", grade, skillId, generator: gen }
              : undefined,
      },
      evaluateAnswer,
    );
  }

  // 2. Place value, rounding, comparison, multi-digit vertical add/sub, decimals
  if (
    ["placeValue", "decimalPlace", "compare", "round", "mentalTens", "decimalOp"].includes(gen) ||
    (gen === "fact" && ["add-100", "subtract-100", "add-1000", "add-sub-1000", "add-large", "subtract-large"].includes(skillId))
  ) {
    const targetNumber = cleanQ.match(/\d[\d,]*\.?\d*/)?.[0] || String(nums[0] ?? 0);
    const digitsOnly = targetNumber.replaceAll(",", "");
    const decIdx = digitsOnly.indexOf(".");
    const wholeNames = ["Ones", "Tens", "Hundreds", "Thousands", "Ten-Th", "Hun-Th", "Millions"];
    const decNames = ["Tenths", "Hundredths", "Thousandths"];
    const columns =
      decIdx >= 0
        ? [
            ...digitsOnly
              .slice(0, decIdx)
              .split("")
              .reverse()
              .map((d, i) => ({ label: wholeNames[i] || `10^${i}`, digit: d }))
              .reverse(),
            ...digitsOnly
              .slice(decIdx + 1)
              .split("")
              .map((d, i) => ({ label: decNames[i] || `10^-${i + 1}`, digit: d })),
          ]
        : digitsOnly
            .split("")
            .reverse()
            .map((d, i) => ({ label: wholeNames[i] || `10^${i}`, digit: d }))
            .reverse();
    const isRound = gen === "round";
    const unitPow = /million/i.test(q)
      ? 1000000
      : /hundred\s+thousand/i.test(q)
        ? 100000
        : /ten\s+thousand/i.test(q)
          ? 10000
          : /thousand/i.test(q)
            ? 1000
            : /hundred/i.test(q)
              ? 100
              : 10;
    const rawVal = nums[0] ?? 0;
    const low = Math.floor(rawVal / unitPow) * unitPow;
    const high = low + unitPow;
    const mid = low + unitPow / 2;
    const op = q.includes("−") || q.includes("-") ? "−" : q.includes("×") ? "×" : q.includes("÷") ? "÷" : "+";
    return buildDomainSchema(
      item,
      {
        prefix: "PVM",
        modelComponent: "interactive-place-value-mat",
        modelSpec: {
          mode: isRound ? "round" : gen === "compare" ? "compare" : gen === "fact" || gen === "decimalOp" ? "vertical" : "place",
          number: targetNumber,
          numberB: nums[1] !== undefined ? String(nums[1]) : undefined,
          columns: columns.slice(-6),
          low,
          mid,
          high,
          roundTarget: Number(ans) >= high ? "high" : "low",
          targetPlace: isRound ? String(unitPow) : "Place value",
        },
        misconceptions: [
          {
            id: "M_DIGIT_VS_VALUE",
            tag: "DIGIT_VS_VALUE",
            detect: (raw) => {
              const r = Number(raw);
              const e = Number(ans);
              return Number.isFinite(r) && Number.isFinite(e) && r > 0 && e > 0 && (r % e === 0 || e % r === 0) && Math.log10(Math.max(r, e) / Math.min(r, e)) % 1 === 0;
            },
            conceptualAnchor: "Distinguish the face digit (0–9) from its place value (digit × place unit).",
            remediationStep: {
              scaffoldPrompt: "Select the matching place column in the mat above to verify digit vs. place value.",
              targetSubQuestion: "What is the exact value asked for?",
              expectedSubValue: ans,
            },
          },
          {
            id: "M_COMP_REVERSE",
            tag: "INVERTED_COMPARE",
            detect: (raw) => gen === "compare" && ["<", ">", "="].includes(raw.trim()),
            conceptualAnchor: "Compare digits from the greatest place value column on the left first.",
            remediationStep: {
              scaffoldPrompt: "Compare the leftmost non-equal place columns.",
              targetSubQuestion: "Which comparison symbol makes the statement true?",
              expectedSubValue: ans,
            },
          },
        ],
        keyRule: isRound
          ? `Check if ${targetNumber} is below or at/above the midpoint ${mid}.`
          : "Align digits by place value (ones under ones, tenths under tenths) before comparing, adding, or subtracting.",
        steps: [
          { instruction: "Align each number in its place-value column.", mathExpression: q },
          { instruction: "Compute or compare from the relevant place column with regrouping if needed.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: `Forgetting to align decimal points/place columns or confusing a digit with its place value causes power-of-10 shifts.`,
        siblingSpec:
          gen === "compare" && nums.length >= 2
            ? { template: "compare", a: nums[0], b: nums[1], grade, skillId, generator: gen }
            : gen === "fact" && nums.length >= 2
              ? { template: "binary", a: nums[0], b: nums[1], op, grade, skillId, generator: gen }
              : undefined,
      },
      evaluateAnswer,
    );
  }

  // 3. Multiplication, division, area rectangle, arrays, factors/GCF/LCM, exponents, powers of 10, sqrt, sciOps
  if (
    ["arrays", "factorMultiple", "gcfLcm", "exponent", "powerTen", "squareRoot", "sciOps"].includes(gen) ||
    (gen === "fact" && ["mul-0-5", "mul-6-9", "mul-10-12", "mul-11-12", "division-facts", "multiply-1digit", "multiply-2digit", "division", "multiply-whole", "divide-whole", "multi-digit-division"].includes(skillId)) ||
    (gen === "geometry" && skillId === "area")
  ) {
    const a = Math.max(1, Math.round(Math.abs(nums[0] ?? 3)));
    const b = Math.max(1, Math.round(Math.abs(nums[1] ?? (gen === "squareRoot" ? Number(ans) || 3 : 4))));
    const smallArray = a <= 12 && b <= 12 && ["arrays", "fact", "geometry"].includes(gen) && !q.includes("÷");
    const mode = smallArray
      ? "array"
      : gen === "exponent"
        ? "exponent"
        : gen === "powerTen"
          ? "pow10"
          : gen === "sciOps"
            ? "sci"
            : gen === "factorMultiple" || gen === "gcfLcm"
              ? "factors"
              : q.includes("÷")
                ? "division"
                : "area2d";
    const op = q.includes("÷") ? "÷" : "×";
    return buildDomainSchema(
      item,
      {
        prefix: "ARR",
        modelComponent: "interactive-array-area",
        modelSpec: {
          mode,
          rows: Math.min(12, a),
          cols: Math.min(12, b),
          label: gen === "exponent" || gen === "squareRoot" ? "Power & Root Structure" : gen === "gcfLcm" || gen === "factorMultiple" ? "Factors & Multiples" : "Multiplicative Area / Groups",
          badge: gen === "exponent" ? `${a}^${b}` : gen === "gcfLcm" ? `${a} & ${b}` : `${a} ${op} ${b}`,
          chips:
            mode === "area2d"
              ? [`(${Math.floor(a / 10) * 10} + ${a % 10}) × ${b}`, `${a} × ${b}`]
              : gen === "exponent"
                ? Array.from({ length: Math.min(5, Math.max(2, b)) }, () => String(a)).join(" × ").split("|")
                : [`Check ${a} and ${b}`],
        },
        misconceptions: [
          {
            id: "M_ADD_NOT_MULT",
            tag: "ADDITIVE_INSTEAD_OF_MULTIPLICATIVE",
            detect: (raw) => {
              const r = Number(raw);
              if (!Number.isFinite(r) || nums.length < 2) return false;
              return gen === "exponent" ? r === a * b : r === a + b;
            },
            conceptualAnchor:
              gen === "exponent"
                ? `An exponent multiplies the base repeatedly (${a}^${b} multiplies ${b} copies of ${a}), not ${a} × ${b}.`
                : `Multiplication counts equal groups (${a} groups of ${b}), not ${a} + ${b}.`,
            remediationStep: {
              scaffoldPrompt: "Use the equal-rows/groups array or factor chips above to see why groups multiply.",
              targetSubQuestion: "What is the correct result?",
              expectedSubValue: ans,
            },
          },
        ],
        keyRule:
          gen === "gcfLcm"
            ? "GCF is the largest factor shared by both numbers; LCM is the smallest positive multiple shared by both."
            : gen === "exponent"
              ? "Repeated multiplication scales by multiplying the base by itself the exponent number of times."
              : "Decompose multiplication or division into equal groups and partial products/quotients.",
        steps: [
          { instruction: "Identify the equal group size, factors, or repeated base.", mathExpression: q },
          { instruction: "Compute each group or partial product and combine.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: "Adding numbers or multiplying base × exponent instead of repeating equal groups produces a common distractor.",
        siblingSpec:
          (gen === "fact" || gen === "geometry") && nums.length >= 2 && a <= 200 && b <= 200
            ? { template: "binary", a, b, op, grade, skillId, generator: gen }
            : undefined,
      },
      evaluateAnswer,
    );
  }

  // 4. Fractions & rational ordering
  if (["equalShares", "fractionEquivalent", "fractionCompare", "fractionLine", "mixedNumber", "fractionOp", "fractionOf", "orderRational"].includes(gen)) {
    const f1 = fracs[0] || { n: 1, d: 2, raw: "1/2" };
    const f2 = fracs[1] || undefined;
    const isOps = gen === "fractionOp";
    const op = q.includes("÷") ? "÷" : q.includes("×") ? "×" : q.includes("−") || q.includes("-") ? "−" : "+";
    const mode =
      gen === "fractionEquivalent"
        ? "equivalent"
        : gen === "fractionCompare"
          ? "compare"
          : gen === "fractionLine"
            ? "line"
            : gen === "mixedNumber"
              ? "mixed"
              : gen === "fractionOf"
                ? "of"
                : gen === "orderRational"
                  ? "order"
                  : isOps
                    ? "ops"
                    : "partition";
    return buildDomainSchema(
      item,
      {
        prefix: "FRC",
        modelComponent: "interactive-fraction-bar",
        modelSpec: {
          mode,
          numA: Math.max(0, Math.abs(f1.n)),
          denA: Math.max(1, f1.d),
          numB: f2 ? Math.max(0, Math.abs(f2.n)) : undefined,
          denB: f2 ? Math.max(1, f2.d) : undefined,
        },
        misconceptions: [
          {
            id: "M_ADDED_DENOM",
            tag: "ADDED_DENOMINATORS",
            detect: (raw) => {
              if (!isOps || !f2 || !["+", "−"].includes(op)) return false;
              const wrongN = op === "+" ? f1.n + f2.n : f1.n - f2.n;
              const wrongD = f1.d + f2.d;
              return mathAnswersMatch(raw, `${wrongN}/${wrongD}`, "fraction");
            },
            conceptualAnchor: "Never add or subtract denominators directly. Convert to a common denominator so every piece is the same size.",
            remediationStep: {
              scaffoldPrompt: "Subdivide the fraction bar above to match equal-sized unit pieces before combining numerators.",
              targetSubQuestion: "What is the simplified fraction result?",
              expectedSubValue: ans,
            },
          },
          {
            id: "M_FORGOT_RECIPROCAL",
            tag: "FORGOT_RECIPROCAL",
            detect: (raw) => {
              if (op !== "÷" || !f2) return false;
              return mathAnswersMatch(raw, simplifyFraction(f1.n * f2.n, f1.d * f2.d), "fraction");
            },
            conceptualAnchor: "Dividing by a fraction multiplies by its reciprocal (Keep the first fraction, Change ÷ to ×, Flip the second fraction).",
            remediationStep: {
              scaffoldPrompt: "Inspect how many groups of the second fraction fit inside the first bar.",
              targetSubQuestion: "Write the quotient as a simplified fraction.",
              expectedSubValue: ans,
            },
          },
        ],
        keyRule:
          mode === "compare" || mode === "equivalent"
            ? "Equivalent fractions represent the same point and total area by multiplying both numerator and denominator by the same nonzero factor."
            : op === "÷"
              ? "To divide fractions, multiply by the reciprocal of the divisor and simplify."
              : "Use equal-sized unit parts (common denominators when adding/subtracting) modeled on the fraction bar.",
        steps: [
          { instruction: "Model the denominator(s) to see the size of each equal unit piece.", mathExpression: q },
          { instruction: "Scale to common unit pieces or apply the fraction operation and simplify.", mathExpression: `Result = ${ans}` },
        ],
        distractorAnalysis: "Combining numerators and denominators separately treats different-sized pieces as if they were the same unit.",
        placeholder: gen === "orderRational" ? "-1, -1/3, 0.1, 0.75" : "Example: 3/4",
        siblingSpec:
          isOps && f2 && f1.d <= 12 && f2.d <= 12 && f1.n > 0 && f2.n > 0
            ? { template: "fractionOp", n1: f1.n, d1: f1.d, n2: f2.n, d2: f2.d, op, grade, skillId, generator: gen }
            : undefined,
      },
      evaluateAnswer,
    );
  }

  // 5. Signed numbers, integer ops, inequalities
  if (["integerOp", "inequality"].includes(gen) || (gen === "numberPlane" && !q.includes("quadrant") && !q.includes("distance"))) {
    const a = nums[0] ?? 0;
    const b = nums[1] ?? 0;
    const ansNum = Number(ans.replaceAll("−", "-"));
    const op = q.includes("×") ? "×" : q.includes("÷") ? "÷" : q.includes("−") || q.includes(" - ") ? "−" : "+";
    const sym = (q.match(/[≤≥<>]/)?.[0] || "≥") as "<" | "≤" | ">" | "≥";
    const spread = Math.max(12, Math.abs(a), Number.isFinite(ansNum) ? Math.abs(ansNum) + 3 : 12);
    return buildDomainSchema(
      item,
      {
        prefix: "SGN",
        modelComponent: "interactive-signed-number-line",
        modelSpec: {
          mode: gen === "inequality" ? "inequality" : gen === "numberPlane" ? "abs" : "op",
          min: -spread,
          max: spread,
          start: a,
          target: Number.isFinite(ansNum) ? ansNum : b,
          symbol: sym,
        },
        misconceptions: [
          {
            id: "M_SIGN_FLIP",
            tag: "SIGNED_SIGN_ERROR",
            detect: (raw) => {
              const r = Number(String(raw).replaceAll("−", "-"));
              return Number.isFinite(r) && Number.isFinite(ansNum) && r !== ansNum && Math.abs(r) === Math.abs(ansNum);
            },
            conceptualAnchor: "Your magnitude is right, but check the direction relative to zero (subtracting a negative moves right; multiplying two negatives gives a positive).",
            remediationStep: {
              scaffoldPrompt: "Trace the movement from the starting point on the signed number line relative to 0.",
              targetSubQuestion: "What is the signed value?",
              expectedSubValue: ans,
            },
          },
        ],
        keyRule:
          gen === "inequality"
            ? "Check the boundary condition (< and > are strict/open; ≤ and ≥ include the boundary/closed)."
            : gen === "numberPlane"
              ? "Absolute value |n| is the non-negative distance from 0 on the number line."
              : "Model direction on the signed number line: adding a negative moves left; subtracting a negative adds the opposite (moves right).",
        steps: [
          { instruction: "Locate the starting position on the number line relative to 0.", mathExpression: q },
          { instruction: "Apply the signed change or inequality test.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: "Dropping a negative sign or reversing subtracting a negative moves the wrong direction across 0.",
        siblingSpec:
          gen === "integerOp" && nums.length >= 2 && op !== "÷"
            ? { template: "integerOp", a, b, op, grade, skillId, generator: gen }
            : undefined,
      },
      evaluateAnswer,
    );
  }

  // 6. Algebra, expressions, equations, write-inequalities, slope, functions, systems, compare functions
  if (["orderOps5", "expression", "solve", "equivalentExpression", "likeTerms", "writeInequality", "slope", "functionRule", "system", "compareFunctions"].includes(gen)) {
    const mode =
      gen === "orderOps5"
        ? "order"
        : gen === "solve"
          ? "solve"
          : gen === "likeTerms" || gen === "equivalentExpression"
            ? "likeTerms"
            : gen === "writeInequality"
              ? "writeIneq"
              : gen === "slope"
                ? "slope"
                : gen === "functionRule"
                  ? "function"
                  : gen === "system"
                    ? "system"
                    : gen === "compareFunctions"
                      ? "compareFn"
                      : "eval";
    const eqMatch = /^(-?\d*)x\s*([+\-−])\s*(\d+)\s*=\s*(-?\d+)/.exec(cleanQ);
    const coeff = eqMatch ? (eqMatch[1] === "" || eqMatch[1] === "+" ? 1 : eqMatch[1] === "-" ? -1 : Number(eqMatch[1])) : 1;
    const kSigned = eqMatch ? (eqMatch[2] === "+" ? Number(eqMatch[3]) : -Number(eqMatch[3])) : 0;
    const ansNum = Number(ans.replaceAll("−", "-"));
    return buildDomainSchema(
      item,
      {
        prefix: "ALG",
        modelComponent: "interactive-algebra-balance",
        modelSpec: {
          mode,
          title:
            gen === "solve"
              ? "Equation Balance"
              : gen === "slope"
                ? "Slope (Δy / Δx) Table"
                : gen === "system"
                  ? "Linear System Elimination"
                  : "Algebraic Equivalence",
          left: q.split("=")[0]?.trim() || q,
          right: q.includes("=") ? (q.split("=")[1]?.split(".")[0]?.trim() || ans) : ans,
          moveLabel: gen === "solve" ? "Apply Inverse Operation" : gen === "orderOps5" ? "Highlight Priority Group" : "Verify Equivalence Step",
          afterText: `Solution / Result: ${ans}`,
          xVal: Number.isFinite(ansNum) ? ansNum : 2,
        },
        misconceptions: [
          {
            id: "M_ORDER_OPS_LTR",
            tag: "ORDER_OF_OPS_LEFT_TO_RIGHT",
            detect: (raw) => gen === "orderOps5" && nums.length >= 3 && Number(raw) === (nums[0] + nums[1]) * nums[2],
            conceptualAnchor: "Evaluate parentheses and multiplication/division before addition/subtraction.",
            remediationStep: {
              scaffoldPrompt: "Apply the priority step on the algebraic balance above first.",
              targetSubQuestion: "What is the correctly evaluated value?",
              expectedSubValue: ans,
            },
          },
          {
            id: "M_INVERSE_OP",
            tag: "INVERSE_OP_CONFUSION",
            detect: (raw) => gen === "solve" && Number.isFinite(Number(raw)) && Math.abs(Number(raw) - ansNum) === Math.abs(2 * kSigned),
            conceptualAnchor: "Undo addition/subtraction with the opposite operation on BOTH sides before dividing.",
            remediationStep: {
              scaffoldPrompt: "Click Apply Inverse Operation on the balance to undo the constant term first.",
              targetSubQuestion: "What value of x balances the equation?",
              expectedSubValue: ans,
            },
          },
        ],
        keyRule:
          gen === "slope"
            ? "Slope m = (y₂ − y₁) / (x₂ − x₁) measures vertical rise per unit of horizontal run."
            : gen === "likeTerms" || gen === "equivalentExpression"
              ? "Distribute factors across every term inside parentheses and combine only matching variable powers and constants."
              : "Keep equations balanced by applying inverse operations equally to both sides.",
        steps: [
          { instruction: "Identify the variable, coefficient, constant, or operation priority.", mathExpression: q },
          { instruction: "Apply balanced inverse/equivalent steps to isolate the target.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: "Working strictly left-to-right, distributing to only the first term, or applying an operation to only one side breaks equivalence.",
        placeholder: gen === "writeInequality" ? "c ≤ 35" : gen === "equivalentExpression" || gen === "likeTerms" ? "8x + 48" : "",
        siblingSpec:
          gen === "solve" && eqMatch && Number.isFinite(ansNum)
            ? { template: "solve", coeff, k: kSigned, xVal: ansNum, grade, skillId, generator: gen }
            : undefined,
      },
      evaluateAnswer,
    );
  }

  // 7. Ratios/Scale/PercentChange/Sampling non-core-6 & Geometry & Measurement & Data/Probability
  if (["percentChange", "scaleDrawing", "sampling"].includes(gen)) {
    const scaleNum = Math.max(1, Math.round(nums[1] ?? 4));
    const drawNum = Math.max(1, Math.round(nums[2] ?? 2));
    return buildDomainSchema(
      item,
      {
        prefix: "PRP",
        modelComponent: gen === "percentChange" ? "interactive-double-number-line" : "interactive-ratio-tape",
        modelSpec: { mode: gen },
        keyRule: "Proportional relationships keep the ratio between corresponding quantities constant.",
        steps: [
          { instruction: "Set up the unit ratio or percent scale from 100%.", mathExpression: q },
          { instruction: "Scale proportionally to the target quantity.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: "Adding a flat offset instead of multiplying by the constant ratio or percent multiplier breaks proportionality.",
        siblingSpec: gen === "scaleDrawing" ? { template: "scale", scale: scaleNum, draw: drawNum, grade, skillId, generator: gen } : undefined,
      },
      evaluateAnswer,
    );
  }

  if (["dataDisplay", "scaledGraph", "linePlot", "dataDisplays", "centerSpread", "iqrSpread", "dataChance", "association"].includes(gen)) {
    const mode =
      gen === "scaledGraph"
        ? "scaled"
        : gen === "linePlot"
          ? "lineplot"
          : gen === "dataDisplays"
            ? "histogram"
            : gen === "dataChance"
              ? "probability"
              : gen === "association"
                ? "scatter"
                : "stats";
    const fav = fracs[0]?.n ?? nums[0] ?? 1;
    const tot = fracs[0]?.d ?? nums[1] ?? 4;
    return buildDomainSchema(
      item,
      {
        prefix: "DAT",
        modelComponent: "interactive-data-board",
        modelSpec: {
          mode,
          values: nums.slice(0, 8),
          summary: q.slice(0, 90),
        },
        misconceptions: [
          {
            id: "M_PART_TO_PART_PROB",
            tag: "PROB_PART_TO_PART",
            detect: (raw) => gen === "dataChance" && nums.length >= 2 && tot > fav && mathAnswersMatch(raw, simplifyFraction(fav, tot - fav), "fraction"),
            conceptualAnchor: "Probability compares favorable outcomes to ALL equal outcomes (part / whole), not favorable to unfavorable.",
            remediationStep: {
              scaffoldPrompt: "Use Compare Part to Total on the data board to count all equal outcomes in the denominator.",
              targetSubQuestion: "Write P(win) as a simplified fraction.",
              expectedSubValue: ans,
            },
          },
        ],
        keyRule:
          gen === "dataChance"
            ? "Theoretical probability is P(event) = favorable outcomes ÷ total equally likely outcomes."
            : "Order data sets before finding medians/quartiles, and multiply bar counts by the graph scale.",
        steps: [
          { instruction: "Read the scale, sorted values, or total equal outcomes.", mathExpression: q },
          { instruction: "Calculate the target measure or probability.", mathExpression: `Answer = ${ans}` },
        ],
        distractorAnalysis: "Using part-to-part instead of part-to-whole, skipping sorting before finding the median, or forgetting the graph scale factor gives a distractor.",
        siblingSpec:
          gen === "dataChance" && nums.length >= 2 && tot > fav
            ? { template: "probability", fav, total: tot, grade, skillId, generator: gen }
            : undefined,
      },
      evaluateAnswer,
    );
  }

  // Remaining: Geometry, Measurement, Time, Coins, Coordinates, Conversions, Transformations, Pythagorean, Circles, Prisms, Nets
  const geoMode =
    ["timeAdd", "timeFive"].includes(gen)
      ? "clock"
      : ["angleMeasure", "angleFacts"].includes(gen) || skillId === "angle-relations"
        ? "angle"
        : gen === "pythagorean"
          ? "pythagorean"
          : ["circle-area", "circumference", "volumeRound"].includes(skillId) || ["circumference", "volumeRound"].includes(gen)
            ? "circle"
            : ["coordPlane", "transform", "transformPoint", "numberPlane"].includes(gen)
              ? "coord"
              : ["triangle-area"].includes(skillId)
                ? "triangle"
                : "shape";
  const angleTarget = /supplementary|straight line|180/i.test(q) ? 180 : /right angle|complementary|90/i.test(q) ? 90 : undefined;
  const geoMisconceptions: MisconceptionRule[] = [];
  if (angleTarget) {
    geoMisconceptions.push({
      id: "M_COMP_SUPP_SWAP",
      tag: "ANGLE_COMP_SUPP_SWAP",
      detect: (raw) => nums.length > 0 && Number(raw) === (angleTarget === 180 ? 90 - nums[0] : 180 - nums[0]),
      conceptualAnchor: angleTarget === 180 ? "Supplementary / straight-line angles sum to 180°, not 90°." : "Complementary / right angles sum to 90°, not 180°.",
      remediationStep: {
        scaffoldPrompt: "Highlight the key angle relationship on the geometry board above.",
        targetSubQuestion: `Subtract the given angle from ${angleTarget}°.`,
        expectedSubValue: ans,
      },
    });
  }
  geoMisconceptions.push({
    id: "M_AREA_PERIM_OR_HALF",
    tag: "AREA_PERIMETER_SWAP",
    detect: (raw) => {
      const r = Number(raw);
      if (!Number.isFinite(r) || nums.length < 2) return false;
      return skillId === "triangle-area" ? r === nums[0] * nums[1] : skillId === "perimeter" && r === nums[0] * nums[1];
    },
    conceptualAnchor:
      skillId === "triangle-area"
        ? "A triangle is half of a rectangle: Area = ½ × base × height."
        : "Perimeter adds all outside edges around the shape: P = 2L + 2W.",
    remediationStep: {
      scaffoldPrompt: "Use Highlight Key Measure on the geometry board to separate perimeter edges from interior area.",
      targetSubQuestion: "What is the exact measure?",
      expectedSubValue: ans,
    },
  });
  return buildDomainSchema(
    item,
    {
      prefix: "GEO",
      modelComponent: "interactive-geometry-board",
      modelSpec: {
        mode: geoMode,
        badge: skillId || gen || "geometry",
        summary: q.slice(0, 88),
      },
      misconceptions: geoMisconceptions,
      keyRule:
        gen === "pythagorean"
          ? "In a right triangle, the squares of the legs sum to the square of the hypotenuse: a² + b² = c²."
          : geoMode === "circle"
            ? "Keep radius (r) and diameter (d = 2r) distinct in C = πd and A = πr²."
            : "Identify the exact geometric attribute or unit conversion factor before calculating.",
      steps: [
        { instruction: "Identify the known dimensions, angle total, or coordinate axes.", mathExpression: q },
        { instruction: "Apply the formula or transformation carefully.", mathExpression: `Answer = ${ans}` },
      ],
      distractorAnalysis: "Swapping complementary/supplementary totals, forgetting ½ on triangles, or mixing up x and y axes creates plausible errors.",
      siblingSpec:
        angleTarget && nums.length >= 1
          ? { template: "angle", targetTotal: angleTarget, given: nums[0], grade, skillId, generator: gen }
          : undefined,
    },
    evaluateAnswer,
  );
}

const SKILL_ID_TO_GENERATOR: Record<string, string> = {
  "count-forward": "sequence", "count-patterns": "sequence", "skip-count": "sequence",
  "count-cardinality": "countSet", "subitize": "subitize", "compare-20": "compare",
  "compare-100": "compare", "compare-1000": "compare", "compose-10": "makeTarget",
  "make-10": "makeTarget", "add-sub-5": "fact", "add-10": "fact", "subtract-10": "fact",
  "add-20": "fact", "subtract-20": "fact", "facts-20": "fact", "sub-facts-20": "fact",
  "add-100": "fact", "subtract-100": "fact", "add-1000": "fact", "add-sub-1000": "fact",
  "add-large": "fact", "subtract-large": "fact", "mul-0-5": "fact", "mul-6-9": "fact",
  "mul-10-12": "fact", "mul-11-12": "fact", "division-facts": "fact", "multiply-1digit": "fact",
  "multiply-2digit": "fact", "division": "fact", "multiply-whole": "fact", "divide-whole": "fact",
  "multi-digit-division": "fact", "story-add-sub-10": "missingAddend", "missing-addend": "missingAddend",
  "patterns": "pattern", "hidden-parts": "hiddenParts", "tens-ones": "placeValue",
  "place-1000": "placeValue", "place-million": "placeValue", "time": "timeAdd",
  "elapsed-time": "timeAdd", "measure-length": "lengthMeasure", "shapes-2d3d": "shapeFacts",
  "equal-shares": "equalShares", "even-odd": "evenOdd", "coins": "money",
  "interpret-data": "dataDisplay", "doubles-near": "doublesNear", "arrays": "arrays",
  "time-five": "timeFive", "mental-tens": "mentalTens", "round": "round", "round-large": "round",
  "fraction-equivalence": "fractionEquivalent", "fraction-equiv": "fractionEquivalent",
  "fraction-compare": "fractionCompare", "area": "geometry", "perimeter": "geometry",
  "volume": "geometry", "triangle-area": "geometry", "circle-area": "geometry",
  "angle-relations": "geometry", "fraction-line": "fractionLine", "scaled-graphs": "scaledGraph",
  "factors": "factorMultiple", "unit-conversion": "conversion", "line-plots": "linePlot",
  "mixed-numbers": "mixedNumber", "angle-measure": "angleMeasure", "decimal-place": "decimalPlace",
  "decimal-add": "decimalOp", "decimal-sub": "decimalOp", "decimal-mul": "decimalOp",
  "decimal-ops": "decimalOp", "fraction-add": "fractionOp", "fraction-mul": "fractionOp",
  "unit-fraction-division": "fractionOp", "divide-fractions": "fractionOp", "fraction-ops": "fractionOp",
  "fraction-of": "fractionOf", "coordinate-plane": "coordPlane", "order-ops": "orderOps5",
  "gcf": "gcfLcm", "lcm": "gcfLcm", "evaluate": "expression", "one-step": "solve",
  "equations": "solve", "linear-equations": "solve", "integers": "numberPlane",
  "order-rational": "orderRational", "equivalent-expressions": "equivalentExpression",
  "write-inequalities": "writeInequality", "data-displays": "dataDisplays",
  "center-spread": "centerSpread", "iqr-spread": "iqrSpread", "surface-area-nets": "surfaceAreaNet",
  "volume-fractional": "volumeFractional", "integer-add": "integerOp", "integer-mul": "integerOp",
  "percent-change": "percentChange", "scale-drawing": "scaleDrawing", "inequalities": "inequality",
  "probability": "dataChance", "like-terms": "likeTerms", "circumference": "circumference",
  "angle-facts": "angleFacts", "sampling": "sampling", "exponents": "exponent",
  "powers-ten": "powerTen", "square-roots": "squareRoot", "slope": "slope",
  "functions": "functionRule", "systems": "system", "pythagorean": "pythagorean",
  "association": "association", "transformations": "transform", "transformations-move": "transformPoint",
  "scientific-ops": "sciOps", "volume-round": "volumeRound", "compare-functions": "compareFunctions",
};

export function adaptPracticeItem(
  item: PracticeItemInput,
  evaluateAnswer?: (input: string) => boolean,
): ExerciseSchema | null {
  if (!item || typeof item.question !== "string" || !item.question.trim() || !item.answers?.length) return null;
  const grade = Number(item.skill?.grade ?? 0);
  const id = String(item.skill?.id ?? "");
  const skill = `${grade}:${id}`;
  if (skill === "7:proportions") return adaptProportionItem(item, evaluateAnswer);
  if (skill === "6:ratios") return adaptEquivalentRatioItem(item, evaluateAnswer);
  if (skill === "6:unit-rates" || skill === "7:unit-rate") {
    const rate = adaptUnitRateItem(item, evaluateAnswer);
    if (rate) return rate;
  }
  if (skill === "6:percent") return adaptPercentPartItem(item, evaluateAnswer);
  if (skill === "6:percent-whole") return adaptPercentWholeItem(item, evaluateAnswer);
  const gen = String(item.skill?.generator || item.generator || SKILL_ID_TO_GENERATOR[id] || "");
  if (!gen) return null;
  return adaptDomainFamily(item, gen, id, grade, evaluateAnswer);
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
