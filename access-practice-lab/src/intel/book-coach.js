// "Language coach for this page" in the Book Studio reader: the Language Intelligence loop (ui.js) for the words on
// one page of the learner's own book. It reads the page; it never changes the book. The learner may copy their own
// revision and paste it into the editor themselves. No AI is needed: the feedback is the lab's rule-based engine.
// Books made before this existed open exactly as before; the coach only appears when its button is pressed.
import { pageSpeech } from "../book/model.js";
import { toHtml } from "../util.js";
import { getLoop, listLoops, loadIntel, nextStage } from "./loop.js";
import { loopPanelHTML, onLoopClick, onLoopInput, startTextLoop } from "./ui.js";

const KEY_USE = { narrative: "Narrate", picture: "Narrate", comic: "Narrate", audio: "Narrate", report: "Inform", informational: "Inform", bilingual: "Inform" };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The words a reader sees on one page, in reading order. */
export const pageWords = (book, index) =>
  pageSpeech(book.pages[index] || { elements: [] }, book.dir)
    .map((t) => t.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * @param {{box:HTMLElement, ctx:object, book:object, I:object, say:(msg:string)=>void}} host
 * @returns {{open:(pageIndex:number)=>void, onClick:(e:Event)=>boolean, onInput:(e:Event)=>boolean}}
 */
export function createBookCoach({ box, ctx, book, I, say }) {
  let loopId = "";
  const cctx = {
    get band() {
      return ctx.band;
    },
    get prefs() {
      return ctx.prefs;
    },
    get route() {
      return ctx.route;
    },
    rerender: () => draw(),
  };
  function draw() {
    if (!loopId) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const loop = getLoop(loadIntel(), loopId);
    const revised = loop?.stages?.revision?.text;
    box.hidden = false;
    box.innerHTML = `${toHtml(loopPanelHTML(cctx, loopId, { onDone: () => close() }))}
      <p class="intel-entry">
        ${revised ? `<button type="button" class="btn small" data-intel-book="copy">${esc(I.S("Copy my revision", "Copiar mi revisión"))}</button>` : ""}
        <button type="button" class="btn small ghost" data-intel-book="close">${esc(I.S("Close the coach", "Cerrar el entrenador"))}</button>
        <span class="fine">${esc(I.S("The coach never changes your book. To use your revision, copy it and paste it on the page in the editor.", "El entrenador nunca cambia tu libro. Para usar tu revisión, cópiala y pégala en la página en el editor."))}</span>
      </p>`;
  }
  function close() {
    loopId = "";
    draw();
  }
  return {
    open(pageIndex) {
      const text = pageWords(book, pageIndex);
      if (!text) {
        say(I.S("This page has no words yet, so there is nothing to coach.", "Esta página todavía no tiene palabras, así que no hay nada que entrenar."));
        return;
      }
      const page = book.pages[pageIndex];
      const taskId = `book:${book.id}:${page.id}`.slice(0, 80);
      // A loop already under way for these same words resumes; changed words start a new try.
      const state = loadIntel();
      const old = listLoops(state, { src: "book", taskId }).find((l) => l.stages.response?.text === text && nextStage(l) !== "done");
      loopId =
        old?.id ||
        startTextLoop(cctx, {
          src: "book",
          task: { id: taskId, title: `${book.title} · ${I.S("page", "página")} ${pageIndex + 1}`, prompt: "", keyUse: KEY_USE[book.kind] || "Narrate", domain: "Writing" },
          text,
          source: "typed",
          supports: {},
        });
      draw();
      box.querySelector("h3")?.focus?.();
      box.scrollIntoView?.({ block: "nearest" });
    },
    onClick(e) {
      const own = e.target.closest?.("[data-intel-book]");
      if (own) {
        if (own.dataset.intelBook === "close") close();
        else {
          const text = getLoop(loadIntel(), loopId)?.stages?.revision?.text || "";
          const ok = () => say(I.S("Revision copied. Paste it where you want it.", "Revisión copiada. Pégala donde quieras."));
          const no = () => say(I.S("Could not copy. Select your revision and copy it yourself.", "No se pudo copiar. Selecciona tu revisión y cópiala tú."));
          navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).then(ok, no) : no();
        }
        return true;
      }
      return box.contains(e.target) ? onLoopClick(e, cctx) : false;
    },
    onInput: (e) => (box.contains(e.target) ? onLoopInput(e, cctx) : false),
  };
}
