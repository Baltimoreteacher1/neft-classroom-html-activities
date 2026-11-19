// Subscription-Ready Entitlements & Student Privacy Contract.
//
// Core commitments:
// 1. BILLING_ENABLED defaults to false — never activates charges or invents prices.
// 2. Mathematical accuracy, core K–8 practice, essential explanations, basic visual models,
//    introductory games, and WCAG 2.2 AA accessibility are ALWAYS free regardless of tier.
// 3. COPPA & FERPA guardrails: local-first by default, explicit adult consent flag required
//    for cloud sync, no student PII transmitted to third-party AI services, and full
//    self-service export/deletion of local learner data.

export const ENTITLEMENT_SCHEMA_VERSION = "1.0.0";
export const ENTITLEMENT_STORAGE_KEY = "ewl-fluency-entitlements-v1";
export const BILLING_ENABLED = false;

export const TIERS = Object.freeze({
  free: "free",
  family_premium: "family_premium",
  teacher_premium: "teacher_premium",
});

export const ROLES = Object.freeze({
  student: "student",
  family: "family",
  teacher: "teacher",
  admin: "admin",
});

// Features gated by tier; everything not listed (core math, accuracy, accessibility) is free.
export const FEATURE_MATRIX = Object.freeze({
  "core-practice": [TIERS.free, TIERS.family_premium, TIERS.teacher_premium],
  "essential-explanations": [TIERS.free, TIERS.family_premium, TIERS.teacher_premium],
  "basic-visual-models": [TIERS.free, TIERS.family_premium, TIERS.teacher_premium],
  "intro-games": [TIERS.free, TIERS.family_premium, TIERS.teacher_premium],
  "accessibility-esol": [TIERS.free, TIERS.family_premium, TIERS.teacher_premium],

  "full-strategy-studio": [TIERS.family_premium, TIERS.teacher_premium],
  "expanded-adventures": [TIERS.family_premium, TIERS.teacher_premium],
  "longitudinal-retention": [TIERS.family_premium, TIERS.teacher_premium],
  "family-guided-companion": [TIERS.family_premium, TIERS.teacher_premium],

  "class-intelligence": [TIERS.teacher_premium],
  "intervention-builder": [TIERS.teacher_premium],
  "curriculum-strategy-profiles": [TIERS.teacher_premium],
  "printable-teacher-packs": [TIERS.teacher_premium],
});

export function defaultEntitlementState(role = ROLES.student) {
  return {
    version: ENTITLEMENT_SCHEMA_VERSION,
    role: ROLES[role] ? role : ROLES.student,
    tier: TIERS.free,
    billingEnabled: BILLING_ENABLED,
    status: "active",
    coppaConsentVerified: false,
    ferpaSchoolAgreement: false,
    cloudSyncAllowed: false,
    allowStudentPII: false,
    checkedAt: null,
  };
}

export function sanitizeEntitlements(raw) {
  const base = defaultEntitlementState(raw?.role);
  if (!raw || typeof raw !== "object") return base;
  const tier = Object.values(TIERS).includes(raw.tier) ? raw.tier : TIERS.free;
  const coppaConsentVerified = raw.coppaConsentVerified === true;
  const ferpaSchoolAgreement = raw.ferpaSchoolAgreement === true;
  return {
    ...base,
    role: Object.values(ROLES).includes(raw.role) ? raw.role : ROLES.student,
    tier,
    billingEnabled: BILLING_ENABLED,
    status: ["active", "grace", "canceled", "inactive"].includes(raw.status) ? raw.status : "active",
    coppaConsentVerified,
    ferpaSchoolAgreement,
    cloudSyncAllowed: Boolean(raw.cloudSyncAllowed && (coppaConsentVerified || ferpaSchoolAgreement)),
    allowStudentPII: false,
    checkedAt: typeof raw.checkedAt === "number" ? raw.checkedAt : null,
  };
}

export function loadEntitlements() {
  try {
    if (typeof localStorage === "undefined") return defaultEntitlementState();
    const raw = localStorage.getItem(ENTITLEMENT_STORAGE_KEY);
    return sanitizeEntitlements(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultEntitlementState();
  }
}

export function canAccessFeature(featureId, entitlementState = null) {
  const allowed = FEATURE_MATRIX[featureId];
  if (!allowed) return true; // Unknown/core features default open
  if (allowed.includes(TIERS.free)) return true; // Core math & accessibility are always free
  const state = sanitizeEntitlements(entitlementState || loadEntitlements());
  if (state.status !== "active" && state.status !== "grace") return false;
  return allowed.includes(state.tier);
}

// Fetch server-enforced entitlement status when online; safely falls back to local free tier.
export async function fetchServerEntitlements(fetchFn = typeof fetch === "function" ? fetch : null) {
  if (!fetchFn) return loadEntitlements();
  try {
    const res = await fetchFn("/api/entitlements/status", { method: "GET", credentials: "same-origin" });
    if (!res.ok) return loadEntitlements();
    const data = await res.json();
    return sanitizeEntitlements({ ...data, checkedAt: Date.now() });
  } catch {
    return loadEntitlements();
  }
}

// Self-service data export (COPPA/FERPA portability) for all Fluency Lab localStorage keys.
export function exportFluencyUserData(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const exported = {
    schemaVersion: ENTITLEMENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    records: {},
  };
  if (!storage) return exported;
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith("ewl-fluency-")) {
      try {
        exported.records[key] = JSON.parse(storage.getItem(key));
      } catch {
        exported.records[key] = storage.getItem(key);
      }
    }
  }
  return exported;
}

// Self-service data deletion (COPPA/FERPA right to delete) for all Fluency Lab localStorage keys.
export function deleteFluencyUserData(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return { deletedKeys: [] };
  const toDelete = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith("ewl-fluency-")) toDelete.push(key);
  }
  for (const key of toDelete) storage.removeItem(key);
  return { deletedKeys: toDelete };
}
