// Matches http(s):// and bare www. URLs. Trailing punctuation commonly typed
// right after a link (.,;:!?) and a closing bracket/paren/quote are excluded
// from the match so "check this out: https://x.com/a." doesn't swallow the
// period, and "(https://x.com/a)" doesn't swallow the paren.
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
const TRAILING_PUNCTUATION = /[),.;:!?\]'"]+$/;

function trimTrailingPunctuation(url) {
    const match = url.match(TRAILING_PUNCTUATION);

    if (!match) {
        return { url, trailing: '' };
    }

    // A closing paren that balances an opening one earlier in the URL is part
    // of the link (e.g. Wikipedia URLs) — only strip it if unbalanced.
    if (match[0].startsWith(')') && (url.match(/\(/g)?.length || 0) >= (url.match(/\)/g)?.length || 0)) {
        return { url, trailing: '' };
    }

    return {
        url: url.slice(0, url.length - match[0].length),
        trailing: match[0],
    };
}

/**
 * Turns bare URLs in plain text into clickable links, returning an array of
 * strings and `<a>` elements safe to render directly — no HTML parsing, so
 * nothing in the surrounding text can inject markup.
 *
 * @param {string} text
 * @returns {Array<string|import('react').ReactNode>}
 */
export function linkifyText(text) {
    if (!text) {
        return [text];
    }

    const parts = text.split(URL_PATTERN);

    return parts.map((part, index) => {
        // split() with a capturing group alternates plain-text/matched
        // segments; odd indices are always the URL matches.
        if (index % 2 === 0 || !part) {
            return part;
        }

        const { url, trailing } = trimTrailingPunctuation(part);
        const href = url.startsWith('www.') ? `https://${url}` : url;

        // Same-origin links (someone pasting a Mad Fan URL into a post/message)
        // navigate in this tab like any other in-app link; only a genuinely
        // external link opens a new one, since leaving via a background tab
        // makes more sense than losing your place for a site you don't control.
        let isExternal = true;
        try {
            isExternal = new URL(href, window.location.href).origin !== window.location.origin;
        } catch {
            isExternal = true;
        }

        return (
            <span key={`link-${index}`}>
                <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer nofollow ugc' : undefined}
                    onClick={(event) => event.stopPropagation()}
                    className="mf-inline-link"
                >
                    {url}
                </a>
                {trailing}
            </span>
        );
    });
}
