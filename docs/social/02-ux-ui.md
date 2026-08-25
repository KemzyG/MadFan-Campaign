# 02 — UX / UI Design System

## Design thesis

**"Skyborne apothecary on white marble."**

The dark navy ink is the mortar; the rainbow spectrum is the medicine. A light,
editorial, precise system: Snow-white canvas, Deep Navy ink, one vivid hue
(Vibrant Green) reserved for status and badges, and colour otherwise carried by
content — club crests, kits, match media, product photography — never by chrome.

Composition stays dense where Twitter and Discord are dense (feed column,
channel list), with deliberate breathing room on profile, passport and loyalty
moments. Nothing floats: depth comes from hairlines and surface tint shifts, not
from shadow.

> Supersedes the previous "floodlit terrace at night" monochrome dark theme.

## Theme

### Palette

| Token | Value | Vibrants name | Role |
| --- | --- | --- | --- |
| `--mf-canvas` | `#ffffff` | Snow | App canvas |
| `--mf-panel` | `#ffffff` | Snow | Cards, sidebars, nav |
| `--mf-elevated` | `#f2f6ff` | Cloud | Panel tint, hover, wells |
| `--mf-recess` | `#f2f6ff` | Cloud | Sunken wells, media placeholders, inset tracks |
| `--mf-scrim` | `color-mix(in srgb, #021422 38%, transparent)` | — | Modal / sheet overlay |
| `--mf-line` | `#ccd2d7` | Silver Mist | Card borders, hairlines |
| `--mf-line-soft` | `#e6e8e9` | — | Nav dividers |
| `--mf-border-muted` | `#808f9c` | Iron Gray | Emphasised borders |
| `--mf-text` | `#021422` | Deep Navy | Primary ink |
| `--mf-muted` | `#6a7c89` | Slate | Secondary body (≥14px only — see Accessibility) |
| `--mf-pitch-dim` | `#67727a` | Graphite | Tertiary / small muted text |
| `--mf-pitch` | `#021422` | Deep Navy | Primary fill + emphasis |
| `--mf-rival` | `#001f38` | Midnight Navy | Secondary emphasis |
| `--mf-amber` | `#91c3ff` | Sky Wash | Outlined-button borders, icon accents, link highlights |
| `--mf-charcoal` | `#262626` | Charcoal | Icon fills |
| `--mf-warm-sand` | `#fff6ea` | Warm Sand | Warm alternate surface |
| `--mf-cream` | `#ffe9c9` | — | Warm accent |
| `--mf-on-fill` | `#ffffff` | Snow | Text / icons on a Deep Navy fill |
| `--mf-ink-invert` | `#ffffff` | Snow | Ink inside dark islands |
| `--mf-ok` | `#00852e` | Vibrant Green | Success, live, badges — **the only vivid hue on chrome** |
| `--mf-warn` | `#8a5a00` | — | Functional amber, legible on white |
| `--mf-bad` | `#c43030` | — | Destructive |
| `--mf-sky-hero` | `linear-gradient(180deg, #c4e4fb, #f2f6ff)` | — | Hero panel background |
| `--mf-spectrum` | 7-stop violet→red at 5% | — | Hero wash only |

`--mf-crest-ring` stays dynamic (club primary).

### The `--mf-void` split

`--mf-void` previously meant canvas, sunken recess **and** modal scrim at once.
Those roles diverge under a light theme: a scrim built from
`color-mix(--mf-void 70%, transparent)` would become white-70% and wash a modal
out instead of dimming it. It is replaced by four explicit tokens — `--mf-canvas`,
`--mf-recess`, `--mf-scrim`, `--mf-on-fill`. Do not reintroduce `--mf-void`.

Two mix families existed in the old sheet and translate differently:

- `color-mix(… var(--mf-void) N%, var(--mf-panel|--mf-elevated))` — "darken this
  surface" → becomes a Cloud tint off `--mf-recess`.
- `color-mix(… var(--mf-void) N%, transparent)` — a translucent dark plate over
  the stadium photo. With the photo backdrop gone, most of these become **opaque**
  Snow or Cloud surfaces; only genuine overlays keep `--mf-scrim`.

### Hard rules

