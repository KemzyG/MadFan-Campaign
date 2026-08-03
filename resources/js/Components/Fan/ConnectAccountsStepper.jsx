const CONNECT_STEPS = [
    { id: 1, platform: 'x', label: 'Connect X' },
    { id: 2, platform: 'discord', label: 'Connect Discord' },
    { id: 3, platform: 'telegram', label: 'Connect Telegram' },
];

export { CONNECT_STEPS };

const PLATFORM_BY_STEP = Object.fromEntries(CONNECT_STEPS.map((step) => [step.id, step.platform]));

export { PLATFORM_BY_STEP };

export function activeConnectStep(accounts = []) {
    const connected = Object.fromEntries(accounts.map((account) => [account.platform, account.connected]));

    if (!connected.x) {
        return 1;
    }

    if (!connected.discord) {
        return 2;
    }

    return 3;
}

export default function ConnectAccountsStepper({ accounts = [], currentStep }) {
    const step = currentStep ?? activeConnectStep(accounts);

    return (
        <div className="reg-stepper-track connect-stepper-track" aria-label="Connect accounts progress">
            {CONNECT_STEPS.map((item, index) => {
                const account = accounts.find((entry) => entry.platform === item.platform);
                const done = account?.connected ?? step > item.id;
                const active = step === item.id;

                return (
                    <div key={item.id} className="reg-stepper-item-wrap">
                        <div className={`reg-stepper-item${active ? ' active' : ''}${done ? ' done' : ''}`}>
                            <span className="reg-stepper-num">{done ? '✓' : item.id}</span>
                            <span className="reg-stepper-label">{item.label}</span>
                        </div>
                        {index < CONNECT_STEPS.length - 1 && (
                            <div className={`reg-stepper-line${done ? ' done' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
