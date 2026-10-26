/** Adds sustained, multi-part original reads; review status stays pending. */
import fs from "node:fs";

const path = "access-practice-lab/content/reading-room/lessons.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const entries = [
  {
    id: "rr68-school-rain-garden",
    grade: "6-8",
    title: "Can a Schoolyard Hold the Rain?",
    summary:
      "Follow a student team as it studies runoff, tests a rain garden, and explains what its measurements can—and cannot—show.",
    genre: "Science investigation",
    subject: "Science and environmental systems",
    keyUse: "Explain",
    standard: "ELD-SC",
    focus: "Cause and effect in a schoolyard water investigation",
    vocabulary: [
      ["runoff", "water that flows over the ground instead of soaking in"],
      ["infiltrate", "to pass into or through a material"],
      ["variable", "a factor that can change in an investigation"],
      ["evidence", "information used to support or question an idea"],
    ],
    paragraphs: [
      "In this fictional schoolyard investigation, water crossed a paved courtyard after heavy rain and collected beside the library door. The science club wondered whether a planted rain garden could slow that flow. Its question was specific: would a shallow, planted basin collect water from one section of the courtyard, and how quickly would the water level fall? The students did not begin by claiming that a garden would prevent every flood. They first needed to describe the site and decide what evidence could answer their question.",
      "The students mapped the courtyard into three areas. The roof drained through a downspout, the paved walkway sloped toward the door, and a narrow planting strip sat downhill from both. They measured the planting strip and marked a small test basin inside it. Their design included a shallow depression, a layer of gravel, and soil chosen for the school’s planting plan. They recorded the starting water level after each rain. A ruler at the basin edge made the measurement repeatable, while a notebook kept observations together.",
      "For the first two storms, the team checked the basin at the same time after rainfall ended. The water level was lower at the second check than at the first. On the third storm, however, the level fell more slowly. A student noticed that the ground was already damp before the rain began. The group added that observation to its record. It did not erase the unusual result or call it a mistake. Soil that is already wet may have less space for additional water, so the starting condition could help explain the difference.",
      "The team also compared the basin with a nearby patch of compacted soil. Water remained on the compacted patch longer during their observation, but the two areas were not identical in size or slope. That comparison suggested a useful question; it did not prove that soil type alone caused every difference. Rain amount, slope, plant roots, and the time of each check could also matter. The students learned that a fair comparison requires careful measurement and a clear account of what changed and what stayed the same.",
      "At the next meeting, the club proposed measuring the same locations after several storms and recording rainfall, soil condition, and water depth. They would also check whether water reached the library door. Their evidence could help the school decide whether to adjust the basin or add another planting area. The rain garden was a practical response, but the investigation was still in progress. By separating observations from explanations, the students could make a careful claim: in the storms they measured, the planted basin held water temporarily, and more consistent comparisons were needed to understand why the results varied.",
    ],
    question: "Which conclusion is best supported by the students’ investigation so far?",
    choices: [
      "The basin held water temporarily during the storms measured, but more comparable observations are needed.",
      "The basin prevented all flooding because one water level decreased.",
      "The compacted soil proves that every planted area absorbs water at the same rate.",
    ],
    answer: 0,
    rationale:
      "The final paragraph limits the claim to the storms observed and calls for more consistent comparisons.",
    evidence: ["p5"],
    categories: ["Recorded observation", "Possible explanation to test"],
    items: [
      {
        id: "level",
        text: "The measured water level fell between two checks.",
        answer: "Recorded observation",
      },
      {
        id: "damp",
        text: "Already damp soil may have less room for new water.",
        answer: "Possible explanation to test",
      },
      {
        id: "door",
        text: "The team wants to record whether water reaches the library door.",
        answer: "Recorded observation",
      },
    ],
    response:
      "Explain why the third storm’s result should be included in the investigation, and name one additional measurement that would strengthen the next comparison.",
    transfer:
      "A community garden has puddles after some storms but not others. Propose one variable to record and explain how it could help interpret the pattern.",
  },
  {
    id: "rr68-tree-route-debate",
    grade: "6-8",
    title: "Which Route Should Get the First Trees?",
    summary:
      "Compare two student proposals for shade, use evidence from a route survey, and explain what the numbers leave unanswered.",
    genre: "Paired arguments with data",
    subject: "Civics and environmental planning",
    keyUse: "Argue",
    standard: "ELD-SS",
    focus: "Evaluate competing claims and the limits of a survey",
    vocabulary: [
      ["priority", "something considered more important to address first"],
      ["survey", "a set of questions used to collect responses"],
      ["constraint", "a limit that affects a decision"],
      ["counterclaim", "a different position that responds to a claim"],
    ],
    paragraphs: [
      "In this fictional school, the student council has enough funding to add trees beside one walking route this year. The East Route passes the bus stop and library entrance. The South Route connects the gym, cafeteria, and outdoor courts. Both routes are used every day, and both have long sections with little shade. The council asks students to recommend where the first trees should go. The choice is about which route to address first, not whether one group of students matters more.",
      "Maya argues for the East Route. In a one-week survey, 42 of 60 students who responded said they used it at least three days a week. The route also has a waiting area near the bus stop. Maya says shade there could help students who arrive early and people walking to the library. She acknowledges that the survey did not ask how long people waited. Her proposal is to plant near the bus stop first, then review how the area is used before choosing a second location.",
      "Luis supports the South Route. He points out that the gym, cafeteria, and courts are all on that path. In the same survey, 31 of 55 respondents said they used it at least three days a week. Luis argues that a route serving several shared destinations may benefit many students throughout the day. He also notes that the South Route is longer, so a small number of trees would not shade every section. His plan begins near the cafeteria crossing, where students from different grades meet.",
      "The survey numbers are useful but incomplete. Students chose whether to respond, and the two routes did not receive exactly the same number of responses. The council did not count people who use both routes, measure how much shade each route already has, or record how long students wait or walk there. The survey therefore describes the responding students’ reported use; it does not prove which route has the greatest need. The council could gather additional evidence by observing both routes at several times and mapping their existing shade.",
      "At the meeting, students suggest combining the proposals: plant the first trees at a location that can be reached from the bus stop and the cafeteria crossing, if the site is suitable. Others warn that a shared location may not shade either route well. The council decides to visit both areas, check underground utility constraints, and ask students who did not complete the survey. It will compare shade, safety, foot traffic, and planting space before voting. The disagreement helps the group make a stronger decision because each proposal reveals a different need—and the evidence still has gaps.",
    ],
    question:
      "What is the strongest reason the council should collect more evidence before choosing a route?",
    choices: [
      "The survey records reported use but does not measure shade, waiting time, or all route users.",
      "One proposal has a larger number, so the other proposal should be ignored.",
      "The students disagree, which means the survey results are incorrect.",
    ],
    answer: 0,
    rationale:
      "Paragraph 4 names specific missing measures and explains that the survey cannot establish which route has the greatest need.",
    evidence: ["p4"],
    categories: ["Evidence reported in the text", "Information still needed"],
    items: [
      {
        id: "east",
        text: "42 of 60 East Route respondents reported frequent use.",
        answer: "Evidence reported in the text",
      },
      {
        id: "shade",
        text: "A map of existing shade on both routes.",
        answer: "Information still needed",
      },
      {
        id: "south",
        text: "31 of 55 South Route respondents reported frequent use.",
        answer: "Evidence reported in the text",
      },
      {
        id: "wait",
        text: "How long students wait near each route.",
        answer: "Information still needed",
      },
    ],
    response:
      "Compare Maya’s and Luis’s claims. Use one detail from each proposal, then explain one limitation the council should consider.",
    transfer:
      "Your school can improve one shared space first. State a recommendation, name evidence you would collect, and explain one limitation of that evidence.",
  },
  {
    id: "rr68-museum-labels",
    grade: "6-8",
    title: "What Can a Museum Label Tell Us?",
    summary:
      "Read two fictional exhibit labels and a curator’s note to distinguish evidence, interpretation, and unanswered questions.",
    genre: "Historical source investigation",
    subject: "History and media literacy",
    keyUse: "Explain",
    standard: "ELD-SS",
    focus: "Compare sources and separate evidence from interpretation",
    vocabulary: [
      ["artifact", "an object made or used by people in the past"],
      ["interpretation", "an explanation of what evidence may mean"],
      ["corroborate", "to check a claim against another source"],
      ["context", "conditions and information that help explain an event"],
    ],
    paragraphs: [
      "A local history museum is preparing an exhibit about a train station that served a growing town. The exhibit team finds a metal lunch tin with a scratched name, a dated station timetable, and two short accounts written many years later. The sources are part of a fictional classroom case; they are designed to practice historical reasoning. The tin is an artifact, but it cannot explain its own story. Historians ask what an object can show, what other records might help, and which questions remain open.",
      "Label A reads: “Asha Patel carried this tin to her station job every morning. She kept letters inside it and shared lunch with coworkers.” The label gives a vivid story, but the evidence file only shows that the name A. Patel is scratched into the tin. The timetable lists train departures; it does not identify workers. Asha may have owned the tin, but the evidence described so far does not establish her job, routine, or what she stored inside it.",
      "Label B reads: “A tin marked A. Patel was found near the station. A timetable from the same period shows frequent departures. These objects suggest that the station was part of a busy town, but they do not identify the tin’s owner.” This label makes a narrower claim. It connects two pieces of evidence while acknowledging that the objects do not answer every question. A reader may still ask whether the tin was left at the station, brought there by a visitor, or moved later.",
      "The curator’s note adds another source: a later oral history in which a former resident remembers that “many families used the station platform as a meeting place.” The speaker does not mention the tin or Asha Patel. The account may offer context about how residents used the station, but memory recorded later can be incomplete. A researcher could compare the account with employment records, photographs, or additional interviews. If another source identifies Asha as a station worker, that would corroborate part of Label A; it still would not prove what was inside the tin.",
      "The exhibit team chooses Label B and adds a question card: “Who used this tin, and how could we find out?” Visitors can inspect the timetable and see which claims it supports. The label is less dramatic than Label A, yet it models how evidence and interpretation differ. Careful historical writing does not avoid interpretation. It makes the reasoning visible, identifies the limits of the sources, and leaves room for new evidence to change an explanation.",
    ],
    question: "Why is Label B better supported by the evidence described in the case?",
    choices: [
      "It connects the tin and timetable to a limited claim and states that the owner is unknown.",
      "It gives the most detailed story about Asha’s work and lunch routine.",
      "It proves that the timetable belonged to the person whose name is on the tin.",
    ],
    answer: 0,
    rationale:
      "Label B stays within what the objects show and clearly identifies the missing ownership evidence.",
    evidence: ["p3", "p5"],
    categories: [
      "Directly supported by a described source",
      "Interpretation or question requiring more evidence",
    ],
    items: [
      {
        id: "name",
        text: "The tin has A. Patel scratched into it.",
        answer: "Directly supported by a described source",
      },
      {
        id: "letters",
        text: "Asha kept letters inside the tin.",
        answer: "Interpretation or question requiring more evidence",
      },
      {
        id: "timetable",
        text: "The timetable lists train departures.",
        answer: "Directly supported by a described source",
      },
      {
        id: "owner",
        text: "Who used the tin, and when?",
        answer: "Interpretation or question requiring more evidence",
      },
    ],
    response:
      "Explain how the oral history adds context without proving who owned the tin. Identify one source that could help investigate ownership.",
    transfer:
      "A photograph shows a crowd outside a school, but it has no date or caption. Write one careful claim and name another source that could help verify it.",
  },
  {
    id: "rr912-library-cooling-centers",
    grade: "9-12",
    title: "When a Library Becomes a Cooling Center",
    summary:
      "Evaluate a city proposal by weighing access, operating constraints, and an illustrative data set rather than relying on one headline number.",
    genre: "Policy analysis with data",
    subject: "Civics and public health",
    keyUse: "Argue",
    standard: "ELD-SS",
    focus: "Evaluate a policy claim with evidence and constraints",
    vocabulary: [
      ["accessibility", "how easily people can reach and use a service"],
      ["capacity", "the amount a place or system can serve"],
      ["constraint", "a condition that limits available choices"],
      ["trade-off", "a benefit gained by accepting a cost or limitation"],
    ],
    paragraphs: [
      "During a week of unusually hot weather, a city council considers opening two public libraries as daytime cooling centers. Supporters argue that libraries are familiar, accessible public spaces where residents can rest, drink water, and find information. Critics ask whether the buildings can remain open longer without reducing other services or overloading staff. The policy question is not simply whether libraries are useful. It is how the city can provide a dependable service while accounting for location, hours, capacity, transportation, and the needs of people who may not already use a library.",
      "A planning team reviews an illustrative one-week pilot at two branches. The north branch recorded 84 visits and the south branch 53. The north branch is beside a bus transfer point; the south branch is near several apartment buildings. The counts are visits, not unique people, and the pilot did not record how many residents needed a place but could not reach either branch. A larger count may reflect greater need, easier access, repeat visits, or some combination. The numbers can guide questions, but they cannot by themselves identify everyone who would benefit.",
      "Staff members describe practical constraints. The branches have limited seating, and some rooms are already reserved for tutoring. Extending hours would require a schedule for staff, cleaning, and water supplies. A library manager warns that a crowded room could become uncomfortable even if the building is cool. A neighborhood group suggests a shuttle from areas farther away. That idea could improve access but would require a driver, a route, and funding. Each proposal changes both the likely benefit and the resources needed to deliver it.",
      "The council compares three possible plans: open both branches for regular hours with water and public information; extend hours at the north branch while testing a shuttle; or rotate extended hours between the branches. The first plan is easier to organize but may not reach residents who cannot travel during the day. The second uses the pilot’s higher visit count but risks treating visits as a complete measure of need. The rotating plan shares staff and operating costs, yet its changing schedule may make the service harder to remember. A clear public schedule would matter under any option.",
      "A responsible recommendation would state what the pilot supports and what remains uncertain. For example, the visit counts show that residents used both branches during the pilot, but they do not show whether either site met community need. The council could begin with a limited schedule, publish transportation and capacity information, and collect anonymous counts of time, location, and unmet requests. It could also ask community organizations to share information about residents who were unable to attend. After several weeks, the council could compare access and operating data before deciding whether to expand the service.",
      "The debate illustrates a broader policy principle: public services are shaped by design choices as well as by their existence. A building may be open and still be out of reach for someone without transportation, a flexible work schedule, or a comfortable place to wait. A pilot can reveal patterns, but its measures should match the question decision makers need to answer. The strongest policy argument combines evidence, practical constraints, and a plan to learn from results without presenting a short trial as proof that every community member has been served.",
    ],
    question: "Which interpretation of the pilot data is most defensible?",
    choices: [
      "Both branches were used, but visit totals alone cannot show unique users or unmet need.",
      "The north branch has exactly 31 more residents in need than the south branch.",
      "The south branch should close because it recorded fewer visits.",
    ],
    answer: 0,
    rationale:
      "Paragraph 2 explains that the counts record visits, not unique people or residents unable to reach a branch.",
    evidence: ["p2", "p5"],
    categories: ["Known from the pilot description", "Not established by the pilot"],
    items: [
      {
        id: "count",
        text: "The north branch recorded 84 visits during the pilot week.",
        answer: "Known from the pilot description",
      },
      {
        id: "unique",
        text: "The number of unique residents served at each branch.",
        answer: "Not established by the pilot",
      },
      {
        id: "water",
        text: "The proposal includes water and public information.",
        answer: "Known from the pilot description",
      },
      {
        id: "unmet",
        text: "How many people needed the service but could not reach a branch.",
        answer: "Not established by the pilot",
      },
    ],
    response:
      "Recommend one of the three plans or a clearly defined alternative. Use two details from the passage, address one trade-off, and state what evidence should be collected next.",
    transfer:
      "A town is considering evening hours for a public service. Identify one measure that would show use and one measure that would reveal unmet need.",
  },
  {
    id: "rr912-feed-ranking",
    grade: "9-12",
    title: "What Does a Ranked Feed Choose to Show?",
    summary:
      "Analyze a fictional platform experiment, compare two explanations for a result, and distinguish engagement from learning or trust.",
    genre: "Digital media analysis",
    subject: "Technology and media literacy",
    keyUse: "Explain",
    standard: "ELD-LA",
    focus: "Interpret an experiment and evaluate what its measures mean",
    vocabulary: [
      ["ranking", "an order assigned to items using selected rules"],
      ["engagement", "an action that signals interaction, such as opening or replying"],
      ["measure", "a defined way to observe or count something"],
      ["correlation", "a relationship in which two patterns change together"],
    ],
    paragraphs: [
      "A fictional student news app changes the order of stories in each reader’s feed. The design team says a ranked feed can help readers find articles they are likely to open. A student group asks a different question: does seeing more opened stories mean readers understand more? These questions sound similar, but they require different evidence. Opening a story is an observable action. Understanding a story is a learning outcome that would need a separate measure, such as an explanation that accurately uses the article’s evidence.",
      "The team runs a short trial with two versions of the feed. Version A places the newest stories first. Version B uses a ranking rule based on each reader’s earlier clicks. In the trial, readers open more stories in Version B. The result supports a narrow claim: during this trial, the click-based version was associated with more story opens. It does not establish that readers learned more, trusted the app more, or encountered a wider range of ideas. Those outcomes were not measured.",
      "A student researcher proposes that earlier clicks may help the app surface relevant topics. Another student points out that the rule might repeatedly place familiar topics near the top, reducing the chance that a reader sees something unexpected. Both explanations could fit the same increase in opens. To distinguish them, the team would need to define relevance and variety, decide how to measure each, and examine what appears lower in the feed as well as what readers open.",
      "The trial also has limits. It is short, uses a fictional app with a small group of volunteers, and compares only two ordering rules. A reader who opens several stories may not read each one carefully. A story appearing near the top has a greater chance to be noticed, so position itself can affect the result. If the team wants to study learning, it could ask readers to summarize a story and identify supporting evidence. If it wants to study variety, it could classify topics and compare how many distinct ones appear in each feed.",
      "The students recommend that the app label its goal clearly and test more than one outcome before describing the ranking as successful. They suggest reporting story opens separately from comprehension and topic variety. They also ask whether readers can switch to a newest-first view. Their recommendation does not assume that ranking is always harmful or always helpful. Instead, it treats a design choice as a question that can be examined with measures suited to the claim.",
      "The case shows why digital media analysis begins with definitions. A platform may call an increase in clicks “better engagement,” but the phrase does not automatically mean deeper learning or a healthier information diet. Readers and designers should ask what was counted, who participated, how items were ordered, and which outcomes were left out. A result is more useful when its limits are stated alongside it. Careful interpretation keeps a measurable behavior from standing in for a broader conclusion it cannot support.",
    ],
    question: "What did the fictional trial directly measure?",
    choices: [
      "How often readers opened stories in two feed versions.",
      "How accurately readers used evidence in a summary.",
      "How much readers trusted the app over a full school year.",
    ],
    answer: 0,
    rationale: "The trial compared story opens; comprehension and trust were not measured.",
    evidence: ["p2", "p4"],
    categories: ["Measured in the trial", "Suggested for a future study"],
    items: [
      {
        id: "opens",
        text: "Number of story opens in each feed version.",
        answer: "Measured in the trial",
      },
      {
        id: "summary",
        text: "Whether summaries accurately use article evidence.",
        answer: "Suggested for a future study",
      },
      {
        id: "trust",
        text: "Whether readers trust the app more.",
        answer: "Suggested for a future study",
      },
      { id: "version", text: "Which ordering rule was used.", answer: "Measured in the trial" },
    ],
    response:
      "Evaluate the claim “the ranked feed is better.” Identify what the trial supports, what it does not establish, and one additional measure that would help.",
    transfer:
      "A school reports that a new study app increased logins. Write one conclusion the data support and one outcome that would need a separate measure.",
  },
  {
    id: "rr912-wetland-evidence",
    grade: "9-12",
    title: "Restoring a Wetland: What Counts as Success?",
    summary:
      "Examine a fictional restoration report, interpret indicators over time, and build a qualified claim about ecological recovery.",
    genre: "Science report with data",
    subject: "Environmental science",
    keyUse: "Explain",
    standard: "ELD-SC",
    focus: "Synthesize indicators and qualify a scientific conclusion",
    vocabulary: [
      ["indicator", "a measure that can provide evidence about a larger condition"],
      ["baseline", "a starting point used for comparison"],
      ["recovery", "a return toward a healthier or more functional condition"],
      ["monitor", "to observe or measure over time"],
    ],
    paragraphs: [
      "This fictional project report describes a coastal community restoring a small wetland beside a walking path. Before work begins, the project team records water depth, plant cover, and the number of bird visits observed during scheduled checks. These measures are indicators: each can reveal something about the site, but none alone defines a healthy wetland. The team also marks a nearby area where no restoration work is planned. Comparing the two places over time may help researchers interpret change, although the sites can differ in ways that affect the results.",
      "The restoration team removes a barrier that had altered the flow of water into one section. It also plants native vegetation selected for the site. In the first month, plant cover increases in the restored area. Bird visits vary from one check to the next. The project manager cautions that a quick increase in cover does not prove the wetland has recovered. New plants may need time to establish, and bird counts can change with weather, season, observer timing, or the availability of food elsewhere.",
      "A year later, the team finds that water depth changes across more parts of the restored site, and plant cover remains higher than at the initial check. The nearby comparison area shows little change in plant cover during the same period. Those patterns are consistent with a positive response at the restored site. They are not a complete explanation of cause. Rainfall differed between the two years, and the team did not measure every feature of habitat quality. The comparison helps, but it cannot control for all environmental differences.",
      "Some residents define success as more wildlife near the path. Others focus on whether the site can hold water during storms. The project team explains that these goals are related but not interchangeable. A change in water movement may influence plants and habitat, but a single year of observation may be too short to identify long-term effects. The team needs to connect each goal to a measure and explain how often it will be checked. It should also report uncertainty instead of turning a promising pattern into a guarantee.",
      "The team proposes a monitoring plan for the next three years. It will repeat the same measurements in both areas, record rainfall and season, and add a simple assessment of plant survival. Community volunteers can help observe the path, while trained staff check water levels using a consistent method. The plan does not make the project successful in advance. It makes future conclusions more informative because the measures, comparison, and limits are stated clearly.",
      "A careful report might conclude that the restored area showed increased plant cover and broader water-depth variation during the first year, while bird observations remained inconsistent. The team can say these early indicators are encouraging, but additional monitoring is needed to assess durability and broader habitat outcomes. That conclusion answers the current evidence without pretending to answer every question. In environmental science, success is often evaluated through several connected indicators over time, with attention to what each one can and cannot reveal.",
    ],
    question: "Which conclusion best matches the evidence and its limitations?",
    choices: [
      "Several early indicators changed in a promising direction, but longer monitoring is needed to judge durability.",
      "The wetland has fully recovered because plant cover increased once.",
      "Bird observations prove that the restoration had no effect.",
    ],
    answer: 0,
    rationale:
      "The final paragraph reports increased plant cover and water variation, inconsistent bird observations, and the need for longer monitoring.",
    evidence: ["p3", "p5", "p6"],
    categories: ["Reported indicator", "Interpretation or limitation"],
    items: [
      {
        id: "cover",
        text: "Plant cover remained higher than at the first check.",
        answer: "Reported indicator",
      },
      {
        id: "cause",
        text: "Rainfall differences may affect the comparison.",
        answer: "Interpretation or limitation",
      },
      { id: "birds", text: "Bird visits varied across checks.", answer: "Reported indicator" },
      {
        id: "success",
        text: "One measure alone defines a healthy wetland.",
        answer: "Interpretation or limitation",
      },
    ],
    response:
      "Write a two-part conclusion: state one change supported by the report, then explain why that change is not enough to prove full recovery.",
    transfer:
      "A city reports that a new park has more visitors this year. Name one additional indicator and one comparison that would strengthen a claim about the park’s impact.",
  },
  {
    id: "rr912-school-phone-policy",
    grade: "9-12",
    title: "Should a School Change Its Phone Policy?",
    summary:
      "Compare two student arguments, inspect an incomplete survey, and develop a recommendation that addresses counterevidence.",
    genre: "Paired opinion essays with survey data",
    subject: "Civics and education",
    keyUse: "Argue",
    standard: "ELD-LA",
    focus: "Compare claims, assess a survey, and respond to a counterclaim",
    vocabulary: [
      ["policy", "a rule or plan that guides decisions"],
      ["counterclaim", "a position that challenges or qualifies a claim"],
      ["representative", "reflecting the range of people or views in a larger group"],
      ["implementation", "the way a rule or plan is put into practice"],
    ],
    paragraphs: [
      "In this fictional school, a student advisory group is reviewing the phone policy. During class, phones are expected to remain away unless a teacher asks students to use them for a learning task. Some students want the rule to continue; others want a designated break-time option. The group reads two short arguments and reviews an illustrative survey summary. The assignment is not to decide whether technology is good or bad in general. It is to judge which policy would address the concerns in this school and what evidence is still missing.",
      "Argument A supports the current rule. Its authors say that putting phones away during lessons can reduce interruptions and make it easier to follow discussions. They also note that a consistent rule gives teachers a predictable way to begin class. The authors acknowledge a counterclaim: students may need to contact family or check an important message. They propose that the office remain available for urgent communication and that teachers approve phones when a lesson requires a device. Their argument emphasizes a shared classroom routine, but it does not provide direct measures of attention or learning.",
      "Argument B proposes a supervised phone break at lunch. Its authors say a clearly defined time could recognize students’ need to communicate without changing the expectation during instruction. They also point out that some students use a phone to coordinate transportation or care responsibilities. The proposal has a cost: staff would need to explain and supervise the routine, and students might disagree about whether a message is urgent. The authors suggest a trial period and a review of classroom interruptions, but they do not specify how those interruptions would be counted.",
      "The survey summary reports that 126 students responded: 71 support the current rule, 39 want a lunch option, and 16 are undecided. The survey was shared through two advisory classes, and participation was optional. The summary does not say how many students received it, whether grade levels responded at similar rates, or how students who were absent could share a view. The results describe the respondents, but they may not represent every student. A larger count does not fix a sampling gap if the same groups are still missing.",
      "The advisory group identifies evidence it would need before recommending a change. It could use the same brief observation routine across several classes, ask students from every grade to respond, and collect anonymous comments about urgent communication. The group should define an interruption consistently rather than counting only incidents a teacher happens to notice. It could also compare the time needed to teach and supervise a lunch option with the value students report. Those measures would not answer every question, but they would make the discussion more specific.",
      "At the next meeting, students draft a conditional recommendation: keep phones away during instruction, clarify how students can reach family in an urgent situation, and test a supervised lunch option only if staff can manage it safely. They propose reviewing the trial after a set period using student responses and the same classroom observation method. Another student argues that the school should keep the current policy without a trial. The group records that disagreement and the evidence each side wants. A useful policy statement makes its reasoning visible and names how the school will revisit the decision.",
    ],
    question: "What is a limitation of the survey summary?",
    choices: [
      "It does not show who received the survey or whether responses represent students across grades.",
      "It contains more than one possible opinion.",
      "It was summarized using numbers rather than paragraphs.",
    ],
    answer: 0,
    rationale:
      "Paragraph 4 explains that distribution and response patterns across grade levels are unknown.",
    evidence: ["p4", "p5"],
    categories: ["Claim or proposal", "Evidence limitation"],
    items: [
      {
        id: "routine",
        text: "A consistent rule can give teachers a predictable class routine.",
        answer: "Claim or proposal",
      },
      {
        id: "sample",
        text: "The number of students who received the survey is not reported.",
        answer: "Evidence limitation",
      },
      {
        id: "trial",
        text: "A supervised lunch option could be tested with a review plan.",
        answer: "Claim or proposal",
      },
      {
        id: "absent",
        text: "Absent students may not have had a way to respond.",
        answer: "Evidence limitation",
      },
    ],
    response:
      "Write a recommendation about the phone policy. Use one reason from each argument, respond to a counterclaim, and explain what evidence should guide a review.",
    transfer:
      "Your school is considering a new hallway routine. Describe a fair way to gather student evidence and one limitation decision makers should disclose.",
  },
];

