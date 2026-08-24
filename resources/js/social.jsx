import '../css/social.css';
// Per-feature Social stylesheets (kept out of the monolithic social.css).
import '../css/social/split.css';
import '../css/social/leaderboard.css';
import '../css/social/wallet.css';
import '../css/social/clubs.css';
import '../css/social/fixtures.css';
import '../css/social/tickets.css';
import '../css/social/shop.css';
import '../css/social/profile.css';
import '../css/social/post.css';
import '../css/social/composer.css';
import '../css/social/stage-card.css';
// Events feed: shared card chrome, then one sheet per family of templates.
import '../css/social/events.css';
import '../css/social/event-live.css';
import '../css/social/event-media.css';
import '../css/social/event-news.css';
// Fan auth pages (login / register / password) can land in this SPA when an
// Inertia visit redirects after session expiry — they need campaign styles.
import '../css/madfan.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { getEcho } from './echo';
import { StageSessionProvider } from './pages/Social/Stage/StageSessionContext';

const socialPages = {
    ...import.meta.glob('./pages/Social/**/*.jsx'),
    // Auth + connect-accounts onboarding redirects from /social must resolve
    // under the Social entry, not only user.jsx.
    ...import.meta.glob('./pages/Fan/Auth/**/*.jsx'),
    ...import.meta.glob('./pages/Fan/ConnectAccounts.jsx'),
};

// Warm Echo when Reverb is configured (no-op when VITE_REVERB_* missing).
getEcho();

createInertiaApp({
    title: (title) => (title ? `${title} · Mad Fan Social` : 'Mad Fan Social'),
    resolve: (name) => resolvePageComponent(`./pages/${name}.jsx`, socialPages),
    setup({ el, App, props }) {
        createRoot(el).render(
            <StageSessionProvider>
                <App {...props} />
            </StageSessionProvider>,
        );
    },
    // Social uses shell-aware page skeletons instead of the top bar / corner spinner.
    progress: false,
});
