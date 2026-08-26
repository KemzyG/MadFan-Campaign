import { router } from '@inertiajs/react';
import { useRef } from 'react';

const TABS = [
    { key: 'home', label: 'Home' },
    { key: 'feed', label: 'Feed' },
    { key: 'live', label: 'Live' },
    { key: 'events', label: 'Events' },
    { key: 'more', label: 'More' },
];

// Touchscreens already pan this strip natively via overflow-x + touch-action,
// but a mouse doesn't get click-and-drag panning for free in any browser —
// without this, "swiping" only ever worked on a phone. Only mouse pointers
// hook in here; touch/pen keep the native scroll untouched.
function useDragToScroll() {
    const ref = useRef(null);
    const drag = useRef({ active: false, moved: false, startX: 0, startScrollLeft: 0 });

    function onPointerDown(event) {
        if (event.pointerType !== 'mouse' || !ref.current) {
            return;
        }

        drag.current = {
            active: true,
            moved: false,
            startX: event.clientX,
            startScrollLeft: ref.current.scrollLeft,
        };

        try {
            ref.current.setPointerCapture(event.pointerId);
        } catch {
            // Capture is a nicety (keeps the drag tracking outside the
            // strip's bounds); dragging still works without it.
        }
    }

    function onPointerMove(event) {
        if (!drag.current.active || !ref.current) {
            return;
        }

        const delta = event.clientX - drag.current.startX;
        if (Math.abs(delta) > 3) {
            drag.current.moved = true;
        }
        ref.current.scrollLeft = drag.current.startScrollLeft - delta;
    }

    function endDrag() {
        drag.current.active = false;

        // The click that follows a real drag-release fires synchronously
        // right after pointerup, so it still sees `moved: true` here and
        // gets suppressed below — this timeout only clears state left behind
        // when nothing was clicked (e.g. the pointer left the strip).
        window.setTimeout(() => {
            drag.current.moved = false;
        }, 0);
    }

    // A drag that actually moved the strip shouldn't also fire the tab's
    // click — capture-phase so it runs before the button's own onClick.
    function onClickCapture(event) {
        if (drag.current.moved) {
            event.preventDefault();
            event.stopPropagation();
            drag.current.moved = false;
        }
    }

    return { ref, onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerLeave: endDrag, onClickCapture };
}

export default function FandomNav({ active, fandomSlug }) {
    const dragProps = useDragToScroll();

    function go(tab) {
        if (tab === active) {
            return;
        }

        router.get(`/social/fandom/${fandomSlug}`, { tab }, { preserveScroll: true, preserveState: true });
    }

    return (
        <nav
            className="mf-fh-nav"
            role="tablist"
            aria-label="Fandom sections"
            ref={dragProps.ref}
            onPointerDown={dragProps.onPointerDown}
            onPointerMove={dragProps.onPointerMove}
            onPointerUp={dragProps.onPointerUp}
            onPointerLeave={dragProps.onPointerLeave}
            onClickCapture={dragProps.onClickCapture}
        >
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active === tab.key}
                    className={active === tab.key ? 'is-active' : ''}
                    onClick={() => go(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
