/**
 * mock-lms.mjs — a test-only SCORM 1.2 LMS runtime.
 *
 * TEST INFRASTRUCTURE ONLY. It is never packaged: the SCO discovers `window.API`
 * from a PARENT frame, which in production is the LMS and here is the harness.
 * Nothing under functions/ or assets/ imports this file, and validate-scorm-fleet
 * asserts that no generated package contains the string "mock-lms".
 *
 * It records every call in order with its arguments, so a test can assert the
 * LIFECYCLE (Initialize before any read/write, Commit before Finish, no write
 * after Finish, no second Initialize) rather than just the final values — the
 * ordering bugs are the ones that make an LMS drop a grade while every value
 * looks right in isolation.
 *
 * It also models the parts of SCORM 1.2 that real LMSs enforce and that a
 * permissive stub would hide: error codes via LMSGetLastError, the CMIString4096
 * limit on suspend_data, the CMIString255 limit on lesson_location, and the
 * read-only/write-only split on the core elements.
 */

const E = {
  NONE: "0",
  GENERAL: "101",
  ALREADY_INITIALIZED: "101",
  NOT_INITIALIZED: "301",
  INVALID_ARG: "201",
  ELEMENT_READ_ONLY: "403",
  ELEMENT_TYPE_MISMATCH: "405",
  DATA_MODEL_ELEMENT_OUT_OF_RANGE: "407",
};

const STRINGS = {
  0: "No error",
  101: "General exception",
  201: "Invalid argument error",
  301: "Not initialized",
  403: "Element is read only",
  405: "Incorrect data type",
  407: "Data model element value out of range",
};

const LIMITS = { "cmi.suspend_data": 4096, "cmi.core.lesson_location": 255 };
const READ_ONLY = new Set(["cmi.core.student_id", "cmi.core.student_name", "cmi.core.credit"]);
const VALID_STATUS = new Set([
  "passed",
  "completed",
  "failed",
  "incomplete",
  "browsed",
  "not attempted",
]);

/**
 * @param {object} [opts]
 * @param {object} [opts.data]  seed cmi values (simulates a relaunch)
 * @param {(op: string, key: string) => string|null} [opts.fail]
 *        return a SCORM error code to force that call to fail — used to prove
 *        the SCO degrades instead of looping or crashing.
 */
export function createMockLms(opts = {}) {
  const calls = [];
  const commits = [];
  let error = E.NONE;
  let initialized = false;
  let terminated = false;

  const data = Object.assign(
    {
      "cmi.core.student_id": "1001",
      "cmi.core.student_name": "Rivera, Ana",
      "cmi.core.lesson_status": "not attempted",
      "cmi.core.lesson_location": "",
      "cmi.core.score.raw": "",
      "cmi.core.score.min": "",
      "cmi.core.score.max": "",
      "cmi.core.session_time": "",
      "cmi.suspend_data": "",
    },
    opts.data || {},
  );

  const forced = (op, key) => (opts.fail ? opts.fail(op, key) : null);
  const record = (op, key, value, result) => {
    calls.push({ op, key, value, result, error });
    return result;
  };

  const API = {
    LMSInitialize(arg) {
      const f = forced("Initialize", "");
      if (f) {
        error = f;
        return record("LMSInitialize", "", arg, "false");
      }
      if (initialized) {
        error = E.ALREADY_INITIALIZED;
        return record("LMSInitialize", "", arg, "false");
      }
      initialized = true;
      error = E.NONE;
      return record("LMSInitialize", "", arg, "true");
    },

    LMSGetValue(key) {
      if (!initialized || terminated) {
        error = E.NOT_INITIALIZED;
        return record("LMSGetValue", key, undefined, "");
      }
      error = E.NONE;
      return record("LMSGetValue", key, undefined, String(data[key] ?? ""));
    },

    LMSSetValue(key, value) {
      if (!initialized || terminated) {
        error = E.NOT_INITIALIZED;
        return record("LMSSetValue", key, value, "false");
      }
      const f = forced("SetValue", key);
      if (f) {
        error = f;
        return record("LMSSetValue", key, value, "false");
      }
      if (READ_ONLY.has(key)) {
        error = E.ELEMENT_READ_ONLY;
        return record("LMSSetValue", key, value, "false");
      }
      const limit = LIMITS[key];
      if (limit && String(value).length > limit) {
        error = E.DATA_MODEL_ELEMENT_OUT_OF_RANGE;
        return record("LMSSetValue", key, value, "false");
      }
      if (key === "cmi.core.lesson_status" && !VALID_STATUS.has(String(value))) {
        error = E.ELEMENT_TYPE_MISMATCH;
        return record("LMSSetValue", key, value, "false");
      }
      data[key] = String(value);
      error = E.NONE;
      return record("LMSSetValue", key, value, "true");
    },

    LMSCommit(arg) {
      if (!initialized || terminated) {
        error = E.NOT_INITIALIZED;
        return record("LMSCommit", "", arg, "false");
      }
      const f = forced("Commit", "");
      if (f) {
        error = f;
        return record("LMSCommit", "", arg, "false");
      }
      commits.push({ ...data });
      error = E.NONE;
      return record("LMSCommit", "", arg, "true");
    },

    LMSFinish(arg) {
      if (!initialized || terminated) {
        error = E.NOT_INITIALIZED;
        return record("LMSFinish", "", arg, "false");
      }
      terminated = true;
      error = E.NONE;
      return record("LMSFinish", "", arg, "true");
    },

    LMSGetLastError: () => error,
    LMSGetErrorString: (c) => STRINGS[Number(c)] || "Unknown error",
    LMSGetDiagnostic: (c) => `mock-lms diagnostic for ${c}`,
  };

  return {
    API,
    data,
    calls,
    commits,
    get initialized() {
      return initialized;
    },
    get terminated() {
      return terminated;
    },
    /** Ordered list of op names, for lifecycle assertions. */
    ops: () => calls.map((c) => c.op),
    /** Every call for one op, e.g. opsFor("LMSSetValue"). */
    opsFor: (op) => calls.filter((c) => c.op === op),
    /** Last value written to a key (what the LMS would keep). */
    valueOf: (key) => data[key],
  };
}
