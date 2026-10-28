// Family Help Center: searchable cards in plain language, plus a printable quick-start.
// Search matches the title, summary, steps and keywords in BOTH languages, so a caregiver can type in
// whichever language they think in.
import { loadFamilyHelp } from "../content.js";
import { html, icon, toHtml } from "../util.js";
import { crumbs, subnavHTML } from "./ui.js";

const iconFor = (name) => icon(name === "microphone" ? "record" : name === "listening" ? "volume" : name || "help");

const haystack = (topic) =>
  [topic.title, topic.summary, ...(topic.steps || [])]
    .flatMap((o) => [o.en, o.es])
    .concat(topic.keywords?.en || [], topic.keywords?.es || [])
    .join(" ")
    .toLowerCase();

/** Pure: which topics match a query. Every word must appear somewhere in the topic. */
export function searchTopics(topics, query) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return topics;
  return topics.filter((t) => {
    const text = haystack(t);
    return words.every((w) => text.includes(w));
  });
}

let query = "";

function cards(I, topics) {
  if (!topics.length) return html`<p class="fam-none" role="status">${I.L("help.none")}</p>`;
  return html`<ul class="fam-help-cards">
    ${topics.map(
      (t) => html`<li><details id="help-${t.id}"><summary><span class="fam-tile">${iconFor(t.icon)}</span><span><strong>${I.TO(t.title)}</strong><span class="fam-sum">${I.TO(t.summary)}</span></span></summary>
        <ol>${t.steps.map((s) => html`<li>${I.TO(s)}</li>`)}</ol></details></li>`,
    )}
  </ul>`;
}

export async function render(ctx, I) {
  const data = await loadFamilyHelp();
  const topics = data?.help || [];
  const shown = searchTopics(topics, query);
  return {
    title: I.LS("help.title"),
    html: html`${crumbs(I, I.L("help.title"))}
      <section class="fam-help panel" aria-labelledby="famHelpTitle">
        <h1 id="famHelpTitle" tabindex="-1">${I.L("help.title")}</h1>
        <p class="lead">${I.L("help.lead")}</p>
        <div class="fam-search no-print" role="search">
          <label class="field"><span>${I.L("help.search.label")}</span>
            <input type="search" value="${query}" placeholder="${I.LS("help.search.placeholder")}" data-fam-help-search autocomplete="off" data-nsr-ignore /></label>
          <p class="fine" role="status" aria-live="polite" data-fam-help-count>${I.L("help.count", { n: shown.length })}</p>
        </div>
        <div data-fam-help-list>${cards(I, shown)}</div>
      </section>
      <section class="fam-quick panel" aria-labelledby="famQuickTitle" data-fam-quick>
        <h2 id="famQuickTitle">${data?.quickstart ? I.TO(data.quickstart.title) : I.L("help.quick.heading")}</h2>
        <ol class="fam-steps">${(data?.quickstart?.items || []).map((item) => html`<li><span>${I.TO(item)}</span></li>`)}</ol>
        <button type="button" class="btn no-print" data-fam-print-quick>${icon("print")} ${I.L("help.quick.print")}</button>
      </section>
      <section class="fam-walk panel no-print" aria-labelledby="famWalkTitle">
        <h2 id="famWalkTitle">${I.L("help.walk.heading")}</h2>
        <ol class="fam-steps">${[1, 2, 3, 4].map((n) => html`<li><span>${I.L(`help.walk.${n}`)}</span></li>`)}</ol>
      </section>
      ${subnavHTML(I, "help", ctx.band)}`,
  };
}

export function onInput(e, ctx, I) {
  if (!e.target.matches?.("[data-fam-help-search]")) return false;
  query = e.target.value;
  // Redraw only the list and the count so the search box keeps focus and the caret.
  loadFamilyHelp().then((data) => {
    const shown = searchTopics(data?.help || [], query);
    const list = document.querySelector("[data-fam-help-list]");
    const count = document.querySelector("[data-fam-help-count]");
    if (list) list.innerHTML = toHtml(cards(I, shown));
    if (count) count.textContent = I.LS("help.count", { n: shown.length });
  });
  return true;
}

export function onClick(e) {
  if (!e.target.closest("[data-fam-print-quick]")) return false;
  document.body.classList.add("printing-quickstart");
  const done = () => {
    document.body.classList.remove("printing-quickstart");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
  return true;
}
