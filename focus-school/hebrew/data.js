/* Nightly Hebrew — curriculum data.
 *
 * Scope & sequence is taken straight from Noam's kriah primer (the 106-page
 * reading book), regrouped into 9 "innings" so each sitting is one page of
 * work. Nothing here is invented: every letter/vowel below is introduced in
 * the same ORDER the book introduces it, and the siddur lines are the ones
 * printed in that book's "From the prayer book" boxes.
 *
 * Plain script (no ES module) so every unit page can just <script src> it.
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------- letters
  // c   = the consonant sound, spelled the way it is READ (used to build
  //       transliterations: c + vowel.v). This is the whole point of the app —
  //       the kid must see that a letter carries a sound and the vowel says
  //       what to do with it.
  // say = plain-English anchor for that sound.
  // watch = the look-alike letter that actually trips readers up.
  const LETTERS = {
    י: {
      name: "Yud",
      c: "y",
      say: "y like in yes",
      note: "The smallest letter — it floats up high.",
      watch: "",
    },
    ו: {
      name: "Vav",
      c: "v",
      say: "v like in van",
      note: "One straight line with a little hat.",
      watch: "ז — Zayin's hat sticks out on BOTH sides; Vav's leans right.",
    },
    ז: {
      name: "Zayin",
      c: "z",
      say: "z like in zoo",
      note: "A line with a wide hat, like a bat over a stick.",
      watch: "ו — Vav has a smaller hat.",
    },
    ר: {
      name: "Resh",
      c: "r",
      say: "r like in run",
      note: "Round shoulder, no corner in the back.",
      watch: "ד — Dalet has a sharp corner and a little heel sticking out back.",
    },
    ד: {
      name: "Dalet",
      c: "d",
      say: "d like in dog",
      note: "Sharp corner on top, with a heel poking out to the right.",
      watch: "ר — Resh is rounded with no heel.",
    },
    ה: {
      name: "Hey",
      c: "h",
      say: "h like in hat",
      note: "Like a Dalet with a little leg that does NOT touch the roof.",
      watch: "ח — Chet's left leg IS attached to the roof.",
    },
    ח: {
      name: "Chet",
      c: "ch",
      say: "ch from the throat, like Bach or challah",
      note: "Two legs joined right across the top — no gap.",
      watch: "ה — Hey has a gap; ת — Tav's left leg has a foot.",
    },
    ת: {
      name: "Tav",
      c: "t",
      say: "t like in top",
      note: "Left leg has a foot kicking to the left.",
      watch: "ח — Chet has no foot.",
    },
    תּ: {
      name: "Tav (with the dot)",
      c: "t",
      say: "t like in top",
      note: "The dot doesn't change the sound here — still t.",
      watch: "",
    },
    ק: {
      name: "Kuf",
      c: "k",
      say: "k like in kick",
      note: "Its left leg drops BELOW the line — the only letter that does.",
      watch: "",
    },
    נ: {
      name: "Nun",
      c: "n",
      say: "n like in no",
      note: "A narrow hook sitting on the line.",
      watch: "ג — Gimel has a foot that kicks left.",
    },
    כּ: {
      name: "Kaf (dot inside)",
      c: "k",
      say: "k like in king",
      note: "Dot inside = the hard k sound.",
      watch: "בּ — Bet's bottom line sticks out to the right.",
    },
    כ: {
      name: "Chaf (no dot)",
      c: "ch",
      say: "ch from the throat, like Bach",
      note: "Take the dot out and it turns breathy.",
      watch: "ב — Vet has a bottom line that sticks out.",
    },
    בּ: {
      name: "Bet (dot inside)",
      c: "b",
      say: "b like in ball",
      note: "Dot inside = b. Bottom line pokes out on the right.",
      watch: "כּ — Kaf has no poking-out bottom.",
    },
    ב: {
      name: "Vet (no dot)",
      c: "v",
      say: "v like in van",
      note: "Same letter, no dot, new sound.",
      watch: "כ — Chaf is fully rounded.",
    },
    פּ: {
      name: "Pey (dot inside)",
      c: "p",
      say: "p like in play",
      note: "Dot inside = p. There's a little curl tucked inside.",
      watch: "",
    },
    פ: {
      name: "Fey (no dot)",
      c: "f",
      say: "f like in fun",
      note: "Drop the dot and p turns into f.",
      watch: "",
    },
    ג: {
      name: "Gimel",
      c: "g",
      say: "g like in go (never like giant)",
      note: "A foot kicking out to the left.",
      watch: "נ — Nun has no kicking foot.",
    },
    ל: {
      name: "Lamed",
      c: "l",
      say: "l like in look",
      note: "The tallest letter — its neck sticks up above the line.",
      watch: "",
    },
    מ: {
      name: "Mem",
      c: "m",
      say: "m like in mom",
      note: "Closed box with a little notch on the left.",
      watch: "ס — Samech is fully closed and round.",
    },
    ם: {
      name: "Final Mem",
      c: "m",
      say: "m like in mom",
      note: "The closed square Mem — only ever at the END of a word.",
      watch: "ס — Samech is rounder.",
    },
    ס: {
      name: "Samech",
      c: "s",
      say: "s like in sun",
      note: "A closed circle — no notch, no gap.",
      watch: "ם — Final Mem is square-ish.",
    },
    שׁ: {
      name: "Shin (dot on the RIGHT)",
      c: "sh",
      say: "sh like in shoe",
      note: "Three branches. Dot up on the RIGHT arm.",
      watch: "שׂ — Sin's dot is on the LEFT.",
    },
    שׂ: {
      name: "Sin (dot on the LEFT)",
      c: "s",
      say: "s like in sun",
      note: "Same three branches, dot on the LEFT arm.",
      watch: "שׁ — Shin's dot is on the RIGHT.",
    },
    ט: {
      name: "Tet",
      c: "t",
      say: "t like in top",
      note: "A pot with a curl tucked inside on the left.",
      watch: "ת — Tav is two separate legs.",
    },
    ע: {
      name: "Ayin",
      c: "",
      say: "SILENT — it makes no sound of its own",
      note: "A V on a stick. It just carries the vowel.",
      watch: "א — Alef is also silent; Ayin looks like a Y/V shape.",
    },
    א: {
      name: "Alef",
      c: "",
      say: "SILENT — it makes no sound of its own",
      note: "The very first letter, and it has no sound! It holds a vowel for you.",
      watch: "ע — Ayin is the other silent one.",
    },
    צ: {
      name: "Tzadi",
      c: "tz",
      say: "tz like the end of cats",
      note: "Two strokes joining, with a foot to the left.",
      watch: "ע — Ayin is silent; Tzadi is a real ts sound.",
    },
    ן: {
      name: "Final Nun",
      c: "n",
      say: "n like in no",
      note: "Straight down BELOW the line. End of a word only.",
      watch: "ו — Vav stops at the line; Final Nun keeps going down.",
    },
    ך: {
      name: "Final Chaf",
      c: "ch",
      say: "ch from the throat, like Bach",
      note: "Long tail below the line. End of a word only.",
      watch: "ר — Resh stops on the line.",
    },
    ףּ: {
      name: "Final Fey",
      c: "f",
      say: "f like in fun",
      note: "Long tail below the line. End of a word only.",
      watch: "",
    },
    ף: {
      name: "Final Fey",
      c: "f",
      say: "f like in fun",
      note: "Long tail below the line. End of a word only.",
      watch: "ן — Final Nun has no head on top.",
    },
    ץ: {
      name: "Final Tzadi",
      c: "tz",
      say: "tz like the end of cats",
      note: "Long tail below the line. End of a word only.",
      watch: "ן — Final Nun is a plain straight line.",
    },
  };

  // ----------------------------------------------------------------- vowels
  // ch is appended straight after the letter — that string concatenation is
  // exactly what a reader does out loud: letter first, then vowel.
  const VOWELS = {
    kamatz: {
      ch: "ָ",
      name: "Kamatz",
      v: "ah",
      say: "ah like in father",
      art: "a little T sitting under the letter",
    },
    patach: {
      ch: "ַ",
      name: "Patach",
      v: "ah",
      say: "ah like in father",
      art: "a flat line under the letter",
    },
    tzere: {
      ch: "ֵ",
      name: "Tzere",
      v: "ay",
      say: "ay like in they",
      art: "two dots side by side",
    },
    segol: {
      ch: "ֶ",
      name: "Segol",
      v: "eh",
      say: "eh like in bed",
      art: "three dots in a little triangle",
    },
    chirik: { ch: "ִ", name: "Chirik", v: "ee", say: "ee like in see", art: "one single dot" },
    chirikMalei: {
      ch: "ִי",
      name: "Chirik + Yud",
      v: "ee",
      say: "ee like in see",
      art: "the dot, plus a Yud right after — still just ee",
    },
    tzereYud: {
      ch: "ֵי",
      name: "Tzere + Yud",
      v: "ay",
      say: "ay like in they",
      art: "two dots plus a Yud — still just ay",
    },
    sheva: {
      ch: "ְ",
      name: "Sheva",
      v: "'",
      say: "mostly SILENT — a tiny quick 'uh' at most",
      art: "two dots stacked up and down",
    },
    cholam: {
      ch: "ֹ",
      name: "Cholam",
      v: "oh",
      say: "oh like in go",
      art: "one dot up on the LEFT shoulder",
    },
    cholamMalei: {
      ch: "וֹ",
      name: "Cholam + Vav",
      v: "oh",
      say: "oh like in go",
      art: "a Vav with a dot on top — still just oh",
    },
    shuruk: {
      ch: "וּ",
      name: "Shuruk",
      v: "oo",
      say: "oo like in moon",
      art: "a Vav with a dot in its belly",
    },
    kubutz: {
      ch: "ֻ",
      name: "Kubutz",
      v: "oo",
      say: "oo like in moon",
      art: "three dots climbing up to the left",
    },
    chatafPatach: {
      ch: "ֲ",
      name: "Chataf Patach",
      v: "ah",
      say: "a quick little ah",
      art: "a Sheva glued onto a Patach",
    },
    chatafSegol: {
      ch: "ֱ",
      name: "Chataf Segol",
      v: "eh",
      say: "a quick little eh",
      art: "a Sheva glued onto a Segol",
    },
    chatafKamatz: {
      ch: "ֳ",
      name: "Chataf Kamatz",
      v: "oh",
      say: "a quick little oh",
      art: "a Sheva glued onto a Kamatz",
    },
  };

  // ------------------------------------------------------------------ units
  // Each unit: what is NEW, and every letter/vowel that is now live for
  // review. `pool` is filled in below so review activities always draw from
  // everything learned so far — that is the whole "keep practicing what came
  // before" requirement.
  const UNITS = [
    {
      id: 1,
      slug: "unit-1",
      inning: "1st Inning",
      title: "Play Ball",
      subtitle: "י ו ז ר ד and the ah sound",
      bigIdea:
        'A Hebrew letter is a SOUND, and the little mark under it tells you which vowel to say. Letter first, then the vowel — ד with a Kamatz under it (דָ) says "dah".',
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
      ],
      words: [
        { heb: "יָד", tr: "yahd", en: "hand" },
        { heb: "זָר", tr: "zahr", en: "a stranger" },
        { heb: "דַי", tr: "dai", en: "enough" },
        { heb: "יָרַד", tr: "yah-rahd", en: "he went down" },
        { heb: "וָו", tr: "vahv", en: "a hook" },
      ],
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
    {
      id: 2,
      slug: "unit-2",
      inning: "2nd Inning",
      title: "First Base",
      subtitle: "ה ח ת תּ ק — five more players, same ah",
      bigIdea:
        "New letters, same two vowels. Once you own a letter's sound, the vowel just tells you how to finish it.",
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
      ],
      words: [
        { heb: "הַר", tr: "hahr", en: "mountain" },
        { heb: "חַי", tr: "chai", en: "living / alive" },
        { heb: "קַר", tr: "kahr", en: "cold" },
        { heb: "חַיָה", tr: "chah-yah", en: "animal" },
        { heb: "הָיָה", tr: "hah-yah", en: "he was" },
        { heb: "קָרָה", tr: "kah-rah", en: "it happened" },
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
    {
      id: 3,
      slug: "unit-3",
      inning: "3rd Inning",
      title: "The Vowel Bullpen",
      subtitle: "Tzere, Segol, Chirik and Sheva — four new vowels, no new letters",
      bigIdea:
        "Same letters you already own — brand new sounds, because the mark under them changed. This is the whole engine of Hebrew reading.",
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
      ],
      words: [
        { heb: "זֶה", tr: "zeh", en: "this" },
        { heb: "חֶדֶר", tr: "cheh-der", en: "a room" },
        { heb: "זֵר", tr: "zayr", en: "a wreath" },
        { heb: "קִיר", tr: "keer", en: "a wall" },
        { heb: "דָוִד", tr: "dah-veed", en: "David" },
        { heb: "הֵד", tr: "hayd", en: "an echo" },
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
    {
      id: 4,
      slug: "unit-4",
      inning: "4th Inning",
      title: "The Bullpen Battery",
      subtitle: "נ כּ/כ בּ/ב פּ/פ — one dot changes the pitch",
      bigIdea:
        "Some letters throw TWO different pitches. A dot inside the letter (a dagesh) makes it hard: בּ b, כּ k, פּ p. Take the dot out and it goes soft: ב v, כ ch, פ f.",
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
    {
      id: 5,
      slug: "unit-5",
      inning: "5th Inning",
      title: "Around the Bases",
      subtitle: "ג ל and the oh sound",
      bigIdea:
        "The oh sound comes two ways: a dot on the letter's left shoulder (דֹ), or a Vav wearing a dot on its head (דוֹ). Both just say oh.",
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
    {
      id: 6,
      slug: "unit-6",
      inning: "6th Inning",
      title: "Home Plate",
      subtitle: "מ ם ס and the ee sound",
      bigIdea:
        "Meet your first FINAL letter. Some letters change shape when they land at the end of a word — like a runner sliding into home. מ becomes ם.",
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
          "מ with a Chirik and a Yud (מִי) says \"mee\". The Yud is silent here — it is just holding the dot's hand.",
        ],
        ["ס vs ם", "Samech is a smooth closed circle. Final Mem is squared off with corners."],
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
    {
      id: 7,
      slug: "unit-7",
      inning: "7th Inning",
      title: "Doubleheader",
      subtitle: "שׁ שׂ ט and the oo sound",
      bigIdea:
        "One letter, two dots, two totally different sounds. The dot on the RIGHT says sh. The dot on the LEFT says s. Look before you read.",
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
      ],
      words: [
        { heb: "שָׁלוֹם", tr: "shah-lohm", en: "peace / hello" },
        { heb: "שַׁבָּת", tr: "shah-baht", en: "Shabbat" },
        { heb: "טוֹב", tr: "tohv", en: "good" },
        { heb: "שָׂרָה", tr: "sah-rah", en: "Sarah" },
        { heb: "שָׁנָה", tr: "shah-nah", en: "a year" },
        { heb: "סֻכָּה", tr: "soo-kah", en: "sukkah" },
        { heb: "לוּלָב", tr: "loo-lahv", en: "lulav" },
        { heb: "שֵׁשׁ", tr: "shaysh", en: "six" },
        { heb: "שָׁמַיִם", tr: "shah-mah-yeem", en: "sky / heaven" },
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
    {
      id: 8,
      slug: "unit-8",
      inning: "8th Inning",
      title: "Extra Innings",
      subtitle: "א ע צ — the silent ones, and the sneaky vowel",
      bigIdea:
        'א and ע make NO sound at all. They\'re chairs: they hold a vowel so it has somewhere to sit. אָ is just "ah". עֶ is just "eh".',
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
    {
      id: 9,
      slug: "unit-9",
      inning: "9th Inning",
      title: "World Series",
      subtitle: "ן ך ף ץ — the closers, and reading the siddur",
      bigIdea:
        "Five letters change shape at the end of a word: ך ם ן ף ץ. Learn them and you can read anything in the siddur.",
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
    }
  })();

  global.HEB_DATA = { LETTERS, VOWELS, UNITS, FINALS };
})(window);
