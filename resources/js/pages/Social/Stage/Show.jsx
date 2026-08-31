import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { useSwipeLayer } from '../../../lib/useSwipeLayer';
import { StageRoomSkeleton } from '../components/Skeletons';
import InviteStageSheet from './InviteStageSheet';
import ListenerStrip from './ListenerStrip';
import PinnedMessage from './PinnedMessage';
import ReactionLayer from './ReactionLayer';
import RoomHeader from './RoomHeader';
import SeatPickerSheet from './SeatPickerSheet';
import ShareStageSheet from './ShareStageSheet';
import SpeakerDeck from './SpeakerDeck';
import { IconBack, IconChat } from './StageIcons';
import StageControlBar from './StageControlBar';
import StagePresentationControls from './StagePresentationControls';
import StageSelfPreview from './StageSelfPreview';
import StageSourcesBar from './StageSourcesBar';
import StageStreamingHero from './StageStreamingHero';
import StageReactionFab from './StageReactionFab';
import StageSettingsSheet from './StageSettingsSheet';
import StageViewerFabs from './StageViewerFabs';
import { ChatPanel, PeopleInfoPanel } from './StageSidePanels';
import { useStageActions } from './useStageActions';
import { useStageShortcuts } from './useStageShortcuts';
import { useStageSession } from './StageSessionContext';

const REACTION_FALLBACK = '🔥';

/** Pane order for the mobile swipe carousel — must match the CSS `order` values
 *  in stage.css (chat: -1, stage: 0, people: 1). */
const PANE_ORDER = ['chat', 'stage', 'people'];

/**
 * The Stage room as a real route. The room reads as up to four panels — the
 * shell nav sidebar, the main room (header + deck + controls), a Chat column and
 * a People+Info column. Below 1024px these become a horizontal swipe carousel
 * (chat left, stage centre, people right — TikTok/Reels-style live layout, see
 * stage.css §16 mobile carousel); at ≥1024px Chat is its own column; at ≥1280px
 * People+Info joins as a permanent fourth panel (below that it's an overlay).
 */
