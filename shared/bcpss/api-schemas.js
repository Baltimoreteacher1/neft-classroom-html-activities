// F3 Single Schema Module (pure ESM).
// Canonical JSDoc @typedef contracts and runtime validators for all /api/bcpss/*
// and /api/class/* endpoints.

import {
  INSIGHTS_KEYS,
  TELEMETRY_BODY_KEYS,
  TELEMETRY_EVENT_TYPES,
  WIDA_TIERS,
} from "../bcpss-telemetry-schema.js";

const GRADES = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
const SUBJECTS = Object.freeze(["ELA", "Math", "Science", "Social Studies"]);
const UNIT_ID_RE = /^[a-zA-Z0-9_-]{2,80}$/;
const PLAN_ID_RE = /^[a-zA-Z0-9_-]{4,40}$/;
const CLASS_CODE_RE = /^[A-Z0-9]{4,12}$/i;
const ASSIGNMENT_ID_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
const PACKET_PARTS = Object.freeze([
  "student",
  "key",
  "cover",
  "kit-cards",
  "kit-frames",
  "kit-exit",
  "kit-family",
]);
const PACKET_FORMATS = Object.freeze(["html", "pdf", "docx"]);
const WEEK_PLAN_FORMATS = Object.freeze(["json", "html", "pdf", "docx", "ics"]);
const CLASS_APPS = Object.freeze(["fluency", "language"]);
const ASTATUS_ACTIONS = Object.freeze([
  "start",
  "submit",
  "review",
  "request_revision",
  "reassign",
]);
const ASTATUS_STATES = Object.freeze([
  "assigned",
  "in_progress",
  "submitted",
  "reviewed",
  "revision_requested",
]);
const UNIT_DETAIL_TOP_KEYS = new Set([
  "unit",
  "standards",
  "vocabulary",
  "scaffolds",
  "routines",
  "readings",
  "family",
  "provenance",
  "lessons",
  "writing",
  "listening",
  "assessment",
  "module",
  "metadata",
]);

