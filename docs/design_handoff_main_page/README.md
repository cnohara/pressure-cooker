# Handoff: PressureCooker Main Session Page

## Overview

This handoff documents a redesign of the **main session page** for PressureCooker — the screen a user sees during an active Builder↔Critic loop. The redesign commits to a **playful/tactile aesthetic** anchored by a pixel-art pressure cooker on the sidebar that reacts visually to how the Builder/Critic discourse is going.

Target stack (per `CLAUDE.md`): **SvelteKit 2 + Svelte 5 runes + Tailwind CSS 4 (dark-mode only in the existing app, but this design is a warm-light palette — see the Light Mode note below). Direct browser OpenRouter streaming.**

## About the design files

The files in this bundle are **design references created in HTML** — a single-page prototype showing intended look and behavior, not production code to drop in. The task is to **recreate the design inside the existing SvelteKit app** using its established patterns: `.svelte` components, Svelte 5 runes (`$state`, `$derived.by`, `$effect`), and Tailwind 4 utility classes.

The HTML prototype uses vanilla JS + inline CSS + Google Fonts; when porting, prefer:
- Components in `src/lib/components/` (matches existing structure)
- Fonts via `@fontsource/*` packages rather than Google Fonts links (matches existing `@fontsource/inter` setup)
- State in `src/lib/stores/session.svelte.ts` (already exists; extend it)

## Fidelity

**High-fidelity.** Final colors, typography, spacing, emoji choices, animation timing, and interaction behavior are all intentional. Recreate the UI pixel-perfectly using the codebase's Tailwind utilities and Svelte component patterns.

## Light mode note

The existing app is dark-mode only. This design is intentionally **light / warm paper** — the playful/tactile aesthetic relies on off-white canvas and copper accents. You have three options:

1. **Accept the shift.** Ship this as the new light theme and update Tailwind config accordingly (recommended).
2. **Port to dark.** Translate the palette: swap canvas `#F2EBDE` → dark slate, ink `#1A1613` → warm off-white, keep copper accents. Pot art still works on dark backgrounds.
3. **Add a theme toggle.** More work but cleanest.

The rest of this handoff assumes option 1.

---

## Screens / Views

One screen. Mid-session state (Round 3 of 5, Critic actively streaming). Other states to build: pre-session (empty), session complete (summary shown). Those aren't in the mock but can be derived from this one.

### Layout (desktop, ≥1280px)

```
┌────────────────────────────────────────────────────────────────┐
│ SIDEBAR (360px fixed)      │ MAIN (flex 1)                     │
│                            │                                   │
│  Brand                     │  Topbar (Topic + Model chips)     │
│  Pot stage (reactive)      │  Timeline (round pills)           │
│  How it's going            │  ┌─────────┬─────────┐            │
│   └ verdict + subtitle     │  │ Builder │ Critic  │            │
│   └ sparkline              │  │ stream  │ stream  │            │
│   └ round emoji chips      │  │         │ (live)  │            │
│   └ legend                 │  └─────────┴─────────┘            │
│  Session details (collaps) │                                   │
│  Stop cooking button       │                                   │
└────────────────────────────────────────────────────────────────┘
```

**Sidebar:** `width: 360px; position: sticky; top: 0; height: 100vh; overflow: hidden` (inner sections scroll if needed)
**Main:** `flex: 1; min-width: 0` with internal `display: flex; flex-direction: column`

**Responsive:** The design assumes desktop. Mobile/tablet is out of scope for this handoff — stack sidebar above main if needed, or defer to a later pass.

---

## Design Tokens

### Colors (CSS custom properties used in the prototype)

