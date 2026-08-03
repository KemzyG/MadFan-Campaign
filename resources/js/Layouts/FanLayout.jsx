import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import CampaignNav from '../Components/Fan/CampaignNav';
import { isWelcomeAreaPath } from '../Components/Fan/campaignNavLinks';
import CompleteRegistrationModal from '../Components/Fan/CompleteRegistrationModal';
import FanBrandLogo from '../Components/Fan/FanBrandLogo';
import FanFooter from '../Components/Fan/FanFooter';
import FanSidebar from '../Components/Fan/FanSidebar';
import ImpersonationBanner from '../Components/ImpersonationBanner';

function MenuIcon() {
    return (
        <span className="sidebar-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
        </span>
    );
}

export default function FanLayout({
    children,
    withSidebar = true,
}) {
    const { auth, fanNav, flash } = usePage().props;
    const { url } = usePage();
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [campaignNavOpen, setCampaignNavOpen] = useState(false);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);

    const pathname = (url ?? '').split('?')[0];
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isConnectAccountsPage = pathname === '/connect-accounts';
    const isWelcomeArea = isWelcomeAreaPath(pathname);
    const isCampaignPage = pathname === '/';
    const isAuthenticated = Boolean(user);

    const showStaffNav = Boolean(user?.staff_active);

    const showSidebarNav =
        withSidebar &&
        !isAuthPage &&
        !isCampaignPage &&
        (isAuthenticated || Boolean(fanNav?.waitlist_email) || Boolean(fanNav?.show_guest_nav));

    const registerUrl = fanNav?.waitlist_email
        ? `/register?email=${encodeURIComponent(fanNav.waitlist_email)}`
        : '/register';

    const fanId = user?.fan_id ?? null;
    const socialVerificationRequired = fanNav?.social_verification_required === true;

    useEffect(() => {
        if (socialVerificationRequired && flash?.open_onboarding && !isConnectAccountsPage) {
            setShowOnboardingModal(true);
        }
    }, [flash?.open_onboarding, isConnectAccountsPage, socialVerificationRequired]);

    useEffect(() => {
        if (!socialVerificationRequired) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('onboarding') === '1' && pathname === '/') {
            setShowOnboardingModal(true);
        }
    }, [pathname, socialVerificationRequired]);

    useEffect(() => {
        setSidebarOpen(false);
        setCampaignNavOpen(false);
    }, [pathname]);

    return (
        <>
            <ImpersonationBanner />
            <header className={isWelcomeArea ? 'header-welcome' : undefined}>
                <div className={`header-inner${isWelcomeArea ? ' header-inner--welcome' : ''}`}>
                    <div className="header-left">
                        <FanBrandLogo />
                    </div>

                    {isWelcomeArea && (
                        <CampaignNav
                            open={campaignNavOpen}
                            onClose={() => setCampaignNavOpen(false)}
                            drawerOnly={isCampaignPage}
                            registerUrl={registerUrl}
                        />
                    )}

                    <div className="header-right">
                        {!user &&
                            !isAuthPage &&
                            !isWelcomeArea && (
                                <Link href="/login" className="pts-pill header-sign-in" style={{ textDecoration: 'none' }}>
                                    ENTER CAMPAIGN
                                </Link>
                            )}
                        {isCampaignPage && <div className="badge">SEASON 01 · LIVE</div>}
                        {isWelcomeArea && (
                            <button
                                type="button"
                                className={`sidebar-menu-btn${isCampaignPage ? '' : ' campaign-nav-toggle'}`}
                                onClick={() => setCampaignNavOpen((current) => !current)}
                                aria-label={campaignNavOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={campaignNavOpen}
                                aria-controls="campaign-nav-drawer"
                            >
                                <MenuIcon />
                            </button>
                        )}
                        {showSidebarNav && (
                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Open navigation menu"
                                aria-expanded={sidebarOpen}
                            >
                                <MenuIcon />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {showSidebarNav && (
                <FanSidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isAuthenticated={isAuthenticated}
                    onOpenOnboarding={() => setShowOnboardingModal(true)}
                    registerUrl={registerUrl}
                    fanId={fanId}
                    socialVerificationRequired={socialVerificationRequired}
                    showStaffNav={showStaffNav}
                />
            )}

            <div className="campaign-main">{children}</div>

            <FanFooter socialHandles={fanNav?.social_handles ?? []} />

            {socialVerificationRequired && (
                <CompleteRegistrationModal
                    open={showOnboardingModal}
                    onClose={() => setShowOnboardingModal(false)}
                    tasks={fanNav?.onboarding_tasks ?? []}
                    socialHandles={fanNav?.social_handles ?? []}
                    registerUrl={registerUrl}
                    isAuthenticated={isAuthenticated}
                />
            )}
        </>
    );
}
