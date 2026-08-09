# 05 — Data Model

This extends the existing Mad Fan schema (users, clubs, leagues, loyalty_tiers, point_transactions, etc.). New tables are social-scoped. Field types are implementation guidance, not final SQL.

## Design rules

- Soft deletes where public content may need moderation restore.
- Cursor pagination via `id` / `(created_at, id)`.
- Every social earn writes a **point ledger** row — never mutate `total_points` alone.
- Prefer `club_id` denormalized on posts for feed queries.
- UTF-8 everywhere.

---

## Enums

| Enum | Values |
| --- | --- |
| `post_type` | `status`, `repost`, `quote` |
| `media_type` | `image`, `video`, `gif` |
| `channel_type` | `text`, `announcement`, `voice_placeholder` |
| `message_type` | `text`, `system`, `attachment` |
| `report_target` | `post`, `message`, `user` |
| `report_status` | `open`, `reviewing`, `resolved`, `dismissed` |
| `point_source_type` *(extend)* | `social_post`, `social_like_received`, `social_reply`, `social_chat`, `social_matchday_bonus`, … |
| `notification_type` | `reply`, `mention`, `like`, `repost`, `chat_mention`, `loyalty`, `system` |

---

## Existing entities (reuse)

### users / passports / point_transactions (loyalty identity)

- `users.total_points` — **loyalty score** shown on Social passport
- `passports` — canonical passport row; Social syncs `snapshot_name|handle|club|tier|points|streak|referral_count`
- `point_transactions` — activity ledger; social earns use `social_post`, `social_reply`, `social_like_received`, …

### users (social profile columns)

Add / ensure:

- `favourite_club_id` → `clubs.id` (nullable until onboarding complete)
- `handle` unique (already)
- `bio` nullable (160)
- `banner_path` nullable
- `social_onboarded_at` nullable timestamp

### clubs / leagues / loyalty_tiers / point_transactions

Unchanged core; extend point source enum; optional `clubs.is_social_enabled`.

---

## New tables

### club_memberships

Fans following a club (favourite is also a membership with `is_primary`).

| Column | Type | Notes |
| --- | --- | --- |
| id | pk | |
| user_id | fk users | |
| club_id | fk clubs | |
| is_primary | bool | only one primary per user |
| role | string | `member`, `moderator`, `official` |
| notifications | string | `all`, `mentions`, `muted` |
| created_at / updated_at | | |

Unique `(user_id, club_id)`.

### match_fixtures

Upcoming / live / finished matches for stadium ticketing.

| Column | Type | Notes |
| --- | --- | --- |
| id | pk | |
| home_club_id / away_club_id | fk clubs | |
| kickoff_at | timestamp | |
| venue | string | stadium name |
| status | string | `upcoming`, `live`, `finished` |
| price | decimal(8,2) | GA face value |
| competition | string nullable | e.g. Premier League |
| created_at / updated_at | | |

Index `(status, kickoff_at)`.

### match_tickets

Identity-linked stadium entry pass (one GA ticket per user per match for MVP).

| Column | Type | Notes |
| --- | --- | --- |
| id | pk | |
| user_id | fk users | |
| match_fixture_id | fk match_fixtures | |
| status | string | `pending`, `paid`, `used`, `cancelled` |
| price | decimal | snapshot at purchase |
| section / seat | string nullable | GA section default |
| code | string unique | turnstile / QR payload |
| purchased_at | timestamp nullable | |
| created_at / updated_at | | |

Unique `(user_id, match_fixture_id)`. QR payload: `madfan:ticket:{code}`.

### stages (Phase 2c — Product name: Stage)

| Column | Type | Notes |
| --- | --- | --- |
| id | pk | |
| host_id | fk users | |
| club_id | fk clubs nullable | favourite club at create |
| title | string(80) | |
| status | `live` / `ended` | |
| voice_enabled | bool | host start voice |
| started_at / ended_at | timestamps | |
| created_at / updated_at | | |

URLs: `/social/stage` lobby · `/social/stage/{stage}` room. Nav label: **Join stage**.

### stage_participants

| Column | Type | Notes |
| --- | --- | --- |
| stage_id / user_id | fks | unique pair |
| role | `host` / `speaker` / `listener` | max 8 speakers (mesh voice) |
| is_muted | bool | |
| speak_requested_at | timestamp nullable | |
| joined_at / left_at / last_seen_at | timestamps | |

### stage_messages

`stage_id`, `user_id`, `body` (280), timestamps.

### stage_signals (WebRTC HTTP poll)

`from_user_id`, `to_user_id`, `type` (`offer`/`answer`/`ice`), `payload` json, `consumed_at`.

### follows

| Column | Type |
| --- | --- |
| id | pk |
| follower_id | fk users |
| following_id | fk users |
| created_at | |

Unique `(follower_id, following_id)`. No self-follow.

### blocks / mutes (P1)

Separate tables or typed `user_blocks` with `type` enum `block|mute`.

### posts

