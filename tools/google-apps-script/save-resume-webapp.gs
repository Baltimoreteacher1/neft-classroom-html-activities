/* =============================================================================
 * Neft Teacher — Save / Resume backend for Google Apps Script
 * -----------------------------------------------------------------------------
 * A ready-to-paste Apps Script Web App that stores student save/resume records
 * in a Google Sheet tab named "Student Progress". Use this when you prefer a
 * Google-Sheet backend over Cloudflare D1.
 *
 * ── SETUP (one time) ────────────────────────────────────────────────────────
 *  1. Create (or open) a Google Sheet.
 *  2. Extensions ▸ Apps Script. Delete any boilerplate, paste THIS file.
 *  3. Save. Run the function `setup` once (Run ▸ setup) and grant permissions.
 *     This creates the "Student Progress" tab with headers.
 *  4. Deploy ▸ New deployment ▸ type "Web app".
 *       - Description: Save/Resume API
 *       - Execute as: Me
 *       - Who has access: Anyone   (required so students' browsers can reach it)
 *  5. Copy the Web App URL (ends in /exec).
 *  6. In your lesson, configure the engine:
 *       window.NeftSaveResumeConfig = {
 *         backend: "googleAppsScript",
 *         endpoint: "https://script.google.com/macros/s/XXXX/exec"
 *       };
 *     (set BEFORE the engine <script> loads), OR call
 *       NeftSaveResume.init({ backend:"googleAppsScript", endpoint:"...","..." }).
 *
 * ── API ─────────────────────────────────────────────────────────────────────
 *   GET  ?action=health                  -> { ok:true }
 *   GET  ?action=load&code=MATH-7KQ2     -> { ok:true, record:{...} } | { ok:false }
 *   POST { action:"create"|"save", record:{...} }  -> { ok:true, saveCode }
 *
 * The client posts with Content-Type text/plain to avoid a CORS preflight;
 * doPost reads e.postData.contents and JSON-parses it.
 *
 * Student data stored is minimal: code, name/section, activity, state JSON,
 * progress, timestamps. Do not put sensitive data in activity state.
 * ========================================================================== */

var SHEET_NAME = "Student Progress";
var HEADERS = [
  "save_code",
  "activity_id",
  "activity_title",
  "student_name",
  "section",
  "progress_percent",
  "state_json",
  "created_at",
  "updated_at",
];

/** Run once from the editor to create the tab + headers. */
function setup() {
  var sheet = getSheet_();
  Logger.log("Ready. Tab: " + sheet.getName());
}

function getSheet_() {
  return getSheetNamed_(SHEET_NAME);
}

/** Get (or create, with headers) any tab by name. */
function getSheetNamed_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Turn a free-text class label into a safe, stable tab name. Google tab names
 * can't contain  : \ / ? * [ ]  and max out at 100 chars. Blank class -> a
 * single "No Class" catch-all so nothing is lost.
 */
function classTabName_(section) {
  var s = String(section || "")
    .replace(/[:\\\/\?\*\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  return s ? "Class · " + s : "Class · (none)";
}

function buildJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function findRow_(sheet, code) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(code)) {
      return { rowIndex: i + 1, values: values[i] };
    }
  }
  return null;
}

function rowToRecord_(row) {
  var state = {};
  try {
    state = JSON.parse(row[6] || "{}");
  } catch (e) {
    state = {};
  }
  return {
    schema: 1,
    saveCode: row[0],
    activityId: row[1],
    activityTitle: row[2],
    studentName: row[3],
    section: row[4],
    progressPercent: Number(row[5]) || 0,
    state: state,
    createdAt: row[7],
    updatedAt: row[8],
  };
}

/** GET handler: health + load. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "health") return buildJson_({ ok: true });
  if (p.action === "load") {
    var code = String(p.code || "").toUpperCase();
    if (!code) return buildJson_({ ok: false, error: "no-code" });
    var sheet = getSheet_();
    var hit = findRow_(sheet, code);
    if (!hit) return buildJson_({ ok: false, error: "not-found" });
    return buildJson_({ ok: true, record: rowToRecord_(hit.values) });
  }
  return buildJson_({ ok: false, error: "unknown-action" });
}

/** POST handler: create + save. */
function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return buildJson_({ ok: false, error: "bad-json" });
  }
  var action = body.action || "save";
  var rec = body.record || {};
  var code = String(rec.saveCode || "").toUpperCase();
  if (!code) return buildJson_({ ok: false, error: "no-code" });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // serialise writes to avoid row races
  } catch (e2) {
    return buildJson_({ ok: false, error: "busy" });
  }
  try {
    var sheet = getSheet_();
    var nowIso = new Date().toISOString();
    var stateJson = JSON.stringify(rec.state || {});
    var existing = findRow_(sheet, code);
    var rowVals = [
      code,
      rec.activityId || "",
      rec.activityTitle || "",
      rec.studentName || "",
      rec.section || "",
      Number(rec.progressPercent) || 0,
      stateJson,
      // Preserve the original created_at on updates.
      (existing && existing.values[7]) || rec.createdAt || nowIso,
      nowIso,
    ];
    // Keep an existing name/section if this save came in blank.
    if (existing) {
      if (!rowVals[3]) rowVals[3] = existing.values[3];
      if (!rowVals[4]) rowVals[4] = existing.values[4];
    }
    // 1) Master tab: every student, every class, one row per code.
    upsertRow_(sheet, existing, rowVals);
    // 2) Per-class tab: same row mirrored into a tab named for the class, so the
    //    sheet is automatically organised by class with no manual sorting.
    var classSheet = getSheetNamed_(classTabName_(rowVals[4]));
    upsertRow_(classSheet, findRow_(classSheet, code), rowVals);
    return buildJson_({ ok: true, saveCode: code, updatedAt: nowIso });
  } finally {
    lock.releaseLock();
  }
}

/** Insert or overwrite the row for a code in a given sheet. */
function upsertRow_(sheet, existing, rowVals) {
  if (existing) {
    sheet.getRange(existing.rowIndex, 1, 1, HEADERS.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }
}

/** Quick self-test you can run from the editor. */
function test_() {
  var code = "TEST-AB12";
  doPost({
    postData: {
      contents: JSON.stringify({
        action: "create",
        record: {
          saveCode: code,
          activityId: "demo",
          activityTitle: "Demo",
          studentName: "J.N.",
          section: "P1",
          progressPercent: 42,
          state: { fields: { "#a": { t: "input", v: "hi" } } },
        },
      }),
    },
  });
  var out = doGet({ parameter: { action: "load", code: code } });
  Logger.log(out.getContent());
}
