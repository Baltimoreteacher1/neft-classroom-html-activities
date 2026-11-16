// Book Studio 2.0 · story authoring dialogs: Character DNA, choices for a page, clues and items, the visual story map
// with validators. No code anywhere: the author picks from lists and connects pages. Loaded on demand.
import { ART } from "./art.js";
import { bkIcon } from "./icons.js";
import { plainText } from "./model.js";
import { artSrc, esc } from "./render.js";
import {
  EXPRESSIONS,
  EXPRESSION_LABEL,
  characterArt,
  characterStory,
  normalizeCharacter,
  normalizeChoice,
  normalizeHotspot,
  normalizeItem,
  syncCharacter,
  validateStory,
} from "./story.js";

const CHAR_ART = ART.filter((a) => a.key.startsWith("char-"));
const ITEM_ART = ART.filter((a) => a.key.startsWith("obj-") || a.key.startsWith("sci-"));
const nid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function dlg(E, title, body, { wide = true, onClose } = {}) {
  let d = E.stDialog;
  if (!d) {
    d = document.createElement("dialog");
    d.className = "bk-dialog bk-dialog-wide bk-st-dialog";
    d.setAttribute("aria-labelledby", "bkStTitle");
    E.root.querySelector(".bk-editor").append(d);
    E.stDialog = d;
    d.addEventListener("close", () => E.stOnClose?.());
    d.addEventListener("click", (e) => E.stClick?.(e));
    d.addEventListener("input", (e) => E.stInput?.(e));
    d.addEventListener("change", (e) => E.stInput?.(e));
  }
  const tr = E.I.S;
  d.classList.toggle("bk-dialog-wide", wide);
  d.innerHTML = `<div class="bk-dialog-inner"><header class="bk-dialog-head"><h2 id="bkStTitle">${esc(title)}</h2><button type="button" class="bk-tbtn" data-st="close" aria-label="${esc(tr("Close", "Cerrar"))}">${bkIcon("close")}</button></header><div data-st-body>${body}</div></div>`;
  E.stOnClose = () => {
    onClose?.();
    E.renderDock?.();
  };
  if (!d.open) d.showModal();
  return d;
}

