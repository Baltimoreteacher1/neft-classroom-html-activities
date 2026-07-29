/* Teacher-gated Learning Loop API (Unit 3 pilot).
 *
 * Serves the PRIVATE half of the loop — misconception categories, rubrics,
 * reteach/extension routing and success criteria (which contain answers) — plus
 * an interpreted evidence summary per lesson.
 *
 * WHY THIS EXISTS AS A FUNCTION
 * lessons/<id>/config.json is served publicly by Pages, so the teacher half of
 * the loop cannot live there. functions/ is compiled into the Worker and never
 * served as a static asset, so importing the data module here keeps it private.
 * See scripts/seed-unit3-learning-loop.mjs for the two-projection split.
 *
 * AUTH — mirrors functions/api/progress:
 *   no TEACHER_KEY configured -> 503 (closed by default, never open)
 *   wrong / missing key       -> 401
 *
 * Routes
 *   GET /api/curriculum/loop?key=…              all piloted lessons (teacher data)
 *   GET /api/curriculum/loop?key=…&lesson=3-4   one lesson
 *   GET /api/curriculum/loop?key=…&evidence=1   + interpreted evidence per lesson
 *
 * The evidence view distinguishes completion from supported success from
 * independent mastery — see summarise() below. It never returns raw student
 * work, only derived counts, and it reports "insufficient evidence" honestly
 * rather than rendering an empty table as if it meant zero learning.
 */
import { UNIT3_LOOP_TEACHER } from "../../_lib/unit3-loop-teacher.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  // Teacher data must never be cached by a shared cache or a student's browser.
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

function authorize(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

/* Minimum distinct students before a per-lesson rollup is reported at all.
   Below this, an aggregate is both statistically meaningless and re-identifying
   in a class of 25 — so the endpoint returns a state, not a number. */
const MIN_COHORT = 3;

/* Turn raw telemetry rows into the five states a teacher actually acts on.
   Deliberately NOT a score: "completed the task" and "got it without help" are
   different instructional situations and are kept separate all the way through. */
function summarise(rows, lessonId) {
  const byStudent = new Map();
  for (const r of rows) {
    const who = (r.student_name || "").trim() || null;
    // Rows with no student identity cannot be attributed. They are counted for
    // volume but never used for per-student states.
    const key = who || `__anon_${r.id}`;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        identified: Boolean(who),
        attempts: 0,
        correct: 0,
        hints: 0,
        exhausted: 0,
        struggles: 0,
        misconceptions: [],
        transfer: null,
        retention: null,
      });
    }
    const s = byStudent.get(key);
    let props = {};
    try {
      props = r.payload_json ? JSON.parse(r.payload_json) : {};
    } catch {
      props = {};
    }
    switch (r.event_type) {
      case "item_attempt":
        s.attempts += 1;
        if (props.correct) s.correct += 1;
        if (props.misconception) s.misconceptions.push(props.misconception);
        break;
      case "hint_used":
        s.hints += 1;
        break;
      case "hint-exhausted":
        s.exhausted += 1;
        break;
      case "struggle":
        s.struggles += 1;
        break;
      case "misconception":
        if (props.tag) s.misconceptions.push(props.tag);
        break;
      case "transfer_outcome":
        s.transfer = props.correct ? "met" : "not-yet";
        break;
      case "retention_outcome":
        s.retention = props.correct ? "met" : "not-yet";
        break;
      default:
        break;
    }
  }

  const identified = [...byStudent.values()].filter((s) => s.identified);
  const withEvidence = identified.filter((s) => s.attempts > 0);

  if (withEvidence.length < MIN_COHORT) {
    return {
      lessonId,
      state: "insufficient-evidence",
      reason:
        withEvidence.length === 0
          ? "No attributed attempts recorded for this lesson yet."
          : `Only ${withEvidence.length} student record(s) with evidence; ${MIN_COHORT} needed before a class rollup is shown.`,
      rowsSeen: rows.length,
      studentsWithEvidence: withEvidence.length,
    };
  }

  // Independent = solved without using a hint and without a struggle signal.
  // Supported = solved, but hints or a struggle signal were involved.
  const independent = withEvidence.filter(
    (s) => s.correct > 0 && s.hints === 0 && s.struggles === 0,
  ).length;
  const supported = withEvidence.filter(
    (s) => s.correct > 0 && (s.hints > 0 || s.struggles > 0),
  ).length;
  const stillWorking = withEvidence.length - independent - supported;

  const tally = {};
  for (const s of withEvidence)
    for (const m of s.misconceptions) if (m) tally[m] = (tally[m] || 0) + 1;
  const topMisconceptions = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([code, count]) => ({ code, count }));

  const transferMet = withEvidence.filter((s) => s.transfer === "met").length;
  const transferSeen = withEvidence.filter((s) => s.transfer != null).length;
  const retentionMet = withEvidence.filter((s) => s.retention === "met").length;
  const retentionSeen = withEvidence.filter((s) => s.retention != null).length;

  return {
    lessonId,
    state: "ok",
    studentsWithEvidence: withEvidence.length,
    completion: { attempted: withEvidence.length },
    independentMastery: independent,
    supportedSuccess: supported,
    stillWorking,
    topMisconceptions,
    transfer:
      transferSeen === 0
        ? { state: "not-yet-collected" }
        : { state: "ok", met: transferMet, of: transferSeen },
    retention:
      retentionSeen === 0
        ? { state: "not-yet-collected" }
        : { state: "ok", met: retentionMet, of: retentionSeen },
    // Every recommendation names the signals that produced it, so a teacher can
    // disagree with it on the evidence rather than on trust.
    because: [
      `${independent} of ${withEvidence.length} solved it with no hint and no struggle signal`,
      `${supported} solved it with support`,
      topMisconceptions.length
        ? `most common misconception: ${topMisconceptions[0].code} (${topMisconceptions[0].count})`
        : "no misconception categories recorded",
    ],
  };
}

