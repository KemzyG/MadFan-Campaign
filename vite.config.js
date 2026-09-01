import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/css/madfan.css',
                'resources/css/landing.css',
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
                // Stage "Kickoff" redesign — condensed broadcast-graphics display
                // face plus its body/mono pairing (see stage-kickoff.css). Every
                // other family named in tokens.css (Fraunces, Bebas Neue,
                // Montserrat) is declared only as a CSS fallback chain and was
                // never actually registered here, so it silently renders as the
                // fallback (Georgia/sans-serif/etc) today — these three are
                // registered for real so Kickoff's type identity actually loads.
                bunny('Big Shoulders Display', {
                    weights: [600, 700],
                }),
                bunny('IBM Plex Sans', {
                    weights: [400, 500, 600],
                }),
                bunny('IBM Plex Mono', {
                    weights: [400, 500],
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

