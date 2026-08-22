import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import FanLayout from '../../Layouts/FanLayout';
import FanBrandLogo from '../../Components/Fan/FanBrandLogo';
import ConnectedAccountsSection from '../../Components/Fan/ConnectedAccountsSection';
import ConnectAccountsStepper, { activeConnectStep, PLATFORM_BY_STEP } from '../../Components/Fan/ConnectAccountsStepper';
import ToastStack from '../../Components/Fan/ToastStack';
import { useToasts } from '../../lib/useToasts';

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
    const { toasts, pushToast, dismissToast } = useToasts();

    useEffect(() => {
        if (isOnboarding && flash?.success) {
            pushToast('ok', flash.success);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnboarding, flash?.success]);

    if (isOnboarding) {
        return (
            <div className="mf-auth-stage">
                <Head title="Connect Accounts" />
                <ToastStack toasts={toasts} onDismiss={dismissToast} />

                <div className="mf-onboard-panel">
                    <div className="mf-auth-header">
                        <div className="mf-auth-brand">
                            <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                            <span>Mad Fan</span>
                        </div>
                        <h1 className="mf-auth-title">Connect your accounts</h1>
                    </div>

                    <ConnectAccountsStepper accounts={accounts} currentStep={currentStep} />

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
                            <Link href="/daily-claim" className="mf-btn mf-btn--pitch mf-auth-submit">
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
