/* Renders the 4 quiz cards (pre/post × student/teacher) from forms-links.js. */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("quiz-grid");
    if (!grid) return;
    const slug = grid.dataset.slug;
    const links = (window.INTERVENTION_FORMS || {})[slug] || {};
    const defs = [
      {
        key: "preStudent",
        title: "Pre-Quiz",
        who: "Student",
        desc: "Take before the station — finds your starting point.",
      },
      {
        key: "postStudent",
        title: "Post-Quiz",
        who: "Student",
        desc: "Take after the station — shows your growth.",
      },
      {
        key: "preTeacher",
        title: "Pre-Quiz",
        who: "Teacher · auto-graded",
        desc: "Quiz-mode form with the answer key and points.",
      },
      {
        key: "postTeacher",
        title: "Post-Quiz",
        who: "Teacher · auto-graded",
        desc: "Quiz-mode form with the answer key and points.",
      },
    ];
    let anyPending = false;
    grid.innerHTML = defs
      .map((d) => {
        const url = links[d.key];
        const cta = url
          ? `<a class="btn btn-primary btn-sm" href="${url}" target="_blank" rel="noopener">Open form →</a>`
          : ((anyPending = true),
            `<span class="quiz-pending">⏳ Pending — add link in forms-links.js</span>`);
        return `<div class="quiz-card">
          <span class="who">${d.who}</span>
          <h4>${d.title}</h4>
          <p>${d.desc}</p>
          ${cta}
        </div>`;
      })
      .join("");
    const note = document.getElementById("quiz-pending");
    if (note && !anyPending) note.style.display = "none";
  });
})();