const opts = (list, sel, blank = "") =>
  `${blank ? `<option value="">${esc(blank)}</option>` : ""}${list.map(([v, l]) => `<option value="${esc(v)}" ${String(sel) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}`;

// ── Character DNA ──
export function openCharacters(E, editId = "") {
  const tr = E.I.S;
  const { core } = E;
  const book = core.S.book;
  const edit = editId ? book.characters.find((c) => c.id === editId) : null;
  const render = () => {
    const list = book.characters
      .map((c) => {
        const st = characterStory(book, c.id);
        return `<li class="bk-char"><img alt="" src="${artSrc(characterArt(c))}"><div><strong>${esc(c.name)}</strong><span class="bk-sp-meta">${esc(c.role)}${c.traits.length ? ` · ${esc(c.traits.join(", "))}` : ""}</span><p class="fine">${esc(c.appearance)}</p><p class="fine">${st.pages.length ? `${esc(tr("On pages", "En las páginas"))} ${st.pages.join(", ")} · ${st.lines.length} ${esc(tr("lines of dialogue", "líneas de diálogo"))}` : esc(tr("Not on any page yet.", "Todavía no está en ninguna página."))}</p></div>
        <div class="bk-btnrow"><button type="button" class="btn small btn-primary" data-st="place" data-id="${c.id}">${esc(tr("Put on this page", "Poner en esta página"))}</button><button type="button" class="btn small" data-st="edit-char" data-id="${c.id}">${esc(tr("Edit", "Editar"))}</button><button type="button" class="bk-tbtn" data-st="del-char" data-id="${c.id}" aria-label="${esc(tr("Delete character", "Eliminar personaje"))}">${bkIcon("trash")}</button></div></li>`;
      })
      .join("");
    const form = edit
      ? `<form class="bk-char-form" data-st-form novalidate><h3>${esc(edit.name)}</h3>
      <label class="bk-f"><span>${esc(tr("Name", "Nombre"))}</span><input data-c="name" maxlength="40" value="${esc(edit.name)}"></label>
      <fieldset><legend>${esc(tr("Choose how they look (the same look is used on every page)", "Elige cómo se ve (el mismo aspecto en todas las páginas)"))}</legend><div class="bk-art-pick" role="radiogroup">${CHAR_ART.map((a) => `<label class="bk-art-opt${edit.art === a.key ? " is-on" : ""}"><input type="radio" name="bkCharArt" data-c="art" value="${a.key}" ${edit.art === a.key ? "checked" : ""}><img alt="${esc(a.key.replace("char-", ""))}" src="${artSrc(a.key)}"></label>`).join("")}</div></fieldset>
      <label class="bk-f"><span>${esc(tr("What do they look like? (also read aloud to people who cannot see the picture)", "¿Cómo se ven? (también se lee en voz alta a quienes no ven la imagen)"))}</span><input data-c="appearance" maxlength="300" value="${esc(edit.appearance)}"></label>
      <div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Role in the story", "Papel en el cuento"))}</span><input data-c="role" maxlength="80" value="${esc(edit.role)}"></label><label class="bk-f"><span>${esc(tr("Personality (commas)", "Personalidad (comas)"))}</span><input data-c="traits" maxlength="120" value="${esc(edit.traits.join(", "))}"></label>
      <label class="bk-f"><span>${esc(tr("Usually looks", "Normalmente se ve"))}</span><select data-c="expression">${opts(
        EXPRESSIONS.map((x) => [x, tr(...EXPRESSION_LABEL[x])]),
        edit.expression,
      )}</select></label>
      <label class="bk-f"><span>${esc(tr("Voice speed", "Velocidad de voz"))}</span><input type="range" min="0.6" max="1.6" step="0.1" data-c="rate" value="${edit.voice.rate}"></label><label class="bk-f"><span>${esc(tr("Voice pitch", "Tono de voz"))}</span><input type="range" min="0.5" max="1.8" step="0.1" data-c="pitch" value="${edit.voice.pitch}"></label></div>
      <button type="button" class="btn small ghost" data-st="test-voice" data-id="${edit.id}">${bkIcon("speaker")} ${esc(tr("Hear the voice", "Escuchar la voz"))}</button>
      <details><summary>${esc(tr("Different looks for feelings (optional)", "Aspectos distintos para emociones (opcional)"))}</summary>${EXPRESSIONS.filter(
        (x) => x !== "neutral",
      )
        .map(
          (x) =>
            `<label class="bk-f inline"><span>${esc(tr(...EXPRESSION_LABEL[x]))}</span><select data-c="pose.${x}">${opts(
              CHAR_ART.map((a) => [a.key, a.key.replace("char-", "")]),
              edit.poses[x] || "",
              tr("same as usual", "igual que siempre"),
            )}</select></label>`,
        )
        .join(
          "",
        )}<p class="fine">${esc(tr("If you do not pick one, the character keeps the same picture and a small face shows the feeling.", "Si no eliges uno, el personaje mantiene la misma imagen y una carita muestra la emoción."))}</p></details>
      <div class="bk-rel"><h4>${esc(tr("Relationships", "Relaciones"))}</h4>${edit.relationships
        .map(
          (r, i) =>
            `<div class="bk-btnrow"><select data-c="rel.${i}.charId">${opts(
              book.characters.filter((x) => x.id !== edit.id).map((x) => [x.id, x.name]),
              r.charId,
            )}</select><input data-c="rel.${i}.label" maxlength="60" value="${esc(r.label)}" placeholder="${esc(tr("friend, sister, rival…", "amigo, hermana, rival…"))}"><button type="button" class="bk-tbtn" data-st="del-rel" data-i="${i}" aria-label="${esc(tr("Remove", "Quitar"))}">${bkIcon("trash")}</button></div>`,
        )
        .join(
          "",
        )}${book.characters.length > 1 ? `<button type="button" class="btn small ghost" data-st="add-rel">${bkIcon("plus")} ${esc(tr("Add a relationship", "Agregar una relación"))}</button>` : ""}</div>
      <div class="bk-btnrow bk-sticky"><button type="button" class="btn btn-primary" data-st="done-char">${esc(tr("Done", "Listo"))}</button></div></form>`
      : "";
    const d = dlg(
      E,
      tr("Characters", "Personajes"),
      `<p class="fine">${esc(tr("A character keeps the same look on every page. Pictures are fixed library art you choose; nothing is made by AI.", "Un personaje mantiene el mismo aspecto en todas las páginas. Las imágenes son arte de la biblioteca que tú eliges; nada lo crea la IA."))}</p>
      <div class="bk-btnrow"><button type="button" class="btn btn-primary" data-st="new-char">${bkIcon("plus")} ${esc(tr("New character", "Nuevo personaje"))}</button></div>
      ${book.characters.length ? `<ul class="bk-chars">${list}</ul>` : `<div class="bk-empty"><h3>${esc(tr("No characters yet", "Aún no hay personajes"))}</h3><p>${esc(tr("Make one, then put them on any page.", "Crea uno y ponlo en cualquier página."))}</p></div>`}${form}`,
    );
    return d;
  };
  render();
  E.stClick = (e) => {
    const b = e.target.closest("[data-st]");
    if (!b) return;
    const a = b.dataset.st;
    if (a === "close") return E.stDialog.close();
    const ch = book.characters.find((c) => c.id === b.dataset.id);
    if (a === "new-char") {
      const c = normalizeCharacter({
        name: `${tr("Character", "Personaje")} ${book.characters.length + 1}`,
        art: CHAR_ART[book.characters.length % CHAR_ART.length].key,
      });
      book.characters.push(c);
      core.commit({ render: false });
      return openCharacters(E, c.id);
    }
    if (a === "edit-char") return openCharacters(E, ch.id);
    if (a === "done-char") return openCharacters(E);
    if (a === "del-char") {
      book.characters = book.characters.filter((c) => c.id !== ch.id);
      for (const p of book.pages)
        for (const el of p.elements) if (el.charId === ch.id) delete el.charId;
      core.commit({ render: true });
      return openCharacters(E);
    }
    if (a === "place") {
      const el = core.add("art", {
        art: characterArt(ch),
        alt: `${ch.name}${ch.appearance ? `. ${ch.appearance}` : ""}`,
        charId: ch.id,
        expression: ch.expression === "neutral" ? "" : ch.expression,
        x: 12 + (core.page().elements.filter((x) => x.charId).length % 3) * 28,
        y: 38,
        w: 24,
        h: 40,
      });
      E.stDialog.close();
      E.select(el.id, { focus: true });
      return E.say(`${ch.name} ${tr("is on the page.", "está en la página.")}`);
    }
    if (a === "test-voice" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Hello, I am ${ch.name}.`);
      u.rate = ch.voice.rate;
      u.pitch = ch.voice.pitch;
      speechSynthesis.speak(u);
    }
    if (a === "add-rel" && edit) {
      const other = book.characters.find((c) => c.id !== edit.id);
      edit.relationships.push({ charId: other?.id || "", label: "" });
      core.commit({ render: false });
      return openCharacters(E, edit.id);
    }
    if (a === "del-rel" && edit) {
      edit.relationships.splice(Number(b.dataset.i), 1);
      core.commit({ render: false });
      return openCharacters(E, edit.id);
    }
  };
  E.stInput = (e) => {
    const t = e.target;
    if (!t.dataset?.c || !edit) return;
    if (
      e.type === "input" &&
      !["name", "appearance", "role", "traits", "rate", "pitch"].includes(t.dataset.c) &&
      !t.dataset.c.startsWith("rel.")
    )
      return;
    const k = t.dataset.c;
    if (k === "name") edit.name = t.value.slice(0, 40);
    else if (k === "appearance") edit.appearance = t.value;
    else if (k === "role") edit.role = t.value;
    else if (k === "traits")
      edit.traits = t.value
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 6);
    else if (k === "expression") edit.expression = t.value;
    else if (k === "rate") edit.voice.rate = Number(t.value);
    else if (k === "pitch") edit.voice.pitch = Number(t.value);
    else if (k === "art") edit.art = t.value;
    else if (k.startsWith("pose.")) {
      if (t.value) edit.poses[k.slice(5)] = t.value;
      else delete edit.poses[k.slice(5)];
    } else if (k.startsWith("rel.")) {
      const [, i, f] = k.split(".");
      if (edit.relationships[Number(i)]) edit.relationships[Number(i)][f] = t.value;
    }
    const n = syncCharacter(book, edit.id);
    core.commit({ render: n > 0 || k === "art" });
    if (k === "art") {
      E.stDialog
        .querySelectorAll(".bk-art-opt")
        .forEach((l) => l.classList.toggle("is-on", l.querySelector("input").checked));
      if (n)
        E.say(
          `${n} ${tr("copies on the pages now look the same.", "copias en las páginas ahora se ven igual.")}`,
        );
    }
  };
}

