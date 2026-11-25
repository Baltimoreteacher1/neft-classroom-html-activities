// Single source of truth for what "delete this class" and "delete this student alias" remove.
//
// Every D1 table created by migrations/ appears exactly once, either in DELETE_PLAN (rows are removed)
// or in EXEMPT (a written reason why a class or student delete does not touch it).
// tools/privacy-delete.test.mjs derives the table list from the migrations and fails when a table is in
// neither, so a table added later breaks the build until someone decides what a delete does to it.
//
// Parameters: ?1 is the class code, ?2 the student id (student scope only). DELETE_PLAN is ordered
// children first, so the batch is safe even if a database enforces foreign keys.
//
// `student: null` means the table holds nothing that belongs to one student, so a student delete leaves it.

const CLASS_ROOMS = "SELECT room_id FROM class_platform_room WHERE code = ?1";
const CLASS_TAKES = "SELECT take_id FROM class_platform_take WHERE code = ?1";
const CLASS_BOOKS = "SELECT book_id FROM class_platform_book WHERE code = ?1";
const OWNED_BOOKS = "SELECT book_id FROM class_platform_book WHERE code = ?1 AND owner_id = ?2";
const CLASS_ACTIVITIES = "SELECT activity_id FROM class_platform_activity WHERE code = ?1";
const BY_CODE = "code = ?1";
const BY_CODE_STUDENT = "code = ?1 AND student_id = ?2";

export const DELETE_PLAN = Object.freeze([
  {
    table: "class_platform_take_reply",
    class: `take_id IN (${CLASS_TAKES})`,
    student: `(student_id = ?2 AND take_id IN (${CLASS_TAKES})) OR take_id IN (SELECT take_id FROM class_platform_take WHERE code = ?1 AND student_id = ?2)`,
  },
  { table: "class_platform_take", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_scene", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_pairing", class: BY_CODE, student: null },
  { table: "class_platform_bevent", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_bwork", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_bassign", class: BY_CODE, student: null },
  { table: "class_platform_aevent", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_astatus", class: BY_CODE, student: BY_CODE_STUDENT },
  {
    table: "class_platform_book_item",
    class: `book_id IN (${CLASS_BOOKS})`,
    student: `book_id IN (${OWNED_BOOKS})`,
  },
  {
    table: "class_platform_book_member",
    class: `book_id IN (${CLASS_BOOKS})`,
    student: `(student_id = ?2 AND book_id IN (${CLASS_BOOKS})) OR book_id IN (${OWNED_BOOKS})`,
  },
  {
    table: "class_platform_book_media",
    class: `book_id IN (${CLASS_BOOKS})`,
    student: `book_id IN (${OWNED_BOOKS})`,
  },
  { table: "class_platform_book", class: BY_CODE, student: "code = ?1 AND owner_id = ?2" },
  { table: "class_platform_book_space", class: BY_CODE, student: null },
  { table: "class_platform_teacher_library", class: BY_CODE, student: null },
  {
    table: "class_platform_activity_stat",
    class: `activity_id IN (${CLASS_ACTIVITIES})`,
    student: null,
  },
  { table: "class_platform_activity_rev", class: BY_CODE, student: null },
  { table: "class_platform_activity", class: BY_CODE, student: null },
  { table: "class_platform_experience", class: BY_CODE, student: null },
  {
    table: "class_platform_response",
    class: `room_id IN (${CLASS_ROOMS})`,
    student: `student_id = ?2 AND room_id IN (${CLASS_ROOMS})`,
  },
  { table: "class_platform_room", class: BY_CODE, student: null },
  { table: "class_platform_audio", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_work", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_review", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_doc", class: BY_CODE, student: BY_CODE_STUDENT },
  {
    table: "student_progress",
    class: "class_code = ?1",
    student: "class_code = ?1 AND student_id = ?2",
  },
  { table: "class_platform_student", class: BY_CODE, student: BY_CODE_STUDENT },
  { table: "class_platform_class", class: BY_CODE, student: null },
]);

/** Tables a class or student delete does not touch, each with the reason. */
export const EXEMPT = Object.freeze({
  privacy_deletion_receipt:
    "The receipt table itself: append-only proof of deletions, holds no student content.",
  class_platform_guard:
    "Rate-limit counters keyed by an opaque bucket string; no content, and every row expires within the hour.",
  class_roster:
    "Teacher roster under its own join-code namespace, not a class platform code; removed by DELETE /api/roster/save (teacher key). Not covered by receipts.",
  class_roster_guard: "Per-IP read counter for roster codes; no class or student reference.",
  class_data_class:
    "Class Investigation class under its own code namespace; removed by POST /api/class-data/purge (teacher key). Not covered by receipts.",
  class_data_investigation: "Same namespace and purge route as class_data_class.",
  class_data_entry:
    "Anonymous numeric contributions under the Class Investigation code; same purge route as class_data_class.",
  sg_room: "Small-group live room under its own room code; expires on its own, holds no alias.",
  sg_room_commit: "Seat answers of a small-group room; expire with the room, no alias.",
  insight_signal:
    "Keyed by section label and typed roster name, with no class code, so no reliable link to a class. KNOWN GAP: no delete route covers it.",
  plan_doc: "Teacher lesson-plan metadata; no class or student reference.",
  plan_note: "Teacher plan notes; no class or student reference.",
  osamr_board: "Shared board keyed by board id, not a class or student.",
  usage_signal: "Aggregate page-view counts; no person.",
  client_error: "Aggregate script-error counts; no person.",
  web_vital: "Aggregate performance samples; no person.",
  bcpss_shared_plans: "Teacher-shared plan notes per unit and tier; no class or student reference.",
  bcpss_unit_telemetry: "Aggregate event counts per unit; no person.",
  review_event:
    "Append-only log of staff decisions on lesson and unit content (migration 0022); no class, student or alias. The table refuses UPDATE and DELETE.",
  review_state:
    "Projection of review_event: latest review state per content block; no class or student reference.",
  content_release:
    "Immutable content release manifests (block id to content hash); no person, never deleted.",
  release_pointer: "Single row naming the current content release; no class or student reference.",
});

/** One scope's statements as data: [{ table, where, binds }], used by delete, dry-run and tests. */
export function scopeClauses(scope) {
  const student = scope.type === "student";
  const binds = student ? [scope.code, scope.studentId] : [scope.code];
  return DELETE_PLAN.flatMap((entry) => {
    const where = student ? entry.student : entry.class;
    return where ? [{ table: entry.table, where, binds }] : [];
  });
}
