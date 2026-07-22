# Changelog

Dated log of actual work sessions on this app. Add a new entry at the end of each session
that changes the app (newest at top). Keep entries short — what changed and why, not a
diff.

## 2026-07-21 — Landing: scoring explained with a rotating feedback showcase

- New "A score with a reason behind it" section on the landing (between the
  interviewer section and the coaching band): copy explains the scoring mechanism
  (difficulty-calibrated, graded against resume/JD/briefing, strengths +
  improvements + missed points per answer, session debrief roll-up) beside
  `components/welcome/scoring-carousel.tsx` — an auto-advancing slideshow of five
  product-true feedback cards (score, what worked, how to improve, what a strong
  answer adds, session debrief). Pauses on hover/focus, dot tabs jump, no autoplay
  under prefers-reduced-motion.

## 2026-07-21 — AI Briefing redesigned as a three-chapter roadmap

- `ai-briefing-view.tsx` rebuilt: the 11 briefing fields now group into three
  chapters on a vertical spine with petrol icon markers — "The room you're walking
  into" (roleSummary lede, culture, skill chips, leadership signals), "Where you
  stand" (strengths vs "worth shoring up" two-up with distinct icons, plus a calm
  "An interviewer might wonder…" callout), "Your preparation plan" (accent focus
  chips, numbered stories, STAR list, Q1–Qn question rows). Chapters are native
  `<details open>` — collapsible with zero JS. Replaces the identical 2-col card
  grid. Verified with a seeded briefing (screenshots, collapse toggle).

## 2026-07-21 — Explicit interview pause

- Also: the project layout's back affordance is now a labeled "← Back to all
  projects" row above the title (the icon-only arrow from 0020's refinement was too
  easy to miss); title aligns flush left again.

- New `paused` session status (+ `paused_at` / `paused_seconds` on
  `interview_sessions` — see [[Database-Schema]]): a "Pause" link in the runner
  (both voice and text modes, next to "End interview early") pauses and routes to
  the project's sessions tab; the session page shows a calm "Interview paused"
  resume screen; the home banner says "You have a paused interview"; paused counts
  as in-progress everywhere resumability matters (home tiles, project overview).
  Paused time is excluded from the completed session's duration. Verified E2E with
  a seeded session (no LLM calls): pause → DB paused/paused_at → resume folds
  seconds → home banner; storage TTS objects cleaned up.

## 2026-07-21 — Full illustration set now sculpted; unDraw phase over

- Across the day Tobias supplied AI-generated sculpted scenes for every slot and they
  replaced all remaining unDraw assets: hero (`hero_2.svg`, diagonal composition),
  steps (`upload.svg`, `rehearse.svg`, `ready.svg` — equal-height bottom-aligned
  slots at 17rem), interviewer section (`styles.svg` personality-trio busts), final
  CTA (`interview2.svg` face-to-face conversation). Some exports needed a baked-in
  background canvas stripped (path 0 full-canvas rect) — same gotcha family as the
  hero checkerboard, see [[Decisions/0023-illustrated-landing|0023]].
- Same day: hero bg gradient (lightens left→right), gold circular arrow across logo
  variants + favicon, logo files consolidated (`rehearse_logo_dark.svg` = dark
  wordmark, `rehearse_logo_white.svg` = white; old files deleted), "Bring the job"
  step carries the tailoring copy (feed it everything, AI trains itself).

## 2026-07-20 — Hero illustration replaced with sculpted scene

