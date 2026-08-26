import { Head } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import { ProfileSkeleton } from '../components/Skeletons';
import ProfileFeed from '../Profile/ProfileFeed';
import YouHeader from './YouHeader';
import YouHero from './YouHero';
import YouQuickLinks from './YouQuickLinks';
import YouSettingsModal from './YouSettingsModal';

export default function Index({ identity, loyalty, records, feed }) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <SocialShell title="You" backHref="/social" wide hideHeaderOnMobile>
            <Head title="You" />

            <div className="mf-profile-page mf-you-page">
                <YouHeader onOpenSettings={() => setSettingsOpen(true)} />

                {identity == null ? (
                    <ProfileSkeleton />
                ) : (
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
                )}
            </div>

            <YouSettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                identity={identity}
            />
        </SocialShell>
    );
}
