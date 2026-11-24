/* Everyday English — content bank for the Language Studio (/lingua).
   Each item carries a difficulty tag (lvl: A1 | A2 | B1). The tag labels the material, never the learner; learners see
   it as LEVEL_LABEL below. Definitions are kept in simple English; a Spanish gloss is offered as a bridge. */

export const LEVELS = ["A1", "A2", "B1"];
export const LEVEL_LABEL = { A1: "Starter", A2: "Building", B1: "Stretch" };

/* ---------------- Vocabulary ---------------- */
export const VOCAB = [
  { id: "groceries", w: "groceries", pos: "noun", ipa: "/ˈɡrəʊsəriz/", lvl: "A1", def: "food and household things you buy at a shop", es: "la compra", ex: "I get groceries every Saturday morning." },
  { id: "neighbour", w: "neighbour", pos: "noun", ipa: "/ˈneɪbə/", lvl: "A1", def: "a person who lives near you", es: "el vecino / la vecina", ex: "Our neighbour helped us move the sofa." },
  { id: "appointment", w: "appointment", pos: "noun", ipa: "/əˈpɔɪntmənt/", lvl: "A1", def: "a time you agree to meet a doctor or an official", es: "la cita", ex: "I have a dentist's appointment at four." },
  { id: "receipt", w: "receipt", pos: "noun", ipa: "/rɪˈsiːt/", lvl: "A1", def: "the paper a shop gives you after you pay", es: "el recibo", ex: "Keep the receipt if you want a refund." },
  { id: "queue", w: "queue", pos: "noun", ipa: "/kjuː/", lvl: "A1", def: "a line of people waiting for something", es: "la cola", ex: "There was a long queue at the post office." },
  { id: "landlord", w: "landlord", pos: "noun", ipa: "/ˈlændlɔːd/", lvl: "A1", def: "the person who owns the home you rent", es: "el casero", ex: "The landlord is fixing the heating on Monday." },
  { id: "shift", w: "shift", pos: "noun", ipa: "/ʃɪft/", lvl: "A1", def: "the hours you work in one day", es: "el turno", ex: "She works the night shift at the hospital." },
  { id: "rent", w: "rent", pos: "noun", ipa: "/rent/", lvl: "A1", def: "money you pay every month to live somewhere", es: "el alquiler", ex: "Our rent goes up in April." },
  { id: "fare", w: "fare", pos: "noun", ipa: "/feə/", lvl: "A1", def: "the money you pay to travel", es: "la tarifa", ex: "The bus fare is cheaper with a travel card." },
  { id: "pharmacist", w: "pharmacist", pos: "noun", ipa: "/ˈfɑːməsɪst/", lvl: "A1", def: "the person who prepares and sells medicine", es: "el/la farmacéutico/a", ex: "Ask the pharmacist before you take these tablets." },
  { id: "symptom", w: "symptom", pos: "noun", ipa: "/ˈsɪmptəm/", lvl: "A1", def: "a sign that you are ill", es: "el síntoma", ex: "A sore throat is a common symptom of a cold." },
  { id: "luggage", w: "luggage", pos: "noun", ipa: "/ˈlʌɡɪdʒ/", lvl: "A1", def: "the bags you take when you travel", es: "el equipaje", ex: "You can take one piece of luggage on the plane." },
  { id: "platform", w: "platform", pos: "noun", ipa: "/ˈplætfɔːm/", lvl: "A1", def: "the place where you get on a train", es: "el andén", ex: "The train to Leeds leaves from platform six." },
  { id: "crowded", w: "crowded", pos: "adjective", ipa: "/ˈkraʊdɪd/", lvl: "A1", def: "full of people", es: "lleno de gente", ex: "The market is crowded on Sundays." },

  { id: "commute", w: "commute", pos: "verb", ipa: "/kəˈmjuːt/", lvl: "A2", def: "to travel regularly to work", es: "desplazarse al trabajo", ex: "I commute by bike, so I save on bus fares." },
  { id: "deadline", w: "deadline", pos: "noun", ipa: "/ˈdedlaɪn/", lvl: "A2", def: "the time by which work must be finished", es: "la fecha límite", ex: "The deadline for the application is Friday at noon." },
  { id: "refund", w: "refund", pos: "noun", ipa: "/ˈriːfʌnd/", lvl: "A2", def: "money returned to you for something you bought", es: "el reembolso", ex: "I asked for a refund because the jacket was damaged." },
  { id: "overtime", w: "overtime", pos: "noun", ipa: "/ˈəʊvətaɪm/", lvl: "A2", def: "extra hours you work beyond your normal day", es: "las horas extra", ex: "He does overtime when the restaurant is busy." },
  { id: "deposit", w: "deposit", pos: "noun", ipa: "/dɪˈpɒzɪt/", lvl: "A2", def: "money you pay at the start of a rental or purchase", es: "el depósito", ex: "We paid a deposit of one month's rent." },
  { id: "utility bill", w: "utility bill", pos: "noun", ipa: "/juːˈtɪləti bɪl/", lvl: "A2", def: "a bill for water, gas or electricity", es: "la factura de servicios", ex: "The utility bill was much higher this month." },
  { id: "warranty", w: "warranty", pos: "noun", ipa: "/ˈwɒrənti/", lvl: "A2", def: "a promise to repair or replace a product", es: "la garantía", ex: "The warranty covers the laptop for two years." },
  { id: "pedestrian", w: "pedestrian", pos: "noun", ipa: "/pəˈdestriən/", lvl: "A2", def: "a person walking in the street", es: "el/la peatón/ona", ex: "Drivers must stop for pedestrians at the crossing." },
  { id: "boarding pass", w: "boarding pass", pos: "noun", ipa: "/ˈbɔːdɪŋ pɑːs/", lvl: "A2", def: "the document that lets you get on a plane", es: "la tarjeta de embarque", ex: "Show your boarding pass at the gate." },
  { id: "prescription", w: "prescription", pos: "noun", ipa: "/prɪˈskrɪpʃn/", lvl: "A2", def: "a doctor's written order for medicine", es: "la receta médica", ex: "You need a prescription for these antibiotics." },
  { id: "supervisor", w: "supervisor", pos: "noun", ipa: "/ˈsuːpəvaɪzə/", lvl: "A2", def: "someone who checks and guides your work", es: "el/la supervisor(a)", ex: "My supervisor showed me how to use the till." },
  { id: "notice", w: "notice", pos: "noun", ipa: "/ˈnəʊtɪs/", lvl: "A2", def: "a sign or short written message about something", es: "el aviso", ex: "There's a notice in the hall about the water being off." },
  { id: "aisle seat", w: "aisle seat", pos: "noun", ipa: "/aɪl siːt/", lvl: "A2", def: "a seat next to the walking space on a plane", es: "el asiento de pasillo", ex: "I'd prefer an aisle seat, please." },
  { id: "punctual", w: "punctual", pos: "adjective", ipa: "/ˈpʌŋktʃuəl/", lvl: "A2", def: "arriving exactly on time", es: "puntual", ex: "Please be punctual: the interview starts at nine." },
  { id: "reliable", w: "reliable", pos: "adjective", ipa: "/rɪˈlaɪəbl/", lvl: "A2", def: "able to be trusted to do something well", es: "fiable", ex: "The bus is usually reliable, but today it was late." },

  { id: "bargain", w: "bargain", pos: "noun", ipa: "/ˈbɑːɡən/", lvl: "B1", def: "something bought for less than its usual price", es: "la ganga", ex: "That coat was a real bargain at half price." },
  { id: "budget", w: "budget", pos: "noun", ipa: "/ˈbʌdʒɪt/", lvl: "B1", def: "a plan for how you will spend your money", es: "el presupuesto", ex: "We made a monthly budget to save for a car." },
  { id: "invoice", w: "invoice", pos: "noun", ipa: "/ˈɪnvɔɪs/", lvl: "B1", def: "a bill for work done or goods delivered", es: "la factura", ex: "The plumber sent the invoice by email." },
  { id: "tenant", w: "tenant", pos: "noun", ipa: "/ˈtenənt/", lvl: "B1", def: "a person who rents a home", es: "el/la inquilino/a", ex: "Tenants must give one month's notice before leaving." },
  { id: "affordable", w: "affordable", pos: "adjective", ipa: "/əˈfɔːdəbl/", lvl: "B1", def: "cheap enough for you to pay for", es: "asequible", ex: "The course is affordable, and you can pay monthly." },
  { id: "overdue", w: "overdue", pos: "adjective", ipa: "/ˌəʊvəˈdjuː/", lvl: "B1", def: "later than the expected or agreed time", es: "vencido / con retraso", ex: "The library books are two weeks overdue." },
  { id: "negotiate", w: "negotiate", pos: "verb", ipa: "/nɪˈɡəʊʃieɪt/", lvl: "B1", def: "to discuss something to reach an agreement", es: "negociar", ex: "She negotiated a higher salary before starting the job." },
  { id: "thorough", w: "thorough", pos: "adjective", ipa: "/ˈθʌrə/", lvl: "B1", def: "careful and complete", es: "minucioso", ex: "The inspector did a thorough check of the flat." },
  { id: "flexible", w: "flexible", pos: "adjective", ipa: "/ˈfleksəbl/", lvl: "B1", def: "able to change easily to fit a situation", es: "flexible", ex: "The job has flexible hours, so I can study in the evenings." },
  { id: "promote", w: "promote", pos: "verb", ipa: "/prəˈməʊt/", lvl: "B1", def: "to move someone to a higher job", es: "ascender", ex: "He was promoted to team leader after a year." },
  { id: "resign", w: "resign", pos: "verb", ipa: "/rɪˈzaɪn/", lvl: "B1", def: "to officially leave your job", es: "renunciar", ex: "She resigned because the company moved to another city." },
  { id: "recommend", w: "recommend", pos: "verb", ipa: "/ˌrekəˈmend/", lvl: "B1", def: "to suggest that something is good", es: "recomendar", ex: "Can you recommend a good dentist nearby?" },
  { id: "contract", w: "contract", pos: "noun", ipa: "/ˈkɒntrækt/", lvl: "B1", def: "a legal written agreement", es: "el contrato", ex: "Read the contract carefully before you sign." },
  { id: "insurance", w: "insurance", pos: "noun", ipa: "/ɪnˈʃʊərəns/", lvl: "B1", def: "payments that protect you against damage or loss", es: "el seguro", ex: "Travel insurance covers lost luggage." },
  { id: "evidence", w: "evidence", pos: "noun", ipa: "/ˈevɪdəns/", lvl: "B1", def: "facts that show something is true", es: "la prueba / la evidencia", ex: "There is strong evidence that sleep helps memory." }
];

