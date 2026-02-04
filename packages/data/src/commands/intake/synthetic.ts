import { defineCommand } from "citty";
import { getIntakeDefinition, getTotalSteps } from "../../lib/intake/definitions.js";
import { saveJsonOutput, saveMarkdownOutput } from "../../lib/utils/file.js";

/**
 * Predefined synthetic intake scenarios for testing
 */
const SYNTHETIC_SCENARIOS = {
  ambivalent: {
    name: "Highly Ambivalent",
    description: "User uncertain about therapy, exploring options",
    answers: [
      "I'm not really sure why I'm here. My partner thinks I should try therapy but I'm not convinced it would help.",
      ["Relationships", "Mood or motivation"],
      "I tend to shut down and avoid conversations. Sometimes I just go along with things to avoid conflict.",
      ["Talking to friends or family", "Ignoring it and hoping it passes"],
      "I guess I worry things would stay the same - feeling disconnected and going through the motions.",
      "Honestly I'm not sure. Maybe feeling less stuck? But I don't know if therapy is the answer.",
      [
        "Worry it won't help",
        "Discomfort opening up to a stranger",
        "Not knowing what to talk about",
      ],
      "Not sure yet - I'd want to figure that out with a therapist",
      "Just exploring - curious but not ready to commit",
    ],
  },
  ready: {
    name: "Ready with Practical Concerns",
    description: "User clear on need, practical barriers",
    answers: [
      "Work stress has been building for months and it's affecting everything - my sleep, my relationships, my health. I know I need support.",
      ["Work or career", "Stress or overwhelm", "Health or energy"],
      "I push through until I burn out. I take on too much, say yes to everything, and then crash.",
      [
        "Self-discipline or pushing harder",
        "Exercise or physical activity",
        "Reading, podcasts, or online resources",
      ],
      "I'd probably burn out completely. I might lose my job or my relationship. Something has to change.",
      "I want to learn how to set boundaries without feeling guilty. I want to feel in control of my time again.",
      ["Cost or insurance concerns", "Time or scheduling"],
      "Structured and practical - clear strategies and homework",
      "Ready to try - looking for the right fit",
    ],
  },
  pastNegative: {
    name: "Past Negative Experience",
    description: "User tried therapy before without success",
    answers: [
      "I tried therapy a few years ago and it didn't really help. But things have gotten worse and I'm thinking maybe I should try again with someone different.",
      ["Mood or motivation", "Identity or direction", "Relationships"],
      "I overthink everything and get paralyzed by decisions. Then I beat myself up for not doing anything.",
      ["Meditation or mindfulness apps", "Reading, podcasts, or online resources"],
      "I'd keep feeling lost and unsure of who I am or what I want.",
      "I want to understand myself better. Why I get stuck in these patterns. Maybe feel more confident in my choices.",
      ["Past negative experience with therapy", "Worry it won't help"],
      "Exploratory and reflective - understanding the deeper why",
      "Open but unsure - leaning toward trying but have questions",
    ],
  },
  externalPressure: {
    name: "External Pressure",
    description: "User pushed by others, less personal motivation",
    answers: [
      "My family keeps telling me I need therapy. I guess I have been more irritable lately but I'm not sure it's that serious.",
      ["Relationships", "Stress or overwhelm"],
      "I get defensive and snap at people. Then I feel bad about it but I don't know how to stop.",
      ["Nothing yet"],
      "My relationships might suffer more. People might give up on me.",
      "Maybe I'd be less reactive. People wouldn't walk on eggshells around me.",
      [
        "Stigma or what others might think",
        "Not knowing what to talk about",
        "Discomfort opening up to a stranger",
      ],
      "Skills-focused - learning specific techniques to use",
      "Open but unsure - leaning toward trying but have questions",
    ],
  },
  notRightTime: {
    name: "Not The Right Time",
    description: "User exploring but deciding against therapy now",
    answers: [
      "I've been curious about therapy but honestly things aren't that bad. I just wanted to learn more about what it involves.",
      ["Something else"],
      "I sometimes feel overwhelmed but I usually manage to work through it on my own.",
      ["Talking to friends or family", "Exercise or physical activity"],
      "I think things would probably stay about the same, which is okay.",
      "Maybe having someone neutral to talk to? But I don't know if I need that right now.",
      ["Time or scheduling", "Cost or insurance concerns", "None of these - I'm mostly ready"],
      "Relationship-focused - feeling truly heard and understood",
      "Not the right time - helpful info but not now",
    ],
  },
};

type ScenarioType = keyof typeof SYNTHETIC_SCENARIOS;

