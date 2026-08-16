/* planning-resources.js — what a scheduled day gives you access to.
 *
 * Everything here is DERIVED from data/curriculum-launch-manifest.json. The
 * planner stores a lesson id and nothing else; the title, standard, objective,
 * vocabulary and every link come from the curriculum at read time. That is what
 * makes the planner an entry point into the curriculum rather than a second,
 * slowly-diverging copy of it.
 *
 * Nothing is invented. A resource appears only when the manifest carries a path
 * for it — a dead "Homework" button on a lesson that has none is worse than no
 * button, because the teacher finds out at 7:55am.
 */

/** Index the manifest once. Small-group and catch-up variants are keyed by the
 * CORE lesson they belong to, so a scheduled core lesson exposes its Extra
 * Support and Challenge groups with no per-variant mapping to maintain. */
export function indexCurriculum(launch) {
  const byId = new Map();
  for (const family of ["lessons", "smallGroups", "catchUps", "endOfUnit"]) {
    for (const entry of launch[family] || []) byId.set(entry.id, entry);
  }
  const groupsByParent = new Map();
  for (const g of launch.smallGroups || []) {
    if (!groupsByParent.has(g.parent)) groupsByParent.set(g.parent, []);
    groupsByParent.get(g.parent).push(g);
  }
  const catchUpsByParent = new Map();
  for (const c of launch.catchUps || []) catchUpsByParent.set(c.parent, c);
  const projectByUnit = new Map();
  for (const p of launch.endOfUnit || []) projectByUnit.set(p.unit, p);
  return { byId, groupsByParent, catchUpsByParent, projectByUnit, launch };
}

/* Group 1 is the support variant and Group 2 the enrichment variant. The labels
 * are the ones the site uses everywhere else; a proficiency label is never one
 * of them. */
const GROUP_LABELS = { 1: "Extra Support", 2: "Challenge" };

/* PLANNER SUPPORT STATUS.
 *
 * The planner says WHETHER a scheduled lesson has supports configured, and
 * nothing more: configuration stays on the supports surface, one place, so the
 * two cannot drift. A count is enough to answer the only question a planner
 * needs to answer — "is this one ready?".
 *
 * Modifications are counted separately and never folded into the support total.
 * "7 active" that silently includes a shortened task is precisely the summary
 * this system exists to prevent.
 *
 * Reads through the shared module when it is present, and degrades to no
 * suffix at all when it is not — a planner that cannot reach the support layer
 * still plans.
 */
export function supportStatusSuffix(lessonId) {
  try {
    const LS = globalThis.EWLLessonSupports;
    if (!LS) return "";
    const profile = LS.loadProfile(lessonId);
    if (!profile.keys.length) return ": not configured";
    const mods = profile.keys.filter((k) => LS.byKey[k]?.impact === "modification");
    const supports = profile.keys.length - mods.length;
    return mods.length
      ? `: ${supports} active + ${mods.length} task modification`
      : `: ${supports} active`;
  } catch {
    return "";
  }
}

/** The canonical identity of whatever is scheduled on a day, or null. */
export function identify(index, day) {
  const id = day.plan.lessonId;
  if (id && index.byId.has(id)) return index.byId.get(id);
  if (day.plan.dayType === "Project") {
    const unit = unitNumberOf(index, day);
    return unit ? (index.projectByUnit.get(unit) ?? null) : null;
  }
  return null;
}

/**
 * The EduWonderLab unit a day belongs to — the unit the teacher is IN on that
 * date, not the unit that owns the lesson.
 *
 * Those two differ, and only for assembled units. The Pre-Unit teaches 2-6 on
 * Aug 26 as prerequisite fluency; Unit 2 still teaches it in April. Reading the
 * lesson's own unit first labelled the first two weeks of school "Unit 2" and
 * "Unit 6" in the Week rows and the Month grid — text, cell colour and the
 * cell's aria-label, all naming units the teacher will not reach for months.
 * The pacing key is what the plan actually asserts about the date, so it is
 * read first; the lesson is the fallback for a day the plan does not key.
 */
export function unitNumberOf(index, day) {
  const key = day.plan.unitKey;
  if (key) {
    if (key === "PRE") return 1;
    const m = /^U(\d+)$/.exec(key);
    /* MSTAR and friends key no curriculum unit. Fall through to the lesson
     * rather than returning null, so a keyed day with a lesson still resolves. */
    if (m) return Number(m[1]);
  }
  const entry = day.plan.lessonId ? index.byId.get(day.plan.lessonId) : null;
  return entry ? entry.unit : null;
}

const link = (label, href, kind) => ({ label, href, kind });

/**
 * Every resource a day can open, grouped for display. Only entries the manifest
 * actually carries are returned.
 *
 * @returns {{whole: any[], smallGroup: any[], student: any[], teacher: any[]}}
 */