/* ---------------- Sentence building ---------------- */
export const SENTENCES = [
  { id: "s1", lvl: "A1", ctx: "Ask a shop assistant for a different size.", parts: ["Do", "you", "have", "this", "in", "a", "larger", "size"], extra: ["sizes"], tip: "“Do you have…?” is the standard polite frame for asking if something is available." },
  { id: "s2", lvl: "A1", ctx: "Order a coffee and a sandwich politely.", parts: ["I'd", "like", "a", "coffee", "and", "a", "cheese", "sandwich"], extra: ["want"], tip: "“I'd like…” is softer than “I want…” and works in every café." },
  { id: "s3", lvl: "A1", ctx: "Ask a stranger where the nearest pharmacy is.", parts: ["Excuse", "me", "where", "is", "the", "nearest", "pharmacy"], extra: ["closest"], tip: "Open with “Excuse me” — it signals that you need a moment of a stranger's time." },
  { id: "s4", lvl: "A1", ctx: "Tell your colleague you will be five minutes late.", parts: ["Sorry", "I", "will", "be", "about", "five", "minutes", "late"], extra: ["am"], tip: "“will be + time” is the natural way to announce a short delay." },
  { id: "s5", lvl: "A2", ctx: "Ask your landlord to repair the heating.", parts: ["The", "heating", "is", "not", "working", "could", "you", "fix", "it"], extra: ["repair"], tip: "“Could you…?” is polite and direct — ideal for a request by message or in person." },
  { id: "s6", lvl: "A2", ctx: "Explain that a new purchase is faulty.", parts: ["I", "bought", "this", "yesterday", "but", "it", "is", "broken"], extra: ["buyed"], tip: "Buy is irregular: buy → bought. “Broken” describes the thing, not the action." },
  { id: "s7", lvl: "A2", ctx: "Move a meeting to Thursday, politely.", parts: ["Would", "it", "be", "possible", "to", "move", "our", "meeting", "to", "Thursday"], extra: ["moving"], tip: "“Would it be possible to…?” is the gold standard for a polite change of plan." },
  { id: "s8", lvl: "A2", ctx: "Order a main course and a drink in a café.", parts: ["Could", "I", "get", "the", "chicken", "and", "a", "glass", "of", "water"], extra: ["with"], tip: "In cafés, “Could I get…?” sounds natural and friendly — more so than “I want”." },
  { id: "s9", lvl: "B1", ctx: "Say how long you have lived in the city.", parts: ["I", "have", "lived", "in", "this", "city", "for", "three", "years"], extra: ["since"], tip: "Use for + a length of time (three years); since + a starting point (2021)." },
  { id: "s10", lvl: "B1", ctx: "Apologise for a delay and promise action.", parts: ["I", "am", "sorry", "for", "the", "delay", "I", "will", "send", "it", "today"], extra: ["delaying"], tip: "Apologise, then commit to one concrete action. That is the pattern readers trust." },
  { id: "s11", lvl: "B1", ctx: "Ask a colleague to resend complaint details.", parts: ["Could", "you", "send", "me", "the", "details", "of", "the", "complaint", "again"], extra: ["for"], tip: "Keep requests in one clean line: verb + person + thing + “again”." },
  { id: "s12", lvl: "B1", ctx: "Recommend a course to a friend.", parts: ["You", "should", "try", "the", "evening", "course", "because", "it", "is", "very", "practical"], extra: ["for"], tip: "“should + verb” gives advice; “because” supplies the reason that makes it persuasive." }
];

