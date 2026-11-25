/* POST /api/privacy/delete-student  { code, studentId } or { code, alias }
 *
 * Deletes one student alias from a class: their documents, recordings, writing, answers, takes,
 * scenes, assignment status, Book Studio work and the books they own, plus any synced progress rows
 * linked to their student id (table list: functions/_lib/privacy/tables.js). Appends a receipt that
 * names the opaque student id and row counts, never the alias. Same teacher credentials as /api/class.
 * Items a student added to a classmate's shared book stay (as in /api/class/remove-student).
 */
import { isStudentId } from "../../../shared/class-platform/contract.js";
import { handler } from "../../_lib/http.js";
import { deleteStudent } from "../../_lib/privacy/delete.js";
import { deleteFailure, fail, requireClassTeacher } from "../../_lib/privacy/teacher.js";

async function resolveStudentId(db, code, body) {
  if (isStudentId(body?.studentId)) {
    const row = await db
      .prepare("SELECT student_id FROM class_platform_student WHERE code = ?1 AND student_id = ?2")
      .bind(code, body.studentId)
      .first();
    return row?.student_id ?? null;
  }
  if (typeof body?.alias === "string" && body.alias.trim()) {
    // The alias column is COLLATE NOCASE, so this match ignores case like the join flow does.
    const row = await db
      .prepare("SELECT student_id FROM class_platform_student WHERE code = ?1 AND alias = ?2")
      .bind(code, body.alias.trim())
      .first();
    return row?.student_id ?? null;
  }
  return undefined;
}

export const onRequest = handler({
  methods: ["POST"],
  maxBodyBytes: 2048,
  async handle(context) {
    const auth = await requireClassTeacher(context, context.body?.code);
    if (auth.error) return auth.error;
    const studentId = await resolveStudentId(context.env.DB, auth.cls.code, context.body);
    if (studentId === undefined) return fail("invalid-student");
    if (studentId === null) return fail("student-not-found", 404);
    try {
      const { receipt, counts } = await deleteStudent(context.env.DB, {
        code: auth.cls.code,
        studentId,
        actor: auth.role === "site" ? "site" : "teacher",
        now: Date.now(),
      });
      return { ok: true, deleted: studentId, counts, receipt };
    } catch (error) {
      return deleteFailure(error);
    }
  },
});
