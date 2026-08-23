import { createPortal } from 'react-dom';
import StageMiniDock from './StageMiniDock';
import { useStageSessionOptional } from './StageSessionContext';

/**
 * Floating Stage chrome, mounted once from SocialShell as a sibling of the page
 * grid. The room itself is now a real route (`Social/Stage/Show`), so all that
 * remains here is the persistent mini dock — shown only while a fan is joined
 * and browsing elsewhere. The session context owns the backdrop custom property
 * and the autoplay-unlock retry, so there is nothing else to portal.
 */
export default function StageChrome() {
    const session = useStageSessionOptional();

    if (!session?.activeStageId) {
        return null;
    }

    const dock = <StageMiniDock />;

    if (typeof document === 'undefined') {
        return dock;
    }

    return createPortal(dock, document.body);
}