/* ---------------- Listening ---------------- */
export const LISTENING = [
  { id: "l1", lvl: "A1", script: "I'd like a coffee and a cheese sandwich, please.", question: "What did the customer order?", options: ["Coffee and a cheese sandwich", "Coffee and a cheese salad", "Tea and a cheese sandwich"], answer: 0, focus: "Listen for “and” — in fast speech it almost disappears: coffee-n-cheese." },
  { id: "l2", lvl: "A1", script: "The bus leaves from platform six at ten past nine.", question: "When does the bus leave?", options: ["At ten past nine", "At nine past ten", "At ten to nine"], answer: 0, focus: "Hold the number until the sentence ends — “ten past nine”, not “nine past ten”." },
  { id: "l3", lvl: "A1", script: "Take one tablet three times a day, after food.", question: "How often should the patient take the tablets?", options: ["Three times a day", "Three tablets a day", "Once every three hours"], answer: 0, focus: "The quantity attaches to “times”, not to “tablets”. Listen for the unit." },
  { id: "l4", lvl: "A2", script: "The flat is on the second floor, and the heating is included in the rent.", question: "What is included in the rent?", options: ["Heating", "Electricity", "Parking"], answer: 0, focus: "“Included in the rent” is the key phrase — highlights come after a small pause." },
  { id: "l5", lvl: "A2", script: "I'm sorry, but the four o'clock train has been cancelled. Please go to platform two for the next service.", question: "What should the passenger do?", options: ["Go to platform two for the next train", "Wait at platform four", "Come back tomorrow"], answer: 0, focus: "Station announcements are dense. Catch the instruction first, then the detail." },
  { id: "l6", lvl: "A2", script: "Can you call back after five? I'm in a meeting until then.", question: "When should the caller phone again?", options: ["After five", "Before five", "At five, during the meeting"], answer: 0, focus: "“Until then” points back to five o'clock. Time words often repeat — use the second one to check." },
  { id: "l7", lvl: "B1", script: "The manager said she'd like to see the report by Thursday. If it's not finished, just send what you have.", question: "What does the manager want?", options: ["The report, or part of it, by Thursday", "The whole report by Friday", "A phone call on Thursday"], answer: 0, focus: "Notice the softener: “just send what you have” lowers the pressure on the deadline." },
  { id: "l8", lvl: "B1", script: "It's a bit of a walk from the station, but there's a bus that takes you right to the door.", question: "What does the speaker say about the place?", options: ["It is some distance from the station, but a bus goes to the door", "It is a two-minute walk from the station", "There is no public transport nearby"], answer: 0, focus: "“A bit of a walk” is British understatement — it usually means quite far." }
];

