import founderCeo from '../../../assets/founder-ceo.jpg';
import cto from '../../../assets/cto.jpg';
import cgo from '../../../assets/cgo.jpg';

/**
 * Team portraits sourced from `resources/assets` via Vite.
 *
 * @type {Record<string, string>}
 */
export const TEAM_PHOTOS = {
    'founder-ceo': founderCeo,
    cto,
    cgo,
};

/**
 * @param {string | null | undefined} key
 * @returns {string | null}
 */
export function teamPhotoUrl(key) {
    if (! key) {
        return null;
    }

    return TEAM_PHOTOS[key] ?? null;
}
