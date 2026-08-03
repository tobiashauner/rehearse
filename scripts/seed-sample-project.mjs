// Seeds a fully-populated demo project so the "multiple completed interviews"
// UX (sessions list, coaching plan, review/debrief pages, analytics trend)
// can be seen and tested without doing real interviews.
//
// Usage:
//   node --env-file=.env.local scripts/seed-sample-project.mjs
//
// - Attaches to the account chosen below (SEED_USER_EMAIL).
// - Everything lives under a project whose title starts with SAMPLE_PREFIX,
//   so re-running WIPES the previous sample project(s) first and rebuilds —
//   your real projects are never touched.
// - No storage uploads: resources carry text `content` only (enough for every
//   view; the file-download button just won't have a blob behind it).

import { createClient } from "@supabase/supabase-js";

const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL || "tahauner@gmail.com";
const SAMPLE_PREFIX = "Sample —";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();

// ————————————————————————————————————————————————————————————————
// Static content: role/company, resources, briefing.
// ————————————————————————————————————————————————————————————————

const PROJECT = {
  title: `${SAMPLE_PREFIX} Senior PM @ Northwind Health`,
  company: "Northwind Health",
  role: "Senior Product Manager",
};

const RESOURCES = [
  {
    type: "resume",
    name: "Alex Rivera — Resume.pdf",
    content:
      "Alex Rivera — Product Manager (7 yrs). Currently PM at a Series-B fintech, " +
      "owning the payments dashboard used by 40k SMB merchants. Shipped a " +
      "reconciliation tool that cut support tickets 22%. Earlier: analyst at a " +
      "healthcare startup. Strengths: discovery, cross-functional delivery. " +
      "Less exposure to formal experimentation and 0→1 in regulated healthcare.",
  },
  {
    type: "job_description",
    name: "Senior PM — Northwind Health",
    url: "https://northwind.example.com/careers/senior-pm",
    content:
      "Senior Product Manager, Care Coordination. Own the roadmap for the " +
      "patient-provider messaging surface. Partner with clinical, design, and " +
      "eng to ship HIPAA-compliant workflows. Must be strong on metrics, " +
      "experimentation, and stakeholder alignment in a regulated environment.",
  },
  {
    type: "personal_notes",
    name: "Recruiter call notes",
    content:
      "Loop: recruiter screen (done) → hiring-manager behavioral → product " +
      "sense/case → execution & analytics → exec/values. HM cares a lot about " +
      "metrics rigor and how you handle clinical stakeholders who push back.",
  },
];

const BRIEFING = {
  roleSummary:
    "A Senior PM owning the patient-provider messaging surface at Northwind " +
    "Health — driving HIPAA-compliant care-coordination workflows from " +
    "discovery through measured launch, in close partnership with clinical, " +
    "design, and engineering.",
  requiredSkills: [
    "Product discovery & user research",
    "Metrics definition and experimentation (A/B, guardrails)",
    "Roadmapping & prioritization under constraints",
    "Cross-functional delivery",
    "Stakeholder alignment with clinical/compliance",
    "Working in a regulated (HIPAA) environment",
  ],
  leadershipSignals: [
    "Sets a crisp product vision others can rally behind",
    "Drives decisions with data without stalling on it",
    "Navigates conflict between clinical safety and shipping speed",
    "Grows influence without formal authority",
  ],
  companyCulture:
    "Mission-driven and evidence-first; clinicians are treated as core " +
    "stakeholders, so tradeoffs get scrutinized for patient safety, not just " +
    "growth. Pace is deliberate but bias-to-ship within guardrails.",
  likelyInterviewFocus: [
    "How you define and defend success metrics",
    "0→1 vs. scaling judgment",
    "Handling pushback from clinical stakeholders",
    "Experimentation rigor",
    "Prioritization tradeoffs",
  ],
  resumeStrengths: [
    "Owns a real, sizable surface (40k merchants)",
    "Shipped a measurable outcome (−22% support tickets)",
    "Strong discovery and cross-functional delivery track record",
    "Early healthcare exposure to build on",
  ],
  resumeGaps: [
    "Limited formal experimentation / A-B testing depth",
    "No recent 0→1 in a regulated domain",
    "Metrics stories lean qualitative over quantified",
  ],
  potentialConcerns: [
    "May under-quantify impact when pressed",
    "Regulated-environment tradeoffs are newer territory",
  ],
  suggestedStories: [
    "The reconciliation tool that cut support tickets 22%",
    "A time a stakeholder blocked a launch and how it resolved",
    "A bet that failed and what the data taught you",
  ],
  recommendedStarExamples: [
    "STAR: driving a metric improvement end-to-end",
    "STAR: resolving cross-functional conflict",
    "STAR: killing or reshaping a feature based on evidence",
  ],
  likelyQuestions: [
    "How would you measure success for a new patient-messaging feature?",
    "Walk me through a product you shipped and its impact.",
    "How do you handle a clinician who blocks a change on safety grounds?",
    "Design an experiment to test a risky assumption.",
  ],
};

