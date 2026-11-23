// Vocabulary Academy — a unit's saved work: progress.unitWork[<gK-unitN>] = { crossword, test, <extra id>: {…} }.
export const workOf = (progress, gid) => {
  progress.unitWork =
    progress.unitWork && typeof progress.unitWork === "object" ? progress.unitWork : {};
  return (progress.unitWork[gid] ||= {});
};
