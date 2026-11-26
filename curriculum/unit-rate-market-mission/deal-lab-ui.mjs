/* Unit Rate Market Mission · Deal Lab: small DOM helpers shared by the stations. */
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const h = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
/** Polite announcement through the page's existing live region. */
export function announce(msg) {
  const live = document.getElementById("live");
  if (!live) return;
  live.textContent = "";
  requestAnimationFrame(() => {
    live.textContent = msg;
  });
}
/** Show a message in a .feedback box (page styles: good / bad / hint) and announce it. */
export function feedback(el, type, html) {
  if (!el) return;
  el.className = `feedback show ${type}`;
  el.innerHTML = html;
  announce(el.textContent);
}
export const clearFeedback = (el) => {
  if (el) {
    el.className = "feedback";
    el.innerHTML = "";
  }
};
