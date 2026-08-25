import { Head } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import { ProfileSkeleton } from '../components/Skeletons';
import ProfileFeed from '../Profile/ProfileFeed';
import YouHero from './YouHero';
import YouQuickLinks from './YouQuickLinks';
import YouSettingsModal from './YouSettingsModal';

export default function Index({ identity, loyalty, records, feed }) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <SocialShell title="You" backHref="/social" wide>
            <Head title="You" />

            {identity == null ? (
                <ProfileSkeleton />
            ) : (
                <div className="mf-profile-page mf-you-page">
                    <SplitView
                        mode="rail"
                        railLabel="Your profile"
                        contentLabel="Posts"
                        rail={
                            <div className="mf-profile-rail">
                                <YouHero
                                    identity={identity}
                                    loyalty={loyalty}
                                    records={records}
                                    onEditProfile={() => setSettingsOpen(true)}
                                />
                                <YouQuickLinks />
                            </div>
                        }
                        content={
                            <ProfileFeed profile={{ name: identity.name }} feed={feed} isVisit={false} />
                        }
                    />
                </div>
            )}

            <YouSettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                identity={identity}
            />
        </SocialShell>
    );
}
