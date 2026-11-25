/* POST /api/privacy/delete-class  { code, confirm }
 *
 * Hard-deletes a class and every row that hangs off it (the table list is functions/_lib/privacy/
 * tables.js), then appends a deletion receipt. Teacher credential: `x-class-teacher` (class passcode)
 * or `x-teacher-key` (site key), the same ones /api/class uses. `confirm` must repeat the class code.
 * Response: { ok, deleted, counts, receipt }. The receipt holds counts and the class code, no content.
 */
import { normalizeCode } from "../../../shared/class-platform/contract.js";
import { handler } from "../../_lib/http.js";
import { deleteClass } from "../../_lib/privacy/delete.js";
import { deleteFailure, fail, requireClassTeacher } from "../../_lib/privacy/teacher.js";

export const onRequest = handler({
  methods: ["POST"],
  maxBodyBytes: 2048,
  async handle(context) {
    const auth = await requireClassTeacher(context, context.body?.code);
    if (auth.error) return auth.error;
    if (normalizeCode(context.body?.confirm) !== auth.cls.code) return fail("confirm-mismatch");
    try {
      const { receipt, counts } = await deleteClass(context.env.DB, {
        code: auth.cls.code,
        actor: auth.role === "site" ? "site" : "teacher",
        now: Date.now(),
      });
      return { ok: true, deleted: auth.cls.code, counts, receipt };
    } catch (error) {
      return deleteFailure(error);
    }
  },
});
