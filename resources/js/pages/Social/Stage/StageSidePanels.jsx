import { partitionParticipants } from './helpers';
import { IconClose, IconInfo, IconUsers } from './StageIcons';
import StageChatPane from './StageChatPane';
import StageInfoPane from './StageInfoPane';
import StagePeoplePane from './StagePeoplePane';
import { useStageSession } from './StageSessionContext';

/**
 * Chat becomes its own column (≥1024px) instead of a rail tab. On laptops
 * (1024–1279px) the People+Info column is an overlay opened from the toggle in
 * this header; at ≥1280px both side columns are always visible.
 */
export function ChatPanel({ onOpenPeople }) {
    const { chatUnread } = useStageSession();

    return (
        <aside className="mf-stage-panel mf-stage-panel--chat" aria-label="Room chat">
            <header className="mf-stage-panel__head">
                <p className="mf-stage-panel__title">
                    Chat
                    {chatUnread > 0 ? (
                        <span className="mf-stage-panel__title-badge mf-mono">
                            {chatUnread > 99 ? '99+' : chatUnread}
                        </span>
                    ) : null}
                </p>
                <button
                    type="button"
                    className="mf-stage-icon-btn mf-stage-icon-btn--sm mf-stage-panel__people-toggle"
                    aria-label="People & info"
                    title="People & info"
                    onClick={onOpenPeople}
                >
                    <IconUsers />
                </button>
            </header>
            <div className="mf-stage-panel__body">
                <StageChatPane />
            </div>
        </aside>
    );
}

const SUB_TABS = [
    { key: 'people', label: 'People', Icon: IconUsers },
    { key: 'info', label: 'Info', Icon: IconInfo },
];

/**
 * The People+Info column. A small People / Info sub-tab (People default) reuses
 * the existing standalone panes. The close button appears only where the panel
 * is an overlay (mobile + laptop); at ≥1280px it is a permanent column.
 */
export function PeopleInfoPanel({ tab, onTab, focusUserId = null, onClose }) {
    const { room } = useStageSession();
    const { handRaised } = partitionParticipants(room?.participants || []);
    const handCount = handRaised.length;
    const badges = { people: handCount > 0 ? handCount : null, info: null };

    return (
        <aside className="mf-stage-panel mf-stage-panel--people" aria-label="People and info">
            <header className="mf-stage-panel__head mf-stage-panel__head--tabs">
                <div className="mf-stage-panel__subtabs" role="tablist" aria-label="People and info">
                    {SUB_TABS.map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={tab === key}
                            className={`mf-stage-panel__subtab ${tab === key ? 'is-active' : ''}`.trim()}
                            onClick={() => onTab(key)}
                        >
                            <Icon className="mf-stage-panel__subtab-glyph" />
                            <span>{label}</span>
                            {badges[key] != null ? (
                                <span className="mf-stage-panel__subtab-badge mf-mono">{badges[key]}</span>
                            ) : null}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="mf-stage-icon-btn mf-stage-icon-btn--sm mf-stage-panel__close"
                    aria-label="Close panel"
                    title="Close"
                    onClick={onClose}
                >
                    <IconClose />
                </button>
            </header>
            <div className="mf-stage-panel__body">
                {tab === 'people' ? <StagePeoplePane focusUserId={focusUserId} /> : <StageInfoPane />}
            </div>
        </aside>
    );
}
