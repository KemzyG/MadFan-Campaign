/**
 * Product-type metadata shared across the storefront: display label, the
 * chip class to apply, and the word used for a variant of that type (a
 * "size" for apparel, a "plan" for a subscription, an "edition" for a
 * collectible) — kept in one place so every card/page reads consistently.
 */
export const PRODUCT_TYPES = {
    apparel: { label: 'Apparel', chip: 'mf-shop-type--apparel', optionWord: 'Size' },
    collectible: { label: 'Collectible', chip: 'mf-shop-type--collectible', optionWord: 'Edition' },
    subscription: { label: 'Subscription', chip: 'mf-shop-type--subscription', optionWord: 'Plan' },
};

export function productTypeLabel(type) {
    return PRODUCT_TYPES[type]?.label ?? type;
}

export function productTypeChipClass(type) {
    return PRODUCT_TYPES[type]?.chip ?? '';
}

export function productOptionWord(type) {
    return PRODUCT_TYPES[type]?.optionWord ?? 'Option';
}

export function formatPrice(price, currency = 'GBP') {
    const symbol = { GBP: '£', USD: '$', EUR: '€' }[currency] ?? `${currency} `;

    return `${symbol}${price}`;
}
