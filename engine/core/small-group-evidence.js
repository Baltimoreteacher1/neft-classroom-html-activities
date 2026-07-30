// small-group-evidence.js — section-scoped, name-free evidence for the teacher
// mastery dashboard (/teacher-tools/mastery/, backed by /api/progress/telemetry).
//
// Privacy: the small-group studio advertises "Private · saved on this device"
// and the Facilitation Console promises no names are transmitted. This keeps
// that promise — the student's NAME is never sent. We attach only the class
// SECTION (from the learning-supports identity, when the student has one) plus
// an anonymous performance summary, so a teacher sees "how did my 6A group do"
// without any per-name tracking. No section → nothing is sent at all.
//
// Fire-and-forget: the endpoint always 204s and swallows errors, and this
// helper never throws or blocks the studio.
//
// Reporting honesty (see docs/specs/epistemic-policy.md): because a device with
// no class identity sends nothing at all, any aggregate built from these events
// is a SAMPLE, never a census. Every event therefore declares `reported: 1` so a
// dashboard can show its own coverage — "4 devices reported" — instead of
// rendering a bare 0 that a teacher will read as "nobody understood this."

export function syncSmallGroupEvidence(config, summary) {
  let section = "";
  try {
    const me = JSON.parse(window.localStorage.getItem("ewl-supports:v2:me") || "null");
    section = (me && !me.skipped && me.section) || "";
  } catch {
    section = "";
  }
  if (!section) return; // no class identity → stay fully private, send nothing

  const payload = {
    activityId: config.lessonId,
    activityTitle: config.title || "Small-Group Studio",
    standard: config.standard || "",
    studentName: "", // never sent from the small-group studio, by design
    section,
    events: [
      {
        type: "small_group_evidence",
        ...summary,
        // Coverage marker: one device, one report. This is the denominator any
        // aggregate of these numbers must be displayed against.
        reported: 1,
        at: new Date().toISOString(),
      },
    ],
  };

  try {
    window
      .fetch("/api/progress/telemetry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "omit",
      })
      .catch(() => {});
  } catch {
    /* offline / blocked — evidence is best-effort, never load-bearing */
  }
}

export default syncSmallGroupEvidence;
