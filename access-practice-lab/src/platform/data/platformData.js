/**
 * Production-ready datasets for The Language Page premium platform modules.
 * Zero placeholders, zero PII (first name + last initial aliases only).
 */

export const HOME_LANGUAGES = [
  { code: "es", label: "Español", english: "Spanish", dir: "ltr", speechLang: "es-ES" },
  { code: "ar", label: "العربية", english: "Arabic", dir: "rtl", speechLang: "ar-SA" },
  { code: "zh", label: "中文 (普通话)", english: "Mandarin", dir: "ltr", speechLang: "zh-CN" },
  { code: "fr", label: "Français", english: "French", dir: "ltr", speechLang: "fr-FR" },
  { code: "uk", label: "Українська", english: "Ukrainian", dir: "ltr", speechLang: "uk-UA" },
  { code: "ru", label: "Русский", english: "Russian", dir: "ltr", speechLang: "ru-RU" },
  { code: "pt", label: "Português", english: "Portuguese", dir: "ltr", speechLang: "pt-BR" },
  { code: "en", label: "None (English only)", english: "English", dir: "ltr", speechLang: "en-US" },
];

export function getLanguageMeta(code) {
  return HOME_LANGUAGES.find((l) => l.code === code) || HOME_LANGUAGES[0];
}

// ── Module 1: Content-to-Language Bridge Samples ──────────────────────────────
export const BRIDGE_SAMPLES = [
  {
    id: "k2-sci-living",
    subject: "Science",
    grade: "Grades K–2",
    klu: "Inform",
    title: "How Plants & Seeds Grow",
    text: "A seed needs water and sunlight to grow into a plant. First, the roots grow down into the soil. Next, the stem grows up toward the light, because the leaves make food for the plant.",
  },
  {
    id: "k2-math-shapes",
    subject: "Math",
    grade: "Grades K–2",
    klu: "Explain",
    title: "Comparing Shapes & Sides",
    text: "A square has four equal sides, whereas a triangle has only three sides. Both shapes are flat, however a square has four square corners.",
  },
  {
    id: "k2-ela-community",
    subject: "Social Studies",
    grade: "Grades K–2",
    klu: "Inform",
    title: "Community Helpers & Rules",
    text: "A crossing guard holds a bright sign so children can cross the street safely. Every school rule is made to keep students safe and fair, because everyone shares the same space.",
  },
  {
    id: "sci-g6-ecosystems",
    subject: "Science",
    grade: "Grade 6",
    klu: "Explain",
    title: "Energy Flow & Decomposers",
    text: "In a forest ecosystem, energy is transferred from producers to consumers through food webs. However, when organisms die, decomposers break down the matter so nutrients can return to the soil. Consequently, if the water table drops during a drought, plant expression of growth slows down, whereas hardy roots conserve moisture.",
  },
  {
    id: "math-g6-ratios",
    subject: "Math",
    grade: "Grade 6",
    klu: "Argue",
    title: "Unit Rate & Ratio Tables",
    text: "A baker records the product of flour and water in a ratio table. Although the first batch uses 3 cups of flour for every 2 cups of water, the second batch is scaled up to 12 cups of flour. Determine whether the relationship remains proportional, and justify your expression using the table.",
  },
  {
    id: "ss-g7-civics",
    subject: "Social Studies",
    grade: "Grade 7",
    klu: "Inform",
    title: "Checks & Balances in Government",
    text: "Under the Constitution, power is divided among three branches so no single state leader controls the entire system. Whereas the legislative branch drafts bills, the executive branch enforces laws. Furthermore, bills can be vetoed if they conflict with constitutional rights; nevertheless, Congress may override a veto.",
  },
];

