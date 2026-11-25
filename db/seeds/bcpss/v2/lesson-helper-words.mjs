// Minimal word cards for lesson vocabulary that the unit's own 8-10 word cards do not cover (audit F-09).
// Source of truth: lessons-authored/<unitId>.mjs names these words; the unit studio files carry the cards for the
// unit's headline words only. loadLessons() attaches the matching card to each lesson vocab entry as `card`.
// Every card is DRAFT: def/example are written for this lesson context, `es` is a machine-quality gloss
// (review_status "machine") and nothing here has been reviewed by a teacher or language specialist.
// Card shape: { term, pos, def, example, es, cognate, es_note? }
//   cognate: "true" (sounds and means nearly the same in Spanish), "partial" (one part is a cognate),
//            "false_friend" (looks like a Spanish word with a different meaning), "none".
// Rules (same as the unit cards): the def never uses the word itself; the example always does.

export const HELPER_REVIEW_STATUS = "machine";
export const HELPER_COGNATES = ["true", "partial", "false_friend", "none"];

const c = (term, pos, def, example, es, cognate, es_note) => ({
  term,
  pos,
  def,
  example,
  es,
  cognate,
  ...(es_note ? { es_note } : {}),
});

export const LESSON_HELPER_WORDS = {
  "g3-ela-u1": [
    c("describe", "verb", "to tell what something is like using details", "I can describe the crab's hard shell.", "describir", "true"),
    c("shell", "noun", "the hard outside cover of some sea animals", "The crab hides inside its shell.", "concha / caparazón", "none", "Snail and clam: concha. Crab and turtle: caparazón."),
    c("claw", "noun", "a sharp, curved part on the leg of some animals", "The crab picked up the shell with its claw.", "garra / pinza", "none", "A crab's claw is a pinza."),
    c("tentacle", "noun", "a long, soft arm that some sea animals use to grab and feel", "The octopus reached out with one tentacle.", "tentáculo", "true"),
    c("tide pool", "noun", "a small pool of sea water left on the rocks when the tide goes out", "We found a starfish in the tide pool.", "charco de marea", "none"),
    c("reef", "noun", "a long line of rock or coral under the water near the shore", "Many colorful fish live near the reef.", "arrecife", "none"),
    c("shelter", "noun", "a safe place that covers and protects", "A hole in the rock is a shelter for the small fish.", "refugio", "none"),
    c("filter", "verb", "to clean water by letting it pass through something that catches dirt", "Oysters filter the water in the bay.", "filtrar", "true", "The thing that cleans is el filtro."),
    c("compare", "verb", "to look at two things and tell how they are alike and different", "Let us compare a crab and a lobster.", "comparar", "true"),
    c("shallow", "adjective", "not deep", "Small fish swim in the shallow water.", "poco profundo", "none", "Opposite: profundo (deep)."),
    c("food chain", "noun", "a line that shows who eats what, starting with the sun and plants", "Algae, a small fish, and an osprey make a food chain.", "cadena alimentaria", "none"),
    c("energy", "noun", "the power that living things need to move and grow", "Animals get energy from the food they eat.", "energía", "true"),
    c("algae", "noun", "tiny plant-like living things that grow in water", "Algae make food from sunlight.", "algas", "true", "In Spanish the plural algas is the usual form."),
    c("osprey", "noun", "a large bird that catches fish with its feet", "The osprey dove into the bay to catch a fish.", "águila pescadora", "none"),
    c("cause", "noun", "the reason something happens", "Rain was the cause of the muddy stream.", "causa", "true"),
    c("effect", "noun", "what happens because of something else", "The effect of the storm was trash in the harbor.", "efecto", "true"),
    c("pollution", "noun", "dirty or harmful things that hurt air, land, or water", "Pollution makes the harbor water unsafe for fish.", "contaminación", "none", "Not polución for everyday use: contaminación is the common word."),
    c("protect", "verb", "to keep safe from harm", "Clean water helps protect the fish.", "proteger", "true"),
    c("sample", "noun", "a small amount taken to show what the rest is like", "The class took a water sample from the stream.", "muestra", "none", "Not ejemplo. A sample is a muestra."),
    c("opinion", "noun", "what a person thinks or feels about something", "My opinion is that the trash wheel is a good idea.", "opinión", "true"),
    c("reason", "noun", "a fact or idea that explains why", "My reason is that fish need clean water.", "razón", "true", "Also motivo."),
    c("coral reef", "noun", "a reef made by tiny sea animals called coral", "A coral reef is home to thousands of fish.", "arrecife de coral", "partial", "Coral is the same in Spanish; arrecife is the reef."),
    c("litter", "noun", "trash left on the ground where it does not belong", "The litter on the street washed into the harbor.", "basura (en el suelo)", "false_friend", "Not litera (a bunk bed)."),
    c("process", "noun", "the steps that happen one after another to make something happen", "The trash wheel has a process: lift, carry, drop.", "proceso", "true"),
    c("harbor", "noun", "a safe place near the shore where boats stay", "Boats stay in the harbor at night.", "puerto", "none"),
    c("communicate", "verb", "to share ideas or information with others", "Dolphins communicate with sounds.", "comunicar", "true"),
    c("contrast", "verb", "to tell how two things are different", "Let us contrast a shallow pool and the deep sea.", "contrastar", "true"),
    c("mammal", "noun", "an animal that breathes air and feeds its babies milk", "A whale is a mammal, not a fish.", "mamífero", "true"),
    c("humpback whale", "noun", "a very large whale with long fins that sings", "The humpback whale swam past the boat.", "ballena jorobada", "none"),
    c("high tide", "noun", "the time when the sea water comes up the highest on the shore", "At high tide the beach is covered with water.", "marea alta", "none"),
    c("low tide", "noun", "the time when the sea water goes down the lowest from the shore", "At low tide we can walk to the rocks.", "marea baja", "none"),
    c("pull", "noun", "a force that draws something closer", "The moon has a pull on the ocean.", "atracción / fuerza de atracción", "none", "The verb pull is jalar or tirar."),
    c("watershed", "noun", "all the land where rain and streams flow to the same river or bay", "Our school sits in the watershed of the harbor.", "cuenca hidrográfica", "none"),
    c("runoff", "noun", "rain water that flows over the ground and carries things with it", "Runoff carried litter down the street.", "escorrentía", "none"),
    c("estuary", "noun", "a place where a river meets the sea and fresh water mixes with salt water", "The bay is an estuary.", "estuario", "true"),
  ],
  "g6-math-u2": [
    c("for every", "phrase", "a way to tell how many of one thing go with a number of another thing", "For every 3 cups of flour, we use 2 eggs.", "por cada", "none"),
    c("order", "noun", "the place of each item in a list, first, second, and so on", "In the ratio 4 to 7, the order matters.", "orden", "true", "Also pedido (an order at a store); this lesson uses orden."),
    c("compare", "verb", "to look at two amounts and tell which is greater, less, or the same", "We compare the two prices per ounce.", "comparar", "true"),
    c("multiply", "verb", "to find the total of equal groups by repeating addition", "To scale up the recipe, multiply both amounts by 3.", "multiplicar", "true"),
    c("both", "pronoun", "the two of them together", "Multiply both numbers in the ratio by the same amount.", "ambos / los dos", "none"),
    c("because", "conjunction", "a word that introduces the reason for something", "The ratios are equal because both amounts were multiplied by 5.", "porque", "none", "Do not confuse porque (because) with por qué (why)."),
    c("block", "noun", "one equal part or box in a tape diagram", "Each block in the diagram is worth 4 flowers.", "bloque / cuadro", "partial"),
    c("row", "noun", "a line of numbers going across a table from left to right", "The top row shows the cups of oats.", "fila", "none"),
    c("column", "noun", "a line of numbers going down a table from top to bottom", "The second column shows the cups of raisins.", "columna", "true"),
    c("relationship", "noun", "the way two amounts are connected", "Every row of the table keeps the same relationship.", "relación", "true"),
    c("per", "preposition", "for each one", "The car goes 60 miles per hour.", "por", "none", "Per 100 = por cada 100."),
    c("each", "pronoun", "every one of a group, one at a time", "Each block is worth 4 flowers.", "cada", "none"),
    c("divide", "verb", "to split an amount into equal groups", "Divide 24 dollars by 3 to find the cost of one.", "dividir", "true"),
    c("justify", "verb", "to give a reason that shows your answer is correct", "Justify your answer with a unit rate.", "justificar", "true"),
    c("speed", "noun", "how far something goes in a certain amount of time", "Her speed is 5 miles per hour.", "rapidez / velocidad", "none"),
    c("disagree", "verb", "to say you do not think the same as someone else", "I disagree because the unit rates are not equal.", "no estar de acuerdo", "none", "Say I disagree, not I am not agree."),
    c("out of", "phrase", "a way to show the part and the whole together", "70 out of 100 is 70 percent.", "de (7 de cada 10)", "none"),
    c("survey", "noun", "a set of questions asked to many people to find out what they think", "In our survey, 12 out of 20 students chose pizza.", "encuesta", "none"),
    c("better buy", "noun", "the choice that costs less for the same amount", "The unit price shows which stand is the better buy.", "mejor compra", "none"),
    c("although", "conjunction", "a word that shows two ideas that seem to go against each other", "Although Stand A is cheaper, it gives less food.", "aunque", "none"),
  ],
  "g8-sci-u1": [
    c("contact force", "noun", "a push or pull that happens when two things touch", "Kicking a ball is a contact force.", "fuerza de contacto", "true"),
    c("noncontact force", "noun", "a push or pull that works even when two things do not touch", "A magnet pulling a paper clip is a noncontact force.", "fuerza a distancia", "none", "Also fuerza sin contacto."),
    c("gravity", "noun", "the pull that every object has on every other object, most noticeable with Earth", "Gravity pulls the ball back down to the ground.", "gravedad", "true"),
    c("newton", "noun", "the unit used to measure force", "A force of 10 newtons moves the cart.", "newton", "true", "Same word in Spanish; the symbol is N."),
    c("unbalanced forces", "noun", "forces that do not cancel each other out, so an object changes its motion", "Unbalanced forces make the cart speed up.", "fuerzas desequilibradas", "true"),
    c("constant", "adjective", "staying the same and not changing", "The cart has a constant mass during the test.", "constante", "true"),
    c("direction", "noun", "the way something is pointing or moving", "A force has a size and a direction.", "dirección", "true"),
    c("claim", "noun", "a statement of what you think is true", "Our claim is that rough surfaces cause more friction.", "afirmación", "none", "Not reclamo. A claim in science is an afirmación."),
    c("evidence", "noun", "facts and measurements that support a claim", "The measurements are our evidence.", "evidencia", "true"),
    c("reasoning", "noun", "the explanation that connects the evidence to the claim", "Our reasoning links the data to the claim.", "razonamiento", "true"),
    c("data", "noun", "facts and numbers collected in an investigation", "We recorded the data in a table.", "datos", "true", "Data is plural in Spanish: los datos."),
    c("seat belt", "noun", "a strap that holds a person in a car seat during a crash", "A seat belt keeps you from moving forward in a sudden stop.", "cinturón de seguridad", "none"),
    c("brake", "noun", "a part that slows or stops a moving vehicle", "The driver pressed the brake to stop the car.", "freno", "none"),
    c("sudden", "adjective", "happening quickly with no warning", "A sudden stop throws passengers forward.", "repentino / de repente", "none"),
    c("formula", "noun", "a rule written with symbols that shows how to calculate something", "The formula for force is F = m × a.", "fórmula", "true"),
    c("weight", "noun", "the pull of gravity on an object, measured in newtons", "Your weight is smaller on the Moon.", "peso", "none", "In science, mass and weight are different; in daily Spanish both are peso."),
    c("kilogram", "noun", "the unit used to measure mass", "The cart has a mass of 2 kilograms.", "kilogramo", "true"),
    c("Newton's third law", "noun", "the rule that every force has an equal force pushing back in the opposite direction", "Newton's third law explains why a rocket moves up when gas goes down.", "tercera ley de Newton", "true"),
    c("opposite", "adjective", "completely different in direction or meaning", "The two forces point in opposite directions.", "opuesto", "true"),
    c("trend", "noun", "the way data usually changes over time or as another amount changes", "The trend is that more force gives more acceleration.", "tendencia", "true"),
    c("counterclaim", "noun", "a statement that disagrees with a claim", "A counterclaim says the thinner liner is better.", "contraargumento", "none", "Also contrargumento."),
    c("design", "noun", "a plan for how to build something", "Our design uses a thick foam liner.", "diseño", "none"),
  ],
};

const BY_UNIT = new Map(
  Object.entries(LESSON_HELPER_WORDS).map(([unitId, cards]) => [
    unitId,
    new Map(cards.map((card) => [card.term.toLowerCase(), card])),
  ]),
);

/** The draft helper card for a lesson vocab term of this unit, or null. */
export function helperCard(unitId, term) {
  const card = BY_UNIT.get(unitId)?.get(String(term).toLowerCase());
  return card ? { ...card, review_status: HELPER_REVIEW_STATUS } : null;
}
