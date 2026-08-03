import { socialPlatformIcon } from './socialPlatformIcons';

export default function FanFooter({ socialHandles = [] }) {
    const year = new Date().getFullYear();

    return (
        <footer>
            <div className="wrap">
                <div className="footer-logo">MADFAN</div>

                {socialHandles.length > 0 && (
                    <div className="footer-socials" aria-label="Mad Fan on social">
                        {socialHandles.map((social) => {
                            const icon = socialPlatformIcon(social.platform);

                            return (
                                <a
                                    key={social.platform}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="footer-social-link"
                                    title={`${social.label}: ${social.handle}`}
                                >
                                    <img
                                        src={icon.src}
                                        alt=""
                                        width={18}
                                        height={18}
                                        loading="lazy"
                                        decoding="async"
                                        aria-hidden="true"
                                    />
                                    <span className="footer-social-handle">{social.handle}</span>
                                    <span className="sr-only">{social.label}</span>
                                </a>
                            );
                        })}
                    </div>
                )}

                <p>© {year} Mad Fan · The Loyalty Layer of the Internet</p>
                <p className="footer-season">Season 01 Campaign · 8 Weeks · Live Now</p>
            </div>
        </footer>
    );
}
