// Lightweight toast stack (badges, saved notes, reminders).
import { qs } from "./dom.js";

export function toast(message, { icon = "✦", detail = "", tone = "default", ms = 4200 } = {}) {
  const stack = qs("#toasts");
  if (!stack) return;
  const node = document.createElement("div");
  node.className = `toast toast-${tone}`;
  node.setAttribute("role", "status");
  node.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-copy"><strong>${message}</strong>${detail ? `<small>${detail}</small>` : ""}</span>
    <button class="toast-close" type="button" aria-label="Dismiss">×</button>`;
  stack.appendChild(node);
  const close = () => {
    node.classList.add("is-leaving");
    window.setTimeout(() => node.remove(), 260);
  };
  node.querySelector(".toast-close")?.addEventListener("click", close);
  window.setTimeout(close, ms);
  return node;
}
