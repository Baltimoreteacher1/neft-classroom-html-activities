/**
 * data.js — Authored content for the Universal Access Layer demo.
 *
 * Everything here is static and authored by hand. No API calls, ever.
 * Three Grade 6 math word problems (Reveal-aligned), each authored at
 * three reading levels (0 = most support, 1 = support, 2 = enrichment),
 * plus hand-written translations and a math glossary.
 *
 * Level labels are intentionally "Level 0 / Level 1 / Level 2".
 * We never use the label "ESOL" anywhere a student can see it.
 */

export const LEVELS = [
  {
    id: 0,
    name: "Level 0",
    blurb: "Most support — short sentences, words pre-taught, picture cue.",
  },
  {
    id: 1,
    name: "Level 1",
    blurb: "Support — clear, on-grade wording.",
  },
  {
    id: 2,
    name: "Level 2",
    blurb: "Enrichment — richer context and a stretch question.",
  },
];

export const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "es", name: "Español", dir: "ltr" },
  { code: "ht", name: "Kreyòl Ayisyen", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
];

/**
 * Glossary of key math terms. Each entry has a kid-friendly definition and a
 * tiny inline illustration (emoji — renders everywhere, zero assets to load).
 */
export const GLOSSARY = {
  ratio: {
    term: "ratio",
    icon: "🍎:🍐",
    def: "A way to compare two amounts, like 3 to 2. We can write 2 apples to 3 pears as 2:3.",
  },
  rate: {
    term: "rate",
    icon: "🚗⏱️",
    def: "A ratio that compares two different units, like miles per hour.",
  },
  "unit rate": {
    term: "unit rate",
    icon: "1️⃣💲",
    def: "The cost or amount for exactly ONE. Example: $3 for 1 pound.",
  },
  percent: {
    term: "percent",
    icon: "％",
    def: "A part out of 100. 25 percent means 25 out of every 100.",
  },
  equation: {
    term: "equation",
    icon: "⚖️",
    def: "A math sentence that says two things are equal, like x + 4 = 10.",
  },
  variable: {
    term: "variable",
    icon: "📦x",
    def: "A letter that stands for a number we do not know yet, like x or n.",
  },
  area: {
    term: "area",
    icon: "🟩",
    def: "The amount of space inside a flat shape. We measure it in square units.",
  },
  perimeter: {
    term: "perimeter",
    icon: "🔲",
    def: "The distance all the way around the outside of a shape.",
  },
};

/**
 * The three sample problems.
 * Each problem has:
 *   - title
 *   - terms: glossary keys to highlight in the text
 *   - levels: { 0, 1, 2 } authored text per reading level, per language
 *
 * Text uses [[term]] markers around glossary words so the renderer can make
 * them tappable. Markers work in every language string.
 */
