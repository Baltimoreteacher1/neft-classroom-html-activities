// Goal setting: the browser-side helpers the studio form and the lab page share: the saved draft, the bank loader,
// the download and print helpers. The draft lives under one key in this origin's storage, so a goal started on the
// teacher's studio page is the one the student sees in the lab, and the other way round.
import { emptyForm } from "./sheet.js";

const KEY = "accessPracticeLab:v1:goal-form";
const BASE = "/access-practice-lab";
const banks = new Map();

export function loadForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Array.isArray(saved.goals) && saved.goals.length) return { ...emptyForm(), ...saved };
  } catch {
    /* a blocked or corrupt store simply starts a fresh form */
  }
  return emptyForm();
}
export function saveForm(form) {
  try {
    localStorage.setItem(KEY, JSON.stringify(form));
    return true;
  } catch {
    return false;
  }
}
export const clearForm = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};

/** One grade band's goal bank (content/goals/<band>.json), fetched once. */
export function loadBank(band) {
  if (!banks.has(band)) {
    const p = fetch(`${BASE}/content/goals/${band}.json`, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`goals ${band}: HTTP ${r.status}`);
      return r.json();
    });
    banks.set(band, p);
    p.catch(() => banks.delete(band));
  }
  return banks.get(band);
}

/** Save bytes as a file the person downloads. */
export function download(name, bytes, mime) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const fileName = (form, ext) =>
  `Language-Goals-${(form.student || "Student").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "Student"}.${ext}`;

/** Print or Save as PDF: puts the sheets in a print-only root, prints, takes it away again. */
export function printSheets(htmlStrings) {
  document.getElementById("gfPrintRoot")?.remove();
  const root = document.createElement("div");
  root.id = "gfPrintRoot";
  const doc = new DOMParser().parseFromString(htmlStrings.join(""), "text/html");
  root.append(...doc.body.childNodes);
  document.body.append(root);
  document.body.classList.add("gf-printing");
  const done = () => {
    document.body.classList.remove("gf-printing");
    root.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}
