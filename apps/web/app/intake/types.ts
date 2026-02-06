/**
 * Shared type definitions for the intake flow
 */

export interface IntakeOption {
  text: string;
  value: string;
  isOther?: boolean;
}

export interface IntakeQuestion {
  id: string;
  prompt: string;
  type: "text" | "multiselect" | "singleselect";
  options?: IntakeOption[] | string[]; // Support both new and legacy formats
  examples?: string[];
}

export interface IntakeAnswer {
  questionId: string;
  questionPrompt: string;
  answer: string | string[];
  reflection: string;
}

export interface IntakeStartResponse {
  intakeType: string;
  name: string;
  description: string;
  totalSteps: number;
  firstQuestion: IntakeQuestion;
  allQuestions: IntakeQuestion[];
}

export interface IntakeStepResponse {
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

export type IntakeState =
  | "loading"
  | "ready"
  | "submitting"
  | "generating_completion"
  | "complete"
  | "error";
