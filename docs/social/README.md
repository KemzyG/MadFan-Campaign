# Mad Fan Social — Documentation Index

**Mad Fan Social** is the **fan loyalty layer of the internet**: a club-first sports social surface where fans engage for their favourite club and **earn loyalty**. The **passport is their identity** — loyalty score and the full activity ledger live there. Feed, chat, and profiles are how fans contribute; passport is who they are.

| Doc | Purpose |
| --- | --- |
| [01 — Product Vision](./01-product-vision.md) | Loyalty loop, passport identity, audience, success metrics |
| [02 — UX / UI Design System](./02-ux-ui.md) | “Floodlit terrace” language; passport as hero identity |
| [03 — Features Spec](./03-features.md) | Behaviour + acceptance; engagement → ledger → passport |
| [04 — Architecture](./04-architecture.md) | Surfaces, shared points/passport stack, social domains |
| [05 — Data Model](./05-data-model.md) | Social tables + reuse of users / passports / point_transactions |
| [06 — Roadmap](./06-roadmap.md) | Phases; passport identity slice status |
| [07 — Phase 1 Builder Guide](./07-phase-1-builder.md) | Routes, scoring, passport payload, tests |

## Status (living)

| Phase | Status | Notes |
| --- | --- | --- |
| **0 — Foundations** | **Done** | `/social` shell, club onboarding, `social_network_enabled` |
| **1 — Feed MVP** | **Nearly complete** | Posts/likes/replies/follows/media/report + social points |
| **1b — Passport identity** | **In progress** | `/social/passport` — score, club allegiance, records, ledger |
| **2 — Club chat** | **Core shipped** | Reverb push + slow poll fallback |
| **2b — Match tickets** | **MVP shipped** | `/social/tickets` confirm-purchase + QR; no Stripe |
| **2c — Stage** | **MVP shipped** | Modal Stage + separate chat modal; Reverb room/signaling + poll fallback |
| **3 — Habit & polish** | Planned | Notifications, club weekly board, deeper passport tabs |
| **4 — Scale & trust** | Planned | Official accounts, moderation, DMs |

## Core loop (do not lose this)

```
Favourite club → Engage (post / reply / like / chat…)
       → point_transactions (ledger) + users.total_points
       → Passport identity (score + activity records)
```

There is **one** loyalty score system: existing Mad Fan `users.total_points` + `point_transactions` + `passports` (+ `loyalty_tiers`). Social does not invent a parallel score.

## Product pillars

1. **Club allegiance first** — favourite club is the onboarding gate and feed context.
2. **Engagement earns loyalty** — social actions mint ledger rows with caps.
3. **Passport is identity** — score, tier, streak, club, records, and activity history.
4. **Feed & chat are contribution surfaces** — Twitter-grade posting; Discord-grade hangouts later.
5. **Monochrome terrace UI** — black/white only; typography stays Saira + Plex.

## Stack (locked)

- **Backend:** Laravel 13 · **Fan Social UI:** Inertia v3 + React 19 + Tailwind v4 (`social.jsx`)
- **Realtime:** Laravel Reverb + Echo (`php artisan reverb:start`); Inertia/HTTP poll remains a fallback
- **Loyalty:** `AwardSocialPoints` → `point_transactions` / `total_points` · `SocialPassportService` syncs `passports` snapshots
- **Campaign passport:** `/passport` (`Fan/Passport`) remains the shareable card / editor; Social passport is the identity home inside `/social`

## Builder quick start

1. Vision: [01](./01-product-vision.md) — passport-first.
2. Wire/score: [07](./07-phase-1-builder.md).
3. Gate with `verified` + `social.enabled` + `social.onboarded`.
4. Pest under `tests/Feature/Social*`.
5. Realtime: set `BROADCAST_CONNECTION=reverb` (see `.env.example`), then `php artisan reverb:start` (and `npm run dev` / `npm run build` so `VITE_REVERB_*` is baked in).