function isPlainObject(v) {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isNonNegInt(v) {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

function result(errors) {
  return { ok: errors.length === 0, errors };
}

/* ── JSDoc Contract Typedefs ──────────────────────────────────────────────── */

/**
 * @typedef {object} UnitsListQuery
 * @property {"K"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"} grade
 * @property {"ELA"|"Math"|"Science"|"Social Studies"} subject
 */

/**
 * @typedef {object} UnitsListResponse
 * @property {string} grade
 * @property {string} subject
 * @property {Array<{ id: string, unit_title?: string, title?: string, grade?: string, subject?: string }>} units
 */

/**
 * @typedef {object} UnitDetailQuery
 * @property {string} unitId
 * @property {string} [fields]
 */

/**
 * @typedef {object} UnitDetailResponse
 * @property {{ id: string, grade?: string, subject?: string, unit_title?: string }} [unit]
 * @property {object} [provenance]
 */

/**
 * @typedef {object} UnitLessonsResponse
 * @property {string} unit_id
 * @property {string|number} [version]
 * @property {string} source
 * @property {string|null} [draft_notice]
 * @property {Array<object>} lessons
 */

/**
 * @typedef {object} FamilyGuideResponse
 * @property {string} [unit_id]
 * @property {object} [unit]
 * @property {object} [en]
 * @property {object} [es]
 */

/**
 * @typedef {object} WeekPlanQuery
 * @property {string} unit
 * @property {"json"|"html"|"pdf"|"docx"|"ics"} [format]
 * @property {number} [block]
 * @property {number} [days]
 */

/**
 * @typedef {object} WeekPlanResponse
 * @property {boolean} ok
 * @property {object} plan
 */

/**
 * @typedef {object} PacketQuery
 * @property {string} unit
 * @property {"student"|"key"|"cover"|"kit-cards"|"kit-frames"|"kit-exit"|"kit-family"} [part]
 * @property {"html"|"pdf"|"docx"} [format]
 * @property {"1_2"|"3_4"|"5_6"} [band]
 * @property {string} [counts]
 */

/**
 * @typedef {object} PacketResponse
 * @property {string} contentType
 * @property {string|Uint8Array} [body]
 */

/**
 * @typedef {object} PathwaysQuery
 * @property {"index"|"atlas"} [view]
 * @property {string} [grade]
 */

/**
 * @typedef {object} PathwaysResponse
 * @property {string} [grade]
 * @property {Array<object>} [grades]
 * @property {Array<object>} [moves]
 * @property {Array<object>} [units]
 */

/**
 * @typedef {object} InsightsResponse
 * @property {number} window_days
 * @property {number} total_events
 * @property {Array<object>} top_grades
 * @property {Array<object>} top_units
 * @property {Array<object>} top_wida_tiers
 * @property {Array<object>} top_klu_demand
 * @property {Array<object>} event_breakdown
 * @property {string} [backend]
 */

/**
 * @typedef {object} TelemetryRequest
 * @property {string} unit_id
 * @property {"1_2"|"3_4"|"5_6"} wida_tier
 * @property {"scaffold_toggle"|"vocab_lookup"|"activity_copy"|"lab_launch"|"esol_routine"|"projection_mode"} event_type
 * @property {boolean} [internal]
 */

/**
 * @typedef {object} TelemetryResponse
 * @property {boolean} ok
 * @property {string} [grade]
 * @property {boolean} [recorded]
 */

/**
 * @typedef {object} SharedPlanCreateRequest
 * @property {string} unit_id
 * @property {"1_2"|"3_4"|"5_6"} wida_tier
 * @property {string} teacher_note
 */

/**
 * @typedef {object} SharedPlanRecord
 * @property {string} id
 * @property {string} unit_id
 * @property {"1_2"|"3_4"|"5_6"} wida_tier
 * @property {string} teacher_note
 */

/**
 * @typedef {object} ClassCreateRequest
 * @property {"fluency"|"language"} app
 * @property {string} title
 */

/**
 * @typedef {object} ClassCreateResponse
 * @property {boolean} ok
 * @property {string} code
 * @property {string} teacherPasscode
 * @property {"fluency"|"language"} app
 * @property {string} title
 */

/**
 * @typedef {object} ClassJoinRequest
 * @property {string} code
 * @property {string} alias
 * @property {string} [studentKey]
 */

/**
 * @typedef {object} ClassJoinResponse
 * @property {boolean} ok
 * @property {string} studentId
 * @property {string} studentKey
 * @property {string} alias
 */

/**
 * @typedef {object} AssignmentActionRequest
 * @property {string} code
 * @property {string} assignmentId
 * @property {"start"|"submit"|"review"|"request_revision"|"reassign"} action
 * @property {string} [studentId]
 * @property {string} [comment]
 */

/**
 * @typedef {object} AssignmentActionResponse
 * @property {boolean} ok
 * @property {{ assignmentId: string, studentId: string, state: string, attempt: number, late: boolean, comment: string, updatedAt: number }} status
 */

/**
 * @typedef {object} AssignmentBoardResponse
 * @property {boolean} ok
 * @property {number} students
 * @property {Array<{ id: string, title: string, summary: object, students: Array<object> }>} assignments
 */

/**
 * @typedef {object} ClassInfoResponse
 * @property {boolean} ok
 * @property {string} code
 * @property {"fluency"|"language"} app
 * @property {string} title
 * @property {number} students
 * @property {Array<object>} assignments
 */

/* ── Validators ───────────────────────────────────────────────────────────── */

function validateUnitsListRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!GRADES.includes(String(payload.grade ?? ""))) {
    errors.push(`grade must be one of: ${GRADES.join(", ")}`);
  }
  if (!SUBJECTS.includes(String(payload.subject ?? ""))) {
    errors.push(`subject must be one of: ${SUBJECTS.join(", ")}`);
  }
  return result(errors);
}

function validateUnitsListResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!GRADES.includes(String(payload.grade ?? ""))) errors.push("grade must be a valid K-8 grade");
  if (!SUBJECTS.includes(String(payload.subject ?? ""))) {
    errors.push("subject must be a valid BCPSS subject");
  }
  if (!Array.isArray(payload.units)) {
    errors.push("units must be an array");
  } else {
    for (let i = 0; i < payload.units.length; i += 1) {
      const u = payload.units[i];
      if (!isPlainObject(u) || !UNIT_ID_RE.test(String(u.id ?? ""))) {
        errors.push(`units[${i}].id must be a valid unit identifier`);
      }
    }
  }
  return result(errors);
}

function validateUnitDetailRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!UNIT_ID_RE.test(String(payload.unitId ?? ""))) {
    errors.push("unitId must be a valid unit identifier");
  }
  if (payload.fields !== undefined && !isNonEmptyString(payload.fields)) {
    errors.push("fields must be a non-empty comma-separated string when provided");
  }
  return result(errors);
}

function validateUnitDetailResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    errors.push("unit detail response must contain at least one field");
    return result(errors);
  }
  const hasKnownKey = keys.some((k) => UNIT_DETAIL_TOP_KEYS.has(k));
  if (!hasKnownKey) {
    errors.push("unit detail response contains no recognized unit detail fields");
  }
  if ("unit" in payload) {
    if (!isPlainObject(payload.unit)) {
      errors.push("unit must be an object");
    } else if ("id" in payload.unit && !UNIT_ID_RE.test(String(payload.unit.id ?? ""))) {
      errors.push("unit.id must be a valid unit identifier");
    }
  }
  return result(errors);
}

function validateUnitLessonsResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!UNIT_ID_RE.test(String(payload.unit_id ?? ""))) {
    errors.push("unit_id must be a valid unit identifier");
  }
  if (!isNonEmptyString(payload.source)) errors.push("source must be a non-empty string");
  if (!Array.isArray(payload.lessons)) errors.push("lessons must be an array");
  return result(errors);
}

function validateFamilyGuideResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  const hasUnit = isPlainObject(payload.unit) || UNIT_ID_RE.test(String(payload.unit_id ?? ""));
  if (!hasUnit) errors.push("family guide must include unit or valid unit_id");
  return result(errors);
}

function validateWeekPlanRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!UNIT_ID_RE.test(String(payload.unit ?? ""))) {
    errors.push("unit must be a valid unit identifier");
  }
  if (payload.format !== undefined && !WEEK_PLAN_FORMATS.includes(String(payload.format))) {
    errors.push(`format must be one of: ${WEEK_PLAN_FORMATS.join(", ")}`);
  }
  return result(errors);
}

function validateWeekPlanResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (!isPlainObject(payload.plan)) errors.push("plan must be an object");
  return result(errors);
}

function validatePacketRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!UNIT_ID_RE.test(String(payload.unit ?? ""))) {
    errors.push("unit must be a valid unit identifier");
  }
  if (payload.part !== undefined && !PACKET_PARTS.includes(String(payload.part))) {
    errors.push(`part must be one of: ${PACKET_PARTS.join(", ")}`);
  }
  if (payload.format !== undefined && !PACKET_FORMATS.includes(String(payload.format))) {
    errors.push(`format must be one of: ${PACKET_FORMATS.join(", ")}`);
  }
  if (payload.band !== undefined && !WIDA_TIERS.includes(String(payload.band))) {
    errors.push(`band must be one of: ${WIDA_TIERS.join(", ")}`);
  }
  return result(errors);
}

function validatePacketResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!isNonEmptyString(payload.contentType)) errors.push("contentType must be a non-empty string");
  return result(errors);
}

function validatePathwaysRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.view !== undefined && !["index", "atlas"].includes(String(payload.view))) {
    errors.push('view must be "index" or "atlas"');
  }
  if (payload.grade !== undefined && !GRADES.includes(String(payload.grade))) {
    errors.push(`grade must be one of: ${GRADES.join(", ")}`);
  }
  return result(errors);
}

function validatePathwaysResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (Object.keys(payload).length === 0) errors.push("pathways response cannot be empty");
  return result(errors);
}

function validateInsightsResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!isNonNegInt(payload[INSIGHTS_KEYS.window])) {
    errors.push(`${INSIGHTS_KEYS.window} must be a non-negative integer`);
  }
  if (!isNonNegInt(payload[INSIGHTS_KEYS.total])) {
    errors.push(`${INSIGHTS_KEYS.total} must be a non-negative integer`);
  }
  for (const key of [
    INSIGHTS_KEYS.grades,
    INSIGHTS_KEYS.units,
    INSIGHTS_KEYS.tiers,
    INSIGHTS_KEYS.klus,
    INSIGHTS_KEYS.events,
  ]) {
    if (!Array.isArray(payload[key])) errors.push(`${key} must be an array`);
  }
  return result(errors);
}

function validateTelemetryRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  for (const key of Object.keys(payload)) {
    if (!TELEMETRY_BODY_KEYS.includes(key)) {
      errors.push(`unexpected field in telemetry body: ${key}`);
    }
  }
  if (!UNIT_ID_RE.test(String(payload.unit_id ?? ""))) {
    errors.push("unit_id is required and must be a valid unit identifier");
  }
  if (!WIDA_TIERS.includes(String(payload.wida_tier ?? ""))) {
    errors.push(`wida_tier must be one of: ${WIDA_TIERS.join(", ")}`);
  }
  if (!TELEMETRY_EVENT_TYPES.includes(String(payload.event_type ?? ""))) {
    errors.push(`event_type must be one of: ${TELEMETRY_EVENT_TYPES.join(", ")}`);
  }
  if (payload.internal !== undefined && typeof payload.internal !== "boolean") {
    errors.push("internal must be a boolean");
  }
  return result(errors);
}

function validateTelemetryResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (payload.recorded === false) return result(errors);
  if (payload.grade !== undefined && !GRADES.includes(String(payload.grade))) {
    errors.push("grade must be a valid K-8 grade");
  }
  return result(errors);
}

function validatePlanCreateRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  const allowed = new Set(["unit_id", "wida_tier", "teacher_note"]);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) errors.push(`unexpected field in plan body: ${key}`);
  }
  if (!UNIT_ID_RE.test(String(payload.unit_id ?? ""))) {
    errors.push("unit_id is required and must be a valid unit identifier");
  }
  if (!WIDA_TIERS.includes(String(payload.wida_tier ?? ""))) {
    errors.push(`wida_tier must be one of: ${WIDA_TIERS.join(", ")}`);
  }
  if (!isNonEmptyString(payload.teacher_note)) {
    errors.push("teacher_note must be a non-empty string");
  }
  return result(errors);
}

function validatePlanResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!PLAN_ID_RE.test(String(payload.id ?? ""))) errors.push("id must be a valid plan id");
  if (!UNIT_ID_RE.test(String(payload.unit_id ?? ""))) {
    errors.push("unit_id must be a valid unit identifier");
  }
  if (!WIDA_TIERS.includes(String(payload.wida_tier ?? ""))) {
    errors.push(`wida_tier must be one of: ${WIDA_TIERS.join(", ")}`);
  }
  if (!isNonEmptyString(payload.teacher_note))
    errors.push("teacher_note must be a non-empty string");
  return result(errors);
}

function validatePlanReadRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!PLAN_ID_RE.test(String(payload.id ?? ""))) errors.push("id must be a valid plan id");
  return result(errors);
}

function validateClassCreateRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!CLASS_APPS.includes(String(payload.app ?? ""))) {
    errors.push(`app must be one of: ${CLASS_APPS.join(", ")}`);
  }
  if (!isNonEmptyString(payload.title)) errors.push("title must be a non-empty string");
  return result(errors);
}

function validateClassCreateResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (!CLASS_CODE_RE.test(String(payload.code ?? "")))
    errors.push("code must be a valid class code");
  if (!isNonEmptyString(payload.teacherPasscode)) errors.push("teacherPasscode is required");
  if (!CLASS_APPS.includes(String(payload.app ?? ""))) errors.push("app must be a valid class app");
  if (!isNonEmptyString(payload.title)) errors.push("title is required");
  return result(errors);
}

function validateClassJoinRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!CLASS_CODE_RE.test(String(payload.code ?? "")))
    errors.push("code must be a valid class code");
  if (!isNonEmptyString(payload.alias)) errors.push("alias must be a non-empty string");
  return result(errors);
}

function validateClassJoinResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (!isNonEmptyString(payload.studentId)) errors.push("studentId is required");
  if (!isNonEmptyString(payload.studentKey)) errors.push("studentKey is required");
  if (!isNonEmptyString(payload.alias)) errors.push("alias is required");
  return result(errors);
}

function validateAssignmentActionRequest(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!CLASS_CODE_RE.test(String(payload.code ?? "")))
    errors.push("code must be a valid class code");
  if (!ASSIGNMENT_ID_RE.test(String(payload.assignmentId ?? ""))) {
    errors.push("assignmentId must be a valid assignment identifier");
  }
  if (!ASTATUS_ACTIONS.includes(String(payload.action ?? ""))) {
    errors.push(`action must be one of: ${ASTATUS_ACTIONS.join(", ")}`);
  }
  return result(errors);
}

function validateAssignmentActionResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (!isPlainObject(payload.status)) {
    errors.push("status must be an object");
  } else {
    if (!ASSIGNMENT_ID_RE.test(String(payload.status.assignmentId ?? ""))) {
      errors.push("status.assignmentId is invalid");
    }
    if (!ASTATUS_STATES.includes(String(payload.status.state ?? ""))) {
      errors.push(`status.state must be one of: ${ASTATUS_STATES.join(", ")}`);
    }
  }
  return result(errors);
}

function validateClassCodeQuery(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (!CLASS_CODE_RE.test(String(payload.code ?? "")))
    errors.push("code must be a valid class code");
  return result(errors);
}

function validateAssignmentBoardResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (!isNonNegInt(payload.students)) errors.push("students must be a non-negative integer");
  if (!Array.isArray(payload.assignments)) errors.push("assignments must be an array");
  return result(errors);
}

function validateClassInfoResponse(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return result(["payload must be an object"]);
  if (payload.ok !== true) errors.push("ok must be true");
  if (!CLASS_CODE_RE.test(String(payload.code ?? "")))
    errors.push("code must be a valid class code");
  if (!CLASS_APPS.includes(String(payload.app ?? ""))) errors.push("app must be a valid class app");
  if (!isNonEmptyString(payload.title)) errors.push("title is required");
  if (!isNonNegInt(payload.students)) errors.push("students must be a non-negative integer");
  if (!Array.isArray(payload.assignments)) errors.push("assignments must be an array");
  return result(errors);
}

/* ── Canonical API Schema Registry ────────────────────────────────────────── */

