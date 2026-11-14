// Home header: make joining a class the obvious default, so work on a shared Chromebook cart is not stuck in one
// browser. Three calm states, chosen from this device only (nothing loads from the server until a learner acts):
//   joined          -> a small "Saved to <class>" chip that opens My class
//   chose "device"  -> a small "Saving on this device only · Join a class" chip
//   otherwise       -> the join card: class code (prefilled by ?join=CODE or the QR link), nickname, scan the QR,
//                      or "Practice on this device only" (remembered).
import { normalizeCode } from "../../../shared/class-platform/contract.js";
import { i18nFor } from "../i18n.js";
import { BASE } from "../util.js";
import { el, errorText } from "./dom.js";
import { loadLink } from "./link.js";
import { canScan, startScan } from "./qr-scan.js";
import { joinAndLink, joinCodeFromSearch, promptChoice, setPromptChoice } from "./session.js";

let shownKey = ""; // the new student key, kept across home re-renders until the learner says they wrote it down
let stopCamera = null;

export function unmountJoinPrompt() {
  stopCamera?.();
  stopCamera = null;
}

export function mountJoinPrompt(
  host,
  ctx,
  { fetchImpl = (...a) => fetch(...a), search = location.search } = {},
) {
  unmountJoinPrompt();
  const { S } = i18nFor(ctx);
  const classHref = `${BASE}/class`;
  const draw = (focus) => {
    unmountJoinPrompt();
    host.replaceChildren(...view());
    if (focus) host.querySelector(focus)?.focus();
  };

  function keyNotice() {
    return el(
      "section",
      { class: "cls-card cls-key", role: "alert", "aria-labelledby": "jpKeyH" },
      el("h2", { id: "jpKeyH" }, S("Write down your student key", "Anota tu clave de estudiante")),
      el("p", { class: "cls-keybig" }, shownKey),
      el(
        "p",
        {},
        S(
          "You need it with your class code and nickname to sign back in on another computer. Your teacher can reset it.",
          "La necesitas con tu código de clase y tu apodo para volver a entrar en otra computadora. Tu maestro o maestra puede restablecerla.",
        ),
      ),
      el(
        "button",
        {
          type: "button",
          class: "btn",
          onclick: () => {
            shownKey = "";
            draw(".cls-chip");
          },
        },
        S("I wrote it down", "Ya la anoté"),
      ),
    );
  }

  function chip(link) {
    return el(
      "a",
      { class: "cls-chip is-saved", href: classHref, "data-join-chip": "saved" },
      
      `${S("Saved to", "Guardado en")} ${link.title || link.code}`,
    );
  }

  function joinCard() {
    const prefill = joinCodeFromSearch(search);
    const code = el("input", {
      id: "jpCode",
      name: "code",
      autocomplete: "off",
      autocapitalize: "characters",
      maxlength: "12",
      value: prefill,
      required: true,
    });
    const alias = el("input", {
      id: "jpAlias",
      name: "alias",
      autocomplete: "off",
      maxlength: "20",
      required: true,
    });
    const error = el("p", { class: "cls-error", role: "alert" });
    const submit = el(
      "button",
      { type: "submit", class: "btn btn-primary" },
      S("Join my class", "Unirme a mi clase"),
    );
    const scanBox = el("div", { class: "cls-scan", hidden: true });
    const form = el(
      "form",
      { class: "cls-card cls-prompt", novalidate: true, "aria-labelledby": "jpTitle" },
      el(
        "h2",
        { id: "jpTitle" },
        S(
          "Join your class to save your work on any computer",
          "Únete a tu clase para guardar tu trabajo en cualquier computadora",
        ),
      ),
      el(
        "p",
        { class: "fine" },
        S(
          "Your teacher gives you a class code or a QR code. Use a nickname, not your full name.",
          "Tu maestro o maestra te da un código de clase o un código QR. Usa un apodo, no tu nombre completo.",
        ),
      ),
      el(
        "div",
        { class: "cls-prompt-fields" },
        el("label", { for: "jpCode" }, S("Class code", "Código de clase"), code),
        el("label", { for: "jpAlias" }, S("Your nickname", "Tu apodo"), alias),
      ),
      error,
      el(
        "div",
        { class: "row-actions" },
        submit,
        canScan()
          ? el(
              "button",
              {
                type: "button",
                class: "btn",
                "data-join-scan": true,
                onclick: () => scan(scanBox, code, alias, error),
              },
              S("Scan the QR code", "Escanear el código QR"),
            )
          : null,
        el(
          "button",
          {
            type: "button",
            class: "btn ghost",
            "data-join-device": true,
            onclick: () => {
              setPromptChoice("device");
              draw(".cls-chip");
            },
          },
          S("Practice on this device only", "Practicar solo en este dispositivo"),
        ),
      ),
      canScan()
        ? null
        : el(
            "p",
            { class: "fine" },
            S(
              "Have a QR code? Scan it with this computer's camera app, or type the code.",
              "¿Tienes un código QR? Escanéalo con la app de cámara de esta computadora, o escribe el código.",
            ),
          ),
      scanBox,
      el(
        "p",
        { class: "fine" },
        el(
          "a",
          { href: `${classHref}?signin=1` },
          S(
            "Joined before on another computer? Sign back in",
            "¿Ya te uniste en otra computadora? Vuelve a entrar",
          ),
        ),
      ),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      submit.disabled = true;
      const res = await joinAndLink({ code: code.value, alias: alias.value, fetchImpl });
      submit.disabled = false;
      if (!res.ok) {
        error.textContent = errorText(S, res.error);
        return;
      }
      setPromptChoice("");
      shownKey = res.newKey;
      draw(shownKey ? "#jpKeyH" : ".cls-chip");
    });
    if (prefill) queueMicrotask(() => alias.isConnected && alias.focus({ preventScroll: true }));
    return form;
  }

  function scan(box, code, alias, error) {
    unmountJoinPrompt();
    const video = el("video", {
      playsinline: true,
      muted: true,
      "aria-label": S("Camera view for the QR code", "Vista de la cámara para el código QR"),
    });
    const cancel = el(
      "button",
      {
        type: "button",
        class: "btn ghost",
        onclick: () => {
          unmountJoinPrompt();
          box.hidden = true;
        },
      },
      S("Stop the camera", "Apagar la cámara"),
    );
    box.replaceChildren(
      el("p", {}, S("Hold the QR code up to the camera.", "Muestra el código QR a la cámara.")),
      video,
      cancel,
    );
    box.hidden = false;
    const run = startScan(video);
    stopCamera = run.stop;
    run.done.then((found) => {
      box.hidden = true;
      if (found) {
        code.value = normalizeCode(found);
        alias.focus();
      } else if (stopCamera === run.stop)
        error.textContent = S(
          "The camera did not find a class QR code. Type the code instead.",
          "La cámara no encontró un código QR de clase. Escribe el código.",
        );
      if (stopCamera === run.stop) stopCamera = null;
    });
  }

  function view() {
    const link = loadLink();
    if (link) return shownKey ? [keyNotice(), chip(link)] : [chip(link)];
    if (promptChoice() === "device" && !joinCodeFromSearch(search))
      return [
        el(
          "a",
          { class: "cls-chip", href: classHref, "data-join-chip": "device" },
          `${S("Saving on this device only", "Guardando solo en este dispositivo")} · ${S("Join a class", "Unirse a una clase")}`,
        ),
      ];
    return [joinCard()];
  }

  draw();
  return { unmount: unmountJoinPrompt };
}
