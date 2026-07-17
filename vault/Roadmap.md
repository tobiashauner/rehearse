# Roadmap

Tracked against the spec's own definition of done — [[00-Product-Spec]]'s "Success
Metrics": *"A successful MVP allows a user to..."*

| # | Capability | Status |
|---|---|---|
| 1 | Create a project | ✅ Done — `/projects` create dialog |
| 2 | Upload a resume and job description | ✅ Done — Resources tab supports file upload (resume/cover letter/portfolio/other PDF, 10MB/PDF-DOCX-TXT limits surfaced in the UI), pasted text (JD/notes), and URLs (LinkedIn/company site/hiring manager) with an optional manual paste-content field as a stand-in for automatic scraping. Uploaded-file text extraction (PDF/DOCX/TXT → `content`) is now also done — see [[Decisions/0014-pdf-text-extraction]] |
| 3 | Generate a realistic interview | ✅ Done, live-verified — AI Briefing tab generates a structured project analysis (`project-analysis.ts`) and Configure Interview generates a full question set from it (`question-generation.ts`); confirmed end-to-end with a real `OPENAI_API_KEY` and `gpt-5.4-mini` against a realistic resume + JD — both the briefing and the generated questions were specific and grounded (e.g. questions directly referenced the candidate's actual projects/numbers from their resume, not generic filler) |
| 4 | Complete a spoken interview in the browser | ✅ **Done, live-verified with a fake mic** — TTS question audio (auto-play + replay, personality-styled voice), mic recording with live visualization, STT → same evaluation path as typing, "Type instead" fallback. Verified headlessly end-to-end (a TTS-generated WAV fed to Chromium as fake mic came back transcribed nearly word-for-word); real-device mic/speaker UX and Safari's mp4 path still deserve one hands-on human pass. See [[Decisions/0016-voice-layer-tts-stt-choices]] |
| 5 | Receive detailed AI feedback for every answer | ✅ Done — per-answer evaluation (score + summary + strengths + improvements + missed points) via `answer-evaluation.ts`, shown live after each answer and in the review transcript, for both spoken and typed answers |
| 6 | Replay every answer | ✅ Done — review page renders an `<audio controls>` player (signed URL) above each spoken answer's transcript |
| 7 | View transcripts | ✅ Done — the review page's per-session transcript (chronological Q&A with scores + feedback) shipped with the text-mode slice; spoken answers show their STT transcript the same way |
| 8 | Run another interview that adapts based on previous performance | ✅ Done, live-verified — every interview after the first automatically folds a past-performance digest (scores, weaknesses, strengths, missed questions, previously asked questions, coaching-plan focus) into question generation; verified end-to-end that session 2's questions targeted session 1's observed weaknesses with zero repeats. The AI Coaching plan (Sessions tab, `coaching_plans` table + `coaching-plan.ts`) is the companion artifact. See [[Decisions/0017-adaptive-interviews-automatic-not-opt-in]] |

Also tracked, not part of the 8 but needed for a usable app:

- ✅ Auth (email/password) + route protection
- ✅ Home / dashboard — **restructured 2026-07-09 into a project-centric single pane**
  (see [[Decisions/0018-project-centric-ia-no-global-nav]]): no global nav, home is the
  project list as metric tiles (latest score + sparkline, interview count, in-progress
  marker, last practiced) with a resume-interview banner; zero-project users get the
  onboarding view. The spec's separate Dashboard/Analytics/Settings nav entries are a
  deliberate divergence, recorded in 0018.
- ❌ Google/GitHub OAuth (manual dashboard config needed — see [[Backend]])
- ✅ AI Briefing tab (manual "Generate Briefing" button — see [[Decisions/0008-ai-briefing-required-before-interview-generation]])
- ✅ Analytics — now the per-project Analytics tab (average score, practice time, answer
  length, score trend, practice cadence — live from real data, illustrated empty states
  otherwise; global `/analytics` redirects home). The spec's
  STAR/confidence/leadership/communication trends are NOT built: the evaluation schema
  doesn't emit those dimensions yet. "Practice streak" deliberately skipped (PRODUCT.md
  bans streak mechanics); "practice cadence" bars are the calm equivalent.
- ❌ Settings tab (voice, playback speed, dark mode, etc. — none built; lives at project
  level per [[Decisions/0018-project-centric-ia-no-global-nav|0018]], global `/settings`
  redirects home)

## Suggested next slice

**All 8 MVP success criteria are done** (2026-07-09). By the spec's own definition, the
MVP is complete. What remains is polish and the non-criteria items above.

Follow-ups, in rough value order: a hands-on human pass of the voice UX on real devices
(see [[Decisions/0016-voice-layer-tts-stt-choices]]); the spec's richer two-panel live
interview layout (live transcript panel, upcoming topics, playback controls); the
Settings tab (voice choice, playback speed, auto-advance — the TTS voice is already
env-configurable, just not per-user); re-answer/compare-versions in review;
URL-resource content extraction (scraping pasted URLs into `content`, vs. the manual
paste fallback that exists) as the last bit of #2; Google/GitHub OAuth (manual dashboard
config — see [[Backend]]).
