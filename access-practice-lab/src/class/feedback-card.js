// "Feedback from my teacher" in /class: the teacher's reviews of work this learner shared (review-queue.js). The
// chips read as the practice rubric's own descriptors, strengths first and one next step (acc/review/review.js
// studentFeedback), plus the teacher's comment. Never a number, a score or a level.
import { studentFeedback } from "../acc/review/review.js";
import { loadIntel, saveIntel } from "../intel/loop.js";
import { applyTeacherReviews, decodeDecision } from "../intel/review.js";
import { BASE } from "../util.js";
import { el } from "./dom.js";
import { loadRubric } from "./review-queue.js";

/** Load this learner's reviews; [] when the call fails or the class has none. */
export async function loadMyReviews(api, link) {
  const res = await api.reviewMine(link);
  if (!res.ok) return [];
  // A review of a shared Language coach loop is also written into that loop, where it wins over the suggestion.
  const intel = loadIntel();
  if (applyTeacherReviews(intel, res.reviews || [])) saveIntel(intel);
  return res.reviews || [];
}

export async function feedbackCard(S, reviews) {
  const card = el(
    "section",
    { class: "cls-card", "aria-labelledby": "clsFbH" },
    el(
      "h2",
      { id: "clsFbH" },
      S("Feedback from my teacher", "Comentarios de mi maestro o maestra"),
    ),
  );
  if (!reviews.length) {
    card.append(
      el(
        "p",
        {},
        S(
          "No feedback yet. Send a recording from Speaking or a finished piece from Writing to your teacher.",
          "Todavía no hay comentarios. Envía a tu maestro o maestra una grabación desde Hablar o un texto terminado desde Escribir.",
        ),
      ),
    );
    return card;
  }
  card.append(
    el(
      "p",
      { class: "fine" },
      S(
        "Practice feedback from your teacher. It is not an ACCESS score or level.",
        "Comentarios de práctica de tu maestro o maestra. No es un puntaje ni un nivel de ACCESS.",
      ),
    ),
  );
  for (const r of reviews) {
    const rubric = await loadRubric(r.rubric);
    const fb = rubric
      ? studentFeedback(
          { shared: true, ratings: r.chips || {}, note: r.comment, reviewedAt: r.reviewedAt },
          rubric,
        )
      : null;
    const kind = r.kind === "recording" ? S("Recording", "Grabación") : S("Writing", "Escritura");
    // A Language coach loop carries the teacher's decision at the start of the comment (intel/review.js).
    const d = decodeDecision(r.comment);
    const decided = {
      accept: S("Your teacher agrees with the next step you were given.", "Tu maestro o maestra está de acuerdo con el siguiente paso que recibiste."),
      replace: S("Your teacher gave you this next step:", "Tu maestro o maestra te dio este siguiente paso:"),
      again: S("Your teacher asks you to try this task again.", "Tu maestro o maestra te pide que intentes esta tarea otra vez."),
    }[d.decision];
    card.append(
      el(
        "article",
        { class: "cls-note", "data-review": r.itemId },
        el("h3", {}, `${kind}: ${r.label || ""}`),
        fb?.strengths.length
          ? [
              el("h4", {}, S("What you showed", "Lo que mostraste")),
              el(
                "ul",
                { lang: "en" },
                fb.strengths.map((x) => el("li", {}, el("strong", {}, `${x.label}: `), x.text)),
              ),
            ]
          : null,
        fb?.nextStep
          ? [
              el("h4", {}, S("A next step", "Un siguiente paso")),
              el("p", { lang: "en" }, el("strong", {}, `${fb.nextStep.label}: `), fb.nextStep.text),
            ]
          : null,
        decided ? el("p", { "data-intel-decision": d.decision }, decided) : null,
        d.comment ? el("blockquote", { class: "cls-writing" }, d.comment) : null,
        d.next
          ? el(
              "p",
              {},
              el("a", { class: "btn small", href: `${BASE}${d.next}` }, S("Open the activity your teacher chose", "Abrir la actividad que eligió tu maestro o maestra")),
            )
          : null,
      ),
    );
  }
  return card;
}
