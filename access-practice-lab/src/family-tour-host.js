// The Family Tour belongs to thelanguagepage.com only (functions/_lib/language-page.js blocks it on every other host).
// Entry points in the lab call this so eduwonderlab.com keeps its own family pages and never links to the tour.
// localhost is allowed so the tour can be developed and tested locally.
export const familyTourHost = (hostname = globalThis.location?.hostname || "") =>
  hostname === "thelanguagepage.com" || hostname === "www.thelanguagepage.com" || hostname === "localhost" || hostname === "127.0.0.1";
