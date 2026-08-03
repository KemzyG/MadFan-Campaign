import { Head, Link, usePage } from '@inertiajs/react';
import FanLayout from '../../Layouts/FanLayout';
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

    return (
        <FanLayout withSidebar={requiredComplete && !isOnboarding}>
            <Head title={isOnboarding ? 'Connect Accounts' : 'Connected Accounts'} />

            <div className={`wrap connect-wrap${isOnboarding ? ' onboarding-step' : ''}`}>
                <div className={isOnboarding ? 'signup-block reg-stepper-block' : 'page-header'}>
                    {isOnboarding ? (
                        <>
                            <div className="reg-stepper-head">
                                <div className="reg-stepper-eye">
                                    Connect step {currentStep} of 3
                                </div>
                                <h2>CONNECT YOUR ACCOUNTS</h2>
                                <p>
                                    Link <strong style={{ color: 'var(--flame)' }}>X</strong> and{' '}
                                    <strong style={{ color: 'var(--flame)' }}>Discord</strong> to verify tasks.
                                    Telegram is optional.
                                </p>
                            </div>
                            <ConnectAccountsStepper accounts={accounts} currentStep={currentStep} />
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>

                {flash?.success && <p className="connect-flash success">{flash.success}</p>}
                {flash?.error && !isOnboarding && <p className="connect-flash error">{flash.error}</p>}

                {!requiredComplete && (
                    <div className="connect-banner">
                        {isOnboarding ? (
                            <>
                                <strong>Step {currentStep}:</strong> connect{' '}
                                {(currentAccount?.label ?? missingRequired.join(' / ')).toUpperCase()} to continue.
                            </>
                        ) : (
                            <>
                                <strong>Action required:</strong> connect{' '}
                                {missingRequired.map((p) => p.toUpperCase()).join(' and ')} before entering the app.
                            </>
                        )}
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
                    returnTo={isOnboarding ? 'onboarding' : 'connect'}
                />

                {isOnboarding && requiredComplete && (
                    <div className="connect-footer">
                        <Link href="/daily-claim" className="btn-action btn-confirm">
                            ENTER THE APP →
                        </Link>
                    </div>
                )}

                {isOnboarding && !requiredComplete && currentStep === 3 && (
                    <div className="connect-footer">
                        <Link href="/daily-claim" className="btn-action btn-go">
                            SKIP TELEGRAM FOR NOW
                        </Link>
                    </div>
                )}

                {!isOnboarding && requiredComplete && (
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
