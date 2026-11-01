// Spell Duel content (inspired by quest-and-battle math games): spells, zones and creatures, pets, and daily quests.
// Plain data so the rules in duel-core.js and the Spanish table can be checked against it.
export const SPELLS = [
  { id: "spark", name: "Spark", icon: "⚡" },
  { id: "frost", name: "Frost", icon: "❄️" },
  { id: "leaf", name: "Leaf", icon: "🍃" },
  { id: "tide", name: "Tide", icon: "🌊" },
];

// Creatures calm down when their energy reaches 0; nothing is hurt and the wizard never loses anything.
// `weak` is the spell that does one extra point; `energy` is before the zone and calm-mode adjustments.
export const ZONES = [
  {
    id: "meadow",
    name: "Sunny Meadow",
    icon: "🌼",
    creatures: [
      { id: "grub", name: "Fuzzy Grub", icon: "🐛", energy: 3, weak: "leaf" },
      { id: "frog", name: "Puddle Frog", icon: "🐸", energy: 3, weak: "spark" },
      { id: "bee", name: "Buzzy Bee", icon: "🐝", energy: 4, weak: "frost" },
      { id: "owl", name: "Wise Owl", icon: "🦉", energy: 6, weak: "tide", boss: true },
    ],
  },
  {
    id: "peak",
    name: "Frosty Peak",
    icon: "🏔️",
    creatures: [
      { id: "penguin", name: "Slide Penguin", icon: "🐧", energy: 3, weak: "spark" },
      { id: "yeti", name: "Snowball Yeti", icon: "⛄", energy: 4, weak: "leaf" },
      { id: "fox", name: "Frost Fox", icon: "🦊", energy: 4, weak: "tide" },
      { id: "mammoth", name: "Great Mammoth", icon: "🦣", energy: 6, weak: "spark", boss: true },
    ],
  },
  {
    id: "cove",
    name: "Tide Cove",
    icon: "🏝️",
    creatures: [
      { id: "crab", name: "Sidestep Crab", icon: "🦀", energy: 3, weak: "frost" },
      { id: "turtle", name: "Sleepy Turtle", icon: "🐢", energy: 4, weak: "spark" },
      { id: "octopus", name: "Inky Octopus", icon: "🐙", energy: 4, weak: "leaf" },
      { id: "whale", name: "Singing Whale", icon: "🐳", energy: 6, weak: "frost", boss: true },
    ],
  },
  {
    id: "keep",
    name: "Starlit Keep",
    icon: "🏰",
    creatures: [
      { id: "bat", name: "Twinkle Bat", icon: "🦇", energy: 3, weak: "tide" },
      { id: "ghost", name: "Giggle Ghost", icon: "👻", energy: 4, weak: "leaf" },
      { id: "golem", name: "Puzzle Golem", icon: "🗿", energy: 5, weak: "tide" },
      { id: "dragon", name: "Dream Dragon", icon: "🐉", energy: 7, weak: "leaf", boss: true },
    ],
  },
];

// Eggs hatch in this order (no luck involved). XP comes from correct answers while a pet is the companion.
export const PETS = [
  { id: "pip", name: "Pip", icons: ["🐣", "🐥", "🦚"] },
  { id: "bun", name: "Bun", icons: ["🐰", "🐇", "🦄"] },
  { id: "pebble", name: "Pebble", icons: ["🥚", "🐢", "🐊"] },
  { id: "ember", name: "Ember", icons: ["🔥", "🦎", "🐲"] },
  { id: "nimbus", name: "Nimbus", icons: ["☁️", "🐑", "🦙"] },
  { id: "comet", name: "Comet", icons: ["✨", "🐱", "🦁"] },
];
export const PET_STAGES = ["Baby", "Grown", "Champion"];
export const PET_XP_LEVELS = [0, 12, 40];
export const EGG_COST = 25;

// Three quests a day come from this table. `key` names the day-counter in the duel record.
export const QUESTS = [
  { id: "wins-2", name: "Calm 2 creatures", key: "wins", goal: 2, gold: 10 },
  { id: "first-8", name: "Get 8 answers right on the first try", key: "first", goal: 8, gold: 10 },
  { id: "right-15", name: "Cast 15 spells that land", key: "right", goal: 15, gold: 12 },
  { id: "spells-4", name: "Cast all 4 spells", key: "spells", goal: 4, gold: 8 },
  { id: "run-4", name: "Get 4 first-try answers in a row", key: "run", goal: 4, gold: 10 },
  { id: "pet-6", name: "Train your pet with 6 right answers", key: "petXp", goal: 6, gold: 8 },
];
