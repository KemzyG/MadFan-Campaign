import { create } from 'zustand';

/**
 * @module store/uiStore
 */

export const useUiStore = create((set) => ({
    showPause: false,
    showSettings: false,
    showCountdown: false,
    showStats: false,
    hintVisible: true,

    openPause: () => set({ showPause: true }),
    closePause: () => set({ showPause: false }),
    openSettings: () => set({ showSettings: true }),
    closeSettings: () => set({ showSettings: false }),
    setCountdown: (showCountdown) => set({ showCountdown }),
    setShowStats: (showStats) => set({ showStats }),
    setHintVisible: (hintVisible) => set({ hintVisible }),
}));
