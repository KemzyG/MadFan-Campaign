import Crest from '../components/Crest';
import { formatKickoff } from '../components/StadiumTicket';

/**
 * Compact, selectable box-office row. Selecting it raises the checkout detail;
 * the actual purchase happens there.
 */
export default function MatchRow({ match, selected, onSelect }) {
    return (
        <button
            type="button"
            className={['mf-ticket-row', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
            aria-pressed={selected}
            onClick={() => onSelect(match)}
        >
            <span className="mf-ticket-row__top">
                <span className="mf-ticket-row__comp mf-text-caption">
                    {match.competition || 'Matchday'}
                </span>
                <span className="mf-ticket-row__kick mf-mono mf-text-micro">
                    {formatKickoff(match.kickoff_at, 'short')}
                </span>
            </span>

            <span className="mf-ticket-row__sides">
                <span className="mf-ticket-row__side">
                    <Crest club={match.home} size="sm" />
                    <span className="mf-ticket-row__team">{match.home?.short || match.home?.name}</span>
                </span>
                <span className="mf-ticket-row__vs mf-mono" aria-hidden>vs</span>
                <span className="mf-ticket-row__side mf-ticket-row__side--away">
                    <span className="mf-ticket-row__team">{match.away?.short || match.away?.name}</span>
                    <Crest club={match.away} size="sm" />
                </span>
            </span>

            <span className="mf-ticket-row__foot">
                <span className="mf-ticket-row__venue mf-text-micro">{match.venue}</span>
                {match.owned ? (
                    <span className="mf-ticket-chip mf-ticket-chip--owned mf-mono">Owned</span>
                ) : (
                    <span className="mf-ticket-row__price mf-mono">£{match.price}</span>
                )}
            </span>
        </button>
    );
}
