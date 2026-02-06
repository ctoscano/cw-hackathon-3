import type { IntakeDefinition } from "../ai/intake-schemas";

/**
 * Therapy Readiness Intake - "Is Therapy Right for Me?"
 *
 * A guided, step-by-step intake experience for adults considering therapy.
 * Helps users make informed, self-directed decisions about whether therapy
 * is worth trying, what kinds might fit them, and how it could help.
 *
 * This is educational and exploratory, not therapy itself.
 */
export const therapyReadinessIntake: IntakeDefinition = {
  id: "therapy_readiness",
  name: "Is Therapy Right for Me?",
  description:
    "A guided exploration to help you understand if therapy might be helpful right now, and how to make the most of it if you decide to try.",
  questions: [
    // Section 1: Orientation & Ambivalence
    {
      id: "q1_considering_therapy",
      prompt: "What's made you consider therapy at this point in your life?",
      type: "text",
      examples: [
        "I feel stuck and don't know why.",
        "Work stress is bleeding into everything.",
        "People close to me keep suggesting it.",
      ],
      clinicalIntention:
        "Elicits intrinsic and extrinsic motivation; opens space for ambivalence without pressure.",
    },

    // Section 2: Current Difficulty (non-pathologizing)
    {
      id: "q2_areas_affected",
      prompt: "Which areas of your life feel most affected right now?",
      type: "multiselect",
      options: [
        { text: "Work or career", value: "work" },
        { text: "Relationships", value: "relationships" },
        { text: "Stress or overwhelm", value: "stress" },
        { text: "Mood or motivation", value: "mood" },
        { text: "Identity or direction", value: "identity" },
        { text: "Health or energy", value: "health" },
        { text: "Something else", value: "other", isOther: true },
      ],
      clinicalIntention: "Identifies domains of impact without symptoms or diagnosis language.",
    },

    // Section 3: Pattern Awareness
    {
      id: "q3_patterns",
      prompt: "When this issue shows up, what tends to happen for you?",
      type: "text",
      examples: [
        "I overthink and avoid decisions.",
        "I push through until I burn out.",
        "I shut down or withdraw.",
      ],
      clinicalIntention:
        "Surfaces behavioral/emotional patterns (e.g., avoidance, overcontrol) without labeling.",
    },

    // Section 4: What's Been Tried
    {
      id: "q4_tried_already",
      prompt: "What have you already tried to handle this on your own?",
      type: "multiselect",
      options: [
        { text: "Talking to friends or family", value: "talking_to_friends" },
        { text: "Reading, podcasts, or online resources", value: "self_education" },
        { text: "Self-discipline or pushing harder", value: "self_discipline" },
        { text: "Ignoring it and hoping it passes", value: "ignoring" },
        { text: "Exercise or physical activity", value: "exercise" },
        { text: "Meditation or mindfulness apps", value: "mindfulness" },
        { text: "Nothing yet", value: "nothing_yet" },
        { text: "Something else", value: "other", isOther: true },
      ],
      clinicalIntention: "Reframes 'not working' strategies as data, not failure.",
    },

    // Section 5: Cost of Staying the Same
    {
      id: "q5_worry_if_unchanged",
      prompt: "If nothing changed over the next 6-12 months, what would worry you most?",
      type: "text",
      examples: [
        "I'd keep feeling exhausted.",
        "My relationship might suffer.",
        "I'd miss opportunities.",
      ],
      clinicalIntention: "Gently increases motivation by naming cost, without urgency or threat.",
    },

    // Section 6: Hopes (even vague)
    {
      id: "q6_hopes_for_therapy",
      prompt: "If therapy were helpful, what do you imagine might be different?",
      type: "text",
      examples: [
        "I'd feel less reactive.",
        "I'd understand myself better.",
        "I'd handle stress more skillfully.",
      ],
      clinicalIntention: "Elicits values and desired outcomes without promising change.",
    },

    // Section 7: Hesitations & Concerns
    {
      id: "q7_hesitations",
      prompt: "What gives you pause or makes you unsure about starting therapy?",
      type: "multiselect",
      options: [
        { text: "Cost or insurance concerns", value: "cost" },
        { text: "Time or scheduling", value: "time" },
        { text: "Not knowing what to talk about", value: "not_knowing" },
        { text: "Worry it won't help", value: "worry_ineffective" },
        { text: "Discomfort opening up to a stranger", value: "discomfort_opening_up" },
        { text: "Stigma or what others might think", value: "stigma" },
        { text: "Past negative experience with therapy", value: "past_negative" },
        { text: "Something else", value: "other", isOther: true },
        { text: "None of these - I'm mostly ready", value: "mostly_ready" },
      ],
      clinicalIntention: "Normalizes ambivalence; supports informed consent.",
    },

    // Section 8: Preference for Therapy Style
    {
      id: "q8_therapy_style",
      prompt: "If you did try therapy, what would you want it to feel like?",
      type: "singleselect",
      options: [
        {
          text: "Structured and practical - clear strategies and homework",
          value: "structured_practical",
        },
        {
          text: "Exploratory and reflective - understanding the deeper why",
          value: "exploratory_reflective",
        },
        { text: "Skills-focused - learning specific techniques to use", value: "skills_focused" },
        {
          text: "Relationship-focused - feeling truly heard and understood",
          value: "relationship_focused",
        },
        {
          text: "Not sure yet - I'd want to figure that out with a therapist",
          value: "not_sure",
        },
      ],
      clinicalIntention: "Supports fit and agency; aligns with third-wave and MFT models.",
    },

    // Section 9: Readiness Check
    {
      id: "q9_readiness",
      prompt: "Where are you right now in terms of trying therapy?",
      type: "singleselect",
      options: [
        { text: "Just exploring - curious but not ready to commit", value: "just_exploring" },
        {
          text: "Open but unsure - leaning toward trying but have questions",
          value: "open_unsure",
        },
        { text: "Ready to try - looking for the right fit", value: "ready" },
        { text: "Not the right time - helpful info but not now", value: "not_right_time" },
      ],
      clinicalIntention: "Allows a 'no' without shame; answers the core product question honestly.",
    },
  ],
};

/**
 * Registry of all available intake definitions
 */
export const intakeRegistry: Record<string, IntakeDefinition> = {
  therapy_readiness: therapyReadinessIntake,
};

/**
 * Get an intake definition by ID
 */
export function getIntakeDefinition(intakeType: string): IntakeDefinition | undefined {
  return intakeRegistry[intakeType];
}

/**
 * Get a specific question from an intake by step index
 */
export function getQuestionByIndex(
  intakeType: string,
  stepIndex: number,
): IntakeDefinition["questions"][number] | undefined {
  const intake = getIntakeDefinition(intakeType);
  if (!intake) return undefined;
  return intake.questions[stepIndex];
}

/**
 * Get the total number of questions in an intake
 */
export function getTotalSteps(intakeType: string): number {
  const intake = getIntakeDefinition(intakeType);
  return intake?.questions.length ?? 0;
}

/**
 * Get all questions for an intake (without clinical intentions)
 */
export function getAllQuestions(
  intakeType: string,
): Array<Omit<IntakeDefinition["questions"][number], "clinicalIntention">> | undefined {
  const intake = getIntakeDefinition(intakeType);
  if (!intake) return undefined;

  // Strip clinical intentions from all questions
  return intake.questions.map(({ clinicalIntention: _, ...question }) => question);
}
