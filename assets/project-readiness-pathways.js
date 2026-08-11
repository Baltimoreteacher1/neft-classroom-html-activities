/**
 * Project Readiness Pathways — 1-click prerequisite diagnostic check
 * and learning continuity router for Grade 6 Culminating Projects.
 */
(function () {
  "use strict";

  if (window.EWLProjectReadiness) return;

  const PROJECT_PREREQUISITES = {
    "world-architect": {
      title: "World Architect (Unit 1 & 5)",
      prereqs: ["Area of Composite Shapes (5-2)", "Ratio Scaling (3-3)"],
      diagnostic: [
        {
          q: "What is the area of a rectangle with length 8 ft and width 5.5 ft?",
          opts: [
            { t: "13.5 sq ft", v: "wrong" },
            { t: "44 sq ft", v: "correct" },
            { t: "27 sq ft", v: "wrong" },
          ],
          hint: "Area = length × width (8 × 5.5 = 44).",
        },
        {
          q: "If a map scale is 1 in = 4 ft, how many feet does 3.5 in represent?",
          opts: [
            { t: "14 ft", v: "correct" },
            { t: "7.5 ft", v: "wrong" },
            { t: "12 ft", v: "wrong" },
          ],
          hint: "Multiply 3.5 by 4 = 14 ft.",
        },
      ],
      lessonRoute: "/lessons/5-2/",
      catchupRoute: "/lessons/5-2-catchup/",
      presetRoute: "/netfold-pro/?preset=cube-unfold",
    },
    "cartesian-odyssey": {
      title: "Cartesian Odyssey (Unit 7)",
      prereqs: ["Plotting 4 Quadrants (7-4)", "Distance on Grid (7-5)"],
      diagnostic: [
        {
          q: "Which quadrant contains the point (-4, 5)?",
          opts: [
            { t: "Quadrant I (+, +)", v: "wrong" },
            { t: "Quadrant II (-, +)", v: "correct" },
            { t: "Quadrant III (-, -)", v: "wrong" },
          ],
          hint: "Left 4 (-), Up 5 (+) puts you in Quadrant II.",
        },
        {
          q: "What is the distance between (-3, 4) and (-3, -2)?",
          opts: [
            { t: "6 units", v: "correct" },
            { t: "2 units", v: "wrong" },
            { t: "8 units", v: "wrong" },
          ],
          hint: "|4| + |-2| = 4 + 2 = 6 units.",
        },
      ],
      lessonRoute: "/lessons/7-4/",
      catchupRoute: "/lessons/7-4-group1/",
      presetRoute: "/neft-math-lab-studio/?tool=coordinate-grid",
    },
    "ratio-lab": {
      title: "Ratio & Rate Lab (Unit 3)",
      prereqs: ["Equivalent Ratios (3-2)", "Unit Rate Division (3-4)"],
      diagnostic: [
        {
          q: "Are the ratios 3:5 and 9:15 equivalent?",
          opts: [
            { t: "Yes (both scale by 3)", v: "correct" },
            { t: "No", v: "wrong" },
          ],
          hint: "3 × 3 = 9 and 5 × 3 = 15, so yes!",
        },
        {
          q: "If 4 tickets cost $28, what is the unit price per ticket?",
          opts: [
            { t: "$7 per ticket", v: "correct" },
            { t: "$6 per ticket", v: "wrong" },
            { t: "$8 per ticket", v: "wrong" },
          ],
          hint: "$28 ÷ 4 = $7 per ticket.",
        },
      ],
      lessonRoute: "/lessons/3-4/",
      catchupRoute: "/lessons/3-4-group1/",
      presetRoute: "/neft-math-lab-studio/?tool=ratio-mixer",
    },
    "netfold-3d": {
      title: "NetFold 3D Surface Area & Volume (Unit 5)",
      prereqs: ["Nets of Prisms (5-4)", "Volume of Rectangular Prisms (5-6)"],
      diagnostic: [
        {
          q: "How many rectangular faces does a rectangular prism have?",
          opts: [
            { t: "6 faces", v: "correct" },
            { t: "4 faces", v: "wrong" },
            { t: "8 faces", v: "wrong" },
          ],
          hint: "A prism has 2 bases and 4 lateral faces = 6 total faces.",
        },
        {
          q: "What is the volume of a box with length 4 cm, width 3 cm, and height 2.5 cm?",
          opts: [
            { t: "30 cm³", v: "correct" },
            { t: "24 cm³", v: "wrong" },
            { t: "9.5 cm³", v: "wrong" },
          ],
          hint: "Volume = l × w × h = 4 × 3 × 2.5 = 30 cm³.",
        },
      ],
      lessonRoute: "/lessons/5-4/",
      catchupRoute: "/lessons/5-4-catchup/",
      presetRoute: "/netfold-pro/?preset=cube-unfold",
    },
    "sports-analytics": {
      title: "Sports Analytics & Data Quest (Unit 2)",
      prereqs: ["Mean & Median (2-3)", "IQR & Box Plots (2-4)"],
      diagnostic: [
        {
          q: "What is the median of the scores: 4, 7, 8, 10, 12?",
          opts: [
            { t: "8 (the middle value)", v: "correct" },
            { t: "8.2", v: "wrong" },
            { t: "7", v: "wrong" },
          ],
          hint: "In an ordered set of 5 numbers, the 3rd number (8) is the median.",
        },
        {
          q: "How do you calculate the range of a dataset?",
          opts: [
            { t: "Maximum - Minimum", v: "correct" },
            { t: "Add all numbers", v: "wrong" },
            { t: "Divide by count", v: "wrong" },
          ],
          hint: "Range = Max value - Min value.",
        },
      ],
      lessonRoute: "/lessons/2-3/",
      catchupRoute: "/lessons/2-3-group1/",
      presetRoute: "/neft-math-lab-studio/?tool=box-plot",
    },
  };

  function openReadinessModal(projectId) {
    var config = PROJECT_PREREQUISITES[projectId] || PROJECT_PREREQUISITES["world-architect"];
    var modalId = "ewl-readiness-modal";
    var existing = document.getElementById(modalId);
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "ewl-readiness-overlay";

    var html =
      '<div class="ewl-readiness-box" role="dialog" aria-modal="true" aria-labelledby="ewl-rd-title">' +
      '<button type="button" class="ewl-rd-close" onclick="document.getElementById(\'' +
      modalId +
      "').remove()\">✕</button>" +
      '<div class="ewl-rd-header">' +
      '<span class="ewl-rd-badge">🚀 Project Readiness Check</span>' +
      '<h2 id="ewl-rd-title">' +
      config.title +
      "</h2>" +
      '<p class="ewl-rd-sub">Prerequisites: <strong>' +
      config.prereqs.join(" · ") +
      "</strong></p>" +
      "</div>" +
      '<div class="ewl-rd-body">';

    config.diagnostic.forEach(function (d, i) {
      html +=
        '<div class="ewl-rd-qbox">' +
        '<p class="ewl-rd-qstem"><strong>Item ' +
        (i + 1) +
        ":</strong> " +
        d.q +
        "</p>" +
        '<div class="ewl-rd-opts">';
      d.opts.forEach(function (o) {
        html +=
          '<button type="button" class="ewl-rd-opt" onclick="EWLProjectReadiness.answerQ(this, \'' +
          o.v +
          "', '" +
          d.hint.replace(/'/g, "\\'") +
          "')\">" +
          o.t +
          "</button>";
      });
      html += "</div>" + '<p class="ewl-rd-hint" style="display:none;"></p>' + "</div>";
    });

    html +=
      "</div>" +
      '<div class="ewl-rd-footer">' +
      '<a href="' +
      config.lessonRoute +
      '" class="ewl-rd-action-btn secondary">📘 Review Core Lesson</a>' +
      '<a href="' +
      config.catchupRoute +
      '" class="ewl-rd-action-btn secondary">👥 Guided Small-Group</a>' +
      '<a href="' +
      config.presetRoute +
      '" class="ewl-rd-action-btn primary" target="_blank" rel="noopener">🚀 Launch Project & Model ↗</a>' +
      "</div>" +
      "</div>";

    modal.innerHTML = html;
    document.body.appendChild(modal);
  }

  function answerQ(btnEl, resultVal, hintText) {
    var opts = btnEl.parentNode.querySelectorAll(".ewl-rd-opt");
    opts.forEach(function (b) {
      b.disabled = true;
      b.classList.remove("selected", "correct", "wrong");
    });
    btnEl.classList.add("selected");

    var hintEl = btnEl.parentNode.parentNode.querySelector(".ewl-rd-hint");
    if (resultVal === "correct") {
      btnEl.classList.add("correct");
      hintEl.style.display = "block";
      hintEl.style.color = "#15803d";
      hintEl.innerHTML = "✅ <strong>Correct!</strong> " + hintText;
    } else {
      btnEl.classList.add("wrong");
      hintEl.style.display = "block";
      hintEl.style.color = "#b91c1c";
      hintEl.innerHTML = "💡 <strong>Coaching Hint:</strong> " + hintText;
    }
  }

  window.EWLProjectReadiness = {
    PROJECT_PREREQUISITES: PROJECT_PREREQUISITES,
    openReadinessModal: openReadinessModal,
    answerQ: answerQ,
  };
})();
