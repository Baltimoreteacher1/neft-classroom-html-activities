// 36 authentic BCPSS ELA units (4 Wit & Wisdom modules per grade K-8).
// K-3: Wit & Wisdom + Fundations (with phonics/morphology watchouts).
// 4-8: Wit & Wisdom.

import { buildUnitsAndConnections } from "./_builder.mjs";

const v = (term, tier, cognate_es, kid_def) => ({ term, tier, cognate_es, kid_def });

const ELA_SPECS = [
  // =========================================================================
  // KINDERGARTEN (Wit & Wisdom + Fundations)
  // =========================================================================
  {
    id: "gk-ela-u1", grade: "K", subject: "ELA", unit_number: 1,
    unit_title: "The Five Senses",
    unit_summary: "Students explore how people use their five senses to learn about the world through rich read-alouds, informational books, and Fundations letter-sound routines.",
    core_standards: ["RL.K.1", "RI.K.2", "RF.K.3", "SL.K.1"],
    blueprint_id: "inform-summarize-main-idea",
    unit_example_frame: "This book is mostly about how we use our [sense] to notice [detail].",
    cross_subject_bridge_note: "Transfers directly to K SABES Science (Weather & Pushes) when students report sensory observations.",
    vocab: [v("senses", 3, "sentidos", "ways our body sees, hears, smells, tastes, and feels"), v("observe", 2, "observar", "look closely to learn"), v("detail", 2, "detalle", "a small piece of information")],
  },
  {
    id: "gk-ela-u2", grade: "K", subject: "ELA", unit_number: 2,
    unit_title: "Once Upon a Farm",
    unit_summary: "Students study farm life, story elements, and character actions in classic farm stories while blending CVC words in Fundations.",
    core_standards: ["RL.K.3", "W.K.3", "RF.K.2", "L.K.1"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "First, the [character] [action]. Next, they [event] on the farm.",
    cross_subject_bridge_note: "Matches K Studies Weekly community timelines and K Math story-problem sequencing.",
    vocab: [v("character", 3, "carácter / personaje", "a person or animal in a story"), v("setting", 3, null, "where and when a story happens"), v("sequence", 2, "secuencia", "the order events happen")],
  },
  {
    id: "gk-ela-u3", grade: "K", subject: "ELA", unit_number: 3,
    unit_title: "America, Then and Now",
    unit_summary: "Students compare how daily life, homes, schools, and transportation in America have changed from the past to the present.",
    core_standards: ["RI.K.3", "RI.K.9", "W.K.2", "RF.K.3"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "In the past, people [past detail], but today people [present detail].",
    cross_subject_bridge_note: "Directly reinforces K Studies Weekly Past & Present and K Math attribute comparisons.",
    vocab: [v("past", 2, "pasado", "a time before now"), v("present", 2, "presente", "right now"), v("compare", 2, "comparar", "tell how two things are alike or different")],
  },
  {
    id: "gk-ela-u4", grade: "K", subject: "ELA", unit_number: 4,
    unit_title: "The Continents",
    unit_summary: "Students travel across the seven continents through literature and maps, forming opinions about places they would like to visit.",
    core_standards: ["RI.K.1", "W.K.1", "SL.K.4", "RF.K.4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "I want to visit [continent] because the text shows [fact/landmark].",
    cross_subject_bridge_note: "Connects to K Studies Weekly Geography and K Science evidence-based sharing.",
    vocab: [v("continent", 3, "continente", "a very large area of land on Earth"), v("opinion", 2, "opinión", "what someone thinks or feels"), v("landmark", 3, null, "a famous place or feature")],
  },

  // =========================================================================
  // GRADE 1 (Wit & Wisdom + Fundations)
  // =========================================================================
  {
    id: "g1-ela-u1", grade: "1", subject: "ELA", unit_number: 1,
    unit_title: "A World of Books",
    unit_summary: "Students discover how books travel to children around the world and how reading changes lives, paired with Fundations digraphs and glued sounds.",
    core_standards: ["RL.1.2", "RI.1.1", "W.1.3", "RF.1.3"],
    blueprint_id: "narrate-problem-resolution",
    unit_example_frame: "The problem was [obstacle], so [character] got books by [action].",
    cross_subject_bridge_note: "Reinforces Grade 1 Studies Weekly community helpers solving neighborhood needs.",
    vocab: [v("library", 2, "librería (false friend: biblioteca)", "a place to borrow books"), v("problem", 2, "problema", "something hard that needs a fix"), v("resolution", 3, "resolución", "how a problem is solved")],
  },
  {
    id: "g1-ela-u2", grade: "1", subject: "ELA", unit_number: 2,
    unit_title: "Creature Features",
    unit_summary: "Students investigate how animal body parts help creatures survive, gathering facts to write informative paragraphs.",
    core_standards: ["RI.1.2", "RI.1.5", "W.1.2", "RF.1.3"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "A [animal] has [body part], which helps it [survival action] because [reason].",
    cross_subject_bridge_note: "Shares cause-and-effect syntax directly with Grade 1 SABES Science Animal & Plant Parts.",
    vocab: [v("feature", 2, null, "an important part of something"), v("survive", 2, "sobrevivir", "stay alive"), v("protect", 2, "proteger", "keep safe from harm")],
  },
  {
    id: "g1-ela-u3", grade: "1", subject: "ELA", unit_number: 3,
    unit_title: "Powerful Forces",
    unit_summary: "Students explore how wind and emotions act as powerful forces in stories and informational texts while mastering Fundations consonant blends.",
    core_standards: ["RL.1.4", "RI.1.3", "W.1.3", "SL.1.4"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "First, the wind [action]. Then, [character] felt [emotion] and [response].",
    cross_subject_bridge_note: "Bridges Grade 1 Science Light & Sound waves and Grade 1 Social Studies timelines.",
    vocab: [v("force", 3, "fuerza", "a push or pull that makes things move"), v("powerful", 2, null, "very strong"), v("emotion", 2, "emoción", "a strong feeling")],
  },
  {
    id: "g1-ela-u4", grade: "1", subject: "ELA", unit_number: 4,
    unit_title: "Cinderella Stories",
    unit_summary: "Students compare Cinderella folktales from cultures around the world and argue which character shows the greatest admirable trait.",
    core_standards: ["RL.1.9", "W.1.1", "SL.1.1", "RF.1.4"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both [Story A] and [Story B] have [similarity], but [Story B] has [difference].",
    cross_subject_bridge_note: "Transfers directly to Grade 1 Reveal Math comparing numbers and 2D/3D shapes.",
    vocab: [v("culture", 2, "cultura", "the traditions and ways a group lives"), v("admirable", 2, "admirable", "deserving respect"), v("version", 2, "versión", "one telling of a story")],
  },

  // =========================================================================
  // GRADE 2 (Wit & Wisdom + Fundations)
  // =========================================================================
  {
    id: "g2-ela-u1", grade: "2", subject: "ELA", unit_number: 1,
    unit_title: "A Season of Change",
    unit_summary: "Students examine how seasonal changes transform nature and characters through poetry, fiction, and Fundations syllable-type decoding.",
    core_standards: ["RL.2.2", "RI.2.3", "W.2.2", "RF.2.3"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because the season changes to [season], [plant/animal] responds by [change].",
    cross_subject_bridge_note: "Mirrors Grade 2 SABES Science Landform Changes and Plant/Pollinator cause-and-effect.",
    vocab: [v("cycle", 3, "ciclo", "events that repeat in the same order"), v("change", 2, "cambio", "become different"), v("evidence", 2, "evidencia", "proof from the text")],
  },
  {
    id: "g2-ela-u2", grade: "2", subject: "ELA", unit_number: 2,
    unit_title: "The American West",
    unit_summary: "Students study life in the American West—including Indigenous peoples, buffalo, and pioneers—comparing perspectives across historical texts.",
    core_standards: ["RI.2.6", "RL.2.9", "W.2.2", "RF.2.3"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both [group/text A] and [group/text B] depended on [resource], whereas [difference].",
    cross_subject_bridge_note: "Aligns with Grade 2 Studies Weekly Communities & Geography and Reveal Math comparing lengths.",
    vocab: [v("prairie", 3, "pradera", "a large flat area of grassland"), v("pioneer", 3, "pionero", "an early settler moving to a new area"), v("legend", 3, "leyenda", "an old story passed down over time")],
  },
  {
    id: "g2-ela-u3", grade: "2", subject: "ELA", unit_number: 3,
    unit_title: "Civil Rights Heroes",
    unit_summary: "Students read biographies of Martin Luther King Jr., Ruby Bridges, and Sylvia Mendez to explain how courageous people responded to injustice.",
    core_standards: ["RI.2.3", "RI.2.6", "W.2.3", "SL.2.2"],
    blueprint_id: "narrate-sequence-events",
    unit_example_frame: "Initially, [leader] faced [injustice]; following [action], [change occurred].",
    cross_subject_bridge_note: "Supports Grade 2 Studies Weekly Civics & Rights and chronological recounts.",
    vocab: [v("injustice", 2, "injusticia", "unfair treatment"), v("courage", 2, "coraje", "bravery to do what is right"), v("respond", 2, "responder", "act or answer because of something")],
  },
  {
    id: "g2-ela-u4", grade: "2", subject: "ELA", unit_number: 4,
    unit_title: "Good Eating",
    unit_summary: "Students trace how food nourishes our bodies and communities, building evidence-based opinion paragraphs about healthy choices.",
    core_standards: ["RI.2.8", "W.2.1", "SL.2.1", "RF.2.4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [text], [food choice] nourishes our body because [evidence].",
    cross_subject_bridge_note: "Reinforces Grade 2 Science Matter Properties evidence claims and Studies Weekly Economics.",
    vocab: [v("nourish", 2, "nutrir", "give the food needed to grow and stay healthy"), v("digestive", 3, "digestivo", "body system that breaks down food"), v("nutrient", 3, "nutriente", "a helpful substance in food")],
  },

  // =========================================================================
  // GRADE 3 (Wit & Wisdom + Fundations)
  // =========================================================================
  {
    id: "g3-ela-u1", grade: "3", subject: "ELA", unit_number: 1,
    unit_title: "The Sea",
    unit_summary: "Students investigate why people explore the ocean through literature and marine science texts while applying Fundations multisyllabic morphology.",
    core_standards: ["RL.3.2", "RI.3.1", "W.3.2", "RF.3.3"],
    blueprint_id: "inform-summarize-main-idea",
    unit_example_frame: "The central idea of [text] is that ocean exploration reveals [idea], shown by [detail].",
    cross_subject_bridge_note: "Transfers to Grade 3 SABES Science Ecosystems and Studies Weekly Geography.",
    vocab: [v("explore", 2, "explorar", "travel to learn about an unknown place"), v("ecosystem", 3, "ecosistema", "living and nonliving things interacting"), v("central idea", 3, "idea central", "the main point an author makes")],
  },
  {
    id: "g3-ela-u2", grade: "3", subject: "ELA", unit_number: 2,
    unit_title: "Outer Space",
    unit_summary: "Students examine how scientists and astronauts learn about space, writing opinion essays grounded in historical and scientific evidence.",
    core_standards: ["RI.3.8", "W.3.1", "SL.3.4", "RF.3.3"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [source], [space achievement] was essential because [evidence].",
    cross_subject_bridge_note: "Shares claim-evidence language with Grade 3 Science Forces & Motion and Social Studies.",
    vocab: [v("orbit", 3, "órbita", "the curved path around a star or planet"), v("astronaut", 3, "astronauta", "a person trained to travel in space"), v("evidence", 2, "evidencia", "facts that prove a claim")],
  },
  {
    id: "g3-ela-u3", grade: "3", subject: "ELA", unit_number: 3,
    unit_title: "A New Home",
    unit_summary: "Students read stories of immigrants building new lives in America, analyzing how characters' perspectives shape their narratives.",
    core_standards: ["RL.3.6", "W.3.3", "SL.3.1", "RF.3.4"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "From [character]'s perspective, arriving in a new home felt [emotion] because [reason].",
    cross_subject_bridge_note: "Bridges Grade 3 Studies Weekly Culture & Migration and Grade 3 ELA narrative voice.",
    vocab: [v("immigrant", 3, "inmigrante", "a person who moves to live in a new country"), v("perspective", 2, "perspectiva", "the way someone sees a situation"), v("tradition", 2, "tradición", "a custom passed down in a family or group")],
  },
  {
    id: "g3-ela-u4", grade: "3", subject: "ELA", unit_number: 4,
    unit_title: "Artists Make Art",
    unit_summary: "Students study diverse visual artists, dancers, and poets to explain what inspires artists and how their work impacts communities.",
    core_standards: ["RI.3.3", "RL.3.7", "W.3.2", "L.3.4"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [artist] experienced [inspiration], their artwork expresses [effect].",
    cross_subject_bridge_note: "Connects to Grade 3 Science Weather Patterns and Reveal Math cause-effect pattern rules.",
    vocab: [v("inspire", 2, "inspirar", "fill someone with a creative idea"), v("technique", 3, "técnica", "a skilled way of making art"), v("impact", 2, "impacto", "a strong effect on someone or something")],
  },

  // =========================================================================
  // GRADE 4 (Wit & Wisdom)
  // =========================================================================
  {
    id: "g4-ela-u1", grade: "4", subject: "ELA", unit_number: 1,
    unit_title: "A Great Heart",
    unit_summary: "Students explore both the literal circulatory heart and figurative 'great heart' through poetry, biography, and informational texts.",
    core_standards: ["RL.4.2", "RI.4.4", "W.4.2", "L.4.5"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "While a literal heart [biological role], a figurative 'great heart' shows [character trait].",
    cross_subject_bridge_note: "Transfers to Grade 4 Reveal Math comparing multi-digit fractions and MD History regions.",
    vocab: [v("figurative", 3, "figurativo", "meaning beyond the exact dictionary words"), v("literal", 3, "literal", "exact, word-for-word meaning"), v("compassion", 2, "compasión", "deep care for others' suffering")],
  },
  {
    id: "g4-ela-u2", grade: "4", subject: "ELA", unit_number: 2,
    unit_title: "Extreme Settings",
    unit_summary: "Students read Hatchet and survival nonfiction to analyze how extreme environments test human resilience and problem-solving.",
    core_standards: ["RL.4.3", "RI.4.3", "W.4.3", "SL.4.1"],
    blueprint_id: "narrate-problem-resolution",
    unit_example_frame: "Faced with [environmental hazard], [character] adapted by [strategy], which led to [outcome].",
    cross_subject_bridge_note: "Reinforces Grade 4 SABES Science Earth's Changing Surface & Natural Hazards.",
    vocab: [v("resilience", 2, "resiliencia", "ability to recover from hard challenges"), v("environment", 2, "ambiente", "the natural surroundings"), v("adapt", 2, "adaptar", "change behavior to survive")],
  },
  {
    id: "g4-ela-u3", grade: "4", subject: "ELA", unit_number: 3,
    unit_title: "The Redcoats Are Coming!",
    unit_summary: "Students examine multiple perspectives on the American Revolution—Patriots, Loyalists, Indigenous nations, and enslaved people—to write evidence-based arguments.",
    core_standards: ["RI.4.6", "RL.4.6", "W.4.1", "SL.4.4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [primary/secondary text], [group] supported/opposed independence because [evidence].",
    cross_subject_bridge_note: "Directly aligns with Grade 4 BCPSS Social Studies Colonial Maryland & Revolution.",
    vocab: [v("revolution", 3, "revolución", "a major overthrow of a government"), v("perspective", 2, "perspectiva", "point of view shaped by experience"), v("independence", 3, "independencia", "freedom from outside control")],
  },
  {
    id: "g4-ela-u4", grade: "4", subject: "ELA", unit_number: 4,
    unit_title: "Myth Making",
    unit_summary: "Students study Greek and Native American myths to explain how stories make sense of natural phenomena and human values.",
    core_standards: ["RL.4.9", "W.4.2", "L.4.4", "SL.4.2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "In the myth, [character's choice] causes [consequence], which explains [natural/human theme].",
    cross_subject_bridge_note: "Mirrors Grade 4 Science Energy Transfer and Social Studies historical cause-and-effect.",
    vocab: [v("myth", 3, "mito", "a traditional story explaining nature or beliefs"), v("theme", 3, "tema", "the central message of a story"), v("consequence", 2, "consecuencia", "a result of an action")],
  },

  // =========================================================================
  // GRADE 5 (Wit & Wisdom)
  // =========================================================================
  {
    id: "g5-ela-u1", grade: "5", subject: "ELA", unit_number: 1,
    unit_title: "Cultures in Conflict",
    unit_summary: "Students read Thunder Rolling in the Mountains to analyze how cultural values collided during Nez Perce displacement and westward expansion.",
    core_standards: ["RL.5.6", "RI.5.6", "W.5.2", "SL.5.1"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "Both [group A] and [group B] valued [belief], whereas they diverged sharply over [conflict].",
    cross_subject_bridge_note: "Directly bridges Grade 5 BCPSS Social Studies Early U.S. History & Indigenous Nations.",
    vocab: [v("conflict", 2, "conflicto", "a serious disagreement or struggle"), v("values", 2, "valores", "deeply held beliefs about what matters"), v("displacement", 3, "desplazamiento", "being forced from one's homeland")],
  },
  {
    id: "g5-ela-u2", grade: "5", subject: "ELA", unit_number: 2,
    unit_title: "Word Play",
    unit_summary: "Students read The Phantom Tollbooth to explore how authors use puns, idioms, and wordplay to build humor and deeper meaning.",
    core_standards: ["RL.5.4", "RL.5.5", "W.5.3", "L.5.5"],
    blueprint_id: "narrate-problem-resolution",
    unit_example_frame: "When Milo encountered [wordplay obstacle], he solved it by [realization], proving [theme].",
    cross_subject_bridge_note: "Strengthens precision with multiple-meaning words across Grade 5 Math and Science.",
    vocab: [v("idiom", 3, "modismo", "a phrase whose meaning differs from its literal words"), v("ambiguity", 3, "ambigüedad", "having more than one possible meaning"), v("narrative", 3, "narrativa", "a spoken or written story")],
  },
  {
    id: "g5-ela-u3", grade: "5", subject: "ELA", unit_number: 3,
    unit_title: "A War Between Us",
    unit_summary: "Students analyze how the American Civil War impacted soldiers, families, and enslaved people through The River Between Us and primary sources.",
    core_standards: ["RL.5.3", "RI.5.9", "W.5.1", "SL.5.4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "Based on [source], the Civil War transformed [group] because [evidence].",
    cross_subject_bridge_note: "Shares argument structure with Grade 5 Social Studies Founding Documents & Civic Debate.",
    vocab: [v("abolition", 3, "abolición", "the movement to end slavery"), v("division", 2, "división", "splitting into opposing sides"), v("corroborate", 2, "corroborar", "confirm with another source")],
  },
  {
    id: "g5-ela-u4", grade: "5", subject: "ELA", unit_number: 4,
    unit_title: "Breaking Barriers",
    unit_summary: "Students study Jackie Robinson and Negro Leagues baseball to explain how sports can challenge discrimination and unite communities.",
    core_standards: ["RI.5.2", "RI.5.8", "W.5.2", "SL.5.2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [athlete/team] broke [barrier], [social/community effect] followed as a result.",
    cross_subject_bridge_note: "Reinforces Grade 5 SABES Science Earth Systems cause-effect chains.",
    vocab: [v("barrier", 2, "barrera", "an obstacle that blocks progress"), v("integration", 3, "integración", "bringing separated groups together equally"), v("legacy", 2, "legado", "lasting impact left for future generations")],
  },

  // =========================================================================
  // GRADE 6 (Wit & Wisdom — Gold Standard BCPSS Modules)
  // =========================================================================
  {
    id: "g6-ela-u1", grade: "6", subject: "ELA", unit_number: 1,
    unit_title: "Resilience in the Great Depression",
    unit_summary: "Students read Bud, Not Buddy and Out of the Dust alongside Depression-era photography to examine how hardship shapes human resilience and community.",
    core_standards: ["RL.6.2", "RL.6.3", "RI.6.7", "W.6.2"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because the Great Depression caused [economic/environmental hardship], [character] responded by [resilient action].",
    cross_subject_bridge_note: "Directly shares cause-and-effect framing with Grade 6 IQWST Science (smell/particle diffusion & water erosion) and Ancient Civilizations river-valley settlement.",
    vocab: [v("resilience", 2, "resiliencia", "strength to keep going through severe hardship"), v("hardship", 2, null, "severe suffering or lack of basic needs"), v("drought", 3, null, "a long period with little or no rain"), v("dignity", 2, "dignidad", "self-respect and worth")],
  },
  {
    id: "g6-ela-u2", grade: "6", subject: "ELA", unit_number: 2,
    unit_title: "A Hero's Journey",
    unit_summary: "Students study The Odyssey and Ramayana: Divine Loophole to trace the monomyth archetype and analyze how trials transform a hero.",
    core_standards: ["RL.6.3", "RL.6.5", "W.6.3", "SL.6.1"],
    blueprint_id: "narrate-problem-resolution",
    unit_example_frame: "Faced with [mythic trial], [hero] relied on [trait/strategy], which transformed them by [resolution].",
    cross_subject_bridge_note: "Connects directly to Grade 6 Ancient Civilizations (Ancient Greece & Ancient India) cultural texts and problem-resolution narratives.",
    vocab: [v("archetype", 3, "arquetipo", "a classic pattern or character type seen across cultures"), v("odyssey", 3, "odisea", "a long, challenging journey full of tests"), v("transformation", 2, "transformación", "a deep change in character or form"), v("hubris", 3, null, "excessive pride that leads to a downfall")],
  },
  {
    id: "g6-ela-u3", grade: "6", subject: "ELA", unit_number: 3,
    unit_title: "Narrating the Unknown",
    unit_summary: "Students read Blood on the River and primary accounts of Jamestown to analyze how narrator perspective and social power shape historical storytelling.",
    core_standards: ["RL.6.6", "RI.6.6", "W.6.1", "SL.6.4"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "From [character/witness]'s perspective, the Jamestown encounter revealed [tension] because [motivation].",
    cross_subject_bridge_note: "Pairs with Grade 6 Ancient Civilizations primary-source perspective analysis and Grade 6 Reveal Math comparing representations.",
    vocab: [v("perspective", 2, "perspectiva", "a narrator's lens shaped by status and experience"), v("colony", 3, "colonia", "a settlement ruled by a distant nation"), v("alliance", 2, "alianza", "an agreement between groups to work together"), v("bias", 2, null, "a leaning that favors one viewpoint")],
  },
  {
    id: "g6-ela-u4", grade: "6", subject: "ELA", unit_number: 4,
    unit_title: "Courage in Crisis",
    unit_summary: "Students examine Shackleton's Antarctic expedition in Shipwreck at the Bottom of the World and I Am Malala to argue how individuals show courage during crises.",
    core_standards: ["RI.6.8", "RI.6.9", "W.6.1", "SL.6.4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [text], [leader/figure] demonstrated true courage in crisis because [cited evidence].",
    cross_subject_bridge_note: "Transfers directly to Grade 6 IQWST Ecology claims (Where Have All the Creatures Gone?) and Ancient Civilizations evidence-based debates.",
    vocab: [v("crisis", 2, "crisis", "a sudden, dangerous turning point"), v("perseverance", 2, "perseverancia", "continuing despite major obstacles"), v("advocacy", 2, "abogacía", "speaking up publicly for a cause"), v("evidence", 2, "evidencia", "verified facts or quotes proving a claim")],
  },

  // =========================================================================
  // GRADE 7 (Wit & Wisdom)
  // =========================================================================
  {
    id: "g7-ela-u1", grade: "7", subject: "ELA", unit_number: 1,
    unit_title: "Identity in the Middle Ages",
    unit_summary: "Students read Castle Diary, Canterbury Tales adaptations, and The Midwife's Apprentice to analyze how social class shaped identity in medieval society.",
    core_standards: ["RL.7.3", "RI.7.3", "W.7.3", "L.7.4"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "From [medieval role]'s perspective, social rank constrained [choice] because [textual evidence].",
    cross_subject_bridge_note: "Connects with Grade 7 World Geography cultural regions and human-environment perspectives.",
    vocab: [v("hierarchy", 3, "jerarquía", "a ranked system of social status"), v("identity", 2, "identidad", "who a person is and how society defines them"), v("apprentice", 3, "aprendiz", "a learner working under a master")],
  },
  {
    id: "g7-ela-u2", grade: "7", subject: "ELA", unit_number: 2,
    unit_title: "Americans All",
    unit_summary: "Students examine World War II home-front experiences through Code Talker and Farewell to Manzanar, comparing loyalty, identity, and civil liberties.",
    core_standards: ["RL.7.6", "RI.7.9", "W.7.2", "SL.7.1"],
    blueprint_id: "inform-compare-contrast",
    unit_example_frame: "While both [Group A] and [Group B] showed resilience during WWII, they differed in [experience].",
    cross_subject_bridge_note: "Shares compare-contrast structure with Grade 7 World Geography regional comparisons and Reveal Math.",
    vocab: [v("internment", 3, "internamiento", "forced confinement of a group during war"), v("loyalty", 2, "lealtad", "faithful commitment to a group or nation"), v("discrimination", 2, "discriminación", "unfair treatment based on group identity")],
  },
  {
    id: "g7-ela-u3", grade: "7", subject: "ELA", unit_number: 3,
    unit_title: "Language and Power",
    unit_summary: "Students read Animal Farm to analyze how propaganda, rhetoric, and manipulation of language build or challenge political power.",
    core_standards: ["RL.7.4", "RI.7.8", "W.7.1", "SL.7.3"],
    blueprint_id: "argue-counterclaim-rebuttal",
    unit_example_frame: "Although [propaganda claim] suggests [counterclaim], Orwell's text exposes [rebuttal] through [evidence].",
    cross_subject_bridge_note: "Reinforces Grade 7 World Geography policy debates and Grade 7 IQWST Science argumentation.",
    vocab: [v("propaganda", 3, "propaganda", "biased messaging used to sway opinion"), v("rhetoric", 3, "retórica", "persuasive use of language"), v("allegory", 3, "alegoría", "a story with a deeper political or moral meaning")],
  },
  {
    id: "g7-ela-u4", grade: "7", subject: "ELA", unit_number: 4,
    unit_title: "Fever",
    unit_summary: "Students read Fever 1793 and An American Plague to trace how the 1793 Philadelphia yellow fever epidemic reshaped medicine and civic responsibility.",
    core_standards: ["RI.7.3", "RL.7.9", "W.7.2", "SL.7.4"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "Because [public health factor] accelerated the 1793 epidemic, [civic/medical response] resulted.",
    cross_subject_bridge_note: "Mirrors Grade 7 IQWST Science Body Systems & Chemical Reactions cause-and-effect.",
    vocab: [v("epidemic", 3, "epidemia", "rapid spread of disease through a community"), v("quarantine", 3, "cuarentena", "isolating people to stop illness from spreading"), v("catalyst", 2, "catalizador", "something that triggers rapid change")],
  },

  // =========================================================================
  // GRADE 8 (Wit & Wisdom)
  // =========================================================================
  {
    id: "g8-ela-u1", grade: "8", subject: "ELA", unit_number: 1,
    unit_title: "The Poetics and Power of Storytelling",
    unit_summary: "Students read The Crossover to examine how poetic form, rhythm, and storytelling craft communicate family, loss, and coming of age.",
    core_standards: ["RL.8.4", "RL.8.5", "W.8.3", "SL.8.1"],
    blueprint_id: "narrate-perspective-dialogue",
    unit_example_frame: "By structuring the poem with [poetic craft], the narrator reveals [internal conflict/perspective].",
    cross_subject_bridge_note: "Pairs with Grade 8 US History primary-source voices and narrative accounts.",
    vocab: [v("poetics", 3, "poética", "the art and craft of poetry"), v("metaphor", 3, "metáfora", "a direct comparison without like or as"), v("rhythm", 2, "ritmo", "a repeated pattern of sound or beats")],
  },
  {
    id: "g8-ela-u2", grade: "8", subject: "ELA", unit_number: 2,
    unit_title: "The Great War",
    unit_summary: "Students read All Quiet on the Western Front and WWI poetry to evaluate how mechanized warfare shattered romantic illusions of glory.",
    core_standards: ["RL.8.2", "RI.8.6", "W.8.2", "SL.8.4"],
    blueprint_id: "explain-cause-effect",
    unit_example_frame: "As a result of [WWI condition/technology], soldiers experienced [psychological/social effect].",
    cross_subject_bridge_note: "Transfers directly to Grade 8 US History Civil War/Reconstruction causal analysis and IQWST Physics.",
    vocab: [v("disillusionment", 2, "desilusión", "loss of belief after discovering harsh truth"), v("mechanized", 3, "mecanizado", "powered by industrial machines"), v("camaraderie", 2, "camaradería", "deep trust among companions in hardship")],
  },
  {
    id: "g8-ela-u3", grade: "8", subject: "ELA", unit_number: 3,
    unit_title: "What Is Love?",
    unit_summary: "Students study Shakespeare's A Midsummer Night's Dream alongside modern psychology to argue whether love is governed by agency or external forces.",
    core_standards: ["RL.8.3", "RI.8.8", "W.8.1", "SL.8.3"],
    blueprint_id: "argue-counterclaim-rebuttal",
    unit_example_frame: "Although [character/source] contends that love is [counterclaim], the text proves [rebuttal] because [evidence].",
    cross_subject_bridge_note: "Shares counterclaim-rebuttal syntax with Grade 8 US History constitutional and Reconstruction debates.",
    vocab: [v("agency", 2, "agencia", "the power to make independent choices"), v("illusion", 2, "ilusión", "a false appearance or belief"), v("counterclaim", 3, null, "an opposing argument addressed by a writer")],
  },
  {
    id: "g8-ela-u4", grade: "8", subject: "ELA", unit_number: 4,
    unit_title: "Teens as Change Agents",
    unit_summary: "Students read Claudette Colvin: Twice Toward Justice to evaluate how youth activists organized and catalyzed the Civil Rights Movement.",
    core_standards: ["RI.8.3", "RI.8.8", "W.8.1", "SL.8.4"],
    blueprint_id: "argue-claim-evidence",
    unit_example_frame: "According to [source], youth activism was decisive because [cited historical evidence].",
    cross_subject_bridge_note: "Reinforces Grade 8 US History Reconstruction & Civil Rights evidence-based arguments and IQWST Genetics.",
    vocab: [v("activism", 2, "activismo", "organized action to bring social or political change"), v("boycott", 3, "boicot", "refusing to buy or use a service as protest"), v("precedent", 3, "precedente", "an earlier ruling or action that guides future ones")],
  },
];

const built = buildUnitsAndConnections(ELA_SPECS);
export const ELA_UNITS = built.units;
export const ELA_CONNECTIONS = built.connections;