```css
/* canvas / paper */
--canvas:   #F2EBDE;   /* primary background */
--canvas-2: #E8DFCD;   /* slight shadow, input backgrounds */

/* ink */
--ink:    #1A1613;     /* primary text */
--ink-2:  #4A3F35;     /* secondary text */
--ink-3:  #8A7A68;     /* tertiary / labels */

/* rules / borders */
--line:   #D4C7AE;
--line-2: #C4B497;

/* accent — copper */
--copper:   #B4562A;
--copper-2: #C97142;
--copper-3: #7A3A1C;

/* semantic */
--steam:  #EDE3D0;
--alarm:  #C4351E;     /* pressure-red; used for stop-button pulse */
--ember:  #E88A2A;     /* heat orange */
--cool:   #6B8A7A;     /* low-pressure green (good/cooked) */

/* role-specific */
--builder-tag: #3E5B46; /* forest green — Builder role */
--critic-tag:  #7A3A1C; /* dark copper — Critic role */
```

Recommended Tailwind config addition:

```js
// tailwind.config.js (excerpt)
theme: {
  extend: {
    colors: {
      canvas: { DEFAULT: '#F2EBDE', muted: '#E8DFCD' },
      ink: { DEFAULT: '#1A1613', 2: '#4A3F35', 3: '#8A7A68' },
      line: { DEFAULT: '#D4C7AE', 2: '#C4B497' },
      copper: { DEFAULT: '#B4562A', light: '#C97142', dark: '#7A3A1C' },
      alarm: '#C4351E',
      ember: '#E88A2A',
      cool: '#6B8A7A',
      builder: '#3E5B46',
      critic: '#7A3A1C',
    }
  }
}
```

### Typography

Three fonts. Pair them as follows:

| Use | Family | Notes |
|---|---|---|
| Display (serif headings, verdict, readouts) | **Instrument Serif** | Weight 400 only; supports italic |
| Body (paragraphs, UI copy) | **Inter** | 400/450/500/600 |
| Labels, data, meta, timestamps, buttons | **JetBrains Mono** | 400/500/600 |

Install via fontsource:
```bash
pnpm add @fontsource/instrument-serif @fontsource/jetbrains-mono
# inter already installed per CLAUDE.md
```

Import in `src/routes/+layout.svelte`:
```js
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
```

Tailwind:
```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  serif: ['"Instrument Serif"', 'Georgia', 'serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
}
```

### Type scale used in the design

| Role | Size / line-height | Family | Example |
|---|---|---|---|
| Readout value (big number) | `34px / 1` | serif | "4:22" |
| Verdict ("How it's going") | `20px / 1.15` italic | serif | "Finding common ground" |
| Role name (Builder/Critic) | `22px / 1` | serif | "Builder" |
| Topic | `22px / 1.3` | serif | Session topic text |
| Brand wordmark | `22px / 1` | serif | "PressureCooker" |
| Streamed body text | `13.5px / 1.65` | sans | Paragraphs in streams |
| Subhead (h3 in streams) | `18px / 1.3` | serif | "Revised onboarding plan" |
| Labels (uppercase mono) | `9–10px / 1, 0.12em tracking` | mono | "ELAPSED", "BUILDER" |
| Round pill number | `22px / 1` | serif | "03" |
| Round pill meta | `10px / 1` | mono | "streaming", "00:52" |
| Caption / legend | `9px / 1, 0.08em tracking` | mono | Chip legend |

### Spacing

Tailwind's default 4px scale. The prototype primarily uses: `4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 28px`.

### Border radius

`2px` for utility chips/buttons, `3px` for larger containers. Avoid heavy rounding — the design is slightly boxy to complement the pixel pot.

### Shadows

Minimal. Used only on:
- Active round pill: `box-shadow: 0 2px 0 var(--copper-3)` (chunky bottom border)
- Top-up button: `border-bottom-width: 2px` with `--copper-3`
- Stop button active dot: `box-shadow: 0 0 0 3px rgba(196,53,30,0.2)` (pulsing ring)
- Tweaks panel: `0 8px 24px rgba(26,22,19,0.25), 0 2px 0 var(--copper-3)`

### Background texture

Subtle 20px × 20px dot grid on `body`:
```css
background-image: radial-gradient(circle at 1px 1px, rgba(26,22,19,0.05) 1px, transparent 0);
background-size: 20px 20px;
```

Render this once at the root layout level.

---

## Components

Component breakdown, from the existing file structure in `CLAUDE.md`. New components marked **(NEW)**; existing ones marked **(EDIT)**.

