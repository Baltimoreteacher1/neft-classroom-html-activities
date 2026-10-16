// Loads a generated family homework page in jsdom the way a browser assembles it
// (shared bundle read back from assets/homework/), with a recording speechSynthesis.
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { inlineSharedFromDisk } from "../../scripts/lib/homework-shared-assets.mjs";
import { lessonPath, REPO_ROOT } from "./curriculum-source.mjs";

export const VOICES = [
  { lang: "en-US", name: "Test English", localService: true },
  { lang: "es-MX", name: "Test Spanish", localService: true },
];

export async function homeworkDom(id, { lang = "bilingual", speech = true } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    if (e.type !== "css parsing" && e.type !== "not implemented") errors.push(e);
  });
  const source = inlineSharedFromDisk(
    REPO_ROOT,
    readFileSync(lessonPath(id, "homework.html"), "utf8"),
  );
  const spoken = [];
  const dom = new JSDOM(source, {
    url: `https://eduwonderlab.com/lessons/${id}/homework?route=full&lang=${lang}`,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.scrollTo = () => {};
      w.print = () => {};
      w.HTMLMediaElement.prototype.play = () => Promise.resolve();
      w.HTMLMediaElement.prototype.pause = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
      if (speech) {
        Object.defineProperty(w, "speechSynthesis", {
          value: {
            getVoices: () => VOICES,
            cancel() {},
            speak(u) {
              spoken.push({ text: u.text, lang: u.lang, voice: u.voice?.name });
              setTimeout(() => u.onend?.(), 0);
            },
          },
        });
        w.SpeechSynthesisUtterance = function (t) {
          this.text = t;
        };
      }
    },
  });
  await new Promise((r) => dom.window.addEventListener("load", r, { once: true }));
  return { dom, w: dom.window, d: dom.window.document, spoken, errors };
}

export const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
