// MathSense boot: one exact state, one saved record, one live region. Each module draws from `app.state` and changes it
// only through `app.change`, so the four pictures, the boxes and the statements always agree.
import { getLang, setLang, t } from "../i18n.js";
import { announce } from "./announce.js";
import { missionById } from "./missions.js";
import { deserialize, initialState, serialize } from "./model.js";
import { liveMessage } from "./readouts.js";
import { load, profileId, save } from "./store.js";
import { mountMissions } from "./ui-missions.js";
import { mountNotice } from "./ui-notice.js";
import { mountWorkspace } from "./ui-workspace.js";

const profile = profileId();
const params = new URLSearchParams(location.search);
if (params.get("lang") === "es" || params.get("lang") === "en")
  setLang(params.get("lang"), { persist: false });

const app = {
  profile,
  record: load(profile),
  state: initialState(),
  announce,
  save() {
    this.record = { ...this.record, workspace: serialize(this.state) };
    const stored = save(this.record, profile);
    const note = document.getElementById("ms-storage");
    note.hidden = stored;
    note.textContent = stored
      ? ""
      : t("This device could not save your work. It stays here until you leave the page.");
  },
  change(next, label, { announce: say = true } = {}) {
    this.state = next;
    this.save();
    renderAll();
    if (say) announce(liveMessage(next, label));
  },
  reset() {
    this.change(initialState(), t("Workspace reset."));
  },
};
app.state = deserialize(app.record.workspace);
const linked = params.get("mission");
if (linked && missionById(linked)) app.record = { ...app.record, open: linked };

function translateStatic() {
  document.documentElement.lang = getLang();
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.dataset.i18nEn ||= el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = t(el.dataset.i18nEn);
  }
  const nudge = {
    "bar:-1": t("One piece less"),
    "bar:1": t("One piece more"),
    "grid:-1": t("One hundredth less"),
    "grid:1": t("One hundredth more"),
    "percent:-1": t("One percent less"),
    "percent:1": t("One percent more"),
  };
  for (const el of document.querySelectorAll("[data-nudge]"))
    el.setAttribute("aria-label", nudge[el.dataset.nudge]);
  const button = document.getElementById("ms-lang");
  button.textContent = getLang() === "es" ? "English" : "Español";
  button.lang = getLang() === "es" ? "en" : "es";
  document.title = `MathSense | ${t("EduWonderLab Math Fluency Lab")}`;
}

const workspace = mountWorkspace(app);
const missions = mountMissions(app);
const notice = mountNotice(app);

function renderAll() {
  translateStatic();
  workspace.render();
  missions.render();
  notice.render();
}

document.getElementById("ms-lang").addEventListener("click", () => {
  setLang(getLang() === "es" ? "en" : "es");
  workspace.clearErrors();
  renderAll();
  announce(getLang() === "es" ? t("Language: Spanish.") : t("Language: English."), { delay: 60 });
});

if (app.record.open) notice.setTopic(missionById(app.record.open).topic);
renderAll();
document.documentElement.dataset.msReady = "1";
