import { AUDIO_CHANNELS, SOUND_IDS } from '../../constants/audio';
import { AudioPlayer } from './AudioPlayer';
import { getEffectiveVolume } from './AudioSettings';
import { playAmbient, playReplayMusic } from './MusicManager';
import { RESULT_TO_SOUND, resolveSoundUrl } from './SoundEffects';

/**
 * @module systems/audio/AudioManager
 * Centralized audio — never call HTMLAudio from React components.
 */

class AudioManager {
    constructor() {
        this.player = new AudioPlayer();
    }

    unlock() {
        this.player.unlock();
        playAmbient(this.player);
    }

    /**
     * @param {string} soundId
     * @param {keyof typeof AUDIO_CHANNELS} [channel='sfx']
     */
    play(soundId, channel = AUDIO_CHANNELS.sfx) {
        const url = resolveSoundUrl(soundId);
        if (!url) {
            return;
        }
        this.player.play(url, getEffectiveVolume(channel), false);
    }

    playKick() {
        this.play(SOUND_IDS.kick);
    }

    playResult(result) {
        const id = RESULT_TO_SOUND[result] ?? SOUND_IDS.crowd;
        this.play(id);
        if (result === 'goal') {
            this.play(SOUND_IDS.celebration);
            this.play(SOUND_IDS.net);
        }
    }

    playUiClick() {
        this.play(SOUND_IDS.uiClick, AUDIO_CHANNELS.ui);
    }

    startReplay() {
        playReplayMusic(this.player);
    }
}

let manager = null;

export function getAudioManager() {
    if (!manager) {
        manager = new AudioManager();
    }

    return manager;
}