### 1. `PressureCookerViz.svelte` (EDIT — major rewrite)

The signature component. Pixel-art pot + steam/smoke/sparks ambient + mood chip, all reactive.

**Props:**
- `convergenceScore: number` (0–100)
- `variant: 'stovetop' | 'lab' | 'bubbling' | 'jiggler'` (default `'jiggler'`)
- `moodOverride?: Mood` (for preview/testing; else derive from score)
- `roundCount: number` (for the "Round 03 / 05" label)
- `currentRound: number`

**Derived:**
```ts
type Mood = 'burnt' | 'argued' | 'simmer' | 'simmer-high' | 'cooked';

const mood = $derived.by<Mood>(() => {
  if (moodOverride && moodOverride !== 'auto') return moodOverride;
  if (convergenceScore < 25) return 'burnt';
  if (convergenceScore < 55) return 'argued';
  if (convergenceScore < 75) return 'simmer';
  if (convergenceScore < 90) return 'simmer-high';
  return 'cooked';
});

const moodLabel = $derived({
  burnt: 'burning — stuck arguing',
  argued: 'heated debate',
  simmer: 'simmering nicely',
  'simmer-high': 'almost there',
  cooked: 'perfectly cooked',
}[mood]);
```

**Structure:**
```
<div class="pot-stage" :class="[moodStageClass]">
  <div class="pot-stage-title">
    Pot <mood-chip>{moodLabel}</mood-chip>
    <span class="round">Round {currentRound} / {roundCount}</span>
  </div>
  <div class="pot-wrap">
    <!-- SVG pot — selected by variant, colored by mood -->
    <!-- Ambient layer (steam/smoke/sparks/halo) -->
    <!-- Heat glow -->
  </div>
</div>
```

**Key implementation details:**
- Pot SVGs are 88×90 viewBox, rendered pixelated (`shape-rendering: crispEdges`, `image-rendering: pixelated`) and scaled to 220px wide.
- The **jiggler** variant accepts the `mood` and recolors body, stripe, burner, soot patches accordingly. Other variants can stay mood-agnostic for v1.
- The lid has a `jiggle` class with a keyframe animation (brief shake every 2.4s). Jiggler's weight has an independent `animateTransform` rotating ±8–18° depending on mood.
- **Ambient effects by mood:**
  - `burnt`: 4× smoke puffs (dark blurred circles rising), 3× red/orange sparks flying outward, red heat glow
  - `argued`: fast chaotic steam (1.1–1.6s durations)
  - `simmer`: steady clean steam (2.6s duration at medium heat)
  - `simmer-high`: simmer + 3 subtle sparkles twinkling
  - `cooked`: gentle wisps + 7 sparkles in staggered rhythm + green `✓` halo badge in upper-right of stage

See `Main Page.html` → `POTS` object for exact SVG markup of all 4 pot variants and the `renderPot()` function for ambient composition.

**CSS animations to port (keyframes):**
- `@keyframes rise` — steam drift (translate -50%,0 to -50%,-120px; scale 0.6 to 1.8; opacity 0→0.9→0.6→0)
- `@keyframes smoke-rise` — darker, slower, drifts right
- `@keyframes spark-fly` — 1.4s linear fade + translate outward
- `@keyframes flicker` — heat glow opacity pulse
- `@keyframes jiggle` — lid shake at 90–100% of cycle
- `@keyframes sparkle-twinkle` — 2.4s star scale + rotate + opacity
- `@keyframes pulse-dot` — the streaming indicator
- `@keyframes pop` — cooked halo pop-in

All are defined at the bottom of the `<style>` block in `Main Page.html`.

---

### 2. `VibePanel.svelte` **(NEW)** — "How it's going"

Replaces what was the numeric convergence gauge. Renders:
- Label + verdict (plain-English + short explanation)
- Agreement sparkline (inline SVG)
- Round emoji chips (5 chips in a grid)
- Legend below chips

**Props:**
- `rounds: RoundOutput[]` (existing type from `src/lib/api/types.ts`)
- `currentRoundIndex: number`
- `totalRounds: number`

