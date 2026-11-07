// fl-teacher: "Family letter, home cards and class poster" in the Class tools tab. Everything prints through the
// lab's one print sheet; nothing is stored and no learner is named.
import { cardSheetHtml, letterHtml, LETTER_LANGS } from "./family-letter.js";
import { posterHtml } from "./fact-poster.js";
import { t } from "./i18n.js";
import { GRADES } from "./problem-bank.js";
import { esc } from "./reports-export.js";

const LANG_NAMES = () => ({
  en: "English",
  es: "Español",
  both: t("English and Español"),
});

function html(state) {
  const names = LANG_NAMES();
  return `<section class="t4-section" aria-labelledby="tt-print-title"><h3 id="tt-print-title">${esc(t("Family letter, home cards and class poster"))}</h3>
    <p class="t4-hint">${esc(t("Print a welcome letter with a QR code that opens the lab at your grade, cards to send home, and a poster your class colours in together. The letter and poster are written in the language you choose."))}</p>
    <form class="t4-form" data-tt-print novalidate>
      <div class="t4-row"><label>${esc(t("Grade"))}<select name="grade">${GRADES.map((g) => `<option value="${g.grade}" ${g.grade === state.grade ? "selected" : ""}>${esc(g.label)}</option>`).join("")}</select></label>
        <label>${esc(t("Language of the printout"))}<select name="lang">${LETTER_LANGS.map((code) => `<option value="${code}" ${code === state.lang ? "selected" : ""}>${esc(names[code])}</option>`).join("")}</select></label></div>
      <div class="t4-row"><label>${esc(t("Your name (printed at the end of the letter)"))}<input name="teacher" maxlength="60" autocomplete="off" value="${esc(state.teacher)}"></label>
        <label>${esc(t("Class or room (optional)"))}<input name="room" maxlength="40" autocomplete="off" value="${esc(state.room)}"></label></div>
      <div class="t4-actions"><button type="button" class="fl-btn fl-btn--teal" data-tt-print-kind="letter">${esc(t("Print the welcome letter"))}</button>
        <button type="button" class="fl-btn fl-btn--ghost" data-tt-print-kind="cards">${esc(t("Print home-access cards"))}</button>
        <button type="button" class="fl-btn fl-btn--ghost" data-tt-print-kind="poster">${esc(t("Print the class fact poster"))}</button></div></form></section>`;
}

export function mountPrintTool(host, { grade, onPrint, announce } = {}) {
  const state = { grade: Number.isInteger(grade) ? grade : 3, lang: "both", teacher: "", room: "" };
  const read = () => {
    const data = new FormData(host.querySelector("[data-tt-print]"));
    state.grade = Number(data.get("grade"));
    state.lang = LETTER_LANGS.includes(data.get("lang")) ? data.get("lang") : "both";
    state.teacher = String(data.get("teacher") ?? "");
    state.room = String(data.get("room") ?? "");
  };
  const sheets = {
    letter: () => letterHtml(state),
    cards: () => cardSheetHtml(state),
    poster: () =>
      (state.lang === "both" ? ["en", "es"] : [state.lang])
        .map((lang) => posterHtml({ grade: state.grade, lang }))
        .join(""),
  };
  host.addEventListener("click", (event) => {
    const kind = event.target.closest("[data-tt-print-kind]")?.dataset.ttPrintKind;
    if (!kind || !sheets[kind]) return;
    read();
    onPrint?.(sheets[kind]());
    announce?.(t("Opening the print dialog."));
  });
  host.innerHTML = html(state);
  return { refresh: () => (host.innerHTML = html(state)) };
}
