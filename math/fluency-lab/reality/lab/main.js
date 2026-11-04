// Reality Lab entry: read the link, then open the hub or one experience.
import { experienceById, experienceForSkill } from "./catalog.js";
import { mountHub } from "./hub.js";
import { loadGrade } from "../storage.js";
import { mountFamily } from "./family.js";
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

if (params.has("family")) mountFamily(root, { expId: params.get("family"), grade });
else if (params.get("teacher") === "1") {
  // A file named "teacher" is refused to anyone not signed in as a teacher, so it is loaded on demand and never statically.
  const teacher = await import("./teacher.js").catch(() => null);
  if (teacher) teacher.mountTeacher(root, { grade });
  else {
    document.title = "Teacher view | EduWonderLab Math Reality Lab";
    root.className = "mr-app";
    const h1 = document.createElement("h1");
    h1.textContent = "The teacher view needs a teacher sign-in";
    const p = document.createElement("p");
    p.textContent = "Open the teacher tools and sign in, then come back to this page. Students can use every activity from the Reality Lab home.";
    const a = document.createElement("a");
    a.className = "mr-btn is-primary";
    a.href = `./?grade=${grade}`;
    a.textContent = "Back to the Reality Lab";
    const wrap = document.createElement("main");
    wrap.className = "mr-hub-main";
    wrap.append(h1, p, a);
    root.replaceChildren(wrap);
  }
}
else if (exp) {
  const input = params.get("a") && params.get("b") && params.get("r") ? { a: params.get("a"), b: params.get("b"), response: params.get("r") } : null;
  mountWorkspace(root, { exp, grade, input, restart,
    preview: params.get("preview") === "1", skillKey: skill && skill.includes(":") ? skill : null, hubHref: `./?grade=${grade}` });
} else mountHub(root, { grade });