- Tobias supplied an AI-vectorized hero SVG (interview conversation, two organic
  blobs, brand palette). The file's "transparency" was a baked-in checkerboard —
  1,260 white/#CBCBCA tile paths interleaved through the z-order plus a petrol
  negative-space frame path — so vector cleanup was impractical. Instead: rendered
  at 2x via Playwright, removed the background with a flood fill (seeded from
  canvas edges AND every #CBCBCA pixel to reach enclosed pockets, allowlist of
  checker/frame colors, 2px mask dilation to eat AA halos; scratch script pattern
  preserved in this entry's commit message), shipped as
  `public/illustrations/hero-scene.webp` (113KB, transparent). Source SVG kept in
  `assets-src/` (out of `public/` so it isn't deployed). unDraw hero deleted.

## 2026-07-20 — Branded auth emails live (Resend SMTP wired)

- Resend account created by Tobias (send-only API key; domain walkinrehearsed.com
  verified via Vercel DNS). Auth SMTP configured via Management API: host
  smtp.resend.com:465, user "resend", sender "Rehearse <hello@walkinrehearsed.com>",
  `smtp_max_frequency` 1s. The API key lives ONLY in Supabase's auth config —
  rotate in Resend + re-PATCH if compromised.
- `scripts/apply-auth-email-templates.mjs` applied cleanly once SMTP existed: all
  five subjects + branded HTML templates live. Verified: direct Resend send landed;
  a real signup dispatched its confirmation (confirmation_sent_at stamped) through
  the new SMTP; test user deleted. Visual inbox check done by Tobias (Gmail MCP
  token was expired for reading it programmatically).

## 2026-07-19 — Branded auth emails: blocked on custom SMTP (Resend chosen)

- Wrote branded HTML templates + subjects for all five auth emails (confirmation,
  invite, magic link, recovery, email change) — calm copy, text wordmark, amber CTA,
  no "Supabase" in the visible content. **Supabase free tier refuses template edits
  on the built-in mailer** (400: "configure a custom SMTP provider"), which is also
  why the sender shows "Supabase Auth". Tobias chose Resend; DNS is on Vercel
  nameservers, so the verification records go in Vercel → Domains → DNS. Waiting on:
  Resend account + domain verification + API key. Then: PATCH `smtp_*` auth config
  (host smtp.resend.com, port 465, user "resend", pass = API key, sender e.g.
  hello@walkinrehearsed.com) and run `scripts/apply-auth-email-templates.mjs`
  (reads the Supabase CLI token from the macOS Keychain).

## 2026-07-19 — Per-user AI spend cap (metering + monthly budget)

- New `ai_usage_events` ledger + `lib/ai/usage.ts` (pricing, cost calc, budget
  check); all 8 OpenAI call sites metered; AI actions blocked past the monthly cap
  ($2 default via `AI_MONTHLY_LIMIT_CENTS`) with a calm, non-punishing message.
  Groundwork for paid tiers: only `monthlyLimitCents()` needs plan-awareness. Details
  in [[Backend]] "AI spend cap". Verified end-to-end: real briefing metered at 0.39¢
  (token counts × verified prices), over-cap regenerate blocked in UI, ledger
  delete/negative-insert rejected by RLS + check constraint.

## 2026-07-19 — Clarified "one project per application" + favicon

- Fixed a standing `DialogFooter` layout bug (`components/ui/dialog.tsx`): the footer
  was `sticky bottom-0` inside the padded, scrollable `DialogContent`, which pins
  against the content-box edge — 24px above the dialog's true bottom — so the
  half-transparent band rode up over the form and left a white strip below. Now a
  normal in-flow band (negative margins keep it flush); it scrolls with long content
  instead of pinning. Affected all three dialogs (new project, add resource,
  configure interview); verified at fitting and overflowing viewport heights.

- The project-per-application mental model is now stated on all three creation
  surfaces: the New Project dialog gained a `DialogDescription` ("One project per
  application — it holds the role, the company, your materials…") plus example
  placeholders on Title/Company/Role; the Projects page subtitle and the first-run
  onboarding copy both say "one per application — a role at a company" (onboarding
  adds "Interviewing at three companies? Make three projects."). Verified signed-in
  with a throwaway confirmed user (deleted after).
- Favicon added from the real logo mark: `app/icon.svg` (auto-served by App Router),
  `app/apple-icon.png` (180² render on white), and `app/favicon.ico` (16/32/48
  PNG-packed ICO — Safari doesn't render SVG favicons). ICO was hand-packed in a
  scratch script (Playwright renders + ICONDIR header); browsers cache favicons hard,
  so a fresh tab / direct hit on /favicon.ico may be needed to see it.

## 2026-07-18 — Illustrated landing page (Workable-style, brand colors)

- Final same-day pivot: hand-drawn characters replaced with **unDraw illustrations**
  (undraw.co), downloaded and recolored to the brand palette via hex substitution —
  petrol accent + selective amber warmth. Files in `public/illustrations/`;
  `components/welcome/illustrations.tsx` deleted; coaching-band overlay figure dropped.
  Fetch/recolor recipe in [[Decisions/0023-illustrated-landing|0023]].
- Same-day follow-ups: (1) header logo restored to the real mark —
  `rehearse_logo_dark.svg` turned out to be an old lockup, so a
  `rehearse_logo_white.svg` (byte-identical art, white wordmark) was created for the
  petrol hero, and the footer swapped from old `logo-icon.svg` to the actual
  `rehearse_logo.svg` (the two old-lockup files are now unused). (2) Every character
  redrawn with a more realistic grammar — distinct necks/collars, profile faces with
  nose + features, connected tapered limbs — see [[Decisions/0023-illustrated-landing|0023]].

- Landing redesigned to be illustration-led per Tobias's request ("way less generic,
  human and approachable, like Workable"): petrol-drenched hero (nav included, white
  logo variant) with a hand-drawn flat scene of a candidate rehearsing out loud at a
  desk; organic curved dividers between bands; the three "how it works" steps now carry
  illustrated vignettes; an interviewer-character trio above "An interviewer, not a
  question bank"; a coach seated on the score card's edge in the petrol band; final CTA
  literalizes the tagline with a figure walking through an open amber door.
- All scenes are hand-authored SVG React components in
  `components/welcome/illustrations.tsx` — one shared palette (petrol/amber/brick +
  varied skin tones) and character grammar (faceless flat figures, rounded stroke
  limbs), `role="presentation"`. Sparse geometric accents (dots/rings/triangles) are
  deliberate print-shop texture, kept well short of confetti-gamification (the
  DESIGN.md ban was consciously relaxed for this marketing surface only, at the user's
  explicit request for the Workable look).
- Hero waveform reuses the existing `.welcome-bar` ambient loop (now with
  `transform-box: fill-box` for SVG); `welcome-rise` entrance kept;
  `prefers-reduced-motion` still disables both. Product-true content retained: the
  personality-chips/follow-up card and the session-scores chart.
- Verified: desktop + mobile full-page screenshots, zoomed section shots, auth popover
  over the petrol hero, clean `tsc` + eslint. (`pnpm build` not run — dev server was
  up; run it before deploying.)

## 2026-07-18 — Fixed invite/confirmation emails linking to localhost

- Hosted Supabase `site_url` was still the default `http://localhost:3000`, so auth
  email links (invites, signup confirmations) redirected to localhost. Set it to
  `https://walkinrehearsed.com` (the production domain, per Tobias) via the Management
  API, with a redirect allow-list covering www + localhost for dev — details in
  [[Backend]] "Auth". Config-only change, no code touched. Invites sent before the fix
  still have localhost baked into their links and must be re-sent.

## 2026-07-16 — GitHub remote, Vercel deploy prep, public landing page

- First push to GitHub (`tobiashauner/rehearse`, `main`); PAT stored in macOS Keychain
  for pushes going forward. `.claude/settings.local.json` and `.impeccable/` gitignored.
- Vercel-readiness fix: voice answers now upload **direct to Supabase Storage from the
  browser** instead of through a server action — Vercel hard-caps action bodies at
  4.5MB, which a few minutes of audio exceeds. See
  [[Decisions/0021-direct-to-storage-audio-upload|0021]]. `bodySizeLimit` 25mb → 4mb.
  Known residual: `uploadFileResource` still streams through an action (fine under
  ~4MB resumes).
- New public marketing landing at `/` for signed-out visitors
  (`app/welcome/page.tsx`, middleware rewrite — see
  [[Decisions/0022-public-landing-via-middleware-rewrite|0022]]): hero with live-session
  vignette + animated waveform, 3-step sequence, personality/follow-up section, drenched
  petrol "Coaching, not testing." band with score-trend chart, final CTA. Verified with
  desktop/mobile screenshots, zero horizontal overflow, clean tsc/eslint.
- Same-day refinement: auth now happens **in place on the landing** — every CTA opens a
  Base UI popover ("Sign in" → sign-in mode, "Start rehearsing" → sign-up mode) instead
  of routing to `/login`. The form was extracted to `components/auth/auth-form.tsx`,
  shared by the popover and the (still existing) `/login` page, which remains the
  redirect target for unauthenticated deep links. Verified end-to-end: confirmed test
  user signed in through the popover and landed on the app home; popover fits at 390px.

## 2026-07-09 — Project section rail + summary-tile overview

Third IA pass, refining the previous one after use — see
[[Decisions/0020-project-rail-and-summary-tiles|0020]]:

- Every page inside a project now shares a section rail
  (`components/project/project-sidebar.tsx` via a new `[projectId]/layout.tsx`): left
  rail on md+, pill row on mobile, with "← All projects" on top. Active state derives
  from `?tab=`; session/review pages highlight Interview Sessions. This replaces
  0019's back-link navigation, which proved tedious.
- The overview is now a 2-col grid of compact summary tiles
  (`components/project/section-tiles.tsx`) — each tile a miniature of its section
  (resources mini-list, briefing snippet + skill chips, sessions with latest score +
  per-session scores, analytics average + sparkline); empty tiles carry guidance.
  `section-list.tsx` (0019's rows) deleted same-day.
- Coaching panel's generate button demoted to outline (one amber per screen: "New
  Interview" owns it on the sessions section).
- Same-day refinement: the project title (+ role/company subtitle and archived badge)
  moved into `[projectId]/layout.tsx`, above the rail, with a back-to-all-projects
  arrow icon to its left; the rail's "← All projects" item was removed, and
  section/session/review headings demoted to `h2 text-2xl` under the layout's h1.
- Verified with screenshots (rich/empty overview, sessions section, mobile pills) +
  clean build.

## 2026-07-09 — Project page flattened: section summary rows instead of tabs

Second IA pass in the same direction as 0018 — see
[[Decisions/0019-sectioned-project-page-no-tabs|0019]]:

- Project page default view is now an overview of five section rows
  (`components/project/section-list.tsx`), each with a live one-line summary (resource
  types, briefing role-summary snippet, interview count + latest score, analytics
  average + practice time) and a right-side datum (count / date / score / sparkline).
  Clicking a row opens that section full-page with a `← {project}` back link; the
  overview has `← Projects` back to home. The `?tab=` param survives for old deep
  links; the empty Overview tab is gone (header carries its content).
- Copy that said "tab" now says "section"; project loading skeleton matches the rows.
- Verified with screenshots (rich overview, empty overview as guided checklist,
  sessions section, mobile) + clean build.

## 2026-07-09 — Project-centric IA: global nav removed, home is the project pane

User-directed restructure — see [[Decisions/0018-project-centric-ia-no-global-nav|0018]]
for the full rationale and what replaced each dashboard widget:

- **Shell**: sidebar gone; header-only (logo links home, ⌘K, avatar). Content in a
  `max-w-6xl` container. Three-tier surfaces survive (petrol header → warm-paper canvas
  → white cards).
- **Home (`/`)**: single project pane — `components/project/project-tile.tsx` tiles with
  latest score, `Sparkline` (new in `tiles.tsx`), interview count, in-progress marker,
  last-practiced date; ghost hint on new projects. One "resume interview" banner when a
  session is mid-flight (New Project demotes to outline then, keeping one amber action).
  Zero-state onboarding reworked: opens the create dialog directly, dashboard-widget
  preview removed.
- **Per-project Analytics tab is real**: `components/project/project-analytics.tsx`
  reuses `AnalyticsWidgets` scoped to the project. Settings tab copy now names the
  project-level settings that will live there.
- **Routes retired**: `/projects`, `/analytics`, `/settings` → redirect `/`. Command
  menu is project-centric (fetches projects on open, jump-to-project + New Project).
- Retired-but-kept on disk (no git baseline commit exists yet): `app-sidebar.tsx`,
  `dashboard-widgets.tsx`.

Verified with seeded data screenshots (desktop + mobile home, onboarding, project
analytics tab, command menu) and a clean production build.

## 2026-07-09 — Roadmap #8: coaching plan + adaptive next interview, live-verified

The last MVP success criterion. Two halves, see
[[Decisions/0017-adaptive-interviews-automatic-not-opt-in|0017]]:

- **Coaching plan** — `coaching-plan.ts` (the last prompt stub) is real: takes all
  completed sessions' summaries (oldest first) and emits headline, performance trend,
  prioritized focus areas (each with evidence + a practice drill), strengths to keep,
  and a suggested next-interview config (type/difficulty/focus). Generated on demand via
  `generateCoachingPlan` (sessions actions), persisted to `coaching_plans`, rendered by
  `components/interview/coaching-plan-panel.tsx` on the Sessions tab (hidden until the
  first completed session; CTA card → full plan card with Refresh).
- **Adaptive question generation** — `createInterviewSession` now builds a
  `PastPerformance` digest (session scores, deduped weaknesses/strengths/questions-missed
  from summaries, all previously *asked* questions capped at 40, latest coaching-plan
  focus) and feeds it to `buildQuestionGenerationMessages`, which instructs the model to
  weight ~half the questions at weak areas, skip proven strengths, and never repeat a
  previous question. First interviews (no history) generate exactly as before.
- Supporting UI: configure dialog shows an "Adapts to your N previous sessions" note
  when history exists; review page gained a "Plan next interview" CTA linking to
  `/projects/[id]?tab=sessions` — the project page now honors a `?tab=` search param.

Live-verified headlessly (Playwright + real OpenAI key): seeded resume/JD → briefing →
4-question interview answered with deliberately vague, metric-free answers → review
summary → coaching plan (3 focus areas, sensible easier-behavioral suggestion) → second
interview whose questions demonstrably probed the weak areas (data-driven decisions,
enterprise deals, concrete specifics) with zero repeats from session 1.

Verification gotcha for next time: base-ui `Button render={<Link/>}` renders an `<a>`
with `role="button"`, so Playwright must query it as a button, not a link (two failed
runs before spotting this). Noted in [[Environment]]. The user's long-running dev server
was also restarted along the way (it shared `.next` with an earlier `pnpm build` —
staleness suspected but not confirmed).

## 2026-07-09 — Analytics page built with the dashboard's tile pattern

Replaced the Analytics placeholder page with real widgets (`components/analytics-widgets.tsx`,
data assembled in `app/(app)/analytics/page.tsx`): **Average score** (mean of session
`overall_score`), **Practice time** (sum of session `duration_seconds`, plus this-week
sub-line), **Answer length** (average transcript word count across current answers),
**Score trend** (same time-scaled TrendChart as the dashboard), and **Practice cadence**
(HTML-bar chart of completed sessions per week, last 8 weeks). Same pattern as the
dashboard: live data or an illustrated `EmptyTile`. Shared primitives (Tile, EmptyTile,
TrendChart, all line-art illustrations) extracted to `components/tiles.tsx`; the
dashboard now imports from there too.

Deliberately not built: the spec's STAR/confidence/leadership/communication trend charts
— `answerEvaluationSchema` doesn't emit those dimensions, and empty states should only
promise what the pipeline can deliver (extend the eval schema first). The spec's
"practice streak" is skipped on brand grounds (PRODUCT.md bans streak mechanics);
weekly cadence bars carry that job calmly. The per-project Analytics tab remains a
placeholder.

## 2026-07-07/08 — Real dashboard widgets with ghost empty states + onboarding + sidebar cleanup

Built the spec's dashboard widgets for real (`components/dashboard-widgets.tsx`), which
unblocks the "scores/trends placeholder" item in [[Roadmap]]: **Continue interview**
(in-progress sessions, links to the runner), **Practice today** (did-you-practice-today
check with a start-a-session link; naive server-local "today"), **Recent scores** (last 3
completed sessions with `overall_score`, linking to review; petrol badge pills), and
**Improvement trends** (once ≥2 scored sessions exist: a proper time-scaled chart —
deep-petrol line, gradient-to-transparent area fill, y-axis score ticks snapped to tens
with hairline gridlines, first/last date x-labels; axis text is HTML outside the
stretched SVG and the end-dot is an HTML overlay, because `preserveAspectRatio="none"`
would distort SVG text and circles). Each tile always renders: live data when it exists,
otherwise a centered monochrome line-art illustration (inline SVG per widget) with a
centered explanation underneath — the empty state doubles as feature discovery. (Iterated
here: gray skeleton bars looked broken, full-color realistic sample data looked *too*
real; illustrations landed as clearly-not-data but still evocative.) Note: `overall_score` is computed
lazily on first review-page visit, so a completed-but-never-reviewed session doesn't feed
scores/trends.

Zero-project users get a full onboarding view instead
(`components/dashboard-onboarding.tsx`): hero card explaining the project → materials →
rehearse flow with the create-project CTA, plus the same widget grid in its all-empty
state.

Also removed the sidebar's desktop collapse trigger (clutter; sidebar is now always
expanded on md+, header trigger still opens the mobile drawer) and added 6px gaps between
sidebar menu items.

## 2026-07-07 — Roadmap #4 spoken half + #6/#7: voice interview layer, live-verified with a fake mic

Built the audio layer on top of the text-mode interview, exactly along the seam
[[Decisions/0015-live-interview-text-mode-first]] left for it (see
[[Decisions/0016-voice-layer-tts-stt-choices]] for the choices):

- **TTS**: `getQuestionAudio` server action generates question audio lazily on first
  presentation (OpenAI `gpt-4o-mini-tts`, personality-styled `instructions`), caches it at
  `questions.tts_audio_path` in the private `interview-audio` bucket, returns a 1h signed
  URL. The runner auto-plays it via a hidden `<audio>` with a replay button; failure
  degrades silently to on-screen text.
- **STT**: `submitAudioAnswer` uploads the `MediaRecorder` blob (FormData per
  [[Decisions/0006-formdata-file-upload-in-server-actions]], `serverActions.bodySizeLimit`
  bumped to 25mb), transcribes with `gpt-4o-mini-transcribe`, then feeds the transcript
  through the same `processAnswer` core as typing — `submitTextAnswer` was refactored to
  share it, per 0015's "don't fork evaluation" guidance. Recording is persisted to
  `answers.audio_storage_path` *before* transcription so an STT failure never loses it.
- **UI**: voice-first answering in `interview-runner.tsx` — Start answer → live frequency
  bars (`components/interview/audio-visualizer.tsx` + new `hooks/use-recorder.ts`) +
  recording timer → Finish answer → "What we heard" transcript above the usual feedback.
  "Type instead" / "Answer out loud" toggles between modes at any question.
- **Review playback (roadmap #6)**: the review page signs URLs for `audio_storage_path`
  and renders an `<audio controls>` player above each transcript entry.

Verified end-to-end headlessly, defeating 0015's "audio can't be autonomously verified"
assumption: generated a spoken answer WAV via OpenAI TTS and fed it to Chromium as a fake
microphone (`--use-file-for-fake-audio-capture`); the app's STT transcribed it back
almost word-for-word and the evaluation graded that transcript. Full flow (signup →
project → resources → briefing → interview → voice answer → follow-up → early end →
review with working audio player) passed; recipe persisted in
`.claude/skills/verify/SKILL.md`. Still needing hands-on human testing: real mic/speaker
quality, permission prompts, Safari's `audio/mp4` path. Discovered along the way:
Supabase email confirmation is now ON and `@example.com` addresses are rejected —
[[Auth-Flow]] updated, test users created via the admin API and cleaned up afterward.

## 2026-07-07 — Logo redesign: flat box/bubble/arrow mark, outlined Inter wordmark

Rebuilt `public/rehearse_logo.svg` three times in one session, converging via user
sketches. First pass (a 3D "vortex" of speech bubbles with gradients + drop shadows) was
rejected in the real header: blurry and unrecognizable at 44px. Second pass (solid teal
box + white bubble + arrow-through-channel) was close; the user then supplied a hand
sketch refining it. Final mark, digitized from that sketch: a deep-teal (`#175A68`)
rounded-square *outline* (20px stroke, round caps), open on the right side, whose top bar
curls down at top-right and whose bottom bar tapers into a pointed speech-bubble tail
flush with the bottom-right corner — box and bubble as one fluid stroke. Inside, a chunky
honey-amber (`#E0A63C`) bent arrow ↗ (horizontal stub, soft elbow, 45° rise, wide head)
points up-right through the opening. Flat colors only; reads crisply down to ~22px.
Wordmark:
lowercase "rehearse" + amber terminal dot, sentence-case "Interview coaching" tagline,
set in the app's own Inter (700/550) converted to outlines with fontTools/harfbuzz from
the `next/font` woff2 — renders identically everywhere, no font dependency in the SVG.
Lesson recorded: this logo renders small, so no gradients/shadows — flat geometry only.
`app-header.tsx`: intrinsic size updated to the 535×158 viewBox and header render bumped
`h-11`→`h-12` (user found the logo too small). Generator script lives in the session
scratchpad, not the repo. Old serif-wordmark logo preserved only in this entry's history —
repo still has no commits.

## 2026-07-07 — Roadmap #4/#5: text-mode adaptive interview (Start Interview), live-verified

Built the whole conversational interview experience minus audio. The DB schema, storage
buckets, and RLS for this already existed from the initial migration; the four prompt files
were 3-line stubs. Now implemented + wired end-to-end:

- **Prompts** (`lib/prompts/`): `answer-evaluation.ts` (per-answer score 0-100 + summary +
  strengths + improvements + missed points), `follow-up-generation.ts` (adaptive: decide
  whether to ask one natural follow-up + its text/category/difficulty), `session-summary.ts`
  (overall score + headline + strengths/weaknesses/questions-to-revisit/recommended
  practice). Same `chat.completions.parse` + `zodResponseFormat` pattern as the existing
  briefing/question prompts.
- **Runtime actions** (`app/(app)/projects/[projectId]/sessions/[sessionId]/actions.ts`):
  `startInterview` (configured→in_progress, stamps first question), `submitTextAnswer`
  (persist answer first, then evaluate, then in adaptive mode maybe insert a follow-up),
  `completeInterview` (mark completed + duration, generate summary), `ensureSessionSummary`
  (lazy summary if completion's generation failed — same self-healing pattern as the resume
  backfill).
- **UI**: `components/interview/interview-runner.tsx` (client state machine: idle → answering
  → evaluating → feedback → finishing, with live timer, progress, and per-answer feedback
  cards); the session page now drives it (or shows a "completed → View review" state); the
  review page renders overall score + the four summary sections + a full chronological
  transcript with per-answer scores/feedback.
- **Adaptive follow-ups without a schema change**: follow-up questions are inserted with
  `order_index >= 1000`, distinguishing them from originals (0..N-1) and ensuring they never
  chain (we only follow up on originals). `resolveNextQuestion` presents unanswered
  follow-ups before unanswered originals, so a follow-up is always asked right after its
  parent. Review/transcript orders by `asked_at`. See
  [[Decisions/0015-live-interview-text-mode-first]].

**Live-verified** with real OpenAI against a seeded PM interview: Start → answered 3
originals, each spawned a contextual adaptive follow-up (6 answers total), each scored with
specific grounded feedback → Finish → review showed overall score 42 with a sharp headline
and a full interleaved transcript. DB confirmed: session completed w/ duration + summary,
6 questions (3 at order_index 1000-1002), 6 answers all scored + `is_current` + feedback,
3 `follow_up_generated` flags. No console errors. Text-mode only — audio (TTS/mic/STT) is
the deliberate next slice, since headless testing can't verify real audio UX.

## 2026-07-06 — Self-healing backfill: existing uploads now get extracted on regenerate

Follow-up to the extraction feature below. User re-ran the AI Briefing and it *still* showed
no resume info — because extraction only ran at **upload** time, and their resume
(`resume2020.pdf`) had been uploaded 2026-07-04, two days before extraction existed, so its
`content` was permanently `null`. Regenerating the briefing just re-read that null.

Fixed by making the briefing flow self-healing: `generateProjectAnalysis`
(`app/(app)/projects/[projectId]/sessions/actions.ts`) now calls `backfillResourceContent`,
which for any resource with a `storage_path` but null `content` downloads the stored file,
extracts text, and persists it before building the prompt. This covers both pre-extraction
uploads and any future upload where extraction failed. Refactored `lib/resources/extract-text.ts`
to expose `extractTextFromBuffer(buffer, mimeType)` + `mimeTypeFromName(name)` (the upload
path's `extractFileText(file)` is now a thin wrapper) so the backfill can extract from a
downloaded buffer, inferring MIME from the filename when the stored blob's type is missing.

Verified end-to-end against the user's actual resume: reproduced the exact null-content
state, clicked Regenerate, confirmed `content` went null → 4884 chars and the briefing then
cited real resume specifics (team of 22 at athenahealth, EMR redesign, PeopleFluent, etc.).
**The user just needs to click "Regenerate Briefing" on their real project — no re-upload
needed.**

## 2026-07-06 — Uploaded resumes now actually feed the AI Briefing (PDF/DOCX/TXT extraction)

User report: AI Briefing said resume strengths/gaps "cannot be determined" even after
uploading a PDF resume. Root cause: file uploads only ever stored `storage_path` — the
`content` column the AI Briefing prompt actually reads stayed `null` for every file
resource. This was a known, already-logged gap (see updated [[Roadmap]] entry #2), not a
new regression.

Fixed: `uploadFileResource` now extracts text at upload time
(`lib/resources/extract-text.ts`) and stores it in `content` — `.txt` read directly,
`.docx` via `mammoth`, `.pdf` via **`unpdf`**. Verified end-to-end with a real OpenAI call:
re-generated an AI Briefing after uploading a test PDF resume, and "Resume Strengths"
correctly cited specifics straight from the PDF (years of experience, a quantified
reconciliation-error reduction, a latency improvement, team size, tech stack) instead of
"cannot be determined."

Took two failed library attempts to get here — `pdf-parse` (both v2's worker-based API and
v1's classic API) threw errors only inside this app's Turbopack server-action runtime,
never in a standalone script with identical bytes. Full debugging trail and why `unpdf` was
the fix in [[Decisions/0014-pdf-text-extraction]] — worth reading before reaching for
`pdf-parse` again in this codebase.

## 2026-07-06 — Header centered search + fixed a real `CommandDialog` portal bug

Follow-up to the header/sidebar polish below: switched `AppHeader`'s `<header>` from `flex`
to `grid grid-cols-[auto_1fr_auto]` (logo / search / avatar) so the search bar sits
genuinely centered in the header instead of hugging the left side next to the logo.
Increased the logo-icon-to-name gap (`gap-2.5`→`gap-3.5`) and nudged `SidebarHeader`/
`SidebarGroup` padding (`px-2`→`px-1`) so the collapse trigger and nav icons sit closer to
the sidebar's left edge, tightening the vertical column with the logo above.

**Real bug found and fixed**: `components/ui/command.tsx`'s `CommandDialog` rendered its
`<DialogHeader>` (the `sr-only` a11y title/description `cmdk` needs) as a **sibling** of
`<DialogContent>`, both direct children of `<Dialog>`. Only `DialogContent` portals into
the overlay (via `DialogPortal`) — `<Dialog>` itself does not portal its children — so that
`DialogHeader` was never portaled and instead rendered in-place wherever `<CommandMenu>`
happened to sit in the tree. Once the header became a 3-column CSS grid, this stray node
became an uncounted 4th grid item, capable of throwing off the header's layout (this is
almost certainly what broke the header after the grid change — the user saw the search bar
and content pane overlapping). Fixed by moving `<DialogHeader>` inside `<DialogContent>` so
it portals along with the rest of the dialog, and moved `<CommandMenu>` itself out of
`<header>` (now a sibling right after it) so it can never again become an unintended grid/
flex item of the header's own layout. Verified the header stays a clean 3-child, fixed
56px-tall row from 1400px to 3046px viewport width, and that the command palette still
opens/filters/navigates correctly.

## 2026-07-06 — Header/sidebar polish: renamed to "Rehearse", bigger logo, icon alignment

User feedback: the header/sidebar top area "looks bad" — logo too small, nav icons not
aligned with the logo above them, and too much dead space around the sidebar's
collapse/expand trigger.

- **Rename**: the app-facing name is now "Rehearse" — browser tab title (`app/layout.tsx`),
  login screen subtitle (`app/login/page.tsx`), and header label (`components/app-header.tsx`).
  This reverses the earlier call in [[Decisions/0011-header-above-sidebar-layout]] to keep
  "Interview Workspace" (that was a placeholder-vs-final-name question at the time; the user
  has now settled on "Rehearse"). Note: internal docs (`PRODUCT.md`, `DESIGN.md`'s `name:`
  frontmatter, `vault/Home.md`'s title) still say "Interview Workspace" — that rename wasn't
  requested and is a separate, larger decision; don't assume they're out of sync by mistake.
- **Bigger logo placeholder**: header icon span `size-7`→`size-9`, icon `size-4`→`size-5`,
  label bumped to `text-lg font-semibold`.
- **Icon alignment**: `SidebarHeader` and `SidebarGroup` padding changed from `p-3` (12px
  all sides) to `px-2 py-1.5` / `px-2 py-3` respectively — this pulls the sidebar's
  collapse/expand trigger and nav-item icons left so their glyphs land within ~2px of the
  header logo's glyph x-position (verified via `getBoundingClientRect()` in a live browser:
  logo/trigger/first-nav-icon all landed at x=24–26 post-fix, vs. 22/n-a/30 before), and
  shrinks the vertical whitespace around the collapse/expand trigger
  (`SidebarHeader` height 56px→44px).

## 2026-07-06 — Three-tier neutral surface hierarchy (sidebar darker, content pane off-white)

User feedback: the left nav and the content pane read as basically the same flat white.
Introduced a real light/dark hierarchy across three surfaces instead of two:

- `--sidebar` (nav/header shell, sharing `bg-sidebar` via the `inset` variant): darkened
  from `oklch(0.97 0.006 91)` to `oklch(0.93 0.012 91)` — now clearly the darkest plane.
- `--background` (the content pane behind cards): moved off pure white to
  `oklch(0.985 0.007 91)` — a barely-there warm tint, lighter than the sidebar but no
  longer indistinguishable from `--card`.
- `--card`/`--popover` stay pure white (`oklch(1 0 0)`), now the lightest tier, so cards
  read as gently lifted off the page rather than blending into it.
- `--sidebar-accent` (hover/active wash) and `--sidebar-border` were both darkened in step
  (`oklch(0.87 ...)`) so they keep enough contrast against the now-darker sidebar base.

This inverts what the original `DESIGN.md` said about neutrals ("pure white for the base
background, never a tinted surface") — that rule predates this feedback and has been
rewritten to describe the three-tier hierarchy instead of pure-white-everywhere. See
`DESIGN.md` §2 Neutral and §6 Do's/Don'ts, and `.impeccable/design.json`'s `bg`/`surface`/
`nav-surface` colorMeta, both updated to match.

## 2026-07-06 — Density and color pass: Inter, more vivid deep-petrol, roomier spacing

User feedback: dark petrol read as "almost black," spacing throughout felt "way too
tight," and text (especially the left nav) felt too small. Addressed all three:

- **Font**: swapped Geist → Inter (`app/layout.tsx`, via `next/font/google`). Chosen for
  being a calm, highly-legible humanist sans with excellent Tailwind/shadcn ecosystem
  support; kept the "one family, weight/size variation only" rule from `DESIGN.md`.
- **Color**: `--badge-accent` (deep-petrol) went from `oklch(0.28 0.09 200)` (verified via
  manual OKLCH→sRGB conversion to compute as `rgb(0, 52, 58)` — genuinely near-black) to
  `oklch(0.48 0.14 200)` (`rgb(0, 115, 124)` — a real, vivid teal). `DESIGN.md` and
  `.impeccable/design.json` updated to match (including regenerating deep-petrol's tonal
  ramp around the new canonical value).
- **Spacing/sizing**: the whole shadcn primitive set was on a compact `text-sm`/`h-8`
  density scale; bumped project-wide to `text-base`/`h-10` — `Button`, `Input`, `Label`,
  `Textarea`, `Select`, `Tabs`, `DropdownMenu`, `Card` (`--card-spacing`), `Empty`, `Item`
  (including `Sidebar` menu buttons, which share `Item`'s sizing conventions), and
  `Dialog`. Also fixed a stray arbitrary value, `text-[0.8rem]` on small buttons, to the
  standard `text-sm` token. Page-level containers (`space-y-6`→`space-y-8`, H1
  `text-2xl`→`text-3xl`) bumped to match. See
  [[Decisions/0012-density-and-color-pass]] for why this became a named convention rather
  than a one-off tweak.

## 2026-07-06 — "Inset" shell layout: header + sidebar as one surface, content as a floating card

Switched `<Sidebar>` (`components/app-sidebar.tsx`) to shadcn's built-in `variant="inset"`
instead of the default `variant="sidebar"` — this is the exact pattern shadcn already
ships for "sidebar and header share a background, content floats as a rounded card with
margin": `SidebarProvider` auto-applies `bg-sidebar` to its wrapper whenever a descendant
`Sidebar` has `data-variant="inset"` (via its built-in `has-data-[variant=inset]:bg-sidebar`
class), and `SidebarInset` auto-applies `m-2`/`rounded-xl`/a shadow whenever it's a DOM
sibling of that `Sidebar` (CSS `peer` selector — confirmed the sibling relationship holds
given `AppSidebar` renders `<Sidebar>` as its own root with no wrapper div). Removed
`AppHeader`'s `border-b` so it visually blends into the same `bg-sidebar` surface instead
of reading as a separate bar.

**Bug caught during verification**: overriding `SidebarInset`'s shadow via an incoming
`className` prop (`md:peer-data-[variant=inset]:shadow-resting`) silently didn't work —
computed style still showed the generic `shadow-sm`. `tailwind-merge` doesn't reliably
recognize our custom `--shadow-resting`/`--shadow-raised` theme keys as conflicting with
Tailwind's built-in `shadow-sm`/`shadow-md`/`shadow-lg` (same issue almost certainly
applies to any custom `@theme` value merged in via a className prop, not just shadows).
The reliable fix is always to edit the *hardcoded* class in the component source directly
(same approach already used for `Dialog`/`Select`/`DropdownMenu` shadows and `Card`) —
done here for `components/ui/sidebar.tsx`'s `SidebarInset`. Added to
[[Decisions/0011-header-above-sidebar-layout]].

## 2026-07-06 — Top app-bar layout, display names

Restructured the app shell from "sidebar owns the top" to a conventional top app-bar +
sidebar-below-it layout:

- **`components/app-header.tsx`** (new): full-width bar above everything — app name/logo
  placeholder on the left, a search pill (opens the Cmd+K command palette on click, not
  just the keyboard shortcut) in the middle, `Avatar` + name + `DropdownMenu` (sign-out) on
  the far right. Responsive: below `sm`, the app name text and search-pill label collapse
  to icon-only to avoid overflow at narrow widths.
- **`components/app-sidebar.tsx`** simplified to just the nav menu items + a collapse/expand
  trigger in its own header — no more title or footer user-menu (both moved to
  `AppHeader`).
- **`app/(app)/layout.tsx`**: `SidebarProvider` is now `flex-col` (header on top, a row
  below it containing the sidebar + `SidebarInset`), and the `Sidebar`'s fixed positioning
  is offset below the header (`top-14 h-[calc(100svh-3.5rem)]` — see
  [[Decisions/0011-header-above-sidebar-layout]] for why this needs an explicit offset
  rather than just stacking divs).
- **Display names**: signup now collects a required `name`, stored in Supabase auth's
  `user_metadata.full_name` (no new table/migration — see the same Decision note for why
  not a `profiles` table). `lib/utils.ts`'s new `getDisplayName()` falls back to the
  email's local part for any account without one. `lib/validations/auth.ts` gained
  `signupSchema` (extends the login-only `authSchema` with required `name`); the one login
  page dynamically swaps resolver schema by mode (needed a `Resolver<SignupValues>` type
  cast — RHF's resolver type doesn't structurally unify two different zod schemas even
  when one is a superset of the other).

**Real bug caught during verification, not just polish**: moving the sidebar's collapse
trigger out of the old inset-header and into the sidebar's own header meant that on
mobile, the *only* way to open the sidebar drawer lived inside the drawer itself (closed by
default) — there was no way to open it at all. This is almost certainly the same "cannot
get the left nav to open" bug reported earlier in this session, now root-caused. Fixed by
adding a second `SidebarTrigger` to `AppHeader`, shown only below `md` (`md:hidden`) — the
in-sidebar trigger keeps handling desktop icon-rail collapse.

## 2026-07-06 — Applied real shadcn components (Sidebar, Item, Empty, Command, etc.)

Color tokens alone still "looked boring" — same flat hand-rolled layouts, just recolored.
Fixed by actually adopting shadcn's component library instead of ad-hoc `<div>`/`<ul><li>`
structures, in three passes:

**Navigation**: `components/app-sidebar.tsx` rewritten on the real `Sidebar` primitive
(`SidebarHeader`/`SidebarContent`/`SidebarGroup`/`SidebarMenu*`, `SidebarFooter` with an
`Avatar` + `DropdownMenu` sign-out, replacing the standalone `sign-out-button.tsx` which is
now deleted). Desktop collapses to an icon-only rail via Cmd+B
(`collapsible="icon"`); mobile gets the built-in `Sheet` drawer. `app/(app)/layout.tsx`
wraps everything in `SidebarProvider`/`SidebarInset`. The `--sidebar-*` tokens in
`globals.css` were dead code before this (old sidebar never referenced them) — now live,
tuned to a soft honey-amber wash for hover/active (`--sidebar-accent`), matching DESIGN.md.

**Lists & empty states**: `resource-list.tsx` and `session-list.tsx` converted from plain
`<ul><li>` to `ItemGroup`/`Item` (icon + title + description + actions), with a lucide
icon per resource kind. Plain-text empty states became `Empty`/`EmptyHeader`/`EmptyMedia`/
`EmptyTitle`/`EmptyDescription`/`EmptyContent` across the Dashboard, Projects list,
Resources tab, Sessions tab, and `ai-briefing-onboarding.tsx`.

**Micro-polish**: `Spinner` added next to "Generating…"/"Adding…" pending-button labels;
new Cmd+K `components/command-menu.tsx` (Command palette for nav + "New Project"), with a
`Kbd`-rendered "⌘K" hint in the header; `Skeleton`-based `loading.tsx` added for
`/projects` and `/projects/[projectId]` (Next.js route-level loading UI).

Two real bugs caught during verification, both fixed:
1. `hooks/use-mobile.ts` (pulled in by the `sidebar` install) violated the project's own
   `react-hooks/set-state-in-effect` lint rule — rewrote using `useSyncExternalStore`
   instead of a synchronous `setState` in a bare effect.
2. Base UI's `Button` needs `nativeButton={false}` whenever its `render` prop points to a
   non-`<button>` element (e.g. a `Link`) — without it, Base UI logs a console error and
   the rendered element loses native button semantics. Only hit this once
   (`app/(app)/page.tsx`'s empty-state CTA) but worth remembering for any future
   `<Button render={<Link .../>}>` usage.
3. The Cmd+K command palette crashed (`Cannot read properties of undefined (reading
   'subscribe')`) because `CommandInput`/`CommandList` were nested directly inside
   `CommandDialog` without an intermediate `<Command>` root — `cmdk`'s internal store
   context comes from `<Command>`, not `<CommandDialog>` (our `CommandDialog` wrapper only
   supplies the outer Base UI dialog chrome). Fixed by wrapping the palette's contents in
   `<Command>`.

Verified the full pipeline still works end-to-end post-rewrite (sign in → create project →
add resources → generate AI Briefing → configure + generate an interview, with real
OpenAI calls) — the new UI didn't regress anything built earlier this session.

## 2026-07-06 — Installed a broader shadcn component set

The color/token pass alone read as "boring" — same flat layouts, just recolored. Installed
the rest of the relevant shadcn registry via the CLI (already initialized, `base-nova`
style — this was about expanding the component set, not setting shadcn up from scratch):
`sidebar`, `empty`, `table`, `tooltip`, `skeleton`, `command`, `item`, `field`,
`input-group`, `sheet`, `spinner`, `kbd` (plus `hooks/use-mobile.ts`, pulled in by
`sidebar`). Wrapped the root layout in `TooltipProvider` per the tooltip component's setup
requirement. Declined overwrite prompts for `textarea.tsx`/`dialog.tsx` (already
customized for the sizing-bug fix) and a few files the CLI considered identical
(`button.tsx`, `input.tsx`, `separator.tsx`, `label.tsx`).

**Nothing has been applied to actual pages yet** — this is the component library only.
Next: replace the hand-rolled `app-sidebar.tsx` with the real `Sidebar` primitive, convert
list views (`resource-list.tsx`, `session-list.tsx`) to `Table`/`Item`, replace plain-text
empty states with `Empty`, add `Tooltip`/`Skeleton` polish.

## 2026-07-06 — Applied the DESIGN.md palette to the app

Followed up on the DESIGN.md written earlier this session by actually applying it to
`app/globals.css` and the shared `components/ui/*` primitives — the app previously had
zero brand identity applied despite DESIGN.md existing. Changes:

- `app/globals.css`: `--primary` → honey-amber (`oklch(0.72 0.15 89)`, white text),
  `--foreground`/`--muted-foreground`/`--border` etc. → the warm-neutral "ink" family,
  `--destructive` → the muted "brick" tone (less alarming than the old bright red-orange),
  `--ring` tied to honey-amber instead of neutral gray. Added `--shadow-resting` /
  `--shadow-raised` tokens and a new `--badge-accent` (deep-petrol) token, separate from
  shadcn's semantic `--accent` (which stays a neutral hover-highlight — conflating the two
  would have made every dropdown/select hover state turn brand-colored, which is wrong).
- `components/ui/card.tsx` gets `shadow-resting`; `dialog.tsx`, `select.tsx`,
  `dropdown-menu.tsx` popups get `shadow-raised` (replacing generic `shadow-md`/`shadow-lg`)
  — the ring-based edge definition stays, shadow layers on top of it, per DESIGN.md's
  elevation guidance.
- `components/ui/badge.tsx` gained a new `accent` variant (deep-petrol fill, white text),
  applied specifically to the category/type badges DESIGN.md named (resource type,
  question category, question difficulty, interview type) across `resource-list.tsx`,
  `session-list.tsx`, and the session detail page. Lifecycle-status badges (project
  status, session status) deliberately stayed `outline` — DESIGN.md's language was about
  category/type badges, not state badges, and keeping status neutral avoids over-using the
  petrol accent.
- `components/app-sidebar.tsx`: active nav item now uses `bg-primary/10 text-primary`
  instead of the generic `bg-accent` — the one place DESIGN.md calls out for the
  honey-amber accent to appear per screen.

Verified visually via Playwright: sidebar/CTA honey-amber, category badges petrol-filled,
project/session status badges still neutral, dialog and dropdown shadows confirmed via
computed `box-shadow` (not just visual inspection) to actually resolve the new
`shadow-raised`/`shadow-resting` Tailwind utilities. `.dark` theme intentionally left
untouched — no `ThemeProvider` is wired up in `app/providers.tsx` despite `next-themes`
being a dependency, so dark mode is unreachable currently (Settings tab placeholder still
lists it as unbuilt).

## 2026-07-06 — Adopted Impeccable, wrote PRODUCT.md + DESIGN.md

Installed the Impeccable design skill (`npx impeccable install`, project-scoped under
`.claude/skills/impeccable/`) and ran its `init` flow end to end: interviewed for
strategic context and wrote `PRODUCT.md` (register: product; users: mixed anxious-cram /
deliberate-practice job seekers; personality: calm, focused, competent); generated a brand
seed color via the skill's `palette.mjs` since the app had zero committed brand color
(pure default shadcn neutral gray); composed and wrote `DESIGN.md` + `.impeccable/design.json`
— a "Golden Hour Briefing" palette (honey-amber primary, deep-petrol secondary, pure white
background, soft ambient shadows); and configured `.impeccable/live/config.json` for
Next.js App Router so `/impeccable live` works without first-time setup later. See
[[Decisions/0009-impeccable-design-system-adoption]] for the full rationale.

**Nothing in the actual app has been restyled yet** — `app/globals.css` and
`components/ui/*` still render plain shadcn gray. DESIGN.md is the target; applying it is
follow-up work.

## 2026-07-06 — Job Description URL-or-paste, dialog sizing fix

Two Resources bugs reported after using the feature: (1) Job Description could only be
pasted as text, no URL option; (2) the paste textarea was too small and, worse, its
CSS `field-sizing: content` auto-grow had no `max-height`, so pasting a long job
description grew the whole dialog until the Add/Cancel buttons were pushed off-screen —
the modal became unusable.

Fixed the sizing bug at the shared-component level rather than per-instance, since it
would recur in any dialog with a growing textarea: `components/ui/textarea.tsx` now caps
at `max-h-72` with `overflow-y-auto` (was unbounded), and `components/ui/dialog.tsx`'s
`DialogContent` caps at `max-h-[85vh] overflow-y-auto` with `DialogFooter` now `sticky
bottom-0`, so the footer (and its buttons) stay reachable regardless of how much content
is above it.

Added a fourth resource "kind" — `text_or_url` — used only by `job_description`
(`lib/validations/resource.ts`: `TEXT_OR_URL_RESOURCE_TYPES`, `textOrUrlResourceSchema`,
refined to require at least one of `url`/`content`). Distinct from the existing `url` kind
(LinkedIn/company website/hiring manager — URL required, paste optional) because for a job
posting neither field should be mandatory; users reasonably do either. New
`createTextOrUrlResource` action in `app/(app)/projects/[projectId]/actions.ts`;
`add-resource-dialog.tsx` renders both a URL input and a paste textarea for this kind, and
the dialog itself widened to `sm:max-w-lg` (was `sm:max-w-sm`, cramped for pasting a full
job description or resume section). Verified all three paths (URL-only, paste-only,
neither → validation error) plus the long-paste sizing fix via Playwright.

## 2026-07-06 — AI Briefing onboarding

The AI Briefing tab's empty state was just a one-line placeholder with no guidance on what
"resources" actually means or how many you need. Replaced it with
`components/interview/ai-briefing-onboarding.tsx`: an explainer of what the briefing does
(and why better inputs produce better generated interviews) plus a checklist of the two
recommended inputs — resume/cover letter/notes, and job description — computed from the
project's actual resources in `[projectId]/page.tsx` (a resource "counts" as resume-like if
its type is `resume`, `cover_letter`, `portfolio_pdf`, or `personal_notes`, since there's
currently no dedicated "paste resume text" resource type and users reasonably reach for
Personal Notes for that). The hint text is tri-state: blocked (0 resources), can-generate-but-
suboptimal (some resources, missing one of the two recommended types), and ready (both
present). `generate-briefing-button.tsx` now actually disables itself when there are zero
resources instead of only failing after a click via a toast — same disabled+helper-text
pattern already used by `configure-interview-dialog.tsx`. Verified all three states via
Playwright.

## 2026-07-06 — OpenAI live setup + verification

Set up real OpenAI access: a project-scoped service-account API key (not a personal key —
survives account changes, isolated blast radius if leaked) added to `.env.local`, funded
with prepaid credits ($5 minimum required by OpenAI even though actual usage is a fraction
of a cent per interview). Discovered `gpt-4o-mini` (the default set in the previous
session) had dropped off OpenAI's current pricing page — the lineup had moved to the
`gpt-5.4` family — so swapped `OPENAI_MODEL`'s default to `gpt-5.4-mini`
($0.75/$4.50 per 1M input/output tokens; see
[[Decisions/0007-openai-structured-outputs-via-zod]]).

Ran the live end-to-end verification that was pending from the previous session: real
resume + job description text, real `generateProjectAnalysis` call, real
`createInterviewSession` call. Both produced specific, well-grounded output — the AI
Briefing's Resume Strengths/Gaps and Likely Questions sections referenced exact details
from the pasted resume (specific throughput numbers, the migration project, the manager
conflict), and the generated interview questions built directly on that context rather
than being generic. Roadmap #3 is now fully done and live-verified, not just
offline-verified. Test project/user cleaned up afterward per usual.

## 2026-07-05 — Roadmap #3: OpenAI wiring, AI Briefing, interview question generation

First real OpenAI integration. `lib/prompts/project-analysis.ts` and
`lib/prompts/question-generation.ts` replace their stub throws with Zod-schema'd prompt
builders; `app/(app)/projects/[projectId]/sessions/actions.ts` (new) calls
`chat.completions.parse` + `zodResponseFormat` to get typed output (see
[[Decisions/0007-openai-structured-outputs-via-zod]]). AI Briefing tab now has a working
"Generate/Regenerate Briefing" button (`generate-briefing-button.tsx`, `ai-briefing-view.tsx`)
that produces and displays the spec's 11 briefing sections, inserted as append-only
`ai_briefings` rows. Interview Sessions tab has a real "Configure Interview" dialog
(`configure-interview-dialog.tsx`, backed by `lib/validations/session.ts`) that's disabled
until a briefing exists (see [[Decisions/0008-ai-briefing-required-before-interview-generation]])
and, on submit, generates a full question set sized to the chosen length
(`QUESTION_COUNT_BY_LENGTH`) and redirects to the session page, which now renders the
config + generated question list instead of a placeholder (still no audio/recording — that's
#4). Also added `session-list.tsx` for the Interview Sessions tab's list view.

Caught and fixed a real bug during verification: `lib/openai/client.ts`'s module-level
`new OpenAI(...)` threw synchronously with no `OPENAI_API_KEY` set, crashing every request
through the actions module before any of its own guard clauses (like "add a resource
first") could run. Changed to a lazy `getOpenAIClient()` singleton. `OPENAI_API_KEY` is
still blank in `.env.local` as of this session, so the actual OpenAI call path is
unverified live — offline behavior (empty states, disabled buttons, the no-resources and
missing-API-key error paths, Select label rendering) was fully verified via Playwright
against the real Supabase project; the live generation path needs a follow-up verification
pass once a key is added.

## 2026-07-04 — Resources tab polish: file constraints surfaced, URL paste-content

Surfaced the existing file-upload constraints (`PDF, DOCX, or TXT · Max 10MB`) as helper
text under the file input in `add-resource-dialog.tsx` — they were already enforced by
`fileResourceSchema` but not shown to the user before they picked a file. Added an
optional "paste page text" textarea to the URL-kind resource types (LinkedIn/company
website/hiring manager LinkedIn), stored in `resources.content`, since automatic
scraping isn't built yet — this gives a manual bridge to get that content into AI
context (`urlResourceSchema` gained an optional `content` field, `createUrlResource`
now writes it). Also fixed a real bug caught by Playwright verification: base-ui's
`Select.Value` renders the raw enum value (`company_website`) unless given a formatter
— added a children-render-function that maps value → label via
`RESOURCE_TYPE_OPTIONS`. Re-verified live against Supabase; test data cleaned up.

## 2026-07-03 — Resources tab (upload/paste/URL)

Built the Resources tab end to end, closing spec success criterion #2. Added
`components/project/add-resource-dialog.tsx` (type select branches into file/text/url
inputs) and `components/project/resource-list.tsx` (list + signed-URL download + delete),
backed by new server actions in `app/(app)/projects/[projectId]/actions.ts`
(`uploadFileResource`, `createTextResource`, `createUrlResource`, `deleteResource`,
`getResourceDownloadUrl`) and shared Zod schemas in `lib/validations/resource.ts`. Added
the shadcn `select` component (not previously in the project). File uploads pass `FormData`
straight to the server action — see
[[Decisions/0006-formdata-file-upload-in-server-actions]]. Verified live against the
hosted Supabase project with Playwright (upload, paste, URL add, signed-URL download,
delete all confirmed working through real RLS-scoped requests); test project/user cleaned
up afterward. Content extraction from uploaded files/URLs into `content` is intentionally
out of scope for this pass.

## 2026-07-03 — Knowledge vault

Created this Obsidian vault (`vault/`), seeded with the original product spec
([[00-Product-Spec]]), architecture notes, decision records, and this changelog/roadmap.
Memory now references the vault as the primary source of truth for project context —
see [[Environment]] for how that's wired.

## 2026-07-01 — Auth + Projects wired to schema

Built email/password auth (`app/login`), proxy-level route protection, and full Projects
CRUD against the real schema: Dashboard shows recent projects, `/projects` lists +
creates (dialog), `/projects/[id]` Overview tab shows real data. Restructured routes into
an `app/(app)` group so `/login` doesn't get the authenticated sidebar (see
[[Decisions/0005-route-groups-for-auth-split]]). Hit and fixed a `zod`/
`@hookform/resolvers` incompatibility (see [[Decisions/0004-zod-v3-pin]]).

Resources, Interview Sessions, AI Briefing, Analytics, and Settings tabs are still
placeholders — deliberately out of scope for this pass (see [[Roadmap]]).

## 2026-07-01 — Supabase schema, storage, RLS

Designed and pushed the core schema (`supabase/migrations/20260701040516_core_schema.sql`):
7 tables, RLS on all of them keyed off `projects.user_id`, 3 private storage buckets. CLI
linked to the hosted project. TypeScript types generated and wired into the Supabase
clients. See [[Database-Schema]] and [[Decisions/0003-jsonb-append-only-for-ai-content]].

## 2026-06-30 — Initial scaffold

Next.js 16 (App Router, TS, Tailwind v4) + shadcn/ui + pnpm scaffold, folder structure per
the spec, Supabase/OpenAI client stubs, placeholder routes for every nav item in the spec.
Git initialized, nothing committed yet (deliberate — left for review). See
[[Decisions/0001-pnpm-and-shadcn-base-nova]].
