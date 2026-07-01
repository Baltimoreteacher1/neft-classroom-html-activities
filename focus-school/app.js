/* Noam School — Focus & Plan
 * Executive-function planner for middle school. Offline-first, installable PWA.
 * Vanilla JS, no dependencies. Data lives in IndexedDB (offline-safe) with a
 * one-time migration from the older localStorage build, plus file + optional
 * cloud backup for syncing between devices.
 */
(() => {
  "use strict";

  function ensureKaTeX(callback) {
    if (window.renderMathInElement) {
      callback();
      return;
    }
    if (!document.querySelector('link[href*="katex"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
    script.crossOrigin = "anonymous";
    script.onload = function () {
      var ext = document.createElement("script");
      ext.src =
        "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js";
      ext.crossOrigin = "anonymous";
      ext.onload = callback;
      document.head.appendChild(ext);
    };
    document.head.appendChild(script);
  }

  function formatAiReply(text) {
    if (!text) return "";
    var temp = document.createElement("div");
    temp.textContent = text;
    var safe = temp.innerHTML;
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\*(.*?)\*/g, "<em>$1</em>");
    safe = safe.replace(/\n/g, "<br>");
    return safe;
  }

  let deviceId = "";
  function getDeviceName() {
    const ua = navigator.userAgent;
    if (/CrOS/.test(ua)) return "Chromebook";
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
    if (/Android/.test(ua)) return "Android Device";
    if (/Macintosh/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";
    if (/Linux/.test(ua)) return "Linux PC";
    return "Web Browser";
  }

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

  // True when the student turned motion off in Settings OR their OS/browser
  // requests reduced motion. Used to gate every JS-driven animation (confetti,
  // timer visualizer) so vestibular-sensitive users get a calm, still UI.
  const reducedMotion = () =>
    (typeof state !== "undefined" && state.settings.motion === "off") ||
    (typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches);

  function hexToHsl(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "hsl(0, 0%, 0%)";
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

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

  // ---- Health & movement check-ins -------------------------------------
  // Fun, optional daily movement goals (biking + lifting). They reset every
  // day and are never required; finishing one pays a small allowance.
  // [id, emoji, label, hint]
  const HEALTH_ITEMS = [
    ["bikeRide", "🚴", "Went for a bike ride", "15 minutes or more outside"],
    ["bikeLoop", "🚲", "Quick bike loop", "A spin around the block counts"],
    ["lift", "🏋️", "Lifted weights", "Dumbbells or a strength set"],
    ["pushups", "💪", "Push-ups or sit-ups", "Knock out a set or two"],
    ["stretch", "🤸", "Warmed up / stretched", "Loosen up before or after"],
  ];
  // The Health page list is fully user-editable. The built-in HEALTH_ITEMS are
  // only a first-run seed: on first use they're copied into state.health.items,
  // after which every movement (defaults included) can be renamed or deleted.
  // A `seeded` flag means "don't re-seed" so deleting everything stays empty.
  function healthItems() {
    state.health = state.health || { log: {} };
    if (!state.health.seeded) {
      if (
        !Array.isArray(state.health.items) ||
        state.health.items.length === 0
      ) {
        state.health.items = HEALTH_ITEMS.map((it) => it.slice());
      }
      state.health.seeded = true;
    }
    if (!Array.isArray(state.health.items)) state.health.items = [];
    return state.health.items;
  }
  // Validate a synced/imported health payload so it can't poison state. Keeps
  // every well-formed movement item (built-in or custom) and only log entries
  // that reference a known item id, and preserves the first-run `seeded` flag.
  function normalizeHealth(h) {
    const items = [];
    const rawItems = h && Array.isArray(h.items) ? h.items : [];
    const seenIds = new Set();
    for (const it of rawItems) {
      if (!Array.isArray(it) || it.length < 3) continue;
      const [id, emoji, label, hint] = it;
      if (typeof id !== "string" || !id || id.length > 40) continue;
      if (seenIds.has(id)) continue;
      if (typeof label !== "string" || !label.trim()) continue;
      seenIds.add(id);
      items.push([
        id,
        typeof emoji === "string" && emoji ? emoji.slice(0, 4) : "💪",
        label.trim().slice(0, 60),
        typeof hint === "string" ? hint.trim().slice(0, 80) : "",
      ]);
    }
    const knownIds = new Set(
      HEALTH_ITEMS.map((i) => i[0]).concat(items.map((i) => i[0])),
    );
    const log = {};
    const src =
      h && typeof h === "object" && h.log && typeof h.log === "object"
        ? h.log
        : {};
    for (const [date, day] of Object.entries(src)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !day || typeof day !== "object")
        continue;
      const clean = {};
      for (const id of knownIds) if (day[id]) clean[id] = 1;
      const paid = Array.isArray(day.__paid)
        ? day.__paid.filter((x) => knownIds.has(x))
        : [];
      if (paid.length) clean.__paid = [...new Set(paid)];
      if (Object.keys(clean).length) log[date] = clean;
    }
    const out = { log, items };
    if (h && h.seeded) out.seeded = true;
    return out;
  }
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
  const DB_NAME = "focus-school";
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
    ["routine", "Right routine"],
    ["glance", "Today at a glance"],
    ["plan", "Afternoon Plan"],
    ["payday", "Allowance"],
    ["garden", "Focus Garden"],
    ["calendar", "Calendar"],
    ["todos", "To-do list"],
    ["assignments", "Assignment list"],
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
        name: "Nighttime Shutdown",
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
      days: [],
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
        studentName: "",
        gmail: "",
        theme: "light",
        accent: "teal",
        readable: false,
        welcomeDismissed: false,
        motion: "on",
        fontScale: 1,
        notifications: false,
        defaultFocusMin: 15,
        breakMin: 5,
        homeOrder: CARDS.map((x) => x[0]),
        hiddenCards: [],
        // One-time flag: lift the time-based routine card to the top of the
        // Now screen for installs that saved a layout before it led the order.
        routineTopMigrated: false,
        // Reminder times (24h "HH:MM") for the local notification scheduler.
        morningBriefingTime: "07:15",
        leaveByTime: "",
        sync: { enabled: false, code: "", lastAt: "" },
        themeGradient: "",
        customThemeColor1: "#0d324d",
        customThemeColor2: "#7f5a83",
        // Google Calendar (read-only, client-side OAuth). Only the Web Client ID
        // is persisted — the access token lives in memory and is never stored.
        googleClientId: "",
        // Selected Google calendar IDs to include (read-only). Only the ID
        // strings are persisted — never tokens. Empty = default to "primary".
        gcalCalendars: [],
      },
      classes: [
        c("Math", "#147c78"),
        c("English / ELA", "#c0473a"),
        c("Science", "#2a8f5c"),
        c("Social Studies", "#d99028"),
      ],
      assignments: [],
      // [{ id, text, date, time, done, createdAt, repeat, lastShown, lastDone }]
      // repeat: "none"|"daily"|"weekdays"|"weekends"|"weekly"; recurring "done" = done-for-today.
      reminders: [],
      todos: [], // [{ id, text, done, date, createdAt }] quick daily to-dos
      // Cached Google Calendar events (read-only).
      // { events:[...], fetchedAt, calendars:[{id,name,color,primary}] }
      gcal: { events: [], fetchedAt: "", calendars: [] },
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
      reflections: {},
      deletedIds: {},
      garden: {
        xp: 0,
        waterReservoir: 0,
        wateredCount: 0,
        plantStage: 0,
        plantType: "cactus",
      },
      // Real-money allowance ledger. Noam earns money for finishing work; a
      // parent reviews the balance and "cashes out" (optionally gated by a PIN).
      // The ledger is the source of truth — balance/paidOut are recomputed from
      // it on sync merge, so two devices can never double-count an earning.
      rewards: {
        enabled: true,
        currency: "$",
        balance: 0, // earned, not yet paid out
        paidOut: 0, // lifetime paid out by a parent
        rates: {
          task: 0.5,
          reminder: 0.1,
          routine: 0.25,
          focus: 0.25,
          health: 0.1,
        },
        dailyCap: 5, // max earnable per day (anti-gaming); 0 = no cap
        weeklyCap: 10, // realistic ceiling on a single week's payout; 0 = none
        bonusPerfectWeek: 1, // bonus when there's activity every weekday Mon–Fri
        pin: "", // parent PIN for payout; "" = no gate set yet
        // [{ id, ts(ISO), kind, label, amount, type:"earn"|"cashout" }]
        ledger: [],
        // Weekly payouts a parent has settled:
        // [{ id, weekKey(Mon YYYY-MM-DD), amount, paidAt(ISO), breakdown:{} }]
        payouts: [],
      },
      readingProgress: {},
      bookTransition: {
        finishedB: "",
        responseB: false,
        startC: "",
        rememberText: "",
      },
      health: { log: {} },
      updatedAt: Date.now(),
    };
  }

  function normalize(x) {
    const base = seed();
    if (!x || typeof x !== "object") return base;
    const s = { ...base.settings, ...(x.settings || {}) };
    s.welcomeDismissed = !!(
      x.settings?.welcomeDismissed ?? base.settings.welcomeDismissed
    );
    s.sync = { ...base.settings.sync, ...(x.settings?.sync || {}) };
    s.themeGradient = String(x.settings?.themeGradient || "");
    s.customThemeColor1 = String(x.settings?.customThemeColor1 || "#0d324d");
    s.customThemeColor2 = String(x.settings?.customThemeColor2 || "#7f5a83");
    let order = Array.isArray(s.homeOrder)
      ? s.homeOrder
      : base.settings.homeOrder;
    order = [
      ...order.filter((k) => CARDS.some((c) => c[0] === k)),
      ...CARDS.map((c) => c[0]).filter((k) => !order.includes(k)),
    ];
    s.homeOrder = order;
    s.hiddenCards = Array.isArray(s.hiddenCards) ? s.hiddenCards : [];
    s.homeOrderAt = Number(s.homeOrderAt) || 0; // layout change-stamp for sync
    // One-time: move the time-based routine card to the very top of the Now
    // screen. Runs once per install (then respects any later manual reorder),
    // and bumps the sync stamp so linked devices pick up the new order.
    if (!s.routineTopMigrated) {
      s.homeOrder = ["routine", ...s.homeOrder.filter((k) => k !== "routine")];
      s.routineTopMigrated = true;
      s.homeOrderAt = Date.now();
    }
    s.fontScale = clamp(Number(s.fontScale) || 1, 0.9, 1.5);
    s.defaultFocusMin = clamp(Number(s.defaultFocusMin) || 15, 5, 60);
    s.accent = ACCENTS.some((a) => a[0] === s.accent) ? s.accent : "teal";
    s.morningBriefingTime = TIME_RE.test(s.morningBriefingTime)
      ? s.morningBriefingTime
      : "07:15";
    s.leaveByTime = TIME_RE.test(s.leaveByTime) ? s.leaveByTime : "";
    s.googleClientId = String(s.googleClientId || "").slice(0, 200);
    // Selected Google calendar IDs — keep only non-empty strings, capped.
    s.gcalCalendars = (Array.isArray(s.gcalCalendars) ? s.gcalCalendars : [])
      .filter((id) => typeof id === "string" && id.trim())
      .slice(0, 50);
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
      // Reminders merged into the to-do list — migrate once, then keep empty.
      reminders: [],
      todos: [
        ...(Array.isArray(x.todos) ? x.todos.map(normalizeTodo) : []),
        ...(Array.isArray(x.reminders) ? x.reminders.map(reminderToTodo) : []),
      ],
      routines:
        Array.isArray(x.routines) && x.routines.length
          ? x.routines.map(normalizeRoutine)
          : base.routines,
      routineLog: normalizeRoutineLog(x.routineLog),
      activity: x.activity && typeof x.activity === "object" ? x.activity : {},
      wins: Array.isArray(x.wins) ? x.wins : [],
      points: Number(x.points) || 0,
      daily: { ...base.daily, ...(x.daily || {}) },
      captureLog:
        x.captureLog && typeof x.captureLog === "object" ? x.captureLog : {},
      gcal:
        x.gcal && Array.isArray(x.gcal.events)
          ? {
              events: x.gcal.events,
              fetchedAt: x.gcal.fetchedAt || "",
              calendars: Array.isArray(x.gcal.calendars)
                ? x.gcal.calendars
                : [],
            }
          : { events: [], fetchedAt: "", calendars: [] },
      gmail:
        x.gmail && Array.isArray(x.gmail.messages)
          ? { messages: x.gmail.messages, fetchedAt: x.gmail.fetchedAt || "" }
          : { messages: [], fetchedAt: "" },
      checkins: x.checkins && typeof x.checkins === "object" ? x.checkins : {},
      reflections:
        x.reflections && typeof x.reflections === "object" ? x.reflections : {},
      deletedIds:
        x.deletedIds && typeof x.deletedIds === "object" ? x.deletedIds : {},
      readingProgress:
        x.readingProgress && typeof x.readingProgress === "object"
          ? x.readingProgress
          : {},
      bookTransition:
        x.bookTransition && typeof x.bookTransition === "object"
          ? x.bookTransition
          : { finishedB: "", responseB: false, startC: "", rememberText: "" },
      garden:
        x.garden && typeof x.garden === "object"
          ? {
              xp: Number(x.garden.xp) || 0,
              waterReservoir: Number(x.garden.waterReservoir) || 0,
              wateredCount: Number(x.garden.wateredCount) || 0,
              plantStage: Number(x.garden.plantStage) || 0,
              plantType:
                typeof x.garden.plantType === "string"
                  ? x.garden.plantType
                  : "cactus",
            }
          : {
              xp: 0,
              waterReservoir: 0,
              wateredCount: 0,
              plantStage: 0,
              plantType: "cactus",
            },
      rewards: normalizeRewards(x.rewards),
      health: normalizeHealth(x.health),
    };
  }

  // Validate/clamp the rewards ledger from an imported or synced backup so a
  // corrupt or hostile payload can't poison balances or inject markup later.
  function normalizeRewards(r) {
    const base = seed().rewards;
    if (!r || typeof r !== "object") return base;
    const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const rates = r.rates && typeof r.rates === "object" ? r.rates : {};
    const ledger = Array.isArray(r.ledger)
      ? r.ledger
          .filter((e) => e && typeof e === "object")
          .map((e) => ({
            id: String(e.id || uid("e")),
            ts: String(e.ts || ""),
            kind: String(e.kind || "task"),
            label: String(e.label || ""),
            amount: Math.max(0, num(e.amount, 0)),
            type: e.type === "cashout" ? "cashout" : "earn",
          }))
          .slice(0, 1000)
      : [];
    const payouts = Array.isArray(r.payouts)
      ? r.payouts
          .filter((p) => p && typeof p === "object" && p.weekKey)
          .map((p) => ({
            id: String(p.id || uid("pay")),
            weekKey: String(p.weekKey),
            amount: Math.max(0, num(p.amount, 0)),
            paidAt: String(p.paidAt || ""),
            breakdown:
              p.breakdown && typeof p.breakdown === "object" ? p.breakdown : {},
          }))
          .slice(0, 520) // ~10 years of weeks
      : [];
    return {
      enabled: r.enabled !== false,
      currency: typeof r.currency === "string" ? r.currency.slice(0, 3) : "$",
      balance: Math.max(0, num(r.balance, 0)),
      paidOut: Math.max(0, num(r.paidOut, 0)),
      rates: {
        task: Math.max(0, num(rates.task, base.rates.task)),
        reminder: Math.max(0, num(rates.reminder, base.rates.reminder)),
        routine: Math.max(0, num(rates.routine, base.rates.routine)),
        focus: Math.max(0, num(rates.focus, base.rates.focus)),
        health: Math.max(0, num(rates.health, base.rates.health)),
      },
      dailyCap: Math.max(0, num(r.dailyCap, base.dailyCap)),
      weeklyCap: Math.max(0, num(r.weeklyCap, base.weeklyCap)),
      bonusPerfectWeek: Math.max(
        0,
        num(r.bonusPerfectWeek, base.bonusPerfectWeek),
      ),
      pin: /^\d{0,8}$/.test(String(r.pin || "")) ? String(r.pin || "") : "",
      ledger,
      payouts,
    };
  }

  // Class colors flow into inline style="..." attributes; restrict them to real
  // hex colors so a malicious imported/synced backup can't inject CSS.
  const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
  const safeColor = (c) => (COLOR_RE.test(String(c || "")) ? c : "#147c78");
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE = /^\d{2}:\d{2}$/;
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function normalizeRoutineLog(log) {
    if (!log || typeof log !== "object") return {};
    const out = {};
    for (const [date, day] of Object.entries(log)) {
      if (!DATE_RE.test(date) || !day || typeof day !== "object") continue;
      const cleanDay = {};
      for (const [routineId, itemIds] of Object.entries(day)) {
        if (!Array.isArray(itemIds)) continue;
        cleanDay[routineId] = [...new Set(itemIds.filter(Boolean).map(String))];
      }
      out[date] = cleanDay;
    }
    return out;
  }
  function mergeRoutineLogs(localLog, remoteLog) {
    const merged = normalizeRoutineLog(localLog);
    const remote = normalizeRoutineLog(remoteLog);
    for (const [date, day] of Object.entries(remote)) {
      const target = (merged[date] = merged[date] || {});
      for (const [routineId, itemIds] of Object.entries(day)) {
        target[routineId] = [
          ...new Set([...(target[routineId] || []), ...itemIds]),
        ];
      }
    }
    return merged;
  }
  function normalizeClass(c) {
    c = c || {};
    return {
      id: c.id || uid("c"),
      name: String(c.name || "Class").slice(0, 60),
      emoji: String(c.emoji || "📚").slice(0, 8),
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
      updatedAt: c.updatedAt || Date.now(),
    };
  }

  const REPEATS = ["none", "daily", "weekdays", "weekends", "weekly"];
  // To-dos support the same cadences plus monthly/yearly.
  const TODO_REPEATS = [
    "none",
    "daily",
    "weekdays",
    "weekends",
    "weekly",
    "monthly",
    "yearly",
  ];
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
      updatedAt: r.updatedAt || r.createdAt || Date.now(),
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
      updatedAt: a.updatedAt || Date.now(),
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
      repeat: TODO_REPEATS.includes(t.repeat) ? t.repeat : "none",
      lastDone: DATE_RE.test(t.lastDone) ? t.lastDone : "",
      time: t.time || "",
      lastShown: t.lastShown || "",
      updatedAt: t.updatedAt || t.createdAt || Date.now(),
    };
  }

  // Reminders were folded into the to-do list; convert an old reminder into a
  // to-do so existing data carries over (id kept so dedupe/sync stays stable).
  function reminderToTodo(r) {
    r = r || {};
    return normalizeTodo({
      id: r.id || uid("td"),
      text: r.text,
      done: !!r.done,
      date: DATE_RE.test(r.date) ? r.date : todayKey(),
      time: r.time || "",
      repeat: TODO_REPEATS.includes(r.repeat) ? r.repeat : "none",
      lastDone: r.lastDone || "",
      lastShown: r.lastShown || "",
      createdAt: r.createdAt || Date.now(),
    });
  }
  // Routine schedule: days = weekday short names it runs on; empty = every day.
  function normalizeRoutine(r) {
    r = r || {};
    return {
      id: r.id || uid("r"),
      name: String(r.name || "Routine").slice(0, 60),
      emoji: String(r.emoji || "🔁").slice(0, 8),
      days: Array.isArray(r.days) ? r.days.filter((d) => DAYS.includes(d)) : [],
      items: Array.isArray(r.items)
        ? r.items.map((it) => ({
            id: it.id || uid("i"),
            text: String(it.text || "").slice(0, 120),
          }))
        : [],
      updatedAt: r.updatedAt || Date.now(),
    };
  }
  let state = seed();
  const MIRROR_KEY = "focus-school:state"; // synchronous, never-lose-data fallback
  let saveTimer = null;
  let suppressPush = false; // true during init so we never push stale local over newer cloud
  let renderedDateKey = todayKey();
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
  function handleDateRollover() {
    const current = todayKey();
    if (current === renderedDateKey) return false;
    renderedDateKey = current;
    mirror();
    render();
    checkReminders();
    scheduleReminders();
    if (state.settings.sync.enabled) cloud.autoPull();
    toast("New day — routines are ready again.");
    return true;
  }
  function startDateRolloverWatcher() {
    renderedDateKey = todayKey();
    setInterval(handleDateRollover, 60000);
  }

  // Stamp the moment the Now-screen layout (card order / hidden cards) changed.
  // Sync merges the layout by this stamp, so a rearrange on one device wins over
  // unrelated newer activity on another (the document updatedAt isn't enough).
  const touchLayout = () => {
    state.settings.homeOrderAt = Date.now();
  };

  // ---------------------------------------------------------------------------
  // Selectors / derived data
  // ---------------------------------------------------------------------------
  const cls = (id) =>
    state.classes.find((c) => c.id === id) || {
      name: "Class",
      emoji: "📚",
      color: "#147c78",
    };
  const openTasks = () => state.assignments.filter((a) => a.status !== "done");

  // ---- Reminder recurrence helpers --------------------------------------------
  const isWeekday = (iso) => {
    const d = parseLocal(iso).getDay(); // 0=Sun..6=Sat
    return d >= 1 && d <= 5;
  };
  const isWeekend = (iso) => {
    const d = parseLocal(iso).getDay(); // 0=Sun, 6=Sat
    return d === 0 || d === 6;
  };
  // Does a recurring reminder's schedule include the given ISO day?
  function recurOccursOn(r, iso) {
    if (r.repeat === "daily") return true;
    if (r.repeat === "weekdays") return isWeekday(iso);
    if (r.repeat === "weekends") return isWeekend(iso);
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
    weekends: "Weekends",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  // ---- To-do recurrence helpers ----
  const isTodoRecurring = (t) => t.repeat && t.repeat !== "none";
  function todoOccursOn(t, iso) {
    if (t.repeat === "daily") return true;
    if (t.repeat === "weekdays") return isWeekday(iso);
    if (t.repeat === "weekends") return isWeekend(iso);
    const anchor = t.date || new Date(t.createdAt).toISOString().slice(0, 10);
    if (!DATE_RE.test(anchor)) return t.repeat === "weekly";
    const a = parseLocal(anchor),
      d = parseLocal(iso);
    if (t.repeat === "weekly") return d.getDay() === a.getDay();
    if (t.repeat === "monthly") return d.getDate() === a.getDate();
    if (t.repeat === "yearly")
      return d.getDate() === a.getDate() && d.getMonth() === a.getMonth();
    return false;
  }
  const todoDoneToday = (t) =>
    isTodoRecurring(t) ? t.lastDone === todayKey() : !!t.done;

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
      .filter((td) => {
        if (isTodoRecurring(td)) {
          return todoOccursOn(td, t);
        }
        return td.date === t || (!td.done && td.date < t);
      })
      .sort((a, b) => {
        const aDone = todoDoneToday(a);
        const bDone = todoDoneToday(b);
        return aDone === bDone ? a.createdAt - b.createdAt : aDone ? 1 : -1;
      });
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

  const READING_DAYS = [
    {
      id: "day1",
      date: "6/29",
      dayName: "Mon",
      book: "Blood on the River",
      read: "Chapter 13",
      prompt: "What changes after Wingfield is arrested?",
    },
    {
      id: "day2",
      date: "6/30",
      dayName: "Tue",
      book: "Blood on the River",
      read: "Chapter 14",
      prompt: "Smith leaves; what happens to the settlement?",
    },
    {
      id: "day3",
      date: "7/1",
      dayName: "Wed",
      book: "Blood on the River",
      read: "Chapter 15",
      prompt: "Why is Smith in danger again?",
    },
    {
      id: "day4",
      date: "7/2",
      dayName: "Thu",
      book: "Blood on the River",
      read: "Chapter 16",
      prompt: "Summarize the rescue/interruption.",
    },
    {
      id: "day5",
      date: "7/3",
      dayName: "Fri",
      book: "Blood on the River",
      read: "Chapter 17",
      prompt: "Cause/effect: new supplies, new people, fire.",
    },
    {
      id: "day6",
      date: "7/6",
      dayName: "Mon",
      book: "Blood on the River",
      read: "Chapter 18",
      prompt: "Track leadership: How does Smith become president?",
    },
    {
      id: "day7",
      date: "7/7",
      dayName: "Tue",
      book: "Blood on the River",
      read: "Chapter 19",
      prompt: 'Quote focus: "He that will not work shall not eat."',
    },
    {
      id: "day8",
      date: "7/8",
      dayName: "Wed",
      book: "Blood on the River",
      read: "Chapter 20",
      prompt: "Compare English goals vs. Powhatan goals.",
    },
    {
      id: "day9",
      date: "7/9",
      dayName: "Thu",
      book: "Blood on the River",
      read: "Chapter 21",
      prompt: "Track: conflict, ceremony, marriage, loss.",
    },
    {
      id: "day10",
      date: "7/10",
      dayName: "Fri",
      book: "Blood on the River",
      read: "Chapter 22",
      prompt: "Explain how Samuel changes while living with the Warraskoyack.",
    },
    {
      id: "day11",
      date: "7/13",
      dayName: "Mon",
      book: "Blood on the River",
      read: "Chapter 23",
      prompt: "Conflict map: What do the newcomers do, and why does it matter?",
    },
    {
      id: "day12",
      date: "7/14",
      dayName: "Tue",
      book: "Blood on the River",
      read: "Chapter 24",
      prompt: "Identify the turning point for Captain Smith.",
    },
    {
      id: "day13",
      date: "7/15",
      dayName: "Wed",
      book: "Blood on the River",
      read: "Chapter 25",
      prompt: "Decision check: Why does Samuel take action?",
    },
    {
      id: "day14",
      date: "7/16",
      dayName: "Thu",
      book: "Blood on the River",
      read: "Chapter 26",
      prompt: "Summarize the attack and its consequences.",
    },
    {
      id: "day15",
      date: "7/17",
      dayName: "Fri",
      book: "Blood on the River",
      read: "Chapter 27",
      prompt: "Point Comfort: What safety does Samuel find?",
    },
    {
      id: "day16",
      date: "7/20",
      dayName: "Mon",
      book: "Blood on the River",
      read: "Chapter 28",
      prompt: "Endgame: What is resolved? What still feels unsettled?",
    },
    {
      id: "day17",
      date: "7/21",
      dayName: "Tue",
      book: "Blood on the River",
      read: "Chapter 29 + wrap-up",
      prompt:
        "Final response: How has Samuel changed from Chapter 1 to the end?",
    },
    // The Crossover
    {
      id: "day18",
      date: "7/22",
      dayName: "Wed",
      book: "The Crossover",
      read: "Warm-Up pp. 1-20",
      prompt: "Meet Josh/Filthy McNasty; track voice, rhythm, and family.",
    },
    {
      id: "day19",
      date: "7/23",
      dayName: "Thu",
      book: "The Crossover",
      read: "First Quarter, Part 1 pp. 21-54",
      prompt: "Track: basketball as family language.",
    },
    {
      id: "day20",
      date: "7/24",
      dayName: "Fri",
      book: "The Crossover",
      read: "First Quarter, Part 2 pp. 55-86",
      prompt: "Explain how JB and Josh’s relationship starts to shift.",
    },
    {
      id: "day21",
      date: "7/27",
      dayName: "Mon",
      book: "The Crossover",
      read: "Second Quarter, Part 1 pp. 87-110",
      prompt: "Track tension: jealousy, consequences, and choices.",
    },
    {
      id: "day22",
      date: "7/28",
      dayName: "Tue",
      book: "The Crossover",
      read: "Second Quarter, Part 2 pp. 111-134",
      prompt: "Cause/effect: What mistake changes things?",
    },
    {
      id: "day23",
      date: "7/29",
      dayName: "Wed",
      book: "The Crossover",
      read: "Third Quarter, Part 1 pp. 135-165",
      prompt: "Track emotions: guilt, family pressure, and Dad’s health.",
    },
    {
      id: "day24",
      date: "7/30",
      dayName: "Thu",
      book: "The Crossover",
      read: "Third Quarter, Part 2 pp. 166-196",
      prompt: "Explain how the author builds worry and urgency.",
    },
    {
      id: "day25",
      date: "7/31",
      dayName: "Fri",
      book: "The Crossover",
      read: "Fourth Quarter pp. 197-222",
      prompt: "Track the climax: what changes for the family?",
    },
    {
      id: "day26",
      date: "8/3",
      dayName: "Mon",
      book: "The Crossover",
      read: "Overtime + final reflection pp. 223-237",
      prompt:
        "Final response: What does Josh learn about love, loss, and family?",
    },
  ];

  const TABS = [
    ["home", "Now", "🎯"],
    ["today", "Today", "📅"],
    ["tasks", "Tasks", "✅"],
    ["homework", "Homework", "📋"],
    ["calendar", "Calendar", "📆"],
    ["rewards", "Allowance", "💰"],
    ["routines", "Routines", "🔁"],
    ["calming", "Calming", "🧘"],
    ["ai", "Academic Help", "🤖"],
    ["reading", "Reading", "📚"],
    ["health", "Health", "💪"],
    ["more", "More", "⋯"],
  ];
  let view = "home";
  // "Arrange" mode turns the Now screen into an easy drag-to-rearrange board:
  // every card becomes grabbable (not just the small ⋮⋮ handle) and gently
  // wobbles so kids can clearly see what to move. Runtime-only (not saved).
  let arrangeMode = false;
  const expanded = new Set(); // task ids expanded inline

  function setView(v) {
    // Leaving the Now screen always exits arrange mode so it can't get "stuck".
    if (v !== "home") arrangeMode = false;
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

  // Confetti Particle System
  function triggerConfetti() {
    // Respect "Reduce motion" (in-app toggle or OS setting): a full-screen
    // 80-particle burst on every reward is exactly the kind of animation
    // vestibular-sensitive students need suppressed. Rewards still land via
    // the toast + state change; only the animation is skipped.
    if (reducedMotion()) return;
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resizeHandler = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeHandler);

    const colors = [
      "#14b8a6",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#10b981",
      "#8b5cf6",
      "#ec4899",
    ];
    const particles = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: width / 2,
        y: height + 20,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 12,
        r: Math.random() * 5 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        gravity: 0.35,
        friction: 0.98,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      for (const p of particles) {
        p.vx *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.015;

        if (p.opacity > 0 && p.y < height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
          ctx.restore();
        }
      }

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        window.removeEventListener("resize", resizeHandler);
        canvas.remove();
      }
    }
    animate();
  }

  // Structured logger for diagnostic capabilities
  const logger = {
    logs: [],
    info(msg) {
      this.log("info", msg);
    },
    warn(msg) {
      this.log("warn", msg);
    },
    error(msg) {
      this.log("error", msg);
    },
    log(level, msg) {
      const line = { level, msg, time: new Date().toLocaleTimeString() };
      this.logs.push(line);
      if (this.logs.length > 50) this.logs.shift();
      console.log(`[${level.toUpperCase()}] ${msg}`);
      const el = document.getElementById("diagLogs");
      if (el) {
        el.innerHTML += `<div class="log-line ${level}">[${line.time}] [${level.toUpperCase()}] ${esc(msg)}</div>`;
        el.scrollTop = el.scrollHeight;
      }
    },
  };

  // Web Audio API Procedural Sound Engine
  let audioCtx = null;
  let audioAnalyser = null;
  let visualizerAnimFrame = null;
  let synthOscillators = [];
  let synthGains = [];
  let synthFilter = null;
  let synthTimer = null;
  let ambientSource = null;
  let ambientGain = null;
  let focusTicksTimer = null;
  let activeSoundType = "none"; // "none" | "rain" | "rumble" | "ticks" | "ocean" | "wind" | "binaural" | "synth"
  let oceanLfo = null;
  let windLfo = null;
  let leftOsc = null;
  let rightOsc = null;
  let subOsc = null;

  function initAudio() {
    if (!audioCtx) {
      logger.info("Initializing Web Audio Context.");
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(() => logger.info("Audio Context resumed."));
    }
    if (!audioAnalyser && audioCtx) {
      audioAnalyser = audioCtx.createAnalyser();
      audioAnalyser.fftSize = 64;
      audioAnalyser.connect(audioCtx.destination);
    }
  }

  function createPinkNoiseBuffer(ctx, seconds = 4) {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  function createBrownNoiseBuffer(ctx, seconds = 4) {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  function stopAmbientSound() {
    logger.info("Stopping focus ambient sounds.");
    if (ambientSource) {
      try {
        ambientSource.stop();
      } catch {}
      ambientSource.disconnect();
      ambientSource = null;
    }
    if (ambientGain) {
      ambientGain.disconnect();
      ambientGain = null;
    }
    if (focusTicksTimer) {
      clearInterval(focusTicksTimer);
      focusTicksTimer = null;
    }
    if (oceanLfo) {
      try {
        oceanLfo.stop();
      } catch {}
      oceanLfo.disconnect();
      oceanLfo = null;
    }
    if (windLfo) {
      try {
        windLfo.stop();
      } catch {}
      windLfo.disconnect();
      windLfo = null;
    }
    if (leftOsc) {
      try {
        leftOsc.stop();
      } catch {}
      leftOsc.disconnect();
      leftOsc = null;
    }
    if (rightOsc) {
      try {
        rightOsc.stop();
      } catch {}
      rightOsc.disconnect();
      rightOsc = null;
    }
    if (subOsc) {
      try {
        subOsc.stop();
      } catch {}
      subOsc.disconnect();
      subOsc = null;
    }
    if (synthTimer) {
      clearInterval(synthTimer);
      synthTimer = null;
    }
    if (synthOscillators.length) {
      synthOscillators.forEach((o) => {
        try {
          o.stop();
        } catch {}
        o.disconnect();
      });
      synthOscillators = [];
    }
    if (synthGains.length) {
      synthGains.forEach((g) => g.disconnect());
      synthGains = [];
    }
    if (synthFilter) {
      synthFilter.disconnect();
      synthFilter = null;
    }
    activeSoundType = "none";
  }

  function playRain() {
    stopAmbientSound();
    initAudio();
    const buffer = createPinkNoiseBuffer(audioCtx, 4);
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.15;

    ambientSource.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioAnalyser || audioCtx.destination);
    ambientSource.start();
    activeSoundType = "rain";
  }

  function playRumble() {
    stopAmbientSound();
    initAudio();
    const buffer = createBrownNoiseBuffer(audioCtx, 4);
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.22;

    ambientSource.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioAnalyser || audioCtx.destination);
    ambientSource.start();
    activeSoundType = "rumble";
  }

  function playOcean() {
    stopAmbientSound();
    initAudio();
    const buffer = createPinkNoiseBuffer(audioCtx, 4);
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.115; // base offset

    oceanLfo = audioCtx.createOscillator();
    oceanLfo.frequency.value = 0.08; // ~12s swells

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.085; // +/- 0.085 swing

    oceanLfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    const filterGain = audioCtx.createGain();
    filterGain.gain.value = 350;
    oceanLfo.connect(filterGain);
    filterGain.connect(filter.frequency);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.65; // master volume adjustment

    ambientSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ambientGain);
    ambientGain.connect(audioAnalyser || audioCtx.destination);

    oceanLfo.start();
    ambientSource.start();
    activeSoundType = "ocean";
    logger.info("Ocean waves generator started.");
  }

  function playWind() {
    stopAmbientSound();
    initAudio();
    const buffer = createPinkNoiseBuffer(audioCtx, 4);
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 3.5;
    filter.frequency.value = 380;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.12;

    windLfo = audioCtx.createOscillator();
    windLfo.frequency.value = 0.06; // 16s gusts

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 160;

    windLfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGainMod = audioCtx.createGain();
    windGainMod.gain.value = 0.04;
    windLfo.connect(windGainMod);
    windGainMod.connect(gainNode.gain);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.75;

    ambientSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ambientGain);
    ambientGain.connect(audioAnalyser || audioCtx.destination);

    windLfo.start();
    ambientSource.start();
    activeSoundType = "wind";
    logger.info("Forest wind generator started.");
  }

  function playBinaural() {
    stopAmbientSound();
    initAudio();

    leftOsc = audioCtx.createOscillator();
    leftOsc.type = "sine";
    leftOsc.frequency.value = 140;

    rightOsc = audioCtx.createOscillator();
    rightOsc.type = "sine";
    rightOsc.frequency.value = 144; // 4Hz delta

    subOsc = audioCtx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.value = 55; // 55Hz grounding hum

    const merger = audioCtx.createChannelMerger(2);

    const leftGain = audioCtx.createGain();
    leftGain.gain.value = 0.07;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);

    const rightGain = audioCtx.createGain();
    rightGain.gain.value = 0.07;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);

    const subGain = audioCtx.createGain();
    subGain.gain.value = 0.035;
    subOsc.connect(subGain);
    subGain.connect(merger, 0, 0);
    subGain.connect(merger, 0, 1);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.8;

    merger.connect(ambientGain);
    ambientGain.connect(audioAnalyser || audioCtx.destination);

    leftOsc.start();
    rightOsc.start();
    subOsc.start();
    activeSoundType = "binaural";
    logger.info("Binaural beats (Deep Space Hum) started.");
  }

  function playSynth() {
    stopAmbientSound();
    initAudio();
    activeSoundType = "synth";

    synthOscillators = [];
    synthGains = [];

    synthFilter = audioCtx.createBiquadFilter();
    synthFilter.type = "lowpass";
    synthFilter.frequency.value = 350; // soft low-pass filter

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.45; // master synth volume

    synthFilter.connect(ambientGain);
    ambientGain.connect(audioAnalyser || audioCtx.destination);

    const chords = [
      [65.41, 98.0, 130.81, 164.81, 196.0], // C major-ish drone
      [87.31, 130.81, 174.61, 220.0, 261.63], // F major-ish drone
      [55.0, 82.41, 110.0, 130.81, 164.81], // A minor-ish drone
      [49.0, 73.42, 98.0, 123.47, 146.83], // G major-ish drone
    ];

    let currentChordIdx = 0;

    function playChord(frequencies) {
      const now = audioCtx.currentTime;

      // Fade out current oscillators
      synthGains.forEach((g) => {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + 1.5);
      });

      const oldOscs = [...synthOscillators];
      setTimeout(() => {
        oldOscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
          o.disconnect();
        });
      }, 1600);

      synthOscillators = [];
      synthGains = [];

      // Start new notes in chord
      frequencies.forEach((freq) => {
        const osc = audioCtx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(
          0.08 / frequencies.length,
          now + 2.0,
        );

        osc.connect(gainNode);
        gainNode.connect(synthFilter);

        osc.start(now);

        synthOscillators.push(osc);
        synthGains.push(gainNode);
      });
    }

    playChord(chords[currentChordIdx]);

    synthTimer = setInterval(() => {
      if (activeSoundType !== "synth") {
        clearInterval(synthTimer);
        return;
      }
      currentChordIdx = (currentChordIdx + 1) % chords.length;
      playChord(chords[currentChordIdx]);
    }, 7000);

    logger.info("Cozy Synth drone started.");
  }

  function updateVisualizer() {
    const path = document.getElementById("fVisualizer");
    if (!path) return;

    const isFocusOpen = document
      .getElementById("focusOverlay")
      ?.classList.contains("open");
    if (!isFocusOpen) {
      if (visualizerAnimFrame) {
        cancelAnimationFrame(visualizerAnimFrame);
        visualizerAnimFrame = null;
      }
      return;
    }

    // Reduced motion: skip the animated audio waveform entirely — clear the
    // path and don't schedule another frame. The timer ring + digits remain.
    if (reducedMotion()) {
      if (visualizerAnimFrame) {
        cancelAnimationFrame(visualizerAnimFrame);
        visualizerAnimFrame = null;
      }
      path.setAttribute("d", "");
      return;
    }

    visualizerAnimFrame = requestAnimationFrame(updateVisualizer);

    let dataArray = null;
    if (audioAnalyser && activeSoundType !== "none") {
      const bufferLength = audioAnalyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      audioAnalyser.getByteFrequencyData(dataArray);
    }

    const numPoints = 64;
    const baseRadius = 144;
    const cx = 150;
    const cy = 150;
    let points = [];

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      let offset = 0;

      if (dataArray) {
        // Map angle to frequency index (symmetrical)
        const dataIdx = Math.floor(
          Math.abs(Math.sin(angle)) * (dataArray.length - 1) * 0.6,
        );
        offset = (dataArray[dataIdx] / 255) * 15; // max 15px pulse
      } else {
        // Gentle breathing animation if no sound is active
        offset = Math.sin(Date.now() / 800 + angle * 2) * 1.5;
      }

      const r = baseRadius + offset;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    path.setAttribute("d", points.join(" ") + " Z");
  }

  function playFocusTicks() {
    stopAmbientSound();
    initAudio();
    activeSoundType = "ticks";
    function tick() {
      if (activeSoundType !== "ticks" || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.05,
      );
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    }
    tick();
    focusTicksTimer = setInterval(tick, 1000);
  }

  function updateAmbientSoundUI(soundType) {
    const buttons = document.querySelectorAll(
      "#fAmbientControls button[data-act='focus-sound']",
    );
    buttons.forEach((btn) => {
      const isPressed = btn.dataset.arg === soundType;
      btn.setAttribute("aria-pressed", isPressed ? "true" : "false");
    });
  }

  function playSuccessChime() {
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Could not play success chime:", e);
    }
  }

  function playLevelUpChime() {
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gainNode.gain.setValueAtTime(0, now + index * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.08, now + index * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          now + index * 0.08 + 0.35,
        );
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.4);
      });
    } catch (e) {
      console.warn("Could not play level up chime:", e);
    }
  }

  function showLevelUpModal(level) {
    openModal(
      "🎉 Level Up!",
      `<div style="text-align: center; padding: 12px 6px;">
        <div style="font-size: 4.5rem; margin-bottom: 12px; line-height: 1;">🏆</div>
        <h2 style="font-size: 2.2rem; margin: 0 0 8px; color: var(--accent); font-weight: 800;">Level ${level}</h2>
        <p style="font-size: 1.1rem; margin-bottom: 24px; color: var(--ink);">Awesome job! You are building incredible study habits. Keep focusing! 🚀</p>
        <button class="btn primary block" data-act="close-modal" style="font-size: 1.1rem; padding: 12px; margin-top: 16px;">Awesome! Let's go!</button>
      </div>`,
    );
  }

  function addPoints(amount) {
    if (!amount || amount <= 0) return;
    const oldLevel = Math.floor((state.points || 0) / 100) + 1;
    state.points = (state.points || 0) + amount;
    const newLevel = Math.floor(state.points / 100) + 1;

    // Add XP to garden and award water drops
    if (state.garden) {
      state.garden.xp = (state.garden.xp || 0) + amount;
      const oldWaterEarned = Math.floor((state.garden.xp - amount) / 10);
      const newWaterEarned = Math.floor(state.garden.xp / 10);
      if (newWaterEarned > oldWaterEarned) {
        state.garden.waterReservoir =
          (state.garden.waterReservoir || 0) +
          (newWaterEarned - oldWaterEarned);
      }
      updateGardenPlantStage();
    }

    save();

    // Direct DOM updates for XP tracking elements to avoid full redrawing
    const xpRemainder = state.points % 100;
    const circ = 2 * Math.PI * 40; // radius is 40
    const offset = circ * (1 - xpRemainder / 100);

    document.querySelectorAll(".xp-level-ring circle.prog").forEach((ring) => {
      ring.style.strokeDashoffset = offset;
    });
    document.querySelectorAll(".xp-level-number").forEach((el) => {
      el.textContent = newLevel;
    });
    document.querySelectorAll(".xp-details h4").forEach((el) => {
      el.textContent = `XP Level ${newLevel}`;
    });
    document.querySelectorAll(".points-bar-text").forEach((el) => {
      el.textContent = `${xpRemainder} / 100 XP to next level · ${state.points} total points`;
    });

    if (newLevel > oldLevel) {
      playLevelUpChime();
      triggerConfetti();
      showLevelUpModal(newLevel);
      render(); // Full render on level-up is appropriate since modal covers screen
    } else {
      playSuccessChime();
    }
  }

  // ---- Real-money allowance ledger ---------------------------------------
  const money = (n) =>
    `${state.rewards?.currency || "$"}${(Number(n) || 0).toFixed(2)}`;

  // Sum of money earned (not cashed out) so far today — used for the daily cap.
  function rewardsEarnedToday() {
    const r = state.rewards;
    if (!r) return 0;
    const today = todayKey();
    return r.ledger.reduce(
      (s, e) =>
        e.type === "earn" && String(e.ts).slice(0, 10) === today
          ? s + e.amount
          : s,
      0,
    );
  }

  // Award money for finishing a piece of work. `kind` keys into rewards.rates;
  // honors the per-day cap so a kid can't farm reminders for unlimited cash.
  function earnReward(kind, label) {
    const r = state.rewards;
    if (!r || !r.enabled) return;
    const rate = Number(r.rates?.[kind]) || 0;
    if (rate <= 0) return;
    let amt = rate;
    const cap = Number(r.dailyCap) || 0;
    if (cap > 0) amt = Math.min(amt, Math.max(0, cap - rewardsEarnedToday()));
    amt = Math.round(amt * 100) / 100;
    if (amt <= 0) return;
    r.balance = Math.round((r.balance + amt) * 100) / 100;
    r.ledger.unshift({
      id: uid("e"),
      ts: new Date().toISOString(),
      kind,
      label: String(label || kind).slice(0, 80),
      amount: amt,
      type: "earn",
    });
    if (r.ledger.length > 1000) r.ledger.length = 1000;
    // Don't save() here — callers already save() right after their own state
    // changes; this keeps earning atomic with the action that triggered it.
    toast(`${money(amt)} earned 💰`);
  }

  // ---- Weekly payday (auto-computed allowance cycle) ----------------------
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const ymd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  // The Monday (week start) for a given ISO date, as a YYYY-MM-DD key.
  function mondayOf(iso) {
    const d = parseLocal(iso) || startOfToday();
    const dow = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
    d.setDate(d.getDate() - dow);
    return ymd(d);
  }
  const thisWeekKey = () => mondayOf(todayKey());

  // A friendly "Jun 16 – 22" label for a week key.
  function weekLabel(weekKey) {
    const a = parseLocal(weekKey);
    const b = parseLocal(weekKey);
    b.setDate(b.getDate() + 6);
    const mon = (d) => d.toLocaleDateString(undefined, { month: "short" });
    const same = a.getMonth() === b.getMonth();
    return same
      ? `${mon(a)} ${a.getDate()} – ${b.getDate()}`
      : `${mon(a)} ${a.getDate()} – ${mon(b)} ${b.getDate()}`;
  }

  // Auto-compute one week's allowance straight from the ledger: per-category
  // totals, a perfect-week bonus, and the weekly cap. No stored state — the
  // ledger is the single source of truth, so this can never drift.
  function computeWeek(weekKey) {
    const r = state.rewards;
    const end = (() => {
      const d = parseLocal(weekKey);
      d.setDate(d.getDate() + 6);
      return ymd(d);
    })();
    const by = { task: 0, reminder: 0, routine: 0, focus: 0 };
    const days = new Set();
    let raw = 0;
    for (const e of r.ledger) {
      if (e.type !== "earn") continue;
      const d = String(e.ts).slice(0, 10);
      if (d < weekKey || d > end) continue;
      by[e.kind] = round2((by[e.kind] || 0) + e.amount);
      raw = round2(raw + e.amount);
      days.add(d);
    }
    const weekdays = [...days].filter((d) => {
      const dow = parseLocal(d).getDay();
      return dow >= 1 && dow <= 5;
    }).length;
    const bonus =
      Number(r.bonusPerfectWeek) > 0 && weekdays >= 5
        ? round2(r.bonusPerfectWeek)
        : 0;
    let total = round2(raw + bonus);
    const cap = Number(r.weeklyCap) || 0;
    const capped = cap > 0 && total > cap;
    if (capped) total = round2(cap);
    return {
      weekKey,
      end,
      by,
      raw,
      bonus,
      total,
      capped,
      daysActive: days.size,
      weekdays,
    };
  }

  const isWeekPaid = (weekKey) =>
    (state.rewards.payouts || []).some((p) => p.weekKey === weekKey);

  // Every distinct week that has any earnings, newest first.
  function earnedWeekKeys() {
    const set = new Set();
    for (const e of state.rewards.ledger)
      if (e.type === "earn" && e.ts) set.add(mondayOf(e.ts.slice(0, 10)));
    return [...set].sort().reverse();
  }

  // Past weeks (before the current one) with money still owed to the kid.
  function readyWeeks() {
    const now = thisWeekKey();
    return earnedWeekKeys()
      .filter((wk) => wk < now && !isWeekPaid(wk))
      .map(computeWeek)
      .filter((w) => w.total > 0);
  }
  const readyTotal = () =>
    round2(readyWeeks().reduce((s, w) => s + w.total, 0));

  const GRADIENTS = [
    ["", "Default Navy"],
    ["linear-gradient(135deg, #0d324d, #7f5a83)", "Aurora Twilight"],
    ["linear-gradient(135deg, #2b1055, #553c8b, #7597de)", "Cosmic Nebula"],
    ["linear-gradient(135deg, #370617, #6a040f, #ffba08)", "Sunset Glow"],
    ["linear-gradient(135deg, #134e5e, #71b280)", "Tropical Emerald"],
  ];

  function getGradientLevelRequired(gradientStr) {
    if (!gradientStr) return 0;
    if (gradientStr.includes("#0d324d")) return 3; // Aurora Twilight
    if (gradientStr.includes("#2b1055")) return 5; // Cosmic Nebula
    if (gradientStr.includes("#370617")) return 7; // Sunset Glow
    if (gradientStr.includes("#134e5e")) return 9; // Tropical Emerald
    return 0;
  }

  function xpLevelCardHTML() {
    const pts = state.points || 0;
    const lvl = Math.floor(pts / 100) + 1;
    const xpRemainder = pts % 100;
    const title =
      lvl >= 10
        ? "Focus Legend 👑"
        : lvl >= 6
          ? "Focus Master 🧙‍♂️"
          : lvl >= 3
            ? "Focus Knight 🛡️"
            : "Focus Padawan 🪴";
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - xpRemainder / 100);
    return `
      <div class="xp-level-card">
        <div class="xp-level-ring">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle class="track" cx="45" cy="45" r="${r}" fill="none" stroke-width="8"></circle>
            <circle class="prog" cx="45" cy="45" r="${r}" fill="none" stroke-width="8"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <div class="xp-level-number">${lvl}</div>
        </div>
        <div class="xp-details">
          <h4>XP Level ${lvl}</h4>
          <div class="level-title">${title}</div>
          <div class="points-bar-text">${xpRemainder} / 100 XP to next level · ${pts} total points</div>
        </div>
      </div>
    `;
  }

  function weeklyFocusChartHTML() {
    const days = [];
    const focusMins = [];
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = isoForOffset(-i);
      const act = state.activity[k] || { focusMin: 0 };
      days.push(labels[d.getDay()]);
      focusMins.push(act.focusMin || 0);
    }
    const maxVal = Math.max(...focusMins, 15);
    const chartHeight = 120;
    const chartWidth = 320;
    const barWidth = 24;
    const gap = 16;
    const barsHTML = focusMins
      .map((m, idx) => {
        const barHeight = (m / maxVal) * 80;
        const x = gap + idx * (barWidth + gap);
        const y = 90 - barHeight;
        return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--teal)" opacity="0.85">
            <title>${m} focus minutes</title>
          </rect>
          <text x="${x + barWidth / 2}" y="106" font-size="10" font-family="Plus Jakarta Sans" font-weight="700" fill="var(--muted)" text-anchor="middle">${days[idx]}</text>
          ${m > 0 ? `<text x="${x + barWidth / 2}" y="${y - 6}" font-size="9" font-family="Plus Jakarta Sans" font-weight="800" fill="var(--ink)" text-anchor="middle">${m}m</text>` : ""}
        </g>
      `;
      })
      .join("");
    return `
      <div class="chart-container">
        <div class="chart-header">📊 Weekly Focus Studio (Minutes)</div>
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="svg-chart">
          <line x1="0" y1="92" x2="${chartWidth}" y2="92" stroke="var(--line)" stroke-width="1.5"></line>
          ${barsHTML}
        </svg>
      </div>
    `;
  }

  function reflectionCardHTML() {
    const k = todayKey();
    const existing = state.reflections[k];
    if (existing) {
      return card(
        "reflection",
        "📓 Today's Reflection",
        "Great job checking out today!",
        `<div class="note">
          <p><b>Focus score:</b> ${existing.focus} / 5</p>
          <p><b>Mood score:</b> ${existing.mood} / 5</p>
          ${existing.text ? `<p><b>Gratitude/Notes:</b> ${esc(existing.text)}</p>` : ""}
         </div>`,
      );
    }
    const focusVal = window._pendingReflectionFocus || 0;
    const moodVal = window._pendingReflectionMood || 0;
    const textVal = window._pendingReflectionText || "";
    const ratingBtn = (field, val, active) => `
      <button type="button" class="rating-btn" data-act="set-reflection-rating" data-arg="${field}:${val}" aria-pressed="${active}">
        ${val}
      </button>
    `;
    return card(
      "reflection",
      "📓 End-of-Day Check-out",
      "Reflect on your focus and mood today.",
      `
      <div class="reflection-rating-row">
        <span class="reflection-rating-label">Focus Rating (1-5):</span>
        <div class="rating-buttons">
          ${[1, 2, 3, 4, 5].map((v) => ratingBtn("focus", v, focusVal === v)).join("")}
        </div>
      </div>
      <div class="reflection-rating-row">
        <span class="reflection-rating-label">Mood Rating (1-5):</span>
        <div class="rating-buttons">
          ${[1, 2, 3, 4, 5].map((v) => ratingBtn("mood", v, moodVal === v)).join("")}
        </div>
      </div>
      <div class="reflection-text-row">
        <div class="field">
          <label>One win or gratitude from today:</label>
          <input type="text" id="reflectionTextInput" value="${esc(textVal)}" placeholder="Something I learned or did well..." oninput="window._pendingReflectionText = this.value">
        </div>
      </div>
      <button class="btn primary block" data-act="save-reflection" style="margin-top:12px">
        💾 Save check-out
      </button>
      `,
    );
  }

  function reflectionChartHTML() {
    const dates = [];
    const focusRatings = [];
    const moodRatings = [];
    const sortedDates = Object.keys(state.reflections || {})
      .sort()
      .slice(-10);
    if (sortedDates.length < 2) {
      return `<div class="chart-container"><div class="chart-header">📈 Reflection Trends</div><div class="empty">🌱 Reflect for at least 2 days to see your trend graph!</div></div>`;
    }
    const chartHeight = 120;
    const chartWidth = 320;
    const padding = 20;
    const pointsFocus = [];
    const pointsMood = [];
    sortedDates.forEach((k, idx) => {
      const ref = state.reflections[k];
      const x =
        padding + (idx * (chartWidth - 2 * padding)) / (sortedDates.length - 1);
      const yFocus = 100 - (ref.focus - 1) * 20;
      const yMood = 100 - (ref.mood - 1) * 20;
      pointsFocus.push(`${x},${yFocus}`);
      pointsMood.push(`${x},${yMood}`);
    });
    const focusPath = pointsFocus.join(" ");
    const moodPath = pointsMood.join(" ");
    const focusDots = pointsFocus
      .map((p, idx) => {
        const [x, y] = p.split(",");
        const rating = state.reflections[sortedDates[idx]].focus;
        return `<circle cx="${x}" cy="${y}" r="4" fill="var(--teal)"><title>Focus: ${rating}/5</title></circle>`;
      })
      .join("");
    const moodDots = pointsMood
      .map((p, idx) => {
        const [x, y] = p.split(",");
        const rating = state.reflections[sortedDates[idx]].mood;
        return `<circle cx="${x}" cy="${y}" r="4" fill="var(--amber)"><title>Mood: ${rating}/5</title></circle>`;
      })
      .join("");
    return `
      <div class="chart-container">
        <div class="chart-header">📈 Reflection Trends (Last ${sortedDates.length} days)</div>
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="svg-chart">
          <line x1="${padding}" y1="20" x2="${chartWidth - padding}" y2="20" stroke="var(--line)" stroke-dasharray="2,2"></line>
          <line x1="${padding}" y1="60" x2="${chartWidth - padding}" y2="60" stroke="var(--line)" stroke-dasharray="2,2"></line>
          <line x1="${padding}" y1="100" x2="${chartWidth - padding}" y2="100" stroke="var(--line)" stroke-dasharray="2,2"></line>
          <polyline fill="none" stroke="var(--teal)" stroke-width="3" points="${focusPath}"></polyline>
          <polyline fill="none" stroke="var(--amber)" stroke-width="2.5" stroke-dasharray="4,2" points="${moodPath}"></polyline>
          ${focusDots}
          ${moodDots}
        </svg>
        <div class="row" style="justify-content:center;gap:12px;font-size:0.75rem;font-weight:700;margin-top:8px">
          <span style="color:var(--teal)">● Focus Rating</span>
          <span style="color:var(--amber)">● Mood Rating</span>
        </div>
      </div>
    `;
  }

  function getBadgesList() {
    const totalRoutines = Object.values(state.activity || {}).reduce(
      (acc, curr) => acc + (curr.routines || 0),
      0,
    );
    const hasDeepWork = Object.values(state.activity || {}).some(
      (act) => (act.focusMin || 0) >= 15,
    );
    const lvl = Math.floor((state.points || 0) / 100) + 1;

    return [
      {
        id: "first_steps",
        name: "First Steps",
        desc: "Complete 1 assignment",
        emoji: "🏃‍♂️",
        unlocked:
          state.assignments.filter((a) => a.status === "done").length >= 1,
      },
      {
        id: "deep_work",
        name: "Deep Work",
        desc: "Finish a 15+ min focus session",
        emoji: "⚡",
        unlocked: hasDeepWork,
      },
      {
        id: "consistency_king",
        name: "Consistency King",
        desc: "Build a 3-day streak",
        emoji: "🔥",
        unlocked: streak() >= 3,
      },
      {
        id: "routine_champion",
        name: "Routine Champion",
        desc: "Complete 3 checklists",
        emoji: "🔁",
        unlocked: totalRoutines >= 3,
      },
      {
        id: "mindful_mind",
        name: "Mindful Mind",
        desc: "Complete 3 check-outs",
        emoji: "🧠",
        unlocked: Object.keys(state.reflections || {}).length >= 3,
      },
      {
        id: "grandmaster",
        name: "Grandmaster",
        desc: "Reach XP Level 5",
        emoji: "🧙‍♂️",
        unlocked: lvl >= 5,
      },
    ];
  }

  function badgesGalleryHTML() {
    const badges = getBadgesList();
    const itemsHtml = badges
      .map((b) => {
        return `
        <div class="badge-card ${b.unlocked ? "unlocked" : "locked"}">
          <div class="badge-status">${b.unlocked ? "✅" : "🔒"}</div>
          <div class="badge-icon">${b.emoji}</div>
          <div class="badge-name">${esc(b.name)}</div>
          <div class="badge-desc">${esc(b.desc)}</div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="card badges-section">
        <h3>🏆 Achievements Badges</h3>
        <p class="sub">Level up and build habits to unlock badges.</p>
        <div class="badges-grid">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  async function selfTest() {
    logger.info("Starting System Self-Test...");

    // 1. IndexedDB Test
    try {
      const dbName = "focus-school-diagnostics";
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("test")) {
          db.createObjectStore("test");
        }
      };

      const db = await new Promise((resolve, reject) => {
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });

      const writeStart = performance.now();
      const transaction = db.transaction("test", "readwrite");
      const store = transaction.objectStore("test");
      store.put("val", "key");
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = (e) => reject(e.target.error);
      });
      const writeTime = performance.now() - writeStart;

      const readStart = performance.now();
      const transaction2 = db.transaction("test", "readonly");
      const store2 = transaction2.objectStore("test");
      const readRequest = store2.get("key");
      const readVal = await new Promise((resolve, reject) => {
        readRequest.onsuccess = () => resolve(readRequest.result);
        readRequest.onerror = (e) => reject(e.target.error);
      });
      const readTime = performance.now() - readStart;

      db.close();
      indexedDB.deleteDatabase(dbName);

      if (readVal === "val") {
        logger.info(
          `IndexedDB: OK (Write: ${writeTime.toFixed(1)}ms, Read: ${readTime.toFixed(1)}ms)`,
        );
        const el = document.getElementById("diagIdbStatus");
        if (el) {
          el.textContent = "OK";
          el.parentElement.className = "diag-stat ok";
        }
      } else {
        throw new Error("Value mismatch");
      }
    } catch (err) {
      logger.error(`IndexedDB test failed: ${err.message}`);
      const el = document.getElementById("diagIdbStatus");
      if (el) {
        el.textContent = "FAIL";
        el.parentElement.className = "diag-stat fail";
      }
    }

    // 2. LocalStorage Test
    try {
      const lsStart = performance.now();
      localStorage.setItem("__diag_test__", "hello");
      const lsVal = localStorage.getItem("__diag_test__");
      localStorage.removeItem("__diag_test__");
      const lsTime = performance.now() - lsStart;

      let totalUsed = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        totalUsed +=
          (key.length + (localStorage.getItem(key) || "").length) * 2;
      }
      const totalUsedKB = (totalUsed / 1024).toFixed(1);

      if (lsVal === "hello") {
        logger.info(
          `LocalStorage: OK (Speed: ${lsTime.toFixed(1)}ms, Used: ${totalUsedKB} KB)`,
        );
        const el = document.getElementById("diagLsStatus");
        if (el) {
          el.textContent = `OK (${totalUsedKB}KB)`;
          el.parentElement.className = "diag-stat ok";
        }
      } else {
        throw new Error("Value mismatch");
      }
    } catch (err) {
      logger.error(`LocalStorage test failed: ${err.message}`);
      const el = document.getElementById("diagLsStatus");
      if (el) {
        el.textContent = "FAIL";
        el.parentElement.className = "diag-stat fail";
      }
    }

    // 3. Network Latency Test
    try {
      const netStart = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("/api/state?ping=1", {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      const latency = performance.now() - netStart;
      if (res && res.ok) {
        logger.info(`Network Latency to /api/state: ${latency.toFixed(0)}ms`);
        const el = document.getElementById("diagNetStatus");
        if (el) {
          el.textContent = `${latency.toFixed(0)}ms`;
          el.parentElement.className = "diag-stat ok";
        }
      } else if (res) {
        logger.warn(`Network responded with status ${res.status}`);
        const el = document.getElementById("diagNetStatus");
        if (el) {
          el.textContent = `HTTP ${res.status}`;
          el.parentElement.className = "diag-stat fail";
        }
      } else {
        logger.warn("Sync server offline / unreachable (Local Mode)");
        const el = document.getElementById("diagNetStatus");
        if (el) {
          el.textContent = "Offline (Local)";
          el.parentElement.className = "diag-stat";
        }
      }
    } catch (err) {
      logger.error(`Network test failed: ${err.message}`);
      const el = document.getElementById("diagNetStatus");
      if (el) {
        el.textContent = "FAIL";
        el.parentElement.className = "diag-stat fail";
      }
    }

    // 4. Service Worker Check
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
          const swList = regs
            .map((r) =>
              r.active ? `active (${r.active.state})` : "waiting/installing",
            )
            .join(", ");
          logger.info(`Service Worker: Found registered SWs: ${swList}`);
          const el = document.getElementById("diagSwStatus");
          if (el) {
            el.textContent = "Registered";
            el.parentElement.className = "diag-stat ok";
          }
        } else {
          logger.warn("Service Worker: No active registrations found.");
          const el = document.getElementById("diagSwStatus");
          if (el) {
            el.textContent = "None";
            el.parentElement.className = "diag-stat fail";
          }
        }
      } else {
        logger.warn("Service Worker: Not supported.");
        const el = document.getElementById("diagSwStatus");
        if (el) {
          el.textContent = "Unsupported";
          el.parentElement.className = "diag-stat fail";
        }
      }
    } catch (err) {
      logger.error(`Service Worker check failed: ${err.message}`);
      const el = document.getElementById("diagSwStatus");
      if (el) {
        el.textContent = "FAIL";
        el.parentElement.className = "diag-stat fail";
      }
    }

    logger.info("Self-Test completed.");
  }

  window._cmdSelectedIndex = 0;
  window._cmdItems = [];

  let _cmdLastFocus = null;
  function openCommandBar() {
    const modal = document.getElementById("commandBarBack");
    if (!modal) return;
    // Remember what to return focus to, and expose the dialog to assistive tech
    // (it is authored aria-hidden so it's silent while closed).
    _cmdLastFocus =
      document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : document.getElementById("searchBtn");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    const input = document.getElementById("cmdInput");
    if (input) {
      input.value = "";
      input.focus();
    }
    renderCommandBarResults("");
  }

  function closeCommandBar() {
    const modal = document.getElementById("commandBarBack");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    // Restore focus to the trigger so keyboard/screen-reader users aren't
    // dumped at the top of the page.
    if (_cmdLastFocus && document.contains(_cmdLastFocus)) {
      try {
        _cmdLastFocus.focus();
      } catch {}
    }
    _cmdLastFocus = null;
  }

  function renderCommandBarResults(query) {
    query = (query || "").trim().toLowerCase();
    const resultsContainer = document.getElementById("cmdResults");
    if (!resultsContainer) return;
    const items = [];
    const navs = [
      { title: "🎯 Go to Now (Home)", act: "nav", arg: "home", badge: "nav" },
      { title: "📅 Go to Today", act: "nav", arg: "today", badge: "nav" },
      { title: "✅ Go to Tasks", act: "nav", arg: "tasks", badge: "nav" },
      { title: "📆 Go to Calendar", act: "nav", arg: "calendar", badge: "nav" },
      { title: "🔁 Go to Routines", act: "nav", arg: "routines", badge: "nav" },
      { title: "🏆 Go to Wins & Stats", act: "nav", arg: "wins", badge: "nav" },
      { title: "⚙️ Go to Settings", act: "nav", arg: "settings", badge: "nav" },
      {
        title: "☁️ Go to Backup & Sync",
        act: "nav",
        arg: "sync",
        badge: "nav",
      },
    ];
    const controls = [
      { title: "⏱️ Toggle Focus Session", act: "focus-toggle", badge: "cmd" },
      { title: "🎨 Cycle Theme Colors", act: "theme-cycle", badge: "cmd" },
      {
        title: "🌧️ Play Gentle Rain",
        act: "focus-sound",
        arg: "rain",
        badge: "audio",
      },
      {
        title: "🔥 Play Cozy Rumble",
        act: "focus-sound",
        arg: "rumble",
        badge: "audio",
      },
      {
        title: "🌊 Play Ocean Waves",
        act: "focus-sound",
        arg: "ocean",
        badge: "audio",
      },
      {
        title: "🌲 Play Forest Wind",
        act: "focus-sound",
        arg: "wind",
        badge: "audio",
      },
      {
        title: "🌌 Play Deep Space Hum",
        act: "focus-sound",
        arg: "binaural",
        badge: "audio",
      },
      {
        title: "⏱️ Play Focus Ticks",
        act: "focus-sound",
        arg: "ticks",
        badge: "audio",
      },
      {
        title: "🎹 Play Cozy Synth",
        act: "focus-sound",
        arg: "synth",
        badge: "audio",
      },
      {
        title: "🔇 Silence Background Sounds",
        act: "focus-sound",
        arg: "none",
        badge: "audio",
      },
    ];
    navs.concat(controls).forEach((item) => {
      if (
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.arg?.includes(query)
      ) {
        items.push(item);
      }
    });
    state.assignments.forEach((a) => {
      if (
        a.status !== "done" &&
        (!query || a.title.toLowerCase().includes(query))
      ) {
        items.push({
          title: `Focus: ${a.title}`,
          act: "focus-start-task",
          arg: a.id,
          badge: "task",
        });
      }
    });
    window._cmdItems = items;
    window._cmdSelectedIndex = Math.min(
      window._cmdSelectedIndex,
      items.length - 1,
    );
    if (window._cmdSelectedIndex < 0) window._cmdSelectedIndex = 0;
    resultsContainer.innerHTML = items
      .map((item, idx) => {
        const isSel = idx === window._cmdSelectedIndex;
        return `
        <div class="cmd-item ${isSel ? "selected" : ""}" data-idx="${idx}" data-act="cmd-trigger">
          <span class="cmd-title">${esc(item.title)}</span>
          <span class="cmd-badge">${item.badge}</span>
        </div>
      `;
      })
      .join("");
  }

  function triggerCommandItem(item) {
    closeCommandBar();
    if (item.act === "nav") {
      setView(item.arg);
    } else if (item.act === "focus-toggle") {
      if ($("#focusOverlay").classList.contains("open")) {
        focus.stop();
      } else {
        const next = rightNowTask();
        if (next) focus.start(next.id);
        else toast("No assignments to focus on!");
      }
    } else if (item.act === "theme-cycle") {
      const themes = ["light", "dark", "contrast"];
      const nextIdx =
        (themes.indexOf(state.settings.theme) + 1) % themes.length;
      state.settings.theme = themes[nextIdx];
      save();
      applyAppearance();
      render();
    } else if (item.act === "focus-sound") {
      ACTIONS["focus-sound"](null, item.arg);
      toast(`Background sound: ${item.arg}`);
    } else if (item.act === "focus-start-task") {
      focus.start(item.arg);
    }
  }

  function applyAppearance() {
    const s = state.settings;
    const root = document.documentElement;
    root.dataset.theme = s.theme;
    root.dataset.readable = s.readable ? "on" : "off";
    root.dataset.motion = s.motion;
    root.dataset.accent = s.accent;
    root.style.setProperty("--font-scale", s.fontScale);
    if (s.themeGradient) {
      root.style.setProperty("--theme-gradient", s.themeGradient);
    } else {
      root.style.removeProperty("--theme-gradient");
    }
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
    $("#brandName").textContent = s.studentName
      ? s.studentName.split(" ")[0] + " School"
      : "Focus School";
  }

  function updateHeaderStatus() {
    const chip = $("#connChip");
    if (!chip) return;
    const textEl = $("#connText");
    const online = navigator.onLine;

    chip.classList.remove(
      "online",
      "offline",
      "syncing",
      "synced",
      "offline-sync",
      "local",
    );

    if (!online) {
      chip.classList.add("offline");
      chip.title =
        "Offline — changes will save locally and sync when you're back online";
      if (textEl) textEl.textContent = "Offline — saved locally";
      return;
    }

    if (
      state &&
      state.settings &&
      state.settings.sync &&
      state.settings.sync.enabled
    ) {
      if (cloud.status === "syncing") {
        chip.classList.add("syncing");
        chip.title = "Syncing with Cloudflare KV...";
        if (textEl)
          textEl.innerHTML = `Syncing... <span class="sync-spinner">🔄</span>`;
      } else if (cloud.status === "synced") {
        chip.classList.add("synced");
        chip.title = "All changes synced to the cloud";
        if (textEl) textEl.textContent = "Synced ☁️";
      } else if (cloud.status === "offline") {
        chip.classList.add("offline-sync");
        chip.title = "Could not reach sync server (stored locally)";
        if (textEl) textEl.textContent = "Offline (Local)";
      } else {
        chip.classList.add("online");
        chip.title = "Connected to internet & ready to sync";
        if (textEl) textEl.textContent = "Online";
      }
    } else {
      chip.classList.add("local");
      chip.title = "Cloud sync is disabled. Storing locally.";
      if (textEl) textEl.textContent = "Local Only";
    }
  }

  function render() {
    applyAppearance();
    renderHero();
    $("#main").innerHTML = (VIEWS[view] || VIEWS.home)();
    renderTabbar();
    updateHeaderStatus();
    // The floating ＋ is context-aware: on the Health page it adds a custom
    // movement (editable), everywhere else it quick-adds an assignment.
    const fab = $("#fab");
    if (fab) {
      const onHealth = view === "health";
      fab.dataset.act = onHealth ? "health-add" : "quick-add";
      const fabLabel = onHealth ? "Add a movement" : "Quick add an assignment";
      fab.setAttribute("aria-label", fabLabel);
      fab.setAttribute("title", fabLabel);
    }
    if (view === "ai") {
      ensureKaTeX(function () {
        const scrollEl = $("#aiScroll");
        if (scrollEl) {
          try {
            window.renderMathInElement(scrollEl, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false },
                { left: "\\[", right: "\\]", display: true },
              ],
            });
          } catch (e) {}
        }
      });
    }
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
          <span class="tag" style="background:${esc(c.color)}55">${c.emoji || "📚"} ${esc(c.name)}</span>
          <span class="tag" ${overdueB ? 'style="background:#b3000f"' : daysUntil(t.due) === 0 ? 'style="background:#7a4d0a"' : ""}>${esc(dueLabel(t.due, t.dueTime))}</span>
          ${t.estimateMin ? `<span class="tag">~${t.estimateMin} min</span>` : ""}
          ${t.steps.length ? `<span class="tag">${pct}% done</span>` : ""}
        </div>
        <p class="now-cue">${cue}</p>
        ${
          t.steps.length
            ? `
          <ul class="steps" style="margin-top:12px; margin-bottom:8px; text-align:left; color:white; list-style:none; padding-left:0;">
            ${t.steps
              .map(
                (s) => `
              <li style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <input class="check" type="checkbox" data-check="step" data-id="${t.id}" data-sid="${s.id}" ${s.done ? "checked" : ""} aria-label="${esc(s.text)}" style="accent-color:var(--teal-bright);">
                <span class="steptext ${s.done ? "done" : ""}" style="color:white; ${s.done ? "opacity:0.6; text-decoration:line-through;" : ""}">${esc(s.text)}</span>
              </li>
            `,
              )
              .join("")}
          </ul>
        `
            : ""
        }
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
            ${showClass ? `<span class="pill" style="background:${esc(c.color)}1f;color:var(--ink)"><span style="margin-right:4px">${c.emoji || "📚"}</span>${esc(c.name)}</span>` : ""}
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
    const handle =
      view === "home"
        ? `<button class="card-drag-handle" aria-label="Reorder this card — drag, or focus and press the up and down arrow keys" title="Drag, or use ↑ ↓ keys, to reorder">⋮⋮</button>`
        : "";
    return `<section class="card" data-card="${key}"><div class="head"><div><h3>${esc(title)}</h3>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}</div>${handle}</div>${body}</section>`;
  }
  function emptyState(emoji, text) {
    return `<div class="empty"><div class="big-emoji" aria-hidden="true">${emoji}</div><p>${esc(text)}</p></div>`;
  }

  // "Afternoon Plan" — turns the open-work pile into an ordered, time-boxed
  // sequence a 7th grader can just do top-to-bottom, with a short break between
  // each task and a realistic "done by ~4:35" finish estimate. Each step starts
  // the focus timer for that exact assignment. Purely derived from existing
  // data (assignments, estimateMin, urgency sort, defaultFocusMin) — nothing new
  // is persisted, so it stays correct across devices with zero migration.
  function planCard() {
    const picks = sortByUrgency(openTasks()).slice(0, 5);
    if (!picks.length) {
      return card(
        "plan",
        "🗺️ Afternoon Plan",
        "Your work, in the order to do it.",
        emptyState("🎉", "Nothing to plan right now — you're caught up!"),
      );
    }
    const focusMin = clamp(Number(state.settings.defaultFocusMin) || 15, 5, 60);
    const now = new Date();
    const atLabel = (mins) =>
      new Date(now.getTime() + mins * 60000).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    let running = 0;
    const rows = [];
    picks.forEach((a, i) => {
      const c = cls(a.classId);
      const est = clamp(Number(a.estimateMin) || focusMin, 5, 90);
      const overdue = a.due && daysUntil(a.due) < 0;
      rows.push(
        `<li class="plan-step${overdue ? " overdue" : ""}">
          <span class="plan-num" aria-hidden="true">${i + 1}</span>
          <span class="plan-info"><b>${esc(a.title)}</b>
            <span class="plan-meta">${c.emoji || "📚"} ${esc(c.name)} · ~${est} min · start ~${atLabel(running)}</span></span>
          <button class="btn primary sm plan-go" data-act="focus-start" data-id="${a.id}" aria-label="Start ${esc(a.title)} now">▶ Start</button>
        </li>`,
      );
      running += est;
      if (i < picks.length - 1) {
        rows.push(
          `<li class="plan-break" aria-hidden="true">☕ 5-min brain break</li>`,
        );
        running += 5;
      }
    });
    const intro = `<p class="sub plan-intro">Do them top to bottom. Finish by about <b>${atLabel(running)}</b> — roughly ${running} min with breaks. 💪</p>`;
    return card(
      "plan",
      "🗺️ Afternoon Plan",
      "Your work, in the order to do it.",
      intro + `<ol class="plan-list">${rows.join("")}</ol>`,
    );
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
                  return `<div class="item"><div class="head"><div><h4>${esc(a.title)}</h4><p class="meta">${esc(dueLabel(a.due, a.dueTime))} · ${c.emoji || "📚"} ${esc(c.name)}</p></div><div class="row"><button class="btn primary sm" data-act="complete" data-id="${a.id}">✓ Done</button></div></div></div>`;
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

  const TODO_REPEAT_OPTS = [
    ["none", "Once"],
    ["daily", "Daily"],
    ["weekdays", "Weekdays"],
    ["weekends", "Weekends"],
    ["weekly", "Weekly"],
    ["monthly", "Monthly"],
    ["yearly", "Yearly"],
  ];
  function todoCard() {
    const list = todaysTodos();
    const openCount = list.filter((t) => !todoDoneToday(t)).length;
    const repOpts = (cur) =>
      TODO_REPEAT_OPTS.map(
        ([v, l]) =>
          `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`,
      ).join("");
    const rows = list.length
      ? `<ul class="steps">${list
          .map((t) => {
            const dn = todoDoneToday(t);
            const rep = isTodoRecurring(t)
              ? ` <small class="muted">· 🔁 ${esc(REPEAT_LABEL[t.repeat] || "Repeats")}</small>`
              : "";
            const controls = dn
              ? ""
              : `<select class="todo-repeat-picker" data-id="${t.id}" aria-label="Repeat" title="Repeat">${repOpts(t.repeat)}</select><input type="time" class="todo-time-picker" data-id="${t.id}" value="${t.time || ""}" aria-label="Set time" title="Time">`;
            return `<li><input class="check" type="checkbox" data-check="todo" data-id="${t.id}" ${dn ? "checked" : ""} aria-label="${esc(t.text)}"><span class="steptext ${dn ? "done" : ""}">${esc(t.text)}${rep}</span>${controls}<button class="btn danger sm" data-act="del-todo" data-id="${t.id}" aria-label="Delete: ${esc(t.text)}">✕</button></li>`;
          })
          .join("")}</ul>`
      : emptyState("📝", "Nothing yet. Add a to-do or reminder below.");
    return card(
      "todos",
      "✅ To-do / Reminders",
      openCount ? `${openCount} left today` : "Your to-dos and reminders.",
      `${rows}
       <div class="row" style="margin-top:10px">
         <input id="todoInput" placeholder="Add a to-do or reminder…" style="flex:1" aria-label="New to-do or reminder">
         <button class="btn primary" data-act="add-todo">＋ Add</button>
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
            return `<div class="item ${stateCls}"><div class="head"><div><h4>${esc(a.title)}</h4><p class="meta">${dueIcon(n)} ${esc(dueLabel(a.due, a.dueTime))} · ${c.emoji || "📚"} ${esc(c.name)}</p></div><div class="row"><button class="btn primary sm" data-act="complete" data-id="${a.id}">✓ Done</button><button class="btn sm" data-act="open-task" data-id="${a.id}" aria-label="Edit ${esc(a.title)}">✏️</button></div></div></div>`;
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
    const rem = todaysTodos()
      .filter((t) => !todoDoneToday(t) && t.time)
      .slice(0, 4);
    const gev = gcalToday();
    const remRow = (t) =>
      `<div class="item"><div class="head"><div><h4>⏰ ${esc(t.text)}</h4><p class="meta">${t.time ? "⏰ " + esc(t.time) : "Reminder"}${isTodoRecurring(t) ? " · 🔁 " + esc(REPEAT_LABEL[t.repeat] || "Repeats") : ""}</p></div><div class="row"><button class="btn primary sm" data-act="todo-quickdone" data-id="${t.id}" aria-label="Mark done: ${esc(t.text)}">✓</button></div></div></div>`;
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

  function renderFilteredTasksListHtml(filters) {
    let open = openTasks();

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      open = open.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q)),
      );
    }

    if (filters.classId && filters.classId !== "all") {
      open = open.filter((a) => a.classId === filters.classId);
    }

    if (filters.priority && filters.priority !== "all") {
      open = open.filter((a) => a.priority === filters.priority);
    }

    if (filters.sortBy === "urgency") {
      open = sortByUrgency(open);
    } else if (filters.sortBy === "due") {
      open.sort((a, b) => {
        if (!a.due) return 1;
        if (!b.due) return -1;
        return (
          a.due.localeCompare(b.due) ||
          (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99")
        );
      });
    } else if (filters.sortBy === "title") {
      open.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sortBy === "priority") {
      const weight = { high: 3, med: 2, low: 1 };
      open.sort(
        (a, b) =>
          (weight[b.priority] || 0) - (weight[a.priority] || 0) ||
          urgency(b) - urgency(a),
      );
    }

    let listContent = "";
    if (open.length === 0) {
      listContent = emptyState(
        "🔍",
        "No matching tasks found. Adjust your filters!",
      );
    } else if (filters.sortBy === "title" || filters.sortBy === "priority") {
      listContent = open.map((a) => taskItem(a)).join("");
    } else {
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
      listContent = buckets
        .filter(([, list]) => list.length)
        .map(
          ([label, list]) =>
            `<div class="section-title">${label} (${list.length})</div>${list.map((a) => taskItem(a)).join("")}`,
        )
        .join("");
    }

    const recentDone = state.assignments
      .filter((a) => a.status === "done")
      .sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1))
      .slice(0, 6);

    const doneContent = recentDone.length
      ? `<div class="section-title">✓ Recently finished</div>${recentDone.map((a) => taskItem(a)).join("")}`
      : "";

    return listContent + doneContent;
  }

  window._onTaskFilterChange = () => {
    const qInp = document.getElementById("taskSearchInput");
    const classF = document.getElementById("taskClassFilter");
    const priF = document.getElementById("taskPriorityFilter");
    const sortS = document.getElementById("taskSortSelect");

    window._taskFilters = {
      query: qInp ? qInp.value : "",
      classId: classF ? classF.value : "all",
      priority: priF ? priF.value : "all",
      sortBy: sortS ? sortS.value : "urgency",
    };

    const container = document.getElementById("tasksListContainer");
    if (container) {
      container.innerHTML = renderFilteredTasksListHtml(window._taskFilters);
    }
  };

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------
  // ===== Helpers for Homework Plan, Calming, AI Support, goals, routines =====
  function routineDaysLabel(r) {
    if (!r.days || !r.days.length || r.days.length === 7) return "Every day";
    const wd = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    if (r.days.length === 5 && wd.every((d) => r.days.includes(d)))
      return "Weekdays";
    if (r.days.length === 2 && r.days.includes("Sat") && r.days.includes("Sun"))
      return "Weekends";
    return r.days.join(", ");
  }
  function routineOccursOn(r, when = new Date()) {
    if (!r.days || !r.days.length) return true;
    const i = (when.getDay() + 6) % 7; // 0=Mon..6=Sun
    return r.days.includes(DAYS[i]);
  }
  function routineOccursToday(r) {
    return routineOccursOn(r);
  }
  const fmtClock = (s) => {
    s = Math.max(0, Math.round(s));
    return (
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  };

  // ---- Homework Plan inline timers (work a little, then take a break) ----
  const HW = { t: {} }; // tid -> { remaining, total, running, handle }
  function hwPaint(tid) {
    const el = document.getElementById("hwt-" + tid);
    if (!el) return;
    const t = HW.t[tid];
    el.textContent = fmtClock(t ? t.remaining : 0);
    el.classList.toggle("running", !!(t && t.running));
    el.classList.toggle("paused", !!(t && !t.running && t.remaining > 0));
  }
  function hwTick(tid) {
    const t = HW.t[tid];
    if (!t) return;
    t.remaining -= 1;
    if (t.remaining <= 0) {
      t.remaining = 0;
      hwPauseTimer(tid);
      hwPaint(tid);
      hwDone(tid);
    } else hwPaint(tid);
  }
  function hwStart(tid, mins) {
    const total = (Number(mins) || 5) * 60;
    if (HW.t[tid] && HW.t[tid].handle) clearInterval(HW.t[tid].handle);
    HW.t[tid] = { remaining: total, total, running: true, handle: null };
    HW.t[tid].handle = setInterval(() => hwTick(tid), 1000);
    hwPaint(tid);
  }
  function hwPauseTimer(tid) {
    const t = HW.t[tid];
    if (!t) return;
    if (t.handle) clearInterval(t.handle);
    t.handle = null;
    t.running = false;
    hwPaint(tid);
  }
  function hwResume(tid) {
    const t = HW.t[tid];
    if (!t || t.running || t.remaining <= 0) return;
    t.running = true;
    t.handle = setInterval(() => hwTick(tid), 1000);
    hwPaint(tid);
  }
  function hwToggle(tid) {
    const t = HW.t[tid];
    if (t && t.running) hwPauseTimer(tid);
    else hwResume(tid);
  }
  function hwReset(tid) {
    const t = HW.t[tid];
    if (t && t.handle) clearInterval(t.handle);
    delete HW.t[tid];
    hwPaint(tid);
  }
  function hwDone() {
    try {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch {}
    toast("⏰ Time's up — great work!");
    triggerConfetti();
  }
  function hwTimerCell(tid, presets) {
    const cur = HW.t[tid];
    return (
      '<div class="hw-timer"><div class="hw-time' +
      (cur && cur.running ? " running" : "") +
      '" id="hwt-' +
      tid +
      '">' +
      fmtClock(cur ? cur.remaining : 0) +
      '</div><div class="hw-chips">' +
      presets
        .map(
          (m) =>
            '<button class="btn sm" data-act="hw-start" data-id="' +
            tid +
            '" data-arg="' +
            m +
            '">' +
            m +
            "m</button>",
        )
        .join("") +
      '<button class="btn sm" data-act="hw-custom" data-id="' +
      tid +
      '" aria-label="Choose your own time">✏️</button>' +
      '<button class="btn sm" data-act="hw-toggle" data-id="' +
      tid +
      '" aria-label="Pause or resume">⏯</button>' +
      '<button class="btn sm" data-act="hw-reset" data-id="' +
      tid +
      '" aria-label="Reset">↺</button></div></div>'
    );
  }

  // ---- Calming content ----
  const CALM_PHRASES = [
    "This feeling will pass. I just have to breathe.",
    "I can do hard things, one small step at a time.",
    "Right now, I am safe. Right now, I am okay.",
    "I don't have to be perfect. I just have to start.",
    "My brain is allowed to take a break.",
    "Slow breath in… slow breath out. I've got this.",
    "One thing at a time. That's all I need to do.",
    "Mistakes help me learn. They don't make me less.",
    "I am calm. I am steady. I am ready.",
    "It's okay to pause. Resting is part of working.",
  ];
  let calmIdx = 0;
  // Guided breathing balloon: tap to start an in / hold / out cycle.
  let breatheOn = false;
  let breatheTimer = null;
  const BREATHE_STEPS = [
    ["Breathe in…", 4000, "in"],
    ["Hold", 2000, "hold"],
    ["Breathe out…", 4000, "out"],
  ];
  function breatheStop() {
    breatheOn = false;
    if (breatheTimer) {
      clearTimeout(breatheTimer);
      breatheTimer = null;
    }
    const b = document.getElementById("breatheBubble");
    if (b) b.classList.remove("in", "hold", "out", "breathing");
    const p = document.getElementById("breathePhase");
    if (p) p.textContent = "Tap to start";
  }
  function breatheRun(i) {
    if (!breatheOn) return;
    const b = document.getElementById("breatheBubble");
    const p = document.getElementById("breathePhase");
    if (!b || !p) {
      breatheStop();
      return;
    }
    const [label, ms, cls] = BREATHE_STEPS[i % BREATHE_STEPS.length];
    b.classList.remove("in", "hold", "out");
    b.classList.add("breathing", cls);
    p.textContent = label;
    breatheTimer = setTimeout(() => breatheRun(i + 1), ms);
  }

  // ---- Daily goal suggestions (the visible set rotates each week) ----
  const GOAL_BANK = [
    "Finish my math homework before dinner",
    "Turn in one assignment I've been putting off",
    "Read for 20 minutes",
    "Ask a teacher one question I'm unsure about",
    "Pack my bag tonight so the morning is easy",
    "Start my biggest assignment first",
    "Study my notes for 15 minutes",
    "Write down every assignment in my planner",
    "Take a real break after I focus",
    "Do my work without my phone nearby",
    "Check my grades and pick one to improve",
    "Break a big task into small steps",
    "Finish one worksheet completely",
    "Email a teacher I owe a message",
    "Organize my backpack and folders",
    "Review what's due this week",
    "Spend 25 focused minutes on reading",
    "Get one assignment fully done and checked",
    "Plan tomorrow before I go to bed",
    "Practice the hardest problem until it clicks",
    "Clean up my workspace before I start",
    "Ask for help instead of giving up",
    "Drink water and stretch between tasks",
    "Be proud of finishing, even if it's not perfect",
  ];
  function weekIndex() {
    const d = startOfToday();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return d.getFullYear() * 53 + Math.floor((d - jan1) / 604800000);
  }
  function goalSuggestions() {
    const wk = weekIndex();
    const n = GOAL_BANK.length;
    const out = [];
    for (let i = 0; i < 6; i++) out.push(GOAL_BANK[(wk * 6 + i) % n]);
    return out;
  }

  // ---- AI Support (Gemini) chat, runtime-only (no PII persisted) ----
  let AI_CHAT = [];
  let aiBusy = false;
  let aiImage = null; // { dataUrl, mime, base64, name }
  const AI_PROMPT_GROUPS = [
    [
      "I'm stuck",
      [
        "Help me start my homework",
        "Break this into small steps",
        "Give me a hint, not the answer",
      ],
    ],
    [
      "Explain it",
      [
        "Explain this in a simpler way",
        "Give me an example",
        "What does this word mean?",
      ],
    ],
    [
      "Check my work",
      [
        "Check my thinking",
        "Did I do this right?",
        "How can I make this better?",
      ],
    ],
    ["Feelings", ["I feel overwhelmed", "Help me focus"]],
  ];

  const VIEWS = {
    home() {
      const open = openTasks();
      const next = sortByUrgency(
        open.filter((a) => daysUntil(a.due) > 0 && daysUntil(a.due) <= 7),
      ).slice(0, 3);
      const routine = routineForHome();
      const map = {
        glance: glanceCard(),
        plan: planCard(),
        payday: paydayCard(),
        calendar: calendarCard(),
        todos: todoCard(),
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

      let welcomeBanner = "";
      if (state.assignments.length === 0 && !state.settings.welcomeDismissed) {
        welcomeBanner = `
          <div class="card feature welcome-card" style="margin-bottom: 16px;">
            <div class="head">
              <div>
                <h3>👋 Welcome to Focus School!</h3>
                <p class="sub">Sync across your devices in seconds.</p>
              </div>
            </div>
            <p style="font-size: 0.88rem; margin: 0 0 12px; color: var(--muted);">If you already use Focus School on another computer or phone, click <b>Link Device</b>. Otherwise, start adding tasks!</p>
            <div class="row">
              <button class="btn primary sm" data-act="enter-code">⌨️ Link Device</button>
              <button class="btn sm" data-act="dismiss-welcome">Start Fresh</button>
            </div>
          </div>
        `;
      }

      // A always-present tile so adding, hiding, or rearranging cards is
      // discoverable right from the Now screen (no digging through Settings).
      // It also keeps the masonry columns balanced instead of leaving a gap
      // beside a tall card like the calendar.
      const hiddenCount = state.settings.hiddenCards.filter((k) =>
        CARDS.some((c) => c[0] === k),
      ).length;
      const customizeTile = `<button type="button" class="card add-card-tile" data-act="nav" data-arg="settings" aria-label="Add, hide, or rearrange your Now-screen cards">
        <span class="add-card-ic" aria-hidden="true">＋</span>
        <span class="add-card-text"><b>Add or arrange cards</b><small>${hiddenCount ? `${hiddenCount} card${hiddenCount === 1 ? "" : "s"} hidden — tap to show` : "Show, hide & reorder"}</small></span>
      </button>`;

      const arrangeBar =
        order.length > 1
          ? `<div class="arrange-bar${arrangeMode ? " on" : ""}">
              <button class="btn sm${arrangeMode ? " primary" : ""}" data-act="toggle-arrange" aria-pressed="${arrangeMode}">${arrangeMode ? "✓ Done arranging" : "⠿ Arrange cards"}</button>
              ${arrangeMode ? `<span class="arrange-hint" role="status">Drag any card to move it, then tap <b>Done</b>.</span>` : ""}
            </div>`
          : "";
      return `${welcomeBanner}${checkinBanner()}${captureBanner()}${arrangeBar}<div class="home-grid${arrangeMode ? " arranging" : ""}">${order.map((k) => map[k] || "").join("")}${arrangeMode ? "" : customizeTile}</div>`;
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
          "Pick a suggestion or write your own.",
          `<div class="field"><label>Choose a goal</label><select id="goalSelect">
             <option value="">— Pick a suggestion —</option>
             ${goalSuggestions()
               .map(
                 (g) =>
                   `<option value="${esc(g)}" ${goalToday === g ? "selected" : ""}>${esc(g)}</option>`,
               )
               .join("")}
             <option value="__custom__">✏️ Write my own…</option>
           </select></div>
           <div class="field"><label>My goal</label><input id="goalInput" placeholder="Example: Finish my math worksheet" value="${esc(goalToday)}"></div>
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
      const filters = (window._taskFilters = window._taskFilters || {
        query: "",
        classId: "all",
        priority: "all",
        sortBy: "urgency",
      });

      const classOpts = state.classes
        .map(
          (c) =>
            `<option value="${c.id}" ${filters.classId === c.id ? "selected" : ""}>${c.emoji || "📚"} ${esc(c.name)}</option>`,
        )
        .join("");

      const filterBar = `
        <div class="tasks-filter-bar" id="tasksFilterBar">
          <input type="text" id="taskSearchInput" placeholder="🔍 Search tasks..." value="${esc(filters.query)}" aria-label="Search tasks">
          <select id="taskClassFilter" aria-label="Filter by Class" onchange="window._onTaskFilterChange()">
            <option value="all" ${filters.classId === "all" ? "selected" : ""}>All Classes</option>
            ${classOpts}
          </select>
          <select id="taskPriorityFilter" aria-label="Filter by Priority" onchange="window._onTaskFilterChange()">
            <option value="all" ${filters.priority === "all" ? "selected" : ""}>All Priorities</option>
            <option value="high" ${filters.priority === "high" ? "selected" : ""}>🔴 High</option>
            <option value="med" ${filters.priority === "med" ? "selected" : ""}>🟡 Medium</option>
            <option value="low" ${filters.priority === "low" ? "selected" : ""}>🟢 Low</option>
          </select>
          <select id="taskSortSelect" aria-label="Sort by" onchange="window._onTaskFilterChange()">
            <option value="urgency" ${filters.sortBy === "urgency" ? "selected" : ""}>Sort by Urgency</option>
            <option value="due" ${filters.sortBy === "due" ? "selected" : ""}>Sort by Due Date</option>
            <option value="title" ${filters.sortBy === "title" ? "selected" : ""}>Sort by Name</option>
            <option value="priority" ${filters.sortBy === "priority" ? "selected" : ""}>Sort by Priority</option>
          </select>
        </div>
      `;

      const initialListHtml = renderFilteredTasksListHtml(filters);

      return `
        <div class="view-head">
          <h2 class="view-title">All tasks</h2>
          <button class="btn primary" data-act="quick-add">＋ Add assignment</button>
        </div>
        ${filterBar}
        <div id="tasksListContainer">${initialListHtml}</div>
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
              `${done.length}/${r.items.length} done today · 🔁 ${routineDaysLabel(r)}`,
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

    reading() {
      const completedDays = Object.values(state.readingProgress || {}).filter(
        (x) => x.done,
      ).length;
      const totalDays = READING_DAYS.length;
      const percent = totalDays
        ? Math.round((completedDays / totalDays) * 100)
        : 0;
      const transition = state.bookTransition || {
        finishedB: "",
        responseB: false,
        startC: "",
        rememberText: "",
      };

      let html = `
        <div class="view-head">
          <h2 class="view-title">📚 Summer Reading</h2>
          <p class="meta">June 29 - August 3, 2026</p>
        </div>
        
        <div class="card status-card" style="margin-bottom: 16px; background: linear-gradient(135deg, var(--teal) 0%, var(--teal-bright) 100%); color: white; border: none;">
          <div class="head">
            <div>
              <h3 style="color: white; margin: 0;">Overall Progress</h3>
              <p style="color: rgba(255,255,255,0.85); font-size: 0.88rem; margin: 4px 0 0 0;">Keep up the great reading habit!</p>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800;">${completedDays} / ${totalDays} Days</div>
          </div>
          <div class="progress-bar-container" style="background: rgba(255,255,255,0.25); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 12px;">
            <div class="progress-bar-fill" style="background: white; width: ${percent}%; height: 100%; transition: width 0.3s ease;"></div>
          </div>
          <div style="text-align: right; font-size: 0.75rem; margin-top: 4px; color: rgba(255,255,255,0.9); font-weight: 600;">${percent}% Completed</div>
        </div>
        
        <div class="note" style="margin-bottom: 16px;">
          📖 <b>Daily Student Routine:</b> (1) Read the assigned pages. (2) Check "Done". (3) Write 1-2 sentence gist. (4) Note one quote/evidence detail. (5) Answer the focus question.
        </div>
      `;

      const botrDays = READING_DAYS.filter(
        (d) => d.book === "Blood on the River",
      );
      const tcDays = READING_DAYS.filter((d) => d.book === "The Crossover");

      const renderDayRow = (d) => {
        const prog = state.readingProgress[d.id] || {
          done: false,
          gist: "",
          evidence: "",
          response: "",
        };
        const isExpanded = state.expandedReadingDay === d.id;

        return `
          <div class="card reading-day-card ${prog.done ? "done-day" : ""}" style="margin-bottom: 10px; border-left: 4px solid ${d.book === "Blood on the River" ? "#147c78" : "#c0473a"};">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" style="width: 20px; height: 20px; cursor: pointer; flex-shrink: 0;" data-act="toggle-reading-done" data-id="${d.id}" ${prog.done ? "checked" : ""} aria-label="Mark ${esc(d.dayName)} ${esc(d.date)} reading done">
                <div style="cursor: pointer; flex: 1;" data-act="toggle-reading-expand" data-id="${d.id}">
                  <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px;">${d.dayName} ${d.date}</div>
                  <div style="font-size: 0.95rem; font-weight: 700; margin: 2px 0;">${esc(d.read)}</div>
                  <div style="font-size: 0.85rem; color: var(--text); opacity: 0.85;"><b>Focus:</b> ${esc(d.prompt)}</div>
                </div>
              </div>
              <button class="btn sm icon-only" data-act="toggle-reading-expand" data-id="${d.id}" style="background: none; border: none; font-size: 1rem;" aria-label="Toggle details">
                ${isExpanded ? "▲" : "▼"}
              </button>
            </div>
            
            ${
              isExpanded
                ? `
              <div class="reading-details" style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--line); display: flex; flex-direction: column; gap: 10px;">
                <div class="field">
                  <label style="font-size: 0.75rem; font-weight: 800; color: var(--muted); text-transform: uppercase;">1. Gist (1-2 sentences)</label>
                  <textarea data-reading-field="gist" data-id="${d.id}" placeholder="Write the main idea of this reading..." style="width:100%; min-height: 48px; font-size: 0.88rem; padding: 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">${esc(prog.gist)}</textarea>
                </div>
                <div class="field">
                  <label style="font-size: 0.75rem; font-weight: 800; color: var(--muted); text-transform: uppercase;">2. Evidence (One quote or key detail)</label>
                  <textarea data-reading-field="evidence" data-id="${d.id}" placeholder="Write a quote or specific detail as evidence..." style="width:100%; min-height: 48px; font-size: 0.88rem; padding: 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">${esc(prog.evidence)}</textarea>
                </div>
                <div class="field">
                  <label style="font-size: 0.75rem; font-weight: 800; color: var(--muted); text-transform: uppercase;">3. Response (Answer the focus question)</label>
                  <textarea data-reading-field="response" data-id="${d.id}" placeholder="Write your response to the focus question..." style="width:100%; min-height: 56px; font-size: 0.88rem; padding: 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">${esc(prog.response)}</textarea>
                </div>
                <div style="font-size: 0.75rem; color: var(--muted); text-align: right; font-style: italic;">✍️ Changes save automatically</div>
              </div>
            `
                : ""
            }
          </div>
        `;
      };

      html += `<div class="section-title" style="color: #147c78; font-size: 1.1rem; border-bottom: 2px solid #147c78; padding-bottom: 4px; margin: 20px 0 10px 0;">📚 Book 1: Blood on the River</div>`;
      html += botrDays.map(renderDayRow).join("");

      html += `
        <div class="card transition-card" style="margin: 20px 0; border: 2px dashed #d99028; background: color-mix(in srgb, #d99028 8%, var(--paper)); padding: 16px; border-radius: 12px;">
          <h3 style="color: #d99028; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">🔄 Book Transition Space</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="field">
                <label style="font-size: 0.75rem; font-weight: 800;">I finished Blood on the River on:</label>
                <input type="text" data-transition-field="finishedB" placeholder="e.g. July 21" value="${esc(transition.finishedB)}" style="width:100%; padding: 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">
              </div>
              <div class="field">
                <label style="font-size: 0.75rem; font-weight: 800;">The Crossover begins on:</label>
                <input type="text" data-transition-field="startC" placeholder="e.g. July 22" value="${esc(transition.startC)}" style="width:100%; padding: 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <input type="checkbox" data-transition-check="responseB" style="width:18px; height:18px;" ${transition.responseB ? "checked" : ""} aria-label="Final Response Completed">
              <label style="font-size: 0.88rem; font-weight: 700; cursor: pointer;">Final Response Completed</label>
            </div>
            <div class="field">
              <label style="font-size: 0.75rem; font-weight: 800;">One thing I want to remember from Blood on the River before starting The Crossover:</label>
              <textarea data-transition-field="rememberText" placeholder="Write down your thoughts..." style="width:100%; min-height: 56px; padding: 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">${esc(transition.rememberText)}</textarea>
            </div>
          </div>
        </div>
      `;

      html += `<div class="section-title" style="color: #c0473a; font-size: 1.1rem; border-bottom: 2px solid #c0473a; padding-bottom: 4px; margin: 20px 0 10px 0;">🏀 Book 2: The Crossover</div>`;
      html += tcDays.map(renderDayRow).join("");

      html += `
        <div class="card catchup-card" style="margin: 20px 0 80px 0; background: var(--paper); border: 1px solid var(--line);">
          <h4 style="margin: 0 0 8px 0; color: var(--navy);">📅 Built-In Catch-Up Days</h4>
          <p style="font-size: 0.88rem; color: var(--muted); margin: 0; line-height: 1.4;">
            No required weekend reading is assigned. Use <b>July 4-5, July 11-12, July 18-19, July 25-26, and August 1-2</b> for catch-up, rereading, annotations, or missed responses.
          </p>
        </div>
      `;

      return html;
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
            act: "view-rewards",
            ic: "💰",
            title: "Allowance",
            sub: "Money you've earned",
          },
          {
            act: "view-insights",
            ic: "📊",
            title: "Insights",
            sub: "Your focus & on-time trends",
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
        return `<div class="item" style="border-left:4px solid ${esc(c.color)}"><div class="head"><div><h4><span style="margin-right:6px">${c.emoji || "📚"}</span>${esc(c.name)}</h4><p class="meta">${meta.length ? esc(meta.join(" · ")) : "Tap Edit to add details"}${open ? ` · ${open} open task${open === 1 ? "" : "s"}` : ""}</p></div></div><div class="row">
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

    homework() {
      const open = sortByUrgency(openTasks());
      const intro =
        '<p class="view-intro">Do one assignment, then take a break. Tap a number to start a timer. 💪</p>';
      if (!open.length) {
        return (
          '<div class="view-head"><h2 class="view-title">📋 Homework Plan</h2><button class="btn primary" data-act="quick-add">＋ Add assignment</button></div>' +
          intro +
          emptyState(
            "🎉",
            "No assignments yet. Add one and a study plan builds itself here.",
          ) +
          '<div class="hw-row break"><div class="hw-main"><span class="hw-emoji">🌿</span><div><b>Brain break</b><div class="meta">Stretch, water, breathe.</div></div></div>' +
          hwTimerCell("break-warmup", [3, 5, 10]) +
          "</div>"
        );
      }
      const rows = open
        .map((a) => {
          const c = cls(a.classId);
          const n = daysUntil(a.due);
          const meta =
            (c.emoji || "📚") +
            " " +
            esc(c.name) +
            (a.due ? " · " + esc(dueLabel(a.due, a.dueTime)) : "");
          const work =
            '<div class="hw-row work ' +
            (n !== null && n < 0 ? "overdue" : "") +
            '"><div class="hw-main"><span class="hw-emoji">📘</span><div><b>' +
            esc(a.title) +
            '</b><div class="meta">' +
            meta +
            '</div><button class="btn sm hw-done" data-act="complete" data-id="' +
            a.id +
            '">✓ Done</button></div></div>' +
            hwTimerCell(a.id, [10, 15, 20, 25]) +
            "</div>";
          const brk =
            '<div class="hw-row break"><div class="hw-main"><span class="hw-emoji">🌿</span><div><b>Break</b><div class="meta">Rest your brain, then keep going.</div></div></div>' +
            hwTimerCell("break-" + a.id, [3, 5, 10]) +
            "</div>";
          return work + brk;
        })
        .join("");
      return (
        '<div class="view-head"><h2 class="view-title">📋 Homework Plan</h2><button class="btn primary" data-act="quick-add">＋ Add</button></div>' +
        intro +
        '<div class="hw-legend"><span>📘 Assignment</span><span>🌿 Break</span><span>⏱ Tap a number to start</span></div>' +
        rows
      );
    },

    calming() {
      const phrase = CALM_PHRASES[calmIdx % CALM_PHRASES.length];
      return (
        '<div class="view-head"><h2 class="view-title">🧘 Calming</h2></div>' +
        '<p class="view-intro">Feeling stressed or stuck? Take a minute here. You\'re okay.</p>' +
        '<button type="button" class="card calm-phrase" data-act="calm-next" aria-label="Show another calming phrase"><span class="calm-quote">“' +
        esc(phrase) +
        '”</span><span class="calm-tap">Tap for another →</span></button>' +
        card(
          "calm-breathe",
          "🫧 Balloon breathing",
          "Follow the circle.",
          '<div class="breathe-wrap"><button type="button" class="breathe-bubble" data-act="breathe-toggle" id="breatheBubble" aria-label="Start or stop the breathing exercise"><span id="breathePhase">Tap to start</span></button></div><p class="muted" style="text-align:center;margin:12px 0 0">Tap the balloon. Breathe in as it grows, hold, then out as it shrinks.</p>',
        ) +
        card(
          "calm-ground",
          "🖐 5-4-3-2-1 grounding",
          "Notice what's around you.",
          '<ul class="ground-list"><li><b>5</b> things you can see 👀</li><li><b>4</b> things you can touch ✋</li><li><b>3</b> things you can hear 👂</li><li><b>2</b> things you can smell 👃</li><li><b>1</b> slow, deep breath 😮‍💨</li></ul>',
        ) +
        card(
          "calm-reset",
          "🌟 Quick resets",
          "Pick one and do it right now.",
          '<ul class="ground-list"><li>Roll your shoulders back 5 times.</li><li>Press your feet into the floor and count to 10.</li><li>Get a sip of water. 💧</li><li>Look out a window for 20 seconds.</li></ul>',
        )
      );
    },

    health() {
      const day =
        (state.health && state.health.log && state.health.log[todayKey()]) ||
        {};
      const rate =
        (state.rewards && state.rewards.rates && state.rewards.rates.health) ||
        0.1;
      const eff = healthItems();
      const doneCount = eff.filter((it) => day[it[0]]).length;
      const items = eff
        .map((it) => {
          const [id, emoji, label, hint] = it;
          const done = !!day[id];
          return (
            '<div class="health-row">' +
            '<label class="health-item' +
            (done ? " done" : "") +
            '"><input type="checkbox" data-check="health" data-id="' +
            id +
            '"' +
            (done ? " checked" : "") +
            ' aria-label="' +
            esc(label) +
            '"><span class="health-emoji" aria-hidden="true">' +
            emoji +
            '</span><span class="health-text"><b class="steptext' +
            (done ? " done" : "") +
            '">' +
            esc(label) +
            "</b><small>" +
            esc(hint) +
            '</small></span><span class="health-pay">+' +
            money(rate) +
            "</span></label>" +
            '<span class="health-edit">' +
            '<button class="btn sm ghost" data-act="health-edit" data-id="' +
            id +
            '" aria-label="Edit ' +
            esc(label) +
            '" title="Edit">✏️</button>' +
            '<button class="btn sm ghost" data-act="health-del" data-id="' +
            id +
            '" aria-label="Delete ' +
            esc(label) +
            '" title="Delete">✕</button>' +
            "</span>" +
            "</div>"
          );
        })
        .join("");
      const cheer =
        doneCount === 0
          ? "Pick one and go move your body. 🚀"
          : doneCount >= eff.length
            ? "Wow — you did them all today! 🏆"
            : "Nice work — " + doneCount + " done today! 🔥";
      return (
        '<div class="view-head"><h2 class="view-title">💪 Health</h2></div>' +
        '<p class="view-intro">Move your body, earn a little allowance. These are just for fun — nothing here is required, and they reset every day.</p>' +
        card(
          "health-today",
          "🚴 Today’s movement",
          "Check one off when you do it. Each is worth " + money(rate) + ".",
          '<div class="health-list">' +
            items +
            '</div><button class="btn block" data-act="health-add" style="margin-top:10px">＋ Add a movement</button>' +
            '<p class="health-cheer" aria-live="polite">' +
            cheer +
            "</p>",
        )
      );
    },

    ai() {
      const mode = (window._aiMode = window._aiMode || "hint");
      const msgs = AI_CHAT.length
        ? AI_CHAT.map(
            (m) =>
              '<div class="ai-msg ' +
              (m.role === "user" ? "me" : "bot") +
              '">' +
              (m.role === "user" ? "" : '<span class="ai-ic">🤖</span>') +
              '<span class="ai-bubble">' +
              (m.image
                ? '<img class="ai-img" src="' +
                  m.image +
                  '" alt="attached picture">'
                : "") +
              (m.role === "user" ? esc(m.text) : formatAiReply(m.text)) +
              "</span></div>",
          ).join("")
        : '<div class="ai-empty">' +
          emptyState(
            "🤖",
            "Hi! I'm your homework helper. Ask me a question, tap a button below, or add a picture of your work.",
          ) +
          "</div>";
      const chipGroups = AI_PROMPT_GROUPS.map(
        ([title, items]) =>
          '<div class="ai-chip-group"><span class="ai-chip-title">' +
          esc(title) +
          "</span>" +
          items
            .map(
              (c) =>
                '<button class="btn sm" data-act="ai-suggest" data-arg="' +
                esc(c) +
                '">' +
                esc(c) +
                "</button>",
            )
            .join("") +
          "</div>",
      ).join("");
      return (
        '<div class="view-head"><h2 class="view-title">🤖 Academic Help</h2>' +
        (AI_CHAT.length
          ? '<button class="btn sm" data-act="ai-clear">Clear</button>'
          : "") +
        "</div>" +
        '<p class="view-intro">A friendly helper for homework. Tap a button, type a question, or add a picture of your work.</p>' +
        '<a class="btn navy block" href="/curriculum/math-workbench/" target="_blank" rel="noopener">📐 Open Math Workbench</a>' +
        // Ask first (chips + input), then the conversation grows below it.
        '<div class="ai-chips">' +
        chipGroups +
        "</div>" +
        (aiImage
          ? '<div class="ai-attached"><img src="' +
            aiImage.dataUrl +
            '" alt="picture to send"><button class="btn sm" data-act="ai-remove-image">✕ Remove picture</button></div>'
          : "") +
        '<div class="seg" id="aiModeSeg" style="margin-bottom: 12px; display: flex; gap: 8px;">' +
        '<button class="btn block" data-act="ai-mode" data-arg="hint" aria-pressed="' +
        (mode !== "solve") +
        '">🧭 Hints Mode</button>' +
        '<button class="btn block" data-act="ai-mode" data-arg="solve" aria-pressed="' +
        (mode === "solve") +
        '">✨ Solve Mode</button>' +
        "</div>" +
        '<div class="ai-inputbar"><button class="btn ai-attach-btn" data-act="ai-attach" aria-label="Add a picture" title="Add a picture">📷</button><input id="aiInput" placeholder="Ask for help…" aria-label="Ask for help" ' +
        (aiBusy ? "disabled" : "") +
        '><button class="btn primary" data-act="ai-send" ' +
        (aiBusy ? "disabled" : "") +
        ">Send</button></div>" +
        '<div class="ai-scroll" id="aiScroll">' +
        msgs +
        (aiBusy
          ? '<div class="ai-msg bot"><span class="ai-ic">🤖</span><span class="ai-bubble typing">Thinking…</span></div>'
          : "") +
        "</div>" +
        '<input type="file" id="aiImageInput" accept="image/*" hidden>'
      );
    },

    email() {
      return (
        backHeader("Email a teacher", "more") +
        `<div class="grid g2"><section class="card"><h3>Write an email</h3><p class="sub">This opens Gmail in your browser (not Apple Mail).</p>
          <div class="field"><label>To which class / teacher</label><select id="eClass">${state.classes.map((c) => `<option value="${c.id}">${c.emoji || "📚"} ${esc(c.name)}${c.teacher ? " — " + esc(c.teacher) : ""}</option>`).join("")}</select></div>
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
        xpLevelCardHTML() +
        weeklyFocusChartHTML() +
        reflectionChartHTML() +
        badgesGalleryHTML() +
        weeklyReportCardHTML() +
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
      const pts = state.points || 0;
      const lvl = Math.floor(pts / 100) + 1;
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
          <div class="field"><label>Gradient Background Preset</label>
            <div class="theme-gradient-grid">
              ${GRADIENTS.map((g) => {
                const req = getGradientLevelRequired(g[0]);
                const isLocked = lvl < req;
                return `
                  <div class="theme-gradient-swatch ${isLocked ? "locked" : ""}" data-act="set-gradient-theme" data-arg="${esc(g[0])}" aria-pressed="${state.settings.themeGradient === g[0]}" style="background: ${g[0] || "linear-gradient(180deg, var(--bg-2), var(--bg))"}">
                    <b>${isLocked ? "🔒 " : ""}${esc(g[1])}${isLocked ? ` (Lvl ${req})` : ""}</b>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
          <div class="field" style="margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
            <label>🎨 Custom Theme Creator (Dual HSL Gradient)</label>
            <p class="muted" style="margin: 4px 0 8px; font-size: 0.75rem;">Create a custom dual-color HSL linear gradient background.</p>
            <div style="display:flex; align-items:center; gap:16px; margin-top:8px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <span style="font-size:0.75rem; color:var(--muted)">Color 1</span>
                <input type="color" id="customColor1" value="${esc(s.customThemeColor1 || "#0d324d")}" data-act="update-custom-gradient" aria-label="Custom Color 1" style="width:48px; height:32px; border:1px solid var(--border); border-radius:6px; cursor:pointer; background:none; padding:0;">
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <span style="font-size:0.75rem; color:var(--muted)">Color 2</span>
                <input type="color" id="customColor2" value="${esc(s.customThemeColor2 || "#7f5a83")}" data-act="update-custom-gradient" aria-label="Custom Color 2" style="width:48px; height:32px; border:1px solid var(--border); border-radius:6px; cursor:pointer; background:none; padding:0;">
              </div>
              <button class="btn sm" data-act="apply-custom-gradient" style="margin-top: 16px;">⚡ Apply Gradient</button>
            </div>
          </div>
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
          "📅 Google Calendar & School Mail",
          "Show your Google events and emails in the app.",
          `
          ${
            gcal.clientId()
              ? `
            <div style="margin: 8px 0 16px;">
              <p class="sub" style="margin-top: 0;">Connected Calendar: ${gcal.connected ? `<span class="pill green">● Connected</span>` : `<span class="pill">Not connected</span>`}</p>
              <p class="sub" style="margin-top: 0;">Connected School Mail: ${gmail.connected ? `<span class="pill green">● Connected</span>` : `<span class="pill">Not connected</span>`}</p>
              <div class="row" style="gap:10px;">
                <button class="btn primary" data-act="gcal-connect">${gcal.connected ? "🔄 Reconnect Calendar" : "⚡ Connect Calendar"}</button>
                <button class="btn navy" data-act="gmail-connect">${gmail.connected ? "✉️ Reconnect School Mail" : "✉️ Connect School Mail"}</button>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
                ${gcal.connected ? `<button class="btn sm" data-act="gcal-choose">📋 Choose calendars</button><button class="btn sm danger" data-act="gcal-disconnect">Disconnect Cal</button>` : ""}
                ${gmail.connected ? `<button class="btn sm" data-act="view-mail">✉️ Open School Mail</button><button class="btn sm danger" data-act="gmail-disconnect">Disconnect Mail</button>` : ""}
              </div>
            </div>
          `
              : `
            <p class="sub" style="color: var(--red-bright); margin-top:0;">Google integration requires a Client ID from the site administrator, or you can enter your own below.</p>
          `
          }
          <details style="margin-top: 15px; border-top: 1px solid var(--line); padding-top: 10px;">
            <summary style="font-size: 0.8rem; cursor: pointer; color: var(--muted); font-weight: bold; outline: none; user-select: none;">🛠️ Advanced Google Settings</summary>
            <div class="field" style="margin-top: 8px;">
              <label>Custom Web Client ID</label>
              <input id="gClientId" value="${esc(s.googleClientId)}" placeholder="xxxxxxxx.apps.googleusercontent.com" autocomplete="off">
            </div>
            <button class="btn primary" data-act="save-google-id">Save Client ID</button>
            <div class="note" style="margin-top:12px"><b>One-time setup</b> (an adult does this once):
              <ol style="margin:6px 0 0;padding-left:18px;line-height:1.6;font-size: 0.75rem;">
                <li>Go to <b>Google Cloud Console</b> → APIs &amp; Services.</li>
                <li><b>Enable</b> the <b>Google Calendar API</b> and the <b>Gmail API</b>.</li>
                <li>Create an <b>OAuth client ID</b> of type <b>Web application</b>.</li>
                <li>Under <b>Authorized JavaScript origins</b> add: <code>https://focus.eduwonderlab.com</code></li>
                <li>On the <b>OAuth consent screen</b>, add scope <code>gmail.readonly</code>.</li>
                <li>Copy the Client ID (ends in <code>.apps.googleusercontent.com</code>) and paste it above.</li>
              </ol>
            </div>
          </details>
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
      const pill = s.enabled
        ? '<span class="pill green">● Sync is on</span>'
        : '<span class="pill">Off by default</span>';
      // When sync is ON, show the linking code + status. When OFF, show the
      // one-tap "Turn on sync" plus an "Enter a code" path for the 2nd device.
      const syncLink = linkURL(s.code);
      const onBody = `
          <p class="sub" style="margin-top:0">Sync is on. Your data keeps itself up to date across every device that uses this code — automatically.</p>
          ${syncStatusHTML()}
          <div class="field"><label>Your sync code</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input id="syncCode" value="${esc(s.code)}" readonly onclick="this.select()" style="flex: 1; min-width: 0; font-family: monospace;">
              <button class="btn sm" data-act="change-sync-code" style="white-space: nowrap; padding: 6px 12px; height: 36px; line-height: 24px; font-size: 0.8rem; margin: 0;">✏️ Customize Code</button>
            </div>
          </div>
          <div class="row">
            <button class="btn primary" data-act="copy-code">📋 Copy code</button>
            <button class="btn" data-act="copy-link">🔗 Copy link</button>
            <button class="btn navy" data-act="sync-now">🔄 Sync now</button>
            <button class="btn danger" data-act="toggle-sync">Turn off sync</button>
          </div>
          ${
            (state.syncDevices || []).length
              ? `
            <div class="sync-devices-box" style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.03); border: 1.5px dashed var(--line); border-radius: 12px; text-align: left;">
              <span style="font-size: 0.85rem; font-weight: 800; color: var(--ink); display: block; margin-bottom: 8px;">💻 Synced Devices</span>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8rem; line-height: 1.6;">
                ${state.syncDevices
                  .map((d) => {
                    const isMe =
                      d.id ===
                      (deviceId ||
                        localStorage.getItem("focus-school:device-id") ||
                        "unknown");
                    const activeStr = isMe
                      ? "<span class='pill green' style='font-size:0.65rem; padding: 1px 4px; font-weight: bold;'>This device</span>"
                      : `active ${timeAgo(d.lastActive)}`;
                    return `<li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.02);">
                    <span>📱 <b>${esc(d.name)}</b></span>
                    <span class="muted" style="font-size:0.75rem;">${activeStr}</span>
                  </li>`;
                  })
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
          <div class="pairing-6digit-box" style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.03); border: 1.5px dashed var(--line); border-radius: 12px; text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--ink); display: block; margin-bottom: 6px;">🔗 Get 6-Digit Code (Chromebook / Other Computer)</span>
            <button class="btn sm" data-act="generate-pair-code" id="btnGenPairCode" style="margin: 4px auto;">⚡ Generate 6-Digit Code</button>
            <div id="pairCodeDisplay" style="display:none; margin-top: 10px;">
              <div style="font-size: 2.2rem; font-weight: 900; letter-spacing: 6px; color: var(--accent); margin: 8px 0; line-height: 1;" id="lblPairCode">000 000</div>
              <small class="muted" style="display:block;">Enter this 6-digit code on your other device to link it instantly.</small>
              <small class="muted" style="display:block; font-size: 0.7rem; color: var(--red-bright); margin-top: 4px;">Expires in 5 minutes.</small>
            </div>
          </div>
          <div class="qr-pairing-box" style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: rgba(255,255,255,0.03); border: 1.5px dashed var(--line); border-radius: 12px; text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--ink);">📱 Scan to Pair Your Phone</span>
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(syncLink)}&size=160x160" alt="Pairing QR Code" style="border: 4px solid white; border-radius: 8px; width: 160px; height: 160px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span style="display:none; font-size: 0.85rem; color: var(--muted)">QR Code generation offline. Copy the link above to pair!</span>
            <small class="muted" style="font-size: 0.75rem; margin-top: 4px">Scan this with your mobile camera to instantly sync and access your planner on the go.</small>
          </div>
          <p class="sub" style="margin-top:10px"><b>Link another device:</b> paste this code there (Backup &amp; sync → “Enter a code”), or send yourself the <b>link</b> and open it on the other device — it links automatically.</p>`;
      const offBody = `
          <p class="sub" style="margin-top:0">See the same tasks on your phone, laptop, and Chromebook — no account, no password. ${cloud.available() ? "" : "<b>Heads up:</b> cloud sync isn't enabled on this site yet, so your code is saved and ready, but data stays on this device until it is."}</p>
          <div class="sync-cta">
            <button class="btn primary block" data-act="enter-code">⌨️ Enter my code &amp; load my data</button>
            <p class="sub" style="margin:8px 0 0;text-align:center">Already use Focus School somewhere else? Type your code and everything loads automatically.</p>
          </div>
          <div class="row" style="margin-top:12px;justify-content:center">
            <button class="btn" data-act="enable-sync">✨ First time here? Make me a code</button>
          </div>`;
      return (
        backHeader("Backup & sync", "more") +
        `<p class="view-intro">Your work is always saved on this device. Choose how you want to back it up or carry it to another device.</p>` +
        // Cloud sync surfaced first, highlighted, with a plain-language explanation.
        `<section class="card feature" data-card="cloud">
          <div class="head"><div><h3>☁️ Sync across your devices</h3><p class="sub">Optional — work on your phone and laptop and see the same tasks everywhere.</p></div>${pill}</div>
          ${s.enabled ? onBody : offBody}
        </section>` +
        `<details class="card" data-card="file"><summary style="cursor:pointer;font-weight:900">💾 Advanced: save a backup file</summary>
          <p class="sub" style="margin-top:8px">Most people just use sync above. This downloads one file with everything, as an extra safety copy.</p>
          <div class="row"><button class="btn" data-act="export">⬇️ Download backup</button><button class="btn" data-act="import">⬆️ Load from file</button></div>
          <input type="file" id="importFile" accept="application/json,.json" hidden>
        </details>` +
        card(
          "diagnostics",
          "🛠️ System Diagnostics & Health",
          "Run diagnostic tests to check application caching and database status.",
          `
          <div class="diagnostics-panel">
            <div class="diag-grid">
              <div class="diag-stat" id="diagIdbCard"><b>IndexedDB</b><span id="diagIdbStatus">Untested</span></div>
              <div class="diag-stat" id="diagLsCard"><b>LocalStorage</b><span id="diagLsStatus">Untested</span></div>
              <div class="diag-stat" id="diagNetCard"><b>Network Status</b><span id="diagNetStatus">Untested</span></div>
              <div class="diag-stat" id="diagSwCard"><b>Service Worker</b><span id="diagSwStatus">Untested</span></div>
            </div>
            <div class="diag-console" id="diagLogs">
              ${logger.logs.map((line) => `<div class="log-line ${line.level}">[${line.time}] [${line.level.toUpperCase()}] ${esc(line.msg)}</div>`).join("")}
            </div>
            <div class="row">
              <button class="btn primary" data-act="run-self-test">🚀 Run Diagnostics</button>
            </div>
          </div>
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
          "Focus School — Focus & Plan",
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

    insights() {
      // Last 7 days of focus minutes, as a simple bar chart.
      const days = [];
      for (let i = -6; i <= 0; i++) {
        const k = isoForOffset(i);
        const a = state.activity[k] || {};
        const d = parseLocal(k);
        days.push({
          k,
          label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()],
          focusMin: a.focusMin || 0,
          tasks: a.tasks || 0,
          routines: a.routines || 0,
        });
      }
      const maxFocus = Math.max(1, ...days.map((d) => d.focusMin));
      const sum = (f) => days.reduce((s, d) => s + d[f], 0);
      const allFocus = Object.values(state.activity).reduce(
        (s, a) => s + (a.focusMin || 0),
        0,
      );
      // On-time completion rate across all finished assignments.
      const done = state.assignments.filter((a) => a.status === "done");
      const onTime = done.filter(
        (a) => !a.due || (a.completedAt && a.completedAt.slice(0, 10) <= a.due),
      ).length;
      const onTimePct = done.length
        ? Math.round((onTime / done.length) * 100)
        : null;
      // Best day of week by focus minutes (all history).
      const byDow = [0, 0, 0, 0, 0, 0, 0];
      for (const [k, a] of Object.entries(state.activity)) {
        const d = parseLocal(k);
        if (d) byDow[d.getDay()] += a.focusMin || 0;
      }
      const bestDow = byDow.some((m) => m > 0)
        ? [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ][byDow.indexOf(Math.max(...byDow))]
        : "—";
      const stat = (big, small) =>
        `<div class="statbox"><b>${big}</b><small>${small}</small></div>`;
      const bars = days
        .map(
          (d) =>
            `<div class="ins-bar-col"><div class="ins-bar-track"><div class="ins-bar-fill" style="height:${Math.round(
              (d.focusMin / maxFocus) * 100,
            )}%" title="${d.focusMin} min"></div></div><span class="ins-bar-lbl">${d.label}</span></div>`,
        )
        .join("");
      return (
        backHeader("Insights", "more") +
        card(
          "ins-week",
          "This week",
          "Your last 7 days at a glance.",
          `<div class="statgrid">
            ${stat(`${sum("focusMin")}m`, "Focus time")}
            ${stat(sum("tasks"), "Tasks done")}
            ${stat(sum("routines"), "Routines")}
            ${stat(`${streak()}🔥`, "Day streak")}
          </div>
          <div class="ins-chart" role="img" aria-label="Focus minutes per day for the last 7 days">${bars}</div>
          <p class="sub" style="text-align:center;margin:6px 0 0">Focus minutes per day</p>`,
        ) +
        card(
          "ins-all",
          "All time",
          "The long view.",
          `<div class="statgrid">
            ${stat(`${allFocus}m`, "Total focus")}
            ${stat(done.length, "Finished")}
            ${stat(onTimePct === null ? "—" : `${onTimePct}%`, "On time")}
            ${stat(bestDow, "Best day")}
          </div>
          ${
            onTimePct !== null
              ? `<p class="sub" style="margin-top:8px">You turn in <b>${onTimePct}%</b> of your work on time. ${
                  onTimePct >= 80
                    ? "That's excellent — keep it up! 🌟"
                    : "Knocking out work a little earlier bumps this up fast."
                }</p>`
              : `<p class="sub" style="margin-top:8px">Finish a few assignments and your on-time rate shows up here.</p>`
          }`,
        )
      );
    },

    rewards() {
      const r = state.rewards;
      const rateRow = (k, label) =>
        `<div class="rw-rate"><span>${label}</span><b>${money(r.rates[k])}</b></div>`;

      // Category breakdown rows for a computed week (a tiny "paystub").
      const KIND_LABEL = {
        task: "✅ Assignments & to-dos",
        routine: "🔁 Routines",
        focus: "▶ Focus sessions",
        reminder: "🔔 Reminders",
        health: "💪 Biking & lifting",
      };
      const stub = (w) =>
        `<div class="pay-stub">${[
          "task",
          "routine",
          "focus",
          "reminder",
          "health",
        ]
          .filter((k) => w.by[k] > 0)
          .map(
            (k) =>
              `<div class="pay-line"><span>${KIND_LABEL[k]}</span><b>${money(
                w.by[k],
              )}</b></div>`,
          )
          .join("")}
          ${
            w.bonus > 0
              ? `<div class="pay-line pay-bonus"><span>⭐ Perfect-week bonus</span><b>${money(
                  w.bonus,
                )}</b></div>`
              : ""
          }
          ${
            w.capped
              ? `<div class="pay-line pay-cap"><span>Weekly cap</span><b>${money(
                  state.rewards.weeklyCap,
                )}</b></div>`
              : ""
          }
          <div class="pay-line pay-total"><span>Total</span><b>${money(
            w.total,
          )}</b></div></div>`;

      // This week so far — accruing, not payable until the week ends.
      const wk = computeWeek(thisWeekKey());
      const dayChips = [0, 1, 2, 3, 4, 5, 6]
        .map((i) => {
          const d = parseLocal(thisWeekKey());
          d.setDate(d.getDate() + i);
          const key = ymd(d);
          const has = state.rewards.ledger.some(
            (e) => e.type === "earn" && e.ts.slice(0, 10) === key,
          );
          const today = key === todayKey();
          return `<span class="pay-day ${has ? "on" : ""} ${
            today ? "now" : ""
          }">${["M", "T", "W", "T", "F", "S", "S"][i]}</span>`;
        })
        .join("");

      const ready = readyWeeks();
      const readyHtml = ready.length
        ? ready
            .map(
              (w) => `
          <div class="pay-week">
            <div class="pay-week-head">
              <div><b>Week of ${weekLabel(w.weekKey)}</b><small>${
                w.daysActive
              } active day${w.daysActive === 1 ? "" : "s"}</small></div>
              <div class="pay-amt">${money(w.total)}</div>
            </div>
            ${stub(w)}
            <button class="btn primary block" data-act="reward-payout" data-arg="${
              w.weekKey
            }" style="margin-top:10px">💵 Pay out ${money(
              w.total,
            )} (parent)</button>
          </div>`,
            )
            .join("")
        : `<p class="sub" style="margin:0">Nothing waiting — finished weeks show up here every Monday, ready to hand over. 👍</p>`;

      const payouts = (r.payouts || [])
        .slice()
        .sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt)))
        .slice(0, 12);
      const historyHtml = payouts.length
        ? payouts
            .map(
              (p) =>
                `<div class="rw-row"><span class="rw-ic" aria-hidden="true">💵</span><span class="rw-lbl">Week of ${esc(
                  weekLabel(p.weekKey),
                )}<small>Paid ${esc(
                  p.paidAt ? niceDate(p.paidAt.slice(0, 10)) : "",
                )}</small></span><b class="rw-out">${money(p.amount)}</b></div>`,
            )
            .join("")
        : emptyState("🧾", "No payouts yet.");

      return (
        backHeader("Allowance", "more") +
        (r.enabled
          ? ""
          : `<div class="card"><p class="sub" style="margin:0">💤 Rewards are turned off. Turn them on in <b>Parent settings</b> below.</p></div>`) +
        card(
          "pay-ready",
          ready.length ? "💵 Ready for payday" : "💵 Payday",
          ready.length
            ? `${money(readyTotal())} to hand over — a grown-up taps to pay.`
            : "Finished weeks get added up here automatically.",
          readyHtml,
        ) +
        card(
          "pay-thisweek",
          "📅 This week so far",
          weekLabel(thisWeekKey()),
          `<div class="pay-this">
            <div class="pay-this-amt">${money(wk.total)}</div>
            <div class="pay-days">${dayChips}</div>
          </div>
          ${wk.total > 0 ? stub(wk) : `<p class="sub" style="text-align:center;margin:8px 0 0">Finish some work to start earning this week.</p>`}
          <p class="sub" style="margin:10px 0 0;text-align:center">💡 This week is paid out next Monday.</p>`,
        ) +
        card(
          "pay-rates",
          "What things are worth",
          [
            r.dailyCap > 0 ? `${money(r.dailyCap)}/day max` : "",
            r.weeklyCap > 0 ? `${money(r.weeklyCap)}/week max` : "",
          ]
            .filter(Boolean)
            .join(" · "),
          `<div class="rw-rates">
            ${rateRow("task", "✅ Finish an assignment / to-do")}
            ${rateRow("routine", "🔁 Complete a routine")}
            ${rateRow("focus", "▶ Finish a focus session")}
            ${rateRow("reminder", "🔔 Handle a reminder")}
            ${
              r.bonusPerfectWeek > 0
                ? `<div class="rw-rate"><span>⭐ Perfect week (every weekday)</span><b>+${money(
                    r.bonusPerfectWeek,
                  )}</b></div>`
                : ""
            }
          </div>
          <button class="btn block" data-act="reward-settings" style="margin-top:10px">⚙️ Parent settings</button>`,
        ) +
        card(
          "pay-paidtotal",
          "Paid out",
          "",
          `<div class="rw-bank"><div class="rw-big">${money(
            r.paidOut,
          )}</div><div class="rw-sub">handed over all-time</div></div>`,
        ) +
        card(
          "rw-history",
          "Payout history",
          "",
          `<div class="rw-list">${historyHtml}</div>`,
        )
      );
    },
  };

  function backHeader(title, back) {
    return `<div class="view-head"><div class="row" style="gap:10px"><button class="btn sm ghost" data-act="nav" data-arg="${back}" aria-label="Back to More">← Back</button><h2 class="view-title">${esc(title)}</h2></div></div>`;
  }

  function routineCard(r) {
    if (!r) {
      const next = nextRoutineWindow();
      return card(
        "routine",
        "Right routine",
        "Based on the time of day.",
        next
          ? `<div class="mini">
              <b>Next: ${esc(next.label)} routine</b>
              <p class="sub" style="margin:6px 0 0">${esc(next.routine.name)} starts ${esc(relativeStart(next.startsAt))} (${esc(formatWindow(next))}).</p>
            </div>
            <div class="row" style="margin-top:10px">
              <button class="btn sm" data-act="guide-start" data-id="${next.routine.id}">Start early</button>
              <button class="btn sm" data-act="nav" data-arg="routines">All routines →</button>
            </div>`
          : emptyState(
              "🔁",
              "No routine is active right now. Morning is 6:00–8:00 AM, after school is 3:30–6:00 PM, and nighttime is 7:00–11:30 PM.",
            ),
      );
    }
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
  const minutesSinceMidnight = (d = new Date()) =>
    d.getHours() * 60 + d.getMinutes();
  const inTimeWindow = (mins, start, end) => mins >= start && mins <= end;
  const ROUTINE_WINDOWS = [
    {
      label: "Morning",
      start: 6 * 60,
      end: 8 * 60,
      weekday: ["Morning Launch", "Morning Launchpad"],
      weekend: ["Weekend Launch", "Morning Launch", "Morning Launchpad"],
    },
    {
      label: "After School",
      start: 15 * 60 + 30,
      end: 18 * 60,
      weekday: ["After-School Reset", "After School Reset"],
      weekend: ["Weekend Reset", "After-School Reset", "After School Reset"],
    },
    {
      label: "Nighttime",
      start: 19 * 60,
      end: 23 * 60 + 30,
      weekday: ["Nighttime Shutdown", "Shutdown"],
      weekend: ["Nighttime Shutdown", "Shutdown"],
    },
  ];
  function routineByName(names, when = new Date()) {
    const scheduled = state.routines.filter((r) => routineOccursOn(r, when));
    const pool = scheduled.length ? scheduled : state.routines;
    for (const name of names) {
      const found = pool.find((r) => r.name === name);
      if (found) return found;
    }
    return null;
  }
  function routineForWindow(win, when) {
    const isWeekend = when.getDay() === 0 || when.getDay() === 6;
    return routineByName(isWeekend ? win.weekend : win.weekday, when);
  }
  function dateAtMinutes(base, mins) {
    const d = new Date(base);
    d.setHours(0, mins, 0, 0);
    return d;
  }
  function routineWindowFor(now = new Date()) {
    const mins = minutesSinceMidnight(now);
    for (const win of ROUTINE_WINDOWS) {
      if (!inTimeWindow(mins, win.start, win.end)) continue;
      const routine = routineForWindow(win, now);
      if (routine) {
        return {
          ...win,
          routine,
          startsAt: dateAtMinutes(now, win.start),
          endsAt: dateAtMinutes(now, win.end),
        };
      }
    }
    return null;
  }
  function pickRoutineForNow(now = new Date()) {
    return routineWindowFor(now)?.routine || null;
  }
  // Which routine the HOME card shows. During a window: that window's routine.
  // Outside windows: if a routine was started earlier today but isn't finished,
  // keep showing it (with its checked steps) so progress never appears to reset
  // before the next day — only midnight (a new day key) or a manual "Reset for
  // today" clears it. Falls back to null (→ "next routine" card) when nothing is
  // in progress or the started routine is already complete.
  function routineForHome(now = new Date()) {
    const active = routineWindowFor(now)?.routine;
    if (active) return active;
    const log = state.routineLog[ymd(now)] || {};
    for (let i = ROUTINE_WINDOWS.length - 1; i >= 0; i--) {
      const r = routineForWindow(ROUTINE_WINDOWS[i], now);
      if (!r) continue;
      const done = log[r.id] || [];
      if (done.length && done.length < r.items.length) return r;
    }
    return null;
  }
  function nextRoutineWindow(now = new Date()) {
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + dayOffset);
      day.setHours(0, 0, 0, 0);
      for (const win of ROUTINE_WINDOWS) {
        const startsAt = dateAtMinutes(day, win.start);
        const endsAt = dateAtMinutes(day, win.end);
        if (endsAt <= now) continue;
        const routine = routineForWindow(win, day);
        if (routine) return { ...win, routine, startsAt, endsAt };
      }
    }
    return null;
  }
  function formatClock(d) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function formatWindow(win) {
    return `${formatClock(win.startsAt)}-${formatClock(win.endsAt)}`;
  }
  function relativeStart(startsAt, now = new Date()) {
    const diff = startsAt - now;
    if (diff <= 0) return "now";
    const mins = Math.ceil(diff / 60000);
    if (mins < 60) return `in ${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    const dayLabel =
      startsAt.toDateString() === now.toDateString() ? "today" : "tomorrow";
    return rem
      ? `${dayLabel} in ${hrs} hr ${rem} min`
      : `${dayLabel} in ${hrs} hr`;
  }

  function updateGardenPlantStage() {
    if (!state.garden) return;
    const w = state.garden.wateredCount || 0;
    let stage = 0;
    if (w >= 25) stage = 4;
    else if (w >= 15) stage = 3;
    else if (w >= 8) stage = 2;
    else if (w >= 3) stage = 1;
    state.garden.plantStage = stage;
  }

  function renderPlantSvg(type, stage) {
    // 0: Sprout, 1: Seedling, 2: Leafy, 3: Blooming, 4: Golden
    let plantContent = "";

    const isGolden = stage === 4;
    const mainColor = isGolden
      ? "#F1C40F"
      : type === "bonsai"
        ? "#8B5A2B"
        : "#2ECC71";
    const leafColor = isGolden ? "#F39C12" : "#27AE60";
    const accentColor = isGolden ? "#F1C40F" : "#E74C3C";

    // Pot
    const potColor = isGolden ? "#D35400" : "#E07A5F";
    const rimColor = isGolden ? "#E67E22" : "#d4722f";
    const soilColor = isGolden ? "#935116" : "#6E473B";

    let potSvg = `
      <path d="M 50,120 L 90,120 L 86,145 L 54,145 Z" fill="${potColor}" />
      <ellipse cx="70" cy="120" rx="18" ry="4" fill="${soilColor}" />
      <rect x="48" y="116" width="44" height="5" rx="2" fill="${rimColor}" />
    `;

    if (stage === 0) {
      // Sprout (same for all)
      plantContent = `
        <!-- Stem -->
        <path d="M 70,120 Q 69,105 67,95" stroke="${mainColor}" stroke-width="3" fill="none" stroke-linecap="round" />
        <!-- Left Leaf -->
        <path d="M 67,95 Q 57,90 62,85 Q 70,90 67,95 Z" fill="${leafColor}" />
        <!-- Right Leaf -->
        <path d="M 67,95 Q 77,90 72,85 Q 70,90 67,95 Z" fill="${leafColor}" />
      `;
    } else if (type === "cactus") {
      if (stage === 1) {
        // Seedling Cactus
        plantContent = `
          <!-- Main body -->
          <ellipse cx="70" cy="98" rx="10" ry="18" fill="${mainColor}" />
          <!-- Small spines -->
          <line x1="57" y1="95" x2="60" y2="95" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="80" y1="95" x2="83" y2="95" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="70" y1="85" x2="70" y2="88" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
        `;
      } else if (stage === 2) {
        // Leafy (Medium) Cactus
        plantContent = `
          <!-- Main body -->
          <ellipse cx="70" cy="94" rx="13" ry="22" fill="${mainColor}" />
          <!-- Left Arm -->
          <path d="M 59,96 Q 48,93 51,82 Q 56,83 59,90 Z" fill="${mainColor}" />
          <!-- Spines -->
          <line x1="53" y1="95" x2="56" y2="95" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="83" y1="95" x2="87" y2="95" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="46" y1="82" x2="49" y2="84" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="70" y1="76" x2="70" y2="80" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
        `;
      } else if (stage === 3) {
        // Blooming Cactus
        plantContent = `
          <!-- Main body -->
          <ellipse cx="70" cy="92" rx="15" ry="25" fill="${mainColor}" />
          <!-- Left Arm -->
          <path d="M 57,96 Q 44,92 48,80 Q 54,82 57,90 Z" fill="${mainColor}" />
          <!-- Right Arm -->
          <path d="M 83,96 Q 96,92 92,80 Q 86,82 83,90 Z" fill="${mainColor}" />
          <!-- Spines -->
          <line x1="51" y1="95" x2="55" y2="95" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="85" y1="95" x2="89" y2="95" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="43" y1="80" x2="46" y2="82" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="97" y1="80" x2="94" y2="82" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <line x1="70" y1="72" x2="70" y2="76" stroke="var(--ink)" stroke-width="1.2" opacity="0.4" />
          <!-- Pink Flowers -->
          <circle cx="70" cy="67" r="4" fill="${accentColor}" />
          <circle cx="70" cy="67" r="2" fill="#FFF" />
          <circle cx="48" cy="76" r="3" fill="${accentColor}" />
          <circle cx="92" cy="76" r="3" fill="${accentColor}" />
        `;
      } else {
        // Golden Cactus
        plantContent = `
          <g filter="url(#goldGlow)">
            <!-- Main body -->
            <ellipse cx="70" cy="92" rx="16" ry="26" fill="${mainColor}" />
            <!-- Left Arm -->
            <path d="M 56,96 Q 42,92 46,78 Q 53,80 56,90 Z" fill="${mainColor}" />
            <!-- Right Arm -->
            <path d="M 84,96 Q 98,92 94,78 Q 87,80 84,90 Z" fill="${mainColor}" />
            <!-- Golden Spines -->
            <line x1="50" y1="95" x2="54" y2="95" stroke="#FFF" stroke-width="1.5" />
            <line x1="90" y1="95" x2="86" y2="95" stroke="#FFF" stroke-width="1.5" />
            <!-- Flowers -->
            <circle cx="70" cy="66" r="5" fill="#FFF" />
            <circle cx="46" cy="74" r="4" fill="#FFF" />
            <circle cx="94" cy="74" r="4" fill="#FFF" />
          </g>
          <!-- Stars / Sparkles -->
          <polygon points="40,60 42,65 47,67 42,69 40,74 38,69 33,67 38,65" fill="#FFF" />
          <polygon points="100,50 102,55 107,57 102,59 100,64 98,59 93,57 98,55" fill="#FFF" />
        `;
      }
    } else if (type === "flower") {
      if (stage === 1) {
        // Seedling Flower
        plantContent = `
          <path d="M 70,120 Q 72,100 68,85" stroke="${mainColor}" stroke-width="3" fill="none" stroke-linecap="round" />
          <path d="M 70,105 Q 60,102 62,96 Q 70,98 70,105 Z" fill="${leafColor}" />
        `;
      } else if (stage === 2) {
        // Leafy Flower
        plantContent = `
          <path d="M 70,120 Q 72,90 67,70" stroke="${mainColor}" stroke-width="3" fill="none" stroke-linecap="round" />
          <path d="M 70,105 Q 58,102 61,95 Q 70,98 70,105 Z" fill="${leafColor}" />
          <path d="M 68,90 Q 80,88 77,82 Q 69,84 68,90 Z" fill="${leafColor}" />
          <!-- Green Bud -->
          <ellipse cx="67" cy="67" rx="5" ry="7" fill="${leafColor}" />
        `;
      } else if (stage === 3) {
        // Blooming Flower
        plantContent = `
          <path d="M 70,120 Q 72,85 67,65" stroke="${mainColor}" stroke-width="3" fill="none" stroke-linecap="round" />
          <path d="M 70,102 Q 55,98 58,90 Q 70,93 70,102 Z" fill="${leafColor}" />
          <path d="M 68,85 Q 83,82 80,74 Q 69,76 68,85 Z" fill="${leafColor}" />
          <!-- Petals -->
          <ellipse cx="67" cy="63" rx="10" ry="10" fill="${accentColor}" />
          <circle cx="61" cy="63" r="6" fill="#F4D03F" opacity="0.8" />
          <circle cx="73" cy="63" r="6" fill="${accentColor}" />
          <circle cx="67" cy="57" r="6" fill="${accentColor}" />
          <circle cx="67" cy="69" r="6" fill="${accentColor}" />
          <!-- Center -->
          <circle cx="67" cy="63" r="4" fill="#F39C12" />
        `;
      } else {
        // Golden Flower
        plantContent = `
          <g filter="url(#goldGlow)">
            <path d="M 70,120 Q 72,85 67,65" stroke="${mainColor}" stroke-width="3.5" fill="none" stroke-linecap="round" />
            <path d="M 70,102 Q 55,98 58,90 Q 70,93 70,102 Z" fill="${leafColor}" />
            <path d="M 68,85 Q 83,82 80,74 Q 69,76 68,85 Z" fill="${leafColor}" />
            <!-- Large Golden Blossom -->
            <ellipse cx="67" cy="61" rx="13" ry="13" fill="${accentColor}" />
            <circle cx="58" cy="61" r="8" fill="#FFF" />
            <circle cx="76" cy="61" r="8" fill="#FFF" />
            <circle cx="67" cy="52" r="8" fill="#FFF" />
            <circle cx="67" cy="70" r="8" fill="#FFF" />
            <circle cx="67" cy="61" r="5" fill="${mainColor}" />
          </g>
          <!-- Particles -->
          <polygon points="50,45 52,50 57,52 52,54 50,59 48,54 43,52 48,50" fill="#FFF" />
          <polygon points="85,55 87,60 92,62 87,64 85,69 83,64 78,62 83,60" fill="#FFF" />
        `;
      }
    } else if (type === "bonsai") {
      if (stage === 1) {
        // Seedling Bonsai
        plantContent = `
          <path d="M 70,120 Q 66,105 72,95" stroke="#8B5A2B" stroke-width="3" fill="none" stroke-linecap="round" />
          <circle cx="72" cy="92" r="6" fill="${leafColor}" />
        `;
      } else if (stage === 2) {
        // Leafy Bonsai
        plantContent = `
          <path d="M 70,120 Q 64,100 76,85" stroke="#8B5A2B" stroke-width="5" fill="none" stroke-linecap="round" />
          <path d="M 68,105 Q 60,98 56,98" stroke="#8B5A2B" stroke-width="3" fill="none" stroke-linecap="round" />
          <!-- Green Tufts -->
          <circle cx="76" cy="80" r="10" fill="${leafColor}" />
          <circle cx="54" cy="96" r="7" fill="${leafColor}" />
        `;
      } else if (stage === 3) {
        // Blooming Bonsai
        plantContent = `
          <!-- Trunk -->
          <path d="M 70,120 Q 62,95 78,75" stroke="#8B5A2B" stroke-width="7" fill="none" stroke-linecap="round" />
          <path d="M 67,102 Q 54,92 50,92" stroke="#8B5A2B" stroke-width="4.5" fill="none" stroke-linecap="round" />
          <path d="M 72,88 Q 88,82 92,84" stroke="#8B5A2B" stroke-width="4" fill="none" stroke-linecap="round" />
          <!-- Green Cloud Tufts -->
          <ellipse cx="78" cy="70" rx="16" ry="10" fill="${leafColor}" />
          <ellipse cx="48" cy="90" rx="10" ry="7" fill="${leafColor}" />
          <ellipse cx="94" cy="82" rx="11" ry="8" fill="${leafColor}" />
          <!-- Pink Flowers -->
          <circle cx="74" cy="68" r="2.5" fill="${accentColor}" />
          <circle cx="84" cy="72" r="2" fill="${accentColor}" />
          <circle cx="46" cy="88" r="2" fill="${accentColor}" />
          <circle cx="96" cy="80" r="2" fill="${accentColor}" />
        `;
      } else {
        // Golden Bonsai
        plantContent = `
          <g filter="url(#goldGlow)">
            <!-- Golden Trunk -->
            <path d="M 70,120 Q 62,95 78,75" stroke="#D35400" stroke-width="8" fill="none" stroke-linecap="round" />
            <path d="M 67,102 Q 54,92 50,92" stroke="#D35400" stroke-width="5" fill="none" stroke-linecap="round" />
            <path d="M 72,88 Q 88,82 92,84" stroke="#D35400" stroke-width="4.5" fill="none" stroke-linecap="round" />
            <!-- Golden Leaf Clouds -->
            <ellipse cx="78" cy="68" rx="18" ry="12" fill="${leafColor}" />
            <ellipse cx="46" cy="88" rx="12" ry="8" fill="${leafColor}" />
            <ellipse cx="96" cy="80" rx="13" ry="9" fill="${leafColor}" />
            <!-- White Sparks -->
            <ellipse cx="78" cy="68" rx="12" ry="6" fill="#FFF" opacity="0.3" />
          </g>
          <!-- Magic Sparkles -->
          <polygon points="78,45 80,50 85,52 80,54 78,59 76,54 71,52 76,50" fill="#FFF" />
          <polygon points="35,80 37,85 42,87 37,89 35,94 33,89 28,87 33,85" fill="#FFF" />
          <polygon points="105,70 107,75 112,77 107,79 105,84 103,79 98,77 103,75" fill="#FFF" />
        `;
      }
    }

    return `
      <svg width="110" height="130" viewBox="0 0 140 160" style="background:transparent; overflow:visible;">
        <defs>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        ${plantContent}
        ${potSvg}
      </svg>
    `;
  }

  function gardenCard() {
    const g = state.garden || {
      xp: 0,
      waterReservoir: 0,
      wateredCount: 0,
      plantStage: 0,
      plantType: "cactus",
    };
    const STAGE_NAMES = [
      "Sprout 🌱",
      "Seedling 🌿",
      "Leafy 🍃",
      "Blooming 🌸",
      "Golden ✨",
    ];
    const stageName = STAGE_NAMES[g.plantStage] || "Sprout 🌱";

    const STAGE_REQUIREMENTS = [3, 8, 15, 25];
    const currentReq = STAGE_REQUIREMENTS[g.plantStage] || 9999;
    const prevReq = g.plantStage > 0 ? STAGE_REQUIREMENTS[g.plantStage - 1] : 0;

    let progressPct = 100;
    let waterText = "Max growth achieved!";
    if (g.plantStage < 4) {
      const neededForNext = currentReq - prevReq;
      const progressInStage = g.wateredCount - prevReq;
      progressPct = clamp(
        Math.round((progressInStage / neededForNext) * 100),
        0,
        100,
      );
      waterText = `${g.wateredCount} / ${currentReq} waterings for next stage`;
    }

    const svgHtml = renderPlantSvg(g.plantType, g.plantStage);
    const types = [
      ["cactus", "🌵 Cactus"],
      ["flower", "🌸 Flower"],
      ["bonsai", "🌳 Bonsai"],
    ];

    const selectHtml = `
      <select class="plant-type-select" data-act="change-plant-type" aria-label="Choose plant type" style="font-size:0.75rem; padding:2px 6px; border-radius:6px; border:1px solid var(--border); background:var(--bg-1); color:var(--ink);">
        ${types.map(([val, name]) => `<option value="${val}" ${g.plantType === val ? "selected" : ""}>${name}</option>`).join("")}
      </select>
    `;

    return card(
      "garden",
      `<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span>🪴 Focus Garden</span>
        ${selectHtml}
      </div>`,
      "",
      `
      <div style="display:flex; align-items:center; gap:16px;">
        <div style="flex:1; display:flex; justify-content:center;">
          ${svgHtml}
        </div>
        <div style="flex:1.2;">
          <h4 style="margin:0 0 4px; font-size:1.1rem; color:var(--accent); font-weight:700;">${stageName}</h4>
          <p class="muted" style="margin:0 0 10px; font-size:0.75rem;">${waterText}</p>
          <div style="width:100%; height:6px; background:var(--bg-3); border-radius:3px; margin-bottom:12px; overflow:hidden;">
            <div style="width:${progressPct}%; height:100%; background:var(--accent); border-radius:3px; transition: width 0.3s ease;"></div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn primary sm" data-act="water-plant" ${g.waterReservoir > 0 ? "" : "disabled"} style="padding:6px 12px; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
              💧 Water <span class="water-badge" style="background:rgba(255,255,255,0.2); padding:1px 5px; border-radius:8px; font-size:0.7rem;">${g.waterReservoir}</span>
            </button>
            <button class="btn sm ghost" data-act="garden-help" style="padding:6px 8px; font-size:0.8rem;">❓ Info</button>
          </div>
          <p class="muted" style="margin:8px 0 0; font-size:0.7rem; line-height:1.2;">Earn water by completing tasks & focus sessions! (1 💧 per 10 XP)</p>
        </div>
      </div>
      `,
    );
  }

  function last7DaysActivity() {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const k = isoForOffset(-i);
      const act = state.activity[k] || { tasks: 0, focusMin: 0, routines: 0 };
      list.push({
        dateKey: k,
        tasks: act.tasks || 0,
        focusMin: act.focusMin || 0,
      });
    }
    return list;
  }

  // Seamless home-screen glance at the allowance: this week's running total
  // and any finished weeks waiting for a parent payout. Taps through to Payday.
  // Always-on home card: shows the week's running total (or $0), surfaces any
  // money ready for payday, and gives a one-tap ⚙️ into the parent settings.
  // Tapping the card body opens the full Payday view.
  function paydayCard() {
    const r = state.rewards;
    if (!r) return "";
    const wk = computeWeek(thisWeekKey());
    const ready = readyTotal();
    const body = !r.enabled
      ? `<p class="sub" style="margin:0">Allowance is paused. Tap ⚙️ to turn it back on.</p>`
      : ready > 0
        ? `<div class="pay-home-ready">💵 <b>${money(
            ready,
          )}</b> ready for payday — tap to pay out</div>`
        : `<p class="sub" style="margin:0">${
            wk.total > 0
              ? "Earned so far this week · paid out next Monday."
              : "Finish your work to start earning · paid out next Monday."
          }</p>`;
    return `<section class="card pay-home" data-card="payday" data-act="view-rewards" role="button" tabindex="0" aria-label="Open Payday">
      <div class="head">
        <div><h3>💰 Allowance</h3><p class="sub">${weekLabel(
          thisWeekKey(),
        )}</p></div>
        <div class="pay-home-right">
          <span class="pay-home-amt">${money(r.enabled ? wk.total : 0)}</span>
          <button class="btn sm ghost pay-home-gear" data-act="reward-settings" aria-label="Edit allowance settings" title="Allowance settings">⚙️</button>
        </div>
      </div>
      ${body}
    </section>`;
  }

  function momentumCard() {
    const lastWin = state.wins[state.wins.length - 1];
    const todayAct = state.activity[todayKey()] || {
      tasks: 0,
      focusMin: 0,
      routines: 0,
    };

    // Generate weekly activity SVG chart
    const activityData = last7DaysActivity();
    const maxFocus = Math.max(...activityData.map((d) => d.focusMin), 15);
    const maxTasks = Math.max(...activityData.map((d) => d.tasks), 3);

    let barsSvg = "";
    const step = 290 / 7;
    activityData.forEach((d, i) => {
      const cx = 15 + i * step + step / 2;

      // Focus bar height (max 65px)
      const fHeight = (d.focusMin / maxFocus) * 65;
      const fY = 85 - fHeight;
      const fBar =
        d.focusMin > 0
          ? `<rect x="${cx - 8}" y="${fY}" width="6" height="${fHeight}" rx="3" fill="url(#focusGrad)" />`
          : `<circle cx="${cx - 5}" cy="83" r="1.5" fill="var(--muted)" opacity="0.3" />`;

      // Tasks bar height (max 65px)
      const tHeight = (d.tasks / maxTasks) * 65;
      const tY = 85 - tHeight;
      const tBar =
        d.tasks > 0
          ? `<rect x="${cx + 2}" y="${tY}" width="6" height="${tHeight}" rx="3" fill="url(#tasksGrad)" />`
          : `<circle cx="${cx + 5}" cy="83" r="1.5" fill="var(--muted)" opacity="0.3" />`;

      let dayName = "Day";
      try {
        dayName = parseLocal(d.dateKey).toLocaleDateString(undefined, {
          weekday: "narrow",
        });
      } catch (e) {
        dayName = d.dateKey.slice(-2);
      }

      barsSvg += `
        ${fBar}
        ${tBar}
        <text x="${cx}" y="100" text-anchor="middle" font-size="9" fill="var(--muted)" font-weight="bold">${dayName}</text>
      `;
    });

    const chartSvg = `
      <svg width="100%" height="110" viewBox="0 0 320 110" style="background:transparent; overflow:visible; margin-top:12px; margin-bottom:8px;">
        <defs>
          <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" />
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.5" />
          </linearGradient>
          <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#be185d" />
            <stop offset="100%" stop-color="#c2410c" stop-opacity="0.5" />
          </linearGradient>
        </defs>
        <!-- Legend -->
        <g transform="translate(10, 0)">
          <rect x="0" y="2" width="7" height="7" rx="2" fill="var(--accent)" />
          <text x="11" y="9" font-size="8.5" fill="var(--muted)">Focus (min)</text>
          <rect x="90" y="2" width="7" height="7" rx="2" fill="#be185d" />
          <text x="101" y="9" font-size="8.5" fill="var(--muted)">Tasks Done</text>
        </g>
        <line x1="15" y1="85" x2="305" y2="85" stroke="var(--border)" stroke-width="1" />
        ${barsSvg}
      </svg>
    `;

    return card(
      "momentum",
      "🏆 Momentum",
      "",
      `
      <div class="progress-strip" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr))">
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${streak()}🔥</b><small class="muted">Day streak</small></div>
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${state.points}</b><small class="muted">Points</small></div>
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${todayAct.tasks}</b><small class="muted">Done today</small></div>
        <div class="statbox" style="background:var(--bg-2);color:var(--ink)"><b>${todayAct.focusMin}m</b><small class="muted">Focused</small></div>
      </div>
      ${chartSvg}
      ${lastWin ? `<p class="muted" style="margin:6px 0 0">Last win: <b>${esc(lastWin.text)}</b></p>` : ""}
      `,
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
        .map(
          (c) =>
            `<option value="${c.id}">${c.emoji || "📚"} ${esc(c.name)}</option>`,
        )
        .join("")}</select></div>
      <div class="field"><label>When is it due?</label>
        <div class="seg" id="qaDueSeg">${pick(isoForOffset(0), "Today")}${pick(isoForOffset(1), "Tomorrow")}${pick("custom", "Pick a date")}${pick("", "Not sure")}</div>
        <input type="date" id="qaDate" value="${esc(due && due !== "custom" ? due : "")}" style="margin-top:8px;${due === "custom" || (due && due !== isoForOffset(0) && due !== isoForOffset(1)) ? "" : "display:none"}">
      </div>
      <button class="btn primary block big" data-act="save-quickadd">＋ Add it</button>
      <button class="btn block ghost" data-act="open-task" style="margin-top:8px">More details…</button>`;
  }

  // Add / edit one of the student's own movement items on the Health page.
  function healthItemForm(item) {
    const editing = !!item;
    const [id, emoji, label, hint] = item || ["", "💪", "", ""];
    return `
      <p class="sub">Add your own way to move your body. It shows up on the Health page and earns the same allowance as the built-in ones.</p>
      <div class="g2 grid">
        <div class="field"><label>Emoji</label><input id="hEmoji" value="${esc(emoji || "💪")}" maxlength="4" placeholder="🏃"></div>
        <div class="field"><label>What is it?</label><input id="hLabel" value="${esc(label || "")}" placeholder="Went for a run" autocomplete="off"></div>
      </div>
      <div class="field"><label>Hint (optional)</label><input id="hHint" value="${esc(hint || "")}" placeholder="20 minutes or more"></div>
      <button class="btn primary block" data-act="save-health-item" data-id="${esc(id || "")}">${editing ? "Save changes" : "＋ Add it"}</button>`;
  }

  function taskForm(a) {
    const editing = !!a;
    a = a || {};
    return `
      <div class="field"><label>What is it?</label><input id="tTitle" value="${esc(a.title || "")}" placeholder="Math worksheet p. 42"></div>
      <div class="g2 grid">
        <div class="field"><label>Class</label><select id="tClass">${state.classes.map((c) => `<option value="${c.id}" ${a.classId === c.id ? "selected" : ""}>${c.emoji || "📚"} ${esc(c.name)}</option>`).join("")}</select></div>
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
      <button class="btn primary block" data-act="ai-breakdown" data-id="${a.id}" id="aiBreakBtn" style="margin-bottom:10px">✨ Break it down for me</button>
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
      <div class="g2 grid">
        <div class="field"><label>Class name</label><input id="cName" value="${esc(c.name || "")}" placeholder="Math"></div>
        <div class="field"><label>Emoji Icon (optional)</label><input id="cEmoji" value="${esc(c.emoji || "📚")}" placeholder="📐"></div>
      </div>
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
      <div class="field"><label>Repeat</label><select id="rmRepeat">${opt("none", "Just once")}${opt("daily", "Every day")}${opt("weekdays", "Weekdays (Mon–Fri)")}${opt("weekends", "Weekends (Sat–Sun)")}${opt("weekly", "Weekly (same weekday)")}</select></div>
      <p class="muted" style="font-size:.8rem;margin:-2px 0 8px">A repeating reminder comes back each day — checking it off just clears it for today.</p>
      <button class="btn primary block" data-act="save-reminder" data-id="${esc(r.id || "")}">${r.id ? "Save changes" : "Add reminder"}</button>`;
  }

  function routineForm(r) {
    r = r || { items: [] };
    return `
      ${
        !r.id
          ? `
        <div style="margin-bottom: 16px;">
          <label style="font-size:.74rem;font-weight:900;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:8px;">🚀 Quick Middle School Templates</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button type="button" class="btn sm" data-act="apply-routine-template" data-template="after-school" style="font-size:0.8rem;padding:6px 10px;">🎒 After School Reset</button>
            <button type="button" class="btn sm" data-act="apply-routine-template" data-template="morning" style="font-size:0.8rem;padding:6px 10px;">🧠 Morning Launchpad</button>
            <button type="button" class="btn sm" data-act="apply-routine-template" data-template="study-prep" style="font-size:0.8rem;padding:6px 10px;">📝 Study Prep</button>
            <button type="button" class="btn sm" data-act="apply-routine-template" data-template="evening" style="font-size:0.8rem;padding:6px 10px;">🌙 Bedtime Prep</button>
          </div>
        </div>
      `
          : ""
      }
      <div class="g2 grid">
        <div class="field"><label>Routine name</label><input id="rName" value="${esc(r.name || "")}" placeholder="Morning Launch"></div>
        <div class="field"><label>Emoji</label><input id="rEmoji" value="${esc(r.emoji || "🔁")}" maxlength="4"></div>
      </div>
      <div class="field"><label>Repeat on</label>
        <div class="day-toggle" id="rDays">${DAYS.map((d) => `<button type="button" class="btn sm day-btn ${(r.days || []).includes(d) ? "on" : ""}" data-act="toggle-routine-day" data-arg="${d}" aria-pressed="${(r.days || []).includes(d)}">${d[0]}</button>`).join("")}</div>
        <small class="muted">No days picked = every day.</small>
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

  const ROUTINE_TEMPLATES = {
    "after-school": {
      name: "After School Reset",
      emoji: "🎒",
      steps: [
        "Unpack my backpack",
        "Put any trash/recycling in the bin",
        "Put my lunchbox in the kitchen",
        "Plug in my school Chromebook/laptop",
        "Open Focus School to check what is due",
      ],
    },
    morning: {
      name: "Morning Launchpad",
      emoji: "🧠",
      steps: [
        "Eat breakfast",
        "Double-check Chromebook is in my bag",
        "Pack binders, books, and homework folder",
        "Grab water bottle and house keys",
        "Put on shoes and backpack",
      ],
    },
    "study-prep": {
      name: "Study Space Prep",
      emoji: "📝",
      steps: [
        "Clear my desk of clutter",
        "Close all browser tabs (except schoolwork)",
        "Get a glass of water",
        "Put my phone in another room or on silent",
        "Start a 25-minute study timer",
      ],
    },
    evening: {
      name: "Bedtime Prep",
      emoji: "🌙",
      steps: [
        "Put completed homework in my binder/backpack",
        "Plug in Chromebook so it charges overnight",
        "Lay out my clothes for tomorrow",
        "Set my alarm clock",
        "Put phone away from my bed",
      ],
    },
  };

  const BRAIN_BREAKS = {
    stretch: [
      {
        icon: "🧘",
        title: "Desk Stretch",
        desc: "Reach your arms up to the sky, hold for 10 seconds, then roll your shoulders backward 5 times.",
      },
      {
        icon: "🦒",
        title: "Neck Release",
        desc: "Gently tilt your head toward your left shoulder. Hold for 10 seconds. Switch to the right. Roll your neck in a slow circle.",
      },
      {
        icon: "🦖",
        title: "Spine Twister",
        desc: "Sit up straight, twist your torso to the right and hold your chair back for 5 seconds. Repeat on the left.",
      },
    ],
    active: [
      {
        icon: "🏃",
        title: "Energy Recharge",
        desc: "Do 10 jumping jacks, or try to balance on one leg for 30 seconds. Get that blood pumping!",
      },
      {
        icon: "🤸",
        title: "Squat Challenge",
        desc: "Stand up and do 10 slow, controlled squats. Feel the energy return to your legs!",
      },
      {
        icon: "🕺",
        title: "Quick Shakeout",
        desc: "Stand up and shake out your arms, legs, and hands for 20 seconds. Release all the sitting tension!",
      },
    ],
    relax: [
      {
        icon: "👀",
        title: "The 20-20-20 Rule",
        desc: "Look at something at least 20 feet away for 20 seconds. Blink slowly 5 times to let your eye muscles relax.",
      },
      {
        icon: "🌬️",
        title: "Box Breathing",
        desc: "Inhale for 4 seconds, hold your breath for 4 seconds, exhale for 4 seconds, and hold empty for 4 seconds. Repeat 3 times.",
      },
      {
        icon: "🧘‍♀️",
        title: "Mind Clearing",
        desc: "Close your eyes. Listen to the room around you. Name 3 quiet sounds you hear to anchor your attention.",
      },
    ],
    hydration: [
      {
        icon: "💧",
        title: "Water Run",
        desc: "Go walk to the kitchen or water fountain, fill up your bottle, and drink 5 big gulps of cool water.",
      },
      {
        icon: "🥤",
        title: "Power Sip",
        desc: "Locate your water bottle. Take 3 slow, deep gulps to rehydrate your brain cells.",
      },
    ],
  };

  let currentBrainBreak = null;
  function getRandomBrainBreak(category = "all") {
    let list = [];
    if (category === "all") {
      Object.keys(BRAIN_BREAKS).forEach((cat) => {
        list = list.concat(BRAIN_BREAKS[cat]);
      });
    } else {
      list = BRAIN_BREAKS[category] || [];
    }
    const idx = Math.floor(Math.random() * list.length);
    return (
      list[idx] || {
        icon: "💧",
        title: "Water Run",
        desc: "Go get a glass of water!",
      }
    );
  }

  function renderBrainBreakCardHTML(brk) {
    return `
      <div class="brain-break-card">
        <div class="break-icon" aria-hidden="true">${esc(brk.icon)}</div>
        <div style="flex:1">
          <div class="break-title">${esc(brk.title)}</div>
          <div class="break-desc">${esc(brk.desc)}</div>
        </div>
      </div>
    `;
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
      stopAmbientSound();
      updateAmbientSoundUI("none");
      const ov = $("#focusOverlay");
      ov.classList.add("open");
      this.renderSteps();
      updateVisualizer();
      const defMin = state.settings.defaultFocusMin;
      const presetBtns = document.querySelectorAll(
        "#fPresetsControls button[data-act='set-focus-preset']",
      );
      presetBtns.forEach((btn) => {
        const isPressed = Number(btn.dataset.arg) === defMin;
        btn.setAttribute("aria-pressed", isPressed ? "true" : "false");
      });
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
      addPoints(m);
      earnReward("focus", "Focus session");
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
        currentBrainBreak = getRandomBrainBreak("all");
        openModal(
          "Nice work! 🎉",
          `<p>You focused for <b>${earned} minutes</b> and earned <b>+${earned} XP</b>!</p>
          <div id="brainBreakContainer">${renderBrainBreakCardHTML(currentBrainBreak)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 16px;justify-content:center;">
            <button class="btn sm" data-act="spin-break" style="background:var(--accent);color:white">🔄 Spin Break Wheel</button>
            <button class="btn sm" data-act="choose-break" data-arg="stretch">🧘 Stretch</button>
            <button class="btn sm" data-act="choose-break" data-arg="active">🏃 Active</button>
            <button class="btn sm" data-act="choose-break" data-arg="relax">👀 Relax</button>
            <button class="btn sm" data-act="choose-break" data-arg="hydration">💧 Hydration</button>
          </div>
          <div class="row"><button class="btn primary" data-act="focus-break">Start break</button><button class="btn" data-act="focus-again">Keep focusing</button><button class="btn" data-act="focus-stop">I'm done</button></div>`,
        );
      } else {
        toast("Break's over — ready for one more?");
        addPoints(5);
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
      stopAmbientSound();
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
        addPoints(5);
        bumpActivity("routines");
        earnReward("routine", r.name || "Routine");
      }
      save({ immediate: true });
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
    dueTimedTodosForToday().forEach((td) => {
      const [hh, mm] = td.time.split(":").map(Number);
      const cur = now.getHours() * 60 + now.getMinutes();
      if (hh * 60 + mm <= cur) fireTodoReminder(td);
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

  function dueTimedTodosForToday() {
    const t = todayKey();
    return state.todos.filter((td) => {
      if (todoDoneToday(td)) return false;
      if (!td.time) return false;
      if (isTodoRecurring(td)) return todoOccursOn(td, t);
      return td.date === t || td.date < t;
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

  function fireTodoReminder(td) {
    if (
      !state.settings.notifications ||
      !notifSupport() ||
      Notification.permission !== "granted"
    )
      return;
    if (td.lastShown === todayKey()) return;
    td.lastShown = todayKey();
    save({ touch: false });
    showNotif("📝 To-do", {
      body: td.text,
      tag: "todo:" + td.id + ":" + todayKey(),
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

    // Schedule reminders
    dueRemindersForToday().forEach((r) => {
      if (!r.time || r.lastShown === todayKey()) return;
      const [hh, mm] = r.time.split(":").map(Number);
      const at = hh * 3600 + mm * 60;
      if (at <= cur) return; // already passed — checkReminders handles it
      const ms = (at - cur) * 1000;
      reminderTimers.push(setTimeout(() => fireReminder(r), ms));
    });

    // Schedule to-dos
    dueTimedTodosForToday().forEach((td) => {
      if (td.lastShown === todayKey()) return;
      const [hh, mm] = td.time.split(":").map(Number);
      const at = hh * 3600 + mm * 60;
      if (at <= cur) return; // already passed — checkReminders handles it
      const ms = (at - cur) * 1000;
      reminderTimers.push(setTimeout(() => fireTodoReminder(td), ms));
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

  function mergeStates(local, remote) {
    const merged = { ...local };

    // 1. Merge tombstones (deletedIds)
    const mergedDeletedIds = { ...(local.deletedIds || {}) };
    for (const [id, time] of Object.entries(remote.deletedIds || {})) {
      mergedDeletedIds[id] = Math.max(mergedDeletedIds[id] || 0, time);
    }
    merged.deletedIds = mergedDeletedIds;

    // Helper to check if an item was deleted
    const isDeleted = (id, updatedAt) => {
      const delTime = mergedDeletedIds[id];
      if (delTime === undefined) return false;
      return (updatedAt || 0) <= delTime;
    };

    // 2. Merge assignments
    const localMap = new Map((local.assignments || []).map((a) => [a.id, a]));
    // `remote` is a raw KV blob (never normalized), so a legacy/corrupt payload
    // may lack `assignments` entirely — guard like every other collection below,
    // otherwise the whole merge throws and sync silently drops to "offline".
    const remoteMap = new Map((remote.assignments || []).map((a) => [a.id, a]));
    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
    const mergedAssignments = [];
    for (const id of allIds) {
      const loc = localMap.get(id);
      const rem = remoteMap.get(id);
      const chosen =
        loc && rem
          ? (loc.updatedAt || 0) >= (rem.updatedAt || 0)
            ? loc
            : rem
          : loc || rem;
      if (!isDeleted(id, chosen.updatedAt)) {
        mergedAssignments.push(chosen);
      }
    }
    merged.assignments = mergedAssignments;

    // 3. Merge classes
    const localClassesMap = new Map(local.classes.map((c) => [c.id, c]));
    const remoteClassesMap = new Map(
      (remote.classes || []).map((c) => [c.id, c]),
    );
    const allClassIds = new Set([
      ...localClassesMap.keys(),
      ...remoteClassesMap.keys(),
    ]);
    const mergedClasses = [];
    for (const id of allClassIds) {
      const loc = localClassesMap.get(id);
      const rem = remoteClassesMap.get(id);
      const chosen =
        loc && rem
          ? (loc.updatedAt || 0) >= (rem.updatedAt || 0)
            ? loc
            : rem
          : loc || rem;
      if (!isDeleted(id, chosen.updatedAt)) {
        mergedClasses.push(chosen);
      }
    }
    merged.classes = mergedClasses;

    // 4. Merge routines
    const localRoutinesMap = new Map(local.routines.map((r) => [r.id, r]));
    const remoteRoutinesMap = new Map(
      (remote.routines || []).map((r) => [r.id, r]),
    );
    const allRoutineIds = new Set([
      ...localRoutinesMap.keys(),
      ...remoteRoutinesMap.keys(),
    ]);
    const mergedRoutines = [];
    for (const id of allRoutineIds) {
      const loc = localRoutinesMap.get(id);
      const rem = remoteRoutinesMap.get(id);
      const chosen =
        loc && rem
          ? (loc.updatedAt || 0) >= (rem.updatedAt || 0)
            ? loc
            : rem
          : loc || rem;
      if (!isDeleted(id, chosen.updatedAt)) {
        mergedRoutines.push(chosen);
      }
    }
    merged.routines = mergedRoutines;

    // 5. Merge reminders
    const localRemindersMap = new Map(
      (local.reminders || []).map((r) => [r.id, r]),
    );
    const remoteRemindersMap = new Map(
      (remote.reminders || []).map((r) => [r.id, r]),
    );
    const allReminderIds = new Set([
      ...localRemindersMap.keys(),
      ...remoteRemindersMap.keys(),
    ]);
    const mergedReminders = [];
    for (const id of allReminderIds) {
      const loc = localRemindersMap.get(id);
      const rem = remoteRemindersMap.get(id);
      const chosen =
        loc && rem
          ? (loc.updatedAt || 0) >= (rem.updatedAt || 0)
            ? loc
            : rem
          : loc || rem;
      if (!isDeleted(id, chosen.updatedAt || chosen.createdAt)) {
        mergedReminders.push(chosen);
      }
    }
    merged.reminders = mergedReminders;

    // 6. Merge todos
    const localTodosMap = new Map((local.todos || []).map((t) => [t.id, t]));
    const remoteTodosMap = new Map((remote.todos || []).map((t) => [t.id, t]));
    const allTodoIds = new Set([
      ...localTodosMap.keys(),
      ...remoteTodosMap.keys(),
    ]);
    const mergedTodos = [];
    for (const id of allTodoIds) {
      const loc = localTodosMap.get(id);
      const rem = remoteTodosMap.get(id);
      const chosen =
        loc && rem
          ? (loc.updatedAt || 0) >= (rem.updatedAt || 0)
            ? loc
            : rem
          : loc || rem;
      if (!isDeleted(id, chosen.updatedAt || chosen.createdAt)) {
        mergedTodos.push(chosen);
      }
    }
    merged.todos = mergedTodos;

    // 7. Merge activity
    merged.activity = { ...local.activity };
    for (const [date, remAct] of Object.entries(remote.activity || {})) {
      const locAct = merged.activity[date] || {
        tasks: 0,
        focusMin: 0,
        routines: 0,
      };
      merged.activity[date] = {
        tasks: Math.max(locAct.tasks || 0, remAct.tasks || 0),
        focusMin: Math.max(locAct.focusMin || 0, remAct.focusMin || 0),
        routines: Math.max(locAct.routines || 0, remAct.routines || 0),
      };
    }

    // Union routine checklist progress by day so two devices checking different
    // steps today keep both checks, while tomorrow naturally starts clean.
    merged.routineLog = mergeRoutineLogs(local.routineLog, remote.routineLog);

    // 8. Merge wins
    const winsMap = new Map(local.wins.map((w) => [w.text + w.date, w]));
    for (const w of remote.wins || []) {
      winsMap.set(w.text + w.date, w);
    }
    merged.wins = [...winsMap.values()];

    // 9. Merge reflections
    merged.reflections = { ...local.reflections };
    for (const [date, remRef] of Object.entries(remote.reflections || {})) {
      const locRef = merged.reflections[date];
      if (
        !locRef ||
        new Date(remRef.timestamp || 0) > new Date(locRef.timestamp || 0)
      ) {
        merged.reflections[date] = remRef;
      }
    }

    // 10. Merge points / XP
    merged.points = Math.max(local.points || 0, remote.points || 0);

    // 11. Merge settings (take remote if remote is newer, but preserve local sync config)
    if ((remote.updatedAt || 0) > (local.updatedAt || 0)) {
      merged.settings = { ...local.settings, ...(remote.settings || {}) };
    } else {
      merged.settings = { ...(remote.settings || {}), ...local.settings };
    }
    merged.settings.sync = { ...local.settings.sync };

    // 11b. Home-screen layout (card order + hidden cards) is merged by its own
    // change-stamp, not the document updatedAt — so a rearrange on one device
    // isn't shadowed by unrelated newer activity on another.
    const lha = local.settings?.homeOrderAt || 0;
    const rha = remote.settings?.homeOrderAt || 0;
    const layout = rha > lha ? remote.settings : local.settings;
    if (layout) {
      if (Array.isArray(layout.homeOrder))
        merged.settings.homeOrder = layout.homeOrder;
      if (Array.isArray(layout.hiddenCards))
        merged.settings.hiddenCards = layout.hiddenCards;
      merged.settings.homeOrderAt = Math.max(lha, rha);
    }

    // 12. Merge synced devices registry by ID, keeping newer lastActive
    const devMap = new Map((local.syncDevices || []).map((d) => [d.id, d]));
    for (const d of remote.syncDevices || []) {
      const loc = devMap.get(d.id);
      if (!loc || (d.lastActive || 0) > (loc.lastActive || 0)) {
        devMap.set(d.id, d);
      }
    }
    merged.syncDevices = [...devMap.values()];

    // 13. Merge rewards. The ledger is the source of truth: union entries by id
    // (so an earning recorded on either device counts exactly once), then derive
    // balance/paidOut from it. Config (rates/cap/pin/currency/enabled) follows
    // whichever device was saved more recently, matching the settings rule.
    {
      const lr = local.rewards || {};
      const rr = remote.rewards || {};
      const byId = new Map((lr.ledger || []).map((e) => [e.id, e]));
      for (const e of rr.ledger || []) if (!byId.has(e.id)) byId.set(e.id, e);
      const ledger = [...byId.values()].sort((a, b) =>
        String(b.ts).localeCompare(String(a.ts)),
      );
      const sumType = (t) =>
        ledger.reduce(
          (s, e) => (e.type === t ? s + (Number(e.amount) || 0) : s),
          0,
        );
      const r2 = Math.round((sumType("earn") - sumType("cashout")) * 100) / 100;
      // Union weekly payouts by id too — a payout settled on either device must
      // count once. paidOut is derived: legacy cashouts + recorded payouts.
      const payById = new Map((lr.payouts || []).map((p) => [p.id, p]));
      for (const p of rr.payouts || [])
        if (!payById.has(p.id)) payById.set(p.id, p);
      const payouts = [...payById.values()].sort((a, b) =>
        String(b.paidAt).localeCompare(String(a.paidAt)),
      );
      const paidFromPayouts = payouts.reduce(
        (s, p) => s + (Number(p.amount) || 0),
        0,
      );
      const cfg = (remote.updatedAt || 0) > (local.updatedAt || 0) ? rr : lr;
      const numc = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
      merged.rewards = {
        enabled: cfg.enabled !== false,
        currency: cfg.currency || "$",
        rates: { ...(lr.rates || {}), ...(cfg.rates || {}) },
        dailyCap: Number(cfg.dailyCap) || 0,
        weeklyCap: numc(cfg.weeklyCap, 10),
        bonusPerfectWeek: numc(cfg.bonusPerfectWeek, 1),
        pin: cfg.pin || "",
        balance: Math.max(0, r2),
        paidOut: Math.round((sumType("cashout") + paidFromPayouts) * 100) / 100,
        ledger: ledger.slice(0, 1000),
        payouts: payouts.slice(0, 520),
      };
    }

    // 14. Merge readingProgress and bookTransition
    {
      const mergedReading = { ...(local.readingProgress || {}) };
      for (const [dayId, remProg] of Object.entries(
        remote.readingProgress || {},
      )) {
        const locProg = mergedReading[dayId];
        if (!locProg) {
          mergedReading[dayId] = remProg;
        } else {
          const locLen =
            (locProg.gist || "").length +
            (locProg.evidence || "").length +
            (locProg.response || "").length;
          const remLen =
            (remProg.gist || "").length +
            (remProg.evidence || "").length +
            (remProg.response || "").length;
          if (remProg.done && !locProg.done) {
            mergedReading[dayId] = remProg;
          } else if (!remProg.done && locProg.done) {
            // keep local
          } else if (remLen > locLen) {
            mergedReading[dayId] = remProg;
          }
        }
      }
      merged.readingProgress = mergedReading;

      const lt = local.bookTransition || {};
      const rt = remote.bookTransition || {};
      const remoteIsNewer = (remote.updatedAt || 0) > (local.updatedAt || 0);
      merged.bookTransition = {
        finishedB: remoteIsNewer
          ? rt.finishedB || lt.finishedB || ""
          : lt.finishedB || rt.finishedB || "",
        responseB: lt.responseB || rt.responseB || false,
        startC: remoteIsNewer
          ? rt.startC || lt.startC || ""
          : lt.startC || rt.startC || "",
        rememberText:
          (rt.rememberText || "").length > (lt.rememberText || "").length
            ? rt.rememberText || ""
            : lt.rememberText || "",
      };
    }

    merged.updatedAt = Date.now();
    return merged;
  }

  function showConflictResolver(localState, cloudState) {
    const localAssigns = localState.assignments || [];
    const cloudAssigns = cloudState.assignments || [];
    const addedLocally = localAssigns.filter(
      (a) => !cloudAssigns.some((x) => x.id === a.id),
    );
    const addedInCloud = cloudAssigns.filter(
      (a) => !localAssigns.some((x) => x.id === a.id),
    );

    let diffHtml = "";
    if (addedLocally.length || addedInCloud.length) {
      diffHtml = `
        <div class="conflict-diffs" style="margin-top: 12px; font-size: 0.82rem; text-align: left; max-height: 120px; overflow-y: auto; border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: rgba(0,0,0,0.1);">
          <b style="color: var(--muted); display: block; margin-bottom: 4px;">Difference Summary:</b>
          ${addedLocally.map((a) => `<div style="color: var(--teal); font-weight: 700; margin-bottom: 2px;">💻 Local: "${esc(a.title)}"</div>`).join("")}
          ${addedInCloud.map((a) => `<div style="color: var(--amber); font-weight: 700; margin-bottom: 2px;">☁️ Cloud: "${esc(a.title)}"</div>`).join("")}
        </div>
      `;
    }

    const bodyHtml = `
      <div style="text-align: center;">
        <p class="sub" style="margin-top:0">We found newer changes on another device. How would you like to sync?</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0;">
          <div class="card" style="border-color: var(--teal); background: color-mix(in srgb, var(--teal) 5%, transparent); padding: 10px; text-align: left;">
            <h4 style="color: var(--teal); margin: 0 0 6px; font-size: 0.88rem;">💻 Local Device</h4>
            <div style="font-size: 0.76rem; line-height: 1.45; color: var(--ink);">
              <b>Last Edited:</b><br>${new Date(localState.updatedAt || 0).toLocaleString()}<br>
              <b>Tasks:</b> ${localState.assignments.length}<br>
              <b>Classes:</b> ${localState.classes.length}
            </div>
          </div>
          <div class="card" style="border-color: var(--amber); background: color-mix(in srgb, var(--amber) 5%, transparent); padding: 10px; text-align: left;">
            <h4 style="color: var(--amber); margin: 0 0 6px; font-size: 0.88rem;">☁️ Cloud Backup</h4>
            <div style="font-size: 0.76rem; line-height: 1.45; color: var(--ink);">
              <b>Last Edited:</b><br>${new Date(cloudState.updatedAt || 0).toLocaleString()}<br>
              <b>Tasks:</b> ${cloudState.assignments.length}<br>
              <b>Classes:</b> ${cloudState.classes.length}
            </div>
          </div>
        </div>
        ${diffHtml}
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
          <button class="btn primary block" data-act="resolve-conflict-merge">🔀 Merge Both (Recommended)</button>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button class="btn block" data-act="resolve-conflict-local">💻 Keep Local</button>
            <button class="btn block" data-act="resolve-conflict-cloud">☁️ Keep Cloud</button>
          </div>
        </div>
      </div>
    `;

    window._pendingLocalConflictState = localState;
    window._pendingCloudConflictState = cloudState;

    openModal("⚠️ Sync Conflict Found", bodyHtml);
  }

  function getWeeklyStats() {
    const stats = {
      focusMin: 0,
      tasks: 0,
      routines: 0,
      moodSum: 0,
      moodCount: 0,
      focusSum: 0,
      focusCount: 0,
    };
    for (let i = 0; i < 7; i++) {
      const k = isoForOffset(-i);
      const act = state.activity[k] || { focusMin: 0, tasks: 0, routines: 0 };
      stats.focusMin += act.focusMin || 0;
      stats.tasks += act.tasks || 0;
      stats.routines += act.routines || 0;

      const ref = state.reflections && state.reflections[k];
      if (ref) {
        if (ref.mood) {
          stats.moodSum += ref.mood;
          stats.moodCount++;
        }
        if (ref.focus) {
          stats.focusSum += ref.focus;
          stats.focusCount++;
        }
      }
    }
    stats.avgMood = stats.moodCount
      ? (stats.moodSum / stats.moodCount).toFixed(1)
      : "N/A";
    stats.avgFocus = stats.focusCount
      ? (stats.focusSum / stats.focusCount).toFixed(1)
      : "N/A";
    return stats;
  }

  function weeklyReportCardHTML() {
    const stats = getWeeklyStats();
    return `
      <div class="card weekly-report-card" id="weeklyReportCard" style="margin-bottom:16px;">
        <div class="head">
          <div>
            <h3>📊 Weekly Report Card</h3>
            <p class="sub">Overview of your productivity and reflection scores over the last 7 days.</p>
          </div>
          <button class="btn sm" data-act="print-report">🖨️ Print Report</button>
        </div>
        <div class="diag-grid" style="margin-top: 12px;">
          <div class="diag-stat"><b>⚡ Focused</b><span>${stats.focusMin}m</span></div>
          <div class="diag-stat"><b>✅ Tasks Completed</b><span>${stats.tasks}</span></div>
          <div class="diag-stat"><b>🔁 Routines Run</b><span>${stats.routines}</span></div>
          <div class="diag-stat"><b>🧠 Avg Mood</b><span>${stats.avgMood}${stats.avgMood !== "N/A" ? " / 5" : ""}</span></div>
        </div>
      </div>
    `;
  }

  const cloud = {
    available() {
      return location.protocol.startsWith("http"); // endpoint reachable on hosted site
    },
    base: "/api/state",
    _busy: false,
    // status: "idle" | "syncing" | "synced" | "offline" — drives the UI chip.
    status: "idle",
    _interval: null,
    // Update the status and refresh just the sync status line if it's on screen,
    // so we never need a full re-render for a status flicker.
    _setStatus(next) {
      this.status = next;
      const el = document.getElementById("syncStatus");
      if (el) el.outerHTML = syncStatusHTML();
      if (typeof updateHeaderStatus === "function") updateHeaderStatus();
    },
    async push() {
      const code = state.settings.sync.code;
      if (!code || !this.available() || this._busy) return;
      this._busy = true;
      this._setStatus("syncing");
      try {
        const myName = getDeviceName();
        const now = Date.now();
        if (!Array.isArray(state.syncDevices)) {
          state.syncDevices = [];
        }
        // Cleanup old devices (> 30 days)
        state.syncDevices = state.syncDevices.filter(
          (d) => now - (d.lastActive || 0) < 30 * 24 * 60 * 60 * 1000,
        );

        const myDeviceId =
          deviceId ||
          localStorage.getItem("focus-school:device-id") ||
          "unknown";
        const existingIdx = state.syncDevices.findIndex(
          (d) => d.id === myDeviceId,
        );
        if (existingIdx >= 0) {
          state.syncDevices[existingIdx].lastActive = now;
          state.syncDevices[existingIdx].name = myName;
        } else {
          state.syncDevices.push({
            id: myDeviceId,
            name: myName,
            lastActive: now,
          });
        }

        const res = await fetch(
          `${this.base}?code=${encodeURIComponent(code)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updatedAt: state.updatedAt, state }),
          },
        );
        if (res && res.ok) {
          state.settings.sync.lastAt = new Date().toISOString();
          mirror();
          this._setStatus("synced");
        } else {
          // 503 (endpoint not configured) or any error — stay local-only.
          this._setStatus("offline");
        }
      } catch {
        /* offline or no backend — fine, local data is the source of truth */
        this._setStatus("offline");
      } finally {
        this._busy = false;
      }
    },
    async pull({ forceMerge = false } = {}) {
      const code = state.settings.sync.code;
      if (!code || !this.available()) return false;
      this._setStatus("syncing");
      try {
        const res = await fetch(
          `${this.base}?code=${encodeURIComponent(code)}`,
        );
        if (!res.ok) {
          this._setStatus("offline");
          return false;
        }
        const data = await res.json();
        if (data && data.state) {
          const remoteUpdated = data.updatedAt || 0;
          const localUpdated = state.updatedAt || 0;
          if (remoteUpdated > localUpdated || forceMerge) {
            const merged = mergeStates(state, data.state);
            const mergedNorm = normalize(merged);
            // Compare CONTENT, ignoring the volatile top-level `updatedAt`
            // (mergeStates always stamps it fresh). Without this, the stringify
            // comparison was always unequal, so the 10s auto-pull replaced
            // state + re-rendered + pushed to KV every single tick — wiping any
            // half-typed input and churning the store. Now a no-op pull is a
            // true no-op. Both sides are normalized so key ordering can't lie.
            const changed =
              remoteUpdated > localUpdated ||
              JSON.stringify({ ...mergedNorm, updatedAt: 0 }) !==
                JSON.stringify({ ...state, updatedAt: 0 });
            let shouldPushMerged = false;
            if (changed) {
              const prev = suppressPush;
              suppressPush = true;
              state = mergedNorm;
              await save({ touch: false, immediate: true });
              suppressPush = prev;
              shouldPushMerged = !prev;
            }
            state.settings.sync.lastAt = new Date().toISOString();
            mirror();
            this._setStatus("synced");
            if (shouldPushMerged) await this.push();
            return changed;
          }
        }
        // Local is same/newer — nothing to apply, but we're in sync.
        state.settings.sync.lastAt = new Date().toISOString();
        mirror();
        this._setStatus("synced");
      } catch {
        this._setStatus("offline");
      }
      return false;
    },
    // Pull + re-render if anything changed. Safe to call from any auto trigger.
    async autoPull() {
      if (!state.settings.sync.enabled || !this.available()) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        this._setStatus("offline");
        return;
      }
      const changed = await this.pull({ forceMerge: true });
      if (changed) render();
    },
    // Start/refresh the periodic pull loop while the tab is open.
    startAuto() {
      this.stopAuto();
      if (!state.settings.sync.enabled) return;
      // ~10s cadence: fresh enough to feel live, light on the KV endpoint.
      this._interval = setInterval(() => this.autoPull(), 10000);
    },
    stopAuto() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
    },
  };

  // Human-friendly "how long ago" for the sync status line.
  function timeAgo(iso) {
    if (!iso) return "";
    const ms = Date.now() - new Date(iso).getTime();
    if (!isFinite(ms) || ms < 0) return "just now";
    const m = Math.round(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString();
  }

  // The live status chip. Re-rendered in place by cloud._setStatus via #syncStatus.
  function syncStatusHTML() {
    const s = state.settings.sync;
    // Map to existing pill variants (.blue/.green/default) — no new CSS, and
    // each variant already has a dark-mode rule, avoiding the dark-pill gotcha.
    let label, cls;
    if (!cloud.available()) {
      label = "Saved on this device — cloud not available here";
      cls = "";
    } else if (cloud.status === "syncing") {
      label = "Syncing…";
      cls = "blue";
    } else if (cloud.status === "offline") {
      label = "Offline — will sync later";
      cls = "";
    } else if (s.lastAt) {
      label = `Synced ✓ (${timeAgo(s.lastAt)})`;
      cls = "green";
    } else {
      label = "Ready to sync";
      cls = "blue";
    }
    return `<p id="syncStatus" class="pill ${cls}" style="margin:4px 0 10px">${esc(label)}</p>`;
  }

  // Deep link that pre-fills the code on the other device (handled at init).
  function linkURL(code) {
    return `${location.origin}${location.pathname}?view=sync&sync=${encodeURIComponent(code)}`;
  }

  // Strong, url-safe, human-readable sync code (16+ chars of entropy).
  function genSyncCode() {
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
    const bytes = new Uint8Array(14);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // No Web Crypto (old/insecure context): mix Date.now() + Math.random()
      // per byte so the code is still unpredictable instead of the all-zero
      // (fully guessable "focus-orca-aaaa…") a missing RNG would leave behind.
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (Math.floor(Math.random() * 256) + Date.now() + i) & 0xff;
      }
    }
    const alpha = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes
    const rand = [...bytes].map((b) => alpha[b % alpha.length]).join("");
    const w = words[bytes[0] % words.length];
    return `focus-${w}-${rand}`; // e.g. focus-hawk-<14 chars> → 24+ chars total
  }

  // ---------------------------------------------------------------------------
  // Google Calendar (client-side, read-only, no backend)
  // ---------------------------------------------------------------------------
  // Uses Google Identity Services (GIS) token client to get a short-lived access
  // token IN MEMORY (never persisted), then reads upcoming events from EACH of
  // the user's SELECTED calendars via the Calendar REST API, merging them into a
  // single time-sorted list tagged with the source calendar's name + color.
  // Persisted: the Web Client ID and the list of selected calendar IDs only.
  // Never persisted: tokens.
  const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
  const GIS_SRC = "https://accounts.google.com/gsi/client";
  const gcal = {
    token: sessionStorage.getItem("focus-school:gcal-token") || "", // access token — session only
    tokenClient: null,
    connected: !!sessionStorage.getItem("focus-school:gcal-token"),
    _gisLoaded: false,
    clientId() {
      return (
        state.settings.googleClientId.trim() ||
        window._defaultGoogleClientId ||
        ""
      );
    },
    // The calendar IDs to include. Defaults to ["primary"] when none chosen yet.
    selectedIds() {
      const ids = state.settings.gcalCalendars;
      return Array.isArray(ids) && ids.length ? ids : ["primary"];
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
    // Connect (or refresh the token). `after` is what to do once we have a
    // token: "events" (default) syncs events, "picker" opens the calendar
    // chooser after refreshing the calendar list.
    async connect(after = "events") {
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
        callback: async (resp) => {
          if (resp && resp.access_token) {
            this.token = resp.access_token;
            sessionStorage.setItem(
              "focus-school:gcal-token",
              resp.access_token,
            );
            this.connected = true;
            // Always refresh the calendar list so the picker stays current and
            // events can be labeled with calendar names/colors.
            await this.fetchCalendarList();
            if (after === "picker") this.openPicker();
            else this.fetchEvents();
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
    // List the user's calendars (id, name, color, primary) for the picker. The
    // metadata is cached so events stay labeled even offline.
    async fetchCalendarList() {
      if (!this.token) return [];
      try {
        const res = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList?" +
            new URLSearchParams({ minAccessRole: "reader", maxResults: "250" }),
          { headers: { Authorization: "Bearer " + this.token } },
        );
        if (!res.ok) {
          if (res.status === 401) {
            this.token = "";
            sessionStorage.removeItem("focus-school:gcal-token");
            this.connected = false;
          }
          return state.gcal?.calendars || [];
        }
        const data = await res.json();
        const calendars = (data.items || []).map((c) => ({
          id: c.id,
          name: c.summaryOverride || c.summary || c.id,
          color: c.backgroundColor || "#4285f4",
          primary: !!c.primary,
        }));
        state.gcal = {
          ...(state.gcal || { events: [], fetchedAt: "" }),
          calendars,
        };
        save();
        return calendars;
      } catch {
        return state.gcal?.calendars || [];
      }
    },
    // Fetch upcoming events from EVERY selected calendar, merge into one
    // time-sorted list, and tag each event with its source calendar.
    async fetchEvents() {
      if (!this.token) return this.connect();
      try {
        const timeMin = new Date().toISOString();
        const ids = this.selectedIds();
        // Map known calendar metadata for labeling (name + color).
        const meta = {};
        (state.gcal?.calendars || []).forEach((c) => (meta[c.id] = c));
        const params = (calId) =>
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?` +
          new URLSearchParams({
            timeMin,
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "50",
          });
        const results = await Promise.all(
          ids.map((calId) =>
            fetch(params(calId), {
              headers: { Authorization: "Bearer " + this.token },
            })
              .then((r) => (r.ok ? r.json().then((d) => ({ calId, d })) : null))
              .catch(() => null),
          ),
        );
        // 401 anywhere means the token expired — drop it so a reconnect prompts.
        if (results.every((r) => r === null)) {
          this.token = "";
          sessionStorage.removeItem("focus-school:gcal-token");
          this.connected = false;
          toast("Couldn't load Google events.");
          return;
        }
        const events = results
          .filter(Boolean)
          .flatMap(({ calId, d }) => {
            const cal = meta[calId] || {};
            const calName =
              cal.name || (calId === "primary" ? "Primary" : calId);
            const calColor = cal.color || "#4285f4";
            return (d.items || []).map((e) => ({
              id: e.id,
              title: e.summary || "(no title)",
              // All-day events use .date (YYYY-MM-DD); timed use .dateTime.
              start: e.start?.dateTime || e.start?.date || "",
              allDay: !e.start?.dateTime,
              location: e.location || "",
              htmlLink: e.htmlLink || "",
              // Source-calendar tags so multiple calendars are distinguishable.
              calId,
              calName,
              calColor,
            }));
          })
          .filter((e) => e.start)
          .sort((a, b) => (a.start < b.start ? -1 : 1));
        state.gcal = {
          ...(state.gcal || { calendars: [] }),
          events,
          fetchedAt: new Date().toISOString(),
        };
        save();
        render();
        toast(
          `Google Calendar synced (${events.length}) from ${ids.length} calendar${ids.length === 1 ? "" : "s"} 📅`,
        );
      } catch {
        toast("Couldn't reach Google Calendar.");
      }
    },
    // Show the calendar picker (checkboxes). Requires a token + calendar list.
    openPicker() {
      const cals = state.gcal?.calendars || [];
      if (!cals.length) {
        // No cached list yet — connect first, then reopen the picker.
        return this.connect("picker");
      }
      const selected = new Set(this.selectedIds());
      const rows = cals
        .map(
          (c) => `<label class="gcal-pick-row">
            <input type="checkbox" data-check="gcal-cal" data-id="${esc(c.id)}" ${selected.has(c.id) ? "checked" : ""}>
            <span class="gcal-dot" style="background:${safeColor(c.color)}"></span>
            <span class="steptext">${esc(c.name)}${c.primary ? ' <span class="muted">(primary)</span>' : ""}</span>
          </label>`,
        )
        .join("");
      openModal(
        "Choose calendars",
        `<p class="sub">Pick which Google calendars to show. Events from all checked calendars are merged into one list, color-coded by calendar.</p>
         <div class="gcal-pick-list">${rows}</div>
         <div class="row" style="margin-top:12px"><button class="btn primary" data-act="gcal-apply-picker">Done</button><button class="btn" data-act="close-modal">Cancel</button></div>`,
      );
    },
    disconnect() {
      try {
        if (this.token && window.google?.accounts?.oauth2)
          google.accounts.oauth2.revoke(this.token, () => {});
      } catch {}
      this.token = "";
      sessionStorage.removeItem("focus-school:gcal-token");
      this.connected = false;
      state.gcal = { events: [], fetchedAt: "", calendars: [] };
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
  // A compact, read-only Google event row, clearly marked as Google. When the
  // event carries a source calendar, color the left border + badge to match and
  // show the calendar name so multiple calendars are distinguishable.
  const gcalRow = (e) => {
    const color = safeColor(e.calColor || "#4285f4");
    const calChip = e.calName
      ? `<span class="gcal-cal-chip" style="--gc:${color}" title="From ${esc(e.calName)}">${esc(e.calName)}</span>`
      : "";
    return `<div class="item gcal-item" style="border-left-color:${color}"><div class="head"><div><h4><span class="gcal-badge" style="background:${color}" title="From Google Calendar${e.calName ? " · " + esc(e.calName) : ""}">G</span>${esc(e.title)}</h4><p class="meta">📅 ${esc(gcalTimeLabel(e))}${e.location ? " · " + esc(e.location) : ""}${calChip ? " · " + calChip : ""} · <span class="muted">Google · read-only</span></p></div>${e.htmlLink ? `<div class="row"><a class="btn sm" href="${esc(e.htmlLink)}" target="_blank" rel="noopener">Open</a></div>` : ""}</div></div>`;
  };

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
    const connected = gcal.connected || count > 0;
    const status = connected
      ? `<span class="pill green">● Connected · ${count} events</span>`
      : `<span class="pill">Not loaded yet</span>`;
    // Summarize which calendars are included (selected IDs → cached names).
    const cals = state.gcal?.calendars || [];
    const selIds = state.settings.gcalCalendars || [];
    const nameFor = (id) =>
      cals.find((c) => c.id === id)?.name ||
      (id === "primary" ? "Primary" : id);
    const colorFor = (id) =>
      safeColor(cals.find((c) => c.id === id)?.color || "#4285f4");
    const selChips = (selIds.length ? selIds : ["primary"])
      .map(
        (id) =>
          `<span class="gcal-cal-chip" style="--gc:${colorFor(id)}">${esc(nameFor(id))}</span>`,
      )
      .join(" ");
    const pickerLine = `<p class="muted" style="font-size:.8rem;margin-top:8px">Showing: ${selChips}${selIds.length ? "" : ' <span class="muted">(default)</span>'}</p>`;
    return `<section class="card" data-card="gcal"><div class="head"><div><h3>📅 Google Calendar</h3><p class="sub">Read-only — your Google events, shown alongside school work.</p></div>${status}</div>
      <div class="row">
        <button class="btn ${connected ? "" : "primary"}" data-act="gcal-connect">${connected ? "🔄 Reconnect" : "Connect Google Calendar"}</button>
        ${connected ? `<button class="btn navy" data-act="gcal-refresh">🔄 Refresh</button><button class="btn" data-act="gcal-choose">📋 Choose calendars</button><button class="btn danger" data-act="gcal-disconnect">Disconnect</button>` : ""}
      </div>
      ${connected ? pickerLine : ""}
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
    token: sessionStorage.getItem("focus-school:gmail-token") || "", // access token — session only
    tokenClient: null,
    connected: !!sessionStorage.getItem("focus-school:gmail-token"),
    clientId() {
      return (
        state.settings.googleClientId.trim() ||
        window._defaultGoogleClientId ||
        ""
      );
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
            sessionStorage.setItem(
              "focus-school:gmail-token",
              resp.access_token,
            );
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
            sessionStorage.removeItem("focus-school:gmail-token");
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
      sessionStorage.removeItem("focus-school:gmail-token");
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
        `<p>To use Focus School like a desktop app that works offline:</p>
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
    addPoints(10);
    bumpActivity("tasks");
    earnReward("task", "Finished: " + a.title);
    state.wins.push({
      text: "Finished: " + a.title,
      date: new Date().toLocaleString(),
    });
    save();
    toast("Done! +10 points 🎉");
    triggerConfetti();
    if (focus.taskId === id) focus.stop();
    else render();
  }

  const ACTIONS = {
    "water-plant": () => {
      if (state.garden && state.garden.waterReservoir > 0) {
        state.garden.waterReservoir--;
        state.garden.wateredCount = (state.garden.wateredCount || 0) + 1;
        updateGardenPlantStage();
        save();
        render();
        toast("💧 Plant watered! It's growing! 🌱");
        triggerConfetti();
      }
    },
    "garden-help": () => {
      openModal(
        "Focus Garden Info 🪴",
        `
        <p>Welcome to your <b>Focus Garden</b>! Here you can grow a plant of your choice.</p>
        <p><b>How to grow:</b></p>
        <ul>
          <li>Earn XP by completing tasks, checklist items, and focus sessions.</li>
          <li>Every <b>10 XP</b> earned awards you <b>1 drop of water 💧</b> in your reservoir.</li>
          <li>Click the <b>Water</b> button to use a drop of water and help your plant grow to the next stage!</li>
        </ul>
        <p><b>Plant stages:</b></p>
        <ol>
          <li>🌱 Sprout (0 waterings)</li>
          <li>🌿 Seedling (3 waterings)</li>
          <li>🍃 Leafy (8 waterings)</li>
          <li>🌸 Blooming (15 waterings)</li>
          <li>✨ Golden (25 waterings)</li>
        </ol>
        <p>Switch plant types anytime using the selector in the card header. Your growth progress is preserved!</p>
        <button class="btn primary block" data-act="close-modal" style="margin-top:16px;">Awesome!</button>
        `,
      );
    },
    "apply-custom-gradient": () => {
      const c1 = $("#customColor1")?.value || "#0d324d";
      const c2 = $("#customColor2")?.value || "#7f5a83";
      state.settings.customThemeColor1 = c1;
      state.settings.customThemeColor2 = c2;
      state.settings.themeGradient = `linear-gradient(135deg, ${hexToHsl(c1)}, ${hexToHsl(c2)})`;
      save();
      applyAppearance();
      toast("Custom gradient applied! 🎨");
    },
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
    "view-insights": () => setView("insights"),
    "view-rewards": () => setView("rewards"),

    // Pay out one finished week. Opens a parent-gated paystub.
    "reward-payout": (_, weekKey) => {
      if (!weekKey || isWeekPaid(weekKey)) return;
      const w = computeWeek(weekKey);
      if (w.total <= 0) return;
      const r = state.rewards;
      const KIND_LABEL = {
        task: "Assignments & to-dos",
        routine: "Routines",
        focus: "Focus sessions",
        reminder: "Reminders",
        health: "Biking & lifting",
      };
      const lines = ["task", "routine", "focus", "reminder", "health"]
        .filter((k) => w.by[k] > 0)
        .map(
          (k) =>
            `<div class="pay-line"><span>${KIND_LABEL[k]}</span><b>${money(
              w.by[k],
            )}</b></div>`,
        )
        .join("");
      openModal(
        "Payday",
        `<p class="sub">Hand <b>${money(w.total)}</b> to ${esc(
          state.settings.studentName || "your child",
        )} for the week of <b>${weekLabel(weekKey)}</b>. A grown-up does this part.</p>
        <div class="pay-stub">${lines}${
          w.bonus > 0
            ? `<div class="pay-line pay-bonus"><span>⭐ Perfect-week bonus</span><b>${money(
                w.bonus,
              )}</b></div>`
            : ""
        }<div class="pay-line pay-total"><span>Total</span><b>${money(
          w.total,
        )}</b></div></div>
        ${
          r.pin
            ? `<div class="field" style="margin-top:10px"><label>Parent PIN</label><input id="rwPin" type="password" inputmode="numeric" placeholder="••••" autocomplete="off"></div>`
            : ""
        }
        <p id="rwErr" class="sub" style="color:#c0473a;display:none">That PIN didn't match.</p>
        <div class="row"><button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="reward-confirm-payout" data-arg="${weekKey}">💵 Mark paid ${money(
          w.total,
        )}</button></div>`,
      );
    },
    "reward-confirm-payout": (_, weekKey) => {
      const r = state.rewards;
      if (!weekKey || isWeekPaid(weekKey)) return closeModal();
      if (r.pin) {
        const entered = ($("#rwPin")?.value || "").trim();
        if (entered !== r.pin) {
          const e = $("#rwErr");
          if (e) e.style.display = "block";
          return;
        }
      }
      const w = computeWeek(weekKey);
      if (w.total <= 0) return closeModal();
      r.payouts.unshift({
        id: uid("pay"),
        weekKey,
        amount: w.total,
        paidAt: new Date().toISOString(),
        breakdown: { ...w.by, bonus: w.bonus },
      });
      r.paidOut = round2(r.paidOut + w.total);
      save();
      closeModal();
      render();
      toast(`Paid ${money(w.total)} for ${weekLabel(weekKey)} 💵`);
      triggerConfetti();
    },
    "reward-settings": () => {
      const r = state.rewards;
      const rate = (id, k) =>
        `<div class="field"><label>${id}</label><input id="rw_${k}" type="number" min="0" step="0.05" value="${r.rates[k]}"></div>`;
      openModal(
        "Parent settings",
        `<p class="sub">Set what each finished thing is worth, and the weekly limits. Only a grown-up should change these.</p>
        <label class="rw-toggle"><input type="checkbox" id="rwEnabled" ${
          r.enabled ? "checked" : ""
        }> Rewards turned on</label>
        <div class="g2 grid">
          ${rate("Assignment / to-do", "task")}
          ${rate("Reminder", "reminder")}
          ${rate("Routine", "routine")}
          ${rate("Focus session", "focus")}
        </div>
        <div class="g2 grid">
          <div class="field"><label>Most per day</label><input id="rwCap" type="number" min="0" step="0.25" value="${
            r.dailyCap
          }"></div>
          <div class="field"><label>Most per week</label><input id="rwWeekCap" type="number" min="0" step="0.5" value="${
            r.weeklyCap
          }"></div>
        </div>
        <div class="g2 grid">
          <div class="field"><label>Perfect-week bonus</label><input id="rwBonus" type="number" min="0" step="0.25" value="${
            r.bonusPerfectWeek
          }"></div>
          <div class="field"><label>Symbol</label><input id="rwCur" maxlength="3" value="${esc(
            r.currency,
          )}"></div>
        </div>
        <div class="field"><label>Parent PIN for payout (optional, digits only)</label><input id="rwSetPin" type="text" inputmode="numeric" pattern="\\d*" placeholder="leave blank for no PIN" value="${esc(
          r.pin,
        )}"></div>
        <button class="btn primary block" data-act="save-reward-settings" style="margin-top:8px">Save settings</button>`,
      );
    },
    "save-reward-settings": () => {
      const r = state.rewards;
      const num = (id) => Math.max(0, Number($("#" + id)?.value) || 0);
      r.enabled = !!$("#rwEnabled")?.checked;
      r.rates.task = num("rw_task");
      r.rates.reminder = num("rw_reminder");
      r.rates.routine = num("rw_routine");
      r.rates.focus = num("rw_focus");
      r.dailyCap = num("rwCap");
      r.weeklyCap = num("rwWeekCap");
      r.bonusPerfectWeek = num("rwBonus");
      r.currency = ($("#rwCur")?.value || "$").slice(0, 3) || "$";
      const pin = ($("#rwSetPin")?.value || "").trim();
      if (/^\d{0,8}$/.test(pin)) r.pin = pin;
      save();
      closeModal();
      render(); // reflect changes on whatever view opened settings (home or Payday)
      toast("Settings saved ✓");
    },

    "spin-break": () => {
      currentBrainBreak = getRandomBrainBreak("all");
      const container = $("#brainBreakContainer");
      if (container)
        container.innerHTML = renderBrainBreakCardHTML(currentBrainBreak);
    },
    "choose-break": (_, arg) => {
      currentBrainBreak = getRandomBrainBreak(arg);
      const container = $("#brainBreakContainer");
      if (container)
        container.innerHTML = renderBrainBreakCardHTML(currentBrainBreak);
    },

    "quick-add": () => {
      quickAddForm._due = "";
      openModal("Quick add", quickAddForm());
    },
    "health-add": () => openModal("Add a movement", healthItemForm(null)),
    "health-edit": (id) => {
      const item = healthItems().find((it) => it[0] === id);
      if (item) openModal("Edit movement", healthItemForm(item));
    },
    "save-health-item": (id) => {
      const label = ($("#hLabel").value || "").trim();
      if (!label) return toast("Type what the movement is first.");
      const emoji = ($("#hEmoji").value || "").trim().slice(0, 4) || "💪";
      const hint = ($("#hHint").value || "").trim().slice(0, 80);
      const list = healthItems();
      if (id) {
        const item = list.find((it) => it[0] === id);
        if (item) {
          item[1] = emoji;
          item[2] = label.slice(0, 60);
          item[3] = hint;
        }
      } else {
        list.push([uid("h"), emoji, label.slice(0, 60), hint]);
      }
      save();
      closeModal();
      render();
      toast(id ? "Saved 💪" : "Added 💪 — go move your body");
    },
    "health-del": (id) => {
      state.health.items = healthItems().filter((it) => it[0] !== id);
      save();
      render();
      toast("Removed");
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
      state.deletedIds[id] = Date.now();
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
    "ai-breakdown": async (id) => {
      const a = state.assignments.find((x) => x.id === id);
      if (!a) return;
      const btn = $("#aiBreakBtn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "✨ Thinking…";
      }
      try {
        // Reuses the existing Gemini-backed /api/ai chat proxy: one-shot prompt,
        // then parse the reply into one step per line.
        const className = cls(a.classId)?.name || "";
        const prompt =
          `Break this school assignment into 4 to 7 small steps I can check off ` +
          `one at a time. Each step is a short action (3 to 10 words) starting with ` +
          `a verb, specific to the task. Reply with ONLY the steps, one per line, no ` +
          `numbering.\n\nClass: ${className || "(not given)"}\nAssignment: ${a.title}`;
        const resp = await fetch("/api/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", text: prompt }] }),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 503 || data.offline) throw new Error("offline");
        const steps = String(data.reply || "")
          .split("\n")
          .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
          .filter((l) => l && l.length <= 120)
          .slice(0, 8);
        if (!steps.length) throw new Error("no_steps");
        a.steps = steps.map((t) => ({ id: uid("s"), text: t, done: false }));
        save();
        openModal("Break it into steps", breakdownForm(a));
        toast("Broke it into steps ✨");
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "✨ Break it down for me";
        }
        toast(
          err.message === "offline"
            ? "AI help isn't set up yet — try a template below."
            : "Couldn't reach AI — try a template below.",
        );
      }
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
    "focus-sound": (_, arg) => {
      if (arg === "rain") playRain();
      else if (arg === "rumble") playRumble();
      else if (arg === "ocean") playOcean();
      else if (arg === "wind") playWind();
      else if (arg === "binaural") playBinaural();
      else if (arg === "ticks") playFocusTicks();
      else if (arg === "synth") playSynth();
      else stopAmbientSound();
      updateAmbientSoundUI(arg);
    },

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
        emoji: $("#cEmoji") ? $("#cEmoji").value.trim() : "📚",
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
      state.deletedIds[id] = Date.now();
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
      state.deletedIds[id] = Date.now();
      save();
      render();
    },
    "clear-done-reminders": () => {
      const doneReminders = state.reminders.filter((r) => r.done);
      doneReminders.forEach((r) => {
        state.deletedIds[r.id] = Date.now();
      });
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
      earnReward("reminder", r.text);
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

    "apply-routine-template": (_, arg) => {
      const t = ROUTINE_TEMPLATES[arg];
      if (!t) return;
      $("#rName").value = t.name;
      $("#rEmoji").value = t.emoji;
      const ul = $("#rSteps");
      ul.innerHTML = t.steps
        .map((text) => {
          const iid = uid("i");
          return `<li data-iid="${esc(iid)}"><span class="steptext">${esc(text)}</span><button class="btn danger sm" data-act="del-ritem" data-id="" data-sid="${iid}" aria-label="Delete step: ${esc(text)}">✕</button></li>`;
        })
        .join("");
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
      const days = $$("#rDays [data-arg]")
        .filter((b) => b.getAttribute("aria-pressed") === "true")
        .map((b) => b.dataset.arg)
        .filter((d) => DAYS.includes(d));
      const r = existing || { id: uid("r"), items: [], days: [] };
      r.name = $("#rName").value.trim() || "Routine";
      r.emoji = $("#rEmoji").value.trim() || "🔁";
      r.days = days;
      r.items = items.length ? items : r.items;
      r.updatedAt = Date.now();
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
      const iid = uid("i");
      li.dataset.iid = iid;
      li.innerHTML = `<span class="steptext"></span><button class="btn danger sm" data-act="del-ritem" data-id="${id || ""}" data-sid="${iid}" aria-label="Delete step">✕</button>`;
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
      state.deletedIds[id] = Date.now();
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

    // ---- Homework Plan timers ----
    "hw-start": (id, arg) => hwStart(id, Number(arg) || 5),
    "hw-toggle": (id) => hwToggle(id),
    "hw-reset": (id) => hwReset(id),
    "hw-custom": (id) => {
      const v = prompt("How many minutes for this timer?", "15");
      if (v === null) return;
      const n = Math.max(1, Math.min(180, Math.round(Number(v) || 0)));
      if (n) hwStart(id, n);
    },
    // ---- Calming ----
    "calm-next": () => {
      calmIdx = (calmIdx + 1) % CALM_PHRASES.length;
      render();
    },
    "breathe-toggle": () => {
      if (breatheOn) {
        breatheStop();
        return;
      }
      breatheOn = true;
      breatheRun(0);
    },
    // ---- Routine day-of-week toggles (in the routine editor) ----
    "toggle-routine-day": (id, arg, ev) => {
      const b = ev.target.closest("[data-arg]");
      if (!b) return;
      const on = b.getAttribute("aria-pressed") === "true";
      b.setAttribute("aria-pressed", on ? "false" : "true");
      b.classList.toggle("on", !on);
    },
    // ---- Mark a timed to-do done from the glance strip ----
    "todo-quickdone": (id) => {
      const t = state.todos.find((x) => x.id === id);
      if (!t) return;
      if (isTodoRecurring(t)) t.lastDone = todayKey();
      else t.done = true;
      addPoints(1);
      bumpActivity("tasks");
      triggerConfetti();
      save();
      render();
      toast("Done ✓");
    },
    // ---- AI Support (Gemini via server proxy /api/ai) ----
    "ai-suggest": (id, arg) => {
      const i = $("#aiInput");
      if (i) {
        i.value = arg || "";
        i.focus();
      }
    },
    "ai-clear": () => {
      AI_CHAT = [];
      aiImage = null;
      render();
    },
    "ai-attach": () => {
      const f = document.getElementById("aiImageInput");
      if (f) f.click();
    },
    "ai-remove-image": () => {
      aiImage = null;
      render();
    },
    "ai-mode": (_, arg) => {
      window._aiMode = arg;
      render();
    },
    "toggle-reading-expand": (id) => {
      state.expandedReadingDay = state.expandedReadingDay === id ? null : id;
      render();
    },
    "toggle-reading-done": (id) => {
      state.readingProgress = state.readingProgress || {};
      state.readingProgress[id] = state.readingProgress[id] || {
        done: false,
        gist: "",
        evidence: "",
        response: "",
      };
      const done = !state.readingProgress[id].done;
      state.readingProgress[id].done = done;
      if (done) {
        addPoints(5);
        bumpActivity("tasks");
        triggerConfetti();
        toast("+5 Points! 📚");
      }
      save();
      render();
    },
    "ai-send": async () => {
      const inp = $("#aiInput");
      const text = (inp?.value || "").trim();
      if ((!text && !aiImage) || aiBusy) return;
      const sentImg = aiImage;
      AI_CHAT.push({
        role: "user",
        text: text || "(picture)",
        image: sentImg ? sentImg.dataUrl : "",
      });
      aiBusy = true;
      aiImage = null;
      if (inp) inp.value = "";
      render();
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: window._aiMode || "hint",
            messages: AI_CHAT.slice(-12).map((m) => ({
              role: m.role,
              text: m.text,
            })),
            image: sentImg
              ? { mime: sentImg.mime, data: sentImg.base64 }
              : null,
            name: state.settings.studentName || "",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          AI_CHAT.push({
            role: "model",
            text: j.offline
              ? "I'm not set up yet — ask an adult to add the AI key. 🛠️"
              : "Sorry, I couldn't answer right now. Try again in a moment.",
          });
        } else {
          const j = await res.json();
          AI_CHAT.push({
            role: "model",
            text: (j.reply || "Hmm, I didn't catch that.").slice(0, 4000),
          });
        }
      } catch {
        AI_CHAT.push({
          role: "model",
          text: "I can't reach the internet right now. Check your connection and try again. 📶",
        });
      }
      aiBusy = false;
      render();
      setTimeout(() => {
        const m = $("#aiScroll");
        if (m) m.scrollTop = m.scrollHeight;
        const i = $("#aiInput");
        if (i) i.focus();
      }, 30);
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
      state.deletedIds[id] = Date.now();
      save();
      render();
    },
    "add-win": () => {
      const v = $("#winInput").value.trim();
      if (v) {
        state.wins.push({ text: v, date: new Date().toLocaleString() });
        addPoints(2);
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
    "toggle-arrange": () => {
      arrangeMode = !arrangeMode;
      render();
      toast(arrangeMode ? "Drag cards to rearrange them" : "Layout saved");
    },
    "move-card": (id, arg) => {
      const a = state.settings.homeOrder,
        i = a.indexOf(id),
        j = arg === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]];
      touchLayout();
      save();
      render();
    },
    "toggle-card": (id) => {
      const h = state.settings.hiddenCards;
      state.settings.hiddenCards = h.includes(id)
        ? h.filter((k) => k !== id)
        : [...h, id];
      touchLayout();
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
    // One tap: generate a strong code (if needed), turn sync on, show it.
    "enable-sync": async () => {
      if (!state.settings.sync.code) state.settings.sync.code = genSyncCode();
      state.settings.sync.enabled = true;
      save();
      cloud.startAuto();
      render();
      toast(
        cloud.available()
          ? "Sync on 🔄 — share your code with your other device"
          : "Saved. Cloud activates when the site supports it.",
      );
      // First-ever sync: pull anything already in the cloud, then push.
      await cloud.pull();
      await cloud.push();
      render();
    },
    // Second device: paste the code from the first device to link.
    "sync-fab": () => ACTIONS["enter-code"](),
    "enter-code": () => {
      openModal(
        "Enter your sync code",
        `<p class="sub">Enter the 6-digit pairing code (e.g. 123456) or paste your full sync code below to link this device.</p>
        <div class="field"><input id="linkCodeInput" placeholder="123456 or focus-..." autocomplete="off" autocapitalize="off" style="text-align: center; font-size: 1.2rem; font-weight: bold; letter-spacing: 2px;"></div>
        <div class="row">
          <button class="btn primary" data-act="link-code">Link this device</button>
          <button class="btn" data-act="close-modal">Cancel</button>
        </div>`,
      );
      setTimeout(() => $("#linkCodeInput")?.focus(), 50);
    },
    "link-code": async () => {
      let code = ($("#linkCodeInput")?.value || "").trim().replace(/\s+/g, "");
      if (!code) return toast("Enter a code first.");
      if (/^[0-9]{6}$/.test(code)) {
        toast("Resolving pairing code... 🔍");
        try {
          const res = await fetch(`/api/state?pair_resolve=${code}`);
          if (!res.ok) {
            return toast("Pairing code expired or invalid ❌");
          }
          const data = await res.json();
          if (data && data.code) {
            code = data.code;
          } else {
            return toast("Could not resolve code ❌");
          }
        } catch {
          return toast("Network error resolving pairing code ❌");
        }
      } else {
        // Custom codes can be any length now — normalize to the saved format.
        code = code.toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!code) return toast("Enter your code first.");
      }
      state.settings.sync.code = code;
      state.settings.sync.enabled = true;
      save();
      cloud.startAuto();
      closeModal();
      toast("Linking… pulling your data ⬇️");
      // Pull first so this device adopts the existing shared data.
      const pulled = await cloud.pull({ forceMerge: true });
      await cloud.push();
      render();
      toast(pulled ? "Linked — your data is here ✅" : "Linked 🔄");
    },
    "change-sync-code": () => {
      openModal(
        "Customize sync code",
        `<p class="sub">Change your sync code to a memorable word or phrase (e.g. <b>noam-focus-2026</b>) to sync other devices easily without typing long keys.</p>
        <div class="field">
          <label>Memorable Sync Code</label>
          <input id="customSyncCodeInput" value="${esc(state.settings.sync.code)}" placeholder="e.g. noam-focus-2026" autocomplete="off" autocapitalize="off" style="text-align: center; font-size: 1.1rem;">
          <small class="muted" style="display:block; margin-top: 4px;">Any length works — short and memorable is fine. Letters, numbers, and dashes.</small>
          <small class="muted" style="display:block; margin-top: 2px; color: var(--accent);">Tip: Use your name/school name to keep it unique!</small>
        </div>
        <div class="row">
          <button class="btn primary" data-act="save-custom-sync-code">Save &amp; Link</button>
          <button class="btn" data-act="close-modal">Cancel</button>
        </div>`,
      );
      setTimeout(() => $("#customSyncCodeInput")?.focus(), 50);
    },
    "save-custom-sync-code": async () => {
      const inputVal = ($("#customSyncCodeInput")?.value || "").trim();
      const cleaned = inputVal.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (!cleaned) {
        return toast("Type a sync code (letters, numbers, or dashes) ❌");
      }
      state.settings.sync.code = cleaned;
      state.settings.sync.enabled = true;
      save();
      cloud.startAuto();
      closeModal();
      toast("Saving and syncing custom code... 🔄");

      const pulled = await cloud.pull({ forceMerge: true });
      await cloud.push();
      render();
      toast(
        pulled
          ? "Successfully linked custom code and merged data! ☁️"
          : "Linked custom code! ☁️",
      );
    },
    "generate-pair-code": async () => {
      try {
        const genBtn = $("#btnGenPairCode");
        if (genBtn) {
          genBtn.disabled = true;
          genBtn.textContent = "Generating...";
        }
        const res = await fetch(
          `/api/state?pair_generate=${encodeURIComponent(state.settings.sync.code)}`,
          { method: "PUT" },
        );
        if (!res.ok) {
          throw new Error("fail");
        }
        const data = await res.json();
        if (data && data.pairCode) {
          const codeStr = String(data.pairCode);
          const formatted = codeStr.slice(0, 3) + " " + codeStr.slice(3);
          $("#lblPairCode").textContent = formatted;
          $("#pairCodeDisplay").style.display = "block";
          if (genBtn) {
            genBtn.style.display = "none";
          }
          toast("Pairing code generated! ⚡");
        } else {
          throw new Error("missing code");
        }
      } catch {
        toast("Failed to generate pairing code ❌");
        const genBtn = $("#btnGenPairCode");
        if (genBtn) {
          genBtn.disabled = false;
          genBtn.textContent = "⚡ Generate 6-Digit Code";
        }
      }
    },
    "copy-link": async () => {
      const url = linkURL(state.settings.sync.code);
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied 🔗 — open it on your other device");
      } catch {
        toast("Copy failed — copy the code instead");
      }
    },
    "copy-code": async () => {
      const code = state.settings.sync.code;
      try {
        await navigator.clipboard.writeText(code);
        toast("Code copied 📋");
      } catch {
        // Clipboard blocked — select the field so they can copy manually.
        const el = $("#syncCode");
        if (el) {
          el.focus();
          el.select();
        }
        toast("Press Copy / long-press to copy the code");
      }
    },
    "toggle-sync": async () => {
      // From the ON view this only turns sync OFF (enable is its own action).
      state.settings.sync.enabled = false;
      cloud.stopAuto();
      save();
      toast("Cloud sync off");
      render();
    },
    "sync-now": async () => {
      toast("Syncing...");
      const pulled = await cloud.pull({ forceMerge: true });
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
    // Open the multi-calendar picker. If we have a cached calendar list, show it
    // immediately; otherwise connect first then open the picker.
    "gcal-choose": () => {
      if (!navigator.onLine && !(state.gcal?.calendars || []).length)
        return toast("Connect to the internet to choose calendars.");
      gcal.openPicker();
    },
    // Persist the checked calendar IDs, then refresh events with the new set.
    "gcal-apply-picker": () => {
      const ids = [
        ...document.querySelectorAll(
          '#modalBody input[data-check="gcal-cal"]:checked',
        ),
      ].map((b) => b.dataset.id);
      // Empty selection falls back to the primary calendar.
      state.settings.gcalCalendars = ids;
      save();
      closeModal();
      toast(
        ids.length
          ? `${ids.length} calendar${ids.length === 1 ? "" : "s"} selected`
          : "Showing your primary calendar",
      );
      gcal.token ? gcal.fetchEvents() : render();
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
      const r = normalizeTodo({
        text: ("Reply / handle: " + (m.subject || "(no subject)")).slice(
          0,
          200,
        ),
        date: todayKey(),
      });
      state.todos.push(r);
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
    "show-shortcuts": () => {
      openModal(
        "⌨️ Keyboard Shortcuts",
        `<div style="display:flex;flex-direction:column;gap:12px;font-weight:700">
          <p class="sub">Use these shortcuts to navigate faster on desktop:</p>
          <div class="row"><span class="pill">Cmd+K</span><span>or</span><span class="pill">/</span><span>Open search &amp; command bar</span></div>
          <div class="row"><span class="pill">1</span><span>to</span><span class="pill">6</span><span>Switch tabs (Now, Today, Tasks...)</span></div>
          <div class="row"><span class="pill">f</span><span>Start/stop focus session for today's task</span></div>
          <div class="row"><span class="pill">Esc</span><span>Close any open modal or overlay</span></div>
          <div class="row"><span class="pill">?</span><span>Show this shortcuts guide</span></div>
         </div>`,
      );
    },
    "set-reflection-rating": (_, arg) => {
      const [field, val] = arg.split(":");
      if (field === "focus") window._pendingReflectionFocus = Number(val);
      if (field === "mood") window._pendingReflectionMood = Number(val);
      render();
    },
    "save-reflection": () => {
      const focusVal = window._pendingReflectionFocus || 0;
      const moodVal = window._pendingReflectionMood || 0;
      const textVal =
        document.getElementById("reflectionTextInput")?.value || "";
      if (focusVal === 0 || moodVal === 0) {
        toast("Please select a score for focus and mood!");
        return;
      }
      state.reflections[todayKey()] = {
        focus: focusVal,
        mood: moodVal,
        text: textVal,
        timestamp: new Date().toISOString(),
      };
      addPoints(5);
      window._pendingReflectionFocus = 0;
      window._pendingReflectionMood = 0;
      window._pendingReflectionText = "";
      triggerConfetti();
      toast("Check-out saved! +5 points 📓");
    },
    "set-gradient-theme": (_, arg) => {
      const pts = state.points || 0;
      const lvl = Math.floor(pts / 100) + 1;
      const req = getGradientLevelRequired(arg);
      if (lvl < req) {
        toast(`🔒 Locked! Requires Level ${req}. Keep earning XP!`);
        return;
      }
      state.settings.themeGradient = arg;
      save();
      applyAppearance();
      render();
    },
    "run-self-test": () => {
      selfTest();
    },
    "dismiss-welcome": () => {
      state.settings.welcomeDismissed = true;
      save();
      render();
    },
    "resolve-conflict-merge": () => {
      if (
        window._pendingLocalConflictState &&
        window._pendingCloudConflictState
      ) {
        state = normalize(
          mergeStates(
            window._pendingLocalConflictState,
            window._pendingCloudConflictState,
          ),
        );
        save({ touch: true, immediate: true });
        closeModal();
        render();
        toast("Merged local and remote changes successfully! 🔀");
      }
    },
    "resolve-conflict-local": () => {
      if (window._pendingLocalConflictState) {
        state = normalize(window._pendingLocalConflictState);
        state.updatedAt = Date.now();
        save({ touch: true, immediate: true });
        closeModal();
        render();
        toast("Kept local changes. Syncing to cloud... 💻");
      }
    },
    "resolve-conflict-cloud": () => {
      if (window._pendingCloudConflictState) {
        const prev = suppressPush;
        suppressPush = true;
        state = normalize(window._pendingCloudConflictState);
        save({ touch: false, immediate: true });
        suppressPush = prev;
        closeModal();
        render();
        toast("Overwritten with cloud changes. ☁️");
      }
    },
    "print-report": () => {
      window.print();
    },
    "set-focus-preset": (_, arg) => {
      const mins = Number(arg);
      if (focus.phase === "focus") {
        focus.total = mins * 60;
        focus.remaining = focus.total;
        focus.tick(true);
      }
      const buttons = document.querySelectorAll(
        "#fPresetsControls button[data-act='set-focus-preset']",
      );
      buttons.forEach((btn) => {
        const isPressed = btn.dataset.arg === arg;
        btn.setAttribute("aria-pressed", isPressed ? "true" : "false");
      });
      toast(`Timer set to ${mins} minutes! ⏱️`);
    },
    "open-command-bar": () => openCommandBar(),
    "close-command-bar": () => closeCommandBar(),
    "cmd-trigger": (id, arg, ev) => {
      const btn = ev.target.closest("[data-idx]");
      if (btn) {
        const idx = Number(btn.dataset.idx);
        const selected = window._cmdItems[idx];
        if (selected) triggerCommandItem(selected);
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Event wiring (delegated, attached once)
  // ---------------------------------------------------------------------------
  function wire() {
    document.addEventListener("pointerdown", (ev) => {
      // Two ways to start a drag: grab the small ⋮⋮ handle (always), or — when
      // "Arrange cards" mode is on — grab anywhere on a Now-screen card.
      const handle = ev.target.closest(".card-drag-handle");
      const arrangingCard = ev.target.closest(".home-grid.arranging .card");
      const cardEl = handle ? handle.closest(".card") : arrangingCard;
      if (!cardEl || !cardEl.closest(".home-grid") || !cardEl.dataset.card)
        return;

      ev.preventDefault();
      cardEl.setPointerCapture(ev.pointerId);

      const startX = ev.clientX;
      const startY = ev.clientY;
      const cardId = cardEl.dataset.card;

      cardEl.classList.add("dragging");

      let lastOverCardId = null;
      let insertAfter = false; // drop below the target card's midpoint?
      let moved = false; // did the pointer travel far enough to be a drag?

      // Auto-scroll the page when the pointer nears the top/bottom edge, so a
      // card can be dragged the whole way down a long list (a young student
      // can't reach a card off-screen otherwise). The rAF loop keeps scrolling
      // while the finger is parked in the hot zone.
      let pointerY = startY;
      let autoScrollRAF = 0;
      const EDGE = 90; // px hot zone at top and bottom of the viewport
      const MAX_SPEED = 16; // px per frame at the very edge
      function autoScrollStep() {
        const h = window.innerHeight;
        let delta = 0;
        if (pointerY < EDGE) {
          delta = -MAX_SPEED * ((EDGE - pointerY) / EDGE);
        } else if (pointerY > h - EDGE) {
          delta = MAX_SPEED * ((pointerY - (h - EDGE)) / EDGE);
        }
        if (delta) window.scrollBy(0, delta);
        autoScrollRAF = requestAnimationFrame(autoScrollStep);
      }
      autoScrollRAF = requestAnimationFrame(autoScrollStep);

      function onPointerMove(moveEv) {
        if (moveEv.pointerId !== ev.pointerId) return;
        pointerY = moveEv.clientY;
        const dx = moveEv.clientX - startX;
        const dy = moveEv.clientY - startY;
        if (!moved && Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;

        cardEl.style.pointerEvents = "none";
        const targetEl = document.elementFromPoint(
          moveEv.clientX,
          moveEv.clientY,
        );
        cardEl.style.pointerEvents = "";
        const overCard = targetEl ? targetEl.closest(".card") : null;

        document.querySelectorAll(".card.drag-over").forEach((el) => {
          if (el !== overCard) el.classList.remove("drag-over");
        });

        if (overCard && overCard !== cardEl && overCard.closest(".home-grid")) {
          overCard.classList.add("drag-over");
          lastOverCardId = overCard.dataset.card;
          // Decide whether to drop before or after the hovered card based on
          // where the pointer sits relative to its vertical midpoint. This
          // keeps reordering predictable in the masonry column layout.
          const r = overCard.getBoundingClientRect();
          insertAfter = moveEv.clientY > r.top + r.height / 2;
        } else {
          lastOverCardId = null;
        }
      }

      function onPointerUp(upEv) {
        if (upEv.pointerId !== ev.pointerId) return;
        cancelAnimationFrame(autoScrollRAF);
        cardEl.releasePointerCapture(ev.pointerId);
        cardEl.classList.remove("dragging");
        cardEl.style.transform = "";

        document.querySelectorAll(".card.drag-over").forEach((el) => {
          el.classList.remove("drag-over");
        });

        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        document.removeEventListener("pointercancel", onPointerUp);

        if (moved && lastOverCardId && lastOverCardId !== cardId) {
          // Remove the dragged card first, THEN locate the target in the
          // updated array so the insert index never drifts (the old code
          // spliced against pre-removal indices and overshot by one when
          // moving a card downward).
          const order = state.settings.homeOrder;
          const from = order.indexOf(cardId);
          if (from >= 0) {
            order.splice(from, 1);
            let to = order.indexOf(lastOverCardId);
            if (to < 0) {
              order.splice(from, 0, cardId); // target vanished — restore
            } else {
              if (insertAfter) to += 1;
              order.splice(to, 0, cardId);
              touchLayout();
              save();
              render();
              toast("Layout updated");
            }
          }
        }
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerUp);
    });

    // Keyboard-accessible reordering: focus a card's reorder handle and press
    // Arrow Up / Arrow Down to move it. Mirrors the pointer drag for students
    // on a Chromebook keyboard or anyone using assistive tech.
    document.addEventListener("keydown", (ev) => {
      const handle =
        ev.target.closest && ev.target.closest(".card-drag-handle");
      if (!handle) return;
      if (ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
      const cardEl = handle.closest(".card");
      if (!cardEl) return;
      const cardId = cardEl.dataset.card;
      ev.preventDefault();

      const order = state.settings.homeOrder;
      const visible = order.filter(
        (k) => !state.settings.hiddenCards.includes(k),
      );
      const vi = visible.indexOf(cardId);
      const ni = ev.key === "ArrowUp" ? vi - 1 : vi + 1;
      if (vi < 0 || ni < 0 || ni >= visible.length) return;
      const neighbor = visible[ni];

      order.splice(order.indexOf(cardId), 1);
      order.splice(
        order.indexOf(neighbor) + (ev.key === "ArrowDown" ? 1 : 0),
        0,
        cardId,
      );
      touchLayout();
      save();
      render();
      requestAnimationFrame(() => {
        document
          .querySelector(`.card[data-card="${cardId}"] .card-drag-handle`)
          ?.focus();
      });
      toast("Layout updated");
    });

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
            addPoints(1);
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
          addPoints(5);
          bumpActivity("routines");
          earnReward("routine", r.name || "Routine");
          toast(`${r.name} complete! +5 🎉`);
          triggerConfetti();
        }
        save({ immediate: true });
        const label = box.parentElement.querySelector(".steptext");
        if (label) label.classList.toggle("done", box.checked);
        updateProgressBars();
      } else if (kind === "todo") {
        const td = state.todos.find((t) => t.id === id);
        if (td) {
          td.done = box.checked;
          if (box.checked) {
            addPoints(1);
            bumpActivity("tasks");
            earnReward("task", td.text);
            triggerConfetti();
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
      } else if (kind === "health") {
        // Daily movement check-ins (biking/lifting). Optional; reset each day.
        // Paid at most once per item per day (tracked in day.__paid) so they
        // can't be farmed by un/re-checking; money already earned is kept.
        const day = (state.health.log[todayKey()] =
          state.health.log[todayKey()] || {});
        const paid = (day.__paid = day.__paid || []);
        const item = healthItems().find((h) => h[0] === id);
        if (box.checked) {
          day[id] = 1;
          if (!paid.includes(id)) {
            paid.push(id);
            addPoints(1);
            earnReward("health", item ? item[2] : "Movement");
            triggerConfetti();
          }
        } else {
          delete day[id];
        }
        save({ immediate: true });
        const wrap = box.closest(".health-item");
        if (wrap) wrap.classList.toggle("done", box.checked);
        const label = box.parentElement.querySelector(".steptext");
        if (label) label.classList.toggle("done", box.checked);
        const cheerEl = document.querySelector(".health-cheer");
        if (cheerEl) {
          const d = state.health.log[todayKey()] || {};
          const n = healthItems().filter((it) => d[it[0]]).length;
          cheerEl.textContent =
            n === 0
              ? "Pick one and go move your body. 🚀"
              : n >= healthItems().length
                ? "Wow — you did them all today! 🏆"
                : "Nice work — " + n + " done today! 🔥";
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
      if (ev.key === "Enter" && ev.target.id === "aiInput") {
        ev.preventDefault();
        ACTIONS["ai-send"]();
      }
    });

    // file import and garden change
    document.addEventListener("change", (ev) => {
      if (ev.target.id === "importFile" && ev.target.files[0]) {
        importBackup(ev.target.files[0]);
      } else if (ev.target.id === "aiImageInput" && ev.target.files[0]) {
        const file = ev.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
          toast("That picture is too big (max 5 MB).");
          ev.target.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || "");
          const comma = dataUrl.indexOf(",");
          aiImage = {
            dataUrl,
            mime: file.type || "image/jpeg",
            base64: comma >= 0 ? dataUrl.slice(comma + 1) : "",
            name: file.name || "picture",
          };
          render();
        };
        reader.readAsDataURL(file);
        ev.target.value = "";
      } else if (ev.target.dataset.act === "change-plant-type") {
        if (state.garden) {
          state.garden.plantType = ev.target.value;
          save();
          render();
        }
      } else if (ev.target.classList.contains("todo-time-picker")) {
        const id = ev.target.dataset.id;
        const td = state.todos.find((t) => t.id === id);
        if (td) {
          td.time = ev.target.value;
          td.lastShown = "";
          save();
          if (typeof scheduleReminders === "function") scheduleReminders();
          toast("Time reminder updated ⏰");
        }
      } else if (ev.target.classList.contains("todo-repeat-picker")) {
        const id = ev.target.dataset.id;
        const td = state.todos.find((t) => t.id === id);
        if (td) {
          td.repeat = TODO_REPEATS.includes(ev.target.value)
            ? ev.target.value
            : "none";
          td.lastDone = "";
          save();
          render();
          toast(td.repeat === "none" ? "Repeat off" : "Repeat set 🔁");
        }
      } else if (ev.target.id === "goalSelect") {
        const v = ev.target.value;
        const inp = $("#goalInput");
        if (inp && v && v !== "__custom__") inp.value = v;
        if (v === "__custom__" && inp) inp.focus();
      }
    });

    // range/live binds and theme picker
    document.addEventListener("input", (ev) => {
      if (ev.target.dataset.readingField) {
        const id = ev.target.dataset.id;
        const field = ev.target.dataset.readingField;
        state.readingProgress = state.readingProgress || {};
        state.readingProgress[id] = state.readingProgress[id] || {
          done: false,
          gist: "",
          evidence: "",
          response: "",
        };
        state.readingProgress[id][field] = ev.target.value;
        save();
        return;
      }
      if (ev.target.dataset.transitionField) {
        const field = ev.target.dataset.transitionField;
        state.bookTransition = state.bookTransition || {
          finishedB: "",
          responseB: false,
          startC: "",
          rememberText: "",
        };
        state.bookTransition[field] = ev.target.value;
        save();
        return;
      }
      if (ev.target.dataset.transitionCheck) {
        const field = ev.target.dataset.transitionCheck;
        state.bookTransition = state.bookTransition || {
          finishedB: "",
          responseB: false,
          startC: "",
          rememberText: "",
        };
        state.bookTransition[field] = ev.target.checked;
        save();
        return;
      }
      if (ev.target.dataset.act === "update-custom-gradient") {
        const c1 = $("#customColor1")?.value || "#0d324d";
        const c2 = $("#customColor2")?.value || "#7f5a83";
        state.settings.customThemeColor1 = c1;
        state.settings.customThemeColor2 = c2;
        state.settings.themeGradient = `linear-gradient(135deg, ${hexToHsl(c1)}, ${hexToHsl(c2)})`;
        save();
        applyAppearance();
        return;
      }
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
      const cmdOpen = $("#commandBarBack").classList.contains("open");
      if (ev.key === "Escape") {
        if (cmdOpen) closeCommandBar();
        else if (modalOpen) closeModal();
        else if (focusOpen) focus.stop();
        else if (guideOpen) guide.stop();
      } else if (ev.key === "Tab") {
        if (cmdOpen) trapFocus($("#commandBarBack .command-bar-modal"), ev);
        else if (modalOpen) trapFocus($("#modalBack .modal"), ev);
        else if (focusOpen) trapFocus($("#focusOverlay"), ev);
        else if (guideOpen) trapFocus($("#guideOverlay"), ev);
      }
    });

    // Note: clicking the backdrop intentionally does NOT close the modal, to
    // avoid losing a half-typed assignment/routine. Use ✕ or Escape instead.

    // connection status
    window.addEventListener("online", () => {
      updateHeaderStatus();
      if (state.settings.sync.enabled) cloud.pull().then((p) => p && render());
    });
    window.addEventListener("offline", updateHeaderStatus);
    updateHeaderStatus();

    // Global keyboard listeners for Command Bar & Shortcuts
    window.addEventListener("keydown", (ev) => {
      const modal = document.getElementById("commandBarBack");
      const isOpen = modal && modal.classList.contains("open");

      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        if (isOpen) closeCommandBar();
        else openCommandBar();
        return;
      }

      // Let the browser/OS keep its own shortcuts (Ctrl/Cmd+F find, +P print,
      // +R reload, +A select-all, Ctrl/Cmd+1..9 tab switch, etc.). Only our
      // unmodified single-key shortcuts (/ ? f 1-6) below should act — without
      // this guard, pressing Ctrl+F matched `ev.key === "f"` and swallowed Find.
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

      if (
        ev.key === "/" &&
        !isOpen &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        ev.preventDefault();
        openCommandBar();
        return;
      }

      if (!isOpen) {
        if (
          ev.key === "?" &&
          document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "TEXTAREA"
        ) {
          ev.preventDefault();
          ACTIONS["show-shortcuts"]();
          return;
        }
        if (
          ev.key === "f" &&
          document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "TEXTAREA"
        ) {
          ev.preventDefault();
          const next = rightNowTask();
          if (next) focus.start(next.id);
          else toast("No assignments to focus on!");
          return;
        }
        if (
          ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(ev.key) &&
          document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "TEXTAREA"
        ) {
          ev.preventDefault();
          const idx = ev.key === "0" ? 9 : Number(ev.key) - 1;
          if (idx < TABS.length) {
            setView(TABS[idx][0]);
          }
          return;
        }
        return;
      }

      if (ev.key === "Escape") {
        ev.preventDefault();
        closeCommandBar();
      } else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        window._cmdSelectedIndex =
          (window._cmdSelectedIndex + 1) % window._cmdItems.length;
        renderCommandBarResults(document.getElementById("cmdInput")?.value);
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        window._cmdSelectedIndex =
          (window._cmdSelectedIndex - 1 + window._cmdItems.length) %
          window._cmdItems.length;
        renderCommandBarResults(document.getElementById("cmdInput")?.value);
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const selected = window._cmdItems[window._cmdSelectedIndex];
        if (selected) {
          triggerCommandItem(selected);
        }
      }
    });

    // Touch Swipe Navigation for PWA
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener(
      "touchstart",
      (ev) => {
        if (
          document.getElementById("modalBack").classList.contains("open") ||
          document.getElementById("focusOverlay").classList.contains("open") ||
          document.getElementById("guideOverlay").classList.contains("open") ||
          document.getElementById("commandBarBack").classList.contains("open")
        ) {
          return;
        }
        if (
          ev.target.closest("input[type='range']") ||
          ev.target.closest(".seg") ||
          ev.target.closest(".accent-row") ||
          ev.target.closest(".theme-gradient-grid")
        ) {
          return;
        }
        touchStartX = ev.changedTouches[0].screenX;
        touchStartY = ev.changedTouches[0].screenY;
      },
      { passive: true },
    );

    document.addEventListener(
      "touchend",
      (ev) => {
        if (
          document.getElementById("modalBack").classList.contains("open") ||
          document.getElementById("focusOverlay").classList.contains("open") ||
          document.getElementById("guideOverlay").classList.contains("open") ||
          document.getElementById("commandBarBack").classList.contains("open")
        ) {
          return;
        }
        if (
          ev.target.closest("input[type='range']") ||
          ev.target.closest(".seg") ||
          ev.target.closest(".accent-row") ||
          ev.target.closest(".theme-gradient-grid")
        ) {
          return;
        }
        const touchEndX = ev.changedTouches[0].screenX;
        const touchEndY = ev.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (Math.abs(diffX) > 80 && Math.abs(diffY) < 40) {
          const tabsOrder = TABS.map((t) => t[0]);
          const currentIdx = tabsOrder.indexOf(view);
          if (currentIdx !== -1) {
            if (diffX < 0) {
              const nextIdx = currentIdx + 1;
              if (nextIdx < tabsOrder.length) setView(tabsOrder[nextIdx]);
            } else {
              const prevIdx = currentIdx - 1;
              if (prevIdx >= 0) setView(tabsOrder[prevIdx]);
            }
          }
        }
      },
      { passive: true },
    );

    // Wire cmdInput + taskSearchInput input handlers
    document.addEventListener("input", (ev) => {
      if (ev.target.id === "cmdInput") {
        window._cmdSelectedIndex = 0;
        renderCommandBarResults(ev.target.value);
      }
      if (ev.target.id === "taskSearchInput") {
        window._onTaskFilterChange();
      }
    });
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
    try {
      const configRes = await fetch("/api/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.googleClientId) {
          window._defaultGoogleClientId = configData.googleClientId;
        }
      }
    } catch {}

    deviceId = localStorage.getItem("focus-school:device-id");
    if (!deviceId) {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("focus-school:device-id", deviceId);
    }

    window.addEventListener("storage", async (e) => {
      if (e.key === MIRROR_KEY && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue);
          if (incoming && (incoming.updatedAt || 0) > (state.updatedAt || 0)) {
            const prev = suppressPush;
            suppressPush = true;
            state = normalize(mergeStates(state, incoming));
            await save({ touch: false, immediate: true });
            suppressPush = prev;
            render();
          }
        } catch {}
      }
    });

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
    let newlyCreatedSync = false;
    if (!state.settings.sync.code) {
      state.settings.sync.code = genSyncCode();
      state.settings.sync.enabled = true;
      newlyCreatedSync = true;
    }
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

    // Deep link: ?sync=<code> links this device automatically (e.g. from a QR
    // or a shared link), so the second device doesn't have to type anything.
    const linkCode = (params.get("sync") || "").trim();
    if (linkCode && linkCode.length >= 12) {
      state.settings.sync.code = linkCode;
      state.settings.sync.enabled = true;
      view = "sync";
    }

    wire();
    render();

    if (params.get("action") === "add") ACTIONS["quick-add"]();

    // pull cloud data if enabled, THEN re-enable pushing
    if (state.settings.sync.enabled && cloud.available()) {
      // forceMerge so the conflict-safe item-level merge always runs — a newer
      // local updatedAt must not shadow routine/reminder edits made elsewhere.
      const pulled = await cloud.pull({ forceMerge: true });
      if (pulled) render();
    }
    suppressPush = false;
    // Save any code adopted from a deep link now that pushing is allowed.
    if (linkCode && linkCode.length >= 12) {
      save();
      await cloud.push();
    }
    if (newlyCreatedSync) {
      save({ touch: false, immediate: true });
      await cloud.push();
    }

    // ---- Auto-pull triggers: keep this device live without any user action ----
    // 1) Periodic pull while the tab is open (~50s).
    cloud.startAuto();
    // 2) On window focus and 3) when the tab becomes visible again — grabs the
    //    latest the moment the user returns to the app (covers throttled timers).
    window.addEventListener("focus", () => cloud.autoPull());
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") cloud.autoPull();
    });

    // calm one-line briefing on open, plus the reminders loop
    dailyBriefing();
    checkReminders(); // fires anything already due (incl. passed reminder times)
    scheduleReminders(); // arms precise setTimeouts for today's upcoming times
    setInterval(checkReminders, 60000);
    startDateRolloverWatcher();
    // Re-arm timers when the tab is refocused (a backgrounded tab can throttle
    // timers; refocusing recomputes them and catches anything missed).
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkReminders();
        scheduleReminders();
      }
    });

    // Fetch Google Calendar & School Mail events on startup if token is available
    if (gcal.token) {
      gcal.fetchEvents().catch(() => {});
    }
    if (gmail.token) {
      gmail.fetchMessages().catch(() => {});
    }

    // register service worker + let the user know when an update is ready
    if ("serviceWorker" in navigator) {
      // If an old service worker already controls this page, reload once when a
      // new one takes over so the fresh app.js/css load automatically — no
      // "reopen the app" step. Skipped on first-ever install (no controller
      // yet), where the page is already running the latest code.
      if (navigator.serviceWorker.controller) {
        let reloadingForUpdate = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloadingForUpdate) return;
          reloadingForUpdate = true;
          window.location.reload();
        });
      }
      navigator.serviceWorker
        .register("sw.js")
        .then((reg) => {
          // Poll hourly so long-lived installed PWAs pick up a new deploy
          // without waiting for a manual navigation.
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener("statechange", () => {
              if (
                nw.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                toast("Updating to the latest version…");
              }
            });
          });
        })
        .catch(() => {});
    }
  }

  if (window.__FOCUS_SCHOOL_TEST__) {
    Object.assign(window.__FOCUS_SCHOOL_TEST__, {
      mergeRoutineLogs,
      mergeStates,
      nextRoutineWindow,
      normalize,
      pickRoutineForNow,
      routineForHome,
      seed,
      state,
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
