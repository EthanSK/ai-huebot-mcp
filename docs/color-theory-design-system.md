# AI HueBot Color Theory & UX Design System

A comprehensive design document for making AI HueBot a premium, tasteful ambient lighting experience.

---

## Table of Contents

1. [Color Theory for Ambient Lighting](#1-color-theory-for-ambient-lighting)
2. [Color Palette Principles](#2-color-palette-principles-what-separates-premium-from-gaudy)
3. [Vibe Categories & Organization](#3-vibe-categories--organization)
4. [Pre-Built Vibe Presets](#4-pre-built-vibe-presets)
5. [Adaptive Intelligence](#5-adaptive-intelligence)
6. [Implementation Guidance](#6-implementation-guidance)

---

## 1. Color Theory for Ambient Lighting

### 1.1 How Ambient Light Differs from Screen Color

Color on a screen and color emitted by a light bulb into a 3D space are fundamentally different experiences. Key differences that matter for HueBot:

- **Additive mixing in space**: When two lights of different colors illuminate the same wall, they blend additively. A deep blue and a warm amber aimed at the same surface create a desaturated lavender-grey, not a rich contrast. This means lights should generally illuminate *different surfaces* or be *spatially separated* to preserve palette integrity.
- **Perception shifts with brightness**: A #FF6B35 (bright orange) at 100% brightness reads as energetic and warm. The same hex at 15% brightness reads as a dim, cozy ember. Brightness is not just an intensity dial -- it changes the emotional character of a color.
- **Surrounding darkness matters**: Ambient lighting is defined as much by what is dark as what is lit. A single accent light at 30% in a dark room is more dramatic than five lights at 80%. Leaving some lights off or very dim is a legitimate design choice.
- **Surface color interaction**: Light reflects off walls, furniture, and ceilings. Warm whites look warmer on wood, cool blues look more clinical on white walls. The LLM cannot know room surfaces, but it can bias toward colors that are forgiving across materials (warm tones are generally more forgiving).

### 1.2 Color Harmony Models for Lighting

#### Analogous Palettes (Best for Cohesion)
Colors adjacent on the color wheel (within 30-60 degrees of each other). These create the most harmonious, professional-looking lighting.

**Why it works for ambient light**: The eye moves smoothly between similar hues. There is no jarring contrast. This is the default choice for "make my room look good."

Examples:
- Warm sunset: deep red -> coral -> amber -> golden yellow
- Cool ocean: deep teal -> aqua -> sky blue -> periwinkle
- Forest: deep green -> emerald -> lime -> warm yellow-green

#### Complementary Accents (Best for Drama)
Two colors opposite on the wheel, but used in *unequal proportions* -- one dominant, one accent.

**Critical rule**: Never use complementary colors at equal intensity/coverage. A 70/30 or 80/20 split looks intentional. A 50/50 split looks like a children's party.

Examples:
- Deep blue (dominant, 3-4 lights) + warm amber (accent, 1 light)
- Rich purple (dominant) + golden yellow (accent)
- Teal (dominant) + coral (accent)

#### Split-Complementary (Best for Sophistication)
One base color plus the two colors adjacent to its complement. Less tension than direct complementary, more interest than analogous.

Examples:
- Base: warm amber. Accents: blue-violet + teal
- Base: deep rose. Accents: teal + lime green

#### Monochromatic with Temperature Variation (Best for Elegance)
A single hue family at different saturations and brightnesses, mixed with warm or cool whites. This is the "interior designer" approach and is almost impossible to get wrong.

Examples:
- Various shades of amber (from nearly white-warm to deep burnt orange)
- Blues from pale ice to deep navy, anchored by a cool white

### 1.3 Color Temperature as a Primary Axis

Color temperature (measured in Kelvin, or mirek in the Hue API) is often more important than hue for ambient lighting. The Hue API supports `color_temperature.mirek` where:

| Mirek Value | Kelvin Equivalent | Character | Use Case |
|---|---|---|---|
| 153 | ~6535K | Cool daylight blue | Alertness, productivity, morning energy |
| 233 | ~4292K | Neutral white | Balanced, working, daytime |
| 333 | ~3003K | Warm white | Comfortable, standard evening |
| 400 | ~2500K | Warm amber | Cozy, relaxed, evening wind-down |
| 454 | ~2202K | Candle warm | Intimate, sleepy, very low energy |
| 500 | ~2000K | Deep warm | Extremely cozy, near-candlelight |

**Design principle**: When in doubt, use color temperature (warm whites and ambers) rather than saturated hues. Saturated colors are for intentional vibes. Warm whites are the "safe default" that always looks good.

### 1.4 Color Psychology for Lighting

#### Warm Colors (Reds, Oranges, Yellows)

| Color Family | Hex Range | Psychological Effect | Best For |
|---|---|---|---|
| Deep Red | #8B0000 - #CC0000 | Passion, intensity, warmth | Romance, drama, evening |
| Coral/Salmon | #FF6B6B - #FF8A80 | Friendly warmth, comfort | Social gatherings, cozy evening |
| Burnt Orange | #CC5500 - #E67300 | Earthy, grounding, autumnal | Relaxation, reading |
| Amber/Gold | #FFAA00 - #FFD700 | Optimism, warmth, luxury | Evening transition, dining |
| Warm Yellow | #FFE4B5 - #FFECD2 | Sunlight, gentle energy | Morning, gentle wake-up |

#### Cool Colors (Blues, Greens, Purples)

| Color Family | Hex Range | Psychological Effect | Best For |
|---|---|---|---|
| Deep Navy | #0D1B2A - #1B2838 | Calm depth, night sky | Late night, sleep prep |
| Royal Blue | #1E3A5F - #2E5090 | Focus, stability, trust | Deep work, productivity |
| Teal | #008080 - #20B2AA | Balance, refreshment | Morning focus, creative work |
| Aqua/Cyan | #00CED1 - #7FDBFF | Clarity, openness, modern | Clean energy, tech vibes |
| Forest Green | #1B4332 - #2D6A4F | Nature, tranquility, growth | Meditation, stress relief |
| Sage Green | #8FBC8F - #A8D5BA | Soothing, natural, organic | Background calm, all-day |
| Lavender | #9B8EC4 - #B8A9D4 | Gentle calm, creativity | Evening wind-down, creative |
| Deep Purple | #2D1B69 - #4A2C8A | Luxury, mystery, creativity | Cinema, evening drama |
| Magenta/Rose | #C71585 - #DB7093 | Playful energy, romance | Party, social, romance |

#### Neutral Tones (The Anchors)

| Color Family | Hex Range | Purpose |
|---|---|---|
| Cool White | #F0F8FF - #E8F4FD | Daylight simulation, clean energy |
| Neutral White | #FFF8F0 - #FFFAF5 | Balanced, natural feeling |
| Warm White | #FFE8CC - #FFECD2 | Comfortable, residential warmth |
| Candle White | #FFD9A0 - #FFE0B2 | Intimate, evening, cozy |
| Dim Amber | #FFB347 - #FFC87C | Low-energy warmth, night light |

---

## 2. Color Palette Principles: What Separates Premium from Gaudy

### 2.1 The Golden Rules

**Rule 1: Limit to 2-3 Color Families**
A room with red, green, blue, purple, and yellow lights looks like a disco. A room with deep amber, warm coral, and a single teal accent looks like a luxury hotel. Maximum 3 distinct hue families per vibe. Variations within a family (light coral + deep coral) count as one family.

**Rule 2: Vary Brightness, Not Just Hue**
The most common mistake is setting all lights to the same brightness. Professional lighting design uses *contrast* -- some lights bright, some dim, some off. A good vibe should have at least a 30-point brightness spread between the brightest and dimmest active lights.

Recommended brightness distribution for N lights:
- **Hero light** (1): 60-85% -- the main mood-setter
- **Supporting lights** (1-2): 30-55% -- fill and context
- **Accent light** (0-1): 15-35% -- subtle color pop or shadow
- **Off lights** (0-N): 0% -- intentional darkness adds drama

**Rule 3: Use Warm Whites as Anchors**
In a multi-light setup, having at least one light set to a warm white (#FFE8CC to #FFECD2) at moderate brightness grounds the entire palette. It acts as a visual "home base" that makes the colored lights feel intentional rather than random. Exception: fully monochromatic or theatrical vibes where white would break the mood.

**Rule 4: Desaturate for Sophistication**
Pure, fully saturated colors (#FF0000, #00FF00, #0000FF) look cheap and harsh in ambient lighting. Shift toward desaturated, muted, or "dusty" versions of colors. Compare:
- Gaudy red: #FF0000 -- harsh, alarming
- Tasteful red: #B34040 -- warm, inviting
- Gaudy blue: #0000FF -- cold, sterile, electric
- Tasteful blue: #2E5090 -- deep, calming, elegant
- Gaudy green: #00FF00 -- toxic, gamer aesthetic
- Tasteful green: #4A7C59 -- forest, natural, soothing

**Rule 5: Brightness Ceiling Depends on Vibe**
Not every vibe should allow 100% brightness. Cap brightness by mood:
- Energetic/morning: up to 100%
- Productive/daytime: up to 85%
- Social/evening: up to 65%
- Relaxation/wind-down: up to 45%
- Intimate/sleep: up to 25%
- Night light: up to 10%

**Rule 6: Color Temperature Consistency Within a Palette**
Do not mix extremely warm lights (2000K/amber) with extremely cool lights (6500K/daylight blue) unless it is a deliberate artistic choice. The temperature "gap" creates visual dissonance. Keep the spread within ~2000K for harmonious palettes. Exception: a single contrasting accent (e.g., one cool blue accent in a warm room) can work if done sparingly.

**Rule 7: Respect the Room's Purpose**
- Bedrooms: bias warm, bias dim, bias simple
- Living rooms: moderate palette, room for personality
- Offices: cool/neutral whites with optional accent
- Kitchens/bathrooms: clean whites, minimal color
- Entertainment spaces: wider palette range acceptable

### 2.2 Anti-Patterns to Avoid

| Anti-Pattern | Why It Looks Bad | Fix |
|---|---|---|
| Rainbow mode (5+ unrelated colors) | Chaotic, no visual hierarchy | Limit to 2-3 families |
| All lights same color + brightness | Flat, boring, no depth | Vary brightness by 30+ points |
| All fully saturated | Looks like a nightclub | Desaturate by mixing toward white/grey |
| All lights at 100% | Harsh, no atmosphere | Use 40-75% as typical max |
| Complementary at 50/50 | Clashing, tense | Use 70/30 or 80/20 ratio |
| Cool + warm at equal intensity | Confused, neither cozy nor crisp | Pick a temperature direction and commit |
| Pure white (#FFFFFF) | Clinical, flat | Use warm white (#FFE8CC) or cool white (#E8F4FD) |

---

## 3. Vibe Categories & Organization

### Category Taxonomy

```
vibes/
  productivity/
    - Deep Focus
    - Morning Energy
    - Clean Workspace
    - Creative Flow
    - Study Session
  relaxation/
    - Cozy Evening
    - Zen Garden
    - Cloud Nine
    - Sunday Morning
    - Warm Blanket
  nature/
    - Sunset Glow
    - Nordic Winter
    - Tropical Paradise
    - Forest Retreat
    - Ocean Depths
    - Desert Dusk
    - Aurora Borealis
    - Cherry Blossom
  entertainment/
    - Cinema Mode
    - Gaming Atmosphere
    - Music Lounge
    - Late Night Jazz
    - Vinyl Session
  social/
    - Dinner Party
    - Wine & Conversation
    - Cocktail Hour
    - Brunch Vibes
  romance/
    - Candlelight
    - Rose Petal
    - Midnight Velvet
    - Starlight
  seasonal/
    - Spring Awakening
    - Summer Golden Hour
    - Autumn Ember
    - Winter Hygge
    - Holiday Glow
  time-of-day/
    - Sunrise Wake
    - Bright Morning
    - Productive Afternoon
    - Golden Hour
    - Twilight Fade
    - Night Owl
    - Sleep Mode
```

---

## 4. Pre-Built Vibe Presets

Each preset below defines 5 colors (for a typical multi-light setup), a brightness range, and design rationale. When applying to a setup with fewer lights, use the first N colors in order. When applying to more lights, repeat colors from the palette with slight brightness variations.

The "Distribution" field specifies the role of each color slot:
- **Hero**: The dominant color, assigned to the most visible light
- **Support**: Secondary colors for fill
- **Accent**: A contrasting or complementary pop
- **Anchor**: A neutral warm/cool white that grounds the palette

---

### PRODUCTIVITY

#### Deep Focus
*Clear mind, sharp concentration. Cool-toned with enough warmth to avoid sterility.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #2E5090 | 55% | Muted royal blue -- calm focus |
| 2 | Support | #E8F4FD | 70% | Cool white -- clean light for reading |
| 3 | Support | #3A7CA5 | 40% | Steel blue -- depth |
| 4 | Accent | #1B3A4B | 25% | Dark teal -- subtle background |
| 5 | Anchor | #FFF8F0 | 60% | Neutral white -- visual rest |

Brightness ceiling: 75%
Temperature bias: Cool (3500-5000K)
Palette logic: Analogous blues with neutral white anchor. No warm tones to avoid drowsiness.

#### Morning Energy
*Gentle wake-up that transitions from warm to bright. Simulates natural sunrise progression.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFE4B5 | 75% | Warm pale gold -- morning sun |
| 2 | Support | #FFECD2 | 65% | Soft peach white -- gentle warmth |
| 3 | Support | #FFD9A0 | 55% | Light amber -- sunrise glow |
| 4 | Accent | #FF9E6D | 35% | Soft coral -- dawn sky edge |
| 5 | Anchor | #FFF8F0 | 80% | Near-white warm -- alertness |

Brightness ceiling: 85%
Temperature bias: Warm transitioning to neutral (2700-4000K)
Palette logic: Monochromatic warm progression. Gentle enough for just-woken eyes but bright enough to energize.

#### Clean Workspace
*Minimal, professional, distraction-free. Like a well-lit Scandinavian office.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #F5F0EB | 80% | Warm near-white -- primary task light |
| 2 | Support | #E8F4FD | 70% | Cool white -- screen-balanced fill |
| 3 | Support | #FFF5E6 | 65% | Cream white -- warmth without color |
| 4 | Anchor | #F0F0F0 | 55% | Neutral white -- background |
| 5 | Accent | #D4E4ED | 40% | Pale ice blue -- subtle modernity |

Brightness ceiling: 85%
Temperature bias: Neutral (3500-4500K)
Palette logic: Near-monochromatic whites with temperature variation. The ice blue accent adds just enough interest.

#### Creative Flow
*Slightly more expressive than Deep Focus. Allows the mind to wander productively.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #7B68AE | 50% | Dusty purple -- creative stimulation |
| 2 | Support | #4A7C9B | 45% | Muted teal-blue -- calm depth |
| 3 | Support | #9B8EC4 | 35% | Lavender -- gentle inspiration |
| 4 | Accent | #E8B87D | 40% | Warm tan -- grounding warmth |
| 5 | Anchor | #FFF5E6 | 55% | Cream white -- readability |

Brightness ceiling: 60%
Temperature bias: Cool with warm accent (mixed intentionally)
Palette logic: Split-complementary -- purple/blue base with warm accent. The cream anchor prevents it from feeling too moody.

#### Study Session
*Bright enough to read, warm enough to stay comfortable for hours.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFF8F0 | 85% | Neutral warm white -- task lighting |
| 2 | Support | #FFE8CC | 65% | Warm white -- comfortable fill |
| 3 | Support | #E8F4FD | 60% | Cool white -- alertness balance |
| 4 | Anchor | #FFF0DB | 50% | Soft cream -- ambient |
| 5 | Accent | #B8C9D9 | 30% | Pale blue-grey -- subtle focus cue |

Brightness ceiling: 90%
Temperature bias: Warm-neutral (3000-4500K)
Palette logic: Primarily warm white with a cool accent to maintain alertness without strain.

---

### RELAXATION

#### Cozy Evening
*The quintessential "come home and unwind" vibe. Warm, soft, enveloping.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFB347 | 45% | Warm amber -- fireplace glow |
| 2 | Support | #E8945A | 35% | Burnt sienna -- earthy depth |
| 3 | Support | #FFD9A0 | 40% | Light amber -- soft warmth |
| 4 | Accent | #CC7A3E | 20% | Deep copper -- rich undertone |
| 5 | Anchor | #FFE8CC | 50% | Warm white -- readable anchor |

Brightness ceiling: 55%
Temperature bias: Very warm (2200-2800K)
Palette logic: Monochromatic amber family. The brightness variation creates depth without introducing new hues.

#### Zen Garden
*Meditative calm. Muted, natural, deliberately minimal.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #8FBC8F | 35% | Sage green -- natural tranquility |
| 2 | Support | #A8D5BA | 25% | Soft mint -- gentle freshness |
| 3 | Support | #D4C5A9 | 30% | Sand/khaki -- earthy ground |
| 4 | Accent | #7A9E7E | 20% | Muted forest -- depth |
| 5 | Anchor | #FFF5E6 | 35% | Cream white -- soft visibility |

Brightness ceiling: 40%
Temperature bias: Warm-neutral (3000-3500K)
Palette logic: Analogous greens with an earth-tone anchor. Low brightness across the board creates meditative stillness.

#### Cloud Nine
*Floating, dreamy, soft. Like being wrapped in fog at golden hour.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #E8D5E0 | 40% | Pale mauve -- dreamy softness |
| 2 | Support | #F0E6D3 | 45% | Warm cream -- cloud warmth |
| 3 | Support | #D4C5D9 | 30% | Dusty lilac -- ethereal |
| 4 | Accent | #C9B8A8 | 25% | Warm taupe -- grounding |
| 5 | Anchor | #FFF0E8 | 35% | Peach white -- gentle glow |

Brightness ceiling: 50%
Temperature bias: Warm (2500-3200K)
Palette logic: Muted pastels with warm undertones. Everything desaturated toward white to create a "foggy" quality.

#### Sunday Morning
*Lazy, gentle, unhurried. Sunlight through curtains.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFE4B5 | 55% | Moccasin -- diffused sunlight |
| 2 | Support | #FFECD2 | 50% | Pale peach -- curtain-filtered light |
| 3 | Support | #FFF8DC | 60% | Cornsilk -- bright but soft |
| 4 | Accent | #E8C9A0 | 35% | Light caramel -- warmth |
| 5 | Anchor | #FFFFF0 | 45% | Ivory -- clean base |

Brightness ceiling: 65%
Temperature bias: Warm (2700-3200K)
Palette logic: Monochromatic warm whites/creams. Brighter than Cozy Evening but just as warm.

#### Warm Blanket
*Deep comfort. Like the light from a fireplace with one candle.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #CC7A3E | 30% | Deep amber -- ember glow |
| 2 | Support | #B35C2A | 20% | Burnt orange -- firelight |
| 3 | Support | #E8945A | 25% | Warm terracotta -- clay warmth |
| 4 | Accent | #8B4513 | 12% | Saddle brown -- deep shadow |
| 5 | Anchor | #FFD9A0 | 35% | Light amber -- faint visibility |

Brightness ceiling: 40%
Temperature bias: Very warm (2000-2500K)
Palette logic: Deep monochromatic amber-brown. Some of the lowest brightness values for maximum coziness. The near-dark accent light adds depth.

---

### NATURE-INSPIRED

#### Sunset Glow
*The 20 minutes before the sun disappears. Rich, gradient warmth with purple sky edges.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FF6B35 | 55% | Deep orange -- sun near horizon |
| 2 | Support | #FF8A65 | 45% | Coral -- sky warmth |
| 3 | Support | #FFB347 | 50% | Amber -- golden light |
| 4 | Accent | #8B4576 | 25% | Dusty plum -- twilight sky |
| 5 | Accent | #CC4455 | 35% | Muted crimson -- horizon line |

Brightness ceiling: 60%
Temperature bias: Warm with cool accent (2200-2800K base)
Palette logic: Analogous warm spectrum (orange-amber-coral) with a split-complementary purple accent representing the sky above.

#### Nordic Winter
*Clean, icy, contemplative. The blue hour in Scandinavia with warm cabin light.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #B8D4E3 | 45% | Ice blue -- winter sky |
| 2 | Support | #8BA8C4 | 35% | Steel blue -- cold depth |
| 3 | Support | #D4DFE8 | 40% | Pale blue-grey -- frost |
| 4 | Accent | #FFD9A0 | 30% | Warm amber -- cabin window |
| 5 | Anchor | #E8EDF2 | 50% | Cool near-white -- snow light |

Brightness ceiling: 55%
Temperature bias: Cool with warm accent (4500-6000K base, 2500K accent)
Palette logic: Analogous cool blues with a single warm amber accent. The temperature contrast is deliberate -- cold outside, warm hearth -- and the 80/20 ratio keeps it cohesive.

#### Tropical Paradise
*Lush, vibrant, but not garish. Think resort at dusk, not neon bar.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #20A68B | 50% | Tropical teal -- ocean water |
| 2 | Support | #4DB89E | 40% | Soft sea green -- lagoon |
| 3 | Support | #FF8A65 | 35% | Coral -- sunset on water |
| 4 | Accent | #E8C94A | 30% | Warm gold -- late sun |
| 5 | Anchor | #FFE8CC | 45% | Warm white -- sand |

Brightness ceiling: 55%
Temperature bias: Mixed (teal dominant, warm accents)
Palette logic: Split-complementary -- teal base with coral and gold accents. The warm white anchor prevents the teals from feeling cold.

#### Forest Retreat
*Deep in the woods. Dappled light through canopy. Moss and bark.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #2D6A4F | 40% | Forest green -- canopy |
| 2 | Support | #4A7C59 | 30% | Moss green -- mid-story |
| 3 | Support | #6B8F71 | 35% | Sage -- filtered light |
| 4 | Accent | #C9A96E | 25% | Warm khaki -- bark/sunbeam |
| 5 | Anchor | #E8DCC8 | 30% | Parchment -- forest floor light |

Brightness ceiling: 45%
Temperature bias: Warm-neutral (3000-3500K)
Palette logic: Monochromatic greens with warm earth accent. Deliberately dim to simulate filtered forest light.

#### Ocean Depths
*Mysterious, immersive, deep. Bioluminescent undertones.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #0D3B66 | 35% | Deep ocean blue -- the abyss |
| 2 | Support | #1B5E7B | 30% | Dark teal -- mid-water |
| 3 | Support | #14406A | 25% | Navy -- depth |
| 4 | Accent | #00BCD4 | 15% | Cyan -- bioluminescence |
| 5 | Accent | #4ECDC4 | 10% | Aqua -- distant glow |

Brightness ceiling: 40%
Temperature bias: Cool (5000-6500K)
Palette logic: Deep analogous blues with cyan/aqua accents at very low brightness to simulate bioluminescent creatures. The low accent brightness is critical -- they should barely register.

#### Desert Dusk
*Vast, warm, serene. The palette of sandstone at magic hour.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #D4956A | 50% | Terracotta -- sandstone |
| 2 | Support | #E8B87D | 45% | Warm sand -- desert floor |
| 3 | Support | #C27C4E | 35% | Clay -- deep earth |
| 4 | Accent | #6B4C6E | 20% | Dusty purple -- desert twilight sky |
| 5 | Anchor | #FFD9A0 | 40% | Light amber -- fading sun |

Brightness ceiling: 55%
Temperature bias: Very warm with cool accent (2200-2800K base)
Palette logic: Analogous earth tones with a muted purple sky accent. Similar structure to Sunset Glow but shifted toward earth rather than sky.

#### Aurora Borealis
*Ethereal, shifting, magical. The one vibe where more color is acceptable.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #00C9A7 | 40% | Bright teal-green -- aurora core |
| 2 | Support | #4A90D9 | 35% | Medium blue -- sky |
| 3 | Support | #6ECB8A | 30% | Soft green -- aurora edge |
| 4 | Accent | #845EC2 | 25% | Medium purple -- aurora peak |
| 5 | Accent | #008F7A | 20% | Deep teal -- aurora base |

Brightness ceiling: 45%
Temperature bias: Cool (5000-6000K)
Palette logic: This is the exception that proves the rule -- 4 color families (teal, green, blue, purple) work because they are analogous on the cool side of the spectrum and kept at moderate-to-low brightness. The palette would fail if any light were above 50%.

#### Cherry Blossom
*Delicate, springlike, romantic without being heavy. Japanese garden at twilight.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #E8A0BF | 40% | Soft pink -- blossom |
| 2 | Support | #F0C9D8 | 35% | Pale rose -- petal |
| 3 | Support | #D4849A | 30% | Dusty mauve -- branch shadow |
| 4 | Accent | #8FBC8F | 20% | Sage green -- leaves |
| 5 | Anchor | #FFF5F0 | 45% | Pink-white -- spring light |

Brightness ceiling: 50%
Temperature bias: Warm-neutral (3000-3500K)
Palette logic: Monochromatic pinks with a single green accent (complementary at low intensity). The pink-white anchor is tinted to maintain cohesion.

---

### ENTERTAINMENT

#### Cinema Mode
*Dark, focused on the screen. Minimal ambient light that does not compete with the display.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #1A1A2E | 10% | Very dark navy -- bias lighting |
| 2 | Support | #16213E | 8% | Dark blue -- screen surround |
| 3 | Support | #0F3460 | 6% | Deep blue -- subtle fill |
| 4 | Accent | #E94560 | 5% | Dark rose -- cinema accent |
| 5 | Off | #000000 | 0% | Off -- intentional darkness |

Brightness ceiling: 15%
Temperature bias: Cool (5000K+)
Palette logic: Near-darkness with deep cool tones. The key insight is that cinema lighting should be almost imperceptible -- it is there to reduce eye strain from screen contrast, not to create atmosphere. The rose accent at 5% is barely visible.

#### Gaming Atmosphere
*More saturated than most vibes but still tasteful. RGB done right.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #6C3CE0 | 45% | Electric purple -- energy |
| 2 | Support | #2E5090 | 35% | Deep blue -- depth |
| 3 | Support | #4A1E8F | 30% | Dark violet -- immersion |
| 4 | Accent | #00BCD4 | 25% | Cyan -- tech highlight |
| 5 | Anchor | #1A1A2E | 10% | Near-black navy -- shadow |

Brightness ceiling: 50%
Temperature bias: Cool (5000-6500K)
Palette logic: Analogous purple-blue with a cyan accent. This is "RGB culture" elevated -- the colors are in the same family rather than random, and the near-black anchor adds depth. Notably more saturated than other vibes, which is appropriate for the context.

#### Music Lounge
*Warm, low, sophisticated. A dimly lit bar with good acoustics.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #CC7A3E | 35% | Deep amber -- warm spotlight |
| 2 | Support | #8B5E3C | 25% | Dark wood brown -- bar tones |
| 3 | Support | #B35C2A | 20% | Burnt sienna -- leather |
| 4 | Accent | #2D1B69 | 15% | Deep purple -- mood |
| 5 | Anchor | #FFD9A0 | 30% | Light amber -- gentle visibility |

Brightness ceiling: 40%
Temperature bias: Very warm with cool accent (2200-2800K base)
Palette logic: Warm earth tones with a single deep purple accent. The brown tones are unusual in lighting but create a "leather and wood" feeling when cast on warm surfaces.

#### Late Night Jazz
*Smoky, moody, blue-noted. The 2 AM set at a downtown club.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #1B3A5C | 30% | Smoky blue -- jazz blue |
| 2 | Support | #2E4A6E | 25% | Medium steel blue -- depth |
| 3 | Support | #3D5A80 | 20% | Dusty blue -- smoke |
| 4 | Accent | #E8945A | 20% | Warm amber -- single warm spotlight |
| 5 | Accent | #1A1A2E | 10% | Dark navy -- shadow |

Brightness ceiling: 35%
Temperature bias: Cool with warm accent (4500-5500K base, 2500K accent)
Palette logic: Analogous blues at low brightness with a warm amber accent representing the single warm lamp over the piano. Very similar to Nordic Winter in structure but darker and moodier.

#### Vinyl Session
*Analog warmth. The golden era of hi-fi. Rich, warm, slightly retro.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #E8945A | 45% | Warm copper -- tube amplifier glow |
| 2 | Support | #D4875A | 35% | Terracotta -- vintage warmth |
| 3 | Support | #FFB870 | 40% | Soft orange -- warm fill |
| 4 | Accent | #8B6F4E | 25% | Warm brown -- wood cabinet |
| 5 | Anchor | #FFE0B2 | 50% | Pale amber -- visibility |

Brightness ceiling: 55%
Temperature bias: Very warm (2200-2700K)
Palette logic: Monochromatic warm orange-brown. Like Cozy Evening but shifted toward copper/terracotta rather than pure amber.

---

### SOCIAL

#### Dinner Party
*Warm, flattering, conversational. Makes food and faces look good.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFD9A0 | 55% | Warm gold -- candlelight equivalent |
| 2 | Support | #FFE8CC | 50% | Warm white -- table area |
| 3 | Support | #E8B87D | 40% | Soft caramel -- ambient fill |
| 4 | Accent | #CC8855 | 30% | Warm copper -- depth |
| 5 | Anchor | #FFF5E6 | 45% | Cream -- soft general light |

Brightness ceiling: 60%
Temperature bias: Warm (2500-3000K)
Palette logic: Monochromatic warm. This is deliberately "boring" in the best way -- the warm spectrum makes skin tones look healthy and food look appetizing. No blue, no purple, no green.

#### Cocktail Hour
*Slightly more glamorous than Dinner Party. A touch of jewel-tone sophistication.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #E8B87D | 50% | Warm gold -- champagne |
| 2 | Support | #FFD9A0 | 45% | Light amber -- warm base |
| 3 | Support | #D4956A | 35% | Rose gold -- glamour |
| 4 | Accent | #7B68AE | 20% | Dusty purple -- evening elegance |
| 5 | Anchor | #FFE8CC | 55% | Warm white -- flattering light |

Brightness ceiling: 60%
Temperature bias: Warm with cool accent (2700-3200K base)
Palette logic: Warm golds with a purple accent. The purple at low brightness adds a "special occasion" quality without dominating.

#### Brunch Vibes
*Bright, fresh, cheerful. Weekend energy.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFF8DC | 75% | Bright warm white -- morning sunshine |
| 2 | Support | #FFE4B5 | 65% | Moccasin -- gentle gold |
| 3 | Support | #FFECD2 | 60% | Pale peach -- warmth |
| 4 | Accent | #A8D5BA | 40% | Soft mint green -- fresh |
| 5 | Anchor | #FFFFF0 | 70% | Ivory -- clean base |

Brightness ceiling: 80%
Temperature bias: Warm-neutral (3000-4000K)
Palette logic: Bright warm whites with a mint accent. The mint at lower brightness adds freshness without competing with the dominant warm tones.

---

### ROMANCE

#### Candlelight
*Intimate, warm, flickering quality suggested by very low brightness. Simple and timeless.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFB347 | 25% | Amber -- true candle color |
| 2 | Support | #E8945A | 18% | Warm copper -- candle shadow |
| 3 | Support | #FFD9A0 | 20% | Light amber -- reflected glow |
| 4 | Accent | #CC7A3E | 12% | Deep amber -- distant candle |
| 5 | Off | #000000 | 0% | Off -- darkness is essential |

Brightness ceiling: 30%
Temperature bias: Very warm (2000-2400K)
Palette logic: Monochromatic amber at very low brightness with one light off. The absence of one light is deliberate -- real candlelight does not illuminate everywhere.

#### Rose Petal
*Romantic but not cliche. Sophisticated pink-warmth rather than Barbie pink.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #C97B84 | 30% | Dusty rose -- sophisticated pink |
| 2 | Support | #D4849A | 25% | Muted mauve -- depth |
| 3 | Support | #E8A0BF | 20% | Soft pink -- warmth |
| 4 | Accent | #FFD9A0 | 25% | Warm amber -- warmth anchor |
| 5 | Anchor | #FFE8E0 | 30% | Pink-white -- glow |

Brightness ceiling: 35%
Temperature bias: Warm (2500-3000K)
Palette logic: Desaturated pinks (not #FF69B4!) with a warm amber anchor. The key is that every pink is pushed toward mauve/dusty rose territory.

#### Midnight Velvet
*Rich, luxurious darkness. Deep jewel tones at barely-there brightness.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #2D1B69 | 20% | Deep purple -- velvet |
| 2 | Support | #1B2838 | 15% | Dark blue-grey -- night |
| 3 | Support | #4A2C6E | 12% | Plum -- depth |
| 4 | Accent | #B34040 | 10% | Muted deep red -- warmth |
| 5 | Off | #000000 | 0% | Off -- embracing darkness |

Brightness ceiling: 25%
Temperature bias: Cool with warm accent
Palette logic: Deep jewel tones at extremely low brightness. The deep red accent prevents the purple from feeling cold. One light off.

#### Starlight
*Ethereal, celestial, gently romantic. Cooler than Candlelight but equally intimate.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #B8C9E0 | 25% | Pale blue -- moonlight |
| 2 | Support | #9BB0C9 | 20% | Soft steel blue -- sky |
| 3 | Support | #C9D4E0 | 22% | Ice blue-grey -- starlight |
| 4 | Accent | #FFE8CC | 15% | Warm white -- single warm star |
| 5 | Accent | #8BA0B8 | 10% | Muted blue -- distant light |

Brightness ceiling: 30%
Temperature bias: Cool with warm accent (5000-6000K base)
Palette logic: Analogous cool blue-greys with a single warm white accent. The contrast between the cool palette and the warm point creates a "moonlight with one candle" effect.

---

### SEASONAL

#### Spring Awakening
*Fresh, bright, optimistic. New growth and clear skies.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #A8D5BA | 55% | Soft green -- new leaves |
| 2 | Support | #C9E4CA | 50% | Pale mint -- freshness |
| 3 | Support | #FFE4B5 | 45% | Warm cream -- spring sun |
| 4 | Accent | #F0C9D8 | 30% | Pale pink -- blossom |
| 5 | Anchor | #FFF8F0 | 60% | Warm white -- daylight |

Brightness ceiling: 65%
Temperature bias: Warm-neutral (3200-4200K)
Palette logic: Soft green-mint base with pink blossom accent and warm white anchor. All heavily desaturated to feel "fresh" rather than "colorful."

#### Summer Golden Hour
*That perfect warm light 30 minutes before sunset on a July evening.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFB347 | 60% | Rich amber -- golden hour sun |
| 2 | Support | #FFD080 | 55% | Light gold -- warm fill |
| 3 | Support | #FF9E6D | 45% | Peach-orange -- sky reflection |
| 4 | Accent | #E8C94A | 40% | Yellow-gold -- sunbeam |
| 5 | Anchor | #FFF0DB | 50% | Warm cream -- ambient |

Brightness ceiling: 65%
Temperature bias: Very warm (2200-2800K)
Palette logic: Monochromatic warm amber-gold with slight orange variation. Brighter overall than most vibes because golden hour is still daylight.

#### Autumn Ember
*Rich, earthy, contemplative. The warmth of falling leaves and wood fires.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #B35C2A | 40% | Burnt orange -- autumn leaf |
| 2 | Support | #CC7A3E | 35% | Copper -- warmth |
| 3 | Support | #8B4513 | 25% | Saddle brown -- earth |
| 4 | Accent | #A0522D | 20% | Sienna -- depth |
| 5 | Anchor | #FFD9A0 | 40% | Light amber -- fire glow |

Brightness ceiling: 45%
Temperature bias: Very warm (2000-2700K)
Palette logic: Deep warm earth tones. Darker and more saturated than Cozy Evening, with brown tones that Cozy Evening avoids.

#### Winter Hygge
*The Danish concept of cozy contentment. Warm, low, candle-centric with cool window light.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFB870 | 35% | Soft amber -- many candles |
| 2 | Support | #FFD9A0 | 30% | Light amber -- warm fill |
| 3 | Support | #E8A060 | 25% | Warm orange -- hearth |
| 4 | Accent | #B8C9D9 | 15% | Pale blue-grey -- winter window |
| 5 | Anchor | #FFE0B2 | 40% | Pale amber -- general warmth |

Brightness ceiling: 45%
Temperature bias: Very warm with cool accent (2200-2700K base)
Palette logic: Very similar to Nordic Winter but inverted -- warm is dominant with cool as accent (Nordic Winter is cool-dominant with warm accent). The pale blue-grey at 15% simulates cold light from outside.

#### Holiday Glow
*Festive but tasteful. Not a Christmas light explosion -- more like a decorated fireplace mantel.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFD9A0 | 50% | Warm gold -- fairy lights |
| 2 | Support | #B34040 | 30% | Muted deep red -- berry/ribbon |
| 3 | Support | #FFE8CC | 45% | Warm white -- general warmth |
| 4 | Accent | #2D6A4F | 20% | Deep forest green -- evergreen |
| 5 | Anchor | #FFB870 | 40% | Soft amber -- firelight |

Brightness ceiling: 55%
Temperature bias: Warm (2500-3000K)
Palette logic: Warm gold dominant with red and green accents at very different brightnesses. The trick to "tasteful holiday" is that gold/amber does 70% of the work, and the red and green are supporting actors at low intensity.

---

### TIME OF DAY

#### Sunrise Wake
*Gradual warm light designed to feel like dawn breaking. Minimal color, maximum gentleness.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFE0B2 | 30% | Pale amber -- first light |
| 2 | Support | #FFECD2 | 25% | Soft peach -- dawn |
| 3 | Support | #FFD9A0 | 20% | Light amber -- horizon |
| 4 | Off | #000000 | 0% | Off -- it's still mostly dark |
| 5 | Off | #000000 | 0% | Off -- gradual, not all at once |

Brightness ceiling: 35%
Temperature bias: Very warm (2200-2700K)
Palette logic: Only 3 lights active at low brightness. This simulates the first moments of dawn where light barely exists. Designed to be used before Morning Energy.

#### Bright Morning
*Full morning energy. Clean, bright, ready for the day.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFF8F0 | 90% | Near-white warm -- full daylight |
| 2 | Support | #F0F8FF | 85% | Cool white -- alertness |
| 3 | Support | #FFE8CC | 70% | Warm white -- comfort |
| 4 | Anchor | #F5F0EB | 75% | Neutral white -- balance |
| 5 | Accent | #E8F4FD | 65% | Pale blue -- morning sky |

Brightness ceiling: 95%
Temperature bias: Neutral-cool (3500-5000K)
Palette logic: Near-white across the board with slight temperature variation. This is the "most light" preset -- designed for when you need maximum visibility and energy.

#### Productive Afternoon
*Sustained focus without eye fatigue. Balanced temperature, moderate brightness.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFF8F0 | 75% | Neutral white -- primary task |
| 2 | Support | #FFE8CC | 60% | Warm white -- comfort |
| 3 | Support | #E8F4FD | 65% | Cool white -- alertness |
| 4 | Anchor | #F5F0EB | 55% | Neutral -- fill |
| 5 | Accent | #D4E4ED | 40% | Pale blue -- focus |

Brightness ceiling: 80%
Temperature bias: Neutral (3500-4500K)
Palette logic: Balanced whites -- neither fully warm nor fully cool. The slight blue accent maintains alertness during the afternoon slump.

#### Golden Hour
*The transition moment. Day fading into evening. Perfect for winding down from work.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFB870 | 55% | Soft gold -- late sun |
| 2 | Support | #FFD9A0 | 50% | Light amber -- warm fill |
| 3 | Support | #FFECD2 | 45% | Peach cream -- fading light |
| 4 | Accent | #E88D5A | 30% | Warm orange -- sun streak |
| 5 | Anchor | #FFE8CC | 55% | Warm white -- anchor |

Brightness ceiling: 60%
Temperature bias: Warm (2500-3200K)
Palette logic: Transitional warm palette. Brighter and cleaner than evening presets, warmer and softer than afternoon presets. The pivot point of the day.

#### Twilight Fade
*The blue hour after sunset. Cool overtaking warm.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #6B85A5 | 35% | Dusty blue -- twilight sky |
| 2 | Support | #8BA0B8 | 30% | Pale steel blue -- fading light |
| 3 | Support | #5A7A96 | 25% | Medium blue -- deepening sky |
| 4 | Accent | #FFB870 | 20% | Soft amber -- last warm light |
| 5 | Anchor | #C9D4E0 | 30% | Light blue-grey -- ambient |

Brightness ceiling: 40%
Temperature bias: Cool with warm accent (4500-5500K base)
Palette logic: Analogous cool blues with fading warm accent. The amber at only 20% signals the last of daylight. An inversion of Golden Hour.

#### Night Owl
*For the late-night productive hours. Dark enough to feel nocturnal, bright enough to work.*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FFD9A0 | 40% | Warm amber -- desk lamp |
| 2 | Support | #1B2838 | 15% | Dark blue-grey -- night |
| 3 | Support | #FFE0B2 | 35% | Pale amber -- secondary light |
| 4 | Accent | #2E4A6E | 10% | Steel blue -- screen reflection |
| 5 | Off | #000000 | 0% | Off -- late night darkness |

Brightness ceiling: 45%
Temperature bias: Very warm primary, cool accent (2200K primary, 5000K accent)
Palette logic: Warm amber as the working light with dark blue ambiance simulating the late-night environment. One light off to maintain the feeling that most of the world is asleep.

#### Sleep Mode
*The last vibe before bed. Absolute minimum light. Melatonin-friendly (no blue).*

| Slot | Role | Hex | Brightness | Description |
|---|---|---|---|---|
| 1 | Hero | #FF8C42 | 8% | Deep warm orange -- night light |
| 2 | Support | #FFB347 | 5% | Amber -- barely visible |
| 3 | Off | #000000 | 0% | Off |
| 4 | Off | #000000 | 0% | Off |
| 5 | Off | #000000 | 0% | Off |

Brightness ceiling: 10%
Temperature bias: Very warm (2000K, absolutely no blue wavelengths)
Palette logic: Only 2 lights active at near-minimum brightness. Deep orange/amber only -- research consistently shows blue wavelengths suppress melatonin production. This preset deliberately avoids any blue, purple, or cool white.

---

## 5. Adaptive Intelligence

### 5.1 Time-of-Day Awareness

The LLM should factor in the current time when suggesting vibes or when the user gives an ambiguous request like "set a nice vibe."

| Time Window | Default Bias | Rationale |
|---|---|---|
| 05:00-07:00 | Sunrise Wake -> Morning Energy | Gentle warm start, increasing brightness |
| 07:00-09:00 | Bright Morning | Full alertness, maximum useful light |
| 09:00-12:00 | Clean Workspace / Deep Focus | Productivity-oriented, cool-neutral |
| 12:00-14:00 | Productive Afternoon | Sustained focus, balanced temperature |
| 14:00-17:00 | Creative Flow / Study Session | Slight warmth creep, maintaining focus |
| 17:00-19:00 | Golden Hour | Transition to evening warmth |
| 19:00-21:00 | Cozy Evening / Dinner Party | Warm, social, moderate brightness |
| 21:00-23:00 | Late Night Jazz / Warm Blanket | Low, warm, winding down |
| 23:00-01:00 | Night Owl / Candlelight | Very low, very warm |
| 01:00-05:00 | Sleep Mode | Minimum light, no blue |

### 5.2 Activity-Based Suggestions

When the user mentions an activity, the LLM should map it to the appropriate vibe category:

| Activity Keywords | Suggested Vibes | Key Principle |
|---|---|---|
| "working", "coding", "writing" | Deep Focus, Clean Workspace | Cool-neutral, moderate-high brightness |
| "reading", "studying" | Study Session, Deep Focus | Warm white primary, sufficient brightness |
| "watching a movie", "TV" | Cinema Mode | Near-darkness, no competition with screen |
| "gaming" | Gaming Atmosphere | Cool purples/blues, moderate brightness |
| "cooking", "dinner" | Dinner Party, Warm White | Warm, food-flattering, sufficient visibility |
| "having people over", "party" | Cocktail Hour, Music Lounge | Social warmth with personality |
| "relaxing", "chilling" | Cozy Evening, Cloud Nine | Warm, low, enveloping |
| "meditating", "yoga" | Zen Garden | Minimal, muted, very low |
| "going to sleep", "bedtime" | Sleep Mode, Candlelight | Absolute minimum, no blue |
| "waking up" | Sunrise Wake, Morning Energy | Gradual warm to bright |
| "date night" | Rose Petal, Candlelight, Starlight | Low, warm, intimate |
| "music", "listening" | Vinyl Session, Late Night Jazz | Warm, low, atmospheric |

### 5.3 Seasonal Awareness

The LLM should subtly bias suggestions based on the time of year:

| Season (Northern Hemisphere) | Temperature Bias | Brightness Bias | Palette Bias |
|---|---|---|---|
| Dec-Feb (Winter) | Warmer (+200 mirek) | Lower (-10%) | Amber, copper, with cool accents |
| Mar-May (Spring) | Neutral | Moderate | Greens, pinks, fresh tones |
| Jun-Aug (Summer) | Can go cooler | Higher (+10%) | Golds, teals, warm brights |
| Sep-Nov (Autumn) | Warmer (+100 mirek) | Lower (-5%) | Earth tones, burnt orange, deep warm |

### 5.4 Weather Integration (Future Enhancement)

If weather data becomes available:

| Weather | Lighting Adjustment | Rationale |
|---|---|---|
| Overcast/rainy | Warmer, slightly brighter | Compensate for grey daylight |
| Sunny | Can be cooler/lower | Natural light is abundant |
| Snowy | Warm with ice-blue accent | Complement the cool outdoor light |
| Hot/humid | Cooler tones, moderate brightness | Psychological cooling |
| Thunderstorm | Deep warm amber, very low | Cozy refuge feeling |

### 5.5 Progressive Transitions

Rather than switching vibes abruptly, the LLM should suggest transitional paths:

**Evening Wind-Down Sequence** (suggest over 3 hours):
1. Golden Hour (6:30 PM)
2. Cozy Evening (8:00 PM)
3. Warm Blanket (9:30 PM)
4. Candlelight (10:30 PM)
5. Sleep Mode (11:30 PM)

**Morning Rise Sequence** (suggest over 1 hour):
1. Sleep Mode -> Sunrise Wake (6:00 AM)
2. Sunrise Wake -> Morning Energy (6:20 AM)
3. Morning Energy -> Bright Morning (6:40 AM)
4. Bright Morning -> Clean Workspace (7:00 AM)

### 5.6 Smart Responses to Vague Requests

When the user says something ambiguous, the LLM should use context clues:

- **"Set a vibe"** -> Check time of day, suggest the corresponding time-of-day preset
- **"Make it nice"** -> Cozy Evening (evening), Sunday Morning (morning), Clean Workspace (midday)
- **"Something different"** -> Suggest a nature-inspired preset that contrasts with current state
- **"Warmer"** -> Shift current palette toward amber, increase mirek, reduce brightness by 10%
- **"Cooler"** -> Shift toward blue, decrease mirek, optionally increase brightness by 5%
- **"Brighter"** -> Increase all active lights by 15-20%, maintain color ratios
- **"Dimmer"** -> Decrease all active lights by 15-20%, maintain color ratios
- **"More colorful"** -> Add one accent color from the complementary range
- **"Less colorful"** -> Replace saturated lights with warm whites, keep one accent
- **"Cozier"** -> Reduce brightness by 20%, shift toward amber, turn off 1 light

---

## 6. Implementation Guidance

### 6.1 Data Model for Presets

Each preset should be stored as a structure compatible with the existing `SavedVibe` type, extended with metadata:

```typescript
interface VibePreset {
  name: string;                    // Display name: "Deep Focus"
  slug: string;                    // URL-safe: "deep-focus"
  description: string;             // One-line description
  category: VibeCategory;         // "productivity" | "relaxation" | etc.
  tags: string[];                  // ["focus", "work", "cool", "blue"]

  brightness_ceiling: number;      // Max brightness for this vibe (0-100)
  temperature_bias: "warm" | "cool" | "neutral" | "mixed";

  palette: VibePaletteSlot[];     // Ordered list of color slots
}

interface VibePaletteSlot {
  role: "hero" | "support" | "accent" | "anchor" | "off";
  hex: string;                     // e.g. "#2E5090"
  brightness: number;              // 0-100
  description: string;             // "Muted royal blue -- calm focus"
}

type VibeCategory =
  | "productivity"
  | "relaxation"
  | "nature"
  | "entertainment"
  | "social"
  | "romance"
  | "seasonal"
  | "time-of-day";
```

### 6.2 Light Assignment Algorithm

When applying a preset with N palette slots to a room with M lights:

**If M <= N**: Assign the first M slots in order. Prioritize hero -> support -> accent -> anchor -> off.

**If M > N**:
1. Assign all N slots to the first N lights
2. For remaining lights, cycle through support and anchor roles with slight brightness variation (plus or minus 5%)
3. Never duplicate the hero -- there should be exactly one

**Light naming heuristic**: If light names contain position hints (e.g., "Desk Lamp", "Ceiling", "Floor Lamp", "Bedside"), the LLM should assign roles intelligently:
- Ceiling / overhead lights -> hero or anchor (most visible)
- Desk / task lights -> anchor or support (functional)
- Floor / corner lights -> support or accent (ambient fill)
- Accent / strip lights -> accent (decorative)
- Bedside / table lights -> support or accent (intimate)

### 6.3 Prompt Engineering for the LLM

The following system prompt guidance should be embedded in the `set_vibe` tool description or provided as a resource:

```
When choosing colors for a vibe, follow these principles:

1. DESATURATE. Never use pure #FF0000, #00FF00, or #0000FF. Always shift
   toward muted, dusty, or warm versions of colors.

2. VARY BRIGHTNESS. Create a spread of at least 30 points between your
   brightest and dimmest active lights. Some lights should be dim.

3. LIMIT PALETTE. Use at most 3 distinct hue families. Variations within
   a family (light teal + dark teal) count as one.

4. ANCHOR WITH WARM WHITE. Unless the vibe is purely cool-toned, include
   at least one warm white (#FFE8CC to #FFECD2) light as a visual anchor.

5. CONSIDER DARKNESS. Leaving 1-2 lights off or very dim (under 10%) is
   a valid and often superior design choice, especially for evening/night vibes.

6. TIME AWARENESS. After 9 PM, avoid blue wavelengths. After 10 PM,
   brightness should rarely exceed 35%. Use deep amber/orange only for
   late night.

7. BRIGHTNESS CEILING. Match the brightness ceiling to the vibe's energy:
   - Energetic: up to 90%
   - Moderate: up to 65%
   - Calm: up to 45%
   - Intimate: up to 30%
   - Sleep: up to 10%
```

### 6.4 Preset Discovery

The presets should be discoverable via a new `list_preset_vibes` tool that allows filtering by category, or via a `suggest_vibe` tool that takes context (time, activity, mood) and returns the best match.

Suggested new tools:

- **`list_preset_vibes`**: Returns all presets, optionally filtered by category. Shows name, description, and preview colors.
- **`apply_preset_vibe`**: Applies a preset by name, automatically mapping palette slots to available lights.
- **`suggest_vibe`**: Takes optional context (time of day auto-detected, activity, mood keywords) and returns top 3 suggested presets with reasoning.

### 6.5 Quick Reference: All 35 Preset Vibes

| # | Name | Category | Hero Color | Brightness Ceiling | Character |
|---|---|---|---|---|---|
| 1 | Deep Focus | Productivity | #2E5090 | 75% | Cool, clear, concentrated |
| 2 | Morning Energy | Productivity | #FFE4B5 | 85% | Warm sunrise progression |
| 3 | Clean Workspace | Productivity | #F5F0EB | 85% | Neutral whites, minimal |
| 4 | Creative Flow | Productivity | #7B68AE | 60% | Purple-blue with warm accent |
| 5 | Study Session | Productivity | #FFF8F0 | 90% | Warm-neutral, high visibility |
| 6 | Cozy Evening | Relaxation | #FFB347 | 55% | Amber monochrome warmth |
| 7 | Zen Garden | Relaxation | #8FBC8F | 40% | Sage green, meditative |
| 8 | Cloud Nine | Relaxation | #E8D5E0 | 50% | Pale pastels, dreamy |
| 9 | Sunday Morning | Relaxation | #FFE4B5 | 65% | Bright warm cream |
| 10 | Warm Blanket | Relaxation | #CC7A3E | 40% | Deep amber-brown, very cozy |
| 11 | Sunset Glow | Nature | #FF6B35 | 60% | Orange-coral with plum sky |
| 12 | Nordic Winter | Nature | #B8D4E3 | 55% | Ice blue with warm accent |
| 13 | Tropical Paradise | Nature | #20A68B | 55% | Teal with coral/gold |
| 14 | Forest Retreat | Nature | #2D6A4F | 45% | Deep green, dappled |
| 15 | Ocean Depths | Nature | #0D3B66 | 40% | Deep blue, bioluminescent |
| 16 | Desert Dusk | Nature | #D4956A | 55% | Terracotta with purple sky |
| 17 | Aurora Borealis | Nature | #00C9A7 | 45% | Teal-green-purple spectrum |
| 18 | Cherry Blossom | Nature | #E8A0BF | 50% | Soft pink with sage |
| 19 | Cinema Mode | Entertainment | #1A1A2E | 15% | Near-darkness, bias light |
| 20 | Gaming Atmosphere | Entertainment | #6C3CE0 | 50% | Electric purple-blue |
| 21 | Music Lounge | Entertainment | #CC7A3E | 40% | Warm wood/leather tones |
| 22 | Late Night Jazz | Entertainment | #1B3A5C | 35% | Smoky blue, single warm spot |
| 23 | Vinyl Session | Entertainment | #E8945A | 55% | Copper-analog warmth |
| 24 | Dinner Party | Social | #FFD9A0 | 60% | Warm gold, food-flattering |
| 25 | Cocktail Hour | Social | #E8B87D | 60% | Gold with purple accent |
| 26 | Brunch Vibes | Social | #FFF8DC | 80% | Bright warm with mint |
| 27 | Candlelight | Romance | #FFB347 | 30% | Amber, near-darkness |
| 28 | Rose Petal | Romance | #C97B84 | 35% | Dusty rose, sophisticated |
| 29 | Midnight Velvet | Romance | #2D1B69 | 25% | Deep jewel tones |
| 30 | Starlight | Romance | #B8C9E0 | 30% | Cool moonlight |
| 31 | Spring Awakening | Seasonal | #A8D5BA | 65% | Fresh green-pink |
| 32 | Summer Golden Hour | Seasonal | #FFB347 | 65% | Rich amber-gold |
| 33 | Autumn Ember | Seasonal | #B35C2A | 45% | Burnt earth tones |
| 34 | Winter Hygge | Seasonal | #FFB870 | 45% | Warm amber, cool window |
| 35 | Holiday Glow | Seasonal | #FFD9A0 | 55% | Gold with red/green accents |
| 36 | Sunrise Wake | Time of Day | #FFE0B2 | 35% | Minimal dawn light |
| 37 | Bright Morning | Time of Day | #FFF8F0 | 95% | Full daylight energy |
| 38 | Productive Afternoon | Time of Day | #FFF8F0 | 80% | Balanced neutral whites |
| 39 | Golden Hour | Time of Day | #FFB870 | 60% | Evening transition warmth |
| 40 | Twilight Fade | Time of Day | #6B85A5 | 40% | Cool blue overtaking warm |
| 41 | Night Owl | Time of Day | #FFD9A0 | 45% | Warm desk light, dark room |
| 42 | Sleep Mode | Time of Day | #FF8C42 | 10% | Deep orange, minimal |

---

*This design document provides the foundation for making AI HueBot a premium lighting experience. The presets, principles, and adaptive logic should be embedded into both the tool descriptions (for LLM guidance) and as stored preset data (for direct application).*
