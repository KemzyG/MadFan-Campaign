import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import RegistrationStepper from '../../../Components/Fan/RegistrationStepper';
import { DEFAULT_AVATAR_SRC } from '../../../constants/avatars';
import { getDeviceFingerprint } from '../../../lib/deviceFingerprint';

const TOTAL_STEPS = 2;
const OTHER_CLUB = 'Other';

function stepForErrors(errors) {
    if (errors.registration || errors.device_fingerprint) {
        return 2;
    }

    if (errors.name || errors.email || errors.password) {
        return 2;
    }

    if (errors.club) {
        return 1;
    }

    return 1;
}

function RegistrationPreview({ name, club, clubLogoUrl = null }) {
    const displayName = (name || 'YOUR NAME').toUpperCase();
    const clubWatermarkStyle = clubLogoUrl
        ? { backgroundImage: `url("${clubLogoUrl}")` }
        : undefined;

    return (
        <div className="reg-preview-stage">
            <div className="passport-card reg-preview-card">
                <div
                    className={`card-face card-front${clubLogoUrl ? ' has-club-bg' : ''}`}
                >
                    {clubLogoUrl ? (
                        <div
                            className="card-club-watermark"
                            style={clubWatermarkStyle}
                            aria-hidden="true"
                        />
                    ) : null}
                    <div className="card-top-bar" />
                    <div className="card-shimmer" />
                    <div className="card-logo-area">
                        <FanBrandLogo asLink={false} className="card-logo-img" size={28} />
                        <div className="card-season-tag">S01</div>
                    </div>
                    <div className="card-tier-badge">STARTER FAN</div>
                    <div className="card-avatar-zone">
                        <div className="card-avatar">
                            <img src={DEFAULT_AVATAR_SRC} alt="Default fan avatar" />
                        </div>
                        <div>
                            <div className="card-fan-name">{displayName}</div>
                            <div className="card-fan-handle">{club || 'Your club'} · Season 01</div>
                            <div className="card-fan-id">MF XXXXX · CONNECT X NEXT</div>
                        </div>
                    </div>
                    <div className="card-stats-row">
                        <div className="card-stat">
                            <div className="card-stat-val">0</div>
                            <div className="card-stat-label">POINTS</div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-val">0</div>
                            <div className="card-stat-label">DAY STREAK</div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-val">0</div>
                            <div className="card-stat-label">REFERRALS</div>
                        </div>
                    </div>
                    <div className="card-club-strip" />
                </div>
            </div>
        </div>
    );
}

