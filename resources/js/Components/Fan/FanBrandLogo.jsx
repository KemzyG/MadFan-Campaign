import { Link } from '@inertiajs/react';

const LOGO_SRC = '/favicon.jpg';

export default function FanBrandLogo({
    href = '/',
    className = 'logo-avatar',
    size = 40,
    alt = 'MadFan',
    asLink = true,
}) {
    const image = (
        <img
            src={LOGO_SRC}
            alt={alt}
            width={size}
            height={size}
            className={className}
            decoding="async"
        />
    );

    if (!asLink) {
        return image;
    }

    return (
        <Link href={href} className="logo-avatar-link" aria-label={alt}>
            {image}
        </Link>
    );
}
