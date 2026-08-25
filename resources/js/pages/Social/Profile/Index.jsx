import { Head } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import FanCollections from '../components/FanCollections';
import SplitView from '../components/SplitView';
import { ProfileSkeleton } from '../components/Skeletons';
import ProfileHero from './ProfileHero';
import ProfileFeed from './ProfileFeed';

export default function Index({ profile, feed, collections }) {
    const isVisit = Boolean(profile && !profile.is_self);

    return (
        <SocialShell title={profile?.name || 'Profile'} backHref="/social" wide>
            <Head title={profile?.name || 'Profile'} />

            {profile == null ? (
                <ProfileSkeleton />
            ) : (
                <div className={`mf-profile-page ${isVisit ? 'mf-profile-page--visit' : ''}`}>
                    <SplitView
                        mode="rail"
                        railLabel="Profile"
                        contentLabel="Posts"
                        rail={
                            <div className="mf-profile-rail">
                                <ProfileHero profile={profile} isVisit={isVisit} />

                                <div className="mf-pass-collections mf-profile-collections">
                                    <p className="mf-pass-collections__kicker">
                                        {isVisit ? `${profile.name?.split(' ')[0] || 'Fan'}'s collections` : 'Your collections'}
                                    </p>
                                    <FanCollections
                                        collections={collections}
                                        ownerFirstName={isVisit ? profile.name?.split(' ')[0] : null}
                                        emptyLinks={!isVisit}
                                    />
                                </div>
                            </div>
                        }
                        content={<ProfileFeed profile={profile} feed={feed} isVisit={isVisit} />}
                    />
                </div>
            )}
        </SocialShell>
    );
}
