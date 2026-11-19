// The Add toolbar: text, pictures, illustrations, shapes, speech bubbles, drawing, recordings, video and comic panels.
// Every tool is a real button or a <details> menu, so the whole toolbar works from the keyboard.
import * as db from "./db.js";
import { CURATED_SCENES, importCuratedScene, sceneOf, sceneSource, readableSceneBacking } from "./curated-scenes.js";
import { ART, ART_CATS } from "./art.js";
import {
  MediaError,
  checkVideo,
  fitOnPage,
  mediaDuration,
  prepareImage,
  videoPoster,
  youTubeId,
} from "./editor-media.js";
import { bkIcon } from "./icons.js";
import {
  BUBBLES,
  COMIC_LAYOUTS,
  FORMATS,
  SHAPES,
  comicPage,
  makeElement,
  makePage,
} from "./model.js";
import { artSrc, esc, preloadMedia } from "./render.js";

const SHAPE_NAMES = {
  rect: ["Rectangle", "Rectángulo"],
  rounded: ["Rounded box", "Caja redondeada"],
  ellipse: ["Circle", "Círculo"],
  triangle: ["Triangle", "Triángulo"],
  star: ["Star", "Estrella"],
  arrow: ["Arrow", "Flecha"],
  line: ["Line", "Línea"],
  heart: ["Heart", "Corazón"],
};
const BUBBLE_NAMES = {
  speech: ["Speech bubble", "Globo de diálogo"],
  thought: ["Thought bubble", "Globo de pensamiento"],
  shout: ["Shout", "Grito"],
  caption: ["Caption box", "Recuadro de narración"],
};
const LAYOUT_NAMES = {
  one: ["1 panel", "1 viñeta"],
  two: ["2 panels", "2 viñetas"],
  three: ["3 panels", "3 viñetas"],
  four: ["4 panels", "4 viñetas"],
  six: ["6 panels", "6 viñetas"],
};

export function addBarHTML(E) {
  const tr = E.I.S;
  const b = (act, ico, en, es, extra = "") =>
    `<button type="button" class="bk-add-btn" data-bk-add="${act}" ${extra}>${bkIcon(ico)}<span>${esc(tr(en, es))}</span></button>`;
  const menu = (ico, en, es, body) =>
    `<details class="bk-menu"><summary class="bk-add-btn">${bkIcon(ico)}<span>${esc(tr(en, es))}</span></summary><div class="bk-menu-body">${body}</div></details>`;
  return `<div class="bk-addbar" role="toolbar" aria-label="${esc(tr("Add to this page", "Agregar a esta página"))}">
    ${b("text", "text", "Text", "Texto")}
    ${menu("image", "Picture", "Imagen", `<button type="button" data-bk-add="image">${esc(tr("Upload a picture or photo", "Subir una imagen o foto"))}</button><button type="button" data-bk-add="art">${esc(tr("Choose an illustration", "Elegir una ilustración"))}</button><button type="button" data-bk-add="camera">${esc(tr("Take a photo", "Tomar una foto"))}</button>`)}
    ${b("art", "sticker", "Illustrations", "Ilustraciones")}
    ${menu("shape", "Shape", "Forma", SHAPES.map((s) => `<button type="button" data-bk-add="shape" data-shape="${s}">${esc(tr(...SHAPE_NAMES[s]))}</button>`).join(""))}
    ${menu("bubble", "Bubble", "Globo", BUBBLES.map((v) => `<button type="button" data-bk-add="bubble" data-variant="${v}">${esc(tr(...BUBBLE_NAMES[v]))}</button>`).join(""))}
    ${b("draw", "draw", "Draw", "Dibujar", 'aria-pressed="false"')}
    ${b("audio", "mic", "Record", "Grabar")}
    ${b("video", "video", "Video", "Video")}
    ${menu("panel", "Comic", "Cómic", COMIC_LAYOUTS.map((l) => `<button type="button" data-bk-add="layout" data-layout="${l}">${esc(tr(...LAYOUT_NAMES[l]))}</button>`).join("") + `<button type="button" data-bk-add="panel">${esc(tr("One more panel", "Una viñeta más"))}</button>`)}
  </div>`;
}

const closeMenus = (root) =>
  root.querySelectorAll("details.bk-menu[open]").forEach((d) => d.removeAttribute("open"));

