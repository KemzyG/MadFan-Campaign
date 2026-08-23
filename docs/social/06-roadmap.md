# 06 — Roadmap

## Phase 0 — Foundations (1–2 weeks) ✅ Done

**Goal:** Social shell boots inside this repo with design tokens and auth gates.

- [x] Docs freeze (this folder) + ADR note in README link
- [x] Vite entry `social.jsx` + blade root + dark tokens / Syne + IBM Plex
- [x] Routes `/social/*` behind `auth` + `verified` + `social.enabled`
- [x] Onboarding: pick favourite club → `favourite_club_id` + `club_memberships` + `social_onboarded_at`
- [x] `SocialShell` layout (nav + home)
- [x] Admin setting: `social_network_enabled`
- [x] Pest: `tests/Feature/SocialPhaseZeroTest.php`

**Exit met:** Verified fan can open `/social` with club crest in chrome.

**Shipped reality (as built):**

| Piece | Location |
| --- | --- |
| Routes | `routes/web.php` → `social.*` |
| Middleware | `EnsureSocialEnabled`, `EnsureSocialOnboarded` |
| Controllers | `app/Http/Controllers/Inertia/Social/*` |
| Entry | `resources/js/social.jsx`, `resources/views/social.blade.php` |
| CSS tokens | `resources/css/social.css` |
| Layout | `resources/js/Layouts/SocialShell.jsx` |
| Settings helper | `ApplicationSettings::socialNetworkEnabled()` (name may vary — search `social_network_enabled`) |

---

## Phase 1 — Feed MVP (2–3 weeks) ✅ Nearly complete + passport identity

**Goal:** Twitter-like posting for club communities **and** passport as loyalty identity.

### Feed shipped

- [x] Text + image posts, likes, replies, repost/quote, report, follows, profiles
- [x] Social point awards with caps (`AwardSocialPoints`)

### Passport identity slice (this iteration)

- [x] `/social/passport` — club allegiance, loyalty points, terrace records, ledger
- [x] Snapshot sync on awards + club onboarding
- [x] Shell nav: Passport as identity (not “Loyalty soon”)
- [x] Pest `SocialPassportTest`

### Optional polish still open

- [ ] Optimistic likes / denylist / richer profile tabs
- [ ] Surface passport composite % (PassportResource) alongside points if product wants both
- [ ] Club-weekly social leaderboard on passport

**Exit:** Two fans engage; both see loyalty rise on Social passport ledger.

---

## Phase 2 — Club chat MVP (2–3 weeks) ✅ Core slice shipped (poll interim)

**Goal:** Discord-like rooms per club.

- [ ] Reverb + Echo wired in local/prod configs *(deferred — `laravel/reverb` not installed; chat uses Inertia `usePoll`)*
- [x] Seed / auto-provision club_server + default `#general` + `#matchday` (`EnsureClubChatRooms`, `ClubChatSeeder`)
- [x] Message send / history (latest 50) + Form Request + rate limit
- [ ] Cursor / infinite older-history pagination
- [ ] Presence (online)
- [ ] Chat @mention → notification
- [x] Rate limits (`throttle:60,1`) + soft deletes on messages
- [ ] Basic denylist
- [ ] Matchday channel visual “live” window (manual setting)
- [x] Loyalty: `social_chat` +1 / day cap 25 via `AwardSocialPoints::forChat`
- [x] Pest: `SocialChatTest`, `SocialPhaseTwoChatTest`

**Exit (product):** Matchday channel feels live; refresh not required for new messages.  
**Exit (this slice):** Working club chat on SQLite without new broadcast deps; new messages appear via ~4s poll.

**Shipped reality:**

| Piece | Location |
| --- | --- |
| Tables | `club_servers`, `channels`, `messages` |
| Models | `ClubServer`, `Channel`, `Message` |
| Actions | `EnsureClubChatRooms`, `SendChatMessage` |
| Service | `ChatService` |
| Routes | `GET /social/chat`, `POST /social/chat/channels/{channel}/messages` |
| UI | `resources/js/pages/Social/Chat/` |
| Realtime | Inertia poll (`realtime.mode = poll`) — Reverb follow-up |

**Env / process notes:** No `REVERB_*` required for this slice. Keep `BROADCAST_CONNECTION=log` (see `.env.example`). When adding Reverb later: install `laravel/reverb`, set `BROADCAST_CONNECTION=reverb`, add `REVERB_*` + `VITE_REVERB_*`, run `php artisan reverb:start` alongside `composer run dev` / Vite.

---

## Phase 2b — Match tickets MVP ✅ Shipped (confirm-purchase)

**Goal:** Browse fixtures and issue stadium entry tickets inside Social.

