// Read-aloud for math text, shared by trail rounds and the Game Room.
export const spoken = (text) =>
  text
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("−", " minus ")
    .replaceAll("= ?", " equals what?")
    .replace(/\^(\d+)/g, " to the power of $1")
    .replaceAll("√", "the square root of ");

export const canSpeak = () => "speechSynthesis" in window;

export function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(spoken(text)));
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
