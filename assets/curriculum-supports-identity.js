/*
 * curriculum-supports-identity.js — the Learning Supports CARD on /curriculum.
 *
 * The problem this solves
 * ----------------------
 * Learning Supports v2 resolves a student's accommodations from the D1 roster
 * and applies them on every lesson page. Two things kept it from being used:
 *
 *   1. The "who are you?" claim was a small dashed CHIP tucked into the hub
 *      header — easy to miss, and it said nothing about what claiming does.
 *   2. Roster setup lived only at /teacher-tools/learning-supports-manager/,
 *      which is four clicks away and invisible from the hub. With an empty
 *      roster the whole layer rendered NOTHING, so there was no path from
 *      "this exists" to "this is set up".
 *
 * So this module renders one clear card at the front of the hub, directly under
 * the page header, and the card changes shape by who is looking:
 *
 *   SET UP    teacher mode + empty roster -> "Set up your students" + one button
 *             to the manager. This is the only state a student never sees.
 *   CLAIM     roster exists, nobody claimed -> "Who's working today?" + a big
 *             button that opens the class/name picker.
 *   READY     claimed -> the student's tools named in plain language, the
 *             lessons picked for them, and a way to say "not me".
 *
 * Claiming here also:
 *   - caches the resolved accommodations under the SAME key the lesson engine
 *     reads, so the lesson opens already adapted — no flash, no second modal;
 *   - applies the passive accommodations to the hub itself;
 *   - stamps "?me=<section>.<initials>" onto every lesson link so the identity
 *     survives the click, even onto a device that never saw this student.
 *
 * Deliberately NOT "?supports=": that transport freezes a COARSE bundle and
 * overrides the roster. "?me=" carries only WHO the student is, so the roster
 * still resolves their real, fine-grained, current accommodations.
 *
 * Hard rules: additive, reversible, never throws into the hub, no new PII
 * (section + initials are what the lesson modal already collected), no IEP /
 * language-level framing in any student-facing string, and an empty roster
 * shows a student NOTHING rather than nagging them.
 */
