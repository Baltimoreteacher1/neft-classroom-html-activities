// Verifier failure counts per block, shown in the reviewer queue and used by its `verifier` filter.
// Shape: { [verifierName]: { [blockId]: failureCount } }. A verifier name matches /^[a-z0-9][a-z0-9:_.-]*$/.
// The data is generated: the content verifiers run over every block and the publisher writes the error and warn counts
// (npm run content:verifier-counts). It is never edited by hand; npm run validate:content-verifier-counts fails when stale.
import counts from "../../functions/_lib/review-generated/verifier-counts.js";

export const VERIFIER_COUNTS = Object.freeze(counts);
