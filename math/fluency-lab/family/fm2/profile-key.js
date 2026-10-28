// The one definition of how a per-learner storage key is built: learner 0 keeps the bare key, the others add a suffix.
// Lives here (not in school-tools.js) so light pages can name a key without loading the legacy school tools.
export const profileKey = (base, id) => (id === 0 ? base : `${base}:profile-${id}`);