- Light theme is the system. Dark is allowed only as a **scoped island** (below).
- No pure black `#000000` anywhere.
- The spectrum gradient never appears on UI chrome, buttons or non-hero surfaces.
- No chromatic filled buttons. The only filled button is Deep Navy.
- **No shadows.** Depth is hairlines + surface tint shifts + navy/white contrast.
- Max one filled primary button per viewport.
- No centred body copy.
- Vibrant Green is status and badges only — never a border colour, never a CTA fill.

**Exception — the Events feed.** `/social` (`resources/js/pages/Social/Events.jsx`,
styled by `resources/css/social/events.css` + `event-live/-media/-news.css`) is a
deliberate, scoped departure from the rules above: a rich, colourful, card-based
feed closer to Discord/Snapchat/X, on purpose. It gets its own per-type accent
palette (`--mf-ev-accent`, set per `.mf-ev--{type}`), real shadows, gradient
filled buttons and heavier motion — none of that is a mistake to "fix" back
toward Vibrants. The rest of Social is unaffected; the accents are scoped inside
`.mf-events` and never leak into shared tokens.

### Dark islands

The Stage voice room, the Fan Passport and the auth/onboarding pages remain dark,
on-palette: Deep Navy surface, Midnight Navy panels, Snow ink, Sky Wash accents,
Vibrant Green for live/connected. The guide grants Deep Navy a surface role (nav,
footer, announcement bar), so this is inside the system rather than an exception.

Implement islands by flipping the tokens on a scoping class rather than editing
rules one by one:

```css
.mf-invert {
    --mf-canvas: #021422;
    --mf-panel: #001f38;
    --mf-elevated: color-mix(in srgb, #ffffff 6%, #001f38);
    --mf-text: #ffffff;
    --mf-muted: color-mix(in srgb, #ffffff 72%, transparent);
    --mf-line: color-mix(in srgb, #ffffff 14%, transparent);
}
```

## Typography

| Role | Font | Owns | Notes |
| --- | --- | --- | --- |
| Display | **Fraunces** (400–700) | everything ≥20px | Substitutes New Kansas. Serif, editorial |
| UI / body | **Inter** | everything <20px | Negative tracking (−0.022em at 16px) |
| Labels | **Montserrat** | 10–12px uppercase | Tracking 0.10–0.13em |
| Badges | **Bebas Neue** | sale badges, discount pills **only** | Tracking 0.063em. Substitutes Rift Soft |
| Mono | IBM Plex Mono | passport MRZ, ledger figures, ticket codes | Narrowed — `@handle` moves to Inter |

Never mix Fraunces and Inter at the same size for the same role. Bebas Neue never
appears outside a discount/badge context.

### Type scale

| Token | Size | Family |
| --- | --- | --- |
| `--mf-text-micro` | 10px | Montserrat, 0.10em |
| `--mf-text-caption` | 12px | Montserrat, 0.13em |
| `--mf-text-meta` | 13px | Inter |
| `--mf-text-ui` | 14px | Inter, −0.01em |
| `--mf-text-body` | 16px | Inter, −0.022em |
| `--mf-text-chat` | 16px | Inter |
| `--mf-text-title` | 20px | Fraunces |
| `--mf-text-section` | 22px | Fraunces |
| `--mf-text-subheading` | 24px | Fraunces |
| `--mf-text-display` | 28px | Fraunces |
| `--mf-text-heading-sm` | 32px | Fraunces |
| `--mf-text-heading` | 36px | Fraunces |
| `--mf-text-heading-lg` | 44px | Fraunces |
| `--mf-text-hero` | 48px | Fraunces |
| `--mf-text-score` | `clamp(2rem, 6vw, 2.75rem)` | Fraunces, tabular |

Tracking: `--mf-tracking-label` `0.13em`, `--mf-tracking-body` `-0.022em`,
`--mf-tracking-ui` `-0.01em`, `--mf-tracking-display` `-0.01em`,
`--mf-tracking-hero` `-0.02em`.

Density is adapted, not transplanted: the lower steps drive feed, chat and chrome;
the upper serif steps drive heroes, empty states, section headers and passport.

## Shape

Five steps. **Do not use a radius outside this scale.**

| Token | Value | Applies to |
| --- | --- | --- |
| `--mf-radius-badge` | `3px` | badges, tags — the sharp corner is the deliberate tell |
| `--mf-radius` | `8px` | cards, buttons, inputs |
| `--mf-radius-panel` | `12px` | nav, hero panels |
| `--mf-radius-pill` | `20px` | pills, chips |
| `--mf-radius-lg` | `32px` | large sheets |
| `--mf-radius-full` | `9999px` | avatars, circular controls |

