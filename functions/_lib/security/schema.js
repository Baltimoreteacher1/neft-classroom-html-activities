/**
 * Shared request-schema constants for the public BCPSS write endpoints.
 * One source of truth: endpoints import these instead of re-declaring enums or limits.
 */

/** WIDA band keys the teacher UI offers (bcpss-teachers.js WIDA_TIERS). A teacher-chosen scaffold band, never a student property. */
export const WIDA_TIERS = Object.freeze(["1_2", "3_4", "5_6"]);

/** Syntactic unit id shape. Existence is checked against the unit registry, never trusted from the shape alone. */
export const UNIT_ID_RE = /^[a-zA-Z0-9_-]{2,80}$/;

/** Anonymous per-browser token header used as the second rate-limit key. Random, carries no identity. */
export const ANON_TOKEN_HEADER = "X-Anon-Token";
export const ANON_TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * Per-endpoint limits. `max` is per IP + anonymous token per window; `ipMax` caps one IP overall so a
 * client cannot dodge `max` by rotating tokens (it is generous because a school shares one NAT address).
 * Pages Functions are per-isolate, so these bound a runaway client, not a determined attacker.
 */
export const LIMITS = Object.freeze({
  telemetry: { rateLimit: { max: 120, ipMax: 600, windowMs: 60_000 }, maxBodyBytes: 2_048 },
  plans: { rateLimit: { max: 10, ipMax: 60, windowMs: 60_000 }, maxBodyBytes: 4_096 },
  deconstruct: { rateLimit: { max: 20, ipMax: 120, windowMs: 60_000 }, maxBodyBytes: 16_384 },
  cspReport: { rateLimit: { max: 30, ipMax: 300, windowMs: 60_000 }, maxBodyBytes: 8_192 },
});

export const TEACHER_NOTE_MAX = 500;
