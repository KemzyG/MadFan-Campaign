import { useEffect, useMemo, useRef } from 'react';

const COLORS = ['#e8ff00', '#ffc400', '#f5f5f0', '#ffd400', '#7cff6b', '#ffffff'];

/**
 * Full-screen celebration: confetti burst + earned points badge.
 *
 * @param {{ points: number, label?: string }} props
 */
export default function ClaimCelebration({ points, label = 'PTS' }) {
    const canvasRef = useRef(null);
    const particles = useMemo(() => {
        return Array.from({ length: 90 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 90 + (Math.random() * 0.4 - 0.2);
            const speed = 4 + Math.random() * 9;

            return {
                x: 0.5,
                y: 0.42,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4,
                size: 4 + Math.random() * 7,
                color: COLORS[i % COLORS.length],
                rot: Math.random() * 360,
                spin: (Math.random() * 2 - 1) * 12,
                shape: i % 3 === 0 ? 'rect' : 'circle',
            };
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return undefined;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return undefined;
        }

        let frame = 0;
        let raf = 0;
        const state = particles.map((p) => ({ ...p }));

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function draw() {
            frame += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            state.forEach((p) => {
                p.vy += 0.18;
                p.vx *= 0.995;
                p.x += p.vx / canvas.width;
                p.y += p.vy / canvas.height;
                p.rot += p.spin;

                const px = p.x * canvas.width;
                const py = p.y * canvas.height;

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - frame / 100);

                if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });

            if (frame < 100) {
                raf = requestAnimationFrame(draw);
            }
        }

        resize();
        window.addEventListener('resize', resize);
        raf = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [particles]);

    return (
        <div className="claim-celebration" role="status" aria-live="polite">
            <canvas ref={canvasRef} className="claim-celebration-canvas" aria-hidden="true" />
            <div className="claim-celebration-badge">
                <div className="claim-celebration-eyebrow">GOAL</div>
                <div className="claim-celebration-points">+{Number(points).toLocaleString()}</div>
                <div className="claim-celebration-label">{label}</div>
            </div>
        </div>
    );
}