/* ---------------- Reading ---------------- */
export const READINGS = [
  {
    id: "r1", lvl: "A2", title: "The Night Bus", source: "Short read · 2 min",
    body: [
      "Maria finishes her <button type=\"button\" class=\"gloss\" data-gloss=\"the hours she works in one day\">shift</button> at the hospital at eleven o'clock. The last normal bus has already gone, so she takes the night bus. It is slower and the <button type=\"button\" class=\"gloss\" data-gloss=\"the money you pay to travel\">fare</button> is higher, but it stops two minutes from her flat.",
      "Tonight the bus is crowded. Maria finds a seat between a man with a bicycle and a woman carrying shopping bags. Nobody speaks much. Almost everyone is on their phone or half asleep.",
      "Maria likes this journey. She has twenty-five minutes to herself before the flat, her children and tomorrow's list. She takes a small notebook from her bag and writes three sentences in English: what she did today, what she will do tomorrow, and one new word she heard at work.",
      "“It's a little habit,” she says. “But it makes the language mine.”"
    ],
    questions: [
      { stem: "Why does Maria like the night bus?", options: ["It gives her a quiet moment to practise English", "It is the fastest way home", "She can talk to her friends on it"], answer: 0, why: "The last paragraph explains the benefit: a notebook habit, not speed or company." },
      { stem: "How is the night bus different from the normal bus?", options: ["It is slower and more expensive", "It is faster and cheaper", "It does not stop near her flat"], answer: 0, why: "The first paragraph says it is slower, the fare is higher — but it stops near home." },
      { stem: "“It makes the language mine” means that Maria…", options: ["feels English belongs to her own life", "owns an English dictionary", "wants to move to England"], answer: 0, why: "She writes about her own day in English — that is what makes the language personal." }
    ]
  },
  {
    id: "r2", lvl: "B1", title: "Why We Forget (and What Helps)", source: "Explainers · 3 min",
    body: [
      "Most people forget about half of what they read or hear within a day. This is not a personal failure; it is simply how memory works. The brain keeps what it uses and lets go of what it does not.",
      "This is why re-reading a page feels productive but changes very little. The words look familiar, so we mistake familiarity for knowledge. When a test asks us to <button type=\"button\" class=\"gloss\" data-gloss=\"to bring information back into your mind\">retrieve</button> the information, the page is no longer there — and the gap appears.",
      "The fix is uncomfortable but simple: test yourself instead of reading again. Close the book and explain the idea out loud, or write three questions and answer them tomorrow. Each <button type=\"button\" class=\"gloss\" data-gloss=\"the act of remembering something\">recall</button> strengthens the path back to the memory, especially when it is slightly difficult.",
      "Short, repeated practice beats one long session. Twenty minutes on Monday, Wednesday and Friday will stay with you longer than two hours on Sunday night — and it will feel harder, which is a good sign."
    ],
    questions: [
      { stem: "What is the main point of the article?", options: ["Active recall is more effective than re-reading", "Memory is a fixed talent", "Long study sessions are always best"], answer: 0, why: "The article contrasts re-reading with testing yourself and recommends short repeated practice." },
      { stem: "Why does re-reading feel useful?", options: ["Familiar words make us think we know the material", "It improves recall in one day", "It uses less energy than sleep"], answer: 0, why: "Paragraph two: familiarity is mistaken for knowledge." },
      { stem: "The writer says practice that “feels harder” is…", options: ["a good sign, because it strengthens memory", "a warning that you are too tired", "only useful for exams"], answer: 0, why: "The last paragraph links difficulty to stronger retrieval paths." }
    ]
  },
  {
    id: "r3", lvl: "B1", title: "Four Notices in the Hall", source: "Functional reading · 2 min",
    body: [
      "<strong>Water off — Friday 9 a.m. to 1 p.m.</strong> The water will be turned off while the pipes are repaired. Please store water if you need it. We are sorry for the inconvenience.",
      "<strong>Fire alarm test — Tuesday, 10 a.m.</strong> You will hear the alarm for about two minutes. This is a test only. Do not leave the building unless a member of staff asks you to.",
      "<strong>Bins change day.</strong> From next month, recycling is collected on <strong>Thursdays</strong> instead of Wednesdays. Please put bins out before 7 a.m.",
      "<strong>Free English conversation group.</strong> Every second Saturday, 3–4.30 p.m., in the community room. All levels welcome. No need to book — just come along."
    ],
    questions: [
      { stem: "What should residents do before Friday?", options: ["Store water for the morning", "Leave the building at 9 a.m.", "Move their cars"], answer: 0, why: "The first notice asks residents to store water while the pipes are repaired." },
      { stem: "What happens on Tuesday at 10 a.m.?", options: ["An alarm sounds for a test", "The building is evacuated", "The water is repaired"], answer: 0, why: "The fire alarm test lasts about two minutes and you should not leave." },
      { stem: "Which is true about the conversation group?", options: ["You can attend without booking", "It is only for advanced learners", "It meets every week"], answer: 0, why: "The notice says “no need to book” and “all levels welcome”; it meets every second Saturday." }
    ]
  }
];

