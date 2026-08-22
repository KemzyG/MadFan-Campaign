const REGISTRATION_STEPS = [
    { id: 1, label: 'Pick Your Club' },
    { id: 2, label: 'Your Passport' },
];

export { REGISTRATION_STEPS };

export default function RegistrationStepper({ currentStep = 1 }) {
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
