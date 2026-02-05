"use client";

/**
 * Refactored IntakeForm - Simplified using hooks and components
 * Reduced from ~800 lines to ~150 lines by extracting:
 * - Pure utility functions to intake-utils.ts
 * - Input state management to useIntakeInput hook
 * - Main state management to useIntakeForm hook
 * - UI rendering to presentational components
 */

import { Card, CardContent, Skeleton } from "@cw-hackathon/ui";
import { IntakeChatSection } from "./components/IntakeChatSection";
import { IntakeCompletionSection } from "./components/IntakeCompletionSection";
import { IntakeFormSection } from "./components/IntakeFormSection";
import { IntakeHeader } from "./components/IntakeHeader";
import { IntakeValueProposition } from "./components/IntakeValueProposition";
import { useIntakeForm } from "./hooks/useIntakeForm";
import { useIntakeInput } from "./hooks/useIntakeInput";
import { buildAnswerPayload } from "./intake-utils";

export function IntakeForm() {
  // Use custom hooks (all state logic extracted!)
  const {
    metadata,
    flow,
    messages,
    currentQuestion,
    isLastQuestion,
    completion,
    sessionId,
    submitAnswer,
  } = useIntakeForm("therapy_readiness");

  const input = useIntakeInput(currentQuestion);

  // Handle form submission (no useEffect needed!)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentQuestion || !input.isValid || !metadata) return;

    const answer = buildAnswerPayload(currentQuestion, input.input);
    await submitAnswer(currentQuestion.id, answer);

    // Reset form after successful submit
    input.resetInput();
  };

  // Loading state
  if (flow.status === "loading") {
    return (
      <div className="flex flex-col gap-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Card className="border-border/50">
          <CardContent className="py-8 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (flow.status === "error") {
    return (
      <div className="flex flex-col gap-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <p className="text-sm text-destructive text-center">{flow.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metadata) return null;

  const isGeneratingCompletion = flow.status === "generating_completion";
  const isComplete = flow.status === "complete";
  const showQuestionForm = currentQuestion && !isGeneratingCompletion && !isComplete;
  const showValueProp = !isComplete && !isGeneratingCompletion && messages.length === 1;
  const showProgress = !isComplete && !isGeneratingCompletion;

  return (
    <div className="flex flex-col gap-8">
      {/* Header with progress */}
      <IntakeHeader
        name={metadata.name}
        description={metadata.description}
        currentStep={flow.currentStep}
        totalSteps={metadata.totalSteps}
        showProgress={showProgress}
      />

      {/* Value Proposition (shown before first answer) */}
      {showValueProp && <IntakeValueProposition />}

      {/* Chat Messages */}
      <IntakeChatSection
        messages={messages}
        currentQuestion={currentQuestion}
        state={flow.status}
        totalSteps={metadata.totalSteps}
      />

      {/* Completion Waiting/Ready State */}
      {(isGeneratingCompletion || isComplete) && (
        <IntakeCompletionSection
          status={isComplete ? "ready" : "waiting"}
          outputs={completion?.outputs ?? null}
          sessionId={sessionId}
        />
      )}

      {/* Current Question Form */}
      {showQuestionForm && (
        <IntakeFormSection
          question={currentQuestion}
          currentStep={flow.currentStep}
          input={input.input}
          onTextChange={input.setTextInput}
          onOptionToggle={(opt) => input.toggleOption(opt, currentQuestion.type === "singleselect")}
          onOtherTextChange={input.setOtherText}
          onSubmit={handleSubmit}
          isValid={input.isValid}
          isSubmitting={flow.status === "submitting"}
          error={flow.error}
        />
      )}
    </div>
  );
}
