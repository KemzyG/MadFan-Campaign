import { Head, Link, usePage } from '@inertiajs/react';
import FanLayout from '../../Layouts/FanLayout';
import FanBrandLogo from '../../Components/Fan/FanBrandLogo';
import ConnectedAccountsSection from '../../Components/Fan/ConnectedAccountsSection';
import ConnectAccountsStepper, { activeConnectStep, PLATFORM_BY_STEP } from '../../Components/Fan/ConnectAccountsStepper';

export default function ConnectAccounts({
    accounts = [],
    required_complete: requiredComplete,
    missing_required: missingRequired = [],
    social_links: socialLinks = [],
    telegram_bot_username: telegramBotUsername,
    suggested_x_handle: suggestedXHandle,
    onboarding = false,
    fan,
}) {
    const { errors, flash } = usePage().props;
    const isOnboarding = onboarding || flash?.onboarding_required;
    const currentStep = activeConnectStep(accounts);
    const currentPlatform = PLATFORM_BY_STEP[currentStep];
    const currentAccount = isOnboarding ? accounts.find((account) => account.platform === currentPlatform) : null;
    const wizardAccounts = isOnboarding && currentAccount ? [currentAccount] : accounts;

    if (isOnboarding) {
        return (
            <div className="mf-stage">
                <div className="mf-onboard">
                    <Head title="Connect Accounts" />

                    <div className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={28} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </div>

                    <p className="mf-text-caption text-[var(--mf-pitch)]">Connect step {currentStep} of 3</p>
                    <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">Connect your accounts</p>
                    <p className="mf-auth-lead">
                        Link <strong className="text-[var(--mf-pitch)]">X</strong> and{' '}
                        <strong className="text-[var(--mf-pitch)]">Discord</strong> to verify tasks. Telegram is
                        optional.
                    </p>

                    <ConnectAccountsStepper accounts={accounts} currentStep={currentStep} />

                    {flash?.success && (
                        <div className="mf-auth-banner" role="status">
                            {flash.success}
                        </div>
                    )}

                    {!requiredComplete && (
                        <div className="mf-auth-banner mf-auth-banner--error">
                            <strong>Step {currentStep}:</strong> connect{' '}
                            {(currentAccount?.label ?? missingRequired.join(' / ')).toUpperCase()} to continue.
                        </div>
                    )}

                    <div className="mt-6">
                        <ConnectedAccountsSection
                            accounts={wizardAccounts}
                            requiredComplete={requiredComplete}
                            missingRequired={missingRequired}
                            socialLinks={socialLinks}
                            telegramBotUsername={telegramBotUsername}
                            suggestedXHandle={suggestedXHandle}
                            errors={errors}
                            returnTo="onboarding"
                        />
                    </div>

                    {requiredComplete && (
                        <div className="mf-auth-actions">
                            <Link href="/daily-claim" className="mf-btn mf-btn--pitch w-full">
                                Enter the app →
                            </Link>
                        </div>
                    )}

                    {!requiredComplete && currentStep === 3 && (
                        <div className="mf-auth-actions">
                            <Link href="/daily-claim" className="mf-btn mf-btn--ghost w-full">
                                Skip Telegram for now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <FanLayout withSidebar={requiredComplete}>
            <Head title="Connected Accounts" />

            <div className="wrap connect-wrap">
                <div className="page-header">
                    <div className="page-eye">Verification Setup</div>
                    <div className="page-title">
                        CONNECT
                        <br />
                        YOUR ACCOUNTS
                    </div>
                    <p className="page-sub">
                        Link <strong style={{ color: 'var(--flame)' }}>X</strong> and{' '}
                        <strong style={{ color: 'var(--flame)' }}>Discord</strong> to unlock tasks and verify
                        automatically. Telegram is optional.
                    </p>
                </div>

                {flash?.success && <p className="connect-flash success">{flash.success}</p>}
                {flash?.error && <p className="connect-flash error">{flash.error}</p>}

                {!requiredComplete && (
                    <div className="connect-banner">
                        <strong>Action required:</strong> connect{' '}
                        {missingRequired.map((p) => p.toUpperCase()).join(' and ')} before entering the app.
                    </div>
                )}

                <ConnectedAccountsSection
                    accounts={wizardAccounts}
                    requiredComplete={requiredComplete}
                    missingRequired={missingRequired}
                    socialLinks={socialLinks}
                    telegramBotUsername={telegramBotUsername}
                    suggestedXHandle={suggestedXHandle}
                    errors={errors}
                    returnTo="connect"
                />

                {requiredComplete && (
                    <div className="connect-footer">
                        <Link href="/daily-claim" className="btn-action btn-confirm">
                            CONTINUE TO APP
                        </Link>
                        <Link href="/passport" className="btn-action btn-go">
                            MANAGE FROM PASSPORT
                        </Link>
                    </div>
                )}
            </div>
        </FanLayout>
    );
}
