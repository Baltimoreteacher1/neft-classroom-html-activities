// 36 authentic BCPSS Social Studies units:
// K-3: Studies Weekly (4 units per grade)
// 4-8: BCPSS Social Studies (G4 MD History, G5 Early US History, G6 Ancient Civilizations,
//      G7 World Geography, G8 US History through Reconstruction)

import { buildUnitsAndConnections } from "./_builder.mjs";

const v = (term, tier, cognate_es, kid_def) => ({ term, tier, cognate_es, kid_def });

const SOCIAL_STUDIES_SPECS = [
  // =========================================================================
  // KINDERGARTEN (Studies Weekly)
  // =========================================================================
  {
    id: "gk-ss-u1", grade: "K", subject: "Social Studies", unit_number: 1,
    unit_title: "Rules, Responsibility & Good Citizenship",
    unit_summary: "Students explore why classroom and Baltimore neighborhood rules keep people safe, fair, and respected.",
    core_standards: ["D2.Civ.1.K-2", "D2.Civ.12.K-2"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "We need the rule '[rule]' because it keeps our class [safe/fair].",
    cross_subject_bridge_note: "Directly shares opinion/claim language with K Wit & Wisdom (The Continents) and K Science.",
    vocab: [v("citizen", 3, "ciudadano", "a member of a community"), v("responsibility", 2, "responsabilidad", "a job you are expected to do"), v("fair", 2, null, "treating everyone with respect and equality")],
  },
  {
    id: "gk-ss-u2", grade: "K", subject: "Social Studies", unit_number: 2,
    unit_title: "Maps, Globes & Where We Live",
    unit_summary: "Students use simple maps, globes, and positional words to locate their school, Baltimore neighborhoods, land, and water.",
    core_standards: ["D2.Geo.1.K-2", "D2.Geo.2.K-2"],
    blueprint_id: "inform-classify-define",
    unit_example_frame: "On this map, the [symbol] shows [feature], which is [near/next to] [place].",
    cross_subject_bridge_note: "Reinforces positional and sorting vocabulary in K Reveal Math geometry.",
    vocab: [v("map", 3, "mapa", "a drawing of a place from above"), v("globe", 3, "globo", "a round model of Earth"), v("symbol", 3, "símbolo", "a small picture that stands for something")],
  },
  {
    id: "gk-ss-u3", grade: "K", subject: "Social Studies", unit_number: 3,
    unit_title: "Past, Present & Family Traditions",
    unit_summary: "Students sequence personal and community events and compare how families lived long ago versus today.",
    core_standards: ["D2.His.1.K-2", "D2.His.2.K-2"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Long ago, families [past detail], but today families [present detail].",
    cross_subject_bridge_note: "Mirrors K Wit & Wisdom Module 3 (America, Then and Now) word-for-word.",
    vocab: [v("tradition", 2, "tradición", "a special custom a family repeats"), v("timeline", 3, null, "a line showing events in order"), v("community", 2, "comunidad", "a group of people living and working together")],
  },
  {
    id: "gk-ss-u4", grade: "K", subject: "Social Studies", unit_number: 4,
    unit_title: "Needs, Wants & Neighborhood Jobs",
    unit_summary: "Students distinguish basic human needs from wants and explain how Baltimore workers provide goods and services.",
    core_standards: ["D2.Eco.1.K-2", "D2.Eco.2.K-2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because people need [need], [community worker] helps by providing [good/service].",
    cross_subject_bridge_note: "Shares cause-effect frames with K Science (Weather & Sunlight).",
    vocab: [v("needs", 2, "necesidades", "things people must have to live"), v("wants", 2, null, "things people would like to have"), v("service", 3, "servicio", "work done to help others")],
  },

  // =========================================================================
  // GRADE 1 (Studies Weekly)
  // =========================================================================
  {
    id: "g1-ss-u1", grade: "1", subject: "Social Studies", unit_number: 1,
    unit_title: "Civics, Leaders & Community Helpers",
    unit_summary: "Students learn how civic leaders and neighborhood helpers work together to solve problems and serve Baltimore.",
    core_standards: ["D2.Civ.2.K-2", "D2.Civ.6.K-2"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "A [leader/helper] is important to our community because they [action/evidence].",
    cross_subject_bridge_note: "Connects to Grade 1 Science design claims and Grade 1 ELA problem-resolution.",
    vocab: [v("leader", 2, "líder", "someone who guides a group"), v("cooperate", 2, "cooperar", "work together toward a goal"), v("vote", 3, "votar", "make a fair group choice")],
  },
  {
    id: "g1-ss-u2", grade: "1", subject: "Social Studies", unit_number: 2,
    unit_title: "Cardinal Directions & Neighborhood Maps",
    unit_summary: "Students read map keys, compass roses, and physical features to describe where places are in Maryland.",
    core_standards: ["D2.Geo.1.K-2", "D2.Geo.3.K-2"],
    blueprint_id: "inform-summarize-main-idea",
    unit_example_frame: "This map shows [main area], including [key feature 1] and [key feature 2].",
    cross_subject_bridge_note: "Supports Grade 1 ELA informational reading and Grade 1 Math measurement.",
    vocab: [v("compass rose", 3, null, "a map tool showing north, south, east, and west"), v("location", 2, "ubicación", "where a place is found"), v("feature", 2, null, "an important part of the land or city")],
  },
  {
    id: "g1-ss-u3", grade: "1", subject: "Social Studies", unit_number: 3,
    unit_title: "American Symbols & Historical Timelines",
    unit_summary: "Students explore national and state symbols and sequence key events in American and Maryland history.",
    core_standards: ["D2.His.1.K-2", "D2.His.3.K-2"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "First, [historical event 1]. Next, [historical event 2], which we remember with [symbol].",
    cross_subject_bridge_note: "Directly aligns with Grade 1 Wit & Wisdom Module 3 sequencing.",
    vocab: [v("symbol", 3, "símbolo", "an object representing an idea or country"), v("history", 3, "historia", "the story of what happened in the past"), v("celebrate", 2, "celebrar", "honor an important person or event")],
  },
  {
    id: "g1-ss-u4", grade: "1", subject: "Social Studies", unit_number: 4,
    unit_title: "Goods, Services, Saving & Spending",
    unit_summary: "Students examine how families make choices between spending and saving and how producers and consumers trade.",
    core_standards: ["D2.Eco.1.K-2", "D2.Eco.4.K-2"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "A producer [action], whereas a consumer [contrasting action] in our neighborhood.",
    cross_subject_bridge_note: "Shares compare-contrast frames with Grade 1 Wit & Wisdom (Cinderella Stories) and Reveal Math.",
    vocab: [v("producer", 3, "productor", "a person who makes goods or provides services"), v("consumer", 3, "consumidor", "a person who buys or uses goods"), v("choice", 2, null, "picking one option over another")],
  },

  // =========================================================================
  // GRADE 2 (Studies Weekly)
  // =========================================================================
  {
    id: "g2-ss-u1", grade: "2", subject: "Social Studies", unit_number: 1,
    unit_title: "Local Government & Democratic Rights",
    unit_summary: "Students explore how Baltimore City government works, how laws are made, and how citizens exercise rights and responsibilities.",
    core_standards: ["D2.Civ.1.K-2", "D2.Civ.5.K-2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because citizens [civic action], local government can [community result].",
    cross_subject_bridge_note: "Mirrors Grade 2 Wit & Wisdom (A Season of Change) and Science Earth Changes cause-effect.",
    vocab: [v("government", 3, "gobierno", "the group of leaders who make and carry out laws"), v("rights", 3, "derechos", "freedoms protected for every person"), v("law", 3, "ley", "a rule made by the government")],
  },
  {
    id: "g2-ss-u2", grade: "2", subject: "Social Studies", unit_number: 2,
    unit_title: "Urban, Suburban & Rural Communities",
    unit_summary: "Students compare how geography, transportation, and land use shape urban Baltimore, suburban towns, and rural farms.",
    core_standards: ["D2.Geo.4.K-2", "D2.Geo.5.K-2"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both urban and rural communities have [similarity], whereas urban Baltimore has [difference].",
    cross_subject_bridge_note: "Directly aligns with Grade 2 Wit & Wisdom (The American West) compare-contrast.",
    vocab: [v("urban", 3, "urbano", "a busy city area with many buildings and people"), v("rural", 3, "rural", "countryside with farms and open land"), v("transportation", 3, "transporte", "ways people and goods move from place to place")],
  },
  {
    id: "g2-ss-u3", grade: "2", subject: "Social Studies", unit_number: 3,
    unit_title: "Changemakers & Primary Sources",
    unit_summary: "Students examine photographs, letters, and biographies of changemakers to sequence how ordinary people improved their communities.",
    core_standards: ["D2.His.9.K-2", "D2.His.10.K-2"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "Initially, [changemaker] saw [problem]. Then, they [action], leading to [change].",
    cross_subject_bridge_note: "Connects directly to Grade 2 Wit & Wisdom Module 3 (Civil Rights Heroes).",
    vocab: [v("primary source", 3, "fuente primaria", "an original record from the time of an event"), v("biography", 3, "biografía", "the true story of a person's life"), v("equality", 2, "igualdad", "fair and equal treatment for all")],
  },
  {
    id: "g2-ss-u4", grade: "2", subject: "Social Studies", unit_number: 4,
    unit_title: "Scarcity, Resources & Community Trade",
    unit_summary: "Students investigate natural, human, and capital resources and argue how communities make smart choices when resources are scarce.",
    core_standards: ["D2.Eco.1.K-2", "D2.Eco.7.K-2"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "When [resource] is scarce, our community should [choice] because [evidence].",
    cross_subject_bridge_note: "Shares claim-evidence language with Grade 2 Science Erosion Solutions and ELA Good Eating.",
    vocab: [v("scarcity", 3, "escasez", "not having enough of something for everyone"), v("resource", 3, "recurso", "something useful used to make goods or services"), v("trade", 2, null, "exchanging goods or services")],
  },

  // =========================================================================
  // GRADE 3 (Studies Weekly)
  // =========================================================================
  {
    id: "g3-ss-u1", grade: "3", subject: "Social Studies", unit_number: 1,
    unit_title: "Civic Participation & The Common Good",
    unit_summary: "Students study how rules, public services, and active citizenship advance the common good in Baltimore and Maryland.",
    core_standards: ["D2.Civ.2.3-5", "D2.Civ.7.3-5"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [civic example], [action] supports the common good because [evidence].",
    cross_subject_bridge_note: "Directly reinforces Grade 3 Wit & Wisdom (Outer Space) and Grade 3 Science Ecosystems claims.",
    vocab: [v("common good", 3, "bien común", "what benefits the whole community"), v("civic", 3, "cívico", "relating to citizens and public life"), v("petition", 3, "petición", "a formal request signed by citizens")],
  },
  {
    id: "g3-ss-u2", grade: "3", subject: "Social Studies", unit_number: 2,
    unit_title: "World Geography, Regions & Climate",
    unit_summary: "Students use latitude, longitude, and thematic maps to compare physical regions and how people adapt to local climates.",
    core_standards: ["D2.Geo.2.3-5", "D2.Geo.4.3-5"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both [Region A] and [Region B] share [feature], whereas [Region A] differs in [climate/landform].",
    cross_subject_bridge_note: "Bridges Grade 3 SABES Science Weather & Climate and Grade 3 Reveal Math comparisons.",
    vocab: [v("region", 3, "región", "an area sharing common geography or culture"), v("adapt", 2, "adaptar", "adjust ways of living to fit the environment"), v("hemisphere", 3, "hemisferio", "half of the Earth")],
  },
  {
    id: "g3-ss-u3", grade: "3", subject: "Social Studies", unit_number: 3,
    unit_title: "Cultural Heritage & Migration Stories",
    unit_summary: "Students investigate why groups migrate and how cultural traditions from around the world enrich Baltimore neighborhoods.",
    core_standards: ["D2.Geo.7.3-5", "D2.His.4.3-5"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "From [group/family]'s perspective, migrating to [place] meant [hope/challenge] because [reason].",
    cross_subject_bridge_note: "Directly pairs with Grade 3 Wit & Wisdom Module 3 (A New Home).",
    vocab: [v("migration", 3, "migración", "moving from one place to settle in another"), v("heritage", 2, "herencia", "traditions and history passed down"), v("diverse", 2, "diverso", "including many different cultures and backgrounds")],
  },
  {
    id: "g3-ss-u4", grade: "3", subject: "Social Studies", unit_number: 4,
    unit_title: "Interdependence, Specialization & Trade",
    unit_summary: "Students examine how specialization and the Port of Baltimore connect local producers with global trading partners.",
    core_standards: ["D2.Eco.3.3-5", "D2.Eco.14.3-5"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [region] specializes in [good], it leads to [trade/interdependence] with [partner].",
    cross_subject_bridge_note: "Mirrors Grade 3 Science Forces and Grade 3 ELA cause-and-effect sentences.",
    vocab: [v("interdependence", 3, "interdependencia", "relying on one another for goods and services"), v("specialization", 3, "especialización", "focusing on making one specific good well"), v("export", 3, "exportar", "send goods to sell in another place")],
  },

  // =========================================================================
  // GRADE 4 (BCPSS Social Studies — Maryland History)
  // =========================================================================
  {
    id: "g4-ss-u1", grade: "4", subject: "Social Studies", unit_number: 1,
    unit_title: "Maryland Geography & Indigenous Nations",
    unit_summary: "Students explore Maryland's three geographic regions and how the Piscataway, Nanticoke, and Susquehannock nations thrived along the Chesapeake.",
    core_standards: ["D2.Geo.4.3-5", "D2.His.2.3-5"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Unlike Maryland's [Region A], the [Region B] region provided [resources], shaping how Indigenous communities lived.",
    cross_subject_bridge_note: "Shares compare-contrast structure with Grade 4 Wit & Wisdom (A Great Heart) and Reveal Math.",
    vocab: [v("Indigenous", 3, "indígena", "the original native peoples of a land"), v("Piedmont", 3, "Piamonte", "Maryland's rolling hills region between coast and mountains"), v("estuary", 3, "estuario", "where freshwater rivers mix with salty ocean water")],
  },
  {
    id: "g4-ss-u2", grade: "4", subject: "Social Studies", unit_number: 2,
    unit_title: "Colonial Maryland & Enslavement",
    unit_summary: "Students analyze primary sources on the founding of Maryland, tobacco plantations, indentured servitude, and the resistance of enslaved Africans.",
    core_standards: ["D2.His.4.3-5", "D2.His.6.3-5"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because the colonial tobacco economy demanded intense labor, it led to [historical consequence] in Maryland.",
    cross_subject_bridge_note: "Reinforces Grade 4 Science Energy Transfer and Grade 4 ELA cause-and-effect framing.",
    vocab: [v("plantation", 3, "plantación", "a large farm growing cash crops with forced labor"), v("resistance", 2, "resistencia", "pushing back against unfair power"), v("colony", 3, "colonia", "a territory settled and ruled by another nation")],
  },
  {
    id: "g4-ss-u3", grade: "4", subject: "Social Studies", unit_number: 3,
    unit_title: "Maryland in the American Revolution & War of 1812",
    unit_summary: "Students investigate Maryland's role in the Revolution and the Defense of Baltimore at Fort McHenry to build evidence-based historical claims.",
    core_standards: ["D2.His.1.3-5", "D2.His.16.3-5"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [primary source], Baltimore's defense in 1814 mattered because [evidence].",
    cross_subject_bridge_note: "Directly aligns with Grade 4 Wit & Wisdom Module 3 (The Redcoats Are Coming!) and Science watershed claims.",
    vocab: [v("patriot", 3, "patriota", "a colonist who supported independence from Britain"), v("siege", 3, "sitio", "surrounding a fort or city to force surrender"), v("liberty", 2, "libertad", "freedom from oppressive control")],
  },
  {
    id: "g4-ss-u4", grade: "4", subject: "Social Studies", unit_number: 4,
    unit_title: "Maryland Government, Abolition & Modern Baltimore",
    unit_summary: "Students trace Harriet Tubman and Frederick Douglass's leadership in Maryland and examine how state and Baltimore City government work today.",
    core_standards: ["D2.Civ.1.3-5", "D2.His.3.3-5"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "Initially, [Maryland leader] confronted [injustice]; following [turning point], [reform unfolded].",
    cross_subject_bridge_note: "Connects to Grade 4 ELA narrative arcs and chronological historical writing.",
    vocab: [v("abolitionist", 3, "abolicionista", "a person who fought to end slavery"), v("legislature", 3, "legislatura", "the branch of government that makes laws"), v("freedom", 2, null, "the right to live without enslavement or oppression")],
  },

  // =========================================================================
  // GRADE 5 (BCPSS Social Studies — Early US History)
  // =========================================================================
  {
    id: "g5-ss-u1", grade: "5", subject: "Social Studies", unit_number: 1,
    unit_title: "Indigenous Nations & European Encounters",
    unit_summary: "Students examine complex Indigenous societies across North America and evaluate the economic and cultural impacts of European colonization.",
    core_standards: ["D2.His.4.3-5", "D2.Geo.8.3-5"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both [Indigenous Nation] and European settlers relied on [resource], whereas their views of land differed in [contrast].",
    cross_subject_bridge_note: "Directly reinforces Grade 5 Wit & Wisdom Module 1 (Cultures in Conflict).",
    vocab: [v("sovereignty", 3, "soberanía", "a nation's right to govern itself"), v("colonization", 3, "colonización", "taking control of land and people in another territory"), v("exchange", 2, null, "trading goods, ideas, or crops between groups")],
  },
  {
    id: "g5-ss-u2", grade: "5", subject: "Social Studies", unit_number: 2,
    unit_title: "Road to Revolution & Declaration of Independence",
    unit_summary: "Students trace how colonial taxation, boycotts, and Enlightenment ideals led to the Declaration of Independence.",
    core_standards: ["D2.His.14.3-5", "D2.Civ.8.3-5"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because Parliament imposed [tax/act] without representation, colonists responded with [effect].",
    cross_subject_bridge_note: "Shares cause-effect framing with Grade 5 Science Earth's Systems and Wit & Wisdom Breaking Barriers.",
    vocab: [v("representation", 3, "representación", "having a voice and vote in government"), v("grievance", 3, null, "a formal complaint about unfair treatment"), v("boycott", 3, "boicot", "refusing to buy goods as a protest")],
  },
  {
    id: "g5-ss-u3", grade: "5", subject: "Social Studies", unit_number: 3,
    unit_title: "The U.S. Constitution, Rights & Checks and Balances",
    unit_summary: "Students analyze the three branches of government, the Bill of Rights, and the contradictions between liberty and slavery in the founding era.",
    core_standards: ["D2.Civ.4.3-5", "D2.Civ.10.3-5"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to the Constitution, [branch/amendment] protects citizens by [cited evidence].",
    cross_subject_bridge_note: "Directly matches Grade 5 Wit & Wisdom (A War Between Us) and Science Conservation of Matter claims.",
    vocab: [v("constitution", 3, "constitución", "the supreme written plan of government"), v("amendment", 3, "enmienda", "a formal change or addition to the Constitution"), v("checks and balances", 3, null, "system keeping any one branch from having too much power")],
  },
  {
    id: "g5-ss-u4", grade: "5", subject: "Social Studies", unit_number: 4,
    unit_title: "Westward Expansion & Sectional Tensions",
    unit_summary: "Students evaluate how territorial expansion impacted Indigenous nations, Mexican territories, and the growing national conflict over slavery.",
    core_standards: ["D2.His.6.3-5", "D2.Geo.7.3-5"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "From [group]'s perspective, westward expansion meant [impact] because [historical motivation].",
    cross_subject_bridge_note: "Connects to Grade 5 ELA perspective analysis and primary-source inquiry.",
    vocab: [v("expansion", 2, "expansión", "growing into new territory"), v("treaty", 3, "tratado", "a formal agreement between nations"), v("sectionalism", 3, "seccionalismo", "loyalty to one's region over the whole country")],
  },

  // =========================================================================
  // GRADE 6 (BCPSS Social Studies — Ancient Civilizations)
  // =========================================================================
  {
    id: "g6-ss-u1", grade: "6", subject: "Social Studies", unit_number: 1,
    unit_title: "Early Humans & Agricultural Revolution",
    unit_summary: "Students trace how early humans adapted to diverse environments and how the shift from foraging to farming created permanent settlements and surplus.",
    core_standards: ["D2.His.1.6-8", "D2.Geo.4.6-8"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because early communities developed [agriculture/irrigation], they produced a surplus that led to [social specialization].",
    cross_subject_bridge_note: "Shares cause-effect framing directly with Grade 6 Wit & Wisdom (Resilience in the Great Depression) and IQWST Water & Particles.",
    vocab: [v("surplus", 3, null, "more food or goods than needed for immediate survival"), v("domestication", 3, "domesticación", "taming plants or animals for human use"), v("specialization", 3, "especialización", "focusing on specific skilled jobs"), v("nomadic", 3, "nómada", "moving from place to place for food")],
  },
  {
    id: "g6-ss-u2", grade: "6", subject: "Social Studies", unit_number: 2,
    unit_title: "River Valley Civilizations: Mesopotamia, Egypt & Kush",
    unit_summary: "Students compare how the Tigris, Euphrates, and Nile rivers enabled governance, writing systems (cuneiform, hieroglyphics), law codes, and trade.",
    core_standards: ["D2.Geo.5.6-8", "D2.His.2.6-8"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both Mesopotamia and Ancient Egypt relied on river flooding for fertile silt; however, [civilization A] differed in [governance/writing].",
    cross_subject_bridge_note: "Pairs with Grade 6 IQWST Water Erosion/Deposition and Grade 6 Reveal Math comparing ratios and distributions.",
    vocab: [v("irrigation", 3, "irrigación", "bringing water to crops through canals"), v("cuneiform", 3, "cuneiforme", "wedge-shaped Mesopotamian writing"), v("dynasty", 3, "dinastía", "a line of rulers from the same family"), v("civilization", 3, "civilización", "complex society with cities, government, and writing")],
  },
  {
    id: "g6-ss-u3", grade: "6", subject: "Social Studies", unit_number: 3,
    unit_title: "Classical Civilizations: India, China & Silk Road",
    unit_summary: "Students examine philosophies, empires, and cultural exchange across Ancient India, China, and the Silk Road trade network.",
    core_standards: ["D2.Eco.14.6-8", "D2.His.14.6-8"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "Initially, trade along the Silk Road connected [regions]; over time, this exchange spread [ideas/innovations].",
    cross_subject_bridge_note: "Links directly to Grade 6 Wit & Wisdom Module 2 (Ramayana / A Hero's Journey) cultural context.",
    vocab: [v("cultural diffusion", 3, "difusión cultural", "spread of ideas, art, and technology between societies"), v("empire", 3, "imperio", "many territories united under one supreme ruler"), v("philosophy", 3, "filosofía", "a system of ideas about ethics and how to live"), v("monsoon", 3, "monzón", "seasonal wind bringing heavy rain")],
  },
  {
    id: "g6-ss-u4", grade: "6", subject: "Social Studies", unit_number: 4,
    unit_title: "Classical Mediterranean: Ancient Greece & Rome",
    unit_summary: "Students evaluate Athenian democracy, Roman republican institutions, and citizenship limits using primary sources to build historical arguments.",
    core_standards: ["D2.Civ.3.6-8", "D2.His.16.6-8"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [primary source], [Athens/Rome] expanded or limited citizenship by [cited evidence].",
    cross_subject_bridge_note: "Transfers directly to Grade 6 Wit & Wisdom (Courage in Crisis) and Grade 6 IQWST Ecology evidence claims.",
    vocab: [v("democracy", 3, "democracia", "government in which citizens hold voting power"), v("republic", 3, "república", "government where citizens elect representatives"), v("citizenship", 3, "ciudadanía", "legal membership with rights and duties"), v("primary source", 3, "fuente primaria", "firsthand historical document or artifact")],
  },

  // =========================================================================
  // GRADE 7 (BCPSS Social Studies — World Geography)
  // =========================================================================
  {
    id: "g7-ss-u1", grade: "7", subject: "Social Studies", unit_number: 1,
    unit_title: "Geographic Tools & Human-Environment Interaction",
    unit_summary: "Students use GIS layers, climate graphs, and population maps to explain how physical geography shapes settlement and resource use.",
    core_standards: ["D2.Geo.1.6-8", "D2.Geo.4.6-8"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [physical feature/climate] limits/provides [resource], human settlement in [region] results in [adaptation].",
    cross_subject_bridge_note: "Directly aligns with Grade 7 IQWST Weather Systems and Grade 7 Wit & Wisdom (Fever).",
    vocab: [v("cartography", 3, "cartografía", "the science of making maps"), v("urbanization", 3, "urbanización", "growth of cities as people move from rural areas"), v("infrastructure", 3, "infraestructura", "roads, water, power, and transit systems")],
  },
  {
    id: "g7-ss-u2", grade: "7", subject: "Social Studies", unit_number: 2,
    unit_title: "Population, Migration & Cultural Regions",
    unit_summary: "Students analyze push and pull factors behind global migration and compare how cultural regions maintain identity in a connected world.",
    core_standards: ["D2.Geo.7.6-8", "D2.Geo.8.6-8"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "While [Region A] experiences [push/pull factor], [Region B] contrasts in [demographic trend].",
    cross_subject_bridge_note: "Shares compare-contrast framing with Grade 7 Wit & Wisdom (Americans All) and Reveal Math proportions.",
    vocab: [v("demographics", 3, "demografía", "statistical data about a human population"), v("push-pull factor", 3, null, "conditions driving people away or attracting them to a place"), v("globalization", 3, "globalización", "growing worldwide links in trade and culture")],
  },
  {
    id: "g7-ss-u3", grade: "7", subject: "Social Studies", unit_number: 3,
    unit_title: "Global Resources, Trade & Economic Systems",
    unit_summary: "Students evaluate how unequal distribution of natural resources drives international trade, development, and environmental policy debates.",
    core_standards: ["D2.Eco.14.6-8", "D2.Geo.11.6-8"],
    blueprint_id: "argue-counterclaim-rebuttal",
    unit_example_frame: "Although proponents of [resource policy] argue [counterclaim], geographic data shows [rebuttal].",
    cross_subject_bridge_note: "Mirrors Grade 7 Wit & Wisdom Module 3 (Language and Power) counterclaim-rebuttal structure.",
    vocab: [v("sustainability", 2, "sostenibilidad", "meeting present needs without harming future generations"), v("import", 3, "importar", "bring goods into a country to buy"), v("economic indicator", 3, "indicador económico", "measure of a region's wealth and well-being")],
  },
  {
    id: "g7-ss-u4", grade: "7", subject: "Social Studies", unit_number: 4,
    unit_title: "Global Civic Challenges & Environmental Stewardship",
    unit_summary: "Students investigate freshwater scarcity, climate resilience, and international cooperation to propose evidence-based civic solutions.",
    core_standards: ["D2.Civ.10.6-8", "D2.Geo.12.6-8"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [UN/geographic data], [stewardship policy] is most effective because [evidence].",
    cross_subject_bridge_note: "Shares claim-evidence language with Grade 7 IQWST Chemistry and Reveal Math statistics.",
    vocab: [v("stewardship", 2, null, "responsible care for shared natural resources"), v("scarcity", 3, "escasez", "shortage of a vital resource"), v("mitigation", 3, "mitigación", "actions taken to reduce severe harm")],
  },

  // =========================================================================
  // GRADE 8 (BCPSS Social Studies — US History through Reconstruction)
  // =========================================================================
  {
    id: "g8-ss-u1", grade: "8", subject: "Social Studies", unit_number: 1,
    unit_title: "Constitutional Foundations & Early Republic",
    unit_summary: "Students analyze Federalist vs. Anti-Federalist debates, judicial review, and how constitutional compromises shaped the Early Republic.",
    core_standards: ["D2.Civ.4.6-8", "D2.His.14.6-8"],
    blueprint_id: "argue-counterclaim-rebuttal",
    unit_example_frame: "Although [Federalists/Anti-Federalists] contended [counterclaim], primary evidence demonstrates [rebuttal].",
    cross_subject_bridge_note: "Directly shares counterclaim-rebuttal syntax with Grade 8 Wit & Wisdom Module 3 (What Is Love?).",
    vocab: [v("federalism", 3, "federalismo", "division of power between national and state governments"), v("ratify", 3, "ratificar", "formally approve a constitution or treaty"), v("compromise", 2, "compromiso", "agreement where each side gives up something")],
  },
  {
    id: "g8-ss-u2", grade: "8", subject: "Social Studies", unit_number: 2,
    unit_title: "Expansion, Reform Movements & Abolition",
    unit_summary: "Students evaluate Jacksonian democracy, Indian Removal, the Seneca Falls Convention, and Baltimore's abolitionist networks.",
    core_standards: ["D2.His.4.6-8", "D2.Civ.12.6-8"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "From [reformer/Indigenous leader]'s perspective, [policy/movement] exposed [tension] because [evidence].",
    cross_subject_bridge_note: "Connects to Grade 8 Wit & Wisdom Module 1 voice and perspective analysis.",
    vocab: [v("suffrage", 3, "sufragio", "the legal right to vote"), v("reform", 2, "reforma", "organized effort to improve society or laws"), v("abolition", 3, "abolición", "the movement to immediately end slavery")],
  },
  {
    id: "g8-ss-u3", grade: "8", subject: "Social Studies", unit_number: 3,
    unit_title: "Sectionalism & The American Civil War",
    unit_summary: "Students trace how economic divergence, the Dred Scott decision, and secession led to the Civil War and the Emancipation Proclamation.",
    core_standards: ["D2.His.14.6-8", "D2.His.15.6-8"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [sectional crisis/event] deepened the conflict over slavery, it precipitated [Civil War consequence].",
    cross_subject_bridge_note: "Directly aligns with Grade 8 Wit & Wisdom (The Great War) and IQWST Forces cause-effect.",
    vocab: [v("secession", 3, "secesión", "formal withdrawal of a state from the Union"), v("emancipation", 3, "emancipación", "the act of freeing enslaved people"), v("sectionalism", 3, "seccionalismo", "putting regional interests above national unity")],
  },
  {
    id: "g8-ss-u4", grade: "8", subject: "Social Studies", unit_number: 4,
    unit_title: "Reconstruction & The Unfinished Promise of Equality",
    unit_summary: "Students evaluate the 13th, 14th, and 15th Amendments, Black political leadership, and the rise of Jim Crow to assess Reconstruction's legacy.",
    core_standards: ["D2.Civ.8.6-8", "D2.His.16.6-8"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [14th Amendment/primary source], Reconstruction transformed American democracy by [cited evidence].",
    cross_subject_bridge_note: "Directly connects to Grade 8 Wit & Wisdom Module 4 (Teens as Change Agents) Civil Rights legacy.",
    vocab: [v("Reconstruction", 3, "Reconstrucción", "post-Civil War era rebuilding the nation and expanding rights"), v("amendment", 3, "enmienda", "a constitutional addition guaranteeing rights"), v("citizenship", 3, "ciudadanía", "equal legal protection and voting rights under law")],
  },
];

const built = buildUnitsAndConnections(SOCIAL_STUDIES_SPECS);
export const SOCIAL_STUDIES_UNITS = built.units;
export const SOCIAL_STUDIES_CONNECTIONS = built.connections;
