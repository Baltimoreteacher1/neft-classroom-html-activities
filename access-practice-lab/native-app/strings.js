// Every string the app settings sheet and the reminder show, in one place. English and Spanish only (Joel, 2026-10-21).
// A key missing in Spanish falls back to English (t). Spanish is a first pass for a native speaker to review:
// docs/family-app/spanish-review-checklist.md. `{name}` placeholders are filled by t().
export const LANGS = ["en", "es"];

export const STRINGS = {
  en: {
    "gear.label": "App settings",
    "sheet.title": "App settings",
    "sheet.close": "Close",
    "language.title": "Language",
    "language.en": "English",
    "language.es": "Español",
    "language.bi": "English + Español",
    "language.note": "This is the same language setting as the one on the home page.",
    "reminder.title": "Time to practice",
    "reminder.body": "Ten minutes of English together this week.",
    "reminder.section": "Weekly reminder",
    "reminder.toggle": "Remind me every Monday around 5:00 PM",
    "reminder.status.off": "Reminder is off. You will be asked to allow notifications when you turn it on.",
    "reminder.status.on": "Reminder is on: Mondays around 5:00 PM, your phone's time.",
    "reminder.status.denied":
      "Notifications are turned off for this app. Open your phone's Settings and allow notifications, then try again.",
    "reminder.status.error": "The reminder could not be set. Please try again.",
    "reminder.status.unsupported": "Reminders are not available on this device.",
    "share.section": "Share",
    "share.button": "Share this app",
    "share.title": "The Language Page",
    "share.text": "English practice for families · Práctica de inglés para familias",
    "share.unsupported": "Sharing is not available on this device.",
    "help.section": "Help and privacy",
    "help.about":
      "The Language Page has English practice for grades 3–8: listening, reading, speaking and writing, in English and Spanish. It is practice, not an official test.",
    "help.contact":
      "Questions? Ask your child's teacher. This app has no accounts and no support email address.",
    "privacy.link": "Privacy policy",
    "offline.section": "What works without internet",
    "offline.intro": "Practice pages work without internet after you have opened the app once online.",
    "offline.works": "Works offline: practice pages and your saved progress on this phone.",
    "offline.online": "Needs internet: asking Mr. Neft a question, class features and the intro video.",
    "version.label": "App version: {version}",
    "version.web": "App version: web",
    "net.offline": "You are offline right now.",
  },
  es: {
    "gear.label": "Ajustes de la app",
    "sheet.title": "Ajustes de la app",
    "sheet.close": "Cerrar",
    "language.title": "Idioma",
    "language.en": "English",
    "language.es": "Español",
    "language.bi": "English + Español",
    "language.note": "Es el mismo ajuste de idioma que está en la página de inicio.",
    "reminder.title": "Hora de practicar",
    "reminder.body": "Diez minutos de inglés juntos esta semana.",
    "reminder.section": "Recordatorio semanal",
    "reminder.toggle": "Recuérdame cada lunes alrededor de las 5:00 p. m.",
    "reminder.status.off":
      "El recordatorio está apagado. Se te pedirá permiso para las notificaciones cuando lo enciendas.",
    "reminder.status.on": "El recordatorio está encendido: los lunes alrededor de las 5:00 p. m., hora de tu teléfono.",
    "reminder.status.denied":
      "Las notificaciones están apagadas para esta app. Abre los Ajustes de tu teléfono, permite las notificaciones y vuelve a intentarlo.",
    "reminder.status.error": "No se pudo programar el recordatorio. Inténtalo de nuevo.",
    "reminder.status.unsupported": "Los recordatorios no están disponibles en este dispositivo.",
    "share.section": "Compartir",
    "share.button": "Compartir esta app",
    "share.title": "The Language Page",
    "share.text": "English practice for families · Práctica de inglés para familias",
    "share.unsupported": "Compartir no está disponible en este dispositivo.",
    "help.section": "Ayuda y privacidad",
    "help.about":
      "The Language Page ofrece práctica de inglés para los grados 3–8: escuchar, leer, hablar y escribir, en inglés y en español. Es práctica, no un examen oficial.",
    "help.contact":
      "¿Preguntas? Pregunta al maestro o a la maestra de tu hijo o hija. Esta app no tiene cuentas ni un correo de ayuda.",
    "privacy.link": "Política de privacidad",
    "offline.section": "Qué funciona sin internet",
    "offline.intro": "Las páginas de práctica funcionan sin internet después de abrir la app una vez con conexión.",
    "offline.works":
      "Funciona sin internet: las páginas de práctica y tu progreso guardado en este teléfono.",
    "offline.online": "Necesita internet: hacerle una pregunta a Mr. Neft, las funciones de clase y el video de introducción.",
    "version.label": "Versión de la app: {version}",
    "version.web": "Versión de la app: web",
    "net.offline": "Ahora no tienes internet.",
  },
};

/** "es" stays Spanish; "en", "bi" and anything else read English (the lab's own rule: localeFor in I18nEngine). */
export const normLang = (mode) => (mode === "es" ? "es" : "en");

/** The string for `key` in `lang`, English when Spanish lacks it, the key itself when neither has it. */
export function t(lang, key, vars = {}) {
  const text = STRINGS[normLang(lang)]?.[key] ?? STRINGS.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}
