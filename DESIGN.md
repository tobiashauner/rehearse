---
name: Interview Workspace
description: AI-generated mock interviews, grounded in your resume and the job you're preparing for
colors:
  honey-amber: "oklch(0.72 0.15 89)"
  honey-amber-hover: "oklch(0.66 0.16 89)"
  deep-petrol: "oklch(0.48 0.14 200)"
  deep-petrol-hover: "oklch(0.42 0.14 200)"
  bg: "oklch(1 0 0)"
  surface: "oklch(0.97 0.006 91)"
  ink: "oklch(0.20 0.01 91)"
  muted: "oklch(0.55 0.02 91)"
  border: "oklch(0.90 0.006 91)"
  error: "oklch(0.55 0.14 35)"
  error-hover: "oklch(0.49 0.15 35)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.honey-amber}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.honey-amber-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  badge-accent:
    backgroundColor: "{colors.deep-petrol}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Interview Workspace

## 1. Overview

**Creative North Star: "The Golden Hour Briefing"**

Interview Workspace should feel like reviewing your notes with a good mentor in the last
warm light of the afternoon, before walking into the room — considered, unhurried, quietly
capable. The palette carries that warmth deliberately: a single honey-amber brand color
against a pure white, uncluttered surface, so the warmth reads as intentional rather than
as decoration everywhere.

This system explicitly rejects the cold, clinical feel of testing or assessment software —
no sterile exam-room chrome, no proctor-like framing, no stark pass/fail visual language.
It also rejects gamification: no streaks, mascots, confetti, or badge-as-reward mechanics.
A real interview isn't a game, and the interface shouldn't pretend otherwise. Depth comes
from soft, ambient shadows rather than heavy borders or dense card grids — everything
should feel like it's resting gently on the page, not boxed in.

**Key Characteristics:**
- Warm, single-accent restraint: honey-amber appears deliberately, not everywhere
- Pure white surface; warmth lives in color and type, not in a tinted background
- Soft ambient elevation instead of hard borders or heavy card chrome
- Calm under pressure: nothing in the UI should read as alarming, urgent, or punitive
- Generous whitespace; one clear next action per screen

## 2. Colors

A restrained palette: pure white and near-black carry the structure, one warm accent
(honey-amber) carries emphasis, and one cool accent (deep petrol) carries status and
secondary emphasis. Per the product's own **Restrained** color strategy, honey-amber
should never cover more than ~10% of any given screen — its rarity is what makes it read
as considered rather than decorative.

### Primary
- **Honey Amber** (oklch(0.72 0.15 89)): the single call-to-action color — primary
  buttons, active tab indicators, the one thing on a screen you're meant to act on. Always
  paired with white text (never dark-on-amber; the Helmholtz-Kohlrausch effect makes this
  saturation read muddy with dark text).

### Secondary
- **Deep Petrol** (oklch(0.48 0.14 200)): status and category badges (resource types,
  question difficulty, interview type), links, and secondary emphasis where amber would
  overuse the primary accent. Dark enough to carry white text directly.

### Neutral
Three tiers of surface, darkest to lightest, so the eye reads the sidebar/header, the page
canvas, and cards as distinct planes without needing borders to do all the work:
- **Nav Petrol-Neutral** (oklch(0.93 0.012 91)): sidebar and header surface — the darkest
  tier, giving the app shell a clearly separate plane from the content it frames.
- **Warm Paper** (oklch(0.985 0.007 91)): page background for the content pane. A whisper
  of the brand hue rather than a stark white canvas.
- **Pure White** (oklch(1 0 0)): card and popover surfaces — the lightest tier, so cards
  read as gently lifted off the warm-paper page background beneath them.
- **Ink** (oklch(0.20 0.01 91)): body text and headings. Near-black with the faintest warm
  undertone rather than a true neutral gray.
- **Muted Ink** (oklch(0.55 0.02 91)): secondary text, timestamps, helper copy.
- **Hairline** (oklch(0.90 0.006 91)): borders and dividers.
- **Brick** (oklch(0.55 0.14 35)): error and destructive states. Deliberately a muted
  brick-red rather than an alarm-red — errors here mean "let's fix this," not "you failed."

### Named Rules
**The One Accent Rule.** Honey-amber is the only warm, saturated color allowed to carry a
filled background on any screen. If a screen needs a second filled color, it's deep-petrol,
never a second warm hue — two competing saturated warms is the tell of an unconsidered
palette.

## 3. Typography

**Display Font:** Inter (with ui-sans-serif, system-ui fallback)
**Body Font:** Inter

**Character:** A single humanist sans carries the whole system — no display/body
pairing. Inter is calm and legible at every size already used in the app; introducing a
second family would add friction without adding personality here. Consistency across weight
does the work a pairing would otherwise do.

### Hierarchy
- **Display** (500, `clamp(1.5rem, 3vw, 2rem)`, 1.2): project titles, page-level headings.
  One per screen.
