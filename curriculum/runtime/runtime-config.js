export const RUNTIME_CONFIG = Object.freeze({
  schemaVersion: 1,
  storagePrefix: "neft-classroom-runtime-v1",
  languages: Object.freeze([
    Object.freeze({ code: "en", label: "English", tutorValue: "" }),
    Object.freeze({ code: "es", label: "Español", tutorValue: "Spanish" }),
  ]),
  defaultLanguage: "en",
  data: Object.freeze({
    manifest: "/data/curriculum-launch-manifest.json",
    workflow: "/data/curriculum-teacher-workflow.json",
    supports: "/data/curriculum-supports.json",
  }),
  tutorEndpoint: "/api/tutor",
  maxEvidenceLength: 600,
});

export function isSupportedLanguage(code) {
  return RUNTIME_CONFIG.languages.some((language) => language.code === code);
}

export function normalizeLanguage(code) {
  return isSupportedLanguage(code) ? code : RUNTIME_CONFIG.defaultLanguage;
}

export function tutorLanguage(code) {
  return RUNTIME_CONFIG.languages.find((language) => language.code === normalizeLanguage(code))
    .tutorValue;
}

export function validateConfig(config = RUNTIME_CONFIG) {
  const codes = config.languages.map(({ code }) => code);
  const labels = config.languages.map(({ label }) => label);
  const errors = [];
  if (codes.join(",") !== "en,es") errors.push("Runtime languages must be exactly en,es.");
  if (labels.join(",") !== "English,Español") errors.push("Language labels changed unexpectedly.");
  if (!config.tutorEndpoint.startsWith("/")) errors.push("Tutor endpoint must be same-origin.");
  if (!config.storagePrefix) errors.push("Storage prefix is required.");
  return errors;
}

export function selfTest() {
  return validateConfig().length === 0 && normalizeLanguage("fr") === "en";
}
