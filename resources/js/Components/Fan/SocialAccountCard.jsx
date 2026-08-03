import { router, useForm } from '@inertiajs/react';

export function socialLink(links, platform) {
    return links.find((item) => item.platform === platform)?.url ?? '#';
}

function identifierLabel(platform) {
    if (platform === 'x') {
        return 'X HANDLE';
    }

    if (platform === 'discord') {
        return 'DISCORD USERNAME OR ID';
    }

    return 'TELEGRAM USERNAME';
}

function identifierPlaceholder(platform) {
    if (platform === 'x') {
        return '@yourhandle';
    }

    if (platform === 'discord') {
        return 'username or numeric user ID';
    }

    return '@yourusername';
}

export default function SocialAccountCard({
    account,
    socialLinks = [],
    suggestedXHandle,
    errors,
    returnTo = 'connect',
    compact = false,
}) {
    const form = useForm({
        platform: account.platform,
        identifier: account.platform === 'x' ? suggestedXHandle ?? '' : '',
        return_to: returnTo,
    });

    function verifyManual(e) {
        e.preventDefault();
        form.post('/connect-accounts/verify', { preserveScroll: true });
    }

    const fieldIdPrefix = compact ? `passport-${account.platform}` : account.platform;
    const platformError = errors?.platform || errors?.identifier || errors?.telegram;
    const oauthHref = `/connect/${account.platform}?return_to=${encodeURIComponent(returnTo)}`;

    if (compact && account.connected) {
        return (
            <div className="passport-account-row connected">
                <div className="passport-account-icon">{account.icon}</div>
                <div className="passport-account-info">
                    <div className="passport-account-label">{account.label}</div>
                    <div className="passport-account-user">{account.username ?? account.display_name ?? 'Connected'}</div>
                </div>
                <div className="connect-status ok">CONNECTED</div>
                {account.platform === 'telegram' && (
                    <button
                        type="button"
                        className="passport-account-disconnect"
                        onClick={() =>
                            router.delete(`/connect-accounts/${account.platform}`, {
                                data: { return_to: returnTo },
                                preserveScroll: true,
                            })
                        }
                    >
                        DISCONNECT
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`connect-card${account.connected ? ' connected' : ''}${compact ? ' compact' : ''}`}>
            <div className="connect-card-head">
                <div className="connect-card-icon">{account.icon}</div>
                <div>
                    <div className="connect-card-title">{account.label}</div>
                    <div className="connect-card-meta">
                        {account.required ? 'Required' : 'Optional'}
                        {account.connected && account.username ? ` · ${account.username}` : ''}
                    </div>
                </div>
                <div className={`connect-status${account.connected ? ' ok' : account.required ? ' req' : ''}`}>
                    {account.connected ? 'CONNECTED' : account.required ? 'REQUIRED' : 'OPTIONAL'}
                </div>
            </div>

            {!account.connected && (
                <div className="connect-card-body">
                    {!compact && (
                        <p className="connect-card-copy">
                            {account.platform === 'x' &&
                                'Follow @MadFan on X, then connect your account so we can verify follow tasks automatically.'}
                            {account.platform === 'discord' &&
                                'Join our Discord server, then connect your account so membership tasks verify instantly.'}
                            {account.platform === 'telegram' &&
                                'Join our Telegram channel, then enter your public @username so we can verify your membership.'}
                        </p>
                    )}

                    <div className="connect-card-actions">
                        <a
                            className="btn-action btn-go"
                            href={socialLink(socialLinks, account.platform)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {account.platform === 'x' && '↗ Open X Profile'}
                            {account.platform === 'discord' && '↗ Open Discord'}
                            {account.platform === 'telegram' && '↗ Open Telegram Channel'}
                        </a>

                        {account.oauth_available && account.platform !== 'telegram' && (
                            <a className="btn-action btn-confirm" href={oauthHref}>
                                CONNECT WITH {account.platform === 'x' ? 'X' : 'DISCORD'}
                            </a>
                        )}

                        <form className="connect-manual-form" onSubmit={verifyManual}>
                            <input type="hidden" name="return_to" value={returnTo} />
                            <label className="edit-label" htmlFor={`identifier-${fieldIdPrefix}`}>
                                {identifierLabel(account.platform)}
                            </label>
                            <input
                                id={`identifier-${fieldIdPrefix}`}
                                className="edit-input"
                                type="text"
                                placeholder={identifierPlaceholder(account.platform)}
                                value={form.data.identifier}
                                onChange={(e) => form.setData('identifier', e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn-action btn-confirm"
                                disabled={form.processing || form.data.identifier.trim() === ''}
                            >
                                VERIFY &amp; CONNECT
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {account.connected && account.platform === 'telegram' && !compact && (
                <div className="connect-card-body">
                    <button
                        type="button"
                        className="btn-action btn-go"
                        onClick={() =>
                            router.delete(`/connect-accounts/${account.platform}`, {
                                data: { return_to: returnTo },
                                preserveScroll: true,
                            })
                        }
                    >
                        DISCONNECT TELEGRAM
                    </button>
                </div>
            )}

            {platformError && <p className="reg-field-error connect-card-error">{platformError}</p>}
        </div>
    );
}