export default function Show(props) {
    const { stage } = props;
    const { enterFromPage, syncFromPage, activeStageId, room, loading, chatUnread } = useStageSession();
    const actions = useStageActions();
    // Drives the Reels viewer's chat/interactions swipe (see the `isReelsViewer`
    // branch below) — harmless to compute unconditionally, it just holds local
    // drag state until its handlers are actually attached to something.
    const swipe = useSwipeLayer();

    // mobileView drives which pane the swipe carousel is centred on (and the
    // laptop overlay's reveal state below). It used to also drive a tap-tab
    // segmented control; that's gone in favour of swiping the carousel itself.
    const [mobileView, setMobileView] = useState('stage'); // stage | chat | people
    const [peopleTab, setPeopleTab] = useState('people'); // people | info
    const [peopleOpen, setPeopleOpen] = useState(false); // laptop overlay reveal
    const [focusUserId, setFocusUserId] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [seatPickerOpen, setSeatPickerOpen] = useState(false);
    const carouselRef = useRef(null);
    const carouselSyncingRef = useRef(false);
    const carouselCenteredRef = useRef(false);

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
    const ready = Boolean(roomStage) && !loading;

    // The host gets the studio (Program monitor frame, docked control bar,
    // Sources strip — desktop especially) for Video/Streaming stages; everyone
    // else — listeners and promoted speakers alike — gets the full-bleed Reels
    // screen: the video itself, with transparent overlay chrome, is the whole
    // point of their view. Voice stages keep the legacy multi-speaker layout
    // (see stage-studio.css and stage-reels.css for the Kickoff redesign).
    const isStudio = actions.isHost && roomStage?.type !== 'voice';

    // The People+Info panel is a host/production tool (roster, raise-hand
    // management, stage settings) — on Video/Streaming stages a viewer's Reels
    // screen has no use for it (see the Kickoff redesign: viewers there get
    // video + chat + reactions, nothing else). Voice stages keep it for
    // everyone regardless of role, since raising a hand and being promoted to
    // speaker — a listener-facing action — runs entirely through this panel.
    const showPeoplePanel = isStudio || roomStage?.type === 'voice';

    // A viewer/listener (never the host) on a Video/Streaming room — the
    // cohort that gets the two-layer swipe treatment below: chat and
    // interactions+header as transparent panes stacked over the always-
    // visible video, dragged 1:1 with the finger instead of a carousel pane
    // that scrolls the video itself away. Voice rooms and the host's own
    // Studio keep the existing carousel/panel layout untouched.
    const isReelsViewer = !actions.isHost && roomStage?.type !== 'voice';

    // Which panes actually exist, in swipe order (chat is skipped when the
    // host has turned room chat off, or — for a Reels viewer — because it's
    // now the swipe-overlay layer below rather than a carousel pane; people
    // when this viewer has no panel to open) — matches the CSS `order` in
    // stage.css so index math here lines up with what's visually adjacent.
    const panes = useMemo(
        () =>
            PANE_ORDER.filter(
                (p) => (p !== 'chat' || (chatAllowed && !isReelsViewer)) && (p !== 'people' || showPeoplePanel),
            ),
        [chatAllowed, showPeoplePanel, isReelsViewer],
    );

    // mobileView changing programmatically (unread-badge taps, "select a
    // speaker" opening People, keyboard shortcuts) scrolls the carousel to
    // match — the first time, instantly (no animated scroll on page load);
    // after that, smoothly, since it's a deliberate navigation.
    useEffect(() => {
        const node = carouselRef.current;
        if (!node || !ready) {
            return;
        }
        const index = panes.indexOf(mobileView);
        if (index === -1) {
            return;
        }
        const behavior = carouselCenteredRef.current ? 'smooth' : 'auto';
        carouselCenteredRef.current = true;
        carouselSyncingRef.current = true;
        node.scrollTo({ left: index * node.clientWidth, behavior });
        const timer = window.setTimeout(() => {
            carouselSyncingRef.current = false;
        }, 400);
        return () => window.clearTimeout(timer);
    }, [mobileView, panes, ready]);

    // Swiping the carousel itself is the primary interaction on mobile — sync
    // mobileView (and the laptop overlay's reveal flag) to whichever pane is
    // nearest once the user's own scroll settles, skipped while the effect
    // above is driving the scroll to avoid feedback-looping against itself.
    const handleCarouselScroll = useCallback(() => {
        if (carouselSyncingRef.current) {
            return;
        }
        const node = carouselRef.current;
        if (!node || !node.clientWidth) {
            return;
        }
        const index = Math.round(node.scrollLeft / node.clientWidth);
        const next = panes[index];
        if (!next || next === mobileView) {
            return;
        }
        setMobileView(next);
        setPeopleOpen(next === 'people');
    }, [panes, mobileView]);

    // A Reels viewer's chat lives in the swipe-overlay layer, not the grid/
    // carousel — from the layout's perspective that's the same as "no chat
    // column" even though `chatAllowed` is true, so the ≥1024px grid doesn't
    // reserve a dead chat-rail column (same reasoning as `is-no-people`).
    const noChatColumn = !chatAllowed || isReelsViewer;

    const roomClass = [
        'mf-stageroom',
        actions.isHost ? 'mf-stageroom--host' : 'mf-stageroom--viewer',
        isStudio ? 'mf-stageroom--studio' : 'mf-stageroom--reels',
        peopleOpen ? 'is-people-open' : '',
        noChatColumn ? 'is-no-chat' : '',
        showPeoplePanel ? '' : 'is-no-people',
    ]
        .filter(Boolean)
        .join(' ');

    // Streaming stages (camera/screen, both the host's studio and every
    // viewer's full-bleed Reels screen) already carry their own room header
    // (RoomHeader) laid over the video; the app's generic mf-header would just
    // double up as dead chrome above it. Voice stages keep the app header —
    // their room stays a boxed panel, not full-bleed video.
    const hideAppHeader = Boolean(roomStage) && roomStage.type !== 'voice';

    return (
        <SocialShell title="Stage" wide mobileBare hideHeader={hideAppHeader}>
            <Head title={`${roomStage?.title || stage?.title || 'Stage'} · Mad Fan Stage`} />

            {!ready ? (
                <StageRoomSkeleton />
            ) : (
                <div className={roomClass} ref={carouselRef} onScroll={handleCarouselScroll}>
                    <section className="mf-stageroom__main">
                        {!isReelsViewer ? (
                            <RoomHeader
                                onOpenSettings={() => setSettingsOpen(true)}
                                onOpenShare={() => setShareOpen(true)}
                                onOpenInvite={() => setInviteOpen(true)}
                            />
                        ) : null}

                        <div className="mf-stageroom__deck">
                            <ReactionLayer />
                            {!isReelsViewer ? <PinnedMessage compact /> : null}

                            <div className="mf-stage-monitor">
                                <span className="mf-stage-monitor__tag mf-mono">
                                    <span className="mf-stage-monitor__tag-dot" aria-hidden />
                                    Program
                                </span>
                                {/* The monitor is always exactly one thing: whatever's actually
                                    streaming. A live presentation (uploaded video/drawing canvas)
                                    takes the spot outright — it's the single most specific "this
                                    is the content" signal there is. Otherwise Video/Streaming
                                    stages show the one active screen-share/webcam feed (never a
                                    grid of tiles); only Voice, which has no video at all, falls
                                    back to the avatar deck. */}
                                {actions.presenting ? (
                                    <StagePresentationControls />
                                ) : roomStage?.type === 'voice' ? (
                                    <SpeakerDeck
                                        onSelectSpeaker={selectSpeaker}
                                        onClaimSeat={actions.takeSeat}
                                        onOpenSeatPicker={() => setSeatPickerOpen(true)}
                                    />
                                ) : (
                                    <StageStreamingHero onSelectSpeaker={selectSpeaker} />
                                )}
                            </div>

                            {!isReelsViewer ? <StageSourcesBar /> : null}

                            {/* Video/Streaming stages let the camera/screen tiles carry the
                                deck — a text roster of "who's just listening" is leftover
                                voice-room UI once there's real video to look at. The count
                                itself stays visible (header stats, the Streaming hero's own
                                "watching" overlay); only the avatar-chip roster drops here.
                                Raised hands are still reachable via the People panel. */}
                            {roomStage?.type === 'voice' ? (
                                <ListenerStrip onSeeAll={() => openPeople('people')} />
                            ) : null}
                        </div>

                        {isReelsViewer ? (
                            /* The video above is the one fixed thing — everything else lives
                               in one of two transparent panes stacked on top of it: "front"
                               (header + interactions, shown by default) and "chat". Swiping
                               right drags chat into view and front out, 1:1 with the finger;
                               the video keeps playing right through both, since neither pane
                               is ever opaque. See useSwipeLayer for the drag physics. */
                            <div
                                className={`mf-stageroom__swipe-layers ${swipe.dragging ? 'is-dragging' : ''}`}
                                ref={swipe.containerRef}
                                {...swipe.handlers}
                            >
                                <div
                                    className="mf-stageroom__swipe-layer mf-stageroom__swipe-layer--front"
                                    style={swipe.frontStyle}
                                    inert={swipe.open}
                                >
                                    <RoomHeader
                                        onOpenSettings={() => setSettingsOpen(true)}
                                        onOpenShare={() => setShareOpen(true)}
                                        onOpenInvite={() => setInviteOpen(true)}
                                    />
                                    <PinnedMessage compact />
                                    <StageSourcesBar />
                                    {chatAllowed ? (
                                        <button
                                            type="button"
                                            className="mf-stageroom__chat-toggle"
                                            aria-label="Open chat"
                                            onClick={swipe.openChat}
                                        >
                                            <IconChat />
                                            {chatUnread > 0 ? (
                                                <span className="mf-stageroom__chat-toggle-count mf-mono">
                                                    {chatUnread > 99 ? '99+' : chatUnread}
                                                </span>
                                            ) : null}
                                        </button>
                                    ) : null}
                                    <div className="mf-stage-fab-stack">
                                        <StageViewerFabs />
                                        <StageReactionFab />
                                    </div>
                                </div>

                                {chatAllowed ? (
                                    <div
                                        className="mf-stageroom__swipe-layer mf-stageroom__swipe-layer--chat"
                                        style={swipe.chatStyle}
                                        inert={!swipe.open}
                                    >
                                        <div className="mf-stageroom__chat-layer-head">
                                            <button
                                                type="button"
                                                className="mf-stageroom__chat-back"
                                                aria-label="Close chat"
                                                onClick={swipe.closeChat}
                                            >
                                                <IconBack />
                                            </button>
                                            <span className="mf-stageroom__chat-layer-label mf-mono">Chat</span>
                                        </div>
                                        <ChatPanel />
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <>
                                <StageReactionFab />
                                <StageControlBar />
                            </>
                        )}
                    </section>

                    {!isReelsViewer && chatAllowed ? (
                        <ChatPanel onOpenPeople={showPeoplePanel ? () => openPeople('people') : undefined} />
                    ) : null}

                    {showPeoplePanel ? (
                        <>
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
                        </>
                    ) : null}

                    <StageSelfPreview />
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
            <InviteStageSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
            <SeatPickerSheet open={seatPickerOpen} onClose={() => setSeatPickerOpen(false)} />
        </SocialShell>
    );
}
