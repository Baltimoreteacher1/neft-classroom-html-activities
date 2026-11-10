// "Notice and explain": the learner writes one sentence in their own words. It is kept on this device, mirrored back
// (which models it names, whether it says why) and never graded or sent.
import { t } from "../i18n.js";
import { TOPICS, missionById } from "./missions.js";
import { noticeSentence, withSentence, withoutSentence } from "./progress.js";

const $ = (id) => document.getElementById(id);
const TOPIC_IDS = Object.keys(TOPICS);
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function mountNotice(app) {
  let topic = missionById(app.record.open)?.topic ?? "conversion";
  let mirror = "";

  const mirrorText = (text) => {
    const result = noticeSentence(text);
    const names = result.names.length
      ? t("Your sentence names: {names}.", {
          names: result.names.map((word) => t(word)).join(", "),
        })
      : t(
          "Your sentence does not name a picture yet. Try naming one, like the bar or the number line.",
        );
    const why = result.connector
      ? t("It says how things connect.")
      : t("Try a word like because or the same to say why.");
    return `${result.enough ? t("Saved.") : t("Saved. A longer sentence can say more.")} ${names} ${why}`;
  };

  $("ms-sentence-save").addEventListener("click", () => {
    const box = $("ms-sentence");
    if (!box.value.trim()) {
      mirror = t("Write your sentence first.");
      app.announce(mirror, { delay: 60 });
      render();
      return;
    }
    app.record = withSentence(app.record, box.value, topic);
    mirror = mirrorText(box.value);
    box.value = "";
    app.save();
    app.announce(mirror, { delay: 60 });
    render();
  });
  $("ms-sentence-new").addEventListener("click", () => {
    topic = TOPIC_IDS[(TOPIC_IDS.indexOf(topic) + 1) % TOPIC_IDS.length];
    mirror = "";
    render();
    app.announce(t(TOPICS[topic].explain), { delay: 60 });
  });
  $("ms-saved").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;
    app.record = withoutSentence(app.record, Number(button.dataset.delete));
    app.save();
    app.announce(t("Sentence deleted."), { delay: 60 });
    render();
  });

  function render() {
    $("ms-notice-prompt").textContent = t(TOPICS[topic].explain);
    $("ms-frames").innerHTML = TOPICS[topic].frames
      .map((frame) => `<li>${esc(t(frame))}</li>`)
      .join("");
    $("ms-sentence-mirror").textContent = mirror;
    $("ms-saved").innerHTML = app.record.sentences.length
      ? [...app.record.sentences]
          .reverse()
          .map(
            (item) =>
              `<li><q>${esc(item.text)}</q> <span class="ms-help">${esc(TOPICS[item.topic] ? t(TOPICS[item.topic].name) : "")}</span> <button type="button" class="ms-btn ms-btn-quiet" data-delete="${item.at}" aria-label="${esc(t("Delete this sentence"))}">${t("Delete")}</button></li>`,
          )
          .join("")
      : `<li class="ms-help">${t("Nothing saved yet.")}</li>`;
  }

  return {
    render,
    setTopic(next) {
      if (TOPICS[next]) topic = next;
    },
  };
}
