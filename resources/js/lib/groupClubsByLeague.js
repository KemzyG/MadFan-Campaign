/**
 * Group a flat club list into [leagueName, clubs[]] pairs, sorted A→Z.
 * Handles both `league` shapes used across controllers: a plain string
 * (SocialOnboardingController) and an object with a `name` (FanRegisterController).
 *
 * @param {Array<{league?: string|{name?: string}}>} clubs
 * @returns {Array<[string, Array]>}
 */
export function groupClubsByLeague(clubs) {
    const groups = new Map();

    for (const club of clubs) {
        const label =
            (typeof club.league === 'string' ? club.league : club.league?.name)?.trim() || 'Other';

        if (!groups.has(label)) {
            groups.set(label, []);
        }

        groups.get(label).push(club);
    }

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}
