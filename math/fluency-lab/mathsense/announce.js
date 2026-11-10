// The page's one polite region for announcements. Every readout a screen reader needs goes through here.
// Rapid changes (a held arrow key, a drag) collapse into the last message.
let timer = 0;

export function announce(message, { delay = 180 } = {}) {
  const region = document.getElementById("ms-live");
  if (!region || !message) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 30);
  }, delay);
}
