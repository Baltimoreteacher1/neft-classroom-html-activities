// Class teacher view (/class/teacher): the same panel the Teacher Hub mounts (class/roster-panel.js), so a
// projector or phone can run one class with its passcode on thelanguagepage.com without opening the Hub.
import { crumbsHTML } from "../components.js";
import { mountClassPanel } from "../class/roster-panel.js";
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";

let panel = null;

export function render(ctx) {
  const I = i18nFor(ctx);
  return {
    title: I.S("Class teacher view", "Vista de la clase para el maestro"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("Class teacher view", "Vista de la clase para el maestro"), null]])}
      <section class="cls-page" aria-labelledby="ctvTitle">
        <header class="cls-head"><h1 id="ctvTitle" tabindex="-1">${I.T("Class teacher view", "Vista de la clase para el maestro")}</h1></header>
        <div id="ctvRoot" data-nsr-ignore></div>
      </section>`,
  };
}

export const unmount = () => {
  panel?.unmount();
  panel = null;
};

export function mount(root, ctx) {
  unmount();
  const host = root.querySelector("#ctvRoot");
  if (host) panel = mountClassPanel(host, { S: i18nFor(ctx).S });
}
