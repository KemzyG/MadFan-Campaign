import { useAudioStore } from '../../store/audioStore';

/**
 * @module systems/audio/AudioSettings
 */

export function getEffectiveVolume(channel) {
    const { master, muted, sfx, music, ambient } = useAudioStore.getState();
    if (muted) {
        return 0;
    }
    const channelGain = channel === 'music' ? music : channel === 'ambient' ? ambient : sfx;

    return master * channelGain;
}
