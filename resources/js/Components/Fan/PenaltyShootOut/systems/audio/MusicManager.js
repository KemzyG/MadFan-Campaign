import { SOUND_IDS } from '../../constants/audio';
import { getEffectiveVolume } from './AudioSettings';
import { resolveSoundUrl } from './SoundEffects';

/**
 * @module systems/audio/MusicManager
 */

/**
 * @param {import('./AudioPlayer').AudioPlayer} player
 */
export function playAmbient(player) {
    const url = resolveSoundUrl(SOUND_IDS.ambient);
    if (!url) {
        return;
    }
    player.play(url, getEffectiveVolume('ambient'), true);
}

/**
 * @param {import('./AudioPlayer').AudioPlayer} player
 */
export function playReplayMusic(player) {
    const url = resolveSoundUrl(SOUND_IDS.replayMusic);
    if (!url) {
        return;
    }
    player.play(url, getEffectiveVolume('music'), false);
}