/* ---------------- Dialogue roleplay ---------------- */
export const DIALOGUES = [
  {
    id: "d1", lvl: "A2", title: "At the pharmacy", setting: "You have had a sore throat for three days. The pharmacist is free.",
    who: "Pharmacist",
    start: "n1",
    keyPhrases: ["I've had a sore throat for three days.", "Could you suggest something?", "Are you taking any other medication?", "So that's one every four hours?"],
    nodes: {
      n1: {
        npc: "Good morning. How can I help?",
        choices: [
          { text: "Hi — I've had a sore throat for three days. Could you suggest something?", quality: "great", feedback: "Symptom + duration + a polite request. This gets you the right medicine quickly.", next: "n2" },
          { text: "I am sick.", quality: "ok", feedback: "True, but too general. Add the symptom and how long you have had it.", next: "n2" },
          { text: "Give me medicine for throat.", quality: "off", feedback: "An imperative can sound rude to a stranger. “Could you suggest…?” is the polite frame.", next: "n2" }
        ]
      },
      n2: {
        npc: "I can recommend these lozenges. Are you taking any other medication?",
        choices: [
          { text: "Yes — I take tablets for blood pressure. Is that okay?", quality: "great", feedback: "Exactly right. Pharmacists must check for interactions; this is a genuinely important sentence.", next: "n3" },
          { text: "No, nothing.", quality: "ok", feedback: "Fine if true — but if you take anything regularly, always say so.", next: "n3" },
          { text: "Why do you ask?", quality: "off", feedback: "The question is about safety, not curiosity. Answer with the medicine name.", next: "n3" }
        ]
      },
      n3: {
        npc: "These are fine with your tablets. Take one every four hours, and see a doctor if it gets worse.",
        choices: [
          { text: "Thank you. So that's one every four hours — and a doctor if it doesn't improve?", quality: "great", feedback: "Repeating instructions back (teach-back) catches mistakes. Perfect close.", next: null },
          { text: "Okay, bye.", quality: "ok", feedback: "Polite but rushed. Repeating the key instructions is worth ten seconds.", next: null },
          { text: "I'll take three at once to be faster.", quality: "off", feedback: "Never change a dose on your own. Follow the label exactly.", next: null }
        ]
      }
    }
  },
  {
    id: "d2", lvl: "B1", title: "Interview: your availability", setting: "A café interview for an evening and weekend role. You want this job.",
    who: "Manager",
    start: "n1",
    keyPhrases: ["I've been working in a café for two years.", "I'm looking for more hours.", "Would that fit?", "I check priorities with my supervisor."],
    nodes: {
      n1: {
        npc: "Thanks for coming in. So, tell me a little about your current situation.",
        choices: [
          { text: "Of course. I've been working in a café for two years, mainly mornings, and I'm looking for more hours.", quality: "great", feedback: "A tight summary: role, duration, direction. Interviewers can build on it.", next: "n2" },
          { text: "I need a job.", quality: "ok", feedback: "Honest, but it gives the interviewer nothing to respond to. Add experience and intent.", next: "n2" },
          { text: "Why do you need to know?", quality: "off", feedback: "This reads as defensive. It is a standard opener — answer it warmly.", next: "n2" }
        ]
      },
      n2: {
        npc: "We need someone for evenings and Saturdays. Would that work for you?",
        choices: [
          { text: "Evenings are fine. On Saturdays I study until one, so I could start at two — would that fit?", quality: "great", feedback: "Yes + one honest limitation + a solution. This is how availability is negotiated.", next: "n3" },
          { text: "Yes, no problem at all.", quality: "ok", feedback: "Good energy, but if it is not accurate you will have to change it later. Be precise.", next: "n3" },
          { text: "I can't do Saturdays. Can you change the schedule?", quality: "off", feedback: "A flat no plus a demand is hard to hear. Offer what you can do first.", next: "n3" }
        ]
      },
      n3: {
        npc: "Good. And what would you say is your weakness?",
        choices: [
          { text: "I used to take on too much at once, so now I check priorities with my supervisor at the start of each shift.", quality: "great", feedback: "A real weakness plus a concrete habit. Credible and calm.", next: null },
          { text: "I'm a perfectionist — I work too hard.", quality: "ok", feedback: "A famous scripted answer. Choose something true, small and fixable instead.", next: null },
          { text: "I don't have any weaknesses.", quality: "off", feedback: "Everyone has one. Denying it costs trust; name a manageable one.", next: null }
        ]
      }
    }
  },
  {
    id: "d3", lvl: "A2", title: "The neighbour's music", setting: "It's 11.40 p.m. and the music through the wall is still loud. You knock on the door.",
    who: "Neighbour",
    start: "n1",
    keyPhrases: ["Sorry to knock late.", "Could you turn it down a bit after eleven?", "Happy birthday.", "Much easier to sort it out like this."],
    nodes: {
      n1: {
        npc: "Oh — hi. Is everything okay?",
        choices: [
          { text: "Hi, sorry to knock late. The music's quite loud through the wall — could you turn it down after eleven?", quality: "great", feedback: "Soft opener + specific request + time limit. Neighbourly and clear.", next: "n2" },
          { text: "Your music is too loud. Stop it.", quality: "off", feedback: "It may be true, but the imperative sounds like an order. “Could you…?” keeps the peace.", next: "n2" },
          { text: "Nothing. Sorry. Bye.", quality: "ok", feedback: "Avoiding it means repeating it tomorrow. A small, kind request usually works.", next: "n2" }
        ]
      },
      n2: {
        npc: "Oh, I didn't realise! Sorry — I'll turn it down. We're having a birthday thing.",
        choices: [
          { text: "No worries — happy birthday. Could you keep it low after eleven and I'll say nothing more about it?", quality: "great", feedback: "Warm, human, and still sets the boundary. This is the sentence that solves it.", next: "n3" },
          { text: "Fine. Just keep it down.", quality: "ok", feedback: "It works, but the warmth is missing. Goodwill prevents a repeat next week.", next: "n3" },
          { text: "You should know better.", quality: "off", feedback: "Shaming a neighbour usually escalates things. Name the behaviour, not the person.", next: "n3" }
        ]
      },
      n3: {
        npc: "Deal. Thanks for coming round instead of complaining to the landlord.",
        choices: [
          { text: "Of course — much easier to sort it out like this. Enjoy the party.", quality: "great", feedback: "Closing warmly keeps the relationship intact — the real aim.", next: null },
          { text: "Okay.", quality: "ok", feedback: "Neutral is fine. A friendly line costs nothing and buys a lot.", next: null },
          { text: "Next time I'll call the council.", quality: "off", feedback: "A threat ends the conversation, not the problem. Keep it as a last resort.", next: null }
        ]
      }
    }
  }
];

