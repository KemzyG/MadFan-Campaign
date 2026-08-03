import { Head, useForm, usePage } from "@inertiajs/react";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import FanLayout from "../../Layouts/FanLayout";
import ConnectedAccountsSection from "../../Components/Fan/ConnectedAccountsSection";
import FanBrandLogo from "../../Components/Fan/FanBrandLogo";
import PassportQrCode from "../../Components/Fan/PassportQrCode";
import { DEFAULT_AVATAR_SRC } from "../../constants/avatars";

const OTHER_CLUB = "Other";

/**
 * Keep media on the current browser origin.
 * Avoids localhost vs 127.0.0.1 CORS when APP_URL differs from the page host.
 */
function sameOriginMediaUrl(url) {
    if (!url || typeof url !== "string") {
        return url;
    }

    if (url.startsWith("/") || url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
    }

    try {
        const parsed = new URL(url, window.location.origin);

        if (
            parsed.pathname.startsWith("/storage/")
            || parsed.pathname === "/default-avatar.png"
            || parsed.pathname.startsWith("/default-avatar")
        ) {
            return `${parsed.pathname}${parsed.search}`;
        }
    } catch {
        return url;
    }

    return url;
}

function formatJoinedDate(iso) {
    if (!iso) {
        return null;
    }

    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function passportImageFilename(fanId) {
    const slug = String(fanId || "fan")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `madfan-passport-${slug || "fan"}.png`;
}

async function downloadDataUrl(dataUrl, filename) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.download = filename;
    link.href = objectUrl;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}

function waitForPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

