// Family Guide (/family/bcpss and /family/bcpss/{unitId}): a bilingual guide a caregiver can use on a phone.
//   - no unit in the link -> grade / subject / unit chooser (never a blank page)
//   - a unit in the link  -> the full guide from /api/bcpss/family-guide/{unitId}

import { keepView } from "/bcpss-teachers/keep-view.js";
import { C } from "./family-copy.js";
import { renderDirectory } from "./family-directory.js";
import { guideHtml } from "./family-guide-page.js";
import { pageFlag } from "../../shared/flags/page-flag.js";
import { currentWeek, planKey } from "./family-plan-view.js";
import { progressInner } from "./family-view-do.js";
import { VIEWS, bi, canSpeak, speak, store } from "./family-util.js";

const LANG_KEY = "ewl:family:bcpss:lang";
const doneKey = (id) => `ewl:family:bcpss:done:${id}`;
const state = { unitId: "", view: "en", guide: null, done: [], dir: { grade: "", subject: "" }, planOn: false, week: 0, planDone: [] };
const db = store();

const root = () => document.getElementById("familyCardRoot");
const unitUrl = (id) => `${window.location.origin}/family/bcpss/${encodeURIComponent(id)}`;

function initialView(q) {
  const asked = q.get("lang");
  if (VIEWS.includes(asked)) return asked;
  const saved = db.get(LANG_KEY);
  if (VIEWS.includes(saved)) return saved;
  return /^es/i.test(navigator.languages?.[0] || navigator.language || "") ? "es" : "en";
}

function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const m = window.location.pathname.match(/^\/family\/bcpss\/([^/]+)\/?$/);
  state.unitId = m ? decodeURIComponent(m[1]) : q.get("unit") || q.get("unitId") || "";
  state.view = initialView(q);
  state.dir = { grade: q.get("grade") || "", subject: q.get("subject") || "" };
  const asked = Number.parseInt(q.get("week") || "", 10);
  state.week = Number.isInteger(asked) && asked >= 0 ? asked : currentWeek();
}

function writeUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.view);
  for (const key of ["grade", "subject"]) {
    if (!state.unitId && state.dir[key]) url.searchParams.set(key, state.dir[key]);
    else url.searchParams.delete(key);
  }
  history.replaceState(null, "", url.pathname + url.search);
}

/** Language chrome: data-view drives which language CSS shows; no page re-render. */
function applyView() {
  const h = document.documentElement;
  h.dataset.view = state.view;
  h.lang = state.view === "es" ? "es" : "en";
  for (const btn of document.querySelectorAll("[data-view-btn]")) {
    btn.setAttribute("aria-pressed", btn.dataset.viewBtn === state.view ? "true" : "false");
  }
  const title = state.guide ? `${state.guide.unit.title} · ${state.view === "es" ? C.brand.es : C.brand.en}` : `${C.dirTitle[state.view === "es" ? "es" : "en"]}`;
  document.title = title;
  writeUrl();
}

function setView(view) {
  state.view = view;
  db.set(LANG_KEY, view);
  applyView();
}

function showDirectory() {
  renderDirectory({
    root: root(),
    sel: state.dir,
    onSelect: (next) => {
      state.dir = next;
      writeUrl();
      keepView(root(), showDirectory);
    },
  });
}

function showGuide() {
  state.done = (db.get(doneKey(state.unitId), []) || []).filter(Number.isInteger);
  state.planDone = (db.get(planKey(state.unitId, state.week), []) || []).filter((id) => typeof id === "string");
  root().innerHTML = guideHtml(state.guide, state, unitUrl);
  const share = root().querySelector("[data-share]");
  if (share && navigator.share) share.hidden = false;
  const text = `${state.guide.unit.title} · ${C.brand.en} / ${C.brand.es}`;
  const wa = root().querySelector("[data-whatsapp]");
  if (wa) wa.href = `https://wa.me/?text=${encodeURIComponent(`${text} ${unitUrl(state.unitId)}`)}`;
}

function toast(message) {
  const el = document.getElementById("fbToast");
  if (!el) return;
  el.innerHTML = bi(message);
  setTimeout(() => {
    el.textContent = "";
  }, 2500);
}

function bindEvents() {
  document.querySelector(".fb-lang")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view-btn]");
    if (btn && VIEWS.includes(btn.dataset.viewBtn)) setView(btn.dataset.viewBtn);
  });
  const r = root();
  r.addEventListener("click", async (e) => {
    const say = e.target.closest("[data-say]");
    if (say) return speak(say.dataset.say, say.dataset.sayLang);
    if (e.target.closest("[data-print-plan]")) {
      document.body.dataset.printing = "plan";
      const clear = () => {
        delete document.body.dataset.printing;
        window.removeEventListener("afterprint", clear);
      };
      window.addEventListener("afterprint", clear);
      return window.print();
    }
    if (e.target.closest("[data-share]")) {
      try {
        await navigator.share({ title: state.guide.unit.title, url: unitUrl(state.unitId) });
      } catch {
        /* the person closed the share sheet */
      }
      return;
    }
    if (e.target.closest("[data-copy-link]")) {
      try {
        await navigator.clipboard.writeText(unitUrl(state.unitId));
        toast(C.copied);
      } catch {
        /* clipboard blocked: the address bar still holds the link */
      }
    }
  });
  r.addEventListener("change", (e) => {
    const day = e.target.closest("[data-plan-day]");
    if (day) {
      const id = day.dataset.planDay;
      state.planDone = day.checked ? [...new Set([...state.planDone, id])] : state.planDone.filter((x) => x !== id);
      db.set(planKey(state.unitId, state.week), state.planDone);
      day.closest(".fb-plan-day")?.classList.toggle("is-done", day.checked);
      return;
    }
    const box = e.target.closest("[data-try]");
    if (!box) return;
    const i = Number(box.dataset.try);
    state.done = box.checked ? [...new Set([...state.done, i])] : state.done.filter((n) => n !== i);
    db.set(doneKey(state.unitId), state.done);
    box.closest(".fb-try")?.classList.toggle("is-done", box.checked);
    const progress = document.getElementById("fbTryProgress");
    if (progress) progress.innerHTML = progressInner(state.guide.try_at_home.length, state.done.length);
  });
}

async function init() {
  readUrl();
  document.documentElement.classList.toggle("fb-no-tts", !canSpeak());
  bindEvents();
  applyView();
  if (!state.unitId) return showDirectory();
  try {
    const res = await fetch(`/api/bcpss/family-guide/${encodeURIComponent(state.unitId)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    state.guide = await res.json();
    state.planOn = await pageFlag("family_weekly_plan");
    showGuide();
    applyView();
  } catch {
    root().innerHTML = `<div class="fb-status fb-error" role="alert">${bi(C.noUnit)} <a href="/family/bcpss/">${bi(C.retry)}</a></div>`;
  }
}

init();
