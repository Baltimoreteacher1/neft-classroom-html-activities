/**
 * Family Connections Quick Post & Newsletter Generator
 * 1-click simple posting, editing, and family communication export.
 */
(function () {
  "use strict";

  if (window.EWLFamilyQuickPost) return;

  var SAMPLE_WEEK_NOTES = {
    "1-1": "This week we are building our math mindsets, establishing group norms, and exploring how math lives in our daily lives.",
    "2-3": "This week students are exploring statistics, calculating mean and median, and building box plots from sports datasets.",
    "3-4": "This week we are learning about unit rates and unit prices. Ask your student to compare grocery store prices with you!",
    "5-4": "This week we are visualizing 3D shape nets, calculating surface area of rectangular prisms, and designing 3D room boxes.",
    "7-4": "This week students are plotting ordered pairs across all four quadrants on the coordinate plane and finding distance between points.",
    "8-4": "This week we are solving one-step equations using visual balance scales and algebraic inverse operations."
  };

  function toggleDrawer() {
    var drawer = document.getElementById("ewl-quick-post-drawer");
    if (!drawer) {
      drawer = createDrawer();
      document.body.appendChild(drawer);
    }
    drawer.classList.toggle("open");
  }

  function createDrawer() {
    var drawer = document.createElement("div");
    drawer.id = "ewl-quick-post-drawer";
    drawer.className = "ewl-qp-drawer";

    var html = '<div class="ewl-qp-box">' +
      '<div class="ewl-qp-header">' +
        '<div>' +
          '<span class="ewl-qp-tag">⚡ 1-Click Publisher</span>' +
          '<h2>Quick Post Family Update</h2>' +
        '</div>' +
        '<button type="button" class="ewl-qp-close" onclick="EWLFamilyQuickPost.toggleDrawer()">✕</button>' +
      '</div>' +

      '<div class="ewl-qp-body">' +
        '<div class="ewl-qp-step">' +
          '<label class="ewl-qp-label">1. Select Target Lesson / Topic</label>' +
          '<select id="ewl-qp-lesson-select" class="ewl-qp-select" onchange="EWLFamilyQuickPost.onLessonSelect(this.value)">' +
            '<option value="1-1">Lesson 1-1: Math is Mine (Unit 1)</option>' +
            '<option value="2-3">Lesson 2-3: Mean, Median & Box Plots (Unit 2)</option>' +
            '<option value="3-4" selected>Lesson 3-4: Unit Rates & Unit Prices (Unit 3)</option>' +
            '<option value="5-4">Lesson 5-4: 3D Nets & Surface Area (Unit 5)</option>' +
            '<option value="7-4">Lesson 7-4: Quadrants & Coordinate Plane (Unit 7)</option>' +
            '<option value="8-4">Lesson 8-4: One-Step Balance Equations (Unit 8)</option>' +
          '</select>' +
          '<button type="button" class="ewl-qp-autofill-btn" onclick="EWLFamilyQuickPost.autoFill()">🚀 Auto-Fill Today\'s Lesson</button>' +
        '</div>' +

        '<div class="ewl-qp-step">' +
          '<label class="ewl-qp-label">2. Weekly Note for Families</label>' +
          '<textarea id="ewl-qp-note" class="ewl-qp-textarea" rows="3">This week we are learning about unit rates and unit prices. Ask your student to compare grocery store prices with you!</textarea>' +
        '</div>' +

        '<div class="ewl-qp-step">' +
          '<label class="ewl-qp-label">3. 1-Click Copy & Export for Families</label>' +
          '<div class="ewl-qp-export-grid">' +
            '<button type="button" class="ewl-qp-exp-btn" onclick="EWLFamilyQuickPost.copyRemindText()">💬 Copy Remind / ClassDojo Text</button>' +
            '<button type="button" class="ewl-qp-exp-btn" onclick="EWLFamilyQuickPost.copyCanvasHtml()">✉️ Copy Canvas / Email Newsletter</button>' +
            '<button type="button" class="ewl-qp-exp-btn" onclick="window.print()">🖨️ Print Family Handout</button>' +
          '</div>' +
        '</div>' +
        '<div id="ewl-qp-toast" class="ewl-qp-toast" style="display:none;"></div>' +
      '</div>' +

      '<div class="ewl-qp-footer">' +
        '<button type="button" class="ewl-qp-cancel" onclick="EWLFamilyQuickPost.toggleDrawer()">Cancel</button>' +
        '<button type="button" class="ewl-qp-publish" onclick="EWLFamilyQuickPost.publishLive()">🚀 Save & Publish Live</button>' +
      '</div>' +
    '</div>';

    drawer.innerHTML = html;
    return drawer;
  }

  function onLessonSelect(lessonId) {
    var noteInput = document.getElementById("ewl-qp-note");
    if (noteInput && SAMPLE_WEEK_NOTES[lessonId]) {
      noteInput.value = SAMPLE_WEEK_NOTES[lessonId];
    }
  }

  function autoFill() {
    onLessonSelect("3-4");
    showToast("✨ Auto-filled Unit 3 Lesson 3-4 details & family note!");
  }

  function copyRemindText() {
    var note = document.getElementById("ewl-qp-note").value;
    var text = "6th Grade Math Update: " + note + " Check out optional family practice & tools: https://eduwonderlab.com/curriculum/family-connections/";
    navigator.clipboard.writeText(text);
    showToast("📋 Copied Remind / ClassDojo SMS text to clipboard!");
  }

  function copyCanvasHtml() {
    var note = document.getElementById("ewl-qp-note").value;
    var html = '<div style="font-family: sans-serif; padding: 16px; border: 2px solid #0284c7; border-radius: 12px; background: #f0f9ff;">' +
      '<h3 style="color: #0369a1; margin-top: 0;">📘 6th Grade Math Family Update</h3>' +
      '<p style="color: #334155;">' + note + '</p>' +
      '<a href="https://eduwonderlab.com/curriculum/family-connections/" style="display: inline-block; padding: 10px 16px; background: #0284c7; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Family Connections Page →</a>' +
      '</div>';
    navigator.clipboard.writeText(html);
    showToast("✉️ Copied Canvas / Email HTML template to clipboard!");
  }

  function publishLive() {
    var note = document.getElementById("ewl-qp-note").value;
    var noteEl = document.getElementById("published-week-note");
    if (noteEl) noteEl.textContent = note;
    showToast("🎉 Published live to Family Connections page!");
    setTimeout(toggleDrawer, 1200);
  }

  function showToast(msg) {
    var t = document.getElementById("ewl-qp-toast");
    if (!t) return;
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(function () {
      t.style.display = "none";
    }, 3000);
  }

  window.EWLFamilyQuickPost = {
    toggleDrawer: toggleDrawer,
    onLessonSelect: onLessonSelect,
    autoFill: autoFill,
    copyRemindText: copyRemindText,
    copyCanvasHtml: copyCanvasHtml,
    publishLive: publishLive
  };
})();
