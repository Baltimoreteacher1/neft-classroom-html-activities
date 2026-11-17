// Experience Builder: the Assign step's actions — publish to a class, add the assignment, unpublish, and save a
// draft as a file. The calls are the existing class routes (src/compiler/store.js experienceApi). Rules it keeps:
// a typed passcode is used for the call and not stored; every publish after the first raises the version, so a
// learner's older save is never mixed with a changed story.
import { apiError } from "./editor-assign.js";
import { experienceApi, knownClasses } from "./store.js";

export async function publish(ctx, ui, persist) {
  const classes = knownClasses();
  const picked = document.querySelector("[data-xb-class]")?.value;
  const known = classes.find((c) => c.code === picked);
  const code = (known?.code || document.querySelector("[data-xb-code]")?.value || "")
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "");
  const passcode =
    known?.passcode || (document.querySelector("[data-xb-pass]")?.value || "").trim().toUpperCase();
  const a = ui.assign;
  a.code = code;
  if (!code) {
    a.msg = [
      "Choose a class, or type a class code and its teacher passcode.",
      "Elija una clase, o escriba un código de clase y su código de acceso docente.",
    ];
    a.ok = false;
    return ctx.rerender();
  }
  a.busy = true;
  ctx.rerender();
  const api = experienceApi({ code, passcode });
  const def = ui.entry.def;
  const before = ui.entry.published;
  // A new version on every publish after the first, so a learner's older save is not mixed with the new story.
  const send = before ? { ...def, version: (Number(def.version) || 1) + 1 } : def;
  const res = await api.publish(send, {
    id: before?.code === code ? before.id : undefined,
    showSource: Boolean(def.compiled?.settings?.showSource),
  });
  a.busy = false;
  if (!res.ok) {
    a.msg = apiError(res);
    a.ok = false;
    return ctx.rerender();
  }
  const assigned = await api.assign(res.id, res.title);
  ui.entry = {
    ...ui.entry,
    def: send,
    published: {
      id: res.id,
      code,
      title: res.title,
      at: res.updatedAt,
      assigned: Boolean(assigned.ok),
    },
  };
  persist();
  a.ok = true;
  a.msg = assigned.ok
    ? [
        "Published and added to the class's assignments.",
        "Publicada y agregada a las tareas de la clase.",
      ]
    : [
        "Published. It could not be added to the assignments automatically; share the link below instead.",
        "Publicada. No se pudo agregar a las tareas automáticamente; comparta el enlace de abajo.",
      ];
  ctx.rerender();
}

export async function unpublish(ctx, ui, persist) {
  const pub = ui.entry.published;
  const cls = knownClasses().find((c) => c.code === pub.code);
  const api = experienceApi({
    code: pub.code,
    passcode:
      cls?.passcode || (document.querySelector("[data-xb-pass]")?.value || "").trim().toUpperCase(),
  });
  const res = await api.unpublish(pub.id);
  if (res.ok || res.httpStatus === 404) {
    await api.unassign(pub.id);
    const { published, ...rest } = ui.entry;
    ui.entry = rest;
    persist();
    ui.assign = {
      ...ui.assign,
      ok: true,
      msg: [
        "Unpublished. Learners can no longer open it.",
        "Retirada. Los estudiantes ya no pueden abrirla.",
      ],
    };
  } else ui.assign = { ...ui.assign, ok: false, msg: apiError(res) };
  ctx.rerender();
}

export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

