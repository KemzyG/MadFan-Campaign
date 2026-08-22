/**
 * Terrace-night skeleton placeholders for Social navigation / deferred props.
 * Use for initial / waiting loads only — keep optimistic UI for mutations.
 */

function Bone({ className = '', style }) {
    return <span className={`mf-skel-bone ${className}`.trim()} style={style} aria-hidden />;
}

export function PostCardSkeleton({ compact = false }) {
    return (
        <article className={`mf-skel-post ${compact ? 'mf-skel-post--compact' : ''}`} aria-hidden>
            <Bone className="mf-skel-post__avatar" />
            <div className="mf-skel-post__main">
                <div className="mf-skel-post__meta">
                    <Bone className="mf-skel-line mf-skel-line--name" />
                    <Bone className="mf-skel-line mf-skel-line--time" />
                </div>
                <Bone className="mf-skel-line mf-skel-line--body" />
                <Bone className="mf-skel-line mf-skel-line--body-short" />
                {!compact ? (
                    <div className="mf-skel-post__actions">
                        <Bone className="mf-skel-chip" />
                        <Bone className="mf-skel-chip" />
                        <Bone className="mf-skel-chip" />
                        <Bone className="mf-skel-chip" />
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export function FeedSkeleton({ count = 4, includeToolbar = true }) {
    return (
        <div className="mf-skel-page mf-skel-feed" aria-busy="true" aria-label="Loading feed">
            {includeToolbar ? (
                <div className="mf-skel-feed__toolbar">
                    <Bone className="mf-skel-segment" />
                    <Bone className="mf-skel-chip mf-skel-chip--wide" />
                </div>
            ) : null}
            <div className="mf-skel-club">
                <Bone className="mf-skel-club__crest" />
                <div className="mf-skel-club__meta">
                    <Bone className="mf-skel-line mf-skel-line--caption" />
                    <Bone className="mf-skel-line mf-skel-line--title" />
                </div>
            </div>
            <div className="mf-skel-feed__stream">
                {Array.from({ length: count }, (_, index) => (
                    <div
                        key={index}
                        className="mf-skel-feed__item"
                        style={{ '--mf-skel-stagger': `${index * 45}ms` }}
                    >
                        <PostCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChatSkeleton({ rows = 6 }) {
    return (
        <div className="mf-skel-page mf-skel-chat" aria-busy="true" aria-label="Loading chat">
            <div className="mf-skel-chat__header">
                <Bone className="mf-skel-club__crest mf-skel-club__crest--sm" />
                <div className="mf-skel-club__meta">
                    <Bone className="mf-skel-line mf-skel-line--title" />
                    <Bone className="mf-skel-line mf-skel-line--caption" />
                </div>
            </div>
            <div className="mf-skel-chat__search">
                <Bone className="mf-skel-line mf-skel-line--body" />
            </div>
            <div className="mf-skel-chat__channels">
                <Bone className="mf-skel-pill" />
                <Bone className="mf-skel-pill" />
                <Bone className="mf-skel-pill" />
            </div>
            <div className="mf-skel-chat__stream">
                {Array.from({ length: rows }, (_, index) => (
                    <div
                        key={index}
                        className={`mf-skel-chat-row ${index % 3 === 1 ? 'is-grouped' : ''}`}
                        style={{ '--mf-skel-stagger': `${index * 40}ms` }}
                    >
                        {index % 3 === 1 ? (
                            <span className="mf-skel-chat-row__gutter" />
                        ) : (
                            <Bone className="mf-skel-chat-row__avatar" />
                        )}
                        <div className="mf-skel-chat-row__body">
                            {index % 3 !== 1 ? (
                                <div className="mf-skel-chat-row__meta">
                                    <Bone className="mf-skel-line mf-skel-line--name" />
                                    <Bone className="mf-skel-line mf-skel-line--time" />
                                </div>
                            ) : null}
                            <Bone
                                className="mf-skel-line mf-skel-line--chat"
                                style={{ width: `${58 + ((index * 17) % 32)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mf-skel-chat__composer">
                <Bone className="mf-skel-composer-input" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
            </div>
        </div>
    );
}

export function TicketStubSkeleton() {
    return (
        <article className="mf-skel-ticket" aria-hidden>
            <span className="mf-skel-ticket__perf" />
            <div className="mf-skel-ticket__league">
                <Bone className="mf-skel-line mf-skel-line--caption" />
                <Bone className="mf-skel-line mf-skel-line--time" />
            </div>
            <div className="mf-skel-ticket__sides">
                <div className="mf-skel-ticket__side">
                    <Bone className="mf-skel-ticket__crest" />
                    <Bone className="mf-skel-line mf-skel-line--name" />
                </div>
                <Bone className="mf-skel-ticket__vs" />
                <div className="mf-skel-ticket__side mf-skel-ticket__side--away">
                    <Bone className="mf-skel-ticket__crest" />
                    <Bone className="mf-skel-line mf-skel-line--name" />
                </div>
            </div>
            <div className="mf-skel-ticket__meta">
                <Bone className="mf-skel-line mf-skel-line--body-short" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
            </div>
        </article>
    );
}

export function TicketListSkeleton({ count = 3 }) {
    return (
        <div className="mf-skel-page mf-skel-tickets" aria-busy="true" aria-label="Loading tickets">
            <div className="mf-skel-page-links">
                <Bone className="mf-skel-chip" />
                <Bone className="mf-skel-chip" />
            </div>
            <div className="mf-skel-ticket-list">
                {Array.from({ length: count }, (_, index) => (
                    <div key={index} style={{ '--mf-skel-stagger': `${index * 55}ms` }}>
                        <TicketStubSkeleton />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function TicketWalletSkeleton({ count = 2 }) {
    return (
        <div className="mf-skel-page mf-skel-tickets" aria-busy="true" aria-label="Loading wallet">
            <div className="mf-skel-wallet">
                {Array.from({ length: count }, (_, index) => (
                    <div
                        key={index}
                        className="mf-skel-wallet__stub"
                        style={{ '--mf-skel-stagger': `${index * 60}ms` }}
                    >
                        <Bone className="mf-skel-wallet__face" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ShopMallSkeleton({ count = 9 }) {
    return (
        <div className="mf-skel-page mf-skel-shop" aria-busy="true" aria-label="Loading store">
            <div className="mf-skel-shop__hero">
                <Bone className="mf-skel-shop__hero-bg" />
                <div className="mf-skel-shop__hero-inner">
                    <Bone className="mf-skel-shop__hero-carousel" />
                </div>
            </div>
            <div className="mf-skel-shop__featured">
                <div className="mf-skel-shop__featured-rail">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Bone
                            key={index}
                            className="mf-skel-shop__featured-card"
                            style={{ '--mf-skel-stagger': `${index * 40}ms` }}
                        />
                    ))}
                </div>
            </div>
            <div className="mf-skel-shop__toolbar">
                <Bone className="mf-skel-shop__filter" />
                <Bone className="mf-skel-chip mf-skel-chip--wide" />
            </div>
            <div className="mf-skel-shop__segment">
                <Bone className="mf-skel-segment" />
            </div>
            <div className="mf-skel-shop__browse">
                <Bone className="mf-skel-line mf-skel-line--caption" />
                <Bone className="mf-skel-chip mf-skel-chip--wide" />
            </div>
            <div className="mf-skel-shop__grid">
                {Array.from({ length: count }, (_, index) => (
                    <article
                        key={index}
                        className="mf-skel-shop-card"
                        style={{ '--mf-skel-stagger': `${index * 45}ms` }}
                        aria-hidden
                    >
                        <Bone className="mf-skel-shop-card__media" />
                        <div className="mf-skel-shop-card__body">
                            <Bone className="mf-skel-line mf-skel-line--caption" />
                            <Bone className="mf-skel-line mf-skel-line--title" />
                            <Bone className="mf-skel-line mf-skel-line--body-short" />
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export function StageLobbySkeleton({ count = 3 }) {
    return (
        <div className="mf-skel-page mf-skel-stage-lobby" aria-busy="true" aria-label="Loading stage">
            <div className="mf-skel-stage-actions">
                <Bone className="mf-skel-chip" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
            </div>
            <div className="mf-skel-stage-create mf-skel-stage-create--panel">
                <Bone className="mf-skel-line mf-skel-line--caption" />
                <Bone className="mf-skel-line mf-skel-line--title" />
                <div className="mf-skel-stage-create__row">
                    <Bone className="mf-skel-composer-input" />
                    <Bone className="mf-skel-chip mf-skel-chip--btn" />
                </div>
            </div>
            <div className="mf-skel-stage-list">
                <div className="mf-skel-stage-board-head">
                    <Bone className="mf-skel-line mf-skel-line--caption" />
                    <Bone className="mf-skel-chip" />
                </div>
                {Array.from({ length: count }, (_, index) => (
                    <div
                        key={index}
                        className="mf-skel-stage-row"
                        style={{ '--mf-skel-stagger': `${index * 50}ms` }}
                    >
                        <Bone className="mf-skel-stage-row__dot" />
                        <div className="mf-skel-stage-row__body">
                            <div className="mf-skel-stage-row__chips">
                                <Bone className="mf-skel-chip" />
                                <Bone className="mf-skel-chip" />
                            </div>
                            <Bone className="mf-skel-line mf-skel-line--title" />
                            <div className="mf-skel-stage-row__host">
                                <Bone className="mf-skel-chat-row__avatar" />
                                <Bone className="mf-skel-line mf-skel-line--caption" />
                            </div>
                            <Bone className="mf-skel-line mf-skel-line--body-short" />
                        </div>
                        <Bone className="mf-skel-chip" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StageRoomSkeleton() {
    return (
        <div className="mf-skel-page mf-skel-stage-room" aria-busy="true" aria-label="Loading stage room">
            <div className="mf-skel-stage-room__head">
                <div className="mf-skel-stage-room__status">
                    <Bone className="mf-skel-line mf-skel-line--caption" />
                    <Bone className="mf-skel-chip" />
                </div>
                <Bone className="mf-skel-line mf-skel-line--display" />
                <div className="mf-skel-stage-row__host">
                    <Bone className="mf-skel-chat-row__avatar" />
                    <Bone className="mf-skel-line mf-skel-line--body-short" />
                </div>
            </div>
            <div className="mf-skel-stage-grid">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="mf-skel-stage-person">
                        <Bone className="mf-skel-stage-person__avatar" />
                        <Bone className="mf-skel-line mf-skel-line--name" />
                        <Bone className="mf-skel-line mf-skel-line--caption" />
                    </div>
                ))}
            </div>
            <div className="mf-skel-stage-controls">
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
            </div>
            <div className="mf-skel-stage-chat">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="mf-skel-chat-row" style={{ '--mf-skel-stagger': `${index * 35}ms` }}>
                        <Bone className="mf-skel-chat-row__avatar" />
                        <div className="mf-skel-chat-row__body">
                            <Bone className="mf-skel-line mf-skel-line--chat" style={{ width: `${62 + index * 8}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PassportSkeleton() {
    return (
        <div className="mf-skel-page mf-skel-passport" aria-busy="true" aria-label="Loading passport">
            <div className="mf-skel-passport__card">
                <Bone className="mf-skel-passport__face" />
            </div>
            <div className="mf-skel-passport__grid">
                {Array.from({ length: 6 }, (_, index) => (
                    <Bone key={index} className="mf-skel-passport__stat" />
                ))}
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="mf-skel-page mf-skel-profile" aria-busy="true" aria-label="Loading profile">
            <div className="mf-skel-profile__hero">
                <Bone className="mf-skel-profile__avatar" />
                <div className="mf-skel-profile__meta">
                    <Bone className="mf-skel-line mf-skel-line--caption" />
                    <Bone className="mf-skel-line mf-skel-line--display" />
                    <Bone className="mf-skel-line mf-skel-line--body" />
                    <div className="mf-skel-profile__chips">
                        <Bone className="mf-skel-chip" />
                        <Bone className="mf-skel-chip" />
                        <Bone className="mf-skel-chip" />
                    </div>
                </div>
            </div>
            <div className="mf-skel-profile__stats">
                <Bone className="mf-skel-profile__stat" />
                <Bone className="mf-skel-profile__stat" />
                <Bone className="mf-skel-profile__stat" />
            </div>
            <div className="mf-skel-feed__stream">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton compact />
            </div>
        </div>
    );
}

export function PostShowSkeleton() {
    return (
        <div className="mf-skel-page mf-skel-thread" aria-busy="true" aria-label="Loading thread">
            <PostCardSkeleton />
            <div className="mf-skel-thread__reply">
                <Bone className="mf-skel-composer-input" />
                <Bone className="mf-skel-chip mf-skel-chip--btn" />
            </div>
            <div className="mf-skel-feed__stream">
                <PostCardSkeleton compact />
                <PostCardSkeleton compact />
                <PostCardSkeleton compact />
            </div>
        </div>
    );
}

export function ComposeSkeleton() {
    return (
        <div className="mf-skel-compose" aria-busy="true" aria-label="Loading composer">
            <Bone className="mf-skel-post__avatar" />
            <div className="mf-skel-compose__main">
                <Bone className="mf-skel-composer-input mf-skel-composer-input--tall" />
                <div className="mf-skel-compose__bar">
                    <Bone className="mf-skel-chip" />
                    <Bone className="mf-skel-chip mf-skel-chip--btn" />
                </div>
            </div>
        </div>
    );
}

/**
 * @param {string} pathname
 * @returns {'feed'|'chat'|'tickets'|'wallet'|'ticket'|'stage'|'stage-room'|'passport'|'profile'|'thread'|'generic'}
 */
export function resolveSocialSkeletonKind(pathname) {
    const path = String(pathname || '').split('?')[0].replace(/\/+$/, '') || '/';

    if (path === '/social') {
        return 'feed';
    }
    if (path.startsWith('/social/posts/')) {
        return 'thread';
    }
    if (path === '/social/chat' || path.startsWith('/social/chat/')) {
        return 'chat';
    }
    if (path === '/social/videos' || path.startsWith('/social/videos/')) {
        return 'reels';
    }
    if (path === '/social/fixtures' || path.startsWith('/social/fixtures/')) {
        return 'fixtures';
    }
    if (path === '/social/tickets/mine') {
        return 'wallet';
    }
    if (/^\/social\/tickets\/\d+/.test(path)) {
        return 'ticket';
    }
    if (path === '/social/tickets' || path.startsWith('/social/tickets/')) {
        return 'tickets';
    }
    if (path === '/social/shop' || path.startsWith('/social/shop/')) {
        return 'shop';
    }
    if (/^\/social\/stage\/[^/]+/.test(path)) {
        return 'stage-room';
    }
    if (path === '/social/stage') {
        return 'stage';
    }
    if (path === '/social/passport') {
        return 'passport';
    }
    if (path.startsWith('/social/u/')) {
        return 'profile';
    }

    return 'generic';
}

function ReelsSkeleton() {
    return (
        <div className="mf-page mf-reels-page" aria-busy="true" aria-label="Loading reels">
            <div
                className="mf-reels-scroller"
                style={{ background: 'color-mix(in srgb, var(--mf-panel) 70%, transparent)' }}
            >
                <div className="mf-reel-slide-wrap">
                    <div className="mf-skel-block" style={{ width: '100%', height: '100%', minHeight: 'min(72dvh, 640px)' }} />
                </div>
            </div>
        </div>
    );
}

export function SocialPageSkeleton({ kind = 'generic' }) {
    switch (kind) {
        case 'feed':
            return <FeedSkeleton />;
        case 'reels':
            return <ReelsSkeleton />;
        case 'chat':
            return <ChatSkeleton />;
        case 'tickets':
        case 'fixtures':
            return <TicketListSkeleton />;
        case 'shop':
            return <ShopMallSkeleton />;
        case 'wallet':
        case 'ticket':
            return <TicketWalletSkeleton />;
        case 'stage':
            return <StageLobbySkeleton />;
        case 'stage-room':
            return <StageRoomSkeleton />;
        case 'passport':
            return <PassportSkeleton />;
        case 'profile':
            return <ProfileSkeleton />;
        case 'thread':
            return <PostShowSkeleton />;
        default:
            return <FeedSkeleton count={3} includeToolbar={false} />;
    }
}

/**
 * Whether an Inertia visit should swap the Social main pane for a skeleton.
 * Skips mutations (optimistic UI), partial reloads / polls, and prefetch.
 *
 * @param {*} visit
 */
export function shouldShowSocialNavSkeleton(visit) {
    if (!visit) {
        return false;
    }

    const method = String(visit.method || 'get').toLowerCase();
    if (method !== 'get') {
        return false;
    }

    if (visit.prefetch) {
        return false;
    }

    if (Array.isArray(visit.only) && visit.only.length > 0) {
        return false;
    }

    try {
        const url = typeof visit.url === 'string' ? visit.url : String(visit.url || '');
        const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
        return path === '/social' || path.startsWith('/social/');
    } catch {
        return false;
    }
}

export function visitPathname(visit) {
    try {
        const url = typeof visit?.url === 'string' ? visit.url : String(visit?.url || '');
        if (url.startsWith('http')) {
            return new URL(url).pathname;
        }
        return url.split('?')[0] || '/';
    } catch {
        return '/';
    }
}
