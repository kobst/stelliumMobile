# Design System Strategy: Celestial Etherealism

## 1. Overview & Creative North Star
**Creative North Star: The Cosmic Curator**

This design system is not a utility; it is an atmosphere. It moves away from the "grid-of-boxes" aesthetic typical of mobile apps, leaning instead into a high-end, editorial experience that feels as though the user is peering through a high-powered telescope into a dreamscape. 

To achieve this, we break the "template" look through **Intentional Asymmetry**. Headers may be offset, and planetary motifs should break the container bounds, bleeding into the margins to suggest an infinite universe. We prioritize **Tonal Depth** over structural rigidity, using the hierarchy of cosmic purples and deep blacks to guide the eye rather than harsh lines or heavy borders.

---

## 2. Colors: The Celestial Palette
The palette is rooted in the "Deep Space" spectrum, utilizing rich, dark values to allow our "Stellar" accents to vibrate with life.

### Primary Tones (Cosmic & Nebula)
- **Primary (`#cabeff`):** A soft, lilac-tinted white. Use this for main interactive elements and high-priority text.
- **Secondary (`#e9c349`):** "Antique Gold." This is your "Divine" accent. Use it for celestial highlights, premium tiers, or significant planetary events.
- **Tertiary (`#00dce5`):** "Supernova Cyan." A neon highlight for active states and critical calls-to-action that need to "glow."

### Surface Hierarchy & The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts or tonal transitions.
- **Surface (`#13131b`):** The canvas. The deepest void of space.
- **Surface-Container-Low (`#1b1b23`):** Sub-sections or secondary content areas.
- **Surface-Container-Highest (`#34343d`):** Primary interactive cards or modals.

### The "Glass & Gradient" Rule
To evoke a sense of looking through a lens, use **Glassmorphism** for floating elements. 
- **Recipe:** Combine a semi-transparent `surface-container` (e.g., 60% opacity) with a `backdrop-filter: blur(20px)`.
- **Signature Textures:** Use a subtle linear gradient from `primary` to `primary_container` for hero buttons. This provides a "soul" to the UI that flat color cannot replicate.

---

## 3. Typography: Editorial Sophistication
We pair a traditional, high-contrast serif with a modern, geometric sans-serif to bridge the gap between ancient wisdom and modern data.

- **Display & Headlines (Newsreader):** This is our "Mystical" voice. The serif's varied stroke widths evoke ancient manuscripts. Use `display-lg` (3.5rem) with wide letter-spacing for landing moments to create an expansive, premium feel.
- **Body & Titles (Manrope):** Our "Modern" voice. A clean, highly legible sans-serif that ensures astrological data and horoscopes are effortless to digest. 
- **Hierarchy Note:** Never center-align body text. Use left-aligned "ragged right" layouts to maintain an editorial, sophisticated rhythm.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too heavy for a "light and airy" system. Instead, we use light-driven depth.

- **The Layering Principle:** Stack `surface-container` tiers. A `surface-container-highest` card should sit atop a `surface-container-low` background. This creates a "soft lift" that feels architectural.
- **Ambient Shadows:** For floating elements (like a moon-phase selector), use an extra-diffused shadow.
    - *Color:* A 6% opacity version of `primary` (the lilac tint). 
    - *Blur:* 24px–40px. This mimics a glow rather than a shadow.
- **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline_variant` at **15% opacity**. It should be felt, not seen.
- **Ethereal Gradients:** Apply a faint radial gradient (center-weighted) of `primary_container` behind important content to create a "halo" effect, drawing the user's focus naturally.

---

## 5. Components: Fluidity & Light

### Buttons
- **Primary:** A "Glow" button. Background is a gradient of `primary` to `on_primary_container`. Text is `on_primary`. 
- **Secondary:** Transparent background with a `Ghost Border`. Text in `secondary` (Gold).
- **Interactive States:** On hover/tap, the `backdrop-blur` of a glass button should increase, and the `tertiary` (Cyan) glow should intensify.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines. 
- **Implementation:** Separate list items using `1.5rem` of vertical whitespace (from the spacing scale) or a subtle shift from `surface-container-low` to `surface-container-lowest`. 
- **Shape:** Use `xl` (1.5rem) roundedness for large cards to soften the "tech" feel and make it feel organic.

### Input Fields
- **Styling:** Floating labels using `label-md`. The input container should be a `surface-container-high` with a subtle bottom-weighted gradient.
- **Error State:** Use `error` (`#ffb4ab`) text, but instead of a red box, use a soft red outer glow.

### Celestial Specialty Components
- **The "Orrery" Selector:** A circular dial for date/time selection, utilizing the `secondary` (Gold) for the "Sun" marker.
- **Constellation Chips:** Filter chips with no background, only a tiny `tertiary` star icon and `body-sm` text.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Negative Space:** Let the "Deep Space" (`surface`) breathe. Large margins are a hallmark of premium design.
- **Use "Stardust" Sparingly:** Subtle background textures (tiny 1px dots at 10% opacity) can add life, but don't let them interfere with text legibility.
- **Animate with Intent:** Transitions should be slow and "weightless" (e.g., 500ms ease-out) to mimic the movement of celestial bodies.

### Don't:
- **Don't Use Pure Black:** Stick to `surface` (`#13131b`) to ensure gradients don't "clip" or look muddy.
- **Don't Use Heavy Borders:** A 1px solid border is a failure of tonal design in this system.
- **Don't Overcrowd:** If a screen feels busy, remove an icon before you add a divider.
- **Don't Use Harsh Easing:** Avoid "bouncy" or "snappy" animations. This is a mystical experience, not a productivity tool.
