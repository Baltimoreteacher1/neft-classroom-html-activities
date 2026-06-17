/* fiction.js — Module 1 content: Fiction & Literary Analysis.
   Public-domain excerpts. Sets window.ENG.fiction and window.ENG.devices. */
window.ENG = window.ENG || {};

window.ENG.fiction = {
  title: "Fiction & Literary Analysis",
  icon: "📖",
  intro:
    "Read closely to track how authors build character, tone, and meaning. You will analyze craft — diction, point of view, and conflict — the way you will in English 10.",
  passages: [
    {
      id: "fic-1",
      title: "Excerpt: The Call of the Wild",
      source: "Jack London, The Call of the Wild (1903)",
      genre: "Fiction",
      focus: "Characterization, tone & dramatic irony",
      minutes: 18,
      text:
        "<p>Buck did not read the newspapers, or he would have known that trouble was <mark title='developing; building'>brewing</mark>, not alone for himself, but for every tide-water dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego. Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland. These men wanted dogs, and the dogs they wanted were heavy dogs, with strong muscles by which to toil, and furry coats to protect them from the frost.</p>" +
        "<p>Buck lived at a big house in the sun-kissed Santa Clara Valley. Judge Miller's place, it was called. It stood back from the road, half hidden among the trees, through which glimpses could be caught of the wide cool veranda that ran around its four sides. And over this great <mark title='estate; landholding'>demesne</mark> Buck ruled. Here he was born, and here he had lived the four years of his life. It was true, there were other dogs. There could not but be other dogs on so vast a place, but they did not count.</p>" +
        "<p>Buck was neither house-dog nor kennel-dog. The whole realm was his. He plunged into the swimming tank or went hunting with the Judge's sons; he escorted the Judge's daughters on long twilight or early morning rambles. And this was the manner of dog Buck was in the fall of 1897, when the Klondike strike dragged men from all the world into the frozen North. But Buck did not read the newspapers, and he did not know.</p>",
      questions: [
        {
          stem: "The repeated line 'Buck did not read the newspapers' primarily creates a sense of:",
          options: [
            { key: "A", text: "comedy, because dogs cannot read" },
            {
              key: "B",
              text: "dramatic irony, because the reader senses danger Buck cannot",
            },
            {
              key: "C",
              text: "suspense about whether the newspapers are accurate",
            },
            { key: "D", text: "nostalgia for Buck's peaceful past" },
          ],
          answer: "B",
          rationale:
            "The reader knows trouble is 'brewing' for strong dogs while Buck does not — a gap in awareness between reader and character, which is dramatic irony.",
        },
        {
          stem: "The phrase 'a yellow metal' instead of naming gold most directly reflects:",
          options: [
            { key: "A", text: "Buck's limited, animal point of view" },
            { key: "B", text: "the narrator's confusion about the discovery" },
            { key: "C", text: "a scientific, technical tone" },
            { key: "D", text: "a flashback to an earlier era" },
          ],
          answer: "A",
          rationale:
            "Filtering the gold rush through Buck's perspective, the gold is reduced to 'a yellow metal' he cannot understand, reinforcing the limited animal point of view.",
        },
        {
          stem: "The description of Judge Miller's place as a 'great demesne' that Buck 'ruled' chiefly establishes that Buck is:",
          options: [
            { key: "A", text: "neglected and lonely" },
            { key: "B", text: "secure, dominant, and privileged" },
            { key: "C", text: "wild and untamed" },
            { key: "D", text: "weak compared with the other dogs" },
          ],
          answer: "B",
          rationale:
            "Words like 'ruled,' 'realm,' and 'the whole realm was his' present Buck as a privileged, dominant figure in a secure world — a status the coming plot will overturn.",
        },
        {
          stem: "How does the contrast between the 'sun-kissed Santa Clara Valley' and the 'Arctic darkness' function in the passage?",
          options: [
            {
              key: "A",
              text: "It shows the narrator cannot decide on a setting",
            },
            {
              key: "B",
              text: "It foreshadows a violent change from comfort to harsh struggle",
            },
            {
              key: "C",
              text: "It proves the two places are equally dangerous",
            },
            { key: "D", text: "It emphasizes that Buck prefers cold weather" },
          ],
          answer: "B",
          rationale:
            "The warm, secure South is juxtaposed with the cold, dangerous North, foreshadowing the brutal transformation Buck will undergo.",
        },
        {
          stem: "Which word best describes the overall TONE of the opening paragraph?",
          options: [
            { key: "A", text: "Lighthearted" },
            { key: "B", text: "Indifferent" },
            { key: "C", text: "Ominous" },
            { key: "D", text: "Sentimental" },
          ],
          answer: "C",
          rationale:
            "Diction such as 'trouble was brewing,' 'groping in the Arctic darkness,' and 'frost' creates a threatening, ominous tone beneath the calm surface.",
        },
      ],
    },
    {
      id: "fic-2",
      title: "Excerpt: The Tell-Tale Heart",
      source: "Edgar Allan Poe, The Tell-Tale Heart (1843)",
      genre: "Fiction",
      focus: "Unreliable narrator, point of view & mood",
      minutes: 16,
      text:
        "<p>True! — nervous — very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses — not destroyed — not dulled them. Above all was the sense of hearing <mark title='sharp; intense'>acute</mark>. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily — how calmly I can tell you the whole story.</p>" +
        "<p>It is impossible to say how first the idea entered my brain; but once conceived, it haunted me day and night. Object there was none. Passion there was none. I loved the old man. He had never wronged me. He had never given me insult. For his gold I had no desire. I think it was his eye! yes, it was this! He had the eye of a vulture — a pale blue eye, with a film over it. Whenever it fell upon me, my blood ran cold; and so by degrees — very gradually — I made up my mind to take the life of the old man, and thus rid myself of the eye forever.</p>" +
        "<p>Now this is the point. You fancy me mad. Madmen know nothing. But you should have seen me. You should have seen how wisely I proceeded — with what caution — with what foresight — with what <mark title='pretense; disguise'>dissimulation</mark> I went to work!</p>",
      questions: [
        {
          stem: "The narrator's insistence 'why will you say that I am mad?' most strongly suggests that he is:",
          options: [
            { key: "A", text: "a trustworthy, reliable witness" },
            {
              key: "B",
              text: "an unreliable narrator whose judgment we should doubt",
            },
            { key: "C", text: "a doctor describing a patient" },
            { key: "D", text: "speaking calmly and rationally" },
          ],
          answer: "B",
          rationale:
            "His desperate protests of sanity, combined with his irrational fixation, signal an unreliable narrator — the reader cannot trust his account.",
        },
        {
          stem: "The narrator claims the 'disease had sharpened my senses.' This detail mainly works to:",
          options: [
            { key: "A", text: "prove he is medically healthy" },
            { key: "B", text: "explain the old man's illness" },
            { key: "C", text: "reveal his distorted, obsessive perception" },
            { key: "D", text: "lighten the mood with humor" },
          ],
          answer: "C",
          rationale:
            "Treating a 'disease' as a gift that 'sharpened' his senses exposes his distorted reasoning and obsessive state of mind.",
        },
        {
          stem: "Comparing the old man's eye to 'the eye of a vulture' is an example of:",
          options: [
            {
              key: "A",
              text: "a simile that makes the eye seem predatory and threatening",
            },
            { key: "B", text: "a metaphor that calls the man a literal bird" },
            { key: "C", text: "personification of the eye" },
            { key: "D", text: "hyperbole about the man's wealth" },
          ],
          answer: "A",
          rationale:
            "The comparison uses 'the eye of a vulture' (an implied 'like/as' comparison) to make the eye seem predatory — and the narrator's terror of it irrational.",
        },
        {
          stem: "The narrator repeatedly admits he 'loved the old man' and had 'no desire' for his gold in order to:",
          options: [
            { key: "A", text: "prove the murder was justified" },
            {
              key: "B",
              text: "emphasize how irrational and motiveless his fixation is",
            },
            { key: "C", text: "show he is a generous person" },
            { key: "D", text: "introduce a second character's point of view" },
          ],
          answer: "B",
          rationale:
            "By removing every rational motive, Poe highlights that the obsession with the 'eye' is irrational — deepening the sense of madness.",
        },
        {
          stem: "The mood of the passage is best described as:",
          options: [
            { key: "A", text: "peaceful and reassuring" },
            { key: "B", text: "tense and unsettling" },
            { key: "C", text: "playful and ironic" },
            { key: "D", text: "formal and detached" },
          ],
          answer: "B",
          rationale:
            "Frantic dashes, exclamations, and the confession of a planned killing create a tense, unsettling mood that pulls the reader into the narrator's disturbed mind.",
        },
      ],
    },
    {
      id: "fic-3",
      title: "Excerpt: Pride and Prejudice",
      source: "Jane Austen, Pride and Prejudice (1813)",
      genre: "Fiction",
      focus: "Verbal irony, satire & characterization through dialogue",
      minutes: 16,
      text:
        "<p>It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.</p>" +
        "<p>However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.</p>" +
        '<p>"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"</p>' +
        "<p>Mr. Bennet replied that he had not.</p>" +
        '<p>"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it." Mr. Bennet made no answer. "Do not you want to know who has taken it?" cried his wife <mark title=\'impatiently; with irritation\'>impatiently</mark>. "You want to tell me, and I have no objection to hearing it." This was invitation enough.</p>',
      questions: [
        {
          stem: "The famous opening sentence is an example of verbal irony because:",
          options: [
            { key: "A", text: "it states the literal truth about wealthy men" },
            {
              key: "B",
              text: "it states the opposite of what the families really pursue — it is the daughters who want the fortune",
            },
            { key: "C", text: "no single man appears in the novel" },
            { key: "D", text: "it is spoken aloud by Mrs. Bennet" },
          ],
          answer: "B",
          rationale:
            "The line claims a rich man 'must be in want of a wife,' but the irony is that it is the neighborhood families who pursue the man for his fortune — the reverse of the stated 'truth.'",
        },
        {
          stem: "The phrase 'the rightful property of some one or other of their daughters' satirizes:",
          options: [
            { key: "A", text: "the wealthy man's generosity" },
            {
              key: "B",
              text: "the marriage market and how it treats people as property",
            },
            { key: "C", text: "Mr. Bennet's laziness" },
            { key: "D", text: "the daughters' lack of education" },
          ],
          answer: "B",
          rationale:
            "Calling a man 'property' to be claimed mocks a society that treats courtship as an economic transaction — the satirical target of the passage.",
        },
        {
          stem: "Mr. Bennet's short, withholding replies ('made no answer') chiefly characterize him as:",
          options: [
            { key: "A", text: "dim-witted and confused" },
            { key: "B", text: "wry and teasing toward his wife" },
            { key: "C", text: "furious and threatening" },
            { key: "D", text: "deeply anxious about money" },
          ],
          answer: "B",
          rationale:
            "His deliberate silences and dry replies tease his eager wife, revealing a wry, ironic temperament through dialogue.",
        },
        {
          stem: "Austen reveals Mrs. Bennet's character mainly through:",
          options: [
            { key: "A", text: "long descriptions of her appearance" },
            { key: "B", text: "her eager, impatient dialogue" },
            { key: "C", text: "a flashback to her childhood" },
            { key: "D", text: "the narrator's direct praise of her wisdom" },
          ],
          answer: "B",
          rationale:
            "Her excited questions and impatience ('cried his wife impatiently') characterize her indirectly through dialogue rather than direct description.",
        },
        {
          stem: "The overall tone of the passage is best described as:",
          options: [
            { key: "A", text: "tragic" },
            { key: "B", text: "satirical and witty" },
            { key: "C", text: "suspenseful and dark" },
            { key: "D", text: "solemn and reverent" },
          ],
          answer: "B",
          rationale:
            "The mock-serious 'universally acknowledged' truth and the teasing dialogue create a satirical, witty tone aimed at social conventions.",
        },
      ],
    },
  ],
};

