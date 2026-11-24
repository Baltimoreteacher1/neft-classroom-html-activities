// mission_escape — unit finale: solve 5-7 locks drawn from the unit's lessons to unlock a printable certificate.
// Each lock is a multiple-choice challenge with audio, hint, and kind explanation; code pieces come from the answers.
import { h } from "./_kit.js";
import { choiceStage, listenControls, slBtn, startKind } from "./_audio.js";

const LETTERS = ["A", "B", "C", "D"];
const codeOf = (lk, i) => lk.code || `${LETTERS[lk.answer] || "A"}${i + 1}`;

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "mission_escape");
  const { locks, certificate } = ctx.payload;
  let pos = 0;
  let missed = 0;
  let studentName = "";

  const dots = kit.dots(locks.length, "Locks unlocked");
  const stage = h("div", { class: "sl-stage" });
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);

  function lockRibbon(unlockedCount) {
    return h(
      "div",
      { class: "sl-pool", role: "group", "aria-label": "Vault locks" },
      ...locks.map((lk, i) => {
        const open = i < unlockedCount;
        const now = i === unlockedCount;
        return h(
          "span",
          {
            class: `sl-legend__item ${open ? "sl-tone-evidence" : now ? "sl-tone-concept" : "sl-tone-precision"}`,
            "aria-label": `${lk.title}: ${open ? `unlocked, code ${codeOf(lk, i)}` : now ? "current lock" : "locked"}`,
          },
          h("span", { "aria-hidden": "true", text: open ? "🔓 " : "🔒 " }),
          open ? `${lk.title} (${codeOf(lk, i)})` : lk.title,
        );
      }),
    );
  }

  function showLock() {
    const lk = locks[pos];
    locks.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    dots.label(`Lock ${pos + 1} of ${locks.length}: ${lk.title}`);
    const prompt = h("h3", {
      class: "sl-prompt",
      tabindex: "-1",
      "data-focus": "",
      text: `${lk.title}: ${lk.q}`,
    });
    const choice = choiceStage(kit, {
      options: lk.options,
      answer: lk.answer,
      why: `${lk.why} Code unlocked: ${codeOf(lk, pos)}.`,
      hint: true,
      label: lk.q,
      retry: "That key did not turn the lock yet. Re-read the clue and try another choice.",
      nextLabel: pos + 1 >= locks.length ? "Unlock certificate" : "Next lock",
      onNext: ({ wrong }) => {
        if (wrong) missed++;
        pos++;
        if (pos >= locks.length) showCertificate();
        else showLock();
      },
    });
    stage.replaceChildren(
      h("p", { class: "sl-count", text: `Lock ${pos + 1} of ${locks.length}` }),
      lockRibbon(pos),
      prompt,
      listenControls(lk.q, null, { label: "lock question" }).el,
      choice.el,
    );
    prompt.focus({ preventScroll: true });
  }

  function printCert() {
    const area = h(
      "div",
      { id: "stPrintArea" },
      h("p", { text: `Badge: ${certificate.badge}` }),
      h("h1", { text: certificate.title }),
      h("p", {
        text: `Awarded to: ${studentName.trim() || "____________________________________"}`,
      }),
      h("p", {
        text: `Vault code unlocked: ${locks.map((lk, i) => codeOf(lk, i)).join(" - ")}`,
      }),
      h("h2", { text: "What I can do now" }),
      h(
        "ul",
        {},
        ...certificate.can_do.map((c) => h("li", { text: `✓ ${c}` })),
      ),
    );
    document.body.append(area);
    document.body.classList.add("st-print-writing");
    const clean = () => {
      document.body.classList.remove("st-print-writing");
      area.remove();
      window.removeEventListener("afterprint", clean);
    };
    window.addEventListener("afterprint", clean);
    window.print?.();
  }

  function showCertificate() {
    locks.forEach((_, k) => dots.set(k, "ok"));
    dots.label(`All ${locks.length} locks unlocked`);
    const code = locks.map((lk, i) => codeOf(lk, i)).join(" - ");
    const heading = h("h3", {
      class: "sl-prompt",
      tabindex: "-1",
      "data-focus": "",
      text: `All ${locks.length} locks open! ${certificate.title}`,
    });
    const nameId = "slCertName";
    const nameInput = h("input", {
      type: "text",
      id: nameId,
      class: "ow-input",
      "data-key": "cert-name",
      placeholder: "Type your first name for the certificate (stays on this device)",
      value: studentName,
    });
    const certName = h("p", {
      class: "sl-card__prompt",
      id: "slCertStudent",
      text: studentName.trim() || "Language Explorer",
    });
    nameInput.addEventListener("input", () => {
      studentName = nameInput.value;
      certName.textContent = studentName.trim() || "Language Explorer";
    });
    const certCard = h(
      "div",
      { class: "sl-card", role: "region", "aria-label": certificate.title },
      h("p", { class: "sl-count", text: `Badge: ${certificate.badge} · Code: ${code}` }),
      h("p", { class: "sl-note", text: "Presented to" }),
      certName,
      h("p", { class: "sl-ask", text: "What I can do now:" }),
      h(
        "ul",
        { class: "sl-roles" },
        ...certificate.can_do.map((c) => h("li", { text: c })),
      ),
    );
    const printBtn = slBtn("Print certificate", {
      icon: "speaker",
      key: "print",
      onclick: printCert,
    });
    const finishBtn = slBtn("Finish mission", {
      primary: true,
      key: "finish",
      onclick: () =>
        kit.finish(
          missed,
          locks.length,
          `Unlocked all ${locks.length} locks (${locks.length - missed} on the first try) and earned the ${certificate.badge} certificate.`,
        ),
    });
    stage.replaceChildren(
      lockRibbon(locks.length),
      heading,
      h(
        "div",
        { class: "sl-card" },
        h("label", { class: "sl-ask", for: nameId, text: "Your name for the certificate:" }),
        nameInput,
        h("p", {
          class: "sl-note",
          text: "Your name is only used to print on this device. Nothing is sent to a server.",
        }),
      ),
      certCard,
      h("div", { class: "sg-actions" }, printBtn, finishBtn),
    );
    heading.focus({ preventScroll: true });
  }

  showLock();
  return () => kit.destroy();
}
