// Book Studio 2.0 · what a learner sees: the language-support tray, support cards of every type, the vocabulary popover.
// One host is used by the editor, the "Preview as student" panes and the reader, so a teacher previews exactly what
// the learner gets. The host never talks to a network and never writes student text on its own: a starter is only
// inserted when the learner presses its button, and a revision only replaces text when the learner chooses to.
import * as rec from "../../recorder.js";
import * as db from "../db.js";
import { bkIcon } from "../icons.js";
import { esc } from "../render.js";
import { markVocab } from "./vocab-mark.js";
import { plainText } from "../model.js";
import { resolveSupports, SUPPORT_TYPES, targets } from "./supports.js";
import { addRevision, record } from "./work.js";

const TYPE_ICON = {
  vocab: "text",
  frame: "bubble",
  organizer: "panel",
  rehearsal: "mic",
  reading: "book",
  revision: "draw",
  model: "lightbulb",
  note: "feedback",
};

const BLANK = /(___+)/g;
/** A frame with its blanks drawn as visible gaps (the learner fills them in their own words). */
const frameHTML = (t) =>
  esc(t).replace(
    BLANK,
    '<span class="bk-blank" aria-label="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
  );

export function speak(text, { lang = "en", rate = 1, voice = null } = {}) {
  if (!("speechSynthesis" in window) || !text) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-US" : lang || "en-US";
  u.rate = rate;
  if (voice?.rate) u.rate = voice.rate;
  if (voice?.pitch) u.pitch = voice.pitch;
  speechSynthesis.speak(u);
  return true;
}

/** Every vocabulary entry the learner has available on this page (assigned or on demand). */
export function vocabIndex(resolved) {
  const map = new Map();
  for (const { support } of resolved)
    if (support.type === "vocab")
      for (const w of support.content.words)
        if (w.w) map.set(w.w.toLowerCase(), { ...w, supportId: support.id });
  return map;
}

/**
 * host = {
 *   I, getBook(), audience() -> { profile, plan, records, mode },
 *   getWork(), setWork(fn), insertText(support, text), onRecorded?(blob) -> mediaId, sandbox: boolean
 * }
 */
