// "Fit to the page": pick what you want in plain words (one page, more room to write, large print, ...), see the
// page-by-page preview of the real print pages, read what changed, and print. Teacher-only: the fitting modules are
// loaded on demand and never reach a student page.
//
//   const { el, refresh } = createFitPanel({ S, lang, getActivity, onPrint });
//   onPrint(options)   options is the fit to print (see x/fit-levels.js renderFitted), or null for "as it is now".

import { button, clear, domId, h, say } from "./ui.js";

const STYLE = `
.st-fit{display:grid;gap:1rem}
.st-fit fieldset{margin:0;padding:0;border:0;display:grid;gap:.5rem}
.st-fit legend{font-weight:700;margin-bottom:.25rem}
.st-fit-goal{display:flex;gap:.75rem;align-items:flex-start;min-height:2.75rem;padding:.5rem .75rem;border:1.5px solid var(--line-control);border-radius:var(--radius-sm,6px);cursor:pointer}
.st-fit-goal:has(input:checked){border-color:var(--brand-ink,#0b6b68);background:var(--surface-2,#f3f5f6)}
.st-fit-goal:focus-within{outline:3px solid var(--focus,#1a56db);outline-offset:2px}
.st-fit-goal input{margin-top:.2rem;width:1.25rem;height:1.25rem;flex:none}
.st-fit-goal b{display:block}
.st-fit-goal span span{display:block;color:var(--ink-3);font-size:.9375rem}
.st-fit-pages{display:flex;gap:1rem;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.st-fit-page{display:grid;gap:.25rem;justify-items:start;max-width:11rem}
.st-fit-clip{position:relative;overflow:hidden;border:1.5px solid var(--line-control);background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.15)}
.st-fit-clip iframe{position:absolute;left:0;top:0;width:816px;height:1056px;border:0;transform-origin:0 0;pointer-events:none}
.st-fit-page small{color:var(--ink-3);font-size:.875rem}
.st-fit-notes{margin:0;padding-left:1.25rem;display:grid;gap:.25rem}
.st-fit-alt[hidden]{display:none}
.st-fit-alt{border:1.5px solid var(--line);border-radius:var(--radius,8px);padding:.75rem 1rem;display:grid;gap:.5rem}
`;

let styled = false;
const ensureStyle = () => {
  if (styled) return;
  styled = true;
  document.head.append(h("style", { "data-fit-panel": "" }, STYLE));
};

const SCALE = 0.19;

/** A scaled, inert preview of one printed page. */
function pageThumb(srcdoc, title) {
  const frame = h("iframe", { title, sandbox: "", tabindex: "-1", "aria-hidden": "true", srcdoc });
  frame.style.transform = `scale(${SCALE})`;
  const clip = h("div.st-fit-clip", { role: "img", "aria-label": title }, frame);
  clip.style.width = `${816 * SCALE}px`;
  clip.style.height = `${1056 * SCALE}px`;
  return clip;
}

