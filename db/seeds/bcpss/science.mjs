// 36 authentic BCPSS Science units:
// K-5: SABES 5E STEM Curriculum (4 units per grade)
// 6-8: IQWST Middle School Science (4 units per grade)

import { buildUnitsAndConnections } from "./_builder.mjs";

const v = (term, tier, cognate_es, kid_def) => ({ term, tier, cognate_es, kid_def });

const SCIENCE_SPECS = [
  // =========================================================================
  // KINDERGARTEN (SABES 5E)
  // =========================================================================
  {
    id: "gk-sci-u1", grade: "K", subject: "Science", unit_number: 1,
    unit_title: "Weather & Sunlight Patterns",
    unit_summary: "Students observe daily local Baltimore weather, track sunlight warming surfaces, and describe seasonal weather patterns.",
    core_standards: ["K-ESS2-1", "K-PS3-1", "K-ESS3-2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "When sunlight shines on [surface], it causes [surface] to feel [warmer/cooler].",
    cross_subject_bridge_note: "Links sensory observation words from K Wit & Wisdom (The Five Senses) with cause-effect explanations.",
    vocab: [v("weather", 3, null, "what the sky and air are like outside"), v("pattern", 2, "patrón", "something that repeats"), v("temperature", 3, "temperatura", "how hot or cold something is")],
  },
  {
    id: "gk-sci-u2", grade: "K", subject: "Science", unit_number: 2,
    unit_title: "Pushes, Pulls & Motion",
    unit_summary: "Students test how different strengths and directions of pushes and pulls change the speed or direction of classroom objects.",
    core_standards: ["K-PS2-1", "K-PS2-2"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "First, I give the ball a [strong/gentle] [push/pull]. Then, it moves [faster/farther/direction].",
    cross_subject_bridge_note: "Reinforces sequence and direction vocabulary used in K Reveal Math and K ELA.",
    vocab: [v("push", 2, null, "move something away from you"), v("pull", 2, null, "move something closer to you"), v("motion", 3, null, "the act of moving")],
  },
  {
    id: "gk-sci-u3", grade: "K", subject: "Science", unit_number: 3,
    unit_title: "Living Things & Needs",
    unit_summary: "Students classify living and nonliving things and investigate what plants and animals need to survive in their habitats.",
    core_standards: ["K-LS1-1", "K-ESS3-1"],
    blueprint_id: "inform-classify-define",
    unit_example_frame: "A [plant/animal] is a living thing because it needs [water/food/light] to grow.",
    cross_subject_bridge_note: "Shares classification frames with K Reveal Math sorting shapes and counting groups.",
    vocab: [v("habitat", 3, "hábitat", "the natural home of a plant or animal"), v("living", 2, null, "alive, growing, and needing food/water"), v("survive", 2, "sobrevivir", "stay alive")],
  },
  {
    id: "gk-sci-u4", grade: "K", subject: "Science", unit_number: 4,
    unit_title: "Caring for Our Neighborhood Environment",
    unit_summary: "Students investigate how humans change local environments and design simple ways to reduce, reuse, and recycle at school.",
    core_standards: ["K-ESS2-2", "K-ESS3-3"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "We should [recycle/reuse] [item] because it helps our [neighborhood/Earth] by [reason].",
    cross_subject_bridge_note: "Mirrors K Wit & Wisdom (The Continents) and K Studies Weekly citizenship arguments.",
    vocab: [v("recycle", 2, "reciclar", "turn used materials into new things"), v("environment", 3, "ambiente", "the land, water, and air around us"), v("solution", 2, "solución", "a way to fix a problem")],
  },

  // =========================================================================
  // GRADE 1 (SABES 5E)
  // =========================================================================
  {
    id: "g1-sci-u1", grade: "1", subject: "Science", unit_number: 1,
    unit_title: "Sound & Light Waves",
    unit_summary: "Students investigate how vibrations create sound and how light travels through transparent, translucent, and opaque materials.",
    core_standards: ["1-PS4-1", "1-PS4-2", "1-PS4-3"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "When [object] vibrates, it causes [sound]; when [material] blocks light, it makes a [shadow].",
    cross_subject_bridge_note: "Directly shares cause-effect language with Grade 1 Wit & Wisdom (Creature Features).",
    vocab: [v("vibrate", 3, "vibrar", "move back and forth very quickly"), v("transparent", 3, "transparente", "lets almost all light pass through"), v("opaque", 3, "opaco", "blocks all light")],
  },
  {
    id: "g1-sci-u2", grade: "1", subject: "Science", unit_number: 2,
    unit_title: "Animal & Plant Parts for Survival",
    unit_summary: "Students examine how external structures of plants and animals inspire human engineering solutions (biomimicry).",
    core_standards: ["1-LS1-1", "1-LS1-2", "1-LS3-1"],
    blueprint_id: "inform-classify-define",
    unit_example_frame: "A [structure] is an external part that helps a [organism] [survive/protect/grow].",
    cross_subject_bridge_note: "Bridges Grade 1 Reveal Math shape attributes and Grade 1 ELA Creature Features.",
    vocab: [v("structure", 3, "estructura", "a part of a living thing or object"), v("function", 3, "función", "the job a part does"), v("offspring", 3, null, "the young of a plant or animal")],
  },
  {
    id: "g1-sci-u3", grade: "1", subject: "Science", unit_number: 3,
    unit_title: "Sky Patterns: Sun, Moon & Stars",
    unit_summary: "Students track predictable patterns of the sun, moon, and seasonal daylight hours across the year.",
    core_standards: ["1-ESS1-1", "1-ESS1-2"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "During the [day/season], the [sun/moon] appears to [pattern], which repeats every [cycle].",
    cross_subject_bridge_note: "Connects to Grade 1 Reveal Math telling time and counting patterns.",
    vocab: [v("predictable", 2, "predecible", "able to be known ahead of time"), v("daylight", 2, null, "hours when the sun is up"), v("phase", 3, "fase", "a shape the moon appears to have")],
  },
  {
    id: "g1-sci-u4", grade: "1", subject: "Science", unit_number: 4,
    unit_title: "Communicating with Light & Sound",
    unit_summary: "Students design and test a device that uses light or sound signals to send messages across the classroom.",
    core_standards: ["1-PS4-4", "K-2-ETS1-2"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "My communication device works best because our test showed [evidence].",
    cross_subject_bridge_note: "Reinforces Grade 1 Studies Weekly civic problem-solving and evidence-based claims.",
    vocab: [v("signal", 3, "señal", "a light or sound used to send a message"), v("design", 2, "diseñar", "plan and build something for a purpose"), v("evidence", 2, "evidencia", "test results that show what worked")],
  },

  // =========================================================================
  // GRADE 2 (SABES 5E)
  // =========================================================================
  {
    id: "g2-sci-u1", grade: "2", subject: "Science", unit_number: 1,
    unit_title: "Properties & Changes of Matter",
    unit_summary: "Students classify solids and liquids by observable properties and test which heating or cooling changes are reversible.",
    core_standards: ["2-PS1-1", "2-PS1-2", "2-PS1-4"],
    blueprint_id: "inform-classify-define",
    unit_example_frame: "[Material] can be classified as [property/state] because it [observable attribute].",
    cross_subject_bridge_note: "Shares attribute-classification language with Grade 2 Reveal Math geometry and measurement.",
    vocab: [v("property", 3, "propiedad", "a trait you can observe or measure"), v("reversible", 3, "reversible", "able to change back to how it started"), v("matter", 3, "materia", "anything that takes up space")],
  },
  {
    id: "g2-sci-u2", grade: "2", subject: "Science", unit_number: 2,
    unit_title: "Plant Growth & Pollination Systems",
    unit_summary: "Students test what plants need to grow and model how bees and wind disperse seeds and pollinate flowers.",
    core_standards: ["2-LS2-1", "2-LS2-2", "2-LS4-1"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "First, a pollinator carries [pollen] to [flower]. Next, the plant forms [seeds] that disperse.",
    cross_subject_bridge_note: "Connects to Grade 2 Wit & Wisdom (A Season of Change) natural cycle explanations.",
    vocab: [v("pollinate", 3, "polinizar", "move pollen so plants can make seeds"), v("disperse", 3, "dispersar", "spread out to new places"), v("diversity", 2, "diversidad", "having many different kinds")],
  },
  {
    id: "g2-sci-u3", grade: "2", subject: "Science", unit_number: 3,
    unit_title: "Quick & Slow Earth Changes",
    unit_summary: "Students compare fast events like earthquakes and landslides with slow wind and water erosion shaping landforms.",
    core_standards: ["2-ESS1-1", "2-ESS2-1", "2-ESS2-2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [wind/water/quake] acts on [landform], it causes [fast/slow change] over [time].",
    cross_subject_bridge_note: "Reinforces Grade 2 Studies Weekly landforms/maps and Grade 2 ELA cause-effect sentences.",
    vocab: [v("erosion", 3, "erosión", "moving soil or rock by wind or water"), v("landform", 3, null, "a natural shape on Earth's surface"), v("prevent", 2, "prevenir", "stop something from happening")],
  },
  {
    id: "g2-sci-u4", grade: "2", subject: "Science", unit_number: 4,
    unit_title: "Engineering Erosion Solutions",
    unit_summary: "Students design, test, and compare engineering barriers to slow water erosion on a model Baltimore hillside.",
    core_standards: ["2-ESS2-1", "K-2-ETS1-3"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to our erosion test, [design] protected the soil best because [measured evidence].",
    cross_subject_bridge_note: "Shares claim-evidence structure with Grade 2 Wit & Wisdom (Good Eating) opinion writing.",
    vocab: [v("barrier", 2, "barrera", "something built to block wind or water"), v("compare", 2, "comparar", "check which design worked better"), v("data", 3, "datos", "measurements collected during a test")],
  },

  // =========================================================================
  // GRADE 3 (SABES 5E)
  // =========================================================================
  {
    id: "g3-sci-u1", grade: "3", subject: "Science", unit_number: 1,
    unit_title: "Balanced & Unbalanced Forces",
    unit_summary: "Students investigate balanced and unbalanced forces, friction, and magnetism to predict an object's future motion.",
    core_standards: ["3-PS2-1", "3-PS2-2", "3-PS2-3"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "When the forces on [object] are unbalanced, it causes [object] to [accelerate/change direction].",
    cross_subject_bridge_note: "Aligns with Grade 3 Wit & Wisdom (Artists Make Art) cause-effect explanations.",
    vocab: [v("unbalanced", 3, "desbalanceado", "unequal forces that cause motion to change"), v("friction", 3, "fricción", "a force that slows rubbing surfaces"), v("magnetic", 3, "magnético", "able to pull or push certain metals")],
  },
  {
    id: "g3-sci-u2", grade: "3", subject: "Science", unit_number: 2,
    unit_title: "Life Cycles & Inherited Traits",
    unit_summary: "Students model diverse organism life cycles and distinguish inherited traits from traits influenced by the environment.",
    core_standards: ["3-LS1-1", "3-LS3-1", "3-LS3-2"],
    blueprint_id: "inform-classify-define",
    unit_example_frame: "[Trait] is classified as an [inherited/environmental] trait because [evidence].",
    cross_subject_bridge_note: "Transfers to Grade 3 Reveal Math classifying quadrilaterals by defining attributes.",
    vocab: [v("inherited", 3, "heredado", "passed down from parents to offspring"), v("trait", 3, null, "a characteristic of a living thing"), v("variation", 3, "variación", "differences among individuals of the same kind")],
  },
  {
    id: "g3-sci-u3", grade: "3", subject: "Science", unit_number: 3,
    unit_title: "Ecosystems, Fossils & Survival",
    unit_summary: "Students use fossil evidence and habitat data to argue why certain organisms thrive or struggle when environments change.",
    core_standards: ["3-LS2-1", "3-LS4-1", "3-LS4-3"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "Based on the fossil/habitat data, [organism] survived well because [evidence].",
    cross_subject_bridge_note: "Directly shares claim-evidence frames with Grade 3 Wit & Wisdom (Outer Space).",
    vocab: [v("fossil", 3, "fósil", "preserved remains or trace of ancient life"), v("adaptation", 3, "adaptación", "a trait that helps an organism survive"), v("habitat", 3, "hábitat", "the natural home providing food and shelter")],
  },
  {
    id: "g3-sci-u4", grade: "3", subject: "Science", unit_number: 4,
    unit_title: "Weather Hazards & Climate Regions",
    unit_summary: "Students graph seasonal weather data, compare climate zones, and evaluate designs that reduce flood or storm damage.",
    core_standards: ["3-ESS2-1", "3-ESS2-2", "3-ESS3-1"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "During [storm/season], [weather factor] interacts with [region] to produce [climate pattern].",
    cross_subject_bridge_note: "Bridges Grade 3 Studies Weekly Geography & Climate and Grade 3 Reveal Math bar/line plots.",
    vocab: [v("climate", 3, "clima", "typical weather in a region over many years"), v("hazard", 2, null, "a dangerous natural event"), v("precipitation", 3, "precipitación", "rain, snow, sleet, or hail falling from clouds")],
  },

  // =========================================================================
  // GRADE 4 (SABES 5E)
  // =========================================================================
  {
    id: "g4-sci-u1", grade: "4", subject: "Science", unit_number: 1,
    unit_title: "Energy Transfer & Collisions",
    unit_summary: "Students investigate how speed relates to energy and how energy transfers through collisions, sound, light, heat, and electric circuits.",
    core_standards: ["4-PS3-1", "4-PS3-2", "4-PS3-3", "4-PS3-4"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [object] moved with greater speed, the collision transferred [energy] and caused [effect].",
    cross_subject_bridge_note: "Directly aligns with Grade 4 Wit & Wisdom (Myth Making) and MD History causal chains.",
    vocab: [v("energy", 3, "energía", "the ability to cause motion or change"), v("transfer", 2, "transferir", "move from one object or place to another"), v("collision", 3, "colisión", "two objects hitting each other")],
  },
  {
    id: "g4-sci-u2", grade: "4", subject: "Science", unit_number: 2,
    unit_title: "Waves & Information Transfer",
    unit_summary: "Students model wave amplitude and wavelength and test how patterns in waves transmit information across distances.",
    core_standards: ["4-PS4-1", "4-PS4-2", "4-PS4-3"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "During signal transfer, [wave property] carries [coded pattern] from sender to receiver.",
    cross_subject_bridge_note: "Connects to Grade 4 Reveal Math multiplicative patterns and geometric angles.",
    vocab: [v("amplitude", 3, "amplitud", "the height of a wave showing its energy"), v("wavelength", 3, null, "the distance from one wave peak to the next"), v("transmit", 2, "transmitir", "send a signal from one place to another")],
  },
  {
    id: "g4-sci-u3", grade: "4", subject: "Science", unit_number: 3,
    unit_title: "Organism Structures & Senses",
    unit_summary: "Students model how animals receive sensory information, process it in the brain, and respond to survive in Chesapeake habitats.",
    core_standards: ["4-LS1-1", "4-LS1-2"],
    blueprint_id: "inform-classify-define",
    unit_example_frame: "[Sensory organ] is a specialized structure that detects [stimulus] and sends signals to the brain.",
    cross_subject_bridge_note: "Shares defining-attribute frames with Grade 4 Reveal Math classifying angles and triangles.",
    vocab: [v("receptor", 3, "receptor", "a sensory part that detects a signal"), v("internal", 2, "interno", "inside the body"), v("stimulus", 3, "estímulo", "something in the environment that triggers a reaction")],
  },
  {
    id: "g4-sci-u4", grade: "4", subject: "Science", unit_number: 4,
    unit_title: "Earth's Changing Surface & Chesapeake Watershed",
    unit_summary: "Students interpret rock strata, weathering, and Baltimore/Chesapeake watershed maps to argue how Earth's surface changes over time.",
    core_standards: ["4-ESS1-1", "4-ESS2-1", "4-ESS2-2", "4-ESS3-2"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to the rock layers and watershed map, [landform] changed over time because [evidence].",
    cross_subject_bridge_note: "Shares claim-evidence language with Grade 4 Wit & Wisdom (The Redcoats Are Coming!) and MD Geography.",
    vocab: [v("weathering", 3, null, "breaking down rock into smaller pieces"), v("sediment", 3, "sedimento", "small bits of rock and soil moved by water"), v("watershed", 3, null, "land area that drains water into a river or bay")],
  },

  // =========================================================================
  // GRADE 5 (SABES 5E)
  // =========================================================================
  {
    id: "g5-sci-u1", grade: "5", subject: "Science", unit_number: 1,
    unit_title: "Structure, Properties & Conservation of Matter",
    unit_summary: "Students model matter as tiny particles too small to see and prove through mass measurements that matter is conserved during mixing and phase changes.",
    core_standards: ["5-PS1-1", "5-PS1-2", "5-PS1-3", "5-PS1-4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "Our mass measurements prove that matter was conserved because [before/after evidence].",
    cross_subject_bridge_note: "Directly shares claim-evidence frames with Grade 5 Wit & Wisdom (A War Between Us) and Social Studies.",
    vocab: [v("particle", 3, "partícula", "a tiny piece of matter too small to see"), v("conserve", 2, "conservar", "keep the total amount the same"), v("mixture", 3, "mezcla", "two or more substances combined")],
  },
  {
    id: "g5-sci-u2", grade: "5", subject: "Science", unit_number: 2,
    unit_title: "Matter & Energy in Ecosystems",
    unit_summary: "Students trace how energy from the sun flows through plants, animals, and decomposers in Chesapeake food webs.",
    core_standards: ["5-PS3-1", "5-LS1-1", "5-LS2-1"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "Within the food web, energy flows from [producer] to [consumer] and matter recycles through [decomposer].",
    cross_subject_bridge_note: "Connects to Grade 5 Reveal Math multi-step decimal/fraction operational processes.",
    vocab: [v("producer", 3, "productor", "an organism like a plant that makes its own food"), v("decomposer", 3, "descomponedor", "an organism that breaks down dead matter"), v("photosynthesis", 3, "fotosíntesis", "how plants use sunlight, air, and water to make food")],
  },
  {
    id: "g5-sci-u3", grade: "5", subject: "Science", unit_number: 3,
    unit_title: "Earth's Systems & Human Impact",
    unit_summary: "Students model interactions among the geosphere, biosphere, hydrosphere, and atmosphere and evaluate community water-protection practices.",
    core_standards: ["5-ESS2-1", "5-ESS2-2", "5-ESS3-1"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "When [hydrosphere/atmosphere change] interacts with [geosphere/biosphere], it leads to [impact].",
    cross_subject_bridge_note: "Mirrors Grade 5 Wit & Wisdom (Breaking Barriers) and Early US History cause-and-effect.",
    vocab: [v("hydrosphere", 3, "hidrosfera", "all the water on Earth"), v("geosphere", 3, "geosfera", "Earth's solid rock and landforms"), v("interaction", 2, "interacción", "how two systems affect each other")],
  },
  {
    id: "g5-sci-u4", grade: "5", subject: "Science", unit_number: 4,
    unit_title: "Earth's Place in the Universe",
    unit_summary: "Students model gravity, shadows, and seasonal star patterns to explain why the sun appears brighter than distant stars.",
    core_standards: ["5-PS2-1", "5-ESS1-1", "5-ESS1-2"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both the Sun and distant stars emit light; however, the Sun appears brighter because [distance comparison].",
    cross_subject_bridge_note: "Shares compare-contrast structure with Grade 5 Wit & Wisdom (Cultures in Conflict) and Reveal Math.",
    vocab: [v("gravity", 3, "gravedad", "the force pulling objects toward Earth's center"), v("apparent brightness", 3, null, "how bright a star looks from Earth"), v("rotation", 3, "rotación", "Earth spinning on its axis")],
  },

  // =========================================================================
  // GRADE 6 (IQWST — Exact BCPSS Middle School Units)
  // =========================================================================
  {
    id: "g6-sci-u1", grade: "6", subject: "Science", unit_number: 1,
    unit_title: "Can I Believe My Eyes?",
    unit_summary: "Students investigate light, reflection, scattering, absorption, and color perception in IQWST Physics to explain how human eyes see objects and optical illusions.",
    core_standards: ["MS-PS4-2", "MS-LS1-8"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "During sight, light travels from [source], [reflects/scatters] off [object], and enters the eye to form an image.",
    cross_subject_bridge_note: "Connects to Grade 6 Reveal Math coordinate/geometric ray models and systematic explanations.",
    vocab: [v("reflection", 3, "reflexión", "light bouncing off a smooth surface at equal angles"), v("absorption", 3, "absorción", "light energy taken in by a surface instead of bouncing"), v("scattering", 3, null, "light bouncing in many directions off a rough surface"), v("transparent", 3, "transparente", "allowing light to pass straight through")],
  },
  {
    id: "g6-sci-u2", grade: "6", subject: "Science", unit_number: 2,
    unit_title: "How Can I Smell Things from a Distance?",
    unit_summary: "Students develop particle models of solids, liquids, and gases in IQWST Chemistry to explain odor diffusion, phase changes, and thermal energy.",
    core_standards: ["MS-PS1-1", "MS-PS1-4"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because heating increases the speed of [gas/liquid] particles, [odor/phase change] spreads faster as a result.",
    cross_subject_bridge_note: "Directly shares cause-and-effect framing with Grade 6 Wit & Wisdom (Resilience in the Great Depression) and Ancient Civilizations.",
    vocab: [v("particle", 3, "partícula", "a tiny unit of matter in constant motion"), v("diffusion", 3, "difusión", "particles spreading from crowded to less crowded areas"), v("phase change", 3, null, "matter changing between solid, liquid, and gas"), v("thermal energy", 3, "energía térmica", "energy from the motion of particles")],
  },
  {
    id: "g6-sci-u3", grade: "6", subject: "Science", unit_number: 3,
    unit_title: "Where Have All the Creatures Gone?",
    unit_summary: "Students analyze Great Lakes food webs, invasive species like the sea lamprey, and population graphs in IQWST Life Science to build ecosystem arguments.",
    core_standards: ["MS-LS2-1", "MS-LS2-2", "MS-LS2-4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to the population graph, the decline of [species] was caused by [factor] because [data evidence].",
    cross_subject_bridge_note: "Shares claim-evidence-reasoning directly with Grade 6 Wit & Wisdom (Courage in Crisis) and Grade 6 Reveal Math statistical data.",
    vocab: [v("invasive species", 3, "especie invasora", "a non-native organism that disrupts an ecosystem"), v("competition", 2, "competencia", "organisms struggling for the same limited resource"), v("population", 3, "población", "all members of one species in an area"), v("predator", 3, "depredador", "an animal that hunts other animals for food")],
  },
  {
    id: "g6-sci-u4", grade: "6", subject: "Science", unit_number: 4,
    unit_title: "How Does Water Shape Our World?",
    unit_summary: "Students investigate the water cycle, rock weathering, erosion, and deposition in IQWST Earth Science to explain how water carves valleys and reshapes landscapes.",
    core_standards: ["MS-ESS2-1", "MS-ESS2-2", "MS-ESS2-4"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "As moving water erodes [rock/sediment] along [slope], it leads to [deposition/landform change] downstream.",
    cross_subject_bridge_note: "Bridges Grade 6 Ancient Civilizations (Nile, Tigris-Euphrates river silt & agriculture) and Grade 6 Reveal Math area/volume rates.",
    vocab: [v("weathering", 3, null, "breaking rock into smaller pieces over time"), v("erosion", 3, "erosión", "carrying weathered sediment to a new location"), v("deposition", 3, "deposición", "dropping sediment when water slows down"), v("elevation", 3, "elevación", "height of land above sea level")],
  },

  // =========================================================================
  // GRADE 7 (IQWST)
  // =========================================================================
  {
    id: "g7-sci-u1", grade: "7", subject: "Science", unit_number: 1,
    unit_title: "How Can I Make New Stuff from Old Stuff?",
    unit_summary: "Students investigate chemical reactions, conservation of mass, and atomic rearrangement by transforming fats and reactants into soap.",
    core_standards: ["MS-PS1-2", "MS-PS1-5"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to our property tests, a chemical reaction occurred because [new properties/mass evidence].",
    cross_subject_bridge_note: "Shares claim-evidence language with Grade 7 World Geography resource analyses and ELA.",
    vocab: [v("reactant", 3, "reactivo", "a starting substance in a chemical reaction"), v("product", 3, "producto", "a new substance formed in a reaction"), v("conservation", 3, "conservación", "total mass staying equal before and after")],
  },
  {
    id: "g7-sci-u2", grade: "7", subject: "Science", unit_number: 2,
    unit_title: "What Is Going On Inside Me?",
    unit_summary: "Students trace how digestive, circulatory, and respiratory systems deliver food molecules and oxygen to cells for cellular respiration.",
    core_standards: ["MS-LS1-3", "MS-LS1-7"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "Within the body system, [organ] breaks down/transports [molecule] so cells can release [energy].",
    cross_subject_bridge_note: "Connects to Grade 7 Reveal Math proportional rates (heart rate/oxygen intake) and process explanations.",
    vocab: [v("cellular respiration", 3, "respiración celular", "process cells use to release energy from glucose"), v("circulatory", 3, "circulatorio", "system that pumps blood through the body"), v("molecule", 3, "molécula", "atoms bonded together")],
  },
  {
    id: "g7-sci-u3", grade: "7", subject: "Science", unit_number: 3,
    unit_title: "What Makes the Weather Change?",
    unit_summary: "Students investigate air pressure, convection, humidity, and fronts to explain why local and global weather patterns shift.",
    core_standards: ["MS-ESS2-5", "MS-ESS2-6"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because warm air rises and lowers [air pressure], [front/convection] leads to [weather effect].",
    cross_subject_bridge_note: "Directly shares cause-and-effect framing with Grade 7 Wit & Wisdom (Fever) and World Geography.",
    vocab: [v("convection", 3, "convección", "heat transfer through rising warm and sinking cool fluid"), v("air pressure", 3, "presión atmosférica", "the weight of air pushing on a surface"), v("humidity", 3, "humedad", "amount of water vapor in the air")],
  },
  {
    id: "g7-sci-u4", grade: "7", subject: "Science", unit_number: 4,
    unit_title: "Why Do Some Things Stop While Others Keep Going?",
    unit_summary: "Students track kinetic, potential, thermal, and elastic energy transformations in mechanical systems to explain conservation of energy.",
    core_standards: ["MS-PS3-1", "MS-PS3-2", "MS-PS3-5"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "While potential energy depends on [position], kinetic energy depends on [mass and speed].",
    cross_subject_bridge_note: "Transfers to Grade 7 Wit & Wisdom (Americans All) and Reveal Math comparing linear relationships.",
    vocab: [v("kinetic energy", 3, "energía cinética", "energy of motion"), v("potential energy", 3, "energía potencial", "stored energy based on position or shape"), v("transformation", 2, "transformación", "energy changing from one form to another")],
  },

  // =========================================================================
  // GRADE 8 (IQWST)
  // =========================================================================
  {
    id: "g8-sci-u1", grade: "8", subject: "Science", unit_number: 1,
    unit_title: "How Will It Move?",
    unit_summary: "Students apply Newton's Laws of Motion, net force diagrams, and mass-acceleration data to predict how objects move and collide.",
    core_standards: ["MS-PS2-1", "MS-PS2-2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because a net force of [magnitude] acts on [object], it causes an acceleration proportional to [mass].",
    cross_subject_bridge_note: "Directly aligns with Grade 8 Reveal Math linear functions (slope = rate of change) and Wit & Wisdom (The Great War).",
    vocab: [v("acceleration", 3, "aceleración", "rate at which velocity changes"), v("net force", 3, "fuerza neta", "combined sum of all forces acting on an object"), v("inertia", 3, "inercia", "tendency of an object to resist changes in motion")],
  },
  {
    id: "g8-sci-u2", grade: "8", subject: "Science", unit_number: 2,
    unit_title: "Why Do Organisms Look the Way They Do?",
    unit_summary: "Students model DNA, genes, dominant/recessive inheritance, and mutations to explain trait variation across generations.",
    core_standards: ["MS-LS3-1", "MS-LS3-2"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "Based on the pedigree and Punnett model, [trait] is [dominant/recessive] because [evidence].",
    cross_subject_bridge_note: "Shares claim-evidence language with Grade 8 Wit & Wisdom (Teens as Change Agents) and US History.",
    vocab: [v("genotype", 3, "genotipo", "the genetic alleles an organism carries"), v("phenotype", 3, "fenotipo", "the observable physical trait"), v("mutation", 3, "mutación", "a change in the DNA sequence")],
  },
  {
    id: "g8-sci-u3", grade: "8", subject: "Science", unit_number: 3,
    unit_title: "How Is the Earth Changing?",
    unit_summary: "Students analyze tectonic plate boundaries, seafloor spreading, and earthquake/volcano distribution to explain Earth's dynamic crust.",
    core_standards: ["MS-ESS2-2", "MS-ESS2-3"],
    blueprint_id: "explain-process-system",
    unit_example_frame: "At a [convergent/divergent] boundary, mantle convection drives [plate motion], forming [landform].",
    cross_subject_bridge_note: "Connects to Grade 8 Reveal Math coordinate transformations and geometric systems.",
    vocab: [v("tectonic plate", 3, "placa tectónica", "a massive slab of Earth's outer crust"), v("subduction", 3, "subducción", "one plate sinking beneath another"), v("mantle", 3, "manto", "hot, slowly flowing layer beneath Earth's crust")],
  },
  {
    id: "g8-sci-u4", grade: "8", subject: "Science", unit_number: 4,
    unit_title: "How Does Food Provide My Body with Energy?",
    unit_summary: "Students investigate photosynthesis and cellular respiration at the molecular level to trace carbon and energy cycling through ecosystems.",
    core_standards: ["MS-LS1-6", "MS-LS1-7", "MS-PS1-5"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "In contrast to photosynthesis, which stores solar energy in glucose, cellular respiration [contrasting process].",
    cross_subject_bridge_note: "Shares compare-contrast framing with Grade 8 US History (North vs. South economies) and Reveal Math functions.",
    vocab: [v("glucose", 3, "glucosa", "a simple sugar molecule that stores chemical energy"), v("chloroplast", 3, "cloroplasto", "plant cell organelle where photosynthesis occurs"), v("conservation", 3, "conservación", "atoms rearranged without being created or destroyed")],
  },
];

const built = buildUnitsAndConnections(SCIENCE_SPECS);
export const SCIENCE_UNITS = built.units;
export const SCIENCE_CONNECTIONS = built.connections;