/* ---------------- Grammar gym ---------------- */
export const GRAMMAR = [
  { id: "g1", lvl: "A1", stem: "She ___ in a hospital.", options: ["works", "work", "working"], answer: 0, rule: "Present simple: he / she / it + -s", why: "With he, she and it, the verb takes -s: she works." },
  { id: "g2", lvl: "A1", stem: "I bought ___ new phone yesterday.", options: ["a", "an", "the"], answer: 0, rule: "a + consonant sound", why: "“Phone” starts with a consonant sound, so use “a”. Use “an” before vowel sounds." },
  { id: "g3", lvl: "A1", stem: "There ___ two chairs in the kitchen.", options: ["are", "is", "be"], answer: 0, rule: "there is / there are", why: "Two chairs is plural, so “there are”." },
  { id: "g4", lvl: "A1", stem: "We ___ to the market every Saturday.", options: ["go", "goes", "going"], answer: 0, rule: "Present simple with we / they / I", why: "“We” takes the base form: we go." },
  { id: "g5", lvl: "A2", stem: "She ___ in this city since 2019.", options: ["has lived", "lives", "lived"], answer: 0, rule: "Present perfect with since", why: "An action that started in the past and continues now: has lived + since 2019." },
  { id: "g6", lvl: "A2", stem: "This bag is ___ than that one.", options: ["cheaper", "cheap", "the cheapest"], answer: 0, rule: "Comparative adjectives", why: "With “than” we need the comparative: cheaper." },
  { id: "g7", lvl: "A2", stem: "How ___ milk do we need?", options: ["much", "many", "few"], answer: 0, rule: "much / many", why: "Milk is uncountable, so use “how much”." },
  { id: "g8", lvl: "A2", stem: "The meeting is ___ Monday morning.", options: ["on", "in", "at"], answer: 0, rule: "Prepositions of time: in / on / at", why: "Use “on” with days and dates: on Monday morning." },
  { id: "g9", lvl: "A2", stem: "You ___ bring your passport — it's required.", options: ["must", "might", "could"], answer: 0, rule: "Modals of obligation", why: "“Must” expresses a strong obligation or rule." },
  { id: "g10", lvl: "A2", stem: "If it ___ tomorrow, we'll stay at home.", options: ["rains", "will rain", "rained"], answer: 0, rule: "First conditional", why: "After “if”, use the present simple — not “will”." },
  { id: "g11", lvl: "B1", stem: "I'm looking forward to ___ you.", options: ["meeting", "meet", "met"], answer: 0, rule: "Preposition + -ing", why: "“To” here is a preposition, so the verb takes -ing: looking forward to meeting." },
  { id: "g12", lvl: "B1", stem: "The report ___ by Friday.", options: ["will be finished", "will finish", "finishes"], answer: 0, rule: "Future passive", why: "The report does not finish itself — passive: will be finished." },
  { id: "g13", lvl: "B1", stem: "She's the person ___ helped me.", options: ["who", "which", "whose"], answer: 0, rule: "Relative pronouns for people", why: "Use “who” for a person as the subject." },
  { id: "g14", lvl: "B1", stem: "He suggested ___ a bit later.", options: ["starting", "to start", "start"], answer: 0, rule: "Verb + -ing: suggest", why: "Suggest is followed by -ing: suggested starting." },
  { id: "g15", lvl: "B1", stem: "I'd have called you if I ___ your number.", options: ["had had", "have", "would have"], answer: 0, rule: "Third conditional", why: "If + past perfect, would have + past participle: if I had had your number." },
  { id: "g16", lvl: "B1", stem: "By the time we arrived, the film ___.", options: ["had started", "has started", "starts"], answer: 0, rule: "Past perfect for the earlier action", why: "The film started before we arrived: had started." }
];

