import { create } from 'zustand';
import { dprForQuality, resolveGraphicsProfile } from '../utils/graphicsProfile';

/**
 * @module store/settingsStore
 */

const initialProfile = resolveGraphicsProfile();

export const useSettingsStore = create((set) => ({
    quality: /** @type {'low'|'medium'|'high'} */ (initialProfile.quality),
    postprocessing: initialProfile.postprocessing,
    cameraAssist: true,
    reduceMotion: false,
    controlScheme: /** @type {'auto'|'touch'|'mouse'} */ ('auto'),
    cornerBonusEnabled: false,
    dpr: initialProfile.dpr,

    setQuality: (quality) =>
        set({
            quality,
            dpr: dprForQuality(quality),
            // Low tier always turns effects off; raising quality restores a sensible default.
            ...(quality === 'low' ? { postprocessing: false } : {}),
        }),
    setPostprocessing: (postprocessing) => set({ postprocessing }),
    setCameraAssist: (cameraAssist) => set({ cameraAssist }),
    setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    setControlScheme: (controlScheme) => set({ controlScheme }),
    setCornerBonusEnabled: (cornerBonusEnabled) => set({ cornerBonusEnabled: Boolean(cornerBonusEnabled) }),
}));
