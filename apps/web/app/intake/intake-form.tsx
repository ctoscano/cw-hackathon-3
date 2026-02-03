"use client";

import { useEffect, useRef, useState } from "react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { ChatMessage, formatAnswerForDisplay } from "./chat-message";
import styles from "./intake.module.css";
import { TypingIndicator } from "./typing-indicator";

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
  allQuestions: IntakeQuestion[];
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

// Chat message types for the unified message list
type ChatMessageItem =
  | { id: string; type: "question"; questionNumber: number; question: IntakeQuestion }
  | { id: string; type: "answer"; content: string | string[] }
  | { id: string; type: "reflection"; content: string | null }; // null = loading

// Simple ID generator for messages
let messageIdCounter = 0;
function generateMessageId(): string {
  return `msg-${++messageIdCounter}`;
}

type IntakeState =
  | "loading"
  | "ready"
  | "submitting"
  | "generating_completion"
  | "complete"
  | "error";

export function IntakeForm() {
  const [state, setState] = useState<IntakeState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Intake metadata
  const [intakeType, setIntakeType] = useState<string>("");
  const [intakeName, setIntakeName] = useState<string>("");
  const [intakeDescription, setIntakeDescription] = useState<string>("");
  const [totalSteps, setTotalSteps] = useState<number>(0);

  // All questions (prefetched for immediate display)
  const [allQuestions, setAllQuestions] = useState<IntakeQuestion[]>([]);

  // Current step tracking
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<IntakeQuestion | null>(null);

  // Chat message history - unified view of the conversation
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

  // Completed answers for API calls (includes reflections)
  const [completedAnswers, setCompletedAnswers] = useState<IntakeAnswer[]>([]);

  // Pending reflection that needs to be updated when API returns
  const [pendingReflectionId, setPendingReflectionId] = useState<string | null>(null);

  // Current input state
  const [textInput, setTextInput] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Completion outputs
  const [completionOutputs, setCompletionOutputs] =
    useState<IntakeStepResponse["completionOutputs"]>(null);

  // Ref for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const messagesLength = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally trigger scroll on message count change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesLength]);

  // Load intake on mount
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
        setAllQuestions(data.allQuestions);
        setCurrentQuestion(data.firstQuestion);

        // Add first question to messages
        setMessages([
          {
            id: generateMessageId(),
            type: "question",
            questionNumber: 1,
            question: data.firstQuestion,
          },
        ]);

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

    const answer = getCurrentAnswer();
    const isLastQuestion = currentStep >= totalSteps - 1;
    const nextStepIndex = currentStep + 1;
    const submittingStepIndex = currentStep; // Store the step we're submitting

    setState("submitting");
    setError(null);

    // OPTIMISTIC UI: Immediately show the user's answer and a loading reflection
    const answerId = generateMessageId();
    const reflectionId = generateMessageId();

    // Build new messages optimistically
    const newMessages: ChatMessageItem[] = [
      { id: answerId, type: "answer", content: answer },
      { id: reflectionId, type: "reflection", content: null }, // Loading state
    ];

    // If not the last question, immediately show the next question
    // This is the key to perceived performance - user can start reading/answering
    if (!isLastQuestion && allQuestions[nextStepIndex]) {
      const nextQuestion = allQuestions[nextStepIndex];
      newMessages.push({
        id: generateMessageId(),
        type: "question",
        questionNumber: nextStepIndex + 1,
        question: nextQuestion,
      });
      // Update current question immediately so user can start answering
      setCurrentQuestion(nextQuestion);
      setCurrentStep(nextStepIndex);
    }

    setMessages((prev) => [...prev, ...newMessages]);
    setPendingReflectionId(reflectionId);

    // If last question, show the completion waiting state
    if (isLastQuestion) {
      setState("generating_completion");
    } else {
      // Not the last question - enable the next question immediately
      setState("ready");
    }

    try {
      const response = await fetch("/api/intake/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeType,
          stepIndex: submittingStepIndex, // Use the stored step index (always >= 0)
          priorAnswers: completedAnswers,
          currentAnswer: answer,
        }),
      });

      const data: IntakeStepResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to submit answer");
      }

      // Update the loading reflection with actual content
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          const msg = updated[i];
          if (msg.type === "reflection" && msg.id === reflectionId) {
            updated[i] = { id: msg.id, type: "reflection", content: data.reflection };
            break;
          }
        }
        return updated;
      });
      setPendingReflectionId(null);

      // Add completed answer to history for future API calls
      const newAnswer: IntakeAnswer = {
        questionId: currentQuestion.id,
        questionPrompt: currentQuestion.prompt,
        answer: answer,
        reflection: data.reflection,
      };
      setCompletedAnswers((prev) => [...prev, newAnswer]);

      if (data.isComplete) {
        setCompletionOutputs(data.completionOutputs);
        setCurrentQuestion(null);
        setState("complete");
      } else {
        // Already showed next question optimistically, just update state
        setState("ready");
      }
    } catch (err) {
      // Remove the optimistic messages on error
      const messagesToRemove = isLastQuestion ? 2 : 3;
      setMessages((prev) => prev.slice(0, -messagesToRemove));
      setPendingReflectionId(null);

      // Restore previous question state if we optimistically moved forward
      if (!isLastQuestion && allQuestions[currentStep - 1]) {
        setCurrentQuestion(allQuestions[currentStep - 1]);
        setCurrentStep(currentStep - 1);
      }

      setError(err instanceof Error ? err.message : "Failed to submit answer");
      setState("ready");
    }
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

  const isGeneratingCompletion = state === "generating_completion";
  const showQuestionForm = currentQuestion && !isGeneratingCompletion && state !== "complete";

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{intakeName}</h1>
        <p className={styles.description}>{intakeDescription}</p>
        {state !== "complete" && !isGeneratingCompletion && (
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

      {/* Chat Messages */}
      <div className={styles.chatContainer}>
        {messages.map((msg) => {
          if (msg.type === "question") {
            // Only show as chat bubble if it's a past question (not the current active one)
            const isCurrentQuestion =
              currentQuestion &&
              msg.question.id === currentQuestion.id &&
              state !== "complete" &&
              !isGeneratingCompletion;
            if (isCurrentQuestion) return null;

            return (
              <ChatMessage key={msg.id} type="question" questionNumber={msg.questionNumber}>
                {msg.question.prompt}
              </ChatMessage>
            );
          }

          if (msg.type === "answer") {
            return (
              <ChatMessage key={msg.id} type="answer" animate>
                {formatAnswerForDisplay(msg.content)}
              </ChatMessage>
            );
          }

          if (msg.type === "reflection") {
            return (
              <ChatMessage
                key={msg.id}
                type="reflection"
                isLoading={msg.content === null}
                typeAnimation={msg.content !== null}
              >
                {msg.content}
              </ChatMessage>
            );
          }

          return null;
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Completion Waiting State */}
      {isGeneratingCompletion && (
        <div className={styles.completionWaiting}>
          <div className={styles.completionWaitingIcon}>
            <svg viewBox="0 0 100 100" className={styles.completionWaitingSvg} aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e8f4fd" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#4a90d9"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset="125.6"
                className={styles.completionWaitingCircle}
              />
            </svg>
          </div>
          <TypingAnimation
            words={["Gathering insights ✨", "Personalizing results 🎯", "Almost ready 🚀"]}
            loop
            className={styles.completionWaitingText}
            duration={80}
            showCursor={false}
          />
        </div>
      )}

      {/* Current Question Form */}
      {showQuestionForm && (
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
                  <p key={paragraph.slice(0, 50)} className={styles.completionParagraph}>
                    {paragraph}
                  </p>
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
                  <p key={paragraph.slice(0, 50)} className={styles.completionParagraph}>
                    {paragraph}
                  </p>
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
