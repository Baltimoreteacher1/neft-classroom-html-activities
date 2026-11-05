// Items for Evidence Builder (/scaffold/evidence-builder): original EduWonderLab content, one per Key
// Language Use per band. Every card that does not support the claim says why; `answer` is never rendered.
const e = (id, band, use, topic, claim, cards, connectors, need, ordered, hint) => ({
  id,
  tool: "evidence-builder",
  band,
  use,
  topic,
  claim,
  prompt: "Choose the cards that support the claim, put them in order, and pick a connector.",
  target: ordered
    ? "Support a claim about a story with events told in order."
    : "Support a claim with relevant evidence only.",
  cards,
  connectors,
  need,
  ordered,
  hint,
  answer: {
    cards: cards
      .filter((c) => c.supports)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, need)
      .map((c) => c.id),
    connector: connectors[0],
  },
});
const yes = (id, text, order = 0) => ({ id, text, supports: true, ...(order ? { order } : {}) });
const no = (id, text, why) => ({ id, text, supports: false, why });

export const EVIDENCE_ITEMS = Object.freeze([
  e(
    "eb35-argue-recess",
    "3-5",
    "Argue",
    "School day",
    "Our school should have a longer recess.",
    [
      yes("a", "Students who play outside pay better attention in class afterward."),
      yes("b", "Recess gives kids time to exercise, which keeps their bodies healthy."),
      no(
        "x",
        "The playground has a red slide.",
        "It describes the playground but gives no reason for more recess.",
      ),
      no(
        "y",
        "Lunch starts at 11:30.",
        "It is a fact about the schedule, not a reason for the claim.",
      ),
    ],
    ["The evidence shows that", "For example,"],
    2,
    false,
    "Read the claim again. Which cards give a reason for MORE recess?",
  ),
  e(
    "eb35-explain-plants",
    "3-5",
    "Explain",
    "Plant science",
    "Plants need sunlight to grow well.",
    [
      yes("a", "The plant kept in a dark closet turned yellow and weak."),
      yes("b", "The plant on the sunny windowsill grew tall and green."),
      no(
        "x",
        "Plants come in many colors.",
        "It is about color, not about sunlight helping plants grow.",
      ),
      no("y", "My grandma has a garden.", "It is about a person, not about what plants need."),
    ],
    ["The evidence shows that", "For example,"],
    2,
    false,
    "Which cards show what happened to plants with and without light?",
  ),
  e(
    "eb35-inform-owls",
    "3-5",
    "Inform",
    "Animals",
    "Owls are skilled night hunters.",
    [
      yes("a", "Owls have large eyes that see well in the dark."),
      yes("b", "Owls can hear a mouse moving under leaves."),
      no("x", "Owls appear in many old stories.", "It is about stories, not about how owls hunt."),
      no(
        "y",
        "Some owls sleep in barns during the day.",
        "It tells where owls rest, not how they hunt at night.",
      ),
    ],
    ["For example,", "The evidence shows that"],
    2,
    false,
    "Which cards tell about an owl's body helping it hunt at night?",
  ),
  e(
    "eb35-narrate-bike",
    "3-5",
    "Narrate",
    "Learning something new",
    "Sam learned to ride a bike after many tries.",
    [
      yes("a", "First, Sam fell off the bike twice.", 1),
      yes("b", "Next, his sister held the seat while he pedaled.", 2),
      yes("c", "Finally, Sam rode to the end of the street by himself.", 3),
      no("x", "Sam's bike is blue.", "It describes the bike but does not show Sam learning."),
    ],
    ["For example,", "The evidence shows that"],
    3,
    true,
    "Which events show Sam trying again and again? What happened first?",
  ),
  e(
    "eb68-argue-bikelane",
    "6-8",
    "Argue",
    "City planning",
    "The city should add a protected bike lane on Main Street.",
    [
      yes(
        "a",
        "Last year, 40 bike crashes happened on Main Street, more than on any other road in town.",
      ),
      yes(
        "b",
        "In a survey, 300 students said they would bike to school if the street were safer.",
      ),
      no(
        "x",
        "Main Street was named after the town's first road in 1850.",
        "It is a history fact; it gives no reason for a bike lane.",
      ),
      no(
        "y",
        "Some bicycles have twenty-one gears.",
        "It is about bicycles in general, not about Main Street's safety.",
      ),
    ],
    ["The evidence shows that", "For example,"],
    2,
    false,
    "Which cards give a reason that connects to safety on Main Street?",
  ),
  e(
    "eb68-explain-ice",
    "6-8",
    "Explain",
    "Climate data",
    "Warmer winters are causing the lake ice to melt earlier each spring.",
    [
      yes(
        "a",
        "Town records show the average winter temperature rose by 2 °C over the past 30 years.",
      ),
      yes("b", "In 1995 the lake ice melted in late April; this year it melted in early March."),
      no(
        "x",
        "Ice skating is a popular winter sport.",
        "It is about a sport, not about why the ice melts earlier.",
      ),
      no(
        "y",
        "The lake is home to twelve kinds of fish.",
        "It describes the lake but says nothing about temperature or melting.",
      ),
    ],
    ["The evidence shows that", "For example,"],
    2,
    false,
    "Which cards give data about temperature or the date the ice melts?",
  ),
  e(
    "eb68-inform-bees",
    "6-8",
    "Inform",
    "Ecosystems",
    "Honeybees play an important role in growing food.",
    [
      yes("a", "Bees carry pollen between flowers, which helps many plants produce fruit."),
      yes("b", "Crops such as almonds and apples depend on pollinators like honeybees."),
      no(
        "x",
        "Some people are afraid of bees.",
        "It tells how people feel, not how bees help grow food.",
      ),
      no("y", "A honeybee has five eyes.", "It is a true bee fact, but it is not about food."),
    ],
    ["For example,", "The evidence shows that"],
    2,
    false,
    "Which cards connect what bees do to the food people eat?",
  ),
  e(
    "eb68-narrate-fair",
    "6-8",
    "Narrate",
    "Science fair",
    "During the science fair, Amara learned to stay calm under pressure.",
    [
      yes("a", "When the judges arrived, Amara's hands were shaking.", 1),
      yes("b", "Her model volcano failed to erupt on the first try.", 2),
      yes(
        "c",
        "She took a slow breath, checked the tubes, and fixed the leak before the second demonstration.",
        3,
      ),
      no(
        "x",
        "The gym smelled like popcorn.",
        "It is a setting detail; it does not show Amara changing.",
      ),
    ],
    ["For example,", "The evidence shows that"],
    3,
    true,
    "Which events show Amara moving from nervous to calm? Which came first?",
  ),
]);
