import { partitionParticipants } from './helpers';
import { IconChat, IconInfo, IconUsers } from './StageIcons';
import StageChatPane from './StageChatPane';
import StageInfoPane from './StageInfoPane';
import StagePeoplePane from './StagePeoplePane';
import { useStageSession } from './StageSessionContext';

const TABS = [
    { key: 'chat', label: 'Chat', Icon: IconChat },
    { key: 'people', label: 'People', Icon: IconUsers },
    { key: 'info', label: 'Info', Icon: IconInfo },
];

/**
 * Desktop right pane. Tabs between chat, people and info; the chat tab carries an
 * unread badge and the people tab a raised-hand count. On mobile the same panes
 * are shown by the segmented control, so this whole rail is desktop-only in CSS.
 */
export default function StageRail({ tab, onTab, focusUserId = null }) {
    const { room, chatUnread } = useStageSession();
    const stage = room?.stage;
    const chatAllowed = stage?.allow_chat !== false;
    const { handRaised } = partitionParticipants(room?.participants || []);
    const handCount = handRaised.length;

    const badges = {
        chat: chatAllowed && chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : null,
        people: handCount > 0 ? handCount : null,
        info: null,
    };

    return (
        <aside className="mf-stage-rail" aria-label="Stage side panel">
            <div className="mf-stage-rail__tabs" role="tablist" aria-label="Side panel tabs">
                {TABS.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        className={`mf-stage-rail__tab ${tab === key ? 'is-active' : ''}`.trim()}
                        onClick={() => onTab(key)}
                    >
                        <Icon className="mf-stage-rail__tab-glyph" />
                        <span className="mf-stage-rail__tab-label">{label}</span>
                        {badges[key] != null ? (
                            <span className="mf-stage-rail__tab-badge mf-mono">{badges[key]}</span>
                        ) : null}
                    </button>
                ))}
            </div>

            <div className="mf-stage-rail__body">
                {tab === 'chat' ? <StageChatPane /> : null}
                {tab === 'people' ? <StagePeoplePane focusUserId={focusUserId} /> : null}
                {tab === 'info' ? <StageInfoPane /> : null}
            </div>
        </aside>
    );
}
