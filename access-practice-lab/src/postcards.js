import * as store from "./postcard-store.js";
import { ART, BASE, html } from "./util.js";

const msg = (I, en, es) => I.T(en, es);
let albumUrls = [];
export function releaseAlbumUrls() { for (const url of albumUrls) URL.revokeObjectURL(url); albumUrls = []; }
const plain = (I, en, es) => I.S(en, es);
const jpegBlob = (source, scale, quality) => new Promise((resolve) => {
  const target = document.createElement("canvas");
  target.width = Math.round(source.width * scale);
  target.height = Math.round(source.height * scale);
  target.getContext("2d").drawImage(source, 0, 0, target.width, target.height);
  target.toBlob(resolve, "image/jpeg", quality);
});
async function postcardBlob(source) {
  for (const [scale, quality] of [[1, 0.72], [0.8, 0.66], [0.6, 0.58]]) {
    const blob = await jpegBlob(source, scale, quality);
    if (blob && blob.size <= 450_000) return blob;
  }
  return null;
}

export function makerHTML(I, { place = "" } = {}) {
  return html`<section class="postcard-maker panel" aria-labelledby="postcardTitle">
    <h2 id="postcardTitle">${msg(I, "Make a postcard", "Crea una postal")}</h2>
    <p>${msg(I, "Photograph things, not people. Photos stay on this device for 30 days and are deleted from this device when you remove them.", "Fotografía objetos o lugares, no personas. Las fotos permanecen en este dispositivo durante 30 días y se eliminan de este dispositivo cuando las borras.")}</p>
    <label class="field"><span>${msg(I, "Place or country", "Lugar o país")}</span><input data-postcard-place maxlength="60" value="${place}"></label>
    <div class="postcard-tools"><button type="button" class="btn" data-postcard-camera>${msg(I, "Use camera", "Usar la cámara")}</button><button type="button" class="btn" data-postcard-picture>${msg(I, "Use a lab picture", "Usar una imagen del laboratorio")}</button><button type="button" class="btn" data-postcard-draw>${msg(I, "Draw instead", "Dibujar")}</button></div>
    <p class="fine">${msg(I, "Use the camera only if your grown-up and school allow it. Camera access starts when you choose Use camera. The rear camera is preferred. No photo is uploaded.", "Usa la cámara solo si tu familia y tu escuela lo permiten. El acceso comienza cuando eliges Usar la cámara. Se prefiere la cámara trasera. No se suben fotos.")}</p>
    <video data-postcard-video playsinline muted hidden></video><button type="button" class="btn" data-postcard-capture hidden>${msg(I, "Capture photo", "Tomar foto")}</button><canvas data-postcard-canvas width="800" height="520" aria-label="${plain(I, "Postcard picture preview and drawing area", "Vista previa de la imagen y área para dibujar")}"></canvas>
    <label class="field"><span>${msg(I, "Write one or two sentences about your picture. This sentence will be its alt text.", "Escribe una o dos oraciones sobre tu imagen. Esta oración será su texto alternativo.")}</span><textarea data-postcard-alt rows="2" maxlength="300"></textarea></label>
    <label class="pass-check"><input type="checkbox" data-postcard-share><span>${msg(I, "Keep for my teacher (include only in a share I choose to create)", "Guardar para mi docente (incluir solo en un archivo que yo elija compartir)")}</span></label>
    <div class="postcard-tools"><button type="button" class="btn btn-primary" data-postcard-save>${msg(I, "Save postcard on this device", "Guardar la postal en este dispositivo")}</button><a class="btn" data-postcard-return href="${BASE}/family/trip">${msg(I, "Back to Family Trip", "Volver al Viaje en familia")}</a><a class="btn" data-postcard-passport href="${BASE}/passport">${msg(I, "Return to My Passport", "Volver a Mi pasaporte")}</a></div><p class="fine" data-postcard-status role="status"></p>
  </section>`;
}
export async function albumHTML(I) {
  releaseAlbumUrls();
  const rows = await store.list();
  return html`<section class="panel postcard-album" aria-labelledby="postcardAlbumTitle"><h2 id="postcardAlbumTitle">${msg(I, "My postcards", "Mis postales")}</h2><p>${msg(I, "Postcards stay on this device for up to 30 days. ACCESS1 backups include them only when you mark “Keep for my teacher.”", "Las postales permanecen en este dispositivo hasta por 30 días. Las copias ACCESS1 las incluyen solo si marcas “Guardar para mi docente”.")}</p>${rows.length ? html`<ul class="postcard-list">${rows.map((r) => html`<li><img src="${(albumUrls.push(URL.createObjectURL(r.blob)), albumUrls.at(-1))}" alt="${r.alt}"><div><strong>${r.place || msg(I, "Postcard", "Postal")}</strong><p>${r.alt}</p><time datetime="${r.created}">${r.created.slice(0, 10)}</time><label class="pass-check"><input type="checkbox" data-postcard-keep="${r.id}" ${r.keepForTeacher ? "checked" : ""}><span>${msg(I, "Keep for my teacher", "Guardar para mi docente")}</span></label><div class="postcard-tools"><button type="button" class="btn" data-postcard-download="${r.id}">${msg(I, "Download postcard", "Descargar postal")}</button><button type="button" class="btn" data-postcard-delete="${r.id}">${msg(I, "Delete", "Eliminar")}</button></div></div></li>`)}</ul>` : html`<p class="fine">${msg(I, "No saved postcards yet.", "Aún no hay postales guardadas.")}</p>`}</section>`;
}
let stream = null;
let cameraRequest = 0;
let drawing = false;
function canvas() { return document.querySelector("[data-postcard-canvas]"); }
function stopCamera() { cameraRequest++; stream?.getTracks().forEach((track) => track.stop()); stream = null; const v = document.querySelector("[data-postcard-video]"); if (v) { v.srcObject = null; v.hidden = true; } const capture = document.querySelector("[data-postcard-capture]"); if (capture) capture.hidden = true; }
function status(I, text) { const el = document.querySelector("[data-postcard-status]"); if (el) el.textContent = text; }
export function unmount() { stopCamera(); }
export function onClick(e, I, rerender) {
  const t = e.target.closest("[data-postcard-camera], [data-postcard-capture], [data-postcard-picture], [data-postcard-draw], [data-postcard-save], [data-postcard-download], [data-postcard-delete]");
  if (!t) return false;
  if (t.hasAttribute("data-postcard-camera")) {
    (async () => { try { stopCamera(); const request = cameraRequest; const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); if (request !== cameraRequest) { next.getTracks().forEach((track) => track.stop()); return; } stream = next; const v = document.querySelector("[data-postcard-video]"); v.srcObject = stream; v.hidden = false; await v.play(); document.querySelector("[data-postcard-capture]").hidden = false; } catch { status(I, plain(I, "Camera unavailable. Use a lab picture or draw instead.", "La cámara no está disponible. Usa una imagen del laboratorio o dibuja.")); } })();
  } else if (t.hasAttribute("data-postcard-capture")) { const v = document.querySelector("[data-postcard-video]"); if (v?.videoWidth) { const c = canvas(); c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); stopCamera(); const button = document.querySelector("[data-postcard-capture]"); if (button) button.hidden = true; }
  } else if (t.hasAttribute("data-postcard-picture")) {
    stopCamera();
    const img = new Image(); img.onload = () => { const c = canvas(), x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); }; img.src = `${ART}/progress-passport.svg`;
  } else if (t.hasAttribute("data-postcard-draw")) { stopCamera(); bindDrawing(); const c = canvas(), x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#17324D"; x.font = "24px sans-serif"; x.fillText(plain(I, "Draw here with a finger or mouse", "Dibuja aquí con el dedo o el ratón"), 24, 48); }
  else if (t.hasAttribute("data-postcard-save")) {
    (async () => { try { const c = canvas(), x = c.getContext("2d"), sentence = document.querySelector("[data-postcard-alt]").value.trim(); if (!sentence) { status(I, plain(I, "Write a sentence first so the postcard has alt text.", "Escribe una oración primero para que la postal tenga texto alternativo.")); return; }
      if (stream) { const v = document.querySelector("[data-postcard-video]"); x.drawImage(v, 0, 0, c.width, c.height); stopCamera(); }
      x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(0, c.height - 100, c.width, 100); x.fillStyle = "#17324D"; x.font = "18px sans-serif"; const max = c.width - 36; let line = sentence; while (x.measureText(line).width > max && line.length > 8) line = `${line.slice(0, -4)}…`; x.fillText(line, 18, c.height - 54); x.font = "16px sans-serif"; x.fillText(document.querySelector("[data-postcard-place]").value.slice(0, 60), 18, c.height - 24); x.font = "14px sans-serif"; x.fillText(`${plain(I, "Date", "Fecha")}: ${new Date().toLocaleDateString(I.mode === "es" ? "es" : "en")}`, 18, 32); x.strokeStyle = "#1FA6A2"; x.lineWidth = 12; x.strokeRect(6, 6, c.width - 12, c.height - 12);
      const blob = await postcardBlob(c);
      if (!blob) return status(I, plain(I, "This picture is too large to save as a postcard.", "Esta imagen es demasiado grande para guardarla como postal."));
      await store.save({ blob, alt: sentence, place: document.querySelector("[data-postcard-place]").value, keepForTeacher: document.querySelector("[data-postcard-share]").checked });
      status(I, plain(I, "Postcard saved on this device.", "Postal guardada en este dispositivo."));
    } catch { status(I, plain(I, "Postcard could not be saved. Check that this browser allows on-device storage.", "No se pudo guardar la postal. Comprueba que este navegador permita el almacenamiento en el dispositivo.")); } })();
  } else if (t.hasAttribute("data-postcard-download")) {
    (async () => { const r = await store.get(t.dataset.postcardDownload); if (!r) return; const a = document.createElement("a"); a.href = store.downloadUrl(r.blob); a.download = `postcard-${r.created.slice(0, 10)}.jpg`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); })();
  } else if (t.hasAttribute("data-postcard-delete")) { store.remove(t.dataset.postcardDelete).then(rerender); }
  return true;
}
export function onChange(e, rerender) { const input = e.target.closest("[data-postcard-keep]"); if (!input) return false; store.setTeacherShare(input.dataset.postcardKeep, input.checked).then(rerender); return true; }
export function bindDrawing(root = document) {
  const c = root.querySelector("[data-postcard-canvas]"); if (!c || c.dataset.bound) return; c.dataset.bound = "1"; const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener("pointerdown", (e) => { drawing = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e), ctx = c.getContext("2d"); ctx.beginPath(); ctx.moveTo(x, y); });
  c.addEventListener("pointermove", (e) => { if (!drawing) return; const [x, y] = pos(e), ctx = c.getContext("2d"); ctx.strokeStyle = "#17324D"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineTo(x, y); ctx.stroke(); });
  c.addEventListener("pointerup", () => { drawing = false; }); c.addEventListener("pointercancel", () => { drawing = false; });
}
