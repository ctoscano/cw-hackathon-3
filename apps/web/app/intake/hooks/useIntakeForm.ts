/**
 * Main hook for managing intake form state and API interactions
 * Consolidates metadata, flow state, answers, and derives messages
 */

import { saveIntakeCompletion, saveIntakeProgress } from "@/actions/intake";
import { triggerConfetti } from "@/lib/confetti";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessageItem } from "../intake-utils";
import {
  buildAnswerPayload,
  createAnswerMessage,
  createQuestionMessage,
  createReflectionMessage,
  generateMessageId,
} from "../intake-utils";
import type {
  IntakeAnswer,
  IntakeQuestion,
  IntakeStartResponse,
  IntakeState,
  IntakeStepResponse,
} from "../types";

interface IntakeMetadata {
  intakeType: string;
  name: string;
  description: string;
  totalSteps: number;
  allQuestions: IntakeQuestion[];
}

interface FlowState {
  status: IntakeState;
  currentStep: number;
  error: string | null;
}

interface CompletionState {
  outputs: IntakeStepResponse["completionOutputs"];
}

interface UseIntakeFormReturn {
  metadata: IntakeMetadata | null;
  flow: FlowState;
  answers: IntakeAnswer[];
  messages: ChatMessageItem[];
  currentQuestion: IntakeQuestion | null;
  isLastQuestion: boolean;
  completion: CompletionState | null;
  sessionId: string | null;
  submitAnswer: (questionId: string, answer: string | string[]) => Promise<void>;
}

/**
 * Main hook for intake form state management
 */
