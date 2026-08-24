import { IconChevronDown, IconComment, IconGlobe, IconUserPlus, IconUsers } from '../post/icons';
import { usePopover } from './usePopover';

const OPTIONS = [
    { value: 'everyone', label: 'Everyone', hint: 'Anyone can reply', Icon: IconGlobe },
    { value: 'following', label: 'People you follow', hint: 'Only accounts you follow', Icon: IconUsers },
    { value: 'tagged', label: 'Only people you tag', hint: 'Only the people you tag', Icon: IconUserPlus },
];

/**
 * "Who can reply" dropdown for a new post.
 */
export default function WhoCanReplyMenu({ value, onChange, disabled = false }) {
    const { open, setOpen, ref } = usePopover();
    const current = OPTIONS.find((option) => option.value === value) || OPTIONS[0];

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
                <IconComment />
                <span>{current.label} can reply</span>
                <IconChevronDown />
            </button>

            {open ? (
                <div className="mf-cmenu__pop" role="listbox" aria-label="Who can reply">
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
