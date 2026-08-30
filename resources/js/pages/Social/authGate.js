import { createContext, useContext } from 'react';

/**
 * The one gate every interactive Social action funnels through for a guest:
 * "you can see this, sign in to do it" (spec: guest browsing, like
 * X/TikTok/Facebook). `requireAuth(action)` is the check every click/submit
 * handler opens with — it returns whether the caller may proceed, and as a
 * side effect opens the shared sign-in prompt when it can't. `action` is a
 * short lowercase verb phrase completing "Sign in to " — e.g. "like this
 * post", "follow this fan", "comment", "go live".
 *
 * One instance lives in SocialShell (see AuthGateContext.Provider there) so
 * every Social/Live page — light or dark, feed or stream — shares the same
 * prompt instead of each component owning its own modal.
 */
export const AuthGateContext = createContext({
    isGuest: false,
    requireAuth: () => true,
});

export function useAuthGate() {
    return useContext(AuthGateContext);
}