/* Recommendation is advisory and always explainable. It never labels a student —
   only the class-level next move. */
function recommend(summary, teacher) {
  if (!summary || summary.state !== "ok") {
    return { action: "collect-evidence", why: "Not enough evidence yet to suggest a next step." };
  }
  const n = summary.studentsWithEvidence;
  const share = n ? summary.independentMastery / n : 0;
  if (share >= 0.8) {
    return {
      action: "extend",
      resource: teacher?.extension || null,
      why: `${summary.independentMastery} of ${n} reached it independently.`,
    };
  }
  if (share <= 0.4) {
    return {
      action: "reteach",
      resource: teacher?.reteach || null,
      why: `Only ${summary.independentMastery} of ${n} reached it independently; ${summary.supportedSuccess} needed support.`,
      focus: summary.topMisconceptions[0]?.code || null,
    };
  }
  return {
    action: "small-group",
    resource: teacher?.reteach || null,
    why: `Mixed picture — ${summary.independentMastery} independent, ${summary.supportedSuccess} supported, ${summary.stillWorking} still working.`,
    focus: summary.topMisconceptions[0]?.code || null,
  };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const auth = authorize(env, request, url);
  if (auth === "not-configured") {
    return json({ error: "Teacher access is not configured on this deployment." }, 503);
  }
  if (auth !== "ok") return json({ error: "Unauthorized." }, 401);

  const only = url.searchParams.get("lesson");
  const wantEvidence = url.searchParams.get("evidence") === "1";

  const lessons = only
    ? UNIT3_LOOP_TEACHER[only]
      ? { [only]: UNIT3_LOOP_TEACHER[only] }
      : {}
    : UNIT3_LOOP_TEACHER;

  if (only && !UNIT3_LOOP_TEACHER[only]) {
    return json(
      {
        error: `No Learning Loop data for lesson "${only}".`,
        available: Object.keys(UNIT3_LOOP_TEACHER),
      },
      404,
    );
  }

  const payload = { pilot: "unit-3-learning-loop", lessons };

  if (wantEvidence) {
    if (!env.DB) {
      payload.evidence = {
        state: "unavailable",
        reason: "No database binding on this deployment.",
      };
    } else {
      payload.evidence = {};
      for (const id of Object.keys(lessons)) {
        try {
          const { results } = await env.DB.prepare(
            `SELECT id, student_name, event_type, payload_json
               FROM lesson_telemetry
              WHERE lesson_slug LIKE ?1 OR lesson_slug = ?2
              ORDER BY id DESC
              LIMIT 2000`,
          )
            .bind(`%${id}%`, id)
            .all();
          const summary = summarise(results || [], id);
          payload.evidence[id] = { ...summary, recommendation: recommend(summary, lessons[id]) };
        } catch (e) {
          payload.evidence[id] = { lessonId: id, state: "error", reason: String(e && e.message) };
        }
      }
    }
  }

  return json(payload);
}
