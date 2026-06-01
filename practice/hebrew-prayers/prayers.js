/* ------------------------------------------------------------------
   Hebrew Prayer Practice — prayer data
   ------------------------------------------------------------------
   Each prayer is an object:
     {
       id:          unique slug (used for localStorage keys)
       title:       friendly English/transliterated name
       subtitle:    short context (when / why it is said)
       note:        optional caution shown in the UI (kept short on purpose)
       lines: [
         { he: "<Hebrew with niqqud>", tr: "<transliteration>", en: "<plain meaning>" },
         ...
       ]
     }

   ACCURACY: Standard, widely-used Ashkenazi text & transliteration.
   Where the full text is long or vowel-pointing is easy to get wrong,
   only the famous opening lines are included on purpose (not padded).
   Always double-check Hebrew with a parent or teacher.
   ------------------------------------------------------------------ */

const PRAYERS = [
  {
    id: "modeh-ani",
    title: "Modeh Ani",
    subtitle: "Said first thing in the morning, on waking up.",
    lines: [
      {
        he: "מוֹדֶה אֲנִי לְפָנֶיךָ",
        tr: "Modeh ani lefanecha",
        en: "I give thanks before You",
      },
      {
        he: "מֶלֶךְ חַי וְקַיָּם,",
        tr: "melech chai v'kayam,",
        en: "living and eternal King,",
      },
      {
        he: "שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה,",
        tr: "shehechezarta bi nishmati b'chemlah,",
        en: "for You have returned my soul to me with mercy.",
      },
      {
        he: "רַבָּה אֱמוּנָתֶךָ.",
        tr: "rabbah emunatecha.",
        en: "Great is Your faithfulness.",
      },
    ],
  },

  {
    id: "mah-tovu",
    title: "Mah Tovu",
    subtitle: "Said on entering the synagogue.",
    lines: [
      {
        he: "מַה טֹּבוּ אֹהָלֶיךָ יַעֲקֹב,",
        tr: "Mah tovu ohalecha Ya'akov,",
        en: "How good are your tents, Jacob,",
      },
      {
        he: "מִשְׁכְּנֹתֶיךָ יִשְׂרָאֵל.",
        tr: "mishk'notecha Yisrael.",
        en: "your dwelling places, Israel.",
      },
      {
        he: "וַאֲנִי בְּרֹב חַסְדְּךָ אָבוֹא בֵיתֶךָ,",
        tr: "Va'ani b'rov chasd'cha avo veitecha,",
        en: "As for me, through Your great kindness I enter Your house,",
      },
      {
        he: "אֶשְׁתַּחֲוֶה אֶל הֵיכַל קָדְשְׁךָ בְּיִרְאָתֶךָ.",
        tr: "eshtachaveh el heichal kodsh'cha b'yir'atecha.",
        en: "I bow toward Your holy sanctuary in awe of You.",
      },
    ],
  },

  {
    id: "shema",
    title: "Shema & Baruch Shem",
    subtitle: "The central declaration of God's oneness.",
    lines: [
      {
        he: "שְׁמַע יִשְׂרָאֵל,",
        tr: "Sh'ma Yisrael,",
        en: "Hear, O Israel,",
      },
      {
        he: "יְיָ אֱלֹהֵינוּ,",
        tr: "Adonai Eloheinu,",
        en: "the Lord is our God,",
      },
      {
        he: "יְיָ אֶחָד.",
        tr: "Adonai echad.",
        en: "the Lord is One.",
      },
      {
        he: "בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.",
        tr: "Baruch shem k'vod malchuto l'olam va'ed.",
        en: "Blessed is the name of His glorious kingdom forever and ever. (said quietly)",
      },
    ],
  },

  {
    id: "vahavta",
    title: "V'ahavta",
    subtitle: "First lines, said right after the Shema.",
    note: "These are the well-known opening lines of a longer paragraph. Double-check the rest with a parent or teacher.",
    lines: [
      {
        he: "וְאָהַבְתָּ אֵת יְיָ אֱלֹהֶיךָ",
        tr: "V'ahavta et Adonai Elohecha",
        en: "You shall love the Lord your God",
      },
      {
        he: "בְּכָל לְבָבְךָ וּבְכָל נַפְשְׁךָ",
        tr: "b'chol l'vav'cha uv'chol nafsh'cha",
        en: "with all your heart and with all your soul",
      },
      {
        he: "וּבְכָל מְאֹדֶךָ.",
        tr: "uv'chol m'odecha.",
        en: "and with all your might.",
      },
      {
        he: "וְהָיוּ הַדְּבָרִים הָאֵלֶּה",
        tr: "V'hayu had'varim ha'eleh",
        en: "And these words",
      },
      {
        he: "אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל לְבָבֶךָ.",
        tr: "asher anochi m'tzav'cha hayom al l'vavecha.",
        en: "that I command you today shall be upon your heart.",
      },
    ],
  },

  {
    id: "barchu",
    title: "Barchu",
    subtitle: "The call to worship that opens the service.",
    lines: [
      {
        he: "בָּרְכוּ אֶת יְיָ הַמְבֹרָךְ.",
        tr: "Bar'chu et Adonai ham'vorach.",
        en: "Bless the Lord who is to be blessed. (leader)",
      },
      {
        he: "בָּרוּךְ יְיָ הַמְבֹרָךְ לְעוֹלָם וָעֶד.",
        tr: "Baruch Adonai ham'vorach l'olam va'ed.",
        en: "Blessed is the Lord who is blessed forever and ever. (congregation)",
      },
    ],
  },

  {
    id: "ashrei",
    title: "Ashrei",
    subtitle: "Opening lines of a beloved psalm of praise.",
    note: "Just the opening lines are included here. The full Ashrei continues through the alphabet — check it with a parent or teacher.",
    lines: [
      {
        he: "אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ,",
        tr: "Ashrei yoshvei veitecha,",
        en: "Happy are those who dwell in Your house;",
      },
      {
        he: "עוֹד יְהַלְלוּךָ סֶּלָה.",
        tr: "od y'hal'lucha selah.",
        en: "they will praise You forever.",
      },
      {
        he: "אַשְׁרֵי הָעָם שֶׁכָּכָה לּוֹ,",
        tr: "Ashrei ha'am shekachah lo,",
        en: "Happy is the people for whom this is so;",
      },
      {
        he: "אַשְׁרֵי הָעָם שֶׁיְיָ אֱלֹהָיו.",
        tr: "ashrei ha'am she'Adonai Elohav.",
        en: "happy is the people whose God is the Lord.",
      },
    ],
  },

  {
    id: "adon-olam",
    title: "Adon Olam",
    subtitle: "A joyful closing hymn — opening verse.",
    note: "These are the opening verses of the hymn. The song continues — check the rest with a parent or teacher.",
    lines: [
      {
        he: "אֲדוֹן עוֹלָם אֲשֶׁר מָלַךְ,",
        tr: "Adon olam asher malach,",
        en: "Lord of the world, who reigned",
      },
      {
        he: "בְּטֶרֶם כָּל יְצִיר נִבְרָא.",
        tr: "b'terem kol y'tzir nivra.",
        en: "before any creature was created.",
      },
      {
        he: "לְעֵת נַעֲשָׂה בְחֶפְצוֹ כֹּל,",
        tr: "L'et na'asah v'cheftzo kol,",
        en: "When all was made by His will,",
      },
      {
        he: "אֲזַי מֶלֶךְ שְׁמוֹ נִקְרָא.",
        tr: "azai melech sh'mo nikra.",
        en: "then His name was called King.",
      },
    ],
  },

  {
    id: "aleinu",
    title: "Aleinu",
    subtitle: "Opening lines of the closing prayer of every service.",
    note: "Just the opening lines are included here. The Aleinu continues — check the rest with a parent or teacher.",
    lines: [
      {
        he: "עָלֵינוּ לְשַׁבֵּחַ לַאֲדוֹן הַכֹּל,",
        tr: "Aleinu l'shabei'ach la'Adon hakol,",
        en: "It is our duty to praise the Master of all,",
      },
      {
        he: "לָתֵת גְּדֻלָּה לְיוֹצֵר בְּרֵאשִׁית.",
        tr: "latet g'dulah l'yotzer b'reishit.",
        en: "to give greatness to the One who formed creation.",
      },
    ],
  },

  {
    id: "hamotzi",
    title: "HaMotzi (Bread)",
    subtitle: "Blessing said before eating bread.",
    lines: [
      {
        he: "בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם,",
        tr: "Baruch atah Adonai Eloheinu melech ha'olam,",
        en: "Blessed are You, Lord our God, King of the universe,",
      },
      {
        he: "הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ.",
        tr: "hamotzi lechem min ha'aretz.",
        en: "who brings forth bread from the earth.",
      },
    ],
  },

  {
    id: "candles",
    title: "Shabbat Candles",
    subtitle: "Blessing said when lighting the Shabbat candles.",
    lines: [
      {
        he: "בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם,",
        tr: "Baruch atah Adonai Eloheinu melech ha'olam,",
        en: "Blessed are You, Lord our God, King of the universe,",
      },
      {
        he: "אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו",
        tr: "asher kid'shanu b'mitzvotav",
        en: "who has made us holy through His commandments",
      },
      {
        he: "וְצִוָּנוּ לְהַדְלִיק נֵר שֶׁל שַׁבָּת.",
        tr: "v'tzivanu l'hadlik ner shel Shabbat.",
        en: "and commanded us to kindle the light of Shabbat.",
      },
    ],
  },

  {
    id: "kiddush",
    title: "Kiddush (Wine)",
    subtitle: "Opening blessing over wine for Shabbat.",
    note: "This is the short blessing over the wine. The full Friday-night Kiddush is longer — check it with a parent or teacher.",
    lines: [
      {
        he: "בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם,",
        tr: "Baruch atah Adonai Eloheinu melech ha'olam,",
        en: "Blessed are You, Lord our God, King of the universe,",
      },
      {
        he: "בּוֹרֵא פְּרִי הַגָּפֶן.",
        tr: "borei p'ri hagafen.",
        en: "who creates the fruit of the vine.",
      },
    ],
  },

  {
    id: "shehecheyanu",
    title: "Shehecheyanu",
    subtitle: "Blessing of thanks for reaching a special moment.",
    lines: [
      {
        he: "בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם,",
        tr: "Baruch atah Adonai Eloheinu melech ha'olam,",
        en: "Blessed are You, Lord our God, King of the universe,",
      },
      {
        he: "שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ",
        tr: "shehecheyanu v'kiy'manu",
        en: "who has kept us alive and sustained us",
      },
      {
        he: "וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.",
        tr: "v'higi'anu laz'man hazeh.",
        en: "and brought us to this season.",
      },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = PRAYERS;
}
