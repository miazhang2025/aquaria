# AQUARIA — Dev Plan

## Status: Planning complete. Not started.

---

## Tech Stack

- **Three.js** — WebGPU renderer + TSL shaders (underwater effects, caustics, water surface)
- **GSAP** — camera dive, UI transitions, character movement tweens, bob loops
- **Vanilla JS** — no framework; better Three.js scene control
- **Anthropic Claude API** — LLM for character dialogue (key TBD)
- **Vite** — dev server + bundler

---

## Project Structure

```
aquaria/
├── index.html
├── src/
│   ├── main.js
│   ├── scenes/
│   │   ├── EntryScene.js          # water surface + AQUARIA wordmark + enter button
│   │   ├── UnderwaterScene.js     # main scene
│   │   └── MenuOverlay.js         # dark fullscreen menu
│   ├── characters/
│   │   ├── Character.js           # base class: idle, talk, hit, hover states
│   │   ├── Octopus.js             # Otto — red, realist
│   │   └── Axolotl.js             # Mochi — pink, dreamer
│   ├── systems/
│   │   ├── ConversationSystem.js  # dialogue queue + LLM bridge
│   │   ├── BubbleSystem.js        # particle bubbles floating up
│   │   ├── CausticsSystem.js      # TSL caustic light shader
│   │   └── CameraController.js   # dive animation + scene camera
│   ├── ui/
│   │   ├── SpeechBubble.js        # CSS2DObject HTML overlay
│   │   ├── ChatInput.js           # input + submit, shows on character hover
│   │   └── Menu.js                # top-right trigger + dropdown
│   └── data/
│       ├── octopus.md             # Otto persona (PLACEHOLDER — swap when provided)
│       ├── axolotl.md             # Mochi persona (PLACEHOLDER — swap when provided)
│       └── dialogues.js           # default idle conversation lines
├── assets/
│   ├── models/                    # Otto.glb, Mochi.glb (PLACEHOLDER — swap when provided)
│   └── textures/                  # water normal maps, caustic maps
└── shaders/
    ├── waterSurface.js            # TSL water surface displacement + normals
    ├── caustics.js                # TSL animated Voronoi caustic light
    └── underwaterFog.js           # TSL volumetric depth fog
```

---

## Scene Flow

```
Landing (water surface)
  → AQUARIA wordmark, letter-rise animation
  → Moon top-right (cream disc, glow)
  → "Enter" button
  → [Click Enter]
  → GSAP camera dive through water surface
  → Bubble burst + shader crossfade to underwater
  → Underwater scene

Underwater (main, idle loop)
  → Otto + Mochi bob slowly (GSAP sine loop)
  → Auto-dialogue cycles through default lines (speech bubbles)
  → Otto randomly hits Mochi → GSAP knockback → return tween
  → [Hover character]
      → movement pauses
      → ChatInput fades in
      → [Submit] → LLM responds as that character
  → [Menu button, top-right]
      → Dark overlay fades in
      → Staggered menu items appear

Menu (dark overlay)
  → About           → closes menu, triggers studio intro conversation
  → Santa Beer      → closes menu, triggers project convo + link
  → Cassette Jury   → closes menu, triggers project convo + link
  → More            → closes menu, triggers future projects + contact convo
```

---

## Characters

### Otto — octopus
- Color: `--coral #D9503E`
- Voice: deadpan realist. *"No."* / *"It's fine. It's wet, but it's fine."*
- Behavior: initiates hits on Mochi randomly
- Placeholder mesh: red sphere body + 8 tapered cylinders (tentacles), procedural wiggle
- Final: GLTF swap via `Character.loadModel(url)`

### Mochi — axolotl
- Color: `--axolotl #ECB4CD`
- Voice: quiet dreamer. *"I'm going to be tired of water one day."* / *"Something moved. I'm sure of it."*
- Behavior: gets knocked back, returns
- Placeholder mesh: pink elongated box body + fin planes + 4 leg stubs
- Final: GLTF swap via `Character.loadModel(url)`

### Shared character traits
- Glossy blow-moulded look: `MeshPhysicalMaterial`, roughness ~0, clearcoat 1
- Soft studio light + one rim highlight
- Eyes far apart, slightly surprised
- Slow vertical bob — disabled when `prefers-reduced-motion`

---

## Visual Effects

| Effect | Approach |
|---|---|
| Water surface (entry) | TSL displacement + normal map, `--shallow-lite` tones |
| Underwater fog | TSL volumetric scattering, `--abyss #617886` |
| Caustic light | TSL animated Voronoi, `--shallow` blue-white |
| God rays | Three.js post-processing or TSL |
| Bubbles | `Points` particle system, GSAP float upward |
| Moon | Cream disc `#FFF9ED`, radial gradient + `rgba(255,249,237,.55)` bloom, top-right |
| Underwater color grade | Post-processing: blue-green tint, chromatic aberration |
| Dive transition | GSAP camera Y tween + underwater shader fade-in |

---

## UI Components

