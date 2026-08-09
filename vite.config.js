import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/css/madfan.css',
                'resources/css/social.css',
                'resources/js/app.js',
                'resources/js/admin.jsx',
                'resources/js/user.jsx',
                'resources/js/social.jsx',
            ],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        // Prefer IPv4 loopback so `public/hot` is http://127.0.0.1:… (not http://[::1]:…).
        // Port may bump (e.g. 5174) if 5173 is taken; CSP reads `public/hot` in local.
        host: '127.0.0.1',
        port: 5173,
        strictPort: false,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});