export const POLYSEMOUS_LEXICON = {
  table: {
    everyday: "A piece of furniture with a flat top and legs.",
    academic: "An organized grid of rows and columns showing data or values.",
    tip: "Point to a data chart first so learners do not picture a kitchen table.",
  },
  expression: {
    everyday: "A look on someone's face showing a feeling.",
    academic: "A mathematical phrase combining numbers/variables, or a visible sign of a biological trait.",
    tip: "Contrast 'facial expression' with 'math/science expression' using a quick visual.",
  },
  product: {
    everyday: "An item sold in a store.",
    academic: "The result of multiplying numbers, or a substance formed in a reaction.",
    tip: "Highlight the root 'produce'—something made by multiplying or combining.",
  },
  state: {
    everyday: "A region or country, or to say something aloud.",
    academic: "A condition of matter (solid/liquid/gas) or a political territory/government.",
    tip: "Clarify whether 'state' means government, condition, or the verb 'to tell'.",
  },
  matter: {
    everyday: "A topic or problem ('What is the matter?').",
    academic: "Anything that has mass and takes up space.",
    tip: "Connect 'matter' to physical stuff you can weigh and measure.",
  },
  power: {
    everyday: "Physical strength or electricity in a wall outlet.",
    academic: "Legal authority to act, or an exponent in mathematics.",
    tip: "Anchor the word to 'authority' in civics or 'exponent' in math.",
  },
  scale: {
    everyday: "A tool for weighing groceries or fish skin.",
    academic: "To multiply or resize proportionally, or the ratio on a map/graph.",
    tip: "Show a zoomed-in vs. zoomed-out diagram to make 'scaled up' concrete.",
  },
  cell: {
    everyday: "A mobile phone or a small room.",
    academic: "The basic structural unit of all living things, or one box in a spreadsheet/table.",
    tip: "Pair with a microscope image or grid box depending on the subject.",
  },
  sign: {
    everyday: "To write your name on a paper.",
    academic: "A posted symbol or words giving directions, or a + / − symbol in math.",
    tip: "Show a street stop sign alongside a math plus sign so K–2 learners see both meanings.",
  },
  rule: {
    everyday: "A direction you follow at home or on the playground.",
    academic: "A shared agreement for safety, or a pattern rule in math (e.g., 'add 2').",
    tip: "Connect classroom rules to math pattern rules with concrete examples.",
  },
  side: {
    everyday: "Next to someone ('stand by my side').",
    academic: "One straight line segment that forms part of a 2D shape.",
    tip: "Trace each edge of a square or triangle with a finger while counting.",
  },
};

export const TIER2_CONNECTORS = {
  however: { function: "Contrast", plain: "but / on the other hand" },
  whereas: { function: "Contrast", plain: "while / compared to" },
  consequently: { function: "Cause & Effect", plain: "so / as a result" },
  therefore: { function: "Cause & Effect", plain: "so / for that reason" },
  although: { function: "Concession", plain: "even though" },
  furthermore: { function: "Addition", plain: "also / in addition" },
  nevertheless: { function: "Contrast", plain: "even so / still" },
  because: { function: "Cause & Effect", plain: "for the reason that" },
  meanwhile: { function: "Sequence / Time", plain: "at the same time" },
};

// ── Module 2: Translanguaging & L1-to-L2 Interference Coach ───────────────────
export const COGNATE_BANK = {
  ecosystem: { es: "ecosistema", fr: "écosystème", pt: "ecossistema", uk: "екосистема", ru: "экосистема", ar: "النظام البيئي", zh: "生态系统" },
  energy: { es: "energía", fr: "énergie", pt: "energia", uk: "енергія", ru: "энергия", ar: "طاقة", zh: "能量" },
  organisms: { es: "organismos", fr: "organismes", pt: "organismos", uk: "організми", ru: "организмы", ar: "كائنات حية", zh: "生物体" },
  nutrients: { es: "nutrientes", fr: "nutriments", pt: "nutrientes", uk: "поживні речовини", ru: "питательные вещества", ar: "عناصر غذائية", zh: "营养物质" },
  proportional: { es: "proporcional", fr: "proportionnel", pt: "proporcional", uk: "пропорційний", ru: "пропорциональный", ar: "تناسبي", zh: "成比例的" },
  ratio: { es: "razón / ratio", fr: "ratio", pt: "razão", uk: "співвідношення", ru: "соотношение", ar: "نسبة", zh: "比率" },
  constitution: { es: "constitución", fr: "constitution", pt: "constituição", uk: "конституція", ru: "конституция", ar: "دستور", zh: "宪法" },
  system: { es: "sistema", fr: "système", pt: "sistema", uk: "система", ru: "система", ar: "نظام", zh: "系统" },
  evidence: { es: "evidencia", fr: "évidence (preuve)", pt: "evidência", uk: "докази", ru: "доказательства", ar: "دليل", zh: "证据" },
  photosynthesis: { es: "fotosíntesis", fr: "photosynthèse", pt: "fotossíntese", uk: "фотосинтез", ru: "фотосинтез", ar: "التمثيل الضوئي", zh: "光合作用" },
  moisture: { es: "humedad", fr: "humidité", pt: "umidade", uk: "волога", ru: "влага", ar: "رطوبة", zh: "水分" },
  conserve: { es: "conservar", fr: "conserver", pt: "conservar", uk: "зберігати", ru: "сохранять", ar: "يحفظ", zh: "保存" },
};

