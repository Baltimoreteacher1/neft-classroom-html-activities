// Provider boundary for speaking practice. Production has no cloud transcription or AI adapter.
// The only active feedback provider runs the existing deterministic analyzer in this browser.
import { analyzeResponse } from "./analyze.js";

export const LOCAL_FEEDBACK_MODEL_VERSION = "access-language-rules-1";
export const LOCAL_FEEDBACK_PROMPT_VERSION = "speaking-practice-rubric-2026-10-23.1";

export class LocalFeedbackProvider {
  constructor(analyze = analyzeResponse) { this.analyze = analyze; }
  evaluateSpeaking(response, rubric, context = {}) {
    if (typeof response !== "string" || response.length > 20_000) throw new TypeError("Speaking response is invalid.");
    const analysis = this.analyze(response, { ...context, rubric });
    if (!analysis || typeof analysis !== "object" || !Array.isArray(analysis.nextMoves) || !Array.isArray(analysis.strengths)) throw new TypeError("Local speaking feedback did not match the expected schema.");
    return { analysis, feedbackSource: "local-rule", modelVersion: LOCAL_FEEDBACK_MODEL_VERSION, promptVersion: LOCAL_FEEDBACK_PROMPT_VERSION, confidence: "rule-based; not a probability" };
  }
}

export class UnconfiguredTranscriptionProvider {
  async transcribe(_audio, _options = {}) {
    return { status: "not-configured", transcript: null, confidence: null, modelVersion: null, needsTeacherReview: true };
  }
}

/** Explicit test/development adapter. It accepts only labeled synthetic fixtures. */
export class SyntheticTranscriptionProvider {
  constructor({ transcript } = {}) {
    if (typeof transcript !== "string" || !transcript.startsWith("[SYNTHETIC]")) throw new TypeError("Mock transcription must be clearly labeled synthetic.");
    this.transcript = transcript;
  }
  async transcribe() {
    return { status: "ok", transcript: this.transcript, confidence: 1, modelVersion: "synthetic-mock-1", synthetic: true };
  }
}
