import Crest from '../components/Crest';
import { formatKickoff } from '../components/StadiumTicket';

function StatusBadge({ match }) {
    if (match.status === 'live') {
        return <span className="mf-fixture-badge mf-fixture-badge--live">Live</span>;
    }
    if (match.status === 'finished') {
        return <span className="mf-fixture-badge">FT</span>;
    }
    return (
        <span className="mf-fixture-badge mf-fixture-badge--kick mf-mono">
            {formatKickoff(match.kickoff_at, 'short')}
        </span>
    );
}

function priceChip(match) {
    if (match.owned) {
        return <span className="mf-ticket-chip mf-ticket-chip--owned mf-mono">Owned</span>;
    }
    if (match.status === 'upcoming' && match.purchasable) {
        return <span className="mf-fixture-row__price mf-mono">£{match.price}</span>;
    }
    return null;
}

/**
 * Compact, selectable fixture row for the master list. Selecting it raises the
 * detail pane; purchasing happens there.
 */
export default function FixtureRow({ match, selected, onSelect }) {
    return (
        <button
            type="button"
            className={[
                'mf-fixture-row',
                selected ? 'is-selected' : '',
                match.status === 'live' ? 'is-live' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            aria-pressed={selected}
            onClick={() => onSelect(match)}
        >
            <span className="mf-fixture-row__top">
                <span className="mf-fixture-row__comp mf-text-caption">
                    {match.competition || 'Matchday'}
                </span>
                <StatusBadge match={match} />
            </span>

            <span className="mf-fixture-row__sides">
                <span className="mf-fixture-row__side">
                    <Crest club={match.home} size="sm" />
                    <span className="mf-fixture-row__team">{match.home?.short || match.home?.name}</span>
                </span>
                <span className="mf-fixture-row__vs mf-mono" aria-hidden>vs</span>
                <span className="mf-fixture-row__side mf-fixture-row__side--away">
                    <span className="mf-fixture-row__team">{match.away?.short || match.away?.name}</span>
                    <Crest club={match.away} size="sm" />
                </span>
            </span>

            <span className="mf-fixture-row__foot">
                <span className="mf-fixture-row__venue mf-text-micro">{match.venue}</span>
                {priceChip(match)}
            </span>
        </button>
    );
}
