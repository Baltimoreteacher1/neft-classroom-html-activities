// Release switches for ACCESS Lab Intelligence. Provider-dependent paths stay off until a reviewed
// provider, authorization model, consent flow, and retention behavior are configured.
export const ACCESS_LAB_FLAGS = Object.freeze({
  skillGraphEnabled: true,
  speakingCoachV2Enabled: false,
  teacherDiagnosticsEnabled: true,
  instructionalGroupsEnabled: true,
  nextDayLessonsEnabled: true,
  contentProvenanceEnabled: true,
  dynamicScaffoldingEnabled: false,
  externalAiEnabled: false,
  transcriptionEnabled: false,
  // Local-only camera postcards are enabled: explicit capture, canvas re-encoding, 30-day local expiry and delete controls.
  cameraPostcardsEnabled: true,
});
