/**
 * Pure utility functions for intake form logic
 * Extracted from intake-form.tsx to improve testability and reusability
 */

import type { IntakeAnswer, IntakeOption } from "./types";

// Question type that matches the API shape
export interface Question {
  id: string;
  prompt: string;
  type: "text" | "multiselect" | "singleselect";
  options?: string[] | IntakeOption[]; // Support both legacy and structured options
  examples?: string[];
}

// Form input state
export interface FormInput {
  textInput: string;
  selectedOptions: string[];
  otherText: string;
}

// Chat message types
export type ChatMessageItem =
  | { id: string; type: "question"; questionNumber: number; question: Question }
  | { id: string; type: "answer"; content: string | string[] }
  | { id: string; type: "reflection"; content: string | null; questionId?: string }; // null = loading

// Message ID generator (kept for backward compatibility)
let messageIdCounter = 0;
export function generateMessageId(): string {
  return `msg-${++messageIdCounter}`;
}

/**
 * Generate a stable message ID based on questionId and message type
 * This ensures React can correctly identify messages across re-renders
 */
export function generateStableMessageId(
  questionId: string,
  type: "question" | "answer" | "reflection",
): string {
  return `${type}-${questionId}`;
}

/**
 * OPTION UTILITIES
 */

/**
 * Get the value from an option (handles both string and IntakeOption)
 */
export function getOptionValue(option: string | IntakeOption): string {
  return typeof option === "string" ? option : option.value;
}

/**
 * Get the display text from an option (handles both string and IntakeOption)
 */
export function getOptionText(option: string | IntakeOption): string {
  return typeof option === "string" ? option : option.text;
}

/**
 * Checks if an option represents an "Other" or "Something else" variant
 * Handles both string (legacy) and IntakeOption (structured) formats
 */
export function isOtherVariant(option: string): boolean {
  const lower = option.toLowerCase();
  return lower.includes("other") || lower.includes("something else");
}

/**
 * Checks if a structured or string option is marked as "other"
 */
export function isOtherOption(option: string | IntakeOption): boolean {
  if (typeof option === "string") {
    return isOtherVariant(option);
  }
  return option.isOther === true;
}

/**
 * Extracts the custom text for an "Other" option if present
 */
export function extractOtherText(options: string[], otherText: string): string | undefined {
  const otherOption = options.find(isOtherVariant);
  if (otherOption && otherText.trim()) {
    return `${otherOption}: ${otherText.trim()}`;
  }
  return undefined;
}

/**
 * Checks if a question has an "Other" option
 */
export function hasOtherOption(question: Question): boolean {
  return (
    question.options?.some((opt) =>
      typeof opt === "string" ? isOtherVariant(opt) : opt.isOther === true,
    ) ?? false
  );
}

/**
 * ANSWER UTILITIES
 */

/**
 * Resolves answer values back to their display text using the question's options.
 * For multiselect/singleselect, maps values like "cost" to "Cost or insurance concerns".
 * For text answers or answers without matching options, returns the original answer.
 */
export function resolveAnswerDisplayText(
  answer: string | string[],
  question: Question,
): string | string[] {
  if (!Array.isArray(answer) || !question.options) return answer;

  return answer.map((value) => {
    const option = question.options?.find((opt) => getOptionValue(opt) === value);
    return option ? getOptionText(option) : value;
  });
}

/**
 * Builds the answer payload for API submission
 */
export function buildAnswerPayload(question: Question, input: FormInput): string | string[] {
  if (question.type === "text") {
    return input.textInput;
  }

  // For multiselect/singleselect with "Other" option
  const otherOption = input.selectedOptions.find(isOtherVariant);
  if (otherOption && input.otherText.trim()) {
    // Replace the "Other" option with the custom text
    return input.selectedOptions.map((opt) =>
      opt === otherOption ? `${otherOption}: ${input.otherText.trim()}` : opt,
    );
  }

  return input.selectedOptions;
}

/**
 * Validates whether the current input is valid for submission
 */
