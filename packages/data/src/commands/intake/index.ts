import { defineCommand } from "citty";
import { evaluateCommand } from "./evaluate.js";
import { syntheticCommand } from "./synthetic.js";

export const intakeCommand = defineCommand({
  meta: {
    name: "intake",
    description: "Intake questionnaire generation and evaluation tools",
  },
  subCommands: {
    synthetic: syntheticCommand,
    evaluate: evaluateCommand,
  },
});
