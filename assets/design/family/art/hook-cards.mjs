// Six "hook card" templates for the opening story of a family homework page: price tag, recipe card, score board,
// map pin, ticket, receipt. Each is a PURE function (slots -> SVG string). Text slots are marked data-slot="<name>"
// so a generator, a test or a designer can see exactly which words are the lesson's and which are the template's.
//
//   renderHookCard("price", { item: "Sneakers", price: "$70", note: "30% off today" }, { lang: "en" })
//
// Rules: viewBox 340 wide so it reads at 1:1 on a 390px phone; every text >= 14px; slot text is clipped to a maximum
// length (with an ellipsis) rather than allowed to run off the card; all colours are CSS variables with token
// fallbacks; role=img with a <title> built from the slot values; ids carry the language so EN and ES copies of one
// card can share a page. Numbers on the card come from the slots, never from the template.

import { esc, hash, n1 } from "./math-kit.mjs";

const W = 340;
const CSS = `.h-t{font:600 16px var(--ds-font-text,system-ui,-apple-system,"Segoe UI",sans-serif);fill:var(--ink,#17324D)}.h-b{font-weight:700}.h-s{font-size:14px}.h-l{font-size:20px}.h-xl{font-size:40px;font-weight:800}.h-w{fill:var(--art-card,#FFFFFF)}.h-a{fill:var(--unit-accent,#1FA6A2)}.h-tint{fill:var(--unit-accent-tint,#DBF1F0)}.h-y{fill:var(--art-amber,#F2C15B)}.h-k{fill:var(--ink,#17324D)}.h-ln{fill:none;stroke:var(--ink,#17324D);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.h-g{fill:none;stroke:var(--ink,#17324D);stroke-opacity:.18;stroke-width:1.5}.h-board{fill:var(--art-board,#17324D)}.h-bt{font:700 16px var(--ds-font-text,system-ui,sans-serif);fill:var(--art-board-text,#F7F4EC)}.h-bs{font:800 46px var(--ds-font-text,system-ui,sans-serif);fill:var(--art-amber,#F2C15B)}.h-r{fill:var(--art-coral,#D9694A)}.h-n{fill:var(--art-green,#7FB27E)}.h-p{fill:var(--paper,#F7F4EC)}`;

export const HOOK_KINDS = Object.freeze(["price", "recipe", "score", "map", "ticket", "receipt"]);

/** Default slot text, used by the gallery and the static samples; max = the longest text the layout holds. */
export const HOOK_SLOTS = {
  price: { item: { max: 20, en: "Running shoes", es: "Tenis para correr" }, price: { max: 7, en: "$70", es: "$70" }, note: { max: 24, en: "30% off today", es: "30% menos hoy" } },
  recipe: { title: { max: 22, en: "Fruit smoothie", es: "Batido de frutas" }, line1: { max: 26, en: "3 cups apple juice", es: "3 tazas de jugo" }, line2: { max: 26, en: "2 cups sparkling water", es: "2 tazas de agua con gas" }, line3: { max: 26, en: "1 cup ice", es: "1 taza de hielo" }, note: { max: 30, en: "Makes 6 cups", es: "Rinde 6 tazas" } },
  score: { home: { max: 9, en: "Hawks", es: "Halcones" }, away: { max: 9, en: "Wolves", es: "Lobos" }, homeScore: { max: 3, en: "42", es: "42" }, awayScore: { max: 3, en: "35", es: "35" }, period: { max: 16, en: "Second half", es: "Segundo tiempo" } },
  map: { place: { max: 24, en: "Riverside Park", es: "Parque Riverside" }, detail: { max: 34, en: "Walk from the bus stop", es: "Camina desde la parada" }, distance: { max: 14, en: "1.5 miles", es: "1.5 millas" } },
  ticket: { event: { max: 22, en: "Movie night", es: "Noche de cine" }, detail: { max: 28, en: "Saturday, 6:30 p.m.", es: "Sábado, 6:30 p. m." }, price: { max: 7, en: "$8", es: "$8" }, stub: { max: 12, en: "Admit one", es: "Una entrada" } },
  receipt: { store: { max: 22, en: "Corner Market", es: "Mercado de la esquina" }, item1: { max: 16, en: "Bread", es: "Pan" }, price1: { max: 7, en: "$3.50", es: "$3.50" }, item2: { max: 16, en: "Milk", es: "Leche" }, price2: { max: 7, en: "$4.25", es: "$4.25" }, item3: { max: 16, en: "Apples", es: "Manzanas" }, price3: { max: 7, en: "$5.00", es: "$5.00" }, totalLabel: { max: 12, en: "Total", es: "Total" }, total: { max: 8, en: "$?", es: "$?" } },
};

