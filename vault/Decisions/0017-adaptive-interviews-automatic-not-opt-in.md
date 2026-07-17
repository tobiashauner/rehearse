# 0017 — Adaptation to past performance is automatic, not opt-in

**Context.** Roadmap #8 ("run another interview that adapts based on previous
performance") could have been a separate session type ("weakness interview"), a toggle
in the configure dialog, or a button on the coaching plan. The spec's AI Coaching
section says "Generate follow-up interview focused only on weaknesses".

**Decision.** Every interview after the first adapts automatically: `createInterviewSession`
always folds a `PastPerformance` digest (scores, summary weaknesses/strengths/missed
questions, previously asked questions, latest coaching-plan focus) into question
generation whenever completed sessions exist. There is no user-facing switch; the
configure dialog just states that it's happening. The coaching plan is a separate,
manually generated artifact (like the AI Briefing, per
[[0008-ai-briefing-required-before-interview-generation|0008]]) whose
`suggestedNextInterview.focus` feeds the digest when present — but a plan is **not**
required for adaptation.

**Why.**
- A real interviewer never offers "shall I ignore what you said last time?" — a
  non-adaptive repeat interview is strictly worse, so a toggle is a false choice.
- "Focused **only** on weaknesses" as a literal separate mode would produce a
  demoralizing gauntlet; weighting ~half the questions at weak areas keeps sessions
  realistic (the prompt encodes this).
- Keeping the coaching plan optional means the adaptive loop works even for users who
  never open it, while the plan remains the explanatory "why these questions" surface.

**Consequences.** The `conversation_mode` enum (`adaptive`/`fixed`) still only controls
*within-session* follow-ups — it does not gate cross-session adaptation. If a user ever
needs a from-scratch interview (e.g. after switching target roles inside one project),
that's a new project today; revisit only if that proves painful.

**Prompt-size guard.** The digest caps deduped lists at 12 items and previous questions
at 40 (newest kept), so the question-generation prompt stays bounded as history grows.
