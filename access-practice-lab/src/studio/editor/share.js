// Share With Students: one dialog, only the options that apply to this activity. Nothing is public until the
// teacher presses the link button, which saves to their class, publishes, and (optionally) adds the activity to the
// class assignments. Downloads never need a class.

import { copyText } from "../../util.js";
import { knownClasses, shareUrl, studioApi } from "../drafts.js";
import { printHtml, studentHtml } from "./preview.js";
import { button, field, h, openDialog, select, say, textInput } from "./ui.js";

const slug = (t) => String(t || "activity").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "activity";

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function openShare({ store, saver, S, lang, link, setLink, goToBlock, fetchImpl = (...a) => fetch(...a) }) {
  openDialog(S("Share With Students", "Compartir con los estudiantes"), (body, close) => {
    const a = store.get();
    const report = store.report();
    const out = h("div.st-share");
    const note = h("p.st-status", { role: "status", "aria-live": "polite" });
    const say2 = (t) => {
      note.textContent = t;
      say(t);
    };

    if (!report.ok) {
      body.append(h("div.st-needs", h("h3", S("Fix these first", "Corrija esto primero")), h("ul", report.errors.map((e) => h("li", button(e.message, () => (close(), goToBlock(e.blockId)), "link")))), h("p.st-hint", S("You can still download a draft below.", "Aún puede descargar un borrador abajo."))));
    }

    // ── link (needs a class) ───────────────────────────────────────────────
    const classes = knownClasses();
    const pick = select(classes.length ? classes.map((c) => [c.code, `${c.title || S("Class", "Clase")} · ${c.code}`]) : [["", S("No class on this device", "Ninguna clase en este dispositivo")]], link?.code || classes[0]?.code || "", () => {});
    const code = h("input.st-input", { type: "text", maxlength: "6", autocomplete: "off", "aria-label": S("Class code", "Código de clase"), placeholder: "ABC234" });
    const pass = h("input.st-input", { type: "password", autocomplete: "off", "aria-label": S("Teacher passcode", "Código de acceso docente") });
    const assign = h("input", { type: "checkbox", id: "st-assign", checked: true });
    const linkOut = h("div.st-linkout", { hidden: true });
    const linkBtn = button(S("Copy student link", "Copiar el enlace para estudiantes"), async () => {
      const chosen = classes.find((c) => c.code === pick.value);
      const creds = chosen ? { code: chosen.code, passcode: chosen.passcode } : { code: code.value.toUpperCase().replace(/[^A-Z2-9]/g, ""), passcode: pass.value.trim().toUpperCase() };
      if (!creds.code) return say2(S("Choose a class, or type its code and teacher passcode.", "Elija una clase o escriba su código y el código de acceso docente."));
      if (!report.ok) return say2(S("Fix the items above, then share.", "Corrija lo de arriba y luego comparta."));
      linkBtn.disabled = true;
      say2(S("Saving and publishing…", "Guardando y publicando…"));
      setLink({ ...creds });
      await saver.flush();
      const api = studioApi({ ...creds, fetchImpl });
      const res = await api.publish(store.get().id);
      linkBtn.disabled = false;
      if (!res.ok) return say2(res.httpStatus === 401 ? S("That class code or passcode did not work.", "Ese código de clase o de acceso no funcionó.") : res.error === "invalid-activity" ? S("Something in the activity still needs fixing.", "Algo en la actividad todavía necesita corrección.") : S("It could not be published. Your work is safe on this device.", "No se pudo publicar. Su trabajo está a salvo en este dispositivo."));
      setLink({ ...creds, state: "published", publishedRev: res.publishedRev, rev: res.rev });
      let assigned = false;
      if (assign.checked) assigned = (await api.assign(store.get().id, store.get().title)).ok === true;
      const url = shareUrl(store.get().id);
      linkOut.hidden = false;
      const copy = button(
        S("Copy", "Copiar"),
        async () => say2((await copyText(url)) ? S("Link copied.", "Enlace copiado.") : S("Select the link and copy it.", "Seleccione el enlace y cópielo.")),
        "small",
      );
      const embed = `<iframe src="${url}" title="${a.title.replace(/"/g, "&quot;")}" width="100%" height="640"></iframe>`;
      linkOut.replaceChildren(
        h("label", { for: "st-url" }, S("Student link", "Enlace para estudiantes")),
        h("div.st-row", h("input#st-url.st-input", { readonly: "", value: url, onfocus: (e) => e.target.select() }), copy),
        h("p.st-hint", assigned ? S("Published and added to your class assignments.", "Publicada y agregada a las tareas de su clase.") : S("Published. Share the link with your students.", "Publicada. Comparta el enlace con sus estudiantes.")),
        h("p.st-hint", S("To embed it in a page: ", "Para insertarla en una página: "), h("code", embed)),
      );
      say2(S("Published.", "Publicada."));
    }, "primary");
    const classBlock = h("section.st-share-block", h("h3", S("Send students a link", "Enviar un enlace a los estudiantes")), classes.length ? field(S("Class", "Clase"), pick) : h("div.st-grid", field(S("Class code", "Código de clase"), code), field(S("Teacher passcode (not saved)", "Código de acceso docente (no se guarda)"), pass)), h("div.st-toggle", assign, h("label", { for: "st-assign" }, S("Add to my class assignments", "Agregar a las tareas de mi clase"))), linkBtn, linkOut, link?.state === "published" ? h("p.st-hint", S("Currently published. Sharing again updates the page students see.", "Publicada actualmente. Compartir de nuevo actualiza la página que ven los estudiantes.")) : null);

    // ── downloads and print ────────────────────────────────────────────────
    const items = [];
    const html = button(S("Download HTML (works offline)", "Descargar HTML (funciona sin conexión)"), async () => {
      say2(S("Preparing…", "Preparando…"));
      saveBlob(new Blob([await studentHtml(store.get(), { lang })], { type: "text/html" }), `${slug(a.title)}.html`);
      say2(S("Downloaded. Open the file in any browser.", "Descargado. Abra el archivo en cualquier navegador."));
    });
    items.push(html);
    if (a.kind === "worksheet" || a.kind === "check") {
      items.push(button(S("Print or save as PDF", "Imprimir o guardar como PDF"), async () => {
        const { html: doc } = await printHtml(store.get(), { lang, part: "student" });
        (await import("../print/open-print.js")).openPrint(doc);
      }));
      const docx = (part, label) => button(label, async () => {
        say2(S("Building the Word file…", "Creando el archivo de Word…"));
        const res = await fetchImpl("/api/studio/docx", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ activity: store.get(), part, lang }) }).catch(() => null);
        if (!res?.ok) return say2(S("The Word file could not be made. Try again.", "No se pudo crear el archivo de Word. Intente de nuevo."));
        saveBlob(await res.blob(), `${slug(a.title)}${part === "key" ? "-answer-key" : ""}.docx`);
        say2(S("Downloaded.", "Descargado."));
      });
      items.push(docx("student", S("Download editable Word file", "Descargar archivo de Word editable")));
      if (a.options.answerKey) {
        items.push(docx("key", S("Download answer key (Word)", "Descargar clave de respuestas (Word)")));
        items.push(button(S("Print answer key", "Imprimir clave de respuestas"), async () => {
          const { html: doc } = await printHtml(store.get(), { lang, part: "key" });
          (await import("../print/open-print.js")).openPrint(doc);
        }));
      }
    }
    items.push(button(S("Download complete package (ZIP)", "Descargar paquete completo (ZIP)"), async () => {
      say2(S("Building the package…", "Creando el paquete…"));
      try {
        const { downloadablePackage } = await import("./package-download.js");
        const pkg = await downloadablePackage(store.get(), { lang, generatedAt: new Date().toISOString().slice(0, 10), fetchImpl });
        saveBlob(pkg.blob, `${slug(a.title)}-package.zip`);
        const note2 = pkg.review.map((r) => S(r.en, r.es)).join(" ");
        say2(`${S("Downloaded. Open index.html inside to start.", "Descargado. Abra index.html dentro para empezar.")} ${pkg.offline ? "" : S("Some parts need an internet connection.", "Algunas partes necesitan conexión a internet.")} ${note2}`.trim());
      } catch (err) {
        say2(S("The package could not be built. Your work is safe; try again.", "No se pudo crear el paquete. Su trabajo está a salvo; intente de nuevo."));
      }
    }));
    body.append(out, classBlock, h("section.st-share-block", h("h3", S("Download or print", "Descargar o imprimir")), h("div.st-add-row", items)), note);
  });
}

export { textInput };
