import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import EventCard from '../components/events/EventCard';
import PostCard from '../components/PostCard';
import ChallengeCard from './ChallengeCard';
import FandomHeader from './FandomHeader';
import FandomNav from './FandomNav';
import LeaderboardExcerpt from './LeaderboardExcerpt';
import MoreSheet from './MoreSheet';
import PollCard from './PollCard';
import PredictionCard from './PredictionCard';
import PulseStrip from './PulseStrip';
import ShowdownCard from './ShowdownCard';
import UpcomingList from './UpcomingList';

function HomeTab({ home, fandomSlug }) {
    if (!home) {
        return null;
    }

    const activities = [
        ...home.predictions.map((prediction) => ({ kind: 'prediction', key: `prediction-${prediction.id}`, prediction })),
        ...home.polls.map((poll) => ({ kind: 'poll', key: `poll-${poll.id}`, poll })),
        ...(home.showdowns ?? []).map((showdown) => ({ kind: 'showdown', key: `showdown-${showdown.id}`, showdown })),
        ...home.challenges.map((challenge) => ({ kind: 'challenge', key: `challenge-${challenge.id}`, challenge })),
    ];

    return (
        <div className="mf-split mf-split--rail mf-fh-split">
            {/*
             * Below lg (see .mf-split's own breakpoint): stacks in DOM order,
             * rail after content. At lg+, inside the `wide` shell, this
             * becomes a real two-column split — standings + fixtures pinned
             * as a persistent rail while the activity stream scrolls.
             */}
            <div className="mf-split__rail mf-split__detail-sticky">
                <LeaderboardExcerpt leaderboard={home.leaderboard} />
                <UpcomingList fixtures={home.upcoming} />
            </div>

            <div className="mf-split__content">
                <PulseStrip pulse={home.pulse} />

                {home.trending ? (
                    <section className="mf-fh-section">
                        <h2 className="mf-fh-section__title">🔥 Trending now</h2>
                        <EventCard event={home.trending} />
                    </section>
                ) : null}

                {activities.length > 0 ? (
                    <section className="mf-fh-section">
                        <h2 className="mf-fh-section__title">⚡ Fan activities</h2>
                        <div className="mf-fh-activity-grid">
                            {activities.map((item) => {
                                if (item.kind === 'prediction') {
                                    return <PredictionCard key={item.key} prediction={item.prediction} />;
                                }
                                if (item.kind === 'poll') {
                                    return <PollCard key={item.key} poll={item.poll} />;
                                }
                                if (item.kind === 'showdown') {
                                    return <ShowdownCard key={item.key} showdown={item.showdown} />;
                                }
                                return <ChallengeCard key={item.key} challenge={item.challenge} />;
                            })}
                        </div>
                    </section>
                ) : null}

                {home.feed.posts.length > 0 ? (
                    <section className="mf-fh-section">
                        <div className="mf-fh-section__head">
                            <h2 className="mf-fh-section__title">💬 Fan feed</h2>
                            <Link href={`/social/fandom/${fandomSlug}?tab=feed`} className="mf-fh-section__more">
                                See all →
                            </Link>
                        </div>
                        <div className="mf-fh-feed-stream">
                            {home.feed.posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function FeedTab({ feedFull }) {
    const posts = feedFull?.posts ?? [];

    return (
        <section className="mf-fh-section">
            <div className="mf-fh-feed-stream">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
                {posts.length === 0 ? <p className="mf-empty">Quiet terrace — nothing posted yet.</p> : null}
            </div>
        </section>
    );
}

function LiveTab({ liveFull }) {
    const cards = liveFull ?? [];

    return (
        <section className="mf-fh-section">
            <div className="mf-fh-live-stream">
                {cards.map((event) => (
                    <EventCard key={event.key} event={event} />
                ))}
                {cards.length === 0 ? <p className="mf-empty">Nothing live right now.</p> : null}
            </div>
        </section>
    );
}

function EventsTab({ eventsFull, predictionsFull }) {
    return (
        <>
            <UpcomingList fixtures={eventsFull ?? []} />
            {predictionsFull?.length > 0 ? (
                <section className="mf-fh-section">
                    <h2 className="mf-fh-section__title">🎯 Predictions</h2>
                    <div className="mf-fh-activity-grid">
                        {predictionsFull.map((prediction) => (
                            <PredictionCard key={prediction.id} prediction={prediction} />
                        ))}
                    </div>
                </section>
            ) : null}
        </>
    );
}

export default function FandomIndex({
    fandom: initialFandom,
    tab,
    home,
    feed_full: feedFull,
    live_full: liveFull,
    events_full: eventsFull,
    predictions_full: predictionsFull,
    more,
}) {
    const [fandom, setFandom] = useState(initialFandom);

    return (
        <SocialShell hideHeader wide>
            <Head title={`${fandom.name} · Fandom`} />

            <div className="mf-page mf-fh">
                <FandomHeader fandom={fandom} onChange={setFandom} />
                <FandomNav active={tab} fandomSlug={fandom.slug} />

                <div className="mf-fh-body">
                    {tab === 'home' ? <HomeTab home={home} fandomSlug={fandom.slug} /> : null}
                    {tab === 'feed' ? <FeedTab feedFull={feedFull} /> : null}
                    {tab === 'live' ? <LiveTab liveFull={liveFull} /> : null}
                    {tab === 'events' ? <EventsTab eventsFull={eventsFull} predictionsFull={predictionsFull} /> : null}
                    {tab === 'more' ? <MoreSheet more={more} fandomSlug={fandom.slug} /> : null}
                </div>
            </div>
        </SocialShell>
    );
}
