import { defineCommand } from "citty";
import { archiveCommand } from "./archive.js";
import { evaluateCommand } from "./evaluate.js";
import { syntheticCommand } from "./synthetic.js";
import { verifyCommand } from "./verify.js";

export const intakeCommand = defineCommand({
  meta: {
    name: "intake",
    description: "Intake questionnaire generation and evaluation tools",
  },
  subCommands: {
    synthetic: syntheticCommand,
    evaluate: evaluateCommand,
    archive: archiveCommand,
    verify: verifyCommand,
  },
});
