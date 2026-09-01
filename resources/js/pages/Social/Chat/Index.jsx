import { Head, usePage, usePoll } from '@inertiajs/react';
import { useEffect } from 'react';
import { getEcho, leaveEchoChannel } from '../../../echo';
import SocialShell from '../../../Layouts/SocialShell';
import { ChatSkeleton } from '../components/Skeletons';
import {
    markChatMessageDeleted,
    mergeChatMessage,
    patchChatProps,
} from './chatRealtime';
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

export default function Chat({
    inbox = 'friends',
    view = 'list',
    club,
    fandom,
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
    const page = usePage();
    const viewerId = page.props?.auth?.user?.id ?? null;
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
        const subscription = echo.private(name)
            .listen('.message.created', (payload) => {
                const incoming = payload?.message;
                if (!incoming?.id) {
                    return;
                }

                patchChatProps((current) => ({
                    messages: {
                        ...current.messages,
                        items: mergeChatMessage(current.messages?.items || [], incoming, viewerId),
                    },
                }));
            })
            .listen('.message.updated', (payload) => {
                const incoming = payload?.message;
                if (!incoming?.id) {
                    return;
                }

                patchChatProps((current) => ({
                    messages: {
                        ...current.messages,
                        items: mergeChatMessage(current.messages?.items || [], incoming, viewerId),
                    },
                }));
            })
            .listen('.message.deleted', (payload) => {
                const messageId = payload?.message_id;
                if (!messageId) {
                    return;
                }

                patchChatProps((current) => ({
                    messages: {
                        ...current.messages,
                        items: markChatMessageDeleted(current.messages?.items || [], messageId),
                    },
                }));
            });

        return () => {
            subscription.stopListening('.message.created');
            subscription.stopListening('.message.updated');
            subscription.stopListening('.message.deleted');
            leaveEchoChannel(name);
        };
    }, [usingReverb, channel?.id, viewerId]);

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
                            fandom={fandom}
                            messages={messages?.items || []}
                            hasMore={Boolean(messages?.has_more)}
                            oldestId={messages?.oldest_id}
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