## Elevation

```css
--mf-sheen:    none;
--mf-shadow-1: none;
--mf-shadow-2: 0 0 0 1px var(--mf-line);  /* popovers: hairline ring */
--mf-shadow-3: 0 0 0 1px var(--mf-line);  /* sheets: ring + scrim */
--mf-glass:    blur(18px);                /* no saturate(0) — Cloud tints must survive */
```

Floating overlays separate via `--mf-scrim` plus a Silver Mist ring. Focus rings
become a 2px Sky Wash ring, not a glow.

## Spacing and layout

4px base unit; comfortable density. `--mf-card-pad: 16px`,
`--mf-element-gap: 16px`, `--mf-section-gap: 16px` (in-card).

Wide "page" surfaces — shop, wallet, leaderboard, clubs, fixtures — use
`--mf-page-max: 1200px` and `--mf-section-gap-page: 48px`. The app shell keeps its
own width tokens (`--mf-app-width` 456px phone column, `--mf-feed-width` 600px
feed, sidebar and chat rails) — those are unchanged.

### Desktop (≥1100px)

```
┌─────────┬──────────────────────┬────────────┐
│ Nav     │ Main (Feed | Chat)   │ Context    │
│ (72–88) │ max ~600 feed / full │ Club card  │
│ crest   │ width for Discord    │ Trending   │
│         │ layout               │ Loyalty    │
└─────────┴──────────────────────┴────────────┘
```

White nav with a 1px `--mf-line-soft` bottom hairline and no shadow. White
sidebar rail, navy ink, Cloud hover. Bottom tabbar white with a top hairline.

### Mobile

- Bottom tab bar: Home · Passport · You · Chat; compose via Home FAB / Post chip.
- Chat uses full width with a slide-over channel list.

## Component recipes

| Component | Recipe |
| --- | --- |
| `.mf-btn--pitch` — Primary Filled | Deep Navy fill, Snow text, 8px, 18px/24px pad, Fraunces 600 uppercase 0.10em. One per viewport |
| `.mf-btn--ghost` — Secondary Outlined | Transparent, 1px Deep Navy border, navy text, Fraunces 600 |
| `.mf-btn--sky` — Sky Ghost | 1px Sky Wash border, navy text, Inter 500 — tertiary |
| `.mf-btn--muted` | Slate text on a Silver Mist hairline, low emphasis |
| `.mf-badge` — Sale Badge | Vibrant Green fill, Snow text, **3px**, 3px/6px pad, Bebas Neue 600 12px 0.063em |
| `.mf-field` | Snow fill, Silver Mist hairline, 8px, Inter 16px, Sky Wash focus ring |
| `.mf-panel-card` — Product Card | Snow surface, 1px Silver Mist, 8px, 16px pad, no shadow |
| `.mf-chat-bubble` — Testimonial Bubble | Snow fill, Silver Mist hairline, 16px, Inter 14px navy, on a Cloud thread background |
| `.mf-text-caption` | Montserrat 12px / 0.13em uppercase — the signature eyebrow, ~100 sites |
| Star rating row | Deep Navy stars, Slate count |
| Hero panel | `--mf-sky-hero` + the 5% spectrum wash, 12px radius |
| Sticky cart notification | Snow surface, Silver Mist ring, green badge for count |
| Circular stamp badge | Deep Navy ring, Montserrat micro around the arc |

## Surface patterns

### Identity — Passport (dark island)

Fraunces display name, large loyalty figure, club crest as allegiance. One score
story, then records, then ledger — not a dashboard of equal cards.

### A. Feed (Twitter-like)

- Single stream column (~600px), post cards on Snow with Silver Mist hairlines.
- Post row: avatar | name + `@handle` + crest flake | body | media | ⋯ | action bar.
- Actions: Reply · Like · Repost · Views (+ Quote), counts Inter 13px Slate (incl. 0).
- Segmented control's active pill inverts to Deep Navy.
- Quote posts inset with a left Sky Wash accent bar.
- Thread view: focused parent + indented replies.

### B. Chat (Discord-like)

- Cloud thread background; bubbles per the Testimonial recipe.
- Presence: Vibrant Green dot online, hollow Silver Mist ring offline.
- Member sidebar on desktop; composer docked bottom.

### C. Store