export const syntheticCommand = defineCommand({
  meta: {
    name: "synthetic",
    description: "Generate synthetic intake questionnaire flows for testing",
  },
  args: {
    count: {
      type: "string",
      description: "Number of synthetic flows to generate",
      default: "1",
    },
    scenario: {
      type: "string",
      description: `Scenario type: ${Object.keys(SYNTHETIC_SCENARIOS).join(", ")}`,
      default: "ambivalent",
    },
    listScenarios: {
      type: "boolean",
      description: "List available scenarios and exit",
      alias: "l",
      default: false,
    },
  },
  async run({ args }) {
    if (args.listScenarios) {
      console.log("\n📋 Available Intake Scenarios:\n");
      for (const [key, scenario] of Object.entries(SYNTHETIC_SCENARIOS)) {
        console.log(`  ${key}`);
        console.log(`    Name: ${scenario.name}`);
        console.log(`    ${scenario.description}\n`);
      }
      return { success: true, scenarios: Object.keys(SYNTHETIC_SCENARIOS) };
    }

    const count = Number.parseInt(args.count, 10);
    const scenarioKey = args.scenario as ScenarioType;

    console.log("\n🧪 Synthetic Intake Generator\n");

    if (!SYNTHETIC_SCENARIOS[scenarioKey]) {
      console.error(`❌ Unknown scenario: ${scenarioKey}`);
      console.log(`   Available: ${Object.keys(SYNTHETIC_SCENARIOS).join(", ")}`);
      return { success: false, error: "Unknown scenario" };
    }

    const scenario = SYNTHETIC_SCENARIOS[scenarioKey];
    const intake = getIntakeDefinition("therapy_readiness");
    if (!intake) {
      console.error("❌ Intake definition not found");
      return { success: false, error: "Intake not found" };
    }

    const totalSteps = getTotalSteps("therapy_readiness");

    console.log(`📄 Scenario: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`🔢 Generating ${count} flow(s)...\n`);

    const generatedFlows = [];

    for (let i = 0; i < count; i++) {
      // Build the synthetic flow data
      const flow = {
        scenario: scenarioKey,
        scenarioName: scenario.name,
        scenarioDescription: scenario.description,
        intakeType: "therapy_readiness",
        intakeName: intake.name,
        totalSteps,
        answers: intake.questions.map((q, idx) => ({
          stepIndex: idx,
          questionId: q.id,
          questionPrompt: q.prompt,
          questionType: q.type,
          answer: scenario.answers[idx],
        })),
        generatedAt: new Date().toISOString(),
      };

      // Save as JSON
      const jsonPath = saveJsonOutput("intake/synthetic", `intake-synthetic-${scenarioKey}`, flow);

      // Save as Markdown for readability
      const mdContent = formatFlowAsMarkdown(flow, intake.questions);
      const mdPath = saveMarkdownOutput(
        "intake/synthetic",
        `intake-synthetic-${scenarioKey}`,
        mdContent,
      );

      generatedFlows.push({ json: jsonPath, markdown: mdPath });

      console.log(`✅ Generated flow ${i + 1}:`);
      console.log(`   JSON: ${jsonPath}`);
      console.log(`   Markdown: ${mdPath}`);
    }

    console.log("\n💡 Next steps:");
    console.log("   1. Review the synthetic flow in the markdown file");
    console.log("   2. Run `intake evaluate` to evaluate intake quality");
    console.log("   3. Or test via web: http://localhost:3000/intake");

    return {
      success: true,
      count,
      scenario: scenarioKey,
      files: generatedFlows,
    };
  },
});

function formatFlowAsMarkdown(
  flow: {
    scenario: string;
    scenarioName: string;
    scenarioDescription: string;
    intakeType: string;
    intakeName: string;
    totalSteps: number;
    answers: Array<{
      stepIndex: number;
      questionId: string;
      questionPrompt: string;
      questionType: string;
      answer: string | string[];
    }>;
    generatedAt: string;
  },
  questions: Array<{ id: string; prompt: string; clinicalIntention?: string }>,
): string {
  const lines = [
    `# Synthetic Intake Flow: ${flow.scenarioName}`,
    "",
    `**Generated**: ${flow.generatedAt}`,
    `**Scenario**: ${flow.scenario}`,
    `**Description**: ${flow.scenarioDescription}`,
    `**Intake Type**: ${flow.intakeName}`,
    `**Total Steps**: ${flow.totalSteps}`,
    "",
    "---",
    "",
    "## Question & Answer Flow",
    "",
  ];

  for (const answer of flow.answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    const formattedAnswer = Array.isArray(answer.answer)
      ? answer.answer.map((a) => `- ${a}`).join("\n")
      : answer.answer;

    lines.push(`### Question ${answer.stepIndex + 1}: ${answer.questionPrompt}`);
    lines.push("");
    lines.push(`**Type**: ${answer.questionType}`);
    if (question?.clinicalIntention) {
      lines.push(`**Clinical Intention**: ${question.clinicalIntention}`);
    }
    lines.push("");
    lines.push("**Answer**:");
    lines.push(formattedAnswer);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("");
  lines.push("*This is synthetic test data for intake questionnaire evaluation.*");

  return lines.join("\n");
}