export const L1_AUDIO_CUES = {
  es: "Piensa en la causa y el efecto: ¿qué pasó primero y qué cambió después? Luego explícalo en inglés.",
  ar: "فكر في السبب والنتيجة: ماذا حدث أولاً وماذا تغير بعد ذلك؟ ثم اشرح ذلك بالإنجليزية.",
  zh: "想一想因果关系：先发生了什么，后来又改变了什么？然后用英语解释一下。",
  fr: "Pensez à la cause et à l'effet : que s'est-il passé en premier et qu'est-ce qui a changé ensuite ? Expliquez-le en anglais.",
  uk: "Подумай про причину та наслідок: що сталося спочатку і що змінилося потім? Потім поясни це англійською.",
  ru: "Подумай о причине и следствии: что произошло сначала и что изменилось потом? Затем объясни это по-английски.",
  pt: "Pense na causa e no efeito: o que aconteceu primeiro e o que mudou depois? Em seguida, explique em inglês.",
  en: "Think about cause and effect: what happened first, and what changed as a result?",
};

// ── Module 3: Sentence Architect Studio ───────────────────────────────────────
export const ARCHITECT_KERNELS = [
  {
    id: "k2-seed-grew",
    klu: "Inform",
    subject: "K–2 Science",
    kernel: "The seed grew.",
    whoWhat: "The seed",
    action: "grew",
    whyHow: "water and warm sunlight",
    blocks: [
      { id: "k1", slot: "verb", category: "Action Verb", text: "sprouted tall green leaves", levelBoost: 1 },
      { id: "k2", slot: "prep", category: "Where Phrase", text: "in the wet soil", levelBoost: 1 },
      { id: "k3", slot: "connector", category: "Sequence Word", text: "first,", levelBoost: 1 },
      { id: "k4", slot: "evidence", category: "Why Clause", text: "because it got water and warm sunlight", levelBoost: 2 },
    ],
  },
  {
    id: "k2-dog-ran",
    klu: "Narrate",
    subject: "K–2 Story",
    kernel: "The dog ran.",
    whoWhat: "The dog",
    action: "ran",
    whyHow: "chasing the red ball",
    blocks: [
      { id: "kd1", slot: "verb", category: "Action Verb", text: "bounded across the grass", levelBoost: 1 },
      { id: "kd2", slot: "prep", category: "Where Phrase", text: "near the sunny park", levelBoost: 1 },
      { id: "kd3", slot: "connector", category: "Time Word", text: "suddenly,", levelBoost: 1 },
      { id: "kd4", slot: "evidence", category: "Why Clause", text: "so it could catch the red ball", levelBoost: 2 },
    ],
  },
  {
    id: "k2-math-compare",
    klu: "Explain",
    subject: "K–2 Math",
    kernel: "The square is different.",
    whoWhat: "The square",
    action: "is different",
    whyHow: "four equal sides vs. three sides",
    blocks: [
      { id: "km1", slot: "verb", category: "Compare Verb", text: "has four equal sides", levelBoost: 1 },
      { id: "km2", slot: "prep", category: "Where Phrase", text: "on our pattern mat", levelBoost: 1 },
      { id: "km3", slot: "connector", category: "Compare Word", text: "whereas the triangle has three,", levelBoost: 2 },
      { id: "km4", slot: "evidence", category: "Why Clause", text: "because every corner on a square matches", levelBoost: 1 },
    ],
  },
  {
    id: "explain-plant",
    klu: "Explain",
    subject: "Science",
    kernel: "The plant died.",
    whoWhat: "The plant",
    action: "died",
    whyHow: "lack of sunlight and water",
    blocks: [
      { id: "b1", slot: "verb", category: "Academic Verb", text: "withered and stopped growing", levelBoost: 1 },
      { id: "b2", slot: "prep", category: "Prepositional Phrase", text: "inside the shaded container", levelBoost: 1 },
      { id: "b3", slot: "connector", category: "Cause/Effect Connector", text: "consequently,", levelBoost: 1 },
      { id: "b4", slot: "evidence", category: "Evidence Clause", text: "because its leaves could not complete photosynthesis", levelBoost: 2 },
    ],
  },
  {
    id: "argue-ratios",
    klu: "Argue",
    subject: "Math",
    kernel: "The recipe changed.",
    whoWhat: "The recipe",
    action: "changed",
    whyHow: "unequal scaling of ingredients",
    blocks: [
      { id: "m1", slot: "verb", category: "Academic Verb", text: "became non-proportional", levelBoost: 1 },
      { id: "m2", slot: "prep", category: "Prepositional Phrase", text: "in the second batch", levelBoost: 1 },
      { id: "m3", slot: "connector", category: "Contrast Connector", text: "whereas the first batch kept a 3:2 ratio,", levelBoost: 2 },
      { id: "m4", slot: "evidence", category: "Evidence Clause", text: "because the flour tripled while the water doubled", levelBoost: 1 },
    ],
  },
  {
    id: "inform-civics",
    klu: "Inform",
    subject: "Social Studies",
    kernel: "Leaders share power.",
    whoWhat: "Leaders",
    action: "share power",
    whyHow: "constitutional checks and balances",
    blocks: [
      { id: "s1", slot: "verb", category: "Academic Verb", text: "exercise distinct responsibilities", levelBoost: 1 },
      { id: "s2", slot: "prep", category: "Prepositional Phrase", text: "across three separate branches", levelBoost: 1 },
      { id: "s3", slot: "connector", category: "Addition Connector", text: "furthermore,", levelBoost: 1 },
      { id: "s4", slot: "evidence", category: "Evidence Clause", text: "so that no single branch can pass unchecked laws", levelBoost: 2 },
    ],
  },
  {
    id: "narrate-bridge",
    klu: "Narrate",
    subject: "ELA",
    kernel: "Maya crossed the bridge.",
    whoWhat: "Maya",
    action: "crossed the bridge",
    whyHow: "carrying the field notes before sunset",
    blocks: [
      { id: "n1", slot: "verb", category: "Academic Verb", text: "navigated the narrow footbridge", levelBoost: 1 },
      { id: "n2", slot: "prep", category: "Prepositional Phrase", text: "above the rising river", levelBoost: 1 },
      { id: "n3", slot: "connector", category: "Sequence Connector", text: "meanwhile,", levelBoost: 1 },
      { id: "n4", slot: "evidence", category: "Evidence Clause", text: "while clutching her waterproof notebook before dusk", levelBoost: 1 },
    ],
  },
];