**Verdict derivation logic** (port from `deriveVibe()` in the prototype):

```ts
interface Vibe { verdict: string; sub: string; }

function deriveVibe(rounds: { score: number | null }[]): Vibe {
  const done = rounds.filter(r => r.score != null);
  if (done.length === 0) return { verdict: 'Just started', sub: 'Waiting for round 1.' };

  const latest = done[done.length - 1].score!;
  const first = done[0].score!;
  const trend = latest - first;
  const n = done.length;

  if (latest >= 90) return { verdict: "They've landed together", sub: 'Both models now agree on the plan.' };
  if (latest >= 75 && trend >= 15) return { verdict: 'Close to agreement', sub: 'Still nudging details, but the shape is settled.' };
  if (trend >= 20) return { verdict: 'Finding common ground', sub: `Agreement has climbed ${trend} points across ${n} rounds.` };
  if (trend >= 5) return { verdict: 'Slowly coming around', sub: 'Small moves toward each other every round.' };
  if (Math.abs(trend) < 5 && latest < 40) return { verdict: 'Stuck arguing', sub: `${n} rounds in and neither side has budged.` };
  if (Math.abs(trend) < 5) return { verdict: 'Holding steady', sub: 'Partial agreement, no movement this round.' };
  if (trend <= -15) return { verdict: 'Drifting apart', sub: `Disagreement has grown since round 1 (${Math.abs(trend)} points lost).` };
  if (trend < 0) return { verdict: 'One side pushing back', sub: 'The Critic keeps surfacing new problems.' };
  return { verdict: 'Working it out', sub: 'Debate in progress.' };
}
```

**Emoji per round**:

```ts
function emojiForRound(score: number | null, prev: number | null): string {
  if (score == null) return '·';
  const delta = prev == null ? 0 : score - prev;
  if (score < 25) return '🔥';       // dispute
  if (score >= 85) return '✓';       // done
  if (delta >= 15) return '🤝';      // big move toward agreement
  if (delta <= -10) return '🔥';     // moved apart
  return '↔';                         // debate
}
```

**Sparkline geometry** (240×70 SVG, preserveAspectRatio="none"):
- `PAD_X = 14, PAD_Y = 8`
- `xFor(i) = PAD_X + (i / (rounds - 1)) * (W - 2*PAD_X)`
- `yFor(score) = PAD_Y + (1 - score/100) * (H - 2*PAD_Y)`
- 3 horizontal grid lines at y=10, 35, 60 (dasharray "2 3", stroke `--line-2`)
- Polyline through all done/current rounds, stroke `--copper`, 2px
- Polygon fill underneath with a vertical linearGradient (copper → transparent)
- Dots: 3.5px radius for done (`fill: --copper`), 4.5px for current (`fill: --ink, stroke: --copper 2px`), dashed circle for pending

**Round chips:**
```
.round-chips { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.rchip { padding: 6px 4px 4px; border: 1px solid --line-2; border-radius: 2px; cursor: pointer; }
.rchip.current { background: --ink; color: canvas; box-shadow: 0 2px 0 --copper-3; }
.rchip.pending { border-style: dashed; opacity: 0.55; }
.rchip .ri { font-size: 16px; font-family: emoji; }
.rchip .rn { font-size: 9px; mono; color: --ink-3; }
```

**Legend:**
```
🔥 DISPUTE   ↔ DEBATE   🤝 AGREEING   ✓ DONE
```
Mono 9px, 0.08em letter-spacing, color `--ink-3`.

---

### 3. `SessionDetailsTray.svelte` **(NEW)** — collapsible details

Replaces the previous always-visible readouts row. Inside a collapsible with a single toggle row showing `"Session details & credits  $2.41  ▾"`.

**Body reveals:**
- 2×2 stat grid: Tokens · Spent · Elapsed · Temp (with info tooltip on Temp)
- Credits widget: balance, progress bar, "~N more sessions" meta, Top up button
- Session ID row (mono 9px): `Session 7f3c-aa21 · started 16:22 · apr 20`

