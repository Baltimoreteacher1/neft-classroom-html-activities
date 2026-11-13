// Legacy stage ids in shared links: learn→see, try→try, practice→practice. Its own module so the first screen can
// read a link's stage without loading the skill screen.
export const stageFromParam = (value) =>
  ({ learn: "see", try: "try", practice: "practice", see: "see" })[value] || "see";