export function validateAnswer(question: Question, input: FormInput): boolean {
  if (question.type === "text") {
    return input.textInput.trim().length > 0;
  }

  // For multiselect/singleselect
  if (input.selectedOptions.length === 0) return false;

  // If any "Other" variant is selected, require the otherText field to be filled
  const hasOther = input.selectedOptions.some(isOtherVariant);
  if (hasOther && !input.otherText.trim()) {
    return false;
  }

  return true;
}

/**
 * LOADING MESSAGE UTILITIES
 */

/**
 * Get context-aware loading messages for a specific question
 * These messages appear while the reflection is being generated
 */
export function getLoadingMessagesForQuestion(questionId: string): string[] {
  const loadingMessages: Record<string, string[]> = {
    q1_considering_therapy: [
      "Thinking about your timing...",
      "Considering what brought you here...",
      "Reflecting on this moment...",
    ],
    q2_areas_affected: [
      "Noticing what's connected...",
      "Seeing the bigger picture...",
      "Tracking what's shifting...",
    ],
    q3_patterns: [
      "Looking at the pattern...",
      "Tracking what happens...",
      "Following the thread...",
    ],
    q4_tried_already: [
      "Looking at what you've learned...",
      "Thinking about what's worked...",
      "Considering your experience...",
    ],
    q5_worry_if_unchanged: [
      "Thinking about what matters...",
      "Considering the stakes...",
      "Looking ahead...",
    ],
    q6_hopes_for_therapy: [
      "Thinking about possibilities...",
      "Considering what could change...",
      "Looking at what matters to you...",
    ],
    q7_hesitations: [
      "Thinking through your questions...",
      "Considering what's uncertain...",
      "Making room for doubt...",
    ],
    q8_therapy_style: [
      "Thinking about what fits...",
      "Considering your preferences...",
      "Looking at what works for you...",
    ],
    q9_readiness: [
      "Checking in on where you are...",
      "Thinking about next steps...",
      "Considering your readiness...",
    ],
  };

  return (
    loadingMessages[questionId] || [
      "Reflecting...",
      "Considering your response...",
      "Gathering thoughts...",
    ]
  );
}

/**
 * MESSAGE UTILITIES
 *
 * All message creation functions now use stable IDs based on questionId.
 * This ensures React can correctly track message identity across re-renders,
 * preventing unnecessary DOM operations and animation glitches.
 */

/**
 * Creates a question message for the chat
 * Uses stable ID based on questionId
 */
export function createQuestionMessage(question: Question, questionNumber: number): ChatMessageItem {
  return {
    id: generateStableMessageId(question.id, "question"),
    type: "question",
    questionNumber,
    question,
  };
}

/**
 * Creates an answer message for the chat
 * Uses stable ID based on questionId (passed as parameter)
 */
export function createAnswerMessage(
  answer: string | string[],
  questionId?: string,
): ChatMessageItem {
  return {
    id: questionId ? generateStableMessageId(questionId, "answer") : generateMessageId(),
    type: "answer",
    content: answer,
  };
}

/**
 * Creates a reflection message for the chat (with optional content)
 * Uses stable ID based on questionId
 */
export function createReflectionMessage(
  content: string | null = null,
  questionId?: string,
): ChatMessageItem {
  return {
    id: questionId ? generateStableMessageId(questionId, "reflection") : generateMessageId(),
    type: "reflection",
    content,
    questionId,
  };
}

/**
 * Builds the complete message history from answers and current state
 */
export function buildMessagesFromAnswers(
  answers: IntakeAnswer[],
  currentQuestion: Question | null,
  currentStep: number,
): ChatMessageItem[] {
  const messages: ChatMessageItem[] = [];

  // Add all completed Q&A pairs with reflections
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const question = {
      id: answer.questionId,
      prompt: answer.questionPrompt,
      type: "text" as const, // We don't store type in IntakeAnswer
      options: undefined,
      examples: undefined,
    };

    messages.push(createQuestionMessage(question, i + 1));
    messages.push(createAnswerMessage(answer.answer));
    if (answer.reflection) {
      messages.push(createReflectionMessage(answer.reflection));
    }
  }

  // Add current question if present
  if (currentQuestion) {
    messages.push(createQuestionMessage(currentQuestion, currentStep + 1));
  }

  return messages;
}
