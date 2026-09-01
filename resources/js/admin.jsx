import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from '@/Components/ui/sonner';

createInertiaApp({
    title: (title) => (title ? `${title} · Mad Fan Ops` : 'Mad Fan Ops'),
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.jsx`, import.meta.glob('./pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                <Toaster richColors closeButton />
            </>,
        );
    },
    progress: {
        color: '#e8ff00',
        showSpinner: true,
    },
});
