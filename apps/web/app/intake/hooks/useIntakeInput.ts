/**
 * Hook for managing form input state for the current question
 * Consolidates textInput, selectedOptions, and otherText into a single object
 *
 * KEY ARCHITECTURE:
 * - Takes questionId (string) instead of question object for stability
 * - The question object reference can change on re-renders even for the same question
 * - Using questionId ensures input only resets when the actual question changes
 */

import { useEffect, useState } from "react";
import type { FormInput } from "../intake-utils";
import { isOtherVariant, validateAnswer } from "../intake-utils";
import type { IntakeQuestion } from "../types";

interface UseIntakeInputReturn {
  input: FormInput;
  setTextInput: (text: string) => void;
  setSelectedOptions: (options: string[]) => void;
  toggleOption: (option: string, isSingleSelect: boolean) => void;
  setOtherText: (text: string) => void;
  resetInput: () => void;
  isValid: boolean;
}

const EMPTY_INPUT: FormInput = {
  textInput: "",
  selectedOptions: [],
  otherText: "",
};

/**
 * Hook for managing form input state for a question
 * Automatically resets when the questionId changes (stable key)
 *
 * @param questionId - The stable question ID (not the question object)
 * @param question - The question object (for validation only)
 */
export function useIntakeInput(
  questionId: string | null,
  question: IntakeQuestion | null,
): UseIntakeInputReturn {
  const [input, setInput] = useState<FormInput>(EMPTY_INPUT);

  // Reset input when questionId changes (stable dependency)
  // biome-ignore lint/correctness/useExhaustiveDependencies: questionId is intentionally the only dependency - we want to reset input when question changes
  useEffect(() => {
    setInput(EMPTY_INPUT);
  }, [questionId]);

  const setTextInput = (text: string) => {
    setInput((prev) => ({ ...prev, textInput: text }));
  };

  const setSelectedOptions = (options: string[]) => {
    setInput((prev) => ({ ...prev, selectedOptions: options }));
  };

  const toggleOption = (option: string, isSingleSelect: boolean) => {
    setInput((prev) => {
      if (isSingleSelect) {
        // Single select: replace selection
        const newSelection = [option];
        // Clear otherText if switching away from "Other" variant
        const newOtherText = isOtherVariant(option) ? prev.otherText : "";
        return {
          ...prev,
          selectedOptions: newSelection,
          otherText: newOtherText,
        };
      }

      // Multi select: toggle
      const newSelection = prev.selectedOptions.includes(option)
        ? prev.selectedOptions.filter((o) => o !== option)
        : [...prev.selectedOptions, option];

      // Clear otherText if "Other" variant is deselected
      const newOtherText =
        isOtherVariant(option) && !newSelection.includes(option) ? "" : prev.otherText;

      return {
        ...prev,
        selectedOptions: newSelection,
        otherText: newOtherText,
      };
    });
  };

  const setOtherText = (text: string) => {
    setInput((prev) => ({ ...prev, otherText: text }));
  };

  const resetInput = () => {
    setInput(EMPTY_INPUT);
  };

  const isValid = question ? validateAnswer(question, input) : false;

  return {
    input,
    setTextInput,
    setSelectedOptions,
    toggleOption,
    setOtherText,
    resetInput,
    isValid,
  };
}