export function createSupportHost(host) {
  const tr = (en, es) => host.I.S(en, es ?? en);
  const lang = () => (host.I.spanish ? "es" : "en");
  const ui = { open: new Set(), help: false, recording: "", takes: {} };
  let cardNo = 0;

  const log = (support, action, target = "") => {
    if (!support.evidence && action !== "hidden") return;
    host.setWork((w) => record(w, support.id, action, { target }));
  };
  const find = (id) => host.getBook().supports.find((s) => s.id === id);
  const work = () => host.getWork();

  // ── card bodies ──
  function vocabBody(s) {
    const showTr = s.translate || s.kind === "bilingual" || s.kind === "multilingual";
    const code = s.displayLang && s.displayLang !== "en" ? s.displayLang : "es";
    return `<ul class="bk-sp-words">${s.content.words
      .map((w, i) => {
        const t = w.tr?.[code] || Object.values(w.tr || {})[0] || "";
        return `<li><button type="button" class="bk-sp-word" data-sp="word" data-id="${s.id}" data-i="${i}">${w.art ? `<img alt="" src="${artUrl(w.art)}" />` : ""}<strong>${esc(w.w)}</strong>${showTr && t ? `<span lang="${esc(code)}">${esc(t)}${w.mt ? ` <em>${esc(tr("(machine translation)", "(traducción automática)"))}</em>` : ""}</span>` : ""}</button></li>`;
      })
      .join(
        "",
      )}</ul><p class="fine">${esc(tr("Tap a word to see it, hear it and use it.", "Toca una palabra para verla, oírla y usarla."))}</p>`;
  }

  function frameBody(s) {
    const c = s.content;
    const frames = c.frames
      .map(
        (f, i) =>
          `<li><button type="button" class="bk-sp-frame" data-sp="frame" data-id="${s.id}" data-i="${i}" aria-label="${esc(tr("Use this starter:", "Usar este inicio:"))} ${esc(f.replace(BLANK, "…"))}">${frameHTML(f)}</button>${s.audio ? `<button type="button" class="bk-sp-hear" data-sp="hear-frame" data-id="${s.id}" data-i="${i}" aria-label="${esc(tr("Hear it", "Escucharlo"))}">${bkIcon("speaker")}</button>` : ""}</li>`,
      )
      .join("");
    const bank = c.bank.length
      ? `<ul class="bk-sp-bank" aria-label="${esc(tr("Word bank", "Banco de palabras"))}">${c.bank.map((w, i) => `<li><button type="button" data-sp="bank" data-id="${s.id}" data-i="${i}">${esc(w)}</button></li>`).join("")}</ul>`
      : "";
    const table = c.table.length
      ? `<div class="bk-sp-table" role="group" aria-label="${esc(tr("Substitution table", "Tabla de sustitución"))}">${c.table.map((col, ci) => `<ul>${col.map((w, i) => `<li><button type="button" data-sp="cell" data-id="${s.id}" data-c="${ci}" data-i="${i}">${esc(w)}</button></li>`).join("")}</ul>`).join("")}</div>`
      : "";
    return `${frames ? `<ul class="bk-sp-frames">${frames}</ul>` : ""}${bank}${table}`;
  }

  function organizerBody(s) {
    const vals = work().organizers[s.id] || {};
    return `<div class="bk-sp-org bk-org-${s.content.layout}">${s.content.cells
      .map(
        (c) =>
          `<label class="bk-sp-cell"><span>${esc(c.label)}</span>${c.prompt ? `<small>${esc(c.prompt)}</small>` : ""}<textarea rows="2" maxlength="300" data-sp-org="${s.id}" data-cell="${c.id}">${esc(vals[c.id] || "")}</textarea></label>`,
      )
      .join("")}</div>`;
  }

  function rehearsalBody(s) {
    const c = s.content;
    const saved = work().rehearsals[s.id] || {};
    const url = ui.takes[s.id] || (saved.media ? db.cachedUrl(saved.media) : "");
    const rec1 = ui.recording === s.id;
    return `${c.prompt ? `<p>${esc(c.prompt)}</p>` : ""}${c.steps.length ? `<ol class="bk-sp-steps">${c.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}${c.model ? `<p class="bk-sp-model"><button type="button" class="btn small" data-sp="hear-model" data-id="${s.id}">${bkIcon("speaker")} ${esc(tr("Hear a model", "Escuchar un modelo"))}</button> <em>${esc(c.model)}</em></p>` : ""}
      <div class="bk-sp-rec">${
        rec.canRecord()
          ? `<button type="button" class="btn small ${rec1 ? "danger" : "btn-primary"}" data-sp="${rec1 ? "rec-stop" : "rec-start"}" data-id="${s.id}" aria-pressed="${rec1}">${bkIcon(rec1 ? "stop" : "mic")} ${esc(rec1 ? tr("Stop", "Detener") : tr("Record", "Grabar"))}</button>`
          : `<span class="fine">${esc(tr("Recording is not available on this device. Use the box below instead.", "No se puede grabar en este dispositivo. Usa el cuadro de abajo."))}</span>`
      }${url ? `<audio controls src="${url}" data-sp-audio="${s.id}" aria-label="${esc(tr("Your recording", "Tu grabación"))}"></audio><label class="bk-sp-rate">${esc(tr("Speed", "Velocidad"))} <select data-sp-rate="${s.id}"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option></select></label>` : ""}</div>
      ${c.allowText ? `<label class="bk-sp-plan"><span>${esc(tr("Or type what you will say", "O escribe lo que dirás"))}</span><textarea rows="2" maxlength="600" data-sp-rtext="${s.id}">${esc(saved.text || "")}</textarea></label>` : ""}`;
  }

  function readingBody(s) {
    const c = s.content;
    const book = host.getBook();
    const bits = [];
    if (["readAloud", "readAlong", "chunked", "sideBySide", "inContext"].includes(s.kind))
      bits.push(
        `<button type="button" class="btn small btn-primary" data-sp="read-page" data-id="${s.id}">${bkIcon("speaker")} ${esc(tr("Read this page to me", "Léeme esta página"))}</button> <label class="bk-sp-rate">${esc(tr("Speed", "Velocidad"))} <select data-sp-speed><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option></select></label>`,
      );
    for (const [i, p] of c.prompts.entries())
      bits.push(
        `<label class="bk-sp-q"><span>${esc(p)}</span><textarea rows="2" maxlength="600" data-sp-note="${s.id}" data-i="${i}">${esc(work().notes[`${s.id}`]?.[`q${i}`] || "")}</textarea></label>`,
      );
    if (c.highlights.length)
      bits.push(
        `<p class="fine">${esc(tr("Look for:", "Busca:"))} ${c.highlights.map((h) => `<mark>${esc(h)}</mark>`).join(", ")}</p>`,
      );
    void book;
    return bits.join("");
  }

  function revisionBody(s, pageId) {
    const el = pickTextEl(host.getBook(), s, pageId);
    const original = el ? plainText(el.html) : "";
    const trail = work()
      .revisions.filter((r) => r.elementId === el?.id)
      .at(-1);
    return `${s.content.prompts.map((p) => `<p class="bk-sp-prompt">${esc(p)}</p>`).join("")}
      ${
        el
          ? `<div class="bk-sp-compare"><section aria-label="${esc(tr("My original", "Mi original"))}"><h4>${esc(tr("My original", "Mi original"))}</h4><p>${esc(original) || `<em>${esc(tr("(empty)", "(vacío)"))}</em>`}</p></section>
        <section aria-label="${esc(tr("My revision", "Mi revisión"))}"><h4>${esc(tr("My revision", "Mi revisión"))}</h4><textarea rows="3" maxlength="1200" data-sp-rev="${s.id}" data-el="${el.id}">${esc(trail?.after || "")}</textarea></section></div>
        <label class="bk-sp-q"><span>${esc(tr("What did you change, and why?", "¿Qué cambiaste y por qué?"))}</span><input data-sp-revnote="${s.id}" maxlength="300" value="${esc(trail?.note || "")}"></label>
        <div class="bk-btnrow"><button type="button" class="btn small btn-primary" data-sp="rev-apply" data-id="${s.id}" data-el="${el.id}">${esc(tr("Use my revision on the page", "Usar mi revisión en la página"))}</button><button type="button" class="btn small ghost" data-sp="rev-keep" data-id="${s.id}">${esc(tr("Keep my original", "Conservar mi original"))}</button></div><p class="fine">${esc(tr("Nothing changes on your page until you press the button. Your original is kept.", "Nada cambia en tu página hasta que presiones el botón. Se conserva tu original."))}</p>`
          : `<p class="fine">${esc(tr("Pick a text box on the page to revise.", "Elige un cuadro de texto de la página para revisar."))}</p>`
      }`;
  }

  const bodies = {
    vocab: vocabBody,
    frame: frameBody,
    organizer: organizerBody,
    rehearsal: rehearsalBody,
    reading: readingBody,
    revision: revisionBody,
    model: (s) =>
      `<blockquote class="bk-sp-modeltext">${esc(s.content.text)}</blockquote>${s.content.note ? `<p class="fine">${esc(s.content.note)}</p>` : ""}<button type="button" class="btn small" data-sp="hear-model-text" data-id="${s.id}">${bkIcon("speaker")} ${esc(tr("Hear it", "Escucharlo"))}</button>`,
    note: (s) => `<p>${esc(s.content.text)}</p>`,
  };

  function cardHTML(r, pageId) {
    const s = r.support;
    const open =
      ui.open.has(s.id) ||
      (r.required && !ui.open.has(`closed:${s.id}`) && ui.open.size === 0 && false);
    const id = `bkSp${++cardNo}`;
    const done = work().records.some((x) => x.supportId === s.id && x.action === "completed");
    const body = (bodies[s.type] || bodies.note)(s, pageId);
    const intro = s.studentInstructions
      ? `<p class="bk-sp-intro">${esc(s.studentInstructions)}</p>`
      : "";
    const cue = s.cue ? `<img class="bk-sp-cue" alt="" src="${artUrl(s.cue)}" />` : "";
    return `<article class="bk-sp-card is-${s.type}${r.required ? " is-required" : ""}${done ? " is-done" : ""}" data-sp-card="${s.id}">
      <header><button type="button" class="bk-sp-head" data-sp="toggle" data-id="${s.id}" aria-expanded="${open}" aria-controls="${id}">${bkIcon(TYPE_ICON[s.type] || "support")}<span class="bk-sp-title">${esc(s.title)}</span>${r.required ? `<span class="bk-sp-tag">${esc(tr("Required", "Requerido"))}</span>` : ""}${done ? `<span class="bk-sp-tag ok">${bkIcon("check")} ${esc(tr("Done", "Listo"))}</span>` : ""}</button></header>
      <div class="bk-sp-body" id="${id}" ${open ? "" : "hidden"}>${cue}${intro}${body}
        <div class="bk-btnrow bk-sp-foot">${s.audio || s.type === "reading" ? `<button type="button" class="btn small ghost" data-sp="hear-title" data-id="${s.id}">${bkIcon("speaker")} ${esc(tr("Hear the directions", "Escuchar las instrucciones"))}</button>` : ""}<button type="button" class="btn small" data-sp="done" data-id="${s.id}">${bkIcon("check")} ${esc(tr("I finished this", "Terminé esto"))}</button>${s.canHide && !r.required ? `<button type="button" class="btn small ghost" data-sp="hide" data-id="${s.id}">${esc(tr("Hide this help", "Ocultar esta ayuda"))}</button>` : ""}</div></div></article>`;
  }

  const hiddenIds = () =>
    new Set(
      work()
        .records.filter((r) => r.action === "hidden")
        .map((r) => r.supportId),
    );

  /** The tray for one page. Empty string when this learner has nothing assigned and no help to offer. */
  function trayHTML(pageId) {
    const aud = host.audience();
    const book = host.getBook();
    const records = work().records;
    const resolved = resolveSupports(book, { ...aud, records }, { pageId });
    const hidden = hiddenIds();
    const assigned = resolved.filter((r) => r.tier === "assigned" && !hidden.has(r.support.id));
    const help = resolved.filter(
      (r) =>
        r.tier === "help" || (r.tier === "assigned" && hidden.has(r.support.id) && !r.required),
    );
    if (!assigned.length && !help.length) return "";
    return `<section class="bk-sp-tray" aria-label="${esc(tr("Language support", "Apoyo de lenguaje"))}" data-sp-tray>
      <header class="bk-sp-tray-head"><h3>${bkIcon("support")} ${esc(tr("Language help", "Ayuda de lenguaje"))}</h3>${help.length ? `<button type="button" class="btn small ghost" data-sp="help-toggle" aria-expanded="${ui.help}">${esc(tr("Need more help?", "¿Necesitas más ayuda?"))}</button>` : ""}</header>
      <div class="bk-sp-cards">${assigned.map((r) => cardHTML(r, pageId)).join("") || `<p class="fine">${esc(tr("Open Need more help? any time.", "Abre ¿Necesitas más ayuda? cuando quieras."))}</p>`}</div>
      ${ui.help && help.length ? `<div class="bk-sp-cards bk-sp-more">${help.map((r) => cardHTML(r, pageId)).join("")}</div>` : ""}</section>`;
  }

  // ── vocabulary popover (compact, never a full-screen window) ──
  function closePop() {
    document.querySelector(".bk-vpop")?.remove();
  }
  function wordPopover(anchor, entry, page) {
    closePop();
    const sentence = page ? sentenceWith(page, entry.w) : "";
    const code = "es";
    const t = entry.tr?.[code] || Object.values(entry.tr || {})[0] || "";
    const s = find(entry.supportId);
    const showTr = s && (s.translate || s.kind === "bilingual" || s.kind === "multilingual");
    const pop = document.createElement("div");
    pop.className = "bk-vpop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", `${tr("Word", "Palabra")}: ${entry.w}`);
    pop.innerHTML = `${entry.art ? `<img alt="" src="${artUrl(entry.art)}" />` : ""}<div><strong>${esc(entry.w)}</strong>
      <button type="button" class="bk-sp-hear" data-vp="hear" aria-label="${esc(tr("Hear the word", "Escuchar la palabra"))}">${bkIcon("speaker")}</button>
      ${entry.def ? `<p>${esc(entry.def)}</p>` : ""}${showTr && t ? `<p lang="${code}"><span class="fine">${esc(tr("In Spanish:", "En español:"))}</span> ${esc(t)}${entry.mt ? ` <em>${esc(tr("(machine translation, may be wrong)", "(traducción automática, puede estar mal)"))}</em>` : ""}</p>` : ""}
      ${sentence ? `<p class="bk-vpop-sent"><span class="fine">${esc(tr("In the story:", "En el cuento:"))}</span> “${esc(sentence)}” <button type="button" class="bk-sp-hear" data-vp="hear-sentence" aria-label="${esc(tr("Hear the sentence", "Escuchar la oración"))}">${bkIcon("speaker")}</button></p>` : ""}
      ${entry.example ? `<p class="fine">${esc(entry.example)}</p>` : ""}
      <label class="bk-sp-q"><span>${esc(tr("Try it in your own sentence", "Pruébala en tu propia oración"))}</span><input data-vp="own" maxlength="240"></label>
      <button type="button" class="btn small" data-vp="save">${esc(tr("Add to my words", "Agregar a mis palabras"))}</button> <button type="button" class="btn small ghost" data-vp="close">${esc(tr("Close", "Cerrar"))}</button></div>`;
    document.body.append(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = `${Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left + window.scrollX))}px`;
    pop.style.top = `${r.bottom + window.scrollY + 6}px`;
    log(find(entry.supportId) || { id: "", evidence: false }, "opened");
    pop.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-vp]")?.dataset.vp;
      if (act === "close") {
        closePop();
        anchor.focus?.();
      } else if (act === "hear") {
        if (entry.media) {
          const u = await db.mediaUrl(entry.media).catch(() => "");
          if (u) return void new Audio(u).play();
        }
        if (!speak(entry.w, { lang: "en" }))
          host.say(
            tr(
              "Audio is not available on this device.",
              "El audio no está disponible en este dispositivo.",
            ),
          );
      } else if (act === "hear-sentence") speak(sentence, { lang: "en" });
      else if (act === "save") {
        const own = pop.querySelector('[data-vp="own"]').value.trim();
        host.setWork((w) => ({
          ...w,
          words: [
            ...w.words.filter((x) => x.w !== entry.w),
            { w: entry.w, def: entry.def, sentence: own },
          ].slice(0, 80),
        }));
        if (s) log(s, "used");
        host.say(tr("Added to your words.", "Agregada a tus palabras."));
        closePop();
      }
    });
    pop.addEventListener("keydown", (e) => e.key === "Escape" && (closePop(), anchor.focus?.()));
    pop.querySelector("button")?.focus();
  }

  // ── events ──
  async function onClick(e, pageId) {
    const vw = e.target.closest("[data-vw]");
    if (vw) {
      const entry = vocabIndex(
        resolveSupports(
          host.getBook(),
          { ...host.audience(), records: work().records },
          { pageId },
        ),
      ).get(vw.dataset.vw);
      if (entry)
        wordPopover(
          vw,
          entry,
          host.getBook().pages.find((p) => p.id === pageId),
        );
      return true;
    }
    const b = e.target.closest("[data-sp]");
    if (!b) return false;
    const act = b.dataset.sp;
    const s = find(b.dataset.id);
    const i = Number(b.dataset.i);
    if (act === "help-toggle") {
      ui.help = !ui.help;
      return (host.refresh(), true);
    }
    if (act === "toggle" && s) {
      ui.open.has(s.id) ? ui.open.delete(s.id) : ui.open.add(s.id);
      if (ui.open.has(s.id)) log(s, "opened");
      return (host.refresh(), true);
    }
    if (!s) return false;
    if (act === "word") {
      const entry = { ...s.content.words[i], supportId: s.id };
      wordPopover(
        b,
        entry,
        host.getBook().pages.find((p) => p.id === pageId),
      );
    } else if (act === "frame" || act === "bank" || act === "cell") {
      const text =
        act === "frame"
          ? s.content.frames[i]
          : act === "bank"
            ? s.content.bank[i]
            : s.content.table[Number(b.dataset.c)][i];
      host.insertText(s, act === "frame" ? text : `${text} `);
      log(s, "used");
      host.say(tr("Added. Finish it in your own words.", "Agregado. Termínalo con tus palabras."));
    } else if (act === "hear-frame")
      speak(s.content.frames[i].replace(BLANK, " … "), { lang: "en" });
    else if (act === "hear-title")
      speak([s.title, s.studentInstructions].filter(Boolean).join(". "), {
        lang: s.displayLang === "es" ? "es" : "en",
      }) ||
        host.say(
          tr(
            "Audio is not available on this device.",
            "El audio no está disponible en este dispositivo.",
          ),
        );
    else if (act === "hear-model") speak(s.content.model, { lang: "en" });
    else if (act === "hear-model-text") speak(s.content.text, { lang: "en" });
    else if (act === "read-page") {
      const page = host.getBook().pages.find((p) => p.id === pageId);
      const speed = Number(b.closest(".bk-sp-body").querySelector("[data-sp-speed]")?.value || 1);
      const text = page
        ? page.elements
            .map((x) => plainText(x.html || ""))
            .filter(Boolean)
            .join(". ")
        : "";
      if (!speak(text, { lang: host.getBook().lang === "es" ? "es" : "en", rate: speed }))
        host.say(
          tr(
            "Read-aloud is not available on this device.",
            "La lectura en voz alta no está disponible en este dispositivo.",
          ),
        );
      log(s, "used");
    } else if (act === "rec-start") {
      ui.recording = s.id;
      host.refresh();
      try {
        await rec.start(`support:${s.id}`, {
          maxSeconds: 120,
          onStop: async (takes) => {
            ui.recording = "";
            const take = takes.at(-1);
            if (take?.blob) {
              if (host.sandbox) ui.takes[s.id] = take.url;
              else {
                const mid = await db.putMedia(host.getBook().id, take.blob, {
                  name: `rehearsal.${take.extension}`,
                  kind: "audio",
                });
                await db.mediaUrl(mid);
                host.setWork((w) => ({
                  ...w,
                  rehearsals: {
                    ...w.rehearsals,
                    [s.id]: {
                      ...(w.rehearsals[s.id] || {}),
                      media: mid,
                      at: new Date().toISOString(),
                    },
                  },
                }));
              }
              log(s, "used");
            }
            host.refresh();
          },
        });
      } catch {
        ui.recording = "";
        host.say(
          tr(
            "The microphone is not available. Type your plan in the box instead.",
            "El micrófono no está disponible. Escribe tu plan en el cuadro.",
          ),
        );
        host.refresh();
      }
    } else if (act === "rec-stop") rec.stop();
    else if (act === "done") {
      log(s, "completed");
      host.say(tr("Marked as finished.", "Marcado como terminado."));
      host.refresh();
    } else if (act === "hide") {
      log(s, "hidden");
      host.say(
        tr(
          "Hidden. Find it again under Need more help?",
          "Oculta. Búscala de nuevo en ¿Necesitas más ayuda?",
        ),
      );
      host.refresh();
    } else if (act === "rev-apply") {
      const ta = b.closest(".bk-sp-body").querySelector("[data-sp-rev]");
      const note = b.closest(".bk-sp-body").querySelector("[data-sp-revnote]")?.value || "";
      const el = host
        .getBook()
        .pages.flatMap((p) => p.elements)
        .find((x) => x.id === b.dataset.el);
      const after = ta.value.trim();
      if (!el || !after)
        return (host.say(tr("Write your revision first.", "Escribe primero tu revisión.")), true);
      const before = plainText(el.html);
      const pageOf = host.getBook().pages.find((p) => p.elements.includes(el));
      host.setWork((w) =>
        addRevision(w, {
          elementId: el.id,
          pageId: pageOf?.id || "",
          before,
          after,
          by: "student",
          supportIds: [s.id],
          note,
        }),
      );
      host.applyText(el.id, after);
      log(s, "used");
      host.say(
        tr(
          "Your revision is on the page. Your original is saved in your history.",
          "Tu revisión está en la página. Tu original está guardado en tu historial.",
        ),
      );
    } else if (act === "rev-keep") {
      log(s, "completed");
      host.say(tr("Kept your original.", "Se conservó tu original."));
    }
    return true;
  }

  function onInput(e) {
    const t = e.target;
    if (t.matches("[data-sp-org]")) {
      host.setWork(
        (w) => ({
          ...w,
          organizers: {
            ...w.organizers,
            [t.dataset.spOrg]: {
              ...(w.organizers[t.dataset.spOrg] || {}),
              [t.dataset.cell]: t.value.slice(0, 300),
            },
          },
        }),
        { quiet: true },
      );
      const s = find(t.dataset.spOrg);
      if (s) log(s, "used");
      return true;
    }
    if (t.matches("[data-sp-rtext]")) {
      host.setWork(
        (w) => ({
          ...w,
          rehearsals: {
            ...w.rehearsals,
            [t.dataset.spRtext]: {
              ...(w.rehearsals[t.dataset.spRtext] || {}),
              text: t.value.slice(0, 600),
            },
          },
        }),
        { quiet: true },
      );
      return true;
    }
    if (t.matches("[data-sp-note]")) {
      host.setWork(
        (w) => ({
          ...w,
          notes: {
            ...w.notes,
            [t.dataset.spNote]: {
              ...(w.notes[t.dataset.spNote] || {}),
              [`q${t.dataset.i}`]: t.value.slice(0, 600),
            },
          },
        }),
        { quiet: true },
      );
      return true;
    }
    return false;
  }

  function onChange(e) {
    const t = e.target;
    if (t.matches("[data-sp-rate]")) {
      const a = t.closest(".bk-sp-body").querySelector("audio");
      if (a) a.playbackRate = Number(t.value);
      return true;
    }
    return false;
  }

  return {
    trayHTML,
    onClick,
    onInput,
    onChange,
    closePop,
    ui,
    vocabFor: (pageId) => [
      ...vocabIndex(
        resolveSupports(
          host.getBook(),
          { ...host.audience(), records: work().records },
          { pageId },
        ),
      ).keys(),
    ],
  };
}

function pickTextEl(book, support, pageId) {
  const page = book.pages.find((p) => p.id === (support.target.pageId || pageId));
  const els = (page?.elements || []).filter(
    (e) => (e.type === "text" || e.type === "bubble") && plainText(e.html),
  );
  return els.find((e) => e.id === support.target.elementId) || els[0] || null;
}

function sentenceWith(page, word) {
  const text = page.elements.map((e) => plainText(e.html || "")).join(" ");
  const re = new RegExp(
    `(?<![\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`,
    "iu",
  );
  return (text.match(/[^.!?]+[.!?]?/g) || []).map((s) => s.trim()).find((s) => re.test(s)) || "";
}

import { artSrc } from "../render.js";
function artUrl(key) {
  return artSrc(key);
}

export { targets, SUPPORT_TYPES, markVocab };