// ── choices on this page ──
export function openChoices(E) {
  const tr = E.I.S;
  const { core } = E;
  const book = core.S.book;
  const page = core.page();
  const pages = book.pages.map((p, i) => [
    p.id,
    `${i === 0 ? tr("Cover", "Portada") : `${tr("Page", "Página")} ${i + 1}`}${plainText(p.elements.map((e) => e.html || "").join(" ")).slice(0, 24) ? `: ${plainText(p.elements.map((e) => e.html || "").join(" ")).slice(0, 24)}` : ""}`,
  ]);
  const items = book.story.items.map((i) => [i.id, i.name]);
  const vars = book.story.vars.map((v) => [v.id, v.name]);
  const render = () => {
    const rows = page.choices
      .map(
        (
          c,
          i,
        ) => `<li class="bk-choice" data-ci="${i}"><label class="bk-f"><span>${esc(tr("Button words", "Palabras del botón"))}</span><input data-ch="label" maxlength="120" value="${esc(c.label)}" placeholder="${esc(tr("Open the door", "Abrir la puerta"))}"></label>
        <label class="bk-f"><span>${esc(tr("Leads to", "Lleva a"))}</span><select data-ch="to">${opts(pages, c.to, tr("Choose a page…", "Elige una página…"))}</select></label>
        <div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Needs this item first (optional)", "Necesita este objeto antes (opcional)"))}</span><select data-ch="req">${opts(items, c.requires.find((r) => r.item)?.item || "", tr("nothing", "nada"))}</select></label>
        <label class="bk-f"><span>${esc(tr("Gives the reader (optional)", "Le da al lector (opcional)"))}</span><select data-ch="give">${opts(items, c.effects.find((r) => r.give)?.give || "", tr("nothing", "nada"))}</select></label>
        ${vars.length ? `<label class="bk-f"><span>${esc(tr("Adds 1 to (optional)", "Suma 1 a (opcional)"))}</span><select data-ch="add">${opts(vars, c.effects.find((r) => r.add)?.add || "", tr("nothing", "nada"))}</select></label>` : ""}</div>
        <label class="bk-f"><span>${esc(tr("If it is locked, say why", "Si está bloqueada, explica por qué"))}</span><input data-ch="locked" maxlength="160" value="${esc(c.lockedText)}"></label>
        <button type="button" class="btn small ghost" data-st="del-choice" data-i="${i}">${bkIcon("trash")} ${esc(tr("Remove this choice", "Quitar esta decisión"))}</button></li>`,
      )
      .join("");
    dlg(
      E,
      `${tr("Choices on this page", "Decisiones en esta página")}`,
      `<p class="fine">${esc(tr("Readers see these as buttons under the page. Each one leads to a page you choose. Add up to six.", "Los lectores las ven como botones debajo de la página. Cada una lleva a la página que elijas. Agrega hasta seis."))}</p>${page.choices.length ? `<ol class="bk-choices">${rows}</ol>` : `<p class="fine">${esc(tr("No choices yet. Without choices, this page just turns to the next one.", "Aún no hay decisiones. Sin decisiones, esta página pasa a la siguiente."))}</p>`}<div class="bk-btnrow"><button type="button" class="btn btn-primary" data-st="add-choice" ${page.choices.length >= 6 ? "disabled" : ""}>${bkIcon("plus")} ${esc(tr("Add a choice", "Agregar una decisión"))}</button><button type="button" class="btn" data-st="to-map">${bkIcon("map")} ${esc(tr("Story map", "Mapa del cuento"))}</button><button type="button" class="btn ghost" data-st="close">${esc(tr("Done", "Listo"))}</button></div>`,
    );
  };
  render();
  E.stClick = (e) => {
    const b = e.target.closest("[data-st]");
    if (!b) return;
    const a = b.dataset.st;
    if (a === "close") return E.stDialog.close();
    if (a === "to-map") return openStoryMap(E);
    if (a === "add-choice") {
      page.choices.push(
        normalizeChoice({ label: "", to: book.pages[core.S.pageIndex + 1]?.id || "" }),
      );
      core.commit({ render: false });
      return render();
    }
    if (a === "del-choice") {
      page.choices.splice(Number(b.dataset.i), 1);
      core.commit({ render: false });
      render();
    }
  };
  E.stInput = (e) => {
    const t = e.target;
    const row = t.closest("[data-ci]");
    if (!row || !t.dataset.ch) return;
    if (e.type === "input" && !["label", "locked"].includes(t.dataset.ch)) return;
    const c = page.choices[Number(row.dataset.ci)];
    const k = t.dataset.ch;
    if (k === "label") c.label = t.value.slice(0, 120);
    else if (k === "locked") c.lockedText = t.value;
    else if (k === "to") c.to = t.value;
    else if (k === "req") c.requires = t.value ? [{ item: t.value }] : [];
    else if (k === "give" || k === "add") {
      c.effects = c.effects.filter((x) => (k === "give" ? !x.give : !x.add));
      if (t.value) c.effects.push(k === "give" ? { give: t.value } : { add: t.value, n: 1 });
    }
    core.commit({ render: false });
  };
}

