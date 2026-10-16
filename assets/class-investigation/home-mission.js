// Our Class Investigation — Home Mission (the family-homework card).
//
// "Measure something at home and add it to our class data." Optional, never
// graded, and it asks for nothing but the numbers the class question names.
//
// MOUNT (three lines, on any family homework page):
//   <div data-home-mission></div>
//   <script type="module" src="/assets/class-investigation/home-mission.js"></script>
// Optional: data-lang="es" on the div to force Spanish; otherwise the site's
// `nt-lang` choice is used.
//
// Privacy: the card remembers the class code on THIS device only. The code is
// never written into a page URL, and neither is anything a family types, so a
// shared homework link carries no responses. Contributions use the same
// offline queue and the same server checks as the class page, with source "home".

import { displayCode } from "./contract.js";
import { announce, h } from "./dom.js";
import { buildForm } from "./form.js";
import { getLang, pick, tr } from "./i18n.js";
import { createStore, safeStorage } from "./store.js";
import { createClient, flushQueue } from "./sync.js";
import { getTemplate, resolveOptions, TEMPLATES } from "./templates.js";

const CSS = "/assets/class-investigation/class-investigation.css";
const STORE_KEY = "ewl.classInvestigation.home.v1";
const PAGE = "/curriculum/class-investigation/";

function ensureStyles() {
  if (document.querySelector(`link[href^="${CSS}"]`)) return;
  document.head.append(h("link", { rel: "stylesheet", href: CSS }));
}

/** @param {HTMLElement} host */
export function mountHomeMission(host) {
  ensureStyles();
  const store = createStore(safeStorage(), { key: STORE_KEY });
  const client = createClient();
  const lang = host.dataset.lang === "es" ? "es" : host.dataset.lang === "en" ? "en" : getLang();
  const state = { info: null, error: "", thanks: false, solo: false };
  const live = h("div", { class: "ci-sr", role: "status", "aria-live": "polite" });
  const body = h("div", {});
  host.className = "ci-hm";
  host.setAttribute("lang", lang);
  host.replaceChildren(live, body);

  async function load() {
    if (store.mode !== "class") return;
    const r = await client.info(store.state.code);
    if (r.ok) {
      state.info = r.data;
      state.error = "";
      const inv = r.data.investigations.find((i) => i.templateId === r.data.active);
      store.setInvestigation(r.data.active, inv?.options ?? {});
    } else if (r.status === 404) {
      store.leaveClass();
      state.info = null;
      state.error = "noClass";
    } else if (r.status === 503) {
      state.error = "serverDown";
    }
  }

  async function send() {
    if (!store.pending().length || store.mode !== "class") return;
    const r = await flushQueue(store, client);
    if (r.sent) announce(live, tr("hmThanks", lang));
  }

  function connect(event) {
    event.preventDefault();
    const value = body.querySelector("input")?.value;
    if (!store.joinClass(value)) {
      state.error = "badCode";
      draw();
      return;
    }
    state.error = "";
    load().then(draw);
  }

  function draw() {
    const heading = h("h3", { class: "ci-hm-title", text: tr("hmTitle", lang) });
    const intro = h("p", { text: tr("hmIntro", lang) });
    const card = h(
      "section",
      { class: "ci-card", "aria-label": tr("hmTitle", lang) },
      heading,
      intro,
    );

    if (store.mode !== "class" && !state.solo) {
      card.append(
        h("p", { class: "ci-small", text: tr("hmCodeAsk", lang) }),
        h("form", { class: "ci-joinform", onsubmit: connect, novalidate: true }, [
          h("label", { for: "ci-hm-code", text: tr("hmCodeLabel", lang) }),
          h("input", {
            type: "text",
            id: "ci-hm-code",
            class: "ci-codeinput",
            maxlength: 12,
            autocomplete: "off",
            autocapitalize: "characters",
            "aria-describedby": "ci-hm-msg",
          }),
          h("button", {
            type: "submit",
            class: "ci-btn ci-btn-primary",
            text: tr("hmConnect", lang),
          }),
        ]),
        h("p", {
          class: "ci-error",
          id: "ci-hm-msg",
          role: "alert",
          text: state.error ? tr(state.error, lang) : "",
        }),
        h("p", { class: "ci-small", text: tr("hmPrivacy", lang) }),
        h("p", { class: "ci-small" }, [
          tr("hmNoTeacher", lang),
          " ",
          h("button", {
            type: "button",
            class: "ci-btn ci-btn-quiet",
            text: tr("soloBtn", lang),
            onclick: () => {
              state.solo = true;
              store.setInvestigation(TEMPLATES[0].id, {});
              draw();
            },
          }),
        ]),
      );
      body.replaceChildren(card);
      return;
    }

    const template = getTemplate(store.state.templateId) ?? TEMPLATES[0];
    const options = resolveOptions(template, store.state.options);
    const inv = state.info?.investigations.find((i) => i.templateId === template.id);
    const closed = store.mode === "class" && inv?.status === "closed";

    if (store.mode === "class") {
      card.append(
        h("p", { class: "ci-small" }, [
          `${tr("hmCodeLabel", lang)}: `,
          h("strong", { text: displayCode(store.state.code) }),
          " ",
          h("button", {
            type: "button",
            class: "ci-btn ci-btn-quiet",
            text: tr("hmChange", lang),
            onclick: () => {
              store.leaveClass();
              state.info = null;
              draw();
            },
          }),
        ]),
      );
    }
    card.append(
      h("p", { class: "ci-small" }, [
        h("strong", { text: `${tr("hmQuestion", lang)}: ` }),
        pick(template.question, lang),
      ]),
    );
    if (state.thanks) {
      card.append(
        h("p", {
          class: "ci-thanks",
          role: "status",
          text: tr(store.mode === "class" ? "hmThanks" : "hmSoloDone", lang),
        }),
      );
    }
    card.append(
      buildForm({
        template,
        options,
        lang,
        store,
        source: "home",
        blockedReason: closed
          ? "hmNotCollecting"
          : state.error === "serverDown"
            ? "serverDown"
            : undefined,
        onAdded: () => {
          state.thanks = true;
          draw();
          send();
        },
        onNextPerson: draw,
      }),
    );
    if (store.mode === "class") {
      card.append(
        h("p", {}, h("a", { href: `${PAGE}?code=${store.state.code}`, text: tr("hmOpen", lang) })),
      );
    }
    body.replaceChildren(card);
  }

  window.addEventListener("online", send);
  draw();
  if (store.mode === "class") load().then(() => (draw(), send()));
}

function autoMount() {
  for (const el of document.querySelectorAll("[data-home-mission]")) mountHomeMission(el);
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoMount);
  else autoMount();
}
