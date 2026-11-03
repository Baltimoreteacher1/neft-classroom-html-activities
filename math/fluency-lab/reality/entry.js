// How the Lab's Home and Practice screens point into Math Reality: one link, labelled by what this learner has done.
import { missionFor } from "./engine.js";
import { loadSave } from "./storage.js";

// "new" (nothing started), "continue" (a mission in progress), or "again" (this grade's mission is finished).
export function realityStatus(grade, save = loadSave()) {
  const mission = missionFor("stadium", grade);
  const session = mission && save.worlds.stadium?.sessions?.[mission.id];
  if (!session) return "new";
  return session.step === "done" ? "again" : "continue";
}

export const realityHref = (grade) => `reality/?grade=${grade}`;

export function mountRealityEntry(card, grade, t) {
  const link = card?.querySelector("[data-reality-link]");
  if (!link) return;
  const status = realityStatus(grade);
  link.href = realityHref(grade);
  link.textContent = status === "continue" ? t("Continue your world") : status === "again" ? t("Build another world") : t("Open Math Reality");
}
