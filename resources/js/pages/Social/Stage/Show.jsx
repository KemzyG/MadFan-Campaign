import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { StageRoomSkeleton } from '../components/Skeletons';
import { partitionParticipants } from './helpers';
import ListenerStrip from './ListenerStrip';
import PinnedMessage from './PinnedMessage';
import ReactionLayer from './ReactionLayer';
import RoomHeader from './RoomHeader';
import ShareStageSheet from './ShareStageSheet';
import SpeakerDeck from './SpeakerDeck';
import StageControlBar from './StageControlBar';
import StageReactionFab from './StageReactionFab';
import StageSettingsSheet from './StageSettingsSheet';
import { ChatPanel, PeopleInfoPanel } from './StageSidePanels';
import { useStageActions } from './useStageActions';
import { useStageShortcuts } from './useStageShortcuts';
import { useStageSession } from './StageSessionContext';

const REACTION_FALLBACK = '🔥';

/** Mobile-only segmented control: Stage (deck) / Chat / People. */
function MobileSegmented({ view, chatAllowed, chatUnread, handCount, onStage, onChat, onPeople }) {
    const Seg = ({ label, active, onClick, badge }) => (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            className={`mf-stageroom__seg ${active ? 'is-active' : ''}`.trim()}
            onClick={onClick}
        >
            {label}
            {badge != null ? <span className="mf-stageroom__seg-badge mf-mono">{badge}</span> : null}
        </button>
    );

    return (
        <div className="mf-stageroom__segmented" role="tablist" aria-label="Room view">
            <Seg label="Stage" active={view === 'stage'} onClick={onStage} />
            {chatAllowed ? (
                <Seg
                    label="Chat"
                    active={view === 'chat'}
                    onClick={onChat}
                    badge={chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : null}
                />
            ) : null}
            <Seg
                label="People"
                active={view === 'people'}
                onClick={() => onPeople('people')}
                badge={handCount > 0 ? handCount : null}
            />
        </div>
    );
}

/**
 * The Stage room as a real route. The room reads as up to four panels — the
 * shell nav sidebar, the main room (header + deck + controls), a Chat column and
 * a People+Info column. On phones a segmented control swaps a single full-screen
 * panel; at ≥1024px Chat is its own column; at ≥1280px People+Info joins as a
 * permanent fourth panel (below that it's an overlay). No modal at any breakpoint.
 */
export default function Show(props) {
    const { stage } = props;
    const { enterFromPage, syncFromPage, activeStageId, room, loading, chatUnread } = useStageSession();
    const actions = useStageActions();

    // mobileView drives the phone segmented control + the responsive show/hide.
    const [mobileView, setMobileView] = useState('stage'); // stage | chat | people
    const [peopleTab, setPeopleTab] = useState('people'); // people | info
    const [peopleOpen, setPeopleOpen] = useState(false); // laptop overlay reveal
    const [focusUserId, setFocusUserId] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const stageBackgrounds = props.stage_backgrounds || [];

    // Seed the session on first mount / stage change.
    useEffect(() => {
        enterFromPage(props);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage?.id]);

    // Reconcile whenever Inertia refreshes this page's props for the active stage.
    useEffect(() => {
        if (activeStageId && stage?.id && activeStageId === stage.id) {
            syncFromPage(props);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        stage,
        props.participants,
        props.messages,
        props.me,
        props.voice,
        props.pinned_message,
        props.reactions,
        activeStageId,
    ]);

    const goStage = useCallback(() => setMobileView('stage'), []);
    const goChat = useCallback(() => setMobileView('chat'), []);
    const openPeople = useCallback((subTab = 'people') => {
        setPeopleTab(subTab === 'info' ? 'info' : 'people');
        setMobileView('people');
        setPeopleOpen(true);
    }, []);
    const closePeople = useCallback(() => {
        setPeopleOpen(false);
        setMobileView((view) => (view === 'people' ? 'stage' : view));
    }, []);

    // Shortcuts + affordances route through one entry point (1=chat, 2=people, 3/?=info).
    const goRail = useCallback(
        (tab) => {
            if (tab === 'chat') {
                goChat();
            } else {
                openPeople(tab === 'info' ? 'info' : 'people');
            }
        },
        [goChat, openPeople],
    );

    const selectSpeaker = useCallback(
        (participant) => {
            setFocusUserId(participant?.user_id ?? null);
            openPeople('people');
        },
        [openPeople],
    );

    const quickReact = useCallback(() => {
        const first = actions.reactionOptions?.[0] || REACTION_FALLBACK;
        actions.react(first);
    }, [actions]);

    useStageShortcuts({
        enabled: Boolean(room?.stage),
        actions,
        onRailTab: goRail,
        onReact: quickReact,
        onToggleHelp: () => openPeople('info'),
    });

    const roomStage = room?.stage;
    const chatAllowed = roomStage?.allow_chat !== false;
    const { handRaised } = useMemo(
        () => partitionParticipants(room?.participants || []),
        [room?.participants],
    );

    const ready = Boolean(roomStage) && !loading;

    const roomClass = [
        'mf-stageroom',
        `mf-stageroom--view-${mobileView}`,
        peopleOpen ? 'is-people-open' : '',
        chatAllowed ? '' : 'is-no-chat',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <SocialShell title="Stage" wide mobileBare>
            <Head title={`${roomStage?.title || stage?.title || 'Stage'} · Mad Fan Stage`} />

            {!ready ? (
                <StageRoomSkeleton />
            ) : (
                <div className={roomClass}>
                    <MobileSegmented
                        view={mobileView}
                        chatAllowed={chatAllowed}
                        chatUnread={chatUnread}
                        handCount={handRaised.length}
                        onStage={goStage}
                        onChat={goChat}
                        onPeople={openPeople}
                    />

                    <section className="mf-stageroom__main">
                        <RoomHeader onOpenSettings={() => setSettingsOpen(true)} onOpenShare={() => setShareOpen(true)} />

                        <div className="mf-stageroom__deck">
                            <ReactionLayer />
                            <PinnedMessage compact />
                            <SpeakerDeck onSelectSpeaker={selectSpeaker} />
                            <ListenerStrip onSeeAll={() => openPeople('people')} />
                        </div>

                        <StageReactionFab />

                        <StageControlBar />
                    </section>

                    {chatAllowed ? <ChatPanel onOpenPeople={() => openPeople('people')} /> : null}

                    <PeopleInfoPanel
                        tab={peopleTab}
                        onTab={setPeopleTab}
                        focusUserId={focusUserId}
                        onClose={closePeople}
                    />

                    <button
                        type="button"
                        className="mf-stage-panel__scrim"
                        aria-label="Close panel"
                        tabIndex={-1}
                        onClick={closePeople}
                    />
                </div>
            )}

            <StageSettingsSheet
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                stageBackgrounds={stageBackgrounds}
                maxTitleLength={props.max_title_length}
                maxDescriptionLength={props.max_description_length}
            />
            <ShareStageSheet open={shareOpen} onClose={() => setShareOpen(false)} />
        </SocialShell>
    );
}