export function useIntakeForm(intakeType = "therapy_readiness"): UseIntakeFormReturn {
  // Consolidated state
  const [metadata, setMetadata] = useState<IntakeMetadata | null>(null);
  const [flow, setFlow] = useState<FlowState>({
    status: "loading",
    currentStep: 0,
    error: null,
  });
  const [answers, setAnswers] = useState<IntakeAnswer[]>([]);
  const [completion, setCompletion] = useState<CompletionState | null>(null);

  // Session ID for Redis persistence (generated once on mount)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // State for tracking early completion generation
  const [earlyCompletionPromise, setEarlyCompletionPromise] = useState<Promise<
    IntakeStepResponse["completionOutputs"]
  > | null>(null);

  // Derived state - no separate useState!
  const currentQuestion = metadata?.allQuestions[flow.currentStep] || null;
  const isLastQuestion = metadata ? flow.currentStep >= metadata.totalSteps - 1 : false;

  // Derive messages from answers and current state (SINGLE SOURCE OF TRUTH!)
  const messages = useMemo(() => {
    const msgs: ChatMessageItem[] = [];

    // Add all completed Q&A pairs with reflections
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = metadata?.allQuestions.find((q) => q.id === answer.questionId);

      if (question) {
        msgs.push(createQuestionMessage(question, i + 1));
        msgs.push(createAnswerMessage(answer.answer));

        // Don't show reflection for the last question (too much on the page)
        const isLastQuestion = metadata ? i === metadata.totalSteps - 1 : false;
        if (!isLastQuestion) {
          // Always show reflection (even if empty/loading) for non-last questions
          msgs.push(createReflectionMessage(answer.reflection || null, answer.questionId));
        }
      }
    }

    // Add current question if not complete
    if (currentQuestion && flow.status !== "complete" && flow.status !== "generating_completion") {
      msgs.push(createQuestionMessage(currentQuestion, flow.currentStep + 1));
    }

    return msgs;
  }, [answers, currentQuestion, flow.currentStep, flow.status, metadata]);

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Load intake on mount
  useEffect(() => {
    async function loadIntake() {
      try {
        const response = await fetch(`/api/intake/start?type=${intakeType}`);
        const data: IntakeStartResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as unknown as { error: string }).error || "Failed to load intake");
        }

        setMetadata({
          intakeType: data.intakeType,
          name: data.name,
          description: data.description,
          totalSteps: data.totalSteps,
          allQuestions: data.allQuestions,
        });

        setFlow({
          status: "ready",
          currentStep: 0,
          error: null,
        });
      } catch (err) {
        setFlow({
          status: "error",
          currentStep: 0,
          error: err instanceof Error ? err.message : "Failed to load intake",
        });
      }
    }

    loadIntake();
  }, [intakeType]);

  // Submit answer handler
  const submitAnswer = useCallback(
    async (questionId: string, answer: string | string[]) => {
      if (!metadata || !currentQuestion) return;

      const submittingStepIndex = flow.currentStep;
      const isLast = isLastQuestion;

      // OPTIMISTIC UI: Add answer immediately with loading reflection
      const optimisticAnswer: IntakeAnswer = {
        questionId,
        questionPrompt: currentQuestion.prompt,
        answer,
        reflection: "", // Empty initially, will be updated
      };

      const updatedAnswers = [...answers, optimisticAnswer];
      setAnswers(updatedAnswers);

      // OPTIMISTIC UI: Move to next question immediately (if not last)
      if (!isLast) {
        setFlow({
          status: "ready",
          currentStep: submittingStepIndex + 1,
          error: null,
        });
      } else {
        setFlow({
          status: "generating_completion",
          currentStep: submittingStepIndex,
          error: null,
        });
      }

      try {
        // Call API in background
        const response = await fetch("/api/intake/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakeType: metadata.intakeType,
            stepIndex: submittingStepIndex,
            priorAnswers: answers,
            currentAnswer: answer,
          }),
        });

        const data: IntakeStepResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            (data as unknown as { error: string }).error || "Failed to submit answer",
          );
        }

        // GUARD: Update reflection only if answer still exists (not a stale response)
        // Example: Q1's response arrives after Q2 was already submitted
        let wasStale = false;
        setAnswers((prev) => {
          const answerIndex = prev.findIndex((a) => a.questionId === questionId);

          // If answer doesn't exist, it's stale
          if (answerIndex === -1) {
            wasStale = true;
            return prev;
          }

          // If this is NOT the most recent answer, it's stale (user has moved forward)
          if (answerIndex !== prev.length - 1) {
            console.log(
              `Stale response for step ${submittingStepIndex} (answer ${answerIndex + 1} of ${prev.length})`,
            );
            wasStale = true;
          }

          // Still update the reflection even if stale (for historical accuracy)
          const updated = [...prev];
          updated[answerIndex] = {
            ...updated[answerIndex],
            reflection: data.reflection,
          };
          return updated;
        });

        // Save progress to Redis (graceful - don't block UX on failure)
        if (sessionId && !wasStale) {
          saveIntakeProgress(
            sessionId,
            questionId,
            currentQuestion.prompt,
            answer,
            data.reflection,
          ).catch((err) => {
            console.error("Failed to save intake progress to Redis:", err);
            // Continue - persistence failure shouldn't block user
          });
        }

        // If this was a stale response, don't process completion logic
        if (wasStale) {
          return;
        }

        // OPTIMIZATION: Start early completion generation after Q8
        if (submittingStepIndex === 7 && metadata.totalSteps === 9 && !isLast) {
          const completionPromise = fetch("/api/intake/completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intakeType: metadata.intakeType,
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

        // Handle completion
        if (data.isComplete) {
          setFlow({
            status: "generating_completion",
            currentStep: submittingStepIndex,
            error: null,
          });

          // Check if we have early completion ready
          let finalOutputs: {
            personalizedBrief: string;
            firstSessionGuide: string;
            experiments: string[];
          } | null;
          if (earlyCompletionPromise) {
            const outputs = await earlyCompletionPromise;
            finalOutputs = outputs || data.completionOutputs;
            setCompletion({ outputs: finalOutputs });
          } else {
            finalOutputs = data.completionOutputs;
            setCompletion({ outputs: finalOutputs });
          }

          // Save completion to Redis (graceful - don't block UX on failure)
          if (sessionId && finalOutputs) {
            saveIntakeCompletion(sessionId, finalOutputs).catch((err) => {
              console.error("Failed to save intake completion to Redis:", err);
              // Continue - persistence failure shouldn't block user
            });
          }

          setFlow({ status: "complete", currentStep: submittingStepIndex, error: null });
          setTimeout(() => triggerConfetti(), 300);
        } else {
          // Move to next question
          setFlow({
            status: "ready",
            currentStep: submittingStepIndex + 1,
            error: null,
          });
        }
      } catch (err) {
        setFlow({
          status: "ready",
          currentStep: submittingStepIndex,
          error: err instanceof Error ? err.message : "Failed to submit answer",
        });
      }
    },
    [
      metadata,
      currentQuestion,
      flow.currentStep,
      isLastQuestion,
      answers,
      earlyCompletionPromise,
      sessionId,
    ],
  );

  return {
    metadata,
    flow,
    answers,
    messages,
    currentQuestion,
    isLastQuestion,
    completion,
    sessionId,
    submitAnswer,
  };
}
