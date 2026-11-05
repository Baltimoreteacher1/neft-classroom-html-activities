// The lab is served under two names from one codebase: "ACCESS Practice Lab" on eduwonderlab.com and
// "The Language Page, powered by EduWonderLab" on thelanguagepage.com. The server renames the HTML it sends
// (functions/_lib/language-page.js, for crawlers and link previews); this keeps the running app saying the same
// thing after it renders. tools/access-brand.test.mjs fails if the two spellings drift.
export const LANGUAGE_PAGE_HOST = "thelanguagepage.com";
export const BRAND = { name: "The Language Page", poweredBy: "Powered by EduWonderLab" };

export const onLanguagePage = (hostname = location.hostname) => hostname === LANGUAGE_PAGE_HOST;

/** The product name for this address; `fallback` is the lab's own (possibly Spanish) name. */
export const brandName = (fallback) => (onLanguagePage() ? BRAND.name : fallback);

/** Title for a page: "<page> · <product>". */
export const brandTitle = (page, fallback = "ACCESS Practice Lab") =>
  page ? `${page} · ${brandName(fallback)}` : brandName(fallback);