export default function Passport({
    passport,
    referrals,
    clubs = [],
    connected_accounts: connectedAccounts = [],
    required_accounts_complete: requiredAccountsComplete = true,
    missing_required_accounts: missingRequiredAccounts = [],
    social_links: socialLinks = [],
    telegram_bot_username: telegramBotUsername,
    suggested_x_handle: suggestedXHandle,
    platform_x_handle: platformXHandleProp,
    fan,
}) {
    const { errors, flash } = usePage().props;
    const user = passport?.user ?? {};
    const cardRef = useRef(null);
    const cardFrontRef = useRef(null);
    const avatarInputRef = useRef(null);
    const previousAvatarUrlRef = useRef(user.avatar_url);
    const [flipped, setFlipped] = useState(false);
    const [capturingCard, setCapturingCard] = useState(false);
    const [toast, setToast] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);
    const defaultClub = user.club || clubs[0]?.name || "";

    const { data, setData, post, processing, transform } = useForm({
        _method: "patch",
        name: user.name ?? "",
        handle: user.handle ?? "",
        club: defaultClub,
        avatar: null,
    });

    const referralLink =
        referrals?.referral_link ?? `madfan.io/r/${user.fan_id ?? ""}`;
    const referralUrl = referralLink.startsWith("http")
        ? referralLink
        : `https://${referralLink}`;
    const referralCount = referrals?.referral_count ?? user.referral_count ?? 0;
    const milestones = referrals?.milestones ?? [];
    const referredFans = referrals?.referred_fans ?? [];
    const avatarSrc =
        avatarPreview
        || sameOriginMediaUrl(user.avatar_url)
        || DEFAULT_AVATAR_SRC;

    useEffect(() => {
        transform((form) => {
            const payload = { ...form };

            // Avoid sending avatar=null as an empty multipart field.
            if (!(payload.avatar instanceof File)) {
                delete payload.avatar;
            }

            // Omit blank optional fields so partial saves don't fail validation.
            for (const field of ["name", "handle", "club", "avatar_emoji"]) {
                if (
                    payload[field] === null
                    || payload[field] === undefined
                    || (typeof payload[field] === "string" && payload[field].trim() === "")
                ) {
                    delete payload[field];
                }
            }

            return payload;
        });
    }, [transform]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    // Drop the local blob preview only after the server avatar URL actually changes.
    useEffect(() => {
        if (user.avatar_url === previousAvatarUrlRef.current) {
            return;
        }

        previousAvatarUrlRef.current = user.avatar_url;

        setAvatarPreview((current) => {
            if (current) {
                URL.revokeObjectURL(current);
            }

            return null;
        });
        setData("avatar", null);

        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }
    }, [user.avatar_url, setData]);

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(""), 2800);
    }

    function onAvatarChange(e) {
        const file = e.target.files?.[0] ?? null;

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setData("avatar", file);
        setAvatarPreview(file ? URL.createObjectURL(file) : null);
    }

    function savePassport(e) {
        e.preventDefault();
        post("/passport", {
            forceFormData: true,
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                showToast("PASSPORT SAVED");
            },
        });
    }

    function copyRefLink() {
        navigator.clipboard.writeText(referralUrl);
        showToast("REFERRAL LINK COPIED");
    }

    const tierName =
        passport?.user?.loyalty_tier?.name
        ?? passport?.tier_progress?.current_tier
        ?? "CORE FAN";
    const season = passport?.season ?? {};
    const seasonCode = season.code || season.tag || "S01";
    const seasonName = season.name || seasonCode;
    const seasonWeekNumber = season.active_week?.week_number ?? passport?.stats?.active_week_number ?? null;
    const seasonWeekLabel = seasonWeekNumber ? `W${seasonWeekNumber}` : "—";
    const xHandle = (data.handle || user.handle || "").trim();
    const xHandleDisplay = xHandle
        ? xHandle.startsWith("@")
            ? xHandle
            : `@${xHandle}`
        : null;
    const tasksDone = passport?.stats?.tasks_done ?? 0;
    const loyaltyScore =
        passport?.loyalty_score?.total
        ?? passport?.stats?.loyalty_score
        ?? user.loyalty_score
        ?? user.total_points
        ?? 0;
    const tierProgress = passport?.tier_progress?.progress_percentage ?? 0;
    const referralProgress = passport?.referral_progress?.progress_percentage ?? 0;
    const streakProgress = passport?.streak_progress?.progress_percentage ?? 0;
    const streakTarget = passport?.streak_progress?.target_days ?? 7;
    const nextTierLabel =
        passport?.tier_progress?.next_tier === "MAX"
            ? "MAX"
            : (passport?.tier_progress?.next_tier ?? "Next");
    const referralTarget =
        passport?.referral_progress?.next_milestone_target ?? referralCount;
    const platformXHandle = (() => {
        const fromProp = (platformXHandleProp || "").trim();
        const fromLinks = socialLinks.find(
            (item) => item.platform === "x" || item.platform === "twitter",
        )?.handle;
        const handle = (fromProp || fromLinks || "@madfan").trim();

        return handle.startsWith("@") ? handle : `@${handle}`;
    })();

    function passportShareText() {
        const handleLine = xHandleDisplay
            ? `𝕏 ${xHandleDisplay}`
            : "𝕏 Connect your X handle";

        return `My ${platformXHandle} Fan Passport · ${seasonName} (${seasonCode}) 🟡\n\n${handleLine}\n🔥 ${user.current_streak_days ?? 0} day streak\n⚡ ${loyaltyScore}% loyalty score\n⚽ ${data.club || user.club || "My club"}\n\nJoin me → ${referralUrl}\n#MadFan #LoyaltyEconomy`;
    }

    function shareToX() {
        const text = encodeURIComponent(passportShareText());
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
        showToast("OPENED X POST");
    }

    async function capturePassportImage() {
        const node = cardFrontRef.current;

        if (!node) {
            throw new Error("Passport card is not ready.");
        }

        setFlipped(false);
        cardRef.current?.classList.add("exporting");
        node.classList.add("exporting-face");

        const watermark = node.querySelector(".card-club-watermark");
        const exportOptions = {
            cacheBust: true,
            pixelRatio: Math.min(2, window.devicePixelRatio || 2),
            backgroundColor: "#040704",
            skipFonts: false,
            fetchRequestInit: {
                mode: "cors",
                credentials: "omit",
                cache: "no-cache",
            },
            // Transparent 1x1 fallback if an image is blocked by CORS.
            imagePlaceholder:
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            style: {
                transform: "none",
                backfaceVisibility: "visible",
                webkitBackfaceVisibility: "visible",
            },
        };

        try {
            await waitForPaint();
            await new Promise((resolve) => setTimeout(resolve, 50));

            try {
                return await toPng(node, exportOptions);
            } catch (firstError) {
                console.warn(
                    "Passport export retry without crest watermark",
                    firstError,
                );

                // Club crest CSS backgrounds often break html-to-image via CORS.
                const previousDisplay = watermark?.style.display;
                if (watermark) {
                    watermark.style.display = "none";
                }

                try {
                    await waitForPaint();

                    return await toPng(node, {
                        ...exportOptions,
                        filter: (element) =>
                            !element?.classList?.contains("card-club-watermark")
                            && !element?.classList?.contains("card-shimmer"),
                    });
                } finally {
                    if (watermark) {
                        watermark.style.display = previousDisplay ?? "";
                    }
                }
            }
        } finally {
            node.classList.remove("exporting-face");
            cardRef.current?.classList.remove("exporting");
        }
    }

    async function savePassportImage(event) {
        event?.stopPropagation?.();

        if (capturingCard) {
            return;
        }

        setCapturingCard(true);
        showToast("SAVING PASSPORT IMAGE...");

        try {
            const dataUrl = await capturePassportImage();

            if (!dataUrl || dataUrl === "data:,") {
                throw new Error("Empty passport image.");
            }

            await downloadDataUrl(dataUrl, passportImageFilename(user.fan_id));
            showToast("PASSPORT IMAGE SAVED");
        } catch (error) {
            console.error("Passport image export failed", error);
            showToast("COULD NOT SAVE IMAGE");
        } finally {
            setCapturingCard(false);
        }
    }

    const joinedDate = formatJoinedDate(user.joined_at ?? user.created_at);
    const selectedClub =
        clubs.find((club) => club.name === data.club) ?? null;
    const clubLogoUrl = sameOriginMediaUrl(selectedClub?.logo_url || null);
    const clubWatermarkStyle = clubLogoUrl
        ? { backgroundImage: `url("${clubLogoUrl}")` }
        : undefined;

    return (
        <FanLayout>
            <Head title="Fan Passport" />

            <div className="wrap">
                <div className="page-header">
                    <div className="page-eye">{seasonName} · Identity</div>
                </div>
                <div className="passport-stage">
                    <div
                        ref={cardRef}
                        className={`passport-card${flipped ? " flipped" : ""}${capturingCard ? " exporting" : ""}`}
                        onClick={() => setFlipped(!flipped)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setFlipped(!flipped);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <div
                            ref={cardFrontRef}
                            className={`card-face card-front${clubLogoUrl ? " has-club-bg" : ""}`}
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
                                <div className="card-season-tag">{seasonCode}</div>
                            </div>
                            <div className="card-tier-badge">
                                {tierName.toUpperCase()}
                            </div>
                            <div className="card-avatar-zone">
                                <div className="card-avatar">
                                    <img
                                        key={avatarSrc}
                                        src={avatarSrc}
                                        alt={data.name || "Fan avatar"}
                                        crossOrigin={
                                            /^https?:\/\//i.test(avatarSrc)
                                                ? "anonymous"
                                                : undefined
                                        }
                                        decoding="async"
                                    />
                                </div>
                                <div>
                                    <div className="card-fan-name">
                                        {(
                                            data.name || "YOUR NAME"
                                        ).toUpperCase()}
                                    </div>
                                    <div className="card-fan-handle">
                                          Club: {data.club}
                                    </div>
                                    <div className="card-fan-id"> 
                                       X: {xHandleDisplay ? `${xHandleDisplay}` : ""}
                                    </div>
                                    {joinedDate && (
                                        <div className="card-joined">
                                            JOINED {joinedDate}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="card-stats-row">
                                <div className="card-stat">
                                    <div className="card-stat-val">
                                        {Number(
                                            user.total_points ?? 0,
                                        ).toLocaleString()}
                                    </div>
                                    <div className="card-stat-label">
                                        POINTS
                                    </div>
                                </div>
                                <div className="card-stat">
                                    <div className="card-stat-val">
                                        {user.current_streak_days ?? 0}
                                    </div>
                                    <div className="card-stat-label">
                                        DAY STREAK
                                    </div>
                                </div>
                                <div className="card-stat">
                                    <div className="card-stat-val">
                                        {Number(loyaltyScore)}%
                                    </div>
                                    <div className="card-stat-label">
                                        LOYALTY SCORE
                                    </div>
                                </div>
                            </div>
                            <div className="card-club-strip" />
                        </div>

                        <div
                            className={`card-face card-back${clubLogoUrl ? " has-club-bg" : ""}`}
                        >
                            {clubLogoUrl ? (
                                <div
                                    className="card-club-watermark"
                                    style={clubWatermarkStyle}
                                    aria-hidden="true"
                                />
                            ) : null}
                            <div className="card-top-bar" />
                            <div className="back-title">
                                FAN LOYALTY RECORD · {seasonCode}
                            </div>
                            <div className="back-stats-grid">
                                <div className="back-stat-cell">
                                    <div className="bsc-val">{tasksDone}</div>
                                    <div className="bsc-label">TASKS DONE</div>
                                </div>
                                <div className="back-stat-cell">
                                    <div className="bsc-val">
                                        {user.current_streak_days ?? 0}
                                    </div>
                                    <div className="bsc-label">DAY STREAK</div>
                                </div>
                                <div className="back-stat-cell">
                                    <div className="bsc-val">{seasonWeekLabel}</div>
                                    <div className="bsc-label">SEASON WEEK</div>
                                </div>
                            </div>
                            <div className="back-bar-row">
                                <div className="back-bar-label">
                                    <span>TIER PROGRESS</span>
                                    <span style={{ color: "var(--flame)" }}>
                                        {user.total_points ?? 0} → {nextTierLabel}
                                    </span>
                                </div>
                                <div className="back-bar-track">
                                    <div
                                        className="back-bar-fill"
                                        style={{
                                            width: `${tierProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="back-bar-row">
                                <div className="back-bar-label">
                                    <span>REFERRAL PROGRESS</span>
                                    <span style={{ color: "var(--flame)" }}>
                                        {referralCount}
                                        {passport?.referral_progress?.next_milestone_target
                                            ? ` / ${referralTarget}`
                                            : " · MAX"}
                                    </span>
                                </div>
                                <div className="back-bar-track">
                                    <div
                                        className="back-bar-fill"
                                        style={{
                                            width: `${referralProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="back-bar-row">
                                <div className="back-bar-label">
                                    <span>STREAK PROGRESS</span>
                                    <span style={{ color: "var(--flame)" }}>
                                        {user.current_streak_days ?? 0} / {streakTarget} DAYS
                                    </span>
                                </div>
                                <div className="back-bar-track">
                                    <div
                                        className="back-bar-fill"
                                        style={{
                                            width: `${streakProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                className="back-qr-area"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                            >
                                <PassportQrCode
                                    value={referralUrl}
                                    size={64}
                                    className="back-qr"
                                    title="Scan referral link"
                                />
                                <div className="back-qr-label">
                                    SCAN / SHARE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flip-hint">
                    TAP CARD TO FLIP · <span>HOLD TO TILT</span>
                </div>

                <div className="share-actions">
                    <button
                        type="button"
                        className="share-btn primary"
                        onClick={shareToX}
                    >
                        <div className="share-btn-icon">𝕏</div>
                        POST PASSPORT
                    </button>
                    <button
                        type="button"
                        className="share-btn"
                        onClick={copyRefLink}
                    >
                        <div className="share-btn-icon">🔗</div>
                        COPY LINK
                    </button>
                    <button
                        type="button"
                        className="share-btn"
                        onClick={savePassportImage}
                        disabled={capturingCard}
                        aria-busy={capturingCard}
                    >
                        <div className="share-btn-icon">⬇</div>
                        {capturingCard ? "SAVING..." : "SAVE IMAGE"}
                    </button>
                </div>

                <div className="ref-section">
                    <div className="section-eye">Referral Programme</div>
                    <div className="section-title">YOUR REFERRAL LINK</div>
                    <p
                        style={{
                            color: "var(--muted)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            marginBottom: "16px",
                        }}
                    >
                        Every fan who joins through your link earns you{" "}
                        <strong style={{ color: "var(--white)" }}>
                            500 points
                        </strong>
                        . No cap. No limit.
                    </p>
                    <div className="ref-share-row">
                        <div className="ref-link-block">
                            <div className="ref-link-url">
                                {referralUrl.replace(/^https?:\/\//, "")}
                            </div>
                            <button
                                type="button"
                                className="btn-copy"
                                onClick={copyRefLink}
                            >
                                COPY LINK
                            </button>
                        </div>
                        <div className="ref-qr-panel">
                            <PassportQrCode
                                value={referralUrl}
                                size={132}
                                className="ref-qr"
                                title="Scan to open referral link"
                            />
                            <div className="ref-qr-caption">SCAN TO JOIN</div>
                        </div>
                    </div>

                    <div className="ref-progress-block">
                        <div className="ref-count-display">
                            <div className="ref-count-big">{referralCount}</div>
                            <div className="ref-count-label">
                                FANS
                                <br />
                                REFERRED
                            </div>
                        </div>
                        <div className="ref-milestones">
                            {milestones.map((m) => {
                                const done = m.status === "done";
                                const next =
                                    !done &&
                                    referralCount >= m.target_count - 1;
                                const pct = Math.min(
                                    100,
                                    (referralCount / m.target_count) * 100,
                                );
                                return (
                                    <div
                                        key={m.id}
                                        className="ref-milestone-row"
                                    >
                                        <div
                                            className={`ref-m-count${done ? " done" : ""}`}
                                        >
                                            {m.target_count}
                                        </div>
                                        <div className="ref-m-bar-wrap">
                                            <div className="ref-m-name">
                                                {m.reward_name}
                                            </div>
                                            <div className="ref-m-desc">
                                                {m.reward_description}
                                            </div>
                                            <div className="ref-m-track">
                                                <div
                                                    className="ref-m-fill"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className={`ref-m-status${done ? " done" : next ? " next" : " locked"}`}
                                        >
                                            {done
                                                ? "DONE"
                                                : next
                                                  ? "1 AWAY"
                                                  : "LOCKED"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="fans-list">
                        <div className="fans-list-header">
                            <div>FAN</div>
                            <div>POINTS</div>
                            <div>STATUS</div>
                        </div>
                        {referredFans.length === 0 ? (
                            <div className="empty-fans">
                                NO REFERRALS YET
                                <br />
                                SHARE YOUR LINK TO START BUILDING YOUR SQUAD
                            </div>
                        ) : (
                            referredFans.map((ref) => (
                                <div key={ref.id} className="fan-row">
                                    <div className="fan-row-name">
                                        <div className="fan-avatar-sm">🔥</div>@
                                        {ref.referred_user_handle ??
                                            ref.referred_email ??
                                            "fan"}
                                    </div>
                                    <div className="fan-row-pts">
                                        +{ref.points_awarded ?? 500}
                                    </div>
                                    <div
                                        className={`fan-row-status ${ref.status === "activated" ? "active" : "pending"}`}
                                    >
                                        {ref.status?.toUpperCase() ?? "PENDING"}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* <div className="ref-section connected-accounts-passport">
                    <div className="section-eye">Verification</div>
                    <div className="section-title">CONNECTED ACCOUNTS</div>
                    <p
                        style={{
                            color: "var(--muted)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            marginBottom: "16px",
                        }}
                    >
                        X and Discord are required for task verification.
                        Telegram is optional but speeds up channel tasks.
                    </p>

                    {flash?.success && (
                        <p className="connect-flash success">{flash.success}</p>
                    )}
                    {flash?.error && (
                        <p className="connect-flash error">{flash.error}</p>
                    )}

                    <ConnectedAccountsSection
                        accounts={connectedAccounts}
                        requiredComplete={requiredAccountsComplete}
                        missingRequired={missingRequiredAccounts}
                        socialLinks={socialLinks}
                        telegramBotUsername={telegramBotUsername}
                        suggestedXHandle={suggestedXHandle}
                        errors={errors}
                        returnTo="passport"
                        compact
                    />
                </div> */}

                <div className="edit-section">
                    <div className="section-eye">Customise</div>
                    <div className="section-title">EDIT YOUR PASSPORT</div>
                    <form onSubmit={savePassport}>
                        <div className="edit-grid">
                            <div className="edit-field">
                                <label
                                    className="edit-label"
                                    htmlFor="input-name"
                                >
                                    DISPLAY NAME
                                </label>
                                <input
                                    className="edit-input"
                                    id="input-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                />
                            </div>
                            <div className="edit-field">
                                <label
                                    className="edit-label"
                                    htmlFor="input-handle"
                                >
                                    X HANDLE
                                </label>
                                <input
                                    className="edit-input"
                                    id="input-handle"
                                    value={data.handle}
                                    onChange={(e) =>
                                        setData("handle", e.target.value)
                                    }
                                />
                            </div>
                            <div className="edit-field">
                                <label
                                    className="edit-label"
                                    htmlFor="input-club"
                                >
                                    YOUR CLUB
                                </label>
                                <select
                                    className="edit-select"
                                    id="input-club"
                                    value={data.club}
                                    onChange={(e) =>
                                        setData("club", e.target.value)
                                    }
                                >
                                    {clubs.map((club) => (
                                        <option key={club.id} value={club.name}>
                                            {club.name}
                                            {club.league?.short ? ` · ${club.league.short}` : ""}
                                        </option>
                                    ))}
                                    {data.club &&
                                        data.club !== OTHER_CLUB &&
                                        !clubs.some(
                                            (club) => club.name === data.club,
                                        ) && (
                                            <option value={data.club}>
                                                {data.club}
                                            </option>
                                        )}
                                    <option value={OTHER_CLUB}>Other</option>
                                </select>
                            </div>
                            <div className="edit-field">
                                <label
                                    className="edit-label"
                                    htmlFor="input-avatar"
                                >
                                    AVATAR IMAGE
                                </label>
                                <div className="avatar-upload">
                                    <div className="avatar-upload-preview">
                                        <img key={avatarSrc} src={avatarSrc} alt="Avatar preview" />
                                    </div>
                                    <div className="avatar-upload-controls">
                                        <input
                                            ref={avatarInputRef}
                                            className="edit-input"
                                            id="input-avatar"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={onAvatarChange}
                                        />
                                        <p className="avatar-upload-hint">
                                            JPG, PNG, WEBP or GIF. Max 2MB.
                                        </p>
                                        {errors?.avatar && (
                                            <p className="reg-field-error">{errors.avatar}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn-update"
                            disabled={processing}
                        >
                            {processing ? "SAVING…" : "SAVE PASSPORT"}
                        </button>
                    </form>
                </div>
            </div>

            <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
        </FanLayout>
    );
}
