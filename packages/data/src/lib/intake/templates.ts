/**
 * Template-based reflections for multiselect questions
 *
 * These templates provide supportive, normalizing responses for questions
 * where the user selects from predefined options. This reduces LLM calls
 * while maintaining a warm, personalized feel.
 */

type TemplateSelector = (selectedOptions: string[]) => string;

/**
 * Q2: Which areas of your life feel most affected right now?
 */
const q2AreasAffectedTemplates: TemplateSelector = (selected) => {
  const count = selected.length;

  if (count === 1) {
    if (selected.includes("Something else")) {
      return "It's good that you're aware of what's affecting you, even if it doesn't fit neatly into categories.";
    }
    return "Focusing on one area can be a helpful starting point — it often connects to other parts of life in ways that become clearer over time.";
  }

  if (count >= 5) {
    return "When so many areas feel affected, it can be overwhelming. That's actually useful information — it suggests something deeper might be worth exploring.";
  }

  if (count >= 3) {
    return "It makes sense that these areas feel connected — they often influence each other in ways that aren't always obvious at first.";
  }

  // 2 areas
  return "These areas often go hand in hand. Understanding how they're connected can be a valuable part of the process.";
};

/**
 * Q4: What have you already tried to handle this on your own?
 */
const q4TriedAlreadyTemplates: TemplateSelector = (selected) => {
  if (selected.includes("Nothing yet")) {
    return "Not having tried anything yet is completely fine. Sometimes recognizing that something needs attention is the first and most important step.";
  }

  const count = selected.length;

  if (count >= 4) {
    return "You've put real effort into finding what works. When the usual approaches haven't been enough, it often means something different — not harder — might help.";
  }

  if (count >= 2) {
    return "The things you've tried aren't failures — they're useful information about what you need. Sometimes we learn as much from what doesn't work.";
  }

  // 1 item
  return "It's good that you've been trying to address this. What you've learned from that experience can inform what might help next.";
};

/**
 * Q7: What gives you pause or makes you unsure about starting therapy?
 */
const q7HesitationsTemplates: TemplateSelector = (selected) => {
  if (selected.includes("None of these - I'm mostly ready")) {
    return "It sounds like you've thought this through. Having clarity about being ready is a good foundation.";
  }

  const count = selected.length;

  // Check for specific combinations
  const hasPracticalConcerns =
    selected.includes("Cost or insurance concerns") || selected.includes("Time or scheduling");
  const hasEmotionalConcerns =
    selected.includes("Discomfort opening up to a stranger") ||
    selected.includes("Stigma or what others might think") ||
    selected.includes("Past negative experience with therapy");
  const hasUncertainty =
    selected.includes("Not knowing what to talk about") || selected.includes("Worry it won't help");

  if (count >= 4) {
    return "Having multiple concerns is completely normal — most people do. Naming them is actually an important part of making an informed decision.";
  }

  if (hasPracticalConcerns && !hasEmotionalConcerns && !hasUncertainty) {
    return "Practical concerns like these are real and worth factoring in. There are often more options than people realize.";
  }

  if (hasEmotionalConcerns && selected.includes("Past negative experience with therapy")) {
    return "A past experience that didn't work can make it harder to try again. That's understandable — and a different therapist or approach can make a real difference.";
  }

  if (hasEmotionalConcerns) {
    return "These feelings are common and make sense. Many people find that what felt uncomfortable at first becomes easier with the right fit.";
  }

  if (hasUncertainty) {
    return "Not being sure what to expect is normal. A good therapist can help you figure out what to focus on — you don't need to have it figured out beforehand.";
  }

  // Default for 1-3 items
  return "These concerns are worth thinking about. Most people have some hesitation — it's part of making a thoughtful decision.";
};

/**
 * Registry of template selectors by question ID
 */
export const multiselectTemplates: Record<string, TemplateSelector> = {
  q2_areas_affected: q2AreasAffectedTemplates,
  q4_tried_already: q4TriedAlreadyTemplates,
  q7_hesitations: q7HesitationsTemplates,
};

/**
 * Get a template-based reflection for a multiselect question
 */
export function getMultiselectReflection(
  questionId: string,
  selectedOptions: string[],
): string | null {
  const templateSelector = multiselectTemplates[questionId];
  if (!templateSelector) {
    return null;
  }
  return templateSelector(selectedOptions);
}

/**
 * Question IDs that should skip reflection entirely (singleselect at end of flow)
 */
export const skipReflectionQuestions = new Set(["q8_therapy_style", "q9_readiness"]);

/**
 * Check if a question should skip reflection
 */
export function shouldSkipReflection(questionId: string): boolean {
  return skipReflectionQuestions.has(questionId);
}

/**
 * Get a minimal transition message for skipped questions
 * These are brief, non-personalized acknowledgments
 */
export function getSkipReflectionMessage(questionId: string): string {
  switch (questionId) {
    case "q8_therapy_style":
      return "That's helpful to know — it can guide finding the right fit.";
    case "q9_readiness":
      return "Thank you for sharing where you're at.";
    default:
      return "";
  }
}
