import { Link } from '@inertiajs/react';
import { socialPlatformIcon } from './socialPlatformIcons';

export default function CompleteRegistrationModal({
    open,
    onClose,
    tasks = [],
    socialHandles = [],
    registerUrl = '/register',
    isAuthenticated = false,
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="mf-modal-overlay" onClick={onClose} role="presentation">
            <div
                className="mf-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-modal-title"
            >
                <button type="button" className="mf-modal-close" onClick={onClose} aria-label="Close">
                    ×
                </button>

                <div className="mf-modal-eye">Next Steps</div>
                <h2 className="mf-modal-title" id="onboarding-modal-title">
                    COMPLETE YOUR REGISTRATION
                </h2>
                <p className="mf-modal-sub">
                    Pick your club, create your passport, then connect X and Discord to unlock tasks.
                </p>

                <div className="mf-modal-section">
                    <div className="mf-modal-section-label">Mad Fan Socials</div>
                    <div className="mf-social-grid">
                        {socialHandles.map((social) => {
                            const icon = socialPlatformIcon(social.platform);

                            return (
                            <a
                                key={social.platform}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mf-social-card"
                            >
                                <span className="mf-social-icon">
                                    <img
                                        src={icon.src}
                                        alt={icon.alt}
                                        width={28}
                                        height={28}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </span>
                                <span className="mf-social-label">{social.label}</span>
                                <span className="mf-social-handle">{social.handle}</span>
                            </a>
                            );
                        })}
                    </div>
                </div>

                <div className="mf-modal-section">
                    <div className="mf-modal-section-label">Starter Tasks</div>
                    <div className="mf-task-list">
                        {tasks.length === 0 ? (
                            <div className="mf-task-row">
                                <span className="mf-task-icon">✅</span>
                                <div>
                                    <div className="mf-task-name">Follow Mad Fan on social</div>
                                    <div className="mf-task-desc">Connect with us on X, Discord, and Telegram.</div>
                                </div>
                                <span className="mf-task-pts">+25</span>
                            </div>
                        ) : (
                            tasks.map((task) => {
                                const icon = socialPlatformIcon(task.platform);

                                return (
                                <div key={task.name} className="mf-task-row">
                                    <span className="mf-task-icon">
                                        <img
                                            src={icon.src}
                                            alt={icon.alt}
                                            width={28}
                                            height={28}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </span>
                                    <div>
                                        <div className="mf-task-name">{task.name}</div>
                                        <div className="mf-task-desc">{task.description}</div>
                                    </div>
                                    <span className="mf-task-pts">+{task.points}</span>
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="mf-modal-actions">
                    {isAuthenticated ? (
                        <Link href="/connect-accounts?onboarding=1" className="btn-join mf-modal-cta">
                            CONNECT ACCOUNTS
                        </Link>
                    ) : (
                        <Link href={registerUrl} className="btn-join mf-modal-cta">
                            START REGISTRATION
                        </Link>
                    )}
                    <button type="button" className="mf-modal-secondary" onClick={onClose}>
                        I&apos;ll do this later
                    </button>
                </div>
            </div>
        </div>
    );
}