window.ENG.devices = [
  {
    term: "Metaphor",
    def: "A direct comparison stating one thing IS another, without 'like' or 'as'.",
    example: "Her voice was music to his ears.",
  },
  {
    term: "Simile",
    def: "A comparison of two unlike things using 'like' or 'as'.",
    example: "He was as brave as a lion.",
  },
  {
    term: "Personification",
    def: "Giving human qualities to a non-human thing or idea.",
    example: "The wind whispered through the trees.",
  },
  {
    term: "Hyperbole",
    def: "An extreme, obvious exaggeration used for emphasis.",
    example: "I've told you a million times.",
  },
  {
    term: "Imagery",
    def: "Vivid language that appeals to the five senses.",
    example: "The crisp, golden leaves crunched underfoot.",
  },
  {
    term: "Foreshadowing",
    def: "Hints or clues that suggest what will happen later.",
    example: "Dark clouds gathered before the disaster.",
  },
  {
    term: "Irony",
    def: "A contrast between expectation and reality, or saying the opposite of what is meant.",
    example: "A fire station burns down.",
  },
  {
    term: "Symbolism",
    def: "Using an object or image to represent a larger idea.",
    example: "A dove symbolizes peace.",
  },
  {
    term: "Alliteration",
    def: "Repetition of initial consonant sounds in nearby words.",
    example: "Peter Piper picked a peck of peppers.",
  },
  {
    term: "Onomatopoeia",
    def: "A word that imitates the sound it describes.",
    example: "The bees buzzed and the door creaked.",
  },
  {
    term: "Allusion",
    def: "A reference to a well-known person, place, work, or event.",
    example: "He met his Waterloo.",
  },
  {
    term: "Tone",
    def: "The author's attitude toward the subject, shown through word choice.",
    example: "A sarcastic, mocking word choice creates a bitter tone.",
  },
];
