/**
 * Header component for the intake form
 * Displays title, description, and progress indicator
 */

interface IntakeHeaderProps {
  name: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  showProgress?: boolean;
}

export function IntakeHeader({
  name,
  description,
  currentStep,
  totalSteps,
  showProgress = true,
}: IntakeHeaderProps) {
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <header className="text-center mb-4">
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">{name}</h2>
      <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-lg mx-auto">
        {description}
      </p>
      {showProgress && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            Question {currentStep + 1} of {totalSteps}
          </span>
        </div>
      )}
    </header>
  );
}
