---
name: verify
description: How to build, run, and drive Interview Workspace end-to-end for verification — dev server, test users, Playwright recipe, fake-mic audio for the voice interview.
user-invocable: true
---

# Verifying Interview Workspace

## Run

- `pnpm dev` → http://localhost:3000. **Check first whether a dev server is already
  running** (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login`) — the
  user often has one up, and Next refuses a second instance in the same dir. Just drive
  the running one; it compiles from disk so it serves your changes.
- `pnpm build` is the CI-equivalent check; run it before calling anything done — but
  **not while a dev server is running** (they share `.next/`; restart `pnpm dev` after
  a build, or run `tsc --noEmit` + eslint instead while it's up).

## Test users

- Supabase email confirmation is **ON** (as of 2026-07-07) — UI signup stalls at "check
  your email". Instead pre-create a confirmed user with the service role key:
  `admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })`
  (see `create-user.mjs` pattern in past sessions; keys in `.env.local`).
- Supabase **rejects `@example.com` emails** as invalid. Use `tahauner+<tag>-<ts>@gmail.com`.
- Load `@supabase/supabase-js` from the project via
  `createRequire("/path/to/interview-coach/package.json")` — pnpm layout breaks direct
  dist imports from outside the project.
- **Always clean up**: deleting the auth user cascades through all tables
  (`projects.user_id → on delete cascade`), but storage objects must be removed
  explicitly (list+remove under the `<uid>/` prefix in `interview-audio`, `resources`,
  `exports`).

## Playwright recipe

Install `playwright` in the scratchpad (`npm i playwright`); Chromium builds are cached
in `~/Library/Caches/ms-playwright`. Headless works for everything including audio.

Selector gotchas (base-ui/shadcn):

- "New Project" appears twice (header + empty state) → `.first()`.
- Create-project submit button is labeled **"Create"**, not "Create Project".
- Creating a project or interview session **redirects straight to its page** — wait for
  URL, don't look for a list link.
- Link-styled buttons (`Button render={<Link/>} nativeButton={false}`) render an `<a>`
  with **`role="button"`** — query them with `getByRole("button")`, never
  `getByRole("link")`.
- In the interview runner, answer mode **persists across questions**: "Type instead"
  only exists while in voice mode; after switching once, later questions render the
  textarea directly.
- Selects are base-ui: click the trigger by id (`#resource-type`), then
  `getByRole("option", { name: ... })`.
- Briefing: "Generate Briefing" → wait for "Regenerate Briefing" (~10–30s LLM call).
  Interview generation: "New Interview" → "Generate Interview" → wait for
  `/sessions/<id>` URL (~5–60s).

## Voice interview (fake mic)

The full spoken pipeline is verifiable headlessly:

1. Generate a WAV of a realistic spoken answer via OpenAI TTS
   (`response_format: "wav"`, key from `.env.local`) with distinctive words to assert
   in the transcript.
2. Launch Chromium with
   `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream
   --use-file-for-fake-audio-capture=<answer.wav> --autoplay-policy=no-user-gesture-required`
   and context `permissions: ["microphone"]`.
3. Drive: Start Interview → wait for the hidden `<audio>` to get a `currentSrc`
   containing `interview-audio` (TTS works) → "Start answer" → wait ≥ the WAV length →
   "Finish answer" → assert the "What we heard" transcript contains the distinctive
   words (STT works) → review page has `<audio controls>` whose src fetches 200.
4. The fake capture file **loops**, so the transcript may repeat its opening words at
   the end — expected artifact, not a bug.

What this can't cover: real mic/speaker quality, browser permission prompts on real
devices, Safari's audio/mp4 recording path. Those need hands-on human testing.
