import { memo } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import { getAudioManager } from '../../systems/audio/AudioManager';

/**
 * @module components/UI/Settings
 */
export const Settings = memo(function Settings() {
    const open = useUiStore((s) => s.showSettings);
    const closeSettings = useUiStore((s) => s.closeSettings);
    const quality = useSettingsStore((s) => s.quality);
    const postprocessing = useSettingsStore((s) => s.postprocessing);
    const muted = useAudioStore((s) => s.muted);
    const master = useAudioStore((s) => s.master);

    if (!open) {
        return null;
    }

    return (
        <div className="pso-settings">
            <div className="pso-settings-panel">
                <h2>SETTINGS</h2>
                <label className="pso-settings-row">
                    Quality
                    <select
                        value={quality}
                        onChange={(e) => useSettingsStore.getState().setQuality(e.target.value)}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </label>
                <label className="pso-settings-row">
                    <input
                        type="checkbox"
                        checked={postprocessing}
                        onChange={(e) => useSettingsStore.getState().setPostprocessing(e.target.checked)}
                    />
                    Post-processing
                </label>
                <label className="pso-settings-row">
                    <input
                        type="checkbox"
                        checked={muted}
                        onChange={() => useAudioStore.getState().toggleMute()}
                    />
                    Mute
                </label>
                <label className="pso-settings-row">
                    Volume
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={master}
                        onChange={(e) => useAudioStore.getState().setMaster(Number(e.target.value))}
                    />
                </label>
                <button
                    type="button"
                    className="pso-result-btn"
                    onClick={() => {
                        getAudioManager().playUiClick();
                        closeSettings();
                    }}
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
});
