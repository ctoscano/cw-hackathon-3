import { defineCommand } from "citty";
import { dapCommand } from "./commands/dap/index";
import { helloCommand } from "./commands/hello";
import { intakeCommand } from "./commands/intake/index";
import { setupCommand } from "./commands/setup";

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
export * from "./lib/ai/client";
export * from "./lib/ai/models";
export * from "./lib/ai/providers/index";
export * from "./lib/ai/schemas";
export * from "./lib/ai/weave";
export * from "./lib/ai/intake-schemas";
export * from "./lib/prompts/loader";
export * from "./lib/prompts/builder";
export * from "./lib/intake/index";
export * from "./lib/utils/file";
export * from "./lib/redis/archive";
