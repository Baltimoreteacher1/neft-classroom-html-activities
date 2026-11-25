// Verifier failure counts per block, shown in the reviewer queue and used by its `verifier` filter.
// Shape: { [verifierName]: { [blockId]: failureCount } }. A verifier name matches /^[a-z0-9][a-z0-9:_.-]*$/.
// Content verifiers ratchet real findings against committed baselines; this table is where a baseline's
// per-block counts are published to the queue. It is data, regenerated from those baselines, never edited
// by hand. Empty means no verifier has published per-block counts yet.
export const VERIFIER_COUNTS = Object.freeze({});
