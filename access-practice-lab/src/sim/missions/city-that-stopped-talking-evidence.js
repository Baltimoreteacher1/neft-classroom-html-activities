// THE CITY THAT STOPPED TALKING: the three competing explanations and every piece of evidence (original content).
// Each explanation has supporting AND contradicting evidence of different strength; what is "strong" was measured
// or recorded when it happened, what is "weak" is a memory, a draft or a single source. Testimony is given by a
// character (see -people.js), everything else is opened from a scene.
export const explanations = [
  {
    id: "storm",
    label: [
      "Last night's storm damaged the relay tower on Harbor Hill.",
      "La tormenta de anoche dañó la torre de relé de Harbor Hill.",
    ],
  },
  {
    id: "update",
    label: [
      "A software update at 6:00 changed the relay's channel, so messages go where no phone is listening.",
      "Una actualización de software a las 6:00 cambió el canal del relé, y los mensajes van a donde ningún teléfono escucha.",
    ],
  },
  {
    id: "overload",
    label: [
      "Too many people used the network at once and it overloaded.",
      "Demasiadas personas usaron la red al mismo tiempo y se sobrecargó.",
    ],
  },
];

export const evidence = [
  {
    id: "first-report",
    kind: "audio",
    title: [
      "Loudspeaker message from the city desk",
      "Mensaje de altavoz de la oficina de la ciudad",
    ],
    body: [
      "This is the Calder Bay city desk. At ten minutes past six this morning, phone calls, text messages and the city radio stopped arriving in every neighborhood. Phones still show a signal. If you have information, write it on the board in City Square. Please check on your neighbors in person.",
      "Habla la oficina de la ciudad de Calder Bay. A las seis y diez de esta mañana, las llamadas, los mensajes de texto y la radio de la ciudad dejaron de llegar en todos los barrios. Los teléfonos todavía muestran señal. Si tienes información, escríbela en el tablero de la Plaza. Por favor, visita a tus vecinos en persona.",
    ],
  },
  {
    id: "notice-board",
    kind: "document",
    title: ["Notes on the City Square board", "Notas en el tablero de la Plaza"],
    body: [
      'NORTHGATE: No calls since the six o\'clock chime. HARBOR: City radio went quiet at 6. My texts say "sent" but nobody answers. RIVER DISTRICT: Same here, since about 6:00. OLD TOWN: Phone shows full signal. Nothing arrives.',
      'NORTHGATE: Sin llamadas desde la campanada de las seis. HARBOR: La radio de la ciudad se calló a las 6. Mis mensajes dicen "enviado" pero nadie responde. RIVER DISTRICT: Aquí igual, desde las 6:00 más o menos. OLD TOWN: El teléfono muestra señal completa. No llega nada.',
    ],
    supports: ["update"],
    strength: "weak",
  },
  {
    id: "bent-sign",
    kind: "object",
    title: ["A bent street sign and a fallen branch", "Un letrero doblado y una rama caída"],
    body: [
      "The street sign at the corner is bent to one side. A thick branch lies under it. The leaves are still wet. Something strong hit this corner during the night.",
      "El letrero de la esquina está doblado hacia un lado. Debajo hay una rama gruesa. Las hojas todavía están mojadas. Algo fuerte golpeó esta esquina durante la noche.",
    ],
    supports: ["storm"],
    strength: "weak",
  },
  {
    id: "storm-memory",
    kind: "testimony",
    title: [
      'Mr. Haddad: "My phone went dark at midnight"',
      'Sr. Haddad: "Mi teléfono se apagó a medianoche"',
    ],
    body: [
      "Mr. Haddad says lightning hit near Harbor Hill around midnight and his phone went dark at that moment. He is sure the storm broke the tower.",
      "El Sr. Haddad dice que un rayo cayó cerca de Harbor Hill hacia la medianoche y que su teléfono se apagó en ese momento. Está seguro de que la tormenta rompió la torre.",
    ],
    supports: ["storm"],
    strength: "weak",
  },
  {
    id: "chime-memory",
    kind: "testimony",
    title: [
      'Mr. Haddad: "The radio played until the six o\'clock chime"',
      'Sr. Haddad: "La radio sonó hasta la campanada de las seis"',
    ],
    body: [
      "Asked again, Mr. Haddad remembers that the lights flickered while his phone was charging, and that it came back on. His kitchen radio played music until the six o'clock chime. Then it went quiet.",
      "Al preguntarle otra vez, el Sr. Haddad recuerda que las luces parpadearon mientras su teléfono se cargaba, y que volvió a encenderse. La radio de su cocina tocó música hasta la campanada de las seis. Después se calló.",
    ],
    supports: ["update"],
    contradicts: ["storm"],
    strength: "weak",
  },
  {
    id: "weather-record",
    kind: "data",
    title: ["Weather station record", "Registro de la estación meteorológica"],
    body: [
      "11:40 p.m. Storm begins. 12:10 a.m. Lightning near Harbor Hill. 1:00 a.m. Strongest wind. 2:05 a.m. Storm ends. 2:05 to 7:00 a.m. Clear and calm.",
      "11:40 p. m. Empieza la tormenta. 12:10 a. m. Rayos cerca de Harbor Hill. 1:00 a. m. Viento más fuerte. 2:05 a. m. Termina la tormenta. De 2:05 a 7:00 a. m. Despejado y en calma.",
    ],
    contradicts: ["storm"],
    strength: "weak",
  },
  {
    id: "channel-test",
    kind: "data",
    title: ["Dr. Li's channel test", "La prueba de canales de la Dra. Li"],
    body: [
      "Test message on channel 7 (the channel phones use): sent 3 times, arrived 0 times. Same message on channel 17: sent 3 times, arrived 3 times, in about two seconds.",
      "Mensaje de prueba en el canal 7 (el canal que usan los teléfonos): enviado 3 veces, llegó 0 veces. El mismo mensaje en el canal 17: enviado 3 veces, llegó 3 veces, en unos dos segundos.",
    ],
    supports: ["update"],
    strength: "strong",
  },
  {
    id: "bulletin",
    kind: "document",
    title: ["Draft of the morning bulletin", "Borrador del boletín de la mañana"],
    body: [
      'DRAFT, NOT CHECKED. "Calder Bay fell silent this morning. A source says thousands of calls after the Lantern Festival overloaded the network." Note in the margin: second source?',
      'BORRADOR, SIN VERIFICAR. "Calder Bay quedó en silencio esta mañana. Una fuente dice que miles de llamadas después del Festival de los Faroles sobrecargaron la red". Nota al margen: ¿segunda fuente?',
    ],
    supports: ["overload"],
    strength: "weak",
  },
  {
    id: "festival-plan",
    kind: "document",
    title: ["Lantern Festival poster", "Cartel del Festival de los Faroles"],
    body: [
      "LANTERN FESTIVAL. Yesterday evening on the waterfront. Lanterns lit at 6:00 p.m. Closing music at 9:00 p.m. Streets reopen at 10:00 p.m.",
      "FESTIVAL DE LOS FAROLES. Ayer por la tarde en el paseo marítimo. Los faroles se encienden a las 6:00 p. m. Música de cierre a las 9:00 p. m. Las calles se reabren a las 10:00 p. m.",
    ],
    contradicts: ["overload"],
    strength: "weak",
  },
  {
    id: "voicemail",
    kind: "audio",
    title: [
      "Voicemail on the newsroom line, 5:58 a.m.",
      "Mensaje de voz en la línea de la redacción, 5:58 a. m.",
    ],
    body: [
      "Good morning, this is Tomás at Harbor Bakery. It is two minutes to six. I am calling about the bread for your meeting. The line is nice and clear today, so I will be quick. Twelve loaves, ready at eight. Call me back if that changes.",
      "Buenos días, habla Tomás de la Panadería Harbor. Faltan dos minutos para las seis. Llamo por el pan para su reunión. Hoy la línea se oye muy clara, así que seré breve. Doce panes, listos a las ocho. Llámenme si eso cambia.",
    ],
    contradicts: ["storm"],
    strength: "strong",
  },
  {
    id: "system-log",
    kind: "data",
    title: ["Relay system log", "Registro del sistema del relé"],
    body: [
      "05:55 Messages delivered in the last 5 minutes: 412. 06:00 Automatic update 4.2 installed. 06:00 Relay channel changed: 7 to 17. 06:01 Messages delivered: 0. 06:20 Messages waiting: 3,900.",
      "05:55 Mensajes entregados en los últimos 5 minutos: 412. 06:00 Actualización automática 4.2 instalada. 06:00 Canal del relé cambiado: de 7 a 17. 06:01 Mensajes entregados: 0. 06:20 Mensajes en espera: 3,900.",
    ],
    supports: ["update"],
    contradicts: ["storm"],
    strength: "strong",
  },
  {
    id: "usage-chart",
    kind: "data",
    title: ["Network usage chart", "Gráfica de uso de la red"],
    body: [
      "Share of the network in use. 5:30 a.m.: 22 out of 100. 6:00 a.m.: 30 out of 100. 6:20 a.m.: 85 out of 100 (people trying again and again). The network can carry 100.",
      "Parte de la red en uso. 5:30 a. m.: 22 de 100. 6:00 a. m.: 30 de 100. 6:20 a. m.: 85 de 100 (personas que intentan una y otra vez). La red puede llevar 100.",
    ],
    contradicts: ["overload"],
    strength: "strong",
  },
  {
    id: "inspection",
    kind: "document",
    title: ["Tower inspection sheet, 7:00 a.m.", "Hoja de inspección de la torre, 7:00 a. m."],
    body: [
      "Inspected by P. Nair. Antenna: whole, not bent. Cable: dry, no burns. Signal light: green. Power: normal. Result: no damage found.",
      "Inspección de P. Nair. Antena: entera, sin doblar. Cable: seco, sin quemaduras. Luz de señal: verde. Energía: normal. Resultado: no se encontró daño.",
    ],
    contradicts: ["storm"],
    strength: "strong",
  },
  {
    id: "update-notice",
    kind: "document",
    title: ["Notice about update 4.2", "Aviso sobre la actualización 4.2"],
    body: [
      'From the software company: "Update 4.2 is a small safety fix. It installs by itself at 6:00 a.m. No change to service is expected."',
      'De la empresa de software: "La actualización 4.2 es un pequeño arreglo de seguridad. Se instala sola a las 6:00 a. m. No se espera ningún cambio en el servicio".',
    ],
    contradicts: ["update"],
    strength: "weak",
  },
  {
    id: "no-change",
    kind: "testimony",
    title: ['Ms. Nair: "Nothing changed here"', 'Sra. Nair: "Aquí no cambió nada"'],
    body: [
      "The technician says nothing changed at the Communication Center: same tower, same cables, same relay box as yesterday.",
      "La técnica dice que no cambió nada en el Centro de Comunicación: la misma torre, los mismos cables, la misma caja del relé que ayer.",
    ],
    contradicts: ["update"],
    strength: "weak",
  },
  {
    id: "auto-update",
    kind: "testimony",
    title: [
      'Ms. Nair: "Updates install themselves at six"',
      'Sra. Nair: "Las actualizaciones se instalan solas a las seis"',
    ],
    body: [
      "Asked what she meant, the technician says nobody touched the equipment, but software updates install themselves at six. She had not counted that as a change.",
      "Al preguntarle qué quiso decir, la técnica dice que nadie tocó el equipo, pero que las actualizaciones de software se instalan solas a las seis. No lo había contado como un cambio.",
    ],
    supports: ["update"],
    strength: "weak",
  },
  {
    id: "crowd-tip",
    kind: "testimony",
    title: [
      'Mr. Rivas: "A caller said everyone was phoning at once"',
      'Sr. Rivas: "Una persona dijo que todos llamaban a la vez"',
    ],
    body: [
      "The journalist heard from one caller that everyone was phoning at once after the Lantern Festival.",
      "El periodista supo por una sola persona que todos llamaban al mismo tiempo después del Festival de los Faroles.",
    ],
    supports: ["overload"],
    strength: "weak",
  },
  {
    id: "tip-timing",
    kind: "testimony",
    title: ['Mr. Rivas: "One source, at 6:25"', 'Sr. Rivas: "Una sola fuente, a las 6:25"'],
    body: [
      "Asked for details, the journalist says the caller reached him at about 6:25, after the trouble began, and that nobody else said the same thing.",
      "Al pedirle detalles, el periodista dice que la persona se comunicó con él hacia las 6:25, después de que empezó el problema, y que nadie más dijo lo mismo.",
    ],
    contradicts: ["overload"],
    strength: "weak",
  },
  {
    id: "response-plans",
    kind: "document",
    title: ["Three response plans", "Tres planes de respuesta"],
    body: [
      "PLAN A: Send the repair crew up the tower. About four hours. The crew cannot clear storm branches during that time. PLAN B: Set the relay back to its old channel. About twenty minutes. Needs the chief's signature. PLAN C: Ask everyone to stay off the network for the morning. Trucks with loudspeakers would carry the message.",
      "PLAN A: Enviar al equipo de reparación a la torre. Unas cuatro horas. Durante ese tiempo el equipo no puede retirar las ramas de la tormenta. PLAN B: Regresar el relé a su canal anterior. Unos veinte minutos. Necesita la firma de la jefa. PLAN C: Pedir a todos que no usen la red durante la mañana. Camiones con altavoces llevarían el mensaje.",
    ],
  },
];