// ── clues and items, story numbers ──
export function openItems(E) {
  const tr = E.I.S;
  const { core } = E;
  const book = core.S.book;
  const render = () => {
    const items = book.story.items
      .map(
        (it, i) =>
          `<li class="bk-btnrow" data-ii="${i}"><input data-it="name" maxlength="40" value="${esc(it.name)}" aria-label="${esc(tr("Item name", "Nombre del objeto"))}"><select data-it="art" aria-label="${esc(tr("Picture", "Imagen"))}">${opts(
            ITEM_ART.map((a) => [a.key, a.key.replace(/^(obj|sci)-/, "")]),
            it.art,
            tr("no picture", "sin imagen"),
          )}</select><input data-it="alt" maxlength="160" value="${esc(it.alt)}" placeholder="${esc(tr("what it looks like", "cómo se ve"))}" aria-label="${esc(tr("Description", "Descripción"))}"><button type="button" class="bk-tbtn" data-st="del-item" data-i="${i}" aria-label="${esc(tr("Remove item", "Quitar objeto"))}">${bkIcon("trash")}</button></li>`,
      )
      .join("");
    const vars = book.story.vars
      .map(
        (v, i) =>
          `<li class="bk-btnrow" data-vi="${i}"><input data-iv="name" maxlength="30" value="${esc(v.name)}" aria-label="${esc(tr("Name", "Nombre"))}"><label class="bk-mini"><span>${esc(tr("starts at", "empieza en"))}</span><input type="number" data-iv="initial" value="${v.initial}"></label><button type="button" class="bk-tbtn" data-st="del-var" data-i="${i}" aria-label="${esc(tr("Remove", "Quitar"))}">${bkIcon("trash")}</button></li>`,
      )
      .join("");
    dlg(
      E,
      tr("Clues and items", "Pistas y objetos"),
      `<p class="fine">${esc(tr("Items are things a reader can find. A choice can need one, and a clue on a page can give one.", "Los objetos son cosas que el lector puede encontrar. Una decisión puede necesitar uno y una pista en la página puede darlo."))}</p>
      <label class="bk-f"><span>${esc(tr("Words that tell the reader what to do", "Palabras que dicen al lector qué hacer"))}</span><input data-sy="instructions" maxlength="300" value="${esc(book.story.instructions)}" placeholder="${esc(tr("Click the picture to look closely. Then choose what to do.", "Haz clic en la imagen para mirar de cerca. Luego elige qué hacer."))}"></label>
      <h3>${esc(tr("Items", "Objetos"))}</h3><ul class="bk-itemlist">${items || `<li class="fine">${esc(tr("No items yet.", "Aún no hay objetos."))}</li>`}</ul><div class="bk-btnrow"><button type="button" class="btn small" data-st="add-item" ${book.story.items.length >= 24 ? "disabled" : ""}>${bkIcon("plus")} ${esc(tr("Add an item", "Agregar un objeto"))}</button></div>
      <h3>${esc(tr("Story numbers (optional)", "Números del cuento (opcional)"))}</h3><p class="fine">${esc(tr("For example “courage” that goes up when the hero is brave.", "Por ejemplo “valentía” que sube cuando el héroe es valiente."))}</p><ul class="bk-itemlist">${vars}</ul><div class="bk-btnrow"><button type="button" class="btn small" data-st="add-var" ${book.story.vars.length >= 12 ? "disabled" : ""}>${bkIcon("plus")} ${esc(tr("Add a number", "Agregar un número"))}</button><button type="button" class="btn ghost" data-st="close">${esc(tr("Done", "Listo"))}</button></div>`,
    );
  };
  render();
  E.stClick = (e) => {
    const b = e.target.closest("[data-st]");
    if (!b) return;
    const a = b.dataset.st;
    if (a === "close") return E.stDialog.close();
    if (a === "add-item")
      book.story.items.push(
        normalizeItem({ name: `${tr("Item", "Objeto")} ${book.story.items.length + 1}` }),
      );
    else if (a === "del-item") {
      const gone = book.story.items.splice(Number(b.dataset.i), 1)[0];
      for (const p of book.pages) {
        for (const c of p.choices) {
          c.requires = c.requires.filter((r) => r.item !== gone.id);
          c.effects = c.effects.filter((x) => x.give !== gone.id && x.take !== gone.id);
        }
        for (const el of p.elements) if (el.hotspot?.give === gone.id) el.hotspot.give = "";
      }
    } else if (a === "add-var")
      book.story.vars.push({
        id: nid("v"),
        name: `${tr("number", "número")} ${book.story.vars.length + 1}`,
        initial: 0,
      });
    else if (a === "del-var") book.story.vars.splice(Number(b.dataset.i), 1);
    else return;
    core.commit({ render: false });
    render();
  };
  E.stInput = (e) => {
    const t = e.target;
    if (t.dataset.sy) {
      book.story.instructions = t.value.slice(0, 300);
      return core.commit({ render: false });
    }
    const ir = t.closest("[data-ii]");
    if (ir && t.dataset.it) {
      book.story.items[Number(ir.dataset.ii)][t.dataset.it] = t.value;
      return core.commit({ render: false });
    }
    const vr = t.closest("[data-vi]");
    if (vr && t.dataset.iv) {
      const v = book.story.vars[Number(vr.dataset.vi)];
      v[t.dataset.iv] = t.dataset.iv === "initial" ? Number(t.value) : t.value;
      core.commit({ render: false });
    }
  };
}

