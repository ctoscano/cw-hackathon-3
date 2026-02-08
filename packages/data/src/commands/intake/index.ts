import { defineCommand } from "citty";
import { archiveCommand } from "./archive";
import { evaluateCommand } from "./evaluate";
import { syntheticCommand } from "./synthetic";
import { verifyCommand } from "./verify";

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
