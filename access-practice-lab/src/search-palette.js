// The command palette: a modal dialog holding an ARIA combobox over the site search (src/lang/site-search.js).
//   Ctrl/Cmd+K or "/" opens it · type English or Spanish · Up/Down moves · Enter opens · Esc closes.
// While it is open the page behind it is inert. Every result is a real link (or button), so Enter simply activates it.
import { i18nFor } from "./i18n.js";
import { KIND_LABEL, highlight, hrefFor, queryWords, search, suggestions } from "./lang/site-search.js";
import { loadSearch } from "./search-data.js";
import { html, icon, raw, toHtml } from "./util.js";

let overlay = null;

export function runCommand(cmd) {
  if (cmd.startsWith("lang-")) document.querySelector(`.lab-tools [data-lang-mode="${cmd.slice(5)}"]`)?.click();
  else if (cmd === "text-bigger") document.querySelector('[data-text-size="0.1"]')?.click();
  else if (cmd === "text-smaller") document.querySelector('[data-text-size="-0.1"]')?.click();
  else if (cmd === "print") window.print();
}

/** One result as list-item markup. `n` makes the option id unique. */
export function resultHTML(I, r, n, band, qw) {
  const d = r.doc;
  const title = I.S(d.title, d.titleEs || d.title);
  const text = I.spanish && d.textEs ? d.textEs : d.text;
  const kind = KIND_LABEL[d.kind];
  const body = html`${icon(d.icon || "search")}<span class="sx-r-main"><span class="sx-r-title" lang="${I.spanish && d.titleEs ? "es" : "en"}">${raw(highlight(title, qw))}</span>${I.bilingual && d.titleEs && d.titleEs !== d.title ? html`<span class="sx-r-es" lang="es">${d.titleEs}</span>` : ""}${text ? html`<span class="sx-r-text" lang="${I.spanish && d.textEs ? "es" : "en"}">${raw(highlight(text, qw))}</span>` : ""}</span><span class="sx-r-kind">${I.S(kind.en, kind.es)}</span>`;
  const href = hrefFor(d, band);
  return toHtml(
    href
      ? html`<li id="sx-o-${n}" role="option" aria-selected="false" class="sx-option"><a tabindex="-1" href="${href}">${body}</a></li>`
      : html`<li id="sx-o-${n}" role="option" aria-selected="false" class="sx-option"><button type="button" tabindex="-1" data-sx-cmd="${d.cmd || ""}">${body}</button></li>`,
  );
}

