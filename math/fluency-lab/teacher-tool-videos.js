// fl-teacher: "Video for a skill" tool in the Class tools tab. The teacher pastes an https link (English, Spanish or
// both) for each skill and shares one link; opening it saves the videos on that device (skill-videos.js).
import { t } from "./i18n.js";
import { ALL_SKILLS, GRADES } from "./problem-bank.js";
import { esc } from "./reports-export.js";
import { MAX_VIDEOS, cleanVideoUrl, videosUrl } from "./skill-videos.js";

const keyOf = (skill) => `${skill.grade}:${skill.id}`;

function html(state) {
  const skills = ALL_SKILLS.filter((skill) => skill.grade === state.grade);
  const href = videosUrl(state.videos);
  const entries = Object.entries(state.videos);
  const title = (key) => ALL_SKILLS.find((skill) => keyOf(skill) === key)?.title || key;
  return `<section class="t4-section" aria-labelledby="tt-video-title"><h3 id="tt-video-title">${esc(t("Your video for a skill"))}</h3>
    <p class="t4-hint">${esc(t("Paste a link to your own video (it must start with https://). Learners who open the link you share see it in the skill's Learn panel, in English, Español or both."))}</p>
    <form class="t4-form" data-tt-video novalidate>
      <div class="t4-row"><label>${esc(t("Grade"))}<select name="grade">${GRADES.map((g) => `<option value="${g.grade}" ${g.grade === state.grade ? "selected" : ""}>${esc(g.label)}</option>`).join("")}</select></label>
        <label>${esc(t("Skill"))}<select name="skill">${skills.map((skill) => `<option value="${keyOf(skill)}" ${keyOf(skill) === state.skill ? "selected" : ""}>${esc(skill.title)}</option>`).join("")}</select></label></div>
      <label>${esc(t("Video link in English"))}<input name="en" type="url" inputmode="url" autocomplete="off" placeholder="https://" value="${esc(state.en)}"></label>
      <label>${esc(t("Video link in Spanish"))}<input name="es" type="url" inputmode="url" autocomplete="off" placeholder="https://" value="${esc(state.es)}"></label>
      <p class="t4-error" role="alert">${esc(state.error)}</p>
      <div class="t4-actions"><button type="submit" class="fl-btn fl-btn--teal">${esc(t("Add video"))}</button></div></form>
    ${entries.length ? `<ul class="t4-list">${entries.map(([key, links]) => `<li class="t4-item"><div class="t4-item-head"><h4>${esc(title(key))}</h4><button type="button" class="fl-btn fl-btn--ghost" data-tt-video-remove="${esc(key)}">${esc(t("Remove"))}</button></div><p class="t4-hint">${[links.en ? "English" : "", links.es ? "Español" : ""].filter(Boolean).join(" · ")}</p></li>`).join("")}</ul>` : ""}
    ${href ? `<label>${esc(t("Link to share with your class"))}<span class="t4-copy"><input id="tt-video-link" readonly value="${esc(href)}"><button type="button" class="fl-btn fl-btn--ghost" data-tt-copy="tt-video-link">${esc(t("Copy"))}</button></span></label>` : `<p class="t4-hint">${esc(t("Add at least one video to get a link."))}</p>`}</section>`;
}

export function mountVideoTool(host, { announce } = {}) {
  const first = ALL_SKILLS.find((skill) => skill.grade === 3) || ALL_SKILLS[0];
  const state = { grade: first.grade, skill: keyOf(first), en: "", es: "", error: "", videos: {} };
  const render = () => {
    host.innerHTML = html(state);
  };
  host.addEventListener("change", (event) => {
    const form = event.target.closest("[data-tt-video]");
    if (!form) return;
    const data = new FormData(form);
    state.en = String(data.get("en") ?? "");
    state.es = String(data.get("es") ?? "");
    if (event.target.name === "en" || event.target.name === "es") return; // typing never redraws the form
    if (event.target.name === "grade") {
      state.grade = Number(data.get("grade"));
      state.skill = keyOf(ALL_SKILLS.find((skill) => skill.grade === state.grade));
    } else state.skill = String(data.get("skill"));
    state.error = "";
    render();
    host.querySelector(`[name=${event.target.name}]`)?.focus();
  });
  host.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-tt-video]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    state.en = String(data.get("en") ?? "");
    state.es = String(data.get("es") ?? "");
    const en = cleanVideoUrl(state.en);
    const es = cleanVideoUrl(state.es);
    if ((state.en.trim() && !en) || (state.es.trim() && !es))
      state.error = t("Use a link that starts with https://");
    else if (!en && !es) state.error = t("Paste at least one video link.");
    else if (!state.videos[state.skill] && Object.keys(state.videos).length >= MAX_VIDEOS)
      state.error = t("A link holds up to {n} videos.", { n: MAX_VIDEOS });
    else {
      state.videos[state.skill] = { ...(en ? { en } : {}), ...(es ? { es } : {}) };
      state.en = "";
      state.es = "";
      state.error = "";
      announce?.(t("Video added."));
    }
    render();
  });
  host.addEventListener("click", (event) => {
    const key = event.target.closest("[data-tt-video-remove]")?.dataset.ttVideoRemove;
    if (!key) return;
    delete state.videos[key];
    render();
    announce?.(t("Video removed."));
  });
  render();
  return { refresh: render };
}
