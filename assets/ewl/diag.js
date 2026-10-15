/* EWL ?diag=1 — runs every registered self-test on the live page and shows the result.
 * Load this LAST on any EWL page. It does nothing unless the URL has ?diag=1, so it is safe to ship everywhere.
 * Each module adds {name, run} to EWL.selfTests; run() returns true (or nothing) when it passes, or a string explaining the failure.
 * This file registers the core checks (exact rationals, state store, reasoning engine) and adds the panel.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];
  var R = EWL.Rat;

  function core() {
    if (!R) return;
    EWL.selfTests.push(
      {
        name: "rational: 3/5 = 6/10 = 60/100 = 0.6 = 60%",
        run: function () {
          var t = R.of(3, 5);
          return ["6/10", "60/100", "0.6", "60%"].every(function (s) {
            return t.eq(R.parse(s));
          });
        },
      },
      {
        name: "rational: 0.1 + 0.2 = 0.3 exactly",
        run: function () {
          return R.parse("0.1").add(R.parse("0.2")).eq(R.parse("0.3"));
        },
      },
      {
        name: "rational: 1/3 repeats and round-trips",
        run: function () {
          return R.of(1, 3).decimal().text === "0.(3)" && R.parse("0.(3)").eq(R.of(1, 3));
        },
      },
      {
        name: "reasoning: 20% then 10% off is 28% off, and 30% is matched to its misconception",
        run: function () {
          var t = EWL.Reason.Task.percentStack("20%", "10%");
          var d = EWL.Reason.diagnose(t, { value: "30%" });
          return t.answer.percent() === "28%" && d.rule && d.rule.id === "percent-stack";
        },
      },
      {
        name: "reasoning: help never reveals before the last rung",
        run: function () {
          var t = EWL.Reason.Task.percentStack("20%", "10%");
          for (var i = 0; i < 3; i++)
            if (EWL.Reason.ladder(t, { value: "30%" }, i).reveal) return "revealed at rung " + i;
          return true;
        },
      },
    );
    if (EWL.state && EWL.state.selfTest) {
      EWL.selfTests.push({
        name: "state store: passport, URL hydration, validation",
        run: function () {
          var r = EWL.state.selfTest();
          var bad = r.results.filter(function (x) {
            return !x.ok;
          })[0];
          return bad ? bad.name + ": " + bad.detail : true;
        },
      });
    }
    EWL.selfTests.push({
      name: "ids: activity ids validate",
      run: function () {
        return (
          EWL.id &&
          EWL.ID_RE.test(EWL.id("lab", "discount-claim")) &&
          !EWL.ID_RE.test("ewl.lab.Bad Id")
        );
      },
    });
  }

  /** A test may return true/undefined (pass), a string (failure reason), or {ok, note?} (the shape some modes use). */
  function verdict(r) {
    if (r && typeof r === "object")
      return {
        ok: r.ok === true,
        detail: r.ok === true ? "" : String(r.note || r.detail || "failed"),
      };
    return {
      ok: r === true || r === undefined,
      detail: r === true || r === undefined ? "" : String(r),
    };
  }
  function run() {
    return EWL.selfTests.map(function (t) {
      try {
        var v = verdict(t.run());
        return { name: t.name, ok: v.ok, detail: v.detail };
      } catch (e) {
        return { name: t.name, ok: false, detail: e.message };
      }
    });
  }

  EWL.runSelfTests = run;
  core();

  if (typeof document === "undefined" || !EWL.flags || !EWL.flags().diag) return;
  function panel() {
    var results = run();
    var failed = results.filter(function (r) {
      return !r.ok;
    }).length;
    var h = EWL.h;
    var box = h(
      "section",
      {
        class: "ewl-diag",
        "aria-labelledby": "ewl-diag-t",
        style:
          "margin:16px;padding:12px 16px;border:2px solid #15487f;border-radius:12px;background:#fff;color:#17233a;font:15px/1.5 system-ui,sans-serif",
      },
      h(
        "h2",
        { id: "ewl-diag-t", style: "margin:0 0 8px;font-size:18px" },
        "EWL self-test: " +
          (failed ? failed + " failed of " + results.length : "all " + results.length + " passed"),
      ),
      h(
        "ul",
        { style: "margin:0;padding-left:20px" },
        results.map(function (r) {
          return h("li", {}, (r.ok ? "✓ " : "✗ ") + r.name + (r.detail ? " — " + r.detail : ""));
        }),
      ),
    );
    box.setAttribute("data-ewl-diag", failed ? "fail" : "pass");
    document.body.appendChild(box);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", panel);
  else setTimeout(panel, 0);
})(typeof window !== "undefined" ? window : globalThis);
