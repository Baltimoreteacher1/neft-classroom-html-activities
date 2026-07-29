/* Curriculum Learning Loop — progressive enhancement only.
 *
 * The loop strip in curriculum/index.html is fully functional as static HTML:
 * every stage is a real link to a real tool. This file does two optional things
 * on top, and NEVER throws into the page:
 *
 *   1. Re-points the "Teach" stage at whichever lesson the hub currently has
 *      selected, so the teacher lands on the lesson instead of the directory.
 *   2. Clears the "No classroom evidence yet" marker on "Check transfer" for
 *      lessons that actually carry a transfer + retention task, and leaves it in
 *      place for the ones that do not. The label is honest either way.
 *
 * It reads only the PUBLIC, student-safe curriculum manifest. The teacher half
 * of the loop (misconceptions, rubrics, answers) is never fetched here — it is
 * served exclusively by the TEACHER_KEY-gated /api/curriculum/loop.
 *
 * If the fetch fails, the network is offline, or the manifest is an older
 * version without loop data, the static markup simply stands as authored.
 */
(function () {
  "use strict";

  var MANIFEST = "/data/curriculum-manifest.json";
  var root = document.querySelector(".nt-loop");
  if (!root) return;

  /* The hub stores the selected lesson in a few places depending on which entry
     point the teacher used. Read them in priority order; any miss is fine. */
  function selectedLessonId() {
    try {
      var qs = new URLSearchParams(location.search).get("lesson");
      if (qs) return qs;
      var ls = localStorage.getItem("nt-curriculum-selected-lesson");
      if (ls) return ls;
      var active = document.querySelector(
        "[data-lesson-id][aria-current], [data-lesson-id].is-selected",
      );
      if (active) return active.getAttribute("data-lesson-id");
    } catch (_e) {
      /* storage or URL unavailable — fall through */
    }
    return null;
  }

  function applyTeachLink(lesson) {
    var link = root.querySelector("[data-loop-teach]");
    if (!link || !lesson || !lesson.lessonPath) return;
    link.setAttribute("href", lesson.lessonPath);
    var what = link.querySelector(".nt-loop__what");
    if (what && lesson.title) {
      what.textContent =
        "Open " + lesson.title + " with its objective, vocabulary, and modelling ready.";
    }
  }

  function applyTransferState(lesson) {
    var stage = root.querySelector(".nt-loop__stage--unproven");
    if (!stage) return;
    var loop = lesson && lesson.loop;
    var hasTransfer = Boolean(loop && loop.transfer && loop.transfer.prompt);
    var hasRetention = Boolean(loop && loop.retention && loop.retention.prompt);
    if (hasTransfer && hasRetention) {
      // This lesson genuinely has both checks authored — drop the marker.
      stage.classList.remove("nt-loop__stage--unproven");
      var what = stage.querySelector(".nt-loop__what");
      if (what) {
        what.textContent =
          "This lesson has a transfer task and a retention check " +
          (loop.retention.afterDays
            ? "for about " + loop.retention.afterDays + " days later."
            : "for later.");
      }
    }
  }

  function boot() {
    var id = selectedLessonId();
    if (!id) return; // nothing selected — static markup is correct as-is
    if (typeof fetch !== "function") return;

    fetch(MANIFEST, { credentials: "omit" })
      .then(function (r) {
        return r && r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.lessons)) return;
        var lesson = null;
        for (var i = 0; i < data.lessons.length; i += 1) {
          if (data.lessons[i] && data.lessons[i].id === id) {
            lesson = data.lessons[i];
            break;
          }
        }
        if (!lesson) return;
        applyTeachLink(lesson);
        applyTransferState(lesson);
      })
      .catch(function () {
        /* offline or blocked — the static loop strip already works */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
