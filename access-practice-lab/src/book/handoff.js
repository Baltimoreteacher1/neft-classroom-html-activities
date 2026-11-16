// The one contract other studios use to start a book from real work: Writing Studio drafts, Speaking Studio
// dialogues, Word Lab vocabulary, Language World missions. The content is written straight into a new book in this
// device's Book Studio storage and the learner lands in the editor with it, so "Add to my book" never opens an empty
// tool. Recordings travel as Blobs (stored as book media); nothing leaves the device.
//
//   createBookFromContent({
//     source: { kind: "writing" | "speaking" | "vocabulary" | "world" | "scenario", id, label },
//     title, templateId?, author?, band?, lang?,
//     pages: [{ heading?, text?, transcript?, audio?: Blob, audioSeconds?, art?, bubbles?: [{ who, text }] }],
//   }) → Promise<book id>
import * as db from "./db.js";
import {
  FORMATS,
  bookFromTemplate,
  comicPage,
  makeElement,
  makePage,
  newBook,
  textToHtml,
} from "./model.js";
import { templateById } from "./templates.js";

const LIMIT_PAGES = 30;

async function pageFrom(bookId, item, format) {
  const ratio = FORMATS[format].ratio;
  const els = [];
  if (item.bubbles?.length) {
    // A conversation becomes comic panels: one exchange (up to two lines) per panel, two panels per page.
    const p = comicPage("two");
    const [a, b] = p.elements;
    const people = [...new Set(item.bubbles.map((x) => x.who))];
    const chars = ["char-maya", "char-leo", "char-amara", "char-kai"];
    for (const [i, line] of item.bubbles.slice(0, 2).entries()) {
      const panel = i === 0 ? a : b;
      const left = people.indexOf(line.who) % 2 === 0;
      els.push(
        makeElement("art", {
          art: chars[people.indexOf(line.who) % chars.length],
          alt: line.who,
          x: left ? panel.x + 3 : panel.x + panel.w - 26,
          y: panel.y + panel.h - 38,
          w: 22,
          h: 36,
          flip: !left,
        }),
      );
      els.push(
        makeElement("bubble", {
          variant: "speech",
          tail: left ? "bottom-left" : "bottom-right",
          html: textToHtml(`${line.who}: ${line.text}`),
          x: panel.x + 4,
          y: panel.y + 3,
          w: panel.w - 8,
          h: Math.min(20, panel.h - 40),
        }),
      );
    }
    const page = makePage({ ...p, elements: [...p.elements, ...els] });
    return page;
  }
  if (item.heading)
    els.push(
      makeElement("text", {
        role: "heading",
        x: 8,
        y: 6,
        w: 84,
        h: 10,
        html: textToHtml(item.heading),
      }),
    );
  const top = item.heading ? 18 : 8;
  if (item.art)
    els.push(
      makeElement("art", {
        art: item.art,
        alt: item.artAlt || "",
        x: 62,
        y: top,
        w: Math.round((26 / ratio) * 10) / 10,
        h: 26,
      }),
    );
  else
    els.push(
      makeElement("image", {
        x: 58,
        y: top,
        w: 34,
        h: 34,
        ph: {
          en: "Add a picture or drawing for this page.",
          es: "Agrega una imagen o un dibujo para esta página.",
        },
      }),
    );
  if (item.text)
    els.push(makeElement("text", { x: 8, y: top, w: 46, h: 68, html: textToHtml(item.text) }));
  if (item.audio instanceof Blob && item.audio.size) {
    const media = await db.putMedia(bookId, item.audio, { name: "recording", kind: "audio" });
    els.push(
      makeElement("audio", {
        media,
        x: 58,
        y: 80,
        w: 34,
        h: 9,
        label: item.audioLabel || "Listen",
        seconds: item.audioSeconds || 0,
        transcript: item.transcript || item.text || "",
      }),
    );
  } else els.push(makeElement("audio", { x: 58, y: 80, w: 34, h: 9, label: "Listen" }));
  return makePage({ elements: els, prompt: item.prompt || null });
}

export async function createBookFromContent({
  source,
  title,
  templateId,
  author = "",
  band = "6-8",
  lang = "en",
  pages = [],
  keepTemplatePages = true,
}) {
  const tpl = templateById(templateId);
  const book = tpl
    ? bookFromTemplate(tpl, { title, author, lang, band })
    : newBook({ kind: "report", title, author, lang });
  // Keep the template's cover; content pages follow it, then the template's remaining guided pages (if any) so the
  // learner can keep building the genre around the imported work.
  const cover = book.pages[0];
  const rest = book.pages.slice(1);
  const made = [];
  for (const item of pages.slice(0, LIMIT_PAGES))
    made.push(await pageFrom(book.id, item, book.format));
  book.pages = [cover, ...made, ...(tpl && keepTemplatePages ? rest : [])];
  book.source = { kind: source?.kind || "", id: source?.id || "", label: source?.label || "" };
  const saved = await db.saveBook(book);
  return saved.id;
}

/** Same as createBookFromContent, then go to the editor. */
export async function openInBookStudio(spec, navigate = (url) => location.assign(url)) {
  const id = await createBookFromContent(spec);
  navigate(`/access-practice-lab/book-studio/edit/${id}`);
  return id;
}
