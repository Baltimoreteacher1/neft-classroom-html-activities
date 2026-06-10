/**
 * curriculum-progress-bridge.js — sync curriculum hub checkmarks to neft-school-hub-api.
 * Privacy: uses student_key (class number / handle), never real names.
 * localStorage "curriculumProgress" stays the instant source of truth.
 */
(function () {
  "use strict";

  var API_BASE =
    (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.apiBase) ||
    "https://neft-school-hub-api.neftjd.workers.dev";
  var TENANT_ID =
    (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.tenantId) || "harbor-view";
  var REF_KEY = "nt_student_ref";
  var STUDENT_KEY = "nt_student";

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  /** Pseudonymous student key — roster number or alias, not legal name. */
  function studentKey() {
    if (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.studentKey) {
      return String(window.CURRICULUM_SYNC.studentKey);
    }
    var ref = localStorage.getItem(REF_KEY);
    if (ref) return ref.trim();
    var st = readJson(STUDENT_KEY, {});
    if (st && st.alias) return String(st.alias).trim();
    return "";
  }

  function section() {
    if (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.section) {
      return String(window.CURRICULUM_SYNC.section);
    }
    var st = readJson(STUDENT_KEY, {});
    return (st && st.section) || "";
  }

  function unitIdFromLesson(lessonId) {
    var m = String(lessonId || "").match(/^(\d+)/);
    return m ? "unit-" + m[1] : "unit-unknown";
  }

  function canSync() {
    return Boolean(API_BASE && TENANT_ID && studentKey());
  }

  function postProgress(body) {
    if (!canSync()) return;
    fetch(API_BASE.replace(/\/$/, "") + "/api/curriculum/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(function () {});
  }

  /** Push one hub checkmark to D1 (non-blocking). */
  function syncToggle(lessonId, activityHref, completed) {
    postProgress({
      tenant_id: TENANT_ID,
      student_key: studentKey(),
      section: section() || null,
      unit_id: unitIdFromLesson(lessonId),
      lesson_id: lessonId,
      activity_id: activityHref,
      status: completed ? "completed" : "not_started",
      progress_percent: completed ? 100 : 0,
      last_event: completed ? "hub_check" : "hub_uncheck",
    });
  }

  /** Merge remote rows into the hub's boolean progress map. */
  function mergeRemoteRows(rows, progress, progressKeyFn) {
    if (!Array.isArray(rows)) return false;
    var changed = false;
    rows.forEach(function (row) {
      if (!row.lesson_id || !row.activity_id) return;
      var key = progressKeyFn(row.lesson_id, row.activity_id);
      var done = row.status === "completed";
      if (!!progress[key] !== done) {
        if (done) progress[key] = true;
        else delete progress[key];
        changed = true;
      }
    });
    return changed;
  }

  /** Pull D1 progress and merge into local map; returns Promise<boolean>. */
  function hydrateFromServer(progress, progressKeyFn) {
    if (!canSync()) return Promise.resolve(false);
    var params = new URLSearchParams({
      tenant_id: TENANT_ID,
      student_key: studentKey(),
    });
    var sec = section();
    if (sec) params.set("section", sec);
    return fetch(
      API_BASE.replace(/\/$/, "") + "/api/curriculum/progress?" + params.toString(),
    )
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data) return false;
        return mergeRemoteRows(data.progress, progress, progressKeyFn);
      })
      .catch(function () {
        return false;
      });
  }

  /** Push all local checkmarks up (migration / first visit). */
  function pushAllLocal(progress, parseKeyFn) {
    if (!canSync()) return;
    Object.keys(progress).forEach(function (key) {
      if (!progress[key]) return;
      var parsed = parseKeyFn(key);
      if (!parsed) return;
      syncToggle(parsed.lessonId, parsed.href, true);
    });
  }

  window.CurriculumProgressBridge = {
    canSync: canSync,
    studentKey: studentKey,
    section: section,
    syncToggle: syncToggle,
    hydrateFromServer: hydrateFromServer,
    pushAllLocal: pushAllLocal,
  };
})();