export async function openPalette(ctx) {
  if (overlay) return;
  const I = i18nFor(ctx);
  const band = ctx.band;
  const opener = document.activeElement;
  overlay = document.createElement("div");
  overlay.className = "sx-overlay no-print";
  overlay.innerHTML = toHtml(html`<div class="sx-dialog" role="dialog" aria-modal="true" aria-labelledby="sxTitle">
    <h2 id="sxTitle" class="visually-hidden">${I.T("Search the lab", "Buscar en el laboratorio")}</h2>
    <div class="sx-field">${icon("search")}
      <input id="sxInput" class="sx-input" type="text" role="combobox" aria-expanded="false" aria-controls="sxList" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="${I.S("Search words, activities, pages, actions", "Buscar palabras, actividades, páginas, acciones")}" aria-label="${I.S("Search the lab", "Buscar en el laboratorio")}" />
      <button type="button" class="sx-close" data-sx-close aria-label="${I.S("Close search", "Cerrar búsqueda")}">${icon("close")}</button>
    </div>
    <label class="sx-scope"><input type="checkbox" id="sxScope" checked /> <span>${I.T(`Only my grades (${band.replace("-", "–")})`, `Solo mis grados (${band.replace("-", "–")})`)}</span></label>
    <ul id="sxList" class="sx-list" role="listbox" aria-label="${I.S("Results", "Resultados")}"></ul>
    <p id="sxEmpty" class="sx-empty" hidden></p>
    <p id="sxStatus" class="visually-hidden" role="status" aria-live="polite"></p>
    <p class="sx-hint fine">${I.T("Up and Down arrows move. Enter opens. Escape closes. Try a Spanish word.", "Las flechas arriba y abajo se mueven. Enter abre. Escape cierra. Prueba una palabra en español.")}</p>
    <p class="sx-hint fine"><a href="/access-practice-lab/search?grades=${band}" data-sx-all>${I.T("Open the full results page", "Abrir la página de resultados completa")}</a></p>
  </div>`);
  const hidden = [...document.body.children].filter((el) => el !== overlay && !el.hasAttribute("inert") && el.tagName !== "SCRIPT");
  document.body.append(overlay);
  for (const el of hidden) el.setAttribute("inert", "");
  const $ = (s) => overlay.querySelector(s);
  const input = $("#sxInput");
  const list = $("#sxList");
  let items = [];
  let active = -1;
  let data = null;

  const setActive = (i) => {
    active = items.length ? (i + items.length) % items.length : -1;
    list.querySelectorAll("[role=option]").forEach((li, n) => {
      li.setAttribute("aria-selected", String(n === active));
      if (n === active) li.scrollIntoView?.({ block: "nearest" });
    });
    if (active >= 0) input.setAttribute("aria-activedescendant", `sx-o-${active}`);
    else input.removeAttribute("aria-activedescendant");
  };
  const draw = () => {
    const q = input.value;
    const qw = queryWords(q);
    const scoped = $("#sxScope").checked;
    items = !data ? [] : qw.length ? search(data.docs, q, { band, all: !scoped, bridge: data.bridge, limit: 12 }) : suggestions(data.docs, scoped ? band : "");
    list.innerHTML = items.map((r, n) => resultHTML(I, r, n, band, qw)).join("");
    input.setAttribute("aria-expanded", String(items.length > 0));
    const empty = $("#sxEmpty");
    empty.hidden = items.length > 0 || !qw.length;
    empty.textContent = I.S(`No results for "${q.trim()}". Try another word, a Spanish word, or turn off "Only my grades".`, `No hay resultados para "${q.trim()}". Prueba otra palabra, una palabra en español o desactiva "Solo mis grados".`);
    $("#sxStatus").textContent = !data ? I.S("Loading…", "Cargando…") : qw.length ? (items.length ? I.S(`${items.length} results. Use the arrow keys.`, `${items.length} resultados. Usa las flechas.`) : empty.textContent) : I.S("Suggestions", "Sugerencias");
    setActive(items.length ? 0 : -1);
  };
  const close = () => {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    for (const el of hidden) el.removeAttribute("inert");
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    else document.querySelector("#app h1")?.focus?.();
  };
  const activate = (li) => {
    const el = li?.querySelector("a, button");
    if (!el) return;
    if (el.dataset.sxCmd) {
      const cmd = el.dataset.sxCmd;
      close();
      runCommand(cmd);
      return;
    }
    const link = el;
    close();
    // Clicking the real link lets the app's own link handling route it (or leave the lab for a studio).
    document.body.append(link);
    link.click();
    link.remove();
  };

  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === "Home" && e.target === input && items.length) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && e.target === input && items.length) {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === "Enter" && e.target === input) {
      e.preventDefault();
      activate(list.children[active]);
    } else if (e.key === "Tab") {
      const f = [...overlay.querySelectorAll("input, button, a[href]")].filter((el) => el.tabIndex >= 0 && !el.disabled);
      const first = f[0];
      const last = f.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-sx-close]")) return close();
    const li = e.target.closest("[role=option]");
    if (li) {
      e.preventDefault();
      activate(li);
    } else if (e.target.closest("[data-sx-all]")) {
      const q = input.value.trim();
      const url = new URL("/access-practice-lab/search", location.origin);
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("grades", band);
      e.preventDefault();
      close();
      ctx.navigate(url.pathname + url.search);
    }
  });
  input.addEventListener("input", draw);
  $("#sxScope").addEventListener("change", draw);
  draw();
  input.focus();
  try {
    data = await loadSearch();
  } catch {
    data = { docs: [], bridge: null };
  }
  if (overlay) draw();
}