/* ---------------- Writing studio ---------------- */
export const WRITING = [
  {
    id: "w1", lvl: "A2", title: "Email: the heating is broken", audience: "Your landlord", purpose: "Report a problem and ask for a repair",
    target: [60, 90],
    checklist: ["A greeting with a name", "The problem, stated clearly", "When it started", "A polite request", "A closing line"],
    starters: ["Dear Mr Ahmed,", "I'm writing about…", "It started on…", "Could you please…?", "Thank you,", "Best wishes,"],
    model: "Dear Mr Ahmed,\n\nI'm writing about the heating in flat 4. It stopped working on Sunday evening, and the flat is very cold now.\n\nCould you please arrange for someone to look at it this week? I'm at home after 5 p.m. any day.\n\nThank you for your help.\n\nBest wishes,\nMaria Lopez"
  },
  {
    id: "w2", lvl: "A2", title: "Message: I'm running late", audience: "A colleague", purpose: "Apologise and give a new time",
    target: [30, 55],
    checklist: ["A greeting", "An apology", "A reason", "A new time", "A short thank-you"],
    starters: ["Hi Sam,", "Sorry, but…", "The bus is…", "I'll be there by…", "Thanks for waiting."],
    model: "Hi Sam,\n\nSorry, but I'm running about fifteen minutes late — the bus didn't come. I'll be there by 9.45. Thanks for waiting!\n\nAna"
  },
  {
    id: "w3", lvl: "B1", title: "Email: rescheduling a meeting", audience: "A client", purpose: "Move an appointment without losing goodwill",
    target: [70, 110],
    checklist: ["Reference the original arrangement", "A clear reason", "Two alternative times", "A request for confirmation", "A professional closing"],
    starters: ["Dear Ms Chen,", "Thank you for your email about…", "Unfortunately, I have a conflict on…", "Would either… or… suit you?", "Please let me know which works best.", "Kind regards,"],
    model: "Dear Ms Chen,\n\nThank you for confirming our meeting on Tuesday at 10 a.m. Unfortunately, I have a hospital appointment that morning and need to move it.\n\nWould either Wednesday at 2 p.m. or Thursday at 11 a.m. suit you? I'm happy to come to your office for either time.\n\nPlease let me know which works best, and apologies for the change.\n\nKind regards,\nDaniel Okafor"
  },
  {
    id: "w4", lvl: "B1", title: "Review: a café in your area", audience: "Readers of a local website", purpose: "Describe and recommend",
    target: [80, 120],
    checklist: ["What you ordered", "Two specific positives", "One fair suggestion", "A recommendation for a particular reader"],
    starters: ["I visited…", "I ordered…", "What stood out was…", "The only thing I'd change is…", "I'd recommend it to…"],
    model: "I visited Corner Cup on a rainy Tuesday and stayed for two hours. I ordered the lentil soup and a flat white, and both were excellent — the soup was hot, filling and only £4.50.\n\nWhat stood out was the staff: someone noticed I was struggling with the wifi and set it up for me. The only thing I'd change is the music, which was a little loud for reading.\n\nI'd recommend Corner Cup to anyone who works from home and needs a calm, affordable lunch."
  },
  {
    id: "w5", lvl: "A2", title: "Note: a parcel for your neighbour", audience: "Your neighbour", purpose: "Explain where the parcel is",
    target: [25, 45],
    checklist: ["Who you are", "What happened", "Where the parcel is now", "What they should do", "Your name"],
    starters: ["Hi Mrs Patel,", "The delivery driver came at…", "I have your parcel.", "It's behind the…", "Just knock when you're home.", "Thanks, Ali"],
    model: "Hi Mrs Patel,\n\nThe delivery driver came at 2 p.m. while you were out. I have your parcel — it's in my hallway, flat 6.\n\nJust knock when you're home and I'll hand it over.\n\nThanks,\nAli"
  }
];

