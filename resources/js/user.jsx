import '../css/madfan.css';
import '../css/landing.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
    title: (title) => (title ? `${title} · Mad Fan` : 'Mad Fan'),
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.jsx`, import.meta.glob('./pages/Fan/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#e8ff00',
        showSpinner: true,
    },
});
