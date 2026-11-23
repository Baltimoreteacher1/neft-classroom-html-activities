// Vocabulary for "Maryland Regions and the People Who Shaped Them" (grade 4 social studies). Original content.
// Visual text and alt never contain the entry word, so the pictures can be used as picture-word and type-word prompts.
// Every map here is schematic (west on the left, east on the right) and is not drawn to scale.
const practice = (visualPrompt, speakWrite, retrieval) => ({ visualPrompt, speakWrite, retrieval });

export default {
  id: "g4-social-studies-maryland-regions-and-people",
  title: "Words for Maryland's regions and people",
  grade: "4",
  band: "3-5",
  subject: "social-studies",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to C3 D2.Geo.2.3-5 and D2.Geo.4.3-5; not mapped to a district unit sequence.",
  },
  standards: ["D2.Geo.2.3-5", "D2.Geo.4.3-5", "RI.4.3", "L.4.4"],
  entries: [
    {
      id: "region",
      word: "region",
      pos: "noun",
      pron: "REE-jun",
      def: "An area of land that shares features, such as hills, climate or plants, that set it apart from other areas.",
      visual: {
        kind: "shapes",
        alt: "Two outlined areas side by side. One area is filled with sunflowers and the other is filled with houses. Inside each outline the land looks alike.",
        longDesc: "Two dashed outlines. The left outline holds three pine trees and the words Area 1: flowers. The right outline holds three houses and the words Area 2: town.",
        w: 480,
        h: 240,
        items: [
          { t: "rect", x: 15, y: 20, w: 215, h: 190, rx: 10, fill: "sage-soft", stroke: "ink", sw: 3, dash: [9, 6] },
          { t: "icon", name: "sunflower", x: 28, y: 60, s: 62 },
          { t: "icon", name: "sunflower", x: 100, y: 60, s: 62 },
          { t: "icon", name: "sunflower", x: 165, y: 60, s: 62 },
          { t: "text", x: 122, y: 175, text: "Area 1: flowers", size: 18, weight: 700 },
          { t: "rect", x: 250, y: 20, w: 215, h: 190, rx: 10, fill: "copper-soft", stroke: "ink", sw: 3, dash: [9, 6] },
          { t: "icon", name: "house", x: 263, y: 60, s: 62 },
          { t: "icon", name: "house", x: 335, y: 60, s: 62 },
          { t: "icon", name: "house", x: 400, y: 60, s: 62 },
          { t: "text", x: 357, y: 175, text: "Area 2: town", size: 18, weight: 700 },
        ],
      },
      context: "Western Maryland is a region with mountains and forests.",
      nonExample:
        "One street in a town is not a region. A region is a large area with shared features.",
      academicSentence:
        "Geographers divide a state into regions by looking at the land, the climate and the plants.",
      everyday:
        "Your city has a part with tall buildings and a part with parks, and each part feels different.",
      es: {
        word: "región",
        def: "Un área de tierra que comparte rasgos, como colinas, clima o plantas, que la distinguen de otras áreas.",
        verified: true,
      },
      misconception:
        "A region is the same as a state. A state can contain several regions with different land.",
      related: ["landform", "appalachian-mountains", "piedmont", "coastal-plain"],
      practice: practice(
        "Point to each area on the map and say one thing that makes it different from the others.",
        "Tell a partner about a region you know, then write one sentence about its land.",
        "What do we call a large area that shares features that set it apart?",
      ),
      tier: 2,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "landform",
      word: "landform",
      pos: "noun",
      pron: "LAND-form",
      def: "A natural shape on Earth's surface, such as a mountain, a valley or a plain.",
      visual: {
        kind: "shapes",
        alt: "Three simple drawings: a tall pointed mountain, a V-shaped dip between two slopes, and a wide flat stretch of land.",
        longDesc:
          "Three panels from left to right. A tall triangle labeled Mountain. A V-shaped dip between two slopes labeled Valley. A wide flat line with a low rectangle labeled Plain.",
        w: 480,
        h: 240,
        items: [
          {
            t: "poly",
            points: [
              [30, 170],
              [100, 50],
              [170, 170],
            ],
            fill: "sage",
            stroke: "ink",
            sw: 3,
          },
          { t: "text", x: 100, y: 205, text: "Mountain", size: 18, weight: 700 },
          { t: "poly", points: [[190, 100], [240, 170], [190, 170]], fill: "sage", stroke: "ink", sw: 3 },
          { t: "poly", points: [[290, 100], [240, 170], [290, 170]], fill: "sage", stroke: "ink", sw: 3 },
          { t: "text", x: 240, y: 205, text: "Valley", size: 18, weight: 700 },
          { t: "rect", x: 310, y: 140, w: 150, h: 30, fill: "ochre", stroke: "ink", sw: 3 },
          { t: "text", x: 385, y: 205, text: "Plain", size: 18, weight: 700 },
        ],
      },
      context: "A mountain is a landform that rises high above the land around it.",
      nonExample:
        "A city is made by people, so it is not a landform. A landform is a shape that nature made.",
      academicSentence:
        "Each region has its own mix of landforms, and the landforms affect where people can live and farm.",
      everyday:
        "A hill behind your school and a flat playground are different shapes of the same ground.",
      es: {
        word: "accidente geográfico",
        def: "Una forma natural de la superficie de la Tierra, como una montaña, un valle o una llanura.",
        verified: true,
      },
      misconception:
        "A landform can be a building. Landforms are natural shapes, not things people build.",
      related: ["region", "elevation", "appalachian-mountains"],
      practice: practice(
        "Point to each drawing and say what shape the land has.",
        "Describe a landform you have seen, then write one sentence about it.",
        "Which word names a natural shape of the land, such as a mountain or a valley?",
      ),
      tier: 2,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "elevation",
      word: "elevation",
      pos: "noun",
      pron: "el-uh-VAY-shun",
      def: "How high a place is above sea level.",
      visual: {
        kind: "shapes",
        alt: "A side view of land rising from the sea: a beach at sea level, low hills in the middle, and a tall mountain on the right.",
        longDesc:
          "A flat dashed line marks sea level on the left. The land climbs from the beach to low hills to a tall mountain on the right. Labels read Sea level, Lower, Highest.",
        w: 480,
        h: 240,
        items: [
          { t: "rect", x: 0, y: 190, w: 480, h: 50, fill: "sky", opacity: 0.6 },
          {
            t: "poly",
            points: [
              [110, 190],
              [200, 130],
              [260, 150],
              [330, 60],
              [440, 190],
            ],
            fill: "sage",
            stroke: "ink",
            sw: 3,
          },
          { t: "line", x1: 0, y1: 190, x2: 480, y2: 190, stroke: "ink", sw: 2, dash: [8, 6] },
          { t: "text", x: 55, y: 175, text: "Sea level", size: 16, weight: 700 },
          { t: "text", x: 230, y: 118, text: "Lower", size: 16, weight: 700 },
          { t: "text", x: 335, y: 45, text: "Highest", size: 16, weight: 700 },
        ],
      },
      context: "The elevation of the mountains in the west is higher than the beaches in the east.",
      nonExample: "How wide a river is has nothing to do with how high the land is above the sea.",
      academicSentence:
        "A place with a high elevation is often colder than a place near the coast.",
      everyday: "When you climb to the top of a tall slide, your height above the ground goes up.",
      es: {
        word: "elevación",
        def: "Qué tan alto está un lugar sobre el nivel del mar.",
        verified: true,
      },
      misconception: "Elevation is how big a place is. It is only about height above sea level.",
      related: ["landform", "appalachian-mountains", "coastal-plain"],
      practice: practice(
        "Point to the dashed line. Then point to the place with the highest land.",
        "Say which place in the picture is higher and which is lower, then write the sentence.",
        "What word tells how high a place is above sea level?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "appalachian-mountains",
      word: "Appalachian Mountains",
      pos: "noun",
      pron: "ap-uh-LAY-chun MOWN-tunz",
      def: "The high, forested land in the far west of Maryland, where the ground rises into ridges and the state's highest peaks.",
      visual: {
        kind: "scene",
        alt: "Pine trees and cloudy sky over forested ridges, with the words forests and ridges.",
        longDesc:
          "A field-colored scene with a cluster of tall pine trees and a cloud above them. A label reads Forests and ridges.",
        bg: "field",
        items: [
          { icon: "pine-tree", x: 40, y: 70, s: 120 },
          { icon: "pine-tree", x: 150, y: 90, s: 110 },
          { icon: "pine-tree", x: 250, y: 60, s: 130 },
          { icon: "cloud", x: 330, y: 10, s: 90 },
          { icon: "pine-tree", x: 300, y: 110, s: 100, label: "Forests and ridges" },
        ],
      },
      context: "Garrett County lies in the Appalachian Mountains.",
      nonExample:
        "A flat sandy beach on the Atlantic Ocean is nothing like the high forested land of the far west.",
      academicSentence:
        "The Appalachian Mountains have the highest elevation in Maryland and are covered by forests.",
      everyday:
        "A trip to the mountains in the west of the state feels cooler than a trip to the coast.",
      es: {
        word: "montes Apalaches",
        def: "La tierra alta y con bosques en el extremo oeste de Maryland, donde el suelo sube en cordilleras y están los picos más altos del estado.",
        verified: true,
      },
      misconception:
        "The Appalachian Mountains are tall like the Rocky Mountains. They are older and lower, but they are still the highest land in Maryland.",
      related: ["region", "elevation", "natural-resource"],
      practice: practice(
        "Point to the trees. Say what you would see on a hike here.",
        "Say two things about the land in the far west of Maryland, then write one sentence.",
        "Which region of Maryland has forests and the highest land?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "piedmont",
      word: "Piedmont",
      pos: "noun",
      pron: "PEED-mont",
      def: "The middle region of Maryland, with rolling hills and good farmland, between the mountains and the coast.",
      visual: {
        kind: "scene",
        alt: "A farm and a tree on gently rolling green land under a bright sun, with the words hills and farms.",
        longDesc:
          "A field-colored scene with a farm, a round tree and a sun. A label reads Hills and farms.",
        bg: "field",
        items: [
          { icon: "sun", x: 20, y: 10, s: 80 },
          { icon: "farm", x: 120, y: 80, s: 150, label: "Hills and farms" },
          { icon: "tree", x: 300, y: 90, s: 110 },
          { icon: "tree", x: 380, y: 120, s: 80 },
        ],
      },
      context: "Farms and small towns spread across the rolling hills of the Piedmont.",
      nonExample:
        "Tall mountain peaks and flat sandy beaches are found in other regions, not in this one.",
      academicSentence:
        "The Piedmont is between the mountains and the Fall Line, and its soil is good for farming.",
      everyday: "Picture a road that gently rises and falls past farms and fields.",
      misconception: "The Piedmont is flat. It has rolling hills, which are gentle ups and downs.",
      related: ["region", "fall-line", "appalachian-mountains"],
      practice: practice(
        "Point to the farm. Say what the land looks like around it.",
        "Say what you would see on a drive through rolling hills, then write one sentence.",
        "Which region of Maryland is in the middle, with rolling hills and farms?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "coastal-plain",
      word: "Coastal Plain",
      pos: "noun",
      pron: "KOH-stul PLAYN",
      def: "The low, flat region of Maryland that stretches from the Fall Line to the bay and the ocean.",
      visual: {
        kind: "scene",
        alt: "Corn plants and a sailboat suggesting low, flat land beside the water, with the words flat land near the water.",
        longDesc:
          "A plain scene with two corn plants and a sailboat. A label reads Flat land near the water.",
        bg: "plain",
        items: [
          { icon: "corn", x: 40, y: 90, s: 110 },
          { icon: "corn", x: 140, y: 100, s: 100 },
          { icon: "sailboat", x: 270, y: 70, s: 130, label: "Flat land near the water" },
        ],
      },
      context: "The land of the Coastal Plain is low and flat.",
      nonExample: "Steep, rocky ridges do not belong to this region, which is low and flat.",
      academicSentence:
        "Because the Coastal Plain is flat and has deep, wide water, many farms and ports grew there.",
      everyday: "Think of a field so flat you can see a long way across it.",
      es: {
        word: "llanura costera",
        def: "La región baja y plana de Maryland que va desde la línea de caída hasta la bahía y el océano.",
        verified: true,
      },
      misconception:
        "The Coastal Plain is only the beach. It is a large region of low flat land that includes farms and towns.",
      related: ["region", "chesapeake-bay", "eastern-shore"],
      practice: practice(
        "Point to the water. Say how close the land is to it.",
        "Say two things about low flat land near the water, then write one sentence.",
        "Which region of Maryland is low and flat and reaches the bay and the ocean?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "fall-line",
      word: "Fall Line",
      pos: "noun",
      pron: "FAWL LYN",
      def: "The edge where the hard rock of the hills meets the soft land of the coast, so rivers drop in rapids and small waterfalls.",
      visual: {
        kind: "flow",
        alt: "A river flows from hills of hard rock, drops over rapids and small falls, and then moves slowly across flat land toward the sea.",
        longDesc:
          "Three steps with arrows. Hills of hard rock with a pine tree. Rapids and small waterfalls shown by a water drop. Slow river on flat land shown by a sailboat.",
        steps: [
          { label: "Hills of hard rock", icon: "pine-tree" },
          { label: "Rapids and small waterfalls", icon: "drop" },
          { label: "Slow river on flat land", icon: "sailboat" },
        ],
      },
      context: "Rivers drop over rapids at the Fall Line.",
      nonExample:
        "The season when leaves fall in autumn is a different thing. Here the word names a place on the map.",
      academicSentence:
        "Towns and mills grew at the Fall Line because moving water could power machines and boats could not go farther upriver.",
      everyday:
        "A shallow creek that suddenly rushes over rocks is like a tiny version of this place.",
      misconception:
        "The Fall Line is a cliff or a fence. It is a zone where the land drops a little and rivers speed up.",
      related: ["piedmont", "coastal-plain", "natural-resource"],
      practice: practice(
        "Follow the arrows. Say what happens to the river in the middle box.",
        "Explain why a town near rapids could use the river's power, then write the sentence.",
        "What do we call the edge between the hills and the coast where rivers drop in rapids?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "estuary",
      word: "estuary",
      pos: "noun",
      pron: "ES-choo-air-ee",
      def: "A place where a river's fresh water mixes with salty water from the sea.",
      visual: {
        kind: "flow",
        alt: "River water, which is fresh, flows toward the sea, where it mixes with salty sea water.",
        longDesc:
          "Three steps with arrows. River water (fresh) shown by a drop. Fresh and salty water mix shown by two arrows in a circle. Sea water (salty) shown by a sailboat.",
        steps: [
          { label: "River water (fresh)", icon: "drop" },
          { label: "Fresh and salty water mix", icon: "arrows-cycle" },
          { label: "Sea water (salty)", icon: "sailboat" },
        ],
      },
      context: "An estuary is a place where fresh river water mixes with salty sea water.",
      nonExample:
        "A mountain lake has only fresh water, and the open ocean has only salty water, so neither is mixed.",
      academicSentence:
        "Many fish, crabs and birds live in an estuary because the mixed water holds food for them.",
      everyday:
        "Stirring a spoonful of salt into a glass of water shows what happens when salty water and fresh water mix.",
      es: {
        word: "estuario",
        def: "Un lugar donde el agua dulce de un río se mezcla con el agua salada del mar.",
        verified: true,
      },
      misconception:
        "An estuary is just a river. It is the place where the river meets salt water from the sea.",
      related: ["chesapeake-bay", "natural-resource", "coastal-plain"],
      practice: practice(
        "Point to the middle box. Say what is mixing there.",
        "Explain what mixes in an estuary, then write one sentence with because.",
        "What do we call a place where fresh river water mixes with salty sea water?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "chesapeake-bay",
      word: "Chesapeake Bay",
      pos: "noun",
      pron: "CHES-uh-peek BAY",
      def: "The large estuary in the middle of Maryland, fed by rivers such as the Susquehanna and joined to the Atlantic Ocean.",
      visual: {
        kind: "map",
        alt: "A simple map with the Western Shore on the left, the Bay in the middle, and the Eastern Shore on the right.",
        longDesc:
          "A schematic map, not to scale. West is on the left. The Western Shore, a blue Bay down the middle, and the Eastern Shore.",
        w: 480,
        h: 260,
        regions: [
          { id: "ws", label: "Western Shore", rect: [0, 0, 170, 260] },
          { id: "b", label: "The Bay", rect: [170, 0, 140, 260], fill: "sky" },
          { id: "es", label: "Eastern Shore", rect: [310, 0, 170, 260] },
        ],
      },
      context: "Crabs and oysters live in the Chesapeake Bay.",
      nonExample:
        "The Pacific Ocean is on the other side of the country and is far larger than any bay.",
      academicSentence:
        "The Chesapeake Bay is the largest estuary in the United States, and it separates Maryland's two shores.",
      everyday: "Think of a huge shared pond where many rivers pour in and boats sail out.",
      es: {
        word: "bahía de Chesapeake",
        def: "El gran estuario en el centro de Maryland, alimentado por ríos como el Susquehanna y unido al océano Atlántico.",
        verified: true,
      },
      misconception:
        "The Bay is the ocean. It is a large estuary that connects to the ocean far to the south.",
      related: ["estuary", "natural-resource", "eastern-shore"],
      practice: practice(
        "Point to the Bay. Say which shore is on each side of it.",
        "Say two ways people use the water, then write one sentence about it.",
        "Which large estuary runs through the middle of Maryland?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "natural-resource",
      word: "natural resource",
      pos: "noun",
      pron: "NACH-uh-rul REE-sors",
      def: "Something from nature that people use, such as water, trees, soil or fish.",
      visual: {
        kind: "table",
        alt: "A table matching things from nature with how people use them: trees for lumber and paper, water for drinking and farms, crabs and oysters for food.",
        longDesc:
          "Two columns. From nature: trees, water, crabs and oysters. How people use it: make lumber and paper; drink, farm and make power; eat and sell.",
        head: ["From nature", "How people use it"],
        rows: [
          ["Trees", "Make lumber and paper"],
          ["Water", "Drink, farm, make power"],
          ["Crabs and oysters", "Eat and sell"],
        ],
      },
      context: "Water is a natural resource that farms, factories and families use.",
      nonExample:
        "A plastic toy is made in a factory, so it is not a natural resource. The oil or trees it started from came from nature.",
      academicSentence:
        "People settle where they can find natural resources, such as fresh water, good soil and fish.",
      everyday: "The wood in a pencil started as a tree, which is something from nature.",
      es: {
        word: "recurso natural",
        def: "Algo de la naturaleza que la gente usa, como el agua, los árboles, la tierra o los peces.",
        verified: true,
      },
      misconception:
        "A resource is only something you can dig up. Water, soil and animals are resources too.",
      related: ["adapt", "estuary", "chesapeake-bay"],
      practice: practice(
        "Read across a row. Say what comes from nature and how it is used.",
        "Name a resource where you live and one way people use it, then write the sentence.",
        "What do we call something from nature that people use?",
      ),
      tier: 2,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Inform",
    },
    {
      id: "adapt",
      word: "adapt",
      pos: "verb",
      pron: "uh-DAPT",
      def: "To change how you live or work so that you fit the place where you are.",
      visual: {
        kind: "table",
        alt: "A table matching places with how people live there: cold snowy mountains and warm coats, the salty bay and boats for crabbing, flat sandy land and corn farms.",
        longDesc:
          "Two columns. Place: cold snowy mountains; salty bay and rivers; flat sandy land. How people live there: wear warm coats and plow roads; use boats and fish for crabs; farm corn and soybeans.",
        head: ["Place", "How people live there"],
        rows: [
          ["Cold, snowy mountains", "Wear warm coats and plow roads"],
          ["Salty bay and rivers", "Use boats and fish for crabs"],
          ["Flat, sandy land", "Farm corn and soybeans"],
        ],
      },
      context: "People adapt to cold winters by wearing warm coats and heating their homes.",
      nonExample:
        "Moving a mountain so it fits what you want is changing the land, not changing how you live.",
      academicSentence:
        "Early peoples adapt to the land, and later settlers did too, by building homes, farms and boats that suited the place.",
      everyday: "You adapt to a rainy day when you put on boots and bring an umbrella.",
      es: {
        word: "adaptarse",
        def: "Cambiar la forma en que vives o trabajas para encajar en el lugar donde estás.",
        verified: true,
      },
      misconception:
        "To adapt means to change the land. It means to change how people live to fit the land.",
      related: ["natural-resource", "region", "landform"],
      practice: practice(
        "Pick one place in the table. Say what people do there.",
        "Say how people near you adapt to the weather, then write one sentence with so.",
        "Which word means to change how you live so you fit a place?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "eastern-shore",
      word: "Eastern Shore",
      pos: "noun",
      pron: "EE-stern SHOR",
      def: "The part of Maryland east of the big bay, on a low peninsula with flat farmland, marshes and creeks.",
      visual: {
        kind: "scene",
        alt: "A crab, an ear of corn and a sailboat, three things found on the low land east of the water.",
        longDesc:
          "A plain scene with a crab, a corn plant and a sailboat. A label reads East of the water.",
        bg: "plain",
        items: [
          { icon: "crab", x: 40, y: 90, s: 110 },
          { icon: "corn", x: 170, y: 80, s: 120 },
          { icon: "sailboat", x: 300, y: 70, s: 130, label: "East of the water" },
        ],
      },
      context: "Farms on the Eastern Shore grow corn and soybeans.",
      nonExample: "The mountains far to the west are in the opposite part of the state.",
      academicSentence:
        "The Eastern Shore is part of the Coastal Plain, and its marshes and creeks shaped the lives of the people who lived there.",
      everyday: "A neighborhood across a river from yours would be on the other shore.",
      misconception:
        "The Eastern Shore is the same as the ocean beach. It is a large area of farms, marshes and towns.",
      related: ["coastal-plain", "chesapeake-bay", "natural-resource"],
      practice: practice(
        "Point to each picture. Say what it tells about this part of Maryland.",
        "Say two things you would see on this side of the bay, then write one sentence.",
        "Which part of Maryland lies east of the Chesapeake Bay?",
      ),
      tier: 3,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
