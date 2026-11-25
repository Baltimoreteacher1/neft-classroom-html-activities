/* POST /api/privacy/retention  { code, graceDays }
 *
 * A teacher shortens how long a class is kept after the school year ends (June 30). graceDays is a
 * whole number from 0 to 30; 30 is the default, so a class can be kept for less time, never more.
 * Stored as settings_json.retentionGraceDays and read by functions/_lib/privacy/retention.js.
 * Same teacher credentials as /api/class.
 */

import { handler } from "../../_lib/http.js";
import { GRACE_DAYS } from "../../_lib/privacy/retention.js";
import { fail, requireClassTeacher } from "../../_lib/privacy/teacher.js";

export const onRequest = handler({
  methods: ["POST"],
  maxBodyBytes: 2048,
  async handle(context) {
    const auth = await requireClassTeacher(context, context.body?.code);
    if (auth.error) return auth.error;
    const days = context.body?.graceDays;
    if (!Number.isInteger(days) || days < 0 || days > GRACE_DAYS) return fail("invalid-grace-days");
    let settings = {};
    try {
      settings = JSON.parse(auth.cls.settings_json) ?? {};
    } catch {
      settings = {};
    }
    settings.retentionGraceDays = days;
    await context.env.DB.prepare(
      "UPDATE class_platform_class SET settings_json = ?1 WHERE code = ?2",
    )
      .bind(JSON.stringify(settings), auth.cls.code)
      .run();
    return { ok: true, retentionGraceDays: days };
  },
});