const COACHING_PLAN = {
  headline:
    "Clear upward trend — structure and metrics rigor have both improved; the " +
    "remaining gap is quantified impact under pressure.",
  progress:
    "Scores climbed from 57 to 82 across four sessions. Early answers rambled " +
    "and leaned qualitative; by the latest session answers were STAR-structured " +
    "with named metrics. The consistent soft spot is defending a metric choice " +
    "when an interviewer pushes back on tradeoffs.",
  focusAreas: [
    {
      area: "Quantify impact, every time",
      why:
        "In sessions 1–2 several strong stories landed vaguely ('adoption grew') " +
        "and lost points for missing baselines and magnitudes.",
      practice:
        "For your top 5 stories, write a one-line 'metric spine': baseline → " +
        "change → timeframe → how you knew it was causal. Rehearse each cold.",
    },
    {
      area: "Defend metric tradeoffs under pushback",
      why:
        "The skeptical and metrics-pushing interviewers exposed hesitation when " +
        "asked why not a different north-star or guardrail.",
      practice:
        "Practice the 'metric + guardrail + counter-metric' triad out loud: for " +
        "any success metric, name what it could cannibalize and how you'd catch it.",
    },
    {
      area: "Clinical-stakeholder conflict",
      why:
        "Answers about clinician pushback were reasonable but generic; Northwind " +
        "weights this heavily.",
      practice:
        "Prepare one concrete STAR where a safety-minded stakeholder blocked you, " +
        "and how you reframed the disagreement into a shared guardrail.",
    },
  ],
  strengthsToKeep: [
    "Genuine discovery instinct — you start from the user",
    "Calm, structured delivery in the later sessions",
    "Cross-functional framing comes naturally",
  ],
  suggestedNextInterview: {
    interviewType: "product",
    difficulty: "hard",
    focus:
      "A metrics-heavy product case with a hostile stakeholder twist — force " +
      "yourself to defend a north-star metric and its guardrails out loud.",
  },
};

// ————————————————————————————————————————————————————————————————
// Sessions. Each completed session is fully authored: config, questions,
// answers (transcript + per-answer feedback), and a debrief summary. Scores
// climb across sessions to give the analytics trend + coaching plan something
// real to render.
// ————————————————————————————————————————————————————————————————

function fb(summary, strengths, improvements, missedPoints) {
  return { summary, strengths, improvements, missedPoints };
}