// ── Module 4: Adaptive Speaking Simulator ─────────────────────────────────────
export const SPEAKING_PROMPTS = [
  {
    id: "k2-weather",
    subject: "K–2 Science",
    klu: "Inform",
    title: "Tell About a Rainy Day",
    prompt: "Look outside on a rainy day. Tell two things plants or animals do when it rains.",
    starter: "When it rains outside, the plants...",
    wordBank: ["rain", "water", "soil", "grow", "because"],
    modelSample: "When it rains outside, the soil gets wet. The plants drink the water because it helps them grow.",
  },
  {
    id: "k2-apples",
    subject: "K–2 Math",
    klu: "Explain",
    title: "Compare Two Baskets",
    prompt: "One basket has 5 red apples and another basket has 3 green apples. Which basket has more, and how do you know?",
    starter: "The first basket has more apples because...",
    wordBank: ["more", "fewer", "compare", "five", "because"],
    modelSample: "The first basket has more apples because five is greater than three.",
  },
  {
    id: "k2-helper",
    subject: "K–2 Community",
    klu: "Narrate",
    title: "Tell About a School Helper",
    prompt: "Think about a helper at your school, like a teacher, nurse, or bus driver. Tell what they do and why they help.",
    starter: "At my school, the helper...",
    wordBank: ["helper", "safe", "first", "because", "school"],
    modelSample: "At my school, the crossing guard holds a bright sign. She helps us cross the street safely because cars must stop.",
  },
  {
    id: "speak-ecosystem",
    subject: "Science",
    klu: "Explain",
    title: "Explain How Decomposers Help Soil",
    prompt: "Explain what happens to nutrients in a forest when decomposers break down dead leaves. Use at least one cause-and-effect word.",
    starter: "When leaves fall to the forest floor, decomposers...",
    wordBank: ["decomposers", "nutrients", "consequently", "ecosystem", "soil"],
    modelSample: "When leaves fall to the forest floor, decomposers break them down into nutrients. Consequently, the soil becomes richer and helps new plants grow.",
  },
  {
    id: "speak-ratio",
    subject: "Math",
    klu: "Argue",
    title: "Justify a Proportional Relationship",
    prompt: "A smoothie uses 2 cups of berries for 1 cup of yogurt. Your friend uses 6 cups of berries and 2 cups of yogurt. Explain why your friend's mix is not proportional.",
    starter: "My friend's mix is not proportional because...",
    wordBank: ["proportional", "ratio", "whereas", "triple", "evidence"],
    modelSample: "My friend's mix is not proportional because the berries tripled from 2 to 6, whereas the yogurt only doubled from 1 to 2.",
  },
  {
    id: "speak-civics",
    subject: "Social Studies",
    klu: "Inform",
    title: "Describe Why Laws Have Checks",
    prompt: "Describe one reason the Constitution divides power among three branches of government.",
    starter: "The Constitution divides power into three branches so that...",
    wordBank: ["branches", "authority", "however", "constitutional", "balance"],
    modelSample: "The Constitution divides power into three branches so that no single leader holds all the authority. For example, Congress writes laws, however the courts can review them.",
  },
];

