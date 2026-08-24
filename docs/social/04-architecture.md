# 04 — Architecture

## Placement in this repo

Mad Fan Social is **not** a separate Nest/Next service. It is a new **Inertia application surface** beside existing fan campaign pages and admin.

```
routes/web.php
  /                 → campaign / marketing (existing Fan/*)
  /social/*         → Mad Fan Social (new Inertia pages)
  /app/*            → Inertia admin (existing)
  Filament panel    → ops (existing)

routes/api.php
  /api/...          → mobile / external (extend with social JSON where needed)
```

### Frontend entry

Prefer a dedicated Vite entry for social chrome (optional but cleaner):

- `resources/js/user.jsx` — campaign
- `resources/js/social.jsx` — SocialShell + pages under `resources/js/pages/Social/**`
- `resources/js/admin.jsx` — admin

Alternatively share `user.jsx` and branch layout by path via Inertia persistent layouts. **Recommendation:** dedicated `social.jsx` + `resources/views/social.blade.php` so CSS tokens/fonts stay isolated from marketing pages.

## Domains (bounded contexts)

| Domain | Responsibility |
| --- | --- |
| **Identity / Passport** | Users, handles, `passports`, favourite club — **canonical loyalty identity** |
| **Loyalty ledger** | `point_transactions`, `total_points`, `loyalty_tiers`, streaks (shared with campaign) |
| **Clubs** | Clubs, leagues, memberships |
| **Social graph** | Follows, blocks, mutes |
| **Publishing** | Posts, media, likes, reposts, quotes, threads |
| **Realtime chat** | Servers, channels, messages, presence (Phase 2) |
| **Stage** | Live voice rooms (`stages` + WebRTC mesh poll signaling) |
| **Moderation** | Reports (`social_reports`), audits |
| **Notify** | In-app + push |

### Loyalty integration (authoritative)

```
Social action → AwardSocialPoints
  → point_transactions (source_type = social_*)
  → users.total_points++
  → SocialPassportService::syncSnapshot (passports.snapshot_*)

Campaign task / daily claim / referral / shootout
  → same point_transactions + total_points
  → Fan /passport PassportResource

Social UI home for identity: GET /social/passport (Inertia Social/Passport)
Campaign UI for shareable card: GET /passport (Inertia Fan/Passport)
```

Do **not** introduce a second points column for Social.

Keep controllers thin; put rules in services/actions matching current Mad Fan style (`app/Services`, `app/Actions`).

## Suggested package layout

```
app/Domains/Social/          # optional; or flat Services until size demands
  Models/ …
  Actions/CreatePost.php
  Actions/AwardSocialPoints.php
  Services/FeedService.php
  Services/ChatService.php
  Events/MessageSent.php
  Policies/PostPolicy.php

app/Http/Controllers/Inertia/Social/…
app/Http/Controllers/Api/Social/…   # if mobile needs parity

resources/js/pages/Social/
  Home.jsx
  ClubFeed.jsx
  PostShow.jsx
  Chat/Server.jsx
  Profile/Show.jsx
  Onboarding/PickClub.jsx
```

## AuthZ

- Reuse Spatie roles/permissions for staff moderation (Phase 4 console).
- Policies (shipped Phase 1–2):
  - `PostPolicy` — create/view if verified + social onboarded + club set; delete own; like/reply via same view gate.
  - `ChannelPolicy` / `MessagePolicy` — view/send if favourite or `club_memberships` for that club; deny read-only sends.
- Club membership: `favourite_club_id` + `club_memberships` (Phase 0).

## Routing (Phase 0–2 reality)

```
GET  /social/passport               social.passport      → identity + ledger
GET  /social                        social.home          → "What's happening NOW" events feed
GET  /social/feed                   social.feed          → club / following post timeline
POST /social/posts                  social.posts.store
GET  /social/posts/{post}           social.posts.show
DELETE /social/posts/{post}         social.posts.destroy
POST /social/posts/{post}/replies   social.posts.replies.store
POST|DELETE /social/posts/{post}/like
GET|POST /social/onboarding/club
GET  /social/chat?channel=slug      social.chat          → club terrace chat
POST /social/chat/channels/{channel}/messages  social.chat.messages.store
```

Middleware alias stack: `verified` → `social.enabled` → (`social.onboarded` for feed / chat).

## Feed delivery

**MVP (shipped):** pull club timeline via SQL — top-level visible posts where `club_id = favourite_club_id`, `latest id`, paginated.

**Next:** Following feed via `follows`; “For you” hybrid later.

## Realtime (Discord chat)

### Interim (shipped Phase 2 MVP)

- No `laravel/reverb` in composer — **do not block** chat on installing it.
- Chat page uses Inertia **`usePoll`** (~4s) partial reload of `messages`.
- HTTP POST creates messages; soft deletes supported on model.

### Target stack (follow-up)

- **Laravel Reverb** + **Laravel Echo** + `pusher-js` / `@laravel/echo` (requires dependency approval / `composer require`).
- Private channels: `club.{clubId}.channel.{channelId}`
- Presence channels: `presence-club.{clubId}`

### Flow (target)

1. Client authorizes via Sanctum session (web) or Paseto-gated signed channel auth endpoint.
2. `SendChatMessage` action persists row → broadcasts `MessageSent`.
3. Clients append optimistically; reconcile by id.

### Scaling notes

- Shard high-traffic `#matchday` by club; don’t put all clubs on one fan-out bottleneck without queue workers.
- Use Redis for presence + Reverb scaling.
- Rate-limit writes in middleware (`throttle:60,1` shipped).

## Reused Mad Fan loyalty models

Social does not fork scoring. It extends:

- `users.total_points`, `loyalty_tier_id`, streak fields
- `point_transactions` (enum includes `social_*` sources)
- `passports` (identity snapshots synced from Social)
- `loyalty_tiers`

Passport composite % score in `PassportResource` (campaign card) remains for the Fan passport UI; Social passport surface emphasises **ledger points** as the fan-facing loyalty score, plus terrace records.

## Session vs API

| Client | Auth |
| --- | --- |
| Inertia web | Session cookie + CSRF |
| Future native / SPA API | Paseto Bearer + `auth.paseto` + `verified` |

Web logout must continue to bump `token_version` (already implemented).

## SEO / routes

Social is mostly app-authenticated. Public **profiles** and **posts** can be optionally shareable (Inertia or Blade OG cards) in P1.

## Observability

- Structured logs for chat send failures.
- Metrics: messages/min per club, post create latency, websocket connect count.
- Admin “Social health” widget (P1).

## Security checklist

- [ ] Authorize every channel join
- [ ] Sanitize post HTML — store plain text + markdown subset or Lexical JSON; escape on render
- [ ] Upload MIME/size validation
- [ ] Report tooling before open federation
- [ ] No Paseto key / secrets in git (already ignored)
- [ ] Admin MFA remains required for moderation consoles

## Testing strategy

- Pest feature tests for post CRUD, feed scopes, point awards, chat persist.
- Browser/smoke later for Echo (optional).
- Factory states: `User::factory()->withClub()`, `Post::factory()->quote()`.
