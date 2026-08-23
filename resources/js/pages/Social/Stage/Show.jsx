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
import StageRail from './StageRail';
import StageSettingsSheet from './StageSettingsSheet';
import { useStageActions } from './useStageActions';
import { useStageShortcuts } from './useStageShortcuts';
import { useStageSession } from './StageSessionContext';

const REACTION_FALLBACK = '🔥';

/** Mobile-only segmented control: Stage (deck) / Chat / People. */
function MobileSegmented({ view, chatAllowed, chatUnread, handCount, onStage, onRail }) {
    const Seg = ({ id, label, active, onClick, badge }) => (
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
            <Seg id="stage" label="Stage" active={view === 'stage'} onClick={onStage} />
            {chatAllowed ? (
                <Seg
                    id="chat"
                    label="Chat"
                    active={view === 'chat'}
                    onClick={() => onRail('chat')}
                    badge={chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : null}
                />
            ) : null}
            <Seg
                id="people"
                label="People"
                active={view === 'people'}
                onClick={() => onRail('people')}
                badge={handCount > 0 ? handCount : null}
            />
        </div>
    );
}

/**
 * The Stage room as a real route. Desktop is a two-pane split (deck + tabbed
 * rail); mobile is a single full-screen column switched by a segmented control,
 * with the control bar fixed above the safe area. No modal at any breakpoint.
 */
export default function Show(props) {
    const { stage } = props;
    const { enterFromPage, syncFromPage, activeStageId, room, loading, chatUnread } = useStageSession();
    const actions = useStageActions();

    const [railTab, setRailTab] = useState('chat'); // chat | people | info
    const [mobileStage, setMobileStage] = useState(true); // mobile: deck vs. rail pane
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

    const goRail = useCallback((tab) => {
        setRailTab(tab);
        setMobileStage(false);
    }, []);

    const selectSpeaker = useCallback(
        (participant) => {
            setFocusUserId(participant?.user_id ?? null);
            goRail('people');
        },
        [goRail],
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
        onToggleHelp: () => goRail('info'),
    });

    const roomStage = room?.stage;
    const chatAllowed = roomStage?.allow_chat !== false;
    const { handRaised } = useMemo(
        () => partitionParticipants(room?.participants || []),
        [room?.participants],
    );

    const ready = Boolean(roomStage) && !loading;
    const mobileView = mobileStage ? 'stage' : railTab === 'people' ? 'people' : 'chat';

    return (
        <SocialShell title="Stage" wide mobileBare>
            <Head title={`${roomStage?.title || stage?.title || 'Stage'} · Mad Fan Stage`} />

            {!ready ? (
                <StageRoomSkeleton />
            ) : (
                <div className={`mf-stageroom ${mobileStage ? 'is-mobile-stage' : 'is-mobile-pane'}`}>
                    <MobileSegmented
                        view={mobileView}
                        chatAllowed={chatAllowed}
                        chatUnread={chatUnread}
                        handCount={handRaised.length}
                        onStage={() => setMobileStage(true)}
                        onRail={goRail}
                    />

                    <section className="mf-stageroom__main">
                        <RoomHeader
                            onOpenSettings={() => setSettingsOpen(true)}
                            onOpenShare={() => setShareOpen(true)}
                        />

                        <div className="mf-stageroom__deck">
                            <ReactionLayer />
                            <PinnedMessage compact />
                            <SpeakerDeck onSelectSpeaker={selectSpeaker} />
                            <ListenerStrip onSeeAll={() => goRail('people')} />
                        </div>

                        <StageControlBar
                            onOpenSettings={() => setSettingsOpen(true)}
                            onOpenShare={() => setShareOpen(true)}
                            onChat={() => goRail('chat')}
                        />
                    </section>

                    <StageRail tab={railTab} onTab={goRail} focusUserId={focusUserId} />
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
