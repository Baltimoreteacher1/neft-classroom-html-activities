// /family/story: the family's own page for a Family Language Story. No account, no sign-in. A teacher's link opens it
// (the story rides in the URL fragment); the page keeps that story on this phone so a refresh or an offline visit still
// works, and lets the family hear it, print it as a fridge card, mark a talk "we tried it" and send a note back the way
// they already talk with the class. It never sends anything itself. Contract: src/family/story/link.js.
import { qrSvg } from "../../../../shared/qr/qr-code.mjs";
import { i18nFor } from "../../i18n.js";
import { announce, copyText, html, icon } from "../../util.js";
import { stop } from "../../speech.js";
import { crumbs } from "../ui.js";
import { decodeStory, fitsQr, storyUrl } from "./link.js";
import { listenStory } from "./audio.js";
import { compose, replyMessage } from "./model.js";
import { replyHTML, storyHTML } from "./render.js";
import { clearSaved, loadSaved, loadTries, saveStory, saveTries } from "./store.js";

let story = null;
let confirmForget = false;

/** Pick a story out of the address fragment (then clear it from the address bar) or from this phone. */
function ingest(ctx) {
  const frag = location.hash;
  if (frag.startsWith("#1&")) {
    const fromLink = decodeStory(frag);
    // Clear the address right away: the fragment holds the child's first name and a quote.
    history.replaceState(history.state, "", location.pathname + location.search);
    if (fromLink) {
      story = fromLink;
      saveStory(story);
      // A family that never chose a language opens the page in the teacher's choice. Choosing one later always wins.
      if (!ctx.prefs.langChosen && ctx.prefs.lang !== story.l) ctx.setPrefs({ lang: story.l });
    }
  }
  story ||= loadSaved();
}

function emptyHTML(I, bad) {
  return html`<section class="fls fls-empty panel" aria-labelledby="flsTitle">
    <h1 id="flsTitle" tabindex="-1">
      ${I.T("Your child’s Language Story", "La historia de lenguaje de su hijo o hija")}
    </h1>
    <p class="lead">
      ${I.T("Your teacher can send you a short note about what your child practiced, with ideas for talking together at home.", "Su maestro o maestra puede enviarles una nota corta sobre lo que practicó su estudiante, con ideas para conversar en casa.")}
    </p>
    <ol class="fls-steps">
      <li>
        ${I.T("Open the link or scan the code your teacher sent.", "Abran el enlace o escaneen el código que envió su maestro o maestra.")}
      </li>
      <li>${I.T("Or paste the link here.", "O peguen el enlace aquí.")}</li>
    </ol>
    <label class="field"
      ><span>${I.T("Link from your teacher", "Enlace de su maestro o maestra")}</span>
      <input type="url" inputmode="url" autocomplete="off" data-fls-paste data-nsr-ignore
    /></label>
    <button type="button" class="btn btn-primary" data-fls-open>
      ${icon("arrow-right")} ${I.T("Open my note", "Abrir mi nota")}
    </button>
    <p class="fls-bad" role="status" aria-live="polite">
      ${bad ? I.T("That link did not work. Ask your teacher to send it again.", "Ese enlace no funcionó. Pidan a su maestro o maestra que lo envíe de nuevo.") : ""}
    </p>
    <p class="fine">
      ${I.T("Nothing about your child is stored on a server. A note stays on this phone only.", "No se guarda nada de su estudiante en un servidor. La nota se queda solo en este teléfono.")}
    </p>
  </section>`;
}

const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

export async function render(ctx, I0) {
  ingest(ctx);
  // A link may just have changed the language mode; read it again.
  const I = i18nFor(ctx) || I0;
  const title = I.LS("nav.family.home");
  if (!story)
    return {
      title,
      html: html`${crumbs(I, I.S("Language Story", "Historia de lenguaje"))}${emptyHTML(I, false)}`,
    };
  const c = compose(story);
  const tries = loadTries(story);
  const url = storyUrl(story, { origin: location.origin, short: true });
  const qr = fitsQr(url) ? qrSvg(url, { px: 120 }) : "";
  const reply = Object.keys(tries.ticks).length
    ? replyHTML(I, tries, replyMessage(story, tries), { canShare: canShare() })
    : "";
  return {
    title: c.title[I.spanish ? "es" : "en"],
    html: html`${crumbs(I, I.S("Language Story", "Historia de lenguaje"))}
      ${storyHTML(I, c, tries, { qr, fromLink: true, reply })}
      <div class="fls-tools no-print">
        <button type="button" class="btn" data-fls-print>
          ${icon("print")} ${I.T("Print this page", "Imprimir esta página")}
        </button>
        <button type="button" class="btn ghost" data-fls-forget>
          ${icon("x")}
          ${confirmForget ? I.T("Tap again to remove", "Toquen otra vez para quitar") : I.T("Remove from this phone", "Quitar de este teléfono")}
        </button>
      </div>`,
  };
}