const KIND_NAME = {
  price: { en: "Price tag", es: "Etiqueta de precio" },
  recipe: { en: "Recipe card", es: "Tarjeta de receta" },
  score: { en: "Score board", es: "Marcador" },
  map: { en: "Map pin", es: "Marcador de mapa" },
  ticket: { en: "Ticket", es: "Boleto" },
  receipt: { en: "Receipt", es: "Recibo" },
};

const clip = (s, max) => (s.length > max ? `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…` : s);

function slotsFor(kind, given, lang) {
  const spec = HOOK_SLOTS[kind];
  for (const key of Object.keys(given ?? {})) {
    if (!(key in spec)) throw new Error(`hook card "${kind}": unrecognized slot "${key}" (allowed: ${Object.keys(spec).join(", ")})`);
  }
  const out = {};
  for (const [key, def] of Object.entries(spec)) {
    const v = given?.[key];
    if (v === undefined || v === null) throw new Error(`hook card "${kind}": slot "${key}" is required`);
    const s = typeof v === "object" ? (lang === "es" ? v.es || v.en : v.en || v.es) : String(v);
    if (!s) throw new Error(`hook card "${kind}": slot "${key}" is empty`);
    out[key] = clip(s, def.max);
  }
  return out;
}

const slot = (name, x, y, s, cls = "", anchor = "start", raw = false) => `<text class="${raw ? cls : `h-t ${cls}`}" data-slot="${name}" x="${n1(x)}" y="${n1(y)}" text-anchor="${anchor}">${esc(s)}</text>`;

