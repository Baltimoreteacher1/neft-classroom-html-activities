/* English 10 — Summer Module: Poetry & Figurative Language
   Student entering 10th grade, Pikesville High School (MD).
   All poems are public domain (pre-1928). Lineation preserved.
   Standalone browser JS — no imports. Sets window.ENG.poetry. */

window.ENG = window.ENG || {};

window.ENG.poetry = {
  title: "Poetry & Figurative Language",
  icon: "🪶",
  intro:
    "Poems make meaning through more than the literal words: their shape on the page (form), the music of their sound (rhyme and meter), and figurative language such as metaphor and symbolism. As you read, slow down, notice who is speaking and how they feel, and ask what larger idea — the theme — the poem leaves you with.",
  passages: [
    {
      id: "po-1",
      title: "The Road Not Taken",
      source: "Robert Frost (1916)",
      genre: "Poetry",
      minutes: 15,
      text:
        "<p>Two roads diverged in a yellow wood,<br>" +
        "And sorry I could not travel both<br>" +
        "And be one traveler, long I stood<br>" +
        "And looked down one as far as I could<br>" +
        "To where it bent in the undergrowth;</p>" +
        "<p>Then took the other, as just as fair,<br>" +
        "And having perhaps the better claim,<br>" +
        "Because it was grassy and wanted wear;<br>" +
        "Though as for that the passing there<br>" +
        "Had worn them really about the same,</p>" +
        "<p>And both that morning equally lay<br>" +
        "In leaves no step had trodden black.<br>" +
        "Oh, I kept the first for another day!<br>" +
        "Yet knowing how way leads on to way,<br>" +
        "I doubted if I should ever come back.</p>" +
        "<p>I shall be telling this with a sigh<br>" +
        "Somewhere ages and ages hence:<br>" +
        "Two roads diverged in a wood, and I—<br>" +
        "I took the one less traveled by,<br>" +
        "And that has made all the difference.</p>",
      focus: "Symbolism, rhyme scheme & theme",
      questions: [
        {
          stem: "In this poem, the two diverging roads most clearly function as a symbol for —",
          options: [
            { key: "A", text: "the changing of the seasons in a forest" },
            { key: "B", text: "a choice between two directions in life" },
            { key: "C", text: "the danger of traveling alone in the woods" },
            { key: "D", text: "the difficulty of finding one's way home" },
          ],
          answer: "B",
          rationale:
            "The forked path is a symbol: the speaker must choose between two life directions and cannot take both ('sorry I could not travel both / And be one traveler').",
        },
        {
          stem: "Each five-line stanza of the poem follows the rhyme scheme —",
          options: [
            { key: "A", text: "ABAAB" },
            { key: "B", text: "AABBA" },
            { key: "C", text: "ABABC" },
            { key: "D", text: "AAABB" },
          ],
          answer: "A",
          rationale:
            "In every stanza, lines 1, 3, and 4 rhyme (wood / stood / could) and lines 2 and 5 rhyme (both / undergrowth), giving the pattern ABAAB.",
        },
        {
          stem: "Read these lines:<br><em>Because it was grassy and wanted wear;</em><br>The phrase 'wanted wear' is an example of —",
          options: [
            { key: "A", text: "a simile comparing the road to grass" },
            { key: "B", text: "personification of the road" },
            { key: "C", text: "hyperbole, or extreme exaggeration" },
            { key: "D", text: "onomatopoeia imitating a sound" },
          ],
          answer: "B",
          rationale:
            "Saying the road 'wanted wear' gives the road a human desire, which is personification. It is not a comparison using like/as (simile) or an imitation of sound.",
        },
        {
          stem: "The phrase 'I shall be telling this with a sigh' suggests that the speaker's later tone will be —",
          options: [
            { key: "A", text: "joyful and triumphant" },
            { key: "B", text: "angry and bitter" },
            { key: "C", text: "wistful and reflective" },
            { key: "D", text: "frightened and panicked" },
          ],
          answer: "C",
          rationale:
            "A 'sigh' told 'ages and ages hence' signals a wistful, reflective tone as the speaker looks back on a long-ago choice, not joy, anger, or fear.",
        },
        {
          stem: "Which statement best expresses a central theme of the poem?",
          options: [
            {
              key: "A",
              text: "The choices we make shape the course of our lives.",
            },
            {
              key: "B",
              text: "Nature is more beautiful in autumn than in spring.",
            },
            {
              key: "C",
              text: "It is always wisest to follow the popular path.",
            },
            { key: "D", text: "Friends are needed to help us find our way." },
          ],
          answer: "A",
          rationale:
            "The poem reflects on how a single decision ('I took the one less traveled by') comes to define a life — 'that has made all the difference' — which is the central theme about choice.",
        },
      ],
    },
    {
      id: "po-2",
      title: "We Wear the Mask",
      source: "Paul Laurence Dunbar (1895)",
      genre: "Poetry",
      minutes: 15,
      text:
        "<p>We wear the mask that grins and lies,<br>" +
        "It hides our cheeks and shades our eyes,—<br>" +
        "This debt we pay to human guile;<br>" +
        "With torn and bleeding hearts we smile,<br>" +
        "And mouth with myriad subtleties.</p>" +
        "<p>Why should the world be over-wise,<br>" +
        "In counting all our tears and sighs?<br>" +
        "Nay, let them only see us, while<br>" +
        "&nbsp;&nbsp;&nbsp;&nbsp;We wear the mask.</p>" +
        "<p>We smile, but, O great Christ, our cries<br>" +
        "To thee from tortured souls arise.<br>" +
        "We sing, but oh the clay is vile<br>" +
        "Beneath our feet, and long the mile;<br>" +
        "But let the world dream otherwise,<br>" +
        "&nbsp;&nbsp;&nbsp;&nbsp;We wear the mask!</p>",
      focus: "Extended metaphor, refrain & theme",
      questions: [
        {
          stem: "Throughout the poem, 'the mask' is an extended metaphor for —",
          options: [
            { key: "A", text: "a costume worn at a festival or party" },
            {
              key: "B",
              text: "a false, smiling face that hides real suffering",
            },
            { key: "C", text: "the physical face that everyone is born with" },
            { key: "D", text: "a disguise used to commit a crime" },
          ],
          answer: "B",
          rationale:
            "The mask 'grins and lies' while the speakers have 'torn and bleeding hearts' — it is a metaphor for the cheerful front people put on to conceal their pain.",
        },
        {
          stem: "The repeated line 'We wear the mask' is best described as the poem's —",
          options: [
            { key: "A", text: "refrain" },
            { key: "B", text: "simile" },
            { key: "C", text: "couplet" },
            { key: "D", text: "stanza" },
          ],
          answer: "A",
          rationale:
            "A line repeated at intervals throughout a poem is a refrain. 'We wear the mask' recurs and ends the poem, reinforcing its theme.",
        },
        {
          stem: "Read these lines:<br><em>With torn and bleeding hearts we smile,</em><br>The image of 'torn and bleeding hearts' beside a smile creates —",
          options: [
            { key: "A", text: "alliteration of harsh consonants" },
            {
              key: "B",
              text: "a contrast between hidden pain and an outward smile",
            },
            { key: "C", text: "a literal description of a physical injury" },
            { key: "D", text: "a peaceful and contented mood" },
          ],
          answer: "B",
          rationale:
            "Placing 'torn and bleeding hearts' next to 'we smile' contrasts inner suffering with an outward appearance of cheerfulness; the hearts are figurative, not literally wounded.",
        },
        {
          stem: "The overall tone of the poem can best be described as —",
          options: [
            { key: "A", text: "playful and lighthearted" },
            { key: "B", text: "sorrowful and weary" },
            { key: "C", text: "proud and boastful" },
            { key: "D", text: "calm and indifferent" },
          ],
          answer: "B",
          rationale:
            "Words like 'tears,' 'sighs,' 'tortured souls,' and 'long the mile' create a sorrowful, weary tone of concealed grief, not playfulness or pride.",
        },
        {
          stem: "Which statement best states the theme of the poem?",
          options: [
            {
              key: "A",
              text: "People should always hide their feelings from others.",
            },
            {
              key: "B",
              text: "Oppressed people often hide deep pain behind a forced smile.",
            },
            {
              key: "C",
              text: "Wearing masks is a fun tradition worth celebrating.",
            },
            {
              key: "D",
              text: "Honesty is the easiest path in every situation.",
            },
          ],
          answer: "B",
          rationale:
            "Dunbar's poem exposes how those who suffer present a false, smiling 'mask' to a world that does not see their hidden anguish — a theme of concealed suffering, not approval of hiding feelings.",
        },
      ],
    },
    {
      id: "po-3",
      title: "“Hope” is the thing with feathers",
      source: "Emily Dickinson (c. 1891)",
      genre: "Poetry",
      minutes: 15,
      text:
        "<p>&ldquo;Hope&rdquo; is the thing with feathers—<br>" +
        "That perches in the soul—<br>" +
        "And sings the tune without the words—<br>" +
        "And never stops—at all—</p>" +
        "<p>And sweetest—in the Gale—is heard—<br>" +
        "And sore must be the storm—<br>" +
        "That could abash the little Bird<br>" +
        "That kept so many warm—</p>" +
        "<p>I&rsquo;ve heard it in the chillest land—<br>" +
        "And on the strangest Sea—<br>" +
        "Yet—never—in Extremity,<br>" +
        "It asked a crumb—of me.</p>",
      focus: "Extended metaphor, meter & theme",
      questions: [
        {
          stem: "The 'thing with feathers' that 'perches in the soul' is an extended metaphor comparing hope to —",
          options: [
            { key: "A", text: "a singing bird" },
            { key: "B", text: "a fierce storm" },
            { key: "C", text: "a cold ocean" },
            { key: "D", text: "a warm blanket" },
          ],
          answer: "A",
          rationale:
            "Feathers, perching, and singing 'the tune without the words' all describe a bird; Dickinson sustains this comparison so hope is metaphorically a bird that sings within the soul.",
        },
        {
          stem: "In the lines 'sweetest—in the Gale—is heard' and 'sore must be the storm,' the 'Gale' and 'storm' are symbols for —",
          options: [
            { key: "A", text: "ordinary weather with no deeper meaning" },
            { key: "B", text: "life's hardships and times of trouble" },
            { key: "C", text: "the bird's natural habitat at sea" },
            { key: "D", text: "the passing of time and old age" },
          ],
          answer: "B",
          rationale:
            "The 'Gale' and 'storm' symbolize difficult, troubled times — and hope sings 'sweetest' precisely then, showing it endures through hardship.",
        },
        {
          stem: "The poem's meter alternates mainly between lines of iambic tetrameter (four beats) and iambic —",
          options: [
            { key: "A", text: "monometer (one beat)" },
            { key: "B", text: "dimeter (two beats)" },
            { key: "C", text: "trimeter (three beats)" },
            { key: "D", text: "pentameter (five beats)" },
          ],
          answer: "C",
          rationale:
            "Dickinson uses a common-meter pattern: longer lines of four iambic feet (tetrameter) alternate with shorter lines of three iambic feet (trimeter), as in 'That perches in the soul.'",
        },
        {
          stem: "Across the whole poem, the mood toward hope is best described as —",
          options: [
            { key: "A", text: "hopeless and despairing" },
            { key: "B", text: "comforting and reassuring" },
            { key: "C", text: "mocking and sarcastic" },
            { key: "D", text: "tense and fearful" },
          ],
          answer: "B",
          rationale:
            "Hope sings, 'never stops,' keeps people 'warm,' and asks nothing in return, creating a comforting, reassuring mood despite the storms it weathers.",
        },
        {
          stem: "Which statement best expresses a central theme of the poem?",
          options: [
            {
              key: "A",
              text: "Hope endures even in the hardest times and asks nothing in return.",
            },
            {
              key: "B",
              text: "Birds are the most graceful creatures in nature.",
            },
            {
              key: "C",
              text: "Sailing across strange seas is dangerous and frightening.",
            },
            { key: "D", text: "Music is more powerful than spoken words." },
          ],
          answer: "A",
          rationale:
            "The poem celebrates hope as a constant inner presence that sings through every 'Gale' and 'Extremity' and 'never...asked a crumb' — its theme is hope's free, enduring resilience.",
        },
      ],
    },
  ],
};
