import { defineCommand } from "citty";
import { helloCommand } from "./commands/hello.js";

export const main = defineCommand({
  meta: {
    name: "data-cli",
    version: "0.0.0",
    description: "CW Hackathon data CLI tool",
  },
  subCommands: {
    hello: helloCommand,
  },
});
