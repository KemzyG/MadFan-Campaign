import { QRCodeSVG } from 'qrcode.react';

/**
 * @param {{
 *   value: string,
 *   size?: number,
 *   className?: string,
 *   title?: string,
 * }} props
 */
export default function PassportQrCode({
    value,
    size = 72,
    className = 'passport-qr',
    title = 'Referral QR code',
}) {
    if (! value) {
        return null;
    }

    return (
        <div className={className} role="img" aria-label={title} title={title}>
            <QRCodeSVG
                value={value}
                size={size}
                level="M"
                bgColor="#f5f5f0"
                fgColor="#0a0f0a"
                marginSize={1}
            />
        </div>
    );
}