// ── Module 5: Reclassification Radar Demo Roster (Zero PII) ──────────────────
export const DEMO_ROSTER = [
  { id: "stu-k1", alias: "Leo T.", grade: "K", l1: "es", listening: 4.3, speaking: 3.7, reading: 4.1, writing: 3.6, threshold: 4.5 },
  { id: "stu-k2", alias: "Nadia B.", grade: "2", l1: "ar", listening: 4.6, speaking: 4.2, reading: 4.3, writing: 3.9, threshold: 4.5 },
  { id: "stu-1", alias: "Maya R.", grade: "6", l1: "es", listening: 4.8, speaking: 3.9, reading: 4.6, writing: 4.1, threshold: 4.5 },
  { id: "stu-2", alias: "Mateo S.", grade: "6", l1: "es", listening: 4.4, speaking: 4.3, reading: 4.2, writing: 3.7, threshold: 4.5 },
  { id: "stu-3", alias: "Amira K.", grade: "7", l1: "ar", listening: 4.9, speaking: 4.6, reading: 4.7, writing: 4.2, threshold: 4.5 },
  { id: "stu-4", alias: "Wei L.", grade: "5", l1: "zh", listening: 4.1, speaking: 3.6, reading: 4.5, writing: 4.0, threshold: 4.5 },
  { id: "stu-5", alias: "Sofia M.", grade: "6", l1: "pt", listening: 5.0, speaking: 4.8, reading: 4.9, writing: 4.7, threshold: 4.5 },
  { id: "stu-6", alias: "Dmitri P.", grade: "7", l1: "uk", listening: 3.8, speaking: 3.5, reading: 3.9, writing: 3.4, threshold: 4.5 },
];

