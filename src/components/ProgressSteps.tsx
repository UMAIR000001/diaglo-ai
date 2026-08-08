interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressSteps({ currentStep, totalSteps }: ProgressStepsProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xs mx-auto" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label="Onboarding progress">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2 flex-1">
          <div
            className={`
              h-2 rounded-full flex-1 transition-all duration-300 ease-out
              ${step <= currentStep
                ? "bg-primary"
                : "bg-border"
              }
            `}
          />
          {step < totalSteps && (
            <div className="w-0.5 h-0.5 rounded-full bg-border/50" />
          )}
        </div>
      ))}
    </div>
  );
}