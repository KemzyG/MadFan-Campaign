<?php

namespace App\Support;

/**
 * Canonical Mad Fan narrative content shared by welcome-area pages and campaign copy.
 *
 * Source of truth companion: docs/story.md
 */
class MadFanStory
{
    /**
     * @return array{
     *     title: string,
     *     eyebrow: string,
     *     description: string,
     *     sections: list<array{eyebrow?: string, title: string, body?: string, bullets?: list<string>, cards?: list<array{label: string, title: string, body: string}>}>
     * }
     */
    public static function page(string $slug): array
    {
        return match ($slug) {
            'whitepaper' => self::whitepaper(),
            'roadmap' => self::roadmap(),
            'region' => self::region(),
            'about' => self::about(),
            'team' => self::team(),
            default => abort(404),
        };
    }

    /**
     * @return list<string>
     */
    public static function slugs(): array
    {
        return ['whitepaper', 'roadmap', 'region', 'team', 'about'];
    }

    /**
     * Compact narrative blocks for the public marketing landing (`/`).
     *
     * @return array{
     *     thesis: array{eyebrow: string, title: string, body: string},
     *     primitives: list<array{label: string, title: string, body: string}>,
     *     earn: list<array{pts: string, name: string, desc: string}>,
     *     weeks: list<array{num: string, name: string, desc: string}>,
     *     roadmap: list<array{label: string, title: string, body: string}>,
     *     regions: list<array{label: string, title: string, body: string}>,
     *     team: list<array{name: string, role: string, photo: string|null}>,
     *     pages: list<array{href: string, label: string, title: string, body: string}>
     * }
     */
    public static function landingHighlights(): array
    {
        $about = self::about();
        $roadmap = self::roadmap();
        $region = self::region();
        $team = self::team();

        $primitiveSection = collect($about['sections'])->firstWhere('title', 'Interconnected Building Blocks');
        $timelineSection = collect($roadmap['sections'])->firstWhere('title', 'Milestones With Staying Power');
        $hubSection = collect($region['sections'])->firstWhere('title', 'How Regions Show Up Online');

        return [
            'thesis' => [
                'eyebrow' => 'Why Mad Fan',
                'title' => 'Loyalty deserves infrastructure',
                'body' => 'Platforms reward noise. Fans invest time, emotion, and identity — and get almost nothing back. Mad Fan makes loyalty visible, verifiable, and valuable: Season 01 proves it with football, then the Loyalty Layer scales globally.',
            ],
            'primitives' => array_values(array_map(
                static fn (array $card): array => [
                    'label' => (string) $card['label'],
                    'title' => (string) $card['title'],
                    'body' => (string) $card['body'],
                ],
                $primitiveSection['cards'] ?? [],
            )),
            'earn' => [
                [
                    'pts' => '+50–150 / day',
                    'name' => 'Daily check-in',
                    'desc' => 'Claim every day. Streaks raise value from 50 to 150 points.',
                ],
                [
                    'pts' => '+500 / referral',
                    'name' => 'Refer a fan',
                    'desc' => 'Friends who join and complete a profile earn you uncapped referral points.',
                ],
                [
                    'pts' => '+100–1000',
                    'name' => 'Season tasks',
                    'desc' => 'Social proof, club pick, passport share, and weekly challenges.',
                ],
                [
                    'pts' => '+500 bonus',
                    'name' => '7-day streak',
                    'desc' => 'Finish a full week to unlock bonus points and a higher multiplier.',
                ],
            ],
            'weeks' => [
                ['num' => 'W1', 'name' => 'Kickoff', 'desc' => 'Sign up, pick your club, 2× multiplier.'],
                ['num' => 'W2', 'name' => 'Squad Up', 'desc' => 'First referrals and the referral board.'],
                ['num' => 'W3', 'name' => 'Daily Grind', 'desc' => '7-day streak bonus unlocked.'],
                ['num' => 'W4', 'name' => 'Social Proof', 'desc' => 'Share your Fan Passport publicly.'],
                ['num' => 'W5', 'name' => 'Loyalty Test', 'desc' => 'Knowledge and prediction challenges.'],
                ['num' => 'W6', 'name' => 'Top 100 Race', 'desc' => 'Leaderboard snapshot for exclusive tiers.'],
                ['num' => 'W7', 'name' => 'Final Push', 'desc' => 'Bonus drops and 3× referral multiplier.'],
                ['num' => 'W8', 'name' => 'Judgment Day', 'desc' => 'Final board, early access, rewards.'],
            ],
            'roadmap' => array_values(array_map(
                static fn (array $card): array => [
                    'label' => (string) $card['label'],
                    'title' => (string) $card['title'],
                    'body' => (string) $card['body'],
                ],
                $timelineSection['cards'] ?? [],
            )),
            'regions' => array_values(array_map(
                static fn (array $card): array => [
                    'label' => (string) $card['label'],
                    'title' => (string) $card['title'],
                    'body' => (string) $card['body'],
                ],
                $hubSection['cards'] ?? [],
            )),
            'team' => array_values(array_map(
                static fn (array $member): array => [
                    'name' => (string) $member['name'],
                    'role' => (string) $member['role'],
                    'photo' => $member['photo'] ?? null,
                ],
                array_slice($team['members'] ?? [], 0, 3),
            )),
            'pages' => [
                [
                    'href' => '/about',
                    'label' => 'About',
                    'title' => 'Vision & origin',
                    'body' => 'Why attention failed fans, and the Loyalty Layer we are building.',
                ],
                [
                    'href' => '/roadmap',
                    'label' => 'Roadmap',
                    'title' => 'Season 01 to global rails',
                    'body' => 'Proof first, then identity, marketplace, and the Global Loyalty Index.',
                ],
                [
                    'href' => '/region',
                    'label' => 'Region',
                    'title' => 'Football first, global next',
                    'body' => 'Regional hubs that feed one portable loyalty identity.',
                ],
                [
                    'href' => '/team',
                    'label' => 'Team',
                    'title' => 'Built by fans',
                    'body' => 'A lean crew shipping infrastructure meant to outlast any season.',
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function whitepaper(): array
    {
        return [
            'title' => 'Whitepaper',
            'eyebrow' => '',
            'description' => '',
            'sections' => [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function roadmap(): array
    {
        return [
            'title' => 'Roadmap',
            'eyebrow' => 'From Season 01 to Global Infrastructure',
            'description' => 'Mad Fan is built for longevity, not a single campaign spike. Season 01 is the proving ground; the Loyalty Layer is the destination.',
            'sections' => [
                [
                    'eyebrow' => 'Philosophy',
                    'title' => 'Ship Proof Before Scale',
                    'bodies' => [
                        'Attention platforms optimize for the next refresh. Loyalty infrastructure has to survive seasons, transfers, relegations, and decade long fandom. Our roadmap is deliberately sequenced: earn trust with live fans first, harden identity and scoring next, then unlock markets and partnerships that compound for years.',
                        'Every milestone below is designed to last, reusable primitives, portable Fan Passports, and scoring that rewards consistency over clout. We are not racing to peak metrics in a quarter; we are laying rails for a loyalty economy that can outlive any single product cycle.',
                    ],
                ],
                [
                    'eyebrow' => 'Momentum',
                    'title' => 'What Is Already Live',
                    'bodies' => [
                        'Season 01 is live on madfan.xyz, an 8 week gamified chapter with daily check ins, streaks, referrals, social tasks, Fan Passport sharing, and THE BOARD leaderboard. Real fans are already earning, climbing, and forming habits that feed the Loyalty Graph.',
                        'Parallel to the campaign, we are activating communities across Discord, Telegram, X, and Facebook, and preparing partnership materials so football clubs and ecosystem players can plug into verified loyalty rather than vanity engagement.',
                    ],
                    'bullets' => [
                        'Live engagement loop: claim → streak → task → refer → climb THE BOARD.',
                        'Fan Passport as the seed of a portable loyalty identity.',
                        'Infrastructure design for Loyalty Graph, scoring, and future marketplace rails.',
                        'Seed raise underway ($1M) to fund MVP depth, football activation, and long horizon hiring.',
                    ],
                ],
                [
                    'eyebrow' => 'Timeline',
                    'title' => 'Milestones With Staying Power',
                    'bodies' => [
                        'Short horizons prove product market motion. Longer horizons lock in protocol level durability, testnets, partnerships, marketplace liquidity, and cross vertical standards that do not reset every season.',
                    ],
                    'cards' => [
                        [
                            'label' => 'NOW',
                            'title' => 'Q3 2026',
                            'body' => 'Season 01 live and intensifying community growth. Testnet launch for core loyalty primitives so Fan Passport, score history, and graph relationships can begin compounding beyond campaign points.',
                        ],
                        [
                            'label' => 'NEXT',
                            'title' => 'Late 2026',
                            'body' => 'Core platform MVP. Football ecosystem activation with early club and community partnerships. Harden scoring against gaming. Expand Season mechanics into durable identity and rank that persist into Season 02 and beyond.',
                        ],
                        [
                            'label' => 'SCALE',
                            'title' => '2027+',
                            'body' => 'Loyalty Marketplace live, access, experiences, and partner perks unlocked by verified dedication. Expand into music, gaming, and creators. Roll out the Global Loyalty Index and mainnet so loyalty becomes comparable, portable capital across domains.',
                        ],
                    ],
                ],
                [
                    'eyebrow' => 'Seasons',
                    'title' => 'Campaigns That Feed Infrastructure',
                    'bodies' => [
                        'Season 01 is not a one off waitlist stunt. It is the first chapter in a repeating cadence: each season teaches the system who truly shows up, deepens passport history, and strengthens regional communities. Top performers earn early access, token allocation paths, founding status, and lasting recognition, incentives aligned with multi year participation, not overnight virality.',
                        'Miss a week and you lose ground in the season. Stay consistent across seasons and your loyalty identity appreciates. That is the longevity thesis made tangible.',
                    ],
                    'bullets' => [
                        'Season 01: prove the loop with football first superfans.',
                        'Season 02+: deepen passport history, refine scoring, open partner surfaces.',
                        'Always on primitives: Graph, Passport, Score, Index, Marketplace.',
                    ],
                ],
                [
                    'eyebrow' => 'Long term',
                    'title' => 'The Destination',
                    'bodies' => [
                        'Become the foundational loyalty infrastructure layer powering the next era of fan and community economies worldwide, as enduring as the passions it measures.',
                        'When loyalty is visible, verifiable, and economically meaningful, fans stop being invisible to the platforms they sustain. That is the lasting shift Mad Fan is building toward.',
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function region(): array
    {
        return [
            'title' => 'Region',
            'eyebrow' => 'Football First, Global Next',
            'description' => 'Loyalty is local before it is global. We root Mad Fan where passion is lifelong, then expand those same primitives across continents and industries.',
            'sections' => [
                [
                    'eyebrow' => 'Thesis',
                    'title' => 'Start Where Loyalty Already Lasts a Lifetime',
                    'bodies' => [
                        'Football loyalty does not expire when a season ends. It is cultural memory, colors, chants, rivalries, family ritual, carried from terraces to living rooms across the world. That durability is exactly why football is our launch focus: if we can measure and reward dedication here, we can extend the model anywhere sustained identity matters.',
                        'Mad Fan is not chasing every geography at once. We concentrate activation where superfans already organize, then grow regional hubs that feed a single, portable Loyalty Layer.',
                    ],
                ],
                [
                    'eyebrow' => 'Why Football',
                    'title' => 'The Deepest Fanbases on Earth',
                    'bodies' => [
                        'No other sport concentrates emotion, money, and identity at this planetary scale. Clubs are institutions; fans are multi generational stakeholders. Yet digital recognition still flatters reach over resilience, booster accounts and viral clips outshine the supporter who never miss a weekend.',
                        'By launching football first, we stress test Fan Passports, streak mechanics, referral graphs, and scoring against the hardest, most passionate cases. Authenticity becomes the product filter.',
                    ],
                    'bullets' => [
                        'Prove verifiable loyalty with clubs, ultras, diaspora communities, and digital native fans.',
                        'Build THE BOARD as a living regional pulse, not a vanity chart.',
                        'Create partnership playbooks clubs can reuse season after season.',
                    ],
                ],
                [
                    'eyebrow' => 'Launchpad',
                    'title' => 'Global Ambition, Football Roots',
                    'bodies' => [
                        'Mad Fan connects club cultures, diaspora networks, and emerging fan economies into one Loyalty Graph, without tying identity to a single hometown.',
                        'Season 01 activates football communities first so local habits can graduate into global identity. The same Passport you earn in one region should travel with you when you move clubs, cities, or even verticals later.',
                    ],
                ],
                [
                    'eyebrow' => 'Hubs',
                    'title' => 'How Regions Show Up Online',
                    'bodies' => [
                        'Regional presence starts where fans already gather. We grow durable rooms across Discord, Telegram, X, and Facebook, then map engagement quality into loyalty history rather than empty follower counts.',
                    ],
                    'cards' => [
                        [
                            'label' => 'COM',
                            'title' => 'Community Hubs',
                            'body' => 'Football first acquisition and diaspora bridges that keep loyalty portable across borders.',
                        ],
                        [
                            'label' => 'CLB',
                            'title' => 'Club & Diaspora Rails',
                            'body' => 'Pathways for club aligned communities and lifetime supporters to convert passion into verifiable Fan Passport history.',
                        ],
                        [
                            'label' => 'GL',
                            'title' => 'Global Index Ahead',
                            'body' => 'As regions mature, the Global Loyalty Index makes dedication comparable across cities, clubs, and later non football verticals.',
                        ],
                    ],
                ],
                [
                    'eyebrow' => 'Expansion',
                    'title' => 'Where We Go Next Without Losing the Root',
                    'bodies' => [
                        'Longevity means expanding without diluting origin. Football remains the proving ground while late stage verticals inherit the same primitives: Graph, Passport, Score, Index, Marketplace.',
                    ],
                    'bullets' => [
                        'Near term: football clubs, leagues, and community orgs as first ecosystem partners.',
                        'Always on: regional hubs on Discord, Telegram, X, and Facebook with Season cadence.',
                        '2027+: music, gaming, and creator economies join under one Global Loyalty Index, still measuring lasting dedication, not disposable attention.',
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array{
     *     title: string,
     *     eyebrow: string,
     *     description: string,
     *     intro?: list<array{eyebrow?: string, title: string, bodies?: list<string>, bullets?: list<string>}>,
     *     members: list<array{name: string, role: string, location?: string|null, photo?: string|null, bio: string, focus: list<string>, social?: array{label: string, url: string}|null}>,
     *     open_roles: list<array{title: string, type: string, summary: string}>,
     *     culture?: array{title: string, bodies: list<string>, bullets?: list<string>},
     *     contact_email: string
     * }
     */
    private static function team(): array
    {
        return [
            'title' => 'Our Team',
            'eyebrow' => 'Built By Fans',
            'description' => 'A lean crew with a long horizon, building loyalty infrastructure meant to endure longer than any single season.',
            'intro' => [
                [
                    'eyebrow' => 'Crew Ethos',
                    'title' => 'Small Team. Multi Year Mission.',
                    'bodies' => [
                        'Mad Fan is intentionally lean. We prioritize people who understand lifelong fandom, ship with rigor, and care about systems that still matter five seasons from now. Titles matter less than craft, consistency, and respect for the supporters we serve.',
                        'We welcome talent anywhere who wants loyalty to finally count, football first instincts, global ambition, remote friendly by design.',
                    ],
                ],
            ],
            'members' => [
                [
                    'name' => 'GODWIN E. BASSEY',
                    'role' => 'CEO & Founder',
                    'location' => null,
                    'photo' => 'founder-ceo',
                    'bio' => 'Proud Colchonero and founder of Mad Fan. After years watching platforms crown noise over devotion, Godwin set out to build the Loyalty Layer of the Internet, infrastructure that makes sustained passion visible, verifiable, and valuable. He leads vision, product direction, Season 01 execution, and the football first path to lasting ecosystem partnerships.',
                    'focus' => [
                        'Long horizon Loyalty Layer vision & architecture',
                        'Season 01 product, community, and THE BOARD',
                        'Football ecosystem partnerships and seed narrative',
                        'Hiring a durable core across growth, engineering, and partnerships',
                    ],
                    'social' => [
                        'label' => '@_MadFan',
                        'url' => 'https://x.com/_MadFan',
                    ],
                ],
                [
                    'name' => 'Ibrahim Abdulrahman',
                    'role' => 'CTO · Chief Technology Officer',
                    'location' => null,
                    'photo' => 'cto',
                    'bio' => 'Chief Technology Officer responsible for Mad Fan\'s product and infrastructure spine, Fan Passports, scoring, graph primitives, and the production systems that have to carry loyalty history for years.',
                    'focus' => [
                        'Platform architecture and engineering leadership',
                        'Fan Passport, Loyalty Score, and graph foundations',
                        'Security, reliability, and shipping cadence',
                    ],
                    'social' => null,
                ],
                [
                    'name' => 'Lemuel Mendoza',
                    'role' => 'CGO · Chief Growth Officer',
                    'location' => null,
                    'photo' => 'cgo',
                    'bio' => 'Chief Growth Officer driving acquisition, activation, and retention loops that convert real football superfans into lasting Mad Fan identities, without farming vanity metrics.',
                    'focus' => [
                        'Season 01 growth loops and THE BOARD momentum',
                        'Regional hubs across Discord, Telegram, and X',
                        'Partnership funnels that reward verified dedication',
                    ],
                    'social' => null,
                ],
            ],
            'culture' => [
                'title' => 'How We Work for Longevity',
                'bodies' => [
                    'We optimize for trust and durability. Campaign energy funds protocol depth. Community authenticity beats vanity metrics. Every role below is scoped so the team that joins now can still recognize the mission years later.',
                ],
                'bullets' => [
                    'Fans first, we measure dedication, not disposable reach.',
                    'Ship in seasons; design in decades.',
                    'Remote friendly, football literate, allergy to empty hype.',
                    'Clear communication over performative busyness.',
                ],
            ],
            'open_roles' => [
                [
                    'title' => 'Community & Growth',
                    'type' => 'Core · Remote',
                    'summary' => 'Grow Discord, Telegram, and X into lasting regional hubs. Design rituals that outlive Season 01 drops while protecting authenticity from spam and farming.',
                ],
                [
                    'title' => 'Product Engineering',
                    'type' => 'Core · Remote',
                    'summary' => 'Build Fan Passports, scoring, and graph primitives on madfan.xyz with production discipline, code that can carry loyalty history for years.',
                ],
                [
                    'title' => 'Partnerships',
                    'type' => 'Core · Remote',
                    'summary' => 'Open multi season relationships with clubs, communities, and brands ready to reward real superfans, not one off promotional blips.',
                ],
            ],
            'contact_email' => 'career.madfan@gmail.com',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function about(): array
    {
        return [
            'title' => 'About Us',
            'eyebrow' => 'Vision & Origin',
            'description' => 'The Loyalty Layer of the Internet, why attention failed fans, the infrastructure we are building, and the team shipping it.',
            'sections' => [
                [
                    'eyebrow' => 'The Problem',
                    'title' => 'The Attention Economy Failed Fans',
                    'body' => "Today's platforms reward noise, virality, and fleeting engagement. Likes, views, and viral moments dominate while sustained, authentic loyalty goes largely unseen and unrewarded. Fans invest time, emotion, money, and identity into their clubs and communities, yet receive fragmented experiences, superficial metrics, and little ownership or upside.",
                ],
                [
                    'eyebrow' => 'Our Vision',
                    'title' => 'Building the Loyalty Layer of the Internet',
                    'body' => 'Mad Fan exists to make loyalty visible, verifiable, portable, and economically powerful. We reward authenticity, consistency, and sustained passion. We are not building another fan app or social network, we are building the underlying primitives that power a new loyalty economy.',
                ],
                [
                    'eyebrow' => 'Core Primitives',
                    'title' => 'Interconnected Building Blocks',
                    'cards' => [
                        [
                            'label' => '01',
                            'title' => 'Loyalty Graph',
                            'body' => 'A network that maps real interactions, engagement depth, relationships, and sustained behavior across fans and entities.',
                        ],
                        [
                            'label' => '02',
                            'title' => 'Fan Passports',
                            'body' => 'Portable loyalty identities that prove your history, shareable, verifiable, and owned by you.',
                        ],
                        [
                            'label' => '03',
                            'title' => 'Loyalty Score',
                            'body' => 'Transparent scoring that distinguishes genuine long term loyalty from superficial or gamed metrics.',
                        ],
                        [
                            'label' => '04',
                            'title' => 'Global Loyalty Index',
                            'body' => 'The benchmark for loyalty across football clubs, leagues, artists, creators, and communities.',
                        ],
                        [
                            'label' => '05',
                            'title' => 'Loyalty Marketplace',
                            'body' => 'Where verified loyalty unlocks priority access, exclusive experiences, partner perks, and rewards.',
                        ],
                    ],
                ],
                [
                    'eyebrow' => 'Impact',
                    'title' => 'Why It Matters',
                    'bullets' => [
                        'Fans finally get recognized and rewarded, your passion becomes portable capital.',
                        'Clubs and creators see who their real superfans are and open loyalty driven revenue channels.',
                        'The broader ecosystem onboards the next wave of users through passion driven experiences, not hype.',
                    ],
                ],
                [
                    'eyebrow' => 'Our Story',
                    'title' => 'Loyalty Deserves Better Infrastructure',
                    'body' => 'Mad Fan was founded by Godwin, a proud Colchonero based in Lagos, Nigeria. Frustrated by how fan passion is undervalued in the digital economy, he set out to build the infrastructure that turns invisible dedication into structured value for fans, clubs, creators, and the entire ecosystem, building from Africa with a global vision.',
                ],
                [
                    'eyebrow' => 'How We Build',
                    'title' => 'Lean, Mission Driven, Shipping',
                    'bullets' => [
                        'Full vision and technical architecture across the Loyalty Graph, Fan Passports, and scoring systems.',
                        'Season 01 live engagement proving product market motion with real fans earning and climbing THE BOARD.',
                        'Raising a $1M seed to ship the MVP, activate football first, and grow the global network.',
                    ],
                ],
                [
                    'eyebrow' => 'Join Us',
                    'title' => 'Build the Loyalty Economy',
                    'body' => 'Fans: join Season 01, build your Fan Passport, and climb THE BOARD. Clubs and partners: reward your real superfans with us. Investors and builders: this is early stage infrastructure with live traction.',
                    'bullets' => [
                        'X: @_MadFan',
                        'Email: career.madfan@gmail.com',
                        'Website: madfan.xyz',
                        'Meet the team: /team',
                    ],
                ],
            ],
        ];
    }
}
