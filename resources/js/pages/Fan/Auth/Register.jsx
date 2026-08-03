import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import FanLayout from '../../../Layouts/FanLayout';
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
        <FanLayout withSidebar={false}>
            <Head title="Join" />
            <div className="wrap">
                <div className="signup-block reg-stepper-block">
                    <div className="reg-stepper-head">
                        <div className="reg-stepper-eye">
                            Step {step} of {TOTAL_STEPS}
                        </div>
                        <h2>CLAIM YOUR SPOT</h2>
                        <p>
                            Create your passport first. You&apos;ll connect X and Discord on the next screen, no
                            handle typing required here.
                        </p>
                    </div>

                    <RegistrationStepper currentStep={step} />

                    {showErrorBanner && (
                        <div className="reg-error-banner" role="alert">
                            {blockedMessage || errorMessages[0]}
                        </div>
                    )}

                    {registration_blocked ? (
                        <div className="reg-stepper-actions">
                            <a href="/login" className="btn-join reg-btn-next" style={{ textDecoration: 'none' }}>
                                ENTER CAMPAIGN TO CONTINUE →
                            </a>
                        </div>
                    ) : (
                    <form onSubmit={submit} className="reg-stepper-form">
                        {step === 1 && (
                            <div className="reg-step-panel">
                                <div className="reg-step-title">Choose Your Club</div>
                                <p className="reg-step-desc">
                                    Pick the club you support. Your passport and leaderboard rank by club community.
                                </p>

                                <div className="reg-club-grid">
                                    {clubs.map((club) => (
                                        <button
                                            key={club.id}
                                            type="button"
                                            className={`reg-club-option${data.club === club.name ? ' selected' : ''}`}
                                            onClick={() => setData('club', club.name)}
                                        >
                                            {club.logo_url ? (
                                                <img
                                                    src={club.logo_url}
                                                    alt=""
                                                    className="reg-club-logo"
                                                />
                                            ) : (
                                                <span className="reg-club-icon">{club.short || '⚽'}</span>
                                            )}
                                            <span className="reg-club-name">{club.name}</span>
                                            {club.league?.short && (
                                                <span className="reg-club-league">{club.league.short}</span>
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className={`reg-club-option${data.club === OTHER_CLUB ? ' selected' : ''}`}
                                        onClick={() => setData('club', OTHER_CLUB)}
                                    >
                                        <span className="reg-club-icon">⚽</span>
                                        <span className="reg-club-name">Other</span>
                                        <span className="reg-club-league">Not listed</span>
                                    </button>
                                </div>
                                <p className="reg-step-hint">
                                    Can’t find your club? Pick “Other” now and switch to it later from your passport.
                                </p>
                                {errors.club && <p className="reg-field-error">{errors.club}</p>}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="reg-step-panel">
                                <div className="reg-step-title">Complete Your Passport</div>
                                <p className="reg-step-desc">
                                    Set your account details. Next you&apos;ll connect your social accounts for
                                    verification.
                                </p>

                                <RegistrationPreview
                                    name={data.name}
                                    club={selectedClub?.name ?? data.club}
                                    clubLogoUrl={selectedClub?.logo_url ?? null}
                                />

                                <div className="reg-fields-grid">
                                    <div className="reg-field">
                                        <label className="edit-label" htmlFor="reg-name">
                                            DISPLAY NAME
                                        </label>
                                        <input
                                            id="reg-name"
                                            className={`edit-input${errors.name ? ' has-error' : ''}`}
                                            type="text"
                                            placeholder="Your name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <p className="reg-field-error">{errors.name}</p>}
                                    </div>
                                    <div className="reg-field">
                                        <label className="edit-label" htmlFor="reg-email">
                                            EMAIL
                                        </label>
                                        <input
                                            id="reg-email"
                                            className={`edit-input${errors.email ? ' has-error' : ''}`}
                                            type="email"
                                            placeholder="your@email.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <p className="reg-field-error">{errors.email}</p>}
                                    </div>
                                    <div className="reg-field">
                                        <label className="edit-label" htmlFor="reg-password">
                                            PASSWORD
                                        </label>
                                        <input
                                            id="reg-password"
                                            className={`edit-input${errors.password ? ' has-error' : ''}`}
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                        />
                                        {errors.password && <p className="reg-field-error">{errors.password}</p>}
                                    </div>
                                    <div className="reg-field">
                                        <label className="edit-label" htmlFor="reg-password-confirm">
                                            CONFIRM PASSWORD
                                        </label>
                                        <input
                                            id="reg-password-confirm"
                                            className={`edit-input${errors.password ? ' has-error' : ''}`}
                                            type="password"
                                            placeholder="Repeat password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="reg-stepper-actions">
                            {step > 1 && (
                                <button type="button" className="reg-btn-back" onClick={goBack} disabled={processing}>
                                    ← Back
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn-join reg-btn-next"
                                disabled={processing || !canContinue()}
                            >
                                {processing
                                    ? 'CREATING…'
                                    : step === TOTAL_STEPS
                                      ? 'CREATE PASSPORT →'
                                      : 'Continue →'}
                            </button>
                        </div>
                    </form>
                    )}

                    {!registration_blocked && (
                    <p style={{ marginTop: '20px' }}>
                        <a href="/login" style={{ color: 'var(--flame)', fontSize: '13px' }}>
                            Already have an account? Enter Campaign →
                        </a>
                    </p>
                    )}
                </div>
            </div>
        </FanLayout>
    );
}
