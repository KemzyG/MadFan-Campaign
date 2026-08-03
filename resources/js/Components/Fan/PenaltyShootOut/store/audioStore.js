import { create } from 'zustand';

/**
 * @module store/audioStore
 */

export const useAudioStore = create((set) => ({
    master: 0.85,
    sfx: 1,
    music: 0.55,
    ambient: 0.4,
    muted: false,

    setMaster: (master) => set({ master }),
    setSfx: (sfx) => set({ sfx }),
    setMusic: (music) => set({ music }),
    setAmbient: (ambient) => set({ ambient }),
    setMuted: (muted) => set({ muted }),
    toggleMute: () => set((s) => ({ muted: !s.muted })),
}));
