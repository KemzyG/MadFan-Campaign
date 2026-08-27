import { Head } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import CreatorStudio from './Creator/CreatorStudio';
import CreatorViewer from './Creator/CreatorViewer';
import { LiveStageSessionProvider } from './LiveStageSessionContext';

/**
 * One route, type-detected rendering (Live Stage spec §49): read the
 * stage's `type` + `is_host` and hand off to that format's dedicated
 * renderer. Only `creator` ships a renderer this phase — see
 * LiveStageTypeConfig::implemented() on the backend, which is what keeps
 * the server from ever handing this page a type it can't render.
 */
export default function Show({ stage, comments }) {
    const Renderer = RENDERERS[stage.type];

    return (
        <SocialShell title="Live" showTabs={false} hideHeader fillViewport>
            <Head title={`${stage.title} · Mad Fan Live`} />
            <LiveStageSessionProvider initialStage={stage} initialComments={comments}>
                {Renderer ? (
                    stage.is_host ? <Renderer.Studio /> : <Renderer.Viewer />
                ) : (
                    <div className="kf-connection-screen">
                        <h2 className="kf-connection-screen__title">Unsupported stage format</h2>
                    </div>
                )}
            </LiveStageSessionProvider>
        </SocialShell>
    );
}

const RENDERERS = {
    creator: { Studio: CreatorStudio, Viewer: CreatorViewer },
    // gaming, movie, presenter: reserved — see LiveStageTypeConfig.
};