const standards = JSON.parse(
  fs.readFileSync("access-practice-lab/content/alignment-index.json", "utf8"),
).expectationCatalog;
const asId = (n) => `p${n + 1}`;
function makeLesson(s) {
  const expectation = standards.find(
    (x) =>
      x.gradeCluster === s.grade &&
      x.standard === s.standard &&
      x.keyUse === s.keyUse &&
      x.mode === "Interpretive",
  )?.id;
  const pids = s.paragraphs.map((_, i) => asId(i));
  return {
    id: s.id,
    revision: "1.0.0",
    title: s.title,
    summary: s.summary,
    gradeCluster: s.grade,
    genre: s.genre,
    subject: s.subject,
    topics: [s.subject, s.focus],
    keyUse: s.keyUse,
    eldStandard: s.standard,
    languageExpectations: expectation ? [expectation] : [],
    alignmentStatus:
      "Public-framework candidate based on the grade cluster, discipline, Key Language Use, and interpretive task; educator review required.",
    languageFunction: s.focus,
    languageFeatures: [
      "evaluate evidence and reasoning",
      "disciplinary vocabulary",
      "cohesive explanation",
    ],
    languageDimensions: ["discourse", "sentence", "word/phrase"],
    taskComplexity:
      "Sustained original text with six connected sections, evidence analysis, and transfer; no numeric readability or grade-equivalent score is asserted.",
    minutes: 25,
    readingPath: "sustained",
    objectives: {
      content: `Analyze ${s.focus.toLowerCase()}.`,
      language:
        "Build a qualified explanation or argument using precise vocabulary, relevant evidence, and a stated limitation.",
    },
    beforeReading: {
      essentialQuestion: `How can readers decide what the evidence supports about ${s.title.replace(/[?!.]$/, "").toLowerCase()}?`,
      background:
        "Preview the title and identify what you already know and what you would still need to verify.",
      hook: "As you read, track how each section adds evidence, a qualification, or a new question.",
      purpose: `Read to investigate ${s.focus.toLowerCase()} and distinguish a supported conclusion from an overstatement.`,
    },
    vocabulary: s.vocabulary.map(([term, definition]) => ({
      term,
      definition,
      example:
        s.paragraphs.find((p) => p.toLowerCase().includes(term.toLowerCase())) || s.paragraphs[0],
    })),
    paragraphs: s.paragraphs.map((text, i) => ({
      id: pids[i],
      text,
      guidingQuestion:
        i === 0
          ? "What question or decision frames the reading?"
          : i === s.paragraphs.length - 1
            ? "What conclusion is justified, and what remains uncertain?"
            : "What new evidence, perspective, or limitation does this section add?",
    })),
    activities: [
      {
        id: "central-claim",
        phase: "first",
        skill: "Interpret the central claim",
        type: "choice",
        prompt: s.question,
        choices: s.choices.map((text, i) => ({ id: `choice-${i + 1}`, text })),
        answerId: `choice-${s.answer + 1}`,
        rationale: s.rationale,
      },
      {
        id: "evidence-selection",
        phase: "second",
        skill: "Select relevant evidence",
        type: "evidence",
        prompt:
          "Select the paragraph or paragraphs that most directly support the interpretation above.",
        paragraphIds: pids,
        answerIds: s.evidence,
        rationale: `${s.rationale} Review ${s.evidence.map((p) => `paragraph ${p.slice(1)}`).join(" and ")} and explain how the details support the conclusion.`,
      },
      {
        id: "evidence-role",
        phase: "second",
        skill: "Distinguish evidence from interpretation",
        type: "sort",
        prompt: "Classify each statement by how it functions in the reading.",
        categories: s.categories,
        items: s.items,
        rationale:
          "Return to the passage and distinguish a reported detail from an explanation, proposal, or unanswered question.",
      },
      {
        id: "explain-the-reasoning",
        phase: "third",
        skill: "Explain reasoning with evidence",
        type: "short",
        prompt: s.response,
        lookFor: [
          "A clear claim or explanation",
          "Two accurate details or one precise detail with paragraph reference",
          "Reasoning that connects evidence to the claim",
          "A limitation, counterclaim, or remaining question",
        ],
        rubric: [
          "States a defensible claim",
          "Uses accurate and relevant textual evidence",
          "Explains why the evidence supports the claim",
          "Acknowledges a limitation or counterpoint",
        ],
        frame:
          "The passage supports the idea that ___. In paragraph ___, ___. This matters because ___. However, the evidence does not yet show ___.",
      },
      {
        id: "transfer",
        phase: "third",
        skill: "Transfer the reading strategy",
        type: "short",
        prompt: s.transfer,
        lookFor: [
          "A response to the new situation",
          "A relevant kind of evidence",
          "An explanation of what that evidence would and would not show",
        ],
        rubric: [
          "Applies the underlying reasoning to a new context",
          "Names evidence suited to the question",
          "Explains a meaningful limitation",
        ],
        frame:
          "I would examine ___. That evidence could show ___. It would not establish ___ unless ___.",
      },
    ],
    transferPrompt: s.transfer,
    teacherGuide: {
      contentObjective: `Analyze ${s.focus.toLowerCase()} using connected evidence from a sustained text.`,
      languageObjective:
        "Qualify a conclusion with precise evidence, a reasoning link, and a limitation.",
      miniLesson:
        "Model a three-column annotation: claim, exact evidence, and what the evidence cannot establish. Compare a careful claim with a plausible overstatement.",
      discussion: [
        s.question,
        "Which detail most changes or qualifies the interpretation?",
        "What new evidence would help answer a remaining question?",
      ],
      misconception:
        "A relevant number or quotation may feel decisive; ask whether it measures the outcome named in the claim and whose perspective may be missing.",
      scaffolds: {
        modeled: "Think aloud to connect one claim, a paragraph detail, and a limitation.",
        guided: "Use the optional response frame and mark two evidence paragraphs.",
        independent:
          "Make a qualified claim without a frame and transfer the evidence test to a new context.",
      },
      answerNotes: [
        s.rationale,
        `Key evidence appears in ${s.evidence.map((p) => `paragraph ${p.slice(1)}`).join(" and ")}. Open responses are reviewed with the visible rubric; they are not automatically scored.`,
      ],
      modelResponse: `${s.rationale} The passage supports this interpretation through details in ${s.evidence.map((p) => `paragraph ${p.slice(1)}`).join(" and ")}, while also identifying information that would be needed for a broader conclusion.`,
      sourceNote:
        "Original sustained-reading scenario and questions authored for EduWonderLab; not official WIDA test material.",
    },
    familySupport: {
      directions: {
        en: "Choose one section at a time. Ask which detail changed or qualified the reader’s thinking. Discuss in any language, then invite the student to explain one evidence-based idea in English.",
        es: "Lean una sección a la vez. Pregunte qué detalle cambió o limitó la idea del lector. Conversen en cualquier idioma y luego invite al estudiante a explicar en inglés una idea basada en evidencia.",
      },
      questions: [
        "Which detail best supports the conclusion?",
        "What question is still unanswered?",
      ],
      noEnglishRequired:
        "Family discussion can happen in any language; the student can practice explaining one evidence-based idea in English afterward.",
    },
    connections: {
      write: "Write a qualified evidence-based claim.",
      speak: "Explain the conclusion and one limitation orally.",
      listen: "Compare the reading with a related classroom explanation.",
      relatedActivity: null,
    },
    editorial: {
      status: "authored-pending-independent-editorial-review",
      humanReview:
        "Not independently reviewed; automated validation is not editorial certification.",
      source: "Original EduWonderLab sustained-reading content; not official WIDA material.",
      factCheck:
        "Scenarios and item keys require independent editorial verification before approval.",
      accessibility:
        "Text is divided into labeled paragraphs with native keyboard-operable tasks; visual and assistive-technology review remains pending.",
      lastReviewed: "2026-10-26",
    },
  };
}
for (const spec of entries) {
  const index = doc.lessons.findIndex((l) => l.id === spec.id);
  if (
    index >= 0 &&
    ![
      "Original EduWonderLab instructional content; not official WIDA material.",
      "Original EduWonderLab sustained-reading content; not official WIDA material.",
    ].includes(doc.lessons[index].editorial?.source)
  )
    throw new Error(`Refusing to overwrite unrelated lesson: ${spec.id}`);
  const lesson = makeLesson(spec);
  if (index >= 0) doc.lessons[index] = lesson;
  else doc.lessons.push(lesson);
}
fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(
  `Added ${entries.length} sustained reads; independent editorial review remains pending.`,
);
