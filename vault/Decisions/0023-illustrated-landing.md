# 0023 — Illustration-led landing page in brand colors

**Date:** 2026-07-18 · **Status:** shipped (illustration source revised same day — see
"Source pivot" below)

## Source pivot: unDraw, not hand-drawn (final state)

After two rounds of hand-authored SVG characters, Tobias judged the quality short of the
bar and chose stock illustrations from **undraw.co** instead (unDraw license: free
commercial use, no attribution). Final setup:

- SVGs live in `public/illustrations/` (hero.svg = "Interview", step-bring.svg =
  "Updated resume", step-speak.svg = "Speech to text", step-plan.svg = "Checklist",
  conversation.svg = "Conversation", cta-walk-in.svg = "Starting Work"), referenced via
  `next/image` with `alt=""`.
- **Recolored by hex substitution** (fetch + `String.replace`): unDraw's `#6c63ff`
  accent → petrol `#00737c`, `#3f3d56` navy → `#00444e`, `#2f2e41` → ink `#1e2b30`,
  `#ff6584` pink → amber `#ca9e00`; then a per-file warmth pass flipped the petrol
  accent to amber in hero/step-bring/step-plan/conversation. Hexes were computed from
  the DESIGN.md OKLCH tokens (hand-rolled OKLab→sRGB in a scratch script).
- To fetch more: `GET https://undraw.co/api/search?q=<term>` returns
  `results[].media` CDN URLs (param is `q`; POST is not allowed).
- The coaching band's perched-figure overlay was dropped entirely — no unDraw
  equivalent worked on the petrol background (dark garments vanish into it).
- `components/welcome/illustrations.tsx` was deleted; the hand-drawn character grammar
  notes below are kept for history only.

## Original decision (superseded)

The public landing (`app/welcome/page.tsx`) is illustration-led: hand-authored flat SVG
character scenes (`components/welcome/illustrations.tsx`) in the brand palette carry the
story, in the vein of Workable's marketing site — which Tobias supplied as the explicit
reference ("way less generic… human and approachable with character").

Structure: petrol-drenched hero (candidate rehearsing at a desk, interviewer question
card + spoken waveform) → curved divider → three illustrated how-it-works vignettes →
interviewer-character trio beside the product-true personality card → petrol band with
the score chart and a coach seated on the card's edge → door-walk CTA scene that
literalizes "walk in already rehearsed."

## Why

- The previous landing was typographically restrained and product-vignette-based —
  competent but generic; the user judged it interchangeable with any SaaS page.
- Custom SVG (not stock, not generated raster) keeps scenes on-palette, crisp at any
  size, ~zero weight, and editable like code.

## Constraints honored / consciously bent

- One shared illustration palette (petrol ramp, honey-amber, muted brick, varied skin
  tones + matching shade tones for ears/far limbs) and character grammar so scenes read
  as one world. Colors are literal OKLCH in the file — the landing is light-only.
- Character grammar (upgraded 2026-07-18, same day, after Tobias asked for more
  realistic figures): distinct head/neck/torso shapes — profile heads carry a nose,
  lips and jaw in the silhouette; necks are separate skin shapes with a shade band and
  a collar where they meet the garment; shoulders slope; limbs share the garment fill
  and start inside the torso so joints read connected; hands get a thumb circle; faces
  get minimal features (brows, eyes, mouth) tuned per character (closed happy eyes =
  friendly, one raised brow + level mouth = skeptical, open mouth = speaking).
  Rear-view heads are mostly hair with a clipped cheek sliver + ear — never a blank
  skin ball.
- DESIGN.md's "no confetti" stance was **relaxed only here**: sparse geometric accents
  (dots/rings/triangles, ≤6 per scene) as print-texture, never celebration bursts. App
  UI keeps the ban.
- Dark petrol shapes vanish on the petrol bands — anything drawn over petrol needs
  amber/brick/white/skin tones (this bit us twice: coach's legs, ink hair).
- Scenes are `role="presentation"`; adjacent copy carries all meaning. Motion reuses
  `welcome-rise` / `welcome-bar` with the existing reduced-motion fallbacks.
