// Power Up! shared screen helpers: element lookup, status line, coach text, views and banners.

export const $ = (id) => document.getElementById(id);
export const fmt = (n) => n.toLocaleString("en-US");

export function say(msg) {
  $("status").textContent = msg;
}

export function coach(msg, kind = "") {
  const c = $("coach");
  c.textContent = msg;
  c.className = `coach ${kind}`;
  say(msg);
}

export function show(id) {
  for (const v of document.querySelectorAll(".view")) v.hidden = v.id !== id;
  $("main").scrollIntoView?.({ block: "start" });
}

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Re-run a one-shot CSS animation class. */
export function replay(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

/** Full-board message over the arena; resolves when the button is pressed. */
export function banner(title, sub, btn, trail = []) {
  $("bannerTitle").textContent = title;
  $("bannerSub").textContent = sub;
  const list = $("bannerTrail");
  list.replaceChildren(...trail.map((t) => el("li", "", t)));
  list.hidden = trail.length === 0;
  const b = $("bannerBtn");
  b.textContent = btn;
  $("banner").hidden = false;
  b.focus();
  say(`${title}. ${sub}`);
  return new Promise((resolve) => {
    b.onclick = () => {
      $("banner").hidden = true;
      resolve();
    };
  });
}

export function floater(text, target) {
  const screen = $("main");
  const c = screen.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  const f = el("div", "floater", text);
  f.style.left = `${r.left - c.left + r.width / 2 - 30}px`;
  f.style.top = `${r.top - c.top}px`;
  screen.append(f);
  setTimeout(() => f.remove(), 1000);
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
