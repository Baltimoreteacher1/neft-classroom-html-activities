/* Math Workbench — export a page and bring pictures in.
 *
 *   - Save the page as a PNG, or copy it to the clipboard
 *   - Save as PDF: the browser's print dialog, where typed objects stay live text
 *   - Add a picture (photo of paper work): file picker, paste, or drag-and-drop.
 *     Pictures are shrunk before they are stored, sit under the ink so a student
 *     can draw over them, and carry a short description for screen readers.
 */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  if (!MWB) return;
  const { h } = MWB;
  const t = MWB.t;

  const MAX_SIDE = 900;
  const MAX_BYTES = 230000; // data-URL characters kept per picture
  const MAX_PICTURES = 6;

  /* ======================= picture object ======================= */
  function buildImage(o, ctx) {
    if (!Number.isFinite(o.w) || o.w < 40) o.w = 360;
    if (typeof o.alt !== "string") o.alt = "";
    const wrap = h("div", { class: "wbx wbx-image" });
    const img = h("img", {
      src: o.src,
      alt: o.alt || t("Picture added to the board", "Imagen añadida a la pizarra"),
      draggable: "false",
      style: { width: `${o.w}px` },
    });
    const alt = MWB.textField(
      o.alt,
      t("Describe this picture", "Describe esta imagen"),
      (inp) => {
        o.alt = inp.value.slice(0, 160);
        img.alt = o.alt || t("Picture added to the board", "Imagen añadida a la pizarra");
        ctx.pushHistory();
      },
      220,
    );
    alt.placeholder = t("What does this picture show?", "¿Qué muestra esta imagen?");
    alt.classList.add("wbx-alt");
    wrap.append(img, alt);
    return wrap;
  }
  MWB.register("image", {
    label: (o) => `Picture: ${o.alt || "added to the board"}`,
    build: buildImage,
    toolOpts: { resize: true },
  });

  /** Shrink a picture file/blob to a small JPEG data URL. */
  function shrink(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(url);
        let side = MAX_SIDE;
        let quality = 0.78;
        for (let attempt = 0; attempt < 5; attempt++) {
          const k = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(im.naturalWidth * k));
          c.height = Math.max(1, Math.round(im.naturalHeight * k));
          const x = c.getContext("2d");
          x.fillStyle = "#fff";
          x.fillRect(0, 0, c.width, c.height);
          x.drawImage(im, 0, 0, c.width, c.height);
          const data = c.toDataURL("image/jpeg", quality);
          if (data.length <= MAX_BYTES || attempt === 4)
            return data.length <= MAX_BYTES * 1.6
              ? resolve({ data, w: c.width, h: c.height })
              : reject(new Error("too-big"));
          side = Math.round(side * 0.75);
          quality = Math.max(0.5, quality - 0.08);
        }
      };
      im.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("not-an-image"));
      };
      im.src = url;
    });
  }

  async function addPicture(blob, say) {
    const c = MWB.ctx;
    const count = c.state.objects.filter((o) => o.type === "image").length;
    if (count >= MAX_PICTURES) {
      say(
        t(
          `That page has ${MAX_PICTURES} pictures already. Use another page.`,
          `Esa página ya tiene ${MAX_PICTURES} imágenes. Usa otra página.`,
        ),
      );
      return;
    }
    try {
      const { data, w, h: hh } = await shrink(blob);
      const width = Math.min(420, w);
      c.makeObject("image", {
        src: data,
        w: width,
        ratio: hh / w,
        x: 100,
        y: Math.round(c.workspace.scrollTop + 80),
      });
      say(
        t(
          "Picture added. Pick the Pen to draw over it.",
          "Imagen añadida. Elige el Lápiz para dibujar sobre ella.",
        ),
      );
    } catch (e) {
      say(
        e && e.message === "too-big"
          ? t(
              "That picture is too detailed to keep. Try a smaller photo.",
              "Esa imagen es demasiado grande. Prueba con una foto más pequeña.",
            )
          : t(
              "That file is not a picture the Workbench can open.",
              "Ese archivo no es una imagen que la pizarra pueda abrir.",
            ),
      );
    }
  }

  /* ======================= page -> PNG ======================= */
  function cssText() {
    let out = "";
    for (const sheet of document.styleSheets) {
      try {
        for (const r of sheet.cssRules) out += `${r.cssText}\n`;
      } catch (_) {
        /* cross-origin sheet: skip */
      }
    }
    return out;
  }

  /** Render the current page: paper + ink + objects. Resolves a PNG blob. */
  async function pageToPng() {
    const c = MWB.ctx;
    const width = c.workspace.clientWidth;
    const height = Math.round(
      Math.max(480, Math.min(c.contentBottom() + 140, c.canvas.height / c.dpr)),
    );
    const ink = document.createElement("canvas");
    ink.width = width;
    ink.height = height;
    ink
      .getContext("2d")
      .drawImage(c.canvas, 0, 0, c.canvas.width, Math.round(height * c.dpr), 0, 0, width, height);
    const overlayClone = c.overlay.cloneNode(true);
    overlayClone
      .querySelectorAll(".obj-tools,.rs,.wbx-lasso,.wbx-guide,.endpt")
      .forEach((n) => n.remove());
    overlayClone.querySelectorAll(".msel,.sel").forEach((n) => n.classList.remove("msel", "sel"));
    const live = [...c.overlay.querySelectorAll("input,textarea,select")];
    const copies = [...overlayClone.querySelectorAll("input,textarea,select")];
    live.forEach((n, i) => {
      const k = copies[i];
      if (!k) return;
      if (n.tagName === "INPUT") k.setAttribute("value", n.value);
      else if (n.tagName === "TEXTAREA") k.textContent = n.value;
    });
    const bg = document.getElementById("bgLayer");
    const holder = document.createElement("div");
    holder.className = `workspace paper ${[...c.workspace.classList].filter((x) => x.startsWith("bg-")).join(" ")}`;
    holder.setAttribute(
      "style",
      `position:relative;width:${width}px;height:${height}px;overflow:hidden;background-color:#fff;`,
    );
    const bgClone = bg ? bg.cloneNode(true) : null;
    const img = document.createElement("img");
    img.setAttribute("src", ink.toDataURL("image/png"));
    img.setAttribute("style", "position:absolute;left:0;top:0;");
    // Pictures sit under the ink on the live board (multiply blend). foreignObject
    // does not blend, so draw them first, then the ink, then everything else.
    const under = overlayClone.cloneNode(false);
    [...overlayClone.querySelectorAll(".obj")]
      .filter((el) => el.querySelector(".wbx-image"))
      .forEach((el) => under.appendChild(el));
    if (bgClone) holder.appendChild(bgClone);
    holder.appendChild(under);
    holder.appendChild(img);
    holder.appendChild(overlayClone);
    const NS = "http://www.w3.org/1999/xhtml";
    const wrapper = document.createElementNS(NS, "div");
    wrapper.setAttribute("xmlns", NS);
    const style = document.createElementNS(NS, "style");
    style.textContent = cssText();
    wrapper.append(style, holder);
    const xml = new XMLSerializer().serializeToString(wrapper);
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${xml}</foreignObject></svg>`;
    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("render"));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    });
    const out = document.createElement("canvas");
    out.width = width * scale;
    out.height = height * scale;
    const x = out.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, out.width, out.height);
    x.scale(scale, scale);
    x.drawImage(image, 0, 0);
    return new Promise((resolve, reject) => {
      try {
        out.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
      } catch (e) {
        reject(e); // a tainted canvas (older Safari) throws here
      }
    });
  }

  /** Ink-only fallback when the full render is blocked. */
  function inkOnlyPng() {
    const c = MWB.ctx;
    const out = document.createElement("canvas");
    out.width = c.canvas.width;
    out.height = c.canvas.height;
    const x = out.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, out.width, out.height);
    x.drawImage(c.canvas, 0, 0);
    return new Promise((resolve) => out.toBlob(resolve, "image/png"));
  }

  const stamp = () => new Date().toISOString().slice(0, 10);
  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function exportPng(say, mode) {
    MWB.ctx.deselect();
    say(t("Making the picture…", "Creando la imagen…"));
    let blob;
    let full = true;
    try {
      blob = await pageToPng();
    } catch (_) {
      blob = await inkOnlyPng();
      full = false;
    }
    if (!blob)
      return say(
        t(
          "Could not make the picture. Try Save as PDF instead.",
          "No se pudo crear la imagen. Prueba Guardar como PDF.",
        ),
      );
    const note = full
      ? ""
      : ` ${t("(Only your writing and drawing could be saved on this browser. Use Save as PDF for typed boxes.)", "(En este navegador solo se pudo guardar lo escrito y dibujado. Usa Guardar como PDF para los cuadros de texto.)")}`;
    if (mode === "copy") {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        say(
          t(
            "Copied. Paste it into a document or message.",
            "Copiado. Pégalo en un documento o mensaje.",
          ) + note,
        );
        return;
      } catch (_) {
        say(
          t(
            "This browser would not copy the picture, so it was saved instead.",
            "Este navegador no pudo copiar la imagen, así que se guardó.",
          ),
        );
      }
    }
    download(blob, `math-workbench-page-${MWB.ctx.notebook.active + 1}-${stamp()}.png`);
    say(t("Saved to your downloads.", "Guardado en tus descargas.") + note);
  }

  /* ======================= panel section ======================= */
  if (MWB.panel) {
    MWB.panel.addSection("export", "Pictures & export", "Imágenes y exportar", () => {
      const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
      const say = (m) => {
        live.textContent = m;
      };
      const file = h("input", { type: "file", accept: "image/*", hidden: true });
      file.addEventListener("change", () => {
        const f = file.files && file.files[0];
        file.value = "";
        if (f) addPicture(f, say);
      });
      const grid = h("div", { class: "wbx-grid" });
      grid.append(
        MWB.btn(
          t("Add a picture", "Añadir imagen"),
          t(
            "Add a picture from a file or camera",
            "Añadir una imagen desde un archivo o la cámara",
          ),
          () => file.click(),
        ),
        MWB.btn(
          t("Save as picture", "Guardar como imagen"),
          t("Save this page as a PNG picture", "Guardar esta página como imagen PNG"),
          () => exportPng(say, "save"),
        ),
        MWB.btn(
          t("Copy picture", "Copiar imagen"),
          t("Copy this page as a picture", "Copiar esta página como imagen"),
          () => exportPng(say, "copy"),
        ),
        MWB.btn(
          t("Save as PDF", "Guardar como PDF"),
          t(
            "Open the print window to save this page as a PDF",
            "Abrir la ventana de impresión para guardar esta página como PDF",
          ),
          () => {
            MWB.ctx.deselect();
            say(
              t(
                "In the print window, choose Save as PDF. Typed text stays real text.",
                "En la ventana de impresión, elige Guardar como PDF. El texto escrito sigue siendo texto.",
              ),
            );
            setTimeout(() => window.print(), 80);
          },
        ),
      );
      return h(
        "div",
        { class: "wbx-stack" },
        grid,
        file,
        live,
        h(
          "p",
          { class: "wbx-live" },
          t(
            "You can also paste or drop a picture onto the board.",
            "También puedes pegar o soltar una imagen en la pizarra.",
          ),
        ),
      );
    });
  }

  /* ======================= paste and drop ======================= */
  function installDrop() {
    const c = MWB.ctx;
    const toast = (m) => c.showToast(m);
    document.addEventListener("paste", (e) => {
      const tag = e.target && e.target.tagName;
      if (e.target && (e.target.isContentEditable || /INPUT|TEXTAREA/.test(tag))) return;
      if (document.querySelector(".mwr-overlay.is-open")) return; // Reasoning Studio is open
      const item = [...(e.clipboardData ? e.clipboardData.items : [])].find((i) => i.type.startsWith("image/"));
      if (item) {
        e.preventDefault();
        addPicture(item.getAsFile(), toast);
      } else if (MWB.pasteObjects) {
        e.preventDefault(); // Ctrl+V pastes whatever was last copied from the board
        MWB.pasteObjects();
      }
    });
    c.workspace.addEventListener("dragover", (e) => {
      if (e.dataTransfer && [...e.dataTransfer.types].includes("Files")) e.preventDefault();
    });
    c.workspace.addEventListener("drop", (e) => {
      const f =
        e.dataTransfer && [...e.dataTransfer.files].find((x) => x.type.startsWith("image/"));
      if (!f) return;
      e.preventDefault();
      addPicture(f, toast);
    });
  }

  MWB.onReady(installDrop);
  MWB.pictures = { add: addPicture, exportPng };
})(window);
