// Hand-authored list of very common English words (function words and everyday nouns/verbs/adjectives).
// Original list, not copied from a published frequency corpus. A word here is "everyday" for the vocab-tier rubric:
// a term made only of these words is a Tier 1 candidate. Deliberately conservative and short: when a word is not here,
// the rubric falls back on how widely the word appears across the repo's four subjects.
export const COMMON_WORDS = new Set(
  `
a about above across after again against all almost along also always am among an and another any are around as ask at away
back bad be because become been before began begin behind being below best better between big both bring but by call came can
car care carry change child children city close come could cut day did die different do does done down draw during each early
earth eat else end enough even ever every eye face fact fall family far fast father feel few find fine first fish five follow
food for form found four friend from front full game gave get girl give go going gone good got great green grow had hand hard
has have he head hear heard help her here high him his hold home hot house how hundred i idea if important in into is it its
just keep kind knew know land large last late laugh learn leave left let life light like line list little live long look made
make man many may me mean might mile miss more most mother move much must my name near need never new next night no not now
number of off often old on once one only open or order other our out over own page paper part pass people place plant play point
put quick quite rain ran read ready real red right river room round run said same saw say school sea second see seem set seven
several she should show side since sit six small so some something sometimes soon sound start state stay step still stop story
such sure take talk tell ten than that the their them then there these they thing think this those thought three through time to
together told too took top toward tree try turn two under until up upon us use very walk want was watch water way we week well
went were what when where which while white who whole why will with without word work world would write year yes yet you young
your
`
    .split(/\s+/)
    .filter(Boolean),
);
