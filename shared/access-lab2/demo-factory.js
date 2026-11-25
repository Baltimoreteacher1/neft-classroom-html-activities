// Builders for the synthetic demo items: one place for the item shape so the four domain files stay data.
export const DEMO_NOTICE =
  "Synthetic demo items for tests. Not a practice bank. Not official content.";

export const PROV = Object.freeze({
  origin: "authored",
  generator: null,
  generatedAt: "2026-11-25",
  sourceRefs: [],
  version: 1,
  supersedes: null,
  contentHash: null,
});
const LETTERS = "abcdefgh";
export const opts = (...texts) => texts.map((text, i) => ({ id: LETTERS[i], text }));
export const steps = (...texts) => texts.map((text, i) => ({ id: LETTERS[i], text }));
export const crit = (...labels) => labels.map((label, i) => ({ id: `c${i + 1}`, label }));
export const DEVICE = { storage: "device", maxTakes: 3 };

export const SPEAK_CHECK = crit(
  "I did what the prompt asked.",
  "I told my ideas in an order that makes sense.",
  "I used details or reasons.",
  "I spoke clearly so a listener could follow me.",
);
export const WRITE_CHECK = crit(
  "I did what the task asked.",
  "My ideas are in an order that makes sense.",
  "I used details or reasons.",
  "My sentences start with a capital letter and end with a period.",
);

export const key = (letter) => ({ type: "key", key: letter });

function make(o) {
  const slug = o.domain.toLowerCase();
  const stimKind = o.stimKind ?? (o.domain === "Listening" ? "audio" : "text");
  return {
    id: o.id,
    domain: o.domain,
    band: o.band,
    gradeBand: "3-5",
    kluTags: [o.klu],
    standardTags: [o.std],
    task: {
      type: o.type,
      stimulus: { id: `${o.id}-s`, kind: stimKind, text: o.text, cluster: "3-5" },
      prompt: o.prompt,
    },
    response: o.response,
    scoring: o.scoring,
    supports: {
      audio: o.domain === "Listening",
      images: o.images ?? [],
      glossary: o.glossary ?? [],
      ttsAllowed: true,
    },
    provenance: { ...PROV },
    reviewState: "draft",
    reviewers: [],
    exercises: [`${slug}.${o.klu.toLowerCase()}`, `${slug}.${o.type}`],
  };
}

export const select = (options, answer) => ({
  response: { mode: "select", constraints: { options } },
  scoring: key(answer),
});

export const L = (id, band, klu, std, type, text, prompt, rest) =>
  make({ id, domain: "Listening", band, klu, std, type, text, prompt, ...rest });
export const R = (id, band, klu, std, type, text, prompt, rest) =>
  make({ id, domain: "Reading", band, klu, std, type, text, prompt, ...rest });
export const S = (id, band, klu, std, type, text, prompt, rest = {}) =>
  make({
    id,
    domain: "Speaking",
    band,
    klu,
    std,
    type,
    text,
    prompt,
    response: { mode: "record", constraints: { ...DEVICE } },
    scoring: { type: "selfcheck", rubric: SPEAK_CHECK },
    ...rest,
  });
export const W = (id, band, klu, std, type, text, prompt, rest) =>
  make({ id, domain: "Writing", band, klu, std, type, text, prompt, ...rest });
export const typed = (constraints) => ({
  response: { mode: "type", constraints },
  scoring: { type: "selfcheck", rubric: WRITE_CHECK },
});
export const picture = (id, alt) => ({ stimKind: "image", images: [{ id, alt }] });
