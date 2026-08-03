import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);
    const message = flash?.success ?? flash?.error;
    const isError = Boolean(flash?.error);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
        setVisible(false);
    }, [message]);

    if (!visible || !message) return null;

    return (
        <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                isError
                    ? 'border-red-500/30 bg-red-500/10 text-red-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
        >
            {message}
        </div>
    );
}
