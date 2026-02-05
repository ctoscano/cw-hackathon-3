import { defineCommand } from "citty";
import { archiveCommand } from "./archive.js";
import { evaluateCommand } from "./evaluate.js";
import { generateCommand } from "./generate.js";
import { syntheticCommand } from "./synthetic.js";

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
