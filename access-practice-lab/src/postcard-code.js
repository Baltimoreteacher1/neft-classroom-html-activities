// ACCESS1 carries postcard photos only when the learner explicitly marked them for a teacher.
import { exportCode } from "./store.js";
import * as postcardStore from "./postcard-store.js";

const PREFIX = "ACCESS1.";
const encode = (value) => btoa(unescape(encodeURIComponent(value)));
const decode = (value) => decodeURIComponent(escape(atob(value)));

export async function exportCodeWithPostcards() {
  const code = exportCode();
  const data = JSON.parse(decode(code.slice(PREFIX.length)));
  const postcards = await postcardStore.shared();
  if (postcards.length) data.postcards = postcards;
  return `${PREFIX}${encode(JSON.stringify(data))}`;
}

export async function importPostcardsFromCode(text) {
  const raw = String(text || "").trim();
  if (!raw.startsWith(PREFIX) || raw.length > 8_000_000) return 0;
  const parsed = JSON.parse(decode(raw.slice(PREFIX.length)));
  const items = Array.isArray(parsed?.postcards) ? parsed.postcards.slice(0, 6) : [];
  let saved = 0;
  for (const p of items) {
    if (!p || typeof p.image !== "string" || p.image.length > 610_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(p.image) || typeof p.alt !== "string") continue;
    const binary = atob(p.image.slice("data:image/jpeg;base64,".length));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    try {
      await postcardStore.save({ blob: new Blob([bytes], { type: "image/jpeg" }), alt: p.alt, place: p.place, keepForTeacher: true });
      saved++;
    } catch {
      break;
    }
  }
  return saved;
}
