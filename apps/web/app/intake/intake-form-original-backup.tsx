"use client";

import { createExperimentPrompt, generateChatGPTUrl } from "@/lib/chatgpt";
import { triggerConfetti } from "@/lib/confetti";
import { BorderBeam, Markdown, TypingAnimation } from "@cw-hackathon/ui";
import { useEffect, useRef, useState } from "react";
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
  const [otherText, setOtherText] = useState<string>(""); // For "Other" option custom text

  // Completion outputs
  const [completionOutputs, setCompletionOutputs] =
    useState<IntakeStepResponse["completionOutputs"]>(null);

  // Early completion generation (started after Q8, ready for Q9)
  const [earlyCompletionPromise, setEarlyCompletionPromise] = useState<Promise<
    IntakeStepResponse["completionOutputs"]
  > | null>(null);

  // Contact info collection (optional, during completion wait)
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  // Ref for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or reflection content loads
  const messagesLength = messages.length;
  const lastReflectionContent = messages
    .filter((m) => m.type === "reflection")
    .map((m) => m.content)
    .join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally trigger scroll on message count or reflection content change
  useEffect(() => {
    // Small delay to let DOM update with new content height
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messagesLength, lastReflectionContent]);

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
    setOtherText("");
  }, [questionId]);

  function getCurrentAnswer(): string | string[] {
    if (!currentQuestion) return "";

    if (currentQuestion.type === "text") {
      return textInput;
    }

    // For multiselect/singleselect with "Other" option
    // Check for any option that indicates "other" (case insensitive)
    const otherOption = selectedOptions.find(
      (opt) => opt.toLowerCase().includes("other") || opt.toLowerCase().includes("something else"),
    );

    if (otherOption && otherText.trim()) {
      // Replace the "Other"/"Something else" option with the custom text
      return selectedOptions.map((opt) =>
        opt === otherOption ? `${otherOption}: ${otherText.trim()}` : opt,
      );
    }

    return selectedOptions;
  }

  function isAnswerValid(): boolean {
    if (!currentQuestion) return false;

    if (currentQuestion.type === "text") {
      return textInput.trim().length > 0;
    }

    // For multiselect/singleselect
    if (selectedOptions.length === 0) return false;

    // If any "Other" variant is selected, require the otherText field to be filled
    const hasOtherOption = selectedOptions.some(
      (opt) => opt.toLowerCase().includes("other") || opt.toLowerCase().includes("something else"),
    );
    if (hasOtherOption && !otherText.trim()) {
      return false;
    }

    return true;
  }

  function handleOptionToggle(option: string) {
    const isOtherVariant = (opt: string) =>
      opt.toLowerCase().includes("other") || opt.toLowerCase().includes("something else");

    if (currentQuestion?.type === "singleselect") {
      setSelectedOptions([option]);
      // Clear otherText if switching away from any "Other" variant
      if (!isOtherVariant(option)) {
        setOtherText("");
      }
    } else {
      setSelectedOptions((prev) => {
        const newSelection = prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option];

        // Clear otherText if an "Other" variant is deselected
        if (isOtherVariant(option) && !newSelection.includes(option)) {
          setOtherText("");
        }

        return newSelection;
      });
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

    // OPTIMISTIC UI: Immediately show the user's answer
    const answerId = generateMessageId();
    const reflectionId = isLastQuestion ? "" : generateMessageId();

    // Build new messages optimistically
    const newMessages: ChatMessageItem[] = [{ id: answerId, type: "answer", content: answer }];

    // For non-last questions, show loading reflection
    if (!isLastQuestion && reflectionId) {
      newMessages.push({ id: reflectionId, type: "reflection", content: null }); // Loading state
    }

    // Store next question info for deduplication check
    let nextQuestionToAdd: ChatMessageItem | null = null;
    if (!isLastQuestion && allQuestions[nextStepIndex]) {
      const nextQuestion = allQuestions[nextStepIndex];
      nextQuestionToAdd = {
        id: generateMessageId(),
        type: "question",
        questionNumber: nextStepIndex + 1,
        question: nextQuestion,
      };
      // Update current question immediately so user can start answering
      setCurrentQuestion(nextQuestion);
      setCurrentStep(nextStepIndex);
    }

    // Add messages with deduplication check using current state
    setMessages((prev) => {
      const messagesToAdd = [...newMessages];

      // Only add next question if it doesn't already exist (prevents race condition)
      if (nextQuestionToAdd) {
        const questionExists = prev.some(
          (msg) => msg.type === "question" && msg.question.id === nextQuestionToAdd.question.id,
        );
        if (!questionExists) {
          messagesToAdd.push(nextQuestionToAdd);
        }
      }

      return [...prev, ...messagesToAdd];
    });
    if (reflectionId) {
      setPendingReflectionId(reflectionId);
    }

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

      // Guard: Ignore stale responses if user has already moved forward
      // Example: Q8's response arrives after Q9 was already submitted
      if (submittingStepIndex < currentStep) {
        console.log(
          `Ignoring stale response for step ${submittingStepIndex}, already at step ${currentStep}`,
        );
        return;
      }

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
      const updatedAnswers = [...completedAnswers, newAnswer];
      setCompletedAnswers(updatedAnswers);

      // OPTIMIZATION: If we just submitted Q8 (step 7), start generating completion in background
      // This makes Q9 feel snappier since completion is already generating
      if (submittingStepIndex === 7 && totalSteps === 9 && !isLastQuestion) {
        // Trigger completion generation based on Q1-Q8 answers
        const completionPromise = fetch("/api/intake/completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakeType,
            answers: updatedAnswers,
          }),
        })
          .then((res) => res.json())
          .then((data) => data.completionOutputs)
          .catch((err) => {
            console.error("Early completion generation failed:", err);
            return null;
          });

        setEarlyCompletionPromise(completionPromise);
      }

      if (data.isComplete) {
        setCurrentQuestion(null);
        setState("complete");

        // Check if we have early completion ready
        if (earlyCompletionPromise) {
          // Use the early-generated completion
          earlyCompletionPromise.then((outputs) => {
            if (outputs) {
              setCompletionOutputs(outputs);
              // Trigger confetti only after early completion loads
              setTimeout(() => triggerConfetti(), 300);
            } else {
              // Fallback to regular completion
              setCompletionOutputs(data.completionOutputs);
              setTimeout(() => triggerConfetti(), 300);
            }
          });
        } else {
          setCompletionOutputs(data.completionOutputs);
          // Trigger celebratory confetti animation
          setTimeout(() => triggerConfetti(), 300);
        }
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

      {/* Value Proposition */}
      {state !== "complete" && !isGeneratingCompletion && messages.length === 1 && (
        <div className={styles.valueProposition}>
          <p className={styles.valuePropositionText}>
            These questions help you explore whether therapy might be worth trying right now.
          </p>
          <ul className={styles.valuePropositionList}>
            <li>Get clearer on what's happening and why it matters</li>
            <li>Understand how therapy might help your specific situation</li>
            <li>Learn what to talk about and look for in a first session</li>
            <li>Try a few optional practices you can bring to therapy</li>
          </ul>
        </div>
      )}

      {/* Chat Messages */}
      <div className={styles.chatContainer}>
        {messages.map((msg) => {
          if (msg.type === "question") {
            // Only show as chat bubble if it's a past question (not the current active one)
            // Special case: When generating completion or complete, the last question should not be shown
            const isCurrentQuestion =
              currentQuestion &&
              msg.question.id === currentQuestion.id &&
              state !== "complete" &&
              !isGeneratingCompletion;

            const isLastQuestionDuringCompletion =
              (isGeneratingCompletion || state === "complete") && msg.questionNumber === totalSteps;

            if (isCurrentQuestion || isLastQuestionDuringCompletion) return null;

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
              <ChatMessage key={msg.id} type="reflection" isLoading={msg.content === null}>
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
          <div className={styles.completionWaitingCard}>
            <BorderBeam size={250} duration={12} delay={0} />
            <TypingAnimation
              words={["Gathering insights ✨", "Personalizing results 🎯", "Almost ready 🚀"]}
              loop
              className={styles.completionWaitingText}
              duration={80}
              showCursor={false}
            />

            {/* Optional Contact Info Collection */}
            {!showContactForm ? (
              <div className={styles.contactPrompt}>
                <p className={styles.contactPromptText}>
                  While you wait, would you like us to help connect you with a therapist?
                </p>
                <div className={styles.contactPromptButtons}>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(true)}
                    className={styles.contactYesButton}
                  >
                    Yes, I&apos;d like that
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className={styles.contactNoButton}
                  >
                    No thanks
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.contactForm}>
                <p className={styles.contactFormText}>
                  Great! Share your email or phone number and we&apos;ll reach out to help you get
                  started.
                </p>
                <div className={styles.contactInputs}>
                  <input
                    type="email"
                    placeholder="Email address (optional)"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={styles.contactInput}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={styles.contactInput}
                  />
                </div>
                <p className={styles.contactFormNote}>
                  You can skip this - your results will show below either way.
                </p>
              </div>
            )}
          </div>
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
                {selectedOptions.some(
                  (opt) =>
                    opt.toLowerCase().includes("other") ||
                    opt.toLowerCase().includes("something else"),
                ) && (
                  <div className={styles.otherInputWrapper}>
                    <input
                      type="text"
                      className={styles.otherInput}
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Please specify..."
                      disabled={state === "submitting"}
                    />
                  </div>
                )}
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
                {selectedOptions.some(
                  (opt) =>
                    opt.toLowerCase().includes("other") ||
                    opt.toLowerCase().includes("something else"),
                ) && (
                  <div className={styles.otherInputWrapper}>
                    <input
                      type="text"
                      className={styles.otherInput}
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Please specify..."
                      disabled={state === "submitting"}
                    />
                  </div>
                )}
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
              <Markdown>{completionOutputs.personalizedBrief}</Markdown>
            </div>
          </section>

          <section className={styles.completionSection}>
            <h3>Making the Most of Your First Session</h3>
            <div className={styles.completionContent}>
              <Markdown>{completionOutputs.firstSessionGuide}</Markdown>
            </div>
          </section>

          <section className={styles.completionSection}>
            <h3>Optional Pre-Therapy Experiments</h3>
            <p className={styles.experimentsIntro}>
              These are optional activities you might try before or between your first sessions.
              They&apos;re designed to give you useful insights, not assignments to complete.
            </p>
            <div className={styles.experiments}>
              {completionOutputs.experiments.map((experiment, i) => {
                const isFirst = i === 0;
                const chatGptPrompt = isFirst ? createExperimentPrompt(experiment) : null;
                const chatGptUrl = chatGptPrompt ? generateChatGPTUrl(chatGptPrompt) : null;

                return (
                  <div key={experiment.slice(0, 50)} className={styles.experiment}>
                    <span className={styles.experimentNumber}>{i + 1}</span>
                    <div className={styles.experimentContent}>
                      <Markdown>{experiment}</Markdown>
                      {chatGptUrl && (
                        <a
                          href={chatGptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.chatGptButton}
                        >
                          Explore this with ChatGPT →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
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
