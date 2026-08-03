import { SOUND_URLS } from '../../constants/audio';

/**
 * @module systems/audio/SoundEffects
 * Catalog only — playback via AudioPlayer.
 */

export function resolveSoundUrl(id) {
    return SOUND_URLS[id] ?? null;
}

export const RESULT_TO_SOUND = Object.freeze({
    goal: 'goal',
    save: 'save',
    post: 'post',
    crossbar: 'crossbar',
    miss: 'crowd',
});
