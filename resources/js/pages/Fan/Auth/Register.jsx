import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import PasswordVisibilityToggle from '../../../Components/Fan/PasswordVisibilityToggle';
import ToastStack from '../../../Components/Fan/ToastStack';
import { LockIcon, MailIcon, UserIcon } from '../../../Components/Fan/AuthFieldIcons';
import { getDeviceFingerprint } from '../../../lib/deviceFingerprint';
import { groupClubsByLeague } from '../../../lib/groupClubsByLeague';
import { useToasts } from '../../../lib/useToasts';

const TOTAL_STEPS = 3;
const OTHER_CLUB = 'Other';
const REGISTRATION_STEPS = [
    { id: 1, label: 'Your Details' },
    { id: 2, label: 'Your Club' },
    { id: 3, label: 'Your Profile' },
];

function stepForErrors(errors) {
    if (errors.username || errors.bio || errors.date_of_birth || errors.avatar || errors.registration || errors.device_fingerprint) {
        return 3;
    }

    if (errors.club) {
        return 2;
    }

    if (errors.name || errors.email || errors.password) {
        return 1;
    }

    return 1;
}

function RegistrationStepper({ currentStep }) {
    return (
        <div className="mf-auth-stepper" aria-label="Registration progress">
            {REGISTRATION_STEPS.map((item, index) => {
                const done = currentStep > item.id;
                const active = currentStep === item.id;

                return (
                    <div key={item.id} className="mf-auth-stepper-item-wrap">
                        <div className={`mf-auth-stepper-item${active ? ' active' : ''}${done ? ' done' : ''}`}>
                            <span className="mf-auth-stepper-num">{done ? '✓' : item.id}</span>
                            <span className="mf-auth-stepper-label">{item.label}</span>
                        </div>
                        {index < REGISTRATION_STEPS.length - 1 && (
                            <div className={`mf-auth-stepper-line${done ? ' done' : ''}`} />
                        )}
                    </div>
                );
            })}
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
    const [avatarPreview, setAvatarPreview] = useState(null);
    const { toasts, pushToast, dismissToast } = useToasts();

    const { data, setData, post, processing, clearErrors, transform } = useForm({
        name: '',
        email: email || '',
        password: '',
        password_confirmation: '',
        club: '',
        username: '',
        bio: '',
        date_of_birth: '',
        avatar: null,
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

    const blockedMessage =
        registration_blocked_message ||
        flash?.error ||
        (registration_blocked
            ? 'This device already has a Mad Fan account. Sign in to finish connecting your accounts.'
            : null);

    useEffect(() => {
        if (blockedMessage) {
            pushToast('err', blockedMessage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockedMessage]);

    useEffect(() => {
        Object.values(errors ?? {})
            .filter(Boolean)
            .forEach((message) => pushToast('err', message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors]);

    const groupedClubs = useMemo(() => groupClubsByLeague(clubs), [clubs]);

    function handleAvatarChange(e) {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);

        if (!file) {
            setAvatarPreview(null);

            return;
        }

        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
    }

    function canContinue() {
        if (registration_blocked) {
            return false;
        }

        if (step === 1) {
            return (
                data.name.trim() !== '' &&
                data.email.trim() !== '' &&
                data.password.length >= 8 &&
                data.password === data.password_confirmation
            );
        }

        if (step === 2) {
            return data.club !== '';
        }

        return data.username.trim().length >= 3;
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

        post('/register', { preserveScroll: true, forceFormData: true });
    }

    return (
        <div className="mf-auth-stage">
            <Head title="Register" />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <div className="mf-onboard-panel" style={{ maxWidth: '32rem' }}>
                <div className="mf-auth-header">
                    <Link href="/" className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </Link>
                </div>

                <RegistrationStepper currentStep={step} />

                {registration_blocked ? (
                    <div className="mf-auth-actions" style={{ marginTop: '1.5rem' }}>
                        <Link href="/login" className="mf-btn mf-btn--pitch mf-auth-submit">
                            Login to continue →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="mf-auth-form">
                        {step === 1 && (
                            <div className="mf-auth-form" style={{ marginTop: 0 }}>
                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-name">
                                        Full name
                                    </label>
                                    <div className="mf-auth-input-wrap">
                                        <span className="mf-auth-input-icon">
                                            <UserIcon />
                                        </span>
                                        <input
                                            id="reg-name"
                                            className={`mf-auth-input mf-auth-input--icon${errors.name ? ' has-error' : ''}`}
                                            type="text"
                                            placeholder="Your name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-email">
                                        Email
                                    </label>
                                    <div className="mf-auth-input-wrap">
                                        <span className="mf-auth-input-icon">
                                            <MailIcon />
                                        </span>
                                        <input
                                            id="reg-email"
                                            className={`mf-auth-input mf-auth-input--icon${errors.email ? ' has-error' : ''}`}
                                            type="email"
                                            placeholder="your@email.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-password">
                                        Password
                                    </label>
                                    <div className="mf-auth-input-wrap">
                                        <span className="mf-auth-input-icon">
                                            <LockIcon />
                                        </span>
                                        <input
                                            id="reg-password"
                                            className={`mf-auth-input mf-auth-input--icon mf-auth-input--password${errors.password ? ' has-error' : ''}`}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min. 8 characters"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                        />
                                        <PasswordVisibilityToggle
                                            visible={showPassword}
                                            onToggle={() => setShowPassword((current) => !current)}
                                        />
                                    </div>
                                </div>

                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-password-confirm">
                                        Confirm password
                                    </label>
                                    <div className="mf-auth-input-wrap">
                                        <span className="mf-auth-input-icon">
                                            <LockIcon />
                                        </span>
                                        <input
                                            id="reg-password-confirm"
                                            className="mf-auth-input mf-auth-input--icon"
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

                        {step === 2 && (
                            <div>
                                <p className="mf-text-section font-semibold text-[var(--mf-text)]">
                                    Choose your club
                                </p>

                                <div className="mt-3 max-h-[min(52vh,28rem)] overflow-y-auto pe-1 sm:max-h-none">
                                    {groupedClubs.map(([league, leagueClubs]) => (
                                        <div key={league} className="mf-auth-league-group">
                                            <p className="mf-auth-league-label">{league}</p>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {leagueClubs.map((club) => (
                                                    <button
                                                        key={club.id}
                                                        type="button"
                                                        className={`mf-club-opt${data.club === club.name ? ' is-selected' : ''}`}
                                                        onClick={() => setData('club', club.name)}
                                                    >
                                                        {club.logo_url ? (
                                                            <img
                                                                src={club.logo_url}
                                                                alt=""
                                                                className="mf-avatar h-10 w-10"
                                                            />
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
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mf-auth-league-group">
                                        <div className="grid gap-2 sm:grid-cols-2">
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
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="mf-auth-form" style={{ marginTop: 0 }}>
                                <div className="mf-auth-field">
                                    <label className="mf-auth-label">Avatar (optional)</label>
                                    <div className="flex items-center gap-3">
                                        <span className="mf-avatar h-14 w-14 overflow-hidden text-[var(--mf-muted)]">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                data.name.slice(0, 1).toUpperCase() || '?'
                                            )}
                                        </span>
                                        <label className="mf-btn mf-btn--ghost" style={{ cursor: 'pointer' }}>
                                            Choose photo
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleAvatarChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-username">
                                        Username
                                    </label>
                                    <div className="mf-auth-input-wrap">
                                        <span className="mf-auth-input-icon">
                                            <UserIcon />
                                        </span>
                                        <input
                                            id="reg-username"
                                            className={`mf-auth-input mf-auth-input--icon${errors.username ? ' has-error' : ''}`}
                                            type="text"
                                            placeholder="yourusername"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-dob">
                                        Date of birth (optional)
                                    </label>
                                    <input
                                        id="reg-dob"
                                        className={`mf-auth-input${errors.date_of_birth ? ' has-error' : ''}`}
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                    />
                                </div>

                                <div className="mf-auth-field">
                                    <label className="mf-auth-label" htmlFor="reg-bio">
                                        Bio (optional)
                                    </label>
                                    <textarea
                                        id="reg-bio"
                                        className={`mf-auth-input${errors.bio ? ' has-error' : ''}`}
                                        placeholder="Tell other fans about yourself"
                                        value={data.bio}
                                        onChange={(e) => setData('bio', e.target.value)}
                                        maxLength={280}
                                        rows={3}
                                        style={{ height: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem', resize: 'vertical' }}
                                    />
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
                                className="mf-btn mf-btn--pitch mf-auth-submit"
                                style={{ flex: 1 }}
                                disabled={processing || !canContinue()}
                            >
                                {processing
                                    ? 'Registering…'
                                    : step === TOTAL_STEPS
                                      ? 'Register'
                                      : 'Continue →'}
                            </button>
                        </div>
                    </form>
                )}

                {!registration_blocked && (
                    <div className="mf-auth-actions">
                        <Link href="/login" className="mf-auth-link">
                            Already have an account? Login →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
