// Visual register per audience (registers.css). One design system, three deliberate registers:
// students get the immersive default, teachers a calm and efficient workspace, families a warm and simple one.
const TEACHER = new Set(["launch", "lesson-builder", "experience-builder", "activity-studio", "classroom", "class", "class-teacher", "start", "site-guide", "publisher-demo", "units", "vocab-curriculum", "library", "tools", "privacy", "accessibility", "program"]);
const FAMILY = new Set(["family", "practice-together", "family-start"]);

/** "teacher" | "family" | "student" for a route view id. */
export const registerFor = (view) => (TEACHER.has(view) ? "teacher" : FAMILY.has(view) ? "family" : "student");