function mediaFail(E, error) {
  const tr = E.I.S;
  E.say(
    error instanceof MediaError
      ? tr(error.en, error.es)
      : tr("That file could not be added.", "No se pudo agregar ese archivo."),
  );
  E.banner(
    `<p role="alert">${esc(error instanceof MediaError ? tr(error.en, error.es) : tr("That file could not be added. Try another file.", "No se pudo agregar ese archivo. Prueba con otro."))} <button type="button" class="linklike" data-bk-banner-close>${esc(tr("Close", "Cerrar"))}</button></p>`,
  );
}

export async function addImageFile(E, file) {
  const { core } = E;
  const tr = E.I.S;
  try {
    const { blob, width, height } = await prepareImage(file);
    const id = await db.putMedia(core.S.book.id, blob, { name: file.name, kind: "image" });
    await preloadMedia(core.S.book).catch(() => {});
    await db.mediaUrl(id);
    const size = fitOnPage(width, height, FORMATS[core.S.book.format].ratio);
    const slot = core.selectedEl();
    if (slot?.type === "image" && !slot.media) core.update(slot.id, { media: id });
    else core.add("image", { media: id, x: (100 - size.w) / 2, y: (100 - size.h) / 2, ...size });
    E.say(
      tr(
        "Picture added. Describe it in the Description box so everyone can read your book.",
        "Imagen agregada. Descríbela en el cuadro Descripción para que todos puedan leer tu libro.",
      ),
    );
    E.renderAll();
    E.root.querySelector("[data-bk-prop=alt]")?.focus({ preventScroll: true });
  } catch (error) {
    mediaFail(E, error);
  }
}

async function addVideoFile(E, file) {
  const { core } = E;
  const tr = E.I.S;
  try {
    checkVideo(file);
    E.say(tr("Adding your video…", "Agregando tu video…"));
    const id = await db.putMedia(core.S.book.id, file, { name: file.name, kind: "video" });
    const posterBlob = await videoPoster(file);
    const poster = posterBlob
      ? await db.putMedia(core.S.book.id, posterBlob, { name: "poster.jpg", kind: "poster" })
      : "";
    await Promise.all([db.mediaUrl(id), db.mediaUrl(poster)]);
    const seconds = await mediaDuration(file, "video");
    const slot = core.selectedEl();
    if (slot?.type === "video" && !slot.media && !slot.embed)
      core.update(slot.id, { media: id, poster, title: file.name.replace(/\.[^.]+$/, "") });
    else
      core.add("video", {
        media: id,
        poster,
        x: 15,
        y: 20,
        w: 70,
        h: 40,
        title: file.name.replace(/\.[^.]+$/, ""),
        seconds,
      });
    E.renderAll();
    E.say(
      tr(
        "Video added. You can add captions in the panel on the right.",
        "Video agregado. Puedes agregar subtítulos en el panel de la derecha.",
      ),
    );
  } catch (error) {
    mediaFail(E, error);
  }
}

function artDialog(E, { background = false } = {}) {
  const tr = E.I.S;
  const lang = E.ctx.prefs?.lang === "es" ? "es" : "en";
  const d = E.dialog;
  const cats = ART_CATS.filter((c) => (background ? c.id === "background" : true));
  d.innerHTML = `<form method="dialog" class="bk-dialog-inner bk-art-dialog">
    <header class="bk-dialog-head"><h2 id="bkDialogTitle">${esc(background ? tr("Choose a page background", "Elige un fondo de página") : tr("Illustrations", "Ilustraciones"))}</h2><button class="bk-tbtn" value="close" aria-label="${esc(tr("Close", "Cerrar"))}">${bkIcon("close")}</button></header>
    <label class="bk-search"><span class="sr-only">${esc(tr("Search illustrations", "Buscar ilustraciones"))}</span><input type="search" data-art-search placeholder="${esc(tr("Search: cat, city, rocket…", "Buscar: gato, ciudad, cohete…"))}" /></label>
    <section class="bk-art-cat" data-art-cat="curated"><h3>${esc(tr("Illustrated scene backgrounds", "Fondos de escenas ilustradas"))}</h3><p>${esc(tr("Optional original paintings, saved inside project and EPUB exports. The background picker adds readable panels behind text; Illustrations adds an editable picture.", "Ilustraciones originales opcionales que se incluyen en proyectos y EPUB. El selector de fondo agrega paneles legibles detrás del texto; Ilustraciones agrega una imagen editable."))}</p><div class="bk-art-grid">${CURATED_SCENES.map((scene) => `<button type="button" class="bk-art-pick" data-art-scene="${scene.id}" data-art-name="${esc(`${scene.en} ${scene.es}`.toLowerCase())}"><img src="${sceneSource(scene.id, true)}" alt="" loading="lazy" /><span>${esc(tr(scene.en, scene.es))}</span></button>`).join("")}</div></section>
    ${cats
      .map(
        (c) =>
          `<section class="bk-art-cat" data-art-cat="${c.id}"><h3>${esc(tr(c.en, c.es))}</h3><div class="bk-art-grid">${ART.filter(
            (a) => a.cat === c.id,
          )
            .map(
              (a) =>
                `<button type="button" class="bk-art-pick" data-art-pick="${a.key}" data-art-name="${esc(`${a.en} ${a.es}`.toLowerCase())}" aria-label="${esc(a[lang] || a.en)}"><img src="${artSrc(a.key)}" alt="" loading="lazy" /><span>${esc(a[lang] || a.en)}</span></button>`,
            )
            .join("")}</div></section>`,
      )
      .join("")}
  </form>`;
  d.dataset.mode = background ? "bg" : "art";
  d.showModal();
  d.querySelector("[data-art-search]").focus({ preventScroll: true });
}

