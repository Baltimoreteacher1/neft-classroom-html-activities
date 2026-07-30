// curriculum-next-move.js — the controller, surfaced.
//
// The hub had 232 navigable entries, telemetry flowing into D1, and nothing
// flowing back out. The real question a classroom asks every morning — given
// yesterday, what should these students do for the next fifteen minutes? — was
// answered by a teacher scrolling a dropdown. This card answers it.
//
// It reads /api/progress/next-move, which returns section-level aggregates only:
// no names, no per-student rows. It shows THREE things and refuses to show more —
// the lane to pull, the two named misconceptions to watch for, and a pacing note.
//
// Honesty is the point (docs/specs/epistemic-policy.md). This card always prints
// its own denominator, and when the evidence is thin it says so in the same size
// type as the recommendation. A confident-looking recommendation built on two
// devices is worse than a blank card, because a teacher will act on it.
//
// Additive by contract, exactly like assets/curriculum-live-signal.js: the core
// teacher workflow stays local and private (validate:teacher-workflow), and this
// module renders only if it is loaded.

(function () {
  "use strict";

  // Mirrors the taxonomy in engine/core/small-group-misconceptions.js. Duplicated
  // rather than imported because the hub is a plain script and the engine is an
  // ES module graph; the ids are the contract between them, and the fleet eval
  // reports coverage of the same vocabulary.
  var LABELS = {
    "op-added-instead-of-multiplied": "Added when the problem multiplies",
    "op-multiplied-instead-of-added": "Multiplied when the problem adds",
    "op-reversed-subtraction": "Subtracted in the wrong order",
    "op-reversed-division": "Divided in the wrong order",
    "op-divided-instead-of-multiplied": "Divided when the problem multiplies",
    "op-multiplied-instead-of-divided": "Multiplied when the problem divides",
    "decimal-place-value": "Right digits, wrong magnitude",
    "fraction-added-denominators": "Added the denominators",
    "fraction-straight-across-division": "Divided numerators and denominators straight across",
    "fraction-no-reciprocal": "Divided fractions without inverting",
    "percent-used-as-whole-number": "Used the percent as a plain number",
    "percent-scale-off-by-100": "Percent answer off by a factor of 100",
    "ratio-inverted": "Flipped the ratio",
    "rate-not-per-one": "Gave the total instead of the unit rate",
    "exponent-as-multiplication": "Multiplied the base by the exponent",
    "order-of-operations-left-to-right": "Worked left to right instead of by operation order",
    "sign-dropped": "Right magnitude, lost the negative sign",
    "stat-summed-instead-of-averaged": "Added the data set instead of averaging it",
    "measure-area-perimeter-swap": "Swapped area and perimeter",
  };

  var MOVES = {
    "op-added-instead-of-multiplied":
      "Ask what the operation does to the quantity before they compute.",
    "op-multiplied-instead-of-added":
      "Have them restate the problem as a story, then name the operation.",
    "op-reversed-subtraction": "Anchor both numbers on a number line before subtracting.",
    "op-reversed-division": "Ask “what is being split, and into how many?” before they write it.",
    "op-divided-instead-of-multiplied": "Estimate first — bigger or smaller than you started?",
    "op-multiplied-instead-of-divided": "Estimate first — bigger or smaller than you started?",
    "decimal-place-value":
      "Estimate to the nearest whole first, then count decimal places out loud.",
    "fraction-added-denominators":
      "Return to a bar model — thirds plus fifths cannot become eighths.",
    "fraction-straight-across-division": "Reground division as “how many of these fit into that?”",
    "fraction-no-reciprocal": "Ask them to check with a whole-number case they already trust.",
    "percent-used-as-whole-number": "Make them say the percent as “per hundred” out loud.",
    "percent-scale-off-by-100": "Benchmark against 50% and 10% before trusting the number.",
    "ratio-inverted": "Have them label both quantities with units before writing the ratio.",
    "rate-not-per-one": "Ask “per ONE what?” and make them finish the sentence.",
    "exponent-as-multiplication": "Expand it once — write every factor before evaluating.",
    "order-of-operations-left-to-right": "Have them circle the operation that must go first.",
    "sign-dropped": "Place the answer on a number line — which side of zero?",
    "stat-summed-instead-of-averaged":
      "Ask whether the answer could be a real single value in that set.",
    "measure-area-perimeter-swap": "Ask what the unit should be — units or square units?",
  };

  var LANES = {
    group1: { label: "Level 1 · build together", suffix: "-group1" },
    group2: { label: "Level 2 · press the thinking", suffix: "-group2" },
  };

  var CONFIDENCE = {
    good: "",
    thin: "Thin evidence — a few devices. Sanity-check it against what you saw.",
    "very-thin": "One or two devices reported. Treat this as an anecdote, not a pattern.",
  };

  function render(stage, api) {
    var el = api.el;
    var card = el("section", "ctw-next-move");
    card.appendChild(el("h3", null, "Next move"));
    var body = el("div", "ctw-next-move-body");
    body.appendChild(el("p", "ctw-muted", "Reading class evidence…"));
    card.appendChild(body);
    stage.appendChild(card);

    fetch("/api/progress/next-move?section=" + encodeURIComponent(api.section), {
      credentials: "omit",
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        body.innerHTML = "";
        if (!data || !data.ok) {
          body.appendChild(el("p", "ctw-muted", "Class evidence is unavailable right now."));
          return;
        }
        if (!data.evidence) {
          // No evidence is a real answer, and it must not look like advice.
          body.appendChild(
            el(
              "p",
              "ctw-muted",
              data.note ||
                "No small-group evidence for " +
                  api.section +
                  " yet. Nothing here is a recommendation.",
            ),
          );
          return;
        }

        // The denominator goes FIRST, before any recommendation, so it is read.
        var coverage = el(
          "p",
          "ctw-next-move-coverage",
          data.devicesReporting +
            (data.devicesReporting === 1 ? " device reported" : " devices reported") +
            " in the last " +
            data.windowDays +
            " days · last lesson with evidence: " +
            data.lastLesson,
        );
        body.appendChild(coverage);

        var caveat = CONFIDENCE[data.confidence];
        if (caveat) body.appendChild(el("p", "ctw-next-move-caveat", caveat));

        var lane = LANES[data.recommendedLane];
        if (lane) {
          var laneRow = el("div", "ctw-next-move-lane");
          laneRow.appendChild(el("span", "ctw-next-move-lab", "Pull"));
          laneRow.appendChild(el("b", null, lane.label));
          laneRow.appendChild(
            api.link(
              "Open " + data.lastLesson + lane.suffix,
              "/lessons/" + data.lastLesson + lane.suffix + "/",
              "ctw-student",
            ),
          );
          body.appendChild(laneRow);
        }

        if (data.watchFor && data.watchFor.length) {
          var list = el("ul", "ctw-next-move-watch");
          data.watchFor.forEach(function (entry) {
            var label = LABELS[entry.id] || entry.id;
            var move = MOVES[entry.id] || "";
            var item = el("li", null, "");
            item.appendChild(el("b", null, label + (entry.count > 1 ? " ×" + entry.count : "")));
            if (move) item.appendChild(el("span", null, " — " + move));
            list.appendChild(item);
          });
          var watchWrap = el("div", "ctw-next-move-watchwrap");
          watchWrap.appendChild(el("span", "ctw-next-move-lab", "Watch for"));
          watchWrap.appendChild(list);
          body.appendChild(watchWrap);
        } else {
          body.appendChild(
            el(
              "p",
              "ctw-muted",
              "No misconception has been named often enough to act on. That is a real result, not a gap.",
            ),
          );
        }

        if (data.pacing) body.appendChild(el("p", "ctw-next-move-pacing", data.pacing));

        body.appendChild(
          el(
            "p",
            "ctw-muted",
            "A recommendation, not an assignment — you know things this does not.",
          ),
        );
      })
      .catch(function () {
        body.innerHTML = "";
        body.appendChild(el("p", "ctw-muted", "Class evidence is unavailable right now."));
      });
  }

  window.CurriculumNextMove = { render: render };
})();