const COMPLETED_SESSIONS = [
  {
    daysAgo: 34,
    interview_type: "behavioral",
    difficulty: "medium",
    interviewer_personality: "friendly",
    conversation_mode: "adaptive",
    length_minutes: 30,
    duration_seconds: 1490,
    overall_score: 57,
    summary: {
      overallScore: 57,
      headline:
        "Warm, likeable answers with real substance underneath — but they ramble and rarely land a number.",
      strengths: [
        "Clearly user-centered thinking",
        "Comfortable, natural storytelling",
      ],
      weaknesses: [
        "Answers run long and bury the point",
        "Impact stated qualitatively, almost never quantified",
      ],
      questionsMissed: [
        "Tell me about a product you shipped and its impact.",
        "How do you prioritize when everything feels urgent?",
      ],
      recommendedPractice: [
        "Cut each story to a 20-second STAR skeleton before adding color",
        "Attach a baseline and a number to every impact claim",
      ],
    },
    questions: [
      {
        category: "Intro",
        difficulty: "easy",
        question: "Walk me through your background and why this role.",
        answer:
          "Sure — I've been a PM for about seven years, most recently on the payments dashboard at a fintech. I like this role because it's messaging in healthcare, which feels higher-stakes and I want work that matters more.",
        score: 62,
        feedback: fb(
          "Friendly and clear, but the 'why this role' is thin and generic.",
          ["Concise", "Genuine motivation comes through"],
          ["Tie your fintech surface to the care-coordination problem specifically", "Name what about Northwind's mission pulls you"],
          ["What in your experience transfers to regulated healthcare"],
        ),
      },
      {
        category: "Behavioral - Impact",
        difficulty: "medium",
        question: "Tell me about a product you shipped and its impact.",
        answer:
          "I built a reconciliation tool for our merchants. Before it, support was drowning in 'where's my money' tickets, and after we launched adoption grew steadily and the team was a lot happier. It was probably my proudest launch.",
        score: 48,
        feedback: fb(
          "A strong story told without its numbers — the impact evaporates.",
          ["Real, ownable project", "Clear problem framing"],
          ["Lead with the outcome: '−22% support tickets in a quarter'", "Say your role and the key decision you made"],
          ["The 22% ticket reduction on your own resume", "Baseline volume and timeframe"],
        ),
      },
      {
        category: "Behavioral - Conflict",
        difficulty: "medium",
        question: "Describe a disagreement with an engineer and how it resolved.",
        answer:
          "An engineer thought a feature was over-scoped. We talked it through and eventually agreed to cut it down. It worked out fine and we shipped a smaller version.",
        score: 54,
        feedback: fb(
          "Reasonable instinct but too smooth — no real tension or lesson.",
          ["Collaborative default"],
          ["Show what data or reasoning changed your mind", "Name the tradeoff you accepted by cutting scope"],
          ["What you'd do differently", "How you protected the core user need while cutting"],
        ),
      },
      {
        category: "Behavioral - Prioritization",
        difficulty: "medium",
        question: "How do you prioritize when everything feels urgent?",
        answer:
          "I try to look at what's most important and talk to stakeholders, then make a call. I use a rough sense of impact versus effort and go from there.",
        score: 50,
        feedback: fb(
          "Describes the vibe of prioritization, not a method.",
          ["Mentions impact vs. effort"],
          ["Give a concrete framework and a real example of applying it", "Explain how you say no and to whom"],
          ["A specific instance where you deprioritized something visible", "How you communicated the tradeoff"],
        ),
      },
      {
        category: "Behavioral - Growth",
        difficulty: "easy",
        question: "Tell me about a time you failed.",
        answer:
          "We built a feature nobody used. In hindsight we didn't talk to enough users first. I learned to do more discovery, which I now always do.",
        score: 66,
        feedback: fb(
          "Honest and shows a real lesson — one of your stronger answers.",
          ["Owns the failure without deflecting", "Clear, applied takeaway"],
          ["Quantify the cost (eng-weeks, usage) to show the stakes"],
          ["What signal would have caught it earlier"],
        ),
      },
      {
        category: "Motivation",
        difficulty: "easy",
        question: "Why leave your current role now?",
        answer:
          "I've done a lot at the fintech and I'm looking for a new challenge with more mission behind it. Healthcare feels like the right next step for me.",
        score: 60,
        feedback: fb(
          "Fine but forgettable — 'new challenge' is a filler phrase.",
          ["Positive framing, no bad-mouthing"],
          ["Point to a specific ceiling you've hit", "Connect the mission to something concrete you want to build"],
          ["Why now specifically vs. six months ago"],
        ),
      },
    ],
  },
  {
    daysAgo: 23,
    interview_type: "product",
    difficulty: "medium",
    interviewer_personality: "analytical",
    conversation_mode: "adaptive",
    length_minutes: 30,
    duration_seconds: 1685,
    overall_score: 67,
    summary: {
      overallScore: 67,
      headline:
        "Much tighter structure this time; product sense is solid but tradeoff reasoning stays surface-level.",
      strengths: [
        "STAR structure is emerging",
        "Good user segmentation instinct",
      ],
      weaknesses: [
        "Success metrics named but not defended",
        "Skips guardrails / second-order effects",
      ],
      questionsMissed: [
        "How would you measure success for patient messaging?",
        "What would you cut from the MVP and why?",
      ],
      recommendedPractice: [
        "Pair every north-star metric with a guardrail metric",
        "Practice defending a metric against an obvious counter-metric",
      ],
    },
    questions: [
      {
        category: "Product Sense",
        difficulty: "medium",
        question: "Design a patient-provider messaging feature. Where do you start?",
        answer:
          "I'd start with the users — patients who want quick answers and providers who are time-constrained. The core job is a low-friction way to ask a non-urgent question and get a reliable response, so I'd anchor the MVP on async threaded messaging with clear response-time expectations.",
        score: 74,
        feedback: fb(
          "Strong, user-first framing with a crisp MVP anchor.",
          ["Segments both sides of the marketplace", "Names the core job-to-be-done"],
          ["State how you'd sequence discovery to validate the 'non-urgent' assumption"],
          ["Triage/escalation for messages that turn out to be urgent"],
        ),
      },
      {
        category: "Metrics",
        difficulty: "medium",
        question: "How would you measure success for that feature?",
        answer:
          "I'd look at adoption and engagement — how many patients send a message and how many come back. And provider response rate. If those go up, it's working.",
        score: 58,
        feedback: fb(
          "Names sensible metrics but treats 'up = good' without nuance.",
          ["Covers both sides of the interaction"],
          ["Pick one north-star and justify it over the alternatives", "Add a guardrail — e.g. provider burden or response latency"],
          ["Counter-metric: messaging could deflect needed visits", "How you'd separate healthy vs. anxious over-messaging"],
        ),
      },
      {
        category: "Prioritization",
        difficulty: "medium",
        question: "What would you cut from the MVP and why?",
        answer:
          "I'd cut things like read receipts and rich attachments to start. They're nice but not core. I'd keep the basic send-and-reply loop and response-time expectations.",
        score: 68,
        feedback: fb(
          "Good MVP discipline; the cut logic is reasonable if a little safe.",
          ["Protects the core loop", "Willing to defer polish"],
          ["Tie each cut to a hypothesis you're deferring, not just 'nice to have'"],
          ["Whether attachments are actually core for clinical context"],
        ),
      },
      {
        category: "Experimentation",
        difficulty: "medium",
        question: "You suspect response-time SLAs increase provider stress. How do you test it?",
        answer:
          "I'd run an experiment — show the SLA to some providers and not others, and compare their stress somehow, maybe a survey, and look at response times too.",
        score: 55,
        feedback: fb(
          "The instinct to experiment is right but the design is fuzzy.",
          ["Reaches for a controlled comparison"],
          ["Define the unit of randomization and the primary metric up front", "Name a behavioral proxy for stress, not just a survey"],
          ["Sample size / duration intuition", "Guardrail on patient response latency"],
        ),
      },
      {
        category: "Product Sense",
        difficulty: "medium",
        question: "A clinician says the feature will bury urgent messages. What do you do?",
        answer:
          "That's a fair concern. I'd add some kind of triage so urgent stuff gets flagged and routed differently, and I'd work with them to define what urgent means.",
        score: 70,
        feedback: fb(
          "Handles the pushback constructively and co-opts the clinician.",
          ["Takes the safety concern seriously", "Turns it into a design requirement"],
          ["Describe how triage decides urgency without over-alerting"],
          ["Liability framing — what happens if triage is wrong"],
        ),
      },
      {
        category: "Execution",
        difficulty: "medium",
        question: "Two weeks post-launch, engagement is flat. First three things you check?",
        answer:
          "I'd check whether people are even finding the feature, then whether the ones who try it come back, and I'd read some actual messages to see if it's useful. Basically funnel plus qualitative.",
        score: 72,
        feedback: fb(
          "Good funnel instinct paired with qualitative — a mature move.",
          ["Separates discovery from retention", "Doesn't rely on numbers alone"],
          ["Order them by cheapest-to-check first"],
          ["Segment by provider — flat overall can hide bimodal adoption"],
        ),
      },
    ],
  },
  {
    daysAgo: 12,
    interview_type: "technical",
    difficulty: "hard",
    interviewer_personality: "skeptical",
    conversation_mode: "adaptive",
    length_minutes: 45,
    duration_seconds: 2320,
    overall_score: 74,
    summary: {
      overallScore: 74,
      headline:
        "Handled a skeptical execution interview well — metrics reasoning is noticeably sharper, with a couple of soft spots under hard follow-ups.",
      strengths: [
        "Now pairing metrics with guardrails unprompted",
        "Stays composed when challenged",
      ],
      weaknesses: [
        "Occasionally over-indexes on the happy path",
        "One estimation answer lacked a clear method",
      ],
      questionsMissed: [
        "Estimate the messaging volume Northwind should plan for.",
      ],
      recommendedPractice: [
        "Rehearse a repeatable estimation scaffold out loud",
        "Pre-plan the counter-metric for your favorite success metrics",
      ],
    },
    questions: [
      {
        category: "Analytics",
        difficulty: "hard",
        question: "Engagement is up but NPS dropped. How do you reconcile that?",
        answer:
          "Higher engagement with lower NPS usually means people are using it more but liking it less — maybe they're forced to, or the experience is frustrating but necessary. I'd segment: are the disengaged-happy users leaving and the engaged-frustrated ones staying? I'd look at message reopen rates and time-to-resolution, because engagement that's really 'repeated attempts to get an answer' is a bad kind of engagement.",
        score: 84,
        feedback: fb(
          "Excellent — recognizes that engagement can be a symptom, not a win.",
          ["Distinguishes healthy vs. unhealthy engagement", "Proposes a concrete disambiguating metric"],
          ["Name which segment you'd act on first"],
          ["Whether NPS timing (post-resolution vs. random) skews it"],
        ),
      },
      {
        category: "Metrics",
        difficulty: "hard",
        question: "Defend your north-star metric against my claim it's gameable.",
        answer:
          "If my north-star is 'resolved conversations,' you're right it's gameable — a provider could close threads to hit it. So I'd pair it with a guardrail on reopen rate and patient-reported resolution, and I'd monitor the ratio. The north-star sets direction; the guardrails keep it honest.",
        score: 80,
        feedback: fb(
          "Strong — anticipates the gaming vector and closes it with a guardrail.",
          ["Metric + guardrail + counter-metric triad", "Concedes the flaw instead of getting defensive"],
          ["Say how you'd detect gaming in the data specifically"],
          ["Who owns the guardrail when it trips"],
        ),
      },
      {
        category: "Estimation",
        difficulty: "hard",
        question: "Estimate the daily message volume Northwind should plan for.",
        answer:
          "Um, it depends on how many patients there are. If it's a few hundred thousand patients and some fraction message per week, you'd get maybe tens of thousands of messages a day? I'd want the real numbers to be sure.",
        score: 58,
        feedback: fb(
          "Reaches the right order of magnitude but the path there is hand-wavy.",
          ["Lands in a plausible range"],
          ["Lay out the scaffold explicitly: patients × active% × msgs/active/week ÷ 7", "State each assumption as a number you can defend"],
          ["Peak vs. average (Monday spikes)", "Provider-side reply volume as a second stream"],
        ),
      },
      {
        category: "Execution",
        difficulty: "hard",
        question: "A rollout causes a spike in urgent messages misrouted as routine. Walk me through the next hour.",
        answer:
          "First I'd assess blast radius — how many messages, and is any patient safety at risk right now. If yes, I'd roll back the routing change immediately and route everything to the safe default, even if noisy, then communicate to the clinical team. Fixing the classifier comes after the bleeding stops.",
        score: 82,
        feedback: fb(
          "Great incident instinct — safety first, mitigate before you diagnose.",
          ["Prioritizes patient safety over elegance", "Clear rollback-then-fix sequencing"],
          ["Name who you page and what you tell patients"],
          ["The post-incident guardrail to prevent recurrence"],
        ),
      },
      {
        category: "Tradeoffs",
        difficulty: "medium",
        question: "Ship a partial feature to hit a deadline, or slip two weeks for full scope?",
        answer:
          "It depends what the partial version does to the user and to trust. If the partial version is coherent and safe, I'd ship it and fast-follow. If 'partial' means confusing or unsafe in a clinical context, the two weeks are cheap insurance. I'd frame it to leadership as a risk decision, not a date decision.",
        score: 78,
        feedback: fb(
          "Mature — reframes a date question as a risk question.",
          ["No dogmatic answer; decides on user/trust impact", "Good stakeholder framing"],
          ["Give the concrete line: what makes partial 'coherent' here"],
          ["How you'd measure whether the fast-follow actually happened"],
        ),
      },
      {
        category: "Analytics",
        difficulty: "medium",
        question: "How would you detect that the feature helps some clinics and hurts others?",
        answer:
          "I'd break the metrics down by clinic instead of looking at the average, because averages hide bimodal effects. Then I'd look at what's different about the clinics doing well — staffing, message mix, how they configured it — to see if it's a rollout problem or a fit problem.",
        score: 76,
        feedback: fb(
          "Right instinct to distrust the average and hunt for the confound.",
          ["Segmentation before conclusions", "Separates rollout vs. product-fit causes"],
          ["Mention a minimum clinic size before the split is trustworthy"],
          ["Whether you'd hold out low-fit clinics rather than force rollout"],
        ),
      },
      {
        category: "Design",
        difficulty: "hard",
        question: "Providers ignore the triage flags. How do you redesign the incentive?",
        answer:
          "If they're ignoring flags, either the flags are too noisy or acting on them is too costly. I'd check the false-positive rate first — trust dies fast if the flag cries wolf. Then I'd make the right action the path of least resistance, so a flagged message is one tap to escalate, not a workflow detour.",
        score: 79,
        feedback: fb(
          "Diagnoses alert fatigue and fixes the workflow, not just the UI.",
          ["Roots cause in false-positive rate", "Reduces the cost of the correct action"],
          ["Quantify what flag precision you'd need before providers trust it"],
          ["A feedback loop so ignored flags retrain the classifier"],
        ),
      },
    ],
  },
  {
    daysAgo: 3,
    interview_type: "leadership",
    difficulty: "hard",
    interviewer_personality: "pushes_for_metrics",
    conversation_mode: "adaptive",
    length_minutes: 30,
    duration_seconds: 1595,
    overall_score: 82,
    summary: {
      overallScore: 82,
      headline:
        "Confident, quantified, and composed under a metrics-obsessed interviewer — this is interview-ready.",
      strengths: [
        "Leads with numbers now, unprompted",
        "STAR structure is automatic",
        "Handles pushback without getting rattled",
      ],
      weaknesses: [
        "One vision answer stayed a touch abstract",
      ],
      questionsMissed: [],
      recommendedPractice: [
        "Tighten the product-vision answer into one memorable sentence",
        "Keep a fresh clinical-conflict STAR ready in case it repeats",
      ],
    },
    questions: [
      {
        category: "Leadership - Influence",
        difficulty: "hard",
        question: "How did you get a skeptical team behind a bet with no formal authority?",
        answer:
          "On the reconciliation tool, eng was skeptical it would move the needle. So I didn't argue — I pulled the numbers: 31% of support tickets were reconciliation-related, ~2,400 a month. I turned that into a one-pager with the ticket cost and a small prototype that resolved the top case. Once people saw the volume and a working slice, the debate shifted from 'should we' to 'how fast.' We shipped in six weeks and tickets dropped 22%.",
        score: 88,
        feedback: fb(
          "Textbook influence-without-authority, anchored in real numbers.",
          ["Quantifies the problem before proposing the solution", "Prototype-as-persuasion is compelling", "Closes with the measured outcome"],
          ["One line on how you kept eng bought-in after launch"],
          [],
        ),
      },
      {
        category: "Leadership - Conflict",
        difficulty: "hard",
        question: "Tell me about a clinical or safety stakeholder who blocked you.",
        answer:
          "A clinical lead blocked a self-service change, worried patients would self-triage wrong. Instead of escalating, I asked what evidence would make her comfortable. We agreed on a guardrail: a hard escalation path plus a two-week monitored pilot with a stop rule if mis-triage crossed a threshold. It stayed under it, she became the change's advocate, and the guardrail shipped as a permanent feature.",
        score: 85,
        feedback: fb(
          "Exactly the Northwind-shaped answer — turns a blocker into a co-owner.",
          ["Converts disagreement into a shared, measurable guardrail", "Pilot-with-stop-rule shows safety maturity", "Stakeholder ends up an ally"],
          ["Name the specific threshold you set to show rigor"],
          [],
        ),
      },
      {
        category: "Vision",
        difficulty: "hard",
        question: "What's your two-year vision for patient messaging here?",
        answer:
          "I'd want messaging to become the default first touch for non-urgent care — so patients reach for a message before a phone call or an avoidable visit, and providers trust that triage keeps the urgent stuff safe. Success looks like deflected low-acuity visits without a rise in adverse escalations.",
        score: 74,
        feedback: fb(
          "Directionally strong and measurable, but a little abstract to be memorable.",
          ["Ends on a measurable outcome, not a platitude", "Balances patient convenience with clinical safety"],
          ["Compress it to one sticky sentence a VP would repeat", "Add a rough magnitude — what % of first touches"],
          ["A milestone at the one-year mark"],
        ),
      },
      {
        category: "Metrics",
        difficulty: "hard",
        question: "Give me the single metric you'd stake your roadmap on, and why not the obvious alternatives.",
        answer:
          "Resolved non-urgent conversations per active patient, guardrailed by reopen rate and mis-triage rate. Not raw message volume — that rewards noise. Not NPS alone — it's laggy and doesn't tell me if care actually happened. Resolution-per-patient ties directly to the value: a question answered without a call or a visit, and the guardrails stop it from being gamed by closing threads early.",
        score: 86,
        feedback: fb(
          "Decisive and well-defended — names the metric, the guardrails, and rejects the decoys with reasons.",
          ["Commits to one metric under pressure", "Explicitly rules out volume and NPS with sound logic", "Guardrails prevent gaming"],
          ["Mention how you'd baseline 'resolved' without provider self-report bias"],
          [],
        ),
      },
      {
        category: "Leadership - People",
        difficulty: "medium",
        question: "How do you develop a junior PM on your team?",
        answer:
          "I give them a real surface to own, not a feature to babysit, and I make my reasoning visible — I narrate why we're cutting something or picking a metric so they learn the judgment, not just the task. Then I pull back the scaffolding over time and let them defend their own calls in review.",
        score: 80,
        feedback: fb(
          "Thoughtful — ownership plus visible reasoning is how PMs actually grow.",
          ["Delegates real ownership, not busywork", "Teaches judgment by narrating tradeoffs"],
          ["Give a concrete example of a call you let them get wrong"],
          ["How you'd measure that they're actually leveling up"],
        ),
      },
      {
        category: "Strategy",
        difficulty: "hard",
        question: "Leadership wants faster growth; clinical wants more safety review. Where do you land?",
        answer:
          "I reject the framing that they're opposed. The fastest sustainable growth in healthcare is the kind clinical will defend, because a safety incident sets you back further than a slow quarter. So I'd propose growth inside pre-agreed guardrails: ship fast where the blast radius is low, and gate the clinically risky surfaces behind the review clinical wants. That way both sides are optimizing the same curve.",
        score: 83,
        feedback: fb(
          "Refuses a false binary and finds the shared objective — senior-level judgment.",
          ["Reframes the tradeoff as a shared curve", "Differentiates by blast radius rather than blanket policy"],
          ["Name who arbitrates when a surface's risk is ambiguous"],
          [],
        ),
      },
    ],
  },
];

