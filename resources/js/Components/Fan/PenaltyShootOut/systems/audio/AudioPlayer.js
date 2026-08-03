/**
 * @module systems/audio/AudioPlayer
 * HTMLAudioElement pool with fade support. Safe no-op if asset missing.
 */

export class AudioPlayer {
    constructor() {
        /** @type {Map<string, HTMLAudioElement>} */
        this.cache = new Map();
        this.unlocked = false;
    }

    unlock() {
        this.unlocked = true;
    }

    /**
     * @param {string} url
     * @returns {HTMLAudioElement|null}
     */
    get(url) {
        if (!url || typeof Audio === 'undefined') {
            return null;
        }
        if (!this.cache.has(url)) {
            const el = new Audio(url);
            el.preload = 'auto';
            this.cache.set(url, el);
        }

        return this.cache.get(url) ?? null;
    }

    /**
     * @param {string} url
     * @param {number} volume
     * @param {boolean} [loop=false]
     */
    play(url, volume, loop = false) {
        if (!this.unlocked) {
            return null;
        }
        const el = this.get(url);
        if (!el) {
            return null;
        }
        try {
            el.loop = loop;
            el.volume = Math.max(0, Math.min(1, volume));
            el.currentTime = 0;
            void el.play().catch(() => {
                /* autoplay / missing asset */
            });
        } catch {
            /* ignore */
        }

        return el;
    }

    /**
     * @param {HTMLAudioElement} el
     * @param {number} to
     * @param {number} ms
     */
    fadeTo(el, to, ms) {
        if (!el) {
            return;
        }
        const from = el.volume;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / ms);
            el.volume = from + (to - from) * t;
            if (t < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }
}
