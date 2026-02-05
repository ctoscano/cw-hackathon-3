import { defineCommand } from "citty";
import { dapCommand } from "./commands/dap/index.js";
import { helloCommand } from "./commands/hello.js";
import { intakeCommand } from "./commands/intake/index.js";
import { setupCommand } from "./commands/setup.js";

export const main = defineCommand({
  meta: {
    name: "data-cli",
    version: "0.0.0",
    description: "CW Hackathon data CLI tool",
  },
  subCommands: {
    hello: helloCommand,
    dap: dapCommand,
    intake: intakeCommand,
    setup: setupCommand,
  },
});

// Re-export library modules for use in web app
export * from "./lib/ai/client.js";
export * from "./lib/ai/models.js";
export * from "./lib/ai/providers/index.js";
export * from "./lib/ai/schemas.js";
export * from "./lib/ai/weave.js";
export * from "./lib/ai/intake-schemas.js";
export * from "./lib/prompts/loader.js";
export * from "./lib/prompts/builder.js";
export * from "./lib/intake/index.js";
export * from "./lib/utils/file.js";