// ── Module 6: Bilingual Family Bridge Prompts ─────────────────────────────────
export const FAMILY_DINNER_PROMPTS = [
  {
    id: "dinner-k2-story",
    topic: "K–2 Picture & Story Talk",
    growthKey: "described pictures and ideas in full sentences",
    prompts: {
      en: "Ask your child: Look at a picture in a book or around our home. What is happening, and what might happen next?",
      es: "Pregúntele a su hijo/a: Mira un dibujo en un libro o en casa. ¿Qué está pasando y qué podría pasar después?",
      ar: "اسأل طفلك: انظر إلى صورة في كتاب أو حول منزلنا. ماذا يحدث الآن، وماذا قد يحدث بعد ذلك؟",
      zh: "问问您的孩子：看看书里或家里的一张图片。图里正在发生什么？接下来可能会发生什么？",
      fr: "Demandez à votre enfant : Regarde une image dans un livre ou à la maison. Que se passe-t-il et que pourrait-il se passer ensuite ?",
      uk: "Запитайте дитину: подивися на малюнок у книжці або вдома. Що відбувається і що може статися далі?",
      ru: "Спросите ребёнка: посмотри на картинку в книге или дома. Что происходит и что может случиться дальше?",
      pt: "Pergunte ao seu filho(a): Olhe para uma imagem em um livro ou em casa. O que está acontecendo e o que pode acontecer depois?",
    },
  },
  {
    id: "dinner-eco",
    topic: "Ecosystems & Change",
    growthKey: "explained cause and effect using academic science words",
    prompts: {
      en: "Ask your child: What is one thing in nature (like rain, sunlight, or soil) that changes how plants grow near our home?",
      es: "Pregúntele a su hijo/a: ¿Qué elemento de la naturaleza (como la lluvia, el sol o la tierra) cambia cómo crecen las plantas cerca de casa?",
      ar: "اسأل طفلك: ما هو الشيء الموجود في الطبيعة (مثل المطر أو ضوء الشمس أو التربة) الذي يغير طريقة نمو النباتات بالقرب من منزلنا؟",
      zh: "问问您的孩子：自然界中有哪一种事物（比如雨水、阳光或土壤）会改变我们家附近植物的生长方式？",
      fr: "Demandez à votre enfant : Quel élément de la nature (comme la pluie, le soleil ou la terre) change la façon dont les plantes poussent près de chez nous ?",
      uk: "Запитайте дитину: що в природі (наприклад, дощ, сонячне світло чи ґрунт) змінює те, як ростуть рослини біля нашого дому?",
      ru: "Спросите ребёнка: что в природе (например, дождь, солнечный свет или почва) меняет то, как растут растения рядом с нашим домом?",
      pt: "Pergunte ao seu filho(a): O que na natureza (como chuva, luz do sol ou solo) muda a forma como as plantas crescem perto de nossa casa?",
    },
  },
  {
    id: "dinner-ratio",
    topic: "Cooking with Ratios",
    growthKey: "justified a math comparison using clear evidence",
    prompts: {
      en: "Ask your child: If we double a family recipe tonight, how do we make sure the flavor stays the same?",
      es: "Pregúntele a su hijo/a: Si hoy duplicamos una receta familiar, ¿cómo nos aseguramos de que el sabor siga igual?",
      ar: "اسأل طفلك: إذا ضاعفنا وصفة عائلية الليلة، كيف نتأكد من أن الطعم يظل كما هو؟",
      zh: "问问您的孩子：如果今晚我们把一道家常菜的份量加倍，怎样才能确保味道不变？",
      fr: "Demandez à votre enfant : Si nous doublons une recette familiale ce soir, comment nous assurer que le goût reste le même ?",
      uk: "Запитайте дитину: якщо ми сьогодні подвоїмо сімейний рецепт, як переконатися, що смак залишиться таким самим?",
      ru: "Спросите ребёнка: если мы сегодня удвоим семейный рецепт, как убедиться, что вкус останется прежним?",
      pt: "Pergunte ao seu filho(a): Se dobrarmos uma receita de família hoje à noite, como garantimos que o sabor continue igual?",
    },
  },
  {
    id: "dinner-voice",
    topic: "Sharing Ideas Clearly",
    growthKey: "spoke in complete academic sentences with confidence",
    prompts: {
      en: "Ask your child: What is one idea you explained out loud today, and what example helped someone understand you?",
      es: "Pregúntele a su hijo/a: ¿Qué idea explicó hoy en voz alta y qué ejemplo ayudó a que la entendieran?",
      ar: "اسأل طفلك: ما هي الفكرة التي شرحتها بصوت عالٍ اليوم، وما المثال الذي ساعد الآخرين على فهمك؟",
      zh: "问问您的孩子：你今天大声解释了哪一个想法？举了什么例子让别人听懂了？",
      fr: "Demandez à votre enfant : Quelle idée avez-vous expliquée à voix haute aujourd'hui, et quel exemple a aidé quelqu'un à vous comprendre ?",
      uk: "Запитайте дитину: яку ідею ти сьогодні пояснив(ла) уголос і який приклад допоміг іншим тебе зрозуміти?",
      ru: "Спросите ребёнка: какую идею ты сегодня объяснил(а) вслух и какой пример помог другим тебя понять?",
      pt: "Pergunte ao seu filho(a): Qual ideia você explicou em voz alta hoje e qual exemplo ajudou alguém a entender você?",
    },
  },
];

