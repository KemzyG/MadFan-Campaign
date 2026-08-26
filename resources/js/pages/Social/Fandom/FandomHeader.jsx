import { useState } from 'react';
import { socialApi } from '../../../lib/socialApi';

/**
 * The cover: who this fandom is, how many fans, and the Join/Following
 * toggle. Answers "who are we?" the instant the hub opens.
 */
export default function FandomHeader({ fandom, onChange }) {
    const [pending, setPending] = useState(false);

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
        <header className="mf-fh-cover">
            <div className="mf-fh-cover__crest" aria-hidden>
                ⚽
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
        </header>
    );
}
