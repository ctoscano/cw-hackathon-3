"use client";

import { useEffect, useState } from "react";
import styles from "./intake.module.css";

interface IntakeQuestion {
  id: string;
  prompt: string;
  type: "text" | "multiselect" | "singleselect";
  options?: string[];
  examples?: string[];
}

interface IntakeAnswer {
  questionId: string;
  questionPrompt: string;
  answer: string | string[];
  reflection: string;
}

interface IntakeStartResponse {
  intakeType: string;
  name: string;
  description: string;
  totalSteps: number;
  firstQuestion: IntakeQuestion;
}

interface IntakeStepResponse {
  reflection: string;
  nextQuestion: IntakeQuestion | null;
  isComplete: boolean;
  completionOutputs: {
    personalizedBrief: string;
    firstSessionGuide: string;
    experiments: string[];
  } | null;
  metadata: {
    currentStep: number;
    totalSteps: number;
    intakeType: string;
  };
}

type IntakeState = "loading" | "ready" | "submitting" | "complete" | "error";

export function IntakeForm() {
  const [state, setState] = useState<IntakeState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Intake metadata
  const [intakeType, setIntakeType] = useState<string>("");
  const [intakeName, setIntakeName] = useState<string>("");
  const [intakeDescription, setIntakeDescription] = useState<string>("");
  const [totalSteps, setTotalSteps] = useState<number>(0);

  // Current step tracking
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<IntakeQuestion | null>(null);

  // Answer history
  const [completedAnswers, setCompletedAnswers] = useState<IntakeAnswer[]>([]);

  // Current input state
  const [textInput, setTextInput] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Completion outputs
  const [completionOutputs, setCompletionOutputs] =
    useState<IntakeStepResponse["completionOutputs"]>(null);

  // Load first question on mount
  useEffect(() => {
    async function loadIntake() {
      try {
        const response = await fetch("/api/intake/start?type=therapy_readiness");
        const data: IntakeStartResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as unknown as { error: string }).error || "Failed to load intake");
        }

        setIntakeType(data.intakeType);
        setIntakeName(data.name);
        setIntakeDescription(data.description);
        setTotalSteps(data.totalSteps);
        setCurrentQuestion(data.firstQuestion);
        setState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load intake");
        setState("error");
      }
    }

    loadIntake();
  }, []);

  // Reset input when question changes
  const questionId = currentQuestion?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally reset on question change
  useEffect(() => {
    setTextInput("");
    setSelectedOptions([]);
  }, [questionId]);

  function getCurrentAnswer(): string | string[] {
    if (!currentQuestion) return "";

    if (currentQuestion.type === "text") {
      return textInput;
    }
    return selectedOptions;
  }

  function isAnswerValid(): boolean {
    if (!currentQuestion) return false;

    if (currentQuestion.type === "text") {
      return textInput.trim().length > 0;
    }
    return selectedOptions.length > 0;
  }

  function handleOptionToggle(option: string) {
    if (currentQuestion?.type === "singleselect") {
      setSelectedOptions([option]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentQuestion || !isAnswerValid()) return;

    setState("submitting");
    setError(null);

    try {
      const response = await fetch("/api/intake/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeType,
          stepIndex: currentStep,
          priorAnswers: completedAnswers,
          currentAnswer: getCurrentAnswer(),
        }),
      });

      const data: IntakeStepResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to submit answer");
      }

      // Add completed answer to history
      const newAnswer: IntakeAnswer = {
        questionId: currentQuestion.id,
        questionPrompt: currentQuestion.prompt,
        answer: getCurrentAnswer(),
        reflection: data.reflection,
      };
      setCompletedAnswers((prev) => [...prev, newAnswer]);

      if (data.isComplete) {
        setCompletionOutputs(data.completionOutputs);
        setCurrentQuestion(null);
        setState("complete");
      } else {
        setCurrentQuestion(data.nextQuestion);
        setCurrentStep(data.metadata.currentStep + 1);
        setState("ready");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
      setState("ready");
    }
  }

  function formatAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    return answer;
  }

  // Loading state
  if (state === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{intakeName}</h1>
        <p className={styles.description}>{intakeDescription}</p>
        {state !== "complete" && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              Question {currentStep + 1} of {totalSteps}
            </span>
          </div>
        )}
      </header>

      {/* Completed Q&A History */}
      {completedAnswers.length > 0 && (
        <div className={styles.history}>
          {completedAnswers.map((answer, index) => (
            <div key={answer.questionId} className={styles.historyItem}>
              <div className={styles.historyQuestion}>
                <span className={styles.questionNumber}>{index + 1}.</span>
                {answer.questionPrompt}
              </div>
              <div className={styles.historyAnswer}>{formatAnswer(answer.answer)}</div>
              <div className={styles.reflection}>{answer.reflection}</div>
            </div>
          ))}
        </div>
      )}

      {/* Current Question */}
      {currentQuestion && state !== "complete" && (
        <form onSubmit={handleSubmit} className={styles.questionForm}>
          <div className={styles.currentQuestion}>
            <div className={styles.questionLabel}>
              <span className={styles.questionNumber}>{currentStep + 1}.</span>
              {currentQuestion.prompt}
            </div>

            {currentQuestion.type === "text" && (
              <div className={styles.textInputWrapper}>
                <textarea
                  className={styles.textarea}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    currentQuestion.examples
                      ? `e.g., "${currentQuestion.examples[0]}"`
                      : "Share your thoughts..."
                  }
                  rows={4}
                  disabled={state === "submitting"}
                />
                {currentQuestion.examples && currentQuestion.examples.length > 1 && (
                  <p className={styles.examples}>
                    Examples:{" "}
                    {currentQuestion.examples.slice(1).map((ex, i) => (
                      <span key={ex}>
                        {i > 0 && " • "}
                        &ldquo;{ex}&rdquo;
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}

            {currentQuestion.type === "multiselect" && currentQuestion.options && (
              <div className={styles.optionsWrapper}>
                <p className={styles.optionsHint}>Select all that apply</p>
                <div className={styles.options}>
                  {currentQuestion.options.map((option) => (
                    <label key={option} className={styles.optionLabel}>
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option)}
                        onChange={() => handleOptionToggle(option)}
                        disabled={state === "submitting"}
                        className={styles.checkbox}
                      />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion.type === "singleselect" && currentQuestion.options && (
              <div className={styles.optionsWrapper}>
                <div className={styles.options}>
                  {currentQuestion.options.map((option) => (
                    <label key={option} className={styles.optionLabel}>
                      <input
                        type="radio"
                        name="singleselect"
                        checked={selectedOptions.includes(option)}
                        onChange={() => handleOptionToggle(option)}
                        disabled={state === "submitting"}
                        className={styles.radio}
                      />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!isAnswerValid() || state === "submitting"}
          >
            {state === "submitting" ? "Processing..." : "Continue"}
          </button>

          {error && <div className={styles.inlineError}>{error}</div>}
        </form>
      )}

      {/* Completion Outputs */}
      {state === "complete" && completionOutputs && (
        <div className={styles.completion}>
          <h2 className={styles.completionTitle}>Your Personalized Results</h2>

          <section className={styles.completionSection}>
            <h3>How Therapy Might Help</h3>
            <div className={styles.completionContent}>
              {completionOutputs.personalizedBrief
                .split("\n")
                .filter((p) => p.trim())
                .map((paragraph) => (
                  <p key={paragraph.slice(0, 50)}>{paragraph}</p>
                ))}
            </div>
          </section>

          <section className={styles.completionSection}>
            <h3>Making the Most of Your First Session</h3>
            <div className={styles.completionContent}>
              {completionOutputs.firstSessionGuide
                .split("\n")
                .filter((p) => p.trim())
                .map((paragraph) => (
                  <p key={paragraph.slice(0, 50)}>{paragraph}</p>
                ))}
            </div>
          </section>

          <section className={styles.completionSection}>
            <h3>Optional Pre-Therapy Experiments</h3>
            <p className={styles.experimentsIntro}>
              These are optional activities you might try before or between your first sessions.
              They&apos;re designed to give you useful insights, not assignments to complete.
            </p>
            <div className={styles.experiments}>
              {completionOutputs.experiments.map((experiment, i) => (
                <div key={experiment.slice(0, 50)} className={styles.experiment}>
                  <span className={styles.experimentNumber}>{i + 1}</span>
                  <p>{experiment}</p>
                </div>
              ))}
            </div>
          </section>

          <div className={styles.completionFooter}>
            <p>
              This exploration is educational and does not replace professional advice. If
              you&apos;re ready to try therapy, we hope these insights help you find a good fit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