(function () {
  "use strict";
  if (window.__ntHubIdentityBooted) return;
  window.__ntHubIdentityBooted = true;

  var API = "/api/supports";
  var MANAGER_URL = "/teacher-tools/learning-supports-manager/";
  var TEACHER_MODE_KEY = "nt-teacher-mode"; // shared with curriculum-enhancements.js
  var LESSON_HREF_RE = /\/lessons\/(\d+-\d+(?:-group[12]|-catchup)?)\/?(?:[?#]|$)/;

  // Passive accommodations that make sense on a browse page. Interactive tools
  // (calculator, number line, ...) belong to the lesson dock, not the hub.
  var PASSIVE = {
    "text-large": "ewl-supports-text-lg",
    contrast: "ewl-supports-contrast-active",
    comfort: "ewl-supports-comfort-active",
  };

  /*
   * Student-facing names for what turns on.
   *
   * The schema's own labels are the district IEP/ESOL document lines verbatim
   * ("Text to Speech for the ELA/Literacy Assessments (items, response options,
   * and passages)"). Those are correct for the teacher's roster editor and
   * wrong for a card a twelve-year-old reads, so this card never prints them.
   *
   * Resolution order for a resolved key:
   *   1. KEY_LABEL   — legacy passive keys and adaptive behaviours, named directly
   *   2. TOOL_LABEL  — via the schema's `tool` field, so every interactive item
   *                    collapses onto the dock control it actually turns on
   *                    (six different roster lines all mean "Read aloud")
   *   3. skipped     — teacher planning flags have no student-side effect and
   *                    must not be advertised as tools
   */
  var TOOL_LABEL = {
    listen: "Read aloud",
    words: "Word help",
    explain: "Sentence starters",
    calculator: "Calculator",
    translate: "Translate",
    model: "See a model",
    organizer: "Graphic organizer",
    notepad: "Notepad",
    checklist: "Checklist",
    checkin: "Check-in",
    directions: "Directions help",
    highlighter: "Highlighter",
    break: "Take a break",
  };

  var KEY_LABEL = {
    // legacy v1 presentation keys (in the API allow-list, not in the schema)
    "text-large": "Bigger text",
    contrast: "High contrast",
    tint: "Colour tint",
    ruler: "Reading ruler",
    focus: "Focus line",
    comfort: "Calm mode",
    numberline: "Number line",
    multchart: "Multiplication chart",
    placevalue: "Place value chart",
    example: "Worked example",
    misconceptions: "Common mistakes",
    // adaptive behaviours — real changes to the lesson, so they are named
    time: "Extra time",
    "iep-extra-time": "Extra time",
    "esol-extended-time": "Extra time",
    fewer: "Shorter set",
    "esol-selected-portion": "Shorter set",
    "iep-chunk-text": "One step at a time",
    "iep-chunk-repeat-verbal": "One step at a time",
    "iep-positive-praise": "Extra encouragement",
    "iep-immediate-feedback": "Instant feedback",
  };

  var state = { roster: null, items: [], lessons: [], teacher: false };

  function ident() {
    return window.NTIdentity || null;
  }

  function schema() {
    return window.EWLSupportsSchema || null;
  }

  /*
   * Teacher Mode, in the same terms curriculum-enhancements.js uses.
   * `body.teacher-mode` is the live truth once that script has run; before it
   * has (script order is not guaranteed) fall back to the shared storage key,
   * honouring the same `?student=1` force-student override so a teacher-shared
   * student link never exposes the teacher strip.
   */
  function isTeacher() {
    try {
      if (document.body.classList.contains("teacher-mode")) return true;
      if (new URLSearchParams(window.location.search).get("student") === "1") return false;
      var saved = localStorage.getItem(TEACHER_MODE_KEY);
      return saved === "1" || saved === "true";
    } catch (_e) {
      return false;
    }
  }

  async function getJSON(path) {
    try {
      var res = await fetch(API + path, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      return await res.json();
    } catch (_e) {
      return null;
    }
  }

  function rosterCounts() {
    var sections = (state.roster && state.roster.sections) || {};
    var classes = 0;
    var students = 0;
    for (var s in sections) {
      if (!Object.prototype.hasOwnProperty.call(sections, s)) continue;
      var list = sections[s] || [];
      if (!list.length) continue;
      classes++;
      students += list.length;
    }
    return { classes: classes, students: students };
  }

  function hasRoster() {
    return rosterCounts().students > 0;
  }

  /*
   * Resolved keys -> de-duped, student-safe tool names. Order is preserved so
   * the card reads the same way twice in a row.
   */
  function toolNames(items) {
    var S = schema();
    var out = [];
    var seen = {};
    for (var i = 0; i < items.length; i++) {
      var key = items[i];
      var name = KEY_LABEL[key];
      if (!name && S && S.byKey && S.byKey[key]) {
        var item = S.byKey[key];
        if (item.apply === "flag") continue; // teacher planning note, not a tool
        name = TOOL_LABEL[item.tool];
      }
      if (!name || seen[name]) continue;
      seen[name] = true;
      out.push(name);
    }
    return out;
  }

  // ---- applying what we resolved ------------------------------------------

  function applyPassive(items) {
    var set = {};
    for (var i = 0; i < items.length; i++) set[items[i]] = true;
    for (var key in PASSIVE) {
      if (!Object.prototype.hasOwnProperty.call(PASSIVE, key)) continue;
      document.body.classList.toggle(PASSIVE[key], !!set[key]);
    }
  }

  /*
   * Stamp "?me=" onto lesson links so the identity survives the click.
   * Skips any link that already carries "?supports=" (an explicit personalized
   * launch outranks the roster and must not be second-guessed) and any link
   * that already has "me=".
   */
  function stampLinks(root) {
    var me = ident() && ident().get();
    if (!me || !me.initials) return;
    var token = me.section + "." + me.initials;
    var anchors = (root || document).querySelectorAll('a[href*="/lessons/"]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var href = a.getAttribute("href") || "";
      if (!LESSON_HREF_RE.test(href)) continue;
      if (href.indexOf("supports=") >= 0) continue;
      try {
        var u = new URL(href, window.location.href);
        if (u.searchParams.get("me") === token) continue;
        u.searchParams.set("me", token);
        a.setAttribute("href", u.pathname + u.search + u.hash);
      } catch (_e) {
        /* leave malformed hrefs alone */
      }
    }
  }

  function badgeAssignedLessons() {
    if (!state.lessons.length) return;
    var assigned = {};
    for (var i = 0; i < state.lessons.length; i++) assigned[state.lessons[i]] = true;
    var anchors = document.querySelectorAll('a[href*="/lessons/"]');
    for (var j = 0; j < anchors.length; j++) {
      var a = anchors[j];
      if (a.closest("#nt-supports-card")) continue; // the card labels its own links
      var m = LESSON_HREF_RE.exec(a.getAttribute("href") || "");
      if (!m || !assigned[m[1]]) continue;
      if (a.querySelector(".nt-ident-assigned")) continue;
      var badge = document.createElement("span");
      badge.className = "nt-ident-assigned";
      badge.textContent = "★ for you";
      a.appendChild(badge);
    }
  }

  /*
   * Title for an assigned lesson, taken from the hub's own data so the card
   * needs no extra fetch and always agrees with the library below it.
   *
   * The hub's lesson ANCHORS are labelled by resource ("Interactive Lesson",
   * "📄 Student Handout"), which would render a "Picked for you" list that says
   * the same meaningless thing twice — so window.CurriculumHub.unitsData is the
   * primary source and the anchor text only a fallback. The trailing standard
   * code ("6.NOS.4") is dropped: it means nothing to a student.
   */
  function lessonTitle(id) {
    var units = (window.CurriculumHub && window.CurriculumHub.unitsData) || [];
    for (var u = 0; u < units.length; u++) {
      var lessons = (units[u] && units[u].lessons) || [];
      for (var l = 0; l < lessons.length; l++) {
        if (lessons[l].lessonId !== id || !lessons[l].title) continue;
        return String(lessons[l].title)
          .replace(/\s*\b\d+\.[A-Z]+\.\d+[a-z]?\s*$/, "")
          .trim();
      }
    }
    var anchors = document.querySelectorAll('a[href*="/lessons/' + id + '"]');
    for (var i = 0; i < anchors.length; i++) {
      var m = LESSON_HREF_RE.exec(anchors[i].getAttribute("href") || "");
      if (!m || m[1] !== id) continue;
      var text = (anchors[i].textContent || "").replace(/★ for you/g, "").trim();
      if (text && text.length < 90) return text;
    }
    return "Lesson " + id;
  }

  function refreshPage() {
    applyPassive(state.items);
    stampLinks(document);
    badgeAssignedLessons();
    renderCard();
  }

  // ---- resolving the roster assignment -------------------------------------

  async function resolveFor(section, initials) {
    var id = ident();
    // Warm start from cache so the hub adapts instantly, then refresh.
    var cached = id && id.getAssigned();
    if (cached && Array.isArray(cached.items)) {
      state.items = cached.items;
      state.lessons = Array.isArray(cached.lessons) ? cached.lessons : [];
      refreshPage();
    }
    var fresh = await getJSON(
      "/for?section=" + encodeURIComponent(section) + "&initials=" + encodeURIComponent(initials),
    );
    // items:null means "backend can't answer" — keep whatever we already had
    // rather than blanking a student's supports on a flaky network.
    if (!fresh || !fresh.ok || !Array.isArray(fresh.items)) return;
    state.items = fresh.items;
    state.lessons = Array.isArray(fresh.lessons) ? fresh.lessons : [];
    if (id) id.setAssigned({ items: state.items, lessons: state.lessons });
    refreshPage();
  }

  // ---- DOM helpers ----------------------------------------------------------

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function button(cls, text, onClick) {
    var b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function link(cls, text, href) {
    var a = el("a", cls, text);
    a.href = href;
    return a;
  }

  /*
   * Mount point, in order of preference:
   *   1. inside the hub header, directly above the Teach / Plan / Explore row —
   *      the first thing under the title, above the fold on a Chromebook. The
   *      header is tall (actions + learning model + links), so mounting AFTER
   *      it pushed the card ~800px down, which is how the old chip got missed.
   *   2. after the header, then 3. top of <main> — for any page whose header
   *      does not carry that row.
   * header.hub is deliberately not used: it lives inside #hub-side, which the
   * lessons-first hub keeps hidden on landing, so anything mounted there
   * renders but is never seen.
   */
  function mount() {
    var existing = document.getElementById("nt-supports-card");
    if (existing) return existing;
    var card = el("section", "nt-sup-card");
    card.id = "nt-supports-card";
    card.setAttribute("aria-labelledby", "nt-sup-card-title");

    var header = document.getElementById("curriculum-start");
    var actions = header && header.querySelector(".curriculum-guide__actions");
    if (actions) {
      header.insertBefore(card, actions);
    } else if (header && header.parentNode) {
      header.parentNode.insertBefore(card, header.nextSibling);
    } else {
      var host = document.querySelector("main") || document.body;
      host.insertBefore(card, host.firstChild);
    }
    return card;
  }

  function unmount() {
    var card = document.getElementById("nt-supports-card");
    if (card && card.parentNode) card.parentNode.removeChild(card);
  }

  // ---- the card -------------------------------------------------------------

  function renderCard() {
    var me = ident() && ident().get();
    var claimed = !!(me && me.initials);
    var ready = hasRoster();

    // Nothing set up and nobody to set it up: render nothing. Never nag.
    if (!ready && !state.teacher) {
      unmount();
      return;
    }

    var card = mount();
    card.textContent = "";
    card.className = "nt-sup-card " + (!ready ? "is-setup" : claimed ? "is-ready" : "is-claim");

    var body = el("div", "nt-sup-card__body");
    card.appendChild(body);

    if (!ready) {
      renderSetup(body);
    } else if (!claimed) {
      renderClaim(body);
    } else {
      renderReady(body, me);
    }

    // The setup card IS the teacher strip's content — no point printing
    // "Manage students" twice under a button that already says it.
    if (state.teacher && ready) card.appendChild(teacherStrip(claimed));
  }

  function head(body, icon, title, sub) {
    var top = el("div", "nt-sup-card__head");
    top.appendChild(el("span", "nt-sup-card__icon", icon));
    var text = el("div", "nt-sup-card__text");
    var h = el("h2", "nt-sup-card__title", title);
    h.id = "nt-sup-card-title";
    text.appendChild(h);
    text.appendChild(el("p", "nt-sup-card__sub", sub));
    top.appendChild(text);
    body.appendChild(top);
    return text;
  }

  /* Teacher, empty roster — the state that used to render nothing at all. */
  function renderSetup(body) {
    head(
      body,
      "🧰",
      "Learning Supports — not set up yet",
      "Add your students once. After that a student picks their name on this page and their tools follow them into every lesson, on any device.",
    );
    var actions = el("div", "nt-sup-card__actions");
    actions.appendChild(link("nt-sup-btn", "Set up my students →", MANAGER_URL));
    body.appendChild(actions);
  }

  /* Student, roster exists, nobody claimed. */
  function renderClaim(body) {
    head(
      body,
      "🎒",
      "Who's working today?",
      "Pick your class and your name. Your tools — reading help, word help, calculator — turn on by themselves in every lesson.",
    );
    var actions = el("div", "nt-sup-card__actions");
    actions.appendChild(button("nt-sup-btn", "Choose my name", openPicker));
    actions.appendChild(
      button("nt-sup-btn nt-sup-btn--ghost", "Not now", function () {
        if (ident()) ident().skip();
        unmount();
      }),
    );
    body.appendChild(actions);
  }

  /* Claimed — say what is on, and what was picked for them. */
  function renderReady(body, me) {
    var names = toolNames(state.items);
    head(
      body,
      "✅",
      "You're all set, " + me.initials,
      names.length
        ? "Your tools are on in every lesson. Look for the Tools button on the side of the page."
        : "Everything is ready. Open any lesson below.",
    );

    if (names.length) {
      var tools = el("ul", "nt-sup-tools");
      tools.setAttribute("aria-label", "Tools that are turned on for you");
      names.forEach(function (n) {
        tools.appendChild(el("li", "nt-sup-tool", n));
      });
      body.appendChild(tools);
    }

    if (state.lessons.length) {
      var picked = el("div", "nt-sup-picked");
      picked.appendChild(el("h3", "nt-sup-picked__title", "★ Picked for you"));
      var list = el("ul", "nt-sup-picked__list");
      state.lessons.forEach(function (id) {
        var li = el("li");
        li.appendChild(link("nt-sup-picked__link", lessonTitle(id), "/lessons/" + id + "/"));
        list.appendChild(li);
      });
      picked.appendChild(list);
      body.appendChild(picked);
    }

    var actions = el("div", "nt-sup-card__actions");
    actions.appendChild(button("nt-sup-btn nt-sup-btn--ghost", "Not me — switch", openPicker));
    body.appendChild(actions);
  }

  /* Teacher-only strip. Never rendered outside teacher mode. */
  function teacherStrip(claimed) {
    var strip = el("div", "nt-sup-card__teacher");
    var counts = rosterCounts();
    strip.appendChild(
      el(
        "span",
        "nt-sup-card__teacherstat",
        counts.students +
          " student" +
          (counts.students === 1 ? "" : "s") +
          " · " +
          counts.classes +
          " class" +
          (counts.classes === 1 ? "" : "es"),
      ),
    );
    strip.appendChild(link("nt-sup-card__teacherlink", "Manage students", MANAGER_URL));
    if (!claimed) {
      strip.appendChild(button("nt-sup-card__teacherlink", "Preview as a student", openPicker));
    }
    if (claimed) {
      strip.appendChild(
        button("nt-sup-card__teacherlink", "Stop previewing", function () {
          if (ident()) ident().clear();
          state.items = [];
          state.lessons = [];
          refreshPage();
        }),
      );
    }
    return strip;
  }

  // ---- picker ---------------------------------------------------------------

  function closePicker() {
    var back = document.getElementById("nt-ident-backdrop");
    if (back && back.parentNode) back.parentNode.removeChild(back);
    document.removeEventListener("keydown", onPickerKey);
  }

  function onPickerKey(e) {
    if (e.key === "Escape") closePicker();
  }

  function openPicker() {
    if (document.getElementById("nt-ident-backdrop")) return;
    var sections = (state.roster && state.roster.sections) || {};

    var back = el("div", "nt-ident-backdrop");
    back.id = "nt-ident-backdrop";
    back.addEventListener("click", function (e) {
      if (e.target === back) closePicker();
    });

    var panel = el("div", "nt-ident-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Choose who is working");

    panel.appendChild(el("h2", "nt-ident-title", "Who's working today?"));
    panel.appendChild(
      el(
        "p",
        "nt-ident-sub",
        "Pick your class and your initials. Your learning tools will follow you into every lesson.",
      ),
    );

    var me = (ident() && ident().get()) || {};
    var chosenSection = me.section || Object.keys(sections)[0] || "";

    var secRow = el("div", "nt-ident-row");
    secRow.appendChild(el("span", "nt-ident-rowlabel", "Class"));
    var secWrap = el("div", "nt-ident-opts");
    secRow.appendChild(secWrap);
    panel.appendChild(secRow);

    var iniRow = el("div", "nt-ident-row");
    iniRow.appendChild(el("span", "nt-ident-rowlabel", "You"));
    var iniWrap = el("div", "nt-ident-opts");
    iniRow.appendChild(iniWrap);
    panel.appendChild(iniRow);

    function drawInitials() {
      iniWrap.textContent = "";
      var list = sections[chosenSection] || [];
      if (!list.length) {
        iniWrap.appendChild(el("span", "nt-ident-empty", "No names in this class yet."));
        return;
      }
      list.forEach(function (ini) {
        var b = el("button", "nt-ident-opt", ini);
        b.type = "button";
        if (ini === me.initials && chosenSection === me.section) b.classList.add("is-on");
        b.addEventListener("click", function () {
          if (ident()) ident().set({ section: chosenSection, initials: ini });
          closePicker();
          renderCard();
          resolveFor(chosenSection, ini);
        });
        iniWrap.appendChild(b);
      });
    }

    Object.keys(sections).forEach(function (sec) {
      var b = el("button", "nt-ident-opt", sec);
      b.type = "button";
      if (sec === chosenSection) b.classList.add("is-on");
      b.addEventListener("click", function () {
        chosenSection = sec;
        Array.prototype.forEach.call(secWrap.children, function (c) {
          c.classList.toggle("is-on", c === b);
        });
        drawInitials();
      });
      secWrap.appendChild(b);
    });
    drawInitials();

    var foot = el("div", "nt-ident-foot");
    foot.appendChild(button("nt-ident-ghost", "Cancel", closePicker));
    if (me.initials) {
      foot.appendChild(
        button("nt-ident-ghost", "This isn't me", function () {
          if (ident()) ident().clear();
          state.items = [];
          state.lessons = [];
          closePicker();
          refreshPage();
        }),
      );
    }
    panel.appendChild(foot);

    back.appendChild(panel);
    document.body.appendChild(back);
    document.addEventListener("keydown", onPickerKey);
    var first = panel.querySelector(".nt-ident-opt");
    if (first) first.focus();
  }

  // ---- boot -----------------------------------------------------------------

  async function boot() {
    var id = ident();
    if (!id) return; // shared-identity.js absent -> stay silent, change nothing

    state.teacher = isTeacher();

    // An identity handed to us in the URL wins for THIS device (that is the
    // whole point of the stamped links / a teacher-shared link).
    var fromUrl = id.fromUrl();
    if (fromUrl) id.set(fromUrl);

    state.roster = await getJSON("/sections");
    renderCard();

    /*
     * Teacher Mode is toggled without a reload (it flips body.teacher-mode), so
     * the card follows it in this tab and across tabs. Wired BEFORE the
     * empty-roster bail-out: a teacher who flips the toggle on a hub with no
     * roster yet is exactly the person who needs the "Set up my students" card
     * to appear.
     */
    new MutationObserver(function () {
      var next = isTeacher();
      if (next === state.teacher) return;
      state.teacher = next;
      renderCard();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("storage", function (e) {
      if (!e || e.key !== TEACHER_MODE_KEY) return;
      state.teacher = isTeacher();
      renderCard();
    });

    // Nothing rostered: no identity to resolve, no links worth stamping.
    if (!hasRoster()) return;

    var me = id.get();
    if (me && me.initials) await resolveFor(me.section, me.initials);

    // The hub renders unit lists lazily, so newly-inserted lesson links need
    // the same stamping/badging treatment. Throttled to one pass per frame.
    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        stampLinks(document);
        badgeAssignedLessons();
      });
    }).observe(document.body, { childList: true, subtree: true });

    id.onChange(function () {
      renderCard();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