export function unmount() {
  stop();
  confirmForget = false;
}

function listenAll(ctx, I) {
  if (!story) return;
  stop();
  listenStory(story, I, {
    rate: ctx.prefs.rate,
    onNoSpanishVoice: () =>
      announce(I.S("This phone has no Spanish voice. Read the Spanish on the screen.", "Este teléfono no tiene voz en español. Lean el español en la pantalla.")),
  });
}

function pasted() {
  const value = document.querySelector("[data-fls-paste]")?.value || "";
  const at = value.indexOf("#");
  const found = decodeStory(at >= 0 ? value.slice(at) : value.trim());
  if (found) {
    story = found;
    saveStory(story);
  }
  return found;
}

function tell(text) {
  const live = document.querySelector("[data-fls-status]");
  if (live) live.textContent = text;
  else announce(text);
}

function refreshMessage() {
  const tries = loadTries(story);
  document.querySelector("[data-fls-message]")?.replaceChildren(replyMessage(story, tries));
  document
    .querySelectorAll("[data-fls-how]")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.flsHow === tries.how)));
}

export function onClick(e, ctx, I) {
  const t = e.target.closest(
    "[data-fls-listen],[data-fls-try],[data-fls-how],[data-fls-send],[data-fls-copy],[data-fls-print],[data-fls-forget],[data-fls-open]",
  );
  if (!t) return false;
  if (t.hasAttribute("data-fls-listen")) listenAll(ctx, I);
  else if (t.hasAttribute("data-fls-open")) {
    if (pasted()) ctx.rerender();
    else
      document.querySelector(".fls-bad").textContent = I.S(
        "That link did not work. Ask your teacher to send it again.",
        "Ese enlace no funcionó. Pidan a su maestro o maestra que lo envíe de nuevo.",
      );
  } else if (!story) return false;
  else if (t.hasAttribute("data-fls-try")) {
    const tries = loadTries(story);
    const id = t.dataset.flsTry;
    if (tries.ticks[id]) delete tries.ticks[id];
    else tries.ticks[id] = true;
    saveTries(story, tries);
    announce(
      tries.ticks[id]
        ? I.S("Marked. Thank you for talking together.", "Marcado. Gracias por conversar juntos.")
        : I.S("Mark removed.", "Marca quitada."),
    );
    ctx.rerender();
  } else if (t.hasAttribute("data-fls-how")) {
    saveTries(story, { ...loadTries(story), how: t.dataset.flsHow });
    refreshMessage();
  } else if (t.hasAttribute("data-fls-copy")) {
    const text = replyMessage(story, loadTries(story));
    copyText(text).then((ok) =>
      tell(
        I,
        ok
          ? I.S(
              "Note copied. Paste it to your teacher.",
              "Nota copiada. Péguenla para su maestro o maestra.",
            )
          : text,
      ),
    );
  } else if (t.hasAttribute("data-fls-send")) {
    navigator.share({ text: replyMessage(story, loadTries(story)) }).catch(() => {});
  } else if (t.hasAttribute("data-fls-print")) window.print();
  else if (t.hasAttribute("data-fls-forget")) {
    if (!confirmForget) {
      confirmForget = true;
      ctx.rerender();
      return true;
    }
    confirmForget = false;
    clearSaved();
    story = null;
    announce(I.S("Removed from this phone.", "Quitado de este teléfono."));
    ctx.rerender();
  }
  return true;
}

export function onChange(e) {
  if (!story || !e.target.matches?.("[data-fls-both]")) return false;
  saveTries(story, { ...loadTries(story), both: e.target.checked });
  document
    .querySelector("[data-fls-message]")
    ?.replaceChildren(replyMessage(story, loadTries(story)));
  return true;
}
