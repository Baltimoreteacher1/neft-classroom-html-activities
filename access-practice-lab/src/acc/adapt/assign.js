// Assignment builder logic. Picks bank items by the teacher's filters, spread across source sets so a short assignment is not
// one passage's questions. Deterministic for the same inputs. An assignment is only a list of item ids plus a mode: it is opened
// by link on the student's device or printed. Nothing here delivers anything to anyone.
export const KINDS = Object.freeze({
  domain: { label: "One domain", needs: ["domain"] },
  mixed: { label: "Mixed domains", needs: [] },
  context: { label: "One academic context", needs: ["context"] },
  klu: { label: "One key language use", needs: ["klu"] },
  targeted: { label: "A language function", needs: ["fn"] },
  simulation: { label: "A full test simulation (one set)", needs: ["setId"], mode: "summative" },
  supported: { label: "Supported practice (Learning mode)", needs: [], mode: "formative" },
});
export const MAX_ITEMS = 24;

export function validateSpec(spec) {
  const errors = [];
  const kind = KINDS[spec.kind];
  if (!kind) return { ok: false, errors: ["Choose an assignment type."] };
  for (const n of kind.needs) if (!spec[n]) errors.push(`Choose a value for ${n === "fn" ? "language function" : n === "setId" ? "set" : n}.`);
  if (spec.kind !== "simulation" && !(spec.count >= 1 && spec.count <= MAX_ITEMS)) errors.push(`Number of questions must be 1 to ${MAX_ITEMS}.`);
  return { ok: !errors.length, errors };
}

export function selectItems(bank, spec) {
  const { kind, grade, domain, context, klu, fn, setId, band } = spec;
  let pool = bank.filter((i) => (!grade || i.grade === grade) && (!band || i.band === band) && (spec.includeProductive || !["speaking-response", "constructed-response"].includes(i.type)));
  if (kind === "simulation") return bank.filter((i) => i.setId === setId).map((i) => ({ setId: i.setId, itemId: i.id }));
  if (kind === "domain") pool = pool.filter((i) => i.domain === domain);
  if (kind === "context") pool = pool.filter((i) => (i.context || "Social and Instructional") === context);
  if (kind === "klu") pool = pool.filter((i) => i.klu === klu);
  if (kind === "targeted") pool = pool.filter((i) => (i.functions || []).includes(fn));
  const bySet = new Map();
  for (const i of pool) (bySet.get(i.setId) || bySet.set(i.setId, []).get(i.setId)).push(i);
  const lists = [...bySet.keys()].sort().map((k) => bySet.get(k));
  const out = [];
  for (let round = 0; out.length < spec.count && lists.some((l) => l[round]); round++) for (const l of lists) if (l[round] && out.length < spec.count) out.push({ setId: l[round].setId, itemId: l[round].id });
  return out;
}

export const modeFor = (spec) => KINDS[spec.kind]?.mode || (spec.mode === "summative" ? "summative" : "formative");

export function assignmentLink(base, spec, picks) {
  const title = (spec.title || "Practice assignment").slice(0, 80);
  if (spec.kind === "simulation") return `${base}/assess/${encodeURIComponent(spec.setId)}?mode=summative`;
  return `${base}/assess/custom?mode=${modeFor(spec)}&title=${encodeURIComponent(title)}&ids=${picks.map((p) => `${p.setId}:${p.itemId}`).join(",")}`;
}
