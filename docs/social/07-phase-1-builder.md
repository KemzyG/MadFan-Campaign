# 07 — Phase 1 Builder Guide

Actionable contract for engineers continuing the Feed MVP. Complements [03 — Features](./03-features.md), [04 — Architecture](./04-architecture.md), and [05 — Data Model](./05-data-model.md).

## Auth & gating (do not bypass)

Every feed mutation and page sits behind:

1. `auth` (session)
2. `verified` (email)
3. `social.enabled` → redirects away when `social_network_enabled` is false
4. `social.onboarded` → requires `social_onboarded_at` + `favourite_club_id`

Onboarding (outside `social.onboarded` but still `social.enabled`):

| Method | Path | Name |
| --- | --- | --- |
| GET | `/social/onboarding/club` | `social.onboarding.club` |
| POST | `/social/onboarding/club` | `social.onboarding.club.store` |

## Phase 1 routes

| Method | Path | Name | Notes |
| --- | --- | --- | --- |
| GET | `/social` | `social.home` | Club / Following (`?mode=`) |
| GET | `/social/passport` | `social.passport` | **Identity** — score, club, records, ledger |
| GET | `/social/u/{handle}` | `social.profile` | Public profile + posts tab |
| POST/DELETE | `/social/users/{user}/follow` | `social.users.follow` / `unfollow` | |
| POST | `/social/posts` | `social.posts.store` | Text + up to 4 images |
| GET | `/social/posts/{post}` | `social.posts.show` | Root thread + replies |
| DELETE | `/social/posts/{post}` | `social.posts.destroy` | Soft delete own |
| POST | `/social/posts/{post}/replies` | `social.posts.replies.store` | |
| POST | `/social/posts/{post}/repost` | `social.posts.repost` | |
| POST | `/social/posts/{post}/quote` | `social.posts.quote` | |
| POST | `/social/posts/{post}/report` | `social.posts.report` | Hides from reporter |
| POST/DELETE | `/social/posts/{post}/like` | `social.posts.like` / `unlike` | Awards author on like |
| POST/DELETE | `/social/posts/{post}/bookmark` | `social.posts.bookmark` / `unbookmark` | Viewer saves |
| POST/DELETE | `/social/posts/{post}/not-interested` | `social.posts.not-interested` / `interested` | Hide / restore in feed |

## Compose UX (Home)

- Club / Following stay as feed segments only — compose is **not** inline atop the stream.
- Header **Post** chip + floating **FAB** open a bottom-sheet modal composer (text + media).
- Empty states invite compose via the same sheet.

## Post overflow menu (`⋯`)

Accessible menu (`aria-haspopup` / `aria-expanded`, Escape + click-outside): Bookmark, Copy link, Follow/Unfollow (others), Not interested / Interested, Report (others), Delete (own).

## Engagement metrics

Each card shows icons + counts for replies, likes, reposts, and **views**. Views use unique `(post_id, user_id)` in `post_views`, incremented on PostShow and once per viewer on feed impression (authors excluded). Cached on `posts.views_count`.

## Preferences durability

- **Not interested** → `post_hides` row; filtered from Club/Following/profile feeds (alongside reports).
- **Interested** → deletes that hide so the post can reappear.
- **Bookmark** → `post_bookmarks` (save for later; does not hide).

## Code map

| Concern | Path |
| --- | --- |
| Create / reply (+ media) | `App\Actions\Social\CreateSocialPost` |
| Points | `App\Actions\Social\AwardSocialPoints` |
| Passport identity | `App\Services\Social\SocialPassportService` + `SocialPassportController` |
| Repost / quote | `RepostSocialPost`, `QuoteSocialPost` |
| Unique views | `App\Actions\Social\RecordPostView` |
| Feed queries + presenters | `App\Services\Social\FeedService` |
| Controllers | `Inertia/Social/Social*` |
| AuthZ | `App\Policies\PostPolicy` |
| Models | `Post`, `PostLike`, `PostMedia`, `PostBookmark`, `PostHide`, `PostView`, `Follow`, `SocialReport` |

## Loyalty awards (shipped)

| Source | Points | Cap / day |
| --- | --- | --- |
| `social_post` | +5 | 3 |
| `social_reply` (≥20 chars) | +2 | 10 |
| `social_like_received` | +1 | 50 |

Writes `point_transactions` + increments `users.total_points`, then `SocialPassportService::syncSnapshot`. Idempotent via `idempotency_key`. Enum extended on `source_type`.

## Passport identity (shipped)

- Route: `GET /social/passport` → `Social/Passport`
- Payload: `identity`, `loyalty` (points, social subset, tier, streak, earn rules), `records`, `activity`, `passport` (snapshot + campaign URL)
- Same loyalty as campaign: **do not** add a second score field
- Shell nav prioritises Passport; footer chip links there

Pest: `SocialPassportTest` — post earns points → passport shows activity; onboarding syncs snapshot club.

## Acceptance criteria

Pest: `SocialPhaseOneFeedTest` + `SocialPhaseOneExtendedTest` + `SocialPassportTest` + `SocialFeedEngagementTest`

- [x] Club feed, create, 280 limit, like/unlike, reply thread, soft delete
- [x] Following feed + follow
- [x] Post / reply / like point awards + caps
- [x] Report hides from reporter
- [x] Repost + quote
- [x] Profile posts tab
- [x] Image attach (stored on `public` disk)
- [x] Social passport loyalty + ledger after engage
- [x] Onboarding updates passport snapshot club
- [x] Compose via FAB / Post sheet (not inline feed composer)
- [x] Post overflow menu (report, delete, bookmark, follow, not interested)
- [x] Views + engagement counts on cards

## Remaining Phase 1 polish (optional)

- [ ] Optimistic likes (Inertia `router.optimistic`)
- [ ] Body denylist config
- [ ] Profile: replies / media tabs
- [ ] Flash points earned after post
- [ ] Richer report reasons UI
- [ ] Passport weekly club rank board
- [ ] Bookmarks list page

## Manual QA checklist

- [ ] `npm run dev` or `npm run build` after Social JS changes
- [ ] Enable `social_network_enabled`
- [ ] Two verified users, same club: A posts (with image), B likes + replies + follow; A sees points
- [ ] FAB / Post chip opens sheet composer; Club/Following tabs unchanged
- [ ] Overflow ⋯: report / delete / bookmark / follow / not interested
- [ ] Views increment once per viewer on thread + feed
- [ ] Reported or not-interested post disappears from reporter’s Club feed
