# AQUARIA — Brand Guidelines

**Studio:** AQUARIA — a studio for soft, glossy, slightly tired little worlds. Home of *Santa Beer* and *Cassette Jury*.

**Feeling:** glossy 3D claymation sea creatures + deadpan typed dialogue. Underwater, calm, quietly existential. Everything is wet on purpose.

---

## 1. Logo / Wordmark

- Set **AQUARIA** in Barrio, all caps, letter-spacing `.04em`.
- The 4th letter — the **R** — is **always coral (`#D9503E`)**. It is the only colored letter, ever.
- Clear space = the width of one "A" on every side.
- **Do:** set on shallow blue, paper cream, or abyss blue-gray.
- **Don't:** recolor the whole word, add gradients / outlines / shadows, slant or squeeze, or swap the typeface. It's clay, not rubber.

---

## 2. Color

| Token | Hex | Role |
|---|---|---|
| `--shallow` | `#A3D3DF` | Primary background — daytime water |
| `--shallow-lite` | `#BEE0E8` | Top-of-page gradient highlight |
| `--abyss` | `#617886` | Dark sections / night water |
| `--coral` | `#D9503E` | The single accent: the R, links, key marks |
| `--axolotl` | `#ECB4CD` | Soft secondary — highlights, accents |
| `--paper` | `#FFF9ED` | Cards, speech bubbles, the moon |
| `--squid` | `#878787` | Captions, dim bubbles, hairlines |
| `--ink` | `#16242B` | Body text |

**Rule:** water carries the page; **coral does the talking (use sparingly)**; cream is where words live; the rest stay quiet.

---

## 3. Typography

Two faces only.

- **Barrio** (Google Fonts, weight 400 only) — display. Names & titles, uppercase. Never body.
- **IBM Plex Mono** (400 / 500 / 600 + italic) — everything else: body, UI, nav, captions, hex codes, anything a creature says.

**Import:**

```html
<link href="https://fonts.googleapis.com/css2?family=Barrio&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
```

**Scale:**

| Role | Face | Spec |
|---|---|---|
| Eyebrow | IBM Plex Mono | 12px, `letter-spacing:.26em`, uppercase, coral |
| Section title (H2) | Barrio | `clamp(36px, 6vw, 68px)` |
| Body | IBM Plex Mono | 15px, line-height 1.5 |
| Caption | IBM Plex Mono | 12px, squid gray |

---

## 4. Voice & Tone

Deadpan, brief, quietly existential. Say small things that mean slightly more than they should.

- **Sounds like:** short (one breath, then stop); calm even when the news is strange; lowercase feelings, said out loud.
  - Sample lines: *"No."* · *"I'm going to be tired of water one day."* · *"It's fine. It's wet, but it's fine."*
- **Doesn't sound like:** exclamation marks or hype; corporate "synergy"; explaining why something is funny.

---

## 5. Mascots / The Cast

Glossy, blow-moulded, faintly melancholic 3D creatures. Soft studio light, one bright rim highlight, eyes set far apart and a little surprised. They float (slow vertical bob), never pose.

*(Names below are working placeholders — swap for your canon.)*

- **Otto** — red octopus, the realist. *"No."*
- **Mochi** — pink axolotl, the dreamer. *"I'm going to be tired of water one day."*
- **The Regulars** — red / blue / yellow fish trio, the chorus; always together, agree with whoever spoke last.

---

## 6. UI Components

### Speech bubble — the signature device
Every creature line lives in a bubble.

- **Paper variant:** `background:#FFF9ED; border:2px solid #16242B; padding:14px 20px; font:14px "IBM Plex Mono";`
- **Hand-drawn wobble corners:** `border-radius: 44px 48px 40px 50px / 50px 40px 48px 42px;`
- **Tail:** a 16px square, `border-right` + `border-bottom` 2px ink, `rotate(45deg)`, pinned bottom-left (~34px from left, -9px below).
- **Dim variant** (for abyss background): `background:#d4d4d2; border-color:#6a6a6a; color:#222;`

### The moon
One cream disc, top-right, always glowing — the single light source.

```css
background: radial-gradient(circle at 38% 34%, #fffdf6, #FFF9ED);
box-shadow: 0 0 46px 10px rgba(255,249,237,.55);
```

### Navigation
IBM Plex Mono, uppercase, wide tracking; ~62% opacity at rest, coral on hover.
Items: About / Santa Beer / Cassette Jury / More.

### Coral R mark
Coral may pick out a single letter elsewhere, sparingly.

---

## 7. Layout Principles

- Page reads like descending a tank: surface (with moon) at top, deeper as you scroll.
- **Spend boldness in one place:** only the *Voice* section goes to abyss blue-gray; everything else stays shallow blue. Don't change the background everywhere.
- Generous, left-aligned sections; mono eyebrow + Barrio title.
- **Quality floor:** responsive to mobile (hide nav + hero bubbles), visible keyboard focus, respect `prefers-reduced-motion` (kill the bob).
- **Motion budget:** letter-rise on the wordmark, slow bob on mascots, gentle hover-lift on cards / swatches. Nothing more.

---

## 8. CSS Tokens (drop-in)

```css
:root{
  --shallow:#A3D3DF; --shallow-lite:#BEE0E8; --abyss:#617886;
  --coral:#D9503E; --axolotl:#ECB4CD; --paper:#FFF9ED;
  --squid:#878787; --ink:#16242B;
  --font-display:"Barrio", system-ui, sans-serif;
  --font-mono:"IBM Plex Mono", ui-monospace, monospace;
}
body{
  background:var(--shallow);
  background-image:linear-gradient(180deg, var(--shallow-lite) 0%, var(--shallow) 38%);
  color:var(--ink);
  font-family:var(--font-mono);
}
```
