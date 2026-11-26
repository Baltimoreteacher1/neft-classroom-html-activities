// Project Studio · file helpers shared by the Create panel and the packet tray. Word files come from the existing
// /api/studio/docx endpoint (functions/api/studio/docx.js): it stores nothing and only transforms the activity sent.

export const slug = (t) =>
  String(t || "activity")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "activity";

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Download the Word file for one activity. Resolves true when a .docx was saved. */
export async function wordFile(activity, part = "student", lang = "en", fetchImpl = (...a) => fetch(...a)) {
  const res = await fetchImpl("/api/studio/docx", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ activity, part, lang: lang === "es" ? "es" : "en" }),
  }).catch(() => null);
  if (!res?.ok) return false;
  const blob = await res.blob();
  if (!blob.size) return false;
  saveBlob(blob, `${slug(activity.title)}${part === "key" ? "-answer-key" : ""}.docx`);
  return true;
}