// One session left ready-to-start, so the "configured but not begun" state is
// also visible in the sessions list.
const CONFIGURED_SESSION = {
  daysAgo: 1,
  interview_type: "hiring_manager",
  difficulty: "hard",
  interviewer_personality: "challenges_assumptions",
  conversation_mode: "adaptive",
  length_minutes: 30,
  questions: [
    { category: "Intro", difficulty: "easy", question: "Why Northwind, and why now?" },
    { category: "Product Sense", difficulty: "hard", question: "Pick a Northwind surface you'd change in your first 90 days and defend it." },
    { category: "Metrics", difficulty: "hard", question: "What would you measure to know your first 90 days worked?" },
    { category: "Leadership - Conflict", difficulty: "medium", question: "Tell me about a time you were wrong and changed course publicly." },
    { category: "Strategy", difficulty: "hard", question: "Where do you think patient messaging is over-invested industry-wide?" },
    { category: "Values", difficulty: "medium", question: "What would your last team say frustrated them about you?" },
  ],
};

// ————————————————————————————————————————————————————————————————
// Insert.
// ————————————————————————————————————————————————————————————————

async function main() {
  const { data: userList, error: userErr } =
    await supabase.auth.admin.listUsers();
  if (userErr) throw userErr;
  const user = userList.users.find((u) => u.email === SEED_USER_EMAIL);
  if (!user) throw new Error(`No user with email ${SEED_USER_EMAIL}`);
  console.log(`Seeding for ${SEED_USER_EMAIL} (${user.id})`);

  // Wipe prior sample projects for this user (cascades to all child rows).
  const { data: old } = await supabase
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id)
    .like("title", `${SAMPLE_PREFIX}%`);
  if (old?.length) {
    await supabase
      .from("projects")
      .delete()
      .in("id", old.map((p) => p.id));
    console.log(`Removed ${old.length} previous sample project(s).`);
  }

  const createdAt = iso(now - 40 * DAY);
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: PROJECT.title,
      company: PROJECT.company,
      role: PROJECT.role,
      status: "active",
      created_at: createdAt,
    })
    .select("id")
    .single();
  if (pErr) throw pErr;
  const projectId = project.id;
  console.log(`Created project ${projectId}`);

  // Resources.
  await supabase.from("resources").insert(
    RESOURCES.map((r, i) => ({
      project_id: projectId,
      type: r.type,
      name: r.name,
      content: r.content ?? null,
      url: r.url ?? null,
      created_at: iso(now - (39 - i) * DAY),
    })),
  );
  console.log(`Inserted ${RESOURCES.length} resources`);

  // AI briefing (latest-row-wins jsonb).
  await supabase.from("ai_briefings").insert({
    project_id: projectId,
    content: BRIEFING,
    generated_at: iso(now - 38 * DAY),
  });
  console.log("Inserted AI briefing");

  // Completed sessions + questions + answers.
  for (const s of COMPLETED_SESSIONS) {
    const completedAt = now - s.daysAgo * DAY;
    const startedAt = completedAt - s.duration_seconds * 1000;

    const { data: session, error: sErr } = await supabase
      .from("interview_sessions")
      .insert({
        project_id: projectId,
        status: "completed",
        interview_type: s.interview_type,
        difficulty: s.difficulty,
        interviewer_personality: s.interviewer_personality,
        conversation_mode: s.conversation_mode,
        length_minutes: s.length_minutes,
        started_at: iso(startedAt),
        completed_at: iso(completedAt),
        duration_seconds: s.duration_seconds,
        overall_score: s.overall_score,
        summary: s.summary,
        created_at: iso(startedAt - 5 * 60 * 1000),
      })
      .select("id")
      .single();
    if (sErr) throw sErr;

    const gap = (s.duration_seconds * 1000) / (s.questions.length + 1);
    for (let i = 0; i < s.questions.length; i++) {
      const q = s.questions[i];
      const askedAt = startedAt + gap * (i + 1);
      const { data: question, error: qErr } = await supabase
        .from("questions")
        .insert({
          session_id: session.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          order_index: i,
          asked_at: iso(askedAt),
          created_at: iso(startedAt),
        })
        .select("id")
        .single();
      if (qErr) throw qErr;

      await supabase.from("answers").insert({
        question_id: question.id,
        transcript: q.answer,
        score: q.score,
        feedback: q.feedback,
        follow_up_generated: false,
        version: 1,
        is_current: true,
        created_at: iso(askedAt + gap * 0.6),
      });
    }
    console.log(
      `  ${s.interview_type}/${s.difficulty} — ${s.questions.length} Q, score ${s.overall_score}`,
    );
  }

  // Coaching plan (built from the completed sessions above).
  await supabase.from("coaching_plans").insert({
    project_id: projectId,
    recommendations: COACHING_PLAN,
    generated_at: iso(now - 2 * DAY),
  });
  console.log("Inserted coaching plan");

  // One configured-but-not-started session.
  {
    const cs = CONFIGURED_SESSION;
    const createdMs = now - cs.daysAgo * DAY;
    const { data: session, error: cErr } = await supabase
      .from("interview_sessions")
      .insert({
        project_id: projectId,
        status: "configured",
        interview_type: cs.interview_type,
        difficulty: cs.difficulty,
        interviewer_personality: cs.interviewer_personality,
        conversation_mode: cs.conversation_mode,
        length_minutes: cs.length_minutes,
        created_at: iso(createdMs),
      })
      .select("id")
      .single();
    if (cErr) throw cErr;
    await supabase.from("questions").insert(
      cs.questions.map((q, i) => ({
        session_id: session.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        order_index: i,
        created_at: iso(createdMs),
      })),
    );
    console.log("Inserted 1 configured (ready-to-start) session");
  }

  console.log(
    `\nDone. Open the project (${PROJECT.title}) → Interview Sessions tab.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
