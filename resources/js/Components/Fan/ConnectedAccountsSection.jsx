import { Link } from '@inertiajs/react';
import SocialAccountCard from './SocialAccountCard';

export default function ConnectedAccountsSection({
    accounts = [],
    requiredComplete = true,
    missingRequired = [],
    socialLinks = [],
    telegramBotUsername,
    suggestedXHandle,
    errors,
    returnTo = 'connect',
    compact = false,
    showManageLink = false,
}) {
    const connectedCount = accounts.filter((account) => account.connected).length;

    return (
        <div className={`connected-accounts-section${compact ? ' compact' : ''}`}>
            {compact && (
                <div className="passport-accounts-summary">
                    <span>
                        {connectedCount} / {accounts.length} linked
                    </span>
                    {!requiredComplete && (
                        <span className="passport-accounts-warning">
                            {missingRequired.map((p) => p.toUpperCase()).join(' + ')} required
                        </span>
                    )}
                </div>
            )}

            <div className={compact ? 'passport-accounts-list' : 'connect-grid'}>
                {accounts.map((account) => (
                    <SocialAccountCard
                        key={account.platform}
                        account={account}
                        socialLinks={socialLinks}
                        suggestedXHandle={suggestedXHandle}
                        telegramBotUsername={telegramBotUsername}
                        errors={errors}
                        returnTo={returnTo}
                        compact={compact}
                    />
                ))}
            </div>

            {showManageLink && (
                <div className="connect-footer">
                    <Link href="/connect-accounts?manage=1" className="btn-action btn-go">
                        FULL CONNECT PAGE
                    </Link>
                </div>
            )}
        </div>
    );
}
