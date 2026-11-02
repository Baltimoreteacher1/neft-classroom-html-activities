// Data to instruction (Phase 6E): turns what the Teacher Hub's class model found into a concrete, short lesson plan built
// only from authored bank items and the misconception library. For each skill flagged for reteaching it proposes a launch
// problem, guided practice and an exit check; for each shared answer pattern it proposes the library's counter-example and
// items the authors tagged for that slip. It suggests; the teacher decides.
import { misconceptionById } from "./misconception-library.js";
import { discoursePrompts } from "./instruction-engine.js";
import { findSkill } from "../tutor-engine.js";

const bi = (en, es) => ({ en, es });
const byDok = (items, dok) => items.filter((i) => i.dok === dok);
const take = (items, n, used) => {
  const out = [];
  for (const it of items) {
    if (out.length >= n) break;
    if (used.has(it.id)) continue;
    used.add(it.id);
    out.push(it);
  }
  return out;
};

export function planFromClass(model, bank, { grade = model?.grade } = {}) {
  const used = new Set();
  const forGrade = bank.filter((i) => i.grade === Number(grade));
  const reteach = (model?.reteach || []).map((r) => {
    // Items written for this exact skill come first. If there are too few, items for the same standard fill in.
    const standard = String(findSkill(r.key)?.formerStandard || "").replace(/\.[a-d]$/, "");
    const exact = forGrade.filter((i) => i.skill === r.key);
    const items = exact.length >= 4 || !standard ? exact : exact.concat(forGrade.filter((i) => i.skill !== r.key && String(i.standard).replace(/\.[a-d]$/, "") === standard));
    const launch = take(byDok(items, 1).concat(byDok(items, 2)), 1, used);
    const guided = take(byDok(items, 2).concat(byDok(items, 1)), 3, used);
    const exit = take(byDok(items, 2).concat(byDok(items, 3)), 2, used);
    return {
      key: r.key,
      title: r.title,
      learners: r.needing,
      reason: r.reason,
      launch: launch.map((i) => i.id),
      guided: guided.map((i) => i.id),
      exit: exit.map((i) => i.id),
      discourse: launch[0] ? discoursePrompts(launch[0]) : [],
      note: items.length ? null : bi("The bank has no items written for this exact skill yet. Use the skill's own practice, then check back as the bank grows.", "El banco todavía no tiene ejercicios para esta destreza exacta. Usa la práctica propia de la destreza y vuelve a mirar cuando el banco crezca."),
    };
  });
  const patterns = (model?.clusters || [])
    .map((c) => {
      const info = misconceptionById(c.id);
      if (!info) return null;
      const items = take(forGrade.filter((i) => i.misconceptions?.includes(c.id)), 3, new Set());
      return { id: c.id, learners: c.learners, title: info.title, does: info.does, counter: info.counter, idea: info.idea, models: info.models, items: items.map((i) => i.id) };
    })
    .filter(Boolean);
  return { grade: Number(grade), reteach, patterns };
}
