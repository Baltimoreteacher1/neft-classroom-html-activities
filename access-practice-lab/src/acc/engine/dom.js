// Tiny DOM builder shared by every ACCESS engine view. Text always goes in through textContent, never innerHTML.
export const h = (doc, tag, props = {}, ...kids) => {
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...kids.flat().filter((x) => x !== null && x !== undefined && x !== false));
  return el;
};
export const fmtClock = (seconds) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, Math.ceil(seconds)) % 60).padStart(2, "0")}`;
