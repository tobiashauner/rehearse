---
date: 2026-07-16
status: accepted
---

# 0021 — Voice answers upload direct to storage, not through a server action

**Decision**: `submitAudioAnswer` no longer receives the recording as `FormData`. The
browser (`interview-runner.tsx`) uploads the blob straight to the `interview-audio`
bucket with the Supabase browser client, then calls the action with
`{ storagePath, mimeType, durationSeconds }`. The action verifies the path lies inside
`${user.id}/${sessionId}/`, downloads the object server-side, and transcribes from that
buffer. `bodySizeLimit` in `next.config.ts` dropped from 25mb to 4mb.

**Why**: Vercel hard-caps Serverless Function request bodies at **4.5MB** — no Next
config can raise it. A few minutes of recorded audio exceeds that, so the
[[Decisions/0006-formdata-file-upload-in-server-actions|0006]] FormData pattern would
have failed silently in production while working perfectly in local dev. Storage RLS
(`auth.uid()` must equal the first path folder) already authorizes the direct upload;
the server-side path prefix check is belt-and-braces with a clearer error message.

**How to apply going forward**: 0006's FormData shape remains right for small files
(resumes/documents, well under 4.5MB). Anything that can exceed ~4MB must go direct to
storage and pass a reference. If resume uploads ever need >4MB support,
`uploadFileResource` gets this same treatment.