Closest to the system's native territory: Product Card grid, Bebas Neue discount
pills, sky-gradient hero, sticky cart notification. Product photography carries
all the colour.

### D. Loyalty overlay

Streak chip near the avatar with a Sky Wash ring when active; tier pill
Rookie → Legend; club-scoped weekly XP bar in the right rail.

## Motion

1. **Composer focus** — Sky Wash ring, 120ms.
2. **Like** — microscopic navy flash + count tick (no confetti).
3. **Channel switch** — crossfade 100ms; active indicator slides.
4. **Matchday live pill** — subtle pulse when the live window flag is on.
5. **Loyalty unlock** — one-shot toast, max once per unlock.

120–220ms ease-out. No bounce-everywhere. Reduced motion disables pulses and shimmer.

## Iconography & imagery

- Custom stroke icons (24px), Charcoal or Deep Navy fills — not emoji as chrome.
- Club crests: circular, thin Silver Mist ring, initial fallback on Cloud.
- Media posts: 16:9 default crop, Cloud letterboxing (not dark).
- **No photographic chrome.** The global stadium backdrop and noise overlay are
  removed. Stadium photography survives only where it is content — fixtures,
  tickets, match media.
- Empty states: Fraunces headline + one outlined CTA.

## Accessibility

Contrast gate — every text/surface pair must clear WCAG AA:

- Deep Navy `#021422` on Snow ≈ 19:1 — safe everywhere.
- **Slate `#6a7c89` on Snow ≈ 3.9:1 — fails AA for body copy.** Restricted to
  ≥14px non-essential metadata. Use Graphite `#67727a` (≈4.6:1) for anything
  smaller or load-bearing.
- Vibrant Green `#00852e` on Snow ≈ 4.9:1 — fine for badge text at 12px+, not for
  thin small type.

Focus rings: 2px Sky Wash `#91c3ff`. Chat must stay keyboard scrollable and
screen-reader labelled (`role="log"`). Reduced motion respected.

## CSS file map

`resources/css/social.css` holds **no rules**. It is the single source of cascade
truth: `@import 'tailwindcss'`, then the core system in original order, then the
per-feature sheets that refine it, then the `@source` globs.

Import order is load-bearing — `.mf-post` and `.mf-chat` are restyled in more
than one place by design. Add new rules to the owning partial, not to the entry.

**Core system** — `resources/css/social/core/`, extracted verbatim from the former
12,085-line monolith:

```
tokens  base  shell  header  feed  post  composer  primitives  empty  auth
passport  motion  chat  profile  fixtures  tickets  stage  skeletons  shop
```

**Per-feature layer** — `resources/css/social/`, loads after core:

```
split  leaderboard  wallet  clubs  fixtures  tickets  shop  profile  post
composer  stage-card  events  event-live  event-media  event-news
```

`resources/css/madfan.css` (Fan campaign) stays a JS import in `social.jsx` and is
outside this system.

## Component inventory (Inertia)

| Component | Notes |
| --- | --- |
| `SocialShell` | 3-col / mobile tabs |
| `FeedComposer` / `ComposeSheet` | FAB → sheet composer |
| `PostOverflowMenu` | ⋯ bookmark / follow / hide / report / delete |
| `PostCard` / `PostThread` | timeline unit |
| `ChannelList` / `MessageStream` / `ChatComposer` | chat |
| `LoyaltyChip` / `TierPill` / `ClubCard` | identity |
| `SocialNav` | left / bottom |

## Tone of copy

Short, matchday, human — “Post to the terrace”, “You’re in Arsenal rooms”. Avoid
corporate (“Synergize your fandom”).

## Design QA checklist

- [ ] Canvas is Snow `#ffffff`; no `#000000` anywhere in the sheet
- [ ] No `box-shadow` outside `tokens.css`; no `--mf-sheen` inset highlights
- [ ] Every `border-radius` resolves to 3 / 8 / 12 / 20 / 32 / 9999px
- [ ] Exactly one filled Deep Navy button per viewport
- [ ] Vibrant Green appears only on badges and status
- [ ] Fraunces owns ≥20px; Inter owns <20px; Bebas Neue only on discount pills
- [ ] Slate is never used below 14px or for load-bearing copy
- [ ] Dark islands (stage, passport, auth) are token-flipped, not hand-edited
- [ ] Feed keeps Twitter density; chat keeps Discord density
- [ ] Club crest visible without hunting
