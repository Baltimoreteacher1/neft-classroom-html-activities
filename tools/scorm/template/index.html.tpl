<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{TITLE}}</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #fff;
      }
      #lesson {
        border: 0;
        width: 100%;
        height: 100vh;
        display: block;
      }
    </style>
  </head>
  <body>
    <!--
      SCORM 1.2 SCO wrapper for a Neft lesson.
      - Finds the LMS SCORM API and initializes it.
      - Embeds the live lesson (?lms=scorm hides the manual code popup).
      - The lesson postMessages its score on completion; we write it to
        cmi.core.score.raw and mark the lesson complete -> Canvas gradebook.
      Lesson content stays on the live site, so updates need no re-upload.
    -->
    <iframe
      id="lesson"
      src="{{LESSON_URL}}{{LAUNCH_QUERY}}"
      allow="fullscreen; clipboard-write"
      title="{{TITLE}}"
    ></iframe>
    <script>
      (function () {
        "use strict";
        var LESSON_ORIGIN = "{{LESSON_ORIGIN}}";
        var MASTERY = 70;

        // ---- locate the SCORM 1.2 API (walk parents, then opener) ----
        function findAPI(win) {
          var tries = 0;
          while (win && tries++ < 12) {
            try {
              if (win.API != null) return win.API;
            } catch (e) {
              break;
            }
            try {
              if (!win.parent || win.parent === win) break;
              win = win.parent;
            } catch (e) {
              break;
            }
          }
          return null;
        }
        var API = null;
        try {
          API = findAPI(window);
        } catch (e) {}
        if (!API) {
          try {
            if (window.opener) API = findAPI(window.opener);
          } catch (e) {}
        }
        var started = false;
        var finished = false;

        function start() {
          if (API && !started) {
            try {
              API.LMSInitialize("");
              started = true;
              API.LMSSetValue("cmi.core.lesson_status", "incomplete");
              API.LMSCommit("");
            } catch (e) {}
          }
        }
        function report(pct) {
          if (!API || finished) return;
          start();
          if (!started) return;
          var status = pct >= MASTERY ? "passed" : "completed";
          try {
            API.LMSSetValue("cmi.core.score.min", "0");
            API.LMSSetValue("cmi.core.score.max", "100");
            API.LMSSetValue(
              "cmi.core.score.raw",
              String(Math.max(0, Math.min(100, Math.round(pct)))),
            );
            API.LMSSetValue("cmi.core.lesson_status", status);
            API.LMSCommit("");
          } catch (e) {}
        }
        function finish() {
          if (API && started && !finished) {
            try {
              API.LMSFinish("");
              finished = true;
            } catch (e) {}
          }
        }

        start();
        window.addEventListener("message", function (e) {
          if (LESSON_ORIGIN && e.origin !== LESSON_ORIGIN) return;
          var d = e.data || {};
          if (
            d.source === "neft-lesson" &&
            d.type === "score" &&
            typeof d.percent === "number"
          ) {
            report(d.percent);
          }
        });
        window.addEventListener("pagehide", finish);
        window.addEventListener("unload", finish);
      })();
    </script>
  </body>
</html>
