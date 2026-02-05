import { type AIResult, generateStructuredOutput } from "../ai/client.js";
import {
  type IntakeAnswer,
  type IntakeCompletionOutputs,
  IntakeCompletionOutputsSchema,
  type IntakeQuestion,
  IntakeReflectionSchema,
  type IntakeStepRequest,
  type IntakeStepResponse,
} from "../ai/intake-schemas.js";
import { type BuiltPrompt, buildPrompt } from "../prompts/builder.js";
import { getIntakeDefinition, getQuestionByIndex, getTotalSteps } from "./definitions.js";

/**
 * Format a user's answer for display in prompts
 */
function formatAnswer(answer: string | string[]): string {
  if (Array.isArray(answer)) {
    return answer.map((a) => `- ${a}`).join("\n");
  }
  return answer;
}

/**
 * Format prior answers as context for the reflection prompt
 */
function formatPriorContext(priorAnswers: IntakeAnswer[]): string {
  if (priorAnswers.length === 0) {
    return "This is the first question - no prior context.";
  }

  return priorAnswers
    .map(
      (a, i) =>
        `Question ${i + 1}: ${a.questionPrompt}\nAnswer: ${formatAnswer(a.answer)}\nReflection: ${a.reflection}`,
    )
    .join("\n\n");
}

/**
 * Format all answers for the completion prompt
 */
function formatAllAnswers(answers: IntakeAnswer[]): string {
  return answers
    .map(
      (a, i) =>
        `### Question ${i + 1}: ${a.questionPrompt}\n\n**Answer:** ${formatAnswer(a.answer)}\n\n**Reflection shown:** ${a.reflection}`,
    )
    .join("\n\n---\n\n");
}

/**
 * Build a prompt for generating a reflection after an answer
 */
export function buildReflectionPrompt(options: {
  question: IntakeQuestion;
  answer: string | string[];
  priorAnswers: IntakeAnswer[];
  stepIndex: number;
  totalSteps: number;
  version?: string;
}): BuiltPrompt {
  const { question, answer, priorAnswers, stepIndex, totalSteps, version } = options;

  return buildPrompt({
    systemParts: ["intake/reflection-system.md"],
    userParts: ["intake/reflection-user.md"],
    variables: {
      questionNumber: String(stepIndex + 1),
      totalQuestions: String(totalSteps),
      questionPrompt: question.prompt,
      userAnswer: formatAnswer(answer),
      priorContext: formatPriorContext(priorAnswers),
    },
    saveToFile: false,
    outputPrefix: "intake-reflection",
    version,
  });
}

/**
 * Build a prompt for generating completion outputs
 */
export function buildCompletionPrompt(allAnswers: IntakeAnswer[], version?: string): BuiltPrompt {
  return buildPrompt({
    systemParts: ["intake/completion-system.md"],
    userParts: ["intake/completion-user.md"],
    variables: {
      allAnswers: formatAllAnswers(allAnswers),
    },
    saveToFile: false,
    outputPrefix: "intake-completion",
    version,
  });
}

/**
 * Generate a reflection for the current answer
 */
export async function generateReflection(options: {
  question: IntakeQuestion;
  answer: string | string[];
  priorAnswers: IntakeAnswer[];
  stepIndex: number;
  totalSteps: number;
  version?: string;
}): Promise<AIResult<string>> {
  const prompt = buildReflectionPrompt(options);

  const result = await generateStructuredOutput({
    schema: IntakeReflectionSchema,
    prompt: prompt.user,
    system: prompt.system,
    config: { model: "haiku" }, // Use haiku for fast, short reflections
  });

  return {
    data: result.data.reflection,
    telemetry: result.telemetry,
  };
}

/**
 * Generate completion outputs after all questions are answered
 */
export async function generateCompletionOutputs(
  allAnswers: IntakeAnswer[],
  version?: string,
): Promise<AIResult<IntakeCompletionOutputs>> {
  const prompt = buildCompletionPrompt(allAnswers, version);

  return generateStructuredOutput({
    schema: IntakeCompletionOutputsSchema,
    prompt: prompt.user,
    system: prompt.system,
    config: { model: "sonnet" }, // Use sonnet for more thoughtful completion outputs
  });
}

/**
 * Strip clinical intention from a question for client-facing use
 */