function videoDialog(E) {
  const tr = E.I.S;
  const d = E.dialog;
  d.innerHTML = `<form method="dialog" class="bk-dialog-inner">
    <header class="bk-dialog-head"><h2 id="bkDialogTitle">${esc(tr("Add a video", "Agregar un video"))}</h2><button class="bk-tbtn" value="close" aria-label="${esc(tr("Close", "Cerrar"))}">${bkIcon("close")}</button></header>
    <p>${esc(tr("Upload a video from this device (MP4, WebM or MOV, up to 80 MB). It stays on this device with your book.", "Sube un video de este dispositivo (MP4, WebM o MOV, hasta 80 MB). Se queda en este dispositivo con tu libro."))}</p>
    <p><button type="button" class="btn btn-primary" data-bk-add="video-file">${bkIcon("upload")} ${esc(tr("Choose a video file", "Elegir un archivo de video"))}</button></p>
    <hr />
    <label class="field"><span>${esc(tr("Or paste a YouTube link (the only video site Book Studio embeds)", "O pega un enlace de YouTube (el único sitio de video que Book Studio inserta)"))}</span><input type="url" data-yt-url placeholder="https://www.youtube.com/watch?v=…" /></label>
    <p class="fine">${esc(tr("YouTube videos play from YouTube's privacy-enhanced player and need the internet.", "Los videos de YouTube se reproducen desde el reproductor de privacidad mejorada de YouTube y necesitan internet."))}</p>
    <p class="bk-error" data-yt-error hidden></p>
    <div class="row-actions"><button type="button" class="btn" data-bk-add="video-yt">${esc(tr("Add YouTube video", "Agregar video de YouTube"))}</button></div>
  </form>`;
  d.dataset.mode = "video";
  d.showModal();
}

