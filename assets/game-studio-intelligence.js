/** Narrow ESM bridge for the classic GameStudio runtime. */
import {
  analyzeEvidence,
  decideInstruction,
  independentRecoveryCount,
  readInstructionalEvidence,
  recordInstructionalEvidence,
} from "../engine/core/instructional-intelligence.js";

const api = {
  analyzeEvidence,
  decideInstruction,
  independentRecoveryCount,
  readInstructionalEvidence,
  recordInstructionalEvidence,
};

globalThis.EWLInstructionalIntelligence = api;

export {
  analyzeEvidence,
  decideInstruction,
  independentRecoveryCount,
  readInstructionalEvidence,
  recordInstructionalEvidence,
};
