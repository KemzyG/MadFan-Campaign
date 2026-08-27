import { useState } from 'react';

export default function CommentComposer({ onSubmit, disabled, maxLength = 280, placeholder = 'Say something…' }) {
    const [value, setValue] = useState('');
    const [sending, setSending] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const body = value.trim();
        if (!body || sending) {
            return;
        }
        setSending(true);
        setValue('');
        try {
            await onSubmit(body);
        } catch {
            setValue(body);
        } finally {
            setSending(false);
        }
    };

    return (
        <form className="kf-comment-composer" onSubmit={submit}>
            <input
                type="text"
                className="kf-comment-composer__input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={disabled ? 'Comments are off' : placeholder}
                maxLength={maxLength}
                disabled={disabled || sending}
                aria-label="Comment"
            />
            <button
                type="submit"
                className="kf-comment-composer__send"
                disabled={disabled || sending || !value.trim()}
            >
                Send
            </button>
        </form>
    );
}
