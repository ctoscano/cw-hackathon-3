/**
 * Main hook for managing intake form state and API interactions
 * Uses key-based state management for robust handling of out-of-order responses
 *
 * Architecture:
 * - answeredCount: Single immutable progression counter (only increments)
 * - answersByQuestionId: Map of answers keyed by questionId (prevents cross-contamination)
 * - No staleness checks needed - each question's state is isolated by key
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
  resolveAnswerDisplayText,
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

interface CompletionState {
  outputs: IntakeStepResponse["completionOutputs"];
}

interface UseIntakeFormReturn {
  metadata: IntakeMetadata | null;
  status: IntakeState;
  error: string | null;
  answeredCount: number;
  answers: IntakeAnswer[]; // Derived from Map for backward compatibility
  messages: ChatMessageItem[];
  currentQuestion: IntakeQuestion | null;
  isLastQuestion: boolean;
  completion: CompletionState | null;
  sessionId: string | null;
  submitAnswer: (questionId: string, answer: string | string[]) => Promise<void>;
}

/**
 * Main hook for intake form state management
 * Uses key-based architecture for robust async handling
 */
export function useIntakeForm(intakeType = "therapy_readiness"): UseIntakeFormReturn {
  // Metadata from API
  const [metadata, setMetadata] = useState<IntakeMetadata | null>(null);

  // Separate status and error (no longer bundled with currentStep)
  const [status, setStatus] = useState<IntakeState>("loading");
  const [error, setError] = useState<string | null>(null);

  // KEY CHANGE: Single immutable progression counter (ONLY INCREMENTS)
  const [answeredCount, setAnsweredCount] = useState(0);

  // KEY CHANGE: Answers stored by questionId (not array index)
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Map<string, IntakeAnswer>>(
    new Map(),
  );

  const [completion, setCompletion] = useState<CompletionState | null>(null);

  // Session ID for Redis persistence (generated once on mount)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // State for tracking early completion generation
  const [earlyCompletionPromise, setEarlyCompletionPromise] = useState<Promise<
    IntakeStepResponse["completionOutputs"]
  > | null>(null);

  // Derived state from immutable counter (stable - only changes when we explicitly increment)
  const currentQuestion = metadata?.allQuestions[answeredCount] || null;
  const isLastQuestion = metadata ? answeredCount >= metadata.totalSteps - 1 : false;

  // Convert Map to array for backward compatibility and message building
  const answers = useMemo(() => {
    if (!metadata) return [];

    // Build array in question order (not insertion order)
    const result: IntakeAnswer[] = [];
    for (let i = 0; i < answeredCount; i++) {
      const question = metadata.allQuestions[i];
      if (!question) continue;

      const answer = answersByQuestionId.get(question.id);
      if (answer) {
        result.push(answer);
      }
    }
    return result;
  }, [answersByQuestionId, answeredCount, metadata]);

  // Derive messages from answers and current state (SINGLE SOURCE OF TRUTH)
  const messages = useMemo(() => {
    const msgs: ChatMessageItem[] = [];

    // Add all completed Q&A pairs with reflections
    for (let i = 0; i < answeredCount; i++) {
      const question = metadata?.allQuestions[i];
      if (!question) continue;

      const answer = answersByQuestionId.get(question.id);
      if (!answer) continue;

      msgs.push(createQuestionMessage(question, i + 1));
      msgs.push(
        createAnswerMessage(resolveAnswerDisplayText(answer.answer, question), answer.questionId),
      );

      // Don't show reflection for the last question (too much on the page)
      const isLast = metadata ? i === metadata.totalSteps - 1 : false;
      if (!isLast) {
        // Always show reflection (even if empty/loading) for non-last questions
        msgs.push(createReflectionMessage(answer.reflection || null, answer.questionId));
      }
    }

    // Add current question if not complete
    if (currentQuestion && status !== "complete" && status !== "generating_completion") {
      msgs.push(createQuestionMessage(currentQuestion, answeredCount + 1));
    }

    return msgs;
  }, [answersByQuestionId, answeredCount, currentQuestion, status, metadata]);

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

        setStatus("ready");
        setError(null);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load intake");
      }
    }

    loadIntake();
  }, [intakeType]);

  // Submit answer handler - simplified with key-based architecture
  const submitAnswer = useCallback(
    async (questionId: string, answer: string | string[]) => {
      if (!metadata || !currentQuestion) return;

      // Capture current state for this submission (closure captures these values)
      const submittingIndex = answeredCount;
      const submittingQuestion = currentQuestion;
      const isLast = isLastQuestion;

      // OPTIMISTIC UI: Save answer immediately by questionId
      const optimisticAnswer: IntakeAnswer = {
        questionId,
        questionPrompt: submittingQuestion.prompt,
        answer,
        reflection: "", // Empty initially, will be updated when API responds
      };

      setAnswersByQuestionId((prev) => {
        const newMap = new Map(prev);
        newMap.set(questionId, optimisticAnswer);
        return newMap;
      });

      // OPTIMISTIC UI: Move to next question immediately (ONLY INCREMENTS)
      if (!isLast) {
        setAnsweredCount((prev) => prev + 1);
        setStatus("ready");
        setError(null);
      } else {
        setStatus("generating_completion");
      }

      try {
        // Build answers array for API (needs to include current answer)
        const answersForApi = [...answers, optimisticAnswer];

        // Call API in background
        const response = await fetch("/api/intake/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakeType: metadata.intakeType,
            stepIndex: submittingIndex,
            priorAnswers: answers, // Prior answers (not including current)
            currentAnswer: answer,
          }),
        });

        const data: IntakeStepResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            (data as unknown as { error: string }).error || "Failed to submit answer",
          );
        }

        // Update reflection by questionId (NO STALENESS CHECK NEEDED)
        // This safely updates only the answer for this specific question
        setAnswersByQuestionId((prev) => {
          const existingAnswer = prev.get(questionId);

          // If answer doesn't exist, something is wrong - skip update
          if (!existingAnswer) {
            console.warn(`Answer for ${questionId} not found in Map`);
            return prev;
          }

          const newMap = new Map(prev);
          const updatedAnswer: IntakeAnswer = {
            ...existingAnswer,
            reflection: data.reflection,
          };
          newMap.set(questionId, updatedAnswer);
          return newMap;
        });

        // Save progress to Redis (graceful - don't block UX on failure)
        // We know the answer exists and has the reflection now
        // Save display text (not raw values) so /ops shows full option labels
        if (sessionId) {
          saveIntakeProgress(
            sessionId,
            questionId,
            submittingQuestion.prompt,
            resolveAnswerDisplayText(answer, submittingQuestion),
            data.reflection,
          ).catch((err) => {
            console.error("Failed to save intake progress to Redis:", err);
            // Continue - persistence failure shouldn't block user
          });
        }

        // OPTIMIZATION: Start early completion generation after Q8 (index 7)
        // Only if this was actually Q8 and we have 9 total questions
        if (submittingIndex === 7 && metadata.totalSteps === 9 && !isLast) {
          const completionPromise = fetch("/api/intake/completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intakeType: metadata.intakeType,
              answers: answersForApi,
            }),
          })
            .then((res) => res.json())
            .then((completionData) => completionData.completionOutputs)
            .catch((err) => {
              console.error("Early completion generation failed:", err);
              return null;
            });

          setEarlyCompletionPromise(completionPromise);
        }

        // Handle completion (only if this was the last question)
        if (data.isComplete && isLast) {
          setStatus("generating_completion");

          // Check if we have early completion ready
          let finalOutputs: {
            personalizedBrief: string;
            firstSessionGuide: string;
            experiments: string[];
          } | null;

          if (earlyCompletionPromise) {
            const outputs = await earlyCompletionPromise;
            finalOutputs = outputs || data.completionOutputs;
          } else {
            finalOutputs = data.completionOutputs;
          }

          setCompletion({ outputs: finalOutputs });

          // Save completion to Redis (graceful - don't block UX on failure)
          if (sessionId && finalOutputs) {
            saveIntakeCompletion(sessionId, finalOutputs).catch((err) => {
              console.error("Failed to save intake completion to Redis:", err);
              // Continue - persistence failure shouldn't block user
            });
          }

          setStatus("complete");
          setTimeout(() => triggerConfetti(), 300);
        }
        // Note: No else branch needed - we already incremented answeredCount optimistically
      } catch (err) {
        // On error, keep the user on the current question but show error
        setError(err instanceof Error ? err.message : "Failed to submit answer");
        // Don't revert answeredCount - let user retry from current position
      }
    },
    [
      metadata,
      currentQuestion,
      answeredCount,
      isLastQuestion,
      answers,
      earlyCompletionPromise,
      sessionId,
    ],
  );

  return {
    metadata,
    status,
    error,
    answeredCount,
    answers,
    messages,
    currentQuestion,
    isLastQuestion,
    completion,
    sessionId,
    submitAnswer,
  };
}