export function createFitPanel({ S, lang = "en", getActivity, onPrint }) {
  ensureStyle();
  const name = domId("fitgoal");
  const status = h("p.st-status", { role: "status", "aria-live": "polite" });
  const notes = h("ul.st-fit-notes");
  const pages = h("ol.st-fit-pages", {
    "aria-label": S("Pages of the printout", "Páginas de la impresión"),
  });
  const alt = h("div.st-fit-alt", { hidden: true });
  const printBtn = button(S("Print", "Imprimir"), () => onPrint?.(current), "primary", {
    disabled: true,
  });
  const say2 = (m) => {
    status.textContent = m;
    say(m);
  };
  const t = (n) => S(n.en, n.es);

  let current = null; // the fit that Print will use (null = as it is now)
  let goal = "";
  let token = 0;
  let mods = null;

  const load = async () => {
    mods ||= await Promise.all([
      import("../x/fit.js"),
      import("../x/fit-dom.js"),
      import("../x/fit-levels.js"),
      import("../x/fit-estimate.js"),
    ]);
    return mods;
  };

  async function previews(options, measured) {
    const [, dom, levels, est] = await load();
    const activity = getActivity();
    const html = levels.renderFitted(activity, options, { part: "student", lang }).html;
    const m = measured || (await dom.measureHtml(html));
    const thumbs = est.pageThumbnails(activity, options);
    const same = thumbs.pages === m.pages;
    clear(pages);
    for (let i = 0; i < m.pages; i++) {
      const blocks = same ? thumbs.perPage[i].blocks : [];
      const qs = blocks
        .filter((b) => b.label.en.startsWith("Question"))
        .map((b) => Number(b.label.en.split(" ")[1]));
      const range = qs.length
        ? S(
            `Questions ${qs[0]}${qs.length > 1 ? `-${qs.at(-1)}` : ""}`,
            `Preguntas ${qs[0]}${qs.length > 1 ? `-${qs.at(-1)}` : ""}`,
          )
        : "";
      const title = S(`Page ${i + 1} of ${m.pages}`, `Página ${i + 1} de ${m.pages}`);
      pages.append(
        h(
          "li.st-fit-page",
          pageThumb(dom.pageDocument(html, i), `${title}${range ? `: ${range}` : ""}`),
          h("small", `${title}${range ? ` · ${range}` : ""}`),
        ),
      );
    }
    return m;
  }

  async function apply(next) {
    const mine = ++token;
    say2(S("Working out the layout…", "Calculando el diseño…"));
    printBtn.disabled = true;
    try {
      const [fit, dom] = await load();
      const label = t(fit.FIT_GOALS.find((g) => g.id === next).label);
      const result = await fit.fitDocument(getActivity(), next, {
        lang,
        measurePages: (html) => dom.measureHtml(html),
      });
      if (mine !== token) return;
      clear(notes);
      alt.hidden = true;
      clear(alt);
      for (const n of result.notes) notes.append(h("li", t(n)));
      if (result.ok) {
        current = result.options;
        await previews(result.options);
        if (mine !== token) return;
        printBtn.disabled = false;
        say2(
          S(
            `Ready: ${label}. It prints on ${result.pages} ${result.pages === 1 ? "page" : "pages"}.`,
            `Listo: ${label}. Se imprime en ${result.pages} ${result.pages === 1 ? "página" : "páginas"}.`,
          ),
        );
      } else {
        current = null;
        say2(
          S(
            "That cannot be done at a readable size.",
            "Eso no se puede hacer con un tamaño legible.",
          ),
        );
        if (result.alternative) {
          const a = result.alternative;
          const other = (await load())[0].FIT_GOALS.find((g) => g.id === a.goal);
          alt.hidden = false;
          alt.append(
            h("p", h("b", S("A better choice", "Una mejor opción")), " ", t(a.message)),
            button(
              S(`Use "${t(other.label)}" instead`, `Usar "${t(other.label)}" en su lugar`),
              () => choose(a.goal),
              "small",
            ),
          );
        }
        await previews(null);
      }
    } catch {
      if (mine === token)
        say2(
          S(
            "The layout could not be worked out. Your sheet is unchanged.",
            "No se pudo calcular el diseño. Su hoja no cambió.",
          ),
        );
    }
  }

  const radios = new Map();
  function choose(id) {
    goal = id;
    for (const [gid, input] of radios) input.checked = gid === id;
    apply(id);
  }

  const group = h("fieldset", h("legend", S("How should it print?", "¿Cómo debe imprimirse?")));
  const build = async () => {
    const [fit] = await load();
    for (const g of fit.FIT_GOALS) {
      const input = h("input", { type: "radio", name, value: g.id, onchange: () => choose(g.id) });
      radios.set(g.id, input);
      group.append(
        h("label.st-fit-goal", input, h("span", h("b", t(g.label)), h("span", t(g.help)))),
      );
    }
  };

  async function refresh() {
    token++;
    clear(notes);
    alt.hidden = true;
    current = null;
    await build_once();
    if (goal) return apply(goal);
    say2(S("This is how the sheet prints now.", "Así se imprime la hoja ahora."));
    printBtn.disabled = false;
    try {
      await previews(null);
    } catch {
      say2(S("The preview could not be drawn.", "No se pudo dibujar la vista previa."));
    }
  }

  let built = null;
  const build_once = () => (built ||= build());

  const el = h(
    "div.st-panel-body.st-fit",
    h(
      "p.st-hint",
      S(
        "Choose what you need. Nothing is deleted or reordered, text never gets smaller than 11pt, and the answer key stays on the teacher copy.",
        "Elija lo que necesita. No se borra ni se reordena nada, el texto nunca baja de 11 pt y la clave de respuestas queda solo en la copia del maestro.",
      ),
    ),
    group,
    status,
    alt,
    h("section", h("h3", S("Pages", "Páginas")), pages),
    h("section", h("h3", S("What changed", "Qué cambió")), notes),
    h("div.st-actions", printBtn),
  );
  refresh();
  return { el, refresh };
}