- **Headline** (500, 1.125rem, 1.3): section and tab-content headings ("Generate your AI
  Briefing", "AI Briefing").
- **Title** (500, 0.9375rem, 1.4): card and list-item titles — resource names, question
  text, session labels.
- **Body** (400, 0.875rem, 1.5): paragraphs, descriptions, form labels. Cap prose at
  65–75ch.
- **Label** (500, 0.75rem, 1.3, tracking +0.01em): badges, timestamps, helper/hint text
  under form fields.

### Named Rules
**The One Family Rule.** Inter, in weight and size variation only. Do not introduce a
second typeface for "personality" — the warmth comes from color and copy tone, not from
type pairing.

## 4. Elevation

Soft, ambient shadows carry depth — a deliberate change from the code's current
ring-only definition (`ring-1 ring-foreground/10`), which stays as a crisp 1px edge but no
longer does all the work alone. Depth should feel like gentle daylight, not stacked
material layers: diffuse, low-contrast, never a hard drop shadow.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px oklch(0.20 0.01 91 / 5%)`): default card and list-row
  elevation — barely perceptible, just enough to separate from the page.
- **Raised** (`box-shadow: 0 8px 24px oklch(0.20 0.01 91 / 10%), 0 2px 8px oklch(0.20 0.01 91 / 6%)`):
  dialogs, popovers, dropdowns — anything that floats above the page content.

### Named Rules
**The Daylight Rule.** Shadows are always warm-neutral (ink at low opacity), never pure
black. A pure-black shadow at any opacity reads as heavier and colder than this system's
"golden hour" character allows.

## 5. Components

### Buttons
- **Shape:** rounded corners (10px, `--radius-lg`)
- **Primary:** honey-amber background, white text, 8px/12px padding. The only saturated
  filled button on any screen.
- **Hover / Focus:** primary darkens to honey-amber-hover on hover; focus-visible gets a
  3px ring in the honey-amber family at reduced opacity (already the codebase's
  `focus-visible:ring-3 focus-visible:ring-ring/50` pattern — keep it, just tie `--ring` to
  the brand hue instead of neutral gray).
- **Secondary / Ghost:** neutral outline or transparent background with ink text — used
  for every non-primary action. There should be at most one honey-amber button visible on
  screen at a time.

### Badges
- **Style:** deep-petrol fill with white text for status/category (resource type,
  question difficulty, interview config); neutral outline badges (existing `variant="outline"`)
  for lower-emphasis metadata.
- **Shape:** 8px radius (`--radius-md`), tight horizontal padding.

### Cards / Containers
- **Corner Style:** 14px radius (`--radius-xl`) for cards/dialogs, matching the existing
  scale.
- **Background:** pure white or warm-paper, never a tinted "elevated" gray.
- **Shadow Strategy:** Resting shadow at rest; Raised shadow only for dialogs/popovers (see
  Elevation).
- **Border:** hairline neutral border retained alongside the new shadow — don't remove the
  existing ring-based definition, layer shadow on top of it.

### Inputs / Fields
- **Style:** hairline border, pure white or transparent background, 8-10px radius.
- **Focus:** border shifts toward honey-amber-adjacent ring, not generic blue — ties form
  interaction back to the brand color even though buttons carry the saturated fill.
- **Error:** brick-colored border and helper text, never a harsh pure red — errors should
  read as "let's fix this," not alarm.

### Navigation
- **Style:** the shell is header-only — no sidebar; the project-centric IA (home = the
  project pane, everything else inside a project's tabs) carries navigation. The active
  tab indicator is the clearest place for honey-amber to appear as a deliberate,
  singular accent per screen, alongside the screen's one primary button.

## 6. Do's and Don'ts

### Do:
- **Do** keep honey-amber to one clear action per screen — it's a spotlight, not a
  wash.
- **Do** use the three-tier neutral hierarchy (nav petrol-neutral, darkest → warm-paper
  page background → pure-white cards, lightest) to separate the app shell, the page
  canvas, and elevated surfaces — reserve pure white for cards/popovers, not the whole
  page.
- **Do** use soft, warm-neutral ambient shadows (never pure black) for elevation.
- **Do** keep error/destructive states in the muted brick family — a mistake should feel
  fixable, not punished.
- **Do** respect `prefers-reduced-motion` on every transition; a crossfade or instant swap
  is the fallback, never nothing.

### Don't:
- **Don't** make this look like testing or assessment software — no exam-room chrome, no
  proctor framing, no stark pass/fail red-vs-green.
- **Don't** gamify — no streaks, mascots, confetti, or reward-badge mechanics. This isn't
  Duolingo.
- **Don't** let the warm-paper tint drift toward a saturated cream/sand/parchment wash —
  the tint should read as barely-there (`oklch(0.985 0.007 91)`), a structural cue between
  the sidebar and cards, not a decorative "warm" background in its own right.
- **Don't** use `border-left`/`border-right` colored stripes as a decorative accent on
  cards or list items.
- **Don't** use gradient text (`background-clip: text` with a gradient) for emphasis —
  weight or the honey-amber color does that job.
- **Don't** use glassmorphism as a default treatment — rare and purposeful, or not at all.
- **Don't** default to identical card grids for every list; this app's resource/session
  lists are already row-based for a reason — keep that variety.
- **Don't** add a small uppercase tracked "eyebrow" label above every section, or number
  sections 01/02/03 as default scaffolding — both are 2023-era AI tells, not this system's
  voice.
