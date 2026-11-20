# Spanish review checklist: The Language Page app

For a native Spanish speaker. All new text lives in one file, `access-practice-lab/native-app/strings.js` (`es` block).
The Spanish is a first pass, not reviewed. Audience: families and students (grades 3-8) in the United States, many
recently arrived. Please check meaning, tone and regional neutrality; edit the file directly or send corrections.

## Tone

- Friendly and short, "tú" form (never "usted"), no slang, readable at about grade 6.
- Neutral Latin American Spanish. "Teléfono" (not "celular" or "móvil"); "maestro o maestra".
- English words kept on purpose: the language options "English", "Español", "English + Español" (names of the choices,
  same as the lab's own switch) and the product name "The Language Page".

## Strings, in screen order, with context

| Key | Spanish now | Where it appears / what to confirm |
| --- | --- | --- |
| `gear.label` | Ajustes de la app | Spoken name of the round gear button (screen reader). |
| `sheet.title` | Ajustes de la app | Title of the settings sheet. |
| `sheet.close` | Cerrar | Close button (screen reader name). |
| `language.title` | Idioma | Section heading. |
| `language.note` | Es el mismo ajuste de idioma que está en la página de inicio. | Tells people this is the lab's own language switch, not a second one. |
| `reminder.section` | Recordatorio semanal | Section heading. |
| `reminder.toggle` | Recuérdame cada lunes alrededor de las 5:00 p. m. | Switch label. "Alrededor de" because Android may deliver up to an hour late. Confirm "p. m." style and that "alrededor de las 5:00" sounds natural. |
| `reminder.status.off` | El recordatorio está apagado. Se te pedirá permiso para las notificaciones cuando lo enciendas. | Shown before the phone's permission question appears. |
| `reminder.status.on` | El recordatorio está encendido: los lunes alrededor de las 5:00 p. m., hora de tu teléfono. | Shown when the reminder is on. |
| `reminder.status.denied` | Las notificaciones están apagadas para esta app. Abre los Ajustes de tu teléfono, permite las notificaciones y vuelve a intentarlo. | Shown if the person said no. "Ajustes" is the iPhone word; Android phones say "Configuración". Decide whether to add "o Configuración". |
| `reminder.status.error` | No se pudo programar el recordatorio. Inténtalo de nuevo. | Error line. |
| `reminder.status.unsupported` | Los recordatorios no están disponibles en este dispositivo. | Only if the phone cannot do reminders. |
| `reminder.title` | Hora de practicar | **Notification title** (what appears on the lock screen). |
| `reminder.body` | Diez minutos de inglés juntos esta semana. | **Notification text.** "Juntos" = parent and child together. |
| `share.section` | Compartir | Section heading. |
| `share.button` | Compartir esta app | Button that opens the phone's share menu. |
| `share.title` | The Language Page | Title inside the share message. |
| `share.text` | English practice for families · Práctica de inglés para familias | Same bilingual line in both languages on purpose. |
| `share.unsupported` | Compartir no está disponible en este dispositivo. | Error line. |
| `help.section` | Ayuda y privacidad | Section heading. |
| `help.about` | The Language Page ofrece práctica de inglés para los grados 3–8: escuchar, leer, hablar y escribir, en inglés y en español. Es práctica, no un examen oficial. | What the app is. "Grados 3-8" is U.S. school grades. |
| `help.contact` | ¿Preguntas? Pregunta al maestro o a la maestra de tu hijo o hija. Esta app no tiene cuentas ni un correo de ayuda. | No contact address exists on the live site, so this points to the teacher. The English is "Ask your child's teacher." Confirm the gendered pair reads naturally. |
| `privacy.link` | Política de privacidad | Link to the lab's own privacy page (that page has its own Spanish, written earlier). |
| `offline.section` | Qué funciona sin internet | Section heading. |
| `offline.intro` | Las páginas de práctica funcionan sin internet después de abrir la app una vez con conexión. | See the offline table in `language-page-offline.md` for what is true. |
| `offline.works` | Funciona sin internet: las páginas de práctica y tu progreso guardado en este teléfono. | Verified in a desktop browser test; not yet verified inside the iPhone and Android apps (see offline doc). |
| `offline.online` | Necesita internet: hacerle una pregunta a Mr. Neft, las funciones de clase y el video de introducción. | Mr. Neft is the site's question helper (an AI service). "Funciones de clase" = joining a teacher's class. |
| `version.label` | Versión de la app: {version} | `{version}` is a number like 1.0.0 (7). Keep the placeholder as written. |
| `version.web` | Versión de la app: web | Shown when no app version is available. |
| `net.offline` | Ahora no tienes internet. | Shown only while the phone is offline. |

## Terms to confirm

- "recordatorio" for reminder; "notificaciones" for notifications; "Ajustes de tu teléfono" vs "Configuración".
- "Mr. Neft" is kept as the helper's name in both languages; no word for "AI" is used in the app text.
- "ajustes de la app" for app settings.

## Not part of this review

The lab's own Spanish (`access-practice-lab/src/acc/i18n/locales/es.js`, the privacy page, activity screens) was not
changed here and is still machine-assisted.