| Column | Type | Notes |
| --- | --- | --- |
| id | pk | |
| author_id | fk users | |
| club_id | fk clubs nullable | denormalized primary club at post time |
| type | post_type | |
| body | text | nullable for pure repost |
| reply_to_id | fk posts nullable | |
| root_id | fk posts nullable | thread root for queries |
| quote_of_id | fk posts nullable | |
| repost_of_id | fk posts nullable | |
| likes_count | int unsigned | cached |
| replies_count | int unsigned | |
| reposts_count | int unsigned | |
| quotes_count | int unsigned | |
| views_count | int unsigned | unique viewers cached |
| lang | string(8) nullable | |
| is_hidden | bool | moderation |
| published_at | timestamp | |
| deleted_at | soft | |
| created_at / updated_at | | |

Indexes: `(author_id, id DESC)`, `(club_id, id DESC)`, `(root_id, id)`, `(reply_to_id)`.

### post_views

Unique viewer impressions (exclude author self-views in app logic).

| Column | Type |
| --- | --- |
| id | pk |
| post_id | fk posts |
| user_id | fk users |
| created_at | |

Unique `(post_id, user_id)`. First insert increments `posts.views_count`.

### post_bookmarks

| Column | Type |
| --- | --- |
| id | pk |
| post_id | fk posts |
| user_id | fk users |
| created_at | |

Unique `(post_id, user_id)`.

### post_hides

Durable “Not interested” preference — filtered from that user’s feeds. **Interested** deletes the row.

| Column | Type | Notes |
| --- | --- | --- |
| id | pk | |
| post_id | fk posts | |
| user_id | fk users | |
| reason | string(32) | default `not_interested` |
| created_at | | |

Unique `(post_id, user_id)`.

### post_media

| Column | Type |
| --- | --- |
| id | pk |
| post_id | fk posts |
| type | media_type |
| path | string |
| width / height | int nullable |
| sort_order | tinyint |
| created_at | |

### post_likes

| Column | Type |
| --- | --- |
| id | pk |
| post_id | fk posts |
| user_id | fk users |
| created_at | |

Unique `(post_id, user_id)`.

### club_servers

1:1 with club for Discord metaphor (allows future multi-server).

| Column | Type |
| --- | --- |
| id | pk |
| club_id | fk clubs unique |
| name | string |
| created_at / updated_at | |

### channels

| Column | Type |
| --- | --- |
| id | pk |
| club_server_id | fk |
| slug | string | `general`, `matchday` |
| name | string | display |
| type | channel_type |
| topic | string nullable |
| position | int |
| slowmode_seconds | int default 0 |
| is_read_only | bool |
| created_at / updated_at | |

Unique `(club_server_id, slug)`.

### messages

| Column | Type |
| --- | --- |
| id | pk |
| channel_id | fk |
| author_id | fk users |
| type | message_type |
| body | text |
| reply_to_message_id | fk nullable |
| edited_at | nullable |
| deleted_at | soft |
| created_at / updated_at | |

Index `(channel_id, id DESC)`.

### message_attachments (P1)

path, type, message_id.

### message_reactions (P1)

emoji, message_id, user_id unique triple.

### social_notifications

| Column | Type |
| --- | --- |
| id | pk |
| user_id | fk |
| type | notification_type |
| data | json | actor_id, post_id, etc. |
| read_at | nullable |
| created_at | |

### reports

| Column | Type |
| --- | --- |
| id | pk |
| reporter_id | fk users |
| target_type | report_target |
| target_id | bigint |
| reason | string |
| notes | text nullable |
| status | report_status |
| assigned_to | fk users nullable |
| created_at / updated_at | |

### club_weekly_scores (optional cache)

| Column | Type |
| --- | --- |
| club_id | fk |
| user_id | fk |
| week_start | date |
| points | int |

Unique `(club_id, user_id, week_start)`.

---

## ER summary

```
users ──favourite──▶ clubs
users ◀──follows──▶ users
users ◀──memberships──▶ clubs
clubs ──1:1──▶ club_servers ──▶ channels ──▶ messages
users ──▶ posts ──▶ post_media
posts ◀──likes── users
posts ──reply/quote/repost──▶ posts
```

---

## Migrations plan

1. [x] Alter `users` (favourite_club, bio, banner, social_onboarded_at).
2. [x] `club_memberships` — `follows` still pending.
3. [partial] `posts`, `post_likes` shipped; `post_media` pending.
4. [x] `club_servers`, `channels`, `messages` (Phase 2).
5. [ ] `social_notifications`, `reports`.
6. [x] Seed / auto-provision default channels per club.
7. [x] Extend point source enums / settings for social awards (`social_chat` included).

Factories: `PostFactory`, `PostLikeFactory`, `ClubMembershipFactory` exist. Prefer Pest feature coverage over ad-hoc SQL scripts.

## Implementation status

| Table | Status |
| --- | --- |
| users social columns | Done (Phase 0) |
| club_memberships | Done (Phase 0) |
| follows | Done (Phase 1) |
| posts | Done (Phase 1) |
| post_likes | Done (Phase 1) |
| post_media | Done (Phase 1) |
| social_reports | Done (Phase 1, table name `social_reports`) |
| chat tables | Done (Phase 2 MVP) |
| chat realtime (Reverb) | Follow-up — polling interim |
| match_fixtures | Done (tickets MVP) |
| match_tickets | Done (tickets MVP, confirm-purchase) |