// ── a clickable clue on the selected object ──
export function openHotspot(E) {
  const tr = E.I.S;
  const { core } = E;
  const book = core.S.book;
  const el = core.selectedEl();
  if (!el) return E.say(tr("Select a picture first.", "Primero selecciona una imagen."));
  const hs =
    el.hotspot || normalizeHotspot({ label: el.alt || "", give: "", reveal: "", requires: [] });
  const items = book.story.items.map((i) => [i.id, i.name]);
  dlg(
    E,
    tr("Make this a clue", "Convertir en pista"),
    `<p class="fine">${esc(tr("Readers can click this object. If it gives an item, explain in your own words why it matters. The story moves on after your explanation.", "Los lectores pueden hacer clic en este objeto. Si da un objeto, explica con tus palabras por qué importa. El cuento sigue después de tu explicación."))}</p>
    <label class="bk-f"><span>${esc(tr("Name of the clue", "Nombre de la pista"))}</span><input data-hs="label" maxlength="80" value="${esc(hs.label)}"></label>
    <label class="bk-f"><span>${esc(tr("Gives the reader this item (optional)", "Le da al lector este objeto (opcional)"))}</span><select data-hs="give">${opts(items, hs.give, tr("nothing", "nada"))}</select></label>
    ${items.length ? "" : `<p class="fine">${esc(tr("Add items first under Clues and items.", "Primero agrega objetos en Pistas y objetos."))}</p>`}
    <label class="bk-f"><span>${esc(tr("Why does this clue matter? (your explanation)", "¿Por qué importa esta pista? (tu explicación)"))}</span><textarea rows="4" maxlength="600" data-hs="reveal">${esc(hs.reveal)}</textarea></label>
    <label class="bk-f"><span>${esc(tr("Reader needs this item first (optional)", "El lector necesita este objeto antes (opcional)"))}</span><select data-hs="req">${opts(items, hs.requires[0]?.item || "", tr("nothing", "nada"))}</select></label>
    <div class="bk-btnrow"><button type="button" class="btn btn-primary" data-st="save-hs">${esc(tr("Save the clue", "Guardar la pista"))}</button>${el.hotspot ? `<button type="button" class="btn ghost" data-st="rm-hs">${esc(tr("Not a clue anymore", "Ya no es una pista"))}</button>` : ""}<button type="button" class="btn ghost" data-st="close">${esc(tr("Cancel", "Cancelar"))}</button></div>`,
  );
  const draft = { ...hs, requires: [...hs.requires] };
  E.stInput = (e) => {
    const k = e.target.dataset.hs;
    if (!k) return;
    if (k === "req") draft.requires = e.target.value ? [{ item: e.target.value }] : [];
    else draft[k] = e.target.value;
  };
  E.stClick = (e) => {
    const a = e.target.closest("[data-st]")?.dataset.st;
    if (a === "close") return E.stDialog.close();
    if (a === "rm-hs") {
      core.update(el.id, { hotspot: null }, { render: true });
      delete core.selectedEl().hotspot;
      core.commit({ render: true });
      return E.stDialog.close();
    }
    if (a === "save-hs") {
      if (draft.give && !draft.reveal.trim())
        return E.say(
          tr("Explain why this clue matters first.", "Primero explica por qué importa esta pista."),
        );
      core.update(el.id, { hotspot: draft }, { render: true });
      E.stDialog.close();
      E.say(tr("Clue saved.", "Pista guardada."));
    }
  };
}

