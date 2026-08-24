import BreakingNewsCard from './templates/BreakingNewsCard';
import CampaignCard from './templates/CampaignCard';
import ConcertCard from './templates/ConcertCard';
import FanChallengeCard from './templates/FanChallengeCard';
import LiveEventCard from './templates/LiveEventCard';
import LiveMatchCard from './templates/LiveMatchCard';
import LivestreamCard from './templates/LivestreamCard';
import NewEpisodeCard from './templates/NewEpisodeCard';
import SongReleaseCard from './templates/SongReleaseCard';
import TournamentCard from './templates/TournamentCard';

/**
 * type → template. Each of the ten kinds owns its own component, so this map is
 * the whole dispatcher; adding a kind means adding a template and one line here.
 */
const TEMPLATES = {
    live_match: LiveMatchCard,
    tournament: TournamentCard,
    livestream: LivestreamCard,
    live_event: LiveEventCard,
    new_episode: NewEpisodeCard,
    campaign: CampaignCard,
    fan_challenge: FanChallengeCard,
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
