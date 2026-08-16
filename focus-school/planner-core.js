/* Focus School — planner core.
 *
 * The deterministic, side-effect-free brain behind "What should Noam do next?".
 * Everything here is a pure function of its arguments: no DOM, no storage, no
 * clock reads (callers pass `todayIso` / `nowMin`). That is what makes the
 * priority engine, study planner, project scheduler and recovery logic
 * unit-testable without booting the 13k-line app shell.
 *
 * Loaded as a plain script before app.js (window.PlannerCore) and imported
 * directly by test/focus-school-planner-core.test.mjs.
 */
(function (root) {
  "use strict";

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const MINUTES_PER_DAY = 1440;

  // ---------------------------------------------------------------------------
  // Dates. All local-noon based so DST never shifts a day key.
  // ---------------------------------------------------------------------------
  function parseLocal(iso) {
    const p = String(iso || "").split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0, 0);
  }
  function toIso(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
  }
  function addDays(iso, n) {
    const d = parseLocal(iso);
    d.setDate(d.getDate() + n);
    return toIso(d);
  }
  function daysBetween(fromIso, toIsoStr) {
    if (!DATE_RE.test(fromIso) || !DATE_RE.test(toIsoStr)) return null;
    return Math.round((parseLocal(toIsoStr) - parseLocal(fromIso)) / 86400000);
  }
  const dayName = (iso) => DAYS[parseLocal(iso).getDay()];
  const isWeekend = (iso) => [0, 6].includes(parseLocal(iso).getDay());
  function hhmmToMin(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
    if (!m) return null;
    const mins = Number(m[1]) * 60 + Number(m[2]);
    return mins >= 0 && mins < MINUTES_PER_DAY ? mins : null;
  }
  function minToHhmm(min) {
    const v = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.round(Number(min) || 0)));
    return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  }
  function minToLabel(min) {
    const v = Math.max(0, Math.round(Number(min) || 0));
    const h24 = Math.floor(v / 60) % 24;
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h}:${String(v % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
  }
  // "20 min" / "1 hr 5 min" — the only duration phrasing the UI ever prints.
  function durationLabel(min) {
    const v = Math.max(0, Math.round(Number(min) || 0));
    if (v < 60) return `${v} min`;
    const h = Math.floor(v / 60);
    const r = v % 60;
    return r ? `${h} hr ${r} min` : `${h} hr`;
  }

  // ---------------------------------------------------------------------------
  // School schedule model
  // ---------------------------------------------------------------------------
  // schedule = {
  //   enabled, startTime, dismissTime,
  //   rotation: { type:"none"|"ab"|"cycle", labels:[], anchorDate, anchorIndex },
  //   periods:  [{ id, name, classId, start, end, days:[], rotationDays:[],
  //                room, teacher, kind:"class"|"lunch"|"special"|"advisory" }],
  //   exceptions:[{ date, type:"no-school"|"early-dismissal"|"modified"|"event",
  //                 label, dismissTime }],
  //   activities:[{ id, name, days:[], start, end, place }],
  // }
  const EXCEPTION_TYPES = ["no-school", "early-dismissal", "modified", "event"];

  function normalizeSchedule(s) {
    s = s && typeof s === "object" ? s : {};
    const rot = s.rotation && typeof s.rotation === "object" ? s.rotation : {};
    const labels = Array.isArray(rot.labels)
      ? rot.labels.map((l) => String(l).slice(0, 8)).filter(Boolean)
      : [];
    return {
      enabled: !!s.enabled,
      startTime: hhmmToMin(s.startTime) === null ? "08:15" : s.startTime,
      dismissTime: hhmmToMin(s.dismissTime) === null ? "15:05" : s.dismissTime,
      rotation: {
        type: ["none", "ab", "cycle"].includes(rot.type) ? rot.type : "none",
        labels: labels.length ? labels : ["A", "B"],
        anchorDate: DATE_RE.test(rot.anchorDate) ? rot.anchorDate : "",
        anchorIndex: Math.max(0, Number(rot.anchorIndex) || 0),
      },
      periods: (Array.isArray(s.periods) ? s.periods : []).map(normalizePeriod),
      exceptions: (Array.isArray(s.exceptions) ? s.exceptions : [])
        .filter((e) => e && DATE_RE.test(e.date))
        .map((e) => ({
          date: e.date,
          type: EXCEPTION_TYPES.includes(e.type) ? e.type : "event",
          label: String(e.label || "").slice(0, 80),
          dismissTime: hhmmToMin(e.dismissTime) === null ? "" : e.dismissTime,
        })),
      activities: (Array.isArray(s.activities) ? s.activities : []).map((a) => ({
        id: String(a.id || ""),
        name: String(a.name || "Activity").slice(0, 60),
        days: (Array.isArray(a.days) ? a.days : []).filter((d) => DAYS.includes(d)),
        start: hhmmToMin(a.start) === null ? "" : a.start,
        end: hhmmToMin(a.end) === null ? "" : a.end,
        place: String(a.place || "").slice(0, 60),
      })),
    };
  }

  function normalizePeriod(p) {
    p = p && typeof p === "object" ? p : {};
    return {
      id: String(p.id || ""),
      name: String(p.name || "Class").slice(0, 60),
      classId: String(p.classId || ""),
      start: hhmmToMin(p.start) === null ? "" : p.start,
      end: hhmmToMin(p.end) === null ? "" : p.end,
      days: (Array.isArray(p.days) ? p.days : []).filter((d) => DAYS.includes(d)),
      rotationDays: (Array.isArray(p.rotationDays) ? p.rotationDays : []).map((d) =>
        String(d).slice(0, 8),
      ),
      room: String(p.room || "").slice(0, 30),
      teacher: String(p.teacher || "").slice(0, 60),
      kind: ["class", "lunch", "special", "advisory"].includes(p.kind) ? p.kind : "class",
    };
  }

  // Which rotation letter ("A"/"B"/"Day 3") a date falls on. Weekends and
  // no-school days do NOT consume a rotation slot — that is the whole point of
  // a rotating schedule, so the count walks school days only.
  function rotationDayFor(schedule, iso) {
    const s = normalizeSchedule(schedule);
    if (s.rotation.type === "none" || !s.rotation.anchorDate || !DATE_RE.test(iso)) return "";
    const labels = s.rotation.labels;
    if (!labels.length) return "";
    const dir = iso >= s.rotation.anchorDate ? 1 : -1;
    let cursor = s.rotation.anchorDate;
    let index = s.rotation.anchorIndex % labels.length;
    let guard = 0;
    while (cursor !== iso && guard++ < 800) {
      cursor = addDays(cursor, dir);
      if (isSchoolDay(s, cursor)) index += dir;
    }
    if (cursor !== iso) return "";
    return labels[((index % labels.length) + labels.length) % labels.length];
  }

  function exceptionFor(schedule, iso) {
    const s = normalizeSchedule(schedule);
    return s.exceptions.find((e) => e.date === iso) || null;
  }

  function isSchoolDay(schedule, iso) {
    const s = normalizeSchedule(schedule);
    if (!DATE_RE.test(iso) || isWeekend(iso)) return false;
    const ex = s.exceptions.find((e) => e.date === iso);
    return !(ex && ex.type === "no-school");
  }

  // The day's timetable: every period that meets, sorted, with resolved minutes.
  function periodsFor(schedule, iso) {
    const s = normalizeSchedule(schedule);
    if (!isSchoolDay(s, iso)) return [];
    const dn = dayName(iso);
    const rot = rotationDayFor(s, iso);
    return s.periods
      .filter((p) => {
        if (p.days.length && !p.days.includes(dn)) return false;
        if (p.rotationDays.length && rot && !p.rotationDays.includes(rot)) return false;
        if (p.rotationDays.length && !rot) return false;
        return hhmmToMin(p.start) !== null && hhmmToMin(p.end) !== null;
      })
      .map((p) => ({ ...p, startMin: hhmmToMin(p.start), endMin: hhmmToMin(p.end) }))
      .sort((a, b) => a.startMin - b.startMin || a.name.localeCompare(b.name));
  }

  // A complete description of one calendar day, used by every school-facing view.
  function dayPlan(schedule, iso) {
    const s = normalizeSchedule(schedule);
    const ex = exceptionFor(s, iso);
    const school = isSchoolDay(s, iso);
    const periods = periodsFor(s, iso);
    const dismiss =
      ex && ex.dismissTime ? hhmmToMin(ex.dismissTime) : hhmmToMin(s.dismissTime) || 905;
    const activities = s.activities.filter((a) => a.days.includes(dayName(iso)));
    return {
      date: iso,
      dayName: dayName(iso),
      school,
      exception: ex,
      // A "no-school" day is never labeled by weekday; an event day still is.
      label: !school
        ? ex && ex.label
          ? ex.label
          : isWeekend(iso)
            ? "Weekend"
            : "No school"
        : ex && ex.label
          ? ex.label
          : "",
      earlyDismissal: !!(ex && ex.type === "early-dismissal"),
      rotationDay: rotationDayFor(s, iso),
      startMin: school ? (periods.length ? periods[0].startMin : hhmmToMin(s.startTime)) : null,
      dismissMin: school ? dismiss : null,
      periods,
      classPeriods: periods.filter((p) => p.kind === "class"),
      activities,
    };
  }

  // "NOW: Science 10:12–11:03 / NEXT: English in 14 min".
  function nowNext(schedule, iso, nowMin) {
    const plan = dayPlan(schedule, iso);
    if (!plan.school || !plan.periods.length) return { inSchool: false, now: null, next: null };
    const now = plan.periods.find((p) => nowMin >= p.startMin && nowMin < p.endMin) || null;
    const next = plan.periods.find((p) => p.startMin > nowMin) || null;
    return {
      inSchool: nowMin >= plan.periods[0].startMin && nowMin < plan.dismissMin,
      beforeSchool: nowMin < plan.periods[0].startMin,
      afterSchool: nowMin >= plan.dismissMin,
      now,
      next,
      minsToNext: next ? next.startMin - nowMin : null,
      minsLeftInNow: now ? now.endMin - nowMin : null,
    };
  }

  // How many minutes of real work time are left today, after school and
  // after any scheduled activity. Caps at a humane after-school ceiling so a
  // 7th-grader is never handed a 5-hour plan.
  function availableMinutes(schedule, iso, nowMin, opts) {
    const o = opts || {};
    const bedtimeMin = hhmmToMin(o.bedtime) === null ? 21 * 60 : hhmmToMin(o.bedtime);
    const maxWork = Number(o.maxWorkMin) || 150;
    const plan = dayPlan(schedule, iso);
    let start = nowMin;
    if (plan.school && plan.dismissMin !== null && nowMin < plan.dismissMin)
      start = plan.dismissMin;
    let end = bedtimeMin;
    // A scheduled activity carves its block out of the window.
    for (const a of plan.activities) {
      const as = hhmmToMin(a.start);
      const ae = hhmmToMin(a.end);
      if (as === null || ae === null) continue;
      if (as <= start && ae > start) start = ae;
      else if (as > start && as < end) end = Math.min(end, as);
    }
    return Math.max(0, Math.min(maxWork, end - start));
  }

  // ---------------------------------------------------------------------------
  // Work items
  // ---------------------------------------------------------------------------
  const KINDS = ["assignment", "assessment", "project", "study"];
  const IMPORTANCE = { high: 1, normal: 0, low: -1 };

  // The scheduling identity of an item: the date it should actually be WORKED
  // on, which is deliberately distinct from the date it is DUE.
  const workDate = (it) => (DATE_RE.test(it.plannedDate) ? it.plannedDate : it.due || "");

  function isAssessment(it) {
    return it.kind === "assessment" || it.assessmentType === "quiz" || it.assessmentType === "test";
  }

  // ---------------------------------------------------------------------------
  // PRIORITY ENGINE — deterministic, explainable, unit-tested.
  // ---------------------------------------------------------------------------
  // Every item gets a score plus the single human sentence that explains it.
  // Bands are spaced far enough apart that a modifier can never jump an item
  // across a band (e.g. a "started" bonus cannot make a next-week task outrank
  // an overdue one), which is what keeps the ordering trustworthy.
  function scoreItem(item, ctx) {
    const todayIso = ctx.todayIso;
    const availableMin = Number(ctx.availableMin) || 0;
    const est = Math.max(0, Number(item.estimateMin) || 0);
    const due = DATE_RE.test(item.due) ? item.due : "";
    const n = due ? daysBetween(todayIso, due) : null;
    let score;
    let reason;

    if (isAssessment(item)) {
      // An assessment is never "work" itself — its study sessions are. It only
      // enters the ranking to explain WHY a study block outranks homework.
      const label = item.assessmentType === "test" ? "test" : "quiz";
      if (n === null) {
        score = 300;
        reason = `A ${label} is coming — no date set yet.`;
      } else if (n < 0) {
        score = 0;
        reason = `That ${label} has passed.`;
      } else if (n === 0) {
        score = 900;
        reason = `Your ${label} is today.`;
      } else {
        score = 700 - n * 30;
        reason =
          n === 1
            ? `Next because your ${label} is tomorrow.`
            : `Next because your ${label} is ${dayName(due)}.`;
      }
    } else if (n === null) {
      score = 200;
      reason = "No due date — do it when you have time.";
    } else if (n < 0) {
      score = 1000 + Math.min(200, -n * 10);
      reason =
        n === -1 ? "Next because it was due yesterday." : `Next because it is ${-n} days late.`;
    } else if (n === 0) {
      score = 800;
      reason = "Next because it is due today.";
    } else if (n === 1) {
      score = 700;
      reason = "Next because it is due tomorrow.";
    } else {
      score = 620 - n * 25;
      reason = `Due ${dayName(due)} — ${n} days away.`;
    }

    // Modifiers (all strictly smaller than the gap between bands).
    if (item.status === "doing") {
      score += 40;
      if (n !== null && n >= 0 && !isAssessment(item)) reason = "Next because you already started.";
    }
    score += (IMPORTANCE[item.importance] || 0) * 25;
    // A project STEP planned for today is real, sized work — treat it like
    // today's homework instead of letting the whole project sit until the eve.
    if (item.kind === "project" && workDate(item) === todayIso) score += 60;
    // Fit: prefer something that actually fits the time he has left.
    if (availableMin > 0 && est > 0) {
      if (est <= availableMin) score += 15;
      else score -= 50;
    }
    // A shorter task breaks a tie — momentum beats perfection.
    return { score, reason, est };
  }

  // Ranked next-up list. Fully deterministic: equal scores fall back to
  // shorter estimate, then due date, then title, then id.
  function prioritize(ctx) {
    const c = ctx || {};
    const todayIso = c.todayIso;
    const items = (Array.isArray(c.items) ? c.items : []).filter(
      (it) => it && it.status !== "done" && !isAssessment(it),
    );
    const scored = items.map((it) => {
      const s = scoreItem(it, c);
      return { item: it, id: it.id, score: s.score, reason: s.reason, estimateMin: s.est };
    });
    scored.sort(
      (a, b) =>
        b.score - a.score ||
        (a.estimateMin || 999) - (b.estimateMin || 999) ||
        String(a.item.due || "9999").localeCompare(String(b.item.due || "9999")) ||
        String(a.item.title || "").localeCompare(String(b.item.title || "")) ||
        String(a.id).localeCompare(String(b.id)),
    );
    void todayIso;
    return scored;
  }

  const nextUp = (ctx) => prioritize(ctx)[0] || null;

  // ---------------------------------------------------------------------------
  // ASSESSMENTS — automatic spaced study plan
  // ---------------------------------------------------------------------------
  // Ladder of study focuses, applied nearest-first so the LAST session before
  // the assessment is always the light confidence review, never new material.
  const STUDY_LADDER = [
    { focus: "Quick review", minutes: 10, detail: "Skim everything once. No notes." },
    { focus: "Practice questions", minutes: 15, detail: "Answer questions without looking." },
    { focus: "The hard parts", minutes: 15, detail: "Redo only what you got wrong." },
    { focus: "Vocabulary", minutes: 10, detail: "Learn the words and what they mean." },
    { focus: "Read the notes", minutes: 15, detail: "Read through and mark what's confusing." },
  ];

  // Build a study schedule for an assessment. Entered late (1–2 days out) it
  // COMPRESSES — it never invents days that do not exist, and it never plans a
  // session in the past.
  function buildStudyPlan(assessment, todayIso, opts) {
    const o = opts || {};
    const due = DATE_RE.test(assessment && assessment.due) ? assessment.due : "";
    if (!due) return [];
    const daysOut = daysBetween(todayIso, due);
    if (daysOut === null || daysOut < 0) return [];
    const isTest = assessment.assessmentType === "test";
    // A test earns more sessions than a quiz, capped by the days available.
    const wanted = isTest ? 4 : 3;
    // Study happens on the days BEFORE the assessment, plus today. A same-day
    // assessment still gets one short session so "study now" is never empty.
    const candidates = [];
    for (let d = 0; d < Math.max(1, daysOut); d++) candidates.push(addDays(todayIso, d));
    if (daysOut === 0 && !candidates.includes(todayIso)) candidates.push(todayIso);
    const chosen = pickSpacedDays(candidates, Math.min(wanted, candidates.length));
    const ladder = STUDY_LADDER.slice(0, chosen.length);
    // Nearest day gets the lightest/last rung: reverse the ladder onto the days.
    return chosen.map((date, i) => {
      const rung = ladder[chosen.length - 1 - i];
      const compressed = chosen.length < wanted;
      return {
        id: `sp_${assessment.id}_${date}`,
        assessmentId: assessment.id,
        date,
        minutes: compressed ? Math.round(rung.minutes * 1.5) : rung.minutes,
        focus: rung.focus,
        detail: rung.detail,
        done: false,
      };
    });
  }

  // Spread N sessions as evenly as possible across the available days, always
  // including the first (start now) and the last (review right before).
  function pickSpacedDays(days, count) {
    if (count <= 0 || !days.length) return [];
    if (count >= days.length) return days.slice();
    if (count === 1) return [days[0]];
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(days[Math.round((i * (days.length - 1)) / (count - 1))]);
    }
    return [...new Set(out)];
  }

  function studyProgress(plan) {
    const list = Array.isArray(plan) ? plan : [];
    const done = list.filter((s) => s.done).length;
    return {
      done,
      total: list.length,
      pct: list.length ? Math.round((done / list.length) * 100) : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // PROJECTS — break it down, then schedule the steps
  // ---------------------------------------------------------------------------
  const PROJECT_STEPS = {
    writing: [
      "Read the directions",
      "Pick my topic",
      "Find my sources",
      "Make an outline",
      "Write the draft",
      "Check it against the rubric",
      "Fix and reread",
      "Turn it in",
    ],
    research: [
      "Read the directions",
      "Choose a topic",
      "Find 3 sources",
      "Take notes",
      "Make an outline",
      "Build the project",
      "Check the rubric",
      "Turn it in",
    ],
    build: [
      "Read the directions",
      "List every part I need",
      "Gather materials",
      "Build part 1",
      "Build part 2",
      "Put it together",
      "Check the rubric",
      "Turn it in",
    ],
    presentation: [
      "Read the directions",
      "Pick my topic",
      "Gather the facts",
      "Make the slides",
      "Write what I'll say",
      "Practice out loud",
      "Check the rubric",
      "Turn it in",
    ],
  };

  function projectKindFor(title) {
    const t = String(title || "").toLowerCase();
    if (/essay|write|writing|paper|report|story/.test(t)) return "writing";
    if (/present|slide|speech|poster board|talk/.test(t)) return "presentation";
    if (/build|model|design|make a|diorama|construct/.test(t)) return "build";
    return "research";
  }

  function defaultProjectSteps(title) {
    return PROJECT_STEPS[projectKindFor(title)].slice();
  }

  // Fan a project's steps across the days before it is due so that today
  // always has a small, obvious piece of it — and nothing lands on the due
  // date itself except "Turn it in".
  function scheduleProjectSteps(steps, todayIso, dueIso) {
    const list = (Array.isArray(steps) ? steps : []).filter(Boolean);
    if (!list.length) return [];
    const span = daysBetween(todayIso, dueIso);
    if (span === null || span <= 0) {
      return list.map((s, i) => ({ ...toStep(s, i), date: todayIso }));
    }
    // Working days available = today .. day before due, plus the due date for
    // the final "turn it in" step.
    const workDays = [];
    for (let d = 0; d < span; d++) workDays.push(addDays(todayIso, d));
    const body = list.slice(0, Math.max(1, list.length - 1));
    const last = list.length > 1 ? list[list.length - 1] : null;
    const out = body.map((s, i) => ({
      ...toStep(s, i),
      date: workDays[
        Math.min(workDays.length - 1, Math.floor((i * workDays.length) / body.length))
      ],
    }));
    if (last) out.push({ ...toStep(last, list.length - 1), date: dueIso });
    return out;
  }

  function toStep(s, i) {
    if (s && typeof s === "object") {
      return {
        id: s.id || `st_${i}`,
        text: String(s.text || s.name || "Step").slice(0, 160),
        done: !!s.done,
        minutes: Math.max(5, Number(s.minutes) || 20),
      };
    }
    return { id: `st_${i}`, text: String(s).slice(0, 160), done: false, minutes: 20 };
  }

  // The one project step that should be visible today (first unfinished step
  // scheduled on or before today). This is what stops a project from sitting
  // as one intimidating blob until the night before.
  function currentProjectStep(project, todayIso) {
    const steps = Array.isArray(project && project.steps) ? project.steps : [];
    const due = steps.filter((s) => !s.done && (!s.date || s.date <= todayIso));
    return due[0] || steps.find((s) => !s.done) || null;
  }

  // ---------------------------------------------------------------------------
  // START MY PLAN — a realistic after-school work sequence
  // ---------------------------------------------------------------------------
  function buildPlan(ctx) {
    const c = ctx || {};
    const breakMin = Math.max(0, Number(c.breakMin) || 5);
    const defaultMin = Math.max(5, Number(c.defaultFocusMin) || 15);
    const maxBlockMin = Math.max(defaultMin, Number(c.maxBlockMin) || 30);
    let budget = Math.max(0, Number(c.availableMin) || 0);
    const ranked = prioritize(c);
    const blocks = [];
    let used = 0;
    let cursor = Number.isFinite(c.startMin) ? Number(c.startMin) : null;

    for (const entry of ranked) {
      if (budget <= 0) break;
      const est = Math.max(5, Number(entry.estimateMin) || defaultMin);
      // Long work is chunked — a 7th-grader gets a 30-minute block plus a
      // "keep going" continuation, never a single 90-minute wall.
      const minutes = Math.min(est, maxBlockMin, budget);
      // Never emit a token sliver: a partial block below 10 minutes is not
      // real work, it just makes the plan look longer than it is.
      if (minutes < est && minutes < 10) break;
      if (minutes < 5) break;
      const block = {
        kind: "work",
        itemId: entry.item.id,
        title: entry.item.title,
        classId: entry.item.classId || "",
        minutes,
        reason: entry.reason,
        partial: minutes < est,
        remainingMin: Math.max(0, est - minutes),
      };
      if (cursor !== null) {
        block.startMin = cursor;
        block.endMin = cursor + minutes;
        cursor += minutes;
      }
      blocks.push(block);
      budget -= minutes;
      used += minutes;
      // A break only earns its place between two work blocks, and only if
      // there is still meaningful time left after it.
      if (budget > breakMin + 5 && breakMin > 0) {
        const br = { kind: "break", title: "Break", minutes: breakMin };
        if (cursor !== null) {
          br.startMin = cursor;
          br.endMin = cursor + breakMin;
          cursor += breakMin;
        }
        blocks.push(br);
        budget -= breakMin;
      }
    }
    // Never end a plan on a break.
    while (blocks.length && blocks[blocks.length - 1].kind === "break") blocks.pop();
    const workBlocks = blocks.filter((b) => b.kind === "work");
    // The finish time is the end of what actually remains, not wherever the
    // cursor wandered before a trailing break was trimmed off.
    const last = blocks[blocks.length - 1];
    const finishByMin = last && Number.isFinite(last.endMin) ? last.endMin : cursor;
    return {
      blocks,
      workBlocks,
      totalMin: blocks.reduce((n, b) => n + b.minutes, 0),
      workMin: used,
      leftOver: ranked.slice(workBlocks.length).map((e) => e.item),
      finishByMin,
    };
  }

  // ---------------------------------------------------------------------------
  // MISSED-WORK RECOVERY
  // ---------------------------------------------------------------------------
  // Never a red graveyard: for each unfinished item, recommend the single
  // safest move and say why. `due` is never rewritten — only `plannedDate`.
  function recoveryFor(item, todayIso, ctx) {
    const c = ctx || {};
    const tomorrow = addDays(todayIso, 1);
    const tomorrowLoad = Number(c.tomorrowLoadMin) || 0;
    const capacity = Number(c.dailyCapacityMin) || 90;
    const est = Math.max(5, Number(item.estimateMin) || 15);
    const n = item.due ? daysBetween(todayIso, item.due) : null;

    if (n !== null && n < 0) {
      return {
        action: "finish-now",
        planTo: todayIso,
        reason: "It's already late — finishing a little of it today is the safest move.",
      };
    }
    if (n === 0) {
      return {
        action: "finish-now",
        planTo: todayIso,
        reason: "It's due today, so it can't move.",
      };
    }
    if (tomorrowLoad + est > capacity && n !== null && n > 1) {
      const target = addDays(todayIso, 2) <= item.due ? addDays(todayIso, 2) : tomorrow;
      return {
        action: "move",
        planTo: target,
        reason: `Tomorrow is already about ${durationLabel(tomorrowLoad)} of work — this fits better ${dayName(target)}.`,
      };
    }
    return {
      action: "move",
      planTo: tomorrow,
      reason: `Still due ${item.due ? dayName(item.due) : "later"} — moving the work to tomorrow keeps you on time.`,
    };
  }

  // Applying a recovery never loses history: the original due date is
  // preserved on first move, and the move is appended to the item's log.
  function applyRecovery(item, recovery, atIso) {
    const originalDue = item.originalDue || item.due || "";
    const history = Array.isArray(item.planHistory) ? item.planHistory.slice(-19) : [];
    history.push({
      from: workDate(item) || "",
      to: recovery.planTo,
      at: atIso,
      why: recovery.action,
    });
    return {
      ...item,
      originalDue,
      due: item.due, // deliberately unchanged — the deadline is real
      plannedDate: recovery.planTo,
      planHistory: history,
    };
  }

  // Total planned minutes on a given day — used to keep recovery from
  // dogpiling tomorrow.
  function loadForDay(items, iso) {
    return (Array.isArray(items) ? items : [])
      .filter((it) => it.status !== "done" && workDate(it) === iso)
      .reduce((n, it) => n + Math.max(5, Number(it.estimateMin) || 15), 0);
  }

  // ---------------------------------------------------------------------------
  // NATURAL-LANGUAGE ENTRY — deterministic parsing, no AI required
  // ---------------------------------------------------------------------------
  const WEEKDAY_WORDS = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  function parseEntry(text, opts) {
    const o = opts || {};
    const todayIso = DATE_RE.test(o.todayIso) ? o.todayIso : "";
    const classes = Array.isArray(o.classes) ? o.classes : [];
    const raw = String(text || "").trim();
    if (!raw) return null;
    let rest = raw;
    const matched = [];

    // --- duration: "30 min", "1 hr", "about 45 minutes"
    let estimateMin = 0;
    const dur = /\b(?:about\s+|~\s*)?(\d{1,3})\s*(min(?:ute)?s?|hr?s?|hours?)\b/i.exec(rest);
    if (dur) {
      const n = Number(dur[1]);
      estimateMin = /^h/i.test(dur[2]) ? n * 60 : n;
      rest = rest.replace(dur[0], " ");
      matched.push("duration");
    }

    // --- kind: quiz / test / project / essay
    let kind = "assignment";
    let assessmentType = "";
    if (/\b(test|exam)\b/i.test(rest)) {
      kind = "assessment";
      assessmentType = "test";
      matched.push("test");
    } else if (/\bquiz\b/i.test(rest)) {
      kind = "assessment";
      assessmentType = "quiz";
      matched.push("quiz");
    } else if (/\b(project|essay|report|presentation)\b/i.test(rest)) {
      kind = "project";
      matched.push("project");
    }

    // --- date
    const date = extractDate(rest, todayIso);
    if (date.iso) {
      rest = rest.replace(date.phrase, " ");
      matched.push("date");
    }

    // --- detail: "chapters 3-4", "problems 1-20", "pages 40-55"
    let detail = "";
    const det =
      /\b(chapters?|ch|problems?|pages?|pp|questions?|sections?)\s*\.?\s*([\d\s,–—-]+\d)/i.exec(
        rest,
      );
    if (det) {
      detail = det[0].replace(/\s+/g, " ").trim().replace(/-/g, "–");
      matched.push("detail");
    }

    // --- class
    let classId = "";
    let className = "";
    for (const c of classes) {
      const name = String(c.name || "");
      const first = name.split(/[\s/]+/)[0];
      if (first && new RegExp(`\\b${escapeRe(first)}`, "i").test(raw)) {
        classId = c.id;
        className = name;
        matched.push("class");
        break;
      }
    }

    const title = titleCase(cleanTitle(rest)) || titleCase(raw.slice(0, 60));
    if (!estimateMin) estimateMin = kind === "assessment" ? 0 : kind === "project" ? 45 : 20;

    return {
      kind,
      assessmentType,
      title,
      classId,
      className,
      due: date.iso,
      dueLabel: date.iso
        ? date.iso === todayIso
          ? "Today"
          : friendlyDate(date.iso, todayIso)
        : "",
      detail,
      estimateMin,
      // Low confidence => the UI must show a confirm/edit step instead of
      // silently creating something wrong.
      confidence:
        date.iso && (classId || kind !== "assignment") ? "high" : date.iso ? "medium" : "low",
      matched,
      raw,
    };
  }

  function extractDate(text, todayIso) {
    if (!todayIso) return { iso: "", phrase: "" };
    const t = String(text);
    let m = /\b(today|tonight)\b/i.exec(t);
    if (m) return { iso: todayIso, phrase: m[0] };
    m = /\btomorrow\b/i.exec(t);
    if (m) return { iso: addDays(todayIso, 1), phrase: m[0] };
    m = /\bnext week\b/i.exec(t);
    if (m) return { iso: addDays(todayIso, 7), phrase: m[0] };
    m = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(t);
    if (m) {
      const y = m[3]
        ? m[3].length === 2
          ? 2000 + Number(m[3])
          : Number(m[3])
        : parseLocal(todayIso).getFullYear();
      const iso = `${y}-${String(Number(m[1])).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
      // A bare month/day already past this year means next year.
      return {
        iso: DATE_RE.test(iso) ? (iso < todayIso && !m[3] ? addYear(iso) : iso) : "",
        phrase: m[0],
      };
    }
    m =
      /\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|thursdays|friday|saturday|sun|mon|tue|tues|wed|thu|thurs|fri|sat)\b/i.exec(
        t,
      );
    if (m) {
      const target = WEEKDAY_WORDS[m[2].toLowerCase().replace(/s$/, "")];
      if (target === undefined) return { iso: "", phrase: "" };
      const cur = parseLocal(todayIso).getDay();
      let delta = (target - cur + 7) % 7;
      if (delta === 0) delta = 7; // "friday" said on a Friday means next Friday
      if (m[1]) delta += 7;
      return { iso: addDays(todayIso, delta), phrase: m[0] };
    }
    return { iso: "", phrase: "" };
  }

  function addYear(iso) {
    const d = parseLocal(iso);
    d.setFullYear(d.getFullYear() + 1);
    return toIso(d);
  }
  const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function cleanTitle(s) {
    return String(s)
      .replace(/\b(due|on|by|at|for|about)\b/gi, " ")
      .replace(/[\s,]+/g, " ")
      .trim()
      .slice(0, 80);
  }
  function titleCase(s) {
    return String(s).replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
  }
  function friendlyDate(iso, todayIso) {
    const n = daysBetween(todayIso, iso);
    if (n === 0) return "Today";
    if (n === 1) return "Tomorrow";
    if (n !== null && n > 1 && n < 7) return dayName(iso);
    return iso;
  }

  // ---------------------------------------------------------------------------
  // PACK FOR TOMORROW
  // ---------------------------------------------------------------------------
  const ALWAYS_BRING = ["Chromebook", "Charger", "Water bottle"];

  function packList(ctx) {
    const c = ctx || {};
    const iso = c.dateIso;
    const plan = dayPlan(c.schedule, iso);
    const items = Array.isArray(c.items) ? c.items : [];
    const subjectNeeds = c.subjectNeeds && typeof c.subjectNeeds === "object" ? c.subjectNeeds : {};
    const classById = new Map((Array.isArray(c.classes) ? c.classes : []).map((k) => [k.id, k]));
    const bring = (Array.isArray(c.always) && c.always.length ? c.always : ALWAYS_BRING).slice();
    const alerts = [];

    const classNames = plan.classPeriods
      .map((p) => (classById.get(p.classId) || {}).name || p.name)
      .filter(Boolean);

    // Per-class configured needs (PE clothes, calculator, instrument…).
    for (const p of plan.classPeriods) {
      const key = p.classId || p.name;
      const needs = subjectNeeds[key] || subjectNeeds[p.name] || [];
      for (const need of needs) if (!bring.includes(need)) bring.push(need);
    }
    // Anything due tomorrow has to physically travel.
    for (const it of items) {
      if (it.status === "done" || it.due !== iso) continue;
      const cn = (classById.get(it.classId) || {}).name || "";
      const label = cn ? `${cn}: ${it.title}` : it.title;
      if (!bring.includes(label)) bring.push(label);
      if (it.kind === "project" || it.assessmentType) {
        alerts.push(
          it.assessmentType
            ? `${it.title} — ${it.assessmentType} tomorrow.`
            : `${it.title} is due tomorrow.`,
        );
      }
    }
    for (const a of plan.activities)
      alerts.push(`${a.name} after school${a.place ? ` (${a.place})` : ""}.`);

    return {
      date: iso,
      school: plan.school,
      label: plan.label,
      startMin: plan.startMin,
      classNames,
      bring,
      alerts,
      earlyDismissal: plan.earlyDismissal,
    };
  }

  // ---------------------------------------------------------------------------
  // "I'M STUCK" — a concrete unblock for each real reason
  // ---------------------------------------------------------------------------
  const STUCK_OPTIONS = [
    {
      id: "understand",
      label: "I don't understand it",
      title: "Let's make it smaller",
      steps: [
        "Read just the first question out loud.",
        "Say what it is asking in your own words.",
        "Ask Study Coach for a hint on that one question.",
      ],
      action: { act: "ai-hint", label: "Get a hint" },
    },
    {
      id: "start",
      label: "I don't know how to start",
      title: "Do the smallest possible thing",
      steps: ["Open the assignment.", "Read only the first question.", "Work for five minutes."],
      action: { act: "focus-launch", arg: "5", label: "Start 5-Minute Launch" },
    },
    {
      id: "directions",
      label: "I need the directions explained",
      title: "Let's decode the directions",
      steps: [
        "Find the sentence that says what to turn in.",
        "Underline every verb (list, explain, solve…).",
        "Ask Study Coach to say it in plain words.",
      ],
      action: { act: "ai-directions", label: "Explain the directions" },
    },
    {
      id: "missing",
      label: "I don't have what I need",
      title: "Let's find out what's missing",
      // This branch must NOT pretend the work can proceed — it captures the
      // missing thing as a real reminder instead.
      steps: [
        "Name the thing you're missing.",
        "We'll add it to tomorrow's pack list.",
        "Then pick a different task for right now.",
      ],
      action: { act: "capture-missing", label: "Add what's missing" },
    },
    {
      id: "longer",
      label: "It's taking longer than I expected",
      title: "That's normal — let's re-time it",
      steps: [
        "Guess how much is actually left.",
        "Take one more short block.",
        "We'll remember the real time for next time.",
      ],
      action: { act: "focus-extend", arg: "10", label: "Add 10 more minutes" },
    },
    {
      id: "focus",
      label: "I can't focus",
      title: "Reset, then a tiny block",
      steps: [
        "Stand up and get water.",
        "Clear everything else off the desk.",
        "Try five minutes.",
      ],
      action: { act: "calming", label: "Take a calm minute" },
    },
  ];

  // ---------------------------------------------------------------------------
  // "I'M OVERWHELMED" — one tiny action at a time, backlog hidden
  // ---------------------------------------------------------------------------
  function overwhelmedSteps(item) {
    const title = (item && item.title) || "your work";
    return [
      { text: `Open ${title}.`, action: null, cta: "Done" },
      { text: "Find the first question.", action: null, cta: "Done" },
      {
        text: "Work for five minutes.",
        action: { act: "focus-launch", arg: "5" },
        cta: "Start 5 minutes",
      },
      {
        text: "Nice. Keep going or stop here — both are fine.",
        action: { act: "overwhelm-exit" },
        cta: "I'm good",
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // Duration learning — improve estimates from real sessions, no surveillance.
  // ---------------------------------------------------------------------------
  // Stores nothing but a per-class rolling ratio of actual:estimated time.
  function updateEstimateModel(model, sample) {
    const m = model && typeof model === "object" ? { ...model } : {};
    const key = sample.classId || "_";
    const est = Math.max(1, Number(sample.estimateMin) || 0);
    const act = Math.max(1, Number(sample.actualMin) || 0);
    const prev = m[key] || { ratio: 1, n: 0 };
    const n = Math.min(20, prev.n + 1);
    const ratio = (prev.ratio * (n - 1) + act / est) / n;
    m[key] = { ratio: Math.max(0.5, Math.min(3, Number(ratio.toFixed(3)))), n };
    return m;
  }
  function suggestEstimate(model, classId, baseMin) {
    const entry = (model || {})[classId || "_"];
    const base = Math.max(5, Number(baseMin) || 20);
    if (!entry || entry.n < 3) return base;
    return Math.max(5, Math.round((base * entry.ratio) / 5) * 5);
  }

  const api = {
    // dates
    parseLocal,
    toIso,
    addDays,
    daysBetween,
    dayName,
    isWeekend,
    hhmmToMin,
    minToHhmm,
    minToLabel,
    durationLabel,
    // schedule
    normalizeSchedule,
    normalizePeriod,
    rotationDayFor,
    isSchoolDay,
    exceptionFor,
    periodsFor,
    dayPlan,
    nowNext,
    availableMinutes,
    // priority
    scoreItem,
    prioritize,
    nextUp,
    workDate,
    isAssessment,
    // assessments
    buildStudyPlan,
    pickSpacedDays,
    studyProgress,
    STUDY_LADDER,
    // projects
    defaultProjectSteps,
    projectKindFor,
    scheduleProjectSteps,
    currentProjectStep,
    PROJECT_STEPS,
    // plan
    buildPlan,
    // recovery
    recoveryFor,
    applyRecovery,
    loadForDay,
    // entry
    parseEntry,
    extractDate,
    friendlyDate,
    // pack
    packList,
    ALWAYS_BRING,
    // support
    STUCK_OPTIONS,
    overwhelmedSteps,
    // estimates
    updateEstimateModel,
    suggestEstimate,
  };

  root.PlannerCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