/** Handle a click (or a direct action) from the Add toolbar or its dialogs. Returns true when handled. */
export async function onAddBar(E, { target, action, file }) {
  const { core } = E;
  const tr = E.I.S;
  const btn = target?.closest?.(
    "[data-bk-add], [data-art-pick], [data-art-scene], [data-bk-newpage], [data-bk-banner-close]",
  );
  if (target && !btn) {
    // A click on the dialog backdrop closes it.
    if (target === E.dialog) E.dialog.close();
    return false;
  }
  if (btn?.matches("[data-bk-banner-close]")) {
    E.banner("");
    return true;
  }
  const act = action || btn.dataset.bkAdd;
  if (btn) closeMenus(E.root);
  if (btn?.dataset.artScene) {
    if (E.curatedSceneBusy) return true;
    E.curatedSceneBusy = true;
    const asBackground = E.dialog.dataset.mode === "bg";
    const pageId = core.page().id;
    const bookId = core.S.book.id;
    const scene = sceneOf(btn.dataset.artScene);
    btn.disabled = true;
    E.say(tr("Saving this scene on your device…", "Guardando esta escena en tu dispositivo…"));
    try {
      if (asBackground && core.page().elements.some((el) => el.type === "text" && /data-c=|color\s*[=:]/i.test(el.html || "")))
        throw new MediaError("scene-text", "This page uses mixed text colours. Add the scene through Illustrations to preserve its readability.", "Esta página usa varios colores de texto. Agrega la escena desde Ilustraciones para conservar su legibilidad.");
      const { blob, width, height } = await importCuratedScene(scene?.id);
      if (core.page().id !== pageId || core.S.book.id !== bookId)
        throw new MediaError("scene-page", "Your page changed. Open the gallery on the page where you want this scene.", "Tu página cambió. Abre la galería en la página donde quieres esta escena.");
      const media = await db.putMedia(bookId, blob, { name: `${scene.id}.jpg`, kind: "image" });
      await db.mediaUrl(media);
      const targetPage = core.S.book.pages.find((page) => page.id === pageId);
      if (!targetPage) throw new MediaError("scene-page", "That page is no longer in this book.", "Esa página ya no está en este libro.");
      const size = fitOnPage(width, height, FORMATS[core.S.book.format].ratio);
      const image = makeElement("image", { media,
        ...(asBackground ? { x: 0, y: 0, w: 100, h: 100, fit: "cover", locked: true }
          : { x: (100 - size.w) / 2, y: (100 - size.h) / 2, ...size, fit: "contain" }),
        alt: E.ctx.prefs?.lang === "es" ? scene.altEs : scene.altEn });
      if (asBackground) {
        for (const el of targetPage.elements) {
          if (el.type === "text" && !el.style?.bg)
            el.style = { ...el.style, bg: readableSceneBacking(el.style?.color) };
        }
        targetPage.elements.unshift(image);
      } else targetPage.elements.push(image);
      core.S.selected = image.id;
      core.commit();
      E.dialog.close();
      E.renderAll();
      E.say(asBackground
        ? tr("Scene placed behind the page with readable text panels. Unlock the image to move or remove it. Check the autosave status above.", "Escena colocada detrás de la página con paneles de texto legibles. Desbloquea la imagen para moverla o quitarla. Revisa el estado de guardado arriba.")
        : tr("Scene added as an editable picture. The autosave status above confirms when your book is saved.", "Escena agregada como imagen editable. El estado de guardado arriba confirma cuándo se guarda el libro."));
    } catch (error) { mediaFail(E, error); }
    finally { E.curatedSceneBusy = false; btn.disabled = false; }
    return true;
  }
  if (btn?.dataset.artPick) {
    const key = btn.dataset.artPick;
    const art = ART.find((a) => a.key === key);
    if (E.dialog.dataset.mode === "bg" || art?.cat === "background") {
      core.page().bgArt = key;
      core.commit();
      E.say(tr("Page background set.", "Fondo de página listo."));
    } else {
      const lang = E.ctx.prefs?.lang === "es" ? "es" : "en";
      const ratio = FORMATS[core.S.book.format].ratio;
      const h = art?.cat === "character" ? 42 : 26;
      const w = Math.round((h / ratio) * (art?.cat === "character" ? 0.66 : 1) * 10) / 10;
      core.add("art", {
        art: key,
        alt: art ? art[lang] || art.en : "",
        x: (100 - w) / 2,
        y: (100 - h) / 2,
        w,
        h,
      });
      E.say(tr("Illustration added.", "Ilustración agregada."));
    }
    E.dialog.close();
    E.renderAll();
    return true;
  }
  if (btn?.dataset.bkNewpage) {
    const kind = btn.dataset.bkNewpage;
    const T = (p) => makeElement("text", p);
    let p;
    if (kind.startsWith("comic-")) p = comicPage(kind.slice(6));
    else if (kind === "text")
      p = makePage({
        elements: [
          makeElement("image", { x: 8, y: 6, w: 84, h: 52 }),
          T({
            x: 8,
            y: 62,
            w: 84,
            h: 30,
            ph: { en: "Write about this page.", es: "Escribe sobre esta página." },
          }),
        ],
      });
    else if (kind === "heading")
      p = makePage({
        elements: [
          T({ role: "heading", x: 8, y: 6, w: 84, h: 11, ph: { en: "Heading", es: "Encabezado" } }),
          T({
            x: 8,
            y: 20,
            w: 84,
            h: 70,
            ph: { en: "Write your paragraph.", es: "Escribe tu párrafo." },
          }),
        ],
      });
    else if (kind === "two")
      p = makePage({
        elements: [
          T({ x: 6, y: 8, w: 42, h: 84, ph: { en: "Left column", es: "Columna izquierda" } }),
          T({ x: 52, y: 8, w: 42, h: 84, ph: { en: "Right column", es: "Columna derecha" } }),
        ],
      });
    else p = makePage();
    core.addPage(p);
    E.say(tr(`Page ${core.S.pageIndex + 1} added.`, `Página ${core.S.pageIndex + 1} agregada.`));
    return true;
  }
  if (!act) return false;
  const center = (w, h) => ({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
  switch (act) {
    case "text": {
      const el = core.add("text", {
        ...center(60, 16),
        ph: { en: "Type here", es: "Escribe aquí" },
      });
      E.renderAll();
      E.beginTextEdit(el.id);
      return true;
    }
    case "image":
    case "camera": {
      if (act === "camera")
        E.root.querySelector("[data-bk-file]").setAttribute("capture", "environment");
      else E.root.querySelector("[data-bk-file]").removeAttribute("capture");
      const f = await E.pickFile("image/png,image/jpeg,image/webp,image/gif");
      if (f) await addImageFile(E, f);
      return true;
    }
    case "image-file":
      if (file?.type?.startsWith("image/")) await addImageFile(E, file);
      else if (file?.type?.startsWith("video/")) await addVideoFile(E, file);
      return true;
    case "art":
      artDialog(E);
      return true;
    case "bg-art":
      artDialog(E, { background: true });
      return true;
    case "shape": {
      const shape = btn.dataset.shape;
      const ratio = FORMATS[core.S.book.format].ratio;
      const h = shape === "line" ? 2 : 22;
      const w = shape === "line" ? 40 : Math.round((h / ratio) * 10) / 10;
      core.add("shape", {
        shape,
        ...center(w, h),
        fill: shape === "line" ? "#1b1f3b" : "#e7f4f2",
        stroke: shape === "line" ? "#1b1f3b" : "#075568",
      });
      E.renderAll();
      return true;
    }
    case "bubble": {
      const el = core.add("bubble", {
        variant: btn.dataset.variant,
        ...center(36, 16),
        ph: { en: "What do they say?", es: "¿Qué dicen?" },
      });
      E.renderAll();
      E.beginTextEdit(el.id);
      return true;
    }
    case "draw": {
      const on = !E.drawing;
      E.setDrawing(on);
      E.root.querySelector('[data-bk-add="draw"]')?.setAttribute("aria-pressed", String(on));
      E.say(
        on
          ? tr(
              "Drawing on. Draw on the page with a finger, pen or mouse. Press Done when you finish.",
              "Dibujo activado. Dibuja en la página con el dedo, un lápiz o el ratón. Presiona Listo al terminar.",
            )
          : tr("Drawing off.", "Dibujo desactivado."),
      );
      return true;
    }
    case "audio": {
      core.add("audio", { x: 8, y: 86, w: 34, h: 9, label: tr("Listen", "Escuchar") });
      E.renderAll();
      E.root.querySelector("[data-bk-rec=start]")?.focus({ preventScroll: true });
      return true;
    }
    case "video":
      videoDialog(E);
      return true;
    case "video-file": {
      E.dialog.close();
      const f = await E.pickFile("video/mp4,video/webm,video/quicktime");
      if (f) await addVideoFile(E, f);
      return true;
    }
    case "video-yt": {
      const id = youTubeId(E.dialog.querySelector("[data-yt-url]")?.value || "");
      const err = E.dialog.querySelector("[data-yt-error]");
      if (!id) {
        err.hidden = false;
        err.textContent = tr(
          "That is not a YouTube video link.",
          "Ese no es un enlace de video de YouTube.",
        );
        return true;
      }
      E.dialog.close();
      core.add("video", {
        embed: { provider: "youtube", id },
        x: 15,
        y: 20,
        w: 70,
        h: 40,
        title: "YouTube video",
      });
      E.renderAll();
      return true;
    }
    case "layout": {
      const layout = comicPage(btn.dataset.layout);
      const page = core.page();
      page.elements = page.elements.filter((e) => e.type !== "panel");
      page.elements.unshift(...layout.elements);
      core.commit();
      E.say(
        tr(
          "Comic panels placed. Add characters and bubbles inside them.",
          "Viñetas listas. Agrega personajes y globos dentro de ellas.",
        ),
      );
      return true;
    }
    case "panel":
      core.add("panel", center(40, 30));
      E.renderAll();
      return true;
    default:
      return false;
  }
}

// Search inside the illustration dialog.
document.addEventListener("input", (e) => {
  const q = e.target.closest?.("[data-art-search]");
  if (!q) return;
  const term = q.value.trim().toLowerCase();
  const dlg = q.closest("dialog");
  dlg.querySelectorAll("[data-art-pick], [data-art-scene]").forEach((b) => {
    b.hidden = !!term && !b.dataset.artName.includes(term);
  });
  dlg.querySelectorAll("[data-art-cat]").forEach((s) => {
    s.hidden = ![...s.querySelectorAll("[data-art-pick], [data-art-scene]")].some((b) => !b.hidden);
  });
});
