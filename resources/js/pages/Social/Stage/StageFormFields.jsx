/**
 * Shared form primitives for the Stage settings sheet — a single source of
 * truth for switches, backdrop picker and section chrome. (Voice room
 * creation moved to the shared Go Live page, Social/Live/Create.jsx — see
 * the deleted CreateStageSheet.jsx.)
 */

export function SectionLabel({ id, children }) {
    return (
        <h3 id={id} className="mf-stage-form__section-label">
            {children}
        </h3>
    );
}

export function FieldGroup({ children, className = '' }) {
    return <div className={`mf-stage-form__group ${className}`.trim()}>{children}</div>;
}

export function TextField({ id, label, optional = false, hint, error, ...inputProps }) {
    return (
        <div className="mf-stage-form__field">
            <label className="mf-stage-form__label" htmlFor={id}>
                {label}
                {optional ? <span className="mf-stage-form__optional">Optional</span> : null}
            </label>
            <input id={id} className="mf-stage-form__input" {...inputProps} />
            {error ? (
                <p className="mf-field-error">{error}</p>
            ) : hint ? (
                <p className="mf-stage-form__hint mf-text-micro text-[var(--mf-muted)]">{hint}</p>
            ) : null}
        </div>
    );
}

export function TextAreaField({ id, label, optional = false, error, ...props }) {
    return (
        <div className="mf-stage-form__field">
            <label className="mf-stage-form__label" htmlFor={id}>
                {label}
                {optional ? <span className="mf-stage-form__optional">Optional</span> : null}
            </label>
            <textarea id={id} className="mf-stage-form__textarea" {...props} />
            {error ? <p className="mf-field-error">{error}</p> : null}
        </div>
    );
}

/** A labelled toggle row wrapping the shared `.mf-switch` primitive. */
export function SwitchRow({ id, label, hint, checked, onChange, disabled = false }) {
    return (
        <label className="mf-stage-form__switch" htmlFor={id}>
            <span className="mf-stage-form__switch-copy">
                <span className="mf-stage-form__switch-label">{label}</span>
                {hint ? <span className="mf-stage-form__switch-hint">{hint}</span> : null}
            </span>
            <span className="mf-switch">
                <input
                    id={id}
                    type="checkbox"
                    className="mf-switch__input"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    role="switch"
                    aria-checked={checked}
                />
                <span className="mf-switch__track" aria-hidden />
            </span>
        </label>
    );
}


/** Radio grid of stadium backdrops with a live thumbnail. */
export function BackgroundPicker({
    backgrounds = [],
    value,
    onChange,
    disabled = false,
    name = 'stage-background',
}) {
    if (backgrounds.length === 0) {
        return null;
    }

    return (
        <div className="mf-stage-bg-picker" role="radiogroup" aria-label="Stage background">
            {backgrounds.map((bg) => {
                const selected = value === bg.key;

                return (
                    <label
                        key={bg.key}
                        className={`mf-stage-bg-picker__option ${selected ? 'is-selected' : ''}`}
                    >
                        <input
                            type="radio"
                            name={name}
                            className="sr-only"
                            value={bg.key}
                            checked={selected}
                            onChange={() => onChange(bg.key)}
                            disabled={disabled}
                        />
                        <span
                            className="mf-stage-bg-picker__thumb"
                            style={{ backgroundImage: `url('${bg.url}')` }}
                            aria-hidden
                        />
                        <span className="mf-stage-bg-picker__label">{bg.label}</span>
                    </label>
                );
            })}
        </div>
    );
}