export const PROBLEMS = [
  {
    id: "ratio-smoothie",
    title: "Smoothie Stand",
    terms: ["ratio", "unit rate"],
    levels: {
      0: {
        en: "A stand sells smoothies.\n3 smoothies cost $6.\nThe [[ratio]] is 3 to 6.\nFind the [[unit rate]].\nHow much is 1 smoothie?",
        es: "Un puesto vende batidos.\n3 batidos cuestan $6.\nLa [[ratio]] es 3 a 6.\nHalla la [[unit rate]].\n¿Cuánto cuesta 1 batido?",
        ht: "Yon stann vann smoothie.\n3 smoothie koute $6.\n[[ratio]] la se 3 pou 6.\njwenn [[unit rate]] la.\nKonbyen 1 smoothie koute?",
        ar: "كُشك يبيع العصائر.\n٣ عصائر تكلّف ٦ دولارات.\nالـ[[ratio]] هي ٣ إلى ٦.\nأوجد الـ[[unit rate]].\nكم يكلّف عصير واحد؟",
      },
      1: {
        en: "A smoothie stand sells 3 smoothies for $6. The [[ratio]] of smoothies to dollars is 3:6. What is the [[unit rate]] — the price for one smoothie?",
        es: "Un puesto de batidos vende 3 batidos por $6. La [[ratio]] de batidos a dólares es 3:6. ¿Cuál es la [[unit rate]], el precio de un batido?",
        ht: "Yon stann smoothie vann 3 smoothie pou $6. [[ratio]] smoothie ak dola se 3:6. Ki [[unit rate]] la — pri pou yon sèl smoothie?",
        ar: "كُشك عصائر يبيع ٣ عصائر مقابل ٦ دولارات. الـ[[ratio]] بين العصائر والدولارات هي ٣:٦. ما هي الـ[[unit rate]]، أي سعر العصير الواحد؟",
      },
      2: {
        en: "The student council runs a smoothie stand at the spring fair and sells 3 smoothies for $6. Using the [[ratio]] of smoothies to dollars, find the [[unit rate]] for one smoothie. Stretch: at this rate, how much money would the council collect if they sold 50 smoothies, and how would you prove your answer is reasonable?",
        es: "El consejo estudiantil tiene un puesto de batidos en la feria de primavera y vende 3 batidos por $6. Usando la [[ratio]] de batidos a dólares, halla la [[unit rate]] de un batido. Reto: a este ritmo, ¿cuánto dinero recaudaría el consejo al vender 50 batidos, y cómo probarías que tu respuesta es razonable?",
        ht: "Konsèy elèv yo gen yon stann smoothie nan fwa prentan an epi yo vann 3 smoothie pou $6. Sèvi ak [[ratio]] smoothie ak dola, jwenn [[unit rate]] pou yon smoothie. Defi: nan vitès sa a, konbyen lajan konsèy la ta ranmase si yo vann 50 smoothie, epi kijan ou ta pwouve repons ou rezonab?",
        ar: "ينظّم مجلس الطلاب كُشكاً للعصائر في معرض الربيع ويبيع ٣ عصائر مقابل ٦ دولارات. باستخدام الـ[[ratio]] بين العصائر والدولارات، أوجد الـ[[unit rate]] لعصير واحد. تحدٍّ: بهذا المعدّل، كم من المال سيجمعه المجلس إذا باع ٥٠ عصيراً، وكيف تُثبت أنّ إجابتك معقولة؟",
      },
    },
  },
  {
    id: "percent-tip",
    title: "Restaurant Tip",
    terms: ["percent", "rate"],
    levels: {
      0: {
        en: "A meal costs $40.\nThe tip is 20 [[percent]].\n20 percent means 20 out of 100.\nFind the tip in dollars.\nThen find the total.",
        es: "Una comida cuesta $40.\nLa propina es 20 [[percent]].\n20 por ciento es 20 de 100.\nHalla la propina en dólares.\nLuego halla el total.",
        ht: "Yon repa koute $40.\nPouboua a se 20 [[percent]].\n20 pousan vle di 20 sou 100.\njwenn pouboua a an dola.\nApre sa jwenn total la.",
        ar: "وجبة تكلّف ٤٠ دولاراً.\nالبقشيش ٢٠ [[percent]].\n٢٠ بالمئة تعني ٢٠ من ١٠٠.\nأوجد البقشيش بالدولار.\nثم أوجد المجموع.",
      },
      1: {
        en: "A family's meal costs $40. They want to leave a 20 [[percent]] tip. What is the tip in dollars, and what is the total amount they pay?",
        es: "La comida de una familia cuesta $40. Quieren dejar una propina del 20 [[percent]]. ¿Cuál es la propina en dólares y cuál es el total que pagan?",
        ht: "Repa yon fanmi koute $40. Yo vle kite yon pouboua 20 [[percent]]. Konbyen pouboua a ye an dola, epi konbyen total yo peye a?",
        ar: "وجبة عائلة تكلّف ٤٠ دولاراً. يريدون ترك بقشيش بنسبة ٢٠ [[percent]]. كم البقشيش بالدولار، وكم المبلغ الإجمالي الذي يدفعونه؟",
      },
      2: {
        en: "A family's dinner bill comes to $40, and they plan to leave a 20 [[percent]] tip for great service. Find the tip and the total. Stretch: at the same [[rate]], the next table's bill is $65 — predict their tip, and explain a quick mental-math strategy a server could use to estimate any 20 percent tip.",
        es: "La cena de una familia suma $40 y planean dejar una propina del 20 [[percent]] por el buen servicio. Halla la propina y el total. Reto: al mismo [[rate]], la cuenta de la otra mesa es $65; predice su propina y explica una estrategia rápida de cálculo mental para estimar cualquier propina del 20 por ciento.",
        ht: "Bòdwo dine yon fanmi rive $40, epi yo planifye kite yon pouboua 20 [[percent]] pou bon sèvis la. Jwenn pouboua a ak total la. Defi: nan menm [[rate]] la, bòdwo lòt tab la se $65 — predi pouboua yo, epi eksplike yon estrateji kalkil mantal rapid yon sèvè ta ka itilize pou estime nenpòt pouboua 20 pousan.",
        ar: "تبلغ فاتورة عشاء عائلة ٤٠ دولاراً، ويخطّطون لترك بقشيش بنسبة ٢٠ [[percent]] مقابل الخدمة الممتازة. أوجد البقشيش والمجموع. تحدٍّ: بنفس الـ[[rate]]، فاتورة الطاولة التالية ٦٥ دولاراً — توقّع بقشيشهم، واشرح طريقة حساب ذهني سريعة يمكن للنادل استخدامها لتقدير أي بقشيش بنسبة ٢٠ بالمئة.",
      },
    },
  },
  {
    id: "equation-garden",
    title: "Garden Fence",
    terms: ["equation", "variable", "perimeter", "area"],
    levels: {
      0: {
        en: "A garden is a rectangle.\nThe [[perimeter]] is 30 feet.\nThe long side is 9 feet.\nLet x be the short side.\nWrite an [[equation]] for the [[perimeter]].\nFind x.",
        es: "Un jardín es un rectángulo.\nEl [[perimeter]] es 30 pies.\nEl lado largo es 9 pies.\nSea x el lado corto.\nEscribe una [[equation]] del [[perimeter]].\nHalla x.",
        ht: "Yon jaden se yon rektang.\n[[perimeter]] la se 30 pye.\nGwo bò a se 9 pye.\nKite x se ti bò a.\nEkri yon [[equation]] pou [[perimeter]] la.\nJwenn x.",
        ar: "حديقة على شكل مستطيل.\nالـ[[perimeter]] ٣٠ قدماً.\nالضلع الطويل ٩ أقدام.\nليكن x الضلع القصير.\nاكتب [[equation]] للـ[[perimeter]].\nأوجد x.",
      },
      1: {
        en: "A rectangular garden has a [[perimeter]] of 30 feet. The longer side measures 9 feet. Let the [[variable]] x stand for the shorter side. Write an [[equation]] for the [[perimeter]] and solve for x.",
        es: "Un jardín rectangular tiene un [[perimeter]] de 30 pies. El lado más largo mide 9 pies. Sea la [[variable]] x el lado más corto. Escribe una [[equation]] del [[perimeter]] y resuelve para x.",
        ht: "Yon jaden rektangilè gen yon [[perimeter]] 30 pye. Pi long bò a mezire 9 pye. Kite [[variable]] x reprezante pi kout bò a. Ekri yon [[equation]] pou [[perimeter]] la epi rezoud pou x.",
        ar: "حديقة مستطيلة لها [[perimeter]] يبلغ ٣٠ قدماً. الضلع الأطول يقيس ٩ أقدام. ليكن الـ[[variable]] x هو الضلع الأقصر. اكتب [[equation]] للـ[[perimeter]] وحلّ لإيجاد x.",
      },
      2: {
        en: "A community group is fencing a rectangular garden with a [[perimeter]] of 30 feet; the longer side is 9 feet. Use the [[variable]] x for the shorter side, write and solve an [[equation]] for the [[perimeter]]. Stretch: once you know both sides, find the [[area]] of the garden, then decide which would change the [[area]] more — adding 1 foot to the long side or 1 foot to the short side — and justify your reasoning.",
        es: "Un grupo comunitario va a cercar un jardín rectangular con un [[perimeter]] de 30 pies; el lado más largo mide 9 pies. Usa la [[variable]] x para el lado más corto, escribe y resuelve una [[equation]] del [[perimeter]]. Reto: cuando conozcas ambos lados, halla el [[area]] del jardín y decide qué cambiaría más el [[area]] — sumar 1 pie al lado largo o 1 pie al lado corto — y justifica tu razonamiento.",
        ht: "Yon gwoup kominotè ap mete kloti sou yon jaden rektangilè ki gen yon [[perimeter]] 30 pye; pi long bò a se 9 pye. Sèvi ak [[variable]] x pou pi kout bò a, ekri epi rezoud yon [[equation]] pou [[perimeter]] la. Defi: lè ou konnen toulède bò yo, jwenn [[area]] jaden an, apre sa deside kisa ki ta chanje [[area]] a plis — ajoute 1 pye sou gwo bò a oswa 1 pye sou ti bò a — epi jistifye rezònman ou.",
        ar: "تقوم مجموعة من الحي بتسييج حديقة مستطيلة لها [[perimeter]] يبلغ ٣٠ قدماً؛ الضلع الأطول ٩ أقدام. استخدم الـ[[variable]] x للضلع الأقصر، واكتب وحلّ [[equation]] للـ[[perimeter]]. تحدٍّ: بعد معرفة الضلعين، أوجد الـ[[area]] للحديقة، ثم قرّر أيّهما يغيّر الـ[[area]] أكثر — إضافة قدم واحد للضلع الطويل أم للضلع القصير — وبرّر تفكيرك.",
      },
    },
  },
];
