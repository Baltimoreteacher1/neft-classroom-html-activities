// Intervention Simulator arithmetic. There is no credible effect-size evidence for these interventions on
// this scale, so the TEACHER supplies the assumed effect and this module only does the arithmetic:
// delivered hours = sessions/week x minutes/session x weeks x participation / 60
// assumed shift   = delivered hours / 10 x assumed effect (levels per 10 delivered hours)
// scenario level  = baseline level + assumed shift, clamped to 1.0-6.0
// It is a hypothetical sensitivity analysis, never a prediction and never a causal claim.

export const SIM_LIMITS = Object.freeze({
  sessionsPerWeek: [0, 10],
  minutesPerSession: [0, 120],
  weeks: [0, 40],
  participation: [0, 1],
  effectPer10h: [-1, 1],
});
export const SENSITIVITY = Object.freeze([0.5, 1, 1.5]);

const clampTo = (x, [lo, hi]) => Math.max(lo, Math.min(hi, x));
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;

/** Validate and clamp assumptions; returns { ok, value, errors }. */
export function readAssumptions(raw = {}) {
  const errors = [];
  const value = {};
  for (const [k, range] of Object.entries(SIM_LIMITS)) {
    const n = Number(raw[k]);
    if (raw[k] === "" || raw[k] == null || !Number.isFinite(n))
      errors.push(`${k} must be a number.`);
    else if (n < range[0] || n > range[1])
      errors.push(`${k} must be between ${range[0]} and ${range[1]}.`);
    value[k] = Number.isFinite(n) ? clampTo(n, range) : range[0];
  }
  return { ok: errors.length === 0, value, errors };
}

/** One scenario's arithmetic, every step returned so the page can show it. */
export function simulate(baseline, a) {
  const deliveredHours = (a.sessionsPerWeek * a.minutesPerSession * a.weeks * a.participation) / 60;
  const shift = (deliveredHours / 10) * a.effectPer10h;
  const raw = baseline + shift;
  const level = clampTo(raw, [1, 6]);
  return {
    baseline,
    deliveredHours: r2(deliveredHours),
    shift: r2(shift),
    level: r1(level),
    clamped: raw !== level,
    steps: [
      `Delivered hours = ${a.sessionsPerWeek} sessions/week x ${a.minutesPerSession} min x ${a.weeks} weeks x ${Math.round(a.participation * 100)}% participation / 60 = ${r2(deliveredHours)} h`,
      `Assumed shift = ${r2(deliveredHours)} h / 10 x ${a.effectPer10h} levels per 10 h = ${r2(shift)} levels`,
      `Scenario level = ${baseline.toFixed(1)} + ${r2(shift)} = ${r2(raw)}${raw !== level ? `, limited to the 1.0-6.0 scale = ${r1(level)}` : ""}`,
    ],
  };
}

/** The same scenario at half, the assumed, and one-and-a-half times the assumed effect. */
export const sensitivity = (baseline, a) =>
  SENSITIVITY.map((m) => ({
    multiplier: m,
    ...simulate(baseline, { ...a, effectPer10h: a.effectPer10h * m }),
  }));
