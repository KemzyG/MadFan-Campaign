import { memo } from 'react';

/**
 * Expand / exit control for mobile-friendly fullscreen shootout play.
 *
 * @param {{
 *   active: boolean,
 *   onToggle: () => void,
 * }} props
 */
export const FullscreenToggle = memo(function FullscreenToggle({ active, onToggle }) {
    return (
        <button
            type="button"
            className={`pso-fullscreen-btn${active ? ' is-active' : ''}`}
            onClick={onToggle}
            aria-pressed={active}
            aria-label={active ? 'Exit full screen' : 'Play full screen'}
        >
            <span className="pso-fullscreen-btn__icon" aria-hidden="true">
                {active ? (
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                        <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                        <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
                    </svg>
                )}
            </span>
            <span className="pso-fullscreen-btn__label">{active ? 'EXIT' : 'FULL'}</span>
        </button>
    );
});
