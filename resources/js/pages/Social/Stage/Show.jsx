import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { StageRoomSkeleton } from '../components/Skeletons';
import InviteStageSheet from './InviteStageSheet';
import ListenerStrip from './ListenerStrip';
import PinnedMessage from './PinnedMessage';
import ReactionLayer from './ReactionLayer';
import RoomHeader from './RoomHeader';
import ShareStageSheet from './ShareStageSheet';
import SpeakerDeck from './SpeakerDeck';
import StageControlBar from './StageControlBar';
import StagePresentationControls from './StagePresentationControls';
import StageSelfPreview from './StageSelfPreview';
import StageSourcesBar from './StageSourcesBar';
import StageStreamingHero from './StageStreamingHero';
import StageReactionFab from './StageReactionFab';
import StageSettingsSheet from './StageSettingsSheet';
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
    const { enterFromPage, syncFromPage, activeStageId, room, loading } = useStageSession();
    const actions = useStageActions();

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

    // Which panes actually exist, in swipe order (chat is skipped entirely
    // when the host has turned room chat off) — matches the CSS `order` in
    // stage.css so index math here lines up with what's visually adjacent.
    const panes = useMemo(() => PANE_ORDER.filter((p) => p !== 'chat' || chatAllowed), [chatAllowed]);

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

    // The host gets the studio (Program monitor frame, docked control bar,
    // Sources strip — desktop especially) for Video/Streaming stages; everyone
    // else — listeners and promoted speakers alike — gets the full-bleed Reels
    // screen: the video itself, with transparent overlay chrome, is the whole
    // point of their view. Voice stages keep the legacy multi-speaker layout
    // (see stage-studio.css and stage-reels.css for the Kickoff redesign).
    const isStudio = actions.isHost && roomStage?.type !== 'voice';
    const roomClass = [
        'mf-stageroom',
        actions.isHost ? 'mf-stageroom--host' : 'mf-stageroom--viewer',
        isStudio ? 'mf-stageroom--studio' : 'mf-stageroom--reels',
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
                <div className={roomClass} ref={carouselRef} onScroll={handleCarouselScroll}>
                    <section className="mf-stageroom__main">
                        <RoomHeader
                            onOpenSettings={() => setSettingsOpen(true)}
                            onOpenShare={() => setShareOpen(true)}
                            onOpenInvite={() => setInviteOpen(true)}
                        />

                        <div className="mf-stageroom__deck">
                            <ReactionLayer />
                            <PinnedMessage compact />

                            <div className="mf-stage-monitor">
                                <span className="mf-stage-monitor__tag mf-mono">
                                    <span className="mf-stage-monitor__tag-dot" aria-hidden />
                                    Program
                                </span>
                                {roomStage?.type === 'streaming' ? (
                                    <StageStreamingHero onSelectSpeaker={selectSpeaker} />
                                ) : (
                                    <SpeakerDeck onSelectSpeaker={selectSpeaker} />
                                )}
                            </div>

                            <StageSourcesBar />

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

                        <StageReactionFab />

                        <StagePresentationControls />
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
        </SocialShell>
    );
}
