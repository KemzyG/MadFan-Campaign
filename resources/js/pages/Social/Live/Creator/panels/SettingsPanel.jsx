import { useState } from 'react';

/**
 * Host-only customization: title, description, visibility, and the
 * comment/reaction toggles — the same fields LiveStageService::updateSettings
 * accepts. Saves explicitly (not per-keystroke) so a host mid-sentence in the
 * title field never fires a request per character.
 */
export default function SettingsPanel({ stage, onSave }) {
    const [title, setTitle] = useState(stage.title || '');
    const [description, setDescription] = useState(stage.description || '');
    const [isPublic, setIsPublic] = useState(stage.is_public ?? true);
    const [allowComments, setAllowComments] = useState(stage.settings.allow_comments);
    const [allowReactions, setAllowReactions] = useState(stage.settings.allow_reactions);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFeedback(null);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim() || null,
                is_public: isPublic,
                allow_comments: allowComments,
                allow_reactions: allowReactions,
            });
            setFeedback({ type: 'success', message: 'Saved.' });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Could not save changes.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="kf-studio__settings" onSubmit={submit}>
            <label className="kf-studio__settings-field">
                <span className="kf-studio__settings-label">Title</span>
                <input
                    type="text"
                    className="kf-studio__settings-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={stage.max_title_length}
                    required
                />
            </label>

            <label className="kf-studio__settings-field">
                <span className="kf-studio__settings-label">Description</span>
                <textarea
                    className="kf-studio__settings-input kf-studio__settings-input--textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={stage.max_description_length}
                    rows={3}
                />
            </label>

            <label className="kf-toggle-row">
                <span>Public — anyone can find and watch</span>
                <span className="kf-toggle">
                    <input
                        type="checkbox"
                        className="kf-toggle__input"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <span className="kf-toggle__track" aria-hidden />
                </span>
            </label>

            <label className="kf-toggle-row">
                <span>Allow comments</span>
                <span className="kf-toggle">
                    <input
                        type="checkbox"
                        className="kf-toggle__input"
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                    />
                    <span className="kf-toggle__track" aria-hidden />
                </span>
            </label>

            <label className="kf-toggle-row">
                <span>Allow reactions</span>
                <span className="kf-toggle">
                    <input
                        type="checkbox"
                        className="kf-toggle__input"
                        checked={allowReactions}
                        onChange={(e) => setAllowReactions(e.target.checked)}
                    />
                    <span className="kf-toggle__track" aria-hidden />
                </span>
            </label>

            {feedback ? (
                <p className={`kf-studio__settings-feedback kf-studio__settings-feedback--${feedback.type}`}>
                    {feedback.message}
                </p>
            ) : null}

            <button type="submit" className="kf-studio__settings-save" disabled={saving || !title.trim()}>
                {saving ? 'Saving…' : 'Save changes'}
            </button>
        </form>
    );
}
