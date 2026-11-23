// Vocabulary Academy reader — read-along. A thin controller over src/speech.js; the text work is in text.js (pure).
// One speech segment per sentence: the sentence being said is always known (onSegment), and where the browser reports
// word boundaries the spoken word is lit too. A browser that reports none still gets the sentence-level highlight, which
// is the fallback. Pause is "stop here and resume this sentence" because pause()/resume() is unreliable across browsers.
import * as realSpeech from "../../speech.js";
import { locateBoundary, readAlongPlan, tokenSpans } from "./text.js";

export const SPEEDS = [0.75, 1, 1.25];
const BASE_RATE = 0.9;

/**
 * @param {{ paras:string[], speech?:object, onSentence:(para:number, sentence:number)=>void,
 *           onToken:(para:number, token:number)=>void, onState:(state:string)=>void }} opts
 * state is "idle" | "playing" | "paused".
 */
export function createReadAlong({ paras, speech = realSpeech, onSentence, onToken, onState }) {
  const tokens = paras.map((p) => tokenSpans(p));
  let state = "idle";
  let run = 0;
  let at = { para: 0, sentence: 0 };
  let rate = 1;
  const set = (s) => {
    if (state === s) return;
    state = s;
    onState?.(s);
  };
  const clear = () => {
    onSentence?.(-1, -1);
    onToken?.(-1, -1);
  };

  async function play(from = at) {
    const mine = ++run;
    at = { para: from.para || 0, sentence: from.sentence || 0 };
    const plan = readAlongPlan(paras, at);
    if (!plan.length || !speech.canSpeak?.()) return set("idle");
    set("playing");
    const finished = await speech.speak(
      plan.map((s) => s.text),
      {
        rate: BASE_RATE * rate,
        onSegment: (i) => {
          if (run !== mine) return;
          at = { para: plan[i].para, sentence: plan[i].sentence };
          onSentence?.(at.para, at.sentence);
          onToken?.(-1, -1);
        },
        onBoundary: ({ index, charIndex }) => {
          if (run !== mine || !plan[index]) return;
          const hit = locateBoundary(plan[index], tokens[plan[index].para], charIndex);
          if (hit.token >= 0) onToken?.(hit.para, hit.token);
        },
      },
    );
    if (run !== mine) return; // replaced or stopped by the learner
    if (finished) at = { para: 0, sentence: 0 };
    clear();
    set("idle");
  }

  return {
    get state() {
      return state;
    },
    get supported() {
      return Boolean(speech.canSpeak?.());
    },
    get rate() {
      return rate;
    },
    /** Start (or restart) from a sentence; no argument continues from where it paused, else the beginning. */
    play,
    pause() {
      if (state !== "playing") return;
      run += 1;
      speech.stop?.();
      set("paused");
    },
    resume() {
      if (state === "paused") return play(at);
    },
    stop() {
      run += 1;
      speech.stop?.();
      at = { para: 0, sentence: 0 };
      clear();
      set("idle");
    },
    /** A new speed takes effect from the sentence being read. */
    setRate(r) {
      rate = SPEEDS.includes(r) ? r : 1;
      if (state === "playing") return play(at);
    },
  };
}
