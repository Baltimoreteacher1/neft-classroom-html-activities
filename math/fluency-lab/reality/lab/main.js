// Reality Lab entry: read the link, then open the hub or one experience.
import { experienceById, experienceForSkill } from "./catalog.js";
import { mountHub } from "./hub.js";
import { loadGrade } from "../storage.js";
import { mountWorkspace } from "./workspace.js";

const params = new URLSearchParams(location.search);
const root = document.getElementById("mr-app");
const rawGrade = params.get("grade");
const grade = rawGrade !== null && Number.isInteger(Number(rawGrade)) && Number(rawGrade) >= 0 && Number(rawGrade) <= 8 ? Number(rawGrade) : loadGrade(location.search);

const skill = params.get("skill");
let expId = params.get("x");
if (!expId && skill) {
  const [g, id] = skill.split(":");
  expId = experienceForSkill(Number(g), id) ?? null;
}
const exp = expId ? experienceById(expId) : null;

// A "start again" link restarts once. Dropping the flag means a reload resumes the saved work instead of wiping it.
const restart = params.get("restart") === "1";
if (restart) {
  params.delete("restart");
  const query = params.toString();
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
}

if (exp) {
  const input = params.get("a") && params.get("b") && params.get("r") ? { a: params.get("a"), b: params.get("b"), response: params.get("r") } : null;
  mountWorkspace(root, { exp, grade, input, restart, skillKey: skill && skill.includes(":") ? skill : null, hubHref: `./?grade=${grade}` });
} else mountHub(root, { grade });
