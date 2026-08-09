# 03 — Features Spec

Priority tags: **P0** = now / MVP, **P1** = next, **P2** = later.

---

## 0. Passport identity (P0) — product centre

### Behaviour

- Authenticated, social-onboarded fans open **`/social/passport`**.
- Passport shows:
  - **Identity:** name, handle, Fan ID, favourite club (crest / league)
  - **Loyalty score:** `users.total_points` (single ledger; includes social + campaign sources)
  - **Tier / streak** from existing loyalty tier + streak fields
  - **Social points earned** subset (`source_type` like `social_*`)
  - **Terrace records:** posts, replies, likes in/out, followers/following
  - **Activity ledger:** recent `point_transactions` (all sources; social flagged)
- Social engagement continues to award via `AwardSocialPoints` into the **same** `point_transactions` table used by tasks, daily claim, referrals, shootout, etc.
- Passport snapshot columns (`snapshot_*` on `passports`) sync on social awards and club onboarding so the shared passport model stays current.
- Campaign card editor remains at `/passport` (Fan app); Social links to it for shareable card chrome.

### Acceptance

- After posting, passport loyalty points and activity list include the social_post row.
- Club onboarding updates passport snapshot club to favourite club.
- Shell treats Passport as primary identity nav (not an afterthought “Loyalty soon” stub).

---

## 1. Identity & onboarding (P0)

### Behaviour

- Existing Mad Fan auth + email verification.
- Must select **favourite club** before social home / passport.
- Handle / Fan ID shown on passport and profiles.

### Acceptance

- Incomplete club → `/social/onboarding/club`.
- Verified + club → `/social` and `/social/passport`.

---

## 2. Social graph (P0 / P1)

| Action | Priority | Notes |
| --- | --- | --- |
| Follow user | P0 | Seeds Following feed |
| Follow club (auto on pick) | P0 | Membership + favourite |
| Block / mute | P1 | |

---

## 3. Posts — Twitter-like (P0)

Text, images (≤4), reply, like, repost, quote, soft delete, report — see [07](./07-phase-1-builder.md). Club feed + Following feed shipped.

Engagements that mint loyalty (caps in `AwardSocialPoints::RULES`):

| Action | Points | Cap |
| --- | --- | --- |
| Publish post | +5 | 3/day |
| Meaningful reply (≥20 chars) | +2 | 10/day |
| Receive like | +1 | 50/day |

---

## 4. Notifications (P0 light / P1)

Reply / mention P0 later; loyalty unlock toast optional.

---

## 5. Club hangouts — Discord-like chat (Phase 2) — MVP shipped

### Behaviour

- Onboarded fans open **`/social/chat`** for their favourite club terrace.
- Default channels `#general` + `#matchday` auto-provisioned (`EnsureClubChatRooms`).
- Send text messages (500 char), rate-limited; membership/favourite required via `ChannelPolicy`.
- Realtime interim: Inertia `usePoll` (~4s). Reverb + Echo is a documented follow-up (package not installed).
- Chat earn: `social_chat` +1 point, 25/day, min 5 chars (`AwardSocialPoints::forChat`).

### Acceptance

- Member can list channel history and post; non-member of that club’s channel is forbidden.
- Soft-deleted messages stay out of the stream.
- Passport ledger can include `social_chat` rows.

---

## 5b. Match tickets — stadium entry (MVP)

### Behaviour

- Onboarded fans open **`/social/tickets`** to browse upcoming fixtures (home/away clubs, venue, kickoff, GA price).
- **Confirm purchase** issues a `match_tickets` row as `paid` (no Stripe on this pass) — one GA ticket per user per match.
- **`/social/tickets/mine`** lists owned passes; **`/social/tickets/{id}`** shows holder, section, entry code + QR (`madfan:ticket:{code}` via `PassportQrCode` / `qrcode.react`).
- Shell sidebar / header menu includes **Tickets**; bottom tabs surface Tickets on mobile.

### Acceptance

- Upcoming matches appear; finished/live are not purchasable.
- Duplicate purchase for the same match is rejected.
- Ticket detail is owner-only (policy).
- Seeded fixtures via `MatchSeeder` after `ClubSeeder`.

### Later

- Stripe / real payment · seat maps · gate-scan admin · passport wallet surface.

---

## 5c. Stage — live voice rooms (Phase 2c) — MVP shipped

### Behaviour

- Onboarded fans open **`/social/stage`** to list live Stages and **Go live**.
- Room at **`/social/stage/{stage}`** auto-joins; roles host / speaker / listener; raise hand + host promote/demote; in-room text chat.
- Host **Start voice** enables native WebRTC mesh (≤8 speakers); listeners recvonly; SDP/ICE via HTTP poll (`stage_signals`). No new npm/Reverb deps.
- Optimistic UI via Inertia v3 `optimistic()` with automatic rollback.
- Shell nav label: **Join stage**.

### Limits / later

- STUN-only; no TURN/SFU/recording/moderation console; Reverb push signaling deferred.

---

## 6. Direct messages (P1 / Phase 4)

Trust-gated later.

---

## 7. Fan loyalty layer (P0)

**Single system:**

| Concept | Storage |
| --- | --- |
| Loyalty score (points) | `users.total_points` |
| Append-only history | `point_transactions` |
| Identity card / snapshots | `passports` |
| Rank band | `loyalty_tiers` via `LoyaltyTier::forPoints` |

Social sources: `social_post`, `social_reply`, `social_like_received`, `social_chat` (+ future matchday bonus).

### Presentation

- Social passport page (primary in Social chrome).
- Shell chip shows streak + loyalty points → links passport.
- Campaign `/passport` for shareable visual card.

### Acceptance

- No silent point bumps without ledger rows.
- Passport activity lists ledger after social earn.
- Caps enforced (idempotent keys prevent double mint).

---

## 8. Profiles (P0)

Public terrace profile `/social/u/{handle}` — posts tab + follow. Passport remains the private/self identity score surface; profiles are social handles for discovery.

---

## 9–12. Search, safety, official voice, campaign bridge

As previously specified; campaign bridge explicitly means **same passport ledger**, not a second wallet.

## Out of scope for MVP

Voice channels, full algorithmic For You, marketplace, native shells.
