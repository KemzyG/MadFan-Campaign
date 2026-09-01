import BreakingNewsCard from './templates/BreakingNewsCard';
import ConcertCard from './templates/ConcertCard';
import FanChallengeCard from './templates/FanChallengeCard';
import LiveEventCard from './templates/LiveEventCard';
import LiveMatchCard from './templates/LiveMatchCard';
import LivestreamCard from './templates/LivestreamCard';
import NewEpisodeCard from './templates/NewEpisodeCard';
import ShowdownCard from './templates/ShowdownCard';
import SongReleaseCard from './templates/SongReleaseCard';
import TournamentCard from './templates/TournamentCard';
import VoteCard from './templates/VoteCard';

/**
 * type → template. Each kind owns its own component, so this map is the whole
 * dispatcher; adding a kind means adding a template and one line here.
 * campaign and fan_challenge share a template — both are just admin-authored
 * Task rows (see TaskFeedProvider), told apart only by the byline/CTA that
 * EventShell already derives from event.type.
 */
const TEMPLATES = {
    live_match: LiveMatchCard,
    tournament: TournamentCard,
    livestream: LivestreamCard,
    live_event: LiveEventCard,
    new_episode: NewEpisodeCard,
    campaign: FanChallengeCard,
    fan_challenge: FanChallengeCard,
    showdown: ShowdownCard,
    vote: VoteCard,
    concert: ConcertCard,
    song_release: SongReleaseCard,
    breaking_news: BreakingNewsCard,
};

/**
 * Renders one events-feed card through its type's template. An unknown type is
 * dropped rather than rendered raw — a new backend kind shipping ahead of its
 * template should be invisible, not broken.
 */
export default function EventCard({ event }) {
    const Template = TEMPLATES[event?.type];

    if (!Template) {
        return null;
    }

    return <Template event={event} />;
}
