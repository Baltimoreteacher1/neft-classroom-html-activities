// Student-side view of teacher feedback shared on THIS device. Shows strengths first and one next step, in the rubric's own
// words. It never shows a number, a score, a level or a rank, and says plainly that it is classroom practice feedback.
import { h } from "../engine/dom.js";
import { REVIEW_PREFIX, studentFeedback } from "./review.js";

export async function renderTeacherFeedback({ doc = document, getStorage }) {
  const el = h(doc, "section", { class: "acc-teacher-feedback", "aria-labelledby": "accTfTitle" });
  let reviews = [];
  try {
    const store = await getStorage();
    const learner = await store.learnerId();
    const settings = await store._all("settings");
    reviews = settings.filter((s) => s.key.startsWith(REVIEW_PREFIX) && s.key.slice(REVIEW_PREFIX.length).startsWith(`${learner}|`) && s.value?.shared).map((s) => ({ key: s.key.slice(REVIEW_PREFIX.length), review: s.value }));
    const rubrics = new Map();
    const cards = [];
    for (const { key, review } of reviews.sort((a, b) => b.review.reviewedAt - a.review.reviewedAt)) {
      if (!rubrics.has(review.rubric)) rubrics.set(review.rubric, await (await fetch(`/access-practice-lab/content/rubrics/${review.rubric}.json`)).json());
      const fb = studentFeedback(review, rubrics.get(review.rubric));
      if (!fb) continue;
      const itemId = key.split("|")[2];
      cards.push(h(doc, "article", { class: "acc-card acc-tf-card", "data-evidence": "teacher-reviewed" },
        h(doc, "p", { class: "acc-hint", text: `${review.rubric === "speaking-practice" ? "Speaking" : "Writing"} practice · reviewed ${new Date(fb.reviewedAt).toLocaleDateString()}` }),
        fb.strengths.length ? h(doc, "div", {}, h(doc, "h3", { text: "What you showed" }), h(doc, "ul", {}, ...fb.strengths.map((x) => h(doc, "li", { "data-i18n-skip": "" }, h(doc, "strong", { text: x.label + ": " }), x.text)))) : null,
        fb.nextStep ? h(doc, "div", {}, h(doc, "h3", { text: "A next step" }), h(doc, "p", { "data-i18n-skip": "" }, h(doc, "strong", { text: fb.nextStep.label + ": " }), `Aim for this: ${fb.nextStep.text}`)) : null,
        fb.note ? h(doc, "blockquote", { lang: "en", class: "acc-tf-note" }, fb.note) : null,
        h(doc, "p", { class: "acc-visually-hidden", text: itemId })));
    }
    if (!cards.length) return null;
    el.append(h(doc, "h2", { id: "accTfTitle", text: "Feedback from your teacher" }), h(doc, "p", { class: "acc-hint", text: "This is practice feedback from your teacher on work saved on this device. It is not a WIDA or ACCESS score or level." }), ...cards);
    return el;
  } catch {
    return null;
  }
}
