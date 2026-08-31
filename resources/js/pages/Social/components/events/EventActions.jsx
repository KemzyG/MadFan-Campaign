import { Link } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { socialApi } from '../../../../lib/socialApi';
import { useAuthGate } from '../../authGate';
import { applyOptimisticProps, runSocialMutation, useSocialFlash } from '../../optimistic';
import { formatCount } from '../post/format';
import { setEventInterest } from './eventProps';
import { IconBolt, IconExternal, IconShare } from './icons';

function isExternal(href) {
    return typeof href === 'string' && /^https?:\/\//i.test(href);
}

/**
 * Type-appropriate primary action. Internal paths use an Inertia <Link> so the
 * SPA keeps its state; external destinations open in a new tab.
 */
export function EventCTA({ cta, tone = 'pitch' }) {
    if (!cta?.href || !cta?.label) {
        return null;
    }

    const className = `mf-btn mf-ev-cta mf-ev-cta--${tone}`;

    if (isExternal(cta.href)) {
        return (
            <a className={className} href={cta.href} target="_blank" rel="noopener noreferrer">
                {cta.label}
                <IconExternal />
            </a>
        );
    }

    return (
        <Link className={className} href={cta.href}>
            {cta.label}
        </Link>
    );
}

/**
 * "I'm in" — the one persistent reaction on the events feed. Optimistic against
 * page props, reconciled with the server's authoritative count.
 */
export function InterestButton({ event }) {
    const { reportError } = useSocialFlash();
    const { requireAuth } = useAuthGate();
    const [pending, setPending] = useState(false);

    const active = Boolean(event?.interest?.active);
    const count = event?.interest?.count || 0;

    const toggle = useCallback(async () => {
        if (pending || !event?.key || !requireAuth('join this event')) {
            return;
        }

        setPending(true);
        const next = !active;

        try {
            await runSocialMutation(
                (props) => setEventInterest(props, event.key, {
                    active: next,
                    count: (current) => Math.max(0, current + (next ? 1 : -1)),
                }),
                () => socialApi('/events/interest', {
                    method: next ? 'POST' : 'DELETE',
                    body: { key: event.key, type: event.type },
                }),
                {
                    reportError,
                    errorFallback: 'Could not update your interest — rolled back.',
                    onSuccess: (data) => {
                        // Trust the server's tally over the optimistic delta.
                        if (typeof data?.interest_count === 'number') {
                            applyOptimisticProps((props) => setEventInterest(props, event.key, {
                                active: Boolean(data.interested),
                                count: data.interest_count,
                            }));
                        }
                    },
                },
            );
        } catch {
            // runSocialMutation already rolled back and flashed.
        } finally {
            setPending(false);
        }
    }, [active, event?.key, event?.type, pending, reportError, requireAuth]);

    return (
        <button
            type="button"
            className={`mf-ev-interest${active ? ' is-active' : ''}`}
            onClick={toggle}
            aria-pressed={active}
            aria-label={active ? "You're in — tap to remove" : "I'm in"}
        >
            <IconBolt filled={active} />
            <span>{active ? "You're in" : "I'm in"}</span>
            {count > 0 ? <b>{formatCount(count)}</b> : null}
        </button>
    );
}

/**
 * Native share when available, clipboard otherwise. Share URLs are relative
 * paths (the feed may be served from a different origin than the app), so they
 * are resolved against the current origin before sharing.
 */
export function ShareButton({ share, headline }) {
    const { reportSuccess, reportError } = useSocialFlash();

    const onShare = useCallback(async () => {
        const path = share?.url || '/social';
        const url = typeof window !== 'undefined' ? new URL(path, window.location.origin).toString() : path;
        const title = share?.title || headline || 'Mad Fan';

        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title, url });

                return;
            }

            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                reportSuccess?.('Link copied.');

                return;
            }

            reportError?.('Sharing is not available on this device.');
        } catch (error) {
            // A user dismissing the native sheet is not a failure.
            if (error?.name !== 'AbortError') {
                reportError?.('Could not share that link.');
            }
        }
    }, [headline, reportError, reportSuccess, share?.title, share?.url]);

    return (
        <button type="button" className="mf-ev-share" onClick={onShare} aria-label="Share">
            <IconShare />
        </button>
    );
}

/** The action row every template gets: CTA, interest, share. */
export default function EventActions({ event, tone }) {
    return (
        <div className="mf-ev-actions">
            <EventCTA cta={event.cta} tone={tone} />
            <div className="mf-ev-actions__right">
                <InterestButton event={event} />
                <ShareButton share={event.share} headline={event.headline} />
            </div>
        </div>
    );
}
