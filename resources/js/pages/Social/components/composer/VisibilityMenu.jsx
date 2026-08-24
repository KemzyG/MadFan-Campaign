import { IconChevronDown, IconClubShield, IconGlobe, IconLock } from '../post/icons';
import { usePopover } from './usePopover';

const OPTIONS = [
    { value: 'public', label: 'Public', hint: 'Anyone on Mad Fan', Icon: IconGlobe },
    { value: 'club', label: 'Your club', hint: 'Only your club members', Icon: IconClubShield },
    { value: 'only_me', label: 'Only me', hint: 'Only you can see this', Icon: IconLock },
];

/**
 * Audience dropdown for a new post — Public / Your club / Only me.
 */
export default function VisibilityMenu({ value, onChange, disabled = false }) {
    const { open, setOpen, ref } = usePopover();
    const current = OPTIONS.find((option) => option.value === value) || OPTIONS[0];
    const CurrentIcon = current.Icon;

    return (
        <div className="mf-cmenu" ref={ref}>
            <button
                type="button"
                className="mf-cchip"
                aria-haspopup="listbox"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
            >
                <CurrentIcon />
                <span>{current.label}</span>
                <IconChevronDown />
            </button>

            {open ? (
                <div className="mf-cmenu__pop" role="listbox" aria-label="Who can see this post">
                    {OPTIONS.map((option) => {
                        const OptionIcon = option.Icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                className={`mf-cmenu__item${option.value === value ? ' is-active' : ''}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                            >
                                <OptionIcon />
                                <span className="mf-cmenu__item-main">
                                    <span className="mf-cmenu__item-label">{option.label}</span>
                                    <span className="mf-cmenu__item-hint">{option.hint}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
