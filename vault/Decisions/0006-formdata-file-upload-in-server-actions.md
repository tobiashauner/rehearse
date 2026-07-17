---
date: 2026-07-03
status: accepted
---

# 0006 — File uploads pass `FormData` directly to server actions, not JSON

**Decision**: `uploadFileResource(projectId, formData)` in
`app/(app)/projects/[projectId]/actions.ts` takes a `FormData` built client-side
(`add-resource-dialog.tsx`) containing the `type` and `file` fields, called imperatively
from `startTransition` — same imperative-call pattern as `createProject`, just `FormData`
instead of a parsed object. No native `<form action={...}>` is used.

**Why**: Next.js server actions can receive `File`/`FormData` arguments directly (they're
part of the React Server Actions serialization format), so there's no need for a
signed-upload-URL round trip or a separate `/api` route to accept multipart bodies. Zod
validation still runs both sides — `fileResourceSchema` (in `lib/validations/resource.ts`)
is `safeParse`d client-side for UX before building the `FormData`, and again server-side
inside the action as the source of truth — matching the existing shared-Zod-schema
convention from [[Decisions/0002-server-actions-over-tanstack-query]], just working around
`File` not being JSON-serializable through a plain object argument.

**How to apply going forward**: any future file upload (interview audio, exports) can
reuse this shape — client builds `FormData`, action reads `formData.get(...)`, `zod`
schema uses `z.instanceof(File)` with `.refine()` for size/mime checks. Resource type is
branched by "kind" (`file` / `text` / `url`, see `RESOURCE_TYPE_OPTIONS` in
`lib/validations/resource.ts`) rather than one schema per enum value, since several enum
values share the same input shape.
