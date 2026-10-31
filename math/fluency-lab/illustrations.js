// Illustration API (owner: agent "art"). This stub only fixes the signatures so other modules can import them;
// the art agent replaces every body. Every function returns an SVG string. `decorative: true` adds aria-hidden;
// otherwise the SVG has role="img" and a <title>. `idPrefix` keeps ids unique when several SVGs share a page.
const frame = (label, { decorative = false, size = 96 } = {}) =>
  `<svg viewBox="0 0 96 96" width="${size}" height="${size}" ${decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label}"`}><rect x="8" y="8" width="80" height="80" rx="16" fill="#dff3f1" stroke="#17324d" stroke-width="3"/></svg>`;

export const skillArt = (skill, options) => frame(skill?.title || "Skill", options);
export const strandArt = (strand, options) => frame(String(strand || "Strand"), options);
export const gradeArt = (grade, options) => frame(`Grade ${grade}`, options);
export const headerArt = (kind = "dashboard", options) => frame(kind, options);
export const pathwayArt = (steps = [], options) => frame("Learning pathway", options);
export const badgeArt = (id, options) => frame(String(id), options);
export const BADGE_IDS = Object.freeze([]);
export const milestoneArt = (level = 1, options) => frame(`Milestone ${level}`, options);
export const certificateFrame = (options) => frame("Certificate", options);
export const emptyStateArt = (kind = "start", options) => frame(kind, options);
export const onboardingArt = (step = 1, options) => frame(`Step ${step}`, options);
export const reportHeaderArt = (kind = "student", options) => frame(kind, options);
export const familyArt = (kind = "home", options) => frame(kind, options);
