import '../css/social.css';
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
    // Auth redirects from /social must resolve under the Social entry, not only user.jsx.
    ...import.meta.glob('./pages/Fan/Auth/**/*.jsx'),
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