### Speech Bubble
```css
background: #FFF9ED;
border: 2px solid #16242B;
padding: 14px 20px;
font: 14px "IBM Plex Mono";
border-radius: 44px 48px 40px 50px / 50px 40px 48px 42px;
/* tail: 16px square, border-right + border-bottom 2px ink, rotate(45deg), bottom-left */
```
Dim variant (abyss bg): `background: #d4d4d2; border-color: #6a6a6a; color: #222`

### Navigation / Menu
- IBM Plex Mono, uppercase, `letter-spacing: .26em`
- 62% opacity at rest → `--coral` on hover
- Items: About / Santa Beer / Cassette Jury / More

### AQUARIA Wordmark
- Font: Barrio, all caps, `letter-spacing: .04em`
- 4th letter R always `--coral #D9503E`, never the whole word
- Entry animation: letter-rise (GSAP stagger)

---

## Color Tokens

```css
:root {
  --shallow:      #A3D3DF;   /* primary bg — daytime water */
  --shallow-lite: #BEE0E8;   /* top-of-page gradient highlight */
  --abyss:        #617886;   /* underwater / dark sections */
  --coral:        #D9503E;   /* accent: the R, links, hover — use sparingly */
  --axolotl:      #ECB4CD;   /* soft secondary — Mochi, highlights */
  --paper:        #FFF9ED;   /* speech bubbles, moon, cards */
  --squid:        #878787;   /* captions, dim UI, hairlines */
  --ink:          #16242B;   /* body text */
}
```

## Typography

```html
<link href="https://fonts.googleapis.com/css2?family=Barrio&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
```

| Role | Face | Spec |
|---|---|---|
| Wordmark / titles | Barrio | all caps, `letter-spacing: .04em` |
| Eyebrow | IBM Plex Mono | 12px, `letter-spacing: .26em`, uppercase, coral |
| Body / dialogue | IBM Plex Mono | 15px, line-height 1.5 |
| Caption | IBM Plex Mono | 12px, `--squid` |

---

## Scroll Camera System

Page is `overflow: hidden`, 100vh. Scroll wheel is captured and drives a normalized `scrollProgress` (0–1) via GSAP ticker with **water-drag lerp** (damping ~0.06) — all movement feels like moving through water, never snappy.

Camera follows a **CatmullRom spline** through 4 depth zones. On scroll-stop, camera gently self-returns to the nearest anchor point.

### Depth Zones

| Zone | Scroll % | Camera Behavior | Atmosphere |
|---|---|---|---|
| **The Membrane** | 0–15% | Hovers just below the surface, looking slightly upward — caustics dense overhead, light shafts, bubbles rising past lens | `--shallow-lite` tones, bright, god rays strong |
| **The Conversation Depth** | 15–55% | Default position — Otto + Mochi centered, gentle forward Z-drift as scroll deepens | `--shallow` → `--abyss` blend, caustics mid-strength |
| **The Drift** | 55–80% | Camera arcs lazily sideways (orbital), revealing a coral wall / kelp columns — characters stay visible but drift off-center | `--abyss` dominant, chromatic aberration increases slightly |
| **The Abyss Glance** | 80–100% | Camera tilts upward — sees water surface far above with moon glow, then auto-returns to Conversation Depth on scroll-stop | Near-full `--abyss`, bioluminescent particle hints, god rays just a ghost |

### Environmental Parallax Layers (scroll-driven)
- **Foreground**: bubble particles + small debris drift upward faster than camera descends
- **Mid-ground**: Otto + Mochi (main subject, moves 1:1 with camera)
- **Background layer 1**: kelp columns / coral silhouettes, 0.6x parallax rate
- **Background layer 2**: distant fish silhouettes + rock shapes, 0.3x parallax rate

### Implementation Notes
- `CameraController.js` owns the spline + lerp; exposes `setScrollProgress(t)`
- Scroll system is separate from the Enter dive animation — dive runs once on click, then scroll takes over
- `prefers-reduced-motion`: disable spline travel, camera locks at Conversation Depth

---

## Motion Budget

- Letter-rise on AQUARIA wordmark (entry only)
- Slow vertical bob on Otto + Mochi (GSAP sine loop)
- Gentle hover-lift on nav items
- Camera dive on Enter click (GSAP, one-shot)
- Scroll-driven camera spline (GSAP ticker lerp, ongoing)
- Bubble float upward (GSAP)
- `prefers-reduced-motion`: disable bob, dive, and scroll travel — instant cut, locked camera

---

## External Links

- Santa Beer: `https://miazhang2025.github.io/santabeer/`
- Cassette Jury: `https://cassettejury.farm/`

---

## Placeholders — Swap Before Launch

| Placeholder | What to provide |
|---|---|
| `assets/models/Otto.glb` | Final Otto (red octopus) GLTF |
| `assets/models/Mochi.glb` | Final Mochi (pink axolotl) GLTF |
| `data/octopus.md` | Otto character persona for LLM system prompt |
| `data/axolotl.md` | Mochi character persona for LLM system prompt |
| `ANTHROPIC_API_KEY` | Claude API key (env var) |
| Studio "About" copy | Bio text for About conversation |
