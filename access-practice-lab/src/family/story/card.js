// The Family Corner's entry to the Language Story: one card, one action. With a note already on this phone it opens
// that note; without one it explains where notes come from and opens the page that accepts a pasted link.
import { BASE, html, icon } from "../../util.js";
import { compose } from "./model.js";
import { loadSaved } from "./store.js";

export function storyCardHTML(I) {
  const saved = loadSaved();
  const title = saved ? compose(saved).title : null;
  return html`<section class="fls-card fls-hub no-print" aria-labelledby="flsHubTitle">
    <h2 id="flsHubTitle"><span aria-hidden="true">💬</span> ${saved ? I.TO(title) : I.T("A note from your teacher", "Una nota de su maestro o maestra")}</h2>
    <p>${saved
      ? I.T("Your teacher’s note is ready: something to celebrate and ideas to talk about at home.", "La nota de su maestro o maestra está lista: algo para celebrar e ideas para conversar en casa.")
      : I.T("Your teacher can send a short Language Story about your child. Open the link they send, or paste it here.", "Su maestro o maestra puede enviarles una breve historia de lenguaje sobre su estudiante. Abran el enlace que les envíe o péguenlo aquí.")}</p>
    <a class="btn btn-primary" href="${BASE}/family/story">${saved ? I.T("Open the note", "Abrir la nota") : I.T("Open my note", "Abrir mi nota")}${icon("arrow-right")}</a>
  </section>`;
}