const CARDS = {
  price: (s) => {
    const pill = Math.min(228, s.note.length * 8.4 + 28);
    return {
      h: 212,
      title: `${s.item}, ${s.price}, ${s.note}`,
      body: `<path class="h-ln" d="M62 100Q22 66 42 18"/><path class="h-y" d="M22 106L56 48h262a8 8 0 0 1 8 8v116a8 8 0 0 1-8 8H56z"/><circle class="h-p" cx="58" cy="106" r="8"/>${slot("item", 88, 86, s.item, "h-b h-l")}${slot("price", 88, 134, s.price, "h-xl")}<rect class="h-w" x="88" y="146" width="${n1(pill)}" height="28" rx="14"/>${slot("note", 88 + pill / 2, 165, s.note, "h-b h-s", "middle")}`,
    };
  },
  recipe: (s) => ({
    h: 226,
    title: `${s.title}: ${s.line1}; ${s.line2}; ${s.line3}. ${s.note}`,
    body: `<rect class="h-w" x="10" y="8" width="320" height="208" rx="12"/><path class="h-tint" d="M10 20a12 12 0 0 1 12-12h296a12 12 0 0 1 12 12v32H10z"/><path class="h-ln" d="M10 52h320" stroke="var(--unit-accent,#1FA6A2)"/>${slot("title", 28, 38, s.title, "h-b h-l")}${[s.line1, s.line2, s.line3].map((l, i) => `<circle class="h-a" cx="34" cy="${84 + i * 34}" r="6"/>${slot(`line${i + 1}`, 52, 90 + i * 34, l)}`).join("")}<path class="h-g" d="M28 180h284"/>${slot("note", 28, 202, s.note, "h-b h-s")}`,
  }),
  score: (s) => ({
    h: 176,
    title: `${s.home} ${s.homeScore}, ${s.away} ${s.awayScore}, ${s.period}`,
    body: `<rect class="h-board" x="8" y="12" width="324" height="156" rx="16"/><rect x="24" y="62" width="132" height="70" rx="10" fill="var(--art-board-panel,#24496D)"/><rect x="184" y="62" width="132" height="70" rx="10" fill="var(--art-board-panel,#24496D)"/>${slot("home", 90, 50, s.home, "h-bt", "middle", true)}${slot("away", 250, 50, s.away, "h-bt", "middle", true)}${slot("homeScore", 90, 112, s.homeScore, "h-bs", "middle", true)}${slot("awayScore", 250, 112, s.awayScore, "h-bs", "middle", true)}<path d="M170 74v46" stroke="var(--art-board-text,#F7F4EC)" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 7"/>${slot("period", 170, 156, s.period, "h-bt h-s", "middle", true)}`,
  }),
  map: (s) => ({
    h: 210,
    title: `${s.place}. ${s.detail}. ${s.distance}`,
    body: `<rect class="h-tint" x="8" y="8" width="324" height="124" rx="14"/><path class="h-w" d="M8 78h324v18H8zM96 8h18v124H96zM232 8h18v124h-18z"/><path class="h-n" d="M262 20h62a8 8 0 0 1 8 8v36h-70z" fill-opacity=".8"/><path class="h-ln" d="M40 108Q96 100 105 78T240 87" stroke-dasharray="2 9" stroke="var(--unit-accent,#1FA6A2)" stroke-width="4"/><circle class="h-k" cx="40" cy="108" r="6"/><path class="h-r" d="M240 90q-20-22-20-38a20 20 0 0 1 40 0q0 16-20 38z"/><circle class="h-w" cx="240" cy="52" r="7"/><rect class="h-w" x="8" y="140" width="324" height="62" rx="12"/>${slot("place", 24, 164, s.place, "h-b h-l")}${slot("detail", 24, 190, s.detail, "h-s")}<rect class="h-y" x="232" y="170" width="92" height="26" rx="13"/>${slot("distance", 278, 189, s.distance, "h-b h-s", "middle")}`,
  }),
  ticket: (s) => ({
    h: 150,
    title: `${s.event}, ${s.detail}, ${s.price}, ${s.stub}`,
    body: `<path class="h-y" d="M20 14h300a10 10 0 0 1 10 10v26a16 16 0 0 0 0 32v26a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10V82a16 16 0 0 0 0-32V24a10 10 0 0 1 10-10z" transform="translate(0 10)"/><path d="M236 34v92" stroke="var(--ink,#17324D)" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 9"/>${slot("event", 30, 72, s.event, "h-b h-l")}${slot("detail", 30, 104, s.detail, "h-s")}${slot("price", 284, 86, s.price, "h-b h-l", "middle")}${slot("stub", 284, 112, s.stub, "h-b h-s", "middle")}`,
  }),
  receipt: (s) => {
    const rows = [1, 2, 3].map((i) => `${slot(`item${i}`, 48, 84 + (i - 1) * 28, s[`item${i}`])}${slot(`price${i}`, 292, 84 + (i - 1) * 28, s[`price${i}`], "", "end")}`).join("");
    const bottom = 204;
    const zig = "l-11.5 8l-11.5-8".repeat(12);
    return {
      h: 232,
      title: `${s.store}: ${s.item1} ${s.price1}; ${s.item2} ${s.price2}; ${s.item3} ${s.price3}; ${s.totalLabel} ${s.total}`,
      body: `<path class="h-w" d="M32 14H308V${bottom}${zig}z"/>${slot("store", 170, 44, s.store, "h-b h-l", "middle")}<path class="h-g" d="M48 54h244" stroke-dasharray="4 5"/>${rows}<path class="h-g" d="M48 148h244" stroke-dasharray="4 5"/>${slot("totalLabel", 48, 184, s.totalLabel, "h-b h-l")}<rect x="206" y="162" width="86" height="30" rx="8" fill="var(--m-unknown,#FDF5E5)" stroke="var(--m-unknown-ink,#886C33)" stroke-width="2" stroke-dasharray="5 4"/>${slot("total", 249, 184, s.total, "h-b h-l", "middle")}`,
    };
  },
};

export function renderHookCard(kind, given, { lang = "en" } = {}) {
  if (!HOOK_KINDS.includes(kind)) throw new Error(`Unknown hook card ${JSON.stringify(kind)}; expected one of ${HOOK_KINDS.join(", ")}`);
  if (lang !== "en" && lang !== "es") throw new Error(`renderHookCard: lang must be "en" or "es"; got ${JSON.stringify(lang)}`);
  const s = slotsFor(kind, given, lang);
  const { h, title, body } = CARDS[kind](s);
  const id = `hk-${hash(`${kind}|${JSON.stringify(s)}`)}-${lang}`;
  const name = KIND_NAME[kind][lang];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="hook-card hook-${kind}" lang="${lang}" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-labelledby="${id}"><title id="${id}">${esc(`${name}: ${title}`)}</title><style>${CSS}</style>${body}</svg>`;
}

/** The default sample slots for a card in one language (gallery, static samples, tests). */
export const sampleSlots = (kind, lang = "en") => Object.fromEntries(Object.entries(HOOK_SLOTS[kind]).map(([k, v]) => [k, v[lang]]));
