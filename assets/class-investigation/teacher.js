// Our Class Investigation — the teacher panel.
//
// Everything a teacher does to a class lives behind the teacher key (the
// `x-teacher-key` header the other teacher APIs use): start a class and get its
// code, choose which investigation is active, stop and restart collecting,
// download the data, and delete it. Students never see this panel's controls
// work: without the key every call is a 401.
//
// The key is typed into this panel, kept in sessionStorage so a reload does not
// ask again, and cleared when the tab closes. It goes only into a request header.

import { displayCode, normalizeClassCode } from "./contract.js";
import { h } from "./dom.js";
import { pick, tr } from "./i18n.js";
import { getTemplate, TEMPLATES } from "./templates.js";

const KEY_SLOT = "ewl.ci.teacherKey";

const readKey = () => {
  try {
    return globalThis.sessionStorage?.getItem(KEY_SLOT) ?? "";
  } catch {
    return "";
  }
};
const writeKey = (value) => {
  try {
    globalThis.sessionStorage?.setItem(KEY_SLOT, value);
  } catch {
    /* the key just won't survive a reload */
  }
};

function saveCsv(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {object} o
 * @param {"en"|"es"} o.lang
 * @param {ReturnType<import("./store.js").createStore>} o.store
 * @param {ReturnType<import("./sync.js").createClient>} o.client
 * @param {() => Promise<object|null>} o.engine
 * @param {() => void} o.onChange  call after the class changed so the page reloads it
 */
export function buildTeacherPanel({ lang, store, client, engine, onChange }) {
  const message = h("p", { class: "ci-note", role: "status", "aria-live": "polite" });
  const say = (text) => {
    message.textContent = text;
  };
  const keyInput = h("input", {
    type: "password",
    id: "ci-tkey",
    autocomplete: "off",
    value: readKey(),
    oninput: (e) => writeKey(e.target.value),
  });
  const body = h("div", { class: "ci-teacher-body" });

  /** Run a teacher call; turn every failure into one sentence. */
  async function guarded(call) {
    const key = keyInput.value.trim();
    if (!key) {
      say(tr("tNeedKey", lang));
      keyInput.focus();
      return null;
    }
    const r = await call(key);
    if (r.ok) return r;
    if (r.status === 401) say(tr("tWrongKey", lang));
    else if (r.error === "teacher-not-configured") say(tr("tNotConfigured", lang));
    else say(tr("tFailed", lang));
    return null;
  }

  const templateSelect = (id, current) => {
    const select = h(
      "select",
      { id, class: "ci-select" },
      TEMPLATES.map((t) => h("option", { value: t.id, text: pick(t.title, lang) })),
    );
    select.value = current;
    return select;
  };

  /* ── start a class ── */
  const createSelect = templateSelect("ci-t-create", TEMPLATES[0].id);
  const optionBox = h("div", { class: "ci-options" });
  const created = h("div", { class: "ci-created", "aria-live": "polite" });
  const drawOptions = () => {
    const template = getTemplate(createSelect.value);
    optionBox.replaceChildren(
      ...template.options.map((opt) =>
        h(
          "label",
          { class: "ci-check" },
          h("input", { type: "checkbox", name: opt.id, checked: opt.defaultOn }),
          h("span", {}, pick(opt.label, lang), h("small", { text: ` ${pick(opt.note, lang)}` })),
        ),
      ),
    );
  };
  createSelect.addEventListener("change", drawOptions);
  drawOptions();

  const optionsFor = (box) =>
    Object.fromEntries(
      [...box.querySelectorAll("input[type=checkbox]")].map((i) => [i.name, i.checked]),
    );

  async function showCreated(code, templateId) {
    const link = `${location.origin}/curriculum/class-investigation/?code=${code}`;
    const qrHost = h("div", { class: "ci-qr" });
    created.replaceChildren(
      h("p", { class: "ci-bigcode", "aria-label": tr("tCodeIs", lang), text: displayCode(code) }),
      h("p", { class: "ci-small", text: tr("tShare", lang) }),
      h("p", {}, h("a", { href: link, text: link })),
      qrHost,
    );
    const tools = await engine();
    if (tools?.qrSvg) qrHost.innerHTML = tools.qrSvg(link, { size: 160 });
    codeInput.value = code;
    store.joinClass(code);
    store.setInvestigation(templateId, optionsFor(optionBox));
    onChange();
    await loadClass();
  }

  const createBtn = h("button", {
    type: "button",
    class: "ci-btn ci-btn-primary",
    text: tr("tCreate", lang),
    onclick: async () => {
      const templateId = createSelect.value;
      const r = await guarded((key) =>
        client.create(key, { templateId, options: optionsFor(optionBox) }),
      );
      if (r) {
        say(tr("tDone", lang));
        await showCreated(r.data.code, templateId);
      }
    },
  });

  /* ── manage an existing class ── */
  const codeInput = h("input", {
    type: "text",
    id: "ci-t-code",
    maxlength: 12,
    autocomplete: "off",
    autocapitalize: "characters",
    value: store.state.code || "",
  });
  const manageHost = h("div", { class: "ci-manage" });
  const activateSelect = templateSelect("ci-t-activate", TEMPLATES[0].id);
  const activateOptions = h("div", { class: "ci-options" });
  const drawActivateOptions = () => {
    const template = getTemplate(activateSelect.value);
    activateOptions.replaceChildren(
      ...template.options.map((opt) =>
        h(
          "label",
          { class: "ci-check" },
          h("input", { type: "checkbox", name: opt.id, checked: opt.defaultOn }),
          h("span", {}, pick(opt.label, lang), h("small", { text: ` ${pick(opt.note, lang)}` })),
        ),
      ),
    );
  };
  activateSelect.addEventListener("change", drawActivateOptions);
  drawActivateOptions();

  const currentCode = () => normalizeClassCode(codeInput.value);

  async function loadClass() {
    const code = currentCode();
    if (!code) {
      say(tr("badCode", lang));
      return;
    }
    const info = await client.info(code);
    if (!info.ok) {
      say(info.status === 404 ? tr("noClass", lang) : tr("tFailed", lang));
      manageHost.replaceChildren();
      return;
    }
    const rows = info.data.investigations.map((inv) => {
      const template = getTemplate(inv.templateId);
      const closed = inv.status === "closed";
      const isActive = info.data.active === inv.templateId;
      const purgeBox = h("div", { class: "ci-purge", hidden: true });
      const confirm = h("input", {
        type: "text",
        maxlength: 12,
        "aria-label": tr("tConfirmCode", lang),
        autocomplete: "off",
      });
      purgeBox.append(
        h("p", { class: "ci-warn", text: tr("tPurgeWarn", lang) }),
        confirm,
        h("button", {
          type: "button",
          class: "ci-btn ci-btn-danger",
          text: tr("tDo", lang),
          onclick: async () => {
            const r = await guarded((key) =>
              client.purge(key, {
                code,
                templateId: inv.templateId,
                confirm: normalizeClassCode(confirm.value),
              }),
            );
            if (r) {
              say(tr("tDeleted", lang, { n: r.data.removed }));
              await loadClass();
              onChange();
            }
          },
        }),
      );
      return h(
        "li",
        { class: "ci-invrow" },
        h("div", {}, [
          h("strong", { text: pick(template.title, lang) }),
          h("span", {
            class: "ci-pill",
            text: `${isActive ? `${tr("tActive", lang)} · ` : ""}${tr(closed ? "statusClosed" : "statusOpen", lang)} · ${tr("dotsCount", lang, { n: inv.count })}`,
          }),
        ]),
        h("div", { class: "ci-row" }, [
          h("button", {
            type: "button",
            class: "ci-btn",
            text: tr(closed ? "tReopen" : "tClose", lang),
            onclick: async () => {
              const r = await guarded((key) =>
                (closed ? client.reopen : client.close)(key, { code, templateId: inv.templateId }),
              );
              if (r) {
                say(tr("tDone", lang));
                await loadClass();
                onChange();
              }
            },
          }),
          h("button", {
            type: "button",
            class: "ci-btn",
            text: tr("tExport", lang),
            onclick: async () => {
              const key = keyInput.value.trim();
              if (!key) return say(tr("tNeedKey", lang));
              const r = await client.exportCsv(key, code, inv.templateId);
              if (!r.ok) return say(r.status === 401 ? tr("tWrongKey", lang) : tr("tFailed", lang));
              saveCsv(`class-investigation-${inv.templateId}.csv`, r.text);
              say(tr("tDone", lang));
            },
          }),
          h("button", {
            type: "button",
            class: "ci-btn ci-btn-quiet",
            text: tr("tPurge", lang),
            "aria-expanded": "false",
            onclick: (e) => {
              purgeBox.hidden = !purgeBox.hidden;
              e.currentTarget.setAttribute("aria-expanded", String(!purgeBox.hidden));
            },
          }),
        ]),
        purgeBox,
      );
    });

    const wholeConfirm = h("input", {
      type: "text",
      maxlength: 12,
      "aria-label": tr("tConfirmCode", lang),
      autocomplete: "off",
    });
    manageHost.replaceChildren(
      h("ul", { class: "ci-invlist" }, rows),
      h("div", { class: "ci-row ci-wrapnarrow" }, [
        h("label", { for: "ci-t-activate", text: tr("tSetActive", lang) }),
        activateSelect,
      ]),
      h("p", {
        class: "ci-small",
        text: `${tr("tOptionHint", lang)}. ${tr("tOptionLocked", lang)}`,
      }),
      activateOptions,
      h("button", {
        type: "button",
        class: "ci-btn ci-btn-primary",
        text: tr("tSetActive", lang),
        onclick: async () => {
          const templateId = activateSelect.value;
          const r = await guarded((key) =>
            client.activate(key, {
              code,
              templateId,
              ...(getTemplate(templateId).options.length
                ? { options: optionsFor(activateOptions) }
                : {}),
            }),
          );
          if (r) {
            say(tr("tDone", lang));
            await loadClass();
            onChange();
          }
        },
      }),
      h("details", { class: "ci-danger" }, [
        h("summary", { text: tr("tPurgeAll", lang) }),
        h("p", { class: "ci-warn", text: tr("tPurgeWarn", lang) }),
        wholeConfirm,
        h("button", {
          type: "button",
          class: "ci-btn ci-btn-danger",
          text: tr("tDo", lang),
          onclick: async () => {
            const r = await guarded((key) =>
              client.purge(key, { code, confirm: normalizeClassCode(wholeConfirm.value) }),
            );
            if (r) {
              say(tr("tDeleted", lang, { n: r.data.removed }));
              store.leaveClass();
              manageHost.replaceChildren();
              onChange();
            }
          },
        }),
      ]),
    );
  }

  body.append(
    h("p", { class: "ci-small", text: tr("tKeyHelp", lang) }),
    h(
      "div",
      { class: "ci-chooser" },
      h("label", { for: "ci-tkey", text: tr("tKey", lang) }),
      keyInput,
    ),
    h("h4", { text: tr("tCreate", lang) }),
    h(
      "div",
      { class: "ci-chooser" },
      h("label", { for: "ci-t-create", text: tr("tCreateFor", lang) }),
      createSelect,
    ),
    optionBox,
    createBtn,
    created,
    h("h4", { text: tr("tUseCode", lang) }),
    h(
      "div",
      { class: "ci-chooser" },
      h("label", { for: "ci-t-code", text: tr("codeLabel", lang) }),
      codeInput,
    ),
    h("button", {
      type: "button",
      class: "ci-btn",
      text: tr("tUseCode", lang),
      onclick: loadClass,
    }),
    manageHost,
    message,
  );
  const panel = h(
    "details",
    { class: "ci-card ci-teacher", id: "ci-teacher" },
    h("summary", { text: tr("tTitle", lang) }),
    body,
  );
  // A class this device already joined can be managed without retyping its code.
  if (store.state.code && keyInput.value)
    panel.addEventListener("toggle", () => panel.open && loadClass(), { once: true });
  return panel;
}
