/**
 * Blood on the River — Character Bible (single source of truth)
 * Period: 1607–1610. Locked visual descriptors for consistency across all 243 images.
 */
const CHARACTERS = {
  samuel: { name: "Samuel Collier", aliases: ["Samuel"], age: "about 11–12",
    descriptor: "Samuel Collier, a thin English boy of about eleven, tousled dark-brown hair, fair weathered skin, alert determined expression; early chapters in ragged London clothes (loose dirty linen shirt, worn brown wool breeches, often barefoot); from Jamestown onward a colonist boy's plain wool doublet, breeches, linen shirt and knit cap; sometimes clutches a small brass oval locket" },
  smith: { name: "Captain John Smith", aliases: ["Smith"], age: "late 20s",
    descriptor: "Captain John Smith, a stocky muscular Englishman in his late twenties, full reddish-brown beard and short hair, confident commanding gaze; buff-colored leather jerkin or soldier's doublet, sometimes a steel breastplate, tall leather boots, a sword or matchlock musket" },
  hunt: { name: "Reverend Robert Hunt", aliases: ["Reverend Hunt", "Reverend", "the chaplain", "Hunt"], exclude: ["hunt(ing|ed|er|s)?\\b","to hunt","go(es|ing)? hunt","hunt for","hunt(ed)? "], age: "about 40",
    descriptor: "Reverend Robert Hunt, the colony's Anglican chaplain, a gentle middle-aged Englishman about forty, calm kind face; long black clerical cassock with a plain white collar; often holding a worn leather Bible" },
  powhatan: { name: "Chief Powhatan", aliases: ["Chief Powhatan","Powhatan","Wahunsenaca"], exclude: ["Powhatan (people|men|man|woman|women|warriors?|village|nation|belief|town|territory|land|world)"], age: "about 60",
    descriptor: "Chief Powhatan (Wahunsenaca), the dignified elder paramount chief, broad-shouldered and commanding, dark skin, hair gathered with a few upright feathers, traditional tattoo markings; a deerskin mantle trimmed with fur and rows of white shell (roanoke) beads; seated with authority on a raised platform of mats inside a longhouse" },
  pocahontas: { name: "Pocahontas", aliases: ["Pocahontas","Amonute","Matoaka"], age: "about 10–12",
    descriptor: "Pocahontas, Powhatan's lively young daughter of about eleven, dark skin, long black hair, bright curious playful expression; a fringed deerskin dress with shell-bead necklaces, bare feet; classroom-appropriate modest depiction" },
  newport: { name: "Captain Christopher Newport", aliases: ["Newport"], age: "about 45",
    descriptor: "Captain Christopher Newport, the veteran English fleet commander, middle-aged with a trimmed beard; he has only one arm (right sleeve pinned); a fine dark captain's coat, sash and sword; steady seafaring bearing" },
  ratcliffe: { name: "Captain John Ratcliffe", aliases: ["Ratcliffe"], age: "30s",
    descriptor: "Captain John Ratcliffe, an English gentleman-officer, somewhat vain and uneasy; fine but travel-worn doublet with a ruff collar, plumed hat, sword" },
  wingfield: { name: "Edward Maria Wingfield", aliases: ["Wingfield"], age: "about 50",
    descriptor: "Edward Maria Wingfield, the proud first president of the Jamestown council, an older well-dressed English gentleman, neatly trimmed beard; rich dark doublet with white ruff collar and gold buttons, plumed hat" },
  namontack: { name: "Namontack", aliases: ["Namontack"], age: "young man",
    descriptor: "Namontack, a young Powhatan man trusted by the chief and sent to England, athletic and watchful; deerskin breechcloth and mantle with shell beads, partly shaved hair with a roach crest; in later scenes a mix of Powhatan dress and English garments" },
  richard: { name: "Richard Mutton", aliases: ["Richard"], age: "about 11–13",
    descriptor: "Richard Mutton, one of the English boys on the voyage, similar age to Samuel, lighter brown hair, plain ragged-then-colonist boy's clothing" },
  james: { name: "James Brumfield", aliases: ["James Brumfield","James"], exclude: ["James ?[Tt]own","James River","James Fort","King James","James the","James I\\b","St\\.? James"], age: "about 8–10 (youngest)",
    descriptor: "James Brumfield, the youngest and frailest English boy, small and thin with pale skin and light hair, plain ragged boy's clothes" },
  nathaniel: { name: "Nathaniel Peacock", aliases: ["Nathaniel","Peacock"], age: "about 11–12",
    descriptor: "Nathaniel Peacock, an English boy of Samuel's age and his friend, plain colonist boy's clothing" },
  laydon: { name: "John Laydon", aliases: ["John Laydon","Laydon"], age: "20s",
    descriptor: "John Laydon, a young English laborer/carpenter at Jamestown, sturdy, plain working man's wool doublet, shirtsleeves and breeches, leather apron when at work" },
  anne: { name: "Anne Burras", aliases: ["Anne Burras","Burras","Anne"], age: "about 14",
    descriptor: "Anne Burras, a young Englishwoman (maidservant, later the first English bride at Jamestown), plain modest early-1600s English dress with a linen coif (cap), apron and long skirt" },
  percy: { name: "George Percy", aliases: ["George Percy","Percy"], age: "about 25",
    descriptor: "George Percy, an English gentleman-colonist, pale and somewhat sickly, finer doublet and ruff than the laborers" },
};
const GROUPS = {
  gentlemen: { aliases: ["the gentlemen","gentlemen","the council","councilmen"], descriptor: "English gentlemen-colonists in fine but travel-worn doublets, ruff collars and plumed hats, several with swords" },
  sailors: { aliases: ["sailors","crew","mariners"], descriptor: "English sailors in loose linen shirts, knee breeches and knit caps" },
  colonists: { aliases: ["colonists","settlers","the English","the men","exploring men","the colony","tradesmen"], descriptor: "English colonists in plain wool doublets, shirtsleeves and breeches, some laborers with tools" },
  powhatanPeople: { aliases: ["Powhatan people","Powhatan men","warriors","the Powhatan","natives","native men","Native people","Native","Warraskoyack","Warraskoyacks","Paspahegh"], descriptor: "Powhatan (Eastern Woodland) people, dark skin, men with partly shaved hair and a roach crest, deerskin breechcloths and mantles, shell-bead and copper ornaments; respectful, accurate Tidewater-Virginia depiction (NOT Plains/Western stereotypes)" },
};
const NOT_PEOPLE = ["Susan Constant","Godspeed","Discovery","the Discovery","James Town","Jamestown","James River","James Fort","London","London Bridge","Werowocomoco","Dominica","the Caribbean","Point Comfort","Virginia","the Chesapeake","Nevis","the Downs"];
module.exports = { CHARACTERS, GROUPS, NOT_PEOPLE };
