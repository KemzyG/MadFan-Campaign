import { useEffect } from 'react';

/**
 * Keyboard map shown in the Info pane and bound by `useStageShortcuts`. Keep the
 * two in sync — this array is the single source of truth for both.
 */
export const STAGE_SHORTCUTS = [
    { keys: ['M'], label: 'Mute / unmute microphone' },
    { keys: ['H'], label: 'Raise or lower your hand' },
    { keys: ['R'], label: 'Send a quick reaction' },
    { keys: ['C'], label: 'Jump to chat' },
    { keys: ['1'], label: 'Chat tab' },
    { keys: ['2'], label: 'People tab' },
    { keys: ['3'], label: 'Info tab' },
    { keys: ['?'], label: 'Toggle this shortcut list' },
];

function isTypingTarget(target) {
    if (!target) {
        return false;
    }
    if (target.isContentEditable) {
        return true;
    }
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Global room shortcuts. Ignores keystrokes while typing or with a modifier held
 * so it never fights the chat composer. Every handler is a no-op unless the
 * matching action is currently allowed, so listeners can't mute, etc.
 */
export function useStageShortcuts({ enabled = true, actions, onRailTab, onReact, onToggleHelp } = {}) {
    useEffect(() => {
        if (!enabled || !actions) {
            return undefined;
        }

        function onKey(event) {
            if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            const key = event.key.toLowerCase();
            switch (key) {
                case 'm':
                    if (actions.canMute) {
                        event.preventDefault();
                        actions.toggleMute();
                    }
                    break;
                case 'h':
                    if (actions.canRaiseHand && !actions.handRaised) {
                        event.preventDefault();
                        actions.raiseHand();
                    }
                    break;
                case 'r':
                    if (actions.canReact) {
                        event.preventDefault();
                        onReact?.();
                    }
                    break;
                case 'c':
                    event.preventDefault();
                    onRailTab?.('chat');
                    break;
                case '1':
                    event.preventDefault();
                    onRailTab?.('chat');
                    break;
                case '2':
                    event.preventDefault();
                    onRailTab?.('people');
                    break;
                case '3':
                    event.preventDefault();
                    onRailTab?.('info');
                    break;
                case '?':
                    event.preventDefault();
                    onToggleHelp?.();
                    break;
                default:
                    break;
            }
        }

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [enabled, actions, onRailTab, onReact, onToggleHelp]);
}