// ── the visual story map ──
export function openStoryMap(E) {
  const tr = E.I.S;
  const { core } = E;
  const book = core.S.book;
  const problems = validateStory(book);
  const pages = book.pages;
  const start =
    book.story.startPageId && pages.some((p) => p.id === book.story.startPageId)
      ? book.story.startPageId
      : pages[0].id;
  // layers by breadth-first depth from the start page
  const depth = new Map([[start, 0]]);
  const queue = [start];
  const next = (p) =>
    p.choices.length
      ? p.choices.map((c) => c.to)
      : !p.ending && pages[pages.indexOf(p) + 1]
        ? [pages[pages.indexOf(p) + 1].id]
        : [];
  while (queue.length) {
    const id = queue.shift();
    const p = pages.find((x) => x.id === id);
    if (!p) continue;
    for (const to of next(p))
      if (pages.some((x) => x.id === to) && !depth.has(to))
        (depth.set(to, depth.get(id) + 1), queue.push(to));
  }
  let extra = Math.max(0, ...depth.values()) + 1;
  for (const p of pages) if (!depth.has(p.id)) depth.set(p.id, extra++);
  const cols = new Map();
  for (const p of pages) {
    const d = depth.get(p.id);
    cols.set(d, [...(cols.get(d) || []), p.id]);
  }
  const W = 150;
  const H = 62;
  const gx = 120;
  const gy = 28;
  const pos = new Map();
  for (const [d, ids] of cols)
    ids.forEach((id, r) => pos.set(id, { x: 20 + d * (W + gx), y: 20 + r * (H + gy) }));
  const maxX = Math.max(...[...pos.values()].map((p) => p.x)) + W + 20;
  const maxY = Math.max(...[...pos.values()].map((p) => p.y)) + H + 20;
  const err = (id) => problems.some((x) => x.pageId === id && x.level === "error");
  const edges = [];
  for (const p of pages) {
    const from = pos.get(p.id);
    const targets = p.choices.length
      ? p.choices.map((c) => ({ to: c.to, label: c.label, locked: c.requires.length > 0 }))
      : !p.ending && pages[pages.indexOf(p) + 1]
        ? [{ to: pages[pages.indexOf(p) + 1].id, label: "", linear: true }]
        : [];
    for (const t of targets) {
      const to = pos.get(t.to);
      if (!to) continue;
      const x1 = from.x + W;
      const y1 = from.y + H / 2;
      const x2 = to.x;
      const y2 = to.y + H / 2;
      const back = to.x <= from.x;
      const path = back
        ? `M${from.x + W / 2} ${from.y + H} C ${from.x + W / 2} ${from.y + H + 40}, ${to.x + W / 2} ${to.y + H + 40}, ${to.x + W / 2} ${to.y + H}`
        : `M${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`;
      edges.push(
        `<path d="${path}" fill="none" stroke="${t.linear ? "#9aa3b8" : t.locked ? "#9a4a26" : "#075568"}" stroke-width="2" ${t.linear ? 'stroke-dasharray="4 4"' : ""} marker-end="url(#bkArrow)"/>${t.label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" font-size="10" text-anchor="middle" fill="#1b1f3b" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(t.label.slice(0, 22))}</text>` : ""}`,
      );
    }
  }
  const nodes = pages
    .map((p, i) => {
      const { x, y } = pos.get(p.id);
      const text = plainText(p.elements.map((e) => e.html || "").join(" ")).slice(0, 26);
      const ending = p.ending;
      return `<g class="bk-node${err(p.id) ? " has-err" : ""}" transform="translate(${x} ${y})"><rect width="${W}" height="${H}" rx="10" fill="${ending ? "#e6f0e3" : "#fff"}" stroke="${err(p.id) ? "#c2410c" : "#1b2a5c"}" stroke-width="${p.id === start ? 3 : 1.5}"/>
      <text x="10" y="20" font-size="12" font-weight="700" fill="#1b1f3b">${i === 0 ? esc(tr("Cover", "Portada")) : `${esc(tr("Page", "Página"))} ${i + 1}`}${p.id === start ? ` · ${esc(tr("start", "inicio"))}` : ""}${ending ? ` · ${esc(tr("end", "fin"))}` : ""}</text><text x="10" y="40" font-size="11" fill="#445">${esc(text)}</text><text x="10" y="55" font-size="10" fill="#075568">${p.choices.length ? `${p.choices.length} ${esc(tr("choices", "decisiones"))}` : ""}</text></g>`;
    })
    .join("");
  const pagesList = `<ul class="bk-map-list">${pages.map((p, i) => `<li><button type="button" class="btn small ${p.id === start ? "btn-primary" : "ghost"}" data-st="goto" data-i="${i}">${i === 0 ? esc(tr("Cover", "Portada")) : `${esc(tr("Page", "Página"))} ${i + 1}`}</button> <button type="button" class="linklike" data-st="set-start" data-id="${p.id}">${esc(tr("Make this the start", "Hacer que sea el inicio"))}</button></li>`).join("")}</ul>`;
  dlg(
    E,
    tr("Story map", "Mapa del cuento"),
    `<p class="fine">${esc(tr("Each box is a page. Arrows are choices. Dashed grey arrows are “turn the page”. Brown arrows need an item. A thick border marks the start.", "Cada caja es una página. Las flechas son decisiones. Las flechas grises punteadas son “pasar la página”. Las marrones necesitan un objeto. El borde grueso marca el inicio."))}</p>
    <div class="bk-map-wrap"><svg class="bk-map" role="img" aria-label="${esc(tr(`Story map with ${pages.length} pages`, `Mapa del cuento con ${pages.length} páginas`))}" viewBox="0 0 ${maxX} ${maxY}" width="${maxX}" height="${maxY}"><defs><marker id="bkArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#075568"/></marker></defs>${edges.join("")}${nodes}</svg></div>
    <details open><summary>${esc(tr("Pages (keyboard-friendly list)", "Páginas (lista para teclado)"))}</summary>${pagesList}</details>
    <h3>${esc(tr("Story check", "Revisión del cuento"))}</h3>
    ${problems.length ? `<ul class="bk-problems">${problems.map((x) => `<li class="${x.level === "error" ? "bk-warn" : "fine"}"><strong>${esc(x.level === "error" ? tr("Fix:", "Arreglar:") : tr("Tip:", "Consejo:"))}</strong> ${x.pageId ? `<button type="button" class="linklike" data-st="goto" data-i="${pages.findIndex((p) => p.id === x.pageId)}">${esc(tr("Page", "Página"))} ${pages.findIndex((p) => p.id === x.pageId) + 1}</button>: ` : ""}${esc(x.text)}</li>`).join("")}</ul>` : `<p class="fine">${bkIcon("check")} ${esc(tr("No problems found.", "No se encontraron problemas."))}</p>`}
    <div class="bk-btnrow"><a class="btn btn-primary" href="/access-practice-lab/book-studio/play/${book.id}?test=1">${bkIcon("play")} ${esc(tr("Play-test your story", "Prueba tu cuento"))}</a><button type="button" class="btn" data-st="items">${esc(tr("Clues and items", "Pistas y objetos"))}</button><button type="button" class="btn ghost" data-st="close">${esc(tr("Close", "Cerrar"))}</button></div>`,
  );
  E.stClick = (e) => {
    const b = e.target.closest("[data-st]");
    if (!b) return;
    const a = b.dataset.st;
    if (a === "close") return E.stDialog.close();
    if (a === "items") return openItems(E);
    if (a === "goto") {
      core.goPage(Number(b.dataset.i));
      E.stDialog.close();
      E.renderAll();
      return;
    }
    if (a === "set-start") {
      book.story.startPageId = b.dataset.id;
      core.commit({ render: false });
      return openStoryMap(E);
    }
  };
  E.stInput = () => {};
}