export const FAMILY_CARD_LABELS = {
  en: { title: "Family Pride Card", week: "This Week's Growth", pride: "Pride Moment", dinner: "2-Minute Dinner Table Prompt", privacy: "Privacy First: No personal student data or audio is stored on external servers.", print: "Print Card", copy: "Copy Share Link" },
  es: { title: "Tarjeta de Orgullo Familiar", week: "Crecimiento de Esta Semana", pride: "Momento de Orgullo", dinner: "Pregunta de 2 Minutos en la Mesa", privacy: "Privacidad Primero: No se guardan datos personales ni audio en servidores externos.", print: "Imprimir Tarjeta", copy: "Copiar Enlace" },
  ar: { title: "بطاقة فخر العائلة", week: "تقدم هذا الأسبوع", pride: "لحظة فخر", dinner: "سؤال لمدة دقيقتين على مائدة العشاء", privacy: "الخصوصية أولاً: لا يتم تخزين أي بيانات شخصية أو تسجيلات صوتية على خوادم خارجية.", print: "طباعة البطاقة", copy: "نسخ الرابط" },
  zh: { title: "家庭骄傲卡", week: "本周成长", pride: "骄傲时刻", dinner: "2分钟餐桌话题", privacy: "隐私优先：外部服务器不存储任何学生个人数据或音频。", print: "打印卡片", copy: "复制分享链接" },
  fr: { title: "Carte Fierté Familiale", week: "Progrès de la Semaine", pride: "Moment de Fierté", dinner: "Question de 2 Minutes à Table", privacy: "Confidentialité : Aucune donnée personnelle ni audio n'est stocké sur des serveurs externes.", print: "Imprimer la Carte", copy: "Copier le Lien" },
  uk: { title: "Картка Гордості Родини", week: "Зростання Цього Тижня", pride: "Момент Гордості", dinner: "2-хвилинне Питання за Вечерею", privacy: "Приватність понад усе: жодні персональні дані чи аудіо не зберігаються на зовнішніх серверах.", print: "Друкувати Картку", copy: "Копіювати Посилання" },
  ru: { title: "Карточка Гордости Семьи", week: "Рост за Эту Неделю", dinner: "2-минутный Вопрос за Ужином", pride: "Момент Гордости", privacy: "Конфиденциальность: личные данные и аудио не хранятся на внешних серверах.", print: "Печать Карточки", copy: "Копировать Ссылку" },
  pt: { title: "Cartão de Orgulho da Família", week: "Crescimento Desta Semana", pride: "Momento de Orgulho", dinner: "Pergunta de 2 Minutos no Jantar", privacy: "Privacidade em Primeiro Lugar: Nenhum dado pessoal ou áudio é armazenado em servidores externos.", print: "Imprimir Cartão", copy: "Copiar Link" },
};

