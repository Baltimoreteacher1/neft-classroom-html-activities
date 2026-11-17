// Sharing Part 2 evidence with the teacher: the class review queue that Writing Studio and Book Studio already use
// (POST /api/class/review/share). Nothing is sent unless the learner joined a class and pressed a share button.
import { api, loadLink } from "../class/link.js";

export const MAX_SHARE = 3900;
/** True when this device has joined a class (so a share button has somewhere to send). */
export const inClass = () => Boolean(loadLink());

/**
 * @param {{label:string, text:string}} work a short label the teacher sees and the plain-text evidence
 * @returns {Promise<{ok:true, workId:string} | {ok:false, reason:"no-class"|"empty"|"offline"|string}>}
 */
export async function shareWithClass({ label, text }, fetchImpl) {
  const link = loadLink();
  if (!link) return { ok: false, reason: "no-class" };
  const body = String(text || "")
    .trim()
    .slice(0, MAX_SHARE);
  if (!body) return { ok: false, reason: "empty" };
  try {
    const res = await api.reviewShare(
      link,
      { label: String(label || "").slice(0, 80), text: body },
      fetchImpl,
    );
    return res?.ok
      ? { ok: true, workId: res.workId || "" }
      : { ok: false, reason: res?.error || "offline" };
  } catch {
    return { ok: false, reason: "offline" };
  }
}
