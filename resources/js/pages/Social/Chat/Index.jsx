import { Head, router, usePoll } from '@inertiajs/react';
import { useEffect } from 'react';
import { getEcho, leaveEchoChannel } from '../../../echo';
import SocialShell from '../../../Layouts/SocialShell';
import { ChatSkeleton } from '../components/Skeletons';
import ConversationList from './ConversationList';
import Thread from './Thread';

const POLL_ONLY = [
    'messages',
    'channels',
    'threads',
    'channel',
    'friend_candidates',
    'group_candidates',
];

/**
 * One page component for both the list and the thread: `view` decides which pane
 * a phone shows, while desktop always shows both. Keeping it as a single component
 * means desktop list → thread navigation never unmounts the stream.
 */
export default function Chat({
    inbox = 'friends',
    view = 'list',
    club,
    channels = [],
    threads = [],
    friend_candidates = [],
    group_candidates = [],
    channel,
    messages,
    max_body_length = 500,
    poll_ms = 4000,
    realtime,
    app,
}) {
    const usingReverb = realtime?.mode === 'reverb';
    const fallbackPollMs = usingReverb ? Math.max(poll_ms, 30000) : poll_ms;

    usePoll(fallbackPollMs, {
        only: POLL_ONLY,
        preserveScroll: true,
    });

    useEffect(() => {
        if (!usingReverb || !channel?.id) {
            return undefined;
        }

        const echo = getEcho();
        if (!echo) {
            return undefined;
        }

        const name = `social.chat.${channel.id}`;
        const subscription = echo.private(name).listen('.message.created', () => {
            router.reload({
                only: ['messages', 'threads', 'channels'],
                preserveScroll: true,
                preserveState: true,
            });
        });

        return () => {
            subscription.stopListening('.message.created');
            leaveEchoChannel(name);
        };
    }, [usingReverb, channel?.id]);

    const isThread = view === 'thread';

    return (
        <SocialShell title="Chat" wide mobileBare={isThread}>
            <Head title={isThread && channel ? channel.name : 'Chat'} />

            {messages == null ? (
                <ChatSkeleton />
            ) : (
                <div className={`mf-chat-shell ${isThread ? 'is-thread' : 'is-list'}`}>
                    <aside className="mf-chat-shell__aside" aria-label="Conversations">
                        <ConversationList
                            inbox={inbox}
                            channels={channels}
                            threads={threads}
                            friendCandidates={friend_candidates}
                            groupCandidates={group_candidates}
                        />
                    </aside>

                    <section className="mf-chat-shell__main">
                        <Thread
                            inbox={inbox}
                            channel={channel}
                            club={club}
                            messages={messages?.items || []}
                            maxBodyLength={max_body_length}
                            realtime={realtime}
                            app={app}
                        />
                    </section>
                </div>
            )}
        </SocialShell>
    );
}
