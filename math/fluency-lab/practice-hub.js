// Practice destination: one dominant next step, then the other ways to practice.
export function renderPracticeHub(host, { resume, openMistakes, t }) {
  const card = (attr, title, body, primary) =>
    `<button type="button" class="${primary ? "primary-action" : "outline-action"} practice-hub-card" ${attr}><strong>${title}</strong><span>${body}</span></button>`;
  const daily = card("data-start-daily", t("Today's 10"), t("Ten questions picked from what you need next."), !resume);
  const resumeCard = resume
    ? card("data-resume-practice", t("Keep going"), t("Pick up {title} where you left off.", { title: resume.title }), true)
    : "";
  const checkup = card("data-start-checkup", t("Quick check-up"), t("A short set that shows what to practice next."), false);
  const mistakes = card(
    'data-view="notebook"',
    t("Fix my mistakes"),
    openMistakes ? t("{n} to look at again.", { n: openMistakes }) : t("Nothing to fix right now."),
    false,
  );
  const skills = card('data-view="library"', t("Choose a skill"), t("Browse every skill for your grade."), false);
  host.innerHTML = `<h2 class="practice-hub-title">${t("Practice")}</h2><div class="practice-hub-grid">${resumeCard}${daily}${checkup}${mistakes}${skills}</div>`;
}
