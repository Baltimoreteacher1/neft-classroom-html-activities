// Rules for K–3 band activities, shared by tools/validate-access-lab.mjs and the tests.
import { SCENES } from "../../access-practice-lab/src/early/scenes.js";

/**
 * K–3 activities run in the audio-first player (access-practice-lab/src/early/player.js): every direction is spoken
 * in English and Spanish, every choice is a picture, Speaking has an age-matched model student and Writing is
 * done on paper.
 */
export function earlyProblems(a, domain) {
  const out = [];
  if (!a.directionsEs)
    out.push("early-band activity needs directionsEs (spoken Spanish direction)");
  if (a.prompt && !a.promptEs) out.push("early-band activity needs promptEs");
  for (const id of [
    a.scene,
    ...(a.options || []).map((o) => o.scene),
    ...(a.items || []).map((o) => o.scene),
  ])
    if (id && !SCENES.includes(id)) out.push(`unknown scene "${id}"`);
  if (["multipleChoice", "multiSelect"].includes(a.type))
    for (const o of a.options || [])
      if (!o.visual && !o.scene) out.push(`option ${o.id} needs a picture (visual or scene)`);
  if (a.type === "order")
    for (const o of a.items || [])
      if (!o.visual && !o.scene) out.push(`order item ${o.id} needs a picture (visual or scene)`);
  if (!["multipleChoice", "multiSelect", "order", "constructed", "worksheet"].includes(a.type))
    out.push(`type ${a.type} has no audio-first presentation`);
  if (domain === "Speaking" && (!a.modelStudent?.name || !a.modelStudent?.text))
    out.push("Speaking needs modelStudent {name, text}");
  if (domain === "Speaking" && a.taskLevel != null && ![1, 3].includes(a.taskLevel))
    out.push("taskLevel must be 1 or 3");
  if (domain === "Writing" && !(a.wordBank || []).length) out.push("Writing needs a wordBank");
  if (domain === "Listening" && /look at the (?:words|text)/i.test(`${a.directions} ${a.prompt}`))
    out.push("pre-reader Listening must not ask the child to read");
  return out;
}
