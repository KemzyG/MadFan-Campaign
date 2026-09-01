<?php

namespace App\Enums;

use App\Models\SocialAnnouncement;

/**
 * The ten "what's happening NOW" kinds rendered on the Social events feed.
 *
 * Seven are read-only projections over models that already exist (fixtures,
 * stages, highlights, seasons, tasks). The three editorial kinds — concert,
 * song release, breaking news — have no natural source and are authored as
 * {@see SocialAnnouncement} rows.
 *
 * Each case maps 1:1 to its own React template + stylesheet on the client.
 */
enum EventType: string
{
    case LiveMatch = 'live_match';
    case Livestream = 'livestream';
    case LiveEvent = 'live_event';
    case Tournament = 'tournament';
    case NewEpisode = 'new_episode';
    case Campaign = 'campaign';
    case FanChallenge = 'fan_challenge';
    case Showdown = 'showdown';
    case Vote = 'vote';
    case Concert = 'concert';
    case SongRelease = 'song_release';
    case BreakingNews = 'breaking_news';

    /** Overline printed on the card — the "bot" byline for this kind. */
    public function label(): string
    {
        return match ($this) {
            self::LiveMatch => 'Live match',
            self::Livestream => 'Creator livestream',
            self::LiveEvent => 'Live event',
            self::Tournament => 'Tournament',
            self::NewEpisode => 'New episode',
            self::Campaign => 'Campaign',
            self::FanChallenge => 'Fan challenge',
            self::Showdown => 'Fan showdown',
            // Not "Fan vote": a poll is a question with multiple options,
            // distinct from the head-to-head, one-on-one fan showdown above
            // — see PollEventProvider / TaskFeedProvider doc comments.
            self::Vote => 'Fan poll',
            self::Concert => 'Concert',
            self::SongRelease => 'New song',
            self::BreakingNews => 'Breaking news',
        };
    }

    /** Default primary-CTA copy; a provider may override it per item. */
    public function ctaLabel(): string
    {
        return match ($this) {
            self::LiveMatch => 'Watch',
            self::Livestream => 'Join',
            self::LiveEvent => 'Join',
            self::Tournament => 'View table',
            self::NewEpisode => 'Watch',
            self::Campaign => 'Join campaign',
            self::FanChallenge => 'Join challenge',
            self::Showdown => 'Vote now',
            self::Vote => 'Answer poll',
            self::Concert => 'Get tickets',
            self::SongRelease => 'Listen',
            self::BreakingNews => 'Read',
        };
    }

    /**
     * Editorially-authored kinds, stored in `social_announcements`.
     *
     * @return list<self>
     */
    public static function editorial(): array
    {
        return [self::Concert, self::SongRelease, self::BreakingNews];
    }

    /**
     * String values of {@see self::editorial()}, for validation rules.
     *
     * @return list<string>
     */
    public static function editorialValues(): array
    {
        return array_map(fn (self $type): string => $type->value, self::editorial());
    }

    public function isEditorial(): bool
    {
        return in_array($this, self::editorial(), true);
    }
}