**Props:**
- `tokens: number`
- `spentUsd: number`
- `elapsedSec: number`
- `temperature: number`
- `creditsUsd: number`
- `creditsCapacityUsd?: number` (for progress bar math; if absent use a sensible default like $6.00)
- `sessionId: string`
- `startedAt: Date`

**Temp tooltip copy** (existing in the prototype):
> "LLM sampling temperature — 0 is deterministic, 1.0 is very varied. 0.7 is balanced."

**Toggle behavior:** click to expand/collapse. Use `max-height` transition (0 → 400px, 0.3s ease). Rotate the `▾` chevron 180° on open.

---

### 4. `Sidebar.svelte` **(NEW container)** — composes Brand + PressureCookerViz + VibePanel + SessionDetailsTray + StopButton

Stacks vertically. Fixed 360px wide, `100vh`, `position: sticky`, warm paper background `#EBE1CC`, `border-right: 1px solid --line`.

**Stop cooking button** (in footer):
- Full-width, black `--ink` background, canvas text, mono 11px uppercase 0.1em tracking
- Pulsing red `--alarm` dot on the left (8px circle, box-shadow pulse 1.2s)
- Label: "Stop cooking"
- On click: call existing `stopSession()` from `session.svelte.ts`

---

### 5. `Topbar.svelte` **(NEW)**

Horizontal bar above the streams. Contains:
- **Topic chip** (left): "TOPIC" mono label + the session topic in serif 22px
- **Model chips** (right): two small pills showing current Builder and Critic models, each with a 3px left border in the role color (`--builder-tag` / `--critic-tag`)
- **Settings icon button** (far right): existing gear SVG (see markup)

---

### 6. `RoundTimeline.svelte` **(EDIT or NEW)** — horizontal round stepper

Replaces the existing accordion-per-round approach for the top view (keep the accordion for expanded detail on click if desired).

5 pills side-by-side, full-width of main area. Each pill:
- Left: round number in serif 22px (e.g. "03")
- Center: two-line meta (`lbl` uppercase mono 9px, `val` mono 10px 600 weight)
- Right: score chip (`--copper` background, white, 10px mono)

**States:**
- `done`: background `#E6DBC3`, readable
- `active`: black `--ink` background, canvas text, `--copper-3` 2px bottom shadow, black arrow indicator beneath the pill pointing down
- `pending`: dashed border, muted text, no score chip

Clicking a done/active pill should scroll the corresponding round into view or expand its accordion.

---

### 7. `StreamingPanel.svelte` **(EDIT)** — Builder/Critic panes

Two side-by-side panels inside a `grid-template-columns: 1fr 1fr`, divided by a 1px rule.

Each panel:
- **Head**: role badge (36px circle with letter "B"/"C" in white, background `--builder-tag`/`--critic-tag`) + role name (serif 22px) + role sub ("claude-opus-4 · 32k ctx", mono 10px uppercase) + status badge on the right
- **Body**: rendered markdown. Uses existing `marked`. Headings become serif 18px. Code inline uses mono 12px on `--canvas-2` background. Blockquotes have a 3px left border in `--copper` with 6% copper-tinted background.
- **Foot** (small mono 10px row): token count + duration on the left, cost on the right

**Status badge variants:**
- `done`: `--canvas-2` background, ✓ prefix, mono 10px uppercase
- `streaming`: black background, canvas text, 6px pulsing `--copper-2` dot, label "Streaming"
- `waiting`: `--canvas-2`, muted text

**Streaming caret:** After the last character in the live stream, append `▋` colored `--copper`, animated `blink 0.9s step-end infinite` (50% opacity). Remove when stream ends.

---

### 8. `Tweaks.svelte` **(OMIT)**

The tweaks panel in the prototype is a design-time preview affordance (pot variation, accent color, rounds count, heat intensity, preview pot state, convergence slider). It is **not** part of the shipped app — omit entirely from the Svelte port.

---

## Interactions & Behavior

### Mood reactivity (already covered above)