function sanitizeQuestionForClient(
  question: IntakeQuestion,
): Omit<IntakeQuestion, "clinicalIntention"> {
  const { clinicalIntention: _, ...sanitized } = question;
  return sanitized;
}

/**
 * Get reflection for a question - always uses LLM for personalized responses
 */
async function getReflectionForQuestion(options: {
  question: IntakeQuestion;
  answer: string | string[];
  priorAnswers: IntakeAnswer[];
  stepIndex: number;
  totalSteps: number;
  version?: string;
}): Promise<string> {
  // Always use LLM for personalized, context-aware reflections
  const reflectionResult = await generateReflection(options);
  return reflectionResult.data;
}

/**
 * Options for processing an intake step
 */
export interface ProcessIntakeStepOptions {
  request: IntakeStepRequest;
  version?: string;
}

/**
 * Process a single intake step
 *
 * This is the main orchestration function that:
 * 1. Validates the request
 * 2. Gets the current question
 * 3. Generates a reflection for the answer (strategy varies by question type)
 * 4. Determines the next question or completion
 * 5. Generates completion outputs if done
 */
export async function processIntakeStep(
  requestOrOptions: IntakeStepRequest | ProcessIntakeStepOptions,
): Promise<IntakeStepResponse> {
  // Handle both old signature (request) and new signature (options)
  const request = "request" in requestOrOptions ? requestOrOptions.request : requestOrOptions;
  const version = "request" in requestOrOptions ? requestOrOptions.version : undefined;

  const { intakeType, stepIndex, priorAnswers, currentAnswer } = request;

  // Validate intake exists
  const intake = getIntakeDefinition(intakeType);
  if (!intake) {
    throw new Error(`Unknown intake type: ${intakeType}`);
  }

  const totalSteps = getTotalSteps(intakeType);

  // Get current question
  const currentQuestion = getQuestionByIndex(intakeType, stepIndex);
  if (!currentQuestion) {
    throw new Error(`Invalid step index: ${stepIndex}`);
  }

  // Get reflection using appropriate strategy based on question type
  const reflection = await getReflectionForQuestion({
    question: currentQuestion,
    answer: currentAnswer,
    priorAnswers,
    stepIndex,
    totalSteps,
    version,
  });

  // Build the complete answer record
  const completeAnswer: IntakeAnswer = {
    questionId: currentQuestion.id,
    questionPrompt: currentQuestion.prompt,
    answer: currentAnswer,
    reflection,
  };

  // Determine if this is the last question
  const isComplete = stepIndex >= totalSteps - 1;

  if (isComplete) {
    // Generate completion outputs
    const allAnswers = [...priorAnswers, completeAnswer];
    const completionResult = await generateCompletionOutputs(allAnswers, version);

    return {
      reflection,
      nextQuestion: null,
      isComplete: true,
      completionOutputs: completionResult.data,
      metadata: {
        currentStep: stepIndex,
        totalSteps,
        intakeType,
        promptVersion: version,
      },
    };
  }

  // Get next question
  const nextQuestion = getQuestionByIndex(intakeType, stepIndex + 1);
  if (!nextQuestion) {
    throw new Error(`Failed to get next question at index ${stepIndex + 1}`);
  }

  return {
    reflection,
    nextQuestion: sanitizeQuestionForClient(nextQuestion),
    isComplete: false,
    completionOutputs: null,
    metadata: {
      currentStep: stepIndex,
      totalSteps,
      intakeType,
      promptVersion: version,
    },
  };
}

/**
 * Get the first question for an intake
 */
export function getFirstQuestion(
  intakeType: string,
): { question: Omit<IntakeQuestion, "clinicalIntention">; totalSteps: number } | null {
  const intake = getIntakeDefinition(intakeType);
  if (!intake || intake.questions.length === 0) {
    return null;
  }

  return {
    question: sanitizeQuestionForClient(intake.questions[0]),
    totalSteps: intake.questions.length,
  };
}

/**
 * Get intake metadata for display
 */
export function getIntakeMetadata(
  intakeType: string,
): { name: string; description: string; totalSteps: number } | null {
  const intake = getIntakeDefinition(intakeType);
  if (!intake) {
    return null;
  }

  return {
    name: intake.name,
    description: intake.description,
    totalSteps: intake.questions.length,
  };
}
