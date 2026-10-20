/* Teacher command bar for /curriculum/.
 *
 * In Teacher Mode the hub used to stack four consoles in different accordions:
 * "This week in class", the district pacing console, the planning workspace
 * (.tws) and the Teacher Command Center. This bar hosts them as three tabs
 * (This week / Pacing / Workflow). It MOVES the existing nodes rather than
 * copying them, so every control, handler and data binding keeps working, and
 * it puts them back when Teacher Mode ends so Student Mode is untouched
 * ("This week in class" is shown to students too).
 *
 * Markup: <section id="hub-teacher-bar"> in curriculum/index.html (static, empty).
 * Other scripts call window.CurriculumTeacherBar.reveal(el) before they scroll
 * to a console, so a console in an inactive tab is shown first.
 */
(function () {
  "use strict";

  var STORE = "nt-hub-teacher-bar-tab";
  var TABS = [
    { id: "week", nodes: ["hub-now"] },
    { id: "pacing", nodes: ["district-pacing-console"] },
    { id: "workflow", nodes: ["hub-planning-workspace", "curriculum-teacher-workflow"] },
  ];

  var bar = document.getElementById("hub-teacher-bar");
  if (!bar) return;
  var tabEls = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
  var panelEls = Array.prototype.slice.call(bar.querySelectorAll('[role="tabpanel"]'));
  if (tabEls.length !== TABS.length || panelEls.length !== TABS.length) return;

  var markers = {}; // node id -> comment left where the node came from
  var current = readSaved();

  function readSaved() {
    var saved = "";
    try {
      saved = localStorage.getItem(STORE) || "";
    } catch (_e) {
      saved = "";
    }
    return TABS.some(function (t) {
      return t.id === saved;
    })
      ? saved
      : TABS[0].id;
  }

  function save(id) {
    try {
      localStorage.setItem(STORE, id);
    } catch (_e) {
      /* private mode: the choice just is not remembered */
    }
  }

  function indexOfTab(id) {
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return i;
    return 0;
  }

  function select(id, focus) {
    var active = indexOfTab(id);
    current = TABS[active].id;
    tabEls.forEach(function (tab, i) {
      var on = i === active;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      panelEls[i].hidden = !on;
    });
    save(current);
    if (focus) tabEls[active].focus();
  }

  function adopt() {
    TABS.forEach(function (tab, i) {
      tab.nodes.forEach(function (nodeId) {
        var node = document.getElementById(nodeId);
        if (!node || panelEls[i].contains(node)) return;
        if (!markers[nodeId]) {
          markers[nodeId] = document.createComment("hub-teacher-bar:" + nodeId);
          node.parentNode.insertBefore(markers[nodeId], node);
        }
        panelEls[i].appendChild(node);
      });
    });
  }

  function restore() {
    Object.keys(markers).forEach(function (nodeId) {
      var node = document.getElementById(nodeId);
      var marker = markers[nodeId];
      if (node && marker.parentNode) marker.parentNode.insertBefore(node, marker);
      if (marker.parentNode) marker.parentNode.removeChild(marker);
      delete markers[nodeId];
    });
  }

  function sync() {
    var teacher = document.body.classList.contains("teacher-mode");
    if (teacher) {
      adopt();
      select(current, false);
    } else {
      restore();
    }
    bar.hidden = !teacher;
  }

  function reveal(target) {
    if (!target || !bar.contains(target)) return;
    var panel = target.closest('[role="tabpanel"]');
    var i = panelEls.indexOf(panel);
    if (i >= 0) select(TABS[i].id, false);
  }

  tabEls.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      select(TABS[i].id, false);
    });
    tab.addEventListener("keydown", function (event) {
      var to = -1;
      if (event.key === "ArrowRight") to = (i + 1) % TABS.length;
      else if (event.key === "ArrowLeft") to = (i + TABS.length - 1) % TABS.length;
      else if (event.key === "Home") to = 0;
      else if (event.key === "End") to = TABS.length - 1;
      if (to < 0) return;
      event.preventDefault();
      select(TABS[to].id, true);
    });
  });

  window.CurriculumTeacherBar = { reveal: reveal, select: select };

  // The Teacher Command Center is built after its data loads, so it announces
  // itself; the mode class is watched because Teacher Mode can flip at any time.
  document.addEventListener("ctw:panel-ready", sync);
  new MutationObserver(sync).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  sync();
})();
