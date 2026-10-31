// Mini-lesson player API (owner: agent "lessons"). Stub only. Sequence: Learn It, Watch It, Try It, Explain It.
// config: { skill, grade, lang, supportLevel (1-4), onEvidence({correct, independent}), onDone({explained}) }
// handle: { destroy(), goTo(stepId) }
export function mountMiniLesson(container, _config) {
  container.textContent = "";
  return { destroy() {}, goTo() {} };
}