- [x] `match_fixtures` + `match_tickets` migrations / models / factories
- [x] Confirm-purchase issues `paid` GA ticket (no Stripe)
- [x] `/social/tickets`, `/social/tickets/mine`, ticket detail + QR
- [x] One ticket per user per match · own-ticket policy
- [x] `MatchSeeder` + Pest `SocialMatchTicketsTest`
- [ ] Stripe checkout · seat selection · gate-scan admin · passport wallet tab

**Routes:** `social.tickets.index|mine|show|purchase`

---

## Phase 2c — Stage (live rooms + WebRTC voice MVP) ✅ Shipped (mesh + poll)

**Goal:** X-like live rooms branded **Stage** — create/join/leave/end, host/speaker/listener, in-room text, native WebRTC voice without new paid SaaS or npm/composer deps.

- [x] Tables `stages`, `stage_participants`, `stage_messages`, `stage_signals`
- [x] `/social/stage` lobby + create · `/social/stage/{stage}` room (auto-join when live)
- [x] Roles: host / speaker / listener · raise hand · host promote/demote · mute on stage
- [x] Cap ≤8 speakers (mesh feasibility)
- [x] In-room chat (280) via Inertia; presence via ~3s poll
- [x] Host **Start voice** → native `getUserMedia` + `RTCPeerConnection` mesh; **HTTP poll signaling** (no Reverb)
- [x] Speakers mesh; listeners recvonly toward speakers
- [x] Optimistic UI (Inertia v3 `optimistic()`): create, mute, raise-hand, leave/end, chat send, promote/demote
- [x] Shell nav **Join stage** (sidebar + mobile)
- [x] Pest `SocialStageTest`
- [x] Optional `StageSeeder` (manual only — skips if social off / no onboarded fan)
- [ ] Reverb/Echo push signaling · SFU for large rooms · TURN for strict NAT · recording · moderation console

**Voice status (MVP):** Works in supporting browsers for small rooms on the same LAN / easy NAT (Google STUN). Poll-based SDP/ICE (~1.5s). No SFU — do not expect stadium-scale audience audio reliability.

**Shipped reality:**

| Piece | Location |
| --- | --- |
| Routes | `social.stage.*` |
| Service | `StageService` |
| UI | `resources/js/pages/Social/Stage/*` + `useStageVoice.js` |
| Realtime | Inertia poll + fetch signal poll |

**Try:** onboarded fan → `/social/stage` → **Go live** → **Start voice** → allow mic → second browser user joins as listener / raise hand → host **Invite**.

---

## Phase 3 — Habit & polish (2 weeks)

- [ ] Notifications center
- [ ] Club weekly leaderboard UI
- [ ] Tier flair in feed + chat
- [ ] Mute/block
- [ ] Search users/posts
- [ ] Composer / chat UX hardening, empty states, motion pass
- [ ] Campaign bridge cards → tasks / daily claim

**Exit:** D7 retention experiment ready; design QA checklist green.

---

## Phase 4 — Scale & trust (ongoing)

- [ ] Official club accounts
- [ ] Full Discord threads + reactions
- [ ] DMs
- [ ] Moderation console (Filament/Inertia)
- [ ] Fan-out feed cache if needed
- [ ] PWA / push polish
- [ ] Voice channel placeholders → real voice (re-evaluate vendor)

---

## Implementation order (engineering)

1. Data migrations + models + factories  
2. Policies + services / actions  
3. Inertia pages (Feed before Chat — validates loyalty loop sooner)  
4. Realtime infrastructure  
5. Admin moderation  

## Definition of done (product MVP)

Mad Fan Social MVP is done when:

1. Club onboarding is mandatory and sticky.  
2. Feed feels Twitter-density with posting/likes/replies.  
3. Each club has a usable `#general` + `#matchday` chat.  
4. Social actions write loyalty ledger entries visibly.  
5. Dark “floodlit terrace” UI is consistent across Feed and Chat.  
6. Core flows covered by Pest feature tests.

## Open decisions (track here)

| Topic | Options | Owner decision |
| --- | --- | --- |
| Char limit | 280 vs 500 | **280 for Phase 1** (`FeedService::MAX_BODY_LENGTH`) |
| For You algorithm | Club-weighted chronological vs simple ML later | Chronological hybrid for MVP — **club feed first** |
| Public SEO profiles | on/off | TBD |
| Voice | Stage MVP mesh WebRTC; SFU later | **Phase 2c shipped** (poll signaling) |

---

## Next concrete step

Phase 2 core chat is usable via poll — next: Reverb/Echo push, presence, mentions, denylist, matchday “live” chrome, older-history pagination.