export default function FanRegister({
    email = '',
    referrer_fan_id = null,
    clubs = [],
    registration_blocked = false,
    registration_blocked_message = null,
}) {
    const { errors, flash } = usePage().props;
    const [step, setStep] = useState(() => stepForErrors(errors ?? {}));
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, clearErrors, transform } = useForm({
        club: '',
        name: '',
        email: email || '',
        password: '',
        password_confirmation: '',
        referrer_fan_id: referrer_fan_id ?? '',
        device_fingerprint: '',
    });

    useEffect(() => {
        setData('device_fingerprint', getDeviceFingerprint());
    }, [setData]);

    useEffect(() => {
        if (email && !data.email) {
            setData('email', email);
        }
    }, [email, data.email, setData]);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setStep(stepForErrors(errors));
        }
    }, [errors]);

    const errorMessages = Object.values(errors).filter(Boolean);
    const blockedMessage =
        registration_blocked_message ||
        flash?.error ||
        (registration_blocked
            ? 'This device already has a Mad Fan account. Sign in to finish connecting your accounts.'
            : null);
    const showErrorBanner = Boolean(blockedMessage) || errorMessages.length > 0;
    const selectedClub = clubs.find((club) => club.name === data.club) ?? null;

    function canContinue() {
        if (registration_blocked) {
            return false;
        }

        if (step === 1) {
            return data.club !== '';
        }

        return (
            data.name.trim() !== '' &&
            data.email.trim() !== '' &&
            data.password.length >= 8 &&
            data.password === data.password_confirmation
        );
    }

    function goNext() {
        if (!canContinue()) {
            return;
        }

        clearErrors();
        setStep((current) => Math.min(current + 1, TOTAL_STEPS));
    }

    function goBack() {
        clearErrors();
        setStep((current) => Math.max(current - 1, 1));
    }

    function submit(e) {
        e.preventDefault();
        if (registration_blocked) {
            return;
        }

        if (step < TOTAL_STEPS) {
            goNext();

            return;
        }

        transform((formData) => ({
            ...formData,
            device_fingerprint: formData.device_fingerprint || getDeviceFingerprint(),
        }));

        post('/register', { preserveScroll: true });
    }

    return (
        <div className="mf-stage">
            <div className="mf-onboard">
                <Head title="Join" />

                <Link href="/" className="mf-auth-brand">
                    <FanBrandLogo asLink={false} size={28} className="mf-auth-brand-mark" />
                    <span>Mad Fan</span>
                </Link>

                <p className="mf-text-caption text-[var(--mf-pitch)]">
                    Step {step} of {TOTAL_STEPS}
                </p>
                <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">Claim your spot</p>
                <p className="mf-auth-lead">
                    Create your passport first. You&apos;ll connect X and Discord on the next screen, no
                    handle typing required here.
                </p>

                <RegistrationStepper currentStep={step} />

                {showErrorBanner && (
                    <div className="mf-auth-banner mf-auth-banner--error" role="alert">
                        {blockedMessage || errorMessages[0]}
                    </div>
                )}

                {registration_blocked ? (
                    <div className="mf-auth-actions" style={{ marginTop: '1.5rem' }}>
                        <Link href="/login" className="mf-btn mf-btn--pitch w-full">
                            Enter campaign to continue →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="mf-auth-form">
                        {step === 1 && (
                            <div>
                                <p className="mf-text-section font-semibold text-[var(--mf-text)]">
                                    Choose your club
                                </p>
                                <p className="mf-auth-lead">
                                    Pick the club you support. Your passport and leaderboard rank by club
                                    community.
                                </p>

                                <div className="mt-4 grid max-h-[min(52vh,28rem)] gap-2 overflow-y-auto pe-1 sm:max-h-none sm:grid-cols-2">
                                    {clubs.map((club) => (
                                        <button
                                            key={club.id}
                                            type="button"
                                            className={`mf-club-opt${data.club === club.name ? ' is-selected' : ''}`}
                                            onClick={() => setData('club', club.name)}
                                        >
                                            {club.logo_url ? (
                                                <img src={club.logo_url} alt="" className="mf-avatar h-10 w-10" />
                                            ) : (
                                                <span className="mf-avatar mf-text-meta h-10 w-10">
                                                    {club.short || '⚽'}
                                                </span>
                                            )}
                                            <span className="min-w-0">
                                                <span className="mf-text-ui block truncate font-semibold text-[var(--mf-text)]">
                                                    {club.name}
                                                </span>
                                                <span className="mf-text-meta block truncate text-[var(--mf-muted)]">
                                                    {club.league?.short || 'Football'}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className={`mf-club-opt${data.club === OTHER_CLUB ? ' is-selected' : ''}`}
                                        onClick={() => setData('club', OTHER_CLUB)}
                                    >
                                        <span className="mf-avatar h-10 w-10">⚽</span>
                                        <span className="min-w-0">
                                            <span className="mf-text-ui block truncate font-semibold text-[var(--mf-text)]">
                                                Other
                                            </span>
                                            <span className="mf-text-meta block truncate text-[var(--mf-muted)]">
                                                Not listed
                                            </span>
                                        </span>
                                    </button>
                                </div>
                                <p className="mf-auth-lead mt-3">
                                    Can’t find your club? Pick “Other” now and switch to it later from your
                                    passport.
                                </p>
                                {errors.club && <p className="mf-field-error">{errors.club}</p>}
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <p className="mf-text-section font-semibold text-[var(--mf-text)]">
                                    Complete your passport
                                </p>
                                <p className="mf-auth-lead">
                                    Set your account details. Next you&apos;ll connect your social accounts for
                                    verification.
                                </p>

                                <RegistrationPreview
                                    name={data.name}
                                    club={selectedClub?.name ?? data.club}
                                    clubLogoUrl={selectedClub?.logo_url ?? null}
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="mf-auth-field">
                                        <label className="mf-auth-label" htmlFor="reg-name">
                                            Display name
                                        </label>
                                        <input
                                            id="reg-name"
                                            className={`mf-auth-input${errors.name ? ' has-error' : ''}`}
                                            type="text"
                                            placeholder="Your name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <p className="mf-field-error">{errors.name}</p>}
                                    </div>
                                    <div className="mf-auth-field">
                                        <label className="mf-auth-label" htmlFor="reg-email">
                                            Email
                                        </label>
                                        <input
                                            id="reg-email"
                                            className={`mf-auth-input${errors.email ? ' has-error' : ''}`}
                                            type="email"
                                            placeholder="your@email.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <p className="mf-field-error">{errors.email}</p>}
                                    </div>
                                    <div className="mf-auth-field">
                                        <label className="mf-auth-label" htmlFor="reg-password">
                                            Password
                                        </label>
                                        <div className="mf-auth-input-wrap">
                                            <input
                                                id="reg-password"
                                                className={`mf-auth-input mf-auth-input--password${errors.password ? ' has-error' : ''}`}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Min. 8 characters"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="mf-auth-toggle"
                                                onClick={() => setShowPassword((current) => !current)}
                                            >
                                                {showPassword ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        {errors.password && <p className="mf-field-error">{errors.password}</p>}
                                    </div>
                                    <div className="mf-auth-field">
                                        <label className="mf-auth-label" htmlFor="reg-password-confirm">
                                            Confirm password
                                        </label>
                                        <input
                                            id="reg-password-confirm"
                                            className={`mf-auth-input${errors.password ? ' has-error' : ''}`}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Repeat password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-2 flex items-center gap-3">
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="mf-btn mf-btn--ghost"
                                    onClick={goBack}
                                    disabled={processing}
                                >
                                    ← Back
                                </button>
                            )}
                            <button
                                type="submit"
                                className="mf-btn mf-btn--pitch flex-1"
                                disabled={processing || !canContinue()}
                            >
                                {processing
                                    ? 'Creating…'
                                    : step === TOTAL_STEPS
                                      ? 'Create passport →'
                                      : 'Continue →'}
                            </button>
                        </div>
                    </form>
                )}

                {!registration_blocked && (
                    <div className="mf-auth-actions">
                        <Link href="/login" className="mf-auth-link">
                            Already have an account? Enter campaign →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