/* ---------------- Speaking ---------------- */
export const SPEAKING = [
  { id: "p1", lvl: "A1", phrase: "Could you say that again, please?", ipa: "/kʊd juː seɪ ðæt əˈɡen pliːz/", meaning: "Ask someone to repeat — the most useful sentence in any conversation.", tip: "Let your voice rise slightly on “again”. Flat intonation can sound impatient." },
  { id: "p2", lvl: "A1", phrase: "I'd like a coffee, please.", ipa: "/aɪd laɪk ə ˈkɒfi pliːz/", meaning: "Order something politely in a café.", tip: "Say it as one smooth line: I'd-like-a-COFFEE-please. Don't stress every word." },
  { id: "p3", lvl: "A2", phrase: "I'm looking for the nearest pharmacy.", ipa: "/aɪm ˈlʊkɪŋ fə ðə ˈnɪərɪst ˈfɑːməsi/", meaning: "Ask for directions to a place.", tip: "Link “looking for” into “lookin-fer”. Two words, one beat." },
  { id: "p4", lvl: "A2", phrase: "Sorry, I didn't catch that.", ipa: "/ˈsɒri aɪ ˈdɪdnt kætʃ ðæt/", meaning: "Say you didn't hear or understand — softer than “What?”", tip: "Stress “catch”. The phrase is an idiom: you catch words, not hear them twice." },
  { id: "p5", lvl: "A2", phrase: "Would it be possible to change my appointment?", ipa: "/wʊd ɪt biː ˈpɒsəbl tə tʃeɪndʒ maɪ əˈpɔɪntmənt/", meaning: "Reschedule something politely, in person or by phone.", tip: "Chunk it: Would-it-be-POSS-ible | to CHANGE my ap-POINT-ment." },
  { id: "p6", lvl: "B1", phrase: "I've been living here for about three years.", ipa: "/aɪv bɪn ˈlɪvɪŋ hɪə fər əˈbaʊt θriː jɪəz/", meaning: "Talk about how long you have lived somewhere.", tip: "Stress “I've” to signal an ongoing situation, not a finished one." },
  { id: "p7", lvl: "B1", phrase: "That sounds good, but I have one concern.", ipa: "/ðæt saʊndz ɡʊd bət aɪ hæv wʌn kənˈsɜːn/", meaning: "Disagree or raise a problem without sounding hostile.", tip: "Soften with “one concern” rather than “a problem”, and pause before it." },
  { id: "p8", lvl: "B1", phrase: "Let me check and get back to you by Thursday.", ipa: "/let miː tʃek ən ɡet bæk tə juː baɪ ˈθɜːzdeɪ/", meaning: "Buy time and promise a clear answer in a meeting or call.", tip: "“Get back to you” is three linked words — practise it as one unit: get-back-t'you." }
];