// ── Resource Library Catalog (New + Legacy Harmonized, K-8) ───────────────────
export const RESOURCE_LIBRARY = [
  { id: "bridge", pillar: "Prepare", title: "Content-to-Language Bridge", outcome: "Scan any K–8 lesson text for traps, cognates & tiered frames.", grade: "Grades K–8", domain: "Teacher", route: "bridge", isNew: true },
  { id: "architect", pillar: "Practice", title: "Sentence Architect Studio", outcome: "Snap connectors, verbs & evidence to level up K–8 sentences.", grade: "Grades K–8", domain: "Writing", route: "architect", isNew: true },
  { id: "simulator", pillar: "Practice", title: "Adaptive Speaking Simulator", outcome: "Record K–8 answers with measured lifelines & rubric feedback.", grade: "Grades K–8", domain: "Speaking", route: "simulator", isNew: true },
  { id: "radar", pillar: "Evidence & Family", title: "Reclassification Radar", outcome: "Spot K–8 bubble students & build 4-week domain sprints.", grade: "Grades K–8", domain: "Evidence", route: "radar", isNew: true },
  { id: "family-bridge", pillar: "Evidence & Family", title: "Bilingual Family Bridge", outcome: "Share zero-login Pride Cards & dinner prompts in 7 L1s.", grade: "Grades K–8", domain: "Family", route: "family-bridge", isNew: true },
  { id: "pricing", pillar: "Evidence & Family", title: "Plans & School PO Quote", outcome: "Compare Teacher Pro & generate a printable school quote.", grade: "Admin", domain: "Account", route: "pricing", isNew: true },
  // Legacy ACCESS Practice Lab rooms & studios (K-8)
  { id: "legacy-early", pillar: "Practice", title: "Early Learners Hub (K–2)", outcome: "Picture-first listening, speaking, reading & writing for K–2.", grade: "Grades K–2", domain: "Early K–2", route: "early", isNew: false },
  { id: "legacy-listening", pillar: "Practice", title: "Listening Room", outcome: "Follow classroom directions and catch key details.", grade: "Grades K–8", domain: "Listening", route: "Listening", isNew: false },
  { id: "legacy-reading", pillar: "Practice", title: "Reading Room", outcome: "Read short passages, find evidence & main ideas.", grade: "Grades K–8", domain: "Reading", route: "Reading", isNew: false },
  { id: "legacy-speaking", pillar: "Practice", title: "Speaking Studio", outcome: "Plan, record, and listen back to academic prompts.", grade: "Grades K–8", domain: "Speaking", route: "speak", isNew: false },
  { id: "legacy-writing", pillar: "Practice", title: "Writing Studio", outcome: "Draft and revise structured responses with feedback.", grade: "Grades K–8", domain: "Writing", route: "write", isNew: false },
  { id: "legacy-detective", pillar: "Practice", title: "Language Error Detective", outcome: "Spot and revise 25 recurring academic language patterns.", grade: "Grades 3–8", domain: "Writing", route: "detective", isNew: false },
  { id: "legacy-tests", pillar: "Practice", title: "Practice Tests", outcome: "Rehearse full multi-domain ACCESS-style test sets.", grade: "Grades K–8", domain: "Assessment", route: "tests", isNew: false },
  { id: "legacy-road", pillar: "Prepare", title: "Road to ACCESS", outcome: "12-week sequenced classroom preparation roadmap.", grade: "Grades K–8", domain: "Planning", route: "road", isNew: false },
  { id: "legacy-passport", pillar: "Evidence & Family", title: "My Passport", outcome: "Portable ACCESS1 progress code & saved work.", grade: "Grades K–8", domain: "Evidence", route: "passport", isNew: false },
];
