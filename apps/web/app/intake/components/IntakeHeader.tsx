/**
 * Header component for the intake form
 * Displays title, description, and progress indicator
 */

import styles from "../intake.module.css";

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
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{name}</h1>
      <p className={styles.description}>{description}</p>
      {showProgress && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            Question {currentStep + 1} of {totalSteps}
          </span>
        </div>
      )}
    </header>
  );
}
