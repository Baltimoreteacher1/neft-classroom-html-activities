// Read-aloud for math text, shared by trail rounds and the Game Room.
export const spoken = (text) =>
  String(text || "")
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("−", " minus ")
    .replaceAll("= ?", " equals what?")
    .replace(/\^(\d+)/g, " to the power of $1")
    .replaceAll("√", "the square root of ");

export const spokenEs = (text) =>
  String(text || "")
    .replace(/(\d+)\/(\d+)/g, "$1 sobre $2")
    .replaceAll("×", " por ")
    .replaceAll("*", " por ")
    .replaceAll("÷", " entre ")
    .replaceAll("/", " entre ")
    .replaceAll("−", " menos ")
    .replaceAll("-", " menos ")
    .replaceAll("+", " más ")
    .replaceAll("= ?", " ¿es igual a qué?")
    .replaceAll("=", " es igual a ")
    .replace(/\^(\d+)/g, " elevado a la $1")
    .replaceAll("√", "la raíz cuadrada de ");

export const canSpeak = () => "speechSynthesis" in window;

// `raw` reads ordinary words as they are: a definition such as "the symbol = means equal" must not become "es igual a".
export function speak(text, lang = "en", { raw = false } = {}) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const isEs = lang === "es";
  const processed = raw ? String(text || "") : isEs ? spokenEs(text) : spoken(text);
  const utterance = new SpeechSynthesisUtterance(processed);
  utterance.lang = isEs ? "es-ES" : "en-US";
  speechSynthesis.speak(utterance);
}

// One live region that is never re-created, so screen readers announce every game message reliably.
let region = null;
let last = "";
export function announce(text) {
  const message = String(text || "").trim();
  if (!message) return;
  if (!region) {
    region = document.createElement("div");
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    document.body.append(region);
  }
  // A repeated message still needs a change to be announced again.
  region.textContent = message === last ? `${message}\u200b` : message;
  last = message === last ? `${message}\u200b` : message;
}

// Announce the visible hint line of a game after it re-renders.
export const syncLive = (host) => announce(host.querySelector(".gm-note")?.textContent);
