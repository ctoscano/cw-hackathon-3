/**
 * Form section component for displaying and handling question input
 * Renders different input types based on question type
 */

import type { FormInput } from "../intake-utils";
import { isOtherVariant } from "../intake-utils";
import styles from "../intake.module.css";
import type { IntakeQuestion } from "../types";

interface IntakeFormSectionProps {
  question: IntakeQuestion;
  currentStep: number;
  input: FormInput;
  onTextChange: (text: string) => void;
  onOptionToggle: (option: string) => void;
  onOtherTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export function IntakeFormSection({
  question,
  currentStep,
  input,
  onTextChange,
  onOptionToggle,
  onOtherTextChange,
  onSubmit,
  isValid,
  isSubmitting,
  error,
}: IntakeFormSectionProps) {
  const showOtherInput = input.selectedOptions.some(isOtherVariant);

  return (
    <form onSubmit={onSubmit} className={styles.questionForm}>
      <div className={styles.currentQuestion}>
        <div className={styles.questionLabel}>
          <span className={styles.questionNumber}>{currentStep + 1}.</span>
          {question.prompt}
        </div>

        {/* Text Input */}
        {question.type === "text" && (
          <div className={styles.textInputWrapper}>
            <textarea
              className={styles.textarea}
              value={input.textInput}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={
                question.examples ? `e.g., "${question.examples[0]}"` : "Share your thoughts..."
              }
              rows={4}
              disabled={isSubmitting}
            />
            {question.examples && question.examples.length > 1 && (
              <p className={styles.examples}>
                Examples:{" "}
                {question.examples.slice(1).map((ex, i) => (
                  <span key={ex}>
                    {i > 0 && " • "}
                    &ldquo;{ex}&rdquo;
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        {/* Multi Select */}
        {question.type === "multiselect" && question.options && (
          <div className={styles.optionsWrapper}>
            <p className={styles.optionsHint}>Select all that apply</p>
            <div className={styles.options}>
              {question.options.map((option) => (
                <label key={option} className={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={input.selectedOptions.includes(option)}
                    onChange={() => onOptionToggle(option)}
                    disabled={isSubmitting}
                    className={styles.checkbox}
                  />
                  <span className={styles.optionText}>{option}</span>
                </label>
              ))}
            </div>
            {showOtherInput && (
              <div className={styles.otherInputWrapper}>
                <input
                  type="text"
                  className={styles.otherInput}
                  value={input.otherText}
                  onChange={(e) => onOtherTextChange(e.target.value)}
                  placeholder="Please specify..."
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        )}

        {/* Single Select */}
        {question.type === "singleselect" && question.options && (
          <div className={styles.optionsWrapper}>
            <div className={styles.options}>
              {question.options.map((option) => (
                <label key={option} className={styles.optionLabel}>
                  <input
                    type="radio"
                    name="singleselect"
                    checked={input.selectedOptions.includes(option)}
                    onChange={() => onOptionToggle(option)}
                    disabled={isSubmitting}
                    className={styles.radio}
                  />
                  <span className={styles.optionText}>{option}</span>
                </label>
              ))}
            </div>
            {showOtherInput && (
              <div className={styles.otherInputWrapper}>
                <input
                  type="text"
                  className={styles.otherInput}
                  value={input.otherText}
                  onChange={(e) => onOtherTextChange(e.target.value)}
                  placeholder="Please specify..."
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <button type="submit" className={styles.submitButton} disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Processing..." : "Continue"}
      </button>

      {error && <div className={styles.inlineError}>{error}</div>}
    </form>
  );
}
