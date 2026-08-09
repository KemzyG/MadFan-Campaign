# 02 — UX / UI Design System

## Design thesis

**“Floodlit terrace at night.”**

Not neon cyberpunk. Not generic charcoal SaaS. Think wet asphalt under stadium lights: deep blacks, cold metal greys, a sharp pitch accent, and warm amber for streak/loyalty heat. Composition is dense where Twitter and Discord are dense (feed column, channel list), with deliberate breathing room on profile and loyalty moments.

## Theme

| Token | Value | Role |
| --- | --- | --- |
| `--mf-void` | `#070809` | App canvas |
| `--mf-panel` | `#0E1114` | Sidebars, cards |
| `--mf-elevated` | `#161B21` | Composer, modals, hover |
| `--mf-line` | `#243039` | Hairlines / dividers |
| `--mf-text` | `#E8EEF2` | Primary text |
| `--mf-muted` | `#8B9AAB` | Secondary text |
| `--mf-pitch` | `#3DFF9A` | Primary CTA / live / focus (pitch green — unsaturated enough to stay premium) |
| `--mf-pitch-dim` | `#1F7A4D` | Soft fills |
| `--mf-amber` | `#FFB020` | Streaks, warnings, “heat” |
| `--mf-rival` | `#FF4D6A` | Rivalry / alert / destructive |
| `--mf-crest-ring` | club primary (dynamic) | Club chrome accent |

**Hard rules**

- Dark theme only for v1 social surfaces (admin stays as today).
- No purple gradients. No cream paper editorial. No broadsheet grids.
- Prefer sharp 8–12px radii on feed cards; chat message bubbles stay flatter (Discord-like).
- Grain / subtle noise optional on hero/loyalty screens only — never on message lists (readability).

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display / match moments | **Syne** (700–800) | Club names, empty states, scoreline moments |
| UI / posts | **IBM Plex Sans** | Excellent denseness for timelines |
| Mono / fan IDs | **IBM Plex Mono** | `@handle`, `#MF-…`, codes |

Avoid Inter, Roboto, Arial, Space Grotesk as brand defaults.

### Type scale (feed)

- Composer placeholder: 15–16px
- Post body: 15px / 1.45
- Meta (time, club): 12–13px muted
- Channel name: 14px semibold
- Display hero: clamp 2rem–3.5rem Syne

## Layout chrome

### Desktop (≥1100px)

Three-column social shell:

```
┌─────────┬──────────────────────┬────────────┐
│ Nav     │ Main (Feed | Chat)   │ Context    │
│ (72–88) │ max ~600 feed / full │ Club card  │
│ crest   │ width for Discord    │ Trending   │
│         │ layout               │ Loyalty    │
└─────────┴──────────────────────┴────────────┘
```

- Left: Mad Fan Social logo mark, Home, Club, Messages, Loyalty, Profile.
- Center: switches between Feed (Twitter width) and Chat (Discord dense).
- Right: active club card, your loyalty chip, “Hot in club” posts.

### Mobile

- Bottom tab bar: Home · Passport · You · Chat; compose via Home FAB / Post chip (sheet modal)
- Chat uses full width with slide-over channel list (Discord mobile pattern).

## Surface patterns

### Identity — Passport (primary)

- Passport page is hero identity: Syne display name, large loyalty points figure, club crest as allegiance.
- Not a dashboard of equal cards — one score story, then records, then ledger.
- Shell left/footer nav includes **Passport** and links the user chip to `/social/passport`.

### A. Feed (Twitter-like)

- Single stream column (~598px content feel)
- Club / Following segments only on the Home toolbar; compose via header **Post** chip + FAB → bottom-sheet modal (text + media)
- Post row: avatar | name + `@handle` + club crest flake | body | media | ⋯ overflow | action bar
- Actions: Reply · Like · Repost · Views (+ Quote) — icons with readable counts (incl. 0)
- Soft divider between posts (1px `--mf-line`), no heavy cards
- Quote posts inset with left pitch accent bar
- Repost header: “{user} reposted” in muted
- Thread view: focused parent + indented replies

### B. Chat (Discord-like)

Club = **Server**. Inside:

- Channel list: `#matchday`, `#transfers`, `#memes`, `#welcome`, voice placeholders (UI only initially)
- Message list: continuous scroll, compact avatars, username + timestamp on hover or first-in-group
- Composer docked bottom with attachment + emoji + GIF (phase gated)
- Member sidebar on desktop (online / offline)
- Presence: green dot for online; amber for idle
- Roles / flair: tier name colour, optional club staff badge
- Threads: spawn from message → side panel

### C. Loyalty overlay

- Persistent **streak chip** near avatar: amber ring when active
- Tier pill: Rookie → … → Legend (map to existing loyalty tiers)
- Club scoped weekly XP bar in right rail
- Profile: Twitter-like header banner + Discord-like role tags under bio

## Motion (professional, few but sharp)

1. **Composer focus** — panel elevates, pitch ring 120ms.
2. **Like** — microscopic pitch flash + count tick (no confetti).
3. **Channel switch** — crossfade messages 100ms; channel list active indicator slides.
4. **Matchday live pill** — subtle pulse on `#matchday` when “live window” flag is on.
5. **Loyalty unlock** — one-shot toast + crest shimmer (max once per unlock).

No bounce-everywhere animations. Prefer 120–220ms ease-out.

## Iconography & imagery

- Custom stroke icons (24px) for nav/actions — not emoji as UI chrome.
- Club crests: circular with thin metal ring; fallback initial on void.
- Media posts: 16:9 default crop, dark letterboxing.
- Empty states: Syne headline + one pitch CTA — “Kick the first ball in #transfers”.

## Accessibility

- Contrast: body text ≥ 4.5:1 on panels.
- Focus rings: 2px `--mf-pitch`.
- Chat denseness must remain keyboard scrollable and screen-reader labelled (`role="log"` for message region).
- Reduced motion: disable pulses and unlock shimmer.

## Component inventory (Inertia)

| Component | Notes |
| --- | --- |
| `SocialShell` | 3-col / mobile tabs |
| `FeedComposer` / `ComposeSheet` | FAB → sheet composer |
| `PostOverflowMenu` | ⋯ bookmark / follow / hide / report / delete |
| `PostCard` / `PostThread` | timeline unit |
| `ClubServerLayout` | Discord chrome |
| `ChannelList` / `MessageStream` / `ChatComposer` | chat |
| `LoyaltyChip` / `TierPill` / `ClubCard` | identity |
| `SocialNav` | left / bottom |

Reuse `FanLayout` patterns only where brand continuity helps; SocialShell is its own root for the social app paths.

## Tone of copy

Short, matchday, human:

- “Post to the terrace”
- “You’re in Arsenal rooms”
- “Streak on fire — don’t ghost Matchday”
- Avoid corporate: no “Synergize your fandom”

## Design QA checklist

- [ ] First viewport of Home reads as football tribe, not generic social scaffold
- [ ] Feed feels Twitter-density; Chat feels Discord-density (different layouts)
- [ ] Pitch green used sparingly — CTAs and live, not every border
- [ ] Club crest visible without hunting
- [ ] Dark theme readable on phone outdoors / night indoor