export function resourcesFor(index, day) {
  const whole = [];
  const smallGroup = [];
  const student = [];
  const teacher = [];

  const entry = identify(index, day);
  const unit = unitNumberOf(index, day);

  if (entry) {
    const r = entry.resources || {};
    if (r.lesson) {
      whole.push(
        link(
          entry.kind === "endOfUnit"
            ? "Open culminating project"
            : entry.kind === "catchUp"
              ? "Open catch-up station"
              : "Open interactive lesson",
          r.lesson,
          "primary",
        ),
      );
    }
    if (r.guidedNotes) student.push(link("Guided notes", r.guidedNotes, "student"));
    if (r.handout) student.push(link("Worksheet", r.handout, "student"));
    if (r.homework) student.push(link("Homework", r.homework, "student"));
    if (r.studentHelp) student.push(link("Student help", r.studentHelp, "student"));
    if (r.familyPage) student.push(link("Family page", r.familyPage, "student"));
    if (r.exitTicket) student.push(link("Exit ticket", r.exitTicket, "student"));

    for (const g of index.groupsByParent.get(entry.id) || []) {
      const label = GROUP_LABELS[g.group] || `Small group ${g.group}`;
      if (g.resources?.lesson) smallGroup.push(link(label, g.resources.lesson, "small-group"));
    }
    const catchUp = index.catchUpsByParent.get(entry.id);
    if (catchUp?.resources?.lesson) {
      smallGroup.push(link("Catch-up station", catchUp.resources.lesson, "small-group"));
    }
  }

  /* Flex, catch-up, review and assessment days have no single lesson, so they
   * are given the unit's real material rather than a placeholder.
   *
   * A Lost Day is deliberately excluded: it is a day that did not happen, and
   * offering it the unit's culminating project reads as a suggestion to teach
   * something on a day whose content has already moved elsewhere. */
  if (!entry && unit && day.plan.dayType !== "Lost Day") {
    const project = index.projectByUnit.get(unit);
    if (project?.resources?.lesson) {
      whole.push(link(`Unit ${unit} culminating project`, project.resources.lesson, "primary"));
    }
    const unitCatchUps = [...index.catchUpsByParent.values()].filter((c) => c.unit === unit);
    for (const c of unitCatchUps.slice(0, 4)) {
      if (c.resources?.lesson) smallGroup.push(link(c.title, c.resources.lesson, "small-group"));
    }
  }

  /* PLAN → SUPPORT. The planner stays planning-focused: this is a link into
   * the supports surface with the scheduled lesson already selected, not a
   * configuration UI embedded in a day card. Only real lessons get it — a
   * Review or Assessment day has no lesson to configure supports for. */
  if (entry && entry.kind !== "endOfUnit" && /^\d+-\d+$/.test(entry.id)) {
    teacher.push(
      link(
        `Student supports${supportStatusSuffix(entry.id)}`,
        `/curriculum/student-supports/?lesson=${encodeURIComponent(entry.id)}`,
        "teacher",
      ),
    );
  }

  if (unit) teacher.push(link(`Unit ${unit} hub`, `/curriculum/units/#unit-${unit}`, "teacher"));
  if (entry?.standard) {
    teacher.push(
      link(
        `Resource Finder · ${entry.standard}`,
        `/teacher-tools/resource-finder/?standard=${encodeURIComponent(entry.standard)}`,
        "teacher",
      ),
    );
  }
  /* Plan Week lives on the units hub and now has a "Fill from the pacing plan"
   * button, so this link needs no parameters — the week it fills is read from
   * this plan. A query string here would only look like a contract that the
   * other end does not honour. */
  teacher.push(link("Plan the week", "/curriculum/units/", "teacher"));
  teacher.push(link("Generate lesson plan", lessonPlanLink(entry, day), "teacher"));

  return { whole, smallGroup, student, teacher };
}

/**
 * Hand the existing lesson-plan generator everything it needs for THIS date, so
 * a lesson that moved from Tuesday to Wednesday generates a Wednesday plan
 * without the teacher restating anything.
 *
 * The parameter names are the generator's OWN deep-link contract
 * (`applyDeepLink` in teacher-tools/lesson-plan-generator/app.js): date,
 * standard, topic, focus. Inventing friendlier names here would produce a link
 * that silently fills nothing in. The document name is not passed at all — the
 * generator names its own exports `Neft.Alba — [date]` from the date it is
 * given, so the convention has one owner.
 */
export function lessonPlanLink(entry, day) {
  const params = new URLSearchParams({ date: day.date });
  if (entry?.standard) params.set("standard", entry.standard);
  if (entry?.title) params.set("topic", entry.title);
  if (entry?.objective) params.set("focus", entry.objective);
  return `/teacher-tools/lesson-plan-generator/?${params}`;
}

/** `Neft.Alba — [date]`, the required planning-document name. */
export function planDocumentName(isoDate) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const pretty = d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `Neft.Alba — ${pretty}`;
}

/** Display title for a day: the planning decision if there is one, else the
 * curriculum's own current title, else the day type. */
export function titleFor(index, day) {
  if (day.plan.planTitle) return day.plan.planTitle;
  const entry = identify(index, day);
  if (entry) return entry.title;
  if (day.schoolStatus !== "school") return day.calendarNote || day.statusLabel;
  return day.plan.dayType;
}

/** The line under the title: standard and objective, when the day has a lesson. */
export function detailFor(index, day) {
  const entry = identify(index, day);
  if (!entry) return null;
  return {
    id: entry.id,
    standard: entry.standard || null,
    objective: entry.objective || null,
    languageObjective: entry.languageObjective || null,
    vocabulary: entry.vocabulary || [],
    timeEstimate: entry.timeEstimate || null,
  };
}
