/* Nightly Hebrew — the nine innings.
 *
 * Scope & sequence is taken straight from Noam's kriah primer (the 106-page
 * reading book), regrouped into 9 "innings". Nothing here is invented: every
 * letter/vowel is introduced in the same ORDER the book introduces it, and the
 * siddur lines are the ones printed in that book's "From the prayer book"
 * boxes.
 *
 * Per unit:
 *   newLetters / newVowels — what is taught tonight
 *   rules                  — the chalk talk
 *   words                  — every word is spellable from letters already
 *                            taught (pinned by test/nightly-hebrew.test.mjs)
 *   sentences              — connected reading: real phrases, not word lists
 *   siddur                 — lines that appear verbatim in the prayer book
 *   closer                 — the short "you can read these" victory lap
 *   why                    — where tonight's material shows up in davening
 *
 * This file is data only. It loads AFTER data.js and hangs UNITS off the same
 * HEB_DATA object. Plain script (no ES module) so pages can just <script src>.
 */
(function (global) {
  "use strict";

  const UNITS = [
    // ------------------------------------------------------------ 1st inning
    {
      id: 1,
      slug: "unit-1",
      inning: "1st Inning",
      title: "Play Ball",
      subtitle: "י ו ז ר ד and the ah sound",
      bigIdea:
        'A Hebrew letter is a SOUND, and the little mark under it tells you which vowel to say. Letter first, then the vowel — ד with a Kamatz under it (דָ) says "dah".',
      why: "These five letters plus the ah sound already spell יָד, the word for hand — and hands show up all over the siddur.",
      newLetters: ["י", "ו", "ז", "ר", "ד"],
      newVowels: ["kamatz", "patach"],
      rules: [
        [
          "Read from the RIGHT",
          "Hebrew starts on the right side of the line and moves left. Your eyes go the opposite way from English.",
        ],
        [
          "The vowel lives UNDER the letter",
          'The little mark below the letter is the vowel. You say the letter first, then the vowel: ז with a Kamatz under it (זָ) says "zah".',
        ],
        [
          "Kamatz and Patach are teammates",
          "Kamatz (a little T, like דָ) and Patach (a flat line, like דַ) look different but say the SAME thing: ah.",
        ],
        [
          "A letter never changes its mind",
          "ד is d in every single word, forever. English letters cheat (think of the c in cat and city) — Hebrew letters do not.",
        ],
        [
          "A Yud at the end rides along",
          'When a Yud lands right after an ah, the two run together into "ai" — דַי is "dai", like the Pesach song.',
        ],
      ],
      words: [
        { heb: "יָד", tr: "yahd", en: "hand" },
        { heb: "זָר", tr: "zahr", en: "a stranger" },
        { heb: "דַי", tr: "dai", en: "enough" },
        { heb: "יָרַד", tr: "yah-rahd", en: "he went down" },
        { heb: "וָו", tr: "vahv", en: "a hook" },
        { heb: "רָז", tr: "rahz", en: "a secret" },
        { heb: "דָר", tr: "dahr", en: "he lives (somewhere)" },
        { heb: "זָז", tr: "zahz", en: "it moved" },
        { heb: "יָדַי", tr: "yah-dai", en: "my hands" },
      ],
      sentences: [],
      siddur: [],
      closer: [
        { heb: "יָד", tr: "yahd", en: "hand" },
        { heb: "זָר", tr: "zahr", en: "stranger" },
        { heb: "יָרַד", tr: "yah-rahd", en: "he went down" },
      ],
      game: {
        file: "unit-1.js",
        name: "Lineup Builder",
        blurb:
          "Build your batting order by snapping a letter card onto a vowel card to make the sound the coach calls.",
      },
    },

    // ------------------------------------------------------------ 2nd inning
    {
      id: 2,
      slug: "unit-2",
      inning: "2nd Inning",
      title: "First Base",
      subtitle: "ה ח ת תּ ק — five more players, same ah",
      bigIdea:
        "New letters, same two vowels. Once you own a letter's sound, the vowel just tells you how to finish it.",
      why: 'הַ at the front of a word means "the" — you will read it in almost every line of every bracha you say.',
      newLetters: ["ה", "ח", "ת", "תּ", "ק"],
      newVowels: [],
      rules: [
        [
          "ח comes from the throat",
          'Chet is not an English "ch" like chair. It\'s the scratchy sound in challah or Bach. Ask a grown-up to model it once.',
        ],
        [
          "Look-alike alert: ה ח ת",
          "ה Hey has a GAP on the left. ח Chet is joined all the way across. ת Tav has a little FOOT kicking left.",
        ],
        [
          "ק drops below the line",
          "Kuf is the only letter so far whose leg goes under the line. That's your clue.",
        ],
        [
          "The dot in תּ",
          'תּ and ת both say t here. Some families read a dot-less ת as "s" — ask which way your shul reads it.',
        ],
        [
          'הַ at the front means "the"',
          'הַר is "a mountain". Stick a הַ on the front — הַהַר — and it becomes "THE mountain". One little syllable, huge job.',
        ],
      ],
      words: [
        { heb: "הַר", tr: "hahr", en: "mountain" },
        { heb: "חַי", tr: "chai", en: "living / alive" },
        { heb: "קַר", tr: "kahr", en: "cold" },
        { heb: "חַיָה", tr: "chah-yah", en: "animal" },
        { heb: "הָיָה", tr: "hah-yah", en: "he was" },
        { heb: "קָרָה", tr: "kah-rah", en: "it happened" },
        { heb: "דַת", tr: "daht", en: "a religion" },
        { heb: "חַד", tr: "chahd", en: "sharp" },
        { heb: "חָזָק", tr: "chah-zahk", en: "strong" },
        { heb: "תַיָר", tr: "tah-yahr", en: "a tourist" },
        { heb: "הָדָר", tr: "hah-dahr", en: "splendor" },
        { heb: "תַחַת", tr: "tah-chaht", en: "under" },
        { heb: "זָהָר", tr: "zah-hahr", en: "he shone" },
        { heb: "הַיָד", tr: "ha-yahd", en: "the hand" },
      ],
      sentences: [
        { heb: "הַהַר קַר.", tr: "ha-hahr kahr", en: "The mountain is cold." },
        { heb: "הַתַיָר יָרַד.", tr: "ha-tah-yahr yah-rahd", en: "The tourist went down." },
        { heb: "הַחַיָה זָזָה.", tr: "ha-chah-yah zah-zah", en: "The animal moved." },
        { heb: "הַיָד חַזָקָה.", tr: "ha-yahd chah-zah-kah", en: "The hand is strong." },
      ],
      siddur: [
        { heb: "חַי", tr: "chai", en: "living — from Adon Olam" },
        { heb: "הָדָר", tr: "hah-dahr", en: "splendor" },
        { heb: "הַדַר", tr: "hah-dahr", en: "the splendor of" },
      ],
      closer: [
        { heb: "הַר", tr: "hahr", en: "mountain" },
        { heb: "חַי", tr: "chai", en: "alive" },
        { heb: "קַר", tr: "kahr", en: "cold" },
        { heb: "חַיָה", tr: "chah-yah", en: "animal" },
      ],
      game: {
        file: "unit-2.js",
        name: "Dugout Sort",
        blurb: "Sort a stack of scouting cards into the right dugout by which letter you hear.",
      },
    },

    // ------------------------------------------------------------ 3rd inning
    {
      id: 3,
      slug: "unit-3",
      inning: "3rd Inning",
      title: "The Vowel Bullpen",
      subtitle: "Tzere, Segol, Chirik and Sheva — four new vowels, no new letters",
      bigIdea:
        "Same letters you already own — brand new sounds, because the mark under them changed. This is the whole engine of Hebrew reading.",
      why: "Sheva is the single most common mark in the siddur. Once you can slide past it, long words stop being scary.",
      newLetters: [],
      newVowels: ["tzere", "segol", "chirik", "sheva", "tzereYud", "chirikMalei"],
      rules: [
        [
          "Count the dots",
          "One dot underneath = Chirik = ee. Two dots side by side = Tzere = ay. Three dots in a little triangle = Segol = eh. Count the dots and you have the sound.",
        ],
        [
          "A Yud after the vowel is a passenger",
          "A Tzere or a Chirik followed by a Yud (דֵי, דִי) does not add a new sound. The Yud is just riding along: still ay, still ee.",
        ],
        [
          "Sheva is the quiet one",
          'Sheva (two dots stacked up and down, like דְ) is mostly SILENT. At the start of a word it\'s a tiny quick "uh", like the beginning of "b\'rachah".',
        ],
        [
          "Same letter, new sound",
          "דָ says dah. דֶ says deh. דִ says dee. דֵ says day. The letter never changed — the vowel did.",
        ],
        [
          "Vowels come in families",
          "Two marks can say the exact same thing. ָ and ַ are both ah. ֵ and ֵי are both ay. ִ and ִי are both ee. Learn the SOUND, not just the picture.",
        ],
      ],
      words: [
        { heb: "זֶה", tr: "zeh", en: "this" },
        { heb: "חֶדֶר", tr: "cheh-der", en: "a room" },
        { heb: "זֵר", tr: "zayr", en: "a wreath" },
        { heb: "קִיר", tr: "keer", en: "a wall" },
        { heb: "דָוִד", tr: "dah-veed", en: "David" },
        { heb: "הֵד", tr: "hayd", en: "an echo" },
        { heb: "תִיק", tr: "teek", en: "a bag" },
        { heb: "חֵיק", tr: "chayk", en: "a lap" },
        { heb: "יָדִית", tr: "yah-deet", en: "a handle" },
        { heb: "דָתִי", tr: "dah-tee", en: "religious" },
        { heb: "חִידָה", tr: "chee-dah", en: "a riddle" },
        { heb: "יְהִי", tr: "y'-hee", en: "let there be" },
        { heb: "תֵה", tr: "tay", en: "tea" },
      ],
      sentences: [
        { heb: "זֶה הַחֶדֶר.", tr: "zeh ha-cheh-der", en: "This is the room." },
        { heb: "הַקִיר קַר.", tr: "ha-keer kahr", en: "The wall is cold." },
        { heb: "דָוִד יָרַד.", tr: "dah-veed yah-rahd", en: "David went down." },
        { heb: "זֶה הַתִיק.", tr: "zeh ha-teek", en: "This is the bag." },
        { heb: "דָוִד הָיָה זָר.", tr: "dah-veed hah-yah zahr", en: "David was a stranger." },
      ],
      siddur: [
        { heb: "זֶה חֶדֶר.", tr: "zeh cheh-der", en: "This is a room." },
        { heb: "הַחֶדֶר קַר.", tr: "ha-cheh-der kahr", en: "The room is cold." },
        { heb: "הַחֶדֶר הַזֶה קַר.", tr: "ha-cheh-der ha-zeh kahr", en: "This room is cold." },
      ],
      closer: [
        { heb: "זֶה", tr: "zeh", en: "this" },
        { heb: "חֶדֶר", tr: "cheh-der", en: "room" },
        { heb: "קִיר", tr: "keer", en: "wall" },
        { heb: "דָוִד", tr: "dah-veed", en: "David" },
      ],
      game: {
        file: "unit-3.js",
        name: "Strike Zone",
        blurb:
          "Aim your pitch: pick the row (letter) and the column (vowel) that land the sound the catcher called.",
      },
    },

    // ------------------------------------------------------------ 4th inning
    {
      id: 4,
      slug: "unit-4",
      inning: "4th Inning",
      title: "The Bullpen Battery",
      subtitle: "נ כּ/כ בּ/ב פּ/פ — one dot changes the pitch",
      bigIdea:
        "Some letters throw TWO different pitches. A dot inside the letter (a dagesh) makes it hard: בּ b, כּ k, פּ p. Take the dot out and it goes soft: ב v, כ ch, פ f.",
      why: "Every bracha you say starts בָּרוּךְ — a Bet with a dagesh. Get this dot right and you are already reading the first word of every blessing.",
      newLetters: ["נ", "כּ", "כ", "בּ", "ב", "פּ", "פ"],
      newVowels: [],
      rules: [
        [
          "The dot INSIDE is a dagesh",
          "It sits in the middle of the letter, not underneath. Underneath = vowel. Inside = dagesh.",
        ],
        [
          "Hard with the dot, soft without",
          "בּ = b, ב = v. כּ = k, כ = ch. פּ = p, פ = f. Same letter, two jobs.",
        ],
        [
          "בּ vs כּ",
          "Bet's bottom line pokes out to the RIGHT. Kaf's bottom is tucked in and rounded.",
        ],
        [
          "Sheva at the front",
          "בְּ at the start of a word is a quick \"b'\" — like the b'rachah you say every night.",
        ],
        [
          "Sometimes a dagesh just doubles the letter",
          'In כִּתָּה and רַבָּה the dot inside the middle letter does not change its sound — it means "lean on it". If the letter is not בכפ, the dot is only a press.',
        ],
      ],
      words: [
        { heb: "נֵר", tr: "nayr", en: "a candle" },
        { heb: "בַּת", tr: "baht", en: "daughter" },
        { heb: "פֶּה", tr: "peh", en: "a mouth" },
        { heb: "דָבָר", tr: "dah-vahr", en: "a word / a thing" },
        { heb: "פָּרָה", tr: "pah-rah", en: "a cow" },
        { heb: "בְּרָכָה", tr: "b'rah-chah", en: "a blessing" },
        { heb: "כִּתָּה", tr: "kee-tah", en: "a classroom" },
        { heb: "חַנָה", tr: "chah-nah", en: "Chana" },
        { heb: "בָּנָה", tr: "bah-nah", en: "he built" },
        { heb: "כִּנֶרֶת", tr: "kee-neh-ret", en: "the Kineret" },
        { heb: "כָּבֵד", tr: "kah-vayd", en: "heavy" },
        { heb: "פְּרִי", tr: "p'-ree", en: "fruit" },
        { heb: "דִבֵּר", tr: "dee-bayr", en: "he spoke" },
        { heb: "נָהָר", tr: "nah-hahr", en: "a river" },
        { heb: "בַּיִת", tr: "bah-yit", en: "a house" },
        { heb: "חָבֵר", tr: "chah-vayr", en: "a friend" },
        { heb: "תִּקְוָה", tr: "tik-vah", en: "hope" },
        { heb: "כִּפָּה", tr: "kee-pah", en: "a kippah" },
      ],
      sentences: [
        { heb: "הַבַּיִת קַר.", tr: "ha-bah-yit kahr", en: "The house is cold." },
        { heb: "דָוִד דִבֵּר.", tr: "dah-veed dee-bayr", en: "David spoke." },
        { heb: "זֶה חָבֵר.", tr: "zeh chah-vayr", en: "This is a friend." },
        { heb: "הַתִיק כָּבֵד.", tr: "ha-teek kah-vayd", en: "The bag is heavy." },
        { heb: "הַנָהָר קַר.", tr: "ha-nah-hahr kahr", en: "The river is cold." },
      ],
      siddur: [
        {
          heb: "רַב רַבָּה כָּכָה",
          tr: "rav · rah-bah · kah-chah",
          en: "great · abundant · so / thus",
        },
        { heb: "יְדַבֵּר כַּפֵּר", tr: "y'-dah-bayr · kah-payr", en: "he will speak · atone" },
        { heb: "דָבָר דְבָרָיו", tr: "dah-vahr · d'-vah-rahv", en: "a word · his words" },
      ],
      closer: [
        { heb: "נֵר", tr: "nayr", en: "candle" },
        { heb: "בְּרָכָה", tr: "b'rah-chah", en: "blessing" },
        { heb: "פֶּה", tr: "peh", en: "mouth" },
        { heb: "דָבָר", tr: "dah-vahr", en: "word" },
      ],
      game: {
        file: "unit-4.js",
        name: "Battery Match",
        blurb:
          "Pair every pitcher with the right catcher — dot in or dot out — and see which pitch each one throws.",
      },
    },

    // ------------------------------------------------------------ 5th inning
    {
      id: 5,
      slug: "unit-5",
      inning: "5th Inning",
      title: "Around the Bases",
      subtitle: "ג ל and the oh sound",
      bigIdea:
        "The oh sound comes two ways: a dot on the letter's left shoulder (דֹ), or a Vav wearing a dot on its head (דוֹ). Both just say oh.",
      why: "עוֹלָם, שָׁלוֹם, גָדוֹל, כָּל — the biggest words in davening are built on this one oh sound.",
      newLetters: ["ג", "ל"],
      newVowels: ["cholam", "cholamMalei"],
      rules: [
        [
          "Cholam sits UP, not down",
          "Every vowel so far lived under the letter. Cholam is the first one that rides on TOP, on the left shoulder.",
        ],
        [
          "וֹ is still just one sound",
          'A Vav with a dot on top is not "v-oh" — it\'s only oh. The Vav is a chair for the dot.',
        ],
        [
          "ל is the tall one",
          "Lamed's neck sticks up above every other letter on the line. Easy to spot.",
        ],
        ["ג never says j", "Gimel is always g like go — never g like giant."],
        [
          "Use ל to break a long word",
          "Lamed sticks up so far you can see it from across the page. Find it first, then read the chunks on either side of it.",
        ],
        [
          "Which oh am I looking at?",
          "If the dot sits ON a Vav, it's Cholam Malei (דוֹ). If it floats on the letter's own shoulder with no Vav, it's plain Cholam (דֹ). Same sound either way.",
        ],
      ],
      words: [
        { heb: "גָדוֹל", tr: "gah-dohl", en: "big" },
        { heb: "דוֹד", tr: "dohd", en: "uncle" },
        { heb: "תּוֹרָה", tr: "toh-rah", en: "Torah" },
        { heb: "לֵב", tr: "layv", en: "a heart" },
        { heb: "חַלָה", tr: "chah-lah", en: "challah" },
        { heb: "לַיְלָה", tr: "lai-lah", en: "night" },
        { heb: "דֶגֶל", tr: "deh-gel", en: "a flag" },
        { heb: "תּוֹדָה", tr: "toh-dah", en: "thank you" },
        { heb: "גַג", tr: "gahg", en: "a roof" },
        { heb: "כֹּל", tr: "kohl", en: "all / every" },
        { heb: "כַּלָה", tr: "kah-lah", en: "a bride" },
        { heb: "לָקַח", tr: "lah-kahch", en: "he took" },
        { heb: "קוֹל", tr: "kohl", en: "a voice" },
        { heb: "כּוֹתֶל", tr: "koh-tel", en: "the Kotel / a wall" },
        { heb: "בֹּקֶר", tr: "boh-ker", en: "morning" },
        { heb: "דָג", tr: "dahg", en: "a fish" },
        { heb: "רֶגֶל", tr: "reh-gel", en: "a leg / a foot" },
        { heb: "כֶּלֶב", tr: "keh-lev", en: "a dog" },
      ],
      sentences: [
        { heb: "הַכֶּלֶב גָדוֹל.", tr: "ha-keh-lev gah-dohl", en: "The dog is big." },
        { heb: "זֶה הַכּוֹתֶל.", tr: "zeh ha-koh-tel", en: "This is the Kotel." },
        { heb: "הַבֹּקֶר קַר.", tr: "ha-boh-ker kahr", en: "The morning is cold." },
        { heb: "דָוִד לָקַח חַלָה.", tr: "dah-veed lah-kahch chah-lah", en: "David took challah." },
        { heb: "תּוֹדָה רַבָּה.", tr: "toh-dah rah-bah", en: "Thank you very much." },
      ],
      siddur: [
        {
          heb: "כָּל הַכֹּל לַכֹּל",
          tr: "kol · ha-kol · la-kol",
          en: "all · everything · to everyone",
        },
        {
          heb: "תּוֹרָה גָדוֹל הַגָדוֹל",
          tr: "toh-rah · gah-dohl · ha-gah-dohl",
          en: "Torah · great · the great one",
        },
        { heb: "דוֹר וָדוֹר לְדוֹר", tr: "dohr vah-dohr · l'dohr", en: "generation to generation" },
      ],
      closer: [
        { heb: "גָדוֹל", tr: "gah-dohl", en: "big" },
        { heb: "תּוֹרָה", tr: "toh-rah", en: "Torah" },
        { heb: "לַיְלָה", tr: "lai-lah", en: "night" },
        { heb: "תּוֹדָה", tr: "toh-dah", en: "thank you" },
      ],
      game: {
        file: "unit-5.js",
        name: "Base Running",
        blurb:
          "Play a vowel card onto the runner's letter to make the sound each base demands, and bring him home.",
      },
    },

    // ------------------------------------------------------------ 6th inning
    {
      id: 6,
      slug: "unit-6",
      inning: "6th Inning",
      title: "Home Plate",
      subtitle: "מ ם ס and the ee sound",
      bigIdea:
        "Meet your first FINAL letter. Some letters change shape when they land at the end of a word — like a runner sliding into home. מ becomes ם.",
      why: "הָעוֹלָם, אֱלֹהִים, שָׁלוֹם — the Final Mem ends more siddur words than any other letter.",
      newLetters: ["מ", "ם", "ס"],
      newVowels: ["chirikMalei"],
      rules: [
        [
          "Final letters only go at the END",
          "ם never starts or sits in the middle of a word. If you see the square Mem, that word is over.",
        ],
        ["Same sound, new shape", "מ and ם are both m. The shape changed; the sound did not."],
        [
          "A Chirik plus a Yud is still just ee",
          'מ with a Chirik and a Yud (מִי) says "mee". The Yud is silent here — it is just holding the dot\'s hand.',
        ],
        ["ס vs ם", "Samech is a smooth closed circle. Final Mem is squared off with corners."],
        [
          "Chunk a long word",
          "מְנוֹרָה looks long until you cut it: מְ · נוֹ · רָה. Three easy chunks. Every long word in the siddur breaks the same way.",
        ],
        [
          "Final shapes are free punctuation",
          "Hebrew has no capital letters, so a final letter is your best clue that one word stopped and the next one started.",
        ],
      ],
      words: [
        { heb: "מַה", tr: "mah", en: "what" },
        { heb: "מִי", tr: "mee", en: "who" },
        { heb: "דָגִים", tr: "dah-geem", en: "fish (plural)" },
        { heb: "יְלָדִים", tr: "y'-lah-deem", en: "children" },
        { heb: "מוֹרָה", tr: "moh-rah", en: "teacher" },
        { heb: "סֵפֶר", tr: "say-fer", en: "a book" },
        { heb: "מָקוֹם", tr: "mah-kohm", en: "a place" },
        { heb: "מְנוֹרָה", tr: "m'-noh-rah", en: "menorah" },
        { heb: "לֶחֶם", tr: "leh-chem", en: "bread" },
        { heb: "הַיוֹם", tr: "ha-yohm", en: "today" },
        { heb: "סוֹד", tr: "sohd", en: "a secret" },
        { heb: "מַיִם", tr: "mah-yeem", en: "water" },
        { heb: "סֵדֶר", tr: "say-der", en: "a Seder / an order" },
        { heb: "יָם", tr: "yahm", en: "a sea" },
        { heb: "מִדְבָּר", tr: "meed-bahr", en: "a desert" },
        { heb: "כַּמָה", tr: "kah-mah", en: "how many" },
        { heb: "מִלָה", tr: "mee-lah", en: "a word" },
        { heb: "חָכָם", tr: "chah-chahm", en: "wise" },
      ],
      sentences: [
        { heb: "מִי זֶה?", tr: "mee zeh", en: "Who is this?" },
        { heb: "מַה זֶה?", tr: "mah zeh", en: "What is this?" },
        { heb: "הַסֵפֶר גָדוֹל.", tr: "ha-say-fer gah-dohl", en: "The book is big." },
        {
          heb: "הַמוֹרָה בַּחֶדֶר.",
          tr: "ha-moh-rah ba-cheh-der",
          en: "The teacher is in the room.",
        },
        { heb: "הַיוֹם קַר.", tr: "ha-yohm kahr", en: "Today is cold." },
      ],
      siddur: [
        {
          heb: "מִינֵי מְזוֹנוֹת",
          tr: "mee-nay m'-zoh-noht",
          en: "kinds of nourishment — from the bracha on grain",
        },
        {
          heb: "הַיוֹם לָהֶם קַיָם",
          tr: "ha-yohm · lah-hem · kah-yahm",
          en: "today · to them · enduring",
        },
        { heb: "מוֹרָה מָקוֹם", tr: "moh-rah · mah-kohm", en: "teacher · place" },
      ],
      closer: [
        { heb: "מִי", tr: "mee", en: "who" },
        { heb: "דָגִים", tr: "dah-geem", en: "fish" },
        { heb: "מָקוֹם", tr: "mah-kohm", en: "place" },
        { heb: "לֶחֶם", tr: "leh-chem", en: "bread" },
      ],
      game: {
        file: "unit-6.js",
        name: "Home Run Derby",
        blurb: "Build the word letter by letter from the tray. Longer words fly farther.",
      },
    },

    // ------------------------------------------------------------ 7th inning
    {
      id: 7,
      slug: "unit-7",
      inning: "7th Inning",
      title: "Doubleheader",
      subtitle: "שׁ שׂ ט and the oo sound",
      bigIdea:
        "One letter, two dots, two totally different sounds. The dot on the RIGHT says sh. The dot on the LEFT says s. Look before you read.",
      why: "שָׁלוֹם, שַׁבָּת, בָּרוּךְ, יִשְׂרָאֵל — tonight you unlock the most-said words in the whole siddur.",
      newLetters: ["שׁ", "שׂ", "ט"],
      newVowels: ["shuruk", "kubutz"],
      rules: [
        [
          "Right = sh, Left = s",
          "שׁ (dot right) = sh, like Shabbat. שׂ (dot left) = s, like Sarah. Check the dot every single time.",
        ],
        [
          "Two ways to say oo",
          "Shuruk (a Vav with a dot in its belly, like לוּ) and Kubutz (three dots climbing left, like לֻ) both say oo.",
        ],
        [
          "וּ is one sound, not two",
          'Just like וֹ, the Vav here is a chair. לוּ = "loo", not "l-voo".',
        ],
        ["ט vs ת", "Tet is a single pot with a curl inside. Tav is two separate legs. Both say t."],
        [
          "The Shin dot is NOT a vowel",
          "It sits on TOP of the letter, up on an arm. Vowels live underneath. If a mark is above the line, it is telling you about the letter, not the vowel.",
        ],
      ],
      words: [
        { heb: "שָׁלוֹם", tr: "shah-lohm", en: "peace / hello" },
        { heb: "שַׁבָּת", tr: "shah-baht", en: "Shabbat" },
        { heb: "טוֹב", tr: "tohv", en: "good" },
        { heb: "שָׂרָה", tr: "sah-rah", en: "Sarah" },
        { heb: "שָׁנָה", tr: "shah-nah", en: "a year" },
        { heb: "סֻכָּה", tr: "soo-kah", en: "a sukkah" },
        { heb: "לוּלָב", tr: "loo-lahv", en: "a lulav" },
        { heb: "שֵׁשׁ", tr: "shaysh", en: "six" },
        { heb: "שָׁמַיִם", tr: "shah-mah-yeem", en: "sky / heaven" },
        { heb: "סוּס", tr: "soos", en: "a horse" },
        { heb: "מְזוּזָה", tr: "m'-zoo-zah", en: "a mezuzah" },
        { heb: "סִדוּר", tr: "see-door", en: "a siddur" },
        { heb: "שִׁיר", tr: "sheer", en: "a song" },
        { heb: "שְׁתַּיִם", tr: "sh'-tah-yeem", en: "two" },
        { heb: "קִדוּשׁ", tr: "kee-doosh", en: "Kiddush" },
        { heb: "טַלִית", tr: "tah-leet", en: "a tallit" },
        { heb: "טוֹבָה", tr: "toh-vah", en: "good (feminine)" },
        { heb: "קֹדֶשׁ", tr: "koh-desh", en: "holy" },
      ],
      sentences: [
        { heb: "שַׁבָּת שָׁלוֹם.", tr: "shah-baht shah-lohm", en: "A peaceful Shabbat." },
        { heb: "הַסוּס גָדוֹל.", tr: "ha-soos gah-dohl", en: "The horse is big." },
        { heb: "שִׁיר טוֹב.", tr: "sheer tohv", en: "A good song." },
        { heb: "זֶה סִדוּר.", tr: "zeh see-door", en: "This is a siddur." },
        { heb: "שָׁנָה טוֹבָה.", tr: "shah-nah toh-vah", en: "A good year." },
      ],
      siddur: [
        { heb: "שֶׁל שֵׁם שְׁמוֹ", tr: "shel · shaym · sh'moh", en: "of · a name · His name" },
        { heb: "שַׁבָּת שָׁלוֹם", tr: "shah-baht shah-lohm", en: "a peaceful Shabbat" },
        { heb: "קָדוֹשׁ מֹשֶׁה", tr: "kah-dohsh · moh-sheh", en: "holy · Moshe" },
      ],
      closer: [
        { heb: "שָׁלוֹם", tr: "shah-lohm", en: "peace" },
        { heb: "שַׁבָּת", tr: "shah-baht", en: "Shabbat" },
        { heb: "טוֹב", tr: "tohv", en: "good" },
        { heb: "שָׂרָה", tr: "sah-rah", en: "Sarah" },
      ],
      game: {
        file: "unit-7.js",
        name: "Dugout Memory",
        blurb: "Flip cards two at a time and match every Hebrew word to the sound it makes.",
      },
    },

    // ------------------------------------------------------------ 8th inning
    {
      id: 8,
      slug: "unit-8",
      inning: "8th Inning",
      title: "Extra Innings",
      subtitle: "א ע צ — the silent ones, and the sneaky vowel",
      bigIdea:
        'א and ע make NO sound at all. They\'re chairs: they hold a vowel so it has somewhere to sit. אָ is just "ah". עֶ is just "eh".',
      why: "אֱלֹהֵינוּ, הָעוֹלָם, אֶחָד — every bracha and the Shema itself lean on these two silent letters.",
      newLetters: ["ע", "א", "צ"],
      newVowels: ["chatafPatach", "chatafSegol", "chatafKamatz"],
      rules: [
        [
          "Silent letters still take a turn",
          "א and ע have no sound of their own. You read only the vowel that's sitting on them.",
        ],
        [
          "The sneaky patach",
          'When a word ENDS in חַ, עַ or הַּ, you say the ah BEFORE the letter: שָׂמֵחַ is "sah-may-ACH", not "sah-may-chah".',
        ],
        [
          "Chataf = a quick vowel",
          'The chataf vowels (אֲ, אֱ, אֳ) are a Sheva glued onto a vowel. Say them fast and light: אֲ is a quick "a", אֱ is a quick "e".',
        ],
        [
          "צ is ts, not s",
          'Tzadi is the sound at the end of "cats" — tz. Say the t and the s together.',
        ],
        [
          'וְ at the front means "and"',
          'A Vav with a Sheva glued to the front of a word is "v\'" and means "and" — אַבָּא וְאִמָא is "Dad and Mom".',
        ],
      ],
      words: [
        { heb: "אַבָּא", tr: "ah-bah", en: "dad" },
        { heb: "אִמָא", tr: "ee-mah", en: "mom" },
        { heb: "אֶחָד", tr: "eh-chahd", en: "one" },
        { heb: "עַם", tr: "ahm", en: "a people / nation" },
        { heb: "מַצָה", tr: "mah-tzah", en: "matzah" },
        { heb: "עוֹלָם", tr: "oh-lahm", en: "world / forever" },
        { heb: "אֲנִי", tr: "ah-nee", en: "I / me" },
        { heb: "אוֹר", tr: "ohr", en: "light" },
        { heb: "שָׂמֵחַ", tr: "sah-may-ach", en: "happy" },
        { heb: "תַּפּוּחַ", tr: "tah-poo-ach", en: "an apple" },
        { heb: "אֵשׁ", tr: "aysh", en: "fire" },
        { heb: "אֱמֶת", tr: "eh-met", en: "truth" },
        { heb: "אַרְבַּע", tr: "ahr-bah", en: "four" },
        { heb: "אִשָׁה", tr: "ee-shah", en: "a woman" },
        { heb: "צְדָקָה", tr: "tz'-dah-kah", en: "charity" },
        { heb: "אַהֲבָה", tr: "ah-hah-vah", en: "love" },
        { heb: "אֱלֹהִים", tr: "eh-loh-heem", en: "God" },
        { heb: "אֳנִיָה", tr: "oh-nee-yah", en: "a ship" },
      ],
      sentences: [
        { heb: "אֲנִי שָׂמֵחַ.", tr: "ah-nee sah-may-ach", en: "I am happy." },
        { heb: "אַבָּא וְאִמָא.", tr: "ah-bah v'-ee-mah", en: "Dad and Mom." },
        { heb: "הָעוֹלָם גָדוֹל.", tr: "hah-oh-lahm gah-dohl", en: "The world is big." },
        { heb: "זֶה אוֹר גָדוֹל.", tr: "zeh ohr gah-dohl", en: "This is a big light." },
        {
          heb: "עַם יִשְׂרָאֵל חַי.",
          tr: "ahm yis-rah-ayl chai",
          en: "The nation of Israel lives.",
        },
      ],
      siddur: [
        {
          heb: "בּוֹרֵא פְּרִי הָאֲדָמָה",
          tr: "boh-ray p'ree ha-ah-dah-mah",
          en: "who creates the fruit of the ground",
        },
        { heb: "אָדָם אֲנִי אַתָּה", tr: "ah-dahm · ah-nee · ah-tah", en: "a person · I · You" },
        {
          heb: "צַדִיק צְדָקָה צִוָה",
          tr: "tzah-deek · tz'-dah-kah · tzee-vah",
          en: "righteous · charity · commanded",
        },
      ],
      closer: [
        { heb: "אֶחָד", tr: "eh-chahd", en: "one" },
        { heb: "עוֹלָם", tr: "oh-lahm", en: "world" },
        { heb: "מַצָה", tr: "mah-tzah", en: "matzah" },
        { heb: "שָׂמֵחַ", tr: "sah-may-ach", en: "happy" },
      ],
      game: {
        file: "unit-8.js",
        name: "Field the Grounder",
        blurb:
          "Route the ball across the infield — you may only step on bases that share the same vowel sound.",
      },
    },

    // ------------------------------------------------------------ 9th inning
    {
      id: 9,
      slug: "unit-9",
      inning: "9th Inning",
      title: "World Series",
      subtitle: "ן ך ף ץ — the closers, and reading the siddur",
      bigIdea:
        "Five letters change shape at the end of a word: ך ם ן ף ץ. Learn them and you can read anything in the siddur.",
      why: "This is the last night of new letters. After this you can open the siddur at any page and sound out every word on it.",
      newLetters: ["ן", "ך", "ף", "ץ"],
      newVowels: [],
      rules: [
        [
          "The five closers",
          "ך ם ן ף ץ. Every one of them has a long tail that drops below the line (except ם, which squares off).",
        ],
        [
          "Tail below the line = end of word",
          "If a letter's tail dives under the line, that word is finished. It's the best punctuation clue in Hebrew.",
        ],
        [
          "Same sound, new shape",
          "ן is still n. ך is still ch. ף is still f. ץ is still tz. Nothing about the sound changed.",
        ],
        [
          "A Final Chaf with a Kamatz",
          'ךָ says "cha". You\'ll see it constantly: לְךָ, שִׁמְךָ, בָּרְכוּ.',
        ],
        [
          "You have the whole alef-bet",
          "Twenty-two letters, five final forms, every vowel. There is no letter left in the siddur that you have not met.",
        ],
      ],
      words: [
        { heb: "בֵּן", tr: "bayn", en: "a son" },
        { heb: "לָבָן", tr: "lah-vahn", en: "white" },
        { heb: "מֶלֶךְ", tr: "meh-lech", en: "a king" },
        { heb: "בָּרוּךְ", tr: "bah-rooch", en: "blessed" },
        { heb: "אֶרֶץ", tr: "eh-retz", en: "land / earth" },
        { heb: "עֵץ", tr: "aytz", en: "a tree" },
        { heb: "סוֹף", tr: "sohf", en: "the end" },
        { heb: "אַף", tr: "ahf", en: "a nose" },
        { heb: "יַיִן", tr: "yah-yeen", en: "wine" },
        { heb: "אָמֵן", tr: "ah-mayn", en: "amen" },
        { heb: "כֵּן", tr: "kayn", en: "yes" },
        { heb: "שֻׁלְחָן", tr: "shool-chahn", en: "a table" },
        { heb: "עַיִן", tr: "ah-yeen", en: "an eye" },
        { heb: "זְמַן", tr: "z'-mahn", en: "time" },
        { heb: "חַלוֹן", tr: "chah-lohn", en: "a window" },
        { heb: "כֶּסֶף", tr: "keh-sef", en: "money / silver" },
        { heb: "גַן", tr: "gahn", en: "a garden" },
        { heb: "קָטָן", tr: "kah-tahn", en: "small" },
      ],
      sentences: [
        { heb: "הַגַן קָטָן.", tr: "ha-gahn kah-tahn", en: "The garden is small." },
        { heb: "הַמֶלֶךְ גָדוֹל.", tr: "ha-meh-lech gah-dohl", en: "The king is great." },
        { heb: "בָּרוּךְ אַתָּה.", tr: "bah-rooch ah-tah", en: "Blessed are You." },
        {
          heb: "הַשֻׁלְחָן בַּחֶדֶר.",
          tr: "ha-shool-chahn ba-cheh-der",
          en: "The table is in the room.",
        },
        { heb: "אָמֵן וְאָמֵן.", tr: "ah-mayn v'-ah-mayn", en: "Amen and amen." },
      ],
      siddur: [
        {
          heb: "בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם",
          tr: "bah-rooch ah-tah Ah-doh-nai Eh-loh-hay-noo meh-lech ha-oh-lahm",
          en: "Blessed are You, Hashem our God, King of the world",
        },
        {
          heb: "שְׁמַע יִשְׂרָאֵל יְיָ אֱלֹהֵינוּ יְיָ אֶחָד",
          tr: "sh'ma Yis-rah-ayl Ah-doh-nai Eh-loh-hay-noo Ah-doh-nai eh-chahd",
          en: "Hear O Israel, Hashem is our God, Hashem is One",
        },
        {
          heb: "עוֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו",
          tr: "oh-seh shah-lohm beem-roh-mahv",
          en: "He who makes peace in His heights",
        },
        {
          heb: "מוֹדֶה אֲנִי לְפָנֶיךָ",
          tr: "moh-deh ah-nee l'-fah-neh-cha",
          en: "I give thanks before You",
        },
      ],
      closer: [
        { heb: "בָּרוּךְ", tr: "bah-rooch", en: "blessed" },
        { heb: "מֶלֶךְ", tr: "meh-lech", en: "king" },
        { heb: "אֶרֶץ", tr: "eh-retz", en: "land" },
        { heb: "אָמֵן", tr: "ah-mayn", en: "amen" },
      ],
      game: {
        file: "unit-9.js",
        name: "Close Out the Inning",
        blurb:
          "Every word is one letter short. Drop the right closer on the end to record the out.",
      },
    },
  ];

  // Accumulate what is "live" at each unit so review activities can always
  // reach back. Final-form letters never take a vowel in drills (they only
  // ever end words), so they stay out of the blending pool.
  const FINALS = new Set(["ם", "ן", "ך", "ף", "ץ"]);
  (function buildPools() {
    let letters = [];
    let vowels = [];
    for (const u of UNITS) {
      letters = letters.concat(u.newLetters);
      vowels = vowels.concat(u.newVowels);
      // de-dupe while keeping teaching order
      u.letterPool = [...new Set(letters)].filter((ch) => !FINALS.has(ch));
      u.vowelPool = [...new Set(vowels)];
      u.allLetters = [...new Set(letters)];
      u.prevLetters = u.letterPool.filter((ch) => !u.newLetters.includes(ch));
      u.prevVowels = u.vowelPool.filter((k) => !u.newVowels.includes(k));
      // Everything readable tonight, in one bag, for the mixed review rounds.
      u.readable = [].concat(u.words, u.sentences, u.siddur);
      u.sentences = u.sentences || [];
    }
  })();

  global.HEB_DATA = Object.assign(global.HEB_DATA || {}, { UNITS, FINALS });
})(window);