- Pot viz + mood chip update live as convergence score changes.
- Ambient particles swap in/out on mood change (re-render the ambient layer in a Svelte `{#if}` block keyed by `mood`).

### Status transitions within a round

Per `CLAUDE.md` flow:
1. **Builder streaming**: Builder panel status = "Streaming", Critic = "Waiting"
2. **Builder done, Critic streaming**: Builder = "Delivered" (done), Critic = "Streaming"
3. **Both done**: both show "Delivered"; convergence score parsed and added to round data
4. **Round complete → next round starts** OR **all rounds complete → summary**

Update the mood chip + pot after each convergence score arrives.

### Stop cooking

Calls existing `stopSession()` which triggers `AbortController.abort()` mid-stream. After stop:
- Status badges drop to "Stopped"
- Pot mood returns to the last-known score's mood (or "argued" if incomplete)
- Stop button changes to "Start new session"

### Details tray

Collapsed by default. `localStorage` key `pressurecooker_details_open` (boolean) can persist preference.

### Top up (stub — no real flow yet)

The Top up button is design-only. When wiring: likely opens a modal with OpenRouter/Stripe credit options. Out of scope for this handoff.

---

## State management

Extend `src/lib/stores/session.svelte.ts`. Existing `SessionState` already has rounds with convergence scores. Add:

```ts
// For the vibe panel
export const sessionVibe = $derived.by(() => deriveVibe(
  session.rounds.map(r => ({ score: r.convergenceScore }))
));

// For the pot mood (drives PressureCookerViz)
export const currentConvergence = $derived.by(() => {
  const latest = session.rounds[session.rounds.length - 1];
  return latest?.convergenceScore ?? 0;
});
```

No schema changes to localStorage are needed.

---

## Assets

- **Pot art**: inline SVG, no external assets (see `POTS` object in reference HTML).
- **Fonts**: Instrument Serif, Inter, JetBrains Mono — all via `@fontsource`.
- **Icons**: one inline gear SVG in the topbar. Use it as-is.
- **Emoji**: `🔥 ↔ 🤝 ✓ ·` — system emoji font. No asset files.

---

## Files in this bundle

- `design_reference/Main Page.html` — the full prototype. All colors, exact SVG markup, animation keyframes, and derivation logic live here. Open it in a browser to see the design live; inspect to extract anything not covered in this README.

Key code locations inside `Main Page.html`:
- **CSS tokens & keyframes**: `<style>` block, lines ~10–960
- **Pot SVGs**: `const POTS = { stovetop, lab, bubbling, jiggler }` — JS object literal
- **Mood derivation**: `function deriveMood()`
- **Vibe derivation**: `function deriveVibe()`
- **Sparkline rendering**: `function applyVibe()`
- **Emoji logic**: `function emojiForRound()`
- **Ambient effect composition**: inside `function renderPot()`

---

## Build order suggestion

1. Add fonts + Tailwind color tokens.
2. Port `PressureCookerViz.svelte` — the hardest piece, test with a manual slider before wiring real data.
3. Port `VibePanel.svelte` with the sparkline + verdict derivation.
4. Port `SessionDetailsTray.svelte` (mostly layout).
5. Compose into `Sidebar.svelte`.
6. Update `RoundTimeline` and `StreamingPanel` on the main side.
7. Wire everything to `session.svelte.ts` state.
8. Delete the old `ConfigPanel` embedding on the session page (move config to a separate pre-session view).

---

## Known gaps / things to decide

- **Pre-session state**: Not mocked. Likely shows a prominent empty pot + config form in place of streams.
- **Session complete state**: Not mocked. The `cooked` mood + halo + sparkles is a strong visual anchor for "done" — lean into it. Summary card slides in below the streams.
- **Mobile**: Out of scope. Either hide the sidebar behind a drawer or stack.
- **Accessibility**: The emoji chips need `aria-label`s (e.g. "Round 3, currently agreeing"). The sparkline needs a text alternative. The streaming caret should be decorative (`aria-hidden`).
- **Real top-up flow**: This handoff stops at the button. Wire to your chosen provider separately.
