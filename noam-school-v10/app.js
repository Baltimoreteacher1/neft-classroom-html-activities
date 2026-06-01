/* Noam School — Focus & Plan
 * Executive-function planner for middle school. Offline-first, installable PWA.
 * Vanilla JS, no dependencies. Data lives in IndexedDB (offline-safe) with a
 * one-time migration from the older localStorage build, plus file + optional
 * cloud backup for syncing between devices.
 */
(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Small DOM + value helpers
  // ---------------------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = (p) =>
    p +
    "_" +
    Math.random().toString(36).slice(2, 9) +
    Date.now().toString(36).slice(-3);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // ---- Dates (local time, normalized to noon to dodge DST/timezone drift) ----
  const startOfToday = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };
  const isoForOffset = (days = 0) => {
    const d = startOfToday();
    d.setDate(d.getDate() + days);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };
  const todayKey = () => isoForOffset(0);
  const parseLocal = (iso) => (iso ? new Date(iso + "T12:00:00") : null);
  const daysUntil = (iso) => {
    if (!iso) return null;
    const d = parseLocal(iso),
      t = startOfToday();
    return Math.round((d - t) / 86400000);
  };
  const dueLabel = (iso, time) => {
    if (!iso) return "No due date";
    const n = daysUntil(iso);
    const t = time ? " · " + time : "";
    if (n < 0)
      return Math.abs(n) + (Math.abs(n) === 1 ? " day late" : " days late");
    if (n === 0) return "Due today" + t;
    if (n === 1) return "Due tomorrow" + t;
    if (n < 7) return "Due in " + n + " days";
    return (
      "Due " +
      parseLocal(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    );
  };
  const niceDate = (iso) =>
    iso
      ? parseLocal(iso).toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      : "";

  // ---------------------------------------------------------------------------
  // Storage: IndexedDB with localStorage migration + fallback
  // ---------------------------------------------------------------------------
  const DB_NAME = "noam-school";
  const STORE = "kv";
  const STATE_KEY = "state";
  // Older localStorage builds, newest first — used once to migrate prior data
  // (the previous /noam-school/ app saved under noam-school-v9, etc.).
  const LEGACY_KEYS = [
    "noam-school-v10",
    "noam-school-v9",
    "noam-school-v8",
    "noam-school-v7",
  ];

  const idb = {
    db: null,
    open() {
      return new Promise((resolve) => {
        if (!("indexedDB" in window)) return resolve(null);
        let req;
        try {
          req = indexedDB.open(DB_NAME, 1);
        } catch {
          return resolve(null);
        }
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve((this.db = req.result));
        req.onerror = () => resolve(null);
      });
    },
    get(key) {
      return new Promise((resolve) => {
        if (!this.db) return resolve(null);
        const r = this.db
          .transaction(STORE, "readonly")
          .objectStore(STORE)
          .get(key);
        r.onsuccess = () => resolve(r.result ?? null);
        r.onerror = () => resolve(null);
      });
    },
    set(key, val) {
      return new Promise((resolve) => {
        if (!this.db) return resolve(false);
        const tx = this.db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    },
  };

  // ---------------------------------------------------------------------------
  // State model
  // ---------------------------------------------------------------------------
  // Accent themes — [id, label, primary hex, deep/navy hex]. Used both to set a
  // --accent CSS var and to tint the hero. Kid-friendly, all AA on white text.
  const ACCENTS = [
    ["teal", "Teal", "#0d9488", "#1e293b"],
    ["blue", "Ocean", "#2563eb", "#172554"],
    ["purple", "Grape", "#7c3aed", "#2e1065"],
    ["green", "Forest", "#15803d", "#14302a"],
    ["rose", "Berry", "#be185d", "#3f0d22"],
    ["orange", "Sunset", "#c2410c", "#3a1505"],
  ];

  const CARDS = [
    ["glance", "Today at a glance"],
    ["calendar", "Calendar"],
    ["todos", "To-do list"],
    ["reminders", "Reminders"],
    ["assignments", "Assignment list"],
    ["routine", "Right routine"],
    ["momentum", "Momentum"],
    ["soon", "Coming up"],
  ];

  const STEP_TEMPLATES = {
    Worksheet: [
      "Get the worksheet out",
      "Read the directions",
      "Do the first 3 problems",
      "Finish the rest",
      "Check my answers",
      "Turn it in",
    ],
    "Reading + response": [
      "Read the pages",
      "Note 2 key ideas",
      "Answer the questions",
      "Re-read my answer",
      "Submit",
    ],
    "Study for a quiz": [
      "Gather my notes",
      "Make a quick study list",
      "Practice the hard parts",
      "Quiz myself",
      "Quick review once more",
    ],
    Project: [
      "Read the rubric",
      "List the parts",
      "Pick what to do first",
      "Do part 1",
      "Do part 2",
      "Put it together",
      "Check the rubric",
      "Submit",
    ],
    "Essay / writing": [
      "Read the prompt",
      "Brainstorm (5 min)",
      "Make an outline",
      "Write the opening",
      "Write the middle",
      "Write the ending",
      "Read it out loud",
      "Fix mistakes",
      "Submit",
    ],
    "Just start": [
      "Get everything I need",
      "Set a 10-minute timer",
      "Do the first small part",
      "Keep going",
      "Check and turn in",
    ],
  };

  const DEFAULT_ROUTINES = () =>
    [
      {
        id: uid("r"),
        name: "Morning Launch",
        emoji: "🌅",
        items: [
          "Check today's plan",
          "Pack my bag",
          "Water + charger",
          "Pick my first task",
        ],
      },
      {
        id: uid("r"),
        name: "After-School Reset",
        emoji: "🎒",
        items: [
          "Empty my bag",
          "Write down all homework",
          "Pick the most important thing",
          "Start with Right Now",
        ],
      },
      {
        id: uid("r"),
        name: "Shutdown",
        emoji: "🌙",
        items: [
          "Turn in anything finished",
          "Check tomorrow's due dates",
          "Pack bag for tomorrow",
          "Phone away to charge",
        ],
      },
    ].map((r) => ({
      ...r,
      items: r.items.map((t) => ({ id: uid("i"), text: t })),
    }));

  function seed() {
    const c = (name, color) => ({
      id: uid("c"),
      name,
      subject: "",
      teacher: "",
      email: "",
      room: "",
      period: "",
      meetTime: "",
      meetDays: [],
      color,
    });
    return {
      version: 11,
      settings: {
        studentName: "Noam",
        gmail: "",
        theme: "light",
        accent: "teal",
        readable: false,
        motion: "on",
        fontScale: 1,
        notifications: false,
        defaultFocusMin: 15,
        breakMin: 5,
        homeOrder: CARDS.map((x) => x[0]),
        hiddenCards: [],
        // Reminder times (24h "HH:MM") for the local notification scheduler.
        morningBriefingTime: "07:15",
        leaveByTime: "",
        sync: { enabled: false, code: "", lastAt: "" },
        // Google Calendar (read-only, client-side OAuth). Only the Web Client ID
        // is persisted — the access token lives in memory and is never stored.
        googleClientId: "",
      },
      classes: [
        c("Math", "#147c78"),
        c("English / ELA", "#c0473a"),
        c("Science", "#2a8f5c"),
        c("Social Studies", "#d99028"),
      ],
      assignments: [],
      // [{ id, text, date, time, done, createdAt, repeat, lastShown, lastDone }]
      // repeat: "none"|"daily"|"weekdays"|"weekly"; recurring "done" = done-for-today.
      reminders: [],
      todos: [], // [{ id, text, done, date, createdAt }] quick daily to-dos
      // Cached Google Calendar events (read-only). { events:[...], fetchedAt }
      gcal: { events: [], fetchedAt: "" },
      // Cached Gmail messages (read-only). { messages:[...], fetchedAt }
      gmail: { messages: [], fetchedAt: "" },
      // Quick morning check-in: { dateKey: { mood, priority } }
      checkins: {},
      routines: DEFAULT_ROUTINES(),
      routineLog: {}, // { dateKey: { routineId: [doneItemIds] } }
      activity: {}, // { dateKey: { tasks, focusMin, routines } }
      wins: [],
      points: 0,
      daily: { goal: "", goalDate: "" },
      // { dateKey: true } — marks days the "did you write everything down?"
      // capture prompt was answered, so it only nudges once per day.
      captureLog: {},
      updatedAt: Date.now(),
    };
  }

  function normalize(x) {
    const base = seed();
    if (!x || typeof x !== "object") return base;
    const s = { ...base.settings, ...(x.settings || {}) };
    s.sync = { ...base.settings.sync, ...(x.settings?.sync || {}) };
    let order = Array.isArray(s.homeOrder)
      ? s.homeOrder
      : base.settings.homeOrder;
    order = [
      ...order.filter((k) => CARDS.some((c) => c[0] === k)),
      ...CARDS.map((c) => c[0]).filter((k) => !order.includes(k)),
    ];
    s.homeOrder = order;
    s.hiddenCards = Array.isArray(s.hiddenCards) ? s.hiddenCards : [];
    s.fontScale = clamp(Number(s.fontScale) || 1, 0.9, 1.5);
    s.defaultFocusMin = clamp(Number(s.defaultFocusMin) || 15, 5, 60);
    s.accent = ACCENTS.some((a) => a[0] === s.accent) ? s.accent : "teal";
    s.morningBriefingTime = TIME_RE.test(s.morningBriefingTime)
      ? s.morningBriefingTime
      : "07:15";
    s.leaveByTime = TIME_RE.test(s.leaveByTime) ? s.leaveByTime : "";
    s.googleClientId = String(s.googleClientId || "").slice(0, 200);
    return {
      ...base,
      ...x,
      settings: s,
      classes:
        Array.isArray(x.classes) && x.classes.length
          ? x.classes.map(normalizeClass)
          : base.classes,
      assignments: Array.isArray(x.assignments)
        ? x.assignments.map(normalizeTask)
        : [],
      reminders: Array.isArray(x.reminders)
        ? x.reminders.map(normalizeReminder)
        : [],
      todos: Array.isArray(x.todos) ? x.todos.map(normalizeTodo) : [],
      routines:
        Array.isArray(x.routines) && x.routines.length
          ? x.routines
          : base.routines,
      routineLog:
        x.routineLog && typeof x.routineLog === "object" ? x.routineLog : {},
      activity: x.activity && typeof x.activity === "object" ? x.activity : {},
      wins: Array.isArray(x.wins) ? x.wins : [],
      points: Number(x.points) || 0,
      daily: { ...base.daily, ...(x.daily || {}) },
      captureLog:
        x.captureLog && typeof x.captureLog === "object" ? x.captureLog : {},
      gcal:
        x.gcal && Array.isArray(x.gcal.events)
          ? { events: x.gcal.events, fetchedAt: x.gcal.fetchedAt || "" }
          : { events: [], fetchedAt: "" },
      gmail:
        x.gmail && Array.isArray(x.gmail.messages)
          ? { messages: x.gmail.messages, fetchedAt: x.gmail.fetchedAt || "" }
          : { messages: [], fetchedAt: "" },
      checkins: x.checkins && typeof x.checkins === "object" ? x.checkins : {},
    };
  }

  // Class colors flow into inline style="..." attributes; restrict them to real
  // hex colors so a malicious imported/synced backup can't inject CSS.
  const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
  const safeColor = (c) => (COLOR_RE.test(String(c || "")) ? c : "#147c78");
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE = /^\d{2}:\d{2}$/;
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function normalizeClass(c) {
    c = c || {};
    return {
      id: c.id || uid("c"),
      name: String(c.name || "Class").slice(0, 60),
      subject: String(c.subject || "").slice(0, 60),
      teacher: String(c.teacher || "").slice(0, 80),
      email: String(c.email || "").slice(0, 120),
      room: String(c.room || "").slice(0, 40),
      period: String(c.period || "").slice(0, 30),
      meetTime: String(c.meetTime || "").slice(0, 40),
      meetDays: Array.isArray(c.meetDays)
        ? c.meetDays.filter((d) => DAYS.includes(d))
        : [],
      color: safeColor(c.color),
    };
  }

  const REPEATS = ["none", "daily", "weekdays", "weekly"];
  function normalizeReminder(r) {
    r = r || {};
    return {
      id: r.id || uid("rm"),
      text: String(r.text || "").slice(0, 200),
      date: DATE_RE.test(r.date) ? r.date : "",
      time: TIME_RE.test(r.time) ? r.time : "",
      done: !!r.done,
      createdAt: r.createdAt || Date.now(),
      // Recurrence + notification bookkeeping.
      repeat: REPEATS.includes(r.repeat) ? r.repeat : "none",
      lastShown: DATE_RE.test(r.lastShown) ? r.lastShown : "", // last notify date
      lastDone: DATE_RE.test(r.lastDone) ? r.lastDone : "", // last done-for-today date
    };
  }

  function normalizeTask(a) {
    return {
      id: a.id || uid("a"),
      title: a.title || "Assignment",
      classId: a.classId || "",
      due: DATE_RE.test(a.due) ? a.due : "",
      dueTime: TIME_RE.test(a.dueTime) ? a.dueTime : "",
      priority: ["low", "med", "high"].includes(a.priority)
        ? a.priority
        : a.priority === "High"
          ? "high"
          : a.priority === "Low"
            ? "low"
            : "med",
      status: ["todo", "doing", "done"].includes(a.status)
        ? a.status
        : a.status === "Turned In" || a.status === "Done"
          ? "done"
          : ["Started", "Almost Done", "In Progress"].includes(a.status)
            ? "doing"
            : "todo",
      estimateMin: Number(a.estimateMin) || 0,
      steps: Array.isArray(a.steps)
        ? a.steps.map((st) => ({
            id: st.id || uid("s"),
            text: st.text || "",
            done: !!st.done,
            credited: !!st.credited,
          }))
        : [],
      notes: a.notes || "",
      source: a.source || "Manual",
      created: a.created || todayKey(),
      completedAt: a.completedAt || "",
    };
  }

  function normalizeTodo(t) {
    t = t || {};
    return {
      id: t.id || uid("td"),
      text: String(t.text || "").slice(0, 200),
      done: !!t.done,
      date: DATE_RE.test(t.date) ? t.date : todayKey(),
      createdAt: t.createdAt || Date.now(),
    };
  }

  let state = seed();
  const MIRROR_KEY = "noam-school:state"; // synchronous, never-lose-data fallback
  let saveTimer = null;
  let suppressPush = false; // true during init so we never push stale local over newer cloud
  function mirror() {
    // localStorage is synchronous, so this can't be lost to a fast close/refresh.
    try {
      localStorage.setItem(MIRROR_KEY, JSON.stringify(state));
    } catch {
      /* quota or disabled — idb is still the primary store */
    }
  }
  function save({ touch = true, immediate = false } = {}) {
    if (touch) state.updatedAt = Date.now();
    mirror(); // always write the sync mirror right away
    const write = () => {
      idb.set(STATE_KEY, state);
      if (state.settings.sync.enabled && !suppressPush) cloud.push();
      // Re-arm the local notification scheduler whenever data changes (added,
      // edited, or completed reminders all shift what's due today). Defined later;
      // guarded so early saves during init don't throw.
      if (typeof scheduleReminders === "function") scheduleReminders();
    };
    clearTimeout(saveTimer);
    if (immediate) return write();
    saveTimer = setTimeout(write, 400);
  }

  // ---------------------------------------------------------------------------
  // Selectors / derived data
  // ---------------------------------------------------------------------------
  const cls = (id) =>
    state.classes.find((c) => c.id === id) || {
      name: "Class",
      color: "#147c78",
    };
  const openTasks = () => state.assignments.filter((a) => a.status !== "done");

  // ---- Reminder recurrence helpers --------------------------------------------
  const isWeekday = (iso) => {
    const d = parseLocal(iso).getDay(); // 0=Sun..6=Sat
    return d >= 1 && d <= 5;
  };
  // Does a recurring reminder's schedule include the given ISO day?
  function recurOccursOn(r, iso) {
    if (r.repeat === "daily") return true;
    if (r.repeat === "weekdays") return isWeekday(iso);
    if (r.repeat === "weekly") {
      // Weekly anchored on the reminder's date (or its creation day).
      const anchor = r.date || new Date(r.createdAt).toISOString().slice(0, 10);
      if (!DATE_RE.test(anchor)) return true;
      return parseLocal(iso).getDay() === parseLocal(anchor).getDay();
    }
    return false;
  }
  // Next ISO day (today onward, within ~1 year) this recurring reminder happens.
  function nextRecurDate(r, fromIso = todayKey()) {
    const from = parseLocal(fromIso);
    for (let i = 0; i < 366; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (recurOccursOn(r, iso)) return iso;
    }
    return fromIso;
  }
  const isRecurring = (r) => r.repeat && r.repeat !== "none";
  // "Done for display": one-time uses .done; recurring = done-for-today only.
  const reminderDoneToday = (r) =>
    isRecurring(r) ? r.lastDone === todayKey() : !!r.done;
  // The date a reminder effectively shows on (recurring = next occurrence).
  const reminderShownDate = (r) => (isRecurring(r) ? nextRecurDate(r) : r.date);
  const REPEAT_LABEL = {
    none: "",
    daily: "Every day",
    weekdays: "Weekdays",
    weekly: "Weekly",
  };

  // Reminders sorted: open first, then by date/time (undated last), newest-created last.
  const reminderSortKey = (r) => {
    const d = reminderShownDate(r);
    return d ? d + (r.time || "99:99") : "9999-99-99";
  };
  function sortedReminders() {
    return [...state.reminders].sort((a, b) => {
      const ad = reminderDoneToday(a),
        bd = reminderDoneToday(b);
      return ad !== bd
        ? ad
          ? 1
          : -1
        : reminderSortKey(a) === reminderSortKey(b)
          ? a.createdAt - b.createdAt
          : reminderSortKey(a) < reminderSortKey(b)
            ? -1
            : 1;
    });
  }
  // Today's (or overdue, undated) reminders not yet done-for-today — home screen.
  // Recurring reminders surface on the days their schedule includes today.
  const todaysReminders = () => {
    const t = todayKey();
    return sortedReminders().filter((r) => {
      if (reminderDoneToday(r)) return false;
      if (isRecurring(r)) return recurOccursOn(r, t);
      return !r.date || r.date <= t;
    });
  };
  // Today's to-dos = those dated today plus any still-open from earlier days.
  const todaysTodos = () => {
    const t = todayKey();
    return state.todos
      .filter((td) => td.date === t || (!td.done && td.date < t))
      .sort((a, b) =>
        a.done === b.done ? a.createdAt - b.createdAt : a.done ? 1 : -1,
      );
  };
  // Upcoming assignment due dates (today onward), soonest first.
  function upcomingItems(limit = 15) {
    const t = todayKey();
    return state.assignments
      .filter((a) => a.status !== "done" && a.due && a.due >= t)
      .map((a) => ({
        id: a.id,
        title: a.title,
        date: a.due,
        time: a.dueTime || "",
        classId: a.classId,
      }))
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      )
      .slice(0, limit);
  }
  const stepPct = (a) =>
    a.steps.length
      ? Math.round(
          (a.steps.filter((s) => s.done).length / a.steps.length) * 100,
        )
      : 0;

  function urgency(a) {
    const n = daysUntil(a.due);
    let score = 0;
    if (n === null) score = 20;
    else if (n < 0)
      score = 1000 - n * 10; // most overdue first
    else if (n === 0) score = 800;
    else score = 600 - n * 12;
    score += { high: 60, med: 20, low: 0 }[a.priority] || 0;
    if (a.status === "doing") score += 40; // finish what you started
    return score;
  }
  const sortByUrgency = (list) =>
    [...list].sort((a, b) => urgency(b) - urgency(a));
  const rightNowTask = () => sortByUrgency(openTasks())[0] || null;

  function streak() {
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const k = isoForOffset(-i);
      const a = state.activity[k];
      const good = a && (a.tasks > 0 || a.focusMin > 0 || a.routines > 0);
      if (good) n++;
      else if (i === 0)
        continue; // today not earned yet shouldn't break the streak
      else break;
    }
    return n;
  }
  function bumpActivity(field, by = 1) {
    const k = todayKey();
    const a = (state.activity[k] = state.activity[k] || {
      tasks: 0,
      focusMin: 0,
      routines: 0,
    });
    a[field] = (a[field] || 0) + by;
  }

  // ---------------------------------------------------------------------------
  // App shell / routing
  // ---------------------------------------------------------------------------
  const TABS = [
    ["home", "Now", "🎯"],
    ["today", "Today", "📅"],
    ["tasks", "Tasks", "✅"],
    ["calendar", "Calendar", "📆"],
    ["routines", "Routines", "🔁"],
    ["more", "More", "⋯"],
  ];
  let view = "home";
  const expanded = new Set(); // task ids expanded inline

  function setView(v) {
    view = v;
    const url = new URL(location.href);
    url.searchParams.set("view", v);
    history.replaceState(null, "", url);
    render();
    $("#main").focus({ preventScroll: true });
    const reduce =
      state.settings.motion === "off" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function applyAppearance() {
    const s = state.settings;
    const root = document.documentElement;
    root.dataset.theme = s.theme;
    root.dataset.readable = s.readable ? "on" : "off";
    root.dataset.motion = s.motion;
    root.dataset.accent = s.accent;
    root.style.setProperty("--font-scale", s.fontScale);
    // Light theme only: re-tint the teal accent. Dark/contrast keep their tuned
    // palettes so contrast stays AA.
    const acc = ACCENTS.find((a) => a[0] === s.accent);
    if (acc && s.theme === "light") {
      root.style.setProperty("--teal", acc[2]);
      root.style.setProperty("--teal-bright", acc[2]);
      root.style.setProperty("--navy", acc[3]);
      root.style.setProperty("--navy-deep", acc[3]);
    } else {
      root.style.removeProperty("--teal");
      root.style.removeProperty("--teal-bright");
      root.style.removeProperty("--navy");
      root.style.removeProperty("--navy-deep");
    }
    const meta = $('meta[name="theme-color"]');
    if (meta)
      meta.content =
        s.theme === "dark"
          ? "#06101a"
          : s.theme === "contrast"
            ? "#000000"
            : "#1e293b";
    $("#brandName").textContent =
      (s.studentName || "Noam").split(" ")[0] + " School";
  }

  function render() {
    applyAppearance();
    renderHero();
    $("#main").innerHTML = (VIEWS[view] || VIEWS.home)();
    renderTabbar();
  }

  function renderTabbar() {
    $("#tabbar").innerHTML = TABS.map(
      ([id, label, ic]) =>
        `<button data-act="nav" data-arg="${id}" ${view === id ? 'aria-current="page"' : ""}><span class="ic" aria-hidden="true">${ic}</span>${label}</button>`,
    ).join("");
  }

  function greeting() {
    const h = new Date().getHours();
    const name = (state.settings.studentName || "").split(" ")[0] || "there";
    const part =
      h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    return `${part}, ${name}`;
  }

  function renderHero() {
    const hero = $("#hero");
    const t = rightNowTask();
    const open = openTasks();
    const today = open.filter((a) => daysUntil(a.due) === 0);
    const overdue = open.filter((a) => daysUntil(a.due) < 0);

    if (!t) {
      hero.innerHTML = `
        <span class="eyebrow">${esc(greeting())}</span>
        <h2>You're all caught up 🎉</h2>
        <p style="color:rgba(255,255,255,.82);max-width:46ch">Nothing is waiting for you right now. Add your next assignment, or paste your work from Google Classroom.</p>
        <div class="now-actions">
          <button class="btn go big" data-act="quick-add">＋ Add an assignment</button>
          <button class="btn" data-act="nav" data-arg="more">📋 Paste Classroom</button>
        </div>`;
      return;
    }
    const c = cls(t.classId);
    const pct = stepPct(t);
    const overdueB = daysUntil(t.due) < 0;
    const firstStep = t.steps.find((s) => !s.done);
    // ONE clear next move. If the task is broken into steps, the headline shows
    // the very next step so there's never a "what do I do?" gap.
    const cue = firstStep
      ? `Next small step: <b>${esc(firstStep.text)}</b>`
      : t.steps.length
        ? "All steps done — finish and turn it in."
        : "Tap “Break it down” to make a tiny first step.";
    hero.innerHTML = `
      <div class="now-head">
        <span class="eyebrow">🎯 Right now — just this one thing</span>
        <button class="btn sm now-quickadd" data-act="quick-add" aria-label="Add an assignment">＋ Add</button>
      </div>
      <div class="now-task">
        <div class="now-title">${esc(t.title)}</div>
        <div class="now-meta">
          <span class="tag" style="background:${esc(c.color)}55">${esc(c.name)}</span>
          <span class="tag" ${overdueB ? 'style="background:#b3000f"' : daysUntil(t.due) === 0 ? 'style="background:#7a4d0a"' : ""}>${esc(dueLabel(t.due, t.dueTime))}</span>
          ${t.estimateMin ? `<span class="tag">~${t.estimateMin} min</span>` : ""}
          ${t.steps.length ? `<span class="tag">${pct}% done</span>` : ""}
        </div>
        <p class="now-cue">${cue}</p>
      </div>
      <div class="now-actions">
        <button class="btn go big" data-act="focus-start" data-id="${t.id}">▶ Start this now</button>
        ${t.steps.length ? `<button class="btn" data-act="complete" data-id="${t.id}">✓ Done</button>` : `<button class="btn" data-act="breakdown" data-id="${t.id}">🧩 Break it down</button>`}
      </div>
      <details class="now-rest">
        <summary>The rest can wait — tap to peek (${Math.max(open.length - 1, 0)} more)</summary>
        <div class="progress-strip" style="margin-top:12px">
          <div class="statbox"><b>${overdue.length}</b><small>Overdue</small></div>
          <div class="statbox"><b>${today.length}</b><small>Due today</small></div>
          <div class="statbox"><b>${open.length}</b><small>Open total</small></div>
          <div class="statbox"><b>${streak()}🔥</b><small>Day streak</small></div>
        </div>
        <div class="now-rest-actions">
          ${t.steps.length ? `<button class="btn sm" data-act="breakdown" data-id="${t.id}">🧩 Edit steps</button>` : `<button class="btn sm" data-act="complete" data-id="${t.id}">✓ Mark done</button>`}
          <button class="btn sm" data-act="nav" data-arg="today">📅 See today's plan</button>
          <button class="btn sm" data-act="nav" data-arg="tasks">✅ All tasks</button>
        </div>
      </details>`;
  }

  // ---------------------------------------------------------------------------
  // Reusable components
  // ---------------------------------------------------------------------------
  function priPill(p) {
    return p === "high"
      ? '<span class="pill red">High priority</span>'
      : p === "low"
        ? '<span class="pill">Low</span>'
        : '<span class="pill amber">Medium</span>';
  }
  function statusLabel(s) {
    return s === "done"
      ? "Done"
      : s === "doing"
        ? "In progress"
        : "Not started";
  }

  function taskItem(a, { showClass = true } = {}) {
    const c = cls(a.classId);
    const n = daysUntil(a.due);
    const cssState =
      a.status === "done"
        ? "done"
        : n !== null && n < 0
          ? "overdue"
          : n === 0
            ? "today-due"
            : "";
    const pct = stepPct(a);
    const isOpen = expanded.has(a.id);
    const stepsHtml = a.steps.length
      ? `<div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
         <ul class="steps">${a.steps
           .map(
             (s) =>
               `<li><input class="check" type="checkbox" data-check="step" data-id="${a.id}" data-sid="${s.id}" ${s.done ? "checked" : ""} aria-label="${esc(s.text)}"><span class="steptext ${s.done ? "done" : ""}">${esc(s.text)}</span></li>`,
           )
           .join("")}</ul>`
      : `<p class="muted" style="font-size:.84rem">No steps yet. Breaking a task into small steps makes it much easier to start.</p>`;

    return `
    <details class="item ${cssState}" ${isOpen ? "open" : ""} data-task="${a.id}">
      <summary style="list-style:none;cursor:pointer">
        <div class="head">
          <div>
            <h4>${esc(a.title)}</h4>
            <p class="meta">${dueIcon(n)} ${esc(dueLabel(a.due, a.dueTime))}${a.estimateMin ? " · ~" + a.estimateMin + " min" : ""}${a.steps.length ? " · " + pct + "%" : ""}</p>
          </div>
          <div class="row">
            ${showClass ? `<span class="pill" style="background:${esc(c.color)}1f;color:var(--ink)"><span class="dot" style="background:${esc(c.color)};width:9px;height:9px;border-radius:50%;display:inline-block"></span>${esc(c.name)}</span>` : ""}
            ${priPill(a.priority)}
          </div>
        </div>
      </summary>
      <div style="margin-top:8px">
        ${stepsHtml}
        ${a.notes ? `<p class="muted" style="font-size:.84rem;margin-top:8px">📝 ${esc(a.notes)}</p>` : ""}
        <div class="row" style="margin-top:10px">
          <button class="btn primary sm" data-act="focus-start" data-id="${a.id}">▶ Start focus</button>
          <button class="btn sm" data-act="breakdown" data-id="${a.id}">🧩 Steps</button>
          <button class="btn sm" data-act="ask-help" data-id="${a.id}">🙋 Ask for help</button>
          <button class="btn sm" data-act="open-task" data-id="${a.id}">✏️ Edit</button>
          ${a.status === "done" ? `<button class="btn sm" data-act="reopen" data-id="${a.id}">↩ Reopen</button>` : `<button class="btn primary sm" data-act="complete" data-id="${a.id}">✓ Done</button>`}
          <button class="btn danger sm" data-act="delete-task" data-id="${a.id}">Delete</button>
        </div>
      </div>
    </details>`;
  }
  const dueIcon = (n) =>
    n === null ? "🗓" : n < 0 ? "🔴" : n === 0 ? "🟠" : n <= 2 ? "🟡" : "🟢";

  function card(key, title, sub, body) {
    return `<section class="card" data-card="${key}"><div class="head"><div><h3>${esc(title)}</h3>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}</div></div>${body}</section>`;
  }
  function emptyState(emoji, text) {
    return `<div class="empty"><div class="big-emoji" aria-hidden="true">${emoji}</div><p>${esc(text)}</p></div>`;
  }

  // Daily "did you write everything down?" capture nudge. Shows once per day,
  // from late morning on (after classes have handed out work), until answered.
  function captureBanner() {
    if (state.captureLog[todayKey()]) return "";
    if (new Date().getHours() < 11) return "";
    return `<div class="capture-banner" role="region" aria-label="Daily check-in">
      <div class="capture-text"><b>📋 Did you write everything down?</b><small>Check your bag, planner, and Google Classroom for any new homework.</small></div>
      <div class="capture-actions">
        <button class="btn primary sm" data-act="capture-add">＋ Add one</button>
        <button class="btn sm" data-act="capture-done">✓ All in</button>
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // Calendar / To-do / Assignment cards (home + dedicated Calendar view)
  // ---------------------------------------------------------------------------
  let calMonthOffset = 0; // 0 = current month, ±n to page through months
  let calSelected = ""; // selected ISO day in the calendar (shows that day's items)

  const isoFor = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // Days in the visible month that have an open assignment due.
  function dueDaySet() {
    return new Set(
      state.assignments
        .filter((a) => a.status !== "done" && a.due)
        .map((a) => a.due),
    );
  }

  function calendarCard({ full = false } = {}) {
    const base = startOfToday();
    base.setDate(1);
    base.setMonth(base.getMonth() + calMonthOffset);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = base.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    const due = dueDaySet();

    let cells = ["S", "M", "T", "W", "T", "F", "S"]
      .map((d) => `<div class="cal-head" aria-hidden="true">${d}</div>`)
      .join("");
    for (let i = 0; i < firstDay; i++) cells += `<div class="cal-pad"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = isoFor(year, month, d);
      const isToday = ds === todayKey();
      const hasDue = due.has(ds);
      const isSel = ds === calSelected;
      const cnt = hasDue
        ? state.assignments.filter((a) => a.status !== "done" && a.due === ds)
            .length
        : 0;
      cells += `<button type="button" class="cal-day${isToday ? " is-today" : ""}${isSel ? " is-sel" : ""}${hasDue ? " has-due" : ""}" data-act="cal-pick" data-arg="${ds}" aria-pressed="${isSel}" aria-label="${esc(niceDate(ds))}${hasDue ? `, ${cnt} due` : ""}">${d}${hasDue ? '<span class="cal-dot" aria-hidden="true"></span>' : ""}</button>`;
    }

    const grid = `
      <div class="cal-nav">
        <button class="btn sm" data-act="cal-prev" aria-label="Previous month">‹</button>
        <strong class="cal-month">${esc(monthName)}</strong>
        <button class="btn sm" data-act="cal-next" aria-label="Next month">›</button>
      </div>
      <div class="cal-grid" role="grid" aria-label="${esc(monthName)}">${cells}</div>
      <div class="cal-legend"><span><span class="sw today"></span>Today</span><span><span class="sw due"></span>Assignment due</span></div>`;

    // Selected-day detail (defaults to today's due items when nothing picked).
    const sel = calSelected || todayKey();
    const dayItems = state.assignments.filter(
      (a) => a.status !== "done" && a.due === sel,
    );
    const dayGcal = gcalEventsForDay(sel);
    const detail = `
      <div class="cal-detail">
        <div class="section-title" style="margin-top:14px">${esc(niceDate(sel))}</div>
        ${
          dayItems.length
            ? dayItems
                .map((a) => {
                  const c = cls(a.classId);
                  return `<div class="item"><div class="head"><div><h4>${esc(a.title)}</h4><p class="meta">${esc(dueLabel(a.due, a.dueTime))} · ${esc(c.name)}</p></div><div class="row"><button class="btn primary sm" data-act="complete" data-id="${a.id}">✓ Done</button></div></div></div>`;
                })
                .join("")
            : dayGcal.length
              ? ""
              : `<p class="muted" style="font-size:.84rem;margin:4px">Nothing due this day.</p>`
        }
        ${dayGcal.map(gcalRow).join("")}
      </div>`;

    const body =
      grid +
      detail +
      (full
        ? ""
        : `<button class="btn sm" data-act="nav" data-arg="calendar" style="margin-top:10px">Open full calendar →</button>`);
    return card(
      "calendar",
      "📆 Calendar",
      "Tap a day to see what's due.",
      body,
    );
  }

  function todoCard() {
    const list = todaysTodos();
    const openCount = list.filter((t) => !t.done).length;
    const rows = list.length
      ? `<ul class="steps">${list
          .map(
            (t) =>
              `<li><input class="check" type="checkbox" data-check="todo" data-id="${t.id}" ${t.done ? "checked" : ""} aria-label="${esc(t.text)}"><span class="steptext ${t.done ? "done" : ""}">${esc(t.text)}</span><button class="btn danger sm" data-act="del-todo" data-id="${t.id}" aria-label="Delete to-do: ${esc(t.text)}">✕</button></li>`,
          )
          .join("")}</ul>`
      : emptyState("📝", "No to-dos yet. Add a quick one below.");
    return card(
      "todos",
      "📝 To-do list",
      openCount ? `${openCount} left today` : "Today's quick to-dos.",
      `${rows}
       <div class="row" style="margin-top:10px">
         <input id="todoInput" placeholder="Add a quick to-do…" style="flex:1" aria-label="New to-do">
         <button class="btn primary" data-act="add-todo">＋ Add</button>
       </div>`,
    );
  }

  function remindersCard() {
    const list = todaysReminders().slice(0, 5);
    const total = todaysReminders().length;
    const rows = list.length
      ? `<ul class="steps">${list
          .map((r) => {
            const dn = reminderDoneToday(r);
            const rep = isRecurring(r)
              ? ` <small class="muted">· 🔁 ${esc(REPEAT_LABEL[r.repeat])}</small>`
              : "";
            return `<li><input class="check" type="checkbox" data-check="reminder" data-id="${r.id}" ${dn ? "checked" : ""} aria-label="Mark done: ${esc(r.text)}"><span class="steptext ${dn ? "done" : ""}">${esc(r.text)}${r.time ? ` <small class="muted">· ${esc(r.time)}</small>` : ""}${rep}</span></li>`;
          })
          .join(
            "",
          )}${total > list.length ? `<li><button class="btn sm" data-act="nav" data-arg="reminders">See all ${total} →</button></li>` : ""}</ul>`
      : emptyState("🔔", "Nothing to remember right now.");
    return card(
      "reminders",
      "🔔 Reminders",
      total ? `${total} to remember` : "Quick things not to forget.",
      `${rows}
       <div class="row" style="margin-top:10px">
         <input id="reminderInput" placeholder="Add a reminder…" style="flex:1" aria-label="New reminder">
         <button class="btn primary" data-act="quick-reminder">＋ Add</button>
       </div>`,
    );
  }

  function assignmentListCard() {
    const open = openTasks();
    const overdue = sortByUrgency(open.filter((a) => daysUntil(a.due) < 0));
    const upcoming = sortByUrgency(
      open.filter((a) => daysUntil(a.due) !== null && daysUntil(a.due) >= 0),
    );
    const show = [...overdue, ...upcoming].slice(0, 5);
    const rows = show.length
      ? show
          .map((a) => {
            const c = cls(a.classId);
            const n = daysUntil(a.due);
            const stateCls =
              n !== null && n < 0 ? "overdue" : n === 0 ? "today-due" : "";
            return `<div class="item ${stateCls}"><div class="head"><div><h4>${esc(a.title)}</h4><p class="meta">${dueIcon(n)} ${esc(dueLabel(a.due, a.dueTime))} · ${esc(c.name)}</p></div><div class="row"><button class="btn primary sm" data-act="complete" data-id="${a.id}">✓ Done</button><button class="btn sm" data-act="open-task" data-id="${a.id}" aria-label="Edit ${esc(a.title)}">✏️</button></div></div></div>`;
          })
          .join("")
      : emptyState("🎉", "No assignments due. You're caught up!");
    return card(
      "assignments",
      "📚 Assignment list",
      overdue.length
        ? `${overdue.length} overdue · ${upcoming.length} upcoming`
        : "Upcoming and overdue.",
      `${rows}
       <div class="row" style="margin-top:10px">
         <button class="btn primary" data-act="quick-add">＋ Add assignment</button>
         <button class="btn sm" data-act="nav" data-arg="tasks">See all →</button>
       </div>`,
    );
  }

  // "Today at a glance" — one strip merging local due items + today's reminders
  // + today's Google events, so everything happening today is in one place.
  function glanceCard() {
    const open = openTasks();
    const due = sortByUrgency(
      open.filter((a) => daysUntil(a.due) !== null && daysUntil(a.due) <= 0),
    ).slice(0, 4);
    const rem = todaysReminders().slice(0, 4);
    const gev = gcalToday();
    const remRow = (r) =>
      `<div class="item"><div class="head"><div><h4>🔔 ${esc(r.text)}</h4><p class="meta">${r.time ? "⏰ " + esc(r.time) : "Reminder"}${isRecurring(r) ? " · 🔁 " + esc(REPEAT_LABEL[r.repeat]) : ""}</p></div><div class="row"><button class="btn primary sm" data-act="reminder-done" data-id="${r.id}" aria-label="Mark done: ${esc(r.text)}">✓</button></div></div></div>`;
    const body =
      due.length || rem.length || gev.length
        ? due.map((a) => taskItem(a)).join("") +
          rem.map(remRow).join("") +
          gev.map(gcalRow).join("")
        : emptyState("🌤", "Nothing on the calendar today. Nice.");
    const parts = [];
    if (due.length) parts.push(`${due.length} due`);
    if (rem.length)
      parts.push(`${rem.length} reminder${rem.length === 1 ? "" : "s"}`);
    if (gev.length) parts.push(`${gev.length} Google`);
    return card(
      "glance",
      "Today at a glance",
      parts.length ? parts.join(" · ") : "",
      body,
    );
  }

  // Quick morning check-in (mood + one priority), surfaced at the top of home.
  const MOODS = [
    ["great", "😃", "Great"],
    ["ok", "🙂", "OK"],
    ["meh", "😕", "Meh"],
    ["rough", "😣", "Rough"],
  ];
  function checkinBanner() {
    const today = state.checkins[todayKey()];
    if (today) {
      const m = MOODS.find((x) => x[0] === today.mood);
      return `<div class="capture-banner" role="region" aria-label="Today's check-in">
        <div class="capture-text"><b>${m ? m[1] + " " : ""}Today's focus</b><small>${today.priority ? esc(today.priority) : "No single priority set — that's OK."}</small></div>
        <div class="capture-actions"><button class="btn sm" data-act="checkin-open">Edit</button></div>
      </div>`;
    }
    // Only nudge in the morning so it feels like a fresh-start ritual, not nagging.
    if (new Date().getHours() >= 14) return "";
    return `<div class="capture-banner" role="region" aria-label="Morning check-in">
      <div class="capture-text"><b>👋 Quick morning check-in</b><small>How are you feeling, and what's your one priority today?</small></div>
      <div class="capture-actions"><button class="btn primary sm" data-act="checkin-open">Check in</button></div>
    </div>`;
  }
  function checkinForm() {
    const c = state.checkins[todayKey()] || { mood: "", priority: "" };
    return `
      <p class="sub">A 10-second start to the day. Both are optional.</p>
      <div class="field"><label>How are you feeling?</label>
        <div class="seg" id="ciMood" role="group" aria-label="Mood">${MOODS.map(
          (m) =>
            `<button type="button" data-act="checkin-mood" data-arg="${m[0]}" aria-pressed="${c.mood === m[0]}">${m[1]} ${m[2]}</button>`,
        ).join("")}</div>
      </div>
      <div class="field"><label>My one priority today</label><input id="ciPriority" value="${esc(c.priority || "")}" placeholder="Finish my math worksheet"></div>
      <button class="btn primary block" data-act="save-checkin">Save check-in</button>`;
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------
  const VIEWS = {
    home() {
      const open = openTasks();
      const next = sortByUrgency(
        open.filter((a) => daysUntil(a.due) > 0 && daysUntil(a.due) <= 7),
      ).slice(0, 3);
      const routine = pickRoutineForNow();
      const map = {
        glance: glanceCard(),
        calendar: calendarCard(),
        todos: todoCard(),
        reminders: remindersCard(),
        assignments: assignmentListCard(),
        routine: routineCard(routine),
        momentum: momentumCard(),
        soon: card(
          "soon",
          "Coming up",
          "The next 7 days.",
          next.length
            ? next.map((a) => taskItem(a)).join("")
            : emptyState("📭", "Nothing due in the next week."),
        ),
      };
      const order = state.settings.homeOrder.filter(
        (k) => !state.settings.hiddenCards.includes(k),
      );
      return `${checkinBanner()}${captureBanner()}<div class="home-grid">${order.map((k) => map[k] || "").join("")}</div>`;
    },

    calendar() {
      const upcoming = upcomingItems(20);
      return `
        ${calendarCard({ full: true })}
        ${gcalPanel()}
        <div class="section-title">Upcoming (${upcoming.length})</div>
        ${
          upcoming.length
            ? upcoming
                .map((x) => {
                  const c = x.classId ? cls(x.classId) : null;
                  return `<div class="item"><div class="head"><div><h4>${esc(x.title)}</h4><p class="meta">${dueIcon(daysUntil(x.date))} ${esc(dueLabel(x.date, x.time))}${c ? " · " + esc(c.name) : ""}</p></div><div class="row"><span class="pill red">Due</span></div></div></div>`;
                })
                .join("")
            : emptyState(
                "📭",
                "Nothing upcoming. Add an assignment with a due date.",
              )
        }
      `;
    },

    today() {
      const open = openTasks();
      const overdue = sortByUrgency(open.filter((a) => daysUntil(a.due) < 0));
      const today = sortByUrgency(open.filter((a) => daysUntil(a.due) === 0));
      const noDate = open.filter((a) => a.due === "");
      const totalMin = [...overdue, ...today].reduce(
        (s, a) => s + (a.estimateMin || 0),
        0,
      );
      const goalToday =
        state.daily.goalDate === todayKey() ? state.daily.goal : "";
      return `
        ${card(
          "goal",
          "🌟 My one goal today",
          "Pick the single thing that matters most.",
          `<div class="field"><input id="goalInput" placeholder="Example: Finish my math worksheet" value="${esc(goalToday)}"></div>
           <button class="btn primary" data-act="save-goal">Save goal</button>`,
        )}
        ${totalMin ? `<div class="note">⏱ Today's work is about <b>${totalMin} minutes</b> total. That's ${Math.ceil(totalMin / state.settings.defaultFocusMin)} focus session${Math.ceil(totalMin / state.settings.defaultFocusMin) === 1 ? "" : "s"}.</div>` : ""}
        ${
          overdue.length
            ? `<div class="section-title">🔴 Catch up first${overdue.length > 3 ? ` — top 3 of ${overdue.length}` : ` (${overdue.length})`}</div>` +
              overdue
                .slice(0, 3)
                .map((a) => taskItem(a))
                .join("") +
              (overdue.length > 3
                ? `<button class="btn sm" data-act="nav" data-arg="tasks">See all ${overdue.length} in Tasks →</button>`
                : "")
            : ""
        }
        <div class="section-title">🟠 Due today (${today.length})</div>
        ${today.length ? today.map((a) => taskItem(a)).join("") : emptyState("✅", "All clear for today!")}
        ${noDate.length ? `<div class="section-title">🗓 No due date (${noDate.length})</div>${noDate.map((a) => taskItem(a)).join("")}` : ""}
      `;
    },

    tasks() {
      const open = openTasks();
      const buckets = [
        ["🔴 Overdue", open.filter((a) => daysUntil(a.due) < 0)],
        ["🟠 Today", open.filter((a) => daysUntil(a.due) === 0)],
        [
          "🟡 This week",
          open.filter((a) => daysUntil(a.due) > 0 && daysUntil(a.due) <= 7),
        ],
        ["🟢 Later", open.filter((a) => daysUntil(a.due) > 7)],
        ["🗓 No date", open.filter((a) => a.due === "")],
      ];
      const recentDone = state.assignments
        .filter((a) => a.status === "done")
        .sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1))
        .slice(0, 6);
      return `
        <div class="view-head">
          <h2 class="view-title">All tasks</h2>
          <button class="btn primary" data-act="quick-add">＋ Add assignment</button>
        </div>
        ${open.length === 0 ? emptyState("🎉", "No open tasks. Add one or paste from Classroom (More tab).") : ""}
        ${buckets
          .filter(([, list]) => list.length)
          .map(
            ([label, list]) =>
              `<div class="section-title">${label} (${list.length})</div>${sortByUrgency(
                list,
              )
                .map((a) => taskItem(a))
                .join("")}`,
          )
          .join("")}
        ${recentDone.length ? `<div class="section-title">✓ Recently finished</div>${recentDone.map((a) => taskItem(a)).join("")}` : ""}
      `;
    },

    routines() {
      const log = state.routineLog[todayKey()] || {};
      return `
        <div class="view-head">
          <h2 class="view-title">Daily routines</h2>
          <button class="btn sm primary" data-act="add-routine">＋ New routine</button>
        </div>
        <p class="view-intro">Same steps every day means less to remember. Check things off as you go.</p>
        ${state.routines
          .map((r) => {
            const done = log[r.id] || [];
            const pct = r.items.length
              ? Math.round((done.length / r.items.length) * 100)
              : 0;
            return card(
              "routine-" + r.id,
              `${r.emoji || "🔁"} ${r.name}`,
              `${done.length}/${r.items.length} done today`,
              `<div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
               <ul class="steps">${r.items
                 .map(
                   (it) =>
                     `<li><input class="check" type="checkbox" data-check="routine" data-id="${r.id}" data-sid="${it.id}" ${done.includes(it.id) ? "checked" : ""} aria-label="${esc(it.text)}"><span class="steptext ${done.includes(it.id) ? "done" : ""}">${esc(it.text)}</span></li>`,
                 )
                 .join("")}</ul>
               <div class="row" style="margin-top:8px">
                 <button class="btn primary sm" data-act="guide-start" data-id="${r.id}">▶ Walk me through it</button>
                 <button class="btn sm" data-act="reset-routine" data-id="${r.id}">Reset for today</button>
                 <button class="btn sm" data-act="edit-routine" data-id="${r.id}">Edit</button>
               </div>`,
            );
          })
          .join("")}
      `;
    },

    more() {
      const grid = (items) =>
        `<div class="grid g2">${items
          .map(
            (i) =>
              `<button class="btn block menu-tile" data-act="${i.act}" ${i.arg ? `data-arg="${i.arg}"` : ""}>
              <span class="menu-ic" aria-hidden="true">${i.ic}</span><span><b>${i.title}</b><small>${i.sub}</small></span></button>`,
          )
          .join("")}</div>`;
      return `
        <div class="view-head"><h2 class="view-title">More</h2></div>
        ${grid([
          {
            act: "view-classes",
            ic: "🏫",
            title: "My classes",
            sub: "Subjects, times, colors",
          },
          {
            act: "view-reminders",
            ic: "🔔",
            title: "Reminders",
            sub: "Things to remember",
          },
          {
            act: "view-mail",
            ic: "📨",
            title: "School Mail",
            sub: "Read recent Gmail, make tasks",
          },
          {
            act: "view-email",
            ic: "✉️",
            title: "Email a teacher",
            sub: "Opens Gmail in the browser",
          },
          {
            act: "view-import",
            ic: "📋",
            title: "Paste from Classroom",
            sub: "Add work fast, no login",
          },
          {
            act: "view-wins",
            ic: "🏆",
            title: "My wins",
            sub: "See how far you've come",
          },
          {
            act: "view-settings",
            ic: "⚙️",
            title: "Settings",
            sub: "Theme, text size, notifications",
          },
          {
            act: "view-sync",
            ic: "☁️",
            title: "Backup & sync",
            sub: "Back up, or sync across devices",
          },
        ])}
        <div class="section-title">App</div>
        ${grid([
          {
            act: "install",
            ic: "⬇️",
            title: "Install on this computer",
            sub: "Use it like a desktop app, offline",
          },
          {
            act: "view-about",
            ic: "ℹ️",
            title: "About & help",
            sub: "How this app works",
          },
        ])}
      `;
    },

    classes() {
      const classRow = (c) => {
        const open = openTasks().filter((a) => a.classId === c.id).length;
        const meta = [
          c.subject,
          c.period,
          c.meetTime,
          c.meetDays && c.meetDays.length ? c.meetDays.join("·") : "",
          c.room,
          c.teacher,
        ].filter(Boolean);
        return `<div class="item" style="border-left:4px solid ${esc(c.color)}"><div class="head"><div><h4><span class="dot" style="background:${esc(c.color)};width:11px;height:11px;border-radius:50%;display:inline-block;margin-right:6px"></span>${esc(c.name)}</h4><p class="meta">${meta.length ? esc(meta.join(" · ")) : "Tap Edit to add details"}${open ? ` · ${open} open task${open === 1 ? "" : "s"}` : ""}</p></div></div><div class="row">
                <button class="btn sm" data-act="edit-class" data-id="${c.id}">Edit</button>
                ${c.email ? `<a class="btn sm navy" target="_blank" rel="noopener" href="${gmailCompose(c.email, "Question for " + c.name, "Hi,\n\nI had a question about...\n\nThank you,\n" + state.settings.studentName)}">✉️ Email</a>` : ""}
              </div></div>`;
      };
      return (
        backHeader("My classes", "more") +
        `<div class="grid g2"><section class="card"><div class="head"><div><h3>Classes</h3><p class="sub">Each class has its own color across the app.</p></div></div>${
          state.classes.length
            ? state.classes.map(classRow).join("")
            : emptyState("🏫", "No classes yet. Add your first one below.")
        }
        <button class="btn primary block" data-act="add-class" style="margin-top:8px">＋ Add a class</button></section>
        <section class="card"><h3>Why this helps</h3><p class="sub">Color-coding and class names show up on the Now screen, Calendar, and every assignment, so you can spot what belongs to which class at a glance — one less thing to think about.</p></section></div>`
      );
    },

    reminders() {
      const list = sortedReminders();
      const open = list.filter((r) => !reminderDoneToday(r));
      const done = list.filter((r) => reminderDoneToday(r));
      const row = (r) => {
        const dn = reminderDoneToday(r);
        // Recurring reminders always show their NEXT occurrence.
        const shownDate = reminderShownDate(r);
        const when = shownDate
          ? dueLabel(shownDate, r.time)
          : r.time
            ? "At " + r.time
            : "";
        const n = shownDate ? daysUntil(shownDate) : null;
        const rep = isRecurring(r)
          ? ` · 🔁 ${esc(REPEAT_LABEL[r.repeat])}`
          : "";
        return `<div class="item ${!dn && n !== null && n < 0 ? "overdue" : ""}"><div class="row" style="align-items:flex-start;gap:10px;flex-wrap:wrap"><label class="row" style="align-items:flex-start;gap:10px;flex:1;min-width:0;cursor:pointer"><input class="check" type="checkbox" data-check="reminder" data-id="${r.id}" ${dn ? "checked" : ""} aria-label="Mark done: ${esc(r.text)}"><span style="min-width:0"><span class="steptext ${dn ? "done" : ""}" style="font-weight:800;display:block">${esc(r.text)}</span>${when || rep ? `<span class="meta" style="display:block;margin-top:2px">${shownDate ? dueIcon(n) + " " : r.time ? "⏰ " : ""}${esc(when)}${rep}</span>` : ""}</span></label><span class="row" style="gap:6px">${dn ? "" : `<button class="btn sm" data-act="snooze-reminder" data-id="${r.id}" data-arg="10" title="Snooze 10 minutes">😴 10m</button><button class="btn sm" data-act="snooze-reminder" data-id="${r.id}" data-arg="tonight" title="Snooze until tonight">🌙</button>`}<button class="btn sm" data-act="edit-reminder" data-id="${r.id}">Edit</button><button class="btn danger sm" data-act="del-reminder" data-id="${r.id}" aria-label="Delete reminder: ${esc(r.text)}">✕</button></span></div></div>`;
      };
      return (
        backHeader("Reminders", "more") +
        `<div class="view-head"><h2 class="view-title" style="font-size:1rem">Reminders</h2><button class="btn primary" data-act="add-reminder">＋ Add reminder</button></div>
        <p class="view-intro">Quick nudges for things to remember — bring something, ask a teacher, sign a form.</p>
        ${open.length ? `<div class="section-title">To remember (${open.length})</div>${open.map(row).join("")}` : emptyState("🔔", "No reminders yet. Add one above.")}
        ${done.length ? `<div class="section-title">✓ Done for today (${done.length})</div>${done.map(row).join("")}<button class="btn sm" data-act="clear-done-reminders" style="margin-top:8px">Clear finished</button>` : ""}`
      );
    },

    email() {
      return (
        backHeader("Email a teacher", "more") +
        `<div class="grid g2"><section class="card"><h3>Write an email</h3><p class="sub">This opens Gmail in your browser (not Apple Mail).</p>
          <div class="field"><label>To which class / teacher</label><select id="eClass">${state.classes.map((c) => `<option value="${c.id}">${esc(c.name)}${c.teacher ? " — " + esc(c.teacher) : ""}</option>`).join("")}</select></div>
          <div class="field"><label>Subject</label><input id="eSub" value="Question about class"></div>
          <div class="field"><label>Message</label><textarea id="eBody">Hi,

I had a question about the assignment. Can you help me understand what I should do next?

Thank you,
${esc(state.settings.studentName)}</textarea></div>
          <div class="row"><button class="btn navy" data-act="compose-email">Open in Gmail</button><a class="btn" target="_blank" rel="noopener" href="${gmailInbox()}">Open inbox</a></div>
        </section>
        <section class="card"><h3>What to say</h3><div class="note">Tell the teacher: <b>1)</b> the class, <b>2)</b> the assignment, <b>3)</b> what's confusing, and <b>4)</b> what help you need. Short is fine!</div></section></div>`
      );
    },

    mail() {
      return (
        backHeader("School Mail", "more") +
        `<p class="view-intro">Your recent Gmail, read-only. Turn a message into a task or reminder with one tap — the mailbox is never changed.</p>
        ${gmailPanel()}`
      );
    },

    import() {
      return (
        backHeader("Paste from Google Classroom", "more") +
        `<div class="grid g2"><section class="card"><h3>Paste your work</h3><p class="sub">No login needed. Open Classroom → To-do, copy what you see, paste it here.</p>
          <textarea id="pasteBox" placeholder="Math
Ratios worksheet
Due tomorrow
English
Reading response
Due May 31"></textarea>
          <div class="row"><button class="btn primary" data-act="parse-paste">Preview</button><button class="btn" data-act="clear-paste">Clear</button></div>
          <div class="note">Tip: if it gets messy, paste one class at a time.</div>
        </section>
        <section class="card"><h3>Preview</h3><div id="parsePreview" class="note">Nothing yet — paste and press Preview.</div></section></div>`
      );
    },

    wins() {
      const recent = [...state.wins].slice(-30).reverse();
      return (
        backHeader("My wins", "more") +
        momentumCard() +
        card(
          "addwin",
          "Add a win",
          "Big or small — they all count.",
          `<div class="field"><input id="winInput" placeholder="I started my homework without being asked"></div><button class="btn primary" data-act="add-win">＋ Add win</button>`,
        ) +
        `<div class="section-title">Recent wins</div>${recent.length ? recent.map((w) => `<div class="item"><h4>🏆 ${esc(w.text)}</h4><p class="meta">${esc(w.date)}</p></div>`).join("") : emptyState("🌱", "No wins logged yet. Finish a task to earn your first one!")}`
      );
    },

    settings() {
      const s = state.settings;
      const themeBtn = (val, label) =>
        `<button data-act="set-theme" data-arg="${val}" aria-pressed="${s.theme === val}">${label}</button>`;
      return (
        backHeader("Settings", "more") +
        card(
          "appearance",
          "Look & feel",
          "Set it up the way that's easiest for you.",
          `
          <div class="field"><label>Color theme</label><div class="seg">${themeBtn("light", "☀️ Light")}${themeBtn("dark", "🌙 Dark")}${themeBtn("contrast", "⬛ High contrast")}</div></div>
          <div class="field"><label>Accent color${s.theme === "light" ? "" : " (Light theme only)"}</label><div class="accent-row" role="group" aria-label="Accent color">${ACCENTS.map(
            (a) =>
              `<button class="accent-swatch" data-act="set-accent" data-arg="${a[0]}" aria-pressed="${s.accent === a[0]}" aria-label="${a[1]}" title="${a[1]}" style="background:${a[2]}"></button>`,
          ).join("")}</div></div>
          <div class="field"><label>Text size — ${Math.round(s.fontScale * 100)}%</label><input type="range" min="0.9" max="1.5" step="0.05" value="${s.fontScale}" data-bind="fontScale"></div>
          <div class="toggle-row"><div class="label"><b>Readable font & spacing</b><small>Easier-to-read letters with more space</small></div><label class="seg"><button data-act="toggle" data-arg="readable" aria-pressed="${s.readable}">${s.readable ? "On" : "Off"}</button></label></div>
          <div class="toggle-row"><div class="label"><b>Reduce motion</b><small>Turn off animations</small></div><label class="seg"><button data-act="toggle" data-arg="motion" aria-pressed="${s.motion === "off"}">${s.motion === "off" ? "On" : "Off"}</button></label></div>
        `,
        ) +
        card(
          "focus",
          "Focus timer",
          "How long is one focus session?",
          `
          <div class="field"><label>Focus minutes — ${s.defaultFocusMin}</label><input type="range" min="5" max="45" step="5" value="${s.defaultFocusMin}" data-bind="defaultFocusMin"></div>
          <div class="field"><label>Break minutes — ${s.breakMin}</label><input type="range" min="2" max="15" step="1" value="${s.breakMin}" data-bind="breakMin"></div>
        `,
        ) +
        card(
          "notify",
          "Reminders & briefing",
          "Gentle nudges so the app gets opened.",
          `
          <div class="toggle-row"><div class="label"><b>Reminders &amp; morning briefing</b><small>${notifSupport() ? (s.notifications ? "On — reminders pop up at their set times, plus due-soon nudges" : "Turn on to get pop-up reminders at their set times") : "Not supported on this device"}</small></div>
          <label class="seg"><button data-act="toggle-notify" aria-pressed="${s.notifications}" ${notifSupport() ? "" : "disabled"}>${s.notifications ? "On" : "Off"}</button></label></div>
          <div class="field"><label>Morning briefing time</label><input type="time" id="setBriefTime" value="${esc(s.morningBriefingTime)}"></div>
          <div class="field"><label>“Leave by” time (optional, shown in guided routine)</label><input type="time" id="setLeaveBy" value="${esc(s.leaveByTime)}"></div>
          <button class="btn primary" data-act="save-reminder-times">Save times</button>
          <div class="note" style="margin-top:12px"><b>Good to know:</b> reminders pop up while the app is open or installed and running in the background. They can’t wake your computer when the app is <b>fully closed</b> — that needs a push server, which this private offline app doesn’t use. For the most reliable nudges, install the app (More → Install) and keep it open or pinned.</div>
        `,
        ) +
        card(
          "gcal",
          "📅 Google Calendar",
          "Show your Google events in the app (read-only).",
          `
          <div class="field"><label>Google OAuth Web Client ID</label><input id="gClientId" value="${esc(s.googleClientId)}" placeholder="xxxxxxxx.apps.googleusercontent.com" autocomplete="off"></div>
          <button class="btn primary" data-act="save-google-id">Save Client ID</button>
          ${s.googleClientId.trim() ? `<button class="btn navy" data-act="gcal-connect" style="margin-left:8px">Connect now</button><button class="btn" data-act="view-mail" style="margin-left:8px">Open School Mail</button>` : ""}
          <div class="note" style="margin-top:12px"><b>One-time setup</b> (an adult does this once):
            <ol style="margin:6px 0 0;padding-left:18px;line-height:1.6">
              <li>Go to <b>Google Cloud Console</b> → APIs &amp; Services.</li>
              <li><b>Enable</b> the <b>Google Calendar API</b> and the <b>Gmail API</b>.</li>
              <li>Create an <b>OAuth client ID</b> of type <b>Web application</b>.</li>
              <li>Under <b>Authorized JavaScript origins</b> add: <code>https://neft-classroom-html-activities.pages.dev</code></li>
              <li>On the <b>OAuth consent screen</b>, add the scope <code>gmail.readonly</code> (a sensitive scope — fine for the owner's own / test-user account; full public verification is a later step).</li>
              <li>Copy the Client ID (ends in <code>.apps.googleusercontent.com</code>) and paste it above.</li>
            </ol>
            The same Client ID powers Calendar and <b>School Mail</b>. Only this Client ID is saved. Google sign-in gives temporary access tokens that stay in memory and are never stored. Scopes used: <code>calendar.readonly</code> and <code>gmail.readonly</code> (Gmail is requested separately when you connect School Mail).
          </div>
        `,
        ) +
        card(
          "family",
          "Family setup",
          "Set up classes, teachers, and routines together.",
          `
          <div class="grid g2">
            <button class="btn block menu-tile" data-act="view-classes"><span class="menu-ic" aria-hidden="true">🏫</span><span><b>Classes &amp; teacher emails</b><small>Names, colors, who to email</small></span></button>
            <button class="btn block menu-tile" data-act="nav" data-arg="routines"><span class="menu-ic" aria-hidden="true">🔁</span><span><b>Morning &amp; daily routines</b><small>Edit the step-by-step lists</small></span></button>
          </div>
        `,
        ) +
        card(
          "profile",
          "Profile",
          "",
          `
          <div class="field"><label>My name</label><input id="setName" value="${esc(s.studentName)}"></div>
          <div class="field"><label>My Gmail (optional)</label><input id="setGmail" value="${esc(s.gmail)}" placeholder="name@school.org"></div>
          <button class="btn primary" data-act="save-profile">Save</button>
        `,
        ) +
        card(
          "home",
          "Home cards",
          "Show, hide, or reorder what's on the Now screen.",
          state.settings.homeOrder
            .map((k) => {
              const label = CARDS.find((c) => c[0] === k)?.[1] || k;
              const hidden = state.settings.hiddenCards.includes(k);
              return `<div class="toggle-row"><div class="label"><b>${esc(label)}</b><small>${hidden ? "Hidden" : "Showing"}</small></div><div class="row"><button class="btn sm" data-act="move-card" data-id="${k}" data-arg="up" aria-label="Move ${esc(label)} up">↑</button><button class="btn sm" data-act="move-card" data-id="${k}" data-arg="down" aria-label="Move ${esc(label)} down">↓</button><button class="btn sm ${hidden ? "primary" : ""}" data-act="toggle-card" data-id="${k}" aria-label="${hidden ? "Show" : "Hide"} ${esc(label)}">${hidden ? "Show" : "Hide"}</button></div></div>`;
            })
            .join(""),
        )
      );
    },

    sync() {
      const s = state.settings.sync;
      const status = s.enabled
        ? '<span class="pill green">● Sync is on</span>'
        : '<span class="pill">Off by default</span>';
      return (
        backHeader("Backup & sync", "more") +
        `<p class="view-intro">Your work is always saved on this device. Choose how you want to back it up or carry it to another device.</p>` +
        // Cloud sync surfaced first, highlighted, with a plain-language explanation.
        `<section class="card feature" data-card="cloud">
          <div class="head"><div><h3>☁️ Sync across your devices</h3><p class="sub">Optional — work on your phone and laptop and see the same tasks everywhere.</p></div>${status}</div>
          <p class="sub" style="margin-top:0">Pick one secret code and type it on every device you use. They'll keep each other up to date automatically — no account, no email, no password to remember. ${cloud.available() ? "" : "<b>Heads up:</b> this site isn't set up for cloud sync yet, so your code is saved and ready, but data stays on this device until it is."}</p>
          <div class="field"><label>Secret sync code (12+ characters)</label><input id="syncCode" value="${esc(s.code)}" placeholder="Tap “Make a code” for a strong one"></div>
          <div class="row">
            <button class="btn" data-act="gen-code">🎲 Make a code</button>
            <button class="btn ${s.enabled ? "danger" : "primary"}" data-act="toggle-sync">${s.enabled ? "Turn off sync" : "Turn on sync"}</button>
            ${s.enabled ? `<button class="btn navy" data-act="sync-now">🔄 Sync now</button>` : ""}
          </div>
          ${s.lastAt ? `<p class="muted" style="font-size:.8rem;margin-top:8px">Last synced: ${esc(new Date(s.lastAt).toLocaleString())}</p>` : ""}
        </section>` +
        card(
          "file",
          "💾 Save a backup file",
          "Always works, even offline.",
          `
          <p class="sub" style="margin-top:0">Download one file with everything in the app. Keep it somewhere safe, or open it on another device to load your data.</p>
          <div class="row"><button class="btn primary" data-act="export">⬇️ Download backup</button><button class="btn" data-act="import">⬆️ Load from file</button></div>
          <input type="file" id="importFile" accept="application/json,.json" hidden>
        `,
        ) +
        `<div class="note">Your data is stored privately on this device. It only leaves when <b>you</b> download a backup or turn on cloud sync.</div>`
      );
    },

    about() {
      return (
        backHeader("About & help", "more") +
        card(
          "about",
          "Noam School — Focus & Plan",
          "Version 11",
          `
          <p class="sub">A calm planner built to make school easier when starting and organizing work is hard.</p>
          <ul style="line-height:1.7;padding-left:18px;margin:0">
            <li><b>🎯 Right now</b> — shows the one thing to do next, so you never have to decide.</li>
            <li><b>🧩 Break it down</b> — turns a big task into small, checkable steps.</li>
            <li><b>▶ Focus timer</b> — work in short bursts with breaks.</li>
            <li><b>🔁 Routines</b> — daily checklists so less to remember.</li>
            <li><b>📶 Works offline</b> — install it and use it with no internet.</li>
          </ul>`,
        ) +
        card(
          "data",
          "Your data & privacy",
          "",
          `<p class="sub">Everything stays on your device unless you download a backup or turn on cloud sync. No accounts, no tracking.</p>`,
        )
      );
    },
  };

  function backHeader(title, back) {
    return `<div class="view-head"><div class="row" style="gap:10px"><button class="btn sm ghost" data-act="nav" data-arg="${back}" aria-label="Back to More">← Back</button><h2 class="view-title">${esc(title)}</h2></div></div>`;
  }

  function routineCard(r) {
    if (!r)
      return card(
        "routine",
        "Right routine",
        "",
        emptyState("🔁", "No routines yet."),
      );
    const done = (state.routineLog[todayKey()] || {})[r.id] || [];
    const pct = r.items.length
      ? Math.round((done.length / r.items.length) * 100)
      : 0;
    return card(
      "routine",
      `${r.emoji || "🔁"} ${r.name}`,
      `${done.length}/${r.items.length} done`,
      `<div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
       <ul class="steps">${r.items
         .slice(0, 5)
         .map(
           (it) =>
             `<li><input class="check" type="checkbox" data-check="routine" data-id="${r.id}" data-sid="${it.id}" ${done.includes(it.id) ? "checked" : ""} aria-label="${esc(it.text)}"><span class="steptext ${done.includes(it.id) ? "done" : ""}">${esc(it.text)}</span></li>`,
         )
         .join("")}</ul>
       <div class="row" style="margin-top:8px">
         <button class="btn primary sm" data-act="guide-start" data-id="${r.id}">▶ Walk me through it</button>
         <button class="btn sm" data-act="nav" data-arg="routines">All routines →</button>
       </div>`,
    );
  }
  function pickRoutineForNow() {
    const h = new Date().getHours();
    const want =
      h < 11 ? "Morning Launch" : h < 18 ? "After-School Reset" : "Shutdown";
    return (
      state.routines.find((r) => r.name === want) || state.routines[0] || null
    );
  }

  function momentumCard() {
    const lastWin = state.wins[state.wins.length - 1];
    const todayAct = state.activity[todayKey()] || {
      tasks: 0,
      focusMin: 0,
      routines: 0,
    };
    return card(
      "momentum",
      "🏆 Momentum",
      "",
      `<div class="progress-strip" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr))">
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${streak()}🔥</b><small class="muted">Day streak</small></div>
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${state.points}</b><small class="muted">Points</small></div>
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${todayAct.tasks}</b><small class="muted">Done today</small></div>
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${todayAct.focusMin}m</b><small class="muted">Focused</small></div>
      </div>
      ${lastWin ? `<p class="muted" style="margin:10px 0 0">Last win: <b>${esc(lastWin.text)}</b></p>` : ""}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Gmail helpers
  // ---------------------------------------------------------------------------
  const gmailInbox = () => "https://mail.google.com/mail/u/0/#inbox";
  const gmailCompose = (to = "", su = "", body = "") =>
    "https://mail.google.com/mail/?" +
    new URLSearchParams({ view: "cm", fs: "1", to, su, body }).toString();

  // ---------------------------------------------------------------------------
  // Toast + celebration
  // ---------------------------------------------------------------------------
  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ---------------------------------------------------------------------------
  // Modal
  // ---------------------------------------------------------------------------
  let modalLastFocus = null;
  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function openModal(title, bodyHtml) {
    modalLastFocus = document.activeElement;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = bodyHtml;
    $("#modalBack").classList.add("open");
    $("#modalBack").setAttribute("aria-hidden", "false");
    const first = $(
      "#modalBody input, #modalBody textarea, #modalBody select, #modalBody button",
    );
    if (first) first.focus();
  }
  function closeModal() {
    $("#modalBack").classList.remove("open");
    $("#modalBack").setAttribute("aria-hidden", "true");
    // Return focus to whatever opened the modal (WCAG 2.4.3).
    if (modalLastFocus) {
      try {
        modalLastFocus.focus();
      } catch {}
      modalLastFocus = null;
    }
  }
  // Keep Tab focus inside whichever overlay is open (WCAG 2.1.2).
  function trapFocus(container, ev) {
    const items = [...container.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    } else if (!container.contains(document.activeElement)) {
      ev.preventDefault();
      first.focus();
    }
  }

  // Minimal capture form: what + class + due in the fewest taps. "Due" defaults
  // to a quick-pick row (Today / Tomorrow / Pick) so most adds are 2 taps.
  function quickAddForm() {
    const due = quickAddForm._due ?? "";
    const pick = (val, label) =>
      `<button type="button" data-act="qa-due" data-arg="${val}" aria-pressed="${due === val || (val === "custom" && due && due !== isoForOffset(0) && due !== isoForOffset(1))}">${label}</button>`;
    return `
      <p class="sub">Write it down before you forget. You can add details later.</p>
      <div class="field"><label>What is it?</label><input id="qaTitle" placeholder="Math worksheet p. 42" autocomplete="off"></div>
      <div class="field"><label>Which class?</label><select id="qaClass">${state.classes
        .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`)
        .join("")}</select></div>
      <div class="field"><label>When is it due?</label>
        <div class="seg" id="qaDueSeg">${pick(isoForOffset(0), "Today")}${pick(isoForOffset(1), "Tomorrow")}${pick("custom", "Pick a date")}${pick("", "Not sure")}</div>
        <input type="date" id="qaDate" value="${esc(due && due !== "custom" ? due : "")}" style="margin-top:8px;${due === "custom" || (due && due !== isoForOffset(0) && due !== isoForOffset(1)) ? "" : "display:none"}">
      </div>
      <button class="btn primary block big" data-act="save-quickadd">＋ Add it</button>
      <button class="btn block ghost" data-act="open-task" style="margin-top:8px">More details…</button>`;
  }

  function taskForm(a) {
    const editing = !!a;
    a = a || {};
    return `
      <div class="field"><label>What is it?</label><input id="tTitle" value="${esc(a.title || "")}" placeholder="Math worksheet p. 42"></div>
      <div class="g2 grid">
        <div class="field"><label>Class</label><select id="tClass">${state.classes.map((c) => `<option value="${c.id}" ${a.classId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Priority</label><select id="tPri"><option value="low" ${a.priority === "low" ? "selected" : ""}>Low</option><option value="med" ${!a.priority || a.priority === "med" ? "selected" : ""}>Medium</option><option value="high" ${a.priority === "high" ? "selected" : ""}>High</option></select></div>
      </div>
      <div class="g2 grid">
        <div class="field"><label>Due date</label><input type="date" id="tDue" value="${esc(a.due || "")}"></div>
        <div class="field"><label>Due time (optional)</label><input type="time" id="tTime" value="${esc(a.dueTime || "")}"></div>
      </div>
      <div class="field"><label>About how long? (minutes)</label><input type="number" id="tEst" min="0" step="5" value="${a.estimateMin || ""}" placeholder="20"></div>
      <div class="field"><label>Notes (optional)</label><textarea id="tNotes">${esc(a.notes || "")}</textarea></div>
      <button class="btn primary block" data-act="save-task" data-id="${esc(a.id || "")}">${editing ? "Save changes" : "Add assignment"}</button>`;
  }

  function breakdownForm(a) {
    return `
      <p class="sub">Break "<b>${esc(a.title)}</b>" into small steps. Start with a template, then tweak.</p>
      <div class="field"><label>Quick templates</label><div class="seg">${Object.keys(
        STEP_TEMPLATES,
      )
        .map(
          (t) =>
            `<button data-act="apply-template" data-id="${a.id}" data-arg="${esc(t)}">${esc(t)}</button>`,
        )
        .join("")}</div></div>
      <ul class="steps" id="editSteps">${a.steps
        .map(
          (s) =>
            `<li><input class="check" type="checkbox" data-check="step" data-id="${a.id}" data-sid="${s.id}" ${s.done ? "checked" : ""} aria-label="${esc(s.text)}"><span class="steptext ${s.done ? "done" : ""}">${esc(s.text)}</span><button class="btn danger sm" data-act="del-step" data-id="${a.id}" data-sid="${s.id}" aria-label="Delete step: ${esc(s.text)}">✕</button></li>`,
        )
        .join("")}</ul>
      <div class="row"><input id="newStep" placeholder="Add a step..." style="flex:1"><button class="btn" data-act="add-step" data-id="${a.id}">＋ Add</button></div>
      <button class="btn primary block" data-act="close-modal" style="margin-top:12px">Done</button>`;
  }

  function classForm(c) {
    c = c || {};
    const days = Array.isArray(c.meetDays) ? c.meetDays : [];
    return `
      <div class="field"><label>Class name</label><input id="cName" value="${esc(c.name || "")}" placeholder="Math"></div>
      <div class="g2 grid">
        <div class="field"><label>Subject (optional)</label><input id="cSubject" value="${esc(c.subject || "")}" placeholder="Mathematics"></div>
        <div class="field"><label>Room (optional)</label><input id="cRoom" value="${esc(c.room || "")}" placeholder="Room 214"></div>
      </div>
      <div class="g2 grid">
        <div class="field"><label>Period (optional)</label><input id="cPeriod" value="${esc(c.period || "")}" placeholder="Period 3"></div>
        <div class="field"><label>Meeting time (optional)</label><input id="cMeetTime" value="${esc(c.meetTime || "")}" placeholder="8:30 AM"></div>
      </div>
      <div class="field"><label>Days it meets</label><div class="seg" id="cDays" role="group" aria-label="Days this class meets">${DAYS.map(
        (d) =>
          `<button type="button" data-act="toggle-class-day" data-arg="${d}" aria-pressed="${days.includes(d)}">${d}</button>`,
      ).join("")}</div></div>
      <div class="field"><label>Teacher (optional)</label><input id="cTeacher" value="${esc(c.teacher || "")}"></div>
      <div class="field"><label>Teacher email (optional)</label><input id="cEmail" value="${esc(c.email || "")}" placeholder="teacher@school.org"></div>
      <div class="field"><label>Color</label><input type="color" id="cColor" value="${esc(safeColor(c.color))}" style="height:48px"></div>
      <button class="btn primary block" data-act="save-class" data-id="${esc(c.id || "")}">Save class</button>
      ${c.id ? `<button class="btn danger block" data-act="delete-class" data-id="${c.id}" style="margin-top:8px">Delete class</button>` : ""}`;
  }

  function reminderForm(r) {
    r = r || {};
    const rep = REPEATS.includes(r.repeat) ? r.repeat : "none";
    const opt = (v, label) =>
      `<option value="${v}" ${rep === v ? "selected" : ""}>${label}</option>`;
    return `
      <div class="field"><label>Reminder</label><input id="rmText" value="${esc(r.text || "")}" placeholder="Bring gym clothes"></div>
      <div class="g2 grid">
        <div class="field"><label>Date (optional)</label><input type="date" id="rmDate" value="${esc(r.date || "")}"></div>
        <div class="field"><label>Time (optional)</label><input type="time" id="rmTime" value="${esc(r.time || "")}"></div>
      </div>
      <div class="field"><label>Repeat</label><select id="rmRepeat">${opt("none", "Just once")}${opt("daily", "Every day")}${opt("weekdays", "Weekdays (Mon–Fri)")}${opt("weekly", "Weekly (same weekday)")}</select></div>
      <p class="muted" style="font-size:.8rem;margin:-2px 0 8px">A repeating reminder comes back each day — checking it off just clears it for today.</p>
      <button class="btn primary block" data-act="save-reminder" data-id="${esc(r.id || "")}">${r.id ? "Save changes" : "Add reminder"}</button>`;
  }

  function routineForm(r) {
    r = r || { items: [] };
    return `
      <div class="g2 grid">
        <div class="field"><label>Routine name</label><input id="rName" value="${esc(r.name || "")}" placeholder="Morning Launch"></div>
        <div class="field"><label>Emoji</label><input id="rEmoji" value="${esc(r.emoji || "🔁")}" maxlength="4"></div>
      </div>
      <label style="font-size:.74rem;font-weight:900;color:var(--muted);text-transform:uppercase">Steps</label>
      <ul class="steps" id="rSteps">${(r.items || [])
        .map(
          (it) =>
            `<li data-iid="${esc(it.id)}"><span class="steptext">${esc(it.text)}</span><button class="btn danger sm" data-act="del-ritem" data-id="${r.id || ""}" data-sid="${it.id}" aria-label="Delete step: ${esc(it.text)}">✕</button></li>`,
        )
        .join("")}</ul>
      <div class="row"><input id="newRItem" placeholder="Add a step..." style="flex:1"><button class="btn" data-act="add-ritem" data-id="${r.id || ""}">＋</button></div>
      <button class="btn primary block" data-act="save-routine" data-id="${esc(r.id || "")}" style="margin-top:12px">Save routine</button>
      ${r.id ? `<button class="btn danger block" data-act="delete-routine" data-id="${r.id}" style="margin-top:8px">Delete routine</button>` : ""}`;
  }

  // ---------------------------------------------------------------------------
  // Focus session (timer overlay)
  // ---------------------------------------------------------------------------
  const focus = {
    taskId: null,
    phase: "focus", // focus | break
    total: 0,
    remaining: 0,
    timer: null,
    minutesFocused: 0,
    start(taskId) {
      const a = state.assignments.find((x) => x.id === taskId);
      if (!a) return;
      this.taskId = taskId;
      if (a.status === "todo") {
        a.status = "doing";
        save();
      }
      this._lastFocus = document.activeElement;
      this.beginPhase("focus");
      const ov = $("#focusOverlay");
      ov.classList.add("open");
      this.renderSteps();
      // Move focus into the dialog for keyboard/screen-reader users.
      $("#focusOverlay [data-act='focus-stop']")?.focus();
      try {
        navigator.wakeLock
          ?.request("screen")
          .then((l) => (this._wake = l))
          .catch(() => {});
      } catch {}
    },
    beginPhase(phase) {
      this.phase = phase;
      this.phaseAwarded = false;
      const mins =
        phase === "focus"
          ? state.settings.defaultFocusMin
          : state.settings.breakMin;
      this.total = mins * 60;
      this.remaining = this.total;
      this.tick(true);
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 1000);
    },
    // Award focus minutes at most once per focus phase (guards against double
    // credit from phaseEnd + stop, and prevents farming).
    awardFocus(seconds) {
      const m = Math.round(seconds / 60);
      if (this.phase !== "focus" || this.phaseAwarded || m <= 0) return 0;
      this.phaseAwarded = true;
      bumpActivity("focusMin", m);
      state.points += m;
      save();
      return m;
    },
    tick(first) {
      if (!first) this.remaining--;
      const r = 130,
        circ = 2 * Math.PI * r;
      const frac = this.total ? this.remaining / this.total : 0;
      const mm = String(Math.floor(this.remaining / 60)).padStart(2, "0");
      const ss = String(this.remaining % 60).padStart(2, "0");
      $("#fTime").textContent = `${mm}:${ss}`;
      $("#fPhase").textContent = this.phase === "focus" ? "Focus" : "Break";
      $("#fProg").style.strokeDashoffset = circ * (1 - frac);
      if (this.remaining <= 0) this.phaseEnd();
    },
    phaseEnd() {
      clearInterval(this.timer);
      vibrate();
      if (this.phase === "focus") {
        const earned = this.awardFocus(this.total);
        toast(`Great focus! +${earned} points 🎉`);
        $("#fPhase").textContent = "Break time";
        openModal(
          "Nice work! 🎉",
          `<p>You focused for ${earned} minutes. Take a ${state.settings.breakMin}-minute break, then keep going.</p>
          <div class="row"><button class="btn primary" data-act="focus-break">Start break</button><button class="btn" data-act="focus-again">Keep focusing</button><button class="btn" data-act="focus-stop">I'm done</button></div>`,
        );
      } else {
        toast("Break's over — ready for one more?");
        openModal(
          "Break finished",
          `<div class="row"><button class="btn primary" data-act="focus-again">Focus again</button><button class="btn" data-act="focus-stop">I'm done</button></div>`,
        );
      }
    },
    renderSteps() {
      const a = state.assignments.find((x) => x.id === this.taskId);
      if (!a) return;
      const c = cls(a.classId);
      $("#fTitle").textContent = a.title;
      $("#fClass").textContent =
        c.name + (a.due ? " · " + dueLabel(a.due, a.dueTime) : "");
      $("#fDone").dataset.id = a.id;
      $("#fSteps").innerHTML = a.steps.length
        ? `<ul class="steps">${a.steps.map((s) => `<li><input class="check" type="checkbox" data-check="step" data-id="${a.id}" data-sid="${s.id}" ${s.done ? "checked" : ""} aria-label="${esc(s.text)}"><span class="steptext ${s.done ? "done" : ""}">${esc(s.text)}</span></li>`).join("")}</ul>`
        : `<p style="color:rgba(255,255,255,.7);text-align:center">No steps — just do the first small part.</p>`;
    },
    stop() {
      clearInterval(this.timer);
      // Give partial credit for time already focused if they stop early.
      if (this.phase === "focus") {
        const m = this.awardFocus(this.total - this.remaining);
        if (m > 0) toast(`Nice — ${m} focus min counted`);
      }
      $("#focusOverlay").classList.remove("open");
      if (this._lastFocus) {
        try {
          this._lastFocus.focus();
        } catch {}
        this._lastFocus = null;
      }
      closeModal();
      try {
        this._wake?.release();
      } catch {}
      this.taskId = null;
      render();
    },
  };
  const vibrate = () => {
    try {
      navigator.vibrate?.([120, 60, 120]);
    } catch {}
  };

  // ---------------------------------------------------------------------------
  // Guided routine — walk through steps ONE at a time (morning launch etc.)
  // ---------------------------------------------------------------------------
  function leaveByCountdown() {
    const t = state.settings.leaveByTime;
    if (!TIME_RE.test(t)) return null;
    const [hh, mm] = t.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    const mins = Math.round((target - now) / 60000);
    return { mins, label: t };
  }

  const guide = {
    routineId: null,
    idx: 0,
    timer: null,
    start(routineId) {
      const r = state.routines.find((x) => x.id === routineId);
      if (!r || !r.items.length)
        return toast("Add steps to this routine first.");
      this.routineId = routineId;
      // Resume at the first not-yet-checked step so it picks up where they left off.
      const done = (state.routineLog[todayKey()] || {})[routineId] || [];
      const firstOpen = r.items.findIndex((it) => !done.includes(it.id));
      this.idx = firstOpen < 0 ? r.items.length : firstOpen;
      this._lastFocus = document.activeElement;
      $("#guideOverlay").classList.add("open");
      this.render();
      this.timer = setInterval(() => this.renderCountdown(), 30000);
      try {
        navigator.wakeLock
          ?.request("screen")
          .then((l) => (this._wake = l))
          .catch(() => {});
      } catch {}
      $("#guideOverlay [data-act='guide-stop']")?.focus();
    },
    routine() {
      return state.routines.find((x) => x.id === this.routineId);
    },
    markCurrent() {
      const r = this.routine();
      if (!r) return;
      const it = r.items[this.idx];
      if (!it) return;
      const day = (state.routineLog[todayKey()] =
        state.routineLog[todayKey()] || {});
      const arr = (day[r.id] = day[r.id] || []);
      if (!arr.includes(it.id)) arr.push(it.id);
      // Award +5 once when fully complete, mirroring the checkbox flow.
      const awarded = (day.__awarded = day.__awarded || []);
      if (arr.length === r.items.length && !awarded.includes(r.id)) {
        awarded.push(r.id);
        state.points += 5;
        bumpActivity("routines");
      }
      save();
      this.idx++;
      vibrate();
      this.render();
    },
    back() {
      if (this.idx > 0) this.idx--;
      this.render();
    },
    renderCountdown() {
      const el = $("#gCountdown");
      if (!el) return;
      const lb = leaveByCountdown();
      if (!lb) {
        el.textContent = "";
        return;
      }
      if (lb.mins > 0) {
        el.className = "gcountdown" + (lb.mins <= 5 ? " urgent" : "");
        el.textContent = `🕗 Leave by ${lb.label} — ${lb.mins} min left`;
      } else if (lb.mins === 0) {
        el.className = "gcountdown urgent";
        el.textContent = `🕗 Time to leave!`;
      } else {
        el.className = "gcountdown urgent";
        el.textContent = `🕗 Leave time was ${lb.label}`;
      }
    },
    render() {
      const r = this.routine();
      if (!r) return;
      $("#gTitle").textContent = `${r.emoji || "🔁"} ${r.name}`;
      const total = r.items.length;
      const pct = Math.round((this.idx / total) * 100);
      $("#gBar").style.width = pct + "%";
      this.renderCountdown();
      // Completion state.
      if (this.idx >= total) {
        $("#gSub").textContent = "";
        $("#gCount").textContent = `${total} / ${total}`;
        $("#gBody").innerHTML =
          `<div class="gdone"><div class="gdone-emoji" aria-hidden="true">🎉</div><div class="gbig">All done!</div><p>You finished <b>${esc(r.name)}</b>. Nice — that's one less thing to think about.</p></div>`;
        $("#gActions").innerHTML =
          `<button class="btn go big" data-act="guide-stop">Done</button>`;
        return;
      }
      const it = r.items[this.idx];
      $("#gSub").textContent = `Step ${this.idx + 1} of ${total}`;
      $("#gCount").textContent = `${this.idx} / ${total}`;
      const nextIt = r.items[this.idx + 1];
      $("#gBody").innerHTML = `
        <div class="gstep">
          <div class="gstep-num">${this.idx + 1}</div>
          <div class="gbig">${esc(it.text)}</div>
          ${nextIt ? `<p class="gnext">Next: ${esc(nextIt.text)}</p>` : `<p class="gnext">Last step — almost there!</p>`}
        </div>`;
      $("#gActions").innerHTML = `
        ${this.idx > 0 ? `<button class="btn" data-act="guide-back">← Back</button>` : `<span></span>`}
        <button class="btn go big" data-act="guide-next">✓ Done — next</button>`;
    },
    stop() {
      clearInterval(this.timer);
      $("#guideOverlay").classList.remove("open");
      try {
        this._wake?.release();
      } catch {}
      if (this._lastFocus) {
        try {
          this._lastFocus.focus();
        } catch {}
        this._lastFocus = null;
      }
      this.routineId = null;
      render();
    },
  };

  // ---------------------------------------------------------------------------
  // Notifications / reminders
  // ---------------------------------------------------------------------------
  const notifSupport = () => "Notification" in window;
  const notified = new Set();
  async function enableNotifications() {
    if (!notifSupport()) return false;
    const p = await Notification.requestPermission();
    return p === "granted";
  }
  // Show a notification through the service worker when possible (required for
  // notifications to appear reliably in an installed PWA), else fall back to the
  // page Notification constructor.
  async function showNotif(title, opts) {
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg && reg.showNotification) return reg.showNotification(title, opts);
    } catch {}
    try {
      new Notification(title, opts);
    } catch {}
  }
  // Plain-language summary of what matters today — used for the open-app briefing
  // and the morning notification.
  function briefingText() {
    const open = openTasks();
    const overdue = open.filter((a) => daysUntil(a.due) < 0).length;
    const today = open.filter((a) => daysUntil(a.due) === 0).length;
    if (overdue)
      return `${overdue} thing${overdue === 1 ? "" : "s"} to catch up on, ${today} due today.`;
    if (today)
      return `${today} thing${today === 1 ? "" : "s"} due today. You've got this.`;
    return "Nothing due today — you're caught up! 🎉";
  }
  // One quiet briefing per app-open per day, surfaced as a toast.
  let briefedToday = false;
  function dailyBriefing() {
    if (briefedToday) return;
    briefedToday = true;
    const t = rightNowTask();
    setTimeout(
      () => toast(t ? `${briefingText()} First: ${t.title}` : briefingText()),
      900,
    );
  }
  function checkReminders() {
    if (
      !state.settings.notifications ||
      !notifSupport() ||
      Notification.permission !== "granted"
    )
      return;
    const now = new Date();
    // Morning briefing notification — fires once per day within ~30 min of the
    // chosen time, but only if the app happens to be open then. (True scheduled
    // background notifications aren't available offline without a push server.)
    const mb = state.settings.morningBriefingTime;
    if (TIME_RE.test(mb)) {
      const [hh, mm] = mb.split(":").map(Number);
      const target = hh * 60 + mm;
      const cur = now.getHours() * 60 + now.getMinutes();
      const key = "briefing:" + todayKey();
      if (cur >= target && cur <= target + 30 && !notified.has(key)) {
        notified.add(key);
        showNotif("Good morning ☀️", {
          body: briefingText(),
          tag: key,
          icon: "icons/icon-192.png",
        });
      }
    }
    openTasks().forEach((a) => {
      const n = daysUntil(a.due);
      let key = null,
        msg = null;
      if (n === 0 && a.dueTime) {
        const [hh, mm] = a.dueTime.split(":").map(Number);
        const mins = hh * 60 + mm - (now.getHours() * 60 + now.getMinutes());
        if (mins > 0 && mins <= 60) {
          key = a.id + ":soon";
          msg = `"${a.title}" is due in ${mins} min`;
        }
      } else if (n === 0) {
        key = a.id + ":today";
        msg = `"${a.title}" is due today`;
      } else if (n < 0) {
        key = a.id + ":late";
        msg = `"${a.title}" is overdue`;
      }
      if (key && msg && !notified.has(key)) {
        notified.add(key);
        showNotif("Noam School", {
          body: msg,
          tag: key,
          icon: "icons/icon-192.png",
        });
      }
    });
    // Reminders: fire any of today's timed reminders whose moment has passed and
    // weren't shown yet today (covers app-open-after-the-time + the 60s loop).
    dueRemindersForToday().forEach((r) => {
      if (!r.time) return; // untimed reminders just live in the list
      const [hh, mm] = r.time.split(":").map(Number);
      const cur = now.getHours() * 60 + now.getMinutes();
      if (hh * 60 + mm <= cur) fireReminder(r);
    });
  }

  // Reminders that are scheduled for today (one-time dated today, or recurring
  // whose schedule includes today) and aren't already done-for-today.
  function dueRemindersForToday() {
    const t = todayKey();
    return state.reminders.filter((r) => {
      if (reminderDoneToday(r)) return false;
      if (isRecurring(r)) return recurOccursOn(r, t);
      return r.date === t;
    });
  }

  // Show a reminder notification at most once per day (guarded by lastShown).
  function fireReminder(r) {
    if (
      !state.settings.notifications ||
      !notifSupport() ||
      Notification.permission !== "granted"
    )
      return;
    if (r.lastShown === todayKey()) return;
    r.lastShown = todayKey();
    save({ touch: false });
    showNotif("🔔 Reminder", {
      body: r.text,
      tag: "reminder:" + r.id + ":" + todayKey(),
      icon: "icons/icon-192.png",
    });
  }

  // setTimeout-based scheduler for today's still-upcoming reminder times. This
  // fires precisely while the app/SW is alive. NOTE: true *background* push when
  // the app is fully closed needs a push server and is out of scope here.
  let reminderTimers = [];
  function scheduleReminders() {
    reminderTimers.forEach((id) => clearTimeout(id));
    reminderTimers = [];
    if (
      !state.settings.notifications ||
      !notifSupport() ||
      Notification.permission !== "granted"
    )
      return;
    const now = new Date();
    const cur =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    dueRemindersForToday().forEach((r) => {
      if (!r.time || r.lastShown === todayKey()) return;
      const [hh, mm] = r.time.split(":").map(Number);
      const at = hh * 3600 + mm * 60;
      if (at <= cur) return; // already passed — checkReminders handles it
      const ms = (at - cur) * 1000;
      // setTimeout caps near 24.8 days; our window is < 24h so this is safe.
      reminderTimers.push(setTimeout(() => fireReminder(r), ms));
    });
  }

  // ---------------------------------------------------------------------------
  // Sync: file export/import + optional cloud (Cloudflare KV via /api/state)
  // ---------------------------------------------------------------------------
  function exportBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          { app: "noam-school", exportedAt: new Date().toISOString(), state },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noam-school-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Backup downloaded 💾");
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const incoming = data.state || data;
        openModal(
          "Load this backup?",
          `<p>This will replace everything currently in the app with the data from <b>${esc(file.name)}</b>.</p>
          <div class="row"><button class="btn danger" data-act="confirm-import">Yes, replace my data</button><button class="btn" data-act="close-modal">Cancel</button></div>`,
        );
        importBackup._pending = incoming;
      } catch {
        toast("That file couldn't be read.");
      }
    };
    reader.readAsText(file);
  }

  const cloud = {
    available() {
      return location.protocol.startsWith("http"); // endpoint reachable on hosted site
    },
    base: "/api/state",
    _busy: false,
    async push() {
      const code = state.settings.sync.code;
      if (!code || !this.available() || this._busy) return;
      this._busy = true;
      try {
        await fetch(`${this.base}?code=${encodeURIComponent(code)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updatedAt: state.updatedAt, state }),
        });
        state.settings.sync.lastAt = new Date().toISOString();
      } catch {
        /* offline or no backend — fine, local data is the source of truth */
      } finally {
        this._busy = false;
      }
    },
    async pull() {
      const code = state.settings.sync.code;
      if (!code || !this.available()) return false;
      try {
        const res = await fetch(
          `${this.base}?code=${encodeURIComponent(code)}`,
        );
        if (!res.ok) return false;
        const data = await res.json();
        if (
          data &&
          data.state &&
          (data.updatedAt || 0) > (state.updatedAt || 0)
        ) {
          state = normalize(data.state);
          await save({ touch: false, immediate: true });
          return true;
        }
      } catch {}
      return false;
    },
  };

  // ---------------------------------------------------------------------------
  // Google Calendar (client-side, read-only, no backend)
  // ---------------------------------------------------------------------------
  // Uses Google Identity Services (GIS) token client to get a short-lived access
  // token IN MEMORY (never persisted), then reads upcoming primary-calendar
  // events via the Calendar REST API. The only thing stored is the Web Client ID.
  const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
  const GIS_SRC = "https://accounts.google.com/gsi/client";
  const gcal = {
    token: "", // access token — memory only
    tokenClient: null,
    connected: false,
    _gisLoaded: false,
    clientId() {
      return state.settings.googleClientId.trim();
    },
    // Dynamically load the GIS script once (only external dependency allowed).
    loadGis() {
      if (this._gisLoaded && window.google?.accounts?.oauth2)
        return Promise.resolve(true);
      return new Promise((resolve) => {
        if (window.google?.accounts?.oauth2) {
          this._gisLoaded = true;
          return resolve(true);
        }
        const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
        if (existing) {
          existing.addEventListener("load", () => resolve(true));
          existing.addEventListener("error", () => resolve(false));
          return;
        }
        const s = document.createElement("script");
        s.src = GIS_SRC;
        s.async = true;
        s.defer = true;
        s.onload = () => {
          this._gisLoaded = true;
          resolve(true);
        };
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
    },
    async connect() {
      const cid = this.clientId();
      if (!cid) {
        toast("Add your Google Client ID in Settings first.");
        setView("settings");
        return;
      }
      if (!navigator.onLine) return toast("Connect to the internet to sync.");
      const ok = await this.loadGis();
      if (!ok || !window.google?.accounts?.oauth2)
        return toast("Couldn't load Google sign-in. Try again online.");
      toast("Opening Google sign-in…");
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: cid,
        scope: GCAL_SCOPE,
        callback: (resp) => {
          if (resp && resp.access_token) {
            this.token = resp.access_token;
            this.connected = true;
            this.fetchEvents();
          } else {
            toast("Google sign-in was cancelled.");
          }
        },
        error_callback: () =>
          toast("Google sign-in failed. Check your Client ID."),
      });
      // Empty prompt = use existing consent when possible; shows picker otherwise.
      this.tokenClient.requestAccessToken({ prompt: "" });
    },
    async fetchEvents() {
      if (!this.token) return this.connect();
      try {
        const timeMin = new Date().toISOString();
        const url =
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
          new URLSearchParams({
            timeMin,
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "50",
          });
        const res = await fetch(url, {
          headers: { Authorization: "Bearer " + this.token },
        });
        if (!res.ok) {
          if (res.status === 401) {
            this.token = "";
            this.connected = false;
          }
          toast("Couldn't load Google events.");
          return;
        }
        const data = await res.json();
        const events = (data.items || [])
          .map((e) => ({
            id: e.id,
            title: e.summary || "(no title)",
            // All-day events use .date (YYYY-MM-DD); timed use .dateTime.
            start: e.start?.dateTime || e.start?.date || "",
            allDay: !e.start?.dateTime,
            location: e.location || "",
            htmlLink: e.htmlLink || "",
          }))
          .filter((e) => e.start);
        state.gcal = { events, fetchedAt: new Date().toISOString() };
        save();
        render();
        toast(`Google Calendar synced (${events.length}) 📅`);
      } catch {
        toast("Couldn't reach Google Calendar.");
      }
    },
    disconnect() {
      try {
        if (this.token && window.google?.accounts?.oauth2)
          google.accounts.oauth2.revoke(this.token, () => {});
      } catch {}
      this.token = "";
      this.connected = false;
      state.gcal = { events: [], fetchedAt: "" };
      save();
      render();
      toast("Disconnected from Google Calendar.");
    },
  };

  // Parse a Google event's start into a local ISO date key (YYYY-MM-DD).
  const gcalDayKey = (e) => {
    if (!e.start) return "";
    if (e.allDay) return e.start.slice(0, 10);
    const d = new Date(e.start);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const gcalTimeLabel = (e) => {
    if (e.allDay) return "All day";
    const d = new Date(e.start);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };
  const gcalEventsForDay = (iso) =>
    (state.gcal?.events || [])
      .filter((e) => gcalDayKey(e) === iso)
      .sort((a, b) => (a.start < b.start ? -1 : 1));
  const gcalToday = () => gcalEventsForDay(todayKey());
  // A compact, read-only Google event row, clearly marked as Google.
  const gcalRow = (e) =>
    `<div class="item gcal-item"><div class="head"><div><h4><span class="gcal-badge" title="From Google Calendar">G</span>${esc(e.title)}</h4><p class="meta">📅 ${esc(gcalTimeLabel(e))}${e.location ? " · " + esc(e.location) : ""} · <span class="muted">Google · read-only</span></p></div>${e.htmlLink ? `<div class="row"><a class="btn sm" href="${esc(e.htmlLink)}" target="_blank" rel="noopener">Open</a></div>` : ""}</div></div>`;

  // Google Calendar connect/refresh/disconnect panel (calendar view + settings).
  function gcalPanel() {
    const hasId = !!state.settings.googleClientId.trim();
    const count = (state.gcal?.events || []).length;
    const fetched = state.gcal?.fetchedAt
      ? new Date(state.gcal.fetchedAt).toLocaleString()
      : "";
    if (!hasId) {
      return card(
        "gcal",
        "📅 Google Calendar",
        "Read-only — show your Google events here.",
        `<p class="sub" style="margin-top:0">To connect, add a Google OAuth <b>Web Client ID</b> in Settings → Google Calendar. It's a one-time setup.</p>
         <button class="btn primary" data-act="view-settings">Set it up in Settings</button>`,
      );
    }
    const status = count
      ? `<span class="pill green">● Connected · ${count} events</span>`
      : `<span class="pill">Not loaded yet</span>`;
    return `<section class="card" data-card="gcal"><div class="head"><div><h3>📅 Google Calendar</h3><p class="sub">Read-only — your Google events, shown alongside school work.</p></div>${status}</div>
      <div class="row">
        <button class="btn ${count ? "" : "primary"}" data-act="gcal-connect">${count ? "🔄 Reconnect" : "Connect Google Calendar"}</button>
        ${count ? `<button class="btn navy" data-act="gcal-refresh">🔄 Refresh</button><button class="btn danger" data-act="gcal-disconnect">Disconnect</button>` : ""}
      </div>
      ${fetched ? `<p class="muted" style="font-size:.8rem;margin-top:8px">Last synced: ${esc(fetched)}. Events are cached so they show even offline.</p>` : ""}
      ${count ? `<div class="section-title" style="margin-top:12px">Upcoming Google events</div>${(state.gcal.events || []).slice(0, 12).map(gcalRow).join("")}` : ""}
    </section>`;
  }

  // ---------------------------------------------------------------------------
  // Gmail (client-side, read-only, no backend)
  // ---------------------------------------------------------------------------
  // Same pattern as Google Calendar: GIS token client gives a short-lived access
  // token IN MEMORY (never persisted), then reads recent messages via the Gmail
  // REST API. Reuses the SAME Web Client ID; requests a SEPARATE token with the
  // gmail.readonly scope. Read-only — the mailbox is never modified.
  const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
  const gmail = {
    token: "", // access token — memory only
    tokenClient: null,
    connected: false,
    clientId() {
      return state.settings.googleClientId.trim();
    },
    async connect() {
      const cid = this.clientId();
      if (!cid) {
        toast("Add your Google Client ID in Settings first.");
        setView("settings");
        return;
      }
      if (!navigator.onLine) return toast("Connect to the internet to sync.");
      // gcal owns the GIS loader; reuse it so the script loads only once.
      const ok = await gcal.loadGis();
      if (!ok || !window.google?.accounts?.oauth2)
        return toast("Couldn't load Google sign-in. Try again online.");
      toast("Opening Google sign-in…");
      // Distinct token client call for the gmail.readonly scope.
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: cid,
        scope: GMAIL_SCOPE,
        callback: (resp) => {
          if (resp && resp.access_token) {
            this.token = resp.access_token;
            this.connected = true;
            this.fetchMessages();
          } else {
            toast("Google sign-in was cancelled.");
          }
        },
        error_callback: () =>
          toast("Google sign-in failed. Check your Client ID."),
      });
      this.tokenClient.requestAccessToken({ prompt: "" });
    },
    async fetchMessages() {
      if (!this.token) return this.connect();
      try {
        const listUrl =
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?" +
          new URLSearchParams({ q: "newer_than:7d", maxResults: "20" });
        const res = await fetch(listUrl, {
          headers: { Authorization: "Bearer " + this.token },
        });
        if (!res.ok) {
          if (res.status === 401) {
            this.token = "";
            this.connected = false;
          }
          toast("Couldn't load Gmail.");
          return;
        }
        const data = await res.json();
        const ids = (data.messages || []).map((m) => m.id).filter(Boolean);
        // Fetch metadata (From/Subject/Date) + snippet for each message.
        const metaUrl = (id) =>
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?` +
          new URLSearchParams([
            ["format", "metadata"],
            ["metadataHeaders", "From"],
            ["metadataHeaders", "Subject"],
            ["metadataHeaders", "Date"],
          ]);
        const details = await Promise.all(
          ids.map((id) =>
            fetch(metaUrl(id), {
              headers: { Authorization: "Bearer " + this.token },
            })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ),
        );
        const header = (msg, name) =>
          (msg.payload?.headers || []).find(
            (h) => (h.name || "").toLowerCase() === name,
          )?.value || "";
        const messages = details
          .filter(Boolean)
          .map((m) => {
            const rawFrom = header(m, "from");
            // "Name <addr>" → prefer the display name, fall back to address.
            const from =
              (rawFrom.match(/^\s*"?([^"<]*?)"?\s*</)?.[1] || "").trim() ||
              rawFrom ||
              "(unknown sender)";
            const dateMs =
              Number(m.internalDate) || Date.parse(header(m, "date")) || 0;
            return {
              id: m.id,
              from,
              subject: header(m, "subject") || "(no subject)",
              date: dateMs ? new Date(dateMs).toISOString() : "",
              snippet: decodeHtmlEntities(m.snippet || ""),
              unread: Array.isArray(m.labelIds)
                ? m.labelIds.includes("UNREAD")
                : false,
            };
          })
          .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
        state.gmail = { messages, fetchedAt: new Date().toISOString() };
        save();
        render();
        toast(`School Mail synced (${messages.length}) ✉️`);
      } catch {
        toast("Couldn't reach Gmail.");
      }
    },
    disconnect() {
      try {
        if (this.token && window.google?.accounts?.oauth2)
          google.accounts.oauth2.revoke(this.token, () => {});
      } catch {}
      this.token = "";
      this.connected = false;
      state.gmail = { messages: [], fetchedAt: "" };
      save();
      render();
      toast("Disconnected from School Mail.");
    },
  };

  // Gmail snippets come back HTML-entity encoded (&amp; &#39; …). Decode safely.
  function decodeHtmlEntities(s) {
    if (!s) return "";
    const t = document.createElement("textarea");
    t.innerHTML = s;
    return t.value;
  }
  // Friendly relative date label for a message ISO timestamp.
  const gmailDateLabel = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) {
      return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  // A read-only Gmail message row with "make a task / reminder" actions.
  const gmailRow = (m) =>
    `<div class="item gmail-item${m.unread ? " gmail-unread" : ""}"><div class="head"><div style="min-width:0"><h4><span class="gcal-badge gmail-badge" title="From Gmail">✉</span>${esc(m.subject)}</h4><p class="meta">${esc(m.from)} · <span class="muted">${esc(gmailDateLabel(m.date))} · Gmail · read-only</span></p>${m.snippet ? `<p class="sub" style="margin:4px 0 0">${esc(m.snippet)}</p>` : ""}</div></div>
      <div class="row"><button class="btn sm" data-act="gmail-make-task" data-id="${esc(m.id)}">➕ Make a task</button><button class="btn sm" data-act="gmail-make-reminder" data-id="${esc(m.id)}">⏰ Make a reminder</button></div></div>`;

  // Gmail connect/refresh/disconnect panel + message list (School Mail view).
  function gmailPanel() {
    const hasId = !!state.settings.googleClientId.trim();
    const count = (state.gmail?.messages || []).length;
    const fetched = state.gmail?.fetchedAt
      ? new Date(state.gmail.fetchedAt).toLocaleString()
      : "";
    if (!hasId) {
      return card(
        "gmail",
        "✉️ School Mail",
        "Read-only — see your recent Gmail here.",
        `<p class="sub" style="margin-top:0">To connect, add a Google OAuth <b>Web Client ID</b> in Settings → Google Calendar (the same one School Mail uses). It's a one-time setup.</p>
         <button class="btn primary" data-act="view-settings">Set it up in Settings</button>`,
      );
    }
    const status = count
      ? `<span class="pill green">● Connected · ${count} messages</span>`
      : `<span class="pill">Not loaded yet</span>`;
    return `<section class="card" data-card="gmail"><div class="head"><div><h3>✉️ School Mail</h3><p class="sub">Read-only — your recent Gmail (last 7 days). The mailbox is never changed.</p></div>${status}</div>
      <div class="row">
        <button class="btn ${count ? "" : "primary"}" data-act="gmail-connect">${count ? "🔄 Reconnect" : "Connect Gmail"}</button>
        ${count ? `<button class="btn navy" data-act="gmail-refresh">🔄 Refresh</button><button class="btn danger" data-act="gmail-disconnect">Disconnect</button>` : ""}
      </div>
      ${fetched ? `<p class="muted" style="font-size:.8rem;margin-top:8px">Last synced: ${esc(fetched)}. Messages are cached so they show even offline.</p>` : ""}
      ${count ? `<div class="section-title" style="margin-top:12px">Recent mail (newest first)</div>${(state.gmail.messages || []).map(gmailRow).join("")}` : `<p class="muted" style="margin-top:10px">No messages loaded yet. Tap <b>Connect Gmail</b> to load the last 7 days.</p>`}
    </section>`;
  }

  // ---------------------------------------------------------------------------
  // Install prompt (Add to desktop)
  // ---------------------------------------------------------------------------
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $("#installBtn").hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    $("#installBtn").hidden = true;
    toast("Installed! Find it with your other apps. 🎉");
  });
  async function doInstall() {
    if (!deferredPrompt) {
      openModal(
        "Install this app",
        `<p>To use Noam School like a desktop app that works offline:</p>
        <ul style="line-height:1.7;padding-left:18px">
          <li><b>Chrome / Edge:</b> click the install icon (⊕ or a small screen) in the address bar.</li>
          <li><b>Safari (Mac):</b> File → Add to Dock.</li>
          <li><b>iPhone / iPad:</b> Share → Add to Home Screen.</li>
        </ul>`,
      );
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("#installBtn").hidden = true;
  }

  // ---------------------------------------------------------------------------
  // Classroom paste parser
  // ---------------------------------------------------------------------------
  function parseDue(line) {
    const t = line
      .replace(/^due[:\s]*/i, "")
      .toLowerCase()
      .trim();
    if (t.includes("tomorrow")) return isoForOffset(1);
    if (t.includes("today")) return isoForOffset(0);
    const m = t.match(
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})/i,
    );
    if (m) {
      const y = new Date().getFullYear();
      const d = new Date(`${m[1]} ${m[2]}, ${y} 12:00:00`);
      if (!isNaN(d)) {
        if (daysUntil(d.toISOString().slice(0, 10)) < -30) d.setFullYear(y + 1); // assume next year if long past
        return d.toISOString().slice(0, 10);
      }
    }
    return "";
  }
  function parsePaste(text) {
    const lines = text
      .split(/\n+/)
      .map((x) => x.trim())
      .filter(Boolean);
    let cur = state.classes[0]?.id || "";
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i],
        low = l.toLowerCase();
      const hit = state.classes.find(
        (c) =>
          low === c.name.toLowerCase() ||
          (c.name && low.includes(c.name.toLowerCase())),
      );
      if (hit && l.length < 55) {
        cur = hit.id;
        continue;
      }
      if (/^due\b/i.test(l) && out.length) {
        out[out.length - 1].due = parseDue(l);
        continue;
      }
      if (
        /^(assigned|missing|done|to-?do|turned in|graded|no due date)$/i.test(l)
      )
        continue;
      out.push(
        normalizeTask({
          title: l.replace(/^[-•*]\s*/, ""),
          classId: cur,
          due: /^due\b/i.test(lines[i + 1] || "") ? parseDue(lines[i + 1]) : "",
          priority: /missing|late/i.test(text) ? "high" : "med",
          notes: "Added from Google Classroom paste.",
          source: "Classroom Paste",
        }),
      );
    }
    return out
      .filter((a) => a.title.length > 2 && !/^due\b/i.test(a.title))
      .slice(0, 40);
  }
  let parsedCache = [];

  // ---------------------------------------------------------------------------
  // Actions (delegated)
  // ---------------------------------------------------------------------------
  function completeTask(id) {
    const a = state.assignments.find((x) => x.id === id);
    if (!a || a.status === "done") return;
    a.status = "done";
    a.completedAt = new Date().toISOString();
    state.points += 10;
    bumpActivity("tasks");
    state.wins.push({
      text: "Finished: " + a.title,
      date: new Date().toLocaleString(),
    });
    save();
    toast("Done! +10 points 🎉");
    if (focus.taskId === id) focus.stop();
    else render();
  }

  const ACTIONS = {
    nav: (_, arg) => setView(arg),
    "view-classes": () => setView("classes"),
    "view-reminders": () => setView("reminders"),
    "view-mail": () => setView("mail"),
    "view-email": () => setView("email"),
    "view-import": () => setView("import"),
    "view-wins": () => setView("wins"),
    "view-settings": () => setView("settings"),
    "view-sync": () => setView("sync"),
    "view-about": () => setView("about"),

    "quick-add": () => {
      quickAddForm._due = "";
      openModal("Quick add", quickAddForm());
    },
    "qa-due": (_, arg, ev) => {
      // Toggle which quick-pick is active and show/hide the date input.
      quickAddForm._due = arg === "custom" ? "custom" : arg;
      $$("#qaDueSeg [data-act='qa-due']").forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.arg === arg),
      );
      const dateInp = $("#qaDate");
      if (dateInp) dateInp.style.display = arg === "custom" ? "" : "none";
      if (arg === "custom") dateInp?.focus();
    },
    "save-quickadd": () => {
      const title = $("#qaTitle").value.trim();
      if (!title) return toast("Type what it is first.");
      let due = quickAddForm._due || "";
      if (due === "custom") due = $("#qaDate").value || "";
      const obj = normalizeTask({
        title,
        classId: $("#qaClass").value,
        due,
        source: "Quick add",
      });
      state.assignments.push(obj);
      save();
      closeModal();
      render();
      toast("Added 📝 — it's on your list");
    },
    "open-task": (id) =>
      openModal(
        id ? "Edit assignment" : "Add assignment",
        taskForm(id ? state.assignments.find((a) => a.id === id) : null),
      ),
    "save-task": (id) => {
      const obj = id
        ? state.assignments.find((a) => a.id === id)
        : normalizeTask({ source: "Manual" });
      obj.title = $("#tTitle").value.trim() || "Assignment";
      obj.classId = $("#tClass").value;
      obj.priority = $("#tPri").value;
      obj.due = $("#tDue").value;
      obj.dueTime = $("#tTime").value;
      obj.estimateMin = Number($("#tEst").value) || 0;
      obj.notes = $("#tNotes").value;
      if (!id) state.assignments.push(obj);
      save();
      closeModal();
      render();
      toast(id ? "Saved" : "Assignment added");
    },
    "capture-add": () => {
      state.captureLog[todayKey()] = true;
      save();
      quickAddForm._due = isoForOffset(0);
      openModal("Quick add", quickAddForm());
    },
    "capture-done": () => {
      state.captureLog[todayKey()] = true;
      save();
      render();
      toast("Nice — nothing slips through 👍");
    },
    complete: (id) => completeTask(id),
    reopen: (id) => {
      const a = state.assignments.find((x) => x.id === id);
      if (a) {
        a.status = "todo";
        a.completedAt = "";
        save();
        render();
      }
    },
    "delete-task": (id) => {
      openModal(
        "Delete this assignment?",
        `<div class="row"><button class="btn danger" data-act="confirm-delete-task" data-id="${id}">Delete</button><button class="btn" data-act="close-modal">Keep it</button></div>`,
      );
    },
    "confirm-delete-task": (id) => {
      state.assignments = state.assignments.filter((a) => a.id !== id);
      save();
      closeModal();
      render();
      toast("Deleted");
    },

    breakdown: (id) =>
      openModal(
        "Break it into steps",
        breakdownForm(state.assignments.find((a) => a.id === id)),
      ),
    "apply-template": (id, arg) => {
      const a = state.assignments.find((x) => x.id === id);
      if (!a) return;
      a.steps = (STEP_TEMPLATES[arg] || []).map((t) => ({
        id: uid("s"),
        text: t,
        done: false,
      }));
      save();
      openModal("Break it into steps", breakdownForm(a));
    },
    "add-step": (id) => {
      const a = state.assignments.find((x) => x.id === id);
      const v = $("#newStep").value.trim();
      if (a && v) {
        a.steps.push({ id: uid("s"), text: v, done: false });
        save();
        openModal("Break it into steps", breakdownForm(a));
      }
    },
    "del-step": (id, arg, ev, sid) => {
      const a = state.assignments.find((x) => x.id === id);
      if (a) {
        a.steps = a.steps.filter((s) => s.id !== sid);
        save();
        openModal("Break it into steps", breakdownForm(a));
      }
    },

    "focus-start": (id) => focus.start(id),
    "focus-break": () => {
      closeModal();
      focus.beginPhase("break");
    },
    "focus-again": () => {
      closeModal();
      focus.beginPhase("focus");
    },
    "focus-stop": () => focus.stop(),

    "guide-start": (id) => guide.start(id),
    "guide-next": () => guide.markCurrent(),
    "guide-back": () => guide.back(),
    "guide-stop": () => guide.stop(),

    "add-class": () => openModal("Add a class", classForm()),
    "edit-class": (id) =>
      openModal(
        "Edit class",
        classForm(state.classes.find((c) => c.id === id)),
      ),
    "toggle-class-day": (_, arg, ev) => {
      // Toggle aria-pressed in place; the day set is read back on save.
      const b = ev.target.closest("[data-act='toggle-class-day']");
      if (b)
        b.setAttribute(
          "aria-pressed",
          b.getAttribute("aria-pressed") !== "true",
        );
    },
    "save-class": (id) => {
      const meetDays = $$("#cDays [data-act='toggle-class-day']")
        .filter((b) => b.getAttribute("aria-pressed") === "true")
        .map((b) => b.dataset.arg);
      const c = normalizeClass({
        id: id || uid("c"),
        name: $("#cName").value.trim() || "Class",
        subject: $("#cSubject").value.trim(),
        room: $("#cRoom").value.trim(),
        period: $("#cPeriod").value.trim(),
        meetTime: $("#cMeetTime").value.trim(),
        meetDays,
        teacher: $("#cTeacher").value.trim(),
        email: $("#cEmail").value.trim(),
        color: $("#cColor").value,
      });
      if (id) {
        const i = state.classes.findIndex((x) => x.id === id);
        if (i >= 0) state.classes[i] = c;
      } else state.classes.push(c);
      save();
      closeModal();
      render();
      toast(id ? "Class saved" : "Class added");
    },
    "delete-class": (id) => {
      openModal(
        "Delete this class?",
        `<p class="sub">Assignments in this class will keep their work but lose the class color and name.</p><div class="row"><button class="btn danger" data-act="confirm-delete-class" data-id="${id}">Delete</button><button class="btn" data-act="close-modal">Keep it</button></div>`,
      );
    },
    "confirm-delete-class": (id) => {
      state.classes = state.classes.filter((c) => c.id !== id);
      state.assignments.forEach((a) => {
        if (a.classId === id) a.classId = "";
      });
      save();
      closeModal();
      render();
      toast("Class deleted");
    },

    "add-reminder": () => openModal("Add a reminder", reminderForm()),
    "edit-reminder": (id) =>
      openModal(
        "Edit reminder",
        reminderForm(state.reminders.find((r) => r.id === id)),
      ),
    "save-reminder": (id) => {
      const text = $("#rmText").value.trim();
      if (!text) return toast("Type the reminder first.");
      const prev = id ? state.reminders.find((x) => x.id === id) : null;
      const r = normalizeReminder({
        id: id || uid("rm"),
        text,
        date: $("#rmDate").value,
        time: $("#rmTime").value,
        repeat: $("#rmRepeat")?.value || "none",
        done: id ? !!prev?.done : false,
        // Preserve bookkeeping so an edit doesn't re-fire today's notification.
        lastShown: prev?.lastShown || "",
        lastDone: prev?.lastDone || "",
        createdAt: id ? prev?.createdAt : Date.now(),
      });
      if (id) {
        const i = state.reminders.findIndex((x) => x.id === id);
        if (i >= 0) state.reminders[i] = r;
      } else state.reminders.push(r);
      save();
      closeModal();
      render();
      toast(id ? "Reminder saved" : "Reminder added 🔔");
    },
    "quick-reminder": () => {
      const inp = $("#reminderInput");
      const v = (inp?.value || "").trim();
      if (!v) return;
      state.reminders.push(normalizeReminder({ text: v }));
      save();
      render();
      const again = $("#reminderInput");
      if (again) again.focus();
      toast("Reminder added 🔔");
    },
    "del-reminder": (id) => {
      state.reminders = state.reminders.filter((r) => r.id !== id);
      save();
      render();
    },
    "clear-done-reminders": () => {
      state.reminders = state.reminders.filter((r) => !r.done);
      save();
      render();
    },
    // Mark a reminder done (recurring = done-for-today). Used by the glance strip.
    "reminder-done": (id) => {
      const r = state.reminders.find((x) => x.id === id);
      if (!r) return;
      if (isRecurring(r)) r.lastDone = todayKey();
      else r.done = true;
      save();
      render();
      toast("Got it ✓");
    },
    // Snooze: bump the reminder's time so it nudges again later today.
    "snooze-reminder": (id, arg) => {
      const r = state.reminders.find((x) => x.id === id);
      if (!r) return;
      const now = new Date();
      let target;
      if (arg === "tonight") {
        target = new Date();
        target.setHours(19, 0, 0, 0);
        if (target <= now) target = new Date(now.getTime() + 10 * 60000);
      } else {
        target = new Date(now.getTime() + 10 * 60000); // +10 min
      }
      r.date = todayKey();
      r.time = `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;
      r.lastShown = ""; // allow it to fire again at the new time
      if (isRecurring(r)) r.lastDone = "";
      else r.done = false;
      save();
      render();
      toast(
        arg === "tonight" ? "Snoozed till tonight 🌙" : "Snoozed 10 min ⏰",
      );
    },

    // ---- Daily check-in ----
    "checkin-open": () => openModal("Morning check-in", checkinForm()),
    "checkin-mood": (_, arg, ev) => {
      $$("#ciMood [data-act='checkin-mood']").forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.arg === arg),
      );
    },
    "save-checkin": () => {
      const mood =
        $$("#ciMood [data-act='checkin-mood']").find(
          (b) => b.getAttribute("aria-pressed") === "true",
        )?.dataset.arg || "";
      const priority = ($("#ciPriority")?.value || "").trim();
      state.checkins[todayKey()] = { mood, priority };
      // If they named a priority, mirror it into the daily goal so "Right now"
      // and the Today view reflect it too (only if no goal set yet today).
      if (priority && state.daily.goalDate !== todayKey()) {
        state.daily.goal = priority;
        state.daily.goalDate = todayKey();
      }
      save();
      closeModal();
      render();
      toast("Check-in saved 👋");
    },

    "add-routine": () => openModal("New routine", routineForm()),
    "edit-routine": (id) =>
      openModal(
        "Edit routine",
        routineForm(state.routines.find((r) => r.id === id)),
      ),
    "save-routine": (id) => {
      const existing = id ? state.routines.find((r) => r.id === id) : null;
      // Read the stable per-item id off each <li data-iid> so reordering or
      // deleting middle steps never remaps ids (which would desync routineLog).
      const items = $$("#rSteps li").map((li) => ({
        id: li.dataset.iid || uid("i"),
        text: li.querySelector(".steptext")?.textContent || "",
      }));
      const r = existing || { id: uid("r"), items: [] };
      r.name = $("#rName").value.trim() || "Routine";
      r.emoji = $("#rEmoji").value.trim() || "🔁";
      r.items = items.length ? items : r.items;
      if (!existing) state.routines.push(r);
      save();
      closeModal();
      render();
    },
    "add-ritem": (id) => {
      const v = $("#newRItem").value.trim();
      if (!v) return;
      const ul = $("#rSteps");
      const li = document.createElement("li");
      li.dataset.iid = uid("i");
      li.innerHTML = `<span class="steptext"></span>`;
      li.querySelector(".steptext").textContent = v; // textContent avoids injection
      ul.appendChild(li);
      $("#newRItem").value = "";
      $("#newRItem").focus();
    },
    "del-ritem": (id, arg, ev) => {
      ev.target.closest("li").remove();
    },
    "delete-routine": (id) => {
      state.routines = state.routines.filter((r) => r.id !== id);
      save();
      closeModal();
      render();
    },
    "reset-routine": (id) => {
      if (state.routineLog[todayKey()]) delete state.routineLog[todayKey()][id];
      save();
      render();
    },

    "save-goal": () => {
      state.daily.goal = $("#goalInput").value.trim();
      state.daily.goalDate = todayKey();
      save();
      toast("Goal saved 🌟");
    },

    // ---- Calendar ----
    "cal-pick": (_, arg) => {
      calSelected = calSelected === arg ? "" : arg;
      render();
    },
    "cal-prev": () => {
      calMonthOffset--;
      render();
    },
    "cal-next": () => {
      calMonthOffset++;
      render();
    },

    // ---- To-dos ----
    "add-todo": () => {
      const inp = $("#todoInput");
      const v = (inp?.value || "").trim();
      if (!v) return;
      state.todos.push(normalizeTodo({ text: v, date: todayKey() }));
      save();
      render();
      const again = $("#todoInput");
      if (again) again.focus();
      toast("To-do added 📝");
    },
    "del-todo": (id) => {
      state.todos = state.todos.filter((t) => t.id !== id);
      save();
      render();
    },
    "add-win": () => {
      const v = $("#winInput").value.trim();
      if (v) {
        state.wins.push({ text: v, date: new Date().toLocaleString() });
        state.points += 2;
        save();
        render();
        toast("Win added 🏆");
      }
    },

    "set-theme": (_, arg) => {
      state.settings.theme = arg;
      save();
      render();
    },
    "set-accent": (_, arg) => {
      if (!ACCENTS.some((a) => a[0] === arg)) return;
      state.settings.accent = arg;
      save();
      render();
    },
    "save-reminder-times": () => {
      const mb = $("#setBriefTime")?.value;
      const lb = $("#setLeaveBy")?.value;
      if (TIME_RE.test(mb)) state.settings.morningBriefingTime = mb;
      state.settings.leaveByTime = TIME_RE.test(lb) ? lb : "";
      save();
      render();
      toast("Times saved 🕗");
    },
    toggle: (_, arg) => {
      if (arg === "readable")
        state.settings.readable = !state.settings.readable;
      if (arg === "motion")
        state.settings.motion = state.settings.motion === "off" ? "on" : "off";
      save();
      render();
    },
    "toggle-notify": async () => {
      if (!state.settings.notifications) {
        const ok = await enableNotifications();
        state.settings.notifications = ok;
        if (!ok) toast("Notifications were blocked in the browser.");
      } else state.settings.notifications = false;
      save();
      render();
    },
    "save-profile": () => {
      state.settings.studentName = $("#setName").value.trim() || "Noam";
      state.settings.gmail = $("#setGmail").value.trim();
      save();
      render();
      toast("Saved");
    },
    "move-card": (id, arg) => {
      const a = state.settings.homeOrder,
        i = a.indexOf(id),
        j = arg === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]];
      save();
      render();
    },
    "toggle-card": (id) => {
      const h = state.settings.hiddenCards;
      state.settings.hiddenCards = h.includes(id)
        ? h.filter((k) => k !== id)
        : [...h, id];
      save();
      render();
    },

    "compose-email": () => {
      const c = cls($("#eClass").value);
      window.open(
        gmailCompose(c.email, $("#eSub").value, $("#eBody").value),
        "_blank",
        "noopener",
      );
    },

    // Ask the teacher for help on a specific assignment — prefills the teacher's
    // email, a subject, and a clear message with the assignment context.
    "ask-help": (id) => {
      const a = state.assignments.find((x) => x.id === id);
      if (!a) return;
      const c = cls(a.classId);
      const name = state.settings.studentName || "Noam";
      const due = a.due ? ` (due ${niceDate(a.due)})` : "";
      const sub = `Help with ${c.name}: ${a.title}`;
      const body = `Hi${c.teacher ? " " + c.teacher : ""},

I have a question about "${a.title}"${due} in ${c.name}.

The part I'm stuck on is:

What I've tried so far is:

Could you help me understand what to do next? Thank you,
${name}`;
      if (c.email) {
        window.open(gmailCompose(c.email, sub, body), "_blank", "noopener");
        toast("Opening Gmail ✉️");
      } else {
        // No teacher email saved — guide them to add it / use the composer.
        openModal(
          "No teacher email yet",
          `<p class="sub">There's no email saved for <b>${esc(c.name)}</b> yet. Add one so “Ask for help” can reach the teacher in one tap.</p>
          <div class="row">
            <button class="btn primary" data-act="edit-class" data-id="${c.id}">Add teacher email</button>
            <a class="btn navy" target="_blank" rel="noopener" href="${gmailCompose("", sub, body)}">Write it anyway</a>
          </div>`,
        );
      }
    },

    "parse-paste": () => {
      parsedCache = parsePaste($("#pasteBox").value);
      $("#parsePreview").innerHTML = parsedCache.length
        ? parsedCache
            .map(
              (a) =>
                `<div class="item"><h4>${esc(a.title)}</h4><p class="meta">${esc(cls(a.classId).name)} · ${esc(dueLabel(a.due, a.dueTime))}</p></div>`,
            )
            .join("") +
          `<button class="btn primary block" data-act="add-parsed" style="margin-top:8px">Add ${parsedCache.length} assignment${parsedCache.length === 1 ? "" : "s"}</button>`
        : "No assignments found. Try pasting one class at a time.";
    },
    "clear-paste": () => {
      $("#pasteBox").value = "";
      $("#parsePreview").textContent = "Nothing yet — paste and press Preview.";
    },
    "add-parsed": () => {
      state.assignments.push(...parsedCache);
      save();
      toast(`Added ${parsedCache.length} assignments`);
      parsedCache = [];
      setView("tasks");
    },

    install: () => doInstall(),

    export: () => exportBackup(),
    import: () => $("#importFile").click(),
    "confirm-import": async () => {
      if (importBackup._pending) {
        state = normalize(importBackup._pending);
        await save({ immediate: true });
        importBackup._pending = null;
      }
      closeModal();
      render();
      toast("Backup loaded ✅");
    },
    "gen-code": () => {
      // High-entropy code so the (no-account) sync key isn't guessable.
      const words = [
        "orca",
        "fox",
        "hawk",
        "puma",
        "wolf",
        "lynx",
        "bear",
        "owl",
        "moth",
        "kite",
        "reef",
        "fern",
      ];
      const bytes = new Uint8Array(10);
      (crypto || {}).getRandomValues?.(bytes);
      const rand = [...bytes]
        .map((b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31])
        .join("");
      const w = words[bytes[0] % words.length];
      $("#syncCode").value = `noam-${w}-${rand}`;
    },
    "toggle-sync": async () => {
      const code = $("#syncCode")?.value.trim();
      if (!state.settings.sync.enabled) {
        if (!code) return toast("Enter or make a sync code first.");
        if (code.length < 12)
          return toast(
            "Use a longer code (12+ characters) to keep data private. Tap 🎲.",
          );
        state.settings.sync.code = code;
        state.settings.sync.enabled = true;
        save();
        toast(
          cloud.available()
            ? "Cloud sync on 🔄"
            : "Saved. Cloud activates when the site supports it.",
        );
        await cloud.pull();
        await cloud.push();
      } else {
        state.settings.sync.enabled = false;
        save();
        toast("Cloud sync off");
      }
      render();
    },
    "sync-now": async () => {
      toast("Syncing...");
      const pulled = await cloud.pull();
      await cloud.push();
      render();
      toast(pulled ? "Pulled newer data ⬇️" : "Synced 🔄");
    },

    // ---- Google Calendar ----
    "gcal-connect": () => gcal.connect(),
    "gcal-refresh": () => {
      toast("Refreshing Google Calendar…");
      gcal.token ? gcal.fetchEvents() : gcal.connect();
    },
    "gcal-disconnect": () => {
      openModal(
        "Disconnect Google Calendar?",
        `<p class="sub">This removes the cached Google events from this app. Your Google account isn't changed.</p><div class="row"><button class="btn danger" data-act="gcal-confirm-disconnect">Disconnect</button><button class="btn" data-act="close-modal">Cancel</button></div>`,
      );
    },
    "gcal-confirm-disconnect": () => {
      closeModal();
      gcal.disconnect();
    },

    "gmail-connect": () => gmail.connect(),
    "gmail-refresh": () => {
      toast("Refreshing School Mail…");
      gmail.token ? gmail.fetchMessages() : gmail.connect();
    },
    "gmail-disconnect": () => {
      openModal(
        "Disconnect School Mail?",
        `<p class="sub">This removes the cached Gmail messages from this app. Your Google account and mailbox aren't changed.</p><div class="row"><button class="btn danger" data-act="gmail-confirm-disconnect">Disconnect</button><button class="btn" data-act="close-modal">Cancel</button></div>`,
      );
    },
    "gmail-confirm-disconnect": () => {
      closeModal();
      gmail.disconnect();
    },
    // Turn a Gmail message into a task — prefilled from its subject.
    "gmail-make-task": (id) => {
      const m = (state.gmail?.messages || []).find((x) => x.id === id);
      if (!m) return;
      const obj = normalizeTask({
        title: ("Email: " + (m.subject || "(no subject)")).slice(0, 120),
        source: "School Mail",
        notes: m.from ? `From: ${m.from}` : "",
      });
      state.assignments.push(obj);
      save();
      render();
      toast("Made a task from this email 📝");
    },
    // Turn a Gmail message into a reminder — prefilled from its subject.
    "gmail-make-reminder": (id) => {
      const m = (state.gmail?.messages || []).find((x) => x.id === id);
      if (!m) return;
      const r = normalizeReminder({
        text: ("Reply / handle: " + (m.subject || "(no subject)")).slice(
          0,
          200,
        ),
      });
      state.reminders.push(r);
      save();
      render();
      toast("Made a reminder from this email ⏰");
    },
    "save-google-id": () => {
      state.settings.googleClientId = ($("#gClientId")?.value || "").trim();
      save();
      render();
      toast("Google Client ID saved");
    },

    "close-modal": () => closeModal(),
  };

  // ---------------------------------------------------------------------------
  // Event wiring (delegated, attached once)
  // ---------------------------------------------------------------------------
  function wire() {
    document.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (!ACTIONS[act]) return;
      // Don't hijack <summary> toggles or real links
      if (btn.tagName === "A") return;
      ev.preventDefault();
      ACTIONS[act](btn.dataset.id, btn.dataset.arg, ev, btn.dataset.sid);
    });

    document.addEventListener("change", (ev) => {
      const box = ev.target.closest("[data-check]");
      if (!box) return;
      const kind = box.dataset.check,
        id = box.dataset.id,
        sid = box.dataset.sid;
      if (kind === "step") {
        const a = state.assignments.find((x) => x.id === id);
        const st = a?.steps.find((s) => s.id === sid);
        if (st) {
          st.done = box.checked;
          // Award +1 the first time a step is ever completed; never again
          // (prevents farming points by toggling a checkbox repeatedly).
          if (box.checked && !st.credited) {
            st.credited = true;
            state.points += 1;
          }
          // auto-complete when all steps checked
          if (a.steps.length && a.steps.every((s) => s.done)) {
            toast("All steps done! Mark it finished? Tap ✓ Done.");
          }
          save();
          // light update: reflect text + focus overlay without full nav reset
          const label = box.parentElement.querySelector(".steptext");
          if (label) label.classList.toggle("done", box.checked);
          updateProgressBars();
          if (focus.taskId === id) focus.renderSteps();
        }
      } else if (kind === "routine") {
        const day = (state.routineLog[todayKey()] =
          state.routineLog[todayKey()] || {});
        const arr = (day[id] = day[id] || []);
        const r = state.routines.find((x) => x.id === id);
        if (box.checked) {
          if (!arr.includes(sid)) arr.push(sid);
        } else day[id] = arr.filter((x) => x !== sid);
        // Award +5 the first time a routine is fully completed today, and only
        // once (tracked in day.__awarded) so it can't be farmed by re-checking.
        const awarded = (day.__awarded = day.__awarded || []);
        if (
          r &&
          r.items.length &&
          day[id].length === r.items.length &&
          !awarded.includes(id)
        ) {
          awarded.push(id);
          state.points += 5;
          bumpActivity("routines");
          toast(`${r.name} complete! +5 🎉`);
        }
        save();
        const label = box.parentElement.querySelector(".steptext");
        if (label) label.classList.toggle("done", box.checked);
        updateProgressBars();
      } else if (kind === "todo") {
        const td = state.todos.find((t) => t.id === id);
        if (td) {
          td.done = box.checked;
          if (box.checked) {
            state.points += 1;
            bumpActivity("tasks");
          }
          save();
          const label = box.parentElement.querySelector(".steptext");
          if (label) label.classList.toggle("done", box.checked);
          renderHero();
        }
      } else if (kind === "reminder") {
        const r = state.reminders.find((x) => x.id === id);
        if (r) {
          if (isRecurring(r)) {
            // Recurring: "done" means done-for-today only — it returns tomorrow.
            r.lastDone = box.checked ? todayKey() : "";
          } else {
            r.done = box.checked;
          }
          save();
          // Re-render so the reminder moves between Open/Done groups cleanly.
          render();
        }
      }
    });

    // Enter key submits the quick to-do input
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target.id === "todoInput") {
        ev.preventDefault();
        ACTIONS["add-todo"]();
      }
      if (ev.key === "Enter" && ev.target.id === "reminderInput") {
        ev.preventDefault();
        ACTIONS["quick-reminder"]();
      }
    });

    // file import
    document.addEventListener("change", (ev) => {
      if (ev.target.id === "importFile" && ev.target.files[0])
        importBackup(ev.target.files[0]);
    });

    // range/live binds
    document.addEventListener("input", (ev) => {
      const b = ev.target.dataset?.bind;
      if (!b) return;
      const val = Number(ev.target.value);
      state.settings[b] = val;
      if (b === "fontScale")
        document.documentElement.style.setProperty("--font-scale", val);
      // update the label number live
      const lbl = ev.target.previousElementSibling;
      if (lbl && lbl.tagName === "LABEL") {
        if (b === "fontScale")
          lbl.textContent = `Text size — ${Math.round(val * 100)}%`;
        if (b === "defaultFocusMin") lbl.textContent = `Focus minutes — ${val}`;
        if (b === "breakMin") lbl.textContent = `Break minutes — ${val}`;
      }
      save();
    });

    // keyboard: Escape closes overlays; Tab is trapped inside the open overlay
    document.addEventListener("keydown", (ev) => {
      const modalOpen = $("#modalBack").classList.contains("open");
      const focusOpen = $("#focusOverlay").classList.contains("open");
      const guideOpen = $("#guideOverlay").classList.contains("open");
      if (ev.key === "Escape") {
        if (modalOpen) closeModal();
        else if (focusOpen) focus.stop();
        else if (guideOpen) guide.stop();
      } else if (ev.key === "Tab") {
        if (modalOpen) trapFocus($("#modalBack .modal"), ev);
        else if (focusOpen) trapFocus($("#focusOverlay"), ev);
        else if (guideOpen) trapFocus($("#guideOverlay"), ev);
      }
    });

    // Note: clicking the backdrop intentionally does NOT close the modal, to
    // avoid losing a half-typed assignment/routine. Use ✕ or Escape instead.

    // connection status
    const setConn = () => {
      const online = navigator.onLine;
      const chip = $("#connChip");
      chip.className = "chip " + (online ? "online" : "offline");
      $("#connText").textContent = online ? "Online" : "Offline — still works";
      if (online && state.settings.sync.enabled)
        cloud.pull().then((p) => p && render());
    };
    window.addEventListener("online", setConn);
    window.addEventListener("offline", setConn);
    setConn();
  }

  function updateProgressBars() {
    // recompute step progress bars in place
    $$("[data-task]").forEach((node) => {
      const a = state.assignments.find((x) => x.id === node.dataset.task);
      if (!a) return;
      const bar = node.querySelector(".bar > span");
      if (bar) bar.style.width = stepPct(a) + "%";
    });
    renderHero();
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  async function init() {
    await idb.open();
    let stored = await idb.get(STATE_KEY);

    // The synchronous localStorage mirror can be newer than IndexedDB if the
    // app was closed within the idb debounce window — prefer whichever is newer.
    try {
      const mirrored = JSON.parse(localStorage.getItem(MIRROR_KEY) || "null");
      if (
        mirrored &&
        (!stored || (mirrored.updatedAt || 0) > (stored.updatedAt || 0))
      ) {
        stored = mirrored;
      }
    } catch {}

    if (!stored) {
      // one-time migration from an older localStorage-only build (newest first)
      for (const key of LEGACY_KEYS) {
        try {
          const legacy = JSON.parse(localStorage.getItem(key) || "null");
          if (legacy && (Array.isArray(legacy.assignments) || legacy.classes)) {
            stored = legacy;
            toast("Brought your old data over 👍");
            break;
          }
        } catch {}
      }
    }
    state = normalize(stored);
    // Don't push local state to the cloud until after the first pull, so a stale
    // device can't overwrite newer remote data on startup.
    suppressPush = true;
    await save({ touch: false, immediate: true });

    // Flush to IndexedDB the instant the page is hidden or closing, so the
    // most recent change is always durable even between debounce ticks.
    const flush = () => {
      clearTimeout(saveTimer);
      mirror();
      idb.set(STATE_KEY, state);
    };
    addEventListener(
      "visibilitychange",
      () => document.visibilityState === "hidden" && flush(),
    );
    addEventListener("pagehide", flush);

    // honor ?view= and ?action=
    const params = new URLSearchParams(location.search);
    const v = params.get("view");
    if (v && (TABS.some((t) => t[0] === v) || VIEWS[v])) view = v;

    wire();
    render();

    if (params.get("action") === "add") ACTIONS["quick-add"]();

    // pull cloud data if enabled, THEN re-enable pushing
    if (state.settings.sync.enabled && cloud.available()) {
      const pulled = await cloud.pull();
      if (pulled) render();
    }
    suppressPush = false;

    // calm one-line briefing on open, plus the reminders loop
    dailyBriefing();
    checkReminders(); // fires anything already due (incl. passed reminder times)
    scheduleReminders(); // arms precise setTimeouts for today's upcoming times
    setInterval(checkReminders, 60000);
    // Re-arm timers when the tab is refocused (a backgrounded tab can throttle
    // timers; refocusing recomputes them and catches anything missed).
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkReminders();
        scheduleReminders();
      }
    });

    // register service worker + let the user know when an update is ready
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js")
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener("statechange", () => {
              if (
                nw.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                toast("Update ready — reopen the app to get it");
              }
            });
          });
        })
        .catch(() => {});
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
