const STEPS = [
    { id: 1, label: 'Your Fandom' },
    { id: 2, label: 'Your Club' },
];

/**
 * Two-step progress indicator for the post-login onboarding fallback (Fandom
 * then Club) — the same `.mf-auth-stepper` styling Register.jsx's four-step
 * wizard uses, so the two flows read as one system.
 */
export default function OnboardStepper({ currentStep }) {
    return (
        <div className="mf-auth-stepper" aria-label="Onboarding progress">
            {STEPS.map((item, index) => {
                const done = currentStep > item.id;
                const active = currentStep === item.id;

                return (
                    <div key={item.id} className="mf-auth-stepper-item-wrap">
                        <div className={`mf-auth-stepper-item${active ? ' active' : ''}${done ? ' done' : ''}`}>
                            <span className="mf-auth-stepper-num">{done ? '✓' : item.id}</span>
                            <span className="mf-auth-stepper-label">{item.label}</span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className={`mf-auth-stepper-line${done ? ' done' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
