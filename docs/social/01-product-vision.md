# 01 — Product Vision

## One-liner

**Mad Fan Social** is where football fans live for their club: engage on the terrace, **earn loyalty**, and wear that standing on their **passport** — the canonical fan identity.

## Problem

Football fandom is fragmented:

- Timelines are noisy and club-agnostic.
- Club apps broadcast; they don’t reward peer contribution.
- Campaign loyalty products track claims/tasks but lack a daily social habit that *feels* like being a fan.

Fans lack a place where **belonging to a club**, **contributing in public**, and **seeing loyalty as identity** are the same product.

## Solution

A **fan-base platform** with a loyalty loop at the centre:

| Layer | Job |
| --- | --- |
| **Club allegiance** | Join with a favourite club; contribute as that fan-base |
| **Engagement surfaces** | Feed (Twitter-like), later club chat (Discord-like) |
| **Loyalty ledger** | Every earned action writes `point_transactions` and bumps `total_points` |
| **Passport** | Identity surface: score, tier, streak, club crest, activity records |

Feed posts and likes are **inputs**. Passport is the **identity**.

## Positioning

> The loyalty layer of the football internet — passport first.

Not a vanity social clone. Success is not “time on feed” alone; it is fans who open Social to **build passport standing for their club**.

## Target users

### Primary — Club fans who want standing

- Identify with one club strongly
- Want recognition that engagement counts
- Care about fan ID, streak, tier, and club allegiance on a passport

### Secondary — Superfans / community leaders

- Push terrace culture; later moderation roles
- Care about club-scoped ranks

### Tertiary — Clubs / orgs (via Mad Fan admin)

- Bridge campaign tasks → social proof → same passport ledger

## Non-goals (v1)

- Parallel loyalty currencies or shadow scores
- Betting / gambling
- Mobile-native apps first (responsive web; PWA later)
- Replacing the campaign passport card editor (`/passport`) — Social passport **reuses** the same ledger and deep-links to the campaign card when needed

## Core user journeys

1. **Join with a club** → onboarding allegiance → terrace open.
2. **Engage** → post / reply / earn likes → ledger ticks → passport score rises.
3. **Check identity** → `/social/passport` shows club, loyalty points, terrace records, activity history.
4. **Matchday** (later) → chat + bonus → same passport ledger.

## Success metrics

| Metric | Why |
| --- | --- |
| % onboarded users with favourite club | Allegiance completeness |
| Social-sourced points / DAU | Loyalty loop health |
| Passport opens after post create | Identity habit |
| D1 / D7 of club-picked users | Belonging |
| Posts + replies per DAU | Terrace health |

## North-star experience

Open Mad Fan Social: crest in chrome, feed of club banter, composer that feels matchday, and a **Passport** nav item that shows **your loyalty score as who you are** — score large, club central, ledger of every engagement underneath. Campaign tasks and daily claim still feed the same score; Social is how loyalty becomes cultural, not just transactional.