export const API_SCHEMAS = Object.freeze({
  "/api/bcpss/units": Object.freeze({
    method: "GET",
    requestSchema: "UnitsListQuery",
    responseSchema: "UnitsListResponse",
    validateRequest: validateUnitsListRequest,
    validateResponse: validateUnitsListResponse,
  }),
  "/api/bcpss/units/:unitId": Object.freeze({
    method: "GET",
    requestSchema: "UnitDetailQuery",
    responseSchema: "UnitDetailResponse",
    validateRequest: validateUnitDetailRequest,
    validateResponse: validateUnitDetailResponse,
  }),
  "/api/bcpss/units/:unitId/lessons": Object.freeze({
    method: "GET",
    requestSchema: "UnitDetailQuery",
    responseSchema: "UnitLessonsResponse",
    validateRequest: validateUnitDetailRequest,
    validateResponse: validateUnitLessonsResponse,
  }),
  "/api/bcpss/family-guide/:unitId": Object.freeze({
    method: "GET",
    requestSchema: "UnitDetailQuery",
    responseSchema: "FamilyGuideResponse",
    validateRequest: validateUnitDetailRequest,
    validateResponse: validateFamilyGuideResponse,
  }),
  "/api/bcpss/week-plan": Object.freeze({
    method: "GET",
    requestSchema: "WeekPlanQuery",
    responseSchema: "WeekPlanResponse",
    validateRequest: validateWeekPlanRequest,
    validateResponse: validateWeekPlanResponse,
  }),
  "/api/bcpss/packet": Object.freeze({
    method: "GET",
    requestSchema: "PacketQuery",
    responseSchema: "PacketResponse",
    validateRequest: validatePacketRequest,
    validateResponse: validatePacketResponse,
  }),
  "/api/bcpss/pathways": Object.freeze({
    method: "GET",
    requestSchema: "PathwaysQuery",
    responseSchema: "PathwaysResponse",
    validateRequest: validatePathwaysRequest,
    validateResponse: validatePathwaysResponse,
  }),
  "/api/bcpss/insights": Object.freeze({
    method: "GET",
    requestSchema: null,
    responseSchema: "InsightsResponse",
    validateRequest: () => result([]),
    validateResponse: validateInsightsResponse,
  }),
  "/api/bcpss/telemetry": Object.freeze({
    method: "POST",
    requestSchema: "TelemetryRequest",
    responseSchema: "TelemetryResponse",
    validateRequest: validateTelemetryRequest,
    validateResponse: validateTelemetryResponse,
  }),
  "/api/bcpss/plans": Object.freeze({
    method: "POST",
    requestSchema: "SharedPlanCreateRequest",
    responseSchema: "SharedPlanRecord",
    validateRequest: validatePlanCreateRequest,
    validateResponse: validatePlanResponse,
  }),
  "/api/bcpss/plans/:id": Object.freeze({
    method: "GET",
    requestSchema: "SharedPlanReadQuery",
    responseSchema: "SharedPlanRecord",
    validateRequest: validatePlanReadRequest,
    validateResponse: validatePlanResponse,
  }),
  "/api/class/create": Object.freeze({
    method: "POST",
    requestSchema: "ClassCreateRequest",
    responseSchema: "ClassCreateResponse",
    validateRequest: validateClassCreateRequest,
    validateResponse: validateClassCreateResponse,
  }),
  "/api/class/join": Object.freeze({
    method: "POST",
    requestSchema: "ClassJoinRequest",
    responseSchema: "ClassJoinResponse",
    validateRequest: validateClassJoinRequest,
    validateResponse: validateClassJoinResponse,
  }),
  "/api/class/astatus/act": Object.freeze({
    method: "POST",
    requestSchema: "AssignmentActionRequest",
    responseSchema: "AssignmentActionResponse",
    validateRequest: validateAssignmentActionRequest,
    validateResponse: validateAssignmentActionResponse,
  }),
  "/api/class/astatus/board": Object.freeze({
    method: "GET",
    requestSchema: "ClassCodeQuery",
    responseSchema: "AssignmentBoardResponse",
    validateRequest: validateClassCodeQuery,
    validateResponse: validateAssignmentBoardResponse,
  }),
  "/api/class/info": Object.freeze({
    method: "GET",
    requestSchema: "ClassCodeQuery",
    responseSchema: "ClassInfoResponse",
    validateRequest: validateClassCodeQuery,
    validateResponse: validateClassInfoResponse,
  }),
});

const NAMED_VALIDATORS = new Map();
for (const [route, def] of Object.entries(API_SCHEMAS)) {
  NAMED_VALIDATORS.set(`${route}:request`, def.validateRequest);
  NAMED_VALIDATORS.set(`${route}:response`, def.validateResponse);
  if (def.requestSchema) NAMED_VALIDATORS.set(def.requestSchema, def.validateRequest);
  if (def.responseSchema) NAMED_VALIDATORS.set(def.responseSchema, def.validateResponse);
}

/**
 * Validate a payload against a named schema (either a typedef name like
 * `"TelemetryRequest"` / `"UnitDetailResponse"` or a route key like
 * `"/api/bcpss/telemetry:request"` / `"/api/bcpss/units/:unitId:response"`).
 * @param {string} schemaName
 * @param {unknown} payload
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validatePayload(schemaName, payload) {
  const validator = NAMED_VALIDATORS.get(schemaName);
  if (!validator) {
    return { ok: false, errors: [`Unknown schema: ${String(schemaName)}`] };
  }
  return validator(payload);
}
