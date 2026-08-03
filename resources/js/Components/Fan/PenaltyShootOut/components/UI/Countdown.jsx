import { memo } from 'react';
import { useUiStore } from '../../store/uiStore';

/**
 * @module components/UI/Countdown
 * Optional pre-shot countdown overlay (driven by uiStore).
 */
export const Countdown = memo(function Countdown({ value = 3 }) {
    const show = useUiStore((s) => s.showCountdown);

    if (!show) {
        return null;
    }

    return (
        <div className="pso-countdown" aria-live="polite">
            {value}
        </div>
    );
});
