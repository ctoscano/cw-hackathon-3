/**
 * Pure utility functions for intake form logic
 * Extracted from intake-form.tsx to improve testability and reusability
 */

import type { IntakeAnswer } from "./types";

// Question type that matches the API shape
export interface Question {
  id: string;
  prompt: string;
  type: "text" | "multiselect" | "singleselect";
  options?: string[];
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
  | { id: string; type: "reflection"; content: string | null }; // null = loading

// Message ID generator
let messageIdCounter = 0;
export function generateMessageId(): string {
  return `msg-${++messageIdCounter}`;
}

/**
 * OPTION UTILITIES
 */

/**
 * Checks if an option represents an "Other" or "Something else" variant
 */
export function isOtherVariant(option: string): boolean {
  const lower = option.toLowerCase();
  return lower.includes("other") || lower.includes("something else");
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
  return question.options?.some(isOtherVariant) ?? false;
}

/**
 * ANSWER UTILITIES
 */

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
 * MESSAGE UTILITIES
 */

/**
 * Creates a question message for the chat
 */
export function createQuestionMessage(question: Question, questionNumber: number): ChatMessageItem {
  return {
    id: generateMessageId(),
    type: "question",
    questionNumber,
    question,
  };
}

/**
 * Creates an answer message for the chat
 */
export function createAnswerMessage(answer: string | string[]): ChatMessageItem {
  return {
    id: generateMessageId(),
    type: "answer",
    content: answer,
  };
}

/**
 * Creates a reflection message for the chat (with optional content)
 */
export function createReflectionMessage(content: string | null = null): ChatMessageItem {
  return {
    id: generateMessageId(),
    type: "reflection",
    content,
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
