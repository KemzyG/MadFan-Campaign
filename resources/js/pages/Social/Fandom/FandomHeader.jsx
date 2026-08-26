import { useMemo, useState } from 'react';
import { socialApi } from '../../../lib/socialApi';

/**
 * A short, stable hash of the slug → a hue (0-359). Deterministic per
 * fandom (same fandom always gets the same colour) and spread out enough
 * that neighbouring categories in an alphabetical list don't land on
 * near-identical hues.
 */
function hueFromSlug(slug) {
    let hash = 0;
    for (let i = 0; i < slug.length; i += 1) {
        hash = (hash << 5) - hash + slug.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash) % 360;
}

/**
 * The cover: who this fandom is, how many fans, and the Join/Following
 * toggle. Answers "who are we?" the instant the hub opens. Each fandom gets
 * its own generated cover — a hue derived from its slug plus its own icon as
 * a giant watermark — so Football, Esports, Cricket etc. are recognisably
 * different rooms rather than the same grey header with different words.
 */
export default function FandomHeader({ fandom, onChange }) {
    const [pending, setPending] = useState(false);
    const hue = useMemo(() => hueFromSlug(fandom.slug), [fandom.slug]);
    const icon = fandom.icon || '🔥';

    function toggleFollow() {
        if (pending) {
            return;
        }

        const next = !fandom.is_following;
        setPending(true);
        onChange({ ...fandom, is_following: next, fan_count: fandom.fan_count + (next ? 1 : -1) });

        socialApi(`/fandoms/${fandom.id}/follow`, { method: next ? 'POST' : 'DELETE' })
            .then((data) => {
                onChange({ ...fandom, is_following: data.following, fan_count: data.fan_count });
            })
            .catch(() => {
                onChange(fandom);
            })
            .finally(() => setPending(false));
    }

    return (
        <header
            className={`mf-fh-cover mf-invert ${fandom.cover_image_url ? 'mf-fh-cover--photo' : ''}`.trim()}
            style={
                fandom.cover_image_url
                    ? { backgroundImage: `url(${fandom.cover_image_url})` }
                    : { '--fh-hue': hue }
            }
        >
            {!fandom.cover_image_url ? (
                <span className="mf-fh-cover__watermark" aria-hidden>
                    {icon}
                </span>
            ) : null}

            <div className="mf-fh-cover__body">
                <div className="mf-fh-cover__crest" aria-hidden>
                    {icon}
                </div>
                <h1 className="mf-fh-cover__name">{fandom.name}</h1>
                <p className="mf-fh-cover__handle mf-mono">@{fandom.slug}</p>
                <p className="mf-fh-cover__count">{fandom.fan_count.toLocaleString()} fans</p>

                <button
                    type="button"
                    className={`mf-btn ${fandom.is_following ? 'mf-btn--ghost' : 'mf-btn--pitch'} mf-fh-cover__join`}
                    onClick={toggleFollow}
                    disabled={pending}
                >
                    {fandom.is_following ? 'Following' : 'Join Fandom'}
                </button>
            </div>
        </header>
    );
}
