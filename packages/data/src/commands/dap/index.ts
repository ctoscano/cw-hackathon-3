import { defineCommand } from "citty";
import { archiveCommand } from "./archive";
import { evaluateCommand } from "./evaluate";
import { generateCommand } from "./generate";
import { syntheticCommand } from "./synthetic";

export const dapCommand = defineCommand({
  meta: {
    name: "dap",
    description: "DAP (Data, Assessment, Plan) note generation and evaluation tools",
  },
  subCommands: {
    synthetic: syntheticCommand,
    generate: generateCommand,
    evaluate: evaluateCommand,
    archive: archiveCommand,
  },
});
