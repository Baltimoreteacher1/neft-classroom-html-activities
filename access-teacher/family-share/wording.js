// Every sentence the "Share with families" teacher view shows, English and Spanish. `S(en, es)` picks the language
// (src/i18n.js makeI18n). Plain language; no score, level, percent, timer or proficiency label. What FAMILIES read lives
// in access-practice-lab/src/family/story/wording.js.
export function copy(S) {
  return {
    title: S("Share with families", "Compartir con las familias"),
    lead: S(
      "Pick a student, check what the family will see, then approve it. Nothing is sent. You copy a link or print a card.",
      "Elija un estudiante, revise lo que verá la familia y apruébelo. No se envía nada. Usted copia un enlace o imprime una tarjeta.",
    ),
    back: S("Back to class intelligence", "Volver a la inteligencia de la clase"),
    student: S("Student", "Estudiante"),
    approvedMark: S("approved", "aprobado"),
    nameLabel: S("Child’s first name (optional)", "Nombre de pila del estudiante (opcional)"),
    nameHint: S(
      "Type a first name only if you want the family to see one. A name is never copied from your roster.",
      "Escriba un nombre solo si quiere que la familia lo vea. Nunca se copia un nombre de su lista.",
    ),
    langLabel: S("The page opens in", "La página se abre en"),
    langs: { en: "English", es: "Español", bi: "English + Español" },
    celebrateHeading: S("Something to celebrate", "Algo para celebrar"),
    celebrateHelp: S(
      "Choose one thing the student said or wrote. The family reads it word for word.",
      "Elija algo que el estudiante dijo o escribió. La familia lo lee palabra por palabra.",
    ),
    noQuote: S("No quote. Celebrate effort instead.", "Sin cita. Celebrar el esfuerzo."),
    wrote: S("wrote", "escribió"),
    said: S("said", "dijo"),
    shows: S("The family also reads:", "La familia también lee:"),
    noWords: (alias) =>
      S(
        `No writing or speaking from ${alias} is on this device, so the story celebrates effort. To add their own words, import their Passport code in Class evidence.`,
        `No hay escritura ni habla de ${alias} en este dispositivo, así que la historia celebra el esfuerzo. Para agregar sus propias palabras, importe su código de Pasaporte en Evidencia de la clase.`,
      ),
    importLink: S("Open Class evidence", "Abrir Evidencia de la clase"),
    talksHeading: S("Talks for home", "Conversaciones para casa"),
    talkLabel: (n) => (n === 1 ? S("Tonight’s talk", "La conversación de hoy") : S(`More ways to talk ${n - 1}`, `Otra forma de conversar ${n - 1}`)),
    noteLabel: S("A note to the family (optional)", "Una nota para la familia (opcional)"),
    noteLang: S("Note language", "Idioma de la nota"),
    noteHint: S(
      "Up to 200 characters. No phone numbers, emails or links.",
      "Hasta 200 caracteres. Sin números de teléfono, correos ni enlaces.",
    ),
    noteRejected: S(
      "This note has a phone number, email or link, or is too long, so it will not be shared.",
      "Esta nota tiene un número de teléfono, un correo o un enlace, o es demasiado larga, así que no se compartirá.",
    ),
    factsHeading: S("From class practice", "De la práctica en clase"),
    facts: (n) =>
      n.days === 1
        ? S("1 day of practice this week.", "1 día de práctica esta semana.")
        : S(`${n.days} days of practice this week.`, `${n.days} días de práctica esta semana.`),
    factsNote: S(
      "These counts come from the student’s class record. You cannot change them here.",
      "Estas cantidades vienen del registro de clase del estudiante. No se pueden cambiar aquí.",
    ),
    previewHeading: S("What the family will see", "Lo que verá la familia"),
    previewLang: S("Preview in", "Vista previa en"),
    approve: S("Approve and get the link", "Aprobar y obtener el enlace"),
    approveNext: S("Approve, then next student", "Aprobar y pasar al siguiente"),
    approved: S(
      "Approved. Anyone with the link sees exactly this.",
      "Aprobado. Cualquiera con el enlace ve exactamente esto.",
    ),
    changed: S(
      "You changed this story after approving it. Approve again to update the link.",
      "Cambió esta historia después de aprobarla. Apruébela de nuevo para actualizar el enlace.",
    ),
    contract: S(
      "The link holds only what you see in the preview: the first name you typed, the quote, the talks and your note. It has no class code, no roster and no student ID, and it stays after the # so it is never sent to a server.",
      "El enlace contiene solo lo que ve en la vista previa: el nombre que escribió, la cita, las conversaciones y su nota. No tiene código de clase, lista ni identificación del estudiante, y va después del # así que nunca se envía a un servidor.",
    ),
    linkLabel: S("Family link", "Enlace para la familia"),
    copyLink: S("Copy link", "Copiar enlace"),
    copied: S("Link copied.", "Enlace copiado."),
    share: S("Share…", "Compartir…"),
    print: S("Print this card", "Imprimir esta tarjeta"),
    open: S("Open as a family sees it", "Abrir como lo ve la familia"),
    qrNote: S(
      "The printed QR code opens a short version without the quote and your note. The card itself shows everything.",
      "El código QR impreso abre una versión corta sin la cita ni su nota. La tarjeta muestra todo.",
    ),
    printAll: (n) => S(`Print approved cards (${n})`, `Imprimir tarjetas aprobadas (${n})`),
    printNone: S(
      "Approve a story to print it with the others.",
      "Apruebe una historia para imprimirla con las demás.",
    ),
    forAlias: (alias) => S(`Class copy for ${alias}`, `Copia de la clase para ${alias}`),
    empty: {
      none: S(
        "There are no students to write for yet. Create a live class or import Passport codes first.",
        "Aún no hay estudiantes. Primero cree una clase en vivo o importe códigos de Pasaporte.",
      ),
      live: S("Live class and class code", "Clase en vivo y código de clase"),
      evidence: S("Class evidence and groups", "Evidencia de la clase y grupos"),
    },
    sample: S(
      "These are made-up example students. Nothing here describes a real child.",
      "Estos son estudiantes de ejemplo inventados. Nada aquí describe a un niño real.",
    ),
    loading: S("Loading the class…", "Cargando la clase…"),
    statusApproved: (alias) => S(`Approved the story for ${alias}.`, `Se aprobó la historia de ${alias}.`),
    skillName: { L: S("Listening", "Escuchar"), R: S("Reading", "Leer"), S: S("Speaking", "Hablar"), W: S("Writing", "Escribir") },
  };
}
